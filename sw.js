// Alld Stats: works offline. Shell and data — network first, then cache; screenshots — cache first.
const C = "alld-stats-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const key = u.origin + u.pathname;  // without ?t= — one copy per file
  if (u.pathname.includes("/s/")) {
    e.respondWith(caches.open(C).then(async c => {
      const hit = await c.match(key);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(key, r.clone());
      return r;
    }));
    return;
  }
  e.respondWith(fetch(e.request.url, { cache: "no-cache" }).then(r => {  // always ask the server (ETag), cache only when offline
    if (r.ok) caches.open(C).then(c => c.put(key, r.clone()));
    return r;
  }).catch(() => caches.match(key).then(h => h || caches.match(u.origin + u.pathname.replace(/[^/]*$/, "index.html")))));
});
