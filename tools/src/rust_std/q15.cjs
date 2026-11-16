// Rust standard library: OsStr and OsString, the platform's own string types (file names, arguments, env vars).
const { group } = require('./kit.cjs');
const OSSTR = ['std', 'OsStr', /ffi\/os_str\.rs$/];
const OSSTRING = ['std', 'OsString', /ffi\/os_str\.rs$/];
const { list, add } = group({ at: OSSTR });
const O = 'std::ffi::OsStr';
const S = 'std::ffi::OsString';

// ---------------------------------------------------------------- OsStr

add('osstr/new', 'new', null, 'How OsStr::new works', 'Views a &str as an &OsStr, without copying.', {
  rows: [['"file.txt"']], call: 'OsStr::new("file.txt")', note: 'str → OsStr', outs: ['&OsStr "file.txt"'],
  intro: 'Every valid str is also a valid OsStr.',
  steps: [['Same bytes.', 0], ['Seen as an OsStr.', [], 'o0']],
  result: '"file.txt"', resultCap: 'The other direction (to_str) can fail.',
}, `d(${O}::new("file.txt"))`);

add('osstr/to_str', 'to_str', null, 'How OsStr::to_str works', 'The OsStr as &str, if it is valid Unicode.', {
  rows: [['OsStr "name"']], call: 'os.to_str()', note: 'Option<&str>', outs: ['Some("name")'],
  intro: 'File names on Unix can contain bytes that are not UTF-8.',
  steps: [['The text is valid.', 0], ['Some("name").', [], 'o0']],
  result: 'Some("name")', resultCap: 'to_string_lossy never fails.',
}, `d(${O}::new("name").to_str())`);

add('osstr/to_string_lossy', 'to_string_lossy', null, 'How OsStr::to_string_lossy works', 'The OsStr as text, with invalid parts replaced by �.', {
  rows: [['OsStr "ok"']], call: 'os.to_string_lossy()', note: 'Cow<str>', outs: ['"ok"'],
  intro: 'Borrowed when no replacement was needed.',
  steps: [['Valid text.', 0], ['Returned as is.', [], 'o0']],
  result: '"ok"', resultCap: 'The usual way to print an OsStr.',
}, `d(${O}::new("ok").to_string_lossy())`);

add('osstr/to_os_string', 'to_os_string', null, 'How OsStr::to_os_string works', 'An owned OsString copy of a borrowed OsStr.', {
  rows: [['&OsStr "a"']], call: 'os.to_os_string()', note: 'borrowed → owned', outs: ['OsString "a"'],
  intro: 'Like to_string for OsStr.',
  steps: [['The bytes are copied.', 0], ['You own the OsString.', [], 'o0']],
  result: '"a"', resultCap: 'Needed to store it in a struct.',
}, `d(${O}::new("a").to_os_string())`);

add('osstr/len', 'len', null, 'How OsStr::len works', 'The length in the platform encoding\'s bytes.', {
  rows: [['"héllo"']], call: 'os.len()', note: 'not chars', outs: ['6'],
  intro: 'é takes two bytes in UTF-8 based encodings.',
  steps: [['Five characters.', 0], ['Six bytes.', [], 'o0']],
  result: '6', resultCap: 'Useful mostly for capacity calculations.',
}, `${O}::new("héllo").len().to_string()`);

