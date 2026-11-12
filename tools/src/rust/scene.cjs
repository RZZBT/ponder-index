// Scene builder and templates for the Rust crate animations.
// Every builder returns { b, slides } like the other generators (b.a = actors).
const { B, M, fill, fade, show, lab, T, slides } = require('../lib.cjs');

const CW = 0.6;                                    // average glyph width / font size (generous)
const STAGE_W = 860;
const boxW = (label, fs, min = 56) => Math.max(min, Math.ceil(String(label).length * fs * CW) + 24);
const fitSize = (s, base = 24, width = STAGE_W) => {
  const f = Math.min(base, Math.floor(width / (Math.max(1, String(s).length) * 0.58)));
  if (f < 20) throw new Error(`text too long for the stage: "${s}"`);
  return f;
};

class Scene {
  constructor(call, note) {
    this.b = new B(); this.list = []; this.base = {}; this.pos = {}; this.cur = {};
    this.b.text('title', call, 500, 60, { size: Math.min(32, fitSize(call, 32, 880)), fill: 'text' });
    this.b.text('note', note, 500, 118, { size: fitSize(note, 24) });
  }
  box(id, label, x, y, o = {}) {
    const fs = o.size || 26, w = o.w || boxW(label, fs, o.min);
    this.b.item(id, String(label), x, y, { w, h: o.h || 60, fill: o.fill || 'accent', size: fs, visible: o.visible });
    this.base[id] = o.fill || 'accent'; this.pos[id] = [x, y]; this.cur[id] = o.fill || 'accent';
    return w;
  }
  // Lays labels out in lines no wider than maxW; returns [{x, y, w}] and the font size used.
  layout(labels, y0, o = {}) {
    let fs = o.size || 26; const gap = o.gap ?? 16, maxW = o.maxW || STAGE_W, dy = o.dy || 74;
    for (;;) {
      const ws = labels.map((l) => o.w || boxW(l === null ? 'xx' : l, fs, o.min));
      const lines = [[]]; let width = 0;
      ws.forEach((w, i) => {
        if (lines[lines.length - 1].length && width + gap + w > maxW && !o.oneLine) { lines.push([]); width = 0; }
        width += (lines[lines.length - 1].length ? gap : 0) + w; lines[lines.length - 1].push(i);
      });
      const total = (l) => l.reduce((a, i) => a + ws[i], 0) + gap * (l.length - 1);
      if ((lines.length > (o.maxLines || 2) || lines.some((l) => total(l) > maxW)) && fs > 20) { fs -= 2; continue; }
      if (lines.some((l) => total(l) > maxW + 1)) throw new Error(`row too wide: ${labels.join(' ')}`);
      if (lines.length > (o.maxLines || 2)) throw new Error(`too many lines: ${labels.join(' ')}`);
      const out = [];
      lines.forEach((l, k) => { let x = (o.cx || 500) - total(l) / 2; l.forEach((i) => { out[i] = { x: x + ws[i] / 2, y: y0 + k * dy, w: ws[i] }; x += ws[i] + gap; }); });
      return { at: out, fs, lines: lines.length };
    }
  }
  row(prefix, labels, y, o = {}) {
    const { at, fs } = this.layout(labels.map((l, i) => (l === null && o.slots && o.slots[i]) || l), y, o);
    return labels.map((l, i) => { const id = prefix + i; if (l !== null) this.box(id, l, at[i].x, at[i].y, { ...o, w: at[i].w, size: fs }); else this.pos[id] = [at[i].x, at[i].y]; return id; });
  }
  text(id, t, x, y, o = {}) {
    this.b.text(id, t, x, y, { size: o.size || 24, fill: o.fill || 'muted', visible: o.visible });
    if (o.anchor) this.b.a[id].anchor = o.anchor;
  }
  // ---- changes
  hi(ids, color) { ids = [].concat(ids); ids.forEach((i) => { this.cur[i] = color; }); return fill(this.b, ids, color); }
  reset(ids) { return M(...[].concat(ids).map((i) => this.hi([i], this.base[i]))); }
  setBase(ids, color) { [].concat(ids).forEach((i) => { this.base[i] = color; }); return this.hi(ids, color); }
  show(ids) { return show(this.b, [].concat(ids)); }
  hide(ids) { return show(this.b, [].concat(ids), false); }
  dim(ids, o = 0.2) { return fade(this.b, [].concat(ids), o); }
  lab(id, t) { return lab(id, String(t)); }
  say(id, t, extra = {}) { const a = this.b.a[id]; return T(id, t, { fontSize: t ? Math.min(a.fontSize, fitSize(t, a.fontSize)) : a.fontSize, ...extra }); }
  mv(id, x, y) { this.pos[id] = [x, y]; return { [id]: { x, y } }; }
  // ---- slides
  intro(cap) { this.list.push([cap]); return this; }
  step(cap, changes = {}, dur) { this.list.push([cap, M(...[].concat(changes)), dur]); return this; }
  result(text, cap, extra = {}) {
    const t = 'result: ' + text;
    this.list.push([cap, M(T('note', t, { fill: 'success', fontSize: fitSize(t, 24) }), ...[].concat(extra)), 500]);
    return this;
  }
  build() {
    if (this.list.length < 4 || this.list.length > 8) throw new Error(`${this.list.length} slides: ${this.list[0][0].slice(0, 60)}`);
    return { b: this.b, slides: slides(this.list) };
  }
}

