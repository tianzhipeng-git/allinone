use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum RemScheduleMode {
    Cron,
    Interval,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum RemCadence {
    Daily,
    Weekly,
    Monthly,
    Yearly,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum RemLogStatus {
    Pending,
    Confirmed,
    Ignored,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct RemScheduleConfig {
    pub mode: RemScheduleMode,
    pub cadence: RemCadence,
    pub time: String,
    pub weekdays: Vec<i32>,
    pub month_day: i32,
    pub month: i32,
    pub interval_hours: i32,
    pub cron_expression: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemWebhookHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemNotificationChannels {
    pub system: bool,
    pub webhook_url: String,
    pub webhook_body_template: String,
    pub webhook_headers: Vec<RemWebhookHeader>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemReminder {
    pub id: String,
    pub title: String,
    pub description: String,
    pub tag: String,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
    pub next_trigger_at: String,
    pub schedule: RemScheduleConfig,
    pub notifications: RemNotificationChannels,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemLogEntry {
    pub id: String,
    pub reminder_id: String,
    pub reminder_title: String,
    pub tag: String,
    pub triggered_at: String,
    pub status: RemLogStatus,
    pub note: String,
    pub completed_at: Option<String>,
    pub channels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemReminderDraft {
    pub id: Option<String>,
    pub title: String,
    pub description: String,
    pub tag: String,
    pub enabled: bool,
    pub schedule: RemScheduleConfig,
    pub notifications: RemNotificationChannels,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RemState {
    pub reminders: Vec<RemReminder>,
    pub logs: Vec<RemLogEntry>,
}
