// heck (#91-95), textwrap (#96-99), semver (#100-102), base64 (#103-104), hex (#105-106), url (#107-110),
// unicode-segmentation (#111-113). Exported per crate; the small per-crate modules re-export them.
const { Scene, pick, cells, lines } = require('./scene.cjs');
const R = String.raw;
const mk = () => { const A = []; A.add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim }); return A; };

// ---------------- heck
const heck = mk();
const caseAnim = ({ call, note, text, words, wordMarks, outs, join, intro, result, resultCap }) => () => { const isJoin = (o) => o === join || (join === ' ' && o === '␣'); return cells({
  call, note, text, outs, intro,
  steps: [
    { cap: `First heck splits the text into words. ${words}`, mark: wordMarks },
    { cap: `Each word gets the new capitalisation: ${outs.filter((o) => !isJoin(o)).join(', ')}.`, mark: wordMarks, out: outs.map((o, j) => (isJoin(o) ? -1 : j)).filter((j) => j >= 0) },
    { cap: join === ' ' ? 'The words are joined with a space.' : join ? `The words are joined with "${join}".` : 'The words are joined with nothing in between.', mark: wordMarks, out: outs.map((_, j) => j) },
  ],
  result, resultCap,
}); };
heck.add('to-snake-case', 'How to_snake_case() works', 'Rewrites an identifier as lower_case words joined by underscores.', caseAnim({
  call: '"HelloWorld".to_snake_case()', note: 'use heck::ToSnakeCase;', text: 'HelloWorld', words: 'A capital letter after a lowercase letter starts a new word: Hello | World.',
  wordMarks: [[0, 5, 'warning'], [5, 10, 'accent2']], outs: ['hello', '_', 'world'], join: '_',
  intro: 'to_snake_case() comes from the ToSnakeCase trait. It works the same whatever style the input is in.',
  result: '"hello_world"', resultCap: '"HelloWorld".to_snake_case() is "hello_world". "hello-world" and "Hello World" give the same result.',
}), '"HelloWorld".to_snake_case()', 'hello_world', '"hello_world"');
heck.add('to-kebab-case', 'How to_kebab_case() works', 'Rewrites an identifier as lower-case words joined by hyphens.', caseAnim({
  call: '"HelloWorld".to_kebab_case()', note: 'use heck::ToKebabCase;', text: 'HelloWorld', words: 'The capital W starts a second word: Hello | World.',
  wordMarks: [[0, 5, 'warning'], [5, 10, 'accent2']], outs: ['hello', '-', 'world'], join: '-',
  intro: 'to_kebab_case() finds the same words as to_snake_case(); only the separator differs.',
  result: '"hello-world"', resultCap: '"HelloWorld".to_kebab_case() is "hello-world", the style of CSS properties and URL slugs.',
}), '"HelloWorld".to_kebab_case()', 'hello-world', '"hello-world"');
heck.add('to-upper-camel-case', 'How to_upper_camel_case() works', 'Rewrites an identifier as capitalised words with no separator.', caseAnim({
  call: '"hello_world".to_upper_camel_case()', note: 'use heck::ToUpperCamelCase;', text: 'hello_world', words: 'The underscore separates them and is dropped: hello | world.',
  wordMarks: [[0, 5, 'warning'], [5, 6, 'danger'], [6, 11, 'accent2']], outs: ['Hello', 'World'], join: '',
  intro: 'to_upper_camel_case() (also called PascalCase) is the style of Rust type names.',
  result: '"HelloWorld"', resultCap: '"hello_world".to_upper_camel_case() is "HelloWorld". to_lower_camel_case() would give "helloWorld".',
}), '"hello_world".to_upper_camel_case()', 'HelloWorld', '"HelloWorld"');
heck.add('to-shouty-snake-case', 'How to_shouty_snake_case() works', 'Rewrites an identifier as UPPER_CASE words joined by underscores.', caseAnim({
  call: '"helloWorld".to_shouty_snake_case()', note: 'use heck::ToShoutySnakeCase;', text: 'helloWorld', words: 'The capital W starts a second word: hello | World.',
  wordMarks: [[0, 5, 'warning'], [5, 10, 'accent2']], outs: ['HELLO', '_', 'WORLD'], join: '_',
  intro: 'to_shouty_snake_case() is the style of Rust constants and statics.',
  result: '"HELLO_WORLD"', resultCap: '"helloWorld".to_shouty_snake_case() is "HELLO_WORLD", as in const HELLO_WORLD: u32 = 1;',
}), '"helloWorld".to_shouty_snake_case()', 'HELLO_WORLD', '"HELLO_WORLD"');
heck.add('to-title-case', 'How to_title_case() works', 'Rewrites an identifier as capitalised words separated by spaces.', caseAnim({
  call: '"hello_world".to_title_case()', note: 'use heck::ToTitleCase;', text: 'hello_world', words: 'The underscore separates them: hello | world.',
  wordMarks: [[0, 5, 'warning'], [5, 6, 'danger'], [6, 11, 'accent2']], outs: ['Hello', '␣', 'World'], join: ' ',
  intro: 'to_title_case() turns code names into text for people, for example labels in a user interface.',
  result: '"Hello World"', resultCap: '"hello_world".to_title_case() is "Hello World". Every word is capitalised, including short ones like "of".',
}), '"hello_world".to_title_case()', 'Hello World', '"Hello World"');

