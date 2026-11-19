// Asks rust-analyzer (the server behind VS Code's Rust support) where every animated call of the Rust library
// animations lands, builds the symbol Ponder's VS Code extension builds from that place (outline names, then the
// declared word: vscode/src/outline.ts rustNames; package name and modules from the crate's Cargo.toml and path:
// engine/src/packages/layout.ts), and checks that the animation lists it.
//   node truth/run.cjs (TRUTH_ONLY="rust libs") first: it writes .cache/rust-libs-truth (main.rs + cases.json)
//   node rust/lib-ra-check.cjs [id prefix...]      PONDER_RA = rust-analyzer executable (default: VS Code's newest)
const cp = require('child_process'), fs = require('fs'), path = require('path'), url = require('url'), os = require('os');
const { CACHE } = require('../config.cjs');

function findRa() {
  if (process.env.PONDER_RA) return process.env.PONDER_RA;
  const ext = path.join(os.homedir(), '.vscode', 'extensions');
  const dirs = fs.existsSync(ext) ? fs.readdirSync(ext).filter((d) => d.startsWith('rust-lang.rust-analyzer-')).sort() : [];
  for (const d of dirs.reverse()) { const p = path.join(ext, d, 'server', process.platform === 'win32' ? 'rust-analyzer.exe' : 'rust-analyzer'); if (fs.existsSync(p)) return p; }
  throw new Error('rust-analyzer not found: set PONDER_RA');
}

