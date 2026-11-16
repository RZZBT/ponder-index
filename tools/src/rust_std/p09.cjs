// Rust standard library: more slice methods, byte-slice ASCII helpers, and the rest of Vec.
const { group, nums } = require('./kit.cjs');
const SLICE = ['core', '', /slice\/mod\.rs$/];
const ASCII = ['core', '', /slice\/ascii\.rs$/];
const ASLICE = ['alloc', '', /^src\/slice\.rs$/];
const VEC = ['alloc', 'Vec', /vec\/mod\.rs$/];
const { list, add } = group({ at: SLICE });

// ---------------------------------------------------------------- slices

add('slice/len', 'len', null, 'How slice::len works', 'The number of elements in a slice or array.', {
  rows: [nums([4, 8, 15, 16])], call: 'arr.len()', note: 'count, not bytes', outs: ['4'],
  intro: 'len counts elements, whatever their size.',
  steps: [['Four elements.', [0, 1, 2, 3]], ['len is 4.', [], 'o0']],
  result: '4', resultCap: 'Valid indexes go from 0 to len - 1. For a str, len counts bytes instead.',
}, '[4, 8, 15, 16].len().to_string()');

add('slice/is_empty', 'is_empty', null, 'How slice::is_empty works', 'true if the slice has no elements.', {
  rows: [['[]', '[0]']], call: 's.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'is_empty reads better than len() == 0.',
  steps: [['An empty slice: true.', 0, 'o0'], ['One element, even 0: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Clippy suggests is_empty whenever you write len() == 0.',
}, 'let e: [i32; 0] = []; format!("{}, {}", e.is_empty(), [0].is_empty())');

add('slice/first_mut', 'first_mut', null, 'How slice::first_mut works', 'A mutable reference to the first element, or None if empty.', {
  rows: [nums([1, 2, 3])], call: 'if let Some(x) = v.first_mut() { *x = 100; }', note: 'safe edit of the head', outs: ['100', '2', '3'],
  intro: 'first_mut never panics; v[0] would on an empty Vec.',
  steps: [['The first element is lent.', 0], ['It becomes 100.', [0, 1, 2], 'o0,1,2']],
  result: '[100, 2, 3]', resultCap: 'last_mut does the same for the end.',
}, 'let mut v = vec![1, 2, 3]; if let Some(x) = v.first_mut() { *x = 100; } d(v)');

add('slice/last_mut', 'last_mut', null, 'How slice::last_mut works', 'A mutable reference to the last element, or None if empty.', {
  rows: [['"a"', '"b"']], call: 'if let Some(s) = v.last_mut() { s.push(\'!\'); }', note: 'edit the tail', outs: ['"a"', '"b!"'],
  intro: 'Typical for building output: change the last line you added.',
  steps: [['The last String is lent.', 1], ['"!" is appended.', [0, 1], 'o0,1']],
  result: '["a", "b!"]', resultCap: 'Returns None for an empty slice.',
}, 'let mut v = vec![String::from("a"), String::from("b")]; if let Some(s) = v.last_mut() { s.push(\'!\'); } d(v)');

add('slice/split_at_mut', 'split_at_mut', null, 'How slice::split_at_mut works', 'Two non-overlapping mutable halves of one slice.', {
  rows: [nums([1, 2, 3, 4])], call: 'let (a, b) = v.split_at_mut(2); a[0] += b[0];', note: 'two &mut at once', outs: ['4', '2', '3', '4'],
  intro: 'Rust forbids two &mut to the same Vec, but two &mut to separate halves are fine.',
  steps: [['a = [1, 2], b = [3, 4].', [0, 1, 2, 3]], ['a[0] += b[0]: 1 + 3 = 4.', [0, 2], 'o0,1,2,3']],
  result: '[4, 2, 3, 4]', resultCap: 'The standard way around "cannot borrow v as mutable more than once".',
}, 'let mut v = [1, 2, 3, 4]; let (a, b) = v.split_at_mut(2); a[0] += b[0]; d(v)');

add('slice/get_disjoint_mut', 'get_disjoint_mut', null, 'How slice::get_disjoint_mut works', 'Several mutable references at chosen indexes, checked to be different.', {
  rows: [nums([10, 20, 30])], call: 'let [a, c] = v.get_disjoint_mut([0, 2]).unwrap(); std::mem::swap(a, c);', note: 'many &mut, safely', outs: ['30', '20', '10'],
  intro: 'It returns Err if an index repeats or is out of bounds.',
  steps: [['Indexes 0 and 2 are distinct: two &mut.', [0, 2]], ['Swapping them gives [30, 20, 10].', [0, 1, 2], 'o0,1,2']],
  result: '[30, 20, 10]', resultCap: 'HashMap::get_disjoint_mut does the same with keys.',
}, 'let mut v = [10, 20, 30]; let [a, c] = v.get_disjoint_mut([0, 2]).unwrap(); std::mem::swap(a, c); d(v)');

add('slice/split_mut', 'split_mut', null, 'How slice::split_mut works', 'Mutable pieces between separator elements.', {
  rows: [nums([1, 0, 2, 3])], call: 'for part in v.split_mut(|x| *x == 0) { part.reverse(); }', note: 'edit each piece', outs: ['1', '0', '3', '2'],
  intro: 'Each piece between separators is lent mutably in turn.',
  steps: [['[1] reversed is [1].', 0], ['[2, 3] reversed is [3, 2].', [2, 3], 'o0,1,2,3']],
  result: '[1, 0, 3, 2]', resultCap: 'The separators themselves are not part of any piece.',
}, 'let mut v = [1, 0, 2, 3]; for part in v.split_mut(|x| *x == 0) { part.reverse(); } d(v)');

add('slice/swap_with_slice', 'swap_with_slice', null, 'How slice::swap_with_slice works', 'Exchanges all elements with another slice of the same length.', {
  rows: [nums([1, 2]), nums([8, 9])], call: 'a.swap_with_slice(&mut b);', note: 'element by element', outs: ['a = [8, 9]', 'b = [1, 2]'],
  intro: 'Both slices must be exactly as long.',
  steps: [['1 ↔ 8.', ['a0', 'b0']], ['2 ↔ 9.', ['a1', 'b1'], 'o0,1']],
  result: 'a = [8, 9], b = [1, 2]', resultCap: 'Panics if the lengths differ.',
}, 'let mut a = [1, 2]; let mut b = [8, 9]; a.swap_with_slice(&mut b); format!("a = {:?}, b = {:?}", a, b)');

add('slice/clone_from_slice', 'clone_from_slice', null, 'How slice::clone_from_slice works', 'Overwrites every element with a clone from another slice.', {
  rows: [['"x"', '"y"'], ['"a"', '"b"']], call: 'dst.clone_from_slice(&src);', note: 'for non-Copy items', outs: ['"a"', '"b"'],
  intro: 'Like copy_from_slice, but works for Strings and other Clone types.',
  steps: [['"x" is replaced by a clone of "a".', ['a0', 'b0'], 'o0'], ['"y" by a clone of "b".', ['a1', 'b1'], 'o1']],
  result: '["a", "b"]', resultCap: 'The lengths must match.',
}, 'let mut dst = [String::from("x"), String::from("y")]; let src = [String::from("a"), String::from("b")]; dst.clone_from_slice(&src); d(dst)');

add('slice/rsplit', 'rsplit', null, 'How slice::rsplit works', 'Pieces between separators, from the end backwards.', {
  rows: [nums([1, 0, 2, 3, 0, 4])], call: 'v.rsplit(|x| *x == 0)', note: 'last piece first', outs: ['[4]', '[2, 3]', '[1]'],
  intro: 'Same pieces as split, in reverse order.',
  steps: [['[4] comes first.', 5, 'o0'], ['Then [2, 3].', [2, 3], 'o1'], ['Then [1].', 0, 'o2']],
  result: '[4], [2, 3], [1]', resultCap: 'rsplit(..).next() gives the last piece.',
}, 'jd([1, 0, 2, 3, 0, 4].rsplit(|x| *x == 0))');

add('slice/splitn', 'splitn', null, 'How slice::splitn works', 'Splits at separators, into at most n pieces.', {
  rows: [nums([1, 0, 2, 0, 3])], call: 'v.splitn(2, |x| *x == 0)', note: 'stop after one cut', outs: ['[1]', '[2, 0, 3]'],
  intro: 'After n - 1 cuts, the rest stays together.',
  steps: [['The first 0 cuts off [1].', [0, 1], 'o0'], ['The rest is one piece, with its 0 inside.', [2, 3, 4], 'o1']],
  result: '[1], [2, 0, 3]', resultCap: 'rsplitn counts the cuts from the end.',
}, 'jd([1, 0, 2, 0, 3].splitn(2, |x| *x == 0))');

add('slice/rsplitn', 'rsplitn', null, 'How slice::rsplitn works', 'Splits from the end, into at most n pieces.', {
  rows: [nums([1, 0, 2, 0, 3])], call: 'v.rsplitn(2, |x| *x == 0)', note: 'cut only the last separator', outs: ['[3]', '[1, 0, 2]'],
  intro: 'The last separator splits off the tail; the rest stays whole.',
  steps: [['[3] comes first.', [3, 4], 'o0'], ['Everything before it: [1, 0, 2].', [0, 1, 2], 'o1']],
  result: '[3], [1, 0, 2]', resultCap: 'Good for "everything before the last delimiter".',
}, 'jd([1, 0, 2, 0, 3].rsplitn(2, |x| *x == 0))');

add('slice/chunks_mut', 'chunks_mut', null, 'How slice::chunks_mut works', 'Mutable pieces of a fixed size (the last may be shorter).', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'for c in v.chunks_mut(2) { c.reverse(); }', note: 'edit in groups', outs: ['2', '1', '4', '3', '5'],
  intro: 'Each chunk is lent mutably in turn.',
  steps: [['[1, 2] → [2, 1].', [0, 1]], ['[3, 4] → [4, 3]; [5] stays.', [2, 3, 4], 'o0,1,2,3,4']],
  result: '[2, 1, 4, 3, 5]', resultCap: 'Image code uses it to process one row of pixels at a time.',
}, 'let mut v = [1, 2, 3, 4, 5]; for c in v.chunks_mut(2) { c.reverse(); } d(v)');

add('slice/chunks_exact_mut', 'chunks_exact_mut', null, 'How slice::chunks_exact_mut works', 'Mutable chunks of exactly n elements; leftovers are skipped.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'for c in v.chunks_exact_mut(2) { c[0] = 0; }', note: 'full chunks only', outs: ['0', '2', '0', '4', '5'],
  intro: 'The 5 does not fill a chunk, so it is not visited.',
  steps: [['[1, 2] and [3, 4] are full chunks.', [0, 1, 2, 3]], ['Their first items become 0; 5 is untouched.', [0, 2], 'o0,1,2,3,4']],
  result: '[0, 2, 0, 4, 5]', resultCap: 'into_remainder() gives the leftover part.',
}, 'let mut v = [1, 2, 3, 4, 5]; for c in v.chunks_exact_mut(2) { c[0] = 0; } d(v)');