// ---------------- textwrap
const textwrap = mk();
textwrap.add('wrap', 'How textwrap::wrap() works', 'Breaks text into lines no wider than a given width, at spaces.', () => cells({
  call: 'textwrap::wrap("The quick brown fox", 10)', note: 'each line at most 10 columns wide', text: 'The quick brown fox', outs: ['"The quick"', '"brown fox"'],
  intro: 'wrap() takes words one by one and puts as many as fit on each line.',
  steps: [
    { cap: '"The" fits (3 columns). "The quick" is 9 columns: still ≤ 10.', mark: [[0, 9, 'success']], eq: '"The quick" = 9' },
    { cap: 'Adding " brown" would make 15 columns, more than 10, so the line ends before "brown".', mark: [[0, 9, 'success'], [9, 15, 'danger']], out: [0], eq: '15 > 10 → new line' },
    { cap: '"brown fox" is 9 columns and fits on the second line. The space at the break is not kept.', mark: [[10, 19, 'success']], out: [1], eq: '"brown fox" = 9' },
  ],
  result: '["The quick", "brown fox"]', resultCap: 'wrap() returns a Vec of lines (Cow<str>). A word longer than the width is broken by default; Options can change that.',
}), 'd(textwrap::wrap("The quick brown fox", 10))', '["The quick", "brown fox"]');
textwrap.add('fill', 'How textwrap::fill() works', 'Wraps text and joins the lines into one String with newlines.', () => pick({
  call: 'textwrap::fill("The quick brown fox", 10)', note: 'wrap(), then join the lines with "\\n"', rows: [['"The quick"', '"brown fox"']], outs: [R`"The quick\nbrown fox"`],
  intro: 'fill() does exactly what wrap() does, then glues the lines back together.',
  steps: [
    { cap: 'wrap() with width 10 gives two lines.', src: ['a0', 'a1'] },
    { cap: R`They are joined with a newline, "\n", between them. There is no newline after the last line.`, out: [0], eq: R`"The quick" + "\n" + "brown fox"` },
    { cap: 'Printed, the String shows on two lines, each at most 10 columns wide.', eq: 'The quick / brown fox' },
  ],
  result: R`"The quick\nbrown fox"`, resultCap: 'Use fill() for printing, and wrap() when you need the lines separately, for example to draw them.',
}), 'd(textwrap::fill("The quick brown fox", 10))', R`"The quick\nbrown fox"`);
textwrap.add('indent', 'How textwrap::indent() works', 'Puts a prefix in front of every line.', () => lines({
  call: R`textwrap::indent("a\nb\n", "> ")`, note: 'the prefix goes before each non-empty line',
  lines: ['line 1: "a"  →  "> a"', 'line 2: "b"  →  "> b"', 'the final newline stays', R`"> a\n> b\n"`],
  intro: 'indent() walks the text line by line and adds the prefix at the start of each line.',
  steps: [
    { cap: 'The first line, "a", becomes "> a".', show: [0] },
    { cap: 'The second line, "b", becomes "> b".', show: [1] },
    { cap: 'The text ends with a newline, and so does the result. Empty lines would stay empty (no trailing spaces are added).', show: [2] },
    { cap: 'Joined back together, the result is the quoted reply style used in emails.', show: [3] },
  ],
  result: R`"> a\n> b\n"`, resultCap: R`indent("a\nb\n", "> ") returns "> a\n> b\n". dedent() goes the other way, removing common indentation.`,
}), R`d(textwrap::indent("a\nb\n", "> "))`, R`"> a\n> b\n"`);
textwrap.add('dedent', 'How textwrap::dedent() works', 'Removes the leading whitespace that all lines have in common.', () => lines({
  call: R`textwrap::dedent("  a\n    b")`, note: '· marks a space', size: 30,
  lines: ['··a', '····b', 'common indentation: 2 spaces', 'a', '··b'],
  intro: 'dedent() finds the indentation that every non-empty line shares and removes only that much.',
  steps: [
    { cap: 'The first line starts with 2 spaces, the second with 4.', show: [0, 1] },
    { cap: 'The smallest indentation is 2 spaces: that is what all lines have in common.', show: [2] },
    { cap: '2 spaces are removed from every line. The second line keeps its extra 2 spaces, so the shape of the text stays.', show: [3, 4] },
  ],
  result: R`"a\n  b"`, resultCap: R`dedent("  a\n    b") returns "a\n  b". Useful for indented string literals in code. Lines with only whitespace are ignored when finding the common prefix.`,
}), R`d(textwrap::dedent("  a\n    b"))`, R`"a\n  b"`);

