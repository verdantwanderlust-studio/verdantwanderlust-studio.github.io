import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Portfolio 案例:每件案場一份 MDX
const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    location: z.string(),
    year: z.number().int(),
    area_sqm: z.number().optional(),
    summary: z.string(),
    cover: image(),
    gallery: z.array(image()).optional(),
    draft: z.boolean().default(false),
  }),
});

// 頁面文案:每頁一份純文字 YAML(讓非工程師用 GitHub connector 安全編輯)
const pages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
  schema: z.object({
    kicker: z.string(),
    title: z.string(),
    lede: z.string().optional(),
    body: z.array(z.string()).optional(),
    items: z.array(z.object({
      no: z.string(),
      name: z.string(),
      desc: z.string(),
      meta: z.string(),
    })).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    mapSrc: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { portfolio, pages };
