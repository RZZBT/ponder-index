// itertools: 36 animations (#1-36 of the Rust 1.98 plan). Each has `rs`, Rust code that computes the shown result;
// truth/run.cjs runs all of them against the real crate.
const { Scene, pick } = require('./scene.cjs');
const { itInterleave, itDedup } = require('../packages.cjs');
const r = (p, a, b) => { const o = []; for (let i = a; i < b; i++) o.push(p + i); return o; };
const nums = (a) => a.map(String);

const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });

add('interleave', 'How interleave() works', 'Takes turns between two iterators until both are empty.', itInterleave,
  'j((1..7).interleave(vec![-1, -2]))', '1, -1, 2, -2, 3, 4, 5, 6', 'result: 1, -1, 2, -2, 3, 4, 5, 6');
add('dedup', 'How dedup() works', 'Removes repeated items that sit next to each other.', itDedup,
  'j(vec![1, 1, 2, 3, 3, 2, 2].into_iter().dedup())', '1, 2, 3, 2', 'result: 1, 2, 3, 2');

add('chunks', 'How chunks() works', 'Hands out the items in groups of n; the last group may be shorter.', () => pick({
  call: '(1..=7).chunks(3)', note: 'groups of 3, in order', rows: [nums([1, 2, 3, 4, 5, 6, 7])], outs: ['[1, 2, 3]', '[4, 5, 6]', '[7]'],
  intro: 'chunks(3) reads the items 1 to 7 and hands them out in groups of 3.',
  steps: [
    { cap: 'The first 3 items form the first group: [1, 2, 3].', src: r('a', 0, 3), out: [0] },
    { cap: 'The next 3 items form the second group: [4, 5, 6].', src: r('a', 3, 6), out: [1], mark: { dim: r('a', 0, 3) } },
    { cap: 'Only 7 is left, so the last group is shorter: [7]. Nothing is dropped and nothing is padded.', src: ['a6'], out: [2], mark: { dim: r('a', 3, 6) } },
  ],
  result: '[1, 2, 3], [4, 5, 6], [7]', resultCap: '(1..=7).chunks(3) gives the groups [1, 2, 3], [4, 5, 6] and [7]. Each group is an iterator of its own; collect it to get a Vec.',
}), '{ let c = (1..=7).chunks(3); jd(c.into_iter().map(|g| g.collect::<Vec<_>>())) }', '[1, 2, 3], [4, 5, 6], [7]');

add('tuple-windows', 'How tuple_windows() works', 'Gives every pair of neighbours; the pairs overlap.', () => pick({
  call: 'vec![1, 2, 3, 4].into_iter().tuple_windows::<(_, _)>()', note: 'a window of 2 that moves one step at a time', rows: [nums([1, 2, 3, 4])], outs: ['(1, 2)', '(2, 3)', '(3, 4)'],
  intro: 'tuple_windows() looks at the items through a window as wide as the tuple type, here 2.',
  steps: [
    { cap: 'The window starts on the first two items and yields (1, 2).', src: ['a0', 'a1'], out: [0] },
    { cap: 'It moves one step to the right: (2, 3). The 2 is used again.', src: ['a1', 'a2'], out: [1], eq: 'the window moves 1 step, not 2' },
    { cap: 'One more step: (3, 4). The window has reached the end.', src: ['a2', 'a3'], out: [2] },
  ],
  result: '(1, 2), (2, 3), (3, 4)', resultCap: 'Four items give three overlapping pairs: (1, 2), (2, 3), (3, 4). Use tuples() for pairs that do not overlap.',
}), 'jd(vec![1, 2, 3, 4].into_iter().tuple_windows::<(_, _)>())', '(1, 2), (2, 3), (3, 4)');

add('circular-tuple-windows', 'How circular_tuple_windows() works', 'Like tuple_windows(), but the window wraps around to the start.', () => pick({
  call: 'vec![1, 2, 3].into_iter().circular_tuple_windows::<(_, _)>()', note: 'the last window wraps around to the first item', rows: [nums([1, 2, 3])], outs: ['(1, 2)', '(2, 3)', '(3, 1)'],
  intro: 'circular_tuple_windows() treats the items as if they were in a circle: after 3 comes 1 again.',
  steps: [
    { cap: 'The first window is (1, 2).', src: ['a0', 'a1'], out: [0] },
    { cap: 'Then (2, 3), as with tuple_windows().', src: ['a1', 'a2'], out: [1] },
    { cap: 'The window now starts at the last item. There is nothing after 3, so it wraps around and takes 1: (3, 1).', src: ['a2', 'a0'], out: [2], eq: '3 → back to the start → 1' },
  ],
  result: '(1, 2), (2, 3), (3, 1)', resultCap: 'Three items give three windows, one starting at each item: (1, 2), (2, 3), (3, 1).',
}), 'jd(vec![1, 2, 3].into_iter().circular_tuple_windows::<(_, _)>())', '(1, 2), (2, 3), (3, 1)');

add('tuples', 'How tuples() works', 'Groups items into tuples that do not overlap; leftovers are not yielded.', () => pick({
  call: 'vec![1, 2, 3, 4, 5].into_iter().tuples::<(_, _)>()', note: 'pairs that do not overlap', rows: [nums([1, 2, 3, 4, 5])], outs: ['(1, 2)', '(3, 4)'],
  intro: 'tuples() fills one tuple at a time; the tuple type (_, _) says each tuple has 2 items.',
  steps: [
    { cap: 'The first two items make (1, 2).', src: ['a0', 'a1'], out: [0] },
    { cap: 'The next two make (3, 4). Unlike tuple_windows(), no item is used twice.', src: ['a2', 'a3'], out: [1], mark: { dim: ['a0', 'a1'] } },
    { cap: '5 is left, but a pair needs two items. tuples() does not yield an incomplete tuple, so 5 is not part of the result.', src: ['a4'], srcColor: 'danger', mark: { dim: ['a2', 'a3'] }, eq: 'no partner for 5' },
  ],
  result: '(1, 2), (3, 4)', resultCap: 'The result is (1, 2), (3, 4). The leftover 5 can still be read with .into_buffer() on the Tuples iterator.',
}), 'jd(vec![1, 2, 3, 4, 5].into_iter().tuples::<(_, _)>())', '(1, 2), (3, 4)');

