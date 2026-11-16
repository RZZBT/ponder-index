// Rust standard library: slice iterator accessors and mutable chunk helpers, arrays, the remaining char and u8
// ASCII methods, bool::ok_or, and ops (ControlFlow, Bound, contains on open ranges).
const { group, nums } = require('./kit.cjs');
const SLICE = ['core', '', /slice\/mod\.rs$/];
const SITER = (o) => ['core', o, /slice\/iter\.rs$/];
const ASCII = ['core', '', /slice\/ascii\.rs$/];
const ARRAY = ['core', '', /array\/mod\.rs$/];
const CHAR = ['core', 'char', /char\/methods\.rs$/];
const U8 = ['core', 'u8', /num\/mod\.rs$/];
const BOOL = ['core', 'bool', /^src\/bool\.rs$/];
const CF = ['core', 'ControlFlow', /ops\/control_flow\.rs$/];
const BOUND = ['core', 'Bound', /ops\/range\.rs$/];
const { list, add } = group({ at: SLICE });
const CFU = 'use std::ops::ControlFlow; ';

// ---------------------------------------------------------------- slice iterators and chunks

add('slice_iter/as_slice', 'as_slice', SITER('Iter'), 'How slice::Iter::as_slice works', 'The part of the slice the iterator has not reached yet.', {
  rows: [nums([1, 2, 3])], call: 'let mut it = v.iter(); it.next(); it.as_slice()', note: 'what is left', outs: ['[2, 3]'],
  intro: 'Borrowed straight from the original slice.',
  steps: [['1 was taken.', 0, 'x'], ['[2, 3] remain.', [1, 2], 'o0']],
  result: '[2, 3]', resultCap: 'Useful in hand-written parsers.',
}, 'let v = [1, 2, 3]; let mut it = v.iter(); it.next(); d(it.as_slice())');

add('slice_iter_mut/into_slice', 'into_slice', SITER('IterMut'), 'How slice::IterMut::into_slice works', 'Turns the iterator into a mutable slice of what is left.', {
  rows: [nums([1, 2, 3])], call: 'let mut it = v.iter_mut(); it.next(); it.into_slice()[0] = 9;', note: 'edit the rest', outs: ['1', '9', '3'],
  intro: 'The iterator is consumed; you get &mut to the remaining part.',
  steps: [['1 was taken.', 0], ['The rest starts at 2, which becomes 9.', 1, 'o0,1,2']],
  result: '[1, 9, 3]', resultCap: 'as_slice only borrows the rest immutably.',
}, 'let mut v = [1, 2, 3]; let mut it = v.iter_mut(); it.next(); it.into_slice()[0] = 9; d(v)');

add('slice_iter_mut/as_slice', 'as_slice', SITER('IterMut'), 'How slice::IterMut::as_slice works', 'Looks at the remaining elements of a mutable iterator.', {
  rows: [nums([5, 6])], call: 'let mut it = v.iter_mut(); it.next(); it.as_slice()', note: 'peek, read-only', outs: ['[6]'],
  intro: 'A shared view of what has not been handed out yet.',
  steps: [['5 was handed out.', 0], ['[6] remains.', 1, 'o0']],
  result: '[6]', resultCap: 'The iterator can still be used afterwards.',
}, 'let mut v = [5, 6]; let mut it = v.iter_mut(); it.next(); d(it.as_slice())');

add('chunks_exact/remainder', 'remainder', SITER('ChunksExact'), 'How ChunksExact::remainder works', 'The leftover elements that do not fill a whole chunk.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.chunks_exact(2).remainder()', note: 'the tail', outs: ['[5]'],
  intro: 'chunks_exact skips the short piece; remainder hands it to you.',
  steps: [['[1, 2] and [3, 4] are full.', [0, 1, 2, 3]], ['[5] is the remainder.', 4, 'o0']],
  result: '[5]', resultCap: 'Process full blocks fast, then handle the tail separately.',
}, 'd([1, 2, 3, 4, 5].chunks_exact(2).remainder())');

add('rchunks_exact/remainder', 'remainder', SITER('RChunksExact'), 'How RChunksExact::remainder works', 'The leftover at the start when chunking from the end.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.rchunks_exact(2).remainder()', note: 'the head', outs: ['[1]'],
  intro: 'Full chunks are taken from the right, so the start is left over.',
  steps: [['[4, 5] and [2, 3] are full.', [1, 2, 3, 4]], ['[1] is the remainder.', 0, 'o0']],
  result: '[1]', resultCap: 'Digit grouping: the first group may be short.',
}, 'd([1, 2, 3, 4, 5].rchunks_exact(2).remainder())');

