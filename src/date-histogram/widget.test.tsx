// @vitest-environment jsdom
import { fireEvent, waitFor } from "@testing-library/react";
import instantsearch from "instantsearch.js";
import { afterEach, describe, expect, it } from "vitest";
import { dateHistogram } from "./widget.js";

const counts: Record<string, number> = { "-500": 2 };
for (let y = 1600; y <= 2020; y++) counts[y] = 10;

type Request = { params?: { numericFilters?: string[] } };

const client = (log: Request[]) => ({
  search: async (requests: Request[]) => {
    log.push(...requests);
    const years = Object.keys(counts).map(Number);
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
        facets: { year: counts },
        facets_stats: {
          year: { min: Math.min(...years), max: Math.max(...years), avg: 0, sum: 0 },
        },
      })),
    };
  },
});

let search: ReturnType<typeof instantsearch> | undefined;
afterEach(() => {
  search?.dispose();
  document.body.innerHTML = "";
});

const start = (log: Request[] = []) => {
  const container = document.createElement("div");
  document.body.append(container);
  search = instantsearch({ indexName: "records", searchClient: client(log) as never });
  search.addWidgets([dateHistogram({ container, attribute: "year", labels: { group: "Date" } })]);
  search.start();
  return container;
};

describe("dateHistogram widget", () => {
  it("renders the histogram into its container", async () => {
    const container = start();
    await waitFor(() => expect(container.querySelectorAll("rect").length).toBe(40));
    expect(container.querySelector("fieldset")?.getAttribute("aria-label")).toBe("Date");
  });

  it("filters on typed years", async () => {
    const log: Request[] = [];
    const container = start(log);
    await waitFor(() => expect(container.querySelector("form")).not.toBeNull());
    const [from, to] = container.querySelectorAll<HTMLInputElement>("form input");
    fireEvent.change(from, { target: { value: "1800" } });
    fireEvent.change(to, { target: { value: "1850" } });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() =>
      expect(
        log
          .map((r) => r.params?.numericFilters)
          .filter(Boolean)
          .at(-1),
      ).toEqual(["year>=1800", "year<=1850"]),
    );
  });

  it("finds its container by selector, and says when it cannot", () => {
    expect(() => dateHistogram({ container: "#missing", attribute: "year" })).toThrow(
      /no element matches "#missing"/,
    );
  });

  it("empties its container when removed", async () => {
    const container = start();
    await waitFor(() => expect(container.querySelector("fieldset")).not.toBeNull());
    search?.dispose();
    search = undefined;
    await waitFor(() => expect(container.innerHTML).toBe(""));
  });
});
