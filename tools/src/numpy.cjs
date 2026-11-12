const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { ROOT, out, A, check } = require('./packages.cjs');
const { B, M, mv, fill, fade, show, lab, T, slides, L } = require('./lib.cjs');
const { stepAnim, gridMove, gridFill } = require('./lib2.cjs');
const SCR = __dirname;
// Python with the NumPy to check against: PONDER_PYTHON, else `python` from PATH (NumPy must be installed there).
const PY = process.env.PONDER_PYTHON || 'python';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ponder-numpy-'));

// ---------- symbols ----------
function oldPath(f) {
  if (f.startsWith('numpy/_core/')) return f.replace('numpy/_core/', 'numpy/core/');
  const m = f.match(/^numpy\/lib\/_(\w+)_impl\.py$/); if (m) return `numpy/lib/${m[1]}.py`;
  if (f === 'numpy/linalg/_linalg.py') return 'numpy/linalg/linalg.py';
  if (f === 'numpy/fft/_helper.py') return 'numpy/fft/helper.py';
  return f;
}
// `sym:` paths start at the package folder itself (site-packages/numpy/), not at site-packages/.
const rel = f => f.startsWith('numpy/') ? f.slice('numpy/'.length) : f;
const pyi = f => (f.endsWith('.py') ? f.slice(0, -3) + '.pyi' : f);
// Names that exist only in NumPy 1.x (extra legacy aliases of an animated function).
const GONE_IN_2 = new Set(['trapz']);
/**
 * Symbols for one NumPy generation: ver 2 = the layout of numpy 2.x (numpy/_core/...), ver 1 = numpy 1.x
 * (numpy/core/..., numpy/lib/function_base.py). Each document only lists paths that exist in its own versions,
 * so `ponder check` can verify every symbol against a real install.
 */
function nsymV(file, name, extraNames = [], ver = 2) {
  const f = ver === 1 ? oldPath(file) : file;
  const mod = (p) => (p.endsWith('.py') ? p.slice(0, -3) : p).split('/').join('.');
  const names = [name, ...extraNames.filter((n) => ver === 1 || !GONE_IN_2.has(n))];
  const symbol = `py:${mod(f)}.${name}`;
  const aliases = [];
  for (const n of names) {
    if (n !== name) aliases.push(`py:${mod(f)}.${n}`);
    aliases.push(`sym:${rel(f)}:${n}`, `sym:${pyi(rel(f))}:${n}`);   // the stub is what editors often jump to
  }
  return { symbol, aliases };
}
const FN = 'numpy/_core/fromnumeric.py', NUM = 'numpy/_core/numeric.py', MA = 'numpy/_core/multiarray.py';

// ---------- custom animations ----------
function linspaceAnim() {
  const b = new B(); b.title('np.linspace(0, 1, 5)'); b.note('start = 0, stop = 1, num = 5 points');
  b.raw('axis', { type: 'line', x: 150, y: 330, width: 700, height: 0, stroke: 'muted', strokeWidth: 3 });
  const vals = [0, 0.25, 0.5, 0.75, 1], lbl = ['0.0', '0.25', '0.5', '0.75', '1.0'];
  vals.forEach((v, i) => {
    const x = 150 + v * 700, inner = i > 0 && i < 4;
    b.raw('p' + i, { type: 'circle', x, y: 330, radius: 20, fill: i === 0 || i === 4 ? 'warning' : 'success', visible: !inner });
    b.text('l' + i, lbl[i], x, 275, { size: 26, fill: 'text', visible: !inner });
  });
  b.raw('step', { type: 'arrow', x: 150, y: 420, width: 175, height: 0, stroke: 'warning', strokeWidth: 4, visible: false });
  b.text('stl', 'step = (1 - 0) / (5 - 1) = 0.25', 400, 470, { size: 24, fill: 'warning', visible: false });
  b.a.p0.visible = true; b.a.l0.visible = true; b.a.p4.visible = true; b.a.l4.visible = true;
  b.a.p0.visible = false; b.a.l0.visible = false; b.a.p4.visible = false; b.a.l4.visible = false;
  return { b, slides: slides([
    ['np.linspace() gets a start of 0, a stop of 1 and num = 5: it must make 5 evenly spaced numbers from 0 to 1.'],
    ['The first number is the start (0.0) and the last is the stop (1.0).', { p0: { visible: true }, l0: { visible: true }, p4: { visible: true }, l4: { visible: true } }, 700],
    ['5 points make 4 gaps, so each step is (1 - 0) / 4 = 0.25.', { step: { visible: true }, stl: { visible: true } }, 700],
    ['Stepping 0.25 at a time from the start fills in the points between: 0.25, 0.5 and 0.75.', { p1: { visible: true }, l1: { visible: true }, p2: { visible: true }, l2: { visible: true }, p3: { visible: true }, l3: { visible: true }, step: { visible: false }, stl: { visible: false } }, 1000],
    ['np.linspace(0, 1, 5) = [0.0, 0.25, 0.5, 0.75, 1.0]', T('note', 'result: [0.0, 0.25, 0.5, 0.75, 1.0]', { fill: 'success' }), 500],
  ]) };
}

