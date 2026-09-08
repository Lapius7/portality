pub mod enrich;
pub mod iphlpapi;
pub mod model;

use model::Connection;

/// One full snapshot: enumerate connections, then enrich with process metadata.
pub fn snapshot(enricher: &enrich::ProcessEnricher) -> Vec<Connection> {
    let mut connections = iphlpapi::list_all_connections();
    enricher.enrich(&mut connections);
    connections
}