add('slice/rchunks_exact', 'rchunks_exact', null, 'How slice::rchunks_exact works', 'Full chunks counted from the end; the leftover is at the start.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.rchunks_exact(2)', note: 'right-aligned chunks', outs: ['[4, 5]', '[2, 3]'],
  intro: '1 is the remainder because the chunks are counted from the right.',
  steps: [['[4, 5] first.', [3, 4], 'o0'], ['Then [2, 3]; 1 is left over.', [1, 2], 'o1']],
  result: '[4, 5], [2, 3]', resultCap: 'Grouping digits in threes from the right: 1,234,567.',
}, 'jd([1, 2, 3, 4, 5].rchunks_exact(2))');

add('slice/sort_unstable_by', 'sort_unstable_by', null, 'How slice::sort_unstable_by works', 'Fast in-place sort with your own comparison; equal items may change order.', {
  rows: [nums([3, 1, 2])], call: 'v.sort_unstable_by(|a, b| b.cmp(a))', note: 'descending, no extra memory', outs: [null, null, null],
  intro: '"Unstable" only means that equal elements may swap places; the result is still sorted.',
  steps: [['3 is the largest: first.', 0, 'm0'], ['Then 2 and 1.', [2, 1], { move: { a2: 1, a1: 2 } }]],
  result: '[3, 2, 1]', resultCap: 'Usually faster than sort_by and uses no extra memory.',
}, 'let mut v = [3, 1, 2]; v.sort_unstable_by(|a, b| b.cmp(a)); d(v)');

