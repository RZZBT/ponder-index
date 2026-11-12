// Rust standard library: str methods (core::str and alloc::str). Strings are shown one box per character.
const { group } = require('./kit.cjs');
const { list, add } = group({ at: ['core', 'str', /str\/mod\.rs$/] });
const ALLOC = ['alloc', 'str', /^src\/str\.rs$/];
const S = (spec) => ({ kind: 'cells', ...spec });

add('str/len', 'len', null, 'How str::len works', 'The length in bytes, which is not always the number of characters.', S({
  call: '"héllo".len()', note: 'counts bytes (UTF-8)', text: 'héllo', idx: false, outs: ['1 byte', '2 bytes', '1', '1', '1'],
  intro: 'Rust strings are UTF-8. Plain letters take 1 byte; letters like é take 2.',
  steps: [
    { cap: 'h is 1 byte.', mark: [[0, 1, 'accent2']], out: [0] },
    { cap: 'é is 2 bytes in UTF-8.', mark: [[1, 2, 'warning']], keep: true, out: [1], eq: 'é = 0xC3 0xA9' },
    { cap: 'l, l and o are 1 byte each.', mark: [[2, 5, 'accent2']], keep: true, out: [2, 3, 4] },
  ],
  result: '6', resultCap: '5 characters, but len() is 6. Use s.chars().count() to count characters.',
}), '"héllo".len().to_string()');

add('str/chars', 'chars', null, 'How str::chars works', 'An iterator over the characters (Unicode scalar values) of a string.', S({
  call: '"héllo".chars().count()', note: 'characters, not bytes', text: 'héllo', outs: ["'h'", "'é'", "'l'", "'l'", "'o'"],
  intro: 'chars() decodes the UTF-8 bytes and yields one char at a time.',
  steps: [
    { cap: "'h'.", mark: [[0, 1, 'warning']], out: [0] },
    { cap: "'é' is one char, even though it takes 2 bytes.", mark: [[1, 2, 'warning']], out: [1] },
    { cap: "'l', 'l', 'o'.", mark: [[2, 5, 'warning']], out: [2, 3, 4] },
  ],
  result: '5', resultCap: 'chars() gives 5 items for "héllo", while len() says 6 bytes. Some symbols (like emoji with skin tones) are several chars.',
}), '"héllo".chars().count().to_string()');

add('str/char_indices', 'char_indices', null, 'How str::char_indices works', 'Each character together with its byte position.', S({
  call: '"héllo".char_indices()', note: 'positions jump over wide characters', text: 'héllo', outs: ["(0, 'h')", "(1, 'é')", "(3, 'l')"],
  intro: 'char_indices yields (byte index, char) pairs. The index is where the char starts in the bytes.',
  steps: [
    { cap: "'h' starts at byte 0.", mark: [[0, 1, 'warning']], out: [0] },
    { cap: "'é' starts at byte 1 and takes bytes 1 and 2.", mark: [[1, 2, 'warning']], out: [1], eq: '2 bytes' },
    { cap: "So the next 'l' starts at byte 3, not 2.", mark: [[2, 3, 'warning']], out: [2], eq: 'index 3' },
  ],
  result: "(0, 'h'), (1, 'é'), (3, 'l'), (4, 'l'), (5, 'o')", resultCap: 'These byte indexes are the ones you may use for slicing: &s[3..] is "llo".',
}), 'jd("héllo".char_indices())');

add('str/split', 'split', null, 'How str::split works', 'Cuts a string at every separator; empty pieces are kept.', S({
  call: '"a,b,,c".split(\',\')', note: 'every comma is a cut', text: 'a,b,,c', outs: ['"a"', '"b"', '""', '"c"'],
  intro: 'split(\',\') cuts at every comma and yields the pieces between them.',
  steps: [
    { cap: 'Before the first comma: "a".', mark: [[0, 1, 'warning'], [1, 2, 'danger']], out: [0] },
    { cap: 'Between the first two commas: "b".', mark: [[2, 3, 'warning'], [3, 4, 'danger']], out: [1] },
    { cap: 'Between two commas in a row there is nothing: an empty piece "".', mark: [[3, 5, 'danger']], out: [2], eq: 'empty piece' },
    { cap: 'After the last comma: "c".', mark: [[5, 6, 'warning']], out: [3] },
  ],
  result: '"a", "b", "", "c"', resultCap: 'Empty pieces are kept on purpose. Add .filter(|s| !s.is_empty()) to drop them, or use split_whitespace for spaces.',
}), 'jd("a,b,,c".split(\',\'))');

