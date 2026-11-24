// „Deine nächsten Schritte“: höchstens drei Dinge, mit denen man jetzt anfangen sollte. Für Menschen, die gerade
// pflegen, ist eine Liste mit 20 Leistungen zu viel; hier steht, was zuerst kommt.
// Reihenfolge: 1. Fristen, die bald ablaufen  2. ohne Pflegegrad: den Pflegegrad beantragen
// 3. Anträge, die seit 4 Wochen ohne Antwort sind, nachfragen  4. Geld, das jedes Jahr zusteht, nach Betrag und Aufwand.
import { kannNachfragen } from "./folgebriefe.js";
import { NACHFRAGE_TAGE, deadlines } from "./fristen.js";
import { sums } from "./leistungen.js";
import { Z } from "../state/zustand.js";
import { daysUntil, parseIso } from "../utils/datum.js";

/** Fristen, die so bald ablaufen, dass sie vor allem anderen stehen */
const FRIST_TAGE = 30;
/** Nur Fristen, die sicher diese Familie betreffen. Allgemeine Termine (Verfall Entlastungsbetrag, Verhinderungspflege
 *  des Vorjahrs, Zuzahlungsbefreiung) stehen im Reiter „Termine“; oben würden sie Familien ablenken, die das nicht nutzen. */
const FRIST_ARTEN = ["abl-", "wid", "beratung", "wm"];
const MAX = 3;

/**
 * @typedef {{art: "frist"|"nachfrage"|"antrag", k: string, t: string, tage?: number, wert?: number, fragen?: number,
 *   ziel: {open?: string, tab?: string}}} Schritt
 * art: frist = Frist läuft ab, nachfrage = Antrag ohne Antwort, antrag = Leistung beantragen.
 * ziel: Leistung aufklappen (open) oder Reiter öffnen (tab).
 */

/**
 * Die nächsten Schritte, wichtigste zuerst.
 * @param max höchstens so viele
 * @returns {Schritt[]}
 */
export function naechsteSchritte(max = MAX) {
  /** @type {Schritt[]} */
  const L = [];
  const { offen } = sums();
  const stand = (b) => Z.S.status[b.k] || "offen";

  // 1. Fristen, die bald ablaufen. Der Beratungsbesuch schon ab seinem Erinnerungstag (45 Tage vorher),
  //    weil ohne ihn das Pflegegeld gekürzt wird
  for (const f of deadlines()) {
    const tage = daysUntil(f.d);
    if (f.ok || tage < 0 || !FRIST_ARTEN.some((a) => f.k.startsWith(a))) continue;
    if (tage > FRIST_TAGE && !(f.k === "beratung" && daysUntil(f.remind) <= 0)) continue;
    const k = f.k.startsWith("abl-") ? f.k.slice(4) : "";
    L.push({ art: "frist", k: f.k, t: f.t, tage, ziel: k ? { open: k } : { tab: "termine" } });
  }

  // 2. Ohne Pflegegrad hängt fast alles am Antrag
  const pgAntrag = offen.find((b) => b.k === "pg_antrag" && stand(b) === "offen");
  if (pgAntrag) L.push(antrag(pgAntrag));

  // 3. Abgeschickt, aber seit Wochen keine Antwort
  for (const b of offen) {
    const gesendet = parseIso((Z.S.sent || {})[b.k]);
    if (!gesendet || !kannNachfragen(b)) continue;
    const tage = -daysUntil(gesendet);
    if (tage >= NACHFRAGE_TAGE) L.push({ art: "nachfrage", k: b.k, t: b.t, tage, ziel: { open: b.k } });
  }

  // 4. Geld, das jedes Jahr zusteht: viel Geld und wenig Fragen zuerst
  const aufwand = (b) => (b.val() || 0) / (1 + 0.05 * (b.q || []).length);
  offen
    .filter((b) => b.cash && b.ask && stand(b) === "offen" && (b.val() || 0) > 0)
    .sort((a, b) => aufwand(b) - aufwand(a))
    .forEach((b) => L.push(antrag(b)));

  return L.slice(0, max);
}

/**
 * @param b Leistung
 * @returns {Schritt}
 */
function antrag(b) {
  const fragen = (b.q || []).filter((q) => !q.show || q.show()).length;
  return { art: "antrag", k: b.k, t: b.t, wert: b.val ? b.val() || 0 : 0, fragen, ziel: { open: b.k } };
}
