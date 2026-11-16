// Rust standard library: the methods slice, Chars, CharIndices and Bytes iterators define themselves.
// v.iter().any(..) does not land on Iterator::any: slice iterators override it inside the macro iterator! in
// core/src/slice/iter/macros.rs, and s.chars().count() lands on Chars::count. These animations live there.
const { group, nums } = require('./kit.cjs');
const IT = ['core', 'iterator', /slice\/iter\/macros\.rs$/];
const CHARS = ['core', 'Chars', /str\/iter\.rs$/];
const CI = ['core', 'CharIndices', /str\/iter\.rs$/];
const BYTES = ['core', 'Bytes', /str\/iter\.rs$/];
const { list, add } = group({ at: IT });

// ---------------------------------------------------------------- slice iterators (v.iter(), v.iter_mut())

add('slice_iter/next', 'next', null, 'How next works on a slice iterator', 'Gives the next element of v.iter(), or None at the end.', {
  rows: [nums([4, 5])], call: 'let mut it = v.iter(); it.next()', note: 'one step at a time', outs: ['Some(&4)', 'Some(&5)', 'None'],
  intro: 'The iterator keeps a position; each next() moves it forward.',
  steps: [['First call: the first element.', 0, 'o0'], ['Second call: the next one.', 1, 'o1'], ['Nothing left: None.', [], 'o2']],
  result: 'Some(4), Some(5), None', resultCap: 'A for loop calls next() for you until it returns None.',
}, 'let v = [4, 5]; let mut it = v.iter(); format!("{:?}, {:?}, {:?}", it.next(), it.next(), it.next())');

add('slice_iter/next_back', 'next_back', null, 'How next_back works on a slice iterator', 'Takes the next element from the end.', {
  rows: [nums([1, 2, 3])], call: 'it.next_back()', note: 'from the back', outs: ['Some(&3)', 'then Some(&2)'],
  intro: 'Slice iterators can be consumed from both ends.',
  steps: [['The last element comes out first.', 2, 'o0'], ['Then the one before it.', 1, 'o1']],
  result: 'Some(3), Some(2)', resultCap: 'rev() uses next_back to walk backwards.',
}, 'let v = [1, 2, 3]; let mut it = v.iter(); format!("{:?}, {:?}", it.next_back(), it.next_back())');

add('slice_iter/any', 'any', null, 'How any works on v.iter()', 'true if at least one element passes the test; stops at the first one.', {
  rows: [nums([3, 8, 1])], call: 'v.iter().any(|&x| x > 5)', note: 'is there one?', outs: ['true'],
  intro: 'any checks elements in order and stops as soon as one passes.',
  steps: [['3 > 5? No.', 0, 'x'], ['8 > 5? Yes: stop, true.', 1, 'o0']],
  result: 'true', resultCap: 'An empty slice gives false. 1 is never looked at.',
}, '[3, 8, 1].iter().any(|&x| x > 5).to_string()');

add('slice_iter/all', 'all', null, 'How all works on v.iter()', 'true if every element passes the test; stops at the first failure.', {
  rows: [nums([2, 4, 5, 6])], call: 'v.iter().all(|x| x % 2 == 0)', note: 'are they all?', outs: ['false'],
  intro: 'all stops as soon as one element fails.',
  steps: [['2 and 4 are even.', [0, 1]], ['5 is odd: stop, false.', 2, { srcColor: 'danger', out: [0] }]],
  result: 'false', resultCap: 'An empty slice gives true: nothing fails.',
}, '[2, 4, 5, 6].iter().all(|x| x % 2 == 0).to_string()');

add('slice_iter/find', 'find', null, 'How find works on v.iter()', 'The first element that passes the test, as Some(&x).', {
  rows: [['"ant"', '"bee"', '"bat"']], call: 'v.iter().find(|w| w.starts_with(\'b\'))', note: 'the first match', outs: ['Some("bee")'],
  intro: 'find returns a reference to the element, or None.',
  steps: [['"ant" fails.', 0, 'x'], ['"bee" passes: returned. "bat" is never checked.', 1, 'o0']],
  result: 'Some("bee")', resultCap: 'Use position() if you need the index instead.',
}, 'let v = ["ant", "bee", "bat"]; d(v.iter().find(|w| w.starts_with(\'b\')))');

