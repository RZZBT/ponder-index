// Rust standard library: BTreeMap's entry API (its own Entry types, separate from HashMap's), the rest of BTreeMap
// and BTreeSet, and HashMap/HashSet capacity and hasher methods.
const { group } = require('./kit.cjs');
const E = (o) => ['alloc', o, /btree\/map\/entry\.rs$/];
const BM = ['alloc', 'BTreeMap', /btree\/map\.rs$/];
const BS = ['alloc', 'BTreeSet', /btree\/set\.rs$/];
const HM = (o) => ['std', o, /collections\/hash\/map\.rs$/];
const HS = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const { list, add } = group({ at: E('Entry') });
const U = 'use std::collections::btree_map::Entry; ';

// ---------------------------------------------------------------- BTreeMap entries

add('btree_entry/or_insert', 'or_insert', null, 'How BTreeMap entry().or_insert works', 'Inserts a value if the key is missing, then lends the value.', {
  rows: [['"a" present', '"z" missing']], call: '*m.entry(word).or_insert(0) += 1;', note: 'counting, in sorted order', outs: ['"a": 2', '"z": 1'],
  intro: 'The classic counting pattern, with keys kept sorted.',
  steps: [['"a" exists: its count goes from 1 to 2.', 0, 'o0'], ['"z" is new: inserted as 0, then 1.', 1, 'o1']],
  result: '{"a": 2, "z": 1}', resultCap: 'The value is created even if not needed; or_insert_with avoids that.',
}, 'let mut m = BTreeMap::from([("a", 1)]); *m.entry("a").or_insert(0) += 1; *m.entry("z").or_insert(0) += 1; d(m)');

add('btree_entry/or_insert_with', 'or_insert_with', null, 'How BTreeMap entry().or_insert_with works', 'Inserts the result of a closure only if the key is missing.', {
  rows: [['key 1 missing']], call: 'm.entry(1).or_insert_with(Vec::new).push("x");', note: 'lazy default', outs: ['{1: ["x"]}'],
  intro: 'The closure runs only for a vacant entry.',
  steps: [['Key 1 is missing: Vec::new() runs.', 0], ['"x" is pushed onto it.', [], 'o0']],
  result: '{1: ["x"]}', resultCap: 'Grouping items into lists by key.',
}, 'let mut m: BTreeMap<i32, Vec<&str>> = BTreeMap::new(); m.entry(1).or_insert_with(Vec::new).push("x"); d(m)');

add('btree_entry/or_insert_with_key', 'or_insert_with_key', null, 'How BTreeMap entry().or_insert_with_key works', 'Like or_insert_with, but the closure receives the key.', {
  rows: [['key 4 missing']], call: 'm.entry(4).or_insert_with_key(|k| k * k)', note: 'value from the key', outs: ['{4: 16}'],
  intro: 'Useful when the default depends on the key, like a cache.',
  steps: [['Key 4 is missing.', 0], ['The closure computes 4 × 4 = 16.', [], 'o0']],
  result: '{4: 16}', resultCap: 'A simple memoisation table.',
}, 'let mut m: BTreeMap<i32, i32> = BTreeMap::new(); m.entry(4).or_insert_with_key(|k| k * k); d(m)');

add('btree_entry/or_default', 'or_default', null, 'How BTreeMap entry().or_default works', 'Inserts the default value (0, "", empty Vec) if the key is missing.', {
  rows: [['"b", "a", "b"']], call: 'for w in words { *m.entry(w).or_default() += 1; }', note: 'count without a starting value', outs: ['{"a": 1, "b": 2}'],
  intro: 'For counters the default is 0.',
  steps: [['Each word starts at 0 the first time.', 0], ['Counts: a 1, b 2, sorted by key.', [], 'o0']],
  result: '{"a": 1, "b": 2}', resultCap: 'Shorter than or_insert(0).',
}, 'let mut m: BTreeMap<&str, i32> = BTreeMap::new(); for w in ["b", "a", "b"] { *m.entry(w).or_default() += 1; } d(m)');

