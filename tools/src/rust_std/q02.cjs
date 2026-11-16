// Rust standard library: methods that ranges, vec::IntoIter, string-splitting iterators, windows/chunks and HashMap
// iterators define themselves. (0..10).max() lands on Range::max, v.into_iter().next() on vec::IntoIter::next,
// s.split(' ').next() inside the macro generate_pattern_iterators!.
const { group, nums } = require('./kit.cjs');
const RANGE = ['core', 'Range', /iter\/range\.rs$/];
const RINC = ['core', 'RangeInclusive', /iter\/range\.rs$/];
const RFROM = ['core', 'RangeFrom', /iter\/range\.rs$/];
const INTO = ['alloc', 'IntoIter', /vec\/into_iter\.rs$/];
const PAT = ['core', 'generate_pattern_iterators', /str\/iter\.rs$/];
const LINES = ['core', 'Lines', /str\/iter\.rs$/];
const SW = ['core', 'SplitWhitespace', /str\/iter\.rs$/];
const WIN = ['core', 'Windows', /slice\/iter\.rs$/];
const CHUNKS = ['core', 'Chunks', /slice\/iter\.rs$/];
const HM = (o) => ['std', o, /collections\/hash\/map\.rs$/];
const { list, add } = group({ at: RANGE });

// ---------------------------------------------------------------- Range a..b

add('range_iter/next', 'next', null, 'How next works on a range', 'Gives the next number of start..end.', {
  rows: [['0..3']], call: 'let mut r = 0..3; r.next()', note: 'end excluded', outs: ['Some(0)', 'Some(1)', 'Some(2)', 'None'],
  intro: 'A range is its own iterator: next() returns start and moves it up by one.',
  steps: [['0, then 1, then 2.', 0, 'o0,1,2'], ['3 is the end, never returned: None.', 0, 'o3']],
  result: 'Some(0), Some(1), Some(2), None', resultCap: 'for i in 0..3 calls next() for you.',
}, 'let mut r = 0..3; format!("{:?}, {:?}, {:?}, {:?}", r.next(), r.next(), r.next(), r.next())');

add('range_iter/nth', 'nth', null, 'How nth works on a range', 'Jumps ahead: the n-th number of the range (0 = start).', {
  rows: [['10..20']], call: '(10..20).nth(3)', note: 'no loop needed', outs: ['Some(13)'],
  intro: 'A range computes start + n directly.',
  steps: [['10 + 3.', 0], ['= 13.', [], 'o0']],
  result: 'Some(13)', resultCap: 'Past the end it returns None.',
}, 'd((10..20).nth(3))');

add('range_iter/last', 'last', null, 'How last works on a range', 'The last number of start..end, which is end - 1.', {
  rows: [['1..5']], call: '(1..5).last()', note: 'computed, not walked', outs: ['Some(4)'],
  intro: 'The end itself is excluded.',
  steps: [['The end is 5.', 0], ['The last value is 4.', [], 'o0']],
  result: 'Some(4)', resultCap: 'An empty range gives None.',
}, 'd((1..5).last())');

add('range_iter/min', 'min', null, 'How min works on a range', 'The smallest number of the range: its start.', {
  rows: [['3..8', '5..5']], call: '(3..8).min()', note: 'instant', outs: ['Some(3)', 'None'],
  intro: 'Ranges count upwards, so the start is the minimum.',
  steps: [['3..8 → 3.', 0, 'o0'], ['5..5 is empty → None.', 1, 'o1']],
  result: 'Some(3), None', resultCap: 'No loop happens; Iterator::min would walk every number.',
}, 'format!("{:?}, {:?}", (3..8).min(), (5..5).min())');

add('range_iter/max', 'max', null, 'How max works on a range', 'The largest number of the range: end - 1.', {
  rows: [['3..8']], call: '(3..8).max()', note: 'instant', outs: ['Some(7)'],
  intro: 'The end is excluded, so the maximum is one less.',
  steps: [['The end is 8.', 0], ['The maximum is 7.', [], 'o0']],
  result: 'Some(7)', resultCap: '(3..=8).max() would be Some(8).',
}, 'd((3..8).max())');

add('range_iter/count', 'count', null, 'How count works on a range', 'How many numbers the range contains: end - start.', {
  rows: [['5..12']], call: '(5..12).count()', note: 'computed directly', outs: ['7'],
  intro: '12 - 5 = 7 numbers: 5, 6, 7, 8, 9, 10, 11.',
  steps: [['end - start.', 0], ['= 7.', [], 'o0']],
  result: '7', resultCap: 'r.len() works too for integer ranges.',
}, '(5..12).count().to_string()');

