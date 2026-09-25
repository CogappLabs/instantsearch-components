import { useRange, useRefinementList } from "react-instantsearch";
import { type DateHistogramProps, DateHistogramView } from "./DateHistogramView.js";

/**
 * The year-range histogram for React InstantSearch: the view, fed by the range
 * and refinement-list hooks on one attribute. Styled by `date-histogram.css`,
 * which the consumer imports, and themed by its `--date-histogram-*` properties.
 */
export const DateHistogram = ({ attribute, valueLimit = 1000, ...props }: DateHistogramProps) => {
  const { range, start, refine } = useRange({ attribute });
  const { items } = useRefinementList({ attribute, limit: valueLimit });
  return <DateHistogramView {...props} range={range} start={start} refine={refine} items={items} />;
};

export type { DateHistogramLabels, DateHistogramProps } from "./DateHistogramView.js";
