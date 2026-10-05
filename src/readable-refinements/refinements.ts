import type { UiState } from "instantsearch.js";
import type {
  CurrentRefinementsConnectorParamsItem as Item,
  CurrentRefinementsConnectorParamsRefinement as Refinement,
} from "instantsearch.js/es/connectors/current-refinements/connectCurrentRefinements";
import { leafOf, PATH_SEPARATOR } from "../hierarchy-list/paths.js";

export interface ReadableRefinementsLabels {
  /** A flag's chip, after its heading. */
  yes: string;
  range: (from: string, to: string) => string;
  from: (from: string) => string;
  upTo: (to: string) => string;
}

export interface ReadableRefinementsOptions {
  /** Each attribute's name on its chips, in place of the attribute itself. */
  headings?: Record<string, string>;
  /**
   * Attributes that are on or off, such as a toggle or an "exists" bound,
   * whose chip reads `yes` whatever value or bound it filters on.
   */
  flags?: readonly string[];
  /** Attributes holding cumulative paths, whose chips name only the leaf. */
  paths?: readonly string[];
  separator?: string;
  /** A range's bounds, such as a year before 0. */
  formatNumber?: (value: number, attribute: string) => string;
  labels?: Partial<ReadableRefinementsLabels>;
  /**
   * The InstantSearch instance's `setUiState`, so a range's chip clears both
   * bounds in one search. Without it each bound is removed on its own, and
   * the first search goes out with half the range.
   */
  setUiState?: (update: (state: UiState) => UiState) => void;
}

const defaultLabels: ReadableRefinementsLabels = {
  yes: "Yes",
  range: (from, to) => `${from} to ${to}`,
  from: (from) => `from ${from}`,
  upTo: (to) => `up to ${to}`,
};

/** Range and numeric menu widgets are the ones that set >= and <= bounds. */
const withoutBounds = (state: UiState, indexId: string, attribute: string): UiState => {
  const { range = {}, numericMenu = {}, page: _page, ...rest } = state[indexId] ?? {};
  const { [attribute]: _range, ...keptRange } = range;
  const { [attribute]: _menu, ...keptMenu } = numericMenu;
  return { ...state, [indexId]: { ...rest, range: keptRange, numericMenu: keptMenu } };
};

/**
 * A `transformItems` for InstantSearch's `CurrentRefinements`, so the chips
 * read as the components that set them. A range's two bounds become one chip,
 * whose `refine` is wrapped to clear both.
 */
export const readableRefinements = ({
  headings = {},
  flags = [],
  paths = [],
  separator = PATH_SEPARATOR,
  formatNumber = (n) => String(n),
  labels: given,
  setUiState,
}: ReadableRefinementsOptions = {}) => {
  const labels = { ...defaultLabels, ...given };
  return (items: Item[]): Item[] =>
    items.map((item) => {
      const relabel = (label: string) => (r: Refinement) => ({ ...r, label });
      const named = { ...item, label: headings[item.attribute] ?? item.label };
      if (flags.includes(item.attribute)) {
        return { ...named, refinements: item.refinements.map(relabel(labels.yes)) };
      }
      if (paths.includes(item.attribute)) {
        const leaf = (r: Refinement) => ({ ...r, label: leafOf(r.label, separator) });
        return { ...named, refinements: item.refinements.map(leaf) };
      }

      const bound = (op: string) =>
        item.refinements.find((r) => r.type === "numeric" && r.operator === op);
      const lower = bound(">=");
      const upper = bound("<=");
      const first = lower ?? upper;
      if (!first) return named;
      const shown = (r: Refinement) => formatNumber(Number(r.value), item.attribute);
      const chip = {
        ...first,
        label:
          lower && upper
            ? labels.range(shown(lower), shown(upper))
            : lower
              ? labels.from(shown(lower))
              : labels.upTo(shown(first)),
      };
      return {
        ...named,
        refinements: item.refinements.flatMap((r) =>
          r === first ? [chip] : r === lower || r === upper ? [] : [r],
        ),
        refine: (r: Refinement) => {
          if (r !== chip) item.refine(r);
          else if (setUiState) setUiState((s) => withoutBounds(s, item.indexId, item.attribute));
          else for (const b of [lower, upper]) if (b) item.refine(b);
        },
      };
    });
};
