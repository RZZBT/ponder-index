// itertools (part 1): sorting, collecting, finding, uniqueness, grouping and counting, min/max sets, positions.
const { group } = require('../rust_std/kit.cjs');
const IT = ['itertools', 'Itertools', /^src\/lib\.rs$/];
const GM = ['itertools', 'GroupingMap', /grouping_map\.rs$/];
const { list, add } = group({ at: IT });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const U = 'use itertools::Itertools; ';
const BT = (e) => `d(${e}.into_iter().collect::<std::collections::BTreeMap<_, _>>())`;

// ---------------------------------------------------------------- sorting

add('itertools/sorted-by', 'sorted_by', null, 'How Itertools::sorted_by works', 'Collects and sorts by a comparison function, then yields the items in order.', {
  rows: [['3', '1', '2']], call: 'it.sorted_by(|a, b| b.cmp(a))', note: 'b.cmp(a) sorts from big to small', outs: ['3', '2', '1'],
  intro: 'sorted_by needs every item before it can yield the first one, so it collects into a Vec and sorts it (stable).',
  steps: [['All items are collected.', [0, 1, 2]], ['b.cmp(a) reverses the order: 3 is biggest.', 0, 'o0'], ['Then 2, then 1.', [2, 1], 'o1,2']],
  result: '3, 2, 1', resultCap: 'A stable sort: equal items keep their original order.',
}, U + 'j([3, 1, 2].into_iter().sorted_by(|a, b| b.cmp(a)))');
add('itertools/sorted-unstable', 'sorted_unstable', null, 'How Itertools::sorted_unstable works', 'Collects and sorts with an unstable (faster) sort.', one('it.sorted_unstable()', '[5, 2, 9, 2]', '2, 2, 5, 9', 'faster sort', 'Equal items may be reordered; for numbers that never matters.', 'Collect and sort.', 'Yield in order.', '2, 2, 5, 9', 'sorted() is the stable version.'), U + 'j([5, 2, 9, 2].into_iter().sorted_unstable())');
add('itertools/sorted-unstable-by-key', 'sorted_unstable_by_key', null, 'How Itertools::sorted_unstable_by_key works', 'Unstable sort by a key computed from each item.', one('words.sorted_unstable_by_key(|w| w.len())', '["ccc", "a", "bb"]', '"a", "bb", "ccc"', 'sort by key', 'The key is computed for every comparison.', 'Keys: 3, 1, 2.', 'Sorted by length.', '"a", "bb", "ccc"', 'sorted_by_cached_key computes each key once.'), U + 'jd(["ccc", "a", "bb"].into_iter().sorted_unstable_by_key(|w| w.len()))');
add('itertools/sorted-by-cached-key', 'sorted_by_cached_key', null, 'How Itertools::sorted_by_cached_key works', 'Sorts by a key that is computed only once per item.', {
  rows: [['"b"', '"C"', '"a"']], call: 'it.sorted_by_cached_key(|s| s.to_lowercase())', note: 'good for expensive keys', outs: ['"a"', '"b"', '"C"'],
  intro: 'The keys are computed first (one call per item), then the items are sorted by them.',
  steps: [['Keys: "b", "c", "a".', [0, 1, 2]], ['Sorted by key: a, b, c.', 2, 'o0'], ['The original items come out, not the keys.', [0, 1], 'o1,2']],
  result: '"a", "b", "C"', resultCap: 'Same result as sorted_by_key, but to_lowercase runs 3 times instead of once per comparison.',
}, U + 'jd(["b", "C", "a"].into_iter().sorted_by_cached_key(|s| s.to_lowercase()))');

// ---------------------------------------------------------------- collecting

