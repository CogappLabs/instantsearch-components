import { useInstantSearch, useToggleRefinement } from "react-instantsearch";
import { toggleCount, toggleIsEmpty } from "./count.js";
import { type FacetToggleProps, FacetToggleView } from "./FacetToggleView.js";

/**
 * A boolean facet as a checkbox with its count, for React InstantSearch.
 * Styled by `facet-toggle.css`, which the consumer imports.
 */
export const FacetToggle = ({
  attribute,
  on = true,
  countOn,
  hideEmpty,
  ...props
}: FacetToggleProps) => {
  const { value, refine } = useToggleRefinement({ attribute, on });
  const { results } = useInstantSearch();
  const values = results?.getFacetValues(attribute, {});
  const buckets = Array.isArray(values) ? values : undefined;
  const count = toggleCount(buckets, on, countOn);
  return (
    <FacetToggleView
      {...props}
      checked={value.isRefined}
      count={count}
      hidden={hideEmpty && toggleIsEmpty(buckets, value.isRefined, count)}
      onToggle={() => refine({ isRefined: value.isRefined })}
    />
  );
};

export type { FacetToggleProps } from "./FacetToggleView.js";
