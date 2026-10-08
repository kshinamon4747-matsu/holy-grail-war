// Bump this version when replacing an image at the same URL.
const CACHE_PREFIX = "heavens-feel-icons-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const localIcons = new URL("servants/", self.registration.scope);

function isIconURL(value) {
  const url = new URL(value);
  return (url.origin === localIcons.origin && url.pathname.startsWith(localIcons.pathname))
    || (url.origin === "https://static.atlasacademy.io" && /^\/JP\/Faces\//.test(url.pathname));
}

async function cachedIcon(request) {
  // Storage can be unavailable (private browsing/quota). Never break image display.
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(request);
    if (saved) return saved;
  } catch { /* Fall back to the network. */ }
  const response = await fetch(request);
  if (cache && (response.ok || response.type === "opaque")) {
    try { await cache.put(request, response.clone()); } catch { /* Quota/storage failure. */ }
  }
  return response;
}

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  try {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
  } catch { /* Storage is optional. */ }
  await self.clients.claim();
})()));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.destination !== "image" || !isIconURL(event.request.url)) return;
  event.respondWith(cachedIcon(event.request));
});

// Images shown before first activation also need to be saved for the next visit.
self.addEventListener("message", event => {
  if (event.data?.type !== "CACHE_VISIBLE_ICONS" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(Promise.allSettled([...new Set(event.data.urls)]
    .filter(url => typeof url === "string" && isIconURL(url))
    .map(url => cachedIcon(new Request(url, { mode: "no-cors", credentials: "same-origin" })))));
});
