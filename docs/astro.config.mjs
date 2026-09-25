// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cogapplabs.github.io",
  base: "/instantsearch-components",
  integrations: [
    starlight({
      title: "InstantSearch components",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/CogappLabs/instantsearch-components",
        },
      ],
      sidebar: [
        { label: "Getting started", slug: "guides/getting-started" },
        { label: "Components", items: [{ autogenerate: { directory: "components" } }] },
      ],
    }),
  ],
});
