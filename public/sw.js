// VAL TRACKER Service Worker
// 策略：network-first（永遠優先連線拿最新，避免快取卡住舊版 UI），離線才回退快取殼。
// /api 一律走網路、不快取（不把帳號資料留在 Cache Storage）。
const CACHE = 'val-tracker-v1';
const SHELL = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;        // 跨域（valorant-api 圖等）交給瀏覽器
  if (url.pathname.startsWith('/api')) return;        // API 永遠走網路、不快取
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
  );
});