add('itertools/collect-vec', 'collect_vec', null, 'How Itertools::collect_vec works', 'Collects into a Vec without spelling out the type.', one('(1..4).map(|x| x * x).collect_vec()', '1, 2, 3', 'vec![1, 4, 9]', 'shorter collect', 'Same as .collect::<Vec<_>>().', 'Square each.', 'Collect.', '[1, 4, 9]', 'The most used itertools method.'), U + 'd((1..4).map(|x| x * x).collect_vec())');
add('itertools/try-collect', 'try_collect', null, 'How Itertools::try_collect works', 'Collects Results into Result<Vec, E>, stopping at the first error.', {
  rows: [['"1"', '"x"', '"3"']], call: 'strs.map(str::parse::<i32>).try_collect()', note: 'Ok(vec) or the first Err', outs: ['Err(invalid digit)'],
  intro: 'try_collect is collect::<Result<Vec<_>, _>>() with a shorter name.',
  steps: [['"1" parses.', 0], ['"x" fails: collecting stops with that error.', 1, 'o0']],
  result: 'Err(InvalidDigit)', resultCap: 'With only valid numbers you get Ok(vec).',
}, U + 'let r: Result<Vec<i32>, _> = ["1", "x", "3"].into_iter().map(str::parse::<i32>).try_collect(); d(r.map_err(|e| e.kind().clone()))');
add('itertools/collect-tuple', 'collect_tuple', null, 'How Itertools::collect_tuple works', 'Collects exactly N items into a tuple, or None.', {
  rows: [['"k=v"']], call: 's.split(\'=\').collect_tuple()', note: 'destructure a split', outs: ['Some(("k", "v"))'],
  intro: 'The tuple type says how many items you expect. More or fewer gives None.',
  steps: [['Split gives "k" and "v".', 0], ['Exactly two: Some(("k", "v")).', [], 'o0']],
  result: 'Some(("k", "v"))', resultCap: '"a=b=c" would give None for a pair.',
}, U + 'd("k=v".split(\'=\').collect_tuple::<(&str, &str)>())');
add('itertools/next-tuple', 'next_tuple', null, 'How Itertools::next_tuple works', 'Takes the next N items as a tuple, if there are that many.', one('it.next_tuple::<(_, _)>()', '1, 2, 3', 'Some((1, 2))', 'take a few at once', 'The rest of the iterator stays available.', 'Take two.', 'Some((1, 2)); 3 remains.', 'Some((1, 2)), then 3', 'collect_tuple requires the exact count.'), U + 'let mut it = 1..=3; let t = it.next_tuple::<(_, _)>(); format!("{:?}, then {}", t, it.next().unwrap())');
add('itertools/concat', 'concat', null, 'How Itertools::concat works', 'Joins items that can be extended into one, like Vecs or Strings.', one('vec![vec![1], vec![2, 3]].into_iter().concat()', '[[1], [2, 3]]', '[1, 2, 3]', 'flatten collections', 'Works for String items too.', 'Take the first Vec.', 'Extend with the rest.', '[1, 2, 3]', 'An empty iterator gives the default value.'), U + 'd(vec![vec![1], vec![2, 3]].into_iter().concat())');
add('itertools/set-from', 'set_from', null, 'How Itertools::set_from works', 'Assigns values from another iterator into an iterator of &mut places.', one('v.iter_mut().set_from([7, 8])', 'v = [1, 2, 3]', '2 set, v = [7, 8, 3]', 'fill slots', 'Stops when either side runs out; returns how many were set.', 'Write 7 and 8.', 'The third slot stays.', '2, [7, 8, 3]', 'Handy for copying into part of a buffer.'), U + 'let mut v = [1, 2, 3]; let n = v.iter_mut().set_from([7, 8]); format!("{}, {:?}", n, v)');
add('itertools/format', 'format', null, 'How Itertools::format works', 'Formats the items with a separator, lazily, inside format! or println!.', {
  rows: [['1', '2', '3']], call: 'format!("[{}]", it.format(", "))', note: 'no intermediate String', outs: ['"[1, 2, 3]"'],
  intro: 'format() returns something that implements Display: the items are written straight into the output.',
  steps: [['Each item is written, with ", " between.', [0, 1, 2]], ['Inside the brackets of the format string.', [], 'o0']],
  result: '"[1, 2, 3]"', resultCap: 'Unlike join, it does not build a String first. Use it once: it consumes the iterator.',
}, U + 'd(format!("[{}]", [1, 2, 3].iter().format(", ")))');
add('itertools/format-with', 'format_with', null, 'How Itertools::format_with works', 'Like format, but a closure decides how each item is written.', one('it.format_with(", ", |x, f| f(&format_args!("<{}>", x)))', '1, 2', '"<1>, <2>"', 'custom item format', 'The closure receives the item and a writer callback.', 'Write each item as <x>.', 'Joined by ", ".', '"<1>, <2>"', 'Allocation-free, like format.'), U + 'd([1, 2].iter().format_with(", ", |x, f| f(&format_args!("<{}>", x))).to_string())');