add('slice/select_nth_unstable_by_key', 'select_nth_unstable_by_key', null, 'How slice::select_nth_unstable_by_key works', 'Puts the element with the n-th smallest key at index n.', {
  rows: [['"ccc"', '"a"', '"bb"']], call: 'v.select_nth_unstable_by_key(0, |s| s.len())', note: 'the shortest word', outs: ['"a"'],
  intro: 'Only position n is guaranteed; the others are just on the correct side.',
  steps: [['Keys: 3, 1, 2.', [0, 1, 2]], ['The smallest key, "a", goes to index 0.', 1, 'o0']],
  result: '"a"', resultCap: 'Faster than sorting when you need one rank, e.g. a median.',
}, 'let mut v = ["ccc", "a", "bb"]; let (_, m, _) = v.select_nth_unstable_by_key(0, |s| s.len()); d(*m)');

add('slice/strip_prefix', 'strip_prefix', null, 'How slice::strip_prefix works', 'The rest of the slice after a given beginning, or None.', {
  rows: [nums([0xEF, 0xBB, 0xBF, 0x41])], call: 'bytes.strip_prefix(&[0xEF, 0xBB, 0xBF])', note: 'drop a byte-order mark', outs: ['Some([65])'],
  intro: 'If the slice starts with the prefix, you get what comes after it.',
  steps: [['The first three bytes match.', [0, 1, 2]], ['What remains is [65].', 3, 'o0']],
  result: 'Some([65])', resultCap: 'strip_suffix does the same at the end.',
}, 'd([0xEFu8, 0xBB, 0xBF, 0x41].strip_prefix(&[0xEF, 0xBB, 0xBF]))');

