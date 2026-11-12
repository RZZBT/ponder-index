// Rust standard library: Iterator consumers (fold, sum, find, ...), iterator sources and Peekable (core::iter).
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Iterator', /iter\/traits\/iterator\.rs$/] });
const SRC = (file) => ['core', '', new RegExp(`iter\\/sources\\/${file}\\.rs$`)];
const PEEK = ['core', 'Peekable', /iter\/adapters\/peekable\.rs$/];

add('iter/fold', 'fold', null, 'How Iterator::fold works', 'Combines all items into one value, carrying an accumulator from item to item.', {
  kind: 'lines', call: '[1, 2, 3, 4].iter().fold(0, |acc, x| acc + x)', note: 'the accumulator starts at 0',
  lines: ['acc = 0', 'acc = 0 + 1 = 1', 'acc = 1 + 2 = 3', 'acc = 3 + 3 = 6', 'acc = 6 + 4 = 10'],
  intro: 'fold starts with the value you give it (0) and feeds it, together with each item, into the closure.',
  steps: [
    { cap: 'Before the first item, acc is the starting value 0.', show: [0] },
    { cap: 'Item 1: the closure returns 0 + 1 = 1, which becomes the new acc.', show: [1] },
    { cap: 'Item 2: 1 + 2 = 3.', show: [2] },
    { cap: 'Item 3: 3 + 3 = 6.', show: [3] },
    { cap: 'Item 4: 6 + 4 = 10. No items are left, so fold returns acc.', show: [4] },
  ],
  result: '10', resultCap: 'fold can build anything: a sum, a String, a Vec. For plain sums, sum() is shorter.',
}, '[1, 2, 3, 4].iter().fold(0, |acc, x| acc + x).to_string()');

add('iter/reduce', 'reduce', null, 'How Iterator::reduce works', 'Like fold, but the first item is the starting value; returns an Option.', {
  kind: 'lines', call: '[3, 9, 4].into_iter().reduce(|a, b| a.max(b))', note: 'no starting value needed',
  lines: ['acc = 3 (the first item)', 'acc = max(3, 9) = 9', 'acc = max(9, 4) = 9', 'Some(9)'],
  intro: 'reduce takes the first item as its starting value and combines the rest into it.',
  steps: [
    { cap: 'The first item, 3, becomes the accumulator.', show: [0] },
    { cap: 'Next is 9: max(3, 9) = 9.', show: [1] },
    { cap: 'Then 4: max(9, 4) = 9.', show: [2] },
    { cap: 'The result is wrapped in Some, because an empty iterator has no first item and would give None.', show: [3] },
  ],
  result: 'Some(9)', resultCap: 'Use reduce when there is no natural starting value; fold when there is (0 for sums, an empty String, ...).',
}, 'd([3, 9, 4].into_iter().reduce(|a, b| a.max(b)))');

add('iter/sum', 'sum', null, 'How Iterator::sum works', 'Adds all items together.', {
  kind: 'lines', call: '[1, 2, 3, 4].iter().sum::<i32>()', note: 'the ::<i32> says which type to add up into',
  lines: ['0', '0 + 1 = 1', '1 + 2 = 3', '3 + 3 = 6', '6 + 4 = 10'],
  intro: 'sum starts at zero and adds every item.',
  steps: [
    { cap: 'The total starts at 0.', show: [0] },
    { cap: 'Add 1 and 2: the total is 3.', show: [1, 2] },
    { cap: 'Add 3: 6.', show: [3] },
    { cap: 'Add 4: 10.', show: [4] },
  ],
  result: '10', resultCap: 'Rust needs to know the result type, hence sum::<i32>() or let total: i32 = ... .sum(). An empty iterator sums to 0.',
}, '[1, 2, 3, 4].iter().sum::<i32>().to_string()');

add('iter/product', 'product', null, 'How Iterator::product works', 'Multiplies all items together.', {
  kind: 'lines', call: '(1..=4).product::<i32>()', note: '1 * 2 * 3 * 4 (that is 4 factorial)',
  lines: ['1', '1 * 1 = 1', '1 * 2 = 2', '2 * 3 = 6', '6 * 4 = 24'],
  intro: 'product starts at one and multiplies by every item.',
  steps: [
    { cap: 'The running product starts at 1, so multiplying does not change the first item.', show: [0, 1] },
    { cap: 'Times 2: 2.', show: [2] },
    { cap: 'Times 3: 6.', show: [3] },
    { cap: 'Times 4: 24.', show: [4] },
  ],
  result: '24', resultCap: 'An empty iterator gives 1. Large products overflow quickly: i32 cannot hold 13 factorial.',
}, '(1..=4).product::<i32>().to_string()');