function dotAnim() {
  const b = new B(); b.title('np.dot([1, 2, 3], [4, 5, 6])'); b.note('multiply matching pairs, then add');
  const x = i => 300 + i * 200;
  [1, 2, 3].forEach((v, i) => b.item('a' + i, String(v), x(i), 190, { w: 76, h: 76 }));
  [4, 5, 6].forEach((v, i) => b.item('b' + i, String(v), x(i), 290, { w: 76, h: 76, fill: 'accent2' }));
  [4, 10, 18].forEach((v, i) => b.item('p' + i, String(v), x(i), 400, { w: 76, h: 76, fill: 'warning', visible: false }));
  b.item('tot', '32', 500, 505, { w: 90, h: 70, fill: 'success', visible: false });
  b.text('eq', '', 500, 345, { size: 26, fill: 'warning' }); b.a.eq.x = 800; b.a.eq.y = 345; b.a.eq.visible = false; b.a.eq.text = '';
  return { b, slides: slides([
    ['np.dot() gets two 1-D arrays of the same length: [1, 2, 3] and [4, 5, 6].'],
    ['Items in the same position are multiplied: 1 × 4 = 4, 2 × 5 = 10 and 3 × 6 = 18.', show(b, ['p0', 'p1', 'p2'])],
    ['The products are added up: 4 + 10 + 18 = 32.', M(show(b, ['tot']), fill(b, ['p0', 'p1', 'p2'], 'accent'))],
    ['np.dot([1, 2, 3], [4, 5, 6]) = 32 (the dot product, a single number)', T('note', 'result: 32', { fill: 'success' }), 500],
  ]) };
}

function whereAnim() {
  const b = new B(); b.title('np.where(cond, x, y)'); b.note('pick from x where True, from y where False');
  const x = i => 280 + i * 150;
  const rows = [['cond', 190], ['x', 290], ['y', 390], ['result', 490]];
  rows.forEach(([t, y]) => b.text('rl_' + t, t, 110, y, { size: 22 }));
  [true, false, true, false].forEach((v, i) => b.item('c' + i, v ? 'True' : 'False', x(i), 190, { w: 110, h: 70, fill: v ? 'success' : 'danger', size: 26 }));
  [1, 2, 3, 4].forEach((v, i) => b.item('x' + i, String(v), x(i), 290, { w: 110, h: 70 }));
  [10, 20, 30, 40].forEach((v, i) => b.item('y' + i, String(v), x(i), 390, { w: 110, h: 70, fill: 'accent2' }));
  [1, 20, 3, 40].forEach((v, i) => b.item('r' + i, String(v), x(i), 490, { w: 110, h: 70, fill: 'success', visible: false }));
  return { b, slides: slides([
    ['cond = [True, False, True, False], x = [1, 2, 3, 4], y = [10, 20, 30, 40]. np.where() works column by column.'],
    ['Where cond is True the result takes the value from x: 1 in column 0 and 3 in column 2.', M(show(b, ['r0', 'r2']), fill(b, ['x0', 'x2'], 'warning'))],
    ['Where cond is False it takes the value from y instead: 20 in column 1 and 40 in column 3.', M(show(b, ['r1', 'r3']), fill(b, ['x0', 'x2'], 'accent'), fill(b, ['y1', 'y3'], 'warning'))],
    ['np.where(cond, x, y) = [1, 20, 3, 40]', M(fill(b, ['y1', 'y3'], 'accent2'), T('note', 'result: [1, 20, 3, 40]', { fill: 'success' })), 500],
  ]) };
}

