// Builds src/rust-std-symbols.json: for every Rust standard-library animation (src/rust_std/*.cjs), the symbol the
// IDEs produce for the declaration a call lands on, its aliases, and the index module (v1/std/rust/<module>.json).
//   node rust/std-symbols.cjs        (reads the toolchain's rust-src; no network)
// Each animation says where to look: at: [crate, container, file pattern, fn name?]; container '' = free function,
// e.g. ['alloc', 'Vec', /vec\/mod\.rs$/] or ['core', '', /slice\/mod\.rs$/] for slice methods (impl<T> [T] has no name).
const fs = require('fs'), path = require('path');
const { find } = require('./locate.cjs');
const { stdRoots, moduleOf } = require('./std.cjs');
const { specs } = require('../src/rust_std/index.cjs');

const matches = (f, container, file) => {
  if (file && !file.test(f.file)) return false;
  if (f.macro || /\b(tests?|benches|examples)\b/.test(f.file)) return false;
  const owner = f.vs.length >= 2 ? f.vs[f.vs.length - 2] : '';
  return container === '' ? f.vs.length === 1 : owner === container;
};

const { roots, version } = stdRoots();
const out = {}; let bad = 0;
for (const s of specs()) {
  const [crate, container, file, fnName] = s.at;
  const fn = fnName || s.fn;
  const hits = find(roots[crate], fn).filter((f) => matches(f, container, file));
  if (!hits.length) { bad++; console.log(`NOT FOUND ${s.id}: ${crate} ${container || '(free)'}::${fn} ${file || ''}`); continue; }
  const first = hits[0];
  const syms = [...new Set(hits.flatMap((h) => [h.sym.vs[0], h.sym.ij[0], h.sym.vs[1], h.sym.ij[1]]))];
  const ordered = [...syms.filter((x) => x.startsWith('rust:')), ...syms.filter((x) => x.startsWith('sym:'))];
  const files = [...new Set(hits.map((h) => moduleOf(crate, h.file)))];
  if (files.length > 1) console.log(`note ${s.id}: declared in several modules ${files.join(', ')}; using ${files[0]}`);
  out[s.id] = { symbol: ordered[0], aliases: ordered.slice(1, 17), module: moduleOf(crate, first.file), file: `${crate}/${first.file}` };
  if (process.env.VERBOSE) console.log(s.id, out[s.id].module, ordered.join(' '));
}
// the same symbol must not point at two animations
const seen = new Map();
for (const [k, v] of Object.entries(out)) for (const sym of [v.symbol, ...v.aliases]) {
  if (seen.has(sym)) { bad++; console.log(`SHARED ${sym}: ${seen.get(sym)} and ${k}`); } else seen.set(sym, k);
}
fs.writeFileSync(path.join(__dirname, '..', 'src', 'rust-std-symbols.json'), JSON.stringify({ rust: version, symbols: out }, null, 1) + '\n');
const mods = {}; for (const v of Object.values(out)) mods[v.module] = (mods[v.module] || 0) + 1;
console.log(`Rust ${version}: ${Object.keys(out).length} animations in ${Object.keys(mods).length} modules, ${bad} problem(s)`);
console.log('  ' + Object.entries(mods).sort().map(([m, n]) => `${m} ${n}`).join(', '));
process.exit(bad ? 1 : 0);
