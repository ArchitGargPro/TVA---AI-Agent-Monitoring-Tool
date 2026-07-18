use serde::Serialize;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// If the transcript hasn't been written recently and the last role is assistant,
/// treat the turn as finished so the HUD shows a reply preview instead of "running".
const IDLE_COMPLETE_MS: u64 = 35_000;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CursorAgentSnapshot {
    pub task_id: String,
    pub title: String,
    pub project_name: String,
    pub project_path: Option<String>,
    pub transcript_path: String,
    pub status: String,
    pub activity: Option<String>,
    pub updated_at: u64,
}

pub fn scan_cursor_agents() -> Result<Vec<CursorAgentSnapshot>, String> {
    let home = dirs_home()?;
    let projects_root = home.join(".cursor").join("projects");
    if !projects_root.is_dir() {
        return Ok(vec![]);
    }

    let mut agents = Vec::new();

    let project_entries = fs::read_dir(&projects_root).map_err(|error| error.to_string())?;
    for project_entry in project_entries.flatten() {
        let project_dir = project_entry.path();
        if !project_dir.is_dir() {
            continue;
        }
        let project_slug = project_entry.file_name().to_string_lossy().to_string();
        let transcripts_root = project_dir.join("agent-transcripts");
        if !transcripts_root.is_dir() {
            continue;
        }

        let session_dirs = fs::read_dir(&transcripts_root).map_err(|error| error.to_string())?;
        for session_entry in session_dirs.flatten() {
            let session_dir = session_entry.path();
            if !session_dir.is_dir() {
                continue;
            }
            let session_id = session_entry.file_name().to_string_lossy().to_string();
            let transcript = session_dir.join(format!("{session_id}.jsonl"));
            if !transcript.is_file() {
                continue;
            }

            if let Some(snapshot) = parse_transcript(&transcript, &project_slug, &session_id)? {
                agents.push(snapshot);
            }
        }
    }

    agents.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(agents)
}

fn parse_transcript(
    path: &Path,
    project_slug: &str,
    session_id: &str,
) -> Result<Option<CursorAgentSnapshot>, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let updated_at = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);
    let age_ms = now_ms.saturating_sub(updated_at);
    let recent = age_ms < 48 * 60 * 60 * 1000;

    let file = fs::File::open(path).map_err(|error| error.to_string())?;
    let reader = BufReader::new(file);
    let mut title: Option<String> = None;
    let mut last_role: Option<String> = None;
    let mut reply_preview: Option<String> = None;
    let mut line_count = 0usize;
    let mut saw_turn_ended = false;

    for line in reader.lines() {
        let line = line.map_err(|error| error.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        line_count += 1;
        let value: serde_json::Value =
            serde_json::from_str(&line).map_err(|error| error.to_string())?;

        if value.get("type").and_then(|v| v.as_str()) == Some("turn_ended") {
            saw_turn_ended = true;
            // Do not force status yet — later user/assistant lines may reopen the turn.
            continue;
        }

        if let Some(role) = value.get("role").and_then(|v| v.as_str()) {
            last_role = Some(role.to_string());
            saw_turn_ended = false;
            if role == "assistant" {
                if let Some(preview) = extract_assistant_reply(&value) {
                    reply_preview = Some(preview);
                }
            }
            if role == "user" {
                if let Some(next_title) = extract_user_title(&value) {
                    title = Some(next_title);
                }
            }
        }
    }

    if line_count == 0 {
        return Ok(None);
    }

    let status = match last_role.as_deref() {
        Some("user") => "waiting",
        Some("assistant") if saw_turn_ended || age_ms >= IDLE_COMPLETE_MS => "completed",
        Some("assistant") => "running",
        _ if saw_turn_ended => "completed",
        _ => "running",
    };

    if !recent && status == "completed" {
        return Ok(None);
    }

    let project_name = project_slug
        .rsplit('-')
        .next()
        .unwrap_or(project_slug)
        .to_string();
    let project_path = slug_to_workspace_path(project_slug);

    let activity = match status {
        "waiting" => Some("Waiting…".into()),
        "running" => reply_preview
            .clone()
            .or_else(|| Some("Working…".into())),
        _ => reply_preview,
    };

    // Fold content into updated_at so HUD refreshes when preview text changes
    // even if filesystem mtime is unchanged for a moment.
    let content_tag = format!(
        "{}|{}|{}",
        status,
        title.as_deref().unwrap_or(""),
        activity.as_deref().unwrap_or("")
    );
    let content_bump = content_tag.bytes().fold(0u64, |acc, b| {
        acc.wrapping_mul(16777619).wrapping_add(u64::from(b))
    }) % 997;
    let updated_at = updated_at.saturating_add(content_bump);

    Ok(Some(CursorAgentSnapshot {
        task_id: format!("cursor:{session_id}"),
        title: title
            .unwrap_or_else(|| format!("Cursor agent · {project_name}"))
            .chars()
            .take(72)
            .collect(),
        project_name,
        project_path,
        transcript_path: path.display().to_string(),
        status: status.to_string(),
        activity,
        updated_at,
    }))
}

