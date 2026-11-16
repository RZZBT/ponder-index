// Rust standard library: the rest of VecDeque and BinaryHeap, and LinkedList.
const { group, nums } = require('./kit.cjs');
const DQ = ['alloc', 'VecDeque', /vec_deque\/mod\.rs$/];
const HEAP = ['alloc', 'BinaryHeap', /binary_heap\/mod\.rs$/];
const LL = ['alloc', 'LinkedList', /linked_list\.rs$/];
const { list, add } = group({ at: DQ });

// ---------------------------------------------------------------- VecDeque

add('vecdeque/new', 'new', null, 'How VecDeque::new works', 'An empty double-ended queue: fast to add and remove at both ends.', {
  rows: [['VecDeque::new()']], call: 'let mut q = VecDeque::new(); q.push_back(1); q.push_front(0);', note: 'a ring buffer', outs: ['[0, 1]'],
  intro: 'Unlike Vec, inserting at the front is cheap.',
  steps: [['push_back(1).', 0], ['push_front(0) goes before it.', [], 'o0']],
  result: '[0, 1]', resultCap: 'The standard queue for breadth-first search and job lists.',
}, 'let mut q = VecDeque::new(); q.push_back(1); q.push_front(0); d(q)');

add('vecdeque/with_capacity', 'with_capacity', null, 'How VecDeque::with_capacity works', 'An empty deque with room for n elements.', {
  rows: [['with_capacity(16)']], call: 'VecDeque::<i32>::with_capacity(16)', note: 'pre-allocate', outs: ['len 0, room ≥ 16'],
  intro: 'Avoids growing while the queue fills up.',
  steps: [['Room for 16 is reserved.', 0], ['It is still empty.', [], 'o0']],
  result: 'len = 0, room: true', resultCap: 'Same idea as Vec::with_capacity.',
}, 'let q = VecDeque::<i32>::with_capacity(16); format!("len = {}, room: {}", q.len(), q.capacity() >= 16)');

add('vecdeque/back', 'back', null, 'How VecDeque::back works', 'The last element, without removing it.', {
  rows: [nums([1, 2, 3])], call: 'q.back()', note: 'peek at the end', outs: ['Some(3)'],
  intro: 'back looks; pop_back takes.',
  steps: [['The last element is 3.', 2], ['back() lends it.', [], 'o0']],
  result: 'Some(3)', resultCap: 'front() looks at the other end.',
}, 'let q = VecDeque::from([1, 2, 3]); d(q.back())');

add('vecdeque/len', 'len', null, 'How VecDeque::len works', 'The number of elements.', {
  rows: [nums([7, 8])], call: 'q.len()', note: 'count', outs: ['2'],
  intro: 'len is stored, so asking is free.',
  steps: [['Two elements.', [0, 1]], ['len is 2.', [], 'o0']],
  result: '2', resultCap: 'is_empty is len() == 0.',
}, 'let q = VecDeque::from([7, 8]); q.len().to_string()');

