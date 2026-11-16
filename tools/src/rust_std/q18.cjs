// Rust standard library: UDP sockets, the remaining TCP options, and hashing helpers (DefaultHasher, RandomState,
// BuildHasher). Network truth checks stay on 127.0.0.1 with OS-chosen ports.
const { group } = require('./kit.cjs');
const UDP = ['std', 'UdpSocket', /net\/udp\.rs$/];
const TCP = (o) => ['std', o, /net\/tcp\.rs$/];
const HR = (o) => ['std', o, /hash\/random\.rs$/];
const { list, add } = group({ at: UDP });
const U2 = 'let a = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); let b = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); let ba = b.local_addr().unwrap(); ';
const T2 = 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let c = std::net::TcpStream::connect(l.local_addr().unwrap()).unwrap(); let (_s, _) = l.accept().unwrap(); ';

// ---------------------------------------------------------------- UDP

add('udp/bind', 'bind', null, 'How UdpSocket::bind works', 'Opens a UDP socket on an address.', {
  rows: [['"127.0.0.1:0"']], call: 'let sock = UdpSocket::bind("127.0.0.1:34254")?;', note: 'connectionless', outs: ['a bound socket'],
  intro: 'UDP sends independent packets (datagrams); there is no connection.',
  steps: [['Reserve the address.', 0], ['Ready to send and receive.', [], 'o0']],
  result: 'bound: true', resultCap: 'Port 0 lets the OS choose.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); format!("bound: {}", s.local_addr().unwrap().port() != 0)');

add('udp/send_to', 'send_to', null, 'How UdpSocket::send_to works', 'Sends one datagram to an address.', {
  rows: [['a → b: "hi"']], call: 'sock.send_to(b"hi", target)?', note: 'fire and forget', outs: ['2 bytes sent'],
  intro: 'Delivery is not guaranteed in general; on localhost it practically always works.',
  steps: [['The packet is addressed.', 0], ['2 bytes go out.', [], 'o0']],
  result: '2', resultCap: 'Each send is one separate packet.',
}, U2 + 'a.send_to(b"hi", ba).unwrap().to_string()');

add('udp/recv_from', 'recv_from', null, 'How UdpSocket::recv_from works', 'Waits for one datagram and tells who sent it.', {
  rows: [['b receives from a']], call: 'let (n, from) = sock.recv_from(&mut buf)?;', note: 'data + sender', outs: ['"hi" from a'],
  intro: 'A too-small buffer cuts the datagram off.',
  steps: [['A packet arrives.', 0], ['Data and sender address.', [], 'o0']],
  result: '"hi", from a: true', resultCap: 'Reply with send_to(.., from).',
}, U2 + 'a.send_to(b"hi", ba).unwrap(); let mut buf = [0u8; 16]; let (n, from) = b.recv_from(&mut buf).unwrap(); format!("{:?}, from a: {}", std::str::from_utf8(&buf[..n]).unwrap(), from == a.local_addr().unwrap())');

add('udp/local_addr', 'local_addr', null, 'How UdpSocket::local_addr works', 'The address the socket is bound to.', {
  rows: [['bound to :0']], call: 'sock.local_addr()?', note: 'find the chosen port', outs: ['127.0.0.1:xxxxx'],
  intro: 'Tells you which port the OS picked.',
  steps: [['Bound with port 0.', 0], ['The real port.', [], 'o0']],
  result: '127.0.0.1', resultCap: 'Share it with the peer so it can reply.',
}, 'std::net::UdpSocket::bind("127.0.0.1:0").unwrap().local_addr().unwrap().ip().to_string()');

add('udp/connect', 'connect', null, 'How UdpSocket::connect works', 'Sets a default peer, so send/recv can be used without addresses.', {
  rows: [['a connects to b']], call: 'sock.connect(peer)?; sock.send(b"x")?;', note: 'no real connection', outs: ['send goes to b'],
  intro: 'Packets from other addresses are then ignored.',
  steps: [['Remember the peer.', 0], ['send() goes there.', [], 'o0']],
  result: '"x"', resultCap: 'No handshake happens: it is still UDP.',
}, U2 + 'a.connect(ba).unwrap(); a.send(b"x").unwrap(); let mut buf = [0u8; 4]; let n = b.recv(&mut buf).unwrap(); d(std::str::from_utf8(&buf[..n]).unwrap())');

add('udp/send', 'send', null, 'How UdpSocket::send works', 'Sends a datagram to the connected peer.', {
  rows: [['connected to b']], call: 'sock.send(b"ping")?', note: 'after connect()', outs: ['4 bytes'],
  intro: 'Fails if connect() was never called.',
  steps: [['The default peer is used.', 0], ['4 bytes sent.', [], 'o0']],
  result: '4', resultCap: 'send_to works without connect.',
}, U2 + 'a.connect(ba).unwrap(); a.send(b"ping").unwrap().to_string()');

add('udp/recv', 'recv', null, 'How UdpSocket::recv works', 'Receives a datagram from the connected peer.', {
  rows: [['b connected to a']], call: 'let n = sock.recv(&mut buf)?;', note: 'no sender address', outs: ['"pong"'],
  intro: 'Only accepts packets from the connected peer.',
  steps: [['A packet arrives.', 0], ['Its bytes.', [], 'o0']],
  result: '"pong"', resultCap: 'recv_from also returns the sender.',
}, U2 + 'b.connect(a.local_addr().unwrap()).unwrap(); a.send_to(b"pong", ba).unwrap(); let mut buf = [0u8; 8]; let n = b.recv(&mut buf).unwrap(); d(std::str::from_utf8(&buf[..n]).unwrap())');

add('udp/peek_from', 'peek_from', null, 'How UdpSocket::peek_from works', 'Looks at the next datagram without removing it.', {
  rows: [['pending "data"']], call: 'sock.peek_from(&mut buf)?', note: 'look, then receive', outs: ['peek and recv see the same'],
  intro: 'The next recv returns the same packet.',
  steps: [['peek sees "data".', 0], ['recv still gets it.', [], 'o0']],
  result: 'same: true', resultCap: 'peek() is the connected version.',
}, U2 + 'a.send_to(b"data", ba).unwrap(); let mut p = [0u8; 8]; let (n1, _) = b.peek_from(&mut p).unwrap(); let mut r = [0u8; 8]; let (n2, _) = b.recv_from(&mut r).unwrap(); format!("same: {}", p[..n1] == r[..n2])');

add('udp/peek', 'peek', null, 'How UdpSocket::peek works', 'Looks at the next datagram from the connected peer without removing it.', {
  rows: [['pending "abc"']], call: 'sock.peek(&mut buf)?', note: 'after connect()', outs: ['3 bytes, still queued'],
  intro: 'Useful to check a packet type before reading it.',
  steps: [['Peek 3 bytes.', 0], ['The packet stays queued.', [], 'o0']],
  result: '3, 3', resultCap: 'Then recv() takes it.',
}, U2 + 'b.connect(a.local_addr().unwrap()).unwrap(); a.send_to(b"abc", ba).unwrap(); let mut buf = [0u8; 8]; let n1 = b.peek(&mut buf).unwrap(); let n2 = b.recv(&mut buf).unwrap(); format!("{}, {}", n1, n2)');

add('udp/peer_addr', 'peer_addr', null, 'How UdpSocket::peer_addr works', 'The address set with connect().', {
  rows: [['connected', 'not connected']], call: 'sock.peer_addr()', note: 'default peer', outs: ['Ok(addr)', 'Err(NotConnected)'],
  intro: 'Err if connect was never called.',
  steps: [['After connect: Ok.', 0, 'o0'], ['Without: Err.', 1, 'o1']],
  result: 'true, NotConnected', resultCap: 'UDP "connections" are just a remembered address.',
}, U2 + 'let x = b.peer_addr().unwrap_err().kind(); a.connect(ba).unwrap(); format!("{}, {:?}", a.peer_addr().unwrap() == ba, x)');

add('udp/set_read_timeout', 'set_read_timeout', null, 'How UdpSocket::set_read_timeout works', 'Makes recv fail instead of waiting forever.', {
  rows: [['nothing arrives']], call: 'sock.set_read_timeout(Some(Duration::from_millis(20)))?', note: 'bounded wait', outs: ['recv → Err'],
  intro: 'Essential for UDP, where a reply may never come.',
  steps: [['Set 20 ms.', 0], ['recv gives up.', [], 'o0']],
  result: 'timed out: true', resultCap: 'read_timeout() reads the setting back.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); s.set_read_timeout(Some(std::time::Duration::from_millis(20))).unwrap(); let mut b = [0u8; 1]; let e = s.recv_from(&mut b).unwrap_err().kind(); format!("timed out: {}", matches!(e, std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock))');

add('udp/read_timeout', 'read_timeout', null, 'How UdpSocket::read_timeout works', 'The current read timeout, if any.', {
  rows: [['default', 'after setting 1 s']], call: 'sock.read_timeout()?', note: 'None = wait forever', outs: ['None', 'Some(1s)'],
  intro: 'Reads back what set_read_timeout configured.',
  steps: [['Default: None.', 0, 'o0'], ['After setting: Some(1s).', 1, 'o1']],
  result: 'None, Some(1s)', resultCap: 'write_timeout works the same for sends.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); let a = s.read_timeout().unwrap(); s.set_read_timeout(Some(std::time::Duration::from_secs(1))).unwrap(); format!("{:?}, {:?}", a, s.read_timeout().unwrap())');

add('udp/set_broadcast', 'set_broadcast', null, 'How UdpSocket::set_broadcast works', 'Allows sending to broadcast addresses.', {
  rows: [['off by default']], call: 'sock.set_broadcast(true)?', note: 'reach the whole LAN', outs: ['broadcast() = true'],
  intro: 'Needed to send to 255.255.255.255.',
  steps: [['Enable it.', 0], ['broadcast() reports true.', [], 'o0']],
  result: 'false, true', resultCap: 'Used for LAN discovery protocols.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); let a = s.broadcast().unwrap(); s.set_broadcast(true).unwrap(); format!("{}, {}", a, s.broadcast().unwrap())');

add('udp/set_ttl', 'set_ttl', null, 'How UdpSocket::set_ttl works', 'Sets how many network hops a packet may travel.', {
  rows: [['TTL 5']], call: 'sock.set_ttl(5)?', note: 'time to live', outs: ['ttl() = 5'],
  intro: 'Each router decreases it; at 0 the packet is dropped.',
  steps: [['Set 5.', 0], ['ttl() is 5.', [], 'o0']],
  result: '5', resultCap: 'traceroute works by raising the TTL step by step.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); s.set_ttl(5).unwrap(); s.ttl().unwrap().to_string()');

add('udp/try_clone', 'try_clone', null, 'How UdpSocket::try_clone works', 'A second handle to the same socket.', {
  rows: [['receiver thread', 'sender thread']], call: 'let sender = sock.try_clone()?;', note: 'share one socket', outs: ['same local address'],
  intro: 'Both handles use the same port.',
  steps: [['Clone the handle.', 0], ['Same address.', [], 'o0']],
  result: 'same: true', resultCap: 'Typical: one thread receives, another sends.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); let t = s.try_clone().unwrap(); format!("same: {}", s.local_addr().unwrap() == t.local_addr().unwrap())');

add('udp/set_nonblocking', 'set_nonblocking', null, 'How UdpSocket::set_nonblocking works', 'Makes recv return at once (WouldBlock) when nothing is waiting.', {
  rows: [['no packet queued']], call: 'sock.set_nonblocking(true)?', note: 'never wait', outs: ['recv → WouldBlock'],
  intro: 'Building block for event loops.',
  steps: [['Switch to non-blocking.', 0], ['recv returns WouldBlock.', [], 'o0']],
  result: 'WouldBlock', resultCap: 'async runtimes use this under the hood.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); s.set_nonblocking(true).unwrap(); let mut b = [0u8; 1]; d(s.recv_from(&mut b).unwrap_err().kind())');

add('udp/take_error', 'take_error', null, 'How UdpSocket::take_error works', 'Takes the socket\'s pending error, if any.', {
  rows: [['healthy socket']], call: 'sock.take_error()?', note: 'SO_ERROR', outs: ['None'],
  intro: 'Some errors arrive asynchronously and are stored on the socket.',
  steps: [['Ask for the pending error.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Reading it clears it.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); d(s.take_error().unwrap().map(|e| e.kind()))');

add('udp/set_multicast_ttl_v4', 'set_multicast_ttl_v4', null, 'How UdpSocket::set_multicast_ttl_v4 works', 'How far IPv4 multicast packets may travel.', {
  rows: [['TTL 2']], call: 'sock.set_multicast_ttl_v4(2)?', note: 'limit the reach', outs: ['multicast_ttl_v4() = 2'],
  intro: 'The default 1 keeps multicast on the local network.',
  steps: [['Set 2.', 0], ['Read it back.', [], 'o0']],
  result: '2', resultCap: 'Raise it carefully: multicast can flood networks.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); s.set_multicast_ttl_v4(2).unwrap(); s.multicast_ttl_v4().unwrap().to_string()');

add('udp/set_multicast_loop_v4', 'set_multicast_loop_v4', null, 'How UdpSocket::set_multicast_loop_v4 works', 'Whether your own multicast packets come back to you.', {
  rows: [['loop off']], call: 'sock.set_multicast_loop_v4(false)?', note: 'hear yourself?', outs: ['multicast_loop_v4() = false'],
  intro: 'On by default.',
  steps: [['Turn it off.', 0], ['Read it back.', [], 'o0']],
  result: 'false', resultCap: 'The v6 version works the same.',
}, 'let s = std::net::UdpSocket::bind("127.0.0.1:0").unwrap(); s.set_multicast_loop_v4(false).unwrap(); s.multicast_loop_v4().unwrap().to_string()');

// ---------------------------------------------------------------- TCP options

add('tcp_stream/connect_timeout', 'connect_timeout', TCP('TcpStream'), 'How TcpStream::connect_timeout works', 'Connects, but gives up after a time limit.', {
  rows: [['server on localhost']], call: 'TcpStream::connect_timeout(&addr, Duration::from_secs(2))?', note: 'bounded connect', outs: ['connected'],
  intro: 'Without it, connecting to a dead host can hang for a long time.',
  steps: [['Try to connect.', 0], ['Success within 2 s.', [], 'o0']],
  result: 'connected: true', resultCap: 'Takes a resolved SocketAddr, not a host name.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let ok = std::net::TcpStream::connect_timeout(&l.local_addr().unwrap(), std::time::Duration::from_secs(2)).is_ok(); format!("connected: {}", ok)');

add('tcp_stream/nodelay', 'nodelay', TCP('TcpStream'), 'How TcpStream::nodelay works', 'Whether Nagle\'s algorithm is disabled.', {
  rows: [['default stream']], call: 'stream.nodelay()?', note: 'usually false', outs: ['false'],
  intro: 'set_nodelay(true) turns the delay off.',
  steps: [['Ask the socket.', 0], ['false by default.', [], 'o0']],
  result: 'false', resultCap: 'false means small writes may be combined.',
}, T2 + 'c.nodelay().unwrap().to_string()');

add('tcp_stream/read_timeout', 'read_timeout', TCP('TcpStream'), 'How TcpStream::read_timeout works', 'The current read timeout, if any.', {
  rows: [['default', 'after 500 ms']], call: 'stream.read_timeout()?', note: 'None = forever', outs: ['None', 'Some(500ms)'],
  intro: 'Reads back the setting.',
  steps: [['Default: None.', 0, 'o0'], ['After setting: Some.', 1, 'o1']],
  result: 'None, Some(500ms)', resultCap: 'write_timeout is the write side.',
}, T2 + 'let a = c.read_timeout().unwrap(); c.set_read_timeout(Some(std::time::Duration::from_millis(500))).unwrap(); format!("{:?}, {:?}", a, c.read_timeout().unwrap())');

add('tcp_stream/set_write_timeout', 'set_write_timeout', TCP('TcpStream'), 'How TcpStream::set_write_timeout works', 'Makes writes fail instead of waiting forever when the peer stops reading.', {
  rows: [['1 s']], call: 'stream.set_write_timeout(Some(Duration::from_secs(1)))?', note: 'bounded writes', outs: ['write_timeout() = Some(1s)'],
  intro: 'Writes block when the peer\'s buffer is full.',
  steps: [['Set 1 s.', 0], ['Read it back.', [], 'o0']],
  result: 'Some(1s)', resultCap: 'Some(Duration::ZERO) is rejected as invalid.',
}, T2 + 'c.set_write_timeout(Some(std::time::Duration::from_secs(1))).unwrap(); d(c.write_timeout().unwrap())');

add('tcp_stream/set_ttl', 'set_ttl', TCP('TcpStream'), 'How TcpStream::set_ttl works', 'Sets the time-to-live of packets on this connection.', {
  rows: [['TTL 64']], call: 'stream.set_ttl(64)?', note: 'hops', outs: ['ttl() = 64'],
  intro: 'Rarely changed for TCP.',
  steps: [['Set 64.', 0], ['Read it back.', [], 'o0']],
  result: '64', resultCap: 'ttl() reads the current value.',
}, T2 + 'c.set_ttl(64).unwrap(); c.ttl().unwrap().to_string()');

add('tcp_stream/set_nonblocking', 'set_nonblocking', TCP('TcpStream'), 'How TcpStream::set_nonblocking works', 'Makes reads and writes return WouldBlock instead of waiting.', {
  rows: [['no data yet']], call: 'stream.set_nonblocking(true)?', note: 'event loops', outs: ['read → WouldBlock'],
  intro: 'The basis of hand-written polling loops.',
  steps: [['Switch to non-blocking.', 0], ['read returns WouldBlock.', [], 'o0']],
  result: 'WouldBlock', resultCap: 'async runtimes do this for you.',
}, 'use std::io::Read; ' + T2 + 'let mut c = c; c.set_nonblocking(true).unwrap(); let mut b = [0u8; 1]; d(c.read(&mut b).unwrap_err().kind())');

add('tcp_stream/take_error', 'take_error', TCP('TcpStream'), 'How TcpStream::take_error works', 'Takes the connection\'s pending error, if any.', {
  rows: [['healthy connection']], call: 'stream.take_error()?', note: 'SO_ERROR', outs: ['None'],
  intro: 'Used after non-blocking connects to see if they failed.',
  steps: [['Ask for the error.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Reading it clears it.',
}, T2 + 'd(c.take_error().unwrap().map(|e| e.kind()))');

add('tcp_listener/set_nonblocking', 'set_nonblocking', TCP('TcpListener'), 'How TcpListener::set_nonblocking works', 'Makes accept return WouldBlock when no client is waiting.', {
  rows: [['no client']], call: 'listener.set_nonblocking(true)?', note: 'poll for clients', outs: ['accept → WouldBlock'],
  intro: 'Lets one thread check for clients between other work.',
  steps: [['Switch to non-blocking.', 0], ['accept returns at once.', [], 'o0']],
  result: 'WouldBlock', resultCap: 'Accepted streams start in blocking mode again.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); l.set_nonblocking(true).unwrap(); d(l.accept().unwrap_err().kind())');

add('tcp_listener/set_ttl', 'set_ttl', TCP('TcpListener'), 'How TcpListener::set_ttl works', 'Sets the TTL for connections accepted by this listener.', {
  rows: [['TTL 32']], call: 'listener.set_ttl(32)?', note: 'hops', outs: ['ttl() = 32'],
  intro: 'Rarely needed.',
  steps: [['Set 32.', 0], ['Read it back.', [], 'o0']],
  result: '32', resultCap: 'ttl() reads it.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); l.set_ttl(32).unwrap(); l.ttl().unwrap().to_string()');

add('tcp_listener/try_clone', 'try_clone', TCP('TcpListener'), 'How TcpListener::try_clone works', 'A second handle to the same listening socket.', {
  rows: [['two accept loops']], call: 'let l2 = listener.try_clone()?;', note: 'share the port', outs: ['same address'],
  intro: 'Several threads can accept from the same port.',
  steps: [['Clone the handle.', 0], ['Same address.', [], 'o0']],
  result: 'same: true', resultCap: 'Each client is accepted by exactly one of them.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); let l2 = l.try_clone().unwrap(); format!("same: {}", l.local_addr().unwrap() == l2.local_addr().unwrap())');

add('tcp_listener/take_error', 'take_error', TCP('TcpListener'), 'How TcpListener::take_error works', 'Takes the listener\'s pending error, if any.', {
  rows: [['healthy listener']], call: 'listener.take_error()?', note: 'SO_ERROR', outs: ['None'],
  intro: 'Usually None.',
  steps: [['Ask for the error.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Reading it clears it.',
}, 'let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap(); d(l.take_error().unwrap().map(|e| e.kind()))');

// ---------------------------------------------------------------- hashing

add('default_hasher/new', 'new', HR('DefaultHasher'), 'How DefaultHasher::new works', 'A hasher with fixed keys: the same input always gives the same hash in this program.', {
  rows: [['"hello"', '"hello"']], call: 'let mut h = DefaultHasher::new(); "hello".hash(&mut h); h.finish()', note: 'SipHash', outs: ['equal hashes'],
  intro: 'Equal values must give equal hashes.',
  steps: [['Hash "hello" twice.', [0, 1]], ['The numbers match.', [], 'o0']],
  result: 'equal: true', resultCap: 'The algorithm may change between Rust versions: do not store hashes.',
}, 'use std::hash::{Hash, Hasher}; let f = |s: &str| { let mut h = std::hash::DefaultHasher::new(); s.hash(&mut h); h.finish() }; format!("equal: {}", f("hello") == f("hello"))');

add('default_hasher/finish', 'finish', HR('DefaultHasher'), 'How DefaultHasher::finish works', 'Returns the hash of everything written so far.', {
  rows: [['"a"', '"b"']], call: 'h.finish()', note: 'u64', outs: ['different hashes'],
  intro: 'Different inputs (almost always) give different hashes.',
  steps: [['Hash "a" and "b".', [0, 1]], ['The numbers differ.', [], 'o0']],
  result: 'different: true', resultCap: 'finish does not reset the hasher.',
}, 'use std::hash::{Hash, Hasher}; let f = |s: &str| { let mut h = std::hash::DefaultHasher::new(); s.hash(&mut h); h.finish() }; format!("different: {}", f("a") != f("b"))');

add('default_hasher/write', 'write', HR('DefaultHasher'), 'How DefaultHasher::write works', 'Feeds raw bytes into the hasher.', {
  rows: [['b"ab" at once', 'b"a" then b"b"']], call: 'h.write(b"ab")', note: 'the low-level input', outs: ['same hash'],
  intro: 'Hash implementations call write under the hood.',
  steps: [['Write "ab" in one go...', 0], ['...or in two pieces: same result.', 1, 'o0']],
  result: 'same: true', resultCap: 'Use Hash::hash for normal values.',
}, 'use std::hash::Hasher; let mut a = std::hash::DefaultHasher::new(); a.write(b"ab"); let mut b = std::hash::DefaultHasher::new(); b.write(b"a"); b.write(b"b"); format!("same: {}", a.finish() == b.finish())');

add('random_state/new', 'new', HR('RandomState'), 'How RandomState::new works', 'A hasher factory with random keys, as HashMap uses by default.', {
  rows: [['state 1', 'state 2']], call: 'let s = RandomState::new();', note: 'protects against attacks', outs: ['different keys'],
  intro: 'Random keys stop attackers from crafting colliding keys.',
  steps: [['Each RandomState has its own keys.', [0, 1]], ['Hashes are consistent within one state.', [], 'o0']],
  result: 'consistent: true', resultCap: 'HashMap::new() uses one internally.',
}, 'use std::hash::BuildHasher; let s = std::hash::RandomState::new(); format!("consistent: {}", s.hash_one("x") == s.hash_one("x"))');

add('random_state/build_hasher', 'build_hasher', HR('RandomState'), 'How RandomState::build_hasher works', 'Creates a fresh DefaultHasher using this state\'s keys.', {
  rows: [['one RandomState']], call: 'let mut h = state.build_hasher();', note: 'a new hasher per value', outs: ['same keys every time'],
  intro: 'Every hasher built from one state hashes the same way.',
  steps: [['Build two hashers.', 0], ['Hashing 7 with each matches.', [], 'o0']],
  result: 'same: true', resultCap: 'hash_one does build + hash + finish in one call.',
}, 'use std::hash::{BuildHasher, Hash, Hasher}; let s = std::hash::RandomState::new(); let f = |x: i32| { let mut h = s.build_hasher(); x.hash(&mut h); h.finish() }; format!("same: {}", f(7) == f(7))');

add('build_hasher/hash_one', 'hash_one', ['core', 'BuildHasher', /hash\/mod\.rs$/], 'How BuildHasher::hash_one works', 'Hashes one value in a single call.', {
  rows: [['(1, "a")']], call: 'state.hash_one((1, "a"))', note: 'build + hash + finish', outs: ['a u64'],
  intro: 'The easiest way to get a hash number.',
  steps: [['A hasher is built.', 0], ['The value is hashed and finished.', [], 'o0']],
  result: 'consistent: true', resultCap: 'Use the same BuildHasher for comparable results.',
}, 'use std::hash::BuildHasher; let s = std::hash::RandomState::new(); format!("consistent: {}", s.hash_one((1, "a")) == s.hash_one((1, "a")))');

add('build_hasher_default/new', 'new', ['core', 'BuildHasherDefault', /hash\/mod\.rs$/], 'How BuildHasherDefault::new works', 'A BuildHasher that creates hashers with Default::default().', {
  rows: [['BuildHasherDefault<DefaultHasher>']], call: 'BuildHasherDefault::<DefaultHasher>::new()', note: 'deterministic hashing', outs: ['same hash every run'],
  intro: 'No randomness: useful for reproducible tests.',
  steps: [['Create the factory.', 0], ['Every hasher starts identical.', [], 'o0']],
  result: 'same: true', resultCap: 'Plug it into HashMap::with_hasher.',
}, 'use std::hash::BuildHasher; let a = std::hash::BuildHasherDefault::<std::hash::DefaultHasher>::new(); let b = std::hash::BuildHasherDefault::<std::hash::DefaultHasher>::new(); format!("same: {}", a.hash_one(42) == b.hash_one(42))');

module.exports = list;
