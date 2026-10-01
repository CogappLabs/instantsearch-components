import { useState } from "react";
import { PATH_SEPARATOR } from "./paths.js";
import { fold, type HierarchyItem, type HierarchyNode, matching, treeOf } from "./tree.js";

/** Every path at every level, which the tree needs whole. */
export const PATH_LIMIT = 1000;

export interface HierarchyListLabels {
  /** The search box's accessible name. */
  search: string;
  showMore: string;
  showLess: string;
  noMatches: string;
  /** The accessible name of a node's open/close button. */
  expand: (name: string) => string;
}

/**
 * Classes added beside the component's own, as InstantSearch's widgets take
 * `classNames`, so the search box and "Show more" can match a theme's.
 */
export interface HierarchyListClassNames {
  searchForm: string;
  searchInput: string;
  showMore: string;
}

export interface HierarchyListProps {
  /** An attribute holding every cumulative path of a record, ancestors too. */
  attribute: string;
  separator?: string;
  /** Paths asked for, which must cover every level; past it the rarest drop out. */
  valueLimit?: number;
  /** Nodes shown per branch before "Show more". */
  branchLimit?: number;
  formatCount?: (count: number) => string;
  labels?: Partial<HierarchyListLabels>;
  classNames?: Partial<HierarchyListClassNames>;
  /** Added to the root, beside `hierarchy-list`, to theme one instance. */
  className?: string;
}

const defaultLabels: HierarchyListLabels = {
  search: "Search",
  showMore: "Show more",
  showLess: "Show less",
  noMatches: "No matches",
  expand: (name) => `Within ${name}`,
};

const withClass = (own: string, extra?: string) => (extra ? `${own} ${extra}` : own);

/** A fixed locale, so server and client render the same digits. */
const englishCount = new Intl.NumberFormat("en");

interface LevelProps {
  nodes: HierarchyNode[];
  onToggle: (path: string) => void;
  opened: Map<string, boolean>;
  setOpen: (path: string, open: boolean) => void;
  searching: boolean;
  branchLimit: number;
  formatCount: (count: number) => string;
  labels: HierarchyListLabels;
  showMoreClass: string;
}

const Level = (props: LevelProps) => {
  const {
    nodes,
    onToggle,
    opened,
    setOpen,
    searching,
    branchLimit,
    formatCount,
    labels,
    showMoreClass,
  } = props;
  const [showAll, setShowAll] = useState(false);
  // A ticked node past the limit stays in view, so a selection is never hidden.
  const shown = showAll
    ? nodes
    : nodes.filter((n, i) => i < branchLimit || n.isRefined || n.refinedBelow);

  return (
    <>
      <ul className="hierarchy-list-level">
        {shown.map((node) => {
          // A ticked descendant keeps its branch open until the user closes it.
          // A search opens every branch it kept, which holds only matches.
          const open = searching || (opened.get(node.value) ?? node.refinedBelow);
          const branch = node.children.length > 0;
          return (
            <li key={node.value} className="hierarchy-list-item">
              <div className="hierarchy-list-row">
                <label className="hierarchy-list-label">
                  <input
                    type="checkbox"
                    checked={node.isRefined}
                    // A ticked node inside a branch marks every ancestor
                    // "mixed", which a collapsed branch would otherwise hide.
                    ref={(el) => {
                      if (el) el.indeterminate = node.refinedBelow && !node.isRefined;
                    }}
                    onChange={() => {
                      if (!node.isRefined && branch) setOpen(node.value, true);
                      onToggle(node.value);
                    }}
                  />
                  <span className="hierarchy-list-name">{node.name}</span>
                  <span className="hierarchy-list-count">{formatCount(node.count)}</span>
                </label>
                {branch && !searching ? (
                  <button
                    type="button"
                    className="hierarchy-list-expand"
                    onClick={() => setOpen(node.value, !open)}
                    aria-expanded={open}
                    aria-label={labels.expand(node.name)}
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16">
                      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                ) : null}
              </div>
              {open && branch ? (
                <div className="hierarchy-list-children">
                  <Level {...props} nodes={node.children} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {showAll || shown.length < nodes.length ? (
        <button type="button" className={showMoreClass} onClick={() => setShowAll((v) => !v)}>
          {showAll ? labels.showLess : labels.showMore}
        </button>
      ) : null}
    </>
  );
};

/**
 * A hierarchical facet as nested checkboxes, any number ticked at once. The
 * view alone: `HierarchyList` feeds it from React InstantSearch,
 * `hierarchyList` from InstantSearch.js.
 *
 * Ticking a node and one of its children is redundant, as the paths are
 * ORed, so `withToggled` keeps the ticked paths from overlapping.
 */
export const HierarchyListView = ({
  items,
  onToggle,
  separator = PATH_SEPARATOR,
  branchLimit = 8,
  formatCount = (n) => englishCount.format(n),
  labels: labelProps,
  classNames = {},
  className,
}: Omit<HierarchyListProps, "attribute" | "valueLimit"> & {
  items: readonly HierarchyItem[];
  onToggle: (path: string) => void;
}) => {
  const labels = { ...defaultLabels, ...labelProps };
  const [opened, setOpened] = useState(() => new Map<string, boolean>());
  const setOpen = (path: string, open: boolean) =>
    setOpened((prev) => new Map(prev).set(path, open));
  const [query, setQuery] = useState("");
  const folded = fold(query.trim());
  const tree = treeOf(items, separator);
  const nodes = folded ? matching(tree, folded) : tree;

  return (
    <div className={withClass("hierarchy-list", className)}>
      {items.length > branchLimit || query ? (
        <form
          className={withClass("hierarchy-list-search-form", classNames.searchForm)}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="search"
            className={withClass("hierarchy-list-search", classNames.searchInput)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={labels.search}
          />
        </form>
      ) : null}
      {nodes.length ? (
        <Level
          nodes={nodes}
          onToggle={onToggle}
          opened={opened}
          setOpen={setOpen}
          searching={!!folded}
          branchLimit={branchLimit}
          formatCount={formatCount}
          labels={labels}
          showMoreClass={withClass("hierarchy-list-more", classNames.showMore)}
        />
      ) : (
        <p className="hierarchy-list-empty" role="status">
          {labels.noMatches}
        </p>
      )}
    </div>
  );
};