add('btree_entry/and_modify', 'and_modify', null, 'How BTreeMap entry().and_modify works', 'Changes the value only if the key exists; chain or_insert for the other case.', {
  rows: [['"x" present', '"y" missing']], call: 'm.entry(k).and_modify(|v| *v += 1).or_insert(1);', note: 'update or insert', outs: ['"x": 6', '"y": 1'],
  intro: 'and_modify runs for occupied entries, or_insert for vacant ones.',
  steps: [['"x" exists: 5 becomes 6.', 0, 'o0'], ['"y" is new: inserted as 1.', 1, 'o1']],
  result: '{"x": 6, "y": 1}', resultCap: 'One lookup handles both cases.',
}, 'let mut m = BTreeMap::from([("x", 5)]); for k in ["x", "y"] { m.entry(k).and_modify(|v| *v += 1).or_insert(1); } d(m)');

add('btree_entry/key', 'key', null, 'How BTreeMap Entry::key works', 'The key of the entry, whether it exists or not.', {
  rows: [['entry(7)']], call: 'm.entry(7).key()', note: 'look before deciding', outs: ['&7'],
  intro: 'Every entry knows its key.',
  steps: [['The entry for 7.', 0], ['key() gives 7.', [], 'o0']],
  result: '7', resultCap: 'The map is not changed by looking.',
}, 'let mut m: BTreeMap<i32, i32> = BTreeMap::new(); m.entry(7).key().to_string()');

add('btree_entry/insert_entry', 'insert_entry', null, 'How BTreeMap Entry::insert_entry works', 'Sets the value, new or replacing, and returns the occupied entry.', {
  rows: [['vacant 1', 'occupied 2']], call: 'm.entry(k).insert_entry("v")', note: 'always ends occupied', outs: ['1: "v"', '2: "v"'],
  intro: 'Whatever was there, the key now maps to the new value.',
  steps: [['Vacant: inserted.', 0, 'o0'], ['Occupied: replaced.', 1, 'o1']],
  result: '{1: "v", 2: "v"}', resultCap: 'The returned entry can be used further.',
}, 'let mut m = BTreeMap::from([(2, "old")]); m.entry(1).insert_entry("v"); m.entry(2).insert_entry("v"); d(m)');

add('btree_occupied/get', 'get', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::get works', 'Reads the value of an entry that exists.', {
  rows: [['entry(1) → Occupied("a")']], call: 'if let Entry::Occupied(e) = m.entry(1) { e.get() }', note: 'after matching', outs: ['&"a"'],
  intro: 'Matching on Entry handles both cases with one lookup.',
  steps: [['Key 1 exists.', 0], ['get() lends "a".', [], 'o0']],
  result: '"a"', resultCap: 'get_mut lends it mutably.',
}, U + 'let mut m = BTreeMap::from([(1, "a")]); let v = match m.entry(1) { Entry::Occupied(e) => *e.get(), Entry::Vacant(_) => "" }; d(v)');

add('btree_occupied/get_mut', 'get_mut', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::get_mut works', 'A mutable reference to the value while you hold the entry.', {
  rows: [['1: 10']], call: '*e.get_mut() *= 2;', note: 'edit through the entry', outs: ['1: 20'],
  intro: 'Changes go straight into the map.',
  steps: [['The value is lent mutably.', 0], ['10 becomes 20.', [], 'o0']],
  result: '{1: 20}', resultCap: 'into_mut gives a reference that outlives the entry.',
}, U + 'let mut m = BTreeMap::from([(1, 10)]); if let Entry::Occupied(mut e) = m.entry(1) { *e.get_mut() *= 2; } d(m)');

add('btree_occupied/insert', 'insert', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::insert works', 'Replaces the value and returns the old one.', {
  rows: [['1: "old"']], call: 'e.insert("new")', note: 'swap the value', outs: ['returns "old"', '1: "new"'],
  intro: 'The key stays; the value is swapped.',
  steps: [['"old" comes back.', 0, 'o0'], ['"new" is stored.', 0, 'o1']],
  result: '"old", {1: "new"}', resultCap: 'Same as BTreeMap::insert on an existing key.',
}, U + 'let mut m = BTreeMap::from([(1, "old")]); let o = if let Entry::Occupied(mut e) = m.entry(1) { e.insert("new") } else { "" }; format!("{:?}, {:?}", o, m)');

add('btree_occupied/into_mut', 'into_mut', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::into_mut works', 'Turns the entry into a &mut to its value.', {
  rows: [['1: [0]']], call: 'e.into_mut().push(1)', note: 'keep the reference', outs: ['1: [0, 1]'],
  intro: 'The entry is consumed; the reference stays tied to the map.',
  steps: [['The entry becomes &mut Vec.', 0], ['1 is pushed.', [], 'o0']],
  result: '{1: [0, 1]}', resultCap: 'or_insert returns the same kind of reference.',
}, U + 'let mut m = BTreeMap::from([(1, vec![0])]); if let Entry::Occupied(e) = m.entry(1) { e.into_mut().push(1); } d(m)');

