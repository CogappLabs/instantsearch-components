import type { Widget } from "instantsearch.js";
import { connectRefinementList } from "instantsearch.js/es/connectors";
import { createRoot } from "react-dom/client";
import { type HierarchyListProps, HierarchyListView, PATH_LIMIT } from "./HierarchyListView.js";
import { withToggled } from "./paths.js";

export interface HierarchyListWidgetOptions extends HierarchyListProps {
  /** The element to render into, or a selector for it. */
  container: string | HTMLElement;
}

type List = Parameters<Parameters<typeof connectRefinementList>[0]>[0];
type Helper = Parameters<NonNullable<Widget["init"]>>[0]["helper"];

/**
 * The hierarchy as an InstantSearch.js widget, for
 * `search.addWidgets([hierarchyList({ container, attribute })])`.
 *
 * The connector refines one value at a time, so a toggle that swaps a ticked
 * ancestor for its child would send two searches. The helper, kept from
 * `init`, sets the whole list in one.
 */
export const hierarchyList = ({
  container,
  attribute,
  valueLimit = PATH_LIMIT,
  ...props
}: HierarchyListWidgetOptions): Widget => {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`hierarchyList: no element matches "${String(container)}"`);
  }
  const root = createRoot(el);
  let helper: Helper | undefined;
  const onToggle = (path: string) => {
    if (!helper) return;
    const ticked = helper.state.getDisjunctiveRefinements(attribute);
    let state = helper.state.removeDisjunctiveFacetRefinement(attribute);
    for (const p of withToggled(ticked, path, props.separator)) {
      state = state.addDisjunctiveFacetRefinement(attribute, p);
    }
    helper.setState(state.setPage(0)).search();
  };
  const draw = (list: List) =>
    root.render(<HierarchyListView {...props} items={list.items} onToggle={onToggle} />);
  const list = connectRefinementList(draw)({
    attribute,
    limit: valueLimit,
    sortBy: ["count:desc", "name:asc"],
  }) as Widget;

  return {
    ...list,
    $$type: "cogapp.hierarchyList",
    $$widgetType: "cogapp.hierarchyList",
    init: (options) => {
      helper = options.helper;
      list.init?.(options);
    },
    dispose: (options) => {
      const state = list.dispose?.(options);
      root.unmount();
      return state;
    },
  } as Widget;
};
