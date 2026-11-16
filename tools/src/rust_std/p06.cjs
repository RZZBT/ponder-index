// Rust standard library: the rest of Option and Result, and the smart pointers Rc, Arc, Weak and Box.
const { group } = require('./kit.cjs');
const OPT = ['core', 'Option', /^src\/option\.rs$/];
const RES = ['core', 'Result', /^src\/result\.rs$/];
const RC = ['alloc', 'Rc', /^src\/rc\.rs$/];
const RCWEAK = ['alloc', 'Weak', /^src\/rc\.rs$/];
const ARC = ['alloc', 'Arc', /^src\/sync\.rs$/];
const ARCWEAK = ['alloc', 'Weak', /^src\/sync\.rs$/];
const BOX = ['alloc', 'Box', /^src\/boxed\.rs$/];
const { list, add } = group({ at: OPT });

// ---------------------------------------------------------------- Option

add('option/get_or_insert', 'get_or_insert', null, 'How Option::get_or_insert works', 'Puts a value in if the Option is None, then lends the value inside.', {
  rows: [['None', 'Some(3)']], call: '*opt.get_or_insert(10) += 1;', note: 'fill if empty, then use', outs: ['Some(11)', 'Some(4)'],
  intro: 'get_or_insert returns &mut to the contents, inserting the given value first if there were none.',
  steps: [['None: 10 is inserted, then 1 is added.', 0, 'o0'], ['Some(3): the 3 is used, 10 is ignored.', 1, 'o1']],
  result: 'Some(11), Some(4)', resultCap: 'get_or_insert_with takes a closure, so the default is only built when needed.',
}, 'let mut a: Option<i32> = None; *a.get_or_insert(10) += 1; let mut b = Some(3); *b.get_or_insert(10) += 1; format!("{:?}, {:?}", a, b)');

add('option/get_or_insert_default', 'get_or_insert_default', null, 'How Option::get_or_insert_default works', 'Inserts the type\'s default value if the Option is None.', {
  rows: [['None::<Vec<i32>>']], call: 'opt.get_or_insert_default().push(7);', note: 'an empty Vec appears', outs: ['Some([7])'],
  intro: 'For a Vec the default is an empty Vec; for numbers it is 0.',
  steps: [['None: Vec::new() is inserted.', 0], ['push(7) adds to it.', [], 'o0']],
  result: 'Some([7])', resultCap: 'Handy for lazily created lists inside structs.',
}, 'let mut o: Option<Vec<i32>> = None; o.get_or_insert_default().push(7); d(o)');

add('option/as_mut', 'as_mut', null, 'How Option::as_mut works', 'Turns &mut Option<T> into Option<&mut T>, to change the value inside.', {
  rows: [['Some(5)', 'None']], call: 'if let Some(x) = opt.as_mut() { *x *= 2; }', note: 'edit in place', outs: ['Some(10)', 'None'],
  intro: 'as_mut lends the contents mutably without taking them out.',
  steps: [['Some(5): x points at 5, which becomes 10.', 0, 'o0'], ['None: nothing to change.', 1, 'o1']],
  result: 'Some(10), None', resultCap: 'Writing if let Some(x) = &mut opt does the same.',
}, 'let mut a = Some(5); if let Some(x) = a.as_mut() { *x *= 2; } let mut b: Option<i32> = None; if let Some(x) = b.as_mut() { *x *= 2; } format!("{:?}, {:?}", a, b)');

add('option/iter_mut', 'iter_mut', null, 'How Option::iter_mut works', 'An iterator with zero or one mutable item.', {
  rows: [['Some(1)']], call: 'for x in opt.iter_mut() { *x += 100; }', note: 'loop over 0 or 1 items', outs: ['Some(101)'],
  intro: 'Some(v) yields v once; None yields nothing.',
  steps: [['The one item is 1.', 0], ['It becomes 101.', [], 'o0']],
  result: 'Some(101)', resultCap: 'Lets an Option join iterator chains, e.g. with chain().',
}, 'let mut o = Some(1); for x in o.iter_mut() { *x += 100; } d(o)');

