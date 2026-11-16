// Rust standard library: the rest of VecDeque, BinaryHeap and LinkedList, plus a few Vec extras.
const { group, nums } = require('./kit.cjs');
const DQ = ['alloc', 'VecDeque', /vec_deque\/mod\.rs$/];
const HEAP = ['alloc', 'BinaryHeap', /binary_heap\/mod\.rs$/];
const LL = ['alloc', 'LinkedList', /linked_list\.rs$/];
const VEC = ['alloc', 'Vec', /vec\/mod\.rs$/];
const { list, add } = group({ at: DQ });
const LLN = 'std::collections::LinkedList';

// ---------------------------------------------------------------- VecDeque

add('vecdeque/iter_mut', 'iter_mut', null, 'How VecDeque::iter_mut works', 'Visits every element front to back, mutably.', {
  rows: [nums([1, 2, 3])], call: 'for x in q.iter_mut() { *x *= 10; }', note: 'edit in place', outs: ['10', '20', '30'],
  intro: 'Works even when the ring buffer wraps around.',
  steps: [['Each element is lent mutably.', [0, 1, 2]], ['All are multiplied by 10.', [], 'o0,1,2']],
  result: '[10, 20, 30]', resultCap: 'iter() is the read-only version.',
}, 'let mut q = VecDeque::from([1, 2, 3]); for x in q.iter_mut() { *x *= 10; } d(q)');

add('vecdeque/as_mut_slices', 'as_mut_slices', null, 'How VecDeque::as_mut_slices works', 'The contents as two mutable slices (the ring buffer may wrap).', {
  rows: [['front part', 'back part']], call: 'let (a, b) = q.as_mut_slices();', note: 'edit both halves', outs: ['all elements reachable'],
  intro: 'Together the two slices hold every element in order.',
  steps: [['Change elements through either slice.', [0, 1]], ['The deque sees the changes.', [], 'o0']],
  result: '[0, 0, 0]', resultCap: 'make_contiguous gives a single slice instead.',
}, 'let mut q = VecDeque::from([1, 2]); q.push_front(3); { let (a, b) = q.as_mut_slices(); for x in a.iter_mut().chain(b.iter_mut()) { *x = 0; } } d(q)');

add('vecdeque/binary_search_by', 'binary_search_by', null, 'How VecDeque::binary_search_by works', 'Binary search in a sorted deque with your own comparison.', {
  rows: [['"ant"', '"bee"', '"cat"']], call: 'q.binary_search_by(|w| w.cmp(&"bee"))', note: 'sorted deque', outs: ['Ok(1)'],
  intro: 'The closure compares each probed element with the target.',
  steps: [['The middle is "bee": Equal.', 1], ['Ok(1).', [], 'o0']],
  result: 'Ok(1)', resultCap: 'Err(i) tells where to insert to keep order.',
}, 'let q = VecDeque::from(["ant", "bee", "cat"]); d(q.binary_search_by(|w| w.cmp(&"bee")))');

add('vecdeque/binary_search_by_key', 'binary_search_by_key', null, 'How VecDeque::binary_search_by_key works', 'Binary search on a key extracted from each element.', {
  rows: [['(1, "a")', '(5, "b")', '(9, "c")']], call: 'q.binary_search_by_key(&5, |p| p.0)', note: 'sorted by the first field', outs: ['Ok(1)'],
  intro: 'The deque must be sorted by that key.',
  steps: [['Keys are 1, 5, 9.', [0, 1, 2]], ['5 is at index 1.', 1, 'o0']],
  result: 'Ok(1)', resultCap: 'Good for time-ordered event queues.',
}, 'let q = VecDeque::from([(1, "a"), (5, "b"), (9, "c")]); d(q.binary_search_by_key(&5, |p| p.0))');

add('vecdeque/partition_point', 'partition_point', null, 'How VecDeque::partition_point works', 'The index of the first element for which the test becomes false.', {
  rows: [nums([1, 3, 5, 8, 10])], call: 'q.partition_point(|&x| x < 6)', note: 'where would 6 go?', outs: ['3'],
  intro: 'The deque must be split: all trues first, then all falses.',
  steps: [['1, 3, 5 are < 6.', [0, 1, 2]], ['8 is the first that is not: index 3.', 3, 'o0']],
  result: '3', resultCap: 'A binary search, so it is fast on big deques.',
}, 'VecDeque::from([1, 3, 5, 8, 10]).partition_point(|&x| x < 6).to_string()');

