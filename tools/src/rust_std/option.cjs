// Rust standard library: Option<T> (core::option). Some(value) or None, and how to get the value out safely.
const { group } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Option', /^src\/option\.rs$/] });
const O = (spec) => ({ rows: [['Some(4)', 'None']], ...spec });

add('option/unwrap', 'unwrap', null, 'How Option::unwrap works', 'Takes the value out of Some; panics on None.', O({
  call: 'Some(4).unwrap(), None.unwrap()', note: 'fine for Some, a crash for None', outs: ['4', 'panic!'],
  intro: 'unwrap says: I am sure there is a value. If there is not, the program stops.',
  steps: [
    ['Some(4): the 4 comes out.', 0, 'o0'],
    ['None has no value, so unwrap panics: "called `Option::unwrap()` on a `None` value".', 1, { srcColor: 'danger', out: [1] }, 'program stops'],
  ],
  result: '4', resultCap: 'Use unwrap only when None would be a bug. Otherwise prefer unwrap_or, if let, match or ?.',
}), 'd(Some(4).unwrap())');

add('option/expect', 'expect', null, 'How Option::expect works', 'Like unwrap, but the panic message is yours.', O({
  call: 'config.get("port").expect("port must be set")', note: 'a better crash message', rows: [['Some(8080)', 'None']], outs: ['8080', 'panic: port must be set'],
  intro: 'expect behaves like unwrap and adds your explanation if it fails.',
  steps: [
    ['Some(8080): the value comes out.', 0, 'o0'],
    ['None: the program stops with "port must be set", which tells you what went wrong.', 1, { srcColor: 'danger', out: [1] }],
  ],
  result: '8080', resultCap: 'Write the message as what you expected: "port must be set", not "error".',
}), 'd(Some(8080).expect("port must be set"))');

add('option/unwrap_or', 'unwrap_or', null, 'How Option::unwrap_or works', 'The value inside Some, or a default for None.', O({
  call: 'Some(4).unwrap_or(0), None.unwrap_or(0)', note: 'never panics', outs: ['4', '0'],
  intro: 'unwrap_or gives the value if there is one, and the default you pass otherwise.',
  steps: [
    ['Some(4): the value, 4.', 0, 'o0'],
    ['None: the default, 0.', 1, 'o1', 'default used'],
  ],
  result: '4, 0', resultCap: 'The default is always computed, even when not needed. For an expensive default, use unwrap_or_else.',
}), 'let n: Option<i32> = None; format!("{}, {}", Some(4).unwrap_or(0), n.unwrap_or(0))');

add('option/unwrap_or_else', 'unwrap_or_else', null, 'How Option::unwrap_or_else works', 'The value, or the result of a closure that runs only for None.', O({
  call: 'Some(4).unwrap_or_else(|| 10), None.unwrap_or_else(|| 10)', note: 'the closure runs only when needed', outs: ['4', '10'],
  intro: 'unwrap_or_else takes a closure instead of a value, so the default is computed lazily.',
  steps: [
    ['Some(4): the value. The closure is never called.', 0, 'o0', 'closure skipped'],
    ['None: now the closure runs and its result is used.', 1, 'o1', 'closure runs'],
  ],
  result: '4, 10', resultCap: 'Use it when the default is expensive or has side effects, like reading a file.',
}), 'let n: Option<i32> = None; format!("{}, {}", Some(4).unwrap_or_else(|| 10), n.unwrap_or_else(|| 10))');

add('option/unwrap_or_default', 'unwrap_or_default', null, 'How Option::unwrap_or_default works', 'The value, or the type\'s default (0, "", empty Vec) for None.', O({
  call: 'Some(4).unwrap_or_default(), None::<i32>.unwrap_or_default()', note: 'the type decides the default', outs: ['4', '0'],
  intro: 'unwrap_or_default uses Default::default() of the type when there is no value.',
  steps: [
    ['Some(4): 4.', 0, 'o0'],
    ['None for i32: the default i32 is 0. For String it would be "", for Vec an empty Vec.', 1, 'o1'],
  ],
  result: '4, 0', resultCap: 'Short and clear when the type\'s natural "empty" value is what you want.',
}), 'let n: Option<i32> = None; format!("{}, {}", Some(4).unwrap_or_default(), n.unwrap_or_default())');

add('option/map', 'map', null, 'How Option::map works', 'Changes the value inside Some; None stays None.', O({
  call: 'Some(4).map(|x| x * 2), None.map(|x| x * 2)', note: 'two tracks', outs: ['Some(8)', 'None'],
  intro: 'map works on the value if there is one. None skips the closure completely.',
  steps: [
    ['Some(4): the closure runs, 4 * 2 = 8, and the result is wrapped again: Some(8).', 0, 'o0', '4 → 8'],
    ['None: nothing to change, the closure is not called. The result is None.', 1, 'o1', 'skipped'],
  ],
  result: 'Some(8), None', resultCap: 'map lets you work with a possibly missing value without checking for None at every step.',
}), 'let n: Option<i32> = None; format!("{:?}, {:?}", Some(4).map(|x| x * 2), n.map(|x| x * 2))');

