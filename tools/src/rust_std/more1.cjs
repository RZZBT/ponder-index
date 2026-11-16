// Rust standard library, batch 2a: the rest of Option and Result, and the collections.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Option', /^src\/option\.rs$/] });
const RES = ['core', 'Result', /^src\/result\.rs$/];
const MAP = ['std', 'HashMap', /collections\/hash\/map\.rs$/];
const ENTRY = ['std', 'Entry', /collections\/hash\/map\.rs$/];
const SET = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const BTREE = ['alloc', 'BTreeMap', /collections\/btree\/map\.rs$/];
const BSET = ['alloc', 'BTreeSet', /collections\/btree\/set\.rs$/];
const DEQUE = ['alloc', 'VecDeque', /collections\/vec_deque\/mod\.rs$/];
const HEAP = ['alloc', 'BinaryHeap', /collections\/binary_heap\/mod\.rs$/];
const two = (a, b) => ({ rows: [[a, b]] });

// ---------------------------------------------------------------- Option

add('option/and', 'and', null, 'How Option::and works', 'Gives the second Option only if the first one is Some.', {
  ...two('Some(1).and(Some("x"))', 'None.and(Some("x"))'), call: 'a.and(b)', note: 'both must be there', outs: ['Some("x")', 'None'],
  intro: 'and checks the first Option; if it is Some, the result is the second one.',
  steps: [['The first is Some(1), so the result is the second: Some("x").', 0, 'o0'], ['The first is None: the result is None, whatever the second is.', 1, 'o1']],
  result: 'Some("x"), None', resultCap: 'and_then is the version that takes a closure.',
}, 'let n: Option<i32> = None; format!("{:?}, {:?}", Some(1).and(Some("x")), n.and(Some("x")))');

add('option/or_else', 'or_else', null, 'How Option::or_else works', 'Keeps Some; for None, calls a closure that returns another Option.', {
  ...two('Some(4)', 'None'), call: 'opt.or_else(|| load_from_disk())', note: 'a lazy fallback', outs: ['Some(4)', 'Some(7)'],
  intro: 'or_else only runs the closure when there is no value.',
  steps: [['Some(4) is kept; the closure is not called.', 0, 'o0'], ['None: the closure runs and its Some(7) is used.', 1, 'o1']],
  result: 'Some(4), Some(7)', resultCap: 'Use or when the fallback is a ready value, or_else when it costs work to make.',
}, 'let n: Option<i32> = None; format!("{:?}, {:?}", Some(4).or_else(|| Some(7)), n.or_else(|| Some(7)))');

add('option/ok_or_else', 'ok_or_else', null, 'How Option::ok_or_else works', 'Some(v) becomes Ok(v); None becomes Err from a closure.', {
  ...two('Some(4)', 'None'), call: 'opt.ok_or_else(|| format!("missing {key}"))', note: 'build the error only when needed', outs: ['Ok(4)', 'Err("missing port")'],
  intro: 'ok_or_else is ok_or with a lazily built error.',
  steps: [['Some(4) becomes Ok(4); no error is built.', 0, 'o0'], ['None: the closure formats the error message.', 1, 'o1']],
  result: 'Ok(4), Err("missing port")', resultCap: 'Then add ? to return the error from the function.',
}, 'let key = "port"; let n: Option<i32> = None; format!("{:?}, {:?}", Some(4).ok_or_else(|| format!("missing {key}")), n.ok_or_else(|| format!("missing {key}")))');

add('option/is_some_and', 'is_some_and', null, 'How Option::is_some_and works', 'true if there is a value and it passes the test.', {
  rows: [['Some(4)', 'Some(3)', 'None']], call: 'opt.is_some_and(|x| x % 2 == 0)', note: 'present and even?', outs: ['true', 'false', 'false'],
  intro: 'is_some_and combines "is there a value?" and "does it pass?".',
  steps: [['Some(4): 4 is even, true.', 0, 'o0'], ['Some(3): 3 is odd, false.', 1, 'o1'], ['None: no value, false.', 2, 'o2']],
  result: 'true, false, false', resultCap: 'is_none_or is the other way round: true for None or for a passing value.',
}, 'let n: Option<i32> = None; format!("{}, {}, {}", Some(4).is_some_and(|x| x % 2 == 0), Some(3).is_some_and(|x| x % 2 == 0), n.is_some_and(|x| x % 2 == 0))');

