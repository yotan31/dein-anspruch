// Reiter „Ansprüche“: Liste der Leistungen mit Filter, Stand und aufklappbaren Details.
import { langNotice } from "../../i18n/sprachen.js";
import { docsFor } from "../../logic/antragstext.js";
import { kannNachfragen, mitWiderspruch } from "../../logic/folgebriefe.js";
import { kindHinweis, kindUnterschiede } from "../../logic/kinder.js";
import { istKind } from "../../logic/lage.js";
import { widerspruchFrist } from "../../logic/fristen.js";
import { sums, txt } from "../../logic/leistungen.js";
import { Z } from "../../state/zustand.js";
import { finderHTML } from "../components/anbieter.js";
import { bescheidCard } from "../components/bescheid-karte.js";
import { datenBox } from "../components/datenbox.js";
import { entlCard } from "../components/entlastung-karte.js";
import { installKarte } from "../components/install-karte.js";
import { rueckblickCard, toepfeCard } from "../components/toepfe-karte.js";
import { vollmachtKnopf } from "../components/vollmacht-knopf.js";
import { AREA_ICON, CLAIM_ICON, bild, ic } from "../symbole.js";
import { daysUntil, deD, parseIso } from "../../utils/datum.js";
import { esc, eur } from "../../utils/format.js";

/* ---------- Reiter: Ansprüche ---------- */
export function viewAnsprueche() {
  const { all, offen } = sums();
  const genutzt = all.filter((b) => Z.S.genutzt[b.k]);
  const areas = ["Alle", ...new Set(offen.map((b) => b.area))];
  if (!areas.includes(Z.areaFilter)) Z.areaFilter = "Alle";
  const sorted = offen
    .filter((b) => Z.areaFilter === "Alle" || b.area === Z.areaFilter)
    .sort(
      (a, b) =>
        Number(!!a.opt) - Number(!!b.opt) ||
        (b.val() || 0) - (a.val() || 0) ||
        (b.mon ? b.mon() : 0) - (a.mon ? a.mon() : 0),
    );
  return `
   ${installKarte()}
   ${
     !Z.S.welcomeSeen
       ? `<section class="panel gap-12">
     <div class="section-title"><h2>Fertig! So geht's weiter</h2><button type="button" class="linkbtn" data-act="welcome-ok">Ausblenden</button></div>
     <div class="howto">
       <button type="button" class="howbtn" data-act="welcome-ok"><b>${ic("list")}Ansprüche prüfen</b><span>Unten antippen: Anleitung, Checkliste, fertiger Antrag als Text oder PDF.</span></button>
       <button type="button" class="howbtn" data-tab="belege"><b>${ic("receipt")}Belege sammeln</b><span>Rezepte und Rechnungen fotografieren, nach Jahr sortieren, einreichen.</span></button>
       <button type="button" class="howbtn" data-tab="termine"><b>${ic("bell")}Fristen im Blick</b><span>Erinnerung an Beratungsbesuch und Abgabefristen im Kalender.</span></button>
     </div></section>`
       : ""
   }
   ${langNotice() && `<p class="notice info small">${ic("info")}<span>${langNotice()}</span></p>`}
   ${rueckblickCard()}
   ${kindKarte()}
   <div class="section-title"><h2>Deine offenen Ansprüche</h2>${fortschritt(all)}</div>
   ${areas.length > 2 ? `<div class="filters">${areas.map((a) => `<button type="button" class="chip" data-area="${esc(a)}" aria-pressed="${Z.areaFilter === a}">${esc(a)}</button>`).join("")}</div>` : ""}
   ${sorted.length ? `<div class="list">${sorted.map(itemHTML).join("")}</div>` : `<section class="panel leer">${bild("fertig")}<h3>Alles im Blick</h3><p class="muted">Ihr nutzt bereits alles, was wir für eure Lage prüfen konnten.</p></section>`}
   ${genutzt.length ? `<details class="used"><summary>${ic("chev")}Bereits genutzt (${genutzt.length})</summary><div class="list mt-10">${genutzt.map(itemHTML).join("")}</div></details>` : ""}
   ${bescheidCard() || entlCard() || toepfeCard() ? `<div class="section-title"><h3>Weitere Hilfen</h3></div><div class="minis">${bescheidCard()}${entlCard()}${toepfeCard()}</div>` : ""}
   <div class="nav endnav"><button class="btn ghost" type="button" data-act="edit">Angaben ändern</button><button class="linkbtn danger" type="button" data-act="reset">Antworten zurücksetzen</button></div>
   <div id="resetconfirm" hidden class="notice bad">${ic("alert")}<span>Alle Antworten aus dem Fragebogen zurücksetzen und neu anfangen? Belege und Fristen bleiben erhalten. <span class="btnrow mt-8"><button class="btn small danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="reset-no">Abbrechen</button></span></span></div>
   ${datenBox()}`;
}