add('vecdeque/pop_front_if', 'pop_front_if', null, 'How VecDeque::pop_front_if works', 'Removes the front element only if it passes a test.', {
  rows: [nums([2, 7])], call: 'q.pop_front_if(|x| *x % 2 == 0)', note: 'conditional dequeue', outs: ['Some(2)', 'then None (7 is odd)'],
  intro: 'Handy to drain items that are ready, stopping at the first that is not.',
  steps: [['2 passes: removed.', 0, 'o0'], ['7 fails: stays.', 1, 'o1']],
  result: 'Some(2), None', resultCap: 'pop_back_if works at the other end.',
}, 'let mut q = VecDeque::from([2, 7]); format!("{:?}, {:?}", q.pop_front_if(|x| *x % 2 == 0), q.pop_front_if(|x| *x % 2 == 0))');

add('vecdeque/pop_back_if', 'pop_back_if', null, 'How VecDeque::pop_back_if works', 'Removes the back element only if it passes a test.', {
  rows: [nums([1, 9])], call: 'q.pop_back_if(|x| *x > 5)', note: 'conditional pop', outs: ['Some(9)'],
  intro: 'Looks at the last element first.',
  steps: [['9 > 5: removed.', 1], ['Some(9).', [], 'o0']],
  result: 'Some(9)', resultCap: 'Vec::pop_if is the Vec equivalent.',
}, 'let mut q = VecDeque::from([1, 9]); d(q.pop_back_if(|x| *x > 5))');

add('vecdeque/range_mut', 'range_mut', null, 'How VecDeque::range_mut works', 'Mutable access to a range of positions.', {
  rows: [nums([0, 0, 0, 0])], call: 'for x in q.range_mut(1..3) { *x = 7; }', note: 'edit a window', outs: ['0', '7', '7', '0'],
  intro: 'Positions count from the front.',
  steps: [['Positions 1 and 2.', [1, 2]], ['They become 7.', [], 'o0,1,2,3']],
  result: '[0, 7, 7, 0]', resultCap: 'range() is the read-only version.',
}, 'let mut q = VecDeque::from([0, 0, 0, 0]); for x in q.range_mut(1..3) { *x = 7; } d(q)');

add('vecdeque/capacity', 'capacity', null, 'How VecDeque::capacity works', 'How many elements fit before the deque must grow.', {
  rows: [['with_capacity(10), 2 pushed']], call: 'q.capacity()', note: 'room vs. use', outs: ['≥ 10'],
  intro: 'len counts elements; capacity counts room.',
  steps: [['2 elements stored.', 0], ['Room for at least 10.', [], 'o0']],
  result: 'true', resultCap: 'Growing doubles the buffer, like Vec.',
}, 'let mut q = VecDeque::with_capacity(10); q.push_back(1); q.push_back(2); (q.capacity() >= 10).to_string()');

add('vecdeque/reserve', 'reserve', null, 'How VecDeque::reserve works', 'Makes room for at least n more elements.', {
  rows: [['empty deque']], call: 'q.reserve(32)', note: 'before a burst', outs: ['capacity ≥ 32'],
  intro: 'One allocation now instead of several later.',
  steps: [['Room for 32 is requested.', 0], ['Capacity is at least 32.', [], 'o0']],
  result: 'true', resultCap: 'reserve_exact avoids over-allocating.',
}, 'let mut q: VecDeque<i32> = VecDeque::new(); q.reserve(32); (q.capacity() >= 32).to_string()');

add('vecdeque/reserve_exact', 'reserve_exact', null, 'How VecDeque::reserve_exact works', 'Reserves room for exactly n more elements.', {
  rows: [['empty deque']], call: 'q.reserve_exact(5)', note: 'no extra headroom', outs: ['capacity ≥ 5'],
  intro: 'Use it when the final size is known.',
  steps: [['Room for 5.', 0], ['Capacity is at least 5.', [], 'o0']],
  result: 'true', resultCap: 'The allocator may still round up.',
}, 'let mut q: VecDeque<i32> = VecDeque::new(); q.reserve_exact(5); (q.capacity() >= 5).to_string()');