// ---------------- semver
const semver = mk();
semver.add('version-parse', 'How Version::parse() works', 'Reads a version number into its parts.', () => cells({
  call: 'Version::parse("1.2.3-beta.1")', note: 'MAJOR.MINOR.PATCH-PRE', text: '1.2.3-beta.1', outs: ['major 1', 'minor 2', 'patch 3', 'pre beta.1'],
  intro: 'A semantic version has three numbers. Anything after a - marks a pre-release.',
  steps: [
    { cap: 'The first number is major: changes that break existing users.', mark: [[0, 1, 'warning']], out: [0] },
    { cap: 'minor: new features that stay compatible.', mark: [[2, 3, 'warning']], out: [1] },
    { cap: 'patch: bug fixes only.', mark: [[4, 5, 'warning']], out: [2] },
    { cap: 'After the -, "beta.1" is the pre-release: a version before 1.2.3 itself. 1.2.3-beta.1 < 1.2.3.', mark: [[6, 12, 'accent2']], out: [3] },
  ],
  result: 'major 1, minor 2, patch 3, pre beta.1', resultCap: 'Version::parse() returns Ok(Version). "1.2" (missing patch) or "v1.2.3" are errors: the format is strict.',
}), 'let v = semver::Version::parse("1.2.3-beta.1").unwrap(); format!("major {}, minor {}, patch {}, pre {}", v.major, v.minor, v.patch, v.pre)', 'major 1, minor 2, patch 3, pre beta.1');
semver.add('req-parse', 'How VersionReq::parse() works', 'Reads a version requirement such as "^1.2".', () => lines({
  call: 'VersionReq::parse("^1.2")', note: 'a caret allows changes that keep compatibility',
  lines: ['^1.2 = "compatible with 1.2"', 'lowest allowed: 1.2.0  →  >=1.2.0', 'major must stay 1  →  <2.0.0', '1.2.0 true, 1.9.9 true, 1.1.9 false, 2.0.0 false'],
  intro: 'VersionReq::parse() reads the requirement syntax Cargo uses in Cargo.toml. A plain "1.2" there means the same as "^1.2".',
  steps: [
    { cap: '^ means: any version that should be compatible with 1.2.', show: [0] },
    { cap: 'The missing patch number counts as 0, so the lowest version is 1.2.0.', show: [1] },
    { cap: 'A new major version may break things, so 2.0.0 and above are excluded.', show: [2] },
    { cap: 'So ^1.2 is the range >=1.2.0, <2.0.0. Testing the edges confirms it.', show: [3] },
  ],
  result: '>=1.2.0, <2.0.0', resultCap: 'For 0.x versions the caret is stricter: ^0.2 means >=0.2.0, <0.3.0, because in 0.x the minor number signals breaking changes.',
}), 'let r = semver::VersionReq::parse("^1.2").unwrap(); let m = |s: &str| r.matches(&semver::Version::parse(s).unwrap()); format!("1.2.0 {}, 1.9.9 {}, 1.1.9 {}, 2.0.0 {}", m("1.2.0"), m("1.9.9"), m("1.1.9"), m("2.0.0"))', '1.2.0 true, 1.9.9 true, 1.1.9 false, 2.0.0 false');
semver.add('req-matches', 'How VersionReq::matches() works', 'Tests whether a version satisfies a requirement.', () => pick({
  call: 'req.matches(&version)', note: 'req = VersionReq::parse("^1.2") = >=1.2.0, <2.0.0', rows: [['1.5.0', '2.0.0', '1.3.0-alpha']],
  intro: 'matches() checks a Version against every part of the requirement.',
  steps: [
    { cap: '1.5.0 is at least 1.2.0 and below 2.0.0: true.', src: ['a0'], mark: { success: ['a0'] }, eq: '1.5.0 → true' },
    { cap: '2.0.0 is not below 2.0.0: false.', src: ['a1'], srcColor: 'danger', eq: '2.0.0 → false' },
    { cap: '1.3.0-alpha is inside the range by number, but it is a pre-release. A requirement only matches pre-releases when it names one itself, like ^1.3.0-alpha.', src: ['a2'], srcColor: 'danger', eq: '1.3.0-alpha → false' },
  ],
  result: '1.5.0 → true, 2.0.0 → false, 1.3.0-alpha → false', resultCap: 'Pre-releases are opt-in, so cargo update never moves you onto an alpha by accident.',
}), 'let r = semver::VersionReq::parse("^1.2").unwrap(); let m = |s: &str| r.matches(&semver::Version::parse(s).unwrap()); format!("1.5.0 → {}, 2.0.0 → {}, 1.3.0-alpha → {}", m("1.5.0"), m("2.0.0"), m("1.3.0-alpha"))', '1.5.0 → true, 2.0.0 → false, 1.3.0-alpha → false');

