use chrono::{DateTime, Local, Utc};
use rusqlite::{params, types::Type, Connection, OptionalExtension, Row};
use tauri::{AppHandle, Manager};

use super::schedule::{
    build_cron_expression, get_next_trigger_at, normalized_schedule, parse_datetime,
};
use super::types::{
    RemCadence, RemLogEntry, RemLogStatus, RemNotificationChannels, RemReminder, RemReminderDraft,
    RemScheduleConfig, RemScheduleMode, RemState,
};

pub fn connect(app: &AppHandle) -> Result<Connection, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    let conn = Connection::open(app_data_dir.join("allinone.sqlite"))
        .map_err(|e| format!("Failed to open SQLite database: {e}"))?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS rem_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            tag TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            schedule_mode TEXT NOT NULL,
            cadence TEXT NOT NULL,
            time TEXT NOT NULL,
            weekdays TEXT NOT NULL,
            month_day INTEGER NOT NULL,
            month INTEGER NOT NULL,
            interval_hours INTEGER NOT NULL,
            cron_expression TEXT NOT NULL,
            notification_system INTEGER NOT NULL DEFAULT 1,
            webhook_url TEXT NOT NULL DEFAULT '',
            next_trigger_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rem_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reminder_id INTEGER NOT NULL REFERENCES rem_reminders(id) ON DELETE CASCADE,
            reminder_title TEXT NOT NULL,
            tag TEXT NOT NULL,
            triggered_at TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            completed_at TEXT,
            channels TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_rem_reminders_next_trigger
            ON rem_reminders(enabled, next_trigger_at);

        CREATE INDEX IF NOT EXISTS idx_rem_logs_reminder_triggered
            ON rem_logs(reminder_id, triggered_at DESC);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_rem_logs_unique_trigger
            ON rem_logs(reminder_id, triggered_at);
        ",
    )
    .map_err(|e| format!("Failed to migrate REM database: {e}"))
}

pub fn get_state(conn: &Connection) -> Result<RemState, String> {
    Ok(RemState {
        reminders: list_reminders(conn)?,
        logs: list_logs(conn)?,
    })
}

pub fn list_reminders(conn: &Connection) -> Result<Vec<RemReminder>, String> {
    let mut stmt = conn
        .prepare(
            "
            SELECT id, title, description, tag, enabled, schedule_mode, cadence,
                   time, weekdays, month_day, month, interval_hours,
                   cron_expression, notification_system, webhook_url,
                   next_trigger_at, created_at, updated_at
            FROM rem_reminders
            ORDER BY enabled DESC, next_trigger_at ASC, title COLLATE NOCASE
            ",
        )
        .map_err(|e| format!("Failed to prepare REM reminders query: {e}"))?;

    let reminders = stmt
        .query_map([], map_reminder)
        .map_err(|e| format!("Failed to query REM reminders: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read REM reminders: {e}"))?;

    Ok(reminders)
}

pub fn list_logs(conn: &Connection) -> Result<Vec<RemLogEntry>, String> {
    let mut stmt = conn
        .prepare(
            "
            SELECT id, reminder_id, reminder_title, tag, triggered_at, status,
                   note, completed_at, channels
            FROM rem_logs
            ORDER BY triggered_at DESC, id DESC
            ",
        )
        .map_err(|e| format!("Failed to prepare REM logs query: {e}"))?;

    let logs = stmt
        .query_map([], map_log)
        .map_err(|e| format!("Failed to query REM logs: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read REM logs: {e}"))?;

    Ok(logs)
}

