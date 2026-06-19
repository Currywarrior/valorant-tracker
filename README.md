# VAL TRACKER

> 追蹤你的每日商店、收藏價值與對戰紀錄的 Valorant 個人網頁追蹤器

**Live Demo** → [valorant-tracker-production-5cfa.up.railway.app](https://valorant-tracker-production-5cfa.up.railway.app)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 每日商店 | 即時查看今日四張商店皮膚，2×2 大圖、稀有度色條，**翻牌揭曉動畫**（一張張掀開，命中心願清單時紅光脈動＋音效） |
| 皮膚預覽 | 點皮膚看大圖與各等級官方展示影片，**預設播放擊殺終結特效（Finisher）**，每個等級附中文解鎖說明、影片音量控制 |
| 商店歷史智慧分析 | 每日商店卡片標示「上次出現幾天前 / 首次登場 / 共出現幾次」 |
| 心願清單命中通知 | 商店有心願清單皮膚時，頂部顯示紅色 Banner 提醒 |
| 對戰數據視覺化 | 勝率、平均 K/D、爆頭率、平均 ACS、最常用角色，加上**角色使用分布、地圖勝率橫條圖與最近 K/D 走勢折線**（純前端 SVG/CSS 繪製） |
| 歷史記錄 | 過去每日商店的皮膚紀錄，依日期分組 |
| 收藏統計 | 全收藏市場價值 VP 估算、實際花費估算、已用 RP 計算 |
| 組合包庫 | 歷代組合包瀏覽，依主題列出包含的皮膚、掛件、塗鴉 |
| AI 教練點評 | 「號外」戰報內串接 **Gemini** 依你的戰績生成個人化建議（需設定 `GEMINI_API_KEY`，未設定則自動降級隱藏） |
| 號外今日戰報 | 把你的戰績包裝成趣味報紙頭條（依連勝／連敗／勝率動態生成），附 AI 教練點評 |
| Toast 通知 | 加入／移除心願清單等操作有即時提示 |
| 背景音樂 | 五屆 Champions 主題曲播放器（2021–2025） |
| 互動彩蛋 | 角色語音、Agent Peek、準心動畫等 |
| 多用戶支援 | 每人用自己的 Riot 帳號登入，資料完全隔離 |

---

## 技術架構

```
Frontend                 Backend (Railway)       外部 API
──────────────           ─────────────────       ───────────────────────────────
HTML / CSS               Node.js + Express       auth.riotgames.com
Vanilla JS               express-session         pd.{shard}.a.pvp.net
SVG / CSS 圖表           express-rate-limit      valorant-api.com
電競風 UI（clip-path）    axios                   api.henrikdev.xyz
Web Audio（音效）         dotenv                  generativelanguage.googleapis.com（Gemini）
```

**部署平台：** Railway（自動從 GitHub 部署；靜態資源設 `Cache-Control: no-cache` 破除瀏覽器舊快取）  
**Session 儲存：** 預設伺服器記憶體（MemoryStore），重啟後清除；設定 `DATA_DIR` 後改用 session-file-store 持久化（重啟不需重登）  

---

## 介面與工程做法

- **電競硬核 UI**：紅黑配色、按鈕切角（clip-path）＋ hover 掃光／發光，全站按鈕統一設計語言；每日商店翻牌揭曉、皮膚卡偽 3D 傾斜等微互動。
- **武器圖清晰度**：valorant-api 的皮膚圖固定 512px 寬（無更高清來源），為避免大螢幕放大造成模糊，每日商店圖限制顯示寬度（`max-width: min(88%, 560px)`）把放大倍率壓到約 1.1x，並以 SVG `feConvolveMatrix` 輕度銳化補償細節。
- **純前端圖表**：對戰數據的角色分布、地圖勝率（CSS 橫條）與 K/D 走勢（SVG 折線）皆自行繪製，未引入任何圖表函式庫。
- **效能**：滑鼠互動以 `requestAnimationFrame` 節流；支援 `prefers-reduced-motion`，系統設定減少動態時自動關閉動畫。
- **快取破除**：`express.static` 對 html/css/js 設 `Cache-Control: no-cache` 搭配 etag，改動後一般刷新即拿到新版、未改動回 304。
- **分享預覽**：`<head>` 內建 Open Graph / Twitter Card 與 favicon，貼到 Discord／社群會顯示預覽卡。
- **AI 教練防濫用**：`/api/coach` 每人每天只呼叫 Gemini 一次並快取；未設 `GEMINI_API_KEY` 時優雅降級。

---

## 登入原理深度解析

> 這個專案的登入機制不是傳統帳密，而是利用 Riot 的 OAuth Implicit Flow。  
> 以下完整說明背後的運作邏輯。

### 三個角色

```
你的瀏覽器   ←→   Riot 伺服器   ←→   我們的 Railway 伺服器
```

這三者之間的關係決定了整個登入流程的設計。

---

### 完整流程逐步拆解

#### Step 1 — 點下「以 Riot 帳號登入」

我們的網站把瀏覽器送到 Riot 官方的授權頁面：

```
https://auth.riotgames.com/authorize
  ?client_id=play-valorant-web-prod
  &response_type=token id_token
  &redirect_uri=https://playvalorant.com/opt_in
  &scope=account openid
```

這一步我們只是「開門」，後面發生的事完全是 Riot 的伺服器在處理。

---

#### Step 2 — 瀏覽器已有 Riot 的 Cookie

你平常玩遊戲或上 playvalorant.com，Riot 會在你的瀏覽器放一個 **cookie**，代表「這台電腦已驗證為某個帳號」。

Riot 看到這個 cookie，直接認出你是誰，不需要重新輸入帳密。  
（如果 cookie 過期或換電腦，這裡才會出現帳密輸入框。）

這個機制叫 **Single Sign-On（SSO）**，Google 登入、Apple 登入都是同樣原理。

---

#### Step 3 — Riot 把 Token 塞進網址，叫瀏覽器跳頁

Riot 確認你的身份後，要把「通行證（access token）」交給你的瀏覽器。

交付方式是 HTTP **302 Redirect**：

```
HTTP/1.1 302 Found
Location: https://playvalorant.com/opt_in#access_token=eyJra...&expires_in=3600
```

瀏覽器收到 302，自動跳去那個網址。**Token 就夾在 `#` 後面帶過去。**

> **為什麼是塞進網址，不能直接傳？**
>
> Riot 跟瀏覽器之間只有「網頁跳轉」這個溝通管道。  
> 就像超商取貨，店員不能飛到你家送貨，只能說「你的東西在第 13 號格子」。  
> 網址就是那個格子號碼，token 就是裡面的貨。

---

#### Step 4 — playvalorant.com 回傳 404，但 Token 不受影響

瀏覽器跳到 `playvalorant.com/opt_in` 後，那個頁面根本不存在，所以顯示 404。

但這完全無所謂，原因是：

**`#` 後面的內容（fragment）根本不會被傳給 web server。**

HTTP 規範規定：fragment 是給瀏覽器用的，不屬於 HTTP 請求的一部分。  
Server 只看到 `playvalorant.com/opt_in`，看不到 `#access_token=...`。

```
瀏覽器發出的請求：  GET /opt_in          ← 只有這段
網址列顯示的：      /opt_in#access_token=eyJra...  ← 但這段留在瀏覽器裡
```

所以 404 是「頁面不存在」，跟 token 是完全獨立的兩件事。  
**Token 安全存在你的網址列，沒有任何人拿走它。**

---

#### Step 5 — 你複製網址，貼回我們的網站

我們的前端解析 URL：

```javascript
const hash = url.split('#')[1];                   // 取 # 後面
const params = new URLSearchParams(hash);          // 解析成 key-value
const accessToken = params.get('access_token');    // 拿到 token
```

然後把 token 傳給我們的 Railway 伺服器。

---

#### Step 6 — 伺服器拿 Token 去問 Riot 你是誰

```
Railway Server → Riot API：
GET https://auth.riotgames.com/userinfo
Authorization: Bearer eyJra...

Riot API → Railway Server：
{
  "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  // 你的 puuid
  "acct": {
    "game_name": "NiaLeoLu",
    "tag_line": "TW1"
  }
}
```

Token 就像一張臨時員工證：

> 「持證者已經過 Riot 驗證，有效期一小時。  
>  請憑此證向各 API 服務查詢持證者的帳號資料。」

伺服器認出你是誰後，把你的資訊存進 session，之後所有 API 請求（商店、收藏、對戰紀錄）都以你的身份去問 Riot 要資料。

---

### 為什麼需要手動複製貼上？

因為 Riot 只允許 token 跳轉到它事先認可的網址（`redirect_uri`）。  
目前認可的只有 `playvalorant.com/opt_in`，我們的 Railway 網址不在清單裡。

如果能把 `redirect_uri` 設成我們自己的網址，token 就能自動跳回來，完全不需要手動複製。

**這需要成為 Riot 的官方合作夥伴才能做到。**  
tracker.gg 等官方認可的追蹤器就是這樣實作的，所以他們的登入完全自動。

---

### 關於 Token 的安全性

- Token 只在 HTTPS 下傳輸，不會被中間人攔截
- Token 儲存在伺服器 session，不存在瀏覽器 localStorage
- 登入網址輸入框設 `autocomplete="off"`，含一次性 Token 的登入網址不會被瀏覽器存進自動填入歷史
- Token 有效期約一小時，過期後需重新登入
- **我們的伺服器從不儲存帳號密碼**，密碼只存在你的瀏覽器和 Riot 之間

---

## 本地啟動

```bash
# 1. Clone 專案
git clone https://github.com/Currywarrior/valorant-tracker.git
cd valorant-tracker

# 2. 安裝依賴
npm install

# 3. 建立 .env（複製範本並填入你的 API key）
cp .env.example .env

# 4. 啟動（開發模式，有 hot reload）
npm run dev

# 或正式啟動
npm start
```

開啟 http://localhost:3000

---

## 環境變數

| 變數名稱 | 必填 | 說明 |
|---------|------|------|
| `HENRIK_API_KEY` | 是 | 對戰紀錄／MMR 用。從 [developers.henrikdev.xyz](https://developers.henrikdev.xyz/) 免費申請 |
| `SESSION_SECRET` | 是 | 隨機字串，用於加密 session。產生方式：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | 否 | AI 教練點評用。未設定時教練功能自動降級隱藏，其他功能完全不受影響 |
| `DATA_DIR` | 否 | 持久化開關。設為掛載 Volume 的路徑（如 `/data`）後，session 與 store-history 改寫入該目錄、重啟不消失；未設定則用記憶體 |
| `NODE_ENV` | 否 | 設為 `production` 時啟用 HTTPS-only cookie |
| `PORT` | 否 | 伺服器 port，預設 3000 |

### 如何取得 `GEMINI_API_KEY`（AI 教練，免費）

AI 教練點評串接 Google Gemini，免費額度對個人用途綽綽有餘（後端設計成每人每天只呼叫一次並快取，避免超量）。

1. 前往 [aistudio.google.com](https://aistudio.google.com)（Google AI Studio），用 Google 帳號登入。
2. 左側選單點「**Get API key**」→「**Create API key**」。
3. 專案選現有的、或讓它在新專案中自動建立即可；生成後複製整串金鑰。
   > 新版金鑰是 `AQ.` 開頭的格式（不是舊的 `AIzaSy`），兩種都正常可用。
4. **本機**：在專案根目錄 `.env` 加一行 `GEMINI_API_KEY=你的金鑰`，存檔後**重啟 server**（`.env` 只在啟動時讀取，不重啟不會生效）。
5. **線上（Railway）**：見下方部署說明，在 Variables 加一個同名變數。

> 後端模型使用固定版號 `gemini-2.5-flash`。原本用滾動別名 `gemini-flash-latest`，但該別名會跟到負載較重的最新版，實測會間歇回 503（模型過載）導致教練「暫時休息中」，故改用固定版號較穩定。若該型號失效或配額用盡（429），改 `server.js` 內 `/api/coach` 的型號字串即可。
>
> **安全提醒**：`.env` 已被 `.gitignore` 排除、不會上傳到 GitHub；金鑰請勿寫進程式碼或公開貼出，若不慎外洩可到 AI Studio 刪除重建。

---

## Railway 部署

1. Fork 或 clone 此 repo 到你的 GitHub
2. 前往 [railway.app](https://railway.app)，New Project → Deploy from GitHub Repo
3. 選擇此 repo
4. 在 Variables 頁面設定環境變數：
   - 必填：`HENRIK_API_KEY`、`SESSION_SECRET`、`NODE_ENV=production`
   - 選填：`GEMINI_API_KEY`（要啟用 AI 教練就加，值同本機 `.env` 那把）
5. Settings → Networking → Generate Domain 取得公開網址
6. （選用）要讓 session 與商店歷史**重啟後不消失**：在 service 掛載一個 Volume（Mount Path 設 `/data`），再把環境變數 `DATA_DIR` 設為 `/data`。Volume 需 Railway 付費方案。

每次 push 到 GitHub 會自動重新部署；改動 Variables 也會觸發重新部署。

---

## 已知限制

- **每日商店登入需手動複製貼上 URL**（見上方登入原理說明）
- **未設 `DATA_DIR` 時，伺服器重啟後 session 與商店歷史會清除**，需重新登入；掛載 Volume 並設 `DATA_DIR` 即可持久化
- **組合包配件不完整**：valorant-api 對掛件／噴漆／卡片大多沒提供「所屬組合包」的對應資料（`themeUuid` 多為空），組合包內容主要靠主題歸類、無法保證每包配件齊全；武器皮膚則 100% 完整
- **皮膚展示影片由 Riot 官方提供**：每個等級只有一支影片，擊殺特效是單殺或五殺由官方拍攝決定，程式無法更改或自動區分
- **AI 教練需自備 `GEMINI_API_KEY`**，且每人每天僅生成一次（快取，省額度）；未設定金鑰時該功能自動隱藏
