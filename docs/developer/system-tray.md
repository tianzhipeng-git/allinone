# System Tray

Desktop builds keep a system tray icon alive so the app can continue running when the main window is hidden.

## Behavior

- Closing the main window hides it to the tray instead of exiting.
- On macOS, hiding the main window also removes the app icon from the Dock.
- Left-clicking the tray icon restores and focuses the main window on platforms that emit tray click events.
- The tray menu provides Show, Hide, and Quit actions.
- Quit exits the process normally and still runs the app shutdown cleanup.

## Implementation

The tray is created in Rust during Tauri setup:

```rust
// src-tauri/src/lib.rs
.setup(|app| {
    app_tray::init(app)?;
    Ok(())
})
```

Tray behavior lives in `src-tauri/src/app_tray.rs` so the window lifecycle is centralized:

- `init()` creates the tray icon and menu.
- `show_main_window()` restores Dock visibility on macOS, then restores, unminimizes, and focuses the main window.
- `hide_main_window()` saves window state, hides the main window, and hides the Dock icon on macOS.

The main window close handler delegates to `hide_main_window()` and calls `prevent_close()` so the app remains resident.

## Platform Notes

Tauri's Linux tray click events are not emitted even though the icon and context menu are shown, so Linux users should use the tray menu to restore the window. The Rust implementation uses `show_menu_on_left_click(false)` to allow left-click restore on macOS and Windows while preserving right-click menu access.

## Dependencies

The Tauri `tray-icon` feature must stay enabled in `src-tauri/Cargo.toml`:

```toml
tauri = { version = "2", features = ["macos-private-api", "tray-icon"] }
```
