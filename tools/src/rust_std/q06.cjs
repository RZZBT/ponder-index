// Rust standard library: the remaining String and str methods (UTF-8 errors, char boundaries, utf8_chunks), and
// the first half of the remaining slice methods.
const { group, nums } = require('./kit.cjs');
const STRING = ['alloc', 'String', /^src\/string\.rs$/];
const FUE = ['alloc', 'FromUtf8Error', /^src\/string\.rs$/];
const STR = ['core', 'str', /str\/mod\.rs$/];
const LOSSY = (o) => ['core', o, /str\/lossy\.rs$/];
const U8E = ['core', 'Utf8Error', /str\/error\.rs$/];
const SLICE = ['core', '', /slice\/mod\.rs$/];
const ASCII = ['core', '', /slice\/ascii\.rs$/];
const S = (spec) => ({ kind: 'cells', ...spec });
const { list, add } = group({ at: STRING });

// ---------------------------------------------------------------- String

add('string/as_bytes', 'as_bytes', null, 'How String::as_bytes works', 'The String\'s UTF-8 bytes as a slice, without copying.', S({
  call: 's.as_bytes()', note: 's = "Hé"', text: 'Hé', outs: ['72', '195, 169'],
  intro: 'é takes two bytes.',
  steps: [{ cap: 'H is 72.', mark: [[0, 1, 'warning']], out: [0] }, { cap: 'é is 195, 169.', mark: [[1, 2, 'warning']], out: [1] }],
  result: '[72, 195, 169]', resultCap: 'into_bytes() gives an owned Vec<u8> instead.',
}), 'let s = String::from("Hé"); d(s.as_bytes())');

add('string/extend_from_within', 'extend_from_within', null, 'How String::extend_from_within works', 'Appends a copy of part of the String to its own end.', S({
  call: 's.extend_from_within(..2)', note: 's = "abc"', text: 'abcab', outs: ['"abcab"'],
  intro: 'The range is in bytes and must fall on character boundaries.',
  steps: [{ cap: 'Bytes ..2 are "ab".', mark: [[0, 2, 'warning']] }, { cap: 'They are appended.', mark: [[3, 5, 'success']], keep: true, out: [0] }],
  result: '"abcab"', resultCap: 'No temporary copy is needed.',
}), 'let mut s = String::from("abc"); s.extend_from_within(..2); d(s)');

add('string/reserve_exact', 'reserve_exact', null, 'How String::reserve_exact works', 'Makes room for exactly n more bytes.', {
  rows: [['""']], call: 's.reserve_exact(10)', note: 'no headroom', outs: ['capacity ≥ 10'],
  intro: 'For when you know the final size.',
  steps: [['Room for 10 bytes.', 0], ['Capacity at least 10.', [], 'o0']],
  result: 'true', resultCap: 'reserve may allocate more for future growth.',
}, 'let mut s = String::new(); s.reserve_exact(10); (s.capacity() >= 10).to_string()');

add('string/shrink_to', 'shrink_to', null, 'How String::shrink_to works', 'Reduces capacity, keeping a minimum.', {
  rows: [['"hi", capacity 100']], call: 's.shrink_to(16)', note: 'keep headroom', outs: ['16 ≤ capacity < 100'],
  intro: 'shrink_to_fit with a floor.',
  steps: [['Room shrinks...', 0], ['...but stays ≥ 16.', [], 'o0']],
  result: 'true', resultCap: 'Never below len.',
}, 'let mut s = String::with_capacity(100); s.push_str("hi"); s.shrink_to(16); (s.capacity() >= 16 && s.capacity() < 100).to_string()');