add('chunk-by', 'How chunk_by() works', 'Groups neighbouring items that have the same key.', () => pick({
  call: 'vec![1, 1, 2, 3, 3].into_iter().chunk_by(|x| *x)', note: 'neighbours with the same key share a group', rows: [nums([1, 1, 2, 3, 3])], outs: ['[1, 1]', '[2]', '[3, 3]'],
  intro: 'chunk_by() computes a key for every item (here the item itself) and starts a new group each time the key changes.',
  steps: [
    { cap: 'The first two items both have key 1, so they form one group: [1, 1].', src: ['a0', 'a1'], out: [0], eq: 'key 1, key 1' },
    { cap: 'The key changes to 2: the first group ends and a new one starts: [2].', src: ['a2'], out: [1], eq: 'key changed: 1 → 2' },
    { cap: 'The key changes to 3. Both 3s sit next to each other, so they share the last group: [3, 3].', src: ['a3', 'a4'], out: [2], eq: 'key changed: 2 → 3' },
  ],
  result: '[1, 1], [2], [3, 3]', resultCap: 'Only neighbours are grouped: [1, 2, 1] would give three groups. Before itertools 0.13 this method was called group_by.',
}), '{ let g = vec![1, 1, 2, 3, 3].into_iter().chunk_by(|x| *x); jd(g.into_iter().map(|(_, c)| c.collect::<Vec<_>>())) }', '[1, 1], [2], [3, 3]');

add('unique', 'How unique() works', 'Removes every repeated item and keeps the first time each one appears.', () => pick({
  call: 'vec![3, 1, 3, 2, 1].into_iter().unique()', note: 'remembers every item it has seen', rows: [nums([3, 1, 3, 2, 1])], outs: [null, null, null],
  intro: 'unique() keeps a set of the items it has already yielded.',
  steps: [
    { cap: '3 has not been seen: it is yielded and remembered.', src: ['a0'], move: { a0: 0 }, eq: 'seen: {3}' },
    { cap: '1 is new too: yielded.', src: ['a1'], move: { a1: 1 }, eq: 'seen: {3, 1}' },
    { cap: '3 is already in the set, so it is skipped, even though it is not next to the first 3.', src: ['a2'], srcColor: 'danger', eq: 'seen: {3, 1}' },
    { cap: '2 is new: yielded.', src: ['a3'], move: { a3: 2 }, eq: 'seen: {3, 1, 2}' },
    { cap: '1 was seen before: skipped.', src: ['a4'], srcColor: 'danger', mark: { dim: ['a2'] }, eq: 'seen: {3, 1, 2}' },
  ],
  result: '3, 1, 2', resultCap: 'unique() yields 3, 1, 2: first-seen order is kept. Compare dedup(), which only removes repeats that are neighbours.',
}), 'j(vec![3, 1, 3, 2, 1].into_iter().unique())', '3, 1, 2');

add('unique-by', 'How unique_by() works', 'Keeps the first item for each key a function computes.', () => pick({
  call: '["apple", "avocado", "berry"].iter().unique_by(|s| s.chars().next())', note: 'unique by the first letter', rows: [['apple', 'avocado', 'berry']], outs: [null, null],
  intro: 'unique_by() remembers keys, not items. The key here is the first letter of each word.',
  steps: [
    { cap: '"apple" has key \'a\', which is new: "apple" is yielded.', src: ['a0'], move: { a0: 0 }, eq: "keys seen: {'a'}" },
    { cap: '"avocado" also has key \'a\'. The word is different, but the key was seen, so it is skipped.', src: ['a1'], srcColor: 'danger', eq: "'a' again → skip" },
    { cap: '"berry" has key \'b\', which is new: yielded.', src: ['a2'], move: { a2: 1 }, eq: "keys seen: {'a', 'b'}" },
  ],
  result: 'apple, berry', resultCap: 'The result is "apple", "berry": one word for each first letter, the first one found.',
}), 'j(["apple", "avocado", "berry"].iter().unique_by(|s| s.chars().next()))', 'apple, berry');

add('dedup-with-count', 'How dedup_with_count() works', 'Collapses each run of equal neighbours into (count, item).', () => pick({
  call: "vec!['a', 'a', 'b', 'a'].into_iter().dedup_with_count()", note: 'run-length counting', rows: [["'a'", "'a'", "'b'", "'a'"]], outs: ["(2, 'a')", "(1, 'b')", "(1, 'a')"],
  intro: 'dedup_with_count() walks the items and counts how long each run of equal neighbours is.',
  steps: [
    { cap: "Two 'a's in a row: one run of length 2, yielded as (2, 'a').", src: ['a0', 'a1'], out: [0] },
    { cap: "'b' is different, so a new run starts. It has length 1: (1, 'b').", src: ['a2'], out: [1] },
    { cap: "Another 'a'. It is not next to the first run, so it is a new run: (1, 'a').", src: ['a3'], out: [2] },
  ],
  result: "(2, 'a'), (1, 'b'), (1, 'a')", resultCap: "The count comes first in each tuple. Use counts() for a total per item instead: 'a' would be 3.",
}), "jd(vec!['a', 'a', 'b', 'a'].into_iter().dedup_with_count())", "(2, 'a'), (1, 'b'), (1, 'a')");

