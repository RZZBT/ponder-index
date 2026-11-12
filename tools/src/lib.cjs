// Helpers for building Ponder animations
class B {
  constructor() { this.a = {}; this.kids = {}; }
  text(id, t, x, y, o = {}) {
    this.a[id] = { type: 'text', x, y, text: t, fontSize: o.size || 24, fill: o.fill || 'muted', anchor: 'middle' };
    if (o.visible === false) this.a[id].visible = false;
  }
  title(t) { this.text('title', t, 500, 60, { size: t.length > 48 ? 28 : t.length > 42 ? 30 : 32, fill: 'text' }); }
  note(t, y = 125) { this.text('note', t, 500, y, { size: 24, fill: 'muted' }); }
  item(id, label, x, y, o = {}) {
    const w = o.w || 80, h = o.h || 80, vis = o.visible === false ? { visible: false } : {};
    this.a[id] = { type: 'group', x, y, ...vis };
    this.a[id + 'r'] = { type: 'rectangle', parent: id, x: 0, y: 0, width: w, height: h, cornerRadius: 10, fill: o.fill || 'accent', stroke: 'text', strokeWidth: 2, ...vis };
    this.a[id + 't'] = { type: 'text', parent: id, x: 0, y: 0, text: label, fontSize: o.size || (label.length > 5 ? 22 : 30), fill: 'text', anchor: 'middle', ...vis };
    this.kids[id] = [id + 'r', id + 't'];
  }
  raw(id, o) { this.a[id] = o; }
}
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function M(...cs) {
  const out = {};
  for (const c of cs) for (const [k, v] of Object.entries(c || {})) out[k] = { ...(out[k] || {}), ...v };
  return out;
}
const mv = (ids, xs, y) => { const c = {}; ids.forEach((id, i) => { c[id] = { x: xs[i], ...(y === undefined ? {} : { y }) }; }); return c; };
const mvy = (ids, y) => { const c = {}; ids.forEach(id => { c[id] = { y }; }); return c; };
const fill = (b, ids, color) => { const c = {}; ids.forEach(id => { c[id + 'r'] = { fill: color }; }); return c; };
const fade = (b, ids, o) => { const c = {}; ids.forEach(id => { for (const k of b.kids[id]) c[k] = { opacity: o }; }); return c; };
const show = (b, ids, v = true) => { const c = {}; ids.forEach(id => { c[id] = { visible: v }; for (const k of (b.kids[id] || [])) c[k] = { visible: v }; }); return c; };
const lab = (id, text) => ({ [id + 't']: { text } });
const T = (id, text, extra = {}) => ({ [id]: { text, ...extra } });
// slides: [caption, changes, duration]
function slides(list) {
  return list.map(([caption, changes, dur], i) => {
    if (i === 0) return { caption };
    const s = { caption, duration: dur || 900 };
    if (changes && Object.keys(changes).length) s.changes = changes;
    return s;
  });
}
const L = a => '[' + a.join(', ') + ']';

// ---------- generic animations ----------
function chunkAnim({ call, fn, items, size, result, extra = '', note, introExtra = '', intro }) {
  const b = new B(), n = items.length, g = Math.ceil(n / size);
  const x0 = 500 - ((n - 1) * 90 + (g - 1) * 60) / 2;
  b.title(call); b.note(note || `size = ${size}`);
  const ids = items.map((_, i) => 'g' + i);
  items.forEach((v, i) => b.item('g' + i, String(v), 500 - (n - 1) * 45 + i * 90, 220, { w: 70, h: 70 }));
  const ch = [];
  for (let c = 0; c < g; c++) {
    const idx = []; for (let i = c * size; i < Math.min(n, (c + 1) * size); i++) idx.push(i);
    ch.push(idx);
    const xs = idx.map((_, j) => x0 + (c * size + j) * 90 + c * 60);
    b.text('lab' + c, L(idx.map(i => items[i])), xs.reduce((a, b2) => a + b2, 0) / xs.length, 490, { fill: 'success', visible: false });
  }
  const sl = [[intro || `${fn} gets ${L(items)} and a chunk size of ${size}.${introExtra}`]];
  ch.forEach((idx, c) => {
    const pos = idx.map(i => x0 + i * 90 + c * 60), grp = idx.map(i => 'g' + i);
    const part = L(idx.map(i => items[i]));
    let cap;
    if (idx.length < size) cap = `Only ${idx.length} item${idx.length > 1 ? 's are' : ' is'} left, so the last group is shorter: ${part}. Then the end is reached.`;
    else if (c === 0) cap = `It takes the first ${size} items and puts them in a new group: ${part}.`;
    else cap = `It moves on ${size} positions and takes the next ${size} items: ${part}.`;
    sl.push([cap, M(mv(grp, pos, 390), fill(b, grp, 'success'), show(b, ['lab' + c].filter(() => false)), { ['lab' + c]: { visible: true } })]);
  });
  sl.push([`${call} = ${result}${extra}`, T('note', 'result: ' + result, { fill: 'success' }), 500]);
  return { b, slides: slides(sl) };
}

