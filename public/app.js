const $ = (id) => document.getElementById(id);

const state = {
  player: { name: '', tag: '' },
  storeTimer: null,
  maps: {},
  ownedSkins: new Set(),
  ownedSkinCount: 0,
  collectionLoaded: false,
  allCollectionSkins: []
};

// 依售價推算稀有度
function costToTier(cost) {
  if (cost <= 875)  return 'select';
  if (cost <= 1275) return 'deluxe';
  if (cost <= 1775) return 'premium';
  if (cost <= 2175) return 'ultra';
  return 'exclusive';
}

// 依 contentTierUuid 推算稀有度
const TIER_UUID = {
  '12683d76-48d7-84a3-4e09-6985794f0445': 'select',
  '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 'deluxe',
  '60bca009-4182-7998-dee7-b8a2558dc369': 'premium',
  '411e4a55-4e59-7757-41f0-86a53f101bb5': 'ultra',
  'e046854e-406c-37f4-6607-19a9ba8426fc': 'exclusive',
};
function uuidToTier(uuid) { return uuid ? TIER_UUID[uuid.toLowerCase()] || null : null; }

async function submitBundlePrice(btn, themeUuid, name) {
  const row = btn.closest('.pending-bundle-row');
  const input = row.querySelector('.pending-bundle-input');
  const price = parseInt(input.value, 10);
  if (!price || price <= 0) { input.style.borderColor = 'var(--accent)'; return; }
  btn.disabled = true;
  btn.textContent = '儲存中...';
  try {
    const r = await fetch('/api/bundle-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeUuid, price, name }),
    });
    if (!r.ok) throw new Error();
    row.innerHTML = `<span class="pending-bundle-saved">${name}：${price.toLocaleString()} VP 已儲存</span>`;
    setTimeout(() => { state.collectionLoaded = false; loadCollection(); }, 600);
  } catch {
    btn.disabled = false;
    btn.textContent = '確認';
    input.style.borderColor = 'var(--accent)';
  }
}

// ─── 願望清單（wishlist）從 localStorage 初始化 ───
// 頁面載入時立即讀取，不需要等登入
const WISHLIST_KEY = 'val-wishlist';

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function toggleWishlist(uuid) {
  const list = getWishlist();
  const idx = list.indexOf(uuid);
  if (idx === -1) {
    list.push(uuid);
  } else {
    list.splice(idx, 1);
  }
  saveWishlist(list);
  return list.includes(uuid); // 回傳「現在是否在清單內」
}

// ─── Toast 通知（右上角滑入，2.6 秒後自動消失） ───
function showToast(text, type = 'info') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const icon = type === 'add' ? '&#x2665;' : type === 'remove' ? '&#x2661;' : '&#x2022;';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${text}</span>`;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-in'));
  setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 2600);
}
window.showToast = showToast;

// ─── 初始化 ───

async function init() {
  // 注入移動格線背景
  const bg = document.createElement('div');
  bg.className = 'bg-grid';
  document.body.prepend(bg);

  // 平行：快取地圖圖片 + 確認 session 狀態
  const [_, status] = await Promise.all([
    cacheMaps(),
    apiFetch('/api/auth/status')
  ]);

  if (status.loggedIn) {
    onLoginSuccess({ gameName: status.gameName });
  } else {
    $('loginModal').classList.remove('hidden');
  }

  setupListeners();
}

async function cacheMaps() {
  try {
    const res = await fetch('https://valorant-api.com/v1/maps');
    const json = await res.json();
    const maps = json.data || [];
    maps.forEach(m => {
      state.maps[m.displayName] = m.splash || m.listViewIcon || '';
    });

    // 登入頁背景：只用目前在排位池的地圖
    const RANKED = new Set(['ascent', 'split', 'bind', 'haven', 'icebox', 'lotus', 'sunset', 'abyss', 'pearl']);
    const splashMaps = maps.filter(m => m.splash && RANKED.has(m.displayName?.toLowerCase()));
    if (splashMaps.length > 0) {
      const pick = splashMaps[Math.floor(Math.random() * splashMaps.length)];
      const loginEl = $('loginModal');
      if (loginEl) {
        loginEl.style.backgroundImage = [
          `linear-gradient(to top, rgba(5,8,12,0.88) 0%, rgba(5,8,12,0.5) 35%, rgba(5,8,12,0.1) 70%, rgba(5,8,12,0) 100%)`,
          `url('${pick.splash}')`
        ].join(', ');
        loginEl.style.backgroundSize = 'cover';
        loginEl.style.backgroundPosition = 'center';
      }
    }
  } catch {
    // 失敗不影響主功能
  }
}

// ─── 事件綁定 ───

function setupListeners() {
  $('logoutBtn').addEventListener('click', handleLogout);
  $('refreshStoreBtn').addEventListener('click', loadStore);

  // ─── Tab 滑動指示條 ───
  const navTabs = document.querySelector('.nav-tabs');
  const indicator = document.createElement('div');
  indicator.className = 'tab-indicator';
  navTabs.appendChild(indicator);

  function moveIndicator(btn) {
    const navRect = navTabs.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicator.style.left  = `${btnRect.left - navRect.left}px`;
    indicator.style.width = `${btnRect.width}px`;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      moveIndicator(btn);
      switchTab(btn.dataset.tab);
    });
  });

  // 等 DOM 算完位置後設初始位置
  requestAnimationFrame(() => {
    const activeBtn = document.querySelector('.tab-btn.active');
    if (activeBtn) moveIndicator(activeBtn);
  });

  $('playerIdInput').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const raw = $('playerIdInput').value.trim();
    const [name, tag] = raw.split('#');
    if (name && tag) {
      state.player = { name: name.trim(), tag: tag.trim() };
      if (!$('matchesTab').classList.contains('hidden')) loadMatches();
    }
  });
}

// ─── 認證 ───

// 跨域安全限制下偵測不到使用者在 404 頁「複製完」的動作，改在貼上網址時關閉這個 Riot 視窗
let authPopup = null;
function closeAuthPopup() {
  // 延遲一拍讓貼上先完成再關；若視窗已被手動關閉則略過
  setTimeout(() => { if (authPopup && !authPopup.closed) authPopup.close(); authPopup = null; }, 120);
}

function handleLogin() {
  const region = $('regionSelect').value;
  sessionStorage.setItem('loginRegion', region);

  const authUrl = 'https://auth.riotgames.com/authorize?' + new URLSearchParams({
    redirect_uri: 'https://playvalorant.com/opt_in',
    client_id: 'play-valorant-web-prod',
    response_type: 'token id_token',
    nonce: Math.random().toString(36).slice(2),
    scope: 'account openid',
  });

  authPopup = window.open(authUrl, 'riot-auth', 'width=480,height=680,left=200,top=80');
  // 貼上網址的瞬間自動關閉上面那個 Riot 404 視窗（抓得到的、最接近「複製完」的時機）
  $('tokenUrlInput').addEventListener('paste', closeAuthPopup, { once: true });
  $('loginStep1').style.display = 'none';
  $('loginStep2').style.display = 'block';
  $('loginError').textContent = '';
}

function resetLogin() {
  $('loginStep1').style.display = 'block';
  $('loginStep2').style.display = 'none';
  $('tokenUrlInput').value = '';
  $('loginError').textContent = '';
}

function openLoginHelp() {
  $('loginHelp').classList.remove('hidden');
}

function closeLoginHelp() {
  $('loginHelp').classList.add('hidden');
}

async function handleTokenPaste() {
  const raw = $('tokenUrlInput').value.trim();
  const errEl = $('loginError');
  errEl.textContent = '';

  // 支援貼完整 URL 或只貼 hash 部分
  let hash = raw;
  if (raw.includes('#')) hash = raw.split('#')[1];
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) {
    errEl.textContent = '找不到 access_token，請確認貼入的是完整網址';
    return;
  }

  const region = sessionStorage.getItem('loginRegion') || 'ap';
  const data = await apiFetch('/api/auth/from-token', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });

  if (data.error) {
    errEl.textContent = data.error === 'INVALID_TOKEN' ? 'Token 無效或已過期，請重新登入' : '登入失敗：' + data.error;
    return;
  }

  onLoginSuccess(data);
}


function onLoginSuccess(data) {
  $('loginModal').classList.add('hidden');
  $('app').classList.remove('hidden');

  if (data.gameName) {
    const parts = data.gameName.split('#');
    if (parts.length === 2) {
      state.player = { name: parts[0], tag: parts[1] };
      $('playerIdInput').value = data.gameName;
    }
  }

  // 顯示玩家名稱到 profileHeader（先用 gameName 填）
  if (data.gameName) {
    const parts = data.gameName.split('#');
    $('profileName').textContent = parts[0] || '--';
    $('profileTag').textContent = parts[1] ? `#${parts[1]}` : '';
  }

  // 並行載入商店 + profile + 擁有物品清單
  loadStore();
  loadProfile();
  loadInventory();
  window.initAgentPeek?.();
  window.initKillFeed?.();
}

async function handleLogout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });

  if (state.storeTimer) { clearInterval(state.storeTimer); state.storeTimer = null; }
  state.player = { name: '', tag: '' };

  $('app').classList.add('hidden');
  $('profileHeader').classList.add('hidden');
  $('loginModal').classList.remove('hidden');
  $('loginError').textContent = '';
  $('storeGrid').innerHTML = '';
  $('matchesList').innerHTML = '';
  $('historyList').innerHTML = '';
  $('collectionGrid').innerHTML = '';
  $('collectionCount').textContent = '';
  $('matchStats').classList.add('hidden');
  $('matchCharts').classList.add('hidden');
  state.collectionLoaded = false;
  document.querySelector('.night-market-section')?.remove();
  document.querySelector('.wishlist-banner')?.remove();

  // 重置回商店 tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="store"]').classList.add('active');
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
  $('storeTab').classList.remove('hidden');
}

