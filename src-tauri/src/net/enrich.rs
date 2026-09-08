use std::collections::HashMap;
use sysinfo::{Pid, System};

use super::model::Connection;

/// Caches the process table and refreshes it on a slower cadence than the
/// connection poll, since processes churn far less often than connections.
pub struct ProcessEnricher {
    system: System,
}

impl ProcessEnricher {
    pub fn new() -> Self {
        let mut system = System::new();
        system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        Self { system }
    }

    pub fn refresh(&mut self) {
        self.system
            .refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    }

    pub fn enrich(&self, connections: &mut [Connection]) {
        let mut cache: HashMap<u32, (Option<String>, Option<String>)> = HashMap::new();
        for conn in connections.iter_mut() {
            let entry = cache.entry(conn.pid).or_insert_with(|| {
                self.system
                    .process(Pid::from_u32(conn.pid))
                    .map(|p| {
                        let name = p.name().to_string_lossy().to_string();
                        let path = p.exe().map(|p| p.to_string_lossy().to_string());
                        (Some(name), path)
                    })
                    .unwrap_or((None, None))
            });
            conn.process_name = entry.0.clone();
            conn.process_path = entry.1.clone();
        }
    }
}

impl Default for ProcessEnricher {
    fn default() -> Self {
        Self::new()
    }
}
