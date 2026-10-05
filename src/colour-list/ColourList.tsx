import { useRefinementList } from "react-instantsearch";
import { type ColourListProps, ColourListView } from "./ColourListView.js";

/**
 * A colour facet as swatches, any number ticked at once, for React
 * InstantSearch. Styled by `colour-list.css`, which the consumer imports.
 */
export const ColourList = ({ attribute, limit = 20, ...props }: ColourListProps) => {
  const { items, refine } = useRefinementList({ attribute, limit });
  return <ColourListView {...props} items={items} onToggle={refine} />;
};

export type { ColourListProps } from "./ColourListView.js";
