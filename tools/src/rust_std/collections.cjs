// Rust standard library: HashMap, HashSet (std::collections) and BTreeMap, BTreeSet, VecDeque, BinaryHeap
// (alloc::collections). HashMap/HashSet order is random, so truth cases print them sorted (sorted_map/sorted_set).
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['std', 'HashMap', /collections\/hash\/map\.rs$/] });
const ENTRY = ['std', 'Entry', /collections\/hash\/map\.rs$/];
const SET = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const BTREE = ['alloc', 'BTreeMap', /collections\/btree\/map\.rs$/];
const BSET = ['alloc', 'BTreeSet', /collections\/btree\/set\.rs$/];
const DEQUE = ['alloc', 'VecDeque', /collections\/vec_deque\/mod\.rs$/];
const HEAP = ['alloc', 'BinaryHeap', /collections\/binary_heap\/mod\.rs$/];
const map = 'let mut m: HashMap<&str, i32> = HashMap::new(); m.insert("a", 1); m.insert("b", 2); ';

add('hashmap/insert', 'insert', null, 'How HashMap::insert works', 'Stores a value under a key; returns the old value if the key was already there.', {
  call: 'm.insert("a", 1); m.insert("a", 5)', note: 'one value per key', rows: [['insert("a", 1)', 'insert("a", 5)']], outs: ['None', 'Some(1)'],
  intro: 'A HashMap stores each key once. Inserting a key that exists replaces its value.',
  steps: [
    ['"a" is new: it is stored with 1, and insert returns None.', 0, 'o0', '{"a": 1}'],
    ['"a" exists already: 5 replaces 1, and the old 1 is returned.', 1, 'o1', '{"a": 5}'],
  ],
  result: '{"a": 5}', resultCap: 'Check the returned Option when you need to know whether something was overwritten.',
}, 'let mut m = HashMap::new(); m.insert("a", 1); let _old = m.insert("a", 5); sorted_map(&m)');

add('hashmap/get', 'get', null, 'How HashMap::get works', 'Looks a key up; returns Some(&value) or None.', {
  call: 'm.get("a"), m.get("z")', note: 'm = {"a": 1, "b": 2}', rows: [['"a" → 1', '"b" → 2']], outs: ['Some(1)', 'None'],
  intro: 'get hashes the key and jumps straight to where its value would be. No searching through all entries.',
  steps: [
    ['"a" is in the map: Some(&1).', 0, 'o0', 'found'],
    ['"z" is not: None, no panic.', [], 'o1', 'missing'],
  ],
  result: 'Some(1), None', resultCap: 'm["a"] also works but panics for a missing key. get is the safe version.',
}, map + 'format!("{:?}, {:?}", m.get("a"), m.get("z"))');

add('hashmap/get_mut', 'get_mut', null, 'How HashMap::get_mut works', 'Borrows a value mutably so you can change it in place.', {
  call: 'if let Some(v) = m.get_mut("a") { *v += 10; }', note: 'm = {"a": 1, "b": 2}', rows: [['"a" → 1', '"b" → 2']], outs: ['"a" → 11'],
  intro: 'get_mut gives a &mut to the value stored under the key.',
  steps: [
    ['"a" is found; v points at its value, 1.', 0, null, 'v = &mut 1'],
    ['*v += 10 changes the value inside the map to 11.', 0, 'o0', '1 + 10'],
  ],
  result: '{"a": 11, "b": 2}', resultCap: 'For "insert if missing, otherwise update", the entry API is shorter.',
}, map + 'if let Some(v) = m.get_mut("a") { *v += 10; } sorted_map(&m)');

add('hashmap/contains_key', 'contains_key', null, 'How HashMap::contains_key works', 'Checks whether a key is in the map.', {
  call: 'm.contains_key("b")', note: 'm = {"a": 1, "b": 2}', rows: [['"a" → 1', '"b" → 2']], outs: ['true'],
  intro: 'contains_key only looks at keys, quickly, by hashing.',
  steps: [
    ['"b" hashes to a slot that holds "b": true.', 1, 'o0'],
    ['The value (2) is not needed for the answer.', [], null, 'keys only'],
  ],
  result: 'true', resultCap: 'If you need the value afterwards, use get once instead of contains_key followed by get.',
}, map + 'm.contains_key("b").to_string()');