/** Wie viel ist schon geschafft? Zählt alles, was genutzt, beantragt oder bewilligt ist. */
function fortschritt(all) {
  if (!all.length) return "";
  const n = all.filter((b) => Z.S.genutzt[b.k] || (Z.S.status[b.k] || "offen") !== "offen").length;
  return `<div class="fortschritt"><span><strong>${n} von ${all.length}</strong> genutzt oder beantragt</span><span class="track" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${n}"><i style="width:${Math.round((n / all.length) * 100)}%"></i></span></div>`;
}

function valueLabel(b) {
  if (b.val && b.val()) return `<span class="val">${eur(b.val())}/Jahr</span>`;
  if (b.mon && b.mon()) return `<span class="val">bis ${eur(b.mon(), b.mon() % 1 ? 2 : 0)}/Mon.</span>`;
  if (b.once) return `<span class="val">bis ${eur(b.once)}</span>`;
  if (b.frei) return `<span class="val">${eur(b.frei())} Freibetrag</span>`;
  return `<span class="val neutral">${b.opt ? "Prüfen lohnt sich" : "Kostenlos"}</span>`;
}

/** Für Eltern: was bei Kindern anders ist (aufklappbar, damit die Liste nicht nach unten rutscht) */
function kindKarte() {
  if (!istKind()) return "";
  return `<section class="panel kindkarte"><details data-akk="kindkarte" ${Z.akk && Z.akk.kindkarte ? "open" : ""}>
    <summary><h2>${ic("people")} Das ist bei Kindern anders</h2></summary>
    <ul>${kindUnterschiede()
      .map(([t, u]) => `<li><strong>${esc(t)}</strong><span>${esc(u)}</span></li>`)
      .join("")}</ul>
  </details></section>`;
}

const ST_TXT = {
  beantragt: "Beantragt",
  bewilligt: "Bewilligt",
  abgelehnt: "Abgelehnt",
  widerspruch: "Widerspruch läuft",
};

/** Nach dem Abschicken: nachfragen, wenn keine Antwort kommt */
function nachfrageBox(b) {
  if (!kannNachfragen(b)) return "";
  const seit = Z.S.sent && Z.S.sent[b.k];
  return `<div class="folge">
    <p><strong>Noch keine Antwort?</strong> ${seit ? `Abgeschickt am ${deD(parseIso(seit))}. ` : ""}Mit diesem Brief fragst du nach dem Stand.</p>
    <span class="btnrow"><button class="btn small soft" type="button" data-act="nachfrage-pdf" data-k="${b.k}">${ic("down")}Nachfrage als PDF</button><button class="btn small ghost" type="button" data-act="nachfrage-copy" data-k="${b.k}">Text kopieren</button></span>
  </div>`;
}

/** Nach einer Ablehnung: Frist zeigen und den Widerspruch vorbereiten */
function ablehnungBox(b) {
  if ((Z.S.status[b.k] || "offen") !== "abgelehnt") return "";
  const datum = (Z.S.ablehnung[b.k] || {}).datum || "",
    frist = widerspruchFrist(b.k),
    tage = frist ? daysUntil(frist) : null;
  const fristText = !frist
    ? "Trage das Datum ein, das oben auf dem Bescheid steht. Dann rechnet die App die Frist aus."
    : tage < 0
      ? `Die Frist ist am ${deD(frist)} abgelaufen. Lass dich beraten, ob ein neuer Antrag sinnvoll ist.`
      : `Widerspruch möglich bis ${deD(frist)} (${tage === 0 ? "heute" : tage === 1 ? "noch 1 Tag" : `noch ${tage} Tage`}).`;
  const brief = !mitWiderspruch(b)
    ? `<p class="small muted">Beim Finanzamt heißt der Widerspruch „Einspruch“. Er geht am einfachsten über ELSTER oder mit Hilfe der Steuerberatung.</p>`
    : ["pg_antrag", "pg_hoch"].includes(b.k)
      ? `<span class="btnrow"><button class="btn small" type="button" data-wopen="widerspruch">${ic("file")}Widerspruch mit Begründung schreiben</button></span>`
      : `<span class="btnrow"><button class="btn small" type="button" data-act="wid-pdf" data-k="${b.k}">${ic("down")}Widerspruch als PDF</button><button class="btn small ghost" type="button" data-act="wid-copy" data-k="${b.k}">Text kopieren</button></span>
         <button class="linkbtn" type="button" data-act="wid-sent" data-k="${b.k}">Ich habe den Widerspruch abgeschickt</button>`;
  return `<div class="folge">
    <p><strong>Abgelehnt? Das muss nicht das letzte Wort sein.</strong> Ein kurzer Widerspruch wahrt die Frist, die Begründung kannst du nachreichen.</p>
    <span class="field max-260"><label for="abl-${b.k}">Datum auf dem Bescheid</label><input type="date" id="abl-${b.k}" data-abl="${b.k}" value="${esc(datum)}"></span>
    <p class="${frist && tage >= 0 && tage <= 7 ? "frist knapp" : "frist"}">${fristText}</p>
    ${brief}
    <p class="small muted">Unsicher, ob ein Widerspruch Aussicht hat? Kostenlos beraten der Pflegestützpunkt und die Pflegeberatung der Kasse, Mitglieder auch VdK oder SoVD.</p>
  </div>`;
}

