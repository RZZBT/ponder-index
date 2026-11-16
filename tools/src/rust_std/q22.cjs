// Rust standard library: low-level memory (ManuallyDrop, MaybeUninit, raw pointers, NonNull, Layout), Pin, and
// the async building blocks (Poll, Waker, Context, ready, pending, poll_fn). Futures in the truth checks are polled
// by hand with Waker::noop(), so no runtime is needed.
const { group } = require('./kit.cjs');
const MEM = (o) => ['core', o, new RegExp(`mem[/]${o === 'ManuallyDrop' ? 'manually_drop' : o === 'MaybeUninit' ? 'maybe_uninit' : 'mod'}[.]rs$`)];
const CPTR = ['core', '', /ptr\/const_ptr\.rs$/];
const NN = ['core', 'NonNull', /ptr\/non_null\.rs$/];
const LAY = ['core', 'Layout', /alloc\/layout\.rs$/];
const PIN = ['core', 'Pin', /^src\/pin\.rs$/];
const POLL = ['core', 'Poll', /task\/poll\.rs$/];
const WAKER = (o) => ['core', o, /task\/wake\.rs$/];
const { list, add } = group({ at: MEM('ManuallyDrop') });
const POLL1 = 'use std::task::{Context, Poll, Waker}; let mut cx = Context::from_waker(Waker::noop()); ';

// ---------------------------------------------------------------- ManuallyDrop, MaybeUninit, mem

add('manually_drop/new', 'new', null, 'How ManuallyDrop::new works', 'Wraps a value so its destructor does not run automatically.', {
  rows: [['value with Drop']], call: 'let md = ManuallyDrop::new(v);', note: 'you decide when to drop', outs: ['not dropped at scope end'],
  intro: 'Used in low-level code that controls drop order itself.',
  steps: [['The value is wrapped.', 0], ['Leaving the scope does not drop it.', [], 'o0']],
  result: 'dropped: false', resultCap: 'into_inner gives the value back so it drops normally.',
}, 'struct D<\'a>(&\'a Cell<bool>); impl Drop for D<\'_> { fn drop(&mut self) { self.0.set(true); } } let f = Cell::new(false); { let _m = std::mem::ManuallyDrop::new(D(&f)); } format!("dropped: {}", f.get())');

add('manually_drop/into_inner', 'into_inner', null, 'How ManuallyDrop::into_inner works', 'Unwraps the value, so it is dropped normally again.', {
  rows: [['ManuallyDrop(v)']], call: 'let v = ManuallyDrop::into_inner(md);', note: 'back to normal', outs: ['drops at scope end'],
  intro: 'Written as a function call, not a method, on purpose.',
  steps: [['Take the value out.', 0], ['It drops when its scope ends.', [], 'o0']],
  result: 'dropped: true', resultCap: 'ManuallyDrop::drop (unsafe) drops it in place.',
}, 'struct D<\'a>(&\'a Cell<bool>); impl Drop for D<\'_> { fn drop(&mut self) { self.0.set(true); } } let f = Cell::new(false); { let m = std::mem::ManuallyDrop::new(D(&f)); let _v = std::mem::ManuallyDrop::into_inner(m); } format!("dropped: {}", f.get())');

add('maybe_uninit/new', 'new', MEM('MaybeUninit'), 'How MaybeUninit::new works', 'A MaybeUninit that is already initialised with a value.', {
  rows: [['5']], call: 'let m = MaybeUninit::new(5);', note: 'initialised from the start', outs: ['safe to read'],
  intro: 'MaybeUninit lets low-level code handle memory that may not be filled yet.',
  steps: [['Wrap 5.', 0], ['assume_init is safe here.', [], 'o0']],
  result: '5', resultCap: 'Normal code never needs MaybeUninit.',
}, 'let m = std::mem::MaybeUninit::new(5); unsafe { m.assume_init() }.to_string()');

add('maybe_uninit/uninit', 'uninit', MEM('MaybeUninit'), 'How MaybeUninit::uninit works', 'Reserves space for a value without initialising it.', {
  rows: [['MaybeUninit<u32>']], call: 'let mut m = MaybeUninit::<u32>::uninit(); m.write(7);', note: 'fill it later', outs: ['7 after write'],
  intro: 'Reading before writing would be undefined behaviour.',
  steps: [['Space is reserved.', 0], ['write fills it.', [], 'o0']],
  result: '7', resultCap: 'Box::new_uninit does this on the heap.',
}, 'let mut m = std::mem::MaybeUninit::<u32>::uninit(); m.write(7); unsafe { m.assume_init() }.to_string()');