add('string/try_reserve_exact', 'try_reserve_exact', null, 'How String::try_reserve_exact works', 'Reserves exactly n more bytes, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 's.try_reserve_exact(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'Impossible sizes become an Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve allows headroom.',
}, 'let mut s = String::new(); let a = s.try_reserve_exact(10).is_ok(); let b = s.try_reserve_exact(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('string_drain/as_str', 'as_str', ['alloc', 'Drain', /^src\/string\.rs$/], 'How string::Drain::as_str works', 'The part of the drained range not handed out yet.', S({
  call: 'let mut d = s.drain(..3); d.next(); d.as_str()', note: 's = "abcd"', text: 'abcd', outs: ['"bc"'],
  intro: 'drain(..3) covers "abc"; after one next(), "bc" is left.',
  steps: [{ cap: 'a was taken.', mark: [[0, 1, 'danger']] }, { cap: '"bc" is still pending.', mark: [[1, 3, 'warning']], keep: true, out: [0] }],
  result: '"bc"', resultCap: 'The rest is removed when the Drain is dropped.',
}), 'let mut s = String::from("abcd"); let r = { let mut dr = s.drain(..3); dr.next(); dr.as_str().to_string() }; d(r)');

add('from_utf8_error/utf8_error', 'utf8_error', FUE, 'How FromUtf8Error::utf8_error works', 'Details of why String::from_utf8 failed.', {
  rows: [['[104, 255, 105]']], call: 'String::from_utf8(bytes).unwrap_err().utf8_error()', note: 'where it went wrong', outs: ['valid_up_to = 1'],
  intro: 'The first byte is valid; 255 is not.',
  steps: [['104 is "h": valid.', 0], ['255 breaks at index 1.', [], 'o0']],
  result: '1', resultCap: 'valid_up_to() tells how much is usable.',
}, 'String::from_utf8(vec![104, 255, 105]).unwrap_err().utf8_error().valid_up_to().to_string()');

add('from_utf8_error/into_bytes', 'into_bytes', FUE, 'How FromUtf8Error::into_bytes works', 'Gets the original bytes back after a failed conversion.', {
  rows: [['[104, 255]']], call: 'err.into_bytes()', note: 'nothing is lost', outs: ['[104, 255]'],
  intro: 'from_utf8 took ownership of the Vec; the error hands it back.',
  steps: [['Conversion failed.', 0], ['The bytes return unchanged.', [], 'o0']],
  result: '[104, 255]', resultCap: 'Then try from_utf8_lossy, or report the problem.',
}, 'd(String::from_utf8(vec![104, 255]).unwrap_err().into_bytes())');

add('from_utf8_error/as_bytes', 'as_bytes', FUE, 'How FromUtf8Error::as_bytes works', 'Looks at the bytes that failed to convert.', {
  rows: [['[0xC3]']], call: 'err.as_bytes()', note: 'borrow the bytes', outs: ['[195]'],
  intro: '0xC3 starts a two-byte character, but the second byte is missing.',
  steps: [['The conversion failed.', 0], ['as_bytes shows [195].', [], 'o0']],
  result: '[195]', resultCap: 'into_bytes takes them back by value.',
}, 'let e = String::from_utf8(vec![0xC3]).unwrap_err(); d(e.as_bytes())');

add('string/into_raw_parts_free', 'into_boxed_bytes', ['alloc', 'str', /^src\/str\.rs$/], 'How str::into_boxed_bytes works', 'Turns a Box<str> into a Box<[u8]>, without copying.', {
  rows: [['Box<str> "ab"']], call: 'boxed.into_boxed_bytes()', note: 'same memory', outs: ['[97, 98]'],
  intro: 'Only the type changes.',
  steps: [['The text is boxed.', 0], ['Now it is seen as bytes.', [], 'o0']],
  result: '[97, 98]', resultCap: 'std::str::from_boxed_utf8_unchecked would go back (unsafe).',
}, 'let b: Box<str> = "ab".into(); d(b.into_boxed_bytes())');

// ---------------------------------------------------------------- str

add('str/floor_char_boundary', 'floor_char_boundary', STR, 'How str::floor_char_boundary works', 'The nearest character boundary at or before a byte index.', S({
  call: '"héllo".floor_char_boundary(2)', note: 'é covers bytes 1–2', text: 'héllo', idx: true, outs: ['1'],
  intro: 'Byte 2 is inside é, so it moves back to where é starts.',
  steps: [{ cap: 'Byte 2 is in the middle of é.', mark: [[1, 2, 'danger']] }, { cap: 'The boundary before it is 1.', mark: [[0, 1, 'success']], keep: true, out: [0] }],
  result: '1', resultCap: 'Safe truncation: &s[..s.floor_char_boundary(max)].',
}), '"héllo".floor_char_boundary(2).to_string()');

