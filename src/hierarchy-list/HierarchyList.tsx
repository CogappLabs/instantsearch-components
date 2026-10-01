import { useInstantSearch, useRefinementList } from "react-instantsearch";
import { type HierarchyListProps, HierarchyListView, PATH_LIMIT } from "./HierarchyListView.js";
import { toggledIn } from "./paths.js";

/**
 * A hierarchical facet as nested checkboxes, for React InstantSearch.
 * Styled by `hierarchy-list.css`, which the consumer imports.
 */
export const HierarchyList = ({
  attribute,
  valueLimit = PATH_LIMIT,
  ...props
}: HierarchyListProps) => {
  const { items } = useRefinementList({
    attribute,
    limit: valueLimit,
    sortBy: ["count:desc", "name:asc"],
  });
  const { setIndexUiState } = useInstantSearch();
  return (
    <HierarchyListView
      {...props}
      items={items}
      onToggle={(path) => setIndexUiState(toggledIn(attribute, path, props.separator))}
    />
  );
};

export type { HierarchyListProps } from "./HierarchyListView.js";
