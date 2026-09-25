---
title: Script tags
description: Use the components from a CDN, without npm or a build step.
---

Two script-tag builds, served by jsDelivr from each release tag. Pick the one
matching what the page already loads:

| The page loads | Script |
| --- | --- |
| InstantSearch.js (`instantsearch.js`) | `cdn/instantsearch-js.min.js` |
| React and React InstantSearch | `cdn/react-instantsearch.min.js` |

CI loads each build on a page of its kind (React 18 as script tags, React 19
as ES modules, and InstantSearch.js) with the libraries from their CDNs, and
checks that it draws, filters on typed years and moves by keyboard.

Both use the same stylesheet, `cdn/instantsearch-components.css`. Pin every
URL to a tag such as `@v0.4.0`: jsDelivr caches a tag for good, so a pinned
page never changes underneath you.

## InstantSearch.js

Each component is a widget, added beside InstantSearch.js's own. It needs no
React: the build carries Preact, a 4KB stand-in, to draw it.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/satellite-min.css" />
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.4.0/cdn/instantsearch-components.css"
/>

<script src="https://cdn.jsdelivr.net/npm/searchkit@4"></script>
<script src="https://cdn.jsdelivr.net/npm/@searchkit/instantsearch-client@4"></script>
<script src="https://cdn.jsdelivr.net/npm/instantsearch.js@4"></script>
<script src="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.4.0/cdn/instantsearch-js.min.js"></script>

<div id="type"></div>
<div id="date"></div>

<script>
  const search = instantsearch({
    indexName: "collection",
    searchClient: SearchkitInstantsearchClient({ url: "/api/search" }),
  });

  search.addWidgets([
    instantsearch.widgets.refinementList({ container: "#type", attribute: "type" }),
    CogappInstantSearch.dateHistogram({
      container: "#date",
      attribute: "date_start",
      labels: { group: "Date" },
    }),
  ]);

  search.start();
</script>
```

`container` takes an element or a selector, and every other option is a
prop from the [component page](../../components/date-histogram/). The script
also sets a `dateHistogram` global, unless the page has one already.

## React

For a page loading React and React InstantSearch as script tags, the build
uses the page's `React` and `ReactInstantSearch` globals and adds
`DateHistogram` beside React InstantSearch's components. React 18 is the last
version published as a plain script (`umd/`); for React 19, see
[below](#react-19).

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.4.0/cdn/instantsearch-components.css"
/>

<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-instantsearch@7/dist/umd/ReactInstantSearch.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@searchkit/instantsearch-client@4"></script>
<script src="https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.4.0/cdn/react-instantsearch.min.js"></script>

<div id="search"></div>

<script>
  const h = React.createElement;
  const searchClient = SearchkitInstantsearchClient({ url: "/api/search" });

  ReactDOM.createRoot(document.getElementById("search")).render(
    h(
      ReactInstantSearch.InstantSearch,
      { searchClient, indexName: "collection" },
      h(DateHistogram, { attribute: "date_start", labels: { group: "Date" } }),
    ),
  );
</script>
```

The script sets `DateHistogram` unless the page has a global of that name,
and `CogappInstantSearch` in either build holds every component.

### React 19

React 19 loads from a CDN as ES modules only. Put React and React
InstantSearch on `window` before loading the script, which reads them as it
runs; `import()` loads it after them:

```html
<script type="module">
  import React from "https://esm.sh/react@19";
  import * as ReactDOMClient from "https://esm.sh/react-dom@19/client?deps=react@19";
  import * as ReactInstantSearch from "https://esm.sh/react-instantsearch@7?deps=react@19,react-dom@19";

  Object.assign(window, { React, ReactInstantSearch });
  await import(
    "https://cdn.jsdelivr.net/gh/CogappLabs/instantsearch-components@v0.4.0/cdn/react-instantsearch.min.js"
  );

  const h = React.createElement;
  ReactDOMClient.createRoot(document.getElementById("search")).render(
    h(
      ReactInstantSearch.InstantSearch,
      { searchClient, indexName: "collection" },
      h(DateHistogram, { attribute: "date_start" }),
    ),
  );
</script>
```

`?deps=` makes esm.sh build React InstantSearch against the same React the
page imports: two copies of React break its hooks.
