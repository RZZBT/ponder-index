// regex: 13 animations (#37-49).
const { cells, lines, pick } = require('./scene.cjs');
const R = String.raw;
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });
const re = (p) => R`Regex::new(r"${p}").unwrap()`;

add('new', 'How Regex::new() works', 'Compiles a pattern once, so it can be used many times; a bad pattern is an error.', () => lines({
  call: R`Regex::new(r"\d+")  and  Regex::new("(")`, note: 'compile the pattern before searching',
  lines: [R`Regex::new(r"\d+")`, R`\d = any digit,  + = one or more times`, 'compiled into a matcher → Ok(Regex)', 'Regex::new("(")', 'a group is opened but never closed', '→ Err(Error::Syntax(...))'],
  intro: 'Regex::new() reads the pattern text and builds a matcher from it. This is the slow part, so it is done once.',
  steps: [
    { cap: R`The pattern \d+ is parsed: \d means one digit, + means one or more of what comes before it.`, show: [0, 1] },
    { cap: 'The pattern is valid, so the compiled matcher comes back as Ok(Regex). Keep it and reuse it: searching with it is fast.', show: [2] },
    { cap: 'Now "(": a group is started, but there is no ")" to end it.', show: [3, 4] },
    { cap: 'Regex::new() does not panic on a bad pattern; it returns Err with a message that points at the problem.', show: [5] },
  ],
  result: R`r"\d+" → Ok, "(" → Err`, resultCap: R`r"\d+" → Ok, "(" → Err. Write patterns as raw strings (r"...") so the backslashes reach the regex unchanged.`,
}), R`let k = |p: &str| if Regex::new(p).is_ok() { "Ok" } else { "Err" }; format!("r\"\\d+\" → {}, \"(\" → {}", k(r"\d+"), k("("))`, R`r"\d+" → Ok, "(" → Err`);

add('is-match', 'How Regex::is_match() works', 'Says whether the pattern matches anywhere in the text.', () => cells({
  call: 're.is_match("abc123")', note: R`re = Regex::new(r"\d+"): one or more digits`, text: 'abc123',
  intro: 'is_match() looks for the pattern anywhere in the text. It only answers yes or no.',
  steps: [
    { cap: 'a, b and c are not digits, so no match starts there.', mark: [[0, 3, 'danger']], eq: 'no digit' },
    { cap: 'At 1 a digit is found, so the pattern matches. is_match() can stop right here: it does not need to know where the match ends.', mark: [[0, 3, 'danger'], [3, 4, 'success']], eq: 'digit found → true' },
    { cap: R`The pattern matches anywhere in the text unless it is anchored: r"^\d+$" would need the whole text to be digits, and "abc123" would give false.`, mark: [[3, 6, 'success']], eq: R`^\d+$ → false` },
  ],
  result: 'true', resultCap: 're.is_match("abc123") is true. Use find() when you also need where the match is.',
}), R`d(${re(R`\d+`)}.is_match("abc123"))`, 'true');

add('find', 'How Regex::find() works', 'Gives the first, leftmost match and where it is.', () => cells({
  call: 're.find("ab12cd345")', note: R`re = Regex::new(r"\d+")`, text: 'ab12cd345', idx: true, outs: ['Match "12", 2..4'],
  intro: 'find() returns the first match, as an Option<Match> with the matched text and its byte positions.',
  steps: [
    { cap: 'The search starts at the left. a and b are not digits.', mark: [[0, 2, 'danger']] },
    { cap: 'At index 2 a digit starts a match. + is greedy: it takes as many digits as it can, so it takes 2 as well.', mark: [[2, 4, 'success']], eq: '1, 2 are digits' },
    { cap: 'c is not a digit, so the match ends before index 4. The match is "12", from 2 up to (not including) 4.', mark: [[2, 4, 'success'], [4, 5, 'danger']], out: [0], eq: 'start 2, end 4' },
    { cap: 'find() stops after the first match. "345" is also a match, but it is not looked at.', mark: [[2, 4, 'success'], [6, 9, 'warning']] },
  ],
  result: '"12" at 2..4', resultCap: 'find() returns Some(Match) with as_str() = "12", start() = 2 and end() = 4. Use find_iter() for every match.',
}), R`let m = ${re(R`\d+`)}.find("ab12cd345").unwrap(); format!("{:?} at {}..{}", m.as_str(), m.start(), m.end())`, '"12" at 2..4');

