// Fenster von unten: Hilfe und kurze Erklärungen hinter den ⓘ-Knöpfen.
import { applyI18n } from "../../i18n/sprachen.js";
import { faqHTML } from "./fragen.js";
import { $ } from "../render.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/** Hilfe-Fenster: Fragen, persönliche Beratung in der Nähe, Nachricht an uns. */
export function openHilfe() {
  let d = $("hilfebox");
  if (!d) {
    d = document.createElement("div");
    d.id = "hilfebox";
    d.className = "overlay";
    document.body.appendChild(d);
  }
  d.hidden = false;
  d.innerHTML = `<div class="sheet hilfe" role="dialog" aria-modal="true" aria-labelledby="hilfe-h">
    <div class="section-title"><h3 id="hilfe-h">Hilfe und häufige Fragen</h3><button class="btn small ghost" type="button" data-act="hilfe-close">Schließen</button></div>
    ${faqHTML()}
    <div class="hilfe-weiter">
      <h4>Persönliche Hilfe</h4>
      <p class="small muted">Kostenlos und unabhängig, auch am Telefon oder bei dir zu Hause.</p>
      <div class="extlinks"><a class="extlink" href="https://www.google.com/maps/search/?api=1&amp;query=Pflegest%C3%BCtzpunkt" target="_blank" rel="noopener">Pflegestützpunkt in der Nähe${ic("ext")}</a><a class="extlink" href="https://www.teilhabeberatung.de/beratung/beratungsangebote-der-eutb" target="_blank" rel="noopener">EUTB-Teilhabeberatung finden${ic("ext")}</a></div>
      <button class="btn soft" type="button" data-act="fb-open">${ic("info")}Frage oder Rückmeldung an uns</button>
    </div>
  </div>`;
  try {
    applyI18n(d);
  } catch (e) {}
  setTimeout(() => {
    const b = d.querySelector('[data-act="hilfe-close"]');
    if (b)
      try {
        b.focus();
      } catch (e) {}
  }, 60);
}

/** Schließt das Hilfe-Fenster. */
export function closeHilfe() {
  const d = $("hilfebox");
  if (d) d.hidden = true;
}

/** Erklärung zu einem ⓘ-Knopf als Fenster von unten (wie bei iOS) */
export function openInfo(titel, text) {
  let d = $("infobox");
  if (!d) {
    d = document.createElement("div");
    d.id = "infobox";
    d.className = "overlay";
    document.body.appendChild(d);
  }
  d.hidden = false;
  d.innerHTML = `<div class="sheet info" role="dialog" aria-modal="true" aria-labelledby="info-h">
    <span class="griff" aria-hidden="true"></span>
    <h3 id="info-h">${esc(titel)}</h3>
    ${String(text)
      .split(/\n\n/)
      .map((t) => `<p>${esc(t)}</p>`)
      .join("")}
    <button class="btn" type="button" data-act="info-close">Verstanden</button>
  </div>`;
  try {
    applyI18n(d);
  } catch (e) {}
  setTimeout(() => {
    const b = d.querySelector('[data-act="info-close"]');
    if (b)
      try {
        b.focus({ preventScroll: true });
      } catch (e) {}
  }, 60);
}

/** Schließt das Erklär-Fenster. */
export function closeInfo() {
  const d = $("infobox");
  if (d) d.hidden = true;
}
