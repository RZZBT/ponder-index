// Rust standard library, the exotic end: more integer methods (shifts, wrapping/overflowing variants, radix parsing),
// more f32 maths, and a few char and thread helpers.
const { group } = require('./kit.cjs');
const INT = ['core', 'int_impl', /num\/int_macros\.rs$/];
const UINT = ['core', 'uint_impl', /num\/uint_macros\.rs$/];
const BOTH = [INT, UINT];
const STD32 = ['std', 'f32', /num\/f32\.rs$/];
const CORE32 = ['core', 'f32', /num\/f32\.rs$/];
const CHAR = ['core', 'char', /char\/methods\.rs$/];
const { list, add } = group({ at: BOTH });

// ---------------------------------------------------------------- integers

add('int/wrapping_pow', 'wrapping_pow', null, 'How wrapping_pow works', 'Raises to a power, wrapping around on overflow.', {
  rows: [['3^4 (u8)', '3^6 (u8)']], call: '3u8.wrapping_pow(6)', note: 'mod 256', outs: ['81', '217'],
  intro: '3⁶ = 729, and 729 mod 256 = 217.',
  steps: [['81 fits.', 0, 'o0'], ['729 wraps to 217.', 1, 'o1']],
  result: '81, 217', resultCap: 'checked_pow reports the overflow instead.',
}, 'format!("{}, {}", 3u8.wrapping_pow(4), 3u8.wrapping_pow(6))');

add('int/overflowing_pow', 'overflowing_pow', null, 'How overflowing_pow works', 'Raises to a power, wrapping, plus a flag that says whether it overflowed.', {
  rows: [['2^7 (u8)', '2^9 (u8)']], call: '2u8.overflowing_pow(9)', note: '(result, overflowed?)', outs: ['(128, false)', '(0, true)'],
  intro: '2⁹ = 512 wraps to 0 in a u8.',
  steps: [['128 fits.', 0, 'o0'], ['512 wraps to 0: true.', 1, 'o1']],
  result: '(128, false), (0, true)', resultCap: 'Same pattern as overflowing_add.',
}, 'format!("{:?}, {:?}", 2u8.overflowing_pow(7), 2u8.overflowing_pow(9))');

add('int/saturating_div', 'saturating_div', null, 'How saturating_div works', 'Divides, clamping the one overflowing case (MIN / -1).', {
  rows: [['-128 / -1 (i8)', '9 / 2']], call: '(-128i8).saturating_div(-1)', note: 'only signed types can overflow', outs: ['127', '4'],
  intro: '+128 does not fit in an i8, so the result sticks at 127.',
  steps: [['MIN / -1 saturates to MAX.', 0, 'o0'], ['Ordinary division otherwise.', 1, 'o1']],
  result: '127, 4', resultCap: 'Division by zero still panics.',
}, 'format!("{}, {}", (-128i8).saturating_div(-1), 9i8.saturating_div(2))');

add('int/checked_shl', 'checked_shl', null, 'How checked_shl works', 'Shifts left; None if the shift amount is too large for the type.', {
  rows: [['1 << 3', '1 << 40 (u32)']], call: '1u32.checked_shl(40)', note: 'shift ≥ bit width', outs: ['Some(8)', 'None'],
  intro: 'Shifting a u32 by 32 or more is not allowed.',
  steps: [['1 << 3 = 8.', 0, 'o0'], ['40 ≥ 32: None.', 1, 'o1']],
  result: 'Some(8), None', resultCap: 'Bits shifted off the top are still lost silently.',
}, 'format!("{:?}, {:?}", 1u32.checked_shl(3), 1u32.checked_shl(40))');

add('int/checked_shr', 'checked_shr', null, 'How checked_shr works', 'Shifts right; None if the shift amount is too large.', {
  rows: [['64 >> 2', '64 >> 99']], call: '64u32.checked_shr(2)', note: 'safe >>', outs: ['Some(16)', 'None'],
  intro: 'Each right shift halves the number (rounding down).',
  steps: [['64 >> 2 = 16.', 0, 'o0'], ['99 is too far: None.', 1, 'o1']],
  result: 'Some(16), None', resultCap: 'Signed types keep the sign bit when shifting right.',
}, 'format!("{:?}, {:?}", 64u32.checked_shr(2), 64u32.checked_shr(99))');

