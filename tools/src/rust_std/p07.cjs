// Rust standard library: memory helpers (mem), interior mutability (Cell, RefCell, OnceCell, LazyCell), and
// concurrency (Mutex, RwLock, OnceLock, LazyLock, Once, Barrier, atomics, thread, mpsc).
const { group } = require('./kit.cjs');
const MEM = ['core', '', /mem\/mod\.rs$/];
const CELL = ['core', 'Cell', /^src\/cell\.rs$/];
const REFCELL = ['core', 'RefCell', /^src\/cell\.rs$/];
const ONCECELL = ['core', 'OnceCell', /cell\/once\.rs$/];
const LAZYCELL = ['core', 'LazyCell', /cell\/lazy\.rs$/];
const MUTEX = ['std', 'Mutex', /sync\/poison\/mutex\.rs$/];
const RWLOCK = ['std', 'RwLock', /sync\/poison\/rwlock\.rs$/];
const ONCELOCK = ['std', 'OnceLock', /sync\/once_lock\.rs$/];
const LAZYLOCK = ['std', 'LazyLock', /sync\/lazy_lock\.rs$/];
const ATOMIC_INT = ['core', 'atomic_int', /sync\/atomic\.rs$/];
const ATOMIC_BOOL = ['core', 'AtomicBool', /sync\/atomic\.rs$/];
const THREAD_FN = ['std', '', /thread\/functions\.rs$/];
const RECV = ['std', 'Receiver', /sync\/mpsc\.rs$/];
const { list, add } = group({ at: MEM });

// ---------------------------------------------------------------- mem

add('mem/size_of', 'size_of', null, 'How mem::size_of works', 'How many bytes a value of a type takes in memory.', {
  rows: [['u8', 'i32', 'f64', '(u8, u32)']], call: 'std::mem::size_of::<i32>()', note: 'bytes per value', outs: ['1', '4', '8', '8'],
  intro: 'The size is fixed per type and known at compile time.',
  steps: [['u8: 1 byte. i32: 4. f64: 8.', [0, 1, 2], 'o0,1,2'], ['(u8, u32) is 8, not 5: padding keeps the u32 aligned.', 3, 'o3']],
  result: '1, 4, 8, 8', resultCap: 'A Vec or String is always 24 bytes on 64-bit (pointer, length, capacity), however much it holds.',
}, 'use std::mem::size_of; format!("{}, {}, {}, {}", size_of::<u8>(), size_of::<i32>(), size_of::<f64>(), size_of::<(u8, u32)>())');

add('mem/size_of_val', 'size_of_val', null, 'How mem::size_of_val works', 'The size in bytes of the value you point at, even for slices and str.', {
  rows: [['[1u16, 2, 3]', '"héllo"']], call: 'std::mem::size_of_val(&arr[..])', note: 'works for dynamic sizes', outs: ['6', '6'],
  intro: 'For a slice the size depends on the length; size_of_val measures the actual value.',
  steps: [['3 × u16 = 6 bytes.', 0, 'o0'], ['"héllo" is 6 bytes in UTF-8 (é takes 2).', 1, 'o1']],
  result: '6, 6', resultCap: 'For a str, size_of_val equals s.len().',
}, 'let a = [1u16, 2, 3]; format!("{}, {}", std::mem::size_of_val(&a[..]), std::mem::size_of_val("héllo"))');

add('mem/align_of', 'align_of', null, 'How mem::align_of works', 'The address multiple a type must be stored at.', {
  rows: [['u8', 'u32', 'u64']], call: 'std::mem::align_of::<u32>()', note: 'alignment in bytes', outs: ['1', '4', '8'],
  intro: 'A u32 must start at an address divisible by 4; that is why structs get padding.',
  steps: [['u8 can go anywhere: 1.', 0, 'o0'], ['u32: 4. u64: 8.', [1, 2], 'o1,2']],
  result: '1, 4, 8', resultCap: 'Only matters for low-level code, FFI and unsafe pointer work.',
}, 'use std::mem::align_of; format!("{}, {}, {}", align_of::<u8>(), align_of::<u32>(), align_of::<u64>())');

add('mem/drop', 'drop', null, 'How drop works', 'Destroys a value now, instead of at the end of its scope.', {
  kind: 'lines', call: 'let guard = m.lock().unwrap(); ... drop(guard);', note: 'release early',
  lines: ['guard = lock()   (the Mutex is locked)', 'use the data', 'drop(guard)   (unlocked here)', 'other threads can lock again'],
  intro: 'drop takes ownership and lets the value go out of scope at once.',
  steps: [{ cap: 'The lock is held by guard.', show: [0, 1] }, { cap: 'drop(guard) ends its life right here.', show: [2] }, { cap: 'The resource is free before the function ends.', show: [3] }],
  result: 'unlocked: true', resultCap: 'drop is just fn drop<T>(_x: T) {}: moving the value in is what destroys it.',
}, 'let m = std::sync::Mutex::new(1); let g = m.lock().unwrap(); drop(g); format!("unlocked: {}", m.try_lock().is_ok())');

add('mem/forget', 'forget', null, 'How mem::forget works', 'Gives up a value without running its destructor.', {
  rows: [['value with Drop']], call: 'std::mem::forget(v);', note: 'the destructor never runs', outs: ['drops counted: 0'],
  intro: 'forget is safe but leaks: the value\'s memory and resources are never released.',
  steps: [['The value is moved into forget.', 0], ['Its Drop code never runs.', [], 'o0']],
  result: 'dropped: false', resultCap: 'Rarely needed outside FFI; prefer ManuallyDrop or Box::leak.',
}, 'struct D<\'a>(&\'a std::cell::Cell<bool>); impl Drop for D<\'_> { fn drop(&mut self) { self.0.set(true); } } let flag = std::cell::Cell::new(false); std::mem::forget(D(&flag)); format!("dropped: {}", flag.get())');

