// Rust standard library: the rest of Option and Result, the cell family (Ref/RefMut mapping, Cell, OnceCell,
// LazyCell, UnsafeCell), and the remaining Box, Rc, Arc and Weak methods.
const { group } = require('./kit.cjs');
const OPT = ['core', 'Option', /^src\/option\.rs$/];
const RES = ['core', 'Result', /^src\/result\.rs$/];
const CELL = (o) => ['core', o, /^src\/cell\.rs$/];
const ONCE = ['core', 'OnceCell', /cell\/once\.rs$/];
const LAZY = ['core', 'LazyCell', /cell\/lazy\.rs$/];
const BOX = ['alloc', 'Box', /^src\/boxed\.rs$/];
const RC = ['alloc', 'Rc', /^src\/rc\.rs$/];
const RCW = ['alloc', 'Weak', /^src\/rc\.rs$/];
const ARC = ['alloc', 'Arc', /^src\/sync\.rs$/];
const ARCW = ['alloc', 'Weak', /^src\/sync\.rs$/];
const { list, add } = group({ at: OPT });
const A = 'std::sync::Arc';

// ---------------------------------------------------------------- Option, Result

add('option/as_mut_slice', 'as_mut_slice', null, 'How Option::as_mut_slice works', 'The Option as a mutable slice of length 0 or 1.', {
  rows: [['Some(1)', 'None']], call: 'for x in opt.as_mut_slice() { *x += 1; }', note: 'edit through a slice', outs: ['Some(2)', 'None'],
  intro: 'Some(v) looks like [v], None like [].',
  steps: [['Some(1): the slice has one element, now 2.', 0, 'o0'], ['None: the slice is empty.', 1, 'o1']],
  result: 'Some(2), None', resultCap: 'as_slice is the read-only version.',
}, 'let mut a = Some(1); for x in a.as_mut_slice() { *x += 1; } let mut b: Option<i32> = None; for x in b.as_mut_slice() { *x += 1; } format!("{:?}, {:?}", a, b)');

add('option/as_pin_ref', 'as_pin_ref', null, 'How Option::as_pin_ref works', 'Pin<&Option<T>> → Option<Pin<&T>>.', {
  rows: [['Pin of Some(5)']], call: 'Pin::new(&opt).as_pin_ref()', note: 'pinned contents', outs: ['Some(Pin(&5))'],
  intro: 'Used in async code that keeps an optional future pinned.',
  steps: [['The Option is pinned.', 0], ['Its contents come out pinned too.', [], 'o0']],
  result: 'Some(5)', resultCap: 'as_pin_mut gives Pin<&mut T>.',
}, 'let o = Some(5); let p = std::pin::Pin::new(&o); d(p.as_pin_ref().map(|x| *x))');

add('result/as_deref_mut', 'as_deref_mut', RES, 'How Result::as_deref_mut works', 'Result<String, E> → Result<&mut str, &mut E>.', {
  rows: [['Ok(String "ab")']], call: 'r.as_deref_mut().map(|s| s.make_ascii_uppercase())', note: 'edit through Deref', outs: ['Ok("AB")'],
  intro: 'Borrow the Ok value mutably through its Deref target.',
  steps: [['The String is lent as &mut str.', 0], ['Upper-cased in place.', [], 'o0']],
  result: 'Ok("AB")', resultCap: 'as_deref is the read-only version.',
}, 'let mut r: Result<String, ()> = Ok(String::from("ab")); let _ = r.as_deref_mut().map(|s| s.make_ascii_uppercase()); d(r)');

add('result/flatten', 'flatten', RES, 'How Result::flatten works', 'Result<Result<T, E>, E> → Result<T, E>.', {
  rows: [['Ok(Ok(1))', 'Ok(Err("b"))', 'Err("a")']], call: 'nested.flatten()', note: 'remove one level', outs: ['Ok(1)', 'Err("b")', 'Err("a")'],
  intro: 'The first error, inner or outer, wins.',
  steps: [['Ok(Ok(1)) → Ok(1).', 0, 'o0'], ['Inner error → Err("b").', 1, 'o1'], ['Outer error → Err("a").', 2, 'o2']],
  result: 'Ok(1), Err("b"), Err("a")', resultCap: 'Same as .and_then(|r| r).',
}, 'let a: Result<Result<i32, &str>, &str> = Ok(Ok(1)); let b: Result<Result<i32, &str>, &str> = Ok(Err("b")); let c: Result<Result<i32, &str>, &str> = Err("a"); format!("{:?}, {:?}, {:?}", a.flatten(), b.flatten(), c.flatten())');

