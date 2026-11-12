# Ponder index tools

`../docs/` is the published folder (GitHub Pages serves it from the `/docs` folder). It is **generated**; edit the generator, not the JSON.

```
npm run build     generate, check the layout, check NumPy examples against real NumPy, run `ponder check-index`
npm run verify    `ponder check` every document against the real, downloaded package
npm run truth     run the other libraries' examples in the real libraries
npm run all       all three, in that order (use this before publishing)
```

## Setup

- Node 18+ and Python 3 on PATH.
- `PONDER_PYTHON`: a Python that has NumPy installed (default: `python`). The build compares every NumPy example with it.
- `PONDER_CLI`: the Ponder command line tool, `dist/ponder.cjs` of the Ponder project (see `config.cjs` for the default).
- `verify` and `truth` download packages into `.cache/` (git-ignored): lodash, date-fns 2 and 4, NumPy 2.x and the 1.26 wheel,
  more-itertools, itertools, samber/lo, illuminate/collections, Guava (latest and 20.0), commons-lang3.
  Nothing downloaded is executed: npm runs with `--ignore-scripts`, pip takes wheels only, archives are only unpacked.

## Layout

```
build.cjs            entry point: generate -> layout check -> write -> ponder check-index
verify.cjs           ponder check against installed packages (version-aware)
truth/run.cjs        examples of lodash, date-fns, more-itertools, itertools run in the real libraries
truth/rust/          the small cargo project behind the itertools check
config.cjs           the only place with machine paths / environment variables
src/lib.cjs, lib2.cjs      animation building blocks (actors, slides, step/grid templates)
src/packages.cjs     the 8 small packages + the layout validator (stage bounds, overlaps, slide counts, aliases)
src/numpy.cjs        NumPy symbols (per version generation) and the truth check; specs live in batch2.cjs, batch3.cjs
src/write.cjs        compact JSON, splits every version range into documents under the format limits, index.html
src/defs.py          finds the file that defines a NumPy function
analysis/            coverage helpers (which NumPy functions exist / are animated)
```

## Rules the generator keeps

- **Limits:** a file is at most 2 MiB; a document at most 256 KiB and 64 animations. `write.cjs` splits a version range
  into several documents with the same `versions` value (60 animations / 200 KiB each, original order), so IDEs, which
  merge every matching document, see the same animations.
- **Symbols:** the primary symbol is built from the file that declares the function. `sym:` paths are relative to the
  installed package's root folder (`_core/fromnumeric.py:clip`, not `numpy/_core/...`), with the `.pyi` stub as a second
  alias because editors often jump to it. Documents are version-pure: the NumPy 1.x document only has 1.x paths.
- **No unreachable aliases:** public re-export paths (`py:numpy.clip`, `py:more_itertools.chunked`) are never produced by
  any IDE's candidate algorithm and fail `ponder check`, so they are not written.
- **Truth:** every example result an animation shows is run in the real library. Java, Go and PHP examples
  (Guava, commons-lang3, samber/lo, illuminate/collections) are NOT run by these tools: no runtime is installed here.
