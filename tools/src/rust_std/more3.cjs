// Rust standard library, batch 2c: more iterator, slice, Vec, str and String functions.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Iterator', /iter\/traits\/iterator\.rs$/] });
const DEI = ['core', 'DoubleEndedIterator', /iter\/traits\/double_ended\.rs$/];
const SRC = (file) => ['core', '', new RegExp(`iter\\/sources\\/${file}\\.rs$`)];
const PEEK = ['core', 'Peekable', /iter\/adapters\/peekable\.rs$/];
const SLICE = ['core', '', /slice\/mod\.rs$/];
const ASLICE = ['alloc', '', /^src\/slice\.rs$/];
const VEC = ['alloc', 'Vec', /vec\/mod\.rs$/];
const STR = ['core', 'str', /str\/mod\.rs$/];
const STRING = ['alloc', 'String', /^src\/string\.rs$/];
const S = (spec) => ({ kind: 'cells', ...spec });

// ---------------------------------------------------------------- iterators

add('iter/try_fold', 'try_fold', null, 'How Iterator::try_fold works', 'Like fold, but stops early when the closure returns an error or None.', {
  kind: 'lines', call: '[100, 200, 50].iter().try_fold(0u8, |acc, x| acc.checked_add(*x))', note: 'u8 holds at most 255',
  lines: ['acc = 0', '0 + 100 = Some(100)', '100 + 200 = None (overflow)', 'stop: result None'],
  intro: 'try_fold carries an accumulator like fold, but the closure returns Option or Result.',
  steps: [
    { cap: 'Start at 0.', show: [0] },
    { cap: '100 fits in a u8.', show: [1] },
    { cap: '100 + 200 = 300 does not fit: checked_add gives None.', show: [2] },
    { cap: 'try_fold stops right away; 50 is never added.', show: [3] },
  ],
  result: 'None', resultCap: 'With Result, the first Err is returned. Safe summing without overflow panics.',
}, 'd([100u8, 200, 50].iter().try_fold(0u8, |acc, x| acc.checked_add(*x)))');

add('iter/cloned', 'cloned', null, 'How Iterator::cloned works', 'Turns an iterator of references into one of owned clones.', {
  rows: [['&"a"', '&"b"']], call: 'names.iter().cloned().collect::<Vec<String>>()', note: '&String → String', outs: ['"a"', '"b"'],
  intro: 'iter() lends &String items. cloned() clones each one, so you get owned Strings.',
  steps: [['"a" is cloned.', 0, 'o0'], ['"b" is cloned. The original Vec still owns its Strings.', 1, 'o1']],
  result: '["a", "b"]', resultCap: 'For Copy types like numbers, copied() is the cheaper equivalent.',
}, 'let names = vec![String::from("a"), String::from("b")]; d(names.iter().cloned().collect::<Vec<String>>())');

add('iter/by_ref', 'by_ref', null, 'How Iterator::by_ref works', 'Borrows an iterator so an adapter can use part of it, and you keep the rest.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'it.by_ref().take(2)  … then  it.collect()', note: 'it = 1..=5, used in two steps', outs: ['first: [1, 2]', 'rest: [3, 4, 5]'],
  intro: 'take(2) would normally consume the iterator. by_ref() lends it instead.',
  steps: [['take(2) gets 1 and 2 through the borrow.', [0, 1], 'o0'], ['The iterator is still there and continues with 3, 4, 5.', [2, 3, 4], 'o1']],
  result: 'first = [1, 2], rest = [3, 4, 5]', resultCap: 'Typical for parsing: read a header with by_ref(), then the body.',
}, 'let mut it = 1..=5; let first: Vec<_> = it.by_ref().take(2).collect(); let rest: Vec<_> = it.collect(); format!("first = {:?}, rest = {:?}", first, rest)');