// ---------- pick: input rows, outputs revealed (or input boxes moved into output slots) step by step
// spec: { call, note, rows: [[labels]...], rowFills?, rowNames?, outs: [labels|null], steps: [{ cap, src: [ids], out: [j],
//   move?: {id: j}, mark?: {color: [ids]}, eq?, set?: {j: label} }], intro, result, resultCap, outFill? }
function pick(s) {
  const sc = new Scene(s.call, s.note);
  const n = s.rows.length;
  const ys = n === 1 ? [210] : n === 2 ? [195, 285] : [185, 255, 325];
  const eqY = n === 1 ? 312 : n === 2 ? 362 : 392;
  const outY = s.outY || (n === 3 ? 465 : 445);
  s.rows.forEach((labels, r) => {
    const ids = sc.row('abc'[r], labels, ys[r], { fill: (s.rowFills && s.rowFills[r]) || (r === 1 ? 'accent2' : 'accent'), h: n === 3 ? 54 : 60 });
    if (s.rowNames && s.rowNames[r]) {
      const left = Math.min(...ids.map((id) => sc.pos[id][0] - sc.b.a[id + 'r'].width / 2));
      const nm = s.rowNames[r]; const half = nm.length * 20 * 0.3;
      sc.text('rn' + r, nm, left - 18 - half, ys[r], { size: 20 });
    }
  });
  const slots = {};   // an empty output slot is as wide as the input box that moves into it
  for (const st of s.steps) for (const [id, j] of Object.entries(st.move || {})) slots[j] = sc.b.a[id + 't'].text;
  if (s.outs && s.outs.length) sc.row('o', s.outs, outY, { slots, fill: s.outFill || 'success', visible: false, maxLines: s.outLines || 2 }); else void 0;
  sc.text('eq', '', 500, eqY, { size: 26, fill: 'warning' });
  sc.intro(s.intro);
  let prev = [];
  for (const st of s.steps) {
    const ch = [];
    const src = st.src || [];
    const back = prev.filter((i) => !src.includes(i) && !(st.move && i in st.move));
    if (back.length) ch.push(sc.reset(back));
    if (src.length) ch.push(sc.hi(src, st.srcColor || 'warning'));
    for (const [color, ids] of Object.entries(st.mark || {})) ch.push(color === 'dim' ? sc.dim(ids) : sc.setBase(ids, color));
    if (st.out) ch.push(sc.show(st.out.map((j) => 'o' + j)));
    for (const [j, t] of Object.entries(st.set || {})) ch.push(sc.lab('o' + j, t));
    for (const [id, j] of Object.entries(st.move || {})) { const [x, y] = sc.pos['o' + j]; ch.push(sc.mv(id, x, y), sc.setBase([id], st.moveColor || 'success')); }
    ch.push(sc.say('eq', st.eq || ''));
    sc.step(st.cap, ch, st.dur);
    prev = st.move ? src.filter((i) => !(i in st.move)) : src;
  }
  sc.result(s.result, s.resultCap, [prev.length ? sc.reset(prev) : {}, sc.say('eq', '')]);
  return sc.build();
}

// ---------- cells: a string as one box per character; ranges are coloured step by step, pieces appear below
// spec: { call, note, text, idx?, outs?, steps: [{ cap, mark: [[from, to, color]], keep?, out: [j], set, eq }], result, resultCap }
function cells(s) {
  const sc = new Scene(s.call, s.note);
  const chars = [...s.text]; const n = chars.length;
  const cw = Math.min(50, Math.floor(STAGE_W / n) - 4); const fs = Math.min(26, Math.floor(cw * 0.75));
  if (fs < 20) throw new Error('string too long for cells: ' + s.text);
  const y = s.y || 215;
  chars.forEach((c, i) => sc.box('c' + i, c === ' ' ? '␣' : c, 500 + (i - (n - 1) / 2) * (cw + 4), y, { w: cw, h: 56, size: fs, fill: s.fill || 'surface' }));
  if (s.idx) chars.forEach((_, i) => sc.text('x' + i, String(i), 500 + (i - (n - 1) / 2) * (cw + 4), y + 50, { size: 20 }));
  if (s.outs) sc.row('o', s.outs, s.outY || 440, { fill: 'success', visible: false });
  sc.text('eq', '', 500, s.idx ? 335 : 320, { size: 26, fill: 'warning' });
  sc.intro(s.intro);
  let marked = [];
  for (const st of s.steps) {
    const ch = [];
    if (!st.keep && marked.length) ch.push(sc.reset(marked));
    if (!st.keep) marked = [];
    for (const [a, b, color] of st.mark || []) { const ids = []; for (let i = a; i < b; i++) ids.push('c' + i); ch.push(sc.hi(ids, color)); marked.push(...ids); }
    if (st.out) ch.push(sc.show(st.out.map((j) => 'o' + j)));
    for (const [j, t] of Object.entries(st.set || {})) ch.push(sc.lab('o' + j, t));
    for (const [i, t] of Object.entries(st.chars || {})) ch.push(sc.lab('c' + i, t));
    if (st.extra) ch.push(st.extra(sc));
    ch.push(sc.say('eq', st.eq || ''));
    sc.step(st.cap, ch, st.dur);
  }
  sc.result(s.result, s.resultCap, [sc.say('eq', '')]);
  return sc.build();
}