add('option/map_or', 'map_or', null, 'How Option::map_or works', 'Applies a closure to Some, or returns a default for None.', O({
  call: 'Some(4).map_or(0, |x| x * 2), None.map_or(0, |x| x * 2)', note: 'map and unwrap_or in one', outs: ['8', '0'],
  intro: 'map_or(default, f) gives f(value) for Some and the default for None.',
  steps: [
    ['Some(4): 4 * 2 = 8.', 0, 'o0'],
    ['None: the default, 0.', 1, 'o1'],
  ],
  result: '8, 0', resultCap: 'The result is a plain value, not an Option.',
}), 'let n: Option<i32> = None; format!("{}, {}", Some(4).map_or(0, |x| x * 2), n.map_or(0, |x| x * 2))');

add('option/and_then', 'and_then', null, 'How Option::and_then works', 'Chains a step that can also fail (return None).', {
  call: '"5".parse::<i32>().ok().and_then(|n| (n > 0).then_some(n))', note: 'parse, then check', rows: [['"5"', '"-3"', '"x"']], outs: ['Some(5)', 'None', 'None'],
  intro: 'and_then runs the next step only if the previous one gave Some; that step may itself return None.',
  steps: [
    ['"5": parse gives Some(5), and 5 > 0, so Some(5).', 0, 'o0'],
    ['"-3": parse works, but the check fails: None.', 1, { srcColor: 'danger', out: [1] }, 'second step fails'],
    ['"x": parse already failed, so the check never runs: None.', 2, { srcColor: 'danger', out: [2] }, 'first step fails'],
  ],
  result: 'Some(5), None, None', resultCap: 'map would give Some(Some(5)); and_then flattens it. Each step can stop the chain.',
}, 'let f = |s: &str| s.parse::<i32>().ok().and_then(|n| (n > 0).then_some(n)); format!("{:?}, {:?}, {:?}", f("5"), f("-3"), f("x"))');

add('option/ok_or', 'ok_or', null, 'How Option::ok_or works', 'Turns Some(v) into Ok(v) and None into Err(your error).', O({
  call: 'Some(4).ok_or("missing"), None.ok_or("missing")', note: 'Option → Result', outs: ['Ok(4)', 'Err("missing")'],
  intro: 'ok_or converts an Option into a Result, so you can use ? on it in a function that returns Result.',
  steps: [
    ['Some(4) becomes Ok(4).', 0, 'o0'],
    ['None becomes Err("missing"): now the absence has an explanation.', 1, 'o1'],
  ],
  result: 'Ok(4), Err("missing")', resultCap: 'Use ok_or_else when building the error is expensive, like format!.',
}), 'let n: Option<i32> = None; format!("{:?}, {:?}", Some(4).ok_or("missing"), n.ok_or("missing"))');

add('option/filter', 'filter', null, 'How Option::filter works', 'Keeps Some(v) only if v passes the test.', {
  call: 'Some(4).filter(|x| x % 2 == 0), Some(3).filter(...)', note: 'Some can become None', rows: [['Some(4)', 'Some(3)']], outs: ['Some(4)', 'None'],
  intro: 'filter checks the value inside. Failing the test turns Some into None.',
  steps: [
    ['4 is even: Some(4) is kept.', 0, 'o0', 'true'],
    ['3 is odd: the result is None.', 1, { srcColor: 'danger', out: [1] }, 'false'],
  ],
  result: 'Some(4), None', resultCap: 'None stays None without calling the closure.',
}, 'format!("{:?}, {:?}", Some(4).filter(|x| x % 2 == 0), Some(3).filter(|x| x % 2 == 0))');

add('option/take', 'take', null, 'How Option::take works', 'Moves the value out and leaves None behind.', {
  call: 'let mut slot = Some(5); let v = slot.take();', note: 'empties the Option', rows: [['slot = Some(5)']], outs: ['v = Some(5)', 'slot = None'],
  intro: 'take moves the value out of the Option, which is often the only way to take ownership from a struct field.',
  steps: [
    ['v gets Some(5).', 0, 'o0', 'moved out'],
    ['slot is left as None, so nothing is ever used twice.', 0, 'o1', 'left behind'],
  ],
  result: 'v = Some(5), slot = None', resultCap: 'Typical in linked lists and state machines: self.head.take().',
}, 'let mut slot = Some(5); let v = slot.take(); format!("v = {:?}, slot = {:?}", v, slot)');

