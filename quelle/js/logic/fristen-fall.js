// Fristen eines Falls ohne geöffnete App: dieselben Regeln wie im Reiter „Termine“ (logic/fristen.js),
// aber für gespeicherte Angaben aus der Datenbank. Die E-Mail-Erinnerungen (supabase/functions/erinnerungen)
// nutzen genau diese Funktion; quelle/bauen.mjs packt sie dafür in eine eigene Datei. So können App und E-Mail
// nicht mehr auseinanderlaufen: Eine neue Frist in fristen.js kommt automatisch auch per E-Mail.
import { deadlines } from "./fristen.js";
import { merge } from "../state/angaben.js";
import { Z } from "../state/zustand.js";
import { isoD } from "../utils/datum.js";

/**
 * @param {any} daten gespeicherte Angaben eines Falls (Spalte data der Tabelle fall)
 * @param {any[]} [belege] Belege des Falls (mindestens kat, datum, jahr, betrag)
 * @returns {{key: string, titel: string, datum: Date, text: string, nurAmTag: boolean}[]} offene Fristen; key ist je Frist
 *   und Datum eindeutig; nurAmTag: keine Vorwarnung, nur am Tag selbst erinnern (z. B. Nachfragen)
 */
export function fristenFuerFall(daten, belege = []) {
  const vorher = { S: Z.S, BEL: Z.BEL };
  try {
    Z.S = merge(daten || {});
    Z.BEL = belege;
    return deadlines()
      .filter((x) => !x.ok)
      .map((x) => ({ key: `${x.k}-${isoD(x.d)}`, titel: x.t, datum: x.d, text: x.s, nurAmTag: !!x.nurAmTag }));
  } finally {
    Z.S = vorher.S;
    Z.BEL = vorher.BEL;
  }
}
