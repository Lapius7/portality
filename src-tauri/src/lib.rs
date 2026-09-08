pub mod commands;
pub mod elevation;
pub mod net;
pub mod persistence;
pub mod poller;
pub mod process;
pub mod state;
pub mod traffic;
pub mod tray;

use tauri::{Manager, WindowEvent};

use persistence::db::Db;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("failed to resolve app data dir");
            let db = Db::open(&data_dir).expect("failed to open history database");
            app.manage(AppState::new(db));

            tray::setup(&app.handle())?;

            if let Some(window) = app.get_webview_window("main") {
                let window_for_handler = window.clone();
                window.on_window_event(move |event| {
                    // Closing the window hides it to the tray instead of quitting -
                    // the app only fully exits via the tray menu's "終了", which
                    // matches the "stays running in the tray" requirement.
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_for_handler.hide();
                    }
                });
            }

            poller::start(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::connections::list_connections,
            commands::connections::set_poll_interval,
            commands::process::kill_process,
            commands::process::is_elevated,
            commands::process::relaunch_as_admin,
            commands::traffic::get_traffic_series,
            commands::traffic::get_system_traffic_series,
            commands::history::query_history,
            commands::history::export_history_csv,
            commands::history::get_history_retention_days,
            commands::history::set_history_retention_days,
            commands::history::clear_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running portality");
}
