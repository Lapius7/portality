use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    Tcp,
    Udp,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TcpState {
    Closed,
    Listen,
    SynSent,
    SynReceived,
    Established,
    FinWait1,
    FinWait2,
    CloseWait,
    Closing,
    LastAck,
    TimeWait,
    DeleteTcb,
    Unknown,
}

impl TcpState {
    /// Maps the raw `MIB_TCP_STATE` integer returned by the IP Helper API.
    pub fn from_mib(value: u32) -> Self {
        match value {
            1 => TcpState::Closed,
            2 => TcpState::Listen,
            3 => TcpState::SynSent,
            4 => TcpState::SynReceived,
            5 => TcpState::Established,
            6 => TcpState::FinWait1,
            7 => TcpState::FinWait2,
            8 => TcpState::CloseWait,
            9 => TcpState::Closing,
            10 => TcpState::LastAck,
            11 => TcpState::TimeWait,
            12 => TcpState::DeleteTcb,
            _ => TcpState::Unknown,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Connection {
    /// Stable identity for React keys / diffing: protocol + local + remote + pid.
    pub id: String,
    pub protocol: Protocol,
    pub local_addr: String,
    pub local_port: u16,
    pub remote_addr: Option<String>,
    pub remote_port: Option<u16>,
    pub state: Option<TcpState>,
    pub pid: u32,
    pub process_name: Option<String>,
    pub process_path: Option<String>,
    /// Raw network-byte-order IPv4 addresses, present only for IPv4 TCP rows.
    /// Needed to re-query this exact row via the EStats API (which takes a
    /// `MIB_TCPROW`, not a string), so kept out of the serialized JSON.
    #[serde(skip)]
    pub local_addr_v4_raw: Option<u32>,
    #[serde(skip)]
    pub remote_addr_v4_raw: Option<u32>,
}

impl Connection {
    pub fn make_id(protocol: Protocol, local_addr: &str, local_port: u16, remote_addr: Option<&str>, remote_port: Option<u16>, pid: u32) -> String {
        format!(
            "{:?}:{}:{}:{}:{}:{}",
            protocol,
            local_addr,
            local_port,
            remote_addr.unwrap_or("-"),
            remote_port.unwrap_or(0),
            pid
        )
    }
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct ConnectionsDiff {
    pub added: Vec<Connection>,
    pub removed: Vec<String>,
    pub changed: Vec<Connection>,
}
