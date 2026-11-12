const fs = require('fs'), path = require('path');
const { B, M, mv, mvy, fill, fade, show, lab, T, slides, L, chunkAnim, uniqAnim, groupAnim } = require('./lib.cjs');
const ROOT = require('../config.cjs').INDEX_ROOT;

function anim(sym, aliases, title, description, built) {
  return { symbol: sym, aliases, title, description, actors: built.b.a, slides: built.slides };
}

// ===== custom animations =====
function flattenAnim({ call, fn, top, result, depthNote, finalExtra = '' }) {
  // top: [{id,label,w,x,pieces:[{label,w}]}|{id,label,w,x,single:true}] ; result slots
  const b = new B(); b.title(call); b.note(depthNote);
  return b;
}

// lodash flatten([1, [2, [3, [4]], 5]]) = [1, 2, [3, [4]], 5]
function lodashFlatten() {
  const b = new B(); b.title('flatten([1, [2, [3, [4]], 5]])'); b.note('removes one level of nesting');
  b.item('a', '1', 250, 220); b.item('big', '[2, [3, [4]], 5]', 580, 220, { w: 380, size: 28 });
  b.item('p1', '2', 300, 400, { visible: false });
  b.item('p2', '[3, [4]]', 560, 400, { w: 160, visible: false, size: 26 });
  b.item('p3', '5', 710, 400, { visible: false });
  b.item('p0', '1', 190, 400, { visible: false });
  return { b, slides: slides([
    ['flatten() gets an array with a number 1 and one inner array [2, [3, [4]], 5].'],
    ['The 1 is not an array, so it goes straight into the result.', M(show(b, ['p0']), fade(b, ['a'], 0.15)), 700],
    ['The inner array is opened: its items 2, [3, [4]] and 5 are copied into the result.', M(show(b, ['p1', 'p2', 'p3']), fade(b, ['big'], 0.15), fill(b, ['p0', 'p1', 'p2', 'p3'], 'success'))],
    ['Only ONE level is removed. [3, [4]] is still an array, so it stays nested.', fill(b, ['p2'], 'warning'), 600],
    ['flatten([1, [2, [3, [4]], 5]]) = [1, 2, [3, [4]], 5]', T('note', 'result: [1, 2, [3, [4]], 5]', { fill: 'success' }), 500],
  ]) };
}

function lodashDebounce() {
  const b = new B(); b.title('debounce(func, 300)'); b.note('calls at 0, 100 and 200 ms (default options)');
  b.raw('axis', { type: 'line', x: 100, y: 400, width: 800, height: 0, stroke: 'muted', strokeWidth: 3 });
  [[0, '0 ms'], [100, '100'], [200, '200'], [500, '500']].forEach(([t, l]) => b.text('tl' + t, l, 100 + t, 440, { size: 22 }));
  [0, 100, 200].forEach((t, i) => {
    b.raw('c' + i, { type: 'circle', x: 100 + t, y: 400, radius: 16, fill: 'accent', visible: false });
    b.text('cl' + i, 'call ' + (i + 1), 100 + t, 355, { size: 22, fill: 'accent', visible: false });
  });
  b.raw('timer', { type: 'rectangle', x: 250, y: 300, width: 300, height: 26, cornerRadius: 6, fill: 'warning', visible: false });
  b.text('tlab', 'wait = 300 ms', 250, 262, { size: 22, fill: 'warning', visible: false });
  b.raw('run', { type: 'circle', x: 600, y: 400, radius: 20, fill: 'success', visible: false });
  b.text('rl', 'func runs', 600, 355, { size: 22, fill: 'success', visible: false });
  return { b, slides: slides([
    ['A debounced function waits for calm. We call it three times: at 0, 100 and 200 ms, with wait = 300 ms.'],
    ['Call 1 at 0 ms starts a 300 ms timer. func has not run yet.', { c0: { visible: true }, cl0: { visible: true }, timer: { visible: true }, tlab: { visible: true } }, 700],
    ['Call 2 at 100 ms arrives before the timer ends, so the timer restarts: it now ends at 400 ms.', { c1: { visible: true }, cl1: { visible: true }, timer: { x: 350 }, tlab: { x: 350 } }],
    ['Call 3 at 200 ms restarts the timer again. It now ends at 500 ms.', { c2: { visible: true }, cl2: { visible: true }, timer: { x: 450 }, tlab: { x: 450 } }],
    ['No more calls arrive, so at 500 ms (300 ms after the last call) func runs once, with the arguments of the last call.', { timer: { opacity: 0.2 }, tlab: { visible: false }, run: { visible: true }, rl: { visible: true } }],
    ['3 calls became 1 run: debounce(func, 300) runs func once, 300 ms after the last call.', T('note', 'result: func ran once, at 500 ms', { fill: 'success' }), 500],
  ]) };
}

function calendarStrip(labels, x0, dx, y, w) { return labels.map((_, i) => x0 + i * dx); }

function addDaysAnim() {
  const b = new B(); b.title('addDays(new Date(2024, 0, 30), 5)'); b.note('30 January 2024 + 5 days');
  const labels = ['Jan 30', 'Jan 31', 'Feb 1', 'Feb 2', 'Feb 3', 'Feb 4'];
  labels.forEach((l, i) => b.item('d' + i, l, 170 + i * 132, 260, { w: 110, fill: i === 0 ? 'accent' : 'surface', size: 26 }));
  labels.slice(1).forEach((_, i) => b.text('s' + i, '+' + (i + 1), 170 + (i + 1) * 132, 340, { size: 26, fill: 'warning', visible: false }));
  return { b, slides: slides([
    ['addDays() gets the date 30 January 2024 and the number 5.'],
    ['It counts 5 days forward. Day 31 of January is next, and then the date rolls over into February.', M(...[1, 2, 3, 4, 5].map(i => fill(b, ['d' + i], 'warning')), ...[0, 1, 2, 3, 4].map(i => ({ ['s' + i]: { visible: true } })))],
    ['After 5 days we land on 4 February 2024. (Technically it adds 5 to the day of the month, 30 + 5 = 35, and the Date object turns 35 January into 4 February.)', M(fill(b, ['d5'], 'success'), fill(b, ['d1', 'd2', 'd3', 'd4'], 'surface')), 800],
    ['addDays(new Date(2024, 0, 30), 5) = 4 February 2024', T('note', 'result: Sun Feb 04 2024', { fill: 'success' }), 500],
  ]) };
}

