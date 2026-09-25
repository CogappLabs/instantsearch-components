/**
 * The script-tag build, for pages that load React and React InstantSearch
 * from a CDN rather than bundling them. Each component becomes a global, as
 * React InstantSearch's own do, and all of them sit on CogappInstantSearch.
 */
import * as components from "./index.js";

declare global {
  interface Window {
    CogappInstantSearch: typeof components;
    DateHistogram?: typeof components.DateHistogram;
  }
}

window.CogappInstantSearch = components;
// Only where the page has no global of that name already.
window.DateHistogram ??= components.DateHistogram;