// ---------------- base64
const base64 = mk();
base64.add('encode', 'How Engine::encode() works', 'Turns bytes into Base64 text: every 3 bytes become 4 characters.', () => pick({
  call: 'STANDARD.encode(b"hello")', note: 'use base64::{Engine as _, engine::general_purpose::STANDARD};', rows: [['h', 'e', 'l', 'l', 'o']], outs: ['a', 'G', 'V', 's', 'b', 'G', '8', '='],
  intro: 'Base64 uses 64 safe characters (A–Z, a–z, 0–9, +, /), so each character carries 6 bits. 3 bytes = 24 bits = 4 characters.',
  steps: [
    { cap: '"hel" is 3 bytes = 24 bits. Cut into 4 groups of 6 bits they are 26, 6, 21, 44, which are the characters a, G, V, s.', src: ['a0', 'a1', 'a2'], out: [0, 1, 2, 3], eq: '01101000 01100101 01101100 → 26 6 21 44' },
    { cap: '"lo" is only 2 bytes = 16 bits. Two zero bits fill up the last group: 27, 6, 60 → b, G, 8.', src: ['a3', 'a4'], out: [4, 5, 6], eq: '16 bits + 00 → 27 6 60' },
    { cap: 'Output always comes in blocks of 4 characters, so one = pads the last block. It tells the decoder that one byte was missing.', out: [7], eq: '= padding' },
  ],
  result: '"aGVsbG8="', resultCap: 'STANDARD.encode(b"hello") is "aGVsbG8=". Base64 text is about 4/3 the size of the data. URL_SAFE uses - and _ instead of + and /.',
}), 'base64::engine::general_purpose::STANDARD.encode(b"hello")', 'aGVsbG8=', '"aGVsbG8="');
base64.add('decode', 'How Engine::decode() works', 'Turns Base64 text back into bytes; invalid characters are an error.', () => pick({
  call: 'STANDARD.decode("aGVsbG8=")', note: 'every 4 characters become 3 bytes', rows: [['aGVs', 'bG8=']], outs: ['104 h', '101 e', '108 l', '108 l', '111 o'],
  intro: 'decode() reverses encode(): each character is looked up to get its 6 bits, and the bits are cut back into bytes.',
  steps: [
    { cap: '"aGVs" is 4 × 6 = 24 bits = 3 bytes: 104, 101, 108, which is "hel".', src: ['a0'], out: [0, 1, 2] },
    { cap: '"bG8=" has one = of padding, so it holds only 2 bytes: 108, 111 = "lo".', src: ['a1'], out: [3, 4] },
    { cap: 'Text with a character outside the Base64 alphabet, like "a@", cannot be decoded: Err(InvalidByte(1, 64)), the @ at offset 1.', eq: 'decode("a@") → Err(InvalidByte(1, 64))' },
  ],
  result: 'Ok([104, 101, 108, 108, 111]) / Err(InvalidByte(1, 64))', resultCap: 'decode() returns a Vec<u8>; here the bytes of "hello". Use String::from_utf8 if you know the bytes are text.',
}), 'let e = base64::engine::general_purpose::STANDARD; let bad = match e.decode("a@") { Err(base64::DecodeError::InvalidByte(i, b)) => format!("Err(InvalidByte({}, {}))", i, b), other => format!("{:?}", other) }; format!("{:?} / {}", e.decode("aGVsbG8="), bad)', 'Ok([104, 101, 108, 108, 111]) / Err(InvalidByte(1, 64))');

