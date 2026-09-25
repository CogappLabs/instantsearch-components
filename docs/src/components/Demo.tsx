import { InstantSearch, useRange } from "react-instantsearch";
import { DateHistogram, type DateHistogramProps } from "../../../src/date-histogram/index.js";
import "../../../src/date-histogram/date-histogram.css";

/**
 * Made-up years shaped like a museum collection: a handful of antiquities, a
 * thin medieval stretch, then most records from 1500 on, peaking around 1900.
 */
const counts: Record<string, number> = {};
const add = (year: number, n: number) => {
  if (n > 0) counts[year] = (counts[year] ?? 0) + Math.round(n);
};
for (const y of [-3000, -2500, -1200, -500, -300, -100, 50, 200]) add(y, 3);
for (let y = 600; y < 1500; y += 7) add(y, 2 + ((y * 7) % 5));
for (let y = 1500; y <= 2024; y++) {
  const peak = Math.exp(-(((y - 1890) / 90) ** 2));
  add(y, 4 + 60 * peak + ((y * 13) % 9));
}

const years = Object.keys(counts).map(Number);
const stats = { min: Math.min(...years), max: Math.max(...years), avg: 0, sum: 0 };

/**
 * A search client that answers every query with the same year facet. The
 * component only needs facet counts and stats; hits never matter here.
 */
const client = {
  search: async (requests: unknown[]) => ({
    results: requests.map(() => ({
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage: 0,
      processingTimeMS: 1,
      exhaustiveNbHits: true,
      query: "",
      params: "",
      facets: { year: counts },
      facets_stats: { year: stats },
    })),
  }),
};

/** Props that need functions, which MDX cannot pass to an island. */
const presets: Record<string, Partial<DateHistogramProps>> = {
  german: {
    formatYear: (y) => (y < 0 ? `${-y} v. Chr.` : String(y)),
    formatCount: (n) => new Intl.NumberFormat("de").format(n),
    labels: {
      group: "Zeitraum",
      from: "Von",
      to: "Bis",
      apply: "Anwenden",
      records: (formatted, n) => `${formatted} ${n === 1 ? "Objekt" : "Objekte"}`,
      before: (year) => `vor ${year}`,
    },
  },
};

const Refinement = () => {
  const { start } = useRange({ attribute: "year" });
  const [from, to] = start;
  const shown = (v: number | undefined) =>
    v === undefined || !Number.isFinite(v) ? "open" : String(v);
  return (
    <p className="demo-refinement">
      Refinement: {shown(from)} to {shown(to)}
    </p>
  );
};

export interface DemoProps extends Omit<Partial<DateHistogramProps>, "attribute"> {
  /** Container width in pixels, to show how the layout adapts. */
  width?: number;
  preset?: keyof typeof presets;
  /** Inline custom properties, for theming demos. */
  theme?: Record<string, string>;
}

export default function Demo({ width, preset, theme, ...props }: DemoProps) {
  return (
    <div className="not-content demo" style={{ maxWidth: width, ...theme }}>
      <InstantSearch searchClient={client as never} indexName="demo">
        <DateHistogram attribute="year" {...(preset ? presets[preset] : {})} {...props} />
        <Refinement />
      </InstantSearch>
    </div>
  );
}