add('option/is_none_or', 'is_none_or', null, 'How Option::is_none_or works', 'true for None, or for a value that passes the test.', {
  rows: [['None', 'Some(10)', 'Some(99)']], call: 'limit.is_none_or(|l| size <= l)', note: 'size = 50; no limit means fine', outs: ['true', 'false', 'true'],
  intro: 'A missing limit allows everything; a limit must be respected.',
  steps: [['No limit: true.', 0, 'o0'], ['Limit 10: 50 <= 10 is false.', 1, 'o1'], ['Limit 99: 50 <= 99 is true.', 2, 'o2']],
  result: 'true, false, true', resultCap: 'Reads exactly like the rule it checks: "no limit, or within the limit".',
}, 'let size = 50; let a: Option<i32> = None; format!("{}, {}, {}", a.is_none_or(|l| size <= l), Some(10).is_none_or(|l| size <= l), Some(99).is_none_or(|l| size <= l))');

add('option/insert', 'insert', null, 'How Option::insert works', 'Stores a value (replacing any old one) and returns a reference to it.', {
  rows: [['slot = None']], call: '*slot.insert(1) += 10;', note: 'set and then use', outs: ['slot = Some(11)'],
  intro: 'insert always writes the new value and lends you &mut to it.',
  steps: [['1 is stored; slot is Some(1).', 0, null, 'stored'], ['The returned &mut lets you change it right away: 11.', 0, 'o0']],
  result: 'Some(11)', resultCap: 'get_or_insert only inserts when the Option is None.',
}, 'let mut slot: Option<i32> = None; *slot.insert(1) += 10; d(slot)');

add('option/take_if', 'take_if', null, 'How Option::take_if works', 'Takes the value out only if it passes a test.', {
  rows: [['Some(3)', 'Some(8)']], call: 'opt.take_if(|x| *x > 5)', note: 'take big values only', outs: ['None (slot keeps 3)', 'Some(8) (slot now None)'],
  intro: 'take_if is take() with a condition.',
  steps: [['3 > 5 is false: nothing is taken.', 0, 'o0'], ['8 > 5: 8 is taken out and the Option is left as None.', 1, 'o1']],
  result: 'None, Some(8)', resultCap: 'The closure gets &mut, so it may even change the value before deciding.',
}, 'let mut a = Some(3); let mut b = Some(8); format!("{:?}, {:?}", a.take_if(|x| *x > 5), b.take_if(|x| *x > 5))');

add('option/unzip', 'unzip', null, 'How Option::unzip works', 'Turns Option<(A, B)> into (Option<A>, Option<B>).', {
  ...two('Some((1, "a"))', 'None'), call: 'pair.unzip()', note: 'the opposite of zip', outs: ['(Some(1), Some("a"))', '(None, None)'],
  intro: 'unzip splits a pair inside an Option into two Options.',
  steps: [['Some((1, "a")) gives (Some(1), Some("a")).', 0, 'o0'], ['None gives (None, None).', 1, 'o1']],
  result: '(Some(1), Some("a")), (None, None)', resultCap: 'Option::zip goes the other way.',
}, 'let n: Option<(i32, &str)> = None; format!("{:?}, {:?}", Some((1, "a")).unzip(), n.unzip())');

