// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CurrentRefinementsConnectorParamsItem as Item } from "instantsearch.js/es/connectors/current-refinements/connectCurrentRefinements";
import { InstantSearch, useNumericMenu, useRange } from "react-instantsearch";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadableRefinements } from "./ReadableRefinements.js";
import { readableRefinements } from "./refinements.js";

const item = (attribute: string, refinements: Item["refinements"]): Item => ({
  indexName: "records",
  indexId: "records",
  attribute,
  label: attribute,
  refinements,
  refine: vi.fn(),
});

const labelsOf = (items: Item[]) => items.map((i) => [i.label, i.refinements.map((r) => r.label)]);

const range = () =>
  item("year", [
    { attribute: "year", type: "numeric", operator: ">=", value: 1800, label: "≥ 1800" },
    { attribute: "year", type: "numeric", operator: "<=", value: 1850, label: "≤ 1850" },
  ]);

describe("readableRefinements", () => {
  it("joins a range's bounds into one chip", () => {
    const [out] = readableRefinements({ headings: { year: "Date" } })([range()]);
    expect(labelsOf([out])).toEqual([["Date", ["1800 to 1850"]]]);
  });

  it("clears both bounds in one state change when given setUiState", () => {
    const setUiState = vi.fn();
    const year = range();
    const [out] = readableRefinements({ setUiState })([year]);
    out.refine(out.refinements[0]);
    expect(year.refine).not.toHaveBeenCalled();
    const update = setUiState.mock.calls[0][0];
    expect(
      update({
        records: {
          page: 3,
          range: { year: "1800:1850", width: "1:" },
          numericMenu: { year: "1800:", depth: "2:" },
        },
      }),
    ).toEqual({ records: { range: { width: "1:" }, numericMenu: { depth: "2:" } } });
  });

  it("removes each bound without setUiState", () => {
    const year = range();
    const [out] = readableRefinements()([year]);
    out.refine(out.refinements[0]);
    expect(year.refine).toHaveBeenCalledTimes(2);
  });

  it("names one bound alone, formatted", () => {
    const year = item("year", [
      { attribute: "year", type: "numeric", operator: "<=", value: -500, label: "≤ -500" },
    ]);
    const transform = readableRefinements({
      formatNumber: (n) => (n < 0 ? `${-n} BC` : String(n)),
    });
    expect(labelsOf(transform([year]))).toEqual([["year", ["up to 500 BC"]]]);
  });

  it("reads a flag as Yes, whatever it filters on, and a path as its leaf", () => {
    const transform = readableRefinements({
      flags: ["width", "hasOcr"],
      paths: ["place"],
      labels: { yes: "Oui" },
    });
    const out = transform([
      item("width", [
        { attribute: "width", type: "numeric", operator: ">=", value: 1, label: "≥ 1" },
      ]),
      item("hasOcr", [
        { attribute: "hasOcr", type: "disjunctive", value: "HasOcr", label: "HasOcr" },
      ]),
      item("place", [
        {
          attribute: "place",
          type: "disjunctive",
          value: "Europe > France",
          label: "Europe > France",
        },
      ]),
      item("maker", [{ attribute: "maker", type: "disjunctive", value: "true", label: "true" }]),
    ]);
    expect(labelsOf(out)).toEqual([
      ["width", ["Oui"]],
      ["hasOcr", ["Oui"]],
      ["place", ["France"]],
      ["maker", ["true"]],
    ]);
  });
});

type Request = { params?: { numericFilters?: unknown } };

const client = (log: Request[]) => ({
  search: async (requests: Request[]) => {
    log.push(...requests);
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
        facets: {},
      })),
    };
  },
});

afterEach(cleanup);

/** Mounts the range, which the refinement in the UI state needs. */
const Year = () => {
  useRange({ attribute: "year" });
  return null;
};

describe("ReadableRefinements", () => {
  it("clears a range from its one chip in one search", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch
        searchClient={client(log) as never}
        indexName="records"
        initialUiState={{ records: { range: { year: "1800:1850" } } }}
      >
        <Year />
        <ReadableRefinements headings={{ year: "Date" }} classNames={{ item: "chip" }} />
      </InstantSearch>,
    );
    await screen.findByText("1800 to 1850");
    expect(document.querySelectorAll(".chip")).toHaveLength(1);
    const before = log.length;
    fireEvent.click(document.querySelector(".ais-CurrentRefinements-delete") as HTMLElement);
    await waitFor(() => expect(screen.queryByText("1800 to 1850")).toBeNull());
    expect(log.slice(before).map((r) => r.params?.numericFilters ?? [])).toEqual([[]]);
  });
});

/** A lower bound from a numeric menu, as the dashboard's FacetExists sets one. */
const Width = () => {
  useNumericMenu({
    attribute: "width",
    items: [{ label: "all" }, { label: "Has image", start: 1 }],
  });
  return null;
};

describe("ReadableRefinements on a numeric menu", () => {
  it("clears a bound that is not a flag", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch
        searchClient={client(log) as never}
        indexName="records"
        initialUiState={{ records: { numericMenu: { width: "1:" } } }}
      >
        <Width />
        <ReadableRefinements />
      </InstantSearch>,
    );
    await screen.findByText("from 1");
    const before = log.length;
    fireEvent.click(document.querySelector(".ais-CurrentRefinements-delete") as HTMLElement);
    await waitFor(() => expect(screen.queryByText("from 1")).toBeNull());
    expect(log.slice(before).map((r) => r.params?.numericFilters ?? [])).toEqual([[]]);
  });
});