function uniqAnim({ call, fn, items, result }) {
  const b = new B(), n = items.length; b.title(call); b.note('keep the first time each value appears');
  const sx = i => 500 - (n - 1) * 55 + i * 110;
  items.forEach((v, i) => b.item('g' + i, String(v), sx(i), 220));
  const seen = new Set(), keep = [], dup = [];
  items.forEach((v, i) => { if (seen.has(v)) dup.push(i); else { seen.add(v); keep.push(i); } });
  const rx = j => 500 - (keep.length - 1) * 55 + j * 110;
  const k = keep.map(i => 'g' + i), d = dup.map(i => 'g' + i);
  return { b, slides: slides([
    [`${fn} gets ${L(items)}.`],
    [`It goes through the items from left to right. Values it has not seen before are kept (green): ${L(keep.map(i => items[i]))}.`, fill(b, k, 'success')],
    [`A value that was already seen is skipped (red).`, fill(b, d, 'danger'), 700],
    [`Skipped items drop out. The kept items move into the result in their original order.`, M(fade(b, d, 0.15), mv(k, keep.map((_, j) => rx(j)), 400))],
    [`${call} = ${result}`, T('note', 'result: ' + result, { fill: 'success' }), 500],
  ]) };
}

function groupAnim({ call, fn, items, keys, order, result, keyFn }) {
  const b = new B(), n = items.length, nb = order.length;
  b.title(call); b.note('group items that share the same key');
  const sx = i => 500 - (n - 1) * 65 + i * 130;
  items.forEach((v, i) => b.item('g' + i, String(v), sx(i), 200, { w: 90, h: 70, size: 26 }));
  keys.forEach((k, i) => b.text('k' + i, 'key ' + k, sx(i), 290, { fill: 'warning', visible: false }));
  const bx = j => 500 + (j - (nb - 1) / 2) * 260;
  order.forEach((k, j) => b.text('b' + j, 'key ' + k, bx(j), 350, { fill: 'warning', visible: false }));
  const mvs = {}, cnt = {};
  items.forEach((v, i) => {
    const j = order.indexOf(keys[i]); const c = cnt[j] = (cnt[j] || 0) + 1;
    const total = keys.filter(k => k === keys[i]).length;
    mvs['g' + i] = { x: bx(j) + (c - 1 - (total - 1) / 2) * 100, y: 420 };
  });
  const ids = items.map((_, i) => 'g' + i);
  const kshow = {}; keys.forEach((_, i) => { kshow['k' + i] = { visible: true }; });
  const bshow = {}; order.forEach((_, j) => { bshow['b' + j] = { visible: true }; });
  return { b, slides: slides([
    [`${fn} gets ${L(items)} and a function that makes a key for each item.`],
    [`It works out the key for every item (${keyFn}): ` + items.map((v, i) => `${v} → ${keys[i]}`).join(', ') + '.', kshow],
    [`Items with the same key are collected in the same group, in the order they appear.`, M(mvs, bshow, ...ids.map(id => fill(b, [id], 'success'))), 1100],
    [`${call} = ${result}`, T('note', 'result: ' + result, { fill: 'success' }), 500],
  ]) };
}

// flatten of nested lists: parts = [{label,w}] top-level; result slots
module.exports = { B, M, mv, mvy, fill, fade, show, lab, T, slides, L, chunkAnim, uniqAnim, groupAnim };
