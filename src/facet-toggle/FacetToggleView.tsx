export interface FacetToggleProps {
  attribute: string;
  label: string;
  /** The value the refinement filters on. */
  on?: string | number | boolean;
  /**
   * The facet bucket the count comes from, when it is neither `on` itself nor
   * a boolean's `1`/`0` (which are found without it).
   */
  countOn?: string | number | boolean;
  formatCount?: (count: number) => string;
  /** Added to the root, beside `facet-toggle`, to theme one instance. */
  className?: string;
}

/** A fixed locale, so server and client render the same digits. */
const englishCount = new Intl.NumberFormat("en");

/**
 * A facet value as one checkbox with its count. The view alone: `FacetToggle`
 * feeds it from React InstantSearch, `facetToggle` from InstantSearch.js.
 */
export const FacetToggleView = ({
  label,
  checked,
  count,
  onToggle,
  formatCount = (n) => englishCount.format(n),
  className,
}: Pick<FacetToggleProps, "label" | "formatCount" | "className"> & {
  checked: boolean;
  count?: number;
  onToggle: () => void;
}) => (
  <label className={className ? `facet-toggle ${className}` : "facet-toggle"}>
    <input type="checkbox" checked={checked} onChange={onToggle} />
    <span className="facet-toggle-label">{label}</span>
    {count !== undefined ? <span className="facet-toggle-count">{formatCount(count)}</span> : null}
  </label>
);
