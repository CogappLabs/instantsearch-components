# Changelog

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