// ---------- specs: {id, name, file, extra?, title, desc, expr, expected, build} ----------
const R = (cap, text) => ({ cap, text });
const specs = [];
const add = (id, name, file, desc, expr, expected, build, extra, sym, title) => specs.push({ id, name, file, desc, expr, expected, build, extra, sym, title });

add('sum', 'sum', FN, 'Adds up all the values in an array.', 'np.sum([1,2,3,4])', 10, stepAnim({
  call: 'np.sum([1, 2, 3, 4])', note: 'add the values together', inputs: ['1', '2', '3', '4'], outputs: ['10'], idx: false,
  intro: 'np.sum() gets the array [1, 2, 3, 4] and adds all its values.',
  steps: [{ srcs: [0], outs: [0], set: { 0: '1' }, eq: 'total = 1', cap: 'Start with the first value: the total is 1.' },
    { srcs: [1], outs: [0], set: { 0: '3' }, eq: '1 + 2 = 3', cap: 'Add the next value: 1 + 2 = 3.' },
    { srcs: [2], outs: [0], set: { 0: '6' }, eq: '3 + 3 = 6', cap: 'Add the next value: 3 + 3 = 6.' },
    { srcs: [3], outs: [0], set: { 0: '10' }, eq: '6 + 4 = 10', cap: 'Add the last value: 6 + 4 = 10.' }],
  result: R('np.sum([1, 2, 3, 4]) = 10 (one number for the whole array)', '10') }));

add('mean', 'mean', FN, 'Gives the average of the values in an array.', 'np.mean([2,4,6,8])', 5, stepAnim({
  call: 'np.mean([2, 4, 6, 8])', note: 'sum divided by how many values', inputs: ['2', '4', '6', '8'], outputs: ['20'],
  intro: 'np.mean() gets the array [2, 4, 6, 8].',
  steps: [{ srcs: [0, 1, 2, 3], outs: [0], set: { 0: '20' }, eq: '2 + 4 + 6 + 8 = 20', cap: 'First it adds up all the values: 2 + 4 + 6 + 8 = 20.' },
    { srcs: [0, 1, 2, 3], outs: [0], set: { 0: '5.0' }, eq: '20 / 4 = 5.0', cap: 'Then it divides by how many values there are (4): 20 / 4 = 5.0.' }],
  result: R('np.mean([2, 4, 6, 8]) = 5.0', '5.0') }));

add('max', 'max', FN, 'Finds the largest value in an array.', 'np.max([3,9,2,7])', 9, stepAnim({
  call: 'np.max([3, 9, 2, 7])', note: 'keep the biggest value seen so far', inputs: ['3', '9', '2', '7'], outputs: ['9'],
  intro: 'np.max() gets the array [3, 9, 2, 7] and looks for the largest value.',
  steps: [{ srcs: [0], outs: [0], set: { 0: '3' }, eq: 'biggest so far: 3', cap: 'The first value, 3, is the biggest so far.' },
    { srcs: [1], outs: [0], set: { 0: '9' }, eq: '9 > 3  →  new biggest: 9', cap: '9 is bigger than 3, so 9 is the new biggest.' },
    { srcs: [2], outs: [0], eq: '2 < 9  →  keep 9', cap: '2 is smaller than 9, so 9 stays.' },
    { srcs: [3], outs: [0], eq: '7 < 9  →  keep 9', cap: '7 is smaller than 9 too.' }],
  result: R('np.max([3, 9, 2, 7]) = 9', '9') }), ['amax']);

