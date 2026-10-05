export interface ColourListItem {
  value: string;
  label: string;
  count: number;
  isRefined: boolean;
}

export interface ColourListProps {
  attribute: string;
  /**
   * Each facet value's CSS colour. A value missing here is tried as a colour
   * itself, so `red` needs no entry; one the browser cannot read gets the
   * stylesheet's empty swatch.
   */
  colours?: Record<string, string>;
  /** Colours shown, most records first. */
  limit?: number;
  formatCount?: (count: number) => string;
  /** Added to the root, beside `colour-list`, to theme one instance. */
  className?: string;
}

/** A fixed locale, so server and client render the same digits. */
const englishCount = new Intl.NumberFormat("en");

/**
 * A colour facet as swatches, any number ticked at once. The view alone:
 * `ColourList` feeds it from React InstantSearch, `colourList` from
 * InstantSearch.js.
 */
export const ColourListView = ({
  items,
  onToggle,
  colours = {},
  formatCount = (n) => englishCount.format(n),
  className,
}: Pick<ColourListProps, "colours" | "formatCount" | "className"> & {
  items: ColourListItem[];
  onToggle: (value: string) => void;
}) => (
  <ul className={className ? `colour-list ${className}` : "colour-list"}>
    {items.map((item) => (
      <li key={item.value}>
        <label className="colour-list-item">
          <input type="checkbox" checked={item.isRefined} onChange={() => onToggle(item.value)} />
          <span
            className="colour-list-swatch"
            style={{ backgroundColor: colours[item.value] ?? item.value }}
          />
          <span className="colour-list-name">{item.label}</span>
          <span className="colour-list-count">{formatCount(item.count)}</span>
        </label>
      </li>
    ))}
  </ul>
);