add('option/as_slice', 'as_slice', null, 'How Option::as_slice works', 'Views the Option as a slice of length 0 or 1.', {
  rows: [['Some(4)', 'None']], call: 'opt.as_slice()', note: 'Option → &[T]', outs: ['[4]', '[]'],
  intro: 'Some(4) looks like [4], None like [].',
  steps: [['Some(4) → [4].', 0, 'o0'], ['None → [].', 1, 'o1']],
  result: '[4], []', resultCap: 'Useful when an API wants a slice: v.extend_from_slice(opt.as_slice()).',
}, 'format!("{:?}, {:?}", Some(4).as_slice(), None::<i32>.as_slice())');

add('option/as_deref_mut', 'as_deref_mut', null, 'How Option::as_deref_mut works', 'Option<String> → Option<&mut str>, to edit text inside.', {
  rows: [['Some("abc")']], call: 'opt.as_deref_mut().map(|s| s.make_ascii_uppercase());', note: 'borrow the inner text mutably', outs: ['Some("ABC")'],
  intro: 'as_deref_mut lends the contents through their Deref target (String → str).',
  steps: [['The String is lent as &mut str.', 0], ['It is upper-cased in place.', [], 'o0']],
  result: 'Some("ABC")', resultCap: 'as_deref is the read-only version.',
}, 'let mut o = Some(String::from("abc")); o.as_deref_mut().map(|s| s.make_ascii_uppercase()); d(o)');

add('option/from', 'from', null, 'How Option::from works', 'Wraps a value in Some.', {
  rows: [['5']], call: 'Option::from(5)', note: 'T → Option<T>', outs: ['Some(5)'],
  intro: 'From<T> for Option<T> makes Some(value).',
  steps: [['5 is wrapped.', 0], ['Some(5).', [], 'o0']],
  result: 'Some(5)', resultCap: 'Lets functions take impl Into<Option<T>>, so callers can pass 5 instead of Some(5).',
}, 'd(Option::from(5))');

// ---------------------------------------------------------------- Result

add('result/as_ref', 'as_ref', RES, 'How Result::as_ref works', 'Borrows the contents: &Result<T, E> → Result<&T, &E>.', {
  rows: [['Ok(String "hi")']], call: 'r.as_ref().map(|s| s.len())', note: 'look without taking', outs: ['Ok(2)', 'r still usable'],
  intro: 'map on a Result consumes it. as_ref first turns it into references, so the original stays.',
  steps: [['as_ref lends the String.', 0, 'o1'], ['map reads its length: 2.', 0, 'o0']],
  result: 'Ok(2)', resultCap: 'as_mut gives mutable references instead.',
}, 'let r: Result<String, String> = Ok(String::from("hi")); let n = r.as_ref().map(|s| s.len()); let _still = &r; d(n)');

add('result/as_mut', 'as_mut', RES, 'How Result::as_mut works', 'Lends the contents mutably: &mut Result<T, E> → Result<&mut T, &mut E>.', {
  rows: [['Ok(1)', 'Err("x")']], call: 'if let Ok(v) = r.as_mut() { *v += 1; }', note: 'edit in place', outs: ['Ok(2)', 'Err("x")'],
  intro: 'as_mut lets you change the Ok (or Err) value without moving it out.',
  steps: [['Ok(1) becomes Ok(2).', 0, 'o0'], ['An Err is left alone here.', 1, 'o1']],
  result: 'Ok(2), Err("x")', resultCap: 'Same idea as Option::as_mut.',
}, 'let mut a: Result<i32, &str> = Ok(1); if let Ok(v) = a.as_mut() { *v += 1; } let mut b: Result<i32, &str> = Err("x"); if let Ok(v) = b.as_mut() { *v += 1; } format!("{:?}, {:?}", a, b)');

add('result/iter', 'iter', RES, 'How Result::iter works', 'An iterator over the Ok value: one item for Ok, none for Err.', {
  rows: [['Ok(3)', 'Err("bad")']], call: 'r.iter().count()', note: 'Err counts as empty', outs: ['1', '0'],
  intro: 'iter treats Ok(v) as [v] and Err as [].',
  steps: [['Ok(3) yields 3.', 0, 'o0'], ['Err yields nothing.', 1, 'o1']],
  result: '1, 0', resultCap: 'Iterating a list of Results with flatten() keeps only the Ok values.',
}, 'let a: Result<i32, &str> = Ok(3); let b: Result<i32, &str> = Err("bad"); format!("{}, {}", a.iter().count(), b.iter().count())');