add('hashmap/remove', 'remove', null, 'How HashMap::remove works', 'Removes a key and returns its value.', {
  call: 'm.remove("a")', note: 'm = {"a": 1, "b": 2}', rows: [['"a" → 1', '"b" → 2']], outs: ['Some(1)'],
  intro: 'remove takes the entry out of the map and hands you the value.',
  steps: [
    ['"a" is found and taken out: Some(1).', 0, { srcColor: 'danger', out: [0] }],
    ['The map is left with just "b". Removing a missing key returns None.', 1, null, '{"b": 2}'],
  ],
  result: '{"b": 2}', resultCap: 'remove_entry returns the key too.',
}, map + 'let _v = m.remove("a"); sorted_map(&m)');

add('hashmap/entry', 'entry', null, 'How HashMap::entry works', 'Gets the slot for a key, filled or empty, so you can insert or update in one lookup.', {
  call: '*m.entry("a").or_insert(0) += 1;', note: 'the counting pattern', rows: [['"a" → 1', '"b" → 2']], outs: ['"a" → 2'],
  intro: 'entry("a") finds the place where "a" lives (or would live). Then you decide what to do with it.',
  steps: [
    ['"a" exists, so entry gives an Occupied entry pointing at 1.', 0, null, 'Occupied'],
    ['or_insert does not insert anything here and returns &mut 1; += 1 makes it 2.', 0, 'o0', '1 + 1'],
  ],
  result: '{"a": 2, "b": 2}', resultCap: 'With a missing key, entry would be Vacant and or_insert(0) would insert 0 first.',
}, map + '*m.entry("a").or_insert(0) += 1; sorted_map(&m)');

add('hashmap/or_insert', 'or_insert', ENTRY, 'How Entry::or_insert works', 'Inserts a default if the key is missing, then lends you the value: word counting in one line.', {
  call: 'for w in "a b a".split(\' \') { *counts.entry(w).or_insert(0) += 1; }', note: 'counting words', rows: [['"a"', '"b"', '"a"']], outs: ['"a" → 1', '"b" → 1', '"a" → 2'],
  intro: 'For each word: if it has no count yet, insert 0; then add 1 to the count.',
  steps: [
    ['"a" is new: 0 is inserted, then 0 + 1 = 1.', 0, 'o0', 'Vacant → insert 0'],
    ['"b" is new too: 1.', 1, 'o1', 'Vacant → insert 0'],
    ['"a" is there already: or_insert keeps 1, and 1 + 1 = 2.', 2, 'o2', 'Occupied'],
  ],
  result: '{"a": 2, "b": 1}', resultCap: 'This is the classic Rust counting idiom. or_default() does the same for types with a default (0 for numbers).',
}, 'let mut counts: HashMap<&str, i32> = HashMap::new(); for w in "a b a".split(\' \') { *counts.entry(w).or_insert(0) += 1; } sorted_map(&counts)');

add('hashmap/or_insert_with', 'or_insert_with', ENTRY, 'How Entry::or_insert_with works', 'Like or_insert, but the default is built by a closure only when needed.', {
  call: 'm.entry(team).or_insert_with(Vec::new).push(name);', note: 'group names by team', rows: [['("red", "ann")', '("blue", "bo")', '("red", "cy")']], outs: ['red: [ann]', 'blue: [bo]', 'red: [ann, cy]'],
  intro: 'For each pair, find the team\'s list; create an empty Vec only the first time.',
  steps: [
    ['"red" is new: Vec::new runs, then "ann" is pushed.', 0, 'o0', 'new Vec'],
    ['"blue" is new: another empty Vec, then "bo".', 1, 'o1', 'new Vec'],
    ['"red" exists: the closure is not called; "cy" joins the existing list.', 2, 'o2', 'existing Vec'],
  ],
  result: '{"blue": ["bo"], "red": ["ann", "cy"]}', resultCap: 'Grouping items by a key: one of the most useful things a HashMap does.',
}, 'let mut m: HashMap<&str, Vec<&str>> = HashMap::new(); for (team, name) in [("red", "ann"), ("blue", "bo"), ("red", "cy")] { m.entry(team).or_insert_with(Vec::new).push(name); } sorted_map(&m)');