// ---------------------------------------------------------------- finding

add('itertools/find-position', 'find_position', null, 'How Itertools::find_position works', 'Finds the first matching item and its index.', {
  rows: [['4', '7', '9']], call: 'it.find_position(|&x| x > 5)', note: 'index and item together', outs: ['Some((1, 7))'],
  intro: 'find_position is find + position in one pass.',
  steps: [['4 is not > 5.', 0, 'x'], ['7 is: index 1, item 7.', 1, 'o0']],
  result: 'Some((1, 7))', resultCap: 'None if nothing matches.',
}, U + 'd([4, 7, 9].into_iter().find_position(|&x| x > 5))');
add('itertools/find-or-last', 'find_or_last', null, 'How Itertools::find_or_last works', 'The first item that matches, or else the last item.', one('it.find_or_last(|&x| x > 10)', '1, 2, 3', 'Some(3)', 'fallback to the end', 'None only for an empty iterator.', 'Nothing is > 10.', 'So the last item.', 'Some(3)', 'find_or_first falls back to the first.'), U + 'd([1, 2, 3].into_iter().find_or_last(|&x| x > 10))');
add('itertools/find-or-first', 'find_or_first', null, 'How Itertools::find_or_first works', 'The first item that matches, or else the first item.', one('it.find_or_first(|&x| x > 10)', '1, 2, 3', 'Some(1)', 'fallback to the start', 'Useful for "preferred, else default" choices.', 'Nothing matches.', 'So the first item.', 'Some(1)', 'find_or_last is the mirror.'), U + 'd([1, 2, 3].into_iter().find_or_first(|&x| x > 10))');
add('itertools/contains', 'contains', null, 'How Itertools::contains works', 'true if some item equals the value.', one('s.split_whitespace().contains(&"b")', '"a b c"', 'true', 'membership', 'Works on any iterator. (Ranges and slices have their own contains.)', 'Compare each item.', '"b" is found.', 'true', 'Stops at the first match.'), U + '"a b c".split_whitespace().contains(&"b").to_string()');
add('itertools/get', 'get', null, 'How Itertools::get works', 'The items at a range of positions, like slicing an iterator.', one('it.get(1..3)', '"a" "b" "c" "d"', '"b", "c"', 'slice an iterator', 'Skips and takes for you; a single index works too.', 'Skip one.', 'Take two.', '"b", "c"', 'Equivalent to skip(1).take(2).'), U + 'jd(["a", "b", "c", "d"].into_iter().get(1..3))');
add('itertools/dropping', 'dropping', null, 'How Itertools::dropping works', 'Skips the first n items right away and returns the same iterator.', one('it.dropping(2)', '1, 2, 3, 4', '3, 4', 'eager skip', 'Unlike skip, the items are consumed immediately.', 'Drop 1 and 2.', 'The rest remains.', '3, 4', 'dropping_back drops from the end.'), U + 'j((1..=4).dropping(2))');
add('itertools/dropping-back', 'dropping_back', null, 'How Itertools::dropping_back works', 'Drops the last n items of a double-ended iterator.', one('it.dropping_back(1)', '1, 2, 3', '1, 2', 'trim the end', 'Needs DoubleEndedIterator.', 'Drop 3 from the back.', 'Keep 1, 2.', '1, 2', 'Like rev().skip(n).rev().'), U + 'j((1..=3).dropping_back(1))');
add('itertools/tail', 'tail', null, 'How Itertools::tail works', 'The last n items, in their original order.', {
  rows: [['1', '2', '3', '4', '5']], call: 'it.tail(2)', note: 'keeps a small buffer', outs: ['4', '5'],
  intro: 'tail walks the whole iterator but remembers only the last n items.',
  steps: [['Walk to the end, keeping 2 items.', [0, 1, 2]], ['The last two are 4 and 5.', [3, 4], 'o0,1']],
  result: '4, 5', resultCap: 'Works on any iterator, even one without a known length.',
}, U + 'j((1..=5).tail(2))');