add('option/replace', 'replace', null, 'How Option::replace works', 'Puts a new value in and returns the old one.', {
  call: 'let mut slot = Some(1); let old = slot.replace(2);', note: 'swap in a new value', rows: [['slot = Some(1)']], outs: ['old = Some(1)', 'slot = Some(2)'],
  intro: 'replace stores the new value and gives back whatever was there before.',
  steps: [
    ['The old value comes out: Some(1).', 0, 'o0'],
    ['The new value 2 goes in.', 0, 'o1'],
  ],
  result: 'old = Some(1), slot = Some(2)', resultCap: 'If the slot was None, replace returns None and still stores the new value.',
}, 'let mut slot = Some(1); let old = slot.replace(2); format!("old = {:?}, slot = {:?}", old, slot)');

add('option/is_some', 'is_some', null, 'How Option::is_some works', 'true for Some, false for None.', O({
  call: 'Some(4).is_some(), None.is_some()', note: 'just a check', outs: ['true', 'false'],
  intro: 'is_some only says whether there is a value; it does not take it out.',
  steps: [
    ['Some(4): true.', 0, 'o0'],
    ['None: false. is_none() is the opposite.', 1, 'o1'],
  ],
  result: 'true, false', resultCap: 'If you need the value right after checking, use if let Some(v) = opt instead.',
}), 'let n: Option<i32> = None; format!("{}, {}", Some(4).is_some(), n.is_some())');

add('option/zip', 'zip', null, 'How Option::zip works', 'Combines two Options into one Option of a pair; None if either is None.', {
  call: 'Some(1).zip(Some("a")), Some(1).zip(None)', note: 'both or nothing', rows: [['Some(1)', 'Some("a")'], ['Some(1)', 'None']], outs: ['Some((1, "a"))', 'None'],
  intro: 'zip gives Some((a, b)) only when both Options have a value.',
  steps: [
    ['Both are Some: the result is Some((1, "a")).', ['a0', 'a1'], 'o0'],
    ['One is None, so the pair cannot be made: None.', ['b0', 'b1'], { srcColor: 'danger', out: [1] }],
  ],
  result: 'Some((1, "a")), None', resultCap: 'Handy when two optional values are needed together.',
}, 'let n: Option<&str> = None; format!("{:?}, {:?}", Some(1).zip(Some("a")), Some(1).zip(n))');

add('option/get_or_insert_with', 'get_or_insert_with', null, 'How Option::get_or_insert_with works', 'Fills a None with a computed value and returns a reference to the value inside.', {
  call: 'let mut cache = None; *cache.get_or_insert_with(|| 10) += 1;', note: 'lazy initialisation', rows: [['cache = None']], outs: ['cache = Some(10)', 'cache = Some(11)'],
  intro: 'get_or_insert_with runs the closure only when the Option is None, stores the result, and lends you the value.',
  steps: [
    ['cache is None, so the closure runs and 10 is stored.', 0, 'o0', 'initialised'],
    ['The returned &mut lets you change the stored value: 10 + 1 = 11. A second call would not run the closure again.', 0, 'o1'],
  ],
  result: 'Some(11)', resultCap: 'A simple way to compute something the first time it is needed and reuse it afterwards.',
}, 'let mut cache: Option<i32> = None; *cache.get_or_insert_with(|| 10) += 1; d(cache)');

add('option/or', 'or', null, 'How Option::or works', 'Keeps the first Some; falls back to another Option for None.', O({
  call: 'Some(4).or(Some(9)), None.or(Some(9))', note: 'a fallback Option', outs: ['Some(4)', 'Some(9)'],
  intro: 'or returns self if it has a value, and the other Option otherwise.',
  steps: [
    ['Some(4) already has a value: it is kept.', 0, 'o0'],
    ['None: the fallback Some(9) is used.', 1, 'o1'],
  ],
  result: 'Some(4), Some(9)', resultCap: 'Chain several: user_value.or(config_value).or(Some(default)).',
}), 'let n: Option<i32> = None; format!("{:?}, {:?}", Some(4).or(Some(9)), n.or(Some(9)))');

add('option/as_ref', 'as_ref', null, 'How Option::as_ref works', 'Borrows the value inside: &Option<T> becomes Option<&T>.', {
  call: 'let name = Some(String::from("Ann")); name.as_ref().map(|s| s.len())', note: 'look without moving', rows: [['Some("Ann")']], outs: ['Some(3)'],
  intro: 'map would move the String out of name. as_ref turns it into Option<&String> first, so name stays usable.',
  steps: [
    ['as_ref lends the String: Some(&"Ann").', 0, null, 'borrowed'],
    ['map now gets a &String and returns its length: Some(3). name still owns "Ann".', 0, 'o0'],
  ],
  result: 'Some(3)', resultCap: 'The classic fix for "use of moved value" errors with Options. as_deref gives Option<&str> directly.',
}, 'let name = Some(String::from("Ann")); let n = name.as_ref().map(|s| s.len()); let _still = name; d(n)');

module.exports = list;
