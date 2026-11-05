// Kurzmeldungen (toast) und Kopieren in die Zwischenablage mit Rückmeldung.
import { tr } from "../i18n/sprachen.js";
import { Z } from "../state/zustand.js";
import { $ } from "./render.js";

/**
 * Kopiert Text in die Zwischenablage; geht das nicht, wird der Antragstext markiert und um Strg+C gebeten.
 * @param text Text
 */
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Text kopiert");
  } catch (e) {
    const ta = document.querySelector("textarea[data-tx]");
    if (ta) {
      ta.focus();
      ta.select();
    }
    toast("Bitte Text markieren und kopieren (Strg+C)");
  }
}

/**
 * Kurze Meldung unten am Bildschirm, verschwindet von selbst.
 * @param m Text
 */
export function toast(m) {
  const t = $("toast");
  t.textContent = tr(m);
  t.hidden = false;
  clearTimeout(Z.tT);
  Z.tT = setTimeout(() => (t.hidden = true), 2800);
}
