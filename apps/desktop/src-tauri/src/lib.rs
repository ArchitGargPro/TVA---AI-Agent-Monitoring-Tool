use rusqlite::Connection;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

const APP_NAME: &str = "Mission Control";
const SCHEMA_VERSION: i64 = 1;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let path = database_path(app.handle())?;
            let connection = open_database(&path)?;
            app.manage(DbState {
                connection: Mutex::new(connection),
                path,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
