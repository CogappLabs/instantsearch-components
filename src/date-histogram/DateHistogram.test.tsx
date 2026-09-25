// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstantSearch } from "react-instantsearch";
import { afterEach, describe, expect, it } from "vitest";
import { DateHistogram, type DateHistogramProps } from "./DateHistogram.js";

afterEach(cleanup);

/** One record at 5000 BCE, then ten a year from 1500 to 2025. */
const counts: Record<string, number> = { "-5000": 1 };
for (let y = 1500; y <= 2025; y++) counts[y] = 10;

type Request = { params?: { numericFilters?: string[] } };

/** A search client answering every query with the same year facet. */
const client = (log: Request[] = [], facet = counts) => ({
  search: async (requests: Request[]) => {
    log.push(...requests);
    const years = Object.keys(facet).map(Number);
    return {
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
        facets: { year: facet },
        facets_stats: {
          year: { min: Math.min(...years), max: Math.max(...years), avg: 0, sum: 0 },
        },
      })),
    };
  },
});

const renderWith = (props: Partial<DateHistogramProps> = {}, log: Request[] = [], facet = counts) =>
  render(
    <InstantSearch searchClient={client(log, facet) as never} indexName="records">
      <DateHistogram attribute="year" {...props} />
    </InstantSearch>,
  );

const root = async () => {
  await screen.findAllByRole("slider");
  return document.querySelector(".date-histogram") as HTMLElement;
};

/** The numeric filters of the latest query that carried any. */
const lastFilters = (log: Request[]) =>
  log
    .map((r) => r.params?.numericFilters)
    .filter((f): f is string[] => !!f?.length)
    .at(-1);

describe("DateHistogram", () => {
  it("draws every part by default", async () => {
    renderWith();
    const el = await root();
    expect(el.querySelectorAll(".date-histogram-bars rect")).toHaveLength(40);
    expect(el.querySelector(".date-histogram-ticks")?.textContent).toContain("before 1500");
    expect(el.querySelector(".date-histogram-summary")?.textContent).toBe("5,261 records");
    expect(el.querySelector(".date-histogram-form")).not.toBeNull();
    expect(el.querySelector("rect[data-tail]")).not.toBeNull();
  });

  it("hides the year boxes", async () => {
    renderWith({ showInputs: false });
    await screen.findAllByRole("slider");
    expect(document.querySelector(".date-histogram-form")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("hides the ticks", async () => {
    renderWith({ showTicks: false });
    const el = await root();
    expect(el.querySelector(".date-histogram-ticks")).toBeNull();
    expect(el.querySelectorAll(".date-histogram-bars rect")).toHaveLength(40);
  });

  it("hides the count", async () => {
    renderWith({ showCount: false });
    const el = await root();
    expect(el.querySelector(".date-histogram-summary")).toBeNull();
  });

  it("adds a class beside its own", async () => {
    renderWith({ className: "compact" });
    const el = await root();
    expect(el.className).toBe("date-histogram compact");
  });

  it("draws at most the bars asked for", async () => {
    renderWith({ bins: 10 });
    const el = await root();
    expect(el.querySelectorAll(".date-histogram-bars rect")).toHaveLength(10);
  });

  it("takes its labels and formatters", async () => {
    renderWith({
      labels: {
        from: "Von",
        to: "Bis",
        apply: "Anwenden",
        records: (n, count) => `${n} ${count === 1 ? "Objekt" : "Objekte"}`,
        before: (y) => `vor ${y}`,
      },
      formatYear: (y) => `${y} n. Chr.`,
      formatCount: (n) => `≈${n}`,
    });
    expect(await screen.findAllByLabelText("Von")).toHaveLength(2);
    expect(screen.getAllByLabelText("Bis")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Anwenden" })).toBeTruthy();
    const el = document.querySelector(".date-histogram") as HTMLElement;
    expect(el.querySelector(".date-histogram-summary")?.textContent).toBe("≈5261 Objekte");
    expect(el.querySelector(".date-histogram-ticks")?.textContent).toContain("vor 1500 n. Chr.");
  });

  it("filters on typed years", async () => {
    const log: Request[] = [];
    renderWith({}, log);
    await root();
    const [from, to] = screen.getAllByRole("textbox");
    fireEvent.change(from, { target: { value: "1800" } });
    fireEvent.change(to, { target: { value: "1850" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(lastFilters(log)).toEqual(["year>=1800", "year<=1850"]));
  });

  it("swaps typed years entered the wrong way round", async () => {
    const log: Request[] = [];
    renderWith({}, log);
    await root();
    const [from, to] = screen.getAllByRole("textbox");
    fireEvent.change(from, { target: { value: "1900" } });
    fireEvent.change(to, { target: { value: "1850" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(lastFilters(log)).toEqual(["year>=1850", "year<=1900"]));
  });

  it("opens a typed bound beyond the data, and rounds a fraction", async () => {
    const log: Request[] = [];
    renderWith({}, log);
    await root();
    const [from, to] = screen.getAllByRole("textbox");
    fireEvent.change(from, { target: { value: "-9000" } });
    fireEvent.change(to, { target: { value: "1850.6" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(lastFilters(log)).toEqual(["year<=1851"]));
  });

  it("filters from a moved handle, leaving the other side open", async () => {
    const log: Request[] = [];
    renderWith({}, log);
    await root();
    const [lower] = screen.getAllByRole("slider");
    fireEvent.change(lower, { target: { value: "20" } });
    fireEvent.keyUp(lower);
    await waitFor(() => {
      const filters = lastFilters(log);
      expect(filters).toHaveLength(1);
      expect(filters?.[0]).toMatch(/^year>=\d+$/);
    });
  });

  it("names the whole control as a group", async () => {
    renderWith({ labels: { group: "Date" } });
    await root();
    expect(screen.getByRole("group", { name: "Date" })).toBeTruthy();
  });

  it("drops a kept bound that other filters have left outside the data", async () => {
    // A range from the URL starting before the earliest record: moving To must
    // still search, which it cannot if the stale From goes back with it.
    const log: Request[] = [];
    render(
      <InstantSearch
        searchClient={client(log) as never}
        indexName="records"
        initialUiState={{ records: { range: { year: "-6000:1900" } } }}
      >
        <DateHistogram attribute="year" />
      </InstantSearch>,
    );
    await root();
    const [, upper] = screen.getAllByRole("slider");
    fireEvent.change(upper, { target: { value: "30" } });
    fireEvent.keyUp(upper);
    await waitFor(() => {
      const filters = lastFilters(log);
      expect(filters).toHaveLength(1);
      expect(filters?.[0]).toMatch(/^year<=\d+$/);
    });
  });

  it("keeps the year boxes when a set range leaves nothing to draw", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch
        searchClient={client(log, { "1900": 3 }) as never}
        indexName="records"
        initialUiState={{ records: { range: { year: "1890:1910" } } }}
      >
        <DateHistogram attribute="year" />
      </InstantSearch>,
    );
    await screen.findAllByRole("textbox");
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("renders nothing without a spread of years", async () => {
    const log: Request[] = [];
    const { container } = renderWith({}, log, { "1900": 3 });
    await waitFor(() => expect(log.length).toBeGreaterThan(0));
    expect(container.querySelector(".date-histogram")).toBeNull();
  });
});
