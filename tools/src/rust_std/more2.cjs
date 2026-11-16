// Rust standard library, batch 2b: threads and channels, Arc/Weak/OnceCell, Duration, Path, Ordering, char, f64.
const { group, nums } = require('./kit.cjs');
const { list, add } = group({ at: ['std', '', /thread\/functions\.rs$/] });
const JOIN = ['std', 'JoinHandle', /thread\/join_handle\.rs$/];
const MUTEX = ['std', 'Mutex', /sync\/poison\/mutex\.rs$/];
const MPSC = ['std', '', /sync\/mpsc\.rs$/];
const SENDER = ['std', 'Sender', /sync\/mpsc\.rs$/];
const RECV = ['std', 'Receiver', /sync\/mpsc\.rs$/];
const ARC = ['alloc', 'Arc', /^src\/sync\.rs$/];
const RC = ['alloc', 'Rc', /^src\/rc\.rs$/];
const WEAK = ['alloc', 'Weak', /^src\/rc\.rs$/];
const ONCE = ['core', 'OnceCell', /cell\/once\.rs$/];
const REFCELL = ['core', 'RefCell', /^src\/cell\.rs$/];
const DUR = ['core', 'Duration', /^src\/time\.rs$/];
const PATH = ['std', 'Path', /^src\/path\.rs$/];
const ORD = ['core', 'Ordering', /^src\/cmp\.rs$/];
const CHAR = ['core', 'char', /char\/methods\.rs$/];
const F64 = ['core', 'f64', /num\/f64\.rs$/];
const STD_F64 = ['std', 'f64', /num\/f64\.rs$/];

// ---------------------------------------------------------------- threads and channels

add('thread/spawn', 'spawn', null, 'How thread::spawn works', 'Runs a closure on a new thread, at the same time as the rest of the program.', {
  rows: [['main thread', 'new thread']], call: 'let h = thread::spawn(|| 2 + 2); h.join().unwrap()', note: 'two things at once', outs: ['continues right away', 'computes 4'],
  intro: 'spawn starts a new thread and returns a JoinHandle immediately; it does not wait.',
  steps: [
    ['The main thread keeps running.', 0, 'o0'],
    ['Meanwhile the new thread runs the closure and computes 2 + 2.', 1, 'o1'],
    ['join() waits for it to finish and returns its result.', [], null, 'join → Ok(4)'],
  ],
  result: '4', resultCap: 'The closure must own what it uses: write move || ... to move variables into the thread.',
}, 'let h = std::thread::spawn(|| 2 + 2); h.join().unwrap().to_string()');

add('thread/join', 'join', JOIN, 'How JoinHandle::join works', 'Waits for a thread to finish and returns what its closure returned.', {
  rows: [['thread 1 → 10', 'thread 2 → 20']], call: 'let total: i32 = handles.into_iter().map(|h| h.join().unwrap()).sum();', note: 'collect the results', outs: ['10 + 20 = 30'],
  intro: 'join blocks until the thread is done, then gives back Ok(value), or Err if the thread panicked.',
  steps: [
    ['Waiting for thread 1: it returns 10.', 0, null, 'Ok(10)'],
    ['Waiting for thread 2: 20.', 1, 'o0', 'Ok(20)'],
  ],
  result: '30', resultCap: 'If you never join, the program may exit before the thread finishes its work.',
}, 'let hs: Vec<_> = [10, 20].into_iter().map(|x| std::thread::spawn(move || x)).collect(); let total: i32 = hs.into_iter().map(|h| h.join().unwrap()).sum(); total.to_string()');

