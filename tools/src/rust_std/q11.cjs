// Rust standard library: the rest of Duration/Instant/SystemTime, std::process (children, pipes, exit status) and
// std::env. Child processes in the truth checks run `rustc`, which is always installed where they run.
const { group } = require('./kit.cjs');
const DUR = ['core', 'Duration', /^src\/time\.rs$/];
const P = (o) => ['std', o, /^src\/process\.rs$/];
const ENV = ['std', '', /^src\/env\.rs$/];
const { list, add } = group({ at: DUR });
const D = 'std::time::Duration';
const PU = 'use std::process::{Command, Stdio}; ';

// ---------------------------------------------------------------- Duration, Instant, SystemTime

add('duration/as_secs_f32', 'as_secs_f32', null, 'How Duration::as_secs_f32 works', 'The duration as an f32 number of seconds.', {
  rows: [['250 ms']], call: 'd.as_secs_f32()', note: 'for game timing', outs: ['0.25'],
  intro: 'f32 is common in game loops: position += speed * dt.as_secs_f32().',
  steps: [['250 ms.', 0], ['= 0.25 s.', [], 'o0']],
  result: '0.25', resultCap: 'as_secs_f64 is more precise.',
}, `${D}::from_millis(250).as_secs_f32().to_string()`);

add('duration/from_secs_f32', 'from_secs_f32', null, 'How Duration::from_secs_f32 works', 'A duration from an f32 number of seconds.', {
  rows: [['0.5']], call: 'Duration::from_secs_f32(0.5)', note: 'float seconds', outs: ['500ms'],
  intro: 'Panics for negative or infinite values.',
  steps: [['0.5 s.', 0], ['= 500 ms.', [], 'o0']],
  result: '500ms', resultCap: 'try_from_secs_f32 returns an error instead of panicking.',
}, `d(${D}::from_secs_f32(0.5))`);

add('duration/try_from_secs_f64', 'try_from_secs_f64', null, 'How Duration::try_from_secs_f64 works', 'Converts float seconds to a Duration, or an error for invalid values.', {
  rows: [['1.5', '-1.0']], call: 'Duration::try_from_secs_f64(x)', note: 'no panic', outs: ['Ok(1.5s)', 'Err'],
  intro: 'Negative, NaN and too-large values are rejected.',
  steps: [['1.5: Ok.', 0, 'o0'], ['-1.0: Err.', 1, 'o1']],
  result: 'Ok(1.5s), Err', resultCap: 'Use it for durations read from user input.',
}, `format!("{:?}, {}", ${D}::try_from_secs_f64(1.5), if ${D}::try_from_secs_f64(-1.0).is_err() { "Err" } else { "Ok" })`);

add('duration/try_from_secs_f32', 'try_from_secs_f32', null, 'How Duration::try_from_secs_f32 works', 'Converts f32 seconds to a Duration, or an error for invalid values.', {
  rows: [['2.0', 'NaN']], call: 'Duration::try_from_secs_f32(x)', note: 'no panic', outs: ['Ok(2s)', 'Err'],
  intro: 'NaN has no meaning as a time.',
  steps: [['2.0: Ok.', 0, 'o0'], ['NaN: Err.', 1, 'o1']],
  result: 'Ok(2s), Err', resultCap: 'The f64 version is more precise.',
}, `format!("{:?}, {}", ${D}::try_from_secs_f32(2.0), if ${D}::try_from_secs_f32(f32::NAN).is_err() { "Err" } else { "Ok" })`);

add('duration/checked_div', 'checked_div', null, 'How Duration::checked_div works', 'Divides by a whole number; None when dividing by zero.', {
  rows: [['6 s / 4', '6 s / 0']], call: 'd.checked_div(n)', note: 'safe division', outs: ['Some(1.5s)', 'None'],
  intro: 'Plain / panics on zero.',
  steps: [['6 / 4 = 1.5 s.', 0, 'o0'], ['/ 0: None.', 1, 'o1']],
  result: 'Some(1.5s), None', resultCap: 'Average time per item: total.checked_div(count).',
}, `format!("{:?}, {:?}", ${D}::from_secs(6).checked_div(4), ${D}::from_secs(6).checked_div(0))`);

