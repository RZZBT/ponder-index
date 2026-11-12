// Rust standard library: slices, [T] (core::slice and alloc::slice). These methods also work on Vec and arrays.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', '', /slice\/mod\.rs$/] });
const ALLOC = ['alloc', '', /^src\/slice\.rs$/];

add('slice/first', 'first', null, 'How slice::first works', 'The first item, as an Option (None for an empty slice).', {
  call: '[7, 8, 9].first()', note: 'safe: no panic on an empty slice', rows: [nums([7, 8, 9])], outs: ['Some(7)'],
  intro: 'first() looks at index 0 if there is one.',
  steps: [
    ['The slice is not empty, so index 0 exists: 7.', 0, 'o0'],
    ['For [] it would return None, where v[0] would panic.', [], null, 'empty → None'],
  ],
  result: 'Some(7)', resultCap: 'The result is a reference, &7, printed as 7. last() works the same way from the other end.',
}, 'd([7, 8, 9].first())');

add('slice/last', 'last', null, 'How slice::last works', 'The last item, as an Option (None for an empty slice).', {
  call: '[7, 8, 9].last()', note: 'the item at len() - 1', rows: [nums([7, 8, 9])], outs: ['Some(9)'],
  intro: 'last() looks at index len() - 1, if the slice is not empty.',
  steps: [
    ['The length is 3, so the last index is 2: 9.', 2, 'o0', 'index 3 - 1 = 2'],
    ['An empty slice gives None.', [], null, 'empty → None'],
  ],
  result: 'Some(9)', resultCap: 'Unlike Iterator::last, slice::last is instant: it goes straight to the end.',
}, 'd([7, 8, 9].last())');

add('slice/get', 'get', null, 'How slice::get works', 'Reads an index safely: Some(item), or None when it is out of range.', {
  call: 'v.get(1), v.get(5)', note: 'v = [10, 20, 30]', rows: [nums([10, 20, 30])], outs: ['get(1) → Some(20)', 'get(5) → None'],
  intro: 'get is the safe version of v[i]: instead of panicking, it returns None.',
  steps: [
    ['Index 1 exists: Some(20).', 1, 'o0'],
    ['There is no index 5 (the last index is 2): None, no panic.', [], 'o1', '5 > 2'],
  ],
  result: 'Some(20), None', resultCap: 'Use v[i] when the index must be valid (a bug otherwise), and get(i) when it may not be.',
}, 'let v = [10, 20, 30]; format!("{:?}, {:?}", v.get(1), v.get(5))');

add('slice/contains', 'contains', null, 'How slice::contains works', 'Checks whether an equal item is in the slice.', {
  call: '[3, 7, 1].contains(&7)', note: 'compares items one by one', rows: [nums([3, 7, 1])], outs: ['true'],
  intro: 'contains compares each item with 7, from the front.',
  steps: [
    ['3 is not 7.', 0, 'x'],
    ['7 equals 7: true, and the search stops.', 1, 'o0', 'found'],
  ],
  result: 'true', resultCap: 'contains looks at items one by one. For many lookups in a big collection, a HashSet is much faster.',
}, '[3, 7, 1].contains(&7).to_string()');

add('slice/windows', 'windows', null, 'How slice::windows works', 'Every run of n neighbouring items; the windows overlap.', {
  call: '[1, 2, 3, 4].windows(2)', note: 'a window of 2 sliding one step', rows: [nums([1, 2, 3, 4])], outs: ['[1, 2]', '[2, 3]', '[3, 4]'],
  intro: 'windows(2) looks at 2 items at a time and slides one step to the right each time.',
  steps: [
    ['The first window: [1, 2].', [0, 1], 'o0'],
    ['It slides one step: [2, 3]. The 2 is used again.', [1, 2], 'o1', 'overlap'],
    ['[3, 4], and the window has reached the end.', [2, 3], 'o2'],
  ],
  result: '[1, 2], [2, 3], [3, 4]', resultCap: 'A slice of length n gives n - size + 1 windows. Great for comparing neighbours: w[1] - w[0].',
}, 'jd([1, 2, 3, 4].windows(2))');

add('slice/chunks', 'chunks', null, 'How slice::chunks works', 'Splits the slice into pieces of n items; the last piece may be shorter.', {
  call: '[1, 2, 3, 4, 5].chunks(2)', note: 'pieces that do not overlap', rows: [nums([1, 2, 3, 4, 5])], outs: ['[1, 2]', '[3, 4]', '[5]'],
  intro: 'chunks(2) cuts the slice into consecutive pieces of 2.',
  steps: [
    ['[1, 2].', [0, 1], 'o0'],
    ['[3, 4]. Unlike windows, no item is used twice.', [2, 3], 'o1'],
    ['Only 5 is left: the last chunk is just [5].', 4, 'o2', 'shorter last chunk'],
  ],
  result: '[1, 2], [3, 4], [5]', resultCap: 'Use chunks_exact if every piece must have exactly n items; the leftovers are then available separately.',
}, 'jd([1, 2, 3, 4, 5].chunks(2))');