add('range_iter/next_back', 'next_back', null, 'How next_back works on a range', 'Takes the next number from the end.', {
  rows: [['0..3']], call: 'r.next_back()', note: 'counting down', outs: ['Some(2)', 'Some(1)'],
  intro: 'This is what (0..3).rev() uses.',
  steps: [['2 comes first.', 0, 'o0'], ['Then 1.', 0, 'o1']],
  result: 'Some(2), Some(1)', resultCap: 'for i in (0..3).rev() counts 2, 1, 0.',
}, 'let mut r = 0..3; format!("{:?}, {:?}", r.next_back(), r.next_back())');

add('range_iter/size_hint', 'size_hint', null, 'How size_hint works on a range', 'The exact number of values left, as (n, Some(n)).', {
  rows: [['0..4 after one next()']], call: 'r.size_hint()', note: 'exact', outs: ['(3, Some(3))'],
  intro: 'Ranges know exactly how much is left.',
  steps: [['One value was taken.', 0], ['Three remain.', [], 'o0']],
  result: '(3, Some(3))', resultCap: 'collect() uses this to allocate the right size.',
}, 'let mut r = 0..4; r.next(); d(r.size_hint())');

add('range_iter/is_sorted', 'is_sorted', null, 'How is_sorted works on a range', 'Always true: a range counts upwards.', {
  rows: [['0..100']], call: '(0..100).is_sorted()', note: 'known without looking', outs: ['true'],
  intro: 'The range type guarantees the order, so nothing is checked.',
  steps: [['Every next value is larger.', 0], ['true, instantly.', [], 'o0']],
  result: 'true', resultCap: 'Iterator::is_sorted would compare every pair.',
}, '(0..100).is_sorted().to_string()');

add('range_inclusive_iter/next', 'next', RINC, 'How next works on an inclusive range', 'Gives the next number of start..=end, including end.', {
  rows: [['1..=3']], call: 'let mut r = 1..=3; r.next()', note: 'end included', outs: ['Some(1)', 'Some(2)', 'Some(3)', 'None'],
  intro: 'With ..= the last number is part of the range.',
  steps: [['1, 2 and 3.', 0, 'o0,1,2'], ['Then None.', 0, 'o3']],
  result: 'Some(1), Some(2), Some(3), None', resultCap: 'Useful when the end must be included, e.g. 1..=10.',
}, 'let mut r = 1..=3; format!("{:?}, {:?}, {:?}, {:?}", r.next(), r.next(), r.next(), r.next())');

add('range_inclusive_iter/count', 'count', RINC, 'How count works on an inclusive range', 'How many numbers start..=end contains: end - start + 1.', {
  rows: [['1..=10']], call: '(1..=10).count()', note: 'both ends count', outs: ['10'],
  intro: '10 - 1 + 1 = 10.',
  steps: [['end - start + 1.', 0], ['= 10.', [], 'o0']],
  result: '10', resultCap: '(1..10).count() would be 9.',
}, '(1..=10).count().to_string()');

add('range_inclusive_iter/min', 'min', RINC, 'How min works on an inclusive range', 'The smallest number: the start.', {
  rows: [["'a'..='z'"]], call: "('a'..='z').min()", note: 'works for chars too', outs: ["Some('a')"],
  intro: 'Character ranges iterate in Unicode order.',
  steps: [['The start is a.', 0], ["Some('a').", [], 'o0']],
  result: "Some('a')", resultCap: 'Instant, no loop.',
}, 'd((\'a\'..=\'z\').min())');

add('range_inclusive_iter/max', 'max', RINC, 'How max works on an inclusive range', 'The largest number: the end itself.', {
  rows: [['1..=6']], call: '(1..=6).max()', note: 'end included', outs: ['Some(6)'],
  intro: 'With ..= the end is the maximum.',
  steps: [['The end is 6.', 0], ['Some(6).', [], 'o0']],
  result: 'Some(6)', resultCap: 'An empty range like 5..=4 gives None.',
}, 'd((1..=6).max())');