// ─── Tab 切換 ───

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));

  const tabEl = $(`${tab}Tab`);
  tabEl.classList.remove('hidden');
  tabEl.classList.remove('tab-animate');
  void tabEl.offsetWidth; // 強制 reflow，讓動畫重新觸發
  tabEl.classList.add('tab-animate');

  if (tab === 'matches' && state.player.name) loadMatches();
  if (tab === 'history') loadHistory();
  if (tab === 'collection') loadCollection();
  if (tab === 'bundles') loadBundleCatalog();
}

// ─── 玩家 Profile（rank + wallet） ───

async function loadProfile() {
  try {
    // 並行抓 rank 和 wallet，都失敗也不影響其他功能
    const [rankData, walletData] = await Promise.all([
      apiFetch('/api/rank').catch(() => null),
      apiFetch('/api/wallet').catch(() => null)
    ]);

    // 填入段位資訊
    if (rankData && !rankData.error) {
      const tierNameEl = $('profileTierName');
      const tierRREl = $('profileRR');
      const rankIconEl = $('profileRankIcon');

      tierNameEl.textContent = rankData.tierName || 'Unrated';
      tierRREl.textContent = `${rankData.rr ?? '--'} RR`;

      // 設定段位顏色（用 data-tier 屬性對應 CSS）
      const tierSlug = (rankData.tierName || '').toLowerCase().split(' ')[0];
      tierNameEl.setAttribute('data-tier', tierSlug);

      if (rankData.tierIcon) {
        rankIconEl.src = rankData.tierIcon;
        rankIconEl.style.display = '';
      }
    }

    // 填入貨幣餘額（亂碼效果）
    if (walletData && !walletData.error) {
      animateScramble($('profileVP'), (walletData.vp ?? 0).toLocaleString());
      animateScramble($('profileRP'), (walletData.rp ?? 0).toLocaleString());
    }

    // 顯示 profile header，各區塊依序滑入
    $('profileHeader').classList.remove('hidden');
    const parts = $('profileHeader').querySelectorAll('.profile-rank, .profile-player, .profile-currency');
    parts.forEach((el, i) => {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = `profileSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 110}ms both`;
    });
  } catch {
    // profile 載入失敗不阻塞主功能，靜默跳過
  }
}

// ─── 擁有皮膚清單 ───

async function loadInventory() {
  try {
    const data = await apiFetch('/api/inventory');
    if (!data.ownedUuids) return;

    state.ownedSkins = new Set(data.ownedUuids);
    state.ownedSkinCount = data.ownedSkinCount || 0;  // 造型（不重複皮膚）數

    // 商店卡片可能已渲染，補上標記
    document.querySelectorAll('.skin-card[data-uuid]').forEach(card => {
      if (state.ownedSkins.has(card.dataset.uuid)) {
        markCardAsOwned(card);
      }
    });
  } catch {}
}

function markCardAsOwned(card) {
  if (card.classList.contains('is-owned')) return;
  card.classList.add('is-owned');
  const wrap = card.querySelector('.skin-img-wrap');
  if (wrap && !wrap.querySelector('.owned-badge')) {
    const badge = document.createElement('div');
    badge.className = 'owned-badge';
    badge.textContent = '已擁有';
    wrap.appendChild(badge);
  }
}

// ─── 我的收藏 ───

async function loadCollection() {
  if (state.collectionLoaded) {
    renderCollection($('collectionSearch').value.trim(), $('collectionWeaponFilter').value);
    return;
  }

  $('collectionGrid').innerHTML = '<div class="state-msg">正在讀取收藏清單...</div>';
  $('collectionCount').textContent = '';

  const data = await apiFetch('/api/collection');

  if (data.error) {
    $('collectionGrid').innerHTML = `<div class="error-state">載入失敗（${data.error}）</div>`;
    return;
  }

  state.allCollectionSkins = data.skins || [];
  state.collectionLoaded = true;

  // 移除舊的 notice / spending bar / pending panel
  document.querySelector('.collection-notice')?.remove();
  document.querySelector('.spending-bar')?.remove();
  document.querySelector('.pending-bundles-panel')?.remove();

  if (data.mode === 'loadout') {
    const notice = document.createElement('div');
    notice.className = 'collection-notice';
    notice.innerHTML = '目前只顯示各武器目前裝備的皮膚。點左上角<strong>登出</strong>，再使用<strong>「瀏覽器登入」</strong>可查看完整收藏。';
    $('collectionTab').insertBefore(notice, $('collectionGrid'));
  }

  if (data.mode === 'full') {
    const bar = document.createElement('div');
    bar.className = 'spending-bar';
    const actualVP = data.totalActualVP ?? data.totalVP ?? 0;
    const savedVP = (data.totalVP ?? 0) - actualVP;
    const pendingBundles = data.pendingBundles ?? [];
    const savedStr = savedVP > 0 ? ` <span class="spending-saved">(省 ${savedVP.toLocaleString()})</span>` : '';
    const pendingNote = pendingBundles.length > 0
      ? `<span class="spending-pending"> (含估計值，${pendingBundles.length} 個組合包待輸入包價)</span>` : '';
    bar.innerHTML = `
      <div class="spending-stat">
        <div class="spending-stat-val">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" class="spending-vp-icon" alt="VP">
          ${(data.totalVP ?? 0).toLocaleString()}
        </div>
        <div class="spending-stat-label">庫存價值 VP</div>
      </div>
      <div class="spending-divider"></div>
      <div class="spending-stat">
        <div class="spending-stat-val">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" class="spending-vp-icon" alt="VP">
          ${actualVP.toLocaleString()}${savedStr}${pendingNote}
        </div>
        <div class="spending-stat-label">實際花費 VP</div>
      </div>
      <div class="spending-divider"></div>
      <div class="spending-stat">
        <div class="spending-stat-val">
          <img src="https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png" class="spending-vp-icon" alt="RP">
          ${(data.totalRP ?? 0).toLocaleString()}
        </div>
        <div class="spending-stat-label">已用 R 點</div>
      </div>
      <div class="spending-divider"></div>
      <div class="spending-stat">
        <div class="spending-stat-val spending-count">${data.skinCount ?? data.total ?? 0}</div>
        <div class="spending-stat-label">造型總數</div>
      </div>
    `;
    $('collectionTab').insertBefore(bar, $('collectionGrid'));

    if (pendingBundles.length > 0) {
      const panel = document.createElement('div');
      panel.className = 'pending-bundles-panel';
      panel.innerHTML = `<div class="pending-bundles-title">偵測到以下組合包，請輸入當初付的包價：</div>` +
        pendingBundles.map(b => `
          <div class="pending-bundle-row" data-theme="${b.themeUuid}">
            <span class="pending-bundle-name">${b.name} <span class="pending-bundle-count">(${b.skinCount} 件)</span></span>
            <input type="number" class="pending-bundle-input" placeholder="包價 VP">
            <button class="pending-bundle-btn" onclick="submitBundlePrice(this, '${b.themeUuid}', '${b.name}')">確認</button>
          </div>
        `).join('');
      $('collectionTab').insertBefore(panel, $('collectionGrid'));
    }
  }

  // 建立武器篩選器選項
  const weapons = [...new Set(state.allCollectionSkins.map(s => s.weaponName))].sort();
  const select = $('collectionWeaponFilter');
  select.innerHTML = '<option value="">全部武器</option>';
  weapons.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    select.appendChild(opt);
  });

  // 搜尋與篩選事件
  $('collectionSearch').addEventListener('input', () => {
    renderCollection($('collectionSearch').value.trim(), $('collectionWeaponFilter').value);
  });
  $('collectionWeaponFilter').addEventListener('change', () => {
    renderCollection($('collectionSearch').value.trim(), $('collectionWeaponFilter').value);
  });

  renderCollection('', '');
}

function renderCollection(query, weaponFilter) {
  const q = query.toLowerCase();
  const filtered = state.allCollectionSkins.filter(s => {
    const matchQ = !q || s.skinName.toLowerCase().includes(q) || s.weaponName.toLowerCase().includes(q);
    const matchW = !weaponFilter || s.weaponName === weaponFilter;
    return matchQ && matchW;
  });

  $('collectionCount').textContent = `共 ${filtered.length} 款`;
  $('collectionGrid').innerHTML = '';

  if (filtered.length === 0) {
    $('collectionGrid').innerHTML = '<div class="state-msg">沒有符合條件的皮膚</div>';
    return;
  }

  filtered.forEach((skin, i) => {
    const card = buildCollectionCard(skin);
    card.style.animationDelay = `${Math.min(i, 30) * 40}ms`;
    $('collectionGrid').appendChild(card);
  });
}

