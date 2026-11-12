// Downloads crates from crates.io into tools/.cache/crates (source only, nothing is built or run).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { CACHE, PYTHON } = require('../config.cjs');
const UA = { 'User-Agent': 'ponder-index-tools' };
const num = (s) => String(s).split(/[.+-]/).slice(0, 3).map(Number);
const cmp = (a, b) => { for (let i = 0; i < 3; i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d < 0 ? -1 : 1; } return 0; };
const idxPath = (n) => n.length === 1 ? `1/${n}` : n.length === 2 ? `2/${n}` : n.length === 3 ? `3/${n[0]}/${n}` : `${n.slice(0, 2)}/${n.slice(2, 4)}/${n}`;
async function versions(name) {
  const r = await fetch(`https://index.crates.io/${idxPath(name.toLowerCase())}`, { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status} index ${name}`);
  return (await r.text()).trim().split('\n').map((l) => JSON.parse(l)).filter((e) => !e.yanked && !e.vers.includes('-')).map((e) => e.vers).sort((a, b) => cmp(num(a), num(b)));
}
// spec: 'latest' or an exact version, or a prefix like '1.5' (newest 1.5.x; the oldest one with oldest = true)
async function crate(name, spec = 'latest', oldest = false) {
  const all = await versions(name);
  const m = all.filter((x) => x === spec || x.startsWith(spec + '.')); const v = spec === 'latest' ? all[all.length - 1] : oldest ? m[0] : m.pop();
  if (!v) throw new Error(`no version ${spec} of ${name}`);
  const dir = path.join(CACHE, 'crates'); fs.mkdirSync(dir, { recursive: true });
  const to = path.join(dir, `${name}-${v}`);
  if (!fs.existsSync(to)) {
    const file = path.join(dir, `${name}-${v}.crate`);
    if (!fs.existsSync(file)) {
      const r = await fetch(`https://static.crates.io/crates/${name}/${name}-${v}.crate`, { headers: UA });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${name}-${v}`);
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    }
    cp.execFileSync(PYTHON, ['-I', '-c', 'import sys,tarfile; tarfile.open(sys.argv[1]).extractall(sys.argv[2], filter="data")', file, dir]);
  }
  return { name, version: v, path: to };
}
module.exports = { crate, versions, cmp, num };
