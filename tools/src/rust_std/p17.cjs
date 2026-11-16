// Rust standard library: environment and processes, any/type names, NonZero, Cow, panic/hint/ptr/convert helpers,
// and the fmt::Formatter toolkit for writing your own Display and Debug implementations.
const { group } = require('./kit.cjs');
const ENV = ['std', '', /^src\/env\.rs$/];
const CMD = ['std', 'Command', /^src\/process\.rs$/];
const ANY = ['core', '', /^src\/any\.rs$/];
const FMT = ['core', 'Formatter', /fmt\/mod\.rs$/];
const { list, add } = group({ at: ENV });
const POINT = 'struct P { x: i32, y: i32 } ';

// ---------------------------------------------------------------- env, process

add('env/var', 'var', null, 'How env::var works', 'Reads an environment variable as a String.', {
  rows: [['set: APP_MODE=dev', 'not set']], call: 'env::var("APP_MODE")', note: 'configuration from outside', outs: ['Ok("dev")', 'Err(NotPresent)'],
  intro: 'Environment variables are key/value settings given to a program when it starts.',
  steps: [['A variable that exists: Ok with its value.', 0, 'o0'], ['A missing one: Err(NotPresent).', 1, 'o1']],
  result: 'Err(NotPresent)', resultCap: 'Typical: env::var("PORT").unwrap_or_else(|_| "8080".into()).',
}, 'd(std::env::var("PONDER_TRUTH_SURELY_NOT_SET"))');

add('env/var_os', 'var_os', null, 'How env::var_os works', 'Reads an environment variable as an OsString; None if it is missing.', {
  rows: [['not set']], call: 'env::var_os("EDITOR")', note: 'no Unicode check', outs: ['None'],
  intro: 'Unlike var, it never fails because of non-Unicode contents.',
  steps: [['The variable is not set.', 0], ['None.', [], 'o0']],
  result: 'None', resultCap: 'Use it for paths, which may not be valid Unicode.',
}, 'd(std::env::var_os("PONDER_TRUTH_SURELY_NOT_SET"))');

add('env/args', 'args', null, 'How env::args works', 'The command-line arguments; the first one is the program itself.', {
  rows: [['myprog', 'input.txt', '-v']], call: 'let args: Vec<String> = env::args().collect();', note: 'cargo run -- input.txt -v', outs: ['args[0] = program', 'args[1] = "input.txt"', 'args[2] = "-v"'],
  intro: 'Skip the first item to get only the user\'s arguments: env::args().skip(1).',
  steps: [['args[0] is the program path.', 0, 'o0'], ['The rest are what the user typed.', [1, 2], 'o1,2']],
  result: 'at least 1: true', resultCap: 'For real option parsing, the clap crate is the usual choice.',
}, 'format!("at least 1: {}", std::env::args().count() >= 1)');

add('env/current_dir', 'current_dir', null, 'How env::current_dir works', 'The folder the program is running in.', {
  rows: [['cd /projects/app; cargo run']], call: 'env::current_dir()?', note: 'relative paths start here', outs: ['Ok("/projects/app")'],
  intro: 'Relative file paths are resolved against this folder.',
  steps: [['The OS knows the working directory.', 0], ['current_dir returns it.', [], 'o0']],
  result: 'absolute: true', resultCap: 'It is where you ran the program, not where the executable lives.',
}, 'format!("absolute: {}", std::env::current_dir().unwrap().is_absolute())');

add('env/temp_dir', 'temp_dir', null, 'How env::temp_dir works', 'The folder for temporary files.', {
  rows: [['Linux', 'Windows']], call: 'env::temp_dir().join("cache.bin")', note: 'a scratch area', outs: ['/tmp', 'C:\\Users\\…\\Temp'],
  intro: 'The location depends on the OS and settings.',
  steps: [['Linux and macOS: usually /tmp.', 0, 'o0'], ['Windows: the user\'s Temp folder.', 1, 'o1']],
  result: 'absolute: true', resultCap: 'Pick unique names; other programs share this folder.',
}, 'format!("absolute: {}", std::env::temp_dir().is_absolute())');

