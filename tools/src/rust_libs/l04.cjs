// itertools (part 2): adapters, Result/Option helpers, merging, look-ahead, folds, combinations, free functions.
const { group } = require('../rust_std/kit.cjs');
const IT = ['itertools', 'Itertools', /^src\/lib\.rs$/];
const FREE = (file) => ['itertools', '', new RegExp(`src[/]${file}[.]rs$`)];
const { list, add } = group({ at: IT });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const U = 'use itertools::Itertools; ';

// ---------------------------------------------------------------- shaping

add('itertools/tuple-combinations', 'tuple_combinations', null, 'How Itertools::tuple_combinations works', 'Every pair (or triple...) of different positions, as tuples.', {
  rows: [['1', '2', '3']], call: 'it.tuple_combinations::<(_, _)>()', note: 'order inside a pair follows the input', outs: ['(1, 2)', '(1, 3)', '(2, 3)'],
  intro: 'Each item is paired with every later item. The tuple size picks how many items per combination.',
  steps: [['1 with 2 and with 3.', [0, 1, 2], 'o0,1'], ['2 with 3.', [1, 2], 'o2']],
  result: '(1, 2), (1, 3), (2, 3)', resultCap: 'combinations(k) gives Vecs of any size k.',
}, U + 'jd((1..=3).tuple_combinations::<(_, _)>())');
add('itertools/with-position', 'with_position', null, 'How Itertools::with_position works', 'Pairs each item with its Position: is it the first, the last, both or neither?', {
  rows: [['a', 'b', 'c']], call: 'it.with_position()', note: 'Position { is_first, is_last }', outs: ['a: first', 'b: middle', 'c: last'],
  intro: 'Useful when the first or last item needs special handling, like separators.',
  steps: [['a: is_first is true.', 0, 'o0'], ['b: both are false, a middle item.', 1, 'o1'], ['c: is_last is true. A single item has both set.', 2, 'o2']],
  result: 'a: first, b: middle, c: last', resultCap: 'Since itertools 0.15; before, Position was an enum (First, Middle, Last, Only).',
}, U + 'let k = |p: itertools::Position| if p.is_first { "first" } else if p.is_last { "last" } else { "middle" }; "abc".chars().with_position().map(|(p, c)| format!("{}: {}", c, k(p))).collect::<Vec<_>>().join(", ")');
add('itertools/pad-using', 'pad_using', null, 'How Itertools::pad_using works', 'Extends the iterator to at least n items, making the extra ones from their index.', {
  rows: [['1', '2']], call: 'it.pad_using(4, |i| i * 10)', note: 'minimum length', outs: ['1', '2', '20', '30'],
  intro: 'If the iterator is shorter than n, the closure fills the gap; it receives the missing item\'s index.',
  steps: [['1 and 2 pass through.', [0, 1], 'o0,1'], ['Index 2 and 3 are missing: 20 and 30.', [], 'o2,3']],
  result: '1, 2, 20, 30', resultCap: 'Longer iterators are not cut.',
}, U + 'j([1, 2].into_iter().pad_using(4, |i| i * 10))');
add('itertools/update', 'update', null, 'How Itertools::update works', 'Changes each item in place through a closure, then yields it.', one('it.update(|x| *x *= 2)', '1, 2, 3', '2, 4, 6', 'map with &mut', 'Handy for structs: change one field, keep the item.', 'Double each in place.', 'Yield the changed items.', '2, 4, 6', 'map() builds new values instead.'), U + 'j([1, 2, 3].into_iter().update(|x| *x *= 2))');
add('itertools/intersperse-with', 'intersperse_with', FREE('free'), 'How itertools::intersperse_with works', 'Puts a separator between items, made fresh by a closure each time.', one('itertools::intersperse_with([1, 2, 3], || 0)', '1, 2, 3', '1, 0, 2, 0, 3', 'separators', 'Good when the separator is not Clone. (The free function avoids a clash with an unstable std method of the same name.)', 'Between each pair...', '...the closure adds 0.', '1, 0, 2, 0, 3', 'intersperse(x) clones one separator.'), U + 'j(itertools::intersperse_with([1, 2, 3], || 0))');
add('itertools/zip-eq', 'zip_eq', null, 'How Itertools::zip_eq works', 'Zips two iterators and panics if their lengths differ.', one('a.zip_eq(b)', '[1, 2] and ["x", "y"]', '(1, "x"), (2, "y")', 'strict zip', 'zip() silently stops at the shorter one; zip_eq catches the bug.', 'Pair them up.', 'Same length: fine.', '(1, "x"), (2, "y")', 'zip_longest keeps the extra items.'), U + 'jd([1, 2].into_iter().zip_eq(["x", "y"]))');
add('itertools/batching', 'batching', null, 'How Itertools::batching works', 'Builds each output item by taking as many inputs as the closure wants.', {
  rows: [['1', '2', '3', '4', '5']], call: 'it.batching(|it| Some(it.next()? + it.next().unwrap_or(0)))', note: 'variable-size groups', outs: ['3', '7', '5'],
  intro: 'The closure gets the iterator itself and returns the next output, or None to stop.',
  steps: [['1 + 2.', [0, 1], 'o0'], ['3 + 4.', [2, 3], 'o1'], ['5 alone (no partner: + 0).', 4, 'o2']],
  result: '3, 7, 5', resultCap: 'A tiny parser: each output may use a different number of inputs.',
}, U + 'j((1..=5).batching(|it| Some(it.next()? + it.next().unwrap_or(0))))');
add('itertools/tee', 'tee', null, 'How Itertools::tee works', 'Splits one iterator into two that each see every item.', one('let (a, b) = it.tee()', '1, 2, 3', 'a: 1,2,3  b: 1,2,3', 'read twice', 'Items are buffered (cloned) until both sides have used them.', 'Split.', 'Both yield all items.', '[1, 2, 3], [1, 2, 3]', 'Avoid if one side runs far ahead.'), U + 'let (a, b) = (1..=3).tee(); format!("{:?}, {:?}", a.collect::<Vec<_>>(), b.collect::<Vec<_>>())');
add('itertools/map-into', 'map_into', null, 'How Itertools::map_into works', 'Converts every item with Into.', one('bytes.map_into::<u32>()', '1u8, 2u8', '1u32, 2u32', 'type conversion', 'Same as .map(Into::into) with the target named.', 'Convert each.', 'u32 values.', '1, 2', 'Works for any From/Into pair.'), U + 'j([1u8, 2].into_iter().map_into::<u32>())');
add('itertools/multiunzip', 'multiunzip', null, 'How Itertools::multiunzip works', 'Splits an iterator of tuples into one collection per position.', one('rows.multiunzip()', '(1,"a",true) (2,"b",false)', '([1, 2], ["a", "b"], [true, false])', 'columns from rows', 'std unzip only handles pairs.', 'Each tuple part...', '...goes to its own Vec.', '([1, 2], ["a", "b"], [true, false])', 'Up to 12 parts.'), U + 'let (a, b, c): (Vec<_>, Vec<_>, Vec<_>) = [(1, "a", true), (2, "b", false)].into_iter().multiunzip(); d((a, b, c))');

