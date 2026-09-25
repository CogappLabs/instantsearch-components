// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import instantsearch from "instantsearch.js";
import { InstantSearch } from "react-instantsearch";
import { afterEach, describe, expect, it } from "vitest";
import { FacetToggle } from "./FacetToggle.js";
import { facetToggle } from "./widget.js";

type Request = { params?: { facetFilters?: unknown } };

/** Answers with a boolean facet keyed as Searchkit keys Elasticsearch's. */
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
        facets: { hasImage: { "1": 1234, "0": 56 } },
      })),
    };
  },
});

const lastFacetFilters = (log: Request[]) =>
  log
    .map((r) => r.params?.facetFilters)
    .filter(Boolean)
    .at(-1);

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("FacetToggle", () => {
  it("counts from the 1 bucket and filters on true", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch searchClient={client(log) as never} indexName="records">
        <FacetToggle attribute="hasImage" label="Has image" />
      </InstantSearch>,
    );
    const box = await screen.findByRole("checkbox", { name: /Has image/ });
    await waitFor(() =>
      expect(document.querySelector(".facet-toggle-count")?.textContent).toBe("1,234"),
    );
    fireEvent.click(box);
    await waitFor(() => expect(JSON.stringify(lastFacetFilters(log))).toContain("hasImage:true"));
  });
});

describe("facetToggle widget", () => {
  it("counts from the 1 bucket and filters on true", async () => {
    const log: Request[] = [];
    const container = document.createElement("div");
    document.body.append(container);
    const search = instantsearch({ indexName: "records", searchClient: client(log) as never });
    search.addWidgets([facetToggle({ container, attribute: "hasImage", label: "Has image" })]);
    search.start();
    await waitFor(() =>
      expect(container.querySelector(".facet-toggle-count")?.textContent).toBe("1,234"),
    );
    fireEvent.click(container.querySelector("input") as HTMLInputElement);
    await waitFor(() => expect(JSON.stringify(lastFacetFilters(log))).toContain("hasImage:true"));
    search.dispose();
  });

  it("says when its container is missing", () => {
    expect(() => facetToggle({ container: "#nope", attribute: "a", label: "A" })).toThrow(
      /no element matches "#nope"/,
    );
  });
});
