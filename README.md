# instantsearch-components

React InstantSearch components from [Cogapp](https://www.cogapp.com), built
for collection search and kept here so more than one project can use them.

**[Documentation and live demos](https://cogapplabs.github.io/instantsearch-components/)**

| Component | |
| --- | --- |
| [`DateHistogram`](https://cogapplabs.github.io/instantsearch-components/components/date-histogram/) | A year range picked under a histogram of the records' years, or typed. |

## Install

Not on npm. Install a tagged release from GitHub, which npm builds on install:

```sh
npm install github:CogappLabs/instantsearch-components#v0.3.0
```

```tsx
import { DateHistogram } from "@cogapplabs/instantsearch-components/date-histogram";
import "@cogapplabs/instantsearch-components/date-histogram.css";
```

Peer dependencies: `react` 18 or later and `react-instantsearch` 7 or later.
The package is ES modules only.

npm builds `dist/` when it installs from GitHub, so an install run with
`--ignore-scripts`, or by a package manager that blocks dependency build
scripts (pnpm 10 without an allow-list entry), gets no `dist/`.

## Without npm

A script-tag build for pages loading React 18 and React InstantSearch from a
CDN, served by jsDelivr from each tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.3.0/cdn/instantsearch-components.css" />
<script src="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.3.0/cdn/instantsearch-components.min.js"></script>
```

It adds `window.DateHistogram` and `window.CogappInstantSearch`. See
[Script tags](https://cogapplabs.github.io/instantsearch-components/guides/script-tags/).

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
