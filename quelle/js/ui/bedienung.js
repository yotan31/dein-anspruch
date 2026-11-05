// Bedienung: verbindet die Ereignisse des Browsers (Tippen, Eingaben, Tastatur, Ziehen von Dateien) mit den Aktionen.
// Jeder Knopf trägt data-act="…" (Tabellen in ui/aktionen/*.js) oder ein eigenes Attribut wie data-tab
// (ui/aktionen/attribute.js). Eine neue Aktion = ein neuer Eintrag in der passenden Tabelle, hier ändert sich nichts.
import { startPending } from "../services/belege.js";
import { Z } from "../state/zustand.js";
import { AKTIONEN_ANTRAG } from "./aktionen/antrag.js";
import { ATTRIBUT_AKTIONEN } from "./aktionen/attribute.js";
import { AKTIONEN_BELEGE } from "./aktionen/belege.js";
import { AKTIONEN_BESCHEID } from "./aktionen/bescheid.js";
import { AKTIONEN_DATEN } from "./aktionen/daten.js";
import { beiAenderung, beiEingabe } from "./aktionen/eingaben.js";
import { AKTIONEN_FRAGEBOGEN } from "./aktionen/fragebogen.js";
import { AKTIONEN_HILFE } from "./aktionen/hilfe.js";
import { AKTIONEN_KONTO } from "./aktionen/konto.js";
import { AKTIONEN_PERSONEN } from "./aktionen/personen.js";
import { AKTIONEN_RECHNER } from "./aktionen/rechner.js";
import { AKTIONEN_TERMINE } from "./aktionen/termine.js";
import { $, render } from "./render.js";

/** Alle data-act-Aktionen; jeder Name darf nur einmal vorkommen (wird beim Start geprüft). */
const AKTIONEN = vereinige([
  AKTIONEN_FRAGEBOGEN,
  AKTIONEN_ANTRAG,
  AKTIONEN_BELEGE,
  AKTIONEN_BESCHEID,
  AKTIONEN_RECHNER,
  AKTIONEN_KONTO,
  AKTIONEN_PERSONEN,
  AKTIONEN_DATEN,
  AKTIONEN_TERMINE,
  AKTIONEN_HILFE,
]);

/** Alle Elemente, die auf Tippen reagieren: data-act und die Attribute aus ATTRIBUT_AKTIONEN (dataset-Name → data-…) */
const ANTIPPBAR = [
  "[data-act]",
  ...ATTRIBUT_AKTIONEN.map(([k]) => `[data-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}]`),
].join(",");

/** Schritte und Downloads, die bei einem versehentlichen Doppeltippen nur einmal laufen sollen */
const NUR_EINMAL = new Set([
  "next",
  "back",
  "sent",
  "fb-send",
  "addown",
  "addbesuch",
  "entl-add",
  "manual",
  "mappe",
  "csv",
  "backup",
  "schnell",
  "au-guest",
]);
/** Zwei Tipper innerhalb dieser Zeit gelten als Doppeltippen (ms); ein bewusstes zweites Tippen dauert länger */
const DOPPELTIPPEN_MS = 350;
/** Bildschirmbreite, bis zu der die Tastatur-Hilfe greift (Handy) */
const HANDY_BREITE = 700;
/** Platz unter dem Eingabefeld für den festen „Weiter“-Knopf (px) */
const PLATZ_WEITER_KNOPF = 100;

/** @param {Record<string, Function>[]} tabellen */
function vereinige(tabellen) {
  const alle = {};
  for (const tabelle of tabellen)
    for (const [name, aktion] of Object.entries(tabelle)) {
      if (alle[name]) throw new Error(`Aktion „${name}“ ist doppelt vergeben`);
      alle[name] = aktion;
    }
  return alle;
}

/** @returns {boolean} true, wenn derselbe Knopf gerade eben schon getippt wurde @param {HTMLElement} t */
function istDoppeltippen(t) {
  const a = t.dataset.act;
  const einmal =
    t.dataset.wnav || t.dataset.pdf || t.dataset.copy || t.dataset.befpdf || (NUR_EINMAL.has(a || "") ? a : "");
  if (!einmal) return false;
  const jetzt = Date.now();
  if (Z.letzterKlick && Z.letzterKlick.k === einmal && jetzt - Z.letzterKlick.t < DOPPELTIPPEN_MS) return true;
  Z.letzterKlick = { k: einmal, t: jetzt };
  return false;
}

/** Fenster und Menü schließen, wenn daneben getippt wird. @returns {boolean} true, wenn der Tipp damit erledigt ist */
function schliesseBeiTippDaneben(ziel) {
  // Fenster von unten: Tippen auf den dunklen Hintergrund schließt sie
  if (ziel.classList && ziel.classList.contains("overlay")) {
    ziel.hidden = true;
    return true;
  }
  if (Z.showMenu && (!ziel.closest("#hmenu,[data-act=menu]") || ziel.closest(".menuenav a"))) {
    Z.showMenu = false;
    render();
  }
  if (Z.showSprache && !ziel.closest("#sprachwahl,[data-act=sprache]")) {
    Z.showSprache = false;
    render();
  }
  return false;
}