function itemHTML(b) {
  const st = Z.S.status[b.k] || "offen";
  const open = Z.openKey === b.k;
  return `<article class="item${open ? " open" : ""}" id="it-${b.k}">
    <button class="head" type="button" data-open="${b.k}" aria-expanded="${open}">
      <span class="ico a-${esc(b.area)}">${ic(CLAIM_ICON[b.k] || AREA_ICON[b.area] || "heart")}</span>
      <span class="ttl">${esc(b.t)}</span>${valueLabel(b)}
      <span class="chev">${ic("chev")}</span>
      <span class="short">${esc(txt(b.short))}</span>
      ${b.opt || st !== "offen" ? `<span class="tags">${st !== "offen" ? `<span class="tag st-${st}">${ic(st === "abgelehnt" ? "alert" : "check")}${ST_TXT[st] || st}</span>` : ""}${b.opt ? '<span class="tag">je nach Lage</span>' : ""}</span>` : ""}
    </button>
    ${open ? detailHTML(b) : ""}
  </article>`;
}

/** aufklappbarer Bereich in einer Leistung; ob er offen ist, merkt sich die App (bleibt beim Abhaken offen) */
function akk(id, icon, titel, info, inhalt) {
  return `<details data-akk="${id}" ${Z.akk && Z.akk[id] ? "open" : ""}><summary>${ic(icon)}<span>${titel}</span>${info ? `<small>${info}</small>` : ""}${ic("chev")}</summary><div class="akk-body">${inhalt}</div></details>`;
}

function detailHTML(b) {
  const checks = docsFor(b),
    st = Z.S.status[b.k] || "offen";
  const nQ = (b.q || []).filter((q) => !q.show || q.show()).length;
  const erledigt = checks.filter((c, i) => Z.S.checks[b.k + ":" + i]).length;
  const naehe = finderHTML(b.k, false);
  return `<div class="detail">
    <p class="kurz">${esc(txt(b.short))}</p>
    ${
      b.ask
        ? `<div class="startbox">
        <button class="btn big" type="button" data-wopen="${b.k}">${ic("file")}${st === "offen" ? "Antrag ausfüllen" : "Antrag ansehen"}</button>
        ${["pg_antrag", "pg_hoch"].includes(b.k) ? `<button class="btn ghost" type="button" data-act="r-start">Erst selbst einschätzen: Pflegegrad-Rechner</button><button class="btn ghost" type="button" data-act="gutachter-pdf">${ic("down")}Vorbereitung auf den Gutachter (PDF)</button>` : ""}
        <p class="small muted">${nQ ? `${nQ} einfache Fragen. Nichts wird ohne dich abgeschickt.` : "Der Antrag ist schon vorbereitet. Du musst nur noch prüfen."}</p>
      </div>`
        : `<p class="notice info">${ic("info")}<span>${esc(b.hinweis || "Dafür ist kein Antrag nötig. Trage den Betrag einfach in der Steuererklärung ein (oder gib diese Info an deine Steuerberatung weiter).")}</span></p>`
    }
    ${kindHinweis(b.k) ? `<p class="notice info">${ic("people")}<span><strong>Bei Kindern:</strong> ${esc(kindHinweis(b.k))}</span></p>` : ""}
    <div><h3 class="unter">So läuft es ab</h3><ol class="steps">${b.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>
    <div class="akk">
      ${naehe ? akk(b.k + ":naehe", "pin", "In der Nähe finden", "", naehe) : ""}
      ${checks.length ? akk(b.k + ":docs", "list", "Unterlagen", `${erledigt} von ${checks.length} erledigt`, `<ul class="checks">${checks.map((c, i) => `<li><label><input type="checkbox" data-check="${b.k}:${i}" ${Z.S.checks[b.k + ":" + i] ? "checked" : ""}><span>${esc(c)}</span></label></li>`).join("")}</ul>${vollmachtKnopf(checks)}`) : ""}
      <div class="akk-row status">${ic("check")}<label for="st-${b.k}">Stand</label><select id="st-${b.k}" data-status="${b.k}">${[
        ["offen", "noch nicht beantragt"],
        ["beantragt", "beantragt, warte auf Antwort"],
        ["bewilligt", "bewilligt"],
        ["abgelehnt", "abgelehnt"],
        ["widerspruch", "Widerspruch eingelegt"],
      ]
        .map(([v, t]) => `<option value="${v}" ${st === v ? "selected" : ""}>${t}</option>`)
        .join("")}</select></div>
    </div>
    ${nachfrageBox(b)}${ablehnungBox(b)}
    <div class="detail-fuss">
      <label class="gen" for="gn-${b.k}"><input type="checkbox" id="gn-${b.k}" data-gen="${b.k}" ${Z.S.genutzt[b.k] ? "checked" : ""}><span>Bekommen wir schon</span></label>
      <button type="button" class="linkbtn zu" data-open="${b.k}">Zuklappen</button>
    </div>
    <p class="para">Rechtsgrundlage: ${esc(b.p)} (Bereich ${esc(b.area)})</p>
  </div>`;
}
