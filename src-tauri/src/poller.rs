use std::collections::{HashMap, HashSet};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};

use crate::net;
use crate::net::model::ConnectionsDiff;
use crate::persistence::repository::{self, SnapshotRow};
use crate::state::AppState;
use crate::traffic::{self, adapter, model::SYSTEM_KEY};

const PROCESS_REFRESH_EVERY_N_TICKS: u32 = 3;
const HISTORY_WRITE_EVERY_N_TICKS: u32 = 5;
const PRUNE_EVERY_N_TICKS: u32 = 300;

/// Background loop: samples the connection table on a fixed cadence, diffs it
/// against the previous snapshot, samples traffic counters, and periodically
/// persists a history snapshot - all pushed to the frontend via events so it
/// never needs to poll.
pub fn start(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut tick: u32 = 0;
        loop {
            let interval_ms = {
                let state = app.state::<AppState>();
                let ms = *state.poll_interval_ms.lock().unwrap();
                ms
            };

            tick_once(&app, tick);
            tick = tick.wrapping_add(1);

            tokio::time::sleep(Duration::from_millis(interval_ms)).await;
        }
    });
}

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64
}

fn tick_once(app: &AppHandle, tick: u32) {
    let state = app.state::<AppState>();
    let ts = now_ms();

    if tick % PROCESS_REFRESH_EVERY_N_TICKS == 0 {
        state.enricher.lock().unwrap().refresh();
    }

    let current: Vec<_> = {
        let enricher = state.enricher.lock().unwrap();
        net::snapshot(&enricher)
    };
    let current_map: HashMap<String, _> = current.iter().map(|c| (c.id.clone(), c.clone())).collect();

    // --- connection diff -> connections://update ---
    {
        let mut last = state.last_snapshot.lock().unwrap();
        let mut diff = ConnectionsDiff::default();

        for (id, conn) in current_map.iter() {
            match last.get(id) {
                None => diff.added.push(conn.clone()),
                Some(prev) if !same(prev, conn) => diff.changed.push(conn.clone()),
                _ => {}
            }
        }
        for id in last.keys() {
            if !current_map.contains_key(id) {
                diff.removed.push(id.clone());
            }
        }

        if !diff.added.is_empty() || !diff.removed.is_empty() || !diff.changed.is_empty() {
            let _ = app.emit("connections://update", &diff);
        }

        *last = current_map.clone();
    }

    // --- traffic sampling -> traffic://tick ---
    let mut traffic_deltas: HashMap<String, (u64, u64)> = HashMap::new();
    {
        let mut estats_enabled = state.estats_enabled.lock().unwrap();
        let samples = traffic::sample_connections(&current, &mut estats_enabled);

        let mut aggregator = state.traffic.lock().unwrap();
        for (id, bytes_out, bytes_in) in samples {
            if let Some(sample) = aggregator.record_cumulative(&id, ts, bytes_out, bytes_in) {
                traffic_deltas.insert(id, (sample.bytes_sent_delta, sample.bytes_recv_delta));
            }
        }

        if let Some((sent, recv)) = adapter::total_throughput() {
            if let Some(sample) = aggregator.record_cumulative(SYSTEM_KEY, ts, sent, recv) {
                traffic_deltas.insert(SYSTEM_KEY.to_string(), (sample.bytes_sent_delta, sample.bytes_recv_delta));
            }
        }

        let live_ids: HashSet<String> = current.iter().map(|c| c.id.clone()).collect();
        aggregator.retain_keys(&live_ids);
        estats_enabled.retain(|id| live_ids.contains(id));
    }

    if !traffic_deltas.is_empty() {
        let _ = app.emit("traffic://tick", &traffic_deltas);
    }

    // --- periodic history snapshot ---
    if tick % HISTORY_WRITE_EVERY_N_TICKS == 0 && !current.is_empty() {
        let rows: Vec<SnapshotRow> = current
            .iter()
            .map(|conn| {
                let (sent, recv) = traffic_deltas.get(&conn.id).copied().unwrap_or((0, 0));
                SnapshotRow { conn, bytes_sent_delta: sent, bytes_recv_delta: recv }
            })
            .collect();
        if let Err(e) = repository::insert_snapshot(&state.db, ts, &rows) {
            eprintln!("failed to write history snapshot: {e}");
        }
    }

    // --- periodic retention pruning ---
    if tick % PRUNE_EVERY_N_TICKS == 0 && tick > 0 {
        let retention_days = *state.history_retention_days.lock().unwrap() as i64;
        let cutoff = ts - retention_days * 24 * 60 * 60 * 1000;
        if let Err(e) = repository::prune_older_than(&state.db, cutoff) {
            eprintln!("failed to prune history: {e}");
        }
    }
}

fn same(a: &net::model::Connection, b: &net::model::Connection) -> bool {
    a.state == b.state && a.process_name == b.process_name
}
