// Darstellung der ausführlichen Erklärungen (Inhalt: logic/erklaerungen.js): oben drei kurze Antworten,
// aufklappbar alles Weitere. Dazu der Vergleich „Wer springt ein?“, der auch im Antrag selbst erscheint.
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/**
 * Drei kurze Antworten (Wofür, was bekommt ihr, wann beantragen) und ob es nach den Angaben passt.
 * @param {import("../../logic/erklaerungen.js").Erklaerung} e
 */
export function kurzErklaert(e) {
  return `<dl class="kurz-erklaert">${e.kurz.map(([f, a]) => `<div><dt>${esc(f)}</dt><dd>${esc(a)}</dd></div>`).join("")}</dl>
    <p class="passt${e.passt.ja ? " ja" : ""}">${ic(e.passt.ja ? "check" : "info")}<span>${esc(e.passt.text)}</span></p>`;
}

/**
 * Karten „Wer springt ein?“: je Möglichkeit, was die Kasse zahlt und welcher Beleg nötig ist.
 * @param {import("../../logic/erklaerungen.js").VergleichZeile[]} zeilen
 */
export function vergleichHTML(zeilen) {
  return `<div class="vergleich">${zeilen
    .map(
      (z) => `<div class="v-karte">
        <strong>${esc(z.wer)}</strong><small>${esc(z.beispiele)}</small>
        <dl><div><dt>Die Kasse zahlt</dt><dd>${esc(z.zahlt)}</dd></div><div><dt>Ihr braucht</dt><dd>${esc(z.braucht)}</dd></div></dl>
      </div>`,
    )
    .join("")}</div>`;
}

/**
 * Alles Weitere zum Aufklappen: Abschnitte mit Punkten, Vergleich und Beispiel, am Ende die Quelle.
 * @param {import("../../logic/erklaerungen.js").Erklaerung} e
 */
export function ausfuehrlich(e) {
  return `<div class="erklaerung">${e.abschnitte
    .map(
      (a) => `<section${a.achtung ? ' class="achtung"' : ""}><h4>${a.achtung ? ic("alert") : ""}${esc(a.titel)}</h4>
        ${a.punkte ? `<ul>${a.punkte.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        ${a.vergleich ? vergleichHTML(a.vergleich) : ""}
        ${a.beispiel ? `<p class="beispiel">${esc(a.beispiel)}</p>` : ""}
      </section>`,
    )
    .join("")}
    <p class="small muted">Zuletzt geprüft am ${esc(e.geprueft)} nach ${esc(e.quellen)}.</p>
  </div>`;
}