add('counts', 'How counts() works', 'Counts how many times each item appears, in a HashMap.', () => pick({
  call: '"hello".chars().counts()', note: 'a frequency table: item → number of times', rows: [["'h'", "'e'", "'l'", "'l'", "'o'"]], outs: ['h: 1', 'e: 1', 'l: 2', 'o: 1'],
  intro: 'counts() reads every item and adds 1 to that item\'s counter in a HashMap.',
  steps: [
    { cap: "'h' gets a counter: 1.", src: ['a0'], out: [0] },
    { cap: "'e' gets a counter: 1.", src: ['a1'], out: [1] },
    { cap: "'l' gets a counter: 1.", src: ['a2'], out: [2], set: { 2: 'l: 1' } },
    { cap: "'l' again: its counter goes up to 2. The two l's did not have to be neighbours.", src: ['a3'], set: { 2: 'l: 2' } },
    { cap: "'o' gets a counter: 1.", src: ['a4'], out: [3] },
  ],
  result: 'h: 1, e: 1, l: 2, o: 1', resultCap: 'The result is a HashMap<char, usize>. A HashMap has no fixed order; the counts are shown here in the order the letters first appear.',
}), '{ let m = "hello".chars().counts(); "hello".chars().unique().map(|c| format!("{}: {}", c, m[&c])).join(", ") }', 'h: 1, e: 1, l: 2, o: 1');

add('into-group-map', 'How into_group_map() works', 'Collects (key, value) pairs into a HashMap of key → list of values.', () => pick({
  call: 'vec![("a", 1), ("b", 2), ("a", 3)].into_iter().into_group_map()', note: 'one list of values per key', rows: [['("a", 1)', '("b", 2)', '("a", 3)']], outs: ['"a": [1, 3]', '"b": [2]'],
  intro: 'into_group_map() reads pairs. The first part is the key, the second is a value to add to that key\'s list.',
  steps: [
    { cap: 'Key "a" is new: it gets the list [1].', src: ['a0'], out: [0], set: { 0: '"a": [1]' } },
    { cap: 'Key "b" is new: it gets the list [2].', src: ['a1'], out: [1] },
    { cap: 'Key "a" already has a list, so 3 is pushed onto it: [1, 3]. Values keep their input order.', src: ['a2'], set: { 0: '"a": [1, 3]' } },
  ],
  result: '"a": [1, 3], "b": [2]', resultCap: 'The result is a HashMap<&str, Vec<i32>>. The map itself has no fixed order (keys are sorted here); each list is in input order.',
}), '{ let m = vec![("a", 1), ("b", 2), ("a", 3)].into_iter().into_group_map(); let mut k: Vec<_> = m.keys().copied().collect(); k.sort(); k.iter().map(|x| format!("{:?}: {:?}", x, m[x])).join(", ") }', '"a": [1, 3], "b": [2]');

add('cartesian-product', 'How cartesian_product() works', 'Pairs every item of one iterator with every item of another.', () => pick({
  call: "(1..=2).cartesian_product(vec!['a', 'b'])", note: 'every pair: 2 × 2 = 4', rows: [['1', '2'], ["'a'", "'b'"]], outs: ["(1, 'a')", "(1, 'b')", "(2, 'a')", "(2, 'b')"],
  intro: 'cartesian_product() takes each item of the first iterator and pairs it with every item of the second.',
  steps: [
    { cap: "1 is paired with 'a' and then with 'b'.", src: ['a0', 'b0', 'b1'], out: [0, 1] },
    { cap: "Then 2 is paired with 'a' and with 'b'. The second iterator is cloned so it can be walked again.", src: ['a1', 'b0', 'b1'], out: [2, 3] },
    { cap: 'The first item changes slowest, like the outer loop of two nested for loops.', eq: 'for x in 1..=2 { for y in [a, b] { (x, y) } }' },
  ],
  result: "(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')", resultCap: "2 items × 2 items give 4 pairs: (1, 'a'), (1, 'b'), (2, 'a'), (2, 'b').",
}), "jd((1..=2).cartesian_product(vec!['a', 'b']))", "(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')");

add('multi-cartesian-product', 'How multi_cartesian_product() works', 'Every combination that takes one item from each of many lists.', () => pick({
  call: 'vec![vec![0, 1], vec![0, 1]].into_iter().multi_cartesian_product()', note: 'one item from each list, in every possible way', rows: [['0', '1'], ['0', '1']], rowNames: ['list 1', 'list 2'], outs: ['[0, 0]', '[0, 1]', '[1, 0]', '[1, 1]'],
  intro: 'multi_cartesian_product() works on an iterator of lists. Each result is a Vec with one item from every list.',
  steps: [
    { cap: 'Take 0 from list 1 and 0 from list 2: [0, 0].', src: ['a0', 'b0'], out: [0] },
    { cap: 'The last list advances first: [0, 1].', src: ['a0', 'b1'], out: [1] },
    { cap: 'List 2 is used up, so list 1 advances and list 2 starts again: [1, 0].', src: ['a1', 'b0'], out: [2] },
    { cap: 'Then [1, 1]. Both lists are used up, so the iterator ends.', src: ['a1', 'b1'], out: [3] },
  ],
  result: '[0, 0], [0, 1], [1, 0], [1, 1]', resultCap: 'With n lists this is like n nested loops: these are the binary numbers 00, 01, 10, 11.',
}), 'jd(vec![vec![0, 1], vec![0, 1]].into_iter().multi_cartesian_product())', '[0, 0], [0, 1], [1, 0], [1, 1]');

add('combinations', 'How combinations() works', 'Every way to choose k items, when order does not matter.', () => pick({
  call: 'vec![1, 2, 3].into_iter().combinations(2)', note: 'choose 2 of 3; [2, 1] is the same choice as [1, 2]', rows: [nums([1, 2, 3])], outs: ['[1, 2]', '[1, 3]', '[2, 3]'],
  intro: 'combinations(2) yields every way to choose 2 of the items, keeping them in their original order.',
  steps: [
    { cap: 'Start with the first two items: [1, 2].', src: ['a0', 'a1'], out: [0] },
    { cap: 'Keep 1 and move the second choice on: [1, 3].', src: ['a0', 'a2'], out: [1] },
    { cap: 'Move the first choice on to 2. Only 3 can follow it: [2, 3].', src: ['a1', 'a2'], out: [2] },
    { cap: 'Choices like [2, 1] or [3, 1] are never made: they hold the same items as [1, 2] and [1, 3].', eq: '3 items choose 2 = 3 combinations' },
  ],
  result: '[1, 2], [1, 3], [2, 3]', resultCap: 'The result is [1, 2], [1, 3], [2, 3]. permutations(2) would also give the reversed orders: 6 in all.',
}), 'jd(vec![1, 2, 3].into_iter().combinations(2))', '[1, 2], [1, 3], [2, 3]');

