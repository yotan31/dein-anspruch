// Pflegegrad-Bescheid: Punkte → Pflegegrad, Widerspruchsfrist und Erkennen der Werte aus dem Bescheid-Text.
import { Z } from "../state/zustand.js";
import { daysUntil, parseIso } from "../utils/datum.js";
import { numDE } from "../utils/format.js";

/* ---------- Bescheid & Widerspruch ---------- */
export const PG_GRENZEN = [12.5, 27, 47.5, 70, 90];
// ab diesen Punkten gilt Pflegegrad 1..5
/**
 * Pflegegrad zu einer Punktzahl aus der Begutachtung.
 * @param p Punkte
 */
export function pgAusPunkten(p) {
  let g = 0;
  PG_GRENZEN.forEach((t, i) => {
    if (p >= t) g = i + 1;
  });
  return g;
}

/**
 * Auswertung des gespeicherten Bescheids: Pflegegrad, Abstand zur nächsten Stufe, Widerspruchsfrist; ohne Bescheid null.
 */
export function bescheidInfo() {
  const b = Z.S.bescheid;
  if (!b) return null;
  const pts = numDE(b.punkte),
    hasPts = String(b.punkte || "").trim() !== "";
  const g = Number(b.pg) || (hasPts ? pgAusPunkten(pts) : 0);
  const next = g < 5 ? PG_GRENZEN[g] : null;
  const fehlt = hasPts && next != null ? Math.max(0, next - pts) : null;
  const ein = parseIso(b.eingang);
  let frist = null;
  if (ein) {
    frist = new Date(ein);
    frist.setMonth(frist.getMonth() + 1);
  }
  const knapp = fehlt != null && fehlt <= 7.5;
  const abgelehnt = g === 0 && (hasPts || b.art === "ablehnung");
  return { g, pts, hasPts, next, fehlt, frist, knapp, abgelehnt, offen: frist && daysUntil(frist) >= 0 };
}

/** @type {[RegExp,string,string][]} */
const GUT_HINWEISE = [
  [/pflegebett/i, "Pflegebett", "technisch"],
  [/hausnotruf/i, "Hausnotruf", "technisch"],
  [/rollator/i, "Rollator (über die Krankenkasse)", "technisch"],
  [/duschstuhl|duschhocker|badewannenlift|badewannen/i, "Hilfe im Bad", "technisch"],
  [/haltegriff|treppenlift|umbau|wohnumfeld|schwelle/i, "Wohnungsumbau", "wohnumfeld"],
  [/tagespflege/i, "Tagespflege", "tagespflege"],
  [/reha|rehabilitation/i, "Reha-Empfehlung", "beratung"],
  [/pflegekurs|schulung/i, "Pflegekurs", "pflegekurs"],
];

/**
 * Sucht Pflegegrad, Punkte und Datum im gelesenen Text eines Bescheids.
 * @param t Text
 */
export function parseBescheid(t) {
  const out = {};
  const txt = t.replace(/\s+/g, " ");
  let m = txt.match(/Pflegegrad\s*[:-]?\s*([1-5])\b/i);
  if (m) out.pg = m[1];
  m = txt.match(
    /(gesamtpunkt\w*|gewichtete\w*\s+gesamtpunkt\w*|punktwert|gesamtpunktzahl)[^0-9]{0,30}(\d{1,3}(?:[.,]\d{1,2})?)/i,
  );
  if (m) out.punkte = m[2].replace(".", ",");
  if (/abgelehnt|keine pflegebedürftigkeit|nicht pflegebedürftig/i.test(txt) && !out.pg) out.art = "ablehnung";
  m = txt.match(/(?:vom|datum)\s*:?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i);
  if (m) out.datum = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  out.hinweise = [...new Set(GUT_HINWEISE.filter(([re]) => re.test(txt)).map(([, t, k]) => t + "|" + k))];
  return out;
}