add('slice/chunks_exact', 'chunks_exact', null, 'How slice::chunks_exact works', 'Pieces of exactly n items; leftovers are kept apart.', {
  call: '[1, 2, 3, 4, 5].chunks_exact(2)', note: 'only full pieces', rows: [nums([1, 2, 3, 4, 5])], outs: ['[1, 2]', '[3, 4]', 'remainder: [5]'],
  intro: 'chunks_exact(2) yields only pieces of exactly 2 items.',
  steps: [
    ['[1, 2].', [0, 1], 'o0'],
    ['[3, 4].', [2, 3], 'o1'],
    ['5 cannot make a full piece: it is not yielded, but .remainder() returns it.', 4, 'o2', 'not a full chunk'],
  ],
  result: '[1, 2], [3, 4]', resultCap: 'Because every chunk has the same length, the compiler can often make loops over chunks_exact faster.',
}, 'jd([1, 2, 3, 4, 5].chunks_exact(2))');

add('slice/split_at', 'split_at', null, 'How slice::split_at works', 'Divides a slice into two at an index; nothing is copied.', {
  call: '[1, 2, 3, 4].split_at(1)', note: 'left: index 0..1, right: 1..', rows: [nums([1, 2, 3, 4])], outs: ['[1]', '[2, 3, 4]'],
  intro: 'split_at(1) returns two views of the same memory: before index 1, and from index 1 on.',
  steps: [
    ['The left part ends just before index 1: [1].', 0, 'o0'],
    ['The right part starts at index 1: [2, 3, 4].', [1, 2, 3], 'o1'],
  ],
  result: '([1], [2, 3, 4])', resultCap: 'Both parts borrow the original slice. An index past the end panics; split_at_checked returns an Option instead.',
}, 'd([1, 2, 3, 4].split_at(1))');

add('slice/split_first', 'split_first', null, 'How slice::split_first works', 'The first item and the rest, or None if the slice is empty.', {
  call: '[1, 2, 3].split_first()', note: 'head and tail', rows: [nums([1, 2, 3])], outs: ['first: 1', 'rest: [2, 3]'],
  intro: 'split_first separates the first item from the others.',
  steps: [
    ['The first item: 1.', 0, 'o0'],
    ['The rest: [2, 3].', [1, 2], 'o1'],
  ],
  result: 'Some((1, [2, 3]))', resultCap: 'Handy in recursive code: if let Some((first, rest)) = s.split_first() { ... }.',
}, 'd([1, 2, 3].split_first())');

add('slice/binary_search', 'binary_search', null, 'How slice::binary_search works', 'Finds an item in a sorted slice by halving the search range each step.', {
  call: '[1, 3, 5, 7, 9, 11].binary_search(&9)', note: 'the slice must be sorted', rows: [nums([1, 3, 5, 7, 9, 11])], outs: ['Ok(4)'],
  intro: 'binary_search never looks at every item. It checks the middle and throws away the half that cannot contain 9.',
  steps: [
    ['The middle is 7. 9 > 7, so 9 can only be in the right half.', 3, null, '9 > 7 → right half', { mark: { dim: ['a0', 'a1', 'a2'] } }],
    ['The middle of what is left is 9: found at index 4.', 4, 'o0', '9 == 9'],
  ],
  result: 'Ok(4)', resultCap: 'If the item is missing, the result is Err(index where it would go): searching 4 gives Err(2). On an unsorted slice the result is meaningless.',
}, 'd([1, 3, 5, 7, 9, 11].binary_search(&9))');

add('slice/binary_search_by_key', 'binary_search_by_key', null, 'How slice::binary_search_by_key works', 'Binary search on a key of each item; the slice must be sorted by that key.', {
  call: 'people.binary_search_by_key(&30, |p| p.1)', note: 'people sorted by age', rows: [['("ann", 20)', '("bo", 30)', '("cy", 40)']], outs: ['Ok(1)'],
  intro: 'binary_search_by_key compares the key (here the age, p.1) instead of the whole item.',
  steps: [
    ['The middle person, bo, is 30: that is the age searched for.', 1, 'o0', '30 == 30'],
    ['Found at index 1.', [], null, 'Ok(1)'],
  ],
  result: 'Ok(1)', resultCap: 'The slice must be sorted by the same key, for example with sort_by_key(|p| p.1).',
}, 'let people = [("ann", 20), ("bo", 30), ("cy", 40)]; d(people.binary_search_by_key(&30, |p| p.1))');

