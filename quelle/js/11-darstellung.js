/* ---------- Rendering ---------- */
/** @param {string} id @returns {any} Element der Seite (bewusst ohne genauen Typ, wird überall als Formularfeld oder Bereich genutzt) */
const $ = id => document.getElementById(id);
/** @param {string} name @param {string} val @param {string} label @param {string} [small] @param {string} [type] @param {any} [checked] */
function choice(name,val,label,small,type="radio",checked=false){
  const id=`${name}-${val}`.replace(/[^a-zA-Z0-9-_]/g,"_");
  return `<label class="choice" for="${id}"><input type="${type}" id="${id}" name="${name}" value="${esc(val)}" ${checked?"checked":""}><span>${esc(label)}${small?`<small>${esc(small)}</small>`:""}</span></label>`;
}
/* ---------- Sanftes Neuzeichnen: nur geänderte Teile austauschen, Bildschirmwechsel animieren ---------- */
const RM=(()=>{ try{ return matchMedia("(prefers-reduced-motion: reduce)").matches }catch(e){ return false } })();
const IH=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
function sameNode(a,b){
  if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName) return false;
  if(a.nodeType!==1) return true;
  if(a.id||b.id) return a.id===b.id;
  if(a.nodeName==="INPUT" && a.type!==b.getAttribute("type")) return false;
  return true;
}
function morphKids(par,np){
  let o=par.firstChild, n=np.firstChild;
  while(n){
    const next=n.nextSibling;
    if(o && sameNode(o,n)){ morphNode(o,n); o=o.nextSibling }
    else {
      let m=null;
      if(n.nodeType===1 && n.id){ for(let c=o;c;c=c.nextSibling){ if(c.nodeType===1&&c.id===n.id){ m=c; break } } }
      if(m){ par.insertBefore(m,o); morphNode(m,n) } else par.insertBefore(n,o);
    }
    n=next;
  }
  while(o){ const nx=o.nextSibling; par.removeChild(o); o=nx }
}
function morphNode(a,b){
  if(a.nodeType!==1){ if(a.nodeValue!==b.nodeValue) a.nodeValue=b.nodeValue; return }
  for(const at of [...a.attributes]) if(!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for(const at of b.attributes) if(a.getAttribute(at.name)!==at.value) a.setAttribute(at.name,at.value);
  const tag=a.nodeName;
  if(tag==="INPUT"){
    if(a.type==="checkbox"||a.type==="radio") a.checked=b.hasAttribute("checked");
    else if(a.type!=="file" && document.activeElement!==a){ const v=b.getAttribute("value")||""; if(a.value!==v) a.value=v }
    return;
  }
  if(tag==="TEXTAREA"){ if(document.activeElement!==a){ const v=b.textContent; if(a.value!==v) a.value=v } return }
  morphKids(a,b);
  if(tag==="SELECT"){ const s=a.querySelector("option[selected]"); if(s) a.value=s.value; else if(a.options.length && !b.querySelector("option[selected]")) a.selectedIndex=0 }
}
function smoothEl(el){
  if(!el||el._smooth) return; el._smooth=true;
  Object.defineProperty(el,"innerHTML",{configurable:true,get(){ return IH.get.call(this) },set(html){
    const t=document.createElement("template"); IH.set.call(t,html); morphKids(this,t.content);
  }});
}
["hero","tabs","main"].forEach(id=>smoothEl(document.getElementById(id)));
const TAB_ORDER=["ansprueche","belege","termine"];
function famKey(){
  if(RECHNER) return "r";
  if(typeof USER!=="undefined" && !USER && !GUEST) return "login";
  if(typeof showPersons!=="undefined" && showPersons) return "persons";
  if(S.wiz) return "w:"+S.wiz.k;
  if(!S.done) return "q";
  return "tab:"+(typeof FALL_ID!=="undefined"?FALL_ID:"");
}
function screenIdx(){ return RECHNER?RECHNER.i : S.wiz?S.wiz.i : !S.done?S.step : TAB_ORDER.indexOf(S.tab) }
let lastFam=null, lastIdx=0, lastCash=null, figAnim=0;
function animateScreen(dir){
  if(RM) return; const m=$("main"); m.classList.remove("go-f","go-b","go-fade"); void m.offsetWidth; m.classList.add(dir);
}
function countFigure(){
  const f=document.querySelector("#hero .figure"); if(!f){ lastCash=null; return }
  const v=sums().cash; const from=lastCash; lastCash=v;
  if(from==null||from===v||RM) return;
  f.classList.remove("flash"); void f.offsetWidth; f.classList.add("flash");
  const t0=performance.now(), d=700;
  const step=now=>{ const p=Math.min(1,(now-t0)/d), e=1-Math.pow(1-p,3); f.textContent=eur(Math.round(from+(v-from)*e)); if(p<1) figAnim=requestAnimationFrame(step) };
  figAnim=requestAnimationFrame(step);
}
function reveal(el){
  if(!el) return; const r=el.getBoundingClientRect();
  if(r.top<70 || r.top>innerHeight*0.45) el.scrollIntoView({block:"start",behavior:RM?"auto":"smooth"});
}
function render(){
  const fam=famKey(), idx=screenIdx(), changed=lastFam!==null && (fam!==lastFam||idx!==lastIdx);
  if(changed){ const a=document.activeElement; if(a && a!==document.body && a.blur && !(a.closest&&a.closest("#hero"))) try{ a.blur() }catch(e){} }
  cancelAnimationFrame(figAnim);
  renderHero(); renderTabs(); renderMain(); try{ applyI18n(document.querySelector(".wrap")) }catch(e){}
  if(changed) animateScreen(fam===lastFam ? (idx>=lastIdx?"go-f":"go-b") : "go-fade");
  lastFam=fam; lastIdx=idx;
  countFigure();
}
function scrollTop(){ window.scrollTo({top:0,behavior:"instant"}) }

function sums(){
  const all=applicable(); const offen=all.filter(b=>!S.genutzt[b.k]);
  const cash=offen.filter(b=>b.cash && (S.status[b.k]||"offen")==="offen").reduce((s,b)=>s+(b.val()||0),0);
  const frei=offen.filter(b=>b.frei).reduce((s,b)=>s+b.frei(),0);
  return {all,offen,cash,frei};
}
function renderHero(){
  const save=`<div class="savestate"><span class="dot ${saveState.c}" id="savedot"></span><span id="savetxt">${esc(saveState.t)}</span></div>`;
  const brand=`<div class="brand"><span class="mark" aria-hidden="true">§</span><b>Dein Anspruch</b></div>`;
  const curF = USER && FAELLE.find(f=>f.id===FALL_ID);
  const personBtn = curF ? `<button type="button" class="acct person" data-act="persons" aria-expanded="${showPersons}">${ic("user")}${esc(fallName(curF))} ▾</button>` : "";
  const acct = USER?`<button type="button" class="acct" data-act="logout" title="${esc(USER.email||"")}">Abmelden</button>`:GUEST?`<button type="button" class="acct" data-act="guest-register">Konto anlegen</button>`:"";
  const fontsw=`<div class="fontsw" role="group" aria-label="Schriftgröße">${[["1","A"],["1.15","A+"],["1.3","A++"]].map(([v,t])=>`<button type="button" data-font="${v}" aria-pressed="${(S.font||"1")===v}" aria-label="Schrift ${t}">${t}</button>`).join("")}</div>`;
  if(S.wiz||RECHNER||(S.done&&S.tab!=="ansprueche")){ $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>`; return }
  if(!S.done){
    $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>
     <p class="lead">Pflegegrad oder Schwerbehinderung: Wir prüfen, welche Leistungen 2026 noch offen sind, schreiben die Anträge vor, sortieren deine Belege und erinnern an Fristen.</p>`;
    return;
  }
  const s=sums(); const dl=deadlines(); const crit=dl.find(x=>x.main&&!x.ok&&urg(x.d)!=="ok") || dl.find(x=>urg(x.d)==="late");
  const next=dl[0];
  $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>
   <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:4px">
     <span class="small" style="color:var(--hero-muted)">Noch offen an Geld und Budgets pro Jahr</span>
     <span class="figure">${eur(s.cash)}</span>
     ${s.frei?`<span class="small" style="color:var(--hero-muted)">plus ${eur(s.frei)} Steuerfreibeträge</span>`:""}
   </div>
   <div class="stats">
     <span class="stat">${ic("list")}<strong>${s.offen.length}</strong> offene Punkte</span>
     <span class="stat">${ic("receipt")}<strong>${BEL.length}</strong> Belege</span>
     ${crit?`<button type="button" class="stat alert" data-tab="termine" style="border:0;font:inherit;cursor:pointer">${ic("bell")}${esc(crit.t)}: ${urgTxt(crit.d)}</button>`: next?`<span class="stat">${ic("cal")}Nächste Frist ${urgTxt(next.d)}</span>`:""}
     <button type="button" class="stat" data-act="edit" style="border:0;font:inherit;color:inherit;cursor:pointer">${ic("user")}Angaben ändern</button>
   </div>`;
}
function renderTabs(){
  const t=$("tabs"); t.hidden=!S.done||!!S.wiz||!!RECHNER||(!USER&&!GUEST)||consentNeeded(); if(t.hidden) return;
  const dl=deadlines(); const att=dl.filter(x=>!x.ok && urg(x.d)!=="ok").length;
  const T=[["ansprueche","Ansprüche","list",0],["belege","Belege","receipt",0],["termine","Termine","cal",att]];
  t.innerHTML=T.map(([k,l,i,b])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${ic(i)}<span class="lbl">${l}</span>${b?`<span class="badge">${b}</span>`:""}</button>`).join("");
}
function renderMain(){
  document.documentElement.style.setProperty("--fs", S.font||"1");
  if(!loaded){ $("main").innerHTML=`<section class="panel"><p class="muted">Einen Moment, deine Daten werden geladen …</p></section>`; return }
  if(RECHNER){ $("main").innerHTML=viewRechner(); return }
  if(!USER && !GUEST){ $("main").innerHTML=viewLogin(); return }
  if(USER && showPersons){ $("main").innerHTML=viewPersons(); return }
  if(consentNeeded()){ $("main").innerHTML=viewConsent(); return }
  if(S.wiz && B.find(x=>x.k===S.wiz.k)){ $("main").innerHTML=viewWizard(); return }
  S.wiz=null;
  if(!S.done){
    const vs=visSteps(); if(S.step>=vs.length) S.step=vs.length-1;
    $("main").innerHTML=VIEWS[vs[S.step].id]();
  } else {
    $("main").innerHTML = S.tab==="belege"?viewBelege(): S.tab==="termine"?viewTermine(): viewAnsprueche();
  }
}
function stepper(){
  const vs=visSteps(); const n=S.step+1;
  return `<div class="stepper"><div class="meta"><span>Schritt ${n} von ${vs.length}</span><span>${vs[S.step].label}</span></div><div class="bar"><i style="width:${Math.round(n/vs.length*100)}%"></i></div></div>`;
}
/** @param {any} [canNext] wahr, wenn die Frage beantwortet ist @param {string} [nextLabel] @param {string} [why] */
function nav(canNext=true,nextLabel="Weiter",why="Bitte beantworte zuerst die Frage oben."){
  return `<p class="notice navwarn" id="navwarn" hidden>${ic("alert")}<span>${esc(why)}</span></p><div class="nav go">${S.step>0?`<button class="btn ghost" type="button" data-act="back">Zurück</button>`:"<span></span>"}<button class="btn big" type="button" data-act="next" data-ok="${canNext?1:0}">${nextLabel}</button></div>`;
}
const VIEWS = {
 start:()=>`<section class="panel">${stepper()}
   <div class="intro">
     <h2>Welche Hilfen stehen dir noch zu?</h2>
     <p>Viele Familien nutzen nur das Pflegegeld. Dabei sind oft mehrere tausend Euro im Jahr zusätzlich drin, etwa für Haushaltshilfe, Ersatzpflege oder Hilfsmittel.</p>
     <p class="muted">Ein paar Fragen, etwa 3 Minuten. Danach siehst du deine offenen Ansprüche mit fertigen Anträgen.</p>
   </div>
   <fieldset class="q"><legend>Für wen nutzt du die App?</legend><div class="choices">
     ${choice("rolle","selbst","Für mich selbst","ich bin pflegebedürftig oder schwerbehindert","radio",S.rolle==="selbst")}
     ${choice("rolle","angehoerig","Für eine angehörige Person","ich pflege oder kümmere mich","radio",S.rolle==="angehoerig")}
   </div></fieldset>
   <fieldset class="q"><legend>Worum geht es?</legend><p class="hint">Beides ist möglich.</p><div class="choices">
     ${choice("bereich","pflege","Pflegegrad / Pflegebedürftigkeit","","checkbox",S.bereiche.pflege)}
     ${choice("bereich","sb","Schwerbehinderung / GdB","","checkbox",S.bereiche.sb)}
   </div></fieldset>
   ${nav(S.rolle && (S.bereiche.pflege||S.bereiche.sb),"Los geht's", !S.rolle?"Bitte wähle zuerst oben aus, für wen du die App nutzt.":"Bitte wähle mindestens ein Thema aus: Pflegegrad oder Schwerbehinderung.")}
 </section>`,
 kasse:()=>`<section class="panel">${stepper()}
   <h2>Bei welcher Krankenkasse ${S.rolle==="angehoerig"?"ist die Person":"bist du"} versichert?</h2>
   <p class="muted">Die Pflegekasse gehört immer zur Krankenkasse. Dorthin gehen die Anträge.</p>
   <fieldset class="q"><legend class="sr">Krankenkasse</legend><div class="choices">
     ${Object.entries(KASSEN).map(([k,v])=>choice("kasse",k,v.name,"","radio",S.kasse===k)).join("")}
   </div></fieldset>
   ${S.kasse==="aok"?`<div class="field"><label for="aokRegion">Welche AOK?</label><select id="aokRegion"><option value="">Bitte wählen</option>${AOK_REGIONEN.map(r=>`<option ${S.aokRegion===r?"selected":""}>${r}</option>`).join("")}</select></div>`:""}
   ${S.kasse==="andere"?`<div class="field"><label for="kasseAndere">Name der Kasse</label><input type="text" id="kasseAndere" value="${esc(S.kasseAndere)}" placeholder="z. B. KNAPPSCHAFT, SBK"></div>`:""}
   <p class="notice info">${ic("info")}<span>Privat versichert? Die Leistungen der Pflegepflichtversicherung sind gleich hoch, Anträge gehen dann an die private Pflegeversicherung. Wähle „Andere“.</span></p>
   ${nav(!!S.kasse && (S.kasse!=="aok"||S.aokRegion))}
 </section>`,
 pflege:()=>`<section class="panel">${stepper()}
   <h2>Pflegegrad und Wohnsituation</h2>
   <fieldset class="q"><legend>Welcher Pflegegrad ist festgestellt?</legend><div class="choices">
     ${choice("pg","0","Noch keiner","oder Antrag läuft","radio",S.pg==="0")}
     ${[1,2,3,4,5].map(n=>choice("pg",String(n),"Pflegegrad "+n,["","geringe","erhebliche","schwere","schwerste","schwerste, besondere Anforderungen"][n]+" Beeinträchtigung","radio",S.pg===String(n))).join("")}
   </div></fieldset>
   <fieldset class="q"><legend>Wo und wie wird gepflegt?</legend><div class="choices">
     ${Object.entries(WOHNEN).map(([k,v])=>choice("wohnen",k,v.t,v.s,"radio",S.wohnen===k)).join("")}
   </div></fieldset>
   ${nav(S.pg!=="" && (S.wohnen || S.pg==="0"))}
 </section>`,
 pp:()=>`<section class="panel">${stepper()}
   <h2>Wer pflegt im Alltag?</h2>
   <p class="muted">Pflegende Angehörige haben eigene Ansprüche, etwa Rentenpunkte und Freistellung vom Job.</p>
   <fieldset class="q"><legend>Pflegt eine Angehörige oder ein Angehöriger mindestens 10 Stunden pro Woche, verteilt auf mindestens 2 Tage?</legend><div class="choices">
     ${choice("stunden10","ja","Ja","","radio",S.pp.stunden10==="ja")}${choice("stunden10","nein","Nein","","radio",S.pp.stunden10==="nein")}${choice("stunden10","unklar","Weiß nicht","","radio",S.pp.stunden10==="unklar")}
   </div></fieldset>
   <fieldset class="q"><legend>Ist die pflegende Person berufstätig?</legend><div class="choices">
     ${choice("arbeit","nein","Nein / Rente","","radio",S.pp.arbeit==="nein")}${choice("arbeit","bis30","Ja, bis 30 Std./Woche","","radio",S.pp.arbeit==="bis30")}${choice("arbeit","ueber30","Ja, mehr als 30 Std./Woche","","radio",S.pp.arbeit==="ueber30")}
   </div></fieldset>
   ${nav(S.pp.stunden10 && S.pp.arbeit)}
 </section>`,
 sb:()=>`<section class="panel">${stepper()}
   <h2>Schwerbehinderung</h2>
   <fieldset class="q"><legend>Gibt es einen festgestellten Grad der Behinderung (GdB)?</legend><div class="choices">
     ${choice("sbstatus","ja","Ja, Bescheid oder Ausweis","","radio",S.sb.status==="ja")}${choice("sbstatus","beantragt","Beantragt, noch kein Bescheid","","radio",S.sb.status==="beantragt")}${choice("sbstatus","nein","Nein","","radio",S.sb.status==="nein")}
   </div></fieldset>
   ${S.sb.status==="ja"?`
   <div class="field"><label for="gdb">GdB laut Bescheid</label><select id="gdb"><option value="">Bitte wählen</option>${[20,30,40,50,60,70,80,90,100].map(g=>`<option ${String(S.sb.gdb)===String(g)?"selected":""}>${g}</option>`).join("")}</select></div>
   <fieldset class="q"><legend>Merkzeichen im Ausweis</legend><p class="hint">Stehen auf der Rückseite des Ausweises.</p><div class="choices">
     ${Object.entries(MZ).map(([k,v])=>choice("mz",k,v,"","checkbox",!!S.sb.mz[k])).join("")}
   </div></fieldset>`:""}
   <fieldset class="q"><legend>Weitere Angaben</legend><div class="choices">
     ${choice("sbx","arbeit","Berufstätig","","checkbox",S.sb.arbeit)}
     ${choice("sbx","auto","Eigenes Auto (auf die Person zugelassen)","","checkbox",S.sb.auto)}
     ${choice("sbx","grundsicherung","Bezieht Grundsicherung oder Bürgergeld","","checkbox",S.sb.grundsicherung)}
   </div></fieldset>
   ${nav(S.sb.status && (S.sb.status!=="ja"||S.sb.gdb))}
 </section>`,
 genutzt:()=>{
   const list = applicable().filter(b=>!["beratung","pg_antrag","pg_hoch","sb_antrag","sb_neu","hzp","pug"].includes(b.k));
   return `<section class="panel">${stepper()}
   <h2>Was ${S.rolle==="angehoerig"?"bekommt ihr":"bekommst du"} schon?</h2>
   <p class="muted">Kreuze an, was bereits genutzt wird. Alles andere zeigen wir als offenen Anspruch.</p>
   ${list.length?`<div class="choices">${list.map(b=>choice("genutzt",b.k,b.t,b.p,"checkbox",!!S.genutzt[b.k])).join("")}</div>`:`<p class="notice info">${ic("info")}<span>Für diese Situation gibt es noch keine laufenden Leistungen.</span></p>`}
   ${nav(true)}
 </section>`},
 daten:()=>{const p=S.person, a=S.rolle==="angehoerig";
   return `<section class="panel">${stepper()}
   <h2>Angaben für die Anträge</h2>
   <p class="muted">Damit füllen wir die Schreiben vor. Felder dürfen leer bleiben. Die Daten liegen nur in deinem privaten Bereich.</p>
   <h3>${a?"Pflegebedürftige bzw. schwerbehinderte Person":"Deine Daten"}</h3>
   <div class="grid2">
     ${fld("name","Vor- und Nachname",p.name)}${fld("geb","Geburtsdatum",p.geb,"text","TT.MM.JJJJ")}
     ${fld("vnr","Versichertennummer",p.vnr,"text","steht auf der Gesundheitskarte")}${fld("strasse","Straße, Hausnr.",p.strasse)}
     ${fld("ort","PLZ, Ort",p.ort)}${!a?fld("tel","Telefon",p.tel,"tel")+fld("mail","E-Mail",p.mail,"email"):""}
   </div>
   ${a?`<h3>Absender (du als Angehörige/r)</h3><div class="grid2">
     ${fld("absender","Dein Name",p.absender)}${fld("beziehung","Beziehung",p.beziehung,"text","z. B. Tochter, Ehemann")}
     ${fld("absStrasse","Straße, Hausnr.",p.absStrasse)}${fld("absOrt","PLZ, Ort",p.absOrt)}
     ${fld("tel","Telefon",p.tel,"tel")}${fld("mail","E-Mail",p.mail,"email")}</div>
     <p class="notice">${ic("info")}<span>Wenn du für eine andere Person Anträge stellst, braucht die Kasse eine Vollmacht oder Betreuungsurkunde. Wir setzen sie automatisch auf die Checkliste.</span></p>`:""}
   ${nav(true,"Ergebnis anzeigen")}
 </section>`},
};
function fld(k,label,v,type="text",ph=""){return `<div class="field"><label for="p-${k}">${label}</label><input type="${type}" id="p-${k}" data-p="${k}" value="${esc(v)}" placeholder="${esc(ph)}"></div>`}