add('argmax', 'argmax', FN, 'Gives the position of the largest value in an array.', 'np.argmax([3,9,2,7])', 1, stepAnim({
  call: 'np.argmax([3, 9, 2, 7])', note: 'returns the position, not the value', inputs: ['3', '9', '2', '7'], outputs: ['1'], idx: true,
  intro: 'np.argmax() gets [3, 9, 2, 7]. It returns the INDEX of the largest value.',
  steps: [{ srcs: [0], outs: [0], set: { 0: '0' }, eq: 'best so far: 3 at index 0', cap: 'The first value, 3, is the biggest so far, at index 0.' },
    { srcs: [1], outs: [0], set: { 0: '1' }, eq: '9 > 3  →  best index is 1', cap: '9 is bigger than 3, so the best index becomes 1.' },
    { srcs: [2], outs: [0], eq: '2 < 9  →  keep index 1', cap: '2 is smaller than 9, so the best index stays 1.' },
    { srcs: [3], outs: [0], eq: '7 < 9  →  keep index 1', cap: '7 is smaller than 9 as well.' }],
  result: R('np.argmax([3, 9, 2, 7]) = 1 (the 9 sits at index 1)', '1') }));

add('sort', 'sort', FN, 'Returns a sorted copy of an array, smallest first.', 'np.sort([4,1,3,2])', [1, 2, 3, 4], stepAnim({
  call: 'np.sort([4, 1, 3, 2])', note: 'returns a sorted COPY, the original is unchanged', inputs: ['4', '1', '3', '2'], outputs: ['1', '2', '3', '4'],
  intro: 'np.sort() gets [4, 1, 3, 2].',
  steps: [{ srcs: [1], outs: [0], cap: 'The smallest value is 1, so it goes first.' }, { srcs: [3], outs: [1], cap: 'The next smallest is 2.' },
    { srcs: [2], outs: [2], cap: 'Then 3.' }, { srcs: [0], outs: [3], cap: 'And the largest, 4, goes last.' }],
  result: R('np.sort([4, 1, 3, 2]) = [1, 2, 3, 4]. The input array is not changed.', '[1, 2, 3, 4]') }));

add('flip', 'flip', 'numpy/lib/_function_base_impl.py', 'Reverses the order of the values in an array.', 'np.flip([1,2,3,4])', [4, 3, 2, 1], stepAnim({
  call: 'np.flip([1, 2, 3, 4])', note: 'reverses the order', inputs: ['1', '2', '3', '4'], outputs: ['4', '3', '2', '1'],
  intro: 'np.flip() gets [1, 2, 3, 4].',
  steps: [{ srcs: [3], outs: [0], cap: 'The last value, 4, becomes the first.' }, { srcs: [2], outs: [1], cap: 'The second-to-last value, 3, becomes the second.' },
    { srcs: [1], outs: [2], cap: 'Then 2.' }, { srcs: [0], outs: [3], cap: 'And the first value, 1, ends up last.' }],
  result: R('np.flip([1, 2, 3, 4]) = [4, 3, 2, 1]', '[4, 3, 2, 1]') }));

add('repeat', 'repeat', FN, 'Repeats each value of an array a number of times.', 'np.repeat([1,2,3],2)', [1, 1, 2, 2, 3, 3], stepAnim({
  call: 'np.repeat([1, 2, 3], 2)', note: 'each VALUE is repeated 2 times in a row', inputs: ['1', '2', '3'], outputs: ['1', '1', '2', '2', '3', '3'],
  intro: 'np.repeat() gets [1, 2, 3] and the number 2.',
  steps: [{ srcs: [0], outs: [0, 1], cap: 'The first value, 1, is written 2 times: 1, 1.' }, { srcs: [1], outs: [2, 3], cap: 'Then 2 is written 2 times.' }, { srcs: [2], outs: [4, 5], cap: 'Then 3 is written 2 times.' }],
  result: R('np.repeat([1, 2, 3], 2) = [1, 1, 2, 2, 3, 3]', '[1, 1, 2, 2, 3, 3]') }));

