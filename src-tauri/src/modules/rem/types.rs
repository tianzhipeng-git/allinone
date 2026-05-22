use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum RemScheduleMode {
    Cron,
    FixedRate,
    FixedDelay,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum RemLogStatus {
    Pending,
    Confirmed,
    Ignored,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemReminder {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub tag: String,
    pub active: bool,
    pub schedule_mode: RemScheduleMode,
    pub cron_expr: Option<String>,
    pub interval_minutes: Option<i32>,
    pub natural_text: String,
    pub webhook_url: Option<String>,
    pub notify_system: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemLogEntry {
    pub id: i32,
    pub reminder_id: i32,
    pub triggered_at: String,
    pub status: RemLogStatus,
    pub note: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemDashboard {
    pub reminders: Vec<RemReminder>,
    pub logs: Vec<RemLogEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemUpsertReminderInput {
    pub id: Option<i32>,
    pub title: String,
    pub description: String,
    pub tag: String,
    pub active: bool,
    pub schedule_mode: RemScheduleMode,
    pub cron_expr: Option<String>,
    pub interval_minutes: Option<i32>,
    pub natural_text: String,
    pub webhook_url: Option<String>,
    pub notify_system: bool,
}
