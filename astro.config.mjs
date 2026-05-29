// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 網址 — 買 domain 後改回 verdantwanderlust.com 並移除 base
const SITE = 'https://verdantwanderlust-studio.github.io';

export default defineConfig({
  site: SITE,
  base: '/verdant-wanderlust',
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    mdx(),
    sitemap(),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  experimental: {
    clientPrerender: true,
  },
});