/** @param {MouseEvent} e */
function beiTippen(e) {
  const ziel = /** @type {HTMLElement} */ (e.target);
  if (schliesseBeiTippDaneben(ziel)) return;
  const t = /** @type {HTMLElement} */ (ziel.closest(ANTIPPBAR));
  if (!t || istDoppeltippen(t)) return;
  // jede Aktion außerhalb des Menüs schließt es (die Schriftgrößen-Knöpfe im Menü ausgenommen)
  if (t.dataset.act !== "menu" && !t.closest("#hmenu .fontsw")) Z.showMenu = false;
  for (const [schluessel, aktion, bedingung] of ATTRIBUT_AKTIONEN) {
    const wert = t.dataset[schluessel];
    if (bedingung ? bedingung(t, wert) : wert) return aktion(wert, t);
  }
  const name = t.dataset.act;
  if (name && AKTIONEN[name]) AKTIONEN[name](t, name);
}

/** Handy: Eingabefeld beim Öffnen der Tastatur in den sichtbaren Bereich holen (nicht unter dem „Weiter“-Knopf). @param {FocusEvent} e */
function beiFokus(e) {
  const el = /** @type {HTMLElement} */ (e.target);
  if (!el.matches || !el.matches("input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea")) return;
  if (innerWidth > HANDY_BREITE) return;
  // warten, bis die Tastatur ausgefahren ist
  setTimeout(() => {
    const vv = window.visualViewport,
      h = vv ? vv.height : innerHeight,
      r = el.getBoundingClientRect();
    if (document.activeElement === el && (r.bottom > h - PLATZ_WEITER_KNOPF || r.top < 60))
      try {
        el.scrollIntoView({ block: "center" });
      } catch (x) {}
  }, 350);
}

/** Aufklappbare Bereiche merken, damit sie beim Neuzeichnen (z. B. nach dem Abhaken) offen bleiben. @param {Event} e */
function beiAufklappen(e) {
  const d = /** @type {HTMLDetailsElement} */ (e.target);
  if (d && d.dataset && d.dataset.akk) Z.akk[d.dataset.akk] = d.open;
}

/** Tastatur: Escape schließt Fenster, Enter schickt Anmeldung bzw. nächste Frage ab. @param {KeyboardEvent} e */
function beiTaste(e) {
  const tg = /** @type {HTMLElement} */ (e.target);
  if (e.key === "Escape") {
    if (Z.showSprache || Z.showMenu) {
      Z.showSprache = Z.showMenu = false;
      render();
    }
    $("lightbox").hidden = true;
    for (const id of ["fbbox", "hilfebox", "infobox"]) {
      const o = $(id);
      if (o) o.hidden = true;
    }
  }
  if (e.key !== "Enter" || !tg.closest) return;
  const knopf =
    tg.closest(".auth") && tg.tagName === "INPUT"
      ? document.querySelector(".auth .btn.big")
      : Z.S.wiz && tg.matches(".wiz input")
        ? document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)')
        : null;
  if (!knopf) return;
  e.preventDefault();
  /** @type {HTMLElement} */ (knopf).click();
}

/** Beleg per Ziehen und Ablegen auf das Feld „#drop“ (nur mit Konto, weil nur dann Fotos gespeichert werden). */
function verbindeZiehenUndAblegen() {
  const feld = (e) => {
    const tg = /** @type {HTMLElement} */ (e.target);
    return tg.closest && tg.closest("#drop");
  };
  document.addEventListener("dragover", (e) => {
    const d = feld(e);
    if (!d || !Z.ASSETS) return;
    e.preventDefault();
    d.classList.add("over");
  });
  document.addEventListener("dragleave", (e) => {
    const d = feld(e);
    if (d) d.classList.remove("over");
  });
  document.addEventListener("drop", (e) => {
    const d = feld(e);
    if (!d || !Z.ASSETS) return;
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) startPending(f);
  });
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function verbindeBedienung() {
  document.addEventListener("click", beiTippen);
  document.addEventListener("change", beiAenderung);
  document.addEventListener("input", beiEingabe);
  document.addEventListener("focusin", beiFokus);
  document.addEventListener("toggle", beiAufklappen, true); // toggle steigt nicht auf, daher in der Erfassungsphase
  document.addEventListener("keydown", beiTaste);
  verbindeZiehenUndAblegen();
  $("lbclose").onclick = () => ($("lightbox").hidden = true);
  $("lightbox").onclick = (e) => {
    if (/** @type {HTMLElement} */ (e.target).id === "lightbox") $("lightbox").hidden = true;
  };
}
