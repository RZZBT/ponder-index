// num-integer: 6 animations (#85-90). Truth code calls the trait methods as Integer::div_floor(&-7, &2): the same
// function as (-7).div_floor(&2), without the clash with std's unstable inherent methods of the same name.
const { Scene, lines } = require('./scene.cjs');
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });

add('gcd', 'How num_integer::gcd() works', 'The greatest common divisor, by Euclid\'s algorithm.', () => lines({
  call: 'num_integer::gcd(48, 18)', note: 'the largest number that divides both',
  lines: ['48 = 2 × 18 + 12', '18 = 1 × 12 + 6', '12 = 2 × 6 + 0', 'remainder 0 → the answer is 6'],
  intro: 'Euclid\'s idea: gcd(a, b) is the same as gcd(b, a mod b). Repeat until the remainder is 0.',
  steps: [
    { cap: '48 divided by 18 leaves 12. Now find gcd(18, 12).', show: [0] },
    { cap: '18 divided by 12 leaves 6. Now gcd(12, 6).', show: [1] },
    { cap: '12 divided by 6 leaves 0.', show: [2] },
    { cap: 'When the remainder is 0, the last divisor is the answer: 6 divides both 48 and 18. (num-integer uses Stein\'s binary variant, which gives the same result.)', show: [3] },
  ],
  result: '6', resultCap: 'gcd(48, 18) is 6, so 48/18 simplifies to 8/3. The result is never negative.',
}), 'd(num_integer::gcd(48, 18))', '6');

add('lcm', 'How num_integer::lcm() works', 'The least common multiple: the smallest number both divide.', () => lines({
  call: 'num_integer::lcm(4, 6)', note: 'the smallest number that is a multiple of both',
  lines: ['multiples of 4: 4, 8, 12, 16, …', 'multiples of 6: 6, 12, 18, …', 'gcd(4, 6) = 2', '4 × 6 / 2 = 12'],
  intro: 'lcm() finds the first number that appears in both lists of multiples, without writing the lists.',
  steps: [
    { cap: 'Listing multiples shows 12 as the first shared one.', show: [0, 1] },
    { cap: 'lcm() uses the gcd instead: 2 is the largest number that divides both.', show: [2] },
    { cap: 'a × b counts the shared factor twice; dividing by the gcd removes it once.', show: [3] },
  ],
  result: '12', resultCap: 'lcm(4, 6) is 12: the first time two cycles of 4 and 6 steps line up again. (It divides before multiplying, to avoid overflow.)',
}), 'd(num_integer::lcm(4, 6))', '12');

add('div-floor', 'How Integer::div_floor() works', 'Integer division that rounds down, also for negative numbers.', () => {
  const sc = new Scene('(-7).div_floor(&2)', '-7 / 2 = -3.5: which way to round?');
  const xs = [-5, -4, -3, -2, -1, 0].map((_, i) => 500 + (i - 2.5) * 120);
  [-5, -4, -3, -2, -1, 0].forEach((v, i) => sc.box('n' + i, v, xs[i], 260, { w: 70, h: 56, fill: 'surface' }));
  sc.text('p', '-3.5', (xs[1] + xs[2]) / 2, 200, { fill: 'warning', size: 26 });
  sc.text('eq', '', 500, 380, { size: 26, fill: 'warning' });
  sc.intro('The exact answer, -3.5, lies between -4 and -3.');
  sc.step('Rust\'s / operator rounds towards zero: -7 / 2 is -3.', [sc.hi(['n2'], 'danger'), sc.say('eq', '-7 / 2 = -3 (towards zero)')]);
  sc.step('div_floor() rounds down, towards minus infinity: -4.', [sc.hi(['n1'], 'success'), sc.say('eq', '(-7).div_floor(&2) = -4 (down)')]);
  sc.step('For positive numbers both agree: 7 / 2 and 7.div_floor(&2) are both 3. Rounding down is what you want for things like "which bucket of size 2 holds -7".', sc.say('eq', '7 / 2 = 7.div_floor(&2) = 3'));
  sc.result('-4 (while -7 / 2 = -3)', 'div_floor() pairs with mod_floor(): -4 × 2 + 1 = -7. Since Rust 1.38, i32::div_euclid() is similar (it differs when the divisor is negative).', sc.say('eq', ''));
  return sc.build();
}, 'format!("{} (while -7 / 2 = {})", Integer::div_floor(&-7i32, &2), -7i32 / 2)', '-4 (while -7 / 2 = -3)');