// ---------------- hex
const hex = mk();
hex.add('encode', 'How hex::encode() works', 'Writes each byte as two hexadecimal digits.', () => pick({
  call: 'hex::encode("Hi")', note: 'one byte (0–255) = two hex digits (00–ff)', rows: [['H = 72', 'i = 105']], outs: ['4', '8', '6', '9'],
  intro: 'hex::encode() takes bytes, here the bytes of the text "Hi", and writes each as base 16.',
  steps: [
    { cap: '"H" is the byte 72. 72 = 4 × 16 + 8, so it is written 48.', src: ['a0'], out: [0, 1], eq: '72 = 4 × 16 + 8 → 48' },
    { cap: '"i" is 105 = 6 × 16 + 9: 69.', src: ['a1'], out: [2, 3], eq: '105 = 6 × 16 + 9 → 69' },
    { cap: 'Every byte always takes exactly two digits, so the text is twice as long as the data. Small bytes get a leading 0: 10 → "0a".', eq: '2 bytes → 4 digits' },
  ],
  result: '"4869"', resultCap: 'hex::encode("Hi") is "4869", in lowercase. encode_upper() gives uppercase letters.',
}), 'hex::encode("Hi")', '4869', '"4869"');
hex.add('decode', 'How hex::decode() works', 'Reads pairs of hex digits back into bytes; an odd number of digits is an error.', () => pick({
  call: 'hex::decode("4869")', note: 'every two digits make one byte', rows: [['4', '8', '6', '9']], outs: ['0x48 = 72', '0x69 = 105'],
  intro: 'decode() reads the text two characters at a time.',
  steps: [
    { cap: '"48" is 4 × 16 + 8 = 72.', src: ['a0', 'a1'], out: [0] },
    { cap: '"69" is 6 × 16 + 9 = 105.', src: ['a2', 'a3'], out: [1] },
    { cap: '"486" has 3 digits. The last digit has no partner, so it cannot be a byte: Err(OddLength).', eq: 'decode("486") → Err(OddLength)' },
  ],
  result: 'Ok([72, 105]) / Err(OddLength)', resultCap: 'decode() returns Result<Vec<u8>, FromHexError>; [72, 105] is "Hi". A character like "g" gives Err(InvalidHexCharacter).',
}), 'format!("{:?} / {:?}", hex::decode("4869"), hex::decode("486"))', 'Ok([72, 105]) / Err(OddLength)');