add('duration/div_duration_f64', 'div_duration_f64', null, 'How Duration::div_duration_f64 works', 'How many times one duration fits into another, as an f64.', {
  rows: [['90 s ÷ 1 min']], call: 'a.div_duration_f64(b)', note: 'ratio of times', outs: ['1.5'],
  intro: 'Handy for progress: elapsed.div_duration_f64(total).',
  steps: [['90 s / 60 s.', 0], ['= 1.5.', [], 'o0']],
  result: '1.5', resultCap: 'div_duration_f32 returns an f32.',
}, `${D}::from_secs(90).div_duration_f64(${D}::from_secs(60)).to_string()`);

add('duration/div_duration_f32', 'div_duration_f32', null, 'How Duration::div_duration_f32 works', 'The ratio of two durations as an f32.', {
  rows: [['1 s ÷ 4 s']], call: 'a.div_duration_f32(b)', note: 'e.g. animation progress', outs: ['0.25'],
  intro: 'A value between 0 and 1 for an animation that lasts 4 s.',
  steps: [['1 / 4.', 0], ['= 0.25.', [], 'o0']],
  result: '0.25', resultCap: 'Clamp it to 1.0 once the time is up.',
}, `${D}::from_secs(1).div_duration_f32(${D}::from_secs(4)).to_string()`);

add('duration/saturating_add', 'saturating_add', null, 'How Duration::saturating_add works', 'Adds, stopping at Duration::MAX instead of overflowing.', {
  rows: [['MAX + 1 s']], call: 'Duration::MAX.saturating_add(Duration::from_secs(1))', note: 'clamped', outs: ['MAX'],
  intro: 'Never panics.',
  steps: [['MAX cannot grow.', 0], ['The result is MAX.', [], 'o0']],
  result: 'true', resultCap: 'checked_add reports the overflow instead.',
}, `(${D}::MAX.saturating_add(${D}::from_secs(1)) == ${D}::MAX).to_string()`);

add('duration/saturating_mul', 'saturating_mul', null, 'How Duration::saturating_mul works', 'Multiplies by a whole number, stopping at Duration::MAX.', {
  rows: [['2 s × 3', 'MAX × 2']], call: 'd.saturating_mul(n)', note: 'clamped', outs: ['6s', 'MAX'],
  intro: 'Useful for exponential back-off without overflow.',
  steps: [['2 s × 3 = 6 s.', 0, 'o0'], ['MAX × 2 stays MAX.', 1, 'o1']],
  result: '6s, true', resultCap: 'checked_mul returns None instead.',
}, `format!("{:?}, {}", ${D}::from_secs(2).saturating_mul(3), ${D}::MAX.saturating_mul(2) == ${D}::MAX)`);

add('duration/subsec_micros', 'subsec_micros', null, 'How Duration::subsec_micros works', 'The microseconds after the whole seconds.', {
  rows: [['1.0025 s']], call: 'd.subsec_micros()', note: 'only the fraction', outs: ['2500'],
  intro: '0.0025 s = 2500 µs.',
  steps: [['Whole seconds: 1.', 0], ['Left over: 2500 µs.', [], 'o0']],
  result: '2500', resultCap: 'Always below 1,000,000.',
}, `${D}::new(1, 2_500_000).subsec_micros().to_string()`);

add('duration/from_mins', 'from_mins', null, 'How Duration::from_mins works', 'A duration from minutes.', {
  rows: [['5']], call: 'Duration::from_mins(5)', note: '× 60 seconds', outs: ['300s'],
  intro: 'Reads better than from_secs(300).',
  steps: [['5 minutes.', 0], ['= 300 s.', [], 'o0']],
  result: '300s', resultCap: 'from_hours exists too.',
}, `d(${D}::from_mins(5))`);

add('duration/from_hours', 'from_hours', null, 'How Duration::from_hours works', 'A duration from hours.', {
  rows: [['2']], call: 'Duration::from_hours(2)', note: '× 3600 seconds', outs: ['7200s'],
  intro: 'For timeouts and cache lifetimes.',
  steps: [['2 hours.', 0], ['= 7200 s.', [], 'o0']],
  result: '7200s', resultCap: 'Panics if the value is too large.',
}, `d(${D}::from_hours(2))`);