// ---------------------------------------------------------------- uniqueness and equality

add('itertools/all-unique', 'all_unique', null, 'How Itertools::all_unique works', 'true if no item appears twice.', one('it.all_unique()', '1, 2, 1', 'false', 'duplicate check', 'Items must be Eq + Hash.', '1 appears again.', 'false.', 'false', 'Stops at the first repeat.'), U + '[1, 2, 1].iter().all_unique().to_string()');
add('itertools/all-equal-value', 'all_equal_value', null, 'How Itertools::all_equal_value works', 'The common value if all items are equal, else the first two that differ.', {
  rows: [['[2, 2]', '[1, 2]', '[]']], call: 'it.all_equal_value()', note: 'Ok(value) or Err', outs: ['Ok(2)', 'Err: 1 ≠ 2', 'Err: empty'],
  intro: 'Like all_equal, but it also tells you the value, or why not.',
  steps: [['All 2: Ok(2).', 0, 'o0'], ['1 and 2 differ: the error holds the first two different items.', 1, 'o1'], ['Empty: the error holds None.', 2, 'o2']],
  result: 'Ok(2), Err, Err', resultCap: 'all_equal() only gives true or false. (The error type changed in itertools 0.15.)',
}, U + 'let k = |r: bool| if r { "Err" } else { "Ok" }; format!("Ok({}), {}, {}", [2, 2].iter().all_equal_value().ok().unwrap(), k([1, 2].iter().all_equal_value().is_err()), k(Vec::<i32>::new().iter().all_equal_value().is_err()))');
add('itertools/at-most-one', 'at_most_one', null, 'How Itertools::at_most_one works', 'Ok(None) or Ok(Some(x)) for zero or one item; an error for more.', one('it.at_most_one()', '[5] / [] / [1, 2]', 'Ok(Some(5)) / Ok(None) / Err', 'optional single item', 'The error gives the items back.', 'One item: Ok(Some(5)).', 'Two items: Err.', 'Ok(Some(5)), Ok(None), Err', 'exactly_one rejects zero items too.'), U + 'format!("{:?}, {:?}, {}", [5].into_iter().at_most_one().ok(), std::iter::empty::<i32>().at_most_one().ok(), if [1, 2].into_iter().at_most_one().is_err() { "Err" } else { "Ok" }).replace("Some(Some(5))", "Ok(Some(5))").replace("Some(None)", "Ok(None)")');
add('itertools/dedup-by', 'dedup_by', null, 'How Itertools::dedup_by works', 'Removes consecutive items that the closure says are the same.', {
  rows: [['"a"', '"A"', '"b"', '"a"']], call: 'it.dedup_by(|x, y| x.eq_ignore_ascii_case(y))', note: 'only neighbours are compared', outs: ['"a"', '"b"', '"a"'],
  intro: 'Like dedup, but "the same" is decided by your closure.',
  steps: [['"a" is kept.', 0, 'o0'], ['"A" equals "a" ignoring case: dropped.', 1, 'x'], ['"b" differs: kept. The last "a" follows "b": kept.', [2, 3], 'o1,2']],
  result: '"a", "b", "a"', resultCap: 'unique_by removes repeats anywhere, not only neighbours.',
}, U + 'jd(["a", "A", "b", "a"].into_iter().dedup_by(|x, y| x.eq_ignore_ascii_case(y)))');
add('itertools/dedup-by-with-count', 'dedup_by_with_count', null, 'How Itertools::dedup_by_with_count works', 'Like dedup_by, and counts how many items each run had.', one('it.dedup_by_with_count(|a, b| a / 10 == b / 10)', '11, 12, 25', '(2, 11), (1, 25)', 'run lengths by key', 'Same tens digit counts as the same.', '11 and 12 form one run.', '25 is its own run.', '(2, 11), (1, 25)', 'dedup_with_count uses ==.'), U + 'jd([11, 12, 25].into_iter().dedup_by_with_count(|a, b| a / 10 == b / 10))');
add('itertools/duplicates', 'duplicates', null, 'How Itertools::duplicates works', 'Yields each value that occurs more than once, once, when it is seen the second time.', {
  rows: [['1', '2', '1', '3', '2', '1']], call: 'it.duplicates()', note: 'items must be Eq + Hash', outs: ['1', '2'],
  intro: 'duplicates keeps a set of what it has seen and reports a value the first time it repeats.',
  steps: [['1 and 2 are new.', [0, 1]], ['1 again: report it.', 2, 'o0'], ['3 is new; 2 again: report it. The third 1 is not reported again.', [3, 4, 5], 'o1']],
  result: '1, 2', resultCap: 'unique() is the opposite: each value once.',
}, U + 'j([1, 2, 1, 3, 2, 1].into_iter().duplicates())');
add('itertools/duplicates-by', 'duplicates_by', null, 'How Itertools::duplicates_by works', 'Like duplicates, comparing a key computed from each item.', one('words.duplicates_by(|w| w.len())', '"a" "bb" "c" "dd"', '"c", "dd"', 'repeated keys', 'The item whose key repeats is yielded.', 'Lengths: 1, 2, 1, 2.', '"c" and "dd" repeat a length.', '"c", "dd"', 'unique_by keeps the first of each key.'), U + 'jd(["a", "bb", "c", "dd"].into_iter().duplicates_by(|w| w.len()))');

