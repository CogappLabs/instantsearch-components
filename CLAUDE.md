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
npm run test:e2e                          # Playwright: cdn/ on React 18, React 19 and InstantSearch.js pages
npm run build                             # scripts/build.mjs: tsc to dist/, plus each CSS file and its d.ts
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
  `dist/` with an empty `.d.ts`, from `scripts/build.mjs`: `tsc` copies
  neither. That script is Node rather than shell because it runs on the
  consumer's machine during a git install.
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

## Three ways in

Each component is a view with no search state (`DateHistogramView`) and
adapters that feed it:

- `DateHistogram`: React InstantSearch hooks. The npm entry.
- `dateHistogram` (`widget.tsx`): an InstantSearch.js widget, one widget
  object over the range and refinement-list connectors, rendering the view
  with `react-dom/client`.
- `cdn/`: script-tag builds from `scripts/build.mjs` (esbuild), with entries
  `src/cdn-*.ts`. `instantsearch-js.min.js` aliases React to Preact and reads
  the connectors from `window.instantsearch`; `react-instantsearch.min.js`
  reads `window.React` and `window.ReactInstantSearch`. Unlike `dist/`,
  `cdn/` is committed, because jsDelivr serves only files in the repo. Run
  `npm run build` before committing a component change: CI fails if `cdn/`
  differs from a fresh build. Biome skips `cdn/`, as its pre-commit `--write`
  would reformat the minified files.

`e2e/` loads each `cdn/` build on a page of the kind it is for, from
`e2e/pages/`, with the libraries from their real CDNs and a fake search
client. Playwright serves the local files by route, so run `npm run build`
first. Run `npx playwright install chromium` once.

macOS filesystems ignore case: `dateHistogram.tsx` and `DateHistogram.tsx`
are one file, hence `widget.tsx`.

## Releases

One version for every component. Bump `version`, add a `CHANGELOG.md` entry
naming the component changed, tag `vX.Y.Z` and push the tag. Before 1.0 a
minor version may change props. The docs deploy to GitHub Pages from `main`
(`.github/workflows/docs.yml`). The workflow sets `DOCS_BASE` to
`/instantsearch-components`; anywhere else the site runs at `/`.

## Docs site

- Light only, and Starlight has no option for that: `ThemeProvider` and
  `ThemeSelect` are overridden in `docs/src/components/`.
- Cogapp brand from the Collection Flow dashboard: tokens and faces in
  `docs/src/styles/brand.css`, fonts in `docs/src/assets/fonts/`. Cogapp holds
  the font licence for its sites. Keep the tokens in step with the dashboard
  by hand.
- Demos are the real component in MDX: `docs/src/components/Demo.tsx` imports
  it from `../src` with a fake search client holding made-up years. Vite
  dedupes React there, as `../src` would otherwise resolve the library's own
  copy. Props with functions go through a `preset`, since MDX cannot pass a
  function to an island.
