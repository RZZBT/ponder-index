// Rust standard library: Vec (alloc::vec). Every result is computed again by truth/run.cjs ("rust std").
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['alloc', 'Vec', /vec\/mod\.rs$/] });

add('vec/push', 'push', null, 'How Vec::push works', 'Adds an item at the end; the Vec grows its storage when it is full.', {
  call: 'let mut v = vec![1, 2]; v.push(3);', note: 'always at the end', rows: [nums([1, 2])], outs: ['1', '2', '3'],
  intro: 'v holds 1 and 2. push(3) puts 3 after the last item.',
  steps: [
    ['The existing items stay where they are.', [0, 1], 'o0,1', 'len 2'],
    ['3 is written right after them. If the Vec has no spare room, it first moves everything to a bigger block of memory.', [], 'o2', 'len 3'],
  ],
  result: '[1, 2, 3]', resultCap: 'push is fast on average: the Vec reserves extra room when it grows (usually doubling), so most pushes need no move at all.',
}, 'let mut v = vec![1, 2]; v.push(3); d(v)');

add('vec/pop', 'pop', null, 'How Vec::pop works', 'Removes the last item and returns it as an Option.', {
  call: 'let mut v = vec![1, 2, 3]; v.pop()', note: 'takes from the end', rows: [nums([1, 2, 3])], outs: ['Some(3)'],
  intro: 'pop removes the last item and gives it back.',
  steps: [
    ['3 is the last item: it is taken out.', 2, 'x', 'v is now [1, 2]'],
    ['pop returns Some(3). On an empty Vec it would return None instead of crashing.', [], 'o0'],
  ],
  result: 'Some(3)', resultCap: 'push and pop together make a Vec a stack: the last item in is the first item out.',
}, 'let mut v = vec![1, 2, 3]; d(v.pop())');

add('vec/insert', 'insert', null, 'How Vec::insert works', 'Puts an item at a position; every later item shifts one place right.', {
  call: 'let mut v = vec![1, 3, 4]; v.insert(1, 2);', note: 'insert 2 at index 1', rows: [nums([1, 3, 4])], outs: [null, '2', null, null],
  intro: 'insert(1, 2) needs index 1 free, so everything from index 1 on has to move.',
  steps: [
    ['1 is before index 1: it stays.', 0, 'm0'],
    ['4 moves one place right first, then 3.', [2, 1], { move: { a2: 3, a1: 2 } }, 'shift right'],
    ['Index 1 is free now, and 2 is written there.', [], 'o1', 'v[1] = 2'],
  ],
  result: '[1, 2, 3, 4]', resultCap: 'insert near the front of a long Vec is slow, because every later item moves. Inserting at index len() is the same as push.',
}, 'let mut v = vec![1, 3, 4]; v.insert(1, 2); d(v)');

add('vec/remove', 'remove', null, 'How Vec::remove works', 'Takes the item at an index out; every later item shifts one place left.', {
  call: 'let mut v = vec!["a", "b", "c", "d"]; v.remove(1)', note: 'keeps the order', rows: [['"a"', '"b"', '"c"', '"d"']], outs: [null, null, null],
  intro: 'remove(1) takes out "b" and closes the gap.',
  steps: [
    ['"b" at index 1 is taken out and returned.', 1, 'x', 'returns "b"'],
    ['"a" stays in place.', 0, 'm0'],
    ['"c" and "d" each move one place left to close the gap.', [2, 3], { move: { a2: 1, a3: 2 } }, 'shift left'],
  ],
  result: '["a", "c", "d"]', resultCap: 'The order is kept, but every later item has to move. When order does not matter, swap_remove is faster.',
}, 'let mut v = vec!["a", "b", "c", "d"]; let _b = v.remove(1); d(v)');

add('vec/swap_remove', 'swap_remove', null, 'How Vec::swap_remove works', 'Removes an item by moving the last item into its place: fast, but the order changes.', {
  call: 'let mut v = vec!["a", "b", "c", "d"]; v.swap_remove(1)', note: 'the last item fills the hole', rows: [['"a"', '"b"', '"c"', '"d"']], outs: [null, null, null],
  intro: 'swap_remove(1) takes out "b", but instead of shifting, it fills the hole with the last item.',
  steps: [
    ['"b" is taken out and returned.', 1, 'x', 'returns "b"'],
    ['"a" and "c" do not move.', [0, 2], { move: { a0: 0, a2: 2 } }],
    ['"d", the last item, jumps into the hole at index 1.', 3, 'm1', 'one move instead of many'],
  ],
  result: '["a", "d", "c"]', resultCap: 'Only one item moves, however long the Vec is. Use it when you do not care about order.',
}, 'let mut v = vec!["a", "b", "c", "d"]; let _b = v.swap_remove(1); d(v)');