// ---------- lines: a calculation written out one line per step
// spec: { call, note, lines: [str], steps: [{ cap, show: [i], set?: {i: str}, done?: [i] }], result, resultCap, setup?(sc) }
function lines(s) {
  const sc = new Scene(s.call, s.note);
  const y0 = s.y0 || 190, dy = s.dy || 54;
  if (s.setup) s.setup(sc);
  s.lines.forEach((t, i) => sc.text('l' + i, t, 500, y0 + i * dy, { size: Math.min(s.size || 28, fitSize(t, s.size || 28)), fill: 'text', visible: false }));
  sc.intro(s.intro);
  let last = [];
  for (const st of s.steps) {
    const ch = [];
    last.forEach((i) => ch.push({ ['l' + i]: { fill: 'text' } }));
    (st.show || []).forEach((i) => ch.push({ ['l' + i]: { visible: true, fill: 'warning' } }));
    for (const [i, t] of Object.entries(st.set || {})) ch.push(T('l' + i, t));
    if (st.extra) ch.push(st.extra(sc));
    sc.step(st.cap, ch, st.dur);
    last = st.show || [];
  }
  sc.result(s.result, s.resultCap, [...last.map((i) => ({ ['l' + i]: { fill: 'success' } })), ...(s.finalExtra ? [s.finalExtra(sc)] : [])]);
  return sc.build();
}

// ---------- graph: nodes (circles) and edges; steps colour nodes/edges and set small labels
// spec: { call, note, nodes: {A: [x, y]}, edges: [[u, v, w?]], directed, labels?: {A: text}, steps: [{ cap, nodes: {A: color},
//   edges: {'A-B': color}, labels: {A: text}, eq }], result, resultCap }
function graph(s) {
  const sc = new Scene(s.call, s.note);
  const R = s.r || 28;
  const eid = (u, v) => `e_${u}_${v}`;
  for (const [u, v, w] of s.edges) {
    const [x1, y1] = s.nodes[u], [x2, y2] = s.nodes[v];
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const sx = x1 + ux * (R + 2), sy = y1 + uy * (R + 2), ex = x2 - ux * (R + 4), ey = y2 - uy * (R + 4);
    sc.b.raw(eid(u, v), { type: s.directed ? 'arrow' : 'line', x: Math.round(sx), y: Math.round(sy), width: Math.round(ex - sx), height: Math.round(ey - sy), stroke: 'muted', strokeWidth: 3 });
    if (w !== undefined) {
      const mx = (x1 + x2) / 2 - uy * 18, my = (y1 + y2) / 2 + ux * 18;
      sc.text('w_' + u + '_' + v, String(w), Math.round(mx), Math.round(my), { size: 22, fill: 'text' });
    }
  }
  for (const [k, [x, y]] of Object.entries(s.nodes)) {
    sc.b.raw('n' + k, { type: 'circle', x, y, radius: R, fill: 'accent', stroke: 'text', strokeWidth: 2 });
    sc.text('t' + k, k, x, y, { size: 24, fill: 'text' });
    if (s.labels) sc.text('d' + k, s.labels[k] || '', x + (s.labelDx ?? 0), y + (s.labelDy ?? -R - 18), { size: 22, fill: 'warning' });
  }
  sc.text('eq', '', 500, s.eqY || 540, { size: 24, fill: 'warning' });
  sc.intro(s.intro);
  for (const st of s.steps) {
    const ch = [];
    for (const [k, c] of Object.entries(st.nodes || {})) ch.push({ ['n' + k]: { fill: c } });
    for (const [k, c] of Object.entries(st.edges || {})) { const [u, v] = k.split('-'); ch.push({ [eid(u, v)]: { stroke: c, strokeWidth: c === 'muted' ? 3 : 5 } }); }
    for (const [k, t] of Object.entries(st.labels || {})) ch.push(T('d' + k, t));
    ch.push(sc.say('eq', st.eq || ''));
    sc.step(st.cap, ch, st.dur);
  }
  sc.result(s.result, s.resultCap, [sc.say('eq', '')]);
  return sc.build();
}

module.exports = { Scene, pick, cells, lines, graph, boxW, fitSize };