add('combinations-with-replacement', 'How combinations_with_replacement() works', 'Like combinations(), but an item may be chosen more than once.', () => pick({
  call: 'vec![1, 2].into_iter().combinations_with_replacement(2)', note: 'choose 2, and the same item may be picked again', rows: [nums([1, 2])], outs: ['[1, 1]', '[1, 2]', '[2, 2]'],
  intro: 'combinations_with_replacement(2) puts each chosen item back, so it can be chosen again.',
  steps: [
    { cap: '1 is chosen, put back, and chosen again: [1, 1].', src: ['a0'], out: [0], eq: '1 twice' },
    { cap: 'Then 1 and 2: [1, 2].', src: ['a0', 'a1'], out: [1] },
    { cap: '2 twice: [2, 2]. [2, 1] is not given: it is the same choice as [1, 2].', src: ['a1'], out: [2], eq: '2 twice' },
  ],
  result: '[1, 1], [1, 2], [2, 2]', resultCap: 'Plain combinations(2) of [1, 2] would only give [1, 2]. With replacement there are 3 choices.',
}), 'jd(vec![1, 2].into_iter().combinations_with_replacement(2))', '[1, 1], [1, 2], [2, 2]');

add('permutations', 'How permutations() works', 'Every ordered arrangement of k items: order matters.', () => pick({
  call: 'vec![1, 2, 3].into_iter().permutations(2)', note: 'order matters: [1, 2] and [2, 1] are different', rows: [nums([1, 2, 3])], outs: ['[1, 2]', '[1, 3]', '[2, 1]', '[2, 3]', '[3, 1]', '[3, 2]'],
  intro: 'permutations(2) yields every way to arrange 2 of the 3 items in a row.',
  steps: [
    { cap: '1 first, then each of the others: [1, 2], [1, 3].', src: ['a0'], out: [0, 1] },
    { cap: '2 first: [2, 1], [2, 3]. [2, 1] counts, because the order is different from [1, 2].', src: ['a1'], out: [2, 3] },
    { cap: '3 first: [3, 1], [3, 2].', src: ['a2'], out: [4, 5] },
    { cap: '3 choices for the first place × 2 for the second = 6. combinations(2) gives only 3.', eq: '3 × 2 = 6 permutations' },
  ],
  result: '[1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2]', resultCap: 'All 6 arrangements, in order of the first item.',
}), 'jd(vec![1, 2, 3].into_iter().permutations(2))', '[1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2]');

add('powerset', 'How powerset() works', 'Every subset of the items, from the empty one to all of them.', () => pick({
  call: 'vec![1, 2, 3].into_iter().powerset()', note: 'every subset, smallest first', rows: [nums([1, 2, 3])], outs: ['[]', '[1]', '[2]', '[3]', '[1, 2]', '[1, 3]', '[2, 3]', '[1, 2, 3]'],
  intro: 'powerset() yields all combinations of size 0, then size 1, then size 2, and so on.',
  steps: [
    { cap: 'Size 0: the empty subset [].', out: [0], eq: 'size 0' },
    { cap: 'Size 1: each item on its own.', src: r('a', 0, 3), out: [1, 2, 3], eq: 'size 1' },
    { cap: 'Size 2: the combinations of 2 items.', out: [4, 5, 6], eq: 'size 2' },
    { cap: 'Size 3: all the items. Each item is either in or out of a subset, so there are 2 × 2 × 2 = 8 subsets.', src: r('a', 0, 3), out: [7], eq: '2³ = 8 subsets' },
  ],
  result: '[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]', resultCap: 'All 8 subsets. The number doubles with every extra item, so long inputs give huge results.',
}), 'jd(vec![1, 2, 3].into_iter().powerset())', '[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]');

add('join', 'How join() works', 'Turns the items into one String with a separator between them.', () => pick({
  call: '[1, 2, 3].iter().join(", ")', note: 'the separator goes between items, not after the last', rows: [nums([1, 2, 3])], outs: ['"1, 2, 3"'],
  intro: 'join() formats every item with Display and glues them into one String.',
  steps: [
    { cap: 'The first item starts the string: "1".', src: ['a0'], out: [0], set: { 0: '"1"' } },
    { cap: 'Before each later item, the separator ", " is added: "1, 2".', src: ['a1'], set: { 0: '"1, 2"' }, eq: 'separator, then item' },
    { cap: 'Then ", 3". There are no more items, so nothing is added after the 3.', src: ['a2'], set: { 0: '"1, 2, 3"' } },
  ],
  result: '"1, 2, 3"', resultCap: 'join(", ") returns the String "1, 2, 3". An empty iterator gives an empty String.',
}), 'd([1, 2, 3].iter().join(", "))', '"1, 2, 3"');

add('intersperse', 'How intersperse() works', 'Puts a separator item between every two items.', () => pick({
  call: 'vec![1, 2, 3].into_iter().intersperse(0)', note: 'a 0 between items, never at the ends', rows: [nums([1, 2, 3])], outs: [null, '0', null, '0', null], outFill: 'warning',
  intro: 'intersperse(0) yields the items as they are, with a 0 between each pair of neighbours.',
  steps: [
    { cap: 'The first item, 1, comes out unchanged.', src: ['a0'], move: { a0: 0 } },
    { cap: 'Before the next item a 0 is yielded, then 2.', src: ['a1'], out: [1], move: { a1: 2 } },
    { cap: 'Another 0, then 3.', src: ['a2'], out: [3], move: { a2: 4 } },
    { cap: 'The input is empty, so intersperse() stops. There is no 0 after the last item.', eq: '3 items → 2 separators' },
  ],
  result: '1, 0, 2, 0, 3', resultCap: 'intersperse(0) yields 1, 0, 2, 0, 3. Use join() when you want a String instead.',
}), 'j(vec![1, 2, 3].into_iter().intersperse(0))', '1, 0, 2, 0, 3');

