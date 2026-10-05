import { useCurrentRefinements, useInstantSearch } from "react-instantsearch";
import { type StartingPointsProps, StartingPointsView } from "./StartingPointsView.js";

/**
 * Suggested searches for an empty search page, for React InstantSearch. Shown
 * only while there is no query and no refinement, so it comes back after
 * "Clear all". Styled by `starting-points.css`, which the consumer imports.
 */
export const StartingPoints = (props: StartingPointsProps) => {
  // With nothing excluded, a query counts as a refinement too.
  const { items } = useCurrentRefinements({ excludedAttributes: [] });
  const { setIndexUiState } = useInstantSearch();
  if (items.length) return null;
  return (
    <StartingPointsView
      {...props}
      // The page belongs to the browse results the cards sat over, not to the
      // search a card starts.
      onChoose={(state) =>
        setIndexUiState(({ page: _page, ...current }) => ({ ...current, ...state }))
      }
    />
  );
};

export type { StartingPointsProps } from "./StartingPointsView.js";
