// Knopf für die Vollmacht-Vorlage: erscheint überall, wo eine Vollmacht zu den Unterlagen eines Antrags gehört.
import { ic } from "../symbole.js";

/**
 * Knopf „Vollmacht-Vorlage (PDF)“ oder nichts, wenn keine Vollmacht verlangt ist.
 * @param {string[]} unterlagen Liste der Unterlagen eines Antrags
 */
export function vollmachtKnopf(unterlagen) {
  return unterlagen.some((x) => /Vollmacht/.test(x))
    ? `<button class="btn small soft mt-8" type="button" data-act="vollmacht">${ic("down")}Vollmacht-Vorlage (PDF)</button>`
    : "";
}
