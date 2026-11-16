// Rust standard library: the rest of f64 (maths, trigonometry, bits) and the common f32 methods.
// Methods that need the platform's maths library live in std/src/num/f64.rs; the rest in core/src/num/f64.rs.
const { group } = require('./kit.cjs');
const STD = ['std', 'f64', /num\/f64\.rs$/];
const CORE = ['core', 'f64', /num\/f64\.rs$/];
const STD32 = ['std', 'f32', /num\/f32\.rs$/];
const CORE32 = ['core', 'f32', /num\/f32\.rs$/];
const { list, add } = group({ at: STD });

// ---------------------------------------------------------------- powers, roots, logarithms

add('f64/powf', 'powf', null, 'How f64::powf works', 'Raises a float to a float power.', {
  rows: [['2^0.5', '8^(1/3)']], call: '2.0_f64.powf(0.5)', note: 'any exponent', outs: ['1.4142135623730951', '2'],
  intro: 'powf accepts fractional exponents; powi only whole ones (and is faster).',
  steps: [['2^0.5 is the square root of 2.', 0, 'o0'], ['8^(1/3) is the cube root of 8.', 1, 'o1']],
  result: '1.4142135623730951, 2', resultCap: 'Negative bases with fractional exponents give NaN.',
}, 'format!("{}, {}", 2.0_f64.powf(0.5), 8.0_f64.powf(1.0 / 3.0))');

add('f64/cbrt', 'cbrt', null, 'How f64::cbrt works', 'The cube root: the number that, multiplied by itself three times, gives x.', {
  rows: [['27', '-8']], call: '27.0_f64.cbrt()', note: 'works for negatives', outs: ['3', '-2'],
  intro: 'Unlike sqrt, cube roots of negative numbers exist.',
  steps: [['3 × 3 × 3 = 27.', 0, 'o0'], ['-2 × -2 × -2 = -8.', 1, 'o1']],
  result: '3, -2', resultCap: 'More accurate than powf(1.0 / 3.0).',
}, 'format!("{}, {}", 27.0_f64.cbrt(), (-8.0_f64).cbrt())');

add('f64/log10', 'log10', null, 'How f64::log10 works', 'The base-10 logarithm: how many times you multiply 10 to get x.', {
  rows: [['1000', '0.01']], call: '1000.0_f64.log10()', note: 'orders of magnitude', outs: ['3', '-2'],
  intro: '10³ = 1000, 10⁻² = 0.01.',
  steps: [['1000 → 3.', 0, 'o0'], ['0.01 → -2.', 1, 'o1']],
  result: '3, -2', resultCap: 'Decibels and the Richter scale use log10.',
}, 'format!("{}, {}", 1000.0_f64.log10(), 0.01_f64.log10())');

add('f64/log2', 'log2', null, 'How f64::log2 works', 'The base-2 logarithm.', {
  rows: [['8', '1024']], call: '1024.0_f64.log2()', note: 'powers of two', outs: ['3', '10'],
  intro: '2³ = 8, 2¹⁰ = 1024.',
  steps: [['8 → 3.', 0, 'o0'], ['1024 → 10.', 1, 'o1']],
  result: '3, 10', resultCap: 'For integers, ilog2 avoids floats entirely.',
}, 'format!("{}, {}", 8.0_f64.log2(), 1024.0_f64.log2())');

add('f64/log', 'log', null, 'How f64::log works', 'The logarithm in any base.', {
  rows: [['81, base 3', '100, base 10']], call: '81.0_f64.log(3.0)', note: 'log_b(x)', outs: ['4', '2'],
  intro: 'log(b) answers: b to which power gives x?',
  steps: [['3⁴ = 81.', 0, 'o0'], ['10² = 100.', 1, 'o1']],
  result: '4, 2', resultCap: 'log2, log10 and ln are more precise for their bases.',
}, 'format!("{}, {}", 81.0_f64.log(3.0), 100.0_f64.log(10.0))');

