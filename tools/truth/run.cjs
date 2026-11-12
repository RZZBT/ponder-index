// Truth check for the non-NumPy libraries: runs each animation's example in the real library and compares the result
// with what the animation claims. (NumPy is checked inside build.cjs, see src/numpy.cjs.)
//   node truth/run.cjs [--strict]
// Needs the packages from `node verify.cjs` (tools/.cache). Libraries whose runtime is not installed here (Java, Go,
// PHP) are listed as NOT RUN: their examples are unverified, not passed.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { CACHE, INDEX_ROOT, PYTHON } = require('../config.cjs');

const strict = process.argv.includes('--strict');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(INDEX_ROOT, f), 'utf8'));
const animationText = (file, id) => {
  const hits = rd(file).documents.map((d) => d.ponder.animations[id]).filter(Boolean);
  return hits.length ? JSON.stringify(hits[0]) : null;
};
const norm = (v) => JSON.stringify(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const need = (p) => { if (!fs.existsSync(p)) throw new Error(`${p} not found: run \`node verify.cjs\` first`); return p; };
const nm = (n) => path.join(CACHE, 'npm', 'node_modules', n);

const results = [];   // { lib, id, ok, detail }
const record = (lib, file, id, claim, actual, expected) => {
  const text = animationText(file, id);
  let ok = norm(actual) === norm(expected), detail = ok ? '' : `got ${norm(actual)}, expected ${norm(expected)}`;
  if (ok && (text === null || !text.includes(claim))) { ok = false; detail = `the animation does not show "${claim}" any more`; }
  results.push({ lib, id, ok, detail });
};

async function lodash() {
  const _ = require(need(nm('lodash'))), F = 'v1/npm/lodash.json';
  record('lodash', F, 'chunk', '[[1, 2], [3, 4], [5]]', _.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  record('lodash', F, 'group-by', '{ 4: [4.2], 6: [6.1, 6.3] }', _.groupBy([6.1, 4.2, 6.3], Math.floor), { 4: [4.2], 6: [6.1, 6.3] });
  record('lodash', F, 'uniq', '[1, 2, 3]', _.uniq([1, 2, 2, 1, 3]), [1, 2, 3]);
  record('lodash', F, 'flatten', '[1, 2, [3, [4]], 5]', _.flatten([1, [2, [3, [4]], 5]]), [1, 2, [3, [4]], 5]);
  // debounce(func, 300), called at 0, 100 and 200 ms: one run, about 500 ms in, with the last call's argument
  const runs = [], t0 = Date.now();
  const d = _.debounce((x) => runs.push([Date.now() - t0, x]), 300);
  d('call 1'); await sleep(100); d('call 2'); await sleep(100); d('call 3'); await sleep(450);
  const [at, arg] = runs[0] || [0, ''];
  record('lodash', F, 'debounce', 'func ran once, at 500 ms', [runs.length, at >= 460 && at <= 600, arg], [1, true, 'call 3']);
}

function dateFns() {
  for (const dir of ['date-fns', 'date-fns-2']) {
    const df = require(need(nm(dir))), F = 'v1/npm/date-fns.json', lib = `date-fns (${dir})`;
    record(lib, F, 'add-days', 'Sun Feb 04 2024', df.addDays(new Date(2024, 0, 30), 5).toDateString(), 'Sun Feb 04 2024');
    record(lib, F, 'difference-in-days', 'result: 14', df.differenceInDays(new Date(2024, 0, 15), new Date(2024, 0, 1)), 14);
    const s = df.startOfWeek(new Date(2024, 0, 17));
    record(lib, F, 'start-of-week', 'Sun Jan 14 2024, 00:00', `${s.toDateString()}, ${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`, 'Sun Jan 14 2024, 00:00');
  }
}

function moreItertools() {
  const code = [
    'import sys, json',
    `sys.path.insert(0, sys.argv[1])`,
    'from more_itertools import chunked, windowed, flatten',
    'print(json.dumps({"chunked": list(chunked([1,2,3,4,5,6,7,8], 3)), "windowed": [list(w) for w in windowed([1,2,3,4,5], 3)], "flatten": list(flatten([[1,2],[3],[4,5]]))}))',
  ].join('\n');
  const out = JSON.parse(cp.execFileSync(PYTHON, ['-I', '-c', code, need(path.join(CACHE, 'pypi-latest'))], { encoding: 'utf8' }));
  const F = 'v1/pypi/more-itertools.json';
  record('more-itertools', F, 'chunked', '[[1, 2, 3], [4, 5, 6], [7, 8]]', out.chunked, [[1, 2, 3], [4, 5, 6], [7, 8]]);
  record('more-itertools', F, 'windowed', '(1, 2, 3), (2, 3, 4), (3, 4, 5)', out.windowed, [[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  record('more-itertools', F, 'flatten', 'result: 1, 2, 3, 4, 5', out.flatten, [1, 2, 3, 4, 5]);
}

// Every Rust animation carries `rs`, an expression that computes the result it shows (src/rust/*.cjs). They are
// compiled into one program (truth/rust/Cargo.toml + prelude.rs) and run against the real crates.
function rustCrates() {
  const { addRust } = require('../src/rust/index.cjs');
  const cases = addRust({}, process.env.RUST_ONLY ? process.env.RUST_ONLY.split(',') : null);
  const dir = path.join(CACHE, 'rust-truth');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'rust', 'Cargo.toml'), path.join(dir, 'Cargo.toml'));
  const body = cases.map((c) => `    out.insert(${JSON.stringify(c.crate + '/' + c.key)}, (|| -> String { ${c.rs} })());`).join('\n');
  const main = fs.readFileSync(path.join(__dirname, 'rust', 'prelude.rs'), 'utf8') +
    `\nfn main() {\n    let mut out: std::collections::BTreeMap<&str, String> = std::collections::BTreeMap::new();\n${body}\n    println!("{}", serde_json::to_string(&out).unwrap());\n}\n`;
  const mainPath = path.join(dir, 'src', 'main.rs');
  if (!fs.existsSync(mainPath) || fs.readFileSync(mainPath, 'utf8') !== main) fs.writeFileSync(mainPath, main);
  const r = cp.spawnSync('cargo', ['run', '--quiet', '--manifest-path', path.join(dir, 'Cargo.toml')], {
    encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, CARGO_TARGET_DIR: path.join(CACHE, 'cargo-target'), CARGO_BUILD_JOBS: process.env.CARGO_BUILD_JOBS || '2' },
  });
  if (r.status !== 0) {
    const errs = (r.stderr || '').split('\n').filter((l) => /^error|-->|panicked/.test(l)).slice(0, 30).join('\n      ');
    throw new Error(`cargo run failed (${mainPath}):\n      ${errs || (r.stderr || '').slice(-1500)}`);
  }
  const out = JSON.parse(r.stdout.trim().split('\n').pop());
  for (const c of cases) record(c.crate, c.file, c.key, JSON.stringify(c.claim).slice(1, -1), out[c.crate + '/' + c.key], c.expect);
}

// The Rust standard-library animations (src/rust_std/*.cjs): one program with no dependencies.
function rustStd() {
  const { addRustStd } = require('../src/rust_std/index.cjs');
  const only = process.env.RUST_STD_ONLY ? process.env.RUST_STD_ONLY.split(',') : null;
  const cases = addRustStd({}).filter((c) => !only || only.some((o) => c.key.startsWith(o)));
  const dir = path.join(CACHE, 'rust-std-truth');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'rust-std', 'Cargo.toml'), path.join(dir, 'Cargo.toml'));
  const body = cases.map((c) => `    out.push((${JSON.stringify(c.key)}, (|| -> String { ${c.rs} })()));`).join('\n');
  // Output protocol without escaping: key US value RS, with the ASCII unit (0x1F) and record (0x1E) separators.
  const main = fs.readFileSync(path.join(__dirname, 'rust-std', 'prelude.rs'), 'utf8') +
    `\nfn main() {\n    let mut out: Vec<(&str, String)> = Vec::new();\n${body}\n    for (k, v) in out { print!("{}\\u{1f}{}\\u{1e}", k, v); }\n}\n`;
  const mainPath = path.join(dir, 'src', 'main.rs');
  if (!fs.existsSync(mainPath) || fs.readFileSync(mainPath, 'utf8') !== main) fs.writeFileSync(mainPath, main);
  const r = cp.spawnSync('cargo', ['run', '--quiet', '--manifest-path', path.join(dir, 'Cargo.toml')], {
    encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, CARGO_TARGET_DIR: path.join(CACHE, 'cargo-target-std'), CARGO_BUILD_JOBS: process.env.CARGO_BUILD_JOBS || '2' },
  });
  if (r.status !== 0) {
    const errs = (r.stderr || '').split('\n').filter((l) => /^error|-->|panicked/.test(l)).slice(0, 40).join('\n      ');
    throw new Error(`cargo run failed (${mainPath}):\n      ${errs || (r.stderr || '').slice(-1500)}`);
  }
  const out = Object.fromEntries(r.stdout.split('\u001e').filter((x) => x.includes('\u001f')).map((x) => x.split('\u001f')));
  for (const c of cases) record('rust std', c.file, c.anim, JSON.stringify(c.claim).slice(1, -1), out[c.key], c.expect);
}

