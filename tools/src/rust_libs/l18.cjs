// nom 8 (parser combinators: bytes, character, combinator, sequence, branch, multi), hashing with the digest traits
// (SHA-256 from sha2, MD5 from md-5), crc32fast, and the rest of base64 and hex.
const { group } = require('../rust_std/kit.cjs');
const NO = (file, o = '') => ['nom', o, new RegExp(`src[/]${file}[.]rs$`)];
const BC = NO('bytes/complete');
const CC = NO('character/complete');
const CO = NO('combinator/mod');
const SE = NO('sequence/mod');
const MU = NO('multi/mod');
const DG = ['digest', 'D', /src[/]digest[.]rs$/];
const { list, add } = group({ at: BC });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const U = 'use nom::{IResult, Parser}; use nom::bytes::complete::*; use nom::character::complete::*; use nom::combinator::*; use nom::sequence::*; use nom::multi::*; use nom::branch::alt; ';
const R = (ty, e) => `let r: IResult<&str, ${ty}> = ${e}; d(r)`;

// ---------------------------------------------------------------- bytes / character

add('nom/tag', 'tag', null, 'How nom::bytes::complete::tag works', 'Matches an exact piece of text at the start of the input.', {
  rows: [['"GET /index"']], call: 'tag("GET")(input)', note: 'IResult<rest, matched>', outs: ['Ok((" /index", "GET"))'],
  intro: 'Every nom parser takes the input and returns Ok((what is left, what it parsed)) or an error.',
  steps: [['"GET" is at the start: it is consumed.', 0], ['The rest of the input comes back first.', [], 'o0']],
  result: 'Ok((" /index", "GET"))', resultCap: 'If the text does not start with "GET", the result is Err(Error(.., Tag)).',
}, U + R('&str', 'tag("GET")("GET /index")'));
add('nom/take-while1', 'take_while1', null, 'How nom::bytes::complete::take_while1 works', 'Takes the longest prefix whose characters pass a test (at least one).', one('take_while1(|c: char| c.is_ascii_digit())(input)', '"123abc"', 'Ok(("abc", "123"))', 'scan a run', 'take_while (no 1) accepts an empty match.', 'Take digits.', 'Stop at "a".', 'Ok(("abc", "123"))', 'An empty run is an error here.'), U + R('&str', 'take_while1(|c: char| c.is_ascii_digit())("123abc")'));
add('nom/take', 'take', null, 'How nom::bytes::complete::take works', 'Takes exactly n characters.', one('take(3usize)(input)', '"abcdef"', 'Ok(("def", "abc"))', 'fixed width', 'Fails if the input is shorter.', 'Take 3.', 'The rest remains.', 'Ok(("def", "abc"))', 'For bytes it counts bytes.'), U + R('&str', 'take(3usize)("abcdef")'));
add('nom/take-until', 'take_until', null, 'How nom::bytes::complete::take_until works', 'Takes everything up to (not including) a pattern.', one('take_until(";")(input)', '"key=1;rest"', 'Ok((";rest", "key=1"))', 'up to a delimiter', 'Fails if the pattern never appears.', 'Search for ";".', 'Return what is before it.', 'Ok((";rest", "key=1"))', 'The delimiter stays in the input.'), U + R('&str', 'take_until(";")("key=1;rest")'));
add('nom/tag-no-case', 'tag_no_case', null, 'How nom::bytes::complete::tag_no_case works', 'Like tag, ignoring letter case.', one('tag_no_case("select")(input)', '"SELECT *"', 'Ok((" *", "SELECT"))', 'case-insensitive keywords', 'Returns the text as written in the input.', 'Compare ignoring case.', 'Match.', 'Ok((" *", "SELECT"))', 'Useful for SQL or HTTP headers.'), U + R('&str', 'tag_no_case("select")("SELECT *")'));
add('nom/digit1', 'digit1', CC, 'How nom::character::complete::digit1 works', 'One or more ASCII digits.', one('digit1(input)', '"42px"', 'Ok(("px", "42"))', 'numbers as text', 'Combine with map_res to get a number.', 'Take digits.', 'Stop at "p".', 'Ok(("px", "42"))', 'digit0 also accepts none.'), U + R('&str', 'digit1("42px")'));
add('nom/alpha1', 'alpha1', CC, 'How nom::character::complete::alpha1 works', 'One or more ASCII letters.', one('alpha1(input)', '"abc123"', 'Ok(("123", "abc"))', 'words', 'alphanumeric1 also allows digits.', 'Take letters.', 'Stop at the digit.', 'Ok(("123", "abc"))', 'An empty match is an error.'), U + R('&str', 'alpha1("abc123")'));
add('nom/char', 'char', CC, 'How nom::character::complete::char works', 'Matches one specific character.', one('char(\'(\')(input)', '"(x)"', "Ok((\"x)\", '('))", 'punctuation', 'Returns the char itself.', 'Is it "("?', 'Consume it.', "Ok((\"x)\", '('))", 'one_of matches any of several.'), U + R('char', "char('(')(\"(x)\")"));
add('nom/multispace0', 'multispace0', CC, 'How nom::character::complete::multispace0 works', 'Zero or more spaces, tabs and line breaks.', one('multispace0(input)', '"  \\n x"', 'Ok(("x", "  \\n "))', 'skip whitespace', 'Never fails: zero whitespace is fine.', 'Take whitespace.', 'Stop at "x".', 'Ok(("x", "  \\n "))', 'space0 skips only spaces and tabs.'), U + R('&str', 'multispace0("  \\n x")'));
add('nom/one-of', 'one_of', CC, 'How nom::character::complete::one_of works', 'Matches one character from a set.', one('one_of("+-")(input)', '"-5"', "Ok((\"5\", '-'))", 'choice of chars', 'none_of matches anything except them.', 'Is it + or -?', 'Consume it.', "Ok((\"5\", '-'))", 'Handy for signs and operators.'), U + R('char', 'one_of("+-")("-5")'));
add('nom/alphanumeric1', 'alphanumeric1', CC, 'How nom::character::complete::alphanumeric1 works', 'One or more ASCII letters or digits.', one('alphanumeric1(input)', '"user42 rest"', 'Ok((" rest", "user42"))', 'identifiers', 'Stops at the first other character.', 'Take letters and digits.', 'Stop at the space.', 'Ok((" rest", "user42"))', 'alpha1 allows only letters.'), U + R('&str', 'alphanumeric1("user42 rest")'));