add('chunks_exact_mut/into_remainder', 'into_remainder', SITER('ChunksExactMut'), 'How ChunksExactMut::into_remainder works', 'A mutable reference to the leftover elements.', {
  rows: [nums([1, 2, 3])], call: 'v.chunks_exact_mut(2).into_remainder()[0] = 0;', note: 'edit the tail', outs: ['1', '2', '0'],
  intro: 'The iterator is consumed and gives &mut to the tail.',
  steps: [['The remainder is [3].', 2], ['It becomes 0.', [], 'o0,1,2']],
  result: '[1, 2, 0]', resultCap: 'remainder() would only lend it immutably.',
}, 'let mut v = [1, 2, 3]; v.chunks_exact_mut(2).into_remainder()[0] = 0; d(v)');

add('slice/as_chunks_mut', 'as_chunks_mut', SLICE, 'How slice::as_chunks_mut works', 'Mutable arrays of N elements, plus a mutable remainder.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'let (pairs, _) = v.as_chunks_mut::<2>(); for p in pairs { p.swap(0, 1); }', note: 'fixed-size, mutable', outs: ['2', '1', '4', '3', '5'],
  intro: 'Each chunk is a real [T; 2].',
  steps: [['[1, 2] and [3, 4] are swapped.', [0, 1, 2, 3]], ['5 is the untouched remainder.', 4, 'o0,1,2,3,4']],
  result: '[2, 1, 4, 3, 5]', resultCap: 'as_chunks is the read-only version.',
}, 'let mut v = [1, 2, 3, 4, 5]; let (pairs, _) = v.as_chunks_mut::<2>(); for p in pairs { p.swap(0, 1); } d(v)');

add('slice/as_flattened_mut', 'as_flattened_mut', SLICE, 'How slice::as_flattened_mut works', 'Views a slice of arrays as one flat mutable slice.', {
  rows: [['[1, 2]', '[3, 4]']], call: 'grid.as_flattened_mut().fill(0);', note: 'edit all at once', outs: ['[[0, 0], [0, 0]]'],
  intro: 'No copying; the rows are already laid out flat.',
  steps: [['The two rows become one slice of 4.', [0, 1]], ['All are set to 0.', [], 'o0']],
  result: '[[0, 0], [0, 0]]', resultCap: 'Handy for clearing image or matrix data.',
}, 'let mut g = [[1, 2], [3, 4]]; g.as_flattened_mut().fill(0); d(g)');

add('slice/last_chunk_mut', 'last_chunk_mut', SLICE, 'How slice::last_chunk_mut works', 'The last N elements as a mutable array.', {
  rows: [nums([1, 2, 3])], call: 'if let Some(t) = v.last_chunk_mut::<2>() { t.reverse(); }', note: 'fixed-size tail', outs: ['1', '3', '2'],
  intro: 'None if the slice is shorter than N.',
  steps: [['The tail is [2, 3].', [1, 2]], ['Reversed: [3, 2].', [], 'o0,1,2']],
  result: '[1, 3, 2]', resultCap: 'first_chunk_mut works at the start.',
}, 'let mut v = [1, 2, 3]; if let Some(t) = v.last_chunk_mut::<2>() { t.reverse(); } d(v)');

add('slice/split_first_chunk_mut', 'split_first_chunk_mut', SLICE, 'How slice::split_first_chunk_mut works', 'The first N elements as a mutable array, and the mutable rest.', {
  rows: [nums([0, 0, 7, 8])], call: 'let (h, body) = v.split_first_chunk_mut::<2>().unwrap();', note: 'write a header', outs: ['2', '0', '7', '8'],
  intro: 'Header and body can be changed separately.',
  steps: [['h = [0, 0], body = [7, 8].', [0, 1, 2, 3]], ['The header records the body length.', 0, 'o0,1,2,3']],
  result: '[2, 0, 7, 8]', resultCap: 'Useful for binary formats with a length prefix.',
}, 'let mut v = [0, 0, 7, 8]; let (h, body) = v.split_first_chunk_mut::<2>().unwrap(); h[0] = body.len() as i32; d(v)');

