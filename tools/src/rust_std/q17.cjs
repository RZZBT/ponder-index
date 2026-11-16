// Rust standard library: Ipv6Addr, socket addresses, and TCP (TcpListener/TcpStream). TCP truth checks connect to
// a listener on 127.0.0.1 with a port picked by the OS, so they are self-contained.
const { group } = require('./kit.cjs');
const IP = (o) => ['core', o, /net\/ip_addr\.rs$/];
const SA = (o) => ['core', o, /net\/socket_addr\.rs$/];
const PARSE = (o) => ['core', o, /net\/parser\.rs$/];
const TCP = (o) => ['std', o, /net\/tcp\.rs$/];
const { list, add } = group({ at: IP('Ipv6Addr') });
const V6 = 'std::net::Ipv6Addr';
const V4 = 'std::net::Ipv4Addr';
const SAD = 'std::net::SocketAddr';
const PAIR = 'use std::io::{Read, Write}; let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let addr = l.local_addr().unwrap(); let mut c = std::net::TcpStream::connect(addr).unwrap(); let (mut s, _) = l.accept().unwrap(); ';

// ---------------------------------------------------------------- Ipv6Addr

add('ipv6/new', 'new', null, 'How Ipv6Addr::new works', 'An IPv6 address from its eight 16-bit groups.', {
  rows: [['0x2001, 0xdb8, 0, 0, 0, 0, 0, 1']], call: 'Ipv6Addr::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 1)', note: '8 × u16', outs: ['2001:db8::1'],
  intro: 'Runs of zero groups are shortened to :: when printed.',
  steps: [['Eight groups.', 0], ['Printed compactly.', [], 'o0']],
  result: '2001:db8::1', resultCap: 'Ipv6Addr::LOCALHOST is ::1.',
}, `${V6}::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 1).to_string()`);

add('ipv6/from_str', 'from_str', PARSE('Ipv6Addr'), 'How parse works for Ipv6Addr', 'Parses text like "fe80::1" into an address.', {
  rows: [['"fe80::1"', '"fe80:::1"']], call: '"fe80::1".parse::<Ipv6Addr>()', note: 'validated', outs: ['Ok(fe80::1)', 'Err'],
  intro: ':: may appear only once.',
  steps: [['Valid: Ok.', 0, 'o0'], ['Triple colon: Err.', 1, 'o1']],
  result: 'Ok(fe80::1), Err', resultCap: 'Brackets are only for socket addresses: "[::1]:80".',
}, `format!("{:?}, {}", "fe80::1".parse::<${V6}>(), if "fe80:::1".parse::<${V6}>().is_err() { "Err" } else { "Ok" })`);

add('ipv6/segments', 'segments', null, 'How Ipv6Addr::segments works', 'The eight 16-bit groups of the address.', {
  rows: [['::1']], call: 'ip.segments()', note: '[u16; 8]', outs: ['[0, 0, 0, 0, 0, 0, 0, 1]'],
  intro: 'The :: expands to the missing zero groups.',
  steps: [['::1 is mostly zeros.', 0], ['The last group is 1.', [], 'o0']],
  result: '[0, 0, 0, 0, 0, 0, 0, 1]', resultCap: 'octets() gives 16 bytes instead.',
}, `d(${V6}::LOCALHOST.segments())`);

add('ipv6/octets', 'octets', null, 'How Ipv6Addr::octets works', 'The 16 bytes of the address.', {
  rows: [['::1']], call: 'ip.octets()', note: '[u8; 16]', outs: ['15 zeros, then 1'],
  intro: 'Network byte order.',
  steps: [['16 bytes.', 0], ['Only the last is 1.', [], 'o0']],
  result: '[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]', resultCap: 'to_bits gives one u128.',
}, `d(${V6}::LOCALHOST.octets())`);

add('ipv6/to_bits', 'to_bits', null, 'How Ipv6Addr::to_bits works', 'The address as one u128.', {
  rows: [['::ff']], call: 'ip.to_bits()', note: 'number form', outs: ['255'],
  intro: 'Useful for prefix masks.',
  steps: [['::ff.', 0], ['= 255.', [], 'o0']],
  result: '255', resultCap: 'from_bits goes back.',
}, `"::ff".parse::<${V6}>().unwrap().to_bits().to_string()`);