add('str/split_whitespace', 'split_whitespace', null, 'How str::split_whitespace works', 'Splits at any run of spaces, tabs or newlines; never yields empty pieces.', S({
  call: '"  hi   you ".split_whitespace()', note: 'any amount of whitespace', text: '  hi   you ', outs: ['"hi"', '"you"'],
  intro: 'split_whitespace treats any run of whitespace as one separator and ignores it at both ends.',
  steps: [
    { cap: 'The leading spaces are skipped.', mark: [[0, 2, 'danger']] },
    { cap: 'The first word is "hi".', mark: [[2, 4, 'warning']], out: [0] },
    { cap: 'Three spaces in a row count as one separator.', mark: [[4, 7, 'danger']] },
    { cap: '"you", and the trailing space is ignored.', mark: [[7, 10, 'warning'], [10, 11, 'danger']], out: [1] },
  ],
  result: '"hi", "you"', resultCap: 'Perfect for reading words from input. Compare split(\' \'), which would give empty pieces here.',
}), 'jd("  hi   you ".split_whitespace())');

add('str/lines', 'lines', null, 'How str::lines works', 'Splits a string into lines; handles both \\n and \\r\\n.', S({
  call: '"one\\ntwo\\n".lines()', note: 'the line endings are not included', text: 'one↵two↵', outs: ['"one"', '"two"'],
  intro: 'lines() cuts at each line ending (shown as ↵) and drops it.',
  steps: [
    { cap: 'The first line is "one".', mark: [[0, 3, 'warning'], [3, 4, 'danger']], out: [0] },
    { cap: 'The second line is "two". A final line ending does not create an empty line.', mark: [[4, 7, 'warning'], [7, 8, 'danger']], out: [1] },
  ],
  result: '"one", "two"', resultCap: 'lines() also removes the \\r of Windows line endings, so "a\\r\\nb" gives "a", "b".',
}), 'jd("one\\ntwo\\n".lines())');

add('str/trim', 'trim', null, 'How str::trim works', 'Removes whitespace from both ends; returns a slice of the same string.', S({
  call: '"  hi  ".trim()', note: 'no copy is made', text: '  hi  ', outs: ['"hi"'],
  intro: 'trim finds the first and last non-whitespace characters and returns what is between them.',
  steps: [
    { cap: 'Leading spaces are cut off.', mark: [[0, 2, 'danger']] },
    { cap: 'Trailing spaces too.', mark: [[4, 6, 'danger']], keep: true },
    { cap: 'What is left is "hi": a view into the original string.', mark: [[2, 4, 'success']], keep: true, out: [0] },
  ],
  result: '"hi"', resultCap: 'trim returns &str borrowed from the original. trim_start and trim_end cut only one side.',
}), 'd("  hi  ".trim())');

add('str/starts_with', 'starts_with', null, 'How str::starts_with works', 'Checks whether the string begins with a given text.', S({
  call: '"rustacean".starts_with("rust")', note: 'compares the beginning', text: 'rustacean', outs: ['true'],
  intro: 'starts_with compares the first characters with the pattern.',
  steps: [
    { cap: 'The first 4 characters are "rust", exactly the pattern.', mark: [[0, 4, 'success']] },
    { cap: 'So the answer is true. The rest is not looked at.', out: [0], keep: true },
  ],
  result: 'true', resultCap: 'The pattern can also be a char or a closure: s.starts_with(char::is_uppercase). ends_with checks the end.',
}), '"rustacean".starts_with("rust").to_string()');

add('str/contains', 'contains', null, 'How str::contains works', 'Checks whether a text appears anywhere in the string.', S({
  call: '"hello world".contains("o w")', note: 'anywhere, not just at the start', text: 'hello world', outs: ['true'],
  intro: 'contains searches the whole string for the pattern.',
  steps: [
    { cap: '"o w" is found starting at position 4.', mark: [[4, 7, 'success']] },
    { cap: 'contains only says whether it exists: true.', out: [0], keep: true },
  ],
  result: 'true', resultCap: 'Use find to also learn where it is. The search is case-sensitive: "Hello".contains("hello") is false.',
}), '"hello world".contains("o w").to_string()');

