import { Z } from "./zustand.js";
import { blank, esc } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
import { $, render, scrollTop } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
/* ---------- Speicher: Supabase (Konto, Datenbank, Beleg-Fotos) ---------- */
const SB_URL="https://ssamgluufgwsxvkyvaob.supabase.co";
const SB_KEY="sb_publishable_UiXPXKzQ6uKTyQF3SqFQiw_VtjqAAbd";
Z.sb = null; Z.USER = null; Z.GUEST = false; Z.RECOVERY = false; Z.authMsg = ""; Z.authMode = "login"; Z.authBusy = false;
Z.ref = null; Z.BCOL = null; Z.ASSETS = null; Z.saveTimer = null; Z.writing = Promise.resolve(); Z.canSave = false;
Z.saveState = {c:"",t:"Verbinde …"};
Z.URLS = {};
export function lsGet(k) {try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
export function lsSet(k, v) {try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
export function blobUrl(p){ return Z.URLS[p]||"" }
function setSave(c,t){Z.saveState={c,t}; const d=$("savedot"), x=$("savetxt"); if(d){d.className="dot "+c} if(x) x.textContent=t}
export const DL={ async save({filename,data}){
  const type=/\.csv$/.test(filename)?"text/csv;charset=utf-8":/\.pdf$/.test(filename)?"application/pdf":"application/octet-stream";
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),8000); return {status:"saved"} } };
const UI_KEYS=["tab","wiz","belegFilter","welcomeSeen"];
Z.FAELLE = []; Z.FALL_ID = null; Z.MEMBERS = []; Z.showPersons = false; Z.inviteLink = ""; Z.inviteBusy = false;
function uiKey(){ return "da-ui-"+(Z.USER?Z.USER.id:"gast")+"-"+(Z.FALL_ID||"x") }
export function save(){
  if(!Z.canSave||!Z.ref) return;
  clearTimeout(Z.saveTimer); setSave("","Speichert …");
  const ui={}; UI_KEYS.forEach(k=>ui[k]=Z.S[k]); lsSet(uiKey(),ui); lsSet("da-font",Z.S.font);
  Z.saveTimer=setTimeout(()=>{
    Z.saveTimer=null;
    const data=JSON.parse(JSON.stringify(Z.S)); data.updated=new Date().toISOString();
    if(Z.USER) UI_KEYS.forEach(k=>delete data[k]);
    const f=Z.FAELLE.find(x=>x.id===Z.FALL_ID); if(f) f.data=data;
    Z.writing = Z.writing.then(()=>Z.ref.set(data)).then(()=>setSave("ok",Z.USER?"Gespeichert":"Nur auf diesem Gerät")).catch(()=>{ setSave("warn","Nicht gespeichert – Internet prüfen") });
  },700);
}
export function merge(d){
  const b=blank();
  const m={...b,...d,bereiche:{...b.bereiche,...(d.bereiche||{})},pp:{...b.pp,...(d.pp||{})},sb:{...b.sb,...(d.sb||{}),mz:{...(d.sb&&d.sb.mz||{})}},person:{...b.person,...(d.person||{})},termine:{...b.termine,...(d.termine||{})},belegFilter:{...b.belegFilter,...(d.belegFilter||{})},vhp:{...b.vhp,...(d.vhp||{})},bruttoJahr:{...(d.bruttoJahr||{})},ans:{...(d.ans||{})},sent:{...(d.sent||{})}};
  if(d.done===undefined) m.done = (d.step||0)>=6 && !!d.rolle;
  delete m.updated; return m;
}
export function fallName(f){ const p=(f&&f.data&&f.data.person)||{}; return (p.name||"").trim()||"Neue Person" }
function toRow(d) { const r={}; for(const k of ["kat","titel","ctype","eingereicht","jahr"]) if(k in d) r[k]=d[k];
  if("datum" in d) r.datum=d.datum||null; if("betrag" in d) r.betrag=(d.betrag===""||d.betrag==null||isNaN(d.betrag))?null:Number(d.betrag);
  if("asset" in d) r.pfad=d.asset||""; return r }