add('iter/cmp', 'cmp', null, 'How Iterator::cmp works', 'Compares two iterators item by item, like words in a dictionary.', {
  rows: [nums([1, 2, 3]), nums([1, 2, 4])], call: '[1, 2, 3].iter().cmp([1, 2, 4].iter())', note: 'the first difference decides', outs: ['Less'],
  intro: 'cmp walks both sides together until the items differ.',
  steps: [['1 = 1, 2 = 2.', ['a0', 'b0', 'a1', 'b1']], ['3 < 4: the left side is Less.', ['a2', 'b2'], 'o0']],
  result: 'Less', resultCap: 'If one side runs out first, the shorter one is Less: [1, 2] < [1, 2, 0].',
}, 'd([1, 2, 3].iter().cmp([1, 2, 4].iter()))');

add('iter/nth_back', 'nth_back', DEI, 'How DoubleEndedIterator::nth_back works', 'The n-th item counting from the end (0 = last).', {
  rows: [['"a"', '"b"', '"c"', '"d"']], call: 'letters.iter().nth_back(1)', note: '1 = second to last', outs: ['Some("c")'],
  intro: 'nth_back skips n items from the back.',
  steps: [['"d" is position 0 from the back: skipped.', 3, 'x'], ['"c" is position 1: returned.', 2, 'o0']],
  result: 'Some("c")', resultCap: 'For a slice, letters.get(letters.len() - 2) does the same without an iterator.',
}, 'let letters = ["a", "b", "c", "d"]; d(letters.iter().nth_back(1))');

add('iter/rfold', 'rfold', DEI, 'How DoubleEndedIterator::rfold works', 'fold, but from the last item to the first.', {
  kind: 'lines', call: '["a", "b", "c"].iter().rfold(String::new(), |acc, s| acc + s)', note: 'builds the string backwards',
  lines: ['acc = ""', 'acc = "" + "c" = "c"', 'acc = "c" + "b" = "cb"', 'acc = "cb" + "a" = "cba"'],
  intro: 'rfold starts with the last item.',
  steps: [{ cap: 'Start with an empty String.', show: [0] }, { cap: 'The last item "c" first.', show: [1] }, { cap: 'Then "b".', show: [2] }, { cap: 'Then "a".', show: [3] }],
  result: '"cba"', resultCap: 'fold would give "abc". iter().rev().fold(...) is the same as rfold.',
}, 'd(["a", "b", "c"].iter().rfold(String::new(), |acc, s| acc + s))');

add('iter/repeat_n', 'repeat_n', SRC('repeat_n'), 'How iter::repeat_n works', 'Yields the same value exactly n times.', {
  rows: [['"-"']], call: 'std::iter::repeat_n("-", 3)', note: 'repeat with a built-in count', outs: ['"-"', '"-"', '"-"'],
  intro: 'repeat_n(x, 3) is repeat(x).take(3) in one call.',
  steps: [['Once.', 0, 'o0'], ['Twice.', 0, 'o1'], ['Three times, then it ends.', 0, 'o2']],
  result: '"-", "-", "-"', resultCap: 'It clones the value for all but the last item, which is moved out.',
}, 'jd(std::iter::repeat_n("-", 3))');

add('iter/repeat_with', 'repeat_with', SRC('repeat_with'), 'How iter::repeat_with works', 'Calls a closure again and again to produce each item.', {
  rows: [['x = 1']], call: 'let mut x = 1; repeat_with(|| { let v = x; x *= 2; v }).take(4)', note: 'powers of two', outs: ['1', '2', '4', '8'],
  intro: 'repeat_with calls the closure for every item; the closure may keep state.',
  steps: [['1, and x becomes 2.', 0, 'o0'], ['2, then 4.', 0, 'o1,2'], ['8; take(4) stops it.', 0, 'o3']],
  result: '1, 2, 4, 8', resultCap: 'Like from_fn, but it never ends on its own.',
}, 'let mut x = 1; j(std::iter::repeat_with(|| { let v = x; x *= 2; v }).take(4))');