add('f64/exp2', 'exp2', null, 'How f64::exp2 works', '2 raised to the power x.', {
  rows: [['10', '-1']], call: '10.0_f64.exp2()', note: '2^x', outs: ['1024', '0.5'],
  intro: 'The inverse of log2.',
  steps: [['2¹⁰ = 1024.', 0, 'o0'], ['2⁻¹ = 0.5.', 1, 'o1']],
  result: '1024, 0.5', resultCap: 'For integer powers of two, 1u64 << n is exact.',
}, 'format!("{}, {}", 10.0_f64.exp2(), (-1.0_f64).exp2())');

add('f64/mul_add', 'mul_add', null, 'How f64::mul_add works', 'Computes x × a + b with a single rounding.', {
  rows: [['2 × 3 + 4']], call: '2.0_f64.mul_add(3.0, 4.0)', note: 'fused multiply-add', outs: ['10'],
  intro: 'The multiplication and addition happen together, which can be more accurate.',
  steps: [['2 × 3 = 6.', 0], ['6 + 4 = 10, rounded once.', [], 'o0']],
  result: '10', resultCap: 'Used in numeric code like polynomial evaluation.',
}, '2.0_f64.mul_add(3.0, 4.0).to_string()');

add('f64/exp_m1', 'exp_m1', null, 'How f64::exp_m1 works', 'eˣ - 1, accurate even for tiny x.', {
  rows: [['0', '1e-10']], call: '1e-10_f64.exp_m1()', note: 'no precision loss near 0', outs: ['0', '1.00000000005e-10'],
  intro: 'exp(x) - 1 loses digits for small x; exp_m1 keeps them.',
  steps: [['e⁰ - 1 = 0.', 0, 'o0'], ['For 1e-10 the answer is about 1e-10, kept precisely.', 1, 'o1']],
  result: '0, 1.00000000005e-10', resultCap: 'Used in finance and physics formulas with small rates.',
}, 'format!("{}, {:e}", 0.0_f64.exp_m1(), 1e-10_f64.exp_m1())');

add('f64/ln_1p', 'ln_1p', null, 'How f64::ln_1p works', 'ln(1 + x), accurate even for tiny x.', {
  rows: [['0', 'e - 1']], call: 'x.ln_1p()', note: 'the inverse of exp_m1', outs: ['0', '1'],
  intro: 'Adding 1 first would lose the small digits.',
  steps: [['ln(1) = 0.', 0, 'o0'], ['ln(1 + (e - 1)) = ln(e) = 1.', 1, 'o1']],
  result: '0, 1', resultCap: 'Pairs with exp_m1.',
}, 'format!("{}, {}", 0.0_f64.ln_1p(), (std::f64::consts::E - 1.0).ln_1p())');

add('f64/fract', 'fract', null, 'How f64::fract works', 'The part after the decimal point.', {
  rows: [['3.75', '-3.75']], call: 'x.fract()', note: 'x - x.trunc()', outs: ['0.75', '-0.75'],
  intro: 'fract keeps the sign of the number.',
  steps: [['3.75 → 0.75.', 0, 'o0'], ['-3.75 → -0.75.', 1, 'o1']],
  result: '0.75, -0.75', resultCap: 'trunc gives the whole-number part.',
}, 'format!("{}, {}", 3.75_f64.fract(), (-3.75_f64).fract())');

add('f64/round_ties_even', 'round_ties_even', null, 'How f64::round_ties_even works', 'Rounds to the nearest whole number; exact halves go to the even neighbour.', {
  rows: [['2.5', '3.5', '2.6']], call: 'x.round_ties_even()', note: 'banker\'s rounding', outs: ['2', '4', '3'],
  intro: 'round() always rounds halves away from zero; this avoids a bias in long sums.',
  steps: [['2.5 → 2 (even).', 0, 'o0'], ['3.5 → 4 (even).', 1, 'o1'], ['2.6 is not a half: 3.', 2, 'o2']],
  result: '2, 4, 3', resultCap: 'Statistics and accounting often use this rule.',
}, 'format!("{}, {}, {}", 2.5_f64.round_ties_even(), 3.5_f64.round_ties_even(), 2.6_f64.round_ties_even())');

