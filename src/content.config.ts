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
  schema: ({ image }) => {
    // 抽成共用的 helper,讓 alt 在 schema 層就是必填 ——
    // alt 是給看不見的人用的,寫錯比留空更糟,所以用 schema 擋而不是靠人記得
    const photo = () => z.object({
      src: image(),
      alt: z.string().min(1),
    });
    // 純裝飾用圖片:允許空 alt。
    // 只有「容器本身已 aria-hidden、螢幕閱讀器根本不會進去」的圖片適用 ——
    // 目前只有首頁 marquee(index.astro 的 .marquee 有 aria-hidden="true")。
    // 判準:如果一張圖拿掉之後,頁面的意思會少一塊,它就不是裝飾性的,要用 photo()。
    const decorativePhoto = () => z.object({
      src: image(),
      alt: z.string(),
    });

    return z.object({
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
      hero: photo().optional(),
      photos: z.array(photo()).optional(),
      // marquee 的容器是 aria-hidden,輔助科技不會念到它,故容許空 alt
      marquee: z.array(decorativePhoto()).optional(),
      // featured 是精選作品輪播,有 dots 可切換、對讀者有語意,不是裝飾 → alt 必填
      featured: z.array(photo()).optional(),
    });
  },
});

export const collections = { portfolio, pages };
