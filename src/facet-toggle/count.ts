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
 * `true` bucket, finds none. The `on` value is tried first, then its bucket
 * key, so a boolean needs no `countOn`; one is still taken for anything else.
 */
export const toggleCount = (
  buckets: readonly FacetBucket[] | undefined,
  on: ToggleValue,
  countOn?: ToggleValue,
): number | undefined => {
  const keys =
    countOn !== undefined
      ? [String(countOn)]
      : [String(on), ...(on === true ? ["1"] : on === false ? ["0"] : [])];
  for (const key of keys) {
    const bucket = buckets?.find((b) => b.name === key);
    if (bucket) return bucket.count;
  }
  return undefined;
};