add('iter/count', 'count', null, 'How Iterator::count works', 'Counts the items by going through all of them.', {
  call: '"hello".chars().count()', note: 'characters, not bytes', rows: [["'h'", "'e'", "'l'", "'l'", "'o'"]], outs: [],
  intro: 'count pulls every item out of the iterator and only remembers how many there were.',
  steps: [
    ['h, e: 2 so far.', [0, 1], null, 'count = 2'],
    ['l, l: 4 so far. Equal items are counted every time.', [2, 3], null, 'count = 4'],
    ['o: 5. The iterator is now used up.', 4, null, 'count = 5'],
  ],
  result: '5', resultCap: 'count consumes the iterator. For a Vec or slice, len() is instant; count() has to walk through everything.',
}, '"hello".chars().count().to_string()');

add('iter/last', 'last', null, 'How Iterator::last works', 'Returns the final item, walking through all the others.', {
  call: '[1, 2, 3].iter().last()', note: 'goes to the very end', rows: [nums([1, 2, 3])], outs: ['Some(3)'],
  intro: 'last reads every item and keeps only the most recent one.',
  steps: [
    ['1 is read, then forgotten.', 0, null, 'last seen: 1'],
    ['2 is read, then forgotten.', 1, null, 'last seen: 2'],
    ['3 is read and nothing follows, so it is the result: Some(3).', 2, 'o0', 'last seen: 3'],
  ],
  result: 'Some(3)', resultCap: 'The value is really Some(&3), a reference, because iter() yields references; println! shows it as Some(3). An empty iterator gives None.',
}, 'd([1, 2, 3].iter().last())');

add('iter/nth', 'nth', null, 'How Iterator::nth works', 'Returns the item at position n, counting from 0, and consumes everything before it.', {
  call: '["a", "b", "c", "d"].iter().nth(2)', note: 'positions start at 0', rows: [['"a"', '"b"', '"c"', '"d"']], outs: ['Some("c")'],
  intro: 'nth(2) skips 2 items and returns the next one.',
  steps: [
    ['Position 0, "a": skipped.', 0, 'x', 'position 0'],
    ['Position 1, "b": skipped.', 1, 'x', 'position 1'],
    ['Position 2, "c": that is the answer.', 2, 'o0', 'position 2'],
  ],
  result: 'Some("c")', resultCap: 'nth(0) is the first item. Asking past the end gives None. Calling nth(2) again would continue after "c".',
}, 'd(["a", "b", "c", "d"].iter().nth(2))');

add('iter/max', 'max', null, 'How Iterator::max works', 'Returns the largest item, or None for an empty iterator.', {
  call: '[4, 9, 1].iter().max()', note: 'compares every item', rows: [nums([4, 9, 1])], outs: ['Some(9)'],
  intro: 'max keeps the biggest item seen so far.',
  steps: [
    ['4 is the biggest so far.', 0, null, 'best: 4'],
    ['9 > 4: the new biggest.', 1, null, 'best: 9'],
    ['1 < 9: no change. The answer is 9.', 2, 'o0', 'best: 9'],
  ],
  result: 'Some(9)', resultCap: '(The 9 is a reference, &9, because of iter().) max returns Option because an empty iterator has no largest item. With equal maximums, it returns the last one.',
}, 'd([4, 9, 1].iter().max())');

add('iter/min', 'min', null, 'How Iterator::min works', 'Returns the smallest item, or None for an empty iterator.', {
  call: '[4, 9, 1].iter().min()', note: 'compares every item', rows: [nums([4, 9, 1])], outs: ['Some(1)'],
  intro: 'min keeps the smallest item seen so far.',
  steps: [
    ['4 is the smallest so far.', 0, null, 'best: 4'],
    ['9 is bigger: no change.', 1, null, 'best: 4'],
    ['1 < 4: the new smallest, and the answer.', 2, 'o0', 'best: 1'],
  ],
  result: 'Some(1)', resultCap: '(A reference, &1, printed as 1.) Floats (f64) have no min() because NaN cannot be ordered; use fold with f64::min instead.',
}, 'd([4, 9, 1].iter().min())');

