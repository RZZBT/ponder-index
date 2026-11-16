// Rust standard library: more iterator methods, arrays, ranges, and the Chars/CharIndices iterators.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Iterator', /iter\/traits\/iterator\.rs$/] });
const DEI = ['core', 'DoubleEndedIterator', /iter\/traits\/double_ended\.rs$/];
const ARRAY = ['core', '', /array\/mod\.rs$/];
const RINC = ['core', 'RangeInclusive', /ops\/range\.rs$/];
const RANGE = ['core', 'Range', /ops\/range\.rs$/];

// ---------------------------------------------------------------- Iterator

add('iter/fuse', 'fuse', null, 'How Iterator::fuse works', 'After the first None, always returns None.', {
  rows: [['Some(1)', 'None', 'Some(2)?']], call: 'odd_iter.fuse()', note: 'stop for good', outs: ['Some(1)', 'None', 'None'],
  intro: 'Most iterators already stop forever, but the rules allow one to resume after None. fuse guarantees it will not.',
  steps: [['The first item passes through.', 0, 'o0'], ['The first None is passed on.', 1, 'o1'], ['Anything after it is hidden: None.', 2, 'o2']],
  result: 'Some(1), None, None', resultCap: 'Needed only when you call next() again after None and rely on the answer.',
}, 'let mut n = 0; let mut it = std::iter::from_fn(move || { n += 1; if n == 2 { None } else { Some(n) } }).fuse(); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('iter/peekable', 'peekable', null, 'How Iterator::peekable works', 'Wraps an iterator so you can look at the next item without taking it.', {
  rows: [nums([1, 2, 3])], call: 'let mut it = v.iter().peekable();', note: 'look ahead by one', outs: ['peek → 1', 'next → 1', 'peek → 2'],
  intro: 'peek() lends the next item; next() still returns it afterwards.',
  steps: [['peek shows 1, which stays in the iterator.', 0, 'o0'], ['next takes 1.', 0, 'o1'], ['Now peek shows 2.', 1, 'o2']],
  result: 'Some(1), Some(1), Some(2)', resultCap: 'The basis of hand-written tokenizers and parsers.',
}, 'let v = [1, 2, 3]; let mut it = v.iter().peekable(); let a = it.peek().copied().copied(); let b = it.next().copied(); let c = it.peek().copied().copied(); format!("{:?}, {:?}, {:?}", a, b, c)');

add('iter/size_hint', 'size_hint', null, 'How Iterator::size_hint works', 'A lower and an optional upper bound on how many items are left.', {
  rows: [['(0..10)', '(0..10).filter(..)']], call: 'it.size_hint()', note: '(at least, at most)', outs: ['(10, Some(10))', '(0, Some(10))'],
  intro: 'collect() uses the hint to reserve memory in advance.',
  steps: [['A range knows its exact length.', 0, 'o0'], ['filter might drop everything: at least 0, at most 10.', 1, 'o1']],
  result: '(10, Some(10)), (0, Some(10))', resultCap: 'An endless iterator reports (usize::MAX, None).',
}, 'format!("{:?}, {:?}", (0..10).size_hint(), (0..10).filter(|x| x % 2 == 0).size_hint())');

add('iter/try_for_each', 'try_for_each', null, 'How Iterator::try_for_each works', 'Runs a fallible action on each item and stops at the first error.', {
  rows: [['"1"', '"2"', '"x"', '"4"']], call: 'v.iter().try_for_each(|s| s.parse::<i32>().map(|_| ()))', note: 'for_each with ?', outs: ['ok', 'ok', 'Err', 'never seen'],
  intro: 'The closure returns a Result; the first Err ends the loop and is returned.',
  steps: [['"1" and "2" are fine.', [0, 1], 'o0,1'], ['"x" fails: try_for_each returns Err.', 2, 'o2'], ['"4" is never looked at.', 3, 'o3']],
  result: 'Err', resultCap: 'Return ControlFlow::Break to stop early without an error.',
}, 'let v = ["1", "2", "x", "4"]; let r = v.iter().try_for_each(|s| s.parse::<i32>().map(|_| ())); (if r.is_err() { "Err" } else { "Ok" }).to_string()');

add('iter/ne', 'ne', null, 'How Iterator::ne works', 'true if two iterators differ in any item or in length.', {
  rows: [nums([1, 2]), nums([1, 3])], call: 'a.iter().ne(b.iter())', note: 'not equal', outs: ['true'],
  intro: 'ne is the opposite of eq.',
  steps: [['1 = 1.', ['a0', 'b0']], ['2 ≠ 3: different, true.', ['a1', 'b1'], 'o0']],
  result: 'true', resultCap: 'Slices and Vecs support != directly.',
}, '[1, 2].iter().ne([1, 3].iter()).to_string()');