add('command/new', 'new', CMD, 'How Command::new works', 'Prepares to run another program.', {
  rows: [['"rustc"']], call: 'let out = Command::new("rustc").arg("--version").output()?;', note: 'run a program', outs: ['out.stdout = "rustc 1.x.y ..."'],
  intro: 'Nothing runs until you call output(), status() or spawn().',
  steps: [['The program and its arguments are set up.', 0], ['output() runs it and collects what it printed.', [], 'o0']],
  result: 'starts with "rustc ": true', resultCap: 'The program is found through PATH, like in a terminal.',
}, 'let out = std::process::Command::new("rustc").arg("--version").output().unwrap(); format!("starts with \\"rustc \\": {}", String::from_utf8_lossy(&out.stdout).starts_with("rustc "))');

add('command/arg', 'arg', CMD, 'How Command::arg works', 'Adds one argument to the command.', {
  rows: [['"git"'], ['"log"', '"-n"', '"1"']], call: 'Command::new("git").arg("log").arg("-n").arg("1")', note: 'one arg per call', outs: ['git log -n 1'],
  intro: 'Each argument is passed as-is: no shell, so spaces and quotes need no escaping.',
  steps: [['The program is git.', 'a0'], ['Three arguments are added.', ['b0', 'b1', 'b2'], 'o0']],
  result: '["log", "-n", "1"]', resultCap: 'args([..]) adds several at once.',
}, 'let mut c = std::process::Command::new("git"); c.arg("log").arg("-n").arg("1"); d(c.get_args().map(|a| a.to_string_lossy().into_owned()).collect::<Vec<_>>())');

add('command/output', 'output', CMD, 'How Command::output works', 'Runs the program, waits for it, and collects its output.', {
  rows: [['rustc --version']], call: 'let out = cmd.output()?;', note: 'status, stdout, stderr', outs: ['status: success', 'stdout: bytes'],
  intro: 'stdout and stderr come back as Vec<u8>.',
  steps: [['The program runs to the end.', 0, 'o0'], ['Its output is captured.', 0, 'o1']],
  result: 'success: true', resultCap: 'String::from_utf8_lossy(&out.stdout) turns the bytes into text.',
}, 'let out = std::process::Command::new("rustc").arg("--version").output().unwrap(); format!("success: {}", out.status.success())');

add('command/status', 'status', CMD, 'How Command::status works', 'Runs the program and returns only its exit status.', {
  rows: [['rustc --version']], call: 'let st = cmd.status()?;', note: 'output goes to the terminal', outs: ['st.success() = true'],
  intro: 'The child prints directly to your terminal; you only get the exit code.',
  steps: [['The program runs.', 0], ['Exit code 0 means success.', [], 'o0']],
  result: 'success: true', resultCap: 'st.code() gives the number (None if killed by a signal).',
}, 'let st = std::process::Command::new("rustc").arg("--version").stdout(std::process::Stdio::null()).status().unwrap(); format!("success: {}", st.success())');

// ---------------------------------------------------------------- any, NonZero, Cow

add('any/type_name', 'type_name', ANY, 'How any::type_name works', 'The name of a type as a string.', {
  rows: [['i32', 'Vec<String>']], call: 'std::any::type_name::<Vec<String>>()', note: 'for debugging', outs: ['"i32"', '"alloc::vec::Vec<alloc::string::String>"'],
  intro: 'The exact text is not guaranteed to stay the same between Rust versions.',
  steps: [['i32 → "i32".', 0, 'o0'], ['Vec<String> → its full path.', 1, 'o1']],
  result: '"i32"', resultCap: 'Never use it for program logic; only for messages.',
}, 'd(std::any::type_name::<i32>())');

add('any/type_name_of_val', 'type_name_of_val', ANY, 'How any::type_name_of_val works', 'The name of a value\'s type.', {
  rows: [['2.5', '"hi"']], call: 'std::any::type_name_of_val(&x)', note: 'what did the compiler infer?', outs: ['"f64"', '"&str"'],
  intro: 'Handy to check what type inference chose.',
  steps: [['2.5 is an f64.', 0, 'o0'], ['"hi" is a &str.', 1, 'o1']],
  result: '"f64", "&str"', resultCap: 'Same caveat as type_name: only for debugging.',
}, 'format!("{:?}, {:?}", std::any::type_name_of_val(&2.5), std::any::type_name_of_val(&"hi"))');

