// Rust standard library: the rest of BTreeMap and BTreeSet (sorted collections).
const { group } = require('./kit.cjs');
const MAP = ['alloc', 'BTreeMap', /btree\/map\.rs$/];
const SET = ['alloc', 'BTreeSet', /btree\/set\.rs$/];
const { list, add } = group({ at: MAP });
const pair = (a, b) => [[a, b]];

// ---------------------------------------------------------------- BTreeMap

add('btreemap/new', 'new', null, 'How BTreeMap::new works', 'An empty map that keeps its keys sorted.', {
  rows: [['insert 3, 1, 2']], call: 'm.insert(3, "c"); m.insert(1, "a"); m.insert(2, "b");', note: 'always in key order', outs: ['{1: "a", 2: "b", 3: "c"}'],
  intro: 'Whatever the insertion order, iteration goes from the smallest key up.',
  steps: [['The keys arrive as 3, 1, 2.', 0], ['The map stores them sorted.', [], 'o0']],
  result: '{1: "a", 2: "b", 3: "c"}', resultCap: 'Pick BTreeMap when you need ordered output or range queries; HashMap is usually faster otherwise.',
}, 'let mut m = BTreeMap::new(); m.insert(3, "c"); m.insert(1, "a"); m.insert(2, "b"); d(m)');

add('btreemap/remove', 'remove', null, 'How BTreeMap::remove works', 'Removes a key and returns its value.', {
  rows: [['{1: "a", 2: "b"}']], call: 'm.remove(&1)', note: 'Some(value) or None', outs: ['Some("a")', '{2: "b"}'],
  intro: 'The remaining keys stay sorted.',
  steps: [['Key 1 is found; "a" is returned.', 0, 'o0'], ['The map now holds only 2.', 0, 'o1']],
  result: 'Some("a"), {2: "b"}', resultCap: 'Removing a missing key returns None and changes nothing.',
}, 'let mut m = BTreeMap::from([(1, "a"), (2, "b")]); let r = m.remove(&1); format!("{:?}, {:?}", r, m)');

add('btreemap/contains_key', 'contains_key', null, 'How BTreeMap::contains_key works', 'true if the key is in the map.', {
  rows: [['{"a": 1, "c": 3}']], call: 'm.contains_key("b")', note: 'a quick yes/no', outs: ['"a": true', '"b": false'],
  intro: 'A lookup in a sorted tree: about log₂(n) comparisons.',
  steps: [['"a" is present.', 0, 'o0'], ['"b" is not.', 0, 'o1']],
  result: 'true, false', resultCap: 'Use get when you also need the value.',
}, 'let m = BTreeMap::from([("a", 1), ("c", 3)]); format!("{}, {}", m.contains_key("a"), m.contains_key("b"))');

add('btreemap/keys', 'keys', null, 'How BTreeMap::keys works', 'The keys, in sorted order.', {
  rows: [['{"pear": 1, "apple": 2}']], call: 'm.keys().collect::<Vec<_>>()', note: 'sorted', outs: ['["apple", "pear"]'],
  intro: 'keys() walks the tree from smallest to largest.',
  steps: [['"apple" < "pear".', 0], ['They come out in order.', [], 'o0']],
  result: '["apple", "pear"]', resultCap: 'Sorted keys for free: a big reason to choose a BTreeMap.',
}, 'let m = BTreeMap::from([("pear", 1), ("apple", 2)]); d(m.keys().collect::<Vec<_>>())');

add('btreemap/values', 'values', null, 'How BTreeMap::values works', 'The values, in the order of their keys.', {
  rows: [['{2: "two", 1: "one"}']], call: 'm.values().collect::<Vec<_>>()', note: 'ordered by key', outs: ['["one", "two"]'],
  intro: 'Values follow the sorted keys, not insertion order.',
  steps: [['Key 1 comes first.', 0], ['So "one" comes before "two".', [], 'o0']],
  result: '["one", "two"]', resultCap: 'values_mut lets you change them.',
}, 'let m = BTreeMap::from([(2, "two"), (1, "one")]); d(m.values().collect::<Vec<_>>())');

