/**
 * The script-tag build for InstantSearch.js pages: each component as a widget
 * factory beside the page's `instantsearch.widgets`, rendered with Preact so
 * the page needs no React. All of them sit on CogappInstantSearch.
 */
import { binValues, nearestEdge, ticksFor } from "./date-histogram/bins.js";
import { dateHistogram } from "./date-histogram/widget.js";
import { toggleCount } from "./facet-toggle/count.js";
import { facetToggle } from "./facet-toggle/widget.js";

const page = window as unknown as Record<string, unknown>;
page.CogappInstantSearch = {
  dateHistogram,
  facetToggle,
  binValues,
  nearestEdge,
  ticksFor,
  toggleCount,
};
// Only where the page has no global of that name already.
page.dateHistogram ??= dateHistogram;
page.facetToggle ??= facetToggle;