add('iter/empty', 'empty', SRC('empty'), 'How iter::empty works', 'An iterator with no items at all.', {
  rows: [['empty()']], call: 'std::iter::empty::<i32>().count()', note: 'zero items', outs: ['0'],
  intro: 'empty() yields nothing. It is useful where a function must return some iterator.',
  steps: [['There is nothing to yield.', 0], ['count() is 0.', [], 'o0']],
  result: '0', resultCap: 'once(x) is the one-item counterpart.',
}, 'std::iter::empty::<i32>().count().to_string()');

add('iter/next_if_eq', 'next_if_eq', PEEK, 'How Peekable::next_if_eq works', 'Takes the next item only if it equals the given value.', {
  rows: [["'-'", "'5'"]], call: 'let neg = it.next_if_eq(&\'-\').is_some();', note: 'an optional minus sign', outs: ['neg = true'],
  intro: 'next_if_eq is next_if with an equality test, perfect for optional symbols.',
  steps: [["The next char is '-': it is taken.", 0, 'o0'], ["'5' is still there for the next step.", 1, null, 'next: \'5\'']],
  result: 'true', resultCap: 'If the next item is different, it is left in place and you get None.',
}, 'let mut it = "-5".chars().peekable(); it.next_if_eq(&\'-\').is_some().to_string()');

// ---------------------------------------------------------------- slices and Vec

add('slice/chunk_by', 'chunk_by', SLICE, 'How slice::chunk_by works', 'Splits a slice into runs where neighbours satisfy a test.', {
  rows: [nums([1, 2, 3, 7, 8, 12])], call: 'v.chunk_by(|a, b| b - a == 1)', note: 'runs of consecutive numbers', outs: ['[1, 2, 3]', '[7, 8]', '[12]'],
  intro: 'chunk_by compares each item with the next; a false starts a new piece.',
  steps: [['1, 2, 3 each follow by one.', [0, 1, 2], 'o0'], ['3 → 7 is a gap: new piece [7, 8].', [3, 4], 'o1'], ['8 → 12 is a gap: [12].', 5, 'o2']],
  result: '[1, 2, 3], [7, 8], [12]', resultCap: 'Group equal neighbours with chunk_by(|a, b| a == b).',
}, 'let v = [1, 2, 3, 7, 8, 12]; jd(v.chunk_by(|a, b| b - a == 1))');

add('slice/binary_search_by', 'binary_search_by', SLICE, 'How slice::binary_search_by works', 'Binary search with your own comparison.', {
  rows: [['"apple"', '"fig"', '"pear"']], call: 'words.binary_search_by(|w| w.cmp(&"fig"))', note: 'sorted words', outs: ['Ok(1)'],
  intro: 'The closure says how each item compares to what you are looking for.',
  steps: [['The middle word is "fig": Equal.', 1], ['Found at index 1.', [], 'o0']],
  result: 'Ok(1)', resultCap: 'Return Less, Equal or Greater from the closure; for floats use total_cmp.',
}, 'let words = ["apple", "fig", "pear"]; d(words.binary_search_by(|w| w.cmp(&"fig")))');

add('slice/sort_by_cached_key', 'sort_by_cached_key', ASLICE, 'How slice::sort_by_cached_key works', 'Sorts by a key computed only once per item.', {
  rows: [['"10"', '"9"', '"100"']], call: 'v.sort_by_cached_key(|s| s.parse::<i32>().unwrap())', note: 'numeric order of number strings', outs: [null, null, null],
  intro: 'Parsing is costly; this computes each key once instead of at every comparison.',
  steps: [['Keys: 10, 9, 100. 9 is smallest.', 1, 'm0'], ['Then 10 and 100.', [0, 2], { move: { a0: 1, a2: 2 } }]],
  result: '["9", "10", "100"]', resultCap: 'A plain sort would give ["10", "100", "9"]: strings compare letter by letter.',
}, 'let mut v = vec!["10", "9", "100"]; v.sort_by_cached_key(|s| s.parse::<i32>().unwrap()); d(v)');

