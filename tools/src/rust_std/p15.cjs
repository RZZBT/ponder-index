// Rust standard library: Duration, Instant, SystemTime, Path and PathBuf.
// Results never print a separator that std inserts itself (\ on Windows, / elsewhere), so they hold on every OS.
const { group } = require('./kit.cjs');
const DUR = ['core', 'Duration', /^src\/time\.rs$/];
const INSTANT = ['std', 'Instant', /^src\/time\.rs$/];
const SYSTIME = ['std', 'SystemTime', /^src\/time\.rs$/];
const PATH = ['std', 'Path', /^src\/path\.rs$/];
const PATHBUF = ['std', 'PathBuf', /^src\/path\.rs$/];
const { list, add } = group({ at: DUR });
const D = 'std::time::Duration';

// ---------------------------------------------------------------- Duration

add('duration/new', 'new', null, 'How Duration::new works', 'A duration from whole seconds plus nanoseconds.', {
  rows: [['secs 2', 'nanos 500_000_000']], call: 'Duration::new(2, 500_000_000)', note: '2.5 seconds', outs: ['2.5s'],
  intro: 'Extra nanoseconds beyond a second carry over into the seconds.',
  steps: [['2 seconds...', 0], ['...plus half a second.', 1, 'o0']],
  result: '2.5s', resultCap: 'from_secs, from_millis and friends are easier for single units.',
}, `d(${D}::new(2, 500_000_000))`);

add('duration/from_millis', 'from_millis', null, 'How Duration::from_millis works', 'A duration from milliseconds.', {
  rows: [['1500']], call: 'Duration::from_millis(1500)', note: '1 s = 1000 ms', outs: ['1.5s'],
  intro: 'Common for timeouts and animation frames.',
  steps: [['1500 ms.', 0], ['= 1.5 seconds.', [], 'o0']],
  result: '1.5s', resultCap: 'thread::sleep(Duration::from_millis(16)) waits about one frame at 60 fps.',
}, `d(${D}::from_millis(1500))`);

add('duration/from_micros', 'from_micros', null, 'How Duration::from_micros works', 'A duration from microseconds.', {
  rows: [['2500']], call: 'Duration::from_micros(2500)', note: '1 ms = 1000 µs', outs: ['2.5ms'],
  intro: 'Microseconds suit precise timing measurements.',
  steps: [['2500 µs.', 0], ['= 2.5 ms.', [], 'o0']],
  result: '2.5ms', resultCap: 'Debug output picks the most readable unit.',
}, `d(${D}::from_micros(2500))`);

add('duration/from_nanos', 'from_nanos', null, 'How Duration::from_nanos works', 'A duration from nanoseconds.', {
  rows: [['1_000_000_001']], call: 'Duration::from_nanos(1_000_000_001)', note: 'the finest unit', outs: ['1.000000001s'],
  intro: 'Duration stores nanoseconds exactly.',
  steps: [['One second and one nanosecond.', 0], ['Nothing is rounded.', [], 'o0']],
  result: '1.000000001s', resultCap: 'as_nanos() gives the total back as a u128.',
}, `d(${D}::from_nanos(1_000_000_001))`);

add('duration/from_secs_f64', 'from_secs_f64', null, 'How Duration::from_secs_f64 works', 'A duration from a fractional number of seconds.', {
  rows: [['0.25']], call: 'Duration::from_secs_f64(0.25)', note: 'float seconds', outs: ['250ms'],
  intro: 'Handy when the time comes from a calculation.',
  steps: [['0.25 s.', 0], ['= 250 ms.', [], 'o0']],
  result: '250ms', resultCap: 'Panics for negative or non-finite values; try_from_secs_f64 returns an error instead.',
}, `d(${D}::from_secs_f64(0.25))`);

add('duration/as_secs', 'as_secs', null, 'How Duration::as_secs works', 'The whole seconds, dropping any fraction.', {
  rows: [['2.9 s']], call: 'd.as_secs()', note: 'truncates', outs: ['2'],
  intro: 'The fractional part is not rounded, just dropped.',
  steps: [['2.9 seconds.', 0], ['Whole seconds: 2.', [], 'o0']],
  result: '2', resultCap: 'subsec_millis() gives the dropped part (900).',
}, `${D}::from_millis(2900).as_secs().to_string()`);