add('range_inclusive_iter/last', 'last', RINC, 'How last works on an inclusive range', 'The last number: the end.', {
  rows: [['0..=255u8']], call: '(0..=255u8).last()', note: 'reaches the type\'s maximum', outs: ['Some(255)'],
  intro: '0..256 would not even compile for u8; 0..=255 covers every u8 value.',
  steps: [['The end is 255.', 0], ['Some(255).', [], 'o0']],
  result: 'Some(255)', resultCap: 'That is a key reason inclusive ranges exist.',
}, 'd((0..=255u8).last())');

add('range_inclusive_iter/nth', 'nth', RINC, 'How nth works on an inclusive range', 'The n-th number of start..=end.', {
  rows: [['1..=5']], call: '(1..=5).nth(4)', note: 'the end is reachable', outs: ['Some(5)'],
  intro: '1 + 4 = 5, which is still inside because the end is included.',
  steps: [['Skip four numbers.', 0], ['Some(5).', [], 'o0']],
  result: 'Some(5)', resultCap: 'nth(5) would be None.',
}, 'd((1..=5).nth(4))');

add('range_inclusive_iter/next_back', 'next_back', RINC, 'How next_back works on an inclusive range', 'Takes the next number from the end, starting with end itself.', {
  rows: [['1..=3']], call: 'r.next_back()', note: 'counting down', outs: ['Some(3)', 'Some(2)'],
  intro: '(1..=3).rev() gives 3, 2, 1.',
  steps: [['3 first.', 0, 'o0'], ['Then 2.', 0, 'o1']],
  result: 'Some(3), Some(2)', resultCap: 'A countdown: for i in (1..=10).rev().',
}, 'let mut r = 1..=3; format!("{:?}, {:?}", r.next_back(), r.next_back())');

add('range_from_iter/next', 'next', RFROM, 'How next works on start..', 'Counts upwards from start, without end.', {
  rows: [['5..']], call: 'let mut r = 5..; r.next()', note: 'endless', outs: ['Some(5)', 'Some(6)', '...'],
  intro: 'A range with no end never runs out (until the number type overflows).',
  steps: [['5, then 6.', 0, 'o0,1'], ['It keeps going.', 0, 'o2']],
  result: 'Some(5), Some(6)', resultCap: 'Combine with zip or take: (1..).zip(names) numbers a list.',
}, 'let mut r = 5..; format!("{:?}, {:?}", r.next(), r.next())');

add('range_from_iter/nth', 'nth', RFROM, 'How nth works on start..', 'Jumps ahead n numbers.', {
  rows: [['100..']], call: '(100..).nth(5)', note: 'start + n', outs: ['Some(105)'],
  intro: 'Computed directly.',
  steps: [['100 + 5.', 0], ['= 105.', [], 'o0']],
  result: 'Some(105)', resultCap: 'Overflow panics in debug builds.',
}, 'd((100..).nth(5))');

// ---------------------------------------------------------------- vec::IntoIter

add('vec_into_iter/next', 'next', INTO, 'How next works on v.into_iter()', 'Moves the next element out of the Vec.', {
  rows: [['"a"', '"b"']], call: 'let mut it = v.into_iter(); it.next()', note: 'owned items', outs: ['Some("a")', 'Some("b")', 'None'],
  intro: 'into_iter consumes the Vec; each next() hands over ownership of one element.',
  steps: [['"a" is moved out.', 0, 'o0'], ['Then "b".', 1, 'o1'], ['None.', [], 'o2']],
  result: 'Some("a"), Some("b"), None', resultCap: 'Elements left unread are dropped with the iterator.',
}, 'let v = vec![String::from("a"), String::from("b")]; let mut it = v.into_iter(); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('vec_into_iter/count', 'count', INTO, 'How count works on v.into_iter()', 'How many elements are left; instant.', {
  rows: [nums([1, 2, 3])], call: 'v.into_iter().count()', note: 'no walking', outs: ['3'],
  intro: 'The iterator knows how many elements remain.',
  steps: [['Three elements.', [0, 1, 2]], ['count is 3; the elements are dropped.', [], 'o0']],
  result: '3', resultCap: 'v.len() before consuming is the cheaper way.',
}, 'vec![1, 2, 3].into_iter().count().to_string()');

add('vec_into_iter/last', 'last', INTO, 'How last works on v.into_iter()', 'Moves out the last element; the others are dropped.', {
  rows: [['"x"', '"y"', '"z"']], call: 'v.into_iter().last()', note: 'the final element, owned', outs: ['Some("z")'],
  intro: 'Goes straight to the end.',
  steps: [['"x" and "y" are dropped.', [0, 1], 'x'], ['"z" is returned.', 2, 'o0']],
  result: 'Some("z")', resultCap: 'v.pop() does the same and keeps the rest.',
}, 'let v = vec!["x", "y", "z"]; d(v.into_iter().last())');