add('any/downcast_ref', 'downcast_ref', ['core', 'dyn', /^src\/any\.rs$/], 'How Any::downcast_ref works', 'Gets the concrete type back from a &dyn Any, if it matches.', {
  rows: [['&dyn Any (holds 5i32)']], call: 'value.downcast_ref::<i32>()', note: 'checked at run time', outs: ['as i32: Some(5)', 'as String: None'],
  intro: 'dyn Any can hold anything; downcast_ref asks "is it this type?".',
  steps: [['It is an i32: Some(5).', 0, 'o0'], ['It is not a String: None.', 0, 'o1']],
  result: 'Some(5), None', resultCap: 'Common with panic payloads: e.downcast_ref::<&str>().',
}, 'let v: &dyn std::any::Any = &5i32; format!("{:?}, {:?}", v.downcast_ref::<i32>(), v.downcast_ref::<String>())');

add('nonzero/new', 'new', ['core', 'NonZero', /num\/nonzero\.rs$/], 'How NonZero::new works', 'A number that is guaranteed not to be zero; None for 0.', {
  rows: [['5', '0']], call: 'NonZeroU32::new(x)', note: 'zero is not allowed', outs: ['Some(5)', 'None'],
  intro: 'Because 0 is impossible, Option<NonZeroU32> takes no extra space.',
  steps: [['5 is fine.', 0, 'o0'], ['0 is rejected.', 1, 'o1']],
  result: 'Some(5), None', resultCap: 'Good for IDs and counts that must never be zero.',
}, 'format!("{:?}, {:?}", std::num::NonZeroU32::new(5), std::num::NonZeroU32::new(0))');

add('nonzero/get', 'get', ['core', 'NonZero', /num\/nonzero\.rs$/], 'How NonZero::get works', 'The plain number inside a NonZero.', {
  rows: [['NonZeroU32(7)']], call: 'n.get()', note: 'back to u32', outs: ['7'],
  intro: 'get() unwraps the guarantee and gives a normal integer.',
  steps: [['The value is 7.', 0], ['get() returns 7u32.', [], 'o0']],
  result: '7', resultCap: 'Dividing by a NonZero needs no zero check.',
}, 'std::num::NonZeroU32::new(7).unwrap().get().to_string()');

add('cow/into_owned', 'into_owned', ['alloc', 'Cow', /^src\/borrow\.rs$/], 'How Cow::into_owned works', 'Gets an owned value out of a Cow, cloning only if it was borrowed.', {
  rows: [['Cow::Borrowed("a")', 'Cow::Owned(String "b")']], call: 'cow.into_owned()', note: 'clone on demand', outs: ['cloned → "a"', 'moved → "b"'],
  intro: 'Cow = "clone on write": it holds either a borrow or an owned value.',
  steps: [['Borrowed: the text is copied into a String.', 0, 'o0'], ['Owned: the String is just moved out.', 1, 'o1']],
  result: '"a", "b"', resultCap: 'String::from_utf8_lossy returns a Cow, for example.',
}, 'let a: std::borrow::Cow<str> = std::borrow::Cow::Borrowed("a"); let b: std::borrow::Cow<str> = std::borrow::Cow::Owned(String::from("b")); format!("{:?}, {:?}", a.into_owned(), b.into_owned())');

add('cow/to_mut', 'to_mut', ['alloc', 'Cow', /^src\/borrow\.rs$/], 'How Cow::to_mut works', 'Mutable access: a borrowed Cow is cloned into an owned one first.', {
  rows: [['Cow::Borrowed("hi")']], call: 'cow.to_mut().push(\'!\');', note: 'clone at the first change', outs: ['Owned("hi!")'],
  intro: 'Code that only sometimes changes text avoids copies in the common case.',
  steps: [['The borrow is cloned into a String.', 0], ['"!" is pushed.', [], 'o0']],
  result: '"hi!", owned: true', resultCap: 'Later to_mut calls reuse the owned value.',
}, 'let mut c: std::borrow::Cow<str> = std::borrow::Cow::Borrowed("hi"); c.to_mut().push(\'!\'); format!("{:?}, owned: {}", c, matches!(c, std::borrow::Cow::Owned(_)))');

// ---------------------------------------------------------------- panic, hint, ptr, convert