add('int/wrapping_shl', 'wrapping_shl', null, 'How wrapping_shl works', 'Shifts left, taking the shift amount modulo the bit width.', {
  rows: [['1 << 1 (u8)', '1 << 9 (u8)']], call: '1u8.wrapping_shl(9)', note: '9 mod 8 = 1', outs: ['2', '2'],
  intro: 'For u8, shifting by 9 is treated as shifting by 1.',
  steps: [['1 << 1 = 2.', 0, 'o0'], ['9 becomes 1: also 2.', 1, 'o1']],
  result: '2, 2', resultCap: 'This is what the hardware does; rarely what you want in normal code.',
}, 'format!("{}, {}", 1u8.wrapping_shl(1), 1u8.wrapping_shl(9))');

add('int/wrapping_div', 'wrapping_div', null, 'How wrapping_div works', 'Divides; MIN / -1 wraps around instead of panicking.', {
  rows: [['-128 / -1 (i8)', '7 / 2']], call: '(-128i8).wrapping_div(-1)', note: 'the one overflow case', outs: ['-128', '3'],
  intro: '+128 wraps back to -128.',
  steps: [['MIN / -1 wraps to MIN.', 0, 'o0'], ['Normal otherwise.', 1, 'o1']],
  result: '-128, 3', resultCap: 'For unsigned types it is the same as /.',
}, 'format!("{}, {}", (-128i8).wrapping_div(-1), 7i8.wrapping_div(2))');

add('int/wrapping_rem', 'wrapping_rem', null, 'How wrapping_rem works', 'The remainder; MIN % -1 gives 0 instead of panicking.', {
  rows: [['-128 % -1 (i8)', '7 % 3']], call: '(-128i8).wrapping_rem(-1)', note: 'safe %', outs: ['0', '1'],
  intro: 'The remainder of MIN / -1 is 0, but computing it normally overflows.',
  steps: [['MIN % -1 → 0.', 0, 'o0'], ['7 % 3 → 1.', 1, 'o1']],
  result: '0, 1', resultCap: 'Division by zero still panics.',
}, 'format!("{}, {}", (-128i8).wrapping_rem(-1), 7i8.wrapping_rem(3))');

add('int/checked_rem_euclid', 'checked_rem_euclid', null, 'How checked_rem_euclid works', 'rem_euclid that returns None instead of panicking.', {
  rows: [['-7 rem 3', '5 rem 0']], call: '(-7i32).checked_rem_euclid(3)', note: 'never negative, never panics', outs: ['Some(2)', 'None'],
  intro: 'None for division by zero (or MIN by -1).',
  steps: [['-7 = -3 × 3 + 2: Some(2).', 0, 'o0'], ['% 0: None.', 1, 'o1']],
  result: 'Some(2), None', resultCap: 'checked_div_euclid is the matching division.',
}, 'format!("{:?}, {:?}", (-7i32).checked_rem_euclid(3), 5i32.checked_rem_euclid(0))');

add('int/checked_div_euclid', 'checked_div_euclid', null, 'How checked_div_euclid works', 'div_euclid that returns None instead of panicking.', {
  rows: [['-7 div 2', '1 div 0']], call: '(-7i32).checked_div_euclid(2)', note: 'safe euclidean division', outs: ['Some(-4)', 'None'],
  intro: '-7 = -4 × 2 + 1, so the quotient is -4.',
  steps: [['Some(-4).', 0, 'o0'], ['Dividing by zero: None.', 1, 'o1']],
  result: 'Some(-4), None', resultCap: 'Pairs with checked_rem_euclid.',
}, 'format!("{:?}, {:?}", (-7i32).checked_div_euclid(2), 1i32.checked_div_euclid(0))');

