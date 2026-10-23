// Baut die App mit esbuild.
//
//   quelle/js/main.js   Einstieg; lädt alle Programmteile (ES-Module) in fester Reihenfolge
//   quelle/stil.css     Aussehen
//   quelle/index.html   Seitengerüst
//
// Ergebnis in site/: app.js (+ app.js.map), app.css, index.html, vendor/supabase.js
// Aufruf: npm run bauen   (oder: node quelle/bauen.mjs)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const Q = path.join(ROOT, "quelle"), SITE = path.join(ROOT, "site");
const require = createRequire(import.meta.url);

// esbuild aus dem Projekt (npm install), sonst aus ESBUILD_PFAD
const esbuild = await import(process.env.ESBUILD_PFAD || "esbuild");
const ZIEL = ["es2020"];

// 1. Programm
const app = await esbuild.build({
  entryPoints: [path.join(Q, "js", "main.js")],
  bundle: true, format: "iife", target: ZIEL, minify: true,
  sourcemap: "external", sourcesContent: true, outfile: path.join(SITE, "app.js"),
  legalComments: "none", write: false, logLevel: "warning",
});
const css = readFileSync(path.join(Q, "stil.css"), "utf8");
const html = readFileSync(path.join(Q, "index.html"), "utf8");
let js = app.outputFiles.find(f => f.path.endsWith(".js")).text;
const map = app.outputFiles.find(f => f.path.endsWith(".map")).text;
// Versionsnummer aus dem Inhalt: ändert sich bei jeder Änderung, damit Browser keine alte Fassung behalten
const version = createHash("sha1").update(js + css + html).digest("hex").slice(0, 8);
js = js.replace("__APPVERSION__", version) + "\n//# sourceMappingURL=app.js.map\n";
writeFileSync(path.join(SITE, "app.js"), js);
writeFileSync(path.join(SITE, "app.js.map"), map);
writeFileSync(path.join(SITE, "app.css"), css);
writeFileSync(path.join(SITE, "index.html"), html.replaceAll("{{VERSION}}", version));

// 1b. Service Worker (App ohne Internet öffnen): Grundgerüst vorab speichern
const vorab = ["./", "index.html", `app.js?v=${version}`, `app.css?v=${version}`, "vendor/supabase.js?v=2.45.4", "vendor/jspdf.umd.min.js?v=4.2.1",
  "vendor/schrift/AtkinsonHyperlegible-Regular.woff2", "vendor/schrift/AtkinsonHyperlegible-Bold.woff2", "vendor/schrift/AtkinsonHyperlegible-Italic.woff2", "vendor/schrift/SourceSerif4.woff",
  "manifest.webmanifest", "logo.png", "favicon.png", "icon-192.png", "icon-512.png", "datenschutz.html", "impressum.html", "nutzungsbedingungen.html"];
const sw = readFileSync(path.join(Q, "sw.js"), "utf8").replace("__VERSION__", version).replace("__DATEIEN__", JSON.stringify(vorab, null, 1));
await esbuild.transform(sw, { loader: "js" }); // bricht ab, falls der Service Worker fehlerhaft ist
writeFileSync(path.join(SITE, "sw.js"), sw);

// 2. Supabase-Bibliothek selbst hosten (statt von einem fremden Server zu laden)
const sbZiel = path.join(SITE, "vendor", "supabase.js");
let sbPfad = null;
try { sbPfad = require.resolve("@supabase/supabase-js", { paths: [ROOT] }) } catch { /* nicht installiert */ }
if (sbPfad) {
  const sbVersion = JSON.parse(readFileSync(require.resolve("@supabase/supabase-js/package.json", { paths: [ROOT] }), "utf8")).version;
  await esbuild.build({
    stdin: { contents: `import * as supabase from "@supabase/supabase-js"; globalThis.supabase = supabase;`, resolveDir: ROOT, loader: "js" },
    bundle: true, format: "iife", target: ZIEL, minify: true, platform: "browser",
    outfile: sbZiel, legalComments: "eof", logLevel: "warning",
    banner: { js: `/* @supabase/supabase-js ${sbVersion} (MIT) – selbst gehostet */` },
  });
  console.log(`Supabase-Bibliothek ${sbVersion} gebaut`);
} else if (!existsSync(sbZiel)) {
  console.warn("Hinweis: @supabase/supabase-js ist nicht installiert (npm install). vendor/supabase.js fehlt – Anmeldung funktioniert dann nicht.");
}
console.log(`gebaut: Version ${version}, app.js ${Math.round(js.length / 1024)} KB`);
