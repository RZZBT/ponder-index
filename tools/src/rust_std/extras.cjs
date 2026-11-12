// Rust standard library: more everyday functions across modules (iterators, slices, str, Vec, String, Option,
// Result, collections, cells, floats). Each entry names where it is declared.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Iterator', /iter\/traits\/iterator\.rs$/] });
const DEI = ['core', 'DoubleEndedIterator', /iter\/traits\/double_ended\.rs$/];
const ZIPFN = ['core', '', /iter\/adapters\/zip\.rs$/];
const SLICE = ['core', '', /slice\/mod\.rs$/];
const STR = ['core', 'str', /str\/mod\.rs$/];
const ASTR = ['alloc', 'str', /^src\/str\.rs$/];
const VEC = ['alloc', 'Vec', /vec\/mod\.rs$/];
const STRING = ['alloc', 'String', /^src\/string\.rs$/];
const OPT = ['core', 'Option', /^src\/option\.rs$/];
const RES = ['core', 'Result', /^src\/result\.rs$/];
const DEQUE = ['alloc', 'VecDeque', /collections\/vec_deque\/mod\.rs$/];
const HEAP = ['alloc', 'BinaryHeap', /collections\/binary_heap\/mod\.rs$/];
const BTREE = ['alloc', 'BTreeMap', /collections\/btree\/map\.rs$/];
const SET = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const CELL = ['core', 'Cell', /^src\/cell\.rs$/];
const RC = ['alloc', 'Rc', /^src\/rc\.rs$/];
const F64 = ['core', 'f64', /num\/f64\.rs$/];
const CHAR = ['core', 'char', /char\/methods\.rs$/];
const S = (spec) => ({ kind: 'cells', ...spec });

// ---------------------------------------------------------------- iterators

add('iter/max_by', 'max_by', null, 'How Iterator::max_by works', 'The largest item according to your own comparison.', {
  call: '[1.5, 3.2, 2.0].iter().max_by(|a, b| a.total_cmp(b))', note: 'floats need a comparison', rows: [['1.5', '3.2', '2.0']], outs: ['Some(3.2)'],
  intro: 'Floats have no max() because of NaN. max_by lets you say how two items compare; total_cmp orders every float.',
  steps: [
    ['1.5 is the largest so far.', 0, null, 'best: 1.5'],
    ['3.2 is larger.', 1, null, 'best: 3.2'],
    ['2.0 is smaller. The answer is 3.2.', 2, 'o0'],
  ],
  result: 'Some(3.2)', resultCap: 'min_by works the same way. For a key instead of a comparison, use max_by_key.',
}, 'd([1.5_f64, 3.2, 2.0].iter().max_by(|a, b| a.total_cmp(b)))');

add('iter/min_by', 'min_by', null, 'How Iterator::min_by works', 'The smallest item according to your own comparison.', {
  call: '["bb", "a", "ccc"].iter().min_by(|a, b| a.len().cmp(&b.len()))', note: 'shortest string', rows: [['"bb"', '"a"', '"ccc"']], outs: ['Some("a")'],
  intro: 'The closure returns an Ordering (Less, Equal, Greater) for two items.',
  steps: [
    ['"bb" (2) is the smallest so far.', 0, null, 'best: "bb"'],
    ['"a" (1) is shorter.', 1, null, 'best: "a"'],
    ['"ccc" (3) is longer. The answer is "a".', 2, 'o0'],
  ],
  result: 'Some("a")', resultCap: 'For a simple key like the length, min_by_key(|s| s.len()) is shorter.',
}, 'd(["bb", "a", "ccc"].iter().min_by(|a, b| a.len().cmp(&b.len())))');

add('iter/rfind', 'rfind', DEI, 'How DoubleEndedIterator::rfind works', 'Like find, but searches from the back.', {
  call: '[1, 4, 2, 6, 3].iter().rfind(|x| **x % 2 == 0)', note: 'the last even number', rows: [nums([1, 4, 2, 6, 3])], outs: ['Some(6)'],
  intro: 'rfind starts at the end and walks towards the front.',
  steps: [
    ['3 is odd.', 4, 'x'],
    ['6 is even: found, and the search stops.', 3, 'o0'],
  ],
  result: 'Some(6)', resultCap: 'find would have returned 4, the first even number from the front.',
}, 'd([1, 4, 2, 6, 3].iter().rfind(|x| **x % 2 == 0))');

