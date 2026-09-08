use rusqlite::{params, ToSql};
use serde::{Deserialize, Serialize};

use crate::net::model::Connection;

use super::db::Db;

#[derive(Debug, Clone, Serialize)]
pub struct HistoryRow {
    pub id: i64,
    pub ts: i64,
    pub protocol: String,
    pub local_addr: String,
    pub local_port: u16,
    pub remote_addr: Option<String>,
    pub remote_port: Option<u16>,
    pub state: Option<String>,
    pub pid: u32,
    pub process_name: Option<String>,
    pub bytes_sent_delta: u64,
    pub bytes_recv_delta: u64,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryFilter {
    pub from_ts: Option<i64>,
    pub to_ts: Option<i64>,
    pub protocol: Option<String>,
    pub port: Option<u16>,
    pub process: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    500
}

/// One connection observation to persist, paired with the traffic delta
/// measured for it during the same tick (0 if traffic sampling had nothing
/// yet for this connection).
pub struct SnapshotRow<'a> {
    pub conn: &'a Connection,
    pub bytes_sent_delta: u64,
    pub bytes_recv_delta: u64,
}

pub fn insert_snapshot(db: &Db, ts: i64, rows: &[SnapshotRow]) -> rusqlite::Result<()> {
    db.with(|conn| {
        let tx = conn.unchecked_transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO port_events
                 (ts, protocol, local_addr, local_port, remote_addr, remote_port, state, pid, process_name, bytes_sent_delta, bytes_recv_delta)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            )?;
            for row in rows {
                let c = row.conn;
                stmt.execute(params![
                    ts,
                    format!("{:?}", c.protocol).to_lowercase(),
                    c.local_addr,
                    c.local_port,
                    c.remote_addr,
                    c.remote_port,
                    c.state.map(|s| format!("{:?}", s)),
                    c.pid,
                    c.process_name,
                    row.bytes_sent_delta as i64,
                    row.bytes_recv_delta as i64,
                ])?;
            }
        }
        tx.commit()
    })
}

pub fn query_history(db: &Db, filter: &HistoryFilter) -> rusqlite::Result<Vec<HistoryRow>> {
    db.with(|conn| {
        let mut clauses: Vec<String> = Vec::new();
        let mut params: Vec<Box<dyn ToSql>> = Vec::new();

        if let Some(from_ts) = filter.from_ts {
            clauses.push("ts >= ?".into());
            params.push(Box::new(from_ts));
        }
        if let Some(to_ts) = filter.to_ts {
            clauses.push("ts <= ?".into());
            params.push(Box::new(to_ts));
        }
        if let Some(protocol) = &filter.protocol {
            clauses.push("protocol = ?".into());
            params.push(Box::new(protocol.clone()));
        }
        if let Some(port) = filter.port {
            clauses.push("local_port = ?".into());
            params.push(Box::new(port));
        }
        if let Some(process) = &filter.process {
            clauses.push("process_name LIKE ?".into());
            params.push(Box::new(format!("%{process}%")));
        }

        let where_clause = if clauses.is_empty() { String::new() } else { format!("WHERE {}", clauses.join(" AND ")) };
        let sql = format!(
            "SELECT id, ts, protocol, local_addr, local_port, remote_addr, remote_port, state, pid, process_name, bytes_sent_delta, bytes_recv_delta
             FROM port_events {where_clause} ORDER BY ts DESC LIMIT ? OFFSET ?"
        );
        params.push(Box::new(filter.limit));
        params.push(Box::new(filter.offset));

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| {
            Ok(HistoryRow {
                id: row.get(0)?,
                ts: row.get(1)?,
                protocol: row.get(2)?,
                local_addr: row.get(3)?,
                local_port: row.get(4)?,
                remote_addr: row.get(5)?,
                remote_port: row.get(6)?,
                state: row.get(7)?,
                pid: row.get(8)?,
                process_name: row.get(9)?,
                bytes_sent_delta: row.get::<_, i64>(10)? as u64,
                bytes_recv_delta: row.get::<_, i64>(11)? as u64,
            })
        })?;

        rows.collect()
    })
}

pub fn prune_older_than(db: &Db, cutoff_ts: i64) -> rusqlite::Result<usize> {
    db.with(|conn| conn.execute("DELETE FROM port_events WHERE ts < ?1", params![cutoff_ts]))
}

pub fn clear_all(db: &Db) -> rusqlite::Result<usize> {
    db.with(|conn| conn.execute("DELETE FROM port_events", []))
}