// ---------------------------------------------------------------- combinators

add('nom/map-res', 'map_res', CO, 'How nom::combinator::map_res works', 'Applies a function that may fail to a parser\'s output.', {
  rows: [['"123;"']], call: 'map_res(digit1, str::parse::<u32>).parse(input)', note: 'text → number', outs: ['Ok((";", 123))'],
  intro: 'digit1 gives the digits as text; map_res turns them into a u32, and a failed conversion becomes a parse error.',
  steps: [['digit1 takes "123".', 0], ['parse::<u32> converts it.', [], 'o0']],
  result: 'Ok((";", 123))', resultCap: 'map() is the version for functions that cannot fail.',
}, U + R('u32', 'map_res(digit1, str::parse::<u32>).parse("123;")'));
add('nom/map', 'map', CO, 'How nom::combinator::map works', 'Transforms a parser\'s output.', one('map(alpha1, str::len).parse(input)', '"hello!"', 'Ok(("!", 5))', 'convert results', 'The function cannot fail; use map_res if it can.', 'Parse letters.', 'Map to the length.', 'Ok(("!", 5))', 'Parser::map is the method form.'), U + R('usize', 'map(alpha1, str::len).parse("hello!")'));
add('nom/opt', 'opt', CO, 'How nom::combinator::opt works', 'Makes a parser optional: Some(output) or None, never an error.', one('opt(char(\'-\')).parse(input)', '"-5" / "5"', 'Some(\'-\') / None', 'optional parts', 'On None nothing is consumed.', 'Minus present: Some.', 'Absent: None.', "Some('-'), None", 'Common for signs and optional fields.'), U + 'let a: IResult<&str, Option<char>> = opt(char(\'-\')).parse("-5"); let b: IResult<&str, Option<char>> = opt(char(\'-\')).parse("5"); format!("{:?}, {:?}", a.unwrap().1, b.unwrap().1)');
add('nom/value', 'value', CO, 'How nom::combinator::value works', 'Returns a fixed value when the parser succeeds.', one('value(true, tag("yes")).parse(input)', '"yes"', 'Ok(("", true))', 'keywords to values', 'The matched text is thrown away.', 'Match "yes".', 'Return true.', 'Ok(("", true))', 'Often used inside alt.'), U + R('bool', 'value(true, tag("yes")).parse("yes")'));
add('nom/recognize', 'recognize', CO, 'How nom::combinator::recognize works', 'Returns the input text a parser consumed, instead of its output.', one('recognize((digit1, char(\'.\'), digit1)).parse(input)', '"3.14 m"', 'Ok((" m", "3.14"))', 'keep the raw text', 'Handy to grab a whole token made of several parts.', 'Run the inner parsers.', 'Return the consumed slice.', 'Ok((" m", "3.14"))', 'consumed() returns both text and output.'), U + R('&str', "recognize((digit1, char('.'), digit1)).parse(\"3.14 m\")"));
add('nom/all-consuming', 'all_consuming', CO, 'How nom::combinator::all_consuming works', 'Fails unless the parser uses up the whole input.', one('all_consuming(digit1).parse(input)', '"12" / "12x"', 'Ok / Err', 'no leftovers', 'Use it at the top level of a parser.', '"12": all used.', '"12x": x is left, error.', 'Ok, Err', 'Without it trailing junk is silently ignored.'), U + 'let k = |s| { let r: IResult<&str, &str> = all_consuming(digit1).parse(s); if r.is_ok() { "Ok" } else { "Err" } }; format!("{}, {}", k("12"), k("12x"))');
add('nom/verify', 'verify', CO, 'How nom::combinator::verify works', 'Runs a parser, then checks its output with a condition.', one('verify(alpha1, |s: &str| s.len() <= 3).parse(input)', '"abc" / "abcd"', 'Ok / Err', 'extra rules', 'The input is not consumed when the check fails.', 'Parse letters.', 'Check the length.', 'Ok, Err', 'map_res can also reject values.'), U + 'let k = |s| { let r: IResult<&str, &str> = verify(alpha1, |s: &str| s.len() <= 3).parse(s); if r.is_ok() { "Ok" } else { "Err" } }; format!("{}, {}", k("abc"), k("abcd"))');

