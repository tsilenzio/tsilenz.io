// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tsilenz.io',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404-man') && !page.endsWith('/blog/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
