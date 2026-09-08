//! Whole-machine throughput fallback, available without elevation. Used as
//! the "basic mode" sparkline when per-connection attribution (EStats) isn't
//! available for a given row yet.

#[cfg(windows)]
pub fn total_throughput() -> Option<(u64, u64)> {
    use windows::Win32::NetworkManagement::IpHelper::{FreeMibTable, GetIfTable2, MIB_IF_TABLE2};

    unsafe {
        let mut table_ptr: *mut MIB_IF_TABLE2 = std::ptr::null_mut();
        if GetIfTable2(&mut table_ptr).is_err() || table_ptr.is_null() {
            return None;
        }

        let table = &*table_ptr;
        let count = table.NumEntries as usize;
        let rows = std::slice::from_raw_parts(table.Table.as_ptr(), count);

        // Note: this intentionally does not filter out loopback/pseudo
        // interfaces (the exact bitfield accessor for that varies across
        // windows-rs versions) - the basic-mode sparkline may include a
        // small amount of local loopback traffic as a result.
        let mut sent = 0u64;
        let mut recv = 0u64;
        for row in rows {
            sent += row.OutOctets;
            recv += row.InOctets;
        }

        FreeMibTable(table_ptr as *const _);
        Some((sent, recv))
    }
}

#[cfg(not(windows))]
pub fn total_throughput() -> Option<(u64, u64)> {
    use std::time::{SystemTime, UNIX_EPOCH};
    // Deterministic-ish fake counter for non-Windows dev builds so the traffic
    // pipeline can be exercised end-to-end off-target.
    let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    Some((t * 1200, t * 3400))
}