add('hashmap/and_modify', 'and_modify', ENTRY, 'How Entry::and_modify works', 'Changes the value if the key exists; chain or_insert for when it does not.', {
  call: 'm.entry(k).and_modify(|v| *v += 1).or_insert(1);', note: 'update or insert', rows: [['"a" (exists, 1)', '"z" (missing)']], outs: ['"a" → 2', '"z" → 1'],
  intro: 'and_modify runs only for an existing key. or_insert runs only for a missing one.',
  steps: [
    ['"a" exists: and_modify adds 1, making 2. or_insert does nothing.', 0, 'o0', 'Occupied'],
    ['"z" is missing: and_modify is skipped, and or_insert stores 1.', 1, 'o1', 'Vacant'],
  ],
  result: '{"a": 2, "b": 2, "z": 1}', resultCap: 'Reads naturally: "if there, add one; otherwise start at one".',
}, map + 'm.entry("a").and_modify(|v| *v += 1).or_insert(1); m.entry("z").and_modify(|v| *v += 1).or_insert(1); sorted_map(&m)');

add('hashmap/or_default', 'or_default', ENTRY, 'How Entry::or_default works', 'Inserts the type\'s default value (0, "", empty Vec) if the key is missing.', {
  call: '*m.entry(c).or_default() += 1;   // for c in "hello".chars()', note: 'counting letters', rows: [["'h'", "'e'", "'l'", "'l'", "'o'"]], outs: ["'l' → 2"],
  intro: 'or_default is or_insert with the default of the value type: 0 for counters.',
  steps: [
    ['h, e: each gets 0, then 1.', [0, 1], null, 'h: 1, e: 1'],
    ['The first l: 0, then 1. The second l: already 1, so 2.', [2, 3], 'o0', 'l: 2'],
    ['o: 1.', 4, null, 'o: 1'],
  ],
  result: "{'e': 1, 'h': 1, 'l': 2, 'o': 1}", resultCap: 'The value type must implement Default. Numbers, String, Vec and HashMap all do.',
}, 'let mut m: HashMap<char, i32> = HashMap::new(); for c in "hello".chars() { *m.entry(c).or_default() += 1; } sorted_map(&m)');

add('hashmap/retain', 'retain', null, 'How HashMap::retain works', 'Keeps only the entries for which the closure returns true.', {
  call: 'm.retain(|_, v| *v >= 2);', note: 'scores = {ann: 1, bo: 3, cy: 2}', rows: [['ann: 1', 'bo: 3', 'cy: 2']], outs: [null, null],
  intro: 'retain looks at every key and value and removes the entries that fail the test.',
  steps: [
    ['ann has 1: removed.', 0, 'x', '1 >= 2 ✗'],
    ['bo has 3: kept.', 1, 'm0', '3 >= 2 ✓'],
    ['cy has 2: kept.', 2, 'm1', '2 >= 2 ✓'],
  ],
  result: '{"bo": 3, "cy": 2}', resultCap: 'The closure gets the key too, so you can filter by either.',
}, 'let mut m: HashMap<&str, i32> = [("ann", 1), ("bo", 3), ("cy", 2)].into_iter().collect(); m.retain(|_, v| *v >= 2); sorted_map(&m)');

add('hashset/insert', 'insert', SET, 'How HashSet::insert works', 'Adds a value; returns false if it was already there.', {
  call: 's.insert(2), s.insert(2)', note: 'no duplicates', rows: [['insert(2)', 'insert(2) again']], outs: ['true', 'false'],
  intro: 'A HashSet holds every value at most once.',
  steps: [
    ['2 is new: added, and insert returns true.', 0, 'o0', '{2}'],
    ['2 is already there: nothing changes, insert returns false.', 1, 'o1', '{2}'],
  ],
  result: 'true, false', resultCap: 'The returned bool is a cheap way to detect duplicates: if !seen.insert(x) { /* seen before */ }.',
}, 'let mut s = HashSet::new(); let a = s.insert(2); let b = s.insert(2); format!("{}, {}", a, b)');

