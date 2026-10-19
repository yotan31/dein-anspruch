// Lädt die Programmteile aus quelle/js/ ohne Browser in eine abgeschottete Umgebung,
// damit einzelne Berechnungen direkt geprüft werden können.
// ladeApp({ heute: "2026-03-15" }) liefert eine Funktion run("ausdruck"), die im Programm ausgewertet wird.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "quelle", "js");

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
  const teile = fs.readdirSync(DIR).filter(f => f.endsWith(".js") && !f.startsWith("99-")).sort();
  const code = teile.map(f => fs.readFileSync(path.join(DIR, f), "utf8")).join("");
  vm.runInContext(code, ctx, { filename: "app.js" });
  // Ergebnis als einfache Daten zurückgeben (Arrays/Objekte aus der abgeschotteten Umgebung sind sonst nicht direkt vergleichbar)
  return (ausdruck) => { const v = vm.runInContext(ausdruck, ctx); if (v === undefined || typeof v === "function") return v; try { return JSON.parse(JSON.stringify(v)) } catch { return v } };
}