add('vecdeque/shrink_to_fit', 'shrink_to_fit', null, 'How VecDeque::shrink_to_fit works', 'Releases spare capacity.', {
  rows: [['2 elements, capacity 100']], call: 'q.shrink_to_fit()', note: 'give memory back', outs: ['small capacity'],
  intro: 'Useful after a queue was temporarily very full.',
  steps: [['Most room is unused.', 0], ['It is released.', [], 'o0']],
  result: 'true', resultCap: 'Elements stay in order.',
}, 'let mut q: VecDeque<i32> = VecDeque::with_capacity(100); q.push_back(1); q.push_back(2); q.shrink_to_fit(); (q.capacity() < 100).to_string()');

add('vecdeque/shrink_to', 'shrink_to', null, 'How VecDeque::shrink_to works', 'Reduces capacity, keeping a minimum.', {
  rows: [['1 element, capacity 100']], call: 'q.shrink_to(16)', note: 'keep headroom', outs: ['16 ≤ capacity < 100'],
  intro: 'Like shrink_to_fit with a floor.',
  steps: [['Room shrinks...', 0], ['...but not below 16.', [], 'o0']],
  result: 'true', resultCap: 'Never below len.',
}, 'let mut q: VecDeque<i32> = VecDeque::with_capacity(100); q.push_back(1); q.shrink_to(16); (q.capacity() >= 16 && q.capacity() < 100).to_string()');

add('vecdeque/try_reserve', 'try_reserve', null, 'How VecDeque::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 'q.try_reserve(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'Impossible sizes become an Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve_exact skips the extra headroom.',
}, 'let mut q: VecDeque<u64> = VecDeque::new(); let a = q.try_reserve(10).is_ok(); let b = q.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('vecdeque/try_reserve_exact', 'try_reserve_exact', null, 'How VecDeque::try_reserve_exact works', 'try_reserve without extra headroom.', {
  rows: [['4']], call: 'q.try_reserve_exact(4)', note: 'exact, recoverable', outs: ['Ok, capacity ≥ 4'],
  intro: 'Asks for just enough room, and reports failure.',
  steps: [['Room for 4 is requested.', 0], ['Ok.', [], 'o0']],
  result: 'Ok, true', resultCap: 'Vec and String have the same method.',
}, 'let mut q: VecDeque<i32> = VecDeque::new(); let r = q.try_reserve_exact(4).is_ok(); format!("{}, {}", if r { "Ok" } else { "Err" }, q.capacity() >= 4)');

add('vecdeque/resize_with', 'resize_with', null, 'How VecDeque::resize_with works', 'Grows or shrinks to a length, creating new elements with a closure.', {
  rows: [nums([1])], call: 'let mut n = 1; q.resize_with(3, || { n += 1; n });', note: 'new items from a function', outs: ['1', '2', '3'],
  intro: 'New elements are added at the back.',
  steps: [['1 stays.', 0, 'o0'], ['2 and 3 are created.', [], 'o1,2']],
  result: '[1, 2, 3]', resultCap: 'resize(len, value) clones one value instead.',
}, 'let mut q = VecDeque::from([1]); let mut n = 1; q.resize_with(3, || { n += 1; n }); d(q)');