add('mem/discriminant', 'discriminant', null, 'How mem::discriminant works', 'Compares which enum variant two values are, ignoring their data.', {
  rows: [['Some(1)', 'Some(99)', 'None']], call: 'discriminant(&a) == discriminant(&b)', note: 'same variant?', outs: ['Some vs Some: true', 'Some vs None: false'],
  intro: 'The data inside does not matter, only the variant.',
  steps: [['Some(1) and Some(99): both Some, true.', [0, 1], 'o0'], ['Some(1) and None: false.', [0, 2], 'o1']],
  result: 'true, false', resultCap: 'matches!(x, Some(_)) is simpler when you know the variant you want.',
}, 'use std::mem::discriminant as dd; format!("{}, {}", dd(&Some(1)) == dd(&Some(99)), dd(&Some(1)) == dd(&None))');

add('mem/needs_drop', 'needs_drop', null, 'How mem::needs_drop works', 'Whether dropping a type runs any code.', {
  rows: [['i32', 'String', 'Vec<i32>']], call: 'std::mem::needs_drop::<String>()', note: 'compile-time fact', outs: ['false', 'true', 'true'],
  intro: 'Plain numbers need no clean-up; types that own heap memory do.',
  steps: [['i32: nothing to free.', 0, 'o0'], ['String and Vec free their buffers.', [1, 2], 'o1,2']],
  result: 'false, true, true', resultCap: 'Used by collection code to skip loops over items that need no dropping.',
}, 'use std::mem::needs_drop; format!("{}, {}, {}", needs_drop::<i32>(), needs_drop::<String>(), needs_drop::<Vec<i32>>())');

// ---------------------------------------------------------------- Cell, RefCell, OnceCell, LazyCell

add('cell/new', 'new', CELL, 'How Cell::new works', 'A box for a value that can be changed through a shared reference.', {
  rows: [['5']], call: 'let c = Cell::new(5); c.set(6);', note: 'no &mut needed', outs: ['c.get() = 6'],
  intro: 'Cell gives "interior mutability" for Copy values: you swap whole values in and out.',
  steps: [['The Cell starts with 5.', 0], ['set(6) works even through &c.', [], 'o0']],
  result: '6', resultCap: 'Cell never hands out references to its contents, so it needs no runtime checks.',
}, 'let c = Cell::new(5); c.set(6); c.get().to_string()');

add('cell/replace', 'replace', CELL, 'How Cell::replace works', 'Puts in a new value and returns the old one.', {
  rows: [['Cell(1)']], call: 'let old = c.replace(2);', note: 'swap out', outs: ['old = 1', 'now 2'],
  intro: 'replace is set that also tells you what was there.',
  steps: [['The old value 1 comes out.', 0, 'o0'], ['2 is now inside.', 0, 'o1']],
  result: 'old = 1, now = 2', resultCap: 'Works for non-Copy types too.',
}, 'let c = Cell::new(1); let old = c.replace(2); format!("old = {}, now = {}", old, c.get())');

add('cell/take', 'take', CELL, 'How Cell::take works', 'Takes the value out, leaving the default behind.', {
  rows: [['Cell(vec![1, 2])']], call: 'let v = c.take();', note: 'leaves Vec::new()', outs: ['v = [1, 2]', 'cell = []'],
  intro: 'take works for any type with a Default.',
  steps: [['The Vec comes out.', 0, 'o0'], ['An empty Vec stays in the Cell.', 0, 'o1']],
  result: 'v = [1, 2], cell = []', resultCap: 'The way to get a non-Copy value out of a Cell.',
}, 'let c = Cell::new(vec![1, 2]); let v = c.take(); format!("v = {:?}, cell = {:?}", v, c.take())');

add('cell/swap', 'swap', CELL, 'How Cell::swap works', 'Exchanges the values of two Cells.', {
  rows: [['a = 1', 'b = 2']], call: 'a.swap(&b);', note: 'through shared references', outs: ['a = 2', 'b = 1'],
  intro: 'Both Cells change, using only &a and &b.',
  steps: [['a gets b\'s value.', 0, 'o0'], ['b gets a\'s value.', 1, 'o1']],
  result: 'a = 2, b = 1', resultCap: 'Compare std::mem::swap, which needs &mut to both.',
}, 'let a = Cell::new(1); let b = Cell::new(2); a.swap(&b); format!("a = {}, b = {}", a.get(), b.get())');

add('cell/into_inner', 'into_inner', CELL, 'How Cell::into_inner works', 'Unwraps the Cell and returns its value.', {
  rows: [['Cell("x")']], call: 'c.into_inner()', note: 'consumes the Cell', outs: ['"x"'],
  intro: 'When you are done sharing, into_inner gives the value back.',
  steps: [['The Cell is consumed.', 0], ['Its value comes out.', [], 'o0']],
  result: '"x"', resultCap: 'RefCell, OnceCell and Mutex have into_inner too.',
}, 'let c = Cell::new("x"); d(c.into_inner())');

add('cell/get_mut', 'get_mut', CELL, 'How Cell::get_mut works', 'Normal &mut access when you own the Cell exclusively.', {
  rows: [['Cell(10)']], call: '*c.get_mut() += 5;', note: 'checked by the compiler', outs: ['15'],
  intro: 'With &mut Cell, nobody else can look, so a plain &mut reference is fine.',
  steps: [['get_mut lends &mut 10.', 0], ['It becomes 15.', [], 'o0']],
  result: '15', resultCap: 'No runtime cost; useful during setup before the Cell is shared.',
}, 'let mut c = Cell::new(10); *c.get_mut() += 5; c.get().to_string()');

add('refcell/new', 'new', REFCELL, 'How RefCell::new works', 'A value whose borrowing rules are checked while the program runs.', {
  rows: [['vec![1]']], call: 'let c = RefCell::new(vec![1]); c.borrow_mut().push(2);', note: 'mutate through &c', outs: ['[1, 2]'],
  intro: 'RefCell lets you borrow mutably through a shared reference; misuse panics instead of failing to compile.',
  steps: [['The Vec is wrapped.', 0], ['borrow_mut() lends it mutably; 2 is pushed.', [], 'o0']],
  result: '[1, 2]', resultCap: 'Often combined: Rc<RefCell<T>> for shared, changeable data.',
}, 'let c = RefCell::new(vec![1]); c.borrow_mut().push(2); d(c.borrow())');