add('slice/strip_suffix', 'strip_suffix', null, 'How slice::strip_suffix works', 'The slice without a given ending, or None if it does not end that way.', {
  rows: [nums([1, 2, 0, 0])], call: 'v.strip_suffix(&[0, 0])', note: 'remove a terminator', outs: ['Some([1, 2])'],
  intro: 'Only an exact match at the end counts.',
  steps: [['It ends with 0, 0.', [2, 3]], ['What remains is [1, 2].', [0, 1], 'o0']],
  result: 'Some([1, 2])', resultCap: 'Returns None if the ending is different.',
}, 'd([1, 2, 0, 0].strip_suffix(&[0, 0]))');

add('slice/copy_within', 'copy_within', null, 'How slice::copy_within works', 'Copies a range of the slice to another position in the same slice.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.copy_within(0..2, 3);', note: 'source and target may overlap', outs: ['1', '2', '3', '1', '2'],
  intro: 'Elements 0..2 are copied so that they start at index 3.',
  steps: [['The source is [1, 2].', [0, 1]], ['They land at index 3 and 4.', [3, 4], 'o0,1,2,3,4']],
  result: '[1, 2, 3, 1, 2]', resultCap: 'Works like memmove; only for Copy types.',
}, 'let mut v = [1, 2, 3, 4, 5]; v.copy_within(0..2, 3); d(v)');

