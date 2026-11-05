// Bescheid fotografieren und lesen: lädt die Texterkennung (Tesseract) erst bei Bedarf und speichert das Ergebnis.
import { parseBescheid } from "../logic/bescheid.js";
import { pg } from "../logic/lage.js";
import { prepareFile } from "./belege.js";
import { save } from "./speicher.js";
import { Z } from "../state/zustand.js";
import { toast } from "../ui/hinweise.js";
import { render } from "../ui/render.js";
import { TODAY, isoD, parseIso } from "../utils/datum.js";

/** Lädt die Texterkennung beim ersten Bedarf; sie ist groß und wird sonst nicht gebraucht. */
export async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
    s.integrity = "sha256-qOKZGNCYsrBuEBK9rv+0rsBEXF1WVHCQI+C9H0QqgOg=";
    s.crossOrigin = "anonymous";
    s.onload = () => res(window.Tesseract);
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

/**
 * Liest den Text eines fotografierten Bescheids und füllt das Formular zum Prüfen vor.
 * @param file Foto
 */
export async function scanBescheid(file) {
  if (!file) return;
  Z.bescheidDraft = { ...(Z.S.bescheid || {}), pg: Z.S.bescheid?.pg || String(pg() || ""), file };
  Z.ocrBusy = true;
  Z.ocrMsg = "Das Dokument wird gelesen. Das dauert beim ersten Mal etwa 20 bis 40 Sekunden …";
  render();
  try {
    const T = await loadTesseract();
    const { data } = await T.recognize(file, "deu");
    const r = parseBescheid(data.text || "");
    Object.assign(
      Z.bescheidDraft,
      Object.fromEntries(Object.entries(r).filter(([k, v]) => v && (!Array.isArray(v) || v.length))),
    );
    Z.ocrMsg =
      r.pg || r.punkte
        ? "Das haben wir erkannt. Bitte prüfen und bei Bedarf korrigieren."
        : "Wir konnten nicht alles sicher lesen. Bitte die Angaben vom Bescheid abtippen.";
  } catch (e) {
    Z.ocrMsg = "Lesen hat nicht geklappt. Bitte die Angaben einfach abtippen.";
  }
  Z.ocrBusy = false;
  render();
}

/** Übernimmt den geprüften Bescheid in die Angaben. */
export async function saveBescheid() {
  const d = Z.bescheidDraft;
  if (!d) return;
  const file = d.file;
  delete d.file;
  Z.S.bescheid = {
    pg: String(d.pg || ""),
    punkte: d.punkte || "",
    datum: d.datum || "",
    eingang: d.eingang || isoD(TODAY()),
    art: d.art || "",
    hinweise: d.hinweise || [],
  };
  if (Number(Z.S.bescheid.pg) > 0) Z.S.pg = Z.S.bescheid.pg;
  Z.bescheidDraft = null;
  Z.ocrMsg = "";
  delete Z.S.texte.widerspruch;
  delete Z.S.texte.widerspruch_sub;
  save();
  render();
  toast("Bescheid gespeichert");
  if (file && Z.ASSETS && Z.BCOL) {
    try {
      const { blob, type } = await prepareFile(file);
      const up = await Z.ASSETS.upload(blob, { type });
      await Z.BCOL.add({
        kat: "bescheid",
        datum: Z.S.bescheid.datum || isoD(TODAY()),
        jahr: (parseIso(Z.S.bescheid.datum) || TODAY()).getFullYear(),
        betrag: "",
        titel: "Pflegegrad-Bescheid",
        asset: up.id,
        ctype: up.contentType,
        eingereicht: false,
        created: new Date().toISOString(),
      });
    } catch (e) {}
  }
}
