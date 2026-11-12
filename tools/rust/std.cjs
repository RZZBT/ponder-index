// Where the Rust standard library sources are (the toolchain's `rust-src` component) and which Rust they belong to.
// Ponder 0.3 recognises a call into these files and asks the index for v1/std/rust/<module>.json.
const cp = require('child_process'), fs = require('fs'), path = require('path');

function sysroot() {
  const r = cp.spawnSync('rustc', ['--print', 'sysroot'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('rustc not found: install Rust from https://rustup.rs');
  return r.stdout.trim();
}

/** { core, alloc, std } source roots (each has Cargo.toml and src/), and the rustc version. */
function stdRoots() {
  const lib = path.join(sysroot(), 'lib', 'rustlib', 'src', 'rust', 'library');
  const roots = {};
  for (const c of ['core', 'alloc', 'std']) {
    const root = path.join(lib, c);
    if (!fs.existsSync(path.join(root, 'src'))) throw new Error(`no Rust sources at ${root}: run \`rustup component add rust-src\``);
    roots[c] = root;
  }
  const v = cp.spawnSync('rustc', ['--version'], { encoding: 'utf8' }).stdout.trim();
  return { roots, version: /rustc (\d+\.\d+\.\d+)/.exec(v)?.[1] ?? v };
}

/**
 * The index module of a declaration file, the way Ponder computes it (engine/src/sources/stdlib.ts):
 * crate + the first folder or file under src/: `alloc` + `src/vec/mod.rs` -> `alloc.vec`; `src/lib.rs` -> `core`.
 */
function moduleOf(crate, file) {
  const mods = file.replace(/^src\//, '').replace(/\.rs$/, '').split('/');
  if (['lib', 'mod', 'main'].includes(mods[mods.length - 1])) mods.pop();
  return mods.length ? `${crate}.${mods[0]}` : crate;
}

module.exports = { sysroot, stdRoots, moduleOf };
