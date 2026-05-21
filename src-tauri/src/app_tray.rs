//! System tray integration.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Wry,
};

const MAIN_WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "main-tray";
const TRAY_SHOW_ID: &str = "tray-show-main";
const TRAY_HIDE_ID: &str = "tray-hide-main";
const TRAY_QUIT_ID: &str = "tray-quit";

/// Creates the app system tray and wires menu/click behavior.
#[cfg(desktop)]
pub fn init(app: &tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, TRAY_SHOW_ID, "Show allinone", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, TRAY_HIDE_ID, "Hide allinone", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, TRAY_QUIT_ID, "Quit allinone", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&show, &hide, &separator, &quit])?;

    let mut tray_builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("allinone")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_SHOW_ID => show_main_window(app),
            TRAY_HIDE_ID => hide_main_window(app),
            TRAY_QUIT_ID => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
    }

    tray_builder.build(app)?;
    log::info!("System tray initialized");

    Ok(())
}

/// Shows and focuses the main window.
#[cfg(desktop)]
pub fn show_main_window(app: &AppHandle<Wry>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        if let Err(e) = window.show() {
            log::warn!("Failed to show main window: {e}");
        }

        #[cfg(desktop)]
        {
            use tauri_plugin_window_state::{StateFlags, WindowExt};
            if let Err(e) = window.restore_state(StateFlags::all()) {
                log::debug!("Failed to restore main window state: {e}");
            }
        }

        if let Err(e) = window.unminimize() {
            log::warn!("Failed to unminimize main window: {e}");
        }

        if let Err(e) = window.set_focus() {
            log::warn!("Failed to focus main window: {e}");
        }

        log::info!("Main window shown from tray");
    }
}

/// Hides the main window while keeping the app and tray alive.
#[cfg(desktop)]
pub fn hide_main_window(app: &AppHandle<Wry>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        #[cfg(desktop)]
        {
            use tauri_plugin_window_state::{AppHandleExt, StateFlags};
            if let Err(e) = app.save_window_state(StateFlags::all()) {
                log::warn!("Failed to save window state before hiding: {e}");
            }
        }

        if let Err(e) = window.hide() {
            log::warn!("Failed to hide main window: {e}");
        } else {
            log::info!("Main window hidden to tray");
        }
    }
}
