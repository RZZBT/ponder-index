// Rust standard library: more str, String and char methods.
const { group } = require('./kit.cjs');
const STR = ['core', 'str', /str\/mod\.rs$/];
const ASTR = ['alloc', 'str', /^src\/str\.rs$/];
const STRING = ['alloc', 'String', /^src\/string\.rs$/];
const CHAR = ['core', 'char', /char\/methods\.rs$/];
const S = (spec) => ({ kind: 'cells', ...spec });
const { list, add } = group({ at: STR });

// ---------------------------------------------------------------- str

add('str/trim_start_matches', 'trim_start_matches', null, 'How str::trim_start_matches works', 'Removes a pattern from the start, as often as it repeats.', S({
  call: '"000420".trim_start_matches(\'0\')', note: 'leading zeros', text: '000420', outs: ['"420"'],
  intro: 'Every leading match goes; the zero inside 420 stays.',
  steps: [{ cap: 'Three leading zeros match.', mark: [[0, 3, 'danger']] }, { cap: '"420" remains.', mark: [[3, 6, 'success']], keep: true, out: [0] }],
  result: '"420"', resultCap: 'strip_prefix removes the pattern at most once.',
}), 'd("000420".trim_start_matches(\'0\'))');

add('str/trim_end_matches', 'trim_end_matches', null, 'How str::trim_end_matches works', 'Removes a pattern from the end, as often as it repeats.', S({
  call: '"done!!!".trim_end_matches(\'!\')', note: 'trailing marks', text: 'done!!!', outs: ['"done"'],
  intro: 'All trailing ! are cut off.',
  steps: [{ cap: 'Three ! at the end match.', mark: [[4, 7, 'danger']] }, { cap: '"done" remains.', mark: [[0, 4, 'success']], keep: true, out: [0] }],
  result: '"done"', resultCap: 'The pattern can be a str, a char, a list of chars or a closure.',
}), 'd("done!!!".trim_end_matches(\'!\'))');

add('str/rmatches', 'rmatches', null, 'How str::rmatches works', 'Every match of a pattern, from the end backwards.', S({
  call: '"a1b22c3".rmatches(char::is_numeric)', note: 'last match first', text: 'a1b22c3', outs: ['"3"', '"2"', '"2"', '"1"'],
  intro: 'Same matches as matches(), in reverse order.',
  steps: [{ cap: '"3" is found first.', mark: [[6, 7, 'warning']], out: [0] }, { cap: 'Then "2", "2".', mark: [[3, 5, 'warning']], out: [1, 2] }, { cap: 'Then "1".', mark: [[1, 2, 'warning']], out: [3] }],
  result: '"3", "2", "2", "1"', resultCap: 'rmatch_indices also gives the positions.',
}), 'jd("a1b22c3".rmatches(char::is_numeric))');

add('str/rmatch_indices', 'rmatch_indices', null, 'How str::rmatch_indices works', 'Every match with its byte position, from the end backwards.', S({
  call: '"ab-ab".rmatch_indices("ab")', note: 'positions, last first', text: 'ab-ab', idx: true, outs: ['(3, "ab")', '(0, "ab")'],
  intro: 'Useful for finding the last occurrences first.',
  steps: [{ cap: 'The match at 3.', mark: [[3, 5, 'warning']], out: [0] }, { cap: 'The match at 0.', mark: [[0, 2, 'warning']], out: [1] }],
  result: '(3, "ab"), (0, "ab")', resultCap: 'rfind gives only the last position.',
}), 'jd("ab-ab".rmatch_indices("ab"))');

add('str/split_ascii_whitespace', 'split_ascii_whitespace', null, 'How str::split_ascii_whitespace works', 'Splits at runs of ASCII spaces, tabs and newlines.', S({
  call: '"a  b\\tc".split_ascii_whitespace()', note: 'ASCII-only, a bit faster', text: 'a  b\tc', outs: ['"a"', '"b"', '"c"'],
  intro: 'Runs of whitespace count as one separator; no empty pieces.',
  steps: [{ cap: '"a".', mark: [[0, 1, 'warning']], out: [0] }, { cap: 'Two spaces, then "b".', mark: [[1, 3, 'danger'], [3, 4, 'warning']], out: [1] }, { cap: 'A tab, then "c".', mark: [[4, 5, 'danger'], [5, 6, 'warning']], out: [2] }],
  result: '"a", "b", "c"', resultCap: 'split_whitespace also understands Unicode spaces.',
}), 'jd("a  b\\tc".split_ascii_whitespace())');