add('f64/div_euclid', 'div_euclid', null, 'How f64::div_euclid works', 'Division rounded so that rem_euclid is never negative.', {
  rows: [['7 / 2', '-7 / 2']], call: '(-7.0_f64).div_euclid(2.0)', note: 'rounds down for positive divisors', outs: ['3', '-4'],
  intro: '-7 / 2 = -3.5; div_euclid gives -4 so the remainder is +1.',
  steps: [['7 / 2 → 3.', 0, 'o0'], ['-7 / 2 → -4, since -4 × 2 + 1 = -7.', 1, 'o1']],
  result: '3, -4', resultCap: 'Pairs with rem_euclid.',
}, 'format!("{}, {}", 7.0_f64.div_euclid(2.0), (-7.0_f64).div_euclid(2.0))');

// ---------------------------------------------------------------- trigonometry

add('f64/sin', 'sin', null, 'How f64::sin works', 'The sine of an angle in radians.', {
  rows: [['0', 'π/2']], call: 'x.sin()', note: 'radians, not degrees', outs: ['0', '1'],
  intro: 'sin gives the height of a point on the unit circle.',
  steps: [['sin(0) = 0.', 0, 'o0'], ['sin(π/2) = 1, the top of the circle.', 1, 'o1']],
  result: '0, 1', resultCap: 'Degrees first need to_radians(): 90.0_f64.to_radians().sin().',
}, 'format!("{}, {}", 0.0_f64.sin(), std::f64::consts::FRAC_PI_2.sin())');

add('f64/cos', 'cos', null, 'How f64::cos works', 'The cosine of an angle in radians.', {
  rows: [['0', 'π']], call: 'x.cos()', note: 'radians', outs: ['1', '-1'],
  intro: 'cos gives the horizontal position on the unit circle.',
  steps: [['cos(0) = 1.', 0, 'o0'], ['cos(π) = -1, the far left.', 1, 'o1']],
  result: '1, -1', resultCap: 'Circles: x = r * a.cos(), y = r * a.sin().',
}, 'format!("{}, {}", 0.0_f64.cos(), std::f64::consts::PI.cos())');

add('f64/tan', 'tan', null, 'How f64::tan works', 'The tangent of an angle in radians: sin / cos.', {
  rows: [['0', 'π/4']], call: 'x.tan()', note: 'slope of the angle', outs: ['0', '≈ 1'],
  intro: 'tan is the slope of a line at that angle.',
  steps: [['tan(0) = 0: flat.', 0, 'o0'], ['tan(π/4) ≈ 1: a 45° slope.', 1, 'o1']],
  result: '0, 1', resultCap: 'Floating-point gives 0.9999999999999999 for π/4; round for display.',
}, 'format!("{}, {}", 0.0_f64.tan(), (std::f64::consts::FRAC_PI_4.tan() * 1e9).round() / 1e9)');

add('f64/atan2', 'atan2', null, 'How f64::atan2 works', 'The angle of the point (x, y), from -π to π.', {
  rows: [['(1, 1)', '(-1, 0)']], call: 'y.atan2(x)', note: 'note the order: y first', outs: ['π/4 ≈ 0.785', 'π ≈ 3.142'],
  intro: 'Unlike atan(y / x), atan2 knows which quadrant the point is in.',
  steps: [['(1, 1) is at 45° = π/4.', 0, 'o0'], ['(-1, 0) is at 180° = π.', 1, 'o1']],
  result: '0.785, 3.142', resultCap: 'The angle a game character must turn to face a target.',
}, 'format!("{:.3}, {:.3}", 1.0_f64.atan2(1.0), 0.0_f64.atan2(-1.0))');

add('f64/asin', 'asin', null, 'How f64::asin works', 'The angle whose sine is x (inverse sine).', {
  rows: [['1', '2']], call: 'x.asin()', note: 'x must be in -1..=1', outs: ['π/2 ≈ 1.571', 'NaN'],
  intro: 'Only values from -1 to 1 have an answer.',
  steps: [['asin(1) = π/2.', 0, 'o0'], ['2 is out of range: NaN.', 1, 'o1']],
  result: '1.571, NaN', resultCap: 'acos is the inverse cosine.',
}, 'format!("{:.3}, {}", 1.0_f64.asin(), 2.0_f64.asin())');

