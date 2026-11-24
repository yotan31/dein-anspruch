// Aktionen „Deine Daten“: Sicherung herunterladen und einspielen, alles löschen.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { backupData, wipeAll } from "../../services/sicherung.js";
import { save } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { $, render } from "../render.js";
import { TODAY, isoD } from "../../utils/datum.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_DATEN = {
  wipe: (t) => {
    Z.wipeAsk = true;
    render();
    {
      const w = $("wipe-word");
      if (w)
        try {
          w.focus({ preventScroll: true });
        } catch (e) {}
    }
  },
  "wipe-no": (t) => {
    Z.wipeAsk = false;
    render();
  },
  "wipe-yes": (t) => {
    wipeAll();
  },
  backup: (t) => {
    backupData();
    if (!Z.S.sicherungHinweis) {
      Z.S.sicherungHinweis = isoD(TODAY());
      save();
      render();
    }
  },
  "sicherung-weg": (t) => {
    Z.S.sicherungHinweis = isoD(TODAY());
    save();
    render();
  },
  restore: (t) => {
    const f = $("fileJson");
    if (f) {
      f.value = "";
      f.click();
    }
  },
};