function diffDaysAnim() {
  const b = new B(); b.title('differenceInDays(Jan 15, Jan 1)');
  b.note('new Date(2024, 0, 15) and new Date(2024, 0, 1)');
  b.item('d1', 'Jan 1', 150, 300, { w: 120, fill: 'accent', size: 26 });
  b.item('d2', 'Jan 15', 850, 300, { w: 120, fill: 'accent', size: 26 });
  b.raw('arr', { type: 'arrow', x: 850, y: 400, width: -700, height: 0, stroke: 'warning', strokeWidth: 4, visible: false });
  b.text('cnt', '14 days', 500, 360, { size: 30, fill: 'warning', visible: false });
  return { b, slides: slides([
    ['differenceInDays() gets two dates: 15 January 2024 and 1 January 2024.'],
    ['It counts how many whole days lie between them: from 1 January to 15 January is 14 days.', { arr: { visible: true }, cnt: { visible: true } }],
    ['The first date is later than the second, so the answer is positive (an earlier first date would give a negative number).', { arr: { stroke: 'success' } }, 600],
    ['differenceInDays(new Date(2024, 0, 15), new Date(2024, 0, 1)) = 14', M(T('note', 'result: 14', { fill: 'success' }), { cnt: { fill: 'success' }, arr: { stroke: 'success' } }), 500],
  ]) };
}

function startOfWeekAnim() {
  const b = new B(); b.title('startOfWeek(new Date(2024, 0, 17))'); b.note('17 January 2024 is a Wednesday');
  const days = ['Sun 14', 'Mon 15', 'Tue 16', 'Wed 17', 'Thu 18', 'Fri 19', 'Sat 20'];
  days.forEach((l, i) => b.item('d' + i, l, 150 + i * 116, 260, { w: 104, fill: i === 3 ? 'accent' : 'surface', size: 24 }));
  b.raw('arr', { type: 'arrow', x: 150 + 3 * 116, y: 360, width: -3 * 116, height: 0, stroke: 'warning', strokeWidth: 4, visible: false });
  b.text('al', 'back to the first day of the week', 330, 405, { size: 24, fill: 'warning', visible: false });
  return { b, slides: slides([
    ['startOfWeek() gets a date on Wednesday 17 January 2024.'],
    ['By default a week starts on Sunday, so it steps back from Wednesday to Sunday: 3 days.', { arr: { visible: true }, al: { visible: true } }],
    ['It lands on Sunday 14 January and sets the time to midnight (00:00).', M(fill(b, ['d0'], 'success'), fill(b, ['d3'], 'surface')), 800],
    ['startOfWeek(new Date(2024, 0, 17)) = Sunday 14 January 2024, 00:00', T('note', 'result: Sun Jan 14 2024, 00:00', { fill: 'success' }), 500],
  ]) };
}

function npClip() {
  const b = new B(); b.title('np.clip([1, 5, 9, 12], 3, 10)'); b.note('a_min = 3, a_max = 10', 125); b.a.note.fill = 'warning';
  [1, 5, 9, 12].forEach((v, i) => b.item('g' + i, String(v), 290 + i * 140, 260));
  return { b, slides: slides([
    ['np.clip() gets the array [1, 5, 9, 12] and the limits 3 and 10.'],
    ['Each value is checked. 1 is below the minimum 3 and 12 is above the maximum 10 (red). 5 and 9 are inside the range (green).', M(fill(b, ['g0', 'g3'], 'danger'), fill(b, ['g1', 'g2'], 'success'))],
    ['Values outside the range are replaced by the nearest limit: 1 becomes 3 and 12 becomes 10. Values inside stay the same.', M(lab('g0', '3'), lab('g3', '10'), fill(b, ['g0', 'g3'], 'success'))],
    ['np.clip([1, 5, 9, 12], 3, 10) = [3, 5, 9, 10] (a new NumPy array)', T('note', 'result: [3, 5, 9, 10]', { fill: 'success' }), 500],
  ]) };
}

function npArgsort() {
  const b = new B(); b.title('np.argsort([30, 10, 20])'); b.note('returns the positions (indexes), not the values');
  [30, 10, 20].forEach((v, i) => { b.item('g' + i, String(v), 300 + i * 200, 230, { w: 100 }); b.text('ix' + i, 'index ' + i, 300 + i * 200, 300, { size: 22 }); });
  [1, 2, 0].forEach((v, i) => b.item('r' + i, String(v), 300 + i * 200, 440, { w: 100, fill: 'success', visible: false }));
  b.text('rl', 'result', 130, 440, { size: 22, visible: false });
  const step = (src, r, cap) => [cap, M(fill(b, [src], 'warning'), show(b, [r]), { rl: { visible: true } })];
  return { b, slides: slides([
    ['np.argsort() gets [30, 10, 20]. Each value sits at an index: 30 at 0, 10 at 1, 20 at 2.'],
    step('g1', 'r0', 'The smallest value is 10 and it sits at index 1, so the result starts with 1.'),
    step('g2', 'r1', 'The next smallest is 20, at index 2.'),
    step('g0', 'r2', 'The largest is 30, at index 0.'),
    ['np.argsort([30, 10, 20]) = [1, 2, 0]. Reading the original array in this order gives it sorted: 10, 20, 30.', T('note', 'result: [1, 2, 0]', { fill: 'success' }), 500],
  ]) };
}

