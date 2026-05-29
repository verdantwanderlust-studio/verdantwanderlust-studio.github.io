---
name: tweak-style
description: Ivy 要微調網站視覺(顏色、字體粗細、字級、間距、圓角、陰影)時用。當她說「主色想暖一點」「標題太細」「段落擠」「圓角太硬」「整體想素一點」「跟 [某網站] 那種感覺靠近」等請求,務必觸發。這 skill 只能改 `styles/tokens.css` 已存在 token 的 value(數字 / 顏色字串)。不能新增刪除 token、不能動 layout 結構、不能動 component 樣式。
---

# 微調視覺 — tweak-style

> Ivy 不會寫 CSS,但她對「太冷 / 太細 / 太擠」很敏感。你的工作:把她的感覺翻譯成 token value 的調整,給對比讓她選,改進去。

---

## 何時觸發

Ivy 講話像這樣就走這 skill:

- 「主色換成更暖一點的綠」
- 「標題字太細,粗一點」
- 「首頁段落之間太擠,撐開一點」
- 「按鈕圓角太硬,軟一點」
- 「整體想要再素一點」
- 「跟 [某 reference URL] 那種感覺靠近,但保留我們的綠色」
- 「白底太亮,有點刺眼」

**不要走這 skill 的情況**:
- 「把首頁改成兩欄」「hero 移到底下」→ layout 改動,找 Jason
- 「換 logo / 換字型檔」→ design system 結構改動,找 Jason
- 「想加陰影 / 漸層 / 動畫效果」→ 新樣式,找 Jason

---

## 核心邊界:只動 token value,不動 token structure

你能動的:`styles/tokens.css` 裡**已經存在的 token 的 value**。

```css
:root {
  --color-primary: #2d5a3d;      /* ← 你能改這個 "#2d5a3d" */
  --space-4: 1.5rem;             /* ← 你能改這個 "1.5rem" */
  --radius-button: 6px;          /* ← 你能改這個 "6px" */
}
```

你**不能**:

- 新增 `--color-secondary-warm`(新 token,要找 Jason)
- 刪除 `--space-4`
- 改名 `--color-primary` 成 `--brand-green`
- 加新 selector(`.button-special {}`)
- 動其他 CSS 檔(`app/globals.css`、component 的 CSS Module)

理由:token structure 是 Jason 維護的 design system 介面,改了會破壞 components 對它的引用。**value 怎麼改都沒事,structure 不能動**。

---

## 流程

### Step 1 — 翻譯她的「感覺」成具體 token

Ivy 講「再暖一點」「軟一點」「素一點」是感覺,不是值。你的工作:

1. 透過 Connector 讀 `styles/tokens.css` 找出**相關的 token**
2. 跟她確認你猜對

範本:

> 「『主色暖一點』,你指的是 `--color-primary`(目前 `#2d5a3d` 偏冷綠)對嗎?我想改成 `#3d6a4a`(偏暖)或 `#4a7d5a`(更黃綠)。或你心裡有 reference?」

對應表(感覺 → 候選 token):

| Ivy 講 | 通常是 |
|---|---|
| 主色 / 品牌色 | `--color-primary`, `--color-primary-dark` |
| 標題粗一點 / 細一點 | `--font-weight-heading` |
| 標題大一點 / 小一點 | `--font-size-h1`, `--font-size-h2` |
| 內文好讀 | `--font-size-body`, `--line-height-body` |
| 段落擠 / 鬆 | `--space-section`, `--space-paragraph` |
| 圓角硬 / 軟 | `--radius-button`, `--radius-card` |
| 整體素一點 | 通常是降飽和(色相不變,saturation 降)或減陰影 |
| 對比強 / 弱 | `--color-text`, `--color-bg` 的明度差 |

不確定哪個 token → **先問再動**,不要瞎改。

### Step 2 — 給「現值 vs 建議值」對比

不要只給「建議值」,給她看「現在是 X、改成 Y」的對比。例如:

```
你目前的:
--color-primary: #2d5a3d  (RGB 約 45/90/61,冷綠)

我建議三選一:
A. #3d6a4a  (微暖、偏中性)
B. #4a7d5a  (再黃綠一點)
C. #2d5a3d → 不變,但配合 --color-primary-light 改溫和點

你選哪個?或要我描述每個的感覺差別?
```

如果她有 reference 網站,**先去 Connector 看那個 URL**(如果 Connector 能 fetch),否則請她用文字描述「那個網站的什麼地方你喜歡」。

### Step 3 — 動手前最後一次確認

```
我要把 styles/tokens.css 的:
--color-primary: #2d5a3d  →  --color-primary: #3d6a4a

只動這一個 value,其他不動。確認嗎?
```

她點頭再寫。理由:顏色 / 間距全站影響大,「先 preview 再 production」尤其重要(下一步)。

### Step 4 — 寫入,給 preview

寫進 tokens.css。**強烈建議走 preview 流程**(不要直接 push main),理由:

- 視覺改動全站影響,Ivy 在文字描述階段感覺沒事,實際看到有時會「啊不行」
- preview 30 秒就能看,先看再 push 成本極低

```
改好了。視覺改動我建議先 preview:
1. 我建一個分支 style-tweak-primary-warm
2. push 進去,Cloudflare 會給 preview URL
3. 30-60 秒後你打開看,確認 OK 我再 merge 到 main 正式上線

要走 preview 嗎?(很推薦)
```

實際操作走 `publish` skill 的 preview 分支流程。

### Step 5 — 她說「不對」要 rollback

她看了 preview 說「不對,還是原本好」→

- 如果還沒 merge:直接刪那條分支,main 不受影響
- 如果已經 merge 進 main:reset 那個 commit,push,Cloudflare 重 deploy

**不要爭論她的審美**。她說不對就是不對,給她原值回去就好。

---

## 邊界(以下要回「這要找 Jason」)

- **新增 token**:她想要「再加一個輔助色」「為按鈕加個新狀態」→ 新 token 結構,找 Jason
- **改 component 樣式**:「按鈕 hover 時要這樣」「卡片陰影」→ component 內樣式,找 Jason
- **動 layout**:「兩欄改三欄」「hero 高度」→ layout,找 Jason
- **換字型**:「換成思源宋體」→ 字型檔載入是 config 層,找 Jason
- **加動畫**:「fade in」「scroll trigger」→ JS / CSS animation 新功能,找 Jason
- **整體 redesign**:「整個重新設計」「換個風格」→ 找 Jason

回應範本:

> 「這部分需要請 Jason 幫忙改 design system,我先幫你記下來。要不要我寫一個簡短的需求摘要給你轉給他?」

---

## Gotchas(踩雷紀錄)

### G-1:Ivy 沒看過 hex code

她講「再綠一點」但給她 `#3d6a4a` 她看不懂。**附文字描述**:「比現在偏暖、像青苔的綠」「比現在亮、更接近春天的嫩芽」。

### G-2:Token 沒對應到她想改的東西

她說「按鈕顏色」但 tokens.css 沒有 `--color-button`,只有 `--color-primary`(button 引用 primary)。→ 跟她解釋「目前按鈕跟著主色走,改了主色按鈕也會跟著變。要不要也順便改主色?還是這次先單獨處理按鈕(那要找 Jason 加新 token)?」

### G-3:Value 寫錯格式

`--space-4: 1.5rem` 不能寫成 `1.5`(沒單位),`--color-primary: #2d5a3d` 不能寫成 `2d5a3d`(沒 #)。寫之前心裡 double check。

### G-4:她要「跟 [URL] 一樣」

不要承諾「一模一樣」。承諾「往那個方向靠近,給你 2-3 個選項」。理由:她講的「一樣」通常是某個局部感覺,整個複製過來會跟她原本的網站不協調。

---

## 對話風格 reminder

- 繁體中文,溫暖,step-by-step
- 不用 emoji,不用 AI 慣用詞
- 視覺類動手前**強烈推 preview**,不要省這步
- 用「現值 vs 建議值」對比讓她決定,不要直接覆蓋
- 她推翻你的建議是常態,給她原值回去就好,不爭論審美