// ---------------------------------------------------------------- sequences and choices

add('nom/delimited', 'delimited', SE, 'How nom::sequence::delimited works', 'Parses open, content and close, keeping only the content.', {
  rows: [['"(42)"']], call: 'delimited(char(\'(\'), digit1, char(\')\')).parse(input)', note: 'brackets, quotes...', outs: ['Ok(("", "42"))'],
  intro: 'Three parsers run in order; the first and last results are thrown away.',
  steps: [['"(" is matched and dropped.', 0], ['"42" is kept, ")" is matched and dropped.', [], 'o0']],
  result: 'Ok(("", "42"))', resultCap: 'preceded and terminated drop only one side.',
}, U + R('&str', "delimited(char('('), digit1, char(')')).parse(\"(42)\")"));
add('nom/preceded', 'preceded', SE, 'How nom::sequence::preceded works', 'Parses a prefix, then keeps only what follows.', one('preceded(tag("0x"), hex_digit1).parse(input)', '"0xff"', 'Ok(("", "ff"))', 'skip a prefix', 'The prefix must be there.', 'Match "0x".', 'Keep the hex digits.', 'Ok(("", "ff"))', 'terminated keeps the first part instead.'), U + R('&str', 'preceded(tag("0x"), hex_digit1).parse("0xff")'));
add('nom/terminated', 'terminated', SE, 'How nom::sequence::terminated works', 'Parses something followed by a terminator, keeping the first part.', one('terminated(alpha1, char(\';\')).parse(input)', '"end;x"', 'Ok(("x", "end"))', 'statements', 'The terminator is consumed.', 'Parse letters.', 'Require ";".', 'Ok(("x", "end"))', 'Common for line or statement endings.'), U + R('&str', "terminated(alpha1, char(';')).parse(\"end;x\")"));
add('nom/separated-pair', 'separated_pair', SE, 'How nom::sequence::separated_pair works', 'Parses two values with a separator between them.', one('separated_pair(alpha1, char(\'=\'), digit1).parse(input)', '"x=10"', 'Ok(("", ("x", "10")))', 'key=value', 'The separator is thrown away.', 'Parse the key, the "=".', 'And the value.', 'Ok(("", ("x", "10")))', 'A tuple (a, b, c) of parsers runs them all in order.'), U + R('(&str, &str)', "separated_pair(alpha1, char('='), digit1).parse(\"x=10\")"));
add('nom/pair', 'pair', SE, 'How nom::sequence::pair works', 'Runs two parsers in order and returns both outputs.', one('pair(alpha1, digit1).parse(input)', '"ab12"', 'Ok(("", ("ab", "12")))', 'two in a row', 'Fails if either fails.', 'Letters first.', 'Then digits.', 'Ok(("", ("ab", "12")))', 'In nom 8 a tuple (p1, p2) works the same.'), U + R('(&str, &str)', 'pair(alpha1, digit1).parse("ab12")'));
add('nom/alt', 'alt', NO('branch/mod'), 'How nom::branch::alt works', 'Tries parsers in order and returns the first that succeeds.', {
  rows: [['"true"', '"false"', '"maybe"']], call: 'alt((tag("true"), tag("false"))).parse(input)', note: 'a tuple of choices', outs: ['Ok', 'Ok', 'Err'],
  intro: 'If a branch fails, the next one is tried on the same input. If none work, alt fails.',
  steps: [['"true" matches the first branch.', 0, 'o0'], ['"false" matches the second.', 1, 'o1'], ['"maybe" matches none: Err.', 2, 'o2']],
  result: 'Ok, Ok, Err', resultCap: 'Order matters: put longer or more specific branches first.',
}, U + 'let k = |s| { let r: IResult<&str, &str> = alt((tag("true"), tag("false"))).parse(s); if r.is_ok() { "Ok" } else { "Err" } }; format!("{}, {}, {}", k("true"), k("false"), k("maybe"))');