add('slice_iter/find_map', 'find_map', null, 'How find_map works on v.iter()', 'Applies a function until it returns Some, and gives that value.', {
  rows: [['"x"', '"7"', '"9"']], call: 'v.iter().find_map(|s| s.parse::<i32>().ok())', note: 'first successful conversion', outs: ['Some(7)'],
  intro: 'Like find, but you also transform the element.',
  steps: [['"x" does not parse: keep going.', 0, 'x'], ['"7" parses: Some(7), stop.', 1, 'o0']],
  result: 'Some(7)', resultCap: 'Same as filter_map(..).next().',
}, 'let v = ["x", "7", "9"]; d(v.iter().find_map(|s| s.parse::<i32>().ok()))');

add('slice_iter/position', 'position', null, 'How position works on v.iter()', 'The index of the first element that passes the test.', {
  rows: [nums([5, 9, 2, 9])], call: 'v.iter().position(|&x| x == 9)', note: 'where is it?', outs: ['Some(1)'],
  intro: 'Counts from 0 and stops at the first match.',
  steps: [['Index 0: 5, no.', 0, 'x'], ['Index 1: 9, yes.', 1, 'o0']],
  result: 'Some(1)', resultCap: 'rposition searches from the end: it would give 3.',
}, '[5, 9, 2, 9].iter().position(|&x| x == 9).map_or(String::from("None"), |i| format!("Some({})", i))');

add('slice_iter/rposition', 'rposition', null, 'How rposition works on v.iter()', 'The index of the last element that passes the test.', {
  rows: [nums([5, 9, 2, 9])], call: 'v.iter().rposition(|&x| x == 9)', note: 'search from the end', outs: ['Some(3)'],
  intro: 'Searches backwards but still reports the normal index.',
  steps: [['Index 3: 9, a match.', 3, 'o0'], ['The search stops there.', []]],
  result: 'Some(3)', resultCap: 'Handy for "the last occurrence".',
}, 'd([5, 9, 2, 9].iter().rposition(|&x| x == 9))');

add('slice_iter/count', 'count', null, 'How count works on v.iter()', 'How many elements are left; instant for slices.', {
  rows: [nums([7, 7, 7])], call: 'v.iter().count()', note: 'no walking needed', outs: ['3'],
  intro: 'A slice iterator knows its length, so count does not loop.',
  steps: [['Three elements remain.', [0, 1, 2]], ['count is 3.', [], 'o0']],
  result: '3', resultCap: 'v.len() is the simpler way; count() is useful after filter().',
}, '[7, 7, 7].iter().count().to_string()');

add('slice_iter/nth', 'nth', null, 'How nth works on v.iter()', 'Skips n elements and returns the next one (0 = first).', {
  rows: [['"a"', '"b"', '"c"']], call: 'v.iter().nth(2)', note: 'zero-based', outs: ['Some("c")'],
  intro: 'For slices nth jumps directly; it does not step one by one.',
  steps: [['"a" and "b" are skipped.', [0, 1], 'x'], ['"c" is returned.', 2, 'o0']],
  result: 'Some("c")', resultCap: 'The skipped elements are consumed: a second nth(0) would be None here.',
}, 'let v = ["a", "b", "c"]; d(v.iter().nth(2))');

add('slice_iter/nth_back', 'nth_back', null, 'How nth_back works on v.iter()', 'Skips n elements from the end and returns the next one.', {
  rows: [nums([1, 2, 3, 4])], call: 'v.iter().nth_back(1)', note: '0 = last', outs: ['Some(&3)'],
  intro: 'Counting from the end: 4 is position 0, 3 is position 1.',
  steps: [['4 is skipped.', 3, 'x'], ['3 is returned.', 2, 'o0']],
  result: 'Some(3)', resultCap: 'v.get(v.len() - 2) gives the same element without an iterator.',
}, 'd([1, 2, 3, 4].iter().nth_back(1))');