add('iter/max_by_key', 'max_by_key', null, 'How Iterator::max_by_key works', 'Returns the item whose computed key is largest.', {
  call: '["kiwi", "banana", "fig"].iter().max_by_key(|s| s.len())', note: 'longest word', rows: [['"kiwi"', '"banana"', '"fig"']], outs: ['Some("banana")'],
  intro: 'max_by_key compares keys, here the length of each word, and returns the item with the largest key.',
  steps: [
    ['"kiwi" has length 4.', 0, null, 'key 4'],
    ['"banana" has length 6: the largest so far.', 1, null, 'key 6'],
    ['"fig" has length 3. The winner is "banana".', 2, 'o0', 'key 3'],
  ],
  result: 'Some("banana")', resultCap: 'It returns the item, not the key. min_by_key works the same way for the smallest key.',
}, 'd(["kiwi", "banana", "fig"].iter().max_by_key(|s| s.len()))');

add('iter/min_by_key', 'min_by_key', null, 'How Iterator::min_by_key works', 'Returns the item whose computed key is smallest.', {
  call: '[(1, "ann"), (0, "bo")].iter().min_by_key(|p| p.0)', note: 'smallest first field', rows: [['(1, "ann")', '(0, "bo")']], outs: ['Some((0, "bo"))'],
  intro: 'min_by_key computes a key for every item (here the first number of the pair) and keeps the smallest.',
  steps: [
    ['(1, "ann") has key 1.', 0, null, 'key 1'],
    ['(0, "bo") has key 0, smaller: it wins.', 1, 'o0', 'key 0'],
  ],
  result: 'Some((0, "bo"))', resultCap: 'With equal keys, min_by_key returns the first such item (max_by_key the last).',
}, 'd([(1, "ann"), (0, "bo")].iter().min_by_key(|p| p.0))');

add('iter/any', 'any', null, 'How Iterator::any works', 'True if at least one item passes; stops at the first one that does.', {
  call: '[1, 3, 4, 5].iter().any(|x| x % 2 == 0)', note: 'is there an even number?', rows: [nums([1, 3, 4, 5])], outs: ['true'],
  intro: 'any checks the items in order and returns true at the first match.',
  steps: [
    ['1 is odd: keep looking.', 0, 'x', 'false'],
    ['3 is odd: keep looking.', 1, 'x', 'false'],
    ['4 is even: any returns true immediately.', 2, 'o0', 'true → stop'],
    ['5 is never checked.', 3, { mark: { dim: ['a3'] } }, 'never checked'],
  ],
  result: 'true', resultCap: 'any on an empty iterator is false: there is no item that could pass.',
}, '[1, 3, 4, 5].iter().any(|x| x % 2 == 0).to_string()');

add('iter/all', 'all', null, 'How Iterator::all works', 'True if every item passes; stops at the first one that fails.', {
  call: '[2, 4, 5, 6].iter().all(|x| x % 2 == 0)', note: 'are they all even?', rows: [nums([2, 4, 5, 6])], outs: ['false'],
  intro: 'all checks the items in order and returns false at the first one that fails.',
  steps: [
    ['2 is even: so far so good.', 0, null, 'true'],
    ['4 is even.', 1, null, 'true'],
    ['5 is odd: all returns false immediately.', 2, 'x', 'false → stop'],
    ['6 is never checked; the answer is already known.', 3, { out: [0], mark: { dim: ['a3'] } }, 'never checked'],
  ],
  result: 'false', resultCap: 'all on an empty iterator is true: no item fails.',
}, '[2, 4, 5, 6].iter().all(|x| x % 2 == 0).to_string()');

add('iter/find', 'find', null, 'How Iterator::find works', 'Returns the first item that passes the test, as an Option.', {
  call: '[3, 8, 10].iter().find(|x| **x > 5)', note: 'the first number above 5', rows: [nums([3, 8, 10])], outs: ['Some(8)'],
  intro: 'find tests items in order and stops at the first match.',
  steps: [
    ['3 > 5 is false: keep looking.', 0, 'x', '3 > 5 ✗'],
    ['8 > 5: found. find returns Some(8) right away.', 1, 'o0', '8 > 5 ✓'],
    ['10 also passes, but find has already stopped.', 2, { mark: { dim: ['a2'] } }, 'never checked'],
  ],
  result: 'Some(8)', resultCap: 'find hands back a reference to the item (&8, printed as 8). If no item passes, find returns None.',
}, 'd([3, 8, 10].iter().find(|x| **x > 5))');