add('slice/select_nth_unstable', 'select_nth_unstable', SLICE, 'How slice::select_nth_unstable works', 'Puts the n-th smallest item in place n, faster than a full sort.', {
  rows: [nums([9, 1, 8, 2, 7])], call: 'v.select_nth_unstable(2)', note: 'the median of 5 items', outs: ['7'],
  intro: 'After the call, v[2] is what it would be if v were sorted; smaller items are before it, larger after it.',
  steps: [['Sorted, the list would be 1, 2, 7, 8, 9.', [1, 3, 4, 2, 0]], ['So v[2] becomes 7, the median.', 4, 'o0']],
  result: '7', resultCap: 'Runs in linear time on average: ideal for medians and percentiles.',
}, 'let mut v = [9, 1, 8, 2, 7]; let (_, m, _) = v.select_nth_unstable(2); m.to_string()');

add('slice/is_sorted', 'is_sorted', SLICE, 'How slice::is_sorted works', 'Checks that each item is at most the next one.', {
  rows: [nums([1, 3, 3, 9])], call: 'v.is_sorted()', note: 'ascending, ties allowed', outs: ['true'],
  intro: 'is_sorted compares every pair of neighbours.',
  steps: [['1 ≤ 3, 3 ≤ 3, 3 ≤ 9.', [0, 1, 2, 3]], ['All pairs are in order: true.', [], 'o0']],
  result: 'true', resultCap: 'Check this before binary_search in debug code: debug_assert!(v.is_sorted()).',
}, '[1, 3, 3, 9].is_sorted().to_string()');

add('slice/get_mut', 'get_mut', SLICE, 'How slice::get_mut works', 'Borrows one item mutably if the index exists.', {
  rows: [nums([1, 2, 3])], call: 'if let Some(x) = v.get_mut(1) { *x = 20; }', note: 'safe mutable access', outs: [null, '20', null],
  intro: 'get_mut is the &mut version of get: Some(&mut item) or None.',
  steps: [['Index 1 exists: x points at 2.', 1], ['*x = 20 changes it.', [0, 1, 2], { out: [1], move: { a0: 0, a2: 2 } }]],
  result: '[1, 20, 3]', resultCap: 'v[1] = 20 does the same but panics for a bad index.',
}, 'let mut v = vec![1, 2, 3]; if let Some(x) = v.get_mut(1) { *x = 20; } d(v)');

add('slice/copy_from_slice', 'copy_from_slice', SLICE, 'How slice::copy_from_slice works', 'Overwrites a slice with the items of another slice of the same length.', {
  rows: [nums([0, 0, 0, 0]), nums([7, 8])], call: 'buf[1..3].copy_from_slice(&[7, 8]);', note: 'lengths must match', outs: ['0', '7', '8', '0'],
  intro: 'copy_from_slice copies item by item into the target range.',
  steps: [['The target is buf[1..3], two places.', ['a1', 'a2']], ['7 and 8 are copied in.', ['b0', 'b1'], 'o0,1,2,3']],
  result: '[0, 7, 8, 0]', resultCap: 'Different lengths panic. clone_from_slice works for non-Copy items.',
}, 'let mut buf = [0, 0, 0, 0]; buf[1..3].copy_from_slice(&[7, 8]); d(buf)');

add('slice/split_inclusive', 'split_inclusive', SLICE, 'How slice::split_inclusive works', 'Like split, but each separator stays at the end of its piece.', {
  rows: [nums([1, 0, 2, 0])], call: 'v.split_inclusive(|x| *x == 0)', note: 'keep the separators', outs: ['[1, 0]', '[2, 0]'],
  intro: 'Each piece ends with the item that matched.',
  steps: [['[1, 0]: the 0 stays with its piece.', [0, 1], 'o0'], ['[2, 0].', [2, 3], 'o1']],
  result: '[1, 0], [2, 0]', resultCap: 'str has split_inclusive too, handy for keeping line endings.',
}, 'jd([1, 0, 2, 0].split_inclusive(|x| *x == 0))');

