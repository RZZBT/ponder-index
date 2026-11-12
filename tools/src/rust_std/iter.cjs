// Rust standard library: Iterator (core::iter). Every result is computed again by truth/run.cjs ("rust std").
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Iterator', /iter\/traits\/iterator\.rs$/] });

add('iter/map', 'map', null, 'How Iterator::map works', 'Turns every item into a new value with a closure; nothing runs until the iterator is used.', {
  call: '[1, 2, 3].iter().map(|x| x * 10)', note: 'the closure runs once per item', rows: [nums([1, 2, 3])], outs: ['10', '20', '30'],
  intro: 'map(|x| x * 10) puts every item through the closure and yields what it returns.',
  steps: [
    ['1 goes in, 1 * 10 = 10 comes out.', 0, 'o0', '1 * 10 = 10'],
    ['2 becomes 20.', 1, 'o1', '2 * 10 = 20'],
    ['3 becomes 30. Same number of items in, same number out, same order.', 2, 'o2', '3 * 10 = 30'],
  ],
  result: '10, 20, 30', resultCap: 'map is lazy: on its own it does nothing. The work happens when something pulls the items, like collect() or a for loop.',
}, 'j([1, 2, 3].iter().map(|x| x * 10))');

add('iter/filter', 'filter', null, 'How Iterator::filter works', 'Keeps only the items for which the closure returns true.', {
  call: '[1, 2, 3, 4].iter().filter(|x| **x % 2 == 0)', note: 'keep the even numbers', rows: [nums([1, 2, 3, 4])], outs: [null, null],
  intro: 'filter asks the closure about every item. true means keep it, false means skip it.',
  steps: [
    ['1 % 2 is 1, not 0: false, so 1 is skipped.', 0, 'x', '1 % 2 == 0 → false'],
    ['2 % 2 is 0: true, so 2 is kept.', 1, 'm0', '2 % 2 == 0 → true'],
    ['3 is odd: skipped.', 2, 'x', '3 % 2 == 0 → false'],
    ['4 is even: kept.', 3, 'm1', '4 % 2 == 0 → true'],
  ],
  result: '2, 4', resultCap: 'filter never changes an item, it only decides whether it passes. The **x is needed because iter() gives references, and filter passes a reference to those.',
}, 'j([1, 2, 3, 4].iter().filter(|x| **x % 2 == 0))');

add('iter/enumerate', 'enumerate', null, 'How Iterator::enumerate works', 'Pairs every item with its position, counting from 0.', {
  call: '["a", "b", "c"].iter().enumerate()', note: 'a counter that starts at 0', rows: [['"a"', '"b"', '"c"']], outs: ['(0, "a")', '(1, "b")', '(2, "c")'],
  intro: 'enumerate keeps a counter and hands out (counter, item) pairs.',
  steps: [
    ['The first item gets index 0, not 1.', 0, 'o0', 'index 0'],
    ['The counter goes up by one for every item: (1, "b").', 1, 'o1', 'index 1'],
    ['(2, "c"). The last index is always the length minus one.', 2, 'o2', 'index 2'],
  ],
  result: '(0, "a"), (1, "b"), (2, "c")', resultCap: 'Use it in a loop as: for (i, x) in v.iter().enumerate() { ... }',
}, 'jd(["a", "b", "c"].iter().enumerate())');

add('iter/zip', 'zip', null, 'How Iterator::zip works', 'Walks two iterators side by side and pairs their items; stops at the shorter one.', {
  call: '[1, 2, 3].iter().zip(["a", "b"].iter())', note: 'pairs items in the same position', rows: [nums([1, 2, 3]), ['"a"', '"b"']], outs: ['(1, "a")', '(2, "b")'],
  intro: 'zip takes one item from each side at the same time and makes a pair.',
  steps: [
    ['1 and "a" are both first: they become (1, "a").', ['a0', 'b0'], 'o0'],
    ['2 and "b" become (2, "b").', ['a1', 'b1'], 'o1'],
    ['The second side is empty now, so zip stops. 3 has no partner and is never used.', ['a2'], 'x', 'the shorter side decides the length'],
  ],
  result: '(1, "a"), (2, "b")', resultCap: 'zip stops at the shorter iterator without an error. Nothing is padded; extra items are simply left out.',
}, 'jd([1, 2, 3].iter().zip(["a", "b"].iter()))');

