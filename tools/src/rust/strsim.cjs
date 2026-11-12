// strsim: 6 animations (#79-84).
const { Scene, pick, lines } = require('./scene.cjs');
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });

// two words, one box per letter, aligned by position
function twoWords(call, note, a, b) {
  const sc = new Scene(call, note);
  const n = Math.max(a.length, b.length); const x = (i) => 500 + (i - (n - 1) / 2) * 70;
  [...a].forEach((c, i) => sc.box('a' + i, c, x(i), 210, { w: 58, h: 56 }));
  [...b].forEach((c, i) => sc.box('b' + i, c, x(i), 300, { w: 58, h: 56, fill: 'accent2' }));
  sc.text('eq', '', 500, 400, { size: 26, fill: 'warning' });
  return { sc, x };
}

add('levenshtein', 'How strsim::levenshtein() works', 'The fewest single-letter edits that turn one word into the other.', () => {
  const sc = new Scene('strsim::levenshtein("kitten", "sitting")', 'edits: substitute, insert or delete one letter');
  const x = (i) => 500 + (i - 3) * 72;
  [...'sitting'].forEach((c, i) => sc.box('t' + i, c, x(i), 200, { w: 58, h: 56, fill: 'accent2' }));
  [...'kitten'].forEach((c, i) => sc.box('w' + i, c, x(i), 300, { w: 58, h: 56, fill: 'surface' }));
  sc.box('w6', 'g', x(6), 300, { w: 58, h: 56, fill: 'success', visible: false });
  sc.text('eq', '', 500, 400, { size: 26, fill: 'warning' });
  sc.text('lt', 'target', x(0) - 90, 200, { size: 20 }); sc.text('lw', 'word', x(0) - 80, 300, { size: 20 });
  sc.intro('levenshtein() counts the smallest number of edits from "kitten" (bottom) to "sitting" (top). It fills a table of all prefixes to be sure the count is minimal.');
  sc.step('Edit 1: substitute k → s.', [sc.lab('w0', 's'), sc.hi(['w0'], 'warning'), sc.say('eq', 'kitten → sitten (1)')]);
  sc.step('Edit 2: substitute e → i.', [sc.hi(['w0'], 'success'), sc.lab('w4', 'i'), sc.hi(['w4'], 'warning'), sc.say('eq', 'sitten → sittin (2)')]);
  sc.step('Edit 3: insert g at the end.', [sc.hi(['w4'], 'success'), sc.show(['w6']), sc.say('eq', 'sittin → sitting (3)')]);
  sc.step('The other letters, i, t, t and n, already match. No way with only 2 edits exists.', [sc.hi(['w1', 'w2', 'w3', 'w5'], 'accent'), sc.say('eq', 'minimum: 3 edits')]);
  sc.result('3', 'levenshtein("kitten", "sitting") is 3. It works on chars, so "é" counts as one letter.', sc.say('eq', ''));
  return sc.build();
}, 'd(strsim::levenshtein("kitten", "sitting"))', '3');

add('damerau-levenshtein', 'How strsim::damerau_levenshtein() works', 'Like levenshtein(), but swapping two neighbouring letters counts as one edit.', () => {
  const { sc, x } = twoWords('strsim::damerau_levenshtein("ab", "ba")', 'a swap of neighbours is a single edit', 'ab', 'ba');
  sc.intro('Typing errors often swap two letters. damerau_levenshtein() treats that swap (a transposition) as one edit.');
  sc.step('Plain levenshtein() needs 2 edits: substitute a → b and b → a.', [sc.hi(['a0', 'a1'], 'danger'), sc.say('eq', 'levenshtein: 2')]);
  sc.step('damerau_levenshtein() sees that a and b just changed places.', [sc.hi(['a0', 'a1'], 'warning'), sc.mv('a0', x(1), 210), sc.mv('a1', x(0), 210), sc.say('eq', 'swap a ↔ b')]);
  sc.step('One transposition and the words are equal.', [sc.hi(['a0', 'a1'], 'success'), sc.say('eq', 'damerau: 1')]);
  sc.result('1 (levenshtein: 2)', 'damerau_levenshtein("ab", "ba") is 1. osa_distance() is a cheaper variant that allows each letter to be swapped only once.', sc.say('eq', ''));
  return sc.build();
}, 'format!("{} (levenshtein: {})", strsim::damerau_levenshtein("ab", "ba"), strsim::levenshtein("ab", "ba"))', '1 (levenshtein: 2)');

