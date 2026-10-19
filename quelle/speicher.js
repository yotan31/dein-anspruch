
/* ---------- Speicher: Supabase (Konto, Datenbank, Beleg-Fotos) ---------- */
const SB_URL="https://ssamgluufgwsxvkyvaob.supabase.co";
const SB_KEY="sb_publishable_UiXPXKzQ6uKTyQF3SqFQiw_VtjqAAbd";
let sb=null, USER=null, GUEST=false, RECOVERY=false, authMsg="", authMode="login", authBusy=false;
let ref=null, BCOL=null, ASSETS=null, saveTimer=null, writing=Promise.resolve(), canSave=false;
let saveState={c:"",t:"Verbinde …"};
let URLS={};
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function blobUrl(p){ return URLS[p]||"" }
function setSave(c,t){saveState={c,t}; const d=$("savedot"), x=$("savetxt"); if(d){d.className="dot "+c} if(x) x.textContent=t}
const DL={ async save({filename,data}){
  const type=/\.csv$/.test(filename)?"text/csv;charset=utf-8":/\.pdf$/.test(filename)?"application/pdf":"application/octet-stream";
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),8000); return {status:"saved"} } };
function claudeUse(n){ return Promise.resolve(n==="downloads"?DL:null) }
const UI_KEYS=["tab","wiz","belegFilter","welcomeSeen"];
let FAELLE=[], FALL_ID=null, MEMBERS=[], showPersons=false, inviteLink="", inviteBusy=false;
function uiKey(){ return "da-ui-"+(USER?USER.id:"gast")+"-"+(FALL_ID||"x") }
function save(){
  if(!canSave||!ref) return;
  clearTimeout(saveTimer); setSave("","Speichert …");
  const ui={}; UI_KEYS.forEach(k=>ui[k]=S[k]); lsSet(uiKey(),ui); lsSet("da-font",S.font);
  saveTimer=setTimeout(()=>{
    saveTimer=null;
    const data=JSON.parse(JSON.stringify(S)); data.updated=new Date().toISOString();
    if(USER) UI_KEYS.forEach(k=>delete data[k]);
    const f=FAELLE.find(x=>x.id===FALL_ID); if(f) f.data=data;
    writing = writing.then(()=>ref.set(data)).then(()=>setSave("ok",USER?"Gespeichert":"Nur auf diesem Gerät")).catch(()=>{ setSave("warn","Nicht gespeichert – Internet prüfen") });
  },700);
}
function merge(d){
  const b=blank();
  const m={...b,...d,bereiche:{...b.bereiche,...(d.bereiche||{})},pp:{...b.pp,...(d.pp||{})},sb:{...b.sb,...(d.sb||{}),mz:{...(d.sb&&d.sb.mz||{})}},person:{...b.person,...(d.person||{})},termine:{...b.termine,...(d.termine||{})},belegFilter:{...b.belegFilter,...(d.belegFilter||{})},vhp:{...b.vhp,...(d.vhp||{})},bruttoJahr:{...(d.bruttoJahr||{})},ans:{...(d.ans||{})},sent:{...(d.sent||{})}};
  if(d.done===undefined) m.done = (d.step||0)>=6 && !!d.rolle;
  delete m.updated; return m;
}
function fallName(f){ const p=(f&&f.data&&f.data.person)||{}; return (p.name||"").trim()||"Neue Person" }
const toRow=d=>{ const r={}; for(const k of ["kat","titel","ctype","eingereicht","jahr"]) if(k in d) r[k]=d[k];
  if("datum" in d) r.datum=d.datum||null; if("betrag" in d) r.betrag=(d.betrag===""||d.betrag==null||isNaN(d.betrag))?null:Number(d.betrag);
  if("asset" in d) r.pfad=d.asset||""; return r };