add('iter/rposition', 'rposition', null, 'How Iterator::rposition works', 'The index of the last item that passes the test.', {
  call: '[1, 2, 1, 3].iter().rposition(|x| *x == 1)', note: 'search from the end', rows: [nums([1, 2, 1, 3])], outs: ['Some(2)'],
  intro: 'rposition walks from the back, but the index it returns still counts from the front.',
  steps: [
    ['Index 3, value 3: no.', 3, 'x'],
    ['Index 2, value 1: yes. The answer is Some(2).', 2, 'o0'],
  ],
  result: 'Some(2)', resultCap: 'position would return Some(0), the first 1.',
}, 'd([1, 2, 1, 3].iter().rposition(|x| *x == 1))');

add('iter/zip_fn', 'zip', ZIPFN, 'How iter::zip works', 'The free-function form of zip: pairs up two iterables.', {
  call: 'std::iter::zip([1, 2], ["a", "b"])', note: 'no .iter() needed', rows: [nums([1, 2]), ['"a"', '"b"']], outs: ['(1, "a")', '(2, "b")'],
  intro: 'iter::zip(a, b) is the same as a.into_iter().zip(b), but reads more symmetrically.',
  steps: [
    ['1 and "a" form the first pair.', ['a0', 'b0'], 'o0'],
    ['2 and "b" the second.', ['a1', 'b1'], 'o1'],
  ],
  result: '(1, "a"), (2, "b")', resultCap: 'Like the method, it stops at the shorter side.',
}, 'jd(std::iter::zip([1, 2], ["a", "b"]))');

// ---------------------------------------------------------------- slices

add('slice/ends_with', 'ends_with', SLICE, 'How slice::ends_with works', 'Checks whether the slice ends with the given items.', {
  call: '[1, 2, 3].ends_with(&[2, 3])', note: 'compares the back', rows: [nums([1, 2, 3]), nums([2, 3])], outs: ['true'],
  intro: 'ends_with lines the suffix up with the end of the slice.',
  steps: [
    ['2 == 2 and 3 == 3: the end matches.', ['a1', 'a2', 'b0', 'b1'], 'o0'],
    ['The 1 at the front does not matter.', 'a0', null],
  ],
  result: 'true', resultCap: 'An empty suffix always matches.',
}, '[1, 2, 3].ends_with(&[2, 3]).to_string()');

add('slice/rotate_right', 'rotate_right', SLICE, 'How slice::rotate_right works', 'Shifts every item n places right; the ones at the end wrap around to the front.', {
  call: 'let mut v = [1, 2, 3, 4]; v.rotate_right(1);', note: 'the last item comes to the front', rows: [nums([1, 2, 3, 4])], outs: [null, null, null, null],
  intro: 'rotate_right(1) moves every item one place right.',
  steps: [
    ['1, 2 and 3 move one place right.', [0, 1, 2], { move: { a0: 1, a1: 2, a2: 3 } }],
    ['4 falls off the end and wraps around to the front.', 3, 'm0', 'wrap around'],
  ],
  result: '[4, 1, 2, 3]', resultCap: 'rotate_left(1) undoes it.',
}, 'let mut v = [1, 2, 3, 4]; v.rotate_right(1); d(v)');

add('slice/split', 'split', SLICE, 'How slice::split works', 'Cuts a slice at every item that matches; the matches are dropped.', {
  call: '[1, 0, 2, 3, 0, 4].split(|x| *x == 0)', note: '0 is the separator', rows: [nums([1, 0, 2, 3, 0, 4])], outs: ['[1]', '[2, 3]', '[4]'],
  intro: 'split works like str::split, but for any slice.',
  steps: [
    ['Before the first 0: [1].', 0, 'o0'],
    ['Between the zeros: [2, 3].', [2, 3], 'o1'],
    ['After the last 0: [4]. The zeros themselves are not in any piece.', 5, 'o2'],
  ],
  result: '[1], [2, 3], [4]', resultCap: 'Each piece borrows the original slice: nothing is copied.',
}, 'jd([1, 0, 2, 3, 0, 4].split(|x| *x == 0))');

add('slice/iter_mut', 'iter_mut', SLICE, 'How slice::iter_mut works', 'An iterator of mutable references, to change items in place.', {
  call: 'for x in v.iter_mut() { *x *= 10; }', note: 'v = [1, 2, 3]', rows: [nums([1, 2, 3])], outs: ['10', '20', '30'],
  intro: 'iter_mut lends out each item as &mut, so the loop can change it.',
  steps: [
    ['x points at 1; *x *= 10 makes it 10.', 0, 'o0'],
    ['2 becomes 20, 3 becomes 30.', [1, 2], 'o1,2'],
  ],
  result: '[10, 20, 30]', resultCap: 'for x in &mut v is the same thing. The * is needed because x is a reference.',
}, 'let mut v = vec![1, 2, 3]; for x in v.iter_mut() { *x *= 10; } d(v)');