// ---------------------------------------------------------------- Cell, RefCell, Ref, RefMut

add('cell/update', 'update', CELL('Cell'), 'How Cell::update works', 'Replaces the value with the result of a function of the old value.', {
  rows: [['Cell(5)']], call: 'c.update(|x| x * 2);', note: 'read-modify-write', outs: ['10'],
  intro: 'get, compute, set, in one call.',
  steps: [['The closure gets 5.', 0], ['10 is stored.', [], 'o0']],
  result: '10', resultCap: 'Only for Copy types, like get().',
}, 'let c = Cell::new(5); c.update(|x| x * 2); c.get().to_string()');

add('cell/from_mut', 'from_mut', CELL('Cell'), 'How Cell::from_mut works', 'Treats a &mut T as a &Cell<T>, so it can be shared and still changed.', {
  rows: [['x = 1']], call: 'let c = Cell::from_mut(&mut x); c.set(2);', note: '&mut T → &Cell<T>', outs: ['x = 2'],
  intro: 'Useful when two places need to change the same value.',
  steps: [['x is viewed as a Cell.', 0], ['set(2) changes x.', [], 'o0']],
  result: '2', resultCap: 'Pairs with as_slice_of_cells for slices.',
}, 'let mut x = 1; { let c = Cell::from_mut(&mut x); c.set(2); } x.to_string()');

add('cell/as_slice_of_cells', 'as_slice_of_cells', CELL('Cell'), 'How Cell::as_slice_of_cells works', 'Turns &Cell<[T]> into &[Cell<T>]: each element becomes its own Cell.', {
  rows: [['[1, 2, 3]']], call: 'let cells = Cell::from_mut(&mut v[..]).as_slice_of_cells();', note: 'change elements while iterating', outs: ['[1, 3, 6]'],
  intro: 'Lets you read one element and write another without borrow errors.',
  steps: [['Each element becomes a Cell.', 0], ['cells[i] += cells[i - 1].', [], 'o0']],
  result: '[1, 3, 6]', resultCap: 'An alternative to index juggling: here a running sum.',
}, 'let mut v = [1, 2, 3]; { let cells = Cell::from_mut(&mut v[..]).as_slice_of_cells(); for w in cells.windows(2) { w[1].set(w[1].get() + w[0].get()); } } d(v)');

add('refcell/get_mut', 'get_mut', CELL('RefCell'), 'How RefCell::get_mut works', 'A normal &mut to the value, when you own the RefCell exclusively.', {
  rows: [['RefCell(vec![1])']], call: 'c.get_mut().push(2);', note: 'no runtime check', outs: ['[1, 2]'],
  intro: '&mut RefCell already proves nobody else is borrowing.',
  steps: [['get_mut lends the Vec.', 0], ['2 is pushed.', [], 'o0']],
  result: '[1, 2]', resultCap: 'Cheaper than borrow_mut.',
}, 'let mut c = RefCell::new(vec![1]); c.get_mut().push(2); d(c.into_inner())');

add('ref/map', 'map', CELL('Ref'), 'How Ref::map works', 'Narrows a RefCell borrow down to one part of the value.', {
  rows: [['RefCell((1, "x"))']], call: 'let name = Ref::map(c.borrow(), |t| &t.1);', note: 'borrow a field', outs: ['"x"'],
  intro: 'The borrow stays active while the narrowed Ref lives.',
  steps: [['Borrow the whole tuple.', 0], ['Keep only a reference to field 1.', [], 'o0']],
  result: '"x"', resultCap: 'Return a borrowed field from a method without exposing the whole RefCell.',
}, 'use std::cell::Ref; let c = RefCell::new((1, "x")); let n = Ref::map(c.borrow(), |t| &t.1); d(*n)');