async function refreshUrls(){
  const paths=BEL.map(b=>b.asset).filter(p=>p&&!URLS[p]); if(!paths.length) return;
  const {data}=await sb.storage.from("belege").createSignedUrls(paths,6*3600);
  (data||[]).forEach(x=>{ if(x.signedUrl) URLS[x.path]=x.signedUrl });
}
async function reloadBelege(){
  if(!USER||!FALL_ID) return;
  const {data,error}=await sb.from("belege").select("*").eq("fall_id",FALL_ID).order("datum",{ascending:false});
  if(error){ toast("Belege konnten nicht geladen werden."); return }
  BEL=data.map(r=>({id:r.id,kat:r.kat,datum:r.datum||"",jahr:r.jahr,betrag:r.betrag==null?"":Number(r.betrag),titel:r.titel||"",asset:r.pfad||"",ctype:r.ctype||"",eingereicht:!!r.eingereicht}));
  try{ await refreshUrls() }catch(e){}
  render();
}
const BCOL_SB={
  async add(d){ const {error}=await sb.from("belege").insert({...toRow(d),fall_id:FALL_ID}); if(error) throw error; await reloadBelege() },
  doc(id){ return {
    async update(d){ const {error}=await sb.from("belege").update(toRow(d)).eq("id",id); if(error) throw error; await reloadBelege() },
    async delete(){ const {error}=await sb.from("belege").delete().eq("id",id); if(error) throw error; await reloadBelege() } } },
};
const ASSETS_SB={
  async upload(blob,{type}){
    const ext=type==="application/pdf"?"pdf":type==="image/png"?"png":type==="image/webp"?"webp":"jpg";
    const id=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));
    const path=`${FALL_ID}/${id}.${ext}`;
    const {error}=await sb.storage.from("belege").upload(path,blob,{contentType:type,upsert:false});
    if(error) throw {code:/size|large|exceed/i.test(error.message||"")?"too_large":"upload"};
    const {data}=await sb.storage.from("belege").createSignedUrl(path,6*3600); if(data) URLS[path]=data.signedUrl;
    return {id:path,contentType:type};
  },
  async delete(path){ await sb.storage.from("belege").remove([path]) },
};
const REF_SB={ async set(data){ const {error}=await sb.from("fall").update({data,updated_at:new Date().toISOString()}).eq("id",FALL_ID); if(error) throw error } };
const REF_LOCAL={ async set(data){ lsSet("dein-anspruch-gast",data) } };

