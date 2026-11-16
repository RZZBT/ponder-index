// Rust standard library: Default/Clone/From/Extend/FromIterator implementations not covered yet, hint helpers,
// raw-pointer accessors of Vec/slice/str, raw and uninitialised Rc/Arc constructors, and iter::chain.
const { group } = require('./kit.cjs');
const HM = ['std', 'HashMap', /collections\/hash\/map\.rs$/];
const HS = ['std', 'HashSet', /collections\/hash\/set\.rs$/];
const BM = ['alloc', 'BTreeMap', /btree\/map\.rs$/];
const BS = ['alloc', 'BTreeSet', /btree\/set\.rs$/];
const DQ = ['alloc', 'VecDeque', /vec_deque\/mod\.rs$/];
const LL = ['alloc', 'LinkedList', /linked_list\.rs$/];
const BOX = ['alloc', 'Box', /^src\/boxed\.rs$/];
const RC = ['alloc', 'Rc', /^src\/rc\.rs$/];
const ARC = ['alloc', 'Arc', /^src\/sync\.rs$/];
const OS = ['std', 'OsString', /ffi\/os_str\.rs$/];
const COW = ['alloc', 'Cow', /^src\/string\.rs$/];
const HINT = ['core', '', /^src\/hint\.rs$/];
const { list, add } = group({ at: HM });
const A = 'std::sync::Arc';
const DEF = (ty, show) => `let x: ${ty} = Default::default(); ${show}`;

// ---------------------------------------------------------------- Default

add('hashmap/default', 'default', null, 'How HashMap::default works', 'An empty HashMap, used wherever a default value is needed.', {
  rows: [['#[derive(Default)] struct Cache { map: HashMap<..> }']], call: 'Cache::default()', note: 'Default for HashMap', outs: ['empty map'],
  intro: 'derive(Default) and unwrap_or_default use it.',
  steps: [['A default is requested.', 0], ['An empty map.', [], 'o0']],
  result: '{}', resultCap: 'Same as HashMap::new().',
}, DEF('HashMap<String, i32>', 'sorted_map(&x)'));

add('hashset/default', 'default', HS, 'How HashSet::default works', 'An empty HashSet, used wherever a default value is needed.', {
  rows: [['Default::default()']], call: 'let s: HashSet<u32> = Default::default();', note: 'Default for HashSet', outs: ['{}'],
  intro: 'Fields of type HashSet get this from derive(Default).',
  steps: [['Request a default.', 0], ['Empty set.', [], 'o0']],
  result: '{}', resultCap: 'Same as HashSet::new().',
}, DEF('HashSet<u32>', 'sorted_set(&x)'));

add('btreemap/default', 'default', BM, 'How BTreeMap::default works', 'An empty BTreeMap.', {
  rows: [['Default::default()']], call: 'let m: BTreeMap<String, u8> = Default::default();', note: 'Default for BTreeMap', outs: ['{}'],
  intro: 'Used by derive(Default) and mem::take.',
  steps: [['Request a default.', 0], ['Empty map.', [], 'o0']],
  result: '{}', resultCap: 'Same as BTreeMap::new().',
}, DEF('BTreeMap<String, u8>', 'd(x)'));

add('btreeset/default', 'default', BS, 'How BTreeSet::default works', 'An empty BTreeSet.', {
  rows: [['Default::default()']], call: 'let s: BTreeSet<i32> = Default::default();', note: 'Default for BTreeSet', outs: ['{}'],
  intro: 'Used by derive(Default).',
  steps: [['Request a default.', 0], ['Empty set.', [], 'o0']],
  result: '{}', resultCap: 'Same as BTreeSet::new().',
}, DEF('BTreeSet<i32>', 'd(x)'));

add('vecdeque/default', 'default', DQ, 'How VecDeque::default works', 'An empty VecDeque.', {
  rows: [['Default::default()']], call: 'let q: VecDeque<u8> = Default::default();', note: 'Default for VecDeque', outs: ['[]'],
  intro: 'Used by derive(Default) and mem::take.',
  steps: [['Request a default.', 0], ['Empty queue.', [], 'o0']],
  result: '[]', resultCap: 'Same as VecDeque::new().',
}, DEF('VecDeque<u8>', 'd(x)'));