// ---------------------------------------------------------------- repetition

add('nom/separated-list1', 'separated_list1', MU, 'How nom::multi::separated_list1 works', 'One or more items with a separator between them.', {
  rows: [['"1,22,333"']], call: 'separated_list1(char(\',\'), digit1).parse(input)', note: 'CSV-like lists', outs: ['Ok(("", ["1", "22", "333"]))'],
  intro: 'Parses an item, then repeatedly a separator and another item, until that fails.',
  steps: [['"1", ",", "22", ",", "333".', 0], ['The items are collected in a Vec.', [], 'o0']],
  result: 'Ok(("", ["1", "22", "333"]))', resultCap: 'separated_list0 also accepts an empty list.',
}, U + R('Vec<&str>', "separated_list1(char(','), digit1).parse(\"1,22,333\")"));
add('nom/many0', 'many0', MU, 'How nom::multi::many0 works', 'Repeats a parser zero or more times, collecting the results.', one('many0(tag("ab")).parse(input)', '"ababx"', 'Ok(("x", ["ab", "ab"]))', 'repetition', 'Stops at the first failure; zero matches is fine.', 'Match "ab" twice.', 'Stop at "x".', 'Ok(("x", ["ab", "ab"]))', 'many1 needs at least one.'), U + R('Vec<&str>', 'many0(tag("ab")).parse("ababx")'));
add('nom/many1', 'many1', MU, 'How nom::multi::many1 works', 'Repeats a parser one or more times.', one('many1(one_of("ab")).parse(input)', '"abbac" / "c"', "Ok / Err", 'at least one', 'Fails if the first attempt fails.', 'Take a, b, b, a.', 'Stop at c.', "['a', 'b', 'b', 'a'], Err", 'many_m_n sets exact bounds.'), U + 'let a: IResult<&str, Vec<char>> = many1(one_of("ab")).parse("abbac"); let b: IResult<&str, Vec<char>> = many1(one_of("ab")).parse("c"); format!("{:?}, {}", a.unwrap().1, if b.is_err() { "Err" } else { "Ok" })');
add('nom/fold-many0', 'fold_many0', MU, 'How nom::multi::fold_many0 works', 'Repeats a parser and folds the results, without building a Vec.', one('fold_many0(i32, || 0, |acc, x| acc + x)', '"1 2 3" (with spaces)', '6', 'accumulate', 'The initial value is created by a closure.', 'Parse each number.', 'Add it.', '6', 'Saves the allocation of many0.'), U + 'let r: IResult<&str, i32> = fold_many0(terminated(nom::character::complete::i32, space0), || 0, |a, x| a + x).parse("1 2 3"); r.unwrap().1.to_string()');
add('nom/count', 'count', MU, 'How nom::multi::count works', 'Runs a parser exactly n times.', one('count(anychar, 3).parse(input)', '"abcd"', "Ok((\"d\", ['a', 'b', 'c']))", 'fixed repetitions', 'Fails if fewer than n succeed.', 'Three chars.', 'One left.', "Ok((\"d\", ['a', 'b', 'c']))", 'Good for fixed-size records.'), U + R('Vec<char>', 'count(anychar, 3).parse("abcd")'));
add('nom/parser-parse', 'parse', NO('internal', 'Parser'), 'How nom::Parser::parse works', 'Runs any parser (function or combinator) on an input.', one('delimited(..).parse(input)', 'a combinator', 'IResult', 'nom 8 style', 'In nom 8 combinators return a Parser; call .parse(input) on them.', 'Build the parser.', 'Run it.', 'Ok(("", "x"))', 'parse_complete treats the input as final.'), U + R('&str', "delimited(char('['), alpha1, char(']')).parse(\"[x]\")"));

