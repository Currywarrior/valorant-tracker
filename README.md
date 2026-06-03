# VAL TRACKER

> 追蹤你的每日商店、收藏價值與對戰紀錄的 Valorant 個人網頁追蹤器

**Live Demo** → [valorant-tracker-production-5cfa.up.railway.app](https://valorant-tracker-production-5cfa.up.railway.app)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 每日商店 | 即時查看今日四張商店皮膚，2×2 大圖排列，稀有度顏色標示 |
| 心願清單命中通知 | 商店有心願清單皮膚時，頂部顯示紅色 Banner 提醒 |
| 收藏統計 | 全收藏市場價值 VP 估算、實際花費估算、已用 RP 計算 |
| 組合包庫 | 所有歷代組合包瀏覽，含皮膚、掛件、塗鴉清單 |
| 對戰紀錄 | 近期對戰結果、KDA、使用角色、地圖 |
| 背景音樂 | 五屆 Champions 主題曲播放器（2021–2025） |
| 多用戶支援 | 每人用自己的 Riot 帳號登入，資料完全隔離 |

---

## 技術架構

```
Frontend          Backend (Railway)       Riot / 外部 API
─────────         ─────────────────       ──────────────────
HTML / CSS        Node.js + Express       auth.riotgames.com
Vanilla JS        express-session         pd.{shard}.a.pvp.net
                  express-rate-limit      valorant-api.com
                  axios                   api.henrikdev.xyz
```

**部署平台：** Railway（自動從 GitHub 部署）  
**Session 儲存：** 伺服器記憶體（MemoryStore），重啟後 session 會清除  

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
| `HENRIK_API_KEY` | 是 | 從 [developers.henrikdev.xyz](https://developers.henrikdev.xyz/) 免費申請 |
| `SESSION_SECRET` | 是 | 隨機字串，用於加密 session。產生方式：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | 否 | 設為 `production` 時啟用 HTTPS-only cookie |
| `PORT` | 否 | 伺服器 port，預設 3000 |

---

## Railway 部署

1. Fork 或 clone 此 repo 到你的 GitHub
2. 前往 [railway.app](https://railway.app)，New Project → Deploy from GitHub Repo
3. 選擇此 repo
4. 在 Variables 頁面設定 `HENRIK_API_KEY`、`SESSION_SECRET`、`NODE_ENV=production`
5. Settings → Networking → Generate Domain 取得公開網址

每次 push 到 GitHub 會自動重新部署。

---

## 已知限制

- **每日商店登入需手動複製貼上 URL**（見上方登入原理說明）
- **伺服器重啟後 session 清除**，需重新登入
- **store-history.json 在 Railway 重啟後消失**（需掛載 Volume 才能持久化）
