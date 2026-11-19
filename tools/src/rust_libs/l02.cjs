// regex: the rest of Regex, Match, Captures, RegexBuilder, RegexSet / SetMatches and regex::bytes.
const { group } = require('../rust_std/kit.cjs');
const R = String.raw;
const RX = ['regex', 'Regex', /regex\/string\.rs$/];
const MA = ['regex', 'Match', /regex\/string\.rs$/];
const CA = ['regex', 'Captures', /regex\/string\.rs$/];
const RB = ['regex', 'string::RegexBuilder', /^src\/builders\.rs$/];
const RS = ['regex', 'RegexSet', /regexset\/string\.rs$/];
const SM = ['regex', 'SetMatches', /regexset\/string\.rs$/];
const BY = ['regex', 'Regex', /regex\/bytes\.rs$/];
const { list, add } = group({ at: RX });
const one = (call, input, out, note, intro, s1, s2, result, cap) => ({ rows: [[input]], call, note, outs: [out], intro, steps: [[s1, 0], [s2, [], 'o0']], result, resultCap: cap });
const re = (p) => R`regex::Regex::new(r"${p}").unwrap()`;
const DATE = R`(?<y>\d{4})-(?<m>\d{2})`;

// ---------------------------------------------------------------- Regex

add('regex/as-str', 'as_str', null, 'How Regex::as_str works', 'The pattern text the regex was built from.', one(R`re.as_str()`, R`Regex::new(r"\d+")`, R`\d+`, 'the source pattern', 'Useful in error messages and logs.', 'The regex keeps its pattern.', 'Return it.', R`\d+`, 'Display prints the same text.'), `${re(R`\d+`)}.as_str().to_string()`);
add('regex/captures-len', 'captures_len', null, 'How Regex::captures_len works', 'How many groups the pattern has, counting the whole match as group 0.', one(R`re.captures_len()`, R`(\w+)@(\w+)`, '3', 'group count', 'Group 0 is always the whole match.', 'Two groups in ( ).', 'Plus group 0: 3.', '3', 'Non-capturing (?:...) groups are not counted.'), `${re(R`(\w+)@(\w+)`)}.captures_len().to_string()`);
add('regex/capture-names', 'capture_names', null, 'How Regex::capture_names works', 'The name of each group, None for unnamed ones.', {
  rows: [['group 0', '(?<y>...)', '(?<m>...)']], call: 're.capture_names()', note: R`re = (?<y>\d{4})-(?<m>\d{2})`, outs: ['None', 'Some("y")', 'Some("m")'],
  intro: 'One entry per group, in order. Group 0 (the whole match) never has a name.',
  steps: [['Group 0: None.', 0, 'o0'], ['Group 1 is named y.', 1, 'o1'], ['Group 2 is named m.', 2, 'o2']],
  result: 'None, Some("y"), Some("m")', resultCap: 'Use the names with caps["y"] or caps.name("y").',
}, `jd(${re(DATE)}.capture_names())`);
add('regex/static-captures-len', 'static_captures_len', null, 'How Regex::static_captures_len works', 'The number of groups that always take part in a match, if that is fixed.', one(R`re.static_captures_len()`, R`(a)(b)? / (a)(b)`, 'None / Some(3)', 'fixed group count', 'An optional group makes the count variable: None.', '(b)? may not match: None.', 'Both always match: Some(3).', 'None, Some(3)', 'captures_len counts all groups.'), `format!("{:?}, {:?}", ${re('(a)(b)?')}.static_captures_len(), ${re('(a)(b)')}.static_captures_len())`);
add('regex/shortest-match', 'shortest_match', null, 'How Regex::shortest_match works', 'Where the earliest match could end; faster than find when you only need yes and a position.', one('re.shortest_match("ab123")', R`re = \d+`, 'Some(3)', 'end of the first possible match', 'It stops as soon as a match is certain, so the end may be shorter than find() reports.', '"1" at index 2 already matches.', 'The end position: 3.', 'Some(3)', 'find() would report 2..5.'), `d(${re(R`\d+`)}.shortest_match("ab123"))`);
add('regex/find-at', 'find_at', null, 'How Regex::find_at works', 'Like find, but starts searching at a byte offset.', {
  rows: [['a1b2c3']], call: 're.find_at("a1b2c3", 2)', note: R`re = \d`, outs: ['"2" at 3'],
  intro: 'find_at skips the text before start, but still sees it for anchors like \\b.',
  steps: [['Searching starts at index 2 ("b").', 0], ['The first digit from there is "2" at index 3.', [], 'o0']],
  result: '"2" at 3', resultCap: 'Positions stay relative to the whole text, not to start.',
}, `let m = ${re(R`\d`)}.find_at("a1b2c3", 2).unwrap(); format!("{:?} at {}", m.as_str(), m.start())`);
add('regex/is-match-at', 'is_match_at', null, 'How Regex::is_match_at works', 'Whether there is a match starting at or after a byte offset.', one('re.is_match_at("1ab", 1)', R`re = \d`, 'false', 'search from an offset', 'The "1" before the offset is not searched.', 'Start at index 1.', 'No digit after it: false.', 'false', 'is_match searches the whole text.'), `${re(R`\d`)}.is_match_at("1ab", 1).to_string()`);
add('regex/captures-at', 'captures_at', null, 'How Regex::captures_at works', 'Like captures, but starts at a byte offset.', one('re.captures_at("k=1 v=2", 3)', R`re = (\w)=(\d)`, 'Some(v=2)', 'groups from an offset', 'Group positions stay relative to the whole text.', 'Skip "k=1".', 'Group 1 is "v".', '"v", "2"', 'captures() starts at 0.'), `let c = ${re(R`(\w)=(\d)`)}.captures_at("k=1 v=2", 3).unwrap(); format!("{:?}, {:?}", &c[1], &c[2])`);
add('regex/replacen', 'replacen', null, 'How Regex::replacen works', 'Replaces only the first n matches.', {
  rows: [['a1b2c3']], call: 're.replacen("a1b2c3", 2, "#")', note: R`re = \d`, outs: ['"a#b#c3"'],
  intro: 'replacen stops after n replacements; n = 0 means replace all of them.',
  steps: [['"1" and "2" are replaced.', 0], ['The third digit stays because the limit is 2.', [], 'o0']],
  result: '"a#b#c3"', resultCap: 'replace = replacen(.., 1, ..); replace_all = replacen(.., 0, ..).',
}, `d(${re(R`\d`)}.replacen("a1b2c3", 2, "#"))`);