async function refreshUrls(){
  const paths=Z.BEL.map(b=>b.asset).filter(p=>p&&!Z.URLS[p]); if(!paths.length) return;
  const {data}=await Z.sb.storage.from("belege").createSignedUrls(paths,6*3600);
  (data||[]).forEach(x=>{ if(x.signedUrl) Z.URLS[x.path]=x.signedUrl });
}
async function reloadBelege(){
  if(!Z.USER||!Z.FALL_ID) return;
  const {data,error}=await Z.sb.from("belege").select("*").eq("fall_id",Z.FALL_ID).order("datum",{ascending:false});
  if(error){ toast("Belege konnten nicht geladen werden."); return }
  Z.BEL=data.map(r=>({id:r.id,kat:r.kat,datum:r.datum||"",jahr:r.jahr,betrag:r.betrag==null?"":Number(r.betrag),titel:r.titel||"",asset:r.pfad||"",ctype:r.ctype||"",eingereicht:!!r.eingereicht}));
  try{ await refreshUrls() }catch(e){}
  render();
}
const BCOL_SB={
  async add(d){ const {error}=await Z.sb.from("belege").insert({...toRow(d),fall_id:Z.FALL_ID}); if(error) throw error; await reloadBelege() },
  doc(id){ return {
    async update(d){ const {error}=await Z.sb.from("belege").update(toRow(d)).eq("id",id); if(error) throw error; await reloadBelege() },
    async delete(){ const {error}=await Z.sb.from("belege").delete().eq("id",id); if(error) throw error; await reloadBelege() } } },
};
const ASSETS_SB={
  async upload(blob,{type}){
    const ext=type==="application/pdf"?"pdf":type==="image/png"?"png":type==="image/webp"?"webp":"jpg";
    const id=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));
    const path=`${Z.FALL_ID}/${id}.${ext}`;
    const {error}=await Z.sb.storage.from("belege").upload(path,blob,{contentType:type,upsert:false});
    if(error) throw {code:/size|large|exceed/i.test(error.message||"")?"too_large":"upload"};
    const {data}=await Z.sb.storage.from("belege").createSignedUrl(path,6*3600); if(data) Z.URLS[path]=data.signedUrl;
    return {id:path,contentType:type};
  },
  async delete(path){ await Z.sb.storage.from("belege").remove([path]) },
};
const REF_SB={ async set(data){ const {error}=await Z.sb.from("fall").update({data,updated_at:new Date().toISOString()}).eq("id",Z.FALL_ID); if(error) throw error } };
const REF_LOCAL={ async set(data){ lsSet("dein-anspruch-gast",data) } };

