// bytes (Bytes, BytesMut, Buf, BufMut) and byteorder (ByteOrder, ReadBytesExt, WriteBytesExt).
const { group } = require('../rust_std/kit.cjs');
const BY = ['bytes', 'Bytes', /src[/]bytes[.]rs$/];
const BM = ['bytes', 'BytesMut', /src[/]bytes_mut[.]rs$/];
const BUF = ['bytes', 'Buf', /buf[/]buf_impl[.]rs$/];
const BUFM = ['bytes', 'BufMut', /buf[/]buf_mut[.]rs$/];
const BO = (o) => ['byteorder', o, /src[/]lib[.]rs$/];
const BIO = (o) => ['byteorder', o, /src[/]io[.]rs$/];
const { list, add } = group({ at: BY });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const U = 'use bytes::{Buf, BufMut, Bytes, BytesMut}; ';
const B = 'let b = Bytes::from_static(b"hello world"); ';

// ---------------------------------------------------------------- Bytes

add('bytes/bytes-from-static', 'from_static', null, 'How Bytes::from_static works', 'A Bytes that points at static data: no allocation, no copy.', one('Bytes::from_static(b"hello")', 'b"hello" in the binary', 'Bytes("hello")', 'zero-cost bytes', 'Cloning it is just copying a pointer and a length.', 'Point at the data.', 'Use it like a byte slice.', 'b"hello"', 'Bytes::from(vec) takes ownership of a Vec.'), U + 'd(Bytes::from_static(b"hello"))');
add('bytes/bytes-new', 'new', null, 'How Bytes::new works', 'An empty Bytes.', one('Bytes::new()', 'nothing', 'b""', 'empty value', 'Does not allocate.', 'Create it.', 'Length 0.', '0', 'Bytes::default() is the same.'), U + 'Bytes::new().len().to_string()');
add('bytes/bytes-copy-from-slice', 'copy_from_slice', null, 'How Bytes::copy_from_slice works', 'A Bytes holding a copy of a slice.', one('Bytes::copy_from_slice(&buf[..3])', 'buf = b"abcdef"', 'b"abc"', 'own a copy', 'Use it when the source is temporary.', 'Copy 3 bytes.', 'An owned Bytes.', 'b"abc"', 'from_static avoids the copy for static data.'), U + 'let buf = *b"abcdef"; d(Bytes::copy_from_slice(&buf[..3]))');
add('bytes/bytes-slice', 'slice', null, 'How Bytes::slice works', 'A sub-range of the Bytes that shares the same memory.', {
  rows: [['b"hello world"']], call: 'b.slice(6..)', note: 'no copy', outs: ['b"world"'],
  intro: 'Bytes is reference-counted: slices of it point into the same buffer and keep it alive.',
  steps: [['Take bytes 6 to the end.', 0], ['A new Bytes over the same memory.', [], 'o0']],
  result: 'b"world"', resultCap: 'This is why Bytes is popular in network code: cheap sub-slices.',
}, U + B + 'd(b.slice(6..))');
add('bytes/bytes-split-to', 'split_to', null, 'How Bytes::split_to works', 'Removes the first n bytes and returns them as their own Bytes.', {
  rows: [['b"hello world"']], call: 'let head = b.split_to(5);', note: 'b keeps the rest', outs: ['head = b"hello"', 'b = b" world"'],
  intro: 'Perfect for parsing: cut off a header, keep the body. No bytes are copied.',
  steps: [['The first 5 bytes become head.', 0, 'o0'], ['b now starts after them.', [], 'o1']],
  result: 'b"hello", b" world"', resultCap: 'split_off(n) keeps the front and returns the back.',
}, U + 'let mut b = Bytes::from_static(b"hello world"); let h = b.split_to(5); format!("{:?}, {:?}", h, b)');
add('bytes/bytes-split-off', 'split_off', null, 'How Bytes::split_off works', 'Splits at n: self keeps the front, the back is returned.', one('let tail = b.split_off(5);', 'b"hello world"', 'b = "hello", tail = " world"', 'cut in two', 'No copy: both share the buffer.', 'Split at 5.', 'Two Bytes.', 'b"hello", b" world"', 'split_to is the opposite.'), U + 'let mut b = Bytes::from_static(b"hello world"); let t = b.split_off(5); format!("{:?}, {:?}", b, t)');
add('bytes/bytes-truncate', 'truncate', null, 'How Bytes::truncate works', 'Shortens the Bytes to n bytes.', one('b.truncate(5)', 'b"hello world"', 'b"hello"', 'drop the end', 'Does nothing if it is already shorter.', 'Keep 5 bytes.', 'Done.', 'b"hello"', 'clear() empties it.'), U + 'let mut b = Bytes::from_static(b"hello world"); b.truncate(5); d(b)');
add('bytes/bytes-len', 'len', null, 'How Bytes::len works', 'The number of bytes.', one('b.len()', 'b"hello world"', '11', 'size', 'is_empty() checks for 0.', 'Count.', '11.', '11', 'Bytes also derefs to &[u8].'), U + B + 'b.len().to_string()');
add('bytes/bytes-slice-ref', 'slice_ref', null, 'How Bytes::slice_ref works', 'Turns a &[u8] that points into this Bytes into a Bytes, without copying.', one('b.slice_ref(subslice)', 'a &[u8] found inside b', 'Bytes sharing memory', 'after parsing', 'Panics if the slice is not inside b.', 'Find a sub-slice (e.g. with split).', 'Get it as Bytes.', 'b"world"', 'Lets &[u8]-based parsers return shared Bytes.'), U + B + 'let word = b.split(|&c| c == b\' \').nth(1).unwrap(); d(b.slice_ref(word))');
add('bytes/bytes-try-into-mut', 'try_into_mut', null, 'How Bytes::try_into_mut works', 'Turns a Bytes back into a BytesMut if no one else shares it.', one('b.try_into_mut()', 'unique Bytes', 'Ok(BytesMut)', 'reuse the buffer', 'Err(self) when other clones exist.', 'Only one owner.', 'Ok: editable again.', 'Ok, Err', 'Added in bytes 1.7.'), U + 'let a = Bytes::from(vec![1u8, 2]); let r1 = if a.try_into_mut().is_ok() { "Ok" } else { "Err" }; let b = Bytes::from(vec![1u8, 2]); let _c = b.clone(); let r2 = if b.try_into_mut().is_ok() { "Ok" } else { "Err" }; format!("{}, {}", r1, r2)');