add('slice/split_last', 'split_last', SLICE, 'How slice::split_last works', 'The last item and everything before it.', {
  call: '[1, 2, 3].split_last()', note: 'tail and the rest', rows: [nums([1, 2, 3])], outs: ['last: 3', 'rest: [1, 2]'],
  intro: 'split_last separates the final item from the others.',
  steps: [
    ['The last item: 3.', 2, 'o0'],
    ['The rest: [1, 2].', [0, 1], 'o1'],
  ],
  result: 'Some((3, [1, 2]))', resultCap: 'None for an empty slice.',
}, 'd([1, 2, 3].split_last())');

add('slice/rchunks', 'rchunks', SLICE, 'How slice::rchunks works', 'Like chunks, but starting from the end.', {
  call: '[1, 2, 3, 4, 5].rchunks(2)', note: 'the short piece is at the front', rows: [nums([1, 2, 3, 4, 5])], outs: ['[4, 5]', '[2, 3]', '[1]'],
  intro: 'rchunks cuts pieces of 2 from the back.',
  steps: [
    ['The last two: [4, 5].', [3, 4], 'o0'],
    ['Then [2, 3].', [1, 2], 'o1'],
    ['Only 1 is left: [1].', 0, 'o2'],
  ],
  result: '[4, 5], [2, 3], [1]', resultCap: 'Useful for grouping digits from the right, like thousands separators.',
}, 'jd([1, 2, 3, 4, 5].rchunks(2))');

// ---------------------------------------------------------------- str

add('str/trim_start', 'trim_start', STR, 'How str::trim_start works', 'Removes whitespace at the start only.', S({
  call: '"  hi  ".trim_start()', note: 'the end is untouched', text: '  hi  ', outs: ['"hi  "'],
  intro: 'trim_start cuts whitespace from the beginning.',
  steps: [
    { cap: 'The two leading spaces are cut off.', mark: [[0, 2, 'danger']] },
    { cap: 'The trailing spaces stay.', mark: [[2, 6, 'success']], keep: true, out: [0] },
  ],
  result: '"hi  "', resultCap: 'trim_end does the other side; trim does both.',
}), 'd("  hi  ".trim_start())');

add('str/trim_end', 'trim_end', STR, 'How str::trim_end works', 'Removes whitespace at the end only, such as a trailing newline.', S({
  call: 'line.trim_end()   // line = "ok\\n"', note: 'typical for input lines', text: 'ok↵', outs: ['"ok"'],
  intro: 'Lines read from input often end with a newline (↵). trim_end removes it.',
  steps: [
    { cap: 'The newline at the end is whitespace: removed.', mark: [[2, 3, 'danger']] },
    { cap: '"ok" is left.', mark: [[0, 2, 'success']], keep: true, out: [0] },
  ],
  result: '"ok"', resultCap: 'Always trim input before parsing: "42\\n".parse::<i32>() fails, "42" works.',
}), 'd("ok\\n".trim_end())');

add('str/ends_with', 'ends_with', STR, 'How str::ends_with works', 'Checks whether the string ends with a given text.', S({
  call: '"photo.png".ends_with(".png")', note: 'checking a file extension', text: 'photo.png', outs: ['true'],
  intro: 'ends_with compares the last characters with the pattern.',
  steps: [
    { cap: 'The last 4 characters are ".png".', mark: [[5, 9, 'success']] },
    { cap: 'So the answer is true.', out: [0], keep: true },
  ],
  result: 'true', resultCap: 'Case matters: "PHOTO.PNG".ends_with(".png") is false. For paths, std::path::Path::extension is more robust.',
}), '"photo.png".ends_with(".png").to_string()');

add('str/rfind', 'rfind', STR, 'How str::rfind works', 'The byte index of the last match of a pattern.', S({
  call: '"a/b/c".rfind(\'/\')', note: 'searching from the right', text: 'a/b/c', idx: true, outs: ['Some(3)'],
  intro: 'rfind finds the last occurrence, but the index still counts from the left.',
  steps: [
    { cap: 'Searching from the right, the first / found is at index 3.', mark: [[3, 4, 'success']] },
    { cap: 'The other / at index 1 is never reached.', mark: [[1, 2, 'muted']], keep: true, out: [0] },
  ],
  result: 'Some(3)', resultCap: 'To take everything after it: &s[i + 1..] is "c". rsplit_once(\'/\') does both in one step.',
}), 'd("a/b/c".rfind(\'/\'))');

add('str/strip_suffix', 'strip_suffix', STR, 'How str::strip_suffix works', 'Removes a suffix if it is there; None if it is not.', S({
  call: '"report.txt".strip_suffix(".txt")', note: 'remove a known ending', text: 'report.txt', outs: ['Some("report")'],
  intro: 'strip_suffix checks the end and returns the part before it.',
  steps: [
    { cap: '".txt" is at the end: removed.', mark: [[6, 10, 'danger']] },
    { cap: 'Some("report") is returned.', mark: [[0, 6, 'success']], keep: true, out: [0] },
  ],
  result: 'Some("report")', resultCap: 'Returns None when the suffix is missing, so you can tell the two cases apart.',
}), 'd("report.txt".strip_suffix(".txt"))');

