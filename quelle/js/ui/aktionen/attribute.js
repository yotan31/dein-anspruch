// Aktionen über eigene data-Attribute (z. B. data-tab="belege", data-open="entlastung"), statt über data-act.
// Die Reihenfolge der Liste ist die Prüfreihenfolge: Trägt ein Element mehrere Attribute, gewinnt das erste.
// Aufgerufen von ui/bedienung.js; jede Funktion bekommt den Wert des Attributs und das angetippte Element t.
import { waehleSprache } from "../../i18n/sprachen.js";
import { getQ, pruefeAngabe, wizSteps } from "../../logic/antraege.js";
import { curLetter } from "../../logic/antragstext.js";
import { selYears } from "../../logic/belege.js";
import { B } from "../../logic/leistungen.js";
import { deleteBeleg, editBeleg, toggleSubmitted } from "../../services/belege.js";
import { makeMappe, makePDF } from "../../services/dokumente.js";
import { lsSet } from "../../services/lokal.js";
import { blobUrl, removeMember, save } from "../../services/speicher.js";
import { zaehle } from "../../services/zaehlung.js";
import { Z } from "../../state/zustand.js";
import { openFeedback } from "../components/feedback-fenster.js";
import { openInfo } from "../components/fenster.js";
import { copy, toast } from "../hinweise.js";
import { startWiz } from "../pages/assistent.js";
import { $, render, reveal, scrollTop } from "../render.js";

/** Wird an den Hinweis von pruefeAngabe() angehängt: Ein zweites „Weiter“ übernimmt die Angabe trotzdem. */
const HINWEIS_ZWEITES_WEITER = " Stimmt es trotzdem? Dann noch einmal auf „Weiter“ tippen.";

/** Leistung in der Liste öffnen und hinscrollen (der Reiter bleibt, wie er ist). @param {string} k */
function zeigeLeistung(k) {
  Z.openKey = k;
  render();
  const el = $("it-" + k);
  el && el.scrollIntoView({ block: "start" });
}

/** Text eines Antrags in die Zwischenablage. @param {any} b Leistung */
function kopiereAntrag(b) {
  const L = curLetter(b);
  copy(`Betreff: ${L.subject}\n\n${L.body}`);
}

/** Zeigt einen Hinweis zur aktuellen Antwort im Assistenten. @returns {boolean} true, wenn der Schritt angehalten wurde */
function halteBeiUnplausiblerAngabe() {
  const step = wizSteps().list[Z.S.wiz.i];
  if (!step || !step.k) return false;
  const wert = getQ(step),
    hinweis = pruefeAngabe(step, wert),
    schluessel = step.k + "|" + wert;
  // Nur beim ersten Tippen anhalten; ein zweites „Weiter“ mit derselben Angabe übernimmt sie
  if (!hinweis || Z.warnKey === schluessel) return false;
  Z.warnKey = schluessel;
  const w = $("wqwarn");
  if (w) {
    w.querySelector("span").textContent = hinweis + HINWEIS_ZWEITES_WEITER;
    w.hidden = false;
    w.scrollIntoView({ block: "center" });
  }
  return true;
}

/** Schritt im Antrags-Assistenten: next, back, close oder goto:Nummer. @param {string} n @param {HTMLElement} t */
function assistentNavigation(n, t) {
  if (n === "close") {
    const k = Z.S.wiz.k;
    Z.S.wiz = null;
    save();
    zeigeLeistung(k);
    return;
  }
  // „Weiß ich nicht“ (Knopf .ghost) überspringt ohne Prüfung
  if (n === "next" && !t.classList.contains("ghost") && halteBeiUnplausiblerAngabe()) return;
  const len = wizSteps().list.length;
  if (n === "next") Z.S.wiz.i = Math.min(len - 1, Z.S.wiz.i + 1);
  else if (n === "back") Z.S.wiz.i = Math.max(0, Z.S.wiz.i - 1);
  else if (n.startsWith("goto:")) Z.S.wiz.i = Number(n.slice(5));
  save();
  render();
  scrollTop();
  // leeres Eingabefeld gleich zum Tippen bereit machen
  const f = document.querySelector(".wiz input[type=text],.wiz input[type=date],.wiz input[type=tel],.wiz textarea");
  if (f && !f.value)
    try {
      f.focus({ preventScroll: true });
    } catch (e) {}
}

