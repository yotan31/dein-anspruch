// Kleiner statischer Webserver für site/: wird von den Oberflächen-Tests und der Lighthouse-Messung genutzt,
// damit beide die gebaute App genau so ausliefern wie GitHub Pages (gleiche Pfade, passende Inhaltstypen).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

export const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "site");

const INHALTSTYPEN = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".wasm": "application/wasm", ".pfb": "application/octet-stream",
  ".ttf": "font/ttf", ".txt": "text/plain",
};

/**
 * Startet den Server auf einem freien Port.
 * @returns {Promise<{ url: string, close: () => void }>} Adresse der App und Funktion zum Beenden
 */
export async function starteServer() {
  const server = http.createServer((req, res) => {
    const pfad = decodeURIComponent(new URL(req.url || "/", "http://x").pathname);
    const datei = path.join(SITE, pfad.endsWith("/") ? pfad + "index.html" : pfad);
    // Nur Dateien innerhalb von site/ ausliefern, nie Pfade wie /../package.json
    if (!datei.startsWith(SITE) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      res.writeHead(404);
      res.end("404");
      return;
    }
    const typ = INHALTSTYPEN[path.extname(datei)] || "application/octet-stream";
    // Wie GitHub Pages: Text-Dateien komprimiert ausliefern, damit Messungen der echten Seite entsprechen
    const komprimieren = /text|javascript|json|svg|manifest/.test(typ) && /gzip/.test(String(req.headers["accept-encoding"] || ""));
    res.writeHead(200, { "Content-Type": typ, ...(komprimieren ? { "Content-Encoding": "gzip" } : {}) });
    const daten = fs.createReadStream(datei);
    (komprimieren ? daten.pipe(zlib.createGzip()) : daten).pipe(res);
  });
  await new Promise((fertig) => server.listen(0, "127.0.0.1", () => fertig(undefined)));
  const adresse = /** @type {import("node:net").AddressInfo} */ (server.address());
  return { url: `http://127.0.0.1:${adresse.port}/`, close: () => server.close() };
}