add('str/rsplit_once', 'rsplit_once', STR, 'How str::rsplit_once works', 'Splits at the last separator into two parts.', S({
  call: '"archive.tar.gz".rsplit_once(\'.\')', note: 'only the last . counts', text: 'archive.tar.gz', outs: ['"archive.tar"', '"gz"'],
  intro: 'rsplit_once cuts at the last separator.',
  steps: [
    { cap: 'The last . is before "gz".', mark: [[11, 12, 'danger']] },
    { cap: 'Before it: "archive.tar". After it: "gz".', mark: [[0, 11, 'accent2'], [12, 14, 'warning']], keep: true, out: [0, 1] },
  ],
  result: 'Some(("archive.tar", "gz"))', resultCap: 'split_once(\'.\') would give ("archive", "tar.gz") instead.',
}), 'd("archive.tar.gz".rsplit_once(\'.\'))');

add('str/matches', 'matches', STR, 'How str::matches works', 'An iterator over every match of a pattern.', S({
  call: '"a1b22c3".matches(char::is_numeric).count()', note: 'count the digits', text: 'a1b22c3', outs: ['"1"', '"2"', '"2"', '"3"'],
  intro: 'matches yields every piece of the string that matches the pattern.',
  steps: [
    { cap: '"1" matches.', mark: [[1, 2, 'warning']], out: [0] },
    { cap: '"2" and "2".', mark: [[3, 5, 'warning']], keep: true, out: [1, 2] },
    { cap: 'And "3".', mark: [[6, 7, 'warning']], keep: true, out: [3] },
  ],
  result: '4', resultCap: 'With a string pattern, s.matches("ab").count() counts how often "ab" appears (without overlaps).',
}), '"a1b22c3".matches(char::is_numeric).count().to_string()');

add('str/eq_ignore_ascii_case', 'eq_ignore_ascii_case', STR, 'How str::eq_ignore_ascii_case works', 'Compares two strings, treating upper and lower case ASCII letters as equal.', {
  call: '"Yes".eq_ignore_ascii_case("yES")', note: 'no new Strings needed', rows: [['"Yes"', '"yES"']], outs: ['true'],
  intro: 'Each pair of characters is compared after lowering A–Z.',
  steps: [
    ['Y/y, e/E, s/S: equal when case is ignored.', [0, 1], null, 'y = y, e = e, s = s'],
    ['All pairs match: true.', [], 'o0'],
  ],
  result: 'true', resultCap: 'Cheaper than a.to_lowercase() == b.to_lowercase(), which allocates two Strings.',
}, '"Yes".eq_ignore_ascii_case("yES").to_string()');

add('str/replacen', 'replacen', ASTR, 'How str::replacen works', 'Replaces only the first n matches.', S({
  call: '"a-b-c".replacen(\'-\', "+", 1)', note: 'just the first one', text: 'a-b-c', outs: ['"a+b-c"'],
  intro: 'replacen(pat, to, 1) stops after one replacement.',
  steps: [
    { cap: 'The first - becomes +.', mark: [[1, 2, 'warning']] },
    { cap: 'The second - is left alone.', mark: [[3, 4, 'muted']], keep: true, out: [0] },
  ],
  result: '"a+b-c"', resultCap: 'replace changes every match; replacen(pat, to, n) at most n.',
}), 'd("a-b-c".replacen(\'-\', "+", 1))');

add('str/to_ascii_uppercase', 'to_ascii_uppercase', ASTR, 'How str::to_ascii_uppercase works', 'A new String with a–z uppercased; everything else unchanged.', S({
  call: '"héllo".to_ascii_uppercase()', note: 'ASCII letters only', text: 'héllo', outs: ['"HéLLO"'],
  intro: 'Only the 26 ASCII letters change; é is not ASCII.',
  steps: [
    { cap: 'h, l, l, o become H, L, L, O.', mark: [[0, 1, 'warning'], [2, 5, 'warning']] },
    { cap: 'é stays as it is.', mark: [[1, 2, 'muted']], keep: true, out: [0] },
  ],
  result: '"HéLLO"', resultCap: 'to_uppercase follows Unicode and would give "HÉLLO".',
}), 'd("héllo".to_ascii_uppercase())');

// ---------------------------------------------------------------- Vec and String