add('find-iter', 'How Regex::find_iter() works', 'Yields every match, left to right, without overlaps.', () => cells({
  call: 're.find_iter("ab12cd345")', note: R`re = Regex::new(r"\d+")`, text: 'ab12cd345', idx: true, outs: ['"12"', '"345"'],
  intro: 'find_iter() repeats the search: after each match it continues from where that match ended.',
  steps: [
    { cap: 'The first match is "12" at 2..4.', mark: [[2, 4, 'success']], out: [0] },
    { cap: 'The search goes on from index 4. c and d are skipped.', mark: [[2, 4, 'success'], [4, 6, 'danger']], keep: false },
    { cap: 'The next match is "345" at 6..9. Matches never overlap, because each search starts after the previous match.', mark: [[2, 4, 'success'], [6, 9, 'success']], out: [1] },
    { cap: 'The end of the text is reached, so the iterator ends.', mark: [[2, 4, 'success'], [6, 9, 'success']] },
  ],
  result: '"12", "345"', resultCap: 'Collected with .map(|m| m.as_str()), the matches are "12" and "345".',
}), R`jd(${re(R`\d+`)}.find_iter("ab12cd345").map(|m| m.as_str()))`, '"12", "345"');

add('captures', 'How Regex::captures() works', 'Finds a match and gives the parts matched by each group in ( ).', () => cells({
  call: 're.captures("10-20")', note: R`re = Regex::new(r"(\d+)-(\d+)"): two groups`, text: '10-20', outs: ['0: "10-20"', '1: "10"', '2: "20"'],
  intro: 'Each ( ) in the pattern is a capture group. captures() returns the whole match and what every group matched.',
  steps: [
    { cap: R`Group 1, the first (\d+), matches the digits 10.`, mark: [[0, 2, 'warning']], out: [1] },
    { cap: 'The - in the pattern matches the - in the text. It is not inside a group, so it is not captured on its own.', mark: [[0, 2, 'warning'], [2, 3, 'muted']] },
    { cap: R`Group 2, the second (\d+), matches 20.`, mark: [[0, 2, 'warning'], [3, 5, 'accent2']], out: [2] },
    { cap: 'Group 0 is always the whole match: "10-20".', mark: [[0, 5, 'success']], out: [0] },
  ],
  result: '0: "10-20", 1: "10", 2: "20"', resultCap: 'caps[1] is "10" and caps[2] is "20" (indexing panics if a group did not match; caps.get(1) returns an Option).',
}), R`let c = ${re(R`(\d+)-(\d+)`)}.captures("10-20").unwrap(); format!("0: {:?}, 1: {:?}, 2: {:?}", &c[0], &c[1], &c[2])`, '0: "10-20", 1: "10", 2: "20"');

add('captures-name', 'How Captures::name() works', 'Gets a capture group by its name instead of its number.', () => cells({
  call: 'caps.name("year")', note: R`caps from (?P<year>\d{4})-(?P<month>\d{2}) on "2024-03"`, text: '2024-03', outs: ['year = "2024"', 'month = "03"'],
  intro: R`(?P<year>...) gives a group a name. \d{4} means exactly 4 digits, \d{2} exactly 2.`,
  steps: [
    { cap: 'The group named year matches the first 4 digits.', mark: [[0, 4, 'warning']], out: [0] },
    { cap: 'The - matches, then the group named month matches 2 digits.', mark: [[0, 4, 'warning'], [5, 7, 'accent2']], out: [1] },
    { cap: 'caps.name("year") looks the group up by name and returns Some(Match). Names keep code readable when groups are added or moved.', mark: [[0, 4, 'success']], eq: 'name("year") → "2024"' },
  ],
  result: 'year = "2024", month = "03"', resultCap: 'caps.name("year") is Some("2024") and caps.name("month") is Some("03"). An unknown name gives None.',
}), R`let c = ${re(R`(?P<year>\d{4})-(?P<month>\d{2})`)}.captures("2024-03").unwrap(); format!("year = {:?}, month = {:?}", c.name("year").unwrap().as_str(), c.name("month").unwrap().as_str())`, 'year = "2024", month = "03"');