add('mutex/lock', 'lock', MUTEX, 'How Mutex::lock works', 'Gives one thread at a time access to the data inside.', {
  rows: [['thread A', 'thread B', 'thread C']], call: '*counter.lock().unwrap() += 1;   // counter: Arc<Mutex<i32>>', note: 'three threads, one counter', outs: ['1', '2', '3'],
  intro: 'lock() waits until no other thread holds the lock, then lends the data. The lock is released when the guard is dropped.',
  steps: [
    ['A locks, adds 1, and unlocks.', 0, 'o0'],
    ['B was waiting; now it locks and adds 1.', 1, 'o1'],
    ['C does the same. No update is lost.', 2, 'o2'],
  ],
  result: '3', resultCap: 'lock() returns a Result because a thread that panicked while holding the lock "poisons" it.',
}, 'let c = std::sync::Arc::new(std::sync::Mutex::new(0)); let hs: Vec<_> = (0..3).map(|_| { let c = std::sync::Arc::clone(&c); std::thread::spawn(move || { *c.lock().unwrap() += 1; }) }).collect(); for h in hs { h.join().unwrap(); } let n = *c.lock().unwrap(); n.to_string()');

add('mpsc/channel', 'channel', MPSC, 'How mpsc::channel works', 'Creates a channel: a Sender for one side and a Receiver for the other.', {
  rows: [['tx (Sender)', 'rx (Receiver)']], call: 'let (tx, rx) = mpsc::channel(); tx.send(5).unwrap(); rx.recv().unwrap()', note: 'a pipe between threads', outs: ['send(5)', 'recv() → 5'],
  intro: 'Values sent into tx come out of rx, in the same order.',
  steps: [['tx sends 5 into the channel.', 0, 'o0'], ['rx receives it.', 1, 'o1']],
  result: '5', resultCap: 'mpsc means many producers, one consumer: clone tx to send from several threads.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); tx.send(5).unwrap(); rx.recv().unwrap().to_string()');

add('mpsc/send', 'send', SENDER, 'How Sender::send works', 'Puts a value into the channel; it moves to the receiving side.', {
  rows: [['thread 1 sends "a"', 'thread 2 sends "b"']], call: 'tx.send(msg).unwrap();', note: 'ownership travels with the value', outs: ['"a"', '"b"'],
  intro: 'send never waits for the receiver (the channel has room for any number of values).',
  steps: [['"a" is sent and now belongs to the channel.', 0, 'o0'], ['"b" is sent from another thread through a cloned Sender.', 1, 'o1']],
  result: '["a", "b"]', resultCap: 'send returns Err if the Receiver no longer exists.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); let tx2 = tx.clone(); tx.send("a").unwrap(); std::thread::spawn(move || tx2.send("b").unwrap()).join().unwrap(); drop(tx); let mut v: Vec<&str> = rx.iter().collect(); v.sort(); d(v)');

add('mpsc/recv', 'recv', RECV, 'How Receiver::recv works', 'Waits for the next value; Err once every Sender is gone.', {
  rows: [nums([1, 2])], call: 'while let Ok(x) = rx.recv() { ... }', note: 'the loop ends by itself', outs: ['Ok(1)', 'Ok(2)', 'Err (no senders)'],
  intro: 'recv blocks until a value arrives.',
  steps: [['1 arrives.', 0, 'o0'], ['2 arrives.', 1, 'o1'], ['All Senders were dropped and the channel is empty: Err, and the loop ends.', [], 'o2']],
  result: '1, 2', resultCap: 'for x in rx { ... } does the same thing. try_recv() never waits.',
}, 'let (tx, rx) = std::sync::mpsc::channel(); tx.send(1).unwrap(); tx.send(2).unwrap(); drop(tx); let mut v = vec![]; while let Ok(x) = rx.recv() { v.push(x); } j(v)');

add('arc/clone', 'clone', ARC, 'How Arc::clone works', 'Shares ownership across threads by counting references atomically.', {
  rows: [['Arc [1, 2, 3]']], call: 'let a = Arc::new(vec![1, 2, 3]); let b = Arc::clone(&a);', note: 'Rc for threads', outs: ['a', 'b (in another thread)', 'count 2'],
  intro: 'Arc is like Rc, but its counter is updated atomically, so clones can move to other threads.',
  steps: [['a owns the Vec: count 1.', 0, 'o0'], ['Arc::clone makes b, which can be moved into a thread: count 2.', 0, 'o1,2']],
  result: '2', resultCap: 'Arc gives shared read access. To change the data too, wrap it: Arc<Mutex<T>>.',
}, 'let a = std::sync::Arc::new(vec![1, 2, 3]); let b = std::sync::Arc::clone(&a); let n = std::sync::Arc::strong_count(&a); drop(b); n.to_string()');

add('rc/downgrade', 'downgrade', RC, 'How Rc::downgrade works', 'Makes a Weak pointer that does not keep the value alive.', {
  rows: [['Rc "tree"']], call: 'let w = Rc::downgrade(&strong);', note: 'strong 1, weak 1', outs: ['strong_count 1', 'weak_count 1'],
  intro: 'A Weak points at the value but does not count as an owner.',
  steps: [['The strong count stays 1.', 0, 'o0'], ['The weak count becomes 1.', 0, 'o1']],
  result: 'strong = 1, weak = 1', resultCap: 'Used for back-pointers, like a child pointing to its parent, to avoid reference cycles that would never be freed.',
}, 'let s = Rc::new("tree"); let _w = Rc::downgrade(&s); format!("strong = {}, weak = {}", Rc::strong_count(&s), Rc::weak_count(&s))');

add('weak/upgrade', 'upgrade', WEAK, 'How Weak::upgrade works', 'Turns a Weak back into an Rc, if the value still exists.', {
  rows: [['owner alive', 'owner dropped']], call: 'w.upgrade()', note: 'Some while alive, None after', outs: ['Some(5)', 'None'],
  intro: 'upgrade checks the strong count: if it is above zero, you get a new Rc.',
  steps: [['While an Rc owner exists: Some(Rc(5)).', 0, 'o0'], ['After the last owner is dropped, the value is gone: None.', 1, 'o1']],
  result: 'Some(5), None', resultCap: 'Always handle None: a Weak can outlive the value.',
}, 'let s = Rc::new(5); let w = Rc::downgrade(&s); let a = w.upgrade().map(|r| *r); drop(s); let b = w.upgrade().map(|r| *r); format!("{:?}, {:?}", a, b)');

add('rc/make_mut', 'make_mut', RC, 'How Rc::make_mut works', 'Gives &mut to the value, cloning it first if others share it (clone-on-write).', {
  rows: [['a, b share [1]']], call: 'Rc::make_mut(&mut a).push(2);', note: 'a changes, b does not', outs: ['a = [1, 2]', 'b = [1]'],
  intro: 'If a is the only owner, make_mut changes the value in place. Here b shares it, so a gets its own copy first.',
  steps: [['b also points at [1], so the Vec is cloned for a.', 0, null, 'clone on write'], ['a\'s copy gets 2; b still sees [1].', 0, 'o0,1']],
  result: 'a = [1, 2], b = [1]', resultCap: 'Cheap sharing until someone writes: a common trick for persistent data.',
}, 'let mut a = Rc::new(vec![1]); let b = Rc::clone(&a); Rc::make_mut(&mut a).push(2); format!("a = {:?}, b = {:?}", a, b)');

add('oncecell/get_or_init', 'get_or_init', ONCE, 'How OnceCell::get_or_init works', 'Computes a value the first time it is asked for, and reuses it afterwards.', {
  rows: [['1st call', '2nd call']], call: 'cell.get_or_init(|| expensive())', note: 'initialised once', outs: ['runs expensive() → 42', 'returns the stored 42'],
  intro: 'A OnceCell starts empty and can be filled exactly once.',
  steps: [['First call: the cell is empty, so the closure runs and 42 is stored.', 0, 'o0'], ['Second call: the closure is not run again.', 1, 'o1']],
  result: '42 (closure ran 1 time)', resultCap: 'std::sync::OnceLock is the thread-safe version, handy for global settings.',
}, 'let cell = std::cell::OnceCell::new(); let mut runs = 0; let _a = *cell.get_or_init(|| { runs += 1; 42 }); let b = *cell.get_or_init(|| { runs += 1; 0 }); format!("{} (closure ran {} time)", b, runs)');

add('refcell/replace', 'replace', REFCELL, 'How RefCell::replace works', 'Swaps in a new value and returns the old one.', {
  rows: [['RefCell "draft"']], call: 'let old = c.replace(String::from("final"));', note: 'no borrow left open', outs: ['old = "draft"', 'c = "final"'],
  intro: 'replace borrows mutably just long enough to swap.',
  steps: [['The old value comes out.', 0, 'o0'], ['The new one goes in.', 0, 'o1']],
  result: 'old = "draft", now = "final"', resultCap: 'take() does the same with the default value.',
}, 'let c = RefCell::new(String::from("draft")); let old = c.replace(String::from("final")); format!("old = {:?}, now = {:?}", old, c.borrow())');

// ---------------------------------------------------------------- time and paths

add('duration/from_secs', 'from_secs', DUR, 'How Duration::from_secs works', 'A span of time from a number of seconds.', {
  rows: [['90']], call: 'Duration::from_secs(90)', note: 'whole seconds', outs: ['90s'],
  intro: 'Duration stores seconds plus nanoseconds, so it can hold anything from 1 ns to centuries.',
  steps: [['90 seconds are stored.', 0], ['It prints as 90s; as_secs_f64() would give 90.0.', [], 'o0']],
  result: '90s', resultCap: 'from_millis, from_micros and from_secs_f64 make other units. thread::sleep takes a Duration.',
}, 'd(std::time::Duration::from_secs(90))');

add('duration/as_millis', 'as_millis', DUR, 'How Duration::as_millis works', 'The whole duration in milliseconds.', {
  rows: [['1.5 s']], call: 'Duration::from_secs_f64(1.5).as_millis()', note: 'convert units', outs: ['1500'],
  intro: 'as_millis counts the total milliseconds as a u128.',
  steps: [['1 second = 1000 ms; 0.5 s = 500 ms.', 0], ['Total: 1500.', [], 'o0']],
  result: '1500', resultCap: 'as_secs() gives whole seconds only (1); subsec_millis() gives the leftover part (500).',
}, 'std::time::Duration::from_secs_f64(1.5).as_millis().to_string()');

add('duration/checked_sub', 'checked_sub', DUR, 'How Duration::checked_sub works', 'Subtracts; None instead of a panic when the result would be negative.', {
  rows: [['5s - 2s', '2s - 5s']], call: 'a.checked_sub(b)', note: 'durations cannot be negative', outs: ['Some(3s)', 'None'],
  intro: 'A Duration is never negative, so subtracting too much has no answer.',
  steps: [['5 s - 2 s = 3 s.', 0, 'o0'], ['2 s - 5 s would be negative: None.', 1, 'o1']],
  result: 'Some(3s), None', resultCap: 'saturating_sub gives zero instead of None.',
}, 'let f = std::time::Duration::from_secs; format!("{:?}, {:?}", f(5).checked_sub(f(2)), f(2).checked_sub(f(5)))');

add('path/extension', 'extension', PATH, 'How Path::extension works', 'The part of the file name after the last dot.', {
  rows: [['"docs/report.tar.gz"']], call: 'Path::new("docs/report.tar.gz").extension()', note: 'only the last part', outs: ['Some("gz")'],
  intro: 'extension looks at the file name and takes what follows the last dot.',
  steps: [['The file name is "report.tar.gz".', 0], ['After the last dot: "gz".', [], 'o0']],
  result: 'Some("gz")', resultCap: 'The result is an &OsStr; compare with ext == "gz". A name without a dot gives None.',
}, 'd(std::path::Path::new("docs/report.tar.gz").extension())');

add('path/file_name', 'file_name', PATH, 'How Path::file_name works', 'The last part of the path.', {
  rows: [['"projects/app/main.rs"']], call: 'Path::new("projects/app/main.rs").file_name()', note: 'after the last separator', outs: ['Some("main.rs")'],
  intro: 'file_name gives the final component.',
  steps: [['The path has three parts: projects, app, main.rs.', 0], ['The last one: "main.rs".', [], 'o0']],
  result: 'Some("main.rs")', resultCap: 'file_stem() drops the extension too: "main".',
}, 'd(std::path::Path::new("projects/app/main.rs").file_name())');

add('path/file_stem', 'file_stem', PATH, 'How Path::file_stem works', 'The file name without its extension.', {
  rows: [['"img/photo.png"']], call: 'Path::new("img/photo.png").file_stem()', note: 'name without .png', outs: ['Some("photo")'],
  intro: 'file_stem removes the last extension from the file name.',
  steps: [['The file name is "photo.png".', 0], ['Without ".png": "photo".', [], 'o0']],
  result: 'Some("photo")', resultCap: 'Handy for building a new name: format!("{}.jpg", stem.to_string_lossy()).',
}, 'd(std::path::Path::new("img/photo.png").file_stem())');

add('path/parent', 'parent', PATH, 'How Path::parent works', 'The path without its last part.', {
  rows: [['"a/b/c.txt"']], call: 'Path::new("a/b/c.txt").parent()', note: 'the containing folder', outs: ['Some("a/b")'],
  intro: 'parent drops the final component.',
  steps: [['The last part is c.txt.', 0], ['What remains is "a/b".', [], 'o0']],
  result: 'Some("a/b")', resultCap: 'Calling parent again gives "a", then "", then None.',
}, 'd(std::path::Path::new("a/b/c.txt").parent())');

add('path/with_extension', 'with_extension', PATH, 'How Path::with_extension works', 'A new PathBuf with the extension replaced.', {
  rows: [['"notes/todo.txt"']], call: 'Path::new("notes/todo.txt").with_extension("md")', note: '.txt → .md', outs: ['"notes/todo.md"'],
  intro: 'with_extension keeps the folder and the stem, and swaps the extension.',
  steps: [['"todo" keeps its folder.', 0], ['".txt" becomes ".md".', [], 'o0']],
  result: '"notes/todo.md"', resultCap: 'with_file_name replaces the whole file name instead.',
}, 'd(std::path::Path::new("notes/todo.txt").with_extension("md"))');

// ---------------------------------------------------------------- comparisons

add('ordering/reverse', 'reverse', ORD, 'How Ordering::reverse works', 'Flips Less and Greater, for sorting in reverse.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'v.sort_by(|a, b| a.cmp(b).reverse())', note: 'largest first', outs: ['Greater', 'Equal', 'Less'],
  intro: 'reverse turns "a comes first" into "b comes first".',
  steps: [['Less becomes Greater.', 0, 'o0'], ['Equal stays Equal.', 1, 'o1'], ['Greater becomes Less.', 2, 'o2']],
  result: '[3, 2, 1]', resultCap: 'Same as b.cmp(a). For keys: sort_by_key(|x| std::cmp::Reverse(*x)).',
}, 'let mut v = vec![1, 3, 2]; v.sort_by(|a, b| a.cmp(b).reverse()); d(v)');

add('ordering/then', 'then', ORD, 'How Ordering::then works', 'Uses a second comparison when the first one is Equal.', {
  rows: [['("bo", 30)', '("al", 30)', '("cy", 25)']], call: 'v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)))', note: 'by age (oldest first), then by name', outs: [null, null, null],
  intro: 'then only matters for ties: equal ages are ordered by name.',
  steps: [['al and bo are both 30: tied, so names decide: al before bo.', [1, 0], { move: { a1: 0, a0: 1 } }, 'tie → by name'], ['cy is 25: last.', 2, 'm2']],
  result: '[("al", 30), ("bo", 30), ("cy", 25)]', resultCap: 'then_with takes a closure, so the second comparison only runs on ties.',
}, 'let mut v = vec![("bo", 30), ("al", 30), ("cy", 25)]; v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0))); d(v)');

// ---------------------------------------------------------------- char and f64

add('char/to_uppercase', 'to_uppercase', CHAR, 'How char::to_uppercase works', 'An iterator of the upper-case form, which can be more than one char.', {
  rows: [["'a'", "'ß'"]], call: "'ß'.to_uppercase().collect::<String>()", note: 'Unicode rules', outs: ['"A"', '"SS"'],
  intro: 'to_uppercase returns an iterator because some letters become several.',
  steps: [["'a' becomes \"A\".", 0, 'o0'], ["'ß' becomes \"SS\", two characters.", 1, 'o1']],
  result: '"A", "SS"', resultCap: 'to_ascii_uppercase always returns exactly one char, but only changes a–z.',
}, 'format!("{:?}, {:?}", \'a\'.to_uppercase().collect::<String>(), \'ß\'.to_uppercase().collect::<String>())');

add('char/is_uppercase', 'is_uppercase', CHAR, 'How char::is_uppercase works', 'true for upper-case letters.', {
  rows: [["'A'", "'a'", "'1'"]], call: "c.is_uppercase()", note: 'digits are neither', outs: ['true', 'false', 'false'],
  intro: 'Only letters have a case.',
  steps: [["'A': true.", 0, 'o0'], ["'a': false (it is lower case).", 1, 'o1'], ["'1': false (no case).", 2, 'o2']],
  result: 'true, false, false', resultCap: 'is_lowercase is the counterpart.',
}, "format!(\"{}, {}, {}\", 'A'.is_uppercase(), 'a'.is_uppercase(), '1'.is_uppercase())");

add('char/from_u32', 'from_u32', CHAR, 'How char::from_u32 works', 'The char with a given Unicode number, if it is a valid character.', {
  rows: [['65', '0x1F980', '0xD800']], call: 'char::from_u32(65)', note: 'code point → char', outs: ["Some('A')", "Some('🦀')", 'None'],
  intro: 'Every char has a number (its code point). Not every number is a char.',
  steps: [["65 is 'A'.", 0, 'o0'], ['0x1F980 is the crab emoji.', 1, 'o1'], ['0xD800 is reserved (a surrogate): None.', 2, 'o2']],
  result: "Some('A'), Some('🦀'), None", resultCap: "The other way: 'A' as u32 is 65.",
}, 'format!("{:?}, {:?}, {:?}", char::from_u32(65), char::from_u32(0x1F980), char::from_u32(0xD800))');

add('f64/signum', 'signum', F64, 'How f64::signum works', '1.0 for positive numbers, -1.0 for negative ones.', {
  rows: [['3.5', '-0.2', '0.0']], call: 'x.signum()', note: 'just the sign', outs: ['1', '-1', '1'],
  intro: 'signum keeps only the sign of the number.',
  steps: [['3.5 → 1.', 0, 'o0'], ['-0.2 → -1.', 1, 'o1'], ['0.0 counts as positive: 1. (-0.0 gives -1.)', 2, 'o2']],
  result: '1, -1, 1', resultCap: 'Useful for directions: velocity.signum() is +1 or -1.',
}, 'format!("{}, {}, {}", 3.5_f64.signum(), (-0.2_f64).signum(), 0.0_f64.signum())');

add('f64/hypot', 'hypot', STD_F64, 'How f64::hypot works', 'The length of the long side of a right triangle: √(x² + y²).', {
  rows: [['3', '4']], call: '3.0_f64.hypot(4.0)', note: 'Pythagoras', outs: ['5'],
  intro: 'hypot computes √(3² + 4²) without overflowing for large values.',
  steps: [['3² + 4² = 9 + 16 = 25.', [0, 1]], ['√25 = 5.', [], 'o0']],
  result: '5', resultCap: 'The distance between two points: (x2 - x1).hypot(y2 - y1).',
}, '3.0_f64.hypot(4.0).to_string()');

add('f64/rem_euclid', 'rem_euclid', STD_F64, 'How f64::rem_euclid works', 'A remainder that is never negative.', {
  rows: [['-1.0 % 360.0', '-1.0 rem_euclid 360.0']], call: '(-1.0_f64).rem_euclid(360.0)', note: 'wrapping an angle', outs: ['-1', '359'],
  intro: '% keeps the sign of the left side; rem_euclid always lands in 0..360.',
  steps: [['-1.0 % 360.0 is -1.', 0, 'o0'], ['rem_euclid gives 359: a proper angle.', 1, 'o1']],
  result: '-1, 359', resultCap: 'Integers have rem_euclid too: (-7_i32).rem_euclid(3) is 2.',
}, 'format!("{}, {}", -1.0_f64 % 360.0, (-1.0_f64).rem_euclid(360.0))');

add('f64/is_nan', 'is_nan', F64, 'How f64::is_nan works', 'true for NaN, the "not a number" value.', {
  rows: [['0.0 / 0.0', '1.0 / 0.0']], call: 'x.is_nan()', note: 'NaN is not even equal to itself', outs: ['true', 'false'],
  intro: '0.0 / 0.0 has no answer, so it gives NaN. 1.0 / 0.0 gives infinity, which is not NaN.',
  steps: [['0.0 / 0.0 is NaN: true.', 0, 'o0'], ['1.0 / 0.0 is infinity: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'x == f64::NAN is always false, so you must use is_nan().',
}, 'let z = 0.0_f64; format!("{}, {}", (z / z).is_nan(), (1.0 / z).is_nan())');

add('f64/total_cmp', 'total_cmp', F64, 'How f64::total_cmp works', 'A full ordering of floats, so they can be sorted.', {
  rows: [['2.5', '-1.0', '0.5']], call: 'v.sort_by(|a, b| a.total_cmp(b));', note: 'floats have no sort()', outs: [null, null, null],
  intro: 'Vec<f64> has no sort() because of NaN. total_cmp defines an order for every float.',
  steps: [['-1.0 first.', 1, 'm0'], ['Then 0.5 and 2.5.', [2, 0], { move: { a2: 1, a0: 2 } }]],
  result: '[-1.0, 0.5, 2.5]', resultCap: 'NaN values end up at the edges instead of breaking the sort.',
}, 'let mut v = vec![2.5_f64, -1.0, 0.5]; v.sort_by(|a, b| a.total_cmp(b)); d(v)');

add('f64/to_radians', 'to_radians', F64, 'How f64::to_radians works', 'Converts degrees to radians, which sin and cos expect.', {
  rows: [['180°']], call: '180.0_f64.to_radians()', note: 'π radians = 180°', outs: ['3.141592653589793'],
  intro: 'Trigonometry in Rust works in radians: a full turn is 2π, not 360.',
  steps: [['180° is half a turn.', 0], ['That is π radians.', [], 'o0']],
  result: '3.141592653589793', resultCap: 'to_degrees goes back. x.to_radians().sin() is the sine of x degrees.',
}, '180.0_f64.to_radians().to_string()');

add('f64/exp', 'exp', STD_F64, 'How f64::exp works', 'e raised to the power x.', {
  rows: [['0', '1']], call: 'x.exp()', note: 'e ≈ 2.718', outs: ['1', '2.718281828459045'],
  intro: 'exp is the exponential function, used for growth and decay.',
  steps: [['e⁰ = 1.', 0, 'o0'], ['e¹ = e = 2.718281828459045.', 1, 'o1']],
  result: '1, 2.718281828459045', resultCap: 'ln is its inverse: x.exp().ln() == x (up to rounding).',
}, 'format!("{}, {}", 0.0_f64.exp(), 1.0_f64.exp())');

add('f64/ln', 'ln', STD_F64, 'How f64::ln works', 'The natural logarithm (base e).', {
  rows: [['1', '7.389056']], call: 'x.ln()', note: 'the inverse of exp', outs: ['0', '≈ 2'],
  intro: 'ln answers: e to which power gives x?',
  steps: [['ln(1) = 0, since e⁰ = 1.', 0, 'o0'], ['ln(e²) is 2.', 1, 'o1']],
  result: '0, 2', resultCap: 'log10 and log2 use other bases; ln of 0 is -infinity, of a negative number NaN.',
}, 'format!("{}, {}", 1.0_f64.ln(), (2.0_f64.exp().ln() * 1e9).round() / 1e9)');

module.exports = list;
