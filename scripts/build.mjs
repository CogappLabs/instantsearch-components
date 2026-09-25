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

// The script-tag build in cdn/, committed so jsDelivr can serve it from a
// tag. React and React InstantSearch are the page's own globals, loaded from
// their UMD builds; neither ships a JSX runtime, so that maps to createElement.
const globals = {
  react: "module.exports = window.React;",
  "react-instantsearch": "module.exports = window.ReactInstantSearch;",
  "react/jsx-runtime": `
    const R = window.React;
    const jsx = (type, props, key) =>
      R.createElement(type, key === undefined ? props : { ...props, key });
    module.exports = { jsx, jsxs: jsx, Fragment: R.Fragment };`,
};
mkdirSync("cdn", { recursive: true });
await build({
  entryPoints: ["src/cdn.ts"],
  outfile: "cdn/instantsearch-components.min.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
  banner: { js: `/* @cogapplabs/instantsearch-components ${version()} | MIT */` },
  plugins: [
    {
      name: "page-globals",
      setup(b) {
        const filter = new RegExp(`^(${Object.keys(globals).join("|").replace("/", "\\/")})$`);
        b.onResolve({ filter }, (args) => ({ path: args.path, namespace: "page-globals" }));
        b.onLoad({ filter: /.*/, namespace: "page-globals" }, (args) => ({
          contents: globals[args.path],
          loader: "js",
        }));
      },
    },
  ],
});
writeFileSync(
  "cdn/instantsearch-components.css",
  stylesheets.map((f) => readFileSync(f, "utf8")).join("\n"),
);

function version() {
  return JSON.parse(readFileSync("package.json", "utf8")).version;
}