add('slice_iter/last', 'last', null, 'How last works on v.iter()', 'The last element, without walking through the others.', {
  rows: [nums([3, 6, 9])], call: 'v.iter().last()', note: 'jumps to the end', outs: ['Some(&9)'],
  intro: 'Slice iterators go straight to the end.',
  steps: [['The end of the slice is 9.', 2], ['Some(&9).', [], 'o0']],
  result: 'Some(9)', resultCap: 'v.last() does the same on the slice itself.',
}, 'd([3, 6, 9].iter().last())');

add('slice_iter/fold', 'fold', null, 'How fold works on v.iter()', 'Combines all elements into one value, starting from an initial value.', {
  kind: 'lines', call: 'v.iter().fold(0, |acc, x| acc * 10 + x)', note: 'digits → number',
  lines: ['acc = 0', 'acc = 0 * 10 + 1 = 1', 'acc = 1 * 10 + 2 = 12', 'acc = 12 * 10 + 3 = 123'],
  intro: 'fold carries an accumulator through every element.',
  steps: [{ cap: 'Start at 0.', show: [0] }, { cap: 'Add digit 1.', show: [1] }, { cap: 'Then 2.', show: [2] }, { cap: 'Then 3.', show: [3] }],
  result: '123', resultCap: 'sum() and product() are special cases of fold.',
}, '[1, 2, 3].iter().fold(0, |acc, x| acc * 10 + x).to_string()');

add('slice_iter/for_each', 'for_each', null, 'How for_each works on v.iter()', 'Runs a closure on every element.', {
  rows: [nums([1, 2, 3])], call: 'v.iter().for_each(|x| total += x);', note: 'like a for loop', outs: ['total = 6'],
  intro: 'for_each is the method form of a for loop.',
  steps: [['Each element is passed to the closure.', [0, 1, 2]], ['total ends at 6.', [], 'o0']],
  result: '6', resultCap: 'A for loop is usually clearer; for_each reads well at the end of a chain.',
}, 'let mut total = 0; [1, 2, 3].iter().for_each(|x| total += x); total.to_string()');

// ---------------------------------------------------------------- Chars, CharIndices

add('chars/next', 'next', CHARS, 'How Chars::next works', 'Decodes the next character of the string.', {
  rows: [['"hé"']], call: 'let mut c = s.chars(); c.next()', note: 'one char, maybe several bytes', outs: ["Some('h')", "Some('é')", 'None'],
  intro: 'Chars reads UTF-8: é takes two bytes but comes out as one char.',
  steps: [["'h' (1 byte).", 0, 'o0'], ["'é' (2 bytes).", 0, 'o1'], ['End: None.', 0, 'o2']],
  result: "Some('h'), Some('é'), None", resultCap: 's.chars().next() is the usual way to get the first character.',
}, 'let mut c = "hé".chars(); format!("{:?}, {:?}, {:?}", c.next(), c.next(), c.next())');

add('chars/count', 'count', CHARS, 'How Chars::count works', 'The number of characters, which can differ from the number of bytes.', {
  rows: [['"héllo"']], call: 's.chars().count()', note: 'chars, not bytes', outs: ['5 chars', 'len() = 6 bytes'],
  intro: 'é is one character but two bytes.',
  steps: [['Five characters are counted.', 0, 'o0'], ['s.len() would say 6.', 0, 'o1']],
  result: '5, 6', resultCap: 'Counting chars walks the whole string; len() is instant.',
}, 'let s = "héllo"; format!("{}, {}", s.chars().count(), s.len())');

add('chars/last', 'last', CHARS, 'How Chars::last works', 'The last character of the string.', {
  rows: [['"abc!"']], call: 's.chars().last()', note: 'starts from the end', outs: ["Some('!')"],
  intro: 'Chars::last reads backwards from the end instead of walking the whole string.',
  steps: [['The final character is !.', 0], ["Some('!').", [], 'o0']],
  result: "Some('!')", resultCap: 's.chars().next_back() does the same.',
}, 'd("abc!".chars().last())');