pub fn create_reminder(conn: &Connection, draft: &RemReminderDraft) -> Result<RemReminder, String> {
    validate_draft(draft)?;
    let now = now_iso();
    let schedule = normalized_schedule(&draft.schedule);
    let next_trigger_at = store_trigger_at(get_next_trigger_at(&schedule, Local::now())?);

    conn.execute(
        "
        INSERT INTO rem_reminders (
            title, description, tag, enabled, schedule_mode, cadence, time,
            weekdays, month_day, month, interval_hours, cron_expression,
            notification_system, webhook_url, next_trigger_at, created_at, updated_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
        ",
        params![
            draft.title.trim(),
            draft.description.trim(),
            draft.tag.trim(),
            bool_to_i32(draft.enabled),
            schedule_mode_to_str(&schedule.mode),
            cadence_to_str(&schedule.cadence),
            schedule.time,
            weekdays_to_json(&schedule.weekdays)?,
            schedule.month_day,
            schedule.month,
            schedule.interval_hours,
            build_cron_expression(&schedule),
            bool_to_i32(draft.notifications.system),
            draft.notifications.webhook_url.trim(),
            next_trigger_at,
            now,
            now,
        ],
    )
    .map_err(|e| format!("Failed to create REM reminder: {e}"))?;

    let id = conn.last_insert_rowid();
    get_reminder(conn, id)
}

pub fn update_reminder(conn: &Connection, draft: &RemReminderDraft) -> Result<RemReminder, String> {
    validate_draft(draft)?;
    let id = parse_id(draft.id.as_deref(), "reminder")?;
    let schedule = normalized_schedule(&draft.schedule);
    let next_trigger_at = store_trigger_at(get_next_trigger_at(&schedule, Local::now())?);

    conn.execute(
        "
        UPDATE rem_reminders
        SET title = ?1,
            description = ?2,
            tag = ?3,
            enabled = ?4,
            schedule_mode = ?5,
            cadence = ?6,
            time = ?7,
            weekdays = ?8,
            month_day = ?9,
            month = ?10,
            interval_hours = ?11,
            cron_expression = ?12,
            notification_system = ?13,
            webhook_url = ?14,
            next_trigger_at = ?15,
            updated_at = ?16
        WHERE id = ?17
        ",
        params![
            draft.title.trim(),
            draft.description.trim(),
            draft.tag.trim(),
            bool_to_i32(draft.enabled),
            schedule_mode_to_str(&schedule.mode),
            cadence_to_str(&schedule.cadence),
            schedule.time,
            weekdays_to_json(&schedule.weekdays)?,
            schedule.month_day,
            schedule.month,
            schedule.interval_hours,
            build_cron_expression(&schedule),
            bool_to_i32(draft.notifications.system),
            draft.notifications.webhook_url.trim(),
            next_trigger_at,
            now_iso(),
            id,
        ],
    )
    .map_err(|e| format!("Failed to update REM reminder: {e}"))?;

    get_reminder(conn, id)
}

pub fn toggle_reminder(conn: &Connection, reminder_id: &str) -> Result<RemReminder, String> {
    let id = parse_id(Some(reminder_id), "reminder")?;
    let reminder = get_reminder(conn, id)?;
    let enabled = !reminder.enabled;
    let next_trigger_at =
        store_trigger_at(get_next_trigger_at(&reminder.schedule, Local::now())?);

    conn.execute(
        "
        UPDATE rem_reminders
        SET enabled = ?1, next_trigger_at = ?2, updated_at = ?3
        WHERE id = ?4
        ",
        params![bool_to_i32(enabled), next_trigger_at, now_iso(), id],
    )
    .map_err(|e| format!("Failed to toggle REM reminder: {e}"))?;

    get_reminder(conn, id)
}

pub fn delete_reminder(conn: &Connection, reminder_id: &str) -> Result<(), String> {
    let id = parse_id(Some(reminder_id), "reminder")?;
    conn.execute("DELETE FROM rem_reminders WHERE id = ?1", [id])
        .map_err(|e| format!("Failed to delete REM reminder: {e}"))?;
    Ok(())
}

pub fn update_log_status(
    conn: &Connection,
    log_id: &str,
    status: RemLogStatus,
) -> Result<RemLogEntry, String> {
    let id = parse_id(Some(log_id), "log")?;
    let completed_at = matches!(status, RemLogStatus::Confirmed).then(now_iso);

    conn.execute(
        "
        UPDATE rem_logs
        SET status = ?1, completed_at = ?2
        WHERE id = ?3
        ",
        params![log_status_to_str(&status), completed_at, id],
    )
    .map_err(|e| format!("Failed to update REM log status: {e}"))?;

    get_log(conn, id)
}

pub fn update_log_note(conn: &Connection, log_id: &str, note: &str) -> Result<RemLogEntry, String> {
    let id = parse_id(Some(log_id), "log")?;
    conn.execute(
        "UPDATE rem_logs SET note = ?1 WHERE id = ?2",
        params![note.trim(), id],
    )
    .map_err(|e| format!("Failed to update REM log note: {e}"))?;

    get_log(conn, id)
}

pub fn due_reminders(conn: &Connection, now: DateTime<Utc>) -> Result<Vec<RemReminder>, String> {
    let mut stmt = conn
        .prepare(
            "
            SELECT id, title, description, tag, enabled, schedule_mode, cadence,
                   time, weekdays, month_day, month, interval_hours,
                   cron_expression, notification_system, webhook_url,
                   next_trigger_at, created_at, updated_at
            FROM rem_reminders
            WHERE enabled = 1
            ORDER BY next_trigger_at ASC
            ",
        )
        .map_err(|e| format!("Failed to prepare REM due reminders query: {e}"))?;

    let reminders = stmt
        .query_map([], map_reminder)
        .map_err(|e| format!("Failed to query due REM reminders: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read due REM reminders: {e}"))?;

    Ok(reminders
        .into_iter()
        .filter(|reminder| is_trigger_due(&reminder.next_trigger_at, now))
        .collect())
}

pub fn record_trigger(
    conn: &Connection,
    reminder: &RemReminder,
    triggered_at: &str,
    channels: &[String],
) -> Result<RemLogEntry, String> {
    conn.execute(
        "
        INSERT OR IGNORE INTO rem_logs (
            reminder_id, reminder_title, tag, triggered_at, status, note, channels
        )
        VALUES (?1, ?2, ?3, ?4, 'pending', '', ?5)
        ",
        params![
            parse_id(Some(&reminder.id), "reminder")?,
            reminder.title,
            reminder.tag,
            triggered_at,
            serde_json::to_string(channels)
                .map_err(|e| format!("Failed to encode REM channels: {e}"))?,
        ],
    )
    .map_err(|e| format!("Failed to create REM trigger log: {e}"))?;

    conn.query_row(
        "
        SELECT id, reminder_id, reminder_title, tag, triggered_at, status,
               note, completed_at, channels
        FROM rem_logs
        WHERE reminder_id = ?1 AND triggered_at = ?2
        ",
        params![parse_id(Some(&reminder.id), "reminder")?, triggered_at],
        map_log,
    )
    .map_err(|e| format!("Failed to read REM trigger log: {e}"))
}

pub fn advance_reminder(conn: &Connection, reminder: &RemReminder) -> Result<(), String> {
    let previous_next = parse_datetime(&reminder.next_trigger_at)?;
    let next = get_next_trigger_at(&reminder.schedule, previous_next.with_timezone(&Local))?;

    conn.execute(
        "
        UPDATE rem_reminders
        SET next_trigger_at = ?1, updated_at = ?2
        WHERE id = ?3
        ",
        params![
            store_trigger_at(next),
            now_iso(),
            parse_id(Some(&reminder.id), "reminder")?,
        ],
    )
    .map_err(|e| format!("Failed to advance REM reminder: {e}"))?;

    Ok(())
}

fn get_reminder(conn: &Connection, id: i64) -> Result<RemReminder, String> {
    conn.query_row(
        "
        SELECT id, title, description, tag, enabled, schedule_mode, cadence,
               time, weekdays, month_day, month, interval_hours,
               cron_expression, notification_system, webhook_url,
               next_trigger_at, created_at, updated_at
        FROM rem_reminders
        WHERE id = ?1
        ",
        [id],
        map_reminder,
    )
    .optional()
    .map_err(|e| format!("Failed to read REM reminder: {e}"))?
    .ok_or_else(|| "REM reminder not found".to_string())
}

fn get_log(conn: &Connection, id: i64) -> Result<RemLogEntry, String> {
    conn.query_row(
        "
        SELECT id, reminder_id, reminder_title, tag, triggered_at, status,
               note, completed_at, channels
        FROM rem_logs
        WHERE id = ?1
        ",
        [id],
        map_log,
    )
    .optional()
    .map_err(|e| format!("Failed to read REM log: {e}"))?
    .ok_or_else(|| "REM log not found".to_string())
}

fn map_reminder(row: &Row<'_>) -> rusqlite::Result<RemReminder> {
    let schedule = RemScheduleConfig {
        mode: str_to_schedule_mode(&row.get::<_, String>(5)?),
        cadence: str_to_cadence(&row.get::<_, String>(6)?),
        time: row.get(7)?,
        weekdays: weekdays_from_json(&row.get::<_, String>(8)?)?,
        month_day: row.get(9)?,
        month: row.get(10)?,
        interval_hours: row.get(11)?,
        cron_expression: row.get(12)?,
    };

    Ok(RemReminder {
        id: row.get::<_, i64>(0)?.to_string(),
        title: row.get(1)?,
        description: row.get(2)?,
        tag: row.get(3)?,
        enabled: row.get::<_, i32>(4)? == 1,
        created_at: row.get(16)?,
        updated_at: row.get(17)?,
        next_trigger_at: row.get(15)?,
        schedule,
        notifications: RemNotificationChannels {
            system: row.get::<_, i32>(13)? == 1,
            webhook_url: row.get(14)?,
        },
    })
}

fn map_log(row: &Row<'_>) -> rusqlite::Result<RemLogEntry> {
    Ok(RemLogEntry {
        id: row.get::<_, i64>(0)?.to_string(),
        reminder_id: row.get::<_, i64>(1)?.to_string(),
        reminder_title: row.get(2)?,
        tag: row.get(3)?,
        triggered_at: row.get(4)?,
        status: str_to_log_status(&row.get::<_, String>(5)?),
        note: row.get(6)?,
        completed_at: row.get(7)?,
        channels: channels_from_json(&row.get::<_, String>(8)?)?,
    })
}

fn validate_draft(draft: &RemReminderDraft) -> Result<(), String> {
    if draft.title.trim().is_empty() {
        return Err("Reminder title cannot be empty".to_string());
    }

    if draft.tag.trim().is_empty() {
        return Err("Reminder tag cannot be empty".to_string());
    }

    if !draft.notifications.webhook_url.trim().is_empty()
        && !draft.notifications.webhook_url.starts_with("http://")
        && !draft.notifications.webhook_url.starts_with("https://")
    {
        return Err("Webhook URL must start with http:// or https://".to_string());
    }

    get_next_trigger_at(&draft.schedule, Local::now()).map(|_| ())
}

fn parse_id(value: Option<&str>, label: &str) -> Result<i64, String> {
    value
        .ok_or_else(|| format!("Missing REM {label} id"))?
        .parse::<i64>()
        .map_err(|_| format!("Invalid REM {label} id"))
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn store_trigger_at(dt: DateTime<Local>) -> String {
    dt.with_timezone(&Utc).to_rfc3339()
}

fn is_trigger_due(next_trigger_at: &str, now: DateTime<Utc>) -> bool {
    parse_datetime(next_trigger_at)
        .map(|trigger_at| trigger_at <= now)
        .unwrap_or(false)
}

fn bool_to_i32(value: bool) -> i32 {
    if value {
        1
    } else {
        0
    }
}

fn schedule_mode_to_str(value: &RemScheduleMode) -> &'static str {
    match value {
        RemScheduleMode::Cron => "cron",
        RemScheduleMode::Interval => "interval",
    }
}

fn str_to_schedule_mode(value: &str) -> RemScheduleMode {
    match value {
        "interval" => RemScheduleMode::Interval,
        _ => RemScheduleMode::Cron,
    }
}

fn cadence_to_str(value: &RemCadence) -> &'static str {
    match value {
        RemCadence::Daily => "daily",
        RemCadence::Weekly => "weekly",
        RemCadence::Monthly => "monthly",
        RemCadence::Yearly => "yearly",
    }
}