add('vecdeque/is_empty', 'is_empty', null, 'How VecDeque::is_empty works', 'true if the deque has no elements.', {
  rows: [['[]', '[1]']], call: 'q.is_empty()', note: 'loop until empty', outs: ['true', 'false'],
  intro: 'Common in "while !queue.is_empty()" loops.',
  steps: [['Empty: true.', 0, 'o0'], ['One element: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'while let Some(x) = q.pop_front() is often neater.',
}, 'let a: VecDeque<i32> = VecDeque::new(); let b = VecDeque::from([1]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('vecdeque/get', 'get', null, 'How VecDeque::get works', 'The element at an index (0 = front), or None.', {
  rows: [['"a"', '"b"', '"c"']], call: 'q.get(1)', note: 'index from the front', outs: ['Some("b")'],
  intro: 'Indexes count from the front, wherever it is in memory.',
  steps: [['Index 1 is the second element.', 1], ['Some("b").', [], 'o0']],
  result: 'Some("b")', resultCap: 'q[1] also works but panics when out of range.',
}, 'let q = VecDeque::from(["a", "b", "c"]); d(q.get(1))');

add('vecdeque/get_mut', 'get_mut', null, 'How VecDeque::get_mut works', 'A mutable reference to the element at an index.', {
  rows: [nums([1, 2, 3])], call: 'if let Some(x) = q.get_mut(0) { *x = 10; }', note: 'edit in place', outs: ['10', '2', '3'],
  intro: 'Returns None if the index is out of range.',
  steps: [['Index 0 is lent mutably.', 0], ['It becomes 10.', [0, 1, 2], 'o0,1,2']],
  result: '[10, 2, 3]', resultCap: 'front_mut and back_mut cover the ends.',
}, 'let mut q = VecDeque::from([1, 2, 3]); if let Some(x) = q.get_mut(0) { *x = 10; } d(q)');

add('vecdeque/iter', 'iter', null, 'How VecDeque::iter works', 'Visits the elements from front to back.', {
  rows: [nums([1, 2, 3])], call: 'q.iter().sum::<i32>()', note: 'front first', outs: ['6'],
  intro: 'Even if the buffer wraps around in memory, iter goes in queue order.',
  steps: [['1, 2, 3 in order.', [0, 1, 2]], ['Their sum is 6.', [], 'o0']],
  result: '6', resultCap: 'iter().rev() goes from back to front.',
}, 'let q = VecDeque::from([1, 2, 3]); q.iter().sum::<i32>().to_string()');

add('vecdeque/insert', 'insert', null, 'How VecDeque::insert works', 'Inserts an element at an index, shifting the shorter side.', {
  rows: [nums([1, 3])], call: 'q.insert(1, 2)', note: 'in the middle', outs: ['1', '2', '3'],
  intro: 'VecDeque moves whichever side has fewer elements.',
  steps: [['Index 1 is between 1 and 3.', [0, 1]], ['2 goes in.', [], 'o0,1,2']],
  result: '[1, 2, 3]', resultCap: 'Insertions in the middle are still O(n); the ends are O(1).',
}, 'let mut q = VecDeque::from([1, 3]); q.insert(1, 2); d(q)');

add('vecdeque/remove', 'remove', null, 'How VecDeque::remove works', 'Removes and returns the element at an index.', {
  rows: [['"a"', '"b"', '"c"']], call: 'q.remove(1)', note: 'Some(x) or None', outs: ['Some("b")', '["a", "c"]'],
  intro: 'Returns None for an index that does not exist.',
  steps: [['"b" is at index 1.', 1, 'x'], ['It is removed and returned.', [], 'o0,1']],
  result: 'Some("b"), ["a", "c"]', resultCap: 'swap_remove_back is faster when order does not matter.',
}, 'let mut q = VecDeque::from(["a", "b", "c"]); let r = q.remove(1); format!("{:?}, {:?}", r, q)');

add('vecdeque/clear', 'clear', null, 'How VecDeque::clear works', 'Removes every element.', {
  rows: [nums([1, 2])], call: 'q.clear()', note: 'empty it', outs: ['[]'],
  intro: 'The capacity stays for reuse.',
  steps: [['Both elements are dropped.', [0, 1]], ['The deque is empty.', [], 'o0']],
  result: '[]', resultCap: 'Reuse the same queue in loops.',
}, 'let mut q = VecDeque::from([1, 2]); q.clear(); d(q)');

add('vecdeque/contains', 'contains', null, 'How VecDeque::contains works', 'true if an equal element is in the deque.', {
  rows: [nums([4, 5, 6])], call: 'q.contains(&5)', note: 'a linear search', outs: ['true'],
  intro: 'contains checks each element in turn.',
  steps: [['4 is not 5.', 0], ['5 matches: true.', 1, 'o0']],
  result: 'true', resultCap: 'For frequent lookups, keep a HashSet beside the queue.',
}, 'let q = VecDeque::from([4, 5, 6]); q.contains(&5).to_string()');

add('vecdeque/drain', 'drain', null, 'How VecDeque::drain works', 'Removes a range of elements and yields them.', {
  rows: [nums([1, 2, 3, 4])], call: 'let batch: Vec<_> = q.drain(..2).collect();', note: 'take a batch', outs: ['batch [1, 2]', 'q [3, 4]'],
  intro: 'Take the first n jobs in one step.',
  steps: [['1 and 2 are moved out.', [0, 1], 'o0'], ['3 and 4 stay.', [2, 3], 'o1']],
  result: '[1, 2], [3, 4]', resultCap: 'drain(..) empties the whole deque.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); let b: Vec<_> = q.drain(..2).collect(); format!("{:?}, {:?}", b, q)');

add('vecdeque/truncate', 'truncate', null, 'How VecDeque::truncate works', 'Keeps only the first n elements.', {
  rows: [nums([1, 2, 3, 4])], call: 'q.truncate(2)', note: 'cut the back', outs: ['[1, 2]'],
  intro: 'Elements beyond the first n are dropped.',
  steps: [['3 and 4 are past the limit.', [2, 3], 'x'], ['[1, 2] remains.', [], 'o0']],
  result: '[1, 2]', resultCap: 'Does nothing if n ≥ len.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); q.truncate(2); d(q)');

add('vecdeque/swap', 'swap', null, 'How VecDeque::swap works', 'Exchanges two elements by index.', {
  rows: [['"a"', '"b"', '"c"']], call: 'q.swap(0, 2)', note: 'first ↔ last', outs: ['"c"', '"b"', '"a"'],
  intro: 'Indexes count from the front.',
  steps: [['Index 0 and 2 trade places.', [0, 2]], ['Result: c, b, a.', [], 'o0,1,2']],
  result: '["c", "b", "a"]', resultCap: 'Panics if an index is out of range.',
}, 'let mut q = VecDeque::from(["a", "b", "c"]); q.swap(0, 2); d(q)');

add('vecdeque/range', 'range', null, 'How VecDeque::range works', 'An iterator over a range of positions.', {
  rows: [nums([10, 20, 30, 40])], call: 'q.range(1..3).collect::<Vec<_>>()', note: 'a window into the queue', outs: ['[20, 30]'],
  intro: 'Like slicing, but works even if the buffer wraps around.',
  steps: [['Positions 1 and 2.', [1, 2]], ['They come out in order.', [], 'o0']],
  result: '[20, 30]', resultCap: 'range_mut gives mutable access.',
}, 'let q = VecDeque::from([10, 20, 30, 40]); d(q.range(1..3).collect::<Vec<_>>())');

add('vecdeque/as_slices', 'as_slices', null, 'How VecDeque::as_slices works', 'The contents as two slices, because the buffer may wrap around.', {
  rows: [['front part', 'back part']], call: 'let (a, b) = q.as_slices();', note: 'a ring buffer in memory', outs: ['a = [0]', 'b = [1, 2]'],
  intro: 'After push_front, the front element can sit at the end of the buffer.',
  steps: [['The first slice holds the front part.', 0, 'o0'], ['The second holds the rest.', 1, 'o1']],
  result: 'all = [0, 1, 2]', resultCap: 'make_contiguous turns it into one slice.',
}, 'let mut q = VecDeque::with_capacity(4); q.push_back(1); q.push_back(2); q.push_front(0); let (a, b) = q.as_slices(); format!("all = {:?}", [a, b].concat())');

add('vecdeque/rotate_right', 'rotate_right', null, 'How VecDeque::rotate_right works', 'Moves the last n elements to the front.', {
  rows: [nums([1, 2, 3, 4])], call: 'q.rotate_right(1)', note: 'spin the queue', outs: ['4', '1', '2', '3'],
  intro: 'The deque spins; nothing is lost.',
  steps: [['4 leaves the back...', 3], ['...and comes in at the front.', [], 'o0,1,2,3']],
  result: '[4, 1, 2, 3]', resultCap: 'rotate_left goes the other way.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); q.rotate_right(1); d(q)');

add('vecdeque/retain', 'retain', null, 'How VecDeque::retain works', 'Keeps only the elements that pass a test.', {
  rows: [nums([1, 2, 3, 4])], call: 'q.retain(|x| x % 2 == 0)', note: 'filter in place', outs: ['2', '4'],
  intro: 'The remaining elements keep their order.',
  steps: [['1 and 3 fail.', [0, 2], 'x'], ['2 and 4 stay.', [1, 3], 'o0,1']],
  result: '[2, 4]', resultCap: 'retain_mut lets the closure change elements too.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); q.retain(|x| x % 2 == 0); d(q)');

add('vecdeque/split_off', 'split_off', null, 'How VecDeque::split_off works', 'Splits the deque in two at an index.', {
  rows: [nums([1, 2, 3, 4])], call: 'let back = q.split_off(2);', note: 'cut at 2', outs: ['q [1, 2]', 'back [3, 4]'],
  intro: 'Everything from the index onwards moves to a new deque.',
  steps: [['1 and 2 stay.', [0, 1], 'o0'], ['3 and 4 go to back.', [2, 3], 'o1']],
  result: '[1, 2], [3, 4]', resultCap: 'append joins them again.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); let back = q.split_off(2); format!("{:?}, {:?}", q, back)');

add('vecdeque/append', 'append', null, 'How VecDeque::append works', 'Moves all elements of another deque onto the back.', {
  rows: [nums([1, 2]), nums([3])], call: 'a.append(&mut b)', note: 'b ends empty', outs: ['a [1, 2, 3]', 'b []'],
  intro: 'The other deque is emptied.',
  steps: [['3 moves to the back of a.', 'b0'], ['b is empty.', [], 'o0,1']],
  result: '[1, 2, 3], []', resultCap: 'extend would copy instead.',
}, 'let mut a = VecDeque::from([1, 2]); let mut b = VecDeque::from([3]); a.append(&mut b); format!("{:?}, {:?}", a, b)');

add('vecdeque/resize', 'resize', null, 'How VecDeque::resize works', 'Grows (filling with a value) or shrinks to a length.', {
  rows: [nums([1])], call: 'q.resize(3, 0)', note: 'fill at the back', outs: ['1', '0', '0'],
  intro: 'New elements are clones of the given value.',
  steps: [['1 stays.', 0, 'o0'], ['Two 0s are added at the back.', [], 'o1,2']],
  result: '[1, 0, 0]', resultCap: 'A smaller length truncates instead.',
}, 'let mut q = VecDeque::from([1]); q.resize(3, 0); d(q)');

add('vecdeque/front_mut', 'front_mut', null, 'How VecDeque::front_mut works', 'A mutable reference to the first element.', {
  rows: [nums([5, 6])], call: 'if let Some(x) = q.front_mut() { *x += 100; }', note: 'edit the head', outs: ['105', '6'],
  intro: 'Returns None for an empty deque.',
  steps: [['The front, 5, is lent.', 0], ['It becomes 105.', [0, 1], 'o0,1']],
  result: '[105, 6]', resultCap: 'back_mut edits the last element.',
}, 'let mut q = VecDeque::from([5, 6]); if let Some(x) = q.front_mut() { *x += 100; } d(q)');

add('vecdeque/back_mut', 'back_mut', null, 'How VecDeque::back_mut works', 'A mutable reference to the last element.', {
  rows: [nums([5, 6])], call: 'if let Some(x) = q.back_mut() { *x = 0; }', note: 'edit the tail', outs: ['5', '0'],
  intro: 'Returns None for an empty deque.',
  steps: [['The back, 6, is lent.', 1], ['It becomes 0.', [0, 1], 'o0,1']],
  result: '[5, 0]', resultCap: 'Handy for updating the newest entry in a history.',
}, 'let mut q = VecDeque::from([5, 6]); if let Some(x) = q.back_mut() { *x = 0; } d(q)');

add('vecdeque/binary_search', 'binary_search', null, 'How VecDeque::binary_search works', 'Searches a sorted deque: Ok(index) or Err(where it would go).', {
  rows: [nums([1, 3, 5, 7])], call: 'q.binary_search(&5)', note: 'the deque must be sorted', outs: ['Ok(2)'],
  intro: 'Halves the search range each step.',
  steps: [['The middle checks narrow it down.', [1, 2]], ['5 is at index 2.', 2, 'o0']],
  result: 'Ok(2), Err(2)', resultCap: 'Searching for 4 gives Err(2): insert it at index 2 to stay sorted.',
}, 'let q = VecDeque::from([1, 3, 5, 7]); format!("{:?}, {:?}", q.binary_search(&5), q.binary_search(&4))');

// ---------------------------------------------------------------- BinaryHeap

add('binaryheap/new', 'new', HEAP, 'How BinaryHeap::new works', 'An empty priority queue: pop always gives the largest element.', {
  rows: [['push 3, 9, 1']], call: 'let mut h = BinaryHeap::new(); h.push(3); h.push(9); h.push(1);', note: 'a max-heap', outs: ['pop → 9'],
  intro: 'Elements are kept partly ordered so the maximum is always on top.',
  steps: [['3, 9 and 1 are pushed.', 0], ['The largest, 9, is on top.', [], 'o0']],
  result: 'Some(9)', resultCap: 'Wrap values in Reverse(x) for a min-heap.',
}, 'let mut h = BinaryHeap::new(); h.push(3); h.push(9); h.push(1); d(h.pop())');

add('binaryheap/from', 'from', HEAP, 'How BinaryHeap::from works', 'Turns a Vec or an array into a heap in linear time.', {
  rows: [nums([4, 1, 8, 2])], call: 'BinaryHeap::from(vec![4, 1, 8, 2])', note: 'heapify', outs: ['peek → 8'],
  intro: 'Building from a whole Vec is faster than pushing one by one.',
  steps: [['The items are rearranged into a heap.', [0, 1, 2, 3]], ['8 ends up on top.', 2, 'o0']],
  result: 'Some(8)', resultCap: 'into_sorted_vec then gives them in ascending order.',
}, 'let h = BinaryHeap::from(vec![4, 1, 8, 2]); d(h.peek())');

add('binaryheap/into_vec', 'into_vec', HEAP, 'How BinaryHeap::into_vec works', 'Gives the elements back as a Vec, in heap order (not sorted).', {
  rows: [['heap of 1, 2, 3']], call: 'h.into_vec()', note: 'no sorting', outs: ['3 elements, max first'],
  intro: 'The first element is the maximum; the rest are in internal order.',
  steps: [['The heap is consumed.', 0], ['Its buffer becomes a Vec.', [], 'o0']],
  result: 'len = 3, first = 3', resultCap: 'Use into_sorted_vec if you need sorted output.',
}, 'let h = BinaryHeap::from(vec![1, 2, 3]); let v = h.into_vec(); format!("len = {}, first = {}", v.len(), v[0])');

add('binaryheap/drain', 'drain', HEAP, 'How BinaryHeap::drain works', 'Removes every element, in no particular order.', {
  rows: [['heap of 1, 5, 3']], call: 'h.drain().count()', note: 'empty it, unordered', outs: ['3', 'heap empty'],
  intro: 'drain does not pop in priority order.',
  steps: [['All three are moved out.', 0, 'o0'], ['The heap is left empty.', 0, 'o1']],
  result: '3, true', resultCap: 'For priority order, loop with pop().',
}, 'let mut h = BinaryHeap::from(vec![1, 5, 3]); let n = h.drain().count(); format!("{}, {}", n, h.is_empty())');

add('binaryheap/peek_mut', 'peek_mut', HEAP, 'How BinaryHeap::peek_mut works', 'Changes the top element; the heap reorders when you are done.', {
  rows: [['heap 9, 5, 1']], call: 'if let Some(mut top) = h.peek_mut() { *top = 0; }', note: 'lower the maximum', outs: ['new top: 5'],
  intro: 'When the guard drops, the changed element sinks to its place.',
  steps: [['The top, 9, becomes 0.', 0], ['The heap reorders: 5 is the new top.', [], 'o0']],
  result: 'Some(5)', resultCap: 'PeekMut::pop(top) removes it instead.',
}, 'let mut h = BinaryHeap::from(vec![9, 5, 1]); if let Some(mut top) = h.peek_mut() { *top = 0; } d(h.peek())');

add('binaryheap/iter', 'iter', HEAP, 'How BinaryHeap::iter works', 'Visits all elements, in arbitrary order.', {
  rows: [['heap 2, 7, 4']], call: 'h.iter().sum::<i32>()', note: 'not sorted', outs: ['13'],
  intro: 'iter is fine for sums, counts or searches.',
  steps: [['Each element once.', 0], ['Sum: 13.', [], 'o0']],
  result: '13', resultCap: 'Do not rely on the order: it is internal heap order.',
}, 'let h = BinaryHeap::from(vec![2, 7, 4]); h.iter().sum::<i32>().to_string()');

add('binaryheap/is_empty', 'is_empty', HEAP, 'How BinaryHeap::is_empty works', 'true if the heap has no elements.', {
  rows: [['empty', 'one element']], call: 'h.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'Typical loop condition for processing a priority queue.',
  steps: [['Empty: true.', 0, 'o0'], ['One element: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'while let Some(x) = h.pop() avoids the separate check.',
}, 'let a: BinaryHeap<i32> = BinaryHeap::new(); let b = BinaryHeap::from(vec![1]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('binaryheap/append', 'append', HEAP, 'How BinaryHeap::append works', 'Moves every element of another heap into this one.', {
  rows: [['a: 1, 5'], ['b: 9']], call: 'a.append(&mut b)', note: 'merge priority queues', outs: ['a top 9', 'b empty'],
  intro: 'The other heap is emptied.',
  steps: [['9 moves into a.', 'b0'], ['a now has 9 on top.', [], 'o0,1']],
  result: 'Some(9), 0', resultCap: 'Merging is efficient: it rebuilds when that is faster.',
}, 'let mut a = BinaryHeap::from(vec![1, 5]); let mut b = BinaryHeap::from(vec![9]); a.append(&mut b); format!("{:?}, {}", a.peek(), b.len())');

add('binaryheap/retain', 'retain', HEAP, 'How BinaryHeap::retain works', 'Keeps only the elements that pass a test.', {
  rows: [['heap 1, 6, 3, 8']], call: 'h.retain(|x| x % 2 == 0)', note: 'filter a priority queue', outs: ['top 8, len 2'],
  intro: 'The heap is rebuilt from what remains.',
  steps: [['1 and 3 are removed.', 0], ['6 and 8 remain; 8 is on top.', [], 'o0']],
  result: 'Some(8), 2', resultCap: 'Useful to cancel queued jobs.',
}, 'let mut h = BinaryHeap::from(vec![1, 6, 3, 8]); h.retain(|x| x % 2 == 0); format!("{:?}, {}", h.peek(), h.len())');

add('binaryheap/clear', 'clear', HEAP, 'How BinaryHeap::clear works', 'Removes every element.', {
  rows: [['heap 1, 2, 3']], call: 'h.clear()', note: 'empty it', outs: ['len 0'],
  intro: 'The capacity stays.',
  steps: [['All elements are dropped.', 0], ['len is 0.', [], 'o0']],
  result: '0', resultCap: 'Same as drain() without looking at the elements.',
}, 'let mut h = BinaryHeap::from(vec![1, 2, 3]); h.clear(); h.len().to_string()');

// ---------------------------------------------------------------- LinkedList

add('linkedlist/push_back', 'push_back', LL, 'How LinkedList::push_back works', 'Adds an element at the end of a doubly linked list.', {
  rows: [['[1]']], call: 'list.push_back(2)', note: 'O(1) at both ends', outs: ['[1, 2]'],
  intro: 'Each element is its own heap node with links to its neighbours.',
  steps: [['A new node holds 2.', 0], ['It is linked after 1.', [], 'o0']],
  result: '[1, 2]', resultCap: 'VecDeque is almost always faster; LinkedList is rarely the right choice.',
}, 'let mut l = std::collections::LinkedList::from([1]); l.push_back(2); d(l)');

add('linkedlist/push_front', 'push_front', LL, 'How LinkedList::push_front works', 'Adds an element at the front.', {
  rows: [['[2]']], call: 'list.push_front(1)', note: 'new head', outs: ['[1, 2]'],
  intro: 'The new node becomes the head.',
  steps: [['A node for 1 is created.', 0], ['It is linked before 2.', [], 'o0']],
  result: '[1, 2]', resultCap: 'Constant time, no shifting.',
}, 'let mut l = std::collections::LinkedList::from([2]); l.push_front(1); d(l)');

add('linkedlist/pop_front', 'pop_front', LL, 'How LinkedList::pop_front works', 'Removes and returns the first element.', {
  rows: [['[1, 2, 3]']], call: 'list.pop_front()', note: 'take the head', outs: ['Some(1)', '[2, 3]'],
  intro: 'The second node becomes the new head.',
  steps: [['1 is unlinked and returned.', 0, 'o0'], ['[2, 3] remains.', 0, 'o1']],
  result: 'Some(1), [2, 3]', resultCap: 'pop_back takes the last element.',
}, 'let mut l = std::collections::LinkedList::from([1, 2, 3]); let r = l.pop_front(); format!("{:?}, {:?}", r, l)');

add('linkedlist/pop_back', 'pop_back', LL, 'How LinkedList::pop_back works', 'Removes and returns the last element.', {
  rows: [['[1, 2, 3]']], call: 'list.pop_back()', note: 'take the tail', outs: ['Some(3)', '[1, 2]'],
  intro: 'The previous node becomes the new tail.',
  steps: [['3 is unlinked and returned.', 0, 'o0'], ['[1, 2] remains.', 0, 'o1']],
  result: 'Some(3), [1, 2]', resultCap: 'Returns None for an empty list.',
}, 'let mut l = std::collections::LinkedList::from([1, 2, 3]); let r = l.pop_back(); format!("{:?}, {:?}", r, l)');

add('linkedlist/front', 'front', LL, 'How LinkedList::front works', 'The first element, without removing it.', {
  rows: [['["a", "b"]']], call: 'list.front()', note: 'peek at the head', outs: ['Some("a")'],
  intro: 'front looks; pop_front takes.',
  steps: [['The head holds "a".', 0], ['front() lends it.', [], 'o0']],
  result: 'Some("a")', resultCap: 'back() looks at the tail.',
}, 'let l = std::collections::LinkedList::from(["a", "b"]); d(l.front())');

add('linkedlist/append', 'append', LL, 'How LinkedList::append works', 'Moves all nodes of another list to the end, in constant time.', {
  rows: [['a = [1, 2]'], ['b = [3, 4]']], call: 'a.append(&mut b)', note: 'relink, no copying', outs: ['a = [1, 2, 3, 4]', 'b = []'],
  intro: 'Only two links change, however long the lists are: the one thing linked lists do best.',
  steps: [['a\'s tail is linked to b\'s head.', ['a0', 'b0']], ['b is left empty.', [], 'o0,1']],
  result: '[1, 2, 3, 4], []', resultCap: 'split_off goes the other way (but has to walk to the index).',
}, 'let mut a = std::collections::LinkedList::from([1, 2]); let mut b = std::collections::LinkedList::from([3, 4]); a.append(&mut b); format!("{:?}, {:?}", a, b)');

add('linkedlist/len', 'len', LL, 'How LinkedList::len works', 'The number of elements (stored, so it costs nothing).', {
  rows: [['[1, 2, 3]']], call: 'list.len()', note: 'count', outs: ['3'],
  intro: 'The list keeps a counter; it does not walk the nodes.',
  steps: [['Three nodes.', 0], ['len is 3.', [], 'o0']],
  result: '3', resultCap: 'is_empty is len() == 0.',
}, 'let l = std::collections::LinkedList::from([1, 2, 3]); l.len().to_string()');

add('linkedlist/contains', 'contains', LL, 'How LinkedList::contains works', 'true if an equal element is in the list.', {
  rows: [['["x", "y"]']], call: 'list.contains(&"y")', note: 'walks the nodes', outs: ['true'],
  intro: 'contains visits nodes one by one.',
  steps: [['"x" is not it.', 0], ['"y" matches.', [], 'o0']],
  result: 'true', resultCap: 'Linear time, and slower than on a Vec because nodes are scattered in memory.',
}, 'let l = std::collections::LinkedList::from(["x", "y"]); l.contains(&"y").to_string()');

module.exports = list;