add('btree_occupied/key', 'key', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::key works', 'The key stored in the map for this entry.', {
  rows: [['entry("id")']], call: 'e.key()', note: 'the stored key', outs: ['&"id"'],
  intro: 'Returns the key as it lives in the map.',
  steps: [['The entry is occupied.', 0], ['key() lends "id".', [], 'o0']],
  result: '"id"', resultCap: 'Useful in logging inside a match.',
}, U + 'let mut m = BTreeMap::from([("id", 1)]); let k = if let Entry::Occupied(e) = m.entry("id") { *e.key() } else { "" }; d(k)');

add('btree_occupied/remove', 'remove', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::remove works', 'Removes the entry and returns its value.', {
  rows: [['1: "tmp"']], call: 'e.remove()', note: 'delete through the entry', outs: ['"tmp"', 'map {}'],
  intro: 'Decide based on the value, then remove, with one lookup.',
  steps: [['The value comes back.', 0, 'o0'], ['The key is gone.', 0, 'o1']],
  result: '"tmp", {}', resultCap: 'remove_entry also returns the key.',
}, U + 'let mut m = BTreeMap::from([(1, "tmp")]); let v = if let Entry::Occupied(e) = m.entry(1) { e.remove() } else { "" }; format!("{:?}, {:?}", v, m)');

add('btree_occupied/remove_entry', 'remove_entry', E('OccupiedEntry'), 'How BTreeMap OccupiedEntry::remove_entry works', 'Removes the entry and returns both the key and the value.', {
  rows: [['"k": 9']], call: 'e.remove_entry()', note: 'get both back', outs: ['("k", 9)'],
  intro: 'Useful when the key is an owned String you want to reuse.',
  steps: [['The entry is removed.', 0], ['("k", 9) is returned.', [], 'o0']],
  result: '("k", 9)', resultCap: 'The map is one entry smaller.',
}, U + 'let mut m = BTreeMap::from([("k", 9)]); let p = if let Entry::Occupied(e) = m.entry("k") { e.remove_entry() } else { ("", 0) }; d(p)');

add('btree_vacant/insert', 'insert', E('VacantEntry'), 'How BTreeMap VacantEntry::insert works', 'Fills the missing key and returns &mut to the new value.', {
  rows: [['entry(5) → Vacant']], call: 'if let Entry::Vacant(e) = m.entry(5) { e.insert("five"); }', note: 'only when absent', outs: ['{5: "five"}'],
  intro: 'Only reached when the key did not exist.',
  steps: [['Key 5 is missing.', 0], ['It is inserted.', [], 'o0']],
  result: '{5: "five"}', resultCap: 'or_insert is the shortcut for this pattern.',
}, U + 'let mut m: BTreeMap<i32, &str> = BTreeMap::new(); if let Entry::Vacant(e) = m.entry(5) { e.insert("five"); } d(m)');

add('btree_vacant/key', 'key', E('VacantEntry'), 'How BTreeMap VacantEntry::key works', 'The key that would be inserted.', {
  rows: [['entry(3) → Vacant']], call: 'e.key()', note: 'not in the map yet', outs: ['&3'],
  intro: 'Look at the key before deciding to insert.',
  steps: [['The entry is vacant.', 0], ['key() gives 3.', [], 'o0']],
  result: '3', resultCap: 'Nothing has been inserted at this point.',
}, U + 'let mut m: BTreeMap<i32, i32> = BTreeMap::new(); let k = if let Entry::Vacant(e) = m.entry(3) { *e.key() } else { 0 }; k.to_string()');

add('btree_vacant/into_key', 'into_key', E('VacantEntry'), 'How BTreeMap VacantEntry::into_key works', 'Gives the key back without inserting.', {
  rows: [['entry(String "k") → Vacant']], call: 'e.into_key()', note: 'changed your mind', outs: ['"k"', 'map {}'],
  intro: 'entry() took ownership of the key; into_key returns it.',
  steps: [['The key comes back.', 0, 'o0'], ['The map is unchanged.', 0, 'o1']],
  result: '"k", {}', resultCap: 'Avoids cloning an expensive key just to look.',
}, U + 'let mut m: BTreeMap<String, i32> = BTreeMap::new(); let k = if let Entry::Vacant(e) = m.entry(String::from("k")) { e.into_key() } else { String::new() }; format!("{:?}, {:?}", k, m)');

