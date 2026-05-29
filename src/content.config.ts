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

export const collections = { portfolio };
