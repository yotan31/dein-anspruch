// Automatische Tests für „Dein Anspruch“.
// Startet die gebaute App aus site/ auf einem lokalen Server und spielt die wichtigsten Abläufe
// in einem Handy-Browser durch. Die Datenbank wird durch einen Platzhalter ersetzt, es werden
// also keine echten Daten gelesen oder geschrieben.
// Aufruf: node tests/oberflaeche.mjs   (vorher: python3 quelle/bauen.py)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PW || "playwright");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const PDF = path.join(ROOT, "tests", "dateien", "sammel.pdf");

// ---------- kleiner Webserver für site/ ----------
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".wasm": "application/wasm", ".pfb": "application/octet-stream", ".ttf": "font/ttf", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(SITE, p.endsWith("/") ? p + "index.html" : p);
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("404") }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ---------- Test-Helfer ----------
let failed = 0, passed = 0;
let bereich = "";
function check(name, ok, info = "") {
  if (ok) { passed++; console.log("  ✓ " + name); return }
  failed++; console.log("  ✗ " + name + (info ? "  → " + info : ""));
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=Test fehlgeschlagen (${bereich})::${name}${info ? " → " + String(info).replace(/[\r\n]+/g, " ").slice(0, 300) : ""}`);
}
const log = console.log; console.log = (...a) => { if (a.length === 1 && typeof a[0] === "string" && !a[0].startsWith(" ") && !a[0].startsWith("::") && !a[0].startsWith("\n")) bereich = a[0]; log(...a) };
process.on("unhandledRejection", e => { console.log(`::error title=Testlauf abgebrochen (${bereich})::${String(e && e.message || e).replace(/[\r\n]+/g, " ").slice(0, 400)}`); process.exit(1) });
const browser = await chromium.launch();
async function newPage({ gast = null, stub = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true });
  const extern = [];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => { extern.push(r.request().url()); r.abort() });
  if (gast) await ctx.addInitScript(g => { if (!sessionStorage.x) { sessionStorage.x = 1; localStorage.setItem("dein-anspruch-modus", JSON.stringify("gast")); localStorage.setItem("dein-anspruch-gast", JSON.stringify(g)) } }, gast);
  if (stub) await ctx.addInitScript(() => {
    // Platzhalter-Datenbank: angemeldeter Nutzer ohne Einwilligung
    window.__ins = []; let user = { id: "u1", email: "test@example.org", user_metadata: {} }; const rows = { fall: [], mitglied: [], belege: [] };
    const q = t => { const st = { op: "select" }; const api = {
      select() { return api }, eq() { return api }, order() { return api },
      single() { return Promise.resolve({ data: rows.fall[rows.fall.length - 1], error: null }) },
      maybeSingle() { return Promise.resolve({ data: null, error: null }) },
      insert(r) { window.__ins.push([t, r]); if (t === "fall") { rows.fall.push({ id: "f1", data: r.data, created_by: "u1", updated_at: "x" }); rows.mitglied.push({ fall_id: "f1", rolle: "besitzer", user_id: "u1" }) } st.op = "ins"; return api },
      update() { st.op = "upd"; return api }, delete() { return api }, upsert() { return Promise.resolve({ error: null }) },
      then(res) { return Promise.resolve({ data: st.op === "select" ? (rows[t] || []) : null, error: null }).then(res) } }; return api };
    Object.defineProperty(window, "supabase", { configurable: true, get: () => ({ createClient: () => ({
      auth: { onAuthStateChange() {}, getSession: async () => ({ data: { session: { user } } }), updateUser: async ({ data }) => { user = { ...user, user_metadata: { ...user.user_metadata, ...data } }; return { data: { user }, error: null } }, signOut: async () => {} },
      from: q, rpc: async () => ({ data: null, error: null }), functions: { invoke: async (n, o) => { window.__fn = [n, o && o.body]; return { data: { ok: true }, error: null } } }, storage: { from: () => ({ createSignedUrls: async () => ({ data: [] }) }) } }) }), set() {} });
  });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  return { page, ctx, errors, extern };
}
// wartet, bis fn() im Browser true liefert (ohne waitForFunction, das die Sicherheitsregeln der Seite blockieren)
async function waitFor(page, fn, ms = 60000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(250) } throw new Error("Zeitüberschreitung beim Warten") }
// Seite öffnen und die Programmteile für die Tests unter ihren Namen erreichbar machen
// (die App legt sie unter window.__da ab, z. B. __da.Z.S für die Angaben oder __da.render)
async function gehe(page, url, ms = 600) {
  await page.goto(url); await page.waitForTimeout(ms);
  await page.evaluate(() => {
    const d = window.__da; if (!d) throw new Error("window.__da fehlt");
    for (const k of Object.keys(d.Z)) { try { Object.defineProperty(window, k, { configurable: true, get() { return d.Z[k] }, set(v) { d.Z[k] = v } }) } catch (e) { } }
    for (const k of Object.keys(d)) { if (k === "Z" || k in window) continue; try { Object.defineProperty(window, k, { configurable: true, get() { return d[k] } }) } catch (e) { } }
  });
}
const GAST = { done: true, welcomeSeen: true, bereiche: { pflege: true, sb: false }, pg: "3", kasse: "aok", aokRegion: "bw", wohnen: "angehoerige", rolle: "angehoerig", step: 6, tab: "ansprueche", genutzt: { pflegegeld: true }, person: { name: "Testperson", ort: "70173 Stuttgart" } };

// ---------- 1. Fragebogen von vorn ----------
console.log("Fragebogen");
{
  const { page, errors, extern } = await newPage({ gast: { } });
  await gehe(page, BASE, 600);
  for (let i = 0; i < 12; i++) {
    const c = page.locator("#main .choice"); if (await c.count()) { await c.first().tap(); await page.waitForTimeout(120) }
    const nx = page.locator('[data-act="next"]'); if (!(await nx.count())) break; await nx.tap(); await page.waitForTimeout(300);
  }
  check("Fragebogen lässt sich bis zum Ende durchklicken", await page.evaluate(() => S.done === true));
  check("keine Google-Schriften geladen", !extern.some(u => /fonts\.(googleapis|gstatic)/.test(u)), extern.join(" "));
  check("keine Programmfehler", errors.length === 0, errors.join(" | "));
}

// ---------- 2. Ansprüche, Assistent, Reiter ----------
console.log("Ansprüche und Antrag-Assistent");
{
  const { page, errors } = await newPage({ gast: GAST });
  await gehe(page, BASE, 600);
  check("Betrag oben wird angezeigt", /\d.*€/.test(await page.textContent("#hero .figure")));
  await page.evaluate(() => { window.__h = document.querySelector("#main .item .head") });
  await page.tap(".item .head"); await page.waitForTimeout(350);
  check("Leistung klappt auf", await page.locator(".detail").count() === 1);
  check("Seite wird nicht komplett neu aufgebaut", await page.evaluate(() => window.__h === document.querySelector("#main .item .head")));
  await page.locator("[data-wopen]").first().tap(); await page.waitForTimeout(350);
  check("Assistent startet mit leichter Frage", !/Versichertennummer|wohnt/.test(await page.textContent("h2.wq")), await page.textContent("h2.wq"));
  let advanced = false;
  for (let k = 0; k < 15; k++) {
    if (await page.locator(".wiz .choice input[type=radio]").count()) { const a = await page.textContent("h2.wq"); await page.locator(".wiz .choice").first().tap(); await page.waitForTimeout(700); advanced = a !== await page.textContent("h2.wq"); break }
    const nx = page.locator('.wiz .nav [data-wnav="next"]').first(); if (!(await nx.count())) break; await nx.tap(); await page.waitForTimeout(300);
  }
  check("Auswahl springt automatisch zur nächsten Frage", advanced);
  await page.tap('.wiz [data-wnav="close"]'); await page.waitForTimeout(300);
  await page.tap('[data-tab="termine"]'); await page.waitForTimeout(100);
  check("Reiter wechselt mit Animation", /go-/.test(await page.getAttribute("#main", "class") || ""));
  check("keine Programmfehler", errors.length === 0, errors.join(" | "));
}

// ---------- 3. Pflegegrad-Rechner ----------
console.log("Pflegegrad-Rechner");
{
  const { page, errors } = await newPage({ gast: GAST });
  await gehe(page, BASE + "?rechner", 600);
  let n = 0; while (await page.locator("[data-rq]").count() && n < 30) { await page.locator(".choice").nth(1).tap(); await page.waitForTimeout(450); n++ }
  check("alle 24 Fragen beantwortbar", n === 24, "beantwortet: " + n);
  check("Ergebnis wird angezeigt", /Pflegegrad/.test(await page.textContent("h2.wq")));
  check("Weiterempfehlen-Knopf vorhanden", await page.locator('[data-act="teilen"]').count() > 0);
  check("keine Programmfehler", errors.length === 0, errors.join(" | "));
}

// ---------- 4. Sammel-PDF ----------
console.log("Sammel-PDF mit mehreren Rechnungen");
{
  const { page, errors } = await newPage({ gast: { ...GAST, tab: "belege" } });
  await gehe(page, BASE, 600);
  await page.evaluate(() => { window.__up = []; ASSETS = { upload: async (b, { type }) => { window.__up.push(type); return { id: "f/" + window.__up.length, contentType: type } }, delete: async () => {} }; render() });
  await page.setInputFiles("#fileAny", PDF);
  await waitFor(page, () => bulk && bulk.phase !== "lesen");
  const items = await page.evaluate(() => bulk.items.map(i => [i.pages.join("+"), i.kat, i.datum, i.betrag]));
  check("5 Rechnungen auf 6 Seiten erkannt", items.length === 5, JSON.stringify(items));
  const want = [["1", "apo", "2024-03-14", "10,00"], ["2", "entl", "2025-01-31", "130,00"], ["3+4", "vhp", "2025-06-12", "682,00"], ["5", "fahrt", "2026-02-03", "10,00"], ["6", "heil", "2026-04-20", "31,80"]];
  want.forEach((w, i) => check(`Rechnung ${i + 1}: Art, Datum, Betrag richtig`, JSON.stringify(items[i]) === JSON.stringify(w), JSON.stringify(items[i])));
  await page.tap('[data-act="bulk-save"]'); await waitFor(page, () => !bulk);
  check("alle Belege gespeichert", await page.evaluate(() => BEL.length) === 5);
  check("Jahre 2024–2026 eingeblendet", await page.evaluate(() => ["2024", "2025", "2026"].every(y => S.belegFilter.jahre.includes(y))));
  check("keine Programmfehler", errors.length === 0, errors.join(" | "));
}

// ---------- 5. Sicherung, Löschen, Einspielen ----------
console.log("Sicherung und Löschen");
{
  const { page, errors } = await newPage({ gast: GAST });
  await gehe(page, BASE, 600);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => backupData())]);
  const file = await dl.path();
  check("Sicherung wird heruntergeladen", /dein-anspruch-sicherung/.test(dl.suggestedFilename()));
  await page.evaluate(() => { wipeAsk = true; render() }); await page.waitForTimeout(100);
  await page.locator('[data-act="wipe-yes"]').tap(); await page.waitForTimeout(150);
  check("Löschen ohne Bestätigungswort wird verhindert", await page.evaluate(() => S.person.name) === "Testperson");
  await page.fill("#wipe-word", "LÖSCHEN"); await page.locator('[data-act="wipe-yes"]').tap(); await page.waitForTimeout(300);
  check("Löschen mit Bestätigungswort klappt", await page.evaluate(() => !S.done));
  await page.setInputFiles("#fileJson", file); await page.waitForTimeout(500);
  check("Sicherung lässt sich wieder einspielen", await page.evaluate(() => S.done && S.person.name === "Testperson"));
  check("keine Programmfehler", errors.length === 0, errors.join(" | "));
}

// ---------- 6. Konto: Einwilligung, Feedback, Fehlerprotokoll ----------
console.log("Konto, Einwilligung und Feedback");
{
  const { page, errors } = await newPage({ stub: true });
  await gehe(page, BASE, 800);
  check("Einwilligung wird vor allem anderen abgefragt", (await page.textContent("#main h2")) === "Bevor es losgeht");
  check("vor der Einwilligung wird nichts gespeichert", await page.evaluate(() => window.__ins.length) === 0);
  await page.tap('[data-act="cs-yes"]'); await page.waitForTimeout(150);
  check("ohne Häkchen geht es nicht weiter", (await page.textContent("#main h2")) === "Bevor es losgeht");
  await page.locator('label[for="cs-ok"]').tap(); await page.tap('[data-act="cs-yes"]'); await page.waitForTimeout(800);
  check("nach der Einwilligung startet die App", (await page.textContent("#main h2")) !== "Bevor es losgeht");
  check("Einwilligung mit Datum gespeichert", await page.evaluate(() => !!USER.user_metadata.einwilligung_am));
  await page.evaluate(() => openFeedback()); await page.fill("#fb-text", "Testnachricht"); await page.tap('[data-act="fb-send"]'); await page.waitForTimeout(300);
  check("Feedback wird gesendet", await page.evaluate(() => window.__ins.some(x => x[0] === "rueckmeldung" && x[1].text === "Testnachricht")));
  await page.evaluate(() => { setTimeout(() => { throw new Error("Testfehler test@example.org 123456789") }, 0) }); await page.waitForTimeout(200);
  const f = await page.evaluate(() => (window.__ins.find(x => x[0] === "fehler") || [])[1]);
  check("Fehler wird protokolliert", !!f);
  check("Fehlerprotokoll enthält keine E-Mail und keine langen Zahlen", !!f && !/@|\d{5,}/.test(f.meldung), f && f.meldung);
  await page.evaluate(() => { S.done = true; S.welcomeSeen = true; S.tab = "ansprueche"; render() }); await page.waitForTimeout(150);
  await page.locator('[data-act="wipe"]').scrollIntoViewIfNeeded(); await page.locator('[data-act="wipe"]').tap(); await page.waitForTimeout(150);
  check("vor dem Löschen kommt die Frage „Bist du sicher?“", /Bist du sicher/.test(await page.textContent("#wipebox")));
  await page.locator('[data-act="wipe-yes"]').tap(); await page.waitForTimeout(150);
  check("ohne Bestätigungswort wird nichts gelöscht", await page.evaluate(() => !window.__fn && !!USER));
  await page.fill("#wipe-word", "LÖSCHEN"); await page.locator('[data-act="wipe-yes"]').tap(); await page.waitForTimeout(500);
  check("mit Bestätigung wird das Konto gelöscht", await page.evaluate(() => window.__fn && window.__fn[0] === "konto-loeschen" && window.__fn[1].bestaetigung === "LÖSCHEN"));
  check("danach ist man abgemeldet", await page.evaluate(() => !USER));
  check("keine anderen Programmfehler", errors.filter(e => !/Testfehler/.test(e)).length === 0, errors.join(" | "));
}

await browser.close(); server.close();
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed ? 1 : 0);
