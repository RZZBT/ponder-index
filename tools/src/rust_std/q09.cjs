// Rust standard library: the rest of std::sync (Condvar, Once, OnceLock, LazyLock, RwLock, poisoning, Barrier,
// SyncSender, Receiver::iter).
const { group } = require('./kit.cjs');
const S = (o, f) => ['std', o, new RegExp(`sync[/]${f}[.]rs$`)];
const CV = S('Condvar', 'poison[/]condvar');
const ONCE = S('Once', 'once');
const OL = S('OnceLock', 'once_lock');
const LL = S('LazyLock', 'lazy_lock');
const RW = S('RwLock', 'poison[/]rwlock');
const PE = S('PoisonError', 'poison');
const { list, add } = group({ at: CV });
const P = 'use std::sync::{Arc, Condvar, Mutex}; ';

// ---------------------------------------------------------------- Condvar

add('condvar/new', 'new', null, 'How Condvar::new works', 'A condition variable: lets threads sleep until another thread signals a change.', {
  rows: [['Mutex<bool>', 'Condvar']], call: 'let pair = Arc::new((Mutex::new(false), Condvar::new()));', note: 'always paired with a Mutex', outs: ['ready to wait/notify'],
  intro: 'The Mutex guards the data; the Condvar is the doorbell.',
  steps: [['A flag protected by a Mutex.', 0], ['A Condvar to signal when it changes.', 1, 'o0']],
  result: 'ready: true', resultCap: 'Waiting threads use no CPU while asleep.',
}, P + 'let pair = Arc::new((Mutex::new(false), Condvar::new())); let p2 = pair.clone(); let h = std::thread::spawn(move || { *p2.0.lock().unwrap() = true; p2.1.notify_one(); }); let mut g = pair.0.lock().unwrap(); while !*g { g = pair.1.wait(g).unwrap(); } let r = format!("ready: {}", *g); drop(g); h.join().unwrap(); r');

add('condvar/wait', 'wait', null, 'How Condvar::wait works', 'Releases the lock and sleeps until notified, then re-locks.', {
  kind: 'lines', call: 'while !*ready { ready = cvar.wait(ready).unwrap(); }', note: 'always in a loop',
  lines: ['lock the Mutex: ready = false', 'wait(): unlock + sleep', 'other thread sets true, notifies', 'wake up, lock again: ready = true'],
  intro: 'Spurious wake-ups can happen, so the condition is checked again in a loop.',
  steps: [{ cap: 'Check the flag under the lock.', show: [0] }, { cap: 'wait gives up the lock while sleeping.', show: [1] }, { cap: 'Another thread changes the flag and notifies.', show: [2] }, { cap: 'wait returns with the lock held again.', show: [3] }],
  result: 'ready: true', resultCap: 'wait_while writes the loop for you.',
}, P + 'let pair = Arc::new((Mutex::new(false), Condvar::new())); let p2 = pair.clone(); let h = std::thread::spawn(move || { *p2.0.lock().unwrap() = true; p2.1.notify_all(); }); let mut g = pair.0.lock().unwrap(); while !*g { g = pair.1.wait(g).unwrap(); } let r = format!("ready: {}", *g); drop(g); h.join().unwrap(); r');

add('condvar/wait_while', 'wait_while', null, 'How Condvar::wait_while works', 'Waits as long as a condition holds, re-checking after every wake-up.', {
  rows: [['queue empty']], call: 'let g = cvar.wait_while(lock.lock()?, |q| q.is_empty())?;', note: 'the loop built in', outs: ['wakes when an item arrives'],
  intro: 'Handles spurious wake-ups for you.',
  steps: [['The queue is empty: sleep.', 0], ['A producer pushes and notifies: wake up.', [], 'o0']],
  result: '[7]', resultCap: 'The classic producer/consumer pattern.',
}, P + 'let pair = Arc::new((Mutex::new(Vec::<i32>::new()), Condvar::new())); let p2 = pair.clone(); let h = std::thread::spawn(move || { p2.0.lock().unwrap().push(7); p2.1.notify_one(); }); let g = pair.1.wait_while(pair.0.lock().unwrap(), |q| q.is_empty()).unwrap(); let r = d(&*g); drop(g); h.join().unwrap(); r');