add('vec/is_empty', 'is_empty', VEC, 'How Vec::is_empty works', 'true when the Vec has no items.', {
  call: 'Vec::<i32>::new().is_empty(), vec![1].is_empty()', note: 'clearer than len() == 0', rows: [['[]', '[1]']], outs: ['true', 'false'],
  intro: 'is_empty checks whether the length is 0.',
  steps: [
    ['An empty Vec: true.', 0, 'o0'],
    ['A Vec with one item: false.', 1, 'o1'],
  ],
  result: 'true, false', resultCap: 'Clippy suggests is_empty() over len() == 0 because it reads better.',
}, 'format!("{}, {}", Vec::<i32>::new().is_empty(), vec![1].is_empty())');

add('vec/retain_mut', 'retain_mut', VEC, 'How Vec::retain_mut works', 'Like retain, but the closure may also change the items it keeps.', {
  call: 'v.retain_mut(|x| { *x -= 1; *x > 0 });', note: 'v = [1, 3, 2]: count down, drop zeros', rows: [nums([1, 3, 2])], outs: [null, null],
  intro: 'Each item is decreased by one; items that reach 0 are removed.',
  steps: [
    ['1 becomes 0: not > 0, removed.', 0, 'x', '1 - 1 = 0'],
    ['3 becomes 2: kept.', 1, { move: { a1: 0 }, set: {} }, '3 - 1 = 2'],
    ['2 becomes 1: kept.', 2, { move: { a2: 1 } }, '2 - 1 = 1'],
  ],
  result: '[2, 1]', resultCap: 'Handy for timers and lifetimes: tick everything down and drop what has expired, in one pass.',
}, 'let mut v = vec![1, 3, 2]; v.retain_mut(|x| { *x -= 1; *x > 0 }); d(v)');

add('vec/reserve', 'reserve', VEC, 'How Vec::reserve works', 'Makes sure there is room for at least n more items.', {
  call: 'let mut v = vec![1]; v.reserve(10);', note: 'plan ahead', rows: [['1']], outs: ['len 1', 'capacity ≥ 11'],
  intro: 'reserve(10) grows the buffer so that 10 more pushes will not need to reallocate.',
  steps: [
    ['v holds one item.', 0, 'o0'],
    ['After reserve(10), the capacity is at least 1 + 10. The length is still 1.', [], 'o1'],
  ],
  result: 'len = 1, room for 10 more', resultCap: 'reserve may give more than asked for, never less. Use it before a loop of pushes when you know how many are coming.',
}, 'let mut v = vec![1]; v.reserve(10); format!("len = {}, room for {} more", v.len(), if v.capacity() - v.len() >= 10 { 10 } else { 0 })');

add('string/insert', 'insert', STRING, 'How String::insert works', 'Inserts one char at a byte position.', S({
  call: 'let mut s = String::from("hllo"); s.insert(1, \'e\');', note: 'insert at byte 1', text: 'hello', outs: ['"hello"'],
  intro: 'insert(1, \'e\') puts e before the character at byte 1.',
  steps: [
    { cap: 'h stays in front.', mark: [[0, 1, 'accent2']] },
    { cap: 'e is inserted; l, l, o shift right.', mark: [[1, 2, 'warning'], [2, 5, 'accent2']], keep: true, out: [0] },
  ],
  result: '"hello"', resultCap: 'insert_str inserts a whole &str. The position must be a character boundary.',
}), 'let mut s = String::from("hllo"); s.insert(1, \'e\'); d(s)');

add('string/len', 'len', STRING, 'How String::len works', 'The number of bytes, not characters.', S({
  call: 'String::from("añb").len()', note: 'bytes in UTF-8', text: 'añb', outs: ['1', '2', '1'],
  intro: 'ñ needs 2 bytes in UTF-8; a and b need 1.',
  steps: [
    { cap: 'a: 1 byte.', mark: [[0, 1, 'accent2']], out: [0] },
    { cap: 'ñ: 2 bytes.', mark: [[1, 2, 'warning']], keep: true, out: [1] },
    { cap: 'b: 1 byte.', mark: [[2, 3, 'accent2']], keep: true, out: [2] },
  ],
  result: '4', resultCap: '3 characters but len() is 4. chars().count() gives 3.',
}), 'String::from("añb").len().to_string()');

// ---------------------------------------------------------------- Option and Result

add('option/is_none', 'is_none', OPT, 'How Option::is_none works', 'true for None.', {
  call: 'None::<i32>.is_none(), Some(1).is_none()', note: 'the opposite of is_some', rows: [['None', 'Some(1)']], outs: ['true', 'false'],
  intro: 'is_none only checks; it does not take anything out.',
  steps: [
    ['None: true.', 0, 'o0'],
    ['Some(1): false.', 1, 'o1'],
  ],
  result: 'true, false', resultCap: 'In an if, prefer if let Some(x) = opt when you need x afterwards.',
}, 'format!("{}, {}", None::<i32>.is_none(), Some(1).is_none())');

