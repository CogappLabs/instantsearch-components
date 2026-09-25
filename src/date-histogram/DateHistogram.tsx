import { useState } from "react";
import { useRange, useRefinementList } from "react-instantsearch";
import { binValues, nearestEdge, ticksFor } from "./bins.js";

export interface DateHistogramProps {
  /** A numeric attribute holding one year per record. */
  attribute: string;
  /** Bars drawn, at most. */
  bins?: number;
  /** Distinct values asked for, which must cover every year the index holds. */
  valueLimit?: number;
  formatYear?: (year: number) => string;
  formatCount?: (count: number) => string;
  labels?: Partial<typeof defaultLabels>;
  /**
   * The counts are per year covered, from a range field, so one record is in
   * several bars and their sum is no record count. Hides that count.
   */
  spans?: boolean;
}

const defaultLabels = {
  from: "From",
  to: "To",
  apply: "Apply",
  records: (count: string) => `${count} records`,
  before: (year: string) => `before ${year}`,
};

const bce = (y: number) => (y < 0 ? `${-y} BCE` : String(y));

/**
 * A year range for React InstantSearch, picked with two handles under a
 * histogram of the records' years, or typed.
 *
 * The bars are the facet's own per-value counts. InstantSearch asks for a
 * refined facet's values in a second query without its refinement, so bars
 * outside a chosen range keep their heights and show where to widen to. The
 * handles step between bin edges and one at either end leaves that side open;
 * the year boxes take any year. Styled by `date-histogram.css`, which the
 * consumer imports, and themed by its `--date-histogram-*` properties.
 */
export const DateHistogram = ({
  attribute,
  bins = 40,
  valueLimit = 1000,
  formatYear = bce,
  formatCount = (n) => n.toLocaleString(),
  labels: labelOverrides,
  spans = false,
}: DateHistogramProps) => {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { range, start, refine } = useRange({ attribute });
  const { items } = useRefinementList({ attribute, limit: valueLimit });
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const [typed, setTyped] = useState<{ key: string; from: string; to: string } | null>(null);

  const { min, max } = range;
  if (min === undefined || max === undefined || min === max) return null;

  const values = items
    .map((item) => ({ value: Number(item.value), count: item.count }))
    .filter((v) => Number.isFinite(v.value));
  const binned = binValues(values, min, max, bins);
  const { edges, counts, tail } = binned;
  // Clear of the tail's own label, which takes about four bins' width.
  const ticks = ticksFor(binned).filter((t) => !tail || t.at >= 4);
  const last = edges.length - 1;

  const from = start[0] ?? Number.NEGATIVE_INFINITY;
  const to = start[1] ?? Number.POSITIVE_INFINITY;
  const committed: [number, number] = [
    Number.isFinite(from) && from > min ? nearestEdge(edges, from) : 0,
    Number.isFinite(to) && to < max ? nearestEdge(edges, to + 1) : last,
  ];
  const [lo, hi] = drag ?? committed;

  const commit = () => {
    if (!drag) return;
    setDrag(null);
    // The handle not moved keeps its exact year, which may lie between edges.
    const exact = (v: number) => (Number.isFinite(v) ? v : undefined);
    refine([
      lo === committed[0] ? exact(from) : lo === 0 ? undefined : edges[lo],
      hi === committed[1] ? exact(to) : hi === last ? undefined : edges[hi] - 1,
    ]);
  };

  // A draft is keyed to the refinement it was typed against, so a handle drag
  // or a cleared filter replaces it rather than leaving stale text.
  const key = `${from}:${to}`;
  const draft = typed?.key === key ? typed : null;
  const current = {
    from: Number.isFinite(from) ? String(from) : "",
    to: Number.isFinite(to) ? String(to) : "",
  };
  // Typed structurally: SubmitEvent is missing from React 18's types.
  const apply = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!draft) return;
    const parse = (s: string) => (s.trim() === "" ? undefined : Number(s));
    const a = parse(draft.from);
    const b = parse(draft.to);
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    setTyped(null);
    refine(a !== undefined && b !== undefined && a > b ? [b, a] : [a, b]);
  };

  // A typed range sits between bin edges, so only a drag reads the years off them.
  const fromYear = drag ? (lo === 0 ? min : edges[lo]) : Math.max(from, min);
  const toYear = drag ? (hi === last ? max : edges[hi] - 1) : Math.min(to, max);
  const peak = Math.max(1, ...counts);
  const selected = values
    .filter((v) => v.value >= fromYear && v.value <= toYear)
    .reduce((sum, v) => sum + v.count, 0);

  return (
    <div className="date-histogram">
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
              x={i + 0.08}
              width={0.84}
              y={1 - h}
              height={h}
              className={
                [i >= lo && i < hi ? "is-selected" : "", tail && i === 0 ? "is-tail" : ""]
                  .join(" ")
                  .trim() || undefined
              }
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
      <div className="date-histogram-ticks" aria-hidden="true">
        {tail ? <span className="is-tail">{labels.before(formatYear(edges[1]))}</span> : null}
        {ticks.map((t) => (
          <span key={t.year} style={{ left: `${(t.at / counts.length) * 100}%` }}>
            {formatYear(t.year)}
          </span>
        ))}
      </div>
      {spans ? null : (
        <p className="date-histogram-summary">{labels.records(formatCount(selected))}</p>
      )}
      <form onSubmit={apply} className="date-histogram-form">
        {(["from", "to"] as const).map((side) => (
          <label key={side}>
            {labels[side]}
            <input
              type="number"
              inputMode="numeric"
              step={1}
              value={
                draft?.[side] ??
                (drag ? String(side === "from" ? fromYear : toYear) : current[side])
              }
              placeholder={String(side === "from" ? min : max)}
              onChange={(e) => setTyped({ key, ...current, ...draft, [side]: e.target.value })}
            />
          </label>
        ))}
        <button type="submit">{labels.apply}</button>
      </form>
    </div>
  );
};