add('str/ceil_char_boundary', 'ceil_char_boundary', STR, 'How str::ceil_char_boundary works', 'The nearest character boundary at or after a byte index.', S({
  call: '"héllo".ceil_char_boundary(2)', note: 'round up', text: 'héllo', idx: true, outs: ['3'],
  intro: 'Byte 2 is inside é, so it moves forward to where l starts.',
  steps: [{ cap: 'Byte 2 is inside é.', mark: [[1, 2, 'danger']] }, { cap: 'The next boundary is 3.', mark: [[2, 3, 'success']], keep: true, out: [0] }],
  result: '3', resultCap: 'Pair with floor_char_boundary for safe slicing.',
}), '"héllo".ceil_char_boundary(2).to_string()');

add('str/split_at_mut', 'split_at_mut', STR, 'How str::split_at_mut works', 'Two mutable halves of a string, split at a byte index.', S({
  call: 'let (a, b) = s.split_at_mut(2); a.make_ascii_uppercase();', note: 's = "abcd"', text: 'ABcd', outs: ['"ABcd"'],
  intro: 'Each half can be changed separately (same-length changes only).',
  steps: [{ cap: 'a = "ab", b = "cd".', mark: [[0, 2, 'warning'], [2, 4, 'accent2']] }, { cap: 'Only the first half is upper-cased.', mark: [[0, 2, 'success']], keep: true, out: [0] }],
  result: '"ABcd"', resultCap: 'Panics if the index is not on a char boundary.',
}), 'let mut s = String::from("abcd"); { let (a, _b) = s.as_mut_str().split_at_mut(2); a.make_ascii_uppercase(); } d(s)');

add('str/split_at_mut_checked', 'split_at_mut_checked', STR, 'How str::split_at_mut_checked works', 'split_at_mut that returns None instead of panicking.', {
  rows: [['"é" at 1', '"é" at 2']], call: 's.split_at_mut_checked(1)', note: 'é is 2 bytes', outs: ['None', 'Some(("é", ""))'],
  intro: 'Index 1 is inside é.',
  steps: [['At 1: not a boundary, None.', 0, 'o0'], ['At 2: fine.', 1, 'o1']],
  result: 'None, Some(("é", ""))', resultCap: 'Use it with computed indexes.',
}, 'let mut s = String::from("é"); let a = s.as_mut_str().split_at_mut_checked(1).is_none(); let b = s.as_mut_str().split_at_mut_checked(2).map(|(x, y)| (x.to_string(), y.to_string())); format!("{}, {:?}", if a { "None" } else { "Some" }, b)');

add('str/trim_ascii_start', 'trim_ascii_start', STR, 'How str::trim_ascii_start works', 'Removes ASCII whitespace from the start only.', S({
  call: '"  hi ".trim_ascii_start()', note: 'left side', text: '  hi ', outs: ['"hi "'],
  intro: 'The trailing space stays.',
  steps: [{ cap: 'Two leading spaces go.', mark: [[0, 2, 'danger']] }, { cap: '"hi " remains.', mark: [[2, 5, 'success']], keep: true, out: [0] }],
  result: '"hi "', resultCap: 'trim_ascii_end does the right side.',
}), 'd("  hi ".trim_ascii_start())');

add('str/trim_ascii_end', 'trim_ascii_end', STR, 'How str::trim_ascii_end works', 'Removes ASCII whitespace from the end only.', S({
  call: '"line\\r\\n".trim_ascii_end()', note: 'drop line endings', text: 'line\r\n', outs: ['"line"'],
  intro: '\\r and \\n are ASCII whitespace.',
  steps: [{ cap: '\\r\\n at the end goes.', mark: [[4, 6, 'danger']] }, { cap: '"line" remains.', mark: [[0, 4, 'success']], keep: true, out: [0] }],
  result: '"line"', resultCap: 'trim_end also removes Unicode spaces.',
}), 'd("line\\r\\n".trim_ascii_end())');