add('btree_vacant/insert_entry', 'insert_entry', E('VacantEntry'), 'How BTreeMap VacantEntry::insert_entry works', 'Inserts the value and returns an OccupiedEntry for it.', {
  rows: [['entry(1) → Vacant']], call: 'let e = v.insert_entry(10); e.key()', note: 'keep working with the entry', outs: ['key 1, value 10'],
  intro: 'Unlike insert, you get an entry back instead of a plain reference.',
  steps: [['10 is inserted.', 0], ['The occupied entry knows key and value.', [], 'o0']],
  result: '1, 10', resultCap: 'Handy when you may want to remove it again.',
}, U + 'let mut m: BTreeMap<i32, i32> = BTreeMap::new(); let r = if let Entry::Vacant(v) = m.entry(1) { let e = v.insert_entry(10); format!("{}, {}", e.key(), e.get()) } else { String::new() }; r');

// ---------------------------------------------------------------- BTreeMap, BTreeSet

add('btreemap/get_key_value', 'get_key_value', BM, 'How BTreeMap::get_key_value works', 'The stored key and its value.', {
  rows: [['{"Ann": 31}']], call: 'm.get_key_value("Ann")', note: 'both halves', outs: ['Some(("Ann", 31))'],
  intro: 'Returns the key as stored in the map, not the one you passed.',
  steps: [['"Ann" is found.', 0], ['Some(("Ann", 31)).', [], 'o0']],
  result: 'Some(("Ann", 31))', resultCap: 'Useful when equal keys can still differ (e.g. different capitalisation rules).',
}, 'let m = BTreeMap::from([("Ann", 31)]); d(m.get_key_value("Ann"))');

add('btreemap/iter_mut', 'iter_mut', BM, 'How BTreeMap::iter_mut works', 'Visits every entry in key order with a mutable value.', {
  rows: [['{1: 1, 2: 2}']], call: 'for (k, v) in m.iter_mut() { *v += k; }', note: 'edit all values', outs: ['{1: 2, 2: 4}'],
  intro: 'Keys stay read-only.',
  steps: [['1 + 1 = 2.', 0], ['2 + 2 = 4.', [], 'o0']],
  result: '{1: 2, 2: 4}', resultCap: 'values_mut if you do not need the keys.',
}, 'let mut m = BTreeMap::from([(1, 1), (2, 2)]); for (k, v) in m.iter_mut() { *v += k; } d(m)');

add('btreemap/remove_entry', 'remove_entry', BM, 'How BTreeMap::remove_entry works', 'Removes a key and returns both the stored key and the value.', {
  rows: [['{"x": 1, "y": 2}']], call: 'm.remove_entry("x")', note: 'pair back', outs: ['Some(("x", 1))', '{"y": 2}'],
  intro: 'remove returns only the value.',
  steps: [['"x" is removed.', 0, 'o0'], ['"y" stays.', 0, 'o1']],
  result: 'Some(("x", 1)), {"y": 2}', resultCap: 'None if the key is missing.',
}, 'let mut m = BTreeMap::from([("x", 1), ("y", 2)]); let r = m.remove_entry("x"); format!("{:?}, {:?}", r, m)');

add('btreemap/extract_if', 'extract_if', BM, 'How BTreeMap::extract_if works', 'Removes entries in a key range that pass a test, and gives them to you.', {
  rows: [['{1: "a", 2: "b", 3: "c"}']], call: 'm.extract_if(.., |k, _| k % 2 == 1).collect::<Vec<_>>()', note: 'split a sorted map', outs: ['taken [(1, "a"), (3, "c")]', 'left {2: "b"}'],
  intro: 'The range (.. means all) limits which keys are looked at.',
  steps: [['Keys 1 and 3 pass: moved out, in order.', 0, 'o0'], ['Key 2 stays.', 0, 'o1']],
  result: '[(1, "a"), (3, "c")], {2: "b"}', resultCap: 'retain keeps the passing entries instead.',
}, 'let mut m = BTreeMap::from([(1, "a"), (2, "b"), (3, "c")]); let t: Vec<_> = m.extract_if(.., |k, _| k % 2 == 1).collect(); format!("{:?}, {:?}", t, m)');

