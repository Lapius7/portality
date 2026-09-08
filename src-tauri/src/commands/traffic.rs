use tauri::State;

use crate::state::AppState;
use crate::traffic::model::{TrafficSample, SYSTEM_KEY};

#[tauri::command]
pub fn get_traffic_series(state: State<AppState>, id: String) -> Vec<TrafficSample> {
    state.traffic.lock().unwrap().series_for(&id)
}

#[tauri::command]
pub fn get_system_traffic_series(state: State<AppState>) -> Vec<TrafficSample> {
    state.traffic.lock().unwrap().series_for(SYSTEM_KEY)
}
