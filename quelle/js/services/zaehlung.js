// Anonyme Schritt-Zählung: nur Monat, Schritt und Antrags-Art, nie Personen oder Inhalte.
// Dient dazu zu sehen, wo Familien hängen bleiben.
import { Z } from "../state/zustand.js";

/* ---------- Anonyme Schritt-Zählung: nur Monat, Schritt und Antrag-Art ----------
   Keine Kennung, kein Cookie, nichts auf dem Gerät gespeichert, keine Gesundheitsangaben.
   Jeder Schritt zählt höchstens einmal pro Seitenaufruf. Die Testversion und lokale Aufrufe zählen nicht mit. */
const gezaehlt = new Set();

/** @param {"start"|"fragebogen_begonnen"|"fragebogen_fertig"|"antrag_geoeffnet"|"antrag_fertig"|"antrag_abgeschickt"} schritt @param {string} [art] Schlüssel der Leistung, z. B. pg_antrag */
export function zaehle(schritt, art = "") {
  try {
    if (!Z.sb || /\/test\//.test(location.pathname) || /^(localhost|127\.)/.test(location.hostname)) return;
    const a = String(art || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 30),
      key = schritt + "|" + a;
    if (gezaehlt.has(key)) return;
    gezaehlt.add(key);
    Z.sb.rpc("zaehlen", { schritt, art: a }).then(
      () => {},
      () => {},
    );
  } catch (e) {}
}
