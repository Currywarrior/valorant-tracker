require('dotenv').config();
const express = require('express');
const expressSession = require('express-session');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1); // 部署在 Nginx / Railway / Render 後面時正確取得 IP
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // html/css/js 每次都向伺服器驗證（配合 etag，沒改回 304、改了拿新版），避免使用者看到舊快取
    if (/\.(html|css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// 資料持久化目錄：設了 DATA_DIR（在 Railway 掛載持久磁碟後）才啟用持久化；
// 未設定時 DATA_DIR 退回專案目錄，一切行為與原本完全相同。
const DATA_DIR = process.env.DATA_DIR || __dirname;

// 只有掛了持久磁碟（有 DATA_DIR）時，才把 session 改存成檔案，讓重啟後不用重登。
// 未設定時 sessionStore 為 undefined，express-session 自動沿用原本的 MemoryStore。
let sessionStore;
if (process.env.DATA_DIR) {
  const FileStore = require('session-file-store')(expressSession);
  sessionStore = new FileStore({
    path: path.join(DATA_DIR, 'sessions'),
    ttl: 2 * 60 * 60, // 秒，對齊 cookie 的 2 小時有效期
    retries: 1,
    logFn: () => {},  // 靜音，避免大量讀寫日誌洗版
  });
}

app.use(expressSession({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 2 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production', // HTTPS 才設 Secure flag
    httpOnly: true,
    sameSite: 'lax',
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘視窗
  max: 10,                   // 同一 IP 最多嘗試 10 次
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS' },
});

const HENRIK_API_KEY = process.env.HENRIK_API_KEY || '';
const VP_CURRENCY = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
const RP_CURRENCY = 'e59aa87c-4cbf-517a-5983-6e81511be9b7';
const STORE_HISTORY_PATH = path.join(DATA_DIR, 'store-history.json');
const SKIN_LEVEL_TYPE        = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const SKIN_LEVEL_TYPE_LEGACY = 'bcef87d6-209b-46ab-8428-492203e274d8';
const SKIN_CHROMA_TYPE       = '3ad1b2b2-acdb-4524-852f-954a76ddae0a';

// 取當前使用者的 Riot session（不存在時回傳空物件）
function getRiot(req) {
  return req.session.riot || {};
}

const TIER_SKIN_VP = {
  'e046854e-406c-37f4-6607-19a9ba8426fc': 2475,
  '411e4a55-4e59-7757-41f0-86a53f101bb5': 2175,
  '60bca009-4182-7998-dee7-b8a2558dc369': 1775,
  '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 1275,
  '12683d76-48d7-84a3-4e09-6985794f0445': 875,
};
const MELEE_WEAPON_UUID = '2f59173c-4bed-b6c3-2191-dea9b58be9c7';
const MELEE_TIER_VP = {
  'e046854e-406c-37f4-6607-19a9ba8426fc': 3550,
  '411e4a55-4e59-7757-41f0-86a53f101bb5': 2675,
  '60bca009-4182-7998-dee7-b8a2558dc369': 2175,
  '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 1275,
  '12683d76-48d7-84a3-4e09-6985794f0445': 875,
};

const BUNDLE_PATCH_MAP = {
  'duo s day duckling duo': 1209, 'duo s day odd egg': 1209,
  'kuronami v26': 1208,
  'holo meridian': 1207,
  'jellybeam': 1206, 'vct26 team capsules fs nv pcf vl': 1206,
  'blackthorn': 1205,
  'silkleaf': 1204,
  'hatchbudz quacked series': 1203, 'vct 2026 season': 1203,
  'run it back lunar 26': 1202, 'solarstride': 1202,
  'run it back reaver': 1201, 'reaver v26': 1201,
  'vct26 team capsules': 1200, 'ayakashi': 1200,
  'run it back v25': 1111, 'cookie kit': 1111, 'mystbloom v25': 1111,
  'ora by onetap': 1110,
  'nanomight': 1109,
  'dolmir s revenge': 1108,
  'wasteland v25': 1107,
  'frgmt x wngmn': 1106, 'prelude to chaos v25': 1106,
  'champions 2025': 1105,
  'bubblegum deathwish': 1104,
  'splashx': 1102,
  'rupture': 1100, 'phaseguard': 1100,
  'valorant go': 1011, 'valorant go vol 3': 1011,
  '5 years beta remastered': 1010,
  'give back v25': 1009,
  'divergence': 1008, 'duo s day haz matt': 1008,
  'minima v25': 1007,
  'vct25 team capsules 2g apk boom ns xlg': 1006, 'bolt': 1006,
  'storm maw': 1005,
  'cyrax': 1004,
  'neptune v25': 1003,
  'vct 2025 season': 1002,
  'helix': 1001,
  'ex o': 1000, 'vct25 team capsules': 1000,
  'araxys ep 9': 911,
  'tacti force signature': 910, 'tacti force': 910, 'combat crafts': 910,
  'arcane ep 9': 909,
  'doombringer': 908,
  'troublemaker': 907,
  'run it back singularity': 906, 'singularity ep 9': 906,
  'aperture': 905,
  'nocturnum': 904,
  'wonderstallion': 903,
  'champions 2024': 902,
  'rgx 11z pro ep 9': 901,
  'evori dreamwings': 900,
  'aemondir': 811,
  'give back 2024': 810,
  'holomoku': 809, 'vct cn team capsules': 809,
  'mystbloom': 808,
  'switchback': 807,
  'sovereign ep 8': 805,
  'fortune s hand': 804, 'primordium': 804,
  'mk vii liberty': 803, 'vct team capsules': 803,
  'duo s day': 802, 'xerofang': 802,
  'emberclad': 801,
  'throwback pack outlaw': 800, 'kuronami': 800,
  'run it back ep 7': 712, 'overdrive': 712,
  'chromedek': 710, 'sentinels of light ep 7': 710,
  'valiant hero': 709,
  'orion': 708,
  'gaia s vengeance ep 7': 707,
  'intergrade': 706,
  'imperium': 704,
  'daydreams': 703,
  'champions 2023': 702,
  'give back 2023': 701, 'ignite': 701,
  'neo frontier': 700,
  'no limits': 611,
  'pride': 610, 'magepunk ep 6': 610,
  'run it back ep 6': 608, 'radiant entertainment system': 608,
  'black market': 607,
  'altitude': 606,
  'oni ep 6': 604,
  'reverie': 603,
  'vct lock in': 602,
  'luna': 601,
  'araxys': 600,
  'cryostasis': 512,
  'abyssal': 510, 'give back 2022': 510,
  'soulstrife': 509,
  'ion ep 5': 508,
  'crimsonbeast': 507,
  'chronovoid': 506,
  'kohaku matsuba': 505,
  'champions 2022': 504,
  'reaver ep 5': 503,
  'run it back ep 5': 501, 'sarmad': 501,
  'prelude to chaos': 500,
  'xenohunter': 411,
  'neptune': 410,
  'titanmail': 409,
  'rgx 11z pro ep 4': 408,
  'doodle buds': 407,
  'endeavour': 405,
  'team ace': 404, 'gaia s vengeance': 404,
  'undercity': 403,
  'tigris': 402,
  'protocol 781 a': 400,
  'run it back ep 3': 312, 'snowfall': 312,
  'champions 2021': 310, 'magepunk ep 3': 310,
  'arcane': 309, 'radiant crisis 001': 309,
  'nunca olvidados': 308,
  'rgx 11z pro': 307,
  'valorant go vol 2': 306,
  'spectrum': 305,
  'recon': 304,
  'sakura': 303,
  'sentinels of light': 302,
  'ruination': 301,
  'give back': 300,
  'origin': 211,
  'tethered realms': 209, 'minima': 209,
  'forsaken': 208,
  'silvanus': 207,
  'magepunk': 206,
  'infantry': 205,
  'prime 2 0': 204,
  'valorant go vol 1': 203, 'celestial': 203,
  'glitchpop ep 2': 202,
  'horizon': 201, 'prism ii': 201,
  'run it back': 200,
  'blastx': 114, 'winterwunderland': 114,
  'sensation': 112, 'wasteland': 112, 'ion': 112,
  'reaver': 111,
  'singularity': 110,
  'gravitational uranium neuroblaster': 109,
  'smite': 108, 'ego': 108,
  'spline': 107,
  'nebula': 106,
  'glitchpop': 105,
  'oni': 104,
  'elderflame': 103,
  'prism': 102,
  'sovereign': 101,
  'prime': 100,
};

function normalizeBundleName(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/é/g, 'e').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Cache 變數 ───
let versionCache        = { value: null, fetchedAt: 0 };
let bundleCatalogCache  = { data: null, fetchedAt: 0 };
let skinsByThemeCache     = { data: null, fetchedAt: 0 };
let buddiesByThemeCache   = { data: null, fetchedAt: 0 };
let spraysByThemeCache    = { data: null, fetchedAt: 0 };
let bundleThemeMapCache   = { data: null, fetchedAt: 0 };
let tierIconCache = { data: null, fetchedAt: 0 };
let skinLevelCache = { levels: null, chromasBySkin: null, chromaByUuid: null, contractLevelIds: null, fetchedAt: 0 };
let skinPriceCache = { prices: null, fetchedAt: 0 };
const BUNDLE_CACHE_FILE = path.join(__dirname, '.bundle-prices.json');
let bundleDbMem = null;

async function getClientVersion() {
  if (versionCache.value && Date.now() - versionCache.fetchedAt < 6 * 3600 * 1000) {
    return versionCache.value;
  }
  try {
    const res = await axios.get('https://valorant-api.com/v1/version', { timeout: 5000 });
    versionCache = { value: res.data.data.riotClientVersion, fetchedAt: Date.now() };
    return versionCache.value;
  } catch {
    return 'release-09.10-shipping-15-2579794';
  }
}

async function buildSkinCache() {
  if (skinLevelCache.levels && Date.now() - skinLevelCache.fetchedAt < 24 * 3600 * 1000) return;

  const [weaponsRes, contractsRes] = await Promise.all([
    axios.get('https://valorant-api.com/v1/weapons?language=zh-TW', { timeout: 20000 }),
    axios.get('https://valorant-api.com/v1/contracts', { timeout: 15000 }),
  ]);

  const contractLevelIds = new Set();
  for (const contract of contractsRes.data?.data || []) {
    for (const chapter of contract.content?.chapters || []) {
      for (const lvl of chapter.levels || []) {
        if (lvl.reward?.type === 'EquippableSkinLevel')
          contractLevelIds.add(lvl.reward.uuid.toLowerCase());
      }
      for (const fr of chapter.freeRewards || []) {
        if (fr.type === 'EquippableSkinLevel')
          contractLevelIds.add(fr.uuid.toLowerCase());
      }
    }
  }
  console.log(`[SkinCache] contract/battlepass skin levels: ${contractLevelIds.size}`);

  const levels = {};
  const chromasBySkin = {};
  const chromaByUuid = {};
  const DEFAULT_THEME = '5a629df4-4765-0214-bd40-fbb96542941f';
  for (const weapon of weaponsRes.data.data) {
    for (const skin of weapon.skins || []) {
      if (skin.themeUuid === DEFAULT_THEME) continue;
      const baseIcon = skin.levels[0]?.displayIcon
        || skin.displayIcon
        || skin.chromas?.[0]?.fullRender
        || skin.chromas?.[0]?.displayIcon
        || null;
      const isPurchasable = !!skin.contentTierUuid;
      for (let idx = 0; idx < (skin.levels || []).length; idx++) {
        const level = skin.levels[idx];
        levels[level.uuid] = {
          skinName: skin.displayName,
          weaponName: weapon.displayName,
          weaponUuid: weapon.uuid,
          icon: baseIcon,
          contentTierUuid: skin.contentTierUuid || null,
          skinUuid: skin.uuid,
          baseUuid: skin.levels[0]?.uuid || null,
          levelIndex: idx,
          isPurchasable,
          themeUuid: skin.themeUuid || null,
          streamedVideo: level.streamedVideo || null,
        };
      }
      const skinChromas = (skin.chromas || []).map((c, cidx) => ({
        uuid: c.uuid,
        chromaIndex: cidx,
        icon: c.displayIcon || c.fullRender || baseIcon,
        swatch: c.swatch || null,
      }));
      chromasBySkin[skin.uuid] = skinChromas;
      for (const c of skinChromas) chromaByUuid[c.uuid] = { ...c, skinUuid: skin.uuid };
    }
  }
  skinLevelCache = { levels, chromasBySkin, chromaByUuid, contractLevelIds, fetchedAt: Date.now() };
}

function getBundleDb() {
  if (bundleDbMem) return bundleDbMem;
  try {
    if (fs.existsSync(BUNDLE_CACHE_FILE))
      bundleDbMem = JSON.parse(fs.readFileSync(BUNDLE_CACHE_FILE, 'utf-8'));
  } catch {}
  if (!bundleDbMem) bundleDbMem = {};
  return bundleDbMem;
}

async function updateBundleDbFromStorefront(headers, puuid, shard) {
  try {
    const r = await axios.post(
      `https://pd.${shard}.a.pvp.net/store/v3/storefront/${puuid}`,
      {},
      { headers, timeout: 10000, validateStatus: () => true }
    );
    const featured = r.data?.FeaturedBundle;
    if (r.status !== 200 || !featured) {
      console.log(`[BundleDB] storefront status=${r.status}，無 FeaturedBundle`);
      return;
    }
    const bundleObjs = [...(featured.Bundles || [])];
    if (featured.Bundle) bundleObjs.unshift(featured.Bundle);

    const db = getBundleDb();
    let added = 0;
    for (const bundle of bundleObjs) {
      const dataId = (bundle.DataAssetID || '').toLowerCase();
      if (!dataId) continue;
      const skinItems = (bundle.Items || []).filter(
        item => item.Item?.ItemTypeID?.toLowerCase() === SKIN_LEVEL_TYPE.toLowerCase()
      );
      if (skinItems.length === 0) continue;
      const skinLevelUuids = skinItems.map(i => i.Item.ItemID.toLowerCase());
      const totalPrice = bundle.TotalDiscountedCost?.[VP_CURRENCY] ?? null;
      if (!totalPrice) continue;
      const firstSkinInfo = skinLevelCache.levels?.[skinLevelUuids[0]];
      const themeUuid = firstSkinInfo?.themeUuid || null;
      if (!db[dataId]) added++;
      db[dataId] = { bundlePrice: totalPrice, skinLevelUuids, themeUuid, cachedAt: new Date().toISOString() };
    }
    bundleDbMem = db;
    if (added > 0) fs.writeFileSync(BUNDLE_CACHE_FILE, JSON.stringify(db, null, 2));
    console.log(`[BundleDB] 資料庫: ${Object.keys(db).length} 包，商城本次新增: ${added}`);
  } catch (e) {
    console.log('[BundleDB] 更新失敗:', e.message);
  }
}

async function getAllSkinLevels() {
  await buildSkinCache();
  return skinLevelCache.levels;
}

async function getAllSkinChromas() {
  await buildSkinCache();
  return { chromasBySkin: skinLevelCache.chromasBySkin, chromaByUuid: skinLevelCache.chromaByUuid };
}

async function getSkinPrices(headers, shard) {
  const cached = skinPriceCache.prices;
  if (cached && Object.keys(cached).length > 0 && Date.now() - skinPriceCache.fetchedAt < 12 * 3600 * 1000) {
    return cached;
  }
  try {
    const r = await axios.get(
      `https://pd.${shard}.a.pvp.net/store/v1/offers`,
      { headers, timeout: 10000, validateStatus: () => true }
    );
    const offersArr = r.data?.Offers || [];
    const prices = {};
    for (const offer of offersArr) {
      const costObj = offer.Cost || {};
      const vpCost = costObj[VP_CURRENCY] ?? costObj[VP_CURRENCY.toUpperCase()];
      if (vpCost && offer.OfferID) prices[offer.OfferID.toLowerCase()] = vpCost;
    }
    if (Object.keys(prices).length > 0) skinPriceCache = { prices, fetchedAt: Date.now() };
    console.log(`[SkinPrices] loaded ${Object.keys(prices).length} offers (status ${r.status})`);
    return prices;
  } catch (e) {
    console.log('[SkinPrices] fetch failed:', e.message);
    return {};
  }
}

async function getTierIconMap() {
  if (tierIconCache.data && Date.now() - tierIconCache.fetchedAt < 6 * 3600 * 1000) {
    return tierIconCache.data;
  }
  try {
    const r = await axios.get('https://valorant-api.com/v1/competitivetiers', { timeout: 5000 });
    const episodes = r.data?.data || [];
    const latest = episodes[episodes.length - 1];
    const tiers = latest?.tiers || [];
    const map = {};
    tiers.forEach(t => {
      map[t.tier] = { tierName: t.tierName, smallIcon: t.smallIcon, largeIcon: t.largeIcon };
    });
    tierIconCache = { data: map, fetchedAt: Date.now() };
    return map;
  } catch {
    return {};
  }
}

const REGION_TO_SHARD = {
  ap: 'ap', tw1: 'ap', tw2: 'ap', jp1: 'ap', sg2: 'ap', as2: 'ap', os2: 'ap',
  eu: 'eu', eu1: 'eu', eu2: 'eu', eu3: 'eu',
  kr: 'kr', kr1: 'kr',
  na: 'na', na1: 'na', na2: 'na',
  br: 'na', br1: 'na', latam: 'na', la1: 'na', la2: 'na'
};

function toShard(region) {
  return REGION_TO_SHARD[region?.toLowerCase()] || 'ap';
}

// store-history 格式：{ [puuid]: { [date]: [...skins] } }
function readStoreHistory(puuid) {
  try {
    if (fs.existsSync(STORE_HISTORY_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_HISTORY_PATH, 'utf-8'));
      return puuid ? (raw[puuid] || {}) : raw;
    }
  } catch {}
  return {};
}

function writeStoreHistoryEntry(puuid, date, skins) {
  try {
    let raw = {};
    if (fs.existsSync(STORE_HISTORY_PATH)) {
      raw = JSON.parse(fs.readFileSync(STORE_HISTORY_PATH, 'utf-8'));
    }
    if (!raw[puuid]) raw[puuid] = {};
    if (!raw[puuid][date]) {
      raw[puuid][date] = skins;
      fs.writeFileSync(STORE_HISTORY_PATH, JSON.stringify(raw, null, 2), 'utf-8');
      console.log(`[StoreHistory] 已儲存 ${puuid.substring(0, 8)} 的 ${date} 商店`);
    }
  } catch (e) {
    console.warn('[StoreHistory] 寫入失敗:', e.message);
  }
}

async function makeHeaders(riot) {
  const clientVersion = riot.clientVersion || await getClientVersion();
  return {
    Authorization: `Bearer ${riot.accessToken}`,
    'X-Riot-Entitlements-JWT': riot.entitlementsToken,
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': clientVersion,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

// ─── 登入第一段：帳密 → 若有 MFA 回傳 { done: false, mfaJar } ───
async function riotAuthInit(username, password) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

  try {
    await client.get('https://auth.riotgames.com/login', {
      headers: { 'User-Agent': UA },
      maxRedirects: 3,
      timeout: 5000
    });
  } catch {}

  await client.post(
    'https://auth.riotgames.com/api/v1/authorization',
    { client_id: 'play-valorant-web-prod', nonce: '1', redirect_uri: 'https://playvalorant.com/opt_in', response_type: 'token id_token', scope: 'account openid' },
    { headers: { 'User-Agent': UA, 'Content-Type': 'application/json', 'Referer': 'https://auth.riotgames.com/login' } }
  );

  const authRes = await client.put(
    'https://auth.riotgames.com/api/v1/authorization',
    { type: 'auth', username, password, remember: false, language: 'en_US' },
    { headers: { 'User-Agent': UA, 'Content-Type': 'application/json', 'Referer': 'https://auth.riotgames.com/login' } }
  );

  const responseType = authRes.data?.type;
  console.log('[Auth] type:', responseType, '| error:', authRes.data?.error);

  if (responseType === 'multifactor') {
    return { done: false, mfaJar: JSON.stringify(jar.toJSON()) };
  }

  if (authRes.data?.error === 'auth_failure' || responseType === 'error' || authRes.data?.error) {
    throw new Error('AUTH_FAILED');
  }

  const uri = authRes.data?.response?.parameters?.uri;
  if (!uri) throw new Error('AUTH_FAILED');

  return riotAuthFinalize(uri);
}

// ─── 登入第二段：MFA 驗證碼 → 完成取 token ───
async function riotAuthMfa(mfaJarStr, code) {
  const jar = CookieJar.fromJSON(JSON.parse(mfaJarStr));
  const client = wrapper(axios.create({ jar }));
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

  const mfaRes = await client.put(
    'https://auth.riotgames.com/api/v1/authorization',
    { type: 'multifactor', code: String(code), rememberDevice: false },
    { headers: { 'User-Agent': UA, 'Content-Type': 'application/json' } }
  );

  if (mfaRes.data?.type === 'error' || mfaRes.data?.error) throw new Error('MFA_FAILED');

  const uri = mfaRes.data?.response?.parameters?.uri;
  if (!uri) throw new Error('MFA_FAILED');

  return riotAuthFinalize(uri);
}

// 共用：從 redirect URI 取 token 並換 entitlements + userinfo
async function riotAuthFinalize(uri) {
  const tokenMatch = uri.match(/access_token=([\w.-]+)/);
  if (!tokenMatch) throw new Error('AUTH_FAILED');
  const accessToken = tokenMatch[1];

  const entRes = await axios.post(
    'https://entitlements.auth.riotgames.com/api/token/v1',
    {},
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  const entitlementsToken = entRes.data.entitlements_token;

  const userRes = await axios.get('https://auth.riotgames.com/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const puuid = userRes.data.sub;
  const acct = userRes.data.acct;
  const gameName = acct ? `${acct.game_name}#${acct.tag_line}` : null;

  return { done: true, accessToken, entitlementsToken, puuid, gameName, authMethod: 'password' };
}

// ─── AUTH ROUTES ───

// 瀏覽器 OAuth 流程：跳轉到 Riot 官方登入頁，登入後帶 token 回我們的 callback
app.get('/auth/start', (req, res) => {
  const region = req.query.region || 'ap';
  const nonce = require('crypto').randomBytes(16).toString('hex');
  req.session.pendingRegion = region;
  req.session.oauthNonce = nonce;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth-callback.html`;
  const params = new URLSearchParams({
    redirect_uri: callbackUrl,
    client_id: 'play-valorant-web-prod',
    response_type: 'token id_token',
    nonce,
    scope: 'openid',
  });
  res.redirect(`https://auth.riotgames.com/authorize?${params}`);
});

// 從瀏覽器拿到 access_token 後，換 entitlements + userinfo，存 session
app.post('/api/auth/from-token', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'MISSING_TOKEN' });
  const region = req.session.pendingRegion || 'ap';
  try {
    const [entRes, userRes] = await Promise.all([
      axios.post(
        'https://entitlements.auth.riotgames.com/api/token/v1',
        {},
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      ),
      axios.get('https://auth.riotgames.com/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    ]);
    const entitlementsToken = entRes.data.entitlements_token;
    const puuid = userRes.data.sub;
    const acct = userRes.data.acct;
    const gameName = acct ? `${acct.game_name}#${acct.tag_line}` : null;
    delete req.session.pendingRegion;
    delete req.session.oauthNonce;
    req.session.riot = {
      accessToken, entitlementsToken, puuid, gameName,
      region, authMethod: 'oauth', clientVersion: null,
      expiresAt: Date.now() + 60 * 60 * 1000, // Riot token 約 1 小時
    };
    console.log(`[Auth] OAuth login: ${gameName} (${region})`);
    res.json({ success: true, gameName, puuid, region });
  } catch (err) {
    console.error('[Auth] from-token error:', err.response?.status, err.response?.data || err.message);
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password, region } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'MISSING_FIELDS' });

  try {
    const result = await riotAuthInit(username, password);

    if (!result.done) {
      // MFA 需要第二段驗證
      req.session.pendingMfaJar = result.mfaJar;
      req.session.pendingRegion = region || 'ap';
      return res.json({ mfa: true });
    }

    req.session.riot = {
      ...result,
      region: region || 'ap',
      clientVersion: null,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    };
    console.log(`[Auth] Logged in: ${result.gameName} (${region || 'ap'})`);
    res.json({ success: true, gameName: result.gameName, puuid: result.puuid, region: region || 'ap' });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    if (err.message === 'AUTH_FAILED')
      return res.status(401).json({ error: 'AUTH_FAILED' });
    res.status(500).json({ error: 'AUTH_FAILED', detail: err.message });
  }
});

app.post('/api/auth/mfa', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'MISSING_CODE' });
  if (!req.session.pendingMfaJar) return res.status(400).json({ error: 'NO_PENDING_MFA' });

  try {
    const result = await riotAuthMfa(req.session.pendingMfaJar, code);
    const region = req.session.pendingRegion || 'ap';

    req.session.riot = {
      ...result,
      region,
      clientVersion: null,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    };
    delete req.session.pendingMfaJar;
    delete req.session.pendingRegion;

    console.log(`[Auth] MFA success: ${result.gameName} (${region})`);
    res.json({ success: true, gameName: result.gameName, puuid: result.puuid, region });
  } catch (err) {
    console.error('[Auth] MFA error:', err.message);
    if (err.message === 'MFA_FAILED')
      return res.status(401).json({ error: 'MFA_FAILED' });
    res.status(500).json({ error: 'MFA_FAILED' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  const riot = getRiot(req);
  const loggedIn = !!(riot.accessToken && riot.expiresAt > Date.now());
  res.json({ loggedIn, region: riot.region, puuid: riot.puuid, gameName: riot.gameName });
});

// ─── GET /api/wallet ───
app.get('/api/wallet', async (req, res) => {
  const riot = getRiot(req);
  if (!riot.accessToken || riot.expiresAt <= Date.now())
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  const shard = toShard(riot.region);
  try {
    const headers = await makeHeaders(riot);
    const walletRes = await axios.get(
      `https://pd.${shard}.a.pvp.net/store/v1/wallet/${riot.puuid}`,
      { headers, timeout: 8000 }
    );
    const balances = walletRes.data?.Balances || {};
    res.json({ vp: balances[VP_CURRENCY] ?? 0, rp: balances[RP_CURRENCY] ?? 0 });
  } catch (err) {
    console.error('[Wallet] Error:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({ error: 'WALLET_FETCH_FAILED' });
  }
});

// ─── GET /api/rank ───
app.get('/api/rank', async (req, res) => {
  const riot = getRiot(req);
  if (!riot.accessToken || riot.expiresAt <= Date.now())
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  const shard = toShard(riot.region);
  try {
    const headers = await makeHeaders(riot);
    const [mmrRes, tierIcons] = await Promise.all([
      axios.get(`https://pd.${shard}.a.pvp.net/mmr/v1/players/${riot.puuid}`, { headers, timeout: 8000 }),
      getTierIconMap()
    ]);

    const latest = mmrRes.data?.LatestCompetitiveUpdate || {};
    const tier = latest.TierAfterUpdate ?? 0;
    const rr = latest.RankedRatingAfterUpdate ?? 0;
    const tierName = tierIcons[tier]?.tierName || 'Unrated';
    const tierIcon = tierIcons[tier]?.smallIcon || tierIcons[tier]?.largeIcon || null;
    res.json({ tier, rr, tierName, tierIcon });
  } catch (err) {
    console.error('[Rank] Error:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({ error: 'RANK_FETCH_FAILED' });
  }
});

// ─── POST /api/store ───
app.post('/api/store', async (req, res) => {
  const riot = getRiot(req);
  if (!riot.accessToken || riot.expiresAt <= Date.now())
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  const shard = toShard(riot.region);
  try {
    const headers = await makeHeaders(riot);
    console.log('[Store] shard:', shard, '| puuid:', riot.puuid?.substring(0, 8));

    const storeRes = await axios.post(
      `https://pd.${shard}.a.pvp.net/store/v3/storefront/${riot.puuid}`,
      {},
      { headers, timeout: 10000 }
    );

    await buildSkinCache();

    const layout = storeRes.data.SkinsPanelLayout;
    const rawOffers = layout?.SingleItemStoreOffers || [];

    const dailyOffers = rawOffers.map((offer) => {
      const uuid = offer.Rewards?.[0]?.ItemID;
      const skinInfo = uuid ? (skinLevelCache.levels?.[uuid] || skinLevelCache.levels?.[uuid?.toLowerCase()] || {}) : {};
      return { uuid, name: skinInfo.skinName || 'Unknown Skin', icon: skinInfo.icon || null, cost: offer.Cost?.[VP_CURRENCY] || 0, skinUuid: skinInfo.skinUuid || null, streamedVideo: skinInfo.streamedVideo || null };
    });

    const today = new Date().toISOString().slice(0, 10);
    writeStoreHistoryEntry(riot.puuid, today, dailyOffers.map(s => ({ uuid: s.uuid, name: s.name, icon: s.icon, cost: s.cost })));

    const rawNight = storeRes.data.BonusStore?.BonusStoreOffers || [];
    let nightMarket = null;
    if (rawNight.length > 0) {
      nightMarket = rawNight.map((offer) => {
        const uuid = offer.Offer?.Rewards?.[0]?.ItemID;
        const skinInfo = uuid ? (skinLevelCache.levels?.[uuid] || skinLevelCache.levels?.[uuid?.toLowerCase()] || {}) : {};
        return {
          uuid, name: skinInfo.skinName || 'Unknown Skin', icon: skinInfo.icon || null,
          cost: offer.Offer?.Cost?.[VP_CURRENCY] || 0,
          discountCost: offer.DiscountCosts?.[VP_CURRENCY] || 0,
          discountPercent: Math.round(offer.DiscountPercent || 0),
          skinUuid: skinInfo.skinUuid || null, streamedVideo: skinInfo.streamedVideo || null
        };
      });
    }

    res.json({ dailyOffers, remainingSeconds: layout?.SingleItemOffersRemainingDurationInSeconds || 0, nightMarket });
  } catch (err) {
    const status = err.response?.status;
    console.error('[Store] Error:', status, JSON.stringify(err.response?.data) || err.message);
    if (status === 400 || status === 403) {
      req.session.riot = null;
      return res.status(401).json({ error: 'TOKEN_EXPIRED' });
    }
    res.status(500).json({ error: 'STORE_FETCH_FAILED' });
  }
});

// ─── GET /api/store/history ───
app.get('/api/store/history', (req, res) => {
  const riot = getRiot(req);
  if (!riot.puuid) return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  try {
    const history = readStoreHistory(riot.puuid);
    const sorted = Object.keys(history)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({ date, skins: history[date] }));
    res.json(sorted);
  } catch (err) {
    console.error('[History] Error:', err.message);
    res.status(500).json({ error: 'HISTORY_FETCH_FAILED' });
  }
});

// ─── GET /api/inventory ───
app.get('/api/inventory', async (req, res) => {
  const riot = getRiot(req);
  if (!riot.accessToken || riot.expiresAt <= Date.now())
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  const shard = toShard(riot.region);
  try {
    const headers = await makeHeaders(riot);
    const invRes = await axios.get(
      `https://pd.${shard}.a.pvp.net/store/v1/entitlements/${riot.puuid}/${SKIN_LEVEL_TYPE}`,
      { headers, timeout: 12000 }
    );
    const items = invRes.data?.Entitlements || [];
    res.json({ ownedUuids: items.map(i => i.ItemID) });
  } catch (err) {
    console.error('[Inventory] Error:', err.response?.status, err.message);
    res.status(500).json({ error: 'INVENTORY_FETCH_FAILED' });
  }
});

// ─── GET /api/collection ───
app.get('/api/collection', async (req, res) => {
  const riot = getRiot(req);
  if (!riot.accessToken || riot.expiresAt <= Date.now())
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  const shard = toShard(riot.region);

  try {
    const headers = await makeHeaders(riot);
    const skinMap = await getAllSkinLevels();
    const offerPrices = await getSkinPrices(headers, shard);

    const queryEntitlements = async (hdrs) => {
      const r = await axios.get(
        `https://pd.${shard}.a.pvp.net/store/v1/entitlements/${riot.puuid}/${SKIN_LEVEL_TYPE}`,
        { headers: hdrs, timeout: 12000, validateStatus: () => true }
      );
      if ((r.data?.Entitlements?.length || 0) > 0) return r.data.Entitlements;
      if (r.status !== 200) {
        console.log('[Collection] PVP error:', r.status, JSON.stringify(r.data).substring(0, 150));
        return [];
      }
      const r2 = await axios.get(
        `https://pd.${shard}.a.pvp.net/store/v1/entitlements/${riot.puuid}/${SKIN_LEVEL_TYPE_LEGACY}`,
        { headers: hdrs, timeout: 12000, validateStatus: () => true }
      );
      if ((r2.data?.Entitlements?.length || 0) > 0) {
        console.log('[Collection] legacy UUID worked:', r2.data.Entitlements.length);
        return r2.data.Entitlements;
      }
      return [];
    };

    const [entitlementItems] = await Promise.all([
      queryEntitlements(headers),
      updateBundleDbFromStorefront(headers, riot.puuid, shard),
    ]);
    console.log(`[Collection] entitlements: ${entitlementItems.length}, authMethod: ${riot.authMethod}`);

    if (entitlementItems.length > 0) {
      const equippedIds = new Set();
      try {
        const loadoutRes = await axios.get(
          `https://pd.${shard}.a.pvp.net/personalization/v2/players/${riot.puuid}/playerloadout`,
          { headers, timeout: 8000 }
        );
        for (const gun of loadoutRes.data?.Guns || []) {
          if (gun.SkinLevelID) equippedIds.add(gun.SkinLevelID.toLowerCase());
        }
      } catch {}

      const TIER_RANK = {
        'e046854e-406c-37f4-6607-19a9ba8426fc': 5,
        '411e4a55-4e59-7757-41f0-86a53f101bb5': 4,
        '60bca009-4182-7998-dee7-b8a2558dc369': 3,
        '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 2,
        '12683d76-48d7-84a3-4e09-6985794f0445': 1,
      };

      const bySkIn = {};
      for (const i of entitlementItems) {
        const info = skinMap[i.ItemID];
        if (!info?.skinName) continue;
        const key = info.skinUuid || (info.skinName + info.weaponName);
        if (!bySkIn[key] || (info.levelIndex ?? 0) > (bySkIn[key].levelIndex ?? 0)) {
          bySkIn[key] = { uuid: i.ItemID, ...info, equipped: false };
        }
        if (equippedIds.has(i.ItemID.toLowerCase())) bySkIn[key].equipped = true;
      }

      const WEAPON_PRIORITY = {
        '9c82e19d-4575-0200-1a81-3eacf00cf872': 4,
        'ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a': 4,
        'a03b24d3-4319-996d-0f8c-94bbfba1dfc7': 3,
        '2f59173c-4bed-b6c3-2191-dea9b58be9c7': 2,
      };

      const { chromasBySkin } = await getAllSkinChromas();
      const ownedChromaIds = new Set();
      try {
        const chromaRes = await axios.get(
          `https://pd.${shard}.a.pvp.net/store/v1/entitlements/${riot.puuid}/${SKIN_CHROMA_TYPE}`,
          { headers, timeout: 12000, validateStatus: () => true }
        );
        for (const item of chromaRes.data?.Entitlements || []) {
          ownedChromaIds.add(item.ItemID.toLowerCase());
        }
        console.log(`[Collection] owned chromas: ${ownedChromaIds.size}`);
      } catch (e) {
        console.log('[Collection] chroma query failed:', e.message);
      }

      for (const skin of Object.values(bySkIn)) {
        const all = chromasBySkin[skin.skinUuid] || [];
        skin.chromas = all.filter((c, i) => i === 0 || ownedChromaIds.has(c.uuid.toLowerCase()));
      }

      const contractLevelIds = skinLevelCache.contractLevelIds || new Set();
      const contractSkinUuids = new Set();
      for (const item of entitlementItems) {
        if (contractLevelIds.has(item.ItemID.toLowerCase())) {
          const info = skinLevelCache.levels[item.ItemID] || skinLevelCache.levels[item.ItemID.toLowerCase()];
          if (info) contractSkinUuids.add(info.skinUuid);
        }
      }

      let totalVP = 0;
      let totalRP = 0;
      const paidLevelCount = {};
      let rpCacheMiss = 0;
      for (const item of entitlementItems) {
        const info = skinLevelCache.levels[item.ItemID] || skinLevelCache.levels[item.ItemID.toLowerCase()];
        if (!info) { rpCacheMiss++; continue; }
        if ((info.levelIndex ?? 0) >= 1) {
          paidLevelCount[info.skinUuid] = (paidLevelCount[info.skinUuid] || 0) + 1;
        }
      }
      if (rpCacheMiss > 0) console.log(`[Collection] RP cache miss: ${rpCacheMiss}`);

      const tierStats = {};
      let unknownTierVP = 0;
      const vpSkinLog = [];

      for (const skin of Object.values(bySkIn)) {
        if (!contractSkinUuids.has(skin.skinUuid) && skin.contentTierUuid) {
          const baseId = skin.baseUuid?.toLowerCase();
          const offerPrice = baseId ? offerPrices[baseId] : null;
          const isMelee = skin.weaponUuid === MELEE_WEAPON_UUID;
          const isChampionsMelee = isMelee && /champions|vct/i.test(skin.skinName);
          const fallbackPrice = isChampionsMelee ? 4750
            : isMelee ? MELEE_TIER_VP[skin.contentTierUuid]
            : TIER_SKIN_VP[skin.contentTierUuid];
          const price = offerPrice ?? fallbackPrice;
          const priceSource = offerPrice ? 'api' : isChampionsMelee ? 'champions' : isMelee ? 'melee' : 'tier';
          if (price != null) {
            totalVP += price;
            const tn = { 'e046854e-406c-37f4-6607-19a9ba8426fc': 'Exclusive', '411e4a55-4e59-7757-41f0-86a53f101bb5': 'Ultra', '60bca009-4182-7998-dee7-b8a2558dc369': 'Premium', '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 'Deluxe', '12683d76-48d7-84a3-4e09-6985794f0445': 'Select' }[skin.contentTierUuid];
            tierStats[tn] = (tierStats[tn] || 0) + 1;
            vpSkinLog.push(`  [${tn} ${price}VP(${priceSource})] ${skin.skinName} (${skin.weaponName})`);
          } else {
            unknownTierVP++;
          }
        }
        totalRP += (paidLevelCount[skin.skinUuid] || 0) * 10;
        const paidChromas = (skin.chromas || []).filter(c => c.chromaIndex > 0).length;
        totalRP += paidChromas * 15;
      }
      const skinCount = Object.keys(bySkIn).length;
      console.log(`[Collection] VP: ${totalVP}，RP: ${totalRP}，造型: ${skinCount}`);

      let totalActualVP = 0;
      const vpSkinUuids = new Set(
        Object.values(bySkIn)
          .filter(s => !contractSkinUuids.has(s.skinUuid) && s.contentTierUuid)
          .map(s => s.baseUuid?.toLowerCase()).filter(Boolean)
      );
      const bundleMap = getBundleDb();
      const usedByBundle = new Set();
      const bundleBreakdown = [];

      for (const [, bundle] of Object.entries(bundleMap)) {
        const bundleSkinUuids = bundle.skinLevelUuids.filter(u => vpSkinUuids.has(u));
        if (bundleSkinUuids.length > 0 && bundleSkinUuids.length === bundle.skinLevelUuids.length) {
          totalActualVP += bundle.bundlePrice;
          bundleSkinUuids.forEach(u => usedByBundle.add(u));
          bundleBreakdown.push(`  整包(已知) ${bundle.bundlePrice} VP (${bundleSkinUuids.length} 件)`);
        }
      }

      const themeGroups = {};
      for (const skin of Object.values(bySkIn)) {
        if (!skin.themeUuid || contractSkinUuids.has(skin.skinUuid) || !skin.contentTierUuid) continue;
        if (!themeGroups[skin.themeUuid]) themeGroups[skin.themeUuid] = [];
        themeGroups[skin.themeUuid].push(skin);
      }
      const detectedBundles = [];
      for (const [themeUuid, skins] of Object.entries(themeGroups)) {
        if (skins.length < 3) continue;
        const alreadyUsed = skins.every(s => s.baseUuid && usedByBundle.has(s.baseUuid.toLowerCase()));
        if (alreadyUsed) { detectedBundles.push({ name: skins[0].skinName, skinCount: skins.length, hasPrice: true }); continue; }
        const matchedBundle = Object.values(bundleMap).find(b => b.themeUuid === themeUuid);
        const themeName = skins[0].skinName.split(' ').slice(0, -1).join(' ') || skins[0].skinName;
        if (matchedBundle) {
          if (!skins.some(s => s.baseUuid && usedByBundle.has(s.baseUuid.toLowerCase()))) {
            totalActualVP += matchedBundle.bundlePrice;
            skins.forEach(s => s.baseUuid && usedByBundle.add(s.baseUuid.toLowerCase()));
            bundleBreakdown.push(`  整包(theme) ${themeName}: ${matchedBundle.bundlePrice} VP`);
            detectedBundles.push({ name: themeName, skinCount: skins.length, hasPrice: true });
          }
        } else {
          detectedBundles.push({ name: themeName, skinCount: skins.length, hasPrice: false, themeUuid });
        }
      }

      for (const skin of Object.values(bySkIn)) {
        if (contractSkinUuids.has(skin.skinUuid) || !skin.contentTierUuid) continue;
        const baseId = skin.baseUuid?.toLowerCase();
        if (baseId && usedByBundle.has(baseId)) continue;
        const isMelee = skin.weaponUuid === MELEE_WEAPON_UUID;
        const isChampionsMelee = isMelee && /champions|vct/i.test(skin.skinName);
        const indivPrice = isChampionsMelee ? 4750 : isMelee ? MELEE_TIER_VP[skin.contentTierUuid] : TIER_SKIN_VP[skin.contentTierUuid];
        if (indivPrice) totalActualVP += indivPrice;
      }

      const pendingBundles = detectedBundles.filter(b => !b.hasPrice);
      console.log(`[Collection] 市場價值: ${totalVP} VP，估計實際花費: ${totalActualVP} VP`);

      const skins = Object.values(bySkIn).sort((a, b) => {
        if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
        const wa = WEAPON_PRIORITY[a.weaponUuid] ?? 1;
        const wb = WEAPON_PRIORITY[b.weaponUuid] ?? 1;
        if (wa !== wb) return wb - wa;
        const ra = TIER_RANK[a.contentTierUuid] ?? 0;
        const rb = TIER_RANK[b.contentTierUuid] ?? 0;
        if (ra !== rb) return rb - ra;
        return a.weaponName.localeCompare(b.weaponName) || a.skinName.localeCompare(b.skinName);
      });

      return res.json({ skins, total: skins.length, totalVP, totalActualVP, totalRP, skinCount, pendingBundles: pendingBundles.map(b => ({ name: b.name, skinCount: b.skinCount, themeUuid: b.themeUuid })), mode: 'full' });
    }

    // Fallback：entitlements 為 0，改用 playerloadout（只顯示目前裝備的）
    const loadoutRes = await axios.get(
      `https://pd.${shard}.a.pvp.net/personalization/v2/players/${riot.puuid}/playerloadout`,
      { headers, timeout: 12000 }
    );
    const guns = loadoutRes.data?.Guns || [];
    const skins = guns
      .map(g => {
        const levelUuid = g.SkinLevelID || g.SkinID;
        const info = skinMap[levelUuid];
        return info ? { uuid: levelUuid, ...info } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.weaponName.localeCompare(b.weaponName));

    console.log(`[Collection] loadout fallback: ${skins.length} equipped skins`);
    res.json({ skins, total: skins.length, mode: 'loadout' });
  } catch (err) {
    console.error('[Collection] Error:', err.response?.status, err.message);
    res.status(500).json({ error: 'COLLECTION_FETCH_FAILED' });
  }
});

app.post('/api/bundle-price', express.json(), (req, res) => {
  const { themeUuid, price, name } = req.body;
  if (!themeUuid || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'invalid input' });
  }
  const db = getBundleDb();
  const key = `theme:${themeUuid}`;
  db[key] = { bundlePrice: Math.round(price), skinLevelUuids: [], themeUuid, cachedAt: new Date().toISOString() };
  bundleDbMem = db;
  fs.writeFileSync(BUNDLE_CACHE_FILE, JSON.stringify(db, null, 2));
  console.log(`[BundleDB] 手動設定: ${name || themeUuid} price=${price}`);
  res.json({ ok: true });
});

// ─── 歷代組合包目錄 ───
const BUNDLE_RATINGS_FILE = path.join(__dirname, 'bundle-ratings.json');
function getBundleRatings() {
  try { return JSON.parse(fs.readFileSync(BUNDLE_RATINGS_FILE, 'utf-8')); } catch { return {}; }
}

app.get('/api/bundles/catalog', async (req, res) => {
  if (bundleCatalogCache.data && Date.now() - bundleCatalogCache.fetchedAt < 24 * 3600 * 1000) {
    return res.json(bundleCatalogCache.data);
  }
  try {
    const [rTW, rEN] = await Promise.all([
      axios.get('https://valorant-api.com/v1/bundles?language=zh-TW', { timeout: 10000 }),
      axios.get('https://valorant-api.com/v1/bundles?language=en-US', { timeout: 10000 }),
    ]);
    const bundles = rTW.data?.data || [];
    const enBundles = rEN.data?.data || [];
    const db = getBundleDb();
    const ratings = getBundleRatings();

    const uuidToEnKey = {};
    for (const b of enBundles) uuidToEnKey[b.uuid] = normalizeBundleName(b.displayName);

    const result = bundles.map(b => {
      const key = b.uuid.toLowerCase();
      const entry = db[key] || null;
      const frag = b.uuid.replace(/-/g, '').substring(0, 8).toLowerCase();
      const enKey = uuidToEnKey[b.uuid] || '';
      const patchSort = BUNDLE_PATCH_MAP[enKey] || 0;
      return {
        uuid: b.uuid,
        displayName: b.displayName,
        displayIcon: b.displayIcon,
        displayIcon2: b.displayIcon2,
        verticalPromoImage: b.verticalPromoImage,
        price: entry?.bundlePrice || null,
        tier: ratings[frag] || null,
        isVCT: b.displayName.includes('VCT'),
        patchSort,
      };
    });

    result.sort((a, b) => b.patchSort - a.patchSort);
    bundleCatalogCache = { data: result, fetchedAt: Date.now() };
    res.json(result);
  } catch (e) {
    console.error('[BundleCatalog] fetch failed:', e.message);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

async function getBundleThemeMap() {
  if (bundleThemeMapCache.data && Date.now() - bundleThemeMapCache.fetchedAt < 24 * 3600 * 1000)
    return bundleThemeMapCache.data;
  const [bundleRes, themeRes] = await Promise.all([
    axios.get('https://valorant-api.com/v1/bundles', { timeout: 15000 }),
    axios.get('https://valorant-api.com/v1/themes',  { timeout: 15000 }),
  ]);
  const themeByName = {};
  for (const t of themeRes.data.data || [])
    themeByName[t.displayName.toLowerCase().trim()] = t.uuid;
  const map = {};
  for (const b of bundleRes.data.data || []) {
    const themeUuid = themeByName[b.displayName.toLowerCase().trim()];
    if (themeUuid) map[b.uuid.toLowerCase()] = themeUuid.toLowerCase();
  }
  bundleThemeMapCache = { data: map, fetchedAt: Date.now() };
  console.log(`[BundleThemeMap] 建立完成，${Object.keys(map).length} 筆對應`);
  return map;
}

async function getSkinsByTheme() {
  if (skinsByThemeCache.data && Date.now() - skinsByThemeCache.fetchedAt < 24 * 3600 * 1000)
    return skinsByThemeCache.data;
  const r = await axios.get('https://valorant-api.com/v1/weapons?language=zh-TW', { timeout: 15000 });
  const grouped = {};
  for (const weapon of r.data.data || []) {
    const weaponName = weapon.displayName || '';
    const isMelee = weaponName === '近戰武器' || weaponName.toLowerCase() === 'melee';
    for (const skin of weapon.skins || []) {
      if (!skin.themeUuid) continue;
      const key = skin.themeUuid.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        uuid: skin.uuid,
        displayName: skin.displayName,
        contentTierUuid: skin.contentTierUuid,
        icon: skin.levels?.[0]?.displayIcon || skin.displayIcon || null,
        levelCount: skin.levels?.length || 1,
        isMelee,
        chromas: (skin.chromas || []).filter(c => c.swatch).map(c => ({
          swatch: c.swatch,
          icon: c.fullRender || c.displayIcon || null,
        })),
      });
    }
  }
  skinsByThemeCache = { data: grouped, fetchedAt: Date.now() };
  return grouped;
}

async function getBuddiesByTheme() {
  if (buddiesByThemeCache.data && Date.now() - buddiesByThemeCache.fetchedAt < 24 * 3600 * 1000)
    return buddiesByThemeCache.data;
  const r = await axios.get('https://valorant-api.com/v1/buddies?language=zh-TW', { timeout: 15000 });
  const grouped = {};
  for (const buddy of r.data.data || []) {
    if (!buddy.themeUuid) continue;
    const key = buddy.themeUuid.toLowerCase();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ uuid: buddy.uuid, displayName: buddy.displayName, icon: buddy.displayIcon || null });
  }
  buddiesByThemeCache = { data: grouped, fetchedAt: Date.now() };
  return grouped;
}

async function getSpraysByTheme() {
  if (spraysByThemeCache.data && Date.now() - spraysByThemeCache.fetchedAt < 24 * 3600 * 1000)
    return spraysByThemeCache.data;
  const r = await axios.get('https://valorant-api.com/v1/sprays?language=zh-TW', { timeout: 15000 });
  const grouped = {};
  for (const spray of r.data.data || []) {
    if (!spray.themeUuid) continue;
    const key = spray.themeUuid.toLowerCase();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ uuid: spray.uuid, displayName: spray.displayName, icon: spray.fullIcon || spray.displayIcon || null });
  }
  spraysByThemeCache = { data: grouped, fetchedAt: Date.now() };
  return grouped;
}

app.get('/api/bundles/:uuid/skins', async (req, res) => {
  try {
    const [themeMap, skinsGrouped, buddiesGrouped, spraysGrouped] = await Promise.all([
      getBundleThemeMap(), getSkinsByTheme(), getBuddiesByTheme(), getSpraysByTheme(),
    ]);
    const themeUuid = themeMap[req.params.uuid.toLowerCase()];
    res.json({
      skins:   themeUuid ? (skinsGrouped[themeUuid]   || []) : [],
      buddies: themeUuid ? (buddiesGrouped[themeUuid] || []) : [],
      sprays:  themeUuid ? (spraysGrouped[themeUuid]  || []) : [],
    });
  } catch (e) {
    console.error('[BundleSkins] fetch failed:', e.message);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// ─── GET /api/matches ───
app.get('/api/matches', async (req, res) => {
  const { name, tag, size = 15 } = req.query;
  if (!name || !tag) return res.status(400).json({ error: 'MISSING_PARAMS' });
  if (!HENRIK_API_KEY) return res.status(503).json({ error: 'NO_HENRIK_KEY' });

  const riot = getRiot(req);
  if (!riot.region) return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  try {
    const r = await axios.get(
      `https://api.henrikdev.xyz/valorant/v3/matches/${toShard(riot.region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${size}`,
      { headers: { Authorization: HENRIK_API_KEY }, timeout: 10000 }
    );
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status;
    console.error('[Matches] Error:', status, err.response?.data || err.message);
    if (status === 404) return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
    res.status(500).json({ error: 'MATCHES_FETCH_FAILED' });
  }
});

// ─── 英雄語音 Proxy ───
const { AGENT_AUDIO_URLS } = require('./agent_lines');

const _PICK_AUDIO = {
  'JettPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/2/22/JettPick.mp3/revision/latest?cb=20210615195925',
  'ViperPick.mp3':     'https://static.wikia.nocookie.net/valorant/images/f/f7/ViperPick.mp3/revision/latest?cb=20210616194834',
  'ReynaPick.mp3':     'https://static.wikia.nocookie.net/valorant/images/d/d1/ReynaPick.mp3/revision/latest?cb=20210617145215',
  'SagePick.mp3':      'https://static.wikia.nocookie.net/valorant/images/1/1d/SagePick.mp3/revision/latest?cb=20210618212812',
  'SovaPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/d3/SovaPick.mp3/revision/latest?cb=20210619155946',
  'KAYOPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/c/cd/KAYOPick.mp3/revision/latest?cb=20210623103056',
  'AstraPick.mp3':     'https://static.wikia.nocookie.net/valorant/images/c/c7/AstraPick.mp3/revision/latest?cb=20210624210538',
  'BreachPick.mp3':    'https://static.wikia.nocookie.net/valorant/images/1/1b/BreachPick.mp3/revision/latest?cb=20210628121152',
  'BrimstonePick.mp3': 'https://static.wikia.nocookie.net/valorant/images/3/38/BrimstonePick.mp3/revision/latest?cb=20210628202035',
  'CypherPick.mp3':    'https://static.wikia.nocookie.net/valorant/images/0/06/CypherPick.mp3/revision/latest?cb=20210630194047',
  'KilljoyPick.mp3':   'https://static.wikia.nocookie.net/valorant/images/f/f3/KilljoyPick.mp3/revision/latest?cb=20210630215423',
  'OmenPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/4/4f/OmenPick.mp3/revision/latest?cb=20210701133628',
  'PhoenixPick.mp3':   'https://static.wikia.nocookie.net/valorant/images/d/d9/PhoenixPick.mp3/revision/latest?cb=20210701172315',
  'RazePick.mp3':      'https://static.wikia.nocookie.net/valorant/images/4/49/RazePick.mp3/revision/latest?cb=20210701204253',
  'SkyePick.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/de/SkyePick.mp3/revision/latest?cb=20210702113954',
  'YoruPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/d/df/YoruPick.mp3/revision/latest?cb=20210702142559',
  'ChamberPick.mp3':   'https://static.wikia.nocookie.net/valorant/images/2/29/ChamberPick.mp3/revision/latest?cb=20211118114441',
  'NeonPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/3/35/NeonPick.mp3/revision/latest?cb=20220114012828',
  'FadePick.mp3':      'https://static.wikia.nocookie.net/valorant/images/6/6c/FadePick.mp3/revision/latest?cb=20220428162831',
  'HarborPick.mp3':    'https://static.wikia.nocookie.net/valorant/images/6/61/HarborPick.mp3/revision/latest?cb=20221028110859',
  'GekkoPick.mp3':     'https://static.wikia.nocookie.net/valorant/images/4/42/GekkoPick.mp3/revision/latest?cb=20230318151908',
  'DeadlockPick.mp3':  'https://static.wikia.nocookie.net/valorant/images/2/25/DeadlockPick.mp3/revision/latest?cb=20230702125711',
  'IsoPick.mp3':       'https://static.wikia.nocookie.net/valorant/images/0/0b/IsoPick.mp3/revision/latest?cb=20231104173038',
  'ClovePick.mp3':     'https://static.wikia.nocookie.net/valorant/images/0/00/ClovePick.mp3/revision/latest?cb=20240331045712',
  'VysePick.mp3':      'https://static.wikia.nocookie.net/valorant/images/f/fa/VysePick.mp3/revision/latest?cb=20240828085224',
  'TejoPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/7/7f/TejoPick.mp3/revision/latest?cb=20250115120314',
  'WaylayPick.mp3':    'https://static.wikia.nocookie.net/valorant/images/1/1d/WaylayPick.mp3/revision/latest?cb=20250308114902',
  'MiksPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/0/0f/MiksPick.mp3/revision/latest?cb=20260321012114',
  'VetoPick.mp3':      'https://static.wikia.nocookie.net/valorant/images/c/c6/VetoPick.mp3/revision/latest?cb=20251012155349',
};

const ALL_AUDIO_URLS = { ..._PICK_AUDIO, ...AGENT_AUDIO_URLS };

app.get('/api/audio/:file', async (req, res) => {
  const key = req.params.file;
  const url = ALL_AUDIO_URLS[key];
  if (!url) return res.status(404).json({ error: 'unknown file' });
  try {
    const upstream = await fetch(url, {
      headers: { 'Referer': 'https://valorant.fandom.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const buf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(Buffer.from(buf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/wiki-img', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('https://static.wikia.nocookie.net/')) {
    return res.status(400).json({ error: 'invalid url' });
  }
  try {
    const upstream = await fetch(url, {
      headers: { 'Referer': 'https://valorant.fandom.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const buf = await upstream.arrayBuffer();
    const ct = upstream.headers.get('Content-Type') || 'image/png';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(Buffer.from(buf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Valorant Tracker 已啟動：http://localhost:${PORT}`);
  if (!HENRIK_API_KEY) console.warn('[警告] HENRIK_API_KEY 未設定，對戰紀錄功能無法使用');
});
