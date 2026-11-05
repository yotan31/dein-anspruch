// Misst die gebaute App mit Lighthouse (Handy-Profil, gedrosseltes Netz und gedrosselte CPU wie bei Lighthouse üblich).
// Aufruf: npm run bauen && npm run messen   – Chrome wird über CHROME_PATH gefunden, sonst über Playwright.
// Ergebnis: Punkte je Kategorie und die Kernwerte LCP, CLS, TBT; zusätzlich als JSON in werkzeuge/messung.json.
import fs from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";
import { starteServer, SITE } from "./server.mjs";

const KATEGORIEN = ["performance", "accessibility", "best-practices", "seo"];
const WIEDERHOLUNGEN = 3; // Median aus drei Läufen, weil einzelne Lighthouse-Läufe schwanken

/** @param {number[]} werte */
const median = (werte) => [...werte].sort((a, b) => a - b)[Math.floor(werte.length / 2)];

/** Ein Lighthouse-Lauf gegen die Startseite. @param {string} url @param {number} port */
async function einLauf(url, port) {
  const { lhr } = await lighthouse(url, { port, output: "json", onlyCategories: KATEGORIEN, logLevel: "error" });
  return {
    punkte: Object.fromEntries(KATEGORIEN.map((k) => [k, Math.round((lhr.categories[k].score || 0) * 100)])),
    lcp_ms: Math.round(lhr.audits["largest-contentful-paint"].numericValue),
    cls: Number(lhr.audits["cumulative-layout-shift"].numericValue.toFixed(3)),
    tbt_ms: Math.round(lhr.audits["total-blocking-time"].numericValue),
    fcp_ms: Math.round(lhr.audits["first-contentful-paint"].numericValue),
    kb_uebertragen: Math.round(lhr.audits["total-byte-weight"].numericValue / 1024),
  };
}

const server = await starteServer();
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox"],
});
try {
  const laeufe = [];
  for (let i = 0; i < WIEDERHOLUNGEN; i++) laeufe.push(await einLauf(server.url, chrome.port));
  const ergebnis = {
    gemessen_am: new Date().toISOString(),
    punkte: Object.fromEntries(KATEGORIEN.map((k) => [k, median(laeufe.map((l) => l.punkte[k]))])),
    ...Object.fromEntries(["lcp_ms", "cls", "tbt_ms", "fcp_ms", "kb_uebertragen"].map((k) => [k, median(laeufe.map((l) => l[k]))])),
  };
  fs.writeFileSync(path.join(path.dirname(SITE), "werkzeuge", "messung.json"), JSON.stringify(ergebnis, null, 2) + "\n");
  console.log(JSON.stringify(ergebnis, null, 2));
} finally {
  await chrome.kill();
  server.close();
}