add('int/checked_ilog2', 'checked_ilog2', null, 'How checked_ilog2 works', 'ilog2 that returns None for 0 (and negatives).', {
  rows: [['32', '0']], call: 'x.checked_ilog2()', note: 'log₂ of 0 does not exist', outs: ['Some(5)', 'None'],
  intro: 'ilog2(0) would panic.',
  steps: [['2⁵ = 32: Some(5).', 0, 'o0'], ['0: None.', 1, 'o1']],
  result: 'Some(5), None', resultCap: 'checked_ilog10 and checked_ilog work the same.',
}, 'format!("{:?}, {:?}", 32u32.checked_ilog2(), 0u32.checked_ilog2())');

add('int/checked_ilog10', 'checked_ilog10', null, 'How checked_ilog10 works', 'ilog10 that returns None for 0 (and negatives).', {
  rows: [['999', '0']], call: 'x.checked_ilog10()', note: 'digits - 1, safely', outs: ['Some(2)', 'None'],
  intro: '999 has three digits, so the answer is 2.',
  steps: [['999 → Some(2).', 0, 'o0'], ['0 → None.', 1, 'o1']],
  result: 'Some(2), None', resultCap: 'Count digits safely: n.checked_ilog10().map_or(1, |d| d + 1).',
}, 'format!("{:?}, {:?}", 999u32.checked_ilog10(), 0u32.checked_ilog10())');

add('int/wrapping_abs', 'wrapping_abs', INT, 'How wrapping_abs works', 'abs, but MIN stays MIN instead of panicking.', {
  rows: [['-5', 'i8::MIN']], call: '(-128i8).wrapping_abs()', note: 'the one tricky value', outs: ['5', '-128'],
  intro: '+128 does not fit, so it wraps back to -128.',
  steps: [['-5 → 5.', 0, 'o0'], ['-128 → -128.', 1, 'o1']],
  result: '5, -128', resultCap: 'unsigned_abs is usually the better fix.',
}, 'format!("{}, {}", (-5i8).wrapping_abs(), (-128i8).wrapping_abs())');

add('int/saturating_abs', 'saturating_abs', INT, 'How saturating_abs works', 'abs, but MIN becomes MAX.', {
  rows: [['-5', 'i8::MIN']], call: '(-128i8).saturating_abs()', note: 'clamped', outs: ['5', '127'],
  intro: 'The closest representable value to +128 is 127.',
  steps: [['-5 → 5.', 0, 'o0'], ['-128 → 127.', 1, 'o1']],
  result: '5, 127', resultCap: 'Never panics, never wraps.',
}, 'format!("{}, {}", (-5i8).saturating_abs(), (-128i8).saturating_abs())');

add('int/saturating_neg', 'saturating_neg', INT, 'How saturating_neg works', 'Negates, but -MIN becomes MAX.', {
  rows: [['5', 'i8::MIN']], call: '(-128i8).saturating_neg()', note: 'safe minus', outs: ['-5', '127'],
  intro: 'Negating MIN would overflow; it sticks at MAX instead.',
  steps: [['5 → -5.', 0, 'o0'], ['-128 → 127.', 1, 'o1']],
  result: '-5, 127', resultCap: 'checked_neg returns None instead.',
}, 'format!("{}, {}", 5i8.saturating_neg(), (-128i8).saturating_neg())');

add('int/overflowing_neg', 'overflowing_neg', BOTH, 'How overflowing_neg works', 'Negates with wrapping, plus an overflow flag.', {
  rows: [['5i8', 'i8::MIN']], call: '(-128i8).overflowing_neg()', note: '(result, overflowed?)', outs: ['(-5, false)', '(-128, true)'],
  intro: 'For unsigned types every value except 0 overflows.',
  steps: [['5 → -5: fine.', 0, 'o0'], ['MIN → MIN, with the flag set.', 1, 'o1']],
  result: '(-5, false), (-128, true)', resultCap: 'Used in big-number code.',
}, 'format!("{:?}, {:?}", 5i8.overflowing_neg(), (-128i8).overflowing_neg())');

