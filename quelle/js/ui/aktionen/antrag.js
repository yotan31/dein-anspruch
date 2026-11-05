// Aktionen „Antrag“: Antrag als abgeschickt markieren, E-Mail öffnen, Quittung für die Verhinderungspflege.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { B } from "../../logic/leistungen.js";
import { makeQuittung } from "../../services/dokumente.js";
import { save } from "../../services/speicher.js";
import { zaehle } from "../../services/zaehlung.js";
import { Z } from "../../state/zustand.js";
import { TODAY, addDays, isoD } from "../../utils/datum.js";
import { toast } from "../hinweise.js";
import { render } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_ANTRAG = {
  sent: (t) => {
    const k = t.dataset.k;
    zaehle("antrag_abgeschickt", k);
    Z.S.status[k] = "beantragt";
    Z.S.sent = Z.S.sent || {};
    Z.S.sent[k] = isoD(TODAY());
    const bb = B.find((x) => x.k === k);
    Z.S.termine.eigene = [
      ...(Z.S.termine.eigene || []),
      {
        id: String(Date.now()),
        t: `Antwort auf Antrag „${bb ? bb.t : k}“ da?`,
        d: isoD(addDays(TODAY(), 28)),
        n: "Falls noch keine Antwort da ist: bei der Kasse nachfragen. Das Datum des Antrags steht in der App.",
      },
    ];
    save();
    render();
    toast("Super! Wir erinnern dich in 4 Wochen.");
  },
  "vhp-quittung": (t) => {
    makeQuittung();
  },
  "mail-offen": (t) => {
    zaehle("antrag_fertig", t.dataset.k || "");
  },
};