async function loadFaelle(){
  const {data,error}=await sb.from("fall").select("id,data,created_by,updated_at").order("created_at");
  if(error) throw error;
  const {data:m}=await sb.from("mitglied").select("fall_id,rolle").eq("user_id",USER.id);
  const rollen=Object.fromEntries((m||[]).map(x=>[x.fall_id,x.rolle]));
  FAELLE=data.map(f=>({...f,rolle:rollen[f.id]||"mitglied"}));
}
async function createFall(data){
  const {data:row,error}=await sb.from("fall").insert({data:data||{}}).select("id,data,created_by,updated_at").single();
  if(error) throw error; FAELLE.push({...row,rolle:"besitzer"}); return row.id;
}
async function openFall(id){
  FALL_ID=id; lsSet("da-fall-"+USER.id,id); inviteLink=""; showPersons=false;
  const f=FAELLE.find(x=>x.id===id);
  S=merge({...(f?f.data:{}),...(lsGet(uiKey())||{}),font:lsGet("da-font")||"1"});
  BEL=[]; URLS={}; openKey=null; pending=null; bescheidDraft=null;
  ref=REF_SB; canSave=true; render(); reloadBelege(); loadMembers();
}
async function loadMembers(){
  MEMBERS=[]; if(!FALL_ID) return;
  const {data}=await sb.from("mitglied").select("user_id,rolle,email").eq("fall_id",FALL_ID);
  MEMBERS=data||[]; if(showPersons) render();
}
const CONSENT_VERSION="2026-10";
function consentNeeded(){ return !!USER && !((USER.user_metadata||{}).einwilligung_am) }
let consentBusy=false;
function viewConsent(){
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
    <button class="btn big" type="button" data-act="cs-yes" ${consentBusy?"disabled":""}>${consentBusy?"Einen Moment …":"Zustimmen und weiter"}</button>
    <button class="btn ghost" type="button" data-act="logout">Nicht zustimmen und abmelden</button>
  </section>`;
}
async function giveConsent(){
  const c=$("cs-ok"); if(!c||!c.checked){ toast("Bitte zuerst das Häkchen bei der Einwilligung setzen."); return }
  consentBusy=true; render();
  const {data,error}=await sb.auth.updateUser({data:{einwilligung_am:new Date().toISOString(),einwilligung_version:CONSENT_VERSION}});
  consentBusy=false;
  if(error){ toast("Das hat nicht geklappt. Bitte noch einmal versuchen."); return render() }
  if(data&&data.user) USER=data.user;
  await loadUserData();
}
async function loadUserData(){
  if(consentNeeded()){ loaded=true; canSave=false; setSave("","Einwilligung fehlt"); render(); return }
  setSave("","Lade deine Daten …");
  try{
    const code=lsGet("da-einladung"); let joined=null;
    if(code){ lsSet("da-einladung",null); const {data,error}=await sb.rpc("einladung_annehmen",{c:code}); if(error) toast("Die Einladung ist ungültig oder abgelaufen."); else { joined=data; toast("Willkommen! Ihr pflegt jetzt gemeinsam.") } }
    await loadFaelle();
    if(!FAELLE.length){ const guest=lsGet("dein-anspruch-gast"); await createFall(guest||{}); if(guest) toast("Deine Angaben von diesem Gerät wurden ins Konto übernommen.") }
    const want=joined||lsGet("da-fall-"+USER.id);
    ASSETS=ASSETS_SB; BCOL=BCOL_SB; GUEST=false; loaded=true;
    setSave("ok","Gespeichert");
    await openFall(FAELLE.some(f=>f.id===want)?want:FAELLE[0].id);
  }catch(e){ canSave=false; loaded=true; setSave("warn","Speicher nicht erreichbar"); render() }
}
async function refreshFromServer(){
  if(!USER||!FALL_ID||saveTimer) return;
  const {data}=await sb.from("fall").select("data,updated_at").eq("id",FALL_ID).maybeSingle();
  const f=FAELLE.find(x=>x.id===FALL_ID);
  if(data && f && data.updated_at!==f.updated_at){ f.data=data.data; f.updated_at=data.updated_at; const ui={}; UI_KEYS.forEach(k=>ui[k]=S[k]); S=merge({...data.data,...ui,font:S.font}); render(); }
  reloadBelege();
}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") refreshFromServer().catch(()=>{}) });
async function addPerson(){
  try{ const id=await createFall({}); await openFall(id); scrollTop(); toast("Neue Person angelegt. Beantworte kurz die Fragen.") }catch(e){ toast("Anlegen hat nicht geklappt.") }
}
async function makeInvite(){
  inviteBusy=true; render();
  const {data,error}=await sb.rpc("einladung_erstellen",{f:FALL_ID});
  inviteBusy=false;
  if(error){ toast("Einladung konnte nicht erstellt werden."); return render() }
  inviteLink=location.origin+location.pathname+"?einladung="+data; render();
}
async function removeMember(uid){
  const {error}=await sb.from("mitglied").delete().eq("fall_id",FALL_ID).eq("user_id",uid);
  if(error) return toast("Entfernen hat nicht geklappt.");
  if(uid===USER.id){ FAELLE=FAELLE.filter(f=>f.id!==FALL_ID); toast("Du bist ausgetreten."); if(!FAELLE.length) await createFall({}); return openFall(FAELLE[0].id) }
  toast("Person entfernt."); loadMembers().then(render);
}
let delPersonAsk=false;
async function deletePerson(){
  try{
    const paths=BEL.map(b=>b.asset).filter(Boolean); if(paths.length) await sb.storage.from("belege").remove(paths);
    const {error}=await sb.from("fall").delete().eq("id",FALL_ID); if(error) throw error;
    FAELLE=FAELLE.filter(f=>f.id!==FALL_ID); delPersonAsk=false; toast("Person und ihre Daten wurden gelöscht.");
    if(!FAELLE.length) await createFall({}); openFall(FAELLE[0].id);
  }catch(e){ toast("Löschen hat nicht geklappt.") }
}
function viewPersons(){
  const cur=FAELLE.find(f=>f.id===FALL_ID)||{}; const own=cur.rolle==="besitzer";
  const others=MEMBERS.filter(m=>m.user_id!==USER.id);
  return `<section class="panel persons">
    <div class="section-title"><h2>Für wen?</h2><button type="button" class="linkbtn" data-act="persons">Schließen</button></div>
    <div class="choices big">${FAELLE.map(f=>`<label class="choice" for="pf-${f.id}"><input type="radio" id="pf-${f.id}" name="pfall" data-fall="${f.id}" ${f.id===FALL_ID?"checked":""}><span>${esc(fallName(f))}<small>${f.rolle==="besitzer"?"angelegt von dir":"mit dir geteilt"}</small></span></label>`).join("")}</div>
    <button class="btn ghost" type="button" data-act="add-person">${ic("plus")}Weitere Person anlegen</button>
    <hr class="sep">
    <h3>Gemeinsam pflegen</h3>
    <p class="small muted">Lade Geschwister oder andere Helfer ein. Sie sehen dann die Angaben, Belege und Fristen von ${esc(fallName(cur))} und können mithelfen.</p>
    ${others.length?`<ul class="members">${others.map(m=>`<li><span>${esc(m.email||"Familienmitglied")}${m.rolle==="besitzer"?' <span class="tag">hat angelegt</span>':""}</span>${own?`<button type="button" class="linkbtn danger" data-rmember="${m.user_id}">Entfernen</button>`:""}</li>`).join("")}</ul>`:""}
    ${inviteLink?`<div class="recip"><span><strong>Einladungslink</strong> (14 Tage gültig, für eine Person)</span><code>${esc(inviteLink)}</code>
        <span class="btnrow"><button class="btn small" type="button" data-act="inv-copy">Link kopieren</button><a class="btn small soft" href="https://wa.me/?text=${encodeURIComponent("Ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können: "+inviteLink)}" target="_blank" rel="noopener">Per WhatsApp</a>
        <a class="btn small ghost" href="mailto:?subject=${encodeURIComponent("Einladung: Dein Anspruch")}&body=${encodeURIComponent("Hallo, ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können:\n\n"+inviteLink)}">Per E-Mail</a></span></div>`
      :`<button class="btn" type="button" data-act="invite" ${inviteBusy?"disabled":""}>${ic("user")}Jemanden einladen</button>`}
    <hr class="sep">
    ${own?(delPersonAsk?`<p class="notice bad">${ic("alert")}<span>${esc(fallName(cur))} mit allen Angaben und Belegen für alle löschen? <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="del-person-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="del-person-no">Abbrechen</button></span></span></p>`
      :`<button class="linkbtn danger" type="button" data-act="del-person">${esc(fallName(cur))} löschen</button>`)
      :`<button class="linkbtn danger" type="button" data-rmember="${USER.id}">Aus diesem gemeinsamen Fall austreten</button>`}
  </section>`;
}
function startGuest(){
  GUEST=true; USER=null; ref=REF_LOCAL; canSave=true; ASSETS=null; BCOL=null;
  const g=lsGet("dein-anspruch-gast"); S=g?merge(g):blank();
  setSave("warn","Nur auf diesem Gerät"); render();
}
let loaded=false;
// Testversion (…/test/): deutlich markieren, sie nutzt dieselbe Datenbank wie die echte App
if(/\/test\//.test(location.pathname)){ const t=document.createElement("div"); t.className="testbanner"; t.textContent="TESTVERSION – zum Ausprobieren neuer Funktionen. Achtung: echte Daten!"; document.body.prepend(t) }
async function initStore(){
  try{ const q=new URLSearchParams(location.search); const c=q.get("einladung"); if(c){ lsSet("da-einladung",c); history.replaceState(null,"",location.pathname) } }catch(e){}
  if(!window.supabase){ loaded=true; setSave("warn","Keine Verbindung – nur auf diesem Gerät"); startGuest(); return }
  sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"dein-anspruch-auth"}});
  sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY"){ RECOVERY=true; render() }
    const u=session?session.user:null;
    if(u && (!USER || USER.id!==u.id)){ USER=u; setTimeout(loadUserData,0) }
    if(!u && USER){ USER=null; S=blank(); BEL=[]; URLS={}; FAELLE=[]; FALL_ID=null; canSave=false; ref=null; ASSETS=null; BCOL=null; render() }
  });
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(session&&session.user){ if(!USER){ USER=session.user; await loadUserData() } }
    else { loaded=true; if(lsGet("dein-anspruch-modus")==="gast") startGuest(); else render() }
  }catch(e){ loaded=true; render() }
}

/* ---------- Anmeldung ---------- */
function viewLogin(){
  if(RECOVERY) return `<section class="panel auth"><h2>Neues Passwort festlegen</h2>
    <div class="field"><label for="au-pw">Neues Passwort (mindestens 8 Zeichen)</label><input type="password" id="au-pw" autocomplete="new-password"></div>
    ${authMsg?`<p class="notice">${ic("info")}<span>${esc(authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="au-newpw" ${authBusy?"disabled":""}>Passwort speichern</button></section>`;
  const reg=authMode==="register", fg=authMode==="forgot";
  return `<section class="panel auth">
    ${lsGet("da-einladung")?`<p class="notice good">${ic("user")}<span><strong>Du wurdest eingeladen.</strong> Melde dich an oder lege ein Konto an. Danach siehst du den gemeinsamen Fall.</span></p>`:""}
    <h2>${reg?"Konto anlegen":fg?"Passwort vergessen":"Willkommen"}</h2>
    <p class="muted">${reg?"Mit einem Konto sind deine Angaben und Belege sicher gespeichert und auf Handy und Computer gleich.":fg?"Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.":"Melde dich an, um deine Angaben und Belege zu sehen."}</p>
    ${fg?"":`<button type="button" class="btn big gbtn" data-act="au-google"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Mit Google anmelden</button>
    <div class="orline"><span>oder mit E-Mail</span></div>`}
    <div class="field"><label for="au-mail">E-Mail-Adresse</label><input type="email" id="au-mail" autocomplete="email" inputmode="email" value="${esc(lsGet("dein-anspruch-mail")||"")}"></div>
    ${fg?"":`<div class="field"><label for="au-pw">Passwort${reg?" (mindestens 8 Zeichen)":""}</label><div class="euro"><input type="password" id="au-pw" autocomplete="${reg?"new-password":"current-password"}"><button type="button" class="btn small ghost" data-act="au-show">Zeigen</button></div></div>`}
    ${authMsg?`<p class="notice ${/fehl|falsch|nicht/i.test(authMsg)?"bad":"info"}">${ic("info")}<span>${esc(authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="${reg?"au-register":fg?"au-forgot":"au-login"}" ${authBusy?"disabled":""}>${authBusy?"Einen Moment …":reg?"Konto anlegen":fg?"Link schicken":"Anmelden"}</button>
    <div class="btnrow">
      ${authMode!=="login"?`<button type="button" class="linkbtn" data-act="au-mode" data-mode="login">Ich habe schon ein Konto</button>`:`<button type="button" class="linkbtn" data-act="au-mode" data-mode="register">Neu hier? Konto anlegen</button><button type="button" class="linkbtn" data-act="au-mode" data-mode="forgot">Passwort vergessen?</button>`}
    </div>
    <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>
    <p class="small muted">Ohne Konto bleiben deine Angaben nur in diesem Browser, und Belege-Fotos werden nicht gespeichert. Du kannst später jederzeit ein Konto anlegen, deine Angaben werden dann übernommen.</p>
  </section>`;
}
async function authAction(a){
  const mail=($("au-mail")||{}).value?.trim()||"", pw=($("au-pw")||{}).value||"";
  if(a!=="au-newpw" && !/^\S+@\S+\.\S+$/.test(mail)){ authMsg="Bitte eine gültige E-Mail-Adresse eingeben."; return render() }
  if((a==="au-register"||a==="au-newpw") && pw.length<8){ authMsg="Das Passwort muss mindestens 8 Zeichen haben."; return render() }
  lsSet("dein-anspruch-mail",mail||lsGet("dein-anspruch-mail"));
  authBusy=true; authMsg=""; render();
  const back=location.origin+location.pathname;
  let r;
  try{
    if(a==="au-login"){ r=await sb.auth.signInWithPassword({email:mail,password:pw}); if(r.error) authMsg=/confirm/i.test(r.error.message)?"Die E-Mail-Adresse ist noch nicht bestätigt. Bitte den Link in der Bestätigungs-E-Mail antippen.":"Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch."; else lsSet("dein-anspruch-modus","konto") }
    else if(a==="au-register"){ r=await sb.auth.signUp({email:mail,password:pw,options:{emailRedirectTo:back}});
      if(r.error) authMsg=/already|registered/i.test(r.error.message)?"Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.":/rate|limit/i.test(r.error.message)?"Gerade werden zu viele E-Mails verschickt. Bitte in einer Stunde noch einmal versuchen.":"Konto anlegen hat nicht geklappt: "+r.error.message;
      else if(!r.data.session){ authMsg="Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte den Link darin antippen und dich danach hier anmelden."; authMode="login" } }
    else if(a==="au-forgot"){ r=await sb.auth.resetPasswordForEmail(mail,{redirectTo:back}); authMsg=r.error?"Das hat nicht geklappt. Bitte später noch einmal versuchen.":"Wenn es ein Konto mit dieser Adresse gibt, ist jetzt eine E-Mail mit einem Link unterwegs."; }
    else if(a==="au-newpw"){ r=await sb.auth.updateUser({password:pw}); if(r.error) authMsg="Das neue Passwort konnte nicht gespeichert werden."; else { RECOVERY=false; authMsg=""; toast("Neues Passwort gespeichert") } }
  }catch(e){ authMsg="Keine Verbindung. Bitte Internet prüfen." }
  authBusy=false; render();
}
async function googleLogin(){
  authBusy=true; authMsg=""; render();
  const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
  if(error){ authBusy=false; authMsg=/not enabled|provider/i.test(error.message)?"Die Anmeldung mit Google ist noch nicht eingeschaltet. Bitte vorerst mit E-Mail anmelden.":"Anmeldung mit Google hat nicht geklappt. Bitte erneut versuchen."; render() }
}
async function logout(){ try{ await sb.auth.signOut() }catch(e){} ERI=null; eriLoaded=false; lsSet("dein-anspruch-modus",""); USER=null; GUEST=false; S=blank(); BEL=[]; URLS={}; FAELLE=[]; FALL_ID=null; showPersons=false; canSave=false; ref=null; render(); scrollTop() }

let wipeAsk=false, dataBusy="";
const WIPE_WORD=v=>/^l(ö|oe|o)schen$/i.test(String(v||"").trim());
async function wipeAll(){
  const w=$("wipe-word"); if(!w || !WIPE_WORD(w.value)){ toast("Bitte zum Bestätigen das Wort LÖSCHEN eintippen."); if(w) w.focus(); return }
  wipeAsk=false;
  if(!USER){ lsSet("dein-anspruch-gast",null); S=blank(); BEL=[]; render(); toast("Alle Angaben auf diesem Gerät wurden gelöscht."); return }
  try{
    for(const f of FAELLE){
      if(f.rolle==="besitzer"){
        const {data:bl}=await sb.from("belege").select("pfad").eq("fall_id",f.id);
        const paths=(bl||[]).map(b=>b.pfad).filter(Boolean); if(paths.length) await sb.storage.from("belege").remove(paths);
        await sb.from("fall").delete().eq("id",f.id);
      } else await sb.from("mitglied").delete().eq("fall_id",f.id).eq("user_id",USER.id);
    }
    await sb.from("faelle").delete().eq("user_id",USER.id);
    lsSet("dein-anspruch-gast",null);
    toast("Alle deine Daten wurden gelöscht.");
  }catch(e){ toast("Löschen hat nicht vollständig geklappt. Bitte erneut versuchen."); return }
  await logout();
}

/* ---------- Sicherung herunterladen und wieder einspielen ---------- */
const blobToDataUrl=b=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b) });
function cleanData(d){ const x=JSON.parse(JSON.stringify(d||{})); delete x.wiz; delete x.updated; return x }
async function backupData(){
  if(dataBusy) return; dataBusy="backup"; render();
  try{
    const out={app:"dein-anspruch",version:1,exportiert:new Date().toISOString(),personen:[]};
    const list=USER?FAELLE:[{id:null,data:S}];
    for(const f of list){
      const data=cleanData(f.id===FALL_ID||!USER?S:f.data); const belege=[];
      if(USER){
        const {data:rows}=await sb.from("belege").select("*").eq("fall_id",f.id);
        for(const r of rows||[]){
          const b={kat:r.kat,datum:r.datum||"",jahr:r.jahr,betrag:r.betrag==null?"":Number(r.betrag),titel:r.titel||"",ctype:r.ctype||"",eingereicht:!!r.eingereicht};
          if(r.pfad){ try{ const {data:blob}=await sb.storage.from("belege").download(r.pfad); if(blob) b.datei=await blobToDataUrl(blob) }catch(e){} }
          belege.push(b);
        }
      } else BEL.forEach(b=>belege.push({kat:b.kat,datum:b.datum,jahr:b.jahr,betrag:b.betrag,titel:b.titel,eingereicht:!!b.eingereicht}));
      out.personen.push({name:fallName({data}),data,belege});
    }
    const blob=new Blob([JSON.stringify(out)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`dein-anspruch-sicherung-${isoD(TODAY())}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove() },4000);
    toast("Sicherung heruntergeladen. Bewahre die Datei gut auf.");
  }catch(e){ toast("Sicherung hat nicht geklappt. Bitte erneut versuchen.") }
  dataBusy=""; render();
}
async function restoreData(file){
  if(!file||dataBusy) return;
  let j=null; try{ j=JSON.parse(await file.text()) }catch(e){}
  if(!j||j.app!=="dein-anspruch"||!Array.isArray(j.personen)||!j.personen.length){ toast("Das ist keine Sicherung von Dein Anspruch."); return }
  dataBusy="restore"; render();
  try{
    if(!USER){
      const p=j.personen[0]; S=merge(p.data||{}); BEL=(p.belege||[]).map((b,i)=>({id:"local-r"+i,...b,asset:""})); save();
      toast("Sicherung eingespielt (ohne Fotos, da ohne Konto).");
    } else {
      let first=null;
      for(const p of j.personen){
        const id=await createFall(p.data||{}); first=first||id;
        for(const b of p.belege||[]){
          let pfad="";
          if(b.datei && /^data:/.test(b.datei)){
            try{ const blob=await (await fetch(b.datei)).blob(); const type=blob.type||b.ctype||"image/jpeg";
              const ext=type==="application/pdf"?"pdf":type==="image/png"?"png":type==="image/webp"?"webp":"jpg";
              const path=`${id}/${crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16).slice(2)}.${ext}`;
              const {error}=await sb.storage.from("belege").upload(path,blob,{contentType:type,upsert:false}); if(!error) pfad=path }catch(e){}
          }
          await sb.from("belege").insert({fall_id:id,kat:b.kat||"sonst",titel:b.titel||"",datum:b.datum||null,jahr:b.jahr||null,betrag:b.betrag===""||b.betrag==null?null:Number(b.betrag),eingereicht:!!b.eingereicht,ctype:pfad?(b.ctype||""):"",pfad});
        }
      }
      await loadFaelle(); await openFall(first);
      toast(j.personen.length===1?"Sicherung eingespielt.":`Sicherung eingespielt: ${j.personen.length} Personen.`);
    }
  }catch(e){ toast("Einspielen hat nicht vollständig geklappt. Bitte prüfen.") }
  dataBusy=""; render();
}
function datenBox(){
  return `<section class="panel datenbox">
    <h3>Deine Daten</h3>
    <p class="small muted">Lade ab und zu eine Sicherung herunter. Mit der Datei kannst du alles wiederherstellen, auch nach dem Löschen.</p>
    <div class="btnrow"><button class="btn small soft" type="button" data-act="backup" ${dataBusy?"disabled":""}>${ic("down")}${dataBusy==="backup"?"Sicherung wird erstellt …":"Sicherung herunterladen"}</button><button class="btn small ghost" type="button" data-act="restore" ${dataBusy?"disabled":""}>${dataBusy==="restore"?"Wird eingespielt …":"Sicherung einspielen"}</button></div>
    ${wipeAsk?`<div class="notice bad">${ic("alert")}<span><strong>Wirklich alles löschen?</strong> Alle Angaben, Belege und Fotos werden für immer gelöscht${USER&&MEMBERS.length>1?", auch für eingeladene Familienmitglieder":""}. Lade vorher eine Sicherung herunter.
      <span class="field" style="margin-top:10px"><label for="wipe-word">Zum Bestätigen <strong>LÖSCHEN</strong> eintippen</label><input type="text" id="wipe-word" autocomplete="off" autocapitalize="characters" spellcheck="false"></span>
      <span class="btnrow" style="margin-top:10px"><button class="btn small danger" type="button" data-act="wipe-yes">Endgültig löschen</button><button class="btn small ghost" type="button" data-act="wipe-no">Abbrechen</button></span></span></div>`
    :`<button class="linkbtn danger" type="button" data-act="wipe" style="align-self:flex-start">Meine Daten endgültig löschen</button>`}
  </section>`;
}

