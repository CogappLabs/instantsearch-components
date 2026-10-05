import { useCallback, useRef } from "react";
import {
  CurrentRefinements,
  type CurrentRefinementsProps,
  useInstantSearch,
} from "react-instantsearch";
import { type ReadableRefinementsOptions, readableRefinements } from "./refinements.js";

export type ReadableRefinementsProps = Omit<CurrentRefinementsProps, "transformItems"> &
  Omit<ReadableRefinementsOptions, "setUiState">;

/**
 * InstantSearch's `CurrentRefinements` with readable chips, wired to clear a
 * range in one search. Every other prop, `classNames` among them, is passed
 * through.
 */
export const ReadableRefinements = ({
  headings,
  flags,
  paths,
  separator,
  formatNumber,
  labels,
  ...props
}: ReadableRefinementsProps) => {
  const { setUiState } = useInstantSearch();
  const latest = useRef(readableRefinements());
  latest.current = readableRefinements({
    headings,
    flags,
    paths,
    separator,
    formatNumber,
    labels,
    setUiState,
  });
  // One function for the widget's life: it is re-created, and searches,
  // whenever transformItems changes, and inline option objects would change
  // it on every render.
  const transformItems = useCallback<NonNullable<CurrentRefinementsProps["transformItems"]>>(
    (items) => latest.current(items),
    [],
  );
  return <CurrentRefinements {...props} transformItems={transformItems} />;
};