function buildCollectionCard(skin) {
  const card = document.createElement('div');
  card.className = `collection-card${skin.equipped ? ' is-equipped' : ''}`;
  card.dataset.uuid = skin.uuid;
  const tier = uuidToTier(skin.contentTierUuid);
  if (tier) card.dataset.tier = tier;

  const tierIcon = skin.contentTierUuid
    ? `<img class="tier-icon" src="https://media.valorant-api.com/contenttiers/${skin.contentTierUuid}/displayicon.png" alt="" onerror="this.style.display='none'">`
    : '';

  const equippedBadge = skin.equipped
    ? `<span class="equipped-badge">裝備中</span>`
    : '';

  const chromas = skin.chromas || [];
  // 把每個幻彩的圖示 URL 存在 data-icon；若 chroma 本身沒有專屬圖示，退回 skin.icon
  const swatchHtml = chromas.length > 1
    ? `<div class="chroma-swatches">${chromas.map((c, i) => {
        const icon = c.icon || skin.icon || '';
        return c.swatch
          ? `<img class="chroma-swatch${i === 0 ? ' active' : ''}" src="${c.swatch}" data-icon="${icon}" alt="" title="幻彩 ${i + 1}" onerror="this.style.opacity='0.3'">`
          : `<span class="chroma-swatch chroma-dot${i === 0 ? ' active' : ''}" data-icon="${icon}"></span>`;
      }).join('')}</div>`
    : '';

  card.innerHTML = `
    <div class="col-img-wrap">
      ${skin.icon
        ? `<img src="${skin.icon}" alt="${skin.skinName}" class="col-skin-img" loading="lazy">`
        : `<div class="skin-img-placeholder">?</div>`}
      ${tierIcon}
    </div>
    <div class="col-info">
      <p class="col-skin-name">${skin.skinName}</p>
      <p class="col-weapon-name">${skin.weaponName}${equippedBadge}</p>
      ${swatchHtml}
    </div>
  `;

  // 幻彩切換：預先 preload 所有彩圖，點擊直接換 src
  if (chromas.length > 1) {
    const imgEl = card.querySelector('.col-skin-img');
    // 預先載入所有幻彩圖，讓切換瞬間完成
    chromas.forEach(c => { if (c.icon) { const pre = new Image(); pre.src = c.icon; } });
    card.querySelectorAll('.chroma-swatch').forEach(sw => {
      sw.addEventListener('click', e => {
        e.stopPropagation();
        card.querySelectorAll('.chroma-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        if (imgEl && sw.dataset.icon) imgEl.src = sw.dataset.icon;
      });
    });
  }

  // 點擊武器圖片區開啟皮膚預覽
  card.querySelector('.col-img-wrap').addEventListener('click', () => openSkinPreview(skin));

  setTimeout(() => add3DTilt(card), 300 + Math.random() * 200);
  return card;
}

// ─── 皮膚預覽 Modal ───

const LEVEL_TYPE_LABELS = {
  'EEquippableSkinLevelItem::VFX':              '視覺特效',
  'EEquippableSkinLevelItem::Animation':        '動畫升級',
  'EEquippableSkinLevelItem::Finisher':         '擊殺動畫',
  'EEquippableSkinLevelItem::KillBanner':       '擊殺橫幅',
  'EEquippableSkinLevelItem::InspectAndKill':   '觀察動畫',
  'EEquippableSkinLevelItem::SoundEffects':     '音效升級',
  'EEquippableSkinLevelItem::TopFrag':          '頂尖射手',
  'EEquippableSkinLevelItem::HeartbeatAndMapSensor': '心跳感應',
  'EEquippableSkinLevelItem::Transformation':   '變形動畫',
  'EEquippableSkinLevelItem::Voiceover':        '專屬語音',
  'EEquippableSkinLevelItem::Randomizer':       '隨機外觀',
  'EEquippableSkinLevelItem::KillEffect':       '擊殺特效',
  'EEquippableSkinLevelItem::KillCounter':      '擊殺計數',
  'EEquippableSkinLevelItem::SongShuffle':      '樂曲切換',
  'EEquippableSkinLevelItem::FishAnimation':    '魚兒動畫',
  'EEquippableSkinLevelItem::AttackerDefenderSwap': '攻守外觀',
};

// 每個等級「實際解鎖了什麼」的說明，補足靜音影片看不出的差異
const LEVEL_TYPE_DESC = {
  'EEquippableSkinLevelItem::VFX':              '此等級新增專屬視覺特效（彈道、命中、開火光效）',
  'EEquippableSkinLevelItem::Animation':        '此等級新增專屬動畫（裝備、檢視等動作）',
  'EEquippableSkinLevelItem::Finisher':         '擊殺敵人時觸發的專屬終結動畫',
  'EEquippableSkinLevelItem::KillBanner':       '擊殺時顯示的專屬擊殺橫幅',
  'EEquippableSkinLevelItem::InspectAndKill':   '檢視與擊殺時的專屬動畫',
  'EEquippableSkinLevelItem::SoundEffects':     '此等級新增專屬開火／換彈音效，畫面與基礎外觀相同',
  'EEquippableSkinLevelItem::TopFrag':          '當局頂尖表現時觸發的專屬效果',
  'EEquippableSkinLevelItem::HeartbeatAndMapSensor': '新增心跳感應／地圖偵測效果',
  'EEquippableSkinLevelItem::Transformation':   '此等級可變形切換不同外觀型態',
  'EEquippableSkinLevelItem::Voiceover':        '此等級新增專屬語音',
  'EEquippableSkinLevelItem::Randomizer':       '此等級可隨機切換外觀',
  'EEquippableSkinLevelItem::KillEffect':       '擊殺敵人時觸發的專屬視覺特效',
  'EEquippableSkinLevelItem::KillCounter':      '此等級新增槍身擊殺數計數器',
  'EEquippableSkinLevelItem::SongShuffle':      '此等級可切換不同背景樂曲',
  'EEquippableSkinLevelItem::FishAnimation':    '此等級新增專屬魚類動畫效果',
  'EEquippableSkinLevelItem::AttackerDefenderSwap': '進攻／防守方時顯示不同外觀',
};

function levelDesc(levelItem) {
  if (!levelItem) return '皮膚的基礎外觀';
  return LEVEL_TYPE_DESC[levelItem] || '此等級的升級內容';
}

// 影片靜音狀態（預設開聲音；若被瀏覽器自動播放政策擋下，spSetMedia 會降級靜音重播以保住畫面）
let spMuted = false;

function ytEmbedUrl(raw) {
  if (!raw) return null;
  const m = raw.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!m) return null;
  const id = m[1];
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&modestbranding=1&controls=1&rel=0`;
}

function spSetMedia(videoUrl, fallbackIcon) {
  const inner = document.getElementById('sp-media-inner');
  if (!inner) return;

  // 清掉舊的 iframe / video
  inner.querySelectorAll('iframe').forEach(f => { f.src = ''; f.remove(); });
  inner.querySelectorAll('video').forEach(v => { v.src = ''; v.remove(); });

  if (!videoUrl) return;

  const embedUrl = ytEmbedUrl(videoUrl);

  const fadeInMedia = (el, delay) => {
    inner.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '1';
      const img = inner.querySelector('.sp-fallback-img');
      if (img) {
        img.style.transition = 'opacity 0.4s';
        img.style.opacity = '0';
        setTimeout(() => img.remove(), 400);
      }
    }, delay);
  };

  if (embedUrl) {
    // YouTube embed
    const iframe = document.createElement('iframe');
    iframe.className = 'sp-iframe';
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;border:none;';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.src = embedUrl;
    fadeInMedia(iframe, 1400);
  } else {
    // Riot CDN 直接 MP4
    const video = document.createElement('video');
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;';
    video.autoplay = true;
    video.loop = true;
    video.controls = true;
    video.muted = spMuted;
    video.volume = 0.5;
    video.src = videoUrl;
    video.play().catch(() => {
      // 非靜音自動播放被瀏覽器擋下時，降級為靜音重播以保住畫面（使用者可再用聲音鈕開啟）
      if (!video.muted) { video.muted = true; video.play().catch(() => {}); }
    });
    fadeInMedia(video, 300);
  }
}

async function openSkinPreview(skin) {
  const name = skin.name || skin.skinName || 'Unknown';
  const weaponName = skin.weaponName || '';
  const icon = skin.icon || '';
  const cost = skin.cost || null;
  const contentTierUuid = skin.contentTierUuid || null;
  const tier = contentTierUuid
    ? (TIER_UUID[contentTierUuid.toLowerCase()] || null)
    : (cost ? costToTier(cost) : null);

  document.getElementById('skin-preview-ol')?.remove();

  const ol = document.createElement('div');
  ol.id = 'skin-preview-ol';
  ol.className = 'sp-overlay';
  if (tier) ol.dataset.tier = tier;

  const wlUuid = skin.uuid || '';
  const inWishlist = wlUuid && getWishlist().includes(wlUuid);

  ol.innerHTML = `
    <div class="sp-backdrop"></div>
    <div class="sp-panel">
      <div class="sp-media">
        <div class="sp-media-inner" id="sp-media-inner">
          <img class="sp-fallback-img" src="${icon}" alt="${name}">
        </div>
      </div>
      <div class="sp-info">
        <div class="sp-info-top">
          ${contentTierUuid ? `<img class="sp-tier-icon" src="https://media.valorant-api.com/contenttiers/${contentTierUuid}/displayicon.png" alt="" onerror="this.style.display='none'">` : ''}
          <div class="sp-names">
            <div class="sp-skin-name">${name}</div>
            ${weaponName ? `<div class="sp-weapon-name">${weaponName}</div>` : ''}
          </div>
          <button class="sp-close" id="sp-close">&#x2715;</button>
        </div>
        <div class="sp-levels" id="sp-levels"></div>
        <div class="sp-level-meta">
          <div class="sp-level-desc" id="sp-level-desc"></div>
          <button class="sp-mute" id="sp-mute" type="button">聲音：關</button>
        </div>
        <div class="sp-footer">
          ${wlUuid ? `<button class="sp-wishlist-btn${inWishlist ? ' active' : ''}" id="sp-wl-btn" data-uuid="${wlUuid}">${inWishlist ? '&#x2665; 已加入心願清單' : '&#x2661; 加入心願清單'}</button>` : '<div></div>'}
          ${cost ? `<div class="sp-cost"><img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png" class="sp-vp-icon" alt="VP">${cost.toLocaleString()} VP</div>` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(ol);
  requestAnimationFrame(() => ol.classList.add('sp-in'));

  // 滑鼠跟隨 3D 傾斜（只對靜態圖片有效，iframe 不觸發）
  // reduced-motion 下整個停用；平時以 rAF 節流，每個重繪幀最多更新一次
  const mediaArea = ol.querySelector('.sp-media');
  if (!REDUCE_MOTION) {
    const glareEl = document.createElement('div');
    glareEl.className = 'sp-glare';
    mediaArea.appendChild(glareEl);

    let rafId = null, cx = 0, cy = 0;
    mediaArea.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const img = ol.querySelector('.sp-fallback-img');
        if (!img) return;
        const rect = mediaArea.getBoundingClientRect();
        const x = (cx - rect.left) / rect.width;
        const y = (cy - rect.top) / rect.height;
        const tiltX = (0.5 - y) * 22;
        const tiltY = (x - 0.5) * 22;
        img.style.animation = 'none';
        img.style.transform = `perspective(560px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.06) translateZ(24px)`;
        img.style.transition = 'transform 0.05s linear';
        // 方向性陰影：光源在游標，陰影往反方向偏，製造浮起的體積感
        const shX = (0.5 - x) * 30;
        const shY = (0.5 - y) * 30;
        img.style.filter = `drop-shadow(${shX}px ${shY}px 24px rgba(0,0,0,0.6)) drop-shadow(0 0 18px rgba(255,255,255,0.07))`;
        // 跟隨游標的亮點高光 + 隨角度掃動的斜向 sheen
        glareEl.style.opacity = '1';
        glareEl.style.background =
          `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.14) 0%, transparent 55%),`
          + `linear-gradient(${(x - 0.5) * 60 + 110}deg, transparent 42%, rgba(255,255,255,0.06) 50%, transparent 58%)`;
      });
    });

    mediaArea.addEventListener('mouseleave', () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      const img = ol.querySelector('.sp-fallback-img');
      if (!img) return;
      img.style.transition = 'transform 0.5s ease, filter 0.5s ease';
      img.style.transform = '';
      img.style.filter = '';
      setTimeout(() => { if (img) { img.style.animation = ''; img.style.transition = ''; } }, 500);
      glareEl.style.opacity = '0';
    });
  }

  const stopVideo = () => { const f = ol.querySelector('iframe'); if (f) f.src = ''; };
  const close = () => {
    stopVideo();
    ol.classList.remove('sp-in');
    setTimeout(() => ol.remove(), 280);
  };

  ol.querySelector('.sp-backdrop').addEventListener('click', close);
  document.getElementById('sp-close').addEventListener('click', close);
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  const wlBtn = document.getElementById('sp-wl-btn');
  if (wlBtn) {
    wlBtn.addEventListener('click', () => {
      const nowIn = toggleWishlist(wlBtn.dataset.uuid);
      wlBtn.classList.toggle('active', nowIn);
      wlBtn.innerHTML = nowIn ? '&#x2665; 已加入心願清單' : '&#x2661; 加入心願清單';
      showToast(nowIn ? '已加入心願清單' : '已移除心願清單', nowIn ? 'add' : 'remove');
    });
  }

  const muteBtn = document.getElementById('sp-mute');
  if (muteBtn) {
    const syncMute = () => {
      muteBtn.textContent = spMuted ? '聲音：關' : '聲音：開';
      muteBtn.classList.toggle('on', !spMuted);
    };
    syncMute();
    muteBtn.addEventListener('click', () => {
      spMuted = !spMuted;
      syncMute();
      const v = document.querySelector('#sp-media-inner video');
      if (v) { v.muted = spMuted; if (!spMuted) v.play().catch(() => {}); }
    });
  }

  // 用 skinUuid 抓完整皮膚資料（含所有等級影片）；缺 skinUuid 時用 store 傳入的影片兜底
  const skinUuid = skin.skinUuid;
  if (!skinUuid) {
    if (skin.streamedVideo) spSetMedia(skin.streamedVideo, icon);
    return;
  }

  try {
    const r = await fetch(`https://valorant-api.com/v1/weapons/skins/${skinUuid}?language=zh-TW`);
    const json = await r.json();
    const fullSkin = json.data;
    if (!fullSkin?.levels?.length) return;

    const levels = fullSkin.levels;
    const levelsEl = document.getElementById('sp-levels');
    if (!levelsEl) return;

    // 預先算每個等級的標籤與說明，處理同類型重複（例如兩個視覺特效）
    const typeTotal = {};
    levels.forEach(l => { const t = l.levelItem || 'BASE'; typeTotal[t] = (typeTotal[t] || 0) + 1; });
    const typeSeen = {};
    const levelMeta = levels.map((l, i) => {
      const t = l.levelItem || 'BASE';
      typeSeen[t] = (typeSeen[t] || 0) + 1;
      const base = l.levelItem ? (LEVEL_TYPE_LABELS[l.levelItem] || `等級 ${i + 1}`) : '基礎外觀';
      const dup = typeTotal[t] > 1;                       // 同類型出現多次才加序號
      const label = dup ? `${base} ${typeSeen[t]}` : base;
      let desc = `第 ${i + 1} / ${levels.length} 級 · ${levelDesc(l.levelItem)}`;
      if (dup && typeSeen[t] > 1) desc += '（在前一級基礎上進一步強化，等級越高效果越完整）';
      return { label, desc };
    });
    const descEl = document.getElementById('sp-level-desc');
    const setDesc = (i) => { if (descEl) descEl.textContent = levelMeta[i]?.desc || ''; };

    if (levels.length > 1) {
      levelsEl.innerHTML = levels.map((l, i) => {
        const hasVideo = !!l.streamedVideo;
        return `<button class="sp-level-btn${!hasVideo ? ' no-video' : ''}" data-idx="${i}" data-video="${l.streamedVideo || ''}">${levelMeta[i].label}</button>`;
      }).join('');

      const btnEls = levelsEl.querySelectorAll('.sp-level-btn');
      btnEls.forEach(btn => {
        btn.addEventListener('click', () => {
          btnEls.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          setDesc(+btn.dataset.idx);
          if (btn.classList.contains('no-video')) {
            // 沒影片：清掉舊 iframe，恢復靜態圖
            const inner = document.getElementById('sp-media-inner');
            if (inner) {
              inner.querySelectorAll('iframe').forEach(f => { f.src = ''; f.remove(); });
              if (!inner.querySelector('.sp-fallback-img')) {
                const img = document.createElement('img');
                img.className = 'sp-fallback-img';
                img.src = icon;
                img.alt = name;
                inner.prepend(img);
              }
            }
          } else {
            spSetMedia(btn.dataset.video, icon);
          }
        });
      });

      // 預設定位到「擊殺動畫(Finisher)」終結特效；沒有則退而選最高等級的影片
      const finisherIdx = levels.findIndex(l => l.levelItem === 'EEquippableSkinLevelItem::Finisher' && l.streamedVideo);
      let lastVideoIdx = -1;
      for (let i = levels.length - 1; i >= 0; i--) { if (levels[i].streamedVideo) { lastVideoIdx = i; break; } }
      const initIdx = finisherIdx !== -1 ? finisherIdx : lastVideoIdx;
      const activeBtn = initIdx !== -1 ? btnEls[initIdx] : btnEls[0];
      if (activeBtn) {
        activeBtn.classList.add('active');
        setDesc(+activeBtn.dataset.idx);
        if (!activeBtn.classList.contains('no-video')) spSetMedia(activeBtn.dataset.video, icon);
      }
    } else {
      // 單一等級：顯示說明並播放該等級影片
      setDesc(0);
      if (levels[0]?.streamedVideo) spSetMedia(levels[0].streamedVideo, icon);
    }
  } catch {
    // 靜默失敗，圖片 fallback 已顯示
  }
}