add('ref/filter_map', 'filter_map', CELL('Ref'), 'How Ref::filter_map works', 'Narrows a borrow to a part that might not exist.', {
  rows: [['RefCell(vec![10, 20])']], call: 'Ref::filter_map(c.borrow(), |v| v.get(5))', note: 'Ok(Ref) or Err(original)', outs: ['index 1: Ok(20)', 'index 5: Err'],
  intro: 'On failure you get the original borrow back.',
  steps: [['get(1) is Some: Ok.', 0, 'o0'], ['get(5) is None: Err.', 0, 'o1']],
  result: 'Ok(20), Err', resultCap: 'RefMut::filter_map is the mutable version.',
}, 'use std::cell::Ref; let c = RefCell::new(vec![10, 20]); let a = Ref::filter_map(c.borrow(), |v| v.get(1)).map(|r| *r).ok(); let b = Ref::filter_map(c.borrow(), |v| v.get(5)).is_err(); format!("Ok({}), {}", a.unwrap(), if b { "Err" } else { "Ok" })');

add('ref/map_split', 'map_split', CELL('Ref'), 'How Ref::map_split works', 'Splits one borrow into two borrows of different parts.', {
  rows: [['RefCell([1, 2, 3, 4])']], call: 'let (a, b) = Ref::map_split(c.borrow(), |v| v.split_at(2));', note: 'two views', outs: ['a = [1, 2]', 'b = [3, 4]'],
  intro: 'Both halves stay borrowed until dropped.',
  steps: [['First half.', 0, 'o0'], ['Second half.', 0, 'o1']],
  result: '[1, 2], [3, 4]', resultCap: 'RefMut::map_split gives two mutable halves.',
}, 'use std::cell::Ref; let c = RefCell::new(vec![1, 2, 3, 4]); let (a, b) = Ref::map_split(c.borrow(), |v| v.split_at(2)); format!("{:?}, {:?}", &*a, &*b)');

add('ref/clone', 'clone', CELL('Ref'), 'How Ref::clone works', 'Makes another shared borrow of the same RefCell.', {
  rows: [['c.borrow()']], call: 'let r2 = Ref::clone(&r1);', note: 'two readers', outs: ['both see 5'],
  intro: 'Written Ref::clone(&r) on purpose, so it is not confused with cloning the value.',
  steps: [['r1 borrows the value.', 0], ['r2 is a second borrow.', [], 'o0']],
  result: '5, 5', resultCap: 'Both must be dropped before borrow_mut works again.',
}, 'use std::cell::Ref; let c = RefCell::new(5); let r1 = c.borrow(); let r2 = Ref::clone(&r1); format!("{}, {}", *r1, *r2)');

add('refmut/map', 'map', CELL('RefMut'), 'How RefMut::map works', 'Narrows a mutable borrow to one part of the value.', {
  rows: [['RefCell((0, "x"))']], call: '*RefMut::map(c.borrow_mut(), |t| &mut t.0) += 5;', note: 'mutably borrow a field', outs: ['(5, "x")'],
  intro: 'Only the field is reachable through the new RefMut.',
  steps: [['Borrow the tuple mutably.', 0], ['Change field 0.', [], 'o0']],
  result: '(5, "x")', resultCap: 'Ref::map is the read-only version.',
}, 'use std::cell::RefMut; let c = RefCell::new((0, "x")); *RefMut::map(c.borrow_mut(), |t| &mut t.0) += 5; d(c.into_inner())');

add('refmut/filter_map', 'filter_map', CELL('RefMut'), 'How RefMut::filter_map works', 'Narrows a mutable borrow to a part that might not exist.', {
  rows: [['RefCell(vec![1])']], call: 'RefMut::filter_map(c.borrow_mut(), |v| v.get_mut(0))', note: 'maybe-there element', outs: ['[9]'],
  intro: 'Err gives the original RefMut back.',
  steps: [['Index 0 exists.', 0], ['It becomes 9.', [], 'o0']],
  result: '[9]', resultCap: 'Useful for optional fields inside a RefCell.',
}, 'use std::cell::RefMut; let c = RefCell::new(vec![1]); if let Ok(mut x) = RefMut::filter_map(c.borrow_mut(), |v| v.get_mut(0)) { *x = 9; } d(c.into_inner())');

