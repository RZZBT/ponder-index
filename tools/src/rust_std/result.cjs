// Rust standard library: Result<T, E> (core::result). Ok(value) or Err(error).
const { group } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Result', /^src\/result\.rs$/] });
const R = (spec) => ({ rows: [['Ok(4)', 'Err("bad")']], ...spec });
const pre = 'let ok: Result<i32, &str> = Ok(4); let er: Result<i32, &str> = Err("bad"); ';

add('result/unwrap', 'unwrap', null, 'How Result::unwrap works', 'Takes the value out of Ok; panics with the error for Err.', R({
  call: 'ok.unwrap(), err.unwrap()', note: 'fine for Ok, a crash for Err', outs: ['4', 'panic: "bad"'],
  intro: 'unwrap assumes success. An Err stops the program and prints the error.',
  steps: [
    ['Ok(4): the 4 comes out.', 0, 'o0'],
    ['Err("bad"): panic with called `Result::unwrap()` on an `Err` value: "bad".', 1, { srcColor: 'danger', out: [1] }],
  ],
  result: '4', resultCap: 'In functions that return Result, use ? instead: it passes the error up to the caller.',
}), pre + 'd(ok.unwrap())');

add('result/expect', 'expect', null, 'How Result::expect works', 'Like unwrap, with your own message in the panic.', R({
  call: 'ok.expect("value must be ok"), err.expect("value must be ok")', note: 'explain what you expected', outs: ['4', 'panic: value must be ok: "bad"'],
  intro: 'expect behaves like unwrap but starts the panic message with your text.',
  steps: [
    ['Ok: the value comes out.', 0, 'o0'],
    ['Err: the program stops with your message followed by the error.', 1, { srcColor: 'danger', out: [1] }],
  ],
  result: '4', resultCap: 'Good for things that can only fail through a bug or broken setup, with a message that says what.',
}), pre + 'd(ok.expect("must be ok"))');

add('result/unwrap_or', 'unwrap_or', null, 'How Result::unwrap_or works', 'The value for Ok, a default for Err (the error is ignored).', R({
  call: 'ok.unwrap_or(0), err.unwrap_or(0)', note: 'never panics', outs: ['4', '0'],
  intro: 'unwrap_or replaces any error with the default.',
  steps: [
    ['Ok(4): 4.', 0, 'o0'],
    ['Err("bad"): the error is dropped and 0 is used.', 1, 'o1'],
  ],
  result: '4, 0', resultCap: 'The error is lost. If it matters, log it or use match / ?.',
}), pre + 'format!("{}, {}", ok.unwrap_or(0), er.unwrap_or(0))');

add('result/unwrap_or_else', 'unwrap_or_else', null, 'How Result::unwrap_or_else works', 'The value, or a closure that gets the error and returns a fallback.', R({
  call: 'err.unwrap_or_else(|e| e.len() as i32)', note: 'the closure sees the error', outs: ['4', '3'],
  intro: 'unwrap_or_else calls the closure with the error, only for Err.',
  steps: [
    ['Ok(4): 4, the closure is not called.', 0, 'o0'],
    ['Err("bad"): the closure gets "bad" and returns its length, 3.', 1, 'o1'],
  ],
  result: '4, 3', resultCap: 'Useful to log the error and continue with a fallback value.',
}), pre + 'format!("{}, {}", ok.unwrap_or_else(|e| e.len() as i32), er.unwrap_or_else(|e| e.len() as i32))');

add('result/map', 'map', null, 'How Result::map works', 'Changes the Ok value; an Err passes through untouched.', R({
  call: 'ok.map(|x| x * 2), err.map(|x| x * 2)', note: 'the Ok track', outs: ['Ok(8)', 'Err("bad")'],
  intro: 'map transforms success values and leaves errors alone.',
  steps: [
    ['Ok(4): 4 * 2 = 8, so Ok(8).', 0, 'o0'],
    ['Err("bad") is passed on unchanged; the closure is not called.', 1, 'o1', 'skipped'],
  ],
  result: 'Ok(8), Err("bad")', resultCap: 'map_err is the mirror image: it changes the error and leaves Ok alone.',
}), pre + 'format!("{:?}, {:?}", ok.map(|x| x * 2), er.map(|x| x * 2))');

add('result/map_err', 'map_err', null, 'How Result::map_err works', 'Changes the error; an Ok passes through untouched.', R({
  call: 'err.map_err(|e| format!("config: {e}"))', note: 'the Err track', outs: ['Ok(4)', 'Err("config: bad")'],
  intro: 'map_err is used to turn one error type into another, often to add context.',
  steps: [
    ['Ok(4) stays Ok(4).', 0, 'o0', 'skipped'],
    ['Err("bad") becomes Err("config: bad").', 1, 'o1'],
  ],
  result: 'Ok(4), Err("config: bad")', resultCap: 'Typical before ?: file.read().map_err(MyError::Io)?.',
}), pre + 'format!("{:?}, {:?}", ok.map_err(|e| format!("config: {e}")), er.map_err(|e| format!("config: {e}")))');