add('result/inspect', 'inspect', RES, 'How Result::inspect works', 'Looks at the Ok value (for logging) and passes the Result on unchanged.', {
  kind: 'lines', call: '"42".parse::<i32>().inspect(|v| println!("parsed {v}")).map(|v| v * 2)', note: 'peek, then continue',
  lines: ['parse → Ok(42)', 'inspect prints "parsed 42"', 'map → Ok(84)'],
  intro: 'inspect only runs the closure for Ok and returns the same Result.',
  steps: [{ cap: 'The text parses to Ok(42).', show: [0] }, { cap: 'inspect sees 42 (and could log it).', show: [1] }, { cap: 'The chain continues untouched.', show: [2] }],
  result: 'Ok(84)', resultCap: 'inspect_err does the same for errors.',
}, 'let mut seen = 0; let r = "42".parse::<i32>().inspect(|v| seen = *v).map(|v| v * 2); let _ = seen; d(r)');

add('result/expect_err', 'expect_err', RES, 'How Result::expect_err works', 'Gets the error out; panics with your message if it was Ok.', {
  rows: [['Err("boom")', 'Ok(1)']], call: 'r.expect_err("should have failed")', note: 'for tests', outs: ['"boom"', 'panic: should have failed'],
  intro: 'expect_err is expect for the error side, mostly used in tests.',
  steps: [['Err("boom") gives "boom".', 0, 'o0'], ['Ok(1) would panic with the message.', 1, 'o1']],
  result: '"boom"', resultCap: 'unwrap_err does the same with a generic message.',
}, 'let r: Result<i32, &str> = Err("boom"); d(r.expect_err("should have failed"))');

add('result/is_err_and', 'is_err_and', RES, 'How Result::is_err_and works', 'true if it is an Err and the error passes the test.', {
  rows: [['Err(404)', 'Err(500)', 'Ok(200)']], call: 'r.is_err_and(|code| code == 404)', note: 'test the error', outs: ['true', 'false', 'false'],
  intro: 'is_err_and combines is_err() with a check of the error value.',
  steps: [['Err(404): true.', 0, 'o0'], ['Err(500) fails the test: false.', 1, 'o1'], ['Ok is never true here.', 2, 'o2']],
  result: 'true, false, false', resultCap: 'is_ok_and is the Ok-side twin.',
}, 'let f = |r: Result<i32, i32>| r.is_err_and(|c| c == 404); format!("{}, {}, {}", f(Err(404)), f(Err(500)), f(Ok(200)))');

add('result/copied', 'copied', RES, 'How Result::copied works', 'Result<&T, E> → Result<T, E> by copying the value.', {
  rows: [['Ok(&5)']], call: 'v.first().ok_or("empty").copied()', note: 'drop the reference', outs: ['Ok(5)'],
  intro: 'copied works for Copy types like numbers.',
  steps: [['Ok holds a reference to 5.', 0], ['copied gives Ok(5) itself.', [], 'o0']],
  result: 'Ok(5)', resultCap: 'cloned does the same for types that are Clone but not Copy.',
}, 'let v = vec![5, 6]; d(v.first().ok_or("empty").copied())');

add('result/cloned', 'cloned', RES, 'How Result::cloned works', 'Result<&T, E> → Result<T, E> by cloning the value.', {
  rows: [['Ok(&"ann")']], call: 'names.first().ok_or("empty").cloned()', note: 'an owned copy', outs: ['Ok("ann")'],
  intro: 'cloned calls clone() on the borrowed value.',
  steps: [['Ok holds &String.', 0], ['cloned gives an owned String.', [], 'o0']],
  result: 'Ok("ann")', resultCap: 'Use it when the Result must outlive the borrowed collection.',
}, 'let names = vec![String::from("ann")]; d(names.first().ok_or("empty").cloned())');

