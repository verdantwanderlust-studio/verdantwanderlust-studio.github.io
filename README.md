# 景觀丸藝 / Verdant Wanderlust

> Ivy(景觀品牌經營者)的官網。Astro + React Islands + Cloudflare Pages。
> 維護日常透過 claude.ai 網頁 + GitHub Connector — Ivy 不打 terminal、不裝任何東西。

## 設計

- **品牌名顯示**:中文「景觀丸藝」/ 英文「Verdant Wanderlust」
- **氣質**:編輯感、慢、實在(Aesop / Snøhetta / Heatherwick 路線),**不像** SaaS / AI tool
- **Tokens**:`src/styles/tokens.css`(目前為 ci-editorial 佔位,Ivy workshop 後替換)

## Stack

| 項目 | 版本 / 工具 |
|---|---|
| Framework | Astro 5(static output) |
| Islands | React 19(`@astrojs/react`) |
| Styles | Tailwind 4(`@tailwindcss/vite`)+ tokens.css |
| Content | MDX(`@astrojs/mdx`)+ content collections |
| Image opt | sharp(Astro 內建)+ raw-images/ → public/images/ GH Action |
| Animation | GSAP ScrollTrigger(showpiece)+ static CSS(其他) |
| Carousel | Embla(React Island,需要時) |
| Deploy | Cloudflare Pages auto-deploy on push to main |

## Dev

```bash
npm install
npm run dev       # localhost:4321
npm run build     # → dist/
npm run preview
```

## Pages

- `/` Home(Hero + Selected Work)
- `/about` Ivy 自介
- `/services` 服務項目
- `/portfolio` 索引 + `/portfolio/<slug>` 案例內頁(showpiece)
- `/contact` Email / 電話 / 地址(無 form,D5 決策)

## AI 助理

Ivy 透過 claude.ai Project 維護網站。對話入口:`CLAUDE.md` + `.claude/skills/`。
非 Ivy 助理場景(改 layout / 加功能 / bug)→ 找 Jason。

設計方向邊界 5 條(WebGL 背景 / counter / bento / 3D / Lenis 禁)見 `CLAUDE.md`。