add('result/and_then', 'and_then', null, 'How Result::and_then works', 'Runs the next step only on success; that step may fail too.', {
  call: '"8".parse::<i32>().map_err(|_| "nan").and_then(half)', note: 'half fails on odd numbers', rows: [['"8"', '"7"', '"x"']], outs: ['Ok(4)', 'Err("odd")', 'Err("nan")'],
  intro: 'and_then chains steps that each return a Result. The first Err stops the chain.',
  steps: [
    ['"8" parses to 8, and half(8) is Ok(4).', 0, 'o0'],
    ['"7" parses, but half(7) fails: Err("odd").', 1, { srcColor: 'danger', out: [1] }, 'second step fails'],
    ['"x" does not parse: Err("nan"), and half is never called.', 2, { srcColor: 'danger', out: [2] }, 'first step fails'],
  ],
  result: 'Ok(4), Err("odd"), Err("nan")', resultCap: 'Inside a function, the ? operator usually reads better than long and_then chains.',
}, 'let half = |n: i32| if n % 2 == 0 { Ok(n / 2) } else { Err("odd") }; let f = |s: &str| s.parse::<i32>().map_err(|_| "nan").and_then(half); format!("{:?}, {:?}, {:?}", f("8"), f("7"), f("x"))');

add('result/ok', 'ok', null, 'How Result::ok works', 'Turns a Result into an Option, throwing the error away.', R({
  call: 'ok.ok(), err.ok()', note: 'Result → Option', outs: ['Some(4)', 'None'],
  intro: 'ok() keeps the success value and forgets the error.',
  steps: [
    ['Ok(4) becomes Some(4).', 0, 'o0'],
    ['Err("bad") becomes None: the error message is gone.', 1, 'o1', 'error discarded'],
  ],
  result: 'Some(4), None', resultCap: 'Common with filter_map: lines.filter_map(|l| l.parse().ok()) keeps only the lines that parse.',
}), pre + 'format!("{:?}, {:?}", ok.ok(), er.ok())');

add('result/is_ok', 'is_ok', null, 'How Result::is_ok works', 'true for Ok, false for Err.', R({
  call: 'ok.is_ok(), err.is_ok()', note: 'just a check', outs: ['true', 'false'],
  intro: 'is_ok tells you whether it worked, without taking anything out.',
  steps: [
    ['Ok(4): true.', 0, 'o0'],
    ['Err("bad"): false. is_err() is the opposite.', 1, 'o1'],
  ],
  result: 'true, false', resultCap: 'To use the value too, write if let Ok(v) = result { ... } or match.',
}), pre + 'format!("{}, {}", ok.is_ok(), er.is_ok())');

add('result/unwrap_or_default', 'unwrap_or_default', null, 'How Result::unwrap_or_default works', 'The value, or the type\'s default for Err.', R({
  call: '"x".parse::<i32>().unwrap_or_default()', note: 'default of i32 is 0', rows: [['Ok(4)', 'Err(..)']], outs: ['4', '0'],
  intro: 'unwrap_or_default uses the default value of the type when there is an error.',
  steps: [
    ['Ok(4): 4.', 0, 'o0'],
    ['Err: 0, the default i32.', 1, 'o1'],
  ],
  result: '4, 0', resultCap: 'For String the default is "", for Vec an empty Vec, for bool false.',
}), 'format!("{}, {}", "4".parse::<i32>().unwrap_or_default(), "x".parse::<i32>().unwrap_or_default())');

add('result/or_else', 'or_else', null, 'How Result::or_else works', 'On Err, tries an alternative that may also fail.', {
  call: 'read_local().or_else(|_| read_default())', note: 'a second chance', rows: [['Ok("local")', 'Err(..)']], outs: ['Ok("local")', 'Ok("default")'],
  intro: 'or_else calls the closure only for Err, and uses its Result instead.',
  steps: [
    ['The first read worked: its Ok is kept, the closure never runs.', 0, 'o0'],
    ['The first read failed: the closure tries the default, which works.', 1, 'o1', 'fallback'],
  ],
  result: 'Ok("local"), Ok("default")', resultCap: 'If the fallback fails too, its Err is returned.',
}, 'let a: Result<&str, &str> = Ok("local"); let b: Result<&str, &str> = Err("missing"); format!("{:?}, {:?}", a.or_else(|_| Ok::<&str, &str>("default")), b.or_else(|_| Ok::<&str, &str>("default")))');

add('result/err', 'err', null, 'How Result::err works', 'Turns a Result into an Option of the error.', R({
  call: 'ok.err(), err.err()', note: 'the opposite of ok()', outs: ['None', 'Some("bad")'],
  intro: 'err() keeps only the error side.',
  steps: [
    ['Ok(4) has no error: None.', 0, 'o0'],
    ['Err("bad") gives Some("bad").', 1, 'o1'],
  ],
  result: 'None, Some("bad")', resultCap: 'Handy for collecting just the failures: results.iter().filter_map(|r| r.as_ref().err()).',
}), pre + 'format!("{:?}, {:?}", ok.err(), er.err())');

module.exports = list;
