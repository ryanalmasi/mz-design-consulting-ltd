// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The canonical origin. Used for sitemap URLs, canonical tags, and OG images.
const SITE = 'https://mzdesignconsulting.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: {
    // Emit `/services.html` rather than `/services/index.html` so the URLs
    // match the old GitHub Pages site exactly and no redirects are needed.
    format: 'file',
    inlineStylesheets: 'auto',
  },
  image: {
    // Cap the work sharp does on the source photos; nothing is displayed
    // wider than the 1280px content column at 2x.
    layout: 'constrained',
    responsiveStyles: true,
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thanks'),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    build: {
      assetsInlineLimit: 1024,
    },
  },
});
