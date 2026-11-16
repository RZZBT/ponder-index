// The Rust standard library (plan "Everyday Rust", Ponder 0.3): v1/std/rust/<module>.json.
// Each animation's symbol and module come from src/rust-std-symbols.json (node rust/std-symbols.cjs), built from
// the toolchain's own sources; the files are named after the module the IDE jumps into (alloc.vec, core.iter, ...).
const FILES = [
  './iter.cjs', './iter2.cjs', './vec.cjs', './slice.cjs', './str.cjs', './string.cjs', './option.cjs', './result.cjs',
  './collections.cjs', './misc.cjs', './extras.cjs', './more1.cjs', './more2.cjs', './more3.cjs', './ints.cjs',
  './p05.cjs', './p06.cjs', './p07.cjs', './p08.cjs', './p09.cjs', './p10.cjs', './p11.cjs', './p12.cjs',
  './p13.cjs', './p14.cjs', './p15.cjs', './p16.cjs', './p17.cjs', './p18.cjs', './p19.cjs', './p20.cjs',
];

function specs() {
  const all = [];
  for (const f of FILES) {
    try { all.push(...require(f)); } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' && String(e.message).includes(f.slice(2))) continue; // not written yet
      throw e;
    }
  }
  const ids = new Set();
  for (const a of all) { if (ids.has(a.id)) throw new Error(`duplicate animation id ${a.id}`); ids.add(a.id); }
  return all;
}

const fileOf = (module) => `v1/std/rust/${module}.json`;

/** Adds the standard-library files to `out`; returns the truth cases. */
function addRustStd(out) {
  let table;
  try { table = require('../rust-std-symbols.json'); } catch { throw new Error('src/rust-std-symbols.json is missing: run node rust/std-symbols.cjs'); }
  const byModule = {}; const truth = []; const errors = [];
  for (const a of specs()) {
    const s = table.symbols[a.id];
    if (!s) throw new Error(`no symbol for ${a.id} (run node rust/std-symbols.cjs)`);
    let res;
    try { res = a.build(); } catch (e) { errors.push(`${a.id}: ${e.message}`); continue; }
    const short = a.id.split('/').pop();
    const anims = (byModule[s.module] ||= {});
    const anim = short in anims ? a.id.replace(/\//g, '-') : short; // animation key inside the module file
    anims[anim] = { symbol: s.symbol, aliases: s.aliases, title: a.title, description: a.description, actors: res.b.a, slides: res.slides };
    truth.push({ crate: 'std', key: a.id, anim, rs: a.rs, expect: a.expect, claim: `result: ${a.expect}`, file: fileOf(s.module) });
  }
  if (errors.length) throw new Error(`${errors.length} Rust std animation(s) could not be laid out:\n  ${errors.join('\n  ')}`);
  for (const [module, animations] of Object.entries(byModule)) {
    const name = `rust/${module}`;
    // no "versions": most toolchains live in a folder without a version number, so Ponder often cannot tell it
    out[fileOf(module)] = { ponderIndex: 1, ecosystem: 'std', name, documents: [{ ponder: { version: 1, library: { name }, animations } }] };
  }
  return truth;
}

module.exports = { specs, addRustStd, fileOf };