add('option/map_or_else', 'map_or_else', OPT, 'How Option::map_or_else works', 'Applies one closure to Some and another to None.', {
  call: 'opt.map_or_else(|| "none".len(), |s| s.len())', note: 'both cases computed lazily', rows: [['Some("abc")', 'None']], outs: ['3', '4'],
  intro: 'map_or_else(default_fn, f): f runs for Some, default_fn for None.',
  steps: [
    ['Some("abc"): f gives the length, 3.', 0, 'o0'],
    ['None: the default closure runs: "none".len() = 4.', 1, 'o1'],
  ],
  result: '3, 4', resultCap: 'Note the order: the default comes first, the mapping second.',
}, 'let a = Some("abc"); let b: Option<&str> = None; format!("{}, {}", a.map_or_else(|| "none".len(), |s| s.len()), b.map_or_else(|| "none".len(), |s| s.len()))');

add('option/xor', 'xor', OPT, 'How Option::xor works', 'Some if exactly one of the two is Some.', {
  call: 'Some(1).xor(None), Some(1).xor(Some(2))', note: 'one or the other, not both', rows: [['Some(1) xor None', 'Some(1) xor Some(2)']], outs: ['Some(1)', 'None'],
  intro: 'xor keeps a value only when the other side has none.',
  steps: [
    ['Only one side has a value: Some(1).', 0, 'o0'],
    ['Both have values: None.', 1, 'o1'],
  ],
  result: 'Some(1), None', resultCap: 'Useful for "exactly one of these options must be given" checks.',
}, 'format!("{:?}, {:?}", Some(1).xor(None), Some(1).xor(Some(2)))');

add('option/flatten', 'flatten', OPT, 'How Option::flatten works', 'Turns Option<Option<T>> into Option<T>.', {
  call: 'Some(Some(3)).flatten(), Some(None::<i32>).flatten()', note: 'one level less', rows: [['Some(Some(3))', 'Some(None)']], outs: ['Some(3)', 'None'],
  intro: 'Nested Options often come from looking something up that may itself be missing.',
  steps: [
    ['Some(Some(3)) becomes Some(3).', 0, 'o0'],
    ['Some(None) becomes None.', 1, 'o1'],
  ],
  result: 'Some(3), None', resultCap: 'and_then usually avoids creating the nested Option in the first place.',
}, 'format!("{:?}, {:?}", Some(Some(3)).flatten(), Some(None::<i32>).flatten())');

add('option/copied', 'copied', OPT, 'How Option::copied works', 'Turns Option<&T> into Option<T> by copying the value.', {
  call: '[5, 6].iter().max().copied()', note: '&6 becomes 6', rows: [['Some(&6)']], outs: ['Some(6)'],
  intro: 'iter().max() gives Option<&i32>. copied() copies the number out, so the result no longer borrows the array.',
  steps: [
    ['The reference &6 inside Some is followed…', 0, null, 'Option<&i32>'],
    ['…and the value is copied: Some(6).', 0, 'o0', 'Option<i32>'],
  ],
  result: 'Some(6)', resultCap: 'cloned() does the same for types that are Clone but not Copy, like String.',
}, 'd([5, 6].iter().max().copied())');

add('option/as_deref', 'as_deref', OPT, 'How Option::as_deref works', 'Turns &Option<String> into Option<&str>.', {
  call: 'name.as_deref().unwrap_or("anonymous")', note: 'name: Option<String>', rows: [['Some(String "ann")', 'None']], outs: ['"ann"', '"anonymous"'],
  intro: 'as_deref borrows the String inside as a &str, so it can be compared with string literals.',
  steps: [
    ['Some(String "ann") becomes Some("ann"), a &str.', 0, 'o0'],
    ['None stays None, and unwrap_or supplies "anonymous".', 1, 'o1'],
  ],
  result: '"ann", "anonymous"', resultCap: 'Without as_deref, unwrap_or would need a String, and name would be moved.',
}, 'let a = Some(String::from("ann")); let b: Option<String> = None; format!("{:?}, {:?}", a.as_deref().unwrap_or("anonymous"), b.as_deref().unwrap_or("anonymous"))');

add('result/is_err', 'is_err', RES, 'How Result::is_err works', 'true for Err.', {
  call: '"x".parse::<i32>().is_err()', note: 'did it fail?', rows: [['Err(..)']], outs: ['true'],
  intro: 'is_err tells you whether there is an error, without looking at it.',
  steps: [
    ['"x" is not a number: parse returns Err.', 0, { srcColor: 'danger' }],
    ['is_err() is true.', [], 'o0'],
  ],
  result: 'true', resultCap: 'To see the error, use if let Err(e) = result.',
}, '"x".parse::<i32>().is_err().to_string()');

