// Rust standard library: next() of each iterator adapter (where it.next() lands on map/filter/zip chains), and the
// From / FromIterator / Extend / Default implementations of collections and smart pointers.
const { group, nums } = require('./kit.cjs');
const AD = (name, file) => ['core', name, new RegExp(`iter\\/adapters\\/${file || name.toLowerCase()}\\.rs$`)];
const DQ = (o) => ['alloc', o, /vec_deque\/mod\.rs$/];
const BM = ['alloc', 'BTreeMap', /btree\/map\.rs$/];
const BS = ['alloc', 'BTreeSet', /btree\/set\.rs$/];
const LL = ['alloc', 'LinkedList', /linked_list\.rs$/];
const STR = (o) => ['alloc', o, /^src\/string\.rs$/];
const { list, add } = group({ at: AD('Map') });
const nx = (expr) => `let mut it = ${expr}; format!("{:?}, {:?}", it.next(), it.next())`;

// ---------------------------------------------------------------- adapters: next()

add('map_iter/next', 'next', null, 'How next works on .map(..)', 'Takes the next item from the inner iterator and applies the closure to it.', {
  rows: [nums([1, 2])], call: 'let mut it = v.iter().map(|x| x * 10); it.next()', note: 'lazy: work happens here', outs: ['Some(10)', 'Some(20)'],
  intro: 'map does nothing until next() is called; then it transforms one item.',
  steps: [['1 is pulled and becomes 10.', 0, 'o0'], ['2 becomes 20.', 1, 'o1']],
  result: 'Some(10), Some(20)', resultCap: 'That is why an unused map(..) does nothing: iterators are lazy.',
}, nx('[1, 2].iter().map(|x| x * 10)'));

add('filter_iter/next', 'next', AD('Filter'), 'How next works on .filter(..)', 'Pulls items until one passes the test, and returns it.', {
  rows: [nums([1, 2, 3, 4])], call: 'let mut it = v.iter().filter(|x| *x % 2 == 0); it.next()', note: 'may pull several', outs: ['Some(2)', 'Some(4)'],
  intro: 'One call to next() can look at many inner items.',
  steps: [['1 fails, 2 passes.', [0, 1], 'o0'], ['3 fails, 4 passes.', [2, 3], 'o1']],
  result: 'Some(2), Some(4)', resultCap: 'filter cannot know its length in advance.',
}, nx('[1, 2, 3, 4].iter().filter(|x| *x % 2 == 0)'));

add('filter_map_iter/next', 'next', AD('FilterMap', 'filter_map'), 'How next works on .filter_map(..)', 'Pulls items until the closure returns Some, and gives that value.', {
  rows: [['"1"', '"x"', '"3"']], call: 'it = v.iter().filter_map(|s| s.parse::<i32>().ok())', note: 'skip the Nones', outs: ['Some(1)', 'Some(3)'],
  intro: 'None results are skipped automatically.',
  steps: [['"1" gives 1.', 0, 'o0'], ['"x" is skipped; "3" gives 3.', [1, 2], 'o1']],
  result: 'Some(1), Some(3)', resultCap: 'filter and map in one step.',
}, nx('["1", "x", "3"].iter().filter_map(|s| s.parse::<i32>().ok())'));

add('enumerate_iter/next', 'next', AD('Enumerate'), 'How next works on .enumerate()', 'Gives the next item paired with its index.', {
  rows: [['"a"', '"b"']], call: 'let mut it = v.iter().enumerate(); it.next()', note: '(index, item)', outs: ['Some((0, "a"))', 'Some((1, "b"))'],
  intro: 'enumerate keeps a counter and adds it to every item.',
  steps: [['(0, "a").', 0, 'o0'], ['(1, "b").', 1, 'o1']],
  result: 'Some((0, "a")), Some((1, "b"))', resultCap: 'for (i, x) in v.iter().enumerate() is the common form.',
}, nx('["a", "b"].iter().enumerate()'));