add('option/transpose', 'transpose', null, 'How Option::transpose works', 'Turns Option<Result<T, E>> into Result<Option<T>, E>.', {
  rows: [['Some(Ok(4))', 'Some(Err("bad"))', 'None']], call: 'maybe_number.transpose()', note: 'swap the layers', outs: ['Ok(Some(4))', 'Err("bad")', 'Ok(None)'],
  intro: 'Handy for optional input that must be valid if present: "if it is there, parse it".',
  steps: [['Some(Ok(4)) becomes Ok(Some(4)).', 0, 'o0'], ['Some(Err) becomes Err: the error comes first.', 1, 'o1'], ['None becomes Ok(None): missing is fine.', 2, 'o2']],
  result: 'Ok(Some(4)), Err("bad"), Ok(None)', resultCap: 'Typical: arg.map(|s| s.parse::<u16>()).transpose()? gives Option<u16> or returns the parse error.',
}, 'let a: Option<Result<i32, &str>> = Some(Ok(4)); let b: Option<Result<i32, &str>> = Some(Err("bad")); let c: Option<Result<i32, &str>> = None; format!("{:?}, {:?}, {:?}", a.transpose(), b.transpose(), c.transpose())');

add('option/iter', 'iter', null, 'How Option::iter works', 'An iterator with one item for Some, none for None.', {
  ...two('Some(5)', 'None'), call: 'v.iter().chain(extra.iter())', note: 'v = [1, 2], extra: Option<i32>', outs: ['1, 2, 5', '1, 2'],
  intro: 'An Option can be treated as a list of zero or one items.',
  steps: [['Some(5) adds one item to the chain.', 0, 'o0'], ['None adds nothing.', 1, 'o1']],
  result: '1, 2, 5', resultCap: 'Avoids an if just to append an optional value.',
}, 'let v = vec![1, 2]; let extra = Some(5); j(v.iter().chain(extra.iter()))');

add('option/cloned', 'cloned', null, 'How Option::cloned works', 'Turns Option<&T> into Option<T> by cloning.', {
  rows: [['Some(&String "ann")']], call: 'names.first().cloned()', note: 'an owned copy', outs: ['Some(String "ann")'],
  intro: 'first() lends a &String. cloned() makes an owned copy so the result does not borrow the Vec.',
  steps: [['The reference points at "ann" inside the Vec.', 0, null, 'Option<&String>'], ['cloned() clones it: Some("ann"), owned.', 0, 'o0', 'Option<String>']],
  result: 'Some("ann")', resultCap: 'copied() is the cheaper version for Copy types like numbers.',
}, 'let names = vec![String::from("ann")]; d(names.first().cloned())');

add('option/inspect', 'inspect', null, 'How Option::inspect works', 'Runs a closure on the value (if any) and passes the Option on unchanged.', {
  ...two('Some(4)', 'None'), call: 'opt.inspect(|x| println!("got {x}"))', note: 'peek, e.g. for logging', outs: ['prints "got 4", Some(4)', 'prints nothing, None'],
  intro: 'inspect is for side effects like logging, in the middle of a chain.',
  steps: [['Some(4): the closure runs, the Option passes through.', 0, 'o0'], ['None: nothing runs.', 1, 'o1']],
  result: 'Some(4)', resultCap: 'Result has inspect and inspect_err too.',
}, 'd(Some(4).inspect(|_x| {}))');

// ---------------------------------------------------------------- Result

add('result/is_ok_and', 'is_ok_and', RES, 'How Result::is_ok_and works', 'true if it is Ok and the value passes the test.', {
  rows: [['Ok(4)', 'Ok(-1)', 'Err(..)']], call: 'input.parse::<i32>().is_ok_and(|n| n > 0)', note: 'a positive number?', outs: ['true', 'false', 'false'],
  intro: 'One call answers "did it work, and is the value right?".',
  steps: [['"4": Ok, and 4 > 0.', 0, 'o0'], ['"-1": Ok, but not positive.', 1, 'o1'], ['"x": Err.', 2, 'o2']],
  result: 'true, false, false', resultCap: 'is_err_and does the same for the error side.',
}, 'let f = |s: &str| s.parse::<i32>().is_ok_and(|n| n > 0); format!("{}, {}, {}", f("4"), f("-1"), f("x"))');