add('maybe_uninit/write', 'write', MEM('MaybeUninit'), 'How MaybeUninit::write works', 'Stores a value into the slot and returns a &mut to it.', {
  rows: [['uninit slot']], call: '*m.write(1) += 1;', note: 'safe initialisation', outs: ['2'],
  intro: 'Safe: it never reads the old (garbage) contents.',
  steps: [['Write 1.', 0], ['Use the returned reference: 2.', [], 'o0']],
  result: '2', resultCap: 'Then assume_init is sound.',
}, 'let mut m = std::mem::MaybeUninit::<i32>::uninit(); *m.write(1) += 1; unsafe { m.assume_init() }.to_string()');

add('maybe_uninit/zeroed', 'zeroed', MEM('MaybeUninit'), 'How MaybeUninit::zeroed works', 'A slot whose memory is filled with zero bytes.', {
  rows: [['MaybeUninit<u64>']], call: 'MaybeUninit::<u64>::zeroed()', note: 'all bits 0', outs: ['0 for integers'],
  intro: 'For integers, all-zero is a valid value; for references it is not.',
  steps: [['Memory is zeroed.', 0], ['As a u64: 0.', [], 'o0']],
  result: '0', resultCap: 'Only assume_init when zero is valid for the type.',
}, 'unsafe { std::mem::MaybeUninit::<u64>::zeroed().assume_init() }.to_string()');

add('mem/align_of_val', 'align_of_val', MEM(''), 'How mem::align_of_val works', 'The alignment of the value you point at.', {
  rows: [['&5u64', '&[1u16, 2][..]']], call: 'std::mem::align_of_val(&x)', note: 'works for slices too', outs: ['8', '2'],
  intro: 'For slices it is the alignment of the element type.',
  steps: [['u64: 8.', 0, 'o0'], ['[u16]: 2.', 1, 'o1']],
  result: '8, 2', resultCap: 'align_of::<T>() when you know the type.',
}, 'format!("{}, {}", std::mem::align_of_val(&5u64), std::mem::align_of_val(&[1u16, 2][..]))');

// ---------------------------------------------------------------- raw pointers

add('ptr/null_mut', 'null_mut', ['core', '', /ptr\/mod\.rs$/], 'How ptr::null_mut works', 'A mutable raw pointer that points nowhere.', {
  rows: [['ptr::null_mut::<i32>()']], call: 'let p: *mut i32 = std::ptr::null_mut();', note: 'for FFI', outs: ['is_null() = true'],
  intro: 'Safe Rust uses Option instead of null.',
  steps: [['Address 0.', 0], ['is_null() is true.', [], 'o0']],
  result: 'true', resultCap: 'Writing through it is undefined behaviour.',
}, 'let p: *mut i32 = std::ptr::null_mut(); p.is_null().to_string()');

