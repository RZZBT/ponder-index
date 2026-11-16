// Rust standard library: C strings (CString, CStr and their errors) and IP addresses (IpAddr, Ipv4Addr, parsing).
const { group } = require('./kit.cjs');
const CS = (o) => ['alloc', o, /ffi\/c_str\.rs$/];
const CCSTR = ['core', 'CStr', /ffi\/c_str\.rs$/];
const IP = (o) => ['core', o, /net\/ip_addr\.rs$/];
const PARSE = (o) => ['core', o, /net\/parser\.rs$/];
const { list, add } = group({ at: CS('CString') });
const C = 'std::ffi::CString';
const CR = 'std::ffi::CStr';
const V4 = 'std::net::Ipv4Addr';
const IPA = 'std::net::IpAddr';

// ---------------------------------------------------------------- CString

add('cstring/new', 'new', null, 'How CString::new works', 'Makes a C-compatible string: adds a NUL at the end and rejects inner NULs.', {
  rows: [['"hi"', '"a\\0b"']], call: 'CString::new("hi")', note: 'for passing text to C', outs: ['Ok(b"hi\\0")', 'Err (NUL at 1)'],
  intro: 'C strings end at the first zero byte, so one inside the text is not allowed.',
  steps: [['"hi": Ok, with a trailing NUL.', 0, 'o0'], ['"a\\0b": Err.', 1, 'o1']],
  result: 'Ok("hi"), Err', resultCap: 'as_ptr() then gives a *const c_char for C functions.',
}, `format!("{:?}, {}", ${C}::new("hi"), if ${C}::new("a\\0b").is_err() { "Err" } else { "Ok" })`);

add('cstring/as_bytes', 'as_bytes', null, 'How CString::as_bytes works', 'The bytes without the trailing NUL.', {
  rows: [['CString "ok"']], call: 'c.as_bytes()', note: 'no terminator', outs: ['[111, 107]'],
  intro: 'The NUL is still stored, just not shown.',
  steps: [['Stored: o, k, NUL.', 0], ['as_bytes: o, k.', [], 'o0']],
  result: '[111, 107]', resultCap: 'as_bytes_with_nul includes the 0.',
}, `d(${C}::new("ok").unwrap().as_bytes())`);

add('cstring/as_bytes_with_nul', 'as_bytes_with_nul', null, 'How CString::as_bytes_with_nul works', 'The bytes including the trailing NUL.', {
  rows: [['CString "ok"']], call: 'c.as_bytes_with_nul()', note: 'with terminator', outs: ['[111, 107, 0]'],
  intro: 'What C actually sees in memory.',
  steps: [['o, k...', 0], ['...and the 0.', [], 'o0']],
  result: '[111, 107, 0]', resultCap: 'Length is always one more than as_bytes.',
}, `d(${C}::new("ok").unwrap().as_bytes_with_nul())`);

add('cstring/as_c_str', 'as_c_str', null, 'How CString::as_c_str works', 'Borrows the CString as a &CStr.', {
  rows: [['CString "x"']], call: 'c.as_c_str()', note: 'owned → borrowed', outs: ['&CStr "x"'],
  intro: 'Like String::as_str for C strings.',
  steps: [['Borrow it.', 0], ['&CStr.', [], 'o0']],
  result: '"x"', resultCap: '&*c works too.',
}, `d(${C}::new("x").unwrap().as_c_str())`);

add('cstring/into_string', 'into_string', null, 'How CString::into_string works', 'Converts to a String if the bytes are valid UTF-8.', {
  rows: [['CString "héllo"']], call: 'c.into_string()', note: 'Ok(String) or Err', outs: ['Ok("héllo")'],
  intro: 'The NUL is dropped.',
  steps: [['Valid UTF-8.', 0], ['Ok(String).', [], 'o0']],
  result: 'Ok("héllo")', resultCap: 'On Err, into_cstring gives the CString back.',
}, `d(${C}::new("héllo").unwrap().into_string())`);

