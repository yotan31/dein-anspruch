import { langNotice } from "../../i18n/sprachen.js";
import { docsFor } from "../../logic/antragstext.js";
import { sums, txt } from "../../logic/leistungen.js";
import { Z } from "../../state/zustand.js";
import { finderHTML } from "../components/anbieter.js";
import { bescheidCard } from "../components/bescheid-karte.js";
import { datenBox } from "../components/datenbox.js";
import { entlCard } from "../components/entlastung-karte.js";
import { installKarte } from "../components/install-karte.js";
import { AREA_ICON, CLAIM_ICON, bild, ic } from "../symbole.js";
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
   ${langNotice()}
   <div class="section-title"><h2>Deine offenen Ansprüche</h2>${fortschritt(all)}</div>
   ${areas.length > 2 ? `<div class="filters">${areas.map((a) => `<button type="button" class="chip" data-area="${esc(a)}" aria-pressed="${Z.areaFilter === a}">${esc(a)}</button>`).join("")}</div>` : ""}
   ${sorted.length ? `<div class="list">${sorted.map(itemHTML).join("")}</div>` : `<section class="panel leer">${bild("fertig")}<h3>Alles im Blick</h3><p class="muted">Ihr nutzt bereits alles, was wir für eure Lage prüfen konnten.</p></section>`}
   ${genutzt.length ? `<details class="used"><summary>${ic("chev")}Bereits genutzt (${genutzt.length})</summary><div class="list mt-10">${genutzt.map(itemHTML).join("")}</div></details>` : ""}
   ${bescheidCard() || entlCard() ? `<div class="section-title"><h3>Weitere Hilfen</h3></div><div class="minis">${bescheidCard()}${entlCard()}</div>` : ""}
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

const ST_TXT = { beantragt: "Beantragt", bewilligt: "Bewilligt" };

function itemHTML(b) {
  const st = Z.S.status[b.k] || "offen";
  const open = Z.openKey === b.k;
  return `<article class="item${open ? " open" : ""}" id="it-${b.k}">
    <button class="head" type="button" data-open="${b.k}" aria-expanded="${open}">
      <span class="ico a-${esc(b.area)}">${ic(CLAIM_ICON[b.k] || AREA_ICON[b.area] || "heart")}</span>
      <span class="ttl">${esc(b.t)}</span>${valueLabel(b)}
      <span class="chev">${ic("chev")}</span>
      <span class="short">${esc(txt(b.short))}</span>
      ${b.opt || st !== "offen" ? `<span class="tags">${st !== "offen" ? `<span class="tag st-${st}">${ic("check")}${ST_TXT[st] || st}</span>` : ""}${b.opt ? '<span class="tag">je nach Lage</span>' : ""}</span>` : ""}
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
        ${["pg_antrag", "pg_hoch"].includes(b.k) ? `<button class="btn ghost" type="button" data-act="r-start">Erst selbst einschätzen: Pflegegrad-Rechner</button>` : ""}
        <p class="small muted">${nQ ? `${nQ} einfache Fragen. Nichts wird ohne dich abgeschickt.` : "Der Antrag ist schon vorbereitet. Du musst nur noch prüfen."}</p>
      </div>`
        : `<p class="notice info">${ic("info")}<span>Dafür ist kein Antrag nötig. Trage den Betrag einfach in der Steuererklärung ein (oder gib diese Info an deine Steuerberatung weiter).</span></p>`
    }
    <div><h4>So läuft es ab</h4><ol class="steps">${b.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>
    <div class="akk">
      ${naehe ? akk(b.k + ":naehe", "pin", "In der Nähe finden", "", naehe) : ""}
      ${checks.length ? akk(b.k + ":docs", "list", "Unterlagen", `${erledigt} von ${checks.length} erledigt`, `<ul class="checks">${checks.map((c, i) => `<li><label><input type="checkbox" data-check="${b.k}:${i}" ${Z.S.checks[b.k + ":" + i] ? "checked" : ""}><span>${esc(c)}</span></label></li>`).join("")}</ul>`) : ""}
      <div class="akk-row status">${ic("check")}<label for="st-${b.k}">Stand</label><select id="st-${b.k}" data-status="${b.k}">${[
        ["offen", "noch nicht beantragt"],
        ["beantragt", "beantragt, warte auf Antwort"],
        ["bewilligt", "bewilligt"],
      ]
        .map(([v, t]) => `<option value="${v}" ${st === v ? "selected" : ""}>${t}</option>`)
        .join("")}</select></div>
    </div>
    <div class="detail-fuss">
      <label class="gen" for="gn-${b.k}"><input type="checkbox" id="gn-${b.k}" data-gen="${b.k}" ${Z.S.genutzt[b.k] ? "checked" : ""}><span>Bekommen wir schon</span></label>
      <button type="button" class="linkbtn zu" data-open="${b.k}">Zuklappen</button>
    </div>
    <p class="para">${esc(b.area)} · Rechtsgrundlage ${esc(b.p)}</p>
  </div>`;
}
