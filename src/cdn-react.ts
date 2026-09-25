/**
 * The script-tag build for React pages, which load React and React
 * InstantSearch from a CDN rather than bundling them. Each component becomes
 * a global, as React InstantSearch's own do, and all of them sit on
 * CogappInstantSearch.
 */
import * as components from "./index.js";

const page = window as unknown as Record<string, unknown>;
page.CogappInstantSearch = components;
// Only where the page has no global of that name already.
page.DateHistogram ??= components.DateHistogram;
