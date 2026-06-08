# REM Module

REM is the built-in reminder module for recurring schedules and trigger log
review.

## Current Scope

The current implementation is a full first-party module registered as `rem`.

It includes:

- Reminder board grouped by computed frequency: day, week, month, long term
- Module right sidebar actions for Home, Logs, and Create Reminder
- Tag filtering and reminder search
- 3D coverflow carousel for frequency sections with multiple reminders
- Create/edit dialog for Cron-style cadence and fixed interval schedules
- Reminder detail dialog with schedule metadata, channel summary, recent status
  dots, log actions, and note editing
- Global logs view with status summary, filtering, search, and pending-log
  confirm/ignore actions
- SQLite persistence for reminders and trigger logs
- Background scheduler started during Tauri setup
- Native system notification dispatch
- Native notification actions for confirming or ignoring pending trigger logs
- Webhook POST delivery for reminders with a configured URL

## Module Boundary

Frontend files live under `src/modules/rem/` and should remain isolated from
other modules. Shared app infrastructure is only imported from `src/components`,
`src/lib`, and translation files.

Persistent data follows the module architecture pattern:

```text
React module -> TanStack Query -> typed Tauri command -> Rust storage/scheduler
```

Rust files live under `src-tauri/src/modules/rem/`.

## Backend Shape

```
src-tauri/src/modules/rem/
├── commands.rs      # rem_* Tauri commands
├── schedule.rs      # Next trigger calculation, cron helpers
├── scheduler.rs     # Background due-reminder loop, notifications, webhooks
├── storage.rs       # SQLite schema, queries
├── types.rs         # RemReminder, RemLogEntry, RemState
└── mod.rs
```

Commands are registered in `src-tauri/src/bindings.rs` and exported with
`pnpm run rust:bindings`:

- `rem_get_state`
- `rem_create_reminder`
- `rem_update_reminder`
- `rem_toggle_reminder`
- `rem_delete_reminder`
- `rem_update_log_status`
- `rem_update_log_note`

The background scheduler is started from `src-tauri/src/lib.rs` via
`modules::rem::scheduler::start` during app setup.

## Storage

SQLite tables in `allinone.sqlite` (shared app database):

- `rem_reminders`: schedule config, notification channels, `next_trigger_at`
- `rem_logs`: one row per trigger with `pending` / `confirmed` / `ignored` status

Table and command namespaces use the `rem_` prefix.

## Scheduling Helpers

Frontend scheduling helpers are in `src/modules/rem/schedule.ts`; backend
scheduling helpers are in `src-tauri/src/modules/rem/schedule.rs`.

They cover:

- Frequency classification from next trigger interval
- Next trigger calculation for daily, weekly, monthly, yearly, and fixed
  interval schedules
- Cron expression generation for the editor preview

The backend scheduler scans due reminders every 30 seconds. For each due
reminder it creates a pending log row, sends the enabled channels, advances the
next trigger time, and emits `rem://state-changed` so the frontend refreshes the
TanStack Query cache.
