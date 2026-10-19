/* ---------- Events ---------- */
document.addEventListener("click", e=>{
  const t=e.target.closest("[data-act],[data-open],[data-copy],[data-pdf],[data-resettx],[data-tab],[data-area],[data-kat],[data-del],[data-delyes],[data-delno],[data-sub-toggle],[data-view],[data-delown],[data-year],[data-befpdf],[data-befcopy],[data-edit],[data-wopen],[data-wnav],[data-font],[data-gotoclaim],[data-rmember]");
  if(!t) return;
  const a=t.dataset.act;
  if(t.dataset.tab){if(t.classList.contains("howbtn"))S.welcomeSeen=true;S.tab=t.dataset.tab;openKey=null;save();render();scrollTop();return}
  if(t.dataset.area){areaFilter=t.dataset.area;render();return}
  if(t.dataset.gotoclaim){ S.tab="ansprueche"; openKey=t.dataset.gotoclaim; render(); const el=$("it-"+openKey); el&&el.scrollIntoView({block:"start"}); return }
  if(t.dataset.rmember){ removeMember(t.dataset.rmember); return }
  if(t.dataset.font){ S.font=t.dataset.font; save(); render(); return }
  if(t.dataset.edit){ editBeleg(t.dataset.edit); return }
  if(t.dataset.wopen){ startWiz(t.dataset.wopen); return }
  if(t.dataset.wnav){ const n=t.dataset.wnav; const len=wizSteps().list.length;
    if(n==="close"){ const k=S.wiz.k; S.wiz=null; openKey=k; save(); render(); const el=$("it-"+k); el&&el.scrollIntoView({block:"start"}); return }
    if(n==="next") S.wiz.i=Math.min(len-1,S.wiz.i+1);
    else if(n==="back") S.wiz.i=Math.max(0,S.wiz.i-1);
    else if(n.startsWith("goto:")) S.wiz.i=Number(n.slice(5));
    save(); render(); scrollTop(); const f=document.querySelector(".wiz input[type=text],.wiz input[type=date],.wiz input[type=tel],.wiz textarea"); if(f&&!f.value) try{f.focus({preventScroll:true})}catch(e){} return }
  if(t.dataset.year){ const y=t.dataset.year; let cur=selYears(); cur=cur.includes(y)?cur.filter(x=>x!==y):[...cur,y]; if(!cur.length){toast("Mindestens ein Jahr auswählen");return} S.belegFilter.jahre=cur; save(); render(); return }
  if(t.dataset.befpdf){ makeMappe(true,true,[t.dataset.befpdf]); return }
  if(t.dataset.befcopy){ befJahr=t.dataset.befcopy; const L=curLetter(B.find(x=>x.k==="befreiung")); copy(`Betreff: ${L.subject}\n\n${L.body}`); return }
  if(t.dataset.kat!==undefined && t.classList.contains("chip")){S.belegFilter.kat=t.dataset.kat;save();render();return}
  if(t.dataset.del){delAsk=t.dataset.del;render();return}
  if(t.dataset.delno){delAsk=null;render();return}
  if(t.dataset.delyes){deleteBeleg(t.dataset.delyes);return}
  if(t.dataset.subToggle){toggleSubmitted(t.dataset.subToggle);return}
  if(t.dataset.view){$("lbimg").src=blobUrl(t.dataset.view);$("lightbox").hidden=false;return}
  if(t.dataset.delown){S.termine.eigene=(S.termine.eigene||[]).filter(x=>x.id!==t.dataset.delown);save();render();return}
  if(t.dataset.open){openKey = openKey===t.dataset.open?null:t.dataset.open; render(); if(openKey) reveal($("it-"+openKey));return}
  if(t.dataset.copy){const b=B.find(x=>x.k===t.dataset.copy);const L=curLetter(b);copy(`Betreff: ${L.subject}\n\n${L.body}`);return}
  if(t.dataset.pdf){makePDF(B.find(x=>x.k===t.dataset.pdf));return}
  if(t.dataset.resettx){delete S.texte[t.dataset.resettx];delete S.texte[t.dataset.resettx+"_sub"];save();render();return}
  switch(a){
    case "next": { if(t.dataset.ok==="0"){ const w=$("navwarn"); if(w){ w.hidden=false; w.scrollIntoView({block:"center",behavior:"smooth"}) } break }
      const vs=visSteps(); if(S.step>=vs.length-1){S.done=true;S.tab="ansprueche"} else S.step++; save();render();scrollTop();break }
    case "back": S.step=Math.max(0,S.step-1);save();render();scrollTop();break;
    case "edit": S.done=false;S.step=0;save();render();scrollTop();break;
    case "reset": $("resetconfirm").hidden=false;break;
    case "sent": { const k=t.dataset.k; S.status[k]="beantragt"; S.sent=S.sent||{}; S.sent[k]=isoD(TODAY()); const bb=B.find(x=>x.k===k);
      S.termine.eigene=[...(S.termine.eigene||[]),{id:String(Date.now()),t:`Antwort auf Antrag „${bb?bb.t:k}“ da?`,d:isoD(addDays(TODAY(),28)),n:"Falls noch keine Antwort da ist: bei der Kasse nachfragen. Das Datum des Antrags steht in der App."}];
      save(); render(); toast("Super! Wir erinnern dich in 4 Wochen."); break }
    case "dropphoto": if(pending){ if(pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview); pending.file=null; pending.preview=""; if(pending.keepAsset) pending.dropAsset=true; render() } break;
    case "bes-cam": fileTarget="bescheid"; $("fileCam").value=""; $("fileCam").click(); break;
    case "bes-manual": case "bes-edit": bescheidDraft={...(S.bescheid||{}), pg:(S.bescheid&&S.bescheid.pg)||String(pg()||"")}; ocrMsg=""; render(); break;
    case "bes-cancel": bescheidDraft=null; ocrMsg=""; render(); break;
    case "bes-save": saveBescheid(); break;
    case "entl-add": S.tab="belege"; pending=null; startPending(null); if(pending){ pending.kat="entl"; render() } scrollTop(); break;
    case "r-start": startRechner(); break;
    case "r-next": RECHNER.i++; render(); scrollTop(); break;
    case "r-back": RECHNER.i=Math.max(0,RECHNER.i-1); render(); scrollTop(); break;
    case "r-close": RECHNER=null; render(); scrollTop(); break;
    case "r-neu": startRechner(); break;
    case "r-antrag": { const k=pg()?"pg_hoch":"pg_antrag"; RECHNER=null; S.bereiche.pflege=true; if(!S.done){ S.done=true } startWiz(k); break }
    case "r-konto": RECHNER=null; if(typeof authMode!=="undefined"){ authMode="register"; authMsg="Lege ein kostenloses Konto an. Danach hilft dir die App Schritt für Schritt beim Antrag." } render(); scrollTop(); break;
    case "au-google": googleLogin(); break;
    case "au-login": case "au-register": case "au-forgot": case "au-newpw": authAction(a); break;
    case "au-mode": authMode=t.dataset.mode; authMsg=""; render(); break;
    case "au-show": { const p=$("au-pw"); if(p){ p.type=p.type==="password"?"text":"password"; t.textContent=p.type==="password"?"Zeigen":"Verbergen" } break }
    case "au-guest": lsSet("dein-anspruch-modus","gast"); startGuest(); scrollTop(); break;
    case "guest-register": GUEST=false; authMode="register"; authMsg=""; lsSet("dein-anspruch-modus",""); render(); scrollTop(); break;
    case "logout": logout(); break;
    case "cs-yes": giveConsent(); break;
    case "fb-open": openFeedback(); break;
    case "fb-close": closeFeedback(); break;
    case "fb-send": sendFeedback(); break;
    case "teilen": shareApp(); break;
    case "eri-on": setEri(true,($("eri-mail")||{}).value); break;
    case "eri-off": setEri(false); break;
    case "persons": showPersons=!showPersons; delPersonAsk=false; if(showPersons) loadMembers(); render(); scrollTop(); break;
    case "add-person": addPerson(); break;
    case "invite": makeInvite(); break;
    case "inv-copy": copy(inviteLink); break;
    case "del-person": delPersonAsk=true; render(); break;
    case "del-person-no": delPersonAsk=false; render(); break;
    case "del-person-yes": deletePerson(); break;
    case "wipe": wipeAsk=true; render(); { const w=$("wipe-word"); if(w) try{ w.focus({preventScroll:true}) }catch(e){} } break;
    case "wipe-no": wipeAsk=false; render(); break;
    case "wipe-yes": wipeAll(); break;
    case "backup": backupData(); break;
    case "restore": { const f=$("fileJson"); if(f){ f.value=""; f.click() } break }
    case "welcome-ok": S.welcomeSeen=true;save();render();break;
    case "vhp-quittung": makeQuittung();break;
    case "reset-no": $("resetconfirm").hidden=true;break;
    case "reset-yes": S=blank();openKey=null;save();render();scrollTop();break;
    case "cam": $("fileCam").value="";$("fileCam").click();break;
    case "pick": $("fileAny").value="";$("fileAny").click();break;
    case "manual": startPending(null);break;
    case "cancelbeleg": if(pending&&pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview); pending=null;render();break;
    case "savebeleg": saveBeleg();break;
    case "bulk-save": bulkSave();break;
    case "bulk-cancel": bulk=null;render();break;
    case "bulk-single": { const f=bulk&&bulk.file; bulk=null; startPending(f); break }
    case "mappe": makeMappe(false,false);break;
    case "csv": makeCSV();break;
    case "addbesuch": { const v=$("tbesuch").value; if(!parseIso(v)){toast("Bitte ein Datum wählen");break} S.termine.besuche=[...(S.termine.besuche||[]),{d:v}];save();render();toast("Besuch eingetragen");break }
    case "copypd": copy(pdText());break;
    case "addown": { const tt=$("ownt").value.trim(), d=$("ownd").value; if(!tt||!parseIso(d)){toast("Bitte Text und Datum angeben");break} S.termine.eigene=[...(S.termine.eigene||[]),{id:String(Date.now()),t:tt,d}];save();render();toast("Erinnerung hinzugefügt");break }
  }
});
document.addEventListener("change", e=>{
  const t=e.target, n=t.name;
  if(t.id==="langsel"){ LANG=t.value; try{localStorage.setItem("da-lang",JSON.stringify(LANG))}catch(e){} render(); return }
  if(t.dataset.plz){ if(/^\d{5}$/.test(t.value.trim())){ S.plz=t.value.trim(); save(); render() } return }
  if(t.dataset.rq!=null && RECHNER){ RECHNER.a[RECHNER.i]=t.dataset.rq; render(); setTimeout(()=>{ if(RECHNER && RECHNER.a[RECHNER.i]!=null){ RECHNER.i++; render(); scrollTop() } },350); return }
  if(t.id==="fileJson"){ const f=t.files&&t.files[0]; if(f && typeof restoreData==="function") restoreData(f); return }
  if(t.id==="fileCam"||t.id==="fileAny"){ const f=t.files&&t.files[0]; if(f){ if(fileTarget==="bescheid"){ fileTarget=null; scanBescheid(f) } else if(!pending && (f.type==="application/pdf"||/\.pdf$/i.test(f.name||""))) importPdf(f); else startPending(f) } return }
  if(t.dataset.bd && bescheidDraft){ bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.bi && bulk && bulk.items){ const [i,f]=t.dataset.bi.split(":"); const it=bulk.items[+i]; if(it){ it[f]=t.type==="checkbox"?t.checked:t.value; render() } return }
  if(t.dataset.fall){ openFall(t.dataset.fall); scrollTop(); return }
  if(t.id==="entl-seit"){ S.entlSeit=t.value; save(); render(); return }
  if(t.dataset.wq && t.type==="radio"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render(); const k=S.wiz.k, i=S.wiz.i; setTimeout(()=>{ if(S.wiz&&S.wiz.k===k&&S.wiz.i===i){ const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() } },420) } return }
  if(t.dataset.wqm){ const q=wizSteps().list.find(x=>x.k===t.dataset.wqm); if(q){ const cur=Array.isArray(getQ(q))?getQ(q):[]; setQ(q, t.checked?[...cur,t.value]:cur.filter(x=>x!==t.value)); render() } return }
  if(t.dataset.wq && t.type==="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render() } return }
  if(n==="rolle") S.rolle=t.value;
  else if(n==="bereich") S.bereiche[t.value]=t.checked;
  else if(n==="kasse") S.kasse=t.value;
  else if(t.id==="aokRegion") S.aokRegion=t.value;
  else if(n==="pg") S.pg=t.value;
  else if(n==="wohnen") S.wohnen=t.value;
  else if(n==="stunden10") S.pp.stunden10=t.value;
  else if(n==="arbeit") S.pp.arbeit=t.value;
  else if(n==="sbstatus") S.sb.status=t.value;
  else if(t.id==="gdb") S.sb.gdb=t.value;
  else if(n==="mz") S.sb.mz[t.value]=t.checked;
  else if(n==="sbx") S.sb[t.value]=t.checked;
  else if(n==="genutzt") S.genutzt[t.value]=t.checked;
  else if(t.dataset.check){ S.checks[t.dataset.check]=t.checked; save(); return }
  else if(t.dataset.status) S.status[t.dataset.status]=t.value;
  else if(t.dataset.gen) {S.genutzt[t.dataset.gen]=t.checked; openKey=null}
  else if(t.id==="chron") S.chronisch=t.value;
  else if(t.dataset.brutto){ S.bruttoJahr={...(S.bruttoJahr||{}),[t.dataset.brutto]:t.value} }
  else if(t.dataset.vhp){ S.vhp[t.dataset.vhp]=t.value; delete S.texte.jahresbetrag; delete S.texte.jahresbetrag_sub }
  else if(t.id==="twm") S.termine.wertmarke=t.value;
  else if(t.dataset.pend){ pending[t.dataset.pend]=t.value; if(t.type==="radio") render(); return }
  else return;
  save(); render();
});
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.wq && t.type!=="radio" && t.type!=="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); const sk=document.querySelector('.wiz [data-wnav="next"].ghost'); if(sk) sk.hidden=!!t.value.trim() } return }
  if(t.dataset.bd && bescheidDraft){ bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.bi && bulk && bulk.items && t.type!=="checkbox"){ const [i,f]=t.dataset.bi.split(":"); const it=bulk.items[+i]; if(it) it[f]=t.value; return }
  if(t.dataset.wqp){ S.person[t.dataset.wqp]=t.value; save(); return }
  if(t.id==="kasseAndere"){S.kasseAndere=t.value;save()}
  else if(t.dataset.p){S.person[t.dataset.p]=t.value;save()}
  else if(t.dataset.tx){S.texte[t.dataset.tx]=t.value;save()}
  else if(t.dataset.sub){S.texte[t.dataset.sub+"_sub"]=t.value;save()}
  else if(t.dataset.pend){pending[t.dataset.pend]=t.value}
  else if(t.dataset.vhp && t.type!=="radio"){S.vhp[t.dataset.vhp]=t.value;save()}
  else if(t.id==="tdienst"){S.termine.dienst=t.value;save()}
  else if(t.id==="ttel"){S.termine.tel=t.value;save()}
});
document.addEventListener("dragover", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d&&ASSETS){e.preventDefault();d.classList.add("over")}});
document.addEventListener("dragleave", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d) d.classList.remove("over")});
document.addEventListener("drop", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d&&ASSETS){e.preventDefault();const f=e.dataTransfer.files[0]; if(f) startPending(f)}});
$("lbclose").onclick=()=>{$("lightbox").hidden=true};
$("lightbox").onclick=e=>{if(e.target.id==="lightbox") $("lightbox").hidden=true};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){ $("lightbox").hidden=true; const fb=$("fbbox"); if(fb) fb.hidden=true }
  if(e.key==="Enter" && e.target.closest && e.target.closest(".auth") && e.target.tagName==="INPUT"){ e.preventDefault(); const b=document.querySelector('.auth .btn.big'); b&&b.click(); return }
  if(e.key==="Enter" && S.wiz && e.target.matches && e.target.matches(".wiz input")){ e.preventDefault(); const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() }});

async function copy(text){
  try{await navigator.clipboard.writeText(text);toast("Text kopiert")}
  catch(e){const ta=document.querySelector("textarea[data-tx]"); if(ta){ta.focus();ta.select()} toast("Bitte Text markieren und kopieren (Strg+C)")}
}
let tT; function toast(m){const t=$("toast");t.textContent=tr(m);t.hidden=false;clearTimeout(tT);tT=setTimeout(()=>t.hidden=true,2800)}