add('chars/next_back', 'next_back', CHARS, 'How Chars::next_back works', 'Decodes the next character from the end.', {
  rows: [['"añb"']], call: 'c.next_back()', note: 'backwards through UTF-8', outs: ["Some('b')", "Some('ñ')"],
  intro: 'Chars can walk from both ends; chars().rev() uses this.',
  steps: [["'b' comes first.", 0, 'o0'], ["Then 'ñ' (2 bytes, one char).", 0, 'o1']],
  result: "Some('b'), Some('ñ')", resultCap: 'Reverse a string: s.chars().rev().collect::<String>().',
}, 'let mut c = "añb".chars(); format!("{:?}, {:?}", c.next_back(), c.next_back())');

add('char_indices/next', 'next', CI, 'How CharIndices::next works', 'The next character together with its byte position.', {
  rows: [['"aé!"']], call: 'it.next()', note: '(byte index, char)', outs: ["(0, 'a')", "(1, 'é')", "(3, '!')"],
  intro: 'Byte positions jump by the size of each character.',
  steps: [["'a' at 0.", 0, 'o0'], ["'é' at 1 (it takes 2 bytes).", 0, 'o1'], ["'!' at 3.", 0, 'o2']],
  result: "(0, 'a'), (1, 'é'), (3, '!')", resultCap: 'The indexes are safe to slice with: &s[i..].',
}, 'jd("aé!".char_indices())');

add('char_indices/count', 'count', CI, 'How CharIndices::count works', 'The number of characters left.', {
  rows: [['"日本"']], call: 's.char_indices().count()', note: 'chars, not bytes', outs: ['2'],
  intro: 'Each of these characters takes 3 bytes, but there are only 2 characters.',
  steps: [['Two characters.', 0], ['count is 2 (len() would be 6).', [], 'o0']],
  result: '2', resultCap: 'Same as chars().count().',
}, '"日本".char_indices().count().to_string()');

add('char_indices/last', 'last', CI, 'How CharIndices::last works', 'The last character and its byte position.', {
  rows: [['"aé"']], call: 's.char_indices().last()', note: 'position of the final char', outs: ["Some((1, 'é'))"],
  intro: 'é starts at byte 1.',
  steps: [['The last character is é.', 0], ['It starts at byte 1.', [], 'o0']],
  result: "Some((1, 'é'))", resultCap: 'Remove the last char safely: &s[..i].',
}, 'd("aé".char_indices().last())');

add('char_indices/next_back', 'next_back', CI, 'How CharIndices::next_back works', 'The next character from the end, with its byte position.', {
  rows: [['"ab"']], call: 'it.next_back()', note: 'backwards', outs: ["Some((1, 'b'))", "Some((0, 'a'))"],
  intro: 'char_indices().rev() walks the string backwards with positions.',
  steps: [["'b' at 1.", 0, 'o0'], ["'a' at 0.", 0, 'o1']],
  result: "Some((1, 'b')), Some((0, 'a'))", resultCap: 'Find the last space: s.char_indices().rev().find(|(_, c)| *c == \' \').',
}, 'let mut it = "ab".char_indices(); format!("{:?}, {:?}", it.next_back(), it.next_back())');

// ---------------------------------------------------------------- Bytes

add('bytes_iter/next', 'next', BYTES, 'How Bytes::next works', 'The next byte of the string\'s UTF-8 encoding.', {
  rows: [['"hé"']], call: 'let mut b = s.bytes(); b.next()', note: 'u8 values', outs: ['Some(104)', 'Some(195)', 'Some(169)'],
  intro: 'é is two bytes: 195 and 169.',
  steps: [['h is 104.', 0, 'o0'], ['é gives two bytes.', 0, 'o1,2']],
  result: '[104, 195, 169]', resultCap: 'Use chars() for characters, bytes() for raw data.',
}, 'd("hé".bytes().collect::<Vec<u8>>())');

