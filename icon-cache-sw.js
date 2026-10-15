const APP_CACHE_PREFIX = "heavens-feel-app-";
const LEGACY_CACHE_PREFIX = "heavens-feel-icons-";
const CACHE_NAME = `${APP_CACHE_PREFIX}v1`;
const scopeURL = new URL("./", self.registration.scope);
const localPortraits = new URL("servants/", scopeURL);
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

async function openCache() {
  try { return await caches.open(CACHE_NAME); }
  catch { return null; }
}

async function cacheFirst(request) {
  const cache = await openCache();
  if (cache) {
    try {
      const saved = await cache.match(request);
      if (saved) return saved;
    } catch { /* Fall back to the network. */ }
  }
  const response = await fetch(request);
  if (cache && canStore(response)) {
    try { await cache.put(request, response.clone()); } catch { /* Storage is optional. */ }
  }
  return response;
}

async function networkFirst(request) {
  const cache = await openCache();
  try {
    const response = await fetch(request);
    if (cache && canStore(response)) {
      try { await cache.put(request, response.clone()); } catch { /* Storage is optional. */ }
    }
    return response;
  } catch (error) {
    if (cache) {
      const saved = await cache.match(request) ?? await cache.match(scopeURL.href);
      if (saved) return saved;
    }
    throw error;
  }
}

async function saveURL(value) {
  if (typeof value !== "string" || (!isAppURL(value) && !isPortraitURL(value))) return;
  const request = new Request(value, {
    mode: isAppURL(value) ? "same-origin" : "no-cors",
    credentials: "same-origin",
  });
  await cacheFirst(request);
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await Promise.allSettled(APP_SHELL_URLS.map(saveURL));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => event.waitUntil((async () => {
  try {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => (name.startsWith(APP_CACHE_PREFIX) && name !== CACHE_NAME) || name.startsWith(LEGACY_CACHE_PREFIX))
      .map(name => caches.delete(name)));
  } catch { /* Storage is optional. */ }
  await self.clients.claim();
})()));

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.destination === "document" && isAppURL(request.url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isPortraitURL(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isAppURL(request.url) && ["script", "style", "worker", "font", "manifest", "image"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});

// Cache resources that loaded before the worker took control of the first visit.
self.addEventListener("message", event => {
  if (event.data?.type !== "WARM_APP_CACHE" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(Promise.allSettled([...new Set(event.data.urls)].map(saveURL)));
});