add('result/map_or', 'map_or', RES, 'How Result::map_or works', 'Applies a closure to Ok, or returns a default for Err.', {
  call: 'res.map_or(0, |n| n * 2)', note: 'value or default', rows: [['Ok(4)', 'Err("bad")']], outs: ['8', '0'],
  intro: 'map_or gives f(value) for Ok, and the default for Err.',
  steps: [
    ['Ok(4): 4 * 2 = 8.', 0, 'o0'],
    ['Err: the default, 0.', 1, 'o1'],
  ],
  result: '8, 0', resultCap: 'The error is ignored. map_or_else(|e| ..., f) lets you use it.',
}, 'let a: Result<i32, &str> = Ok(4); let b: Result<i32, &str> = Err("bad"); format!("{}, {}", a.map_or(0, |n| n * 2), b.map_or(0, |n| n * 2))');

add('result/unwrap_err', 'unwrap_err', RES, 'How Result::unwrap_err works', 'Takes the error out of Err; panics on Ok.', {
  call: '"x".parse::<i32>().unwrap_err()', note: 'mostly for tests', rows: [['Err(InvalidDigit)']], outs: ['ParseIntError { kind: InvalidDigit }'],
  intro: 'unwrap_err is unwrap for the error side: you expect a failure.',
  steps: [
    ['The parse failed, so the error comes out.', 0, 'o0'],
    ['On Ok it would panic instead.', [], null, 'expects Err'],
  ],
  result: 'ParseIntError { kind: InvalidDigit }', resultCap: 'Mostly used in tests to check that something fails, and why.',
}, 'd("x".parse::<i32>().unwrap_err())');

// ---------------------------------------------------------------- collections, cells, floats, chars

add('vecdeque/pop_back', 'pop_back', DEQUE, 'How VecDeque::pop_back works', 'Removes the last item.', {
  call: 'let mut q = VecDeque::from([1, 2, 3]); q.pop_back()', note: 'from the back', rows: [nums([1, 2, 3])], outs: ['Some(3)'],
  intro: 'pop_back takes the item at the back of the deque.',
  steps: [
    ['3 is at the back: taken out.', 2, { srcColor: 'danger', out: [0] }],
    ['[1, 2] remain.', [0, 1], null],
  ],
  result: 'Some(3)', resultCap: 'A VecDeque can be used from both ends, as a queue or as a stack.',
}, 'let mut q = VecDeque::from([1, 2, 3]); d(q.pop_back())');

add('binaryheap/peek', 'peek', HEAP, 'How BinaryHeap::peek works', 'Shows the largest value without removing it.', {
  call: 'h.peek()', note: 'h = [4, 9, 2]', rows: [nums([4, 9, 2])], outs: ['Some(9)'],
  intro: 'The largest value is always at the top of the heap, so peek is instant.',
  steps: [
    ['9 is on top.', 1, 'o0'],
    ['Nothing is removed: the heap still has 3 values.', [], null, 'len 3'],
  ],
  result: 'Some(9)', resultCap: 'Use pop() to remove it.',
}, 'let h: BinaryHeap<i32> = [4, 9, 2].into_iter().collect(); d(h.peek())');

add('btreemap/get', 'get', BTREE, 'How BTreeMap::get works', 'Looks a key up in a sorted map.', {
  call: 'm.get(&2), m.get(&5)', note: 'm = {1: "a", 2: "b", 3: "c"}', rows: [['1 → "a"', '2 → "b"', '3 → "c"']], outs: ['Some("b")', 'None'],
  intro: 'get walks down the tree, comparing the key, until it finds it or knows it is missing.',
  steps: [
    ['2 is found: Some("b").', 1, 'o0'],
    ['5 is not in the map: None.', [], 'o1'],
  ],
  result: 'Some("b"), None', resultCap: 'Lookups take about log₂(n) comparisons, still fast for large maps.',
}, 'let m: BTreeMap<i32, &str> = [(1, "a"), (2, "b"), (3, "c")].into_iter().collect(); format!("{:?}, {:?}", m.get(&2), m.get(&5))');

add('btreemap/pop_first', 'pop_first', BTREE, 'How BTreeMap::pop_first works', 'Removes and returns the entry with the smallest key.', {
  call: 'tasks.pop_first()', note: 'tasks = {2: "eat", 1: "wake", 3: "work"}', rows: [['1 → "wake"', '2 → "eat"', '3 → "work"']], outs: ['Some((1, "wake"))'],
  intro: 'The keys are sorted, so the smallest key is the first entry.',
  steps: [
    ['1 is the smallest key: (1, "wake") is removed and returned.', 0, { srcColor: 'danger', out: [0] }],
    ['The next pop_first would give (2, "eat").', 1, null, 'next: 2'],
  ],
  result: 'Some((1, "wake"))', resultCap: 'Keys as priorities: a BTreeMap works as a simple ordered work queue.',
}, 'let mut t: BTreeMap<i32, &str> = [(2, "eat"), (1, "wake"), (3, "work")].into_iter().collect(); d(t.pop_first())');