add('iter/filter_map', 'filter_map', null, 'How Iterator::filter_map works', 'Transforms and filters in one step: Some(x) keeps x, None drops the item.', {
  call: '["1", "x", "3"].iter().filter_map(|s| s.parse::<i32>().ok())', note: 'keep only the strings that are numbers', rows: [['"1"', '"x"', '"3"']], outs: ['1', '3'],
  intro: 'The closure returns an Option. filter_map unwraps every Some and throws every None away.',
  steps: [
    ['"1" parses to the number 1: Some(1), so 1 is kept.', 0, 'o0', '"1" → Some(1)'],
    ['"x" is not a number: parse fails, ok() turns the error into None, and the item is dropped.', 1, 'x', '"x" → None'],
    ['"3" parses to Some(3): 3 is kept.', 2, 'o1', '"3" → Some(3)'],
  ],
  result: '1, 3', resultCap: 'filter_map(f) does what filter followed by map would do, without computing f twice.',
}, 'j(["1", "x", "3"].iter().filter_map(|s| s.parse::<i32>().ok()))');

add('iter/chain', 'chain', null, 'How Iterator::chain works', 'Runs one iterator to the end, then continues with a second one.', {
  call: '[1, 2].iter().chain([3, 4].iter())', note: 'first the left side, then the right side', rows: [nums([1, 2]), nums([3, 4])], outs: [null, null, null, null],
  intro: 'chain glues two iterators together end to end. Both must yield the same type.',
  steps: [
    ['All items of the first iterator come first: 1, then 2.', ['a0', 'a1'], { move: { a0: 0, a1: 1 } }],
    ['When the first one is empty, chain switches to the second: 3, then 4.', ['b0', 'b1'], { move: { b0: 2, b1: 3 } }],
  ],
  result: '1, 2, 3, 4', resultCap: 'Nothing is copied or allocated: chain just asks the second iterator once the first says it is done.',
}, 'j([1, 2].iter().chain([3, 4].iter()))');

add('iter/take', 'take', null, 'How Iterator::take works', 'Yields at most n items, then stops; it also makes endless iterators finite.', {
  call: '(1..).take(3)', note: '1.. never ends on its own', rows: [['1', '2', '3', '4', '5', '…']], outs: [null, null, null],
  intro: '1.. counts up forever. take(3) lets only the first 3 items through.',
  steps: [
    ['1 is the first item: taken (1 of 3).', 0, 'm0', '1 of 3'],
    ['2 is taken (2 of 3).', 1, 'm1', '2 of 3'],
    ['3 is taken, and the limit of 3 is reached.', 2, 'm2', '3 of 3'],
    ['take now stops asking for more. 4, 5 and the rest are never even produced.', [3, 4, 5], 'x', 'done after 3'],
  ],
  result: '1, 2, 3', resultCap: 'take(n) is how you safely use an endless iterator. If there are fewer than n items, it simply yields all of them.',
}, 'j((1..).take(3))');

add('iter/skip', 'skip', null, 'How Iterator::skip works', 'Throws away the first n items and yields the rest.', {
  call: '[1, 2, 3, 4, 5].iter().skip(2)', note: 'drop the first 2', rows: [nums([1, 2, 3, 4, 5])], outs: [null, null, null],
  intro: 'skip(2) discards items until 2 have gone by, then lets everything through.',
  steps: [
    ['1 and 2 are the first two items: both are skipped.', [0, 1], 'x', 'skipped 2 of 2'],
    ['From now on every item passes: 3 …', 2, 'm0'],
    ['… 4 and 5.', [3, 4], { move: { a3: 1, a4: 2 } }],
  ],
  result: '3, 4, 5', resultCap: 'skip(n) counts items, it never looks at their values. Skipping more items than there are gives an empty iterator, not an error.',
}, 'j([1, 2, 3, 4, 5].iter().skip(2))');

add('iter/take_while', 'take_while', null, 'How Iterator::take_while works', 'Yields items while the closure says true, and stops for good at the first false.', {
  call: '[1, 2, 5, 1].iter().take_while(|x| **x < 3)', note: 'stops at the first item that fails', rows: [nums([1, 2, 5, 1])], outs: [null, null],
  intro: 'take_while tests each item in order and gives up at the first one that fails.',
  steps: [
    ['1 < 3: true, 1 is yielded.', 0, 'm0', '1 < 3 ✓'],
    ['2 < 3: true, 2 is yielded.', 1, 'm1', '2 < 3 ✓'],
    ['5 < 3 is false: take_while stops here.', 2, 'x', '5 < 3 ✗ → stop'],
    ['The last 1 is smaller than 3, but it is never looked at. take_while is not a filter.', 3, { mark: { dim: ['a3'] } }, 'never checked'],
  ],
  result: '1, 2', resultCap: 'Use filter to keep every item that passes; use take_while to stop at the first one that does not.',
}, 'j([1, 2, 5, 1].iter().take_while(|x| **x < 3))');

