import { useCallback, useRef, useState } from "react";
import { useRange, useRefinementList } from "react-instantsearch";
import { binValues, nearestEdge, ticksFor } from "./bins.js";

export interface DateHistogramProps {
  /** A numeric attribute holding one year per record. */
  attribute: string;
  /** Bars drawn, at most. */
  bins?: number;
  /**
   * `"auto"` folds a long thin early tail into the first bar, so a few
   * outliers do not crowd every other bar to the right; `"linear"` spaces
   * every bar evenly from the earliest year to the latest.
   */
  scale?: "auto" | "linear";
  /** Distinct values asked for, which must cover every year the index holds. */
  valueLimit?: number;
  formatYear?: (year: number) => string;
  formatCount?: (count: number) => string;
  labels?: Partial<DateHistogramLabels>;
  /** The From and To year boxes. */
  showInputs?: boolean;
  /** Year labels under the axis, the folded tail's among them. */
  showTicks?: boolean;
  /**
   * The records total. Turn it off over a range field, where a record counts
   * in every year it covers and the bars' sum is no record count.
   */
  showCount?: boolean;
  /** Added to the root, beside `date-histogram`, to theme one instance. */
  className?: string;
}

export interface DateHistogramLabels {
  /** Names the whole control for assistive technology, e.g. "Date". */
  group: string;
  from: string;
  to: string;
  apply: string;
  /** Takes the formatted count and the number, for a plural rule. */
  records: (formatted: string, count: number) => string;
  before: (year: string) => string;
}

const defaultLabels: DateHistogramLabels = {
  group: "Year range",
  from: "From",
  to: "To",
  apply: "Apply",
  records: (formatted, count) => `${formatted} ${count === 1 ? "record" : "records"}`,
  before: (year) => `before ${year}`,
};

/** A fixed locale, so server and client render the same digits. */
const englishCount = new Intl.NumberFormat("en");

/** The handles' hit width, which the track is inset by half of at each end. */
const HANDLE_PX = 24;

const bce = (y: number) => (y < 0 ? `${-y} BCE` : String(y));

/**
 * A year range for React InstantSearch, picked with two handles under a
 * histogram of the records' years, or typed.
 *
 * The bars are the facet's own per-value counts. InstantSearch asks for a
 * refined facet's values in a second query without its refinement, so bars
 * outside a chosen range keep their heights and show where to widen to. The
 * handles step between bin edges and one at either end leaves that side open;
 * the year boxes take any year inside the data's range. Styled by `date-histogram.css`, which the
 * consumer imports, and themed by its `--date-histogram-*` properties.
 */