add('instant/checked_sub', 'checked_sub', ['std', 'Instant', /^src\/time\.rs$/], 'How Instant::checked_sub works', 'An earlier Instant; None if it cannot be represented.', {
  rows: [['now − 1 s']], call: 'now.checked_sub(Duration::from_secs(1))', note: 'go back in time', outs: ['Some(earlier)'],
  intro: 'Instants near the clock\'s start cannot go back further.',
  steps: [['Subtract 1 s.', 0], ['The result is 1 s before now.', [], 'o0']],
  result: '1s', resultCap: 'checked_add goes forward.',
}, `let n = std::time::Instant::now() + ${D}::from_secs(10); let e = n.checked_sub(${D}::from_secs(1)).unwrap(); d(n - e)`);

add('systemtime/checked_add', 'checked_add', ['std', 'SystemTime', /^src\/time\.rs$/], 'How SystemTime::checked_add works', 'A later SystemTime; None if it cannot be represented.', {
  rows: [['EPOCH + 1 day']], call: 'UNIX_EPOCH.checked_add(Duration::from_secs(86_400))', note: 'compute dates safely', outs: ['2 January 1970'],
  intro: 'No panic on absurd durations.',
  steps: [['Start at the epoch.', 0], ['Add one day.', [], 'o0']],
  result: '86400s', resultCap: 'checked_sub goes back.',
}, `d(std::time::UNIX_EPOCH.checked_add(${D}::from_secs(86_400)).unwrap().duration_since(std::time::UNIX_EPOCH).unwrap())`);

add('systemtime/elapsed', 'elapsed', ['std', 'SystemTime', /^src\/time\.rs$/], 'How SystemTime::elapsed works', 'How much wall-clock time has passed since this SystemTime.', {
  rows: [['file modified time']], call: 'modified.elapsed()?', note: 'age of something', outs: ['Ok(duration)'],
  intro: 'Err if the clock was moved backwards since then.',
  steps: [['Compare with now.', 0], ['The difference.', [], 'o0']],
  result: 'at least 1 day: true', resultCap: 'For measuring code, prefer Instant.',
}, `format!("at least 1 day: {}", std::time::UNIX_EPOCH.elapsed().unwrap() >= ${D}::from_secs(86_400))`);

add('systemtime_error/duration', 'duration', ['std', 'SystemTimeError', /^src\/time\.rs$/], 'How SystemTimeError::duration works', 'By how much the "earlier" time was actually later.', {
  rows: [['EPOCH vs EPOCH + 5 s']], call: 'EPOCH.duration_since(later).unwrap_err().duration()', note: 'wrong order', outs: ['5s'],
  intro: 'duration_since fails when the argument is in the future; the error says by how much.',
  steps: [['The order is wrong.', 0], ['The gap is 5 s.', [], 'o0']],
  result: '5s', resultCap: 'Clock adjustments can cause this.',
}, `let later = std::time::UNIX_EPOCH + ${D}::from_secs(5); d(std::time::UNIX_EPOCH.duration_since(later).unwrap_err().duration())`);

// ---------------------------------------------------------------- process

add('command/args', 'args', P('Command'), 'How Command::args works', 'Adds several arguments at once.', {
  rows: [['["build", "--release"]']], call: 'Command::new("cargo").args(["build", "--release"])', note: 'a list of args', outs: ['cargo build --release'],
  intro: 'Each item is one argument, passed as-is.',
  steps: [['Two arguments.', 0], ['Added in order.', [], 'o0']],
  result: '["build", "--release"]', resultCap: 'arg() adds one at a time.',
}, PU + 'let mut c = Command::new("cargo"); c.args(["build", "--release"]); d(c.get_args().map(|a| a.to_string_lossy().into_owned()).collect::<Vec<_>>())');

add('command/get_args', 'get_args', P('Command'), 'How Command::get_args works', 'The arguments added so far.', {
  rows: [['git status -s']], call: 'cmd.get_args()', note: 'inspect before running', outs: ['["status", "-s"]'],
  intro: 'Handy for logging what will be run.',
  steps: [['The command was built.', 0], ['Its arguments.', [], 'o0']],
  result: '["status", "-s"]', resultCap: 'get_program gives the program name.',
}, PU + 'let mut c = Command::new("git"); c.arg("status").arg("-s"); d(c.get_args().map(|a| a.to_string_lossy().into_owned()).collect::<Vec<_>>())');