add('rev_iter/next', 'next', AD('Rev'), 'How next works on .rev()', 'Calls next_back on the inner iterator: the items come from the end.', {
  rows: [nums([1, 2, 3])], call: 'let mut it = v.iter().rev(); it.next()', note: 'swap the ends', outs: ['Some(3)', 'Some(2)'],
  intro: 'rev does not copy or reverse anything; it just reads from the other end.',
  steps: [['3 first.', 2, 'o0'], ['Then 2.', 1, 'o1']],
  result: 'Some(3), Some(2)', resultCap: 'Only works on double-ended iterators.',
}, nx('[1, 2, 3].iter().rev()'));

add('zip_iter/next', 'next', AD('Zip'), 'How next works on .zip(..)', 'Takes one item from each iterator and pairs them.', {
  rows: [['"a"', '"b"'], nums([1])], call: 'let mut it = names.iter().zip(nums.iter()); it.next()', note: 'stops at the shorter one', outs: ['Some(("a", 1))', 'None'],
  intro: 'zip ends as soon as either side runs out.',
  steps: [['"a" and 1 are paired.', ['a0', 'b0'], 'o0'], ['The second iterator is empty: None.', 'a1', 'o1']],
  result: 'Some(("a", 1)), None', resultCap: '"b" is never paired.',
}, nx('["a", "b"].iter().zip([1].iter())'));

add('skip_iter/next', 'next', AD('Skip'), 'How next works on .skip(n)', 'The first call throws away n items, then passes items through.', {
  rows: [nums([1, 2, 3, 4])], call: 'let mut it = v.iter().skip(2); it.next()', note: 'skipping happens lazily', outs: ['Some(3)', 'Some(4)'],
  intro: 'Nothing is skipped until next() is first called.',
  steps: [['1 and 2 are skipped.', [0, 1], 'x'], ['3, then 4.', [2, 3], 'o0,1']],
  result: 'Some(3), Some(4)', resultCap: 'skip a header line: lines().skip(1).',
}, nx('[1, 2, 3, 4].iter().skip(2)'));

add('take_iter/next', 'next', AD('Take'), 'How next works on .take(n)', 'Passes items through until n have been given, then returns None.', {
  rows: [nums([1, 2, 3])], call: 'let mut it = v.iter().take(1); it.next()', note: 'a counter that runs down', outs: ['Some(1)', 'None'],
  intro: 'take counts down; at 0 it stops without touching the inner iterator.',
  steps: [['1 is passed through.', 0, 'o0'], ['The limit is reached: None.', [1, 2], 'o1']],
  result: 'Some(1), None', resultCap: 'Makes endless iterators finite: (1..).take(5).',
}, nx('[1, 2, 3].iter().take(1)'));

add('peekable_iter/next', 'next', AD('Peekable'), 'How next works on .peekable()', 'Returns the peeked item if there is one, otherwise the inner iterator\'s next.', {
  rows: [nums([1, 2])], call: 'it.peek(); it.next(); it.next()', note: 'a one-item buffer', outs: ['Some(1)', 'Some(2)'],
  intro: 'peek() stores the item; next() hands it over.',
  steps: [['After peek, next gives the stored 1.', 0, 'o0'], ['Then 2 from the inner iterator.', 1, 'o1']],
  result: 'Some(1), Some(2)', resultCap: 'Peeking never loses an item.',
}, 'let mut it = [1, 2].iter().peekable(); it.peek(); format!("{:?}, {:?}", it.next(), it.next())');

