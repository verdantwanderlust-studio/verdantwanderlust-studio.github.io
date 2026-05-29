---
name: edit-content
description: 改網站文字 / 文案 / 標題 / 段落內容時用。當 Ivy 說「想改 ... 文字」「重寫 ... 標語」「更新 ... 介紹」「換掉那段話」「文案太正式 / 太冷 / 太硬」「加一句 ...」「拿掉那句 ...」這類請求,務必觸發。所有改 MDX 內容檔(`content/**/*.mdx`)的文字部分都走這 skill,不論頁面是首頁、about、服務、作品集還是 contact。
---

# 改文案 — edit-content

> Ivy 想動網站的「字」。你的工作:找到對的 MDX、給她可選的版本、確認、寫入、問下一步。

---

## 何時觸發

Ivy 講話像這樣就走這 skill:

- 「首頁標語想換成 ...」
- 「about 那段太正式,改溫暖一點」
- 「服務頁的描述加一句強調 10 年經驗」
- 「作品集這篇標題改成 ...」
- 「contact 頁有沒有更親切的寫法?」
- 「把『...』那幾個字一定要保留,其他可以改」

**不要走這 skill 的情況**(走別的 skill):
- 「加新頁 / 新案例」→ `new-page`
- 「想換照片 / 加圖」→ `add-photo`
- 「改字體 / 顏色 / 字級」(視覺、不是內容)→ `tweak-style`

---

## 流程

### Step 1 — 一句話確認你聽懂了

動手前先回 Ivy 一句:

> 「我要改 [哪頁] 的 [哪段],從 [原來大概是什麼] 改成 [她想要的方向]。對嗎?」

理由:她講話經常省略 context(「那段歡迎詞」她知道是哪段、你不一定知道)。先 echo 回去比直接動手安全。

### Step 2 — 透過 GitHub Connector 找對的 MDX

頁面對應(Next.js + MDX 結構):

| Ivy 講 | 通常檔案 |
|---|---|
| 首頁 / Home / 主頁 | `content/pages/home.mdx` |
| about / 關於 / 自我介紹 | `content/pages/about.mdx` |
| 服務 / services / 我做什麼 | `content/pages/services.mdx` |
| 作品集 / portfolio / 案例集 | `content/portfolio/<case>.mdx` |
| 聯絡 / contact | `content/pages/contact.mdx` |

找不到時:用 Connector 搜尋關鍵字(Ivy 念給你的原文片段),會直接定位。

### Step 3 — 給她 2-3 個版本選

**不要只給一個改法**。給 2-3 個語氣 / 長度 / 用詞略不同的版本讓她挑。理由:

- 她不是寫文案的人,看到對比比看到單一版本更容易決定
- 第一版她不喜歡,有 plan B 不用整輪重來
- 給三個版本比她想十分鐘自己改更省她時間

格式:

```
版本 A(原版微調,改 [什麼]):
> [新句子]

版本 B(口語化、像跟客戶聊天):
> [新句子]

版本 C(精煉、更短):
> [新句子]

你選哪個?或是這幾個哪幾段拼起來?
```

如果她沒給語氣方向,自己根據 CLAUDE.md 裡的「語氣關鍵字」(溫暖 / 自然 / 專業 / 實在 之類)出版本。

### Step 4 — 拿到她的選擇,寫進去

透過 Connector 編輯該 MDX 檔。只動文字,**不要動 frontmatter 的 key 名稱、不要動 import、不要動 component 標籤**。

如果她說「A 跟 B 的前半拼起來」,寫之前再 echo 一次完整版本給她看,確認再寫。

### Step 5 — 完成後問她下一步

```
寫好了。要:
1. 先上 preview URL 看效果?(我建立預覽分支,30 秒後給你連結)
2. 直接上線?(小改我直接 push,30 秒後正式生效)
3. 還要再改其他地方?
```

預設策略:**首頁 / about 的改動建議走 preview**(這兩頁訪客第一眼看到),其他頁可以直接 push。

實際 push / preview 的步驟去看 `publish` skill。

---

## 邊界(以下要回「這要找 Jason」)

碰到下面這些,回:「這部分需要請 Jason 幫忙改 design system,我先幫你記下來。要不要我寫一個簡短的需求摘要給你轉給他?」

- **改 layout 結構**:把某段移到別的位置、加 sidebar、改成兩欄
- **動 component 標籤**:Ivy 說「把這段加個圖示」「改成可摺疊」,這是元件不是文字
- **新增段落 type**:她想加「常見問題」「客戶評價」這種新區塊類型(走 `new-page` 或找 Jason)
- **改檔案結構**:重新命名 MDX、合併兩個檔案、刪除整個頁面
- **MDX frontmatter 結構**:不要新增 / 刪除 / 改名 frontmatter 的 key

純粹改 **frontmatter 既有 key 的 value**(例如 `title: "..."` 的字串)是 OK 的。

---

## Gotchas(踩雷紀錄)

> 第一次跑 skill,先留空白。之後遇到問題寫進來。

### G-1:MDX 內混有 component 標籤

MDX 段落裡可能會有 `<Hero>`、`<Section>`、`<Image src="..." />` 之類的標籤。**只改標籤之間的純文字,不要動屬性(src / class / id 等)**。

### G-2:中英文混排空格

繁中習慣英文前後加空格(「我用 Next.js 做的」而不是「我用Next.js做的」)。改文案時保留這個習慣,除非 Ivy 明確說不要。

### G-3:「先給我看 preview」不等於 push

Ivy 說「先給我看」表示要 preview,**不要 push 到 main**。走 `publish` skill 的 preview 流程(建分支)。

---

## 對話風格 reminder

- 繁體中文,溫暖,step-by-step
- 不用 emoji,不用「打造 / 賦能 / 驅動 / 無縫」
- 動手前一句話確認;完成後主動問下一步
- 緊張、不確定的時候,給「改前 vs 改後」對比讓她決定,別硬推