add('cstring/into_bytes', 'into_bytes', null, 'How CString::into_bytes works', 'Turns the CString into its bytes, without the NUL.', {
  rows: [['CString "ab"']], call: 'c.into_bytes()', note: 'Vec<u8>', outs: ['[97, 98]'],
  intro: 'The terminator is removed.',
  steps: [['The CString is consumed.', 0], ['[97, 98].', [], 'o0']],
  result: '[97, 98]', resultCap: 'into_bytes_with_nul keeps it.',
}, `d(${C}::new("ab").unwrap().into_bytes())`);

add('cstring/into_bytes_with_nul', 'into_bytes_with_nul', null, 'How CString::into_bytes_with_nul works', 'Turns the CString into its bytes, keeping the NUL.', {
  rows: [['CString "ab"']], call: 'c.into_bytes_with_nul()', note: 'with terminator', outs: ['[97, 98, 0]'],
  intro: 'Ready to hand to code that expects the 0.',
  steps: [['The CString is consumed.', 0], ['[97, 98, 0].', [], 'o0']],
  result: '[97, 98, 0]', resultCap: 'from_vec_with_nul goes back.',
}, `d(${C}::new("ab").unwrap().into_bytes_with_nul())`);

add('cstring/from_vec_with_nul', 'from_vec_with_nul', null, 'How CString::from_vec_with_nul works', 'Makes a CString from bytes that already end in exactly one NUL.', {
  rows: [['b"hi\\0"', 'b"hi"']], call: 'CString::from_vec_with_nul(bytes)', note: 'must end with 0', outs: ['Ok("hi")', 'Err'],
  intro: 'No NUL, or one in the middle, is an error.',
  steps: [['Ends with 0: Ok.', 0, 'o0'], ['No terminator: Err.', 1, 'o1']],
  result: 'Ok("hi"), Err', resultCap: 'The error gives the bytes back.',
}, `format!("{:?}, {}", ${C}::from_vec_with_nul(b"hi\\0".to_vec()), if ${C}::from_vec_with_nul(b"hi".to_vec()).is_err() { "Err" } else { "Ok" })`);

add('cstring/into_boxed_c_str', 'into_boxed_c_str', null, 'How CString::into_boxed_c_str works', 'Turns the CString into a Box<CStr>.', {
  rows: [['CString "x"']], call: 'c.into_boxed_c_str()', note: 'fixed, smaller', outs: ['Box<CStr> "x"'],
  intro: 'Drops spare capacity.',
  steps: [['The CString is consumed.', 0], ['A Box<CStr>.', [], 'o0']],
  result: '"x"', resultCap: 'CStr::into_c_string goes back.',
}, `d(${C}::new("x").unwrap().into_boxed_c_str())`);

add('cstring/into_raw', 'into_raw', null, 'How CString::into_raw works', 'Hands the string to C as a raw pointer; you must take it back later.', {
  rows: [['CString "x"']], call: 'let p = c.into_raw(); /* C uses p */ unsafe { CString::from_raw(p) }', note: 'ownership to C and back', outs: ['the same CString'],
  intro: 'Memory must be freed by Rust again with from_raw, not by C\'s free().',
  steps: [['Rust gives up ownership.', 0], ['from_raw takes it back.', [], 'o0']],
  result: '"x"', resultCap: 'Forgetting from_raw leaks memory.',
}, `let p = ${C}::new("x").unwrap().into_raw(); let back = unsafe { ${C}::from_raw(p) }; d(back)`);

add('nul_error/nul_position', 'nul_position', CS('NulError'), 'How NulError::nul_position works', 'Where the forbidden NUL byte was found.', {
  rows: [['"ab\\0c"']], call: 'CString::new(s).unwrap_err().nul_position()', note: 'byte index', outs: ['2'],
  intro: 'Helps report which character is wrong.',
  steps: [['a and b are fine.', 0], ['The NUL is at 2.', [], 'o0']],
  result: '2', resultCap: 'into_vec gives the bytes back.',
}, `${C}::new("ab\\0c").unwrap_err().nul_position().to_string()`);

