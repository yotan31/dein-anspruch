// Seite „Personen“: zwischen gepflegten Personen wechseln, neue anlegen, Familie einladen.
import { fallName } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/** Seite „Personen“ (HTML). */
export function viewPersons() {
  const cur = Z.FAELLE.find((f) => f.id === Z.FALL_ID) || {};
  const own = cur.rolle === "besitzer";
  const others = Z.MEMBERS.filter((m) => m.user_id !== Z.USER.id);
  return `<section class="panel persons">
    <div class="section-title"><h2>Für wen?</h2><button type="button" class="linkbtn" data-act="persons">Schließen</button></div>
    <div class="choices big">${Z.FAELLE.map((f) => `<label class="choice" for="pf-${f.id}"><input type="radio" id="pf-${f.id}" name="pfall" data-fall="${f.id}" ${f.id === Z.FALL_ID ? "checked" : ""}><span>${esc(fallName(f))}<small>${f.rolle === "besitzer" ? "angelegt von dir" : "mit dir geteilt"}</small></span></label>`).join("")}</div>
    <button class="btn ghost" type="button" data-act="add-person">${ic("plus")}Weitere Person anlegen</button>
    <hr class="sep">
    <h3>Gemeinsam pflegen</h3>
    <p class="small muted">Lade Geschwister oder andere Helfer ein. Sie sehen dann die Angaben, Belege und Fristen von ${esc(fallName(cur))} und können mithelfen.</p>
    ${others.length ? `<ul class="members">${others.map((m) => `<li><span>${esc(m.email || "Familienmitglied")}${m.rolle === "besitzer" ? ' <span class="tag">hat angelegt</span>' : ""}</span>${own ? `<button type="button" class="linkbtn danger" data-rmember="${m.user_id}">Entfernen</button>` : ""}</li>`).join("")}</ul>` : ""}
    ${
      Z.inviteLink
        ? `<div class="recip"><span><strong>Einladungslink</strong> (14 Tage gültig, für eine Person)</span><code>${esc(Z.inviteLink)}</code>
        <span class="btnrow"><button class="btn small" type="button" data-act="inv-copy">Link kopieren</button><a class="btn small soft" href="https://wa.me/?text=${encodeURIComponent("Ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um " + fallName(cur) + " kümmern können: " + Z.inviteLink)}" target="_blank" rel="noopener">Per WhatsApp</a>
        <a class="btn small ghost" href="mailto:?subject=${encodeURIComponent("Einladung: Dein Anspruch")}&body=${encodeURIComponent("Hallo, ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um " + fallName(cur) + " kümmern können:\n\n" + Z.inviteLink)}">Per E-Mail</a></span></div>`
        : `<button class="btn" type="button" data-act="invite" ${Z.inviteBusy ? "disabled" : ""}>${ic("user")}Jemanden einladen</button>`
    }
    <hr class="sep">
    ${
      own
        ? Z.delPersonAsk
          ? `<p class="notice bad">${ic("alert")}<span>${esc(fallName(cur))} mit allen Angaben und Belegen für alle löschen? <span class="btnrow mt-8"><button class="btn small danger" type="button" data-act="del-person-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="del-person-no">Abbrechen</button></span></span></p>`
          : `<button class="linkbtn danger" type="button" data-act="del-person">${esc(fallName(cur))} löschen</button>`
        : `<button class="linkbtn danger" type="button" data-rmember="${Z.USER.id}">Aus diesem gemeinsamen Fall austreten</button>`
    }
  </section>`;
}
