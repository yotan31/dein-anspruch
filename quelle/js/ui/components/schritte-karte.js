// Karte „Deine nächsten Schritte“ oben in den Ansprüchen. Welche Schritte es sind, entscheidet logic/naechste-schritte.js.
import { naechsteSchritte } from "../../logic/naechste-schritte.js";
import { ic } from "../symbole.js";
import { esc, eur } from "../../utils/format.js";

/** Zweite und dritte Zeile eines Schritts: warum jetzt und wie viel Arbeit */
function zeilen(s) {
  if (s.art === "frist")
    return [
      s.tage === 0
        ? "Frist läuft heute ab"
        : s.tage === 1
          ? "Frist läuft morgen ab"
          : `Frist läuft in ${s.tage} Tagen ab`,
    ];
  if (s.art === "nachfrage")
    return [`Seit ${Math.floor(s.tage / 7)} Wochen keine Antwort`, "Der Brief zum Nachfragen ist fertig"];
  const wert = s.k === "pg_antrag" ? "Grundlage für fast alle Leistungen" : s.wert ? `${eur(s.wert)}/Jahr` : "";
  const aufwand = !s.fragen
    ? "Antrag ist schon vorbereitet"
    : s.fragen === 1
      ? "Antrag mit einer Frage"
      : `Antrag mit ${s.fragen} Fragen`;
  return [wert, aufwand].filter(Boolean);
}

/** Karte mit höchstens drei Schritten, oder nichts, wenn es keinen gibt */
export function schritteKarte() {
  const L = naechsteSchritte();
  if (!L.length) return "";
  return `<section class="panel schritte" aria-labelledby="schritte-h">
    <h2 id="schritte-h">Deine nächsten Schritte</h2>
    <ol>${L.map((s, i) => {
      const ziel = s.ziel.open ? `data-zeige="${esc(s.ziel.open)}"` : `data-tab="${esc(s.ziel.tab)}"`;
      const z = zeilen(s);
      return `<li><button type="button" class="schritt${s.art === "frist" ? " eilig" : ""}" ${ziel}>
        <span class="nr" aria-hidden="true">${i + 1}</span>
        <span class="s-text"><strong>${esc(s.t)}</strong>${z.map((x, j) => `<small${j === 0 && s.art !== "antrag" ? ' class="warum"' : ""}>${esc(x)}</small>`).join("")}</span>
        ${ic("chev")}
      </button></li>`;
    }).join("")}</ol>
  </section>`;
}