// ---------------------------------------------------------------- hashing

add('digest/digest', 'digest', DG, 'How Digest::digest works (sha2::Sha256)', 'Hashes data in one call.', {
  rows: [['b"abc"']], call: 'Sha256::digest(b"abc")', note: 'the digest crate\'s Digest trait', outs: ['ba7816bf...15ad'],
  intro: 'Hash crates (sha2, sha1, md-5, blake2...) share the Digest trait: same methods for every algorithm.',
  steps: [['Run SHA-256 over the bytes.', 0], ['32 bytes come out, shown here as hex.', [], 'o0']],
  result: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', resultCap: 'Use new/update/finalize for data that arrives in pieces.',
}, 'use sha2::Digest; hex::encode(sha2::Sha256::digest(b"abc"))');
add('digest/new', 'new', DG, 'How Digest::new works (sha2::Sha256)', 'Starts an incremental hash.', one('let mut h = Sha256::new();', 'nothing', 'an empty hasher', 'streaming data', 'Feed it with update(), then finalize().', 'Create.', 'Finalize without data: hash of "".', 'e3b0c442...b855', 'Sha256::default() is the same.'), 'use sha2::Digest; let h = sha2::Sha256::new(); let s = hex::encode(h.finalize()); format!("{}...{}", &s[..8], &s[60..])');
add('digest/update', 'update', DG, 'How Digest::update works (sha2::Sha256)', 'Feeds more data into the hash.', one('h.update(b"ab"); h.update(b"c");', '"ab" then "c"', 'same as hashing "abc"', 'piecewise input', 'Splitting the data does not change the result.', 'Feed the parts.', 'Same hash as one piece.', 'same: true', 'chain_update returns the hasher, for chaining.'), 'use sha2::Digest; let mut h = sha2::Sha256::new(); h.update(b"ab"); h.update(b"c"); format!("same: {}", h.finalize() == sha2::Sha256::digest(b"abc"))');
add('digest/finalize', 'finalize', DG, 'How Digest::finalize works (sha2::Sha256)', 'Finishes the hash and returns the output bytes.', one('h.finalize()', 'after update(b"abc")', '32 bytes', 'get the result', 'Consumes the hasher; finalize_reset keeps it usable.', 'Pad and finish.', 'The digest.', '32 bytes', 'Encode as hex or base64 to print it.'), 'use sha2::Digest; let mut h = sha2::Sha256::new(); h.update(b"abc"); format!("{} bytes", h.finalize().len())');
add('crc32fast/hash', 'hash', ['crc32fast', '', /src[/]lib[.]rs$/], 'How crc32fast::hash works', 'The CRC-32 checksum of some bytes, using SIMD when available.', one('crc32fast::hash(b"hello")', 'b"hello"', '0x3610a686', 'checksums', 'For detecting accidental corruption, not for security.', 'Run CRC-32.', 'A u32.', '0x3610a686', 'Hasher::new() for data in pieces.'), 'format!("{:#x}", crc32fast::hash(b"hello"))');
add('crc32fast/hasher-update', 'update', ['crc32fast', 'Hasher', /src[/]lib[.]rs$/], 'How crc32fast::Hasher::update works', 'Feeds data into a running CRC-32.', one('h.update(b"hel"); h.update(b"lo"); h.finalize()', '"hel" + "lo"', '0x3610a686', 'streaming checksums', 'Same result as hashing all at once.', 'Feed the parts.', 'finalize() gives the CRC.', '0x3610a686', 'Used for zip and PNG chunks.'), 'let mut h = crc32fast::Hasher::new(); h.update(b"hel"); h.update(b"lo"); format!("{:#x}", h.finalize())');