// ---------------------------------------------------------------- Results and Options inside iterators

const RES = 'let v: Vec<Result<i32, &str>> = vec![Ok(1), Err("bad"), Ok(4)]; ';
add('itertools/map-ok', 'map_ok', null, 'How Itertools::map_ok works', 'Maps the Ok values and lets errors pass through unchanged.', {
  rows: [['Ok(1)', 'Err("bad")', 'Ok(4)']], call: 'it.map_ok(|x| x * 10)', note: 'iterator of Results', outs: ['Ok(10)', 'Err("bad")', 'Ok(40)'],
  intro: 'Without map_ok you would write .map(|r| r.map(|x| x * 10)).',
  steps: [['Ok(1) becomes Ok(10).', 0, 'o0'], ['The error is passed on as it is.', 1, 'o1'], ['Ok(4) becomes Ok(40).', 2, 'o2']],
  result: 'Ok(10), Err("bad"), Ok(40)', resultCap: 'Then .collect::<Result<Vec<_>, _>>() stops at the first error.',
}, U + RES + 'jd(v.into_iter().map_ok(|x| x * 10))');
add('itertools/filter-ok', 'filter_ok', null, 'How Itertools::filter_ok works', 'Filters the Ok values; errors are always kept.', one('it.filter_ok(|x| x % 2 == 0)', 'Ok(1), Err("bad"), Ok(4)', 'Err("bad"), Ok(4)', 'filter inside Results', 'Errors are never dropped silently.', 'Ok(1) is odd: dropped.', 'The error and Ok(4) stay.', 'Err("bad"), Ok(4)', 'filter_map_ok also transforms.'), U + RES + 'jd(v.into_iter().filter_ok(|x| x % 2 == 0))');
add('itertools/filter-map-ok', 'filter_map_ok', null, 'How Itertools::filter_map_ok works', 'filter_map on the Ok values; errors pass through.', one('it.filter_map_ok(|x| (x > 1).then(|| x * 2))', 'Ok(1), Err("bad"), Ok(4)', 'Err("bad"), Ok(8)', 'filter and map Ok values', 'None drops an Ok value.', 'Ok(1) → None: dropped.', 'Ok(4) → Ok(8).', 'Err("bad"), Ok(8)', 'Errors always survive.'), U + RES + 'jd(v.into_iter().filter_map_ok(|x| (x > 1).then(|| x * 2)))');
add('itertools/flatten-ok', 'flatten_ok', null, 'How Itertools::flatten_ok works', 'Flattens Ok values that are themselves iterable.', one('it.flatten_ok()', 'Ok([1, 2]), Err("e")', 'Ok(1), Ok(2), Err("e")', 'flatten inside Results', 'Each element of an Ok collection becomes its own Ok.', 'Ok([1, 2]) opens up.', 'The error stays.', 'Ok(1), Ok(2), Err("e")', 'Like flatten(), for Result items.'), U + 'let v: Vec<Result<Vec<i32>, &str>> = vec![Ok(vec![1, 2]), Err("e")]; jd(v.into_iter().flatten_ok())');
add('itertools/process-results', 'process_results', null, 'How Itertools::process_results works', 'Runs a closure over the Ok values; the first error ends it all.', {
  rows: [['Ok(1)', 'Ok(2)', 'Ok(3)']], call: 'it.process_results(|nums| nums.sum::<i32>())', note: 'the closure sees plain numbers', outs: ['Ok(6)'],
  intro: 'Inside the closure the items are plain values. If an Err shows up, the result is that Err.',
  steps: [['The closure sums 1, 2, 3.', [0, 1, 2]], ['No error: Ok(6).', [], 'o0']],
  result: 'Ok(6)', resultCap: 'With an Err anywhere, the whole result is that Err.',
}, U + 'let v: Vec<Result<i32, String>> = vec![Ok(1), Ok(2), Ok(3)]; d(v.into_iter().process_results(|nums| nums.sum::<i32>()))');
add('itertools/partition-result', 'partition_result', null, 'How Itertools::partition_result works', 'Splits Results into a collection of Ok values and one of errors.', one('let (oks, errs) = it.partition_result()', 'Ok(1), Err("bad"), Ok(4)', '([1, 4], ["bad"])', 'keep both sides', 'Nothing is lost: every item lands somewhere.', 'Ok values left.', 'Errors right.', '([1, 4], ["bad"])', 'partition_map is the general form.'), U + RES + 'let (o, e): (Vec<_>, Vec<_>) = v.into_iter().partition_result(); d((o, e))');
add('itertools/fold-ok', 'fold_ok', null, 'How Itertools::fold_ok works', 'Folds Ok values; stops and returns the first Err.', one('it.fold_ok(0, |a, x| a + x)', 'Ok(1), Ok(2)', 'Ok(3)', 'sum Results', 'An Err would be returned as is.', 'Add 1, then 2.', 'Ok(3).', 'Ok(3)', 'process_results is the general form.'), U + 'let v: Vec<Result<i32, &str>> = vec![Ok(1), Ok(2)]; d(v.into_iter().fold_ok(0, |a, x| a + x))');
add('itertools/fold-options', 'fold_options', null, 'How Itertools::fold_options works', 'Folds Some values; the first None makes the result None.', one('it.fold_options(0, |a, x| a + x)', 'Some(1), None, Some(3)', 'None', 'sum Options', 'All Some: Some(total).', 'Add 1.', 'None stops it.', 'None', 'Like fold_ok for Option.'), U + 'd([Some(1), None, Some(3)].into_iter().fold_options(0, |a, x| a + x))');
add('itertools/while-some', 'while_some', null, 'How Itertools::while_some works', 'Yields the values inside Some until the first None.', one('it.while_some()', 'Some(1), Some(2), None, Some(4)', '1, 2', 'stop at None', 'Items after the None are ignored.', '1 and 2 come out.', 'None stops it.', '1, 2', 'map_while does this with a closure.'), U + 'j([Some(1), Some(2), None, Some(4)].into_iter().while_some())');

