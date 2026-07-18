mod cursor_scan;
#[cfg(target_os = "macos")]
mod overlay;

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

const APP_NAME: &str = "MinuteControl";
const SCHEMA_VERSION: i64 = 1;
const SETTINGS_KEY: &str = "settings_json";
const DISMISSED_KEY: &str = "dismissed_agents_json";

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("{0}")]
    Message(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

struct DbState {
    connection: Mutex<Connection>,
    path: PathBuf,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    app_name: String,
    schema_version: i64,
    database_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistedSettings {
    launch_at_login: bool,
    show_in_menu_bar: bool,
    enable_demo_adapter: bool,
    theme: String,
    reduce_motion: bool,
}

impl Default for PersistedSettings {
    fn default() -> Self {
        Self {
            launch_at_login: false,
            show_in_menu_bar: true,
            enable_demo_adapter: false,
            theme: "system".into(),
            reduce_motion: false,
        }
    }
}

fn database_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app.path().app_data_dir().map_err(|error| {
        AppError::Message(format!("Failed to resolve app data directory: {error}"))
    })?;

    fs::create_dir_all(&dir).map_err(|error| {
        AppError::Message(format!("Failed to create app data directory: {error}"))
    })?;

    Ok(dir.join("mission-control.db"))
}

fn open_database(path: &PathBuf) -> Result<Connection, AppError> {
    let connection = Connection::open(path)
        .map_err(|error| AppError::Message(format!("Failed to open database: {error}")))?;

    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS app_meta (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
            ",
        )
        .map_err(|error| AppError::Message(format!("Failed to initialize schema: {error}")))?;

    connection
        .execute(
            "INSERT INTO app_meta (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            ("schema_version", SCHEMA_VERSION.to_string()),
        )
        .map_err(|error| AppError::Message(format!("Failed to write schema version: {error}")))?;

    Ok(connection)
}

fn read_schema_version(connection: &Connection) -> Result<i64, AppError> {
    connection
        .query_row(
            "SELECT value FROM app_meta WHERE key = ?1",
            ["schema_version"],
            |row| {
                let value: String = row.get(0)?;
                value.parse::<i64>().map_err(|error| {
                    rusqlite::Error::FromSqlConversionFailure(
                        0,
                        rusqlite::types::Type::Text,
                        Box::new(error),
                    )
                })
            },
        )
        .map_err(|error| AppError::Message(format!("Failed to read schema version: {error}")))
}

fn read_settings_json(connection: &Connection) -> Result<PersistedSettings, AppError> {
    let result: Result<String, rusqlite::Error> = connection.query_row(
        "SELECT value FROM app_meta WHERE key = ?1",
        [SETTINGS_KEY],
        |row| row.get(0),
    );

    match result {
        Ok(raw) => serde_json::from_str(&raw)
            .map_err(|error| AppError::Message(format!("Invalid settings JSON: {error}"))),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(PersistedSettings::default()),
        Err(error) => Err(AppError::Message(format!("Failed to read settings: {error}"))),
    }
}

fn write_settings_json(connection: &Connection, settings: &PersistedSettings) -> Result<(), AppError> {
    let raw = serde_json::to_string(settings)
        .map_err(|error| AppError::Message(format!("Failed to serialize settings: {error}")))?;
    connection
        .execute(
            "INSERT INTO app_meta (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (SETTINGS_KEY, raw),
        )
        .map_err(|error| AppError::Message(format!("Failed to write settings: {error}")))?;
    Ok(())
}

fn read_dismissed_agents(connection: &Connection) -> Result<Vec<String>, AppError> {
    let result: Result<String, rusqlite::Error> = connection.query_row(
        "SELECT value FROM app_meta WHERE key = ?1",
        [DISMISSED_KEY],
        |row| row.get(0),
    );
    match result {
        Ok(raw) => serde_json::from_str(&raw)
            .map_err(|error| AppError::Message(format!("Invalid dismissed agents JSON: {error}"))),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(vec![]),
        Err(error) => Err(AppError::Message(format!(
            "Failed to read dismissed agents: {error}"
        ))),
    }
}

fn write_dismissed_agents(connection: &Connection, task_ids: &[String]) -> Result<(), AppError> {
    let raw = serde_json::to_string(task_ids)
        .map_err(|error| AppError::Message(format!("Failed to serialize dismissed agents: {error}")))?;
    connection
        .execute(
            "INSERT INTO app_meta (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (DISMISSED_KEY, raw),
        )
        .map_err(|error| AppError::Message(format!("Failed to write dismissed agents: {error}")))?;
    Ok(())
}

#[tauri::command]
fn get_app_info(state: State<'_, DbState>) -> Result<AppInfo, AppError> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::Message("Database lock poisoned".into()))?;

    let schema_version = read_schema_version(&connection)?;

    Ok(AppInfo {
        app_name: APP_NAME.to_string(),
        schema_version,
        database_path: state.path.display().to_string(),
    })
}

#[tauri::command]
fn scan_cursor_agents() -> Result<Vec<cursor_scan::CursorAgentSnapshot>, AppError> {
    cursor_scan::scan_cursor_agents().map_err(AppError::Message)
}

#[tauri::command]
fn get_settings(state: State<'_, DbState>) -> Result<PersistedSettings, AppError> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::Message("Database lock poisoned".into()))?;
    read_settings_json(&connection)
}

#[tauri::command]
fn save_settings(
    state: State<'_, DbState>,
    settings: PersistedSettings,
) -> Result<PersistedSettings, AppError> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::Message("Database lock poisoned".into()))?;
    write_settings_json(&connection, &settings)?;
    Ok(settings)
}

