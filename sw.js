// Service worker do Campeão ML: avisos (push) e abrir o app ao tocar no aviso.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* sem cache: sempre a versão mais nova do site */ });
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
