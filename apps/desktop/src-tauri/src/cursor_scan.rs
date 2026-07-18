use serde::Serialize;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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
        let project_slug = project_entry
            .file_name()
            .to_string_lossy()
            .to_string();
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

    // Keep recently active sessions (12h) plus any still clearly running.
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0);
    let recent = now_ms.saturating_sub(updated_at) < 12 * 60 * 60 * 1000;

    let file = fs::File::open(path).map_err(|error| error.to_string())?;
    let reader = BufReader::new(file);
    let mut title: Option<String> = None;
    let mut last_role: Option<String> = None;
    let mut last_activity: Option<String> = None;
    let mut line_count = 0usize;

    for line in reader.lines() {
        let line = line.map_err(|error| error.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        line_count += 1;
        let value: serde_json::Value =
            serde_json::from_str(&line).map_err(|error| error.to_string())?;

        if value.get("type").and_then(|v| v.as_str()) == Some("turn_ended") {
            last_role = Some("ended".into());
            last_activity = value
                .get("status")
                .and_then(|v| v.as_str())
                .map(|status| format!("Turn ended ({status})"));
            continue;
        }

        if let Some(role) = value.get("role").and_then(|v| v.as_str()) {
            last_role = Some(role.to_string());
            if role == "assistant" {
                last_activity = extract_assistant_activity(&value).or(last_activity);
            }
            if title.is_none() && role == "user" {
                title = extract_user_title(&value);
            }
        }
    }

    if line_count == 0 {
        return Ok(None);
    }

    let status = match last_role.as_deref() {
        Some("ended") => "completed",
        Some("assistant") => "running",
        Some("user") => "waiting",
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

    Ok(Some(CursorAgentSnapshot {
        task_id: format!("cursor:{session_id}"),
        title: title
            .unwrap_or_else(|| format!("Cursor agent · {project_name}"))
            .chars()
            .take(80)
            .collect(),
        project_name,
        project_path,
        transcript_path: path.display().to_string(),
        status: status.to_string(),
        activity: last_activity,
        updated_at,
    }))
}

fn extract_user_title(value: &serde_json::Value) -> Option<String> {
    let text = value
        .pointer("/message/content/0/text")?
        .as_str()?;
    let cleaned = text
        .replace("<user_query>", " ")
        .replace("</user_query>", " ")
        .replace("<timestamp>", " ")
        .lines()
        .map(str::trim)
        .filter(|line| {
            !line.is_empty()
                && !line.starts_with('<')
                && !line.starts_with("This is an image")
                && !line.starts_with("[Image]")
        })
        .take(2)
        .collect::<Vec<_>>()
        .join(" ");
    if cleaned.is_empty() {
        None
    } else {
        Some(cleaned)
    }
}

fn extract_assistant_activity(value: &serde_json::Value) -> Option<String> {
    let content = value.pointer("/message/content")?.as_array()?;
    for item in content.iter().rev() {
        if item.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("tool");
            return Some(format!("Using {name}"));
        }
        if item.get("type").and_then(|v| v.as_str()) == Some("text") {
            if let Some(text) = item.get("text").and_then(|v| v.as_str()) {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    return Some(trimmed.chars().take(72).collect());
                }
            }
        }
    }
    None
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