add('str/from_utf8_mut', 'from_utf8_mut', ['core', '', /str\/converts\.rs$/], 'How str::from_utf8_mut works', 'Views mutable bytes as a &mut str, if they are valid UTF-8.', {
  rows: [['[104, 105]']], call: 'std::str::from_utf8_mut(&mut bytes)?.make_ascii_uppercase()', note: 'edit as text', outs: ['bytes = b"HI"'],
  intro: 'The bytes are checked once, then edited as a string.',
  steps: [['Valid UTF-8: you get &mut str.', 0], ['Upper-casing changes the bytes.', [], 'o0']],
  result: '"HI"', resultCap: 'Err if the bytes are not valid UTF-8.',
}, 'let mut b = [104u8, 105]; std::str::from_utf8_mut(&mut b).unwrap().make_ascii_uppercase(); d(std::str::from_utf8(&b).unwrap())');

add('str/utf8_chunks', 'utf8_chunks', ['core', '', /str\/lossy\.rs$/], 'How utf8_chunks works', 'Splits bytes into valid text pieces and the invalid bytes between them.', {
  rows: [['b"ab\\xFFcd"']], call: 'for c in bytes.utf8_chunks() { c.valid(); c.invalid(); }', note: 'repair broken text', outs: ['("ab", [255])', '("cd", [])'],
  intro: 'Each chunk has a valid part and the invalid bytes right after it.',
  steps: [['"ab", then the bad byte 255.', 0, 'o0'], ['"cd" with nothing invalid.', 0, 'o1']],
  result: '[("ab", [255]), ("cd", [])]', resultCap: 'from_utf8_lossy is built on this.',
}, 'let v: Vec<(&str, &[u8])> = b"ab\\xFFcd".utf8_chunks().map(|c| (c.valid(), c.invalid())).collect(); d(v)');

add('utf8_chunk/valid', 'valid', LOSSY('Utf8Chunk'), 'How Utf8Chunk::valid works', 'The valid UTF-8 text at the start of a chunk.', {
  rows: [['chunk of b"hi\\xC0"']], call: 'chunk.valid()', note: 'the good part', outs: ['"hi"'],
  intro: 'Everything up to the first invalid byte.',
  steps: [['h and i are valid.', 0], ['"hi".', [], 'o0']],
  result: '"hi"', resultCap: 'invalid() gives the broken bytes after it.',
}, 'd(b"hi\\xC0".utf8_chunks().next().unwrap().valid())');

add('utf8_chunk/invalid', 'invalid', LOSSY('Utf8Chunk'), 'How Utf8Chunk::invalid works', 'The invalid bytes that end a chunk.', {
  rows: [['chunk of b"hi\\xC0"']], call: 'chunk.invalid()', note: 'the broken part', outs: ['[192]'],
  intro: '0xC0 can never appear in valid UTF-8.',
  steps: [['After "hi" comes 0xC0.', 0], ['[192].', [], 'o0']],
  result: '[192]', resultCap: 'Replace it with � or report its position.',
}, 'd(b"hi\\xC0".utf8_chunks().next().unwrap().invalid())');

add('utf8_error/valid_up_to', 'valid_up_to', U8E, 'How Utf8Error::valid_up_to works', 'How many bytes at the start are valid UTF-8.', {
  rows: [['b"abc\\xFF"']], call: 'std::str::from_utf8(b).unwrap_err().valid_up_to()', note: 'the usable prefix', outs: ['3'],
  intro: 'Bytes 0..3 are fine.',
  steps: [['a, b, c are valid.', 0], ['The error starts at 3.', [], 'o0']],
  result: '3', resultCap: 'Safe to use &bytes[..3] as text.',
}, 'std::str::from_utf8(b"abc\\xFF").unwrap_err().valid_up_to().to_string()');