#[tauri::command]
fn get_dismissed_agents(state: State<'_, DbState>) -> Result<Vec<String>, AppError> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::Message("Database lock poisoned".into()))?;
    read_dismissed_agents(&connection)
}

#[tauri::command]
fn save_dismissed_agents(
    state: State<'_, DbState>,
    task_ids: Vec<String>,
) -> Result<Vec<String>, AppError> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| AppError::Message("Database lock poisoned".into()))?;
    write_dismissed_agents(&connection, &task_ids)?;
    Ok(task_ids)
}

/// Activate Cursor, unminimize its windows if possible.
/// Specific agent-tab routing is not available without a Cursor public API.
#[tauri::command]
fn focus_app(app: String) -> Result<(), AppError> {
    let script = format!(
        r#"
tell application "{app}"
  activate
  try
    reopen
  end try
end tell
tell application "System Events"
  if exists process "{app}" then
    tell process "{app}"
      set frontmost to true
      try
        repeat with w in windows
          try
            set value of attribute "AXMinimized" of w to false
          end try
        end repeat
      end try
    end tell
  end if
end tell
"#
    );

    let status = std::process::Command::new("osascript")
        .args(["-e", &script])
        .status()
        .map_err(|error| AppError::Message(format!("Failed to focus {app}: {error}")))?;

    if !status.success() {
        std::process::Command::new("open")
            .args(["-a", &app])
            .status()
            .map_err(|error| AppError::Message(format!("Failed to open {app}: {error}")))?;
    }

    Ok(())
}

fn start_cursor_watch(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            match cursor_scan::scan_cursor_agents() {
                Ok(agents) => {
                    let _ = app.emit("cursor-agents", &agents);
                }
                Err(error) => {
                    eprintln!("cursor scan failed: {error}");
                }
            }

            // Re-assert always-on-top from the main thread only — AppKit crashes
            // if NSWindow level / visibility APIs are touched off the UI thread.
            if let Some(window) = app.get_webview_window("fidget") {
                if window.is_visible().unwrap_or(false) {
                    let app_for_main = app.clone();
                    let _ = app.run_on_main_thread(move || {
                        if let Some(window) = app_for_main.get_webview_window("fidget") {
                            let _ = window.set_always_on_top(true);
                            #[cfg(target_os = "macos")]
                            overlay::elevate_for_fullscreen(&window);
                        }
                    });
                }
            }

            std::thread::sleep(Duration::from_millis(1000));
        }
    });
}

fn position_fidget(app: &AppHandle) {
    let Some(window) = app.get_webview_window("fidget") else {
        return;
    };
    let Ok(Some(monitor)) = window.current_monitor() else {
        return;
    };

    let screen = monitor.size();
    let scale = monitor.scale_factor();
    let width = (480.0 * scale) as u32;
    let height = (360.0 * scale) as u32;
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));
    let margin = (24.0 * scale) as u32;
    let x = screen.width.saturating_sub(width + margin) as i32;
    let y = margin as i32;
    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
}

#[tauri::command]
fn show_fidget_window(app: AppHandle) -> Result<bool, AppError> {
    let Some(window) = app.get_webview_window("fidget") else {
        return Err(AppError::Message("Miss Minutes window missing".into()));
    };

    // Launching twice is a no-op when already visible.
    if window.is_visible().unwrap_or(false) {
        #[cfg(target_os = "macos")]
        overlay::elevate_for_fullscreen(&window);
        return Ok(false);
    }

    position_fidget(&app);
    let _ = window.set_always_on_top(true);
    let _ = window.set_visible_on_all_workspaces(true);
    window
        .show()
        .map_err(|error| AppError::Message(format!("Failed to show Miss Minutes: {error}")))?;
    #[cfg(target_os = "macos")]
    overlay::elevate_for_fullscreen(&window);
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
            }

            let path = database_path(app.handle())?;
            let connection = open_database(&path)?;
            app.manage(DbState {
                connection: Mutex::new(connection),
                path,
            });
            start_cursor_watch(app.handle().clone());
            position_fidget(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            scan_cursor_agents,
            focus_app,
            get_settings,
            save_settings,
            get_dismissed_agents,
            save_dismissed_agents,
            show_fidget_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
