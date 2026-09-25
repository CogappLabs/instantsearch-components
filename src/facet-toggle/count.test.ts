import { describe, expect, it } from "vitest";
import { toggleCount } from "./count.js";

describe("toggleCount", () => {
  it("reads Elasticsearch's 1 bucket for a true toggle", () => {
    expect(
      toggleCount(
        [
          { name: "1", count: 42 },
          { name: "0", count: 9 },
        ],
        true,
      ),
    ).toBe(42);
  });

  it("reads 0 for a false toggle", () => {
    expect(
      toggleCount(
        [
          { name: "1", count: 42 },
          { name: "0", count: 9 },
        ],
        false,
      ),
    ).toBe(9);
  });

  it("reads a bucket named for the value itself, as Algolia keys it", () => {
    expect(toggleCount([{ name: "true", count: 7 }], true)).toBe(7);
  });

  it("ignores the empty entry InstantSearch lists for a ticked value", () => {
    const buckets = [
      { name: "true", count: 0 },
      { name: "1", count: 42 },
    ];
    expect(toggleCount(buckets, true)).toBe(42);
  });

  it("takes an explicit bucket", () => {
    expect(toggleCount([{ name: "yes", count: 3 }], "Y", "yes")).toBe(3);
  });

  it("has no count without a matching bucket", () => {
    expect(toggleCount([{ name: "0", count: 9 }], true)).toBeUndefined();
    expect(toggleCount(undefined, true)).toBeUndefined();
  });
});
