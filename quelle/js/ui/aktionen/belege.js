// Aktionen „Belege“: Foto, Datei oder Eintrag ohne Foto, Sammel-PDF, Belegmappe und Tabelle.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { saveBeleg, startPending } from "../../services/belege.js";
import { makeCSV, makeMappe } from "../../services/dokumente.js";
import { bulkSave } from "../../services/pdf-import.js";
import { Z } from "../../state/zustand.js";
import { $, render, scrollTop } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_BELEGE = {
  dropphoto: (t) => {
    if (Z.pending) {
      if (Z.pending.preview && Z.pending.preview.startsWith("blob:")) URL.revokeObjectURL(Z.pending.preview);
      Z.pending.file = null;
      Z.pending.preview = "";
      if (Z.pending.keepAsset) Z.pending.dropAsset = true;
      render();
    }
  },
  "entl-add": (t) => {
    Z.S.tab = "belege";
    Z.pending = null;
    startPending(null);
    if (Z.pending) {
      Z.pending.kat = "entl";
      render();
    }
    scrollTop();
  },
  cam: (t) => {
    $("fileCam").value = "";
    $("fileCam").click();
  },
  pick: (t) => {
    $("fileAny").value = "";
    $("fileAny").click();
  },
  manual: (t) => {
    startPending(null);
  },
  cancelbeleg: (t) => {
    if (Z.pending && Z.pending.preview && Z.pending.preview.startsWith("blob:")) URL.revokeObjectURL(Z.pending.preview);
    Z.pending = null;
    render();
  },
  savebeleg: (t) => {
    saveBeleg();
  },
  "bulk-save": (t) => {
    bulkSave();
  },
  "bulk-cancel": (t) => {
    Z.bulk = null;
    render();
  },
  "bulk-single": (t) => {
    const f = Z.bulk && Z.bulk.file;
    Z.bulk = null;
    startPending(f);
  },
  mappe: (t) => {
    makeMappe(false, false);
  },
  csv: (t) => {
    makeCSV();
  },
};