add('step_by_iter/next', 'next', AD('StepBy', 'step_by'), 'How next works on .step_by(n)', 'Gives the first item, then every n-th one after it.', {
  rows: [['0..10']], call: 'let mut it = (0..10).step_by(4); it.next()', note: 'jumps', outs: ['Some(0)', 'Some(4)', 'Some(8)'],
  intro: 'The first item always comes out; then it skips n - 1.',
  steps: [['0.', 0, 'o0'], ['4, then 8.', 0, 'o1,2']],
  result: 'Some(0), Some(4), Some(8)', resultCap: 'Every other element: step_by(2).',
}, 'let mut it = (0..10).step_by(4); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('chain_iter/next', 'next', AD('Chain'), 'How next works on .chain(..)', 'Gives items from the first iterator, then from the second.', {
  rows: [nums([1]), nums([2])], call: 'let mut it = a.iter().chain(b.iter()); it.next()', note: 'one after the other', outs: ['Some(1)', 'Some(2)'],
  intro: 'When the first is exhausted, chain switches over.',
  steps: [['1 from the first.', 'a0', 'o0'], ['2 from the second.', 'b0', 'o1']],
  result: 'Some(1), Some(2)', resultCap: 'No copying: both stay where they are.',
}, nx('[1].iter().chain([2].iter())'));

add('cycle_iter/next', 'next', AD('Cycle'), 'How next works on .cycle()', 'Repeats the iterator forever, restarting from a saved copy.', {
  rows: [['"on"', '"off"']], call: 'let mut it = v.iter().cycle(); it.next()', note: 'never ends', outs: ['"on"', '"off"', '"on"'],
  intro: 'At the end, cycle starts again from the beginning.',
  steps: [['"on", "off".', [0, 1], 'o0,1'], ['Back to "on".', 0, 'o2']],
  result: '"on", "off", "on"', resultCap: 'Pair it with take or zip so it stops.',
}, 'jd(["on", "off"].iter().cycle().take(3))');

add('flatten_iter/next', 'next', AD('Flatten', 'flatten'), 'How next works on .flatten()', 'Gives items from the inner collections one after another.', {
  rows: [['[1, 2]', '[]', '[3]']], call: 'let mut it = v.into_iter().flatten(); it.next()', note: 'skips empty ones', outs: ['1', '2', '3'],
  intro: 'flatten keeps a current inner iterator and moves to the next one when it runs out.',
  steps: [['1 and 2 from the first list.', 0, 'o0,1'], ['The empty one is skipped; 3.', [1, 2], 'o2']],
  result: '1, 2, 3', resultCap: 'Works on Options too: Some(x) yields x, None nothing.',
}, 'j(vec![vec![1, 2], vec![], vec![3]].into_iter().flatten())');

add('flat_map_iter/next', 'next', AD('FlatMap', 'flatten'), 'How next works on .flat_map(..)', 'Maps each item to an iterator and gives that iterator\'s items.', {
  rows: [['"ab"', '"c"']], call: 'it = words.iter().flat_map(|w| w.chars())', note: 'map, then flatten', outs: ["'a'", "'b'", "'c'"],
  intro: 'Each word becomes its characters.',
  steps: [['"ab" yields a and b.', 0, 'o0,1'], ['"c" yields c.', 1, 'o2']],
  result: "'a', 'b', 'c'", resultCap: 'Same as map(..).flatten().',
}, 'jd(["ab", "c"].iter().flat_map(|w| w.chars()))');

add('take_while_iter/next', 'next', AD('TakeWhile', 'take_while'), 'How next works on .take_while(..)', 'Passes items while the test holds; the first failure ends it.', {
  rows: [nums([1, 2, 9, 3])], call: 'it = v.iter().take_while(|x| **x < 5)', note: 'stops for good', outs: ['Some(1)', 'Some(2)', 'None'],
  intro: '9 fails, and nothing after it is ever returned, not even 3.',
  steps: [['1 and 2 pass.', [0, 1], 'o0,1'], ['9 fails: None from now on.', 2, 'o2']],
  result: 'Some(1), Some(2), None', resultCap: 'filter would have continued and returned 3.',
}, 'let mut it = [1, 2, 9, 3].iter().take_while(|x| **x < 5); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('skip_while_iter/next', 'next', AD('SkipWhile', 'skip_while'), 'How next works on .skip_while(..)', 'Skips items while the test holds, then passes everything.', {
  rows: [nums([0, 0, 5, 0])], call: 'it = v.iter().skip_while(|x| **x == 0)', note: 'drop a prefix', outs: ['Some(5)', 'Some(0)'],
  intro: 'After the first failure, the test is never used again.',
  steps: [['The two leading zeros are skipped.', [0, 1], 'x'], ['5 and then the later 0 come through.', [2, 3], 'o0,1']],
  result: 'Some(5), Some(0)', resultCap: 'Trim leading blank lines: lines().skip_while(|l| l.is_empty()).',
}, nx('[0, 0, 5, 0].iter().skip_while(|x| **x == 0)'));