add('tile', 'tile', 'numpy/lib/_shape_base_impl.py', 'Repeats a whole array again and again.', 'np.tile([1,2,3],2)', [1, 2, 3, 1, 2, 3], stepAnim({
  call: 'np.tile([1, 2, 3], 2)', note: 'the WHOLE array is repeated 2 times', inputs: ['1', '2', '3'], outputs: ['1', '2', '3', '1', '2', '3'],
  intro: 'np.tile() gets [1, 2, 3] and the number 2.',
  steps: [{ srcs: [0, 1, 2], outs: [0, 1, 2], cap: 'The whole array is written once: 1, 2, 3.' }, { srcs: [0, 1, 2], outs: [3, 4, 5], cap: 'Then the whole array is written a second time.' }],
  result: R('np.tile([1, 2, 3], 2) = [1, 2, 3, 1, 2, 3]. Compare np.repeat, which repeats each value.', '[1, 2, 3, 1, 2, 3]') }));

add('diff', 'diff', 'numpy/lib/_function_base_impl.py', 'Gives the differences between neighbouring values.', 'np.diff([1,4,9,16])', [3, 5, 7], stepAnim({
  call: 'np.diff([1, 4, 9, 16])', note: 'each value minus the one before it', inputs: ['1', '4', '9', '16'], outputs: ['3', '5', '7'],
  intro: 'np.diff() gets [1, 4, 9, 16]. The result has one item fewer.',
  steps: [{ srcs: [0, 1], outs: [0], eq: '4 - 1 = 3', cap: 'First pair: 4 - 1 = 3.' }, { srcs: [1, 2], outs: [1], eq: '9 - 4 = 5', cap: 'Next pair: 9 - 4 = 5.' }, { srcs: [2, 3], outs: [2], eq: '16 - 9 = 7', cap: 'Last pair: 16 - 9 = 7.' }],
  result: R('np.diff([1, 4, 9, 16]) = [3, 5, 7]', '[3, 5, 7]') }));

add('unique', 'unique', 'numpy/lib/_arraysetops_impl.py', 'Gives the sorted distinct values of an array.', 'np.unique([3,1,2,3,1])', [1, 2, 3], stepAnim({
  call: 'np.unique([3, 1, 2, 3, 1])', note: 'sorted, each value only once', inputs: ['3', '1', '2', '3', '1'], outputs: ['1', '2', '3'], idx: true,
  intro: 'np.unique() gets [3, 1, 2, 3, 1]. Some values appear more than once.',
  steps: [{ srcs: [1, 4], outs: [0], cap: 'The smallest distinct value is 1. It appears at index 1 and 4, but is kept only once.' }, { srcs: [2], outs: [1], cap: 'Next comes 2 (it appears once).' }, { srcs: [0, 3], outs: [2], cap: 'Then 3, which appears at index 0 and 3, kept once.' }],
  result: R('np.unique([3, 1, 2, 3, 1]) = [1, 2, 3]', '[1, 2, 3]') }));

add('concatenate', 'concatenate', MA, 'Joins arrays end to end.', 'np.concatenate(([1,2,3],[4,5,6]))', [1, 2, 3, 4, 5, 6], stepAnim({
  call: 'np.concatenate(([1, 2, 3], [4, 5, 6]))', note: 'joins arrays end to end', inputs: ['1', '2', '3', '4', '5', '6'], inFills: ['accent', 'accent', 'accent', 'accent2', 'accent2', 'accent2'], outputs: ['1', '2', '3', '4', '5', '6'],
  intro: 'np.concatenate() gets two arrays: [1, 2, 3] (blue) and [4, 5, 6] (second colour).',
  steps: [{ srcs: [0, 1, 2], outs: [0, 1, 2], cap: 'The values of the first array come first.' }, { srcs: [3, 4, 5], outs: [3, 4, 5], cap: 'The values of the second array follow directly after them.' }],
  result: R('np.concatenate(([1, 2, 3], [4, 5, 6])) = [1, 2, 3, 4, 5, 6]', '[1, 2, 3, 4, 5, 6]') }));