const mergeSteps = [
  ['Compare the fronts: 1 and 2. 1 is smaller, so it comes out first.', 'a0', 0, '1 < 2'],
  ['Now 4 and 2: 2 is smaller.', 'b0', 1, '4 > 2'],
  ['4 and 3: 3 is smaller.', 'b1', 2, '4 > 3'],
  ['4 and 8: 4.', 'a1', 3, '4 < 8'],
  ['7 and 8: 7.', 'a2', 4, '7 < 8'],
  ['The first list is empty, so the rest of the second follows: 8.', 'b2', 5, ''],
];
add('merge', 'How merge() works', 'Merges two sorted iterators into one sorted iterator.', () => pick({
  call: 'vec![1, 4, 7].into_iter().merge(vec![2, 3, 8])', note: 'both inputs are sorted, so the output is sorted too', rows: [nums([1, 4, 7]), nums([2, 3, 8])], outs: [null, null, null, null, null, null],
  intro: 'merge() only ever looks at the front item of each input and yields the smaller one.',
  steps: mergeSteps.map(([cap, id, j, eq]) => ({ cap, src: [id], move: { [id]: j }, eq })),
  result: '1, 2, 3, 4, 7, 8', resultCap: 'Each item is compared once or twice, no sorting needed. If the inputs are not sorted, the output is not sorted either.',
}), 'j(vec![1, 4, 7].into_iter().merge(vec![2, 3, 8]))', '1, 2, 3, 4, 7, 8');

add('kmerge', 'How kmerge() works', 'Merges any number of sorted iterators into one sorted iterator.', () => pick({
  call: 'vec![vec![1, 4], vec![2, 5], vec![3, 6]].into_iter().kmerge()', note: 'the smallest front item comes out each time', rows: [nums([1, 4]), nums([2, 5]), nums([3, 6])], rowFills: ['accent', 'accent2', 'accent'], outs: [null, null, null, null, null, null],
  intro: 'kmerge() keeps the front item of every list in a small heap and always yields the smallest.',
  steps: [
    { cap: 'Fronts: 1, 2, 3. The smallest is 1.', src: ['a0'], move: { a0: 0 }, eq: 'fronts 1, 2, 3' },
    { cap: 'Fronts: 4, 2, 3. The smallest is 2.', src: ['b0'], move: { b0: 1 }, eq: 'fronts 4, 2, 3' },
    { cap: 'Fronts: 4, 5, 3. The smallest is 3.', src: ['c0'], move: { c0: 2 }, eq: 'fronts 4, 5, 3' },
    { cap: 'Fronts: 4, 5, 6. 4 comes out.', src: ['a1'], move: { a1: 3 }, eq: 'fronts 4, 5, 6' },
    { cap: 'Then 5.', src: ['b1'], move: { b1: 4 }, eq: 'fronts 5, 6' },
    { cap: 'Only 6 is left.', src: ['c1'], move: { c1: 5 }, eq: 'fronts 6' },
  ],
  result: '1, 2, 3, 4, 5, 6', resultCap: 'Three sorted lists merged into 1, 2, 3, 4, 5, 6. With two lists, merge() does the same.',
}), 'j(vec![vec![1, 4], vec![2, 5], vec![3, 6]].into_iter().kmerge())', '1, 2, 3, 4, 5, 6');

add('zip-longest', 'How zip_longest() works', 'Walks two iterators side by side and keeps going until both are empty.', () => pick({
  call: "vec![1, 2, 3].into_iter().zip_longest(vec!['a'])", note: 'unlike zip(), nothing is dropped', rows: [nums([1, 2, 3]), ["'a'"]], outs: ["Both(1, 'a')", 'Left(2)', 'Left(3)'],
  intro: 'zip_longest() yields an EitherOrBoth for each position: Both when both sides have an item, Left or Right when only one does.',
  steps: [
    { cap: "Both sides have an item: Both(1, 'a').", src: ['a0', 'b0'], out: [0] },
    { cap: 'The right side is empty. zip() would stop here; zip_longest() yields Left(2).', src: ['a1'], out: [1], eq: 'right side empty' },
    { cap: 'And Left(3). Then both sides are empty and it stops.', src: ['a2'], out: [2] },
  ],
  result: "Both(1, 'a'), Left(2), Left(3)", resultCap: "Every item appears once. Match on Both, Left and Right to handle each case.",
}), "jd(vec![1, 2, 3].into_iter().zip_longest(vec!['a']))", "Both(1, 'a'), Left(2), Left(3)");

add('interleave-shortest', 'How interleave_shortest() works', 'Takes turns between two iterators and stops when the one whose turn it is runs out.', () => pick({
  call: 'vec![1, 3, 5, 7].into_iter().interleave_shortest(vec![2, 4])', note: 'stops as soon as a turn cannot be taken', rows: [nums([1, 3, 5, 7]), nums([2, 4])], outs: [null, null, null, null, null],
  intro: 'interleave_shortest() takes one item from each side in turn, starting with the first.',
  steps: [
    { cap: 'First side: 1.', src: ['a0'], move: { a0: 0 } },
    { cap: 'Second side: 2.', src: ['b0'], move: { b0: 1 } },
    { cap: 'First side: 3. Second side: 4.', src: ['a1', 'b1'], move: { a1: 2, b1: 3 } },
    { cap: 'First side: 5.', src: ['a2'], move: { a2: 4 } },
    { cap: "It is the second side's turn, but it is empty, so the iterator stops. 7 is never yielded; interleave() would have yielded it.", src: ['a3'], srcColor: 'danger', eq: 'second side empty → stop' },
  ],
  result: '1, 2, 3, 4, 5', resultCap: 'The result is 1, 2, 3, 4, 5. Use interleave() to keep the rest of the longer side.',
}), 'j(vec![1, 3, 5, 7].into_iter().interleave_shortest(vec![2, 4]))', '1, 2, 3, 4, 5');

