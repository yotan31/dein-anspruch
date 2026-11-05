// Aktionen „Bescheid“: Pflegegrad-Bescheid fotografieren, abtippen, prüfen und speichern.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { pg } from "../../logic/lage.js";
import { saveBescheid } from "../../services/bescheid.js";
import { Z } from "../../state/zustand.js";
import { $, render } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_BESCHEID = {
  "bes-cam": (t) => {
    Z.fileTarget = "bescheid";
    $("fileCam").value = "";
    $("fileCam").click();
  },
  "bes-manual": (t, name) => AKTIONEN_BESCHEID["bes-edit"](t, name),
  "bes-edit": (t) => {
    Z.bescheidDraft = { ...(Z.S.bescheid || {}), pg: (Z.S.bescheid && Z.S.bescheid.pg) || String(pg() || "") };
    Z.ocrMsg = "";
    render();
  },
  "bes-cancel": (t) => {
    Z.bescheidDraft = null;
    Z.ocrMsg = "";
    render();
  },
  "bes-save": (t) => {
    saveBescheid();
  },
};