function npCumsum() {
  const b = new B(); b.title('np.cumsum([1, 2, 3, 4])'); b.note('running total');
  [1, 2, 3, 4].forEach((v, i) => b.item('g' + i, String(v), 260 + i * 160, 230));
  [1, 3, 6, 10].forEach((v, i) => b.item('r' + i, String(v), 260 + i * 160, 430, { fill: 'success', visible: false }));
  b.text('eq', '', 500, 340, { size: 28, fill: 'warning' });
  return { b, slides: slides([
    ['np.cumsum() gets [1, 2, 3, 4] and adds the values up as it goes.'],
    ['The first result is just the first value: 1.', M(show(b, ['r0']), T('eq', '1'))],
    ['Add the next value to the total so far: 1 + 2 = 3.', M(show(b, ['r1']), T('eq', '1 + 2 = 3'))],
    ['Again: 3 + 3 = 6.', M(show(b, ['r2']), T('eq', '3 + 3 = 6'))],
    ['And again: 6 + 4 = 10.', M(show(b, ['r3']), T('eq', '6 + 4 = 10'))],
    ['np.cumsum([1, 2, 3, 4]) = [1, 3, 6, 10]', M(T('note', 'result: [1, 3, 6, 10]', { fill: 'success' }), T('eq', '')), 500],
  ]) };
}

function npReshape() {
  const b = new B(); b.title('np.reshape(np.arange(6), (2, 3))'); b.note('np.arange(6) is [0, 1, 2, 3, 4, 5]');
  for (let i = 0; i < 6; i++) b.item('g' + i, String(i), 200 + i * 120, 220, { w: 70, h: 70 });
  const pos = i => [380 + (i % 3) * 120, 360 + Math.floor(i / 3) * 100];
  const row = r => { const c = {}; [0, 1, 2].forEach(k => { const i = r * 3 + k; c['g' + i] = { x: pos(i)[0], y: pos(i)[1] }; }); return M(c, fill(b, [0, 1, 2].map(k => 'g' + (r * 3 + k)), 'success')); };
  return { b, slides: slides([
    ['np.reshape() gets six numbers in a row and the new shape (2, 3): 2 rows and 3 columns.'],
    ['It fills the first row from the start of the data: 0, 1, 2.', row(0)],
    ['Then it fills the second row with the next values: 3, 4, 5. The values are not changed, only how they are arranged.', row(1)],
    ['np.reshape(np.arange(6), (2, 3)) = [[0, 1, 2], [3, 4, 5]]', T('note', 'result: [[0, 1, 2], [3, 4, 5]]', { fill: 'success' }), 500],
  ]) };
}

function miWindowed() {
  const b = new B(); b.title('windowed([1, 2, 3, 4, 5], 3)'); b.note('window size n = 3, moves one step at a time');
  [1, 2, 3, 4, 5].forEach((v, i) => b.item('g' + i, String(v), 240 + i * 130, 220, { w: 90 }));
  b.raw('win', { type: 'rectangle', x: 240 + 130, y: 220, width: 350, height: 120, cornerRadius: 14, fill: 'none', stroke: 'warning', strokeWidth: 4, visible: false });
  ['(1, 2, 3)', '(2, 3, 4)', '(3, 4, 5)'].forEach((t, i) => b.text('o' + i, t, 270 + i * 230, 430, { size: 30, fill: 'success', visible: false }));
  return { b, slides: slides([
    ['windowed() gets [1, 2, 3, 4, 5] and a window size of 3.'],
    ['The window covers the first 3 items and gives the tuple (1, 2, 3).', { win: { visible: true }, o0: { visible: true } }],
    ['The window slides one step to the right: (2, 3, 4).', { win: { x: 240 + 260 }, o1: { visible: true } }],
    ['One more step: (3, 4, 5). Now the window touches the end, so it stops.', { win: { x: 240 + 390 }, o2: { visible: true } }],
    ['list(windowed([1, 2, 3, 4, 5], 3)) = [(1, 2, 3), (2, 3, 4), (3, 4, 5)]', T('note', 'result: (1, 2, 3), (2, 3, 4), (3, 4, 5)', { fill: 'success' }), 500],
  ]) };
}

function nestedFlatten({ call, fn, parts, result, oneLevel }) {
  // parts: list of {label, items:[...]|null (null = plain value)} ; every sublist opened one level
  const b = new B(); b.title(call); b.note(oneLevel ? 'removes one level of nesting' : 'joins the inner lists');
  const flat = []; parts.forEach(p => (p.items ? p.items : [p.label]).forEach(v => flat.push(v)));
  const n = flat.length, rx = i => 500 - (n - 1) * 50 + i * 100;
  const widths = parts.map(p => (p.items ? 70 + p.items.length * 50 : 80));
  const total = widths.reduce((a, c) => a + c, 0) + (parts.length - 1) * 60;
  let cx = 500 - total / 2; const tops = [];
  parts.forEach((p, i) => { tops.push(cx + widths[i] / 2); cx += widths[i] + 60; });
  parts.forEach((p, i) => b.item('s' + i, p.label, tops[i], 220, { w: widths[i], size: 28 }));
  flat.forEach((v, i) => b.item('r' + i, String(v), rx(i), 420, { w: 70, h: 70, fill: 'success', visible: false }));
  let k = 0; const sl = [[`${fn} gets ${L(parts.map(p => p.label))}: ${parts.length} inner lists.`]];
  parts.forEach((p, i) => {
    const ids = (p.items || [p.label]).map(() => 'r' + (k++));
    sl.push([`The items of ${p.label} are copied into the result, in order.`, M(show(b, ids), fade(b, ['s' + i], 0.2))]);
  });
  sl.push([`${call} = ${result}`, T('note', 'result: ' + result, { fill: 'success' }), 500]);
  return { b, slides: slides(sl) };
}

