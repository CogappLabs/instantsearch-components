import { InstantSearch, useToggleRefinement } from "react-instantsearch";
import { FacetToggle, type FacetToggleProps } from "../../../src/facet-toggle/index.js";
import "../../../src/facet-toggle/facet-toggle.css";

/**
 * A search client whose boolean facet is keyed as Searchkit keys an
 * Elasticsearch boolean: `1` and `0`, not `true` and `false`.
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
      facets: { has_image: { "1": 12467, "0": 3201 }, on_view: { "1": 842, "0": 14826 } },
    })),
  }),
};

const Refinement = ({ attribute }: { attribute: string }) => {
  const { value } = useToggleRefinement({ attribute });
  return (
    <p className="demo-refinement">Refinement: {value.isRefined ? `${attribute}:true` : "none"}</p>
  );
};

export default function ToggleDemo(props: Omit<Partial<FacetToggleProps>, "attribute">) {
  return (
    <div className="not-content demo">
      <InstantSearch searchClient={client as never} indexName="demo">
        <FacetToggle attribute="has_image" label="Has image" {...props} />
        <Refinement attribute="has_image" />
      </InstantSearch>
    </div>
  );
}