// ─── 商店 ───

// 翻牌揭曉音效（Web Audio 合成，不需音檔）；命中心願清單時音調更亮
let _revealAudioCtx = null;
function playRevealSound(hit) {
  try {
    _revealAudioCtx = _revealAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _revealAudioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = hit ? 'triangle' : 'sine';
    const f = hit ? 740 : 420;
    o.frequency.setValueAtTime(f, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f * 1.6, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(hit ? 0.10 : 0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {}
}

async function loadStore() {
  $('storeGrid').innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    sk.innerHTML = `<div class="skel-img"></div><div class="skel-info"><div class="skel-line"></div><div class="skel-line short"></div></div>`;
    $('storeGrid').appendChild(sk);
  }
  document.querySelector('.night-market-section')?.remove();

  // 商店與歷史統計並行抓取，歷史用來在卡片上標示「上次出現」
  const [data] = await Promise.all([
    apiFetch('/api/store', { method: 'POST' }),
    buildStoreHistoryStats(),
  ]);

  if (data.error) {
    if (data.error === 'NOT_AUTHENTICATED' || data.error === 'TOKEN_EXPIRED') {
      $('app').classList.add('hidden');
      $('loginModal').classList.remove('hidden');
      $('loginError').textContent = 'Session 已過期，請重新登入';
    } else {
      $('storeGrid').innerHTML = `<div class="error-state">商店載入失敗（${data.error}）</div>`;
    }
    return;
  }

  // 渲染 4 個每日皮膚，依序翻牌揭曉
  $('storeGrid').innerHTML = '';
  const wlSet = new Set(getWishlist());
  const dailyCards = (data.dailyOffers || []).map((skin) => {
    const card = buildSkinCard(skin, false);
    $('storeGrid').appendChild(card);
    return { card, hit: !!(skin.uuid && wlSet.has(skin.uuid)) };
  });
  if (REDUCE_MOTION) {
    dailyCards.forEach(({ card }) => card.classList.add('revealed'));
  } else {
    dailyCards.forEach(({ card, hit }, i) => {
      setTimeout(() => {
        card.classList.add('revealed');
        if (hit) card.classList.add('wishlist-reveal');
        playRevealSound(hit);
      }, 300 + i * 420);
    });
  }

  // 夜市（開放期間才有資料）
  if (data.nightMarket && data.nightMarket.length > 0) {
    const section = document.createElement('div');
    section.className = 'night-market-section';
    section.innerHTML = '<h3 class="section-label">夜市 Night Market</h3>';
    const grid = document.createElement('div');
    grid.className = 'store-grid';
    data.nightMarket.forEach((skin, i) => {
      const card = buildSkinCard(skin, true);
      card.style.animationDelay = `${i * 80}ms`;
      grid.appendChild(card);
    });
    section.appendChild(grid);
    $('storeTab').appendChild(section);
  }

  if (data.remainingSeconds > 0) startCountdown(data.remainingSeconds);

  // Wishlist 命中 Banner
  const wishlist = new Set(getWishlist());
  const hits = (data.dailyOffers || []).filter(s => s.uuid && wishlist.has(s.uuid));
  document.querySelector('.wishlist-banner')?.remove();
  if (hits.length > 0) {
    const banner = document.createElement('div');
    banner.className = 'wishlist-banner';
    banner.innerHTML = `
      <div class="wb-icon">♥</div>
      <div class="wb-body">
        <div class="wb-title">今日心願達成 — 快去買！</div>
        <div class="wb-skins">${hits.map(s => s.name).join('、')}</div>
      </div>`;
    $('storeGrid').before(banner);
  }
}

// 商店歷史統計：uuid -> 出現過的日期陣列（已排序）。重用 historyCache 避免重複請求。
let storeHistoryStats = new Map();

async function buildStoreHistoryStats() {
  try {
    if (!historyCache) historyCache = await apiFetch('/api/store/history');
    const map = new Map();
    for (const [date, skins] of Object.entries(historyCache || {})) {
      for (const s of (skins || [])) {
        if (!s || !s.uuid) continue;
        if (!map.has(s.uuid)) map.set(s.uuid, []);
        map.get(s.uuid).push(date);
      }
    }
    for (const dates of map.values()) dates.sort(); // YYYY-MM-DD 字典序即時間序
    storeHistoryStats = map;
  } catch {
    storeHistoryStats = new Map();
  }
}

// 回傳某皮膚的歷史標籤文字（排除今天算「上次」），無紀錄回 null
function skinHistoryBadge(uuid) {
  const dates = storeHistoryStats.get(uuid);
  if (!dates || dates.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const past = dates.filter(d => d < today);
  if (past.length === 0) return '首次登場';
  const last = past[past.length - 1];
  const days = Math.round((Date.parse(today) - Date.parse(last)) / 86400000);
  const countPart = dates.length >= 3 ? ` · 共 ${dates.length} 次` : '';
  return `上次 ${days} 天前${countPart}`;
}

function buildSkinCard(skin, isNight) {
  const card = document.createElement('div');
  const wishlist = getWishlist();
  const inWishlist = skin.uuid && wishlist.includes(skin.uuid);
  const isOwned = skin.uuid && state.ownedSkins.has(skin.uuid);

  card.className = `skin-card${isNight ? ' night-skin' : ' revealing'}${inWishlist ? ' in-wishlist' : ''}${isOwned ? ' is-owned' : ''}`;
  card.dataset.uuid = skin.uuid || '';
  if (skin.cost) card.dataset.tier = costToTier(skin.cost);

  const costHtml = isNight
    ? `<span class="cost-strike">${skin.cost.toLocaleString()}</span>
       <span class="cost-final">${skin.discountCost.toLocaleString()}</span>
       <span class="discount-tag">-${skin.discountPercent}%</span>`
    : `<span>${skin.cost.toLocaleString()}</span>`;

  // 每日商店（非夜市）顯示歷史出現標籤
  const histText = (!isNight && skin.uuid) ? skinHistoryBadge(skin.uuid) : null;
  const histHtml = histText ? `<div class="skin-history">${histText}</div>` : '';

  card.innerHTML = `
    ${!isNight ? '<div class="card-cover"><span class="cover-mark">//</span></div>' : ''}
    <div class="skin-img-wrap">
      ${skin.icon
        ? `<img src="${skin.icon}" alt="${skin.name}" class="skin-img" loading="lazy">`
        : `<div class="skin-img-placeholder">?</div>`}
      ${skin.uuid ? `<button class="wishlist-btn${inWishlist ? ' active' : ''}" title="加入願望清單" data-uuid="${skin.uuid}">${inWishlist ? '&#x2665;' : '&#x2661;'}</button>` : ''}
    </div>
    <div class="skin-info">
      ${histHtml}
      <div class="skin-info-row">
        <p class="skin-name">${skin.name || 'Unknown Skin'}</p>
        <div class="skin-cost">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png"
               class="vp-icon" alt="VP" onerror="this.style.display='none'">
          ${costHtml}
        </div>
      </div>
    </div>
  `;

  // 愛心按鈕點擊事件
  const wishBtn = card.querySelector('.wishlist-btn');
  if (wishBtn) {
    wishBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const uuid = wishBtn.dataset.uuid;
      const nowIn = toggleWishlist(uuid);
      wishBtn.classList.toggle('active', nowIn);
      wishBtn.innerHTML = nowIn ? '&#x2665;' : '&#x2661;';
      card.classList.toggle('in-wishlist', nowIn);
      showToast(nowIn ? `已加入心願清單：${skin.name}` : `已移除：${skin.name}`, nowIn ? 'add' : 'remove');
      // 彈跳動畫
      wishBtn.classList.remove('pop');
      void wishBtn.offsetWidth;
      wishBtn.classList.add('pop');
    });
  }

  // 點擊圖片區開啟皮膚預覽
  card.querySelector('.skin-img-wrap').addEventListener('click', () => openSkinPreview(skin));

  // 3D 傾斜（等翻轉入場動畫結束後再啟用，避免衝突）
  const flipDuration = 550 + (parseInt(card.style.animationDelay) || 0);
  setTimeout(() => add3DTilt(card), flipDuration);

  return card;
}

function startCountdown(seconds) {
  if (state.storeTimer) clearInterval(state.storeTimer);
  let remaining = seconds;
  const total = seconds;
  const CIRCUMFERENCE = 113.1;

  const tick = () => {
    if (remaining <= 0) {
      $('storeTimer').textContent = '商店已重置，請重新整理';
      clearInterval(state.storeTimer);
      return;
    }
    const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    $('storeTimer').textContent = `${h}:${m}:${s}`;
    const isUrgent = remaining < 3600;
    $('storeTimer').classList.toggle('urgent', isUrgent);
    const ring = document.getElementById('spikeRing');
    if (ring) {
      ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - remaining / total);
      ring.classList.toggle('urgent', isUrgent);
    }
    remaining--;
  };

  tick();
  state.storeTimer = setInterval(tick, 1000);
}