add('nul_error/into_vec', 'into_vec', CS('NulError'), 'How NulError::into_vec works', 'Gets the bytes back after CString::new failed.', {
  rows: [['"a\\0"']], call: 'err.into_vec()', note: 'nothing lost', outs: ['[97, 0]'],
  intro: 'The original data is returned unchanged.',
  steps: [['new() failed.', 0], ['[97, 0] comes back.', [], 'o0']],
  result: '[97, 0]', resultCap: 'Clean it and try again.',
}, `d(${C}::new("a\\0").unwrap_err().into_vec())`);

add('into_string_error/into_cstring', 'into_cstring', CS('IntoStringError'), 'How IntoStringError::into_cstring works', 'Gets the CString back after into_string failed.', {
  rows: [['CString with byte 0xFF']], call: 'err.into_cstring()', note: 'nothing lost', outs: ['the CString'],
  intro: 'Invalid UTF-8 cannot become a String, but you keep the data.',
  steps: [['into_string failed.', 0], ['The CString comes back.', [], 'o0']],
  result: '[255]', resultCap: 'Try to_string_lossy instead.',
}, `d(${C}::new(vec![0xFFu8]).unwrap().into_string().unwrap_err().into_cstring().into_bytes())`);

add('into_string_error/utf8_error', 'utf8_error', CS('IntoStringError'), 'How IntoStringError::utf8_error works', 'Details about the invalid UTF-8.', {
  rows: [['bytes "a" then 0xFF']], call: 'err.utf8_error().valid_up_to()', note: 'where it broke', outs: ['1'],
  intro: 'The first byte is valid, the second is not.',
  steps: [['"a" is fine.', 0], ['Valid up to 1.', [], 'o0']],
  result: '1', resultCap: 'Same Utf8Error as str::from_utf8 returns.',
}, `${C}::new(vec![b'a', 0xFF]).unwrap().into_string().unwrap_err().utf8_error().valid_up_to().to_string()`);

add('from_vec_with_nul_error/as_bytes', 'as_bytes', CS('FromVecWithNulError'), 'How FromVecWithNulError::as_bytes works', 'Looks at the bytes that could not become a CString.', {
  rows: [['b"no nul"']], call: 'err.as_bytes()', note: 'peek', outs: ['b"no nul"'],
  intro: 'They lacked a terminating NUL.',
  steps: [['The conversion failed.', 0], ['The bytes are still there.', [], 'o0']],
  result: '"no nul"', resultCap: 'into_bytes takes them back.',
}, `let e = ${C}::from_vec_with_nul(b"no nul".to_vec()).unwrap_err(); d(std::str::from_utf8(e.as_bytes()).unwrap())`);

add('from_vec_with_nul_error/into_bytes', 'into_bytes', CS('FromVecWithNulError'), 'How FromVecWithNulError::into_bytes works', 'Takes the bytes back after from_vec_with_nul failed.', {
  rows: [['b"x"']], call: 'err.into_bytes()', note: 'nothing lost', outs: ['[120]'],
  intro: 'Add a NUL and try again.',
  steps: [['The conversion failed.', 0], ['[120] comes back.', [], 'o0']],
  result: '[120]', resultCap: 'as_bytes only borrows them.',
}, `d(${C}::from_vec_with_nul(b"x".to_vec()).unwrap_err().into_bytes())`);

// ---------------------------------------------------------------- CStr

add('cstr/from_bytes_with_nul', 'from_bytes_with_nul', CCSTR, 'How CStr::from_bytes_with_nul works', 'Views bytes ending in exactly one NUL as a &CStr.', {
  rows: [['b"hi\\0"']], call: 'CStr::from_bytes_with_nul(b"hi\\0")', note: 'no copy', outs: ['Ok("hi")'],
  intro: 'The NUL must be the last byte and the only one.',
  steps: [['Checked: one NUL at the end.', 0], ['Ok(&CStr).', [], 'o0']],
  result: 'Ok("hi")', resultCap: 'c"hi" literals give a &CStr directly.',
}, `d(${CR}::from_bytes_with_nul(b"hi\\0"))`);

