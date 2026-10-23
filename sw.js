// Service worker do Campeão ML: abre rápido (guarda os arquivos do site), avisos (push) e abrir o app ao tocar no aviso.
const CACHE = "cml-site-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // dados (Supabase, Mercado Livre) sempre da internet
  // Arquivos com versão no nome (assets/...): guarda e usa o guardado (abrem na hora).
  if (url.pathname.includes("/assets/") || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const tem = await c.match(req);
      if (tem) return tem;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    }));
    return;
  }
  // Página: busca a mais nova; se a internet demorar mais de 2,5 s, abre a última guardada.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const rede = fetch(req).then((r) => { if (r.ok) c.put("pagina", r.clone()); return r; });
      const guardada = await c.match("pagina");
      if (!guardada) return rede;
      return Promise.race([rede.catch(() => guardada), new Promise((ok) => setTimeout(() => ok(guardada), 2500))]);
    })());
  }
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titulo: "Campeão ML", texto: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Campeão ML", {
    body: d.texto || "", icon: "icone-192.png", badge: "icone-192.png", data: { url: d.url || "./" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
    for (const c of lista) { if ("focus" in c) { c.navigate(alvo); return c.focus(); } }
    return self.clients.openWindow(alvo);
  }));
});