// ---------------------------------------------------------------- BytesMut

add('bytes/bytesmut-with-capacity', 'with_capacity', BM, 'How BytesMut::with_capacity works', 'An empty, growable buffer with room for n bytes.', one('BytesMut::with_capacity(1024)', '1024', 'len 0, capacity ≥ 1024', 'pre-allocate', 'Writing within the capacity does not reallocate.', 'Allocate once.', 'Empty, but roomy.', '0, at least 1024', 'Like Vec::with_capacity.'), U + 'let b = BytesMut::with_capacity(1024); format!("{}, at least {}", b.len(), if b.capacity() >= 1024 { 1024 } else { 0 })');
add('bytes/bytesmut-extend-from-slice', 'extend_from_slice', BM, 'How BytesMut::extend_from_slice works', 'Appends bytes, growing the buffer if needed.', one('buf.extend_from_slice(b"abc")', 'empty', 'b"abc"', 'append', 'Grows like a Vec.', 'Append.', 'Done.', 'b"abc"', 'put_slice (BufMut) does the same.'), U + 'let mut b = BytesMut::new(); b.extend_from_slice(b"abc"); d(b)');
add('bytes/bytesmut-freeze', 'freeze', BM, 'How BytesMut::freeze works', 'Turns the buffer into an immutable, cheaply cloneable Bytes.', {
  rows: [['BytesMut "ab"']], call: 'let bytes = buf.freeze();', note: 'no copy', outs: ['Bytes("ab")'],
  intro: 'Build data in a BytesMut, then freeze it and share it: clones of Bytes are cheap.',
  steps: [['The buffer stops being mutable.', 0], ['Same memory, now a Bytes.', [], 'o0']],
  result: 'b"ab"', resultCap: 'Bytes::try_into_mut can go back if it is unique.',
}, U + 'let mut b = BytesMut::new(); b.extend_from_slice(b"ab"); d(b.freeze())');
add('bytes/bytesmut-split-to', 'split_to', BM, 'How BytesMut::split_to works', 'Cuts off the first n bytes as their own BytesMut.', one('let frame = buf.split_to(4);', 'b"PINGrest"', 'frame = "PING", buf = "rest"', 'frame parsing', 'The classic way to take one complete message off a read buffer.', 'Cut 4 bytes.', 'The rest stays.', 'b"PING", b"rest"', 'Then freeze() the frame.'), U + 'let mut b = BytesMut::from(&b"PINGrest"[..]); let f = b.split_to(4); format!("{:?}, {:?}", f, b)');
add('bytes/bytesmut-split', 'split', BM, 'How BytesMut::split works', 'Takes everything written so far, leaving an empty buffer with the spare capacity.', one('let msg = buf.split();', 'b"hi" + spare room', 'msg = "hi", buf = ""', 'hand off data', 'buf keeps the remaining capacity for more writes.', 'Take all bytes.', 'buf is empty again.', 'b"hi", 0', 'split_to(n) takes only n.'), U + 'let mut b = BytesMut::with_capacity(64); b.extend_from_slice(b"hi"); let m = b.split(); format!("{:?}, {}", m, b.len())');
add('bytes/bytesmut-reserve', 'reserve', BM, 'How BytesMut::reserve works', 'Makes sure there is room for n more bytes.', one('buf.reserve(100)', 'len 2', 'capacity ≥ 102', 'avoid reallocations', 'May reclaim space freed by earlier split_to calls.', 'Grow if needed.', 'Room for 100 more.', 'room: true', 'Like Vec::reserve.'), U + 'let mut b = BytesMut::from(&b"ab"[..]); b.reserve(100); format!("room: {}", b.capacity() - b.len() >= 100)');
add('bytes/bytesmut-resize', 'resize', BM, 'How BytesMut::resize works', 'Sets the length, filling new bytes with a value.', one('buf.resize(5, 0)', 'b"ab"', 'b"ab\\0\\0\\0"', 'fixed size', 'Shrinking just cuts the end.', 'Grow to 5.', 'Fill with 0.', '[97, 98, 0, 0, 0]', 'zeroed(n) makes a zero buffer.'), U + 'let mut b = BytesMut::from(&b"ab"[..]); b.resize(5, 0); d(b.to_vec())');
add('bytes/bytesmut-unsplit', 'unsplit', BM, 'How BytesMut::unsplit works', 'Joins back a BytesMut that was split off, without copying if they are adjacent.', one('a.unsplit(b)', '"ab" and "cd" from one buffer', '"abcd"', 'undo a split', 'Copies only when the two are not contiguous.', 'Split, then join.', 'One buffer again.', 'b"abcd"', 'Cheap when undoing split_off.'), U + 'let mut a = BytesMut::from(&b"abcd"[..]); let b = a.split_off(2); a.unsplit(b); d(a)');
add('bytes/bytesmut-truncate', 'truncate', BM, 'How BytesMut::truncate works', 'Shortens the buffer, keeping its capacity.', one('buf.truncate(1)', 'b"abc"', 'b"a"', 'drop the end', 'clear() is truncate(0).', 'Keep 1 byte.', 'Done.', 'b"a"', 'Capacity is kept for reuse.'), U + 'let mut b = BytesMut::from(&b"abc"[..]); b.truncate(1); d(b)');