add('slice/first_chunk', 'first_chunk', null, 'How slice::first_chunk works', 'The first N elements as a fixed-size array reference.', {
  rows: [nums([7, 8, 9])], call: 'let Some(&[a, b]) = v.first_chunk::<2>() else { return };', note: '&[T; N] or None', outs: ['Some([7, 8])'],
  intro: 'The size is checked once, and you get a real array you can destructure.',
  steps: [['There are at least 2 elements.', [0, 1]], ['You get &[7, 8].', [], 'o0']],
  result: 'Some([7, 8])', resultCap: 'last_chunk takes them from the end. Handy for reading fixed-size headers.',
}, 'd([7, 8, 9].first_chunk::<2>())');

add('slice/as_chunks', 'as_chunks', null, 'How slice::as_chunks works', 'Splits a slice into arrays of N elements plus a remainder.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'let (pairs, rest) = v.as_chunks::<2>();', note: '&[[T; N]] + leftovers', outs: ['[[1, 2], [3, 4]]', '[5]'],
  intro: 'Every chunk is a real [T; 2], so the compiler knows its size.',
  steps: [['[1, 2] and [3, 4] are full chunks.', [0, 1, 2, 3], 'o0'], ['5 is the remainder.', 4, 'o1']],
  result: '[[1, 2], [3, 4]], [5]', resultCap: 'as_rchunks puts the remainder at the start instead.',
}, 'let (pairs, rest) = [1, 2, 3, 4, 5].as_chunks::<2>(); format!("{:?}, {:?}", pairs, rest)');

add('slice/split_first_chunk', 'split_first_chunk', null, 'How slice::split_first_chunk works', 'The first N elements as an array, plus the rest of the slice.', {
  rows: [nums([0x01, 0x02, 0xAA, 0xBB])], call: 'let (header, body) = data.split_first_chunk::<2>().unwrap();', note: 'parse a header', outs: ['[1, 2]', '[170, 187]'],
  intro: 'Ideal for binary formats: a fixed header followed by data.',
  steps: [['The header is the first 2 bytes.', [0, 1], 'o0'], ['The body is everything after.', [2, 3], 'o1']],
  result: '[1, 2], [170, 187]', resultCap: 'Returns None if the slice is shorter than N.',
}, 'let data = [0x01u8, 0x02, 0xAA, 0xBB]; let (h, b) = data.split_first_chunk::<2>().unwrap(); format!("{:?}, {:?}", h, b)');

add('slice/select_nth_unstable_by', 'select_nth_unstable_by', null, 'How slice::select_nth_unstable_by works', 'Like select_nth_unstable, with your own comparison.', {
  rows: [['2.5', '-1.0', '9.0']], call: 'v.select_nth_unstable_by(1, |a, b| a.total_cmp(b))', note: 'the median of floats', outs: ['2.5'],
  intro: 'Floats have no Ord, so you pass the comparison.',
  steps: [['Sorted, it would be -1.0, 2.5, 9.0.', [1, 0, 2]], ['Index 1 holds 2.5.', 0, 'o0']],
  result: '2.5', resultCap: 'Linear time on average.',
}, 'let mut v = [2.5_f64, -1.0, 9.0]; let (_, m, _) = v.select_nth_unstable_by(1, |a, b| a.total_cmp(b)); m.to_string()');

// ---------------------------------------------------------------- byte slices ([u8]) and ASCII

add('bytes/is_ascii', 'is_ascii', ASCII, 'How [u8]::is_ascii works', 'true if every byte is below 128.', {
  rows: [['b"hi"', '"hé".as_bytes()']], call: 'bytes.is_ascii()', note: 'plain English text?', outs: ['true', 'false'],
  intro: 'é is stored as two bytes above 127.',
  steps: [['b"hi": true.', 0, 'o0'], ['"hé": false.', 1, 'o1']],
  result: 'true, false', resultCap: 'str::is_ascii does the same on a string.',
}, 'format!("{}, {}", b"hi".is_ascii(), "hé".as_bytes().is_ascii())');

