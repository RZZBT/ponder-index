// Rust standard library: conversions (parse, to_string, from/into, try_from), comparisons (Ord, Ordering, cmp),
// bool, and the ASCII methods of u8.
// rust-analyzer sends `parse`, `to_string`, `into` and `from` to the implementation for the concrete type (for
// "5".parse::<i32>() that is from_str inside the macro from_str_int_impl!), so these animations live there.
const { group } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'Ord', /^src\/cmp\.rs$/] });
const ORD_IMPL = ['core', 'ord_impl', /^src\/cmp\.rs$/];
const EQ_IMPL = ['core', 'partial_eq_impl', /^src\/cmp\.rs$/];
const ORDERING = ['core', 'Ordering', /^src\/cmp\.rs$/];
const CMP = ['core', '', /^src\/cmp\.rs$/];
const BOOL = ['core', 'bool', /^src\/bool\.rs$/];
const U8 = ['core', 'u8', /num\/mod\.rs$/];

// ---------------------------------------------------------------- parse

add('parse/int', 'from_str', ['core', 'from_str_int_impl', /num\/mod\.rs$/], 'How parse works for integers', 'Turns text such as "42" into an integer, or an error if it is not a valid number.', {
  rows: [['"42"', '"-7"', '"4x"', '"300" as u8']], call: '"42".parse::<i32>()', note: 'str → integer', outs: ['Ok(42)', 'Ok(-7)', 'Err(InvalidDigit)', 'Err(PosOverflow)'],
  intro: 'The type you ask for decides what counts as valid: its sign and its range.',
  steps: [['"42" is a valid i32.', 0, 'o0'], ['"-7": a minus sign is fine for signed types.', 1, 'o1'], ['"4x" contains a letter: InvalidDigit.', 2, 'o2'], ['300 is too big for a u8: PosOverflow.', 3, 'o3']],
  result: 'Ok(42), Ok(-7), Err(InvalidDigit), Err(PosOverflow)', resultCap: 'Spaces are not allowed: call trim() first. Use ? or match to handle the Err.',
}, 'let k = |r: Result<i64, std::num::ParseIntError>| match r { Ok(v) => format!("Ok({})", v), Err(e) => format!("Err({:?})", e.kind()) }; let u = match "300".parse::<u8>() { Ok(v) => format!("Ok({})", v), Err(e) => format!("Err({:?})", e.kind()) }; format!("{}, {}, {}, {}", k("42".parse::<i32>().map(i64::from)), k("-7".parse::<i32>().map(i64::from)), k("4x".parse::<i32>().map(i64::from)), u)');

add('parse/float', 'from_str', ['core', 'from_str_float_impl', /num\/float_parse\.rs$/], 'How parse works for floats', 'Turns text such as "2.5" or "1e3" into an f64 or f32.', {
  rows: [['"2.5"', '"1e3"', '"inf"', '"2,5"']], call: '"2.5".parse::<f64>()', note: 'str → float', outs: ['Ok(2.5)', 'Ok(1000.0)', 'Ok(inf)', 'Err'],
  intro: 'Float parsing accepts decimals, exponents and the words inf and NaN.',
  steps: [['"2.5" → 2.5.', 0, 'o0'], ['"1e3" means 1 × 10³ = 1000.', 1, 'o1'], ['"inf" is infinity.', 2, 'o2'], ['A comma is not a decimal point: Err.', 3, 'o3']],
  result: 'Ok(2.5), Ok(1000.0), Ok(inf), Err', resultCap: 'Rust always uses a dot, whatever the computer\'s language settings are.',
}, 'let k = |s: &str| match s.parse::<f64>() { Ok(v) => format!("Ok({:?})", v), Err(_) => "Err".to_string() }; format!("{}, {}, {}, {}", k("2.5"), k("1e3"), k("inf"), k("2,5"))');

add('parse/bool', 'from_str', ['core', 'bool', /str\/traits\.rs$/], 'How parse works for bool', 'Accepts exactly "true" or "false".', {
  rows: [['"true"', '"false"', '"True"', '"1"']], call: '"true".parse::<bool>()', note: 'strict spelling', outs: ['Ok(true)', 'Ok(false)', 'Err', 'Err'],
  intro: 'Only the two lowercase words are accepted.',
  steps: [['"true" and "false" work.', [0, 1], 'o0,1'], ['"True" (capital T) and "1" are errors.', [2, 3], 'o2,3']],
  result: 'Ok(true), Ok(false), Err, Err', resultCap: 'For yes/no input, match on s.to_lowercase().as_str() yourself.',
}, 'let k = |s: &str| match s.parse::<bool>() { Ok(v) => format!("Ok({})", v), Err(_) => "Err".to_string() }; format!("{}, {}, {}, {}", k("true"), k("false"), k("True"), k("1"))');