add('osstr/is_empty', 'is_empty', null, 'How OsStr::is_empty works', 'true for an empty OsStr.', {
  rows: [['""', '"x"']], call: 'os.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'A quick check.',
  steps: [['"": true.', 0, 'o0'], ['"x": false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Same as for str.',
}, `format!("{}, {}", ${O}::new("").is_empty(), ${O}::new("x").is_empty())`);

add('osstr/is_ascii', 'is_ascii', null, 'How OsStr::is_ascii works', 'true if every byte is ASCII.', {
  rows: [['"plain"', '"ñ"']], call: 'os.is_ascii()', note: 'only bytes 0–127', outs: ['true', 'false'],
  intro: 'Handy before ASCII-only processing.',
  steps: [['"plain": true.', 0, 'o0'], ['"ñ": false.', 1, 'o1']],
  result: 'true, false', resultCap: 'str::is_ascii is the str version.',
}, `format!("{}, {}", ${O}::new("plain").is_ascii(), ${O}::new("ñ").is_ascii())`);

add('osstr/eq_ignore_ascii_case', 'eq_ignore_ascii_case', null, 'How OsStr::eq_ignore_ascii_case works', 'Compares two OsStrs ignoring ASCII case.', {
  rows: [['"README.md" vs "readme.MD"']], call: 'a.eq_ignore_ascii_case(b)', note: 'case-blind file names', outs: ['true'],
  intro: 'Useful on case-insensitive file systems.',
  steps: [['Letters are compared without case.', 0], ['Equal: true.', [], 'o0']],
  result: 'true', resultCap: 'Only ASCII letters are folded.',
}, `${O}::new("README.md").eq_ignore_ascii_case("readme.MD").to_string()`);

add('osstr/to_ascii_lowercase', 'to_ascii_lowercase', null, 'How OsStr::to_ascii_lowercase works', 'A copy with ASCII letters made small.', {
  rows: [['"Photo.JPG"']], call: 'os.to_ascii_lowercase()', note: 'returns an OsString', outs: ['"photo.jpg"'],
  intro: 'Normalise extensions before comparing.',
  steps: [['Capitals become small.', 0], ['"photo.jpg".', [], 'o0']],
  result: '"photo.jpg"', resultCap: 'make_ascii_lowercase changes it in place.',
}, `d(${O}::new("Photo.JPG").to_ascii_lowercase())`);

add('osstr/to_ascii_uppercase', 'to_ascii_uppercase', null, 'How OsStr::to_ascii_uppercase works', 'A copy with ASCII letters made capital.', {
  rows: [['"Makefile"']], call: 'os.to_ascii_uppercase()', note: 'returns an OsString', outs: ['"MAKEFILE"'],
  intro: 'Only a–z change.',
  steps: [['Small letters become capitals.', 0], ['"MAKEFILE".', [], 'o0']],
  result: '"MAKEFILE"', resultCap: 'make_ascii_uppercase works in place.',
}, `d(${O}::new("Makefile").to_ascii_uppercase())`);

add('osstr/make_ascii_lowercase', 'make_ascii_lowercase', null, 'How OsStr::make_ascii_lowercase works', 'Lower-cases ASCII letters in place.', {
  rows: [['OsString "ABC"']], call: 's.make_ascii_lowercase()', note: 'no new allocation', outs: ['"abc"'],
  intro: 'Works through &mut OsStr (e.g. on an OsString).',
  steps: [['The bytes are changed where they are.', 0], ['"abc".', [], 'o0']],
  result: '"abc"', resultCap: 'to_ascii_lowercase returns a copy instead.',
}, `let mut s = ${S}::from("ABC"); s.make_ascii_lowercase(); d(s)`);

add('osstr/make_ascii_uppercase', 'make_ascii_uppercase', null, 'How OsStr::make_ascii_uppercase works', 'Upper-cases ASCII letters in place.', {
  rows: [['OsString "abc"']], call: 's.make_ascii_uppercase()', note: 'in place', outs: ['"ABC"'],
  intro: 'No new allocation.',
  steps: [['Each a–z becomes A–Z.', 0], ['"ABC".', [], 'o0']],
  result: '"ABC"', resultCap: 'Length never changes.',
}, `let mut s = ${S}::from("abc"); s.make_ascii_uppercase(); d(s)`);

add('osstr/as_encoded_bytes', 'as_encoded_bytes', null, 'How OsStr::as_encoded_bytes works', 'The raw bytes of the OsStr in Rust\'s internal encoding.', {
  rows: [['"ab"']], call: 'os.as_encoded_bytes()', note: 'ASCII is stored as-is', outs: ['[97, 98]'],
  intro: 'ASCII and UTF-8 text come out as their normal bytes on every platform.',
  steps: [['The OsStr "ab".', 0], ['Bytes 97, 98.', [], 'o0']],
  result: '[97, 98]', resultCap: 'Useful for splitting at ASCII characters like "=".',
}, `d(${O}::new("ab").as_encoded_bytes())`);

add('osstr/into_os_string', 'into_os_string', null, 'How OsStr::into_os_string works', 'Turns a Box<OsStr> into an OsString without copying.', {
  rows: [['Box<OsStr> "x"']], call: 'boxed.into_os_string()', note: 'growable again', outs: ['OsString "x"'],
  intro: 'Box<OsStr> cannot grow.',
  steps: [['The box is handed over.', 0], ['An OsString.', [], 'o0']],
  result: '"x"', resultCap: 'into_boxed_os_str goes back.',
}, `let b: Box<${O}> = ${S}::from("x").into_boxed_os_str(); d(b.into_os_string())`);

// ---------------------------------------------------------------- OsString

add('osstring/new', 'new', OSSTRING, 'How OsString::new works', 'An empty, growable platform string.', {
  rows: [['OsString::new()']], call: 'let mut s = OsString::new(); s.push("a");', note: 'empty start', outs: ['"a"'],
  intro: 'Build file names or arguments piece by piece.',
  steps: [['Empty.', 0], ['After push: "a".', [], 'o0']],
  result: '"a"', resultCap: 'OsString::from("...") for fixed text.',
}, `let mut s = ${S}::new(); s.push("a"); d(s)`);

add('osstring/push', 'push', OSSTRING, 'How OsString::push works', 'Appends more text to the OsString.', {
  rows: [['"file"'], ['".bak"']], call: 's.push(".bak")', note: 'no separator added', outs: ['"file.bak"'],
  intro: 'Accepts &str, &OsStr or similar.',
  steps: [['Start with "file".', 'a0'], ['Append ".bak".', 'b0', 'o0']],
  result: '"file.bak"', resultCap: 'PathBuf::push would add a path separator.',
}, `let mut s = ${S}::from("file"); s.push(".bak"); d(s)`);

add('osstring/into_string', 'into_string', OSSTRING, 'How OsString::into_string works', 'Converts to a String if valid Unicode; otherwise gives the OsString back.', {
  rows: [['OsString "ok"']], call: 'os.into_string()', note: 'Ok(String) or Err(OsString)', outs: ['Ok("ok")'],
  intro: 'Nothing is lost on failure.',
  steps: [['The text is valid.', 0], ['Ok(String).', [], 'o0']],
  result: 'Ok("ok")', resultCap: 'to_string_lossy accepts anything.',
}, `d(${S}::from("ok").into_string())`);

add('osstring/as_os_str', 'as_os_str', OSSTRING, 'How OsString::as_os_str works', 'Borrows the OsString as an &OsStr.', {
  rows: [['OsString "x"']], call: 's.as_os_str()', note: 'owned → borrowed', outs: ['&OsStr "x"'],
  intro: 'Like String::as_str.',
  steps: [['Borrow it.', 0], ['&OsStr.', [], 'o0']],
  result: '"x"', resultCap: '&s works too through Deref.',
}, `d(${S}::from("x").as_os_str())`);

add('osstring/with_capacity', 'with_capacity', OSSTRING, 'How OsString::with_capacity works', 'An empty OsString with room reserved.', {
  rows: [['32']], call: 'OsString::with_capacity(32)', note: 'pre-allocate', outs: ['capacity ≥ 32'],
  intro: 'Avoids reallocations while pushing.',
  steps: [['Room for 32.', 0], ['Still empty.', [], 'o0']],
  result: 'true', resultCap: 'Same idea as String::with_capacity.',
}, `(${S}::with_capacity(32).capacity() >= 32).to_string()`);

add('osstring/capacity', 'capacity', OSSTRING, 'How OsString::capacity works', 'How much fits before the OsString must grow.', {
  rows: [['with_capacity(16)']], call: 's.capacity()', note: 'room', outs: ['≥ 16'],
  intro: 'Like String::capacity.',
  steps: [['Room was reserved.', 0], ['At least 16.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to_fit releases spare room.',
}, `(${S}::with_capacity(16).capacity() >= 16).to_string()`);

add('osstring/clear', 'clear', OSSTRING, 'How OsString::clear works', 'Empties the OsString, keeping its capacity.', {
  rows: [['"abc"']], call: 's.clear()', note: 'reuse', outs: ['""'],
  intro: 'Handy in loops.',
  steps: [['The text is removed.', 0], ['Empty.', [], 'o0']],
  result: '""', resultCap: 'The allocation stays.',
}, `let mut s = ${S}::from("abc"); s.clear(); d(s)`);

add('osstring/into_boxed_os_str', 'into_boxed_os_str', OSSTRING, 'How OsString::into_boxed_os_str works', 'Turns the OsString into a Box<OsStr>, dropping spare capacity.', {
  rows: [['OsString "cfg"']], call: 's.into_boxed_os_str()', note: 'fixed, smaller', outs: ['Box<OsStr> "cfg"'],
  intro: 'Saves memory for strings that never change.',
  steps: [['Spare room is released.', 0], ['A Box<OsStr>.', [], 'o0']],
  result: '"cfg"', resultCap: 'into_os_string goes back.',
}, `d(${S}::from("cfg").into_boxed_os_str())`);

add('osstring/into_encoded_bytes', 'into_encoded_bytes', OSSTRING, 'How OsString::into_encoded_bytes works', 'Turns the OsString into its raw bytes (internal encoding).', {
  rows: [['OsString "hi"']], call: 's.into_encoded_bytes()', note: 'Vec<u8>', outs: ['[104, 105]'],
  intro: 'ASCII and UTF-8 come out unchanged.',
  steps: [['The buffer is handed over.', 0], ['As bytes.', [], 'o0']],
  result: '[104, 105]', resultCap: 'Turning bytes back needs unsafe from_encoded_bytes_unchecked.',
}, `d(${S}::from("hi").into_encoded_bytes())`);

add('osstring/leak', 'leak', OSSTRING, 'How OsString::leak works', 'Gives up the OsString forever and returns a &\'static mut OsStr.', {
  rows: [['OsString "app"']], call: "let s: &'static OsStr = os.leak();", note: 'never freed', outs: ["&'static OsStr"],
  intro: 'For values that must live for the whole program.',
  steps: [['The buffer is never freed.', 0], ['A static reference.', [], 'o0']],
  result: '"app"', resultCap: 'Do not call it repeatedly.',
}, `let s: &'static ${O} = ${S}::from("app").leak(); d(s)`);

add('osstring/reserve', 'reserve', OSSTRING, 'How OsString::reserve works', 'Makes room for at least n more bytes.', {
  rows: [['empty']], call: 's.reserve(50)', note: 'grow ahead', outs: ['capacity ≥ 50'],
  intro: 'Like String::reserve.',
  steps: [['Request room.', 0], ['At least 50.', [], 'o0']],
  result: 'true', resultCap: 'reserve_exact avoids headroom.',
}, `let mut s = ${S}::new(); s.reserve(50); (s.capacity() >= 50).to_string()`);

add('osstring/reserve_exact', 'reserve_exact', OSSTRING, 'How OsString::reserve_exact works', 'Makes room for exactly n more bytes.', {
  rows: [['empty']], call: 's.reserve_exact(7)', note: 'no headroom', outs: ['capacity ≥ 7'],
  intro: 'For a known final size.',
  steps: [['Request 7.', 0], ['At least 7.', [], 'o0']],
  result: 'true', resultCap: 'The allocator may round up.',
}, `let mut s = ${S}::new(); s.reserve_exact(7); (s.capacity() >= 7).to_string()`);

add('osstring/shrink_to_fit', 'shrink_to_fit', OSSTRING, 'How OsString::shrink_to_fit works', 'Releases unused capacity.', {
  rows: [['"a", capacity 100']], call: 's.shrink_to_fit()', note: 'give memory back', outs: ['small capacity'],
  intro: 'For long-lived values.',
  steps: [['Most room unused.', 0], ['Released.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to keeps a minimum.',
}, `let mut s = ${S}::with_capacity(100); s.push("a"); s.shrink_to_fit(); (s.capacity() < 100).to_string()`);

add('osstring/shrink_to', 'shrink_to', OSSTRING, 'How OsString::shrink_to works', 'Reduces capacity, keeping a minimum.', {
  rows: [['"a", capacity 100']], call: 's.shrink_to(10)', note: 'keep headroom', outs: ['10 ≤ capacity < 100'],
  intro: 'shrink_to_fit with a floor.',
  steps: [['Room shrinks...', 0], ['...but stays ≥ 10.', [], 'o0']],
  result: 'true', resultCap: 'Never below the length.',
}, `let mut s = ${S}::with_capacity(100); s.push("a"); s.shrink_to(10); (s.capacity() >= 10 && s.capacity() < 100).to_string()`);

add('osstring/try_reserve', 'try_reserve', OSSTRING, 'How OsString::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 's.try_reserve(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'Impossible sizes give Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve_exact avoids headroom.',
}, `let mut s = ${S}::new(); let a = s.try_reserve(10).is_ok(); let b = s.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })`);

add('osstring/try_reserve_exact', 'try_reserve_exact', OSSTRING, 'How OsString::try_reserve_exact works', 'try_reserve without headroom.', {
  rows: [['5']], call: 's.try_reserve_exact(5)', note: 'exact, recoverable', outs: ['Ok'],
  intro: 'Asks for just enough.',
  steps: [['Room for 5.', 0], ['Ok.', [], 'o0']],
  result: 'Ok', resultCap: 'Same pattern as String.',
}, `let mut s = ${S}::new(); (if s.try_reserve_exact(5).is_ok() { "Ok" } else { "Err" }).to_string()`);

module.exports = list;
