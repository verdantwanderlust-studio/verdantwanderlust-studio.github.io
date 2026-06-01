# PAT 設定教學 —— 讓 Ivy 用對話改網站

> **給 AI 助理的指示**:這份是你(Ivy 的 AI)用來**一步一步引導 Ivy** 完成設定的腳本。
> 規則:① 一次只帶一步,做完等她回「好了」再下一步 ② 全程白話,她是非工程師 ③ 不要把整份貼給她看,你自己讀、你來帶。

---

## 背景(給 AI,不用唸給她聽)

- 目標:讓 Ivy 在自己的 Claude Desktop 裡打字說「幫我把某頁改成⋯⋯」,就能自動更新網站。
- 機制:Claude Desktop 掛一個 GitHub MCP server,用一把 PAT(權杖)當鑰匙,直接寫進 repo;GitHub Pages 會自動上線。
- repo:`verdantwanderlust-studio/verdantwanderlust-studio.github.io`
- 她要改的文字都在 `src/content/pages/*.yaml`(乾淨的 YAML,只改引號裡的中文)。
- 這條路**不需要建 GitHub App、不需要填任何 URL**,只用 PAT。

---

## 步驟 1:建一把鑰匙(PAT)

跟 Ivy 說(白話):「我們先去 GitHub 拿一把『鑰匙』,只做一次,大概五分鐘。」

帶她做:

1. 用瀏覽器打開:`https://github.com/settings/personal-access-tokens/new`
   (若她沒登入 → 先請她用她的 GitHub 帳號登入)
2. **Token name** 欄:打 `Claude 改網站`
3. **Expiration**:選 `90 days`
4. **Repository access**:點 **Only select repositories**,在出現的搜尋框選
   `verdantwanderlust-studio/verdantwanderlust-studio.github.io`
5. 往下到 **Permissions** → **Repository permissions**,找這兩個:
   - **Contents** → 右邊下拉選 **Read and write**
   - **Metadata** → 會自動變 **Read-only**(不用動)
   - 其他全部不要碰
6. 拉到最下面,點綠色 **Generate token**
7. 畫面會出現一串 `github_pat_⋯⋯`。**請她整串複製,貼到記事本暫存**
   (提醒:這串等於密碼,別傳給別人、別截圖到公開的地方)

→ 等她說「拿到了」再繼續。

---

## 步驟 2:確認電腦有 Node.js

跟她說:「設定需要一個小工具叫 Node,我們先看你電腦有沒有。」

請她開 **終端機**(Terminal,在「應用程式 → 工具程式」裡),貼上這行按 Enter:

```
node -v
```

- 有出現像 `v20.x.x` 的數字 → 有了,跳到步驟 3。
- 出現 `command not found` → 還沒裝。請她到 `https://nodejs.org` 下載 **LTS** 版,一直下一步裝完,再回來重跑 `node -v`。

→ 確認有 Node 再繼續。

---

## 步驟 3:把鑰匙貼進 Claude 設定檔

跟她說:「最後一步,把鑰匙放進 Claude 的設定。」

1. 開 **Finder**,按 `Cmd + Shift + G`,貼上這個路徑按 Enter:
   ```
   ~/Library/Application Support/Claude
   ```
2. 找 `claude_desktop_config.json`:
   - 有 → 用文字編輯程式打開
   - 沒有 → 新建一個檔,檔名就叫 `claude_desktop_config.json`
3. 把下面整段貼進去,**把 `github_pat_在這裡貼上` 換成步驟 1 那串鑰匙**:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "github_pat_在這裡貼上"
      }
    }
  }
}
```

4. 存檔。
5. **完全關掉 Claude Desktop,再重新打開**(很重要,不重開不會生效)。

→ 等她重開完。

---

## 步驟 4:測試

請她在 Claude Desktop 對話框打:

```
讀一下 verdantwanderlust-studio.github.io 這個 repo 的 src/content/pages/about.yaml,內容是什麼?
```

- 讀得到內容 → **成功**。再讓她試:「幫我把 about.yaml 的 lede 改成『⋯⋯』,然後 commit 到 main。」改完 3–5 分鐘網站自動更新。
- 讀不到 / 報錯 → 看下面「卡住的話」。

---

## 卡住的話(給 AI 排查)

| 狀況 | 處理 |
|---|---|
| 對話說沒有 github 工具 | 設定檔沒生效 → 確認 JSON 沒打錯(逗號、引號),重存、再完全重開 Claude |
| 報 401 / 沒權限 | PAT 權限不對 → 回步驟 1 確認 Contents 是 Read and write、有勾到那個 repo |
| `npx` 找不到 | Node 沒裝好 → 回步驟 2 |
| 90 天後突然不能用 | PAT 過期 → 回步驟 1 重建一把,換掉設定檔裡那串 |

---

## 她平常怎麼用(設定好之後)

跟 Ivy 說:「之後你只要這樣講就好——」

```
幫我把關於頁的自我介紹改成:⋯⋯
幫我把課程頁第一堂的費用改成 1800
首頁那句標語換成:⋯⋯
```

你(AI)會自動找到對的 `.yaml`、改好、commit。她不用碰任何程式,網站幾分鐘後自己更新。
