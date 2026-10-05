import {
  InstantSearch,
  useClearRefinements,
  useRefinementList,
  useToggleRefinement,
} from "react-instantsearch";
import { type StartingPoint, StartingPoints } from "../../../src/starting-points/index.js";
import "../../../src/starting-points/starting-points.css";

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
      facets: {
        place: { "Asia > Japan": 2210, "Europe > Italy": 1770 },
        has_image: { "1": 12467, "0": 3201 },
      },
    })),
  }),
};

const items: StartingPoint[] = [
  {
    title: "Japan",
    count: 2210,
    text: "Woodblock prints, ceramics and lacquer.",
    state: { refinementList: { place: ["Asia > Japan"] } },
  },
  {
    title: "Italy",
    count: 1770,
    text: "From Roman coins to Renaissance drawings.",
    state: { refinementList: { place: ["Europe > Italy"] } },
  },
  {
    title: "With images",
    count: 12467,
    text: "Only the records you can see.",
    state: { toggle: { has_image: true } },
  },
];

/** The facets the cards refine, mounted so their UI state is applied. */
const Refinement = () => {
  const { items: places } = useRefinementList({ attribute: "place" });
  const { value } = useToggleRefinement({ attribute: "has_image" });
  const { canRefine, refine } = useClearRefinements();
  const ticked = places.filter((i) => i.isRefined).map((i) => i.value);
  if (value.isRefined) ticked.push("has_image:true");
  return (
    <p className="demo-refinement">
      Refinement: {ticked.join(", ") || "none"}{" "}
      {canRefine ? (
        <button type="button" onClick={refine}>
          Start over
        </button>
      ) : null}
    </p>
  );
};

export default function StartingPointsDemo() {
  return (
    <div className="not-content demo">
      <InstantSearch searchClient={client as never} indexName="demo">
        <StartingPoints items={items} heading="Start exploring" />
        <Refinement />
      </InstantSearch>
    </div>
  );
}
