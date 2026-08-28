/* Service Worker — Gestão de Dívidas Nova Macabu (v6.4.1)
   Estratégia NETWORK-FIRST para o HTML: o sistema sempre busca a versão
   mais nova no ar; o cache só responde se estiver sem internet.
   Assim as atualizações publicadas no GitHub chegam imediatamente. */
const CACHE = "nm-dividas-v641";
const ESTATICOS = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // HTML/navegação: rede primeiro, cache só como fallback offline
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Estáticos do próprio site: cache primeiro (rápido), rede atualiza
  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(r => {
        if (r.ok && new URL(req.url).origin === location.origin) {
          const cp = r.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return r;
      }).catch(() => hit)
    )
  );
});
