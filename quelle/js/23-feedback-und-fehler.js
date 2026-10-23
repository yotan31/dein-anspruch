import { Z } from "./zustand.js";
import { esc } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
import { applyI18n } from "./09-sprachen.js";
import { $, famKey } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
/* ---------- Fehlerprotokoll (ohne persönliche Daten), Feedback, Weiterempfehlen ---------- */
const APP_VERSION="__APPVERSION__"; Z.errN = 0;
function reportError(msg,stack){
  if(!Z.sb||Z.errN>=5) return; Z.errN++;
  const clean=s=>String(s||"").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"[mail]").replace(/\d{5,}/g,"[zahl]");
  let seite=""; try{ seite=famKey().split(":")[0] }catch(e){}
  try{ Z.sb.from("fehler").insert({meldung:clean(msg).slice(0,500)||"?",stelle:clean(stack).slice(0,1500),seite:seite.slice(0,100),version:APP_VERSION,geraet:navigator.userAgent.slice(0,200)}).then(()=>{},()=>{}) }catch(e){}
}
const ARTEN=[["idee","Idee oder Wunsch","Was würde dir die App leichter machen? Was fehlt dir?"],["fehler","Etwas klappt nicht","Was hast du gemacht, und was ist passiert?"],["lob","Das gefällt mir","Was hilft dir besonders?"]];
/** Wo in der App die Nachricht geschrieben wurde (ohne persönliche Angaben), damit sie sich zuordnen lässt */
function bereich(){
  if(Z.S.wiz) return "antrag:"+Z.S.wiz.k;
  if(Z.RECHNER) return "rechner";
  if(!Z.USER&&!Z.GUEST) return "start";
  if(!Z.S.done) return "fragebogen";
  return (Z.S.tab||"ansprueche")+(Z.openKey?":"+Z.openKey:"");
}
/** @param {string} [art] idee, fehler oder lob */
export function openFeedback(art="idee"){
  let d=$("fbbox"); if(!d){ d=document.createElement("div"); d.id="fbbox"; d.className="overlay"; document.body.appendChild(d) }
  d.hidden=false;
  const alt=($("fb-text")||{}).value||"";
  const ph=(ARTEN.find(x=>x[0]===art)||ARTEN[0])[2];
  d.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <h3 id="fb-h">${ic("idee")}App verbessern</h3>
    <p class="small muted">Jede Nachricht wird gelesen. Einmal im Monat gehen wir alle Wünsche durch und entscheiden, was als Nächstes verbessert wird. Bitte keine Namen oder Gesundheitsdaten hineinschreiben.</p>
    <div class="filters" role="radiogroup" aria-label="Art der Rückmeldung">${ARTEN.map(([k,t])=>`<button type="button" class="chip" role="radio" data-fbart="${k}" aria-checked="${art===k}" aria-pressed="${art===k}">${t}</button>`).join("")}</div>
    <div class="field"><label for="fb-text">Deine Nachricht</label><textarea id="fb-text" rows="5" maxlength="3000" placeholder="${esc(ph)}">${esc(alt)}</textarea></div>
    <div class="field"><label for="fb-kontakt">E-Mail für Rückfragen (freiwillig)</label><input type="email" id="fb-kontakt" value="${esc((Z.USER&&Z.USER.email)||"")}"></div>
    <div class="btnrow"><button class="btn" type="button" data-act="fb-send" data-art="${art}">Senden</button><button class="btn ghost" type="button" data-act="fb-close">Abbrechen</button></div>
  </div>`;
  try{ applyI18n(d) }catch(e){}
  setTimeout(()=>{ const t=$("fb-text"); if(t) try{ t.focus() }catch(e){} },60);
}
export function closeFeedback(){ const d=$("fbbox"); if(d) d.hidden=true }
export async function sendFeedback(){
  const t=(($("fb-text")||{}).value||"").trim(); if(t.length<2){ toast("Bitte kurz schreiben, worum es geht."); return }
  if(!Z.sb){ toast("Keine Verbindung. Bitte später noch einmal versuchen."); return }
  const btn=document.querySelector('#fbbox [data-act="fb-send"]'); if(btn){ btn.disabled=true; btn.textContent="Wird gesendet …" }
  const kontakt=(($("fb-kontakt")||{}).value||"").trim().slice(0,200);
  const art=(btn&&btn.getAttribute("data-art"))||"idee";
  let wo=""; try{ wo=bereich().slice(0,40) }catch(e){}
  const {error}=await Z.sb.from("rueckmeldung").insert({text:t.slice(0,3000),kontakt:kontakt||null,version:APP_VERSION,art,bereich:wo||null});
  if(error){ toast("Senden hat nicht geklappt. Bitte noch einmal versuchen."); if(btn){ btn.disabled=false; btn.textContent="Senden" } return }
  closeFeedback(); toast("Danke! Deine Nachricht ist angekommen.");
}
export async function shareApp(){
  const url="https://yotan31.github.io/dein-anspruch/";
  const text="Schau mal: Mit „Dein Anspruch“ siehst du kostenlos, welche Pflege-Leistungen euch noch zustehen. Mit fertigen Anträgen und Erinnerung an Fristen.";
  if(navigator.share){ try{ await navigator.share({title:"Dein Anspruch",text,url}); return }catch(e){ if(e&&e.name==="AbortError") return } }
  window.open("https://wa.me/?text="+encodeURIComponent(text+" "+url),"_blank","noopener");
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function start23() {
window.addEventListener("error",e=>{ if(e.message && !/ResizeObserver|^Script error/.test(e.message)) reportError(e.message,(e.error&&e.error.stack)||((e.filename||"")+":"+(e.lineno||""))) });
window.addEventListener("unhandledrejection",e=>{ const r=e.reason; if(r&&r.name==="AbortError") return; reportError((r&&r.message)||String(r),r&&r.stack) });
document.addEventListener("click",e=>{ const tg=/** @type {HTMLElement} */(e.target); if(tg && tg.id==="fbbox") closeFeedback() });
}
