CREATE TABLE IF NOT EXISTS port_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    protocol TEXT NOT NULL,
    local_addr TEXT NOT NULL,
    local_port INTEGER NOT NULL,
    remote_addr TEXT,
    remote_port INTEGER,
    state TEXT,
    pid INTEGER NOT NULL,
    process_name TEXT,
    bytes_sent_delta INTEGER NOT NULL DEFAULT 0,
    bytes_recv_delta INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_port_events_ts ON port_events(ts);
CREATE INDEX IF NOT EXISTS idx_port_events_port ON port_events(local_port);
CREATE INDEX IF NOT EXISTS idx_port_events_process ON port_events(process_name);
