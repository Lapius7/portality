#[cfg(windows)]
pub fn is_elevated() -> bool {
    use windows::Win32::Foundation::{CloseHandle, HANDLE};
    use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
    use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token = HANDLE::default();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }

        let mut elevation = TOKEN_ELEVATION::default();
        let mut returned_len = 0u32;
        let size = std::mem::size_of::<TOKEN_ELEVATION>() as u32;
        let ok = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut _),
            size,
            &mut returned_len,
        )
        .is_ok();
        let _ = CloseHandle(token);

        ok && elevation.TokenIsElevated != 0
    }
}

#[cfg(windows)]
pub fn relaunch_as_admin() -> Result<(), String> {
    use std::env;
    use windows::core::HSTRING;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let exe = env::current_exe().map_err(|e| e.to_string())?;
    let exe_hstr = HSTRING::from(exe.as_os_str());
    let verb = HSTRING::from("runas");

    unsafe {
        let result = ShellExecuteW(None, &verb, &exe_hstr, None, None, SW_SHOWNORMAL);
        // ShellExecuteW returns a value > 32 on success.
        if (result.0 as isize) <= 32 {
            return Err("failed to relaunch with elevation".into());
        }
    }
    Ok(())
}

#[cfg(not(windows))]
pub fn is_elevated() -> bool {
    false
}

#[cfg(not(windows))]
pub fn relaunch_as_admin() -> Result<(), String> {
    Err("elevation is only supported on Windows".into())
}