// ---------------------------------------------------------------- Match

const M = (body) => `let m = ${re(R`\d+`)}.find("ab123cd").unwrap(); ${body}`;
add('regex/match-as-str', 'as_str', MA, 'How Match::as_str works', 'The matched text.', one('m.as_str()', R`"ab123cd", \d+`, '"123"', 'the text of a match', 'Borrowed from the searched string, no copy.', 'The match covers 2..5.', 'Its text.', '"123"', 'm.range() gives the positions.'), M('d(m.as_str())'));
add('regex/match-start', 'start', MA, 'How Match::start works', 'Byte offset where the match begins.', one('m.start()', R`"ab123cd", \d+`, '2', 'position', 'Bytes, not characters.', 'The match begins at "1".', 'Index 2.', '2', 'end() is one past the last byte.'), M('m.start().to_string()'));
add('regex/match-end', 'end', MA, 'How Match::end works', 'Byte offset just after the match.', one('m.end()', R`"ab123cd", \d+`, '5', 'position', 'The match is text[start..end].', 'It ends after "3".', 'Index 5.', '5', 'start()..end() = range().'), M('m.end().to_string()'));
add('regex/match-range', 'range', MA, 'How Match::range works', 'The byte range of the match.', one('m.range()', R`"ab123cd", \d+`, '2..5', 'slice with it', 'text[m.range()] is the matched text.', 'Start 2, end 5.', 'As a Range.', '2..5', 'Same as m.start()..m.end().'), M('d(m.range())'));
add('regex/match-len', 'len', MA, 'How Match::len works', 'Length of the match in bytes.', one('m.len()', R`"ab123cd", \d+`, '3', 'size', 'end - start.', 'Three digits.', '3.', '3', 'Non-ASCII characters take several bytes.'), M('m.len().to_string()'));
add('regex/match-is-empty', 'is_empty', MA, 'How Match::is_empty works', 'true for a zero-length match.', one('re.find("abc").unwrap().is_empty()', 'pattern x*', 'true', 'empty matches', 'x* can match nothing at position 0.', 'An empty match at 0.', 'true.', 'true', 'Patterns that can match nothing need care in loops.'), `${re('x*')}.find("abc").unwrap().is_empty().to_string()`);

// ---------------------------------------------------------------- Captures

