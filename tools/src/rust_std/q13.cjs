// Rust standard library: the rest of std::io (BufReader/BufWriter/LineWriter internals, stdin/stdout/stderr
// handles, pipes, io::Error details, Chain/Take/Cursor accessors, IoSlice).
const { group } = require('./kit.cjs');
const BR = ['std', 'BufReader', /buffered\/bufreader\.rs$/];
const BW = ['std', 'BufWriter', /buffered\/bufwriter\.rs$/];
const LW = ['std', 'LineWriter', /buffered\/linewriter\.rs$/];
const STDIO = (o) => ['std', o, /io\/stdio\.rs$/];
const CUT = (o) => ['core', o, /io\/util\.rs$/];
const CERR = ['core', 'Error', /io\/error\.rs$/];
const AERR = ['alloc', 'Error', /io\/error\.rs$/];
const SERR = ['std', 'Error', /io\/error\.rs$/];
const { list, add } = group({ at: BR });
const IO = 'use std::io::{BufRead, Read, Write}; ';
const CUR = (s) => `std::io::Cursor::new(${s})`;

// ---------------------------------------------------------------- BufReader

add('bufreader/with_capacity', 'with_capacity', null, 'How BufReader::with_capacity works', 'A BufReader with a buffer of the size you choose.', {
  rows: [['64 KB buffer']], call: 'BufReader::with_capacity(64 * 1024, file)', note: 'bigger reads', outs: ['capacity 65536'],
  intro: 'The default is 8 KB; large sequential reads may benefit from more.',
  steps: [['A 64 KB buffer is allocated.', 0], ['capacity() reports it.', [], 'o0']],
  result: '65536', resultCap: 'Measure before tuning.',
}, `std::io::BufReader::with_capacity(64 * 1024, ${CUR('"x"')}).capacity().to_string()`);

add('bufreader/capacity', 'capacity', null, 'How BufReader::capacity works', 'The size of the internal buffer.', {
  rows: [['BufReader::new(r)']], call: 'reader.capacity()', note: 'default 8 KB', outs: ['8192'],
  intro: 'Not how much data is buffered, but how much fits.',
  steps: [['A default BufReader.', 0], ['8192 bytes of room.', [], 'o0']],
  result: '8192', resultCap: 'buffer() shows the data currently held.',
}, `std::io::BufReader::new(${CUR('"x"')}).capacity().to_string()`);

add('bufreader/buffer', 'buffer', null, 'How BufReader::buffer works', 'The data read ahead but not yet consumed.', {
  rows: [['"hello world"']], call: 'r.fill_buf()?; r.consume(6); r.buffer()', note: 'peek at the buffer', outs: ['b"world"'],
  intro: 'After a read-ahead, part of the data waits in the buffer.',
  steps: [['The buffer is filled; 6 bytes consumed.', 0], ['"world" is still buffered.', [], 'o0']],
  result: '"world"', resultCap: 'Useful for protocol parsers that need to look ahead.',
}, IO + `let mut r = std::io::BufReader::new(${CUR('"hello world"')}); r.fill_buf().unwrap(); r.consume(6); d(std::str::from_utf8(r.buffer()).unwrap())`);

add('bufreader/get_ref', 'get_ref', null, 'How BufReader::get_ref works', 'A reference to the reader inside.', {
  rows: [['BufReader<Cursor>']], call: 'r.get_ref().position()', note: 'inspect the inner reader', outs: ['inner position'],
  intro: 'The inner reader may be ahead of what you consumed, because of buffering.',
  steps: [['After one read, the buffer pulled everything.', 0], ['The inner Cursor is at the end: 3.', [], 'o0']],
  result: '3', resultCap: 'Do not read from the inner reader directly; buffered data would be skipped.',
}, IO + `let mut r = std::io::BufReader::new(${CUR('"abc"')}); let mut b = [0u8; 1]; r.read_exact(&mut b).unwrap(); r.get_ref().position().to_string()`);

add('bufreader/get_mut', 'get_mut', null, 'How BufReader::get_mut works', 'A mutable reference to the reader inside.', {
  rows: [['BufReader<Cursor>']], call: 'r.get_mut().set_position(0)', note: 'careful with buffered data', outs: ['inner reader changed'],
  intro: 'Changing the inner reader can confuse the buffer.',
  steps: [['Get &mut to the Cursor.', 0], ['Reposition it.', [], 'o0']],
  result: '0', resultCap: 'Prefer Seek on the BufReader itself, which discards the buffer correctly.',
}, `let mut r = std::io::BufReader::new(${CUR('"abc"')}); r.get_mut().set_position(0); r.get_ref().position().to_string()`);