add('hashset/contains', 'contains', SET, 'How HashSet::contains works', 'Checks whether a value is in the set, quickly.', {
  call: 's.contains(&3)', note: 's = {1, 3, 5}', rows: [nums([1, 3, 5])], outs: ['true'],
  intro: 'contains hashes the value and checks one place, no matter how big the set is.',
  steps: [
    ['3 hashes to the slot that holds 3: true.', 1, 'o0'],
    ['The other values are never compared.', [], null, 'one lookup'],
  ],
  result: 'true', resultCap: 'For many lookups, collecting into a HashSet first is much faster than slice::contains.',
}, 'let s: HashSet<i32> = [1, 3, 5].into_iter().collect(); s.contains(&3).to_string()');

add('hashset/union', 'union', SET, 'How HashSet::union works', 'Every value that is in either set.', {
  call: 'a.union(&b)', note: 'a = {1, 2}, b = {2, 3}', rows: [nums([1, 2]), nums([2, 3])], outs: ['1', '2', '3'],
  intro: 'union yields the values of a, then the values of b that are not in a.',
  steps: [
    ['1 and 2 from a.', ['a0', 'a1'], 'o0,1'],
    ['2 is in a already, so it is not repeated; 3 is new.', ['b0', 'b1'], 'o2', '2 only once'],
  ],
  result: '{1, 2, 3}', resultCap: 'The result is an iterator of references; collect it into a HashSet to keep it. Its order is not fixed.',
}, 'let a: HashSet<i32> = [1, 2].into_iter().collect(); let b: HashSet<i32> = [2, 3].into_iter().collect(); let u: HashSet<i32> = a.union(&b).copied().collect(); sorted_set(&u)');

add('hashset/intersection', 'intersection', SET, 'How HashSet::intersection works', 'Only the values that are in both sets.', {
  call: 'a.intersection(&b)', note: 'a = {1, 2, 3}, b = {2, 3, 4}', rows: [nums([1, 2, 3]), nums([2, 3, 4])], outs: ['2', '3'],
  intro: 'intersection keeps a value only if both sets have it.',
  steps: [
    ['1 is only in a: left out.', 'a0', 'x'],
    ['2 and 3 are in both: kept.', ['a1', 'a2', 'b0', 'b1'], 'o0,1'],
    ['4 is only in b: left out.', 'b2', 'x'],
  ],
  result: '{2, 3}', resultCap: 'Useful for "what do these two lists have in common?".',
}, 'let a: HashSet<i32> = [1, 2, 3].into_iter().collect(); let b: HashSet<i32> = [2, 3, 4].into_iter().collect(); let r: HashSet<i32> = a.intersection(&b).copied().collect(); sorted_set(&r)');

add('hashset/difference', 'difference', SET, 'How HashSet::difference works', 'The values in the first set that are not in the second.', {
  call: 'a.difference(&b)', note: 'a = {1, 2, 3}, b = {2, 3, 4}', rows: [nums([1, 2, 3]), nums([2, 3, 4])], outs: ['1'],
  intro: 'difference starts from a and removes everything that b also has.',
  steps: [
    ['1 is not in b: kept.', 'a0', 'o0'],
    ['2 and 3 are in b: removed.', ['a1', 'a2'], 'x'],
    ['4 is only in b, and b\'s own values never appear in the result.', 'b2', null, 'only values of a'],
  ],
  result: '{1}', resultCap: 'Order matters: b.difference(&a) is {4}. symmetric_difference gives values in exactly one of them: {1, 4}.',
}, 'let a: HashSet<i32> = [1, 2, 3].into_iter().collect(); let b: HashSet<i32> = [2, 3, 4].into_iter().collect(); let r: HashSet<i32> = a.difference(&b).copied().collect(); sorted_set(&r)');

add('hashset/is_subset', 'is_subset', SET, 'How HashSet::is_subset works', 'true if every value of this set is also in the other.', {
  call: 'a.is_subset(&b)', note: 'a = {1, 2}, b = {1, 2, 3}', rows: [nums([1, 2]), nums([1, 2, 3])], outs: ['true'],
  intro: 'is_subset checks each value of a against b.',
  steps: [
    ['1 is in b ✓', ['a0', 'b0']],
    ['2 is in b ✓. Nothing in a is missing from b: true.', ['a1', 'b1'], 'o0'],
  ],
  result: 'true', resultCap: 'An empty set is a subset of every set. is_superset asks the opposite question.',
}, 'let a: HashSet<i32> = [1, 2].into_iter().collect(); let b: HashSet<i32> = [1, 2, 3].into_iter().collect(); a.is_subset(&b).to_string()');