add('slice/partition_point', 'partition_point', null, 'How slice::partition_point works', 'The index of the first item for which the test becomes false.', {
  call: '[1, 2, 3, 7, 8].partition_point(|x| *x < 5)', note: 'where would 5 go?', rows: [nums([1, 2, 3, 7, 8])], outs: ['3'],
  intro: 'All items that pass the test must come first. partition_point finds the border with a binary search.',
  steps: [
    ['1, 2 and 3 are < 5: they are before the border.', [0, 1, 2], null, 'true, true, true'],
    ['7 is the first item that is not < 5, at index 3.', 3, 'o0', 'false'],
  ],
  result: '3', resultCap: 'partition_point is the insertion index: v.insert(3, 5) keeps the slice sorted.',
}, '[1, 2, 3, 7, 8].partition_point(|x| *x < 5).to_string()');

add('slice/sort_unstable', 'sort_unstable', null, 'How slice::sort_unstable works', 'Sorts in place, fast; equal items may change order.', {
  call: 'let mut v = [3, 1, 2]; v.sort_unstable();', note: 'no extra memory', rows: [nums([3, 1, 2])], outs: [null, null, null],
  intro: 'sort_unstable rearranges the items inside the slice from smallest to largest.',
  steps: [
    ['1 is the smallest: it goes first.', 1, 'm0'],
    ['Then 2.', 2, 'm1'],
    ['And 3 last.', 0, 'm2'],
  ],
  result: '[1, 2, 3]', resultCap: '"Unstable" only means equal items may swap places. For plain numbers that is invisible, and it is faster than sort().',
}, 'let mut v = [3, 1, 2]; v.sort_unstable(); d(v)');

add('slice/sort_unstable_by_key', 'sort_unstable_by_key', null, 'How slice::sort_unstable_by_key works', 'Sorts by a computed key, in place.', {
  call: 'words.sort_unstable_by_key(|w| w.len());', note: 'shortest word first', rows: [['"pear"', '"fig"', '"banana"']], outs: [null, null, null],
  intro: 'The closure gives each item a key (its length); the items are ordered by those keys.',
  steps: [
    ['"fig" has the smallest key, 3.', 1, 'm0', 'len 3'],
    ['"pear": 4.', 0, 'm1', 'len 4'],
    ['"banana": 6.', 2, 'm2', 'len 6'],
  ],
  result: '["fig", "pear", "banana"]', resultCap: 'Use sort_by_key instead if words with the same length must keep their original order.',
}, 'let mut words = ["pear", "fig", "banana"]; words.sort_unstable_by_key(|w| w.len()); d(words)');

add('slice/reverse', 'reverse', null, 'How slice::reverse works', 'Reverses the order of the items in place.', {
  call: 'let mut v = [1, 2, 3, 4]; v.reverse();', note: 'swaps from both ends', rows: [nums([1, 2, 3, 4])], outs: [null, null, null, null],
  intro: 'reverse swaps the first and last item, then the second and second-to-last, until it meets in the middle.',
  steps: [
    ['1 and 4 trade places.', [0, 3], { move: { a0: 3, a3: 0 } }],
    ['2 and 3 trade places. The middle is reached.', [1, 2], { move: { a1: 2, a2: 1 } }],
  ],
  result: '[4, 3, 2, 1]', resultCap: 'reverse changes the slice itself. To read backwards without changing anything, use iter().rev().',
}, 'let mut v = [1, 2, 3, 4]; v.reverse(); d(v)');

add('slice/rotate_left', 'rotate_left', null, 'How slice::rotate_left works', 'Shifts every item n places left; the ones that fall off the front go to the back.', {
  call: 'let mut v = [1, 2, 3, 4, 5]; v.rotate_left(2);', note: 'like a conveyor belt', rows: [nums([1, 2, 3, 4, 5])], outs: [null, null, null, null, null],
  intro: 'rotate_left(2) moves everything 2 places to the left. The first 2 items wrap around to the end.',
  steps: [
    ['3, 4 and 5 move 2 places left.', [2, 3, 4], { move: { a2: 0, a3: 1, a4: 2 } }],
    ['1 and 2 fell off the front, so they go to the back.', [0, 1], { move: { a0: 3, a1: 4 } }, 'wrap around'],
  ],
  result: '[3, 4, 5, 1, 2]', resultCap: 'rotate_right(2) does the opposite: [4, 5, 1, 2, 3]. No items are lost or copied.',
}, 'let mut v = [1, 2, 3, 4, 5]; v.rotate_left(2); d(v)');