add('duration/as_secs_f64', 'as_secs_f64', null, 'How Duration::as_secs_f64 works', 'The duration as a float number of seconds.', {
  rows: [['1500 ms']], call: 'd.as_secs_f64()', note: 'for maths', outs: ['1.5'],
  intro: 'Useful for speeds: distance / elapsed.as_secs_f64().',
  steps: [['1500 ms.', 0], ['= 1.5 seconds as an f64.', [], 'o0']],
  result: '1.5', resultCap: 'as_secs_f32 gives an f32.',
}, `${D}::from_millis(1500).as_secs_f64().to_string()`);

add('duration/as_micros', 'as_micros', null, 'How Duration::as_micros works', 'The whole duration in microseconds.', {
  rows: [['1.5 ms']], call: 'd.as_micros()', note: 'u128', outs: ['1500'],
  intro: 'Total microseconds, not just the fractional part.',
  steps: [['1.5 ms.', 0], ['= 1500 µs.', [], 'o0']],
  result: '1500', resultCap: 'Good for logging timings of short operations.',
}, `${D}::from_micros(1500).as_micros().to_string()`);

add('duration/as_nanos', 'as_nanos', null, 'How Duration::as_nanos works', 'The whole duration in nanoseconds.', {
  rows: [['2 s']], call: 'd.as_nanos()', note: 'u128', outs: ['2000000000'],
  intro: 'u128 is big enough for any Duration.',
  steps: [['2 seconds.', 0], ['= 2,000,000,000 ns.', [], 'o0']],
  result: '2000000000', resultCap: 'as_millis and as_micros work the same way.',
}, `${D}::from_secs(2).as_nanos().to_string()`);

add('duration/subsec_millis', 'subsec_millis', null, 'How Duration::subsec_millis works', 'The milliseconds after the whole seconds.', {
  rows: [['3.25 s']], call: 'd.subsec_millis()', note: 'only the fraction', outs: ['250'],
  intro: 'Combine with as_secs to print "3 s 250 ms".',
  steps: [['Whole seconds: 3.', 0], ['Left over: 250 ms.', [], 'o0']],
  result: '250', resultCap: 'Always below 1000.',
}, `${D}::from_millis(3250).subsec_millis().to_string()`);

add('duration/subsec_nanos', 'subsec_nanos', null, 'How Duration::subsec_nanos works', 'The nanoseconds after the whole seconds.', {
  rows: [['1.000000007 s']], call: 'd.subsec_nanos()', note: 'the fraction in ns', outs: ['7'],
  intro: 'A Duration is stored as seconds plus this number.',
  steps: [['Whole seconds: 1.', 0], ['Left over: 7 ns.', [], 'o0']],
  result: '7', resultCap: 'Always below 1,000,000,000.',
}, `${D}::new(1, 7).subsec_nanos().to_string()`);

add('duration/checked_add', 'checked_add', null, 'How Duration::checked_add works', 'Adds two durations; None on overflow.', {
  rows: [['1 s + 2 s', 'MAX + 1 s']], call: 'a.checked_add(b)', note: 'safe addition', outs: ['Some(3s)', 'None'],
  intro: 'Plain + panics on overflow; checked_add does not.',
  steps: [['3 seconds.', 0, 'o0'], ['Duration::MAX cannot grow: None.', 1, 'o1']],
  result: 'Some(3s), None', resultCap: 'saturating_add stops at MAX instead.',
}, `let s = ${D}::from_secs; format!("{:?}, {:?}", s(1).checked_add(s(2)), ${D}::MAX.checked_add(s(1)))`);

add('duration/saturating_sub', 'saturating_sub', null, 'How Duration::saturating_sub works', 'Subtracts, stopping at zero.', {
  rows: [['5 s - 2 s', '2 s - 5 s']], call: 'a.saturating_sub(b)', note: 'never negative', outs: ['3s', '0ns'],
  intro: 'Remaining time can never go below zero.',
  steps: [['3 seconds left.', 0, 'o0'], ['Would be negative: 0.', 1, 'o1']],
  result: '3s, 0ns', resultCap: 'remaining = deadline.saturating_sub(elapsed).',
}, `let s = ${D}::from_secs; format!("{:?}, {:?}", s(5).saturating_sub(s(2)), s(2).saturating_sub(s(5)))`);