add('vec_into_iter/next_back', 'next_back', INTO, 'How next_back works on v.into_iter()', 'Moves out the next element from the end.', {
  rows: [nums([1, 2, 3])], call: 'it.next_back()', note: 'owned, backwards', outs: ['Some(3)', 'Some(2)'],
  intro: 'v.into_iter().rev() uses this.',
  steps: [['3 first.', 2, 'o0'], ['Then 2.', 1, 'o1']],
  result: 'Some(3), Some(2)', resultCap: 'Consume a Vec in reverse without copying.',
}, 'let mut it = vec![1, 2, 3].into_iter(); format!("{:?}, {:?}", it.next_back(), it.next_back())');

add('vec_into_iter/as_slice', 'as_slice', INTO, 'How vec::IntoIter::as_slice works', 'Looks at the elements not yet taken, as a slice.', {
  rows: [nums([1, 2, 3])], call: 'it.next(); it.as_slice()', note: 'what is left', outs: ['[2, 3]'],
  intro: 'Peek at the remaining elements without consuming them.',
  steps: [['1 was taken.', 0, 'x'], ['[2, 3] remain.', [1, 2], 'o0']],
  result: '[2, 3]', resultCap: 'as_mut_slice lets you change them before they are taken.',
}, 'let mut it = vec![1, 2, 3].into_iter(); it.next(); d(it.as_slice())');

add('vec_into_iter/as_mut_slice', 'as_mut_slice', INTO, 'How vec::IntoIter::as_mut_slice works', 'Changes the elements not yet taken.', {
  rows: [nums([1, 2])], call: 'it.as_mut_slice()[0] = 10;', note: 'edit before taking', outs: ['next → Some(10)'],
  intro: 'The remaining elements are still inside the iterator\'s buffer.',
  steps: [['The first remaining element becomes 10.', 0], ['next() returns it.', [], 'o0']],
  result: 'Some(10)', resultCap: 'Rarely needed, but handy in custom parsers.',
}, 'let mut it = vec![1, 2].into_iter(); it.as_mut_slice()[0] = 10; d(it.next())');

// ---------------------------------------------------------------- string splitting iterators

add('split_iter/next', 'next', PAT, 'How next works on s.split(..)', 'Gives the next piece of a split string.', {
  rows: [['"a,b"']], call: 'let mut it = s.split(\',\'); it.next()', note: 'one piece at a time', outs: ['Some("a")', 'Some("b")', 'None'],
  intro: 'The same next() serves split, rsplit, split_terminator, matches and more: they are all generated by one macro.',
  steps: [['"a".', 0, 'o0'], ['"b".', 0, 'o1'], ['None.', 0, 'o2']],
  result: 'Some("a"), Some("b"), None', resultCap: 'Grab just the first field: s.split(\',\').next().',
}, 'let mut it = "a,b".split(\',\'); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('split_iter/next_back', 'next_back', PAT, 'How next_back works on s.split(..)', 'Gives the next piece from the end.', {
  rows: [['"usr/local/bin"']], call: 's.split(\'/\').next_back()', note: 'the last field', outs: ['Some("bin")'],
  intro: 'Splitting can be walked from either end.',
  steps: [['Pieces: usr, local, bin.', 0], ['From the back: "bin".', [], 'o0']],
  result: 'Some("bin")', resultCap: 's.rsplit(\'/\').next() gives the same.',
}, 'd("usr/local/bin".split(\'/\').next_back())');

add('lines_iter/next', 'next', LINES, 'How Lines::next works', 'Gives the next line, without its line ending.', {
  rows: [['"one\\r\\ntwo"']], call: 'let mut it = s.lines(); it.next()', note: '\\n or \\r\\n removed', outs: ['Some("one")', 'Some("two")'],
  intro: 'Both Windows and Unix line endings are handled.',
  steps: [['"one" (the \\r\\n is gone).', 0, 'o0'], ['"two".', 0, 'o1']],
  result: 'Some("one"), Some("two")', resultCap: 'The first line: s.lines().next().unwrap_or("").',
}, 'let mut it = "one\\r\\ntwo".lines(); format!("{:?}, {:?}", it.next(), it.next())');