add('btreemap/insert', 'insert', BTREE, 'How BTreeMap::insert works', 'Like HashMap::insert, but the keys are always kept in sorted order.', {
  call: 'm.insert("c", 3); m.insert("a", 1); m.insert("b", 2);', note: 'inserted in any order', rows: [['"c"', '"a"', '"b"']], outs: [null, null, null],
  intro: 'A BTreeMap keeps its keys sorted, so iterating always gives them in order.',
  steps: [
    ['"c" goes in first.', 0, 'm2'],
    ['"a" is placed before it.', 1, 'm0', 'a < c'],
    ['"b" fits between them.', 2, 'm1', 'a < b < c'],
  ],
  result: '{"a": 1, "b": 2, "c": 3}', resultCap: 'Choose BTreeMap when you need sorted keys or ranges; HashMap is usually faster for plain lookups.',
}, 'let mut m = BTreeMap::new(); m.insert("c", 3); m.insert("a", 1); m.insert("b", 2); d(m)');

add('btreemap/range', 'range', BTREE, 'How BTreeMap::range works', 'Iterates over the entries whose keys fall in a range, in order.', {
  call: 'm.range(2..5)', note: 'keys 1, 3, 4, 7', rows: [['1 → "a"', '3 → "b"', '4 → "c"', '7 → "d"']], outs: ['(3, "b")', '(4, "c")'],
  intro: 'Because the keys are sorted, range can jump straight to the first key >= 2.',
  steps: [
    ['1 is below 2: outside the range.', 0, 'x'],
    ['3 and 4 are inside 2..5.', [1, 2], 'o0,1'],
    ['7 is past the end (5 is excluded): the iteration stops.', 3, 'x'],
  ],
  result: '(3, "b"), (4, "c")', resultCap: 'Great for time ranges, scores between two values, or "everything after this key".',
}, 'let m: BTreeMap<i32, &str> = [(1, "a"), (3, "b"), (4, "c"), (7, "d")].into_iter().collect(); jd(m.range(2..5))');

add('btreemap/first_key_value', 'first_key_value', BTREE, 'How BTreeMap::first_key_value works', 'The entry with the smallest key.', {
  call: 'm.first_key_value()', note: 'm = {2: "b", 1: "a", 9: "z"}', rows: [['1 → "a"', '2 → "b"', '9 → "z"']], outs: ['Some((1, "a"))'],
  intro: 'The keys are sorted, so the smallest one is always at the start.',
  steps: [
    ['1 is the smallest key.', 0, 'o0'],
    ['last_key_value() would give (9, "z"). An empty map gives None.', 2, null, 'last: 9'],
  ],
  result: 'Some((1, "a"))', resultCap: 'pop_first() also removes it, which makes a BTreeMap usable as a priority queue.',
}, 'let m: BTreeMap<i32, &str> = [(2, "b"), (1, "a"), (9, "z")].into_iter().collect(); d(m.first_key_value())');

add('btreeset/insert', 'insert', BSET, 'How BTreeSet::insert works', 'A set that keeps its values sorted.', {
  call: 'for x in [5, 1, 3, 1] { s.insert(x); }', note: 'sorted and without duplicates', rows: [nums([5, 1, 3, 1])], outs: [null, null, null],
  intro: 'Each value is placed in sorted position; a value that is already there is ignored.',
  steps: [
    ['5, then 1 before it.', [0, 1], { move: { a0: 2, a1: 0 } }],
    ['3 goes between them.', 2, 'm1'],
    ['1 is already in the set: insert returns false and nothing changes.', 3, 'x'],
  ],
  result: '{1, 3, 5}', resultCap: 'A quick way to get the unique values of a list in sorted order: v.into_iter().collect::<BTreeSet<_>>().',
}, 'let mut s = BTreeSet::new(); for x in [5, 1, 3, 1] { s.insert(x); } d(s)');