add('slice/split_last_chunk_mut', 'split_last_chunk_mut', SLICE, 'How slice::split_last_chunk_mut works', 'The mutable rest, and the last N elements as a mutable array.', {
  rows: [nums([3, 4, 0])], call: 'let (body, t) = v.split_last_chunk_mut::<1>().unwrap();', note: 'write a trailer', outs: ['3', '4', '7'],
  intro: 'Here the trailer becomes a checksum of the body.',
  steps: [['body = [3, 4], trailer = [0].', [0, 1, 2]], ['trailer = 3 + 4 = 7.', 2, 'o0,1,2']],
  result: '[3, 4, 7]', resultCap: 'None if the slice is too short.',
}, 'let mut v = [3, 4, 0]; let (body, t) = v.split_last_chunk_mut::<1>().unwrap(); t[0] = body.iter().sum(); d(v)');

add('slice/array_windows', 'array_windows', SLICE, 'How slice::array_windows works', 'Overlapping windows as fixed-size arrays.', {
  rows: [nums([1, 2, 4])], call: 'v.array_windows().map(|[a, b]| b - a)', note: '&[T; N] windows', outs: ['1', '2'],
  intro: 'Like windows(2), but each window is a [T; 2] you can destructure.',
  steps: [['[1, 2] → 1.', [0, 1], 'o0'], ['[2, 4] → 2.', [1, 2], 'o1']],
  result: '[1, 2]', resultCap: 'The size N is inferred from the pattern.',
}, 'd([1, 2, 4].array_windows().map(|[a, b]| b - a).collect::<Vec<i32>>())');

add('slice/trim_ascii_start', 'trim_ascii_start', ASCII, 'How [u8]::trim_ascii_start works', 'Removes ASCII whitespace from the start of a byte slice.', {
  rows: [['b"  x "']], call: 'bytes.trim_ascii_start()', note: 'left side only', outs: ['b"x "'],
  intro: 'The trailing space stays.',
  steps: [['Two leading spaces go.', 0], ['"x " remains.', [], 'o0']],
  result: '"x "', resultCap: 'trim_ascii does both sides.',
}, 'd(std::str::from_utf8(b"  x ".trim_ascii_start()).unwrap())');

add('slice/trim_ascii_end', 'trim_ascii_end', ASCII, 'How [u8]::trim_ascii_end works', 'Removes ASCII whitespace from the end of a byte slice.', {
  rows: [['b"x \\n"']], call: 'bytes.trim_ascii_end()', note: 'right side only', outs: ['b"x"'],
  intro: 'Strips trailing spaces and newlines.',
  steps: [['" \\n" goes.', 0], ['"x" remains.', [], 'o0']],
  result: '"x"', resultCap: 'Handy after reading a line as bytes.',
}, 'd(std::str::from_utf8(b"x \\n".trim_ascii_end()).unwrap())');

add('slice/from_ref', 'from_ref', ['core', '', /slice\/raw\.rs$/], 'How slice::from_ref works', 'Turns a reference to one value into a slice of length 1.', {
  rows: [['&5']], call: 'std::slice::from_ref(&x)', note: '&T → &[T]', outs: ['[5]'],
  intro: 'No copy: the slice points at the same value.',
  steps: [['One value.', 0], ['A slice holding it.', [], 'o0']],
  result: '[5]', resultCap: 'Pass a single value to a function that wants a slice.',
}, 'let x = 5; d(std::slice::from_ref(&x))');

add('slice/from_mut', 'from_mut', ['core', '', /slice\/raw\.rs$/], 'How slice::from_mut works', 'Turns a mutable reference to one value into a mutable slice of length 1.', {
  rows: [['x = 1']], call: 'std::slice::from_mut(&mut x)[0] = 2;', note: '&mut T → &mut [T]', outs: ['x = 2'],
  intro: 'Changes go to x itself.',
  steps: [['The slice points at x.', 0], ['Writing index 0 changes x.', [], 'o0']],
  result: '2', resultCap: 'Rarely needed, but avoids building a Vec.',
}, 'let mut x = 1; std::slice::from_mut(&mut x)[0] = 2; x.to_string()');

// ---------------------------------------------------------------- arrays

add('array/from_ref', 'from_ref', ARRAY, 'How array::from_ref works', 'Turns a reference to one value into a reference to a 1-element array.', {
  rows: [['&"x"']], call: 'std::array::from_ref(&s)', note: '&T → &[T; 1]', outs: ['["x"]'],
  intro: 'No copy is made.',
  steps: [['One value.', 0], ['An array of one.', [], 'o0']],
  result: '["x"]', resultCap: 'array::from_mut is the mutable version.',
}, 'let s = "x"; d(std::array::from_ref(&s))');