add('bytes/eq_ignore_ascii_case', 'eq_ignore_ascii_case', ASCII, 'How [u8]::eq_ignore_ascii_case works', 'Compares two byte strings, ignoring the case of ASCII letters.', {
  rows: [['b"GET"', 'b"get"']], call: 'method.eq_ignore_ascii_case(b"get")', note: 'case-blind', outs: ['true'],
  intro: 'Each pair of bytes is compared after lower-casing.',
  steps: [['G=g, E=e, T=t.', [0, 1]], ['All match: true.', [], 'o0']],
  result: 'true', resultCap: 'Common when parsing protocols like HTTP.',
}, 'b"GET".eq_ignore_ascii_case(b"get").to_string()');

add('bytes/make_ascii_uppercase', 'make_ascii_uppercase', ASCII, 'How [u8]::make_ascii_uppercase works', 'Upper-cases ASCII letters in place.', {
  rows: [['b"ok!"']], call: 'buf.make_ascii_uppercase();', note: 'no new allocation', outs: ['b"OK!"'],
  intro: 'Only a–z change; other bytes stay as they are.',
  steps: [['o and k become O and K.', 0], ['! stays.', [], 'o0']],
  result: '"OK!"', resultCap: 'to_ascii_uppercase returns a new Vec<u8> instead.',
}, 'let mut buf = *b"ok!"; buf.make_ascii_uppercase(); d(std::str::from_utf8(&buf).unwrap())');

add('bytes/trim_ascii', 'trim_ascii', ASCII, 'How [u8]::trim_ascii works', 'Removes ASCII whitespace from both ends of a byte slice.', {
  rows: [['b"  hi \\n"']], call: 'line.trim_ascii()', note: 'trim without UTF-8', outs: ['b"hi"'],
  intro: 'Like str::trim, but for raw bytes.',
  steps: [['Leading spaces and the trailing space and newline go.', 0], ['b"hi" remains.', [], 'o0']],
  result: '"hi"', resultCap: 'trim_ascii_start and trim_ascii_end do one side.',
}, 'd(std::str::from_utf8(b"  hi \\n".trim_ascii()).unwrap())');

add('bytes/escape_ascii', 'escape_ascii', ASCII, 'How [u8]::escape_ascii works', 'Shows bytes as readable text, escaping anything unprintable.', {
  rows: [['b"a\\n\\xff"']], call: 'bytes.escape_ascii().to_string()', note: 'for logs and debugging', outs: ['"a\\\\n\\\\xff"'],
  intro: 'Printable ASCII is kept; newlines and other bytes become escapes.',
  steps: [['a stays a.', 0], ['\\n and 0xff are written as escapes.', [], 'o0']],
  result: 'a\\n\\xff', resultCap: 'Safer than from_utf8_lossy when you want to see the exact bytes.',
}, 'b"a\\n\\xff".escape_ascii().to_string()');

add('bytes/to_ascii_uppercase', 'to_ascii_uppercase', ASLICE, 'How [u8]::to_ascii_uppercase works', 'A new Vec<u8> with ASCII letters upper-cased.', {
  rows: [['b"rust"']], call: 'b"rust".to_ascii_uppercase()', note: 'returns a copy', outs: ['b"RUST"'],
  intro: 'The original bytes stay unchanged.',
  steps: [['Each letter is upper-cased.', 0], ['The result is a new Vec.', [], 'o0']],
  result: '"RUST"', resultCap: 'make_ascii_uppercase changes the bytes in place instead.',
}, 'd(String::from_utf8(b"rust".to_ascii_uppercase()).unwrap())');

// ---------------------------------------------------------------- Vec

add('vec/new', 'new', VEC, 'How Vec::new works', 'An empty Vec, which does not allocate until you push.', {
  rows: [['Vec::new()']], call: 'let mut v: Vec<i32> = Vec::new(); v.push(1);', note: 'empty and cheap', outs: ['len 0, capacity 0', 'after push: [1]'],
  intro: 'new() reserves no memory; the first push allocates.',
  steps: [['Empty, nothing allocated.', 0, 'o0'], ['push allocates and stores 1.', 0, 'o1']],
  result: '0, [1]', resultCap: 'vec![] is the same. Use with_capacity if you know the size.',
}, 'let mut v: Vec<i32> = Vec::new(); let c = v.capacity(); v.push(1); format!("{}, {:?}", c, v)');

