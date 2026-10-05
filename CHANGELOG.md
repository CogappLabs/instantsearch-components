# Changelog

## v0.8.0

- `ReadableRefinements` (React) and `readableRefinements` (a `transformItems`
  for InstantSearch.js's `currentRefinements`): InstantSearch's own chips,
  with headings per attribute, a range's two bounds as one chip cleared in one
  search, flags read as "Yes", and paths named by their leaf. In both
  script-tag builds.

## v0.7.0

- `HierarchyList`: `classNames` takes classes for the search box's form and
  input and for "Show more", such as InstantSearch's satellite ones. The
  component's own look for those is under `:where()`, so they win. The search
  input now sits in a form.

## v0.6.0

- `HierarchyList` (React) and `hierarchyList` (InstantSearch.js): a
  hierarchical facet over cumulative paths as nested checkboxes, any number
  ticked at once, with a name search and "Show more" per branch. In both
  script-tag builds, with `hierarchy-list.css` in the shared stylesheet, and
  the path helpers (`withToggled`, `toggledIn`, `leafOf`, `parentOf`)
  exported beside it.

## v0.5.1

- `FacetToggle`: once ticked it showed 0, reading the empty entry
  InstantSearch lists for a refined value. The `1`/`0` bucket is now read
  first.

## v0.5.0

- `FacetToggle` (React) and `facetToggle` (InstantSearch.js): a boolean field
  as one checkbox with its count, read from Elasticsearch's `1` bucket where
  InstantSearch's own toggle finds none. In both script-tag builds, with
  `facet-toggle.css` in the shared stylesheet.

## v0.4.2

- `DateHistogram`: the handles reset padding, border and the other box
  properties a site's own `input` rules can set. Those shortened the track,
  so the handles stopped short of the ends of the bars.

## v0.4.1

- `cdn/instantsearch-js.min.js` finds InstantSearch.js when a widget is
  created rather than when it loads, so it works before or after
  `instantsearch.js` on the page.

## v0.4.0

- `dateHistogram`, the component as an InstantSearch.js widget, and a
  script-tag build of it (`cdn/instantsearch-js.min.js`) that needs no React.
- The React script-tag build is now `cdn/react-instantsearch.min.js`; v0.3.0's
  `cdn/instantsearch-components.min.js` stays on jsDelivr at that tag.
- `DateHistogramView`: the component without search state, which both
  versions render.

## v0.3.0

- A script-tag build in `cdn/`, for pages loading React 18 and React
  InstantSearch from a CDN. It adds `window.DateHistogram` and
  `window.CogappInstantSearch`.

## v0.2.1

- `DateHistogram`: the tick row no longer covers the lower half of each
  handle, which left the dots hard to grab.

## v0.2.0

`DateHistogram`. Breaking, for CSS or props written against v0.1.0:

- State is marked with `data-selected` and `data-tail` in place of the
  `is-selected` and `is-tail` classes.
- `spans` is gone: pass `showCount={false}` over a range field.
- `labels.records` receives the count as a second argument, for plurals.
- The year boxes are text inputs rather than `type="number"`, so iOS offers a
  minus sign; the year-box background defaults to transparent.

Added: `scale` ("auto" or "linear"), `showInputs`, `showTicks`, `showCount`,
`className` and `labels.group`; the control is a named `fieldset`; the
`DateHistogramLabels` type; `--date-histogram-thumb-border` and
`--date-histogram-focus`; tick spacing from the component's width; a 24px
grab area on each handle; forced-colours styles; types for the CSS import.

Fixed: BCE years were dropped from the counts; moving one handle was ignored
once other filters left the other bound outside the data; a typed year beyond
the data did nothing; the From handle sat under To at the right end; the long
tail now folds at 5% of records rather than 1%. The build no longer ships
tests or source maps, and runs under Windows.

## v0.1.0

- `DateHistogram`: first release, from the Collection Flow dashboard.