add('slice/fill_with', 'fill_with', SLICE, 'How slice::fill_with works', 'Fills every place with the result of a closure.', {
  rows: [['_', '_', '_']], call: 'let mut n = 0; v.fill_with(|| { n += 1; n * n });', note: 'a new value each time', outs: ['1', '4', '9'],
  intro: 'fill_with calls the closure once per place.',
  steps: [['1 * 1 = 1.', 0, 'o0'], ['2 * 2 = 4.', 1, 'o1'], ['3 * 3 = 9.', 2, 'o2']],
  result: '[1, 4, 9]', resultCap: 'fill(x) copies one value everywhere; fill_with can make each one different.',
}, 'let mut v = [0; 3]; let mut n = 0; v.fill_with(|| { n += 1; n * n }); d(v)');

add('vec/dedup_by', 'dedup_by', VEC, 'How Vec::dedup_by works', 'Removes neighbours that your closure calls equal.', {
  rows: [['"a"', '"A"', '"b"']], call: 'v.dedup_by(|a, b| a.eq_ignore_ascii_case(b));', note: 'case-insensitive', outs: [null, null],
  intro: 'The closure decides when two neighbours count as duplicates.',
  steps: [['"a" is kept.', 0, 'm0'], ['"A" equals "a" ignoring case: removed.', 1, 'x'], ['"b" is kept.', 2, 'm1']],
  result: '["a", "b"]', resultCap: 'Note the order of arguments: a is the later item, b the earlier one that stays.',
}, 'let mut v = vec!["a", "A", "b"]; v.dedup_by(|a, b| a.eq_ignore_ascii_case(b)); d(v)');

add('vec/pop_if', 'pop_if', VEC, 'How Vec::pop_if works', 'Removes the last item only if it passes a test.', {
  rows: [nums([1, 2, 9])], call: 'v.pop_if(|x| *x > 5)', note: 'conditional pop', outs: ['Some(9)'],
  intro: 'pop_if looks at the last item first.',
  steps: [['9 > 5: it is removed and returned.', 2, { srcColor: 'danger', out: [0] }], ['Now the last item is 2; another pop_if would return None.', 1, null, '2 > 5 is false']],
  result: 'Some(9)', resultCap: 'Handy for stacks: pop only if the top is what you expect.',
}, 'let mut v = vec![1, 2, 9]; d(v.pop_if(|x| *x > 5))');

add('vec/extract_if', 'extract_if', VEC, 'How Vec::extract_if works', 'Removes the items that pass a test and gives them to you.', {
  rows: [nums([1, 2, 3, 4])], call: 'let evens: Vec<_> = v.extract_if(.., |x| *x % 2 == 0).collect();', note: 'split a Vec in two', outs: ['evens: [2, 4]', 'v: [1, 3]'],
  intro: 'extract_if is retain that keeps the removed items instead of dropping them.',
  steps: [['2 and 4 pass: taken out.', [1, 3], 'o0'], ['1 and 3 stay in v.', [0, 2], 'o1']],
  result: 'evens = [2, 4], v = [1, 3]', resultCap: 'The .. is the range to look at; use 2.. to only consider items from index 2.',
}, 'let mut v = vec![1, 2, 3, 4]; let evens: Vec<_> = v.extract_if(.., |x| *x % 2 == 0).collect(); format!("evens = {:?}, v = {:?}", evens, v)');

add('vec/splice', 'splice', VEC, 'How Vec::splice works', 'Replaces a range with new items; the counts may differ.', {
  rows: [nums([1, 2, 3, 4])], call: 'v.splice(1..3, [9, 9, 9]);', note: 'replace 2 items with 3', outs: ['1', '9', '9', '9', '4'],
  intro: 'splice removes the range 1..3 and inserts the new items in its place.',
  steps: [['2 and 3 are removed.', [1, 2], 'x'], ['Three 9s go in; 4 moves along.', [0, 3], 'o0,1,2,3,4']],
  result: '[1, 9, 9, 9, 4]', resultCap: 'splice returns the removed items as an iterator; it must be used or dropped.',
}, 'let mut v = vec![1, 2, 3, 4]; let _old: Vec<_> = v.splice(1..3, [9, 9, 9]).collect(); d(v)');

