use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// Completed agents older than this are hidden from the HUD.
const COMPLETED_KEEP_MS: u64 = 45 * 60 * 1000;
/// Absolute max age for any agent (running/waiting/completed).
const MAX_AGE_MS: u64 = 12 * 60 * 60 * 1000;

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
    /// Display / fingerprint clock (mtime + small content tag).
    pub updated_at: u64,
    /// Raw filesystem mtime — used for dismiss / revive only.
    pub mtime_ms: u64,
}

pub fn scan_cursor_agents() -> Result<Vec<CursorAgentSnapshot>, String> {
    let home = dirs_home()?;
    let projects_root = home.join(".cursor").join("projects");
    if !projects_root.is_dir() {
        return Ok(vec![]);
    }

    let mut by_task: HashMap<String, CursorAgentSnapshot> = HashMap::new();

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
                let key = snapshot.task_id.clone();
                match by_task.get(&key) {
                    Some(existing) if existing.mtime_ms >= snapshot.mtime_ms => {}
                    _ => {
                        by_task.insert(key, snapshot);
                    }
                }
            }
        }
    }

    let mut agents: Vec<_> = by_task.into_values().collect();
    agents.sort_by(|a, b| b.mtime_ms.cmp(&a.mtime_ms));
    Ok(agents)
}

fn parse_transcript(
    path: &Path,
    project_slug: &str,
    session_id: &str,
) -> Result<Option<CursorAgentSnapshot>, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let mtime_ms = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);
    let age_ms = now_ms.saturating_sub(mtime_ms);
    if age_ms > MAX_AGE_MS {
        return Ok(None);
    }

    let file = fs::File::open(path).map_err(|error| error.to_string())?;
    let reader = BufReader::new(file);
    let mut title: Option<String> = None;
    let mut last_role: Option<String> = None;
    let mut reply_preview: Option<String> = None;
    let mut last_assistant_text: Option<String> = None;
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
            continue;
        }

        if let Some(role) = value.get("role").and_then(|v| v.as_str()) {
            last_role = Some(role.to_string());
            saw_turn_ended = false;
            if role == "assistant" {
                if let Some(full) = extract_assistant_text(&value) {
                    last_assistant_text = Some(full.clone());
                    reply_preview = Some(full.chars().take(80).collect());
                } else if let Some(preview) = extract_assistant_reply(&value) {
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

    // Glow / status semantics:
    // - running  = agent in progress (user just spoke, or assistant still working)
    // - waiting  = agent paused and needs user input (permission / choice / question)
    // - completed = assistant finished a turn and is not asking for input
    let paused = saw_turn_ended || age_ms >= 8_000;
    let awaiting_user = paused && reply_awaits_user(last_assistant_text.as_deref());
    let status = match last_role.as_deref() {
        Some("user") => "running",
        Some("assistant") if awaiting_user => "waiting",
        Some("assistant") if saw_turn_ended || age_ms >= 35_000 => "completed",
        Some("assistant") => "running",
        _ if saw_turn_ended => "completed",
        _ => "running",
    };

    if status == "completed" && age_ms > COMPLETED_KEEP_MS {
        return Ok(None);
    }

    let title = title
        .unwrap_or_else(|| {
            let project_name = project_slug.rsplit('-').next().unwrap_or(project_slug);
            format!("Cursor agent · {project_name}")
        })
        .chars()
        .take(72)
        .collect::<String>();

    if is_noise_title(&title) {
        return Ok(None);
    }

    let project_name = project_slug
        .rsplit('-')
        .next()
        .unwrap_or(project_slug)
        .to_string();
    let project_path = slug_to_workspace_path(project_slug);

    let activity = match status {
        "waiting" => Some(
            reply_preview
                .clone()
                .unwrap_or_else(|| "Needs your input…".into()),
        ),
        "running" => reply_preview
            .clone()
            .or_else(|| Some("Working…".into())),
        _ => reply_preview,
    };

    let content_tag = format!(
        "{}|{}|{}",
        status,
        title,
        activity.as_deref().unwrap_or("")
    );
    let content_bump = content_tag.bytes().fold(0u64, |acc, b| {
        acc.wrapping_mul(16777619).wrapping_add(u64::from(b))
    }) % 997;

    Ok(Some(CursorAgentSnapshot {
        task_id: format!("cursor:{session_id}"),
        title,
        project_name,
        project_path,
        transcript_path: path.display().to_string(),
        status: status.to_string(),
        activity,
        updated_at: mtime_ms.saturating_add(content_bump),
        mtime_ms,
    }))
}

fn is_noise_title(title: &str) -> bool {
    let lower = title.to_ascii_lowercase();
    lower.starts_with("briefly inform the user")
        || lower.starts_with("you are the")
        || lower.starts_with("don't mention")
        || lower.starts_with("your primary goal")
        || lower.starts_with("this is an image")
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
                && !line.starts_with("Briefly inform the user")
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

fn extract_assistant_text(value: &serde_json::Value) -> Option<String> {
    let content = value.pointer("/message/content")?.as_array()?;
    for item in content.iter().rev() {
        if item.get("type").and_then(|v| v.as_str()) != Some("text") {
            continue;
        }
        let text = item.get("text").and_then(|v| v.as_str())?;
        let trimmed = collapse_whitespace(text);
        if !trimmed.is_empty() && !trimmed.to_ascii_lowercase().starts_with("briefly inform") {
            return Some(trimmed.chars().take(400).collect());
        }
    }
    None
}

fn extract_assistant_reply(value: &serde_json::Value) -> Option<String> {
    if let Some(text) = extract_assistant_text(value) {
        return Some(text.chars().take(80).collect());
    }
    let content = value.pointer("/message/content")?.as_array()?;
    for item in content.iter().rev() {
        if item.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("tool");
            return Some(format!("Using {name}…"));
        }
    }
    None
}

/// True when the assistant's latest text is clearly waiting on the user.
fn reply_awaits_user(text: Option<&str>) -> bool {
    let Some(text) = text.map(str::trim).filter(|t| !t.is_empty()) else {
        return false;
    };
    let lower = text.to_ascii_lowercase();
    const PHRASES: &[&str] = &[
        "waiting on your",
        "waiting for your",
        "waiting for you",
        "needs your",
        "do you want",
        "would you like",
        "should i ",
        "shall i ",
        "let me know",
        "your ok",
        "your okay",
        "approve",
        "grant permission",
        "needs permission",
        "choose one",
        "pick one",
        "select one",
        "which option",
        "which one",
        "before i continue",
        "reply with",
        "tell me which",
        "please confirm",
    ];
    if PHRASES.iter().any(|phrase| lower.contains(phrase)) {
        return true;
    }
    text.ends_with('?')
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
    }

    #[test]
    fn detects_user_input_prompts() {
        assert!(reply_awaits_user(Some(
            "Waiting on your OK for this layout, then I'll continue."
        )));
        assert!(reply_awaits_user(Some("Which option should I use?")));
        assert!(!reply_awaits_user(Some(
            "Implemented the API domain layer with local JWT auth."
        )));
        assert!(!reply_awaits_user(Some("Using AwaitShell…")));
    }
}
