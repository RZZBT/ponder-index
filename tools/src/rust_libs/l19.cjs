// ndarray: constructors, shape, indexing and slicing, element-wise maps, reductions, axes, linear algebra, stacking.
// ndarray 0.17 moved most methods from ArrayBase to ArrayRef (and the shape getters to LayoutRef, with forwarding
// methods on ArrayBase), so most animations name both places: each checked version declares one of them.
const { group } = require('../rust_std/kit.cjs');
const re = (file) => new RegExp(`src[/]${file}[.]rs$`);
const RB = (file = 'impl_methods') => [['ndarray', 'ArrayRef', re(file)], ['ndarray', 'ArrayBase', re(file)]];
const SH = [['ndarray', 'ArrayBase', re('alias_asref')], ['ndarray', 'ArrayBase', re('impl_methods')]];
const CO = ['ndarray', 'ArrayBase', re('impl_constructors')];
const FF = ['ndarray', '', re('free_functions')];
const { list, add } = group({ at: CO });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const U = 'use ndarray::{array, s, Array, Array1, Array2, Axis}; ';
const S = (e) => `${e}.to_string().replace('\\n', "")`;
const M = 'let m = array![[1., 2., 3.], [4., 5., 6.]]; ';
const V = 'let v = array![1., 2., 3., 4.]; ';

// ---------------------------------------------------------------- building arrays