export const DateHistogram = ({
  attribute,
  bins = 40,
  scale = "auto",
  valueLimit = 1000,
  formatYear = bce,
  formatCount = (n) => englishCount.format(n),
  labels: labelOverrides,
  showInputs = true,
  showTicks = true,
  showCount = true,
  className,
}: DateHistogramProps) => {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { range, start, refine } = useRange({ attribute });
  const { items } = useRefinementList({ attribute, limit: valueLimit });
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const [typed, setTyped] = useState<{ key: string; from: string; to: string } | null>(null);
  // Ticks are spaced by the width the component is given, which only layout
  // knows; until it is measured (and under SSR) four are drawn. A callback
  // ref, as the root is absent on the first renders, before any results.
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const rootRef = useCallback((el: HTMLFieldSetElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(el);
  }, []);

  const from = start[0] ?? Number.NEGATIVE_INFINITY;
  const to = start[1] ?? Number.POSITIVE_INFINITY;
  const refined = Number.isFinite(from) || Number.isFinite(to);
  const rootClass = className ? `date-histogram ${className}` : "date-histogram";
  const parse = (s: string) => (s.trim() === "" ? undefined : Math.round(Number(s)));

  // A draft is keyed to the refinement it was typed against, so a handle drag
  // or a cleared filter replaces it rather than leaving stale text.
  const key = `${from}:${to}`;
  const draft = typed?.key === key ? typed : null;
  const current = {
    from: Number.isFinite(from) ? String(from) : "",
    to: Number.isFinite(to) ? String(to) : "",
  };

  const { min, max } = range;
  const spread = min !== undefined && max !== undefined && min < max;
  // With no spread to draw, a range the reader set may be what emptied it, so
  // the year boxes stay to change or clear it.
  if (!spread) {
    if (!refined || !showInputs) return null;
    return (
      <fieldset ref={rootRef} className={rootClass} aria-label={labels.group}>
        <YearForm
          labels={labels}
          value={(side) => draft?.[side] ?? current[side]}
          placeholder={() => ""}
          onType={(side, v) => setTyped({ key, ...current, ...draft, [side]: v })}
          onApply={() => {
            if (!draft) return;
            const a = parse(draft.from);
            const b = parse(draft.to);
            if (Number.isNaN(a) || Number.isNaN(b)) return;
            setTyped(null);
            refine([a, b]);
          }}
        />
      </fieldset>
    );
  }

  const values = items
    // InstantSearch escapes a leading "-" in a facet value, so a BCE year
    // arrives as "\-500".
    .map((item) => ({ value: Number(item.value.replace(/^\\/, "")), count: item.count }))
    .filter((v) => Number.isFinite(v.value));
  const binned = binValues(values, min, max, bins, scale === "auto");
  const { edges, counts, tail } = binned;
  const tailLabel = tail ? labels.before(formatYear(edges[1])) : "";
  // About 72px per label; the tail's own label is kept clear by its length,
  // at roughly 6px a character of the 11px tick text.
  const track = Math.max(0, width - HANDLE_PX);
  const ticks = ticksFor(binned, width ? Math.max(1, Math.floor(track / 72)) : 4).filter(
    // A tick at the fold would only repeat the tail's label.
    (t) =>
      !tail ||
      (t.year > edges[1] && (!width || (t.at / counts.length) * track > tailLabel.length * 6 + 24)),
  );
  const last = edges.length - 1;

  const committed: [number, number] = [
    Number.isFinite(from) && from > min ? nearestEdge(edges, from) : 0,
    Number.isFinite(to) && to < max ? nearestEdge(edges, to + 1) : last,
  ];
  const [lo, hi] = drag ?? committed;

  const commit = () => {
    if (!drag) return;
    setDrag(null);
    setTyped(null);
    // The handle not moved keeps its exact year, which may lie between edges,
    // unless other filters have since narrowed the data past it: the connector
    // refuses the whole refine over a bound outside the data's range.
    const exact = (v: number) => (Number.isFinite(v) && v > min && v < max ? v : undefined);
    refine([
      lo === committed[0] ? exact(from) : lo === 0 ? undefined : edges[lo],
      hi === committed[1] ? exact(to) : hi === last ? undefined : edges[hi] - 1,
    ]);
  };

  const apply = () => {
    if (!draft) return;
    const a = parse(draft.from);
    const b = parse(draft.to);
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    setTyped(null);
    const [lower, upper] = a !== undefined && b !== undefined && a > b ? [b, a] : [a, b];
    // The connector drops a bound outside the data's range rather than
    // clamping it, so a year before the earliest record would do nothing.
    // At the range's edge the bound is left open.
    const bound = (y: number | undefined) =>
      y === undefined || y <= min || y >= max ? undefined : y;
    refine([bound(lower), bound(upper)]);
  };

  // A typed range sits between bin edges, so only a drag reads the years off them.
  const fromYear = drag ? (lo === 0 ? min : edges[lo]) : Math.max(from, min);
  const toYear = drag ? (hi === last ? max : edges[hi] - 1) : Math.min(to, max);
  const peak = Math.max(1, ...counts);
  const selected = values
    .filter((v) => v.value >= fromYear && v.value <= toYear)
    .reduce((sum, v) => sum + v.count, 0);

  return (
    <fieldset ref={rootRef} className={rootClass} aria-label={labels.group}>
      <svg
        viewBox={`0 0 ${counts.length} 1`}
        preserveAspectRatio="none"
        className="date-histogram-bars"
        aria-hidden="true"
      >
        {counts.map((c, i) => {
          // A bin with a handful of records still shows as a sliver.
          const h = c ? Math.max(c / peak, 0.04) : 0;
          return (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: bins are positional
              key={i}
              // The folded tail stops short, leaving a gap where the scale changes.
              x={i + 0.08}
              width={tail && i === 0 ? 0.6 : 0.84}
              y={1 - h}
              height={h}
              data-selected={(i >= lo && i < hi) || undefined}
              data-tail={(tail && i === 0) || undefined}
            />
          );
        })}
      </svg>
      <div className="date-histogram-handles">
        <input
          type="range"
          min={0}
          max={last}
          value={lo}
          // Both thumbs share a track; near the end From would sit under To.
          style={lo > last / 2 ? { zIndex: 1 } : undefined}
          aria-label={labels.from}
          aria-valuetext={formatYear(fromYear)}
          onChange={(e) => setDrag([Math.min(Number(e.target.value), hi - 1), hi])}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
        />
        <input
          type="range"
          min={0}
          max={last}
          value={hi}
          aria-label={labels.to}
          aria-valuetext={formatYear(toYear)}
          onChange={(e) => setDrag([lo, Math.max(Number(e.target.value), lo + 1)])}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
        />
      </div>
      {showTicks ? (
        <div className="date-histogram-ticks" aria-hidden="true">
          {tail ? <span data-tail>{tailLabel}</span> : null}
          {ticks.map((t) => (
            <span key={t.year} style={{ left: `${(t.at / counts.length) * 100}%` }}>
              {formatYear(t.year)}
            </span>
          ))}
        </div>
      ) : null}
      {showCount ? (
        <p className="date-histogram-summary">{labels.records(formatCount(selected), selected)}</p>
      ) : null}
      {showInputs ? (
        <YearForm
          labels={labels}
          value={(side) =>
            draft?.[side] ?? (drag ? String(side === "from" ? fromYear : toYear) : current[side])
          }
          placeholder={(side) => String(side === "from" ? min : max)}
          onType={(side, v) => setTyped({ key, ...current, ...draft, [side]: v })}
          onApply={apply}
        />
      ) : null}
    </fieldset>
  );
};

type Side = "from" | "to";

/**
 * The From and To year boxes. Plain text rather than `type="number"` or a
 * numeric `inputMode`, whose iOS keypads have no minus sign for a BCE year.
 * A fraction is rounded when applied.
 */
const YearForm = ({
  labels,
  value,
  placeholder,
  onType,
  onApply,
}: {
  labels: DateHistogramLabels;
  value: (side: Side) => string;
  placeholder: (side: Side) => string;
  onType: (side: Side, value: string) => void;
  onApply: () => void;
}) => (
  <form
    className="date-histogram-form"
    onSubmit={(e) => {
      e.preventDefault();
      onApply();
    }}
  >
    {(["from", "to"] as const).map((side) => (
      <label key={side}>
        {labels[side]}
        <input
          type="text"
          autoComplete="off"
          value={value(side)}
          placeholder={placeholder(side)}
          onChange={(e) => onType(side, e.target.value)}
        />
      </label>
    ))}
    <button type="submit">{labels.apply}</button>
  </form>
);