add('condvar/notify_one', 'notify_one', null, 'How Condvar::notify_one works', 'Wakes up one waiting thread.', {
  rows: [['worker waiting']], call: '*started.lock()? = true; cvar.notify_one();', note: 'ring the bell once', outs: ['one waiter wakes'],
  intro: 'Change the data under the lock first, then notify.',
  steps: [['The flag is set.', 0], ['One sleeping thread is woken.', [], 'o0']],
  result: 'woke: true', resultCap: 'notify_all wakes every waiter.',
}, P + 'let pair = Arc::new((Mutex::new(false), Condvar::new())); let p2 = pair.clone(); let h = std::thread::spawn(move || { let g = p2.1.wait_while(p2.0.lock().unwrap(), |s| !*s).unwrap(); *g }); *pair.0.lock().unwrap() = true; pair.1.notify_one(); format!("woke: {}", h.join().unwrap())');

add('condvar/notify_all', 'notify_all', null, 'How Condvar::notify_all works', 'Wakes up every waiting thread.', {
  rows: [['3 workers waiting']], call: '*go.lock()? = true; cvar.notify_all();', note: 'a starting gun', outs: ['all 3 wake'],
  intro: 'Each woken thread re-checks the condition under the lock.',
  steps: [['The flag is set.', 0], ['Every waiter wakes.', [], 'o0']],
  result: '3 started', resultCap: 'Use it when the change matters to everyone.',
}, P + 'let pair = Arc::new((Mutex::new(false), Condvar::new())); let hs: Vec<_> = (0..3).map(|_| { let p = pair.clone(); std::thread::spawn(move || { let _g = p.1.wait_while(p.0.lock().unwrap(), |s| !*s).unwrap(); 1 }) }).collect(); *pair.0.lock().unwrap() = true; pair.1.notify_all(); let n: i32 = hs.into_iter().map(|h| h.join().unwrap()).sum(); format!("{} started", n)');

add('condvar/wait_timeout', 'wait_timeout', null, 'How Condvar::wait_timeout works', 'Waits for a notification, but only up to a time limit.', {
  rows: [['nobody notifies']], call: 'let (g, res) = cvar.wait_timeout(g, Duration::from_millis(10))?;', note: 'bounded wait', outs: ['res.timed_out() = true'],
  intro: 'Returns the guard and whether the time ran out.',
  steps: [['Sleep for at most 10 ms.', 0], ['Nobody came: timed out.', [], 'o0']],
  result: 'timed out: true', resultCap: 'Still check your condition: a notification may have arrived just in time.',
}, P + 'let m = Mutex::new(()); let c = Condvar::new(); let (_g, res) = c.wait_timeout(m.lock().unwrap(), std::time::Duration::from_millis(10)).unwrap(); format!("timed out: {}", res.timed_out())');

add('condvar/wait_timeout_while', 'wait_timeout_while', null, 'How Condvar::wait_timeout_while works', 'Waits while a condition holds, up to a time limit.', {
  rows: [['flag stays false']], call: 'cvar.wait_timeout_while(g, dur, |ready| !*ready)', note: 'loop + deadline', outs: ['timed out, flag false'],
  intro: 'Combines wait_while with a timeout.',
  steps: [['The condition keeps it waiting.', 0], ['The deadline passes.', [], 'o0']],
  result: 'timed out: true, flag: false', resultCap: 'Good for "wait up to 5 seconds for the worker".',
}, P + 'let m = Mutex::new(false); let c = Condvar::new(); let (g, res) = c.wait_timeout_while(m.lock().unwrap(), std::time::Duration::from_millis(10), |r| !*r).unwrap(); format!("timed out: {}, flag: {}", res.timed_out(), *g)');