add('slice/swap', 'swap', null, 'How slice::swap works', 'Exchanges the items at two indexes.', {
  call: 'let mut v = ["a", "b", "c"]; v.swap(0, 2);', note: 'two indexes, one call', rows: [['"a"', '"b"', '"c"']], outs: [null, null, null],
  intro: 'swap(0, 2) trades the items at index 0 and index 2.',
  steps: [
    ['"a" and "c" change places.', [0, 2], { move: { a0: 2, a2: 0 } }],
    ['"b" does not move.', 1, 'm1'],
  ],
  result: '["c", "b", "a"]', resultCap: 'You cannot write std::mem::swap(&mut v[0], &mut v[2]) (two mutable borrows of v), which is why slices have their own swap.',
}, 'let mut v = ["a", "b", "c"]; v.swap(0, 2); d(v)');

add('slice/starts_with', 'starts_with', null, 'How slice::starts_with works', 'Checks whether the slice begins with the given items.', {
  call: '[1, 2, 3].starts_with(&[1, 2])', note: 'compares the front', rows: [nums([1, 2, 3]), nums([1, 2])], outs: ['true'],
  intro: 'starts_with compares the first items of the slice with the prefix, in order.',
  steps: [
    ['1 == 1.', ['a0', 'b0']],
    ['2 == 2. The whole prefix matched: true.', ['a1', 'b1'], 'o0'],
  ],
  result: 'true', resultCap: 'ends_with checks the back the same way. An empty prefix always matches.',
}, '[1, 2, 3].starts_with(&[1, 2]).to_string()');

add('slice/fill', 'fill', null, 'How slice::fill works', 'Overwrites every item with the same value.', {
  call: 'let mut v = [1, 2, 3]; v.fill(0);', note: 'same length, new values', rows: [nums([1, 2, 3])], outs: ['0', '0', '0'],
  intro: 'fill(0) writes 0 into every place of the slice.',
  steps: [
    ['Every item is replaced by 0.', [0, 1, 2], 'o0,1,2'],
    ['The length stays 3.', [], null, 'len 3'],
  ],
  result: '[0, 0, 0]', resultCap: 'Works on part of a slice too: v[1..].fill(0) gives [1, 0, 0].',
}, 'let mut v = [1, 2, 3]; v.fill(0); d(v)');

add('slice/iter', 'iter', null, 'How slice::iter works', 'An iterator over references to the items; the slice stays usable.', {
  call: 'for x in v.iter() { ... }   // v = vec![1, 2, 3]', note: 'borrowing, not moving', rows: [nums([1, 2, 3])], outs: ['&1', '&2', '&3'],
  intro: 'iter() lends out each item as a reference, &i32. The Vec keeps ownership.',
  steps: [
    ['x is &1: a reference to the first item.', 0, 'o0'],
    ['&2, &3.', [1, 2], 'o1,2'],
    ['After the loop, v can still be used: nothing was moved out.', [], null, 'v still owns 1, 2, 3'],
  ],
  result: '1, 2, 3', resultCap: 'for x in &v is the same as for x in v.iter(). Use iter_mut() to change items, into_iter() to take them.',
}, 'let v = vec![1, 2, 3]; let s = j(v.iter()); let _still = v.len(); s');

add('slice/sort', 'sort', ALLOC, 'How slice::sort works', 'Sorts in place from smallest to largest; equal items keep their order.', {
  call: 'let mut v = vec![5, 2, 9, 2]; v.sort();', note: 'changes v itself', rows: [nums([5, 2, 9, 2])], outs: [null, null, null, null],
  intro: 'sort() rearranges the items inside v, smallest first.',
  steps: [
    ['The two 2s are the smallest. sort is stable: the 2 that was first stays first.', [1, 3], { move: { a1: 0, a3: 1 } }, 'stable'],
    ['Then 5.', 0, 'm2'],
    ['And 9, the largest, last.', 2, 'm3'],
  ],
  result: '[2, 2, 5, 9]', resultCap: 'sort() returns nothing: it sorts v itself, so v must be mut. sort_unstable() is a little faster when the order of equal items does not matter.',
}, 'let mut v = vec![5, 2, 9, 2]; v.sort(); d(v)');

