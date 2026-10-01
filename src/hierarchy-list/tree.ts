import { leafOf, parentOf } from "./paths.js";

/** A path as the refinement list reports it. */
export interface HierarchyItem {
  value: string;
  count: number;
  isRefined: boolean;
}

export interface HierarchyNode extends HierarchyItem {
  name: string;
  children: HierarchyNode[];
  /** A descendant is ticked. */
  refinedBelow: boolean;
}

/** Items arrive sorted by count, so each level's children stay in that order. */
export const treeOf = (items: readonly HierarchyItem[], separator?: string): HierarchyNode[] => {
  const nodes = new Map<string, HierarchyNode>();
  for (const item of items) {
    const name = leafOf(item.value, separator);
    nodes.set(item.value, { ...item, name, children: [], refinedBelow: false });
  }
  const roots: HierarchyNode[] = [];
  for (const node of nodes.values()) {
    const parent = parentOf(node.value, separator);
    if (parent === undefined) roots.push(node);
    // A child whose parent fell outside the limit has nowhere to hang.
    else nodes.get(parent)?.children.push(node);
    if (node.isRefined) {
      for (let p = parent; p !== undefined; p = parentOf(p, separator)) {
        const ancestor = nodes.get(p);
        if (ancestor) ancestor.refinedBelow = true;
      }
    }
  }
  return roots;
};

/** Lower case without accents, so "e" finds "É". */
export const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** The branches holding a node whose name contains `query`, down to the matches. */
export const matching = (nodes: readonly HierarchyNode[], query: string): HierarchyNode[] =>
  nodes.flatMap((node) => {
    const children = matching(node.children, query);
    return children.length || fold(node.name).includes(query) ? [{ ...node, children }] : [];
  });