add('vec/shrink_to_fit', 'shrink_to_fit', VEC, 'How Vec::shrink_to_fit works', 'Gives unused capacity back to the allocator.', {
  rows: [['len 2, capacity 100']], call: 'v.shrink_to_fit();', note: 'free the spare room', outs: ['len 2, capacity 2'],
  intro: 'A Vec that once held 100 items keeps that room. shrink_to_fit releases it.',
  steps: [['The items stay.', 0], ['The capacity drops to (about) the length.', [], 'o0']],
  result: 'len = 2, capacity = 2', resultCap: 'Only worth it for big, long-lived Vecs; it may need to move the items.',
}, 'let mut v: Vec<i32> = Vec::with_capacity(100); v.push(1); v.push(2); v.shrink_to_fit(); format!("len = {}, capacity = {}", v.len(), v.capacity())');

// ---------------------------------------------------------------- str and String

add('str/split_terminator', 'split_terminator', STR, 'How str::split_terminator works', 'Like split, but a separator at the very end makes no empty piece.', S({
  call: '"a;b;".split_terminator(\';\')', note: 'a trailing ; is ignored', text: 'a;b;', outs: ['"a"', '"b"'],
  intro: 'With split(\';\') you would get "a", "b" and an empty "".',
  steps: [{ cap: '"a".', mark: [[0, 1, 'warning'], [1, 2, 'danger']], out: [0] }, { cap: '"b", and the final ; ends the list.', mark: [[2, 3, 'warning'], [3, 4, 'danger']], out: [1] }],
  result: '"a", "b"', resultCap: 'Good for formats where every item ends with a separator.',
}), 'jd("a;b;".split_terminator(\';\'))');

add('str/rsplit', 'rsplit', STR, 'How str::rsplit works', 'Splits like split, but yields the pieces from right to left.', S({
  call: '"www.rust-lang.org".rsplit(\'.\')', note: 'last piece first', text: 'www.rust-lang.org', outs: ['"org"', '"rust-lang"', '"www"'],
  intro: 'rsplit starts at the end of the string.',
  steps: [{ cap: '"org" comes first.', mark: [[14, 17, 'warning']], out: [0] }, { cap: 'Then "rust-lang".', mark: [[4, 13, 'warning']], out: [1] }, { cap: 'And "www".', mark: [[0, 3, 'warning']], out: [2] }],
  result: '"org", "rust-lang", "www"', resultCap: 'rsplit(\'.\').next() is a quick way to get the last part.',
}), 'jd("www.rust-lang.org".rsplit(\'.\'))');

add('str/trim_matches', 'trim_matches', STR, 'How str::trim_matches works', 'Removes a pattern repeatedly from both ends.', S({
  call: '"--hi--".trim_matches(\'-\')', note: 'any number of them', text: '--hi--', outs: ['"hi"'],
  intro: 'trim_matches keeps cutting the pattern off both ends while it matches.',
  steps: [{ cap: 'All leading dashes go.', mark: [[0, 2, 'danger']] }, { cap: 'All trailing dashes too.', mark: [[4, 6, 'danger']], keep: true, out: [0] }],
  result: '"hi"', resultCap: 'trim_start_matches and trim_end_matches do one side. The pattern can be a closure: trim_matches(char::is_numeric).',
}), 'd("--hi--".trim_matches(\'-\'))');

add('str/match_indices', 'match_indices', STR, 'How str::match_indices works', 'Every match together with its byte position.', S({
  call: '"abcabc".match_indices("bc")', note: 'where each match starts', text: 'abcabc', idx: true, outs: ['(1, "bc")', '(4, "bc")'],
  intro: 'match_indices is matches plus positions.',
  steps: [{ cap: 'A match at 1.', mark: [[1, 3, 'warning']], out: [0] }, { cap: 'And at 4.', mark: [[4, 6, 'warning']], out: [1] }],
  result: '(1, "bc"), (4, "bc")', resultCap: 'Useful for highlighting all occurrences of a word.',
}), 'jd("abcabc".match_indices("bc"))');

