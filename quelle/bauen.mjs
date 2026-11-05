// Baut die App mit esbuild.
//
//   quelle/js/main.js   Einstieg; lädt alle Programmteile (ES-Module) in fester Reihenfolge
//   quelle/stil.css     Aussehen
//   quelle/index.html   Seitengerüst
//
// Ergebnis in site/: app.js (+ app.js.map), index.html (mit eingebettetem, verkleinertem CSS), sw.js, vendor/supabase.js
// Aufruf: npm run bauen   (oder: node quelle/bauen.mjs)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const Q = path.join(ROOT, "quelle"),
  SITE = path.join(ROOT, "site");
const require = createRequire(import.meta.url);

// esbuild aus dem Projekt (npm install), sonst aus ESBUILD_PFAD
const esbuild = await import(process.env.ESBUILD_PFAD || "esbuild");
const ZIEL = ["es2020"];
// Adressen der selbst gehosteten Bibliotheken – nur hier pflegen, die App bekommt sie beim Bauen eingesetzt.
// Die Versionsnummer im Link sorgt dafür, dass Browser nach einem Update nicht die alte Datei behalten.
// Version aus package.json (dort fest eingetragen), damit das Bauen auch ohne installierte Bibliothek funktioniert
const SUPABASE_VERSION = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")).dependencies[
  "@supabase/supabase-js"
];
const SUPABASE_URL = `vendor/supabase.js?v=${SUPABASE_VERSION}`;
const JSPDF_URL = "vendor/jspdf.umd.min.js?v=4.2.1";

// Setzt die jsPDF-Adresse schon beim Einlesen in den Quelltext ein (nicht erst ins fertige app.js),
// damit die Source Map stimmt und Fehlermeldungen auf die richtige Stelle zeigen.
const setzeJsPdfAdresse = {
  name: "jspdf-adresse",
  setup(b) {
    b.onLoad({ filter: /services[\\/]pdf\.js$/ }, (args) => ({
      contents: readFileSync(args.path, "utf8").replace("__JSPDF_URL__", JSPDF_URL),
      loader: "js",
    }));
  },
};

// 1. Programm
const app = await esbuild.build({
  plugins: [setzeJsPdfAdresse],
  entryPoints: [path.join(Q, "js", "main.js")],
  bundle: true,
  format: "iife",
  target: ZIEL,
  minify: true,
  sourcemap: "external",
  sourcesContent: true,
  outfile: path.join(SITE, "app.js"),
  legalComments: "none",
  write: false,
  logLevel: "warning",
});
// CSS verkleinern und direkt in index.html einbetten (spart eine Anfrage, die das erste Zeichnen blockiert)
const css = (
  await esbuild.transform(readFileSync(path.join(Q, "stil.css"), "utf8"), { loader: "css", minify: true, target: ZIEL })
).code.trim();
const html = readFileSync(path.join(Q, "index.html"), "utf8");
let js = app.outputFiles.find((f) => f.path.endsWith(".js")).text;
const map = app.outputFiles.find((f) => f.path.endsWith(".map")).text;
// Versionsnummer aus dem Inhalt: ändert sich bei jeder Änderung, damit Browser keine alte Fassung behalten
const version = createHash("sha1")
  .update(js + css + html)
  .digest("hex")
  .slice(0, "__APPVERSION__".length);
// Gleich lang wie der Platzhalter: So verschiebt das Ersetzen nichts, und die Source Map bleibt gültig
js = js.replace("__APPVERSION__", version) + "\n//# sourceMappingURL=app.js.map\n";
writeFileSync(path.join(SITE, "app.js"), js);
writeFileSync(path.join(SITE, "app.js.map"), map);
writeFileSync(
  path.join(SITE, "index.html"),
  html
    .replaceAll("{{VERSION}}", version)
    .replace("{{SUPABASE_URL}}", SUPABASE_URL)
    .replace("{{CSS}}", () => css),
);

// 1b. Service Worker (App ohne Internet öffnen): Grundgerüst vorab speichern
// jsPDF gehört dazu, damit „Als PDF speichern“ auch ohne Internet geht; geladen wird es im Hintergrund, nicht beim Start.
const vorab = [
  "./",
  "index.html",
  `app.js?v=${version}`,
  SUPABASE_URL,
  JSPDF_URL,
  "manifest.webmanifest",
  "logo.webp",
  "favicon.png",
  "icon-192.png",
  "icon-512.png",
  "datenschutz.html",
  "impressum.html",
  "nutzungsbedingungen.html",
];
const sw = readFileSync(path.join(Q, "sw.js"), "utf8")
  .replace("__VERSION__", version)
  .replace("__DATEIEN__", JSON.stringify(vorab, null, 1));
await esbuild.transform(sw, { loader: "js" }); // bricht ab, falls der Service Worker fehlerhaft ist
writeFileSync(path.join(SITE, "sw.js"), sw);

// 2. Supabase-Bibliothek selbst hosten (statt von einem fremden Server zu laden)
const sbZiel = path.join(SITE, "vendor", "supabase.js");
let sbPfad = null;
try {
  sbPfad = require.resolve("@supabase/supabase-js", { paths: [ROOT] });
} catch {
  /* nicht installiert */
}
if (sbPfad) {
  const sbVersion = SUPABASE_VERSION;
  await esbuild.build({
    stdin: {
      contents: `import * as supabase from "@supabase/supabase-js"; globalThis.supabase = supabase;`,
      resolveDir: ROOT,
      loader: "js",
    },
    bundle: true,
    format: "iife",
    target: ZIEL,
    minify: true,
    platform: "browser",
    outfile: sbZiel,
    legalComments: "eof",
    logLevel: "warning",
    banner: { js: `/* @supabase/supabase-js ${sbVersion} (MIT) – selbst gehostet */` },
  });
  console.log(`Supabase-Bibliothek ${sbVersion} gebaut`);
} else if (!existsSync(sbZiel)) {
  console.warn(
    "Hinweis: @supabase/supabase-js ist nicht installiert (npm install). vendor/supabase.js fehlt – Anmeldung funktioniert dann nicht.",
  );
}
console.log(`gebaut: Version ${version}, app.js ${Math.round(js.length / 1024)} KB`);
