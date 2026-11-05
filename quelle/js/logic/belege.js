// Belege auswerten: Arten (Kategorien), gewählte Jahre, Bruttoeinkommen und Zuzahlungs-Belastungsgrenze.
import { BETRAEGE } from "../config/betraege.js";
import { gdb, pg } from "./lage.js";
import { Z } from "../state/zustand.js";
import { numDE } from "../utils/format.js";

/* ---------- Belege-Daten ---------- */
export const KATS = {
  apo: { t: "Zuzahlung Apotheke / Rezept", zz: true },
  fahrt: { t: "Zuzahlung Fahrten", zz: true },
  heil: { t: "Zuzahlung Therapie, Hilfsmittel, Klinik", zz: true },
  entl: { t: "Entlastungsbetrag (Rechnungen)" },
  vhp: { t: "Verhinderungs- & Kurzzeitpflege" },
  pflhm: { t: "Pflegehilfsmittel" },
  beratung: { t: "Nachweis Beratungsbesuch" },
  bescheid: { t: "Bescheide & Schreiben" },
  sonst: { t: "Sonstiges" },
};

/** Im Belege-Reiter gewählte Jahre, neueste zuerst; ohne Auswahl das laufende Jahr. */
export function selYears() {
  let j = (Z.S.belegFilter.jahre || []).map(String).filter(Boolean);
  if (!j.length) j = [String(new Date().getFullYear())];
  return [...new Set(j)].sort().reverse();
}

/**
 * Bruttoeinkommen eines Jahres für die Belastungsgrenze; fürs laufende Jahr ersatzweise die Angabe aus dem Fragebogen.
 * @param j Jahr
 */
export function bruttoOf(j) {
  j = String(j);
  const bj = Z.S.bruttoJahr || {};
  if (bj[j] != null && bj[j] !== "") return bj[j];
  return j === String(new Date().getFullYear()) ? Z.S.brutto || "" : "";
}

/**
 * Gilt die Person als chronisch krank (1 % statt 2 % Belastungsgrenze)? Ohne Angabe ab Pflegegrad 3 oder GdB 60.
 */
export function chronisch() {
  if (Z.S.chronisch) return Z.S.chronisch === "ja";
  return pg() >= 3 || gdb() >= 60;
}

/**
 * Zuzahlungen eines Jahres und die Belastungsgrenze (Summe, Prozentsatz, Brutto, Grenze in Euro).
 * @param jahr Jahr
 */
export function zuz(jahr) {
  const sum = Z.BEL.filter((b) => KATS[b.kat] && KATS[b.kat].zz && String(b.jahr) === String(jahr)).reduce(
    (s, b) => s + (Number(b.betrag) || 0),
    0,
  );
  const pct = chronisch() ? BETRAEGE.belastungsgrenzeChronischProzent : BETRAEGE.belastungsgrenzeProzent;
  const brutto = numDE(bruttoOf(jahr));
  return { sum, pct, brutto, grenze: brutto ? (brutto * pct) / 100 : 0 };
}
