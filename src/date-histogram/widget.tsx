import type { Widget } from "instantsearch.js";
import { connectRange, connectRefinementList } from "instantsearch.js/es/connectors";
import { createRoot } from "react-dom/client";
import { type DateHistogramProps, DateHistogramView } from "./DateHistogramView.js";

export interface DateHistogramWidgetOptions extends DateHistogramProps {
  /** The element to render into, or a selector for it. */
  container: string | HTMLElement;
}

type Range = Parameters<Parameters<typeof connectRange>[0]>[0];
type List = Parameters<Parameters<typeof connectRefinementList>[0]>[0];

/**
 * The year-range histogram as an InstantSearch.js widget, for
 * `search.addWidgets([dateHistogram({ container, attribute })])`.
 *
 * One widget over two connectors on the same attribute, as the React version
 * uses two hooks: the range for the bounds and the filter, the refinement
 * list for each year's count. Every widget method is passed to both, so their
 * search parameters and URL state combine as two separate widgets' would.
 */
export const dateHistogram = ({
  container,
  attribute,
  valueLimit = 1000,
  ...props
}: DateHistogramWidgetOptions): Widget => {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`dateHistogram: no element matches "${String(container)}"`);
  }
  const root = createRoot(el);
  let range: Range | undefined;
  let list: List | undefined;
  const draw = () => {
    if (!range || !list) return;
    root.render(
      <DateHistogramView
        {...props}
        range={range.range}
        start={range.start}
        refine={range.refine}
        items={list.items}
      />,
    );
  };

  const parts = [
    connectRange((state) => {
      range = state;
      draw();
    })({ attribute }),
    connectRefinementList((state) => {
      list = state;
      draw();
    })({ attribute, limit: valueLimit }),
  ] as Widget[];

  return {
    $$type: "cogapp.dateHistogram",
    $$widgetType: "cogapp.dateHistogram",
    init: (options) => {
      for (const part of parts) part.init?.(options);
    },
    render: (options) => {
      for (const part of parts) part.render?.(options);
    },
    dispose: (options) => {
      let { state } = options;
      for (const part of parts) {
        state = (part.dispose?.({ ...options, state }) ?? state) as typeof state;
      }
      root.unmount();
      return state;
    },
    getWidgetUiState: (uiState, options) =>
      parts.reduce((ui, part) => part.getWidgetUiState?.(ui, options) ?? ui, uiState),
    getWidgetSearchParameters: (params, options) =>
      parts.reduce(
        (p, part) => (part.getWidgetSearchParameters?.(p, options) ?? p) as typeof params,
        params,
      ),
    getRenderState: (renderState, options) =>
      parts.reduce((rs, part) => part.getRenderState?.(rs, options) ?? rs, renderState),
  } as Widget;
};
