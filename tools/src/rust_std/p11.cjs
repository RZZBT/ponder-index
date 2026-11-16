// Rust standard library: the rest of HashMap (with its entries) and HashSet.
// Hash maps have no fixed order, so the truth checks print them sorted (sorted_map / sorted_set).
const { group } = require('./kit.cjs');
const MAP = ['std', 'HashMap', /collections\/hash\/map\.rs$/];
const ENTRY = ['std', 'Entry', /collections\/hash\/map\.rs$/];
const OCC = ['std', 'OccupiedEntry', /collections\/hash\/map\.rs$/];
const VAC = ['std', 'VacantEntry', /collections\/hash\/map\.rs$/];
const SET = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const { list, add } = group({ at: MAP });

// ---------------------------------------------------------------- HashMap

add('hashmap/new', 'new', null, 'How HashMap::new works', 'An empty map from keys to values.', {
  rows: [['HashMap::new()']], call: 'let mut ages = HashMap::new(); ages.insert("ann", 31);', note: 'key → value', outs: ['{}', '{"ann": 31}'],
  intro: 'new() allocates nothing until the first insert.',
  steps: [['The map starts empty.', 0, 'o0'], ['After insert it holds one pair.', 0, 'o1']],
  result: '{}, {"ann": 31}', resultCap: 'The key and value types are usually inferred from the first insert.',
}, 'let mut m: HashMap<&str, i32> = HashMap::new(); let a = sorted_map(&m); m.insert("ann", 31); format!("{}, {}", a, sorted_map(&m))');

add('hashmap/with_capacity', 'with_capacity', null, 'How HashMap::with_capacity works', 'An empty map with room for n entries.', {
  rows: [['with_capacity(100)']], call: 'HashMap::with_capacity(100)', note: 'avoid rehashing', outs: ['capacity ≥ 100'],
  intro: 'Growing a hash map means rehashing every key; reserving room avoids that.',
  steps: [['Room for 100 entries.', 0], ['Still empty.', [], 'o0']],
  result: 'len = 0, room for 100: true', resultCap: 'Same idea as Vec::with_capacity.',
}, 'let m: HashMap<i32, i32> = HashMap::with_capacity(100); format!("len = {}, room for 100: {}", m.len(), m.capacity() >= 100)');

add('hashmap/capacity', 'capacity', null, 'How HashMap::capacity works', 'How many entries fit before the map must grow.', {
  rows: [['3 entries']], call: 'm.capacity()', note: 'always ≥ len', outs: ['≥ 3'],
  intro: 'The map keeps spare room so inserts stay fast.',
  steps: [['3 entries are stored.', 0], ['Capacity is at least that.', [], 'o0']],
  result: 'true', resultCap: 'The exact number is an implementation detail.',
}, 'let m: HashMap<i32, i32> = (0..3).map(|i| (i, i)).collect(); (m.capacity() >= 3).to_string()');

add('hashmap/reserve', 'reserve', null, 'How HashMap::reserve works', 'Makes room for at least n more entries.', {
  rows: [['empty map']], call: 'm.reserve(50)', note: 'before a big insert', outs: ['capacity ≥ 50'],
  intro: 'One growth step now instead of several during the inserts.',
  steps: [['Room for 50 is requested.', 0], ['Capacity is now at least 50.', [], 'o0']],
  result: 'true', resultCap: 'try_reserve reports failure instead of aborting.',
}, 'let mut m: HashMap<i32, i32> = HashMap::new(); m.reserve(50); (m.capacity() >= 50).to_string()');

add('hashmap/shrink_to_fit', 'shrink_to_fit', null, 'How HashMap::shrink_to_fit works', 'Releases spare room after many removals.', {
  rows: [['1 entry, capacity 1000']], call: 'm.shrink_to_fit()', note: 'give memory back', outs: ['capacity small again'],
  intro: 'Removing entries never shrinks a map by itself.',
  steps: [['Most of the room is unused.', 0], ['It is released.', [], 'o0']],
  result: 'true', resultCap: 'Capacity stays at least len.',
}, 'let mut m: HashMap<i32, i32> = HashMap::with_capacity(1000); m.insert(1, 1); m.shrink_to_fit(); (m.capacity() < 1000 && m.capacity() >= 1).to_string()');