// ---------------------------------------------------------------- Buf (reading)

const R = 'let mut r = Bytes::from_static(&[0x01, 0x02, 0x03, 0x04, 0x05]); ';
add('bytes/buf-get-u8', 'get_u8', BUF, 'How Buf::get_u8 works', 'Reads one byte and advances.', one('r.get_u8()', '[01 02 03 ...]', '1', 'read a byte', 'Panics if nothing is left; try_get_u8 returns a Result.', 'Read 0x01.', 'The cursor moves on.', '1, then 4 left', 'All get_* methods advance the buffer.'), U + R + 'let a = r.get_u8(); format!("{}, then {} left", a, r.remaining())');
add('bytes/buf-get-u16', 'get_u16', BUF, 'How Buf::get_u16 works', 'Reads 2 bytes as a big-endian u16 and advances.', {
  rows: [['01', '02', '03']], call: 'r.get_u16()', note: 'big-endian (network order)', outs: ['258'],
  intro: 'Big-endian means the first byte is the high byte: 0x0102 = 258. get_u16_le reads little-endian.',
  steps: [['Take 01 and 02.', [0, 1]], ['0x01 × 256 + 0x02 = 258.', [], 'o0']],
  result: '258', resultCap: 'There are get_u32, get_i64, get_f64... in both byte orders.',
}, U + R + 'r.get_u16().to_string()');
add('bytes/buf-get-u32-le', 'get_u32_le', BUF, 'How Buf::get_u32_le works', 'Reads 4 bytes as a little-endian u32.', one('r.get_u32_le()', '[01 02 03 04]', '0x04030201', 'little-endian', 'The first byte is the low byte.', 'Take 4 bytes.', 'Lowest byte first.', '0x4030201', 'x86 and most file formats use little-endian.'), U + R + 'format!("{:#x}", r.get_u32_le())');
add('bytes/buf-remaining', 'remaining', BY, 'How Buf::remaining works (Bytes)', 'How many bytes are left to read.', one('r.remaining()', '5 bytes, 2 read', '3', 'bounds check', 'has_remaining() checks for > 0.', 'Read 2 bytes.', '3 remain.', '3', 'Check it before get_* to avoid panics.'), U + R + 'r.advance(2); r.remaining().to_string()');
add('bytes/buf-advance', 'advance', BY, 'How Buf::advance works (Bytes)', 'Skips n bytes.', one('r.advance(3)', '[01 02 03 04 05]', 'next is 04', 'skip data', 'Panics if fewer than n bytes are left.', 'Skip 3.', 'Read the next.', '4', 'Use it to skip padding or known headers.'), U + R + 'r.advance(3); r.get_u8().to_string()');
add('bytes/buf-copy-to-bytes', 'copy_to_bytes', BY, 'How Buf::copy_to_bytes works (Bytes)', 'Takes the next n bytes as a Bytes (zero-copy when the source is Bytes).', one('r.copy_to_bytes(2)', '[01 02 03 ...]', 'Bytes([1, 2])', 'take a chunk', 'For Bytes sources it is just a slice.', 'Take 2.', 'The rest remains.', 'b"\\x01\\x02", 3 left', 'chunk() borrows instead.'), U + R + 'let c = r.copy_to_bytes(2); format!("{:?}, {} left", c, r.remaining())');
add('bytes/buf-chunk', 'chunk', BY, 'How Buf::chunk works (Bytes)', 'The bytes that can be read right now, as a slice (without advancing).', one('r.chunk()', '[01 02 03 04 05]', '&[1, 2, 3, 4, 5]', 'peek', 'For chained buffers it may be only the first part.', 'Look at the bytes.', 'Nothing is consumed.', '[1, 2, 3, 4, 5]', 'Then advance() past what you used.'), U + R + 'd(r.chunk())');
add('bytes/buf-try-get-u16', 'try_get_u16', BUF, 'How Buf::try_get_u16 works', 'Like get_u16, but returns Err instead of panicking when too few bytes are left.', one('r.try_get_u16()', '1 byte left', 'Err(TryGetError)', 'safe parsing', 'Added in bytes 1.10.', 'Need 2 bytes, have 1.', 'Err instead of a panic.', 'Ok(258), then Err', 'Every get_* has a try_get_* form.'), U + 'let mut r = Bytes::from_static(&[1, 2, 3]); let a = r.try_get_u16(); let b = r.try_get_u16(); format!("{:?}, then {}", a.map_err(|_| ()), if b.is_err() { "Err" } else { "Ok" })');
add('bytes/buf-take', 'take', BUF, 'How Buf::take works', 'A view that reads at most n bytes of the buffer.', one('r.take(2)', '[01 02 03 ...]', 'only 2 readable', 'limit a reader', 'Useful to hand a sub-parser exactly one field.', 'Limit to 2.', 'remaining() is 2.', '2', 'chain joins two buffers.'), U + R + 'r.take(2).remaining().to_string()');