add('parse/char', 'from_str', ['core', 'char', /char\/convert\.rs$/], 'How parse works for char', 'Turns a string of exactly one character into a char.', {
  rows: [['"x"', '"é"', '"xy"', '""']], call: '"x".parse::<char>()', note: 'one character only', outs: ["Ok('x')", "Ok('é')", 'Err', 'Err'],
  intro: 'The string must contain exactly one char (it may be several bytes long).',
  steps: [['"x" and "é" are single characters.', [0, 1], 'o0,1'], ['Two characters, or none, is an error.', [2, 3], 'o2,3']],
  result: "Ok('x'), Ok('é'), Err, Err", resultCap: 's.chars().next() gets the first char of any string instead.',
}, 'let k = |s: &str| match s.parse::<char>() { Ok(v) => format!("Ok({:?})", v), Err(_) => "Err".to_string() }; format!("{}, {}, {}, {}", k("x"), k("é"), k("xy"), k(""))');

// ---------------------------------------------------------------- to_string

add('to_string/int', 'fmt', ['core', 'impl_Display', /fmt\/num\.rs$/], 'How to_string works for integers', 'Writes the number as decimal text.', {
  rows: [['42', '-7', '1_000']], call: '42.to_string()', note: 'integer → String', outs: ['"42"', '"-7"', '"1000"'],
  intro: 'to_string uses the Display formatting: plain decimal digits, with a minus sign if negative.',
  steps: [['42 → "42".', 0, 'o0'], ['-7 → "-7".', 1, 'o1'], ['The _ in 1_000 is only for reading the source code: "1000".', 2, 'o2']],
  result: '"42", "-7", "1000"', resultCap: 'For padding or hex use format!: format!("{:05}", 42) is "00042", format!("{:x}", 255) is "ff".',
}, 'format!("{:?}, {:?}, {:?}", 42.to_string(), (-7).to_string(), 1_000.to_string())');

add('to_string/float', 'fmt', ['core', 'floating', /fmt\/float\.rs$/], 'How to_string works for floats', 'Writes the shortest text that reads back as the same float.', {
  rows: [['2.5', '1.0', '0.1 + 0.2']], call: '2.5.to_string()', note: 'float → String', outs: ['"2.5"', '"1"', '"0.30000000000000004"'],
  intro: 'Display drops a trailing .0 and shows every digit needed to be exact.',
  steps: [['2.5 → "2.5".', 0, 'o0'], ['1.0 → "1" (Display has no .0; {:?} would show 1.0).', 1, 'o1'], ['0.1 + 0.2 is not exactly 0.3 in binary, and it shows.', 2, 'o2']],
  result: '"2.5", "1", "0.30000000000000004"', resultCap: 'Round for people: format!("{:.2}", x) gives two decimals.',
}, 'format!("{:?}, {:?}, {:?}", 2.5_f64.to_string(), 1.0_f64.to_string(), (0.1_f64 + 0.2).to_string())');

add('to_string/char', 'fmt', ['core', 'char', /fmt\/mod\.rs$/], 'How to_string works for char', 'Makes a one-character String.', {
  rows: [["'a'", "'🦀'"]], call: "'a'.to_string()", note: 'char → String', outs: ['"a"', '"🦀"'],
  intro: 'The String holds the character\'s UTF-8 bytes: 1 byte for a, 4 for the crab.',
  steps: [["'a' → \"a\".", 0, 'o0'], ["'🦀' → \"🦀\".", 1, 'o1']],
  result: '"a", "🦀"', resultCap: 'String::from(c) does the same. To add a char to an existing String, use push.',
}, 'format!("{:?}, {:?}", \'a\'.to_string(), \'🦀\'.to_string())');

add('to_string/str', 'fmt', ['core', 'str', /fmt\/mod\.rs$/], 'How to_string works for &str', 'Copies borrowed text into a new, owned String.', {
  rows: [['"hello" (borrowed)']], call: '"hello".to_string()', note: '&str → String', outs: ['String "hello" (owned)'],
  intro: 'A &str only borrows its text. to_string makes a String that owns a copy.',
  steps: [['The bytes h, e, l, l, o are copied...', 0], ['...into a new heap buffer the String owns.', [], 'o0']],
  result: '"hello"', resultCap: 'String::from("hello") and "hello".to_owned() do exactly the same.',
}, 'd("hello".to_string())');