add('ndarray/zeros', 'zeros', null, 'How ndarray::Array::zeros works', 'An array of a given shape filled with zeros.', {
  rows: [['shape (2, 3)']], call: 'Array2::<f64>::zeros((2, 3))', note: 'the shape is a tuple', outs: ['[[0, 0, 0], [0, 0, 0]]'],
  intro: 'ndarray arrays are n-dimensional, like NumPy: Array1 is a vector, Array2 a matrix.',
  steps: [['Allocate 2 × 3 elements.', 0], ['All set to 0.0.', [], 'o0']],
  result: '[[0, 0, 0], [0, 0, 0]]', resultCap: 'ones() and from_elem(shape, x) fill with other values.',
}, U + S('Array2::<f64>::zeros((2, 3))'));
add('ndarray/ones', 'ones', null, 'How ndarray::Array::ones works', 'An array of a given shape filled with ones.', one('Array1::<i32>::ones(3)', '3', '[1, 1, 1]', 'all ones', 'Works for any type with One + Clone.', 'Allocate 3.', 'Fill with 1.', '[1, 1, 1]', 'zeros() for zeros.'), U + S('Array1::<i32>::ones(3)'));
add('ndarray/from-elem', 'from_elem', null, 'How ndarray::Array::from_elem works', 'An array of a given shape filled with one value.', one('Array::from_elem((2, 2), 7)', '(2, 2), 7', '[[7, 7], [7, 7]]', 'fill with a value', 'The value is cloned into every slot.', 'Allocate.', 'Fill with 7.', '[[7, 7], [7, 7]]', 'Like vec![x; n] for n dimensions.'), U + S('Array::from_elem((2, 2), 7)'));
add('ndarray/from-shape-vec', 'from_shape_vec', null, 'How ndarray::Array::from_shape_vec works', 'Reshapes a Vec into an array; errors if the sizes do not match.', {
  rows: [['vec![1, 2, 3, 4, 5, 6]']], call: 'Array::from_shape_vec((2, 3), v)?', note: 'row-major (C) order', outs: ['[[1, 2, 3], [4, 5, 6]]'],
  intro: 'The Vec\'s elements fill the first row, then the next. 6 elements fit (2, 3) exactly.',
  steps: [['1, 2, 3 fill row 0.', 0], ['4, 5, 6 fill row 1.', [], 'o0']],
  result: '[[1, 2, 3], [4, 5, 6]]', resultCap: 'A shape that does not match the length gives Err(ShapeError).',
}, U + S('Array::from_shape_vec((2, 3), vec![1, 2, 3, 4, 5, 6]).unwrap()'));
add('ndarray/from-shape-fn', 'from_shape_fn', null, 'How ndarray::Array::from_shape_fn works', 'Builds an array by calling a function with each index.', one('Array::from_shape_fn((2, 3), |(i, j)| i * 10 + j)', 'shape (2, 3)', '[[0, 1, 2], [10, 11, 12]]', 'computed values', 'The closure receives the index tuple.', 'Call for each (i, j).', 'Store the result.', '[[0, 1, 2], [10, 11, 12]]', 'Good for patterns and lookup tables.'), U + S('Array::from_shape_fn((2, 3), |(i, j)| i * 10 + j)'));
add('ndarray/linspace', 'linspace', null, 'How ndarray::Array::linspace works', 'n evenly spaced numbers from start to end (both included).', one('Array1::linspace(0., 1., 5)', '0 to 1, 5 points', '[0, 0.25, 0.5, 0.75, 1]', 'sampling', 'Like numpy.linspace.', 'Step (1 - 0) / 4.', 'Five values.', '[0, 0.25, 0.5, 0.75, 1]', 'range(start, end, step) excludes the end.'), U + S('Array1::linspace(0., 1., 5)'));
add('ndarray/range', 'range', null, 'How ndarray::Array::range works', 'Numbers from start up to (not including) end, by step.', one('Array1::range(0., 2., 0.5)', '0..2 by 0.5', '[0, 0.5, 1, 1.5]', 'stepped values', 'Like numpy.arange.', 'Start at 0.', 'Add 0.5 until 2.', '[0, 0.5, 1, 1.5]', 'linspace fixes the count instead.'), U + S('Array1::range(0., 2., 0.5)'));
add('ndarray/eye', 'eye', null, 'How ndarray::Array::eye works', 'An identity matrix: ones on the diagonal, zeros elsewhere.', one('Array2::<i32>::eye(3)', '3', '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]', 'identity', 'Multiplying by it changes nothing.', 'A 3 × 3 matrix.', 'Ones on the diagonal.', '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]', 'diag() reads a diagonal.'), U + S('Array2::<i32>::eye(3)'));
add('ndarray/arr1', 'arr1', FF, 'How ndarray::arr1 works', 'A 1-D array from a slice.', one('arr1(&[1, 2, 3])', '&[1, 2, 3]', '[1, 2, 3]', 'quick vectors', 'The array! macro is the common shorthand.', 'Copy the slice.', 'A 1-D array.', '[1, 2, 3]', 'arr2 builds matrices.'), U + S('ndarray::arr1(&[1, 2, 3])'));
add('ndarray/arr2', 'arr2', FF, 'How ndarray::arr2 works', 'A 2-D array from nested arrays (rows).', one('arr2(&[[1, 2], [3, 4]])', '[[1, 2], [3, 4]]', '2 × 2 matrix', 'quick matrices', 'All rows must have the same length (checked by the type).', 'Copy row by row.', 'A matrix.', '[[1, 2], [3, 4]]', 'array![[1, 2], [3, 4]] does the same.'), U + S('ndarray::arr2(&[[1, 2], [3, 4]])'));

// ---------------------------------------------------------------- shape