add('wait_timeout_result/timed_out', 'timed_out', ['std', 'WaitTimeoutResult', new RegExp('sync[/]mod[.]rs$')], 'How WaitTimeoutResult::timed_out works', 'true if a timed wait ended because time ran out.', {
  rows: [['no notification']], call: 'res.timed_out()', note: 'why did I wake?', outs: ['true'],
  intro: 'Tells timeouts apart from real notifications.',
  steps: [['The wait hit its limit.', 0], ['timed_out() is true.', [], 'o0']],
  result: 'true', resultCap: 'Returned by wait_timeout and wait_timeout_while.',
}, P + 'let m = Mutex::new(()); let c = Condvar::new(); let (_g, res) = c.wait_timeout(m.lock().unwrap(), std::time::Duration::from_millis(5)).unwrap(); res.timed_out().to_string()');

// ---------------------------------------------------------------- Once, OnceLock, LazyLock

add('once/new', 'new', ONCE, 'How Once::new works', 'A flag for code that must run only one time.', {
  rows: [['static INIT: Once']], call: 'static INIT: Once = Once::new();', note: 'usable in a static', outs: ['not completed yet'],
  intro: 'Usually stored in a static.',
  steps: [['The Once starts unused.', 0], ['is_completed() is false.', [], 'o0']],
  result: 'false', resultCap: 'call_once runs the setup.',
}, 'let o = std::sync::Once::new(); o.is_completed().to_string()');