add('uint/checked_next_power_of_two', 'checked_next_power_of_two', UINT, 'How checked_next_power_of_two works', 'next_power_of_two, but None when the answer does not fit.', {
  rows: [['100 (u8)', '200 (u8)']], call: '200u8.checked_next_power_of_two()', note: 'u8 max is 255', outs: ['Some(128)', 'None'],
  intro: 'The next power above 200 is 256, too big for a u8.',
  steps: [['100 → 128.', 0, 'o0'], ['200 → 256 does not fit: None.', 1, 'o1']],
  result: 'Some(128), None', resultCap: 'next_power_of_two would panic in debug builds here.',
}, 'format!("{:?}, {:?}", 100u8.checked_next_power_of_two(), 200u8.checked_next_power_of_two())');

add('int/from_str_radix', 'from_str_radix', ['core', 'from_str_int_impl', /num\/mod\.rs$/], 'How from_str_radix works', 'Parses a number written in any base from 2 to 36.', {
  rows: [['"ff", 16', '"1010", 2', '"z", 36']], call: 'i32::from_str_radix("ff", 16)', note: 'hex, binary, ...', outs: ['Ok(255)', 'Ok(10)', 'Ok(35)'],
  intro: 'Digits beyond 9 are letters: a = 10, b = 11, … z = 35.',
  steps: [['"ff" in hex is 255.', 0, 'o0'], ['"1010" in binary is 10.', 1, 'o1'], ['"z" in base 36 is 35.', 2, 'o2']],
  result: 'Ok(255), Ok(10), Ok(35)', resultCap: 'No "0x" prefix allowed: strip it first with trim_start_matches("0x").',
}, 'format!("{:?}, {:?}, {:?}", i32::from_str_radix("ff", 16), i32::from_str_radix("1010", 2), i32::from_str_radix("z", 36))');

// ---------------------------------------------------------------- f32

add('f32/exp', 'exp', STD32, 'How f32::exp works', 'e raised to the power x, for f32.', {
  rows: [['0', '1']], call: 'x.exp()', note: 'e ≈ 2.7182817 in f32', outs: ['1', '2.7182817'],
  intro: 'f32 shows about 7 significant digits.',
  steps: [['e⁰ = 1.', 0, 'o0'], ['e¹ ≈ 2.7182817.', 1, 'o1']],
  result: '1, 2.7182817', resultCap: 'ln is the inverse.',
}, 'format!("{}, {}", 0.0_f32.exp(), 1.0_f32.exp())');

add('f32/ln', 'ln', STD32, 'How f32::ln works', 'The natural logarithm of an f32.', {
  rows: [['1', 'e']], call: 'x.ln()', note: 'base e', outs: ['0', '0.99999994'],
  intro: 'ln(1) = 0 exactly. ln(e) should be 1, but e itself is rounded to fit in an f32.',
  steps: [['ln(1) = 0.', 0, 'o0'], ['ln(e) comes out as 0.99999994: f32 has only about 7 digits.', 1, 'o1']],
  result: '0, 0.99999994', resultCap: 'Never compare floats with ==; check (a - b).abs() < 1e-6. Negative inputs give NaN.',
}, 'format!("{}, {}", 1.0_f32.ln(), std::f32::consts::E.ln())');

add('f32/log10', 'log10', STD32, 'How f32::log10 works', 'The base-10 logarithm of an f32.', {
  rows: [['100', '0.1']], call: 'x.log10()', note: 'orders of magnitude', outs: ['2', '-1'],
  intro: '10² = 100, 10⁻¹ = 0.1.',
  steps: [['100 → 2.', 0, 'o0'], ['0.1 → -1.', 1, 'o1']],
  result: '2, -1', resultCap: 'log2 and ln are the other common bases.',
}, 'format!("{}, {}", 100.0_f32.log10(), 0.1_f32.log10())');

add('f32/atan2', 'atan2', STD32, 'How f32::atan2 works', 'The angle of the point (x, y) for f32.', {
  rows: [['(0, 1)']], call: '1.0_f32.atan2(0.0)', note: 'y.atan2(x)', outs: ['π/2 ≈ 1.5707964'],
  intro: 'Straight up is a quarter turn: π/2.',
  steps: [['The point is directly above the origin.', 0], ['The angle is π/2.', [], 'o0']],
  result: '1.5707964', resultCap: 'Games use it to aim at a target.',
}, '1.0_f32.atan2(0.0).to_string()');

