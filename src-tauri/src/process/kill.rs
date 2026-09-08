use thiserror::Error;

#[derive(Debug, Error, serde::Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum KillError {
    #[error("access denied - the process may belong to another user or require admin rights")]
    AccessDenied,
    #[error("process not found")]
    NotFound,
    #[error("failed to terminate process: {0}")]
    Other(String),
}

#[cfg(windows)]
pub fn kill_process(pid: u32) -> Result<(), KillError> {
    use windows::Win32::Foundation::{CloseHandle, ERROR_ACCESS_DENIED, ERROR_INVALID_PARAMETER};
    use windows::Win32::System::Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE};

    unsafe {
        let handle = OpenProcess(PROCESS_TERMINATE, false, pid).map_err(|e| {
            if e.code() == ERROR_ACCESS_DENIED.to_hresult() {
                KillError::AccessDenied
            } else if e.code() == ERROR_INVALID_PARAMETER.to_hresult() {
                KillError::NotFound
            } else {
                KillError::Other(e.message())
            }
        })?;

        let result = TerminateProcess(handle, 1);
        let _ = CloseHandle(handle);

        result.map_err(|e| {
            if e.code() == ERROR_ACCESS_DENIED.to_hresult() {
                KillError::AccessDenied
            } else {
                KillError::Other(e.message())
            }
        })
    }
}

#[cfg(not(windows))]
pub fn kill_process(_pid: u32) -> Result<(), KillError> {
    Err(KillError::Other("process termination is only supported on Windows".into()))
}
