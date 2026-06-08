use tauri::AppHandle;

use super::storage;
use super::types::{RemLogEntry, RemLogStatus, RemReminder, RemReminderDraft, RemState};

#[tauri::command]
#[specta::specta]
pub async fn rem_get_state(app: AppHandle) -> Result<RemState, String> {
    let conn = storage::connect(&app)?;
    storage::get_state(&conn)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_create_reminder(
    app: AppHandle,
    draft: RemReminderDraft,
) -> Result<RemReminder, String> {
    let conn = storage::connect(&app)?;
    storage::create_reminder(&conn, &draft)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_update_reminder(
    app: AppHandle,
    draft: RemReminderDraft,
) -> Result<RemReminder, String> {
    let conn = storage::connect(&app)?;
    storage::update_reminder(&conn, &draft)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_toggle_reminder(
    app: AppHandle,
    reminder_id: String,
) -> Result<RemReminder, String> {
    let conn = storage::connect(&app)?;
    storage::toggle_reminder(&conn, &reminder_id)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_delete_reminder(app: AppHandle, reminder_id: String) -> Result<(), String> {
    let conn = storage::connect(&app)?;
    storage::delete_reminder(&conn, &reminder_id)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_update_log_status(
    app: AppHandle,
    log_id: String,
    status: RemLogStatus,
) -> Result<RemLogEntry, String> {
    let conn = storage::connect(&app)?;
    storage::update_log_status(&conn, &log_id, status)
}

#[tauri::command]
#[specta::specta]
pub async fn rem_update_log_note(
    app: AppHandle,
    log_id: String,
    note: String,
) -> Result<RemLogEntry, String> {
    let conn = storage::connect(&app)?;
    storage::update_log_note(&conn, &log_id, &note)
}
