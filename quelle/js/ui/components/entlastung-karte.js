import { ENTLASTUNG } from "../../config/stammdaten.js";
import { entlKonto } from "../../logic/entlastung.js";
import { urgTxt } from "../../logic/fristen.js";
import { Z } from "../../state/zustand.js";
import { ic, infoBtn } from "../symbole.js";
import { daysUntil } from "../../utils/datum.js";
import { esc, eur } from "../../utils/format.js";

export function entlCard() {
  const k = entlKonto();
  if (!k) return "";
  const pct = k.bisHeute ? Math.min(100, (k.genutzt / (k.bisHeute + (k.vorjOffen || 0))) * 100) : 0;
  return `<section class="panel mini">
    <div class="mini-head">${ic("receipt")}<div><div class="titelzeile"><h3>Entlastungsbetrag</h3>${infoBtn("Entlastungsbetrag", `${ENTLASTUNG} € im Monat für Haushaltshilfe, Alltagsbegleitung, Betreuung oder Tagespflege. Die Kasse erstattet das Geld gegen Rechnung.\n\nTrag jede Rechnung als Beleg „Entlastungsbetrag“ ein, dann rechnet die App automatisch mit. Nicht genutzte Beträge verfallen am 30. Juni des Folgejahres.`)}</div><p class="small muted">${ENTLASTUNG} € im Monat</p></div>
      <div class="mini-num"><span class="small muted">jetzt frei</span><b>${eur(k.frei)}</b></div></div>
    <div class="meter"><div class="track"><i style="width:${pct}%"></i></div>
      <div class="nums"><span>${k.y} genutzt: <strong>${eur(k.genutzt, 2)}</strong></span><span>Anspruch bis heute: <strong>${eur(k.bisHeute)}</strong></span></div></div>
    ${k.vorjOffen > 0 ? `<p class="notice ${daysUntil(k.verfall) <= 60 ? "" : "info"}">${ic("alert")}<span><strong>${eur(k.vorjOffen)} aus ${k.y - 1}</strong> verfallen am 30.06.${k.y} (${urgTxt(k.verfall)}). Jetzt Hilfe organisieren und Rechnung einreichen.</span></p>` : ""}
    <div class="btnrow"><button class="btn small" type="button" data-act="entl-add">${ic("plus")}Rechnung erfassen</button><button class="btn small ghost" type="button" data-wopen="entlastung">Erstattung beantragen</button>
      <label class="small muted entl-seit-label">Pflegegrad seit <input type="month" id="entl-seit" value="${esc(Z.S.entlSeit || "")}" class="entl-seit-feld"></label></div>
  </section>`;
}