add('refmut/map_split', 'map_split', CELL('RefMut'), 'How RefMut::map_split works', 'Splits one mutable borrow into two mutable borrows of different parts.', {
  rows: [['RefCell([1, 2, 3, 4])']], call: 'RefMut::map_split(c.borrow_mut(), |v| v.split_at_mut(2))', note: 'two writers', outs: ['[3, 4, 1, 2]'],
  intro: 'The halves do not overlap, so both can be changed.',
  steps: [['Two mutable halves.', 0], ['Swap their contents.', [], 'o0']],
  result: '[3, 4, 1, 2]', resultCap: 'The same idea as split_at_mut, inside a RefCell.',
}, 'use std::cell::RefMut; let c = RefCell::new(vec![1, 2, 3, 4]); { let (mut a, mut b) = RefMut::map_split(c.borrow_mut(), |v| v.split_at_mut(2)); a.swap_with_slice(&mut b); } d(c.into_inner())');

add('unsafecell/get_mut', 'get_mut', CELL('UnsafeCell'), 'How UnsafeCell::get_mut works', 'A safe &mut to the value when you own the UnsafeCell exclusively.', {
  rows: [['UnsafeCell(1)']], call: '*u.get_mut() += 1;', note: 'the building block of all cells', outs: ['2'],
  intro: 'UnsafeCell is what Cell, RefCell and Mutex are built on. With &mut, no unsafe is needed.',
  steps: [['get_mut lends the value.', 0], ['It becomes 2.', [], 'o0']],
  result: '2', resultCap: 'Shared mutation through UnsafeCell::get requires unsafe code.',
}, 'let mut u = std::cell::UnsafeCell::new(1); *u.get_mut() += 1; u.into_inner().to_string()');

add('unsafecell/into_inner', 'into_inner', CELL('UnsafeCell'), 'How UnsafeCell::into_inner works', 'Unwraps the UnsafeCell and returns the value.', {
  rows: [['UnsafeCell("v")']], call: 'u.into_inner()', note: 'safe: you own it', outs: ['"v"'],
  intro: 'Owning the cell means nobody else can be using it.',
  steps: [['The cell is consumed.', 0], ['"v" comes out.', [], 'o0']],
  result: '"v"', resultCap: 'Same as Cell::into_inner.',
}, 'let u = std::cell::UnsafeCell::new("v"); d(u.into_inner())');

add('unsafecell/new', 'new', CELL('UnsafeCell'), 'How UnsafeCell::new works', 'Wraps a value so the compiler allows mutation through shared references (with unsafe code).', {
  rows: [['7']], call: 'let u = UnsafeCell::new(7);', note: 'for building your own cell types', outs: ['UnsafeCell(7)'],
  intro: 'Normal code should use Cell, RefCell or Mutex instead.',
  steps: [['7 is wrapped.', 0], ['Reading it back gives 7.', [], 'o0']],
  result: '7', resultCap: 'get() returns a raw pointer to the value.',
}, 'let u = std::cell::UnsafeCell::new(7); u.into_inner().to_string()');

add('oncecell/new', 'new', ONCE, 'How OnceCell::new works', 'An empty cell that can be filled exactly once.', {
  rows: [['OnceCell::new()']], call: 'let c: OnceCell<String> = OnceCell::new();', note: 'starts empty', outs: ['get() = None'],
  intro: 'Fill it later with set or get_or_init.',
  steps: [['The cell is empty.', 0], ['get() is None.', [], 'o0']],
  result: 'None', resultCap: 'OnceLock is the thread-safe version.',
}, 'let c: std::cell::OnceCell<String> = std::cell::OnceCell::new(); d(c.get())');

