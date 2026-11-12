const { B, M, mv, fill, fade, show, lab, T, slides, L } = require('./lib.cjs');

const spread = (n, cx = 500, maxw = 760, step = 110) => {
  const st = n > 1 ? Math.min(step, maxw / (n - 1)) : 0;
  return i => cx - (n - 1) * st / 2 + i * st;
};

// inputs -> outputs, revealed step by step
// spec: {call, note, inputs:[str], inFills?:[token], outputs:[str], steps:[{srcs,outs,cap,eq?,set?:{j:text}}], intro, result, idx?:bool}
function stepAnim(s) {
  const b = new B(), n = s.inputs.length, m = s.outputs.length;
  b.title(s.call); b.note(s.note);
  const xi = spread(n, 500, 760, s.inW ? s.inW + 30 : 110), xo = spread(m);
  s.inputs.forEach((v, i) => b.item('i' + i, v, xi(i), 220, { w: s.inW || 76, h: 76, fill: (s.inFills && s.inFills[i]) || 'accent', size: s.inW ? 22 : undefined }));
  if (s.idx) s.inputs.forEach((_, i) => b.text('ix' + i, 'index ' + i, xi(i), 285, { size: 20 }));
  s.outputs.forEach((v, j) => b.item('o' + j, v, xo(j), 440, { w: 76, h: 76, fill: 'success', visible: false }));
  b.text('eq', '', 500, 340, { size: 26, fill: 'warning' });
  const sl = [[s.intro]]; let prev = [];
  s.steps.forEach(st => {
    const ch = [];
    prev.forEach(i => { if (!st.srcs.includes(i)) ch.push(fill(b, ['i' + i], (s.inFills && s.inFills[i]) || 'accent')); });
    ch.push(fill(b, st.srcs.map(i => 'i' + i), 'warning'));
    ch.push(show(b, st.outs.map(j => 'o' + j)));
    if (st.set) for (const [j, t] of Object.entries(st.set)) ch.push(lab('o' + j, t));
    ch.push(T('eq', st.eq || ''));
    sl.push([st.cap, M(...ch)]);
    prev = st.srcs;
  });
  const fin = [];
  prev.forEach(i => fin.push(fill(b, ['i' + i], (s.inFills && s.inFills[i]) || 'accent')));
  sl.push([s.result.cap, M(...fin, T('note', 'result: ' + s.result.text, { fill: 'success' }), T('eq', '')), 500]);
  return { b, slides: slides(sl) };
}

// cells move from layout A to layout B
// spec: {call, note, cells:[{v, from:[x,y], to:[x,y], fill?}], steps:[{ids,cap}], intro, result:{cap,text}, noteAfter?}
function gridMove(s) {
  const b = new B(); b.title(s.call); b.note(s.note);
  s.cells.forEach((c, i) => b.item('c' + i, String(c.v), c.from[0], c.from[1], { w: 76, h: 76, fill: c.fill || 'accent' }));
  (s.labels || []).forEach(l => b.text(l.id, l.text, l.x, l.y, { size: 22, fill: 'muted' }));
  const sl = [[s.intro]];
  s.steps.forEach(st => sl.push([st.cap, M(mv(st.ids.map(i => 'c' + i), st.ids.map(i => s.cells[i].to[0])), ...st.ids.map(i => ({ ['c' + i]: { y: s.cells[i].to[1] } })), fill(b, st.ids.map(i => 'c' + i), 'success'), st.set || {}), 1000]));
  sl.push([s.result.cap, T('note', 'result: ' + s.result.text, { fill: 'success' }), 500]);
  return { b, slides: slides(sl) };
}

// grid of cells: outlined first, then filled
// spec: {call, note, rows, cols, init:str, steps:[{cells:[[r,c]], text?, cap, color?}], intro, result}
function gridFill(s) {
  const b = new B(); b.title(s.call); b.note(s.note);
  const cx = c => 500 + (c - (s.cols - 1) / 2) * 120, cy = r => 300 + (r - (s.rows - 1) / 2) * 110;
  const id = (r, c) => 'c' + r + '_' + c;
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
    b.item(id(r, c), s.init, cx(c), cy(r), { w: 90, h: 90, fill: 'surface', visible: false });
  }
  const sl = [[s.intro]];
  sl.push([s.allocCap, (() => { const ch = []; for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) ch.push(show(b, [id(r, c)])); return M(...ch); })(), 700]);
  s.steps.forEach(st => sl.push([st.cap, M(...st.cells.map(([r, c], k) => M(lab(id(r, c), st.texts ? st.texts[k] : st.text), fill(b, [id(r, c)], st.color || 'success'))))]));
  sl.push([s.result.cap, T('note', 'result: ' + s.result.text, { fill: 'success' }), 500]);
  return { b, slides: slides(sl) };
}

// grid shown with values; steps edit cells
// spec: {call, note, grid:[[v]], steps:[{cells:[[r,c,text?]], color, cap}], intro, result}
function gridEdit(s) {
  const b = new B(); b.title(s.call); b.note(s.note);
  const R_ = s.grid.length, C_ = s.grid[0].length;
  const cx = c => 500 + (c - (C_ - 1) / 2) * 120, cy = r => 300 + (r - (R_ - 1) / 2) * 110;
  s.grid.forEach((row, r) => row.forEach((v, c) => b.item('c' + r + '_' + c, String(v), cx(c), cy(r), { w: 90, h: 90 })));
  const sl = [[s.intro]];
  s.steps.forEach(st => sl.push([st.cap, M(...st.cells.map(([r, c, t]) => M(t === undefined ? {} : lab('c' + r + '_' + c, t), fill(b, ['c' + r + '_' + c], st.color || 'success'))))]));
  sl.push([s.result.cap, T('note', 'result: ' + s.result.text, { fill: 'success' }), 500]);
  return { b, slides: slides(sl) };
}

module.exports = { stepAnim, gridMove, gridFill, gridEdit, spread };