add('minmax', 'How minmax() works', 'Finds the smallest and the largest item in one pass.', () => pick({
  call: 'vec![4, 9, 1].into_iter().minmax()', note: 'both ends in one pass over the items', rows: [nums([4, 9, 1])],
  intro: 'minmax() walks the items once and updates the smallest and largest seen so far.',
  steps: [
    { cap: 'The first item is both the smallest and the largest so far.', src: ['a0'], eq: 'min 4, max 4' },
    { cap: '9 is larger than 4: the largest is now 9.', src: ['a1'], eq: 'min 4, max 9' },
    { cap: '1 is smaller than 4: the smallest is now 1.', src: ['a2'], eq: 'min 1, max 9' },
    { cap: 'The items are used up. Calling min() and then max() would walk them twice.', mark: { success: ['a1', 'a2'] } },
  ],
  result: 'MinMax(1, 9)', resultCap: 'The result is MinMax(1, 9). An empty iterator gives NoElements and a single item gives OneElement(x).',
}), 'd(vec![4, 9, 1].into_iter().minmax())', 'MinMax(1, 9)');

add('position-max', 'How position_max() works', 'Gives the index of the largest item, not the item itself.', () => pick({
  call: 'vec![4, 9, 1].into_iter().position_max()', note: 'where the largest is (index 0, 1, 2)', rows: [nums([4, 9, 1])], rowNames: ['index 0, 1, 2:'],
  intro: 'position_max() remembers the largest item seen so far and its index.',
  steps: [
    { cap: 'Index 0 holds 4: the largest so far.', src: ['a0'], eq: 'largest 4 at index 0' },
    { cap: 'Index 1 holds 9, which is larger: remember index 1.', src: ['a1'], eq: 'largest 9 at index 1' },
    { cap: 'Index 2 holds 1, which is smaller: nothing changes.', src: ['a2'], eq: 'largest 9 at index 1' },
    { cap: 'The answer is the index, 1, wrapped in Some. When several items are equally large, the index of the last one is returned.', mark: { success: ['a1'] } },
  ],
  result: 'Some(1)', resultCap: 'position_max() returns Some(1); an empty iterator gives None. max() would return Some(9) instead.',
}), 'd(vec![4, 9, 1].into_iter().position_max())', 'Some(1)');

add('positions', 'How positions() works', 'Gives the index of every item that matches a condition.', () => pick({
  call: 'vec![1, 2, 3, 4].into_iter().positions(|x| x % 2 == 0)', note: 'indices of the even numbers', rows: [nums([1, 2, 3, 4])], rowNames: ['index 0..3:'], outs: ['1', '3'], outFill: 'warning',
  intro: 'positions() tests every item and yields its index when the test is true.',
  steps: [
    { cap: 'Index 0 holds 1: odd, skipped.', src: ['a0'], srcColor: 'danger', eq: '1 % 2 = 1' },
    { cap: 'Index 1 holds 2: even, so the index 1 is yielded.', src: ['a1'], out: [0], eq: '2 % 2 = 0' },
    { cap: 'Index 2 holds 3: odd, skipped.', src: ['a2'], srcColor: 'danger', eq: '3 % 2 = 1' },
    { cap: 'Index 3 holds 4: even, so 3 is yielded.', src: ['a3'], out: [1], eq: '4 % 2 = 0' },
  ],
  result: '1, 3', resultCap: 'The result is the indices 1, 3, not the items 2 and 4. Iterator::position() only finds the first match.',
}), 'j(vec![1, 2, 3, 4].into_iter().positions(|x| x % 2 == 0))', '1, 3');

add('k-smallest', 'How k_smallest() works', 'Finds the k smallest items without sorting all of them.', () => pick({
  call: 'vec![5, 1, 4, 2, 3].into_iter().k_smallest(2)', note: 'only 2 items are kept at any time', rows: [nums([5, 1, 4, 2, 3])],
  intro: 'k_smallest(2) keeps the 2 smallest items seen so far in a small heap. Anything larger is thrown away.',
  steps: [
    { cap: '5 and 1 fill the 2 places.', src: ['a0', 'a1'], mark: { success: ['a0', 'a1'] }, eq: 'kept: 5, 1' },
    { cap: '4 is smaller than the largest kept item, 5, so 4 replaces 5.', src: ['a2'], mark: { success: ['a2'], dim: ['a0'] }, eq: 'kept: 4, 1' },
    { cap: '2 is smaller than 4, so 2 replaces 4.', src: ['a3'], mark: { success: ['a3'], dim: ['a2'] }, eq: 'kept: 2, 1' },
    { cap: '3 is larger than 2: it cannot be among the 2 smallest, so it is dropped.', src: ['a4'], srcColor: 'danger', eq: 'kept: 2, 1' },
    { cap: 'At the end the kept items are sorted and yielded.', mark: { dim: ['a4'] }, eq: 'sorted: 1, 2' },
  ],
  result: '1, 2', resultCap: 'k_smallest(2) yields 1, 2. Memory use stays at k items, however long the input is.',
}), 'j(vec![5, 1, 4, 2, 3].into_iter().k_smallest(2))', '1, 2');