add('result/and', 'and', RES, 'How Result::and works', 'If Ok, gives the second Result; an Err is kept.', {
  ...two('Ok(1).and(Ok("x"))', 'Err("a").and(Ok("x"))'), call: 'first.and(second)', note: 'the first error wins', outs: ['Ok("x")', 'Err("a")'],
  intro: 'and returns the second Result only when the first succeeded.',
  steps: [['Ok, so the result is the second: Ok("x").', 0, 'o0'], ['The first failed: its Err("a") is returned.', 1, 'o1']],
  result: 'Ok("x"), Err("a")', resultCap: 'and_then takes a closure that receives the Ok value.',
}, 'let a: Result<i32, &str> = Ok(1); let b: Result<i32, &str> = Err("a"); format!("{:?}, {:?}", a.and(Ok::<&str, &str>("x")), b.and(Ok::<&str, &str>("x")))');

add('result/or', 'or', RES, 'How Result::or works', 'Keeps Ok; replaces an Err with another Result.', {
  ...two('Ok(1).or(Ok(9))', 'Err("a").or(Ok(9))'), call: 'first.or(fallback)', note: 'a fallback Result', outs: ['Ok(1)', 'Ok(9)'],
  intro: 'or keeps a success and swaps a failure for the fallback.',
  steps: [['Ok(1) is kept.', 0, 'o0'], ['Err("a") is replaced by Ok(9).', 1, 'o1']],
  result: 'Ok(1), Ok(9)', resultCap: 'or_else takes a closure that receives the error.',
}, 'let a: Result<i32, &str> = Ok(1); let b: Result<i32, &str> = Err("a"); format!("{:?}, {:?}", a.or(Ok::<i32, &str>(9)), b.or(Ok::<i32, &str>(9)))');

add('result/map_or_else', 'map_or_else', RES, 'How Result::map_or_else works', 'One closure for the error, one for the value.', {
  ...two('Ok(4)', 'Err("bad")'), call: 'res.map_or_else(|e| e.len() as i32, |v| v * 2)', note: 'both sides handled', outs: ['8', '3'],
  intro: 'map_or_else(on_err, on_ok) turns either case into the same type.',
  steps: [['Ok(4): on_ok gives 8.', 0, 'o0'], ['Err("bad"): on_err gives its length, 3.', 1, 'o1']],
  result: '8, 3', resultCap: 'The error closure comes first in the argument list.',
}, 'let a: Result<i32, &str> = Ok(4); let b: Result<i32, &str> = Err("bad"); format!("{}, {}", a.map_or_else(|e| e.len() as i32, |v| v * 2), b.map_or_else(|e| e.len() as i32, |v| v * 2))');

add('result/inspect_err', 'inspect_err', RES, 'How Result::inspect_err works', 'Looks at the error (for logging) and passes the Result on.', {
  ...two('Ok(4)', 'Err("bad")'), call: 'res.inspect_err(|e| eprintln!("failed: {e}"))?', note: 'log, then propagate', outs: ['Ok(4), nothing logged', 'logs, Err("bad")'],
  intro: 'inspect_err runs only for Err and does not change the Result.',
  steps: [['Ok: the closure is skipped.', 0, 'o0'], ['Err: the closure logs it; the Err continues to ?.', 1, 'o1']],
  result: 'Err("bad")', resultCap: 'Keeps error logging out of the main flow of the code.',
}, 'let b: Result<i32, &str> = Err("bad"); d(b.inspect_err(|_e| {}))');

add('result/transpose', 'transpose', RES, 'How Result::transpose works', 'Turns Result<Option<T>, E> into Option<Result<T, E>>.', {
  rows: [['Ok(Some(4))', 'Ok(None)', 'Err("e")']], call: 'res.transpose()', note: 'swap the layers', outs: ['Some(Ok(4))', 'None', 'Some(Err("e"))'],
  intro: 'transpose moves the Option to the outside.',
  steps: [['Ok(Some(4)) becomes Some(Ok(4)).', 0, 'o0'], ['Ok(None) becomes None.', 1, 'o1'], ['Err stays an error: Some(Err("e")).', 2, 'o2']],
  result: 'Some(Ok(4)), None, Some(Err("e"))', resultCap: 'Useful inside filter_map, which wants an Option.',
}, 'let a: Result<Option<i32>, &str> = Ok(Some(4)); let b: Result<Option<i32>, &str> = Ok(None); let c: Result<Option<i32>, &str> = Err("e"); format!("{:?}, {:?}, {:?}", a.transpose(), b.transpose(), c.transpose())');