// ─── 對戰紀錄 ───

async function loadMatches() {
  const { name, tag } = state.player;
  if (!name || !tag) {
    $('matchesList').innerHTML = '<div class="state-msg">輸入右上角的 Name#TAG 後按 Enter 開始搜尋</div>';
    return;
  }

  $('matchStats').classList.add('hidden');
  $('matchCharts').classList.add('hidden');
  $('matchesList').innerHTML = '<div class="state-msg">對戰紀錄載入中...</div>';

  const data = await apiFetch(`/api/matches?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`);

  if (data.error) {
    const msgs = {
      PLAYER_NOT_FOUND: `找不到玩家 ${name}#${tag}，請確認 Riot ID 格式是否正確`,
      NO_HENRIK_KEY: '後端未設定 Henrik API Key。請在專案根目錄建立 .env 檔並加入 HENRIK_API_KEY',
      NOT_AUTHENTICATED: '請先登入',
      MATCHES_FETCH_FAILED: '對戰紀錄取得失敗，請稍後再試'
    };
    $('matchesList').innerHTML = `<div class="error-state">${msgs[data.error] || data.message || '未知錯誤'}</div>`;
    return;
  }

  const matches = (data.data || []).filter(m => m.metadata?.mode?.toLowerCase() !== 'deathmatch');
  if (matches.length === 0) {
    $('matchesList').innerHTML = `<div class="state-msg">找不到 ${name}#${tag} 的近期對戰紀錄</div>`;
    return;
  }

  $('matchesList').innerHTML = '';
  let idx = 0;
  matches.forEach(match => {
    const card = buildMatchCard(match, name, tag);
    if (card) {
      card.style.animationDelay = `${idx * 50}ms`;
      $('matchesList').appendChild(card);
      idx++;
    }
  });

  // 計算並顯示統計摘要（需要在 buildMatchCard 之後，因為 matches 資料完整才能統計）
  renderMatchStats(matches, name, tag);
}

// 計算統計數據並渲染到 #matchStats
function renderMatchStats(matches, playerName, playerTag) {
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let validCount = 0;
  let totalScore = 0, totalRounds = 0;
  let totalHead = 0, totalBody = 0, totalLeg = 0;
  const agentStats = {};  // agent -> { games, wins, icon }
  const mapStats = {};    // map   -> { games, wins }
  const recentResults = []; // 最多 15 場
  const kdSeries = [];      // 最近場次的 K/D，用於走勢折線

  matches.forEach(match => {
    const allPlayers = match.players?.all_players || [];
    const me = allPlayers.find(
      p => p.name?.toLowerCase() === playerName.toLowerCase()
        && p.tag?.toLowerCase() === playerTag.toLowerCase()
    );
    if (!me) return;

    const myTeam = (me.team || 'blue').toLowerCase();
    const teams = match.teams || {};
    const blueWon = teams.blue?.has_won;
    const redWon  = teams.red?.has_won;
    const isDraw  = !blueWon && !redWon;
    const won = teams[myTeam]?.has_won;

    if (won) wins++;
    const { kills = 0, deaths = 0, assists = 0, score = 0,
            headshots = 0, bodyshots = 0, legshots = 0 } = me.stats || {};
    totalKills += kills;
    totalDeaths += deaths;
    totalAssists += assists;
    totalScore += score;
    totalHead += headshots;
    totalBody += bodyshots;
    totalLeg += legshots;
    totalRounds += (teams.blue?.rounds_won || 0) + (teams.red?.rounds_won || 0);
    validCount++;

    // 角色使用分布（場次 + 勝場 + icon，順便用來找最常用 agent）
    const agentName = me.character || 'Unknown';
    const ag = agentStats[agentName] || (agentStats[agentName] = { games: 0, wins: 0, icon: me.assets?.agent?.small || '' });
    ag.games++;
    if (won) ag.wins++;

    // 地圖勝率
    const mapName = match.metadata?.map || 'Unknown';
    const mp = mapStats[mapName] || (mapStats[mapName] = { games: 0, wins: 0 });
    mp.games++;
    if (won) mp.wins++;

    // 勝敗走勢（最多 15 場，最新在陣列後面，渲染時最新在右）
    if (recentResults.length < 15) {
      recentResults.push({
        result: isDraw ? 'draw' : (won ? 'win' : 'loss'),
        agentIcon: me.assets?.agent?.small || ''
      });
      kdSeries.push(deaths > 0 ? kills / deaths : kills);
    }
  });

  if (validCount === 0) return;

  // 勝率（亂碼效果）
  const winrate = Math.round((wins / validCount) * 100);
  animateScramble($('statWinrate'), `${winrate}%`);

  // 平均 K/D（亂碼效果）
  const avgKD = totalDeaths > 0
    ? (totalKills / totalDeaths)
    : totalKills;
  animateScramble($('statAvgKDA'), avgKD.toFixed(2));

  // 爆頭率（亂碼效果）
  const totalShots = totalHead + totalBody + totalLeg;
  const hsPct = totalShots > 0 ? Math.round((totalHead / totalShots) * 100) : 0;
  animateScramble($('statHS'), `${hsPct}%`);

  // 平均 ACS = 戰鬥分總和 ÷ 回合總數（亂碼效果）
  const acs = totalRounds > 0 ? Math.round(totalScore / totalRounds) : 0;
  animateScramble($('statACS'), `${acs}`);

  // 最常用 agent（icon 已在統計迴圈存好，免去重複搜尋）
  const topAgent = Object.entries(agentStats).sort((a, b) => b[1].games - a[1].games)[0];
  if (topAgent) {
    $('statTopAgent').textContent = topAgent[0];
    if (topAgent[1].icon) {
      $('statTopAgentIcon').src = topAgent[1].icon;
      $('statTopAgentIcon').style.display = '';
    }
  }

  // 勝敗走勢格（交錯 growUp 動畫）
  const grid = $('winstreakGrid');
  grid.innerHTML = '';
  recentResults.forEach((r, i) => {
    const box = document.createElement('div');
    box.className = `streak-box ${r.result}`;
    box.style.animationDelay = `${i * 40}ms`;
    grid.appendChild(box);
  });

  $('matchStats').classList.remove('hidden');

  // K/D 走勢折線 + 角色使用分布 + 地圖勝率橫條圖
  renderKdaTrend(kdSeries);
  renderAgentDist(agentStats);
  renderMapWinrate(mapStats);
  $('matchCharts').classList.remove('hidden');
}

