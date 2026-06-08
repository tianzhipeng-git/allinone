use chrono::{DateTime, Datelike, Duration, Local, NaiveDate, TimeZone, Utc};

use super::types::{RemCadence, RemScheduleConfig, RemScheduleMode};

pub fn get_next_trigger_at(
    schedule: &RemScheduleConfig,
    now: DateTime<Local>,
) -> Result<DateTime<Local>, String> {
    if matches!(schedule.mode, RemScheduleMode::Interval) {
        return Ok(now + Duration::hours(i64::from(schedule.interval_hours.max(1))));
    }

    let (hour, minute) = parse_time(&schedule.time);

    match schedule.cadence {
        RemCadence::Daily => next_daily(hour, minute, now),
        RemCadence::Weekly => next_weekly(&schedule.weekdays, hour, minute, now),
        RemCadence::Monthly => next_monthly(schedule.month_day, hour, minute, now),
        RemCadence::Yearly => next_yearly(schedule.month, schedule.month_day, hour, minute, now),
    }
}

pub fn normalized_schedule(schedule: &RemScheduleConfig) -> RemScheduleConfig {
    let mut next = schedule.clone();
    next.interval_hours = next.interval_hours.max(1);
    next.month_day = next.month_day.clamp(1, 31);
    next.month = next.month.clamp(1, 12);
    next.weekdays = normalized_weekdays(&next.weekdays);
    next.cron_expression = build_cron_expression(&next);
    next
}

pub fn build_cron_expression(schedule: &RemScheduleConfig) -> String {
    if matches!(schedule.mode, RemScheduleMode::Interval) {
        return format!("0 */{} * * *", schedule.interval_hours.max(1));
    }

    let (hour, minute) = parse_time(&schedule.time);
    match schedule.cadence {
        RemCadence::Daily => format!("{minute} {hour} * * *"),
        RemCadence::Weekly => format!(
            "{minute} {hour} * * {}",
            normalized_weekdays(&schedule.weekdays)
                .iter()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
                .join(",")
        ),
        RemCadence::Monthly => format!("{minute} {hour} {} * *", schedule.month_day.clamp(1, 31)),
        RemCadence::Yearly => format!(
            "{minute} {hour} {} {} *",
            schedule.month_day.clamp(1, 31),
            schedule.month.clamp(1, 12)
        ),
    }
}

pub fn parse_datetime(value: &str) -> Result<DateTime<Utc>, String> {
    DateTime::parse_from_rfc3339(value)
        .map(|value| value.with_timezone(&Utc))
        .map_err(|e| format!("Failed to parse REM date: {e}"))
}

fn next_daily(hour: u32, minute: u32, now: DateTime<Local>) -> Result<DateTime<Local>, String> {
    let today = local_datetime(now.year(), now.month(), now.day(), hour, minute)?;
    if today > now {
        return Ok(today);
    }

    Ok(today + Duration::days(1))
}

fn next_weekly(
    weekdays: &[i32],
    hour: u32,
    minute: u32,
    now: DateTime<Local>,
) -> Result<DateTime<Local>, String> {
    let days = normalized_weekdays(weekdays);

    for offset in 0..=7 {
        let date = now.date_naive() + Duration::days(offset);
        let candidate = local_datetime(date.year(), date.month(), date.day(), hour, minute)?;
        if days.contains(&i32::try_from(candidate.weekday().num_days_from_sunday()).unwrap_or(0))
            && candidate > now
        {
            return Ok(candidate);
        }
    }

    Err("Failed to find next weekly reminder time".to_string())
}

fn next_monthly(
    month_day: i32,
    hour: u32,
    minute: u32,
    now: DateTime<Local>,
) -> Result<DateTime<Local>, String> {
    let day = month_day.clamp(1, 31);
    let candidate = monthly_candidate(now.year(), now.month(), day, hour, minute)?;

    if candidate > now {
        return Ok(candidate);
    }

    let (year, month) = if now.month() == 12 {
        (now.year() + 1, 1)
    } else {
        (now.year(), now.month() + 1)
    };

    monthly_candidate(year, month, day, hour, minute)
}

fn next_yearly(
    month: i32,
    month_day: i32,
    hour: u32,
    minute: u32,
    now: DateTime<Local>,
) -> Result<DateTime<Local>, String> {
    let month = u32::try_from(month.clamp(1, 12)).unwrap_or(1);
    let day = month_day.clamp(1, 31);
    let candidate = monthly_candidate(now.year(), month, day, hour, minute)?;

    if candidate > now {
        return Ok(candidate);
    }

    monthly_candidate(now.year() + 1, month, day, hour, minute)
}

fn monthly_candidate(
    year: i32,
    month: u32,
    day: i32,
    hour: u32,
    minute: u32,
) -> Result<DateTime<Local>, String> {
    let clamped_day = day.min(i32::try_from(days_in_month(year, month)).unwrap_or(28));
    local_datetime(
        year,
        month,
        u32::try_from(clamped_day).unwrap_or(1),
        hour,
        minute,
    )
}

fn local_datetime(
    year: i32,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
) -> Result<DateTime<Local>, String> {
    Local
        .with_ymd_and_hms(year, month, day, hour, minute, 0)
        .single()
        .ok_or_else(|| "Failed to resolve local reminder time".to_string())
}

fn days_in_month(year: i32, month: u32) -> u32 {
    let (next_year, next_month) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };

    NaiveDate::from_ymd_opt(next_year, next_month, 1)
        .and_then(|date| date.pred_opt())
        .map(|date| date.day())
        .unwrap_or(28)
}

fn parse_time(time: &str) -> (u32, u32) {
    let mut parts = time.split(':');
    let hour = parts
        .next()
        .and_then(|value| value.parse::<u32>().ok())
        .unwrap_or(9)
        .min(23);
    let minute = parts
        .next()
        .and_then(|value| value.parse::<u32>().ok())
        .unwrap_or(0)
        .min(59);

    (hour, minute)
}

fn normalized_weekdays(weekdays: &[i32]) -> Vec<i32> {
    let mut days = weekdays
        .iter()
        .map(|day| (*day).clamp(0, 6))
        .collect::<Vec<_>>();
    days.sort_unstable();
    days.dedup();
    if days.is_empty() {
        vec![1]
    } else {
        days
    }
}
