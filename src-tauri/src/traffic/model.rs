use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize)]
pub struct TrafficSample {
    pub ts: i64,
    pub bytes_sent_delta: u64,
    pub bytes_recv_delta: u64,
}

/// Special aggregator key carrying whole-machine adapter throughput, used as
/// a fallback sparkline when per-connection attribution isn't available
/// (non-elevated process, or a connection EStats hasn't started reporting yet).
pub const SYSTEM_KEY: &str = "__system__";
