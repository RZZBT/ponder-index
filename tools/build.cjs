// Generates docs/ (the published index), then validates it the way the IDEs will read it. Exit code 1 when anything is wrong.
//   node build.cjs        generate + layout check + NumPy truth check + `ponder check-index`
// Package verification (`ponder check` against real installs) and the other truth checks are separate steps:
//   node verify.cjs   node truth/run.cjs     (see package.json: `npm run all`)
const cp = require('child_process');
const { INDEX_ROOT, PONDER_CLI } = require('./config.cjs');
const pk = require('./src/packages.cjs');
const np = require('./src/numpy.cjs');           // adds the NumPy animations to pk.out and truth-checks them
require('./src/rust/index.cjs').addRust(pk.out); // the Rust crates (truth-checked by truth/run.cjs, which compiles their examples)
require('./src/rust_std/index.cjs').addRustStd(pk.out); // the Rust standard library, v1/std/rust/<module>.json (Ponder 0.3)
const { writeIndex } = require('./src/write.cjs');

for (const [file, doc] of Object.entries(pk.out)) pk.check(file, doc);   // stage bounds, overlaps, slide counts, aliases
if (pk.problems() > 0 || np.wrong > 0) {
  console.error(`layout problems in ${pk.problems()} file(s); nothing written`);
  process.exit(1);
}

console.log('writing', INDEX_ROOT);
writeIndex(INDEX_ROOT, pk.out);

console.log('\nponder check-index');
const r = cp.spawnSync(process.execPath, [PONDER_CLI, 'check-index', INDEX_ROOT], { stdio: 'inherit' });
process.exit(r.status === 0 ? 0 : 1);