// ---------------------------------------------------------------- grouping and counting

add('itertools/counts-by', 'counts_by', null, 'How Itertools::counts_by works', 'Counts the items per key into a HashMap.', {
  rows: [['1', '2', '3', '4', '5']], call: 'it.counts_by(|x| x % 2 == 0)', note: 'key → how many', outs: ['false: 3', 'true: 2'],
  intro: 'counts_by maps each item to a key and counts how often each key appears.',
  steps: [['1, 3, 5 are odd: false → 3.', [0, 2, 4], 'o0'], ['2, 4 are even: true → 2.', [1, 3], 'o1']],
  result: '{false: 3, true: 2}', resultCap: 'counts() counts the items themselves.',
}, U + BT('(1..=5).counts_by(|x| x % 2 == 0)'));
add('itertools/into-group-map-by', 'into_group_map_by', null, 'How Itertools::into_group_map_by works', 'Groups items into a HashMap<key, Vec<item>>.', {
  rows: [['"ant"', '"bee"', '"ape"']], call: 'it.into_group_map_by(|w| w.chars().next().unwrap())', note: 'all items, grouped anywhere', outs: ["'a': [\"ant\", \"ape\"]", "'b': [\"bee\"]"],
  intro: 'Unlike chunk_by, the items need not be next to each other: every item goes into its key\'s Vec.',
  steps: [['"ant" and "ape" start with a.', [0, 2], 'o0'], ['"bee" starts with b.', 1, 'o1']],
  result: "{'a': [\"ant\", \"ape\"], 'b': [\"bee\"]}", resultCap: 'Order inside each Vec follows the input.',
}, U + BT('["ant", "bee", "ape"].into_iter().into_group_map_by(|w| w.chars().next().unwrap())'));
add('itertools/into-grouping-map', 'into_grouping_map', null, 'How Itertools::into_grouping_map works', 'Starts a per-key aggregation over (key, value) pairs.', one('pairs.into_grouping_map().sum()', '("a",1) ("b",2) ("a",3)', '{"a": 4, "b": 2}', 'group then aggregate', 'GroupingMap offers sum, max, min, fold, collect and more.', 'Group the values by key.', 'Sum each group.', '{"a": 4, "b": 2}', 'Faster than into_group_map followed by sums.'), U + BT('[("a", 1), ("b", 2), ("a", 3)].into_iter().into_grouping_map().sum()'));
add('itertools/into-grouping-map-by', 'into_grouping_map_by', null, 'How Itertools::into_grouping_map_by works', 'Starts a per-key aggregation with keys computed from the items.', one('nums.into_grouping_map_by(|x| x % 3).max()', '1..=7', '{0: 6, 1: 7, 2: 5}', 'key from the item', 'The values are the items themselves.', 'Key = remainder by 3.', 'Max of each group.', '{0: 6, 1: 7, 2: 5}', 'into_grouping_map needs (key, value) pairs.'), U + BT('(1..=7).into_grouping_map_by(|x| x % 3).max()'));
add('itertools/grouping-map-fold', 'fold', GM, 'How GroupingMap::fold works', 'Folds the values of each group separately, from an initial value.', one('gm.fold(0, |acc, _key, v| acc + v * v)', '("a",1) ("a",2) ("b",3)', '{"a": 5, "b": 9}', 'custom per-group fold', 'The closure also gets the key.', 'a: 0 + 1 + 4.', 'b: 0 + 9.', '{"a": 5, "b": 9}', 'sum/max/min are ready-made folds.'), U + BT('[("a", 1), ("a", 2), ("b", 3)].into_iter().into_grouping_map().fold(0, |acc, _k, v| acc + v * v)'));
add('itertools/grouping-map-collect', 'collect', GM, 'How GroupingMap::collect works', 'Collects the values of each group into a collection of your choice.', one('gm.collect::<BTreeSet<_>>()', '("a",2) ("a",1) ("a",2)', '{"a": {1, 2}}', 'group into sets', 'Any FromIterator collection works.', 'Gather a\'s values.', 'Into a sorted set.', '{"a": {1, 2}}', 'into_group_map is the Vec version.'), U + BT('[("a", 2), ("a", 1), ("a", 2)].into_iter().into_grouping_map().collect::<std::collections::BTreeSet<_>>()'));
add('itertools/grouping-map-max', 'max', GM, 'How GroupingMap::max works', 'The largest value of each group.', one('gm.max()', '("x",3) ("x",8) ("y",1)', '{"x": 8, "y": 1}', 'per-group max', 'min() gives the smallest.', 'x: max(3, 8).', 'y: 1.', '{"x": 8, "y": 1}', 'max_by_key compares by a key.'), U + BT('[("x", 3), ("x", 8), ("y", 1)].into_iter().into_grouping_map().max()'));
add('itertools/grouping-map-reduce', 'reduce', GM, 'How GroupingMap::reduce works', 'Combines the values of each group, starting from the first one.', one('gm.reduce(|acc, _key, v| acc * v)', '("a",2) ("a",3) ("b",4)', '{"a": 6, "b": 4}', 'fold without an initial value', 'A group with one value keeps it.', 'a: 2 × 3.', 'b: just 4.', '{"a": 6, "b": 4}', 'Older itertools called this fold_first.'), U + BT('[("a", 2), ("a", 3), ("b", 4)].into_iter().into_grouping_map().reduce(|acc, _k, v| acc * v)'));