// ---------------------------------------------------------------- base64 and hex

add('base64/encode-string', 'encode_string', ['base64', 'Engine', /engine[/]mod[.]rs$/], 'How base64::Engine::encode_string works', 'Appends the base64 encoding to an existing String.', one('STANDARD.encode_string(b"hi", &mut s)', 's = "data:"', '"data:aGk="', 'reuse a buffer', 'Saves an allocation when building larger strings.', 'Encode.', 'Append.', '"data:aGk="', 'encode() returns a new String.'), 'use base64::Engine; let mut s = String::from("data:"); base64::engine::general_purpose::STANDARD.encode_string(b"hi", &mut s); d(s)');
add('base64/decode-vec', 'decode_vec', ['base64', 'Engine', /engine[/]mod[.]rs$/], 'How base64::Engine::decode_vec works', 'Decodes base64 and appends the bytes to an existing Vec.', one('STANDARD.decode_vec("aGk=", &mut buf)?', '"aGk="', 'buf += b"hi"', 'reuse a buffer', 'Errors on invalid input.', 'Decode.', 'Append.', '"hi"', 'decode() returns a new Vec.'), 'use base64::Engine; let mut v = Vec::new(); base64::engine::general_purpose::STANDARD.decode_vec("aGk=", &mut v).unwrap(); d(String::from_utf8(v).unwrap())');
add('hex/encode-upper', 'encode_upper', ['hex', '', /src[/]lib[.]rs$/], 'How hex::encode_upper works', 'Hex-encodes bytes with uppercase letters.', one('hex::encode_upper([0xde, 0xad])', '[0xde, 0xad]', '"DEAD"', 'uppercase hex', 'hex::encode uses lowercase.', 'Two digits per byte.', 'Uppercase.', '"DEAD"', 'decode accepts either case.'), 'd(hex::encode_upper([0xde, 0xad]))');
add('hex/decode-to-slice', 'decode_to_slice', ['hex', '', /src[/]lib[.]rs$/], 'How hex::decode_to_slice works', 'Decodes hex into a buffer you provide, without allocating.', one('hex::decode_to_slice("cafe", &mut buf)?', '"cafe"', '[0xca, 0xfe]', 'fixed-size output', 'The buffer must be exactly half the text length.', 'Decode pairs.', 'Fill the buffer.', '[202, 254]', 'Good for keys and hashes of known size.'), 'let mut b = [0u8; 2]; hex::decode_to_slice("cafe", &mut b).unwrap(); d(b)');

module.exports = list;
