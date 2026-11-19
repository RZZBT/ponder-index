// Finds where a Rust function is declared in a crate's sources and builds the symbols the IDEs produce for it.
//   VS Code: rust-analyzer outline names (`impl Display for IntStack` -> IntStack), see vscode/src/outline.ts
//   IntelliJ/RustRover: impl block text from the item start (doc comments and attributes included), see
//   PackageLayout.implType. Both then build `rust:<crate>::<modules>::<names>` and `sym:<file>:<names>`.
const fs = require('fs'), path = require('path');

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['target', '.git'].includes(e.name)) walk(p, base, out); }
    else if (e.name.endsWith('.rs')) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

// Removes comments and string/char literals (same length, so positions stay valid).
function blank(code) {
  const out = code.split('');
  const n = code.length; let i = 0;
  const wipe = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; };
  while (i < n) {
    const c = code[i], d = code[i + 1];
    if (c === '/' && d === '/') { const e = code.indexOf('\n', i); const end = e < 0 ? n : e; wipe(i, end); i = end; continue; }
    if (c === '/' && d === '*') { let depth = 1, k = i + 2; while (k < n && depth) { if (code[k] === '/' && code[k + 1] === '*') { depth++; k += 2; } else if (code[k] === '*' && code[k + 1] === '/') { depth--; k += 2; } else k++; } wipe(i, k); i = k; continue; }
    const prevIdent = i > 0 && /[\w]/.test(code[i - 1]);
    if (!prevIdent && (c === 'r' || (c === 'b' && d === 'r')) ) {
      const s = c === 'b' ? i + 2 : i + 1; let h = 0; while (code[s + h] === '#') h++;
      if (code[s + h] === '"') { const close = '"' + '#'.repeat(h); const e = code.indexOf(close, s + h + 1); const end = e < 0 ? n : e + close.length; wipe(i, end); i = end; continue; }
    }
    if (c === '"' || (c === 'b' && d === '"' && !prevIdent)) {
      let k = c === 'b' ? i + 2 : i + 1; while (k < n && code[k] !== '"') k += code[k] === '\\' ? 2 : 1; wipe(i, k + 1); i = k + 1; continue;
    }
    if (c === '\'') {
      const m = /^'(?:\\(?:u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|.)|[^\\'\n])'/.exec(code.slice(i, i + 14));
      if (m) { wipe(i, i + m[0].length); i += m[0].length; continue; }
    }
    i++;
  }
  return out.join('');
}