add('hashset/symmetric_difference', 'symmetric_difference', SET, 'How HashSet::symmetric_difference works', 'The values that are in exactly one of the two sets.', {
  call: 'a.symmetric_difference(&b)', note: 'a = {1, 2, 3}, b = {2, 3, 4}', rows: [nums([1, 2, 3]), nums([2, 3, 4])], outs: ['1', '4'],
  intro: 'symmetric_difference drops the values both sets share.',
  steps: [
    ['2 and 3 are in both: dropped.', ['a1', 'a2', 'b0', 'b1'], 'x'],
    ['1 is only in a, 4 only in b: both kept.', ['a0', 'b2'], 'o0,1'],
  ],
  result: '{1, 4}', resultCap: 'Handy for "what changed between these two snapshots?".',
}, 'let a: HashSet<i32> = [1, 2, 3].into_iter().collect(); let b: HashSet<i32> = [2, 3, 4].into_iter().collect(); let r: HashSet<i32> = a.symmetric_difference(&b).copied().collect(); sorted_set(&r)');

add('cell/get', 'get', CELL, 'How Cell::get works', 'Returns a copy of the value inside the Cell.', {
  call: 'let c = Cell::new(3); c.get() + c.get()', note: 'a copy each time', rows: [['Cell 3']], outs: ['3', '3'],
  intro: 'get copies the value out; the Cell keeps its own copy.',
  steps: [
    ['The first get gives 3.', 0, 'o0'],
    ['So does the second; the Cell still holds 3.', 0, 'o1'],
  ],
  result: '6', resultCap: 'get needs the value to be Copy. For other types use take(), replace() or a RefCell.',
}, 'let c = Cell::new(3); (c.get() + c.get()).to_string()');

add('rc/try_unwrap', 'try_unwrap', RC, 'How Rc::try_unwrap works', 'Takes the value out of an Rc, but only if it is the last owner.', {
  call: 'Rc::try_unwrap(a)', note: 'a and a clone b exist', rows: [['count 2', 'count 1']], outs: ['Err(rc)', 'Ok("hi")'],
  intro: 'With other owners still around, taking the value out would leave them pointing at nothing, so it is refused.',
  steps: [
    ['While b also owns it (count 2): Err, and you get your Rc back.', 0, { srcColor: 'danger', out: [0] }],
    ['After b is dropped (count 1): Ok, and you own the value directly.', 1, 'o1'],
  ],
  result: 'Ok("hi")', resultCap: 'Rc::into_inner is a variant that returns an Option.',
}, 'let a = Rc::new(String::from("hi")); let b = Rc::clone(&a); drop(b); d(Rc::try_unwrap(a))');

add('f64/min', 'min', F64, 'How f64::min works', 'The smaller of two floats; ignores NaN.', {
  call: '2.5_f64.min(1.5), 2.5_f64.min(f64::NAN)', note: 'NaN loses', rows: [['2.5 vs 1.5', '2.5 vs NaN']], outs: ['1.5', '2.5'],
  intro: 'f64::min compares two floats; if one is NaN, the other one wins.',
  steps: [
    ['1.5 is smaller.', 0, 'o0'],
    ['With NaN, 2.5 is returned.', 1, 'o1'],
  ],
  result: '1.5, 2.5', resultCap: 'The smallest of a list: v.iter().copied().fold(f64::INFINITY, f64::min).',
}, 'format!("{}, {}", 2.5_f64.min(1.5), 2.5_f64.min(f64::NAN))');

add('char/is_numeric', 'is_numeric', CHAR, 'How char::is_numeric works', 'true for numeric characters, including ones beyond 0–9.', {
  call: "'7'.is_numeric(), '½'.is_numeric(), 'x'.is_numeric()", note: 'Unicode numbers', rows: [["'7'", "'½'", "'x'"]], outs: ['true', 'true', 'false'],
  intro: 'is_numeric follows Unicode: fractions and other numerals count too.',
  steps: [
    ["'7' is numeric.", 0, 'o0'],
    ["'½' is numeric too.", 1, 'o1'],
    ["'x' is not.", 2, { srcColor: 'danger', out: [2] }],
  ],
  result: 'true, true, false', resultCap: 'Before parsing, is_ascii_digit is usually the better test: "½".parse::<u32>() fails.',
}, "format!(\"{}, {}, {}\", '7'.is_numeric(), '½'.is_numeric(), 'x'.is_numeric())");

module.exports = list;
