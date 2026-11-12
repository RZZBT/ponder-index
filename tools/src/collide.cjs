// Text that overlaps other text or a box it does not belong to, on any slide (the layout check in packages.cjs only
// looks at boxes against boxes). Labels inside their own box or circle are fine.
function textCollisions(an) {
  const st = {}; for (const [k, v] of Object.entries(an.actors)) st[k] = { ...v };
  const abs = (k) => { let x = st[k].x || 0, y = st[k].y || 0; if (st[k].parent) { const p = abs(st[k].parent); x += p[0]; y += p[1]; } return [x, y]; };
  const vis = (k) => { for (let a = st[k]; a; a = a.parent ? st[a.parent] : null) if (a.visible === false || (a.opacity !== undefined && a.opacity < 0.5)) return false; return true; };
  const out = new Set();
  an.slides.forEach((s, i) => {
    for (const [k, c] of Object.entries(s.changes || {})) Object.assign(st[k], c);
    const items = [];
    for (const k of Object.keys(st)) {
      const a = st[k]; if (!vis(k)) continue; const [x, y] = abs(k);
      if (a.type === 'text' && a.text) { const hw = a.text.length * a.fontSize * 0.27; items.push({ k, text: true, free: !a.parent, grp: a.parent, b: [x - hw, y - a.fontSize * 0.5, x + hw, y + a.fontSize * 0.5] }); }
      else if (a.type === 'rectangle') items.push({ k, grp: a.parent, b: [x - a.width / 2, y - a.height / 2, x + a.width / 2, y + a.height / 2] });
      else if (a.type === 'circle') items.push({ k, grp: k, circle: true, b: [x - a.radius, y - a.radius, x + a.radius, y + a.radius] });
    }
    const ov = (p, q) => p.b[0] < q.b[2] - 2 && q.b[0] < p.b[2] - 2 && p.b[1] < q.b[3] - 2 && q.b[1] < p.b[3] - 2;
    for (const p of items) if (p.text) for (const q of items) {
      if (p === q || (p.grp && (p.grp === q.grp || p.grp === q.k))) continue;
      if (q.text && q.k < p.k) continue;
      if (!p.free && !q.text) continue;
      if (q.circle && p.k === 't' + q.k.slice(1)) continue;      // the name written in a graph node
      if (ov(p, q)) out.add(`s${i} text ${p.k} overlaps ${q.k}`);
    }
  });
  return [...out];
}
module.exports = { textCollisions };