add('result/as_deref', 'as_deref', RES, 'How Result::as_deref works', 'Result<String, E> → Result<&str, &E>.', {
  rows: [['Ok(String "id-7")']], call: 'r.as_deref() == Ok("id-7")', note: 'compare without cloning', outs: ['true'],
  intro: 'as_deref borrows the Ok value through Deref, so a String becomes &str.',
  steps: [['Ok(String) becomes Ok(&str).', 0], ['Now it compares with a literal.', [], 'o0']],
  result: 'true', resultCap: 'Same idea as Option::as_deref.',
}, 'let r: Result<String, ()> = Ok(String::from("id-7")); (r.as_deref() == Ok("id-7")).to_string()');

add('result/into_iter', 'into_iter', RES, 'How Result::into_iter works', 'Consumes the Result: one item for Ok, none for Err.', {
  rows: [['Ok(1)', 'Err', 'Ok(3)']], call: 'results.into_iter().flatten().collect::<Vec<_>>()', note: 'keep the successes', outs: ['1', '3'],
  intro: 'flatten() uses each Result\'s into_iter, so Errs simply disappear.',
  steps: [['Ok(1) yields 1.', 0, 'o0'], ['Err yields nothing.', 1, 'x'], ['Ok(3) yields 3.', 2, 'o1']],
  result: '[1, 3]', resultCap: 'To stop at the first error instead, collect into Result<Vec<_>, _>.',
}, 'let rs: Vec<Result<i32, &str>> = vec![Ok(1), Err("x"), Ok(3)]; d(rs.into_iter().flatten().collect::<Vec<_>>())');

add('result/iter_mut', 'iter_mut', RES, 'How Result::iter_mut works', 'A mutable iterator over the Ok value (0 or 1 items).', {
  rows: [['Ok(10)']], call: 'for v in r.iter_mut() { *v += 1; }', note: 'edit the Ok value', outs: ['Ok(11)'],
  intro: 'For Err the loop body never runs.',
  steps: [['The Ok value is 10.', 0], ['It becomes 11.', [], 'o0']],
  result: 'Ok(11)', resultCap: 'if let Ok(v) = &mut r is usually clearer.',
}, 'let mut r: Result<i32, ()> = Ok(10); for v in r.iter_mut() { *v += 1; } d(r)');

// ---------------------------------------------------------------- Rc and rc::Weak

add('rc/new', 'new', RC, 'How Rc::new works', 'Puts a value on the heap with a reference count of 1.', {
  rows: [['vec![1, 2]']], call: 'let a = Rc::new(vec![1, 2]);', note: 'shared ownership starts here', outs: ['strong_count = 1'],
  intro: 'Rc = reference counted. Clones share the same value; it is freed when the count reaches 0.',
  steps: [['The Vec moves into a new heap block.', 0], ['One owner so far.', [], 'o0']],
  result: '1', resultCap: 'Rc is for one thread; use Arc to share across threads.',
}, 'let a = Rc::new(vec![1, 2]); Rc::strong_count(&a).to_string()');

add('rc/ptr_eq', 'ptr_eq', RC, 'How Rc::ptr_eq works', 'true if two Rcs point at the very same value, not just equal ones.', {
  rows: [['a', 'b = a.clone()', 'c = Rc::new(same value)']], call: 'Rc::ptr_eq(&a, &b)', note: 'identity, not equality', outs: ['a, b: true', 'a, c: false'],
  intro: 'a == c compares the values; ptr_eq compares the addresses.',
  steps: [['b is a clone of a: same allocation, true.', [0, 1], 'o0'], ['c holds an equal value in another allocation: false.', [0, 2], 'o1']],
  result: 'true, false', resultCap: 'Useful in graphs to check whether two nodes are the same node.',
}, 'let a = Rc::new(5); let b = Rc::clone(&a); let c = Rc::new(5); format!("{}, {}", Rc::ptr_eq(&a, &b), Rc::ptr_eq(&a, &c))');