// ---------------------------------------------------------------- BufMut (writing)

add('bytes/bufmut-put-u8', 'put_u8', [BM, BUFM], 'How BufMut::put_u8 works (BytesMut)', 'Appends one byte.', one('buf.put_u8(0xFF)', 'empty', '[255]', 'write a byte', 'Vec<u8> and BytesMut implement BufMut.', 'Append.', 'Done.', '[255]', 'put_i8 for signed.'), U + 'let mut b = BytesMut::new(); b.put_u8(0xFF); d(b.to_vec())');
add('bytes/bufmut-put-u16', 'put_u16', BUFM, 'How BufMut::put_u16 works', 'Appends a u16 in big-endian order.', {
  rows: [['258']], call: 'buf.put_u16(258)', note: 'network byte order', outs: ['[0x01, 0x02]'],
  intro: 'Big-endian writes the high byte first. put_u16_le writes the low byte first.',
  steps: [['258 = 0x0102.', 0], ['High byte 01, then low byte 02.', [], 'o0']],
  result: '[1, 2]', resultCap: 'get_u16 reads it back.',
}, U + 'let mut b = Vec::new(); b.put_u16(258); d(b)');
add('bytes/bufmut-put-slice', 'put_slice', BM, 'How BufMut::put_slice works (BytesMut)', 'Appends a byte slice.', one('buf.put_slice(b"GET ")', 'empty', 'b"GET "', 'write bytes', 'Panics if a fixed-size buffer has no room.', 'Append.', 'Done.', 'b"GET "', 'put() takes another Buf.'), U + 'let mut b = BytesMut::new(); b.put_slice(b"GET "); d(b)');
add('bytes/bufmut-put-f64-le', 'put_f64_le', BUFM, 'How BufMut::put_f64_le works', 'Appends an f64 as 8 little-endian bytes.', one('buf.put_f64_le(1.0)', '1.0', '8 bytes', 'binary floats', 'IEEE 754 bits, low byte first.', 'Encode 1.0.', '8 bytes, last is 0x3f.', '8 bytes, last 0x3f', 'get_f64_le reads it back.'), U + 'let mut b = Vec::new(); b.put_f64_le(1.0); format!("{} bytes, last {:#x}", b.len(), b[7])');
add('bytes/bufmut-put-bytes', 'put_bytes', ['bytes', 'Vec', /buf[/]buf_mut[.]rs$/], 'How BufMut::put_bytes works (Vec)', 'Appends one byte value n times.', one('buf.put_bytes(0, 4)', 'empty', '[0, 0, 0, 0]', 'padding', 'Faster than a loop of put_u8.', 'Repeat 0 four times.', 'Done.', '[0, 0, 0, 0]', 'Handy for alignment padding.'), U + 'let mut b = Vec::new(); b.put_bytes(0, 4); d(b)');
add('bytes/bufmut-remaining-mut', 'remaining_mut', BUFM, 'How BufMut::remaining_mut works', 'How many more bytes can be written.', one('slice.remaining_mut()', '&mut [u8; 4], 1 written', '3', 'room left', 'Growable buffers report a huge number.', 'Write 1 byte.', '3 bytes of room left.', '3', 'has_remaining_mut checks for > 0.'), U + 'let mut a = [0u8; 4]; let mut s = &mut a[..]; s.put_u8(1); s.remaining_mut().to_string()');