const C = (body) => `let c = ${re(DATE)}.captures("on 2024-05").unwrap(); ${body}`;
add('regex/captures-get', 'get', CA, 'How Captures::get works', 'The Match of a group by number, or None if that group did not take part.', {
  rows: [['0', '1', '9']], call: 'caps.get(i)', note: R`re = (?<y>\d{4})-(?<m>\d{2}), "on 2024-05"`, outs: ['"2024-05"', '"2024"', 'None'],
  intro: 'get(0) is the whole match, get(1) the first group, and so on.',
  steps: [['get(0): the whole match.', 0, 'o0'], ['get(1): group y.', 1, 'o1'], ['get(9): there is no group 9, so None (caps[9] would panic).', 2, 'o2']],
  result: '"2024-05", "2024", None', resultCap: 'An optional group that did not match also gives None.',
}, C('format!("{:?}, {:?}, {:?}", c.get(0).unwrap().as_str(), c.get(1).unwrap().as_str(), c.get(9))'));
add('regex/caps-iter', 'iter', CA, 'How Captures::iter works', 'Every group in order, as Option<Match>.', one('caps.iter()', R`"2024-05" with 2 groups`, '3 items', 'all groups', 'Item 0 is the whole match.', 'Walk the groups.', 'Their text.', '"2024-05", "2024", "05"', 'Unmatched optional groups appear as None.'), C('jd(c.iter().map(|m| m.unwrap().as_str()))'));
add('regex/captures-len-caps', 'len', CA, 'How Captures::len works', 'The number of groups, including group 0.', one('caps.len()', '2 groups', '3', 'group count', 'Always the same as Regex::captures_len.', 'Two named groups.', 'Plus group 0.', '3', 'Counts groups, not successful matches.'), C('c.len().to_string()'));
add('regex/captures-extract', 'extract', CA, 'How Captures::extract works', 'The whole match and a fixed-size array of group texts.', {
  rows: [['"on 2024-05"']], call: 'let (all, [y, m]) = caps.extract()', note: 'every group must always match', outs: ['"2024-05"', '["2024", "05"]'],
  intro: 'extract::<N>() gives &str values directly, which is handy with let-destructuring.',
  steps: [['The whole match.', 0, 'o0'], ['The two groups as an array.', [], 'o1']],
  result: '"2024-05", ["2024", "05"]', resultCap: 'It panics if N does not equal the number of groups.',
}, C('let (all, [y, m]) = c.extract(); format!("{:?}, {:?}", all, [y, m])'));
add('regex/captures-expand', 'expand', CA, 'How Captures::expand works', 'Fills a template like "$m/$y" with group texts.', one('caps.expand("$m/$y", &mut out)', '"2024-05"', '"05/2024"', 'templates', '$name or $1 refer to groups; ${y} avoids ambiguity.', 'Read the groups.', 'Write the template.', '"05/2024"', 'replace() uses the same syntax.'), C('let mut out = String::new(); c.expand("$m/$y", &mut out); d(out)'));
add('regex/captures-get-match', 'get_match', CA, 'How Captures::get_match works', 'The overall match (group 0), which always exists.', one('caps.get_match()', '"on 2024-05"', 'Match "2024-05"', 'no Option', 'Same as get(0).unwrap().', 'Group 0.', 'Its text.', '"2024-05"', 'Added in regex 1.12.'), C('d(c.get_match().as_str())'));

// ---------------------------------------------------------------- RegexBuilder