// vscode/src/outline.ts cleanName + rustNames
function cleanName(raw) {
  let s = raw.trim();
  const impl = /^impl(?:<[^>]*>)?\s+(?:.+\s+for\s+)?([A-Za-z_][\w:]*)/.exec(s);
  if (impl) s = impl[1];
  else if (/^impl\b/.test(s)) return [];
  s = s.replace(/\(.*$/s, '').replace(/<[^>]*>/g, '').replace(/\s+:\s.*$/s, '').trim();
  if (!s) return [];
  return s.split(/::|:/).filter((p) => p.length > 0).map((p) => p.trim());
}
const rustNames = (names, word) => (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(word) ? names : names[names.length - 1] === word ? names : [...names, word]);

function packageSymbol(file, names) {
  let dir = path.dirname(file);
  while (!fs.existsSync(path.join(dir, 'Cargo.toml'))) { const up = path.dirname(dir); if (up === dir) return null; dir = up; }
  const toml = fs.readFileSync(path.join(dir, 'Cargo.toml'), 'utf8');
  let section = '', name = path.basename(dir);
  for (const line of toml.split(/\r?\n/)) { const t = line.trim(); if (t.startsWith('[')) section = t; else if (section === '[package]') { const m = /^name\s*=\s*["']([^"']+)["']/.exec(t); if (m) { name = m[1]; break; } } }
  const rel = path.relative(dir, file).split(path.sep).join('/').replace(/\.rs$/, '');
  const mods = (rel.startsWith('src/') ? rel.slice(4) : rel).split('/');
  if (['lib', 'main', 'mod'].includes(mods[mods.length - 1])) mods.pop();
  return { pkg: name, symbol: `rust:${[name.replace(/[^A-Za-z0-9_]/g, '_'), ...mods, ...names].join('::')}` };
}

// Column of the animated call on its line: `probe` text (its last name is the word), `Container::fn`, `.fn(`, `::fn(`
function column(text, c) {
  // only inside the example: the line starts with the generated out.push(("id", (|| -> String { ...
  const body = text.indexOf('-> String { '); const base = body < 0 ? 0 : body + 12; const all = text; text = all.slice(base);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tries = [];
  if (c.probe) tries.push(new RegExp(esc(c.probe)));
  const at = Array.isArray(c.at[0]) ? c.at[0] : c.at;
  const owner = (at[1] || '').split('::').pop();
  if (owner) tries.push(new RegExp(`\\b${esc(owner)}(?:::<[^>]*>)?::${esc(c.fn)}\\b`));
  tries.push(new RegExp(`[.:]${esc(c.fn)}\\s*(?:\\(|::<)`), new RegExp(`\\b${esc(c.fn)}\\s*(?:\\(|::<|!)`), new RegExp(`\\b${esc(c.fn)}\\b`));
  for (const re of tries) {
    const m = re.exec(text); if (!m) continue;
    const k = m[0].lastIndexOf(c.probe ? c.probe.split(/::|\./).pop().replace(/[(!].*$/, '') : c.fn);
    return base + m.index + (k >= 0 ? k : 0) + 1;
  }
  return -1;
}

(async () => {
  const only = process.argv.slice(2);
  const dir = path.join(CACHE, 'rust-libs-truth');
  const cases = JSON.parse(fs.readFileSync(path.join(dir, 'cases.json'), 'utf8')).filter((c) => !only.length || only.some((o) => c.id.startsWith(o)));
  const symbols = require('../src/rust-lib-symbols.json');
  const main = path.join(dir, 'src', 'main.rs'); const text = fs.readFileSync(main, 'utf8'); const lines = text.split('\n');
  const toUri = (p) => url.pathToFileURL(p).href;
  const proc = cp.spawn(findRa(), [], { stdio: ['pipe', 'pipe', 'ignore'] });
  let buf = Buffer.alloc(0), id = 0; const waiting = new Map();
  proc.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) return;
      const len = Number(/Content-Length: (\d+)/i.exec(buf.slice(0, h).toString())[1]);
      if (buf.length < h + 4 + len) return;
      const msg = JSON.parse(buf.slice(h + 4, h + 4 + len).toString()); buf = buf.slice(h + 4 + len);
      if (msg.id !== undefined && waiting.has(msg.id) && msg.method === undefined) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
      else if (msg.method && msg.id !== undefined) send({ jsonrpc: '2.0', id: msg.id, result: null });
    }
  });
  proc.on('exit', (code) => { if (waiting.size) { console.error(`rust-analyzer exited (${code})`); process.exit(2); } });
  const send = (o) => { const s = JSON.stringify(o); proc.stdin.write(`Content-Length: ${Buffer.byteLength(s)}\r\n\r\n${s}`); };
  const req = (method, params) => new Promise((res) => { const n = ++id; waiting.set(n, res); send({ jsonrpc: '2.0', id: n, method, params }); });
  const note = (method, params) => send({ jsonrpc: '2.0', method, params });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const contains = (r, p) => (r.start.line < p.line || (r.start.line === p.line && r.start.character <= p.character)) && (r.end.line > p.line || (r.end.line === p.line && r.end.character >= p.character));

  await req('initialize', { processId: process.pid, rootUri: toUri(dir), capabilities: { textDocument: { documentSymbol: { hierarchicalDocumentSymbolSupport: true }, definition: { linkSupport: true } } }, workspaceFolders: [{ uri: toUri(dir), name: 'truth' }] });
  note('initialized', {});
  note('textDocument/didOpen', { textDocument: { uri: toUri(main), languageId: 'rust', version: 1, text } });
  const opened = new Set(); const outlines = new Map();
  let ok = 0; const bad = [];
  for (const c of cases) {
    const line = c.line - 1; const col = column(lines[line] || '', c);
    if (col < 0) { bad.push(`${c.id}: call to ${c.fn} not found on its line`); continue; }
    let defs = null;
    for (let t = 0; t < (ok ? 5 : 150) && !(defs && defs.length); t++) {
      defs = (await req('textDocument/definition', { textDocument: { uri: toUri(main) }, position: { line, character: col } })).result;
      if (!(defs && defs.length)) await sleep(2000);
    }
    if (!defs || !defs.length) { bad.push(`${c.id}: rust-analyzer gives no definition for ${c.fn} (col ${col})`); continue; }
    let got = null;
    for (const d of defs) {
      const target = d.targetUri || d.uri, range = d.targetSelectionRange || d.range;
      const file = url.fileURLToPath(target);
      const word = fs.readFileSync(file, 'utf8').split('\n')[range.start.line].slice(range.start.character, range.end.character);
      if (word.endsWith('!')) continue; // the macro call site of a generated method
      if (!opened.has(target)) { opened.add(target); note('textDocument/didOpen', { textDocument: { uri: target, languageId: 'rust', version: 1, text: fs.readFileSync(file, 'utf8') } }); }
      if (!outlines.has(target)) outlines.set(target, (await req('textDocument/documentSymbol', { textDocument: { uri: target } })).result || []);
      const chain = []; let level = outlines.get(target);
      for (;;) { const s = level.find((x) => contains(x.range, range.start)); if (!s) break; chain.push(s.name); level = s.children || []; }
      const names = rustNames(chain.flatMap(cleanName), word);
      got = { ...packageSymbol(file, names), at: `${file.replace(/.*index\.crates\.io-[0-9a-f]+[\\/]/, '')}:${range.start.line + 1}` };
      break;
    }
    if (!got) { bad.push(`${c.id}: only a macro call site`); continue; }
    const s = symbols[c.id]; const pkg = (Array.isArray(c.at[0]) ? c.at[0] : c.at)[0];
    const listed = s && (s.symbol === got.symbol || s.aliases.includes(got.symbol));
    if (listed && got.pkg.replace(/-/g, '_') === pkg.replace(/-/g, '_')) ok++;
    else bad.push(`${c.id}: rust-analyzer → ${got.symbol} (package ${got.pkg}, ${got.at}); animation has ${s ? s.symbol : 'no symbol'}`);
  }
  proc.kill();
  for (const b of bad) console.log('  MISMATCH ' + b);
  console.log(`${ok} of ${cases.length} calls land on a symbol their animation lists (rust-analyzer)`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
