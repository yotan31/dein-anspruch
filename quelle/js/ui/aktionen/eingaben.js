// Eingaben in Formularfeldern: „change“ (Auswahl getroffen, Feld verlassen) und „input“ (jeder Tastendruck).
// Aufgerufen von ui/bedienung.js. Jede Eingabe landet im Zustand (Z.S bzw. Z.pending, Z.bulk …) und wird gespeichert;
// neu gezeichnet wird nur, wenn sich dadurch etwas Sichtbares ändert (bei Tastendrücken nie, damit nichts flackert).
import { getQ, setQ, wizSteps, wizTo } from "../../logic/antraege.js";
import { empfAdresse } from "../../logic/leistungen.js";
import { startPending } from "../../services/belege.js";
import { scanBescheid } from "../../services/bescheid.js";
import { importPdf } from "../../services/pdf-import.js";
import { restoreData } from "../../services/sicherung.js";
import { openFall, save } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { render, scrollTop } from "../render.js";

/** Kurze Pause, damit die Auswahl sichtbar ist, bevor der Rechner bzw. Assistent zur nächsten Frage springt (ms) */
const RECHNER_WEITER_NACH = 180;
const ASSISTENT_WEITER_NACH = 200;

/**
 * Fragebogen: Feldname (name="…" bzw. id="…") → wohin die Antwort gehört.
 * @type {Record<string, (t: HTMLInputElement) => void>}
 */
const FRAGEBOGEN_FELDER = {
  rolle: (t) => (Z.S.rolle = t.value),
  kindAlter: (t) => (Z.S.kindAlter = t.value),
  bereich: (t) => (Z.S.bereiche[t.value] = t.checked),
  kasse: (t) => (Z.S.kasse = t.value),
  aokRegion: (t) => (Z.S.aokRegion = t.value),
  pg: (t) => (Z.S.pg = t.value),
  wohnen: (t) => (Z.S.wohnen = t.value),
  stunden10: (t) => (Z.S.pp.stunden10 = t.value),
  arbeit: (t) => (Z.S.pp.arbeit = t.value),
  sbstatus: (t) => (Z.S.sb.status = t.value),
  gdb: (t) => (Z.S.sb.gdb = t.value),
  mz: (t) => (Z.S.sb.mz[t.value] = t.checked),
  sbx: (t) => (Z.S.sb[t.value] = t.checked),
  genutzt: (t) => (Z.S.genutzt[t.value] = t.checked),
  chron: (t) => (Z.S.chronisch = t.value),
  twm: (t) => (Z.S.termine.wertmarke = t.value),
};

/**
 * Felder mit data-Attribut (wie in t.dataset) → wohin der Wert gehört; danach wird gespeichert und neu gezeichnet.
 * @type {Record<string, (t: HTMLInputElement, wert: string) => void>}
 */
const DATEN_FELDER = {
  status: (t, k) => (Z.S.status[k] = t.value),
  abl: (t, k) => (Z.S.ablehnung[k] = { ...(Z.S.ablehnung[k] || {}), datum: t.value }),
  gen: (t, k) => {
    Z.S.genutzt[k] = t.checked;
    Z.openKey = null;
  },
  brutto: (t, jahr) => (Z.S.bruttoJahr = { ...(Z.S.bruttoJahr || {}), [jahr]: t.value }),
  vhp: (t, feld) => {
    Z.S.vhp[feld] = t.value;
    // geänderte Angaben: selbst bearbeiteten Antragstext verwerfen, damit der neue Betrag drinsteht
    delete Z.S.texte.jahresbetrag;
    delete Z.S.texte.jahresbetrag_sub;
  },
};

/** Frage des Assistenten zum Feld. @param {string} k */
const frage = (k) => wizSteps().list.find((x) => x.k === k);

/** Erste ausgewählte Datei eines Datei-Felds. @param {HTMLInputElement} t */
const ersteDatei = (t) => t.files && t.files[0];

/** Datei aus Kamera oder Dateiauswahl: Bescheid, Sammel-PDF oder einzelner Beleg. @param {File} f */
function verarbeiteDatei(f) {
  if (Z.fileTarget === "bescheid") {
    Z.fileTarget = null;
    scanBescheid(f);
  } else if (!Z.pending && (f.type === "application/pdf" || /\.pdf$/i.test(f.name || ""))) importPdf(f);
  else startPending(f);
}