fn extract_user_title(value: &serde_json::Value) -> Option<String> {
    let text = value.pointer("/message/content/0/text")?.as_str()?;

    let focus = if let (Some(start), Some(end)) =
        (text.find("<user_query>"), text.find("</user_query>"))
    {
        &text[start + "<user_query>".len()..end]
    } else {
        text
    };

    first_meaningful_line(focus)
}

fn first_meaningful_line(text: &str) -> Option<String> {
    let cleaned = text
        .replace("<timestamp>", " ")
        .replace("</timestamp>", " ")
        .replace("<image_files>", " ")
        .replace("</image_files>", " ")
        .replace("<user_query>", " ")
        .replace("</user_query>", " ");

    cleaned
        .lines()
        .map(str::trim)
        .find(|line| {
            !line.is_empty()
                && !line.starts_with('<')
                && !line.starts_with("This is an image")
                && !line.starts_with("[Image]")
                && !line.starts_with("These images")
                && !line.starts_with("You are the")
                && !line.starts_with("Don't mention")
                && !line.starts_with("This repository")
                && !line.starts_with("Your primary goal")
                && !looks_like_url(line)
                && !looks_like_file_index(line)
        })
        .map(str::to_string)
}

fn looks_like_url(line: &str) -> bool {
    line.starts_with("http://") || line.starts_with("https://") || line.starts_with("www.")
}

fn looks_like_file_index(line: &str) -> bool {
    let mut chars = line.chars();
    matches!(chars.next(), Some('0'..='9')) && line.contains('/')
}

fn extract_assistant_reply(value: &serde_json::Value) -> Option<String> {
    let content = value.pointer("/message/content")?.as_array()?;
    for item in content.iter().rev() {
        if item.get("type").and_then(|v| v.as_str()) == Some("text") {
            if let Some(text) = item.get("text").and_then(|v| v.as_str()) {
                let trimmed = collapse_whitespace(text);
                if !trimmed.is_empty() {
                    return Some(trimmed.chars().take(80).collect());
                }
            }
        }
        if item.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("tool");
            return Some(format!("Using {name}…"));
        }
    }
    None
}

fn collapse_whitespace(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn slug_to_workspace_path(slug: &str) -> Option<String> {
    let parts: Vec<&str> = slug.split('-').collect();
    if parts.len() < 2 || parts[0] != "Users" {
        return None;
    }
    let path = PathBuf::from("/").join(parts.join("/"));
    if path.is_dir() {
        Some(path.display().to_string())
    } else {
        None
    }
}

fn dirs_home() -> Result<PathBuf, String> {
    if let Ok(home) = std::env::var("HOME") {
        return Ok(PathBuf::from(home));
    }
    Err("HOME is not set".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scans_local_cursor_agents() {
        let agents = scan_cursor_agents().expect("scan should succeed");
        eprintln!("found {} agents", agents.len());
        for agent in &agents {
            eprintln!(
                "{} | {} | {} | title={} | activity={:?}",
                agent.task_id, agent.status, agent.project_name, agent.title, agent.activity
            );
        }
        assert!(!agents.is_empty(), "expected at least one local Cursor agent");
    }
}