add('iter/lt', 'lt', null, 'How Iterator::lt works', 'true if the first iterator comes first in dictionary order.', {
  rows: [['"a"', '"b"'], ['"a"', '"c"']], call: 'x.iter().lt(y.iter())', note: 'lexicographic <', outs: ['true'],
  intro: 'Items are compared pairwise until they differ.',
  steps: [['"a" = "a".', ['a0', 'b0']], ['"b" < "c": true.', ['a1', 'b1'], 'o0']],
  result: 'true', resultCap: 'le, gt and ge work the same; partial_cmp gives the full answer.',
}, '["a", "b"].iter().lt(["a", "c"].iter()).to_string()');

add('iter/le', 'le', null, 'How Iterator::le works', 'true if the first iterator is less than or equal to the second.', {
  rows: [nums([1, 2]), nums([1, 2])], call: 'a.iter().le(b.iter())', note: 'lexicographic <=', outs: ['true'],
  intro: 'Equal sequences count as "less or equal".',
  steps: [['Every pair is equal.', ['a0', 'b0', 'a1', 'b1']], ['Equal: true.', [], 'o0']],
  result: 'true', resultCap: 'Same as !a.iter().gt(b.iter()).',
}, '[1, 2].iter().le([1, 2].iter()).to_string()');

add('iter/gt', 'gt', null, 'How Iterator::gt works', 'true if the first iterator comes later in dictionary order.', {
  rows: [nums([2]), nums([1, 9])], call: 'a.iter().gt(b.iter())', note: 'lexicographic >', outs: ['true'],
  intro: 'The first difference decides, no matter the lengths.',
  steps: [['2 > 1 already decides it.', ['a0', 'b0'], 'o0'], ['The 9 is never compared.', 'b1']],
  result: 'true', resultCap: 'Like words: "b" > "az".',
}, '[2].iter().gt([1, 9].iter()).to_string()');

add('iter/ge', 'ge', null, 'How Iterator::ge works', 'true if the first iterator is greater than or equal to the second.', {
  rows: [nums([1, 2, 3]), nums([1, 2])], call: 'a.iter().ge(b.iter())', note: 'longer wins a tie', outs: ['true'],
  intro: 'When one runs out first, the shorter sequence is the smaller one.',
  steps: [['1, 2 match.', ['a0', 'b0', 'a1', 'b1']], ['The second ran out: the first is greater.', 'a2', 'o0']],
  result: 'true', resultCap: '[1, 2] < [1, 2, 3], like "ab" < "abc".',
}, '[1, 2, 3].iter().ge([1, 2].iter()).to_string()');

add('iter/partial_cmp', 'partial_cmp', null, 'How Iterator::partial_cmp works', 'Compares two iterators item by item; None if some items cannot be compared.', {
  rows: [['1.0', 'NaN'], ['1.0', '2.0']], call: 'a.iter().partial_cmp(b.iter())', note: 'for floats', outs: ['None'],
  intro: 'NaN cannot be ordered, so the comparison has no answer.',
  steps: [['1.0 = 1.0.', ['a0', 'b0']], ['NaN vs 2.0: unordered, None.', ['a1', 'b1'], 'o0']],
  result: 'None', resultCap: 'Without NaN you get Some(Less), Some(Equal) or Some(Greater).',
}, 'd([1.0, f64::NAN].iter().partial_cmp([1.0, 2.0].iter()))');

add('iter/is_sorted_by', 'is_sorted_by', null, 'How Iterator::is_sorted_by works', 'Checks the order using your own rule for each pair of neighbours.', {
  rows: [nums([5, 3, 3, 1])], call: 'v.iter().is_sorted_by(|a, b| a >= b)', note: 'descending', outs: ['true'],
  intro: 'The closure says whether a may come before b.',
  steps: [['5 ≥ 3, 3 ≥ 3, 3 ≥ 1.', [0, 1, 2, 3]], ['Every pair passes: true.', [], 'o0']],
  result: 'true', resultCap: 'Slices have is_sorted_by too.',
}, '[5, 3, 3, 1].iter().is_sorted_by(|a, b| a >= b).to_string()');