add('sorted', 'How sorted() works', 'Collects any iterator and yields its items in sorted order.', () => pick({
  call: 'vec![3, 1, 2].into_iter().sorted()', note: 'collect everything, sort, then yield', rows: [nums([3, 1, 2])], outs: [null, null, null],
  intro: 'sorted() cannot yield anything before it has seen every item: the smallest might be the last one.',
  steps: [
    { cap: 'First it collects all items into a Vec.', src: r('a', 0, 3), eq: 'Vec [3, 1, 2]' },
    { cap: 'It sorts the Vec. 1 is smallest, so it comes out first.', src: ['a1'], move: { a1: 0 }, eq: 'sort (stable)' },
    { cap: 'Then 2.', src: ['a2'], move: { a2: 1 } },
    { cap: 'Then 3.', src: ['a0'], move: { a0: 2 } },
  ],
  result: '1, 2, 3', resultCap: 'sorted() yields 1, 2, 3 as an iterator, so you can keep chaining. The sort is stable: equal items keep their order.',
}), 'j(vec![3, 1, 2].into_iter().sorted())', '1, 2, 3');

add('sorted-by-key', 'How sorted_by_key() works', 'Sorts items by a key a function computes.', () => pick({
  call: 'vec!["kiwi", "fig", "banana"].into_iter().sorted_by_key(|s| s.len())', note: 'sort by length, not alphabetically', rows: [['kiwi', 'fig', 'banana']], outs: [null, null, null],
  intro: 'sorted_by_key() computes a key for every item and sorts by the keys.',
  steps: [
    { cap: 'The keys are the lengths: kiwi → 4, fig → 3, banana → 6.', src: r('a', 0, 3), eq: 'keys: 4, 3, 6' },
    { cap: 'The smallest key is 3: "fig" comes first.', src: ['a1'], move: { a1: 0 }, eq: '3' },
    { cap: 'Then key 4: "kiwi".', src: ['a0'], move: { a0: 1 }, eq: '4' },
    { cap: 'Then key 6: "banana".', src: ['a2'], move: { a2: 2 }, eq: '6' },
  ],
  result: 'fig, kiwi, banana', resultCap: 'Alphabetically the order would be banana, fig, kiwi. Items with equal keys keep their input order.',
}), 'j(vec!["kiwi", "fig", "banana"].into_iter().sorted_by_key(|s| s.len()))', 'fig, kiwi, banana');

add('partition-map', 'How partition_map() works', 'Splits items into two collections that can have different types.', () => pick({
  call: 'vec![Ok(1), Err("x"), Ok(2)].into_iter().partition_map(...)', note: 'Ok values go left, Err values go right', rows: [['Ok(1)', 'Err("x")', 'Ok(2)']], outs: ['[1, 2]', '["x"]'],
  intro: 'partition_map() calls a closure on each item. The closure returns Either::Left(v) or Either::Right(v), here: Ok(v) → Left(v), Err(e) → Right(e).',
  steps: [
    { cap: 'Ok(1) → Left(1): 1 goes into the left Vec<i32>.', src: ['a0'], out: [0], set: { 0: '[1]' } },
    { cap: 'Err("x") → Right("x"): "x" goes into the right Vec<&str>.', src: ['a1'], out: [1] },
    { cap: 'Ok(2) → Left(2).', src: ['a2'], set: { 0: '[1, 2]' } },
  ],
  result: '([1, 2], ["x"])', resultCap: 'The result is a tuple of two collections: ([1, 2], ["x"]). Iterator::partition() can only split into two collections of the same type.',
}), '{ let (a, b): (Vec<i32>, Vec<&str>) = vec![Ok(1), Err("x"), Ok(2)].into_iter().partition_map(|r: Result<i32, &str>| match r { Ok(v) => Either::Left(v), Err(e) => Either::Right(e) }); d((a, b)) }', '([1, 2], ["x"])');

add('coalesce', 'How coalesce() works', 'Merges neighbouring items while a rule allows it.', () => pick({
  call: 'vec![1, 2, 3, 7, 8].into_iter().map(|x| (x, x)).coalesce(...)', note: 'merge (a, b) and (c, d) when c = b + 1', rows: [nums([1, 2, 3, 7, 8])], outs: ['(1, 3)', '(7, 8)'],
  intro: 'Each number becomes a range (x, x). coalesce() looks at the current range and the next one. The closure returns Ok(merged) to merge them, or Err to keep both.',
  steps: [
    { cap: 'The first range is (1, 1).', src: ['a0'], out: [0], set: { 0: '(1, 1)' } },
    { cap: '2 follows 1: merge into (1, 2).', src: ['a1'], set: { 0: '(1, 2)' }, eq: '2 = 1 + 1 → Ok' },
    { cap: '3 follows 2: merge into (1, 3).', src: ['a2'], set: { 0: '(1, 3)' }, eq: '3 = 2 + 1 → Ok' },
    { cap: '7 does not follow 3: (1, 3) is finished and yielded. (7, 7) starts.', src: ['a3'], out: [1], set: { 1: '(7, 7)' }, eq: '7 ≠ 3 + 1 → Err' },
    { cap: '8 follows 7: merge into (7, 8). The input ends, so (7, 8) is yielded.', src: ['a4'], set: { 1: '(7, 8)' }, eq: '8 = 7 + 1 → Ok' },
  ],
  result: '(1, 3), (7, 8)', resultCap: 'Runs of consecutive numbers became ranges: (1, 3), (7, 8). The closure was |a, b| if a.1 + 1 == b.0 { Ok((a.0, b.1)) } else { Err((a, b)) }.',
}), 'jd(vec![1, 2, 3, 7, 8].into_iter().map(|x| (x, x)).coalesce(|a, b| if a.1 + 1 == b.0 { Ok((a.0, b.1)) } else { Err((a, b)) }))', '(1, 3), (7, 8)');