add('btreeset/clear', 'clear', BS, 'How BTreeSet::clear works', 'Removes every value.', {
  rows: [['{1, 2, 3}']], call: 's.clear()', note: 'empty it', outs: ['{}'],
  intro: 'All values are dropped.',
  steps: [['Three values go.', 0], ['The set is empty.', [], 'o0']],
  result: '{}', resultCap: 'Same as s = BTreeSet::new().',
}, 'let mut s = BTreeSet::from([1, 2, 3]); s.clear(); d(s)');

add('btreeset/get', 'get', BS, 'How BTreeSet::get works', 'A reference to the stored value equal to the one given.', {
  rows: [['{"apple"}']], call: 's.get("apple")', note: 'fetch the stored value', outs: ['Some("apple")'],
  intro: 'contains says yes or no; get returns the element.',
  steps: [['"apple" is in the set.', 0], ['Some("apple").', [], 'o0']],
  result: 'Some("apple")', resultCap: 'None if absent.',
}, 'let s = BTreeSet::from([String::from("apple")]); d(s.get("apple"))');

add('btreeset/is_disjoint', 'is_disjoint', BS, 'How BTreeSet::is_disjoint works', 'true if the two sets have nothing in common.', {
  rows: [['{1, 2}', '{3, 4}']], call: 'a.is_disjoint(&b)', note: 'no shared values', outs: ['true'],
  intro: 'Disjoint means the intersection is empty.',
  steps: [['No value appears in both.', [0, 1]], ['true.', [], 'o0']],
  result: 'true', resultCap: 'Check schedules or ID ranges for overlaps.',
}, 'BTreeSet::from([1, 2]).is_disjoint(&BTreeSet::from([3, 4])).to_string()');

add('btreeset/is_superset', 'is_superset', BS, 'How BTreeSet::is_superset works', 'true if this set contains every value of the other.', {
  rows: [['{1, 2, 3}', '{2, 3}']], call: 'a.is_superset(&b)', note: 'A ⊇ B', outs: ['true'],
  intro: 'Every element of b must be in a.',
  steps: [['2 and 3 are in a.', [0, 1]], ['true.', [], 'o0']],
  result: 'true', resultCap: 'is_subset is the reverse question.',
}, 'BTreeSet::from([1, 2, 3]).is_superset(&BTreeSet::from([2, 3])).to_string()');

add('btreeset/replace', 'replace', BS, 'How BTreeSet::replace works', 'Inserts a value, replacing an equal one, and returns the old one.', {
  rows: [['{5}'], ['5 again', '6']], call: 's.replace(5)', note: 'swap equal values', outs: ['Some(5)', 'None'],
  intro: 'insert keeps the old element; replace swaps it out.',
  steps: [['5 existed: the old 5 is returned.', 'b0', 'o0'], ['6 is new: None.', 'b1', 'o1']],
  result: 'Some(5), None', resultCap: 'Matters when equal values still carry different data.',
}, 'let mut s = BTreeSet::from([5]); format!("{:?}, {:?}", s.replace(5), s.replace(6))');

add('btreeset/take', 'take', BS, 'How BTreeSet::take works', 'Removes a value and returns it.', {
  rows: [['{"a", "b"}']], call: 's.take("a")', note: 'remove and get back', outs: ['Some("a")', '{"b"}'],
  intro: 'remove returns a bool; take returns the owned value.',
  steps: [['"a" comes out.', 0, 'o0'], ['"b" stays.', 0, 'o1']],
  result: 'Some("a"), {"b"}', resultCap: 'None if the value was not there.',
}, 'let mut s = BTreeSet::from([String::from("a"), String::from("b")]); let t = s.take("a"); format!("{:?}, {:?}", t, s)');

add('btreeset/extract_if', 'extract_if', BS, 'How BTreeSet::extract_if works', 'Removes values in a range that pass a test, and gives them to you.', {
  rows: [['{1, 2, 3, 4}']], call: 's.extract_if(.., |x| x % 2 == 0).collect::<Vec<_>>()', note: 'split a sorted set', outs: ['taken [2, 4]', 'left {1, 3}'],
  intro: 'The removed values come out in sorted order.',
  steps: [['2 and 4 pass.', 0, 'o0'], ['1 and 3 stay.', 0, 'o1']],
  result: '[2, 4], {1, 3}', resultCap: 'retain keeps the passing values instead.',
}, 'let mut s = BTreeSet::from([1, 2, 3, 4]); let t: Vec<_> = s.extract_if(.., |x| x % 2 == 0).collect(); format!("{:?}, {:?}", t, s)');