function guavaPadStart() {
  const b = new B(); b.title('Strings.padStart("7", 3, \'0\')'); b.note('minLength = 3, padChar = \'0\'');
  [0, 1, 2].forEach(i => b.raw('slot' + i, { type: 'rectangle', x: 380 + i * 120, y: 300, width: 100, height: 100, cornerRadius: 10, fill: 'none', stroke: 'muted', strokeWidth: 2, visible: false }));
  b.item('s', '7', 190, 300, { w: 100, h: 100 });
  b.item('p0', '0', 380, 300, { w: 100, h: 100, fill: 'warning', visible: false });
  b.item('p1', '0', 500, 300, { w: 100, h: 100, fill: 'warning', visible: false });
  return { b, slides: slides([
    ['padStart() gets the string "7" (length 1), a minimum length of 3 and the pad character \'0\'.'],
    ['The result must be 3 characters long, so we need 3 - 1 = 2 padding characters. The original string goes at the end.', { slot0: { visible: true }, slot1: { visible: true }, slot2: { visible: true }, s: { x: 620 } }],
    ['The 2 pad characters \'0\' are added at the START (the left side).', show(b, ['p0', 'p1']), 800],
    ['Strings.padStart("7", 3, \'0\') = "007"', M(T('note', 'result: "007"', { fill: 'success' }), fill(b, ['s'], 'success')), 500],
  ]) };
}

function guavaConstrain() {
  const b = new B(); b.title('Ints.constrainToRange(15, 0, 10)');
  b.raw('axis', { type: 'line', x: 100, y: 320, width: 800, height: 0, stroke: 'muted', strokeWidth: 3 });
  b.raw('lo', { type: 'line', x: 100, y: 260, width: 0, height: 120, stroke: 'warning', strokeWidth: 4 });
  b.raw('hi', { type: 'line', x: 500, y: 260, width: 0, height: 120, stroke: 'warning', strokeWidth: 4 });
  b.text('lol', 'min = 0', 100, 420, { fill: 'warning' }); b.text('hil', 'max = 10', 500, 420, { fill: 'warning' });
  b.raw('val', { type: 'circle', x: 700, y: 320, radius: 24, fill: 'accent' });
  b.text('vl', '15', 700, 250, { size: 28, fill: 'text' });
  return { b, slides: slides([
    ['constrainToRange() gets the value 15 and the range from min = 0 to max = 10.'],
    ['It compares the value with the range. 15 is above the maximum 10, so it is out of range.', { val: { fill: 'danger' } }, 500],
    ['The value is moved back to the nearest limit, the maximum: 10.', { val: { x: 500, fill: 'success' }, vl: { x: 500, text: '10' } }],
    ['Ints.constrainToRange(15, 0, 10) = 10. A value already inside the range comes back unchanged.', T('vl', '10', { fill: 'success' }), 300],
  ]) };
}

function langAbbreviate() {
  const s = 'abcdefghijkl'.split('');
  const b = new B(); b.title('StringUtils.abbreviate("abcdefghijkl", 9)'); b.note('maxWidth = 9 (the "..." counts too)');
  s.forEach((c, i) => b.item('c' + i, c, 160 + i * 62, 260, { w: 54, h: 70, size: 28 }));
  b.raw('lim', { type: 'line', x: 160 + 8 * 62 + 31, y: 190, width: 0, height: 140, stroke: 'warning', strokeWidth: 4, visible: false });
  b.text('ll', 'limit: 9 characters', 160 + 4 * 62 + 31 + 124, 170, { size: 22, fill: 'warning', visible: false });
  const tail = [9, 10, 11].map(i => 'c' + i), dots = [6, 7, 8].map(i => 'c' + i), keep = [0, 1, 2, 3, 4, 5].map(i => 'c' + i);
  return { b, slides: slides([
    ['abbreviate() gets the 12-character string "abcdefghijkl" and maxWidth 9.'],
    ['The string is longer than 9, so it must be shortened. The result may be at most 9 characters, including the "..." at the end.', M({ lim: { visible: true }, ll: { visible: true } }, fill(b, tail, 'danger'))],
    ['The "..." takes 3 of the 9 characters, so only the first 6 letters can stay. Everything after them is cut off.', M(fade(b, tail, 0.15), fill(b, dots, 'danger'), fill(b, keep, 'success'))],
    ['The 3 free places are filled with the three dots.', M(...dots.map(id => lab(id, '.')), fill(b, dots, 'warning'), { lim: { visible: false }, ll: { visible: false } }), 700],
    ['StringUtils.abbreviate("abcdefghijkl", 9) = "abcdef..."', T('note', 'result: "abcdef..."', { fill: 'success' }), 500],
  ]) };
}