// ---------------------------------------------------------------- HashMap / HashSet

add('hashmap/from', 'from', MAP, 'How HashMap::from works', 'Builds a map from an array of (key, value) pairs.', {
  rows: [['("a", 1)', '("b", 2)', '("a", 3)']], call: 'HashMap::from([("a", 1), ("b", 2), ("a", 3)])', note: 'a later pair overwrites', outs: ['"a" → 3', '"b" → 2'],
  intro: 'from inserts the pairs in order, like calling insert for each.',
  steps: [['("a", 1) and ("b", 2) are inserted.', [0, 1], null, '{a: 1, b: 2}'], ['("a", 3) replaces the earlier value of "a".', 2, 'o0,1', 'a: 1 → 3']],
  result: '{"a": 3, "b": 2}', resultCap: 'collect() from an iterator of pairs works the same way.',
}, 'let m = HashMap::from([("a", 1), ("b", 2), ("a", 3)]); sorted_map(&m)');

add('hashmap/len', 'len', MAP, 'How HashMap::len works', 'The number of entries.', {
  rows: [['"a" → 1', '"b" → 2']], call: 'm.len()', note: 'keys, not values', outs: ['2'],
  intro: 'len counts the keys stored in the map.',
  steps: [['Two keys: "a" and "b".', [0, 1]], ['len() returns 2 instantly.', [], 'o0']],
  result: '2', resultCap: 'is_empty() is the same as len() == 0.',
}, 'let m = HashMap::from([("a", 1), ("b", 2)]); m.len().to_string()');

add('hashmap/values', 'values', MAP, 'How HashMap::values works', 'An iterator over all the values, in no particular order.', {
  rows: [['"a" → 1', '"b" → 2', '"c" → 3']], call: 'm.values().sum::<i32>()', note: 'order does not matter for a sum', outs: ['6'],
  intro: 'values() yields every value once, in the map\'s internal (random) order.',
  steps: [['1, 2 and 3 are visited in some order.', [0, 1, 2]], ['Their sum is 6, whatever the order.', [], 'o0']],
  result: '6', resultCap: 'Never rely on the order of a HashMap. Collect into a Vec and sort, or use a BTreeMap.',
}, 'let m = HashMap::from([("a", 1), ("b", 2), ("c", 3)]); m.values().sum::<i32>().to_string()');

add('hashmap/keys', 'keys', MAP, 'How HashMap::keys works', 'An iterator over all keys, in no particular order.', {
  rows: [['"b" → 2', '"a" → 1']], call: 'let mut k: Vec<_> = m.keys().collect(); k.sort();', note: 'sort for a stable order', outs: ['["a", "b"]'],
  intro: 'keys() yields each key once, in random order, so sort if you print them.',
  steps: [['The keys come out in some order.', [0, 1]], ['Sorting gives a predictable ["a", "b"].', [], 'o0']],
  result: '["a", "b"]', resultCap: 'into_keys() consumes the map and gives owned keys.',
}, 'let m = HashMap::from([("b", 2), ("a", 1)]); let mut k: Vec<_> = m.keys().collect(); k.sort(); d(k)');

add('hashmap/iter', 'iter', MAP, 'How HashMap::iter works', 'An iterator over (key, value) pairs, in no particular order.', {
  rows: [['"x" → 1', '"y" → 2']], call: 'for (k, v) in &m { ... }', note: 'pairs of references', outs: ['("x", 1)', '("y", 2)'],
  intro: 'Iterating over &m gives (&key, &value) pairs.',
  steps: [['Each entry is visited once.', [0, 1], 'o0,1'], ['The order can differ between runs: never depend on it.', [], null, 'random order']],
  result: '[("x", 1), ("y", 2)]', resultCap: 'Sorted output: let mut v: Vec<_> = m.iter().collect(); v.sort();',
}, 'let m = HashMap::from([("x", 1), ("y", 2)]); let mut v: Vec<_> = m.iter().collect(); v.sort(); d(v)');