/** Auswahl im Assistenten: bei Einfachauswahl nach kurzer Pause automatisch weiter. @param {HTMLInputElement} t */
function assistentAuswahl(t) {
  const q = frage(t.dataset.wq);
  if (!q) return;
  setQ(q, t.value);
  save();
  render();
  if (t.type !== "radio") return;
  const k = Z.S.wiz.k,
    i = Z.S.wiz.i;
  setTimeout(() => {
    // nur weiter, wenn die Person inzwischen nicht selbst weitergetippt hat
    if (Z.S.wiz && Z.S.wiz.k === k && Z.S.wiz.i === i) {
      const nx = /** @type {HTMLElement} */ (document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'));
      nx && nx.click();
    }
  }, ASSISTENT_WEITER_NACH);
}

/** Antwort im Pflegegrad-Rechner, danach automatisch zur nächsten Frage. @param {HTMLInputElement} t */
function rechnerAntwort(t) {
  Z.RECHNER.a[Z.RECHNER.i] = t.dataset.rq;
  render();
  setTimeout(() => {
    if (Z.RECHNER && Z.RECHNER.a[Z.RECHNER.i] != null) {
      Z.RECHNER.i++;
      render();
      scrollTop();
    }
  }, RECHNER_WEITER_NACH);
}

/**
 * „change“: Auswahl getroffen oder Feld verlassen.
 * @param {Event} e
 */
export function beiAenderung(e) {
  const t = /** @type {HTMLInputElement} */ (e.target);
  if (t.dataset.plz) {
    // erst bei vollständiger Postleitzahl, sonst würde jede Ziffer die Links neu aufbauen
    if (/^\d{5}$/.test(t.value.trim())) {
      Z.S.plz = t.value.trim();
      save();
      render();
    }
    return;
  }
  if (t.dataset.rq != null && Z.RECHNER) return rechnerAntwort(t);
  if (t.id === "fileJson") {
    const f = ersteDatei(t);
    if (f) restoreData(f);
    return;
  }
  if (t.id === "fileCam" || t.id === "fileAny") {
    const f = ersteDatei(t);
    if (f) verarbeiteDatei(f);
    return;
  }
  if (t.dataset.bd && Z.bescheidDraft) {
    Z.bescheidDraft[t.dataset.bd] = t.value;
    return;
  }
  if (t.dataset.bi && Z.bulk && Z.bulk.items) {
    const [i, f] = t.dataset.bi.split(":");
    const it = Z.bulk.items[+i];
    if (it) {
      it[f] = t.type === "checkbox" ? t.checked : t.value;
      render();
    }
    return;
  }
  if (t.dataset.fall) {
    openFall(t.dataset.fall);
    scrollTop();
    return;
  }
  if (t.id === "entl-seit") {
    Z.S.entlSeit = t.value;
    save();
    render();
    return;
  }
  if (t.dataset.wq && (t.type === "radio" || t.type === "date")) return assistentAuswahl(t);
  if (t.dataset.wqm) {
    const q = frage(t.dataset.wqm);
    if (q) {
      const cur = Array.isArray(getQ(q)) ? getQ(q) : [];
      setQ(q, t.checked ? [...cur, t.value] : cur.filter((x) => x !== t.value));
      save();
      render();
    }
    return;
  }
  if (t.dataset.pend) {
    Z.pending[t.dataset.pend] = t.value;
    if (t.type === "radio") render();
    return;
  }
  if (t.dataset.check) {
    Z.S.checks[t.dataset.check] = t.checked;
    save();
    render(); // neu zeichnen, damit der Zähler „x von y erledigt“ stimmt
    return;
  }
  const feld = FRAGEBOGEN_FELDER[t.name] || FRAGEBOGEN_FELDER[t.id];
  const datenSchluessel = Object.keys(DATEN_FELDER).find((k) => t.dataset[k]);
  if (feld) feld(t);
  else if (datenSchluessel) DATEN_FELDER[datenSchluessel](t, t.dataset[datenSchluessel]);
  else return;
  save();
  render();
}

/**
 * Tastendrücke: Wert merken und speichern, ohne neu zu zeichnen (sonst springt der Cursor).
 * @type {Record<string, (t: HTMLInputElement, wert: string) => void>}
 */
const TEXT_FELDER = {
  p: (t, k) => (Z.S.person[k] = t.value),
  tx: (t, k) => (Z.S.texte[k] = t.value),
  sub: (t, k) => (Z.S.texte[k + "_sub"] = t.value),
};

/** „Weiß ich nicht“ ausblenden, sobald etwas eingetragen ist. @param {boolean} ausgefuellt */
function blendeUeberspringenAus(ausgefuellt) {
  const sk = /** @type {HTMLElement} */ (document.querySelector('.wiz [data-wnav="next"].ghost'));
  if (sk) sk.hidden = ausgefuellt;
}

/**
 * „input“: jeder Tastendruck in einem Textfeld.
 * @param {Event} e
 */
export function beiEingabe(e) {
  const t = /** @type {HTMLInputElement} */ (e.target);
  if (t.dataset.wq && t.type !== "radio" && t.type !== "date") {
    const q = frage(t.dataset.wq);
    if (q) {
      setQ(q, t.value);
      save();
      blendeUeberspringenAus(!!t.value.trim());
    }
    return;
  }
  if (t.dataset.bd && Z.bescheidDraft) {
    Z.bescheidDraft[t.dataset.bd] = t.value;
    return;
  }
  if (t.dataset.bi && Z.bulk && Z.bulk.items && t.type !== "checkbox") {
    const [i, f] = t.dataset.bi.split(":");
    const it = Z.bulk.items[+i];
    if (it) it[f] = t.value;
    return;
  }
  if (t.dataset.wqp) {
    Z.S.person[t.dataset.wqp] = t.value;
    save();
    return;
  }
  if (t.dataset.wqe) {
    empfAdresse(wizTo())[t.dataset.wqe] = t.value;
    save();
    blendeUeberspringenAus(!!empfAdresse(wizTo()).ort.trim());
    return;
  }
  if (t.dataset.pend) {
    Z.pending[t.dataset.pend] = t.value; // Beleg wird erst mit „Speichern“ übernommen
    return;
  }
  const schluessel = Object.keys(TEXT_FELDER).find((k) => t.dataset[k]);
  if (schluessel) TEXT_FELDER[schluessel](t, t.dataset[schluessel]);
  else if (t.id === "kasseAndere") Z.S.kasseAndere = t.value;
  else if (t.dataset.vhp && t.type !== "radio") Z.S.vhp[t.dataset.vhp] = t.value;
  else if (t.id === "tdienst") Z.S.termine.dienst = t.value;
  else if (t.id === "ttel") Z.S.termine.tel = t.value;
  else return;
  save();
}
