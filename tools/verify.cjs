// Runs `ponder check` for every document of the index against the real, installed package, the way an IDE finds it.
//   node verify.cjs [--only numpy] [--strict]
// Packages are downloaded into tools/.cache (git-ignored). A document is checked against every install whose version
// is inside its `versions` range.
//   - A primary symbol that does not resolve is always an error.
//   - An alias that points to a layout this install does not have (another version, the source-repository path) is only
//     reported: aliases exist for those cases. An alias whose file exists but whose name is missing is an error.
//   - --strict also fails when a package could not be downloaded.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { CACHE, INDEX_ROOT, PONDER_CLI, PYTHON } = require('./config.cjs');

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const strict = args.includes('--strict');
const UA = { 'User-Agent': 'ponder-index-tools' };

const run = (cmd, a, opts = {}) => cp.execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28, ...opts });
const runShell = (line, opts = {}) => cp.execSync(line, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28, ...opts });
async function get(url, json) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return json ? r.json() : json === false ? r.text() : Buffer.from(await r.arrayBuffer());
}
const mkdir = (d) => (fs.mkdirSync(d, { recursive: true }), d);
const unzip = (zip, to) => run(PYTHON, ['-I', '-m', 'zipfile', '-e', zip, to]);
const sole = (dir) => { const e = fs.readdirSync(dir); return path.join(dir, e.length === 1 ? e[0] : ''); };
async function download(url, file) { if (!fs.existsSync(file)) { mkdir(path.dirname(file)); fs.writeFileSync(file, await get(url)); } return file; }

// ---- versions: same grammar as the IDEs (index-protocol.ts), prerelease tags ignored
const num = (s) => { const m = /^v?(\d+(?:\.\d+)*)/.exec(String(s).trim()); return m ? m[1].split('.').map(Number) : null; };
const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d < 0 ? -1 : 1; } return 0; };
function inRange(version, range) {
  if (!range || !range.trim() || range.trim() === '*') return true;
  const v = num(version); if (!v) return false;
  return range.split(/[\s,]+/).filter(Boolean).every((p) => {
    const m = /^(>=|<=|>|<|=)?(.+)$/.exec(p); const c = cmp(v, num(m[2]));
    return { '>=': c >= 0, '<=': c <= 0, '>': c > 0, '<': c < 0, '=': c === 0 }[m[1] || '='];
  });
}

