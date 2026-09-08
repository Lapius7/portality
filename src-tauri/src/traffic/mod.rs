pub mod adapter;
pub mod aggregator;
pub mod estats;
pub mod model;

use std::collections::HashSet;

use crate::net::model::{Connection, Protocol};

/// Enables EStats collection for any IPv4 TCP connection we haven't seen
/// before, then reads back a cumulative (sent, recv) sample for every
/// connection we can get one for. Called once per poll tick.
pub fn sample_connections(
    connections: &[Connection],
    estats_enabled: &mut HashSet<String>,
) -> Vec<(String, u64, u64)> {
    let mut samples = Vec::new();

    for conn in connections {
        if conn.protocol != Protocol::Tcp {
            continue;
        }
        let (Some(local), Some(remote)) = (conn.local_addr_v4_raw, conn.remote_addr_v4_raw) else {
            continue;
        };

        if estats_enabled.insert(conn.id.clone()) {
            estats::enable(local, conn.local_port, remote, conn.remote_port.unwrap_or(0));
        }

        if let Some((bytes_out, bytes_in)) = estats::read(local, conn.local_port, remote, conn.remote_port.unwrap_or(0)) {
            samples.push((conn.id.clone(), bytes_out, bytes_in));
        }
    }

    samples
}
