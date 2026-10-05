import type { Widget } from "instantsearch.js";
import { connectRefinementList } from "instantsearch.js/es/connectors";
import { createRoot } from "react-dom/client";
import { type ColourListProps, ColourListView } from "./ColourListView.js";

export interface ColourListWidgetOptions extends ColourListProps {
  /** The element to render into, or a selector for it. */
  container: string | HTMLElement;
}

type List = Parameters<Parameters<typeof connectRefinementList>[0]>[0];

/**
 * The colour swatches as an InstantSearch.js widget, for
 * `search.addWidgets([colourList({ container, attribute, colours })])`.
 */
export const colourList = ({
  container,
  attribute,
  limit = 20,
  ...props
}: ColourListWidgetOptions): Widget => {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`colourList: no element matches "${String(container)}"`);
  }
  const root = createRoot(el);
  const draw = (list: List) =>
    root.render(<ColourListView {...props} items={list.items} onToggle={list.refine} />);
  const list = connectRefinementList(draw)({ attribute, limit }) as Widget;

  return {
    ...list,
    $$type: "cogapp.colourList",
    $$widgetType: "cogapp.colourList",
    dispose: (options) => {
      const state = list.dispose?.(options);
      root.unmount();
      return state;
    },
  } as Widget;
};
