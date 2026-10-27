const APP_CACHE_PREFIX = "heavens-feel-shell-";
const LEGACY_APP_CACHE_PREFIX = "heavens-feel-app-";
const LEGACY_CACHE_PREFIX = "heavens-feel-icons-";
const APP_CACHE_NAME = "heavens-feel-shell-f1f61cc16d9c";
const PORTRAIT_CACHE_NAME = "heavens-feel-portraits-v1";
const SETTINGS_CACHE_NAME = "heavens-feel-settings-v1";
const SETTINGS_URL = new URL("__offline-settings__", self.registration.scope).href;
const scopeURL = new URL("./", self.registration.scope);
const localPortraits = new URL("servants/", scopeURL);
const BUILD_ASSETS = ["/assets/index-C9u1QH2c.js","/assets/index-Bm2z_w-v.css","/assets/CatalystModal-BAYG57mh.js","/assets/DesignatedSummonModal-CqupJHJl.js","/assets/GachaAnimation-DY70dv7D.js","/assets/GameApp-Cq8y7gRa.js","/assets/TRPGGame-bD9dzFxx.js","/assets/WarDashboard-DGpn7jdO.js","/assets/classAffinity-Ba24LHgk.js","/assets/classLabels-3Hh8BDeT.js","/assets/servants-BeY4xekS.js","/assets/sessionRecords-B_qFBfB9.js"];
const APP_SHELL_URLS = [
  "./",
  "manifest.webmanifest",
  "favicon-32.png",
  "apple-touch-icon.png",
  "app-icon-192.png",
  "app-icon-512.png",
  "7999.png",
  "Command_Seal.webp",
  "icons.svg",
].map(path => new URL(path, scopeURL).href);
const cancelledDownloads = new Set();

function isPortraitURL(value) {
  const url = new URL(value);
  return (url.origin === localPortraits.origin && url.pathname.startsWith(localPortraits.pathname))
    || (url.origin === "https://static.atlasacademy.io" && /^\/JP\/Faces\//.test(url.pathname));
}

function isAppURL(value) {
  const url = new URL(value);
  return url.origin === scopeURL.origin && url.pathname.startsWith(scopeURL.pathname);
}

function canStore(response) {
  return response.ok || response.type === "opaque";
}

async function openCache(name) {
  try { return await caches.open(name); }
  catch { return null; }
}

async function oldAppCacheNames() {
  try {
    return (await caches.keys()).filter(name =>
      (name.startsWith(APP_CACHE_PREFIX) && name !== APP_CACHE_NAME)
      || name.startsWith(LEGACY_APP_CACHE_PREFIX));
  } catch { return []; }
}

async function matchAppCaches(request) {
  const current = await openCache(APP_CACHE_NAME);
  try {
    const saved = await current?.match(request);
    if (saved) return saved;
  } catch { /* Check older app caches. */ }
  for (const name of await oldAppCacheNames()) {
    try {
      const saved = await (await caches.open(name)).match(request);
      if (saved) return saved;
    } catch { /* Continue safely. */ }
  }
  return undefined;
}

async function cacheFirst(request) {
  const saved = await matchAppCaches(request);
  if (saved) return saved;
  const response = await fetch(request);
  const cache = await openCache(APP_CACHE_NAME);
  if (cache && canStore(response)) {
    try { await cache.put(request, response.clone()); } catch { /* Storage is optional. */ }
  }
  return response;
}

async function documentCacheFirst(request) {
  const saved = await matchAppCaches(request) ?? await matchAppCaches(scopeURL.href);
  if (saved) return saved;
  return cacheFirst(request);
}

async function readDataSaverSetting() {
  const cache = await openCache(SETTINGS_CACHE_NAME);
  if (!cache) return true;
  try {
    const response = await cache.match(SETTINGS_URL);
    if (!response) return true;
    return (await response.json()).enabled !== false;
  } catch { return true; }
}

async function writeDataSaverSetting(enabled) {
  const cache = await openCache(SETTINGS_CACHE_NAME);
  if (!cache) return;
  await cache.put(SETTINGS_URL, new Response(JSON.stringify({ enabled: Boolean(enabled) }), {
    headers: { "content-type": "application/json" },
  }));
}

function portraitPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#15172c"/><circle cx="64" cy="46" r="22" fill="#555a70"/><path d="M25 112c4-27 18-41 39-41s35 14 39 41" fill="#555a70"/><text x="64" y="123" fill="#9ca3af" text-anchor="middle" font-size="9">OFFLINE</text></svg>`;
  return new Response(svg, {
    status: 200,
    headers: { "content-type": "image/svg+xml", "cache-control": "no-store" },
  });
}

async function portraitCacheFirst(request) {
  const cache = await openCache(PORTRAIT_CACHE_NAME);
  if (cache) {
    try {
      const saved = await cache.match(request);
      if (saved) return saved;
    } catch { /* Continue safely. */ }
  }
  if (await readDataSaverSetting()) return portraitPlaceholder();
  const response = await fetch(request);
  if (cache && canStore(response)) {
    try { await cache.put(request, response.clone()); } catch { /* Storage is optional. */ }
  }
  return response;
}

async function saveURL(value, forceNetwork = false) {
  if (typeof value !== "string" || (!isAppURL(value) && !isPortraitURL(value))) return false;
  const request = new Request(value, {
    mode: isAppURL(value) ? "same-origin" : "no-cors",
    credentials: "same-origin",
    cache: forceNetwork ? "reload" : "default",
  });
  const cache = await openCache(isPortraitURL(value) ? PORTRAIT_CACHE_NAME : APP_CACHE_NAME);
  if (!cache) return false;
  if (!forceNetwork) {
    try { if (await cache.match(request)) return true; } catch { /* Fetch below. */ }
  }
  try {
    const response = await fetch(request);
    if (!canStore(response)) return false;
    await cache.put(request, response.clone());
    return true;
  } catch { return false; }
}

