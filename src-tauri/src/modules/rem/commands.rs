use super::{
    storage,
    types::{RemDashboard, RemLogStatus, RemUpsertReminderInput},
};
use chrono::Utc;
use tauri::AppHandle;

#[tauri::command]
#[specta::specta]
pub fn rem_get_dashboard(app: AppHandle) -> Result<RemDashboard, String> {
    storage::load(&app)
}

#[tauri::command]
#[specta::specta]
pub fn rem_upsert_reminder(app: AppHandle, input: RemUpsertReminderInput) -> Result<(), String> {
    let mut data = storage::load(&app)?;
    let now = Utc::now().to_rfc3339();

    if let Some(id) = input.id {
        if let Some(item) = data.reminders.iter_mut().find(|x| x.id == id) {
            item.title = input.title;
            item.description = input.description;
            item.tag = input.tag;
            item.active = input.active;
            item.schedule_mode = input.schedule_mode;
            item.cron_expr = input.cron_expr;
            item.interval_minutes = input.interval_minutes;
            item.natural_text = input.natural_text;
            item.webhook_url = input.webhook_url;
            item.notify_system = input.notify_system;
            item.updated_at = now;
        }
    } else {
        let next_id = data.reminders.iter().map(|x| x.id).max().unwrap_or(0) + 1;
        data.reminders.push(super::types::RemReminder {
            id: next_id,
            title: input.title,
            description: input.description,
            tag: input.tag,
            active: input.active,
            schedule_mode: input.schedule_mode,
            cron_expr: input.cron_expr,
            interval_minutes: input.interval_minutes,
            natural_text: input.natural_text,
            webhook_url: input.webhook_url,
            notify_system: input.notify_system,
            created_at: now.clone(),
            updated_at: now,
        });
    }

    storage::save(&app, &data)
}

#[tauri::command]
#[specta::specta]
pub fn rem_toggle_reminder(app: AppHandle, reminder_id: i32, active: bool) -> Result<(), String> {
    let mut data = storage::load(&app)?;
    if let Some(item) = data.reminders.iter_mut().find(|x| x.id == reminder_id) {
        item.active = active;
        item.updated_at = Utc::now().to_rfc3339();
    }
    storage::save(&app, &data)
}

#[tauri::command]
#[specta::specta]
pub fn rem_delete_reminder(app: AppHandle, reminder_id: i32) -> Result<(), String> {
    let mut data = storage::load(&app)?;
    data.reminders.retain(|x| x.id != reminder_id);
    data.logs.retain(|x| x.reminder_id != reminder_id);
    storage::save(&app, &data)
}

#[tauri::command]
#[specta::specta]
pub fn rem_update_log_status(
    app: AppHandle,
    log_id: i32,
    status: RemLogStatus,
    note: Option<String>,
) -> Result<(), String> {
    let mut data = storage::load(&app)?;
    if let Some(log) = data.logs.iter_mut().find(|x| x.id == log_id) {
        log.status = status;
        if note.is_some() {
            log.note = note;
        }
        log.completed_at = Some(Utc::now().to_rfc3339());
    }
    storage::save(&app, &data)
}
