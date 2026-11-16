// Rust standard library: input and output. Readers and writers in memory (Cursor, BufReader, Vec<u8>), the Read,
// BufRead and Write traits, io helpers, standard input, and the file system (truth checks use the temp folder).
// rust-analyzer lands on the trait method unless the type overrides it (Cursor::read_to_string, Vec<u8>::write_all).
const { group } = require('./kit.cjs');
const CURSOR_CORE = ['core', 'Cursor', /io\/cursor\.rs$/];
const CURSOR_STD = ['std', 'Cursor', /io\/cursor\.rs$/];
const READ = ['std', 'Read', /io\/mod\.rs$/];
const BUFREAD = ['std', 'BufRead', /io\/mod\.rs$/];
const WRITE = ['std', 'Write', /io\/mod\.rs$/];
const VECW = ['std', 'Vec', /io\/impls\.rs$/];
const FS = ['std', '', /^src\/fs\.rs$/];
const FILE = ['std', 'File', /^src\/fs\.rs$/];
const { list, add } = group({ at: READ });
const IO = 'use std::io::{BufRead, Read, Write}; ';
const TMP = (name) => `let p = std::env::temp_dir().join("ponder_truth_${name}.txt"); `;

// ---------------------------------------------------------------- Cursor and BufReader

add('cursor/new', 'new', CURSOR_CORE, 'How Cursor::new works', 'Wraps bytes in memory so they can be read (or written) like a file.', {
  rows: [['b"hello"']], call: 'let mut c = Cursor::new(b"hello".to_vec());', note: 'a file made of memory', outs: ['position 0'],
  intro: 'A Cursor keeps a position, just like an open file.',
  steps: [['The bytes are wrapped.', 0], ['Reading starts at position 0.', [], 'o0']],
  result: '0', resultCap: 'Great for testing code that reads from files: pass a Cursor instead.',
}, 'let c = std::io::Cursor::new(b"hello".to_vec()); c.position().to_string()');

add('cursor/position', 'position', CURSOR_CORE, 'How Cursor::position works', 'How many bytes have been read (or written) so far.', {
  rows: [['"abcdef"']], call: 'c.read_exact(&mut [0; 4])?; c.position()', note: 'where am I?', outs: ['4'],
  intro: 'Every read moves the position forward.',
  steps: [['4 bytes are read.', 0], ['The position is now 4.', [], 'o0']],
  result: '4', resultCap: 'set_position jumps elsewhere.',
}, IO + 'let mut c = std::io::Cursor::new("abcdef"); let mut b = [0u8; 4]; c.read_exact(&mut b).unwrap(); c.position().to_string()');

add('cursor/set_position', 'set_position', CURSOR_CORE, 'How Cursor::set_position works', 'Moves the read/write position.', {
  rows: [['"abcdef"']], call: 'c.set_position(4); c.read_to_string(&mut s)?;', note: 'skip ahead', outs: ['"ef"'],
  intro: 'Reading continues from the new position.',
  steps: [['Jump to byte 4.', 0], ['The rest is "ef".', [], 'o0']],
  result: '"ef"', resultCap: 'Seek::seek does the same with relative offsets.',
}, IO + 'let mut c = std::io::Cursor::new("abcdef"); c.set_position(4); let mut s = String::new(); c.read_to_string(&mut s).unwrap(); d(s)');

add('cursor/into_inner', 'into_inner', CURSOR_CORE, 'How Cursor::into_inner works', 'Unwraps the Cursor and returns the data inside.', {
  rows: [['Cursor over Vec<u8>']], call: 'c.write_all(b"hi")?; c.into_inner()', note: 'get the written bytes back', outs: ['[104, 105]'],
  intro: 'Write into a Cursor<Vec<u8>>, then take the Vec out.',
  steps: [['"hi" was written into the Vec.', 0], ['into_inner returns it.', [], 'o0']],
  result: '[104, 105]', resultCap: 'get_ref() only borrows the data.',
}, IO + 'let mut c = std::io::Cursor::new(Vec::new()); c.write_all(b"hi").unwrap(); d(c.into_inner())');

