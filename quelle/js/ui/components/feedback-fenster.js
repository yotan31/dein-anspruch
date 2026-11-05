import { applyI18n } from "../../i18n/sprachen.js";
import { Z } from "../../state/zustand.js";
import { $ } from "../render.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

const ARTEN = [
  ["idee", "Idee oder Wunsch", "Was würde dir die App leichter machen? Was fehlt dir?"],
  ["fehler", "Etwas klappt nicht", "Was hast du gemacht, und was ist passiert?"],
  ["lob", "Das gefällt mir", "Was hilft dir besonders?"],
];

/** @param {string} [art] idee, fehler oder lob */
export function openFeedback(art = "idee") {
  let d = $("fbbox");
  if (!d) {
    d = document.createElement("div");
    d.id = "fbbox";
    d.className = "overlay";
    document.body.appendChild(d);
  }
  d.hidden = false;
  const alt = ($("fb-text") || {}).value || "";
  const ph = (ARTEN.find((x) => x[0] === art) || ARTEN[0])[2];
  d.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <h3 id="fb-h">${ic("idee")}App verbessern</h3>
    <p class="small muted">Jede Nachricht wird gelesen. Einmal im Monat gehen wir alle Wünsche durch und entscheiden, was als Nächstes verbessert wird. Bitte keine Namen oder Gesundheitsdaten hineinschreiben.</p>
    <div class="filters" role="radiogroup" aria-label="Art der Rückmeldung">${ARTEN.map(([k, t]) => `<button type="button" class="chip" role="radio" data-fbart="${k}" aria-checked="${art === k}" aria-pressed="${art === k}">${t}</button>`).join("")}</div>
    <div class="field"><label for="fb-text">Deine Nachricht</label><textarea id="fb-text" rows="5" maxlength="3000" placeholder="${esc(ph)}">${esc(alt)}</textarea></div>
    <div class="field"><label for="fb-kontakt">E-Mail für Rückfragen (freiwillig)</label><input type="email" id="fb-kontakt" value="${esc((Z.USER && Z.USER.email) || "")}"></div>
    <div class="btnrow"><button class="btn" type="button" data-act="fb-send" data-art="${art}">Senden</button><button class="btn ghost" type="button" data-act="fb-close">Abbrechen</button></div>
  </div>`;
  try {
    applyI18n(d);
  } catch (e) {}
  setTimeout(() => {
    const t = $("fb-text");
    if (t)
      try {
        t.focus();
      } catch (e) {}
  }, 60);
}

export function closeFeedback() {
  const d = $("fbbox");
  if (d) d.hidden = true;
}
