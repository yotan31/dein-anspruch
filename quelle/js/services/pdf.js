// Grundlage aller PDFs: lädt jsPDF erst beim ersten Dokument und speichert Dateien zum Herunterladen.
import { DL } from "./speicher.js";
import { toast } from "../ui/hinweise.js";

/* ---------- PDF ---------- */
/** Adresse der PDF-Bibliothek; kommt aus quelle/bauen.mjs, damit die Version nur an einer Stelle steht */
const JSPDF_URL = "__JSPDF_URL__";

/** @type {Promise<boolean>|null} */
let jsPdfWirdGeladen = null;

/**
 * Lädt jsPDF (420 KB) erst beim ersten PDF, statt bei jedem Start der App.
 * @returns {Promise<boolean>} true, wenn die Bibliothek bereitsteht
 */
export function ladeJsPdf() {
  if (window.jspdf) return Promise.resolve(true);
  jsPdfWirdGeladen ??= new Promise((fertig) => {
    const skript = document.createElement("script");
    skript.src = JSPDF_URL;
    skript.onload = () => fertig(true);
    // bei Fehler (z. B. ohne Internet und noch nicht gespeichert) beim nächsten Versuch neu laden
    skript.onerror = () => {
      jsPdfWirdGeladen = null;
      fertig(false);
    };
    document.head.append(skript);
  });
  return jsPdfWirdGeladen;
}

/** Neues A4-Dokument; meldet verständlich, wenn die PDF-Erzeugung nicht geladen werden konnte. @returns {Promise<any>} */
export async function newDoc() {
  if (!(await ladeJsPdf())) {
    toast("PDF-Erzeugung konnte nicht geladen werden. Bitte Internet prüfen oder Text kopieren.");
    return null;
  }
  return new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
}

/**
 * Speichert eine Datei zum Herunterladen und meldet den Erfolg.
 * @param filename Dateiname
 * @param data Inhalt
 * @param okMsg Meldung danach
 */
export async function saveFile(filename, data, okMsg) {
  const dl = DL; // Datei-Download im Browser (siehe services/speicher.js)
  try {
    await dl.save({ filename, data });
    toast(okMsg || "Gespeichert");
  } catch (e) {
    if (e && e.code === "declined") return;
    toast(e && e.code === "rate_limited" ? "Bitte kurz warten und erneut versuchen." : "Download nicht möglich.");
  }
}
