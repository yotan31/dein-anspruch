// Aktionen „Fragebogen“: Weiter, Zurück, Angaben ändern und Antworten zurücksetzen.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { pruefeAngabe } from "../../logic/antraege.js";
import { visSteps } from "../../logic/fragebogen.js";
import { applicable } from "../../logic/leistungen.js";
import { save } from "../../services/speicher.js";
import { zaehle } from "../../services/zaehlung.js";
import { blank } from "../../state/angaben.js";
import { Z } from "../../state/zustand.js";
import { startWiz } from "../pages/assistent.js";
import { $, render, scrollTop } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_FRAGEBOGEN = {
  next: (t) => {
    if (t.dataset.ok === "0") {
      const w = $("navwarn");
      if (w) {
        w.hidden = false;
        w.scrollIntoView({ block: "center" });
      }
      return;
    }
    {
      // Versichertennummer im Fragebogen: einmal freundlich auf einen möglichen Tippfehler hinweisen
      const vs0 = visSteps(),
        vnr = Z.S.person.vnr || "",
        msg = vs0[Z.S.step] && vs0[Z.S.step].id === "daten" ? pruefeAngabe({ k: "vnr" }, vnr) : "";
      if (msg && Z.warnKey !== "q|" + vnr) {
        Z.warnKey = "q|" + vnr;
        const w = $("navwarn");
        if (w) {
          w.querySelector("span").textContent = msg + " Stimmt es trotzdem? Dann noch einmal tippen.";
          w.hidden = false;
          w.scrollIntoView({ block: "center" });
        }
        return;
      }
    }
    if (Z.S.step === 0) zaehle("fragebogen_begonnen");
    const vs = visSteps();
    if (Z.S.step >= vs.length - 1) {
      Z.S.done = true;
      Z.S.tab = "ansprueche";
      zaehle("fragebogen_fertig");
      // Über eine Schnellstart-Kachel gekommen: direkt den gewählten Antrag öffnen, wenn er zur Lage passt
      const ziel = Z.S.ziel;
      Z.S.ziel = "";
      if (ziel && applicable().some((b) => b.k === ziel && b.ask)) {
        Z.openKey = ziel;
        startWiz(ziel);
        return;
      }
    } else Z.S.step++;
    save();
    render();
    scrollTop();
  },
  back: (t) => {
    Z.S.step = Math.max(0, Z.S.step - 1);
    save();
    render();
    scrollTop();
  },
  edit: (t) => {
    Z.showMenu = false;
    Z.S.done = false;
    Z.S.step = 0;
    save();
    render();
    scrollTop();
  },
  reset: (t) => {
    $("resetconfirm").hidden = false;
  },
  "welcome-ok": (t) => {
    Z.S.welcomeSeen = true;
    save();
    render();
  },
  "reset-no": (t) => {
    $("resetconfirm").hidden = true;
  },
  "reset-yes": (t) => {
    Z.S = blank();
    Z.openKey = null;
    save();
    render();
    scrollTop();
  },
};
