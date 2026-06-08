use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use chrono::Utc;
use tauri::{AppHandle, Emitter};

use crate::commands::notifications::send_native_notification_blocking;

use super::storage;
use super::types::{RemLogEntry, RemReminder};
use super::webhook::{build_request_headers, render_webhook_body};

static SCHEDULER_STARTED: AtomicBool = AtomicBool::new(false);

pub fn start(app: AppHandle) {
    if SCHEDULER_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }

    std::thread::spawn(move || loop {
        if let Err(e) = process_due_reminders(&app) {
            log::error!("REM scheduler tick failed: {e}");
        }

        std::thread::sleep(Duration::from_secs(30));
    });
}

pub fn process_due_reminders(app: &AppHandle) -> Result<(), String> {
    let conn = storage::connect(app)?;
    let reminders = storage::due_reminders(&conn, Utc::now())?;

    for reminder in reminders {
        if let Err(e) = process_reminder(app, &conn, &reminder) {
            log::error!("Failed to process REM reminder {}: {e}", reminder.id);
        }
    }

    Ok(())
}

fn process_reminder(
    app: &AppHandle,
    conn: &rusqlite::Connection,
    reminder: &RemReminder,
) -> Result<(), String> {
    let triggered_at = reminder.next_trigger_at.clone();
    let mut channels = Vec::new();

    if reminder.notifications.system {
        channels.push("system".to_string());
    }

    if !reminder.notifications.webhook_url.trim().is_empty() {
        channels.push("webhook".to_string());
    }

    let log = storage::record_trigger(conn, reminder, &triggered_at, &channels)?;

    if reminder.notifications.system {
        if let Err(e) = send_system_notification(app, reminder, &log) {
            log::warn!(
                "REM system notification failed for reminder {}: {e}",
                reminder.id
            );
        }
    }

    if !reminder.notifications.webhook_url.trim().is_empty() {
        if let Err(e) = send_webhook(reminder, &triggered_at) {
            log::warn!("REM webhook failed for reminder {}: {e}", reminder.id);
        }
    }

    storage::advance_reminder(conn, reminder)?;
    app.emit("rem://state-changed", ())
        .map_err(|e| format!("Failed to emit REM state change: {e}"))?;

    Ok(())
}

fn send_system_notification(
    app: &AppHandle,
    reminder: &RemReminder,
    log: &RemLogEntry,
) -> Result<(), String> {
    app.emit(
        "rem://notification",
        serde_json::json!({
            "title": reminder.title,
            "body": reminder.description,
            "logId": log.id,
        }),
    )
    .map_err(|e| format!("Failed to emit REM notification event: {e}"))?;

    send_native_notification_blocking(
        app,
        reminder.title.clone(),
        Some(reminder.description.clone()),
    )
}

fn send_webhook(reminder: &RemReminder, triggered_at: &str) -> Result<(), String> {
    let body = render_webhook_body(reminder, triggered_at);
    let mut request = reqwest::blocking::Client::new()
        .post(reminder.notifications.webhook_url.trim())
        .body(body);

    for (name, value) in build_request_headers(&reminder.notifications) {
        request = request.header(name, value);
    }

    let response = request
        .send()
        .map_err(|e| format!("Failed to send REM webhook: {e}"))?;

    if response.status().is_success() {
        return Ok(());
    }

    let status = response.status();
    let response_body = response
        .text()
        .unwrap_or_else(|e| format!("<failed to read response body: {e}>"));

    Err(format!(
        "REM webhook returned an error: {status} for url ({}): {response_body}",
        reminder.notifications.webhook_url.trim()
    ))
}
