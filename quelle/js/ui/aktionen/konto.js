// Aktionen „Konto“: Anmelden, Konto anlegen, Passwort, ohne Konto nutzen, Schnellstart, Einwilligung.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { applicable } from "../../logic/leistungen.js";
import { authAction, googleLogin, logout } from "../../services/anmeldung.js";
import { lsSet } from "../../services/lokal.js";
import { beendeGast, giveConsent, save, startGuest } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { startWiz } from "../pages/assistent.js";
import { $, render, scrollTop } from "../render.js";

/**
 * Logo oder Zurück-Taste: ohne Konto zur Startseite, mit Konto zur Übersicht der Ansprüche
 * (die Startseite ist für alle, die noch nicht angemeldet sind).
 */
export function zurStartseite() {
  Z.RECHNER = null;
  Z.showMenu = Z.showSprache = Z.showPersons = false;
  if (Z.USER) {
    if (Z.S.wiz) {
      Z.S.wiz = null;
      save();
    }
    if (Z.S.done) Z.S.tab = "ansprueche";
    Z.openKey = null;
  } else {
    beendeGast();
    Z.zeigeAnmeldung = false;
    Z.authMode = "login";
    Z.authMsg = "";
  }
  render();
  scrollTop();
}

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_KONTO = {
  startseite: () => zurStartseite(),
  "au-google": (t) => {
    googleLogin();
  },
  "au-login": (t, name) => AKTIONEN_KONTO["au-newpw"](t, name),
  "au-register": (t, name) => AKTIONEN_KONTO["au-newpw"](t, name),
  "au-forgot": (t, name) => AKTIONEN_KONTO["au-newpw"](t, name),
  "au-newpw": (t, name) => {
    authAction(name);
  },
  "au-mode": (t) => {
    Z.authMode = t.dataset.mode;
    Z.authMsg = "";
    Z.zeigeAnmeldung = true;
    render();
  },
  "au-zeigen": (t) => {
    Z.authMode = "login";
    Z.authMsg = "";
    Z.zeigeAnmeldung = true;
    Z.showMenu = false;
    render();
    scrollTop();
    setTimeout(() => {
      const m = $("au-mail");
      if (m && !m.value)
        try {
          m.focus();
        } catch (e) {}
    }, 80);
  },
  "au-start": (t) => {
    Z.authMode = "login";
    Z.authMsg = "";
    Z.zeigeAnmeldung = false;
    Z.einladungSpaeter = true;
    render();
    scrollTop();
  },
  "au-show": (t) => {
    const p = $("au-pw"),
      p2 = $("au-pw2");
    if (p) {
      p.type = p.type === "password" ? "text" : "password";
      if (p2) p2.type = p.type;
      t.textContent = p.type === "password" ? "Zeigen" : "Verbergen";
    }
  },
  "au-newpw-abbruch": (t) => {
    Z.RECOVERY = false;
    Z.authMsg = "";
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {}
    render();
    scrollTop();
  },
  "pw-aendern": (t) => {
    Z.RECOVERY = true;
    Z.authMsg = "";
    render();
    scrollTop();
  },
  "au-guest": (t) => {
    lsSet("dein-anspruch-modus", "gast");
    startGuest();
    scrollTop();
  },
  schnell: (t) => {
    const k = t.dataset.ziel || "";
    lsSet("dein-anspruch-modus", "gast");
    startGuest();
    // Fragebogen schon ausgefüllt (früherer Besuch ohne Konto): gleich zum Antrag
    if (Z.S.done && applicable().some((b) => b.k === k && b.ask)) {
      Z.S.tab = "ansprueche";
      Z.openKey = k;
      startWiz(k);
      return;
    }
    Z.S.ziel = k;
    Z.S.done = false;
    Z.S.step = 0;
    if (/^sb_/.test(k)) Z.S.bereiche = { pflege: false, sb: true };
    else Z.S.bereiche.pflege = true;
    save();
    render();
    scrollTop();
  },
  "guest-register": (t) => {
    Z.GUEST = false;
    Z.authMode = "register";
    Z.authMsg = "";
    lsSet("dein-anspruch-modus", "");
    render();
    scrollTop();
  },
  logout: (t) => {
    logout();
  },
  "cs-yes": (t) => {
    giveConsent();
  },
};
