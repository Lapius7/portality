use crate::elevation;
use crate::process::kill::{kill_process as kill_process_impl, KillError};

#[tauri::command]
pub fn kill_process(pid: u32) -> Result<(), KillError> {
    kill_process_impl(pid)
}

#[tauri::command]
pub fn is_elevated() -> bool {
    elevation::is_elevated()
}

#[tauri::command]
pub fn relaunch_as_admin() -> Result<(), String> {
    elevation::relaunch_as_admin()
}