add('panic/catch_unwind', 'catch_unwind', ['std', '', /^src\/panic\.rs$/], 'How panic::catch_unwind works', 'Runs a closure and turns a panic inside it into an Err.', {
  rows: [['|| 1', '|| panic!()']], call: 'panic::catch_unwind(|| risky())', note: 'a safety net', outs: ['Ok(1)', 'Err(payload)'],
  intro: 'Not for normal error handling: use Result. Useful at boundaries, e.g. thread pools or FFI.',
  steps: [['No panic: Ok(1).', 0, 'o0'], ['A panic is caught: Err.', 1, 'o1']],
  result: 'Ok(1), Err', resultCap: 'The panic message is still printed by the default hook.',
}, 'std::panic::set_hook(Box::new(|_| {})); let a = std::panic::catch_unwind(|| 1); let b = std::panic::catch_unwind(|| -> i32 { panic!("x") }); let _ = std::panic::take_hook(); format!("{:?}, {}", a.map_err(|_| ()), if b.is_err() { "Err" } else { "Ok" })');

add('hint/black_box', 'black_box', ['core', '', /^src\/hint\.rs$/], 'How hint::black_box works', 'Stops the compiler from optimising a value away, for benchmarks.', {
  rows: [['2 + 2']], call: 'black_box(2) + black_box(2)', note: 'the optimizer cannot see through it', outs: ['4, computed at run time'],
  intro: 'Without it, the compiler might compute benchmark code at compile time, making it look free.',
  steps: [['The values pass through black_box.', 0], ['The addition really happens at run time.', [], 'o0']],
  result: '4', resultCap: 'It returns its argument unchanged.',
}, '(std::hint::black_box(2) + std::hint::black_box(2)).to_string()');