add('f32/trunc', 'trunc', STD32, 'How f32::trunc works', 'Drops the fractional part (rounds towards zero).', {
  rows: [['3.7', '-3.7']], call: 'x.trunc()', note: 'towards 0', outs: ['3', '-3'],
  intro: 'Unlike floor, negative numbers go up.',
  steps: [['3.7 → 3.', 0, 'o0'], ['-3.7 → -3.', 1, 'o1']],
  result: '3, -3', resultCap: 'x as i32 truncates the same way.',
}, 'format!("{}, {}", 3.7_f32.trunc(), (-3.7_f32).trunc())');

add('f32/fract', 'fract', STD32, 'How f32::fract works', 'The part after the decimal point.', {
  rows: [['1.25']], call: '1.25_f32.fract()', note: 'x - x.trunc()', outs: ['0.25'],
  intro: 'Keeps the sign of the input.',
  steps: [['1.25 has whole part 1.', 0], ['0.25 is left.', [], 'o0']],
  result: '0.25', resultCap: 'Useful for repeating animations: t.fract() loops from 0 to 1.',
}, '1.25_f32.fract().to_string()');

add('f32/hypot', 'hypot', STD32, 'How f32::hypot works', '√(x² + y²) for f32: the length of a 2D vector.', {
  rows: [['6', '8']], call: '6.0_f32.hypot(8.0)', note: 'Pythagoras', outs: ['10'],
  intro: '6² + 8² = 100, and √100 = 10.',
  steps: [['36 + 64 = 100.', [0, 1]], ['√100 = 10.', [], 'o0']],
  result: '10', resultCap: 'Distance between points: (x2 - x1).hypot(y2 - y1).',
}, '6.0_f32.hypot(8.0).to_string()');

add('f32/cbrt', 'cbrt', STD32, 'How f32::cbrt works', 'The cube root of an f32.', {
  rows: [['64']], call: '64.0_f32.cbrt()', note: '4 × 4 × 4 = 64', outs: ['4'],
  intro: 'Works for negative numbers too.',
  steps: [['Which number cubed is 64?', 0], ['4.', [], 'o0']],
  result: '4', resultCap: 'sqrt is the square root.',
}, '64.0_f32.cbrt().to_string()');

add('f32/tan', 'tan', STD32, 'How f32::tan works', 'The tangent of an f32 angle in radians.', {
  rows: [['0']], call: '0.0_f32.tan()', note: 'slope of the angle', outs: ['0'],
  intro: 'A flat line has slope 0.',
  steps: [['The angle is 0.', 0], ['tan(0) = 0.', [], 'o0']],
  result: '0', resultCap: 'Near π/2 the value shoots towards infinity.',
}, '0.0_f32.tan().to_string()');

add('f32/mul_add', 'mul_add', STD32, 'How f32::mul_add works', 'x × a + b with one rounding, for f32.', {
  rows: [['1.5 × 2 + 0.5']], call: '1.5_f32.mul_add(2.0, 0.5)', note: 'fused multiply-add', outs: ['3.5'],
  intro: 'One rounding step instead of two.',
  steps: [['1.5 × 2 = 3.', 0], ['+ 0.5 = 3.5.', [], 'o0']],
  result: '3.5', resultCap: 'Common in graphics shaders and physics.',
}, '1.5_f32.mul_add(2.0, 0.5).to_string()');

add('f32/rem_euclid', 'rem_euclid', STD32, 'How f32::rem_euclid works', 'A remainder that is never negative, for f32.', {
  rows: [['-30 rem 360']], call: '(-30.0_f32).rem_euclid(360.0)', note: 'wrap an angle', outs: ['330'],
  intro: '-30° is the same direction as 330°.',
  steps: [['% would give -30.', 0], ['rem_euclid gives 330.', [], 'o0']],
  result: '330', resultCap: 'Keep headings in 0..360 with it.',
}, '(-30.0_f32).rem_euclid(360.0).to_string()');