add('iter/is_sorted_by_key', 'is_sorted_by_key', null, 'How Iterator::is_sorted_by_key works', 'Checks that a key computed from each item never decreases.', {
  rows: [['"a"', '"bb"', '"ccc"']], call: 'words.iter().is_sorted_by_key(|w| w.len())', note: 'sorted by length?', outs: ['true'],
  intro: 'Keys: 1, 2, 3.',
  steps: [['Lengths 1, 2, 3.', [0, 1, 2]], ['Ascending: true.', [], 'o0']],
  result: 'true', resultCap: 'Pair it with sort_by_key to check your own sorting.',
}, '["a", "bb", "ccc"].iter().is_sorted_by_key(|w| w.len()).to_string()');

add('iter/next_back', 'next_back', DEI, 'How DoubleEndedIterator::next_back works', 'Takes the next item from the end.', {
  rows: [nums([1, 2, 3])], call: 'it.next_back()', note: 'eat from both ends', outs: ['next → 1', 'next_back → 3', 'next → 2'],
  intro: 'A double-ended iterator can be consumed from the front and the back; they meet in the middle.',
  steps: [['next() takes 1.', 0, 'o0'], ['next_back() takes 3.', 2, 'o1'], ['Only 2 is left.', 1, 'o2']],
  result: 'Some(1), Some(3), Some(2)', resultCap: 'rev() simply swaps next and next_back.',
}, 'let mut it = [1, 2, 3].into_iter(); format!("{:?}, {:?}, {:?}", it.next(), it.next_back(), it.next())');

add('iter/try_rfold', 'try_rfold', DEI, 'How DoubleEndedIterator::try_rfold works', 'try_fold from the back: stops early on None or Err.', {
  rows: [nums([1, 50, 100, 200])], call: 'v.iter().try_rfold(0u8, |acc, x| acc.checked_add(*x))', note: 'u8 overflows at 256', outs: ['None'],
  intro: 'It starts with 200 and stops as soon as the sum overflows.',
  steps: [['0 + 200 = 200.', 3], ['200 + 100 = 300 does not fit: None, stop.', 2, 'o0']],
  result: 'None', resultCap: 'Same as iter().rev().try_fold(...).',
}, 'd([1u8, 50, 100, 200].iter().try_rfold(0u8, |acc, x| acc.checked_add(*x)))');

add('iter/len', 'len', ['core', 'ExactSizeIterator', /iter\/traits\/exact_size\.rs$/], 'How ExactSizeIterator::len works', 'The exact number of items left in the iterator.', {
  rows: [nums([10, 20, 30, 40])], call: 'it.len()', note: 'shrinks as you consume', outs: ['4', '3'],
  intro: 'Iterators over slices, ranges and Vecs know their exact length.',
  steps: [['Before anything is taken: 4.', [0, 1, 2, 3], 'o0'], ['After one next(): 3.', 0, 'o1']],
  result: '4, 3', resultCap: 'filter() loses this ability, because it cannot know in advance.',
}, 'let mut it = [10, 20, 30, 40].iter(); let a = it.len(); it.next(); format!("{}, {}", a, it.len())');

add('iter/once_with', 'once_with', ['core', '', /iter\/sources\/once_with\.rs$/], 'How iter::once_with works', 'An iterator with one item, computed only if it is asked for.', {
  rows: [['|| expensive()']], call: 'v.iter().copied().chain(std::iter::once_with(|| 99))', note: 'a lazy single item', outs: ['1', '2', '99'],
  intro: 'once(x) needs x up front; once_with only runs the closure when the item is reached.',
  steps: [['The Vec items come first.', 0, 'o0,1'], ['Then the closure runs and yields 99.', 0, 'o2']],
  result: '1, 2, 99', resultCap: 'If the chain stops early, the closure never runs.',
}, 'j([1, 2].iter().copied().chain(std::iter::once_with(|| 99)))');

add('iter/peek_mut', 'peek_mut', ['core', 'Peekable', /iter\/adapters\/peekable\.rs$/], 'How Peekable::peek_mut works', 'Looks at the next item and lets you change it before it is taken.', {
  rows: [nums([1, 2])], call: 'if let Some(x) = it.peek_mut() { *x *= 10; }', note: 'edit what comes next', outs: ['next → 10', 'next → 2'],
  intro: 'The changed value is what next() will return.',
  steps: [['peek_mut lends the 1; it becomes 10.', 0, 'o0'], ['The rest is unchanged.', 1, 'o1']],
  result: 'Some(10), Some(2)', resultCap: 'Handy for merging or rewriting tokens on the fly.',
}, 'let mut it = [1, 2].into_iter().peekable(); if let Some(x) = it.peek_mut() { *x *= 10; } format!("{:?}, {:?}", it.next(), it.next())');