add('hamming', 'How strsim::hamming() works', 'Counts the positions where two equally long strings differ.', () => {
  const { sc } = twoWords('strsim::hamming("karolin", "kathrin")', 'position by position; no inserts or deletes', 'karolin', 'kathrin');
  sc.intro('hamming() compares the letters at each position. It only works when both strings have the same length.');
  sc.step('k and a match at positions 0 and 1.', [sc.hi(['a0', 'a1', 'b0', 'b1'], 'success')]);
  sc.step('Positions 2, 3 and 4 differ: r/t, o/h, l/r.', [sc.hi(['a2', 'a3', 'a4', 'b2', 'b3', 'b4'], 'danger'), sc.say('eq', '3 differences')]);
  sc.step('i and n match at the end. The count is 3.', [sc.hi(['a5', 'a6', 'b5', 'b6'], 'success'), sc.say('eq', 'Ok(3)')]);
  sc.step('With different lengths, like "ab" and "abc", there is no position-by-position answer, so it returns an error.', sc.say('eq', 'hamming("ab", "abc") → Err(DifferentLengthArgs)'));
  sc.result('Ok(3) / Err(DifferentLengthArgs)', 'hamming() returns Result<usize, StrSimError>. Use levenshtein() when lengths can differ.', sc.say('eq', ''));
  return sc.build();
}, 'format!("{:?} / {:?}", strsim::hamming("karolin", "kathrin"), strsim::hamming("ab", "abc"))', 'Ok(3) / Err(DifferentLengthArgs)');

add('jaro-winkler', 'How strsim::jaro_winkler() works', 'A similarity score from 0 to 1 that rewards a shared beginning.', () => lines({
  call: 'strsim::jaro_winkler("martha", "marhta")', note: '1.0 = identical, 0.0 = nothing in common',
  lines: ['matching letters: m, a, r, t, h, a → m = 6', 't and h are in swapped order → transpositions = 1', 'jaro = (6/6 + 6/6 + (6 − 1)/6) / 3 ≈ 0.944', 'shared prefix "mar": ℓ = 3, p = 0.1', '0.944 + 3 × 0.1 × (1 − 0.944) ≈ 0.961'],
  intro: 'jaro_winkler() first computes the Jaro similarity, then gives a bonus for a common prefix of up to 4 letters.',
  steps: [
    { cap: 'Letters count as matching when they are equal and not too far apart. All 6 letters match.', show: [0] },
    { cap: 'Of the matching letters, t, h and h, t are in a different order: that is 2 half-transpositions = 1.', show: [1] },
    { cap: 'The Jaro score averages: matches in word 1, matches in word 2, and matches that are in order.', show: [2] },
    { cap: 'Both words start with "mar", 3 letters.', show: [3] },
    { cap: 'Winkler\'s bonus moves the score closer to 1 for each prefix letter.', show: [4] },
  ],
  result: '0.961', resultCap: 'jaro_winkler("martha", "marhta") ≈ 0.961 (printed with 3 decimals). Good for short strings such as names.',
}), 'format!("{:.3}", strsim::jaro_winkler("martha", "marhta"))', '0.961');

add('normalized-levenshtein', 'How strsim::normalized_levenshtein() works', 'The edit distance turned into a similarity from 0 to 1.', () => lines({
  call: 'strsim::normalized_levenshtein("kitten", "sitting")', note: '1 − distance / length of the longer string',
  lines: ['levenshtein("kitten", "sitting") = 3', 'the longer string, "sitting", has 7 letters', '1 − 3 / 7 = 4 / 7', '≈ 0.571'],
  intro: 'A distance of 3 means a lot for 4-letter words and little for 40-letter ones. normalized_levenshtein() takes the length into account.',
  steps: [
    { cap: 'First the plain edit distance: 3.', show: [0] },
    { cap: 'At most 7 edits can be needed, the length of the longer string.', show: [1] },
    { cap: 'So the strings are 3/7 different, and 1 − 3/7 similar.', show: [2] },
    { cap: 'As a decimal: about 0.571.', show: [3] },
  ],
  result: '0.571', resultCap: 'normalized_levenshtein() ≈ 0.571 (3 decimals). Two empty strings give 1.0.',
}), 'format!("{:.3}", strsim::normalized_levenshtein("kitten", "sitting"))', '0.571');

add('sorensen-dice', 'How strsim::sorensen_dice() works', 'Similarity from the letter pairs (bigrams) two strings share.', () => pick({
  call: 'strsim::sorensen_dice("night", "nacht")', note: '2 × shared pairs / (pairs in a + pairs in b)', rows: [['ni', 'ig', 'gh', 'ht'], ['na', 'ac', 'ch', 'ht']], rowNames: ['night', 'nacht'],
  intro: 'sorensen_dice() cuts each string into overlapping pairs of letters, called bigrams.',
  steps: [
    { cap: '"night" has 4 bigrams: ni, ig, gh, ht.', src: ['a0', 'a1', 'a2', 'a3'] },
    { cap: '"nacht" has 4 bigrams: na, ac, ch, ht.', src: ['b0', 'b1', 'b2', 'b3'] },
    { cap: 'Only "ht" is in both.', src: ['a3', 'b3'], mark: { success: ['a3', 'b3'] }, eq: 'shared: 1' },
    { cap: 'Score = 2 × 1 / (4 + 4) = 2 / 8.', eq: '2 × 1 / 8 = 0.25' },
  ],
  result: '0.25', resultCap: 'sorensen_dice("night", "nacht") is 0.25. Whitespace is ignored, and the order of the pairs does not matter.',
}), 'd(strsim::sorensen_dice("night", "nacht"))', '0.25');

module.exports = A;