const have = (cmd, ...a) => { try { cp.execFileSync(cmd, a, { stdio: 'ignore' }); return true; } catch { return false; } };

(async () => {
  const all = [['lodash', lodash], ['date-fns', dateFns], ['more-itertools', moreItertools], ['rust crates', rustCrates], ['rust std', rustStd]];
  const steps = process.env.TRUTH_ONLY ? all.filter(([n]) => process.env.TRUTH_ONLY.split(',').includes(n)) : all;
  const notRun = [];
  for (const [name, fn] of steps) {
    try { await fn(); } catch (e) { notRun.push(`${name}: ${String(e.message).slice(0, 3000)}`); }
  }
  // No runtime here for these: say so instead of passing them silently.
  const missing = [['java', ['-version'], 'guava, commons-lang3'], ['go', ['version'], 'samber/lo'], ['php', ['--version'], 'illuminate/collections']];
  for (const [cmd, a, libs] of missing) if (!have(cmd, ...a)) notRun.push(`${libs}: \`${cmd}\` is not installed on this machine`);

  let failed = 0;
  for (const r of results) { if (!r.ok) failed++; console.log(`  ${r.ok ? 'ok   ' : 'FAIL '} ${r.lib.padEnd(24)} ${r.id}${r.detail ? '  ' + r.detail : ''}`); }
  for (const n of notRun) console.log(`  NOT RUN  ${n}`);
  console.log(`\n${results.length - failed} of ${results.length} examples match the real libraries; ${notRun.length} group(s) not run`);
  process.exit(failed > 0 || (strict && notRun.length > 0) ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
