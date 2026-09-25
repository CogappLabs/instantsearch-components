/** A facet value as InstantSearch reports it: its bucket key and count. */
export interface FacetBucket {
  name: string;
  count: number;
}

/** The value a toggle filters on, which may be a boolean. */
export type ToggleValue = string | number | boolean;

/**
 * The count beside a toggle, from the bucket its `on` value lands in.
 *
 * Elasticsearch filters a boolean on `true` but keys its aggregation bucket
 * `1` (and `false` as `0`), so InstantSearch's own toggle, which looks for a
 * `true` bucket, finds none. The bucket key is tried before the `on` value:
 * once the box is ticked, InstantSearch lists the refined `true` itself with a
 * count of 0, which would otherwise win. Algolia keys the bucket `true` and
 * has no `1`, so it falls through to that. `countOn` overrides both.
 */
export const toggleCount = (
  buckets: readonly FacetBucket[] | undefined,
  on: ToggleValue,
  countOn?: ToggleValue,
): number | undefined => {
  const keys =
    countOn !== undefined
      ? [String(countOn)]
      : [...(on === true ? ["1"] : on === false ? ["0"] : []), String(on)];
  for (const key of keys) {
    const bucket = buckets?.find((b) => b.name === key);
    if (bucket) return bucket.count;
  }
  return undefined;
};