add('ipv6/from_bits', 'from_bits', null, 'How Ipv6Addr::from_bits works', 'An address from a u128.', {
  rows: [['1']], call: 'Ipv6Addr::from_bits(1)', note: 'number → address', outs: ['::1'],
  intro: 'The lowest bits are the last group.',
  steps: [['The number 1.', 0], ['::1.', [], 'o0']],
  result: '::1', resultCap: 'Pairs with to_bits.',
}, `${V6}::from_bits(1).to_string()`);

add('ipv6/is_loopback', 'is_loopback', null, 'How Ipv6Addr::is_loopback works', 'true only for ::1.', {
  rows: [['::1', '::2']], call: 'ip.is_loopback()', note: 'one address only', outs: ['true', 'false'],
  intro: 'Unlike IPv4, there is a single loopback address.',
  steps: [['::1: true.', 0, 'o0'], ['::2: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'IpAddr::is_loopback covers both families.',
}, `format!("{}, {}", ${V6}::LOCALHOST.is_loopback(), "::2".parse::<${V6}>().unwrap().is_loopback())`);

add('ipv6/is_unspecified', 'is_unspecified', null, 'How Ipv6Addr::is_unspecified works', 'true for :: (all zeros).', {
  rows: [['::']], call: 'ip.is_unspecified()', note: '"any address"', outs: ['true'],
  intro: 'Binding to :: listens on every IPv6 interface.',
  steps: [['All zeros.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Ipv6Addr::UNSPECIFIED is the constant.',
}, `${V6}::UNSPECIFIED.is_unspecified().to_string()`);

add('ipv6/is_multicast', 'is_multicast', null, 'How Ipv6Addr::is_multicast works', 'true for addresses starting with ff.', {
  rows: [['ff02::1', '2001:db8::1']], call: 'ip.is_multicast()', note: 'group addresses', outs: ['true', 'false'],
  intro: 'ff02::1 means "all nodes on this link".',
  steps: [['ff02::1: true.', 0, 'o0'], ['2001:db8::1: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Used by IPv6 neighbour discovery.',
}, `format!("{}, {}", "ff02::1".parse::<${V6}>().unwrap().is_multicast(), "2001:db8::1".parse::<${V6}>().unwrap().is_multicast())`);

add('ipv6/is_unique_local', 'is_unique_local', null, 'How Ipv6Addr::is_unique_local works', 'true for fc00::/7, the IPv6 equivalent of private addresses.', {
  rows: [['fd12::1', '2001:db8::1']], call: 'ip.is_unique_local()', note: 'not routed on the internet', outs: ['true', 'false'],
  intro: 'Like 10.x or 192.168.x in IPv4.',
  steps: [['fd12::1: true.', 0, 'o0'], ['2001:db8::1: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Used inside companies and home labs.',
}, `format!("{}, {}", "fd12::1".parse::<${V6}>().unwrap().is_unique_local(), "2001:db8::1".parse::<${V6}>().unwrap().is_unique_local())`);

add('ipv6/is_unicast_link_local', 'is_unicast_link_local', null, 'How Ipv6Addr::is_unicast_link_local works', 'true for fe80::/10, valid only on the local link.', {
  rows: [['fe80::1']], call: 'ip.is_unicast_link_local()', note: 'every interface has one', outs: ['true'],
  intro: 'Automatically assigned; never routed beyond the link.',
  steps: [['fe80::1.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Often needs a scope id (%eth0) to use.',
}, `"fe80::1".parse::<${V6}>().unwrap().is_unicast_link_local().to_string()`);

add('ipv6/to_ipv4_mapped', 'to_ipv4_mapped', null, 'How Ipv6Addr::to_ipv4_mapped works', 'The IPv4 address inside an IPv4-mapped IPv6 address.', {
  rows: [['::ffff:1.2.3.4', '2001:db8::1']], call: 'ip.to_ipv4_mapped()', note: 'Option<Ipv4Addr>', outs: ['Some(1.2.3.4)', 'None'],
  intro: 'Mapped addresses look like ::ffff:a.b.c.d.',
  steps: [['Mapped: Some.', 0, 'o0'], ['Normal IPv6: None.', 1, 'o1']],
  result: 'Some(1.2.3.4), None', resultCap: 'to_canonical does this inside IpAddr.',
}, `format!("{:?}, {:?}", "::ffff:1.2.3.4".parse::<${V6}>().unwrap().to_ipv4_mapped(), "2001:db8::1".parse::<${V6}>().unwrap().to_ipv4_mapped())`);

add('ipv6/to_canonical', 'to_canonical', null, 'How Ipv6Addr::to_canonical works', 'An IpAddr: V4 if the address is IPv4-mapped, otherwise V6.', {
  rows: [['::ffff:10.1.1.1']], call: 'ip.to_canonical()', note: 'normalise', outs: ['V4(10.1.1.1)'],
  intro: 'Handy for logging client addresses on dual-stack servers.',
  steps: [['A mapped address.', 0], ['Returned as IPv4.', [], 'o0']],
  result: '10.1.1.1', resultCap: 'Other addresses stay V6.',
}, `"::ffff:10.1.1.1".parse::<${V6}>().unwrap().to_canonical().to_string()`);

// ---------------------------------------------------------------- socket addresses

add('socketaddr/new', 'new', SA('SocketAddr'), 'How SocketAddr::new works', 'An IP address plus a port.', {
  rows: [['127.0.0.1', '8080']], call: 'SocketAddr::new(ip, 8080)', note: 'where to connect', outs: ['127.0.0.1:8080'],
  intro: 'Works with IPv4 and IPv6.',
  steps: [['Address and port.', [0, 1]], ['Printed as ip:port.', [], 'o0']],
  result: '127.0.0.1:8080', resultCap: 'IPv6 prints with brackets: [::1]:8080.',
}, `${SAD}::new("127.0.0.1".parse().unwrap(), 8080).to_string()`);

add('socketaddr/ip', 'ip', SA('SocketAddr'), 'How SocketAddr::ip works', 'The IP part of a socket address.', {
  rows: [['"10.0.0.5:22"']], call: 'addr.ip()', note: 'without the port', outs: ['10.0.0.5'],
  intro: 'Returns an IpAddr.',
  steps: [['Split off the port.', 0], ['10.0.0.5.', [], 'o0']],
  result: '10.0.0.5', resultCap: 'port() gives the other half.',
}, `"10.0.0.5:22".parse::<${SAD}>().unwrap().ip().to_string()`);

add('socketaddr/port', 'port', SA('SocketAddr'), 'How SocketAddr::port works', 'The port number.', {
  rows: [['"[::1]:443"']], call: 'addr.port()', note: 'u16', outs: ['443'],
  intro: 'Ports range from 0 to 65535.',
  steps: [['The port part.', 0], ['443.', [], 'o0']],
  result: '443', resultCap: 'Port 0 asks the OS to pick a free one.',
}, `"[::1]:443".parse::<${SAD}>().unwrap().port().to_string()`);

add('socketaddr/set_port', 'set_port', SA('SocketAddr'), 'How SocketAddr::set_port works', 'Changes the port.', {
  rows: [['127.0.0.1:80']], call: 'addr.set_port(8080)', note: 'same IP', outs: ['127.0.0.1:8080'],
  intro: 'The IP stays the same.',
  steps: [['Port 80.', 0], ['Now 8080.', [], 'o0']],
  result: '127.0.0.1:8080', resultCap: 'set_ip changes the address part.',
}, `let mut a: ${SAD} = "127.0.0.1:80".parse().unwrap(); a.set_port(8080); a.to_string()`);

add('socketaddr/set_ip', 'set_ip', SA('SocketAddr'), 'How SocketAddr::set_ip works', 'Changes the IP address, keeping the port.', {
  rows: [['127.0.0.1:80']], call: 'addr.set_ip("10.0.0.1".parse()?)', note: 'same port', outs: ['10.0.0.1:80'],
  intro: 'May even switch between IPv4 and IPv6.',
  steps: [['Port 80 stays.', 0], ['New address.', [], 'o0']],
  result: '10.0.0.1:80', resultCap: 'Useful when rewriting configuration.',
}, `let mut a: ${SAD} = "127.0.0.1:80".parse().unwrap(); a.set_ip("10.0.0.1".parse().unwrap()); a.to_string()`);

add('socketaddr/is_ipv4', 'is_ipv4', SA('SocketAddr'), 'How SocketAddr::is_ipv4 works', 'true if the address part is IPv4.', {
  rows: [['1.2.3.4:5', '[::1]:5']], call: 'addr.is_ipv4()', note: 'which family?', outs: ['true', 'false'],
  intro: 'SocketAddr is V4 or V6.',
  steps: [['V4: true.', 0, 'o0'], ['V6: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_ipv6 is the opposite.',
}, `format!("{}, {}", "1.2.3.4:5".parse::<${SAD}>().unwrap().is_ipv4(), "[::1]:5".parse::<${SAD}>().unwrap().is_ipv4())`);

add('socketaddr/is_ipv6', 'is_ipv6', SA('SocketAddr'), 'How SocketAddr::is_ipv6 works', 'true if the address part is IPv6.', {
  rows: [['[::1]:5']], call: 'addr.is_ipv6()', note: 'which family?', outs: ['true'],
  intro: 'IPv6 socket addresses are written in brackets.',
  steps: [['[::1]:5 is IPv6.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Match on SocketAddr::V6 for flowinfo and scope id.',
}, `"[::1]:5".parse::<${SAD}>().unwrap().is_ipv6().to_string()`);

add('socketaddr_v4/new', 'new', SA('SocketAddrV4'), 'How SocketAddrV4::new works', 'An IPv4 address plus a port.', {
  rows: [['Ipv4Addr::LOCALHOST', '3000']], call: 'SocketAddrV4::new(Ipv4Addr::LOCALHOST, 3000)', note: 'IPv4 only', outs: ['127.0.0.1:3000'],
  intro: 'The specific type when you know it is IPv4.',
  steps: [['Address and port.', [0, 1]], ['127.0.0.1:3000.', [], 'o0']],
  result: '127.0.0.1:3000', resultCap: 'Converts into SocketAddr with .into().',
}, `std::net::SocketAddrV4::new(${V4}::LOCALHOST, 3000).to_string()`);

add('socketaddr_v4/from_str', 'from_str', PARSE('SocketAddrV4'), 'How parse works for SocketAddrV4', 'Parses "a.b.c.d:port".', {
  rows: [['"192.168.0.2:53"']], call: 's.parse::<SocketAddrV4>()', note: 'IPv4 only', outs: ['Ok(192.168.0.2:53)'],
  intro: 'IPv6 text is rejected.',
  steps: [['Address and port.', 0], ['Ok.', [], 'o0']],
  result: 'Ok(192.168.0.2:53)', resultCap: 'SocketAddr accepts both families.',
}, 'd("192.168.0.2:53".parse::<std::net::SocketAddrV4>())');

add('socketaddr_v4/ip', 'ip', SA('SocketAddrV4'), 'How SocketAddrV4::ip works', 'The Ipv4Addr part.', {
  rows: [['10.0.0.1:80']], call: 'addr.ip()', note: '&Ipv4Addr', outs: ['10.0.0.1'],
  intro: 'Returns a reference to the address.',
  steps: [['Drop the port.', 0], ['10.0.0.1.', [], 'o0']],
  result: '10.0.0.1', resultCap: 'Then use Ipv4Addr methods.',
}, `std::net::SocketAddrV4::new(${V4}::new(10, 0, 0, 1), 80).ip().to_string()`);

add('socketaddr_v4/port', 'port', SA('SocketAddrV4'), 'How SocketAddrV4::port works', 'The port of an IPv4 socket address.', {
  rows: [['10.0.0.1:80']], call: 'addr.port()', note: 'u16', outs: ['80'],
  intro: 'The second half of the address.',
  steps: [['The port part.', 0], ['80.', [], 'o0']],
  result: '80', resultCap: 'set_port changes it.',
}, `std::net::SocketAddrV4::new(${V4}::new(10, 0, 0, 1), 80).port().to_string()`);

add('socketaddr_v4/set_port', 'set_port', SA('SocketAddrV4'), 'How SocketAddrV4::set_port works', 'Changes the port of an IPv4 socket address.', {
  rows: [['10.0.0.1:80']], call: 'addr.set_port(81)', note: 'in place', outs: ['10.0.0.1:81'],
  intro: 'The address stays the same.',
  steps: [['Port 80.', 0], ['Now 81.', [], 'o0']],
  result: '10.0.0.1:81', resultCap: 'set_ip changes the address.',
}, `let mut a = std::net::SocketAddrV4::new(${V4}::new(10, 0, 0, 1), 80); a.set_port(81); a.to_string()`);

add('socketaddr_v4/set_ip', 'set_ip', SA('SocketAddrV4'), 'How SocketAddrV4::set_ip works', 'Changes the IPv4 address, keeping the port.', {
  rows: [['10.0.0.1:80']], call: 'addr.set_ip(Ipv4Addr::LOCALHOST)', note: 'in place', outs: ['127.0.0.1:80'],
  intro: 'The port is unchanged.',
  steps: [['Old address.', 0], ['Replaced by 127.0.0.1.', [], 'o0']],
  result: '127.0.0.1:80', resultCap: 'Pairs with set_port.',
}, `let mut a = std::net::SocketAddrV4::new(${V4}::new(10, 0, 0, 1), 80); a.set_ip(${V4}::LOCALHOST); a.to_string()`);

add('socketaddr_v6/new', 'new', SA('SocketAddrV6'), 'How SocketAddrV6::new works', 'An IPv6 address, port, flow info and scope id.', {
  rows: [['::1', '9000', '0', '0']], call: 'SocketAddrV6::new(Ipv6Addr::LOCALHOST, 9000, 0, 0)', note: 'IPv6 only', outs: ['[::1]:9000'],
  intro: 'flowinfo and scope_id are usually 0.',
  steps: [['Four parts.', [0, 1, 2, 3]], ['Printed with brackets.', [], 'o0']],
  result: '[::1]:9000', resultCap: 'A non-zero scope id prints as %n.',
}, `std::net::SocketAddrV6::new(${V6}::LOCALHOST, 9000, 0, 0).to_string()`);

add('socketaddr_v6/from_str', 'from_str', PARSE('SocketAddrV6'), 'How parse works for SocketAddrV6', 'Parses "[ipv6]:port".', {
  rows: [['"[2001:db8::1]:80"']], call: 's.parse::<SocketAddrV6>()', note: 'brackets required', outs: ['Ok([2001:db8::1]:80)'],
  intro: 'Without brackets the colons would be ambiguous.',
  steps: [['Address in brackets, then the port.', 0], ['Ok.', [], 'o0']],
  result: 'Ok([2001:db8::1]:80)', resultCap: 'A %scope suffix is also accepted.',
}, 'd("[2001:db8::1]:80".parse::<std::net::SocketAddrV6>())');

add('socketaddr_v6/scope_id', 'scope_id', SA('SocketAddrV6'), 'How SocketAddrV6::scope_id works', 'Which network interface a link-local address belongs to.', {
  rows: [['[fe80::1%3]:80']], call: 'addr.scope_id()', note: 'interface index', outs: ['3'],
  intro: 'Link-local addresses exist on every interface, so the scope picks one.',
  steps: [['The %3 suffix.', 0], ['scope_id is 3.', [], 'o0']],
  result: '3', resultCap: 'set_scope_id changes it.',
}, '"[fe80::1%3]:80".parse::<std::net::SocketAddrV6>().unwrap().scope_id().to_string()');

add('socketaddr_v6/flowinfo', 'flowinfo', SA('SocketAddrV6'), 'How SocketAddrV6::flowinfo works', 'The IPv6 flow label and traffic class field.', {
  rows: [['created with flowinfo 7']], call: 'addr.flowinfo()', note: 'rarely used', outs: ['7'],
  intro: 'Routers may use it to keep packets of one flow together.',
  steps: [['The value given to new.', 0], ['7.', [], 'o0']],
  result: '7', resultCap: 'Almost always 0 in practice.',
}, `std::net::SocketAddrV6::new(${V6}::LOCALHOST, 1, 7, 0).flowinfo().to_string()`);

// ---------------------------------------------------------------- TCP

add('tcp_listener/bind', 'bind', TCP('TcpListener'), 'How TcpListener::bind works', 'Starts listening for TCP connections on an address.', {
  rows: [['"127.0.0.1:0"']], call: 'let listener = TcpListener::bind("127.0.0.1:8080")?;', note: 'a server socket', outs: ['listening'],
  intro: 'Port 0 lets the OS choose a free port.',
  steps: [['The address is reserved.', 0], ['Clients can now connect.', [], 'o0']],
  result: 'listening: true', resultCap: 'Err if the port is already in use (AddrInUse).',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); format!("listening: {}", l.local_addr().unwrap().port() != 0)');

add('tcp_listener/local_addr', 'local_addr', TCP('TcpListener'), 'How TcpListener::local_addr works', 'The address and port the listener is bound to.', {
  rows: [['bound to 127.0.0.1:0']], call: 'listener.local_addr()?', note: 'find the chosen port', outs: ['127.0.0.1:xxxxx'],
  intro: 'With port 0, this tells you which port the OS picked.',
  steps: [['The OS picked a port.', 0], ['local_addr reports it.', [], 'o0']],
  result: '127.0.0.1', resultCap: 'Tests use this to start servers on free ports.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); l.local_addr().unwrap().ip().to_string()');

add('tcp_listener/accept', 'accept', TCP('TcpListener'), 'How TcpListener::accept works', 'Waits for the next client and returns a stream to talk to it.', {
  rows: [['client connects']], call: 'let (stream, client_addr) = listener.accept()?;', note: 'one connection', outs: ['stream + client address'],
  intro: 'Blocks until someone connects.',
  steps: [['A client connects.', 0], ['accept returns its stream and address.', [], 'o0']],
  result: 'client on loopback: true', resultCap: 'incoming() loops over connections.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let a = l.local_addr().unwrap(); let _c = std::net::TcpStream::connect(a).unwrap(); let (_s, peer) = l.accept().unwrap(); format!("client on loopback: {}", peer.ip().is_loopback())');

add('tcp_listener/incoming', 'incoming', TCP('TcpListener'), 'How TcpListener::incoming works', 'An endless iterator of incoming connections.', {
  rows: [['clients keep arriving']], call: 'for stream in listener.incoming() { handle(stream?); }', note: 'the server loop', outs: ['one stream per client'],
  intro: 'Each item is io::Result<TcpStream>.',
  steps: [['Wait for a client.', 0], ['Handle it, then wait for the next.', [], 'o0']],
  result: 'got a client: true', resultCap: 'Spawn a thread per client, or use async.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let a = l.local_addr().unwrap(); let _c = std::net::TcpStream::connect(a).unwrap(); let got = l.incoming().next().unwrap().is_ok(); format!("got a client: {}", got)');

add('tcp_stream/connect', 'connect', TCP('TcpStream'), 'How TcpStream::connect works', 'Opens a TCP connection to a server.', {
  rows: [['server on 127.0.0.1']], call: 'let mut stream = TcpStream::connect("127.0.0.1:8080")?;', note: 'the client side', outs: ['connected stream'],
  intro: 'The stream implements Read and Write.',
  steps: [['Connect to the listener.', 0], ['Send "ping"; the server reads it.', [], 'o0']],
  result: '"ping"', resultCap: 'Err(ConnectionRefused) if nobody is listening.',
}, PAIR + 'c.write_all(b"ping").unwrap(); drop(c); let mut got = String::new(); s.read_to_string(&mut got).unwrap(); d(got)');

add('tcp_stream/peer_addr', 'peer_addr', TCP('TcpStream'), 'How TcpStream::peer_addr works', 'The address of the other end.', {
  rows: [['client stream']], call: 'stream.peer_addr()?', note: 'who am I talking to?', outs: ['server address'],
  intro: 'On the client, it is the server\'s address.',
  steps: [['Ask the connection.', 0], ['The server\'s port.', [], 'o0']],
  result: 'matches server: true', resultCap: 'local_addr gives your own end.',
}, PAIR + 'let _ = &mut s; format!("matches server: {}", c.peer_addr().unwrap() == addr)');

add('tcp_stream/local_addr', 'local_addr', TCP('TcpStream'), 'How TcpStream::local_addr works', 'The address of this end of the connection.', {
  rows: [['client stream']], call: 'stream.local_addr()?', note: 'my port', outs: ['127.0.0.1:random'],
  intro: 'Clients get a random local port.',
  steps: [['Ask the connection.', 0], ['The client\'s own port.', [], 'o0']],
  result: 'same as server sees: true', resultCap: 'It equals the server\'s peer_addr for this stream.',
}, PAIR + 'format!("same as server sees: {}", c.local_addr().unwrap() == s.peer_addr().unwrap())');

add('tcp_stream/shutdown', 'shutdown', TCP('TcpStream'), 'How TcpStream::shutdown works', 'Closes the reading, writing or both halves of a connection.', {
  rows: [['client shuts down Write']], call: 'stream.shutdown(Shutdown::Write)?', note: '"I am done sending"', outs: ['server sees end of data'],
  intro: 'The other side reads 0 bytes (end of file) after your last data.',
  steps: [['Send the last bytes.', 0], ['Shut down writing: the server reaches EOF.', [], 'o0']],
  result: '"bye"', resultCap: 'Shutdown::Both closes everything.',
}, PAIR + 'c.write_all(b"bye").unwrap(); c.shutdown(std::net::Shutdown::Write).unwrap(); let mut got = String::new(); s.read_to_string(&mut got).unwrap(); d(got)');

add('tcp_stream/set_nodelay', 'set_nodelay', TCP('TcpStream'), 'How TcpStream::set_nodelay works', 'Turns off Nagle\'s algorithm so small writes are sent immediately.', {
  rows: [['interactive protocol']], call: 'stream.set_nodelay(true)?', note: 'lower latency', outs: ['nodelay() = true'],
  intro: 'By default TCP may hold small packets briefly to combine them.',
  steps: [['Disable the delay.', 0], ['nodelay() reports true.', [], 'o0']],
  result: 'true', resultCap: 'Good for games and chat; not needed for bulk transfers.',
}, PAIR + 'let _ = &s; c.set_nodelay(true).unwrap(); c.nodelay().unwrap().to_string()');

add('tcp_stream/set_read_timeout', 'set_read_timeout', TCP('TcpStream'), 'How TcpStream::set_read_timeout works', 'Makes reads fail instead of waiting forever.', {
  rows: [['server sends nothing']], call: 'stream.set_read_timeout(Some(Duration::from_millis(20)))?', note: 'bounded waiting', outs: ['read → Err(TimedOut/WouldBlock)'],
  intro: 'None means wait forever (the default).',
  steps: [['Set a 20 ms limit.', 0], ['The read gives up with an error.', [], 'o0']],
  result: 'timed out: true', resultCap: 'The error kind differs between platforms.',
}, PAIR + 'let _ = &s; c.set_read_timeout(Some(std::time::Duration::from_millis(20))).unwrap(); let mut b = [0u8; 1]; let e = c.read(&mut b).unwrap_err().kind(); format!("timed out: {}", matches!(e, std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock))');

add('tcp_stream/peek', 'peek', TCP('TcpStream'), 'How TcpStream::peek works', 'Reads incoming data without removing it from the queue.', {
  rows: [['client sent "hello"']], call: 'stream.peek(&mut buf)?', note: 'look, then read', outs: ['peek "he", read "hello"'],
  intro: 'The next read returns the same bytes again.',
  steps: [['peek sees the start.', 0], ['read still gets everything.', [], 'o0']],
  result: '"he", "hello"', resultCap: 'Useful for sniffing a protocol header.',
}, PAIR + 'c.write_all(b"hello").unwrap(); drop(c); let mut b = [0u8; 2]; let mut n = 0; while n < 2 { n = s.peek(&mut b).unwrap(); } let mut all = String::new(); s.read_to_string(&mut all).unwrap(); format!("{:?}, {:?}", std::str::from_utf8(&b).unwrap(), all)');

add('tcp_stream/try_clone', 'try_clone', TCP('TcpStream'), 'How TcpStream::try_clone works', 'A second handle to the same connection.', {
  rows: [['reader thread', 'writer thread']], call: 'let reader = stream.try_clone()?;', note: 'read and write separately', outs: ['both use one socket'],
  intro: 'Common: one thread reads while another writes.',
  steps: [['Clone the handle.', 0], ['Write through one, the data still arrives.', 1, 'o0']],
  result: '"x"', resultCap: 'Both handles share the same connection.',
}, PAIR + 'let mut c2 = c.try_clone().unwrap(); c2.write_all(b"x").unwrap(); drop(c2); drop(c); let mut got = String::new(); s.read_to_string(&mut got).unwrap(); d(got)');

module.exports = list;
