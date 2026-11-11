// Aktionen „Pflegegrad-Rechner“: Fragen vor und zurück, Ergebnis, weiter zum Antrag oder Konto.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { pg } from "../../logic/lage.js";
import { RQ } from "../../logic/rechner.js";
import { makeGutachterBlatt } from "../../services/dokumente.js";
import { save } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { startWiz } from "../pages/assistent.js";
import { startRechner } from "../pages/rechner.js";
import { render, scrollTop } from "../render.js";

/** Fertige Antworten merken, damit das Vorbereitungsblatt für den Gutachter sie später noch kennt */
function merkeAntworten() {
  if (Z.RECHNER && Z.RECHNER.i >= RQ.length) {
    Z.S.rechner = [...Z.RECHNER.a];
    save();
  }
}

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_RECHNER = {
  "gutachter-pdf": () => {
    merkeAntworten();
    makeGutachterBlatt(Z.RECHNER && Z.RECHNER.i >= RQ.length ? Z.RECHNER.a : Z.S.rechner);
  },
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
    merkeAntworten();
    Z.RECHNER = null;
    render();
    scrollTop();
  },
  "r-neu": (t) => {
    startRechner();
  },
  "r-antrag": (t) => {
    const k = pg() ? "pg_hoch" : "pg_antrag";
    merkeAntworten();
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
