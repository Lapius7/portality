use tauri::State;

use crate::net;
use crate::net::model::Connection;
use crate::state::AppState;

#[tauri::command]
pub fn list_connections(state: State<AppState>) -> Vec<Connection> {
    let enricher = state.enricher.lock().unwrap();
    net::snapshot(&enricher)
}

#[tauri::command]
pub fn set_poll_interval(state: State<AppState>, ms: u64) {
    *state.poll_interval_ms.lock().unwrap() = ms.clamp(250, 10_000);
}
