---
name: add-photo
description: Ivy 要加 / 換 / 上傳照片到網站時用。當她說「我有 N 張新照片要放」「想換首頁主視覺」「about 那張要換」「這個案例只有一張圖太少」「服務頁配圖不對味」等請求,務必觸發。這 skill 處理把原圖上傳到 `raw-images/`、引導她用 GitHub 網頁拖拉上傳、提醒 GH Action 圖片優化 pipeline、然後更新 MDX 引用。
---

# 加 / 換照片 — add-photo

> Ivy 不裝任何工具。她只能用 GitHub 網頁拖拉上傳。你的工作:告訴她拖去哪個資料夾、確認檔名、等 pipeline 跑完、把圖接到對的 MDX。

---

## 何時觸發

Ivy 講話像這樣就走這 skill:

- 「我有 5 張新的庭園案例要放作品集」
- 「首頁主視覺想換,我準備了 3 張讓你選」
- 「about 頁我的大頭照要換,新的拍好了」
- 「這個案例只有 1 張圖太單調,我加了 4 張細節照」
- 「服務頁的配圖換掉,我有更貼切的」
- 「這張圖刪掉」(刪也走這 skill)

**不要走這 skill 的情況**:
- 「想改圖片下方的說明文字」→ `edit-content`
- 「圖片排版改成兩張一排」→ 找 Jason(layout 改動)

---

## 流程

### Step 1 — 問清楚是「新增」還是「替換」

兩個情境的步驟差很多,先確認:

> 「了解。先確認一下:
> 1. 這是**新增**(網站本來沒有,加上去)?
> 2. 還是**替換**(換掉原本某張)?
> 3. 還是**新案例的整組圖**(作品集要新增一個案例,圖是配套的)?」

如果是 3,跳到 `new-page` skill。

### Step 2 — 確認分類資料夾

`raw-images/` 預期長這樣:

```
raw-images/
├── home/          首頁主視覺、區塊配圖
├── about/        Ivy 自己 / 工作室照片
├── services/     服務說明配圖
├── portfolio/    作品集
│   └── <case-slug>/   每個案例一個資料夾
└── contact/      聯絡頁配圖
```

問 Ivy:這幾張要放哪一類?如果是作品集,case slug 是哪個?(看 `content/portfolio/` 已有哪些)

### Step 3 — 確認檔名規範

**英文 + dash,不要中文 / 空格 / 特殊字元**。例如:

- ✅ `japanese-garden-2025-detail-01.jpg`
- ✅ `dazhi-balcony-spring-03.jpg`
- ❌ `日式庭園 1.jpg`
- ❌ `IMG_1234.JPG`(可以,但不推薦,因為日後 Ivy 自己看也看不懂)

請 Ivy 命名前先給她範例。如果她的原檔不照規矩,**動手前提供建議檔名讓她改**,不要自己默默改檔名(她會找不到原檔對照)。

### Step 4 — 引導她拖拉上傳

她在 claude.ai 看不到你「拉檔上傳」的動作,要文字引導她去 GitHub 網頁操作。範本:

```
請你做這幾步:
1. 開瀏覽器到 github.com/verdantwanderlust-studio/verdantwanderlust-studio.github.io
2. 點上方檔案樹,進到 `raw-images/portfolio/dazhi-balcony/` 資料夾
   (如果這個資料夾不存在,先點 "Add file" → "Create new file" → 路徑輸 `raw-images/portfolio/dazhi-balcony/.gitkeep`,Commit changes)
3. 進到資料夾後,點 "Add file" → "Upload files"
4. 把這 4 張圖拖進去
5. 下方 commit message 留預設,點 "Commit changes"
6. 完成後回來告訴我,我接著做下一步

檔名請改成:
- dazhi-balcony-overall.jpg
- dazhi-balcony-corner-01.jpg
- dazhi-balcony-corner-02.jpg
- dazhi-balcony-night.jpg
```

她回報「上傳完了」之後,你透過 Connector 確認 commit 真的進 main(列出該資料夾的檔案)。

### Step 5 — 等 GitHub Action 圖片 pipeline 跑完

