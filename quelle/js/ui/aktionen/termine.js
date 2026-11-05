// Aktionen „Termine“: Beratungsbesuch eintragen, eigene Erinnerungen, E-Mail-Erinnerungen.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { pdText } from "../../logic/antragstext.js";
import { setEri } from "../../services/erinnerungen.js";
import { save } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { parseIso } from "../../utils/datum.js";
import { copy, toast } from "../hinweise.js";
import { $, render } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_TERMINE = {
  "eri-on": (t) => {
    setEri(true, ($("eri-mail") || {}).value);
  },
  "eri-off": (t) => {
    setEri(false);
  },
  addbesuch: (t) => {
    const v = $("tbesuch").value;
    if (!parseIso(v)) {
      toast("Bitte ein Datum wählen");
      return;
    }
    Z.S.termine.besuche = [...(Z.S.termine.besuche || []), { d: v }];
    save();
    render();
    toast("Besuch eingetragen");
  },
  copypd: (t) => {
    copy(pdText());
  },
  addown: (t) => {
    const tt = $("ownt").value.trim(),
      d = $("ownd").value;
    if (!tt || !parseIso(d)) {
      toast("Bitte Text und Datum angeben");
      return;
    }
    Z.S.termine.eigene = [...(Z.S.termine.eigene || []), { id: String(Date.now()), t: tt, d }];
    save();
    render();
    toast("Erinnerung hinzugefügt");
  },
};