add('linkedlist/default', 'default', LL, 'How LinkedList::default works', 'An empty LinkedList.', {
  rows: [['Default::default()']], call: 'let l: LinkedList<u8> = Default::default();', note: 'Default for LinkedList', outs: ['[]'],
  intro: 'Used by derive(Default).',
  steps: [['Request a default.', 0], ['Empty list.', [], 'o0']],
  result: '[]', resultCap: 'Same as LinkedList::new().',
}, DEF('std::collections::LinkedList<u8>', 'd(x)'));

add('box/default', 'default', BOX, 'How Box::default works', 'A Box holding the inner type\'s default value.', {
  rows: [['Box<i32>', 'Box<str>']], call: 'let b: Box<i32> = Default::default();', note: 'Default for Box', outs: ['Box(0)', 'Box("")'],
  intro: 'For Box<T>, the inner T is defaulted.',
  steps: [['Box<i32>: 0.', 0, 'o0'], ['Box<str>: "".', 1, 'o1']],
  result: '0, ""', resultCap: 'Box<[T]> defaults to an empty slice.',
}, 'let a: Box<i32> = Default::default(); let b: Box<str> = Default::default(); format!("{}, {:?}", a, b)');

add('option/default', 'default', ['core', 'Option', /^src\/option\.rs$/], 'How Option::default works', 'Always None.', {
  rows: [['Option<String>']], call: 'let o: Option<String> = Default::default();', note: 'Default for Option', outs: ['None'],
  intro: 'No requirement on the inner type.',
  steps: [['Request a default.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Optional struct fields default to None with derive(Default).',
}, DEF('Option<String>', 'd(x)'));

add('rc/default', 'default', RC, 'How Rc::default works', 'A new Rc holding the inner type\'s default value.', {
  rows: [['Rc<Vec<i32>>']], call: 'let r: Rc<Vec<i32>> = Default::default();', note: 'Default for Rc', outs: ['Rc([])'],
  intro: 'Allocates an Rc around T::default().',
  steps: [['Default for the inner type.', 0], ['Wrapped in an Rc.', [], 'o0']],
  result: '[]', resultCap: 'Arc::default does the same across threads.',
}, DEF('Rc<Vec<i32>>', 'd(x)'));

add('arc/default', 'default', ARC, 'How Arc::default works', 'A new Arc holding the inner type\'s default value.', {
  rows: [['Arc<String>']], call: 'let a: Arc<String> = Default::default();', note: 'Default for Arc', outs: ['Arc("")'],
  intro: 'Handy for shared configuration that starts empty.',
  steps: [['Default for the inner type.', 0], ['Wrapped in an Arc.', [], 'o0']],
  result: '""', resultCap: 'Clones then share it.',
}, DEF(`${A}<String>`, 'd(x)'));

// ---------------------------------------------------------------- Clone

add('box/clone', 'clone', BOX, 'How Box::clone works', 'A new Box with a clone of the value inside.', {
  rows: [['Box(vec![1])']], call: 'let b2 = b.clone();', note: 'deep copy', outs: ['independent box'],
  intro: 'Both boxes own separate values.',
  steps: [['Clone the inner Vec into a new box.', 0], ['Changing one leaves the other.', [], 'o0']],
  result: '[1], [1, 2]', resultCap: 'Use Rc instead if you want to share, not copy.',
}, 'let a = Box::new(vec![1]); let mut b = a.clone(); b.push(2); format!("{:?}, {:?}", a, b)');

add('hashmap/clone', 'clone', HM, 'How HashMap::clone works', 'A copy of the map with clones of every key and value.', {
  rows: [['{"a": 1}']], call: 'let mut m2 = m.clone();', note: 'independent copy', outs: ['changes do not affect m'],
  intro: 'The clone has its own storage.',
  steps: [['Copy all entries.', 0], ['Insert into the copy only.', [], 'o0']],
  result: '{"a": 1}, {"a": 1, "b": 2}', resultCap: 'Cloning a big map costs time and memory.',
}, 'let m = HashMap::from([("a", 1)]); let mut m2 = m.clone(); m2.insert("b", 2); format!("{}, {}", sorted_map(&m), sorted_map(&m2))');

add('vecdeque/clone', 'clone', DQ, 'How VecDeque::clone works', 'A copy of the deque with clones of every element.', {
  rows: [['[1, 2]']], call: 'let q2 = q.clone();', note: 'independent copy', outs: ['[1, 2]'],
  intro: 'The copy is laid out contiguously.',
  steps: [['Copy each element.', 0], ['Change the copy only.', [], 'o0']],
  result: '[1, 2], [0, 1, 2]', resultCap: 'clone_from can reuse an existing buffer.',
}, 'let q = VecDeque::from([1, 2]); let mut q2 = q.clone(); q2.push_front(0); format!("{:?}, {:?}", q, q2)');

add('btreemap/clone', 'clone', BM, 'How BTreeMap::clone works', 'A copy of the sorted map with clones of every entry.', {
  rows: [['{1: "a"}']], call: 'let m2 = m.clone();', note: 'independent copy', outs: ['{1: "a"}'],
  intro: 'The tree is copied node by node.',
  steps: [['Copy every entry.', 0], ['Change the copy only.', [], 'o0']],
  result: '{1: "a"}, {1: "a", 2: "b"}', resultCap: 'Keys stay sorted in both.',
}, 'let m = BTreeMap::from([(1, "a")]); let mut m2 = m.clone(); m2.insert(2, "b"); format!("{:?}, {:?}", m, m2)');

// ---------------------------------------------------------------- From, Extend, FromIterator

add('linkedlist/extend', 'extend', LL, 'How LinkedList::extend works', 'Appends every item of an iterator to the end.', {
  rows: [['[1]'], ['2', '3']], call: 'l.extend([2, 3])', note: 'push_back in a loop', outs: ['[1, 2, 3]'],
  intro: 'One node per new item.',
  steps: [['The list holds 1.', 'a0'], ['2 and 3 are appended.', ['b0', 'b1'], 'o0']],
  result: '[1, 2, 3]', resultCap: 'append() moves a whole list in O(1).',
}, 'let mut l = std::collections::LinkedList::from([1]); l.extend([2, 3]); d(l)');

add('osstring/from', 'from', OS, 'How OsString::from works', 'An owned platform string from a String or &str.', {
  rows: [['"config.toml"']], call: 'OsString::from("config.toml")', note: 'str → OsString', outs: ['OsString "config.toml"'],
  intro: 'Every Rust string is valid as an OsString.',
  steps: [['The text is copied.', 0], ['An OsString.', [], 'o0']],
  result: '"config.toml"', resultCap: 'From<String> reuses the buffer.',
}, 'd(std::ffi::OsString::from("config.toml"))');

add('osstring/extend', 'extend', OS, 'How OsString::extend works', 'Appends several string pieces.', {
  rows: [['"a"'], ['"b"', '"c"']], call: 's.extend(["b", "c"].map(OsString::from))', note: 'push in a loop', outs: ['"abc"'],
  intro: 'Each piece is pushed onto the end.',
  steps: [['Start with "a".', 'a0'], ['Append "b" and "c".', ['b0', 'b1'], 'o0']],
  result: '"abc"', resultCap: 'Accepts OsString, &OsStr and Cow<OsStr> items.',
}, 'let mut s = std::ffi::OsString::from("a"); s.extend(["b", "c"].map(std::ffi::OsString::from)); d(s)');

add('osstring/from_iter', 'from_iter', OS, 'How OsString::from_iter works', 'Joins an iterator of platform strings into one OsString.', {
  rows: [['"x"', '"y"']], call: 'parts.collect::<OsString>()', note: 'concatenate', outs: ['"xy"'],
  intro: 'No separator is inserted.',
  steps: [['Two pieces.', [0, 1]], ['Joined.', [], 'o0']],
  result: '"xy"', resultCap: 'Use PathBuf for path components instead.',
}, 'let s: std::ffi::OsString = std::ffi::OsString::from_iter([std::ffi::OsString::from("x"), std::ffi::OsString::from("y")]); d(s)');

add('cow/from', 'from', COW, 'How Cow<str>::from works', 'Wraps a &str (borrowed) or a String (owned) in a Cow.', {
  rows: [['"lit"', 'String "own"']], call: 'Cow::from("lit")', note: 'borrowed or owned', outs: ['Borrowed', 'Owned'],
  intro: 'Functions can return either kind through one type.',
  steps: [['&str → Borrowed.', 0, 'o0'], ['String → Owned.', 1, 'o1']],
  result: 'Borrowed, Owned', resultCap: 'Lets you avoid allocating when nothing needs changing.',
}, 'let a: std::borrow::Cow<str> = std::borrow::Cow::from("lit"); let b: std::borrow::Cow<str> = std::borrow::Cow::from(String::from("own")); format!("{}, {}", if matches!(a, std::borrow::Cow::Borrowed(_)) { "Borrowed" } else { "Owned" }, if matches!(b, std::borrow::Cow::Owned(_)) { "Owned" } else { "Borrowed" })');

add('cow/from_iter', 'from_iter', COW, 'How collect into Cow<str> works', 'Collects chars or strings into an owned Cow<str>.', {
  rows: [["'h'", "'i'"]], call: 'chars.collect::<Cow<str>>()', note: 'always Owned', outs: ['"hi"'],
  intro: 'Collecting always builds a new String inside.',
  steps: [['Gather the chars.', [0, 1]], ['Owned("hi").', [], 'o0']],
  result: '"hi"', resultCap: 'Useful when the target type is fixed as Cow<str>.',
}, 'let c: std::borrow::Cow<str> = std::borrow::Cow::from_iter("hi".chars()); d(c)');

add('cell/from', 'from', ['core', 'Cell', /^src\/cell\.rs$/], 'How Cell::from works', 'Wraps a value in a Cell.', {
  rows: [['3']], call: 'let c: Cell<i32> = Cell::from(3);', note: 'same as Cell::new', outs: ['Cell(3)'],
  intro: 'Lets generic code use .into().',
  steps: [['Wrap 3.', 0], ['Cell(3).', [], 'o0']],
  result: '3', resultCap: 'RefCell::from works the same way.',
}, 'let c: Cell<i32> = Cell::from(3); c.get().to_string()');

add('refcell/from', 'from', ['core', 'RefCell', /^src\/cell\.rs$/], 'How RefCell::from works', 'Wraps a value in a RefCell.', {
  rows: [['vec![1]']], call: 'let c: RefCell<Vec<i32>> = vec![1].into();', note: 'same as RefCell::new', outs: ['RefCell([1])'],
  intro: 'Handy with .into() in generic code.',
  steps: [['Wrap the Vec.', 0], ['RefCell([1]).', [], 'o0']],
  result: '[1]', resultCap: 'Then borrow() / borrow_mut() as usual.',
}, 'let c: RefCell<Vec<i32>> = vec![1].into(); d(c.into_inner())');

add('arc/from_iter', 'from_iter', ARC, 'How collect into Arc<[T]> works', 'Collects an iterator straight into a shared Arc<[T]>.', {
  rows: [['1..=3']], call: '(1..=3).collect::<Arc<[i32]>>()', note: 'shared slice', outs: ['[1, 2, 3]'],
  intro: 'A cheap-to-clone, thread-safe list.',
  steps: [['Gather the items.', 0], ['One Arc allocation.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Rc<[T]> is the single-thread version.',
}, `let a: ${A}<[i32]> = ${A}::from_iter(1..=3); d(a)`);

add('u64/from_char', 'from', ['core', 'u64', /char\/convert\.rs$/], 'How u64::from(char) works', 'The Unicode number of a character, as a u64.', {
  rows: [["'€'"]], call: "u64::from('€')", note: 'char → number', outs: ['8364'],
  intro: '€ is U+20AC.',
  steps: [['Its code point.', 0], ['8364.', [], 'o0']],
  result: '8364', resultCap: 'u32::from(c) is the usual size.',
}, 'u64::from(\'€\').to_string()');

add('slice/into_vec', 'into_vec', ['alloc', '', /^src\/slice\.rs$/], 'How Box<[T]>::into_vec works', 'Turns a boxed slice into a Vec without copying.', {
  rows: [['Box<[i32]> [1, 2]']], call: 'boxed.into_vec()', note: 'growable again', outs: ['Vec [1, 2]'],
  intro: 'The buffer is reused.',
  steps: [['The box is handed over.', 0], ['Now a Vec that can grow.', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Vec::into_boxed_slice goes back.',
}, 'let b: Box<[i32]> = Box::new([1, 2]); let mut v = b.into_vec(); v.push(3); d(v)');

add('slice/to_ascii_lowercase', 'to_ascii_lowercase', ['alloc', '', /^src\/slice\.rs$/], 'How [u8]::to_ascii_lowercase works', 'A new Vec<u8> with ASCII letters made small.', {
  rows: [['b"HeLLo"']], call: 'bytes.to_ascii_lowercase()', note: 'returns a copy', outs: ['b"hello"'],
  intro: 'The original bytes are unchanged.',
  steps: [['Each A–Z becomes a–z.', 0], ['A new Vec.', [], 'o0']],
  result: '"hello"', resultCap: 'make_ascii_lowercase works in place.',
}, 'd(String::from_utf8(b"HeLLo".to_ascii_lowercase()).unwrap())');

// ---------------------------------------------------------------- hint

add('hint/spin_loop', 'spin_loop', HINT, 'How hint::spin_loop works', 'Tells the CPU you are busy-waiting, so it can save power.', {
  rows: [['wait for a flag']], call: 'while !ready.load(Acquire) { std::hint::spin_loop(); }', note: 'a polite spin', outs: ['loop exits when ready'],
  intro: 'Emits a pause instruction; it does not yield to the OS.',
  steps: [['Check the flag.', 0], ['Pause briefly and check again.', [], 'o0']],
  result: 'ready: true', resultCap: 'For longer waits, use thread::yield_now or proper blocking.',
}, 'let f = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)); let g = f.clone(); let h = std::thread::spawn(move || g.store(true, std::sync::atomic::Ordering::Release)); while !f.load(std::sync::atomic::Ordering::Acquire) { std::hint::spin_loop(); } h.join().unwrap(); String::from("ready: true")');

add('hint/select_unpredictable', 'select_unpredictable', HINT, 'How hint::select_unpredictable works', 'Chooses between two values, hinting that the condition is hard to predict.', {
  rows: [['cond true', 'cond false']], call: 'select_unpredictable(cond, a, b)', note: 'branch-free choice', outs: ['a', 'b'],
  intro: 'The compiler may use a conditional move instead of a jump.',
  steps: [['true → a.', 0, 'o0'], ['false → b.', 1, 'o1']],
  result: '"a", "b"', resultCap: 'Helps hot loops with random branches.',
}, 'format!("{:?}, {:?}", std::hint::select_unpredictable(true, "a", "b"), std::hint::select_unpredictable(false, "a", "b"))');

// ---------------------------------------------------------------- raw pointers of collections

add('vec/as_ptr', 'as_ptr', ['alloc', 'Vec', /vec\/mod\.rs$/], 'How Vec::as_ptr works', 'A raw pointer to the Vec\'s buffer.', {
  rows: [['vec![1, 2, 3]']], call: 'v.as_ptr()', note: 'for FFI', outs: ['*const i32 to 1'],
  intro: 'Valid as long as the Vec is not changed or dropped.',
  steps: [['Get the buffer address.', 0], ['It points at the first element.', [], 'o0']],
  result: '1', resultCap: 'Pushing may reallocate and invalidate it.',
}, 'let v = vec![1, 2, 3]; let p = v.as_ptr(); unsafe { *p }.to_string()');

add('vec/as_mut_ptr', 'as_mut_ptr', ['alloc', 'Vec', /vec\/mod\.rs$/], 'How Vec::as_mut_ptr works', 'A mutable raw pointer to the Vec\'s buffer.', {
  rows: [['vec![0, 0]']], call: 'unsafe { *v.as_mut_ptr().add(1) = 9; }', note: 'for FFI fill-ins', outs: ['[0, 9]'],
  intro: 'C functions often fill a buffer through such a pointer.',
  steps: [['Get the pointer.', 0], ['Write the second element.', [], 'o0']],
  result: '[0, 9]', resultCap: 'Stay within len, or call set_len afterwards.',
}, 'let mut v = vec![0, 0]; unsafe { *v.as_mut_ptr().add(1) = 9; } d(v)');

add('slice/as_ptr', 'as_ptr', ['core', '', /slice\/mod\.rs$/], 'How slice::as_ptr works', 'A raw pointer to the first element of a slice.', {
  rows: [['&[7, 8]']], call: 's.as_ptr()', note: 'start address', outs: ['*const to 7'],
  intro: 'The slice must outlive the pointer.',
  steps: [['Get the start.', 0], ['It points at 7.', [], 'o0']],
  result: '7', resultCap: 'as_ptr_range gives start and end.',
}, 'let s: &[i32] = &[7, 8]; unsafe { *s.as_ptr() }.to_string()');

add('slice/as_ptr_range', 'as_ptr_range', ['core', '', /slice\/mod\.rs$/], 'How slice::as_ptr_range works', 'The start and one-past-the-end pointers of a slice.', {
  rows: [['&[1u32, 2, 3]']], call: 's.as_ptr_range()', note: 'start..end', outs: ['12 bytes apart'],
  intro: 'Handy for checking whether a pointer lies inside the slice.',
  steps: [['Start and end.', 0], ['3 × 4 bytes apart.', [], 'o0']],
  result: '12', resultCap: 'The end pointer must not be read.',
}, 'let s = [1u32, 2, 3]; let r = s.as_ptr_range(); (r.end.addr() - r.start.addr()).to_string()');

add('str/as_ptr', 'as_ptr', ['core', 'str', /str\/mod\.rs$/], 'How str::as_ptr works', 'A raw pointer to the first byte of the string.', {
  rows: [['"Hi"']], call: 's.as_ptr()', note: 'UTF-8 bytes', outs: ['*const u8 to b\'H\''],
  intro: 'Not NUL-terminated: use CString for C APIs.',
  steps: [['Get the start.', 0], ['It points at 72 (H).', [], 'o0']],
  result: '72', resultCap: 'Pair with len() when passing to other code.',
}, 'let s = "Hi"; unsafe { *s.as_ptr() }.to_string()');

// ---------------------------------------------------------------- Rc/Arc raw and uninit

add('rc/new_uninit', 'new_uninit', RC, 'How Rc::new_uninit works', 'Allocates an Rc whose value will be written later.', {
  rows: [['Rc<MaybeUninit<u32>>']], call: 'let mut r = Rc::<u32>::new_uninit(); Rc::get_mut(&mut r).unwrap().write(5);', note: 'fill, then assume_init', outs: ['Rc(5)'],
  intro: 'Avoids building a large value on the stack first.',
  steps: [['Allocate empty space.', 0], ['Write 5, then assume_init (unsafe).', [], 'o0']],
  result: '5', resultCap: 'Arc::new_uninit works the same.',
}, 'let mut r = Rc::<u32>::new_uninit(); Rc::get_mut(&mut r).unwrap().write(5); let r = unsafe { r.assume_init() }; r.to_string()');

add('arc/new_uninit', 'new_uninit', ARC, 'How Arc::new_uninit works', 'Allocates an Arc whose value will be written later.', {
  rows: [['Arc<MaybeUninit<u64>>']], call: 'let mut a = Arc::<u64>::new_uninit();', note: 'fill, then assume_init', outs: ['Arc(9)'],
  intro: 'Write the value while the Arc is still unique.',
  steps: [['Allocate empty space.', 0], ['Write 9, then assume_init (unsafe).', [], 'o0']],
  result: '9', resultCap: 'Useful for large shared buffers.',
}, `let mut a = ${A}::<u64>::new_uninit(); ${A}::get_mut(&mut a).unwrap().write(9); let a = unsafe { a.assume_init() }; a.to_string()`);

add('rc/into_raw', 'into_raw', RC, 'How Rc::into_raw works', 'Turns an Rc into a raw pointer, keeping the reference count.', {
  rows: [['Rc(7)']], call: 'let p = Rc::into_raw(r); let r = unsafe { Rc::from_raw(p) };', note: 'for FFI user data', outs: ['the same Rc back'],
  intro: 'The count is not decreased; from_raw must take it back.',
  steps: [['Rc becomes a raw pointer.', 0], ['from_raw restores it.', [], 'o0']],
  result: '7', resultCap: 'Forgetting from_raw leaks the value.',
}, 'let p = Rc::into_raw(Rc::new(7)); let r = unsafe { Rc::from_raw(p) }; r.to_string()');

add('arc/into_raw', 'into_raw', ARC, 'How Arc::into_raw works', 'Turns an Arc into a raw pointer, keeping the reference count.', {
  rows: [['Arc("x")']], call: 'let p = Arc::into_raw(a); let a = unsafe { Arc::from_raw(p) };', note: 'hand to C and back', outs: ['the same Arc back'],
  intro: 'Common for callbacks that carry user data through C.',
  steps: [['Arc becomes a raw pointer.', 0], ['from_raw restores it.', [], 'o0']],
  result: '"x"', resultCap: 'Each into_raw needs exactly one from_raw.',
}, `let p = ${A}::into_raw(${A}::new("x")); let a = unsafe { ${A}::from_raw(p) }; d(*a)`);

add('rc_weak/as_ptr', 'as_ptr', ['alloc', 'Weak', /^src\/rc\.rs$/], 'How rc::Weak::as_ptr works', 'A raw pointer to the value a Weak points at.', {
  rows: [['Weak from Rc(1)']], call: 'w.as_ptr() == Rc::as_ptr(&r)', note: 'same address', outs: ['true'],
  intro: 'Does not check whether the value still exists.',
  steps: [['Get both pointers.', 0], ['Equal.', [], 'o0']],
  result: 'true', resultCap: 'Do not read through it after the Rc is gone.',
}, 'let r = Rc::new(1); let w = Rc::downgrade(&r); (w.as_ptr() == Rc::as_ptr(&r)).to_string()');

add('arc_weak/as_ptr', 'as_ptr', ['alloc', 'Weak', /^src\/sync\.rs$/], 'How sync::Weak::as_ptr works', 'A raw pointer to the value a thread-safe Weak points at.', {
  rows: [['Weak from Arc(1)']], call: 'w.as_ptr() == Arc::as_ptr(&a)', note: 'same address', outs: ['true'],
  intro: 'No liveness check is performed.',
  steps: [['Get both pointers.', 0], ['Equal.', [], 'o0']],
  result: 'true', resultCap: 'Useful as a key for identity maps.',
}, `let a = ${A}::new(1); let w = ${A}::downgrade(&a); (w.as_ptr() == ${A}::as_ptr(&a)).to_string()`);

add('iter/chain_fn', 'chain', ['core', '', /iter\/adapters\/chain\.rs$/], 'How iter::chain works', 'Chains two iterables, written as a function.', {
  rows: [['[1, 2]', '[3]']], call: 'std::iter::chain(a, b)', note: 'same as a.into_iter().chain(b)', outs: ['1', '2', '3'],
  intro: 'Reads nicely when neither side is "first".',
  steps: [['Items from the first.', 0, 'o0,1'], ['Then from the second.', 1, 'o2']],
  result: '1, 2, 3', resultCap: 'Accepts anything IntoIterator.',
}, 'j(std::iter::chain([1, 2], [3]))');

module.exports = list;
