use std::collections::{HashMap, HashSet};
use std::sync::Mutex;

use crate::net::enrich::ProcessEnricher;
use crate::net::model::Connection;
use crate::persistence::db::Db;
use crate::traffic::aggregator::TrafficAggregator;

pub struct AppState {
    pub enricher: Mutex<ProcessEnricher>,
    /// Last known snapshot keyed by connection id, used to compute diffs in the poller.
    pub last_snapshot: Mutex<HashMap<String, Connection>>,
    pub poll_interval_ms: Mutex<u64>,
    pub traffic: Mutex<TrafficAggregator>,
    pub estats_enabled: Mutex<HashSet<String>>,
    pub db: Db,
    pub history_retention_days: Mutex<u32>,
}

impl AppState {
    pub fn new(db: Db) -> Self {
        Self {
            enricher: Mutex::new(ProcessEnricher::new()),
            last_snapshot: Mutex::new(HashMap::new()),
            poll_interval_ms: Mutex::new(1000),
            traffic: Mutex::new(TrafficAggregator::new()),
            estats_enabled: Mutex::new(HashSet::new()),
            db,
            history_retention_days: Mutex::new(14),
        }
    }
}
