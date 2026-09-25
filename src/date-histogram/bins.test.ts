import { describe, expect, it } from "vitest";
import { binValues, nearestEdge, ticksFor } from "./bins.js";

const years = (from: number, to: number, count = 1) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ value: from + i, count }));

describe("binValues", () => {
  it("spreads even bins over a compact range", () => {
    const { edges, counts, tail } = binValues(years(1900, 1999), 1900, 1999, 10);
    expect(tail).toBe(false);
    expect(edges).toEqual([1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000]);
    expect(counts).toEqual(new Array(10).fill(10));
  });

  it("folds a long thin early tail into the first bin", () => {
    const values = [{ value: -5000, count: 1 }, ...years(1500, 2025, 10)];
    const { edges, counts, tail } = binValues(values, -5000, 2025, 40);
    expect(tail).toBe(true);
    expect(edges[0]).toBe(-5000);
    expect(edges[1]).toBeGreaterThanOrEqual(1500);
    expect(counts[0]).toBeGreaterThanOrEqual(1);
    expect(counts.reduce((a, b) => a + b)).toBe(1 + 526 * 10);
  });

  it("uses one bin per value when there are fewer values than bins", () => {
    const { edges } = binValues(years(2000, 2004), 2000, 2004, 40);
    expect(edges).toEqual([2000, 2001, 2002, 2003, 2004, 2005]);
  });
});

describe("nearestEdge", () => {
  it("picks the closest boundary", () => {
    expect(nearestEdge([1900, 1950, 2000], 1940)).toBe(1);
    expect(nearestEdge([1900, 1950, 2000], 1901)).toBe(0);
  });
});

describe("ticksFor", () => {
  it("labels round years where they fall", () => {
    const bins = binValues(years(1900, 1999), 1900, 1999, 10);
    expect(ticksFor(bins)).toEqual([
      { year: 1900, at: 0 },
      { year: 1925, at: 2.5 },
      { year: 1950, at: 5 },
      { year: 1975, at: 7.5 },
    ]);
  });

  it("leaves a folded tail unticked", () => {
    const values = [{ value: -5000, count: 1 }, ...years(1500, 2025, 10)];
    const bins = binValues(values, -5000, 2025, 40);
    const ticks = ticksFor(bins);
    expect(ticks.every((t) => t.at >= 1)).toBe(true);
    expect(ticks.map((t) => t.year)).toContain(1600);
  });
});
