// Aktionen „Hilfe und Menü“: Menü, Hilfe-Fenster, Feedback, Weiterempfehlen, Installation.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { sendFeedback, shareApp } from "../../services/feedback.js";
import { installWeg, installieren } from "../../services/installieren.js";
import { Z } from "../../state/zustand.js";
import { closeFeedback, openFeedback } from "../components/feedback-fenster.js";
import { closeHilfe, closeInfo, openHilfe } from "../components/fenster.js";
import { render } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_HILFE = {
  menu: (t) => {
    Z.showMenu = !Z.showMenu;
    render();
  },
  "inst-ja": (t) => {
    installieren();
  },
  "inst-weg": (t) => {
    installWeg();
  },
  "hilfe-open": (t) => {
    Z.showMenu = false;
    render();
    openHilfe();
  },
  "hilfe-close": (t) => {
    closeHilfe();
  },
  "info-close": (t) => {
    closeInfo();
  },
  "fb-open": (t) => {
    closeHilfe();
    openFeedback();
  },
  "fb-close": (t) => {
    closeFeedback();
  },
  "fb-send": (t) => {
    sendFeedback();
  },
  teilen: (t) => {
    shareApp();
  },
};