// ---------------------------------------------------------------- min / max

add('itertools/min-set', 'min_set', null, 'How Itertools::min_set works', 'All items equal to the minimum, not just the first one.', {
  rows: [['3', '1', '4', '1']], call: 'it.min_set()', note: 'every tie', outs: ['1', '1'],
  intro: 'min() returns one minimum. min_set returns all of them, in order.',
  steps: [['The smallest value is 1.', [1, 3]], ['Both 1s are kept.', [1, 3], 'o0,1']],
  result: '[1, 1]', resultCap: 'max_set does the same for the maximum.',
}, U + 'd([3, 1, 4, 1].into_iter().min_set())');
add('itertools/max-set', 'max_set', null, 'How Itertools::max_set works', 'All items equal to the maximum.', one('it.max_set()', '5, 2, 5', '[5, 5]', 'every tie', 'An empty iterator gives an empty Vec.', 'The maximum is 5.', 'Both 5s.', '[5, 5]', 'min_set for the minimum.'), U + 'd([5, 2, 5].into_iter().max_set())');
add('itertools/max-set-by-key', 'max_set_by_key', null, 'How Itertools::max_set_by_key works', 'All items whose key is the largest.', one('words.max_set_by_key(|w| w.len())', '"ab" "c" "de"', '["ab", "de"]', 'longest ones', 'Every item that ties for the biggest key.', 'Lengths 2, 1, 2.', 'Both length-2 words.', '["ab", "de"]', 'max_by_key returns only the last one.'), U + 'd(["ab", "c", "de"].into_iter().max_set_by_key(|w| w.len()))');
add('itertools/min-set-by-key', 'min_set_by_key', null, 'How Itertools::min_set_by_key works', 'All items whose key is the smallest.', one('words.min_set_by_key(|w| w.len())', '"ab" "c" "d"', '["c", "d"]', 'shortest ones', 'Ties are all kept.', 'Lengths 2, 1, 1.', 'Both length-1 words.', '["c", "d"]', 'min_by_key returns only the first.'), U + 'd(["ab", "c", "d"].into_iter().min_set_by_key(|w| w.len()))');
add('itertools/minmax-by-key', 'minmax_by_key', null, 'How Itertools::minmax_by_key works', 'The items with the smallest and largest key, in one pass.', one('words.minmax_by_key(|w| w.len())', '"bb" "a" "ccc"', 'MinMax("a", "ccc")', 'both ends at once', 'OneElement or NoElements for short inputs.', 'Shortest: "a".', 'Longest: "ccc".', 'MinMax("a", "ccc")', '.into_option() gives Option<(min, max)>.'), U + 'd(["bb", "a", "ccc"].into_iter().minmax_by_key(|w| w.len()))');
add('itertools/k-largest', 'k_largest', null, 'How Itertools::k_largest works', 'The k largest items, biggest first.', {
  rows: [['3', '9', '1', '7', '5']], call: 'it.k_largest(2)', note: 'keeps only k items in memory', outs: ['9', '7'],
  intro: 'k_largest walks the input once with a small heap of size k.',
  steps: [['Walk all items, keeping the two biggest seen so far.', [0, 1, 2, 3, 4]], ['9 and 7, from biggest to smallest.', [1, 3], 'o0,1']],
  result: '9, 7', resultCap: 'k_smallest gives the smallest ones, smallest first.',
}, U + 'j([3, 9, 1, 7, 5].into_iter().k_largest(2))');
add('itertools/k-smallest-by-key', 'k_smallest_by_key', null, 'How Itertools::k_smallest_by_key works', 'The k items with the smallest keys.', one('it.k_smallest_by_key(2, |p| p.1)', '("a",3) ("b",1) ("c",2)', '("b", 1), ("c", 2)', 'top-k by field', 'Sorted by key, smallest first.', 'Keys 3, 1, 2.', 'The two smallest.', '("b", 1), ("c", 2)', 'k_largest_by_key for the biggest.'), U + 'jd([("a", 3), ("b", 1), ("c", 2)].into_iter().k_smallest_by_key(2, |p| p.1))');
add('itertools/position-min', 'position_min', null, 'How Itertools::position_min works', 'The index of the smallest item (the first one, on ties).', one('it.position_min()', '4, 1, 3, 1', 'Some(1)', 'where is the min', 'None for an empty iterator.', 'The smallest is 1.', 'First at index 1.', 'Some(1)', 'position_max finds the largest (last on ties).'), U + 'd([4, 1, 3, 1].iter().position_min())');
add('itertools/position-max-by-key', 'position_max_by_key', null, 'How Itertools::position_max_by_key works', 'The index of the item with the largest key.', one('it.position_max_by_key(|w| w.len())', '"a" "abc" "ab"', 'Some(1)', 'index of the longest', 'On ties, the last one wins.', 'Lengths 1, 3, 2.', 'Index 1.', 'Some(1)', 'position_min_by_key for the smallest.'), U + 'd(["a", "abc", "ab"].iter().position_max_by_key(|w| w.len()))');
add('itertools/position-minmax', 'position_minmax', null, 'How Itertools::position_minmax works', 'The indices of the smallest and the largest item.', one('it.position_minmax()', '5, 1, 9, 3', 'MinMax(1, 2)', 'both indices', 'One pass over the data.', 'Min 1 at index 1.', 'Max 9 at index 2.', 'MinMax(1, 2)', 'minmax() returns the values instead.'), U + 'd([5, 1, 9, 3].iter().position_minmax())');

module.exports = list;