add('duration/mul_f64', 'mul_f64', null, 'How Duration::mul_f64 works', 'Multiplies a duration by a float.', {
  rows: [['2 s × 1.5']], call: 'd.mul_f64(1.5)', note: 'scale a time', outs: ['3s'],
  intro: 'Handy for back-off: wait 1.5 times longer each retry.',
  steps: [['2 s × 1.5.', 0], ['= 3 s.', [], 'o0']],
  result: '3s', resultCap: 'Multiplying by an integer works with * directly: d * 3.',
}, `d(${D}::from_secs(2).mul_f64(1.5))`);

add('duration/div_f64', 'div_f64', null, 'How Duration::div_f64 works', 'Divides a duration by a float.', {
  rows: [['3 s ÷ 4']], call: 'd.div_f64(4.0)', note: 'split a time', outs: ['750ms'],
  intro: 'For example, the time per frame.',
  steps: [['3 s / 4.', 0], ['= 750 ms.', [], 'o0']],
  result: '750ms', resultCap: 'd / 4 works for integer divisors.',
}, `d(${D}::from_secs(3).div_f64(4.0))`);

add('duration/is_zero', 'is_zero', null, 'How Duration::is_zero works', 'true if the duration is exactly zero.', {
  rows: [['0 s', '1 ns']], call: 'd.is_zero()', note: 'nothing left?', outs: ['true', 'false'],
  intro: 'Even one nanosecond counts as non-zero.',
  steps: [['Zero: true.', 0, 'o0'], ['1 ns: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Duration::ZERO is the constant.',
}, `format!("{}, {}", ${D}::ZERO.is_zero(), ${D}::from_nanos(1).is_zero())`);

add('duration/abs_diff', 'abs_diff', null, 'How Duration::abs_diff works', 'The difference between two durations, whichever is larger.', {
  rows: [['2 s vs 5 s']], call: 'a.abs_diff(b)', note: 'never negative', outs: ['3s'],
  intro: 'No need to know which one is bigger.',
  steps: [['|2 - 5| s.', 0], ['= 3 s.', [], 'o0']],
  result: '3s', resultCap: 'Compare two measured times without underflow.',
}, `let s = ${D}::from_secs; d(s(2).abs_diff(s(5)))`);

add('duration/checked_mul', 'checked_mul', null, 'How Duration::checked_mul works', 'Multiplies by a whole number; None on overflow.', {
  rows: [['1 min × 3']], call: 'd.checked_mul(3)', note: 'safe *', outs: ['Some(180s)'],
  intro: 'Overflow is only possible for gigantic values.',
  steps: [['60 s × 3.', 0], ['= 180 s.', [], 'o0']],
  result: 'Some(180s)', resultCap: 'checked_div divides safely.',
}, `d(${D}::from_secs(60).checked_mul(3))`);

// ---------------------------------------------------------------- Instant and SystemTime

add('instant/now', 'now', INSTANT, 'How Instant::now works', 'A point in time from a clock that never goes backwards.', {
  rows: [['start', 'later']], call: 'let start = Instant::now();', note: 'for measuring', outs: ['later ≥ start'],
  intro: 'Instants are only useful for comparing with each other, not as dates.',
  steps: [['Take a reading.', 0], ['A later reading is never earlier.', 1, 'o0']],
  result: 'true', resultCap: 'For calendar time use SystemTime.',
}, 'let a = std::time::Instant::now(); let b = std::time::Instant::now(); (b >= a).to_string()');

add('instant/elapsed', 'elapsed', INSTANT, 'How Instant::elapsed works', 'How much time has passed since this Instant.', {
  rows: [['start', 'sleep 20 ms']], call: 'start.elapsed()', note: 'a stopwatch', outs: ['≥ 20 ms'],
  intro: 'elapsed() is Instant::now() - start.',
  steps: [['The clock was read at start.', 0], ['After the work, elapsed() gives the time taken.', 1, 'o0']],
  result: 'at least 20 ms: true', resultCap: 'println!("took {:?}", start.elapsed()) is the classic timing line.',
}, 'let t = std::time::Instant::now(); std::thread::sleep(std::time::Duration::from_millis(20)); format!("at least 20 ms: {}", t.elapsed() >= std::time::Duration::from_millis(20))');

add('instant/duration_since', 'duration_since', INSTANT, 'How Instant::duration_since works', 'The time between an earlier Instant and this one.', {
  rows: [['t0', 't0 + 3 s']], call: 'later.duration_since(earlier)', note: 'later - earlier', outs: ['3s'],
  intro: 'Gives zero if the "earlier" one is actually later.',
  steps: [['Two instants 3 s apart.', [0, 1]], ['duration_since: 3 s.', [], 'o0']],
  result: '3s', resultCap: 'later - earlier does the same with the - operator.',
}, 'let t0 = std::time::Instant::now(); let t1 = t0 + std::time::Duration::from_secs(3); d(t1.duration_since(t0))');

add('instant/checked_duration_since', 'checked_duration_since', INSTANT, 'How Instant::checked_duration_since works', 'The time since an earlier Instant, or None if it was not earlier.', {
  rows: [['t1 vs t0', 't0 vs t1']], call: 'a.checked_duration_since(b)', note: 'order matters', outs: ['Some(1s)', 'None'],
  intro: 'None when b is after a.',
  steps: [['t1 is 1 s after t0.', 0, 'o0'], ['t0 is before t1: None.', 1, 'o1']],
  result: 'Some(1s), None', resultCap: 'saturating_duration_since returns zero instead of None.',
}, 'let t0 = std::time::Instant::now(); let t1 = t0 + std::time::Duration::from_secs(1); format!("{:?}, {:?}", t1.checked_duration_since(t0), t0.checked_duration_since(t1))');

add('instant/saturating_duration_since', 'saturating_duration_since', INSTANT, 'How Instant::saturating_duration_since works', 'The time since another Instant, or zero if that one is later.', {
  rows: [['t0 vs t1 (later)']], call: 't0.saturating_duration_since(t1)', note: 'never panics', outs: ['0ns'],
  intro: 'Negative time becomes zero.',
  steps: [['t1 is after t0.', 0], ['The result is zero.', [], 'o0']],
  result: '0ns', resultCap: 'Safe when instants come from different threads.',
}, 'let t0 = std::time::Instant::now(); let t1 = t0 + std::time::Duration::from_secs(1); d(t0.saturating_duration_since(t1))');

add('instant/checked_add', 'checked_add', INSTANT, 'How Instant::checked_add works', 'A later Instant; None if it cannot be represented.', {
  rows: [['now + 5 s']], call: 'start.checked_add(Duration::from_secs(5))', note: 'a deadline', outs: ['Some(deadline)'],
  intro: 'Compute deadlines without risking a panic.',
  steps: [['start + 5 s.', 0], ['The deadline is 5 s after start.', [], 'o0']],
  result: '5s', resultCap: 'Compare Instant::now() >= deadline to check for a timeout.',
}, 'let s = std::time::Instant::now(); let dl = s.checked_add(std::time::Duration::from_secs(5)).unwrap(); d(dl - s)');

add('systemtime/now', 'now', SYSTIME, 'How SystemTime::now works', 'The current wall-clock time.', {
  rows: [['now']], call: 'SystemTime::now().duration_since(UNIX_EPOCH)', note: 'seconds since 1970', outs: ['Ok(…)'],
  intro: 'Wall-clock time can jump (e.g. when the clock is adjusted), so use Instant for measuring.',
  steps: [['Read the clock.', 0], ['Compare with 1 January 1970.', [], 'o0']],
  result: 'after 2020: true', resultCap: 'For formatted dates use a crate like chrono or time.',
}, 'let s = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(); format!("after 2020: {}", s > 1_577_836_800)');

add('systemtime/duration_since', 'duration_since', SYSTIME, 'How SystemTime::duration_since works', 'The time between an earlier SystemTime and this one; Err if it is not earlier.', {
  rows: [['EPOCH + 90 s vs EPOCH']], call: 't.duration_since(UNIX_EPOCH)', note: 'a Unix timestamp', outs: ['Ok(90s)'],
  intro: 'The usual way to get a Unix timestamp.',
  steps: [['t is 90 s after the epoch.', 0], ['Ok(90 s).', [], 'o0']],
  result: 'Ok(90s)', resultCap: 'Err means the clock is before the other time; its duration() says by how much.',
}, 'let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(90); d(t.duration_since(std::time::UNIX_EPOCH))');

add('systemtime/checked_sub', 'checked_sub', SYSTIME, 'How SystemTime::checked_sub works', 'An earlier SystemTime; None if it cannot be represented.', {
  rows: [['EPOCH + 1 h, minus 30 min']], call: 't.checked_sub(Duration::from_secs(1800))', note: 'go back in time', outs: ['EPOCH + 30 min'],
  intro: 'Computes "30 minutes ago" safely.',
  steps: [['1 h after the epoch.', 0], ['Minus 30 min: 30 min after the epoch.', [], 'o0']],
  result: '1800s', resultCap: 'checked_add goes forward.',
}, 'let t = std::time::UNIX_EPOCH + std::time::Duration::from_secs(3600); d(t.checked_sub(std::time::Duration::from_secs(1800)).unwrap().duration_since(std::time::UNIX_EPOCH).unwrap())');

// ---------------------------------------------------------------- Path and PathBuf

add('path/new', 'new', PATH, 'How Path::new works', 'Views a string as a file-system path (no copying, no checking).', {
  rows: [['"docs/readme.md"']], call: 'let p = Path::new("docs/readme.md");', note: '&str → &Path', outs: ['p.file_name() = "readme.md"'],
  intro: 'Path::new does not touch the disk; the file may not even exist.',
  steps: [['The text is borrowed as a Path.', 0], ['Now path methods work on it.', [], 'o0']],
  result: 'Some("readme.md")', resultCap: 'PathBuf is the owned, growable version.',
}, 'let p = std::path::Path::new("docs/readme.md"); d(p.file_name())');

add('path/components', 'components', PATH, 'How Path::components works', 'The parts of a path, one by one.', {
  rows: [['"src/bin/main.rs"']], call: 'p.components()', note: 'split at separators', outs: ['Normal("src")', 'Normal("bin")', 'Normal("main.rs")'],
  intro: 'Separators are removed; "." and repeated slashes are cleaned up.',
  steps: [['"src", then "bin"...', 0, 'o0,1'], ['...then "main.rs".', 0, 'o2']],
  result: '3 parts: ["src", "bin", "main.rs"]', resultCap: 'iter() gives the same parts as &OsStr.',
}, 'let p = std::path::Path::new("src/bin/main.rs"); let parts: Vec<_> = p.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect(); format!("{} parts: {:?}", parts.len(), parts)');

add('path/has_root', 'has_root', PATH, 'How Path::has_root works', 'true if the path starts at the root (/).', {
  rows: [['"/etc/hosts"', '"etc/hosts"']], call: 'p.has_root()', note: 'leading separator', outs: ['true', 'false'],
  intro: 'A path with a root starts at the top of the file system.',
  steps: [['"/etc/hosts" starts with /.', 0, 'o0'], ['"etc/hosts" is relative.', 1, 'o1']],
  result: 'true, false', resultCap: 'is_absolute also needs a drive letter on Windows (C:\\).',
}, 'format!("{}, {}", std::path::Path::new("/etc/hosts").has_root(), std::path::Path::new("etc/hosts").has_root())');

add('path/starts_with', 'starts_with', PATH, 'How Path::starts_with works', 'true if the path begins with the given whole components.', {
  rows: [['"src/lib.rs" starts with "src"', '... with "sr"']], call: 'p.starts_with("src")', note: 'whole parts only', outs: ['true', 'false'],
  intro: 'Unlike str::starts_with, partial names do not count.',
  steps: [['"src" is the first component: true.', 0, 'o0'], ['"sr" is only part of a name: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'ends_with works the same at the end.',
}, 'let p = std::path::Path::new("src/lib.rs"); format!("{}, {}", p.starts_with("src"), p.starts_with("sr"))');

add('path/ends_with', 'ends_with', PATH, 'How Path::ends_with works', 'true if the path ends with the given whole components.', {
  rows: [['ends with "lib.rs"', 'ends with "b.rs"']], call: 'p.ends_with("lib.rs")', note: 'whole parts only', outs: ['true', 'false'],
  intro: 'Only complete components match.',
  steps: [['"lib.rs" is the last component: true.', 0, 'o0'], ['"b.rs" is just the end of a name: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'Check extensions with extension() instead.',
}, 'let p = std::path::Path::new("src/lib.rs"); format!("{}, {}", p.ends_with("lib.rs"), p.ends_with("b.rs"))');

add('path/strip_prefix', 'strip_prefix', PATH, 'How Path::strip_prefix works', 'The rest of the path after a leading part.', {
  rows: [['"project/src/main.rs" minus "project"']], call: 'p.strip_prefix("project")', note: 'make a path relative', outs: ['Ok("src/main.rs")'],
  intro: 'Err if the path does not start with that prefix.',
  steps: [['"project" matches the start.', 0], ['What is left: "src/main.rs".', [], 'o0']],
  result: 'Ok("src/main.rs")', resultCap: 'Typical for showing paths relative to a project folder.',
}, 'd(std::path::Path::new("project/src/main.rs").strip_prefix("project"))');

add('path/to_str', 'to_str', PATH, 'How Path::to_str works', 'The path as a &str, if it is valid Unicode.', {
  rows: [['"notes.txt"']], call: 'p.to_str()', note: 'Option<&str>', outs: ['Some("notes.txt")'],
  intro: 'File names on some systems may contain bytes that are not valid UTF-8, so this can fail.',
  steps: [['The path is valid Unicode.', 0], ['Some("notes.txt").', [], 'o0']],
  result: 'Some("notes.txt")', resultCap: 'to_string_lossy never fails.',
}, 'd(std::path::Path::new("notes.txt").to_str())');

add('path/to_string_lossy', 'to_string_lossy', PATH, 'How Path::to_string_lossy works', 'The path as text, replacing invalid parts with �.', {
  rows: [['"photos/cat.png"']], call: 'p.to_string_lossy()', note: 'always works', outs: ['"photos/cat.png"'],
  intro: 'Returns a Cow<str>: borrowed when no replacement was needed.',
  steps: [['The path is already valid.', 0], ['It is returned as text.', [], 'o0']],
  result: '"photos/cat.png"', resultCap: 'display() is the way to print a path.',
}, 'd(std::path::Path::new("photos/cat.png").to_string_lossy())');

add('path/display', 'display', PATH, 'How Path::display works', 'Something you can print with {}.', {
  rows: [['"out/report.pdf"']], call: 'println!("saved {}", p.display())', note: 'Path has no Display itself', outs: ['saved out/report.pdf'],
  intro: 'Paths are not always valid text, so printing needs display().',
  steps: [['display() wraps the path.', 0], ['It prints like a string.', [], 'o0']],
  result: 'saved out/report.pdf', resultCap: 'Invalid bytes are shown as �.',
}, 'format!("saved {}", std::path::Path::new("out/report.pdf").display())');

add('path/ancestors', 'ancestors', PATH, 'How Path::ancestors works', 'The path itself, then each parent up to the top.', {
  rows: [['"a/b/c"']], call: 'p.ancestors()', note: 'walk upwards', outs: ['"a/b/c"', '"a/b"', '"a"', '""'],
  intro: 'Repeatedly calls parent().',
  steps: [['Starts with the path itself.', 0, 'o0'], ['Then "a/b" and "a".', 0, 'o1,2'], ['Finally "".', 0, 'o3']],
  result: '"a/b/c", "a/b", "a", ""', resultCap: 'Find a project root: p.ancestors().find(|d| d.join("Cargo.toml").exists()).',
}, 'jd(std::path::Path::new("a/b/c").ancestors())');

add('path/join', 'join', PATH, 'How Path::join works', 'A new PathBuf with another path appended.', {
  rows: [['"assets"', '"logo.png"']], call: 'Path::new("assets").join("logo.png")', note: 'adds the right separator', outs: ['assets/logo.png'],
  intro: 'join inserts the separator for the current OS (\\ on Windows, / elsewhere).',
  steps: [['"assets" and "logo.png".', [0, 1]], ['Joined into one path.', [], 'o0']],
  result: 'same path as "assets/logo.png": true', resultCap: 'Joining an absolute path replaces everything: Path::new("a").join("/b") is "/b".',
}, 'let p = std::path::Path::new("assets").join("logo.png"); format!("same path as \\"assets/logo.png\\": {}", p == std::path::Path::new("assets/logo.png"))');

add('path/to_path_buf', 'to_path_buf', PATH, 'How Path::to_path_buf works', 'An owned PathBuf copy of a borrowed Path.', {
  rows: [['&Path "cfg/app.toml"']], call: 'p.to_path_buf()', note: '&Path → PathBuf', outs: ['PathBuf "cfg/app.toml"'],
  intro: 'Like to_string for paths: needed to store a path in a struct.',
  steps: [['The borrowed path is copied.', 0], ['You own the PathBuf.', [], 'o0']],
  result: '"cfg/app.toml"', resultCap: 'PathBuf::from("...") builds one directly.',
}, 'd(std::path::Path::new("cfg/app.toml").to_path_buf())');

add('path/is_relative', 'is_relative', PATH, 'How Path::is_relative works', 'true if the path is relative to the current folder.', {
  rows: [['"data/x.csv"', '"./run.sh"']], call: 'p.is_relative()', note: 'not absolute', outs: ['true', 'true'],
  intro: 'Relative paths are resolved against the working directory.',
  steps: [['"data/x.csv": relative.', 0, 'o0'], ['"./run.sh": relative too.', 1, 'o1']],
  result: 'true, true', resultCap: 'std::env::current_dir()?.join(p) makes it absolute.',
}, 'format!("{}, {}", std::path::Path::new("data/x.csv").is_relative(), std::path::Path::new("./run.sh").is_relative())');

add('pathbuf/push', 'push', PATHBUF, 'How PathBuf::push works', 'Appends a part to the path, in place.', {
  rows: [['"target"'], ['"debug"']], call: 'let mut p = PathBuf::from("target"); p.push("debug");', note: 'grow a path', outs: ['target/debug'],
  intro: 'push adds the OS separator before the new part.',
  steps: [['Start with "target".', 'a0'], ['"debug" is appended.', 'b0', 'o0']],
  result: 'same path as "target/debug": true', resultCap: 'Pushing an absolute path replaces the whole PathBuf.',
}, 'let mut p = std::path::PathBuf::from("target"); p.push("debug"); format!("same path as \\"target/debug\\": {}", p == std::path::Path::new("target/debug"))');

add('pathbuf/pop', 'pop', PATHBUF, 'How PathBuf::pop works', 'Removes the last part; false if there was none.', {
  rows: [['"a/b/c"']], call: 'p.pop()', note: 'go up one level', outs: ['true', '"a/b"'],
  intro: 'pop is parent() done in place.',
  steps: [['"c" is removed.', 0, 'o0'], ['"a/b" remains.', 0, 'o1']],
  result: 'true, "a/b"', resultCap: 'Returns false when nothing is left to remove.',
}, 'let mut p = std::path::PathBuf::from("a/b/c"); let r = p.pop(); format!("{}, {:?}", r, p)');

add('pathbuf/set_extension', 'set_extension', PATHBUF, 'How PathBuf::set_extension works', 'Changes (or adds) the extension, in place.', {
  rows: [['"photo.jpeg"']], call: 'p.set_extension("jpg")', note: 'rename the type', outs: ['"photo.jpg"'],
  intro: 'An empty string removes the extension.',
  steps: [['".jpeg" is removed.', 0], ['".jpg" is added.', [], 'o0']],
  result: '"photo.jpg"', resultCap: 'with_extension returns a new PathBuf instead.',
}, 'let mut p = std::path::PathBuf::from("photo.jpeg"); p.set_extension("jpg"); d(p)');

add('pathbuf/set_file_name', 'set_file_name', PATHBUF, 'How PathBuf::set_file_name works', 'Replaces the last part (the file name), in place.', {
  rows: [['"logs/old.txt"']], call: 'p.set_file_name("new.txt")', note: 'same folder, new name', outs: ['file name: "new.txt"'],
  intro: 'The folder part is kept.',
  steps: [['"old.txt" is removed.', 0], ['"new.txt" takes its place.', [], 'o0']],
  result: 'Some("new.txt"), parent Some("logs")', resultCap: 'with_file_name returns a new PathBuf instead.',
}, 'let mut p = std::path::PathBuf::from("logs/old.txt"); p.set_file_name("new.txt"); format!("{:?}, parent {:?}", p.file_name(), p.parent())');

add('pathbuf/from', 'from', PATHBUF, 'How PathBuf::from works', 'An owned path from a string.', {
  rows: [['"build/out"']], call: 'PathBuf::from("build/out")', note: 'String or &str → PathBuf', outs: ['PathBuf "build/out"'],
  intro: 'The text is copied into an owned, growable path.',
  steps: [['The string is copied.', 0], ['A PathBuf you can push onto.', [], 'o0']],
  result: '"build/out"', resultCap: 'Works with &str, String, OsString and Box<Path>.',
}, 'd(std::path::PathBuf::from("build/out"))');

module.exports = list;