// ---- installs: each returns [{ label, version, kind: 'folder' | 'jar', path }]
async function npmInstalls(specs) {
  const dir = mkdir(path.join(CACHE, 'npm'));
  if (!fs.existsSync(path.join(dir, 'package.json'))) fs.writeFileSync(path.join(dir, 'package.json'), '{"private":true}');
  // Install only what is missing (the registry can be slow). A folder without package.json is a half-finished install.
  const complete = (s) => fs.existsSync(path.join(dir, 'node_modules', s.dir, 'package.json'));
  const missing = specs.filter((s) => !complete(s));
  for (const s of missing) fs.rmSync(path.join(dir, 'node_modules', s.dir), { recursive: true, force: true });
  if (missing.length) runShell(`npm install --ignore-scripts --no-audit --no-fund --save --silent ${missing.map((s) => s.spec).join(' ')}`, { cwd: dir, timeout: 900000 });
  return specs.map((s) => {
    const p = path.join(dir, 'node_modules', s.dir);
    return { label: s.dir, version: JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8')).version, kind: 'folder', path: p };
  });
}
async function pipInstall(name, pkgDir) {
  const dir = mkdir(path.join(CACHE, 'pypi-latest'));
  if (!fs.existsSync(path.join(dir, pkgDir))) run(PYTHON, ['-m', 'pip', 'install', '--quiet', '--no-deps', '--only-binary=:all:', '--target', dir, name]);
  const dist = fs.readdirSync(dir).find((e) => e.toLowerCase().startsWith(name.replace(/-/g, '_').toLowerCase() + '-') && e.endsWith('.dist-info'));
  const version = dist ? dist.slice(name.length + 1, -'.dist-info'.length) : '0';
  return [{ label: `${name} ${version}`, version, kind: 'folder', path: path.join(dir, pkgDir) }];
}
async function numpy1() {   // 1.26 has no wheel for this Python; download the cp312 wheel and read its files (nothing is run)
  const dest = path.join(CACHE, 'numpy-1.26.4');
  if (!fs.existsSync(path.join(dest, 'numpy'))) {
    const dl = mkdir(path.join(CACHE, 'numpy-1-wheel'));
    run(PYTHON, ['-m', 'pip', 'download', '--quiet', '--no-deps', '--only-binary=:all:', '--python-version', '3.12', '--platform', 'win_amd64', 'numpy==1.26.4', '-d', dl]);
    unzip(path.join(dl, fs.readdirSync(dl).find((f) => f.endsWith('.whl'))), mkdir(dest));
  }
  return [{ label: 'numpy 1.26.4', version: '1.26.4', kind: 'folder', path: path.join(dest, 'numpy') }];
}
async function crateInstall(name) {
  const idx = (await get(`https://index.crates.io/${name.length > 3 ? `${name.slice(0, 2)}/${name.slice(2, 4)}` : '3/' + name[0]}/${name}`, false)).trim().split('\n').map((l) => JSON.parse(l));
  const v = idx.filter((e) => !e.yanked && !e.vers.includes('-')).map((e) => e.vers).sort((a, b) => cmp(num(a), num(b))).pop();
  const file = await download(`https://static.crates.io/crates/${name}/${name}-${v}.crate`, path.join(CACHE, 'crates', `${name}-${v}.crate`));
  const to = path.join(CACHE, 'crates', `${name}-${v}`);
  if (!fs.existsSync(to)) run(PYTHON, ['-I', '-c', 'import sys,tarfile; tarfile.open(sys.argv[1]).extractall(sys.argv[2], filter="data")', file, path.join(CACHE, 'crates')]);
  return [{ label: `${name} ${v}`, version: v, kind: 'folder', path: to }];
}
async function goInstall(mod) {
  const v = (await get(`https://proxy.golang.org/${mod}/@latest`, true)).Version;
  const zip = await download(`https://proxy.golang.org/${mod}/@v/${v}.zip`, path.join(CACHE, 'go', `${mod.replace(/\//g, '_')}-${v}.zip`));
  const to = path.join(CACHE, 'go', `${mod.replace(/\//g, '_')}-${v}`);
  if (!fs.existsSync(to)) unzip(zip, mkdir(to));
  return [{ label: `${mod} ${v}`, version: v, kind: 'folder', path: path.join(to, ...`${mod}@${v}`.split('/')) }];
}
async function composerInstall(name) {
  const meta = await get(`https://repo.packagist.org/p2/${name}.json`, true);
  const rel = meta.packages[name].find((e) => !/dev|alpha|beta|rc/i.test(e.version));
  const zip = await download(rel.dist.url, path.join(CACHE, 'composer', `${name.replace('/', '_')}-${rel.version}.zip`));
  const to = path.join(CACHE, 'composer', `${name.replace('/', '_')}-${rel.version}`);
  if (!fs.existsSync(to)) unzip(zip, mkdir(to));
  return [{ label: `${name} ${rel.version}`, version: rel.version, kind: 'folder', path: sole(to) }];
}
async function mavenInstalls(group, artifact, extraVersions = []) {
  const base = `https://repo1.maven.org/maven2/${group.replace(/\./g, '/')}/${artifact}`;
  const release = /<release>([^<]+)<\/release>/.exec(await get(`${base}/maven-metadata.xml`, false))[1];
  const out = [];
  for (const v of [release, ...extraVersions]) {
    const jar = await download(`${base}/${v}/${artifact}-${v}.jar`, path.join(CACHE, 'maven', `${artifact}-${v}.jar`));
    out.push({ label: `${artifact} ${v}`, version: v, kind: 'jar', path: jar });
  }
  return out;
}

const PACKAGES = {
  'v1/npm/lodash.json': () => npmInstalls([{ spec: 'lodash@4', dir: 'lodash' }]),
  'v1/npm/date-fns.json': () => npmInstalls([{ spec: 'date-fns@latest', dir: 'date-fns' }, { spec: 'date-fns-2@npm:date-fns@2.30.0', dir: 'date-fns-2' }]),
  'v1/pypi/numpy.json': async () => [...(await pipInstall('numpy', 'numpy')), ...(await numpy1())],
  'v1/pypi/more-itertools.json': () => pipInstall('more-itertools', 'more_itertools'),
  'v1/crates/itertools.json': () => crateInstall('itertools'),
  'v1/go/github.com/samber/lo.json': () => goInstall('github.com/samber/lo'),
  'v1/packagist/illuminate/collections.json': () => composerInstall('illuminate/collections'),
  'v1/maven/com.google.guava/guava.json': () => mavenInstalls('com.google.guava', 'guava', ['20.0']),
  'v1/maven/org.apache.commons/commons-lang3.json': () => mavenInstalls('org.apache.commons', 'commons-lang3'),
};

// ---- one `ponder check`
const LINE = /^ {2}(error|warn |ok {3}|note )\s+(\$\S+)\s+(.*)$/;
const OTHER_LAYOUT = /not found in the package|no module for|no file .* in the package|^class .* not found/;
function check(install, ponder) {
  const dir = mkdir(path.join(CACHE, 'tmp'));
  let target, cleanup = () => {};
  const text = JSON.stringify(ponder);
  if (install.kind === 'jar') {
    target = path.join(dir, path.basename(install.path));
    fs.copyFileSync(install.path, target);
    const j = path.join(dir, 'ponder.json'); fs.writeFileSync(j, text);
    run(PYTHON, ['-I', '-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],"a"); z.write(sys.argv[2],"META-INF/ponder/ponder.json"); z.close()', target, j]);
    cleanup = () => { fs.rmSync(target, { force: true }); fs.rmSync(j, { force: true }); };
  } else {
    target = path.join(install.path, 'ponder.json');
    fs.writeFileSync(target, text);
    cleanup = () => fs.rmSync(target, { force: true });
  }
  try {
    const r = cp.spawnSync(process.execPath, [PONDER_CLI, 'check', install.kind === 'jar' ? target : install.path], { encoding: 'utf8', maxBuffer: 1 << 28 });
    const res = { ok: 0, hard: [], soft: [], other: [] };
    for (const line of r.stdout.split('\n')) {
      const m = LINE.exec(line.replace(/\r$/, ''));
      if (!m) continue;
      const [, sev, where, msg] = m;
      const primary = where.endsWith('.symbol');
      if (sev.startsWith('ok')) res.ok++;
      else if (sev.startsWith('error')) (primary || !OTHER_LAYOUT.test(msg) ? res.hard : res.soft).push(`${where}  ${msg}`);
      else res.other.push(`${sev.trim()} ${where}  ${msg}`);
    }
    if (r.status !== 0 && r.status !== 1) res.hard.push(`ponder check crashed: ${r.stderr.slice(0, 300)}`);
    return res;
  } finally { cleanup(); }
}

(async () => {
  let hard = 0, skipped = 0, checked = 0;
  for (const [file, prepare] of Object.entries(PACKAGES)) {
    if (only && !file.includes(only)) continue;
    const index = JSON.parse(fs.readFileSync(path.join(INDEX_ROOT, file), 'utf8'));
    console.log(`\n${index.name}`);
    let installs;
    try { installs = await prepare(); } catch (e) {
      skipped++; console.log(`  SKIPPED: could not install the package (${String(e.message).split('\n')[0].slice(0, 160)})`); continue;
    }
    const covered = new Set();
    for (const inst of installs) {
      index.documents.forEach((d, i) => {
        if (!inRange(inst.version, d.versions)) return;
        covered.add(i);
        const r = check(inst, d.ponder);
        checked++;
        const names = Object.keys(d.ponder.animations).length;
        console.log(`  ${inst.label.padEnd(26)} doc ${i + 1}/${index.documents.length} [${d.versions || 'any'}] ${names} animations: ${r.ok} symbols found, ${r.soft.length} alias(es) for other layouts, ${r.hard.length} error(s)`);
        r.hard.slice(0, 12).forEach((h) => console.log(`      error ${h}`));
        if (r.hard.length > 12) console.log(`      ... ${r.hard.length - 12} more`);
        if (process.env.VERBOSE) r.soft.forEach((h) => console.log(`      other-layout ${h}`));
        hard += r.hard.length;
      });
    }
    const unverified = index.documents.map((d, i) => i).filter((i) => !covered.has(i));
    if (unverified.length) console.log(`  NOT VERIFIED: ${unverified.length} document(s) have a version range with no installed version to check (${[...new Set(unverified.map((i) => index.documents[i].versions))].join(', ')})`);
  }
  console.log(`\n${checked} document check(s), ${hard} error(s), ${skipped} package(s) skipped`);
  process.exit(hard > 0 || (strict && skipped > 0) ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
