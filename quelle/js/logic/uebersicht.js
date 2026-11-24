// Inhalt der „Übersicht für die Beratung“: ein Blatt für den Termin beim Pflegestützpunkt, bei der Pflegeberatung
// oder beim Sozialverband. Wer berät, sieht auf einen Blick die Lage, was schon läuft und welche Fristen anstehen.
// Das PDF baut services/dokumente.js.
import { MZ, WOHNEN } from "../config/stammdaten.js";
import { deadlines, widerspruchFrist } from "./fristen.js";
import { gdb, pg } from "./lage.js";
import { kasseName, sums, wertText } from "./leistungen.js";
import { Z } from "../state/zustand.js";
import { addDays, TODAY, isoD, datumBrief, parseIso } from "../utils/datum.js";

/** Datum wie in Briefen nach DIN 5008 (01.02.2027), das Blatt geht an Beratungsstellen */
const dat = (d) => datumBrief(isoD(d));

/** Fristen bis so viele Tage im Voraus */
const FRISTEN_TAGE = 365;

/** Gruppen in der Reihenfolge auf dem Blatt; was im Termin zu besprechen ist, steht oben */
const GRUPPEN = [
  ["abgelehnt", "Abgelehnt"],
  ["beantragt", "Beantragt, Antwort steht aus"],
  ["offen", "Noch nicht beantragt"],
  ["bewilligt", "Bewilligt oder schon genutzt"],
];

/**
 * @param b Leistung
 * @returns {[string, string]} Gruppe und Zusatz zum Stand (Datum)
 */
function stand(b) {
  if (Z.S.genutzt[b.k]) return ["bewilligt", "wird schon genutzt"];
  const st = Z.S.status[b.k] || "offen";
  const gesendet = parseIso((Z.S.sent || {})[b.k]);
  const abl = (Z.S.ablehnung || {})[b.k] || {};
  if (st === "abgelehnt") {
    const frist = widerspruchFrist(b.k);
    return ["abgelehnt", frist ? `Bescheid vom ${datumBrief(abl.datum)}, Widerspruch bis ${dat(frist)}` : ""];
  }
  if (st === "widerspruch") return ["abgelehnt", "Widerspruch eingelegt"];
  if (st === "beantragt") return ["beantragt", gesendet ? `abgeschickt am ${dat(gesendet)}` : ""];
  if (st === "bewilligt") return ["bewilligt", "bewilligt"];
  return ["offen", b.opt ? "je nach Lage" : ""];
}

/**
 * @returns {{angaben: [string, string][], gruppen: {titel: string, zeilen: {t: string, wert: string, stand: string}[]}[],
 *   fristen: {datum: string, t: string}[], stand: string}}
 */
export function uebersicht() {
  const S = Z.S,
    p = S.person;
  const mz = Object.keys((S.sb && S.sb.mz) || {}).filter((k) => S.sb.mz[k] && MZ[k]);
  /** @type {[string, string][]} */
  const alle = [
    ["Person", p.name || ""],
    ["Pflegegrad", pg() ? String(pg()) : S.bereiche.pflege ? "noch keiner oder beantragt" : ""],
    ["Wohnsituation", (WOHNEN[S.wohnen] || {}).t || ""],
    ["Kranken- und Pflegekasse", S.kasse ? kasseName().trim() : ""],
    ["Grad der Behinderung", gdb() ? `GdB ${gdb()}${mz.length ? ", Merkzeichen " + mz.join(", ") : ""}` : ""],
    ["Ausgefüllt von", S.rolle === "angehoerig" ? p.absender || "einer angehörigen Person" : ""],
  ];
  const angaben = alle.filter(([, v]) => v);

  const { all } = sums();
  const gruppen = GRUPPEN.map(([g, titel]) => ({
    titel,
    zeilen: all
      .map((b) => ({ b, s: stand(b) }))
      .filter((x) => x.s[0] === g)
      .map(({ b, s }) => ({ t: b.t, wert: wertText(b), stand: s[1] })),
  })).filter((g) => g.zeilen.length);

  const bis = addDays(TODAY(), FRISTEN_TAGE);
  const fristen = deadlines()
    .filter((f) => !f.ok && f.d >= TODAY() && f.d <= bis)
    .map((f) => ({ datum: dat(f.d), t: f.t }));

  return { angaben, gruppen, fristen, stand: dat(TODAY()) };
}
