use std::collections::{HashMap, VecDeque};

use super::model::TrafficSample;

/// How many samples to keep per key. At a 1s tick this is a 2-minute window.
const WINDOW_SIZE: usize = 120;

#[derive(Default)]
pub struct TrafficAggregator {
    series: HashMap<String, VecDeque<TrafficSample>>,
    /// Last cumulative (not delta) byte counters seen per key, needed to turn
    /// the monotonically increasing OS counters into per-tick deltas.
    last_cumulative: HashMap<String, (u64, u64)>,
}

impl TrafficAggregator {
    pub fn new() -> Self {
        Self::default()
    }

    /// Records a new cumulative (sent, recv) reading for `key` and returns the
    /// delta sample that was pushed into that key's rolling window, if any
    /// (the first reading for a key has no prior baseline to diff against).
    pub fn record_cumulative(&mut self, key: &str, ts: i64, bytes_sent: u64, bytes_recv: u64) -> Option<TrafficSample> {
        let prev = self.last_cumulative.insert(key.to_string(), (bytes_sent, bytes_recv));
        let (prev_sent, prev_recv) = prev?;

        // Counters can reset (connection re-established, adapter counter wrap);
        // treat a decrease as "no data this tick" rather than underflowing.
        let sent_delta = bytes_sent.saturating_sub(prev_sent);
        let recv_delta = bytes_recv.saturating_sub(prev_recv);

        let sample = TrafficSample {
            ts,
            bytes_sent_delta: sent_delta,
            bytes_recv_delta: recv_delta,
        };

        let buf = self.series.entry(key.to_string()).or_default();
        buf.push_back(sample);
        if buf.len() > WINDOW_SIZE {
            buf.pop_front();
        }

        Some(sample)
    }

    pub fn series_for(&self, key: &str) -> Vec<TrafficSample> {
        self.series.get(key).map(|b| b.iter().copied().collect()).unwrap_or_default()
    }

    /// Drops tracked keys that weren't touched in the current tick (e.g. a
    /// connection closed), so memory doesn't grow unbounded over a long
    /// session.
    pub fn retain_keys(&mut self, live_keys: &std::collections::HashSet<String>) {
        self.series.retain(|k, _| k == super::model::SYSTEM_KEY || live_keys.contains(k));
        self.last_cumulative.retain(|k, _| k == super::model::SYSTEM_KEY || live_keys.contains(k));
    }
}