add('ndarray/shape', 'shape', SH, 'How ndarray::ArrayBase::shape works', 'The size of each dimension, as a slice.', one('m.shape()', '2 × 3 matrix', '[2, 3]', 'dimensions', 'dim() returns it as a tuple for fixed dimensions.', 'Ask the array.', 'Rows, columns.', '[2, 3]', 'ndim() counts the dimensions.'), U + M + 'd(m.shape())');
add('ndarray/ndim', 'ndim', SH, 'How ndarray::ArrayBase::ndim works', 'The number of dimensions (axes).', one('m.ndim()', '2 × 3 matrix', '2', 'rank', 'A vector has 1, a matrix 2.', 'Count the axes.', '2.', '2', 'shape().len() is the same.'), U + M + 'm.ndim().to_string()');
add('ndarray/len', 'len', SH, 'How ndarray::ArrayBase::len works', 'The total number of elements.', one('m.len()', '2 × 3 matrix', '6', 'element count', 'Product of all dimensions.', '2 × 3.', '6.', '6', 'is_empty() checks for 0.'), U + M + 'm.len().to_string()');
add('ndarray/dim', 'dim', SH, 'How ndarray::ArrayBase::dim works', 'The shape as a tuple (for Array2: (rows, cols)).', one('let (rows, cols) = m.dim();', '2 × 3 matrix', '(2, 3)', 'destructure the shape', 'For dynamic dimensions it returns an IxDyn.', 'Read the shape.', 'As a tuple.', '(2, 3)', 'shape() returns a slice.'), U + M + 'd(m.dim())');
add('ndarray/into-shape-with-order', 'into_shape_with_order', ['ndarray', 'ArrayBase', re('impl_methods')], 'How ndarray::ArrayBase::into_shape_with_order works', 'Reshapes an array to a new shape with the same number of elements.', one('v.into_shape_with_order((2, 2))?', '[1, 2, 3, 4]', '[[1, 2], [3, 4]]', 'reshape', 'Fails if the element count differs.', 'Keep the elements.', 'Read them as 2 × 2.', '[[1, 2], [3, 4]]', 'Replaces the deprecated into_shape.'), U + S('array![1, 2, 3, 4].into_shape_with_order((2, 2)).unwrap()'));
add('ndarray/t', 't', RB(), 'How ndarray::ArrayRef::t works', 'The transpose: rows become columns (a view, no copy).', {
  rows: [['[[1, 2, 3], [4, 5, 6]]']], call: 'm.t()', note: 'returns a view', outs: ['[[1, 4], [2, 5], [3, 6]]'],
  intro: 't() swaps the axes by changing strides; no data moves.',
  steps: [['2 × 3 becomes 3 × 2.', 0], ['Element (i, j) is now at (j, i).', [], 'o0']],
  result: '[[1, 4], [2, 5], [3, 6]]', resultCap: 'Call .to_owned() to get a new array in transposed order.',
}, U + 'let m = array![[1, 2, 3], [4, 5, 6]]; ' + S('m.t()'));

// ---------------------------------------------------------------- indexing and slicing

add('ndarray/get', 'get', RB(), 'How ndarray::ArrayRef::get works', 'A reference to one element, or None if out of bounds.', one('m.get((1, 2))', '2 × 3 matrix', 'Some(6.0)', 'safe indexing', 'm[(1, 2)] panics instead.', 'Row 1, column 2.', '6.0.', 'Some(6.0), None', 'get_mut for &mut.'), U + M + 'format!("{:?}, {:?}", m.get((1, 2)), m.get((5, 0)))');
add('ndarray/slice', 'slice', RB(), 'How ndarray::ArrayRef::slice works', 'A view of part of the array, chosen with the s![] macro.', {
  rows: [['[[1, 2, 3], [4, 5, 6]]']], call: 'm.slice(s![.., 1..])', note: 'all rows, columns 1 and up', outs: ['[[2, 3], [5, 6]]'],
  intro: 's![] takes one range per axis, like NumPy slicing. Steps (..;2) and single indices work too.',
  steps: [['.. keeps every row.', 0], ['1.. drops column 0.', [], 'o0']],
  result: '[[2, 3], [5, 6]]', resultCap: 'The result is a view: no copy. slice_mut gives a mutable view.',
}, U + 'let m = array![[1, 2, 3], [4, 5, 6]]; ' + S('m.slice(s![.., 1..])'));
add('ndarray/slice-mut', 'slice_mut', RB(), 'How ndarray::ArrayRef::slice_mut works', 'A mutable view of part of the array.', one('m.slice_mut(s![0, ..]).fill(0)', '[[1, 2], [3, 4]]', '[[0, 0], [3, 4]]', 'edit a region', 'Changes go straight into the original array.', 'Select row 0.', 'Fill it with 0.', '[[0, 0], [3, 4]]', 'assign() copies another array into it.'), U + 'let mut m = array![[1, 2], [3, 4]]; m.slice_mut(s![0, ..]).fill(0); ' + S('m'));
add('ndarray/row', 'row', RB('impl_2d'), 'How ndarray::ArrayRef::row works', 'A view of one row of a matrix.', one('m.row(1)', '2 × 3 matrix', '[4, 5, 6]', 'one row', 'Panics if the index is out of range.', 'Pick row 1.', 'A 1-D view.', '[4, 5, 6]', 'column(j) for columns.'), U + M + S('m.row(1)'));
add('ndarray/column', 'column', RB('impl_2d'), 'How ndarray::ArrayRef::column works', 'A view of one column of a matrix.', one('m.column(0)', '2 × 3 matrix', '[1, 4]', 'one column', 'A view with a stride, no copy.', 'Pick column 0.', 'A 1-D view.', '[1, 4]', 'row(i) for rows.'), U + M + S('m.column(0)'));
add('ndarray/select', 'select', RB(), 'How ndarray::ArrayRef::select works', 'Copies the chosen indices along an axis into a new array.', one('m.select(Axis(1), &[0, 2])', '2 × 3 matrix', '[[1, 3], [4, 6]]', 'fancy indexing', 'Indices may repeat or be in any order.', 'Pick columns 0 and 2.', 'Copy them.', '[[1, 3], [4, 6]]', 'Like numpy.take.'), U + M + S('m.select(Axis(1), &[0, 2])'));
add('ndarray/diag', 'diag', RB(), 'How ndarray::ArrayRef::diag works', 'A view of the main diagonal.', one('m.diag()', '[[1, 2], [3, 4]]', '[1, 4]', 'diagonal', 'For non-square arrays, up to the shorter side.', 'Take (0, 0), (1, 1).', 'A 1-D view.', '[1, 4]', 'eye() builds a diagonal matrix.'), U + S('array![[1, 2], [3, 4]].diag()'));

