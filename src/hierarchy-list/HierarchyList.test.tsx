// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import instantsearch from "instantsearch.js";
import { InstantSearch } from "react-instantsearch";
import { afterEach, describe, expect, it } from "vitest";
import { HierarchyList } from "./HierarchyList.js";
import { hierarchyList } from "./widget.js";

type Request = { params?: { facetFilters?: unknown } };

const place = {
  Europe: 30,
  "Europe > France": 20,
  "Europe > France > Paris": 12,
  "Europe > Italy": 10,
  Asia: 5,
};

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
        facets: { place },
      })),
    };
  },
});

const lastFacetFilters = (log: Request[]) =>
  JSON.stringify(
    log
      .map((r) => r.params?.facetFilters)
      .filter(Boolean)
      .at(-1) ?? [],
  );

/** Opens Europe, ticks it, then ticks France: France replaces Europe. */
const narrow = async (scope: HTMLElement, log: Request[]) => {
  const europe = await waitFor(() => {
    const box = scope.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (!box) throw new Error("no checkbox yet");
    return box;
  });
  fireEvent.click(europe);
  await waitFor(() => expect(lastFacetFilters(log)).toContain("place:Europe"));
  const france = await waitFor(() => {
    const label = [...scope.querySelectorAll("label")].find((l) =>
      l.textContent?.includes("France"),
    );
    if (!label) throw new Error("France not shown");
    return label.querySelector("input") as HTMLInputElement;
  });
  fireEvent.click(france);
  await waitFor(() => expect(lastFacetFilters(log)).toContain("place:Europe > France"));
  expect(lastFacetFilters(log)).not.toContain('"place:Europe"');
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("HierarchyList", () => {
  it("nests the paths and narrows a ticked parent to its child", async () => {
    const log: Request[] = [];
    const { container } = render(
      <InstantSearch searchClient={client(log) as never} indexName="records">
        <HierarchyList attribute="place" />
      </InstantSearch>,
    );
    await screen.findByRole("button", { name: "Within Europe" });
    expect(screen.queryByText("Paris")).toBeNull();
    await narrow(container, log);
    // Ticked France keeps its branch open and Europe shows it as mixed.
    await waitFor(() =>
      expect(
        (screen.getByRole("checkbox", { name: /Europe/ }) as HTMLInputElement).indeterminate,
      ).toBe(true),
    );
  });
});

describe("hierarchyList widget", () => {
  it("narrows a ticked parent to its child", async () => {
    const log: Request[] = [];
    const container = document.createElement("div");
    document.body.append(container);
    const search = instantsearch({ indexName: "records", searchClient: client(log) as never });
    search.addWidgets([hierarchyList({ container, attribute: "place" })]);
    search.start();
    await narrow(container, log);
    search.dispose();
  });

  it("says when its container is missing", () => {
    expect(() => hierarchyList({ container: "#nope", attribute: "a" })).toThrow(
      /no element matches "#nope"/,
    );
  });
});