add('array/from_mut', 'from_mut', ARRAY, 'How array::from_mut works', 'Turns &mut T into &mut [T; 1].', {
  rows: [['x = 3']], call: 'std::array::from_mut(&mut x)[0] *= 2;', note: 'same value', outs: ['x = 6'],
  intro: 'Writing through the array changes x.',
  steps: [['The array wraps x.', 0], ['x becomes 6.', [], 'o0']],
  result: '6', resultCap: 'Pairs with array::from_ref.',
}, 'let mut x = 3; std::array::from_mut(&mut x)[0] *= 2; x.to_string()');

add('array/as_mut_slice', 'as_mut_slice', ARRAY, 'How array::as_mut_slice works', 'Views a fixed-size array as a mutable slice.', {
  rows: [nums([3, 1, 2])], call: 'arr.as_mut_slice().sort();', note: '[T; N] → &mut [T]', outs: ['1', '2', '3'],
  intro: 'Slice methods like sort then work on the array.',
  steps: [['The array is lent as a slice.', [0, 1, 2]], ['Sorted in place.', [], 'o0,1,2']],
  result: '[1, 2, 3]', resultCap: '&mut arr[..] does the same.',
}, 'let mut a = [3, 1, 2]; a.as_mut_slice().sort(); d(a)');

add('array_into_iter/as_slice', 'as_slice', ['core', 'IntoIter', /array\/iter\.rs$/], 'How array::IntoIter::as_slice works', 'The elements of an array iterator not yet taken.', {
  rows: [['["a", "b", "c"]']], call: 'let mut it = arr.into_iter(); it.next(); it.as_slice()', note: 'what is left', outs: ['["b", "c"]'],
  intro: 'Arrays iterate by value since Rust 2021.',
  steps: [['"a" was taken.', 0], ['["b", "c"] remain.', [], 'o0']],
  result: '["b", "c"]', resultCap: 'as_mut_slice allows changing them first.',
}, 'let mut it = ["a", "b", "c"].into_iter(); it.next(); d(it.as_slice())');

add('array_into_iter/as_mut_slice', 'as_mut_slice', ['core', 'IntoIter', /array\/iter\.rs$/], 'How array::IntoIter::as_mut_slice works', 'Changes the elements an array iterator has not handed out yet.', {
  rows: [nums([1, 2])], call: 'it.as_mut_slice()[0] = 10; it.next()', note: 'edit before taking', outs: ['Some(10)'],
  intro: 'The remaining elements live inside the iterator.',
  steps: [['The next element becomes 10.', 0], ['next() returns it.', [], 'o0']],
  result: 'Some(10)', resultCap: 'Rarely needed.',
}, 'let mut it = [1, 2].into_iter(); it.as_mut_slice()[0] = 10; d(it.next())');

// ---------------------------------------------------------------- char

add('char/decode_utf16', 'decode_utf16', CHAR, 'How char::decode_utf16 works', 'Decodes UTF-16 units into chars, reporting broken units as errors.', {
  rows: [['72', '0xD800', '105']], call: 'char::decode_utf16(units).map(|r| r.unwrap_or(\'?\'))', note: 'per-char results', outs: ["'H'", "'?'", "'i'"],
  intro: 'Each item is Ok(char) or Err for an unpaired surrogate.',
  steps: [["72 → 'H'.", 0, 'o0'], ['A lone surrogate → Err, shown as ?.', 1, 'o1'], ["105 → 'i'.", 2, 'o2']],
  result: '"H?i"', resultCap: 'String::from_utf16 does the whole thing at once.',
}, 'd(char::decode_utf16([72u16, 0xD800, 105]).map(|r| r.unwrap_or(\'?\')).collect::<String>())');

add('decode_utf16_error/unpaired_surrogate', 'unpaired_surrogate', ['core', 'DecodeUtf16Error', /char\/decode\.rs$/], 'How DecodeUtf16Error::unpaired_surrogate works', 'The broken UTF-16 unit that caused the error.', {
  rows: [['0xDC00 alone']], call: 'err.unpaired_surrogate()', note: 'which unit?', outs: ['0xdc00'],
  intro: 'A low surrogate without a high one before it is invalid.',
  steps: [['Decoding fails.', 0], ['The error reports 0xDC00.', [], 'o0']],
  result: '0xdc00', resultCap: 'Useful in error messages.',
}, 'let e = char::decode_utf16([0xDC00u16]).next().unwrap().unwrap_err(); format!("{:#x}", e.unpaired_surrogate())');

