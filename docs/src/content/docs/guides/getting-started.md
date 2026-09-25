---
title: Getting started
description: Install the package from a tagged GitHub release.
---

The package is not on npm. Install a tagged release straight from GitHub; npm
runs its build as part of the install.

```sh
npm install github:CogappLabs/instantsearch-components#v0.5.1
```

It needs `react` 18 or later and `react-instantsearch` 7 or later, which your
project already has if it uses React InstantSearch.

## Importing a component

Each component has its own import path and its own stylesheet, imported
separately so you choose whether to use it:

```tsx
import { DateHistogram } from "@cogapplabs/instantsearch-components/date-histogram";
import "@cogapplabs/instantsearch-components/date-histogram.css";
```

Components go anywhere inside your `<InstantSearch>` tree, like any other
widget.

## Versions

One version covers every component. Tags are `vX.Y.Z`, and the
[changelog](https://github.com/CogappLabs/instantsearch-components/blob/main/CHANGELOG.md)
says which component each release changed. Pin a tag rather than `main`.

Before 1.0, a minor version (0.2.0) may change a component's props.
