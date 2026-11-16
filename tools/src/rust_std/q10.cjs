// Rust standard library: the rest of std::thread (thread_local! keys, scoped threads, park/unpark, Thread,
// Builder) and the rest of the atomics (AtomicBool, AtomicPtr, more AtomicI*/U* operations, fences).
const { group } = require('./kit.cjs');
const T = (o, f) => ['std', o, new RegExp(`thread[/]${f}[.]rs$`)];
const LK = T('LocalKey', 'local');
const FN = T('', 'functions');
const AI = ['core', 'atomic_int', /sync\/atomic\.rs$/];
const AB = ['core', 'AtomicBool', /sync\/atomic\.rs$/];
const AP = ['core', 'AtomicPtr', /sync\/atomic\.rs$/];
const { list, add } = group({ at: LK });
const SC = 'use std::sync::atomic::Ordering::SeqCst; ';

// ---------------------------------------------------------------- thread_local! (LocalKey)

add('local_key/with', 'with', null, 'How LocalKey::with works', 'Gives a closure access to this thread\'s own copy of a thread_local! value.', {
  rows: [['main thread', 'other thread']], call: 'COUNTER.with(|c| c.set(c.get() + 1));', note: 'one copy per thread', outs: ['main: 1', 'other: 1'],
  intro: 'Each thread sees its own value, starting from the initial one.',
  steps: [['main increments its copy: 1.', 0, 'o0'], ['The other thread has a separate copy: also 1.', 1, 'o1']],
  result: '1, 1', resultCap: 'Declared with thread_local! { static COUNTER: Cell<u32> = Cell::new(0); }.',
}, 'thread_local! { static C: Cell<u32> = Cell::new(0); } C.with(|c| c.set(c.get() + 1)); let other = std::thread::spawn(|| { C.with(|c| c.set(c.get() + 1)); C.with(|c| c.get()) }).join().unwrap(); format!("{}, {}", C.with(|c| c.get()), other)');

add('local_key/try_with', 'try_with', null, 'How LocalKey::try_with works', 'Like with, but returns an error instead of panicking if the value is already destroyed.', {
  rows: [['normal use']], call: 'KEY.try_with(|v| *v)', note: 'safe during thread exit', outs: ['Ok(5)'],
  intro: 'Only fails while the thread is shutting down and destructors run.',
  steps: [['The value exists.', 0], ['Ok(5).', [], 'o0']],
  result: 'Ok(5)', resultCap: 'Use it inside Drop implementations.',
}, 'thread_local! { static K: i32 = 5; } d(K.try_with(|v| *v).map_err(|_| ()))');

add('local_key/get', 'get', null, 'How LocalKey<Cell<T>>::get works', 'Reads a thread-local Cell value directly.', {
  rows: [['thread_local! static N: Cell<i32> = 7']], call: 'N.get()', note: 'no closure needed', outs: ['7'],
  intro: 'A shortcut for N.with(|c| c.get()).',
  steps: [['This thread\'s copy is 7.', 0], ['get() returns 7.', [], 'o0']],
  result: '7', resultCap: 'Only for Copy values in a Cell.',
}, 'thread_local! { static N: Cell<i32> = const { Cell::new(7) }; } N.get().to_string()');

add('local_key/set', 'set', null, 'How LocalKey::set works', 'Replaces this thread\'s value of a thread-local Cell or RefCell.', {
  rows: [['N = 0']], call: 'N.set(42);', note: 'no closure needed', outs: ['N.get() = 42'],
  intro: 'Only the current thread\'s copy changes.',
  steps: [['The old value 0 is replaced.', 0], ['Now 42.', [], 'o0']],
  result: '42', resultCap: 'Works for LocalKey<Cell<T>> and LocalKey<RefCell<T>>.',
}, 'thread_local! { static N: Cell<i32> = const { Cell::new(0) }; } N.set(42); N.get().to_string()');

add('local_key/take', 'take', null, 'How LocalKey::take works', 'Takes this thread\'s value out, leaving the default.', {
  rows: [['V = vec![1, 2]']], call: 'let v = V.take();', note: 'empty it out', outs: ['v = [1, 2]', 'V = []'],
  intro: 'Works for thread-local Cells and RefCells of Default types.',
  steps: [['The Vec comes out.', 0, 'o0'], ['An empty Vec stays behind.', 0, 'o1']],
  result: '[1, 2], []', resultCap: 'replace swaps in a value of your choice.',
}, 'thread_local! { static V: RefCell<Vec<i32>> = RefCell::new(vec![1, 2]); } let v = V.take(); format!("{:?}, {:?}", v, V.with_borrow(|x| x.clone()))');

