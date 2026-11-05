// Kopf der App: Überblick mit Summe und Balken, Reiter-Leiste und Schriftgröße.
import { langSelect } from "../i18n/sprachen.js";
import { deadlines, urg, urgTxt } from "../logic/fristen.js";
import { sums } from "../logic/leistungen.js";
import { lsGet } from "../services/lokal.js";
import { consentNeeded, fallName } from "../services/speicher.js";
import { Z } from "../state/zustand.js";
import { $ } from "./render.js";
import { ic } from "./symbole.js";
import { esc, eur } from "../utils/format.js";

/** Schriftgröße ist eine Einstellung des Geräts: sie bleibt auch nach dem Abmelden und ohne Konto erhalten */
export function schrift() {
  return lsGet("da-font") || Z.S.font || "1";
}

const MENU_ICON = "M4 7h16 M4 12h16 M4 17h16";

/** Zeichnet den Kopf: Marke, Speicherstand und Überblick mit Summe. */
export function renderHero() {
  const save = `<div class="savestate"><span class="dot ${Z.saveState.c}" id="savedot"></span><span id="savetxt">${esc(Z.saveState.t)}</span></div>`;
  const brand = `<div class="brand"><img class="logo" src="logo.webp" width="44" height="44" alt=""><b>Dein Anspruch</b></div>`;
  const curF = Z.USER && Z.FAELLE.find((f) => f.id === Z.FALL_ID);
  const personBtn = curF
    ? `<button type="button" class="acct person" data-act="persons" aria-expanded="${Z.showPersons}">${ic("user")}${esc(fallName(curF))} ▾</button>`
    : "";
  const fontsw = `<div class="fontsw" role="group" aria-label="Schriftgröße">${[
    ["1", "A"],
    ["1.15", "A+"],
    ["1.3", "A++"],
  ]
    .map(
      ([v, t]) =>
        `<button type="button" data-font="${v}" aria-pressed="${schrift() === v}" aria-label="Schrift ${t}">${t}</button>`,
    )
    .join("")}</div>`;
  const acct = Z.USER
    ? `<button type="button" class="linkbtn danger" data-act="logout" title="${esc(Z.USER.email || "")}">Abmelden</button>`
    : Z.GUEST
      ? `<button type="button" class="linkbtn" data-act="guest-register">Konto anlegen</button>`
      : "";
  const menuBtn = `<button type="button" class="menubtn" data-act="menu" aria-expanded="${!!Z.showMenu}" aria-controls="hmenu"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${MENU_ICON}"/></svg><span class="sr">Menü: Sprache, Schriftgröße, Konto</span></button>`;
  const menu = Z.showMenu
    ? `<div class="hmenu" id="hmenu">
     <div><span>Sprache</span>${langSelect()}</div>
     <div><span>Schriftgröße</span>${fontsw}</div>
     ${Z.S.done && !Z.S.wiz && !Z.RECHNER ? `<div><button type="button" class="linkbtn" data-act="edit">Angaben ändern</button></div>` : ""}
     <div><button type="button" class="linkbtn" data-act="hilfe-open">Hilfe und häufige Fragen</button></div>
     ${acct ? `<div>${acct}</div>` : ""}
   </div>`
    : "";
  const ideeBtn = `<button type="button" class="ideebtn" data-act="fb-open" title="App verbessern">${ic("idee")}<span class="lbl">App verbessern</span></button>`;
  const anmelden =
    !Z.USER &&
    !Z.GUEST &&
    !Z.RECOVERY &&
    !Z.RECHNER &&
    Z.loaded &&
    !Z.zeigeAnmeldung &&
    (Z.authMode || "login") === "login" &&
    !Z.authMsg
      ? `<button type="button" class="btn small ghost kopf-anmelden" data-act="au-zeigen">Anmelden</button>`
      : "";
  const top = `<div class="topbar">${brand}<div class="topright">${anmelden}${ideeBtn}${menuBtn}</div></div>${menu}`;
  const kopf = `<div class="hrow">${personBtn || "<span></span>"}${save}</div>`;
  if (Z.S.wiz || Z.RECHNER || (Z.S.done && Z.S.tab !== "ansprueche")) {
    $("hero").innerHTML = top + (personBtn ? `<div class="hsheet slim">${kopf}</div>` : "");
    return;
  }
  // Anmeldung und Fragebogen erklären sich selbst; oben nur Marke und Menü (bei Konten zusätzlich die Person)
  if (!Z.S.done) {
    $("hero").innerHTML = top + (personBtn ? `<div class="hsheet slim">${kopf}</div>` : "");
    return;
  }
  const s = sums();
  const dl = deadlines();
  const crit = dl.find((x) => x.main && !x.ok && urg(x.d) !== "ok") || dl.find((x) => urg(x.d) === "late");
  const next = dl[0];
  // Aufschlüsselung wie auf einem Auszug: die größten Posten, der Rest zusammengefasst
  const posten = s.offen
    .filter((b) => b.cash && (Z.S.status[b.k] || "offen") === "offen" && (b.val() || 0) > 0)
    .map((b) => ({ k: b.k, t: b.t, v: b.val() || 0 }))
    .sort((x, y) => y.v - x.v);
  const top3 = posten.slice(0, 3),
    rest = posten.slice(3),
    restV = rest.reduce((a, x) => a + x.v, 0);
  const ohne = s.offen.length - posten.length;
  const tones = ["var(--money)", "var(--money-2)", "var(--money-3)", "var(--line)"];
  const bar = s.cash
    ? `<div class="track" aria-hidden="true">${[...top3.map((x) => x.v), restV].map((v, i) => (v ? `<i style="flex:${v};background:${tones[i]}"></i>` : "")).join("")}</div>`
    : "";
  const rows =
    top3
      .map(
        (x) =>
          `<button type="button" class="hpost" data-gotoclaim="${x.k}"><span>${esc(x.t)}</span><b>${eur(x.v)}</b></button>`,
      )
      .join("") +
    (rest.length ? `<div class="hpost rest"><span>${rest.length} weitere</span><b>${eur(restV)}</b></div>` : "");
  $("hero").innerHTML = `${top}<div class="hsheet">${kopf}
   <div class="hsum">
     <span class="small muted">Noch offen pro Jahr</span>
     <span class="figure">${eur(s.cash)}</span>
     ${s.frei ? `<span class="small muted">plus ${eur(s.frei)} Steuerfreibeträge</span>` : ""}
   </div>
   ${bar}
   ${rows ? `<div class="hposten">${rows}</div>` : ""}
   <div class="hfoot">
     <span>${ohne > 0 ? `+ ${ohne} ${ohne === 1 ? "Punkt" : "Punkte"} ohne festen Betrag` : `${s.offen.length} offene Punkte`}</span>
     <span>${Z.BEL.length} ${Z.BEL.length === 1 ? "Beleg" : "Belege"}</span>
   </div>
   ${crit ? `<button type="button" class="halert" data-tab="termine">${ic("bell")}${esc(crit.t)}: ${urgTxt(crit.d)}</button>` : next ? `<button type="button" class="hnext" data-tab="termine">${ic("cal")}Nächste Frist ${urgTxt(next.d)}</button>` : ""}
  </div>`;
}

/** Zeichnet die Reiter-Leiste; ausgeblendet im Fragebogen, Assistenten und Rechner. */
export function renderTabs() {
  const t = $("tabs");
  t.hidden = !Z.S.done || !!Z.S.wiz || !!Z.RECHNER || (!Z.USER && !Z.GUEST) || consentNeeded() || Z.RECOVERY;
  if (t.hidden) return;
  const dl = deadlines();
  const att = dl.filter((x) => !x.ok && urg(x.d) !== "ok").length;
  const T = [
    ["ansprueche", "Ansprüche", "list", 0],
    ["belege", "Belege", "receipt", 0],
    ["termine", "Termine", "cal", att],
  ];
  t.innerHTML = T.map(
    ([k, l, i, b]) =>
      `<button type="button" role="tab" data-tab="${k}" aria-selected="${Z.S.tab === k}">${ic(i)}<span class="lbl">${l}</span>${b ? `<span class="badge">${b}</span>` : ""}</button>`,
  ).join("");
}