add('hashmap/is_empty', 'is_empty', null, 'How HashMap::is_empty works', 'true if the map has no entries.', {
  rows: [['{}', '{"a": 1}']], call: 'm.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'is_empty reads better than len() == 0.',
  steps: [['Empty: true.', 0, 'o0'], ['One entry: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'All std collections have is_empty.',
}, 'let a: HashMap<&str, i32> = HashMap::new(); let b = HashMap::from([("a", 1)]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('hashmap/clear', 'clear', null, 'How HashMap::clear works', 'Removes every entry, keeping the allocated room.', {
  rows: [['{"a": 1, "b": 2}']], call: 'm.clear()', note: 'empty it', outs: ['{}'],
  intro: 'clear drops all keys and values; capacity stays for reuse.',
  steps: [['Both entries are removed.', 0], ['The map is empty.', [], 'o0']],
  result: '{}', resultCap: 'drain() also removes everything, but hands the entries to you.',
}, 'let mut m = HashMap::from([("a", 1), ("b", 2)]); m.clear(); sorted_map(&m)');

add('hashmap/drain', 'drain', null, 'How HashMap::drain works', 'Removes every entry and gives each one to you.', {
  rows: [['{"x": 1, "y": 2}']], call: 'let moved: Vec<_> = m.drain().collect();', note: 'empty while taking', outs: ['moved: 2 pairs', 'm: {}'],
  intro: 'The map ends up empty but keeps its capacity.',
  steps: [['Each (key, value) pair is moved out.', 0, 'o0'], ['The map is left empty.', 0, 'o1']],
  result: '[("x", 1), ("y", 2)], {}', resultCap: 'Pairs come out in arbitrary order.',
}, 'let mut m = HashMap::from([("x", 1), ("y", 2)]); let mut moved: Vec<_> = m.drain().collect(); moved.sort(); format!("{:?}, {}", moved, sorted_map(&m))');

add('hashmap/iter_mut', 'iter_mut', null, 'How HashMap::iter_mut works', 'Visits every entry with a mutable reference to its value.', {
  rows: [['{"a": 1, "b": 2}']], call: 'for (_, v) in m.iter_mut() { *v *= 10; }', note: 'edit all values', outs: ['{"a": 10, "b": 20}'],
  intro: 'Keys stay read-only; values can be changed.',
  steps: [['Each value is lent mutably.', 0], ['All are multiplied by 10.', [], 'o0']],
  result: '{"a": 10, "b": 20}', resultCap: 'values_mut() if you do not need the keys.',
}, 'let mut m = HashMap::from([("a", 1), ("b", 2)]); for (_, v) in m.iter_mut() { *v *= 10; } sorted_map(&m)');

add('hashmap/values_mut', 'values_mut', null, 'How HashMap::values_mut works', 'Mutable references to every value.', {
  rows: [['{"a": 1, "b": 2}']], call: 'for v in m.values_mut() { *v += 1; }', note: 'just the values', outs: ['{"a": 2, "b": 3}'],
  intro: 'Like iter_mut, without the keys.',
  steps: [['Each value is lent.', 0], ['Each gets + 1.', [], 'o0']],
  result: '{"a": 2, "b": 3}', resultCap: 'Keys can never be changed in place; remove and re-insert instead.',
}, 'let mut m = HashMap::from([("a", 1), ("b", 2)]); for v in m.values_mut() { *v += 1; } sorted_map(&m)');

add('hashmap/into_keys', 'into_keys', null, 'How HashMap::into_keys works', 'Consumes the map and yields its keys (owned).', {
  rows: [['{"b": 1, "a": 2}']], call: 'm.into_keys().collect::<Vec<_>>()', note: 'keep the keys only', outs: ['["a", "b"] (any order)'],
  intro: 'The values are dropped; the keys are moved out.',
  steps: [['The map is consumed.', 0], ['Its keys come out (sorted here for display).', [], 'o0']],
  result: '["a", "b"]', resultCap: 'into_values does the same for the values.',
}, 'let m = HashMap::from([("b", 1), ("a", 2)]); let mut k: Vec<_> = m.into_keys().collect(); k.sort(); d(k)');

add('hashmap/into_values', 'into_values', null, 'How HashMap::into_values works', 'Consumes the map and yields its values (owned).', {
  rows: [['{"x": 3, "y": 1}']], call: 'm.into_values().sum::<i32>()', note: 'keep the values only', outs: ['4'],
  intro: 'Keys are dropped; values are moved out.',
  steps: [['Values 3 and 1 come out.', 0], ['Their sum is 4.', [], 'o0']],
  result: '4', resultCap: 'values() only borrows them.',
}, 'let m = HashMap::from([("x", 3), ("y", 1)]); m.into_values().sum::<i32>().to_string()');

add('hashmap/remove_entry', 'remove_entry', null, 'How HashMap::remove_entry works', 'Removes a key and returns both the stored key and the value.', {
  rows: [['{"id": 7}']], call: 'm.remove_entry("id")', note: 'get the owned key back', outs: ['Some(("id", 7))'],
  intro: 'remove returns only the value; remove_entry returns the key too.',
  steps: [['The entry for "id" is found.', 0], ['It is removed and returned as a pair.', [], 'o0']],
  result: 'Some(("id", 7)), {}', resultCap: 'Useful when the key is an expensive String you want to reuse.',
}, 'let mut m = HashMap::from([("id", 7)]); let r = m.remove_entry("id"); format!("{:?}, {}", r, sorted_map(&m))');

add('hashmap/extract_if', 'extract_if', null, 'How HashMap::extract_if works', 'Removes the entries that pass a test and gives them to you.', {
  rows: [['{"a": 1, "b": 20, "c": 3}']], call: 'let big: HashMap<_, _> = m.extract_if(|_, v| *v > 10).collect();', note: 'split a map', outs: ['big: {"b": 20}', 'm: {"a": 1, "c": 3}'],
  intro: 'retain keeps the passing entries; extract_if takes them out.',
  steps: [['"b": 20 passes the test and is moved out.', 0, 'o0'], ['The rest stays.', 0, 'o1']],
  result: '{"b": 20}, {"a": 1, "c": 3}', resultCap: 'The closure may also change the values it sees.',
}, 'let mut m = HashMap::from([("a", 1), ("b", 20), ("c", 3)]); let big: HashMap<_, _> = m.extract_if(|_, v| *v > 10).collect(); format!("{}, {}", sorted_map(&big), sorted_map(&m))');

add('hashmap/get_disjoint_mut', 'get_disjoint_mut', null, 'How HashMap::get_disjoint_mut works', 'Mutable references to several different keys at once.', {
  rows: [['{"ann": 100, "bob": 50}']], call: 'let [Some(a), Some(b)] = m.get_disjoint_mut(["ann", "bob"]) else { .. };', note: 'transfer between two entries', outs: ['{"ann": 70, "bob": 80}'],
  intro: 'Two get_mut calls at once would not compile; this checks that the keys differ.',
  steps: [['Both values are lent mutably.', 0], ['30 moves from ann to bob.', [], 'o0']],
  result: '{"ann": 70, "bob": 80}', resultCap: 'It panics if the same key is listed twice.',
}, 'let mut m = HashMap::from([("ann", 100), ("bob", 50)]); if let [Some(a), Some(b)] = m.get_disjoint_mut(["ann", "bob"]) { *a -= 30; *b += 30; } sorted_map(&m)');

add('hashmap/extend', 'extend', null, 'How HashMap::extend works', 'Inserts every pair from an iterator; existing keys are overwritten.', {
  rows: [['{"a": 1}'], ['("a", 9)', '("b", 2)']], call: 'm.extend([("a", 9), ("b", 2)])', note: 'bulk insert', outs: ['{"a": 9, "b": 2}'],
  intro: 'extend is insert in a loop.',
  steps: [['"a" already exists: its value becomes 9.', 'b0'], ['"b" is new.', 'b1', 'o0']],
  result: '{"a": 9, "b": 2}', resultCap: 'Merging two maps: a.extend(b).',
}, 'let mut m = HashMap::from([("a", 1)]); m.extend([("a", 9), ("b", 2)]); sorted_map(&m)');

add('hashmap/from_iter', 'from_iter', null, 'How HashMap::from_iter works', 'Builds a map from (key, value) pairs; this is what collect() uses.', {
  rows: [['"apple"', '"kiwi"']], call: 'words.iter().map(|w| (*w, w.len())).collect::<HashMap<_, _>>()', note: 'word → length', outs: ['{"apple": 5, "kiwi": 4}'],
  intro: 'Each pair is inserted; later duplicates overwrite earlier ones.',
  steps: [['Pairs ("apple", 5) and ("kiwi", 4) are made.', [0, 1]], ['They form the map.', [], 'o0']],
  result: '{"apple": 5, "kiwi": 4}', resultCap: 'HashMap::from([(k, v), ...]) is shorter for fixed data.',
}, 'let words = ["apple", "kiwi"]; let m: HashMap<_, _> = HashMap::from_iter(words.iter().map(|w| (*w, w.len()))); sorted_map(&m)');

// ---------------------------------------------------------------- entries

add('entry/key', 'key', ENTRY, 'How Entry::key works', 'The key this entry is about, whether it exists or not.', {
  rows: [['entry("pear")']], call: 'm.entry("pear").key()', note: 'look before deciding', outs: ['&"pear"'],
  intro: 'Every Entry knows its key, occupied or vacant.',
  steps: [['The entry for "pear" is created.', 0], ['key() returns "pear".', [], 'o0']],
  result: '"pear"', resultCap: 'Useful when the key was computed and you need it again.',
}, 'let mut m: HashMap<&str, i32> = HashMap::new(); d(*m.entry("pear").key())');

add('entry/insert_entry', 'insert_entry', ENTRY, 'How Entry::insert_entry works', 'Sets the value (new or replacing) and returns the occupied entry.', {
  rows: [['vacant "a"', 'occupied "b": 1']], call: 'm.entry(k).insert_entry(5)', note: 'always ends occupied', outs: ['"a": 5', '"b": 5'],
  intro: 'Whatever was there before, the key now maps to 5.',
  steps: [['Vacant: inserted.', 0, 'o0'], ['Occupied: replaced.', 1, 'o1']],
  result: '{"a": 5, "b": 5}', resultCap: 'The returned OccupiedEntry lets you keep working with that entry.',
}, 'let mut m = HashMap::from([("b", 1)]); m.entry("a").insert_entry(5); m.entry("b").insert_entry(5); sorted_map(&m)');

add('occupied/get', 'get', OCC, 'How OccupiedEntry::get works', 'Reads the value of an entry that exists.', {
  rows: [['entry("x") → Occupied(3)']], call: 'if let Entry::Occupied(e) = m.entry("x") { e.get() }', note: 'match on the entry', outs: ['&3'],
  intro: 'After matching Entry::Occupied, the value is guaranteed to be there.',
  steps: [['"x" exists: Occupied.', 0], ['get() lends its value.', [], 'o0']],
  result: '3', resultCap: 'Matching on Entry handles both cases with a single lookup.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("x", 3)]); let v = match m.entry("x") { Entry::Occupied(e) => *e.get(), Entry::Vacant(_) => 0 }; v.to_string()');

add('occupied/insert', 'insert', OCC, 'How OccupiedEntry::insert works', 'Replaces the value and returns the old one.', {
  rows: [['"x": 3']], call: 'e.insert(10)', note: 'swap the value', outs: ['returns 3', 'now 10'],
  intro: 'The key stays; only the value changes.',
  steps: [['The old 3 comes back.', 0, 'o0'], ['10 is stored.', 0, 'o1']],
  result: '3, {"x": 10}', resultCap: 'Same as HashMap::insert on an existing key.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("x", 3)]); let old = if let Entry::Occupied(mut e) = m.entry("x") { e.insert(10) } else { 0 }; format!("{}, {}", old, sorted_map(&m))');

add('occupied/remove', 'remove', OCC, 'How OccupiedEntry::remove works', 'Removes the entry and returns its value.', {
  rows: [['"tmp": 1']], call: 'e.remove()', note: 'delete through the entry', outs: ['returns 1', 'map: {}'],
  intro: 'Decide based on the value, then remove, with one lookup.',
  steps: [['The value 1 is returned.', 0, 'o0'], ['The key is gone.', 0, 'o1']],
  result: '1, {}', resultCap: 'remove_entry also returns the key.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("tmp", 1)]); let v = if let Entry::Occupied(e) = m.entry("tmp") { e.remove() } else { 0 }; format!("{}, {}", v, sorted_map(&m))');

add('occupied/get_mut', 'get_mut', OCC, 'How OccupiedEntry::get_mut works', 'A mutable reference to the value, for as long as the entry lives.', {
  rows: [['"hits": 1']], call: '*e.get_mut() += 1;', note: 'edit in place', outs: ['"hits": 2'],
  intro: 'Changes go straight into the map.',
  steps: [['The value is lent mutably.', 0], ['It becomes 2.', [], 'o0']],
  result: '{"hits": 2}', resultCap: 'into_mut gives a reference that outlives the entry.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("hits", 1)]); if let Entry::Occupied(mut e) = m.entry("hits") { *e.get_mut() += 1; } sorted_map(&m)');

add('occupied/into_mut', 'into_mut', OCC, 'How OccupiedEntry::into_mut works', 'Turns the entry into a &mut to its value that lives on.', {
  rows: [['"list": [1]']], call: 'let v = e.into_mut(); v.push(2);', note: 'keep the reference', outs: ['"list": [1, 2]'],
  intro: 'The entry is consumed; the reference is tied to the map instead.',
  steps: [['The entry becomes a &mut Vec.', 0], ['2 is pushed.', [], 'o0']],
  result: '{"list": [1, 2]}', resultCap: 'or_insert also returns such a reference.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("list", vec![1])]); if let Entry::Occupied(e) = m.entry("list") { let v = e.into_mut(); v.push(2); } sorted_map(&m)');

add('vacant/insert', 'insert', VAC, 'How VacantEntry::insert works', 'Fills a missing key and returns &mut to the new value.', {
  rows: [['entry("new") → Vacant']], call: 'if let Entry::Vacant(e) = m.entry("new") { e.insert(0); }', note: 'only when absent', outs: ['{"new": 0}'],
  intro: 'Only reached when the key did not exist.',
  steps: [['"new" is missing: Vacant.', 0], ['insert(0) creates it.', [], 'o0']],
  result: '{"new": 0}', resultCap: 'or_insert is the shortcut for this pattern.',
}, 'use std::collections::hash_map::Entry; let mut m: HashMap<&str, i32> = HashMap::new(); if let Entry::Vacant(e) = m.entry("new") { e.insert(0); } sorted_map(&m)');

add('vacant/into_key', 'into_key', VAC, 'How VacantEntry::into_key works', 'Gives the key back without inserting anything.', {
  rows: [['entry(String "k") → Vacant']], call: 'e.into_key()', note: 'changed your mind', outs: ['"k"', 'map unchanged'],
  intro: 'm.entry(key) took ownership of the key; into_key returns it.',
  steps: [['The key is handed back.', 0, 'o0'], ['Nothing was inserted.', 0, 'o1']],
  result: '"k", {}', resultCap: 'Avoids cloning an expensive key just to look it up.',
}, 'use std::collections::hash_map::Entry; let mut m: HashMap<String, i32> = HashMap::new(); let k = if let Entry::Vacant(e) = m.entry(String::from("k")) { e.into_key() } else { String::new() }; format!("{:?}, {}", k, sorted_map(&m))');

// ---------------------------------------------------------------- HashSet

add('hashset/new', 'new', SET, 'How HashSet::new works', 'An empty set: a collection of unique values.', {
  rows: [['HashSet::new()']], call: 'let mut seen = HashSet::new(); seen.insert(3);', note: 'no duplicates', outs: ['{}', '{3}'],
  intro: 'A set remembers whether a value is in it, nothing more.',
  steps: [['Empty.', 0, 'o0'], ['After insert(3): {3}.', 0, 'o1']],
  result: '{}, {3}', resultCap: 'Classic use: tracking what you have already seen.',
}, 'let mut s: HashSet<i32> = HashSet::new(); let a = sorted_set(&s); s.insert(3); format!("{}, {}", a, sorted_set(&s))');

add('hashset/len', 'len', SET, 'How HashSet::len works', 'The number of distinct values.', {
  rows: [['insert 1, 2, 2, 3']], call: 's.len()', note: 'duplicates count once', outs: ['3'],
  intro: 'Inserting a value that is already present changes nothing.',
  steps: [['The second 2 is ignored.', 0], ['Three distinct values.', [], 'o0']],
  result: '3', resultCap: 'Count distinct words: words.iter().collect::<HashSet<_>>().len().',
}, 'let s: HashSet<i32> = [1, 2, 2, 3].into_iter().collect(); s.len().to_string()');

add('hashset/is_empty', 'is_empty', SET, 'How HashSet::is_empty works', 'true if the set has no values.', {
  rows: [['{}', '{1}']], call: 's.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'A quick emptiness check.',
  steps: [['Empty: true.', 0, 'o0'], ['One value: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Handy in loops that process a work set until it is empty.',
}, 'let a: HashSet<i32> = HashSet::new(); let b = HashSet::from([1]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('hashset/iter', 'iter', SET, 'How HashSet::iter works', 'Visits every value, in no particular order.', {
  rows: [['{3, 1, 2}']], call: 's.iter().sum::<i32>()', note: 'order is unspecified', outs: ['6'],
  intro: 'Use iter for anything that does not depend on order, like sums or counts.',
  steps: [['Each value is visited once.', 0], ['Their sum is 6.', [], 'o0']],
  result: '6', resultCap: 'Need sorted output? Collect into a Vec and sort, or use a BTreeSet.',
}, 'let s = HashSet::from([3, 1, 2]); s.iter().sum::<i32>().to_string()');

add('hashset/is_superset', 'is_superset', SET, 'How HashSet::is_superset works', 'true if this set contains every value of the other.', {
  rows: [['{1, 2, 3}', '{1, 3}']], call: 'a.is_superset(&b)', note: 'a ⊇ b', outs: ['true'],
  intro: 'Every element of b must be in a.',
  steps: [['1 and 3 are both in a.', [0, 1]], ['So a is a superset: true.', [], 'o0']],
  result: 'true', resultCap: 'is_subset asks the reverse question.',
}, 'let a = HashSet::from([1, 2, 3]); let b = HashSet::from([1, 3]); a.is_superset(&b).to_string()');

add('hashset/get', 'get', SET, 'How HashSet::get works', 'A reference to the stored value equal to the one given.', {
  rows: [['{"Ann"}']], call: 's.get("Ann")', note: 'fetch the stored copy', outs: ['Some("Ann")'],
  intro: 'contains says yes or no; get returns the element itself.',
  steps: [['"Ann" is in the set.', 0], ['You get a reference to it.', [], 'o0']],
  result: 'Some("Ann")', resultCap: 'Useful for interning: reuse the stored String instead of a new one.',
}, 'let s = HashSet::from([String::from("Ann")]); d(s.get("Ann"))');

add('hashset/take', 'take', SET, 'How HashSet::take works', 'Removes a value and returns it.', {
  rows: [['{"a", "b"}']], call: 's.take("a")', note: 'remove + get back', outs: ['Some("a")', 'set {"b"}'],
  intro: 'remove returns a bool; take returns the owned value.',
  steps: [['"a" comes out.', 0, 'o0'], ['"b" stays.', 0, 'o1']],
  result: 'Some("a"), {"b"}', resultCap: 'Returns None if the value was not there.',
}, 'let mut s = HashSet::from([String::from("a"), String::from("b")]); let t = s.take("a"); format!("{:?}, {}", t, sorted_set(&s))');

add('hashset/replace', 'replace', SET, 'How HashSet::replace works', 'Inserts a value, replacing an equal one, and returns the old one.', {
  rows: [['{1}'], ['insert 1 again', 'insert 2']], call: 's.replace(1)', note: 'swap equal values', outs: ['Some(1)', 'None'],
  intro: 'insert keeps the old element; replace swaps it for the new one.',
  steps: [['1 was there: the old one is returned.', 'b0', 'o0'], ['2 is new: None.', 'b1', 'o1']],
  result: 'Some(1), None', resultCap: 'Matters when equal values still differ in other fields.',
}, 'let mut s = HashSet::from([1]); format!("{:?}, {:?}", s.replace(1), s.replace(2))');

add('hashset/drain', 'drain', SET, 'How HashSet::drain works', 'Removes every value and gives each one to you.', {
  rows: [['{1, 2}']], call: 's.drain().collect::<Vec<_>>()', note: 'empty while taking', outs: ['[1, 2] (any order)', 'set: {}'],
  intro: 'The set keeps its capacity for reuse.',
  steps: [['Each value is moved out.', 0, 'o0'], ['The set is empty.', 0, 'o1']],
  result: '[1, 2], {}', resultCap: 'Values come out in arbitrary order.',
}, 'let mut s = HashSet::from([1, 2]); let mut v: Vec<_> = s.drain().collect(); v.sort(); format!("{:?}, {}", v, sorted_set(&s))');

add('hashset/clear', 'clear', SET, 'How HashSet::clear works', 'Removes every value.', {
  rows: [['{1, 2, 3}']], call: 's.clear()', note: 'empty it', outs: ['{}'],
  intro: 'clear keeps the allocated room.',
  steps: [['All values are dropped.', 0], ['The set is empty.', [], 'o0']],
  result: '{}', resultCap: 'Reuse the same set across loop iterations to avoid reallocating.',
}, 'let mut s = HashSet::from([1, 2, 3]); s.clear(); sorted_set(&s)');

add('hashset/extract_if', 'extract_if', SET, 'How HashSet::extract_if works', 'Removes the values that pass a test and gives them to you.', {
  rows: [['{1, 2, 3, 4}']], call: 'let evens: HashSet<_> = s.extract_if(|x| x % 2 == 0).collect();', note: 'split a set', outs: ['evens {2, 4}', 'odds {1, 3}'],
  intro: 'Like retain, but the removed values are not lost.',
  steps: [['2 and 4 pass: taken out.', 0, 'o0'], ['1 and 3 stay.', 0, 'o1']],
  result: '{2, 4}, {1, 3}', resultCap: 'The iterator must be consumed for the removal to happen.',
}, 'let mut s = HashSet::from([1, 2, 3, 4]); let ev: HashSet<_> = s.extract_if(|x| x % 2 == 0).collect(); format!("{}, {}", sorted_set(&ev), sorted_set(&s))');

add('hashset/extend', 'extend', SET, 'How HashSet::extend works', 'Inserts every value from an iterator; duplicates are ignored.', {
  rows: [['{1}'], ['1', '2', '2']], call: 's.extend([1, 2, 2])', note: 'bulk insert', outs: ['{1, 2}'],
  intro: 'Values already present change nothing.',
  steps: [['1 is already there.', 'b0'], ['2 is added once.', ['b1', 'b2'], 'o0']],
  result: '{1, 2}', resultCap: 'Union in place: a.extend(&b) for Copy values.',
}, 'let mut s = HashSet::from([1]); s.extend([1, 2, 2]); sorted_set(&s)');

add('hashset/from_iter', 'from_iter', SET, 'How HashSet::from_iter works', 'Builds a set from an iterator; this is what collect() uses.', {
  rows: [['"b"', '"a"', '"b"']], call: 'words.iter().collect::<HashSet<_>>()', note: 'deduplicate', outs: ['{"a", "b"}'],
  intro: 'Every item is inserted; duplicates collapse.',
  steps: [['"b", "a", "b" go in.', [0, 1, 2]], ['Two distinct values remain.', [], 'o0']],
  result: '{"a", "b"}', resultCap: 'The quickest way to remove duplicates when order does not matter.',
}, 'let s: HashSet<&str> = HashSet::from_iter(["b", "a", "b"]); sorted_set(&s)');

module.exports = list;