add('iter/skip_while', 'skip_while', null, 'How Iterator::skip_while works', 'Skips items while the closure says true; after the first false, everything passes.', {
  call: '[1, 2, 5, 1].iter().skip_while(|x| **x < 3)', note: 'skip the beginning, keep the rest', rows: [nums([1, 2, 5, 1])], outs: [null, null],
  intro: 'skip_while drops items from the front as long as they pass the test.',
  steps: [
    ['1 < 3: skipped.', 0, 'x', '1 < 3 → skip'],
    ['2 < 3: skipped.', 1, 'x', '2 < 3 → skip'],
    ['5 < 3 is false: skipping ends, and 5 is yielded.', 2, 'm0', '5 < 3 ✗ → start yielding'],
    ['1 is smaller than 3, but the closure is no longer asked: it is yielded too.', 3, 'm1', 'no more checks'],
  ],
  result: '5, 1', resultCap: 'skip_while only trims the front. It is the opposite half of take_while with the same closure.',
}, 'j([1, 2, 5, 1].iter().skip_while(|x| **x < 3))');

add('iter/map_while', 'map_while', null, 'How Iterator::map_while works', 'Maps items while the closure returns Some, and stops at the first None.', {
  call: '["1", "2", "x", "4"].iter().map_while(|s| s.parse::<i32>().ok())', note: 'like take_while and map in one', rows: [['"1"', '"2"', '"x"', '"4"']], outs: ['1', '2'],
  intro: 'map_while calls the closure on each item. Some(v) yields v; the first None ends everything.',
  steps: [
    ['"1" parses: Some(1), so 1 is yielded.', 0, 'o0', 'Some(1)'],
    ['"2" parses: 2 is yielded.', 1, 'o1', 'Some(2)'],
    ['"x" does not parse: None. map_while stops right here.', 2, 'x', 'None → stop'],
    ['"4" would parse, but it is never reached.', 3, { mark: { dim: ['a3'] } }, 'never checked'],
  ],
  result: '1, 2', resultCap: 'Compare filter_map, which would skip "x" and still yield 4.',
}, 'j(["1", "2", "x", "4"].iter().map_while(|s| s.parse::<i32>().ok()))');

add('iter/step_by', 'step_by', null, 'How Iterator::step_by works', 'Yields the first item and then every n-th item after it.', {
  call: '(0..10).step_by(3)', note: 'every 3rd item, starting with the first', rows: [nums([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])], outs: [null, null, null, null],
  intro: 'step_by(3) always yields the first item, then jumps 3 ahead each time.',
  steps: [
    ['The first item, 0, is always yielded.', 0, 'm0', 'start'],
    ['Jump 3 ahead: 3.', 3, 'm1', '0 + 3'],
    ['Another 3: 6.', 6, 'm2', '3 + 3'],
    ['And 9. The next jump would land on 12, past the end, so it stops.', 9, 'm3', '6 + 3'],
  ],
  result: '0, 3, 6, 9', resultCap: 'step_by(1) changes nothing, and step_by(0) panics: a step of zero would never move.',
}, 'j((0..10).step_by(3))');

add('iter/rev', 'rev', null, 'How Iterator::rev works', 'Walks an iterator from the back to the front.', {
  call: '[1, 2, 3].iter().rev()', note: 'the last item comes first', rows: [nums([1, 2, 3])], outs: [null, null, null],
  intro: 'rev asks the iterator for items from its back end instead of its front.',
  steps: [
    ['The last item, 3, comes out first.', 2, 'm0'],
    ['Then 2.', 1, 'm1'],
    ['And finally 1.', 0, 'm2'],
  ],
  result: '3, 2, 1', resultCap: 'rev does not copy or reverse anything in memory. It only works on iterators that can be read from both ends (DoubleEndedIterator).',
}, 'j([1, 2, 3].iter().rev())');

add('iter/flat_map', 'flat_map', null, 'How Iterator::flat_map works', 'Maps every item to an iterator and yields all of their items in a row.', {
  call: '["ab", "cd"].iter().flat_map(|s| s.chars())', note: 'one item becomes many', rows: [['"ab"', '"cd"']], outs: ["'a'", "'b'", "'c'", "'d'"],
  intro: 'For every item the closure returns an iterator; flat_map empties each one in turn.',
  steps: [
    ['"ab".chars() gives \'a\' and \'b\'; both are yielded.', 0, 'o0,1', '"ab" → \'a\', \'b\''],
    ['"cd".chars() gives \'c\' and \'d\'.', 1, 'o2,3', '"cd" → \'c\', \'d\''],
  ],
  result: "'a', 'b', 'c', 'd'", resultCap: 'map would give two iterators; flat_map flattens them into one stream of characters.',
}, 'jd(["ab", "cd"].iter().flat_map(|s| s.chars()))');