add('lines_iter/last', 'last', LINES, 'How Lines::last works', 'The last line of the text.', {
  rows: [['"a\\nb\\nc\\n"']], call: 's.lines().last()', note: 'a trailing \\n adds no empty line', outs: ['Some("c")'],
  intro: 'Reads from the end.',
  steps: [['The final newline ends "c".', 0], ['Some("c").', [], 'o0']],
  result: 'Some("c")', resultCap: 'Useful for the last line of a log.',
}, 'd("a\\nb\\nc\\n".lines().last())');

add('lines_iter/next_back', 'next_back', LINES, 'How Lines::next_back works', 'Gives lines from the end.', {
  rows: [['"1\\n2\\n3"']], call: 's.lines().rev().take(2)', note: 'the last lines', outs: ['"3"', '"2"'],
  intro: 'lines().rev() uses next_back.',
  steps: [['"3" first.', 0, 'o0'], ['Then "2".', 0, 'o1']],
  result: '"3", "2"', resultCap: 'A simple tail: lines().rev().take(n).',
}, 'jd("1\\n2\\n3".lines().rev().take(2))');

add('split_whitespace_iter/next', 'next', SW, 'How SplitWhitespace::next works', 'Gives the next word, skipping any amount of whitespace.', {
  rows: [['"  hi   there "']], call: 'let mut w = s.split_whitespace(); w.next()', note: 'no empty pieces', outs: ['Some("hi")', 'Some("there")', 'None'],
  intro: 'Leading, trailing and repeated spaces are all skipped.',
  steps: [['"hi".', 0, 'o0'], ['"there".', 0, 'o1'], ['None.', 0, 'o2']],
  result: 'Some("hi"), Some("there"), None', resultCap: 'The first word of a command: s.split_whitespace().next().',
}, 'let mut w = "  hi   there ".split_whitespace(); format!("{:?}, {:?}, {:?}", w.next(), w.next(), w.next())');

add('split_whitespace_iter/last', 'last', SW, 'How SplitWhitespace::last works', 'The last word.', {
  rows: [['"the quick fox "']], call: 's.split_whitespace().last()', note: 'from the end', outs: ['Some("fox")'],
  intro: 'Trailing whitespace is ignored.',
  steps: [['The words are the, quick, fox.', 0], ['Some("fox").', [], 'o0']],
  result: 'Some("fox")', resultCap: 'Reads backwards, so it is quick even for long text.',
}, 'd("the quick fox ".split_whitespace().last())');

// ---------------------------------------------------------------- windows, chunks

add('windows_iter/next', 'next', WIN, 'How Windows::next works', 'Gives the next overlapping window.', {
  rows: [nums([1, 2, 3])], call: 'let mut w = v.windows(2); w.next()', note: 'slides by one', outs: ['Some([1, 2])', 'Some([2, 3])', 'None'],
  intro: 'Each window is a slice that borrows from v.',
  steps: [['[1, 2].', [0, 1], 'o0'], ['[2, 3].', [1, 2], 'o1'], ['None.', [], 'o2']],
  result: 'Some([1, 2]), Some([2, 3]), None', resultCap: 'Compare neighbours: v.windows(2).all(|w| w[0] <= w[1]).',
}, 'let v = [1, 2, 3]; let mut w = v.windows(2); format!("{:?}, {:?}, {:?}", w.next(), w.next(), w.next())');

add('windows_iter/count', 'count', WIN, 'How Windows::count works', 'How many windows fit: len - size + 1.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.windows(3).count()', note: 'computed', outs: ['3'],
  intro: '5 - 3 + 1 = 3 windows.',
  steps: [['Windows start at 0, 1 and 2.', [0, 1, 2]], ['count is 3.', [], 'o0']],
  result: '3', resultCap: 'If the size is larger than the slice, count is 0.',
}, '[1, 2, 3, 4, 5].windows(3).count().to_string()');

add('windows_iter/last', 'last', WIN, 'How Windows::last works', 'The final window.', {
  rows: [nums([1, 2, 3, 4])], call: 'v.windows(2).last()', note: 'the last pair', outs: ['Some([3, 4])'],
  intro: 'Computed directly from the end.',
  steps: [['The last two elements.', [2, 3]], ['Some([3, 4]).', [], 'o0']],
  result: 'Some([3, 4])', resultCap: 'Same as v[v.len() - 2..] when it exists.',
}, 'd([1, 2, 3, 4].windows(2).last())');

