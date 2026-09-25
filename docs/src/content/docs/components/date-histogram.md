---
title: DateHistogram
description: A year range picked under a histogram of the records' years, or typed.
---

A range filter for a year field. The records' years are drawn as bars, the
range is picked with two handles under them or typed into From and To boxes,
and the bars outside the chosen range stay visible, so a reader can see where
to widen to.

```tsx
import { DateHistogram } from "@cogapplabs/instantsearch-components/date-histogram";
import "@cogapplabs/instantsearch-components/date-histogram.css";

<DateHistogram attribute="date_start" />
```

## What the attribute needs

- **A numeric facet.** The component registers both a range and a refinement
  list on the attribute: the range for the bounds and the filter, the list for
  the count of each year.
- **Every year counted.** It asks for `valueLimit` values (1000 by default).
  An index with more distinct years than that loses its rarest ones from the
  chart, so raise it.
- **Integer years.** Bins are whole years.

The bars keep their heights under a chosen range because InstantSearch asks for
a refined facet's values in a second query without that facet's own filter.

## Props

| Prop | Default | |
| --- | --- | --- |
| `attribute` | | The numeric attribute to refine. |
| `bins` | `40` | Bars drawn, at most. |
| `valueLimit` | `1000` | Distinct values asked for. |
| `formatYear` | `-500` as `500 BCE` | Tick labels and the handles' spoken values. |
| `formatCount` | `toLocaleString()` | The records total. |
| `labels` | English | `{ from, to, apply, records(count), before(year) }`, for translation. |
| `spans` | `false` | Set when the counts come from a range field. See below. |

## Long early tails

Collections often hold a few very early records: one at 5000 BCE stretches an
axis that is otherwise 1500 to today, and every bar crowds to the right. When
the earliest 1% of records stretch the axis by more than a quarter, they fold
into the first bar, which is drawn dashed and labelled "before 1400" (rounded
to a round year). The remaining bars are even steps, labelled with round years.

## Theming

The stylesheet reads these custom properties, each falling back to a shade of
`currentColor`. Set them on `.date-histogram` or any ancestor:

| Property | |
| --- | --- |
| `--date-histogram-bar` | Bars outside the range, and the track. |
| `--date-histogram-bar-selected` | Bars inside the range. |
| `--date-histogram-thumb` | The handles. |
| `--date-histogram-thumb-size` | Handle diameter, `1rem` by default. |
| `--date-histogram-muted` | Labels, ticks and the records total. |
| `--date-histogram-field-border` | Year box and button borders. |
| `--date-histogram-field-background` | Year box and button fill. |

```css
.date-histogram {
  --date-histogram-bar-selected: #282828;
  --date-histogram-muted: #696969;
}
```

## Accessibility

The handles are native range inputs, named From and To, and announce the year
they sit on. The bars and tick labels are hidden from assistive technology,
since they repeat what the handles and the year boxes say.

## Range fields

A record dated 1840 to 1860 is best matched by any range overlapping those
years, not by its start year alone. In Elasticsearch that is an
`integer_range` field. The component works with one if the backend returns, for
that attribute:

- a count per year covered, as a `histogram` aggregation with an interval of 1
  gives on a range field;
- the bounds as facet stats;
- a filter that matches overlapping spans, which is what a `range` query on a
  range field does by default.

Set `spans` then. A record falls in every year it covers, so the bars' total is
no longer a record count, and it is hidden.

Searchkit asks for a `stats` aggregation on a numeric facet, which a range
field refuses. The Collection Flow dashboard swaps it for an `exists` count in
Searchkit's `beforeSearch` hook and rebuilds the bounds from the histogram in
`afterSearch`.
