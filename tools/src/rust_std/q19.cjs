// Rust standard library: formatting builders and Formatter flags, panic details (Location, hooks, payloads), and
// runtime type checks (TypeId, Any, Error).
const { group } = require('./kit.cjs');
const B = (o) => ['core', o, /fmt\/builders\.rs$/];
const F = ['core', 'Formatter', /fmt\/mod\.rs$/];
const LOC = ['core', 'Location', /panic\/location\.rs$/];
const { list, add } = group({ at: B('DebugList') });
const FMT = 'use std::fmt; ';
const quiet = (body) => `std::panic::set_hook(Box::new(|_| {})); let __r = { ${body} }; let _ = std::panic::take_hook(); __r`;

// ---------------------------------------------------------------- Debug builders

add('debug_list/entry', 'entry', null, 'How DebugList::entry works', 'Adds one item to a debug_list output.', {
  rows: [['1', '2']], call: 'f.debug_list().entry(&1).entry(&2).finish()', note: 'one at a time', outs: ['[1, 2]'],
  intro: 'Each call appends an element.',
  steps: [['Add 1, then 2.', [0, 1]], ['finish closes the brackets.', [], 'o0']],
  result: '[1, 2]', resultCap: 'entries adds a whole iterator.',
}, FMT + 'struct L; impl fmt::Debug for L { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_list().entry(&1).entry(&2).finish() } } format!("{:?}", L)');

add('debug_list/entries', 'entries', null, 'How DebugList::entries works', 'Adds every item of an iterator to a debug_list output.', {
  rows: [['1..=3']], call: 'f.debug_list().entries(1..=3).finish()', note: 'bulk add', outs: ['[1, 2, 3]'],
  intro: 'Perfect for custom collections.',
  steps: [['Each item is added.', 0], ['[1, 2, 3].', [], 'o0']],
  result: '[1, 2, 3]', resultCap: 'Items must implement Debug.',
}, FMT + 'struct L; impl fmt::Debug for L { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_list().entries(1..=3).finish() } } format!("{:?}", L)');

add('debug_list/finish', 'finish', null, 'How DebugList::finish works', 'Closes the list and returns the result.', {
  rows: [['empty list']], call: 'f.debug_list().finish()', note: 'always call it', outs: ['[]'],
  intro: 'Without finish, nothing is written.',
  steps: [['No entries.', 0], ['[].', [], 'o0']],
  result: '[]', resultCap: 'Returns fmt::Result for the ? operator.',
}, FMT + 'struct L; impl fmt::Debug for L { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_list().finish() } } format!("{:?}", L)');

add('debug_list/finish_non_exhaustive', 'finish_non_exhaustive', null, 'How DebugList::finish_non_exhaustive works', 'Closes the list with .. to show more items exist.', {
  rows: [['first 2 of many']], call: 'f.debug_list().entries(first_two).finish_non_exhaustive()', note: 'truncated output', outs: ['[1, 2, ..]'],
  intro: 'Handy for huge collections.',
  steps: [['Show a few items.', 0], ['.. marks the rest.', [], 'o0']],
  result: '[1, 2, ..]', resultCap: 'Keeps debug output short.',
}, FMT + 'struct L; impl fmt::Debug for L { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_list().entries([1, 2]).finish_non_exhaustive() } } format!("{:?}", L)');

