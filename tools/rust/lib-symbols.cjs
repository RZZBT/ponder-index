// Builds src/rust-lib-symbols.json for the Rust library animations (src/rust_libs): the symbol VS Code produces for
// the declaration a call lands on, plus aliases (RustRover's form, the full path when the declaration sits inside a
// macro call, sym: paths), from the newest and the oldest version of each package's range (PACKAGES[pkg].check).
//   node rust/lib-symbols.cjs        (downloads the sources into .cache/crates; nothing is built or run)
// Every checked version must declare the function, else the range in PACKAGES is too wide.
const fs = require('fs'), path = require('path');
const { crate } = require('./crates.cjs');
const { find, symbolsFor } = require('./locate.cjs');
const { PACKAGES, specs } = require('../src/rust_libs/index.cjs');
const OLD = require('../src/rust-symbols.json');

// container: '' (free function) or outline names joined by '::' that must come right before the function
const matches = (f, container, file) => {
  if (file && !file.test(f.file)) return false;
  if (/(^|\/)(tests?|benches|examples)\//.test(f.file)) return false;
  const names = f.vs.slice(0, -1);
  if (container === '') return names.length === 0;
  const want = container.split('::');
  return want.length <= names.length && want.every((w, i) => names[names.length - want.length + i] === w);
};

(async () => {
  const all = specs();
  const roots = {}, sinceRoots = {};
  for (const pkg of new Set(all.map((a) => (Array.isArray(a.at[0]) ? a.at[0] : a.at)[0]))) {
    roots[pkg] = [];
    for (const v of PACKAGES[pkg].check) roots[pkg].push(await crate(pkg, v, v !== 'latest'));
    for (const v of new Set(Object.values(PACKAGES[pkg].since || {}))) sinceRoots[`${pkg} ${v}`] = await crate(pkg, v);
  }
  const out = {}; let bad = 0;
  for (const s of all) {
    const places = Array.isArray(s.at[0]) ? s.at : [s.at];
    const syms = [];
    // several places: where the call lands differs between versions (an override added later), so each checked
    // version must declare the function in at least one of them
    const found = new Map(); const missing = [];
    for (const [pkg, container, file, fnName] of places) {
      const fn = fnName || s.fn;
      const since = (PACKAGES[pkg].since || {})[s.id];
      for (const r of since ? [roots[pkg][0], sinceRoots[`${pkg} ${since}`]] : roots[pkg]) {
        const hits = find(r.path, fn).filter((f) => matches(f, container, file));
        const v = `${pkg} ${r.version}`; found.set(v, (found.get(v) || 0) + hits.length);
        if (!hits.length) { missing.push(`${s.id}: ${v} ${container || '(free)'}::${fn} ${file || ''}`); continue; }
        if (hits.length > 1 && new Set(hits.map((h) => h.sym.vs[0])).size > 1 && process.env.VERBOSE) console.log(`note ${s.id}: ${hits.length} declarations in ${pkg} ${r.version}`);
        for (const h of hits) {
          // VS Code's form inside a macro call has only the names outside it (rust-analyzer's outline stops there)
          if (h.vsOuter) { const o = symbolsFor(r.path, { ...h, vs: h.vsOuter }); syms.push(o.vs[0], o.vs[1]); }
          syms.push(h.sym.vs[0], h.sym.ij[0], h.sym.vs[1], h.sym.ij[1]);
        }
      }
    }
    for (const m of missing) if (!found.get(m.split(': ')[1].split(' ').slice(0, 2).join(' '))) { bad++; console.log(`NOT FOUND ${m}`); }
    const uniq = [...new Set(syms)];
    const ordered = [...uniq.filter((x) => x.startsWith('rust:')), ...uniq.filter((x) => x.startsWith('sym:'))];
    if (!ordered.length) continue;
    out[s.id] = { symbol: ordered[0], aliases: ordered.slice(1, 17) };
    if (process.env.VERBOSE) console.log(s.id, ordered.join(' '));
  }
  // one symbol, one animation: within this set (ambiguous aliases are dropped) and against the older crate animations
  // per package: a sym: path like src/map.rs:Map.insert exists in several crates, and only matters inside one file
  const pkgOf = (id) => { const s = all.find((a) => a.id === id); return (Array.isArray(s.at[0]) ? s.at[0] : s.at)[0]; };
  const owners = new Map();
  for (const [k, v] of Object.entries(out)) for (const sym of [v.symbol, ...v.aliases]) { const key = `${pkgOf(k)} ${sym}`; owners.set(key, [...(owners.get(key) || []), k]); }
  for (const [key, ks] of owners) {
    if (ks.length < 2) continue;
    const sym = key.slice(key.indexOf(' ') + 1);
    if (ks.some((k) => out[k].symbol === sym)) { bad++; console.log(`SHARED ${sym}: ${ks.join(' and ')}`); continue; }
    for (const k of ks) out[k].aliases = out[k].aliases.filter((a) => a !== sym);
  }
  const old = new Map();
  for (const [k, v] of Object.entries(OLD)) for (const sym of [v.symbol, ...v.aliases]) if (sym.startsWith('rust:')) old.set(sym, k);
  for (const [k, v] of Object.entries(out)) if (old.has(v.symbol)) { bad++; console.log(`ALREADY ANIMATED ${k}: ${v.symbol} is ${old.get(v.symbol)}`); }
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'rust-lib-symbols.json'), JSON.stringify(out, null, 1) + '\n');
  const per = {}; for (const s of all) { const p = (Array.isArray(s.at[0]) ? s.at[0] : s.at)[0]; per[p] = (per[p] || 0) + 1; }
  console.log(`Rust libraries: ${Object.keys(out).length} animations in ${Object.keys(per).length} packages, ${bad} problem(s)`);
  console.log('  ' + Object.entries(per).sort().map(([p, n]) => `${p} ${n}`).join(', '));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