add('f32/signum', 'signum', CORE32, 'How f32::signum works', '1.0 or -1.0 depending on the sign.', {
  rows: [['-4.2', '0.5']], call: 'x.signum()', note: 'just the direction', outs: ['-1', '1'],
  intro: 'Zero counts by its sign bit: 0.0 → 1.0, -0.0 → -1.0.',
  steps: [['-4.2 → -1.', 0, 'o0'], ['0.5 → 1.', 1, 'o1']],
  result: '-1, 1', resultCap: 'NaN gives NaN.',
}, 'format!("{}, {}", (-4.2_f32).signum(), 0.5_f32.signum())');

add('f32/is_nan', 'is_nan', CORE32, 'How f32::is_nan works', 'true for NaN, the result of undefined maths like 0/0.', {
  rows: [['0.0 / 0.0', '1.0']], call: 'x.is_nan()', note: 'x == NaN is always false', outs: ['true', 'false'],
  intro: 'NaN is not equal to anything, not even itself.',
  steps: [['0/0 is NaN.', 0, 'o0'], ['1.0 is a number.', 1, 'o1']],
  result: 'true, false', resultCap: 'Check with is_nan, never with ==.',
}, 'let z = 0.0_f32; format!("{}, {}", (z / z).is_nan(), 1.0_f32.is_nan())');

add('f32/recip', 'recip', CORE32, 'How f32::recip works', '1 / x for f32.', {
  rows: [['8']], call: '8.0_f32.recip()', note: 'reciprocal', outs: ['0.125'],
  intro: 'Multiplying by a reciprocal can be cheaper than dividing.',
  steps: [['1 / 8.', 0], ['= 0.125.', [], 'o0']],
  result: '0.125', resultCap: 'recip of 0 is infinity.',
}, '8.0_f32.recip().to_string()');

add('f32/to_degrees', 'to_degrees', CORE32, 'How f32::to_degrees works', 'Converts radians to degrees for f32.', {
  rows: [['π/2']], call: 'FRAC_PI_2.to_degrees()', note: 'for display', outs: ['90'],
  intro: 'π/2 radians is a right angle.',
  steps: [['π/2 radians.', 0], ['= 90°.', [], 'o0']],
  result: '90', resultCap: 'to_radians goes back.',
}, 'std::f32::consts::FRAC_PI_2.to_degrees().to_string()');

add('f32/total_cmp', 'total_cmp', CORE32, 'How f32::total_cmp works', 'A full ordering of f32 values, so they can be sorted.', {
  rows: [['0.5', '-2.0', '1.5']], call: 'v.sort_by(|a, b| a.total_cmp(b))', note: 'f32 has no sort()', outs: [null, null, null],
  intro: 'NaN would break normal comparisons; total_cmp orders every value.',
  steps: [['-2.0 goes first.', 1, 'm0'], ['Then 0.5 and 1.5.', [0, 2], { move: { a0: 1, a2: 2 } }]],
  result: '[-2.0, 0.5, 1.5]', resultCap: 'Use it for max/min too: iter().max_by(|a, b| a.total_cmp(b)).',
}, 'let mut v = vec![0.5_f32, -2.0, 1.5]; v.sort_by(|a, b| a.total_cmp(b)); d(v)');

// ---------------------------------------------------------------- char, thread

add('char/is_ascii_lowercase', 'is_ascii_lowercase', CHAR, 'How char::is_ascii_lowercase works', 'true for a–z only.', {
  rows: [["'a'", "'é'", "'A'"]], call: 'c.is_ascii_lowercase()', note: 'ASCII small letters', outs: ['true', 'false', 'false'],
  intro: 'é is lowercase, but not ASCII.',
  steps: [["'a': true.", 0, 'o0'], ["'é' and 'A': false.", [1, 2], 'o1,2']],
  result: 'true, false, false', resultCap: 'is_lowercase accepts every alphabet.',
}, 'format!("{}, {}, {}", \'a\'.is_ascii_lowercase(), \'é\'.is_ascii_lowercase(), \'A\'.is_ascii_lowercase())');