add('iter/find_map', 'find_map', null, 'How Iterator::find_map works', 'Returns the first Some the closure produces.', {
  call: '["a", "7", "9"].iter().find_map(|s| s.parse::<i32>().ok())', note: 'the first string that is a number', rows: [['"a"', '"7"', '"9"']], outs: ['Some(7)'],
  intro: 'find_map calls the closure on each item until it returns Some.',
  steps: [
    ['"a" is not a number: None, keep going.', 0, 'x', 'None'],
    ['"7" parses: Some(7). find_map stops and returns it.', 1, 'o0', 'Some(7)'],
  ],
  result: 'Some(7)', resultCap: 'find_map is find and map in one: it returns the converted value, not the original item.',
}, 'd(["a", "7", "9"].iter().find_map(|s| s.parse::<i32>().ok()))');

add('iter/position', 'position', null, 'How Iterator::position works', 'Returns the index of the first item that passes the test.', {
  call: '["a", "b", "c"].iter().position(|s| *s == "b")', note: 'where is "b"?', rows: [['"a"', '"b"', '"c"']], outs: ['Some(1)'],
  intro: 'position counts from 0 and returns the index of the first match.',
  steps: [
    ['Index 0, "a": not it.', 0, 'x', 'index 0'],
    ['Index 1, "b": a match. The answer is Some(1).', 1, 'o0', 'index 1'],
  ],
  result: 'Some(1)', resultCap: 'position returns where, find returns what. None means no item passed.',
}, 'd(["a", "b", "c"].iter().position(|s| *s == "b"))');

add('iter/partition', 'partition', null, 'How Iterator::partition works', 'Splits the items into two collections: those that pass and those that do not.', {
  call: '[1, 2, 3, 4].iter().partition::<Vec<i32>, _>(|x| *x % 2 == 0)', note: '(passed, failed)', rows: [nums([1, 2, 3, 4])], outs: ['evens: [2, 4]', 'odds: [1, 3]'],
  intro: 'partition sends each item to one of two collections, depending on the closure.',
  steps: [
    ['1 is odd: it goes to the second collection.', 0, null, '1 → odds'],
    ['2 is even: first collection.', 1, null, '2 → evens'],
    ['3 → odds, 4 → evens.', [2, 3], null, '3 → odds, 4 → evens'],
    ['Each collection keeps the original order.', [], 'o0,1'],
  ],
  result: '([2, 4], [1, 3])', resultCap: 'You get a tuple (passed, failed), so write let (evens, odds): (Vec<i32>, Vec<i32>) = ... .partition(...).',
}, 'let (a, b): (Vec<i32>, Vec<i32>) = [1, 2, 3, 4].iter().partition(|x| *x % 2 == 0); d((a, b))');

add('iter/collect', 'collect', null, 'How Iterator::collect works', 'Runs the whole iterator chain and gathers the items into a collection.', {
  call: '(1..=4).map(|x| x * x).collect::<Vec<i32>>()', note: 'nothing happens until collect asks', rows: [nums([1, 2, 3, 4])], outs: ['1', '4', '9', '16'],
  intro: 'map on its own does nothing. collect pulls the items through the chain one at a time.',
  steps: [
    ['collect asks for an item: 1 goes through map and becomes 1.', 0, 'o0', '1 * 1'],
    ['It asks again: 2 becomes 4.', 1, 'o1', '2 * 2'],
    ['3 becomes 9, and 4 becomes 16.', [2, 3], 'o2,3', '3 * 3, 4 * 4'],
    ['The range is used up, so collect builds the Vec from the four items.', [], null, 'Vec of 4 items'],
  ],
  result: '[1, 4, 9, 16]', resultCap: 'The target type decides what is built: Vec, String, HashSet, HashMap, even Result<Vec<_>, _>.',
}, 'd((1..=4).map(|x| x * x).collect::<Vec<i32>>())');

add('iter/unzip', 'unzip', null, 'How Iterator::unzip works', 'Splits an iterator of pairs into two collections.', {
  call: '[(1, \'a\'), (2, \'b\')].into_iter().unzip()', note: 'the opposite of zip', rows: [["(1, 'a')", "(2, 'b')"]], outs: ['[1, 2]', "['a', 'b']"],
  intro: 'unzip puts the first part of each pair into one collection and the second part into another.',
  steps: [
    ['(1, \'a\'): 1 goes left, \'a\' goes right.', 0, null, "1 | 'a'"],
    ['(2, \'b\'): 2 left, \'b\' right.', 1, 'o0,1', "2 | 'b'"],
  ],
  result: "([1, 2], ['a', 'b'])", resultCap: 'unzip is the opposite of zip. Name both types: let (nums, letters): (Vec<i32>, Vec<char>) = ...',
}, 'let (a, b): (Vec<i32>, Vec<char>) = [(1, \'a\'), (2, \'b\')].into_iter().unzip(); d((a, b))');

