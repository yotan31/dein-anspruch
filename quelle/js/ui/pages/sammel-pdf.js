// Sammel-PDF prüfen: erkannte Belege einer PDF ansehen, korrigieren und übernehmen.
import { KATS } from "../../logic/belege.js";
import { Z } from "../../state/zustand.js";
import { bar } from "./assistent.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

function bulkYears() {
  const c = {};
  for (const it of Z.bulk.items)
    if (it.on) {
      const y = (it.datum || "").slice(0, 4) || "ohne Datum";
      c[y] = (c[y] || 0) + 1;
    }
  return Object.entries(c).sort();
}

/** Ansicht der Sammel-PDF (HTML): Fortschritt beim Lesen oder Liste zum Prüfen. */
export function bulkView() {
  const B = Z.bulk;
  if (B.phase === "lesen" || B.phase === "speichern")
    return `<div class="pending bulk">
    <h3>${B.phase === "lesen" ? "Rechnungen werden erkannt" : "Belege werden gespeichert"}</h3>
    ${B.total ? bar(B.n, B.total, B.msg) : `<p class="muted">${esc(B.msg)}</p>`}
    <p class="small muted">${B.phase === "lesen" ? "Alles passiert auf deinem Gerät. Bei eingescannten Seiten dauert es etwas länger." : "Bitte die Seite nicht schließen."}</p>
    ${B.phase === "lesen" ? `<button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button>` : ""}
  </div>`;
  if (B.phase === "fehler" || !B.items.length)
    return `<div class="pending bulk">
    <p class="notice warn">${ic("alert")}<span>${B.phase === "fehler" ? esc(B.msg) : "In dieser PDF haben wir keine Rechnung erkannt."} Du kannst sie trotzdem als einen Beleg speichern.</span></p>
    <div class="nav big go"><button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button><button class="btn" type="button" data-act="bulk-single">Als einen Beleg speichern</button></div></div>`;
  const on = B.items.filter((x) => x.on).length,
    yrs = bulkYears();
  return `<div class="pending bulk">
    <h3>${B.items.length === 1 ? "1 Rechnung erkannt" : `${B.items.length} Rechnungen erkannt`}</h3>
    ${yrs.length ? `<div class="yearchips">${yrs.map(([y, n]) => `<span class="chip" aria-pressed="true">${esc(y)}: ${n}</span>`).join("")}</div>` : ""}
    ${B.pages && B.pages.some((x) => !x.text) ? `<p class="notice warn">${ic("alert")}<span>Bei ${B.pages.filter((x) => !x.text).length === 1 ? "einer Seite" : B.pages.filter((x) => !x.text).length + " Seiten"} konnten wir den Text nicht lesen. Bitte dort Datum und Betrag selbst eintragen.</span></p>` : ""}
    <p class="notice info">${ic("info")}<span>Bitte kurz prüfen. Du kannst alles ändern oder eine Rechnung abwählen. Gespeichert wird erst, wenn du unten tippst.</span></p>
    <div class="bulklist">${B.items
      .map(
        (it, i) => `<article class="bulkitem${it.on ? "" : " off"}" id="${it.id}">
      <label class="bion" for="bion-${i}"><input type="checkbox" id="bion-${i}" data-bi="${i}:on" ${it.on ? "checked" : ""}><span>übernehmen</span></label>
      <img class="bthumb" src="${it.thumb}" alt="Seite ${it.pages[0]}">
      <div class="bfields">
        <span class="small muted">${it.pages.length > 1 ? `Seiten ${it.pages[0]}–${it.pages[it.pages.length - 1]}` : `Seite ${it.pages[0]}`}</span>
        <div class="field"><label for="bik-${i}">Art</label><select id="bik-${i}" data-bi="${i}:kat">${Object.entries(
          KATS,
        )
          .map(([k, v]) => `<option value="${k}" ${it.kat === k ? "selected" : ""}>${esc(v.t)}</option>`)
          .join("")}</select></div>
        <div class="grid2">
          <div class="field"><label for="bid-${i}">Datum${it.datum ? "" : ' <span class="miss">fehlt</span>'}</label><input type="date" id="bid-${i}" data-bi="${i}:datum" value="${esc(it.datum)}"></div>
          <div class="field"><label for="bib-${i}">Betrag${it.betrag ? "" : ' <span class="miss">fehlt</span>'}</label><div class="euro"><input type="text" inputmode="decimal" id="bib-${i}" data-bi="${i}:betrag" value="${esc(it.betrag)}" placeholder="z. B. 5,00"><span>€</span></div></div>
        </div>
        <div class="field"><label for="bit-${i}">Beschreibung</label><input type="text" id="bit-${i}" data-bi="${i}:titel" value="${esc(it.titel)}" placeholder="z. B. Apotheke am Markt"></div>
      </div>
    </article>`,
      )
      .join("")}</div>
    ${Z.ASSETS ? "" : `<p class="small muted">Ohne Konto werden nur Datum, Betrag und Art gespeichert, nicht die Seiten selbst.</p>`}
    <div class="nav big go"><button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button><button class="btn" type="button" data-act="bulk-save" ${on ? "" : "disabled"}>${on === 1 ? "1 Beleg speichern" : `${on} Belege speichern`}</button></div>
  </div>`;
}
