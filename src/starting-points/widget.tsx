import type { IndexUiState, Widget } from "instantsearch.js";
import { connectCurrentRefinements } from "instantsearch.js/es/connectors";
import { createRoot } from "react-dom/client";
import { type StartingPointsProps, StartingPointsView } from "./StartingPointsView.js";

export interface StartingPointsWidgetOptions extends StartingPointsProps {
  /** The element to render into, or a selector for it. */
  container: string | HTMLElement;
}

type Refinements = Parameters<Parameters<typeof connectCurrentRefinements>[0]>[0];
type Parent = Parameters<NonNullable<Widget["init"]>>[0]["parent"];

/**
 * The suggested searches as an InstantSearch.js widget, for
 * `search.addWidgets([startingPoints({ container, items })])`.
 */
export const startingPoints = ({ container, ...props }: StartingPointsWidgetOptions): Widget => {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!(el instanceof HTMLElement)) {
    throw new Error(`startingPoints: no element matches "${String(container)}"`);
  }
  const root = createRoot(el);
  let parent: Parent | undefined;
  const onChoose = (state: IndexUiState) =>
    parent?.setIndexUiState(({ page: _page, ...current }) => ({ ...current, ...state }));
  const draw = ({ items }: Refinements) =>
    root.render(items.length ? null : <StartingPointsView {...props} onChoose={onChoose} />);
  // With nothing excluded, a query counts as a refinement too.
  const refinements = connectCurrentRefinements(draw)({ excludedAttributes: [] }) as Widget;

  return {
    ...refinements,
    $$type: "cogapp.startingPoints",
    $$widgetType: "cogapp.startingPoints",
    init: (options) => {
      parent = options.parent;
      refinements.init?.(options);
    },
    dispose: (options) => {
      const state = refinements.dispose?.(options);
      root.unmount();
      return state;
    },
  } as Widget;
};