`raw-images/` 有新 push → `.github/workflows/image-pipeline.yml` 自動觸發 → 用 sharp resize 成 1920px 主圖 + 600px thumb,輸出 webp 到 `public/images/<category>/<filename>.webp`,並把原檔移到 `archive/raw-images/`。

時間:30 秒到 2 分鐘。

跟 Ivy 講:

> 「上傳收到了。GitHub Action 正在優化(resize + webp),約 30 秒到 2 分鐘。我先去開始改 MDX 引用,等優化跑完一起 push。」

透過 Connector 看 Action 狀態:`/actions` 頁面或 commits 旁的綠 ✓。

### Step 6 — 更新 MDX 引用

優化完成後,圖會出現在 `public/images/<category>/<filename>.webp`。

到對應的 MDX 加 / 換引用。預設用 markdown 圖片語法(最穩,不依賴元件對映):

```mdx
![大安區陽台改造主視覺](/images/portfolio/dazhi-balcony-overall.webp)
```

如果專案的 MDX 有提供自訂圖片元件(例如 `<Img>`,幫忙處理尺寸、lazy load),改用那個 — 看同類型 MDX 檔現有寫法跟著做,不要兩種混用。

**alt 一定要寫**(無障礙 + SEO)。Ivy 沒給就主動問:「這張圖的 alt 文字寫什麼?(視障使用者跟搜尋引擎會讀到,一句話描述圖裡有什麼)」

如果是「替換」既有圖,把舊路徑改新路徑就好,**不要刪 `public/images/` 裡的舊檔**(可能還有 cache、舊版本歷史會用到)。

### Step 7 — 完成,問下一步

```
做完了。摘要:
- 上傳 4 張到 raw-images/portfolio/dazhi-balcony/
- GH Action 優化 → public/images/portfolio/
- 更新 content/portfolio/dazhi-balcony.mdx 引用

要:
1. 先上 preview URL 看實際效果?(推薦,主視覺類的)
2. 直接 push 上線?
```

實際 publish 步驟看 `publish` skill。

---

## 邊界(以下要回「這要找 Jason」)

- **改圖片 layout**:「這四張排成兩列兩行」「圖片加陰影 / 邊框」→ component 改動
- **加圖片功能**:lightbox(點圖放大)、輪播、影片嵌入 → 新功能
- **改 GH Action 圖片 pipeline**:換成不同尺寸、輸出格式、檔案路徑規則 → 設定檔
- **直接動 `public/images/`**:這個資料夾是 pipeline 自動產出的,**不要手動加 / 改檔**

---

## Gotchas(踩雷紀錄)

### G-1:檔名規範踩雷

中文檔名 / 空格 / 特殊字元在 GH Action 處理會出問題。**上傳前一定強迫改名**,事後改 commit history 比較麻煩。

### G-2:Pipeline 沒跑

push 後 1-2 分鐘 `public/images/` 沒出現新檔 → 去 GitHub `/actions` 看是不是 fail。常見原因:檔名有空格、檔案太大(> 20MB)、格式不支援(只接 jpg / jpeg / png / heic)。

### G-3:HEIC iPhone 照

Ivy 用 iPhone 拍 → 原檔可能是 .HEIC。pipeline 支援(我們在 sharp config 有加),但她要確認上傳前不被自動轉檔成低品質 .jpg。

### G-4:替換但路徑寫死

如果舊圖的引用散在多個 MDX,改路徑時用 Connector 搜尋整個 repo,**不要假設只在一個地方**。

### G-5:刪圖

Ivy 說「這張刪掉」→ 只刪 MDX 引用,**不刪 `public/images/` 裡的 webp**(Cloudflare cache、deploy 歷史可能引用)。如果她堅持清,先確認 `archive/raw-images/` 裡有原檔。

---

## 對話風格 reminder

- 繁體中文,溫暖,step-by-step
- 不用 emoji,不用 AI 慣用詞
- 上傳指引「**請你做這幾步**」+ 編號列點,她容易跟著做
- 等 pipeline 的時候主動跟她講「我先去做 X,等優化跑完再回來」,不要讓她乾等