add('vec/extend', 'extend', null, 'How Vec::extend works', 'Appends every item of an iterator.', {
  call: 'let mut v = vec![1, 2]; v.extend([3, 4]);', note: 'many pushes at once', rows: [nums([1, 2]), nums([3, 4])], outs: [null, null, null, null],
  intro: 'extend adds all items of the other collection to the end, in order.',
  steps: [
    ['v keeps 1 and 2.', ['a0', 'a1'], { move: { a0: 0, a1: 1 } }],
    ['3 and 4 are added after them.', ['b0', 'b1'], { move: { b0: 2, b1: 3 } }],
  ],
  result: '[1, 2, 3, 4]', resultCap: 'extend works with any iterator, so v.extend(other.iter().filter(...)) is fine too. It reserves room once instead of growing at every push.',
}, 'let mut v = vec![1, 2]; v.extend([3, 4]); d(v)');

add('vec/append', 'append', null, 'How Vec::append works', 'Moves all items of another Vec to the end, leaving the other one empty.', {
  call: 'a.append(&mut b);', note: 'a = [1, 2], b = [3]', rows: [nums([1, 2]), ['3']], rowNames: ['a', 'b'], outs: [null, null, null],
  intro: 'append moves the items out of b and into the end of a.',
  steps: [
    ['a keeps its items.', ['a0', 'a1'], { move: { a0: 0, a1: 1 } }],
    ['3 is moved from b to the end of a.', ['b0'], { move: { b0: 2 } }, 'b is now empty'],
  ],
  result: 'a = [1, 2, 3], b = []', resultCap: 'Unlike extend, append empties the other Vec instead of copying from it. b still exists and can be reused.',
}, 'let mut a = vec![1, 2]; let mut b = vec![3]; a.append(&mut b); format!("a = {:?}, b = {:?}", a, b)');

add('vec/truncate', 'truncate', null, 'How Vec::truncate works', 'Keeps the first n items and drops the rest.', {
  call: 'let mut v = vec![1, 2, 3, 4]; v.truncate(2);', note: 'shorten to 2 items', rows: [nums([1, 2, 3, 4])], outs: [null, null],
  intro: 'truncate(2) keeps items 0 and 1 and drops everything after them.',
  steps: [
    ['1 and 2 are kept.', [0, 1], { move: { a0: 0, a1: 1 } }],
    ['3 and 4 are dropped.', [2, 3], 'x', 'dropped'],
  ],
  result: '[1, 2]', resultCap: 'If n is not smaller than the length, truncate does nothing. The capacity stays the same.',
}, 'let mut v = vec![1, 2, 3, 4]; v.truncate(2); d(v)');

add('vec/retain', 'retain', null, 'How Vec::retain works', 'Keeps only the items for which the closure returns true, in place.', {
  call: 'let mut v = vec![1, 2, 3, 4]; v.retain(|x| x % 2 == 0);', note: 'filter, but inside the Vec', rows: [nums([1, 2, 3, 4])], outs: [null, null],
  intro: 'retain checks every item and removes the ones that fail, keeping the order of the rest.',
  steps: [
    ['1 is odd: removed.', 0, 'x', 'false'],
    ['2 is even: kept.', 1, 'm0', 'true'],
    ['3 is odd: removed.', 2, 'x', 'false'],
    ['4 is even: kept.', 3, 'm1', 'true'],
  ],
  result: '[2, 4]', resultCap: 'retain changes the Vec itself. To keep the original, use iter().filter(...).collect() instead.',
}, 'let mut v = vec![1, 2, 3, 4]; v.retain(|x| x % 2 == 0); d(v)');

add('vec/dedup', 'dedup', null, 'How Vec::dedup works', 'Removes repeated items that sit next to each other.', {
  call: 'let mut v = vec![1, 1, 2, 1]; v.dedup();', note: 'only neighbours count', rows: [nums([1, 1, 2, 1])], outs: [null, null, null],
  intro: 'dedup compares each item with the one before it and removes it if they are equal.',
  steps: [
    ['The first 1 is kept.', 0, 'm0'],
    ['The second 1 equals its neighbour: removed.', 1, 'x', '1 == 1'],
    ['2 differs from 1: kept.', 2, 'm1', '1 != 2'],
    ['The last 1 differs from its neighbour 2, so it stays, even though there was a 1 before.', 3, 'm2', '2 != 1'],
  ],
  result: '[1, 2, 1]', resultCap: 'To remove all duplicates, sort first: v.sort(); v.dedup(); gives [1, 2].',
}, 'let mut v = vec![1, 1, 2, 1]; v.dedup(); d(v)');