// 最近場次 K/D 走勢折線（純 SVG，零依賴）。series 為 matches 順序（新→舊）
function renderKdaTrend(series) {
  const el = $('kdaTrend');
  if (!el) return;
  const data = [...series].reverse(); // 反轉成 舊→新（左→右）
  if (data.length < 2) {
    el.innerHTML = '<div class="kda-trend-empty">場次不足，無法繪製走勢</div>';
    return;
  }
  const W = 600, H = 140, padX = 14, padY = 20;
  const n = data.length;
  const maxKD = Math.max(2, ...data);
  const x = i => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = v => H - padY - (Math.min(v, maxKD) / maxKD) * (H - 2 * padY);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const linePath = 'M' + pts.join(' L');
  const areaPath = `M${x(0).toFixed(1)},${(H - padY).toFixed(1)} L` + pts.join(' L') + ` L${x(n - 1).toFixed(1)},${(H - padY).toFixed(1)} Z`;
  const baseY = y(1).toFixed(1);
  const dots = data.map((v, i) =>
    `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5" fill="${v >= 1 ? 'var(--win)' : 'var(--accent)'}"><title>K/D ${v.toFixed(2)}</title></circle>`
  ).join('');
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="kda-svg">
      <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}" class="kda-base"/>
      <path d="${areaPath}" class="kda-area"/>
      <path d="${linePath}" class="kda-line"/>
      ${dots}
    </svg>
    <div class="kda-axis"><span>較舊</span><span>虛線 = K/D 1.0</span><span>最新</span></div>`;
}

// 角色使用分布橫條（依場次排序，最多 6 個；bar 長度 = 相對最高場次）
function renderAgentDist(agentStats) {
  const el = $('agentDist');
  el.innerHTML = '';
  const arr = Object.entries(agentStats).sort((a, b) => b[1].games - a[1].games).slice(0, 6);
  const max = arr[0]?.[1].games || 1;
  arr.forEach(([name, s], i) => {
    const wr = Math.round((s.wins / s.games) * 100);
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.style.animationDelay = `${i * 50}ms`;
    row.innerHTML = `
      <div class="bar-head">
        ${s.icon ? `<img class="bar-icon" src="${s.icon}" alt="">` : ''}
        <span class="bar-name">${name}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${(s.games / max) * 100}%"></div></div>
      <div class="bar-meta">${s.games} 場 · 勝率 ${wr}%</div>`;
    el.appendChild(row);
  });
}

// 地圖勝率橫條（依場次排序，最多 7 個；bar 長度 = 勝率，顏色 紅→綠 隨勝率）
function renderMapWinrate(mapStats) {
  const el = $('mapWinrate');
  el.innerHTML = '';
  const arr = Object.entries(mapStats).sort((a, b) => b[1].games - a[1].games).slice(0, 7);
  arr.forEach(([name, s], i) => {
    const wr = Math.round((s.wins / s.games) * 100);
    const hue = Math.round((wr / 100) * 130); // 0% 紅 → 100% 綠
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.style.animationDelay = `${i * 50}ms`;
    row.innerHTML = `
      <div class="bar-head"><span class="bar-name">${name}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${wr}%;background:hsl(${hue},65%,48%)"></div></div>
      <div class="bar-meta">${s.wins}勝 ${s.games - s.wins}敗 · ${wr}%</div>`;
    el.appendChild(row);
  });
}

function buildMatchCard(match, playerName, playerTag) {
  const allPlayers = match.players?.all_players || [];
  const me = allPlayers.find(
    p => p.name?.toLowerCase() === playerName.toLowerCase()
      && p.tag?.toLowerCase() === playerTag.toLowerCase()
  );
  if (!me) return null;

  const myTeam = (me.team || 'blue').toLowerCase();
  const teams = match.teams || {};
  const blueWon = teams.blue?.has_won;
  const redWon  = teams.red?.has_won;
  const isDraw = !blueWon && !redWon;
  const won = teams[myTeam]?.has_won;
  const resultClass = isDraw ? 'draw' : (won ? 'win' : 'loss');
  const resultText  = isDraw ? 'DRAW' : (won ? 'WIN' : 'LOSS');

  const { kills = 0, deaths = 0, assists = 0, score: cs = 0 } = me.stats || {};
  const blueScore = teams.blue?.rounds_won ?? '-';
  const redScore = teams.red?.rounds_won ?? '-';
  const mapName = match.metadata?.map || 'Unknown';
  const mode = match.metadata?.mode || '';
  const date = match.metadata?.game_start_patched || '';
  const agentIcon = me.assets?.agent?.small || '';
  // 優先使用 bust，fallback 到 full，最後才用 small
  const agentBust = me.assets?.agent?.bust || me.assets?.agent?.full || '';
  const agentName = me.character || '';
  const mapBg = state.maps[mapName] || '';

  // K/D 比值（純擊殺 ÷ 死亡，與官方 tracker 相同）
  const kdRatio = deaths > 0 ? kills / deaths : kills;
  const kdDisplay = kdRatio.toFixed(2);
  let kdaClass = 'kda-poor';
  if (kdRatio >= 2.0) kdaClass = 'kda-good';
  else if (kdRatio >= 1.0) kdaClass = 'kda-ok';

  const card = document.createElement('div');
  card.className = `match-card ${resultClass}`;
  card.innerHTML = `
    <div class="match-bubble" id="mb-${Math.random().toString(36).slice(2)}"></div>
    <div class="match-map-area">
      ${mapBg ? `<div class="map-bg-img" style="background-image:url('${mapBg}')"></div>` : ''}
      <span class="result-label ${resultClass}">${resultText}</span>
      <span class="round-score">${blueScore} - ${redScore}</span>
    </div>
    <div class="match-agent-area">
      ${agentBust ? `<div class="agent-bust-bg" style="background-image:url('${agentBust}')"></div>` : ''}
      ${agentIcon
        ? `<img src="${agentIcon}" alt="${agentName}" class="agent-icon">`
        : `<div class="agent-icon-placeholder"></div>`}
      <span class="agent-label">${agentName}</span>
    </div>
    <div class="match-kda-area">
      <div class="kda-nums ${kdaClass}">
        ${kills}<span class="kda-sep">/</span>${deaths}<span class="kda-sep">/</span>${assists}
      </div>
      <div class="kda-label">K / D / A</div>
      <div class="kda-ratio-label">K/D ${kdDisplay}</div>
      <div class="cs-label">Score ${cs.toLocaleString()}</div>
    </div>
    <div class="match-info-area">
      <div class="map-label">${mapName}</div>
      <div class="mode-label">${mode}</div>
      <div class="date-label">${date}</div>
    </div>
  `;

  const bubble    = card.querySelector('.match-bubble');
  const agentArea = card.querySelector('.match-agent-area');
  agentArea.addEventListener('mouseenter', () => {
    const lines = (window.AGENT_LINES || {})[agentName] || [];
    if (!lines.length) return;
    const entry = lines[Math.floor(Math.random() * lines.length)];
    bubble.textContent = entry.zh;
    bubble.classList.add('bubble-on');
    window._playAgentAudioFile?.(entry.file);
  });
  agentArea.addEventListener('mouseleave', () => bubble.classList.remove('bubble-on'));

  addMatchTilt(card);
  return card;
}

// ─── 歷史記錄 ───

// ─── 組合包庫 ───────────────────────────────────────────────────────────────

let bundleCatalogData = null;
const bundleMap = {};
const bundleSkinsCache = new Map();  // uuid → skins[]，避免重複打 API

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function optimalCols(n) {
  if (n <= 5) return n;
  if (n === 6) return 3;
  if (n <= 8) return 4;
  if (n === 9) return 3;
  return 5;
}

async function loadBundleCatalog() {
  const grid = $('bundlesGrid');
  if (bundleCatalogData) { renderBundleGrid(bundleCatalogData); return; }

  grid.innerHTML = '<div class="state-msg">從 Valorant API 載入中...</div>';
  const data = await apiFetch('/api/bundles/catalog');
  if (!Array.isArray(data)) {
    grid.innerHTML = '<div class="state-msg">載入失敗，請稍後再試。</div>';
    return;
  }
  bundleCatalogData = data;
  data.forEach(b => { bundleMap[b.uuid] = b; });
  $('bundlesCount').textContent = `共 ${data.length} 個組合包`;

  $('bundlesSearch').addEventListener('input', debounce(() => {
    const q = $('bundlesSearch').value.trim().toLowerCase();
    renderBundleGrid(q ? bundleCatalogData.filter(b => b.displayName.toLowerCase().includes(q)) : bundleCatalogData);
  }, 150));

  renderBundleGrid(data);
}

// ─── 組合包 Modal ────────────────────────────────────────────────────────────

async function openBundleModal(bundle) {
  $('bmHeroImg').src = bundle.displayIcon2 || bundle.displayIcon || bundle.verticalPromoImage || '';
  $('bmName').textContent = bundle.displayName;
  $('bmPrice').textContent = bundle.price ? `${bundle.price.toLocaleString()} VP` : '';
  $('bmSkinsGrid').innerHTML = '<div class="state-msg">載入皮膚中...</div>';
  $('bundleModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const data = bundleSkinsCache.has(bundle.uuid)
      ? bundleSkinsCache.get(bundle.uuid)
      : await apiFetch(`/api/bundles/${bundle.uuid}/skins`).then(d => { bundleSkinsCache.set(bundle.uuid, d); return d; });
    const skins   = data.skins   || [];
    const buddies = data.buddies || [];
    const sprays  = data.sprays  || [];

    if (!skins.length) {
      $('bmSkinsGrid').innerHTML = '<div class="state-msg">此組合包無皮膚資料</div>';
      $('bmAccessories').classList.add('hidden');
      return;
    }

    // 去掉包名前綴，只顯示武器部分
    const prefix = bundle.displayName + ' ';
    $('bmSkinsGrid').innerHTML = skins.map((s, i) => {
      const tier = uuidToTier(s.contentTierUuid) || 'unknown';
      const name = s.displayName.startsWith(prefix) ? s.displayName.slice(prefix.length) : s.displayName;
      const isMelee = !!s.isMelee;
      const chromas = s.chromas || [];
      const swatches = chromas.slice(0, 4).map((c, ci) => `
        <img class="bm-swatch${ci === 0 ? ' active' : ''}"
             src="${c.swatch}"
             data-icon="${c.icon || ''}"
             data-skin="${i}"
             onclick="bmSwatchClick(this, ${i})"
             title="${ci === 0 ? '預設色' : '煥彩 ' + ci}">`
      ).join('');
      const levels = s.levelCount > 1 ? `<span class="bm-levels">${s.levelCount} lv</span>` : '';
      return `
        <div class="bm-skin-card bm-skin-${tier}">
          <div class="bm-skin-img-wrap">
            <img class="bm-skin-img" id="bm-skin-img-${i}" src="${s.icon || ''}" loading="lazy" alt="${name}">
          </div>
          <div class="bm-skin-footer">
            <div class="bm-skin-name">${name}${isMelee ? '<span class="bm-melee-badge">近戰</span>' : ''}</div>
            <div class="bm-skin-meta">${swatches}${levels}</div>
          </div>
        </div>`;
    }).join('');

    $('bmSkinsGrid').style.gridTemplateColumns = `repeat(${optimalCols(skins.length)}, 1fr)`;
    skins.forEach(s => (s.chromas || []).forEach(c => { if (c.icon) { new Image().src = c.icon; } }));

    // 吊飾和噴漆區塊
    const acc = $('bmAccessories');
    if (!buddies.length && !sprays.length) {
      acc.classList.add('hidden');
    } else {
      const buddyHtml = buddies.length ? `
        <div class="bm-acc-section">
          <div class="bm-acc-title">吊飾</div>
          <div class="bm-acc-grid">${buddies.map(b => `
            <div class="bm-acc-card">
              <img class="bm-acc-img" src="${b.icon || ''}" alt="${b.displayName}" loading="lazy">
              <div class="bm-acc-name">${b.displayName}</div>
            </div>`).join('')}
          </div>
        </div>` : '';
      const sprayHtml = sprays.length ? `
        <div class="bm-acc-section">
          <div class="bm-acc-title">噴漆</div>
          <div class="bm-acc-grid">${sprays.map(s => `
            <div class="bm-acc-card">
              <img class="bm-acc-img" src="${s.icon || ''}" alt="${s.displayName}" loading="lazy">
              <div class="bm-acc-name">${s.displayName}</div>
            </div>`).join('')}
          </div>
        </div>` : '';
      acc.innerHTML = buddyHtml + sprayHtml;
      acc.classList.remove('hidden');
    }
  } catch {
    $('bmSkinsGrid').innerHTML = '<div class="state-msg">載入失敗，請稍後再試</div>';
    $('bmAccessories').classList.add('hidden');
  }
}

function bmSwatchClick(el, skinIdx) {
  el.closest('.bm-skin-meta').querySelectorAll('.bm-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const icon = el.dataset.icon;
  if (icon) $(`bm-skin-img-${skinIdx}`).src = icon;
}

function closeBundleModal(e) {
  if (e && e.target !== $('bundleModal')) return;
  $('bundleModal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBundleModal(); });

const TIER_COLOR = {
  'S+': '#ff79c6', 'S-': '#FFD700',
  'A+': '#FF7043', 'A-': '#FF9C00',
  'B+': '#4DB6AC', 'B-': '#80CBC4',
  'C':  '#90A4AE', 'D':  '#78909C', 'E': '#6D4C41',
};

function buildBundleCard(b) {
  const img = b.verticalPromoImage || b.displayIcon2 || b.displayIcon || '';
  const price = b.price ? `<span class="bc-price">${b.price.toLocaleString()} VP</span>` : '';
  return `
    <div class="bc-card" title="${b.displayName}" onclick="openBundleModal(bundleMap['${b.uuid}'])">
      <img class="bc-img" src="${img}" loading="lazy" alt="${b.displayName}" onerror="this.src='${b.displayIcon || ''}'">
      <div class="bc-overlay">
        <span class="bc-name">${b.displayName}</span>
        ${price}
      </div>
    </div>`;
}

function renderBundleGrid(bundles) {
  const grid = $('bundlesGrid');
  if (!bundles.length) { grid.innerHTML = '<div class="state-msg">找不到符合的組合包。</div>'; return; }

  const isSearching = $('bundlesSearch').value.trim().length > 0;
  const regular = bundles.filter(b => !b.isVCT);
  const vct = bundles.filter(b => b.isVCT);

  if (isSearching || !vct.length) {
    grid.className = 'bundles-grid';
    grid.innerHTML = [...regular, ...vct].map(buildBundleCard).join('');
    return;
  }

  grid.className = 'bundles-container';
  grid.innerHTML = `
    <div class="bundles-regular-grid">${regular.map(buildBundleCard).join('')}</div>
    <div class="vct-section">
      <button class="vct-toggle" onclick="this.classList.toggle('open'); this.nextElementSibling.classList.toggle('vct-open')">
        <span>VCT 戰隊組合包</span>
        <span class="vct-count">${vct.length}</span>
        <svg class="vct-chevron" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      <div class="vct-grid">${vct.map(buildBundleCard).join('')}</div>
    </div>`;
}

let historyCache = null;

async function loadHistory() {
  if (historyCache) { renderHistory(historyCache); return; }
  $('historyList').innerHTML = '<div class="state-msg">歷史記錄載入中...</div>';
  const data = await apiFetch('/api/store/history');
  historyCache = data;
  renderHistory(data);
}

function renderHistory(data) {
  if (!Array.isArray(data) || data.length === 0) {
    $('historyList').innerHTML = '<div class="state-msg">尚無歷史商店記錄。每次開啟每日商店後會自動儲存。</div>';
    return;
  }

  $('historyList').innerHTML = '';
  data.forEach(entry => {
    const dayEl = document.createElement('div');
    dayEl.className = 'history-day';

    const dateObj = new Date(entry.date + 'T00:00:00');
    const dateLabel = isNaN(dateObj.getTime())
      ? entry.date
      : dateObj.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    const skinsHtml = (entry.skins || []).map(skin => `
      <div class="history-skin-item">
        ${skin.icon
          ? `<img src="${skin.icon}" alt="${skin.name}" class="history-skin-thumb" loading="lazy">`
          : `<div class="history-skin-thumb-placeholder">?</div>`}
        <div class="history-skin-name">${skin.name || 'Unknown'}</div>
        <div class="history-skin-cost">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/displayicon.png"
               class="history-vp-icon" alt="VP" onerror="this.style.display='none'">
          <span>${(skin.cost || 0).toLocaleString()}</span>
        </div>
      </div>
    `).join('');

    dayEl.innerHTML = `
      <div class="history-day-header">${dateLabel}</div>
      <div class="history-day-grid">${skinsHtml}</div>
    `;

    $('historyList').appendChild(dayEl);
  });
}

// ─── 工具 ───

// 數字亂碼效果：先顯示隨機數字，逐漸從左到右定格成真實值
function animateScramble(el, finalText) {
  const digits = '0123456789';
  const duration = 900;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Array.from(finalText).map((ch, i) => {
      if (!/[0-9]/.test(ch)) return ch;
      if (progress > (i / finalText.length) * 0.85) return ch;
      return digits[Math.floor(Math.random() * 10)];
    }).join('');
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  };
  requestAnimationFrame(tick);
}

// ── 報紙戰報 ──────────────────────────────────────────────────────────────
function openNewspaper() {
  const name  = $('profileName')?.textContent?.trim() || '無名玩家';
  const tag   = $('profileTag')?.textContent?.trim()  || '';
  const tier  = $('profileTierName')?.textContent?.trim() || '無段位';
  const rrTxt = $('profileRR')?.textContent?.trim()   || '0 RR';
  const vp    = parseInt($('profileVP')?.textContent?.replace(/,/g, '') || '0');
  const rp    = parseInt($('profileRP')?.textContent?.replace(/,/g, '') || '0');

  const cards   = [...document.querySelectorAll('.match-card')];
  const results = cards.map(c => c.classList.contains('win') ? 'W' : c.classList.contains('loss') ? 'L' : 'D');
  const agents  = cards.map(c => c.querySelector('.agent-label')?.textContent?.trim() || '');

  const total    = results.length;
  const wins     = results.filter(r => r === 'W').length;
  const losses   = results.filter(r => r === 'L').length;
  const winrate  = total > 0 ? Math.round(wins / total * 100) : 0;
  const ownedCnt = state.ownedSkinCount || state.ownedSkins.size;

  let streak = 0, streakType = '';
  for (const r of results) {
    if (r === 'D') continue;
    if (!streakType) { streakType = r; streak = 1; }
    else if (r === streakType) streak++;
    else break;
  }

  const agentCount = {};
  agents.forEach(a => { if (a) agentCount[a] = (agentCount[a] || 0) + 1; });
  const topAgent = Object.entries(agentCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '未知特務';

  const now     = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const edition = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

  // 主標
  let headline, mainBody;
  if (streakType === 'L' && streak >= 3) {
    headline = `【${streak}連敗特刊】${name} 深陷敗戰泥淖，隊友資訊暫不公開`;
    mainBody  = `消息人士透露，當事人已連續 ${streak} 場以相同戰術衝入同一角落，結果均告失敗。分析師表示：「這在技術上已超越統計誤差的合理範圍。」隊友一行人拒絕受訪，部分人士已靜音通話。`;
  } else if (streakType === 'W' && streak >= 3) {
    headline = `連勝 ${streak} 場！${name} 席捲排位天梯`;
    mainBody  = `排名持續攀升，對手賽後集體沉默。部分玩家已將其列入「優先封鎖名單」，另有人士嘗試更換遊戲時段以規避相遇。當事人表示：「只是手感來了。」手感本人目前無法聯繫。`;
  } else if (winrate < 40 && total >= 5) {
    headline = `勝率跌破四成，${name} 堅稱「今天狀態不好」`;
    mainBody  = `追蹤顯示，上述聲明已在近 ${total} 場比賽後持續發表，觀察人士指出：「若以此為標準，人類可能不存在狀態好的一天。」心理師建議：先休息，再評估。`;
  } else if (winrate >= 60 && total >= 5) {
    headline = `本週勝率 ${winrate}%，${name} 引發天梯動盪`;
    mainBody  = `對手陣營陷入輕度恐慌，部分玩家申請轉移至冷門時段。官方對此尚未表態，但伺服器負載數據顯示有不明波動。`;
  } else {
    headline = `${name} 於排位賽中繼續存在，情況尚在評估中`;
    mainBody  = `本週共出現於 ${total} 場排位對局，具體影響正由各方評估中。隊友方面暫無官方聲明，對戰紀錄則如實保存。`;
  }

  // 三欄故事
  const vpStory = vp > 2000
    ? { h: `${vp.toLocaleString()} VP 囤積事件持續延燒`,   b: `消費者手持大量 VP 卻遲遲不出手，等待「那款皮膚」的態度被學界定性為一種信仰形式。Riot 方面對此報以沉默與穩定的新皮膚發布頻率。` }
    : { h: `VP 餘額 ${vp}，理智線據報僅存最後防線`,       b: `知情人士透露，當事人日前曾凝視商店良久後關閉分頁，自語「下次吧」。記者追問何時為下次，未獲回應。` };

  const rankStory = { h: `${tier} ${rrTxt}，前路茫茫`, b: `當事人對目前段位的看法是「暫時的」，此說法已維持數週。心理學家建議：接受現實，或更換遊戲，二擇一，不建議第三選項。` };

  const agentStory = { h: `${topAgent} 頻繁現蹤，專家研判與勝率無直接關聯`, b: `使用數據顯示，${name} 近期大量選用 ${topAgent}，然勝率並未因此顯著提升。特務方面無可奉告，據悉正在練習靶場待命。` };

  // 快訊
  const briefs = [
    `本地 ${tier} 玩家表示「只差一點就升段」，此話已說出 ${Math.max(losses, 3)} 次以上`,
    `排位失利後立即開啟下一局，醫學界對此現象持保留態度`,
    rp > 100
      ? `${rp} RP 持有者宣稱「不在意段位」，神情透露絲絲不安`
      : `RP 餘額告急，戰鬥通行證進度岌岌可危，本人否認有壓力`,
    ownedCnt > 0
      ? `持有 ${ownedCnt} 款皮膚的玩家坦承：「其實我都用預設準心」`
      : `零皮膚持有者稱「內容才是重點」，錢包對此深表認同`,
  ];

  const ads = [
    '【徵人啟事】尋高勝率排位搭子。條件：不要在 B 門正面硬拼。待遇面議，不含保險。',
    '【廉價 VP 特賣】無法購買任何皮膚，但可以買到一個繼續等待的理由。數量有限。',
    '【排位崩潰後心理諮商】首次免費。第二次你會需要的。第三次打折。',
  ];
  const ad = ads[now.getDate() % ads.length];

  $('newspaper').innerHTML = `
    <button class="np-close-btn" onclick="document.getElementById('newspaper-overlay').classList.add('np-hidden')">✕ 關閉</button>
    <div class="np-masthead">
      <div class="np-meta">第 ${edition} 版 &nbsp;·&nbsp; 特別報導</div>
      <div class="np-title">VAL TIMES 戰報</div>
      <div class="np-tagline">「今日無頭條，明日無排位」</div>
      <div class="np-date">${dateStr} &nbsp;·&nbsp; 天氣：視野不良，建議改打死鬥模式</div>
    </div>
    <hr class="np-hr np-hr--thick">
    <div class="np-headline">${headline}</div>
    <div class="np-main-body">${mainBody}</div>
    <hr class="np-hr np-hr--thin">
    <div class="np-columns">
      <div class="np-col"><div class="np-col-head">${vpStory.h}</div><div class="np-col-body">${vpStory.b}</div></div>
      <div class="np-col"><div class="np-col-head">${rankStory.h}</div><div class="np-col-body">${rankStory.b}</div></div>
      <div class="np-col"><div class="np-col-head">${agentStory.h}</div><div class="np-col-body">${agentStory.b}</div></div>
    </div>
    <hr class="np-hr np-hr--thin">
    <div class="np-briefs">
      <span class="np-briefs-label">簡訊快報</span>
      ${briefs.map(b => `<span class="np-brief">▪ ${b}</span>`).join('')}
    </div>
    <hr class="np-hr np-hr--thin">
    <div class="np-coach">
      <div class="np-coach-label">教練點評</div>
      <div class="np-coach-body" id="np-coach-body">教練分析中…</div>
    </div>
    <hr class="np-hr np-hr--thick">
    <div class="np-ad">${ad}</div>
  `;

  $('newspaper-overlay').classList.remove('np-hidden');

  // AI 教練建議（Gemini，非同步載入，後端每人每天一次快取）
  loadCoachAdvice({ name, tier, total, wins, losses, winrate, streak, streakType, topAgent, vp, ownedCnt });
}

async function loadCoachAdvice(summary) {
  const el = document.getElementById('np-coach-body');
  if (!el) return;
  try {
    const resp = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary),
      credentials: 'same-origin',
    });
    const data = await resp.json();
    if (data.error === 'NO_AI_KEY') { el.textContent = '（教練尚未上線：還沒設定 AI 金鑰）'; return; }
    if (data.error) { el.textContent = '（教練暫時休息中，稍後再開一次試試）'; return; }
    el.textContent = data.advice;
  } catch {
    el.textContent = '（教練暫時休息中，稍後再開一次試試）';
  }
}

// 系統若要求「減少動態效果」，停用滑鼠跟隨的 3D 傾斜互動
const REDUCE_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// 皮膚卡片：3D 傾斜 + cursor spotlight（隨滑鼠位置）
// 以 requestAnimationFrame 節流：mousemove 只記座標，每個重繪幀最多寫一次 style
function add3DTilt(card) {
  if (REDUCE_MOTION) return;
  const tier = card.dataset.tier || '';
  const holoStrength = { select: 0.12, deluxe: 0.18, premium: 0.26, ultra: 0.34, exclusive: 0.44 }[tier] || 0;

  let rafId = null, cx = 0, cy = 0;
  card.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const r = card.getBoundingClientRect();
      const x = cx - r.left;
      const y = cy - r.top;
      const nx = x / r.width  - 0.5;
      const ny = y / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${nx * 14}deg) rotateX(${-ny * 10}deg) translateY(-6px) scale(1.03)`;
      card.style.transition = 'transform 0.08s ease, border-color 0.2s, box-shadow 0.2s';
      card.style.setProperty('--spot-x', `${x}px`);
      card.style.setProperty('--spot-y', `${y}px`);
      card.style.setProperty('--spot-opacity', '1');
      if (holoStrength > 0) {
        card.style.setProperty('--holo-angle', `${(nx * 60 + 125).toFixed(1)}deg`);
        card.style.setProperty('--holo-opacity', holoStrength);
      }
    });
  });
  card.addEventListener('mouseleave', () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    card.style.transform = '';
    card.style.transition = 'border-color 0.2s, box-shadow 0.2s';
    card.style.setProperty('--spot-opacity', '0');
    card.style.setProperty('--holo-opacity', '0');
  });
}

// 對戰卡片：輕微傾斜 + cursor spotlight
function addMatchTilt(card) {
  if (REDUCE_MOTION) return;
  let rafId = null, cx = 0, cy = 0;
  card.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const r = card.getBoundingClientRect();
      const x = cx - r.left;
      const y = cy - r.top;
      const nx = x / r.width  - 0.5;
      const ny = y / r.height - 0.5;
      card.style.transform = `perspective(1200px) rotateY(${nx * 5}deg) rotateX(${-ny * 3}deg) translateY(-2px)`;
      card.style.transition = 'transform 0.1s ease, background 0.15s, box-shadow 0.2s';
      card.style.setProperty('--spot-x', `${x}px`);
      card.style.setProperty('--spot-y', `${y}px`);
      card.style.setProperty('--spot-opacity', '1');
    });
  });
  card.addEventListener('mouseleave', () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    card.style.transform = '';
    card.style.transition = 'background 0.15s, box-shadow 0.2s, transform 0.25s cubic-bezier(0.22,1,0.36,1)';
    card.style.setProperty('--spot-opacity', '0');
  });
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  return res.json();
}

init();