add('str/split_at', 'split_at', STR, 'How str::split_at works', 'Cuts a string at a byte position into two slices.', S({
  call: '"hello".split_at(2)', note: 'no copy, two views', text: 'hello', idx: true, outs: ['"he"', '"llo"'],
  intro: 'split_at(2) returns the part before byte 2 and the part from byte 2 on.',
  steps: [{ cap: 'Before: "he".', mark: [[0, 2, 'warning']], out: [0] }, { cap: 'After: "llo".', mark: [[2, 5, 'accent2']], keep: true, out: [1] }],
  result: '("he", "llo")', resultCap: 'Panics if the position is inside a multi-byte character; split_at_checked returns None instead.',
}), 'd("hello".split_at(2))');

add('str/is_char_boundary', 'is_char_boundary', STR, 'How str::is_char_boundary works', 'Checks whether a byte index starts a character.', S({
  call: 's.is_char_boundary(1), s.is_char_boundary(2)', note: 's = "é!" (é takes 2 bytes)', text: 'é!', outs: ['1 → false', '2 → true'],
  intro: 'é uses bytes 0 and 1; ! starts at byte 2.',
  steps: [{ cap: 'Byte 1 is in the middle of é: false.', mark: [[0, 1, 'danger']], out: [0] }, { cap: 'Byte 2 starts !: true.', mark: [[1, 2, 'success']], out: [1] }],
  result: 'false, true', resultCap: 'Check this before slicing with an index you computed yourself.',
}), 'let s = "é!"; format!("{}, {}", s.is_char_boundary(1), s.is_char_boundary(2))');

add('str/as_bytes', 'as_bytes', STR, 'How str::as_bytes works', 'Views the string as its UTF-8 bytes, without copying.', S({
  call: '"Hi".as_bytes()', note: '&[u8]', text: 'Hi', outs: ['72', '105'],
  intro: 'as_bytes gives a byte slice of the same memory.',
  steps: [{ cap: 'H is 72.', mark: [[0, 1, 'warning']], out: [0] }, { cap: 'i is 105.', mark: [[1, 2, 'warning']], out: [1] }],
  result: '[72, 105]', resultCap: 'b"Hi" is a byte-string literal with the same bytes.',
}), 'd("Hi".as_bytes())');

