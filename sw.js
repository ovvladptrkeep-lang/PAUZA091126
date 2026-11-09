const CACHE_NAME = "pauza-v13";
const ASSETS = [
  "./",
  "./index.html",
  "./icon.svg",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(k =>
      Promise.all(k.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const r = e.request;
  const isHTML = r.mode === "navigate" || (r.headers.get("accept") || "").includes("text/html");
  
  if (isHTML) {
    e.respondWith(
      fetch(r).then(resp => {
        const c = resp.clone();
        caches.open(CACHE_NAME).then(ca => ca.put(r, c));
        return resp;
      }).catch(() => caches.match(r).then(c => c || caches.match("./index.html")))
    );
    return;
  }
  
  e.respondWith(
    caches.match(r).then(c => {
      if (c) return c;
      return fetch(r).then(resp => {
        if (r.method === "GET" && resp.ok) {
          const cl = resp.clone();
          caches.open(CACHE_NAME).then(ca => ca.put(r, cl));
        }
        return resp;
      }).catch(() => c);
    })
  );
});