add('slice/sort_by', 'sort_by', ALLOC, 'How slice::sort_by works', 'Sorts with your own comparison, for example largest first.', {
  call: 'v.sort_by(|a, b| b.cmp(a));', note: 'b.cmp(a) reverses the order', rows: [nums([1, 3, 2])], outs: [null, null, null],
  intro: 'sort_by asks the closure how two items compare. Swapping a and b sorts from largest to smallest.',
  steps: [
    ['3 comes first.', 1, 'm0'],
    ['Then 2, then 1.', [2, 0], { move: { a2: 1, a0: 2 } }],
  ],
  result: '[3, 2, 1]', resultCap: 'For floats use a.partial_cmp(b).unwrap(), or f64::total_cmp, because floats have no cmp.',
}, 'let mut v = [1, 3, 2]; v.sort_by(|a, b| b.cmp(a)); d(v)');

add('slice/sort_by_key', 'sort_by_key', ALLOC, 'How slice::sort_by_key works', 'Sorts by a key computed for every item; stable.', {
  call: 'words.sort_by_key(|w| w.len());', note: 'shortest first, ties keep their order', rows: [['"pear"', '"fig"', '"kiwi"']], outs: [null, null, null],
  intro: 'sort_by_key orders the items by the key the closure returns: here, the length.',
  steps: [
    ['"fig" (3 letters) comes first.', 1, 'm0', 'len 3'],
    ['"pear" and "kiwi" both have 4 letters; "pear" was first, so it stays first.', [0, 2], { move: { a0: 1, a2: 2 } }, 'len 4, len 4'],
  ],
  result: '["fig", "pear", "kiwi"]', resultCap: 'The key is computed every time two items are compared; for an expensive key, use sort_by_cached_key.',
}, 'let mut words = ["pear", "fig", "kiwi"]; words.sort_by_key(|w| w.len()); d(words)');

add('slice/to_vec', 'to_vec', ALLOC, 'How slice::to_vec works', 'Copies a slice into a new Vec that you own.', {
  call: '[1, 2, 3][1..].to_vec()', note: 'a new, independent Vec', rows: [nums([1, 2, 3])], outs: ['2', '3'],
  intro: 'to_vec clones every item of the slice into new memory.',
  steps: [
    ['The slice [1..] is 2 and 3.', [1, 2], null, 'borrowed'],
    ['They are cloned into a new Vec, which can outlive and change independently of the original.', [], 'o0,1', 'owned'],
  ],
  result: '[2, 3]', resultCap: 'to_vec is how you turn a borrowed &[T] into an owned Vec<T>.',
}, 'd([1, 2, 3][1..].to_vec())');

add('slice/concat', 'concat', ALLOC, 'How slice::concat works', 'Joins a list of lists (or strings) into one.', {
  call: '[[1, 2], [3, 4]].concat()', note: 'one level flatter', rows: [['[1, 2]', '[3, 4]']], outs: ['1', '2', '3', '4'],
  intro: 'concat puts the inner lists one after the other into a new Vec.',
  steps: [
    ['[1, 2] first.', 0, 'o0,1'],
    ['Then [3, 4].', 1, 'o2,3'],
  ],
  result: '[1, 2, 3, 4]', resultCap: 'On strings it glues them together: ["ab", "cd"].concat() is "abcd".',
}, 'd([[1, 2], [3, 4]].concat())');

add('slice/join', 'join', ALLOC, 'How slice::join works', 'Joins strings (or lists) with a separator between them.', {
  call: '["a", "b", "c"].join(", ")', note: 'separator only between items', rows: [['"a"', '"b"', '"c"']], outs: ['"a, b, c"'],
  intro: 'join builds one String, putting ", " between neighbours but not at the ends.',
  steps: [
    ['"a", then ", ".', 0],
    ['"b", then ", ".', 1],
    ['"c": the last item gets no separator after it.', 2, 'o0'],
  ],
  result: '"a, b, c"', resultCap: 'For iterators of strings, collect into a Vec first, or use format! in a loop.',
}, 'd(["a", "b", "c"].join(", "))');

add('slice/repeat', 'repeat', ALLOC, 'How slice::repeat works', 'A new Vec with the slice repeated n times.', {
  call: '[1, 2].repeat(3)', note: 'copies the whole slice n times', rows: [nums([1, 2])], outs: ['1', '2', '1', '2', '1', '2'],
  intro: 'repeat(3) copies the slice three times in a row.',
  steps: [
    ['First copy.', [0, 1], 'o0,1'],
    ['Second copy.', [0, 1], 'o2,3'],
    ['Third copy.', [0, 1], 'o4,5'],
  ],
  result: '[1, 2, 1, 2, 1, 2]', resultCap: 'For a single value, vec![x; n] is simpler. Strings have their own repeat: "ab".repeat(3).',
}, 'd([1, 2].repeat(3))');

module.exports = list;
