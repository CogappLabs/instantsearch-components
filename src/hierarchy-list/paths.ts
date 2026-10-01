/** Cumulative hierarchy paths, `Europe > France > Paris`, root first. */
import type { IndexUiState } from "instantsearch.js";

export const PATH_SEPARATOR = " > ";

/** The last step of a path, which names the node itself. */
export const leafOf = (path: string, separator = PATH_SEPARATOR): string => {
  const at = path.lastIndexOf(separator);
  return at === -1 ? path : path.slice(at + separator.length);
};

/** The path one level up, or undefined at the root. */
export const parentOf = (path: string, separator = PATH_SEPARATOR): string | undefined => {
  const at = path.lastIndexOf(separator);
  return at === -1 ? undefined : path.slice(0, at);
};

/**
 * The ticked paths after toggling one. Ticked paths never overlap: they are
 * ORed, so a path ticked beside its own ancestor adds nothing. Ticking one
 * replaces any ticked ancestor, narrowing, or ticked descendants, widening.
 */
export const withToggled = (
  ticked: readonly string[],
  path: string,
  separator = PATH_SEPARATOR,
): string[] => {
  if (ticked.includes(path)) return ticked.filter((p) => p !== path);
  const overlaps = (p: string) =>
    p.startsWith(`${path}${separator}`) || path.startsWith(`${p}${separator}`);
  return [...ticked.filter((p) => !overlaps(p)), path];
};

/**
 * `withToggled` applied to one attribute's refinements, for
 * `setIndexUiState`. One state change rather than a refine per path, so it
 * sends one search; the page resets, as any refine's would.
 */
export const toggledIn =
  (attribute: string, path: string, separator = PATH_SEPARATOR) =>
  (state: IndexUiState): IndexUiState => ({
    ...state,
    page: undefined,
    refinementList: {
      ...state.refinementList,
      [attribute]: withToggled(state.refinementList?.[attribute] ?? [], path, separator),
    },
  });
