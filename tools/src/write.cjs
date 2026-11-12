// Writes the generated index: compact JSON, every version range split into documents that stay under the
// format limits, plus .nojekyll and index.html.
const fs = require('fs'), path = require('path');

// Format limits (engine/src/parser/limits.ts, sources/index-protocol.ts): 64 animations and 256 KiB per document,
// 2 MiB per file, 32 documents per file. Stay a little below them.
const MAX_ANIMATIONS = 60;
const MAX_DOC_BYTES = 200 * 1024;

/**
 * One document in, one or more out. All parts keep the same `versions` value and the original animation order,
 * so IDEs (which merge every matching document, in file order) see exactly what the unsplit document held.
 */
function splitDocument(d) {
  const entries = Object.entries(d.ponder.animations);
  const bytes = Buffer.byteLength(JSON.stringify(d.ponder));
  const parts = Math.max(1, Math.ceil(entries.length / MAX_ANIMATIONS), Math.ceil(bytes / MAX_DOC_BYTES));
  if (parts === 1) return [d];
  const per = Math.ceil(entries.length / parts);
  const docs = [];
  for (let i = 0; i < entries.length; i += per) {
    docs.push({
      ...(d.versions ? { versions: d.versions } : {}),
      ponder: { ...d.ponder, animations: Object.fromEntries(entries.slice(i, i + per)) },
    });
  }
  for (const part of docs) {
    const n = Buffer.byteLength(JSON.stringify(part.ponder));
    if (n > 256 * 1024) throw new Error(`a split document is still ${n} bytes (versions ${d.versions}); lower MAX_DOC_BYTES`);
  }
  return docs;
}

const esc = (s) => s.split('&').join('&amp;').split('<').join('&lt;');

function writeIndex(root, out) {
  for (const [file, doc] of Object.entries(out)) {
    const split = { ...doc, documents: doc.documents.flatMap(splitDocument) };
    if (split.documents.length > 32) throw new Error(`${file}: ${split.documents.length} documents, the limit is 32`);
    const p = path.join(root, file);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(split) + '\n');
    const size = fs.statSync(p).size;
    console.log(`  ${file}: ${doc.documents.length} range(s) -> ${split.documents.length} document(s), ${(size / 1024).toFixed(0)} KiB`);
  }
  fs.writeFileSync(path.join(root, '.nojekyll'), '');
  let html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ponder index</title></head><body>\n<h1>Ponder index</h1>\n<p>Animation files for the Ponder IDE plugin. Each package has one JSON file under <code>v1/</code>.</p>\n';
  for (const [file, doc] of Object.entries(out)) {
    const names = new Set();
    for (const d of doc.documents) for (const a of Object.values(d.ponder.animations)) names.add(a.title.replace(/^How /, '').replace(/\(\)? works$| works$/, '').trim());
    html += `<h2>${esc(doc.name)} <small>(${doc.ecosystem})</small></h2>\n<p><a href="${file}">${esc(file)}</a></p>\n<ul>${[...names].map((n) => `<li>${esc(n)}</li>`).join('')}</ul>\n`;
  }
  fs.writeFileSync(path.join(root, 'index.html'), html + '</body></html>\n');
}

module.exports = { splitDocument, writeIndex };
