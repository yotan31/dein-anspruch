// Aktionen „Deine Daten“: Sicherung herunterladen und einspielen, alles löschen.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { backupData, wipeAll } from "../../services/sicherung.js";
import { Z } from "../../state/zustand.js";
import { $, render } from "../render.js";

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
  },
  restore: (t) => {
    const f = $("fileJson");
    if (f) {
      f.value = "";
      f.click();
    }
  },
};