// ---------------------------------------------------------------- merging

add('itertools/merge-by', 'merge_by', null, 'How Itertools::merge_by works', 'Merges two sorted iterators, using your rule for which comes first.', {
  rows: [['5', '3', '1'], ['4', '2']], call: 'a.merge_by(b, |x, y| x >= y)', note: 'both inputs sorted big → small', outs: ['5', '4', '3', '2', '1'],
  intro: 'The closure says whether the item from a should come before the item from b.',
  steps: [['5 ≥ 4: take 5 from a.', 'a0', 'o0'], ['4 beats 3: take from b.', 'b0', 'o1'], ['Then 3, 2, 1.', ['a1', 'b1', 'a2'], 'o2,3,4']],
  result: '5, 4, 3, 2, 1', resultCap: 'merge() uses < for ascending inputs.',
}, U + 'j([5, 3, 1].into_iter().merge_by([4, 2], |x, y| x >= y))');
add('itertools/merge-join-by', 'merge_join_by', null, 'How Itertools::merge_join_by works', 'Walks two sorted iterators together, telling you what is only left, only right, or in both.', {
  rows: [['1', '2'], ['2', '3']], call: 'a.merge_join_by(b, |x, y| x.cmp(y))', note: 'a sorted join', outs: ['Left(1)', 'Both(2, 2)', 'Right(3)'],
  intro: 'Each step compares the two fronts and yields an EitherOrBoth.',
  steps: [['1 is only in a: Left(1).', 'a0', 'o0'], ['2 is in both: Both(2, 2).', ['a1', 'b0'], 'o1'], ['3 is only in b: Right(3).', 'b1', 'o2']],
  result: 'Left(1), Both(2, 2), Right(3)', resultCap: 'Great for diffing two sorted lists.',
}, U + 'jd([1, 2].into_iter().merge_join_by([2, 3], |x, y| x.cmp(y)))');
add('itertools/kmerge-by', 'kmerge_by', null, 'How Itertools::kmerge_by works', 'Merges many sorted iterators with your ordering rule.', one('lists.kmerge_by(|a, b| a > b)', '[5, 1] [4, 2] [3]', '5, 4, 3, 2, 1', 'k-way merge', 'Each inner list must already be sorted by the same rule.', 'Take the best front each time.', 'All lists merged.', '5, 4, 3, 2, 1', 'kmerge() uses ascending order.'), U + 'j(vec![vec![5, 1], vec![4, 2], vec![3]].into_iter().kmerge_by(|a, b| a > b))');