add('hashmap/get_key_value', 'get_key_value', MAP, 'How HashMap::get_key_value works', 'Returns the stored key and its value.', {
  rows: [['"a" → 1']], call: 'm.get_key_value("a")', note: 'both halves of the entry', outs: ['Some(("a", 1))'],
  intro: 'Like get, but also gives back the key as it is stored in the map.',
  steps: [['"a" is found.', 0], ['Both the key and the value are returned.', [], 'o0']],
  result: 'Some(("a", 1))', resultCap: 'Useful when equal-looking keys can differ in details you want to see.',
}, 'let m = HashMap::from([("a", 1)]); d(m.get_key_value("a"))');

add('hashmap/or_insert_with_key', 'or_insert_with_key', ENTRY, 'How Entry::or_insert_with_key works', 'Like or_insert_with, but the closure gets the key.', {
  rows: [['"apple"', '"kiwi"']], call: 'm.entry(w).or_insert_with_key(|k| k.len())', note: 'value computed from the key', outs: ['"apple" → 5', '"kiwi" → 4'],
  intro: 'When the default value depends on the key, the closure receives it.',
  steps: [['"apple" is new: its value is its length, 5.', 0, 'o0'], ['"kiwi": 4.', 1, 'o1']],
  result: '{"apple": 5, "kiwi": 4}', resultCap: 'Saves cloning the key just to compute the default.',
}, 'let mut m: HashMap<&str, usize> = HashMap::new(); for w in ["apple", "kiwi"] { m.entry(w).or_insert_with_key(|k| k.len()); } sorted_map(&m)');

add('hashset/remove', 'remove', SET, 'How HashSet::remove works', 'Removes a value; returns whether it was there.', {
  rows: [nums([1, 2, 3])], call: 's.remove(&2), s.remove(&9)', note: 'a bool tells you', outs: ['true', 'false'],
  intro: 'remove takes the value out if present.',
  steps: [['2 was there: removed, true.', 1, { srcColor: 'danger', out: [0] }], ['9 was not: nothing happens, false.', [], 'o1']],
  result: 'true, false', resultCap: 'take(&x) returns the removed value instead of a bool.',
}, 'let mut s: HashSet<i32> = [1, 2, 3].into_iter().collect(); let a = s.remove(&2); let b = s.remove(&9); format!("{}, {}", a, b)');

add('hashset/is_disjoint', 'is_disjoint', SET, 'How HashSet::is_disjoint works', 'true if the two sets have nothing in common.', {
  rows: [nums([1, 2]), nums([3, 4])], call: 'a.is_disjoint(&b)', note: 'a = {1, 2}, b = {3, 4}', outs: ['true'],
  intro: 'is_disjoint checks every value of one set against the other.',
  steps: [['1 and 2 are not in b.', ['a0', 'a1']], ['No value is shared: true.', [], 'o0']],
  result: 'true', resultCap: 'The same as a.intersection(&b).next().is_none(), but clearer.',
}, 'let a: HashSet<i32> = [1, 2].into_iter().collect(); let b: HashSet<i32> = [3, 4].into_iter().collect(); a.is_disjoint(&b).to_string()');

add('hashset/retain', 'retain', SET, 'How HashSet::retain works', 'Keeps only the values that pass the test.', {
  rows: [nums([1, 2, 3, 4])], call: 's.retain(|x| x % 2 == 0)', note: 'keep even numbers', outs: [null, null],
  intro: 'retain removes every value for which the closure says false.',
  steps: [['1 and 3 are removed.', [0, 2], 'x'], ['2 and 4 stay.', [1, 3], { move: { a1: 0, a3: 1 } }]],
  result: '{2, 4}', resultCap: 'The set is changed in place.',
}, 'let mut s: HashSet<i32> = [1, 2, 3, 4].into_iter().collect(); s.retain(|x| x % 2 == 0); sorted_set(&s)');

