// indexmap: 7 animations (#72-78). The map in the examples is built by inserting "c" → 1, "a" → 2, "b" → 3.
const { Scene, pick } = require('./scene.cjs');
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });
const MAP = 'let mut m = IndexMap::new(); m.insert("c", 1); m.insert("a", 2); m.insert("b", 3);';
const NOTE = 'm = IndexMap built by inserting "c" → 1, "a" → 2, "b" → 3';

// entries in a row with their index below
function entries(call, note, list = [['c', 1], ['a', 2], ['b', 3]]) {
  const sc = new Scene(call, note);
  const xs = list.map((_, i) => 500 + (i - (list.length - 1) / 2) * 200);
  list.forEach(([k, v], i) => { sc.box('e' + k, `"${k}": ${v}`, xs[i], 250, { w: 150 }); sc.text('i' + i, 'index ' + i, xs[i], 310, { size: 20 }); });
  sc.text('eq', '', 500, 400, { size: 26, fill: 'warning' });
  return { sc, xs };
}

add('insert', 'How IndexMap::insert() works', 'Adds a key and value; the map remembers the order keys were inserted.', () => pick({
  call: 'm.insert("c", 1); m.insert("a", 2); m.insert("b", 3);', note: 'iteration follows insertion order', rows: [['insert "c"', 'insert "a"', 'insert "b"']], rowFills: ['surface'],
  outs: ['"c": 1', '"a": 2', '"b": 3'],
  intro: 'An IndexMap stores its entries in a Vec, in insertion order, plus a hash table that points into that Vec.',
  steps: [
    { cap: '"c" is new: it goes to the end, at index 0. insert() returns None.', src: ['a0'], out: [0], eq: 'index 0' },
    { cap: '"a" is new: index 1.', src: ['a1'], out: [1], eq: 'index 1' },
    { cap: '"b" is new: index 2.', src: ['a2'], out: [2], eq: 'index 2' },
    { cap: 'Iterating gives c, a, b: the insertion order. A HashMap would give an order you cannot predict. Inserting "a" again would replace its value and keep it at index 1.', eq: 'keys: c, a, b' },
  ],
  result: 'c, a, b', resultCap: 'm.keys() yields c, a, b. Lookups by key are still as fast as in a HashMap.',
}), `${MAP} j(m.keys())`, 'c, a, b');

add('get-index', 'How IndexMap::get_index() works', 'Looks up an entry by its position.', () => {
  const { sc } = entries('m.get_index(1)', NOTE);
  sc.intro('get_index() reads the entry stored at a position, like indexing a Vec.');
  sc.step('Index 1 is the second entry: "a" → 2.', [sc.hi(['ea'], 'warning'), sc.say('eq', 'index 1 → ("a", 2)')]);
  sc.step('It returns both the key and the value, as Some((&key, &value)).', sc.hi(['ea'], 'success'));
  sc.step('An index past the end, like get_index(3), returns None instead of panicking.', [sc.say('eq', 'get_index(3) → None')]);
  sc.result('Some(("a", 2))', 'm.get_index(1) is Some(("a", 2)). Positions change when entries are removed with swap_remove() or shift_remove().', sc.say('eq', ''));
  return sc.build();
}, `${MAP} d(m.get_index(1))`, 'Some(("a", 2))');

add('get-index-of', 'How IndexMap::get_index_of() works', 'Finds the position of a key.', () => {
  const { sc } = entries('m.get_index_of("b")', NOTE);
  sc.intro('get_index_of() is the opposite of get_index(): it takes a key and returns its position.');
  sc.step('The hash table finds "b" directly, without walking the entries.', [sc.hi(['eb'], 'warning'), sc.say('eq', 'hash "b" → entry')]);
  sc.step('That entry is stored at index 2.', [sc.hi(['eb'], 'success'), sc.say('eq', '"b" → index 2')]);
  sc.step('A key that is not in the map, like "z", gives None.', sc.say('eq', 'get_index_of("z") → None'));
  sc.result('Some(2)', 'm.get_index_of("b") is Some(2). get_full("b") returns the index, the key and the value together.', sc.say('eq', ''));
  return sc.build();
}, `${MAP} d(m.get_index_of("b"))`, 'Some(2)');