add('btreemap/iter', 'iter', null, 'How BTreeMap::iter works', '(key, value) pairs, sorted by key.', {
  rows: [['{"b": 2, "a": 1}']], call: 'for (k, v) in &m { ... }', note: 'ordered pairs', outs: ['("a", 1)', '("b", 2)'],
  intro: 'Iteration is always ascending by key.',
  steps: [['("a", 1) first.', 0, 'o0'], ['Then ("b", 2).', 0, 'o1']],
  result: '("a", 1), ("b", 2)', resultCap: 'iter().rev() goes from the largest key down.',
}, 'let m = BTreeMap::from([("b", 2), ("a", 1)]); jd(m.iter())');

add('btreemap/len', 'len', null, 'How BTreeMap::len works', 'The number of entries.', {
  rows: [['{1: "a", 2: "b", 3: "c"}']], call: 'm.len()', note: 'entries, not bytes', outs: ['3'],
  intro: 'len is stored, so it costs nothing to ask.',
  steps: [['Three keys.', 0], ['len is 3.', [], 'o0']],
  result: '3', resultCap: 'is_empty is len() == 0.',
}, 'let m = BTreeMap::from([(1, "a"), (2, "b"), (3, "c")]); m.len().to_string()');

add('btreemap/is_empty', 'is_empty', null, 'How BTreeMap::is_empty works', 'true if the map has no entries.', {
  rows: [['{}', '{1: 1}']], call: 'm.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'A quick emptiness check.',
  steps: [['Empty: true.', 0, 'o0'], ['One entry: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'All std collections have is_empty.',
}, 'let a: BTreeMap<i32, i32> = BTreeMap::new(); let b = BTreeMap::from([(1, 1)]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('btreemap/get_mut', 'get_mut', null, 'How BTreeMap::get_mut works', 'A mutable reference to the value for a key.', {
  rows: [['{"score": 10}']], call: 'if let Some(s) = m.get_mut("score") { *s += 5; }', note: 'edit in place', outs: ['{"score": 15}'],
  intro: 'get_mut returns None if the key is missing.',
  steps: [['The value 10 is lent mutably.', 0], ['It becomes 15.', [], 'o0']],
  result: '{"score": 15}', resultCap: 'entry() combines lookup and insertion.',
}, 'let mut m = BTreeMap::from([("score", 10)]); if let Some(s) = m.get_mut("score") { *s += 5; } d(m)');

add('btreemap/first_entry', 'first_entry', null, 'How BTreeMap::first_entry works', 'The entry with the smallest key, to read, change or remove.', {
  rows: [['{1: "a", 5: "e"}']], call: 'm.first_entry().map(|e| e.remove())', note: 'work on the minimum', outs: ['Some("a")', '{5: "e"}'],
  intro: 'first_entry gives an OccupiedEntry for the smallest key.',
  steps: [['The smallest key is 1.', 0], ['Its entry is removed; "a" is returned.', [], 'o0,1']],
  result: 'Some("a"), {5: "e"}', resultCap: 'pop_first does exactly this in one call.',
}, 'let mut m = BTreeMap::from([(1, "a"), (5, "e")]); let r = m.first_entry().map(|e| e.remove()); format!("{:?}, {:?}", r, m)');

add('btreemap/last_entry', 'last_entry', null, 'How BTreeMap::last_entry works', 'The entry with the largest key.', {
  rows: [['{1: 10, 9: 90}']], call: 'if let Some(mut e) = m.last_entry() { *e.get_mut() += 1; }', note: 'work on the maximum', outs: ['{1: 10, 9: 91}'],
  intro: 'Change the value of the largest key in place.',
  steps: [['The largest key is 9.', 0], ['Its value becomes 91.', [], 'o0']],
  result: '{1: 10, 9: 91}', resultCap: 'Returns None for an empty map.',
}, 'let mut m = BTreeMap::from([(1, 10), (9, 90)]); if let Some(mut e) = m.last_entry() { *e.get_mut() += 1; } d(m)');

add('btreemap/pop_last', 'pop_last', null, 'How BTreeMap::pop_last works', 'Removes and returns the entry with the largest key.', {
  rows: [['{1: "a", 3: "c"}']], call: 'm.pop_last()', note: 'take the maximum', outs: ['Some((3, "c"))', '{1: "a"}'],
  intro: 'Repeated pop_last processes keys from largest to smallest.',
  steps: [['Key 3 is the largest.', 0], ['It is removed and returned.', [], 'o0,1']],
  result: 'Some((3, "c")), {1: "a"}', resultCap: 'pop_first takes the smallest.',
}, 'let mut m = BTreeMap::from([(1, "a"), (3, "c")]); let r = m.pop_last(); format!("{:?}, {:?}", r, m)');

add('btreemap/retain', 'retain', null, 'How BTreeMap::retain works', 'Keeps only the entries that pass a test.', {
  rows: [['{1: 10, 2: 25, 3: 5}']], call: 'm.retain(|_, v| *v >= 10)', note: 'filter in place', outs: ['{1: 10, 2: 25}'],
  intro: 'The closure sees each key and value; false removes the entry.',
  steps: [['10 and 25 pass.', 0], ['5 fails and is removed.', [], 'o0']],
  result: '{1: 10, 2: 25}', resultCap: 'The order of the remaining keys is unchanged.',
}, 'let mut m = BTreeMap::from([(1, 10), (2, 25), (3, 5)]); m.retain(|_, v| *v >= 10); d(m)');

add('btreemap/append', 'append', null, 'How BTreeMap::append works', 'Moves every entry of another map into this one.', {
  rows: [['a = {1: "x"}'], ['b = {1: "y", 2: "z"}']], call: 'a.append(&mut b)', note: 'b ends up empty', outs: ['a = {1: "y", 2: "z"}', 'b = {}'],
  intro: 'On equal keys, the value from b wins.',
  steps: [['Key 1: "y" replaces "x".', ['a0', 'b0']], ['Key 2 is moved over; b is now empty.', [], 'o0,1']],
  result: 'a = {1: "y", 2: "z"}, b = {}', resultCap: 'Faster than a loop of inserts when the maps are large.',
}, 'let mut a = BTreeMap::from([(1, "x")]); let mut b = BTreeMap::from([(1, "y"), (2, "z")]); a.append(&mut b); format!("a = {:?}, b = {:?}", a, b)');

add('btreemap/range_mut', 'range_mut', null, 'How BTreeMap::range_mut works', 'Mutable access to the values whose keys lie in a range.', {
  rows: [['{1: 0, 2: 0, 3: 0, 4: 0}']], call: 'for (_, v) in m.range_mut(2..=3) { *v = 9; }', note: 'edit a slice of keys', outs: ['{1: 0, 2: 9, 3: 9, 4: 0}'],
  intro: 'Only the keys from 2 to 3 are visited.',
  steps: [['Keys 2 and 3 are in range.', 0], ['Their values become 9.', [], 'o0']],
  result: '{1: 0, 2: 9, 3: 9, 4: 0}', resultCap: 'range() is the read-only version.',
}, 'let mut m = BTreeMap::from([(1, 0), (2, 0), (3, 0), (4, 0)]); for (_, v) in m.range_mut(2..=3) { *v = 9; } d(m)');

add('btreemap/values_mut', 'values_mut', null, 'How BTreeMap::values_mut works', 'Mutable references to every value, in key order.', {
  rows: [['{"a": 1, "b": 2}']], call: 'for v in m.values_mut() { *v *= 100; }', note: 'edit all values', outs: ['{"a": 100, "b": 200}'],
  intro: 'Keys cannot change; values can.',
  steps: [['Each value is lent.', 0], ['Each is multiplied by 100.', [], 'o0']],
  result: '{"a": 100, "b": 200}', resultCap: 'iter_mut also gives the keys.',
}, 'let mut m = BTreeMap::from([("a", 1), ("b", 2)]); for v in m.values_mut() { *v *= 100; } d(m)');

add('btreemap/into_keys', 'into_keys', null, 'How BTreeMap::into_keys works', 'Consumes the map and yields its keys in order.', {
  rows: [['{3: "c", 1: "a"}']], call: 'm.into_keys().collect::<Vec<_>>()', note: 'sorted keys, owned', outs: ['[1, 3]'],
  intro: 'The values are dropped.',
  steps: [['The map is consumed.', 0], ['Keys come out sorted.', [], 'o0']],
  result: '[1, 3]', resultCap: 'into_values yields the values instead.',
}, 'let m = BTreeMap::from([(3, "c"), (1, "a")]); d(m.into_keys().collect::<Vec<_>>())');

add('btreemap/into_values', 'into_values', null, 'How BTreeMap::into_values works', 'Consumes the map and yields its values in key order.', {
  rows: [['{2: "b", 1: "a"}']], call: 'm.into_values().collect::<Vec<_>>()', note: 'owned values', outs: ['["a", "b"]'],
  intro: 'The keys are dropped; order follows the keys.',
  steps: [['Key 1 first, then 2.', 0], ['Values "a", "b".', [], 'o0']],
  result: '["a", "b"]', resultCap: 'values() only borrows.',
}, 'let m = BTreeMap::from([(2, "b"), (1, "a")]); d(m.into_values().collect::<Vec<_>>())');

add('btreemap/clear', 'clear', null, 'How BTreeMap::clear works', 'Removes every entry.', {
  rows: [['{1: "a", 2: "b"}']], call: 'm.clear()', note: 'empty it', outs: ['{}'],
  intro: 'All keys and values are dropped.',
  steps: [['Both entries go.', 0], ['The map is empty.', [], 'o0']],
  result: '{}', resultCap: 'Same as m = BTreeMap::new().',
}, 'let mut m = BTreeMap::from([(1, "a"), (2, "b")]); m.clear(); d(m)');

// ---------------------------------------------------------------- BTreeSet

add('btreeset/new', 'new', SET, 'How BTreeSet::new works', 'An empty set that keeps its values sorted.', {
  rows: [['insert 5, 1, 3, 1']], call: 'let mut s = BTreeSet::new(); for x in [5, 1, 3, 1] { s.insert(x); }', note: 'unique and sorted', outs: ['{1, 3, 5}'],
  intro: 'Duplicates are ignored and the order is always ascending.',
  steps: [['5, 1, 3 and another 1 arrive.', 0], ['The set holds 1, 3, 5.', [], 'o0']],
  result: '{1, 3, 5}', resultCap: 'Sorted unique values with one call: v.into_iter().collect::<BTreeSet<_>>().',
}, 'let mut s = BTreeSet::new(); for x in [5, 1, 3, 1] { s.insert(x); } d(s)');

add('btreeset/contains', 'contains', SET, 'How BTreeSet::contains works', 'true if the value is in the set.', {
  rows: [['{2, 4, 6}']], call: 's.contains(&4)', note: 'membership', outs: ['4: true', '5: false'],
  intro: 'A tree search: fast even for large sets.',
  steps: [['4 is present.', 0, 'o0'], ['5 is not.', 0, 'o1']],
  result: 'true, false', resultCap: 'HashSet::contains is usually faster but unordered.',
}, 'let s = BTreeSet::from([2, 4, 6]); format!("{}, {}", s.contains(&4), s.contains(&5))');

add('btreeset/remove', 'remove', SET, 'How BTreeSet::remove works', 'Removes a value; true if it was there.', {
  rows: [['{1, 2, 3}']], call: 's.remove(&2)', note: 'returns a bool', outs: ['true', '{1, 3}'],
  intro: 'Removing a missing value returns false.',
  steps: [['2 was present: true.', 0, 'o0'], ['The set is now {1, 3}.', 0, 'o1']],
  result: 'true, {1, 3}', resultCap: 'take() returns the removed value itself.',
}, 'let mut s = BTreeSet::from([1, 2, 3]); let r = s.remove(&2); format!("{}, {:?}", r, s)');

add('btreeset/iter', 'iter', SET, 'How BTreeSet::iter works', 'The values in ascending order.', {
  rows: [['{"b", "a", "c"}']], call: 's.iter().collect::<Vec<_>>()', note: 'sorted', outs: ['["a", "b", "c"]'],
  intro: 'Iteration always goes from smallest to largest.',
  steps: [['The tree is walked in order.', 0], ['"a", "b", "c".', [], 'o0']],
  result: '["a", "b", "c"]', resultCap: 'iter().rev() goes from largest to smallest.',
}, 'let s = BTreeSet::from(["b", "a", "c"]); d(s.iter().collect::<Vec<_>>())');

add('btreeset/len', 'len', SET, 'How BTreeSet::len works', 'The number of distinct values.', {
  rows: [['from [1, 1, 2]']], call: 's.len()', note: 'duplicates once', outs: ['2'],
  intro: 'The duplicate 1 is stored only once.',
  steps: [['Values 1 and 2.', 0], ['len is 2.', [], 'o0']],
  result: '2', resultCap: 'is_empty is len() == 0.',
}, 'let s: BTreeSet<i32> = [1, 1, 2].into_iter().collect(); s.len().to_string()');

add('btreeset/is_empty', 'is_empty', SET, 'How BTreeSet::is_empty works', 'true if the set has no values.', {
  rows: [['{}', '{7}']], call: 's.is_empty()', note: 'len() == 0', outs: ['true', 'false'],
  intro: 'A quick emptiness check.',
  steps: [['Empty: true.', 0, 'o0'], ['One value: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Typical loop: while let Some(x) = s.pop_first() { ... }.',
}, 'let a: BTreeSet<i32> = BTreeSet::new(); let b = BTreeSet::from([7]); format!("{}, {}", a.is_empty(), b.is_empty())');

add('btreeset/last', 'last', SET, 'How BTreeSet::last works', 'The largest value.', {
  rows: [['{3, 9, 4}']], call: 's.last()', note: 'the maximum', outs: ['Some(9)'],
  intro: 'In a sorted set, the maximum is at the end.',
  steps: [['Sorted: 3, 4, 9.', 0], ['The last is 9.', [], 'o0']],
  result: 'Some(9)', resultCap: 'first() gives the minimum.',
}, 'let s = BTreeSet::from([3, 9, 4]); d(s.last())');

add('btreeset/pop_first', 'pop_first', SET, 'How BTreeSet::pop_first works', 'Removes and returns the smallest value.', {
  rows: [['{4, 1, 7}']], call: 's.pop_first()', note: 'like a priority queue', outs: ['Some(1)', '{4, 7}'],
  intro: 'A BTreeSet can act as a sorted work queue without duplicates.',
  steps: [['The smallest value is 1.', 0], ['It is removed and returned.', [], 'o0,1']],
  result: 'Some(1), {4, 7}', resultCap: 'pop_last takes the largest.',
}, 'let mut s = BTreeSet::from([4, 1, 7]); let r = s.pop_first(); format!("{:?}, {:?}", r, s)');

add('btreeset/pop_last', 'pop_last', SET, 'How BTreeSet::pop_last works', 'Removes and returns the largest value.', {
  rows: [['{4, 1, 7}']], call: 's.pop_last()', note: 'take the maximum', outs: ['Some(7)', '{1, 4}'],
  intro: 'Repeated pop_last visits values from largest to smallest.',
  steps: [['The largest value is 7.', 0], ['It is removed and returned.', [], 'o0,1']],
  result: 'Some(7), {1, 4}', resultCap: 'Returns None when the set is empty.',
}, 'let mut s = BTreeSet::from([4, 1, 7]); let r = s.pop_last(); format!("{:?}, {:?}", r, s)');

add('btreeset/union', 'union', SET, 'How BTreeSet::union works', 'Every value in either set, in sorted order.', {
  rows: [['{1, 3}', '{2, 3}']], call: 'a.union(&b).collect::<Vec<_>>()', note: 'A ∪ B', outs: ['[1, 2, 3]'],
  intro: 'Values in both sets appear once.',
  steps: [['1 and 3 from a, 2 from b; 3 only once.', [0, 1]], ['Sorted: [1, 2, 3].', [], 'o0']],
  result: '[1, 2, 3]', resultCap: '&a | &b builds the union as a new BTreeSet.',
}, 'let a = BTreeSet::from([1, 3]); let b = BTreeSet::from([2, 3]); d(a.union(&b).collect::<Vec<_>>())');

add('btreeset/intersection', 'intersection', SET, 'How BTreeSet::intersection works', 'The values that are in both sets.', {
  rows: [['{1, 2, 3}', '{2, 3, 4}']], call: 'a.intersection(&b).collect::<Vec<_>>()', note: 'A ∩ B', outs: ['[2, 3]'],
  intro: 'Only shared values remain.',
  steps: [['2 and 3 are in both.', [0, 1]], ['Result: [2, 3].', [], 'o0']],
  result: '[2, 3]', resultCap: '&a & &b gives a new set.',
}, 'let a = BTreeSet::from([1, 2, 3]); let b = BTreeSet::from([2, 3, 4]); d(a.intersection(&b).collect::<Vec<_>>())');

add('btreeset/difference', 'difference', SET, 'How BTreeSet::difference works', 'The values in this set that are not in the other.', {
  rows: [['{1, 2, 3}', '{2}']], call: 'a.difference(&b).collect::<Vec<_>>()', note: 'A − B', outs: ['[1, 3]'],
  intro: 'Everything from a, minus what b has.',
  steps: [['2 is in b, so it is left out.', [0, 1]], ['Result: [1, 3].', [], 'o0']],
  result: '[1, 3]', resultCap: 'Not symmetric: b.difference(&a) would be empty here.',
}, 'let a = BTreeSet::from([1, 2, 3]); let b = BTreeSet::from([2]); d(a.difference(&b).collect::<Vec<_>>())');

add('btreeset/symmetric_difference', 'symmetric_difference', SET, 'How BTreeSet::symmetric_difference works', 'The values in exactly one of the two sets.', {
  rows: [['{1, 2}', '{2, 3}']], call: 'a.symmetric_difference(&b).collect::<Vec<_>>()', note: 'A △ B', outs: ['[1, 3]'],
  intro: 'Shared values are dropped; the rest stay.',
  steps: [['2 is in both: dropped.', [0, 1]], ['1 and 3 remain.', [], 'o0']],
  result: '[1, 3]', resultCap: '&a ^ &b gives a new set.',
}, 'let a = BTreeSet::from([1, 2]); let b = BTreeSet::from([2, 3]); d(a.symmetric_difference(&b).collect::<Vec<_>>())');

add('btreeset/is_subset', 'is_subset', SET, 'How BTreeSet::is_subset works', 'true if every value of this set is also in the other.', {
  rows: [['{1, 2}', '{1, 2, 3}']], call: 'a.is_subset(&b)', note: 'A ⊆ B', outs: ['true'],
  intro: 'a fits completely inside b.',
  steps: [['1 and 2 are both in b.', [0, 1]], ['So a ⊆ b: true.', [], 'o0']],
  result: 'true', resultCap: 'is_superset asks the reverse.',
}, 'let a = BTreeSet::from([1, 2]); let b = BTreeSet::from([1, 2, 3]); a.is_subset(&b).to_string()');

add('btreeset/append', 'append', SET, 'How BTreeSet::append works', 'Moves every value of another set into this one.', {
  rows: [['a = {1}'], ['b = {1, 2}']], call: 'a.append(&mut b)', note: 'b ends up empty', outs: ['a = {1, 2}', 'b = {}'],
  intro: 'Duplicates collapse; b is emptied.',
  steps: [['1 is already in a; 2 moves over.', ['a0', 'b0']], ['b is left empty.', [], 'o0,1']],
  result: 'a = {1, 2}, b = {}', resultCap: 'extend() copies instead, leaving the source untouched.',
}, 'let mut a = BTreeSet::from([1]); let mut b = BTreeSet::from([1, 2]); a.append(&mut b); format!("a = {:?}, b = {:?}", a, b)');

add('btreeset/retain', 'retain', SET, 'How BTreeSet::retain works', 'Keeps only the values that pass a test.', {
  rows: [['{1, 2, 3, 4}']], call: 's.retain(|x| x % 2 == 1)', note: 'filter in place', outs: ['{1, 3}'],
  intro: 'Values for which the closure returns false are removed.',
  steps: [['2 and 4 fail.', 0], ['{1, 3} remains.', [], 'o0']],
  result: '{1, 3}', resultCap: 'The remaining values stay sorted.',
}, 'let mut s = BTreeSet::from([1, 2, 3, 4]); s.retain(|x| x % 2 == 1); d(s)');

add('btreeset/split_off', 'split_off', SET, 'How BTreeSet::split_off works', 'Splits the set: values ≥ the given one move to a new set.', {
  rows: [['{1, 4, 6, 9}']], call: 'let high = s.split_off(&5);', note: 'cut at 5', outs: ['s = {1, 4}', 'high = {6, 9}'],
  intro: 'Everything from 5 upwards goes into the returned set.',
  steps: [['1 and 4 are below 5: they stay.', 0, 'o0'], ['6 and 9 move.', 0, 'o1']],
  result: 's = {1, 4}, high = {6, 9}', resultCap: 'BTreeMap::split_off works the same with keys.',
}, 'let mut s = BTreeSet::from([1, 4, 6, 9]); let high = s.split_off(&5); format!("s = {:?}, high = {:?}", s, high)');

void pair;
module.exports = list;
