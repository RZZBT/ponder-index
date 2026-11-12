// Rust crates (plan "Rust 1.98 / Ponder 0.2.1", 120 animations in 15 crates). Adds v1/crates/<crate>.json to `out`
// and exports the truth cases for truth/run.cjs.
const SYMS = require('../rust-symbols.json');

// file: animation list module; key in rust-symbols.json is `${crate}/${symKey}` (symKey defaults to key with - → _)
const CRATES = [
  // crate, versions documents [{ versions, skip: [keys] }], module, symbol-key overrides
  { crate: 'itertools', docs: [{ versions: '>=0.10 <0.13', skip: ['chunk-by', 'tree-reduce'] }, { versions: '>=0.13' }], mod: './itertools.cjs' },
  { crate: 'regex', docs: [{ versions: '>=1.9' }], mod: './regex.cjs' },
  { crate: 'serde_json', docs: [{ versions: '>=1.0.100' }], mod: './serde_json.cjs' },
  { crate: 'chrono', docs: [{ versions: '>=0.4.23' }], mod: './chrono.cjs' },
  { crate: 'indexmap', docs: [{ versions: '>=1.9' }], mod: './indexmap.cjs' },
  { crate: 'strsim', docs: [{ versions: '>=0.10' }], mod: './strsim.cjs' },
  { crate: 'num-integer', docs: [{ versions: '>=0.1.44' }], mod: './num_integer.cjs' },
  { crate: 'heck', docs: [{ versions: '>=0.4' }], mod: './text_crates.cjs', prop: 'heck' },
  { crate: 'textwrap', docs: [{ versions: '>=0.16' }], mod: './text_crates.cjs', prop: 'textwrap' },
  { crate: 'semver', docs: [{ versions: '>=1.0' }], mod: './text_crates.cjs', prop: 'semver' },
  { crate: 'base64', docs: [{ versions: '>=0.21' }], mod: './text_crates.cjs', prop: 'base64' },
  { crate: 'hex', docs: [{ versions: '>=0.4' }], mod: './text_crates.cjs', prop: 'hex' },
  { crate: 'url', docs: [{ versions: '>=2.0' }], mod: './text_crates.cjs', prop: 'url' },
  { crate: 'unicode-segmentation', docs: [{ versions: '>=1.9' }], mod: './text_crates.cjs', prop: 'unicode' },
  { crate: 'petgraph', docs: [{ versions: '>=0.6' }], mod: './petgraph.cjs' },
];

// Clients request the normalized crate name (lowercase, _ and . as -): serde_json -> v1/crates/serde-json.json
const fileOf = (crate) => `v1/crates/${crate.toLowerCase().replace(/[_.]+/g, '-')}.json`;

function addRust(out, only) {
  const truth = [], errors = [];
  for (const c of CRATES) {
    if (only && !only.includes(c.crate)) continue;
    let list;
    try { list = require(c.mod); if (c.prop) list = list[c.prop]; } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && String(e.message).includes(c.mod.slice(2))) { console.log(`  (rust: ${c.crate} not written yet)`); continue; } throw e; }
    const built = {};
    for (const a of list) {
      const symKey = `${c.crate}/${a.sym || a.key.replace(/-/g, '_')}`;
      const s = SYMS[symKey] || SYMS[`${c.crate}/${a.key}`];
      if (!s) throw new Error(`no symbol for ${symKey} (run node rust/symbols.cjs)`);
      let res;
      try { res = a.build(); } catch (e) { errors.push(`${c.crate}/${a.key}: ${e.message}`); continue; }
      built[a.key] = { symbol: s.symbol, aliases: s.aliases, title: a.title, description: a.description, actors: res.b.a, slides: res.slides };
      truth.push({ crate: c.crate, key: a.key, rs: a.rs, expect: a.expect, claim: a.claim || a.expect, file: fileOf(c.crate) });
    }
    out[fileOf(c.crate)] = {
      ponderIndex: 1, ecosystem: 'crates', name: c.crate,
      documents: c.docs.map((d) => ({ versions: d.versions, ponder: { version: 1, library: { name: c.crate }, animations: Object.fromEntries(Object.entries(built).filter(([k]) => !(d.skip || []).includes(k))) } })),
    };
  }
  if (errors.length) throw new Error(`${errors.length} Rust animation(s) could not be laid out:\n  ${errors.join('\n  ')}`);
  return truth;
}

module.exports = { addRust, CRATES };
