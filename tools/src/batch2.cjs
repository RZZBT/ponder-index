const { B, M, mv, fill, fade, show, lab, T, slides, L, chunkAnim } = require('./lib.cjs');
const { stepAnim, gridMove, gridFill, gridEdit } = require('./lib2.cjs');

module.exports = function ({ add, FN, NUM, MA, R }) {
  const TWOD = 'numpy/lib/_twodim_base_impl.py', FB = 'numpy/lib/_function_base_impl.py', SB = 'numpy/_core/shape_base.py',
    SH = 'numpy/lib/_shape_base_impl.py', SET = 'numpy/lib/_arraysetops_impl.py', ST = 'numpy/lib/_stride_tricks_impl.py';
  const S = (v) => v.map(String);
  const run = (srcs, outs, cap, eq, set) => ({ srcs, outs, cap, eq, set });

  // ---------- reductions ----------
  add('argmin', 'argmin', FN, 'Gives the position of the smallest value in an array.', 'np.argmin([3,9,2,7])', 2, stepAnim({
    call: 'np.argmin([3, 9, 2, 7])', note: 'returns the position, not the value', inputs: S([3, 9, 2, 7]), outputs: ['2'], idx: true,
    intro: 'np.argmin() gets [3, 9, 2, 7]. It returns the INDEX of the smallest value.',
    steps: [run([0], [0], 'The first value, 3, is the smallest so far, at index 0.', 'smallest so far: 3 at index 0', { 0: '0' }),
      run([1], [0], '9 is not smaller than 3, so the best index stays 0.', '9 > 3  →  keep index 0'),
      run([2], [0], '2 is smaller than 3, so the best index becomes 2.', '2 < 3  →  best index is 2', { 0: '2' }),
      run([3], [0], '7 is not smaller than 2.', '7 > 2  →  keep index 2')],
    result: R('np.argmin([3, 9, 2, 7]) = 2 (the 2 sits at index 2)', '2') }));

  add('min', 'min', FN, 'Finds the smallest value, either in the whole array or along an axis.', 'np.min([[3,9],[2,7]], axis=0)', [2, 7], (() => {
    const b = new B(); b.title('np.min([[3, 9], [2, 7]], axis=0)'); b.note('axis=0: go DOWN each column');
    const g = [[3, 9], [2, 7]];
    g.forEach((row, r) => row.forEach((v, c) => b.item(`c${r}_${c}`, String(v), 380 + c * 140, 190 + r * 100, { w: 90, h: 80 })));
    [2, 7].forEach((v, c) => b.item('o' + c, String(v), 380 + c * 140, 450, { w: 90, h: 80, fill: 'success', visible: false }));
    b.text('lo', 'result', 230, 450, { size: 22, visible: false });
    return { b, slides: slides([
      ['np.min() gets a 2 × 2 array. With axis=0 it works on each column separately.'],
      ['Column 0 holds 3 and 2. The smaller one is 2.', M(fill(b, ['c0_0', 'c1_0'], 'warning'), show(b, ['o0', 'lo']))],
      ['Column 1 holds 9 and 7. The smaller one is 7.', M(fill(b, ['c0_0', 'c1_0'], 'accent'), fill(b, ['c0_1', 'c1_1'], 'warning'), show(b, ['o1']))],
      ['np.min([[3, 9], [2, 7]], axis=0) = [2, 7]. Without axis it would return the one smallest value of everything: 2.', M(fill(b, ['c0_1', 'c1_1'], 'accent'), T('note', 'result: [2, 7]', { fill: 'success' })), 500],
    ]) };
  })(), ['amin']);

  add('prod', 'prod', FN, 'Multiplies all the values in an array.', 'np.prod([1,2,3,4])', 24, stepAnim({
    call: 'np.prod([1, 2, 3, 4])', note: 'multiply the values together', inputs: S([1, 2, 3, 4]), outputs: ['24'],
    intro: 'np.prod() gets [1, 2, 3, 4] and multiplies all its values.',
    steps: [run([0], [0], 'Start with the first value: 1.', 'product = 1', { 0: '1' }), run([1], [0], '1 × 2 = 2.', '1 × 2 = 2', { 0: '2' }),
      run([2], [0], '2 × 3 = 6.', '2 × 3 = 6', { 0: '6' }), run([3], [0], '6 × 4 = 24.', '6 × 4 = 24', { 0: '24' })],
    result: R('np.prod([1, 2, 3, 4]) = 24', '24') }));

  add('cumprod', 'cumprod', FN, 'Gives the running product of the values in an array.', 'np.cumprod([1,2,3,4])', [1, 2, 6, 24], stepAnim({
    call: 'np.cumprod([1, 2, 3, 4])', note: 'running product', inputs: S([1, 2, 3, 4]), outputs: S([1, 2, 6, 24]),
    intro: 'np.cumprod() gets [1, 2, 3, 4]. Every result is the product of all values so far.',
    steps: [run([0], [0], 'The first result is just the first value: 1.', '1'), run([1], [1], '1 × 2 = 2.', '1 × 2 = 2'), run([2], [2], '2 × 3 = 6.', '2 × 3 = 6'), run([3], [3], '6 × 4 = 24.', '6 × 4 = 24')],
    result: R('np.cumprod([1, 2, 3, 4]) = [1, 2, 6, 24]', '[1, 2, 6, 24]') }));

  add('any', 'any', FN, 'Tells whether at least one value is true (non-zero).', 'np.any([0,0,3,0])', true, stepAnim({
    call: 'np.any([0, 0, 3, 0])', note: 'True if at least one value is non-zero', inputs: S([0, 0, 3, 0]), outputs: ['True'],
    intro: 'np.any() gets [0, 0, 3, 0]. Zero counts as False, every other number counts as True.',
    steps: [run([0], [], '0 is False.', '0 → False'), run([1], [], '0 is False.', '0 → False'),
      run([2], [0], '3 is True. One true value is enough to make the answer True.', '3 → True'), run([3], [0], 'The last 0 does not change the answer.', '0 → False')],
    result: R('np.any([0, 0, 3, 0]) = True', 'True') }));

  add('all', 'all', FN, 'Tells whether every value is true (non-zero).', 'np.all([1,2,0,4])', false, stepAnim({
    call: 'np.all([1, 2, 0, 4])', note: 'True only if every value is non-zero', inputs: S([1, 2, 0, 4]), outputs: ['False'],
    intro: 'np.all() gets [1, 2, 0, 4]. Zero counts as False, every other number counts as True.',
    steps: [run([0], [], '1 is True.', '1 → True'), run([1], [], '2 is True.', '2 → True'),
      run([2], [0], '0 is False. One false value is enough to make the answer False.', '0 → False'), run([3], [0], 'The last value, 4, cannot fix it.', '4 → True')],
    result: R('np.all([1, 2, 0, 4]) = False', 'False') }));

  add('var', 'var', FN, 'Measures how spread out the values are (the variance).', 'np.var([2,4,4,4,5,5,7,9])', 4, stepAnim({
    call: 'np.var([2, 4, 4, 4, 5, 5, 7, 9])', note: 'average squared distance from the mean', inputs: S([2, 4, 4, 4, 5, 5, 7, 9]), outputs: ['4.0'],
    intro: 'np.var() gets 8 values.',
    steps: [run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'First it finds the mean: (2+4+4+4+5+5+7+9) / 8 = 40 / 8 = 5.0.', 'mean = 5.0', { 0: '5.0' }),
      run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'Then it squares each value\'s distance from 5: 9, 1, 1, 1, 0, 0, 4, 16. These add up to 32.', 'squared distances add up to 32', { 0: '32' }),
      run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'The variance is their average: 32 / 8 = 4.0.', '32 / 8 = 4.0', { 0: '4.0' })],
    result: R('np.var([2, 4, 4, 4, 5, 5, 7, 9]) = 4.0', '4.0') }));

  add('std', 'std', FN, 'Measures how spread out the values are (the standard deviation).', 'np.std([2,4,4,4,5,5,7,9])', 2, stepAnim({
    call: 'np.std([2, 4, 4, 4, 5, 5, 7, 9])', note: 'square root of the variance', inputs: S([2, 4, 4, 4, 5, 5, 7, 9]), outputs: ['2.0'],
    intro: 'np.std() gets 8 values.',
    steps: [run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'The mean is (2+4+4+4+5+5+7+9) / 8 = 5.0.', 'mean = 5.0', { 0: '5.0' }),
      run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'The variance is the average squared distance from the mean: 32 / 8 = 4.0.', 'variance = 4.0', { 0: '4.0' }),
      run([0, 1, 2, 3, 4, 5, 6, 7], [0], 'The standard deviation is the square root of the variance: √4.0 = 2.0.', '√4.0 = 2.0', { 0: '2.0' })],
    result: R('np.std([2, 4, 4, 4, 5, 5, 7, 9]) = 2.0', '2.0') }));

  add('median', 'median', FB, 'Finds the middle value of an array.', 'np.median([7,1,5,3,9])', 5, stepAnim({
    call: 'np.median([7, 1, 5, 3, 9])', note: 'the middle value when sorted', inputs: S([7, 1, 5, 3, 9]), outputs: ['5.0'],
    intro: 'np.median() gets [7, 1, 5, 3, 9].',
    steps: [run([0, 1, 2, 3, 4], [], 'Sorted, the values are 1, 3, 5, 7, 9.', 'sorted: 1, 3, 5, 7, 9'),
      run([2], [0], 'There are 5 values, so the middle one is the 3rd: 5. The result is a float: 5.0.', 'middle value = 5.0')],
    result: R('np.median([7, 1, 5, 3, 9]) = 5.0', '5.0') }));

  add('average', 'average', FB, 'Gives the average, optionally giving some values more weight.', 'np.average([1,2,3,4], weights=[4,3,2,1])', 2, stepAnim({
    call: 'np.average([1, 2, 3, 4], weights=[4, 3, 2, 1])', note: 'a weighted average', inputs: S([1, 2, 3, 4]), outputs: ['2.0'],
    intro: 'np.average() gets [1, 2, 3, 4] and the weights [4, 3, 2, 1]: earlier values count more.',
    steps: [run([0, 1, 2, 3], [0], 'Multiply each value by its weight and add: 1×4 + 2×3 + 3×2 + 4×1 = 20.', '4 + 6 + 6 + 4 = 20', { 0: '20' }),
      run([0, 1, 2, 3], [0], 'Divide by the sum of the weights: 20 / (4+3+2+1) = 20 / 10 = 2.0.', '20 / 10 = 2.0', { 0: '2.0' })],
    result: R('np.average([1, 2, 3, 4], weights=[4, 3, 2, 1]) = 2.0', '2.0') }));

  add('round', 'round', FN, 'Rounds numbers to a given number of decimals.', 'np.round([1.26,2.44,3.78], 1)', [1.3, 2.4, 3.8], stepAnim({
    call: 'np.round([1.26, 2.44, 3.78], 1)', note: 'decimals = 1', inputs: ['1.26', '2.44', '3.78'], outputs: ['1.3', '2.4', '3.8'],
    intro: 'np.round() gets [1.26, 2.44, 3.78] and decimals = 1: keep one digit after the point.',
    steps: [run([0], [0], '1.26: the second decimal is 6, so it rounds up to 1.3.', '1.26 → 1.3'), run([1], [1], '2.44: the second decimal is 4, so it rounds down to 2.4.', '2.44 → 2.4'), run([2], [2], '3.78: the second decimal is 8, so it rounds up to 3.8.', '3.78 → 3.8')],
    result: R('np.round([1.26, 2.44, 3.78], 1) = [1.3, 2.4, 3.8]', '[1.3, 2.4, 3.8]') }), ['around']);

  add('count-nonzero', 'count_nonzero', NUM, 'Counts the values that are not zero.', 'np.count_nonzero([0,1,0,2,3])', 3, stepAnim({
    call: 'np.count_nonzero([0, 1, 0, 2, 3])', note: 'how many values are not zero', inputs: S([0, 1, 0, 2, 3]), outputs: ['3'],
    intro: 'np.count_nonzero() gets [0, 1, 0, 2, 3].',
    steps: [run([0], [0], '0 is zero: not counted. The count is 0.', 'count = 0', { 0: '0' }), run([1], [0], '1 is not zero: count = 1.', 'count = 1', { 0: '1' }), run([2], [0], '0: not counted.', 'count = 1'),
      run([3], [0], '2 is not zero: count = 2.', 'count = 2', { 0: '2' }), run([4], [0], '3 is not zero: count = 3.', 'count = 3', { 0: '3' })],
    result: R('np.count_nonzero([0, 1, 0, 2, 3]) = 3', '3') }));

  add('nonzero', 'nonzero', FN, 'Gives the positions of the values that are not zero.', 'np.nonzero([0,1,0,2,3])[0]', [1, 3, 4], stepAnim({
    call: 'np.nonzero([0, 1, 0, 2, 3])', note: 'returns positions (a tuple holding one array)', inputs: S([0, 1, 0, 2, 3]), outputs: ['1', '3', '4'], idx: true,
    intro: 'np.nonzero() gets [0, 1, 0, 2, 3] and finds where the values are not zero.',
    steps: [run([1], [0], '1 at index 1 is not zero, so index 1 is kept.', 'index 1'), run([3], [1], '2 at index 3 is not zero: index 3.', 'index 3'), run([4], [2], '3 at index 4 is not zero: index 4.', 'index 4')],
    result: R('np.nonzero([0, 1, 0, 2, 3]) = (array([1, 3, 4]),). It is a tuple with one array per dimension.', '[1, 3, 4]') }));

  add('searchsorted', 'searchsorted', FN, 'Finds where a value would fit in a sorted array.', 'np.searchsorted([1,3,5,7], 4)', 2, stepAnim({
    call: 'np.searchsorted([1, 3, 5, 7], 4)', note: 'the array must already be sorted', inputs: S([1, 3, 5, 7]), outputs: ['2'], idx: true,
    intro: 'np.searchsorted() gets the sorted array [1, 3, 5, 7] and the value 4.',
    steps: [run([0, 1], [], '1 and 3 are both smaller than 4, so 4 must go after them.', '1 < 4 and 3 < 4'), run([2], [0], '5 is not smaller than 4, so 4 goes just before it: at index 2.', '5 ≥ 4  →  insert at index 2', { 0: '2' })],
    result: R('np.searchsorted([1, 3, 5, 7], 4) = 2: inserting 4 at index 2 keeps the array sorted.', '2') }));

  // ---------- picking / moving ----------
  add('take', 'take', FN, 'Picks values from an array by their index.', 'np.take([10,20,30,40],[3,0])', [40, 10], stepAnim({
    call: 'np.take([10, 20, 30, 40], [3, 0])', note: 'indices = [3, 0]', inputs: S([10, 20, 30, 40]), outputs: ['40', '10'], idx: true,
    intro: 'np.take() gets [10, 20, 30, 40] and the indices [3, 0].',
    steps: [run([3], [0], 'The first index is 3, so it takes the value at index 3: 40.', 'index 3 → 40'), run([0], [1], 'The next index is 0: the value 10.', 'index 0 → 10')],
    result: R('np.take([10, 20, 30, 40], [3, 0]) = [40, 10]', '[40, 10]') }));

  add('roll', 'roll', NUM, 'Shifts values along an array; those pushed off one end wrap around.', 'np.roll([1,2,3,4,5],2)', [4, 5, 1, 2, 3], stepAnim({
    call: 'np.roll([1, 2, 3, 4, 5], 2)', note: 'shift = 2', inputs: S([1, 2, 3, 4, 5]), outputs: S([4, 5, 1, 2, 3]),
    intro: 'np.roll() gets [1, 2, 3, 4, 5] and a shift of 2.',
    steps: [run([3, 4], [0, 1], 'Everything moves 2 places to the right. The last two values, 4 and 5, fall off the end and wrap around to the front.'), run([0, 1, 2], [2, 3, 4], 'The other values shift right by 2: 1, 2, 3.')],
    result: R('np.roll([1, 2, 3, 4, 5], 2) = [4, 5, 1, 2, 3]', '[4, 5, 1, 2, 3]') }));

  add('compress', 'compress', FN, 'Keeps the values where a condition is true.', 'np.compress([True,False,True,False],[1,2,3,4])', [1, 3], stepAnim({
    call: 'np.compress([True, False, True, False], [1, 2, 3, 4])', note: 'green = True, red = False', inputs: S([1, 2, 3, 4]), inFills: ['success', 'danger', 'success', 'danger'], outputs: ['1', '3'],
    intro: 'np.compress() gets the condition [True, False, True, False] and the array [1, 2, 3, 4]. The colours show the condition.',
    steps: [run([0], [0], 'The condition for 1 is True, so 1 is kept.', 'True → keep'), run([1], [], 'The condition for 2 is False, so 2 is dropped.', 'False → drop'), run([2], [1], 'True for 3: kept.', 'True → keep'), run([3], [], 'False for 4: dropped.', 'False → drop')],
    result: R('np.compress([True, False, True, False], [1, 2, 3, 4]) = [1, 3]. This is the same idea as boolean-mask indexing.', '[1, 3]') }));

  add('append', 'append', FB, 'Adds values to the end of an array, giving a new array.', 'np.append([1,2,3],[4,5])', [1, 2, 3, 4, 5], stepAnim({
    call: 'np.append([1, 2, 3], [4, 5])', note: 'returns a NEW array', inputs: S([1, 2, 3, 4, 5]), inFills: ['accent', 'accent', 'accent', 'accent2', 'accent2'], outputs: S([1, 2, 3, 4, 5]),
    intro: 'np.append() gets the array [1, 2, 3] and the values [4, 5] to add.',
    steps: [run([0, 1, 2], [0, 1, 2], 'The original values are copied first.'), run([3, 4], [3, 4], 'The new values follow at the end. The original array is not changed.')],
    result: R('np.append([1, 2, 3], [4, 5]) = [1, 2, 3, 4, 5]', '[1, 2, 3, 4, 5]') }));

  add('insert', 'insert', FB, 'Puts a value into an array at a given index, giving a new array.', 'np.insert([1,2,3],1,99)', [1, 99, 2, 3], stepAnim({
    call: 'np.insert([1, 2, 3], 1, 99)', note: 'insert 99 before index 1', inputs: S([1, 2, 3]), outputs: S([1, 99, 2, 3]),
    intro: 'np.insert() gets [1, 2, 3], the index 1 and the value 99.',
    steps: [run([0], [0], 'Values before index 1 stay where they are: 1.'), run([], [1], 'The new value 99 goes in at index 1.'), run([1, 2], [2, 3], 'The values from index 1 on move one place to the right.')],
    result: R('np.insert([1, 2, 3], 1, 99) = [1, 99, 2, 3]', '[1, 99, 2, 3]') }));

  add('delete', 'delete', FB, 'Removes the value at a given index, giving a new array.', 'np.delete([1,2,3,4],1)', [1, 3, 4], stepAnim({
    call: 'np.delete([1, 2, 3, 4], 1)', note: 'remove the value at index 1', inputs: S([1, 2, 3, 4]), outputs: S([1, 3, 4]), idx: true,
    intro: 'np.delete() gets [1, 2, 3, 4] and the index 1.',
    steps: [run([0], [0], 'The value at index 0 is kept.'), run([1], [], 'The value at index 1 (the 2) is left out.', '2 is removed'), run([2, 3], [1, 2], 'The rest is kept and closes the gap.')],
    result: R('np.delete([1, 2, 3, 4], 1) = [1, 3, 4]', '[1, 3, 4]') }));

  add('vstack', 'vstack', SB, 'Stacks arrays on top of each other, as rows.', 'np.vstack(([1,2,3],[4,5,6]))', [[1, 2, 3], [4, 5, 6]], gridMove({
    call: 'np.vstack(([1, 2, 3], [4, 5, 6]))', note: 'vertical stack: one array per row',
    cells: [1, 2, 3, 4, 5, 6].map((v, i) => i < 3 ? { v, from: [120 + i * 100, 220], to: [400 + i * 100, 380] } : { v, from: [600 + (i - 3) * 100, 220], to: [400 + (i - 3) * 100, 480], fill: 'accent2' }),
    intro: 'np.vstack() gets two 1-D arrays of the same length: [1, 2, 3] and [4, 5, 6].',
    steps: [{ ids: [0, 1, 2], cap: 'The first array becomes the top row.' }, { ids: [3, 4, 5], cap: 'The second array becomes the row below it.' }],
    result: R('np.vstack(([1, 2, 3], [4, 5, 6])) = [[1, 2, 3], [4, 5, 6]]', '[[1, 2, 3], [4, 5, 6]]') }));

  add('hstack', 'hstack', SB, 'Joins arrays side by side.', 'np.hstack(([1,2,3],[4,5,6]))', [1, 2, 3, 4, 5, 6], stepAnim({
    call: 'np.hstack(([1, 2, 3], [4, 5, 6]))', note: 'horizontal stack: side by side', inputs: S([1, 2, 3, 4, 5, 6]), inFills: ['accent', 'accent', 'accent', 'accent2', 'accent2', 'accent2'], outputs: S([1, 2, 3, 4, 5, 6]),
    intro: 'np.hstack() gets two 1-D arrays: [1, 2, 3] and [4, 5, 6].',
    steps: [run([0, 1, 2], [0, 1, 2], 'The first array comes first.'), run([3, 4, 5], [3, 4, 5], 'The second array is placed right after it. For 1-D arrays this is the same as concatenate.')],
    result: R('np.hstack(([1, 2, 3], [4, 5, 6])) = [1, 2, 3, 4, 5, 6]', '[1, 2, 3, 4, 5, 6]') }));

  add('split', 'split', SH, 'Cuts an array into equal parts.', 'np.split(np.array([1,2,3,4,5,6]), 3)', [[1, 2], [3, 4], [5, 6]], chunkAnim({
    call: 'np.split([1, 2, 3, 4, 5, 6], 3)', fn: 'split()', items: [1, 2, 3, 4, 5, 6], size: 2, note: '3 equal parts', intro: 'np.split() gets [1, 2, 3, 4, 5, 6] and 3. It must cut the array into 3 equal parts, so each part has 2 items.', result: '[[1, 2], [3, 4], [5, 6]]' }));

  add('array-split', 'array_split', SH, 'Cuts an array into parts, even when it does not divide evenly.', 'np.array_split(np.array([1,2,3,4,5]), 3)', [[1, 2], [3, 4], [5]], chunkAnim({
    call: 'np.array_split([1, 2, 3, 4, 5], 3)', fn: 'array_split()', items: [1, 2, 3, 4, 5], size: 2, note: '3 parts', intro: 'np.array_split() gets [1, 2, 3, 4, 5] and 3. 5 items cannot be cut into 3 equal parts, so the first parts get one extra item: sizes 2, 2, 1.', result: '[[1, 2], [3, 4], [5]]' }));

  // ---------- 2-D ----------
  add('full', 'full', NUM, 'Makes a new array filled with one value.', 'np.full((2,2),7)', [[7, 7], [7, 7]], gridFill({
    call: 'np.full((2, 2), 7)', note: 'shape (2, 2), fill value 7', rows: 2, cols: 2, init: '?',
    intro: 'np.full() gets a shape (2, 2) and a fill value 7.', allocCap: 'It makes a new array with 2 rows and 2 columns: 4 cells.',
    steps: [{ cells: [[0, 0], [0, 1], [1, 0], [1, 1]], text: '7', cap: 'Every cell is set to 7.' }],
    result: R('np.full((2, 2), 7) = [[7, 7], [7, 7]]', '[[7, 7], [7, 7]]') }));

  add('zeros-like', 'zeros_like', NUM, 'Makes an array of zeros with the same shape as another array.', 'np.zeros_like(np.array([[1,2],[3,4]]))', [[0, 0], [0, 0]], gridFill({
    call: 'np.zeros_like([[1, 2], [3, 4]])', note: 'same shape and type as the input', rows: 2, cols: 2, init: '?',
    intro: 'np.zeros_like() gets [[1, 2], [3, 4]]. It only looks at its shape (2, 2) and type (integers).', allocCap: 'A new array with the same shape, 2 rows and 2 columns, is made.',
    steps: [{ cells: [[0, 0], [0, 1], [1, 0], [1, 1]], text: '0', cap: 'Every cell is set to 0. The values of the input are not used.' }],
    result: R('np.zeros_like([[1, 2], [3, 4]]) = [[0, 0], [0, 0]]', '[[0, 0], [0, 0]]') }));

  add('identity', 'identity', NUM, 'Makes a square identity matrix.', 'np.identity(3)', [[1, 0, 0], [0, 1, 0], [0, 0, 1]], gridFill({
    call: 'np.identity(3)', note: 'n = 3: a 3 × 3 matrix', rows: 3, cols: 3, init: '?',
    intro: 'np.identity() gets n = 3, so it makes a square 3 × 3 matrix.', allocCap: 'A new array with 3 rows and 3 columns is made.',
    steps: [{ cells: [0, 1, 2].flatMap(r => [0, 1, 2].map(c => [r, c])), text: '0.0', color: 'accent', cap: 'All cells start as 0.0.' }, { cells: [[0, 0], [1, 1], [2, 2]], text: '1.0', cap: 'The diagonal is set to 1.0.' }],
    result: R('np.identity(3) = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]', '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]') }));

  add('diag', 'diag', TWOD, 'Makes a diagonal matrix from a list, or reads the diagonal of a matrix.', 'np.diag([1,2,3])', [[1, 0, 0], [0, 2, 0], [0, 0, 3]], gridFill({
    call: 'np.diag([1, 2, 3])', note: 'a 1-D input becomes the diagonal', rows: 3, cols: 3, init: '?',
    intro: 'np.diag() gets the 1-D array [1, 2, 3]. A 1-D input is placed on the diagonal of a square matrix.', allocCap: 'A 3 × 3 matrix is made, one row and column per input value.',
    steps: [{ cells: [0, 1, 2].flatMap(r => [0, 1, 2].map(c => [r, c])), text: '0', color: 'accent', cap: 'All cells start as 0.' }, { cells: [[0, 0], [1, 1], [2, 2]], texts: ['1', '2', '3'], cap: 'The input values go on the diagonal: 1, 2, 3.' }],
    result: R('np.diag([1, 2, 3]) = [[1, 0, 0], [0, 2, 0], [0, 0, 3]]', '[[1, 0, 0], [0, 2, 0], [0, 0, 3]]') }));

  add('outer', 'outer', NUM, 'Multiplies every value of one array with every value of another.', 'np.outer([1,2,3],[10,20])', [[10, 20], [20, 40], [30, 60]], gridFill({
    call: 'np.outer([1, 2, 3], [10, 20])', note: 'every pair: row value × column value', rows: 3, cols: 2, init: '?',
    intro: 'np.outer() gets [1, 2, 3] and [10, 20]. The result has one row per value of the first and one column per value of the second.', allocCap: 'A 3 × 2 table is made: 3 values × 2 values.',
    steps: [{ cells: [[0, 0], [0, 1]], texts: ['10', '20'], cap: 'Row 0: 1 × 10 = 10 and 1 × 20 = 20.' }, { cells: [[1, 0], [1, 1]], texts: ['20', '40'], cap: 'Row 1: 2 × 10 = 20 and 2 × 20 = 40.' }, { cells: [[2, 0], [2, 1]], texts: ['30', '60'], cap: 'Row 2: 3 × 10 = 30 and 3 × 20 = 60.' }],
    result: R('np.outer([1, 2, 3], [10, 20]) = [[10, 20], [20, 40], [30, 60]]', '[[10, 20], [20, 40], [30, 60]]') }));

  add('trace', 'trace', FN, 'Adds up the diagonal of a matrix.', 'np.trace([[1,2],[3,4]])', 5, gridEdit({
    call: 'np.trace([[1, 2], [3, 4]])', note: 'sum of the main diagonal', grid: [[1, 2], [3, 4]],
    intro: 'np.trace() gets the 2 × 2 matrix [[1, 2], [3, 4]].',
    steps: [{ cells: [[0, 0], [1, 1]], color: 'warning', cap: 'The main diagonal runs from the top left to the bottom right: 1 and 4.' }, { cells: [], cap: 'It adds them: 1 + 4 = 5.' }],
    result: R('np.trace([[1, 2], [3, 4]]) = 5', '5') }));

  const G3 = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  add('triu', 'triu', TWOD, 'Keeps the upper triangle of a matrix and zeros the rest.', 'np.triu([[1,2,3],[4,5,6],[7,8,9]])', [[1, 2, 3], [0, 5, 6], [0, 0, 9]], gridEdit({
    call: 'np.triu([[1, 2, 3], [4, 5, 6], [7, 8, 9]])', note: 'upper triangle', grid: G3,
    intro: 'np.triu() gets a 3 × 3 matrix.',
    steps: [{ cells: [[0, 0], [1, 1], [2, 2]], color: 'warning', cap: 'The diagonal and everything above it is kept.' }, { cells: [[1, 0, '0'], [2, 0, '0'], [2, 1, '0']], color: 'danger', cap: 'The cells below the diagonal are set to 0.' }],
    result: R('np.triu(...) = [[1, 2, 3], [0, 5, 6], [0, 0, 9]]', '[[1, 2, 3], [0, 5, 6], [0, 0, 9]]') }));

  add('tril', 'tril', TWOD, 'Keeps the lower triangle of a matrix and zeros the rest.', 'np.tril([[1,2,3],[4,5,6],[7,8,9]])', [[1, 0, 0], [4, 5, 0], [7, 8, 9]], gridEdit({
    call: 'np.tril([[1, 2, 3], [4, 5, 6], [7, 8, 9]])', note: 'lower triangle', grid: G3,
    intro: 'np.tril() gets a 3 × 3 matrix.',
    steps: [{ cells: [[0, 0], [1, 1], [2, 2]], color: 'warning', cap: 'The diagonal and everything below it is kept.' }, { cells: [[0, 1, '0'], [0, 2, '0'], [1, 2, '0']], color: 'danger', cap: 'The cells above the diagonal are set to 0.' }],
    result: R('np.tril(...) = [[1, 0, 0], [4, 5, 0], [7, 8, 9]]', '[[1, 0, 0], [4, 5, 0], [7, 8, 9]]') }));

  const g23 = (r, c) => [380 + c * 120, 260 + r * 110];
  const m23 = (map) => [1, 2, 3, 4, 5, 6].map((v, i) => { const r = Math.floor(i / 3), c = i % 3; return { v, from: g23(r, c), to: g23(...map(r, c)) }; });
  add('fliplr', 'fliplr', TWOD, 'Mirrors a matrix left to right.', 'np.fliplr([[1,2,3],[4,5,6]])', [[3, 2, 1], [6, 5, 4]], gridMove({
    call: 'np.fliplr([[1, 2, 3], [4, 5, 6]])', note: 'reverses each row', cells: m23((r, c) => [r, 2 - c]),
    intro: 'np.fliplr() gets a 2 × 3 matrix. "lr" means left-right.',
    steps: [{ ids: [0, 1, 2], cap: 'Row 0 is reversed: 1, 2, 3 becomes 3, 2, 1.' }, { ids: [3, 4, 5], cap: 'Row 1 is reversed too: 4, 5, 6 becomes 6, 5, 4.' }],
    result: R('np.fliplr([[1, 2, 3], [4, 5, 6]]) = [[3, 2, 1], [6, 5, 4]]', '[[3, 2, 1], [6, 5, 4]]') }));

  add('flipud', 'flipud', TWOD, 'Flips a matrix upside down.', 'np.flipud([[1,2,3],[4,5,6]])', [[4, 5, 6], [1, 2, 3]], gridMove({
    call: 'np.flipud([[1, 2, 3], [4, 5, 6]])', note: 'reverses the order of the rows', cells: m23((r, c) => [1 - r, c]),
    intro: 'np.flipud() gets a 2 × 3 matrix. "ud" means up-down.',
    steps: [{ ids: [0, 1, 2, 3, 4, 5], cap: 'The rows swap places: the top row 1, 2, 3 moves to the bottom and the bottom row 4, 5, 6 moves to the top.' }, { ids: [], cap: 'Inside each row the order stays the same. Only the order of the rows is reversed.' }],
    result: R('np.flipud([[1, 2, 3], [4, 5, 6]]) = [[4, 5, 6], [1, 2, 3]]', '[[4, 5, 6], [1, 2, 3]]') }));

  const g22 = (r, c) => [440 + c * 120, 260 + r * 110];
  add('rot90', 'rot90', FB, 'Rotates a matrix by 90 degrees.', 'np.rot90([[1,2],[3,4]])', [[2, 4], [1, 3]], gridMove({
    call: 'np.rot90([[1, 2], [3, 4]])', note: 'turns 90° counter-clockwise',
    cells: [[1, [0, 0], [1, 0]], [2, [0, 1], [0, 0]], [3, [1, 0], [1, 1]], [4, [1, 1], [0, 1]]].map(([v, f, t]) => ({ v, from: g22(...f), to: g22(...t) })),
    intro: 'np.rot90() gets [[1, 2], [3, 4]] and turns it a quarter turn counter-clockwise.',
    steps: [{ ids: [0, 1, 2, 3], cap: 'The top row (1, 2) becomes the left column, with 1 at the bottom and 2 at the top. The bottom row (3, 4) becomes the right column, with 3 at the bottom and 4 at the top.' }, { ids: [], cap: 'In total, every value moved one quarter turn counter-clockwise around the centre.' }],
    result: R('np.rot90([[1, 2], [3, 4]]) = [[2, 4], [1, 3]]', '[[2, 4], [1, 3]]') }));

  add('ravel', 'ravel', FN, 'Flattens an array into one dimension.', 'np.ravel([[1,2,3],[4,5,6]])', [1, 2, 3, 4, 5, 6], gridMove({
    call: 'np.ravel([[1, 2, 3], [4, 5, 6]])', note: 'shape (2, 3)  →  shape (6,)',
    cells: [1, 2, 3, 4, 5, 6].map((v, i) => { const r = Math.floor(i / 3), c = i % 3; return { v, from: [380 + c * 120, 190 + r * 100], to: [200 + i * 120, 470] }; }),
    intro: 'np.ravel() gets a 2 × 3 array.',
    steps: [{ ids: [0, 1, 2], cap: 'It reads the first row from left to right: 1, 2, 3.' }, { ids: [3, 4, 5], cap: 'Then the second row: 4, 5, 6. All values end up in one line.' }],
    result: R('np.ravel([[1, 2, 3], [4, 5, 6]]) = [1, 2, 3, 4, 5, 6]', '[1, 2, 3, 4, 5, 6]') }));

  // ---------- sets ----------
  add('isin', 'isin', SET, 'Tests which values of an array appear in another array.', 'np.isin([1,2,3,4],[2,4])', [false, true, false, true], stepAnim({
    call: 'np.isin([1, 2, 3, 4], [2, 4])', note: 'is each value in [2, 4]?', inputs: S([1, 2, 3, 4]), outputs: ['False', 'True', 'False', 'True'],
    intro: 'np.isin() checks every value of [1, 2, 3, 4] against the test values [2, 4].',
    steps: [run([0], [0], '1 is not in [2, 4]: False.', '1 not in [2, 4]'), run([1], [1], '2 is in [2, 4]: True.', '2 is in [2, 4]'), run([2], [2], '3 is not in [2, 4]: False.', '3 not in [2, 4]'), run([3], [3], '4 is in [2, 4]: True.', '4 is in [2, 4]')],
    result: R('np.isin([1, 2, 3, 4], [2, 4]) = [False, True, False, True]', '[False, True, False, True]') }));

  add('intersect1d', 'intersect1d', SET, 'Finds the values that appear in both arrays.', 'np.intersect1d([1,2,3,4],[3,4,5])', [3, 4], stepAnim({
    call: 'np.intersect1d([1, 2, 3, 4], [3, 4, 5])', note: 'sorted values found in both', inputs: S([1, 2, 3, 4, 3, 4, 5]), inFills: ['accent', 'accent', 'accent', 'accent', 'accent2', 'accent2', 'accent2'], outputs: ['3', '4'],
    intro: 'np.intersect1d() gets [1, 2, 3, 4] (first colour) and [3, 4, 5] (second colour).',
    steps: [run([2, 4], [0], '3 appears in both arrays, so it is in the result.'), run([3, 5], [1], '4 appears in both arrays too. 1, 2 and 5 appear in only one.')],
    result: R('np.intersect1d([1, 2, 3, 4], [3, 4, 5]) = [3, 4]', '[3, 4]') }));

  add('union1d', 'union1d', SET, 'Combines two arrays into their sorted distinct values.', 'np.union1d([1,2,3],[3,4])', [1, 2, 3, 4], stepAnim({
    call: 'np.union1d([1, 2, 3], [3, 4])', note: 'sorted values from either, once each', inputs: S([1, 2, 3, 3, 4]), inFills: ['accent', 'accent', 'accent', 'accent2', 'accent2'], outputs: S([1, 2, 3, 4]),
    intro: 'np.union1d() gets [1, 2, 3] (first colour) and [3, 4] (second colour).',
    steps: [run([0], [0], '1 is in the result.'), run([1], [1], '2 is in the result.'), run([2, 3], [2], '3 is in both arrays but is kept only once.'), run([4], [3], '4 is in the result.')],
    result: R('np.union1d([1, 2, 3], [3, 4]) = [1, 2, 3, 4]', '[1, 2, 3, 4]') }));

  add('setdiff1d', 'setdiff1d', SET, 'Finds the values of one array that are not in another.', 'np.setdiff1d([1,2,3,4],[2,4])', [1, 3], stepAnim({
    call: 'np.setdiff1d([1, 2, 3, 4], [2, 4])', note: 'in the first array but not in the second', inputs: S([1, 2, 3, 4, 2, 4]), inFills: ['accent', 'accent', 'accent', 'accent', 'accent2', 'accent2'], outputs: ['1', '3'],
    intro: 'np.setdiff1d() gets [1, 2, 3, 4] (first colour) and [2, 4] (second colour).',
    steps: [run([0], [0], '1 is not in [2, 4], so it is kept.'), run([1, 4], [], '2 is in [2, 4], so it is dropped.', '2 is removed'), run([2], [1], '3 is not in [2, 4], so it is kept.'), run([3, 5], [], '4 is in [2, 4], so it is dropped.', '4 is removed')],
    result: R('np.setdiff1d([1, 2, 3, 4], [2, 4]) = [1, 3]', '[1, 3]') }));

  // ---------- structure / concept animations ----------
  add('copy', 'copy', FB, 'Makes an independent copy of an array.', '(lambda a: (lambda b: (b.__setitem__(0, 99), [a.tolist(), b.tolist()])[1])(np.copy(a)))(np.array([1,2,3]))', [[1, 2, 3], [99, 2, 3]], stepAnim({
    call: 'b = np.copy(a)', note: 'a = [1, 2, 3]', inputs: S([1, 2, 3]), outputs: S([1, 2, 3]),
    intro: 'a is the array [1, 2, 3]. np.copy(a) will make a separate array b.',
    steps: [run([0, 1, 2], [0, 1, 2], 'np.copy() allocates new memory and copies the values: b is [1, 2, 3]. b and a are now independent.'),
      { srcs: [], outs: [0], cap: 'Now we set b[0] = 99. Only the copy changes.', eq: 'b[0] = 99', set: { 0: '99' } }],
    result: R('After b[0] = 99: b = [99, 2, 3], but a is still [1, 2, 3]. A copy never changes the original (unlike a view).', 'a = [1, 2, 3], b = [99, 2, 3]') }));

  add('broadcast-to', 'broadcast_to', ST, 'Stretches an array to a bigger shape without copying data.', 'np.broadcast_to([1,2,3], (2,3))', [[1, 2, 3], [1, 2, 3]], (() => {
    const b = new B(); b.title('np.broadcast_to([1, 2, 3], (2, 3))'); b.note('shape (3,)  →  shape (2, 3)');
    [1, 2, 3].forEach((v, i) => b.item('s' + i, String(v), 380 + i * 120, 190, { w: 80, h: 70 }));
    [0, 1].forEach(r => [1, 2, 3].forEach((v, c) => b.item(`o${r}_${c}`, String(v), 380 + c * 120, 340 + r * 100, { w: 80, h: 70, fill: 'success', visible: false })));
    return { b, slides: slides([
      ['np.broadcast_to() gets the 1-D array [1, 2, 3] (shape (3,)) and the target shape (2, 3): 2 rows of 3.'],
      ['Row 0 of the result is the array itself: 1, 2, 3.', show(b, ['o0_0', 'o0_1', 'o0_2'])],
      ['The array is stretched along the new axis: row 1 shows the same 1, 2, 3 again.', show(b, ['o1_0', 'o1_1', 'o1_2'])],
      ['No data is copied: the result is a read-only view that reuses the same 3 values for every row. This stretching is called broadcasting.', M(fill(b, ['o1_0', 'o1_1', 'o1_2', 'o0_0', 'o0_1', 'o0_2'], 'warning')), 700],
      ['np.broadcast_to([1, 2, 3], (2, 3)) = [[1, 2, 3], [1, 2, 3]]', T('note', 'result: [[1, 2, 3], [1, 2, 3]]', { fill: 'success' }), 500],
    ]) };
  })());

  add('broadcast-arrays', 'broadcast_arrays', ST, 'Stretches arrays of different shapes to one common shape.', '[x.tolist() for x in np.broadcast_arrays([[1],[2]],[10,20,30])]', [[[1, 1, 1], [2, 2, 2]], [[10, 20, 30], [10, 20, 30]]], (() => {
    const b = new B(); b.title('np.broadcast_arrays([[1], [2]], [10, 20, 30])'); b.note('shapes (2, 1) and (3,)  →  both become (2, 3)');
    b.text('la', 'first array', 250, 150, { size: 22 }); b.text('lb', 'second array', 690, 150, { size: 22 });
    const ax = c => 150 + c * 100, bx = c => 590 + c * 100, ay = r => 250 + r * 100;
    [[1, 1, 1], [2, 2, 2]].forEach((row, r) => row.forEach((v, c) => b.item(`a${r}_${c}`, String(v), ax(c), ay(r), { w: 80, h: 80, visible: c === 0 })));
    [[10, 20, 30], [10, 20, 30]].forEach((row, r) => row.forEach((v, c) => b.item(`b${r}_${c}`, String(v), bx(c), ay(r), { w: 80, h: 80, fill: 'accent2', visible: r === 0 })));
    const A_ = [[0, 1], [0, 2], [1, 1], [1, 2]].map(([r, c]) => `a${r}_${c}`), B_ = [[1, 0], [1, 1], [1, 2]].map(([r, c]) => `b${r}_${c}`);
    return { b, slides: slides([
      ['The first array is a column [[1], [2]] (shape (2, 1)). The second is a row [10, 20, 30] (shape (3,)). Their shapes differ.'],
      ['The first array is stretched sideways: its single column is repeated to make 3 columns.', M(show(b, A_), fill(b, A_, 'success'))],
      ['The second array is stretched downwards: its row is repeated to make 2 rows.', M(show(b, B_), fill(b, B_, 'success'))],
      ['Both arrays now have the same shape (2, 3). Operations like a + b use this same stretching.', T('note', 'both arrays now have shape (2, 3)', { fill: 'success' }), 500],
    ]) };
  })());

  add('ndarray', 'ndarray', null, 'The NumPy array: a grid of values of one type, with a shape.', 'list(np.array([[1,2,3],[4,5,6]]).shape)+[np.array([[1,2,3],[4,5,6]]).ndim, np.array([[1,2,3],[4,5,6]]).size]', [2, 3, 2, 6], (() => {
    const b = new B(); b.title('np.array([[1, 2, 3], [4, 5, 6]])'); b.note('an ndarray: a grid of values that all have the same type');
    [[1, 2, 3], [4, 5, 6]].forEach((row, r) => row.forEach((v, c) => b.item(`c${r}_${c}`, String(v), 200 + c * 110, 240 + r * 100, { w: 90, h: 80 })));
    [['shape', 'shape: (2, 3)'], ['ndim', 'ndim: 2'], ['size', 'size: 6'], ['dtype', 'dtype: int64']].forEach(([id, t], i) => b.text(id, t, 700, 210 + i * 65, { size: 30, fill: 'success', visible: false }));
    return { b, slides: slides([
      ['np.array() builds an ndarray from nested lists: here 2 rows and 3 columns of numbers.'],
      ['shape is the length along each axis: 2 rows and 3 columns, so (2, 3).', M({ shape: { visible: true } }, fill(b, ['c0_0', 'c0_1', 'c0_2', 'c1_0', 'c1_1', 'c1_2'], 'warning'))],
      ['ndim is the number of axes: 2 (rows and columns).', M({ ndim: { visible: true } }, fill(b, ['c0_0', 'c0_1', 'c0_2', 'c1_0', 'c1_1', 'c1_2'], 'accent'))],
      ['size is the total number of values: 2 × 3 = 6.', { size: { visible: true } }],
      ['dtype is the one type shared by all values. Whole numbers give an integer type, usually int64.', { dtype: { visible: true } }],
    ]) };
  })(), undefined, { symbol: 'sym:__init__.pyi:ndarray', aliases: [] }, 'How the NumPy array (ndarray) works');

  add('dtype', 'dtype', null, 'Every NumPy array has one data type, and you can convert between types.', 'np.array([1,2,3]).astype(float)', [1, 2, 3], (() => {
    const b = new B(); b.title('np.array([1, 2, 3]).astype(float)'); b.note('dtype: the type shared by all values');
    [1, 2, 3].forEach((v, i) => b.item('g' + i, String(v), 300 + i * 200, 280, { w: 110, h: 90 }));
    b.text('dt', 'dtype: int64', 500, 400, { size: 30, fill: 'warning' });
    return { b, slides: slides([
      ['np.array([1, 2, 3]) holds whole numbers, so its dtype is an integer type, usually int64.'],
      ['.astype(float) makes a new array in which every value is converted to a floating-point number.', M(lab('g0', '1.0'), lab('g1', '2.0'), lab('g2', '3.0'), fill(b, ['g0', 'g1', 'g2'], 'success'), T('dt', 'dtype: float64', { fill: 'success' })), 900],
      ['NumPy also picks a dtype for you: np.array([1, 2.5]) becomes float64, because one value has a decimal part and all values must share one type.', T('dt', 'np.array([1, 2.5]) → float64', { fill: 'warning' }), 700],
      ['A dtype fixes how much memory each value uses and how it behaves. np.array([1, 2, 3]).astype(float) = [1.0, 2.0, 3.0] (float64).', T('note', 'result: [1.0, 2.0, 3.0]', { fill: 'success' }), 500],
    ]) };
  })(), undefined, { symbol: 'sym:__init__.pyi:dtype', aliases: [] }, 'How the NumPy data type (dtype) works');
};
