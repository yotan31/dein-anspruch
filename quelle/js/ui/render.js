// Zeichnet die Oberfläche aus dem Zustand Z neu (render) und bietet kleine Helfer zum Scrollen.
// Jede Änderung am Zustand endet mit render(); so gibt es nur einen Weg, wie die Anzeige entsteht.
import { applyI18n } from "../i18n/sprachen.js";
import { visSteps } from "../logic/fragebogen.js";
import { B } from "../logic/leistungen.js";
import { consentNeeded } from "../services/speicher.js";
import { Z } from "../state/zustand.js";
import { renderHero, renderTabs, schrift } from "./kopf.js";
import { viewLogin, viewNeuesPasswort } from "./pages/anmeldung.js";
import { viewAnsprueche } from "./pages/ansprueche.js";
import { viewWizard } from "./pages/assistent.js";
import { viewBelege } from "./pages/belege.js";
import { viewConsent } from "./pages/einwilligung.js";
import { VIEWS } from "./pages/fragebogen.js";
import { viewPersons } from "./pages/personen.js";
import { viewRechner } from "./pages/rechner.js";
import { viewTermine } from "./pages/termine.js";
import { esc } from "../utils/format.js";

/* ---------- Rendering ---------- */
/** @param {string} id @returns {any} Element der Seite (bewusst ohne genauen Typ, wird überall als Formularfeld oder Bereich genutzt) */
export function $(id) {
  return document.getElementById(id);
}

const TAB_ORDER = ["ansprueche", "belege", "termine"];

/**
 * Welche Ansicht gerade dran ist (Anmeldung, Fragebogen, Reiter …); ein Wechsel löst die Übergangs-Animation aus.
 */
export function famKey() {
  if (Z.RECHNER) return "r";
  if (typeof Z.USER !== "undefined" && !Z.USER && !Z.GUEST) return "login";
  if (typeof Z.showPersons !== "undefined" && Z.showPersons) return "persons";
  if (Z.S.wiz) return "w:" + Z.S.wiz.k;
  if (!Z.S.done) return "q";
  return "tab:" + (typeof Z.FALL_ID !== "undefined" ? Z.FALL_ID : "");
}

function screenIdx() {
  return Z.RECHNER ? Z.RECHNER.i : Z.S.wiz ? Z.S.wiz.i : !Z.S.done ? Z.S.step : TAB_ORDER.indexOf(Z.S.tab);
}

/**
 * Scrollt ein Element ins Bild, wenn es zu weit oben oder unten liegt.
 * @param el Element
 */
export function reveal(el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 70 || r.top > innerHeight * 0.45) el.scrollIntoView({ block: "start" });
}

/** Zeichnet die ganze Oberfläche aus dem Zustand neu; nur Geändertes wird ausgetauscht (ui/morph.js). */
export function render() {
  const fam = famKey(),
    idx = screenIdx(),
    changed = Z.lastFam !== null && (fam !== Z.lastFam || idx !== Z.lastIdx);
  if (changed) {
    const a = document.activeElement;
    if (a && a !== document.body && a.blur && !(a.closest && a.closest("#hero")))
      try {
        a.blur();
      } catch (e) {}
  }
  renderHero();
  renderTabs();
  renderMain();
  try {
    applyI18n(document.querySelector(".wrap"));
  } catch (e) {}
  // Startseite verlassen (Fragebogen, Rechner, App ohne Konto): Eintrag im Verlauf, damit „Zurück“ dorthin führt
  if (Z.lastFam === "login" && fam !== "login" && !Z.USER)
    try {
      history.pushState({ app: true }, "");
    } catch (e) {}
  Z.lastFam = fam;
  Z.lastIdx = idx;
}

/** Name der aktuellen Ansicht, leer auf der Startseite (sie hat eine eigene Überschrift) */
function seitenname() {
  if (!Z.loaded) return "Wird geladen";
  if (Z.RECOVERY) return "Neues Passwort";
  if (Z.RECHNER) return "Pflegegrad-Rechner";
  if (!Z.USER && !Z.GUEST) return "";
  if (Z.USER && Z.showPersons) return "Personen";
  if (consentNeeded()) return "Einwilligung";
  const b = Z.S.wiz && B.find((x) => x.k === Z.S.wiz.k);
  if (b) return "Antrag: " + b.t;
  if (!Z.S.done) return "Fragebogen";
  return { ansprueche: "Ansprüche", belege: "Belege", termine: "Termine" }[Z.S.tab] || "";
}

/** Springt ohne Animation an den Seitenanfang. */
export function scrollTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}

/** HTML der aktuellen Ansicht im Hauptbereich */
function ansichtHTML() {
  if (!Z.loaded) {
    return `<section class="panel laden"><p class="muted">Einen Moment, deine Daten werden geladen …</p></section>`;
  }
  if (Z.RECOVERY) {
    return viewNeuesPasswort();
  }
  if (Z.RECHNER) {
    return viewRechner();
  }
  if (!Z.USER && !Z.GUEST) {
    return viewLogin();
  }
  if (Z.USER && Z.showPersons) {
    return viewPersons();
  }
  if (consentNeeded()) {
    return viewConsent();
  }
  if (Z.S.wiz && B.find((x) => x.k === Z.S.wiz.k)) {
    return viewWizard();
  }
  Z.S.wiz = null;
  if (!Z.S.done) {
    const vs = visSteps();
    if (Z.S.step >= vs.length) Z.S.step = vs.length - 1;
    return VIEWS[vs[Z.S.step].id]();
  }
  return Z.S.tab === "belege" ? viewBelege() : Z.S.tab === "termine" ? viewTermine() : viewAnsprueche();
}

/**
 * Zeichnet den Hauptbereich. Jede Ansicht bekommt eine Hauptüberschrift (für Bildschirmleser unsichtbar) und einen
 * passenden Titel im Browser-Tab, damit klar ist, wo man gerade ist (WCAG 2.4.2). Die Überschrift steht gleich im HTML,
 * damit das sanfte Neuzeichnen (ui/morph.js) die Seite weiter Stück für Stück abgleichen kann.
 */
function renderMain() {
  document.documentElement.style.setProperty("--fs", schrift());
  const html = ansichtHTML(),
    name = seitenname();
  document.title = name ? `${name} – Dein Anspruch` : "Dein Anspruch";
  $("main").innerHTML =
    (/<h1[\s>]/.test(html) ? "" : `<h1 class="sr-only">${esc(name || "Dein Anspruch")}</h1>`) + html;
}
