const CACHE = "bbs-cache-v8"; // 🔥 change ce numéro à chaque grosse mise à jour
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./icon-192.png",
  "./icon-512.png",
  "./bbs-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ✅ Toujours prendre la dernière version de index.html (important)
  const url = new URL(req.url);
  const isIndex = url.origin === location.origin && (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"));

  if (isIndex) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 🔁 Cache-first pour le reste
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      try{
        if(req.method === "GET" && url.origin === location.origin){
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
      }catch{}
      return res;
    }))
  );
});