add('utf8_error/error_len', 'error_len', U8E, 'How Utf8Error::error_len works', 'How many bytes are invalid; None if the input just ended too early.', {
  rows: [['b"a\\xFF"', 'b"a\\xC3"']], call: 'err.error_len()', note: 'broken vs. cut off', outs: ['Some(1)', 'None'],
  intro: '0xFF is always invalid; 0xC3 is a valid start that needs another byte.',
  steps: [['0xFF: one bad byte.', 0, 'o0'], ['0xC3 at the end: maybe more bytes are coming, None.', 1, 'o1']],
  result: 'Some(1), None', resultCap: 'None matters when reading a stream in pieces.',
}, 'format!("{:?}, {:?}", std::str::from_utf8(b"a\\xFF").unwrap_err().error_len(), std::str::from_utf8(b"a\\xC3").unwrap_err().error_len())');

add('char_indices/as_str', 'as_str', ['core', 'CharIndices', /str\/iter\.rs$/], 'How CharIndices::as_str works', 'The text not yet visited by char_indices().', {
  rows: [['"abc"']], call: 'it.next(); it.as_str()', note: 'what is left', outs: ['"bc"'],
  intro: 'Like Chars::as_str.',
  steps: [["(0, 'a') was taken.", 0], ['"bc" remains.', [], 'o0']],
  result: '"bc"', resultCap: 'No copy: it borrows from the original.',
}, 'let mut it = "abc".char_indices(); it.next(); d(it.as_str())');

// ---------------------------------------------------------------- slices (part 1)

add('slice/split_first_mut', 'split_first_mut', SLICE, 'How slice::split_first_mut works', 'The first element and the rest, both mutable.', {
  rows: [nums([1, 2, 3])], call: 'let (head, rest) = v.split_first_mut().unwrap(); *head += 2;', note: 'two &mut at once', outs: ['3', '2', '3'],
  intro: 'head and rest do not overlap, so both can be changed.',
  steps: [['head = 1, rest = [2, 3].', [0, 1, 2]], ['head becomes 1 + 2 = 3.', 0, 'o0,1,2']],
  result: '[3, 2, 3]', resultCap: 'None for an empty slice.',
}, 'let mut v = [1, 2, 3]; let (h, rest) = v.split_first_mut().unwrap(); *h += rest.len() as i32; d(v)');

add('slice/split_last_mut', 'split_last_mut', SLICE, 'How slice::split_last_mut works', 'The last element and everything before it, both mutable.', {
  rows: [nums([1, 2, 3])], call: 'let (last, init) = v.split_last_mut().unwrap(); *last = init.iter().sum();', note: 'tail and the rest', outs: ['1', '2', '3'],
  intro: 'Here last becomes the sum of the others: 1 + 2 = 3.',
  steps: [['last = 3, init = [1, 2].', [0, 1, 2]], ['last = 1 + 2.', 2, 'o0,1,2']],
  result: '[1, 2, 3]', resultCap: 'None for an empty slice.',
}, 'let mut v = [1, 2, 0]; let (l, init) = v.split_last_mut().unwrap(); *l = init.iter().sum(); d(v)');

add('slice/split_at_checked', 'split_at_checked', SLICE, 'How slice::split_at_checked works', 'split_at that returns None instead of panicking.', {
  rows: [['[1, 2] at 1', '[1, 2] at 5']], call: 'v.split_at_checked(i)', note: 'safe split', outs: ['Some(([1], [2]))', 'None'],
  intro: 'Out-of-range indexes give None.',
  steps: [['At 1: two halves.', 0, 'o0'], ['At 5: None.', 1, 'o1']],
  result: 'Some(([1], [2])), None', resultCap: 'split_at_mut_checked is the mutable version.',
}, 'let v = [1, 2]; format!("{:?}, {:?}", v.split_at_checked(1), v.split_at_checked(5))');

add('slice/split_at_mut_checked', 'split_at_mut_checked', SLICE, 'How slice::split_at_mut_checked works', 'split_at_mut that returns None instead of panicking.', {
  rows: [nums([1, 2, 3])], call: 'if let Some((a, b)) = v.split_at_mut_checked(1) { a[0] = b[1]; }', note: 'safe mutable split', outs: ['3', '2', '3'],
  intro: 'Two mutable halves, or None.',
  steps: [['a = [1], b = [2, 3].', [0, 1, 2]], ['a[0] = b[1] = 3.', 0, 'o0,1,2']],
  result: '[3, 2, 3]', resultCap: 'None when the index is past the end.',
}, 'let mut v = [1, 2, 3]; if let Some((a, b)) = v.split_at_mut_checked(1) { a[0] = b[1]; } d(v)');