// ---------------------------------------------------------------- arrays

add('array/map', 'map', ARRAY, 'How array::map works', 'Makes a new array of the same length by applying a function to each element.', {
  rows: [nums([1, 2, 3])], call: '[1, 2, 3].map(|x| x * x)', note: 'array in, array out', outs: ['1', '4', '9'],
  intro: 'Unlike iter().map(), the result is again a fixed-size array; no collect needed.',
  steps: [['1 → 1.', 0, 'o0'], ['2 → 4.', 1, 'o1'], ['3 → 9.', 2, 'o2']],
  result: '[1, 4, 9]', resultCap: 'The length is part of the type: [i32; 3] in, [i32; 3] out.',
}, 'd([1, 2, 3].map(|x| x * x))');

add('array/from_fn', 'from_fn', ARRAY, 'How array::from_fn works', 'Builds an array by calling a function with each index.', {
  rows: [['0', '1', '2', '3']], call: 'let a: [usize; 4] = std::array::from_fn(|i| i * 10);', note: 'index → value', outs: ['0', '10', '20', '30'],
  intro: 'The length comes from the type; the closure receives 0, 1, 2, …',
  steps: [['Index 0 → 0, 1 → 10.', [0, 1], 'o0,1'], ['2 → 20, 3 → 30.', [2, 3], 'o2,3']],
  result: '[0, 10, 20, 30]', resultCap: 'Works for types without Copy, where [x; 4] would not compile.',
}, 'let a: [usize; 4] = std::array::from_fn(|i| i * 10); d(a)');

add('array/each_ref', 'each_ref', ARRAY, 'How array::each_ref works', 'An array of references to each element: [T; N] → [&T; N].', {
  rows: [['String "a"', 'String "b"']], call: 'names.each_ref().map(|s| s.len())', note: 'borrow, keep the array', outs: ['1', '1'],
  intro: 'map() consumes the array; each_ref().map() only borrows it.',
  steps: [['Each String is lent.', [0, 1]], ['Their lengths come out; names is still usable.', [], 'o0,1']],
  result: '[1, 1]', resultCap: 'each_mut gives &mut references instead.',
}, 'let names = [String::from("a"), String::from("b")]; let lens = names.each_ref().map(|s| s.len()); let _still = &names; d(lens)');

add('array/each_mut', 'each_mut', ARRAY, 'How array::each_mut works', 'An array of mutable references to each element.', {
  rows: [nums([1, 2])], call: 'for r in a.each_mut() { *r += 1; }', note: '[&mut T; N]', outs: ['2', '3'],
  intro: 'Each element is lent mutably, so it can be changed in place.',
  steps: [['1 becomes 2.', 0, 'o0'], ['2 becomes 3.', 1, 'o1']],
  result: '[2, 3]', resultCap: 'Same result as iter_mut(), but you keep a fixed-size array of references.',
}, 'let mut a = [1, 2]; for r in a.each_mut() { *r += 1; } d(a)');

add('array/as_slice', 'as_slice', ARRAY, 'How array::as_slice works', 'Views a fixed-size array as a slice.', {
  rows: [nums([4, 5, 6])], call: 'arr.as_slice()', note: '[T; N] → &[T]', outs: ['&[4, 5, 6]'],
  intro: 'A slice forgets the compile-time length; functions taking &[T] then accept arrays of any size.',
  steps: [['The same three elements...', [0, 1, 2]], ['...seen as a slice.', [], 'o0']],
  result: '[4, 5, 6]', resultCap: '&arr[..] does the same.',
}, 'd([4, 5, 6].as_slice())');

// ---------------------------------------------------------------- ranges

add('range/is_empty', 'is_empty', RANGE, 'How Range::is_empty works', 'true if the range contains no numbers.', {
  rows: [['3..7', '5..5', '7..3']], call: '(3..7).is_empty()', note: 'start..end excludes end', outs: ['false', 'true', 'true'],
  intro: 'start..end is empty when start ≥ end.',
  steps: [['3..7 holds 3, 4, 5, 6.', 0, 'o0'], ['5..5 holds nothing.', 1, 'o1'], ['7..3 is backwards: empty, not reversed.', 2, 'o2']],
  result: 'false, true, true', resultCap: 'For counting down use (3..7).rev().',
}, 'format!("{}, {}, {}", (3..7).is_empty(), (5..5).is_empty(), (7..3).is_empty())');