add('command/get_program', 'get_program', P('Command'), 'How Command::get_program works', 'The program the command will run.', {
  rows: [['Command::new("ls")']], call: 'cmd.get_program()', note: 'as given', outs: ['"ls"'],
  intro: 'Returns exactly what was passed to new().',
  steps: [['The command was created.', 0], ['Its program: "ls".', [], 'o0']],
  result: '"ls"', resultCap: 'Use it in error messages.',
}, PU + 'd(Command::new("ls").get_program())');

add('command/env', 'env', P('Command'), 'How Command::env works', 'Sets an environment variable for the child process only.', {
  rows: [['RUST_LOG=debug']], call: 'Command::new("app").env("RUST_LOG", "debug")', note: 'your own env is unchanged', outs: ['child sees RUST_LOG=debug'],
  intro: 'The parent\'s environment is not touched.',
  steps: [['The variable is recorded.', 0], ['The child will see it.', [], 'o0']],
  result: '[("RUST_LOG", Some("debug"))]', resultCap: 'envs sets several at once.',
}, PU + 'let mut c = Command::new("app"); c.env("RUST_LOG", "debug"); d(c.get_envs().map(|(k, v)| (k.to_string_lossy().into_owned(), v.map(|v| v.to_string_lossy().into_owned()))).collect::<Vec<_>>())');

add('command/envs', 'envs', P('Command'), 'How Command::envs works', 'Sets several environment variables for the child.', {
  rows: [['A=1', 'B=2']], call: 'cmd.envs([("A", "1"), ("B", "2")])', note: 'bulk env', outs: ['child sees A and B'],
  intro: 'Any iterator of (key, value) pairs works.',
  steps: [['Two variables.', [0, 1]], ['Both recorded.', [], 'o0']],
  result: '2', resultCap: 'Pass a HashMap of settings directly.',
}, PU + 'let mut c = Command::new("app"); c.envs([("A", "1"), ("B", "2")]); c.get_envs().count().to_string()');

add('command/env_remove', 'env_remove', P('Command'), 'How Command::env_remove works', 'Removes a variable from the child\'s environment.', {
  rows: [['parent has HOME']], call: 'cmd.env_remove("HOME")', note: 'hide a variable', outs: ['child has no HOME'],
  intro: 'Recorded as "remove" in get_envs (value None).',
  steps: [['HOME is marked for removal.', 0], ['The child will not see it.', [], 'o0']],
  result: '[("HOME", None)]', resultCap: 'env_clear removes everything.',
}, PU + 'let mut c = Command::new("app"); c.env_remove("HOME"); d(c.get_envs().map(|(k, v)| (k.to_string_lossy().into_owned(), v.map(|v| v.to_string_lossy().into_owned()))).collect::<Vec<_>>())');

add('command/env_clear', 'env_clear', P('Command'), 'How Command::env_clear works', 'Starts the child with an empty environment.', {
  rows: [['parent env']], call: 'cmd.env_clear().env("ONLY", "this")', note: 'a clean slate', outs: ['child sees only ONLY'],
  intro: 'Useful for reproducible or sandboxed runs.',
  steps: [['Inherited variables are dropped.', 0], ['Only explicit ones remain.', [], 'o0']],
  result: '1', resultCap: 'Some programs need PATH; add it back if so.',
}, PU + 'let mut c = Command::new("app"); c.env_clear().env("ONLY", "this"); c.get_envs().count().to_string()');

add('command/get_envs', 'get_envs', P('Command'), 'How Command::get_envs works', 'The environment changes recorded for the child.', {
  rows: [['set X', 'remove Y']], call: 'cmd.get_envs()', note: 'Some = set, None = removed', outs: ['("X", Some("1"))', '("Y", None)'],
  intro: 'Only changes are listed, not the inherited variables.',
  steps: [['X is set.', 0, 'o0'], ['Y is removed.', 1, 'o1']],
  result: '[("X", Some("1")), ("Y", None)]', resultCap: 'Sorted by key.',
}, PU + 'let mut c = Command::new("app"); c.env("X", "1").env_remove("Y"); d(c.get_envs().map(|(k, v)| (k.to_string_lossy().into_owned(), v.map(|v| v.to_string_lossy().into_owned()))).collect::<Vec<_>>())');

