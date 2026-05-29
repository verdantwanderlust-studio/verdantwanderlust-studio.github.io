// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 過渡期:GitHub Pages 跑在 org root domain
// Ivy 買 domain + 切 Cloudflare Pages 後改 https://<custom-domain>
const SITE = 'https://verdantwanderlust-studio.github.io';

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