add('str/is_empty', 'is_empty', STR, 'How str::is_empty works', 'true when the string has no bytes.', {
  rows: [['""', '" "']], call: '"".is_empty(), " ".is_empty()', note: 'a space is not empty', outs: ['true', 'false'],
  intro: 'is_empty checks the length, not whether the text looks blank.',
  steps: [['"" has length 0: true.', 0, 'o0'], ['" " has one byte: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'For "blank", use s.trim().is_empty().',
}, 'format!("{}, {}", "".is_empty(), " ".is_empty())');

add('str/rsplitn', 'rsplitn', STR, 'How str::rsplitn works', 'Splits from the right into at most n pieces.', S({
  call: '"a.b.c".rsplitn(2, \'.\')', note: 'cut only at the last dot', text: 'a.b.c', outs: ['"c"', '"a.b"'],
  intro: 'rsplitn(2, ...) makes one cut, starting from the right.',
  steps: [{ cap: 'The last piece, "c", comes first.', mark: [[4, 5, 'warning'], [3, 4, 'danger']], out: [0] }, { cap: 'Everything before stays together: "a.b".', mark: [[0, 3, 'accent2']], keep: true, out: [1] }],
  result: '"c", "a.b"', resultCap: 'rsplit_once(\'.\') gives the same two parts as a tuple.',
}), 'jd("a.b.c".rsplitn(2, \'.\'))');

add('string/from_utf8_lossy', 'from_utf8_lossy', STRING, 'How String::from_utf8_lossy works', 'Turns bytes into text, replacing invalid bytes with �.', {
  rows: [['104', '255', '105']], call: 'String::from_utf8_lossy(&[104, 255, 105])', note: 'never fails', outs: ['"h"', '"�"', '"i"'],
  intro: 'Bytes that are not valid UTF-8 become the replacement character instead of an error.',
  steps: [['104 is h.', 0, 'o0'], ['255 is never valid: �.', 1, 'o1'], ['105 is i.', 2, 'o2']],
  result: '"h�i"', resultCap: 'It returns a Cow: no copy when all bytes were valid.',
}, 'd(String::from_utf8_lossy(&[104, 255, 105]))');

add('string/drain', 'drain', STRING, 'How String::drain works', 'Removes a byte range and gives it back as an iterator of chars.', S({
  call: 's.drain(..6).collect::<String>()', note: 's = "hello world": take the first word', text: 'hello world', outs: ['taken: "hello "', 's: "world"'],
  intro: 'drain(..6) cuts out bytes 0 to 5.',
  steps: [{ cap: '"hello " is removed and collected.', mark: [[0, 6, 'danger']], out: [0] }, { cap: '"world" remains in s.', mark: [[6, 11, 'success']], keep: true, out: [1] }],
  result: 's = "world"', resultCap: 'The range is in bytes and must fall on character boundaries.',
}), 'let mut s = String::from("hello world"); let _w: String = s.drain(..6).collect(); format!("s = {:?}", s)');

add('string/replace_range', 'replace_range', STRING, 'How String::replace_range works', 'Replaces a byte range with new text, in place.', S({
  call: 'let mut s = String::from("Hello, Bob"); s.replace_range(7.., "Ann");', note: 'from byte 7 to the end', text: 'Hello, Ann', outs: ['"Hello, Ann"'],
  intro: 'replace_range swaps the text in a range for new text; the lengths can differ.',
  steps: [{ cap: '"Hello, " stays.', mark: [[0, 7, 'accent2']] }, { cap: '"Bob" is replaced by "Ann".', mark: [[7, 10, 'warning']], keep: true, out: [0] }],
  result: '"Hello, Ann"', resultCap: 'Unlike replace, it changes the String itself and works by position, not by pattern.',
}), 'let mut s = String::from("Hello, Bob"); s.replace_range(7.., "Ann"); d(s)');

add('string/into_bytes', 'into_bytes', STRING, 'How String::into_bytes works', 'Turns the String into its Vec<u8>, without copying.', S({
  call: 'String::from("ok").into_bytes()', note: 'the String is used up', text: 'ok', outs: ['111', '107'],
  intro: 'into_bytes hands over the String\'s buffer as a Vec of bytes.',
  steps: [{ cap: 'o is 111.', mark: [[0, 1, 'warning']], out: [0] }, { cap: 'k is 107.', mark: [[1, 2, 'warning']], out: [1] }],
  result: '[111, 107]', resultCap: 'String::from_utf8 turns it back (checking validity).',
}), 'd(String::from("ok").into_bytes())');

add('string/extend', 'extend', STRING, 'How String::extend works', 'Appends every char (or &str) of an iterator.', S({
  call: 'let mut s = String::from("ab"); s.extend([\'c\', \'d\']);', note: 'push many at once', text: 'abcd', outs: ['"abcd"'],
  intro: 'extend pushes each item onto the end.',
  steps: [{ cap: '"ab" is there.', mark: [[0, 2, 'accent2']] }, { cap: 'c and d are appended.', mark: [[2, 4, 'warning']], keep: true, out: [0] }],
  result: '"abcd"', resultCap: 'Works with any iterator of char or &str, like s.extend(words.iter().copied()).',
}), 'let mut s = String::from("ab"); s.extend([\'c\', \'d\']); d(s)');

module.exports = list;
