// Popular Rust libraries for Ponder 0.3 (plan "Everyday Rust crates"): animations in the compact kit notation of
// src/rust_std (pick / cells / lines), added to v1/crates/<package>.json next to the 120 older crate animations.
//   at: [package, container, file pattern, fn name?]
//     package    the crate whose sources DECLARE the function: where go-to-definition lands, and so the package
//                Ponder asks the index for. futures::join_all lives in futures-util, clap's Command in clap_builder,
//                Sha256::digest in digest (the Digest trait), parking_lot's Mutex::lock in lock_api.
//     container  '' for a free function, else the outline names before the function, '::'-separated when a module
//                inside the file is part of the path ('sync::Lazy' for once_cell::sync::Lazy in lib.rs).
// Symbols: node rust/lib-symbols.cjs (src/rust-lib-symbols.json), checked against the newest and the oldest version
// of each package's range; rust/lib-ra-check.cjs asks rust-analyzer itself where every example call lands.
// Truth: truth/rust-libs (Cargo.toml + prelude.rs), TRUTH_ONLY="rust libs", RUST_LIBS_ONLY=<id prefixes>.

// Version range of each package's document, and the versions whose sources the symbols are built from (newest first).
// since: functions added after the range's lowest version go into a second document, ">=<version>" (and that version
// is the oldest one checked for them).
const PACKAGES = {
  serde_json: { range: '>=1.0.100', check: ['latest', '1.0.100'], since: { 'serde_json/value-as-number': '1.0.106', 'serde_json/value-sort-all-objects': '1.0.129' } },
  anyhow: { range: '>=1.0.70', check: ['latest', '1.0.70'] },
  regex: { range: '>=1.9', check: ['latest', '1.9'], since: { 'regex/captures-get-match': '1.12.1' } },
  itertools: { range: '>=0.13', check: ['latest', '0.13'], since: { 'itertools/array-windows': '0.15.0', 'itertools/with-position': '0.15.0', 'itertools/array-combinations': '0.14.0', 'itertools/next-array': '0.14.0', 'itertools/collect-array': '0.14.0' } },
  chrono: { range: '>=0.4.35', check: ['latest', '0.4.35'], since: { 'chrono/date-quarter': '0.4.40', 'chrono/date-num-days-in-month': '0.4.41' } },
  rand: { range: '>=0.10', check: ['latest', '0.10'] },
  rand_core: { range: '>=0.10', check: ['latest', '0.10'] },
  fastrand: { range: '>=2.0', check: ['latest', '2.0'] },
  uuid: { range: '>=1.10', check: ['latest', '1.10'] },
  tokio: { range: '>=1.40', check: ['latest', '1.40'] },
  'futures-util': { range: '>=0.3.31', check: ['latest', '0.3.31'] },
  'futures-executor': { range: '>=0.3.31', check: ['latest', '0.3.31'] },
  'futures-channel': { range: '>=0.3.31', check: ['latest', '0.3.31'] },
  rayon: { range: '>=1.8', check: ['latest', '1.8'] },
  'rayon-core': { range: '>=1.12', check: ['latest', '1.12'] },
  clap_builder: { range: '>=4.5', check: ['latest', '4.5'] },
  bytes: { range: '>=1.5', check: ['latest', '1.5'], since: { 'bytes/bytes-try-into-mut': '1.7.0', 'bytes/buf-try-get-u16': '1.10.0' } },
  byteorder: { range: '>=1.4', check: ['latest', '1.4'] },
  indexmap: { range: '>=2.2', check: ['latest', '2.2'], since: { 'indexmap/map-shift-insert': '2.2.3', 'indexmap/map-append': '2.4.0' } },
  smallvec: { range: '>=1.11', check: ['latest', '1.11'] },
  arrayvec: { range: '>=0.7', check: ['latest', '0.7'] },
  once_cell: { range: '>=1.18', check: ['latest', '1.18'] },
  lock_api: { range: '>=0.4.10', check: ['latest', '0.4.10'] },
  parking_lot: { range: '>=0.12', check: ['latest', '0.12'] },
  'crossbeam-channel': { range: '>=0.5.8', check: ['latest', '0.5.8'] },
  'crossbeam-utils': { range: '>=0.8.16', check: ['latest', '0.8.16'] },
  dashmap: { range: '>=6.0', check: ['latest', '6.0'] },
  'num-traits': { range: '>=0.2.17', check: ['latest', '0.2.17'] },
  'num-bigint': { range: '>=0.4.4', check: ['latest', '0.4.4'] },
  url: { range: '>=2.5', check: ['latest', '2.5'] },
  http: { range: '>=1.0', check: ['latest', '1.0'] },
  toml: { range: '>=0.9', check: ['latest', '0.9'] },
  csv: { range: '>=1.3', check: ['latest', '1.3'] },
  'percent-encoding': { range: '>=2.3', check: ['latest', '2.3'] },
  form_urlencoded: { range: '>=1.2', check: ['latest', '1.2'] },
  semver: { range: '>=1.0.20', check: ['latest', '1.0.20'] },
  walkdir: { range: '>=2.4', check: ['latest', '2.4'] },
  glob: { range: '>=0.3.1', check: ['latest', '0.3.1'] },
  tempfile: { range: '>=3.10', check: ['latest', '3.10'] },
  memchr: { range: '>=2.7', check: ['latest', '2.7'] },
  either: { range: '>=1.10', check: ['latest', '1.10'] },
  nom: { range: '>=8.0', check: ['latest', '8.0'] },
  digest: { range: '>=0.10', check: ['latest', '0.10'] },
  crc32fast: { range: '>=1.3', check: ['latest', '1.3'] },
  base64: { range: '>=0.22', check: ['latest', '0.22'] },
  hex: { range: '>=0.4', check: ['latest', '0.4.0'] },
  ndarray: { range: '>=0.16', check: ['latest', '0.16'] },
  rust_decimal: { range: '>=1.33', check: ['latest', '1.33'] },
  time: { range: '>=0.3.31', check: ['latest', '0.3.31'], since: { 'time/month-length': '0.3.37' } },
  humantime: { range: '>=2.1', check: ['latest', '2.1'] },
  itoa: { range: '>=1.0', check: ['latest', '1.0.0'] },
  'unicode-width': { range: '>=0.2', check: ['latest', '0.2'] },
  'unicode-normalization': { range: '>=0.1.22', check: ['latest', '0.1.22'] },
  shlex: { range: '>=1.3', check: ['latest', '1.3'] },
  similar: { range: '>=2.4', check: ['latest', '2.4'] },
  lru: { range: '>=0.12', check: ['latest', '0.12'] },
  petgraph: { range: '>=0.7', check: ['latest', '0.7'] },
  log: { range: '>=0.4.20', check: ['latest', '0.4.20'] },
  strsim: { range: '>=0.11', check: ['latest', '0.11'] },
  heck: { range: '>=0.5', check: ['latest', '0.5'] },
  textwrap: { range: '>=0.16', check: ['latest', '0.16.0'] },
  'unicode-segmentation': { range: '>=1.10', check: ['latest', '1.10'] },
};

