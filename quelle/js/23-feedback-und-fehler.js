/* ---------- Fehlerprotokoll (ohne persönliche Daten), Feedback, Weiterempfehlen ---------- */
const APP_VERSION="__APPVERSION__"; let errN=0;
function reportError(msg,stack){
  if(!sb||errN>=5) return; errN++;
  const clean=s=>String(s||"").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"[mail]").replace(/\d{5,}/g,"[zahl]");
  let seite=""; try{ seite=famKey().split(":")[0] }catch(e){}
  try{ sb.from("fehler").insert({meldung:clean(msg).slice(0,500)||"?",stelle:clean(stack).slice(0,1500),seite:seite.slice(0,100),version:APP_VERSION,geraet:navigator.userAgent.slice(0,200)}).then(()=>{},()=>{}) }catch(e){}
}
window.addEventListener("error",e=>{ if(e.message && !/ResizeObserver|^Script error/.test(e.message)) reportError(e.message,(e.error&&e.error.stack)||((e.filename||"")+":"+(e.lineno||""))) });
window.addEventListener("unhandledrejection",e=>{ const r=e.reason; if(r&&r.name==="AbortError") return; reportError((r&&r.message)||String(r),r&&r.stack) });
function openFeedback(){
  let d=$("fbbox"); if(!d){ d=document.createElement("div"); d.id="fbbox"; d.className="overlay"; document.body.appendChild(d) }
  d.hidden=false;
  d.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-h">
    <h3 id="fb-h">Feedback geben</h3>
    <p class="small muted">Was gefällt dir, was fehlt, was klappt nicht? Jede Nachricht wird gelesen. Bitte keine Gesundheitsdaten hineinschreiben.</p>
    <div class="field"><label for="fb-text">Deine Nachricht</label><textarea id="fb-text" rows="5" maxlength="3000"></textarea></div>
    <div class="field"><label for="fb-kontakt">E-Mail für Rückfragen (freiwillig)</label><input type="email" id="fb-kontakt" value="${esc((USER&&USER.email)||"")}"></div>
    <div class="btnrow"><button class="btn" type="button" data-act="fb-send">Senden</button><button class="btn ghost" type="button" data-act="fb-close">Abbrechen</button></div>
  </div>`;
  try{ applyI18n(d) }catch(e){}
  setTimeout(()=>{ const t=$("fb-text"); if(t) try{ t.focus() }catch(e){} },60);
}
function closeFeedback(){ const d=$("fbbox"); if(d) d.hidden=true }
async function sendFeedback(){
  const t=(($("fb-text")||{}).value||"").trim(); if(t.length<2){ toast("Bitte kurz schreiben, worum es geht."); return }
  if(!sb){ toast("Keine Verbindung. Bitte später noch einmal versuchen."); return }
  const btn=document.querySelector('#fbbox [data-act="fb-send"]'); if(btn){ btn.disabled=true; btn.textContent="Wird gesendet …" }
  const kontakt=(($("fb-kontakt")||{}).value||"").trim().slice(0,200);
  const {error}=await sb.from("rueckmeldung").insert({text:t.slice(0,3000),kontakt:kontakt||null,version:APP_VERSION});
  if(error){ toast("Senden hat nicht geklappt. Bitte noch einmal versuchen."); if(btn){ btn.disabled=false; btn.textContent="Senden" } return }
  closeFeedback(); toast("Danke! Deine Nachricht ist angekommen.");
}
async function shareApp(){
  const url="https://yotan31.github.io/dein-anspruch/";
  const text="Schau mal: Mit „Dein Anspruch“ siehst du kostenlos, welche Pflege-Leistungen euch noch zustehen. Mit fertigen Anträgen und Erinnerung an Fristen.";
  if(navigator.share){ try{ await navigator.share({title:"Dein Anspruch",text,url}); return }catch(e){ if(e&&e.name==="AbortError") return } }
  window.open("https://wa.me/?text="+encodeURIComponent(text+" "+url),"_blank","noopener");
}
document.addEventListener("click",e=>{ if(e.target && e.target.id==="fbbox") closeFeedback() });