/* ---------- E-Mail-Erinnerungen ---------- */
let ERI=null, eriLoaded=false;
async function loadEri(){ if(!USER) return; const {data}=await sb.from("erinnerung").select("aktiv,email").eq("user_id",USER.id).maybeSingle(); ERI=data||null; eriLoaded=true; render() }
async function setEri(aktiv,email){
  const mail=(email||(ERI&&ERI.email)||USER.email||"").trim();
  if(aktiv && !/^\S+@\S+\.\S+$/.test(mail)){ toast("Bitte eine gültige E-Mail-Adresse eingeben."); return }
  const {error}=await sb.from("erinnerung").upsert({user_id:USER.id,aktiv,email:mail,updated_at:new Date().toISOString()});
  if(error){ toast("Speichern hat nicht geklappt."); return }
  ERI={aktiv,email:mail}; toast(aktiv?"Erinnerungen per E-Mail sind an.":"Erinnerungen per E-Mail sind aus."); render();
}
function eriCard(){
  if(!USER) return "";
  if(!eriLoaded){ loadEri(); return "" }
  const on=ERI&&ERI.aktiv;
  return `<section class="panel mini">
    <div class="mini-head">${ic("bell")}<div><h3>Erinnerungen per E-Mail</h3><p class="small muted">Wir schreiben dir 14, 7 und 1 Tag vor jeder Frist, für alle Personen in deinem Konto.</p></div></div>
    ${on?`<p class="small">An: <strong>${esc(ERI.email)}</strong></p><div class="btnrow"><button class="btn small ghost" type="button" data-act="eri-off">Ausschalten</button></div>`
      :`<div class="grid2" style="align-items:end"><div class="field"><label for="eri-mail">E-Mail-Adresse</label><input type="email" id="eri-mail" value="${esc((ERI&&ERI.email)||USER.email||"")}"></div><div><button class="btn" type="button" data-act="eri-on">${ic("bell")}Einschalten</button></div></div>`}
  </section>`;
}

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