add('bufreader/into_inner', 'into_inner', null, 'How BufReader::into_inner works', 'Unwraps the BufReader; buffered data is lost.', {
  rows: [['BufReader<Cursor>']], call: 'let cursor = r.into_inner();', note: 'drops the buffer', outs: ['the inner reader'],
  intro: 'Anything already pulled into the buffer is discarded.',
  steps: [['The BufReader is consumed.', 0], ['You get the inner reader back.', [], 'o0']],
  result: '0', resultCap: 'Read everything you need first.',
}, `let r = std::io::BufReader::new(${CUR('"abc"')}); r.into_inner().position().to_string()`);

add('bufreader/seek_relative', 'seek_relative', null, 'How BufReader::seek_relative works', 'Moves the position by an offset, keeping the buffer when possible.', {
  rows: [['"abcdef" after reading 1']], call: 'r.seek_relative(2)?', note: 'skip without refilling', outs: ['next byte "d"'],
  intro: 'Small skips stay inside the buffer, so nothing is reread.',
  steps: [['"a" was read.', 0], ['Skip 2: next is "d".', [], 'o0']],
  result: '"d"', resultCap: 'Seek::seek would throw the buffer away.',
}, IO + `let mut r = std::io::BufReader::new(${CUR('"abcdef"')}); let mut b = [0u8; 1]; r.read_exact(&mut b).unwrap(); r.seek_relative(2).unwrap(); r.read_exact(&mut b).unwrap(); d(std::str::from_utf8(&b).unwrap())`);

// ---------------------------------------------------------------- BufWriter, LineWriter

add('bufwriter/with_capacity', 'with_capacity', BW, 'How BufWriter::with_capacity works', 'A BufWriter with a buffer of the size you choose.', {
  rows: [['1 KB']], call: 'BufWriter::with_capacity(1024, file)', note: 'tune the batch size', outs: ['capacity 1024'],
  intro: 'Writes are collected until the buffer is full.',
  steps: [['A 1 KB buffer.', 0], ['capacity() is 1024.', [], 'o0']],
  result: '1024', resultCap: 'Default is 8 KB.',
}, 'std::io::BufWriter::with_capacity(1024, Vec::<u8>::new()).capacity().to_string()');

add('bufwriter/capacity', 'capacity', BW, 'How BufWriter::capacity works', 'The size of the internal buffer.', {
  rows: [['BufWriter::new(w)']], call: 'w.capacity()', note: 'default 8 KB', outs: ['8192'],
  intro: 'How much can be collected before a real write happens.',
  steps: [['A default BufWriter.', 0], ['8192.', [], 'o0']],
  result: '8192', resultCap: 'buffer() shows what is waiting.',
}, 'std::io::BufWriter::new(Vec::<u8>::new()).capacity().to_string()');