add('str/find', 'find', null, 'How str::find works', 'Returns the byte index where a pattern first appears.', S({
  call: '"banana".find("an")', note: 'the first match from the left', text: 'banana', idx: true, outs: ['Some(1)'],
  intro: 'find looks for "an" from the left and returns where the first match starts.',
  steps: [
    { cap: 'At index 0, "ba" is not "an".', mark: [[0, 2, 'danger']] },
    { cap: 'At index 1, "an" matches: the answer is Some(1).', mark: [[1, 3, 'success']], out: [0] },
  ],
  result: 'Some(1)', resultCap: 'rfind searches from the right ("banana".rfind("an") is Some(3)). None means not found.',
}), 'd("banana".find("an"))');

add('str/split_once', 'split_once', null, 'How str::split_once works', 'Splits at the first separator into exactly two parts.', S({
  call: '"key=value=x".split_once(\'=\')', note: 'only the first = counts', text: 'key=value=x', outs: ['"key"', '"value=x"'],
  intro: 'split_once cuts at the first separator only and returns the part before and the part after.',
  steps: [
    { cap: 'The first = is at index 3. Before it: "key".', mark: [[0, 3, 'warning'], [3, 4, 'danger']], out: [0] },
    { cap: 'Everything after it is the second part, including the second =.', mark: [[4, 11, 'accent2']], keep: true, out: [1] },
  ],
  result: 'Some(("key", "value=x"))', resultCap: 'Ideal for "key=value" lines. Without a separator it returns None. rsplit_once cuts at the last one.',
}), 'd("key=value=x".split_once(\'=\'))');

add('str/splitn', 'splitn', null, 'How str::splitn works', 'Splits at most into n pieces; the last piece keeps the rest.', S({
  call: '"a-b-c-d".splitn(2, \'-\')', note: 'at most 2 pieces', text: 'a-b-c-d', outs: ['"a"', '"b-c-d"'],
  intro: 'splitn(2, ...) makes at most one cut, so there are at most 2 pieces.',
  steps: [
    { cap: 'The first piece: "a".', mark: [[0, 1, 'warning'], [1, 2, 'danger']], out: [0] },
    { cap: 'That was the one allowed cut: the rest stays together, dashes included.', mark: [[2, 7, 'accent2']], keep: true, out: [1] },
  ],
  result: '"a", "b-c-d"', resultCap: 'splitn(1, x) never cuts at all.',
}), 'jd("a-b-c-d".splitn(2, \'-\'))');

add('str/parse', 'parse', null, 'How str::parse works', 'Converts text into another type; returns a Result because it can fail.', {
  call: '"42".parse::<i32>(), "4x".parse::<i32>()', note: 'text → number', rows: [['"42"', '"4x"']], outs: ['Ok(42)', 'Err(..)'],
  intro: 'parse reads the text and tries to build the type you ask for, here i32.',
  steps: [
    ['"42" is a valid number: Ok(42).', 0, 'o0'],
    ['"4x" is not: Err, with a ParseIntError explaining why.', 1, { srcColor: 'danger', out: [1] }, 'invalid digit'],
  ],
  result: 'Ok(42), Err(ParseIntError { kind: InvalidDigit })', resultCap: 'Handle the Result: "42".parse::<i32>()? in a function, or .unwrap_or(0) for a default. Spaces are not allowed: trim first.',
}, 'format!("{:?}, {:?}", "42".parse::<i32>(), "4x".parse::<i32>())');

add('str/strip_prefix', 'strip_prefix', null, 'How str::strip_prefix works', 'Removes a prefix if it is there; returns None if it is not.', S({
  call: '"v1.2.3".strip_prefix(\'v\')', note: 'remove a known start', text: 'v1.2.3', outs: ['Some("1.2.3")'],
  intro: 'strip_prefix checks the start and returns the rest only when the prefix matches.',
  steps: [
    { cap: 'The string starts with \'v\': it is removed.', mark: [[0, 1, 'danger']] },
    { cap: 'The rest is returned: Some("1.2.3").', mark: [[1, 6, 'success']], keep: true, out: [0] },
  ],
  result: 'Some("1.2.3")', resultCap: 'If the prefix is missing you get None, so you know. trim_start_matches would silently do nothing (or remove several).',
}), 'd("v1.2.3".strip_prefix(\'v\'))');