add('captures-iter', 'How Regex::captures_iter() works', 'Gives the capture groups of every match.', () => cells({
  call: 're.captures_iter("a=1 b=22")', note: R`re = Regex::new(r"(\w+)=(\d+)"): name = number`, text: 'a=1 b=22', outs: ['("a", "1")', '("b", "22")'],
  intro: R`captures_iter() is find_iter() with groups: for each match it yields a Captures. \w+ is one or more letters, digits or _.`,
  steps: [
    { cap: 'First match: group 1 is "a", group 2 is "1".', mark: [[0, 1, 'warning'], [2, 3, 'accent2']], out: [0] },
    { cap: 'The space does not match, so the search moves on.', mark: [[3, 4, 'danger']] },
    { cap: 'Second match: group 1 is "b", group 2 is "22".', mark: [[4, 5, 'warning'], [6, 8, 'accent2']], out: [1] },
  ],
  result: '("a", "1"), ("b", "22")', resultCap: 'Mapped with |c| (c[1].to_string(), c[2].to_string()), the matches give ("a", "1") and ("b", "22"). Parse the numbers with .parse() if you need integers.',
}), R`jd(${re(R`(\w+)=(\d+)`)}.captures_iter("a=1 b=22").map(|c| (c[1].to_string(), c[2].to_string())))`, '("a", "1"), ("b", "22")');

add('replace', 'How Regex::replace() works', 'Replaces the first match only.', () => cells({
  call: 're.replace("a1b2", "#")', note: R`re = Regex::new(r"\d"): one digit`, text: 'a1b2', outs: ['"a#b2"'],
  intro: 'replace() finds the first match and puts the replacement in its place.',
  steps: [
    { cap: 'The first match is the digit 1.', mark: [[1, 2, 'warning']] },
    { cap: 'It is replaced by "#".', mark: [[1, 2, 'success']], chars: { 1: '#' } },
    { cap: 'replace() stops after one replacement: the 2 is also a digit, but it stays.', mark: [[1, 2, 'success'], [3, 4, 'warning']], out: [0], eq: 'only the first match' },
  ],
  result: '"a#b2"', resultCap: 'replace() returns "a#b2" as a Cow<str>: if nothing matches, the original text is returned without copying. Use replace_all() for every match.',
}), R`d(${re(R`\d`)}.replace("a1b2", "#"))`, '"a#b2"');

add('replace-all', 'How Regex::replace_all() works', 'Replaces every match; $1, $2 insert the groups.', () => cells({
  call: 're.replace_all("10-20", "$2-$1")', note: R`re = Regex::new(r"(\d+)-(\d+)")`, text: '10-20', outs: ['"20-10"'],
  intro: 'replace_all() replaces every match. In the replacement, $1 and $2 stand for what group 1 and group 2 matched.',
  steps: [
    { cap: 'The match "10-20" has group 1 = "10" and group 2 = "20".', mark: [[0, 2, 'warning'], [3, 5, 'accent2']], eq: '$1 = "10", $2 = "20"' },
    { cap: 'The replacement "$2-$1" becomes "20" + "-" + "10".', mark: [[0, 2, 'accent2'], [3, 5, 'warning']], chars: { 0: '2', 1: '0', 3: '1', 4: '0' }, eq: '"$2-$1" → "20-10"' },
    { cap: 'There are no more matches, so the result is complete. With more matches, each would be swapped the same way.', mark: [[0, 5, 'success']], out: [0] },
  ],
  result: '"20-10"', resultCap: 'replace_all("10-20", "$2-$1") gives "20-10". Write ${1}x when a letter follows a group number, or $1x is read as a group named 1x.',
}), R`d(${re(R`(\d+)-(\d+)`)}.replace_all("10-20", "$2-$1"))`, '"20-10"');

add('split', 'How Regex::split() works', 'Cuts the text at every match of the pattern.', () => cells({
  call: 're.split("a,b;c")', note: 're = Regex::new(r"[,;]"): a comma or a semicolon', text: 'a,b;c', outs: ['"a"', '"b"', '"c"'],
  intro: 'split() uses the matches as separators and yields the text between them. [,;] matches one character that is , or ;.',
  steps: [
    { cap: 'The first separator is the comma. The text before it, "a", is yielded.', mark: [[1, 2, 'danger'], [0, 1, 'success']], out: [0] },
    { cap: 'The next separator is the semicolon: "b" is yielded.', mark: [[3, 4, 'danger'], [2, 3, 'success']], out: [1] },
    { cap: 'After the last separator comes "c". The separators themselves are not part of the result.', mark: [[4, 5, 'success']], out: [2] },
  ],
  result: '"a", "b", "c"', resultCap: 'split() yields "a", "b", "c". str::split can only split on fixed text; a regex can split on several kinds of separators at once.',
}), R`jd(${re('[,;]')}.split("a,b;c"))`, '"a", "b", "c"');