add('to_string/string', 'fmt', ['alloc', 'String', /^src\/string\.rs$/], 'How to_string works for String', 'Makes a copy of a String.', {
  rows: [['a = "hi"']], call: 'let b = a.to_string();', note: 'same as clone()', outs: ['a = "hi"', 'b = "hi"'],
  intro: 'Calling to_string on a String clones it; both stay usable.',
  steps: [['a keeps its text.', 0, 'o0'], ['b gets its own copy.', 0, 'o1']],
  result: 'a = "hi", b = "hi"', resultCap: 'Prefer a.clone(): it says what happens. Pass &a when a borrow is enough.',
}, 'let a = String::from("hi"); let b = a.to_string(); format!("a = {:?}, b = {:?}", a, b)');

// ---------------------------------------------------------------- from / into / try_from

add('from/int', 'from', ['core', 'impl_from', /convert\/num\.rs$/], 'How From/Into work between integers', 'Converts to a bigger integer type, which can never fail.', {
  rows: [['200u8', '-5i32']], call: 'let x: i64 = (-5i32).into();', note: 'only lossless conversions', outs: ['200u16', '-5i64'],
  intro: 'From exists only where every value fits: u8 → u16, i32 → i64, but not i64 → i32.',
  steps: [['u16::from(200u8) is 200.', 0, 'o0'], ['(-5i32).into() as i64 is -5.', 1, 'o1']],
  result: '200, -5', resultCap: 'For conversions that may fail (i64 → u8) use try_from. as never fails but may silently cut values.',
}, 'let x: i64 = (-5i32).into(); format!("{}, {}", u16::from(200u8), x)');

add('try_from/int', 'try_from', [['core', 'impl_try_from_upper_bounded', /convert\/num\.rs$/], ['core', 'impl_try_from_lower_bounded', /convert\/num\.rs$/], ['core', 'impl_try_from_both_bounded', /convert\/num\.rs$/]],
  'How TryFrom works between integers', 'Converts to another integer type, with an error if the value does not fit.', {
  rows: [['100i32 → u8', '300i32 → u8', '-1i32 → u8']], call: 'u8::try_from(300i32)', note: 'u8 is 0..=255', outs: ['Ok(100)', 'Err', 'Err'],
  intro: 'try_from checks the range before converting.',
  steps: [['100 fits in a u8.', 0, 'o0'], ['300 is too big: Err.', 1, 'o1'], ['-1 is negative: Err.', 2, 'o2']],
  result: 'Ok(100), Err, Err', resultCap: 'Compare: 300i32 as u8 silently gives 44. try_from (or .try_into()) is the safe choice.',
}, 'let k = |x: i32| match u8::try_from(x) { Ok(v) => format!("Ok({})", v), Err(_) => "Err".to_string() }; format!("{}, {}, {}", k(100), k(300), k(-1))');

add('vec/from', 'from', ['alloc', 'Vec', /vec\/mod\.rs$/], 'How Vec::from works', 'Builds a Vec from an array, a slice, a string or another collection.', {
  rows: [['[1, 2, 3]', '"hi"']], call: 'Vec::from([1, 2, 3])', note: 'one name, many sources', outs: ['[1, 2, 3]', '[104, 105]'],
  intro: 'Vec implements From for many types; the argument decides which one runs.',
  steps: [['An array becomes a Vec with the same items.', 0, 'o0'], ['A &str becomes its UTF-8 bytes.', 1, 'o1']],
  result: '[1, 2, 3], [104, 105]', resultCap: 'vec![1, 2, 3] is the usual way to write the first one.',
}, 'format!("{:?}, {:?}", Vec::from([1, 2, 3]), Vec::from("hi"))');

// ---------------------------------------------------------------- Ord, PartialEq

add('ord/max', 'max', null, 'How Ord::max works', 'The larger of two values.', {
  rows: [['3.max(9)', '"pear".max("apple")']], call: 'a.max(b)', note: 'any type that can be ordered', outs: ['9', '"pear"'],
  intro: 'max compares the two values with cmp and returns the larger one.',
  steps: [['9 > 3.', 0, 'o0'], ['"pear" comes after "apple" alphabetically.', 1, 'o1']],
  result: '9, "pear"', resultCap: 'If both are equal, max returns the second one. For floats use f64::max.',
}, 'format!("{}, {:?}", 3.max(9), "pear".max("apple"))');