add('iter/for_each', 'for_each', null, 'How Iterator::for_each works', 'Calls a closure on every item, like a for loop.', {
  call: '[1, 2, 3].iter().for_each(|x| total += x)', note: 'a for loop as a method', rows: [nums([1, 2, 3])], outs: [],
  intro: 'for_each runs the closure once for each item and returns nothing.',
  steps: [
    ['total = 0 + 1 = 1.', 0, null, 'total: 1'],
    ['total = 1 + 2 = 3.', 1, null, 'total: 3'],
    ['total = 3 + 3 = 6.', 2, null, 'total: 6'],
  ],
  result: 'total = 6', resultCap: 'for_each is handy at the end of a long chain; a plain for loop is often easier to read and allows break.',
}, 'let mut total = 0; [1, 2, 3].iter().for_each(|x| total += x); format!("total = {total}")');

add('iter/is_sorted', 'is_sorted', null, 'How Iterator::is_sorted works', 'Checks that every item is less than or equal to the next.', {
  call: '[1, 2, 2, 5].iter().is_sorted()', note: 'compares neighbours', rows: [nums([1, 2, 2, 5])], outs: ['true'],
  intro: 'is_sorted compares each item with the one after it.',
  steps: [
    ['1 <= 2 ✓', [0, 1], null, '1 <= 2'],
    ['2 <= 2 ✓: equal neighbours are fine.', [1, 2], null, '2 <= 2'],
    ['2 <= 5 ✓. Every pair is in order: true.', [2, 3], 'o0', '2 <= 5'],
  ],
  result: 'true', resultCap: 'It stops at the first pair out of order and returns false. Empty and single-item iterators are sorted.',
}, '[1, 2, 2, 5].iter().is_sorted().to_string()');

add('iter/eq', 'eq', null, 'How Iterator::eq works', 'Compares two iterators item by item.', {
  call: '[1, 2, 3].iter().eq([1, 2, 4].iter())', note: 'same items, same order?', rows: [nums([1, 2, 3]), nums([1, 2, 4])], outs: ['false'],
  intro: 'eq walks both iterators together and compares the items in the same position.',
  steps: [
    ['1 == 1 ✓', ['a0', 'b0'], null, 'equal'],
    ['2 == 2 ✓', ['a1', 'b1'], null, 'equal'],
    ['3 != 4: the iterators differ, so eq returns false.', ['a2', 'b2'], { srcColor: 'danger', out: [0] }, 'different'],
  ],
  result: 'false', resultCap: 'Iterators of different lengths are never equal. Useful to compare a Vec with a range: v.iter().copied().eq(1..=3).',
}, '[1, 2, 3].iter().eq([1, 2, 4].iter()).to_string()');

add('iter/repeat', 'repeat', SRC('repeat'), 'How iter::repeat works', 'An endless iterator that yields the same value again and again.', {
  call: 'std::iter::repeat("ab").take(3)', note: 'the same value forever; take stops it', rows: [['"ab"']], outs: ['"ab"', '"ab"', '"ab"'],
  intro: 'repeat("ab") yields a clone of "ab" every time it is asked, without end.',
  steps: [
    ['The first item: "ab".', 0, 'o0', '1 of 3'],
    ['The same again.', 0, 'o1', '2 of 3'],
    ['And again. take(3) stops after three.', 0, 'o2', '3 of 3'],
  ],
  result: '"ab", "ab", "ab"', resultCap: 'repeat(x).take(n) is a quick way to make n copies; vec![x; n] does the same for a Vec.',
}, 'jd(std::iter::repeat("ab").take(3))');

add('iter/once', 'once', SRC('once'), 'How iter::once works', 'An iterator that yields exactly one value.', {
  call: 'std::iter::once(0).chain([1, 2])', note: 'add a single item to a chain', rows: [['0'], nums([1, 2])], outs: ['0', '1', '2'],
  intro: 'once(0) yields 0 a single time. It is useful for putting one extra item in front of or behind a chain.',
  steps: [
    ['once yields its one value, 0.', 'a0', 'o0', 'once: 0'],
    ['Then it is empty, and chain continues with 1 and 2.', ['b0', 'b1'], 'o1,2'],
  ],
  result: '0, 1, 2', resultCap: 'once(x) is like [x].into_iter(), but needs no array.',
}, 'j(std::iter::once(0).chain([1, 2]))');