// ---------------------------------------------------------------- BTreeMap / BTreeSet / VecDeque / BinaryHeap

add('btreemap/last_key_value', 'last_key_value', BTREE, 'How BTreeMap::last_key_value works', 'The entry with the largest key.', {
  rows: [['1 → "a"', '5 → "e"', '3 → "c"']], call: 'm.last_key_value()', note: 'keys are sorted', outs: ['Some((5, "e"))'],
  intro: 'The largest key is always at the end of a BTreeMap.',
  steps: [['Sorted, the keys are 1, 3, 5.', [0, 2, 1]], ['5 is the last: (5, "e").', 1, 'o0']],
  result: 'Some((5, "e"))', resultCap: 'pop_last() also removes it.',
}, 'let m: BTreeMap<i32, &str> = [(1, "a"), (5, "e"), (3, "c")].into_iter().collect(); d(m.last_key_value())');

add('btreemap/entry', 'entry', BTREE, 'How BTreeMap::entry works', 'The same entry API as HashMap, with sorted keys.', {
  rows: [["'b'", "'a'", "'b'"]], call: '*m.entry(c).or_insert(0) += 1;', note: 'count letters, sorted output', outs: ["'a' → 1", "'b' → 2"],
  intro: 'Counting with a BTreeMap gives the result already sorted by key.',
  steps: [["'b' is new: 1.", 0], ["'a' is new: 1. It sorts before 'b'.", 1, 'o0'], ["'b' again: 2.", 2, 'o1']],
  result: "{'a': 1, 'b': 2}", resultCap: 'Pick BTreeMap when you want the counts printed in order.',
}, 'let mut m = BTreeMap::new(); for c in [\'b\', \'a\', \'b\'] { *m.entry(c).or_insert(0) += 1; } d(m)');

add('btreemap/split_off', 'split_off', BTREE, 'How BTreeMap::split_off works', 'Moves every entry with key >= k into a new map.', {
  rows: [['1', '2', '3', '4']], call: 'let high = m.split_off(&3);', note: 'split by key', outs: ['m: {1, 2}', 'high: {3, 4}'],
  intro: 'split_off(&3) cuts the sorted map at key 3.',
  steps: [['Keys below 3 stay in m.', [0, 1], 'o0'], ['3 and above move to the new map.', [2, 3], 'o1']],
  result: 'm = {1: (), 2: ()}, high = {3: (), 4: ()}', resultCap: 'append(&mut other) is the opposite: it merges two maps.',
}, 'let mut m: BTreeMap<i32, ()> = [(1, ()), (2, ()), (3, ()), (4, ())].into_iter().collect(); let high = m.split_off(&3); format!("m = {:?}, high = {:?}", m, high)');

add('btreeset/range', 'range', BSET, 'How BTreeSet::range works', 'The values inside a range, in order.', {
  rows: [nums([2, 5, 8, 11, 14])], call: 's.range(5..=11)', note: 'inclusive range', outs: ['5', '8', '11'],
  intro: 'Because the set is sorted, range jumps to 5 and walks until 11.',
  steps: [['2 is below the range.', 0, 'x'], ['5, 8 and 11 are inside 5..=11.', [1, 2, 3], 'o0,1,2'], ['14 is above it.', 4, 'x']],
  result: '5, 8, 11', resultCap: 'Great for questions like "which scores are between 50 and 80?".',
}, 'let s: BTreeSet<i32> = [2, 5, 8, 11, 14].into_iter().collect(); j(s.range(5..=11))');

add('btreeset/first', 'first', BSET, 'How BTreeSet::first works', 'The smallest value.', {
  rows: [nums([9, 3, 6])], call: 's.first(), s.last()', note: 'min and max for free', outs: ['Some(3)', 'Some(9)'],
  intro: 'A BTreeSet is sorted, so its smallest and largest values are at the ends.',
  steps: [['first(): 3.', 1, 'o0'], ['last(): 9.', 0, 'o1']],
  result: 'Some(3), Some(9)', resultCap: 'pop_first and pop_last remove them.',
}, 'let s: BTreeSet<i32> = [9, 3, 6].into_iter().collect(); format!("{:?}, {:?}", s.first(), s.last())');

