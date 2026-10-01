import { InstantSearch, useRefinementList } from "react-instantsearch";
import { HierarchyList, type HierarchyListProps } from "../../../src/hierarchy-list/index.js";
import "../../../src/hierarchy-list/hierarchy-list.css";

/** Made-up places, each record holding its own path and every ancestor's. */
const place: Record<string, number> = {
  Europe: 9120,
  "Europe > United Kingdom": 5210,
  "Europe > United Kingdom > England": 4380,
  "Europe > United Kingdom > Scotland": 610,
  "Europe > United Kingdom > Wales": 220,
  "Europe > France": 2140,
  "Europe > France > Île-de-France": 1320,
  "Europe > France > Provence": 410,
  "Europe > Italy": 1770,
  "Europe > Italy > Tuscany": 960,
  "Europe > Italy > Lazio": 530,
  Asia: 3840,
  "Asia > Japan": 2210,
  "Asia > Japan > Kyoto": 980,
  "Asia > Japan > Tokyo": 870,
  "Asia > China": 1630,
  "North America": 2410,
  "North America > United States": 2190,
  "North America > Mexico": 220,
  Africa: 860,
  "Africa > Egypt": 640,
  Oceania: 310,
};

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
      facets: { place },
    })),
  }),
};

const Refinement = () => {
  const { items } = useRefinementList({ attribute: "place", limit: 1000 });
  const ticked = items.filter((i) => i.isRefined).map((i) => i.value);
  return <p className="demo-refinement">Refinement: {ticked.join(" OR ") || "none"}</p>;
};

export default function HierarchyDemo(props: Omit<Partial<HierarchyListProps>, "attribute">) {
  return (
    <div className="not-content demo" style={{ maxWidth: 360 }}>
      <InstantSearch searchClient={client as never} indexName="demo">
        <HierarchyList attribute="place" branchLimit={4} {...props} />
        <Refinement />
      </InstantSearch>
    </div>
  );
}
