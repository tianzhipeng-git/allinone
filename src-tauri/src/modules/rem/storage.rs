use super::types::{RemDashboard, RemLogEntry, RemLogStatus, RemReminder, RemScheduleMode};
use chrono::Utc;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

fn default_data() -> RemDashboard {
    let now = Utc::now().to_rfc3339();
    RemDashboard {
        reminders: vec![RemReminder {
            id: 1,
            title: "喝水提醒".to_string(),
            description: "每小时喝水".to_string(),
            tag: "健康".to_string(),
            active: true,
            schedule_mode: RemScheduleMode::FixedRate,
            cron_expr: None,
            interval_minutes: Some(60),
            natural_text: "每小时一次".to_string(),
            webhook_url: None,
            notify_system: true,
            created_at: now.clone(),
            updated_at: now.clone(),
        }],
        logs: vec![RemLogEntry {
            id: 1,
            reminder_id: 1,
            triggered_at: now,
            status: RemLogStatus::Pending,
            note: None,
            completed_at: None,
        }],
    }
}

fn data_path(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&base).map_err(|e| e.to_string())?;
    Ok(base.join("reminders.json"))
}

pub fn load(app: &AppHandle) -> Result<RemDashboard, String> {
    let path = data_path(app)?;
    if !path.exists() {
        let data = default_data();
        save(app, &data)?;
        return Ok(data);
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn save(app: &AppHandle, data: &RemDashboard) -> Result<(), String> {
    let path = data_path(app)?;
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}