// ---------------------------------------------------------------- look-ahead

add('itertools/peeking-take-while', 'peeking_take_while', null, 'How Itertools::peeking_take_while works', 'Takes items while they match, without losing the first one that does not.', {
  rows: [['1', '2', '9', '3']], call: 'it.peeking_take_while(|&x| x < 5)', note: 'on a Peekable', outs: ['1, 2', 'next: 9'],
  intro: 'take_while consumes the first failing item. peeking_take_while only peeks at it, so it is still there.',
  steps: [['1 and 2 are < 5: taken.', [0, 1], 'o0'], ['9 is only peeked at, so next() still returns it.', 2, 'o1']],
  result: '[1, 2], next 9', resultCap: 'Works on Peekable and a few other iterators.',
}, U + 'let mut it = [1, 2, 9, 3].into_iter().peekable(); let a: Vec<_> = it.peeking_take_while(|&x| x < 5).collect(); format!("{:?}, next {}", a, it.next().unwrap())');
add('itertools/take-while-ref', 'take_while_ref', null, 'How Itertools::take_while_ref works', 'take_while through a &mut iterator that can be cloned, so the failing item is kept.', one('it.take_while_ref(|c| c.is_ascii_digit())', '"12ab".chars()', '"12", then "ab"', 'split a stream', 'Needs a Clone iterator to look ahead.', 'Take the digits.', 'The letters are still there.', '"12", "ab"', 'peeking_take_while works on Peekable.'), U + 'let mut it = "12ab".chars(); let a: String = it.take_while_ref(|c| c.is_ascii_digit()).collect(); format!("{:?}, {:?}", a, it.collect::<String>())');
add('itertools/take-while-inclusive', 'take_while_inclusive', null, 'How Itertools::take_while_inclusive works', 'Like take_while, but also yields the first item that fails.', one('it.take_while_inclusive(|&x| x != 0)', '3, 7, 0, 5', '3, 7, 0', 'include the stopper', 'Handy for "up to and including the terminator".', '3 and 7 pass.', '0 fails: yielded, then stop.', '3, 7, 0', 'take_while would stop before 0.'), U + 'j([3, 7, 0, 5].into_iter().take_while_inclusive(|&x| x != 0))');
add('itertools/multipeek', 'multipeek', FREE('multipeek_impl'), 'How itertools::multipeek works', 'An iterator whose peek() can look several items ahead.', one('let mut it = multipeek(1..=3); it.peek(); it.peek()', '1, 2, 3', 'peeks 1, then 2', 'look further ahead', 'Each peek moves the look-ahead; next() resets it.', 'First peek: 1.', 'Second peek: 2. next() still gives 1.', 'Some(1), Some(2), next 1', 'Itertools::multipeek() is the method form.'), U + 'let mut it = itertools::multipeek(1..=3); let a = it.peek().copied(); let b = it.peek().copied(); format!("{:?}, {:?}, next {}", a, b, it.next().unwrap())', undefined);

