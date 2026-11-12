# Ponder Index

The community index of [Ponder](https://github.com/RZZBT/ponder) animations: short, step-by-step explanations of
library functions that the Ponder plugin shows right in the editor (VS Code and JetBrains IDEs).

When a library ships no animation of its own, Ponder can look here, after asking the user once. Only the package name
is requested, for example `v1/pypi/numpy.json`; never any code.

**Index address:** `https://rzzbt.github.io/ponder-index/`

## What is in it

| Ecosystem | Packages |
|---|---|
| PyPI | numpy (NumPy 1.20+ and 2.x), more-itertools |
| npm | lodash, date-fns |
| Maven | Guava, Apache Commons Lang 3 |
| crates | itertools, regex, serde_json, chrono, indexmap, strsim, num-integer, heck, textwrap, semver, base64, hex, url, unicode-segmentation, petgraph |
| std (Ponder 0.3) | Rust standard library: Iterator, Vec, slices, str, String, Option, Result, HashMap/HashSet, BTreeMap, VecDeque, BinaryHeap, Rc, RefCell, Cell, Box, mem, char, f64 (253 functions in `v1/std/rust/`) |
| Go | github.com/samber/lo |
| Packagist | illuminate/collections |

Every example value shown in an animation is computed by running the real library (see `tools/`).

## Layout

```
docs/                  the published index (GitHub Pages serves this folder)
  .nojekyll            publish files as they are
  index.html           list of packages and animations
  v1/<ecosystem>/<package>.json
tools/                 the generator and its checks (see tools/README.md)
```

`docs/` is **generated**. Change the generator in `tools/`, then rebuild; do not edit the JSON by hand.

```
cd tools
npm run all        # generate, validate with `ponder check-index`, check symbols, run every example for real
```

The file format is described in Ponder's `docs/online-index.md`.

## Publishing

GitHub repository settings: **Pages → Build and deployment → Deploy from a branch → `main` / `/docs`**.
After a push, GitHub republishes within about a minute; Ponder users get changes within a day.

## Contributing

Library authors: the best home for an animation is your own library. Ship a `ponder.json` with it and Ponder will
prefer it over this index. Corrections and new animations here are welcome as pull requests; please run
`npm run all` in `tools/` first.

## License

- Animations (`docs/`): [CC BY 4.0](LICENSE-ANIMATIONS.md). Library authors may copy them into their own
  `ponder.json`.
- Tools (`tools/`): [MIT](LICENSE).
