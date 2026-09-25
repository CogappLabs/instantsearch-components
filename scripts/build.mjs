// Node rather than rm and cp, so the build that runs on a git install also
// runs under cmd.exe.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

rmSync("dist", { recursive: true, force: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"], {
  stdio: "inherit",
});

// Each component's stylesheet ships beside its code, with an empty
// declaration so `import "…/x.css"` typechecks without a bundler's own.
const stylesheets = [];
for (const dir of readdirSync("src", { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  for (const file of readdirSync(join("src", dir.name))) {
    if (!file.endsWith(".css")) continue;
    cpSync(join("src", dir.name, file), join("dist", dir.name, file));
    writeFileSync(join("dist", dir.name, `${file}.d.ts`), "export {};\n");
    stylesheets.push(join("src", dir.name, file));
  }
}

// The script-tag builds in cdn/, committed so jsDelivr can serve them from a
// tag. Each reads what the page loaded as globals rather than bundling it.
const pageGlobals = (globals) => ({
  name: "page-globals",
  setup(b) {
    const escaped = Object.keys(globals).map((k) => k.replace(/[/.]/g, "\\$&"));
    const filter = new RegExp(`^(${escaped.join("|")})$`);
    b.onResolve({ filter }, (args) => ({ path: args.path, namespace: "page-globals" }));
    b.onLoad({ filter: /.*/, namespace: "page-globals" }, (args) => ({
      contents: globals[args.path],
      loader: "js",
    }));
  },
});
const shared = {
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
  banner: { js: `/* @cogapplabs/instantsearch-components ${version()} | MIT */` },
};
rmSync("cdn", { recursive: true, force: true });
mkdirSync("cdn");

// InstantSearch.js pages: the connectors come from the page's `instantsearch`
// global, and the view renders with Preact in place of React.
await build({
  ...shared,
  entryPoints: ["src/cdn-instantsearch-js.ts"],
  outfile: "cdn/instantsearch-js.min.js",
  alias: {
    react: "preact/compat",
    "react-dom/client": "preact/compat/client",
    "react/jsx-runtime": "preact/jsx-runtime",
  },
  plugins: [
    pageGlobals({
      // Read when a widget is created rather than when this script runs, so it
      // works in whichever order the page loads it and instantsearch.js.
      "instantsearch.js/es/connectors": `
        const connectors = () => {
          const found = window.instantsearch && window.instantsearch.connectors;
          if (!found) {
            throw new Error("CogappInstantSearch: load instantsearch.js before creating a widget");
          }
          return found;
        };
        export const connectRange = (...args) => connectors().connectRange(...args);
        export const connectRefinementList = (...args) =>
          connectors().connectRefinementList(...args);
        export const connectToggleRefinement = (...args) =>
          connectors().connectToggleRefinement(...args);`,
    }),
  ],
});

// React pages: React and React InstantSearch are the page's UMD globals.
// Neither ships a JSX runtime, so that maps to createElement.
await build({
  ...shared,
  entryPoints: ["src/cdn-react.ts"],
  outfile: "cdn/react-instantsearch.min.js",
  plugins: [
    pageGlobals({
      react: "module.exports = window.React;",
      "react-instantsearch": "module.exports = window.ReactInstantSearch;",
      "react/jsx-runtime": `
        const R = window.React;
        const jsx = (type, props, key) =>
          R.createElement(type, key === undefined ? props : { ...props, key });
        module.exports = { jsx, jsxs: jsx, Fragment: R.Fragment };`,
    }),
  ],
});
writeFileSync(
  "cdn/instantsearch-components.css",
  stylesheets.map((f) => readFileSync(f, "utf8")).join("\n"),
);

function version() {
  return JSON.parse(readFileSync("package.json", "utf8")).version;
}
