use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub const QUICK_COMPOSE_WINDOW: &str = "quick-compose";

static SHORTCUT_REGISTERED: AtomicBool = AtomicBool::new(false);

fn register_shortcut_handler(app: &AppHandle) -> anyhow::Result<()> {
    let shortcut = quick_compose_shortcut();
    app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            toggle_quick_compose(app);
        }
    })?;
    Ok(())
}

pub fn quick_compose_shortcut() -> Shortcut {
    #[cfg(target_os = "macos")]
    let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;

    Shortcut::new(Some(modifiers), Code::Space)
}

pub fn toggle_quick_compose(app: &AppHandle) {
    let Some(window) = app.get_webview_window(QUICK_COMPOSE_WINDOW) else {
        tracing::warn!("Quick compose window not found");
        return;
    };

    let visible = window.is_visible().unwrap_or(false);
    if visible && window.is_focused().unwrap_or(false) {
        let _ = window.hide();
        return;
    }

    let _ = window.emit("quick-compose-show", ());
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.center();
    let _ = window.set_focus();
}

pub fn show_quick_compose(app: &AppHandle) {
    toggle_quick_compose(app);
}

#[tauri::command]
pub fn sync_quick_compose_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let shortcut = quick_compose_shortcut();
    if enabled {
        if !SHORTCUT_REGISTERED.load(Ordering::SeqCst) {
            register_shortcut_handler(&app).map_err(|err| err.to_string())?;
            SHORTCUT_REGISTERED.store(true, Ordering::SeqCst);
        }
    } else if SHORTCUT_REGISTERED.load(Ordering::SeqCst) {
        app.global_shortcut()
            .unregister(shortcut)
            .map_err(|err| err.to_string())?;
        SHORTCUT_REGISTERED.store(false, Ordering::SeqCst);
    }
    Ok(())
}

#[tauri::command]
pub fn hide_quick_compose(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(QUICK_COMPOSE_WINDOW) {
        window.hide().map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_chat_in_main(app: AppHandle, chat_id: String) -> Result<(), String> {
    show_main_window(&app);
    app.emit_to("main", "open-chat", chat_id)
        .map_err(|err| err.to_string())?;
    if let Some(window) = app.get_webview_window(QUICK_COMPOSE_WINDOW) {
        let _ = window.hide();
    }
    Ok(())
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
