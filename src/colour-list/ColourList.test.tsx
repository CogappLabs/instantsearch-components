// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import instantsearch from "instantsearch.js";
import { InstantSearch } from "react-instantsearch";
import { afterEach, describe, expect, it } from "vitest";
import { ColourList } from "./ColourList.js";
import { colourList } from "./widget.js";

type Request = { params?: { facetFilters?: unknown } };

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
        facets: { colour: { Navy: 12, red: 9, Unknown: 2 } },
      })),
    };
  },
});

const facetSearched = (log: Request[], filter: string) =>
  log.some((r) => JSON.stringify(r.params?.facetFilters ?? []).includes(filter));

const swatch = (root: ParentNode, name: string) =>
  [...root.querySelectorAll<HTMLElement>(".colour-list-item")]
    .find((el) => el.textContent?.includes(name))
    ?.querySelector<HTMLElement>(".colour-list-swatch");

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ColourList", () => {
  it("paints each swatch from the map or the name, and filters on a tick", async () => {
    const log: Request[] = [];
    render(
      <InstantSearch searchClient={client(log) as never} indexName="records">
        <ColourList attribute="colour" colours={{ Navy: "#000080" }} />
      </InstantSearch>,
    );
    const navy = await screen.findByRole("checkbox", { name: /Navy/ });
    expect(swatch(document, "Navy")?.style.backgroundColor).toBe("rgb(0, 0, 128)");
    expect(swatch(document, "red")?.style.backgroundColor).toBe("red");
    expect(swatch(document, "Unknown")?.style.backgroundColor).toBe("");
    fireEvent.click(navy);
    await waitFor(() => expect(facetSearched(log, "colour:Navy")).toBe(true));
    await waitFor(() => expect((navy as HTMLInputElement).checked).toBe(true));
  });
});

describe("colourList widget", () => {
  it("paints the swatches and filters on a tick", async () => {
    const log: Request[] = [];
    const container = document.createElement("div");
    document.body.append(container);
    const search = instantsearch({ indexName: "records", searchClient: client(log) as never });
    search.addWidgets([
      colourList({ container, attribute: "colour", colours: { Navy: "#000080" } }),
    ]);
    search.start();
    await waitFor(() =>
      expect(swatch(container, "Navy")?.style.backgroundColor).toBe("rgb(0, 0, 128)"),
    );
    fireEvent.click(container.querySelector("input") as HTMLInputElement);
    await waitFor(() => expect(facetSearched(log, "colour:Navy")).toBe(true));
    search.dispose();
  });

  it("says when its container is missing", () => {
    expect(() => colourList({ container: "#nope", attribute: "a" })).toThrow(
      /no element matches "#nope"/,
    );
  });
});
