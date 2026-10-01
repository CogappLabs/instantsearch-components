import { describe, expect, it } from "vitest";
import { fold, matching, treeOf } from "./tree.js";

const item = (value: string, isRefined = false) => ({ value, count: 1, isRefined });

describe("treeOf", () => {
  it("hangs each path under its parent, in the order given", () => {
    const [europe] = treeOf([item("Europe"), item("Europe > Italy"), item("Europe > France")]);
    expect(europe.children.map((n) => n.name)).toEqual(["Italy", "France"]);
  });

  it("marks every ancestor of a ticked path", () => {
    const [europe] = treeOf([
      item("Europe"),
      item("Europe > France"),
      item("Europe > France > Paris", true),
    ]);
    expect(europe.refinedBelow).toBe(true);
    expect(europe.children[0].refinedBelow).toBe(true);
    expect(europe.children[0].children[0].refinedBelow).toBe(false);
  });

  it("drops a path whose parent is missing", () => {
    expect(treeOf([item("Asia"), item("Europe > France")]).map((n) => n.name)).toEqual(["Asia"]);
  });
});

describe("matching", () => {
  it("keeps the branches down to a match, ignoring accents", () => {
    const tree = treeOf([
      item("Europe"),
      item("Europe > Île-de-France"),
      item("Europe > Italy"),
      item("Asia"),
    ]);
    const [europe, ...rest] = matching(tree, fold("ile"));
    expect(rest).toEqual([]);
    expect(europe.children.map((n) => n.name)).toEqual(["Île-de-France"]);
  });
});