add('str/get', 'get', null, 'How str::get works', 'Slices safely by byte range: None instead of a panic.', S({
  call: '"héllo".get(0..2)', note: 'byte range 0..2', text: 'héllo', idx: false, outs: ['None'],
  intro: 'Byte 2 is in the middle of é (bytes 1 and 2). Slicing there would cut a character in half.',
  steps: [
    { cap: 'Bytes 0..2 would be h plus half of é.', mark: [[0, 1, 'warning'], [1, 2, 'danger']], eq: 'not a character boundary' },
    { cap: '&s[0..2] would panic. get(0..2) returns None instead.', out: [0], keep: true },
  ],
  result: 'None', resultCap: 'get(0..3) is Some("hé"). When ranges come from char_indices, they always fall on boundaries.',
}), 'd("héllo".get(0..2))');

add('str/bytes', 'bytes', null, 'How str::bytes works', 'An iterator over the raw UTF-8 bytes of a string.', S({
  call: '"hé".bytes()', note: 'u8 values, not chars', text: 'hé', outs: ['104', '195', '169'],
  intro: 'bytes() yields the u8 values that store the string.',
  steps: [
    { cap: '\'h\' is stored as the byte 104.', mark: [[0, 1, 'warning']], out: [0] },
    { cap: '\'é\' takes two bytes: 195 and 169.', mark: [[1, 2, 'warning']], out: [1, 2], eq: '2 bytes for one char' },
  ],
  result: '104, 195, 169', resultCap: 'Use bytes() for ASCII data or byte-level work; chars() for text.',
}), 'j("hé".bytes())');

add('str/to_uppercase', 'to_uppercase', ALLOC, 'How str::to_uppercase works', 'A new String in upper case; the length can change.', S({
  call: '"straße".to_uppercase()', note: 'Unicode rules, not just a–z', text: 'straße', outs: ['"STRASSE"'],
  intro: 'to_uppercase converts each character using the Unicode rules.',
  steps: [
    { cap: 's, t, r, a become S, T, R, A.', mark: [[0, 4, 'warning']] },
    { cap: 'ß has no single upper-case letter: it becomes "SS", two letters.', mark: [[4, 5, 'danger']], eq: 'ß → SS' },
    { cap: 'e becomes E. The result has 7 letters, one more than before.', mark: [[5, 6, 'warning']], out: [0] },
  ],
  result: '"STRASSE"', resultCap: 'to_uppercase returns a new String. to_ascii_uppercase only changes a–z and keeps the length.',
}), 'd("straße".to_uppercase())');

add('str/to_lowercase', 'to_lowercase', ALLOC, 'How str::to_lowercase works', 'A new String in lower case.', S({
  call: '"HeLLo".to_lowercase()', note: 'a new String', text: 'HeLLo', outs: ['"hello"'],
  intro: 'to_lowercase converts every upper-case character.',
  steps: [
    { cap: 'H, L, L are upper case: they become h, l, l.', mark: [[0, 1, 'warning'], [2, 4, 'warning']] },
    { cap: 'e and o are already lower case and stay.', mark: [[1, 2, 'accent2'], [4, 5, 'accent2']], keep: true, out: [0] },
  ],
  result: '"hello"', resultCap: 'For case-insensitive comparisons of ASCII text, eq_ignore_ascii_case avoids making new Strings.',
}), 'd("HeLLo".to_lowercase())');

add('str/replace', 'replace', ALLOC, 'How str::replace works', 'A new String with every match of a pattern replaced.', S({
  call: '"a-b-c".replace(\'-\', "+")', note: 'every match, left to right', text: 'a-b-c', outs: ['"a+b+c"'],
  intro: 'replace copies the string, swapping each \'-\' for "+".',
  steps: [
    { cap: 'The first - becomes +.', mark: [[1, 2, 'warning']] },
    { cap: 'The second - too.', mark: [[3, 4, 'warning']], keep: true },
    { cap: 'The original string is unchanged; replace returns a new String.', out: [0], keep: true },
  ],
  result: '"a+b+c"', resultCap: 'replacen(pat, to, 1) replaces only the first match.',
}), 'd("a-b-c".replace(\'-\', "+"))');

add('str/repeat', 'repeat', ALLOC, 'How str::repeat works', 'A new String with the text repeated n times.', S({
  call: '"ab".repeat(3)', note: 'n copies in a row', text: 'ab', outs: ['"ababab"'],
  intro: 'repeat(3) copies "ab" three times into a new String.',
  steps: [
    { cap: '"ab" + "ab" + "ab".', mark: [[0, 2, 'warning']] },
    { cap: 'The result: "ababab".', out: [0], keep: true },
  ],
  result: '"ababab"', resultCap: 'Handy for drawing: "-".repeat(20) makes a line of 20 dashes.',
}), 'd("ab".repeat(3))');

module.exports = list;
