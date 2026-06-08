use super::types::{RemNotificationChannels, RemReminder};

const DEFAULT_BODY_TEMPLATE: &str = r#"{
  "module": "rem",
  "reminderId": "{{reminderId}}",
  "title": "{{title}}",
  "description": "{{description}}",
  "tag": "{{tag}}",
  "triggeredAt": "{{triggeredAt}}",
  "nextTriggerAt": "{{nextTriggerAt}}"
}"#;

pub fn render_webhook_body(reminder: &RemReminder, triggered_at: &str) -> String {
    let template = reminder
        .notifications
        .webhook_body_template
        .trim();

    let template = if template.is_empty() {
        DEFAULT_BODY_TEMPLATE.to_string()
    } else {
        normalize_template_quotes(template)
    };

    render_template(
        &template,
        &[
            ("module", "rem"),
            ("reminderId", &reminder.id),
            ("title", &reminder.title),
            ("description", &reminder.description),
            ("tag", &reminder.tag),
            ("triggeredAt", triggered_at),
            ("nextTriggerAt", &reminder.next_trigger_at),
        ],
    )
}

pub fn render_template(template: &str, variables: &[(&str, &str)]) -> String {
    let mut result = template.to_string();

    for (key, value) in variables {
        let placeholder = format!("{{{{{key}}}}}");
        let escaped = json_string_fragment(value);
        result = result.replace(&placeholder, &escaped);
    }

    result
}

pub fn build_request_headers(
    notifications: &RemNotificationChannels,
) -> Vec<(String, String)> {
    let mut headers: Vec<(String, String)> = notifications
        .webhook_headers
        .iter()
        .filter(|header| !header.name.trim().is_empty())
        .map(|header| (header.name.trim().to_string(), header.value.clone()))
        .collect();

    let has_content_type = headers
        .iter()
        .any(|(name, _)| name.eq_ignore_ascii_case("content-type"));

    if !has_content_type {
        headers.push(("Content-Type".to_string(), "application/json".to_string()));
    }

    headers
}

fn normalize_template_quotes(template: &str) -> String {
    template
        .replace('\u{201c}', "\"")
        .replace('\u{201d}', "\"")
        .replace('\u{2018}', "'")
        .replace('\u{2019}', "'")
}

fn json_string_fragment(value: &str) -> String {
    serde_json::to_string(value)
        .ok()
        .map(|encoded| encoded[1..encoded.len().saturating_sub(1)].to_string())
        .unwrap_or_else(|| value.replace('\\', "\\\\").replace('"', "\\\""))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::rem::types::{
        RemCadence, RemNotificationChannels, RemScheduleConfig, RemScheduleMode,
        RemWebhookHeader,
    };

    fn sample_reminder(notifications: RemNotificationChannels) -> RemReminder {
        RemReminder {
            id: "42".to_string(),
            title: "Drink water".to_string(),
            description: "Stay hydrated".to_string(),
            tag: "health".to_string(),
            enabled: true,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
            next_trigger_at: "2026-01-01T10:00:00Z".to_string(),
            schedule: RemScheduleConfig {
                mode: RemScheduleMode::Interval,
                cadence: RemCadence::Daily,
                time: "09:00".to_string(),
                weekdays: vec![1],
                month_day: 1,
                month: 1,
                interval_hours: 2,
                cron_expression: String::new(),
            },
            notifications,
        }
    }

    #[test]
    fn renders_default_template_when_body_is_empty() {
        let reminder = sample_reminder(RemNotificationChannels {
            system: false,
            webhook_url: "https://example.com/hook".to_string(),
            webhook_body_template: String::new(),
            webhook_headers: vec![],
        });

        let body = render_webhook_body(&reminder, "2026-01-01T09:00:00Z");
        assert!(body.contains("\"reminderId\": \"42\""));
        assert!(body.contains("\"title\": \"Drink water\""));
        assert!(body.contains("\"triggeredAt\": \"2026-01-01T09:00:00Z\""));
    }

    #[test]
    fn renders_custom_template_with_variables() {
        let reminder = sample_reminder(RemNotificationChannels {
            system: false,
            webhook_url: "https://example.com/hook".to_string(),
            webhook_body_template: r#"{"text":"[{{tag}}] {{title}} at {{triggeredAt}}"}"#.to_string(),
            webhook_headers: vec![],
        });

        let body = render_webhook_body(&reminder, "2026-01-01T09:00:00Z");
        assert_eq!(
            body,
            r#"{"text":"[health] Drink water at 2026-01-01T09:00:00Z"}"#
        );
    }

    #[test]
    fn escapes_special_characters_in_template_values() {
        let mut reminder = sample_reminder(RemNotificationChannels {
            system: false,
            webhook_url: "https://example.com/hook".to_string(),
            webhook_body_template: r#"{"title":"{{title}}"}"#.to_string(),
            webhook_headers: vec![],
        });
        reminder.title = "Say \"hi\"".to_string();

        let body = render_webhook_body(&reminder, "2026-01-01T09:00:00Z");
        assert_eq!(body, r#"{"title":"Say \"hi\""}"#);
    }

    #[test]
    fn normalizes_smart_quotes_in_custom_template() {
        let reminder = sample_reminder(RemNotificationChannels {
            system: false,
            webhook_url: "https://example.com/hook".to_string(),
            webhook_body_template: "{\n    \"msg_type\": \"text\",\n    \"content\": {\n        \"text\": \u{201c}[{{tag}}] {{title}}\u{201d}\n    }\n}".to_string(),
            webhook_headers: vec![],
        });

        let body = render_webhook_body(&reminder, "2026-01-01T09:00:00Z");
        assert!(body.contains("\"text\": \"[health] Drink water\""));
    }

    #[test]
    fn adds_default_content_type_when_missing() {
        let headers = build_request_headers(&RemNotificationChannels {
            system: false,
            webhook_url: "https://example.com/hook".to_string(),
            webhook_body_template: String::new(),
            webhook_headers: vec![RemWebhookHeader {
                name: "Authorization".to_string(),
                value: "Bearer token".to_string(),
            }],
        });

        assert_eq!(headers.len(), 2);
        assert!(headers
            .iter()
            .any(|(name, value)| name == "Authorization" && value == "Bearer token"));
        assert!(headers
            .iter()
            .any(|(name, value)| name == "Content-Type" && value == "application/json"));
    }
}