add('rc/get_mut', 'get_mut', RC, 'How Rc::get_mut works', 'Gives &mut to the value only if this is the only owner.', {
  rows: [['alone', 'shared']], call: 'Rc::get_mut(&mut a)', note: 'mutation needs uniqueness', outs: ['Some(&mut 5)', 'None'],
  intro: 'With one owner, changing the value is safe. With several, it would surprise the others.',
  steps: [['Only one Rc exists: Some.', 0, 'o0'], ['After a clone, two exist: None.', 1, 'o1']],
  result: 'true, false', resultCap: 'make_mut clones the value instead of returning None.',
}, 'let mut a = Rc::new(5); let first = Rc::get_mut(&mut a).is_some(); let _b = Rc::clone(&a); let second = Rc::get_mut(&mut a).is_some(); format!("{}, {}", first, second)');

add('rc/weak_count', 'weak_count', RC, 'How Rc::weak_count works', 'How many Weak pointers point at the value.', {
  rows: [['Rc', 'Weak 1', 'Weak 2']], call: 'Rc::weak_count(&a)', note: 'Weak pointers do not own', outs: ['2'],
  intro: 'Each Rc::downgrade adds one Weak.',
  steps: [['Two Weak pointers were made.', [1, 2]], ['weak_count is 2; strong_count is still 1.', [], 'o0']],
  result: '2', resultCap: 'The value is freed when the strong count hits 0, even if Weaks remain.',
}, 'let a = Rc::new(1); let _w1 = Rc::downgrade(&a); let _w2 = Rc::downgrade(&a); Rc::weak_count(&a).to_string()');

add('rc/into_inner', 'into_inner', RC, 'How Rc::into_inner works', 'Takes the value out if this was the last owner; otherwise None.', {
  rows: [['a, b share "x"']], call: 'Rc::into_inner(a)', note: 'the last one out gets the value', outs: ['a → None', 'b → Some("x")'],
  intro: 'Each call gives up one owner. Only the last owner receives the value.',
  steps: [['a is not the last owner: None (a is dropped).', 0, 'o0'], ['b is now the only owner: Some("x").', 0, 'o1']],
  result: 'None, Some("x")', resultCap: 'Unlike try_unwrap, it never hands the Rc back, so no value is ever lost by accident.',
}, 'let a = Rc::new("x"); let b = Rc::clone(&a); let x = Rc::into_inner(a); let y = Rc::into_inner(b); format!("{:?}, {:?}", x, y)');

add('rc/unwrap_or_clone', 'unwrap_or_clone', RC, 'How Rc::unwrap_or_clone works', 'Gets an owned value: moves it out if unique, clones it if shared.', {
  rows: [['unique Rc', 'shared Rc']], call: 'Rc::unwrap_or_clone(rc)', note: 'always gives a T', outs: ['moved out', 'cloned'],
  intro: 'You always get the value; a clone only happens when necessary.',
  steps: [['Unique: no copy needed.', 0, 'o0'], ['Shared: the value is cloned, the others keep theirs.', 1, 'o1']],
  result: '"a", "b"', resultCap: 'Arc::unwrap_or_clone works the same across threads.',
}, 'let a = Rc::new(String::from("a")); let x = Rc::unwrap_or_clone(a); let b = Rc::new(String::from("b")); let _keep = Rc::clone(&b); let y = Rc::unwrap_or_clone(b); format!("{:?}, {:?}", x, y)');

add('rc/new_cyclic', 'new_cyclic', RC, 'How Rc::new_cyclic works', 'Creates a value that holds a Weak pointer to itself.', {
  rows: [['Node { me: Weak }']], call: 'Rc::new_cyclic(|me| Node { me: me.clone() })', note: 'self-reference without a leak', outs: ['me.upgrade() is Some'],
  intro: 'The closure receives the future Weak pointer before the value exists.',
  steps: [['The Node stores a Weak to itself.', 0], ['After creation, that Weak upgrades to the same Rc.', [], 'o0']],
  result: 'true', resultCap: 'Used for trees where nodes need to hand out pointers to themselves.',
}, 'struct Node { me: std::rc::Weak<Node> } let n = Rc::new_cyclic(|me| Node { me: me.clone() }); Rc::ptr_eq(&n.me.upgrade().unwrap(), &n).to_string()');

