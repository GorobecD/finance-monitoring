use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DATA_FILE: &str = "neonfin-data.json";
const BACKUP_FILE: &str = "neonfin-data.backup.json";

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<String>, String> {
    let dir = data_dir(&app)?;
    for name in [DATA_FILE, BACKUP_FILE] {
        let p = dir.join(name);
        if let Ok(s) = fs::read_to_string(&p) {
            // fall back to backup if main file is corrupted
            if serde_json::from_str::<serde_json::Value>(&s).is_ok() {
                return Ok(Some(s));
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn save_data(app: AppHandle, data: String) -> Result<(), String> {
    serde_json::from_str::<serde_json::Value>(&data).map_err(|e| format!("invalid json: {e}"))?;
    let dir = data_dir(&app)?;
    let main = dir.join(DATA_FILE);
    let tmp = dir.join(format!("{DATA_FILE}.tmp"));
    // atomic write: tmp -> rename; keep previous version as backup
    fs::write(&tmp, data.as_bytes()).map_err(|e| e.to_string())?;
    if main.exists() {
        let _ = fs::copy(&main, dir.join(BACKUP_FILE));
    }
    fs::rename(&tmp, &main).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn data_path(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.join(DATA_FILE).to_string_lossy().into_owned())
}

#[tauri::command]
fn export_backup(app: AppHandle, data: String, filename: String) -> Result<String, String> {
    let safe: String = filename
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
        .collect();
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().document_dir())
        .map_err(|e| e.to_string())?;
    let p = dir.join(if safe.is_empty() { "neonfin-backup.json".into() } else { safe });
    fs::write(&p, data.as_bytes()).map_err(|e| e.to_string())?;
    Ok(p.to_string_lossy().into_owned())
}

/// Only the NBU rates endpoint is allowed — the webview can't call arbitrary URLs through this.
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    if !url.starts_with("https://bank.gov.ua/") {
        return Err("host not allowed".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        ureq::get(&url)
            .timeout(std::time::Duration::from_secs(10))
            .call()
            .map_err(|e| e.to_string())?
            .into_string()
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![load_data, save_data, data_path, export_backup, fetch_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
