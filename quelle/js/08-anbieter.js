import { Z } from "./zustand.js";
import { esc } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
/* ---------- Anbieter vor Ort finden ---------- */
const LOTSE="https://www.pflegelotse.de/";
const FINDER={
 tagespflege:[["Tagespflege in der Nähe","Tagespflege"],["Pflegelotse der Ersatzkassen (mit Preisen)",LOTSE]],
 entlastung:[["Anerkannte Alltagshilfen (AOK-Pflegenavigator, für alle nutzbar)","https://www.aok.de/pk/cl/uni/pflege/pflegenavigator/unterstuetzungsangebote/"],["Nachbarschaftshilfe in der Nähe","Nachbarschaftshilfe"],["Alltagsbegleitung in der Nähe","Alltagsbegleitung Senioren"]],
 sachleistung:[["Pflegedienste in der Nähe","ambulanter Pflegedienst"],["Pflegelotse der Ersatzkassen (mit Preisen)",LOTSE]],
 jahresbetrag:[["Kurzzeitpflege in der Nähe","Kurzzeitpflege"],["Pflegelotse der Ersatzkassen",LOTSE]],
 verbrauch:[["Sanitätshaus in der Nähe","Sanitätshaus"],["Apotheke in der Nähe","Apotheke"]],
 technisch:[["Sanitätshaus in der Nähe","Sanitätshaus"],["Hausnotruf-Anbieter in der Nähe","Hausnotruf"]],
 wohnumfeld:[["Wohnberatung in der Nähe","Wohnberatung barrierefrei"]],
 beratung:[["Pflegestützpunkt in der Nähe","Pflegestützpunkt"],["Beratungsstellen-Suche des ZQP","https://www.zqp.de/beratung-pflege/"]],
 stationaer:[["Pflegeheime vergleichen (Pflegelotse)",LOTSE]],
 pflegekurs:[["Pflegekurse in der Nähe","Pflegekurs Angehörige"]],
};
function plz(){ const m=String(Z.S.person.ort||"").match(/\b\d{5}\b/); return m?m[0]:(Z.S.plz||"") }
export function finderHTML(k){
  const L=FINDER[k]; if(!L) return "";
  const p=plz();
  return `<div><h4>In der Nähe finden</h4>
    ${p?"":`<div class="field" style="max-width:220px;margin-bottom:8px"><label for="plz-${k}">Deine Postleitzahl</label><input type="text" inputmode="numeric" id="plz-${k}" data-plz="1" maxlength="5" placeholder="z. B. 70173"></div>`}
    <div class="extlinks">${L.map(([t,q])=>{const url=/^https?:/.test(q)?q:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q+" "+(p||""))}`;return `<a class="extlink" href="${url}" target="_blank" rel="noopener">${esc(t)}${ic("ext")}</a>`}).join("")}</div>
    <p class="small muted">Neutral: Wir bekommen für diese Links kein Geld. Bei Anrufen „im Auftrag der Pflegekasse“ bitte vorsichtig sein.</p></div>`;
}