add('slice/split_inclusive_mut', 'split_inclusive_mut', SLICE, 'How slice::split_inclusive_mut works', 'Mutable pieces that each end with their separator.', {
  rows: [nums([1, 0, 2, 0])], call: 'for p in v.split_inclusive_mut(|x| *x == 0) { p[0] += 10; }', note: 'edit each piece', outs: ['11', '0', '12', '0'],
  intro: 'Pieces: [1, 0] and [2, 0].',
  steps: [['Each piece\'s first element gets + 10.', [0, 2]], ['[11, 0, 12, 0].', [], 'o0,1,2,3']],
  result: '[11, 0, 12, 0]', resultCap: 'The read-only version is split_inclusive.',
}, 'let mut v = [1, 0, 2, 0]; for p in v.split_inclusive_mut(|x| *x == 0) { p[0] += 10; } d(v)');

add('slice/rsplit_mut', 'rsplit_mut', SLICE, 'How slice::rsplit_mut works', 'Mutable pieces between separators, from the end.', {
  rows: [nums([1, 0, 2])], call: 'if let Some(last) = v.rsplit_mut(|x| *x == 0).next() { last[0] = 9; }', note: 'edit the last piece', outs: ['1', '0', '9'],
  intro: 'The first piece yielded is the last one.',
  steps: [['The last piece is [2].', 2], ['It becomes [9].', [], 'o0,1,2']],
  result: '[1, 0, 9]', resultCap: 'rsplit is the read-only version.',
}, 'let mut v = [1, 0, 2]; if let Some(last) = v.rsplit_mut(|x| *x == 0).next() { last[0] = 9; } d(v)');

add('slice/splitn_mut', 'splitn_mut', SLICE, 'How slice::splitn_mut works', 'Mutable pieces between separators, at most n of them.', {
  rows: [nums([1, 0, 2, 0, 3])], call: 'for p in v.splitn_mut(2, |x| *x == 0) { p.reverse(); }', note: 'one cut only', outs: ['1', '0', '3', '0', '2'],
  intro: 'Pieces: [1] and [2, 0, 3].',
  steps: [['[1] reversed is [1].', 0], ['[2, 0, 3] reversed is [3, 0, 2].', [2, 3, 4], 'o0,1,2,3,4']],
  result: '[1, 0, 3, 0, 2]', resultCap: 'rsplitn_mut counts the cuts from the end.',
}, 'let mut v = [1, 0, 2, 0, 3]; for p in v.splitn_mut(2, |x| *x == 0) { p.reverse(); } d(v)');

add('slice/rsplitn_mut', 'rsplitn_mut', SLICE, 'How slice::rsplitn_mut works', 'Mutable pieces from the end, at most n of them.', {
  rows: [nums([1, 0, 2, 0, 3])], call: 'for p in v.rsplitn_mut(2, |x| *x == 0) { p[0] *= 10; }', note: 'cut at the last separator', outs: ['10', '0', '2', '0', '30'],
  intro: 'Pieces: [3] and [1, 0, 2].',
  steps: [['[3] → [30].', 4], ['[1, 0, 2] → first element × 10.', [0, 1, 2], 'o0,1,2,3,4']],
  result: '[10, 0, 2, 0, 30]', resultCap: 'The read-only version is rsplitn.',
}, 'let mut v = [1, 0, 2, 0, 3]; for p in v.rsplitn_mut(2, |x| *x == 0) { p[0] *= 10; } d(v)');