add('ptr/addr_eq', 'addr_eq', ['core', '', /ptr\/mod\.rs$/], 'How ptr::addr_eq works', 'Compares only the addresses of two pointers, ignoring extra metadata.', {
  rows: [['&v[0]', 'v as slice']], call: 'std::ptr::addr_eq(a, b)', note: 'thin vs fat pointers', outs: ['true'],
  intro: 'A slice pointer carries a length; addr_eq ignores it.',
  steps: [['Both start at the same address.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'ptr::eq would also compare the metadata.',
}, 'let v = [1, 2, 3]; std::ptr::addr_eq(&v[0] as *const i32, &v[..] as *const [i32]).to_string()');

add('ptr/slice_from_raw_parts', 'slice_from_raw_parts', ['core', '', /ptr\/mod\.rs$/], 'How ptr::slice_from_raw_parts works', 'Builds a raw slice pointer from a start pointer and a length.', {
  rows: [['ptr to [1, 2, 3], len 2']], call: 'std::ptr::slice_from_raw_parts(p, 2)', note: 'safe to create', outs: ['*const [i32] of length 2'],
  intro: 'Creating it is safe; reading through it is not.',
  steps: [['Start pointer and length.', 0], ['A raw slice pointer.', [], 'o0']],
  result: '[1, 2]', resultCap: 'slice::from_raw_parts (unsafe) gives a real slice.',
}, 'let v = [1, 2, 3]; let s = std::ptr::slice_from_raw_parts(v.as_ptr(), 2); d(unsafe { &*s })');

add('ptr/without_provenance', 'without_provenance', ['core', '', /ptr\/mod\.rs$/], 'How ptr::without_provenance works', 'A pointer with a given address that may not be used to access memory.', {
  rows: [['address 0x1000']], call: 'std::ptr::without_provenance::<u8>(0x1000)', note: 'a sentinel value', outs: ['addr() = 0x1000'],
  intro: 'Useful for tagged or sentinel pointers that are never dereferenced.',
  steps: [['Make the pointer.', 0], ['Its address is 0x1000.', [], 'o0']],
  result: '0x1000', resultCap: 'Dereferencing it is undefined behaviour.',
}, 'format!("{:#x}", std::ptr::without_provenance::<u8>(0x1000).addr())');

add('const_ptr/is_null', 'is_null', CPTR, 'How <*const T>::is_null works', 'true if the raw pointer is null.', {
  rows: [['null', '&5 as *const']], call: 'p.is_null()', note: 'check before use', outs: ['true', 'false'],
  intro: 'Pointers from C may be null.',
  steps: [['Null: true.', 0, 'o0'], ['A real reference: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'as_ref (unsafe) turns a pointer into Option<&T>.',
}, 'let a: *const i32 = std::ptr::null(); let x = 5; let b: *const i32 = &x; format!("{}, {}", a.is_null(), b.is_null())');

add('const_ptr/cast', 'cast', CPTR, 'How <*const T>::cast works', 'Changes the pointee type of a raw pointer.', {
  rows: [['*const u32']], call: 'p.cast::<u8>()', note: 'same address, new type', outs: ['*const u8'],
  intro: 'Safer than as, because only the pointee type changes.',
  steps: [['The address stays.', 0], ['Now it points to bytes.', [], 'o0']],
  result: 'same address: true', resultCap: 'Reading through the new type is still unsafe.',
}, 'let x = 1u32; let p: *const u32 = &x; let q = p.cast::<u8>(); format!("same address: {}", p.addr() == q.addr())');

add('const_ptr/addr', 'addr', CPTR, 'How <*const T>::addr works', 'The address of a pointer as a usize.', {
  rows: [['&v[0]', '&v[1]']], call: 'p.addr()', note: 'for comparisons and printing', outs: ['addresses 4 apart'],
  intro: 'Neighbouring i32 elements are 4 bytes apart.',
  steps: [['Two element addresses.', [0, 1]], ['They differ by 4.', [], 'o0']],
  result: '4', resultCap: 'Do not turn the usize back into a pointer with as.',
}, 'let v = [1i32, 2]; ((&v[1] as *const i32).addr() - (&v[0] as *const i32).addr()).to_string()');

add('const_ptr/wrapping_add', 'wrapping_add', CPTR, 'How <*const T>::wrapping_add works', 'Moves a raw pointer by n elements, without unsafe.', {
  rows: [['ptr to [10, 20, 30]']], call: 'p.wrapping_add(2)', note: 'pointer arithmetic', outs: ['points at 30'],
  intro: 'The arithmetic is safe; reading the result is unsafe.',
  steps: [['Start at index 0.', 0], ['Two elements further: 30.', [], 'o0']],
  result: '30', resultCap: 'add (unsafe) promises to stay inside the allocation.',
}, 'let v = [10, 20, 30]; let p = v.as_ptr().wrapping_add(2); unsafe { *p }.to_string()');

add('non_null/new', 'new', NN, 'How NonNull::new works', 'Wraps a raw pointer that is guaranteed not to be null; None if it is.', {
  rows: [['&mut x', 'null_mut()']], call: 'NonNull::new(p)', note: 'Option<NonNull<T>>', outs: ['Some', 'None'],
  intro: 'Option<NonNull<T>> is the same size as a raw pointer.',
  steps: [['A real pointer: Some.', 0, 'o0'], ['Null: None.', 1, 'o1']],
  result: 'Some, None', resultCap: 'Used to build linked lists and other raw structures.',
}, 'let mut x = 1; let a = std::ptr::NonNull::new(&mut x as *mut i32).is_some(); let b = std::ptr::NonNull::new(std::ptr::null_mut::<i32>()).is_some(); format!("{}, {}", if a { "Some" } else { "None" }, if b { "Some" } else { "None" })');

add('non_null/dangling', 'dangling', NN, 'How NonNull::dangling works', 'A non-null, well-aligned pointer that must not be read.', {
  rows: [['NonNull::<u64>::dangling()']], call: 'NonNull::<u64>::dangling()', note: 'placeholder for empty buffers', outs: ['address = 8'],
  intro: 'Vec uses it for an empty buffer that has no allocation.',
  steps: [['Not null...', 0], ['...and aligned for u64.', [], 'o0']],
  result: '8', resultCap: 'Never dereference it.',
}, 'std::ptr::NonNull::<u64>::dangling().as_ptr().addr().to_string()');

add('non_null/as_ptr', 'as_ptr', NN, 'How NonNull::as_ptr works', 'The raw *mut T inside a NonNull.', {
  rows: [['NonNull to x = 7']], call: 'nn.as_ptr()', note: 'back to a raw pointer', outs: ['*mut i32'],
  intro: 'Use it to read or write through unsafe code.',
  steps: [['Get the raw pointer.', 0], ['Read 7 through it.', [], 'o0']],
  result: '7', resultCap: 'as_ref / as_mut (unsafe) give references.',
}, 'let mut x = 7; let nn = std::ptr::NonNull::from(&mut x); unsafe { *nn.as_ptr() }.to_string()');

add('non_null/from_ref', 'from_ref', NN, 'How NonNull::from_ref works', 'A NonNull from a shared reference (references are never null).', {
  rows: [['&x']], call: 'NonNull::from_ref(&x)', note: 'always valid', outs: ['NonNull to x'],
  intro: 'No check needed: references cannot be null.',
  steps: [['Take a reference.', 0], ['Wrap it.', [], 'o0']],
  result: '9', resultCap: 'from_mut works for &mut.',
}, 'let x = 9; let nn = std::ptr::NonNull::from_ref(&x); unsafe { *nn.as_ptr() }.to_string()');

add('non_null/addr', 'addr', NN, 'How NonNull::addr works', 'The address as a NonZero<usize>.', {
  rows: [['NonNull to x']], call: 'nn.addr()', note: 'never zero', outs: ['NonZero address'],
  intro: 'The type itself says the address is not 0.',
  steps: [['Read the address.', 0], ['It is non-zero.', [], 'o0']],
  result: 'nonzero: true', resultCap: 'Useful for hashing or tagging pointers.',
}, 'let x = 1; let nn = std::ptr::NonNull::from_ref(&x); format!("nonzero: {}", nn.addr().get() != 0)');

// ---------------------------------------------------------------- Layout

add('layout/new', 'new', LAY, 'How Layout::new works', 'The size and alignment of a type, for manual allocation.', {
  rows: [['Layout::new::<u64>()']], call: 'Layout::new::<u64>()', note: 'size + align', outs: ['size 8, align 8'],
  intro: 'Allocators need both numbers.',
  steps: [['u64 is 8 bytes...', 0], ['...aligned to 8.', [], 'o0']],
  result: 'size 8, align 8', resultCap: 'Layout::array for several values.',
}, 'let l = std::alloc::Layout::new::<u64>(); format!("size {}, align {}", l.size(), l.align())');

add('layout/size', 'size', LAY, 'How Layout::size works', 'The number of bytes the layout describes.', {
  rows: [['Layout of (u8, u32)']], call: 'layout.size()', note: 'includes padding', outs: ['8'],
  intro: '1 + 4 bytes, plus padding to keep the u32 aligned.',
  steps: [['Fields need 5 bytes.', 0], ['With padding: 8.', [], 'o0']],
  result: '8', resultCap: 'align() gives the alignment.',
}, 'std::alloc::Layout::new::<(u8, u32)>().size().to_string()');

add('layout/align', 'align', LAY, 'How Layout::align works', 'The alignment the memory must have.', {
  rows: [['Layout of u16']], call: 'layout.align()', note: 'a power of two', outs: ['2'],
  intro: 'The address must be a multiple of this.',
  steps: [['u16 needs 2-byte alignment.', 0], ['2.', [], 'o0']],
  result: '2', resultCap: 'Always a power of two.',
}, 'std::alloc::Layout::new::<u16>().align().to_string()');

add('layout/from_size_align', 'from_size_align', LAY, 'How Layout::from_size_align works', 'A layout from a size and alignment, checked for validity.', {
  rows: [['16, 8', '16, 3']], call: 'Layout::from_size_align(16, 8)', note: 'align must be a power of two', outs: ['Ok', 'Err'],
  intro: '3 is not a power of two.',
  steps: [['16 bytes, align 8: Ok.', 0, 'o0'], ['Align 3: Err.', 1, 'o1']],
  result: 'Ok, Err', resultCap: 'Also fails if the size would overflow when rounded up.',
}, 'format!("{}, {}", if std::alloc::Layout::from_size_align(16, 8).is_ok() { "Ok" } else { "Err" }, if std::alloc::Layout::from_size_align(16, 3).is_ok() { "Ok" } else { "Err" })');

add('layout/array', 'array', LAY, 'How Layout::array works', 'The layout of n values of a type in a row.', {
  rows: [['10 × u32']], call: 'Layout::array::<u32>(10)?', note: 'for buffers', outs: ['size 40, align 4'],
  intro: 'Overflow is reported as an error.',
  steps: [['10 × 4 bytes.', 0], ['Aligned like a u32.', [], 'o0']],
  result: 'size 40, align 4', resultCap: 'Vec uses this internally.',
}, 'let l = std::alloc::Layout::array::<u32>(10).unwrap(); format!("size {}, align {}", l.size(), l.align())');

add('layout/for_value', 'for_value', LAY, 'How Layout::for_value works', 'The layout of a value you have, including slices.', {
  rows: [['&[1u8, 2, 3][..]']], call: 'Layout::for_value(&slice)', note: 'dynamic size', outs: ['size 3, align 1'],
  intro: 'Works for values whose size is only known at run time.',
  steps: [['Three bytes.', 0], ['Align 1.', [], 'o0']],
  result: 'size 3, align 1', resultCap: 'Layout::new for sized types.',
}, 'let s: &[u8] = &[1, 2, 3]; let l = std::alloc::Layout::for_value(s); format!("size {}, align {}", l.size(), l.align())');

add('layout/extend', 'extend', LAY, 'How Layout::extend works', 'Appends another layout, like adding a field to a struct.', {
  rows: [['u8 then u32']], call: 'Layout::new::<u8>().extend(Layout::new::<u32>())?', note: '(layout, offset)', outs: ['offset 4'],
  intro: 'The u32 must start at an aligned offset.',
  steps: [['u8 takes byte 0.', 0], ['u32 starts at offset 4.', [], 'o0']],
  result: 'offset 4, size 8', resultCap: 'Call pad_to_align at the end for a full struct layout.',
}, 'let (l, off) = std::alloc::Layout::new::<u8>().extend(std::alloc::Layout::new::<u32>()).unwrap(); format!("offset {}, size {}", off, l.size())');

add('layout/align_to', 'align_to', LAY, 'How Layout::align_to works', 'The same size with a stricter alignment.', {
  rows: [['u8 layout → align 64']], call: 'layout.align_to(64)?', note: 'e.g. cache lines', outs: ['align 64'],
  intro: 'Useful to avoid false sharing between threads.',
  steps: [['Start with align 1.', 0], ['Raise it to 64.', [], 'o0']],
  result: 'align 64, size 1', resultCap: 'The size is not padded automatically.',
}, 'let l = std::alloc::Layout::new::<u8>().align_to(64).unwrap(); format!("align {}, size {}", l.align(), l.size())');

// ---------------------------------------------------------------- Pin

add('pin/new', 'new', PIN, 'How Pin::new works', 'Pins a reference to a value that does not care about moving (Unpin).', {
  rows: [['&mut 5']], call: 'let p = Pin::new(&mut x);', note: 'safe for Unpin types', outs: ['Pin<&mut i32>'],
  intro: 'Most types are Unpin, so pinning them is safe and free.',
  steps: [['Wrap the reference.', 0], ['It can be read through the pin.', [], 'o0']],
  result: '5', resultCap: 'Self-referential futures need Box::pin or pin! instead.',
}, 'let mut x = 5; let p = std::pin::Pin::new(&mut x); (*p).to_string()');

add('pin/into_inner', 'into_inner', PIN, 'How Pin::into_inner works', 'Unwraps a Pin around an Unpin value.', {
  rows: [['Pin<&mut i32>']], call: 'Pin::into_inner(p)', note: 'get the reference back', outs: ['&mut i32'],
  intro: 'Safe because Unpin values may move freely.',
  steps: [['The pin is removed.', 0], ['A normal &mut.', [], 'o0']],
  result: '6', resultCap: 'For !Unpin types it is unsafe (into_inner_unchecked).',
}, 'let mut x = 5; let r = std::pin::Pin::into_inner(std::pin::Pin::new(&mut x)); *r += 1; x.to_string()');

add('pin/as_mut', 'as_mut', PIN, 'How Pin::as_mut works', 'Reborrows a Pin<&mut T> (or Pin<Box<T>>) as Pin<&mut T>.', {
  rows: [['Pin<Box<i32>>']], call: 'pinned.as_mut()', note: 'lend the pin', outs: ['Pin<&mut i32>'],
  intro: 'Needed to call poll() repeatedly on a pinned future.',
  steps: [['Borrow the pinned value mutably.', 0], ['Change it through the pin.', [], 'o0']],
  result: '2', resultCap: 'as_ref gives Pin<&T>.',
}, 'let mut p = Box::pin(1); *p.as_mut() += 1; (*p).to_string()');

add('pin/as_ref', 'as_ref', PIN, 'How Pin::as_ref works', 'Borrows a pin immutably: Pin<&T>.', {
  rows: [['Pin<Box<String>>']], call: 'pinned.as_ref()', note: 'read access', outs: ['Pin<&String>'],
  intro: 'The pinning guarantee is kept.',
  steps: [['Borrow the pinned value.', 0], ['Read its length.', [], 'o0']],
  result: '3', resultCap: 'get_ref then gives a plain &T.',
}, 'let p = Box::pin(String::from("abc")); p.as_ref().len().to_string()');

add('pin/get_ref', 'get_ref', PIN, 'How Pin::get_ref works', 'A plain shared reference to the pinned value.', {
  rows: [['Pin<&i32>']], call: 'pinned.get_ref()', note: 'reading never moves', outs: ['&i32'],
  intro: 'Always safe: a shared reference cannot move the value.',
  steps: [['Remove the pin for reading.', 0], ['&i32.', [], 'o0']],
  result: '4', resultCap: 'get_mut is only safe for Unpin types.',
}, 'let x = 4; let p = std::pin::Pin::new(&x); p.get_ref().to_string()');

add('pin/get_mut', 'get_mut', PIN, 'How Pin::get_mut works', 'A plain &mut to a pinned Unpin value.', {
  rows: [['Pin<&mut i32>']], call: 'pinned.get_mut()', note: 'Unpin only', outs: ['&mut i32'],
  intro: 'For !Unpin types this would allow moving, so it is not available.',
  steps: [['Remove the pin.', 0], ['Change the value.', [], 'o0']],
  result: '10', resultCap: 'get_unchecked_mut (unsafe) for !Unpin types.',
}, 'let mut x = 1; { let p = std::pin::Pin::new(&mut x); *p.get_mut() = 10; } x.to_string()');

add('pin/set', 'set', PIN, 'How Pin::set works', 'Replaces the pinned value, running the old value\'s destructor in place.', {
  rows: [['Pin<Box<i32>> = 1']], call: 'pinned.as_mut().set(2)', note: 'replace without moving out', outs: ['2'],
  intro: 'Works even for !Unpin values.',
  steps: [['The old value is dropped in place.', 0], ['The new one is written.', [], 'o0']],
  result: '2', resultCap: 'Used to restart a stored future.',
}, 'let mut p = Box::pin(1); p.as_mut().set(2); (*p).to_string()');

// ---------------------------------------------------------------- task, future

add('poll/is_ready', 'is_ready', POLL, 'How Poll::is_ready works', 'true for Poll::Ready.', {
  rows: [['Ready(5)', 'Pending']], call: 'p.is_ready()', note: 'is the result there?', outs: ['true', 'false'],
  intro: 'A future returns Poll::Ready when it is done.',
  steps: [['Ready: true.', 0, 'o0'], ['Pending: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_pending is the opposite.',
}, 'use std::task::Poll; let a: Poll<i32> = Poll::Ready(5); let b: Poll<i32> = Poll::Pending; format!("{}, {}", a.is_ready(), b.is_ready())');

add('poll/is_pending', 'is_pending', POLL, 'How Poll::is_pending works', 'true for Poll::Pending.', {
  rows: [['Pending']], call: 'p.is_pending()', note: 'not done yet', outs: ['true'],
  intro: 'Pending means "wake me later".',
  steps: [['Not ready yet.', 0], ['true.', [], 'o0']],
  result: 'true', resultCap: 'The future must arrange a wake-up first.',
}, 'use std::task::Poll; let p: Poll<i32> = Poll::Pending; p.is_pending().to_string()');

add('poll/map', 'map', POLL, 'How Poll::map works', 'Transforms the value inside Poll::Ready.', {
  rows: [['Ready(2)']], call: 'p.map(|x| x * 10)', note: 'Pending stays Pending', outs: ['Ready(20)'],
  intro: 'Like Option::map for poll results.',
  steps: [['Ready holds 2.', 0], ['It becomes 20.', [], 'o0']],
  result: 'Ready(20)', resultCap: 'map_ok / map_err work on Poll<Result>.',
}, 'use std::task::Poll; d(Poll::Ready(2).map(|x| x * 10))');

add('poll/map_ok', 'map_ok', POLL, 'How Poll::map_ok works', 'Transforms the Ok value inside Poll<Result>.', {
  rows: [['Ready(Ok(3))']], call: 'p.map_ok(|x| x + 1)', note: 'errors untouched', outs: ['Ready(Ok(4))'],
  intro: 'Common in hand-written futures that can fail.',
  steps: [['Ready(Ok(3)).', 0], ['Ready(Ok(4)).', [], 'o0']],
  result: 'Ready(Ok(4))', resultCap: 'map_err changes the error instead.',
}, 'use std::task::Poll; let p: Poll<Result<i32, ()>> = Poll::Ready(Ok(3)); d(p.map_ok(|x| x + 1))');

add('poll/map_err', 'map_err', POLL, 'How Poll::map_err works', 'Transforms the error inside Poll<Result>.', {
  rows: [['Ready(Err("e"))']], call: 'p.map_err(|e| e.len())', note: 'Ok untouched', outs: ['Ready(Err(1))'],
  intro: 'Converts error types while polling.',
  steps: [['The error is "e".', 0], ['Its length: 1.', [], 'o0']],
  result: 'Ready(Err(1))', resultCap: 'Pending passes through unchanged.',
}, 'use std::task::Poll; let p: Poll<Result<i32, &str>> = Poll::Ready(Err("e")); d(p.map_err(|e| e.len()))');

add('waker/noop', 'noop', WAKER('Waker'), 'How Waker::noop works', 'A Waker that does nothing when woken.', {
  rows: [['Waker::noop()']], call: 'let mut cx = Context::from_waker(Waker::noop());', note: 'for tests and simple polling', outs: ['a usable Context'],
  intro: 'Lets you poll a future by hand without a runtime.',
  steps: [['Create a do-nothing waker.', 0], ['Build a Context from it.', [], 'o0']],
  result: 'Ready(42)', resultCap: 'Real executors use wakers that reschedule the task.',
}, POLL1 + 'let mut f = std::pin::pin!(async { 42 }); d(std::future::Future::poll(f.as_mut(), &mut cx))');

add('context/from_waker', 'from_waker', WAKER('Context'), 'How Context::from_waker works', 'Builds the Context passed to Future::poll.', {
  rows: [['&Waker']], call: 'Context::from_waker(&waker)', note: 'poll needs one', outs: ['Context'],
  intro: 'The Context carries the waker a future uses to ask for another poll.',
  steps: [['Wrap the waker.', 0], ['Pass it to poll.', [], 'o0']],
  result: 'Ready(7)', resultCap: 'cx.waker() gives the waker back.',
}, POLL1 + 'let mut f = std::pin::pin!(std::future::ready(7)); d(std::future::Future::poll(f.as_mut(), &mut cx))');

add('context/waker', 'waker', WAKER('Context'), 'How Context::waker works', 'The waker of the current task, to arrange a future wake-up.', {
  rows: [['inside poll()']], call: 'cx.waker().wake_by_ref()', note: '"poll me again"', outs: ['task rescheduled'],
  intro: 'A future that returns Pending must make sure someone wakes it.',
  steps: [['Get the waker.', 0], ['Wake it when progress is possible.', [], 'o0']],
  result: 'Pending, then Ready(())', resultCap: 'Clone it to store it for later.',
}, POLL1 + 'let mut first = true; let mut f = std::pin::pin!(std::future::poll_fn(move |cx: &mut Context<\'_>| { if first { first = false; cx.waker().wake_by_ref(); Poll::Pending } else { Poll::Ready(()) } })); let a = std::future::Future::poll(f.as_mut(), &mut cx); let b = std::future::Future::poll(f.as_mut(), &mut cx); format!("{:?}, then {:?}", a, b)');

add('waker/wake_by_ref', 'wake_by_ref', WAKER('Waker'), 'How Waker::wake_by_ref works', 'Signals that the task should be polled again, without consuming the waker.', {
  rows: [['&Waker']], call: 'waker.wake_by_ref()', note: 'keep the waker', outs: ['task scheduled'],
  intro: 'wake() does the same but consumes the waker.',
  steps: [['Call it on a borrowed waker.', 0], ['The task will be polled again.', [], 'o0']],
  result: 'ok', resultCap: 'With Waker::noop nothing happens, which is fine for tests.',
}, 'std::task::Waker::noop().wake_by_ref(); String::from("ok")');

add('waker/will_wake', 'will_wake', WAKER('Waker'), 'How Waker::will_wake works', 'true if two wakers would certainly wake the same task; false means "not sure".', {
  rows: [['w vs w', 'w vs a clone of noop']], call: 'w.will_wake(&other)', note: 'a cheap, conservative check', outs: ['true', 'false'],
  intro: 'It compares the waker internals; equal internals prove the same task.',
  steps: [['The same waker: true.', 0, 'o0'], ['A clone of Waker::noop() is not recognised: false, even though both do nothing.', 1, 'o1']],
  result: 'true, false', resultCap: 'Futures use it to skip replacing a stored waker; false only means "store the new one".',
}, 'let w = std::task::Waker::noop(); let c = w.clone(); format!("{}, {}", w.will_wake(w), w.will_wake(&c))');

add('future/ready', 'ready', ['core', '', /future\/ready\.rs$/], 'How future::ready works', 'A future that is immediately ready with a value.', {
  rows: [['ready(5)']], call: 'std::future::ready(5).await', note: 'no waiting', outs: ['5'],
  intro: 'Handy where an API wants a future but the value is already known.',
  steps: [['The first poll...', 0], ['...returns Ready(5).', [], 'o0']],
  result: 'Ready(5)', resultCap: 'into_inner takes the value without awaiting.',
}, POLL1 + 'let mut f = std::pin::pin!(std::future::ready(5)); d(std::future::Future::poll(f.as_mut(), &mut cx))');

add('ready_future/into_inner', 'into_inner', ['core', 'Ready', /future\/ready\.rs$/], 'How Ready::into_inner works', 'Takes the value out of a ready future without polling it.', {
  rows: [['ready("v")']], call: 'std::future::ready("v").into_inner()', note: 'no async needed', outs: ['"v"'],
  intro: 'Useful in synchronous code.',
  steps: [['The value is stored inside.', 0], ['into_inner returns it.', [], 'o0']],
  result: '"v"', resultCap: 'Panics if the future was already polled to completion.',
}, 'd(std::future::ready("v").into_inner())');

add('future/pending', 'pending', ['core', '', /future\/pending\.rs$/], 'How future::pending works', 'A future that never completes.', {
  rows: [['pending()']], call: 'std::future::pending::<()>().await', note: 'waits forever', outs: ['always Pending'],
  intro: 'Useful as a placeholder or in select! loops.',
  steps: [['Poll it.', 0], ['Pending, every time.', [], 'o0']],
  result: 'Pending', resultCap: 'Awaiting it suspends the task forever.',
}, POLL1 + 'let mut f = std::pin::pin!(std::future::pending::<()>()); d(std::future::Future::poll(f.as_mut(), &mut cx))');

add('future/poll_fn', 'poll_fn', ['core', '', /future\/poll_fn\.rs$/], 'How future::poll_fn works', 'Turns a closure into a future; the closure is the poll function.', {
  rows: [['counter closure']], call: 'poll_fn(|cx| if done { Ready(x) } else { Pending })', note: 'hand-written futures', outs: ['Pending, Ready(3)'],
  intro: 'No struct or impl Future needed.',
  steps: [['The first poll is Pending.', 0], ['The second is Ready(3).', [], 'o0']],
  result: 'Pending, Ready(3)', resultCap: 'Remember to wake the waker before returning Pending.',
}, POLL1 + 'let mut n = 0; let mut f = std::pin::pin!(std::future::poll_fn(move |cx: &mut Context<\'_>| { n += 1; if n < 2 { cx.waker().wake_by_ref(); Poll::Pending } else { Poll::Ready(3) } })); let a = std::future::Future::poll(f.as_mut(), &mut cx); let b = std::future::Future::poll(f.as_mut(), &mut cx); format!("{:?}, {:?}", a, b)');

module.exports = list;