add('cursor/read_to_string', 'read_to_string', CURSOR_STD, 'How read_to_string works on a Cursor', 'Reads everything that is left into a String.', {
  rows: [['b"line 1\\nline 2"']], call: 'c.read_to_string(&mut s)?', note: 'returns the byte count', outs: ['Ok(13)', 's = "line 1\\nline 2"'],
  intro: 'The bytes must be valid UTF-8, otherwise you get an error.',
  steps: [['All 13 bytes are read.', 0, 'o0'], ['They are appended to s.', 0, 'o1']],
  result: 'Ok(13), "line 1\\nline 2"', resultCap: 'For files, std::fs::read_to_string(path) does it in one call.',
}, IO + 'let mut c = std::io::Cursor::new(b"line 1\\nline 2".to_vec()); let mut s = String::new(); let n = c.read_to_string(&mut s); format!("{:?}, {:?}", n.map_err(|_| ()), s)');

add('bufreader/new', 'new', ['std', 'BufReader', /bufreader\.rs$/], 'How BufReader::new works', 'Adds a buffer to a reader, so small reads do not hit the source every time.', {
  rows: [['reader']], call: 'let r = BufReader::new(file);', note: 'reads 8 KB at a time', outs: ['r.lines() now works'],
  intro: 'Besides speed, BufReader gives you the BufRead methods: lines, read_line, split.',
  steps: [['The reader is wrapped.', 0], ['Line-by-line reading is now possible.', [], 'o0']],
  result: '["a", "b"]', resultCap: 'Always wrap a File in a BufReader before reading it line by line.',
}, IO + 'let r = std::io::BufReader::new(std::io::Cursor::new("a\\nb")); d(r.lines().map(|l| l.unwrap()).collect::<Vec<_>>())');

add('bufread/lines', 'lines', BUFREAD, 'How BufRead::lines works', 'An iterator over the lines of a reader, without the line endings.', {
  rows: [['"one\\ntwo\\r\\nthree"']], call: 'for line in reader.lines() { let line = line?; ... }', note: 'each item is a Result', outs: ['"one"', '"two"', '"three"'],
  intro: 'Both \\n and \\r\\n are removed.',
  steps: [['"one".', 0, 'o0'], ['"two" (the \\r\\n is gone).', 0, 'o1'], ['"three", the last line without a newline.', 0, 'o2']],
  result: '["one", "two", "three"]', resultCap: 'Reading a file line by line: BufReader::new(File::open(p)?).lines().',
}, IO + 'let r = std::io::Cursor::new("one\\ntwo\\r\\nthree"); d(r.lines().map(|l| l.unwrap()).collect::<Vec<_>>())');

add('bufread/read_line', 'read_line', BUFREAD, 'How BufRead::read_line works', 'Reads one line, including its newline, and appends it to a String.', {
  rows: [['"hi\\nyou\\n"']], call: 'let n = reader.read_line(&mut line)?;', note: 'keeps the \\n', outs: ['n = 3', 'line = "hi\\n"'],
  intro: 'It returns the number of bytes read; 0 means the end was reached.',
  steps: [['3 bytes are read: h, i and \\n.', 0, 'o0'], ['They are appended to line.', 0, 'o1']],
  result: '3, "hi\\n"', resultCap: 'Call line.clear() before reusing the String, and trim() to drop the newline.',
}, IO + 'let mut r = std::io::Cursor::new("hi\\nyou\\n"); let mut line = String::new(); let n = r.read_line(&mut line).unwrap(); format!("{}, {:?}", n, line)');

add('bufread/split', 'split', BUFREAD, 'How BufRead::split works', 'Splits a reader\'s bytes at a delimiter byte.', {
  rows: [['b"a,b,c"']], call: 'reader.split(b\',\')', note: 'Vec<u8> pieces', outs: ['b"a"', 'b"b"', 'b"c"'],
  intro: 'Like lines, but with any delimiter, and the pieces are bytes.',
  steps: [['"a" up to the first comma.', 0, 'o0'], ['Then "b" and "c".', 0, 'o1,2']],
  result: '[[97], [98], [99]]', resultCap: 'The delimiter is not included in the pieces.',
}, IO + 'let r = std::io::Cursor::new("a,b,c"); d(r.split(b\',\').map(|p| p.unwrap()).collect::<Vec<_>>())');

