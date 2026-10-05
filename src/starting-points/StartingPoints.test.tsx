// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import instantsearch from "instantsearch.js";
import { pagination, refinementList, searchBox } from "instantsearch.js/es/widgets";
import { InstantSearch, Pagination, SearchBox, useRefinementList } from "react-instantsearch";
import { afterEach, describe, expect, it } from "vitest";
import { StartingPoints } from "./StartingPoints.js";
import type { StartingPoint } from "./StartingPointsView.js";
import { startingPoints } from "./widget.js";

type Request = { params?: { facetFilters?: unknown; page?: number } };

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
        facets: { place: { Japan: 4, France: 2 } },
      })),
    };
  },
});

const items: StartingPoint[] = [
  { title: "Japan", text: "Prints and ceramics.", state: { refinementList: { place: ["Japan"] } } },
  { title: "Curated", href: "/curated" },
];

const facetSearched = (log: Request[], filter: string) =>
  log.some((r) => JSON.stringify(r.params?.facetFilters ?? []).includes(filter));

const Place = () => {
  useRefinementList({ attribute: "place" });
  return null;
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("StartingPoints", () => {
  it("starts a search from a card, then hides", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch searchClient={client(log) as never} indexName="records">
        <Place />
        <StartingPoints items={items} heading="Start here" classNames={{ card: "theme-card" }} />
      </InstantSearch>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /Japan/ }));
    await waitFor(() => expect(facetSearched(log, "place:Japan")).toBe(true));
    await waitFor(() => expect(screen.queryByText("Start here")).toBeNull());
  });

  it("starts its search on the first page", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch
        searchClient={client(log) as never}
        indexName="records"
        initialUiState={{ records: { page: 3 } }}
      >
        <Place />
        <Pagination />
        <StartingPoints items={items} />
      </InstantSearch>,
    );
    await waitFor(() => expect(log.some((r) => r.params?.page === 2)).toBe(true));
    fireEvent.click(await screen.findByRole("button", { name: /Japan/ }));
    await waitFor(() => expect(facetSearched(log, "place:Japan")).toBe(true));
    const japan = log.filter((r) => JSON.stringify(r.params?.facetFilters ?? []).includes("Japan"));
    expect(japan.every((r) => !r.params?.page)).toBe(true);
  });

  it("shows a card's count, formatted", async () => {
    render(
      <InstantSearch searchClient={client([]) as never} indexName="records">
        <StartingPoints
          items={[
            { title: "Japan", count: 1204, state: {} },
            { title: "One", count: 1, state: {} },
            { title: "None", state: {} },
          ]}
        />
      </InstantSearch>,
    );
    await screen.findByRole("button", { name: /Japan/ });
    const counts = [...document.querySelectorAll(".starting-points-count")].map(
      (c) => c.textContent,
    );
    expect(counts).toEqual(["1,204 records", "1 record"]);
    cleanup();
    render(
      <InstantSearch searchClient={client([]) as never} indexName="records">
        <StartingPoints
          items={[{ title: "Japan", count: 1204, state: {} }]}
          formatCount={(n) => `${n} Objekte`}
        />
      </InstantSearch>,
    );
    expect((await screen.findByText("1204 Objekte")).className).toBe("starting-points-count");
  });

  it("links out from a card with an href", async () => {
    render(
      <InstantSearch searchClient={client([]) as never} indexName="records">
        <StartingPoints items={items} />
      </InstantSearch>,
    );
    const link = await screen.findByRole("link", { name: "Curated" });
    expect(link.getAttribute("href")).toBe("/curated");
    expect(link.className).toBe("starting-points-card");
  });

  it("hides while there is a query", async () => {
    render(
      <InstantSearch searchClient={client([]) as never} indexName="records">
        <SearchBox />
        <StartingPoints items={items} />
      </InstantSearch>,
    );
    await screen.findByRole("button", { name: /Japan/ });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "vase" } });
    await waitFor(() => expect(screen.queryByRole("button", { name: /Japan/ })).toBeNull());
  });
});

describe("startingPoints widget", () => {
  it("starts a search on the first page, hides, and comes back when cleared", async () => {
    const log: Request[] = [];
    const container = document.createElement("div");
    const facet = document.createElement("div");
    const box = document.createElement("div");
    document.body.append(container, facet, box);
    const search = instantsearch({ indexName: "records", searchClient: client(log) as never });
    const pages = document.createElement("div");
    document.body.append(pages);
    search.addWidgets([
      refinementList({ container: facet, attribute: "place" }),
      searchBox({ container: box }),
      pagination({ container: pages }),
      startingPoints({ container, items }),
    ]);
    search.start();
    search.setUiState({ records: { page: 3 } });
    await waitFor(() => expect(log.some((r) => r.params?.page === 2)).toBe(true));
    await waitFor(() => expect(container.querySelector("button")).not.toBeNull());
    fireEvent.click(container.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(facetSearched(log, "place:Japan")).toBe(true));
    const japan = log.filter((r) => JSON.stringify(r.params?.facetFilters ?? []).includes("Japan"));
    expect(japan.every((r) => !r.params?.page)).toBe(true);
    await waitFor(() => expect(container.querySelector("button")).toBeNull());
    search.setUiState({ records: {} });
    await waitFor(() => expect(container.querySelector("button")).not.toBeNull());
    search.dispose();
  });

  it("says when its container is missing", () => {
    expect(() => startingPoints({ container: "#nope", items })).toThrow(
      /no element matches "#nope"/,
    );
  });
});