add('cstr/from_bytes_until_nul', 'from_bytes_until_nul', CCSTR, 'How CStr::from_bytes_until_nul works', 'Takes the bytes up to the first NUL as a &CStr.', {
  rows: [['b"ab\\0junk"']], call: 'CStr::from_bytes_until_nul(buf)', note: 'C buffers with garbage after', outs: ['Ok("ab")'],
  intro: 'Everything after the first NUL is ignored.',
  steps: [['Find the first 0.', 0], ['"ab" before it.', [], 'o0']],
  result: 'Ok("ab")', resultCap: 'Typical for fixed-size buffers filled by C.',
}, `d(${CR}::from_bytes_until_nul(b"ab\\0junk"))`);

add('cstr/to_str', 'to_str', CCSTR, 'How CStr::to_str works', 'The C string as a &str, if valid UTF-8.', {
  rows: [['c"hey"']], call: 'c.to_str()', note: 'Result<&str, Utf8Error>', outs: ['Ok("hey")'],
  intro: 'No copy: it borrows the bytes.',
  steps: [['Valid UTF-8.', 0], ['Ok("hey").', [], 'o0']],
  result: 'Ok("hey")', resultCap: 'to_string_lossy never fails.',
}, 'd(c"hey".to_str())');

add('cstr/to_string_lossy', 'to_string_lossy', CS('CStr'), 'How CStr::to_string_lossy works', 'The C string as text, replacing invalid bytes with �.', {
  rows: [['bytes 0x61, 0xFF']], call: 'c.to_string_lossy()', note: 'never fails', outs: ['"a�"'],
  intro: 'Returns a Cow: borrowed when nothing was replaced.',
  steps: [['a is fine.', 0], ['0xFF becomes �.', [], 'o0']],
  result: '"a�"', resultCap: 'Good for logging strings that came from C.',
}, `d(${CR}::from_bytes_with_nul(b"a\\xFF\\0").unwrap().to_string_lossy())`);

add('cstr/to_bytes', 'to_bytes', CCSTR, 'How CStr::to_bytes works', 'The bytes without the trailing NUL.', {
  rows: [['c"ok"']], call: 'c.to_bytes()', note: 'no terminator', outs: ['[111, 107]'],
  intro: 'Cheap: the length is computed once.',
  steps: [['Bytes o, k, NUL.', 0], ['Without NUL.', [], 'o0']],
  result: '[111, 107]', resultCap: 'to_bytes_with_nul includes the 0.',
}, 'd(c"ok".to_bytes())');

add('cstr/to_bytes_with_nul', 'to_bytes_with_nul', CCSTR, 'How CStr::to_bytes_with_nul works', 'The bytes including the trailing NUL.', {
  rows: [['c"ok"']], call: 'c.to_bytes_with_nul()', note: 'with terminator', outs: ['[111, 107, 0]'],
  intro: 'Exactly what is in memory.',
  steps: [['o, k...', 0], ['...and 0.', [], 'o0']],
  result: '[111, 107, 0]', resultCap: 'One byte longer than to_bytes.',
}, 'd(c"ok".to_bytes_with_nul())');

add('cstr/count_bytes', 'count_bytes', CCSTR, 'How CStr::count_bytes works', 'The length in bytes, not counting the NUL.', {
  rows: [['c"hello"']], call: 'c.count_bytes()', note: 'like strlen', outs: ['5'],
  intro: 'Same as to_bytes().len().',
  steps: [['Five bytes before the NUL.', 0], ['5.', [], 'o0']],
  result: '5', resultCap: 'Equivalent to C\'s strlen.',
}, 'c"hello".count_bytes().to_string()');

