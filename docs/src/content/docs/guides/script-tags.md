---
title: Script tags
description: Use the components from a CDN, without npm or a build step.
---

For a page that loads React and React InstantSearch from a CDN, there is a
script-tag build. It uses the page's own `React` and `ReactInstantSearch`
globals, and adds each component as a global in the same way, so
`DateHistogram` sits beside React InstantSearch's `RefinementList`.

## Loading it

After React, ReactDOM and React InstantSearch, add the script and the
stylesheet, pinned to a release tag:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.3.0/cdn/instantsearch-components.css"
/>

<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-instantsearch@7/dist/umd/ReactInstantSearch.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@searchkit/instantsearch-client@4/dist/umd/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.3.0/cdn/instantsearch-components.min.js"></script>
```

React 18 is the version to load: React 19 publishes no script-tag build.

The script sets `window.DateHistogram`, unless the page already has a global
of that name, and `window.CogappInstantSearch`, which holds every component.

## Using it

Without JSX, create the element with `React.createElement`. Searchkit's
script-tag client is the `SearchkitInstantsearchClient` global, here pointed at
a server-side Searchkit route:

```html
<div id="search"></div>
<script>
  const h = React.createElement;
  const { InstantSearch } = ReactInstantSearch;

  const searchClient = SearchkitInstantsearchClient({ url: "/api/search" });

  ReactDOM.createRoot(document.getElementById("search")).render(
    h(
      InstantSearch,
      { searchClient, indexName: "collection" },
      h(DateHistogram, { attribute: "date_start", labels: { group: "Date" } }),
    ),
  );
</script>
```

Every prop on the [component page](../../components/date-histogram/) works the
same way here.

## Versions

Change `@v0.3.0` in both URLs to move to another release. jsDelivr caches a
tag for good, so a pinned page never changes underneath you.
