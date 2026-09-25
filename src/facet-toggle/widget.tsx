import type { Widget } from "instantsearch.js";
import { connectToggleRefinement } from "instantsearch.js/es/connectors";
import { createRoot } from "react-dom/client";
import { toggleCount } from "./count.js";
import { type FacetToggleProps, FacetToggleView } from "./FacetToggleView.js";

export interface FacetToggleWidgetOptions extends FacetToggleProps {
  /** The element to render into, or a selector for it. */
  container: string | HTMLElement;
}

type Toggle = Parameters<Parameters<typeof connectToggleRefinement>[0]>[0];

/**
 * The boolean checkbox as an InstantSearch.js widget, for
 * `search.addWidgets([facetToggle({ container, attribute, label })])`.
 *
 * The toggle connector keeps the search results to itself and counts only the
 * `on` value's own bucket, so this wraps it: the results are read as they pass
 * through `render`, for the count from the bucket Elasticsearch really uses.
 */
export const facetToggle = ({
  container,
  attribute,
  on = true,
  countOn,
  ...props
}: FacetToggleWidgetOptions): Widget => {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`facetToggle: no element matches "${String(container)}"`);
  }
  const root = createRoot(el);
  let buckets: { name: string; count: number }[] | undefined;
  const draw = (state: Toggle) =>
    root.render(
      <FacetToggleView
        {...props}
        checked={state.value.isRefined}
        count={toggleCount(buckets, on, countOn)}
        onToggle={() => state.refine({ isRefined: state.value.isRefined })}
      />,
    );
  const toggle = connectToggleRefinement(draw)({ attribute, on }) as Widget;

  return {
    ...toggle,
    $$type: "cogapp.facetToggle",
    $$widgetType: "cogapp.facetToggle",
    render: (options) => {
      const values = options.results?.getFacetValues(attribute, {});
      buckets = Array.isArray(values) ? values : undefined;
      toggle.render?.(options);
    },
    dispose: (options) => {
      const state = toggle.dispose?.(options);
      root.unmount();
      return state;
    },
  } as Widget;
};