add('debug_map/entry', 'entry', B('DebugMap'), 'How DebugMap::entry works', 'Adds one key: value pair to a debug_map output.', {
  rows: [['"a" → 1']], call: 'f.debug_map().entry(&"a", &1).finish()', note: 'one pair', outs: ['{"a": 1}'],
  intro: 'Keys and values are formatted with Debug.',
  steps: [['Add the pair.', 0], ['{"a": 1}.', [], 'o0']],
  result: '{"a": 1}', resultCap: 'key and value can also be added separately.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().entry(&"a", &1).finish() } } format!("{:?}", M)');

add('debug_map/entries', 'entries', B('DebugMap'), 'How DebugMap::entries works', 'Adds every (key, value) pair of an iterator.', {
  rows: [['[("x", 1), ("y", 2)]']], call: 'f.debug_map().entries(pairs).finish()', note: 'bulk add', outs: ['{"x": 1, "y": 2}'],
  intro: 'Prints like a map.',
  steps: [['Each pair is added.', 0], ['Wrapped in braces.', [], 'o0']],
  result: '{"x": 1, "y": 2}', resultCap: 'Order follows the iterator.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().entries([("x", 1), ("y", 2)]).finish() } } format!("{:?}", M)');

add('debug_map/key', 'key', B('DebugMap'), 'How DebugMap::key works', 'Adds just the key of the next entry; value() must follow.', {
  rows: [['key "k"', 'value 9']], call: 'f.debug_map().key(&"k").value(&9).finish()', note: 'two steps', outs: ['{"k": 9}'],
  intro: 'Useful when the value is computed after the key.',
  steps: [['The key is written.', 0], ['Then its value.', 1, 'o0']],
  result: '{"k": 9}', resultCap: 'Calling key twice in a row panics.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().key(&"k").value(&9).finish() } } format!("{:?}", M)');

add('debug_map/value', 'value', B('DebugMap'), 'How DebugMap::value works', 'Adds the value for the key written just before.', {
  rows: [['after key(&1)']], call: '.value(&"one")', note: 'completes the entry', outs: ['{1: "one"}'],
  intro: 'Must follow key().',
  steps: [['The key was 1.', 0], ['Its value is "one".', [], 'o0']],
  result: '{1: "one"}', resultCap: 'entry() does both at once.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().key(&1).value(&"one").finish() } } format!("{:?}", M)');

add('debug_map/finish', 'finish', B('DebugMap'), 'How DebugMap::finish works', 'Closes the map output.', {
  rows: [['no entries']], call: 'f.debug_map().finish()', note: 'always call it', outs: ['{}'],
  intro: 'Panics if a key was written without its value.',
  steps: [['No entries.', 0], ['{}.', [], 'o0']],
  result: '{}', resultCap: 'Returns fmt::Result.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().finish() } } format!("{:?}", M)');

add('debug_map/finish_non_exhaustive', 'finish_non_exhaustive', B('DebugMap'), 'How DebugMap::finish_non_exhaustive works', 'Closes the map with .. for hidden entries.', {
  rows: [['one shown, more hidden']], call: '.entry(&"a", &1).finish_non_exhaustive()', note: 'truncated', outs: ['{"a": 1, ..}'],
  intro: 'Signals that the output is incomplete.',
  steps: [['Show one entry.', 0], ['Add ..', [], 'o0']],
  result: '{"a": 1, ..}', resultCap: 'Same idea as for structs and lists.',
}, FMT + 'struct M; impl fmt::Debug for M { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_map().entry(&"a", &1).finish_non_exhaustive() } } format!("{:?}", M)');

add('formatter/debug_set', 'debug_set', F, 'How Formatter::debug_set works', 'Builds Debug output in the {a, b} style.', {
  rows: [['custom set of 1, 2']], call: 'f.debug_set().entries(self.items.iter()).finish()', note: 'for set-like types', outs: ['{1, 2}'],
  intro: 'Prints like a HashSet.',
  steps: [['Add each item.', 0], ['Wrapped in braces.', [], 'o0']],
  result: '{1, 2}', resultCap: 'debug_list uses [ ] instead.',
}, FMT + 'struct S; impl fmt::Debug for S { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_set().entries([1, 2]).finish() } } format!("{:?}", S)');

add('debug_set/entry', 'entry', B('DebugSet'), 'How DebugSet::entry works', 'Adds one item to a debug_set output.', {
  rows: [['"x"']], call: 'f.debug_set().entry(&"x").finish()', note: 'one at a time', outs: ['{"x"}'],
  intro: 'Like DebugList::entry, with braces.',
  steps: [['Add "x".', 0], ['{"x"}.', [], 'o0']],
  result: '{"x"}', resultCap: 'entries adds many at once.',
}, FMT + 'struct S; impl fmt::Debug for S { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_set().entry(&"x").finish() } } format!("{:?}", S)');

add('debug_set/entries', 'entries', B('DebugSet'), 'How DebugSet::entries works', 'Adds every item of an iterator to a debug_set output.', {
  rows: [['["a", "b"]']], call: 'f.debug_set().entries(items).finish()', note: 'bulk add', outs: ['{"a", "b"}'],
  intro: 'Order follows the iterator.',
  steps: [['Each item is added.', 0], ['{"a", "b"}.', [], 'o0']],
  result: '{"a", "b"}', resultCap: 'Sort first for stable output.',
}, FMT + 'struct S; impl fmt::Debug for S { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_set().entries(["a", "b"]).finish() } } format!("{:?}", S)');

add('debug_set/finish', 'finish', B('DebugSet'), 'How DebugSet::finish works', 'Closes the set output.', {
  rows: [['empty']], call: 'f.debug_set().finish()', note: 'always call it', outs: ['{}'],
  intro: 'Writes the closing brace.',
  steps: [['No items.', 0], ['{}.', [], 'o0']],
  result: '{}', resultCap: 'Returns fmt::Result.',
}, FMT + 'struct S; impl fmt::Debug for S { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_set().finish() } } format!("{:?}", S)');

add('debug_set/finish_non_exhaustive', 'finish_non_exhaustive', B('DebugSet'), 'How DebugSet::finish_non_exhaustive works', 'Closes the set with .. for hidden items.', {
  rows: [['some shown']], call: '.entry(&1).finish_non_exhaustive()', note: 'truncated', outs: ['{1, ..}'],
  intro: 'Signals there is more.',
  steps: [['Show 1.', 0], ['Add ..', [], 'o0']],
  result: '{1, ..}', resultCap: 'Keeps logs readable.',
}, FMT + 'struct S; impl fmt::Debug for S { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_set().entry(&1).finish_non_exhaustive() } } format!("{:?}", S)');

add('debug_struct/finish', 'finish', B('DebugStruct'), 'How DebugStruct::finish works', 'Closes the Name { .. } output.', {
  rows: [['no fields']], call: 'f.debug_struct("Unit").finish()', note: 'always call it', outs: ['Unit'],
  intro: 'With no fields, only the name is printed.',
  steps: [['The name "Unit".', 0], ['No braces needed.', [], 'o0']],
  result: 'Unit', resultCap: 'Returns fmt::Result.',
}, FMT + 'struct U; impl fmt::Debug for U { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_struct("Unit").finish() } } format!("{:?}", U)');

add('debug_tuple/field', 'field', B('DebugTuple'), 'How DebugTuple::field works', 'Adds one value to a Name(a, b) output.', {
  rows: [['1', '"x"']], call: 'f.debug_tuple("Pair").field(&1).field(&"x").finish()', note: 'positional fields', outs: ['Pair(1, "x")'],
  intro: 'Each call adds the next value.',
  steps: [['Add 1, then "x".', [0, 1]], ['Pair(1, "x").', [], 'o0']],
  result: 'Pair(1, "x")', resultCap: 'For tuple structs and enum variants.',
}, FMT + 'struct P; impl fmt::Debug for P { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_tuple("Pair").field(&1).field(&"x").finish() } } format!("{:?}", P)');

add('debug_tuple/finish', 'finish', B('DebugTuple'), 'How DebugTuple::finish works', 'Closes the Name(..) output.', {
  rows: [['Id(7)']], call: 'f.debug_tuple("Id").field(&7).finish()', note: 'always call it', outs: ['Id(7)'],
  intro: 'Writes the closing parenthesis.',
  steps: [['Name and field.', 0], ['Closed.', [], 'o0']],
  result: 'Id(7)', resultCap: 'With no fields it prints only the name.',
}, FMT + 'struct I; impl fmt::Debug for I { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_tuple("Id").field(&7).finish() } } format!("{:?}", I)');

add('debug_tuple/finish_non_exhaustive', 'finish_non_exhaustive', B('DebugTuple'), 'How DebugTuple::finish_non_exhaustive works', 'Closes the tuple output with .. for hidden fields.', {
  rows: [['Key(public, secret)']], call: 'f.debug_tuple("Key").field(&id).finish_non_exhaustive()', note: 'hide secrets', outs: ['Key(1, ..)'],
  intro: 'Shows that more fields exist.',
  steps: [['Show the id only.', 0], ['Add ..', [], 'o0']],
  result: 'Key(1, ..)', resultCap: 'Good for types holding keys or tokens.',
}, FMT + 'struct K; impl fmt::Debug for K { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.debug_tuple("Key").field(&1).finish_non_exhaustive() } } format!("{:?}", K)');

// ---------------------------------------------------------------- Formatter flags and fmt functions

add('formatter/fill', 'fill', F, 'How Formatter::fill works', 'The padding character the caller asked for ({:*>5}).', {
  rows: [['"{:*>5}"', '"{:>5}"']], call: 'f.fill()', note: 'default is a space', outs: ["'*'", "' '"],
  intro: 'Read it to pad your own output the same way.',
  steps: [['With *: \'*\'.', 0, 'o0'], ['Without: a space.', 1, 'o1']],
  result: "'*', ' '", resultCap: 'pad() applies fill and width for you.',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{:?}", f.fill()) } } format!("{}, {}", format!("{:*>5}", X), format!("{:>5}", X))');

add('formatter/align', 'align', F, 'How Formatter::align works', 'The alignment the caller asked for: Left, Right or Center.', {
  rows: [['"{:<5}"', '"{:^5}"', '"{}"']], call: 'f.align()', note: 'Option<Alignment>', outs: ['Some(Left)', 'Some(Center)', 'None'],
  intro: 'None when no alignment was given.',
  steps: [['< → Left, ^ → Center.', [0, 1], 'o0,1'], ['Nothing → None.', 2, 'o2']],
  result: 'Some(Left), Some(Center), None', resultCap: 'pad() respects it automatically.',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{:?}", f.align()) } } format!("{}, {}, {}", format!("{:<5}", X), format!("{:^5}", X), format!("{}", X))');

add('formatter/sign_plus', 'sign_plus', F, 'How Formatter::sign_plus works', 'true if the caller used + ({:+}).', {
  rows: [['"{:+}"', '"{}"']], call: 'f.sign_plus()', note: 'always show the sign', outs: ['true', 'false'],
  intro: 'Numbers then show + for positive values.',
  steps: [['{:+}: true.', 0, 'o0'], ['{}: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'format!("{:+}", 5) gives "+5".',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}", f.sign_plus()) } } format!("{}, {}", format!("{:+}", X), format!("{}", X))');

add('formatter/sign_minus', 'sign_minus', F, 'How Formatter::sign_minus works', 'true if the caller used the - flag ({:-}).', {
  rows: [['"{:-}"', '"{}"']], call: 'f.sign_minus()', note: 'rarely used', outs: ['true', 'false'],
  intro: 'The - flag is accepted but std types ignore it.',
  steps: [['{:-}: true.', 0, 'o0'], ['{}: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Your own types may give it a meaning.',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}", f.sign_minus()) } } format!("{}, {}", format!("{:-}", X), format!("{}", X))');

add('formatter/sign_aware_zero_pad', 'sign_aware_zero_pad', F, 'How Formatter::sign_aware_zero_pad works', 'true if the caller used 0 padding ({:05}).', {
  rows: [['"{:05}"', '"{:5}"']], call: 'f.sign_aware_zero_pad()', note: 'zeros after the sign', outs: ['true', 'false'],
  intro: 'format!("{:05}", -3) gives "-0003".',
  steps: [['{:05}: true.', 0, 'o0'], ['{:5}: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'pad_integral handles it for numbers.',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}", f.sign_aware_zero_pad()) } } format!("{}, {}", format!("{:05}", X), format!("{:5}", X))');

add('formatter/pad_integral', 'pad_integral', F, 'How Formatter::pad_integral works', 'Writes number digits with sign, prefix, width and zero-padding handled.', {
  rows: [['"{:+06}" of 42']], call: 'f.pad_integral(true, "", "42")', note: 'for custom number types', outs: ['"+00042"'],
  intro: 'You pass sign, prefix and digits; it applies all the flags.',
  steps: [['Digits "42", positive.', 0], ['With + and zero padding: "+00042".', [], 'o0']],
  result: '"+00042"', resultCap: 'Used by big-number crates to format like built-in ints.',
}, FMT + 'struct N; impl fmt::Display for N { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.pad_integral(true, "", "42") } } d(format!("{:+06}", N))');

add('formatter/write_fmt', 'write_fmt', F, 'How Formatter::write_fmt works', 'What write!(f, ...) calls: writes formatted text into the Formatter.', {
  rows: [['write!(f, "{}-{}", 1, 2)']], call: 'f.write_fmt(format_args!("{}-{}", 1, 2))', note: 'behind write!', outs: ['"1-2"'],
  intro: 'You normally use the write! macro.',
  steps: [['format_args! prepares the text.', 0], ['It is written into f.', [], 'o0']],
  result: '"1-2"', resultCap: 'Works for any type implementing fmt::Write too.',
}, FMT + 'struct X; impl fmt::Display for X { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.write_fmt(format_args!("{}-{}", 1, 2)) } } d(format!("{}", X))');

add('fmt/write', 'write', ['core', '', /fmt\/mod\.rs$/], 'How fmt::write works', 'Writes formatted text into any fmt::Write target.', {
  rows: [['String target']], call: 'fmt::write(&mut s, format_args!("{}+{}", 2, 3))?', note: 'the engine behind write!', outs: ['"2+3"'],
  intro: 'String implements fmt::Write.',
  steps: [['Prepare the arguments.', 0], ['Write them into s.', [], 'o0']],
  result: '"2+3"', resultCap: 'write!(s, ...) is the friendly form.',
}, 'let mut s = String::new(); std::fmt::write(&mut s, format_args!("{}+{}", 2, 3)).unwrap(); d(s)');

add('fmt/format', 'format', ['alloc', '', /^src\/fmt\.rs$/], 'How fmt::format works', 'Turns prepared format arguments into a String; what format! uses.', {
  rows: [['format_args!("x={}", 5)']], call: 'std::fmt::format(format_args!("x={}", 5))', note: 'behind format!', outs: ['"x=5"'],
  intro: 'You normally write format!("x={}", 5).',
  steps: [['Arguments are prepared.', 0], ['A new String is built.', [], 'o0']],
  result: '"x=5"', resultCap: 'format_args! avoids allocation until needed.',
}, 'd(std::fmt::format(format_args!("x={}", 5)))');

add('arguments/as_str', 'as_str', ['core', 'Arguments', /fmt\/mod\.rs$/], 'How fmt::Arguments::as_str works', 'The text as a &str, if it has no {} placeholders to fill.', {
  rows: [['format_args!("plain")', 'format_args!("{}", 1)']], call: 'args.as_str()', note: 'avoid formatting work', outs: ['Some("plain")', 'None'],
  intro: 'Loggers use it to skip formatting for constant messages.',
  steps: [['No placeholders: Some.', 0, 'o0'], ['With a placeholder: None.', 1, 'o1']],
  result: 'Some("plain"), None', resultCap: 'It may also return None for plain text in some cases.',
}, 'let a = format_args!("plain").as_str(); let x = 1; let b = format_args!("{}", x).as_str(); format!("{:?}, {:?}", a, b)');

// ---------------------------------------------------------------- panics

add('location/caller', 'caller', LOC, 'How panic::Location::caller works', 'The source location of the code that called this function.', {
  rows: [['#[track_caller] fn here()']], call: 'Location::caller()', note: 'file:line:column', outs: ['the call site'],
  intro: 'With #[track_caller], it reports where your function was called from.',
  steps: [['The function is marked #[track_caller].', 0], ['Location::caller() gives the caller\'s line.', [], 'o0']],
  result: 'line > 0: true', resultCap: 'unwrap() uses this to report the line of the unwrap.',
}, '#[track_caller] fn here() -> u32 { std::panic::Location::caller().line() } format!("line > 0: {}", here() > 0)');

add('location/file', 'file', LOC, 'How Location::file works', 'The source file of a location.', {
  rows: [['Location::caller()']], call: 'loc.file()', note: 'path of the .rs file', outs: ['"src/main.rs"'],
  intro: 'Paths are as the compiler saw them.',
  steps: [['Get a location.', 0], ['Its file.', [], 'o0']],
  result: 'ends with .rs: true', resultCap: 'Shown in panic messages.',
}, 'format!("ends with .rs: {}", std::panic::Location::caller().file().ends_with(".rs"))');

add('location/line', 'line', LOC, 'How Location::line works', 'The line number of a location.', {
  rows: [['Location::caller()']], call: 'loc.line()', note: 'starts at 1', outs: ['a line number'],
  intro: 'Lines are counted from 1.',
  steps: [['Get a location.', 0], ['Its line.', [], 'o0']],
  result: 'positive: true', resultCap: 'column() gives the position in the line.',
}, 'format!("positive: {}", std::panic::Location::caller().line() >= 1)');

add('location/column', 'column', LOC, 'How Location::column works', 'The column of a location within its line.', {
  rows: [['Location::caller()']], call: 'loc.column()', note: 'starts at 1', outs: ['a column number'],
  intro: 'Counted in characters from 1.',
  steps: [['Get a location.', 0], ['Its column.', [], 'o0']],
  result: 'positive: true', resultCap: 'Together: file:line:column.',
}, 'format!("positive: {}", std::panic::Location::caller().column() >= 1)');

add('panic/set_hook', 'set_hook', ['std', '', /^src\/panicking\.rs$/], 'How panic::set_hook works', 'Replaces what happens when a panic occurs (normally printing a message).', {
  rows: [['custom hook']], call: 'panic::set_hook(Box::new(|info| log(info)));', note: 'global', outs: ['your code runs on panic'],
  intro: 'The hook runs before unwinding starts.',
  steps: [['Install the hook.', 0], ['A panic calls it.', [], 'o0']],
  result: 'hook ran: true', resultCap: 'take_hook restores the default.',
}, 'let ran = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)); let r2 = ran.clone(); std::panic::set_hook(Box::new(move |_| r2.store(true, std::sync::atomic::Ordering::SeqCst))); let _ = std::panic::catch_unwind(|| panic!("x")); let _ = std::panic::take_hook(); format!("hook ran: {}", ran.load(std::sync::atomic::Ordering::SeqCst))');

add('panic/take_hook', 'take_hook', ['std', '', /^src\/panicking\.rs$/], 'How panic::take_hook works', 'Removes the current panic hook and gives it back, restoring the default.', {
  rows: [['custom hook installed']], call: 'let old = panic::take_hook();', note: 'restore default', outs: ['default hook active'],
  intro: 'Often used to wrap the default: take it, then call it from your own hook.',
  steps: [['Take the current hook.', 0], ['The default is back.', [], 'o0']],
  result: 'restored', resultCap: 'Keep the returned hook to chain to it.',
}, 'std::panic::set_hook(Box::new(|_| {})); let _old = std::panic::take_hook(); String::from("restored")');

add('panic/panic_any', 'panic_any', ['std', '', /^src\/panic\.rs$/], 'How panic::panic_any works', 'Panics with any value as the payload, not just a message.', {
  rows: [['payload 42u32']], call: 'std::panic::panic_any(42u32)', note: 'typed payload', outs: ['catch_unwind gets 42'],
  intro: 'The catcher can downcast the payload back.',
  steps: [['Panic with 42.', 0], ['The payload downcasts to u32.', [], 'o0']],
  result: 'Some(42)', resultCap: 'Rarely needed; prefer Result.',
}, quiet('let e = std::panic::catch_unwind(|| std::panic::panic_any(42u32)).unwrap_err(); format!("{:?}", e.downcast_ref::<u32>())'));

add('panic/resume_unwind', 'resume_unwind', ['std', '', /^src\/panic\.rs$/], 'How panic::resume_unwind works', 'Restarts a caught panic without calling the panic hook again.', {
  rows: [['caught payload']], call: 'panic::resume_unwind(payload)', note: 'rethrow', outs: ['outer catch gets it'],
  intro: 'Used to pass a panic through after cleaning up.',
  steps: [['Inner catch_unwind catches.', 0], ['resume_unwind sends it on.', [], 'o0']],
  result: 'Some("boom")', resultCap: 'Pairs with catch_unwind.',
}, quiet('let e = std::panic::catch_unwind(|| { let p = std::panic::catch_unwind(|| panic!("boom")).unwrap_err(); std::panic::resume_unwind(p) }).unwrap_err(); format!("{:?}", e.downcast_ref::<&str>())'));

// ---------------------------------------------------------------- Any, TypeId, Error

add('type_id/of', 'of', ['core', 'TypeId', /^src\/any\.rs$/], 'How TypeId::of works', 'A unique identifier for a type.', {
  rows: [['i32', 'i64']], call: 'TypeId::of::<i32>() == TypeId::of::<i64>()', note: 'compare types at run time', outs: ['false'],
  intro: 'Two TypeIds are equal only for the same type.',
  steps: [['Get both ids.', [0, 1]], ['Different types: false.', [], 'o0']],
  result: 'false, true', resultCap: 'Any uses this to implement downcasting.',
}, 'use std::any::TypeId; format!("{}, {}", TypeId::of::<i32>() == TypeId::of::<i64>(), TypeId::of::<i32>() == TypeId::of::<i32>())');

add('any/is', 'is', ['core', 'dyn', /^src\/any\.rs$/], 'How Any::is works', 'true if a &dyn Any holds the given type.', {
  rows: [['dyn Any holding "x"']], call: 'v.is::<&str>()', note: 'type check', outs: ['true'],
  intro: 'Like downcast_ref(..).is_some().',
  steps: [['Check the stored type.', 0], ['&str: true.', [], 'o0']],
  result: 'true, false', resultCap: 'Asking for i32 gives false.',
}, 'let v: &dyn std::any::Any = &"x"; format!("{}, {}", v.is::<&str>(), v.is::<i32>())');

add('any/downcast_mut', 'downcast_mut', ['core', 'dyn', /^src\/any\.rs$/], 'How Any::downcast_mut works', 'A mutable reference to the concrete value inside a &mut dyn Any.', {
  rows: [['dyn Any holding 1']], call: 'if let Some(n) = v.downcast_mut::<i32>() { *n += 1; }', note: 'edit through Any', outs: ['2'],
  intro: 'None if the type does not match.',
  steps: [['It is an i32.', 0], ['It becomes 2.', [], 'o0']],
  result: '2', resultCap: 'downcast_ref is the read-only version.',
}, 'let mut x = 1i32; { let v: &mut dyn std::any::Any = &mut x; if let Some(n) = v.downcast_mut::<i32>() { *n += 1; } } x.to_string()');

add('error/downcast_ref', 'downcast_ref', ['core', 'dyn', /^src\/error\.rs$/], 'How dyn Error::downcast_ref works', 'Checks whether a &dyn Error is a specific error type.', {
  rows: [['Box<dyn Error> from ParseIntError']], call: 'err.downcast_ref::<ParseIntError>()', note: 'recover the type', outs: ['Some(..)'],
  intro: 'Lets you handle one kind of error specially.',
  steps: [['The boxed error is a ParseIntError.', 0], ['Some(&ParseIntError).', [], 'o0']],
  result: 'Some(InvalidDigit)', resultCap: 'Common with Box<dyn Error> return types.',
}, 'let e: Box<dyn std::error::Error> = Box::new("x".parse::<i32>().unwrap_err()); format!("{:?}", e.downcast_ref::<std::num::ParseIntError>().map(|p| p.kind().clone()))');

add('error/is', 'is', ['core', 'dyn', /^src\/error\.rs$/], 'How dyn Error::is works', 'true if the error is of a given type.', {
  rows: [['ParseFloatError boxed']], call: 'err.is::<ParseFloatError>()', note: 'type check', outs: ['true'],
  intro: 'A quick test before downcasting.',
  steps: [['Check the type.', 0], ['true.', [], 'o0']],
  result: 'true, false', resultCap: 'Asking for ParseIntError gives false.',
}, 'let e: Box<dyn std::error::Error> = Box::new("x".parse::<f64>().unwrap_err()); format!("{}, {}", e.is::<std::num::ParseFloatError>(), e.is::<std::num::ParseIntError>())');

add('error/source', 'source', ['core', 'Error', /^src\/error\.rs$/], 'How Error::source works', 'The underlying error that caused this one, if any.', {
  rows: [['ConfigError caused by ParseIntError']], call: 'err.source()', note: 'error chains', outs: ['Some(ParseIntError)'],
  intro: 'Walk the chain to show the full cause of a failure.',
  steps: [['The outer error.', 0], ['source() returns the inner one.', [], 'o0']],
  result: 'invalid digit found in string', resultCap: 'The default implementation returns None.',
}, 'use std::error::Error; #[derive(Debug)] struct Cfg(std::num::ParseIntError); impl std::fmt::Display for Cfg { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.write_str("bad config") } } impl Error for Cfg { fn source(&self) -> Option<&(dyn Error + \'static)> { Some(&self.0) } } let e = Cfg("x".parse::<i32>().unwrap_err()); e.source().unwrap().to_string()');

add('error/downcast_mut', 'downcast_mut', ['core', 'dyn', /^src\/error\.rs$/], 'How dyn Error::downcast_mut works', 'A mutable reference to a specific error type inside a &mut dyn Error.', {
  rows: [['boxed custom error']], call: 'err.downcast_mut::<MyErr>()', note: 'edit the error', outs: ['Some(&mut MyErr)'],
  intro: 'Lets you add context to an error before passing it on.',
  steps: [['The type matches.', 0], ['Some(&mut ..).', [], 'o0']],
  result: 'true', resultCap: 'None if it is a different type.',
}, '#[derive(Debug)] struct MyErr; impl std::fmt::Display for MyErr { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.write_str("e") } } impl std::error::Error for MyErr {} let mut e: Box<dyn std::error::Error> = Box::new(MyErr); e.downcast_mut::<MyErr>().is_some().to_string()');

module.exports = list;