add('oncecell/get_mut', 'get_mut', ONCE, 'How OnceCell::get_mut works', 'A mutable reference to the value, if set.', {
  rows: [['OnceCell(vec![1])']], call: 'if let Some(v) = c.get_mut() { v.push(2); }', note: 'needs &mut', outs: ['[1, 2]'],
  intro: 'With exclusive access, the stored value can be changed.',
  steps: [['The cell holds [1].', 0], ['2 is pushed.', [], 'o0']],
  result: '[1, 2]', resultCap: 'None if the cell is still empty.',
}, 'let mut c = std::cell::OnceCell::new(); let _ = c.set(vec![1]); if let Some(v) = c.get_mut() { v.push(2); } d(c.get().unwrap())');

add('oncecell/take', 'take', ONCE, 'How OnceCell::take works', 'Takes the value out and leaves the cell empty again.', {
  rows: [['OnceCell("x")']], call: 'c.take()', note: 'reset', outs: ['Some("x")', 'cell empty'],
  intro: 'Needs &mut, so nobody else can be reading.',
  steps: [['The value comes out.', 0, 'o0'], ['The cell is empty and can be set again.', 0, 'o1']],
  result: 'Some("x"), None', resultCap: 'into_inner consumes the cell instead.',
}, 'let mut c = std::cell::OnceCell::new(); let _ = c.set("x"); let t = c.take(); format!("{:?}, {:?}", t, c.get())');

add('oncecell/into_inner', 'into_inner', ONCE, 'How OnceCell::into_inner works', 'Unwraps the cell: Some(value) if it was set.', {
  rows: [['set', 'empty']], call: 'c.into_inner()', note: 'consumes the cell', outs: ['Some(1)', 'None'],
  intro: 'An empty cell gives None.',
  steps: [['Set: Some(1).', 0, 'o0'], ['Empty: None.', 1, 'o1']],
  result: 'Some(1), None', resultCap: 'take() does the same without consuming.',
}, 'let a = std::cell::OnceCell::new(); let _ = a.set(1); let b: std::cell::OnceCell<i32> = std::cell::OnceCell::new(); format!("{:?}, {:?}", a.into_inner(), b.into_inner())');

add('lazycell/new', 'new', LAZY, 'How LazyCell::new works', 'Stores a closure that computes the value on first use.', {
  rows: [['|| expensive()']], call: 'let config = LazyCell::new(|| load());', note: 'nothing runs yet', outs: ['computed on first *config'],
  intro: 'The closure runs at most once.',
  steps: [['Only the closure is stored.', 0], ['The first access runs it.', [], 'o0']],
  result: 'ran 1 time, value 42', resultCap: 'LazyLock is the thread-safe version.',
}, 'let mut n = 0; let v = { let l = std::cell::LazyCell::new(|| { n += 1; 42 }); let a = *l; let b = *l; a + b - 42 }; format!("ran {} time, value {}", n, v)');

add('lazycell/force_mut', 'force_mut', LAZY, 'How LazyCell::force_mut works', 'Forces initialisation and gives &mut to the value.', {
  rows: [['LazyCell(|| vec![1])']], call: 'LazyCell::force_mut(&mut lazy).push(2);', note: 'init, then edit', outs: ['[1, 2]'],
  intro: 'Needs &mut access to the LazyCell.',
  steps: [['The closure runs: [1].', 0], ['2 is pushed.', [], 'o0']],
  result: '[1, 2]', resultCap: 'force() gives a shared reference.',
}, 'let mut l = std::cell::LazyCell::new(|| vec![1]); std::cell::LazyCell::force_mut(&mut l).push(2); d(&*l)');

// ---------------------------------------------------------------- Box

add('box/downcast', 'downcast', ['alloc', 'Box', new RegExp('boxed[/]convert[.]rs$')], 'How Box<dyn Any>::downcast works', 'Gets the concrete type back out of a Box<dyn Any>.', {
  rows: [['Box<dyn Any> holding 5i32']], call: 'b.downcast::<i32>()', note: 'Ok(Box<T>) or Err(original)', outs: ['Ok(5)', 'as String: Err'],
  intro: 'Checked at run time.',
  steps: [['It is an i32: Ok.', 0, 'o0'], ['Asking for String would give Err.', 0, 'o1']],
  result: 'Ok(5), Err', resultCap: 'Panic payloads arrive as Box<dyn Any + Send>.',
}, 'let a: Box<dyn std::any::Any> = Box::new(5i32); let b: Box<dyn std::any::Any> = Box::new(5i32); format!("Ok({}), {}", *a.downcast::<i32>().unwrap(), if b.downcast::<String>().is_err() { "Err" } else { "Ok" })');

