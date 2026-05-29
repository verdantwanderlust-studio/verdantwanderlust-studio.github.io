// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 暫用 placeholder domain — Ivy 買 domain 後改
const SITE = 'https://verdantwanderlust.com';

export default defineConfig({
  site: SITE,
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