add('iter/flatten', 'flatten', null, 'How Iterator::flatten works', 'Removes one level of nesting; also drops None values.', {
  call: 'vec![vec![1, 2], vec![], vec![3]].into_iter().flatten()', note: 'lists of items become items', rows: [['[1, 2]', '[]', '[3]']], outs: ['1', '2', '3'],
  intro: 'flatten takes an iterator of iterators and yields the inner items one by one.',
  steps: [
    ['The first inner list gives 1 and 2.', 0, 'o0,1'],
    ['The empty list gives nothing; it simply disappears.', 1, 'x', '[] → nothing'],
    ['The last list gives 3.', 2, 'o2'],
  ],
  result: '1, 2, 3', resultCap: 'Only one level is removed: [[[1]]] becomes [[1]]. On Options, flatten keeps the values of Some and drops None.',
}, 'j(vec![vec![1, 2], vec![], vec![3]].into_iter().flatten())');

add('iter/scan', 'scan', null, 'How Iterator::scan works', 'Carries a running state through the items and yields a value at every step.', {
  call: '[1, 2, 3].iter().scan(0, |sum, x| { *sum += x; Some(*sum) })', note: 'a running total', rows: [nums([1, 2, 3])], outs: ['1', '3', '6'],
  intro: 'scan starts with the state 0. For every item the closure may update the state and returns what to yield.',
  steps: [
    ['sum = 0 + 1 = 1; scan yields 1.', 0, 'o0', 'sum: 0 → 1'],
    ['sum = 1 + 2 = 3; yields 3.', 1, 'o1', 'sum: 1 → 3'],
    ['sum = 3 + 3 = 6; yields 6.', 2, 'o2', 'sum: 3 → 6'],
  ],
  result: '1, 3, 6', resultCap: 'fold gives only the final 6; scan shows every step on the way. Returning None from the closure ends the iterator.',
}, 'j([1, 2, 3].iter().scan(0, |sum, x| { *sum += x; Some(*sum) }))');

add('iter/cycle', 'cycle', null, 'How Iterator::cycle works', 'Repeats an iterator forever; combine it with take.', {
  call: '[1, 2].iter().cycle().take(5)', note: 'starts over at the end', rows: [nums([1, 2])], outs: ['1', '2', '1', '2', '1'],
  intro: 'cycle yields the items and, when they run out, starts again from the beginning. take(5) stops it.',
  steps: [
    ['First pass: 1, 2.', [0, 1], 'o0,1'],
    ['The end is reached, so cycle starts over: 1, 2 again.', [0, 1], 'o2,3', 'second pass'],
    ['A third pass begins with 1, and take(5) has its 5 items.', 0, 'o4', '5 of 5'],
  ],
  result: '1, 2, 1, 2, 1', resultCap: 'Without take, cycle never ends. On an empty iterator it yields nothing at all.',
}, 'j([1, 2].iter().cycle().take(5))');

add('iter/copied', 'copied', null, 'How Iterator::copied works', 'Turns an iterator of references (&i32) into one of values (i32).', {
  call: '[1, 2, 3].iter().copied()', note: '&1 becomes 1', rows: [['&1', '&2', '&3']], outs: ['1', '2', '3'],
  intro: 'iter() yields references into the array. copied() copies each value out, so you get plain numbers.',
  steps: [
    ['&1 is copied to 1.', 0, 'o0'],
    ['&2 to 2.', 1, 'o1'],
    ['&3 to 3. The array itself is not changed.', 2, 'o2'],
  ],
  result: '1, 2, 3', resultCap: 'copied() works for Copy types such as numbers and char; for types like String use cloned(), which calls clone().',
}, 'j([1, 2, 3].iter().copied())');

add('iter/inspect', 'inspect', null, 'How Iterator::inspect works', 'Lets you look at each item as it passes, without changing it.', {
  call: '[1, 2, 3].iter().inspect(|x| print!("{x} ")).sum::<i32>()', note: 'peek at items on their way through', rows: [nums([1, 2, 3])], outs: ['prints 1', 'prints 2', 'prints 3'],
  intro: 'inspect runs a closure for each item and then passes the item on unchanged. Handy for debugging chains.',
  steps: [
    ['1 passes: the closure prints it, then sum adds it.', 0, 'o0', 'sum so far: 1'],
    ['2 passes: printed, then added.', 1, 'o1', 'sum so far: 3'],
    ['3 passes: printed, then added.', 2, 'o2', 'sum so far: 6'],
  ],
  result: '6', resultCap: 'The program prints 1 2 3 and the sum is 6. inspect never changes the items.',
}, 'let s: i32 = [1, 2, 3].iter().inspect(|_x| {}).sum(); s.to_string()');

module.exports = list;