add('local_key/replace', 'replace', null, 'How LocalKey::replace works', 'Puts in a new value and returns the old one.', {
  rows: [['N = 1']], call: 'let old = N.replace(5);', note: 'swap', outs: ['old = 1', 'N = 5'],
  intro: 'Only this thread\'s copy changes.',
  steps: [['The old 1 is returned.', 0, 'o0'], ['5 is stored.', 0, 'o1']],
  result: '1, 5', resultCap: 'For Cell and RefCell thread-locals.',
}, 'thread_local! { static N: Cell<i32> = const { Cell::new(1) }; } let old = N.replace(5); format!("{}, {}", old, N.get())');

add('local_key/with_borrow', 'with_borrow', null, 'How LocalKey<RefCell<T>>::with_borrow works', 'Reads a thread-local RefCell inside a closure.', {
  rows: [['LOG = ["start"]']], call: 'LOG.with_borrow(|v| v.len())', note: 'shared borrow', outs: ['1'],
  intro: 'A shortcut for LOG.with(|c| f(&c.borrow())).',
  steps: [['The Vec is borrowed.', 0], ['len() is 1.', [], 'o0']],
  result: '1', resultCap: 'with_borrow_mut gives mutable access.',
}, 'thread_local! { static LOG: RefCell<Vec<&\'static str>> = RefCell::new(vec!["start"]); } LOG.with_borrow(|v| v.len()).to_string()');

add('local_key/with_borrow_mut', 'with_borrow_mut', null, 'How LocalKey<RefCell<T>>::with_borrow_mut works', 'Changes a thread-local RefCell inside a closure.', {
  rows: [['LOG = []']], call: 'LOG.with_borrow_mut(|v| v.push("x"));', note: 'mutable borrow', outs: ['["x"]'],
  intro: 'A per-thread log or cache without locks.',
  steps: [['The Vec is borrowed mutably.', 0], ['"x" is pushed.', [], 'o0']],
  result: '["x"]', resultCap: 'Each thread keeps its own log.',
}, 'thread_local! { static LOG: RefCell<Vec<&\'static str>> = const { RefCell::new(Vec::new()) }; } LOG.with_borrow_mut(|v| v.push("x")); LOG.with_borrow(|v| d(v))');

// ---------------------------------------------------------------- threads

add('thread/available_parallelism', 'available_parallelism', FN, 'How thread::available_parallelism works', 'An estimate of how many threads can run at the same time.', {
  rows: [['8-core machine']], call: 'thread::available_parallelism()?.get()', note: 'size a thread pool', outs: ['e.g. 8'],
  intro: 'Usually the number of CPU cores available to the program.',
  steps: [['The OS is asked.', 0], ['A NonZero count comes back.', [], 'o0']],
  result: 'at least 1: true', resultCap: 'It can fail in unusual environments, so it returns a Result.',
}, 'format!("at least 1: {}", std::thread::available_parallelism().map(|n| n.get() >= 1).unwrap_or(true))');

add('thread/park', 'park', FN, 'How thread::park works', 'Puts the current thread to sleep until another thread unparks it.', {
  rows: [['worker parks', 'main unparks']], call: 'thread::park();   // woken by handle.thread().unpark()', note: 'a simple wake-up signal', outs: ['worker continues'],
  intro: 'park can also wake up spuriously, so check a condition in a loop.',
  steps: [['The worker sleeps in park().', 0], ['unpark wakes it.', 1, 'o0']],
  result: 'woken: true', resultCap: 'Higher-level tools (channels, Condvar) are usually easier.',
}, SC + 'let flag = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)); let f2 = flag.clone(); let h = std::thread::spawn(move || { while !f2.load(SeqCst) { std::thread::park(); } true }); flag.store(true, SeqCst); h.thread().unpark(); format!("woken: {}", h.join().unwrap())');

add('thread/park_timeout', 'park_timeout', FN, 'How thread::park_timeout works', 'Sleeps until unparked or until the time runs out.', {
  rows: [['nobody unparks']], call: 'thread::park_timeout(Duration::from_millis(10));', note: 'bounded sleep', outs: ['returns after ~10 ms'],
  intro: 'Returns either way; it does not tell you which happened.',
  steps: [['The thread sleeps.', 0], ['The timeout wakes it.', [], 'o0']],
  result: 'returned: true', resultCap: 'Measure the time yourself if you need to know.',
}, 'let t = std::time::Instant::now(); std::thread::park_timeout(std::time::Duration::from_millis(10)); format!("returned: {}", t.elapsed() <= std::time::Duration::from_secs(5))');