add('f64/acos', 'acos', null, 'How f64::acos works', 'The angle whose cosine is x (inverse cosine).', {
  rows: [['1', '0']], call: 'x.acos()', note: 'result in 0..=π', outs: ['0', 'π/2 ≈ 1.571'],
  intro: 'The angle between two unit vectors is a.dot(b).acos().',
  steps: [['acos(1) = 0.', 0, 'o0'], ['acos(0) = π/2.', 1, 'o1']],
  result: '0.000, 1.571', resultCap: 'NaN outside -1..=1; clamp the input first if rounding may push it over.',
}, 'format!("{:.3}, {:.3}", 1.0_f64.acos(), 0.0_f64.acos())');

add('f64/atan', 'atan', null, 'How f64::atan works', 'The angle whose tangent is x.', {
  rows: [['0', '1']], call: 'x.atan()', note: 'result in -π/2..π/2', outs: ['0', 'π/4 ≈ 0.785'],
  intro: 'atan turns a slope back into an angle.',
  steps: [['atan(0) = 0.', 0, 'o0'], ['atan(1) = π/4.', 1, 'o1']],
  result: '0.000, 0.785', resultCap: 'Prefer atan2(y, x) for points.',
}, 'format!("{:.3}, {:.3}", 0.0_f64.atan(), 1.0_f64.atan())');

add('f64/sin_cos', 'sin_cos', null, 'How f64::sin_cos works', 'Sine and cosine together, as a pair.', {
  rows: [['0']], call: 'angle.sin_cos()', note: '(sin, cos)', outs: ['(0, 1)'],
  intro: 'Often both are needed, e.g. to rotate a point.',
  steps: [['sin(0) = 0.', 0], ['cos(0) = 1.', [], 'o0']],
  result: '(0.0, 1.0)', resultCap: 'let (s, c) = a.sin_cos(); then x\' = x*c - y*s.',
}, 'd(0.0_f64.sin_cos())');

add('f64/sinh', 'sinh', null, 'How f64::sinh works', 'The hyperbolic sine: (eˣ - e⁻ˣ) / 2.', {
  rows: [['0', '1']], call: 'x.sinh()', note: 'hyperbolic functions', outs: ['0', '1.1752011936438014'],
  intro: 'Hyperbolic functions appear in physics, like the shape of a hanging cable.',
  steps: [['sinh(0) = 0.', 0, 'o0'], ['sinh(1) = (e - 1/e) / 2.', 1, 'o1']],
  result: '0, 1.1752011936438014', resultCap: 'cosh and tanh are the related functions.',
}, 'format!("{}, {}", 0.0_f64.sinh(), 1.0_f64.sinh())');

add('f64/tanh', 'tanh', null, 'How f64::tanh works', 'The hyperbolic tangent: an S-curve from -1 to 1.', {
  rows: [['0', '10']], call: 'x.tanh()', note: 'squashes any number into -1..1', outs: ['0', '≈ 1'],
  intro: 'Large inputs get close to 1, very negative ones to -1.',
  steps: [['tanh(0) = 0.', 0, 'o0'], ['tanh(10) is almost 1.', 1, 'o1']],
  result: '0, 1.000000', resultCap: 'A classic activation function in neural networks.',
}, 'format!("{}, {:.6}", 0.0_f64.tanh(), 10.0_f64.tanh())');

add('f64/cosh', 'cosh', null, 'How f64::cosh works', 'The hyperbolic cosine: (eˣ + e⁻ˣ) / 2.', {
  rows: [['0']], call: '0.0_f64.cosh()', note: 'the catenary curve', outs: ['1'],
  intro: 'cosh(0) = (1 + 1) / 2 = 1.',
  steps: [['e⁰ = 1, twice.', 0], ['Half of 2 is 1.', [], 'o0']],
  result: '1', resultCap: 'A hanging chain has the shape y = a·cosh(x / a).',
}, '0.0_f64.cosh().to_string()');

// ---------------------------------------------------------------- core f64: signs, bits, classification