add('ord/min', 'min', null, 'How Ord::min works', 'The smaller of two values.', {
  rows: [['3.min(9)', '"b".min("a")']], call: 'a.min(b)', note: 'any ordered type', outs: ['3', '"a"'],
  intro: 'min compares the two values and returns the smaller one.',
  steps: [['3 < 9.', 0, 'o0'], ['"a" comes before "b".', 1, 'o1']],
  result: '3, "a"', resultCap: 'For a whole list use iter().min(), which returns an Option.',
}, 'format!("{}, {:?}", 3.min(9), "b".min("a"))');

add('ord/clamp', 'clamp', null, 'How Ord::clamp works', 'Keeps a value inside a range [min, max].', {
  rows: [['"m"', '"a"', '"z"']], call: 's.clamp("c", "x")', note: 'works for any Ord type', outs: ['"m"', '"c"', '"x"'],
  intro: 'Values below min become min; values above max become max.',
  steps: [['"m" is inside: unchanged.', 0, 'o0'], ['"a" is below: "c".', 1, 'o1'], ['"z" is above: "x".', 2, 'o2']],
  result: '"m", "c", "x"', resultCap: 'It panics if min > max.',
}, 'format!("{:?}, {:?}, {:?}", "m".clamp("c", "x"), "a".clamp("c", "x"), "z".clamp("c", "x"))');

add('ord/int_clamp', 'clamp', ORD_IMPL, 'How clamp works for integers', 'Keeps a number between a lower and an upper limit.', {
  rows: [['-5', '50', '500']], call: 'x.clamp(0, 100)', note: 'like a percentage', outs: ['0', '50', '100'],
  intro: 'clamp(lo, hi) is x.max(lo).min(hi) in one call.',
  steps: [['-5 is below 0: 0.', 0, 'o0'], ['50 is inside: 50.', 1, 'o1'], ['500 is above 100: 100.', 2, 'o2']],
  result: '0, 50, 100', resultCap: 'It panics if lo > hi. Floats have their own f64::clamp.',
}, 'format!("{}, {}, {}", (-5i32).clamp(0, 100), 50i32.clamp(0, 100), 500i32.clamp(0, 100))');

add('ord/int_cmp', 'cmp', ORD_IMPL, 'How cmp works for integers', 'Compares two numbers: Less, Equal or Greater.', {
  rows: [['3 vs 7', '7 vs 7', '9 vs 7']], call: 'a.cmp(&b)', note: 'one answer, three cases', outs: ['Less', 'Equal', 'Greater'],
  intro: 'cmp returns an Ordering, which a match can handle completely.',
  steps: [['3 < 7: Less.', 0, 'o0'], ['7 == 7: Equal.', 1, 'o1'], ['9 > 7: Greater.', 2, 'o2']],
  result: 'Less, Equal, Greater', resultCap: 'match guess.cmp(&secret) { Less => ..., Greater => ..., Equal => ... } is the classic guessing-game loop.',
}, 'format!("{:?}, {:?}, {:?}", 3.cmp(&7), 7.cmp(&7), 9.cmp(&7))');

add('ord/int_partial_cmp', 'partial_cmp', ORD_IMPL, 'How partial_cmp works for integers', 'cmp wrapped in Some: integers can always be compared.', {
  rows: [['2 vs 5']], call: '2.partial_cmp(&5)', note: 'PartialOrd', outs: ['Some(Less)'],
  intro: 'partial_cmp returns an Option because some types (floats with NaN) cannot always be compared. Integers always can.',
  steps: [['2 < 5.', 0], ['Wrapped in Some.', [], 'o0']],
  result: 'Some(Less)', resultCap: 'For floats, 1.0.partial_cmp(&f64::NAN) is None.',
}, 'd(2.partial_cmp(&5))');

add('eq/int', 'eq', EQ_IMPL, 'How == works for numbers', 'PartialEq::eq: true when both values are the same.', {
  rows: [['4 == 4', '4 == 5']], call: 'a == b   // calls a.eq(&b)', note: 'the == operator', outs: ['true', 'false'],
  intro: 'Writing a == b calls eq behind the scenes.',
  steps: [['4 and 4 are equal.', 0, 'o0'], ['4 and 5 are not.', 1, 'o1']],
  result: 'true, false', resultCap: 'Different number types cannot be compared directly: 4i32 == 4i64 does not compile; convert one first.',
}, 'format!("{}, {}", 4i32.eq(&4), 4i32.eq(&5))');

// ---------------------------------------------------------------- Ordering, cmp:: functions