add('mod-floor', 'How Integer::mod_floor() works', 'The remainder that has the sign of the divisor.', () => lines({
  call: '(-7).mod_floor(&2)', note: '-7 % 2 is -1 in Rust; mod_floor gives 1',
  lines: ['% pairs with / (towards zero): -7 = -3 × 2 + (-1)', '→ -7 % 2 = -1', 'mod_floor pairs with div_floor: -7 = -4 × 2 + 1', '→ (-7).mod_floor(&2) = 1'],
  intro: 'A remainder always belongs to a division: quotient × divisor + remainder = the number.',
  steps: [
    { cap: 'Rust\'s / gives -3, so % must give -1 to make the sum work.', show: [0] },
    { cap: 'So -7 % 2 is -1: the remainder takes the sign of -7.', show: [1] },
    { cap: 'div_floor() gives -4, so the matching remainder is 1.', show: [2] },
    { cap: 'mod_floor() always has the sign of the divisor, so with a positive divisor it is never negative. Handy for wrapping indices: (i - 1).mod_floor(&len).', show: [3] },
  ],
  result: '1 (while -7 % 2 = -1)', resultCap: 'mod_floor(-7, 2) is 1, and -7 % 2 is -1. A check like x % 2 == 1 for odd numbers fails for negative x; mod_floor does not.',
}), 'format!("{} (while -7 % 2 = {})", Integer::mod_floor(&-7i32, &2), -7i32 % 2)', '1 (while -7 % 2 = -1)');

add('div-rem', 'How Integer::div_rem() works', 'The quotient and the remainder in one call.', () => lines({
  call: '17.div_rem(&5)', note: 'returns (quotient, remainder)',
  lines: ['how many 5s fit in 17? 3 (3 × 5 = 15)', 'what is left? 17 − 15 = 2', '(3, 2)', 'check: 3 × 5 + 2 = 17'],
  intro: 'div_rem() does / and % together and returns both as a tuple.',
  steps: [
    { cap: 'The quotient: 5 fits into 17 three times.', show: [0] },
    { cap: 'The remainder: 2 is left over.', show: [1] },
    { cap: 'Both come back together, so you can write let (q, r) = 17.div_rem(&5);', show: [2] },
    { cap: 'They always satisfy q × divisor + r = number.', show: [3] },
  ],
  result: '(3, 2)', resultCap: '17.div_rem(&5) is (3, 2). It rounds towards zero like / and %; div_mod_floor() is the rounding-down version.',
}), 'd(Integer::div_rem(&17, &5))', '(3, 2)');

add('binomial', 'How num_integer::binomial() works', 'The number of ways to choose k items out of n.', () => {
  const sc = new Scene('num_integer::binomial(5, 2)', 'ways to choose 2 of 5 = row 5 of Pascal\'s triangle');
  const rows = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1]];
  rows.forEach((row, r) => row.forEach((v, k) => sc.box(`p${r}_${k}`, v, 500 + (k - r / 2) * 76, 175 + r * 62, { w: 64, h: 50, size: 24, visible: r < 2, fill: 'surface' })));
  sc.text('eq', '', 500, 544, { size: 24, fill: 'warning' });
  const ids = (r) => rows[r].map((_, k) => `p${r}_${k}`);
  sc.intro('binomial(n, k) is "n choose k". Pascal\'s triangle lists these numbers: each one is the sum of the two above it.');
  sc.step('Rows 2 and 3: 1 2 1 and 1 3 3 1. For example 3 = 1 + 2.', sc.show([...ids(2), ...ids(3)]));
  sc.step('Row 4: 1 4 6 4 1 (6 = 3 + 3).', sc.show(ids(4)));
  sc.step('Row 5: 1 5 10 10 5 1. Position 2 in row 5 (counting from 0) is 10.', [sc.show(ids(5)), sc.hi(['p5_2'], 'success'), sc.hi(['p4_1', 'p4_2'], 'warning'), sc.say('eq', '10 = 4 + 6')]);
  sc.step('binomial() computes it directly: 5 × 4 / (2 × 1) = 10. From {a, b, c, d, e} you can pick ab, ac, ad, ae, bc, bd, be, cd, ce, de.', sc.say('eq', '5 × 4 / 2 = 10'));
  sc.result('10', 'binomial(5, 2) is 10. multinomial() generalises it to more than two groups.', sc.say('eq', ''));
  return sc.build();
}, 'd(num_integer::binomial(5u64, 2))', '10');

module.exports = A;