add('bufwriter/buffer', 'buffer', BW, 'How BufWriter::buffer works', 'The bytes written but not yet passed to the inner writer.', {
  rows: [['wrote "hi"']], call: 'w.buffer()', note: 'pending data', outs: ['b"hi"'],
  intro: 'They are sent on flush, when the buffer fills, or on drop.',
  steps: [['"hi" was written.', 0], ['It waits in the buffer.', [], 'o0']],
  result: '"hi"', resultCap: 'get_ref() is still empty at this point.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::<u8>::new()); w.write_all(b"hi").unwrap(); d(std::str::from_utf8(w.buffer()).unwrap())');

add('bufwriter/get_ref', 'get_ref', BW, 'How BufWriter::get_ref works', 'A reference to the writer inside.', {
  rows: [['before / after flush']], call: 'w.get_ref().len()', note: 'what has really been written', outs: ['0', '2'],
  intro: 'Data reaches the inner writer only on flush.',
  steps: [['Before flush: 0 bytes inside.', 0, 'o0'], ['After flush: 2.', 0, 'o1']],
  result: '0, 2', resultCap: 'Do not write to the inner writer directly.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::<u8>::new()); w.write_all(b"hi").unwrap(); let a = w.get_ref().len(); w.flush().unwrap(); format!("{}, {}", a, w.get_ref().len())');

add('bufwriter/get_mut', 'get_mut', BW, 'How BufWriter::get_mut works', 'A mutable reference to the writer inside.', {
  rows: [['BufWriter<Vec<u8>>']], call: 'w.get_mut().clear()', note: 'careful: buffered data is separate', outs: ['inner Vec cleared'],
  intro: 'Bytes still in the buffer are not affected.',
  steps: [['Flush, then clear the inner Vec.', 0], ['It is empty.', [], 'o0']],
  result: '0', resultCap: 'Rarely needed.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::<u8>::new()); w.write_all(b"x").unwrap(); w.flush().unwrap(); w.get_mut().clear(); w.get_ref().len().to_string()');

add('bufwriter/into_inner', 'into_inner', BW, 'How BufWriter::into_inner works', 'Flushes and returns the inner writer.', {
  rows: [['wrote "ok"']], call: 'let v = w.into_inner()?;', note: 'flush + unwrap', outs: ['b"ok"'],
  intro: 'Returns an error if the final flush fails, with the BufWriter still inside.',
  steps: [['The buffer is flushed.', 0], ['The inner Vec comes back.', [], 'o0']],
  result: '"ok"', resultCap: 'Dropping a BufWriter also flushes, but ignores errors.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::<u8>::new()); w.write_all(b"ok").unwrap(); d(String::from_utf8(w.into_inner().unwrap()).unwrap())');

add('bufwriter/into_parts', 'into_parts', BW, 'How BufWriter::into_parts works', 'Unwraps without flushing: the inner writer and the unwritten bytes.', {
  rows: [['wrote "abc"']], call: 'let (inner, pending) = w.into_parts();', note: 'no flush', outs: ['inner []', 'pending "abc"'],
  intro: 'Useful when the inner writer is broken and you want the data back.',
  steps: [['The inner writer is untouched.', 0, 'o0'], ['The buffered bytes are returned.', 0, 'o1']],
  result: '0, "abc"', resultCap: 'pending is Err if a previous write panicked.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::<u8>::new()); w.write_all(b"abc").unwrap(); let (inner, pending) = w.into_parts(); format!("{}, {:?}", inner.len(), String::from_utf8(pending.unwrap()).unwrap())');

add('linewriter/new', 'new', LW, 'How LineWriter::new works', 'A buffered writer that flushes after every newline.', {
  rows: [['wrote "a\\nb"']], call: 'let mut w = LineWriter::new(out);', note: 'line buffering', outs: ['"a\\n" written, "b" waiting'],
  intro: 'Complete lines go out at once; a partial line waits.',
  steps: [['"a\\n" is a full line: written.', 0], ['"b" stays buffered.', [], 'o0']],
  result: '"a\\n"', resultCap: 'stdout uses line buffering like this.',
}, IO + 'let mut w = std::io::LineWriter::new(Vec::<u8>::new()); w.write_all(b"a\\nb").unwrap(); d(std::str::from_utf8(w.get_ref()).unwrap())');

add('linewriter/with_capacity', 'with_capacity', LW, 'How LineWriter::with_capacity works', 'A LineWriter with a chosen buffer size.', {
  rows: [['256 bytes']], call: 'LineWriter::with_capacity(256, out)', note: 'buffer for partial lines', outs: ['ok'],
  intro: 'Very long lines are flushed when the buffer fills.',
  steps: [['A 256-byte buffer.', 0], ['Behaves like LineWriter::new.', [], 'o0']],
  result: '"x\\n"', resultCap: 'The default is 1 KB.',
}, IO + 'let mut w = std::io::LineWriter::with_capacity(256, Vec::<u8>::new()); w.write_all(b"x\\n").unwrap(); d(std::str::from_utf8(w.get_ref()).unwrap())');

add('linewriter/get_ref', 'get_ref', LW, 'How LineWriter::get_ref works', 'A reference to the writer inside.', {
  rows: [['wrote "x" (no newline)']], call: 'w.get_ref()', note: 'what was really written', outs: ['empty'],
  intro: 'Without a newline nothing has been passed on yet.',
  steps: [['"x" waits in the buffer.', 0], ['The inner writer is empty.', [], 'o0']],
  result: '0', resultCap: 'flush() sends partial lines too.',
}, IO + 'let mut w = std::io::LineWriter::new(Vec::<u8>::new()); w.write_all(b"x").unwrap(); w.get_ref().len().to_string()');

add('linewriter/into_inner', 'into_inner', LW, 'How LineWriter::into_inner works', 'Flushes and returns the inner writer.', {
  rows: [['wrote "end"']], call: 'w.into_inner()?', note: 'flush + unwrap', outs: ['b"end"'],
  intro: 'The partial line is flushed first.',
  steps: [['"end" is flushed.', 0], ['The inner Vec comes back.', [], 'o0']],
  result: '"end"', resultCap: 'get_mut gives access without unwrapping.',
}, IO + 'let mut w = std::io::LineWriter::new(Vec::<u8>::new()); w.write_all(b"end").unwrap(); d(String::from_utf8(w.into_inner().unwrap()).unwrap())');

add('linewriter/get_mut', 'get_mut', LW, 'How LineWriter::get_mut works', 'A mutable reference to the writer inside.', {
  rows: [['LineWriter<Vec<u8>>']], call: 'w.get_mut().clear()', note: 'reset the inner writer', outs: ['empty'],
  intro: 'Buffered partial lines are unaffected.',
  steps: [['A full line was written.', 0], ['The inner Vec is cleared.', [], 'o0']],
  result: '0', resultCap: 'Rarely needed.',
}, IO + 'let mut w = std::io::LineWriter::new(Vec::<u8>::new()); w.write_all(b"a\\n").unwrap(); w.get_mut().clear(); w.get_ref().len().to_string()');

// ---------------------------------------------------------------- stdio, pipes, free functions

add('io/read_to_string', 'read_to_string', ['std', '', /io\/mod\.rs$/], 'How io::read_to_string works', 'Reads everything from a reader into a new String.', {
  rows: [['reader "all of it"']], call: 'let text = io::read_to_string(reader)?;', note: 'no buffer variable needed', outs: ['"all of it"'],
  intro: 'A one-liner for any reader, including stdin.',
  steps: [['The reader is read to the end.', 0], ['A new String is returned.', [], 'o0']],
  result: '"all of it"', resultCap: 'io::read_to_string(io::stdin())? reads all input.',
}, `d(std::io::read_to_string(${CUR('"all of it"')}).unwrap())`);

add('io/stdout', 'stdout', STDIO(''), 'How io::stdout works', 'A handle to the standard output stream.', {
  rows: [['terminal']], call: 'io::stdout().write_all(b"hi\\n")?', note: 'what println! uses', outs: ['prints hi'],
  intro: 'Line-buffered: a newline flushes it.',
  steps: [['Get the shared handle.', 0], ['Write to it.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Lock it for many writes in a row.',
}, IO + 'd(std::io::stdout().flush().map_err(|_| ()))');

add('io/stderr', 'stderr', STDIO(''), 'How io::stderr works', 'A handle to the standard error stream.', {
  rows: [['terminal (errors)']], call: 'writeln!(io::stderr(), "error!")?', note: 'what eprintln! uses', outs: ['prints to stderr'],
  intro: 'Unbuffered, so messages appear immediately.',
  steps: [['Get the handle.', 0], ['Messages go to the error stream.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Keeps errors separate from normal output when piping.',
}, IO + 'd(std::io::stderr().flush().map_err(|_| ()))');

add('io/stdin', 'stdin', STDIO(''), 'How io::stdin works', 'A handle to the standard input stream.', {
  rows: [['keyboard / pipe']], call: 'io::stdin().read_line(&mut s)?', note: 'where input comes from', outs: ['a Stdin handle'],
  intro: 'Shared and internally buffered.',
  steps: [['Get the handle.', 0], ['Read lines from it.', [], 'o0']],
  result: 'ok', resultCap: 'The check only takes the handle, without reading.',
}, 'let _s = std::io::stdin(); String::from("ok")');

add('stdout/lock', 'lock', STDIO('Stdout'), 'How Stdout::lock works', 'Locks standard output for a series of fast writes.', {
  rows: [['1000 lines']], call: 'let mut out = io::stdout().lock(); writeln!(out, "...")?;', note: 'lock once, write many', outs: ['faster printing'],
  intro: 'println! locks for every call; locking once is much faster in loops.',
  steps: [['Take the lock.', 0], ['Write many lines without re-locking.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Other threads wait while you hold it.',
}, IO + 'let mut o = std::io::stdout().lock(); d(o.flush().map_err(|_| ()))');

add('stderr/lock', 'lock', STDIO('Stderr'), 'How Stderr::lock works', 'Locks standard error for several writes.', {
  rows: [['multi-line error']], call: 'let mut e = io::stderr().lock();', note: 'keep lines together', outs: ['no interleaving'],
  intro: 'Other threads cannot interleave their messages with yours.',
  steps: [['Take the lock.', 0], ['Write a multi-line report.', [], 'o0']],
  result: 'Ok(())', resultCap: 'Released when the guard drops.',
}, IO + 'let mut e = std::io::stderr().lock(); d(e.flush().map_err(|_| ()))');

add('stdin/lock', 'lock', STDIO('Stdin'), 'How Stdin::lock works', 'Locks standard input, giving a BufRead with all its methods.', {
  rows: [['piped input']], call: 'for line in io::stdin().lock().lines() { ... }', note: 'fast line reading', outs: ['StdinLock: BufRead'],
  intro: 'Avoids locking for every line.',
  steps: [['Take the lock.', 0], ['Use lines(), read_line(), and so on.', [], 'o0']],
  result: 'ok', resultCap: 'The check only takes the lock, without reading.',
}, 'let _l = std::io::stdin().lock(); String::from("ok")');

add('io/pipe', 'pipe', ['std', '', /io\/pipe\.rs$/], 'How io::pipe works', 'An OS pipe: bytes written to one end can be read from the other.', {
  rows: [['writer', 'reader']], call: 'let (mut r, mut w) = io::pipe()?;', note: 'connect processes', outs: ['write "hi", read "hi"'],
  intro: 'Often handed to child processes as stdin or stdout.',
  steps: [['"hi" goes in one end.', 1], ['It comes out of the other.', 0, 'o0']],
  result: '"hi"', resultCap: 'Dropping the writer makes the reader see end-of-file.',
}, IO + 'let (mut r, mut w) = std::io::pipe().unwrap(); w.write_all(b"hi").unwrap(); drop(w); let mut s = String::new(); r.read_to_string(&mut s).unwrap(); d(s)');

// ---------------------------------------------------------------- io::Error

add('io_error/other', 'other', AERR, 'How io::Error::other works', 'An I/O error of kind Other, from any message or error.', {
  rows: [['"disk quota"']], call: 'io::Error::other("disk quota")', note: 'quick custom error', outs: ['kind Other'],
  intro: 'Shorter than Error::new(ErrorKind::Other, ..).',
  steps: [['The message is wrapped.', 0], ['Kind is Other.', [], 'o0']],
  result: 'Other: disk quota', resultCap: 'Wrap other error types the same way.',
}, 'let e = std::io::Error::other("disk quota"); format!("{:?}: {}", e.kind(), e)');

add('io_error/into_inner', 'into_inner', AERR, 'How io::Error::into_inner works', 'The custom error stored inside, if any.', {
  rows: [['Error::other("x")', 'NotFound from the OS']], call: 'e.into_inner()', note: 'Option<Box<dyn Error>>', outs: ['Some("x")', 'None'],
  intro: 'OS errors carry a code, not a custom error.',
  steps: [['A custom error: Some.', 0, 'o0'], ['An OS error: None.', 1, 'o1']],
  result: 'Some("x"), None', resultCap: 'get_ref borrows it instead.',
}, 'let a = std::io::Error::other("x").into_inner().map(|e| e.to_string()); let b = std::io::Error::from_raw_os_error(2).into_inner().is_none(); format!("{:?}, {}", a, if b { "None" } else { "Some" })');

add('io_error/downcast', 'downcast', AERR, 'How io::Error::downcast works', 'Gets a specific custom error type back out of an io::Error.', {
  rows: [['io::Error wrapping ParseIntError']], call: 'e.downcast::<ParseIntError>()', note: 'Ok(T) or Err(original)', outs: ['Ok(ParseIntError)'],
  intro: 'Recover the original error after passing it through I/O code.',
  steps: [['The inner error is a ParseIntError.', 0], ['downcast returns it.', [], 'o0']],
  result: 'Ok(InvalidDigit)', resultCap: 'Err gives the io::Error back untouched.',
}, 'let pe = "x".parse::<i32>().unwrap_err(); let e = std::io::Error::other(pe); format!("Ok({:?})", e.downcast::<std::num::ParseIntError>().unwrap().kind())');

add('io_error/raw_os_error', 'raw_os_error', CERR, 'How io::Error::raw_os_error works', 'The operating system\'s error number, if the error came from the OS.', {
  rows: [['from_raw_os_error(2)', 'Error::other("x")']], call: 'e.raw_os_error()', note: 'errno / GetLastError', outs: ['Some(2)', 'None'],
  intro: 'Custom errors have no OS code.',
  steps: [['OS error: Some(2).', 0, 'o0'], ['Custom: None.', 1, 'o1']],
  result: 'Some(2), None', resultCap: 'Prefer kind() for portable checks.',
}, 'format!("{:?}, {:?}", std::io::Error::from_raw_os_error(2).raw_os_error(), std::io::Error::other("x").raw_os_error())');

add('io_error/get_ref', 'get_ref', CERR, 'How io::Error::get_ref works', 'Borrows the custom error inside, if any.', {
  rows: [['Error::other("bad")']], call: 'e.get_ref().map(|i| i.to_string())', note: 'look without consuming', outs: ['Some("bad")'],
  intro: 'None for errors that came straight from the OS.',
  steps: [['There is a custom error.', 0], ['Its message is "bad".', [], 'o0']],
  result: 'Some("bad")', resultCap: 'into_inner takes it out.',
}, 'let e = std::io::Error::other("bad"); d(e.get_ref().map(|i| i.to_string()))');

add('io_error/get_mut', 'get_mut', CERR, 'How io::Error::get_mut works', 'Mutable access to the custom error inside, if any.', {
  rows: [['Error::other(..)']], call: 'e.get_mut()', note: 'rarely needed', outs: ['Some(&mut inner)'],
  intro: 'Lets you adjust a custom error before passing it on.',
  steps: [['There is a custom error.', 0], ['get_mut lends it.', [], 'o0']],
  result: 'true', resultCap: 'None for OS errors.',
}, 'let mut e = std::io::Error::other("x"); e.get_mut().is_some().to_string()');

add('io_error/from_raw_os_error', 'from_raw_os_error', SERR, 'How io::Error::from_raw_os_error works', 'An io::Error for an operating-system error number.', {
  rows: [['code 2']], call: 'io::Error::from_raw_os_error(2)', note: 'ENOENT / ERROR_FILE_NOT_FOUND', outs: ['kind NotFound'],
  intro: 'Code 2 means "not found" on both Unix and Windows.',
  steps: [['Wrap the number.', 0], ['Its kind is NotFound.', [], 'o0']],
  result: 'NotFound', resultCap: 'Used when calling OS functions directly.',
}, 'd(std::io::Error::from_raw_os_error(2).kind())');

add('io_error/last_os_error', 'last_os_error', SERR, 'How io::Error::last_os_error works', 'The most recent error reported by the operating system on this thread.', {
  rows: [['after a failed OS call']], call: 'io::Error::last_os_error()', note: 'errno / GetLastError', outs: ['an io::Error'],
  intro: 'Only meaningful right after an OS call that failed.',
  steps: [['Read the thread\'s last error.', 0], ['Wrap it as io::Error.', [], 'o0']],
  result: 'has code: true', resultCap: 'Mostly used in FFI code.',
}, 'format!("has code: {}", std::io::Error::last_os_error().raw_os_error().is_some())');

// ---------------------------------------------------------------- Chain, Take, Cursor accessors, IoSlice

add('io_take/limit', 'limit', CUT('Take'), 'How Take::limit works', 'How many bytes this Take adapter may still read.', {
  rows: [['take(5), read 2']], call: 't.limit()', note: 'remaining budget', outs: ['3'],
  intro: 'The limit goes down as you read.',
  steps: [['5 allowed; 2 read.', 0], ['3 left.', [], 'o0']],
  result: '3', resultCap: 'set_limit changes it.',
}, IO + `let mut t = ${CUR('"abcdefgh"')}.take(5); let mut b = [0u8; 2]; t.read_exact(&mut b).unwrap(); t.limit().to_string()`);

add('io_take/set_limit', 'set_limit', CUT('Take'), 'How Take::set_limit works', 'Changes how many more bytes may be read.', {
  rows: [['take(1)']], call: 't.set_limit(3)', note: 'raise or lower the budget', outs: ['reads "abc"'],
  intro: 'Useful for reading length-prefixed records one after another.',
  steps: [['The limit was 1.', 0], ['Now 3 bytes can be read.', [], 'o0']],
  result: '"abc"', resultCap: 'limit() shows the current value.',
}, IO + `let mut t = ${CUR('"abcdef"')}.take(1); t.set_limit(3); let mut s = String::new(); t.read_to_string(&mut s).unwrap(); d(s)`);

add('io_take/into_inner', 'into_inner', CUT('Take'), 'How Take::into_inner works', 'Unwraps the Take adapter and returns the inner reader.', {
  rows: [['take(2) of "abcd"']], call: 'let rest = t.into_inner();', note: 'continue past the limit', outs: ['reads "cd"'],
  intro: 'The inner reader continues where the Take stopped.',
  steps: [['"ab" was read through Take.', 0], ['The inner reader gives "cd".', [], 'o0']],
  result: '"cd"', resultCap: 'get_ref and get_mut borrow it instead.',
}, IO + `let mut t = ${CUR('"abcd"')}.take(2); let mut s = String::new(); t.read_to_string(&mut s).unwrap(); let mut r = t.into_inner(); let mut s2 = String::new(); r.read_to_string(&mut s2).unwrap(); d(s2)`);

add('io_take/get_ref', 'get_ref', CUT('Take'), 'How Take::get_ref works', 'A reference to the reader inside a Take.', {
  rows: [['take(2), read 2']], call: 't.get_ref().position()', note: 'inspect the inner reader', outs: ['2'],
  intro: 'The inner Cursor moved as the Take read.',
  steps: [['Two bytes were read.', 0], ['The inner position is 2.', [], 'o0']],
  result: '2', resultCap: 'get_mut gives mutable access.',
}, IO + `let mut t = ${CUR('"abcd"')}.take(2); let mut s = String::new(); t.read_to_string(&mut s).unwrap(); t.get_ref().position().to_string()`);

add('io_take/get_mut', 'get_mut', CUT('Take'), 'How Take::get_mut works', 'A mutable reference to the reader inside a Take.', {
  rows: [['take(2)']], call: 't.get_mut().set_position(2)', note: 'reposition the source', outs: ['reads "cd"'],
  intro: 'Changes the inner reader directly.',
  steps: [['Move the inner Cursor to 2.', 0], ['The Take now reads "cd".', [], 'o0']],
  result: '"cd"', resultCap: 'The limit is not changed.',
}, IO + `let mut t = ${CUR('"abcd"')}.take(2); t.get_mut().set_position(2); let mut s = String::new(); t.read_to_string(&mut s).unwrap(); d(s)`);

add('io_chain/into_inner', 'into_inner', CUT('Chain'), 'How Chain::into_inner works', 'Splits a chained reader back into its two readers.', {
  rows: [['"ab" chain "cd"']], call: 'let (first, second) = chain.into_inner();', note: 'get both back', outs: ['two readers'],
  intro: 'Their positions reflect what was read.',
  steps: [['The Chain is consumed.', 0], ['Both readers come back.', [], 'o0']],
  result: '0, 0', resultCap: 'get_ref borrows both instead.',
}, IO + `let c = ${CUR('"ab"')}.chain(${CUR('"cd"')}); let (a, b) = c.into_inner(); format!("{}, {}", a.position(), b.position())`);

add('io_chain/get_ref', 'get_ref', CUT('Chain'), 'How Chain::get_ref works', 'References to both readers of a Chain.', {
  rows: [['"ab" chain "cd", read 3']], call: 'let (a, b) = chain.get_ref();', note: 'inspect progress', outs: ['a at 2, b at 1'],
  intro: 'After 3 bytes, the first is exhausted and the second has given one.',
  steps: [['"ab" and "c" were read.', 0], ['Positions 2 and 1.', [], 'o0']],
  result: '2, 1', resultCap: 'get_mut gives mutable references.',
}, IO + `let mut c = ${CUR('"ab"')}.chain(${CUR('"cd"')}); let mut b3 = [0u8; 3]; c.read_exact(&mut b3).unwrap(); let (a, b) = c.get_ref(); format!("{}, {}", a.position(), b.position())`);

add('io_chain/get_mut', 'get_mut', CUT('Chain'), 'How Chain::get_mut works', 'Mutable references to both readers of a Chain.', {
  rows: [['"ab" chain "cd"']], call: 'chain.get_mut().1.set_position(1)', note: 'adjust a source', outs: ['reads "abd"'],
  intro: 'Here the second reader skips its first byte.',
  steps: [['The second Cursor moves to 1.', 0], ['Reading gives "ab" then "d".', [], 'o0']],
  result: '"abd"', resultCap: 'Rarely needed.',
}, IO + `let mut c = ${CUR('"ab"')}.chain(${CUR('"cd"')}); c.get_mut().1.set_position(1); let mut s = String::new(); c.read_to_string(&mut s).unwrap(); d(s)`);

add('cursor/get_ref', 'get_ref', ['core', 'Cursor', /io\/cursor\.rs$/], 'How Cursor::get_ref works', 'A reference to the data inside the Cursor.', {
  rows: [['Cursor over vec![1, 2]']], call: 'c.get_ref()', note: 'see the buffer', outs: ['[1, 2]'],
  intro: 'The position does not change.',
  steps: [['The Cursor wraps a Vec.', 0], ['get_ref lends it.', [], 'o0']],
  result: '[1, 2]', resultCap: 'into_inner takes it out.',
}, 'let c = std::io::Cursor::new(vec![1u8, 2]); d(c.get_ref())');

add('cursor/get_mut', 'get_mut', ['core', 'Cursor', /io\/cursor\.rs$/], 'How Cursor::get_mut works', 'A mutable reference to the data inside the Cursor.', {
  rows: [['Cursor over vec![1]']], call: 'c.get_mut().push(2)', note: 'edit the buffer', outs: ['[1, 2]'],
  intro: 'Useful to append data that will be read later.',
  steps: [['Get &mut Vec.', 0], ['Push 2.', [], 'o0']],
  result: '[1, 2]', resultCap: 'The position is not adjusted.',
}, 'let mut c = std::io::Cursor::new(vec![1u8]); c.get_mut().push(2); d(c.get_ref())');

add('io_slice/new', 'new', ['core', 'IoSlice', /io\/io_slice\.rs$/], 'How IoSlice::new works', 'Wraps a byte slice for vectored (scatter/gather) writes.', {
  rows: [['b"head"', 'b"body"']], call: 'w.write_vectored(&[IoSlice::new(h), IoSlice::new(b)])?', note: 'several buffers, one call', outs: ['"headbody"'],
  intro: 'One system call can write several buffers.',
  steps: [['Two slices are wrapped.', [0, 1]], ['They are written together.', [], 'o0']],
  result: '"headbody"', resultCap: 'write_vectored may write only part; check the count.',
}, IO + 'let mut v: Vec<u8> = Vec::new(); let n = v.write_vectored(&[std::io::IoSlice::new(b"head"), std::io::IoSlice::new(b"body")]).unwrap(); let _ = n; d(String::from_utf8(v).unwrap())');

add('io_slice/advance', 'advance', ['core', 'IoSlice', /io\/io_slice\.rs$/], 'How IoSlice::advance works', 'Moves the start of an IoSlice forward by n bytes.', {
  rows: [['b"hello"']], call: 's.advance(2)', note: 'skip what was written', outs: ['b"llo"'],
  intro: 'After a partial write, skip the bytes already sent.',
  steps: [['The slice is "hello".', 0], ['Advance 2: "llo".', [], 'o0']],
  result: '"llo"', resultCap: 'advance_slices handles a whole list.',
}, 'let mut s = std::io::IoSlice::new(b"hello"); s.advance(2); d(std::str::from_utf8(&s).unwrap())');

add('io_slice/advance_slices', 'advance_slices', ['core', 'IoSlice', /io\/io_slice\.rs$/], 'How IoSlice::advance_slices works', 'Advances a list of IoSlices by n bytes in total.', {
  rows: [['b"ab"', 'b"cde"']], call: 'IoSlice::advance_slices(&mut bufs, 3)', note: 'after a partial vectored write', outs: ['["de"]'],
  intro: 'Fully written slices are dropped from the front; the next is trimmed.',
  steps: [['"ab" is done; one byte of "cde" too.', [0, 1]], ['What remains: "de".', [], 'o0']],
  result: '["de"]', resultCap: 'write_all_vectored-style loops use it.',
}, 'let mut a = [std::io::IoSlice::new(b"ab"), std::io::IoSlice::new(b"cde")]; let mut s: &mut [std::io::IoSlice] = &mut a; std::io::IoSlice::advance_slices(&mut s, 3); d(s.iter().map(|x| std::str::from_utf8(x).unwrap().to_string()).collect::<Vec<_>>())');

module.exports = list;