add('fold-while', 'How fold_while() works', 'A fold that can stop before the end.', () => pick({
  call: 'vec![3, 4, 5, 6].into_iter().fold_while(0, ...)', note: 'add while the sum stays ≤ 10', rows: [nums([3, 4, 5, 6])],
  intro: 'fold_while() works like fold(), but the closure returns Continue(acc) to go on or Done(acc) to stop. The closure: if acc + x <= 10 { Continue(acc + x) } else { Done(acc) }.',
  steps: [
    { cap: 'Start with acc = 0. 0 + 3 = 3 is ≤ 10: Continue(3).', src: ['a0'], mark: { success: ['a0'] }, eq: 'acc = 3' },
    { cap: '3 + 4 = 7 is ≤ 10: Continue(7).', src: ['a1'], mark: { success: ['a1'] }, eq: 'acc = 7' },
    { cap: '7 + 5 = 12 would be more than 10: Done(7). The fold stops here.', src: ['a2'], srcColor: 'danger', eq: '12 > 10 → Done(7)' },
    { cap: '6 is never looked at.', mark: { dim: ['a3', 'a2'] }, eq: 'stopped early' },
  ],
  result: '7', resultCap: 'fold_while() returns FoldWhile::Done(7); .into_inner() gives 7. A plain fold() cannot stop early.',
}), 'd(vec![3, 4, 5, 6].into_iter().fold_while(0, |acc, x| if acc + x <= 10 { Continue(acc + x) } else { Done(acc) }).into_inner())', '7');

add('tree-reduce', 'How tree_reduce() works', 'Combines items pairwise, like a balanced tree, instead of left to right.', () => {
  const sc = new Scene('(1..=8).tree_reduce(|a, b| a + b)', 'combine neighbours, then the results, and so on');
  const xs = [1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => 500 + (i - 3.5) * 100);
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((v, i) => sc.box('a' + i, v, xs[i], 200, { w: 64, h: 56 }));
  const mid = (i, k) => (xs[i] + xs[i + k - 1]) / 2;
  ['3', '7', '11', '15'].forEach((v, i) => sc.box('p' + i, v, mid(i * 2, 2), 290, { w: 70, h: 56, fill: 'warning', visible: false }));
  ['10', '26'].forEach((v, i) => sc.box('q' + i, v, mid(i * 4, 4), 380, { w: 70, h: 56, fill: 'warning', visible: false }));
  sc.box('z', '36', 500, 470, { w: 80, h: 56, fill: 'success', visible: false });
  sc.intro('tree_reduce() adds neighbours in pairs, then adds those results in pairs, until one value is left.');
  sc.step('First level: 1 + 2, 3 + 4, 5 + 6, 7 + 8.', sc.show(r('p', 0, 4)));
  sc.step('Second level: 3 + 7 = 10 and 11 + 15 = 26.', sc.show(['q0', 'q1']));
  sc.step('Third level: 10 + 26 = 36. Only one value is left.', sc.show(['z']));
  sc.step('fold() would compute ((((((1 + 2) + 3) + 4) + 5) + 6) + 7) + 8: 7 levels deep. The tree has 3 levels, which matters for floats and for combining strings or lists.', {});
  sc.result('Some(36)', 'The sum is the same, 36, returned as Some(36). An empty iterator gives None. Before itertools 0.12 this method was called tree_fold1.');
  return sc.build();
}, 'd((1..=8).tree_reduce(|a, b| a + b))', 'Some(36)');

add('all-equal', 'How all_equal() works', 'Checks whether every item is equal to the first one.', () => pick({
  call: 'vec![2, 2, 2].iter().all_equal()', note: 'compare every item with the first', rows: [nums([2, 2, 2]), nums([2, 3])], rowNames: ['[2, 2, 2]', '[2, 3]'],
  intro: 'all_equal() takes the first item and compares every other item with it. It stops at the first difference.',
  steps: [
    { cap: '[2, 2, 2]: every item equals the first, so the answer is true.', src: r('a', 0, 3), mark: { success: r('a', 0, 3) }, eq: '[2, 2, 2] → true' },
    { cap: '[2, 3]: 3 differs from 2, so the answer is false.', src: ['b1'], srcColor: 'danger', eq: '[2, 3] → false' },
    { cap: 'An empty iterator has no items that differ, so it gives true. A single item gives true as well.', eq: '[] → true' },
  ],
  result: '[2, 2, 2] → true, [2, 3] → false, [] → true', resultCap: 'Watch out for the empty case: all_equal() is true when there is nothing to compare. Use all_equal_value() to get the value too.',
}), 'format!("[2, 2, 2] → {}, [2, 3] → {}, [] → {}", vec![2, 2, 2].iter().all_equal(), vec![2, 3].iter().all_equal(), Vec::<i32>::new().iter().all_equal())', '[2, 2, 2] → true, [2, 3] → false, [] → true');

add('exactly-one', 'How exactly_one() works', 'Gets the only item, or an error when there are zero or several.', () => pick({
  call: 'vec![5].into_iter().exactly_one()', note: 'Ok only when there is exactly one item', rows: [['5'], nums([1, 2])], rowNames: ['[5]', '[1, 2]'],
  intro: 'exactly_one() reads at most two items: one to return and one more to check that there is nothing else.',
  steps: [
    { cap: '[5]: one item and then the end: Ok(5).', src: ['a0'], mark: { success: ['a0'] }, eq: '[5] → Ok(5)' },
    { cap: 'An empty iterator: there is no item to return: Err.', eq: '[] → Err' },
    { cap: '[1, 2]: a second item exists: Err. The error still holds 1 and 2, so nothing is lost.', src: ['b0', 'b1'], srcColor: 'danger', eq: '[1, 2] → Err' },
  ],
  result: '[5] → Ok(5), [] → Err, [1, 2] → Err', resultCap: 'Use exactly_one() when more or fewer items would be a bug, for example a lookup that must match one row.',
}), '{ let one = |v: Vec<i32>| match v.into_iter().exactly_one() { Ok(x) => format!("Ok({})", x), Err(_) => "Err".to_string() }; format!("[5] → {}, [] → {}, [1, 2] → {}", one(vec![5]), one(vec![]), one(vec![1, 2])) }', '[5] → Ok(5), [] → Err, [1, 2] → Err');

module.exports = A;