add('vecdeque/retain_mut', 'retain_mut', null, 'How VecDeque::retain_mut works', 'Keeps elements that pass a test; the test may also change them.', {
  rows: [nums([1, 2, 3, 4])], call: 'q.retain_mut(|x| { *x *= 10; *x > 15 })', note: 'filter and edit together', outs: ['20', '30', '40'],
  intro: 'Every element is visited once and may be changed before the decision.',
  steps: [['1 becomes 10 and fails.', 0, 'x'], ['2, 3, 4 become 20, 30, 40 and stay.', [1, 2, 3], 'o0,1,2']],
  result: '[20, 30, 40]', resultCap: 'retain only gets a shared reference.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); q.retain_mut(|x| { *x *= 10; *x > 15 }); d(q)');

add('vecdeque/swap_remove_back', 'swap_remove_back', null, 'How VecDeque::swap_remove_back works', 'Removes an element by moving the last element into its place.', {
  rows: [['"a"', '"b"', '"c"', '"d"']], call: 'q.swap_remove_back(1)', note: 'fast, changes order', outs: ['Some("b")', '["a", "d", "c"]'],
  intro: 'No shifting: the back element fills the hole.',
  steps: [['"b" is removed.', 1, 'x'], ['"d" moves into its place.', 3, 'o0,1']],
  result: 'Some("b"), ["a", "d", "c"]', resultCap: 'Use it when order does not matter.',
}, 'let mut q = VecDeque::from(["a", "b", "c", "d"]); let r = q.swap_remove_back(1); format!("{:?}, {:?}", r, q)');

add('vecdeque/swap_remove_front', 'swap_remove_front', null, 'How VecDeque::swap_remove_front works', 'Removes an element by moving the front element into its place.', {
  rows: [['"a"', '"b"', '"c"', '"d"']], call: 'q.swap_remove_front(2)', note: 'fast, changes order', outs: ['Some("c")', '["b", "a", "d"]'],
  intro: 'The front element fills the hole.',
  steps: [['"c" is removed.', 2, 'x'], ['"a" moves into its place.', 0, 'o0,1']],
  result: 'Some("c"), ["b", "a", "d"]', resultCap: 'Vec::swap_remove uses the back.',
}, 'let mut q = VecDeque::from(["a", "b", "c", "d"]); let r = q.swap_remove_front(2); format!("{:?}, {:?}", r, q)');

// ---------------------------------------------------------------- BinaryHeap

add('binaryheap/with_capacity', 'with_capacity', HEAP, 'How BinaryHeap::with_capacity works', 'An empty heap with room for n elements.', {
  rows: [['with_capacity(16)']], call: 'BinaryHeap::<i32>::with_capacity(16)', note: 'pre-allocate', outs: ['room ≥ 16'],
  intro: 'Avoids growth while the queue fills.',
  steps: [['Room for 16.', 0], ['Still empty.', [], 'o0']],
  result: 'true', resultCap: 'Same idea as Vec::with_capacity.',
}, '(BinaryHeap::<i32>::with_capacity(16).capacity() >= 16).to_string()');

add('binaryheap/as_slice', 'as_slice', HEAP, 'How BinaryHeap::as_slice works', 'The elements in internal heap order, as a slice.', {
  rows: [['heap of 1, 5, 3']], call: 'h.as_slice()', note: 'max first, rest not sorted', outs: ['[5, …]'],
  intro: 'The first element is always the maximum.',
  steps: [['The buffer is shown as it is.', 0], ['Index 0 holds 5.', [], 'o0']],
  result: 'first = 5, len = 3', resultCap: 'For sorted output use into_sorted_vec.',
}, 'let h = BinaryHeap::from(vec![1, 5, 3]); let s = h.as_slice(); format!("first = {}, len = {}", s[0], s.len())');

add('binaryheap/capacity', 'capacity', HEAP, 'How BinaryHeap::capacity works', 'How many elements fit before the heap grows.', {
  rows: [['3 elements']], call: 'h.capacity()', note: 'always ≥ len', outs: ['≥ 3'],
  intro: 'Room vs. use.',
  steps: [['3 elements.', 0], ['Capacity at least 3.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to_fit releases spare room.',
}, '(BinaryHeap::from(vec![1, 2, 3]).capacity() >= 3).to_string()');

add('binaryheap/reserve', 'reserve', HEAP, 'How BinaryHeap::reserve works', 'Makes room for at least n more elements.', {
  rows: [['empty heap']], call: 'h.reserve(100)', note: 'before many pushes', outs: ['capacity ≥ 100'],
  intro: 'One allocation up front.',
  steps: [['Room for 100.', 0], ['Capacity at least 100.', [], 'o0']],
  result: 'true', resultCap: 'reserve_exact avoids headroom.',
}, 'let mut h: BinaryHeap<i32> = BinaryHeap::new(); h.reserve(100); (h.capacity() >= 100).to_string()');

add('binaryheap/reserve_exact', 'reserve_exact', HEAP, 'How BinaryHeap::reserve_exact works', 'Reserves room for exactly n more elements.', {
  rows: [['empty heap']], call: 'h.reserve_exact(7)', note: 'exact', outs: ['capacity ≥ 7'],
  intro: 'For known final sizes.',
  steps: [['Room for 7.', 0], ['Capacity at least 7.', [], 'o0']],
  result: 'true', resultCap: 'The allocator may still round up.',
}, 'let mut h: BinaryHeap<i32> = BinaryHeap::new(); h.reserve_exact(7); (h.capacity() >= 7).to_string()');

add('binaryheap/shrink_to_fit', 'shrink_to_fit', HEAP, 'How BinaryHeap::shrink_to_fit works', 'Releases spare capacity.', {
  rows: [['1 element, capacity 100']], call: 'h.shrink_to_fit()', note: 'give memory back', outs: ['small capacity'],
  intro: 'After a burst of work, give memory back.',
  steps: [['Most room is unused.', 0], ['Released.', [], 'o0']],
  result: 'true', resultCap: 'Elements are untouched.',
}, 'let mut h: BinaryHeap<i32> = BinaryHeap::with_capacity(100); h.push(1); h.shrink_to_fit(); (h.capacity() < 100).to_string()');

add('binaryheap/shrink_to', 'shrink_to', HEAP, 'How BinaryHeap::shrink_to works', 'Reduces capacity, keeping a minimum.', {
  rows: [['1 element, capacity 100']], call: 'h.shrink_to(10)', note: 'keep headroom', outs: ['10 ≤ capacity < 100'],
  intro: 'shrink_to_fit with a floor.',
  steps: [['Room shrinks...', 0], ['...but stays ≥ 10.', [], 'o0']],
  result: 'true', resultCap: 'Never below len.',
}, 'let mut h: BinaryHeap<i32> = BinaryHeap::with_capacity(100); h.push(1); h.shrink_to(10); (h.capacity() >= 10 && h.capacity() < 100).to_string()');

add('binaryheap/try_reserve', 'try_reserve', HEAP, 'How BinaryHeap::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 'h.try_reserve(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'Impossible sizes become an Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve_exact avoids headroom.',
}, 'let mut h: BinaryHeap<u64> = BinaryHeap::new(); let a = h.try_reserve(10).is_ok(); let b = h.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('binaryheap/try_reserve_exact', 'try_reserve_exact', HEAP, 'How BinaryHeap::try_reserve_exact works', 'try_reserve without headroom.', {
  rows: [['3']], call: 'h.try_reserve_exact(3)', note: 'exact, recoverable', outs: ['Ok'],
  intro: 'Asks for just enough room.',
  steps: [['Room for 3.', 0], ['Ok.', [], 'o0']],
  result: 'Ok', resultCap: 'Same pattern on Vec and String.',
}, 'let mut h: BinaryHeap<i32> = BinaryHeap::new(); (if h.try_reserve_exact(3).is_ok() { "Ok" } else { "Err" }).to_string()');

add('peekmut/pop', 'pop', ['alloc', 'PeekMut', /binary_heap\/mod\.rs$/], 'How PeekMut::pop works', 'Removes the top element you are peeking at.', {
  rows: [['heap 9, 4']], call: 'if let Some(top) = h.peek_mut() { if *top > 5 { PeekMut::pop(top); } }', note: 'look, decide, remove', outs: ['removed 9', 'new top 4'],
  intro: 'Peek, check, and pop in one lookup.',
  steps: [['The top is 9 > 5.', 0], ['It is popped; 4 is on top.', [], 'o0,1']],
  result: 'Some(9), Some(4)', resultCap: 'Useful for "pop while the top is ready".',
}, 'use std::collections::binary_heap::PeekMut; let mut h = BinaryHeap::from(vec![9, 4]); let mut p = None; if let Some(top) = h.peek_mut() { if *top > 5 { p = Some(PeekMut::pop(top)); } } format!("{:?}, {:?}", p, h.peek())');

// ---------------------------------------------------------------- LinkedList

add('linkedlist/new', 'new', LL, 'How LinkedList::new works', 'An empty doubly linked list.', {
  rows: [['LinkedList::new()']], call: 'let mut l = LinkedList::new(); l.push_back(1);', note: 'no allocation yet', outs: ['[1]'],
  intro: 'Each push allocates one node.',
  steps: [['The list starts empty.', 0], ['After push_back: [1].', [], 'o0']],
  result: '[1]', resultCap: 'Prefer Vec or VecDeque unless you need O(1) splitting and joining.',
}, `let mut l = ${LLN}::new(); l.push_back(1); d(l)`);

add('linkedlist/back', 'back', LL, 'How LinkedList::back works', 'The last element, without removing it.', {
  rows: [['[1, 2, 3]']], call: 'l.back()', note: 'peek at the tail', outs: ['Some(3)'],
  intro: 'back looks; pop_back takes.',
  steps: [['The tail node holds 3.', 0], ['Some(3).', [], 'o0']],
  result: 'Some(3)', resultCap: 'front() looks at the head.',
}, `d(${LLN}::from([1, 2, 3]).back())`);

add('linkedlist/back_mut', 'back_mut', LL, 'How LinkedList::back_mut works', 'A mutable reference to the last element.', {
  rows: [['[1, 2]']], call: 'if let Some(x) = l.back_mut() { *x = 20; }', note: 'edit the tail', outs: ['[1, 20]'],
  intro: 'None for an empty list.',
  steps: [['The tail is lent.', 0], ['It becomes 20.', [], 'o0']],
  result: '[1, 20]', resultCap: 'front_mut edits the head.',
}, `let mut l = ${LLN}::from([1, 2]); if let Some(x) = l.back_mut() { *x = 20; } d(l)`);

add('linkedlist/front_mut', 'front_mut', LL, 'How LinkedList::front_mut works', 'A mutable reference to the first element.', {
  rows: [['[1, 2]']], call: 'if let Some(x) = l.front_mut() { *x = 10; }', note: 'edit the head', outs: ['[10, 2]'],
  intro: 'None for an empty list.',
  steps: [['The head is lent.', 0], ['It becomes 10.', [], 'o0']],
  result: '[10, 2]', resultCap: 'back_mut edits the tail.',
}, `let mut l = ${LLN}::from([1, 2]); if let Some(x) = l.front_mut() { *x = 10; } d(l)`);

add('linkedlist/is_empty', 'is_empty', LL, 'How LinkedList::is_empty works', 'true if the list has no elements.', {
  rows: [['[]', '[1]']], call: 'l.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'Instant: the list keeps its length.',
  steps: [['Empty: true.', 0, 'o0'], ['One element: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'while let Some(x) = l.pop_front() avoids the check.',
}, `format!("{}, {}", ${LLN}::<i32>::new().is_empty(), ${LLN}::from([1]).is_empty())`);

add('linkedlist/clear', 'clear', LL, 'How LinkedList::clear works', 'Removes and frees every node.', {
  rows: [['[1, 2, 3]']], call: 'l.clear()', note: 'empty it', outs: ['[]'],
  intro: 'Each node is freed one by one.',
  steps: [['Three nodes are freed.', 0], ['The list is empty.', [], 'o0']],
  result: '[]', resultCap: 'Same as l = LinkedList::new().',
}, `let mut l = ${LLN}::from([1, 2, 3]); l.clear(); d(l)`);

add('linkedlist/iter', 'iter', LL, 'How LinkedList::iter works', 'Visits elements from front to back by following the links.', {
  rows: [['[1, 2, 3]']], call: 'l.iter().sum::<i32>()', note: 'node to node', outs: ['6'],
  intro: 'Each step follows the "next" pointer.',
  steps: [['1 → 2 → 3.', 0], ['Sum: 6.', [], 'o0']],
  result: '6', resultCap: 'iter().rev() follows the "previous" pointers.',
}, `${LLN}::from([1, 2, 3]).iter().sum::<i32>().to_string()`);

add('linkedlist/iter_mut', 'iter_mut', LL, 'How LinkedList::iter_mut works', 'Visits elements mutably from front to back.', {
  rows: [['[1, 2]']], call: 'for x in l.iter_mut() { *x += 1; }', note: 'edit every node', outs: ['[2, 3]'],
  intro: 'Each node\'s value is lent mutably.',
  steps: [['1 → 2, 2 → 3.', 0], ['[2, 3].', [], 'o0']],
  result: '[2, 3]', resultCap: 'The links themselves cannot be changed this way.',
}, `let mut l = ${LLN}::from([1, 2]); for x in l.iter_mut() { *x += 1; } d(l)`);

add('linkedlist/split_off', 'split_off', LL, 'How LinkedList::split_off works', 'Splits the list in two at an index.', {
  rows: [['[1, 2, 3, 4]']], call: 'let back = l.split_off(2);', note: 'walks to the index', outs: ['l = [1, 2]', 'back = [3, 4]'],
  intro: 'Finding the index is O(n); the split itself just relinks.',
  steps: [['Walk to index 2.', 0], ['Cut the links there.', [], 'o0,1']],
  result: '[1, 2], [3, 4]', resultCap: 'append() joins lists back in O(1).',
}, `let mut l = ${LLN}::from([1, 2, 3, 4]); let b = l.split_off(2); format!("{:?}, {:?}", l, b)`);

// ---------------------------------------------------------------- Vec extras

add('vec/as_mut_slice', 'as_mut_slice', VEC, 'How Vec::as_mut_slice works', 'Borrows the Vec\'s contents as a mutable slice.', {
  rows: [nums([3, 1, 2])], call: 'v.as_mut_slice().sort();', note: '&mut Vec → &mut [T]', outs: ['1', '2', '3'],
  intro: 'Pass it to functions that take &mut [T].',
  steps: [['The Vec is lent as a slice.', [0, 1, 2]], ['Sorting changes the Vec.', [], 'o0,1,2']],
  result: '[1, 2, 3]', resultCap: '&mut v[..] does the same.',
}, 'let mut v = vec![3, 1, 2]; v.as_mut_slice().sort(); d(v)');

add('vec/into_flattened', 'into_flattened', VEC, 'How Vec::into_flattened works', 'Turns a Vec of arrays into a flat Vec, without copying.', {
  rows: [['[1, 2]', '[3, 4]']], call: 'vec![[1, 2], [3, 4]].into_flattened()', note: 'Vec<[T; N]> → Vec<T>', outs: ['[1, 2, 3, 4]'],
  intro: 'The memory is already laid out flat; only the type changes.',
  steps: [['Two arrays of 2.', [0, 1]], ['One Vec of 4.', [], 'o0']],
  result: '[1, 2, 3, 4]', resultCap: 'Handy for pixel or vertex data stored as [f32; 3].',
}, 'd(vec![[1, 2], [3, 4]].into_flattened())');

add('vec/try_reserve_exact', 'try_reserve_exact', VEC, 'How Vec::try_reserve_exact works', 'Reserves exactly n more places, returning an error instead of aborting.', {
  rows: [['8', 'usize::MAX']], call: 'v.try_reserve_exact(n)', note: 'exact, recoverable', outs: ['Ok', 'Err'],
  intro: 'No extra headroom, and failure is reported.',
  steps: [['8: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_reserve allows headroom.',
}, 'let mut v: Vec<u64> = Vec::new(); let a = v.try_reserve_exact(8).is_ok(); let b = v.try_reserve_exact(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('vec/spare_capacity_mut', 'spare_capacity_mut', VEC, 'How Vec::spare_capacity_mut works', 'The unused part of the Vec\'s buffer, as uninitialised slots.', {
  rows: [['len 1, capacity 4']], call: 'v.spare_capacity_mut().len()', note: 'MaybeUninit<T> slots', outs: ['3 free slots'],
  intro: 'Advanced: fill these slots, then call the unsafe set_len.',
  steps: [['1 slot is used.', 0], ['3 are spare.', [], 'o0']],
  result: '3', resultCap: 'Normal code just uses push.',
}, 'let mut v: Vec<i32> = Vec::with_capacity(4); v.push(1); let n = v.spare_capacity_mut().len(); (n >= 3).then_some(3).unwrap_or(n).to_string()');

add('vec_drain/as_slice', 'as_slice', ['alloc', 'Drain', /vec\/drain\.rs$/], 'How vec::Drain::as_slice works', 'The elements a drain has not handed out yet.', {
  rows: [nums([1, 2, 3])], call: 'let mut d = v.drain(..); d.next(); d.as_slice()', note: 'what is left to drain', outs: ['[2, 3]'],
  intro: 'Peek at the rest of the drained range.',
  steps: [['1 was taken.', 0, 'x'], ['[2, 3] remain.', [1, 2], 'o0']],
  result: '[2, 3]', resultCap: 'When the Drain is dropped, the rest is removed anyway.',
}, 'let mut v = vec![1, 2, 3]; let mut dr = v.drain(..); dr.next(); let r = d(dr.as_slice()); drop(dr); r');

module.exports = list;