add('str/escape_debug', 'escape_debug', null, 'How str::escape_debug works', 'The text with special characters escaped, as {:?} shows it.', {
  rows: [['tab', 'quote', 'newline']], call: '"a\\tb\\"c\\n".escape_debug().to_string()', note: 'make invisible characters visible', outs: ['\\t', '\\"', '\\n'],
  intro: 'Each special character becomes a backslash sequence.',
  steps: [['The tab becomes \\t.', 0, 'o0'], ['The quote becomes \\".', 1, 'o1'], ['The newline becomes \\n.', 2, 'o2']],
  result: 'a\\tb\\"c\\n', resultCap: 'Printable Unicode such as é is kept; escape_default escapes it too.',
}, '"a\\tb\\"c\\n".escape_debug().to_string()');

add('str/escape_default', 'escape_default', null, 'How str::escape_default works', 'Escapes everything outside printable ASCII.', {
  rows: [['é', 'newline']], call: '"é\\n".escape_default().to_string()', note: 'pure ASCII output', outs: ['\\u{e9}', '\\n'],
  intro: 'Non-ASCII characters become \\u{…} escapes.',
  steps: [['é becomes \\u{e9}.', 0, 'o0'], ['The newline becomes \\n.', 1, 'o1']],
  result: '\\u{e9}\\n', resultCap: 'Handy when the output must be plain ASCII, like some config files.',
}, '"é\\n".escape_default().to_string()');

add('str/escape_unicode', 'escape_unicode', null, 'How str::escape_unicode works', 'Writes every character as a \\u{…} escape.', {
  rows: [["'h'", "'i'"]], call: '"hi".escape_unicode().to_string()', note: 'code points', outs: ['\\u{68}', '\\u{69}'],
  intro: 'Each char becomes its Unicode number in hex.',
  steps: [['h is 0x68.', 0, 'o0'], ['i is 0x69.', 1, 'o1']],
  result: '\\u{68}\\u{69}', resultCap: 'Useful to see exactly which characters a string contains.',
}, '"hi".escape_unicode().to_string()');

add('str/to_ascii_lowercase', 'to_ascii_lowercase', ASTR, 'How str::to_ascii_lowercase works', 'A copy with ASCII letters made small; other characters unchanged.', S({
  call: '"HÉLLO".to_ascii_lowercase()', note: 'É is not ASCII', text: 'HÉLLO', outs: ['"hÉllo"'],
  intro: 'Only A–Z change. É stays as it is, unlike with to_lowercase.',
  steps: [{ cap: 'H, L, L, O become small.', mark: [[0, 1, 'warning'], [2, 5, 'warning']] }, { cap: 'É is left alone.', mark: [[1, 2, 'danger']], keep: true, out: [0] }],
  result: '"hÉllo"', resultCap: 'Use to_lowercase for real text; the ASCII version for identifiers and protocols.',
}), 'd("HÉLLO".to_ascii_lowercase())');

add('str/make_ascii_uppercase', 'make_ascii_uppercase', null, 'How str::make_ascii_uppercase works', 'Upper-cases ASCII letters in place, without a new String.', S({
  call: 's.make_ascii_uppercase();', note: 's = "id-7x"', text: 'ID-7X', outs: ['"ID-7X"'],
  intro: 'The bytes are changed where they are; the length never changes.',
  steps: [{ cap: 'i, d and x become I, D and X.', mark: [[0, 2, 'warning'], [4, 5, 'warning']] }, { cap: '- and 7 stay.', mark: [[2, 4, 'accent2']], keep: true, out: [0] }],
  result: '"ID-7X"', resultCap: 'make_ascii_lowercase is the opposite.',
}), 'let mut s = String::from("id-7x"); s.make_ascii_uppercase(); d(s)');

add('str/make_ascii_lowercase', 'make_ascii_lowercase', null, 'How str::make_ascii_lowercase works', 'Lower-cases ASCII letters in place.', S({
  call: 's.make_ascii_lowercase();', note: 's = "README.MD"', text: 'readme.md', outs: ['"readme.md"'],
  intro: 'Works on a String or a &mut str.',
  steps: [{ cap: 'All letters become small.', mark: [[0, 6, 'warning'], [7, 9, 'warning']] }, { cap: 'The dot stays.', mark: [[6, 7, 'accent2']], keep: true, out: [0] }],
  result: '"readme.md"', resultCap: 'Good for normalising file extensions before comparing.',
}), 'let mut s = String::from("README.MD"); s.make_ascii_lowercase(); d(s)');