add('ptr/eq', 'eq', ['core', '', /ptr\/mod\.rs$/], 'How ptr::eq works', 'true if two references point to the same place in memory.', {
  rows: [['a, &a', 'a, b (equal value)']], call: 'std::ptr::eq(r1, r2)', note: 'same object, not same value', outs: ['true', 'false'],
  intro: '== compares values; ptr::eq compares addresses.',
  steps: [['Two references to a: true.', 0, 'o0'], ['b has the same value but lives elsewhere: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Rc::ptr_eq does the same for Rc pointers.',
}, 'let a = 5; let b = 5; format!("{}, {}", std::ptr::eq(&a, &a), std::ptr::eq(&a, &b))');

add('ptr/null', 'null', ['core', '', /ptr\/mod\.rs$/], 'How ptr::null works', 'A raw pointer that points nowhere.', {
  rows: [['ptr::null::<i32>()']], call: 'let p: *const i32 = std::ptr::null();', note: 'for FFI and unsafe code', outs: ['p.is_null() = true'],
  intro: 'Safe Rust uses Option instead; null pointers appear when talking to C.',
  steps: [['p points at address 0.', 0], ['is_null() is true.', [], 'o0']],
  result: 'true', resultCap: 'Creating one is safe; reading through it is undefined behaviour.',
}, 'let p: *const i32 = std::ptr::null(); p.is_null().to_string()');

add('convert/identity', 'identity', ['core', '', /convert\/mod\.rs$/], 'How convert::identity works', 'A function that returns its argument unchanged.', {
  rows: [['Some(1)', 'None', 'Some(3)']], call: 'v.into_iter().filter_map(std::convert::identity)', note: 'useful as a closure', outs: ['1', '3'],
  intro: 'Where a function is expected, identity means "keep as is".',
  steps: [['Each Option passes through unchanged.', [0, 1, 2]], ['filter_map keeps the Somes.', [0, 2], 'o0,1']],
  result: '[1, 3]', resultCap: 'Same as |x| x, but with a name.',
}, 'let v = vec![Some(1), None, Some(3)]; d(v.into_iter().filter_map(std::convert::identity).collect::<Vec<_>>())');

// ---------------------------------------------------------------- fmt::Formatter

add('formatter/write_str', 'write_str', FMT, 'How Formatter::write_str works', 'Writes plain text from inside a Display or Debug implementation.', {
  kind: 'lines', call: 'fn fmt(&self, f: &mut Formatter) -> fmt::Result { f.write_str("on") }', note: 'the simplest fmt body',
  lines: ['format!("{}", light)', 'calls Light::fmt(&light, f)', 'f.write_str("on")', 'result: "on"'],
  intro: 'write_str sends text to whatever is being formatted into.',
  steps: [{ cap: 'format! needs the Display text.', show: [0, 1] }, { cap: 'fmt writes "on".', show: [2] }, { cap: 'That is the result.', show: [3] }],
  result: '"on"', resultCap: 'write!(f, "...") is the formatted version.',
}, 'struct L; impl std::fmt::Display for L { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.write_str("on") } } d(format!("{}", L))');

add('formatter/pad', 'pad', FMT, 'How Formatter::pad works', 'Writes text while honouring width, alignment and precision flags.', {
  rows: [['"{:>6}"', '"{:.2}"']], call: 'f.pad("ok")   // inside fmt', note: 'respect the caller\'s format', outs: ['"    ok"', '"ok"'],
  intro: 'With write_str, {:>6} would be ignored; pad applies it.',
  steps: [['Width 6, right-aligned: four spaces first.', 0, 'o0'], ['Precision .2 cuts the text to 2 chars.', 1, 'o1']],
  result: '"    ok", "ok"', resultCap: 'Use pad for text-like types so they line up in tables.',
}, 'struct S; impl std::fmt::Display for S { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.pad("ok") } } format!("{:?}, {:?}", format!("{:>6}", S), format!("{:.2}", S))');

add('formatter/debug_struct', 'debug_struct', FMT, 'How Formatter::debug_struct works', 'Builds Debug output in the Name { field: value } style.', {
  rows: [['P { x: 1, y: 2 }']], call: 'f.debug_struct("P").field("x", &self.x).field("y", &self.y).finish()', note: 'hand-written Debug', outs: ['P { x: 1, y: 2 }'],
  intro: 'Same output as #[derive(Debug)], but you choose which fields to show.',
  steps: [['Start with the name "P".', 0], ['Add fields, then finish.', [], 'o0']],
  result: 'P { x: 1, y: 2 }', resultCap: 'Skip secrets: leave a password field out of Debug.',
}, POINT + 'impl std::fmt::Debug for P { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.debug_struct("P").field("x", &self.x).field("y", &self.y).finish() } } format!("{:?}", P { x: 1, y: 2 })');

add('formatter/debug_tuple', 'debug_tuple', FMT, 'How Formatter::debug_tuple works', 'Builds Debug output in the Name(a, b) style.', {
  rows: [['Meters(5)']], call: 'f.debug_tuple("Meters").field(&self.0).finish()', note: 'for tuple structs', outs: ['Meters(5)'],
  intro: 'Like debug_struct, without field names.',
  steps: [['The name, then each value.', 0], ['Meters(5).', [], 'o0']],
  result: 'Meters(5)', resultCap: '{:#?} prints it over several lines.',
}, 'struct M(i32); impl std::fmt::Debug for M { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.debug_tuple("Meters").field(&self.0).finish() } } format!("{:?}", M(5))');

add('formatter/debug_list', 'debug_list', FMT, 'How Formatter::debug_list works', 'Builds Debug output in the [a, b, c] style.', {
  rows: [['custom collection of 1, 2']], call: 'f.debug_list().entries(self.items.iter()).finish()', note: 'for your own collections', outs: ['[1, 2]'],
  intro: 'Make your own container print like a Vec.',
  steps: [['Each entry is added.', 0], ['Wrapped in brackets.', [], 'o0']],
  result: '[1, 2]', resultCap: 'debug_set prints {a, b} instead.',
}, 'struct Bag(Vec<i32>); impl std::fmt::Debug for Bag { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.debug_list().entries(self.0.iter()).finish() } } format!("{:?}", Bag(vec![1, 2]))');

add('formatter/debug_map', 'debug_map', FMT, 'How Formatter::debug_map works', 'Builds Debug output in the {key: value} style.', {
  rows: [['pairs ("a", 1)']], call: 'f.debug_map().entries(self.pairs.iter().map(|(k, v)| (k, v))).finish()', note: 'map-like types', outs: ['{"a": 1}'],
  intro: 'Prints like a HashMap.',
  steps: [['Each key and value is added.', 0], ['Wrapped in braces.', [], 'o0']],
  result: '{"a": 1}', resultCap: 'Use key() and value() for one entry at a time.',
}, 'struct Pairs(Vec<(&\'static str, i32)>); impl std::fmt::Debug for Pairs { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.debug_map().entries(self.0.iter().map(|(k, v)| (k, v))).finish() } } format!("{:?}", Pairs(vec![("a", 1)]))');

add('formatter/alternate', 'alternate', FMT, 'How Formatter::alternate works', 'true if the caller used the # flag ({:#} or {:#?}).', {
  rows: [['"{}"', '"{:#}"']], call: 'if f.alternate() { ... } else { ... }', note: 'two output styles', outs: ['short', 'long'],
  intro: 'Your Display can offer a second, more detailed form.',
  steps: [['Without #: false, short form.', 0, 'o0'], ['With #: true, long form.', 1, 'o1']],
  result: '"1m", "1 metre"', resultCap: 'derive(Debug) uses it for pretty multi-line output.',
}, 'struct U; impl std::fmt::Display for U { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { if f.alternate() { f.write_str("1 metre") } else { f.write_str("1m") } } } format!("{:?}, {:?}", format!("{}", U), format!("{:#}", U))');

add('formatter/precision', 'precision', FMT, 'How Formatter::precision works', 'The precision the caller asked for ({:.2}), if any.', {
  rows: [['"{}"', '"{:.1}"']], call: 'let digits = f.precision().unwrap_or(3);', note: 'let callers choose', outs: ['None → default', 'Some(1)'],
  intro: 'Your type can round itself the way the caller requested.',
  steps: [['No precision given: None.', 0, 'o0'], ['{:.1}: Some(1).', 1, 'o1']],
  result: '"2.500", "2.5"', resultCap: 'width() works the same for {:8}.',
}, 'struct T(f64); impl std::fmt::Display for T { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { let p = f.precision().unwrap_or(3); write!(f, "{:.*}", p, self.0) } } format!("{:?}, {:?}", format!("{}", T(2.5)), format!("{:.1}", T(2.5)))');

add('formatter/width', 'width', FMT, 'How Formatter::width works', 'The minimum width the caller asked for ({:8}), if any.', {
  rows: [['"{}"', '"{:5}"']], call: 'f.width()', note: 'Option<usize>', outs: ['None', 'Some(5)'],
  intro: 'Read it to implement your own alignment.',
  steps: [['No width: None.', 0, 'o0'], ['{:5}: Some(5).', 1, 'o1']],
  result: '"None", "Some(5)"', resultCap: 'pad() applies width for you in the common case.',
}, 'struct W; impl std::fmt::Display for W { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { write!(f, "{:?}", f.width()) } } format!("{:?}, {:?}", format!("{}", W), format!("{:5}", W))');

add('debug_struct/field', 'field', ['core', 'DebugStruct', /fmt\/builders\.rs$/], 'How DebugStruct::field works', 'Adds one name: value pair to a debug_struct output.', {
  rows: [['"x"', '1']], call: '.field("x", &self.x)', note: 'one field per call', outs: ['P { x: 1 }'],
  intro: 'Each call appends a field; finish() closes the braces.',
  steps: [['"x" and its value are added.', [0, 1]], ['P { x: 1 }.', [], 'o0']],
  result: 'P { x: 1 }', resultCap: 'finish_non_exhaustive() prints .. for hidden fields.',
}, 'struct P { x: i32 } impl std::fmt::Debug for P { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { f.debug_struct("P").field("x", &self.x).finish() } } format!("{:?}", P { x: 1 })');

add('debug_struct/finish_non_exhaustive', 'finish_non_exhaustive', ['core', 'DebugStruct', /fmt\/builders\.rs$/], 'How DebugStruct::finish_non_exhaustive works', 'Ends the struct output with .. to show that some fields are hidden.', {
  rows: [['User { name, password }']], call: 'f.debug_struct("User").field("name", &self.name).finish_non_exhaustive()', note: 'hide secrets', outs: ['User { name: "ann", .. }'],
  intro: 'Readers can see that more fields exist.',
  steps: [['Only name is shown.', 0], ['.. marks the rest.', [], 'o0']],
  result: 'User { name: "ann", .. }', resultCap: 'Good practice for types holding passwords or tokens.',
}, 'struct U { name: &\'static str, pw: &\'static str } impl std::fmt::Debug for U { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { let _ = self.pw; f.debug_struct("User").field("name", &self.name).finish_non_exhaustive() } } format!("{:?}", U { name: "ann", pw: "x" })');

module.exports = list;
