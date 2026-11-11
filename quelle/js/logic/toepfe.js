// Budgets, die jedes Jahr neu kommen und verfallen, wenn man sie nicht nutzt: Entlastungsbetrag, Jahresbetrag für
// Verhinderungs- und Kurzzeitpflege, Pflegehilfsmittel. Genutzt wird aus den Belegen gerechnet.
// Dazu der Jahresrückblick, der im ersten Quartal zeigt, was im Vorjahr genutzt wurde und was liegen blieb.
import { ENTLASTUNG, JAHRESBETRAG, VERBRAUCH } from "../config/stammdaten.js";
import { isHome, pg } from "./lage.js";
import { Z } from "../state/zustand.js";
import { TODAY, parseIso } from "../utils/datum.js";

/** Bis Ende März erscheint der Rückblick auf das Vorjahr (Monat 0–2) */
const RUECKBLICK_BIS_MONAT = 2;

/**
 * Monate eines Jahres mit Pflegegrad: ab „Pflegegrad seit“, im laufenden Jahr bis zum aktuellen Monat.
 * @param jahr Jahr
 * @param bisHeute im laufenden Jahr nur bis zum aktuellen Monat zählen
 */
function monate(jahr, bisHeute) {
  const t = TODAY();
  const bis = bisHeute && jahr === t.getFullYear() ? t.getMonth() + 1 : 12;
  const seit = parseIso(Z.S.entlSeit ? Z.S.entlSeit + "-01" : "");
  let von = 0;
  if (seit && seit.getFullYear() > jahr) return 0;
  if (seit && seit.getFullYear() === jahr) von = seit.getMonth();
  return Math.max(0, bis - von);
}

/**
 * Summe der Belege einer Art in einem Jahr.
 * @param kat Art des Belegs (siehe KATS in logic/belege.js)
 * @param jahr Jahr
 */
function genutzt(kat, jahr) {
  return Z.BEL.filter((b) => b.kat === kat && String(b.jahr) === String(jahr)).reduce(
    (s, b) => s + (Number(b.betrag) || 0),
    0,
  );
}

/**
 * Alle Töpfe für ein Jahr, nur die, auf die nach den Angaben Anspruch besteht.
 * @param jahr Jahr, sonst das laufende
 * @param bisHeute Monatsbudgets im laufenden Jahr nur bis heute rechnen
 * @returns {{k: string, t: string, budget: number, genutzt: number, rest: number, verfall: string}[]}
 */
export function toepfe(jahr = TODAY().getFullYear(), bisHeute = true) {
  const L = [];
  const add = (k, t, budget, kat, verfall) => {
    const g = genutzt(kat, jahr);
    L.push({ k, t, budget, genutzt: g, rest: Math.max(0, budget - g), verfall });
  };
  if (pg() >= 1 && isHome())
    add("entl", "Entlastungsbetrag", ENTLASTUNG * monate(jahr, bisHeute), "entl", `Rest verfällt am 30.06.${jahr + 1}`);
  if (pg() >= 2 && isHome())
    add(
      "vhp",
      "Verhinderungs- und Kurzzeitpflege",
      JAHRESBETRAG,
      "vhp",
      `Kosten aus ${jahr} bis 31.12.${jahr + 1} einreichen`,
    );
  if (pg() >= 1 && isHome())
    add("pflhm", "Pflegehilfsmittel", VERBRAUCH * monate(jahr, bisHeute), "pflhm", "verfällt jeden Monat");
  return L;
}

/** Soll der Rückblick auf das Vorjahr gezeigt werden? Nur im ersten Quartal und bis er weggeklickt wurde. */
export function rueckblickFaellig() {
  const t = TODAY();
  const vorjahr = t.getFullYear() - 1;
  return t.getMonth() <= RUECKBLICK_BIS_MONAT && Z.S.rueckblick !== vorjahr && toepfe(vorjahr, false).length > 0;
}

/**
 * Rückblick auf das Vorjahr: je Topf genutzt, Budget und was offen blieb, dazu die Summe.
 * Belege sind die einzige Quelle; ohne Belege steht dort 0 €, darauf weist die Oberfläche hin.
 */
export function rueckblick() {
  const jahr = TODAY().getFullYear() - 1;
  const L = toepfe(jahr, false);
  return {
    jahr,
    toepfe: L,
    genutzt: L.reduce((s, x) => s + x.genutzt, 0),
    offen: L.reduce((s, x) => s + x.rest, 0),
    ohneBelege: L.every((x) => x.genutzt === 0),
  };
}