// ---------------- url
const url = mk();
url.add('parse', 'How Url::parse() works', 'Reads a URL and splits it into its parts.', () => pick({
  call: 'Url::parse("https://example.com/a/b?x=1#top")', note: 'scheme://host/path?query#fragment', rows: [['https', '://', 'example.com', '/a/b', '?x=1', '#top']], rowFills: ['surface'],
  outs: ['scheme https', 'host example.com', 'path /a/b', 'query x=1', 'fragment top'],
  intro: 'Url::parse() follows the WHATWG URL standard, the same rules a browser uses.',
  steps: [
    { cap: 'The scheme comes before ://. It says how to fetch the resource.', src: ['a0'], out: [0] },
    { cap: 'The host is the server name. It is lowercased and checked.', src: ['a2'], out: [1] },
    { cap: 'The path is the part from the first / up to ? or #.', src: ['a3'], out: [2] },
    { cap: 'The query comes after ? and the fragment after #. The getters return them without those marks.', src: ['a4', 'a5'], out: [3, 4] },
  ],
  result: 'scheme https, host example.com, path /a/b, query x=1, fragment top', resultCap: 'url.scheme(), host_str(), path(), query() and fragment() return these parts. A relative URL like "/a/b" alone is an error: use join() for those.',
}), 'let u = url::Url::parse("https://example.com/a/b?x=1#top").unwrap(); format!("scheme {}, host {}, path {}, query {}, fragment {}", u.scheme(), u.host_str().unwrap(), u.path(), u.query().unwrap(), u.fragment().unwrap())', 'scheme https, host example.com, path /a/b, query x=1, fragment top');
url.add('join', 'How Url::join() works', 'Resolves a relative link against a base URL, like a browser does.', () => lines({
  call: 'base.join("c")  and  base.join("/c")', note: 'base = https://example.com/a/b',
  lines: ['"c": relative to the folder of the base, /a/', '→ https://example.com/a/c', '"/c": starts with /, relative to the host', '→ https://example.com/c'],
  intro: 'join() treats its argument like a link inside the page at base.',
  steps: [
    { cap: 'The last segment of the base, "b", is the "file"; "c" replaces it.', show: [0] },
    { cap: 'So "c" becomes https://example.com/a/c.', show: [1] },
    { cap: 'A link starting with / replaces the whole path.', show: [2] },
    { cap: 'So "/c" becomes https://example.com/c. "../c" would go one folder up, and a full URL would replace everything.', show: [3] },
  ],
  result: 'https://example.com/a/c / https://example.com/c', resultCap: 'If base ends with a slash (…/a/b/), "c" gives …/a/b/c. That trailing slash is a common surprise.',
}), 'let b = url::Url::parse("https://example.com/a/b").unwrap(); format!("{} / {}", b.join("c").unwrap(), b.join("/c").unwrap())', 'https://example.com/a/c / https://example.com/c');
url.add('query-pairs', 'How Url::query_pairs() works', 'Splits the query into decoded (key, value) pairs.', () => cells({
  call: 'url.query_pairs()', note: 'url = https://example.com/?x=1&y=two', text: 'x=1&y=two', outs: ['("x", "1")', '("y", "two")'],
  intro: 'query_pairs() splits the query at & into pairs, and each pair at = into a key and a value.',
  steps: [
    { cap: 'The first pair is x=1: key "x", value "1".', mark: [[0, 1, 'warning'], [2, 3, 'accent2']], out: [0] },
    { cap: '& separates the pairs.', mark: [[3, 4, 'danger']] },
    { cap: 'The second pair is y=two. Escapes are decoded: %20 or + would become a space.', mark: [[4, 5, 'warning'], [6, 9, 'accent2']], out: [1] },
  ],
  result: '("x", "1"), ("y", "two")', resultCap: 'Values are strings (Cow<str>): parse "1" yourself to get a number. query_pairs_mut() builds a query with the right escaping.',
}), 'let u = url::Url::parse("https://example.com/?x=1&y=two").unwrap(); jd(u.query_pairs())', '("x", "1"), ("y", "two")');
url.add('path-segments', 'How Url::path_segments() works', 'Splits the path into its pieces between slashes.', () => cells({
  call: 'url.path_segments()', note: 'url = https://example.com/a/b/c', text: '/a/b/c', outs: ['"a"', '"b"', '"c"'],
  intro: 'path_segments() splits the path at every /. The leading / is skipped.',
  steps: [
    { cap: 'First segment: "a".', mark: [[0, 1, 'danger'], [1, 2, 'success']], out: [0] },
    { cap: 'Second: "b".', mark: [[2, 3, 'danger'], [3, 4, 'success']], out: [1] },
    { cap: 'Third: "c". A trailing slash (/a/b/c/) would add an empty segment "".', mark: [[4, 5, 'danger'], [5, 6, 'success']], out: [2] },
  ],
  result: 'a, b, c', resultCap: 'path_segments() returns Option: None for URLs like mailto:x@y.com that cannot have a path with slashes.',
}), 'let u = url::Url::parse("https://example.com/a/b/c").unwrap(); j(u.path_segments().unwrap())', 'a, b, c');

