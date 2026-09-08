use tauri::State;

use crate::persistence::repository::{self, HistoryFilter, HistoryRow};
use crate::state::AppState;

#[tauri::command]
pub fn query_history(state: State<AppState>, filter: HistoryFilter) -> Result<Vec<HistoryRow>, String> {
    repository::query_history(&state.db, &filter).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_history_csv(state: State<AppState>, filter: HistoryFilter) -> Result<String, String> {
    let rows = repository::query_history(&state.db, &filter).map_err(|e| e.to_string())?;

    let mut csv = String::from("ts,protocol,local_addr,local_port,remote_addr,remote_port,state,pid,process_name,bytes_sent_delta,bytes_recv_delta\n");
    for r in rows {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{},{}\n",
            r.ts,
            r.protocol,
            r.local_addr,
            r.local_port,
            r.remote_addr.unwrap_or_default(),
            r.remote_port.map(|p| p.to_string()).unwrap_or_default(),
            r.state.unwrap_or_default(),
            r.pid,
            csv_escape(&r.process_name.unwrap_or_default()),
            r.bytes_sent_delta,
            r.bytes_recv_delta,
        ));
    }
    Ok(csv)
}

fn csv_escape(value: &str) -> String {
    if value.contains(',') || value.contains('"') {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}

#[tauri::command]
pub fn get_history_retention_days(state: State<AppState>) -> u32 {
    *state.history_retention_days.lock().unwrap()
}

#[tauri::command]
pub fn set_history_retention_days(state: State<AppState>, days: u32) {
    *state.history_retention_days.lock().unwrap() = days.clamp(1, 365);
}

#[tauri::command]
pub fn clear_history(state: State<AppState>) -> Result<usize, String> {
    repository::clear_all(&state.db).map_err(|e| e.to_string())
}
