import { describe, expect, it } from "vitest";
import { leafOf, parentOf, toggledIn, withToggled } from "./paths.js";

describe("withToggled", () => {
  it("unticks a ticked path", () => {
    expect(withToggled(["Oceania > New Zealand"], "Oceania > New Zealand")).toEqual([]);
  });

  it("narrows a ticked parent to the child", () => {
    expect(withToggled(["Oceania > New Zealand"], "Oceania > New Zealand > Auckland")).toEqual([
      "Oceania > New Zealand > Auckland",
    ]);
  });

  it("widens ticked children to the parent", () => {
    expect(
      withToggled(
        ["Oceania > New Zealand > Auckland", "Oceania > New Zealand > Wellington", "Europe"],
        "Oceania > New Zealand",
      ),
    ).toEqual(["Europe", "Oceania > New Zealand"]);
  });

  it("does not treat a shared name prefix as a parent", () => {
    expect(withToggled(["Europe > France"], "Europe > France, Paris")).toEqual([
      "Europe > France",
      "Europe > France, Paris",
    ]);
  });

  it("takes another separator", () => {
    expect(withToggled(["Europe/France"], "Europe", "/")).toEqual(["Europe"]);
  });
});

describe("leafOf and parentOf", () => {
  it("split at the last separator", () => {
    expect(leafOf("Europe > France > Paris")).toBe("Paris");
    expect(parentOf("Europe > France > Paris")).toBe("Europe > France");
    expect(parentOf("Europe")).toBeUndefined();
  });
});

describe("toggledIn", () => {
  it("resets the page and leaves other attributes alone", () => {
    const state = toggledIn("place", "Europe")({ page: 4, refinementList: { type: ["Print"] } });
    expect(state).toEqual({
      page: undefined,
      refinementList: { type: ["Print"], place: ["Europe"] },
    });
  });
});