export async function loadFaelle(){
  const {data,error}=await Z.sb.from("fall").select("id,data,created_by,updated_at").order("created_at");
  if(error) throw error;
  const {data:m}=await Z.sb.from("mitglied").select("fall_id,rolle").eq("user_id",Z.USER.id);
  const rollen=Object.fromEntries((m||[]).map(x=>[x.fall_id,x.rolle]));
  Z.FAELLE=data.map(f=>({...f,rolle:rollen[f.id]||"mitglied"}));
}
export async function createFall(data){
  const {data:row,error}=await Z.sb.from("fall").insert({data:data||{}}).select("id,data,created_by,updated_at").single();
  if(error) throw error; Z.FAELLE.push({...row,rolle:"besitzer"}); return row.id;
}
export async function openFall(id){
  Z.FALL_ID=id; lsSet("da-fall-"+Z.USER.id,id); Z.inviteLink=""; Z.showPersons=false;
  const f=Z.FAELLE.find(x=>x.id===id);
  Z.S=merge({...(f?f.data:{}),...(lsGet(uiKey())||{}),font:lsGet("da-font")||"1"});
  Z.BEL=[]; Z.URLS={}; Z.openKey=null; Z.pending=null; Z.bescheidDraft=null;
  Z.ref=REF_SB; Z.canSave=true; render(); reloadBelege(); loadMembers();
}
export async function loadMembers(){
  Z.MEMBERS=[]; if(!Z.FALL_ID) return;
  const {data}=await Z.sb.from("mitglied").select("user_id,rolle,email").eq("fall_id",Z.FALL_ID);
  Z.MEMBERS=data||[]; if(Z.showPersons) render();
}
const CONSENT_VERSION="2026-10";
export function consentNeeded(){ return !!Z.USER && !((Z.USER.user_metadata||{}).einwilligung_am) }
Z.consentBusy = false;
export function viewConsent(){
  return `<section class="panel auth consent">
    <h2>Bevor es losgeht</h2>
    <p>Damit die App dir helfen kann, speichert sie Angaben zur Pflege, zum Beispiel den Pflegegrad, Anträge und Belege. Das sind Gesundheitsdaten, und die sind besonders geschützt. Deshalb brauchen wir einmalig deine ausdrückliche Einwilligung.</p>
    <ul class="small">
      <li>Die Daten liegen verschlüsselt in Frankfurt (EU).</li>
      <li>Nur du und Personen, die du selbst einlädst, sehen sie.</li>
      <li>Keine Werbung, kein Verkauf von Daten.</li>
      <li>Du kannst alles jederzeit selbst löschen.</li>
    </ul>
    <label class="choice" for="cs-ok"><input type="checkbox" id="cs-ok"><span>Ich willige ein, dass Dein Anspruch meine Angaben, auch Gesundheitsdaten, speichert und verarbeitet, um mir die Funktionen der App bereitzustellen (Art. 9 Abs. 2 lit. a DSGVO). Wenn ich Angaben über eine andere Person mache, bin ich dazu berechtigt, zum Beispiel mit ihrem Einverständnis oder als Bevollmächtigte/r. Ich kann die Einwilligung jederzeit widerrufen, indem ich meine Daten in der App lösche.<small>Mehr dazu in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>. Es gelten die <a href="nutzungsbedingungen.html" target="_blank" rel="noopener">Nutzungsbedingungen</a>.</small></span></label>
    <button class="btn big" type="button" data-act="cs-yes" ${Z.consentBusy?"disabled":""}>${Z.consentBusy?"Einen Moment …":"Zustimmen und weiter"}</button>
    <button class="btn ghost" type="button" data-act="logout">Nicht zustimmen und abmelden</button>
  </section>`;
}
export async function giveConsent(){
  const c=$("cs-ok"); if(!c||!c.checked){ toast("Bitte zuerst das Häkchen bei der Einwilligung setzen."); return }
  Z.consentBusy=true; render();
  const {data,error}=await Z.sb.auth.updateUser({data:{einwilligung_am:new Date().toISOString(),einwilligung_version:CONSENT_VERSION}});
  Z.consentBusy=false;
  if(error){ toast("Das hat nicht geklappt. Bitte noch einmal versuchen."); return render() }
  if(data&&data.user) Z.USER=data.user;
  await loadUserData();
}
async function loadUserData(){
  if(consentNeeded()){ Z.loaded=true; Z.canSave=false; setSave("","Einwilligung fehlt"); render(); return }
  setSave("","Lade deine Daten …");
  try{
    const code=lsGet("da-einladung"); let joined=null;
    if(code){ lsSet("da-einladung",null); const {data,error}=await Z.sb.rpc("einladung_annehmen",{c:code}); if(error) toast("Die Einladung ist ungültig oder abgelaufen."); else { joined=data; toast("Willkommen! Ihr pflegt jetzt gemeinsam.") } }
    await loadFaelle();
    if(!Z.FAELLE.length){ const guest=lsGet("dein-anspruch-gast"); await createFall(guest||{}); if(guest) toast("Deine Angaben von diesem Gerät wurden ins Konto übernommen.") }
    const want=joined||lsGet("da-fall-"+Z.USER.id);
    Z.ASSETS=ASSETS_SB; Z.BCOL=BCOL_SB; Z.GUEST=false; Z.loaded=true;
    setSave("ok","Gespeichert");
    await openFall(Z.FAELLE.some(f=>f.id===want)?want:Z.FAELLE[0].id);
  }catch(e){ Z.canSave=false; Z.loaded=true; setSave("warn","Speicher nicht erreichbar"); render() }
}
async function refreshFromServer(){
  if(!Z.USER||!Z.FALL_ID||Z.saveTimer) return;
  const {data}=await Z.sb.from("fall").select("data,updated_at").eq("id",Z.FALL_ID).maybeSingle();
  const f=Z.FAELLE.find(x=>x.id===Z.FALL_ID);
  if(data && f && data.updated_at!==f.updated_at){ f.data=data.data; f.updated_at=data.updated_at; const ui={}; UI_KEYS.forEach(k=>ui[k]=Z.S[k]); Z.S=merge({...data.data,...ui,font:Z.S.font}); render(); }
  reloadBelege();
}
export async function addPerson(){
  try{ const id=await createFall({}); await openFall(id); scrollTop(); toast("Neue Person angelegt. Beantworte kurz die Fragen.") }catch(e){ toast("Anlegen hat nicht geklappt.") }
}
export async function makeInvite(){
  Z.inviteBusy=true; render();
  const {data,error}=await Z.sb.rpc("einladung_erstellen",{f:Z.FALL_ID});
  Z.inviteBusy=false;
  if(error){ toast("Einladung konnte nicht erstellt werden."); return render() }
  Z.inviteLink=location.origin+location.pathname+"?einladung="+data; render();
}
export async function removeMember(uid){
  const {error}=await Z.sb.from("mitglied").delete().eq("fall_id",Z.FALL_ID).eq("user_id",uid);
  if(error) return toast("Entfernen hat nicht geklappt.");
  if(uid===Z.USER.id){ Z.FAELLE=Z.FAELLE.filter(f=>f.id!==Z.FALL_ID); toast("Du bist ausgetreten."); if(!Z.FAELLE.length) await createFall({}); return openFall(Z.FAELLE[0].id) }
  toast("Person entfernt."); loadMembers().then(render);
}
Z.delPersonAsk = false;
export async function deletePerson(){
  try{
    const paths=Z.BEL.map(b=>b.asset).filter(Boolean); if(paths.length) await Z.sb.storage.from("belege").remove(paths);
    const {error}=await Z.sb.from("fall").delete().eq("id",Z.FALL_ID); if(error) throw error;
    Z.FAELLE=Z.FAELLE.filter(f=>f.id!==Z.FALL_ID); Z.delPersonAsk=false; toast("Person und ihre Daten wurden gelöscht.");
    if(!Z.FAELLE.length) await createFall({}); openFall(Z.FAELLE[0].id);
  }catch(e){ toast("Löschen hat nicht geklappt.") }
}
export function viewPersons(){
  const cur=Z.FAELLE.find(f=>f.id===Z.FALL_ID)||{}; const own=cur.rolle==="besitzer";
  const others=Z.MEMBERS.filter(m=>m.user_id!==Z.USER.id);
  return `<section class="panel persons">
    <div class="section-title"><h2>Für wen?</h2><button type="button" class="linkbtn" data-act="persons">Schließen</button></div>
    <div class="choices big">${Z.FAELLE.map(f=>`<label class="choice" for="pf-${f.id}"><input type="radio" id="pf-${f.id}" name="pfall" data-fall="${f.id}" ${f.id===Z.FALL_ID?"checked":""}><span>${esc(fallName(f))}<small>${f.rolle==="besitzer"?"angelegt von dir":"mit dir geteilt"}</small></span></label>`).join("")}</div>
    <button class="btn ghost" type="button" data-act="add-person">${ic("plus")}Weitere Person anlegen</button>
    <hr class="sep">
    <h3>Gemeinsam pflegen</h3>
    <p class="small muted">Lade Geschwister oder andere Helfer ein. Sie sehen dann die Angaben, Belege und Fristen von ${esc(fallName(cur))} und können mithelfen.</p>
    ${others.length?`<ul class="members">${others.map(m=>`<li><span>${esc(m.email||"Familienmitglied")}${m.rolle==="besitzer"?' <span class="tag">hat angelegt</span>':""}</span>${own?`<button type="button" class="linkbtn danger" data-rmember="${m.user_id}">Entfernen</button>`:""}</li>`).join("")}</ul>`:""}
    ${Z.inviteLink?`<div class="recip"><span><strong>Einladungslink</strong> (14 Tage gültig, für eine Person)</span><code>${esc(Z.inviteLink)}</code>
        <span class="btnrow"><button class="btn small" type="button" data-act="inv-copy">Link kopieren</button><a class="btn small soft" href="https://wa.me/?text=${encodeURIComponent("Ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können: "+Z.inviteLink)}" target="_blank" rel="noopener">Per WhatsApp</a>
        <a class="btn small ghost" href="mailto:?subject=${encodeURIComponent("Einladung: Dein Anspruch")}&body=${encodeURIComponent("Hallo, ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können:\n\n"+Z.inviteLink)}">Per E-Mail</a></span></div>`
      :`<button class="btn" type="button" data-act="invite" ${Z.inviteBusy?"disabled":""}>${ic("user")}Jemanden einladen</button>`}
    <hr class="sep">
    ${own?(Z.delPersonAsk?`<p class="notice bad">${ic("alert")}<span>${esc(fallName(cur))} mit allen Angaben und Belegen für alle löschen? <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="del-person-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="del-person-no">Abbrechen</button></span></span></p>`
      :`<button class="linkbtn danger" type="button" data-act="del-person">${esc(fallName(cur))} löschen</button>`)
      :`<button class="linkbtn danger" type="button" data-rmember="${Z.USER.id}">Aus diesem gemeinsamen Fall austreten</button>`}
  </section>`;
}
export function startGuest(){
  Z.GUEST=true; Z.USER=null; Z.ref=REF_LOCAL; Z.canSave=true; Z.ASSETS=null; Z.BCOL=null;
  const g=lsGet("dein-anspruch-gast"); Z.S=g?merge(g):blank();
  setSave("warn","Nur auf diesem Gerät"); render();
}
Z.loaded = false;
export async function initStore(){
  try{ if(new URLSearchParams(location.search).has("rechner")) Z.RECHNER={i:0,a:[]} }catch(e){}
  try{ const q=new URLSearchParams(location.search); const c=q.get("einladung"); if(c){ lsSet("da-einladung",c); history.replaceState(null,"",location.pathname) } }catch(e){}
  if(!window.supabase){ Z.loaded=true; setSave("warn","Keine Verbindung – nur auf diesem Gerät"); startGuest(); return }
  Z.sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"dein-anspruch-auth"}});
  Z.sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY"){ Z.RECOVERY=true; render() }
    const u=session?session.user:null;
    if(u && (!Z.USER || Z.USER.id!==u.id)){ Z.USER=u; setTimeout(loadUserData,0) }
    if(!u && Z.USER){ Z.USER=null; Z.S=blank(); Z.BEL=[]; Z.URLS={}; Z.FAELLE=[]; Z.FALL_ID=null; Z.canSave=false; Z.ref=null; Z.ASSETS=null; Z.BCOL=null; render() }
  });
  try{
    const {data:{session}}=await Z.sb.auth.getSession();
    if(session&&session.user){ if(!Z.USER){ Z.USER=session.user; await loadUserData() } }
    else { Z.loaded=true; if(lsGet("dein-anspruch-modus")==="gast") startGuest(); else render() }
  }catch(e){ Z.loaded=true; render() }
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function start19() {
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") refreshFromServer().catch(()=>{}) });
// Testversion (…/test/): deutlich markieren, sie nutzt dieselbe Datenbank wie die echte App
if(/\/test\//.test(location.pathname)){ const t=document.createElement("div"); t.className="testbanner"; t.textContent="TESTVERSION – zum Ausprobieren neuer Funktionen. Achtung: echte Daten!"; document.body.prepend(t) }
}