add('transpose', 'transpose', FN, 'Swaps the rows and columns of an array.', 'np.transpose([[1,2,3],[4,5,6]])', [[1, 4], [2, 5], [3, 6]], gridMove({
  call: 'np.transpose([[1, 2, 3], [4, 5, 6]])', note: 'shape (2, 3)  →  shape (3, 2)',
  cells: [1, 2, 3, 4, 5, 6].map((v, i) => { const r = Math.floor(i / 3), c = i % 3; return { v, from: [180 + c * 100, 260 + r * 100], to: [620 + r * 100, 210 + c * 100] }; }),
  intro: 'np.transpose() gets a 2 × 3 array: 2 rows and 3 columns.',
  steps: [{ ids: [0, 1, 2], cap: 'The first ROW (1, 2, 3) becomes the first COLUMN.' }, { ids: [3, 4, 5], cap: 'The second row (4, 5, 6) becomes the second column.' }],
  result: R('np.transpose([[1, 2, 3], [4, 5, 6]]) = [[1, 4], [2, 5], [3, 6]] (3 rows, 2 columns)', '[[1, 4], [2, 5], [3, 6]]') }));

add('stack', 'stack', 'numpy/_core/shape_base.py', 'Joins arrays along a NEW axis.', 'np.stack([[1,2,3],[4,5,6]])', [[1, 2, 3], [4, 5, 6]], gridMove({
  call: 'np.stack([[1, 2, 3], [4, 5, 6]])', note: 'two arrays of shape (3,)  →  one of shape (2, 3)',
  cells: [1, 2, 3, 4, 5, 6].map((v, i) => i < 3 ? { v, from: [120 + i * 100, 220], to: [400 + i * 100, 380] } : { v, from: [600 + (i - 3) * 100, 220], to: [400 + (i - 3) * 100, 480], fill: 'accent2' }),
  intro: 'np.stack() gets two arrays that have the same shape: [1, 2, 3] and [4, 5, 6].',
  steps: [{ ids: [0, 1, 2], cap: 'The first array becomes row 0 of a new, taller array.' }, { ids: [3, 4, 5], cap: 'The second array becomes row 1. stack() adds a new axis, so the result has one more dimension.' }],
  result: R('np.stack([[1, 2, 3], [4, 5, 6]]) = [[1, 2, 3], [4, 5, 6]] (shape (2, 3))', '[[1, 2, 3], [4, 5, 6]]') }));

add('ones', 'ones', NUM, 'Makes a new array filled with ones.', 'np.ones((2,3))', [[1, 1, 1], [1, 1, 1]], gridFill({
  call: 'np.ones((2, 3))', note: 'shape (2, 3): 2 rows, 3 columns', rows: 2, cols: 3, init: '?',
  intro: 'np.ones() gets a shape: (2, 3) means 2 rows and 3 columns.',
  allocCap: 'It makes a new array with that shape: 2 × 3 = 6 cells.',
  steps: [{ cells: [0, 1].flatMap(r => [0, 1, 2].map(c => [r, c])), text: '1.0', cap: 'Every cell is set to 1. The default type is float, so the values print as 1.0.' }],
  result: R('np.ones((2, 3)) = [[1.0, 1.0, 1.0], [1.0, 1.0, 1.0]]', '[[1.0, 1.0, 1.0], [1.0, 1.0, 1.0]]') }));

add('eye', 'eye', 'numpy/lib/_twodim_base_impl.py', 'Makes an identity-style matrix: ones on the diagonal, zeros elsewhere.', 'np.eye(3)', [[1, 0, 0], [0, 1, 0], [0, 0, 1]], gridFill({
  call: 'np.eye(3)', note: 'N = 3: a 3 × 3 matrix', rows: 3, cols: 3, init: '?',
  intro: 'np.eye() gets N = 3, so it makes a square 3 × 3 matrix.',
  allocCap: 'A new array with 3 rows and 3 columns is made.',
  steps: [{ cells: [0, 1, 2].flatMap(r => [0, 1, 2].map(c => [r, c])), text: '0.0', color: 'accent', cap: 'All cells start as 0.0.' },
    { cells: [[0, 0], [1, 1], [2, 2]], text: '1.0', cap: 'The diagonal (row 0 col 0, row 1 col 1, row 2 col 2) is set to 1.0.' }],
  result: R('np.eye(3) = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]', '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]') }));