// ---------------------------------------------------------------- element-wise

add('ndarray/mapv', 'mapv', RB(), 'How ndarray::ArrayRef::mapv works', 'A new array with a function applied to every element (by value).', {
  rows: [['[1, 2, 3, 4]']], call: 'v.mapv(|x| x * x)', note: 'shape is kept', outs: ['[1, 4, 9, 16]'],
  intro: 'mapv passes each element by value (for Copy types); map passes a reference.',
  steps: [['Square every element.', 0], ['Same shape, new array.', [], 'o0']],
  result: '[1, 4, 9, 16]', resultCap: 'Arithmetic like &v * 2.0 also works element-wise.',
}, U + V + S('v.mapv(|x| x * x)'));
add('ndarray/map', 'map', RB(), 'How ndarray::ArrayRef::map works', 'A new array with a function applied to a reference of each element.', one('v.map(|x| x > &2.)', '[1, 2, 3, 4]', '[false, false, true, true]', 'convert elements', 'The element type may change: here f64 → bool.', 'Call for each &x.', 'Collect into the same shape.', '[false, false, true, true]', 'mapv takes values instead.'), U + V + S('v.map(|x| x > &2.)'));
add('ndarray/mapv-inplace', 'mapv_inplace', RB(), 'How ndarray::ArrayRef::mapv_inplace works', 'Replaces every element with f(element), without a new array.', one('v.mapv_inplace(|x| x / 2.)', '[1, 2, 3, 4]', '[0.5, 1, 1.5, 2]', 'in-place transform', 'No allocation.', 'Halve each.', 'In place.', '[0.5, 1, 1.5, 2]', 'map_inplace passes &mut instead.'), U + 'let mut v = array![1., 2., 3., 4.]; v.mapv_inplace(|x| x / 2.); ' + S('v'));
add('ndarray/fill', 'fill', RB(), 'How ndarray::ArrayRef::fill works', 'Sets every element to one value.', one('m.fill(9)', 'any array', 'all 9', 'reset', 'Works on views too: fill part of an array.', 'Set each.', 'Done.', '[[9, 9], [9, 9]]', 'assign copies from another array.'), U + 'let mut m = Array2::<i32>::zeros((2, 2)); m.fill(9); ' + S('m'));
add('ndarray/iter', 'iter', RB(), 'How ndarray::ArrayRef::iter works', 'Iterates every element in logical (row-major) order.', one('m.iter()', '2 × 3 matrix', '1, 2, 3, 4, 5, 6', 'flat iteration', 'Works for any number of dimensions.', 'Row 0, then row 1.', 'Each element.', '1, 2, 3, 4, 5, 6', 'indexed_iter adds the index.'), U + M + 'j(m.iter())');
add('ndarray/indexed-iter', 'indexed_iter', RB(), 'How ndarray::ArrayRef::indexed_iter works', 'Iterates (index, element) pairs.', one('m.indexed_iter()', '[[1, 2], [3, 4]]', '((0, 0), 1), ((0, 1), 2), ...', 'with positions', 'The index is a tuple for fixed dimensions.', 'Walk the elements.', 'With their index.', '((0, 0), 1), ((0, 1), 2), ((1, 0), 3), ((1, 1), 4)', 'Handy to find where a value is.'), U + 'jd(array![[1, 2], [3, 4]].indexed_iter().map(|(i, x)| (i, *x)))');

