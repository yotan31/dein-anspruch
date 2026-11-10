// Aktionen „Antrag“: abgeschickt markieren, E-Mail öffnen, Quittung, Vollmacht, Nachfragen und Widerspruch.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { B } from "../../logic/leistungen.js";
import { nachfrageBrief, widerspruchBrief } from "../../logic/folgebriefe.js";
import { makeBrief, makeQuittung, makeVollmacht } from "../../services/dokumente.js";
import { save } from "../../services/speicher.js";
import { zaehle } from "../../services/zaehlung.js";
import { Z } from "../../state/zustand.js";
import { TODAY, addDays, isoD } from "../../utils/datum.js";
import { copy, toast } from "../hinweise.js";
import { render } from "../render.js";

/** Leistung zum angetippten Knopf (data-k). @param {HTMLElement} t */
const leistung = (t) => B.find((x) => x.k === t.dataset.k);

/** Betreff und Text eines Briefs in die Zwischenablage. @param {{subject: string, body: string}} L */
const kopiere = (L) => copy(`Betreff: ${L.subject}\n\n${L.body}`);

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
  vollmacht: () => {
    makeVollmacht();
  },
  "nachfrage-pdf": (t) => {
    const b = leistung(t);
    if (b) makeBrief(b, nachfrageBrief(b), `Nachfrage-${b.k}.pdf`);
  },
  "nachfrage-copy": (t) => {
    const b = leistung(t);
    if (b) kopiere(nachfrageBrief(b));
  },
  "wid-pdf": (t) => {
    const b = leistung(t);
    if (b) makeBrief(b, widerspruchBrief(b), `Widerspruch-${b.k}.pdf`, ["Kopie des Bescheids"]);
  },
  "wid-copy": (t) => {
    const b = leistung(t);
    if (b) kopiere(widerspruchBrief(b));
  },
  "wid-sent": (t) => {
    const k = t.dataset.k;
    Z.S.status[k] = "widerspruch";
    Z.S.ablehnung[k] = { ...(Z.S.ablehnung[k] || {}), widerspruch: isoD(TODAY()) };
    save();
    render();
    toast("Notiert. Die Frist ist damit gewahrt.");
  },
  "mail-offen": (t) => {
    zaehle("antrag_fertig", t.dataset.k || "");
  },
};
