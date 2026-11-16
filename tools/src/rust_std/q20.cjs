// Rust standard library: the remaining float methods. f32 mirrors of the f64 maths, classification and neighbours,
// and byte conversions for both f32 and f64.
const { group } = require('./kit.cjs');
const C32 = ['core', 'f32', /num\/f32\.rs$/];
const S32 = ['std', 'f32', /num\/f32\.rs$/];
const C64 = ['core', 'f64', /num\/f64\.rs$/];
const S64 = ['std', 'f64', /num\/f64\.rs$/];
const { list, add } = group({ at: C32 });
const two = (call, a, b, out1, out2, note, intro, s1, s2, result, cap, rs) => ({ rows: [[a, b]], call, note, outs: [out1, out2], intro, steps: [[s1, 0, 'o0'], [s2, 1, 'o1']], result, resultCap: cap, rs });
const one = (call, a, out, note, intro, s1, s2, result, cap) => ({ rows: [[a]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });

// ---------------------------------------------------------------- f32: classification, signs, neighbours

add('f32/is_finite', 'is_finite', null, 'How f32::is_finite works', 'true for normal numbers; false for infinity and NaN.', two('x.is_finite()', '1.5', '1.0 / 0.0', 'true', 'false', 'a real number?', 'Check results of divisions before using them.', '1.5: true.', 'Infinity: false.', 'true, false', 'is_nan and is_infinite tell the failures apart.'),
  'let z = 0.0_f32; format!("{}, {}", 1.5_f32.is_finite(), (1.0 / z).is_finite())');
add('f32/is_infinite', 'is_infinite', null, 'How f32::is_infinite works', 'true for +∞ and -∞.', two('x.is_infinite()', '-1.0 / 0.0', 'f32::MAX', 'true', 'false', 'too big to represent', 'f32 overflows around 3.4e38.', '-∞: true.', 'MAX is finite: false.', 'true, false', 'f32::INFINITY is the constant.'),
  'let z = 0.0_f32; format!("{}, {}", (-1.0 / z).is_infinite(), f32::MAX.is_infinite())');
add('f32/is_normal', 'is_normal', null, 'How f32::is_normal works', 'true for ordinary non-zero numbers (not zero, subnormal, infinite or NaN).', two('x.is_normal()', '1.0', '0.0', 'true', 'false', 'full precision?', 'Zero and tiny subnormal numbers are not "normal".', '1.0: true.', '0.0: false.', 'true, false', 'classify gives the full category.'),
  'format!("{}, {}", 1.0_f32.is_normal(), 0.0_f32.is_normal())');
add('f32/is_subnormal', 'is_subnormal', null, 'How f32::is_subnormal works', 'true for numbers so tiny they lose precision.', two('x.is_subnormal()', '1e-40', '1e-30', 'true', 'false', 'below the normal range', 'Below about 1.2e-38, f32 values become subnormal.', '1e-40: subnormal.', '1e-30: normal.', 'true, false', 'Arithmetic on subnormals can be slow on some CPUs.'),
  'format!("{}, {}", 1e-40_f32.is_subnormal(), 1e-30_f32.is_subnormal())');
add('f32/classify', 'classify', null, 'How f32::classify works', 'Which kind of float it is: Normal, Zero, Subnormal, Infinite or Nan.', two('x.classify()', '0.0', 'NaN', 'Zero', 'Nan', 'FpCategory', 'Match on it to handle special values.', '0.0 → Zero.', 'NaN → Nan.', 'Zero, Nan', 'f64::classify works the same.'),
  'format!("{:?}, {:?}", 0.0_f32.classify(), f32::NAN.classify())');
add('f32/is_sign_negative', 'is_sign_negative', null, 'How f32::is_sign_negative works', 'true if the sign bit is set, including -0.0.', two('x.is_sign_negative()', '-0.0', '2.0', 'true', 'false', 'the sign bit', '-0.0 is not < 0, but its sign bit is set.', '-0.0: true.', '2.0: false.', 'true, false', 'is_sign_positive is the opposite.'),
  'format!("{}, {}", (-0.0_f32).is_sign_negative(), 2.0_f32.is_sign_negative())');
add('f32/is_sign_positive', 'is_sign_positive', null, 'How f32::is_sign_positive works', 'true if the sign bit is clear, including +0.0.', two('x.is_sign_positive()', '0.0', '-1.0', 'true', 'false', 'the sign bit', '+0.0 counts as positive.', '0.0: true.', '-1.0: false.', 'true, false', 'NaN can have either sign.'),
  'format!("{}, {}", 0.0_f32.is_sign_positive(), (-1.0_f32).is_sign_positive())');
add('f32/copysign', 'copysign', null, 'How f32::copysign works', 'The size of one number with the sign of another.', two('a.copysign(b)', '2.5 with -1', '-2.5 with 1', '-2.5', '2.5', 'size + sign', 'Only the sign of b matters.', '2.5 takes a minus.', '-2.5 takes a plus.', '-2.5, 2.5', 'Useful for directions.'),
  'format!("{}, {}", 2.5_f32.copysign(-1.0), (-2.5_f32).copysign(1.0))');
add('f32/next_up', 'next_up', null, 'How f32::next_up works', 'The next representable f32 above this one.', one('1.0_f32.next_up()', '1.0', '1.0000001', 'the smallest step', 'f32 has about 7 digits, so the gap after 1.0 is about 1.2e-7.', 'The gap above 1.0.', 'The next float.', '1.0000001', 'next_down goes the other way.'),
  '1.0_f32.next_up().to_string()');
add('f32/next_down', 'next_down', null, 'How f32::next_down works', 'The next representable f32 below this one.', one('1.0_f32.next_down()', '1.0', '0.99999994', 'one step down', 'Just below 1.0 the steps are half as big.', 'Step down from 1.0.', '0.99999994.', '0.99999994', 'next_up goes up.'),
  '1.0_f32.next_down().to_string()');

// ---------------------------------------------------------------- f32: bits and bytes

add('f32/to_bits', 'to_bits', null, 'How f32::to_bits works', 'The raw 32 bits of the float as a u32.', one('1.0_f32.to_bits()', '1.0', '0x3f800000', 'IEEE 754 layout', 'Sign (1 bit), exponent (8), fraction (23).', '1.0 has exponent 0x7f.', '0x3f800000.', '0x3f800000', 'from_bits goes back.'),
  'format!("{:#x}", 1.0_f32.to_bits())');
add('f32/from_bits', 'from_bits', null, 'How f32::from_bits works', 'An f32 from its raw 32 bits.', one('f32::from_bits(0x40000000)', '0x40000000', '2', 'bits → float', 'Exponent 0x80 means × 2.', 'Interpret the bits.', '2.0.', '2', 'Round-trips with to_bits.'),
  'f32::from_bits(0x40000000).to_string()');
add('f32/to_be_bytes', 'to_be_bytes', null, 'How f32::to_be_bytes works', 'The float\'s 4 bytes, most significant first.', one('1.0_f32.to_be_bytes()', '1.0', '[63, 128, 0, 0]', 'for network formats', 'Big-endian order.', 'The bits 0x3f800000...', '...as bytes 3f 80 00 00.', '[63, 128, 0, 0]', 'to_le_bytes reverses the order.'),
  'd(1.0_f32.to_be_bytes())');
add('f32/to_le_bytes', 'to_le_bytes', null, 'How f32::to_le_bytes works', 'The float\'s 4 bytes, least significant first.', one('1.0_f32.to_le_bytes()', '1.0', '[0, 0, 128, 63]', 'x86 order', 'Little-endian order.', 'The same 4 bytes...', '...reversed.', '[0, 0, 128, 63]', 'Most file formats document which order they use.'),
  'd(1.0_f32.to_le_bytes())');
add('f32/to_ne_bytes', 'to_ne_bytes', null, 'How f32::to_ne_bytes works', 'The float\'s bytes in this machine\'s native order.', one('x.to_ne_bytes()', '1.0', '4 bytes', 'native order', 'Little-endian on x86 and most ARM.', 'Native order.', 'Matches to_le_bytes here.', 'true', 'Avoid for files shared between machines.'),
  '(1.0_f32.to_ne_bytes() == if cfg!(target_endian = "little") { 1.0_f32.to_le_bytes() } else { 1.0_f32.to_be_bytes() }).to_string()');
add('f32/from_be_bytes', 'from_be_bytes', null, 'How f32::from_be_bytes works', 'An f32 from 4 bytes, most significant first.', one('f32::from_be_bytes([0x40, 0x49, 0x0f, 0xdb])', 'big-endian bytes', '3.1415927', 'read a binary format', 'These bytes encode π.', 'Read big-endian.', 'π in f32.', '3.1415927', 'from_le_bytes reads the other order.'),
  'f32::from_be_bytes([0x40, 0x49, 0x0f, 0xdb]).to_string()');
add('f32/from_le_bytes', 'from_le_bytes', null, 'How f32::from_le_bytes works', 'An f32 from 4 bytes, least significant first.', one('f32::from_le_bytes([0, 0, 0x80, 0x3f])', 'little-endian bytes', '1', 'read a binary format', 'The bytes of 1.0, reversed.', 'Read little-endian.', '1.0.', '1', 'Pairs with to_le_bytes.'),
  'f32::from_le_bytes([0, 0, 0x80, 0x3f]).to_string()');
add('f32/from_ne_bytes', 'from_ne_bytes', null, 'How f32::from_ne_bytes works', 'An f32 from 4 bytes in native order.', one('f32::from_ne_bytes(b)', 'native bytes', 'round trip', 'same machine only', 'Round-trips with to_ne_bytes.', 'Write native bytes.', 'Read them back.', '2.5', 'For data that never leaves the machine.'),
  'f32::from_ne_bytes(2.5_f32.to_ne_bytes()).to_string()');

// ---------------------------------------------------------------- f32: std maths

add('f32/exp2', 'exp2', S32, 'How f32::exp2 works', '2 raised to the power x.', one('3.0_f32.exp2()', '3', '8', '2^x', 'The inverse of log2.', '2³.', '8.', '8', 'For integer powers of two, shifting is exact.'),
  '3.0_f32.exp2().to_string()');
add('f32/log2', 'log2', S32, 'How f32::log2 works', 'The base-2 logarithm.', one('8.0_f32.log2()', '8', '3', 'powers of two', '2³ = 8.', 'log₂ 8.', '3.', '3', 'ilog2 for integers.'),
  '8.0_f32.log2().to_string()');
add('f32/log', 'log', S32, 'How f32::log works', 'The logarithm in any base.', one('9.0_f32.log(3.0)', '9, base 3', '2', 'log_b(x)', '3² = 9.', 'Which power of 3 gives 9?', '2.', '2', 'log2, log10 and ln are more precise for their bases.'),
  '9.0_f32.log(3.0).to_string()');
add('f32/exp_m1', 'exp_m1', S32, 'How f32::exp_m1 works', 'eˣ - 1, accurate for tiny x.', one('0.0_f32.exp_m1()', '0', '0', 'precise near 0', 'exp(x) - 1 loses digits for small x.', 'e⁰ - 1.', '0.', '0', 'Pairs with ln_1p.'),
  '0.0_f32.exp_m1().to_string()');
add('f32/ln_1p', 'ln_1p', S32, 'How f32::ln_1p works', 'ln(1 + x), accurate for tiny x.', one('0.0_f32.ln_1p()', '0', '0', 'precise near 0', 'Adding 1 first would lose small digits.', 'ln(1 + 0).', '0.', '0', 'The inverse of exp_m1.'),
  '0.0_f32.ln_1p().to_string()');
add('f32/asin', 'asin', S32, 'How f32::asin works', 'The angle whose sine is x.', one('1.0_f32.asin()', '1', 'π/2 ≈ 1.571', 'inverse sine', 'Input must be in -1..=1.', 'sin(π/2) = 1.', 'π/2.', '1.571', 'Out-of-range input gives NaN.'),
  'format!("{:.3}", 1.0_f32.asin())');
add('f32/acos', 'acos', S32, 'How f32::acos works', 'The angle whose cosine is x.', one('0.0_f32.acos()', '0', 'π/2 ≈ 1.571', 'inverse cosine', 'Result is in 0..=π.', 'cos(π/2) = 0.', 'π/2.', '1.571', 'Clamp inputs to -1..=1 to avoid NaN.'),
  'format!("{:.3}", 0.0_f32.acos())');
add('f32/atan', 'atan', S32, 'How f32::atan works', 'The angle whose tangent is x.', one('1.0_f32.atan()', '1', 'π/4 ≈ 0.785', 'slope → angle', 'Result is in -π/2..π/2.', 'tan(π/4) = 1.', 'π/4.', '0.785', 'Prefer atan2 for points.'),
  'format!("{:.3}", 1.0_f32.atan())');
add('f32/sinh', 'sinh', S32, 'How f32::sinh works', 'The hyperbolic sine.', one('0.0_f32.sinh()', '0', '0', '(eˣ - e⁻ˣ) / 2', 'sinh(0) = 0.', 'e⁰ - e⁰ = 0.', '0.', '0', 'cosh and tanh are related.'),
  '0.0_f32.sinh().to_string()');
add('f32/cosh', 'cosh', S32, 'How f32::cosh works', 'The hyperbolic cosine.', one('0.0_f32.cosh()', '0', '1', '(eˣ + e⁻ˣ) / 2', 'cosh(0) = 1.', '(1 + 1) / 2.', '1.', '1', 'Describes a hanging chain.'),
  '0.0_f32.cosh().to_string()');
add('f32/tanh', 'tanh', S32, 'How f32::tanh works', 'The hyperbolic tangent: an S-curve between -1 and 1.', one('0.0_f32.tanh()', '0', '0', 'squash into -1..1', 'tanh(0) = 0.', 'At 0 the curve is centred.', '0.', '0', 'Used as a neural-network activation.'),
  '0.0_f32.tanh().to_string()');
add('f32/asinh', 'asinh', S32, 'How f32::asinh works', 'The inverse hyperbolic sine.', one('0.0_f32.asinh()', '0', '0', 'undo sinh', 'asinh(sinh(x)) = x.', 'sinh(0) = 0.', 'So asinh(0) = 0.', '0', 'Defined for every number.'),
  '0.0_f32.asinh().to_string()');
add('f32/acosh', 'acosh', S32, 'How f32::acosh works', 'The inverse hyperbolic cosine (x ≥ 1).', one('1.0_f32.acosh()', '1', '0', 'undo cosh', 'cosh(0) = 1.', 'Input 1.', 'acosh(1) = 0.', '0', 'Inputs below 1 give NaN.'),
  '1.0_f32.acosh().to_string()');
add('f32/atanh', 'atanh', S32, 'How f32::atanh works', 'The inverse hyperbolic tangent (-1 < x < 1).', one('0.0_f32.atanh()', '0', '0', 'undo tanh', 'tanh(0) = 0.', 'Input 0.', 'atanh(0) = 0.', '0', '±1 gives infinity.'),
  '0.0_f32.atanh().to_string()');
add('f32/sin_cos', 'sin_cos', S32, 'How f32::sin_cos works', 'Sine and cosine together.', one('0.0_f32.sin_cos()', '0', '(0, 1)', 'both at once', 'Handy for rotations.', 'sin 0 = 0, cos 0 = 1.', '(0.0, 1.0).', '(0.0, 1.0)', 'let (s, c) = angle.sin_cos();'),
  'd(0.0_f32.sin_cos())');
add('f32/div_euclid', 'div_euclid', S32, 'How f32::div_euclid works', 'Division rounded so the remainder is never negative.', one('(-7.0_f32).div_euclid(2.0)', '-7 / 2', '-4', 'pairs with rem_euclid', '-4 × 2 + 1 = -7.', '-3.5 is rounded down.', '-4.', '-4', 'For grid coordinates with negative values.'),
  '(-7.0_f32).div_euclid(2.0).to_string()');
add('f32/round_ties_even', 'round_ties_even', S32, 'How f32::round_ties_even works', 'Rounds to the nearest integer; halves go to the even neighbour.', two('x.round_ties_even()', '0.5', '1.5', '0', '2', 'banker\'s rounding', 'Avoids drift in long sums.', '0.5 → 0.', '1.5 → 2.', '0, 2', 'round() would give 1 and 2.'),
  'format!("{}, {}", 0.5_f32.round_ties_even(), 1.5_f32.round_ties_even())');

// ---------------------------------------------------------------- f64: remaining

add('f64/is_normal', 'is_normal', C64, 'How f64::is_normal works', 'true for ordinary non-zero numbers.', two('x.is_normal()', '1e-300', '1e-320', 'true', 'false', 'full precision?', 'Below about 2.2e-308 numbers are subnormal.', '1e-300: normal.', '1e-320: subnormal.', 'true, false', 'classify gives all categories.'),
  'format!("{}, {}", 1e-300_f64.is_normal(), 1e-320_f64.is_normal())');
add('f64/is_subnormal', 'is_subnormal', C64, 'How f64::is_subnormal works', 'true for numbers too tiny for full precision.', two('x.is_subnormal()', '1e-320', '0.0', 'true', 'false', 'tiny, imprecise', 'Zero is not subnormal.', '1e-320: true.', '0.0: false.', 'true, false', 'Flush-to-zero modes turn these into 0.'),
  'format!("{}, {}", 1e-320_f64.is_subnormal(), 0.0_f64.is_subnormal())');
add('f64/next_down', 'next_down', C64, 'How f64::next_down works', 'The next representable f64 below this one.', one('1.0_f64.next_down()', '1.0', '0.9999999999999999', 'one step down', 'The gap just below 1.0 is 2⁻⁵³.', 'Step down.', '0.9999999999999999.', '0.9999999999999999', 'next_up goes up.'),
  '1.0_f64.next_down().to_string()');
add('f64/to_be_bytes', 'to_be_bytes', C64, 'How f64::to_be_bytes works', 'The 8 bytes of the float, most significant first.', one('1.0_f64.to_be_bytes()', '1.0', '[63, 240, 0, 0, 0, 0, 0, 0]', 'network order', 'Bits 0x3ff0000000000000.', 'Big-endian.', '3f f0 00 …', '[63, 240, 0, 0, 0, 0, 0, 0]', 'from_be_bytes reads it back.'),
  'd(1.0_f64.to_be_bytes())');
add('f64/to_le_bytes', 'to_le_bytes', C64, 'How f64::to_le_bytes works', 'The 8 bytes of the float, least significant first.', one('1.0_f64.to_le_bytes()', '1.0', '[0, 0, 0, 0, 0, 0, 240, 63]', 'x86 order', 'The reverse of big-endian.', 'Little-endian.', '… f0 3f.', '[0, 0, 0, 0, 0, 0, 240, 63]', 'Used by many binary file formats.'),
  'd(1.0_f64.to_le_bytes())');
add('f64/to_ne_bytes', 'to_ne_bytes', C64, 'How f64::to_ne_bytes works', 'The float\'s bytes in native order.', one('x.to_ne_bytes()', '1.0', '8 bytes', 'native order', 'Matches LE on most machines.', 'Native order.', 'Same as one of LE/BE.', 'true', 'Only for data that stays on one machine.'),
  '(1.0_f64.to_ne_bytes() == if cfg!(target_endian = "little") { 1.0_f64.to_le_bytes() } else { 1.0_f64.to_be_bytes() }).to_string()');
add('f64/from_be_bytes', 'from_be_bytes', C64, 'How f64::from_be_bytes works', 'An f64 from 8 bytes, most significant first.', one('f64::from_be_bytes([0x40, 0, 0, 0, 0, 0, 0, 0])', 'big-endian bytes', '2', 'read binary data', 'Exponent 0x400 = × 2.', 'Read big-endian.', '2.0.', '2', 'Pairs with to_be_bytes.'),
  'f64::from_be_bytes([0x40, 0, 0, 0, 0, 0, 0, 0]).to_string()');
add('f64/from_le_bytes', 'from_le_bytes', C64, 'How f64::from_le_bytes works', 'An f64 from 8 bytes, least significant first.', one('f64::from_le_bytes([0, 0, 0, 0, 0, 0, 0xf0, 0x3f])', 'little-endian bytes', '1', 'read binary data', 'The bytes of 1.0, reversed.', 'Read little-endian.', '1.0.', '1', 'Pairs with to_le_bytes.'),
  'f64::from_le_bytes([0, 0, 0, 0, 0, 0, 0xf0, 0x3f]).to_string()');
add('f64/from_ne_bytes', 'from_ne_bytes', C64, 'How f64::from_ne_bytes works', 'An f64 from 8 bytes in native order.', one('f64::from_ne_bytes(b)', 'native bytes', 'round trip', 'same machine', 'Round-trips with to_ne_bytes.', 'Write native bytes.', 'Read them back.', '-0.5', 'For memory-mapped or local data.'),
  'f64::from_ne_bytes((-0.5_f64).to_ne_bytes()).to_string()');
add('f64/asinh', 'asinh', S64, 'How f64::asinh works', 'The inverse hyperbolic sine.', one('0.0_f64.asinh()', '0', '0', 'undo sinh', 'asinh(sinh(x)) = x.', 'sinh(0) = 0.', 'asinh(0) = 0.', '0', 'Defined for all inputs.'),
  '0.0_f64.asinh().to_string()');
add('f64/acosh', 'acosh', S64, 'How f64::acosh works', 'The inverse hyperbolic cosine (x ≥ 1).', one('1.0_f64.acosh()', '1', '0', 'undo cosh', 'cosh(0) = 1.', 'Input 1.', '0.', '0', 'Below 1: NaN.'),
  '1.0_f64.acosh().to_string()');
add('f64/atanh', 'atanh', S64, 'How f64::atanh works', 'The inverse hyperbolic tangent (-1 < x < 1).', one('0.0_f64.atanh()', '0', '0', 'undo tanh', 'tanh(0) = 0.', 'Input 0.', '0.', '0', '±1 gives ±infinity.'),
  '0.0_f64.atanh().to_string()');

module.exports = list;
