// Builds src/rust-symbols.json: for every Rust animation, the symbol the IDEs produce for the declaration a call
// lands on, plus aliases (the other IDE's form, the trait declaration, older file layouts, sym: paths).
//   node rust/symbols.cjs        (downloads the crate versions below into .cache/crates, reads their sources)
// The build reads only the JSON, so it needs no network. verify.cjs checks the result against real installs.
const fs = require('fs'), path = require('path');
const { crate } = require('./crates.cjs');
const { find, index, symbolsFor } = require('./locate.cjs');

// Versions whose layouts the aliases cover. The first one is the newest and decides the primary symbol.
const VERSIONS = {
  itertools: ['latest', '0.13', '0.10'], regex: ['latest', '1.9'], serde_json: ['latest', '1.0.100'],
  chrono: ['latest', '0.4.31', '0.4.23'], indexmap: ['latest', '2.0', '1.9'], strsim: ['latest', '0.10'],
  'num-integer': ['latest', '0.1.44'], heck: ['latest', '0.4'], textwrap: ['latest', '0.16.0'], semver: ['latest', '1.0.0'],
  base64: ['latest', '0.22', '0.21'], hex: ['latest', '0.4.0'], url: ['latest', '2.4', '2.0'],
  'unicode-segmentation': ['latest', '1.9'], petgraph: ['latest', '0.7', '0.6'],
};

// key: [crate, fn, containers (preferred first; '' = free function), file filter]
const T = {};
const add = (cr, keys, fn, containers, file) => keys.split(' ').forEach((k, i) => { T[`${cr}/${k}`] = [cr, fn ? fn[i] : k.replace(/-/g, '_'), containers, file]; });
add('itertools', 'interleave dedup chunks tuple_windows circular_tuple_windows tuples chunk_by unique unique_by dedup_with_count counts into_group_map cartesian_product multi_cartesian_product combinations combinations_with_replacement permutations powerset join intersperse merge kmerge zip_longest interleave_shortest minmax position_max positions k_smallest sorted sorted_by_key partition_map coalesce fold_while tree_reduce all_equal exactly_one', null, ['Itertools']);
add('regex', 'new is_match find find_iter captures captures_iter replace replace_all split splitn', null, ['Regex'], /string\.rs$|re_unicode\.rs$/);
add('regex', 'captures-name', ['name'], ['Captures'], /string\.rs$|re_unicode\.rs$/);
add('regex', 'escape', null, [''], /lib\.rs$/);
add('regex', 'regex-set-matches', ['matches'], ['RegexSet'], /regexset\/string\.rs$|re_set\.rs$/);
add('serde_json', 'to_string to_string_pretty', null, [''], /ser\.rs$/);
add('serde_json', 'from_str', null, [''], /^src\/de\.rs$/);
add('serde_json', 'to_value from_value', null, [''], /value\/mod\.rs$/);
add('serde_json', 'value-get value-pointer value-as-i64', ['get', 'pointer', 'as_i64'], ['Value'], /value\/mod\.rs$/);
add('chrono', 'from_ymd_opt parse_from_str format checked_add_days checked_sub_days checked_add_months signed_duration_since succ_opt iter_days and_hms_opt', null, ['NaiveDate'], /naive\/date/);
add('chrono', 'weekday ordinal iso_week', null, ['NaiveDate', 'Datelike'], /naive\/date|traits\.rs$|src\/lib\.rs$/);
add('chrono', 'time-from-hms-opt', ['from_hms_opt'], ['NaiveTime'], /naive\/time/);
add('indexmap', 'insert get_index get_index_of swap_remove shift_remove sort_keys', null, ['IndexMap'], /map\.rs$|map\/core|map\/mod\.rs$/);
add('indexmap', 'set-insert', ['insert'], ['IndexSet'], /set\.rs$|set\/mod\.rs$/);
add('strsim', 'levenshtein damerau_levenshtein hamming jaro_winkler normalized_levenshtein sorensen_dice', null, ['']);
add('num-integer', 'gcd lcm binomial', null, ['']);
add('num-integer', 'div_floor mod_floor div_rem', null, ['Integer']);
for (const [k, tr] of [['to_snake_case', 'ToSnakeCase'], ['to_kebab_case', 'ToKebabCase'], ['to_upper_camel_case', 'ToUpperCamelCase'], ['to_shouty_snake_case', 'ToShoutySnakeCase'], ['to_title_case', 'ToTitleCase']]) add('heck', k, null, ['str', tr]);
add('textwrap', 'wrap', null, [''], /wrap\.rs$|lib\.rs$/);
add('textwrap', 'fill indent dedent', null, ['']);
add('semver', 'version-parse', ['parse'], ['Version']);
add('semver', 'req-parse req-matches', ['parse', 'matches'], ['VersionReq']);
add('base64', 'encode decode', null, ['Engine']);
add('hex', 'encode decode', null, ['']);
add('url', 'parse join query_pairs path_segments', null, ['Url']);
add('unicode-segmentation', 'graphemes unicode_words split_word_bounds', null, ['str', 'UnicodeSegmentation']);
add('petgraph', 'dijkstra toposort is_cyclic_directed connected_components astar', null, ['']);
add('petgraph', 'bfs-next dfs-next', ['next', 'next'], ['Bfs', 'Dfs'].map((x) => x), null);
// Bfs/Dfs need one container each
T['petgraph/bfs-next'][2] = ['Bfs']; T['petgraph/dfs-next'][2] = ['Dfs'];

const matches = (f, container, file) => {
  if (file && !file.test(f.file)) return false;
  if (f.macro || /\b(tests?|benches|examples)\b/.test(f.file)) return false;
  const owner = f.vs.length >= 2 ? f.vs[f.vs.length - 2] : '';
  return container === '' ? f.vs.length === 1 : owner === container;
};

(async () => {
  const roots = {};
  for (const [cr, vs] of Object.entries(VERSIONS)) roots[cr] = await Promise.all(vs.map((v) => crate(cr, v)));
  const out = {}; let bad = 0;
  for (const [key, [cr, fn, containers, file]] of Object.entries(T)) {
    const syms = []; const report = [];
    for (const c of roots[cr]) {
      for (const cont of containers) {
        const hits = find(c.path, fn).filter((f) => matches(f, cont, file));
        for (const h of hits) { syms.push(h.sym.vs[0], h.sym.ij[0], h.sym.vs[1], h.sym.ij[1]); }
        report.push(`${c.version}:${cont || 'free'}=${hits.length}`);
      }
    }
    const uniq = [...new Set(syms)];
    // rust: symbols first (newest layout first), then sym: paths
    const ordered = [...uniq.filter((s) => s.startsWith('rust:')), ...uniq.filter((s) => s.startsWith('sym:'))];
    if (!ordered.length) { bad++; console.log('NOT FOUND', key, report.join(' ')); continue; }
    out[key] = { symbol: ordered[0], aliases: ordered.slice(1, 17) };
    if (process.env.VERBOSE || ordered.length > 17) console.log(key, report.join(' '), ordered.length > 17 ? `(${ordered.length - 17} aliases dropped)` : '', '\n   ', ordered.join('\n    '));
  }
  // the same alias must not point at two animations of one crate
  const seen = new Map();
  for (const [k, v] of Object.entries(out)) for (const s of [v.symbol, ...v.aliases]) {
    const id = k.split('/')[0] + ' ' + s;
    if (seen.has(id)) { bad++; console.log(`SHARED ${s}: ${seen.get(id)} and ${k}`); } else seen.set(id, k);
  }
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'rust-symbols.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`${Object.keys(out).length} animations, ${bad} problem(s)`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