add('once/is_completed', 'is_completed', ONCE, 'How Once::is_completed works', 'true once call_once has finished successfully.', {
  rows: [['before', 'after call_once']], call: 'INIT.is_completed()', note: 'has setup run?', outs: ['false', 'true'],
  intro: 'A quick check without running anything.',
  steps: [['Before: false.', 0, 'o0'], ['After: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'A panic inside call_once leaves it false (poisoned).',
}, 'let o = std::sync::Once::new(); let a = o.is_completed(); o.call_once(|| {}); format!("{}, {}", a, o.is_completed())');

add('once/call_once_force', 'call_once_force', ONCE, 'How Once::call_once_force works', 'Like call_once, but also runs if an earlier attempt panicked.', {
  rows: [['poisoned Once']], call: 'INIT.call_once_force(|state| { state.is_poisoned(); ... })', note: 'retry after a panic', outs: ['runs, sees poisoned = true'],
  intro: 'The closure is told whether a previous attempt failed.',
  steps: [['An earlier call_once panicked.', 0], ['call_once_force runs anyway.', [], 'o0']],
  result: 'poisoned: true, completed: true', resultCap: 'call_once would panic on a poisoned Once.',
}, 'let o = std::sync::Once::new(); std::panic::set_hook(Box::new(|_| {})); let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| o.call_once(|| panic!("x")))); let _ = std::panic::take_hook(); let mut p = false; o.call_once_force(|s| p = s.is_poisoned()); format!("poisoned: {}, completed: {}", p, o.is_completed())');

add('once_state/is_poisoned', 'is_poisoned', ['std', 'OnceState', new RegExp('sync[/]once[.]rs$')], 'How OnceState::is_poisoned works', 'Inside call_once_force: did a previous attempt panic?', {
  rows: [['first run']], call: 'INIT.call_once_force(|s| s.is_poisoned())', note: 'clean or retry?', outs: ['false'],
  intro: 'On a first, clean run it is false.',
  steps: [['No earlier attempt.', 0], ['is_poisoned() is false.', [], 'o0']],
  result: 'false', resultCap: 'true means you may need to clean up first.',
}, 'let o = std::sync::Once::new(); let mut p = true; o.call_once_force(|s| p = s.is_poisoned()); p.to_string()');

add('once/wait', 'wait', ONCE, 'How Once::wait works', 'Blocks until another thread has completed the Once.', {
  rows: [['thread A runs setup', 'thread B waits']], call: 'INIT.wait();', note: 'wait for initialisation', outs: ['B continues after A finishes'],
  intro: 'B does not run the setup itself; it just waits for it.',
  steps: [['A runs call_once.', 0, 'o0'], ['B returns from wait once it is done.', 1, 'o0']],
  result: 'completed: true', resultCap: 'Panics if the Once was poisoned; wait_force does not.',
}, 'let o = std::sync::Arc::new(std::sync::Once::new()); let o2 = o.clone(); let h = std::thread::spawn(move || o2.call_once(|| {})); o.wait(); h.join().unwrap(); format!("completed: {}", o.is_completed())');

add('oncelock/new', 'new', OL, 'How OnceLock::new works', 'An empty, thread-safe write-once cell.', {
  rows: [['static CFG: OnceLock<String>']], call: 'static CFG: OnceLock<String> = OnceLock::new();', note: 'a lazily set global', outs: ['get() = None'],
  intro: 'Fill it later with set or get_or_init.',
  steps: [['Empty.', 0], ['get() is None.', [], 'o0']],
  result: 'None', resultCap: 'OnceCell is the single-thread version.',
}, 'let l: std::sync::OnceLock<String> = std::sync::OnceLock::new(); d(l.get())');

add('oncelock/get', 'get', OL, 'How OnceLock::get works', 'The value if it was set, otherwise None; never waits.', {
  rows: [['empty', 'after set(3)']], call: 'lock.get()', note: 'just look', outs: ['None', 'Some(3)'],
  intro: 'get never initialises.',
  steps: [['Empty: None.', 0, 'o0'], ['After set: Some(3).', 1, 'o1']],
  result: 'None, Some(3)', resultCap: 'wait() blocks until it is set.',
}, 'let l = std::sync::OnceLock::new(); let a = l.get().copied(); let _ = l.set(3); format!("{:?}, {:?}", a, l.get())');

add('oncelock/get_mut', 'get_mut', OL, 'How OnceLock::get_mut works', 'A mutable reference to the value, with exclusive access.', {
  rows: [['OnceLock(1)']], call: 'if let Some(v) = lock.get_mut() { *v += 1; }', note: 'needs &mut', outs: ['2'],
  intro: 'Only possible when nobody else can see the lock.',
  steps: [['The value is 1.', 0], ['It becomes 2.', [], 'o0']],
  result: 'Some(2)', resultCap: 'None if it was never set.',
}, 'let mut l = std::sync::OnceLock::new(); let _ = l.set(1); if let Some(v) = l.get_mut() { *v += 1; } d(l.get())');

add('oncelock/take', 'take', OL, 'How OnceLock::take works', 'Takes the value out, leaving the lock empty.', {
  rows: [['OnceLock("x")']], call: 'lock.take()', note: 'reset', outs: ['Some("x")', 'empty'],
  intro: 'Needs &mut access.',
  steps: [['The value comes out.', 0, 'o0'], ['The lock can be set again.', 0, 'o1']],
  result: 'Some("x"), None', resultCap: 'into_inner consumes the lock instead.',
}, 'let mut l = std::sync::OnceLock::new(); let _ = l.set("x"); let t = l.take(); format!("{:?}, {:?}", t, l.get())');

add('oncelock/into_inner', 'into_inner', OL, 'How OnceLock::into_inner works', 'Unwraps the lock: Some(value) if it was set.', {
  rows: [['set to 9']], call: 'lock.into_inner()', note: 'consumes it', outs: ['Some(9)'],
  intro: 'An empty lock gives None.',
  steps: [['The lock holds 9.', 0], ['Some(9).', [], 'o0']],
  result: 'Some(9)', resultCap: 'take() does it without consuming.',
}, 'let l = std::sync::OnceLock::new(); let _ = l.set(9); d(l.into_inner())');

add('oncelock/wait', 'wait', OL, 'How OnceLock::wait works', 'Blocks until another thread sets the value, then returns it.', {
  rows: [['setter thread', 'reader thread']], call: 'let v = CFG.wait();', note: 'wait for a value', outs: ['reader gets "ready"'],
  intro: 'Unlike get, it does not return None while empty.',
  steps: [['The setter stores "ready".', 0], ['wait() returns it.', 1, 'o0']],
  result: '"ready"', resultCap: 'Never returns if nobody ever sets it.',
}, 'let l = std::sync::Arc::new(std::sync::OnceLock::new()); let l2 = l.clone(); let h = std::thread::spawn(move || { let _ = l2.set("ready"); }); let v = *l.wait(); h.join().unwrap(); d(v)');

add('lazylock/new', 'new', LL, 'How LazyLock::new works', 'A thread-safe value computed on first use.', {
  rows: [['|| (1..=3).sum()']], call: 'static TOTAL: LazyLock<u32> = LazyLock::new(|| (1..=3).sum());', note: 'lazy global', outs: ['first use computes 6'],
  intro: 'Statics can hold computed values this way.',
  steps: [['Only the closure is stored.', 0], ['First access computes 6.', [], 'o0']],
  result: '6', resultCap: 'Replaces lazy_static! and once_cell::Lazy.',
}, 'static TOTAL: std::sync::LazyLock<u32> = std::sync::LazyLock::new(|| (1..=3).sum()); TOTAL.to_string()');

add('lazylock/force_mut', 'force_mut', LL, 'How LazyLock::force_mut works', 'Initialises if needed and gives &mut to the value.', {
  rows: [['LazyLock(|| vec![1])']], call: 'LazyLock::force_mut(&mut lazy).push(2);', note: 'needs &mut', outs: ['[1, 2]'],
  intro: 'For a local LazyLock you own.',
  steps: [['The closure runs: [1].', 0], ['2 is pushed.', [], 'o0']],
  result: '[1, 2]', resultCap: 'force() gives a shared reference.',
}, 'let mut l = std::sync::LazyLock::new(|| vec![1]); std::sync::LazyLock::force_mut(&mut l).push(2); d(&*l)');

add('lazylock/get_mut', 'get_mut', LL, 'How LazyLock::get_mut works', 'A mutable reference to the value if it is already initialised.', {
  rows: [['not yet used', 'after force']], call: 'LazyLock::get_mut(&mut lazy)', note: 'does not initialise', outs: ['None', 'Some'],
  intro: 'Unlike force_mut, it never runs the closure.',
  steps: [['Not initialised: None.', 0, 'o0'], ['After force: Some.', 1, 'o1']],
  result: 'None, Some(5)', resultCap: 'Check without triggering initialisation.',
}, 'let mut l = std::sync::LazyLock::new(|| 5); let a = std::sync::LazyLock::get_mut(&mut l).map(|x| *x); std::sync::LazyLock::force(&l); let b = std::sync::LazyLock::get_mut(&mut l).map(|x| *x); format!("{:?}, {:?}", a, b)');

// ---------------------------------------------------------------- RwLock, poisoning

add('rwlock/new', 'new', RW, 'How RwLock::new works', 'Wraps data so many threads can read or one can write.', {
  rows: [['vec![1]']], call: 'let lock = RwLock::new(vec![1]);', note: 'readers-writer lock', outs: ['RwLock([1])'],
  intro: 'read() for shared access, write() for exclusive access.',
  steps: [['The data goes inside.', 0], ['It starts unlocked.', [], 'o0']],
  result: '[1]', resultCap: 'Share it with Arc<RwLock<T>>.',
}, 'let l = std::sync::RwLock::new(vec![1]); let s = d(&*l.read().unwrap()); s');

add('rwlock/try_write', 'try_write', RW, 'How RwLock::try_write works', 'Takes the write lock if it is free right now; never waits.', {
  rows: [['free', 'a reader is active']], call: 'lock.try_write()', note: 'non-blocking', outs: ['Ok', 'Err(WouldBlock)'],
  intro: 'Fails while any reader or writer holds the lock.',
  steps: [['Free: Ok.', 0, 'o0'], ['A read guard exists: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_read is the reader version.',
}, 'let l = std::sync::RwLock::new(0); let a = if l.try_write().is_ok() { "Ok" } else { "Err" }; let r = l.read().unwrap(); let b = if l.try_write().is_ok() { "Ok" } else { "Err" }; drop(r); format!("{}, {}", a, b)');

add('rwlock/into_inner', 'into_inner', RW, 'How RwLock::into_inner works', 'Takes the data out of the RwLock.', {
  rows: [['RwLock("cfg")']], call: 'lock.into_inner().unwrap()', note: 'consumes the lock', outs: ['"cfg"'],
  intro: 'Owning the lock means nobody else is using it.',
  steps: [['The lock is consumed.', 0], ['The data comes out.', [], 'o0']],
  result: '"cfg"', resultCap: 'Err if a writer panicked (poisoned).',
}, 'let l = std::sync::RwLock::new("cfg"); d(l.into_inner().unwrap())');

add('rwlock/get_mut', 'get_mut', RW, 'How RwLock::get_mut works', 'Direct &mut access when you own the RwLock exclusively.', {
  rows: [['RwLock(1)']], call: '*lock.get_mut().unwrap() += 1;', note: 'no locking needed', outs: ['2'],
  intro: '&mut RwLock already proves exclusivity.',
  steps: [['get_mut lends the value.', 0], ['It becomes 2.', [], 'o0']],
  result: '2', resultCap: 'Cheaper than write().',
}, 'let mut l = std::sync::RwLock::new(1); *l.get_mut().unwrap() += 1; l.into_inner().unwrap().to_string()');

add('rwlock/is_poisoned', 'is_poisoned', RW, 'How RwLock::is_poisoned works', 'true if a writer panicked while holding the lock.', {
  rows: [['normal', 'after a panic in write()']], call: 'lock.is_poisoned()', note: 'data may be inconsistent', outs: ['false', 'true'],
  intro: 'Only a panic during write poisons it; readers do not.',
  steps: [['No panic: false.', 0, 'o0'], ['A writer panicked: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'clear_poison resets it once you have fixed the data.',
}, 'let l = std::sync::Arc::new(std::sync::RwLock::new(0)); let a = l.is_poisoned(); let l2 = l.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = l2.write().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); format!("{}, {}", a, l.is_poisoned())');

add('rwlock/clear_poison', 'clear_poison', RW, 'How RwLock::clear_poison works', 'Marks a poisoned RwLock as healthy again.', {
  rows: [['poisoned']], call: 'lock.clear_poison();', note: 'after repairing the data', outs: ['is_poisoned() = false'],
  intro: 'Call it once you know the data is consistent.',
  steps: [['The lock is poisoned.', 0], ['After clear_poison it is not.', [], 'o0']],
  result: 'true, false', resultCap: 'Mutex::clear_poison does the same for a Mutex.',
}, 'let l = std::sync::Arc::new(std::sync::RwLock::new(0)); let l2 = l.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = l2.write().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); let a = l.is_poisoned(); l.clear_poison(); format!("{}, {}", a, l.is_poisoned())');

add('mutex/clear_poison', 'clear_poison', S('Mutex', 'poison[/]mutex'), 'How Mutex::clear_poison works', 'Marks a poisoned Mutex as healthy again.', {
  rows: [['poisoned']], call: 'm.clear_poison();', note: 'after repairing the data', outs: ['is_poisoned() = false'],
  intro: 'lock() then returns Ok again.',
  steps: [['The Mutex is poisoned.', 0], ['After clear_poison it is not.', [], 'o0']],
  result: 'true, false', resultCap: 'Only clear it once the data is known to be valid.',
}, 'let m = std::sync::Arc::new(std::sync::Mutex::new(0)); let m2 = m.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); let a = m.is_poisoned(); m.clear_poison(); format!("{}, {}", a, m.is_poisoned())');

add('poison_error/into_inner', 'into_inner', PE, 'How PoisonError::into_inner works', 'Gets the guard anyway from a poisoned lock.', {
  rows: [['lock() → Err(PoisonError)']], call: 'let g = m.lock().unwrap_or_else(|e| e.into_inner());', note: 'ignore poisoning', outs: ['guard to the data'],
  intro: 'The data is still there; poisoning is only a warning.',
  steps: [['lock() reports poisoning.', 0], ['into_inner gives the guard regardless.', [], 'o0']],
  result: '41', resultCap: 'A common pattern when a panic cannot leave the data broken.',
}, 'let m = std::sync::Arc::new(std::sync::Mutex::new(41)); let m2 = m.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); let g = m.lock().unwrap_or_else(|e| e.into_inner()); let r = g.to_string(); drop(g); r');

add('poison_error/get_ref', 'get_ref', PE, 'How PoisonError::get_ref works', 'Looks at the guarded data inside a poisoning error.', {
  rows: [['Err(PoisonError)']], call: 'err.get_ref()', note: 'peek at the data', outs: ['&guard'],
  intro: 'Inspect the data before deciding what to do.',
  steps: [['The error holds the guard.', 0], ['get_ref lends it.', [], 'o0']],
  result: '7', resultCap: 'get_mut lends it mutably.',
}, 'let m = std::sync::Arc::new(std::sync::Mutex::new(7)); let m2 = m.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); let r = match m.lock() { Err(e) => e.get_ref().to_string(), Ok(_) => String::new() }; r');

add('poison_error/get_mut', 'get_mut', PE, 'How PoisonError::get_mut works', 'Mutable access to the guarded data inside a poisoning error.', {
  rows: [['Err(PoisonError)']], call: '**err.get_mut() = 0;', note: 'repair the data', outs: ['data reset to 0'],
  intro: 'Fix the data, then clear_poison.',
  steps: [['The guard is lent mutably.', 0], ['The data is reset.', [], 'o0']],
  result: '0', resultCap: 'into_inner takes the guard out instead.',
}, 'let m = std::sync::Arc::new(std::sync::Mutex::new(7)); let m2 = m.clone(); std::panic::set_hook(Box::new(|_| {})); let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); panic!("x"); }).join(); let _ = std::panic::take_hook(); if let Err(mut e) = m.lock() { **e.get_mut() = 0; } m.clear_poison(); let r = m.lock().unwrap().to_string(); r');

add('poison_error/new', 'new', PE, 'How PoisonError::new works', 'Wraps a value in a PoisonError, for your own lock types.', {
  rows: [['5']], call: 'PoisonError::new(5)', note: 'rarely needed', outs: ['into_inner() → 5'],
  intro: 'Lets custom synchronisation types report poisoning like std does.',
  steps: [['5 is wrapped.', 0], ['into_inner gives it back.', [], 'o0']],
  result: '5', resultCap: 'Most code only receives PoisonErrors.',
}, 'std::sync::PoisonError::new(5).into_inner().to_string()');

// ---------------------------------------------------------------- Barrier, channels

add('barrier/new', 'new', S('Barrier', 'barrier'), 'How Barrier::new works', 'A meeting point for n threads.', {
  rows: [['Barrier::new(2)']], call: 'let b = Arc::new(Barrier::new(2));', note: 'n participants', outs: ['wait() blocks until 2 arrive'],
  intro: 'Each thread calls wait(); all continue when the n-th arrives.',
  steps: [['n = 2.', 0], ['Two waits release both threads.', [], 'o0']],
  result: 'both passed', resultCap: 'The barrier can be reused for the next round.',
}, 'let b = std::sync::Arc::new(std::sync::Barrier::new(2)); let b2 = b.clone(); let h = std::thread::spawn(move || { b2.wait(); }); b.wait(); h.join().unwrap(); String::from("both passed")');

add('barrier_wait_result/is_leader', 'is_leader', ['std', 'BarrierWaitResult', new RegExp('sync[/]barrier[.]rs$')], 'How BarrierWaitResult::is_leader works', 'true for exactly one of the threads released by a barrier.', {
  rows: [['3 threads pass']], call: 'if barrier.wait().is_leader() { println!("all here"); }', note: 'one does the extra work', outs: ['1 leader'],
  intro: 'Handy for one-time work after everyone arrives.',
  steps: [['All three are released.', 0], ['One of them is the leader.', [], 'o0']],
  result: '1', resultCap: 'Which thread is leader is not specified.',
}, 'let b = std::sync::Arc::new(std::sync::Barrier::new(3)); let hs: Vec<_> = (0..3).map(|_| { let b = b.clone(); std::thread::spawn(move || b.wait().is_leader()) }).collect(); hs.into_iter().map(|h| h.join().unwrap()).filter(|x| *x).count().to_string()');

add('sync_sender/send', 'send', ['std', 'SyncSender', new RegExp('sync[/]mpsc[.]rs$')], 'How SyncSender::send works', 'Sends a value, waiting if the bounded channel is full.', {
  rows: [['capacity 1']], call: 'tx.send(1)?; tx.send(2)?;   // second waits for a recv', note: 'back-pressure', outs: ['1 and 2 arrive in order'],
  intro: 'With a full channel, send blocks until the receiver makes room.',
  steps: [['1 fills the channel.', 0], ['2 waits until 1 is received.', [], 'o0']],
  result: '[1, 2]', resultCap: 'try_send fails instead of waiting.',
}, 'let (tx, rx) = std::sync::mpsc::sync_channel(1); let h = std::thread::spawn(move || { tx.send(1).unwrap(); tx.send(2).unwrap(); }); let v: Vec<i32> = rx.iter().collect(); h.join().unwrap(); d(v)');

add('sync_sender/try_send', 'try_send', ['std', 'SyncSender', new RegExp('sync[/]mpsc[.]rs$')], 'How SyncSender::try_send works', 'Sends if there is room right now; otherwise returns the value in an error.', {
  rows: [['capacity 1']], call: 'tx.try_send(x)', note: 'non-blocking', outs: ['Ok(())', 'Err(Full(2))'],
  intro: 'The value is given back so nothing is lost.',
  steps: [['Room: Ok.', 0, 'o0'], ['Full: Err(Full(2)).', 0, 'o1']],
  result: 'Ok(()), Err(Full(..))', resultCap: 'Disconnected means the receiver is gone.',
}, 'let (tx, _rx) = std::sync::mpsc::sync_channel(1); let a = tx.try_send(1); let b = tx.try_send(2); format!("{:?}, {}", a, if matches!(b, Err(std::sync::mpsc::TrySendError::Full(2))) { "Err(Full(..))" } else { "?" })');

add('mpsc/iter', 'iter', ['std', 'Receiver', new RegExp('sync[/]mpsc[.]rs$')], 'How Receiver::iter works', 'An iterator that waits for each value and ends when every Sender is gone.', {
  rows: [['sender sends 1, 2, then drops']], call: 'for msg in rx.iter() { ... }', note: 'the receiving loop', outs: ['1', '2', 'loop ends'],
  intro: 'The loop stops by itself once no more values can arrive.',
  steps: [['1, then 2.', 0, 'o0,1'], ['The sender is dropped: the loop ends.', 0, 'o2']],
  result: '[1, 2]', resultCap: 'for msg in rx works the same way.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); std::thread::spawn(move || { tx.send(1).unwrap(); tx.send(2).unwrap(); }); d(rx.iter().collect::<Vec<i32>>())');

module.exports = list;