add('box/into_pin', 'into_pin', BOX, 'How Box::into_pin works', 'Turns a Box into a Pin<Box<T>>, promising the value never moves again.', {
  rows: [['Box(future)']], call: 'let pinned = Box::into_pin(b);', note: 'pin an existing box', outs: ['Pin<Box<T>>'],
  intro: 'Box::pin builds a new pinned box; into_pin pins one you already have.',
  steps: [['The Box is consumed.', 0], ['The value is now pinned on the heap.', [], 'o0']],
  result: '3', resultCap: 'Needed when storing futures to poll later.',
}, 'let p = Box::into_pin(Box::new(3)); (*p).to_string()');

add('box/into_raw', 'into_raw', BOX, 'How Box::into_raw works', 'Gives up the Box and returns a raw pointer; you must free it later.', {
  rows: [['Box(42)']], call: 'let p = Box::into_raw(b); unsafe { drop(Box::from_raw(p)) }', note: 'manual memory', outs: ['raw pointer, then freed'],
  intro: 'For handing memory to C code; Box::from_raw takes it back.',
  steps: [['The Box becomes a raw pointer.', 0], ['from_raw rebuilds the Box so it is freed.', [], 'o0']],
  result: '42', resultCap: 'Forgetting from_raw leaks memory.',
}, 'let p = Box::into_raw(Box::new(42)); let b = unsafe { Box::from_raw(p) }; b.to_string()');

add('box/new_uninit', 'new_uninit', BOX, 'How Box::new_uninit works', 'Allocates space on the heap without initialising it yet.', {
  rows: [['Box<MaybeUninit<u64>>']], call: 'let b = Box::<u64>::new_uninit(); let b = Box::write(b, 7);', note: 'allocate first, fill later', outs: ['Box(7)'],
  intro: 'Box::write fills it safely and gives a normal Box.',
  steps: [['Memory is reserved but empty.', 0], ['write stores 7.', [], 'o0']],
  result: '7', resultCap: 'Avoids building large values on the stack first.',
}, 'let b = Box::<u64>::new_uninit(); let b = Box::write(b, 7); b.to_string()');

add('box/write', 'write', BOX, 'How Box::write works', 'Fills an uninitialised Box and returns an initialised one.', {
  rows: [['Box<MaybeUninit<[u8; 4]>>']], call: 'Box::write(uninit, [1, 2, 3, 4])', note: 'safe initialisation', outs: ['Box([1, 2, 3, 4])'],
  intro: 'The value is written straight into the heap memory.',
  steps: [['The box is empty.', 0], ['The array is written.', [], 'o0']],
  result: '[1, 2, 3, 4]', resultCap: 'No unsafe needed.',
}, 'd(Box::write(Box::<[u8; 4]>::new_uninit(), [1, 2, 3, 4]))');

// ---------------------------------------------------------------- Rc, rc::Weak

add('rc/downcast', 'downcast', RC, 'How Rc<dyn Any>::downcast works', 'Gets the concrete type back from an Rc<dyn Any>.', {
  rows: [['Rc<dyn Any> holding "hi"']], call: 'rc.downcast::<&str>()', note: 'Ok(Rc<T>) or Err', outs: ['Ok("hi")'],
  intro: 'Checked at run time.',
  steps: [['The type matches.', 0], ['Ok(Rc<&str>).', [], 'o0']],
  result: 'Ok("hi")', resultCap: 'Arc has the same for Arc<dyn Any + Send + Sync>.',
}, 'let r: Rc<dyn std::any::Any> = Rc::new("hi"); format!("Ok({:?})", *r.downcast::<&str>().unwrap())');

