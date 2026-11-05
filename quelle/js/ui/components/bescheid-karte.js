// Karte zum Pflegegrad-Bescheid: Stand, Widerspruchsfrist und Knopf zum Erfassen.
import { bescheidInfo } from "../../logic/bescheid.js";
import { urgTxt } from "../../logic/fristen.js";
import { Z } from "../../state/zustand.js";
import { ic, infoBtn } from "../symbole.js";
import { TODAY, deD, isoD, parseIso } from "../../utils/datum.js";
import { esc } from "../../utils/format.js";

/** Karte zum Bescheid (HTML); leer, wenn Pflege nicht gewählt ist. */
export function bescheidCard() {
  if (!Z.S.bereiche.pflege) return "";
  const i = bescheidInfo();
  if (Z.bescheidDraft) return bescheidForm();
  if (!i)
    return `<section class="panel mini">
     <div class="mini-head">${ic("file")}<div class="titelzeile"><h3>Bescheid bekommen?</h3>${infoBtn("Bescheid oder Gutachten", "Mach ein Foto vom Bescheid oder tippe die Angaben ab. Die App liest Pflegegrad, Punkte und Datum aus, zeigt Hinweise für einen möglichen Widerspruch und erinnert an die Frist von einem Monat.")}</div></div>
     <div class="btnrow"><button class="btn small" type="button" data-act="bes-cam">${ic("camera")}Foto machen</button><button class="btn small ghost" type="button" data-act="bes-manual">Abtippen</button><button class="linkbtn" type="button" data-act="r-start">Pflegegrad selbst einschätzen</button></div>
   </section>`;
  const lohnt = (i.knapp || i.abgelehnt) && i.offen;
  return `<section class="panel mini ${lohnt ? "warn" : ""}">
     <div class="mini-head">${ic("file")}<div><h3>Dein Bescheid${Z.S.bescheid.datum ? ` vom ${deD(parseIso(Z.S.bescheid.datum))}` : ""}</h3>
       <p class="small">${i.g ? `Pflegegrad ${i.g}` : "Kein Pflegegrad"}${i.hasPts ? `, ${String(Z.S.bescheid.punkte).replace(".", ",")} Punkte` : ""}${i.fehlt != null && i.g < 5 ? `, noch ${String(i.fehlt.toFixed(1)).replace(".", ",")} Punkte bis Pflegegrad ${i.g + 1}` : ""}</p></div></div>
     ${
       lohnt
         ? `<p class="notice">${ic("alert")}<span><strong>Hinweis für einen möglichen Widerspruch:</strong> ${i.abgelehnt ? "Der Antrag wurde abgelehnt." : "Bis zum nächsten Pflegegrad fehlen nur wenige Punkte."} Frist: <strong>${deD(i.frist)}</strong> (${urgTxt(i.frist)}). Ob ein Widerspruch im Einzelfall Erfolg hat, kann nur eine Beratung klären, zum Beispiel der Pflegestützpunkt, ein Sozialverband oder eine Anwältin für Sozialrecht.</span></p>`
         : i.offen
           ? `<p class="small muted">Widerspruch möglich bis ${deD(i.frist)} (${urgTxt(i.frist)}).</p>`
           : i.frist
             ? `<p class="small muted">Die Widerspruchsfrist ist abgelaufen. Wird es schlechter, geht jederzeit ein Antrag auf Höherstufung.</p>`
             : ""
     }
     ${
       (Z.S.bescheid.hinweise || []).length
         ? `<p class="small">Im Gutachten erwähnt: ${Z.S.bescheid.hinweise
             .map((h) => {
               const [t, k] = h.split("|");
               return `<button type="button" class="chip" data-gotoclaim="${k}">${esc(t)}</button>`;
             })
             .join(" ")}</p>`
         : ""
     }
     <div class="btnrow">${i.offen ? `<button class="btn small ${lohnt ? "" : "ghost"}" type="button" data-wopen="widerspruch">Widerspruch schreiben</button>` : ""}<button class="btn small ghost" type="button" data-act="bes-edit">Ändern</button></div>
   </section>`;
}

function bescheidForm() {
  const d = Z.bescheidDraft;
  return `<section class="panel mini">
    <h3>Angaben aus dem Bescheid</h3>
    ${Z.ocrBusy ? `<p class="notice info">${ic("info")}<span>${esc(Z.ocrMsg)}</span></p>` : Z.ocrMsg ? `<p class="small muted">${esc(Z.ocrMsg)}</p>` : ""}
    <div class="grid2">
      <div class="field"><label for="bd-pg">Festgestellter Pflegegrad</label><select id="bd-pg" data-bd="pg"><option value="0" ${d.pg === "0" ? "selected" : ""}>Abgelehnt / keiner</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${String(d.pg) === String(n) ? "selected" : ""}>Pflegegrad ${n}</option>`).join("")}</select></div>
      <div class="field"><label for="bd-pt">Gesamtpunkte (im Gutachten)</label><input type="text" inputmode="decimal" id="bd-pt" data-bd="punkte" value="${esc(d.punkte || "")}" placeholder="z. B. 44,25"></div>
      <div class="field"><label for="bd-dat">Datum des Bescheids</label><input type="date" id="bd-dat" data-bd="datum" value="${esc(d.datum || "")}"></div>
      <div class="field"><label for="bd-ein">Wann kam er bei dir an?</label><input type="date" id="bd-ein" data-bd="eingang" value="${esc(d.eingang || isoD(TODAY()))}"></div>
    </div>
    <p class="small muted">Die Punktzahl steht im Gutachten des Medizinischen Dienstes, meist als „Gesamtpunkte“. Fehlt das Gutachten, darfst du es bei der Pflegekasse anfordern.</p>
    <div class="nav"><button class="btn ghost" type="button" data-act="bes-cancel">Abbrechen</button><button class="btn" type="button" data-act="bes-save" ${Z.ocrBusy ? "disabled" : ""}>Speichern</button></div>
  </section>`;
}