add('weak/new', 'new', RCWEAK, 'How Weak::new works', 'An empty Weak that points at nothing yet.', {
  rows: [['Weak::new()']], call: 'let w: Weak<i32> = Weak::new();', note: 'a placeholder', outs: ['upgrade() → None'],
  intro: 'Weak::new allocates nothing; upgrade always returns None.',
  steps: [['There is no value behind it.', 0], ['upgrade() is None.', [], 'o0']],
  result: 'None', resultCap: 'Typical as the starting value of a parent pointer before it is set.',
}, 'let w: std::rc::Weak<i32> = std::rc::Weak::new(); d(w.upgrade())');

add('weak/strong_count', 'strong_count', RCWEAK, 'How Weak::strong_count works', 'How many Rc owners the value still has, seen from a Weak.', {
  rows: [['while owned', 'after drop']], call: 'w.strong_count()', note: '0 means the value is gone', outs: ['1', '0'],
  intro: 'A Weak can check whether its value is still alive.',
  steps: [['One Rc owns the value: 1.', 0, 'o0'], ['The Rc was dropped: 0.', 1, 'o1']],
  result: '1, 0', resultCap: 'upgrade() is the usual way to both check and use the value.',
}, 'let a = Rc::new(1); let w = Rc::downgrade(&a); let x = w.strong_count(); drop(a); format!("{}, {}", x, w.strong_count())');

// ---------------------------------------------------------------- Arc and sync::Weak

add('arc/new', 'new', ARC, 'How Arc::new works', 'Puts a value on the heap so several threads can share it.', {
  rows: [['vec![1, 2, 3]']], call: 'let data = Arc::new(vec![1, 2, 3]);', note: 'Atomically Reference Counted', outs: ['strong_count = 1'],
  intro: 'Arc works like Rc, but its counter is safe to update from many threads.',
  steps: [['The Vec moves to the heap.', 0], ['One owner so far.', [], 'o0']],
  result: '1', resultCap: 'Clone the Arc for each thread; the data itself is not copied.',
}, 'let data = std::sync::Arc::new(vec![1, 2, 3]); std::sync::Arc::strong_count(&data).to_string()');

add('arc/strong_count', 'strong_count', ARC, 'How Arc::strong_count works', 'How many Arc owners share the value.', {
  rows: [['main', 'thread 1', 'thread 2']], call: 'Arc::strong_count(&data)', note: 'one per clone', outs: ['3'],
  intro: 'Each Arc::clone adds one; each drop subtracts one.',
  steps: [['main plus two clones for threads.', [0, 1, 2]], ['Count: 3.', [], 'o0']],
  result: '3', resultCap: 'With threads running, the number can change at any moment; use it for debugging, not logic.',
}, 'let a = std::sync::Arc::new(0); let _b = a.clone(); let _c = a.clone(); std::sync::Arc::strong_count(&a).to_string()');

add('arc/try_unwrap', 'try_unwrap', ARC, 'How Arc::try_unwrap works', 'Takes the value out if this is the only owner; otherwise gives the Arc back.', {
  rows: [['unique', 'shared']], call: 'Arc::try_unwrap(a)', note: 'Ok(value) or Err(arc)', outs: ['Ok(5)', 'Err(Arc)'],
  intro: 'Once the threads have finished, the last owner can take the data back.',
  steps: [['Only owner: Ok(5).', 0, 'o0'], ['Another clone exists: Err, with the Arc returned.', 1, 'o1']],
  result: 'Ok(5), Err', resultCap: 'Arc::into_inner is a simpler version that returns an Option.',
}, 'let a = std::sync::Arc::new(5); let x = std::sync::Arc::try_unwrap(a); let b = std::sync::Arc::new(5); let _c = b.clone(); let y = std::sync::Arc::try_unwrap(b).is_err(); format!("{:?}, {}", x, if y { "Err" } else { "Ok" })');

add('arc/make_mut', 'make_mut', ARC, 'How Arc::make_mut works', 'Mutable access, cloning the value first if others share it.', {
  rows: [['a, b share [1]']], call: 'Arc::make_mut(&mut a).push(2);', note: 'clone-on-write', outs: ['a = [1, 2]', 'b = [1]'],
  intro: 'b still uses the old value, so a gets a private copy before changing.',
  steps: [['Shared: the Vec is cloned for a.', 0], ['a\'s copy changes; b is untouched.', 0, 'o0,1']],
  result: 'a = [1, 2], b = [1]', resultCap: 'If a was the only owner, no clone happens.',
}, 'let mut a = std::sync::Arc::new(vec![1]); let b = a.clone(); std::sync::Arc::make_mut(&mut a).push(2); format!("a = {:?}, b = {:?}", a, b)');