add('char/is_ascii_uppercase', 'is_ascii_uppercase', CHAR, 'How char::is_ascii_uppercase works', 'true for A–Z only.', {
  rows: [["'Z'", "'z'"]], call: 'c.is_ascii_uppercase()', note: 'ASCII capitals', outs: ['true', 'false'],
  intro: 'Only the 26 English capitals.',
  steps: [["'Z': true.", 0, 'o0'], ["'z': false.", 1, 'o1']],
  result: 'true, false', resultCap: 'is_uppercase accepts every alphabet.',
}, 'format!("{}, {}", \'Z\'.is_ascii_uppercase(), \'z\'.is_ascii_uppercase())');

add('char/is_ascii_whitespace', 'is_ascii_whitespace', CHAR, 'How char::is_ascii_whitespace works', 'true for space, tab, newline, carriage return and form feed.', {
  rows: [["' '", "'\\t'", "'_'"]], call: 'c.is_ascii_whitespace()', note: 'ASCII blanks', outs: ['true', 'true', 'false'],
  intro: 'Unicode spaces such as the no-break space do not count.',
  steps: [['Space and tab: true.', [0, 1], 'o0,1'], ["'_': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'is_whitespace accepts Unicode spaces too.',
}, 'format!("{}, {}, {}", \' \'.is_ascii_whitespace(), \'\\t\'.is_ascii_whitespace(), \'_\'.is_ascii_whitespace())');

add('char/is_ascii_alphanumeric', 'is_ascii_alphanumeric', CHAR, 'How char::is_ascii_alphanumeric works', 'true for a–z, A–Z and 0–9.', {
  rows: [["'x'", "'7'", "'-'"]], call: 'c.is_ascii_alphanumeric()', note: 'letters or digits', outs: ['true', 'true', 'false'],
  intro: 'Common for validating usernames or identifiers.',
  steps: [["'x' and '7': true.", [0, 1], 'o0,1'], ["'-': false.", 2, 'o2']],
  result: 'true, true, false', resultCap: 'is_alphanumeric accepts every alphabet and digit system.',
}, 'format!("{}, {}, {}", \'x\'.is_ascii_alphanumeric(), \'7\'.is_ascii_alphanumeric(), \'-\'.is_ascii_alphanumeric())');

add('char/make_ascii_uppercase', 'make_ascii_uppercase', CHAR, 'How char::make_ascii_uppercase works', 'Changes a char variable to its ASCII capital, in place.', {
  rows: [["c = 'q'"]], call: 'c.make_ascii_uppercase();', note: 'changes the variable', outs: ["'Q'"],
  intro: 'Only a–z change.',
  steps: [["c holds 'q'.", 0], ["Now it holds 'Q'.", [], 'o0']],
  result: "'Q'", resultCap: 'to_ascii_uppercase returns a new char instead.',
}, 'let mut c = \'q\'; c.make_ascii_uppercase(); d(c)');

add('thread/yield_now', 'yield_now', ['std', '', /thread\/functions\.rs$/], 'How thread::yield_now works', 'Lets the OS run other threads before this one continues.', {
  rows: [['busy-waiting loop']], call: 'while !done.load(SeqCst) { thread::yield_now(); }', note: 'a polite pause', outs: ['other threads get a turn'],
  intro: 'It gives up the rest of this thread\'s time slice; it does not sleep for a fixed time.',
  steps: [['The thread steps aside.', 0], ['The scheduler may run another thread.', [], 'o0']],
  result: 'done: true', resultCap: 'Better options for waiting: join, channels, Condvar or park.',
}, 'let f = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)); let g = f.clone(); let h = std::thread::spawn(move || g.store(true, std::sync::atomic::Ordering::SeqCst)); while !f.load(std::sync::atomic::Ordering::SeqCst) { std::thread::yield_now(); } h.join().unwrap(); format!("done: {}", f.load(std::sync::atomic::Ordering::SeqCst))');

module.exports = list;