add('range_inclusive/contains', 'contains', RINC, 'How RangeInclusive::contains works', 'Checks whether a value lies in start..=end, both ends included.', {
  rows: [['1', '10', '11']], call: '(1..=10).contains(&x)', note: 'both ends count', outs: ['true', 'true', 'false'],
  intro: '..= includes the end value; .. would not.',
  steps: [['1 is the start: true.', 0, 'o0'], ['10 is the end: still true.', 1, 'o1'], ['11 is outside.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'Clearer than x >= 1 && x <= 10. Also works for chars: (\'a\'..=\'z\').contains(&c).',
}, 'format!("{}, {}, {}", (1..=10).contains(&1), (1..=10).contains(&10), (1..=10).contains(&11))');

add('range_inclusive/start', 'start', RINC, 'How RangeInclusive::start works', 'The first value of start..=end.', {
  rows: [['5..=9']], call: '(5..=9).start()', note: 'a reference to the bound', outs: ['&5'],
  intro: 'Inclusive ranges keep their fields private, so you read them with start() and end().',
  steps: [['The range is 5..=9.', 0], ['start() is 5.', [], 'o0']],
  result: '5', resultCap: 'For a..b ranges the field is public: (5..9).start.',
}, '(5..=9).start().to_string()');

add('range_inclusive/end', 'end', RINC, 'How RangeInclusive::end works', 'The last value of start..=end.', {
  rows: [['5..=9']], call: '(5..=9).end()', note: 'included in the range', outs: ['&9'],
  intro: 'end() gives the upper bound, which is part of the range.',
  steps: [['The range is 5..=9.', 0], ['end() is 9.', [], 'o0']],
  result: '9', resultCap: 'into_inner() returns both bounds as a tuple: (5, 9).',
}, '(5..=9).end().to_string()');

add('range_inclusive/into_inner', 'into_inner', RINC, 'How RangeInclusive::into_inner works', 'Splits start..=end into the tuple (start, end).', {
  rows: [["'a'..='e'"]], call: "('a'..='e').into_inner()", note: 'take the bounds out', outs: ["('a', 'e')"],
  intro: 'into_inner consumes the range and returns its two bounds.',
  steps: [['The bounds are a and e.', 0], ['They come back as a pair.', [], 'o0']],
  result: "('a', 'e')", resultCap: 'Useful when a function takes a range but needs plain numbers.',
}, 'd((\'a\'..=\'e\').into_inner())');

add('range_inclusive/new', 'new', RINC, 'How RangeInclusive::new works', 'Creates start..=end from two values.', {
  rows: [['2', '4']], call: 'RangeInclusive::new(2, 4)', note: 'same as 2..=4', outs: ['2', '3', '4'],
  intro: 'new is the function behind the ..= syntax.',
  steps: [['Bounds 2 and 4.', [0, 1]], ['Iterating gives 2, 3, 4.', [], 'o0,1,2']],
  result: '2, 3, 4', resultCap: 'Write 2..=4 in normal code; new is useful in generic code.',
}, 'j(std::ops::RangeInclusive::new(2, 4))');

// ---------------------------------------------------------------- Chars, CharIndices

add('chars/as_str', 'as_str', ['core', 'Chars', /str\/iter\.rs$/], 'How Chars::as_str works', 'The part of the string the iterator has not reached yet.', {
  rows: [['"abc"']], call: 'it.next(); it.as_str()', note: 'what is left', outs: ['"bc"'],
  intro: 'Chars walks through the string; as_str shows the remaining text without copying.',
  steps: [["next() consumed 'a'.", 0], ['"bc" is left.', [], 'o0']],
  result: '"bc"', resultCap: 'Handy in parsers: read a few chars, then look at the rest as a &str.',
}, 'let mut it = "abc".chars(); it.next(); d(it.as_str())');

add('char_indices/offset', 'offset', ['core', 'CharIndices', /str\/iter\.rs$/], 'How CharIndices::offset works', 'The byte position of the next character.', {
  rows: [['"aé!"']], call: 'it.next(); it.next(); it.offset()', note: 'é takes 2 bytes', outs: ['3'],
  intro: 'After a (1 byte) and é (2 bytes), the next char starts at byte 3.',
  steps: [["'a' at 0, 'é' at 1.", 0], ["'!' starts at byte 3.", [], 'o0']],
  result: '3', resultCap: 'Use it to slice the string right after what you have read.',
}, 'let mut it = "aé!".char_indices(); it.next(); it.next(); it.offset().to_string()');

module.exports = list;