add('arc/downgrade', 'downgrade', ARC, 'How Arc::downgrade works', 'Makes a thread-safe Weak pointer that does not keep the value alive.', {
  rows: [['Arc "cache"']], call: 'let w = Arc::downgrade(&a);', note: 'observe without owning', outs: ['strong 1', 'weak 1'],
  intro: 'The Weak can later upgrade() to an Arc if the value still exists.',
  steps: [['Strong count stays 1.', 0, 'o0'], ['Weak count is 1.', 0, 'o1']],
  result: 'strong = 1, weak = 1', resultCap: 'Breaks reference cycles between threads\' shared structures.',
}, 'let a = std::sync::Arc::new("cache"); let _w = std::sync::Arc::downgrade(&a); format!("strong = {}, weak = {}", std::sync::Arc::strong_count(&a), std::sync::Arc::weak_count(&a))');

add('arc/ptr_eq', 'ptr_eq', ARC, 'How Arc::ptr_eq works', 'true if two Arcs share the same allocation.', {
  rows: [['a', 'a.clone()', 'Arc::new(same)']], call: 'Arc::ptr_eq(&a, &b)', note: 'identity check', outs: ['true', 'false'],
  intro: 'Equal contents are not enough: it must be the same block of memory.',
  steps: [['A clone shares the allocation: true.', [0, 1], 'o0'], ['A new Arc with an equal value: false.', [0, 2], 'o1']],
  result: 'true, false', resultCap: 'Cheap: it compares two addresses.',
}, 'let a = std::sync::Arc::new(1); let b = a.clone(); let c = std::sync::Arc::new(1); format!("{}, {}", std::sync::Arc::ptr_eq(&a, &b), std::sync::Arc::ptr_eq(&a, &c))');

add('arc/get_mut', 'get_mut', ARC, 'How Arc::get_mut works', '&mut to the value, only when this is the only owner (no Weak either).', {
  rows: [['alone', 'shared']], call: 'Arc::get_mut(&mut a)', note: 'no locking needed when unique', outs: ['Some', 'None'],
  intro: 'A unique Arc can be changed without a Mutex.',
  steps: [['Unique: Some(&mut value).', 0, 'o0'], ['Cloned: None.', 1, 'o1']],
  result: 'true, false', resultCap: 'For shared mutation across threads, use Arc<Mutex<T>>.',
}, 'let mut a = std::sync::Arc::new(1); let x = std::sync::Arc::get_mut(&mut a).is_some(); let _b = a.clone(); let y = std::sync::Arc::get_mut(&mut a).is_some(); format!("{}, {}", x, y)');

add('arc/into_inner', 'into_inner', ARC, 'How Arc::into_inner works', 'Gives the value to whichever owner lets go last.', {
  rows: [['two owners']], call: 'Arc::into_inner(a)', note: 'safe even when threads race', outs: ['first → None', 'last → Some(7)'],
  intro: 'Exactly one of the owners receives Some; the others get None.',
  steps: [['The first owner to let go gets None.', 0, 'o0'], ['The last one gets the value.', 0, 'o1']],
  result: 'None, Some(7)', resultCap: 'Prefer it over try_unwrap when several threads might finish at the same time.',
}, 'let a = std::sync::Arc::new(7); let b = a.clone(); let x = std::sync::Arc::into_inner(a); let y = std::sync::Arc::into_inner(b); format!("{:?}, {:?}", x, y)');

add('arc/unwrap_or_clone', 'unwrap_or_clone', ARC, 'How Arc::unwrap_or_clone works', 'An owned value: moved out if unique, cloned if shared.', {
  rows: [['unique', 'shared']], call: 'Arc::unwrap_or_clone(a)', note: 'always returns T', outs: ['moved', 'cloned'],
  intro: 'No copy unless another owner still needs the value.',
  steps: [['Unique: moved out.', 0, 'o0'], ['Shared: cloned.', 1, 'o1']],
  result: '[1], [2]', resultCap: 'The Rc version works the same.',
}, 'let a = std::sync::Arc::new(vec![1]); let x = std::sync::Arc::unwrap_or_clone(a); let b = std::sync::Arc::new(vec![2]); let _k = b.clone(); let y = std::sync::Arc::unwrap_or_clone(b); format!("{:?}, {:?}", x, y)');

