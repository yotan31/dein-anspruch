// Service Worker: die App öffnet sich auch ohne Internet.
// Wird von quelle/bauen.mjs nach site/sw.js kopiert; Versionsnummer und Dateiliste werden dabei eingesetzt.
//
// Regeln:
// - Seite (HTML): erst aus dem Netz (damit Neuerungen sofort ankommen), ohne Netz aus dem Speicher
// - Programm, Aussehen, Schriften, Bibliotheken: aus dem Speicher (Adressen enthalten die Version)
// - Daten der Nutzer (Datenbank, Belege-Fotos) werden NIE zwischengespeichert
const VERSION = "__VERSION__";
// je Adresse eigener Speicher, damit echte App und Testversion sich nicht gegenseitig löschen
const PREFIX = "dein-anspruch:" + new URL(self.registration.scope).pathname + ":";
const CACHE = PREFIX + VERSION;
const DATEIEN = __DATEIEN__;

self.addEventListener("install", (e) => {
  // einzeln laden: fehlt eine Datei, klappt der Rest trotzdem
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(DATEIEN.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Datenbank, Texterkennung usw.: nicht anfassen
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const kopie = res.clone(); caches.open(CACHE).then((c) => c.put("./", kopie)).catch(() => {}); return res })
        .catch(() => caches.match("./").then((r) => r || caches.match("index.html"))),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      // große, selten gebrauchte Teile (pdf.js) beim ersten Gebrauch merken
      if (res.ok && /\/vendor\//.test(url.pathname)) { const kopie = res.clone(); caches.open(CACHE).then((c) => c.put(req, kopie)).catch(() => {}) }
      return res;
    })),
  );
});