add('slice/rchunks_mut', 'rchunks_mut', SLICE, 'How slice::rchunks_mut works', 'Mutable chunks counted from the end.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'for c in v.rchunks_mut(2) { c.reverse(); }', note: 'right-aligned groups', outs: ['1', '3', '2', '5', '4'],
  intro: 'Chunks are [4, 5], [2, 3], then [1].',
  steps: [['[4, 5] and [2, 3] are reversed.', [1, 2, 3, 4]], ['[1] stays.', 0, 'o0,1,2,3,4']],
  result: '[1, 3, 2, 5, 4]', resultCap: 'rchunks is the read-only version.',
}, 'let mut v = [1, 2, 3, 4, 5]; for c in v.rchunks_mut(2) { c.reverse(); } d(v)');

add('slice/rchunks_exact_mut', 'rchunks_exact_mut', SLICE, 'How slice::rchunks_exact_mut works', 'Full mutable chunks from the end; the leftover at the start is skipped.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'for c in v.rchunks_exact_mut(2) { c[0] = 0; }', note: 'full chunks only', outs: ['1', '0', '3', '0', '5'],
  intro: 'Chunks [4, 5] and [2, 3]; 1 is left over.',
  steps: [['First element of each chunk becomes 0.', [1, 3]], ['1 is untouched.', 0, 'o0,1,2,3,4']],
  result: '[1, 0, 3, 0, 5]', resultCap: 'into_remainder gives the leftover part.',
}, 'let mut v = [1, 2, 3, 4, 5]; for c in v.rchunks_exact_mut(2) { c[0] = 0; } d(v)');

add('slice/chunk_by_mut', 'chunk_by_mut', SLICE, 'How slice::chunk_by_mut works', 'Mutable runs of neighbours that pass a test.', {
  rows: [nums([1, 1, 2, 2, 2])], call: 'for run in v.chunk_by_mut(|a, b| a == b) { run.fill(run.len() as i32); }', note: 'edit each run', outs: ['2', '2', '3', '3', '3'],
  intro: 'Runs: [1, 1] and [2, 2, 2]; each is filled with its length.',
  steps: [['[1, 1] → [2, 2].', [0, 1]], ['[2, 2, 2] → [3, 3, 3].', [2, 3, 4], 'o0,1,2,3,4']],
  result: '[2, 2, 3, 3, 3]', resultCap: 'chunk_by is the read-only version.',
}, 'let mut v = [1, 1, 2, 2, 2]; for run in v.chunk_by_mut(|a, b| a == b) { let n = run.len() as i32; run.fill(n); } d(v)');

