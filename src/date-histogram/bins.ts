/** Year bins for a date histogram, from a numeric facet's per-value counts. */

export interface Bins {
  /** Bin boundaries: bin `i` holds values from `edges[i]` to `edges[i + 1] - 1`. */
  edges: number[];
  counts: number[];
  /** Whether bin 0 gathers a long early tail rather than one even step. */
  tail: boolean;
}

/** The share of records a first bar may gather before the axis starts. */
const TAIL_SHARE = 0.01;

/**
 * At most `count` bins over integer values. Where the earliest 1% of records
 * stretch the axis by more than a quarter, they fold into the first bin, so a
 * collection running from -5000 but mostly after 1500 is not one spike at the
 * right.
 */
export const binValues = (
  values: readonly { value: number; count: number }[],
  min: number,
  max: number,
  count = 40,
): Bins => {
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, v) => sum + v.count, 0);

  let start = min;
  let seen = 0;
  for (const v of sorted) {
    seen += v.count;
    if (seen >= total * TAIL_SHARE) {
      start = v.value;
      break;
    }
  }
  const tail = start - min > (max - start) / 4;
  // A round fold point, as it becomes the tail's label: "before 1400".
  if (tail) {
    const unit = 10 ** Math.floor(Math.log10(Math.max(1, (max - start) / 4)));
    start = Math.floor(start / unit) * unit;
  } else start = min;

  const even = Math.max(1, Math.min(tail ? count - 1 : count, max - start + 1));
  const step = (max + 1 - start) / even;
  const edges = [
    ...(tail ? [min] : []),
    ...Array.from({ length: even }, (_, i) => Math.round(start + i * step)),
    max + 1,
  ];

  const counts = new Array<number>(edges.length - 1).fill(0);
  let bin = 0;
  for (const v of sorted) {
    while (bin < counts.length - 1 && v.value >= edges[bin + 1]) bin++;
    if (v.value >= edges[0] && v.value < edges[edges.length - 1]) counts[bin] += v.count;
  }
  return { edges, counts, tail };
};

/** The bin edge nearest a value, for placing a handle on a range from the URL. */
export const nearestEdge = (edges: readonly number[], value: number): number => {
  let best = 0;
  for (let i = 1; i < edges.length; i++) {
    if (Math.abs(edges[i] - value) < Math.abs(edges[best] - value)) best = i;
  }
  return best;
};

/** A labelled year and where it falls, in bins from the left edge. */
export interface Tick {
  year: number;
  at: number;
}

/**
 * Round years to label, about `count` of them over the even bins. A folded
 * tail is left out: its bin is labelled on its own, and a tick inside it would
 * sit at a place that means nothing.
 */
export const ticksFor = ({ edges, tail }: Bins, count = 4): Tick[] => {
  const first = tail ? 1 : 0;
  const start = edges[first];
  const end = edges[edges.length - 1] - 1;
  const rough = (end - start) / count;
  if (rough <= 0) return [];
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  // 25 and 250 read as round years, where 2.5 is no year at all.
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => Number.isInteger(s) && s >= rough) ??
    Math.ceil(rough);

  const ticks: Tick[] = [];
  for (let year = Math.ceil(start / step) * step; year <= end; year += step) {
    let i = first;
    while (i < edges.length - 2 && year >= edges[i + 1]) i++;
    ticks.push({ year, at: i + (year - edges[i]) / (edges[i + 1] - edges[i]) });
  }
  return ticks;
};