add('regex/builder-new', 'new', RB, 'How RegexBuilder::new works', 'Starts building a regex with options.', one(R`RegexBuilder::new(r"\d+").build()`, R`\d+`, 'Ok(Regex)', 'options before compiling', 'Set flags with the builder methods, then call build().', 'Collect the options.', 'Compile.', 'true', 'Regex::new is RegexBuilder::new(p).build().'), R`regex::RegexBuilder::new(r"\d+").build().unwrap().is_match("a1").to_string()`);
add('regex/builder-case-insensitive', 'case_insensitive', RB, 'How RegexBuilder::case_insensitive works', 'Makes letters match regardless of case.', one('RegexBuilder::new("rust").case_insensitive(true)', '"I love RUST"', 'match', 'ignore case', 'Same as writing (?i) in the pattern.', 'Turn on the flag.', '"RUST" matches.', 'true', 'Unicode-aware: also for letters like É.'), 'regex::RegexBuilder::new("rust").case_insensitive(true).build().unwrap().is_match("I love RUST").to_string()');
add('regex/builder-multi-line', 'multi_line', RB, 'How RegexBuilder::multi_line works', 'Makes ^ and $ match at every line, not only at the ends of the text.', {
  rows: [['"a\\nb"']], call: R`RegexBuilder::new(r"^\w$").multi_line(true)`, note: 'same as (?m)', outs: ['2 matches'],
  intro: 'By default ^ is the start of the text. In multi-line mode it is the start of each line.',
  steps: [['Line "a" matches ^\\w$.', 0], ['Line "b" matches too: 2 matches.', [], 'o0']],
  result: '2', resultCap: 'Without the flag: 0 matches here.',
}, R`regex::RegexBuilder::new(r"^\w$").multi_line(true).build().unwrap().find_iter("a\nb").count().to_string()`);
add('regex/builder-dot-matches-new-line', 'dot_matches_new_line', RB, 'How RegexBuilder::dot_matches_new_line works', 'Lets . match a newline too.', one('RegexBuilder::new("a.b").dot_matches_new_line(true)', '"a\\nb"', 'match', 'same as (?s)', 'By default . matches anything except \\n.', 'Turn on the flag.', '"a\\nb" matches.', 'true', 'Useful for blocks of text across lines.'), 'regex::RegexBuilder::new("a.b").dot_matches_new_line(true).build().unwrap().is_match("a\\nb").to_string()');
add('regex/builder-ignore-whitespace', 'ignore_whitespace', RB, 'How RegexBuilder::ignore_whitespace works', 'Allows spaces and # comments inside the pattern.', one(R`RegexBuilder::new(r"\d+ - \d+ # range").ignore_whitespace(true)`, '"1-2"', 'match', 'readable patterns', 'Spaces are ignored; use \\ or [ ] for a literal space.', 'Spaces and comment are skipped.', '"1-2" matches.', 'true', 'Same as (?x).'), R`regex::RegexBuilder::new(r"\d+ - \d+ # range").ignore_whitespace(true).build().unwrap().is_match("1-2").to_string()`);
add('regex/builder-swap-greed', 'swap_greed', RB, 'How RegexBuilder::swap_greed works', 'Makes x* lazy and x*? greedy.', one('RegexBuilder::new("a+").swap_greed(true)', '"aaa"', '"a"', 'flip greediness', 'Same as (?U).', 'a+ now takes as little as possible.', 'One "a".', '"a"', 'Usually clearer to write a+? instead.'), 'd(regex::RegexBuilder::new("a+").swap_greed(true).build().unwrap().find("aaa").unwrap().as_str())');
add('regex/builder-unicode', 'unicode', RB, 'How RegexBuilder::unicode works', 'Turns Unicode-aware classes like \\w on or off.', one(R`RegexBuilder::new(r"^\w$").unicode(false)`, '"é"', 'no match', 'ASCII-only classes', 'With unicode(false), \\w means [0-9A-Za-z_].', 'é is not ASCII.', 'No match.', 'false', 'Unicode is on by default.'), R`regex::RegexBuilder::new(r"^\w$").unicode(false).build().unwrap().is_match("é").to_string()`);
add('regex/builder-size-limit', 'size_limit', RB, 'How RegexBuilder::size_limit works', 'Caps how big the compiled regex may get.', one(R`RegexBuilder::new(r"\w{1000}").size_limit(1000)`, R`\w{1000}`, 'Err(CompiledTooBig)', 'protect against huge patterns', 'Large repetitions of Unicode classes compile to big machines.', 'The compiled size exceeds 1000 bytes.', 'build() fails.', 'Err', 'Important when patterns come from users.'), R`let r = regex::RegexBuilder::new(r"\w{1000}").size_limit(1000).build(); (if r.is_err() { "Err" } else { "Ok" }).to_string()`);
add('regex/builder-build', 'build', RB, 'How RegexBuilder::build works', 'Compiles the pattern with the chosen options.', one('builder.build()', 'pattern "(" ', 'Err(Syntax)', 'compile', 'Returns Result<Regex, Error>.', 'Parse the pattern.', 'An unclosed group is an error.', 'Err', 'Valid patterns give Ok(Regex).'), 'let r = regex::RegexBuilder::new("(").build(); (if r.is_err() { "Err" } else { "Ok" }).to_string()');

// ---------------------------------------------------------------- RegexSet