add('command/current_dir', 'current_dir', P('Command'), 'How Command::current_dir works', 'Sets the working directory for the child.', {
  rows: [['temp folder']], call: 'Command::new("rustc").current_dir(&dir).arg("--version")', note: 'where the child runs', outs: ['runs inside dir'],
  intro: 'Relative paths in the child resolve against this folder.',
  steps: [['The folder is recorded.', 0], ['The child starts there.', [], 'o0']],
  result: 'success: true', resultCap: 'get_current_dir reads it back.',
}, PU + 'let st = Command::new("rustc").current_dir(std::env::temp_dir()).arg("--version").stdout(Stdio::null()).status().unwrap(); format!("success: {}", st.success())');

add('command/get_current_dir', 'get_current_dir', P('Command'), 'How Command::get_current_dir works', 'The working directory set for the child, if any.', {
  rows: [['not set', 'set to "build"']], call: 'cmd.get_current_dir()', note: 'None = inherit', outs: ['None', 'Some("build")'],
  intro: 'None means the child uses the parent\'s directory.',
  steps: [['Not set: None.', 0, 'o0'], ['Set: Some.', 1, 'o1']],
  result: 'None, Some("build")', resultCap: 'Pairs with current_dir.',
}, PU + 'let mut c = Command::new("x"); let a = c.get_current_dir().map(|p| p.to_path_buf()); c.current_dir("build"); format!("{:?}, {:?}", a, c.get_current_dir())');