function langCenter() {
  const b = new B(); b.title('StringUtils.center("abc", 7)'); b.note('size = 7  ( · means a space )');
  for (let i = 0; i < 7; i++) b.raw('slot' + i, { type: 'rectangle', x: 200 + i * 100, y: 320, width: 84, height: 84, cornerRadius: 10, fill: 'none', stroke: 'muted', strokeWidth: 2, visible: false });
  ['a', 'b', 'c'].forEach((c, i) => b.item('c' + i, c, 150 + i * 90, 220, { w: 70, h: 70 }));
  [0, 1, 5, 6].forEach(i => b.item('p' + i, '·', 200 + i * 100, 320, { w: 84, h: 84, fill: 'warning', visible: false }));
  const slotsOn = {}; for (let i = 0; i < 7; i++) slotsOn['slot' + i] = { visible: true };
  return { b, slides: slides([
    ['center() gets the string "abc" (3 characters) and a total size of 7.'],
    ['The result must be 7 wide, so 7 - 3 = 4 spaces are needed. They are split into 2 on the left and 2 on the right.', slotsOn, 600],
    ['The text goes in the middle, after the 2 left spaces.', mv(['c0', 'c1', 'c2'], [400, 500, 600], 320), 900],
    ['Now the spaces are added on both sides.', M(show(b, ['p0', 'p1', 'p5', 'p6']), fill(b, ['c0', 'c1', 'c2'], 'success')), 800],
    ['StringUtils.center("abc", 7) = "  abc  " (2 spaces, abc, 2 spaces)', T('note', 'result: "  abc  "', { fill: 'success' }), 500],
  ]) };
}

function langReverse() {
  const b = new B(); b.title('ArrayUtils.reverse(new int[] {1, 2, 3, 4})'); b.note('changes the array itself and returns nothing');
  [1, 2, 3, 4].forEach((v, i) => b.item('g' + i, String(v), 250 + i * 167, 270));
  return { b, slides: slides([
    ['reverse() gets the array {1, 2, 3, 4}.'],
    ['It works from both ends towards the middle. First it picks the first and the last element.', fill(b, ['g0', 'g3'], 'warning'), 600],
    ['It swaps them: 1 and 4 change places.', M(mv(['g0', 'g3'], [250 + 3 * 167, 250]), fill(b, ['g0', 'g3'], 'success')), 1000],
    ['Next it picks the second and the second-to-last element (2 and 3) and swaps them.', M(fill(b, ['g1', 'g2'], 'warning'), mv(['g1', 'g2'], [250 + 2 * 167, 250 + 167])), 1000],
    ['The pointers have met in the middle, so it stops. The same array now holds {4, 3, 2, 1}. The method returns nothing: the array was changed in place.', M(fill(b, ['g1', 'g2'], 'success'), T('note', 'array is now {4, 3, 2, 1}', { fill: 'success' })), 500],
  ]) };
}

function itInterleave() {
  const b = new B(); b.title('(1..7).interleave(vec![-1, -2])'); b.note('takes turns: one from each, until both are empty');
  [1, 2, 3, 4, 5, 6].forEach((v, i) => b.item('a' + i, String(v), 150 + i * 90, 190, { w: 70, h: 70 }));
  [-1, -2].forEach((v, i) => b.item('b' + i, String(v), 150 + i * 90, 300, { w: 70, h: 70, fill: 'accent2' }));
  b.text('la', '(1..7)', 80, 190, { size: 20 }); b.a.la.x = 100; b.a.la.y = 140;
  b.text('lb', 'vec![-1, -2]', 140, 350, { size: 20 }); b.a.lb.y = 355;
  const x = i => 150 + i * 90;
  return { b, slides: slides([
    ['interleave() gets two iterators: 1, 2, 3, 4, 5, 6 (from 1..7) and -1, -2.'],
    ['It takes one item from each in turn: 1, then -1, then 2, then -2.', M(mv(['a0', 'b0', 'a1', 'b1'], [x(0), x(1), x(2), x(3)], 440), fill(b, ['a0', 'a1'], 'success'), fill(b, ['b0', 'b1'], 'success'))],
    ['The second iterator has run out. interleave() keeps going with the first one until it is empty too: 3, 4, 5, 6.', M(mv(['a2', 'a3', 'a4', 'a5'], [x(4), x(5), x(6), x(7)], 440), fill(b, ['a2', 'a3', 'a4', 'a5'], 'success'))],
    ['(1..7).interleave(vec![-1, -2]) yields 1, -1, 2, -2, 3, 4, 5, 6', T('note', 'result: 1, -1, 2, -2, 3, 4, 5, 6', { fill: 'success' }), 500],
  ]) };
}

function itDedup() {
  const v = [1, 1, 2, 3, 3, 2, 2];
  const b = new B(); b.title('vec![1, 1, 2, 3, 3, 2, 2].into_iter().dedup()'); b.note('removes repeats that sit right next to each other');
  v.forEach((x, i) => b.item('g' + i, String(x), 190 + i * 100, 230, { w: 76, h: 76 }));
  const keep = [0, 2, 3, 5], drop = [1, 4, 6];
  return { b, slides: slides([
    ['dedup() gets the sequence 1, 1, 2, 3, 3, 2, 2.'],
    ['Each item is compared with the item just before it. A second 1, a second 3 and a second 2 are equal to their neighbour, so they are repeats (red).', M(fill(b, drop.map(i => 'g' + i), 'danger'), fill(b, keep.map(i => 'g' + i), 'success')), 1000],
    ['The 2 at position 5 stays: the item before it is 3, not 2. Only neighbours are compared, not the whole sequence.', fill(b, ['g5'], 'warning'), 700],
    ['Repeats are dropped; the first item of every run is kept, in order.', M(fade(b, drop.map(i => 'g' + i), 0.15), mv(keep.map(i => 'g' + i), [320, 440, 560, 680], 420))],
    ['dedup() yields 1, 2, 3, 2', T('note', 'result: 1, 2, 3, 2', { fill: 'success' }), 500],
  ]) };
}