// ---------------------------------------------------------------- reductions

add('ndarray/sum', 'sum', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::sum works', 'The sum of all elements.', one('m.sum()', '2 × 3 matrix 1..6', '21', 'total', 'For floats, pairwise summation keeps rounding small.', 'Add everything.', '21.', '21', 'sum_axis sums along one axis.'), U + M + 'm.sum().to_string()');
add('ndarray/mean', 'mean', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::mean works', 'The average of all elements; None for an empty array.', one('v.mean()', '[1, 2, 3, 4]', 'Some(2.5)', 'average', 'Returns an Option since 0.15.', 'Sum: 10.', 'Divide by 4.', 'Some(2.5)', 'mean_axis averages along one axis.'), U + V + 'd(v.mean())');
add('ndarray/sum-axis', 'sum_axis', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::sum_axis works', 'Sums along one axis, removing it.', {
  rows: [['[[1, 2, 3], [4, 5, 6]]']], call: 'm.sum_axis(Axis(0))', note: 'Axis(0) = down the rows', outs: ['[5, 7, 9]'],
  intro: 'Axis(0) adds the rows together (one result per column). Axis(1) adds across each row.',
  steps: [['Column sums: 1+4, 2+5, 3+6.', 0], ['The result has the other axis only.', [], 'o0']],
  result: '[5, 7, 9]', resultCap: 'Axis(1) would give [6, 15].',
}, U + M + S('m.sum_axis(Axis(0))'));
add('ndarray/mean-axis', 'mean_axis', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::mean_axis works', 'Averages along one axis.', one('m.mean_axis(Axis(1))', '2 × 3 matrix', 'Some([2, 5])', 'row averages', 'None if that axis has length 0.', 'Average each row.', 'Two values.', '[2, 5]', 'Axis(0) gives column averages.'), U + M + S('m.mean_axis(Axis(1)).unwrap()'));
add('ndarray/fold', 'fold', RB(), 'How ndarray::ArrayRef::fold works', 'Folds all elements into one value.', one('m.fold(f64::MIN, |a, &x| a.max(x))', '2 × 3 matrix', '6', 'custom reduction', 'There is no max() for floats; fold gives one.', 'Start from MIN.', 'Keep the biggest.', '6', 'Order is not guaranteed for non-contiguous views.'), U + M + 'm.fold(f64::MIN, |a, &x| a.max(x)).to_string()');
add('ndarray/product', 'product', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::product works', 'The product of all elements.', one('v.product()', '[1, 2, 3, 4]', '24', 'multiply all', 'Empty arrays give 1.', 'Multiply.', '24.', '24', 'sum() for addition.'), U + V + 'v.product().to_string()');
add('ndarray/std', 'std', RB('numeric/impl_numeric'), 'How ndarray::ArrayRef::std works', 'The standard deviation, with ddof degrees of freedom removed.', one('v.std(0.)', '[1, 2, 3, 4]', '1.118...', 'spread', 'ddof = 0: population, 1: sample.', 'Variance 1.25.', 'Square root.', '1.118033988749895', 'var(ddof) gives the variance.'), U + V + 'v.std(0.).to_string()');

// ---------------------------------------------------------------- axes, algebra, stacking

add('ndarray/axis-iter', 'axis_iter', RB(), 'How ndarray::ArrayRef::axis_iter works', 'Iterates over sub-views along an axis (e.g. each row).', one('m.axis_iter(Axis(0))', '2 × 3 matrix', 'two row views', 'loop over rows', 'Axis(1) iterates over columns.', 'Take each row.', 'Sum each.', '[6.0, 15.0]', 'rows() and outer_iter() are similar.'), U + M + 'd(m.axis_iter(Axis(0)).map(|r| r.sum()).collect::<Vec<_>>())');
add('ndarray/rows', 'rows', RB(), 'How ndarray::ArrayRef::rows works', 'An iterable over the rows (the innermost lanes).', one('for row in m.rows() {..}', '2 × 3 matrix', 'each row', 'row loop', 'Works for any dimension: rows of every 2-D slice.', 'Visit row 0, then row 1.', 'Max of each.', '[3.0, 6.0]', 'columns() for columns.'), U + M + 'd(m.rows().into_iter().map(|r| r.fold(f64::MIN, |a, &x| a.max(x))).collect::<Vec<_>>())');
add('ndarray/dot', 'dot', RB('linalg/impl_linalg'), 'How ndarray::ArrayRef::dot works', 'Matrix multiplication (or dot product for vectors).', {
  rows: [['[[1, 2], [3, 4]]', '[[5, 6], [7, 8]]']], call: 'a.dot(&b)', note: 'rows of a × columns of b', outs: ['[[19, 22], [43, 50]]'],
  intro: 'Each result element is a row of a times a column of b, summed: 1×5 + 2×7 = 19.',
  steps: [['Row 0 · each column: 19, 22.', [0, 1]], ['Row 1 · each column: 43, 50.', [], 'o0']],
  result: '[[19, 22], [43, 50]]', resultCap: 'Shapes must match: (m × k) · (k × n). With the blas feature it uses BLAS.',
}, U + S('array![[1, 2], [3, 4]].dot(&array![[5, 6], [7, 8]])'));
add('ndarray/concatenate', 'concatenate', ['ndarray', '', re('stacking')], 'How ndarray::concatenate works', 'Joins arrays along an existing axis.', one('concatenate(Axis(0), &[a.view(), b.view()])?', '[[1, 2]] and [[3, 4]]', '[[1, 2], [3, 4]]', 'append rows', 'The other axes must match.', 'Put b under a.', 'One array.', '[[1, 2], [3, 4]]', 'stack() adds a new axis instead.'), U + S('ndarray::concatenate(Axis(0), &[array![[1, 2]].view(), array![[3, 4]].view()]).unwrap()'));
add('ndarray/stack', 'stack', ['ndarray', '', re('stacking')], 'How ndarray::stack works', 'Stacks arrays along a new axis.', one('stack(Axis(0), &[a.view(), b.view()])?', '[1, 2] and [3, 4]', '[[1, 2], [3, 4]]', 'vectors → matrix', 'All inputs must have the same shape.', 'Add a new first axis.', 'One per input.', '[[1, 2], [3, 4]]', 'concatenate joins along an existing axis.'), U + S('ndarray::stack(Axis(0), &[array![1, 2].view(), array![3, 4].view()]).unwrap()'));
add('ndarray/to-vec', 'to_vec', RB('impl_1d'), 'How ndarray::ArrayRef::to_vec works', 'Copies a 1-D array into a Vec.', one('v.to_vec()', 'array![1, 2, 3]', 'vec![1, 2, 3]', 'back to Vec', 'For any dimension use iter().cloned().collect().', 'Copy the elements.', 'A Vec.', '[1, 2, 3]', 'into_raw_vec_and_offset avoids the copy for owned arrays.'), U + 'd(array![1, 2, 3].to_vec())');
add('ndarray/insert-axis', 'insert_axis', ['ndarray', 'ArrayBase', re('impl_methods')], 'How ndarray::ArrayBase::insert_axis works', 'Adds a new axis of length 1.', one('v.insert_axis(Axis(0))', '[1, 2, 3] (shape [3])', 'shape [1, 3]', 'row vector', 'Needed for broadcasting a vector as a row or column.', 'Add an axis in front.', 'Shape [1, 3].', '[1, 3]', 'Axis(1) would give [3, 1].'), U + 'd(array![1, 2, 3].insert_axis(Axis(0)).shape())');

module.exports = list;