add('splitn', 'How Regex::splitn() works', 'Splits into at most n pieces; the last piece keeps the rest.', () => cells({
  call: 're.splitn("a,b,c,d", 2)', note: 're = Regex::new(","), at most 2 pieces', text: 'a,b,c,d', outs: ['"a"', '"b,c,d"'],
  intro: 'splitn(text, 2) splits like split(), but stops when it has 2 pieces.',
  steps: [
    { cap: 'The first comma splits off "a". That is piece 1.', mark: [[1, 2, 'danger'], [0, 1, 'success']], out: [0] },
    { cap: 'Piece 2 is the last one allowed, so it is everything that is left, commas included.', mark: [[2, 7, 'success']], out: [1], eq: '2 pieces reached' },
    { cap: 'The other commas are not used as separators.', mark: [[2, 7, 'success'], [3, 4, 'warning'], [5, 6, 'warning']] },
  ],
  result: '"a", "b,c,d"', resultCap: 'splitn(.., 2) gives "a" and "b,c,d". Useful for "key=value=more" when only the first = separates the key.',
}), R`jd(Regex::new(",").unwrap().splitn("a,b,c,d", 2))`, '"a", "b,c,d"');

add('escape', 'How regex::escape() works', 'Makes text match literally by escaping the characters that have a meaning in patterns.', () => cells({
  call: 'regex::escape("1+1=2")', note: '+ means "one or more" in a pattern', text: '1+1=2', outs: [R`"1\+1=2"`],
  intro: 'In a pattern, + is an operator. To search for the text "1+1=2" itself, the + must be escaped.',
  steps: [
    { cap: 'escape() checks every character. 1 is a plain character: unchanged.', mark: [[0, 1, 'success']] },
    { cap: R`+ has a meaning in patterns, so a backslash is put in front of it: \+.`, mark: [[1, 2, 'warning']], chars: { 1: R`\+` }, eq: R`+ → \+` },
    { cap: '1, = and 2 are plain characters.', mark: [[2, 5, 'success']] },
  ],
  result: R`"1\+1=2"`, resultCap: R`escape() returns "1\+1=2". Regex::new(&regex::escape(text)) matches exactly that text. Without escaping, "1+1=2" would match "11=2" or "111=2".`,
}), 'regex::escape("1+1=2")', R`1\+1=2`, R`"1\+1=2"`);

add('regex-set-matches', 'How RegexSet::matches() works', 'Tests many patterns against a text in one pass.', () => pick({
  call: 'set.matches("a1")', note: R`set = RegexSet::new([r"\d", r"[a-z]", r"!"])`, rows: [[R`0: \d`, '1: [a-z]', '2: !']], rowFills: ['surface'],
  intro: 'A RegexSet compiles several patterns together. matches() scans the text once and reports which patterns match somewhere.',
  steps: [
    { cap: R`Pattern 0, \d, matches the 1 in "a1".`, src: ['a0'], mark: { success: ['a0'] }, eq: '"a1": 1 is a digit' },
    { cap: 'Pattern 1, [a-z], matches the a.', src: ['a1'], mark: { success: ['a1'] }, eq: '"a1": a is a lowercase letter' },
    { cap: 'Pattern 2, !, matches nowhere: there is no ! in "a1".', src: ['a2'], srcColor: 'danger', eq: 'no !' },
    { cap: 'matches() returns a SetMatches holding the indices 0 and 1. It does not say where each match is; use the separate Regex for that.', mark: { dim: ['a2'] } },
  ],
  result: 'patterns 0, 1 match', resultCap: 'set.matches("a1").into_iter() yields 0, 1. Handy for routing: one scan tells which of many rules apply.',
}), R`let s = regex::RegexSet::new([r"\d", r"[a-z]", r"!"]).unwrap(); format!("patterns {} match", j(s.matches("a1").into_iter()))`, 'patterns 0, 1 match');

module.exports = A;