add('vecdeque/front', 'front', DEQUE, 'How VecDeque::front works', 'The first item, without removing it.', {
  rows: [nums([4, 5, 6])], call: 'q.front(), q.back()', note: 'look at both ends', outs: ['Some(4)', 'Some(6)'],
  intro: 'front and back just look; nothing is removed.',
  steps: [['front() is 4.', 0, 'o0'], ['back() is 6.', 2, 'o1']],
  result: 'Some(4), Some(6)', resultCap: 'Both return None for an empty deque.',
}, 'let q = VecDeque::from([4, 5, 6]); format!("{:?}, {:?}", q.front(), q.back())');

add('vecdeque/rotate_left', 'rotate_left', DEQUE, 'How VecDeque::rotate_left works', 'Moves the first n items to the back.', {
  rows: [nums([1, 2, 3, 4])], call: 'q.rotate_left(1)', note: 'take turns', outs: [null, null, null, null],
  intro: 'rotate_left(1) is like a round-robin: the first item goes to the end of the line.',
  steps: [['2, 3 and 4 move up.', [1, 2, 3], { move: { a1: 0, a2: 1, a3: 2 } }], ['1 goes to the back.', 0, 'm3']],
  result: '[2, 3, 4, 1]', resultCap: 'Cheap on a VecDeque: no items are copied around in memory.',
}, 'let mut q = VecDeque::from([1, 2, 3, 4]); q.rotate_left(1); d(q)');

add('vecdeque/make_contiguous', 'make_contiguous', DEQUE, 'How VecDeque::make_contiguous works', 'Arranges the ring buffer as one slice, so it can be sorted.', {
  rows: [nums([3, 1, 2])], call: 'q.make_contiguous().sort();', note: 'a deque has no sort of its own', outs: [null, null, null],
  intro: 'A VecDeque may wrap around inside its buffer. make_contiguous puts it in one piece and returns a &mut slice.',
  steps: [['The items are moved into one continuous run.', [0, 1, 2]], ['The slice can now be sorted.', [1, 2, 0], { move: { a1: 0, a2: 1, a0: 2 } }]],
  result: '[1, 2, 3]', resultCap: 'as_slices() lets you look at the two halves without moving anything.',
}, 'let mut q = VecDeque::from([3, 1, 2]); q.make_contiguous().sort(); d(q)');

add('binaryheap/into_sorted_vec', 'into_sorted_vec', HEAP, 'How BinaryHeap::into_sorted_vec works', 'Consumes the heap and returns its values sorted, smallest first.', {
  rows: [nums([5, 1, 4, 2])], call: 'h.into_sorted_vec()', note: 'heap sort', outs: ['1', '2', '4', '5'],
  intro: 'The heap repeatedly takes its largest value and places it at the end: that is heap sort.',
  steps: [['5, the largest, goes last; then 4.', [0, 2], 'o3,2'], ['Then 2 and 1.', [3, 1], 'o1,0']],
  result: '[1, 2, 4, 5]', resultCap: 'Ascending order, even though pop() gives largest first.',
}, 'let h: BinaryHeap<i32> = [5, 1, 4, 2].into_iter().collect(); d(h.into_sorted_vec())');

add('binaryheap/len', 'len', HEAP, 'How BinaryHeap::len works', 'How many values the heap holds.', {
  rows: [nums([5, 1, 4])], call: 'h.len()', note: 'push adds one, pop removes one', outs: ['3'],
  intro: 'len counts all values, not just the top.',
  steps: [['Three values were pushed.', [0, 1, 2]], ['len() is 3.', [], 'o0']],
  result: '3', resultCap: 'while let Some(x) = h.pop() empties it one by one.',
}, 'let h: BinaryHeap<i32> = [5, 1, 4].into_iter().collect(); h.len().to_string()');

module.exports = list;