add('char/encode_utf16', 'encode_utf16', CHAR, 'How char::encode_utf16 works', 'Writes the char\'s UTF-16 units into a buffer.', {
  rows: [["'🦀'"]], call: "'🦀'.encode_utf16(&mut buf)", note: 'buf: [u16; 2]', outs: ['55358', '56704'],
  intro: 'Characters beyond U+FFFF need two units.',
  steps: [['High surrogate 55358.', 0, 'o0'], ['Low surrogate 56704.', 0, 'o1']],
  result: '[55358, 56704]', resultCap: 'len_utf16() tells how many units in advance.',
}, 'let mut b = [0u16; 2]; d(\'🦀\'.encode_utf16(&mut b))');

add('char/escape_debug', 'escape_debug', CHAR, 'How char::escape_debug works', 'The char as {:?} would show it, minus the quotes.', {
  rows: [["'\\n'", "'é'"]], call: 'c.escape_debug().to_string()', note: 'escape only what is needed', outs: ['\\n', 'é'],
  intro: 'Invisible characters are escaped; printable Unicode is kept.',
  steps: [['Newline → \\n.', 0, 'o0'], ['é stays é.', 1, 'o1']],
  result: '\\n, é', resultCap: 'escape_default escapes é too.',
}, 'format!("{}, {}", \'\\n\'.escape_debug(), \'é\'.escape_debug())');

add('char/escape_default', 'escape_default', CHAR, 'How char::escape_default works', 'The char with everything outside printable ASCII escaped.', {
  rows: [["'\\t'", "'é'"]], call: 'c.escape_default().to_string()', note: 'pure ASCII output', outs: ['\\t', '\\u{e9}'],
  intro: 'Like Rust source code escapes.',
  steps: [['Tab → \\t.', 0, 'o0'], ['é → \\u{e9}.', 1, 'o1']],
  result: '\\t, \\u{e9}', resultCap: 'Safe for ASCII-only output.',
}, 'format!("{}, {}", \'\\t\'.escape_default(), \'é\'.escape_default())');

add('char/is_ascii', 'is_ascii', CHAR, 'How char::is_ascii works', 'true for characters 0 to 127.', {
  rows: [["'a'", "'é'"]], call: 'c.is_ascii()', note: 'one byte in UTF-8', outs: ['true', 'false'],
  intro: 'ASCII characters take exactly one byte.',
  steps: [["'a': true.", 0, 'o0'], ["'é': false.", 1, 'o1']],
  result: 'true, false', resultCap: 'str::is_ascii checks a whole string.',
}, 'format!("{}, {}", \'a\'.is_ascii(), \'é\'.is_ascii())');