// ---------------------------------------------------------------- HashMap / HashSet extras

add('hash_occupied/key', 'key', HM('OccupiedEntry'), 'How HashMap OccupiedEntry::key works', 'The key stored for this entry.', {
  rows: [['entry("id") → Occupied']], call: 'e.key()', note: 'the stored key', outs: ['&"id"'],
  intro: 'Available inside a match on the entry.',
  steps: [['The entry exists.', 0], ['key() lends "id".', [], 'o0']],
  result: '"id"', resultCap: 'Same idea as the BTreeMap version.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("id", 1)]); let k = if let Entry::Occupied(e) = m.entry("id") { *e.key() } else { "" }; d(k)');

add('hash_occupied/remove_entry', 'remove_entry', HM('OccupiedEntry'), 'How HashMap OccupiedEntry::remove_entry works', 'Removes the entry and returns the key and the value.', {
  rows: [['"k": 2']], call: 'e.remove_entry()', note: 'both back', outs: ['("k", 2)'],
  intro: 'One lookup, then removal.',
  steps: [['The entry is removed.', 0], ['("k", 2).', [], 'o0']],
  result: '("k", 2)', resultCap: 'remove() returns only the value.',
}, 'use std::collections::hash_map::Entry; let mut m = HashMap::from([("k", 2)]); let p = if let Entry::Occupied(e) = m.entry("k") { e.remove_entry() } else { ("", 0) }; d(p)');

add('hash_vacant/key', 'key', HM('VacantEntry'), 'How HashMap VacantEntry::key works', 'The key that would be inserted.', {
  rows: [['entry("new") → Vacant']], call: 'e.key()', note: 'not inserted yet', outs: ['&"new"'],
  intro: 'Look at it before inserting.',
  steps: [['The entry is vacant.', 0], ['key() lends "new".', [], 'o0']],
  result: '"new"', resultCap: 'into_key gives it back without inserting.',
}, 'use std::collections::hash_map::Entry; let mut m: HashMap<&str, i32> = HashMap::new(); let k = if let Entry::Vacant(e) = m.entry("new") { *e.key() } else { "" }; d(k)');

add('hash_vacant/insert_entry', 'insert_entry', HM('VacantEntry'), 'How HashMap VacantEntry::insert_entry works', 'Inserts and returns an OccupiedEntry for the new value.', {
  rows: [['entry("a") → Vacant']], call: 'v.insert_entry(1)', note: 'continue with the entry', outs: ['key "a", value 1'],
  intro: 'You get an entry back, not just a reference.',
  steps: [['1 is inserted.', 0], ['The entry reports key and value.', [], 'o0']],
  result: '"a", 1', resultCap: 'Same as Entry::insert_entry on a vacant entry.',
}, 'use std::collections::hash_map::Entry; let mut m: HashMap<&str, i32> = HashMap::new(); let r = if let Entry::Vacant(v) = m.entry("a") { let e = v.insert_entry(1); format!("{:?}, {}", e.key(), e.get()) } else { String::new() }; r');

add('hashmap/shrink_to', 'shrink_to', HM('HashMap'), 'How HashMap::shrink_to works', 'Reduces the capacity, but not below a minimum.', {
  rows: [['1 entry, capacity 1000']], call: 'm.shrink_to(10)', note: 'keep some headroom', outs: ['capacity ≥ 10, < 1000'],
  intro: 'shrink_to_fit goes as low as possible; shrink_to keeps a floor.',
  steps: [['Most of the room is unused.', 0], ['It shrinks, keeping room for 10.', [], 'o0']],
  result: 'true', resultCap: 'Capacity never drops below len.',
}, 'let mut m: HashMap<i32, i32> = HashMap::with_capacity(1000); m.insert(1, 1); m.shrink_to(10); (m.capacity() >= 10 && m.capacity() < 1000).to_string()');

add('hashmap/try_reserve', 'try_reserve', HM('HashMap'), 'How HashMap::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['reserve 10', 'reserve usize::MAX']], call: 'm.try_reserve(n)', note: 'handle out-of-memory', outs: ['Ok', 'Err'],
  intro: 'reserve would abort the program on an impossible size.',
  steps: [['10: fine.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Useful for servers handling untrusted sizes.',
}, 'let mut m: HashMap<u64, u64> = HashMap::new(); let a = m.try_reserve(10).is_ok(); let b = m.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('hashmap/with_hasher', 'with_hasher', HM('HashMap'), 'How HashMap::with_hasher works', 'An empty map that uses the hashing algorithm you give it.', {
  rows: [['BuildHasherDefault<DefaultHasher>']], call: 'HashMap::with_hasher(BuildHasherDefault::<DefaultHasher>::default())', note: 'pluggable hashing', outs: ['works like any map'],
  intro: 'The default hasher resists attacks; faster hashers can be plugged in for trusted data.',
  steps: [['The hasher factory is stored.', 0], ['Insert and get work as usual.', [], 'o0']],
  result: 'Some(1)', resultCap: 'Crates like ahash or rustc-hash provide faster hashers.',
}, 'let mut m: HashMap<&str, i32, std::hash::BuildHasherDefault<std::collections::hash_map::DefaultHasher>> = HashMap::with_hasher(Default::default()); m.insert("a", 1); d(m.get("a").copied())');

add('hashmap/hasher', 'hasher', HM('HashMap'), 'How HashMap::hasher works', 'The hasher factory the map uses.', {
  rows: [['map with RandomState']], call: 'm.hasher().hash_one("key")', note: 'hash like the map does', outs: ['same hash as the map uses'],
  intro: 'Lets you compute hashes that match the map\'s own.',
  steps: [['Get the map\'s BuildHasher.', 0], ['Hashing the same key twice gives the same number.', [], 'o0']],
  result: 'true', resultCap: 'Each RandomState has its own random keys.',
}, 'use std::hash::BuildHasher; let m: HashMap<&str, i32> = HashMap::new(); (m.hasher().hash_one("key") == m.hasher().hash_one("key")).to_string()');

add('hashmap/with_capacity_and_hasher', 'with_capacity_and_hasher', HM('HashMap'), 'How HashMap::with_capacity_and_hasher works', 'An empty map with reserved room and a chosen hasher.', {
  rows: [['capacity 50', 'RandomState']], call: 'HashMap::with_capacity_and_hasher(50, RandomState::new())', note: 'both settings at once', outs: ['capacity ≥ 50'],
  intro: 'Combines with_capacity and with_hasher.',
  steps: [['Room for 50 entries.', 0], ['Using the given hasher.', 1, 'o0']],
  result: 'true', resultCap: 'Mostly used with custom hashers.',
}, 'let m: HashMap<i32, i32> = HashMap::with_capacity_and_hasher(50, std::hash::RandomState::new()); (m.capacity() >= 50).to_string()');

add('hashset/with_capacity', 'with_capacity', HS, 'How HashSet::with_capacity works', 'An empty set with room for n values.', {
  rows: [['with_capacity(100)']], call: 'HashSet::with_capacity(100)', note: 'avoid rehashing', outs: ['room ≥ 100'],
  intro: 'Growing a set means rehashing everything; reserve room up front.',
  steps: [['Room for 100.', 0], ['Still empty.', [], 'o0']],
  result: 'len = 0, room: true', resultCap: 'Same idea as Vec::with_capacity.',
}, 'let s: HashSet<i32> = HashSet::with_capacity(100); format!("len = {}, room: {}", s.len(), s.capacity() >= 100)');

add('hashset/capacity', 'capacity', HS, 'How HashSet::capacity works', 'How many values fit before the set must grow.', {
  rows: [['3 values']], call: 's.capacity()', note: 'always ≥ len', outs: ['≥ 3'],
  intro: 'The set keeps spare room so inserts stay fast.',
  steps: [['3 values stored.', 0], ['Capacity is at least 3.', [], 'o0']],
  result: 'true', resultCap: 'The exact number is an implementation detail.',
}, 'let s = HashSet::from([1, 2, 3]); (s.capacity() >= 3).to_string()');

add('hashset/reserve', 'reserve', HS, 'How HashSet::reserve works', 'Makes room for at least n more values.', {
  rows: [['empty set']], call: 's.reserve(64)', note: 'before a bulk insert', outs: ['capacity ≥ 64'],
  intro: 'One growth step now instead of several later.',
  steps: [['Room for 64 is requested.', 0], ['Capacity is at least 64.', [], 'o0']],
  result: 'true', resultCap: 'try_reserve reports failure instead of aborting.',
}, 'let mut s: HashSet<i32> = HashSet::new(); s.reserve(64); (s.capacity() >= 64).to_string()');

add('hashset/shrink_to_fit', 'shrink_to_fit', HS, 'How HashSet::shrink_to_fit works', 'Releases spare room.', {
  rows: [['1 value, capacity 1000']], call: 's.shrink_to_fit()', note: 'give memory back', outs: ['small capacity'],
  intro: 'Removing values never shrinks a set by itself.',
  steps: [['Most room is unused.', 0], ['It is released.', [], 'o0']],
  result: 'true', resultCap: 'shrink_to keeps a minimum.',
}, 'let mut s: HashSet<i32> = HashSet::with_capacity(1000); s.insert(1); s.shrink_to_fit(); (s.capacity() < 1000).to_string()');

add('hashset/shrink_to', 'shrink_to', HS, 'How HashSet::shrink_to works', 'Reduces capacity, but not below a minimum.', {
  rows: [['1 value, capacity 1000']], call: 's.shrink_to(20)', note: 'keep headroom', outs: ['20 ≤ capacity < 1000'],
  intro: 'Like shrink_to_fit with a floor.',
  steps: [['Room is released...', 0], ['...keeping at least 20.', [], 'o0']],
  result: 'true', resultCap: 'Never below len.',
}, 'let mut s: HashSet<i32> = HashSet::with_capacity(1000); s.insert(1); s.shrink_to(20); (s.capacity() >= 20 && s.capacity() < 1000).to_string()');

add('hashset/try_reserve', 'try_reserve', HS, 'How HashSet::try_reserve works', 'Reserves room, returning an error instead of aborting.', {
  rows: [['10', 'usize::MAX']], call: 's.try_reserve(n)', note: 'recoverable', outs: ['Ok', 'Err'],
  intro: 'An impossible request becomes an Err.',
  steps: [['10: Ok.', 0, 'o0'], ['usize::MAX: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Same as HashMap::try_reserve.',
}, 'let mut s: HashSet<u64> = HashSet::new(); let a = s.try_reserve(10).is_ok(); let b = s.try_reserve(usize::MAX).is_ok(); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Ok" } else { "Err" })');

add('hashset/with_hasher', 'with_hasher', HS, 'How HashSet::with_hasher works', 'An empty set using a hashing algorithm you choose.', {
  rows: [['RandomState::new()']], call: 'HashSet::with_hasher(RandomState::new())', note: 'pluggable hashing', outs: ['works like any set'],
  intro: 'Plug in a faster hasher for trusted data.',
  steps: [['The hasher is stored.', 0], ['insert and contains work as usual.', [], 'o0']],
  result: 'true', resultCap: 'with_capacity_and_hasher also reserves room.',
}, 'let mut s = HashSet::with_hasher(std::hash::RandomState::new()); s.insert(1); s.contains(&1).to_string()');

add('hashset/hasher', 'hasher', HS, 'How HashSet::hasher works', 'The hasher factory the set uses.', {
  rows: [['set with RandomState']], call: 's.hasher().hash_one(&x)', note: 'hash like the set does', outs: ['consistent hashes'],
  intro: 'The same value always hashes the same within one set.',
  steps: [['Get the BuildHasher.', 0], ['Two hashes of 7 match.', [], 'o0']],
  result: 'true', resultCap: 'Rarely needed outside custom data structures.',
}, 'use std::hash::BuildHasher; let s: HashSet<i32> = HashSet::new(); (s.hasher().hash_one(7) == s.hasher().hash_one(7)).to_string()');

add('hashset/with_capacity_and_hasher', 'with_capacity_and_hasher', HS, 'How HashSet::with_capacity_and_hasher works', 'An empty set with reserved room and a chosen hasher.', {
  rows: [['capacity 8', 'RandomState']], call: 'HashSet::with_capacity_and_hasher(8, RandomState::new())', note: 'both settings', outs: ['capacity ≥ 8'],
  intro: 'Combines with_capacity and with_hasher.',
  steps: [['Room for 8.', 0], ['The given hasher.', 1, 'o0']],
  result: 'true', resultCap: 'Mostly used with custom hashers.',
}, 'let s: HashSet<i32> = HashSet::with_capacity_and_hasher(8, std::hash::RandomState::new()); (s.capacity() >= 8).to_string()');

module.exports = list;
