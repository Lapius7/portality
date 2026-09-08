//! Windows IP Helper API bindings: enumerates TCP/UDP connections with owning PIDs.
//! GetExtendedTcpTable / GetExtendedUdpTable have no equivalent on other platforms,
//! so a mock implementation is provided for non-Windows builds (used for UI dev only).

use super::model::{Connection, Protocol, TcpState};

#[cfg(windows)]
mod win {
    use super::*;
    use std::net::{Ipv4Addr, Ipv6Addr};
    use windows::Win32::Foundation::{ERROR_INSUFFICIENT_BUFFER, NO_ERROR};
    use windows::Win32::NetworkManagement::IpHelper::{
        GetExtendedTcpTable, GetExtendedUdpTable, MIB_TCPROW_OWNER_PID, MIB_TCPTABLE_OWNER_PID,
        MIB_TCP6ROW_OWNER_PID, MIB_TCP6TABLE_OWNER_PID, MIB_UDPROW_OWNER_PID,
        MIB_UDPTABLE_OWNER_PID, MIB_UDP6ROW_OWNER_PID, MIB_UDP6TABLE_OWNER_PID,
        TCP_TABLE_OWNER_PID_ALL, UDP_TABLE_OWNER_PID,
    };
    use windows::Win32::Networking::WinSock::{AF_INET, AF_INET6};

    /// Calls `f` with a growing buffer until it reports success, mirroring the
    /// standard "call once for size, then again to fill" IP Helper API pattern.
    fn fetch_table<F: Fn(*mut core::ffi::c_void, &mut u32) -> u32>(f: F) -> Vec<u8> {
        let mut size: u32 = 0;
        let mut buf: Vec<u8> = Vec::new();
        loop {
            let result = f(buf.as_mut_ptr() as *mut _, &mut size);
            if result == NO_ERROR.0 {
                buf.truncate(size as usize);
                return buf;
            }
            if result == ERROR_INSUFFICIENT_BUFFER.0 {
                buf = vec![0u8; size as usize];
                continue;
            }
            return Vec::new();
        }
    }

    fn tcp_state_to_port(port_be: u32) -> u16 {
        // Ports in these structs are stored big-endian in the low 16 bits.
        u16::from_be((port_be & 0xFFFF) as u16)
    }

    pub fn list_tcp4() -> Vec<Connection> {
        let buf = fetch_table(|ptr, size| unsafe {
            GetExtendedTcpTable(Some(ptr), size, false, AF_INET.0 as u32, TCP_TABLE_OWNER_PID_ALL, 0)
        });
        if buf.is_empty() {
            return Vec::new();
        }
        let table = buf.as_ptr() as *const MIB_TCPTABLE_OWNER_PID;
        let num_entries = unsafe { (*table).dwNumEntries } as usize;
        let rows_ptr = unsafe { (*table).table.as_ptr() as *const MIB_TCPROW_OWNER_PID };
        (0..num_entries)
            .map(|i| {
                let row = unsafe { &*rows_ptr.add(i) };
                let local_addr = Ipv4Addr::from(u32::from_be(row.dwLocalAddr)).to_string();
                let remote_addr = Ipv4Addr::from(u32::from_be(row.dwRemoteAddr));
                Connection {
                    id: String::new(),
                    protocol: Protocol::Tcp,
                    local_addr,
                    local_port: tcp_state_to_port(row.dwLocalPort),
                    remote_addr: Some(remote_addr.to_string()),
                    remote_port: Some(tcp_state_to_port(row.dwRemotePort)),
                    state: Some(TcpState::from_mib(row.dwState)),
                    pid: row.dwOwningPid,
                    process_name: None,
                    process_path: None,
                    local_addr_v4_raw: Some(row.dwLocalAddr),
                    remote_addr_v4_raw: Some(row.dwRemoteAddr),
                }
            })
            .collect()
    }

    pub fn list_tcp6() -> Vec<Connection> {
        let buf = fetch_table(|ptr, size| unsafe {
            GetExtendedTcpTable(Some(ptr), size, false, AF_INET6.0 as u32, TCP_TABLE_OWNER_PID_ALL, 0)
        });
        if buf.is_empty() {
            return Vec::new();
        }
        let table = buf.as_ptr() as *const MIB_TCP6TABLE_OWNER_PID;
        let num_entries = unsafe { (*table).dwNumEntries } as usize;
        let rows_ptr = unsafe { (*table).table.as_ptr() as *const MIB_TCP6ROW_OWNER_PID };
        (0..num_entries)
            .map(|i| {
                let row = unsafe { &*rows_ptr.add(i) };
                let local_addr = Ipv6Addr::from(row.ucLocalAddr).to_string();
                let remote_addr = Ipv6Addr::from(row.ucRemoteAddr);
                Connection {
                    id: String::new(),
                    protocol: Protocol::Tcp,
                    local_addr,
                    local_port: tcp_state_to_port(row.dwLocalPort),
                    remote_addr: Some(remote_addr.to_string()),
                    remote_port: Some(tcp_state_to_port(row.dwRemotePort)),
                    state: Some(TcpState::from_mib(row.dwState)),
                    pid: row.dwOwningPid,
                    process_name: None,
                    process_path: None,
                    local_addr_v4_raw: None,
                    remote_addr_v4_raw: None,
                }
            })
            .collect()
    }

