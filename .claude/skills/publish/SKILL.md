---
name: publish
description: Ivy 要把改動正式上線、發布,或想先看 preview 預覽,或要還原退回上一版時用。當她說「上線」「發布」「publish」「推上去」「這版可以了正式發」「先給我看看 / 先 preview」「還原」「退回上一版」「剛剛那個改壞了救回來」等請求,務必觸發。這 skill 處理:建 preview 分支拿 Cloudflare 預覽連結、把改動 merge 到 main 正式上線、部署後確認、出問題時 rollback。edit-content / add-photo / tweak-style / new-page 改完內容後都接到這 skill 做實際發布。
---

# 發布 / 預覽 / 還原 — publish

> 內容已經改好,剩下「怎麼讓它出現在網站上」。你的工作:用 preview 讓 Ivy 先看、她點頭才正式上線、出事能救回來。

---

## 何時觸發

兩種來源都走這 skill:

**(1) 別的 skill 接過來** — edit-content / add-photo / tweak-style / new-page 改完內容,最後一步「要 preview 還是直接上線」就交給這裡。

**(2) Ivy 直接講** — 講話像這樣:

- 「剛剛那個改好了,發布吧」
- 「先給我看一下,還不要正式上」
- 「這版可以,推上去」
- 「等等,上一版比較好,還原」
- 「網站好像怪怪的,改回去」

**不要走這 skill 的情況**:
- 「網站是不是壞了 / 用量還夠嗎」→ `check-status`
- 還在決定「文字 / 圖 / 顏色要怎麼改」→ 先走對應的內容 skill,改完才回來這裡

---

## 背景:這個網站怎麼上線的

- **Repo**:`verdantwanderlust-studio/verdantwanderlust-studio.github.io`
- **正式網站 = `main` 分支**。任何東西進了 `main`,Cloudflare Pages 會自動重建,約 1-2 分鐘後客人就看得到。
- **preview = 另開一條分支**。改動先放在新分支上,Cloudflare 會幫那條分支單獨建一個「只有你看得到」的預覽網站,網址長得像 `https://<分支名>.verdant-wanderlust.pages.dev`。
- 所有 git 操作(建分支、commit、merge、revert)**你透過 GitHub Connector 做**,Ivy 不碰 git。

> 心智模型講給 Ivy 聽:「preview 是一張影印稿,只有你看得到;`main` 是正式那份。我先給你影印稿,你說 OK 我才換正式的。」

---

## 先決定:要 preview,還是直接上線?

| 情況 | 建議 |
|---|---|
| 首頁、about 的改動(訪客第一眼看到) | **一定 preview** |
| 顏色、字級、間距等視覺改動(全站影響) | **一定 preview** |
| 新頁、新案例(版面要親眼確認) | **一定 preview** |
| 內頁的一兩句文字小修 | 可直接上線,也可 preview |
| Ivy 自己說「先給我看」 | 一定 preview,不要問了直接做 |
| Ivy 自己說「直接上 / 不用看了」 | 尊重她,直接上線 |

拿不準 → 走 preview。preview 只多花 Ivy 一分鐘等待,但省掉「上線後才發現不對」的麻煩。

---

## 情境 A — preview 預覽流程

### A1 — 建 preview 分支

從 `main` 開一條新分支。命名:`preview-<在改什麼>`,用英文 dash,例如:

- `preview-home-headline`
- `preview-add-dazhi-case`
- `preview-warm-primary-color`

### A2 — 把改動 commit 到這條分支

內容 skill 已經決定好「改什麼」,你把那些檔案改動 commit 到 preview 分支(**不是 main**)。

commit message 用白話,讓 Ivy 之後看 check-status 看得懂:

- ✅ `改首頁主標語`
- ✅ `新增大安區陽台案例`
- ❌ `update mdx`、`wip`、`fix`

### A3 — 等 Cloudflare 建好 preview,拿連結

分支一 push,Cloudflare Pages 自動幫它建預覽部署。拿連結的方式:

1. 透過 Connector 看那個 commit 的 deployment / commit status,Cloudflare 會把預覽網址貼在那裡
2. 若一時讀不到,用慣例網址自己組:`https://<分支名>.verdant-wanderlust.pages.dev`

建置時間約 1-2 分鐘。

### A4 — 把連結給 Ivy,講清楚這只是預覽

```
改好了,我放在預覽版,只有你看得到、客人還看不到:

https://preview-home-headline.verdant-wanderlust.pages.dev

大概 1-2 分鐘後打得開。你看一下,
- 可以 → 跟我說「上線」或「OK 發布」,我才換到正式網站
- 想再改 → 直接跟我說哪裡不對
```

### A5 — 依她的回應走

- **她說 OK / 上線** → 進 A6
- **她說要再改** → 回對應的內容 skill 改,改完 commit 到**同一條** preview 分支(不要每改一次開新分支,省 build 次數),再請她重看
- **她說「算了不要了」** → 刪掉這條 preview 分支,`main` 完全沒被動到,等於沒發生過。跟她說「那這次就不動了,正式網站維持原樣」

### A6 — merge 到 main,正式上線

她點頭後,把 preview 分支 merge 進 `main`(開一個 PR 然後 merge,留個紀錄;或直接合併)。