add('vec/capacity', 'capacity', VEC, 'How Vec::capacity works', 'How many elements fit before the Vec must grow.', {
  rows: [['with_capacity(10), 3 pushed']], call: 'v.capacity()', note: 'room vs. use', outs: ['len 3', 'capacity 10'],
  intro: 'len is what is stored; capacity is what fits without reallocating.',
  steps: [['3 elements are stored.', 0, 'o0'], ['Room for 10.', 0, 'o1']],
  result: 'len = 3, capacity = 10', resultCap: 'When len reaches capacity, the Vec grows (usually doubling).',
}, 'let mut v = Vec::with_capacity(10); v.extend([1, 2, 3]); format!("len = {}, capacity = {}", v.len(), v.capacity())');

add('vec/as_slice', 'as_slice', VEC, 'How Vec::as_slice works', 'Borrows the Vec\'s contents as a slice.', {
  rows: [nums([1, 2, 3])], call: 'takes_slice(v.as_slice())', note: '&Vec<T> → &[T]', outs: ['&[1, 2, 3]'],
  intro: 'Functions should take &[T]; then they work with Vecs, arrays and other slices.',
  steps: [['The Vec is borrowed.', [0, 1, 2]], ['It is seen as a slice.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: '&v and &v[..] do the same through automatic deref.',
}, 'let v = vec![1, 2, 3]; d(v.as_slice())');

add('vec/reserve_exact', 'reserve_exact', VEC, 'How Vec::reserve_exact works', 'Reserves room for exactly n more elements, without over-allocating.', {
  rows: [['empty Vec']], call: 'v.reserve_exact(5)', note: 'no extra headroom', outs: ['capacity ≥ 5'],
  intro: 'reserve may round up for future growth; reserve_exact asks for just enough.',
  steps: [['Room for 5 is requested.', 0], ['Capacity becomes at least 5.', [], 'o0']],
  result: 'true', resultCap: 'Use it when you know the final size exactly.',
}, 'let mut v: Vec<u8> = Vec::new(); v.reserve_exact(5); (v.capacity() >= 5).to_string()');

add('vec/shrink_to', 'shrink_to', VEC, 'How Vec::shrink_to works', 'Reduces the capacity, but not below the given minimum.', {
  rows: [['len 2, capacity 100']], call: 'v.shrink_to(10)', note: 'keep some headroom', outs: ['capacity ≥ 10'],
  intro: 'shrink_to_fit goes down to len; shrink_to keeps a floor.',
  steps: [['The Vec had room for 100.', 0], ['Now it keeps at least 10.', [], 'o0']],
  result: 'true', resultCap: 'Capacity never goes below len.',
}, 'let mut v: Vec<i32> = Vec::with_capacity(100); v.extend([1, 2]); v.shrink_to(10); (v.capacity() >= 10 && v.capacity() < 100).to_string()');

add('vec/resize_with', 'resize_with', VEC, 'How Vec::resize_with works', 'Grows or shrinks to a length, creating new elements with a closure.', {
  rows: [nums([1])], call: 'let mut n = 1; v.resize_with(4, || { n *= 2; n });', note: 'new items from a function', outs: ['1', '2', '4', '8'],
  intro: 'resize(len, value) clones one value; resize_with calls a function for each new place.',
  steps: [['1 is already there.', 0, 'o0'], ['Three new items: 2, 4, 8.', [], 'o1,2,3']],
  result: '[1, 2, 4, 8]', resultCap: 'resize_with(n, Default::default) fills with default values.',
}, 'let mut v = vec![1]; let mut n = 1; v.resize_with(4, || { n *= 2; n }); d(v)');

add('vec/extend_from_within', 'extend_from_within', VEC, 'How Vec::extend_from_within works', 'Appends a copy of part of the Vec to its own end.', {
  rows: [nums([1, 2, 3])], call: 'v.extend_from_within(..2);', note: 'repeat a section', outs: ['1', '2', '3', '1', '2'],
  intro: 'Copies elements 0..2 to the end; no temporary copy needed.',
  steps: [['The range ..2 is [1, 2].', [0, 1]], ['It is appended.', [], 'o0,1,2,3,4']],
  result: '[1, 2, 3, 1, 2]', resultCap: 'Elements must be Clone.',
}, 'let mut v = vec![1, 2, 3]; v.extend_from_within(..2); d(v)');

add('vec/leak', 'leak', VEC, 'How Vec::leak works', 'Gives up the Vec forever and returns a &\'static mut slice.', {
  rows: [['vec![1, 2]']], call: "let s: &'static mut [i32] = v.leak();", note: 'never freed', outs: ["&'static [1, 2]"],
  intro: 'The memory stays allocated until the program ends.',
  steps: [['The Vec lets go of its buffer.', 0], ['You get a slice that lives forever.', [], 'o0']],
  result: '[1, 2]', resultCap: 'For tables built once at start-up. Do not use it repeatedly.',
}, 'let v = vec![1, 2]; let s: &\'static mut [i32] = v.leak(); d(&*s)');

add('vec/try_reserve', 'try_reserve', VEC, 'How Vec::try_reserve works', 'Reserves room, returning an error instead of aborting if memory runs out.', {
  rows: [['reserve 10', 'reserve usize::MAX']], call: 'v.try_reserve(n)', note: 'handle out-of-memory', outs: ['Ok(())', 'Err(CapacityOverflow)'],
  intro: 'reserve aborts the program on failure; try_reserve lets you react.',
  steps: [['10 more elements: fine.', 0, 'o0'], ['An impossible size: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Useful for servers that must survive huge requests.',
}, 'let mut v: Vec<u64> = Vec::new(); let a = v.try_reserve(10).is_ok(); let b = v.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('vec/clone', 'clone', VEC, 'How Vec::clone works', 'A deep copy: a new Vec with a clone of every element.', {
  rows: [['a = ["x", "y"]']], call: 'let mut b = a.clone(); b.push("z".into());', note: 'independent copies', outs: ['a = ["x", "y"]', 'b = ["x", "y", "z"]'],
  intro: 'The clone has its own buffer; changing one does not affect the other.',
  steps: [['b gets its own copies of the Strings.', 0], ['Pushing to b leaves a alone.', [], 'o0,1']],
  result: 'a = ["x", "y"], b = ["x", "y", "z"]', resultCap: 'Cloning costs time and memory for big Vecs; borrow (&a) when you can.',
}, 'let a = vec![String::from("x"), String::from("y")]; let mut b = a.clone(); b.push("z".into()); format!("a = {:?}, b = {:?}", a, b)');

add('vec/from_iter', 'from_iter', VEC, 'How Vec::from_iter works', 'Builds a Vec from any iterator; this is what collect() calls.', {
  rows: [['(1..=3).map(|x| x * 10)']], call: 'Vec::from_iter((1..=3).map(|x| x * 10))', note: 'iterator → Vec', outs: ['10', '20', '30'],
  intro: 'collect::<Vec<_>>() and Vec::from_iter(...) are the same thing.',
  steps: [['The iterator yields 10, 20, 30.', 0], ['They are pushed into a new Vec.', [], 'o0,1,2']],
  result: '[10, 20, 30]', resultCap: 'It uses size_hint to allocate the right capacity up front.',
}, 'd(Vec::from_iter((1..=3).map(|x| x * 10)))');

add('vec/default', 'default', VEC, 'How Vec::default works', 'An empty Vec, used when a default value is needed.', {
  rows: [['#[derive(Default)] struct Cart { items: Vec<String> }']], call: 'Cart::default()', note: 'Default for Vec', outs: ['items = []'],
  intro: 'Vec::default() is the same as Vec::new(); derive(Default) uses it for Vec fields.',
  steps: [['The struct needs a default for items.', 0], ['It gets an empty Vec.', [], 'o0']],
  result: '[]', resultCap: 'Also used by unwrap_or_default and mem::take.',
}, 'let v: Vec<String> = Default::default(); d(v)');

module.exports = list;