const SET = R`let set = regex::RegexSet::new([r"\d+", r"^[a-z]+$", r"@"]).unwrap(); `;
add('regex/set-new', 'new', RS, 'How RegexSet::new works', 'Compiles several patterns to be matched in one pass.', {
  rows: [[R`\d+`, '^[a-z]+$', '@']], call: 'RegexSet::new([p0, p1, p2])', note: 'one scan, many patterns', outs: ['matches for "abc": [1]'],
  intro: 'A set answers which of its patterns match, scanning the text only once.',
  steps: [['Three patterns are compiled together.', [0, 1, 2]], ['For "abc" only pattern 1 matches.', 1, 'o0']],
  result: '[1]', resultCap: 'It tells you which patterns match, not where.',
}, SET + 'd(set.matches("abc").into_iter().collect::<Vec<_>>())');
add('regex/set-is-match', 'is_match', RS, 'How RegexSet::is_match works', 'true if any pattern of the set matches.', one('set.is_match("a@b")', R`[\d+, ^[a-z]+$, @]`, 'true', 'any match', 'Stops early, like Regex::is_match.', '"@" matches.', 'true.', 'true', 'matches() tells you which ones.'), SET + 'set.is_match("a@b").to_string()');
add('regex/set-len', 'len', RS, 'How RegexSet::len works', 'How many patterns the set holds.', one('set.len()', '3 patterns', '3', 'size', 'Indices go from 0 to len - 1.', 'Count them.', '3.', '3', 'is_empty() for zero.'), SET + 'set.len().to_string()');
add('regex/set-patterns', 'patterns', RS, 'How RegexSet::patterns works', 'The pattern texts, in index order.', one('set.patterns()', '3 patterns', 'their texts', 'map indices back', 'Use it to show which pattern matched.', 'Return the patterns.', 'In order.', R`"\\d+", "^[a-z]+$", "@"`, 'The index of each matches SetMatches.'), SET + 'jd(set.patterns())');
add('regex/set-empty', 'empty', RS, 'How RegexSet::empty works', 'A set with no patterns, which never matches.', one('RegexSet::empty()', 'no patterns', 'never matches', 'start empty', 'A neutral value, e.g. when no filters are configured.', 'No patterns.', 'is_match is false.', 'false', 'len() is 0.'), 'regex::RegexSet::empty().is_match("x").to_string()');
add('regex/set-matches-matched', 'matched', SM, 'How SetMatches::matched works', 'Whether pattern i matched.', one('set.matches("42").matched(0)', R`[\d+, ^[a-z]+$, @]`, 'true', 'check one pattern', 'Index into the patterns given to RegexSet::new.', 'Pattern 0 is \\d+.', 'It matched "42".', 'true, false', 'matched(2) (the @) is false.'), SET + 'let m = set.matches("42"); format!("{}, {}", m.matched(0), m.matched(2))');
add('regex/set-matches-matched-any', 'matched_any', SM, 'How SetMatches::matched_any works', 'true if at least one pattern matched.', one('set.matches("!").matched_any()', '"!"', 'false', 'any of them?', 'Same as RegexSet::is_match, after the fact.', 'No pattern matches "!".', 'false.', 'false', 'matched_all checks every pattern.'), SET + 'set.matches("!").matched_any().to_string()');
add('regex/set-matches-iter', 'iter', SM, 'How SetMatches::iter works', 'The indices of the patterns that matched, ascending.', one('set.matches("a1@").iter()', '"a1@"', '0, 2', 'which ones', 'Pattern 1 needs only letters, so it fails here.', 'Patterns 0 and 2 match.', 'Their indices.', '0, 2', 'into_iter() consumes instead of borrowing.'), SET + 'j(set.matches("a1@").iter())');
add('regex/set-matches-len', 'len', SM, 'How SetMatches::len works', 'The number of patterns in the set (not the number that matched).', one('set.matches("x").len()', '3 patterns', '3', 'size of the set', 'Count matches with iter().count().', 'The set has 3 patterns.', '3.', '3', 'A common surprise: this is not the match count.'), SET + 'set.matches("x").len().to_string()');

// ---------------------------------------------------------------- regex::bytes

add('regex/bytes-is-match', 'is_match', BY, 'How regex::bytes::Regex::is_match works', 'Matches against bytes, which need not be valid UTF-8.', one(R`bytes::Regex::new(r"\d+")?.is_match(b"\xFFab1")`, R`b"\xFFab1"`, 'true', 'binary data', 'A &str regex would refuse invalid UTF-8; the bytes version does not care.', 'Skip the 0xFF byte.', 'A digit is found.', 'true', 'Use it on file contents or network data.'), R`regex::bytes::Regex::new(r"\d+").unwrap().is_match(b"\xFFab1").to_string()`);
add('regex/bytes-find', 'find', BY, 'How regex::bytes::Regex::find works', 'The first match in bytes, as a bytes Match.', one(R`re.find(b"id=42;")`, R`b"id=42;", \d+`, 'b"42" at 3..5', 'binary search', 'as_bytes() gives the matched &[u8].', 'Search the bytes.', 'The digits.', R`b"42" at 3..5`, 'Same API as the &str version.'), R`let m = regex::bytes::Regex::new(r"\d+").unwrap().find(b"id=42;").unwrap(); format!("b{:?} at {}..{}", std::str::from_utf8(m.as_bytes()).unwrap(), m.start(), m.end())`);

module.exports = list;
