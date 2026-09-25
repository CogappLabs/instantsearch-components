// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cogapplabs.github.io",
  // GitHub Pages serves the site under the repo name; everywhere else it runs
  // at the root. The Pages workflow sets DOCS_BASE.
  base: process.env.DOCS_BASE ?? "/",
  integrations: [
    starlight({
      title: "InstantSearch components",
      logo: { src: "./src/assets/cogapp-logo.svg", alt: "Cogapp" },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/CogappLabs/instantsearch-components",
        },
      ],
      components: {
        ThemeProvider: "./src/components/LightTheme.astro",
        ThemeSelect: "./src/components/NoThemeSelect.astro",
      },
      customCss: ["./src/styles/brand.css", "./src/styles/demo.css"],
      // One light code theme to match the light-only site.
      expressiveCode: { themes: ["github-light"] },
      sidebar: [
        { label: "Getting started", slug: "guides/getting-started" },
        { label: "Components", items: [{ autogenerate: { directory: "components" } }] },
      ],
    }),
    react(),
  ],
  vite: {
    // The demos import the component from ../src, which would resolve React
    // from the library's own node_modules: one copy keeps hooks working, and CI
    // installs only this folder.
    resolve: { dedupe: ["react", "react-dom", "react-instantsearch"] },
  },
});