add('slice/is_sorted_by', 'is_sorted_by', SLICE, 'How slice::is_sorted_by works', 'Checks the order of neighbours with your own rule.', {
  rows: [['"b"', '"B"', '"c"']], call: 'v.is_sorted_by(|a, b| a.to_lowercase() <= b.to_lowercase())', note: 'case-insensitive order', outs: ['true'],
  intro: 'The closure says whether a may come before b.',
  steps: [['b ≤ B ≤ c ignoring case.', [0, 1, 2]], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Plain is_sorted would say false: "b" > "B".',
}, '["b", "B", "c"].is_sorted_by(|a, b| a.to_lowercase() <= b.to_lowercase()).to_string()');

add('slice/is_sorted_by_key', 'is_sorted_by_key', SLICE, 'How slice::is_sorted_by_key works', 'Checks that a key from each element never decreases.', {
  rows: [['-1', '2', '-3']], call: 'v.is_sorted_by_key(|x: &i32| x.abs())', note: 'by size', outs: ['true'],
  intro: 'Keys: 1, 2, 3.',
  steps: [['Absolute values 1, 2, 3.', [0, 1, 2]], ['Ascending: true.', [], 'o0']],
  result: 'true', resultCap: 'Pair with sort_by_key in tests.',
}, '[-1i32, 2, -3].is_sorted_by_key(|x: &i32| x.abs()).to_string()');

add('slice/last_chunk', 'last_chunk', SLICE, 'How slice::last_chunk works', 'The last N elements as a fixed-size array.', {
  rows: [nums([1, 2, 3, 4])], call: 'v.last_chunk::<2>()', note: '&[T; N] or None', outs: ['Some([3, 4])'],
  intro: 'The compiler knows the result has exactly N elements.',
  steps: [['At least 2 elements exist.', [2, 3]], ['Some(&[3, 4]).', [], 'o0']],
  result: 'Some([3, 4])', resultCap: 'first_chunk takes them from the start.',
}, 'd([1, 2, 3, 4].last_chunk::<2>())');

add('slice/first_chunk_mut', 'first_chunk_mut', SLICE, 'How slice::first_chunk_mut works', 'The first N elements as a mutable array.', {
  rows: [nums([1, 2, 3])], call: 'if let Some(head) = v.first_chunk_mut::<2>() { head.swap(0, 1); }', note: 'fixed-size, mutable', outs: ['2', '1', '3'],
  intro: 'Gives &mut [T; N], so array methods work.',
  steps: [['head = [1, 2].', [0, 1]], ['Swapped: [2, 1].', [], 'o0,1,2']],
  result: '[2, 1, 3]', resultCap: 'last_chunk_mut works at the end.',
}, 'let mut v = [1, 2, 3]; if let Some(h) = v.first_chunk_mut::<2>() { h.swap(0, 1); } d(v)');

add('slice/split_last_chunk', 'split_last_chunk', SLICE, 'How slice::split_last_chunk works', 'Everything before, plus the last N elements as an array.', {
  rows: [['b"data", checksum 0xAB']], call: 'let (body, crc) = msg.split_last_chunk::<1>().unwrap();', note: 'a trailer', outs: ['body [1, 2]', 'crc [171]'],
  intro: 'Good for formats that end with a fixed-size trailer.',
  steps: [['The body is everything before.', 0, 'o0'], ['The last byte is the trailer.', 0, 'o1']],
  result: '[1, 2], [171]', resultCap: 'None if the slice is shorter than N.',
}, 'let m = [1u8, 2, 0xAB]; let (b, c) = m.split_last_chunk::<1>().unwrap(); format!("{:?}, {:?}", b, c)');

add('slice/as_rchunks', 'as_rchunks', SLICE, 'How slice::as_rchunks works', 'A remainder at the start, then arrays of N elements.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'let (rest, pairs) = v.as_rchunks::<2>();', note: 'right-aligned arrays', outs: ['rest [1]', 'pairs [[2, 3], [4, 5]]'],
  intro: 'Chunks are counted from the end.',
  steps: [['1 is the leftover.', 0, 'o0'], ['[2, 3] and [4, 5] are full arrays.', [1, 2, 3, 4], 'o1']],
  result: '[1], [[2, 3], [4, 5]]', resultCap: 'as_chunks puts the remainder at the end.',
}, 'let (r, p) = [1, 2, 3, 4, 5].as_rchunks::<2>(); format!("{:?}, {:?}", r, p)');

add('slice/as_flattened', 'as_flattened', SLICE, 'How slice::as_flattened works', 'Views a slice of arrays as one flat slice.', {
  rows: [['[1, 2]', '[3, 4]']], call: 'grid.as_flattened()', note: '&[[T; N]] → &[T]', outs: ['[1, 2, 3, 4]'],
  intro: 'No copying: the memory already lies flat.',
  steps: [['Two rows of 2.', [0, 1]], ['One slice of 4.', [], 'o0']],
  result: '[1, 2, 3, 4]', resultCap: 'as_flattened_mut is the mutable version.',
}, 'let g = [[1, 2], [3, 4]]; d(g.as_flattened())');

add('slice/make_ascii_lowercase', 'make_ascii_lowercase', ASCII, 'How [u8]::make_ascii_lowercase works', 'Lower-cases ASCII letters in a byte slice, in place.', {
  rows: [['b"HTTP/1.1"']], call: 'buf.make_ascii_lowercase()', note: 'no allocation', outs: ['b"http/1.1"'],
  intro: 'Only A–Z change.',
  steps: [['H, T, T, P become small.', 0], ['Digits and / stay.', [], 'o0']],
  result: '"http/1.1"', resultCap: 'to_ascii_lowercase returns a new Vec instead.',
}, 'let mut b = *b"HTTP/1.1"; b.make_ascii_lowercase(); d(std::str::from_utf8(&b).unwrap())');

module.exports = list;