function phpFlatten() {
  const b = new B(); b.title('Arr::flatten([1, [2, 3], [4, [5]]])'); b.note('depth defaults to INF: flattens every level');
  b.item('a', '1', 190, 220); b.item('b', '[2, 3]', 380, 220, { w: 140, size: 28 }); b.item('c', '[4, [5]]', 650, 220, { w: 200, size: 28 });
  const rx = i => 300 + i * 100;
  b.item('r0', '1', rx(0), 420, { w: 70, h: 70, fill: 'success', visible: false });
  b.item('r1', '2', rx(1), 420, { w: 70, h: 70, fill: 'success', visible: false });
  b.item('r2', '3', rx(2), 420, { w: 70, h: 70, fill: 'success', visible: false });
  b.item('r3', '4', rx(3), 420, { w: 70, h: 70, fill: 'success', visible: false });
  b.item('r4', '[5]', rx(4), 420, { w: 90, h: 70, fill: 'warning', visible: false });
  return { b, slides: slides([
    ['Arr::flatten() gets an array holding 1, the array [2, 3] and the array [4, [5]].'],
    ['1 is not an array, so it is added to the result. The array [2, 3] is opened and its values 2 and 3 are added.', M(show(b, ['r0', 'r1', 'r2']), fade(b, ['a', 'b'], 0.2))],
    ['[4, [5]] is opened too. 4 is added. [5] is still an array, so it must be opened again.', M(show(b, ['r3', 'r4']), fade(b, ['c'], 0.2))],
    ['Because the depth is unlimited, the function repeats itself on [5] and adds the value 5.', M(lab('r4', '5'), fill(b, ['r4'], 'success'), { r4r: { width: 70 } }), 700],
    ['Arr::flatten([1, [2, 3], [4, [5]]]) = [1, 2, 3, 4, 5]', T('note', 'result: [1, 2, 3, 4, 5]', { fill: 'success' }), 500],
  ]) };
}

// ===== assemble packages =====
const out = {};
function pkg(eco, name, file, library, docs) {
  out[file] = { ponderIndex: 1, ecosystem: eco, name, documents: docs.map(d => ({ ...(d.versions ? { versions: d.versions } : {}), ponder: { version: 1, library, animations: d.animations } })) };
}

// --- lodash ---
const lo = (n, f) => ({ symbol: `js:lodash#${n}`, aliases: [`js:lodash/${n}#${n}`, `sym:${f}:${n}`] });
const A = (s, title, description, built) => ({ symbol: s.symbol, aliases: s.aliases, title, description, actors: built.b.a, slides: built.slides });
pkg('npm', 'lodash', 'v1/npm/lodash.json', { name: 'lodash' }, [{ versions: '>=4 <5', animations: {
  chunk: A(lo('chunk', 'chunk.js'), 'How chunk() works', 'Splits an array into smaller arrays of a given size.', chunkAnim({ call: 'chunk([1, 2, 3, 4, 5], 2)', fn: 'chunk()', items: [1, 2, 3, 4, 5], size: 2, result: '[[1, 2], [3, 4], [5]]' })),
  'group-by': A(lo('groupBy', 'groupBy.js'), 'How groupBy() works', 'Sorts items into groups by the key a function gives each item.', groupAnim({ call: 'groupBy([6.1, 4.2, 6.3], Math.floor)', fn: 'groupBy()', items: ['6.1', '4.2', '6.3'], keys: ['6', '4', '6'], order: ['4', '6'], result: '{ 4: [4.2], 6: [6.1, 6.3] }', keyFn: 'Math.floor rounds down' })),
  uniq: A(lo('uniq', 'uniq.js'), 'How uniq() works', 'Removes duplicate values and keeps the first of each.', uniqAnim({ call: 'uniq([1, 2, 2, 1, 3])', fn: 'uniq()', items: [1, 2, 2, 1, 3], result: '[1, 2, 3]' })),
  flatten: A(lo('flatten', 'flatten.js'), 'How flatten() works', 'Removes one level of nesting from an array.', lodashFlatten()),
  debounce: A(lo('debounce', 'debounce.js'), 'How debounce() works', 'Delays calling a function until calls have stopped for a while.', lodashDebounce()),
} }]);

// --- date-fns ---
const df = n => ({ symbol: `js:date-fns#${n}`, aliases: [`js:date-fns/${n}#${n}`, `js:date-fns/${n}/index#${n}`, `sym:${n}.js:${n}`, `sym:${n}/index.js:${n}`] });
pkg('npm', 'date-fns', 'v1/npm/date-fns.json', { name: 'date-fns' }, [{ versions: '>=2', animations: {
  'add-days': A(df('addDays'), 'How addDays() works', 'Adds a number of days to a date and gives back a new date.', addDaysAnim()),
  'difference-in-days': A(df('differenceInDays'), 'How differenceInDays() works', 'Counts the whole days between two dates.', diffDaysAnim()),
  'start-of-week': A(df('startOfWeek'), 'How startOfWeek() works', 'Gives the first moment of the week that a date is in.', startOfWeekAnim()),
} }]);

// --- numpy ---
const np = (n) => ({ symbol: `py:numpy._core.fromnumeric.${n}`, aliases: [`py:numpy.${n}`, `py:numpy.core.fromnumeric.${n}`, `sym:_core/fromnumeric.py:${n}`, `sym:_core/fromnumeric.pyi:${n}`, `sym:core/fromnumeric.py:${n}`, `sym:core/fromnumeric.pyi:${n}`] });
pkg('pypi', 'numpy', 'v1/pypi/numpy.json', { name: 'numpy' }, [{ versions: '>=1.20', animations: {
  clip: A(np('clip'), 'How np.clip() works', 'Limits every value in an array to a minimum and a maximum.', npClip()),
  argsort: A(np('argsort'), 'How np.argsort() works', 'Gives the positions that would sort an array.', npArgsort()),
  cumsum: A(np('cumsum'), 'How np.cumsum() works', 'Gives the running total of the values in an array.', npCumsum()),
  reshape: A(np('reshape'), 'How np.reshape() works', 'Arranges the same values into a new shape.', npReshape()),
} }]);