add('chunks_iter/next', 'next', CHUNKS, 'How Chunks::next works', 'Gives the next piece of up to n elements.', {
  rows: [nums([1, 2, 3])], call: 'let mut c = v.chunks(2); c.next()', note: 'last chunk may be short', outs: ['Some([1, 2])', 'Some([3])'],
  intro: 'Chunks do not overlap.',
  steps: [['[1, 2].', [0, 1], 'o0'], ['[3]: only one left.', 2, 'o1']],
  result: 'Some([1, 2]), Some([3])', resultCap: 'chunks_exact skips the short one.',
}, 'let v = [1, 2, 3]; let mut c = v.chunks(2); format!("{:?}, {:?}", c.next(), c.next())');

add('chunks_iter/count', 'count', CHUNKS, 'How Chunks::count works', 'How many chunks: len divided by n, rounded up.', {
  rows: [nums([1, 2, 3, 4, 5])], call: 'v.chunks(2).count()', note: 'computed', outs: ['3'],
  intro: '5 / 2 rounded up is 3.',
  steps: [['[1, 2], [3, 4], [5].', [0, 1, 2, 3, 4]], ['3 chunks.', [], 'o0']],
  result: '3', resultCap: 'Same as len.div_ceil(n).',
}, '[1, 2, 3, 4, 5].chunks(2).count().to_string()');

// ---------------------------------------------------------------- HashMap iterators

add('hashmap_iter/next', 'next', HM('Iter'), 'How next works on map.iter()', 'Gives the next (key, value) pair, in no particular order.', {
  rows: [['{"a": 1}']], call: 'let mut it = m.iter(); it.next()', note: 'order is unspecified', outs: ['Some(("a", 1))', 'None'],
  intro: 'Hash maps store entries by hash, so the order looks random.',
  steps: [['The only pair comes out.', 0, 'o0'], ['None.', 0, 'o1']],
  result: 'Some(("a", 1)), None', resultCap: 'Need order? Collect and sort, or use a BTreeMap.',
}, 'let m = HashMap::from([("a", 1)]); let mut it = m.iter(); format!("{:?}, {:?}", it.next(), it.next())');

add('hashmap_iter/count', 'count', HM('Iter'), 'How count works on map.iter()', 'The number of entries; instant.', {
  rows: [['{"a": 1, "b": 2}']], call: 'm.iter().count()', note: 'no walking', outs: ['2'],
  intro: 'The iterator knows how many entries remain.',
  steps: [['Two entries.', 0], ['count is 2.', [], 'o0']],
  result: '2', resultCap: 'm.len() is the simpler call.',
}, 'let m = HashMap::from([("a", 1), ("b", 2)]); m.iter().count().to_string()');

add('hashmap_keys/next', 'next', HM('Keys'), 'How next works on map.keys()', 'Gives the next key.', {
  rows: [['{"k": 0}']], call: 'm.keys().next()', note: 'any key', outs: ['Some("k")'],
  intro: 'Handy to grab some key from a non-empty map.',
  steps: [['The map has one key.', 0], ['Some("k").', [], 'o0']],
  result: 'Some("k")', resultCap: 'Which key comes first is not predictable when there are several.',
}, 'let m = HashMap::from([("k", 0)]); d(m.keys().next())');

add('hashmap_values/next', 'next', HM('Values'), 'How next works on map.values()', 'Gives the next value.', {
  rows: [['{"x": 42}']], call: 'm.values().next()', note: 'any value', outs: ['Some(42)'],
  intro: 'Values come in the same order as the keys.',
  steps: [['One value.', 0], ['Some(42).', [], 'o0']],
  result: 'Some(42)', resultCap: 'Sum them with m.values().sum::<i32>().',
}, 'let m = HashMap::from([("x", 42)]); d(m.values().next())');

add('hashmap_into_iter/next', 'next', HM('IntoIter'), 'How next works on map.into_iter()', 'Moves the next (key, value) pair out of the map.', {
  rows: [['{String "a": 1}']], call: 'm.into_iter().next()', note: 'owned pairs', outs: ['Some(("a", 1))'],
  intro: 'The map is consumed; you own the keys and values.',
  steps: [['The pair is moved out.', 0], ['Some(("a", 1)).', [], 'o0']],
  result: 'Some(("a", 1))', resultCap: 'for (k, v) in m uses this.',
}, 'let m = HashMap::from([(String::from("a"), 1)]); d(m.into_iter().next())');

module.exports = list;
