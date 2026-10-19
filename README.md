# VAL TRACKER

> 追蹤你的每日商店、收藏價值與對戰紀錄的 Valorant 個人網頁追蹤器

**Live Demo** → [valorant-tracker-qigk.onrender.com](https://valorant-tracker-qigk.onrender.com)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 每日商店 | 即時查看今日四張商店皮膚，2×2 大圖、稀有度色條，**翻牌揭曉動畫**（一張張掀開，命中心願清單時紅光脈動＋音效） |
| 皮膚預覽 | 點皮膚看大圖與各等級官方展示影片，**預設播放擊殺終結特效（Finisher）**，每個等級附中文解鎖說明、影片音量控制 |
| 商店歷史智慧分析 | 每日商店卡片標示「上次出現幾天前 / 首次登場 / 共出現幾次」 |
| 心願清單命中通知 | 商店有心願清單皮膚時，頂部顯示紅色 Banner 提醒 |
| 對戰紀錄 | 一場一張卡：地圖背景、特務、K/D/A、ACS、台灣時間 |
| 分析頁 | 分成**總覽／對槍／隊伍／特務與武器**四個子分頁；主視覺有勝率環、自動結論句（攻守差距、主場與苦手圖）、K/D・ADR・ACS・爆頭率，主色跟著最常用特務的代表色變 |
| 對戰累積 | 每場壓成約 1.5KB 摘要存進 **MongoDB Atlas**，分析不再只看最近 10 場；搭配 cron-job.org 每 3 小時自動幫登入過的玩家抓新場次 |
| 亮點卡 | 最佳一場（ACS 最高）、招牌特務、招牌槍（顯示自己**目前裝備的造型**） |
| RR 走勢 | 段位分數折線＋每場加減 RR 柱狀、淨 RR、最長連勝；RR 紀錄同樣存進資料庫累積 |
| 對槍分析 | 玩家風格雷達（槍法／輸出／開局／生存／收割）、攻守勝率、首殺 vs 首死、**經濟局勝率**（手槍／省錢／半起／全起）、多殺、K/D 走勢 |
| 最佳拍檔 | 依組隊紀錄列出最常一起打的人與各自勝率，以及單排 vs 組隊勝率 |
| 特務與武器 | 特務立繪卡（勝率、K/D）、地圖卡（官方地圖圖片）、武器擊殺分布 |
| 玩家資訊列 | 玩家卡背景、頭像與帳號等級、段位 RR 進度條、VP／RP 餘額 |
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
Frontend                 Backend (Render)        外部 API
──────────────           ─────────────────       ───────────────────────────────
HTML / CSS               Node.js + Express       auth.riotgames.com
Vanilla JS               express-session         pd.{shard}.a.pvp.net
SVG / CSS 圖表           express-rate-limit      valorant-api.com
電競風 UI（clip-path）    axios                   api.henrikdev.xyz
Web Audio（音效）         mongodb                 generativelanguage.googleapis.com（Gemini）
                         dotenv                  MongoDB Atlas（對戰摘要、RR 紀錄）

cron-job.org --每 10 分鐘--> /api/cron/collect --每 3 小時一輪--> Henrik --> Atlas
```

**部署平台：** Render 免費方案（push 到 master 自動部署；靜態資源設 `Cache-Control: no-cache` 破除瀏覽器舊快取）  
**資料庫：** MongoDB Atlas M0（選用）；集合 `match_summaries`、`players`、`rr_history`，未設 `MONGODB_URI` 時自動退回只看最近 10 場  
**Session 儲存：** 預設伺服器記憶體（MemoryStore），重啟後清除；設定 `DATA_DIR` 後改用 session-file-store 持久化（重啟不需重登）  

---

## 介面與工程做法

- **電競硬核 UI**：紅黑配色、按鈕切角（clip-path）＋ hover 掃光／發光，全站按鈕統一設計語言；每日商店翻牌揭曉、皮膚卡偽 3D 傾斜等微互動。
- **武器圖清晰度**：valorant-api 的皮膚圖固定 512px 寬（無更高清來源），為避免大螢幕放大造成模糊，每日商店圖限制顯示寬度（`max-width: min(88%, 560px)`）把放大倍率壓到約 1.1x，並以 SVG `feConvolveMatrix` 輕度銳化補償細節。
- **純前端圖表**：勝率環、風格雷達、RR 走勢、K/D 走勢（SVG）與各種橫條皆自行繪製，未引入任何圖表函式庫。
- **對戰摘要**：Henrik 一場完整資料約 900KB（大多是擊殺座標），後端 `match-store.js` 只抽分析要用的欄位壓成約 1.5KB 再存，512MB 免費額度可存數十萬場；攻守方由「紅隊上半場進攻」推算，手槍局看回合位置、其餘依全隊裝備價值分類。
- **特務主題色**：分析頁所有重點色走 CSS 變數 `--theme`，由前端依最常用特務設定（例如 Fade 藍紫、Phoenix 橘）。
- **Riot API 版本容錯**：`personalization/v2/playerloadout` 在正式站回 404，`fetchLoadout()` 改為 v3、v2 依序嘗試並回報各版本狀態碼。
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
你的瀏覽器   ←→   Riot 伺服器   ←→   我們的 Render 伺服器
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

然後把 token 傳給我們的 Render 伺服器。

---

#### Step 6 — 伺服器拿 Token 去問 Riot 你是誰

```
Render Server → Riot API：
GET https://auth.riotgames.com/userinfo
Authorization: Bearer eyJra...

Riot API → Render Server：
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
目前認可的只有 `playvalorant.com/opt_in`，我們的 Render 網址不在清單裡。

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
| `MONGODB_URI` | 否 | MongoDB Atlas 連線字串。設定後每場對戰的摘要（約 1.5KB）會存起來，分析頁可累積超過 10 場；未設定則只看最近 10 場 |
| `CRON_SECRET` | 否 | 定時抓取 `/api/cron/collect?key=...` 的密鑰。搭配 cron-job.org 每 10 分鐘呼叫，後端每 3 小時幫登記過的玩家抓一次新場次，也讓 Render 不休眠 |
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
5. **線上（Render）**：見下方部署說明，在 Environment 加一個同名變數。

> 後端模型使用固定版號 `gemini-2.5-flash`。原本用滾動別名 `gemini-flash-latest`，但該別名會跟到負載較重的最新版，實測會間歇回 503（模型過載）導致教練「暫時休息中」，故改用固定版號較穩定。若該型號失效或配額用盡（429），改 `server.js` 內 `/api/coach` 的型號字串即可。
>
> **安全提醒**：`.env` 已被 `.gitignore` 排除、不會上傳到 GitHub；金鑰請勿寫進程式碼或公開貼出，若不慎外洩可到 AI Studio 刪除重建。

---

## 部署（Render + MongoDB Atlas + cron-job.org，全部免費）

### 1. Render

1. Fork 或 clone 此 repo 到你的 GitHub
2. 前往 [render.com](https://render.com)，New → Web Service → 選這個 repo
3. Region 選 Singapore；**Instance Type 預設勾的是付費方案，要手動改成 Free**
4. Build Command `npm install`、Start Command `npm start`
5. Environment 設定變數：
   - 必填：`HENRIK_API_KEY`、`SESSION_SECRET`、`NODE_ENV=production`
   - 選填：`GEMINI_API_KEY`、`MONGODB_URI`、`CRON_SECRET`（見下面兩步）
   - `PORT` 不用填（Render 自己給）；`DATA_DIR` 不用填（免費方案沒有永久硬碟）

每次 push 到 GitHub 會自動重新部署；改動環境變數也會觸發重新部署。

### 2. MongoDB Atlas（選用，讓分析頁累積超過 10 場）

1. 到 [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) 註冊，建立 **M0 Free** 叢集，Provider 選 AWS、Region 選 Singapore；不要勾 Preload sample dataset
2. Database Access 建一個使用者並記下密碼
3. Network Access → IP Access List 加 `0.0.0.0/0`（Render 免費方案沒有固定 IP，不開會連不上）
4. Connect → Drivers → Node.js，複製 `mongodb+srv://...` 連線字串，把 `<db_password>` 換成密碼，填進 Render 的 `MONGODB_URI`

### 3. cron-job.org（選用，自動抓新場次＋讓網站不休眠）

1. `CRON_SECRET` 設一串隨機字串（產生方式同 `SESSION_SECRET`）
2. 到 [cron-job.org](https://console.cron-job.org/signup) 註冊，建立一個每 10 分鐘執行的任務，URL 填：
   `https://你的網址.onrender.com/api/cron/collect?key=你的CRON_SECRET`
3. 後端每次被呼叫時，距上次抓取未滿 3 小時就直接回 `TOO_SOON`（只是保持清醒），滿 3 小時才真的去 Henrik 抓一輪

Render 免費方案每月 750 小時，一個服務 24 小時醒著約 744 小時，剛好夠用；同一個帳號不要再開第二個免費服務。

---

## 已知限制

- **每日商店登入需手動複製貼上 URL**（見上方登入原理說明）
- **未設 `DATA_DIR` 時，伺服器重啟後 session 與商店歷史會清除**，需重新登入；Render 免費方案每次部署都會重啟，所有人都要重新登入
- **Henrik 一次只給最近 10 場對戰、20 筆 RR**：更早的資料要靠 Atlas 從設定那天起慢慢累積；後來才加的欄位（組隊、經濟局）只有新場次和還在最近 10 場內的會補到
- **所有人共用同一把 `HENRIK_API_KEY`**：免費金鑰每分鐘 30 次，幾個人用沒問題，人很多同時刷新時可能暫時抓不到對戰
- **組合包配件不完整**：valorant-api 對掛件／噴漆／卡片大多沒提供「所屬組合包」的對應資料（`themeUuid` 多為空），組合包內容主要靠主題歸類、無法保證每包配件齊全；武器皮膚則 100% 完整
- **皮膚展示影片由 Riot 官方提供**：每個等級只有一支影片，擊殺特效是單殺或五殺由官方拍攝決定，程式無法更改或自動區分
- **AI 教練需自備 `GEMINI_API_KEY`**，且每人每天僅生成一次（快取，省額度）；未設定金鑰時該功能自動隱藏