add('rc/pin', 'pin', RC, 'How Rc::pin works', 'A shared, pinned value: Pin<Rc<T>>.', {
  rows: [['5']], call: 'let p = Rc::pin(5);', note: 'pinned and shared', outs: ['Pin<Rc<i32>>'],
  intro: 'The value can never move, and clones share it.',
  steps: [['The value goes into an Rc.', 0], ['It is pinned.', [], 'o0']],
  result: '5', resultCap: 'Box::pin is the single-owner version.',
}, 'let p = Rc::pin(5); (*p).to_string()');

add('rc/as_ptr', 'as_ptr', RC, 'How Rc::as_ptr works', 'A raw pointer to the shared value.', {
  rows: [['a', 'a.clone()']], call: 'Rc::as_ptr(&a) == Rc::as_ptr(&b)', note: 'same address', outs: ['true'],
  intro: 'All clones point to the same allocation.',
  steps: [['Both pointers are compared.', [0, 1]], ['Equal: true.', [], 'o0']],
  result: 'true', resultCap: 'Rc::ptr_eq does this comparison for you.',
}, 'let a = Rc::new(1); let b = Rc::clone(&a); (Rc::as_ptr(&a) == Rc::as_ptr(&b)).to_string()');

add('rc_weak/ptr_eq', 'ptr_eq', RCW, 'How rc::Weak::ptr_eq works', 'true if two Weak pointers point to the same allocation.', {
  rows: [['w1, w2 from the same Rc', 'w3 from another']], call: 'w1.ptr_eq(&w2)', note: 'identity', outs: ['true', 'false'],
  intro: 'Works even after the value is gone.',
  steps: [['Same Rc: true.', 0, 'o0'], ['Different Rc: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Useful for removing a specific observer from a list.',
}, 'let a = Rc::new(1); let b = Rc::new(1); let w1 = Rc::downgrade(&a); let w2 = Rc::downgrade(&a); let w3 = Rc::downgrade(&b); format!("{}, {}", w1.ptr_eq(&w2), w1.ptr_eq(&w3))');

add('rc_weak/weak_count', 'weak_count', RCW, 'How rc::Weak::weak_count works', 'How many Weak pointers exist, seen from a Weak.', {
  rows: [['Rc', 'Weak', 'Weak']], call: 'w.weak_count()', note: '0 once the value is gone', outs: ['2'],
  intro: 'Counts all Weak pointers to the allocation.',
  steps: [['Two Weaks exist.', [1, 2]], ['weak_count is 2.', [], 'o0']],
  result: '2', resultCap: 'Returns 0 if no strong owner is left.',
}, 'let a = Rc::new(1); let w1 = Rc::downgrade(&a); let _w2 = Rc::downgrade(&a); w1.weak_count().to_string()');

// ---------------------------------------------------------------- Arc, sync::Weak

add('arc/new_cyclic', 'new_cyclic', ARC, 'How Arc::new_cyclic works', 'Creates an Arc whose value holds a Weak pointer to itself.', {
  rows: [['Node { me: Weak }']], call: 'Arc::new_cyclic(|me| Node { me: me.clone() })', note: 'thread-safe self-reference', outs: ['me upgrades to itself'],
  intro: 'The closure gets the Weak before the value exists.',
  steps: [['The node stores a Weak to itself.', 0], ['Upgrading it gives the same Arc.', [], 'o0']],
  result: 'true', resultCap: 'Rc::new_cyclic is the single-thread version.',
}, `struct N { me: std::sync::Weak<N> } let n = ${A}::new_cyclic(|me| N { me: me.clone() }); ${A}::ptr_eq(&n.me.upgrade().unwrap(), &n).to_string()`);

add('arc/pin', 'pin', ARC, 'How Arc::pin works', 'A pinned value shared across threads: Pin<Arc<T>>.', {
  rows: [['9']], call: 'let p = Arc::pin(9);', note: 'pinned and shareable', outs: ['Pin<Arc<i32>>'],
  intro: 'Clones share the same pinned value.',
  steps: [['The value goes into an Arc.', 0], ['It is pinned.', [], 'o0']],
  result: '9', resultCap: 'Used for futures shared between tasks.',
}, `let p = ${A}::pin(9); (*p).to_string()`);

add('arc/downcast', 'downcast', ARC, 'How Arc<dyn Any>::downcast works', 'Gets the concrete type back from an Arc<dyn Any + Send + Sync>.', {
  rows: [['Arc<dyn Any> holding 1.5']], call: 'a.downcast::<f64>()', note: 'Ok(Arc<T>) or Err', outs: ['Ok(1.5)'],
  intro: 'Checked at run time.',
  steps: [['The type matches.', 0], ['Ok(Arc<f64>).', [], 'o0']],
  result: 'Ok(1.5)', resultCap: 'Err returns the original Arc.',
}, `let a: ${A}<dyn std::any::Any + Send + Sync> = ${A}::new(1.5f64); format!("Ok({})", *a.downcast::<f64>().unwrap())`);

add('arc/as_ptr', 'as_ptr', ARC, 'How Arc::as_ptr works', 'A raw pointer to the shared value.', {
  rows: [['a', 'a.clone()']], call: 'Arc::as_ptr(&a) == Arc::as_ptr(&b)', note: 'same allocation', outs: ['true'],
  intro: 'Every clone points to the same place.',
  steps: [['Compare the two pointers.', [0, 1]], ['Equal: true.', [], 'o0']],
  result: 'true', resultCap: 'Arc::ptr_eq is the convenient form.',
}, `let a = ${A}::new(1); let b = a.clone(); (${A}::as_ptr(&a) == ${A}::as_ptr(&b)).to_string()`);

add('arc_weak/new', 'new', ARCW, 'How sync::Weak::new works', 'An empty thread-safe Weak that points nowhere.', {
  rows: [['Weak::new()']], call: 'let w: Weak<i32> = Weak::new();', note: 'a placeholder', outs: ['upgrade() → None'],
  intro: 'No allocation; upgrade always returns None.',
  steps: [['Nothing behind it.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Starting value for a parent pointer.',
}, 'let w: std::sync::Weak<i32> = std::sync::Weak::new(); d(w.upgrade())');

add('arc_weak/strong_count', 'strong_count', ARCW, 'How sync::Weak::strong_count works', 'How many Arc owners remain, seen from a Weak.', {
  rows: [['alive', 'dropped']], call: 'w.strong_count()', note: '0 = gone', outs: ['1', '0'],
  intro: 'Lets a Weak check whether the value still exists.',
  steps: [['One Arc: 1.', 0, 'o0'], ['After drop: 0.', 1, 'o1']],
  result: '1, 0', resultCap: 'upgrade() is the usual way to use it.',
}, `let a = ${A}::new(1); let w = ${A}::downgrade(&a); let x = w.strong_count(); drop(a); format!("{}, {}", x, w.strong_count())`);

add('arc_weak/weak_count', 'weak_count', ARCW, 'How sync::Weak::weak_count works', 'How many Weak pointers exist, seen from a Weak.', {
  rows: [['Arc', 'Weak', 'Weak']], call: 'w.weak_count()', note: 'observers', outs: ['2'],
  intro: 'Counts the Weak pointers to the allocation.',
  steps: [['Two Weaks.', [1, 2]], ['2.', [], 'o0']],
  result: '2', resultCap: '0 once the last Arc is gone.',
}, `let a = ${A}::new(1); let w1 = ${A}::downgrade(&a); let _w2 = ${A}::downgrade(&a); w1.weak_count().to_string()`);

add('arc_weak/ptr_eq', 'ptr_eq', ARCW, 'How sync::Weak::ptr_eq works', 'true if two Weak pointers share an allocation.', {
  rows: [['same Arc', 'other Arc']], call: 'w1.ptr_eq(&w2)', note: 'identity', outs: ['true', 'false'],
  intro: 'Compares addresses, not values.',
  steps: [['Same: true.', 0, 'o0'], ['Different: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Same as rc::Weak::ptr_eq.',
}, `let a = ${A}::new(1); let b = ${A}::new(1); let w1 = ${A}::downgrade(&a); let w2 = ${A}::downgrade(&a); let w3 = ${A}::downgrade(&b); format!("{}, {}", w1.ptr_eq(&w2), w1.ptr_eq(&w3))`);

module.exports = list;