// --- more-itertools ---
const mi = (n, mod, file) => ({ symbol: `py:more_itertools.${mod}.${n}`, aliases: [`sym:${file}:${n}`, `sym:${file}i:${n}`] });
pkg('pypi', 'more-itertools', 'v1/pypi/more-itertools.json', { name: 'more-itertools' }, [{ versions: '>=8', animations: {
  chunked: A(mi('chunked', 'more', 'more.py'), 'How chunked() works', 'Breaks an iterable into lists of a given length.', chunkAnim({ call: 'chunked([1, 2, 3, 4, 5, 6, 7, 8], 3)', fn: 'chunked()', items: [1, 2, 3, 4, 5, 6, 7, 8], size: 3, result: '[[1, 2, 3], [4, 5, 6], [7, 8]]', extra: ' (wrapped in list() to show the lists)' })),
  windowed: A(mi('windowed', 'more', 'more.py'), 'How windowed() works', 'Slides a window over an iterable and gives each view as a tuple.', miWindowed()),
  flatten: A(mi('flatten', 'recipes', 'recipes.py'), 'How flatten() works', 'Joins a list of lists into one flat sequence, one level deep.', nestedFlatten({ call: 'flatten([[1, 2], [3], [4, 5]])', fn: 'flatten()', parts: [{ label: '[1, 2]', items: [1, 2] }, { label: '[3]', items: [3] }, { label: '[4, 5]', items: [4, 5] }], result: '1, 2, 3, 4, 5', oneLevel: true })),
} }]);

// --- guava ---
const gv = (cls, pkgp, m, types) => ({ symbol: `com.google.common.${pkgp}.${cls}#${m}(${types})`, aliases: [] });
const guavaLib = { group: 'com.google.guava', name: 'guava' };
const gPart = A(gv('Lists', 'collect', 'partition', 'java.util.List,int'), 'How Lists.partition() works', 'Splits a list into consecutive sublists of a given size.', chunkAnim({ call: 'Lists.partition([1, 2, 3, 4, 5], 2)', fn: 'partition()', items: [1, 2, 3, 4, 5], size: 2, result: '[[1, 2], [3, 4], [5]]' }));
const gPad = A(gv('Strings', 'base', 'padStart', 'java.lang.String,int,char'), 'How Strings.padStart() works', 'Adds padding characters to the start of a string until it is long enough.', guavaPadStart());
const gCon = A(gv('Ints', 'primitives', 'constrainToRange', 'int,int,int'), 'How Ints.constrainToRange() works', 'Keeps an int inside a range.', guavaConstrain());
pkg('maven', 'com.google.guava:guava', 'v1/maven/com.google.guava/guava.json', guavaLib, [
  { versions: '>=20 <21', animations: { 'lists-partition': gPart, 'strings-pad-start': gPad } },
  { versions: '>=21', animations: { 'lists-partition': gPart, 'strings-pad-start': gPad, 'ints-constrain-to-range': gCon } },
]);

// --- commons-lang3 ---
const cl = (cls, m, types) => ({ symbol: `org.apache.commons.lang3.${cls}#${m}(${types})`, aliases: [] });
pkg('maven', 'org.apache.commons:commons-lang3', 'v1/maven/org.apache.commons/commons-lang3.json', { group: 'org.apache.commons', name: 'commons-lang3' }, [{ versions: '>=3.0', animations: {
  'string-utils-abbreviate': A(cl('StringUtils', 'abbreviate', 'java.lang.String,int'), 'How StringUtils.abbreviate() works', 'Shortens a long string and ends it with "...".', langAbbreviate()),
  'string-utils-center': A(cl('StringUtils', 'center', 'java.lang.String,int'), 'How StringUtils.center() works', 'Puts a string in the middle of a wider field, padded with spaces.', langCenter()),
  'array-utils-reverse': A(cl('ArrayUtils', 'reverse', 'int[]'), 'How ArrayUtils.reverse() works', 'Reverses the order of an array, in place.', langReverse()),
} }]);

// --- itertools and the other Rust crates: src/rust/ (interleave and dedup below are used there) ---

// --- samber/lo (go) ---
const gl = (n) => ({ symbol: `go:github.com/samber/lo.${n}`, aliases: [`sym:slice.go:${n}`] });
pkg('go', 'github.com/samber/lo', 'v1/go/github.com/samber/lo.json', { name: 'github.com/samber/lo' }, [{ versions: '>=1.0', animations: {
  chunk: A(gl('Chunk'), 'How lo.Chunk() works', 'Splits a slice into smaller slices of a given size.', chunkAnim({ call: 'lo.Chunk([]int{0, 1, 2, 3, 4, 5}, 2)', fn: 'Chunk()', items: [0, 1, 2, 3, 4, 5], size: 2, result: '[[0 1] [2 3] [4 5]]' })),
  uniq: A(gl('Uniq'), 'How lo.Uniq() works', 'Removes duplicate values and keeps the first of each.', uniqAnim({ call: 'lo.Uniq([]int{1, 2, 2, 1})', fn: 'Uniq()', items: [1, 2, 2, 1], result: '[1 2]' })),
  'group-by': A(gl('GroupBy'), 'How lo.GroupBy() works', 'Sorts items into a map of groups by the key a function gives each item.', groupAnim({ call: 'lo.GroupBy(nums, func(i int) int { return i % 3 })', fn: 'GroupBy() with nums = []int{0, 1, 2, 3, 4, 5}', items: ['0', '1', '2', '3', '4', '5'], keys: ['0', '1', '2', '0', '1', '2'], order: ['0', '1', '2'], result: 'map[0:[0 3] 1:[1 4] 2:[2 5]]', keyFn: 'the function returns i % 3, the remainder after dividing by 3' })),
} }]);

