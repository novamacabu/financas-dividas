/* Service Worker — Gestão de Dívidas Nova Macabu
   Estratégia network-first: sempre tenta a rede (versão nova do sistema);
   se offline, serve a última versão em cache. */
const CACHE = "dividas-nm-v72";
const ARQUIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.hostname.includes("supabase")) return; // dados nunca passam pelo cache
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && url.origin === location.origin) {
        const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
  );
});
