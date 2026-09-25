# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Public repo of React InstantSearch components, installed by other projects from
a GitHub tag (`github:CogappLabs/instantsearch-components#vX.Y.Z`), not from
npm. The Collection Flow dashboard (`CogappLabs/collection-flow-dashboard`) is
the first consumer.

## Commands

```sh
npm test                                  # vitest, all tests
npx vitest run src/date-histogram/bins    # one file
npm run typecheck
npm run check                             # biome
npm run build                             # tsc to dist/, plus the CSS copy
cd docs && npm install && npm run build   # the Starlight site
```

Lefthook runs Biome and the typecheck on commit (`npx lefthook install` once:
npm 11 blocks its install script).

## How it fits together

- Library at the root, docs in `docs/` with their own `package.json`, so a git
  install of the library never pulls in Astro. `prepare` runs the build on
  that install, which is why `dist/` is not committed.
- One folder per component under `src/`, each with an `index.ts` exposed as its
  own subpath in `exports` (`./date-histogram`), plus the root `src/index.ts`
  re-exporting them. A new component needs both entries and a docs page in
  `docs/src/content/docs/components/`, which the sidebar picks up.
- A component's stylesheet is a separate export (`./date-histogram.css`) that
  the consumer imports: the component never imports its own CSS, so it works
  without a CSS-aware bundler. The `build` script copies each stylesheet into
  `dist/` by hand, as `tsc` does not.
- Components talk to search state only through `react-instantsearch` hooks, so
  they work over Algolia or Searchkit alike. Backend-specific setup (such as
  the range-field stats swap for Searchkit) belongs in the consumer, and is
  described in the component's docs page rather than shipped here.
- Nothing is Tailwind or brand-specific. Styling is plain CSS that reads
  `--<component>-*` custom properties with `currentColor` fallbacks, declared
  at the point of use rather than on the component root, so a consumer can set
  them on any ancestor.
- Labels and formatters are props with English defaults, for translation.
- Relative imports carry `.js` extensions, so the emitted ESM resolves in Node
  as well as in bundlers.
- Peer range is React 18+ and `react-instantsearch` 7+: avoid types newer than
  React 18's (`SubmitEvent` is missing there).

## Releases

One version for every component. Bump `version`, add a `CHANGELOG.md` entry
naming the component changed, tag `vX.Y.Z` and push the tag. Before 1.0 a
minor version may change props. The docs deploy to GitHub Pages from `main`
(`.github/workflows/docs.yml`), under the `/instantsearch-components` base.