    pub fn list_udp4() -> Vec<Connection> {
        let buf = fetch_table(|ptr, size| unsafe {
            GetExtendedUdpTable(Some(ptr), size, false, AF_INET.0 as u32, UDP_TABLE_OWNER_PID, 0)
        });
        if buf.is_empty() {
            return Vec::new();
        }
        let table = buf.as_ptr() as *const MIB_UDPTABLE_OWNER_PID;
        let num_entries = unsafe { (*table).dwNumEntries } as usize;
        let rows_ptr = unsafe { (*table).table.as_ptr() as *const MIB_UDPROW_OWNER_PID };
        (0..num_entries)
            .map(|i| {
                let row = unsafe { &*rows_ptr.add(i) };
                let local_addr = Ipv4Addr::from(u32::from_be(row.dwLocalAddr)).to_string();
                Connection {
                    id: String::new(),
                    protocol: Protocol::Udp,
                    local_addr,
                    local_port: tcp_state_to_port(row.dwLocalPort),
                    remote_addr: None,
                    remote_port: None,
                    state: None,
                    pid: row.dwOwningPid,
                    process_name: None,
                    process_path: None,
                    local_addr_v4_raw: None,
                    remote_addr_v4_raw: None,
                }
            })
            .collect()
    }

    pub fn list_udp6() -> Vec<Connection> {
        let buf = fetch_table(|ptr, size| unsafe {
            GetExtendedUdpTable(Some(ptr), size, false, AF_INET6.0 as u32, UDP_TABLE_OWNER_PID, 0)
        });
        if buf.is_empty() {
            return Vec::new();
        }
        let table = buf.as_ptr() as *const MIB_UDP6TABLE_OWNER_PID;
        let num_entries = unsafe { (*table).dwNumEntries } as usize;
        let rows_ptr = unsafe { (*table).table.as_ptr() as *const MIB_UDP6ROW_OWNER_PID };
        (0..num_entries)
            .map(|i| {
                let row = unsafe { &*rows_ptr.add(i) };
                let local_addr = Ipv6Addr::from(row.ucLocalAddr).to_string();
                Connection {
                    id: String::new(),
                    protocol: Protocol::Udp,
                    local_addr,
                    local_port: tcp_state_to_port(row.dwLocalPort),
                    remote_addr: None,
                    remote_port: None,
                    state: None,
                    pid: row.dwOwningPid,
                    process_name: None,
                    process_path: None,
                    local_addr_v4_raw: None,
                    remote_addr_v4_raw: None,
                }
            })
            .collect()
    }
}

#[cfg(not(windows))]
mod mock {
    use super::*;

    /// Non-Windows builds (used only for frontend/dev work off-target) return a
    /// small fixed sample so the UI has something to render.
    pub fn list_all() -> Vec<Connection> {
        vec![
            Connection {
                id: String::new(),
                protocol: Protocol::Tcp,
                local_addr: "0.0.0.0".into(),
                local_port: 1420,
                remote_addr: None,
                remote_port: None,
                state: Some(TcpState::Listen),
                pid: 1234,
                process_name: Some("node".into()),
                process_path: None,
                local_addr_v4_raw: None,
                remote_addr_v4_raw: None,
            },
            Connection {
                id: String::new(),
                protocol: Protocol::Tcp,
                local_addr: "127.0.0.1".into(),
                local_port: 51820,
                remote_addr: Some("93.184.216.34".into()),
                remote_port: Some(443),
                state: Some(TcpState::Established),
                pid: 4321,
                process_name: Some("chrome".into()),
                process_path: None,
                local_addr_v4_raw: None,
                remote_addr_v4_raw: None,
            },
            Connection {
                id: String::new(),
                protocol: Protocol::Udp,
                local_addr: "0.0.0.0".into(),
                local_port: 53,
                remote_addr: None,
                remote_port: None,
                state: None,
                pid: 999,
                process_name: Some("dnscache".into()),
                process_path: None,
                local_addr_v4_raw: None,
                remote_addr_v4_raw: None,
            },
        ]
    }
}

/// Enumerates every TCP (v4+v6) and UDP (v4+v6) connection currently owned by a
/// process on this machine. Process name/path enrichment happens separately.
pub fn list_all_connections() -> Vec<Connection> {
    #[cfg(windows)]
    {
        let mut all = Vec::new();
        all.extend(win::list_tcp4());
        all.extend(win::list_tcp6());
        all.extend(win::list_udp4());
        all.extend(win::list_udp6());
        for conn in &mut all {
            conn.id = Connection::make_id(
                conn.protocol,
                &conn.local_addr,
                conn.local_port,
                conn.remote_addr.as_deref(),
                conn.remote_port,
                conn.pid,
            );
        }
        all
    }
    #[cfg(not(windows))]
    {
        let mut all = mock::list_all();
        for conn in &mut all {
            conn.id = Connection::make_id(
                conn.protocol,
                &conn.local_addr,
                conn.local_port,
                conn.remote_addr.as_deref(),
                conn.remote_port,
                conn.pid,
            );
        }
        all
    }
}