merge 完:

```
已經上線了。Cloudflare 正在重建正式網站,大概 1-2 分鐘後,
客人在 verdantwanderlust.com 上就會看到新版本。

要不要我等一下幫你確認真的更新成功?(走 check-status)
```

merge 後那條 preview 分支可以刪掉,保持乾淨。

---

## 情境 B — 直接上線(小改才用)

確認真的是「內頁小文字、不用預覽」之後:

1. 把改動直接 commit 到 `main`,commit message 一樣用白話
2. 跟 Ivy 說:

```
改好直接上線了。約 1-2 分鐘後正式網站就會更新。
(這次是內頁小修,我沒開預覽。如果你想看,我也可以補一個預覽連結。)
```

只要 Ivy 有一點點「想先看」的意思,就改走情境 A。preview 永遠是比較安全的預設。

---

## 情境 C — 還原 / rollback

Ivy 說「還原」「退回上一版」「改回去」「改壞了救回來」。

### C1 — 確認要還原「哪一次」

不要假設一定是最後一次。先問:

```
好,我幫你還原。確認一下:你是要退回到「[上一次改動的白話描述]」之前的樣子嗎?
還是要退更早?
```

透過 Connector 看 `main` 最近幾個 commit,用白話念給她聽讓她指認。

### C2 — 用 revert 還原

確認後,對那個 commit 做 `git revert`(產生一個新 commit 把它的改動抵銷),push 到 `main`。

**用 revert,不要用 reset 或 force push 去砍歷史。** 理由:`main` 是正式網站的分支,砍歷史會讓紀錄對不上、也讓「再還原回來」變困難。revert 只是「再蓋一層」,安全、可追、可再 revert 回去。

### C3 — 確認還原後的樣子

```
還原好了。Cloudflare 正在重建,1-2 分鐘後正式網站會回到「[還原到的狀態]」。
你打開看一下是不是你要的。如果還是不對,跟我說,我們再往前退。
```

### 緊急狀況:網站整個壞掉、打不開

如果不是「改得不喜歡」而是「網站白屏 / 打不開 / build 紅燈」,revert 也許來不及或救不了。這時:

> 「網站現在打不開,這個我用對話救可能不夠快。Cloudflare 後台有一個『一鍵回到上一個正常版本』的功能,這要請 Jason 進後台操作,我幫你寫個簡短狀況給他。」

然後走「找 Jason」流程。

---

## 邊界(以下要回「這要找 Jason」)

- **改 Cloudflare 設定**:自訂網域、環境變數、build 指令、重新綁定 repo → 後台設定,找 Jason
- **Cloudflare 後台一鍵 rollback**:你只能透過 Connector 動 GitHub,動不了 Cloudflare 後台 → 緊急狀況找 Jason
- **build 一直失敗**:revert 也沒用、preview 也建不起來 → 不要硬試,找 Jason(可順手走 `check-status` 把錯誤資訊抓給他)
- **改 `.github/workflows/`**:部署 / 圖片 pipeline 的設定 → 找 Jason
- **force push、改寫 `main` 歷史、刪 `main`**:任何情況都不做

回應範本:

> 「這部分需要請 Jason 幫忙,我先幫你記下狀況。要不要我寫一個簡短摘要給你轉給他?」

---

## Gotchas(踩雷紀錄)

> 第一次跑 skill,先留著。之後遇到問題寫進來。

### G-1:preview 連結還沒生效就給她

分支 push 完,Cloudflare 要 1-2 分鐘才建好。**先講「大概 1-2 分鐘後打得開」**,不要讓她馬上點、看到 404 以為壞了。

### G-2:改動 commit 到 main 而不是 preview 分支

情境 A 的重點就是「先不要碰 main」。commit 前再確認一次當前分支是 preview 分支,不是 `main`。

### G-3:每次小修都開新分支

Ivy 看完 preview 要再調 → commit 到**原本那條** preview 分支,不要開新的。每次 push 都吃一次 Cloudflare build 額度(每月 500 次),同一條分支重複 push 比較省。

### G-4:merge 完忘記跟她說要等

merge 進 main 後,正式網站不是「立刻」更新,一樣要 1-2 分鐘 build。跟她講清楚,不然她馬上去看舊版會以為沒成功。

### G-5:她說「還原」其實是想「再改一點」

「改回去」有時不是要整個 revert,是「這裡退一點點」。C1 先問清楚:是整個退回上一版,還是只是某個地方想調?後者其實是回內容 skill 微調,不是 rollback。

### G-6:reset / force push 的誘惑

要還原時,reset 看起來更「乾淨」。不要。`main` 是正式網站分支,一律 revert。理由見 C2。

---

## 對話風格 reminder

- 繁體中文,溫暖,step-by-step
- 不用 emoji,不用「打造 / 賦能 / 驅動 / 無縫」
- 「preview = 影印稿、main = 正式那份」這個比喻好用,Ivy 一聽就懂
- 給 preview 連結一定附「1-2 分鐘後才打得開」
- 上線 / 還原都是會被客人看到的動作,**她明確說 OK 才動 main**
- 救網站時不要慌張感染她,平穩說明「這個找 Jason 比較快」就好