add('copied_iter/next', 'next', AD('Copied'), 'How next works on .copied()', 'Takes the next reference and returns a copy of the value.', {
  rows: [['&1', '&2']], call: 'let mut it = v.iter().copied(); it.next()', note: '&T → T', outs: ['Some(1)', 'Some(2)'],
  intro: 'Works for Copy types such as numbers and chars.',
  steps: [['&1 becomes 1.', 0, 'o0'], ['&2 becomes 2.', 1, 'o1']],
  result: 'Some(1), Some(2)', resultCap: 'cloned() does the same for Clone types.',
}, nx('[1, 2].iter().copied()'));

add('cloned_iter/next', 'next', AD('Cloned'), 'How next works on .cloned()', 'Takes the next reference and returns a clone of the value.', {
  rows: [['&"x"']], call: 'let mut it = v.iter().cloned(); it.next()', note: '&String → String', outs: ['Some("x")'],
  intro: 'Each item is cloned as it is pulled.',
  steps: [['The String is cloned.', 0], ['Some("x").', [], 'o0']],
  result: 'Some("x")', resultCap: 'The original Vec keeps its Strings.',
}, 'let v = vec![String::from("x")]; d(v.iter().cloned().next())');

add('inspect_iter/next', 'next', AD('Inspect'), 'How next works on .inspect(..)', 'Shows each item to a closure, then passes it on unchanged.', {
  rows: [nums([1, 2])], call: 'it = v.iter().inspect(|x| println!("saw {x}"))', note: 'peek for debugging', outs: ['saw 1 → Some(1)', 'saw 2 → Some(2)'],
  intro: 'The closure runs only when the item is actually pulled.',
  steps: [['1 is shown, then returned.', 0, 'o0'], ['2 the same.', 1, 'o1']],
  result: 'seen [1, 2]', resultCap: 'Great for finding out what a long chain is doing.',
}, 'let mut seen = vec![]; let _: Vec<_> = [1, 2].iter().inspect(|x| seen.push(**x)).collect(); format!("seen {:?}", seen)');

add('scan_iter/next', 'next', AD('Scan'), 'How next works on .scan(..)', 'Updates a running state with each item and yields what the closure returns.', {
  rows: [nums([1, 2, 3])], call: 'it = v.iter().scan(0, |s, x| { *s += x; Some(*s) })', note: 'running total', outs: ['1', '3', '6'],
  intro: 'Like fold, but every intermediate value comes out.',
  steps: [['0 + 1 = 1.', 0, 'o0'], ['1 + 2 = 3, 3 + 3 = 6.', [1, 2], 'o1,2']],
  result: '1, 3, 6', resultCap: 'Returning None from the closure ends the iterator.',
}, 'j([1, 2, 3].iter().scan(0, |s, x| { *s += x; Some(*s) }))');