add('command/spawn', 'spawn', P('Command'), 'How Command::spawn works', 'Starts the child and returns immediately with a Child handle.', {
  rows: [['rustc --version']], call: 'let mut child = cmd.spawn()?; child.wait()?', note: 'runs in the background', outs: ['Child handle'],
  intro: 'Unlike output() and status(), spawn does not wait.',
  steps: [['The child starts.', 0], ['You continue; wait() later.', [], 'o0']],
  result: 'success: true', resultCap: 'Remember to wait, or the child may become a zombie on Unix.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::null()).spawn().unwrap(); format!("success: {}", ch.wait().unwrap().success())');

add('command/stdout', 'stdout', P('Command'), 'How Command::stdout works', 'Chooses where the child\'s standard output goes.', {
  rows: [['Stdio::piped()']], call: 'cmd.stdout(Stdio::piped()).spawn()?', note: 'capture output', outs: ['read it from child.stdout'],
  intro: 'piped() lets you read it; null() discards it; inherit() shows it.',
  steps: [['Output goes into a pipe.', 0], ['The parent reads it.', [], 'o0']],
  result: 'starts with rustc: true', resultCap: 'output() pipes stdout automatically.',
}, PU + 'use std::io::Read; let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::piped()).spawn().unwrap(); let mut s = String::new(); ch.stdout.take().unwrap().read_to_string(&mut s).unwrap(); ch.wait().unwrap(); format!("starts with rustc: {}", s.starts_with("rustc"))');

add('command/stderr', 'stderr', P('Command'), 'How Command::stderr works', 'Chooses where the child\'s error output goes.', {
  rows: [['rustc --bogus']], call: 'cmd.stderr(Stdio::piped()).output()?.stderr', note: 'capture errors', outs: ['error text'],
  intro: 'Error messages go to stderr, not stdout.',
  steps: [['The child prints an error.', 0], ['It lands in the pipe.', [], 'o0']],
  result: 'has error text: true, success: false', resultCap: 'Stdio::null() hides it.',
}, PU + 'let o = Command::new("rustc").arg("--this-flag-does-not-exist").stderr(Stdio::piped()).output().unwrap(); format!("has error text: {}, success: {}", !o.stderr.is_empty(), o.status.success())');

add('command/stdin', 'stdin', P('Command'), 'How Command::stdin works', 'Chooses where the child reads its standard input from.', {
  rows: [['Stdio::null()']], call: 'cmd.stdin(Stdio::null())', note: 'no input', outs: ['child reads EOF'],
  intro: 'piped() lets you write to it; null() gives immediate end-of-file.',
  steps: [['stdin is connected to nothing.', 0], ['The child sees EOF at once.', [], 'o0']],
  result: 'success: true', resultCap: 'Avoids children hanging while waiting for input.',
}, PU + 'let st = Command::new("rustc").arg("--version").stdin(Stdio::null()).stdout(Stdio::null()).status().unwrap(); format!("success: {}", st.success())');

add('stdio/piped', 'piped', P('Stdio'), 'How Stdio::piped works', 'Connects a child stream to a pipe the parent can use.', {
  rows: [['stdout(Stdio::piped())']], call: 'child.stdout.take()', note: 'read the child\'s output', outs: ['Some(ChildStdout)'],
  intro: 'The pipe appears as child.stdin/stdout/stderr.',
  steps: [['The stream becomes a pipe.', 0], ['The parent holds the other end.', [], 'o0']],
  result: 'true', resultCap: 'Read it before wait(), or a full pipe can block the child.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::piped()).spawn().unwrap(); let has = ch.stdout.is_some(); ch.wait().unwrap(); has.to_string()');

add('stdio/null', 'null', P('Stdio'), 'How Stdio::null works', 'Connects a child stream to nothing (discard output, empty input).', {
  rows: [['stdout(Stdio::null())']], call: 'cmd.stdout(Stdio::null())', note: 'silence', outs: ['output thrown away'],
  intro: 'Like redirecting to /dev/null.',
  steps: [['Output is discarded.', 0], ['No pipe is created.', [], 'o0']],
  result: 'true', resultCap: 'For stdin it means immediate end-of-file.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::null()).spawn().unwrap(); let none = ch.stdout.is_none(); ch.wait().unwrap(); none.to_string()');

add('stdio/inherit', 'inherit', P('Stdio'), 'How Stdio::inherit works', 'The child shares the parent\'s stream (e.g. prints to your terminal).', {
  rows: [['stdout(Stdio::inherit())']], call: 'cmd.stdout(Stdio::inherit())', note: 'the default for spawn/status', outs: ['child prints directly'],
  intro: 'No pipe; the output goes where yours goes.',
  steps: [['The terminal is shared.', 0], ['Nothing to read in the parent.', [], 'o0']],
  result: 'true', resultCap: 'output() uses piped instead.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::inherit()).stdout(Stdio::null()).spawn().unwrap(); let none = ch.stdout.is_none(); ch.wait().unwrap(); none.to_string()');

add('child/wait', 'wait', P('Child'), 'How Child::wait works', 'Waits for the child to exit and returns its status.', {
  rows: [['running child']], call: 'let status = child.wait()?;', note: 'blocks', outs: ['ExitStatus'],
  intro: 'Closes the child\'s stdin first, so it is not left waiting for input.',
  steps: [['The child runs to the end.', 0], ['Its exit status.', [], 'o0']],
  result: 'success: true', resultCap: 'try_wait checks without blocking.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::null()).spawn().unwrap(); format!("success: {}", ch.wait().unwrap().success())');

add('child/wait_with_output', 'wait_with_output', P('Child'), 'How Child::wait_with_output works', 'Waits for the child and collects its piped output.', {
  rows: [['spawned with stdout piped']], call: 'let out = child.wait_with_output()?;', note: 'wait + read', outs: ['status, stdout, stderr'],
  intro: 'Reads the pipes while waiting, so a full pipe cannot block.',
  steps: [['The child finishes.', 0], ['Its output is collected.', [], 'o0']],
  result: 'starts with rustc: true', resultCap: 'Same result as Command::output.',
}, PU + 'let ch = Command::new("rustc").arg("--version").stdout(Stdio::piped()).spawn().unwrap(); let o = ch.wait_with_output().unwrap(); format!("starts with rustc: {}", String::from_utf8_lossy(&o.stdout).starts_with("rustc"))');

add('child/try_wait', 'try_wait', P('Child'), 'How Child::try_wait works', 'Checks if the child has exited, without blocking.', {
  rows: [['still running', 'finished']], call: 'child.try_wait()?', note: 'Ok(None) or Ok(Some(status))', outs: ['None', 'Some(status)'],
  intro: 'Poll a child while doing other work.',
  steps: [['Still running: None.', 0, 'o0'], ['Exited: Some(status).', 1, 'o1']],
  result: 'Some(success)', resultCap: 'Loop with a short sleep, or use wait.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::null()).spawn().unwrap(); let st = loop { if let Some(s) = ch.try_wait().unwrap() { break s; } std::thread::sleep(std::time::Duration::from_millis(5)); }; format!("Some({})", if st.success() { "success" } else { "failure" })');

add('child/kill', 'kill', P('Child'), 'How Child::kill works', 'Forces the child process to stop.', {
  rows: [['child waiting for input']], call: 'child.kill()?; child.wait()?', note: 'terminate', outs: ['stopped, not successful'],
  intro: 'Then wait() collects the exit status.',
  steps: [['The child is killed.', 0], ['wait() reports it did not succeed.', [], 'o0']],
  result: 'success: false', resultCap: 'On Unix this sends SIGKILL.',
}, PU + 'let mut ch = Command::new("rustc").arg("-").stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().unwrap(); ch.kill().unwrap(); format!("success: {}", ch.wait().unwrap().success())');

add('child/id', 'id', P('Child'), 'How Child::id works', 'The operating-system process ID of the child.', {
  rows: [['spawned child']], call: 'child.id()', note: 'PID', outs: ['e.g. 4242'],
  intro: 'Useful for logging or OS tools.',
  steps: [['The OS assigns a PID.', 0], ['id() returns it.', [], 'o0']],
  result: 'nonzero: true', resultCap: 'IDs are reused after the process exits.',
}, PU + 'let mut ch = Command::new("rustc").arg("--version").stdout(Stdio::null()).spawn().unwrap(); let id = ch.id(); ch.wait().unwrap(); format!("nonzero: {}", id != 0)');

add('exit_status/success', 'success', P('ExitStatus'), 'How ExitStatus::success works', 'true if the process exited with code 0.', {
  rows: [['rustc --version', 'rustc --bad-flag']], call: 'status.success()', note: '0 means success', outs: ['true', 'false'],
  intro: 'Programs signal failure with a non-zero exit code.',
  steps: [['Valid command: true.', 0, 'o0'], ['Invalid flag: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'code() gives the actual number.',
}, PU + 'let a = Command::new("rustc").arg("--version").stdout(Stdio::null()).status().unwrap().success(); let b = Command::new("rustc").arg("--bad-flag-x").stderr(Stdio::null()).status().unwrap().success(); format!("{}, {}", a, b)');

add('exit_status/code', 'code', P('ExitStatus'), 'How ExitStatus::code works', 'The numeric exit code, if the process exited normally.', {
  rows: [['rustc --version']], call: 'status.code()', note: 'None if killed by a signal', outs: ['Some(0)'],
  intro: '0 is success; other numbers are program-specific errors.',
  steps: [['The child exited normally.', 0], ['Code 0.', [], 'o0']],
  result: 'Some(0)', resultCap: 'Return your own with std::process::exit(code).',
}, PU + 'd(Command::new("rustc").arg("--version").stdout(Stdio::null()).status().unwrap().code())');

add('process/id', 'id', ['std', '', /^src\/process\.rs$/], 'How process::id works', 'The process ID of the current program.', {
  rows: [['this program']], call: 'std::process::id()', note: 'my PID', outs: ['e.g. 1234'],
  intro: 'Handy for log lines and lock files.',
  steps: [['The OS knows our PID.', 0], ['id() returns it.', [], 'o0']],
  result: 'nonzero: true', resultCap: 'Child::id gives a child\'s PID.',
}, 'format!("nonzero: {}", std::process::id() != 0)');

// ---------------------------------------------------------------- env

add('env/vars', 'vars', ENV, 'How env::vars works', 'All environment variables as (name, value) pairs.', {
  rows: [['PATH=...', 'HOME=...']], call: 'for (k, v) in env::vars() { ... }', note: 'everything set', outs: ['many pairs'],
  intro: 'Panics if a variable is not valid Unicode; vars_os never does.',
  steps: [['Every variable is listed.', [0, 1]], ['As String pairs.', [], 'o0']],
  result: 'some variables: true', resultCap: 'Order is unspecified.',
}, 'format!("some variables: {}", std::env::vars().count() > 0)');

add('env/vars_os', 'vars_os', ENV, 'How env::vars_os works', 'All environment variables as OsString pairs.', {
  rows: [['every variable']], call: 'env::vars_os()', note: 'never panics', outs: ['(OsString, OsString) pairs'],
  intro: 'Safe even for non-Unicode values.',
  steps: [['Every variable.', 0], ['As OsString pairs.', [], 'o0']],
  result: 'same count as vars: true', resultCap: 'Convert with to_string_lossy when printing.',
}, 'format!("same count as vars: {}", std::env::vars_os().count() >= std::env::vars().count())');

add('env/args_os', 'args_os', ENV, 'How env::args_os works', 'The command-line arguments as OsStrings.', {
  rows: [['prog', 'file.txt']], call: 'env::args_os().skip(1)', note: 'safe for any bytes', outs: ['OsString args'],
  intro: 'File names may not be valid Unicode; args() would panic on them.',
  steps: [['The first is the program.', 0], ['The rest are the user\'s arguments.', 1, 'o0']],
  result: 'at least 1: true', resultCap: 'args() gives Strings instead.',
}, 'format!("at least 1: {}", std::env::args_os().count() >= 1)');

add('env/current_exe', 'current_exe', ENV, 'How env::current_exe works', 'The full path of the running program.', {
  rows: [['this program']], call: 'env::current_exe()?', note: 'where am I installed?', outs: ['…/target/debug/app'],
  intro: 'Use it to find files shipped next to the executable.',
  steps: [['The OS reports the path.', 0], ['An absolute PathBuf.', [], 'o0']],
  result: 'absolute: true', resultCap: 'Do not use it for security decisions: it can be spoofed.',
}, 'format!("absolute: {}", std::env::current_exe().unwrap().is_absolute())');

add('env/home_dir', 'home_dir', ENV, 'How env::home_dir works', 'The current user\'s home folder.', {
  rows: [['Linux', 'Windows']], call: 'env::home_dir()', note: 'Option<PathBuf>', outs: ['/home/ann', 'C:\\Users\\ann'],
  intro: 'Uses HOME / USERPROFILE and system calls.',
  steps: [['Linux: /home/…', 0, 'o0'], ['Windows: C:\\Users\\…', 1, 'o1']],
  result: 'found: true', resultCap: 'Config folders: home.join(".config").',
}, 'format!("found: {}", std::env::home_dir().is_some())');

add('env/split_paths', 'split_paths', ENV, 'How env::split_paths works', 'Splits a PATH-style variable into separate paths.', {
  rows: [['"a:b" (or "a;b" on Windows)']], call: 'env::split_paths(&path_var)', note: 'the OS separator', outs: ['"a"', '"b"'],
  intro: 'Uses : on Unix and ; on Windows.',
  steps: [['The separator is found.', 0], ['Two paths.', [], 'o0,1']],
  result: '["a", "b"]', resultCap: 'join_paths goes the other way.',
}, 'let joined = std::env::join_paths(["a", "b"]).unwrap(); d(std::env::split_paths(&joined).map(|p| p.to_string_lossy().into_owned()).collect::<Vec<_>>())');

add('env/join_paths', 'join_paths', ENV, 'How env::join_paths works', 'Joins paths into one PATH-style value.', {
  rows: [['"bin"', '"tools"']], call: 'env::join_paths(["bin", "tools"])?', note: 'for setting PATH', outs: ['"bin:tools" or "bin;tools"'],
  intro: 'Fails if a path contains the separator itself.',
  steps: [['Two paths.', [0, 1]], ['Joined with the OS separator.', [], 'o0']],
  result: 'round trip: true', resultCap: 'Pass the result to Command::env("PATH", ...).',
}, 'let j = std::env::join_paths(["bin", "tools"]).unwrap(); let back: Vec<_> = std::env::split_paths(&j).collect(); format!("round trip: {}", back == vec![std::path::PathBuf::from("bin"), std::path::PathBuf::from("tools")])');

add('env/set_current_dir', 'set_current_dir', ENV, 'How env::set_current_dir works', 'Changes the working directory of the whole program.', {
  rows: [['cd temp']], call: 'env::set_current_dir(&dir)?', note: 'affects every thread', outs: ['relative paths now resolve there'],
  intro: 'It changes global state; prefer passing full paths.',
  steps: [['The process moves to the folder.', 0], ['current_dir() reports it.', [], 'o0']],
  result: 'moved: true', resultCap: 'Command::current_dir changes it only for a child.',
}, 'let old = std::env::current_dir().unwrap(); let t = std::env::temp_dir().canonicalize().unwrap(); std::env::set_current_dir(&t).unwrap(); let moved = std::env::current_dir().unwrap().canonicalize().unwrap() == t; std::env::set_current_dir(&old).unwrap(); format!("moved: {}", moved)');

module.exports = list;
