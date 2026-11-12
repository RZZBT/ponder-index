// Rust standard library: String, the owned and growable string (alloc::string).
const { group } = require('./kit.cjs');
const { list, add } = group({ at: ['alloc', 'String', /^src\/string\.rs$/] });
const S = (spec) => ({ kind: 'cells', ...spec });

add('string/from', 'from', null, 'How String::from works', 'Makes an owned, growable String from a string literal.', S({
  call: 'let s = String::from("hi");', note: '&str in, String out', text: 'hi', outs: ['String "hi"'],
  intro: '"hi" is a &str: fixed text stored in the program. String::from copies it into memory that s owns.',
  steps: [
    { cap: 'The characters are copied into a new buffer on the heap.', mark: [[0, 2, 'warning']] },
    { cap: 's owns that buffer: it can grow, change, and is freed when s goes out of scope.', out: [0], keep: true },
  ],
  result: '"hi"', resultCap: '"hi".to_string() and "hi".to_owned() do the same. Use &str to read text, String to own and change it.',
}), 'let s = String::from("hi"); d(s)');

add('string/push_str', 'push_str', null, 'How String::push_str works', 'Appends text to the end of the String.', S({
  call: 'let mut s = String::from("Hello"); s.push_str(", world");', note: 'the String grows', text: 'Hello, world', outs: ['"Hello, world"'],
  intro: 's holds "Hello". push_str adds ", world" after it.',
  steps: [
    { cap: '"Hello" is already there.', mark: [[0, 5, 'accent2']] },
    { cap: '", world" is copied to the end. If there is not enough room, the buffer grows first.', mark: [[5, 12, 'warning']], keep: true, out: [0] },
  ],
  result: '"Hello, world"', resultCap: 'push_str borrows its argument, so the text you append stays usable. s += ", world" does the same.',
}), 'let mut s = String::from("Hello"); s.push_str(", world"); d(s)');

add('string/push', 'push', null, 'How String::push works', 'Appends a single char.', S({
  call: 'let mut s = String::from("ab"); s.push(\'c\');', note: 'one character', text: 'abc', outs: ['"abc"'],
  intro: 'push takes a char (single quotes), not a string.',
  steps: [
    { cap: '"ab" is there.', mark: [[0, 2, 'accent2']] },
    { cap: "'c' is added at the end.", mark: [[2, 3, 'warning']], keep: true, out: [0] },
  ],
  result: '"abc"', resultCap: 'A char can take up to 4 bytes in the String; push encodes it as UTF-8.',
}), 'let mut s = String::from("ab"); s.push(\'c\'); d(s)');

add('string/pop', 'pop', null, 'How String::pop works', 'Removes and returns the last char.', S({
  call: 'let mut s = String::from("hé"); s.pop()', note: 'a whole character, not a byte', text: 'hé', outs: ["Some('é')"],
  intro: 'pop takes the last character off the end.',
  steps: [
    { cap: "'é' is the last character (2 bytes). Both bytes are removed together.", mark: [[1, 2, 'danger']], out: [0] },
    { cap: 's is now "h". An empty String would give None.', mark: [[0, 1, 'accent2']], keep: true },
  ],
  result: "Some('é')", resultCap: 'pop never splits a character, even when it takes several bytes.',
}), 'let mut s = String::from("hé"); d(s.pop())');

add('string/insert_str', 'insert_str', null, 'How String::insert_str works', 'Inserts text at a byte position; everything after it moves right.', S({
  call: 'let mut s = String::from("Hello!"); s.insert_str(5, " there");', note: 'insert at byte 5', text: 'Hello there!', outs: ['"Hello there!"'],
  intro: 'insert_str(5, ...) puts the text before byte 5, which is the !.',
  steps: [
    { cap: '"Hello" stays in front.', mark: [[0, 5, 'accent2']] },
    { cap: '" there" is inserted; the ! moves to the end.', mark: [[5, 11, 'warning'], [11, 12, 'accent2']], keep: true, out: [0] },
  ],
  result: '"Hello there!"', resultCap: 'The position is a byte index and must be on a character boundary, or it panics. insert(i, ch) inserts a single char.',
}), 'let mut s = String::from("Hello!"); s.insert_str(5, " there"); d(s)');

add('string/remove', 'remove', null, 'How String::remove works', 'Removes and returns the char at a byte position.', S({
  call: 'let mut s = String::from("abc"); s.remove(1)', note: 'removes \'b\'', text: 'abc', outs: ["'b'", '"ac"'],
  intro: 'remove(1) takes out the character that starts at byte 1.',
  steps: [
    { cap: "'b' is taken out and returned.", mark: [[1, 2, 'danger']], out: [0] },
    { cap: "'c' moves left to close the gap: s is \"ac\".", mark: [[0, 1, 'accent2'], [2, 3, 'accent2']], keep: true, out: [1] },
  ],
  result: "'b'", resultCap: 'Like Vec::remove, this shifts everything after the removed character.',
}), 'let mut s = String::from("abc"); let c = s.remove(1); d(c)');