add('f64/is_finite', 'is_finite', CORE, 'How f64::is_finite works', 'true for normal numbers; false for infinity and NaN.', {
  rows: [['1.5', '1.0 / 0.0', '0.0 / 0.0']], call: 'x.is_finite()', note: 'a real number?', outs: ['true', 'false', 'false'],
  intro: 'Check results of divisions before using them.',
  steps: [['1.5: true.', 0, 'o0'], ['Infinity: false.', 1, 'o1'], ['NaN: false.', 2, 'o2']],
  result: 'true, false, false', resultCap: 'is_infinite and is_nan tell the two failure cases apart.',
}, 'let z = 0.0_f64; format!("{}, {}, {}", 1.5_f64.is_finite(), (1.0 / z).is_finite(), (z / z).is_finite())');

add('f64/is_infinite', 'is_infinite', CORE, 'How f64::is_infinite works', 'true for +∞ and -∞.', {
  rows: [['1.0 / 0.0', '-1.0 / 0.0', 'f64::MAX']], call: 'x.is_infinite()', note: 'too big to represent', outs: ['true', 'true', 'false'],
  intro: 'Dividing by zero or overflowing gives infinity.',
  steps: [['+∞ and -∞: true.', [0, 1], 'o0,1'], ['f64::MAX is huge but finite.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'f64::INFINITY is the constant for +∞.',
}, 'let z = 0.0_f64; format!("{}, {}, {}", (1.0 / z).is_infinite(), (-1.0 / z).is_infinite(), f64::MAX.is_infinite())');

add('f64/is_sign_negative', 'is_sign_negative', CORE, 'How f64::is_sign_negative works', 'true if the sign bit is set, including for -0.0.', {
  rows: [['-2.0', '-0.0', '0.0']], call: 'x.is_sign_negative()', note: 'looks at the sign bit', outs: ['true', 'true', 'false'],
  intro: 'Floats have a negative zero; x < 0.0 is false for it, but its sign bit is set.',
  steps: [['-2.0: true.', 0, 'o0'], ['-0.0: true.', 1, 'o1'], ['0.0: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'is_sign_positive is the opposite.',
}, 'format!("{}, {}, {}", (-2.0_f64).is_sign_negative(), (-0.0_f64).is_sign_negative(), 0.0_f64.is_sign_negative())');

add('f64/is_sign_positive', 'is_sign_positive', CORE, 'How f64::is_sign_positive works', 'true if the sign bit is clear, including for +0.0.', {
  rows: [['3.0', '0.0', '-0.0']], call: 'x.is_sign_positive()', note: 'the sign bit', outs: ['true', 'true', 'false'],
  intro: '+0.0 counts as positive.',
  steps: [['3.0 and 0.0: true.', [0, 1], 'o0,1'], ['-0.0: false.', 2, 'o2']],
  result: 'true, true, false', resultCap: 'NaN can have either sign.',
}, 'format!("{}, {}, {}", 3.0_f64.is_sign_positive(), 0.0_f64.is_sign_positive(), (-0.0_f64).is_sign_positive())');

add('f64/copysign', 'copysign', CORE, 'How f64::copysign works', 'The size of one number with the sign of another.', {
  rows: [['3.0 with sign of -1', '-3.0 with sign of 2']], call: '3.0_f64.copysign(-1.0)', note: 'combine size and sign', outs: ['-3', '3'],
  intro: 'Only the sign of the second number is used.',
  steps: [['3 takes a minus sign.', 0, 'o0'], ['-3 takes a plus sign.', 1, 'o1']],
  result: '-3, 3', resultCap: 'Handy for direction: speed.copysign(target - pos).',
}, 'format!("{}, {}", 3.0_f64.copysign(-1.0), (-3.0_f64).copysign(2.0))');

add('f64/recip', 'recip', CORE, 'How f64::recip works', 'The reciprocal: 1 / x.', {
  rows: [['4', '0.5']], call: 'x.recip()', note: 'flip a fraction', outs: ['0.25', '2'],
  intro: 'recip(x) = 1.0 / x.',
  steps: [['1 / 4 = 0.25.', 0, 'o0'], ['1 / 0.5 = 2.', 1, 'o1']],
  result: '0.25, 2', resultCap: 'Frequencies and periods: period = freq.recip().',
}, 'format!("{}, {}", 4.0_f64.recip(), 0.5_f64.recip())');

add('f64/to_degrees', 'to_degrees', CORE, 'How f64::to_degrees works', 'Converts radians to degrees.', {
  rows: [['π', 'π/2']], call: 'angle.to_degrees()', note: '180 / π', outs: ['180', '90'],
  intro: 'Maths functions use radians; people read degrees.',
  steps: [['π radians = 180°.', 0, 'o0'], ['π/2 = 90°.', 1, 'o1']],
  result: '180, 90', resultCap: 'to_radians goes back.',
}, 'format!("{}, {}", std::f64::consts::PI.to_degrees(), std::f64::consts::FRAC_PI_2.to_degrees())');

add('f64/to_bits', 'to_bits', CORE, 'How f64::to_bits works', 'The raw 64 bits of the float, as a u64.', {
  rows: [['1.0']], call: '1.0_f64.to_bits()', note: 'IEEE 754 layout', outs: ['0x3ff0000000000000'],
  intro: 'Sign (1 bit), exponent (11 bits) and fraction (52 bits).',
  steps: [['1.0 has exponent 0x3ff and fraction 0.', 0], ['Together: 0x3ff0000000000000.', [], 'o0']],
  result: '0x3ff0000000000000', resultCap: 'Useful for hashing floats or writing them to binary files.',
}, 'format!("{:#x}", 1.0_f64.to_bits())');

add('f64/from_bits', 'from_bits', CORE, 'How f64::from_bits works', 'Builds a float from its raw 64 bits.', {
  rows: [['0x4000000000000000']], call: 'f64::from_bits(0x4000000000000000)', note: 'bits → float', outs: ['2'],
  intro: 'The inverse of to_bits.',
  steps: [['Exponent 0x400 means × 2.', 0], ['The float is 2.0.', [], 'o0']],
  result: '2', resultCap: 'f64::from_bits(x.to_bits()) == x for every non-NaN x.',
}, 'f64::from_bits(0x4000000000000000).to_string()');

add('f64/classify', 'classify', CORE, 'How f64::classify works', 'Which kind of float it is: Normal, Zero, Subnormal, Infinite or Nan.', {
  rows: [['1.0', '0.0', '1e-310']], call: 'x.classify()', note: 'FpCategory', outs: ['Normal', 'Zero', 'Subnormal'],
  intro: 'Very tiny numbers lose precision: they are "subnormal".',
  steps: [['1.0 is Normal.', 0, 'o0'], ['0.0 is Zero.', 1, 'o1'], ['1e-310 is below the normal range: Subnormal.', 2, 'o2']],
  result: 'Normal, Zero, Subnormal', resultCap: 'Match on it to handle every special case at once.',
}, 'format!("{:?}, {:?}, {:?}", 1.0_f64.classify(), 0.0_f64.classify(), 1e-310_f64.classify())');

add('f64/midpoint', 'midpoint', CORE, 'How f64::midpoint works', 'The value halfway between two floats, without overflow.', {
  rows: [['2 and 8', 'MAX and MAX']], call: 'a.midpoint(b)', note: '(a + b) / 2, safely', outs: ['5', 'MAX'],
  intro: '(MAX + MAX) / 2 would overflow to infinity; midpoint does not.',
  steps: [['Halfway between 2 and 8 is 5.', 0, 'o0'], ['MAX and MAX: MAX.', 1, 'o1']],
  result: '5, true', resultCap: 'Integers have midpoint too.',
}, 'format!("{}, {}", 2.0_f64.midpoint(8.0), f64::MAX.midpoint(f64::MAX) == f64::MAX)');

add('f64/next_up', 'next_up', CORE, 'How f64::next_up works', 'The very next float above this one.', {
  rows: [['1.0']], call: '1.0_f64.next_up()', note: 'the smallest step', outs: ['1.0000000000000002'],
  intro: 'Floats are not continuous: there is a gap between neighbours.',
  steps: [['Above 1.0 the gap is 2⁻⁵².', 0], ['The next float is 1.0000000000000002.', [], 'o0']],
  result: '1.0000000000000002', resultCap: 'next_down goes the other way. The gap is f64::EPSILON at 1.0.',
}, '1.0_f64.next_up().to_string()');

// ---------------------------------------------------------------- f32

add('f32/sqrt', 'sqrt', STD32, 'How f32::sqrt works', 'The square root of a 32-bit float.', {
  rows: [['9', '2']], call: 'x.sqrt()', note: 'f32: about 7 digits', outs: ['3', '1.4142135'],
  intro: 'f32 is less precise than f64, but uses half the memory.',
  steps: [['√9 = 3.', 0, 'o0'], ['√2 ≈ 1.4142135 (fewer digits than f64).', 1, 'o1']],
  result: '3, 1.4142135', resultCap: 'Negative inputs give NaN.',
}, 'format!("{}, {}", 9.0_f32.sqrt(), 2.0_f32.sqrt())');

add('f32/powi', 'powi', STD32, 'How f32::powi works', 'Raises an f32 to a whole-number power.', {
  rows: [['1.5²', '2⁻²']], call: 'x.powi(2)', note: 'integer exponent', outs: ['2.25', '0.25'],
  intro: 'powi multiplies; it is faster than powf.',
  steps: [['1.5 × 1.5 = 2.25.', 0, 'o0'], ['2⁻² = 1/4.', 1, 'o1']],
  result: '2.25, 0.25', resultCap: 'Squared distances: dx.powi(2) + dy.powi(2).',
}, 'format!("{}, {}", 1.5_f32.powi(2), 2.0_f32.powi(-2))');

add('f32/powf', 'powf', STD32, 'How f32::powf works', 'Raises an f32 to a float power.', {
  rows: [['4^0.5']], call: '4.0_f32.powf(0.5)', note: 'fractional exponent', outs: ['2'],
  intro: 'x^0.5 is the square root.',
  steps: [['4^0.5 = √4.', 0], ['= 2.', [], 'o0']],
  result: '2', resultCap: 'Gamma correction in graphics uses c.powf(2.2).',
}, '4.0_f32.powf(0.5).to_string()');

add('f32/round', 'round', STD32, 'How f32::round works', 'Rounds to the nearest whole number; halves go away from zero.', {
  rows: [['2.5', '-2.5', '2.4']], call: 'x.round()', note: 'nearest integer', outs: ['3', '-3', '2'],
  intro: 'The result is still an f32.',
  steps: [['2.5 → 3.', 0, 'o0'], ['-2.5 → -3.', 1, 'o1'], ['2.4 → 2.', 2, 'o2']],
  result: '3, -3, 2', resultCap: 'Convert to an integer afterwards with as i32.',
}, 'format!("{}, {}, {}", 2.5_f32.round(), (-2.5_f32).round(), 2.4_f32.round())');

add('f32/floor', 'floor', STD32, 'How f32::floor works', 'Rounds down to the whole number at or below.', {
  rows: [['2.9', '-2.1']], call: 'x.floor()', note: 'towards -∞', outs: ['2', '-3'],
  intro: 'floor always goes down, even for negatives.',
  steps: [['2.9 → 2.', 0, 'o0'], ['-2.1 → -3.', 1, 'o1']],
  result: '2, -3', resultCap: 'Grid cell from a position: (pos / cell_size).floor().',
}, 'format!("{}, {}", 2.9_f32.floor(), (-2.1_f32).floor())');

add('f32/ceil', 'ceil', STD32, 'How f32::ceil works', 'Rounds up to the whole number at or above.', {
  rows: [['2.1', '-2.9']], call: 'x.ceil()', note: 'towards +∞', outs: ['3', '-2'],
  intro: 'ceil always goes up.',
  steps: [['2.1 → 3.', 0, 'o0'], ['-2.9 → -2.', 1, 'o1']],
  result: '3, -2', resultCap: 'How many pages: (items / per_page).ceil().',
}, 'format!("{}, {}", 2.1_f32.ceil(), (-2.9_f32).ceil())');

add('f32/abs', 'abs', CORE32, 'How f32::abs works', 'The value without its sign.', {
  rows: [['-1.5', '1.5']], call: 'x.abs()', note: 'distance from 0', outs: ['1.5', '1.5'],
  intro: 'abs clears the sign bit.',
  steps: [['-1.5 → 1.5.', 0, 'o0'], ['1.5 stays.', 1, 'o1']],
  result: '1.5, 1.5', resultCap: 'Compare floats with a tolerance: (a - b).abs() < 1e-6.',
}, 'format!("{}, {}", (-1.5_f32).abs(), 1.5_f32.abs())');

add('f32/min', 'min', CORE32, 'How f32::min works', 'The smaller of two f32 values, ignoring NaN.', {
  rows: [['1.0 vs 2.0', '1.0 vs NaN']], call: 'a.min(b)', note: 'NaN loses', outs: ['1', '1'],
  intro: 'If one side is NaN, the other one is returned.',
  steps: [['1.0 is smaller.', 0, 'o0'], ['NaN is ignored: 1.0.', 1, 'o1']],
  result: '1, 1', resultCap: 'max works the same way.',
}, 'format!("{}, {}", 1.0_f32.min(2.0), 1.0_f32.min(f32::NAN))');

add('f32/max', 'max', CORE32, 'How f32::max works', 'The larger of two f32 values, ignoring NaN.', {
  rows: [['1.0 vs 2.0', 'NaN vs 2.0']], call: 'a.max(b)', note: 'NaN loses', outs: ['2', '2'],
  intro: 'The non-NaN value always wins.',
  steps: [['2.0 is larger.', 0, 'o0'], ['NaN is ignored: 2.0.', 1, 'o1']],
  result: '2, 2', resultCap: 'For a list: iter().copied().fold(f32::MIN, f32::max).',
}, 'format!("{}, {}", 1.0_f32.max(2.0), f32::NAN.max(2.0))');

add('f32/clamp', 'clamp', CORE32, 'How f32::clamp works', 'Keeps an f32 between a minimum and a maximum.', {
  rows: [['-0.5', '0.3', '1.7']], call: 'x.clamp(0.0, 1.0)', note: 'e.g. an opacity', outs: ['0', '0.3', '1'],
  intro: 'Below the range becomes the minimum; above becomes the maximum.',
  steps: [['-0.5 → 0.', 0, 'o0'], ['0.3 stays.', 1, 'o1'], ['1.7 → 1.', 2, 'o2']],
  result: '0, 0.3, 1', resultCap: 'Panics if min > max or either is NaN.',
}, 'format!("{}, {}, {}", (-0.5_f32).clamp(0.0, 1.0), 0.3_f32.clamp(0.0, 1.0), 1.7_f32.clamp(0.0, 1.0))');

add('f32/sin', 'sin', STD32, 'How f32::sin works', 'The sine of an f32 angle in radians.', {
  rows: [['0', 'π/2']], call: 'x.sin()', note: 'radians', outs: ['0', '1'],
  intro: 'Same as f64::sin, with f32 precision.',
  steps: [['sin(0) = 0.', 0, 'o0'], ['sin(π/2) = 1.', 1, 'o1']],
  result: '0, 1', resultCap: 'Games often use f32 for speed and memory.',
}, 'format!("{}, {}", 0.0_f32.sin(), std::f32::consts::FRAC_PI_2.sin())');

add('f32/cos', 'cos', STD32, 'How f32::cos works', 'The cosine of an f32 angle in radians.', {
  rows: [['0', 'π']], call: 'x.cos()', note: 'radians', outs: ['1', '-1'],
  intro: 'Same as f64::cos, with f32 precision.',
  steps: [['cos(0) = 1.', 0, 'o0'], ['cos(π) = -1.', 1, 'o1']],
  result: '1, -1', resultCap: 'sin_cos gives both at once.',
}, 'format!("{}, {}", 0.0_f32.cos(), std::f32::consts::PI.cos())');

add('f32/to_radians', 'to_radians', CORE32, 'How f32::to_radians works', 'Converts degrees to radians for f32.', {
  rows: [['180°']], call: '180.0_f32.to_radians()', note: 'π radians', outs: ['3.1415927'],
  intro: 'f32 shows fewer digits of π than f64.',
  steps: [['180° is half a turn.', 0], ['That is π ≈ 3.1415927.', [], 'o0']],
  result: '3.1415927', resultCap: 'to_degrees goes back.',
}, '180.0_f32.to_radians().to_string()');

module.exports = list;
