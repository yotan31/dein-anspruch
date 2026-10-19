// Baut die Programmteile aus quelle/js/ (ES-Module) mit esbuild und lädt sie ohne Browser in eine abgeschottete Umgebung,
// damit einzelne Berechnungen direkt geprüft werden können.
// ladeApp({ heute: "2026-03-15" }) liefert eine Funktion run("ausdruck"), die im Programm ausgewertet wird.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "quelle", "js");

const esbuild = await import(process.env.ESBUILD_PFAD || "esbuild");
let gebaut = null;
// einmal bauen, für alle Tests wiederverwenden (ohne den Startteil, der die Oberfläche aufbaut)
function code() {
  if (gebaut) return gebaut;
  const r = esbuild.buildSync({
    stdin: { contents: fs.readdirSync(DIR).filter(f => /^\d\d-.*\.js$/.test(f) && !f.startsWith("99-")).sort()
      .map(f => `import * as m${f.slice(0, 2)} from "./${f}";`).join("\n") + `\nimport { Z } from "./zustand.js";\nObject.defineProperty(globalThis, "__da", { value: Object.assign({ Z }, ${fs.readdirSync(DIR).filter(f => /^\d\d-.*\.js$/.test(f) && !f.startsWith("99-")).sort().map(f => "m" + f.slice(0, 2)).join(", ")}) });`,
      resolveDir: DIR, loader: "js" },
    bundle: true, format: "iife", target: ["es2020"], write: false, logLevel: "error",
  });
  return (gebaut = r.outputFiles[0].text);
}

export function ladeApp({ heute = "2026-03-15" } = {}) {
  const fest = new Date(heute + "T10:00:00").getTime();
  class TestDate extends Date {
    constructor(...a) { if (a.length === 0) super(fest); else super(...a) }
    static now() { return fest }
  }
  const el = () => { const o = { hidden: false, style: { setProperty() {} }, classList: { add() {}, remove() {}, contains() { return false } }, addEventListener() {}, setAttribute() {}, removeAttribute() {}, appendChild() {}, querySelector() { return null }, querySelectorAll() { return [] } }; return o };
  const store = {};
  const ctx = {
    Date: TestDate, Element: class { set innerHTML(v) {} get innerHTML() { return "" } }, NodeFilter: { SHOW_TEXT: 4 }, console, setTimeout, clearTimeout, URL, Blob: class {}, TextEncoder, structuredClone,
    navigator: { userAgent: "test" },
    location: { href: "http://test/", pathname: "/", search: "", origin: "http://test" },
    history: { replaceState() {} },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => 0 },
    addEventListener() {},
    document: { getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), documentElement: el(), body: el(), fonts: { ready: Promise.resolve() } },
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code(), ctx, { filename: "app.js" });
  // Vorbereitung wie beim echten Start (ohne die Teile, die die Oberfläche und den Speicher anschließen)
  vm.runInContext(`__da.start03(); __da.start05(); __da.start06(); __da.start09();`, ctx);
  // Programmteile unter ihren Namen erreichbar machen (wie früher als globale Namen)
  vm.runInContext(`(() => { const d = globalThis.__da;
    for (const k of Object.keys(d.Z)) Object.defineProperty(globalThis, k, { configurable: true, get() { return d.Z[k] }, set(v) { d.Z[k] = v } });
    for (const k of Object.keys(d)) if (k !== "Z" && !(k in globalThis)) Object.defineProperty(globalThis, k, { configurable: true, get() { return d[k] } });
  })()`, ctx);
  // Ergebnis als einfache Daten zurückgeben (Arrays/Objekte aus der abgeschotteten Umgebung sind sonst nicht direkt vergleichbar)
  return (ausdruck) => { const v = vm.runInContext(ausdruck, ctx); if (v === undefined || typeof v === "function") return v; try { return JSON.parse(JSON.stringify(v)) } catch { return v } };
}