add('char/is_ascii_control', 'is_ascii_control', CHAR, 'How char::is_ascii_control works', 'true for ASCII control codes (0–31 and 127).', {
  rows: [["'\\n'", "'\\x7f'", "' '"]], call: 'c.is_ascii_control()', note: 'not printable', outs: ['true', 'true', 'false'],
  intro: 'Newline, tab and DEL are control codes; space is not.',
  steps: [['\\n and DEL: true.', [0, 1], 'o0,1'], ['Space: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'is_control also covers Unicode controls.',
}, 'format!("{}, {}, {}", \'\\n\'.is_ascii_control(), \'\\x7f\'.is_ascii_control(), \' \'.is_ascii_control())');

add('char/make_ascii_lowercase', 'make_ascii_lowercase', CHAR, 'How char::make_ascii_lowercase works', 'Changes a char variable to its ASCII small letter, in place.', {
  rows: [["c = 'Q'"]], call: 'c.make_ascii_lowercase();', note: 'changes the variable', outs: ["'q'"],
  intro: 'Only A–Z change.',
  steps: [["c holds 'Q'.", 0], ["Now 'q'.", [], 'o0']],
  result: "'q'", resultCap: 'to_ascii_lowercase returns a new char.',
}, 'let mut c = \'Q\'; c.make_ascii_lowercase(); d(c)');

// ---------------------------------------------------------------- u8

add('u8/escape_ascii', 'escape_ascii', U8, 'How u8::escape_ascii works', 'A byte written as readable ASCII, escaping unprintable values.', {
  rows: [["b'a'", "b'\\n'", '0xff']], call: 'b.escape_ascii().to_string()', note: 'for logs', outs: ['a', '\\n', '\\xff'],
  intro: 'Printable bytes stay; others become escapes.',
  steps: [['a stays.', 0, 'o0'], ['Newline → \\n; 0xff → \\xff.', [1, 2], 'o1,2']],
  result: 'a \\n \\xff', resultCap: '[u8]::escape_ascii does a whole slice.',
}, 'format!("{} {} {}", b\'a\'.escape_ascii(), b\'\\n\'.escape_ascii(), 0xffu8.escape_ascii())');

add('u8/is_ascii_control', 'is_ascii_control', U8, 'How u8::is_ascii_control works', 'true for control bytes (0–31 and 127).', {
  rows: [['b\'\\r\'', "b'A'"]], call: 'b.is_ascii_control()', note: 'invisible bytes', outs: ['true', 'false'],
  intro: 'Carriage return is a control code.',
  steps: [['\\r: true.', 0, 'o0'], ['A: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Strip them before printing untrusted data.',
}, 'format!("{}, {}", b\'\\r\'.is_ascii_control(), b\'A\'.is_ascii_control())');

add('u8/is_ascii_graphic', 'is_ascii_graphic', U8, 'How u8::is_ascii_graphic works', 'true for visible ASCII bytes (33–126).', {
  rows: [["b'#'", "b' '"]], call: 'b.is_ascii_graphic()', note: 'prints ink', outs: ['true', 'false'],
  intro: 'Space is printable but not "graphic".',
  steps: [['#: true.', 0, 'o0'], ['Space: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'char::is_ascii_graphic is the char version.',
}, 'format!("{}, {}", b\'#\'.is_ascii_graphic(), b\' \'.is_ascii_graphic())');

add('u8/make_ascii_uppercase', 'make_ascii_uppercase', U8, 'How u8::make_ascii_uppercase works', 'Changes a byte to its ASCII capital, in place.', {
  rows: [["b = b'z'"]], call: 'b.make_ascii_uppercase();', note: 'in place', outs: ["b'Z' (90)"],
  intro: 'Only a–z change.',
  steps: [['b holds z (122).', 0], ['Now Z (90).', [], 'o0']],
  result: '90', resultCap: 'to_ascii_uppercase returns a new byte.',
}, 'let mut b = b\'z\'; b.make_ascii_uppercase(); b.to_string()');

add('u8/make_ascii_lowercase', 'make_ascii_lowercase', U8, 'How u8::make_ascii_lowercase works', 'Changes a byte to its ASCII small letter, in place.', {
  rows: [["b = b'K'"]], call: 'b.make_ascii_lowercase();', note: 'in place', outs: ["b'k' (107)"],
  intro: 'Only A–Z change.',
  steps: [['b holds K (75).', 0], ['Now k (107).', [], 'o0']],
  result: '107', resultCap: 'Pairs with make_ascii_uppercase.',
}, 'let mut b = b\'K\'; b.make_ascii_lowercase(); b.to_string()');

add('ascii/escape_default', 'escape_default', ['core', '', /^src\/ascii\.rs$/], 'How ascii::escape_default works', 'A byte escaped the way Rust writes byte literals.', {
  rows: [["b'\"'", '0x07']], call: 'std::ascii::escape_default(b).to_string()', note: 'byte → escape', outs: ['\\"', '\\x07'],
  intro: 'Quotes and backslashes get a backslash; unprintables become \\x…',
  steps: [['" → \\".', 0, 'o0'], ['0x07 (bell) → \\x07.', 1, 'o1']],
  result: '\\" \\x07', resultCap: 'u8::escape_ascii is the method form.',
}, 'format!("{} {}", std::ascii::escape_default(b\'"\'), std::ascii::escape_default(7))');

// ---------------------------------------------------------------- bool, ops

add('bool/ok_or', 'ok_or', BOOL, 'How bool::ok_or works', 'Ok(()) if true, Err(error) if false.', {
  rows: [['true', 'false']], call: '(age >= 18).ok_or("too young")', note: 'bool → Result', outs: ['Ok(())', 'Err("too young")'],
  intro: 'Turns a check into a Result, so ? can be used.',
  steps: [['true: Ok(()).', 0, 'o0'], ['false: Err.', 1, 'o1']],
  result: 'Ok(()), Err("too young")', resultCap: 'ok_or_else builds the error only when needed.',
}, 'format!("{:?}, {:?}", (20 >= 18).ok_or("too young"), (12 >= 18).ok_or("too young"))');

add('bool/ok_or_else', 'ok_or_else', BOOL, 'How bool::ok_or_else works', 'Ok(()) if true; otherwise Err with an error built by a closure.', {
  rows: [['false']], call: 'valid.ok_or_else(|| format!("bad input: {x}"))', note: 'lazy error', outs: ['Err("bad input: 7")'],
  intro: 'The closure only runs when the bool is false.',
  steps: [['The check failed.', 0], ['The message is built.', [], 'o0']],
  result: 'Err("bad input: 7")', resultCap: 'Good when building the error is costly.',
}, 'let x = 7; d(false.ok_or_else(|| format!("bad input: {}", x)))');

add('control_flow/is_break', 'is_break', CF, 'How ControlFlow::is_break works', 'true for ControlFlow::Break.', {
  rows: [['Break(5)', 'Continue(())']], call: 'cf.is_break()', note: 'stop or go on?', outs: ['true', 'false'],
  intro: 'ControlFlow tells a loop helper whether to stop early.',
  steps: [['Break: true.', 0, 'o0'], ['Continue: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_continue is the opposite.',
}, CFU + 'let a: ControlFlow<i32> = ControlFlow::Break(5); let b: ControlFlow<i32> = ControlFlow::Continue(()); format!("{}, {}", a.is_break(), b.is_break())');

add('control_flow/is_continue', 'is_continue', CF, 'How ControlFlow::is_continue works', 'true for ControlFlow::Continue.', {
  rows: [['Continue(())', 'Break("x")']], call: 'cf.is_continue()', note: 'keep going?', outs: ['true', 'false'],
  intro: 'The opposite of is_break.',
  steps: [['Continue: true.', 0, 'o0'], ['Break: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Returned by try_for_each and try_fold closures.',
}, CFU + 'let a: ControlFlow<&str> = ControlFlow::Continue(()); let b: ControlFlow<&str> = ControlFlow::Break("x"); format!("{}, {}", a.is_continue(), b.is_continue())');

add('control_flow/break_value', 'break_value', CF, 'How ControlFlow::break_value works', 'Some(value) for Break, None for Continue.', {
  rows: [['try_for_each finds 3']], call: 'v.iter().try_for_each(stop_at_big).break_value()', note: 'early-exit search', outs: ['Some(3)'],
  intro: 'A loop that stops with a value, then extracts it.',
  steps: [['1 and 2 continue; 3 breaks.', 0], ['break_value: Some(3).', [], 'o0']],
  result: 'Some(3)', resultCap: 'continue_value gives the other side.',
}, CFU + 'd([1, 2, 3, 4].iter().try_for_each(|&x| if x > 2 { ControlFlow::Break(x) } else { ControlFlow::Continue(()) }).break_value())');

add('control_flow/continue_value', 'continue_value', CF, 'How ControlFlow::continue_value works', 'Some(value) for Continue, None for Break.', {
  rows: [['Continue(10)', 'Break(())']], call: 'cf.continue_value()', note: 'the keep-going value', outs: ['Some(10)', 'None'],
  intro: 'Continue can carry a value too, e.g. an accumulator.',
  steps: [['Continue(10): Some(10).', 0, 'o0'], ['Break: None.', 1, 'o1']],
  result: 'Some(10), None', resultCap: 'Used with try_fold.',
}, CFU + 'let a: ControlFlow<(), i32> = ControlFlow::Continue(10); let b: ControlFlow<(), i32> = ControlFlow::Break(()); format!("{:?}, {:?}", a.continue_value(), b.continue_value())');

add('control_flow/map_break', 'map_break', CF, 'How ControlFlow::map_break works', 'Transforms the value inside Break.', {
  rows: [['Break(2)']], call: 'cf.map_break(|x| x * 100)', note: 'change the stop value', outs: ['Break(200)'],
  intro: 'Continue is left alone.',
  steps: [['The Break value is 2.', 0], ['It becomes 200.', [], 'o0']],
  result: 'Break(200)', resultCap: 'map_continue changes the Continue value.',
}, CFU + 'let a: ControlFlow<i32> = ControlFlow::Break(2); d(a.map_break(|x| x * 100))');

add('control_flow/map_continue', 'map_continue', CF, 'How ControlFlow::map_continue works', 'Transforms the value inside Continue.', {
  rows: [['Continue(1)']], call: 'cf.map_continue(|x| x + 1)', note: 'change the go-on value', outs: ['Continue(2)'],
  intro: 'Break is left alone.',
  steps: [['The Continue value is 1.', 0], ['It becomes 2.', [], 'o0']],
  result: 'Continue(2)', resultCap: 'Like Result::map for the ok side.',
}, CFU + 'let a: ControlFlow<(), i32> = ControlFlow::Continue(1); d(a.map_continue(|x| x + 1))');

add('bound/map', 'map', BOUND, 'How Bound::map works', 'Transforms the value inside Included or Excluded.', {
  rows: [['Included(3)']], call: 'Bound::Included(3).map(|x| x * 2)', note: 'range ends', outs: ['Included(6)'],
  intro: 'Bound describes one end of a range: Included, Excluded or Unbounded.',
  steps: [['The bound holds 3.', 0], ['It becomes 6; still Included.', [], 'o0']],
  result: 'Included(6)', resultCap: 'Unbounded stays Unbounded.',
}, 'd(std::ops::Bound::Included(3).map(|x| x * 2))');

add('bound/as_ref', 'as_ref', BOUND, 'How Bound::as_ref works', 'Borrows the value inside a Bound: &Bound<T> → Bound<&T>.', {
  rows: [['Excluded(String "z")']], call: 'b.as_ref()', note: 'look without moving', outs: ['Excluded(&"z")'],
  intro: 'Useful with ranges of Strings.',
  steps: [['The bound owns a String.', 0], ['as_ref lends it.', [], 'o0']],
  result: 'Excluded("z")', resultCap: 'cloned() goes back from Bound<&T> to Bound<T>.',
}, 'let b = std::ops::Bound::Excluded(String::from("z")); d(b.as_ref())');

add('bound/cloned', 'cloned', BOUND, 'How Bound::cloned works', 'Bound<&T> → Bound<T> by cloning the value.', {
  rows: [['Included(&5)']], call: 'range.start_bound().cloned()', note: 'own the bound', outs: ['Included(5)'],
  intro: 'start_bound() returns Bound<&T>; cloned makes it owned.',
  steps: [['(5..).start_bound() is Included(&5).', 0], ['cloned → Included(5).', [], 'o0']],
  result: 'Included(5)', resultCap: 'Handy when writing functions that take any range.',
}, 'use std::ops::RangeBounds; d((5..).start_bound().cloned())');

add('range_from/contains', 'contains', ['core', 'RangeFrom', /ops\/range\.rs$/], 'How RangeFrom::contains works', 'true if the value is at least start (start.. has no end).', {
  rows: [['18..', '17']], call: '(18..).contains(&age)', note: 'open upwards', outs: ['18: true', '17: false'],
  intro: 'Anything from 18 upwards is inside.',
  steps: [['18 is the start: true.', 0, 'o0'], ['17 is below: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Reads better than age >= 18 in match guards.',
}, 'format!("{}, {}", (18..).contains(&18), (18..).contains(&17))');

add('range_to/contains', 'contains', ['core', 'RangeTo', /ops\/range\.rs$/], 'How RangeTo::contains works', 'true if the value is below end (..end excludes end).', {
  rows: [['..10']], call: '(..10).contains(&x)', note: 'open downwards', outs: ['9: true', '10: false'],
  intro: 'Everything below 10.',
  steps: [['9 is below: true.', 0, 'o0'], ['10 is excluded: false.', 0, 'o1']],
  result: 'true, false', resultCap: '..=10 would include 10.',
}, 'format!("{}, {}", (..10).contains(&9), (..10).contains(&10))');

add('range_to_inclusive/contains', 'contains', ['core', 'RangeToInclusive', /ops\/range\.rs$/], 'How RangeToInclusive::contains works', 'true if the value is at most end (..=end).', {
  rows: [['..=10']], call: '(..=10).contains(&x)', note: 'end included', outs: ['10: true', '11: false'],
  intro: 'Everything up to and including 10.',
  steps: [['10: true.', 0, 'o0'], ['11: false.', 0, 'o1']],
  result: 'true, false', resultCap: 'Works for floats too: (..=1.0).contains(&x).',
}, 'format!("{}, {}", (..=10).contains(&10), (..=10).contains(&11))');

module.exports = list;