add('arc/weak_count', 'weak_count', ARC, 'How Arc::weak_count works', 'How many sync::Weak pointers point at the value.', {
  rows: [['Arc', 'Weak']], call: 'Arc::weak_count(&a)', note: 'observers', outs: ['1'],
  intro: 'Each Arc::downgrade adds one Weak.',
  steps: [['One Weak exists.', 1], ['weak_count is 1.', [], 'o0']],
  result: '1', resultCap: 'Weak pointers do not keep the value alive.',
}, 'let a = std::sync::Arc::new(1); let _w = std::sync::Arc::downgrade(&a); std::sync::Arc::weak_count(&a).to_string()');

add('arc_weak/upgrade', 'upgrade', ARCWEAK, 'How sync::Weak::upgrade works', 'Turns a Weak back into an Arc if the value still exists.', {
  rows: [['alive', 'dropped']], call: 'w.upgrade()', note: 'Some while alive', outs: ['Some(9)', 'None'],
  intro: 'upgrade atomically checks the strong count and, if it is above zero, adds one.',
  steps: [['An Arc still owns it: Some.', 0, 'o0'], ['The last Arc was dropped: None.', 1, 'o1']],
  result: 'Some(9), None', resultCap: 'Typical for caches and observer lists shared between threads.',
}, 'let a = std::sync::Arc::new(9); let w = std::sync::Arc::downgrade(&a); let x = w.upgrade().map(|v| *v); drop(a); let y = w.upgrade().map(|v| *v); format!("{:?}, {:?}", x, y)');

// ---------------------------------------------------------------- Box

add('box/leak', 'leak', BOX, 'How Box::leak works', 'Gives up ownership forever and returns a &\'static mut reference.', {
  rows: [['Box "config"']], call: "let s: &'static mut str = Box::leak(b);", note: 'never freed', outs: ["&'static str"],
  intro: 'The memory is never freed, so the reference can live for the rest of the program.',
  steps: [['The Box lets go without freeing.', 0], ['You get a reference valid "forever".', [], 'o0']],
  result: '"config"', resultCap: 'For data that lives for the whole program, like settings loaded at start-up. Do not use it in a loop.',
}, 'let b: Box<str> = "config".into(); let s: &\'static mut str = Box::leak(b); d(&*s)');

add('box/pin', 'pin', BOX, 'How Box::pin works', 'Puts a value on the heap and promises it will never move.', {
  rows: [['future']], call: 'let f = Box::pin(async { 1 });', note: 'Pin<Box<T>>', outs: ['Pin<Box<...>>'],
  intro: 'Some values (most futures) must not move once started. Box::pin guarantees that.',
  steps: [['The value goes to the heap.', 0], ['The Pin wrapper forbids moving it out.', [], 'o0']],
  result: '5', resultCap: 'You see Box::pin when storing futures in a struct or returning dyn Future.',
}, 'let p = Box::pin(5); (*p).to_string()');

add('box/into_boxed_slice', 'into_boxed_slice', ['alloc', 'Vec', /vec\/mod\.rs$/], 'How Vec::into_boxed_slice works', 'Turns a Vec into a Box<[T]>: a fixed-size list with no spare capacity.', {
  rows: [['Vec [1, 2, 3] (capacity 10)']], call: 'v.into_boxed_slice()', note: 'cannot grow any more', outs: ['Box<[i32]> [1, 2, 3]'],
  intro: 'Spare capacity is released; the result only knows its length.',
  steps: [['Extra capacity is freed.', 0], ['A boxed slice of 3 items remains.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'into_vec() turns it back into a Vec.',
}, 'let mut v = Vec::with_capacity(10); v.extend([1, 2, 3]); let b: Box<[i32]> = v.into_boxed_slice(); d(b)');

module.exports = list;