add('refcell/try_borrow_mut', 'try_borrow_mut', REFCELL, 'How RefCell::try_borrow_mut works', 'borrow_mut that returns Err instead of panicking when already borrowed.', {
  rows: [['no borrows', 'while borrowed']], call: 'c.try_borrow_mut()', note: 'safe check', outs: ['Ok', 'Err'],
  intro: 'Only one mutable borrow, and no shared ones, may exist at a time.',
  steps: [['Nothing is borrowed: Ok.', 0, 'o0'], ['A borrow() is still alive: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_borrow is the read-only version.',
}, 'let c = RefCell::new(1); let a = if c.try_borrow_mut().is_ok() { "Ok" } else { "Err" }; let r = c.borrow(); let b = if c.try_borrow_mut().is_ok() { "Ok" } else { "Err" }; drop(r); format!("{}, {}", a, b)');

add('refcell/try_borrow', 'try_borrow', REFCELL, 'How RefCell::try_borrow works', 'borrow that returns Err instead of panicking when mutably borrowed.', {
  rows: [['shared borrows', 'while borrow_mut']], call: 'c.try_borrow()', note: 'many readers, or one writer', outs: ['Ok', 'Err'],
  intro: 'Any number of readers are fine, but not while a writer exists.',
  steps: [['Another borrow() exists: still Ok.', 0, 'o0'], ['A borrow_mut() is alive: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Use it in code that might be re-entered, e.g. callbacks.',
}, 'let c = RefCell::new(1); let r1 = c.borrow(); let a = if c.try_borrow().is_ok() { "Ok" } else { "Err" }; drop(r1); let w = c.borrow_mut(); let b = if c.try_borrow().is_ok() { "Ok" } else { "Err" }; drop(w); format!("{}, {}", a, b)');

add('refcell/take', 'take', REFCELL, 'How RefCell::take works', 'Takes the value out, leaving the default in its place.', {
  rows: [['RefCell(vec![3, 4])']], call: 'let v = c.take();', note: 'empty it out', outs: ['v = [3, 4]', 'c = []'],
  intro: 'take is replace(Default::default()).',
  steps: [['The Vec comes out.', 0, 'o0'], ['An empty one stays.', 0, 'o1']],
  result: 'v = [3, 4], c = []', resultCap: 'Panics if the value is currently borrowed.',
}, 'let c = RefCell::new(vec![3, 4]); let v = c.take(); format!("v = {:?}, c = {:?}", v, c.borrow())');

add('refcell/into_inner', 'into_inner', REFCELL, 'How RefCell::into_inner works', 'Unwraps the RefCell and returns its value.', {
  rows: [['RefCell(String "done")']], call: 'c.into_inner()', note: 'no more runtime checks', outs: ['"done"'],
  intro: 'Owning the RefCell means no borrows can exist, so unwrapping is always safe.',
  steps: [['The RefCell is consumed.', 0], ['The String comes out.', [], 'o0']],
  result: '"done"', resultCap: 'Rc::try_unwrap(rc).unwrap().into_inner() gets data out of Rc<RefCell<T>>.',
}, 'let c = RefCell::new(String::from("done")); d(c.into_inner())');

add('refcell/replace_with', 'replace_with', REFCELL, 'How RefCell::replace_with works', 'Computes the new value from the old one, and returns the old one.', {
  rows: [['RefCell(5)']], call: 'let old = c.replace_with(|&mut x| x * 10);', note: 'update in one step', outs: ['old = 5', 'now 50'],
  intro: 'The closure sees the current value and returns the replacement.',
  steps: [['The closure gets 5 and returns 50.', 0, 'o1'], ['The old 5 is returned.', 0, 'o0']],
  result: 'old = 5, now = 50', resultCap: 'Panics if the value is borrowed elsewhere.',
}, 'let c = RefCell::new(5); let old = c.replace_with(|&mut x| x * 10); format!("old = {}, now = {}", old, c.borrow())');

add('refcell/swap', 'swap', REFCELL, 'How RefCell::swap works', 'Exchanges the values of two RefCells.', {
  rows: [['a = "x"', 'b = "y"']], call: 'a.swap(&b);', note: 'through &', outs: ['a = "y"', 'b = "x"'],
  intro: 'Both are borrowed mutably for the moment of the swap.',
  steps: [['a gets "y".', 0, 'o0'], ['b gets "x".', 1, 'o1']],
  result: 'a = "y", b = "x"', resultCap: 'Panics if either is already borrowed.',
}, 'let a = RefCell::new("x"); let b = RefCell::new("y"); a.swap(&b); format!("a = {:?}, b = {:?}", a.borrow(), b.borrow())');

add('oncecell/set', 'set', ONCECELL, 'How OnceCell::set works', 'Fills an empty OnceCell; a second set fails.', {
  rows: [['set(1)', 'set(2)']], call: 'cell.set(1)', note: 'write once', outs: ['Ok(())', 'Err(2)'],
  intro: 'The first set wins; later ones get their value back in Err.',
  steps: [['The cell was empty: Ok.', 0, 'o0'], ['Already filled: Err(2), the value stays 1.', 1, 'o1']],
  result: 'Ok(()), Err(2), value = Some(1)', resultCap: 'get_or_init is easier when you can compute the value on the spot.',
}, 'let c = std::cell::OnceCell::new(); let a = c.set(1); let b = c.set(2); format!("{:?}, {:?}, value = {:?}", a, b, c.get())');

add('oncecell/get', 'get', ONCECELL, 'How OnceCell::get works', 'The value if it was set, otherwise None.', {
  rows: [['empty', 'after set("ready")']], call: 'cell.get()', note: 'never blocks or initialises', outs: ['None', 'Some("ready")'],
  intro: 'get just looks; it never fills the cell.',
  steps: [['Empty: None.', 0, 'o0'], ['After set: Some.', 1, 'o1']],
  result: 'None, Some("ready")', resultCap: 'OnceLock::get is the thread-safe equivalent.',
}, 'let c = std::cell::OnceCell::new(); let a = c.get().copied(); let _ = c.set("ready"); format!("{:?}, {:?}", a, c.get())');

add('lazycell/force', 'force', LAZYCELL, 'How LazyCell works', 'A value computed the first time it is used.', {
  rows: [['LazyCell::new(|| 2 + 3)']], call: 'let v = *LazyCell::force(&lazy);   // or just *lazy', note: 'lazy initialisation', outs: ['first use: computes 5', 'later: reuses 5'],
  intro: 'The closure is stored, and runs only on first access.',
  steps: [['First access runs the closure.', 0, 'o0'], ['Later accesses return the stored value.', 0, 'o1']],
  result: '5', resultCap: 'std::sync::LazyLock is the thread-safe version, used for globals.',
}, 'let lazy = std::cell::LazyCell::new(|| 2 + 3); std::cell::LazyCell::force(&lazy).to_string()');

// ---------------------------------------------------------------- Mutex, RwLock, OnceLock, LazyLock

add('mutex/new', 'new', MUTEX, 'How Mutex::new works', 'Wraps data so only one thread at a time can use it.', {
  rows: [['0']], call: 'let m = Mutex::new(0);', note: 'mutual exclusion', outs: ['Mutex(0), unlocked'],
  intro: 'The data lives inside the Mutex; the only way in is lock().',
  steps: [['0 goes inside.', 0], ['It starts unlocked.', [], 'o0']],
  result: '0', resultCap: 'Share it between threads with Arc<Mutex<T>>.',
}, 'let m = std::sync::Mutex::new(0); let s = m.lock().unwrap().to_string(); s');

add('mutex/try_lock', 'try_lock', MUTEX, 'How Mutex::try_lock works', 'Locks if free right now; never waits.', {
  rows: [['free', 'already locked']], call: 'm.try_lock()', note: 'no blocking', outs: ['Ok(guard)', 'Err(WouldBlock)'],
  intro: 'lock() waits; try_lock() gives up at once if someone else holds the lock.',
  steps: [['Free: you get the guard.', 0, 'o0'], ['Held elsewhere: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Useful to avoid deadlocks, or to skip work when a resource is busy.',
}, 'let m = std::sync::Mutex::new(0); let a = if m.try_lock().is_ok() { "Ok" } else { "Err" }; let g = m.lock().unwrap(); let b = if m.try_lock().is_ok() { "Ok" } else { "Err" }; drop(g); format!("{}, {}", a, b)');

add('mutex/into_inner', 'into_inner', MUTEX, 'How Mutex::into_inner works', 'Takes the data out of the Mutex for good.', {
  rows: [['Mutex([1, 2])']], call: 'm.into_inner().unwrap()', note: 'no lock needed', outs: ['[1, 2]'],
  intro: 'Owning the Mutex means no other thread can use it, so no locking is needed.',
  steps: [['The Mutex is consumed.', 0], ['The Vec comes out.', [], 'o0']],
  result: '[1, 2]', resultCap: 'With Arc<Mutex<T>>, first get the Mutex back with Arc::into_inner.',
}, 'let m = std::sync::Mutex::new(vec![1, 2]); d(m.into_inner().unwrap())');

add('mutex/get_mut', 'get_mut', MUTEX, 'How Mutex::get_mut works', 'Direct &mut access when you own the Mutex exclusively.', {
  rows: [['Mutex(1)']], call: '*m.get_mut().unwrap() += 1;', note: 'compiler-checked, no lock', outs: ['2'],
  intro: '&mut Mutex already proves nobody else is using it.',
  steps: [['get_mut lends &mut 1.', 0], ['It becomes 2.', [], 'o0']],
  result: '2', resultCap: 'Cheaper than lock() during setup.',
}, 'let mut m = std::sync::Mutex::new(1); *m.get_mut().unwrap() += 1; let s = m.lock().unwrap().to_string(); s');

add('mutex/is_poisoned', 'is_poisoned', MUTEX, 'How Mutex::is_poisoned works', 'true if a thread panicked while holding the lock.', {
  rows: [['normal', 'after a panic in lock']], call: 'm.is_poisoned()', note: 'the data may be half-updated', outs: ['false', 'true'],
  intro: 'A panic while locked "poisons" the Mutex, warning that the data might be inconsistent.',
  steps: [['No panic so far: false.', 0, 'o0'], ['A thread panicked holding the lock: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'lock() then returns Err(PoisonError); into_inner() on that error still gives the data.',
}, 'let m = std::sync::Arc::new(std::sync::Mutex::new(0)); let a = m.is_poisoned(); let m2 = m.clone(); let _ = std::thread::spawn(move || { let _g = m2.lock().unwrap(); std::panic::set_hook(Box::new(|_| {})); panic!("x"); }).join(); let _ = std::panic::take_hook(); format!("{}, {}", a, m.is_poisoned())');

add('rwlock/read', 'read', RWLOCK, 'How RwLock::read works', 'Shared read access: many readers at once.', {
  rows: [['reader 1', 'reader 2']], call: 'let r = lock.read().unwrap();', note: 'readers do not block each other', outs: ['sees 5', 'sees 5'],
  intro: 'An RwLock allows many readers or one writer.',
  steps: [['Reader 1 gets access.', 0, 'o0'], ['Reader 2 too, at the same time.', 1, 'o1']],
  result: '5 + 5 = 10', resultCap: 'Good for data that is read often and changed rarely, like configuration.',
}, 'let l = std::sync::RwLock::new(5); let a = l.read().unwrap(); let b = l.read().unwrap(); format!("{} + {} = {}", *a, *b, *a + *b)');

add('rwlock/write', 'write', RWLOCK, 'How RwLock::write works', 'Exclusive write access: waits until no readers or writers remain.', {
  rows: [['RwLock(vec![])']], call: 'lock.write().unwrap().push(1);', note: 'one writer, nobody else', outs: ['[1]'],
  intro: 'write() blocks new readers and waits for current ones to finish.',
  steps: [['The write guard gives &mut access.', 0], ['1 is pushed; the guard drops at the end of the line.', [], 'o0']],
  result: '[1]', resultCap: 'Holding a read guard and calling write() on the same thread deadlocks.',
}, 'let l = std::sync::RwLock::new(Vec::new()); l.write().unwrap().push(1); let s = d(&*l.read().unwrap()); s');

add('rwlock/try_read', 'try_read', RWLOCK, 'How RwLock::try_read works', 'Reads if possible right now; never waits.', {
  rows: [['no writer', 'writer active']], call: 'lock.try_read()', note: 'non-blocking', outs: ['Ok', 'Err(WouldBlock)'],
  intro: 'Fails at once while a writer holds the lock.',
  steps: [['No writer: Ok.', 0, 'o0'], ['A write guard is alive: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'try_write is the writer version.',
}, 'let l = std::sync::RwLock::new(0); let a = if l.try_read().is_ok() { "Ok" } else { "Err" }; let w = l.write().unwrap(); let b = if l.try_read().is_ok() { "Ok" } else { "Err" }; drop(w); format!("{}, {}", a, b)');

add('oncelock/get_or_init', 'get_or_init', ONCELOCK, 'How OnceLock::get_or_init works', 'Initialises a value exactly once, even with many threads racing.', {
  rows: [['thread A', 'thread B']], call: 'CONFIG.get_or_init(|| load())', note: 'for globals', outs: ['runs load()', 'waits, then reuses'],
  intro: 'The first caller runs the closure; everyone else gets the same stored value.',
  steps: [['A arrives first and initialises.', 0, 'o0'], ['B gets the stored value; the closure never runs twice.', 1, 'o1']],
  result: '"cfg" (initialised 1 time)', resultCap: 'static CONFIG: OnceLock<Config> = OnceLock::new(); is the classic use.',
}, 'static CELL: std::sync::OnceLock<&str> = std::sync::OnceLock::new(); static RUNS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0); let hs: Vec<_> = (0..2).map(|_| std::thread::spawn(|| *CELL.get_or_init(|| { RUNS.fetch_add(1, std::sync::atomic::Ordering::SeqCst); "cfg" }))).collect(); for h in hs { h.join().unwrap(); } format!("{:?} (initialised {} time)", CELL.get().unwrap(), RUNS.load(std::sync::atomic::Ordering::SeqCst))');

add('oncelock/set', 'set', ONCELOCK, 'How OnceLock::set works', 'Fills the OnceLock if empty; otherwise returns your value in Err.', {
  rows: [['set(1)', 'set(2)']], call: 'lock.set(1)', note: 'write once, read forever', outs: ['Ok(())', 'Err(2)'],
  intro: 'Thread-safe write-once storage.',
  steps: [['Empty: Ok.', 0, 'o0'], ['Already set: Err(2).', 1, 'o1']],
  result: 'Ok(()), Err(2)', resultCap: 'get() returns Some only after a successful set.',
}, 'let l = std::sync::OnceLock::new(); format!("{:?}, {:?}", l.set(1), l.set(2))');

add('lazylock/force', 'force', LAZYLOCK, 'How LazyLock works', 'A global value computed on first use, safely across threads.', {
  rows: [['static SQUARES: LazyLock<Vec<u32>>']], call: 'LazyLock::new(|| (1..=4).map(|x| x * x).collect())', note: 'a lazily built global', outs: ['[1, 4, 9, 16]'],
  intro: 'Statics must be constant; LazyLock lets them hold computed values like a Vec or a HashMap.',
  steps: [['The first access runs the closure.', 0], ['Every later access, from any thread, sees the same Vec.', [], 'o0']],
  result: '[1, 4, 9, 16]', resultCap: 'Replaces the older lazy_static! and once_cell crates.',
}, 'static SQUARES: std::sync::LazyLock<Vec<u32>> = std::sync::LazyLock::new(|| (1..=4).map(|x| x * x).collect()); d(&*std::sync::LazyLock::force(&SQUARES))');

add('once/call_once', 'call_once', ['std', 'Once', /sync\/once\.rs$/], 'How Once::call_once works', 'Runs a piece of code only the first time, no matter how often it is called.', {
  rows: [['call 1', 'call 2', 'call 3']], call: 'INIT.call_once(|| setup());', note: 'one-time setup', outs: ['runs setup', 'skipped', 'skipped'],
  intro: 'Once remembers that it has run.',
  steps: [['The first call runs the closure.', 0, 'o0'], ['Later calls do nothing.', [1, 2], 'o1,2']],
  result: 'ran 1 time', resultCap: 'OnceLock is usually nicer, because it also stores a value.',
}, 'let once = std::sync::Once::new(); let mut n = 0; for _ in 0..3 { once.call_once(|| n += 1); } format!("ran {} time", n)');

add('barrier/wait', 'wait', ['std', 'Barrier', /sync\/barrier\.rs$/], 'How Barrier::wait works', 'Makes threads wait until all of them have arrived.', {
  rows: [['thread 1', 'thread 2', 'thread 3']], call: 'barrier.wait();   // Barrier::new(3)', note: 'a meeting point', outs: ['waits', 'waits', 'all continue'],
  intro: 'Each thread blocks in wait() until the third one arrives.',
  steps: [['Threads 1 and 2 arrive and wait.', [0, 1], 'o0,1'], ['Thread 3 arrives: all three continue together.', 2, 'o2']],
  result: '1 leader of 3', resultCap: 'Exactly one thread gets is_leader() == true, handy for one-time work after the barrier.',
}, 'let b = std::sync::Arc::new(std::sync::Barrier::new(3)); let hs: Vec<_> = (0..3).map(|_| { let b = b.clone(); std::thread::spawn(move || b.wait().is_leader()) }).collect(); let leaders = hs.into_iter().map(|h| h.join().unwrap()).filter(|x| *x).count(); format!("{} leader of 3", leaders)');

// ---------------------------------------------------------------- atomics

add('atomic/fetch_add', 'fetch_add', ATOMIC_INT, 'How fetch_add works on atomics', 'Adds to an atomic integer and returns the previous value, safely across threads.', {
  rows: [['thread A +1', 'thread B +1', 'thread C +1']], call: 'counter.fetch_add(1, Ordering::SeqCst)', note: 'a lock-free counter', outs: ['0 → 1', '1 → 2', '2 → 3'],
  intro: 'Each fetch_add is one indivisible step: no update is ever lost.',
  steps: [['A sees 0 and leaves 1.', 0, 'o0'], ['B sees 1, C sees 2.', [1, 2], 'o1,2']],
  result: '3', resultCap: 'Works for every AtomicI*/AtomicU* type. SeqCst is the safe default ordering.',
}, 'use std::sync::atomic::{AtomicUsize, Ordering}; static C: AtomicUsize = AtomicUsize::new(0); let hs: Vec<_> = (0..3).map(|_| std::thread::spawn(|| { C.fetch_add(1, Ordering::SeqCst); })).collect(); for h in hs { h.join().unwrap(); } C.load(Ordering::SeqCst).to_string()');

add('atomic/load', 'load', ATOMIC_INT, 'How load works on atomics', 'Reads the current value of an atomic integer.', {
  rows: [['AtomicU32(7)']], call: 'x.load(Ordering::SeqCst)', note: 'an atomic read', outs: ['7'],
  intro: 'load reads the value without tearing, even while other threads write.',
  steps: [['The value is 7.', 0], ['load returns 7.', [], 'o0']],
  result: '7', resultCap: 'Relaxed ordering is enough for simple statistics; use SeqCst when unsure.',
}, 'let x = std::sync::atomic::AtomicU32::new(7); x.load(std::sync::atomic::Ordering::SeqCst).to_string()');

add('atomic/store', 'store', ATOMIC_INT, 'How store works on atomics', 'Writes a new value into an atomic integer.', {
  rows: [['AtomicI64(0)']], call: 'x.store(42, Ordering::SeqCst)', note: 'an atomic write', outs: ['42'],
  intro: 'store replaces the value in one indivisible step.',
  steps: [['42 is written.', 0], ['Every thread now reads 42.', [], 'o0']],
  result: '42', resultCap: 'swap does the same and also returns the old value.',
}, 'let x = std::sync::atomic::AtomicI64::new(0); x.store(42, std::sync::atomic::Ordering::SeqCst); x.load(std::sync::atomic::Ordering::SeqCst).to_string()');

add('atomic/fetch_sub', 'fetch_sub', ATOMIC_INT, 'How fetch_sub works on atomics', 'Subtracts and returns the previous value.', {
  rows: [['AtomicUsize(3)']], call: 'remaining.fetch_sub(1, Ordering::SeqCst)', note: 'count down', outs: ['returns 3', 'now 2'],
  intro: 'The returned old value tells you who reached zero first.',
  steps: [['The old value 3 is returned.', 0, 'o0'], ['The atomic now holds 2.', 0, 'o1']],
  result: '3, now 2', resultCap: 'if x.fetch_sub(1, ..) == 1 { /* I was the last one */ } is a common pattern.',
}, 'let x = std::sync::atomic::AtomicUsize::new(3); let old = x.fetch_sub(1, std::sync::atomic::Ordering::SeqCst); format!("{}, now {}", old, x.load(std::sync::atomic::Ordering::SeqCst))');

add('atomic/swap', 'swap', ATOMIC_INT, 'How swap works on atomics', 'Stores a new value and returns the old one, in one step.', {
  rows: [['AtomicU8(1)']], call: 'x.swap(9, Ordering::SeqCst)', note: 'exchange', outs: ['returns 1', 'now 9'],
  intro: 'swap is store plus "what was there before?".',
  steps: [['1 is returned.', 0, 'o0'], ['9 is stored.', 0, 'o1']],
  result: '1, now 9', resultCap: 'Handy to take a pending count and reset it: x.swap(0, ..).',
}, 'let x = std::sync::atomic::AtomicU8::new(1); let old = x.swap(9, std::sync::atomic::Ordering::SeqCst); format!("{}, now {}", old, x.load(std::sync::atomic::Ordering::SeqCst))');

add('atomic/compare_exchange', 'compare_exchange', ATOMIC_INT, 'How compare_exchange works on atomics', 'Stores a new value only if the current one is what you expect.', {
  rows: [['expect 5, have 5', 'expect 5, have 6']], call: 'x.compare_exchange(5, 10, SeqCst, SeqCst)', note: 'compare-and-swap', outs: ['Ok(5), now 10', 'Err(6), unchanged'],
  intro: 'The building block of lock-free code: change it only if nobody else did in the meantime.',
  steps: [['The value is 5 as expected: it becomes 10.', 0, 'o0'], ['Someone changed it to 6: Err(6), nothing is written.', 1, 'o1']],
  result: 'Ok(5), Err(10)', resultCap: 'On Err you get the actual value, so you can retry with it.',
}, 'use std::sync::atomic::{AtomicI32, Ordering::SeqCst}; let x = AtomicI32::new(5); let a = x.compare_exchange(5, 10, SeqCst, SeqCst); let b = x.compare_exchange(5, 20, SeqCst, SeqCst); format!("{:?}, {:?}", a, b)');

add('atomic/fetch_max', 'fetch_max', ATOMIC_INT, 'How fetch_max works on atomics', 'Keeps the larger of the current and the given value.', {
  rows: [['current 7, offer 3', 'current 7, offer 12']], call: 'best.fetch_max(score, Ordering::SeqCst)', note: 'a shared high score', outs: ['stays 7', 'becomes 12'],
  intro: 'Many threads can report scores; only the highest survives.',
  steps: [['3 < 7: unchanged.', 0, 'o0'], ['12 > 7: updated.', 1, 'o1']],
  result: '12', resultCap: 'fetch_min keeps the smaller one.',
}, 'use std::sync::atomic::{AtomicU32, Ordering::SeqCst}; let b = AtomicU32::new(7); b.fetch_max(3, SeqCst); b.fetch_max(12, SeqCst); b.load(SeqCst).to_string()');

add('atomic/fetch_update', 'fetch_update', ATOMIC_INT, 'How fetch_update works on atomics', 'Applies a function to the value, retrying until no other thread interferes.', {
  rows: [['AtomicU32(10)']], call: 'x.fetch_update(SeqCst, SeqCst, |v| v.checked_sub(3))', note: 'any update, atomically', outs: ['Ok(10)', 'now 7'],
  intro: 'The closure returns Some(new value), or None to give up.',
  steps: [['The closure turns 10 into 7.', 0, 'o1'], ['The old value is returned in Ok.', 0, 'o0']],
  result: 'Ok(10), now 7', resultCap: 'It loops over compare_exchange for you.',
}, 'use std::sync::atomic::{AtomicU32, Ordering::SeqCst}; let x = AtomicU32::new(10); let r = x.fetch_update(SeqCst, SeqCst, |v| v.checked_sub(3)); format!("{:?}, now {}", r, x.load(SeqCst))');

add('atomicbool/store', 'store', ATOMIC_BOOL, 'How AtomicBool::store works', 'Sets a flag that every thread can see.', {
  rows: [['running = true']], call: 'running.store(false, Ordering::SeqCst)', note: 'a stop signal', outs: ['false'],
  intro: 'A common way to tell worker threads to stop.',
  steps: [['The main thread stores false.', 0], ['Workers checking load() see false and stop.', [], 'o0']],
  result: 'false', resultCap: 'Workers loop with while running.load(Ordering::SeqCst) { ... }.',
}, 'let r = std::sync::atomic::AtomicBool::new(true); r.store(false, std::sync::atomic::Ordering::SeqCst); r.load(std::sync::atomic::Ordering::SeqCst).to_string()');

add('atomicbool/swap', 'swap', ATOMIC_BOOL, 'How AtomicBool::swap works', 'Sets the flag and returns what it was.', {
  rows: [['first caller', 'second caller']], call: 'done.swap(true, Ordering::SeqCst)', note: 'who was first?', outs: ['false (I was first)', 'true'],
  intro: 'Exactly one thread sees false: the one that flipped the flag.',
  steps: [['First swap: was false.', 0, 'o0'], ['Second swap: was already true.', 1, 'o1']],
  result: 'false, true', resultCap: 'A tiny "run once" or "claim this job" mechanism.',
}, 'let f = std::sync::atomic::AtomicBool::new(false); let a = f.swap(true, std::sync::atomic::Ordering::SeqCst); let b = f.swap(true, std::sync::atomic::Ordering::SeqCst); format!("{}, {}", a, b)');

add('atomicbool/fetch_or', 'fetch_or', ATOMIC_BOOL, 'How AtomicBool::fetch_or works', 'Sets the flag to (flag OR value) and returns the old flag.', {
  rows: [['false | true', 'true | false']], call: 'error_seen.fetch_or(failed, Ordering::SeqCst)', note: 'sticky flag', outs: ['old false, now true', 'old true, stays true'],
  intro: 'Once any thread reports true, the flag stays true.',
  steps: [['A failure sets it.', 0, 'o0'], ['A later success cannot clear it.', 1, 'o1']],
  result: 'true', resultCap: 'fetch_and and fetch_xor exist too.',
}, 'let f = std::sync::atomic::AtomicBool::new(false); f.fetch_or(true, std::sync::atomic::Ordering::SeqCst); f.fetch_or(false, std::sync::atomic::Ordering::SeqCst); f.load(std::sync::atomic::Ordering::SeqCst).to_string()');

// ---------------------------------------------------------------- thread, mpsc

add('thread/sleep', 'sleep', THREAD_FN, 'How thread::sleep works', 'Pauses the current thread for at least the given time.', {
  rows: [['sleep(50 ms)']], call: 'thread::sleep(Duration::from_millis(50));', note: 'at least, never less', outs: ['≥ 50 ms passed'],
  intro: 'The thread stops; other threads keep running.',
  steps: [['The thread is suspended.', 0], ['The OS wakes it after 50 ms or a bit more.', [], 'o0']],
  result: 'slept at least 50 ms: true', resultCap: 'Never use sleep to wait for another thread: use join, a channel or a Condvar.',
}, 'let t = std::time::Instant::now(); std::thread::sleep(std::time::Duration::from_millis(50)); format!("slept at least 50 ms: {}", t.elapsed() >= std::time::Duration::from_millis(50))');

add('thread/scope', 'scope', ['std', '', /thread\/scoped\.rs$/], 'How thread::scope works', 'Starts threads that may borrow local variables; all of them finish before scope returns.', {
  rows: [['data = [1, 2, 3, 4]']], call: 'thread::scope(|s| { s.spawn(|| ...); s.spawn(|| ...); })', note: 'no Arc, no move', outs: ['left half: 3', 'right half: 7'],
  intro: 'Because the threads are joined at the end of scope, they can safely borrow data.',
  steps: [['Thread 1 sums [1, 2].', 0, 'o0'], ['Thread 2 sums [3, 4], at the same time.', 0, 'o1']],
  result: '3 + 7 = 10', resultCap: 'The easiest way to split work over threads.',
}, 'let data = [1, 2, 3, 4]; let (a, b) = std::thread::scope(|s| { let x = s.spawn(|| data[..2].iter().sum::<i32>()); let y = s.spawn(|| data[2..].iter().sum::<i32>()); (x.join().unwrap(), y.join().unwrap()) }); format!("{} + {} = {}", a, b, a + b)');

add('thread/current', 'current', ['std', '', /thread\/current\.rs$/], 'How thread::current works', 'A handle to the thread that is running this code.', {
  rows: [['Builder::new().name("worker")']], call: 'thread::current().name()', note: 'who am I?', outs: ['Some("worker")'],
  intro: 'Threads can have names, which show up in panic messages.',
  steps: [['The thread was named "worker".', 0], ['current().name() returns it.', [], 'o0']],
  result: 'Some("worker")', resultCap: 'The main thread is called "main"; unnamed threads give None.',
}, 'let h = std::thread::Builder::new().name("worker".into()).spawn(|| std::thread::current().name().map(String::from)).unwrap(); d(h.join().unwrap())');

add('thread/builder_spawn', 'spawn', ['std', 'Builder', /thread\/builder\.rs$/], 'How thread::Builder::spawn works', 'Starts a thread with settings such as a name or a stack size.', {
  rows: [['name "io"', 'stack 4 MB']], call: 'Builder::new().name("io".into()).stack_size(4 << 20).spawn(|| ...)', note: 'configured threads', outs: ['Ok(JoinHandle)'],
  intro: 'Unlike thread::spawn, this returns a Result: creating a thread can fail.',
  steps: [['The settings are collected.', [0, 1]], ['spawn starts the thread.', [], 'o0']],
  result: '"io"', resultCap: 'A bigger stack helps deeply recursive code.',
}, 'let h = std::thread::Builder::new().name("io".into()).stack_size(4 << 20).spawn(|| std::thread::current().name().unwrap().to_string()).unwrap(); d(h.join().unwrap())');

add('thread/is_finished', 'is_finished', ['std', 'JoinHandle', /thread\/join_handle\.rs$/], 'How JoinHandle::is_finished works', 'Checks whether the thread is done, without waiting.', {
  rows: [['still running', 'done']], call: 'h.is_finished()', note: 'polling', outs: ['false', 'true'],
  intro: 'is_finished never blocks; join() still has to be called to get the result.',
  steps: [['While working: false.', 0, 'o0'], ['After it returned: true.', 1, 'o1']],
  result: 'false, true', resultCap: 'Useful for showing progress while background work runs.',
}, 'let (tx, rx) = std::sync::mpsc::channel::<()>(); let h = std::thread::spawn(move || { rx.recv().ok(); }); let a = h.is_finished(); tx.send(()).unwrap(); while !h.is_finished() { std::thread::yield_now(); } let b = h.is_finished(); h.join().unwrap(); format!("{}, {}", a, b)');

add('mpsc/sync_channel', 'sync_channel', ['std', '', /sync\/mpsc\.rs$/], 'How mpsc::sync_channel works', 'A channel with a fixed capacity: send waits when it is full.', {
  rows: [['capacity 1']], call: 'let (tx, rx) = mpsc::sync_channel(1);', note: 'back-pressure', outs: ['try_send(1) → Ok', 'try_send(2) → Full'],
  intro: 'A bounded channel stops a fast producer from running far ahead of the consumer.',
  steps: [['The first value fits.', 0, 'o0'], ['The channel is full: send would wait, try_send fails.', 0, 'o1']],
  result: 'Ok, Full', resultCap: 'sync_channel(0) makes every send wait for a matching recv (a rendezvous).',
}, 'let (tx, _rx) = std::sync::mpsc::sync_channel(1); let a = tx.try_send(1).is_ok(); let b = matches!(tx.try_send(2), Err(std::sync::mpsc::TrySendError::Full(_))); format!("{}, {}", if a { "Ok" } else { "Err" }, if b { "Full" } else { "?" })');

add('mpsc/try_recv', 'try_recv', RECV, 'How Receiver::try_recv works', 'Takes a value if one is waiting; never blocks.', {
  rows: [['empty', 'one value', 'senders gone']], call: 'rx.try_recv()', note: 'non-blocking', outs: ['Err(Empty)', 'Ok(1)', 'Err(Disconnected)'],
  intro: 'try_recv answers immediately.',
  steps: [['Nothing sent yet: Empty.', 0, 'o0'], ['A value is waiting: Ok(1).', 1, 'o1'], ['Every Sender is dropped: Disconnected.', 2, 'o2']],
  result: 'Err(Empty), Ok(1), Err(Disconnected)', resultCap: 'Good for game loops: handle all pending messages, then draw a frame.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); let a = rx.try_recv(); tx.send(1).unwrap(); let b = rx.try_recv(); drop(tx); let c = rx.try_recv(); format!("{:?}, {:?}, {:?}", a, b, c)');

add('mpsc/recv_timeout', 'recv_timeout', RECV, 'How Receiver::recv_timeout works', 'Waits for a value, but only up to a time limit.', {
  rows: [['value arrives', 'nothing for 10 ms']], call: 'rx.recv_timeout(Duration::from_millis(10))', note: 'bounded waiting', outs: ['Ok(5)', 'Err(Timeout)'],
  intro: 'recv waits forever; recv_timeout gives up after the duration.',
  steps: [['A value is ready: Ok(5).', 0, 'o0'], ['Nothing within 10 ms: Timeout.', 1, 'o1']],
  result: 'Ok(5), Err(Timeout)', resultCap: 'Lets a worker wake up regularly to check a stop flag.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); tx.send(5).unwrap(); let a = rx.recv_timeout(std::time::Duration::from_millis(10)); let b = rx.recv_timeout(std::time::Duration::from_millis(10)); drop(tx); format!("{:?}, {:?}", a, b)');

add('mpsc/try_iter', 'try_iter', RECV, 'How Receiver::try_iter works', 'An iterator over the values already waiting, without blocking.', {
  rows: [nums3()], call: 'rx.try_iter().collect::<Vec<_>>()', note: 'drain what is there', outs: ['[1, 2, 3]'],
  intro: 'try_iter stops as soon as the channel is empty, even if Senders still exist.',
  steps: [['Three values are waiting.', [0, 1, 2]], ['They are collected; then it stops.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'iter() would instead wait for more until every Sender is gone.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); for i in 1..=3 { tx.send(i).unwrap(); } d(rx.try_iter().collect::<Vec<_>>())');

function nums3() { return ['1', '2', '3']; }

module.exports = list;