add('string/truncate', 'truncate', null, 'How String::truncate works', 'Shortens the String to a byte length.', S({
  call: 'let mut s = String::from("hello"); s.truncate(2);', note: 'keep the first 2 bytes', text: 'hello', outs: ['"he"'],
  intro: 'truncate(2) keeps bytes 0 and 1 and drops the rest.',
  steps: [
    { cap: '"he" is kept.', mark: [[0, 2, 'success']] },
    { cap: '"llo" is dropped.', mark: [[2, 5, 'danger']], keep: true, out: [0] },
  ],
  result: '"he"', resultCap: 'The length is in bytes and must be on a character boundary, or it panics.',
}), 'let mut s = String::from("hello"); s.truncate(2); d(s)');

add('string/retain', 'retain', null, 'How String::retain works', 'Keeps only the characters for which the closure returns true.', S({
  call: 's.retain(|c| c != \' \');   // s = "a b c"', note: 'remove all spaces', text: 'a b c', outs: ['"abc"'],
  intro: 'retain checks every char and removes the ones that fail.',
  steps: [
    { cap: 'The spaces fail the test: removed.', mark: [[1, 2, 'danger'], [3, 4, 'danger']] },
    { cap: 'a, b and c pass and are kept, in order.', mark: [[0, 1, 'success'], [2, 3, 'success'], [4, 5, 'success']], keep: true, out: [0] },
  ],
  result: '"abc"', resultCap: 'retain changes the String in place; s.chars().filter(..).collect::<String>() would make a new one.',
}), 'let mut s = String::from("a b c"); s.retain(|c| c != \' \'); d(s)');

add('string/split_off', 'split_off', null, 'How String::split_off works', 'Cuts the String at a byte position and returns the second half.', S({
  call: 'let mut s = String::from("Hello, world"); let w = s.split_off(7);', note: 'everything from byte 7 on', text: 'Hello, world', outs: ['s: "Hello, "', 'w: "world"'],
  intro: 'split_off(7) moves the bytes from 7 to the end into a new String.',
  steps: [
    { cap: '"Hello, " stays in s.', mark: [[0, 7, 'accent2']], out: [0] },
    { cap: '"world" becomes the new String w.', mark: [[7, 12, 'warning']], keep: true, out: [1] },
  ],
  result: '"world"', resultCap: 'Both Strings are independent afterwards. The position must be on a character boundary.',
}), 'let mut s = String::from("Hello, world"); let w = s.split_off(7); d(w)');

add('string/clear', 'clear', null, 'How String::clear works', 'Empties the String but keeps its memory.', S({
  call: 'let mut s = String::from("abc"); s.clear();', note: 'length 0, capacity kept', text: 'abc', outs: ['""'],
  intro: 'clear removes all characters at once.',
  steps: [
    { cap: 'Everything is removed.', mark: [[0, 3, 'danger']] },
    { cap: 's is "", but its buffer is kept for new text.', out: [0], keep: true },
  ],
  result: '""', resultCap: 'Reusing one String with clear in a loop avoids allocating a new one each time.',
}), 'let mut s = String::from("abc"); s.clear(); d(s)');

add('string/as_str', 'as_str', null, 'How String::as_str works', 'Borrows the whole String as a &str.', S({
  call: 'let s = String::from("hi"); let r: &str = s.as_str();', note: 'no copy', text: 'hi', outs: ['&str "hi"'],
  intro: 'Many functions take &str. as_str lends out the String\'s text without copying it.',
  steps: [
    { cap: 'r points at the same bytes that s owns.', mark: [[0, 2, 'warning']] },
    { cap: 'While r is in use, s cannot be changed (it is borrowed).', out: [0], keep: true },
  ],
  result: '"hi"', resultCap: 'Usually you do not need it: &s turns a &String into &str automatically where a &str is expected.',
}), 'let s = String::from("hi"); d(s.as_str())');

add('string/from_utf8', 'from_utf8', null, 'How String::from_utf8 works', 'Turns bytes into a String if they are valid UTF-8.', {
  call: 'String::from_utf8(vec![104, 105])', note: 'checks the bytes first', rows: [['104', '105'], ['255']], outs: ['Ok("hi")', 'Err(..)'],
  intro: 'from_utf8 takes a Vec<u8> and checks that it is valid UTF-8 text.',
  steps: [
    ['104 is h and 105 is i: valid, so Ok("hi"). No copy is made.', ['a0', 'a1'], 'o0'],
    ['A lone 255 is never valid UTF-8: Err, and you get your bytes back from the error.', ['b0'], { srcColor: 'danger', out: [1] }],
  ],
  result: 'Ok("hi")', resultCap: 'String::from_utf8_lossy replaces invalid bytes with � instead of failing.',
}, 'd(String::from_utf8(vec![104, 105]))');

module.exports = list;