// ---------------------------------------------------------------- byteorder

const BU = 'use byteorder::{BigEndian, ByteOrder, LittleEndian, ReadBytesExt, WriteBytesExt}; ';
add('byteorder/read-u16-be', 'read_u16', BO('BigEndian'), 'How BigEndian::read_u16 works (byteorder)', 'Reads a u16 from the first 2 bytes of a slice, big-endian.', one('BigEndian::read_u16(&[1, 2])', '[0x01, 0x02]', '258', 'decode a field', 'Panics if the slice is shorter than 2.', 'High byte first.', '0x0102.', '258', 'LittleEndian::read_u16 gives 513.'), BU + 'BigEndian::read_u16(&[1, 2]).to_string()');
add('byteorder/read-u32-le', 'read_u32', BO('LittleEndian'), 'How LittleEndian::read_u32 works (byteorder)', 'Reads a u32 from 4 bytes, little-endian.', one('LittleEndian::read_u32(&[1, 0, 0, 0])', '[01 00 00 00]', '1', 'decode a field', 'The first byte is the lowest.', 'Low byte first.', '1.', '1', 'u32::from_le_bytes is the std way.'), BU + 'LittleEndian::read_u32(&[1, 0, 0, 0]).to_string()');
add('byteorder/write-u16-be', 'write_u16', BO('BigEndian'), 'How BigEndian::write_u16 works (byteorder)', 'Writes a u16 into a slice, big-endian.', one('BigEndian::write_u16(&mut buf, 258)', '258', '[1, 2]', 'encode a field', 'The slice must have room.', 'Split 258 into bytes.', 'High byte first.', '[1, 2]', 'read_u16 goes back.'), BU + 'let mut b = [0u8; 2]; BigEndian::write_u16(&mut b, 258); d(b)');
add('byteorder/read-i32-be', 'read_i32', BO('ByteOrder'), 'How ByteOrder::read_i32 works (byteorder)', 'Reads a signed i32, in the byte order of the type you call it on.', one('BigEndian::read_i32(&[0xFF; 4])', '[FF FF FF FF]', '-1', 'signed values', 'Two\'s complement: all ones is -1.', 'Read 4 bytes.', 'As signed: -1.', '-1', 'Implemented once in the trait for every order.'), BU + 'BigEndian::read_i32(&[0xFF; 4]).to_string()');
add('byteorder/read-u16-ext', 'read_u16', BIO('ReadBytesExt'), 'How ReadBytesExt::read_u16 works (byteorder)', 'Reads a u16 from any io::Read, in the byte order you name.', {
  rows: [['01', '02', '...']], call: 'rdr.read_u16::<BigEndian>()?', note: 'on files, sockets, Cursors...', outs: ['258'],
  intro: 'ReadBytesExt adds read_u8, read_u16, read_f64... to every io::Read.',
  steps: [['Read 2 bytes from the reader.', [0, 1]], ['Big-endian: 258.', [], 'o0']],
  result: '258', resultCap: 'Errors with UnexpectedEof when the data runs out.',
}, BU + 'let mut r = std::io::Cursor::new(vec![1u8, 2, 3]); r.read_u16::<BigEndian>().unwrap().to_string()');
add('byteorder/read-u8-ext', 'read_u8', BIO('ReadBytesExt'), 'How ReadBytesExt::read_u8 works (byteorder)', 'Reads one byte from an io::Read.', one('rdr.read_u8()?', '[7, 8]', '7', 'one byte', 'No byte order needed for single bytes.', 'Read one byte.', '7.', '7', 'read_i8 for signed.'), BU + 'let mut r = std::io::Cursor::new(vec![7u8, 8]); r.read_u8().unwrap().to_string()');
add('byteorder/read-f32-ext', 'read_f32', BIO('ReadBytesExt'), 'How ReadBytesExt::read_f32 works (byteorder)', 'Reads a 4-byte float.', one('rdr.read_f32::<LittleEndian>()?', '[00 00 80 3F]', '1.0', 'binary floats', 'IEEE 754 single precision.', 'Read 4 bytes.', 'As f32.', '1', 'read_f64 for doubles.'), BU + 'let mut r = std::io::Cursor::new(vec![0u8, 0, 0x80, 0x3F]); r.read_f32::<LittleEndian>().unwrap().to_string()');
add('byteorder/write-u32-ext', 'write_u32', BIO('WriteBytesExt'), 'How WriteBytesExt::write_u32 works (byteorder)', 'Writes a u32 to any io::Write, in the byte order you name.', one('wtr.write_u32::<LittleEndian>(1)?', '1', '[1, 0, 0, 0]', 'encode to a writer', 'Vec<u8> implements io::Write.', 'Encode 1.', 'Low byte first.', '[1, 0, 0, 0]', 'Pairs with read_u32.'), BU + 'let mut w = Vec::new(); w.write_u32::<LittleEndian>(1).unwrap(); d(w)');
add('byteorder/write-u8-ext', 'write_u8', BIO('WriteBytesExt'), 'How WriteBytesExt::write_u8 works (byteorder)', 'Writes one byte to an io::Write.', one('wtr.write_u8(42)?', '42', '[42]', 'one byte', 'No byte order needed.', 'Write.', 'Done.', '[42]', 'write_i8 for signed.'), BU + 'let mut w = Vec::new(); w.write_u8(42).unwrap(); d(w)');
add('byteorder/write-i16-ext', 'write_i16', BIO('WriteBytesExt'), 'How WriteBytesExt::write_i16 works (byteorder)', 'Writes an i16, big- or little-endian.', one('wtr.write_i16::<BigEndian>(-2)?', '-2', '[0xFF, 0xFE]', 'signed values', 'Two\'s complement bytes.', 'Encode -2.', 'High byte first.', '[255, 254]', 'read_i16 reads it back.'), BU + 'let mut w = Vec::new(); w.write_i16::<BigEndian>(-2).unwrap(); d(w)');

module.exports = list;
