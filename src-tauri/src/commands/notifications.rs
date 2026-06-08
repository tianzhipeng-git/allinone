//! Native notification commands.
//!
//! Provides cross-platform native notification support using the Tauri notification plugin.

use std::time::Duration;

use tauri::AppHandle;

/// Sends a native system notification on the main thread and waits for the result.
pub fn send_native_notification_blocking(
    app: &AppHandle,
    title: String,
    body: Option<String>,
) -> Result<(), String> {
    #[cfg(mobile)]
    {
        let _ = (app, title, body);
        return Err("Native notifications are not supported on mobile".to_string());
    }

    #[cfg(not(mobile))]
    {
        let app = app.clone();
        let (tx, rx) = std::sync::mpsc::channel();

        app.clone().run_on_main_thread(move || {
            let result = send_native_notification_on_main_thread(&app, &title, body.as_deref());
            let _ = tx.send(result);
        })
        .map_err(|e| format!("Failed to dispatch notification to main thread: {e}"))?;

        rx.recv_timeout(Duration::from_secs(5))
            .map_err(|e| format!("Timed out waiting for notification result: {e}"))?
    }
}

/// Sends a native system notification.
/// On mobile platforms, returns an error as notifications are not yet supported.
#[tauri::command]
#[specta::specta]
pub async fn send_native_notification(
    app: AppHandle,
    title: String,
    body: Option<String>,
) -> Result<(), String> {
    log::info!("Sending native notification: {title}");

    match send_native_notification_blocking(&app, title, body) {
        Ok(()) => {
            log::info!("Native notification sent successfully");
            Ok(())
        }
        Err(error) => {
            log::error!("Failed to send native notification: {error}");
            Err(error)
        }
    }
}

#[cfg(not(mobile))]
fn send_native_notification_on_main_thread(
    app: &AppHandle,
    title: &str,
    body: Option<&str>,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;

    let mut notification = app.notification().builder().title(title);

    if let Some(body_text) = body.filter(|value| !value.is_empty()) {
        notification = notification.body(body_text);
    }

    notification
        .show()
        .map_err(|e| format!("Failed to send notification: {e}"))
}
