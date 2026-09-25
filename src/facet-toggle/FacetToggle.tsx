import { useInstantSearch, useToggleRefinement } from "react-instantsearch";
import { toggleCount } from "./count.js";
import { type FacetToggleProps, FacetToggleView } from "./FacetToggleView.js";

/**
 * A boolean facet as a checkbox with its count, for React InstantSearch.
 * Styled by `facet-toggle.css`, which the consumer imports.
 */
export const FacetToggle = ({ attribute, on = true, countOn, ...props }: FacetToggleProps) => {
  const { value, refine } = useToggleRefinement({ attribute, on });
  const { results } = useInstantSearch();
  const buckets = results?.getFacetValues(attribute, {});
  return (
    <FacetToggleView
      {...props}
      checked={value.isRefined}
      count={toggleCount(Array.isArray(buckets) ? buckets : undefined, on, countOn)}
      onToggle={() => refine({ isRefined: value.isRefined })}
    />
  );
};

export type { FacetToggleProps } from "./FacetToggleView.js";
