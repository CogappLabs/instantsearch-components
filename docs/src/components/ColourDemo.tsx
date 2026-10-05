import { InstantSearch, useRefinementList } from "react-instantsearch";
import { ColourList, type ColourListProps } from "../../../src/colour-list/index.js";
import "../../../src/colour-list/colour-list.css";

/** Made-up colour counts. "Mixed" has no colour, to show the empty swatch. */
const colour = {
  Blue: 3120,
  Red: 2480,
  Ochre: 1410,
  Green: 1290,
  Black: 980,
  White: 760,
  Indigo: 540,
  Mixed: 220,
};

const colours = { Ochre: "#cc7722", Indigo: "#3f2b7a" };

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
      facets: { colour },
    })),
  }),
};

const Refinement = () => {
  const { items } = useRefinementList({ attribute: "colour", limit: 20 });
  const ticked = items.filter((i) => i.isRefined).map((i) => i.value);
  return <p className="demo-refinement">Refinement: {ticked.join(" OR ") || "none"}</p>;
};

export default function ColourDemo(props: Omit<Partial<ColourListProps>, "attribute">) {
  return (
    <div className="not-content demo" style={{ maxWidth: 480 }}>
      <InstantSearch searchClient={client as never} indexName="demo">
        <ColourList attribute="colour" colours={colours} {...props} />
        <Refinement />
      </InstantSearch>
    </div>
  );
}