add('fuse_iter/next', 'next', AD('Fuse'), 'How next works on .fuse()', 'Returns None forever once the inner iterator has returned None.', {
  rows: [['done']], call: 'let mut it = once(1).fuse(); it.next(); it.next(); it.next()', note: 'stays finished', outs: ['Some(1)', 'None', 'None'],
  intro: 'After the first None, fuse never calls the inner iterator again.',
  steps: [['Some(1).', 0, 'o0'], ['None, and None again.', 0, 'o1,2']],
  result: 'Some(1), None, None', resultCap: 'Guarantees well-behaved endings for unusual iterators.',
}, 'let mut it = std::iter::once(1).fuse(); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('map_while_iter/next', 'next', AD('MapWhile', 'map_while'), 'How next works on .map_while(..)', 'Maps items while the closure returns Some; the first None ends it.', {
  rows: [['"4"', '"x"', '"6"']], call: 'it = v.iter().map_while(|s| s.parse::<i32>().ok())', note: 'stop at the first failure', outs: ['Some(4)', 'None'],
  intro: 'Unlike filter_map, it does not skip; it stops.',
  steps: [['"4" → 4.', 0, 'o0'], ['"x" fails: the iterator ends.', 1, 'o1']],
  result: 'Some(4), None', resultCap: '"6" is never looked at.',
}, nx('["4", "x", "6"].iter().map_while(|s| s.parse::<i32>().ok())'));

// ---------------------------------------------------------------- From / FromIterator / Extend / Default