add('linspace', 'linspace', 'numpy/_core/function_base.py', 'Makes evenly spaced numbers between a start and a stop.', 'np.linspace(0,1,5)', [0, 0.25, 0.5, 0.75, 1], linspaceAnim());
add('dot', 'dot', MA, 'Multiplies matching items and adds them up (the dot product).', 'np.dot([1,2,3],[4,5,6])', 32, dotAnim());
add('where', 'where', MA, 'Picks values from x or y depending on a condition.', 'np.where([True,False,True,False],[1,2,3,4],[10,20,30,40])', [1, 20, 3, 40], whereAnim());

require('./batch2.cjs')({ add, FN, NUM, MA, R });
require('./batch3.cjs')({ add, specs, R });
// ---------- truth check with real NumPy ----------
const existing = out['v1/pypi/numpy.json'].documents[0].ponder.animations;
const exprs = specs.map(s => s.expr).concat(['np.clip([1,5,9,12],3,10)', 'np.argsort([30,10,20])', 'np.cumsum([1,2,3,4])', 'np.reshape(np.arange(6),(2,3))']);
const expExisting = [[3, 5, 9, 10], [1, 2, 0], [1, 3, 6, 10], [[0, 1, 2], [3, 4, 5]]];
const expected = specs.map(s => s.expected).concat(expExisting);
fs.writeFileSync(path.join(TMP, 'exprs.json'), JSON.stringify(exprs));
fs.writeFileSync(path.join(TMP, 'truth.py'), `import json,numpy as np
ex=json.load(open(r'${path.join(TMP, 'exprs.json').replace(/\\/g, '/')}'))
def cv(v):
    if hasattr(v,'tolist'): return v.tolist()
    if isinstance(v,(list,tuple)): return [cv(x) for x in v]
    return v
o=[cv(eval(e)) for e in ex]
print(json.dumps(o))
`);
const res = JSON.parse(cp.execFileSync(PY, ['-I', path.join(TMP, 'truth.py')]).toString());
let wrong = 0;
const rnd = v => Array.isArray(v) ? v.map(rnd) : (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
exprs.forEach((e, i) => { if (JSON.stringify(rnd(res[i])) !== JSON.stringify(rnd(expected[i]))) { wrong++; console.log('MISMATCH', e, JSON.stringify(res[i]), JSON.stringify(expected[i])); } });
// check defining files
const names = specs.filter(s => !s.sym).map(s => s.name + '@' + s.file).join(',');
const chk = cp.execFileSync(PY, ['-c', `
import sys; sys.path.insert(0, r'${SCR.replace(/\\/g, '/')}')
import defs
for it in '${names}'.split(','):
    n,f=it.split('@')
    if f not in defs.find(n): print('NOT DEFINED IN', f, n, defs.find(n))
`]).toString();
if (chk.trim()) { console.log(chk); wrong++; }
console.log('truth check:', wrong ? 'FAILED' : 'all ' + exprs.length + ' examples match real NumPy ' + '2.5.4');

// ---------- assemble ----------
const v2 = {}, base = {};
for (const [k, a] of Object.entries(existing)) {     // clip, argsort, cumsum, reshape (built in packages.cjs)
  v2[k] = { ...a, ...nsymV(FN, k, [], 2) };
  base[k] = { ...a, ...nsymV(FN, k, [], 1) };
}
for (const s of specs) {
  const make = (ver) => A(s.sym || nsymV(s.file, s.name, s.extra || [], ver), s.title || `How np.${s.name}() works`, s.desc, s.build);
  v2[s.id] = make(2);
  if (!s.minVer) base[s.id] = make(1);               // functions new in 2.x are not in the 1.x document
}
const anims = v2;
const D0 = out['v1/pypi/numpy.json'].documents[0];
const lib = D0.ponder.library;
out['v1/pypi/numpy.json'].documents = [
  { versions: '>=1.20 <2.0', ponder: { version: 1, library: lib, animations: base } },
  { versions: '>=2.0', ponder: { version: 1, library: lib, animations: v2 } },
];
const doc = out['v1/pypi/numpy.json'];
console.log('numpy animations:', Object.keys(anims).length, 'in >=2.0 doc;', Object.keys(base).length, 'in 1.x doc');
if (wrong) { console.error('numpy truth check failed'); process.exitCode = 1; }
module.exports = { doc, wrong };