add('iter/successors', 'successors', SRC('successors'), 'How iter::successors works', 'Starts from a value and computes each next value from the previous one.', {
  call: 'std::iter::successors(Some(1), |x| (*x < 100).then(|| x * 10))', note: 'each item from the one before', rows: [['Some(1)']], outs: ['1', '10', '100'],
  intro: 'successors yields the first value, then keeps calling the closure on the last value until it returns None.',
  steps: [
    ['The start, 1, is yielded.', 0, 'o0', 'start'],
    ['1 < 100, so the next value is 1 * 10 = 10.', [], 'o1', '1 → 10'],
    ['10 < 100: the next is 100.', [], 'o2', '10 → 100'],
    ['100 < 100 is false: the closure returns None and the iterator ends.', [], null, '100 → None'],
  ],
  result: '1, 10, 100', resultCap: 'successors is ideal for sequences like powers, Collatz steps or walking up a tree.',
}, 'j(std::iter::successors(Some(1), |x: &i32| (*x < 100).then(|| x * 10)))');

add('iter/from_fn', 'from_fn', SRC('from_fn'), 'How iter::from_fn works', 'Builds an iterator from a closure that returns the next item.', {
  call: 'let mut n = 0; std::iter::from_fn(|| { n += 1; (n <= 3).then_some(n) })', note: 'the closure keeps its own state', rows: [['n = 0']], outs: ['1', '2', '3'],
  intro: 'from_fn calls the closure each time an item is needed. Some(v) yields v; None ends the iterator.',
  steps: [
    ['n becomes 1; 1 <= 3, so Some(1).', 0, 'o0', 'n = 1'],
    ['n becomes 2: Some(2).', 0, 'o1', 'n = 2'],
    ['n becomes 3: Some(3).', 0, 'o2', 'n = 3'],
    ['n becomes 4; 4 <= 3 is false: None, the iterator is finished.', 0, 'x', 'n = 4 → None'],
  ],
  result: '1, 2, 3', resultCap: 'from_fn turns any "give me the next one" logic into an iterator that works with map, filter and collect.',
}, 'let mut n = 0; j(std::iter::from_fn(|| { n += 1; (n <= 3).then_some(n) }))');

add('iter/peek', 'peek', PEEK, 'How Peekable::peek works', 'Looks at the next item without taking it.', {
  call: 'let mut it = [1, 2].iter().peekable(); it.peek(); it.next()', note: 'look first, take later', rows: [nums([1, 2])], outs: ['peek → Some(&1)', 'next → Some(1)'],
  intro: 'peekable() wraps an iterator so you can peek at the next item before deciding to take it.',
  steps: [
    ['peek() shows 1 but leaves it in place.', 0, 'o0', 'still the next item: 1'],
    ['next() then takes that same 1.', 0, 'o1', 'taken'],
    ['peek would now show 2.', 1, null, 'next up: 2'],
  ],
  result: 'Some(1)', resultCap: 'peek is how parsers look ahead: check the next token, and only take it if it is the right one.',
}, 'let mut it = [1, 2].iter().peekable(); let _p = it.peek(); d(it.next())');

add('iter/next_if', 'next_if', PEEK, 'How Peekable::next_if works', 'Takes the next item only if it passes a test.', {
  call: 'it.next_if(|x| x.is_ascii_digit())', note: 'on "12a".chars().peekable()', rows: [["'1'", "'2'", "'a'"]], outs: ["'1'", "'2'"],
  intro: 'next_if peeks at the next item and takes it only when the closure says true. Repeat it to read a run of digits.',
  steps: [
    ["'1' is a digit: taken.", 0, 'o0', 'Some(\'1\')'],
    ["'2' is a digit: taken.", 1, 'o1', 'Some(\'2\')'],
    ["'a' is not a digit: next_if returns None and leaves 'a' in the iterator.", 2, 'x', 'None, \'a\' stays'],
  ],
  result: '"12"', resultCap: 'Collecting while next_if succeeds reads "12" and stops before "a", which is still there for the next step.',
}, 'let mut it = "12a".chars().peekable(); let mut s = String::new(); while let Some(c) = it.next_if(|c| c.is_ascii_digit()) { s.push(c); } d(s)');

module.exports = list;