add('swap-remove', 'How IndexMap::swap_remove() works', 'Removes an entry fast by moving the last entry into its place; the order changes.', () => {
  const { sc, xs } = entries('m.swap_remove("c")', NOTE);
  sc.intro('swap_remove() removes an entry without shifting the others. That is fast, but it changes the order.');
  sc.step('"c" is at index 0. It is taken out and its value 1 is returned.', [sc.hi(['ec'], 'danger'), sc.say('eq', 'remove "c" → Some(1)')]);
  sc.step('The gap is filled with the last entry: "b" moves from index 2 to index 0.', [sc.dim(['ec'], 0.15), sc.mv('eb', xs[0], 250), sc.hi(['eb'], 'warning'), sc.say('eq', 'last entry fills the gap')]);
  sc.step('Only one entry moved, whatever the size of the map. "a" kept its index; "b" did not.', [sc.reset(['eb']), sc.say('eq', 'order: b, a')]);
  sc.result('b, a', 'After swap_remove("c") the keys are b, a. Use shift_remove() when the order must be kept.', sc.say('eq', ''));
  return sc.build();
}, `${MAP} let r = m.swap_remove("c"); format!("{:?} → {}", r, j(m.keys()))`, 'Some(1) → b, a', 'b, a');

add('shift-remove', 'How IndexMap::shift_remove() works', 'Removes an entry and shifts the later entries down, keeping the order.', () => {
  const { sc, xs } = entries('m.shift_remove("c")', NOTE);
  sc.intro('shift_remove() removes an entry like Vec::remove(): everything after it moves one place to the left.');
  sc.step('"c" at index 0 is taken out; its value 1 is returned.', [sc.hi(['ec'], 'danger'), sc.say('eq', 'remove "c" → Some(1)')]);
  sc.step('"a" moves from index 1 to 0 and "b" from 2 to 1.', [sc.dim(['ec'], 0.15), sc.mv('ea', xs[0], 250), sc.mv('eb', xs[1], 250), sc.hi(['ea', 'eb'], 'warning'), sc.say('eq', 'later entries shift left')]);
  sc.step('The order is kept, but every later entry had to move: slower than swap_remove() for big maps.', [sc.reset(['ea', 'eb']), sc.say('eq', 'order: a, b')]);
  sc.result('a, b', 'After shift_remove("c") the keys are a, b. In indexmap 1.x, plain remove() was swap_remove().', sc.say('eq', ''));
  return sc.build();
}, `${MAP} let r = m.shift_remove("c"); format!("{:?} → {}", r, j(m.keys()))`, 'Some(1) → a, b', 'a, b');

add('sort-keys', 'How IndexMap::sort_keys() works', 'Sorts the entries of the map by key, in place.', () => {
  const { sc, xs } = entries('m.sort_keys()', NOTE);
  sc.intro('sort_keys() reorders the entries so that the keys are in ascending order. The values move with their keys.');
  sc.step('"a" is the smallest key: it moves to index 0.', [sc.mv('ea', xs[0], 250), sc.mv('ec', xs[1], 160), sc.hi(['ea'], 'success')]);
  sc.step('Then "b" at index 1.', [sc.mv('eb', xs[1], 250), sc.mv('ec', xs[2], 160), sc.hi(['eb'], 'success')]);
  sc.step('"c" is last, at index 2.', [sc.mv('ec', xs[2], 250), sc.hi(['ec'], 'success')]);
  sc.result('a, b, c', 'The map now iterates a, b, c, and get_index(0) is ("a", 2). sort_by() takes your own comparison.');
  return sc.build();
}, `${MAP} m.sort_keys(); j(m.iter().map(|(k, _)| k))`, 'a, b, c');

add('set-insert', 'How IndexSet::insert() works', 'Adds a value to a set that keeps insertion order; returns false for a value already in it.', () => pick({
  call: 's.insert("b"); s.insert("a"); s.insert("b");', note: 'a set: each value at most once, in insertion order', rows: [['insert "b"', 'insert "a"', 'insert "b"']], rowFills: ['surface'],
  outs: ['"b"', '"a"'],
  intro: 'IndexSet is an IndexMap without values. insert() returns true when the value was new.',
  steps: [
    { cap: '"b" is new: it is added at index 0 and insert() returns true.', src: ['a0'], out: [0], eq: 'true' },
    { cap: '"a" is new: index 1, true.', src: ['a1'], out: [1], eq: 'true' },
    { cap: '"b" is already in the set: nothing is added, it keeps index 0, and insert() returns false.', src: ['a2'], srcColor: 'danger', eq: 'false' },
  ],
  result: 'b, a', resultCap: 'The set iterates b, a and the three calls returned true, true, false. insert_full() also returns the index.',
}), 'let mut s = IndexSet::new(); let r = [s.insert("b"), s.insert("a"), s.insert("b")]; format!("{} / {:?}", j(s.iter()), r)', 'b, a / [true, true, false]', 'true, true, false');

module.exports = A;