add('ordering/is_lt', 'is_lt', ORDERING, 'How Ordering::is_lt works', 'true if the Ordering is Less.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_lt()', note: 'same as a < b', outs: ['true', 'false', 'false'],
  intro: 'The is_* methods turn an Ordering back into a yes/no question.',
  steps: [['Less: true.', 0, 'o0'], ['Equal and Greater: false.', [1, 2], 'o1,2']],
  result: 'true, false, false', resultCap: 'is_le, is_gt, is_ge, is_eq and is_ne exist too.',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_lt(), Equal.is_lt(), Greater.is_lt())');

add('ordering/is_le', 'is_le', ORDERING, 'How Ordering::is_le works', 'true if the Ordering is Less or Equal.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_le()', note: 'same as a <= b', outs: ['true', 'true', 'false'],
  intro: 'is_le means "not Greater".',
  steps: [['Less and Equal: true.', [0, 1], 'o0,1'], ['Greater: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'Handy in sort checks: w[0].cmp(&w[1]).is_le().',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_le(), Equal.is_le(), Greater.is_le())');

add('ordering/is_gt', 'is_gt', ORDERING, 'How Ordering::is_gt works', 'true if the Ordering is Greater.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_gt()', note: 'same as a > b', outs: ['false', 'false', 'true'],
  intro: 'Only Greater answers true.',
  steps: [['Less and Equal: false.', [0, 1], 'o0,1'], ['Greater: true.', 2, 'o2']],
  result: 'false, false, true', resultCap: 'Useful when you already have an Ordering from a custom comparison.',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_gt(), Equal.is_gt(), Greater.is_gt())');

add('ordering/is_ge', 'is_ge', ORDERING, 'How Ordering::is_ge works', 'true if the Ordering is Greater or Equal.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_ge()', note: 'same as a >= b', outs: ['false', 'true', 'true'],
  intro: 'is_ge means "not Less".',
  steps: [['Less: false.', 0, 'o0'], ['Equal and Greater: true.', [1, 2], 'o1,2']],
  result: 'false, true, true', resultCap: 'The opposite of is_lt.',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_ge(), Equal.is_ge(), Greater.is_ge())');

add('ordering/is_eq', 'is_eq', ORDERING, 'How Ordering::is_eq works', 'true if the Ordering is Equal.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_eq()', note: 'a tie', outs: ['false', 'true', 'false'],
  intro: 'is_eq checks for a tie.',
  steps: [['Less and Greater: false.', [0, 2], 'o0,2'], ['Equal: true.', 1, 'o1']],
  result: 'false, true, false', resultCap: 'is_ne is the opposite.',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_eq(), Equal.is_eq(), Greater.is_eq())');

add('ordering/is_ne', 'is_ne', ORDERING, 'How Ordering::is_ne works', 'true unless the Ordering is Equal.', {
  rows: [['Less', 'Equal', 'Greater']], call: 'a.cmp(&b).is_ne()', note: 'not a tie', outs: ['true', 'false', 'true'],
  intro: 'is_ne is true for Less and for Greater.',
  steps: [['Less and Greater: true.', [0, 2], 'o0,2'], ['Equal: false.', 1, 'o1']],
  result: 'true, false, true', resultCap: 'Same as !ordering.is_eq().',
}, 'use std::cmp::Ordering::*; format!("{}, {}, {}", Less.is_ne(), Equal.is_ne(), Greater.is_ne())');

add('ordering/then_with', 'then_with', ORDERING, 'How Ordering::then_with works', 'A tie-breaker that is only computed when needed.', {
  rows: [['("ann", 30)', '("bob", 25)', '("al", 30)']], call: 'v.sort_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(b.0)))', note: 'by age, then by name', outs: [null, null, null],
  intro: 'then_with runs its closure only when the first comparison is Equal.',
  steps: [['bob is youngest: first.', 1, 'm0'], ['ann and al are both 30: the names decide, al before ann.', [2, 0], { move: { a2: 1, a0: 2 } }, 'tie → closure runs']],
  result: '[("bob", 25), ("al", 30), ("ann", 30)]', resultCap: 'then takes a ready Ordering; then_with avoids computing it when not needed.',
}, 'let mut v = vec![("ann", 30), ("bob", 25), ("al", 30)]; v.sort_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(b.0))); d(v)');

add('cmp/max_by_key', 'max_by_key', CMP, 'How cmp::max_by_key works', 'The larger of two values, compared by a key.', {
  rows: [['-8', '5']], call: 'std::cmp::max_by_key(-8, 5, |x: &i32| x.abs())', note: 'by size, ignoring the sign', outs: ['-8'],
  intro: 'Each value is turned into a key; the keys are compared.',
  steps: [['Keys: |-8| = 8 and |5| = 5.', [0, 1]], ['8 is larger, so -8 wins.', 0, 'o0']],
  result: '-8', resultCap: 'min_by_key, max_by and min_by work the same way. For more than two values use the Iterator versions.',
}, 'std::cmp::max_by_key(-8, 5, |x: &i32| x.abs()).to_string()');

add('cmp/min_by_key', 'min_by_key', CMP, 'How cmp::min_by_key works', 'The smaller of two values, compared by a key.', {
  rows: [['"pear"', '"fig"']], call: 'std::cmp::min_by_key("pear", "fig", |s| s.len())', note: 'shortest word', outs: ['"fig"'],
  intro: 'The keys are the lengths: 4 and 3.',
  steps: [['"pear" has 4 letters, "fig" 3.', [0, 1]], ['3 is smaller: "fig".', 1, 'o0']],
  result: '"fig"', resultCap: 'On a tie, min_by_key returns the first value.',
}, 'd(std::cmp::min_by_key("pear", "fig", |s: &&str| s.len()))');

add('cmp/max_by', 'max_by', CMP, 'How cmp::max_by works', 'The larger of two values, using your own comparison.', {
  rows: [['2.5', '-1.0']], call: 'std::cmp::max_by(2.5, -1.0, |a: &f64, b: &f64| a.total_cmp(b))', note: 'floats need a comparison', outs: ['2.5'],
  intro: 'The closure returns an Ordering for the two values.',
  steps: [['total_cmp says 2.5 > -1.0.', [0, 1]], ['So max_by returns 2.5.', 0, 'o0']],
  result: '2.5', resultCap: 'Same as std::cmp::max, but works for types without Ord, like f64.',
}, 'std::cmp::max_by(2.5_f64, -1.0, |a: &f64, b: &f64| a.total_cmp(b)).to_string()');

add('cmp/min_by', 'min_by', CMP, 'How cmp::min_by works', 'The smaller of two values, using your own comparison.', {
  rows: [['(1, "b")', '(1, "a")']], call: 'std::cmp::min_by(x, y, |a, b| a.1.cmp(b.1))', note: 'compare the second field', outs: ['(1, "a")'],
  intro: 'Only the second field is compared.',
  steps: [['"b" vs "a": "a" is smaller.', [0, 1]], ['So the second pair is returned.', 1, 'o0']],
  result: '(1, "a")', resultCap: 'Useful for structs without Ord.',
}, 'd(std::cmp::min_by((1, "b"), (1, "a"), |a: &(i32, &str), b: &(i32, &str)| a.1.cmp(b.1)))');

// ---------------------------------------------------------------- bool

add('bool/then_some', 'then_some', BOOL, 'How bool::then_some works', 'Some(value) if the bool is true, otherwise None.', {
  rows: [['true', 'false']], call: '(age >= 18).then_some("adult")', note: 'bool → Option', outs: ['Some("adult")', 'None'],
  intro: 'then_some turns a condition into an Option.',
  steps: [['true: Some("adult").', 0, 'o0'], ['false: None.', 1, 'o1']],
  result: 'Some("adult"), None', resultCap: 'The value is computed even when the bool is false; use then(|| ...) for costly values.',
}, 'format!("{:?}, {:?}", (20 >= 18).then_some("adult"), (12 >= 18).then_some("adult"))');

add('bool/then', 'then', BOOL, 'How bool::then works', 'Runs a closure and wraps the result in Some only if the bool is true.', {
  rows: [['true', 'false']], call: 'ok.then(|| expensive())', note: 'lazy', outs: ['Some(42)', 'None (closure not run)'],
  intro: 'then only calls the closure when it is needed.',
  steps: [['true: the closure runs and gives 42.', 0, 'o0'], ['false: the closure is skipped.', 1, 'o1']],
  result: 'Some(42), None', resultCap: 'Great with filter_map: items.iter().filter_map(|x| (x > &0).then(|| x * 2)).',
}, 'format!("{:?}, {:?}", true.then(|| 42), false.then(|| 42))');

// ---------------------------------------------------------------- u8 (bytes) ASCII

add('u8/is_ascii_digit', 'is_ascii_digit', U8, 'How u8::is_ascii_digit works', 'true for the bytes b\'0\' to b\'9\'.', {
  rows: [["b'7'", "b'x'", '7']], call: "b'7'.is_ascii_digit()", note: 'bytes, not numbers', outs: ['true', 'false', 'false'],
  intro: 'b\'7\' is the byte 55, the code of the character 7. The number 7 is a control code, not a digit.',
  steps: [["b'7': true.", 0, 'o0'], ["b'x': false.", 1, 'o1'], ['7u8 is not the character 7: false.', 2, 'o2']],
  result: 'true, false, false', resultCap: 'Turn a digit byte into its value with b - b\'0\'.',
}, 'format!("{}, {}, {}", b\'7\'.is_ascii_digit(), b\'x\'.is_ascii_digit(), 7u8.is_ascii_digit())');

add('u8/is_ascii_alphabetic', 'is_ascii_alphabetic', U8, 'How u8::is_ascii_alphabetic works', 'true for a–z and A–Z.', {
  rows: [["b'a'", "b'Z'", "b'1'"]], call: 'byte.is_ascii_alphabetic()', note: 'ASCII letters only', outs: ['true', 'true', 'false'],
  intro: 'Only the 52 English letters count.',
  steps: [["b'a' and b'Z': true.", [0, 1], 'o0,1'], ["b'1': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Works on raw bytes, e.g. while scanning s.as_bytes().',
}, 'format!("{}, {}, {}", b\'a\'.is_ascii_alphabetic(), b\'Z\'.is_ascii_alphabetic(), b\'1\'.is_ascii_alphabetic())');

add('u8/is_ascii_alphanumeric', 'is_ascii_alphanumeric', U8, 'How u8::is_ascii_alphanumeric works', 'true for letters and digits.', {
  rows: [["b'q'", "b'5'", "b'_'"]], call: 'byte.is_ascii_alphanumeric()', note: 'letters or digits', outs: ['true', 'true', 'false'],
  intro: 'Letters a–z, A–Z and digits 0–9.',
  steps: [["b'q' and b'5': true.", [0, 1], 'o0,1'], ["b'_' is punctuation: false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Identifiers usually also allow _: c.is_ascii_alphanumeric() || c == b\'_\'.',
}, 'format!("{}, {}, {}", b\'q\'.is_ascii_alphanumeric(), b\'5\'.is_ascii_alphanumeric(), b\'_\'.is_ascii_alphanumeric())');

add('u8/is_ascii_whitespace', 'is_ascii_whitespace', U8, 'How u8::is_ascii_whitespace works', 'true for space, tab, newline, carriage return and form feed.', {
  rows: [["b' '", "b'\\n'", "b'-'"]], call: 'byte.is_ascii_whitespace()', note: 'blank bytes', outs: ['true', 'true', 'false'],
  intro: 'Space, \\t, \\n, \\r and \\x0C are ASCII whitespace.',
  steps: [['Space and newline: true.', [0, 1], 'o0,1'], ['A dash: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'Vertical tab (\\x0B) is not included, unlike some other languages.',
}, 'format!("{}, {}, {}", b\' \'.is_ascii_whitespace(), b\'\\n\'.is_ascii_whitespace(), b\'-\'.is_ascii_whitespace())');

add('u8/is_ascii_uppercase', 'is_ascii_uppercase', U8, 'How u8::is_ascii_uppercase works', 'true for A–Z.', {
  rows: [["b'Q'", "b'q'"]], call: 'byte.is_ascii_uppercase()', note: 'capital letters', outs: ['true', 'false'],
  intro: 'Only the 26 capital letters.',
  steps: [["b'Q': true.", 0, 'o0'], ["b'q': false.", 1, 'o1']],
  result: 'true, false', resultCap: 'is_ascii_lowercase checks a–z.',
}, 'format!("{}, {}", b\'Q\'.is_ascii_uppercase(), b\'q\'.is_ascii_uppercase())');

add('u8/is_ascii_lowercase', 'is_ascii_lowercase', U8, 'How u8::is_ascii_lowercase works', 'true for a–z.', {
  rows: [["b'q'", "b'Q'"]], call: 'byte.is_ascii_lowercase()', note: 'small letters', outs: ['true', 'false'],
  intro: 'Only the 26 small letters.',
  steps: [["b'q': true.", 0, 'o0'], ["b'Q': false.", 1, 'o1']],
  result: 'true, false', resultCap: 'Digits and symbols are neither upper nor lower case.',
}, 'format!("{}, {}", b\'q\'.is_ascii_lowercase(), b\'Q\'.is_ascii_lowercase())');

add('u8/is_ascii_punctuation', 'is_ascii_punctuation', U8, 'How u8::is_ascii_punctuation works', 'true for printable symbols such as ! , . ? - _', {
  rows: [["b'!'", "b'_'", "b'a'"]], call: 'byte.is_ascii_punctuation()', note: 'symbols', outs: ['true', 'true', 'false'],
  intro: 'Every printable ASCII character that is not a letter, a digit or a space.',
  steps: [["b'!' and b'_': true.", [0, 1], 'o0,1'], ["b'a': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Useful for simple tokenizers.',
}, 'format!("{}, {}, {}", b\'!\'.is_ascii_punctuation(), b\'_\'.is_ascii_punctuation(), b\'a\'.is_ascii_punctuation())');

add('u8/is_ascii_hexdigit', 'is_ascii_hexdigit', U8, 'How u8::is_ascii_hexdigit works', 'true for 0–9, a–f and A–F.', {
  rows: [["b'7'", "b'F'", "b'g'"]], call: 'byte.is_ascii_hexdigit()', note: 'hexadecimal digits', outs: ['true', 'true', 'false'],
  intro: 'Hex uses 16 digits: 0–9 and a–f (either case).',
  steps: [["b'7' and b'F': true.", [0, 1], 'o0,1'], ["b'g' is past f: false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'Check colours like "#ff8800" byte by byte.',
}, 'format!("{}, {}, {}", b\'7\'.is_ascii_hexdigit(), b\'F\'.is_ascii_hexdigit(), b\'g\'.is_ascii_hexdigit())');

add('u8/to_ascii_uppercase', 'to_ascii_uppercase', U8, 'How u8::to_ascii_uppercase works', 'The capital version of a small ASCII letter; other bytes stay the same.', {
  rows: [["b'a'", "b'Z'", "b'3'"]], call: "b'a'.to_ascii_uppercase()", note: 'byte → byte', outs: ["b'A'", "b'Z'", "b'3'"],
  intro: 'Only a–z change; they move 32 places down the ASCII table.',
  steps: [["b'a' (97) becomes b'A' (65).", 0, 'o0'], ['Capitals and digits stay as they are.', [1, 2], 'o1,2']],
  result: '65, 90, 51', resultCap: 'to_ascii_lowercase goes the other way. For whole strings use str::to_ascii_uppercase.',
}, 'format!("{}, {}, {}", b\'a\'.to_ascii_uppercase(), b\'Z\'.to_ascii_uppercase(), b\'3\'.to_ascii_uppercase())');

add('u8/to_ascii_lowercase', 'to_ascii_lowercase', U8, 'How u8::to_ascii_lowercase works', 'The small version of a capital ASCII letter; other bytes stay the same.', {
  rows: [["b'A'", "b'z'", "b'!'"]], call: "b'A'.to_ascii_lowercase()", note: 'byte → byte', outs: ["b'a'", "b'z'", "b'!'"],
  intro: 'Only A–Z change; they move 32 places up.',
  steps: [["b'A' (65) becomes b'a' (97).", 0, 'o0'], ['Small letters and symbols stay.', [1, 2], 'o1,2']],
  result: '97, 122, 33', resultCap: 'make_ascii_lowercase changes the byte in place instead.',
}, 'format!("{}, {}, {}", b\'A\'.to_ascii_lowercase(), b\'z\'.to_ascii_lowercase(), b\'!\'.to_ascii_lowercase())');

add('u8/eq_ignore_ascii_case', 'eq_ignore_ascii_case', U8, 'How u8::eq_ignore_ascii_case works', 'Compares two bytes, treating capital and small letters as equal.', {
  rows: [["b'a' vs b'A'", "b'a' vs b'b'"]], call: "b'a'.eq_ignore_ascii_case(&b'A')", note: 'case-blind', outs: ['true', 'false'],
  intro: 'Both bytes are lower-cased before comparing.',
  steps: [['a and A: true.', 0, 'o0'], ['a and b: false.', 1, 'o1']],
  result: 'true, false', resultCap: 'For whole strings: str::eq_ignore_ascii_case.',
}, 'format!("{}, {}", b\'a\'.eq_ignore_ascii_case(&b\'A\'), b\'a\'.eq_ignore_ascii_case(&b\'b\'))');

add('u8/is_ascii', 'is_ascii', U8, 'How u8::is_ascii works', 'true for bytes 0 to 127.', {
  rows: [["b'a'", '200']], call: 'byte.is_ascii()', note: 'the first half of the byte range', outs: ['true', 'false'],
  intro: 'ASCII uses only the values 0–127. Bytes from 128 up belong to multi-byte UTF-8 characters.',
  steps: [["b'a' (97): true.", 0, 'o0'], ['200: false.', 1, 'o1']],
  result: 'true, false', resultCap: 's.is_ascii() checks a whole string at once.',
}, 'format!("{}, {}", b\'a\'.is_ascii(), 200u8.is_ascii())');

module.exports = list;
