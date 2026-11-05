// Aktionen „Pflegegrad-Rechner“: Fragen vor und zurück, Ergebnis, weiter zum Antrag oder Konto.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { pg } from "../../logic/lage.js";
import { Z } from "../../state/zustand.js";
import { startWiz } from "../pages/assistent.js";
import { startRechner } from "../pages/rechner.js";
import { render, scrollTop } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_RECHNER = {
  "r-start": (t) => {
    startRechner();
  },
  "r-next": (t) => {
    Z.RECHNER.i++;
    render();
    scrollTop();
  },
  "r-back": (t) => {
    Z.RECHNER.i = Math.max(0, Z.RECHNER.i - 1);
    render();
    scrollTop();
  },
  "r-close": (t) => {
    Z.RECHNER = null;
    render();
    scrollTop();
  },
  "r-neu": (t) => {
    startRechner();
  },
  "r-antrag": (t) => {
    const k = pg() ? "pg_hoch" : "pg_antrag";
    Z.RECHNER = null;
    Z.S.bereiche.pflege = true;
    if (!Z.S.done) {
      Z.S.done = true;
    }
    startWiz(k);
  },
  "r-konto": (t) => {
    Z.RECHNER = null;
    if (typeof Z.authMode !== "undefined") {
      Z.authMode = "register";
      Z.authMsg = "Lege ein kostenloses Konto an. Danach hilft dir die App Schritt für Schritt beim Antrag.";
    }
    render();
    scrollTop();
  },
};