add('bufread/read_until', 'read_until', BUFREAD, 'How BufRead::read_until works', 'Reads bytes up to and including a delimiter.', {
  rows: [['b"key=value"']], call: 'reader.read_until(b\'=\', &mut buf)?', note: 'bytes, delimiter kept', outs: ['4 bytes', 'buf = b"key="'],
  intro: 'read_line is read_until(b\'\\n\') for text.',
  steps: [['k, e, y and = are read.', 0, 'o0'], ['buf holds "key=".', 0, 'o1']],
  result: '4, "key="', resultCap: 'Returns 0 at the end of the input.',
}, IO + 'let mut r = std::io::Cursor::new("key=value"); let mut buf = Vec::new(); let n = r.read_until(b\'=\', &mut buf).unwrap(); format!("{}, {:?}", n, String::from_utf8(buf).unwrap())');

// ---------------------------------------------------------------- Read trait

add('read/bytes', 'bytes', null, 'How Read::bytes works', 'An iterator over the bytes of a reader, one at a time.', {
  rows: [['"ab"']], call: 'reader.bytes()', note: 'each item is io::Result<u8>', outs: ['Ok(97)', 'Ok(98)'],
  intro: 'Simple, but slow on unbuffered readers: wrap files in a BufReader first.',
  steps: [['a is 97.', 0, 'o0'], ['b is 98.', 0, 'o1']],
  result: '[97, 98]', resultCap: 'Each byte can fail (e.g. a disk error), hence the Result.',
}, IO + 'let r = std::io::Cursor::new("ab"); d(r.bytes().map(|b| b.unwrap()).collect::<Vec<_>>())');

add('read/take', 'take', null, 'How Read::take works', 'A reader that stops after n bytes.', {
  rows: [['"abcdef"']], call: 'reader.take(3).read_to_string(&mut s)?', note: 'limit what you read', outs: ['"abc"'],
  intro: 'Protects against reading too much, e.g. from the network.',
  steps: [['Only 3 bytes are allowed.', 0], ['"abc".', [], 'o0']],
  result: '"abc"', resultCap: 'The rest stays unread in the inner reader.',
}, IO + 'let r = std::io::Cursor::new("abcdef"); let mut s = String::new(); r.take(3).read_to_string(&mut s).unwrap(); d(s)');

add('read/chain', 'chain', null, 'How Read::chain works', 'Reads one reader to the end, then continues with another.', {
  rows: [['"head,"', '"tail"']], call: 'a.chain(b).read_to_string(&mut s)?', note: 'join two sources', outs: ['"head,tail"'],
  intro: 'The two readers behave as one.',
  steps: [['First "head,".', 0], ['Then "tail".', 1, 'o0']],
  result: '"head,tail"', resultCap: 'Useful to put a header in front of a body.',
}, IO + 'let a = std::io::Cursor::new("head,"); let b = std::io::Cursor::new("tail"); let mut s = String::new(); a.chain(b).read_to_string(&mut s).unwrap(); d(s)');

add('read/read_exact', 'read_exact', null, 'How Read::read_exact works', 'Fills a buffer completely, or fails.', {
  rows: [['4 bytes wanted, 6 available', '4 wanted, 2 available']], call: 'reader.read_exact(&mut buf)', note: 'all or error', outs: ['Ok(())', 'Err(UnexpectedEof)'],
  intro: 'read() may return fewer bytes; read_exact keeps reading until the buffer is full.',
  steps: [['Enough data: the buffer is filled.', 0, 'o0'], ['Too little: UnexpectedEof.', 1, 'o1']],
  result: 'Ok(()), Err(UnexpectedEof)', resultCap: 'The tool for fixed-size binary headers.',
}, IO + 'let mut a = std::io::Cursor::new("abcdef"); let mut b = std::io::Cursor::new("ab"); let mut buf = [0u8; 4]; let x = a.read_exact(&mut buf).map_err(|e| e.kind()); let y = b.read_exact(&mut buf).map_err(|e| e.kind()); format!("{:?}, {:?}", x, y)');

add('read/read_to_end', 'read_to_end', null, 'How Read::read_to_end works', 'Reads every remaining byte into a Vec<u8>.', {
  rows: [['b"\\x01\\x02\\x03"']], call: 'reader.read_to_end(&mut v)?', note: 'binary data', outs: ['3 bytes', '[1, 2, 3]'],
  intro: 'Like read_to_string, but for any bytes.',
  steps: [['All bytes are read.', 0, 'o0'], ['They are appended to v.', 0, 'o1']],
  result: '3, [1, 2, 3]', resultCap: 'std::fs::read(path) does this for a whole file.',
}, IO + 'let mut r = std::io::Cursor::new(vec![1u8, 2, 3]); let mut v = Vec::new(); let n = r.read_to_end(&mut v).unwrap(); format!("{}, {:?}", n, v)');