const FILES = [];
for (let i = 1; i <= 30; i++) FILES.push(`./l${String(i).padStart(2, '0')}.cjs`);

function specs() {
  const all = [];
  for (const f of FILES) {
    try { all.push(...require(f)); } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' && String(e.message).includes(f.slice(2))) continue; // not written yet
      throw e;
    }
  }
  const ids = new Set();
  for (const a of all) {
    if (ids.has(a.id)) throw new Error(`duplicate animation id ${a.id}`);
    ids.add(a.id);
    const pkg = (Array.isArray(a.at[0]) ? a.at[0] : a.at)[0];
    if (!PACKAGES[pkg]) throw new Error(`${a.id}: package ${pkg} has no entry in PACKAGES`);
    if (a.id.slice(a.id.indexOf('/') + 1).includes('/') || !a.id.startsWith(pkg.replace(/-/g, '_') + '/') && !a.id.startsWith(pkg + '/')) throw new Error(`${a.id}: ids are <package>/<key>`);
  }
  return all;
}

// Clients request the normalized crate name (lowercase, _ and . as -): serde_json -> v1/crates/serde-json.json
const fileOf = (pkg) => `v1/crates/${pkg.toLowerCase().replace(/[_.]+/g, '-')}.json`;
const pkgOf = (a) => (Array.isArray(a.at[0]) ? a.at[0] : a.at)[0];

/** Adds one document per package (after the older crate documents, if the file has them); returns the truth cases. */
function addRustLibs(out, only) {
  let table;
  try { table = require('../rust-lib-symbols.json'); } catch { throw new Error('src/rust-lib-symbols.json is missing: run node rust/lib-symbols.cjs'); }
  const byPkg = {}; const truth = []; const errors = [];
  for (const a of specs()) {
    if (only && !only.some((o) => a.id.startsWith(o))) continue;
    const s = table[a.id];
    if (!s) throw new Error(`no symbol for ${a.id} (run node rust/lib-symbols.cjs)`);
    let res;
    try { res = a.build(); } catch (e) { errors.push(`${a.id}: ${e.message}`); continue; }
    const pkg = pkgOf(a);
    const anims = (byPkg[pkg] ||= {});
    const key = a.id.slice(a.id.indexOf('/') + 1).replace(/\//g, '-');
    if (key in anims) throw new Error(`${a.id}: key ${key} is used twice in ${pkg}`);
    anims[key] = { symbol: s.symbol, aliases: s.aliases, title: a.title, description: a.description, actors: res.b.a, slides: res.slides };
    truth.push({ crate: pkg, key: a.id, anim: key, rs: a.rs, expect: a.expect, claim: `result: ${a.expect}`, file: fileOf(pkg), fn: a.fn, at: a.at, probe: a.probe });
  }
  if (errors.length) throw new Error(`${errors.length} Rust library animation(s) could not be laid out:\n  ${errors.join('\n  ')}`);
  for (const [pkg, animations] of Object.entries(byPkg)) {
    // one document for the package range, one per later "since" version
    const ranges = new Map([[PACKAGES[pkg].range, {}]]);
    for (const [key, anim] of Object.entries(animations)) {
      const since = (PACKAGES[pkg].since || {})[`${pkg}/${key}`];
      const r = since ? `>=${since}` : PACKAGES[pkg].range;
      if (!ranges.has(r)) ranges.set(r, {});
      ranges.get(r)[key] = anim;
    }
    const file = fileOf(pkg);
    // keys must not repeat the older crate animations' keys in the same file (one key, one animation per file)
    for (const d of out[file] ? out[file].documents : []) for (const k of Object.keys(d.ponder.animations)) if (k in animations) throw new Error(`${pkg}/${k}: the key is taken by an older animation in ${file}`);
    if (!out[file]) out[file] = { ponderIndex: 1, ecosystem: 'crates', name: pkg, documents: [] };
    for (const [versions, anims] of ranges) if (Object.keys(anims).length) out[file].documents.push({ versions, ponder: { version: 1, library: { name: pkg }, animations: anims } });
  }
  return truth;
}

module.exports = { PACKAGES, specs, addRustLibs, fileOf, pkgOf };