add('vecdeque/push_front', 'push_front', DEQUE, 'How VecDeque::push_front works', 'Adds an item at the front, without shifting the others.', {
  call: 'let mut q = VecDeque::from([2, 3]); q.push_front(1);', note: 'fast at both ends', rows: [nums([2, 3])], outs: ['1', '2', '3'],
  intro: 'A VecDeque is a ring buffer: it can grow at the front as cheaply as at the back.',
  steps: [
    ['2 and 3 stay where they are in memory.', [0, 1], 'o1,2'],
    ['1 is written in front of them, without moving anything.', [], 'o0', 'no shifting'],
  ],
  result: '[1, 2, 3]', resultCap: 'Vec::insert(0, x) would move every item. Use VecDeque when you add or remove at the front often.',
}, 'let mut q = VecDeque::from([2, 3]); q.push_front(1); d(q)');

add('vecdeque/pop_front', 'pop_front', DEQUE, 'How VecDeque::pop_front works', 'Removes the first item: a queue, first in, first out.', {
  call: 'q.push_back(1); q.push_back(2); q.push_back(3); q.pop_front()', note: 'a queue', rows: [nums([1, 2, 3])], outs: ['Some(1)'],
  intro: 'Items are added at the back with push_back and taken from the front with pop_front.',
  steps: [
    ['1 was added first, so it leaves first.', 0, { srcColor: 'danger', out: [0] }],
    ['2 is now at the front, ready to be next.', 1, null, 'next: 2'],
  ],
  result: 'Some(1)', resultCap: 'push_back + pop_front is a queue (first in, first out); push_back + pop_back is a stack.',
}, 'let mut q = VecDeque::new(); q.push_back(1); q.push_back(2); q.push_back(3); d(q.pop_front())');

add('vecdeque/push_back', 'push_back', DEQUE, 'How VecDeque::push_back works', 'Adds an item at the back.', {
  call: 'let mut q = VecDeque::from([1, 2]); q.push_back(3);', note: 'like Vec::push', rows: [nums([1, 2])], outs: ['1', '2', '3'],
  intro: 'push_back appends at the end of the queue.',
  steps: [
    ['1 and 2 stay.', [0, 1], 'o0,1'],
    ['3 joins at the back.', [], 'o2'],
  ],
  result: '[1, 2, 3]', resultCap: 'Together with pop_front, this is the standard way to build a queue (for example for breadth-first search).',
}, 'let mut q = VecDeque::from([1, 2]); q.push_back(3); d(q)');

add('binaryheap/push', 'push', HEAP, 'How BinaryHeap::push works', 'Adds a value; the largest value is always on top.', {
  call: 'for x in [3, 8, 5] { h.push(x); }', note: 'a max-heap', rows: [nums([3, 8, 5])], outs: ['top: 3', 'top: 8', 'top: 8'],
  intro: 'A BinaryHeap is not sorted, but it always knows its largest value.',
  steps: [
    ['3 is pushed: it is the largest so far.', 0, 'o0'],
    ['8 is pushed and rises to the top.', 1, 'o1', '8 > 3'],
    ['5 is pushed; 8 stays on top.', 2, 'o2', '5 < 8'],
  ],
  result: 'Some(8)', resultCap: 'peek() shows the top without removing it. Wrap values in std::cmp::Reverse to get the smallest on top instead.',
}, 'let mut h = BinaryHeap::new(); for x in [3, 8, 5] { h.push(x); } d(h.peek())');

add('binaryheap/pop', 'pop', HEAP, 'How BinaryHeap::pop works', 'Removes and returns the largest value.', {
  call: 'h.pop(), h.pop(), h.pop()', note: 'h = [3, 8, 5]', rows: [nums([3, 8, 5])], outs: ['Some(8)', 'Some(5)', 'Some(3)'],
  intro: 'Each pop takes the current largest value off the top; the next largest takes its place.',
  steps: [
    ['8 is the largest: out first.', 1, 'o0'],
    ['Then 5.', 2, 'o1'],
    ['Then 3. One more pop would give None.', 0, 'o2'],
  ],
  result: '8, 5, 3', resultCap: 'Popping everything gives the values from largest to smallest. Priority queues and Dijkstra\'s algorithm are built on this.',
}, 'let mut h: BinaryHeap<i32> = [3, 8, 5].into_iter().collect(); let mut out = vec![]; while let Some(x) = h.pop() { out.push(x); } j(out)');

module.exports = list;