add('thread/panicking', 'panicking', FN, 'How thread::panicking works', 'true while the current thread is unwinding from a panic.', {
  rows: [['normal code', 'inside Drop during a panic']], call: 'if thread::panicking() { ... }', note: 'for Drop impls', outs: ['false', 'true'],
  intro: 'Lets destructors behave differently during a panic.',
  steps: [['Normal code: false.', 0, 'o0'], ['A Drop running because of a panic: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'Never panic again inside Drop when this is true.',
}, 'struct G(std::rc::Rc<Cell<bool>>); impl Drop for G { fn drop(&mut self) { self.0.set(std::thread::panicking()); } } let a = std::thread::panicking(); let seen = std::rc::Rc::new(Cell::new(false)); let s2 = seen.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(move || { let _g = G(s2); panic!("x"); })); let _ = std::panic::take_hook(); format!("{}, {}", a, seen.get())');

add('thread_obj/id', 'id', T('Thread', 'thread'), 'How Thread::id works', 'A unique identifier for a thread.', {
  rows: [['main', 'spawned']], call: 'thread::current().id()', note: 'never reused', outs: ['ThreadId(1)', 'a different id'],
  intro: 'Every thread gets its own ThreadId.',
  steps: [['main has one id.', 0, 'o0'], ['A new thread has another.', 1, 'o1']],
  result: 'different: true', resultCap: 'Useful as a key in per-thread statistics.',
}, 'let a = std::thread::current().id(); let b = std::thread::spawn(|| std::thread::current().id()).join().unwrap(); format!("different: {}", a != b)');

add('thread_obj/name', 'name', T('Thread', 'thread'), 'How Thread::name works', 'The thread\'s name, if it has one.', {
  rows: [['main', 'unnamed spawn']], call: 'thread::current().name()', note: 'shown in panic messages', outs: ['Some("main")', 'None'],
  intro: 'The main thread is called "main"; others only if named with Builder.',
  steps: [['main: Some("main").', 0, 'o0'], ['An unnamed thread: None.', 1, 'o1']],
  result: 'None', resultCap: 'Builder::new().name("worker".into()) gives a name.',
}, 'd(std::thread::spawn(|| std::thread::current().name().map(String::from)).join().unwrap())');

add('thread_obj/unpark', 'unpark', T('Thread', 'thread'), 'How Thread::unpark works', 'Wakes a parked thread (or makes its next park return at once).', {
  rows: [['token not used yet']], call: 'handle.thread().unpark();', note: 'a one-shot token', outs: ['next park() returns immediately'],
  intro: 'If the thread is not parked yet, the wake-up is remembered.',
  steps: [['unpark stores a token.', 0], ['The next park consumes it and returns.', [], 'o0']],
  result: 'returned: true', resultCap: 'Only one token is kept: several unparks count as one.',
}, 'std::thread::current().unpark(); std::thread::park(); String::from("returned: true")');

add('builder/new', 'new', T('Builder', 'builder'), 'How thread::Builder::new works', 'Starts configuring a thread before spawning it.', {
  rows: [['Builder::new()']], call: 'Builder::new().name("db".into()).spawn(|| ...)', note: 'settings first', outs: ['a thread called "db"'],
  intro: 'Name and stack size can be set before starting.',
  steps: [['A default configuration.', 0], ['Spawned with the settings.', [], 'o0']],
  result: '"db"', resultCap: 'spawn returns io::Result because creating a thread can fail.',
}, 'let h = std::thread::Builder::new().name("db".into()).spawn(|| std::thread::current().name().unwrap().to_string()).unwrap(); d(h.join().unwrap())');

add('builder/name', 'name', T('Builder', 'builder'), 'How thread::Builder::name works', 'Gives the new thread a name.', {
  rows: [['"io-1"']], call: 'Builder::new().name("io-1".to_string())', note: 'for debugging', outs: ['panics show "io-1"'],
  intro: 'Names appear in panic messages and debuggers.',
  steps: [['The name is stored.', 0], ['The thread knows it.', [], 'o0']],
  result: 'Some("io-1")', resultCap: 'Names must not contain a NUL byte.',
}, 'let h = std::thread::Builder::new().name("io-1".to_string()).spawn(|| std::thread::current().name().map(String::from)).unwrap(); d(h.join().unwrap())');

add('builder/stack_size', 'stack_size', T('Builder', 'builder'), 'How thread::Builder::stack_size works', 'Sets the stack size of the new thread in bytes.', {
  rows: [['8 MB']], call: 'Builder::new().stack_size(8 << 20)', note: 'for deep recursion', outs: ['bigger stack'],
  intro: 'The default stack is a few MB; deep recursion may need more.',
  steps: [['Ask for 8 MB.', 0], ['The thread runs with it.', [], 'o0']],
  result: 'ok', resultCap: 'The OS may round the size up.',
}, 'let h = std::thread::Builder::new().stack_size(8 << 20).spawn(|| "ok").unwrap(); h.join().unwrap().to_string()');

add('builder/spawn_scoped', 'spawn_scoped', T('Builder', 'scoped'), 'How thread::Builder::spawn_scoped works', 'Starts a configured thread inside a scope, so it may borrow local data.', {
  rows: [['data = [1, 2, 3]']], call: 'Builder::new().spawn_scoped(s, || data.iter().sum::<i32>())', note: 'named + borrowing', outs: ['6'],
  intro: 'Combines Builder settings with thread::scope borrowing.',
  steps: [['The thread borrows data.', 0], ['It returns the sum 6.', [], 'o0']],
  result: '6', resultCap: 'Returns io::Result like Builder::spawn.',
}, 'let data = [1, 2, 3]; let r = std::thread::scope(|s| std::thread::Builder::new().name("sum".into()).spawn_scoped(s, || data.iter().sum::<i32>()).unwrap().join().unwrap()); r.to_string()');

add('scope/spawn', 'spawn', T('Scope', 'scoped'), 'How Scope::spawn works', 'Starts a thread that may borrow from the enclosing scope.', {
  rows: [['names = ["a", "b"]']], call: 'thread::scope(|s| { s.spawn(|| println!("{names:?}")); });', note: 'borrow without Arc', outs: ['thread sees names'],
  intro: 'All scoped threads finish before thread::scope returns.',
  steps: [['The closure borrows names.', 0], ['The thread uses it safely.', [], 'o0']],
  result: '2', resultCap: 'Mutably borrowed data can be used by one thread at a time.',
}, 'let names = vec!["a", "b"]; let n = std::thread::scope(|s| s.spawn(|| names.len()).join().unwrap()); n.to_string()');

add('scoped_join_handle/join', 'join', T('ScopedJoinHandle', 'scoped'), 'How ScopedJoinHandle::join works', 'Waits for a scoped thread and returns its result.', {
  rows: [['thread computes 21 * 2']], call: 'let h = s.spawn(|| 21 * 2); h.join().unwrap()', note: 'collect the result', outs: ['42'],
  intro: 'Without join, the scope still waits, but the result is lost.',
  steps: [['The thread computes 42.', 0], ['join returns Ok(42).', [], 'o0']],
  result: '42', resultCap: 'Err means the thread panicked.',
}, 'std::thread::scope(|s| { let h = s.spawn(|| 21 * 2); h.join().unwrap() }).to_string()');

add('scoped_join_handle/is_finished', 'is_finished', T('ScopedJoinHandle', 'scoped'), 'How ScopedJoinHandle::is_finished works', 'Checks whether a scoped thread is done, without waiting.', {
  rows: [['quick thread']], call: 'h.is_finished()', note: 'polling', outs: ['true once done'],
  intro: 'Never blocks.',
  steps: [['The thread returns.', 0], ['is_finished() becomes true.', [], 'o0']],
  result: 'true', resultCap: 'join() still collects the result.',
}, 'std::thread::scope(|s| { let h = s.spawn(|| 1); while !h.is_finished() { std::thread::yield_now(); } h.is_finished() }).to_string()');

add('scoped_join_handle/thread', 'thread', T('ScopedJoinHandle', 'scoped'), 'How ScopedJoinHandle::thread works', 'The Thread handle of a scoped thread.', {
  rows: [['named scoped thread']], call: 'h.thread().name()', note: 'inspect the thread', outs: ['Some("w")'],
  intro: 'Use it to unpark the thread or read its name and id.',
  steps: [['The handle knows its thread.', 0], ['Its name is "w".', [], 'o0']],
  result: 'Some("w")', resultCap: 'JoinHandle::thread is the non-scoped version.',
}, 'let r = std::thread::scope(|s| { let h = std::thread::Builder::new().name("w".into()).spawn_scoped(s, || ()).unwrap(); let n = h.thread().name().map(String::from); h.join().unwrap(); n }); d(r)');

add('join_handle/thread', 'thread', T('JoinHandle', 'join_handle'), 'How JoinHandle::thread works', 'The Thread handle of a spawned thread.', {
  rows: [['spawned thread']], call: 'h.thread().id()', note: 'without joining', outs: ['its ThreadId'],
  intro: 'Lets you unpark it or read its id while it runs.',
  steps: [['The handle knows the thread.', 0], ['Its id matches what the thread sees.', [], 'o0']],
  result: 'same id: true', resultCap: 'Used with park/unpark.',
}, 'let h = std::thread::spawn(|| std::thread::current().id()); let id = h.thread().id(); format!("same id: {}", h.join().unwrap() == id)');

// ---------------------------------------------------------------- atomics

add('atomic/new', 'new', AI, 'How Atomic*::new works', 'Creates an atomic integer that threads can update without a lock.', {
  rows: [['0']], call: 'static HITS: AtomicUsize = AtomicUsize::new(0);', note: 'const, usable in statics', outs: ['AtomicUsize(0)'],
  intro: 'Every AtomicI*/AtomicU* type has the same methods.',
  steps: [['The counter starts at 0.', 0], ['Ready to share.', [], 'o0']],
  result: '0', resultCap: 'No Mutex needed for simple counters.',
}, SC + 'let a = std::sync::atomic::AtomicUsize::new(0); a.load(SeqCst).to_string()');

add('atomic/fetch_min', 'fetch_min', AI, 'How fetch_min works on atomics', 'Keeps the smaller of the current and the given value.', {
  rows: [['current 7, offer 9', 'current 7, offer 2']], call: 'best.fetch_min(time, SeqCst)', note: 'a shared record low', outs: ['stays 7', 'becomes 2'],
  intro: 'Many threads can report times; only the lowest survives.',
  steps: [['9 > 7: unchanged.', 0, 'o0'], ['2 < 7: updated.', 1, 'o1']],
  result: '2', resultCap: 'fetch_max keeps the larger one.',
}, SC + 'let a = std::sync::atomic::AtomicU32::new(7); a.fetch_min(9, SeqCst); a.fetch_min(2, SeqCst); a.load(SeqCst).to_string()');

add('atomic/fetch_and', 'fetch_and', AI, 'How fetch_and works on atomics', 'Bitwise AND with a value; returns the previous value.', {
  rows: [['0b1110 & 0b0110']], call: 'flags.fetch_and(!BIT, SeqCst)', note: 'clear bits atomically', outs: ['0b0110'],
  intro: 'Clearing flags shared between threads.',
  steps: [['1110 AND 0110.', 0], ['= 0110.', [], 'o0']],
  result: '0b110', resultCap: 'fetch_or sets bits, fetch_xor toggles them.',
}, SC + 'let a = std::sync::atomic::AtomicU8::new(0b1110); a.fetch_and(0b0110, SeqCst); format!("{:#b}", a.load(SeqCst))');

add('atomic/fetch_or', 'fetch_or', AI, 'How fetch_or works on atomics', 'Bitwise OR with a value; returns the previous value.', {
  rows: [['0b0001 | 0b0100']], call: 'flags.fetch_or(BIT, SeqCst)', note: 'set bits atomically', outs: ['0b0101'],
  intro: 'Setting flags shared between threads.',
  steps: [['0001 OR 0100.', 0], ['= 0101.', [], 'o0']],
  result: '0b101', resultCap: 'The returned old value tells if the bit was already set.',
}, SC + 'let a = std::sync::atomic::AtomicU8::new(0b0001); a.fetch_or(0b0100, SeqCst); format!("{:#b}", a.load(SeqCst))');

add('atomic/fetch_xor', 'fetch_xor', AI, 'How fetch_xor works on atomics', 'Bitwise XOR with a value: toggles bits; returns the previous value.', {
  rows: [['0b1010 ^ 0b1111']], call: 'a.fetch_xor(0b1111, SeqCst)', note: 'flip bits', outs: ['0b0101'],
  intro: 'Every bit set in the mask is flipped.',
  steps: [['1010 XOR 1111.', 0], ['= 0101.', [], 'o0']],
  result: '0b101', resultCap: 'Applying the same XOR twice restores the value.',
}, SC + 'let a = std::sync::atomic::AtomicU8::new(0b1010); a.fetch_xor(0b1111, SeqCst); format!("{:#b}", a.load(SeqCst))');

add('atomic/fetch_nand', 'fetch_nand', AI, 'How fetch_nand works on atomics', 'Stores NOT (current AND value); returns the previous value.', {
  rows: [['0b1100 nand 0b1010']], call: 'a.fetch_nand(0b1010, SeqCst)', note: 'rarely needed', outs: ['!(0b1000)'],
  intro: '1100 AND 1010 = 1000; NOT of that sets every other bit.',
  steps: [['AND gives 1000.', 0], ['NOT gives 1111 0111 for a u8.', [], 'o0']],
  result: '0b11110111', resultCap: 'Completes the set of atomic bit operations.',
}, SC + 'let a = std::sync::atomic::AtomicU8::new(0b1100); a.fetch_nand(0b1010, SeqCst); format!("{:#b}", a.load(SeqCst))');

add('atomic/compare_exchange_weak', 'compare_exchange_weak', AI, 'How compare_exchange_weak works on atomics', 'Like compare_exchange, but may fail spuriously; meant for retry loops.', {
  kind: 'lines', call: 'a.compare_exchange_weak(cur, cur * 2, SeqCst, SeqCst)   // in a loop', note: 'the CAS loop',
  lines: ['read cur = 3', 'try 3 → 6', 'success (or retry with the new value)', 'a = 6'],
  intro: 'On some CPUs the weak version is faster inside a loop.',
  steps: [{ cap: 'Read the current value.', show: [0] }, { cap: 'Try to replace it.', show: [1] }, { cap: 'Retry if it failed or changed.', show: [2] }, { cap: 'Done.', show: [3] }],
  result: '6', resultCap: 'fetch_update writes this loop for you.',
}, SC + 'let a = std::sync::atomic::AtomicU32::new(3); let mut cur = a.load(SeqCst); loop { match a.compare_exchange_weak(cur, cur * 2, SeqCst, SeqCst) { Ok(_) => break, Err(x) => cur = x } } a.load(SeqCst).to_string()');

add('atomic/get_mut', 'get_mut', AI, 'How get_mut works on atomics', 'A plain &mut to the integer when you own the atomic exclusively.', {
  rows: [['AtomicI32(5)']], call: '*a.get_mut() += 1;', note: 'no atomic operation needed', outs: ['6'],
  intro: '&mut guarantees no other thread can touch it.',
  steps: [['get_mut lends the integer.', 0], ['It becomes 6.', [], 'o0']],
  result: '6', resultCap: 'Useful during setup before sharing.',
}, SC + 'let mut a = std::sync::atomic::AtomicI32::new(5); *a.get_mut() += 1; a.load(SeqCst).to_string()');

add('atomic/into_inner', 'into_inner', AI, 'How into_inner works on atomics', 'Consumes the atomic and returns the plain integer.', {
  rows: [['AtomicU64(99)']], call: 'a.into_inner()', note: 'done sharing', outs: ['99'],
  intro: 'After the threads are finished, take the final value.',
  steps: [['The atomic is consumed.', 0], ['99 comes out.', [], 'o0']],
  result: '99', resultCap: 'With Arc, first get it back with Arc::into_inner.',
}, 'std::sync::atomic::AtomicU64::new(99).into_inner().to_string()');

add('atomicbool/new', 'new', AB, 'How AtomicBool::new works', 'A boolean flag that threads can read and write without a lock.', {
  rows: [['false']], call: 'static STOP: AtomicBool = AtomicBool::new(false);', note: 'a shared flag', outs: ['AtomicBool(false)'],
  intro: 'Common as a stop signal for worker threads.',
  steps: [['The flag starts false.', 0], ['Ready to share.', [], 'o0']],
  result: 'false', resultCap: 'const, so it works in statics.',
}, SC + 'std::sync::atomic::AtomicBool::new(false).load(SeqCst).to_string()');

add('atomicbool/load', 'load', AB, 'How AtomicBool::load works', 'Reads the flag.', {
  rows: [['AtomicBool(true)']], call: 'stop.load(SeqCst)', note: 'atomic read', outs: ['true'],
  intro: 'Workers check it regularly.',
  steps: [['The flag is true.', 0], ['load returns true.', [], 'o0']],
  result: 'true', resultCap: 'while !stop.load(SeqCst) { work(); }',
}, SC + 'std::sync::atomic::AtomicBool::new(true).load(SeqCst).to_string()');

add('atomicbool/compare_exchange', 'compare_exchange', AB, 'How AtomicBool::compare_exchange works', 'Sets the flag only if it currently has the expected value.', {
  rows: [['first caller', 'second caller']], call: 'claimed.compare_exchange(false, true, SeqCst, SeqCst)', note: 'claim exactly once', outs: ['Ok(false)', 'Err(true)'],
  intro: 'Exactly one thread wins the claim.',
  steps: [['false → true: Ok.', 0, 'o0'], ['Already true: Err.', 1, 'o1']],
  result: 'Ok(false), Err(true)', resultCap: 'A tiny lock-free "who goes first".',
}, SC + 'let f = std::sync::atomic::AtomicBool::new(false); format!("{:?}, {:?}", f.compare_exchange(false, true, SeqCst, SeqCst), f.compare_exchange(false, true, SeqCst, SeqCst))');

add('atomicbool/fetch_and', 'fetch_and', AB, 'How AtomicBool::fetch_and works', 'Sets the flag to (flag AND value); returns the old flag.', {
  rows: [['true & false']], call: 'all_ok.fetch_and(result, SeqCst)', note: 'any failure clears it', outs: ['false'],
  intro: 'Once any thread reports false, it stays false.',
  steps: [['true AND false.', 0], ['= false.', [], 'o0']],
  result: 'false', resultCap: 'fetch_or is the "any true" version.',
}, SC + 'let f = std::sync::atomic::AtomicBool::new(true); f.fetch_and(false, SeqCst); f.load(SeqCst).to_string()');

add('atomicbool/fetch_xor', 'fetch_xor', AB, 'How AtomicBool::fetch_xor works', 'Toggles the flag if the value is true; returns the old flag.', {
  rows: [['false ^ true']], call: 'f.fetch_xor(true, SeqCst)', note: 'flip', outs: ['true'],
  intro: 'XOR with true flips the flag.',
  steps: [['false XOR true.', 0], ['= true.', [], 'o0']],
  result: 'true', resultCap: 'fetch_not flips without an argument.',
}, SC + 'let f = std::sync::atomic::AtomicBool::new(false); f.fetch_xor(true, SeqCst); f.load(SeqCst).to_string()');

add('atomicbool/fetch_not', 'fetch_not', AB, 'How AtomicBool::fetch_not works', 'Flips the flag; returns the old value.', {
  rows: [['true']], call: 'f.fetch_not(SeqCst)', note: 'toggle', outs: ['returns true, now false'],
  intro: 'A shared on/off switch.',
  steps: [['The old value true is returned.', 0], ['The flag is now false.', [], 'o0']],
  result: 'true, now false', resultCap: 'Same as fetch_xor(true, ..).',
}, SC + 'let f = std::sync::atomic::AtomicBool::new(true); let old = f.fetch_not(SeqCst); format!("{}, now {}", old, f.load(SeqCst))');

add('atomicbool/fetch_nand', 'fetch_nand', AB, 'How AtomicBool::fetch_nand works', 'Sets the flag to NOT (flag AND value).', {
  rows: [['true nand true']], call: 'f.fetch_nand(true, SeqCst)', note: 'rarely needed', outs: ['false'],
  intro: 'true AND true = true; NOT gives false.',
  steps: [['AND gives true.', 0], ['NOT gives false.', [], 'o0']],
  result: 'false', resultCap: 'Completes the boolean operations.',
}, SC + 'let f = std::sync::atomic::AtomicBool::new(true); f.fetch_nand(true, SeqCst); f.load(SeqCst).to_string()');

add('atomicbool/get_mut', 'get_mut', AB, 'How AtomicBool::get_mut works', 'A plain &mut bool when you own the flag exclusively.', {
  rows: [['AtomicBool(false)']], call: '*f.get_mut() = true;', note: 'no atomics needed', outs: ['true'],
  intro: 'Exclusive access makes atomic operations unnecessary.',
  steps: [['get_mut lends the bool.', 0], ['It becomes true.', [], 'o0']],
  result: 'true', resultCap: 'into_inner takes the value out.',
}, SC + 'let mut f = std::sync::atomic::AtomicBool::new(false); *f.get_mut() = true; f.load(SeqCst).to_string()');

add('atomicbool/into_inner', 'into_inner', AB, 'How AtomicBool::into_inner works', 'Consumes the atomic and returns the plain bool.', {
  rows: [['AtomicBool(true)']], call: 'f.into_inner()', note: 'done sharing', outs: ['true'],
  intro: 'Take the final value once threads are finished.',
  steps: [['The atomic is consumed.', 0], ['true comes out.', [], 'o0']],
  result: 'true', resultCap: 'Same as the integer versions.',
}, 'std::sync::atomic::AtomicBool::new(true).into_inner().to_string()');

add('atomicptr/new', 'new', AP, 'How AtomicPtr::new works', 'A raw pointer that threads can swap atomically.', {
  rows: [['&mut 5 as *mut i32']], call: 'let p = AtomicPtr::new(&mut x);', note: 'lock-free pointer', outs: ['points at x'],
  intro: 'A building block for lock-free data structures.',
  steps: [['The pointer is stored.', 0], ['load() returns it.', [], 'o0']],
  result: '5', resultCap: 'Reading through the pointer needs unsafe.',
}, SC + 'let mut x = 5; let p = std::sync::atomic::AtomicPtr::new(&mut x); let v = unsafe { *p.load(SeqCst) }; v.to_string()');

add('atomicptr/load', 'load', AP, 'How AtomicPtr::load works', 'Reads the stored pointer.', {
  rows: [['AtomicPtr → x']], call: 'p.load(SeqCst)', note: 'atomic read', outs: ['*mut i32 to x'],
  intro: 'The pointer value itself is read atomically.',
  steps: [['The stored pointer.', 0], ['It points at x.', [], 'o0']],
  result: 'true', resultCap: 'Dereferencing it is unsafe.',
}, SC + 'let mut x = 1; let raw: *mut i32 = &mut x; let p = std::sync::atomic::AtomicPtr::new(raw); (p.load(SeqCst) == raw).to_string()');

add('atomicptr/compare_exchange', 'compare_exchange', AP, 'How AtomicPtr::compare_exchange works', 'Swaps the pointer only if it still points where you expect.', {
  rows: [['points at a, swap to b']], call: 'p.compare_exchange(a_ptr, b_ptr, SeqCst, SeqCst)', note: 'pointer CAS', outs: ['Ok(a_ptr), now b'],
  intro: 'How lock-free stacks push and pop.',
  steps: [['It points at a, as expected.', 0], ['It now points at b.', [], 'o0']],
  result: 'Ok, now b: true', resultCap: 'Err returns the actual pointer.',
}, SC + 'let mut a = 1; let mut b = 2; let pa: *mut i32 = &mut a; let pb: *mut i32 = &mut b; let p = std::sync::atomic::AtomicPtr::new(pa); let r = p.compare_exchange(pa, pb, SeqCst, SeqCst).is_ok(); format!("{}, now b: {}", if r { "Ok" } else { "Err" }, p.load(SeqCst) == pb)');

add('atomicptr/get_mut', 'get_mut', AP, 'How AtomicPtr::get_mut works', 'A plain &mut to the pointer when you own the AtomicPtr exclusively.', {
  rows: [['AtomicPtr → a']], call: '*p.get_mut() = b_ptr;', note: 'no atomics needed', outs: ['now points at b'],
  intro: 'Exclusive access, so a normal write is fine.',
  steps: [['get_mut lends the pointer.', 0], ['It is changed to b.', [], 'o0']],
  result: 'true', resultCap: 'into_inner takes the pointer out.',
}, SC + 'let mut a = 1; let mut b = 2; let pb: *mut i32 = &mut b; let mut p = std::sync::atomic::AtomicPtr::new(&mut a); *p.get_mut() = pb; (p.load(SeqCst) == pb).to_string()');

add('atomic/fence', 'fence', ['core', '', /sync\/atomic\.rs$/], 'How atomic::fence works', 'A memory barrier: orders memory operations around it across threads.', {
  kind: 'lines', call: 'data.store(42, Relaxed); fence(Release); ready.store(true, Relaxed);', note: 'expert tool',
  lines: ['write the data (Relaxed)', 'fence(Release): earlier writes cannot move after this', 'publish the flag (Relaxed)', 'a reader with fence(Acquire) sees 42'],
  intro: 'Fences let several relaxed operations share one ordering guarantee.',
  steps: [{ cap: 'The data is written.', show: [0] }, { cap: 'The release fence orders it.', show: [1] }, { cap: 'The flag is published.', show: [2] }, { cap: 'An acquire fence on the reader pairs with it.', show: [3] }],
  result: '42', resultCap: 'When unsure, SeqCst operations without fences are simpler.',
}, 'use std::sync::atomic::{fence, AtomicBool, AtomicU32, Ordering::*}; static D: AtomicU32 = AtomicU32::new(0); static R: AtomicBool = AtomicBool::new(false); let h = std::thread::spawn(|| { D.store(42, Relaxed); fence(Release); R.store(true, Relaxed); }); while !R.load(Relaxed) { std::hint::spin_loop(); } fence(Acquire); h.join().unwrap(); D.load(Relaxed).to_string()');

add('atomic/compiler_fence', 'compiler_fence', ['core', '', /sync\/atomic\.rs$/], 'How atomic::compiler_fence works', 'Stops the compiler (not the CPU) from reordering memory operations across it.', {
  rows: [['single-thread signal handler']], call: 'compiler_fence(Ordering::SeqCst);', note: 'very rare', outs: ['no compiler reordering'],
  intro: 'Only for code interrupted on the same thread, like signal handlers.',
  steps: [['Writes before the fence...', 0], ['...stay before it in the compiled code.', [], 'o0']],
  result: '1', resultCap: 'Between threads, use fence or atomic orderings instead.',
}, 'use std::sync::atomic::{compiler_fence, AtomicU32, Ordering::*}; let a = AtomicU32::new(0); a.store(1, Relaxed); compiler_fence(SeqCst); a.load(Relaxed).to_string()');

module.exports = list;