add('vecdeque/from', 'from', DQ('VecDeque'), 'How VecDeque::from works', 'Turns a Vec or an array into a VecDeque, reusing the buffer.', {
  rows: [nums([1, 2, 3])], call: 'VecDeque::from(vec![1, 2, 3])', note: 'no copying', outs: ['[1, 2, 3]'],
  intro: 'From a Vec, the memory is taken over as it is.',
  steps: [['The Vec\'s buffer becomes the ring buffer.', [0, 1, 2]], ['Now both ends are cheap.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Arrays work too: VecDeque::from([1, 2, 3]).',
}, 'd(VecDeque::from(vec![1, 2, 3]))');

add('vec/from_vecdeque', 'from', DQ('Vec'), 'How Vec::from(VecDeque) works', 'Turns a VecDeque back into a Vec, in front-to-back order.', {
  rows: [['deque [0, 1, 2]']], call: 'Vec::from(deque)', note: 'straightened out', outs: ['[0, 1, 2]'],
  intro: 'If the ring buffer wraps around, the elements are moved into order first.',
  steps: [['The elements are made contiguous.', 0], ['The buffer becomes a Vec.', [], 'o0']],
  result: '[0, 1, 2]', resultCap: 'deque.into_iter().collect() does the same, less efficiently.',
}, 'let mut q = VecDeque::from(vec![1, 2]); q.push_front(0); d(Vec::from(q))');

add('vecdeque/from_iter', 'from_iter', DQ('VecDeque'), 'How VecDeque::from_iter works', 'Builds a VecDeque from an iterator; what collect() uses.', {
  rows: [['1..=3']], call: '(1..=3).collect::<VecDeque<_>>()', note: 'iterator → deque', outs: ['[1, 2, 3]'],
  intro: 'Each item is pushed to the back.',
  steps: [['1, 2, 3 are pushed.', 0], ['[1, 2, 3].', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Ideal to start a BFS queue from a list of nodes.',
}, 'd(VecDeque::from_iter(1..=3))');

add('vecdeque/extend', 'extend', DQ('VecDeque'), 'How VecDeque::extend works', 'Pushes every item of an iterator onto the back.', {
  rows: [['[1]'], ['2', '3']], call: 'q.extend([2, 3])', note: 'bulk push_back', outs: ['[1, 2, 3]'],
  intro: 'extend is push_back in a loop.',
  steps: [['The deque holds 1.', 'a0'], ['2 and 3 are added at the back.', ['b0', 'b1'], 'o0']],
  result: '[1, 2, 3]', resultCap: 'To add at the front, push_front each item.',
}, 'let mut q = VecDeque::from([1]); q.extend([2, 3]); d(q)');

add('btreemap/from', 'from', BM, 'How BTreeMap::from works', 'Builds a sorted map from an array of (key, value) pairs.', {
  rows: [['("b", 2)', '("a", 1)']], call: 'BTreeMap::from([("b", 2), ("a", 1)])', note: 'sorted on arrival', outs: ['{"a": 1, "b": 2}'],
  intro: 'The pairs are sorted by key.',
  steps: [['Two pairs arrive, b first.', [0, 1]], ['They are stored in key order.', [], 'o0']],
  result: '{"a": 1, "b": 2}', resultCap: 'Later duplicates of a key win.',
}, 'd(BTreeMap::from([("b", 2), ("a", 1)]))');

add('btreemap/from_iter', 'from_iter', BM, 'How BTreeMap::from_iter works', 'Builds a sorted map from an iterator of pairs; what collect() uses.', {
  rows: [['"pear"', '"fig"']], call: 'words.iter().map(|w| (w.len(), *w)).collect::<BTreeMap<_, _>>()', note: 'length → word', outs: ['{3: "fig", 4: "pear"}'],
  intro: 'Keys are sorted, whatever order they arrive in.',
  steps: [['(4, "pear") and (3, "fig").', [0, 1]], ['Sorted by key.', [], 'o0']],
  result: '{3: "fig", 4: "pear"}', resultCap: 'Counting into a sorted map gives ordered output for free.',
}, 'let m: BTreeMap<usize, &str> = BTreeMap::from_iter(["pear", "fig"].iter().map(|w| (w.len(), *w))); d(m)');

add('btreemap/extend', 'extend', BM, 'How BTreeMap::extend works', 'Inserts every pair from an iterator; existing keys are overwritten.', {
  rows: [['{1: "a"}'], ['(1, "z")', '(2, "b")']], call: 'm.extend([(1, "z"), (2, "b")])', note: 'bulk insert', outs: ['{1: "z", 2: "b"}'],
  intro: 'Like calling insert for each pair.',
  steps: [['Key 1 is overwritten.', 'b0'], ['Key 2 is added.', 'b1', 'o0']],
  result: '{1: "z", 2: "b"}', resultCap: 'append() moves a whole other map in.',
}, 'let mut m = BTreeMap::from([(1, "a")]); m.extend([(1, "z"), (2, "b")]); d(m)');

add('btreeset/from', 'from', BS, 'How BTreeSet::from works', 'Builds a sorted set from an array.', {
  rows: [nums([3, 1, 3])], call: 'BTreeSet::from([3, 1, 3])', note: 'sorted and unique', outs: ['{1, 3}'],
  intro: 'Duplicates collapse and the order becomes ascending.',
  steps: [['3, 1 and 3 arrive.', [0, 1, 2]], ['{1, 3}.', [], 'o0']],
  result: '{1, 3}', resultCap: 'A quick way to write a constant set.',
}, 'd(BTreeSet::from([3, 1, 3]))');

add('btreeset/from_iter', 'from_iter', BS, 'How BTreeSet::from_iter works', 'Builds a sorted set from an iterator; what collect() uses.', {
  rows: [['"b"', '"a"', '"b"']], call: 'words.into_iter().collect::<BTreeSet<_>>()', note: 'sorted unique values', outs: ['{"a", "b"}'],
  intro: 'Sort and deduplicate in one step.',
  steps: [['Three items arrive.', [0, 1, 2]], ['Two unique, sorted values remain.', [], 'o0']],
  result: '{"a", "b"}', resultCap: 'Collect back into a Vec if you need indexing.',
}, 'd(BTreeSet::from_iter(["b", "a", "b"]))');

add('btreeset/extend', 'extend', BS, 'How BTreeSet::extend works', 'Inserts every value of an iterator; duplicates are ignored.', {
  rows: [['{5}'], ['1', '5']], call: 's.extend([1, 5])', note: 'bulk insert', outs: ['{1, 5}'],
  intro: 'Values already present change nothing.',
  steps: [['1 is new.', 'b0'], ['5 was already there.', 'b1', 'o0']],
  result: '{1, 5}', resultCap: 'The set stays sorted.',
}, 'let mut s = BTreeSet::from([5]); s.extend([1, 5]); d(s)');

add('hashset/from', 'from', ['std', 'HashSet', /collections\/hash\/set\.rs$/], 'How HashSet::from works', 'Builds a set from an array.', {
  rows: [['"red"', '"blue"', '"red"']], call: 'HashSet::from(["red", "blue", "red"])', note: 'unique values', outs: ['{"blue", "red"}'],
  intro: 'Duplicates collapse.',
  steps: [['Three values arrive.', [0, 1, 2]], ['Two remain.', [], 'o0']],
  result: '{"blue", "red"}', resultCap: 'Order is not kept; the check prints it sorted.',
}, 'let s = HashSet::from(["red", "blue", "red"]); sorted_set(&s)');

add('linkedlist/from', 'from', LL, 'How LinkedList::from works', 'Builds a linked list from an array.', {
  rows: [nums([1, 2, 3])], call: 'LinkedList::from([1, 2, 3])', note: 'one node per element', outs: ['[1, 2, 3]'],
  intro: 'Each element gets its own heap node.',
  steps: [['Three nodes are linked.', [0, 1, 2]], ['[1, 2, 3].', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Usually a Vec or VecDeque is the better choice.',
}, 'd(std::collections::LinkedList::from([1, 2, 3]))');

add('linkedlist/from_iter', 'from_iter', LL, 'How LinkedList::from_iter works', 'Builds a linked list from an iterator.', {
  rows: [['"x".."z" chars']], call: "('x'..='z').collect::<LinkedList<_>>()", note: 'collect into a list', outs: ["['x', 'y', 'z']"],
  intro: 'Each item is pushed to the back.',
  steps: [['x, y, z arrive.', 0], ['They are linked in order.', [], 'o0']],
  result: "['x', 'y', 'z']", resultCap: 'Same as calling push_back for each item.',
}, 'd(std::collections::LinkedList::from_iter(\'x\'..=\'z\'))');

add('string/default', 'default', STR('String'), 'How String::default works', 'An empty String, used when a default value is needed.', {
  rows: [['#[derive(Default)] struct Form { name: String }']], call: 'Form::default().name', note: 'Default for String', outs: ['""'],
  intro: 'derive(Default) fills String fields with "".',
  steps: [['The struct asks each field for its default.', 0], ['String gives "".', [], 'o0']],
  result: '""', resultCap: 'Same as String::new().',
}, 'let s: String = Default::default(); d(s)');

add('vec/from_string', 'from', STR('Vec'), 'How Vec<u8>::from(String) works', 'Turns a String into its bytes, without copying.', {
  rows: [['String "ok"']], call: 'Vec::<u8>::from(s)', note: 'same as into_bytes', outs: ['[111, 107]'],
  intro: 'The String\'s buffer becomes the Vec.',
  steps: [['The String is consumed.', 0], ['Its UTF-8 bytes remain.', [], 'o0']],
  result: '[111, 107]', resultCap: 'String::from_utf8 goes back, checking validity.',
}, 'd(Vec::<u8>::from(String::from("ok")))');

add('box_str/from', 'from', STR('Box'), 'How Box<str>::from(String) works', 'Turns a String into a Box<str>, dropping spare capacity.', {
  rows: [['String "id-1"']], call: 'Box::<str>::from(s)', note: 'fixed text', outs: ['Box<str> "id-1"'],
  intro: 'A Box<str> is a little smaller and cannot grow.',
  steps: [['The String gives up its spare room.', 0], ['A Box<str> holds the text.', [], 'o0']],
  result: '"id-1"', resultCap: 'Same as s.into_boxed_str().',
}, 'let b: Box<str> = Box::from(String::from("id-1")); d(b)');

add('char/from_u8', 'from', ['core', 'char', /char\/convert\.rs$/], 'How char::from(u8) works', 'Turns a byte into the character with that number (0 to 255).', {
  rows: [['65', '233']], call: 'char::from(65u8)', note: 'never fails', outs: ["'A'", "'é'"],
  intro: 'Every u8 is a valid char: 0–127 is ASCII, 128–255 is Latin-1.',
  steps: [["65 → 'A'.", 0, 'o0'], ["233 → 'é'.", 1, 'o1']],
  result: "'A', 'é'", resultCap: 'For bigger numbers use char::from_u32, which can fail.',
}, 'format!("{:?}, {:?}", char::from(65u8), char::from(233u8))');

add('u32/from_char', 'from', ['core', 'u32', /char\/convert\.rs$/], 'How u32::from(char) works', 'The Unicode number (code point) of a character.', {
  rows: [["'A'", "'🦀'"]], call: "u32::from('🦀')", note: 'char → number', outs: ['65', '129408'],
  intro: 'Every char is a number between 0 and 0x10FFFF.',
  steps: [["'A' is 65.", 0, 'o0'], ['The crab is 129408 (0x1F980).', 1, 'o1']],
  result: '65, 129408', resultCap: "c as u32 does the same.",
}, 'format!("{}, {}", u32::from(\'A\'), u32::from(\'🦀\'))');

add('rc/from', 'from', ['alloc', 'Rc', /^src\/rc\.rs$/], 'How Rc::from works', 'Moves a value (a String, Vec, Box, …) into a new Rc.', {
  rows: [['vec![1, 2]']], call: 'let shared: Rc<[i32]> = Rc::from(vec![1, 2]);', note: 'Rc<[T]>, Rc<str>', outs: ['Rc<[i32]> [1, 2]'],
  intro: 'From a Vec you get a shared slice; from a String a shared str.',
  steps: [['The elements move into the Rc allocation.', 0], ['Clones now share them.', [], 'o0']],
  result: '[1, 2]', resultCap: 'Rc<str> is a cheap-to-clone, immutable string.',
}, 'let r: Rc<[i32]> = Rc::from(vec![1, 2]); d(r)');

add('arc/from', 'from', ['alloc', 'Arc', /^src\/sync\.rs$/], 'How Arc::from works', 'Moves a value (a String, Vec, Box, …) into a new Arc.', {
  rows: [['String "cfg"']], call: 'let s: Arc<str> = Arc::from(String::from("cfg"));', note: 'shareable across threads', outs: ['Arc<str> "cfg"'],
  intro: 'Arc<str> is a thread-safe shared string.',
  steps: [['The text moves into the Arc.', 0], ['Threads can now share it.', [], 'o0']],
  result: '"cfg"', resultCap: 'Cloning an Arc<str> copies only a pointer.',
}, 'let s: std::sync::Arc<str> = std::sync::Arc::from(String::from("cfg")); d(s)');

add('rc/from_iter', 'from_iter', ['alloc', 'Rc', /^src\/rc\.rs$/], 'How Rc::from_iter works', 'Collects an iterator into a shared Rc<[T]>.', {
  rows: [['1..=3']], call: '(1..=3).collect::<Rc<[i32]>>()', note: 'collect straight into an Rc', outs: ['[1, 2, 3]'],
  intro: 'No separate Vec is needed in your code.',
  steps: [['The items are collected.', 0], ['They live in one Rc allocation.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Arc<[T]> works the same way.',
}, 'let r: Rc<[i32]> = Rc::from_iter(1..=3); d(r)');

add('option/from_iter', 'from_iter', ['core', 'Option', /^src\/option\.rs$/], 'How collect into Option works', 'Collects Options into Some(collection), or None if any item is None.', {
  rows: [['Some(1)', 'Some(2)'], ['Some(1)', 'None']], call: 'v.into_iter().collect::<Option<Vec<_>>>()', note: 'all or nothing', outs: ['Some([1, 2])', 'None'],
  intro: 'One None makes the whole result None.',
  steps: [['All Some: Some([1, 2]).', ['a0', 'a1'], 'o0'], ['A None appears: None.', ['b0', 'b1'], 'o1']],
  result: 'Some([1, 2]), None', resultCap: 'Collecting Results works the same and keeps the first error.',
}, 'let a: Option<Vec<i32>> = Option::from_iter(vec![Some(1), Some(2)]); let b: Option<Vec<i32>> = Option::from_iter(vec![Some(1), None]); format!("{:?}, {:?}", a, b)');

module.exports = list;
