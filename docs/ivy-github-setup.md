# 給 Ivy:怎麼更新網站(三種方式,挑你能用的)

> 設定一次,之後改網站文字不用找人。
> 三種方式由簡到進階。**先看「方式 1」,那個一定能用。**

---

## 你要改的檔案在哪

網站的文字現在都整理成乾淨的小檔案,放在這裡:

| 檔案 | 對應頁面 | 你會改的東西 |
|---|---|---|
| `site/src/content/pages/about.yaml` | 關於我 | 自我介紹文字 |
| `site/src/content/pages/courses.yaml` | 課程 | 課程名稱、介紹、時間地點費用 |
| `site/src/content/pages/contact.yaml` | 聯繫 | Email、電話、地址 |

這些檔長這樣(只改**引號裡的中文字**,其他符號不要動):

```yaml
title: "關於我"
lede: "巴掌大的玻璃裡,裝著一整座會自己呼吸的森林。"
```

---

## 方式 1:GitHub 網頁直接改(一定能用,零安裝)

最穩。只要你會登入 GitHub 就行。

1. 用瀏覽器打開要改的檔案,例如關於頁:
   `https://github.com/verdantwanderlust-studio/verdantwanderlust-studio.github.io/blob/main/src/content/pages/about.yaml`
2. 點右上角的**鉛筆圖示**(Edit)
3. 改**引號裡的中文字**(引號、冒號、縮排都別動)
4. 拉到最下面,點綠色的 **Commit changes**
5. 等 3-5 分鐘,網站自動更新

> 怕改錯?改之前先把原本的字複製貼到記事本,改壞了可以貼回來。

---

## 方式 2:在 Claude 裡對話改(進階,要先設定)

設好之後,你在 Claude Desktop 打字說「幫我把關於頁改成 ⋯⋯」,它就自動幫你改 + 上線。

### 先決條件
- Claude Desktop app,**Pro 或 Max 方案**(免費方案不能加 connector)
- 一個能存取那個專案的 GitHub 帳號

### 第一步:建一把「鑰匙」(GitHub Token)— 只做一次,約 5 分鐘

1. 打開 `https://github.com/settings/personal-access-tokens/new`
2. **Token name**:打 `Claude 更新網站`
3. **Expiration**:選 90 天
4. **Repository access**:選 **Only select repositories** → 搜尋並勾選
   `verdantwanderlust-studio/verdantwanderlust-studio.github.io`
5. **Permissions** 只需改這兩項:
   - **Contents** → **Read and write**
   - **Metadata** → **Read-only**(通常會自動勾上)
   - 其他全部不用動
6. 點最下面 **Generate token**
7. **把那串 `github_pat_...` 複製起來**,貼到記事本暫存

### 第二步:在 Claude Desktop 加 connector

1. 開 Claude Desktop → 左下角頭像 → **Settings** → **Connectors**
2. 點 **Add custom connector**
3. URL 貼:`https://api.githubcopilot.com/mcp/`
4. 照畫面指示用 GitHub 登入授權(或貼上第一步的 token)
5. 完成後**重開 Claude Desktop**

### 第三步:測試

在對話打:

```
幫我看一下 verdant 那個專案,about.yaml 現在的內容是什麼?
```

它讀得到 → 成功。再試「幫我把 lede 改成 ⋯⋯,然後 commit 到 main」。

### 如果第二步出現「無法連線 / 不支援 / not available」

代表你的 GitHub 帳號還沒被開通這個功能(目前限量中)。**別卡在這** —— 直接用上面的**方式 1**,一樣能更新網站。要對話式的話,把這份指南的「方式 3」轉給 Jason。

---

## 方式 3:本機 server(給 Jason 一次性設定用)

> 這段是給工程師看的。Ivy 不用懂。

remote connector 還在限量,要保證 Ivy 能用「對話式」,改用 local GitHub MCP server:

Claude Desktop 設定檔(macOS):
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/github-mcp-server@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "github_pat_在這裡貼上"
      }
    }
  }
}
```

- 需要 Ivy 機器有 Node.js(`npx`)
- token 用同一把 fine-grained PAT(限該 repo、Contents 讀寫)
- 存好後重開 Claude Desktop,Settings → Connectors 應看到 `github` 已啟用
- 這條不依賴限量 rollout、保證可用,代價是要編一次 JSON + 裝 Node

---

## 重點提醒

- **不論哪種方式,Pages 都會在 push 後 3-5 分鐘自動上線**,你不用做別的。
- 改 YAML 只動**引號裡的中文**,符號別碰。
- 改完不確定有沒有成功 → 對話問 Claude「有上線嗎」,或開網站重整看看。
- 真的卡住 → 找 Jason,不丟臉。