add('cstr/is_empty', 'is_empty', CCSTR, 'How CStr::is_empty works', 'true if the C string has no bytes before the NUL.', {
  rows: [['c""', 'c"x"']], call: 'c.is_empty()', note: 'just the terminator?', outs: ['true', 'false'],
  intro: 'An empty C string is a single 0 byte.',
  steps: [['c"": true.', 0, 'o0'], ['c"x": false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Cheap: it only checks the first byte.',
}, 'format!("{}, {}", c"".is_empty(), c"x".is_empty())');

add('cstr/as_ptr', 'as_ptr', CCSTR, 'How CStr::as_ptr works', 'A raw pointer to the C string, to pass to a C function.', {
  rows: [['c"abc"']], call: 'unsafe { strlen(c.as_ptr()) }', note: '*const c_char', outs: ['pointer to "abc\\0"'],
  intro: 'The CStr must live as long as C uses the pointer.',
  steps: [['Get the pointer.', 0], ['C reads up to the NUL.', [], 'o0']],
  result: '3', resultCap: 'A dangling pointer is a classic FFI bug: keep the owner alive.',
}, 'let s = c"abc"; let p = s.as_ptr(); unsafe { std::ffi::CStr::from_ptr(p) }.count_bytes().to_string()');

add('cstr/into_c_string', 'into_c_string', CS('CStr'), 'How CStr::into_c_string works', 'Turns a Box<CStr> into a CString without copying.', {
  rows: [['Box<CStr> "x"']], call: 'boxed.into_c_string()', note: 'owned again', outs: ['CString "x"'],
  intro: 'The opposite of CString::into_boxed_c_str.',
  steps: [['The box is handed over.', 0], ['A CString.', [], 'o0']],
  result: '"x"', resultCap: 'Rarely needed.',
}, `let b: Box<${CR}> = ${C}::new("x").unwrap().into_boxed_c_str(); d(b.into_c_string())`);

// ---------------------------------------------------------------- IP addresses

add('ipv4/new', 'new', IP('Ipv4Addr'), 'How Ipv4Addr::new works', 'An IPv4 address from its four numbers.', {
  rows: [['192', '168', '1', '10']], call: 'Ipv4Addr::new(192, 168, 1, 10)', note: 'a.b.c.d', outs: ['192.168.1.10'],
  intro: 'Each part is a u8 (0–255).',
  steps: [['Four octets.', [0, 1, 2, 3]], ['Printed with dots.', [], 'o0']],
  result: '192.168.1.10', resultCap: 'Ipv4Addr::LOCALHOST is 127.0.0.1.',
}, `${V4}::new(192, 168, 1, 10).to_string()`);

add('ipv4/from_str', 'from_str', PARSE('Ipv4Addr'), 'How parse works for Ipv4Addr', 'Parses text like "10.0.0.1" into an address.', {
  rows: [['"10.0.0.1"', '"10.0.0.256"']], call: '"10.0.0.1".parse::<Ipv4Addr>()', note: 'validated', outs: ['Ok(10.0.0.1)', 'Err'],
  intro: 'Each part must be 0–255, with exactly four parts.',
  steps: [['Valid: Ok.', 0, 'o0'], ['256 is too big: Err.', 1, 'o1']],
  result: 'Ok(10.0.0.1), Err', resultCap: 'IpAddr also accepts IPv6 text.',
}, `format!("{:?}, {}", "10.0.0.1".parse::<${V4}>(), if "10.0.0.256".parse::<${V4}>().is_err() { "Err" } else { "Ok" })`);

add('ipaddr/from_str', 'from_str', PARSE('IpAddr'), 'How parse works for IpAddr', 'Parses either an IPv4 or an IPv6 address.', {
  rows: [['"127.0.0.1"', '"::1"']], call: 's.parse::<IpAddr>()', note: 'either family', outs: ['V4(127.0.0.1)', 'V6(::1)'],
  intro: 'The text decides which variant you get.',
  steps: [['Dotted: V4.', 0, 'o0'], ['Colons: V6.', 1, 'o1']],
  result: 'Ok(127.0.0.1), Ok(::1)', resultCap: 'Match on IpAddr::V4 / V6 to handle each.',
}, `format!("{:?}, {:?}", "127.0.0.1".parse::<${IPA}>(), "::1".parse::<${IPA}>())`);

add('socketaddr/from_str', 'from_str', PARSE('SocketAddr'), 'How parse works for SocketAddr', 'Parses "address:port" text.', {
  rows: [['"127.0.0.1:8080"']], call: '"127.0.0.1:8080".parse::<SocketAddr>()', note: 'IP + port', outs: ['ip 127.0.0.1, port 8080'],
  intro: 'IPv6 needs brackets: "[::1]:8080".',
  steps: [['The address part.', 0], ['The port part.', [], 'o0']],
  result: '127.0.0.1, 8080', resultCap: 'Host names like "localhost:80" need ToSocketAddrs instead.',
}, 'let a: std::net::SocketAddr = "127.0.0.1:8080".parse().unwrap(); format!("{}, {}", a.ip(), a.port())');

add('ipv4/octets', 'octets', IP('Ipv4Addr'), 'How Ipv4Addr::octets works', 'The four bytes of the address.', {
  rows: [['10.20.30.40']], call: 'ip.octets()', note: '[u8; 4]', outs: ['[10, 20, 30, 40]'],
  intro: 'Useful for subnet calculations.',
  steps: [['The address.', 0], ['Its four bytes.', [], 'o0']],
  result: '[10, 20, 30, 40]', resultCap: 'to_bits gives one u32.',
}, `d(${V4}::new(10, 20, 30, 40).octets())`);

add('ipv4/to_bits', 'to_bits', IP('Ipv4Addr'), 'How Ipv4Addr::to_bits works', 'The address as a single u32.', {
  rows: [['192.168.0.1']], call: 'ip.to_bits()', note: 'big-endian number', outs: ['0xc0a80001'],
  intro: 'Handy for masks: bits & 0xffffff00.',
  steps: [['The four bytes...', 0], ['...as one number.', [], 'o0']],
  result: '0xc0a80001', resultCap: 'from_bits goes back.',
}, `format!("{:#x}", ${V4}::new(192, 168, 0, 1).to_bits())`);

add('ipv4/from_bits', 'from_bits', IP('Ipv4Addr'), 'How Ipv4Addr::from_bits works', 'An address from a u32.', {
  rows: [['0x7f000001']], call: 'Ipv4Addr::from_bits(0x7f000001)', note: 'number → address', outs: ['127.0.0.1'],
  intro: 'The highest byte is the first part.',
  steps: [['0x7f is 127.', 0], ['127.0.0.1.', [], 'o0']],
  result: '127.0.0.1', resultCap: 'Useful after subnet arithmetic.',
}, `${V4}::from_bits(0x7f000001).to_string()`);

add('ipv4/is_loopback', 'is_loopback', IP('Ipv4Addr'), 'How Ipv4Addr::is_loopback works', 'true for 127.x.x.x, this machine itself.', {
  rows: [['127.0.0.1', '8.8.8.8']], call: 'ip.is_loopback()', note: 'localhost', outs: ['true', 'false'],
  intro: 'Traffic to loopback never leaves the computer.',
  steps: [['127.0.0.1: true.', 0, 'o0'], ['8.8.8.8: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'The whole 127.0.0.0/8 range counts.',
}, `format!("{}, {}", ${V4}::new(127, 0, 0, 1).is_loopback(), ${V4}::new(8, 8, 8, 8).is_loopback())`);

add('ipv4/is_private', 'is_private', IP('Ipv4Addr'), 'How Ipv4Addr::is_private works', 'true for home and office network ranges (10.x, 172.16–31.x, 192.168.x).', {
  rows: [['192.168.1.5', '1.1.1.1']], call: 'ip.is_private()', note: 'not on the internet', outs: ['true', 'false'],
  intro: 'These addresses are only valid inside a local network.',
  steps: [['192.168.x.x: private.', 0, 'o0'], ['1.1.1.1: public.', 1, 'o1']],
  result: 'true, false', resultCap: 'Routers translate them with NAT.',
}, `format!("{}, {}", ${V4}::new(192, 168, 1, 5).is_private(), ${V4}::new(1, 1, 1, 1).is_private())`);

add('ipv4/is_unspecified', 'is_unspecified', IP('Ipv4Addr'), 'How Ipv4Addr::is_unspecified works', 'true for 0.0.0.0.', {
  rows: [['0.0.0.0', '10.0.0.1']], call: 'ip.is_unspecified()', note: '"any address"', outs: ['true', 'false'],
  intro: 'Binding to 0.0.0.0 listens on every network interface.',
  steps: [['0.0.0.0: true.', 0, 'o0'], ['10.0.0.1: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Ipv4Addr::UNSPECIFIED is the constant.',
}, `format!("{}, {}", ${V4}::UNSPECIFIED.is_unspecified(), ${V4}::new(10, 0, 0, 1).is_unspecified())`);

add('ipv4/is_broadcast', 'is_broadcast', IP('Ipv4Addr'), 'How Ipv4Addr::is_broadcast works', 'true for 255.255.255.255.', {
  rows: [['255.255.255.255']], call: 'ip.is_broadcast()', note: 'every host on the network', outs: ['true'],
  intro: 'Packets to it reach every machine on the local network.',
  steps: [['All bits set.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Ipv4Addr::BROADCAST is the constant.',
}, `${V4}::BROADCAST.is_broadcast().to_string()`);

add('ipv4/is_multicast', 'is_multicast', IP('Ipv4Addr'), 'How Ipv4Addr::is_multicast works', 'true for 224.0.0.0 to 239.255.255.255.', {
  rows: [['224.0.0.251', '10.0.0.1']], call: 'ip.is_multicast()', note: 'group addresses', outs: ['true', 'false'],
  intro: 'Multicast sends to a group of listeners.',
  steps: [['224.0.0.251 (mDNS): true.', 0, 'o0'], ['10.0.0.1: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Used by service discovery like mDNS.',
}, `format!("{}, {}", ${V4}::new(224, 0, 0, 251).is_multicast(), ${V4}::new(10, 0, 0, 1).is_multicast())`);

add('ipv4/is_link_local', 'is_link_local', IP('Ipv4Addr'), 'How Ipv4Addr::is_link_local works', 'true for 169.254.x.x, self-assigned addresses.', {
  rows: [['169.254.3.4']], call: 'ip.is_link_local()', note: 'no DHCP server found', outs: ['true'],
  intro: 'A computer picks one when it cannot get an address.',
  steps: [['169.254.x.x.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Often a sign of network trouble.',
}, `${V4}::new(169, 254, 3, 4).is_link_local().to_string()`);

add('ipv4/is_documentation', 'is_documentation', IP('Ipv4Addr'), 'How Ipv4Addr::is_documentation works', 'true for ranges reserved for examples (e.g. 192.0.2.x).', {
  rows: [['192.0.2.1', '203.0.113.9']], call: 'ip.is_documentation()', note: 'safe in docs', outs: ['true', 'true'],
  intro: 'Use these in examples so nobody\'s real address is shown.',
  steps: [['192.0.2.1: documentation.', 0, 'o0'], ['203.0.113.9: too.', 1, 'o1']],
  result: 'true, true', resultCap: '198.51.100.x is the third range.',
}, `format!("{}, {}", ${V4}::new(192, 0, 2, 1).is_documentation(), ${V4}::new(203, 0, 113, 9).is_documentation())`);

add('ipaddr/is_ipv4', 'is_ipv4', IP('IpAddr'), 'How IpAddr::is_ipv4 works', 'true if the address is an IPv4 one.', {
  rows: [['127.0.0.1', '::1']], call: 'ip.is_ipv4()', note: 'which family?', outs: ['true', 'false'],
  intro: 'IpAddr holds either kind.',
  steps: [['V4: true.', 0, 'o0'], ['V6: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_ipv6 is the opposite.',
}, `format!("{}, {}", "127.0.0.1".parse::<${IPA}>().unwrap().is_ipv4(), "::1".parse::<${IPA}>().unwrap().is_ipv4())`);

add('ipaddr/is_ipv6', 'is_ipv6', IP('IpAddr'), 'How IpAddr::is_ipv6 works', 'true if the address is an IPv6 one.', {
  rows: [['::1']], call: 'ip.is_ipv6()', note: 'which family?', outs: ['true'],
  intro: 'IPv6 addresses contain colons.',
  steps: [['::1 is IPv6.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Match on IpAddr::V6(v6) to use its methods.',
}, `"::1".parse::<${IPA}>().unwrap().is_ipv6().to_string()`);

add('ipaddr/is_loopback', 'is_loopback', IP('IpAddr'), 'How IpAddr::is_loopback works', 'true for 127.x.x.x or ::1.', {
  rows: [['127.0.0.1', '::1', '10.0.0.1']], call: 'ip.is_loopback()', note: 'either family', outs: ['true', 'true', 'false'],
  intro: 'Works without knowing the family.',
  steps: [['Both loopbacks: true.', [0, 1], 'o0,1'], ['10.0.0.1: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'Allow admin pages only from loopback.',
}, `let f = |s: &str| s.parse::<${IPA}>().unwrap().is_loopback(); format!("{}, {}, {}", f("127.0.0.1"), f("::1"), f("10.0.0.1"))`);

add('ipaddr/is_unspecified', 'is_unspecified', IP('IpAddr'), 'How IpAddr::is_unspecified works', 'true for 0.0.0.0 or ::.', {
  rows: [['0.0.0.0', '::']], call: 'ip.is_unspecified()', note: '"any address"', outs: ['true', 'true'],
  intro: 'Means "listen everywhere" when binding.',
  steps: [['0.0.0.0: true.', 0, 'o0'], ['::: true.', 1, 'o1']],
  result: 'true, true', resultCap: 'Never a valid destination address.',
}, `format!("{}, {}", "0.0.0.0".parse::<${IPA}>().unwrap().is_unspecified(), "::".parse::<${IPA}>().unwrap().is_unspecified())`);

add('ipaddr/is_multicast', 'is_multicast', IP('IpAddr'), 'How IpAddr::is_multicast works', 'true for multicast addresses of either family.', {
  rows: [['239.1.1.1', 'ff02::1']], call: 'ip.is_multicast()', note: 'group addresses', outs: ['true', 'true'],
  intro: 'IPv6 multicast starts with ff.',
  steps: [['239.1.1.1: true.', 0, 'o0'], ['ff02::1: true.', 1, 'o1']],
  result: 'true, true', resultCap: 'Each family has its own multicast range.',
}, `format!("{}, {}", "239.1.1.1".parse::<${IPA}>().unwrap().is_multicast(), "ff02::1".parse::<${IPA}>().unwrap().is_multicast())`);

add('ipaddr/to_canonical', 'to_canonical', IP('IpAddr'), 'How IpAddr::to_canonical works', 'Turns an IPv4-mapped IPv6 address back into plain IPv4.', {
  rows: [['::ffff:10.0.0.1']], call: 'ip.to_canonical()', note: 'normalise', outs: ['10.0.0.1'],
  intro: 'Dual-stack servers often see IPv4 clients in this IPv6 form.',
  steps: [['An IPv6 wrapper around 10.0.0.1.', 0], ['Unwrapped to IPv4.', [], 'o0']],
  result: '10.0.0.1', resultCap: 'Normalise before comparing or logging addresses.',
}, `"::ffff:10.0.0.1".parse::<${IPA}>().unwrap().to_canonical().to_string()`);

module.exports = list;