add('str/is_ascii', 'is_ascii', null, 'How str::is_ascii works', 'true if every character is plain ASCII.', {
  rows: [['"hello"', '"héllo"']], call: 's.is_ascii()', note: 'only bytes 0–127', outs: ['true', 'false'],
  intro: 'If true, every char is exactly one byte, so byte indexes and char indexes agree.',
  steps: [['"hello": true.', 0, 'o0'], ['"héllo" contains é: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Check it before using fast byte-based tricks on text.',
}, 'format!("{}, {}", "hello".is_ascii(), "héllo".is_ascii())');

add('str/get_mut', 'get_mut', null, 'How str::get_mut works', 'A mutable sub-slice, or None if the range is invalid.', S({
  call: 's.get_mut(0..3).map(|p| p.make_ascii_uppercase());', note: 's = "abcdef"', text: 'ABCdef', idx: true, outs: ['"ABCdef"'],
  intro: 'The range must lie on character boundaries, otherwise you get None (no panic).',
  steps: [{ cap: 'Bytes 0..3 are lent mutably.', mark: [[0, 3, 'warning']] }, { cap: 'They are upper-cased in place.', mark: [[0, 3, 'success']], keep: true, out: [0] }],
  result: '"ABCdef"', resultCap: 'Only in-place, same-length changes are possible on a &mut str.',
}), 'let mut s = String::from("abcdef"); s.get_mut(0..3).map(|p| p.make_ascii_uppercase()); d(s)');

add('str/trim_ascii', 'trim_ascii', null, 'How str::trim_ascii works', 'Removes ASCII whitespace from both ends.', S({
  call: '"\\t hi \\n".trim_ascii()', note: 'ASCII-only trim', text: '\t hi \n', outs: ['"hi"'],
  intro: 'Like trim, but only spaces, tabs and newlines from ASCII count.',
  steps: [{ cap: 'Tab and space at the start go.', mark: [[0, 2, 'danger']] }, { cap: 'Space and newline at the end go.', mark: [[4, 6, 'danger']], keep: true, out: [0] }],
  result: '"hi"', resultCap: 'trim also removes Unicode spaces such as the no-break space.',
}), 'd("\\t hi \\n".trim_ascii())');

add('str/split_inclusive', 'split_inclusive', null, 'How str::split_inclusive works', 'Splits after each separator, keeping it at the end of its piece.', S({
  call: '"a\\nb\\n".split_inclusive(\'\\n\')', note: 'keep the line endings', text: 'a\nb\n', outs: ['"a\\n"', '"b\\n"'],
  intro: 'Each piece ends with the separator that closed it.',
  steps: [{ cap: '"a\\n".', mark: [[0, 2, 'warning']], out: [0] }, { cap: '"b\\n".', mark: [[2, 4, 'warning']], out: [1] }],
  result: '"a\\n", "b\\n"', resultCap: 'lines() would drop the newlines.',
}), 'jd("a\\nb\\n".split_inclusive(\'\\n\'))');

add('str/encode_utf16', 'encode_utf16', null, 'How str::encode_utf16 works', 'The text as UTF-16 code units, as Windows and JavaScript use.', {
  rows: [['"A"', '"🦀"']], call: '"A🦀".encode_utf16().collect::<Vec<u16>>()', note: 'u16 units', outs: ['65', '55358, 56704'],
  intro: 'Most characters take one u16; characters beyond U+FFFF take two (a surrogate pair).',
  steps: [['A is one unit: 65.', 0, 'o0'], ['The crab needs two units.', 1, 'o1']],
  result: '[65, 55358, 56704]', resultCap: 'String::from_utf16 goes back the other way.',
}, 'd("A🦀".encode_utf16().collect::<Vec<u16>>())');

add('str/rsplit_terminator', 'rsplit_terminator', null, 'How str::rsplit_terminator works', 'Like rsplit, but a separator at the very end makes no empty piece.', S({
  call: '"a;b;".rsplit_terminator(\';\')', note: 'from the end', text: 'a;b;', outs: ['"b"', '"a"'],
  intro: 'The final ; terminates the last item instead of starting an empty one.',
  steps: [{ cap: '"b" comes first.', mark: [[2, 3, 'warning']], out: [0] }, { cap: 'Then "a".', mark: [[0, 1, 'warning']], out: [1] }],
  result: '"b", "a"', resultCap: 'split_terminator is the forward version.',
}), 'jd("a;b;".rsplit_terminator(\';\'))');

add('str/split_at_checked', 'split_at_checked', null, 'How str::split_at_checked works', 'split_at that returns None instead of panicking.', S({
  call: '"héllo".split_at_checked(2)', note: 'é covers bytes 1 and 2', text: 'héllo', idx: true, outs: ['None', 'at 3: Some(("hé", "llo"))'],
  intro: 'Byte 2 is in the middle of é, so splitting there is impossible.',
  steps: [{ cap: 'Byte 2 is not a char boundary: None.', mark: [[1, 2, 'danger']], out: [0] }, { cap: 'Byte 3 works.', mark: [[0, 2, 'warning'], [2, 5, 'accent2']], out: [1] }],
  result: 'None, Some(("hé", "llo"))', resultCap: 'Use it when the position comes from user input or a computation.',
}), 'format!("{:?}, {:?}", "héllo".split_at_checked(2), "héllo".split_at_checked(3))');

add('str/to_owned', 'to_owned', ASTR, 'How str::to_owned works', 'Makes an owned String from a &str.', {
  rows: [['&"key"']], call: 'map.insert("key".to_owned(), 1);', note: '&str → String', outs: ['String "key"'],
  intro: 'to_owned is the general "make an owned copy" trait; for str it gives a String.',
  steps: [['The borrowed text is copied...', 0], ['...into a new String.', [], 'o0']],
  result: '"key"', resultCap: 'to_string() and String::from() do the same.',
}, 'let s: String = "key".to_owned(); d(s)');

add('str/into_string', 'into_string', ASTR, 'How str::into_string works', 'Turns a Box<str> into a String without copying.', {
  rows: [['Box<str> "hi"']], call: 'boxed.into_string()', note: 'reuse the buffer', outs: ['String "hi"'],
  intro: 'A Box<str> cannot grow; a String can. The bytes stay where they are.',
  steps: [['The boxed text is handed over.', 0], ['It is now a String.', [], 'o0']],
  result: '"hi"', resultCap: 'String::into_boxed_str goes the other way.',
}, 'let b: Box<str> = "hi".into(); d(b.into_string())');

add('str/from_utf8', 'from_utf8', ['core', '', /str\/converts\.rs$/], 'How str::from_utf8 works', 'Views bytes as a &str, if they are valid UTF-8.', {
  rows: [['[104, 105]', '[255]']], call: 'std::str::from_utf8(&bytes)', note: 'no copy', outs: ['Ok("hi")', 'Err'],
  intro: 'The bytes are checked, not copied.',
  steps: [['104, 105 are "hi".', 0, 'o0'], ['255 is never valid UTF-8: Err.', 1, 'o1']],
  result: 'Ok("hi"), Err', resultCap: 'String::from_utf8 does the same for an owned Vec<u8>.',
}, 'let a = std::str::from_utf8(&[104, 105]); let b = std::str::from_utf8(&[255]).is_err(); format!("{:?}, {}", a, if b { "Err" } else { "Ok" })');

// ---------------------------------------------------------------- String

add('string/new', 'new', STRING, 'How String::new works', 'An empty String, which does not allocate until text is added.', {
  rows: [['String::new()']], call: 'let mut s = String::new(); s.push_str("hi");', note: 'empty and cheap', outs: ['""', '"hi"'],
  intro: 'new() reserves no memory; the first push does.',
  steps: [['Empty.', 0, 'o0'], ['After push_str: "hi".', 0, 'o1']],
  result: '"", "hi"', resultCap: 'String::with_capacity avoids reallocations when you know the size.',
}, 'let mut s = String::new(); let a = s.clone(); s.push_str("hi"); format!("{:?}, {:?}", a, s)');

add('string/with_capacity', 'with_capacity', STRING, 'How String::with_capacity works', 'An empty String with room for n bytes reserved.', {
  rows: [['with_capacity(64)']], call: 'String::with_capacity(64)', note: 'pre-allocate', outs: ['len 0, capacity ≥ 64'],
  intro: 'Building a long String piece by piece is faster when the room exists up front.',
  steps: [['64 bytes are reserved.', 0], ['Nothing is stored yet.', [], 'o0']],
  result: 'len = 0, enough room: true', resultCap: 'Capacity is in bytes, not characters.',
}, 'let s = String::with_capacity(64); format!("len = {}, enough room: {}", s.len(), s.capacity() >= 64)');

add('string/capacity', 'capacity', STRING, 'How String::capacity works', 'How many bytes fit before the String must grow.', {
  rows: [['"abc" in a 10-byte buffer']], call: 's.capacity()', note: 'room vs. length', outs: ['len 3', 'capacity 10'],
  intro: 'len counts used bytes; capacity counts available bytes.',
  steps: [['3 bytes used.', 0, 'o0'], ['10 bytes available.', 0, 'o1']],
  result: 'len = 3, capacity = 10', resultCap: 'shrink_to_fit gives the spare room back.',
}, 'let mut s = String::with_capacity(10); s.push_str("abc"); format!("len = {}, capacity = {}", s.len(), s.capacity())');

add('string/reserve', 'reserve', STRING, 'How String::reserve works', 'Makes room for at least n more bytes.', {
  rows: [['"ab"']], call: 's.reserve(100)', note: 'grow ahead of time', outs: ['capacity ≥ 102'],
  intro: 'reserve may allocate more than asked, to make future growth cheap.',
  steps: [['Two bytes are used.', 0], ['Room for 100 more is guaranteed.', [], 'o0']],
  result: 'true', resultCap: 'reserve_exact asks for no extra headroom.',
}, 'let mut s = String::from("ab"); s.reserve(100); (s.capacity() >= 102).to_string()');

add('string/shrink_to_fit', 'shrink_to_fit', STRING, 'How String::shrink_to_fit works', 'Releases unused capacity.', {
  rows: [['"hi" with capacity 100']], call: 's.shrink_to_fit()', note: 'give memory back', outs: ['capacity 2'],
  intro: 'After building a String, extra room can be returned.',
  steps: [['98 bytes are unused.', 0], ['They are released.', [], 'o0']],
  result: '2', resultCap: 'Only worth it for big, long-lived Strings.',
}, 'let mut s = String::with_capacity(100); s.push_str("hi"); s.shrink_to_fit(); s.capacity().to_string()');

add('string/as_mut_str', 'as_mut_str', STRING, 'How String::as_mut_str works', 'Borrows the String as a &mut str.', S({
  call: 's.as_mut_str().make_ascii_uppercase();', note: 's = "abc"', text: 'ABC', outs: ['"ABC"'],
  intro: 'A &mut str allows in-place changes that keep the length the same.',
  steps: [{ cap: 'The text is lent mutably.', mark: [[0, 3, 'accent2']] }, { cap: 'It is upper-cased in place.', mark: [[0, 3, 'success']], keep: true, out: [0] }],
  result: '"ABC"', resultCap: '&mut *s or &mut s[..] does the same.',
}), 'let mut s = String::from("abc"); s.as_mut_str().make_ascii_uppercase(); d(s)');

add('string/into_boxed_str', 'into_boxed_str', STRING, 'How String::into_boxed_str works', 'Turns the String into a Box<str>, dropping spare capacity.', {
  rows: [['String "fixed"']], call: 's.into_boxed_str()', note: 'a bit smaller, cannot grow', outs: ['Box<str> "fixed"'],
  intro: 'Box<str> stores only a pointer and a length (16 bytes instead of 24).',
  steps: [['Spare capacity is released.', 0], ['The text now lives in a Box<str>.', [], 'o0']],
  result: '"fixed"', resultCap: 'Good for many small strings that never change.',
}, 'let s = String::from("fixed"); let b: Box<str> = s.into_boxed_str(); d(b)');

add('string/from_utf16', 'from_utf16', STRING, 'How String::from_utf16 works', 'Decodes UTF-16 code units into a String.', {
  rows: [['[72, 105]', '[0xD800]']], call: 'String::from_utf16(&units)', note: 'from Windows/JS strings', outs: ['Ok("Hi")', 'Err'],
  intro: 'Each u16 is a code unit; a lone surrogate is invalid.',
  steps: [['72, 105 are "Hi".', 0, 'o0'], ['0xD800 alone is an unpaired surrogate: Err.', 1, 'o1']],
  result: 'Ok("Hi"), Err', resultCap: 'from_utf16_lossy replaces bad units with � instead.',
}, 'let a = String::from_utf16(&[72, 105]); let b = String::from_utf16(&[0xD800]).is_err(); format!("{:?}, {}", a, if b { "Err" } else { "Ok" })');

add('string/from_utf16_lossy', 'from_utf16_lossy', STRING, 'How String::from_utf16_lossy works', 'Decodes UTF-16, replacing invalid units with �.', {
  rows: [['72', '0xD800', '105']], call: 'String::from_utf16_lossy(&[72, 0xD800, 105])', note: 'never fails', outs: ['"H"', '"�"', '"i"'],
  intro: 'Broken parts become the replacement character.',
  steps: [['72 is H.', 0, 'o0'], ['A lone surrogate becomes �.', 1, 'o1'], ['105 is i.', 2, 'o2']],
  result: '"H�i"', resultCap: 'Use it when partial text is better than an error.',
}, 'd(String::from_utf16_lossy(&[72, 0xD800, 105]))');

add('string/is_empty', 'is_empty', STRING, 'How String::is_empty works', 'true if the String has no bytes.', {
  rows: [['""', '" "']], call: 's.is_empty()', note: 'a space counts', outs: ['true', 'false'],
  intro: 'is_empty looks at the length only.',
  steps: [['"": true.', 0, 'o0'], ['" ": one byte, false.', 1, 'o1']],
  result: 'true, false', resultCap: 'To ignore whitespace: s.trim().is_empty().',
}, 'format!("{}, {}", String::new().is_empty(), String::from(" ").is_empty())');

add('string/leak', 'leak', STRING, 'How String::leak works', 'Gives up the String forever and returns a &\'static mut str.', {
  rows: [['String "app-name"']], call: "let name: &'static str = s.leak();", note: 'never freed', outs: ["&'static str"],
  intro: 'For text computed once at start-up that must live for the whole program.',
  steps: [['The String lets go of its buffer.', 0], ['You get a &\'static str.', [], 'o0']],
  result: '"app-name"', resultCap: 'Each call leaks memory; never call it in a loop.',
}, 'let s = String::from("app-name"); let n: &\'static str = s.leak(); d(n)');

add('string/try_reserve', 'try_reserve', STRING, 'How String::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['reserve 10', 'reserve usize::MAX']], call: 's.try_reserve(n)', note: 'recover from out-of-memory', outs: ['Ok', 'Err'],
  intro: 'try_reserve lets a program survive an impossible allocation.',
  steps: [['10 bytes: fine.', 0, 'o0'], ['usize::MAX bytes: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Vec has the same method.',
}, 'let mut s = String::new(); let a = s.try_reserve(10).is_ok(); let b = s.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('string/clone', 'clone', STRING, 'How String::clone works', 'A new String with a copy of the text.', {
  rows: [['a = "hi"']], call: 'let mut b = a.clone(); b.push(\'!\');', note: 'independent copy', outs: ['a = "hi"', 'b = "hi!"'],
  intro: 'The clone has its own buffer; changing it does not affect a.',
  steps: [['b gets its own copy.', 0], ['Only b changes.', [], 'o0,1']],
  result: 'a = "hi", b = "hi!"', resultCap: 'Pass &a or &str when you only need to read the text.',
}, 'let a = String::from("hi"); let mut b = a.clone(); b.push(\'!\'); format!("a = {:?}, b = {:?}", a, b)');

add('string/from_iter', 'from_iter', STRING, 'How String::from_iter works', 'Builds a String from chars or string pieces; this is what collect() uses.', {
  rows: [["'a'", "'b'", "'c'"]], call: "\"abc\".chars().rev().collect::<String>()", note: 'iterator → String', outs: ['"cba"'],
  intro: 'Every char (or &str) from the iterator is pushed onto a new String.',
  steps: [['rev() yields c, b, a.', [2, 1, 0]], ['They are joined into "cba".', [], 'o0']],
  result: '"cba"', resultCap: 'Collecting &str pieces works too: words.iter().copied().collect::<String>().',
}, 'd(String::from_iter("abc".chars().rev()))');

// ---------------------------------------------------------------- char

add('char/is_lowercase', 'is_lowercase', CHAR, 'How char::is_lowercase works', 'true for lower-case letters, in any alphabet.', {
  rows: [["'a'", "'é'", "'A'"]], call: 'c.is_lowercase()', note: 'Unicode-aware', outs: ['true', 'true', 'false'],
  intro: 'Unlike is_ascii_lowercase, letters like é and ß count.',
  steps: [["'a' and 'é': true.", [0, 1], 'o0,1'], ["'A': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'is_ascii_lowercase only accepts a–z.',
}, 'format!("{}, {}, {}", \'a\'.is_lowercase(), \'é\'.is_lowercase(), \'A\'.is_lowercase())');

add('char/to_lowercase', 'to_lowercase', CHAR, 'How char::to_lowercase works', 'An iterator of the lower-case form of a character.', {
  rows: [["'A'", "'Σ'"]], call: "'Σ'.to_lowercase().collect::<String>()", note: 'Unicode rules', outs: ['"a"', '"σ"'],
  intro: 'It returns an iterator because a few characters lower-case to several.',
  steps: [["'A' → \"a\".", 0, 'o0'], ["Greek 'Σ' → \"σ\".", 1, 'o1']],
  result: '"a", "σ"', resultCap: 'to_ascii_lowercase returns a single char, but only changes A–Z.',
}, 'format!("{:?}, {:?}", \'A\'.to_lowercase().collect::<String>(), \'Σ\'.to_lowercase().collect::<String>())');

add('char/is_control', 'is_control', CHAR, 'How char::is_control works', 'true for invisible control characters like newline and tab.', {
  rows: [["'\\n'", "'\\t'", "'a'"]], call: 'c.is_control()', note: 'not printable', outs: ['true', 'true', 'false'],
  intro: 'Control characters steer the output instead of showing a symbol.',
  steps: [['Newline and tab: true.', [0, 1], 'o0,1'], ["'a': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Strip them from user input: s.chars().filter(|c| !c.is_control()).',
}, 'format!("{}, {}, {}", \'\\n\'.is_control(), \'\\t\'.is_control(), \'a\'.is_control())');

add('char/is_digit', 'is_digit', CHAR, 'How char::is_digit works', 'true if the char is a digit in the given base.', {
  rows: [["'7' base 8", "'9' base 8", "'f' base 16"]], call: "c.is_digit(radix)", note: 'base 2 to 36', outs: ['true', 'false', 'true'],
  intro: 'In base 8 only 0–7 are digits; in base 16, a–f count too.',
  steps: [["'7' is an octal digit.", 0, 'o0'], ["'9' is not.", 1, 'o1'], ["'f' is a hex digit.", 2, 'o2']],
  result: 'true, false, true', resultCap: 'to_digit(radix) also gives the value.',
}, 'format!("{}, {}, {}", \'7\'.is_digit(8), \'9\'.is_digit(8), \'f\'.is_digit(16))');

add('char/encode_utf8', 'encode_utf8', CHAR, 'How char::encode_utf8 works', 'Writes the char\'s UTF-8 bytes into a buffer, without allocating.', {
  rows: [["'é'"]], call: "'é'.encode_utf8(&mut buf)", note: 'buf: [u8; 4]', outs: ['0xC3', '0xA9'],
  intro: 'A char needs 1 to 4 bytes; é needs 2.',
  steps: [['The first byte is 0xC3.', 0, 'o0'], ['The second is 0xA9.', 0, 'o1']],
  result: '[195, 169]', resultCap: 'It returns the written part as a &mut str. len_utf8() tells the size in advance.',
}, 'let mut buf = [0u8; 4]; let s = \'é\'.encode_utf8(&mut buf); d(s.as_bytes())');

add('char/len_utf16', 'len_utf16', CHAR, 'How char::len_utf16 works', 'How many u16 units the char needs in UTF-16.', {
  rows: [["'a'", "'🦀'"]], call: 'c.len_utf16()', note: '1 or 2', outs: ['1', '2'],
  intro: 'Characters beyond U+FFFF need a surrogate pair.',
  steps: [["'a': 1.", 0, 'o0'], ['The crab: 2.', 1, 'o1']],
  result: '1, 2', resultCap: 'JavaScript string lengths count these units, so "🦀".length is 2 there.',
}, 'format!("{}, {}", \'a\'.len_utf16(), \'🦀\'.len_utf16())');

add('char/is_ascii_punctuation', 'is_ascii_punctuation', CHAR, 'How char::is_ascii_punctuation works', 'true for ASCII symbols such as ! ? , . - _', {
  rows: [["'?'", "'-'", "'a'"]], call: 'c.is_ascii_punctuation()', note: 'printable, not letters or digits', outs: ['true', 'true', 'false'],
  intro: 'All printable ASCII symbols count; spaces do not.',
  steps: [["'?' and '-': true.", [0, 1], 'o0,1'], ["'a': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Remove punctuation: s.chars().filter(|c| !c.is_ascii_punctuation()).',
}, 'format!("{}, {}, {}", \'?\'.is_ascii_punctuation(), \'-\'.is_ascii_punctuation(), \'a\'.is_ascii_punctuation())');

add('char/is_ascii_hexdigit', 'is_ascii_hexdigit', CHAR, 'How char::is_ascii_hexdigit works', 'true for 0–9, a–f and A–F.', {
  rows: [["'9'", "'C'", "'g'"]], call: 'c.is_ascii_hexdigit()', note: 'hexadecimal', outs: ['true', 'true', 'false'],
  intro: 'Hex digits go up to f.',
  steps: [["'9' and 'C': true.", [0, 1], 'o0,1'], ["'g': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Validate colours: s[1..].chars().all(|c| c.is_ascii_hexdigit()).',
}, 'format!("{}, {}, {}", \'9\'.is_ascii_hexdigit(), \'C\'.is_ascii_hexdigit(), \'g\'.is_ascii_hexdigit())');

add('char/to_ascii_lowercase', 'to_ascii_lowercase', CHAR, 'How char::to_ascii_lowercase works', 'The small version of A–Z; every other char is returned unchanged.', {
  rows: [["'Q'", "'É'"]], call: "c.to_ascii_lowercase()", note: 'always one char', outs: ["'q'", "'É'"],
  intro: 'É is not ASCII, so it stays.',
  steps: [["'Q' → 'q'.", 0, 'o0'], ["'É' is unchanged.", 1, 'o1']],
  result: "'q', 'É'", resultCap: 'to_lowercase handles all alphabets but returns an iterator.',
}, 'format!("{:?}, {:?}", \'Q\'.to_ascii_lowercase(), \'É\'.to_ascii_lowercase())');

add('char/eq_ignore_ascii_case', 'eq_ignore_ascii_case', CHAR, 'How char::eq_ignore_ascii_case works', 'Compares two chars, treating A and a as equal.', {
  rows: [["'y' vs 'Y'", "'y' vs 'n'"]], call: "answer.eq_ignore_ascii_case(&'y')", note: 'yes/no prompts', outs: ['true', 'false'],
  intro: 'Only ASCII letters are case-folded.',
  steps: [['y and Y: true.', 0, 'o0'], ['y and n: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'str::eq_ignore_ascii_case compares whole words.',
}, 'format!("{}, {}", \'y\'.eq_ignore_ascii_case(&\'Y\'), \'y\'.eq_ignore_ascii_case(&\'n\'))');

add('char/is_ascii_graphic', 'is_ascii_graphic', CHAR, 'How char::is_ascii_graphic works', 'true for visible ASCII characters (no space, no control codes).', {
  rows: [["'A'", "'~'", "' '"]], call: 'c.is_ascii_graphic()', note: 'prints ink', outs: ['true', 'true', 'false'],
  intro: 'Letters, digits and symbols count; the space does not.',
  steps: [["'A' and '~': true.", [0, 1], 'o0,1'], ['A space: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'Useful to validate passwords or identifiers.',
}, 'format!("{}, {}, {}", \'A\'.is_ascii_graphic(), \'~\'.is_ascii_graphic(), \' \'.is_ascii_graphic())');

add('char/escape_unicode', 'escape_unicode', CHAR, 'How char::escape_unicode works', 'The char written as \\u{…} with its code point in hex.', {
  rows: [["'é'"]], call: "'é'.escape_unicode().to_string()", note: 'see the code point', outs: ['\\u{e9}'],
  intro: 'é is U+00E9.',
  steps: [['The code point is 0xE9.', 0], ['Written as \\u{e9}.', [], 'o0']],
  result: '\\u{e9}', resultCap: 'Rust source accepts the same syntax: \'\\u{e9}\' == \'é\'.',
}, '\'é\'.escape_unicode().to_string()');

add('char/is_ascii_alphabetic', 'is_ascii_alphabetic', CHAR, 'How char::is_ascii_alphabetic works', 'true for a–z and A–Z only.', {
  rows: [["'k'", "'é'", "'3'"]], call: 'c.is_ascii_alphabetic()', note: 'English letters', outs: ['true', 'false', 'false'],
  intro: 'é is a letter, but not an ASCII one.',
  steps: [["'k': true.", 0, 'o0'], ["'é' and '3': false.", [1, 2], 'o1,2']],
  result: 'true, false, false', resultCap: 'is_alphabetic accepts letters from every alphabet.',
}, 'format!("{}, {}, {}", \'k\'.is_ascii_alphabetic(), \'é\'.is_ascii_alphabetic(), \'3\'.is_ascii_alphabetic())');

module.exports = list;