// ---------------------------------------------------------------- folds

add('itertools/sum1', 'sum1', null, 'How Itertools::sum1 works', 'The sum, or None for an empty iterator.', one('it.sum1::<i32>()', '[] / [2, 3]', 'None / Some(5)', 'sum without a zero', 'Tells "empty" apart from "adds up to 0".', 'Empty: None.', '2 + 3: Some(5).', 'None, Some(5)', 'product1 for products.'), U + 'format!("{:?}, {:?}", std::iter::empty::<i32>().sum1::<i32>(), [2, 3].into_iter().sum1::<i32>())');
add('itertools/product1', 'product1', null, 'How Itertools::product1 works', 'The product, or None for an empty iterator.', one('it.product1::<i32>()', '2, 3, 4', 'Some(24)', 'product without a one', 'Empty gives None instead of 1.', 'Multiply.', 'Some(24).', 'Some(24)', 'sum1 for sums.'), U + 'd([2, 3, 4].into_iter().product1::<i32>())');

// ---------------------------------------------------------------- free functions

add('itertools/iterate', 'iterate', FREE('sources'), 'How itertools::iterate works', 'An endless iterator: a start value, then f(previous) each time.', {
  rows: [['1']], call: 'iterate(1, |&x| x * 2).take(5)', note: 'x, f(x), f(f(x)), ...', outs: ['1', '2', '4', '8', '16'],
  intro: 'iterate keeps applying the closure to the last value it produced.',
  steps: [['Start: 1.', 0, 'o0'], ['Double, double, double, double.', [], 'o1,2,3,4']],
  result: '1, 2, 4, 8, 16', resultCap: 'Endless: always add take() or take_while().',
}, U + 'j(itertools::iterate(1, |&x| x * 2).take(5))');
add('itertools/repeat-n', 'repeat_n', FREE('repeatn'), 'How itertools::repeat_n works', 'Yields a value n times, cloning it n - 1 times.', one('repeat_n("ab", 3)', '"ab"', '"ab", "ab", "ab"', 'repeat a fixed number of times', 'The last item is moved, not cloned.', 'Clone twice.', 'Move the last one.', '"ab", "ab", "ab"', 'std::iter::repeat_n exists since Rust 1.82.'), U + 'jd(itertools::repeat_n("ab", 3))');
add('itertools/equal', 'equal', FREE('lib'), 'How itertools::equal works', 'true if two iterables yield equal items in the same order.', one('itertools::equal("ab".chars(), [\'a\', \'b\'])', '"ab".chars() vs [a, b]', 'true', 'compare sequences', 'The types may differ as long as the items compare.', 'a = a, b = b.', 'Same length too.', 'true', 'assert_equal panics with a message instead.'), U + 'itertools::equal("ab".chars(), [\'a\', \'b\']).to_string()');
add('itertools/partition-fn', 'partition', FREE('lib'), 'How itertools::partition works', 'Reorders a slice in place so matching items come first; returns how many matched.', {
  rows: [['1', '2', '3', '4']], call: 'itertools::partition(&mut v, |x| x % 2 == 0)', note: 'in place, not stable', outs: ['2 matched', 'v = [4, 2, 3, 1]'],
  intro: 'Matching items are swapped to the front. The order inside each part is not kept.',
  steps: [['2 and 4 are even.', [1, 3], 'o0'], ['They are swapped to the front.', [], 'o1']],
  result: '2, [4, 2, 3, 1]', resultCap: 'The split index tells you where the second part starts.',
}, U + 'let mut v = [1, 2, 3, 4]; let n = itertools::partition(&mut v, |x| x % 2 == 0); format!("{}, {:?}", n, v)');
add('itertools/chain-fn', 'chain', FREE('free'), 'How itertools::chain works', 'Chains two iterables, as a free function.', one('itertools::chain(&[1, 2], &[3])', '[1, 2] and [3]', '1, 2, 3', 'concatenate', 'Accepts anything IntoIterator, so no .iter() calls are needed.', 'First all of [1, 2].', 'Then [3].', '1, 2, 3', 'Same as a.into_iter().chain(b).'), U + 'j(itertools::chain(&[1, 2], &[3]))');
add('itertools/interleave-fn', 'interleave', ['itertools', '', /adaptors[/]mod[.]rs$/], 'How itertools::interleave works (free function)', 'Alternates items from two iterables.', one('itertools::interleave([1, 3], [2, 4, 6])', '[1, 3] and [2, 4, 6]', '1, 2, 3, 4, 6', 'zip-like merge', 'The leftover items of the longer one come at the end.', 'Take turns.', 'Then the rest of the longer one.', '1, 2, 3, 4, 6', 'The method form is a.interleave(b).'), U + 'j(itertools::interleave([1, 3], [2, 4, 6]))');
add('itertools/sorted-fn', 'sorted', FREE('free'), 'How itertools::sorted works (free function)', 'Sorts any iterable and returns an iterator over the result.', one('itertools::sorted("cab".chars())', '"cab"', 'a, b, c', 'sort anything iterable', 'Same as the sorted() method, for when a function call reads better.', 'Collect and sort.', 'Yield in order.', 'a, b, c', 'Allocates a Vec internally.'), U + 'j(itertools::sorted("cab".chars()))');

