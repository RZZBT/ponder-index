// Shorthand for the Rust standard-library animations. An animation is
//   { id, fn, at: [crate, container, file pattern], title, description, build(), rs, expect }
// `rs` is a Rust expression (a closure body) returning the String that the result slide shows; truth/run.cjs runs
// every one of them with the installed Rust. The expected text is taken from the scene's `result`, so the
// animation and its truth check cannot drift apart.
const { pick, cells, lines } = require('../rust/scene.cjs');

const ids = (src, row = 'a') => [].concat(src ?? []).map((x) => (typeof x === 'number' ? row + x : x));

/**
 * Compact steps for pick(): [caption, src, action, eq, extra]
 *   src: item index (row a), id string ('b2'), or a list of them
 *   action: 'o2' / 'o0,1' reveal outputs, 'm1' move the first source into output slot 1, 'x' reject (red), null
 */
function step([cap, src, act, eq, extra]) {
  const s = { cap, src: ids(src), eq };
  if (typeof act === 'string' && act.startsWith('o')) s.out = act.slice(1).split(',').map(Number);
  else if (typeof act === 'string' && act.startsWith('m')) s.move = { [s.src[0]]: Number(act.slice(1)) };
  else if (act === 'x') s.srcColor = 'danger';
  else if (act && typeof act === 'object') Object.assign(s, act);
  return Object.assign(s, extra || {});
}

const P = (spec) => () => pick({ ...spec, steps: spec.steps.map(step) });
const C = (spec) => () => cells(spec);
const L = (spec) => () => lines(spec);
const nums = (a) => a.map(String);

/** Collects the animations of one module file. */
function group(defaults) {
  const list = [];
  const add = (id, fn, at, title, description, spec, rs, expect) => {
    const build = spec.kind === 'cells' ? C(spec) : spec.kind === 'lines' ? L(spec) : P(spec);
    list.push({ id, fn, at: at || defaults.at, title, description, build, rs, expect: expect ?? spec.result });
  };
  return { list, add };
}

module.exports = { P, C, L, step, nums, group };