add('bytes_iter/count', 'count', BYTES, 'How Bytes::count works', 'The number of bytes left; instant.', {
  rows: [['"hé"']], call: 's.bytes().count()', note: 'same as len()', outs: ['3'],
  intro: 'A byte iterator knows its length.',
  steps: [['h is 1 byte, é is 2.', 0], ['count is 3.', [], 'o0']],
  result: '3', resultCap: 's.len() gives the same number directly.',
}, '"hé".bytes().count().to_string()');

add('bytes_iter/nth', 'nth', BYTES, 'How Bytes::nth works', 'The byte at a position (skipping the ones before).', {
  rows: [['"abc"']], call: 's.bytes().nth(1)', note: 'jumps directly', outs: ['Some(98)'],
  intro: 'b is byte number 1 (counting from 0).',
  steps: [['a is skipped.', 0], ['b = 98.', [], 'o0']],
  result: 'Some(98)', resultCap: 's.as_bytes().get(1) does the same without consuming anything.',
}, 'd("abc".bytes().nth(1))');

add('bytes_iter/any', 'any', BYTES, 'How Bytes::any works', 'true if some byte passes the test.', {
  rows: [['"hello world"']], call: 's.bytes().any(|b| b == b\' \')', note: 'is there a space?', outs: ['true'],
  intro: 'Stops at the first matching byte.',
  steps: [['The bytes are checked in order.', 0], ['A space is found: true.', [], 'o0']],
  result: 'true', resultCap: 's.contains(\' \') is the string version.',
}, '"hello world".bytes().any(|b| b == b\' \').to_string()');

add('bytes_iter/position', 'position', BYTES, 'How Bytes::position works', 'The index of the first byte that passes the test.', {
  rows: [['"key=val"']], call: 's.bytes().position(|b| b == b\'=\')', note: 'byte index', outs: ['Some(3)'],
  intro: 'Positions are byte offsets, safe to slice with when the byte is ASCII.',
  steps: [['k, e, y do not match.', 0], ['= is at 3.', [], 'o0']],
  result: 'Some(3)', resultCap: 's.find(\'=\') is the string version.',
}, 'd("key=val".bytes().position(|b| b == b\'=\'))');

add('bytes_iter/rposition', 'rposition', BYTES, 'How Bytes::rposition works', 'The index of the last byte that passes the test.', {
  rows: [['"a/b/c"']], call: 's.bytes().rposition(|b| b == b\'/\')', note: 'search from the end', outs: ['Some(3)'],
  intro: 'Finds the last slash.',
  steps: [['Searching backwards from c.', 0], ['The last / is at 3.', [], 'o0']],
  result: 'Some(3)', resultCap: 's.rfind(\'/\') is the string version.',
}, 'd("a/b/c".bytes().rposition(|b| b == b\'/\'))');

add('bytes_iter/all', 'all', BYTES, 'How Bytes::all works', 'true if every byte passes the test.', {
  rows: [['"2024"', '"20a4"']], call: 's.bytes().all(|b| b.is_ascii_digit())', note: 'only digits?', outs: ['true', 'false'],
  intro: 'Stops at the first byte that fails.',
  steps: [['"2024": all digits.', 0, 'o0'], ['"20a4": a fails.', 1, 'o1']],
  result: 'true, false', resultCap: 'An empty string gives true.',
}, 'format!("{}, {}", "2024".bytes().all(|b| b.is_ascii_digit()), "20a4".bytes().all(|b| b.is_ascii_digit()))');

add('bytes_iter/rfind', 'rfind', BYTES, 'How Bytes::rfind works', 'The last byte that passes the test.', {
  rows: [['"ab12"']], call: 's.bytes().rfind(|b| b.is_ascii_alphabetic())', note: 'from the end', outs: ['Some(98)'],
  intro: 'Searches backwards: 2 and 1 fail, b passes.',
  steps: [['2 and 1 are skipped.', 0], ['b (98) is found.', [], 'o0']],
  result: 'Some(98)', resultCap: 'Returns the byte; rposition returns its index.',
}, 'd("ab12".bytes().rfind(|b| b.is_ascii_alphabetic()))');

module.exports = list;