// ---------------------------------------------------------------- Write

add('write/write_all', 'write_all', WRITE, 'How Write::write_all works', 'Writes the whole buffer, retrying until every byte is out.', {
  rows: [['b"hello"']], call: 'writer.write_all(b"hello")?', note: 'never a partial write', outs: ['5 bytes written'],
  intro: 'write() may write only part; write_all loops until everything is written.',
  steps: [['The bytes are handed to the writer.', 0], ['All 5 arrive.', [], 'o0']],
  result: '"hello"', resultCap: 'Use write! / writeln! for formatted text.',
}, IO + 'let mut c = std::io::Cursor::new(Vec::new()); c.write_all(b"hello").unwrap(); d(String::from_utf8(c.into_inner()).unwrap())');

add('write/flush', 'flush', WRITE, 'How Write::flush works', 'Pushes buffered data out to its destination now.', {
  kind: 'lines', call: 'print!("Name: "); io::stdout().flush()?;', note: 'make output appear',
  lines: ['print! puts "Name: " in a buffer', 'nothing is visible yet (no newline)', 'flush() sends it to the terminal'],
  intro: 'Standard output is line-buffered: text without a newline waits.',
  steps: [{ cap: 'print! writes into the buffer.', show: [0] }, { cap: 'Without a newline it stays there.', show: [1] }, { cap: 'flush makes it appear before reading input.', show: [2] }],
  result: 'flushed: true', resultCap: 'BufWriter also needs flush (or drop) before its data is written.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::new()); w.write_all(b"x").unwrap(); let before = w.get_ref().len(); w.flush().unwrap(); format!("flushed: {}", before == 0 && w.get_ref().len() == 1)');

add('vec_write/write_all', 'write_all', VECW, 'How write_all works on a Vec<u8>', 'Appends bytes to the end of the Vec.', {
  rows: [['v = b"ab"'], ['b"cd"']], call: 'v.write_all(b"cd")?', note: 'a Vec is a writer', outs: ['b"abcd"'],
  intro: 'Writing to a Vec<u8> never fails; it just grows.',
  steps: [['v holds "ab".', 'a0'], ['"cd" is appended.', 'b0', 'o0']],
  result: '"abcd"', resultCap: 'Handy for building binary data or capturing output in tests.',
}, IO + 'let mut v = b"ab".to_vec(); v.write_all(b"cd").unwrap(); d(String::from_utf8(v).unwrap())');

add('vec_write/flush', 'flush', VECW, 'How flush works on a Vec<u8>', 'Does nothing: a Vec has no buffer to empty.', {
  rows: [['Vec<u8>']], call: 'v.flush()?', note: 'always Ok', outs: ['Ok(())'],
  intro: 'Generic code calls flush on every writer; for a Vec it is a no-op.',
  steps: [['The bytes are already in the Vec.', 0], ['flush returns Ok(()).', [], 'o0']],
  result: 'Ok(())', resultCap: 'Files and stdout are where flush matters.',
}, IO + 'let mut v: Vec<u8> = Vec::new(); d(v.flush().map_err(|_| ()))');

add('bufwriter/new', 'new', ['std', 'BufWriter', /bufwriter\.rs$/], 'How BufWriter::new works', 'Collects small writes in memory and sends them out in big blocks.', {
  rows: [['1000 tiny writes']], call: 'let mut w = BufWriter::new(file);', note: 'fewer system calls', outs: ['a few large writes'],
  intro: 'Writing a file byte by byte is slow; BufWriter batches the work.',
  steps: [['Small writes go into an 8 KB buffer.', 0], ['The buffer is written when full, on flush, or on drop.', [], 'o0']],
  result: '1000', resultCap: 'Call flush() at the end to see write errors; drop ignores them.',
}, IO + 'let mut w = std::io::BufWriter::new(Vec::new()); for _ in 0..1000 { w.write_all(b"x").unwrap(); } w.into_inner().unwrap().len().to_string()');

// ---------------------------------------------------------------- io helpers

add('io/copy', 'copy', ['std', '', /io\/copy\.rs$/], 'How io::copy works', 'Copies everything from a reader into a writer.', {
  rows: [['reader "data"', 'writer (empty)']], call: 'let n = io::copy(&mut reader, &mut writer)?;', note: 'returns the byte count', outs: ['n = 4', 'writer "data"'],
  intro: 'It reads chunks and writes them until the reader is empty.',
  steps: [['4 bytes flow across.', [0, 1], 'o0'], ['The writer holds "data".', 1, 'o1']],
  result: '4, "data"', resultCap: 'Copy a download to a file, or a file to stdout.',
}, IO + 'let mut r = std::io::Cursor::new("data"); let mut w: Vec<u8> = Vec::new(); let n = std::io::copy(&mut r, &mut w).unwrap(); format!("{}, {:?}", n, String::from_utf8(w).unwrap())');

add('io/empty', 'empty', ['core', '', /io\/util\.rs$/], 'How io::empty works', 'A reader that is always at its end.', {
  rows: [['io::empty()']], call: 'io::empty().read_to_string(&mut s)?', note: 'reads nothing', outs: ['0 bytes'],
  intro: 'A placeholder when an API needs a reader but you have no data.',
  steps: [['There is nothing to read.', 0], ['0 bytes.', [], 'o0']],
  result: '0', resultCap: 'It is also a writer that accepts and discards everything.',
}, IO + 'let mut s = String::new(); std::io::empty().read_to_string(&mut s).unwrap().to_string()');

add('io/repeat', 'repeat', ['core', '', /io\/util\.rs$/], 'How io::repeat works', 'A reader that yields the same byte forever.', {
  rows: [["b'z'"]], call: "io::repeat(b'z').take(3)", note: 'endless, so limit it', outs: ['"zzz"'],
  intro: 'Combine with take(n) to get exactly n bytes.',
  steps: [['z, z, z...', 0], ['take(3) stops after three.', [], 'o0']],
  result: '"zzz"', resultCap: 'Handy for filling files or testing.',
}, IO + 'let mut s = String::new(); std::io::repeat(b\'z\').take(3).read_to_string(&mut s).unwrap(); d(s)');

add('io/sink', 'sink', ['core', '', /io\/util\.rs$/], 'How io::sink works', 'A writer that throws everything away.', {
  rows: [['b"ignored"']], call: 'io::copy(&mut reader, &mut io::sink())?', note: 'like /dev/null', outs: ['7 bytes discarded'],
  intro: 'Writes always succeed and nothing is kept.',
  steps: [['The bytes are "written".', 0], ['They vanish; the count is still reported.', [], 'o0']],
  result: '7', resultCap: 'Useful to count bytes or drain a reader.',
}, IO + 'let mut r = std::io::Cursor::new("ignored"); std::io::copy(&mut r, &mut std::io::sink()).unwrap().to_string()');

add('io_error/new', 'new', ['alloc', 'Error', /io\/error\.rs$/], 'How io::Error::new works', 'Creates an I/O error with a kind and a message.', {
  rows: [['InvalidData', '"bad header"']], call: 'io::Error::new(ErrorKind::InvalidData, "bad header")', note: 'your own I/O errors', outs: ['kind InvalidData', 'msg "bad header"'],
  intro: 'Return it from functions that read or write, so callers handle all I/O errors alike.',
  steps: [['The kind classifies the error.', 0, 'o0'], ['The message explains it.', 1, 'o1']],
  result: 'InvalidData: bad header', resultCap: 'io::Error::other("msg") is a shortcut for ErrorKind::Other.',
}, 'let e = std::io::Error::new(std::io::ErrorKind::InvalidData, "bad header"); format!("{:?}: {}", e.kind(), e)');

add('io_error/kind', 'kind', ['core', 'Error', /io\/error\.rs$/], 'How io::Error::kind works', 'The category of an I/O error, to react to specific cases.', {
  rows: [['open a missing file']], call: 'match e.kind() { ErrorKind::NotFound => ..., _ => ... }', note: 'NotFound, PermissionDenied, ...', outs: ['NotFound'],
  intro: 'Match on the kind instead of on the error message.',
  steps: [['The file does not exist.', 0], ['kind() is NotFound.', [], 'o0']],
  result: 'NotFound', resultCap: 'Create the file when kind() == NotFound, report anything else.',
}, 'let e = std::fs::File::open(std::env::temp_dir().join("ponder_truth_surely_missing.txt")).unwrap_err(); d(e.kind())');

// ---------------------------------------------------------------- standard input

add('stdin/read_line', 'read_line', ['std', 'Stdin', /io\/stdio\.rs$/], 'How Stdin::read_line works', 'Reads one line typed by the user, including the newline.', {
  rows: [['user types "42⏎"']], call: 'io::stdin().read_line(&mut input)?;', note: 'keyboard input', outs: ['input = "42\\n"', 'trim().parse() → 42'],
  intro: 'The program waits until the user presses Enter.',
  steps: [['"42\\n" is appended to input.', 0, 'o0'], ['trim() drops the newline so parse works.', 0, 'o1']],
  result: '"42\\n", 42', resultCap: 'Forgetting trim() is the classic reason parse fails on input. (The check simulates the typing.)',
}, IO + 'let mut fake = std::io::Cursor::new("42\\n"); let mut input = String::new(); fake.read_line(&mut input).unwrap(); let n: i32 = input.trim().parse().unwrap(); format!("{:?}, {}", input, n)');

add('stdin/lines', 'lines', ['std', 'Stdin', /io\/stdio\.rs$/], 'How Stdin::lines works', 'An iterator over the lines typed by the user (or piped in).', {
  rows: [['"3\\n4\\n" piped in']], call: 'for line in io::stdin().lines() { total += line?.parse::<i32>()?; }', note: 'read until the end', outs: ['3', '4', 'total 7'],
  intro: 'Ends when the input ends (Ctrl+D / Ctrl+Z, or the end of a piped file).',
  steps: [['"3" and "4" arrive without newlines.', 0, 'o0,1'], ['They add up to 7.', 0, 'o2']],
  result: '7', resultCap: 'echo "3\\n4" | cargo run feeds it from the shell. (The check simulates the input.)',
}, IO + 'let fake = std::io::Cursor::new("3\\n4\\n"); let total: i32 = fake.lines().map(|l| l.unwrap().parse::<i32>().unwrap()).sum(); total.to_string()');

// ---------------------------------------------------------------- file system

add('fs/write', 'write', FS, 'How fs::write works', 'Creates (or overwrites) a file with the given contents, in one call.', {
  rows: [['"notes.txt"', '"hello"']], call: 'fs::write("notes.txt", "hello")?;', note: 'replaces the old contents', outs: ['file holds "hello"'],
  intro: 'Opens, writes everything, and closes the file.',
  steps: [['The file is created or truncated.', 0], ['"hello" is written.', 1, 'o0']],
  result: '"hello"', resultCap: 'Use OpenOptions with append(true) to add to a file instead.',
}, TMP('write') + 'std::fs::write(&p, "hello").unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('fs/read_to_string', 'read_to_string', FS, 'How fs::read_to_string works', 'Reads a whole text file into a String.', {
  rows: [['file "a\\nb"']], call: 'let text = fs::read_to_string("notes.txt")?;', note: 'one call', outs: ['"a\\nb"'],
  intro: 'Fails if the file is missing or not valid UTF-8.',
  steps: [['The file is opened and read.', 0], ['Its text comes back.', [], 'o0']],
  result: '"a\\nb"', resultCap: 'For huge files, read line by line with BufReader instead.',
}, TMP('rts') + 'std::fs::write(&p, "a\\nb").unwrap(); let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('fs/read', 'read', FS, 'How fs::read works', 'Reads a whole file into a Vec<u8>.', {
  rows: [['file with bytes 1, 2, 3']], call: 'let bytes = fs::read("image.png")?;', note: 'binary files', outs: ['[1, 2, 3]'],
  intro: 'No UTF-8 check: any bytes work.',
  steps: [['The file is read.', 0], ['You get its bytes.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'read_to_string is the text version.',
}, TMP('read') + 'std::fs::write(&p, [1u8, 2, 3]).unwrap(); let b = std::fs::read(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(b)');

add('fs/remove_file', 'remove_file', FS, 'How fs::remove_file works', 'Deletes a file.', {
  rows: [['existing file', 'missing file']], call: 'fs::remove_file(path)', note: 'no recycle bin', outs: ['Ok(())', 'Err(NotFound)'],
  intro: 'The file is gone for good.',
  steps: [['The file existed: deleted.', 0, 'o0'], ['Deleting again: NotFound.', 1, 'o1']],
  result: 'Ok(()), Err(NotFound)', resultCap: 'remove_dir_all deletes a whole folder tree; use it carefully.',
}, TMP('rm') + 'std::fs::write(&p, "x").unwrap(); let a = std::fs::remove_file(&p).map_err(|e| e.kind()); let b = std::fs::remove_file(&p).map_err(|e| e.kind()); format!("{:?}, {:?}", a, b)');

add('fs/create_dir_all', 'create_dir_all', FS, 'How fs::create_dir_all works', 'Creates a folder and any missing parent folders.', {
  rows: [['"out/2024/logs"']], call: 'fs::create_dir_all("out/2024/logs")?;', note: 'like mkdir -p', outs: ['all three folders exist'],
  intro: 'No error if the folders already exist.',
  steps: [['out, out/2024 and out/2024/logs are created as needed.', 0], ['The full path now exists.', [], 'o0']],
  result: 'true', resultCap: 'create_dir fails if the parent is missing.',
}, 'let base = std::env::temp_dir().join("ponder_truth_dirs"); let p = base.join("2024").join("logs"); std::fs::create_dir_all(&p).unwrap(); std::fs::create_dir_all(&p).unwrap(); let ok = p.is_dir(); std::fs::remove_dir_all(&base).unwrap(); ok.to_string()');

add('fs/exists', 'exists', FS, 'How fs::exists works', 'Whether a path exists, as a Result.', {
  rows: [['existing file', 'missing file']], call: 'fs::exists(path)?', note: 'errors are reported, not hidden', outs: ['Ok(true)', 'Ok(false)'],
  intro: 'Path::exists returns false on errors too; fs::exists tells you about them.',
  steps: [['The file is there: true.', 0, 'o0'], ['Not there: false.', 1, 'o1']],
  result: 'Ok(true), Ok(false)', resultCap: 'Checking first and then opening can race; often just open and handle NotFound.',
}, TMP('exists') + 'std::fs::write(&p, "").unwrap(); let a = std::fs::exists(&p).map_err(|_| ()); std::fs::remove_file(&p).unwrap(); let b = std::fs::exists(&p).map_err(|_| ()); format!("{:?}, {:?}", a, b)');

add('fs/metadata', 'metadata', FS, 'How fs::metadata works', 'Information about a file: size, type, times.', {
  rows: [['file with 5 bytes']], call: 'fs::metadata(path)?.len()', note: 'size in bytes', outs: ['5', 'is_file: true'],
  intro: 'metadata follows symlinks to the real file.',
  steps: [['The size is 5 bytes.', 0, 'o0'], ['It is a regular file.', 0, 'o1']],
  result: '5, true', resultCap: 'modified() gives the last change time.',
}, TMP('meta') + 'std::fs::write(&p, "12345").unwrap(); let m = std::fs::metadata(&p).unwrap(); let r = format!("{}, {}", m.len(), m.is_file()); std::fs::remove_file(&p).unwrap(); r');

add('fs/copy', 'copy', FS, 'How fs::copy works', 'Copies a file\'s contents to another path.', {
  rows: [['a.txt "hi"', 'b.txt']], call: 'fs::copy("a.txt", "b.txt")?', note: 'returns the byte count', outs: ['2', 'b.txt "hi"'],
  intro: 'The target is overwritten if it exists.',
  steps: [['2 bytes are copied.', [0, 1], 'o0'], ['b.txt now holds "hi".', 1, 'o1']],
  result: '2, "hi"', resultCap: 'Permissions are copied too.',
}, 'let a = std::env::temp_dir().join("ponder_truth_cpa.txt"); let b = std::env::temp_dir().join("ponder_truth_cpb.txt"); std::fs::write(&a, "hi").unwrap(); let n = std::fs::copy(&a, &b).unwrap(); let s = std::fs::read_to_string(&b).unwrap(); std::fs::remove_file(&a).unwrap(); std::fs::remove_file(&b).unwrap(); format!("{}, {:?}", n, s)');

add('fs/rename', 'rename', FS, 'How fs::rename works', 'Renames or moves a file.', {
  rows: [['old.txt', 'new.txt']], call: 'fs::rename("old.txt", "new.txt")?', note: 'move within one drive', outs: ['old gone', 'new exists'],
  intro: 'The file is moved, not copied.',
  steps: [['old.txt disappears.', 0, 'o0'], ['new.txt holds its contents.', 1, 'o1']],
  result: 'false, true', resultCap: 'Moving between drives may fail: copy then remove instead.',
}, 'let a = std::env::temp_dir().join("ponder_truth_old.txt"); let b = std::env::temp_dir().join("ponder_truth_new.txt"); std::fs::write(&a, "x").unwrap(); std::fs::rename(&a, &b).unwrap(); let r = format!("{}, {}", a.exists(), b.exists()); std::fs::remove_file(&b).unwrap(); r');

add('fs/read_dir', 'read_dir', FS, 'How fs::read_dir works', 'Lists the entries of a folder.', {
  rows: [['folder with a.txt, b.txt']], call: 'for entry in fs::read_dir(dir)? { let entry = entry?; ... }', note: 'order is not guaranteed', outs: ['a.txt', 'b.txt'],
  intro: 'Each entry has a path(), file_name() and metadata().',
  steps: [['Both files are listed.', 0, 'o0,1'], ['Sort the names if you need a fixed order.', 0]],
  result: '["a.txt", "b.txt"]', resultCap: 'Subfolders are not entered; recurse yourself or use a crate like walkdir.',
}, 'let dir = std::env::temp_dir().join("ponder_truth_ls"); std::fs::create_dir_all(&dir).unwrap(); std::fs::write(dir.join("a.txt"), "").unwrap(); std::fs::write(dir.join("b.txt"), "").unwrap(); let mut v: Vec<String> = std::fs::read_dir(&dir).unwrap().map(|e| e.unwrap().file_name().to_string_lossy().into_owned()).collect(); v.sort(); std::fs::remove_dir_all(&dir).unwrap(); d(v)');

add('file/create', 'create', FILE, 'How File::create works', 'Opens a file for writing, creating it or emptying it first.', {
  rows: [['"log.txt"']], call: 'let mut f = File::create("log.txt")?; f.write_all(b"start")?;', note: 'truncates!', outs: ['file holds "start"'],
  intro: 'An existing file is emptied; use OpenOptions to append instead.',
  steps: [['The file is created (or emptied).', 0], ['"start" is written.', [], 'o0']],
  result: '"start"', resultCap: 'File::create_new fails if the file already exists.',
}, IO + TMP('create') + '{ let mut f = std::fs::File::create(&p).unwrap(); f.write_all(b"start").unwrap(); } let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

add('file/open', 'open', FILE, 'How File::open works', 'Opens an existing file for reading.', {
  rows: [['existing file', 'missing file']], call: 'let f = File::open("data.txt")?;', note: 'read-only', outs: ['Ok(File)', 'Err(NotFound)'],
  intro: 'It fails if the file does not exist.',
  steps: [['The file exists: you get a File.', 0, 'o0'], ['Missing: NotFound.', 1, 'o1']],
  result: '"data", NotFound', resultCap: 'Wrap it in BufReader::new to read lines.',
}, IO + TMP('open') + 'std::fs::write(&p, "data").unwrap(); let mut s = String::new(); std::fs::File::open(&p).unwrap().read_to_string(&mut s).unwrap(); std::fs::remove_file(&p).unwrap(); let e = std::fs::File::open(&p).unwrap_err().kind(); format!("{:?}, {:?}", s, e)');

add('openoptions/append', 'append', ['std', 'OpenOptions', /^src\/fs\.rs$/], 'How OpenOptions::append works', 'Opens a file so that every write goes to the end.', {
  rows: [['file "a"'], ['write "b"']], call: 'OpenOptions::new().append(true).open(path)?', note: 'add to a log', outs: ['file "ab"'],
  intro: 'Existing contents are kept; new data is added after them.',
  steps: [['The file holds "a".', 'a0'], ['"b" is appended.', 'b0', 'o0']],
  result: '"ab"', resultCap: 'Add .create(true) to create the file if it is missing.',
}, IO + TMP('append') + 'std::fs::write(&p, "a").unwrap(); { let mut f = std::fs::OpenOptions::new().append(true).open(&p).unwrap(); f.write_all(b"b").unwrap(); } let s = std::fs::read_to_string(&p).unwrap(); std::fs::remove_file(&p).unwrap(); d(s)');

module.exports = list;