add('vec/dedup_by_key', 'dedup_by_key', null, 'How Vec::dedup_by_key works', 'Removes neighbours whose computed keys are equal.', {
  call: 'let mut v = vec![10, 11, 20, 21, 30]; v.dedup_by_key(|x| *x / 10);', note: 'neighbours in the same ten', rows: [nums([10, 11, 20, 21, 30])], outs: [null, null, null],
  intro: 'dedup_by_key compares keys (here x / 10) instead of the items themselves.',
  steps: [
    ['10 has key 1: kept.', 0, 'm0', 'key 1'],
    ['11 also has key 1, like its neighbour: removed.', 1, 'x', 'key 1 again'],
    ['20 has key 2: kept. 21 has key 2 too: removed.', [2, 3], { move: { a2: 1 }, mark: { danger: ['a3'] } }, 'key 2, key 2'],
    ['30 has key 3: kept.', 4, 'm2', 'key 3'],
  ],
  result: '[10, 20, 30]', resultCap: 'The first item of each run of equal keys is kept.',
}, 'let mut v = vec![10, 11, 20, 21, 30]; v.dedup_by_key(|x| *x / 10); d(v)');

add('vec/drain', 'drain', null, 'How Vec::drain works', 'Removes a range of items and gives them back as an iterator.', {
  call: 'let mut v = vec![1, 2, 3, 4]; let taken: Vec<_> = v.drain(1..3).collect();', note: 'take out indexes 1 and 2', rows: [nums([1, 2, 3, 4])], outs: ['taken: [2, 3]', 'v: [1, 4]'],
  intro: 'drain(1..3) cuts out the items at index 1 and 2.',
  steps: [
    ['2 and 3 are in the range 1..3: they are taken out.', [1, 2], 'o0', 'drained'],
    ['1 and 4 remain in v, and the gap is closed.', [0, 3], 'o1'],
  ],
  result: 'taken = [2, 3], v = [1, 4]', resultCap: 'drain(..) empties the whole Vec but keeps its memory, which is handy for reusing a buffer.',
}, 'let mut v = vec![1, 2, 3, 4]; let taken: Vec<_> = v.drain(1..3).collect(); format!("taken = {:?}, v = {:?}", taken, v)');

add('vec/split_off', 'split_off', null, 'How Vec::split_off works', 'Cuts the Vec in two at an index and returns the second part.', {
  call: 'let mut v = vec![1, 2, 3, 4]; let tail = v.split_off(1);', note: 'everything from index 1 on', rows: [nums([1, 2, 3, 4])], outs: ['v: [1]', 'tail: [2, 3, 4]'],
  intro: 'split_off(1) moves the items from index 1 to the end into a new Vec.',
  steps: [
    ['1 stays in v.', 0, 'o0'],
    ['2, 3 and 4 move to the new Vec, which split_off returns.', [1, 2, 3], 'o1'],
  ],
  result: 'v = [1], tail = [2, 3, 4]', resultCap: 'split_off(0) moves everything; split_off(len) returns an empty Vec. An index past the end panics.',
}, 'let mut v = vec![1, 2, 3, 4]; let tail = v.split_off(1); format!("v = {:?}, tail = {:?}", v, tail)');

add('vec/resize', 'resize', null, 'How Vec::resize works', 'Makes the Vec exactly n long: pads with a value or cuts off the end.', {
  call: 'let mut v = vec![1, 2]; v.resize(4, 0);', note: 'pad with 0 up to length 4', rows: [nums([1, 2])], outs: ['1', '2', '0', '0'],
  intro: 'resize(4, 0) wants 4 items. v has 2, so two copies of 0 are added.',
  steps: [
    ['The existing items stay.', [0, 1], 'o0,1', 'len 2'],
    ['Copies of 0 are pushed until the length is 4.', [], 'o2,3', 'len 4'],
  ],
  result: '[1, 2, 0, 0]', resultCap: 'With a smaller length, resize works like truncate: v.resize(1, 0) gives [1].',
}, 'let mut v = vec![1, 2]; v.resize(4, 0); d(v)');