// ---------------- unicode-segmentation
const unicode = mk();
unicode.add('graphemes', 'How graphemes() works', 'Splits text into the characters a user sees, not Rust chars or bytes.', () => {
  const sc = new Scene('"👍🏽".graphemes(true).count()', 'use unicode_segmentation::UnicodeSegmentation;');
  sc.box('g', '👍🏽  1 grapheme', 500, 200, { fill: 'success', w: 260 });
  sc.row('c', ['U+1F44D 👍', 'U+1F3FD 🏽'], 300, { fill: 'accent2', visible: false });
  sc.row('b', ['F0', '9F', '91', '8D', 'F0', '9F', '8F', 'BD'], 400, { fill: 'surface', visible: false });
  sc.text('eq', '', 500, 490, { size: 26, fill: 'warning' });
  sc.intro('A user sees one thumbs-up with a skin tone. graphemes(true) finds that "user-perceived character" (an extended grapheme cluster).');
  sc.step('Rust\'s chars() sees 2 chars: the thumbs-up and a skin-tone modifier.', [sc.show(['c0', 'c1']), sc.say('eq', 'chars().count() = 2')]);
  sc.step('As UTF-8, each of those chars takes 4 bytes: 8 bytes in total, which is what str::len() counts.', [sc.show(['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']), sc.say('eq', 'len() = 8')]);
  sc.step('The Unicode rules say a modifier belongs to the character before it, so graphemes() keeps both chars together.', [sc.hi(['g'], 'warning'), sc.say('eq', 'graphemes(true).count() = 1')]);
  sc.result('1 grapheme, 2 chars, 8 bytes', 'Use graphemes() to reverse, truncate or count text that users see; chars() can cut an emoji in half.', [sc.hi(['g'], 'success'), sc.say('eq', '')]);
  return sc.build();
}, 'let s = "👍🏽"; format!("{} grapheme, {} chars, {} bytes", s.graphemes(true).count(), s.chars().count(), s.len())', '1 grapheme, 2 chars, 8 bytes');
unicode.add('unicode-words', 'How unicode_words() works', 'Splits text into words, leaving out spaces and punctuation.', () => cells({
  call: `"Hello, world! It's".unicode_words()`, note: 'word boundaries from the Unicode rules (UAX #29)', text: "Hello, world! It's", outs: ['"Hello"', '"world"', `"It's"`],
  intro: 'unicode_words() finds word boundaries and keeps only the pieces that contain letters or numbers.',
  steps: [
    { cap: '"Hello" is a word. The comma and space after it are dropped.', mark: [[0, 5, 'success'], [5, 7, 'danger']], out: [0] },
    { cap: '"world" is a word; "! " is dropped.', mark: [[7, 12, 'success'], [12, 14, 'danger']], out: [1] },
    { cap: `The apostrophe between letters does not break a word, so "It's" stays whole.`, mark: [[14, 18, 'success']], out: [2] },
  ],
  result: `"Hello", "world", "It's"`, resultCap: `Splitting on spaces would give "Hello," and "world!" with punctuation attached.`,
}), `jd("Hello, world! It's".unicode_words())`, `"Hello", "world", "It's"`);
unicode.add('split-word-bounds', 'How split_word_bounds() works', 'Splits text at every word boundary and keeps every piece.', () => cells({
  call: '"Hi, you".split_word_bounds()', note: 'nothing is dropped: words, punctuation and spaces', text: 'Hi, you', outs: ['"Hi"', '","', '" "', '"you"'],
  intro: 'split_word_bounds() uses the same boundaries as unicode_words(), but returns everything between them.',
  steps: [
    { cap: '"Hi" is the first piece.', mark: [[0, 2, 'success']], out: [0] },
    { cap: 'The comma is a piece of its own.', mark: [[2, 3, 'warning']], out: [1] },
    { cap: 'The space is a piece too.', mark: [[3, 4, 'muted']], out: [2] },
    { cap: '"you" is the last piece. Joining all pieces gives back the original text.', mark: [[4, 7, 'success']], out: [3] },
  ],
  result: '"Hi", ",", " ", "you"', resultCap: 'Useful for editors and tokenizers: you can change words and keep the punctuation and spacing exactly.',
}), 'jd("Hi, you".split_word_bounds())', '"Hi", ",", " ", "you"');

module.exports = { heck, textwrap, semver, base64, hex, url, unicode };
