import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * The cdn/ builds on the three kinds of page they are for, each loading its
 * libraries from their real CDNs. Local files are served from a made-up
 * origin, so no server runs.
 */
const ORIGIN = "http://components.test";
const ROOT = join(import.meta.dirname, "..");
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

const pages = [
  { name: "React 18 as script tags", file: "react-18.html" },
  { name: "React 19 as ES modules", file: "react-19.html" },
  { name: "InstantSearch.js", file: "instantsearch-js.html" },
  { name: "InstantSearch.js, loaded after our script", file: "instantsearch-js-first.html" },
  { name: "InstantSearch.js, with a site's input styles", file: "instantsearch-js-hostile.html" },
];

const open = async (page: Page, file: string) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    const local = path.startsWith("/cdn/") ? join(ROOT, path) : join(ROOT, "e2e", path);
    return route.fulfill({
      body: readFileSync(local),
      contentType: TYPES[extname(local)] ?? "application/octet-stream",
    });
  });
  await page.goto(`${ORIGIN}/pages/${file}`);
  await expect(page.getByRole("group", { name: "Date" })).toBeVisible();
  return errors;
};

/** The numeric filters of the latest search that carried any. */
const lastFilters = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { searches: string[][] }).searches.filter((f) => f.length).at(-1),
  );

for (const { name, file } of pages) {
  test.describe(name, () => {
    test("draws the histogram", async ({ page }) => {
      const errors = await open(page, file);
      await expect(page.locator(".date-histogram-bars rect")).toHaveCount(40);
      await expect(page.locator(".date-histogram-ticks")).toContainText("before 1600");
      expect(errors).toEqual([]);
    });

    test("filters on typed years", async ({ page }) => {
      await open(page, file);
      const boxes = page.locator(".date-histogram-form input");
      await boxes.nth(0).fill("1800");
      await boxes.nth(1).fill("1850");
      await page.getByRole("button", { name: "Apply" }).click();
      await expect.poll(() => lastFilters(page)).toEqual(["year>=1800", "year<=1850"]);
      await expect(page.locator("rect[data-selected]")).not.toHaveCount(40);
    });

    test("runs the handles the full width of the bars", async ({ page }) => {
      await open(page, file);
      // A handle's track spans its input's content box; the bars are inset by
      // half a handle, so the two only line up when the input has no padding
      // or border of its own.
      const box = await page.getByRole("slider", { name: "From" }).evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.paddingLeft, s.paddingRight, s.borderLeftWidth, s.borderRightWidth, s.marginLeft];
      });
      expect(box).toEqual(["0px", "0px", "0px", "0px", "0px"]);
      const [input, bars] = await Promise.all([
        page.getByRole("slider", { name: "From" }).boundingBox(),
        page.locator(".date-histogram-bars").boundingBox(),
      ]);
      expect(input?.x).toBeCloseTo(bars?.x ?? 0, 0);
      expect(input?.width).toBeCloseTo(bars?.width ?? 0, 0);
    });

    test("counts and filters a boolean toggle", async ({ page }) => {
      await open(page, file);
      await expect(page.locator(".facet-toggle-count")).toHaveText("1,234");
      await page.getByRole("checkbox", { name: /Has image/ }).check();
      // InstantSearch follows with a query without the toggle's own filter, for
      // its counts, so look for the filter in any query rather than the last.
      await expect
        .poll(() =>
          page.evaluate(() =>
            (window as unknown as { facetSearches: string[] }).facetSearches.some((f) =>
              f.includes("hasImage:true"),
            ),
          ),
        )
        .toBe(true);
      await expect(page.locator(".facet-toggle-count")).toHaveText("1,234");
    });

    test("filters from a handle moved by keyboard", async ({ page }) => {
      await open(page, file);
      const to = page.getByRole("slider", { name: "To" });
      await to.focus();
      await to.press("ArrowLeft");
      await expect.poll(() => lastFilters(page)).toEqual([expect.stringMatching(/^year<=\d+$/)]);
    });
  });
}