// ---------------------------------------------------------------- newer array-based methods

add('itertools/array-windows', 'array_windows', null, 'How Itertools::array_windows works', 'Overlapping windows as fixed-size arrays.', one('it.array_windows::<2>()', '1, 2, 3', '[1, 2], [2, 3]', 'arrays instead of tuples', 'Each window is a [T; N]; items are cloned.', 'Slide a window of 2.', 'Two windows.', '[1, 2], [2, 3]', 'tuple_windows is the tuple version.'), U + 'jd((1..=3).array_windows::<2>())');
add('itertools/array-combinations', 'array_combinations', null, 'How Itertools::array_combinations works', 'Every combination of N items, as arrays.', one('it.array_combinations::<2>()', '1, 2, 3', '[1, 2], [1, 3], [2, 3]', 'fixed-size combinations', 'Like tuple_combinations, with arrays.', 'Pick 2 of 3.', 'Three arrays.', '[1, 2], [1, 3], [2, 3]', 'combinations(k) gives Vecs.'), U + 'jd((1..=3).array_combinations::<2>())');
add('itertools/next-array', 'next_array', null, 'How Itertools::next_array works', 'Takes the next N items as an array, if there are that many.', one('it.next_array::<2>()', '"abc".chars()', "Some(['a', 'b'])", 'take a few at once', 'The rest stays in the iterator.', 'Take two.', 'c remains.', "Some(['a', 'b']), then c", 'next_tuple is the tuple version.'), U + 'let mut it = "abc".chars(); let a = it.next_array::<2>(); format!("{:?}, then {}", a, it.next().unwrap())');
add('itertools/collect-array', 'collect_array', null, 'How Itertools::collect_array works', 'Collects exactly N items into an array, or None.', one('it.collect_array::<3>()', '1, 2, 3', 'Some([1, 2, 3])', 'exact-size collect', 'More or fewer items give None.', 'Three items.', 'Some([1, 2, 3]).', 'Some([1, 2, 3])', 'collect_tuple is the tuple version.'), U + 'd((1..=3).collect_array::<3>())');

module.exports = list;