add('vec/clear', 'clear', null, 'How Vec::clear works', 'Removes every item but keeps the allocated memory.', {
  call: 'let mut v = vec![1, 2, 3]; v.clear();', note: 'length 0, capacity unchanged', rows: [nums([1, 2, 3])], outs: ['len 0'],
  intro: 'clear drops all items at once.',
  steps: [
    ['All three items are dropped.', [0, 1, 2], 'x', 'len 3 → 0'],
    ['The memory is kept, so pushing new items later needs no new allocation.', [], 'o0', 'capacity stays'],
  ],
  result: '[]', resultCap: 'clear is the cheap way to reuse a Vec in a loop. To give the memory back too, follow it with shrink_to_fit().',
}, 'let mut v = vec![1, 2, 3]; v.clear(); d(v)');

add('vec/len', 'len', null, 'How Vec::len works', 'The number of items in the Vec.', {
  call: 'vec![10, 20, 30].len()', note: 'instant: the Vec stores it', rows: [nums([10, 20, 30])], outs: ['3'],
  intro: 'A Vec always knows how many items it holds.',
  steps: [
    ['There are three items, at indexes 0, 1 and 2.', [0, 1, 2], null, 'indexes 0..3'],
    ['len() returns 3 without counting: the number is stored next to the items.', [], 'o0'],
  ],
  result: '3', resultCap: 'The last valid index is len() - 1. Use is_empty() rather than len() == 0.',
}, 'vec![10, 20, 30].len().to_string()');

add('vec/with_capacity', 'with_capacity', null, 'How Vec::with_capacity works', 'Creates an empty Vec with room reserved for n items.', {
  call: 'let mut v = Vec::with_capacity(4); v.push(1); v.push(2);', note: 'length vs capacity', rows: [['□', '□', '□', '□']], outs: ['len 2', 'capacity 4'],
  intro: 'with_capacity(4) reserves room for 4 items up front. The Vec is still empty: its length is 0.',
  steps: [
    ['push(1) and push(2) use two of the reserved places. No allocation happens.', [0, 1], null, 'len 2'],
    ['Two places are still free, so the next two pushes are free too.', [2, 3], 'o0,1', 'capacity 4'],
  ],
  result: 'len = 2, capacity = 4', resultCap: 'If you know roughly how many items are coming, with_capacity avoids repeated moves while the Vec grows.',
}, 'let mut v: Vec<i32> = Vec::with_capacity(4); v.push(1); v.push(2); format!("len = {}, capacity = {}", v.len(), v.capacity())');

add('vec/extend_from_slice', 'extend_from_slice', null, 'How Vec::extend_from_slice works', 'Appends clones of every item in a slice.', {
  call: 'let mut v = vec![1]; v.extend_from_slice(&[2, 3]);', note: 'the slice itself is not changed', rows: [['1'], nums([2, 3])], outs: ['1', '2', '3'],
  intro: 'extend_from_slice copies the items of the slice to the end of v.',
  steps: [
    ['v starts with 1.', 'a0', 'o0'],
    ['2 and 3 are copied in. The slice still has them too.', ['b0', 'b1'], 'o1,2'],
  ],
  result: '[1, 2, 3]', resultCap: 'Use it with a slice of Clone items; for any iterator, use extend.',
}, 'let mut v = vec![1]; v.extend_from_slice(&[2, 3]); d(v)');

add('vec/into_iter', 'into_iter', null, 'How Vec::into_iter works', 'Turns the Vec into an iterator of owned items: the Vec is used up.', {
  call: 'for s in v { ... }   // v = vec![String::from("a"), String::from("b")]', note: 'a for loop over v (not &v)', rows: [['"a"', '"b"']], outs: ['s = "a"', 's = "b"'],
  intro: 'for s in v calls v.into_iter(). Each item is moved out of the Vec, so s owns it.',
  steps: [
    ['"a" is moved out of v into s.', 0, 'o0', 'moved'],
    ['"b" is moved out too.', 1, 'o1', 'moved'],
    ['After the loop v no longer exists: using it would be a compile error ("value moved").', [], null, 'v is gone'],
  ],
  result: '"a", "b"', resultCap: 'Write for s in &v to only borrow the items (s is &String) and keep v usable afterwards.',
}, 'let v = vec![String::from("a"), String::from("b")]; jd(v.into_iter())');

module.exports = list;