fn str_to_cadence(value: &str) -> RemCadence {
    match value {
        "weekly" => RemCadence::Weekly,
        "monthly" => RemCadence::Monthly,
        "yearly" => RemCadence::Yearly,
        _ => RemCadence::Daily,
    }
}

fn log_status_to_str(value: &RemLogStatus) -> &'static str {
    match value {
        RemLogStatus::Pending => "pending",
        RemLogStatus::Confirmed => "confirmed",
        RemLogStatus::Ignored => "ignored",
    }
}

fn str_to_log_status(value: &str) -> RemLogStatus {
    match value {
        "confirmed" => RemLogStatus::Confirmed,
        "ignored" => RemLogStatus::Ignored,
        _ => RemLogStatus::Pending,
    }
}

fn weekdays_to_json(value: &[i32]) -> Result<String, String> {
    serde_json::to_string(value).map_err(|e| format!("Failed to encode REM weekdays: {e}"))
}

fn weekdays_from_json(value: &str) -> rusqlite::Result<Vec<i32>> {
    serde_json::from_str(value).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(8, Type::Text, Box::new(error))
    })
}

fn channels_from_json(value: &str) -> rusqlite::Result<Vec<String>> {
    serde_json::from_str(value).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(8, Type::Text, Box::new(error))
    })
}

#[cfg(test)]
mod tests {
    use super::is_trigger_due;
    use chrono::{TimeZone, Utc};

    #[test]
    fn compares_local_stored_trigger_at_against_utc_now() {
        let local_trigger = "2026-06-08T17:35:00+08:00";
        let now = Utc.with_ymd_and_hms(2026, 6, 8, 9, 40, 0).unwrap();

        assert!(is_trigger_due(local_trigger, now));
    }

    #[test]
    fn compares_utc_stored_trigger_at_against_utc_now() {
        let utc_trigger = "2026-06-08T09:35:00Z";
        let now = Utc.with_ymd_and_hms(2026, 6, 8, 9, 40, 0).unwrap();

        assert!(is_trigger_due(utc_trigger, now));
    }

    #[test]
    fn rejects_future_trigger_at() {
        let utc_trigger = "2026-06-08T10:00:00Z";
        let now = Utc.with_ymd_and_hms(2026, 6, 8, 9, 40, 0).unwrap();

        assert!(!is_trigger_due(utc_trigger, now));
    }
}
