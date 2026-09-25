# instantsearch-components

React InstantSearch components from [Cogapp](https://www.cogapp.com), built
for collection search and kept here so more than one project can use them.

Docs: https://cogapplabs.github.io/instantsearch-components/

| Component | |
| --- | --- |
| `DateHistogram` | A year range picked under a histogram of the records' years, or typed. |

## Install

Not on npm. Install a tagged release from GitHub, which npm builds on install:

```sh
npm install github:CogappLabs/instantsearch-components#v0.1.0
```

```tsx
import { DateHistogram } from "@cogapplabs/instantsearch-components/date-histogram";
import "@cogapplabs/instantsearch-components/date-histogram.css";
```

Peer dependencies: `react` 18 or later and `react-instantsearch` 7 or later.

## Versions

One version covers every component, tagged `vX.Y.Z`. `CHANGELOG.md` says which
component each release touched. Pin a tag rather than `main`.

## Development

```sh
npm install
npm test
npm run build
```

The docs site is in `docs/`, an Astro Starlight project with its own
`package.json`, deployed to GitHub Pages from `main`.

Releasing: bump `version` in `package.json`, add a `CHANGELOG.md` entry, then
tag it `vX.Y.Z` and push the tag.