async function cachePortraits(urls, requestId, port) {
  const unique = [...new Set(urls.filter(value => typeof value === "string" && isPortraitURL(value)))].slice(0, 1000);
  let saved = 0;
  let failed = 0;
  for (let index = 0; index < unique.length; index++) {
    if (cancelledDownloads.has(requestId)) {
      port?.postMessage({ type: "cancelled", saved, failed, total: unique.length });
      cancelledDownloads.delete(requestId);
      return;
    }
    if (await saveURL(unique[index])) saved++;
    else failed++;
    port?.postMessage({ type: "progress", completed: index + 1, saved, failed, total: unique.length });
  }
  port?.postMessage({ type: "done", saved, failed, total: unique.length });
}

async function getPortraitStatus(urls) {
  const cache = await openCache(PORTRAIT_CACHE_NAME);
  const unique = [...new Set(urls.filter(value => typeof value === "string" && isPortraitURL(value)))].slice(0, 1000);
  if (!cache) return { cached: 0, total: unique.length };
  let cached = 0;
  for (const url of unique) {
    try { if (await cache.match(url)) cached++; } catch { /* Keep counting. */ }
  }
  return { cached, total: unique.length };
}

async function migrateLegacyData() {
  let complete = true;
  try {
    const names = (await caches.keys()).filter(name => name.startsWith(LEGACY_APP_CACHE_PREFIX));
    const portraitCache = await openCache(PORTRAIT_CACHE_NAME);
    const settingsCache = await openCache(SETTINGS_CACHE_NAME);
    if (!portraitCache || !settingsCache) return false;
    for (const name of names) {
      const legacy = await caches.open(name);
      for (const request of await legacy.keys()) {
        if (!isPortraitURL(request.url) && request.url !== SETTINGS_URL) continue;
        const response = await legacy.match(request);
        if (!response) continue;
        try {
          if (isPortraitURL(request.url)) await portraitCache.put(request, response.clone());
          else await settingsCache.put(SETTINGS_URL, response.clone());
        } catch { complete = false; }
      }
    }
  } catch { return false; }
  return complete;
}

async function isCurrentAppPrepared() {
  const cache = await openCache(APP_CACHE_NAME);
  if (!cache) return false;
  for (const url of [...APP_SHELL_URLS, ...BUILD_ASSETS]) {
    try { if (!await cache.match(url)) return false; }
    catch { return false; }
  }
  return true;
}

async function cleanupOldAppCaches() {
  try {
    const names = await oldAppCacheNames();
    await Promise.all(names.map(name => caches.delete(name)));
  } catch { /* Old files can be cleaned on a later update. */ }
}

async function prepareUpdate(port) {
  const required = [...new Set([...APP_SHELL_URLS, ...BUILD_ASSETS])];
  let failed = 0;
  for (const url of required) {
    if (!await saveURL(url, true)) failed++;
  }
  if (failed > 0) {
    port?.postMessage({ type: "error", failed });
    return;
  }
  await migrateLegacyData();
  await cleanupOldAppCaches();
  port?.postMessage({ type: "ready" });
  await self.skipWaiting();
}

self.addEventListener("install", event => {
  // On the first installation there is no old version to protect. Updates remain waiting
  // until the user explicitly downloads and activates them.
  if (!self.registration.active) {
    event.waitUntil((async () => {
      await Promise.allSettled([...APP_SHELL_URLS, ...BUILD_ASSETS].map(url => saveURL(url)));
      await self.skipWaiting();
    })());
  }
});

self.addEventListener("activate", event => event.waitUntil((async () => {
  const migrated = await migrateLegacyData();
  try {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(LEGACY_CACHE_PREFIX))
      .map(name => caches.delete(name)));
  } catch { /* Storage is optional. */ }
  if (migrated && await isCurrentAppPrepared()) await cleanupOldAppCaches();
  await self.clients.claim();
})()));

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.destination === "document" && isAppURL(request.url)) {
    event.respondWith(documentCacheFirst(request));
    return;
  }

  if (isPortraitURL(request.url)) {
    event.respondWith(portraitCacheFirst(request));
    return;
  }

  if (isAppURL(request.url) && ["script", "style", "worker", "font", "manifest", "image"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("message", event => {
  const data = event.data;
  const port = event.ports?.[0];
  if (!data || typeof data.type !== "string") return;

  if (data.type === "PING") {
    port?.postMessage({ type: "ready" });
  } else if (data.type === "SET_DATA_SAVER") {
    event.waitUntil(writeDataSaverSetting(data.enabled).then(() => port?.postMessage({ type: "saved" })));
  } else if (data.type === "GET_PORTRAIT_CACHE_STATUS" && Array.isArray(data.urls)) {
    event.waitUntil(getPortraitStatus(data.urls).then(status => port?.postMessage(status)));
  } else if (data.type === "GET_APP_UPDATE_STATUS") {
    event.waitUntil(isCurrentAppPrepared().then(prepared => port?.postMessage({ prepared })));
  } else if (data.type === "CACHE_PORTRAITS" && Array.isArray(data.urls)) {
    event.waitUntil(cachePortraits(data.urls, data.requestId, port));
  } else if (data.type === "CANCEL_CACHE_PORTRAITS") {
    cancelledDownloads.add(data.requestId);
  } else if (data.type === "WARM_APP_CACHE" && Array.isArray(data.urls)) {
    event.waitUntil(Promise.allSettled([...new Set(data.urls)].map(url => saveURL(url))));
  } else if (data.type === "APPLY_UPDATE") {
    event.waitUntil(prepareUpdate(port));
  }
});