/** Jahr in der Belege-Ansicht ein- oder ausblenden; mindestens eines bleibt. @param {string} y */
function wechsleBelegJahr(y) {
  const cur = selYears();
  const neu = cur.includes(y) ? cur.filter((x) => x !== y) : [...cur, y];
  if (!neu.length) {
    toast("Mindestens ein Jahr auswählen");
    return;
  }
  Z.S.belegFilter.jahre = neu;
  save();
  render();
}

/**
 * Attributname (wie in t.dataset), Aktion und – nur wo nötig – eine eigene Bedingung.
 * Ohne Bedingung läuft die Aktion, wenn das Attribut einen nicht-leeren Wert hat.
 * @type {[string, (wert: string, t: HTMLElement) => void, ((t: HTMLElement, wert: string|undefined) => boolean)?][]}
 */
export const ATTRIBUT_AKTIONEN = [
  [
    "tab",
    (wert, t) => {
      if (t.classList.contains("howbtn")) Z.S.welcomeSeen = true;
      Z.S.tab = wert;
      Z.openKey = null;
      save();
      render();
      scrollTop();
    },
  ],
  [
    "area",
    (wert) => {
      Z.areaFilter = wert;
      render();
    },
  ],
  [
    "gotoclaim",
    (wert) => {
      Z.S.tab = "ansprueche";
      zeigeLeistung(wert);
    },
  ],
  ["rmember", (wert) => removeMember(wert)],
  [
    "font",
    (wert) => {
      Z.S.font = wert;
      lsSet("da-font", wert);
      save();
      render();
    },
  ],
  ["edit", (wert) => editBeleg(wert)],
  [
    "lang",
    (wert) => {
      waehleSprache(wert);
      Z.showSprache = false;
      render();
    },
  ],
  ["wopen", (wert) => startWiz(wert)],
  ["fbart", (wert) => openFeedback(wert)],
  ["info", (wert, t) => openInfo(wert, t.dataset.infotext || "")],
  ["wnav", assistentNavigation],
  ["year", wechsleBelegJahr],
  ["befpdf", (wert) => makeMappe(true, true, [wert])],
  [
    "befcopy",
    (wert) => {
      Z.befJahr = wert;
      kopiereAntrag(B.find((x) => x.k === "befreiung"));
    },
  ],
  [
    "kat",
    (wert) => {
      Z.S.belegFilter.kat = wert;
      save();
      render();
    },
    // „Alle Arten“ hat den leeren Wert data-kat=""; nur die Filter-Chips, nicht Auswahlfelder mit data-kat
    (t, wert) => wert !== undefined && t.classList.contains("chip"),
  ],
  [
    "del",
    (wert) => {
      Z.delAsk = wert;
      render();
    },
  ],
  [
    "delno",
    () => {
      Z.delAsk = null;
      render();
    },
  ],
  ["delyes", (wert) => deleteBeleg(wert)],
  ["subToggle", (wert) => toggleSubmitted(wert)],
  [
    "view",
    (wert) => {
      $("lbimg").src = blobUrl(wert);
      $("lightbox").hidden = false;
    },
  ],
  [
    "delown",
    (wert) => {
      Z.S.termine.eigene = (Z.S.termine.eigene || []).filter((x) => x.id !== wert);
      save();
      render();
    },
  ],
  [
    "open",
    (wert) => {
      Z.openKey = Z.openKey === wert ? null : wert;
      render();
      if (Z.openKey) reveal($("it-" + Z.openKey));
    },
  ],
  [
    "copy",
    (wert) => {
      zaehle("antrag_fertig", wert);
      kopiereAntrag(B.find((x) => x.k === wert));
    },
  ],
  [
    "pdf",
    (wert) => {
      zaehle("antrag_fertig", wert);
      makePDF(B.find((x) => x.k === wert));
    },
  ],
  [
    "resettx",
    (wert) => {
      delete Z.S.texte[wert];
      delete Z.S.texte[wert + "_sub"];
      save();
      render();
    },
  ],
];