// --- illuminate/collections (packagist) ---
const ph = (file, cls, m) => ({ symbol: `sym:${file}:${cls}.${m}`, aliases: [`sym:src/Illuminate/Collections/${file}:${cls}.${m}`] });
pkg('packagist', 'illuminate/collections', 'v1/packagist/illuminate/collections.json', { name: 'illuminate/collections' }, [{ versions: '>=8', animations: {
  'arr-flatten': A(ph('Arr.php', 'Arr', 'flatten'), 'How Arr::flatten() works', 'Turns a nested array into one flat array.', phpFlatten()),
  'collection-chunk': A(ph('Collection.php', 'Collection', 'chunk'), 'How Collection::chunk() works', 'Splits a collection into smaller collections of a given size.', chunkAnim({ call: 'collect([1, 2, 3, 4, 5])->chunk(2)', fn: 'chunk()', items: [1, 2, 3, 4, 5], size: 2, result: '[[1, 2], [3, 4], [5]]', extra: ' (each chunk is itself a Collection)' })),
} }]);

// ===== validate + write =====
let bad = 0;
const COLORS = new Set(['text', 'muted', 'accent', 'accent2', 'success', 'warning', 'danger', 'surface', 'none']);
function check(file, doc) {
  const probs = [];
  for (const d of doc.documents) for (const [name, an] of Object.entries(d.ponder.animations)) {
    const ids = new Set(Object.keys(an.actors));
    if (!an.aliases.length && !/^com\.|^org\.|^sym:/.test(an.symbol)) probs.push(name + ' no alias');
    if (an.aliases.length > 16) probs.push(name + ' more than 16 aliases');
    if (new Set([an.symbol, ...an.aliases]).size !== an.aliases.length + 1) probs.push(name + ' repeated symbol');
    if (an.slides.length < 4 || an.slides.length > 8) probs.push(name + ' slide count ' + an.slides.length);
    const st = {}; for (const [k, v] of Object.entries(an.actors)) st[k] = { ...v };
    const absPos = k => { let x = st[k].x, y = st[k].y; if (st[k].parent) { const p = absPos(st[k].parent); x += p[0]; y += p[1]; } return [x, y]; };
    an.slides.forEach((s, i) => {
      if (i === 0 && (s.duration || s.trigger || s.style || s.delay || s.easing)) probs.push(name + ' first slide timing');
      if (s.caption.length > 400) probs.push(name + ' caption long ' + i);
      for (const [k, ch] of Object.entries(s.changes || {})) {
        if (!ids.has(k)) probs.push(name + ' bad id ' + k); else { if ('type' in ch || 'parent' in ch) probs.push(name + ' type/parent change'); Object.assign(st[k], ch); }
      }
      const boxes = [];
      for (const k of Object.keys(st)) {
        const a = st[k]; const [x, y] = absPos(k);
        for (const c of ['fill', 'stroke']) if (a[c] && !COLORS.has(a[c]) && !/^#[0-9a-f]{6}$/i.test(a[c])) probs.push(name + ' color ' + a[c]);
        if (a.visible === false) continue;
        let x1 = x, x2 = x, y1 = y, y2 = y;
        if (a.type === 'rectangle' || a.type === 'ellipse') { x1 = x - a.width / 2; x2 = x + a.width / 2; y1 = y - a.height / 2; y2 = y + a.height / 2; }
        else if (a.type === 'circle') { x1 = x - a.radius; x2 = x + a.radius; y1 = y - a.radius; y2 = y + a.radius; }
        else if (a.type === 'text') { const hw = a.text.length * a.fontSize * 0.29; x1 = x - hw; x2 = x + hw; y1 = y - a.fontSize * 0.6; y2 = y + a.fontSize * 0.6; if (a.text.length === 0) continue; }
        else if (a.type === 'line' || a.type === 'arrow') { x1 = Math.min(x, x + a.width); x2 = Math.max(x, x + a.width); y1 = Math.min(y, y + a.height); y2 = Math.max(y, y + a.height); }
        else continue;
        if (a.type === 'text' && a.text.length > 0 && a.fontSize < 20) probs.push(name + ' font small');
        if (x1 < 40 || x2 > 960 || y1 < 40 || y2 > 560) probs.push(`${name} s${i} ${k} out of stage ${x1 | 0},${y1 | 0},${x2 | 0},${y2 | 0}`);
        if ((a.type === 'rectangle' && a.fill !== 'none') && !(a.opacity < 0.5)) boxes.push([k, x1, y1, x2, y2]);
      }
      for (let p = 0; p < boxes.length; p++) for (let q = p + 1; q < boxes.length; q++) {
        const A1 = boxes[p], B1 = boxes[q];
        if (A1[1] < B1[3] - 1 && B1[1] < A1[3] - 1 && A1[2] < B1[4] - 1 && B1[2] < A1[4] - 1) probs.push(`${name} s${i} overlap ${A1[0]} ${B1[0]}`);
      }
    });
    probs.push(...require('./collide.cjs').textCollisions(an).map((m) => `${name} ${m}`));
    JSON.stringify(an);
  }
  if (probs.length) { bad++; console.log(file, [...new Set(probs)].slice(0, 25)); }
}
const problems = () => bad;

module.exports = { ROOT, out, A, check, problems, itInterleave, itDedup };
