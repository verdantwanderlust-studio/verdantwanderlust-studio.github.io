---
name: new-page
description: Ivy 要新增一個頁面、新作品案例、新服務項目時用。當她說「想加一頁 ...」「作品集加一個案例」「想要一個 FAQ 頁」「加一個專門講 ... 的頁」等請求,務必觸發。這 skill 處理:確認 slug 跟導覽列位置、用 template 建 MDX、寫初稿給她改、註冊到 nav、引導她配套上傳照片(走 add-photo skill)。
---

# 新增頁 / 案例 — new-page

> Ivy 要長新東西出來。你的工作:問清楚定位、用 template 建檔、寫她滿意的初稿、註冊到 nav、配套處理圖。

---

## 何時觸發

Ivy 講話像這樣就走這 skill:

- 「想加一頁專門講花園維護年費方案」
- 「作品集加一個新案例,2026 春 大安區陽台」
- 「想要一個 FAQ 頁,我給你幾個常見問題」
- 「想加一個部落格區放隨筆」
- 「服務頁想拆成兩頁:設計、維護」

**不要走這 skill 的情況**:
- 「改現有頁面的文字」→ `edit-content`
- 「現有案例補幾張照片」→ `add-photo`
- 「想改整個網站結構」(超過加一頁)→ 找 Jason

---

## 流程

### Step 1 — 釐清「這是哪種頁」

兩種典型情境,流程不同:

**A. 全新頁面(top-level page)**:像「FAQ」「部落格首頁」「年費方案」這類獨立頁。檔案在 `content/pages/<slug>.mdx`,通常要進 nav 主選單。

**B. 作品集 / 服務子項(collection item)**:像「2026 春 大安區陽台」這種作品集裡多一個案例,或服務頁多一個項目。檔案在 `content/portfolio/<slug>.mdx` 或 `content/services/<slug>.mdx`,不進 nav 主選單(從父頁列表進)。

先問:

> 「了解。先確認一下:
> 1. 這是**全新頁面**(會出現在主選單)?
> 2. 還是**作品集 / 服務的新項目**(從作品集 / 服務頁點進去)?」

### Step 2 — 確認三要素

不管 A / B,動手前一定要拿到三個東西:

**(1) Slug(URL 路徑)**

英文 + dash。例如:

- A 範例:`/maintenance-plan`、`/faq`、`/blog`
- B 範例:`/portfolio/dazhi-balcony-2026`、`/services/maintenance`

請 Ivy 確認 slug。如果她不在意,你提一個合理的版本讓她點頭。**不要中文 / 大寫 / 底線**。

**(2) 標題 / 副標題**

她講的「想加一頁專門講花園維護年費方案」→ 標題可能是「年費方案」「花園維護年費」?她沒給就問:「頁面上方的大標題你想怎麼下?」

**(3) 大致內容方向**

她要這頁講什麼?哪些重點?有沒有素材?

範本:

> 「了解,加一頁年費方案。確認三件事:
> 1. URL 路徑:`/maintenance-plan` 可以嗎?
> 2. 頁面標題:『花園維護年費方案』? 副標題要不要?
> 3. 內容大致講什麼?(例如:價位區間、包含項目、適合誰、聯絡方式)有素材給我嗎?還是我先寫個草稿你改?」

### Step 3 — 用 template 建 MDX

如果是 **A 全新頁**,template 通常在 `content/_templates/page.mdx`(或 Jason 預留的範本)。

如果是 **B 作品集案例**,template 在 `content/_templates/portfolio-case.mdx`。

找不到 template → 看同類型已存在的檔案複製一份(例如已經有 `services.mdx`,新頁就照那個 frontmatter 結構)。

建檔路徑:

```
content/pages/maintenance-plan.mdx        ← A 範例
content/portfolio/dazhi-balcony-2026.mdx  ← B 範例
```

**透過 Connector 建檔**(create new file),frontmatter 先填 placeholder,內文寫初稿。

### Step 4 — 寫初稿,給她改

她沒給內容素材 → 你寫一版初稿,**先給她看再寫進去**,不要直接 commit 一個 dummy 內容。

範本:

```
我先給你看初稿(還沒寫進 repo):

---
title: 花園維護年費方案
description: 適合不想自己照顧但想保持庭園狀態的人
---

# 花園維護年費方案

[第一段:這方案是什麼,3-4 句]
小規模住家庭園、別墅、店面綠化都適合 ...

## 包含項目
- 每月一次定期維護(修剪、施肥、換季植栽)
- ...

## 方案區間
- 基礎方案:適合 ...,每月約 X
- 進階方案:...

## 怎麼開始
聯絡我,我會先到現場看一次,...

---

你看可以的話我寫進去。要改哪段?或哪幾個地方你自己有素材想加?
```

她回 OK 或改完內容,你再寫進 MDX。

### Step 5 — 註冊到 nav(只限 A 全新頁)

A 情境:這頁要不要進主選單?

問:

> 「這頁要加到主選單(網站上方那排)嗎?
> - 要 → 我加進 nav 設定。位置:[列出現有 nav 順序],你想放第幾個?
> - 不要 → 我不加,只能從 URL 直接進(或從別頁連)」

主選單通常在 `content/nav.ts`(或類似的設定檔)或 `components/Header.tsx` 裡的 array。**只動既有 nav 設定檔裡的 `pages` / `items` array,不要動 `Header.tsx` 的 JSX 結構**——後者是 Jason 領域。

如果 nav 是直接寫死在 `Header.tsx` 裡(不是吃設定檔)→ 跟 Ivy 講:「加進選單這部分需要請 Jason,我先把頁面建好,你可以先用 URL 訪問,之後找 Jason 補選單。」

B 情境:不用進 nav,作品集 / 服務頁會由 Jason 的 content loader 掃資料夾,自動列出該分類下的所有項目。

### Step 6 — 配套照片(看情境)

**B 作品集案例幾乎一定要配圖**。建 MDX 之後,接著走 `add-photo` skill 流程:引導她上傳 → 等 pipeline → 接 MDX 引用。

**A 全新頁不一定要圖**,先寫文字再說。她有圖再走 add-photo。

### Step 7 — 走 publish

```
建好了。摘要:
- 新檔:content/pages/maintenance-plan.mdx(內容已寫)
- nav 設定:已加進(放第 3 個)
- 圖:暫無

新頁我建議先 preview(訪客點到看版面有沒有怪):
1. 我建分支 new-page-maintenance-plan
2. push,Cloudflare 給 preview URL
3. 30-60 秒後你看,OK 我 merge

走 preview 嗎?
```

實際 push / preview 步驟看 `publish` skill。

---

## 邊界(以下要回「這要找 Jason」)

- **新類型的 content 分類**:她想加「客戶評價」「課程」之類新分類(不是 page / portfolio / service),需要 Jason 在 content loader 加新分類與 frontmatter schema
- **加新功能型頁面**:有 form、訂閱、登入、會員、payment、預約 → 找 Jason
- **改 nav 結構**:加下拉選單、加 mega menu、行動版選單樣式 → 找 Jason
- **改 layout template**:新頁要用跟其他頁不同的版型(例如「滿版圖 + 浮動文字」)→ 新 layout component,找 Jason
- **動 `app/` 或 `components/` 裡的 `*.tsx`**:不管什麼理由

---

## Gotchas(踩雷紀錄)

### G-1:Slug 撞名

建之前先看 `content/pages/`(或對應資料夾)有沒有同名 .mdx。撞了 build 會失敗。

### G-2:Frontmatter schema

每個分類的 frontmatter 必填欄位(title、description、date 之類)由 Jason 的 content loader 定義(通常用 zod 驗證)。少 key build 會失敗。複製 template 是最穩,**不要自己發明 frontmatter 欄位**。

### G-3:她「想看 demo 才能決定要什麼」

正常,景觀客戶常見。給她 preview 看,不要堅持「要先講清楚」。

### G-4:作品集自動排序

作品集通常按日期 / order 欄位排序。新案例 frontmatter 的 `date` / `order` 要填對,不然會跑去清單尾巴她以為沒生效。

### G-5:nav 不在設定檔

如果 nav 是 hardcode 在 `Header.tsx`,不要硬改 `.tsx`。轉介找 Jason 加 nav 項目。

---

## 對話風格 reminder

- 繁體中文,溫暖,step-by-step
- 不用 emoji,不用 AI 慣用詞
- 動手前先確認 slug / 標題 / 內容方向「三要素」
- 沒素材就寫初稿給她看,不要直接 commit dummy 內容
- 配圖走 `add-photo` skill,不要在這 skill 裡重新發明流程