function implLabelType(header) {      // header: text from `impl` up to `{` (comments removed)
  let s = header.replace(/\s+/g, ' ').trim().replace(/^impl/, '').trim();
  if (s.startsWith('<')) { let depth = 0, k = 0; for (; k < s.length; k++) { if (s[k] === '<') depth++; else if (s[k] === '>' && s[k - 1] !== '-') { depth--; if (!depth) break; } } s = s.slice(k + 1).trim(); }
  s = s.replace(/\swhere\s.*$/, '').trim();
  // rust-analyzer label: `impl Trait for Type` or `impl Type`; outline.ts then takes the type
  const label = 'impl ' + s;
  const m = /^impl(?:<[^>]*>)?\s+(?:.+\s+for\s+)?([A-Za-z_][\w:]*)/.exec(label);
  if (!m) return null;
  return m[1].split(/::|:/).filter(Boolean);
}
const IJ_IMPL = /^impl(?:<[^>]*>)?\s+(?:[^{]+?\s+for\s+)?([A-Za-z_]\w*)/;

function scanFile(root, rel) {
  const raw = fs.readFileSync(path.join(root, rel), 'utf8');
  const code = blank(raw);
  const stack = [];          // {kind, name, vs: [names], ij: [names] | null}
  const found = [];          // {fn, file, vs:[names], ij:[names]}
  let pending = null;        // container header waiting for its `{`
  const re = /\b(trait|impl|mod|fn|macro_rules!)(?![\w])\s*|[{};]/g;
  let m;
  while ((m = re.exec(code))) {
    const t = m[0];
    if (t === '{') {
      // `cfg_rt! { ... }` (a macro call with braces): rust-analyzer's outline does not show what is inside it
      if (pending) { stack.push(pending); pending = null; } else stack.push(/[A-Za-z_]\w*\s*!\s*$/.test(code.slice(Math.max(0, m.index - 60), m.index)) ? { kind: 'mcall', vs: [], ij: [] } : { kind: 'block' });
      continue;
    }
    if (t === '}') { stack.pop(); pending = null; continue; }
    if (t === ';') { pending = null; continue; }
    const kw = m[1];
    const rest = code.slice(re.lastIndex);
    if (kw === 'fn') {
      const nm = /^([A-Za-z_]\w*)/.exec(rest); if (!nm) continue;
      const inMacro = stack.findIndex((s) => s.kind === 'macro');
      const named = stack.filter((s) => s.kind !== 'block' && s.kind !== 'mcall');
      // inside a macro call VS Code sees only the containers outside the call (vsOuter); src/rust_libs uses it
      const mc = stack.findIndex((s) => s.kind === 'mcall');
      const vsOuter = mc >= 0 ? [...stack.slice(0, mc).filter((s) => s.kind !== 'block').flatMap((s) => s.vs), nm[1]] : null;
      let vs, ij;
      if (inMacro >= 0) {
        // rust-analyzer's outline shows the containers down to the macro (`mod impls > ord_impl`), then Ponder adds the method
        const upTo = stack.slice(0, inMacro + 1).filter((s) => s.kind !== 'block');
        vs = upTo.flatMap((s) => s.vs); ij = upTo.flatMap((s) => s.ij);
      }
      else {
        if (named.some((s) => s.kind === 'fn')) continue;          // nested helper fn
        vs = named.flatMap((s) => s.vs); ij = named.flatMap((s) => s.ij);
      }
      found.push({ fn: nm[1], file: rel, vs: [...vs, nm[1]], ij: [...ij, nm[1]], macro: inMacro >= 0, vsOuter, line: raw.slice(0, m.index).split('\n').length });
      pending = { kind: 'fn', vs: [], ij: [] };
      continue;
    }
    if (kw === 'trait' || kw === 'mod' || kw === 'macro_rules!') {
      const nm = /^([A-Za-z_]\w*)/.exec(rest); if (!nm) continue;
      const kind = kw === 'macro_rules!' ? 'macro' : kw;
      pending = { kind, name: nm[1], vs: [nm[1]], ij: [nm[1]] };
      continue;
    }
    if (kw === 'impl') {
      if (/\w/.test(code[m.index - 1] || '')) continue;
      const brace = code.indexOf('{', m.index);
      // a `;` inside brackets belongs to an array type (`From<[(K, V); N]>`), not to the end of the item
      let semi = -1;
      for (let k = m.index, depth = 0; k < (brace < 0 ? code.length : brace); k++) {
        const ch = code[k];
        if (ch === '[' || ch === '(') depth++; else if (ch === ']' || ch === ')') depth--; else if (ch === ';' && depth <= 0) { semi = k; break; }
      }
      if (brace < 0 || (semi >= 0 && semi < brace)) continue;
      const header = code.slice(m.index, brace);
      if (/^impl\s*\(/.test(header) || /->\s*impl\b/.test(code.slice(Math.max(0, m.index - 4), m.index + 4))) continue; // `-> impl Trait`
      const before = code.slice(Math.max(0, m.index - 40), m.index);
      if (/(->|:|<|,|\(|&|dyn|=)\s*$/.test(before)) continue;   // impl Trait in type position
      const vs = implLabelType(header) || [];
      // IntelliJ: item text starts at the first doc comment / attribute above the impl (or at `unsafe`)
      let start = m.index;
      const lines = raw.slice(0, m.index).split('\n'); const cur = lines.pop();
      let itemText;
      if (cur.trim() !== '') itemText = cur.trim() + raw.slice(m.index);        // e.g. `unsafe impl` or `pub(crate) impl`
      else {
        let k = lines.length - 1, top = null;
        while (k >= 0) { const l = lines[k].trim(); if (l.startsWith('///') || l.startsWith('#[') || l.startsWith('/**') || l.startsWith('*') || (l.endsWith(']') && top !== null && lines[k].trim() !== '')) { top = k; k--; } else break; }
        itemText = top === null ? raw.slice(m.index) : lines.slice(top).join('\n').trim() + '\n' + raw.slice(m.index);
      }
      const ijm = IJ_IMPL.exec(itemText.slice(0, 200).trimStart());
      pending = { kind: 'impl', vs, ij: ijm ? [ijm[1]] : [] };
      // skip the rest of the header: a `;` in `[(K, V); N]` or `fn` in a where clause must not end or confuse it
      re.lastIndex = brace;
      void start;
    }
  }
  return found;
}

function crateName(root) {
  const t = fs.readFileSync(path.join(root, 'Cargo.toml'), 'utf8');
  let section = ''; for (const line of t.split(/\r?\n/)) { const s = line.trim(); if (s.startsWith('[')) section = s; else if (section === '[package]') { const m = /^name\s*=\s*["']([^"']+)["']/.exec(s); if (m) return m[1]; } }
  return path.basename(root);
}

function symbolsFor(root, f) {
  const crate = crateName(root).replace(/[^A-Za-z0-9_]/g, '_');
  const noExt = f.file.slice(0, -3);
  const mods = (noExt.startsWith('src/') ? noExt.slice(4) : noExt).split('/');
  if (['lib', 'main', 'mod'].includes(mods[mods.length - 1])) mods.pop();
  const dedupe = (a) => a.filter((s, i) => i === 0 || a[i - 1] !== s);
  const vs = f.vs, ij = dedupe(f.ij);
  const r = (names) => `rust:${[crate, ...mods, ...names].join('::')}`, s = (names) => `sym:${f.file}:${names.join('.')}`;
  return { vs: [r(vs), s(vs)], ij: [r(ij), s(ij)] };
}

const cache = new Map();
function index(root) {
  if (!cache.has(root)) cache.set(root, walk(path.join(root, 'src'), root).map((rel) => rel).flatMap((rel) => scanFile(root, rel)));
  return cache.get(root);
}
// All declarations of `fn name` whose names end with [..., container, name] (container optional).
function find(root, name, container) {
  return index(root).filter((f) => f.fn === name && (!container || f.vs.includes(container) || f.ij.includes(container) || f.vs.length === 1)).map((f) => ({ ...f, sym: symbolsFor(root, f) }));
}
module.exports = { find, index, symbolsFor, crateName, scanFile, blank };
