import { installWeg, installieren } from "./24-app-installieren.js";
import { Z } from "./zustand.js";
import { blank, pg } from "./01-grundlagen.js";
import { B, applicable } from "./02-leistungen.js";
import { TODAY, addDays, isoD, parseIso } from "./03-hilfsmittel.js";
import { makeQuittung } from "./04-verhinderungspflege.js";
import { getQ, setQ, startWiz, wizSteps } from "./05-assistent.js";
import { saveBescheid, scanBescheid } from "./06-bescheid-entlastung.js";
import { startRechner } from "./07-pflegegrad-rechner.js";
import { tr } from "./09-sprachen.js";
import { selYears, visSteps } from "./10-fragebogen-und-fristen.js";
import { $, render, reveal, scrollTop } from "./11-darstellung.js";
import { curLetter } from "./12-reiter-ansprueche.js";
import { pdText } from "./14-reiter-termine.js";
import { makeCSV, makeMappe, makePDF } from "./15-pdf.js";
import { deleteBeleg, editBeleg, saveBeleg, startPending, toggleSubmitted } from "./16-belege-speichern.js";
import { bulkSave, importPdf } from "./17-sammel-pdf.js";
import { addPerson, blobUrl, deletePerson, giveConsent, loadMembers, lsSet, makeInvite, openFall, removeMember, save, startGuest } from "./19-speicher.js";
import { authAction, googleLogin, logout } from "./20-anmeldung.js";
import { backupData, restoreData, wipeAll } from "./21-sicherung-und-loeschen.js";
import { setEri } from "./22-erinnerungen.js";
import { closeFeedback, openFeedback, sendFeedback, shareApp } from "./23-feedback-und-fehler.js";
import { closeHilfe, openHilfe } from "./25-hilfe.js";

async function copy(text){
  try{await navigator.clipboard.writeText(text);toast("Text kopiert")}
  catch(e){const ta=document.querySelector("textarea[data-tx]"); if(ta){ta.focus();ta.select()} toast("Bitte Text markieren und kopieren (Strg+C)")}
}
Z.tT = undefined; export function toast(m){const t=$("toast");t.textContent=tr(m);t.hidden=false;clearTimeout(Z.tT);Z.tT=setTimeout(()=>t.hidden=true,2800)}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function start18() {
/* ---------- Events ---------- */
document.addEventListener("click", e=>{
  // Menü schließt, wenn daneben getippt wird
  const ziel=/** @type {HTMLElement} */(e.target);
  if(Z.showMenu && !ziel.closest("#hmenu,[data-act=menu]")){ Z.showMenu=false; render() }
  const t=/** @type {HTMLElement} */(/** @type {HTMLElement} */(e.target).closest("[data-act],[data-open],[data-copy],[data-pdf],[data-resettx],[data-tab],[data-area],[data-kat],[data-del],[data-delyes],[data-delno],[data-sub-toggle],[data-view],[data-delown],[data-year],[data-befpdf],[data-befcopy],[data-edit],[data-wopen],[data-wnav],[data-font],[data-gotoclaim],[data-rmember],[data-fbart]"));
  if(!t) return;
  const a=t.dataset.act;
  if(t.dataset.tab){if(t.classList.contains("howbtn"))Z.S.welcomeSeen=true;Z.S.tab=t.dataset.tab;Z.openKey=null;save();render();scrollTop();return}
  if(t.dataset.area){Z.areaFilter=t.dataset.area;render();return}
  if(t.dataset.act!=="menu" && !t.closest("#hmenu .fontsw")) Z.showMenu=false;
  if(t.dataset.gotoclaim){ Z.S.tab="ansprueche"; Z.openKey=t.dataset.gotoclaim; render(); const el=$("it-"+Z.openKey); el&&el.scrollIntoView({block:"start"}); return }
  if(t.dataset.rmember){ removeMember(t.dataset.rmember); return }
  if(t.dataset.font){ Z.S.font=t.dataset.font; save(); render(); return }
  if(t.dataset.edit){ editBeleg(t.dataset.edit); return }
  if(t.dataset.wopen){ startWiz(t.dataset.wopen); return }
  if(t.dataset.fbart){ openFeedback(t.dataset.fbart); return }
  if(t.dataset.wnav){ const n=t.dataset.wnav; const len=wizSteps().list.length;
    if(n==="close"){ const k=Z.S.wiz.k; Z.S.wiz=null; Z.openKey=k; save(); render(); const el=$("it-"+k); el&&el.scrollIntoView({block:"start"}); return }
    if(n==="next") Z.S.wiz.i=Math.min(len-1,Z.S.wiz.i+1);
    else if(n==="back") Z.S.wiz.i=Math.max(0,Z.S.wiz.i-1);
    else if(n.startsWith("goto:")) Z.S.wiz.i=Number(n.slice(5));
    save(); render(); scrollTop(); const f=document.querySelector(".wiz input[type=text],.wiz input[type=date],.wiz input[type=tel],.wiz textarea"); if(f&&!f.value) try{f.focus({preventScroll:true})}catch(e){} return }
  if(t.dataset.year){ const y=t.dataset.year; let cur=selYears(); cur=cur.includes(y)?cur.filter(x=>x!==y):[...cur,y]; if(!cur.length){toast("Mindestens ein Jahr auswählen");return} Z.S.belegFilter.jahre=cur; save(); render(); return }
  if(t.dataset.befpdf){ makeMappe(true,true,[t.dataset.befpdf]); return }
  if(t.dataset.befcopy){ Z.befJahr=t.dataset.befcopy; const L=curLetter(B.find(x=>x.k==="befreiung")); copy(`Betreff: ${L.subject}\n\n${L.body}`); return }
  if(t.dataset.kat!==undefined && t.classList.contains("chip")){Z.S.belegFilter.kat=t.dataset.kat;save();render();return}
  if(t.dataset.del){Z.delAsk=t.dataset.del;render();return}
  if(t.dataset.delno){Z.delAsk=null;render();return}
  if(t.dataset.delyes){deleteBeleg(t.dataset.delyes);return}
  if(t.dataset.subToggle){toggleSubmitted(t.dataset.subToggle);return}
  if(t.dataset.view){$("lbimg").src=blobUrl(t.dataset.view);$("lightbox").hidden=false;return}
  if(t.dataset.delown){Z.S.termine.eigene=(Z.S.termine.eigene||[]).filter(x=>x.id!==t.dataset.delown);save();render();return}
  if(t.dataset.open){Z.openKey = Z.openKey===t.dataset.open?null:t.dataset.open; render(); if(Z.openKey) reveal($("it-"+Z.openKey));return}
  if(t.dataset.copy){const b=B.find(x=>x.k===t.dataset.copy);const L=curLetter(b);copy(`Betreff: ${L.subject}\n\n${L.body}`);return}
  if(t.dataset.pdf){makePDF(B.find(x=>x.k===t.dataset.pdf));return}
  if(t.dataset.resettx){delete Z.S.texte[t.dataset.resettx];delete Z.S.texte[t.dataset.resettx+"_sub"];save();render();return}
  switch(a){
    case "next": { if(t.dataset.ok==="0"){ const w=$("navwarn"); if(w){ w.hidden=false; w.scrollIntoView({block:"center"}) } break }
      const vs=visSteps(); if(Z.S.step>=vs.length-1){Z.S.done=true;Z.S.tab="ansprueche";
        // Über eine Schnellstart-Kachel gekommen: direkt den gewählten Antrag öffnen, wenn er zur Lage passt
        const ziel=Z.S.ziel; Z.S.ziel="";
        if(ziel && applicable().some(b=>b.k===ziel && b.ask)){ Z.openKey=ziel; startWiz(ziel); break }
      } else Z.S.step++; save();render();scrollTop();break }
    case "back": Z.S.step=Math.max(0,Z.S.step-1);save();render();scrollTop();break;
    case "menu": Z.showMenu=!Z.showMenu; render(); break;
    case "edit": Z.showMenu=false; Z.S.done=false;Z.S.step=0;save();render();scrollTop();break;
    case "reset": $("resetconfirm").hidden=false;break;
    case "sent": { const k=t.dataset.k; Z.S.status[k]="beantragt"; Z.S.sent=Z.S.sent||{}; Z.S.sent[k]=isoD(TODAY()); const bb=B.find(x=>x.k===k);
      Z.S.termine.eigene=[...(Z.S.termine.eigene||[]),{id:String(Date.now()),t:`Antwort auf Antrag „${bb?bb.t:k}“ da?`,d:isoD(addDays(TODAY(),28)),n:"Falls noch keine Antwort da ist: bei der Kasse nachfragen. Das Datum des Antrags steht in der App."}];
      save(); render(); toast("Super! Wir erinnern dich in 4 Wochen."); break }
    case "dropphoto": if(Z.pending){ if(Z.pending.preview&&Z.pending.preview.startsWith("blob:")) URL.revokeObjectURL(Z.pending.preview); Z.pending.file=null; Z.pending.preview=""; if(Z.pending.keepAsset) Z.pending.dropAsset=true; render() } break;
    case "bes-cam": Z.fileTarget="bescheid"; $("fileCam").value=""; $("fileCam").click(); break;
    case "bes-manual": case "bes-edit": Z.bescheidDraft={...(Z.S.bescheid||{}), pg:(Z.S.bescheid&&Z.S.bescheid.pg)||String(pg()||"")}; Z.ocrMsg=""; render(); break;
    case "bes-cancel": Z.bescheidDraft=null; Z.ocrMsg=""; render(); break;
    case "bes-save": saveBescheid(); break;
    case "entl-add": Z.S.tab="belege"; Z.pending=null; startPending(null); if(Z.pending){ Z.pending.kat="entl"; render() } scrollTop(); break;
    case "r-start": startRechner(); break;
    case "r-next": Z.RECHNER.i++; render(); scrollTop(); break;
    case "r-back": Z.RECHNER.i=Math.max(0,Z.RECHNER.i-1); render(); scrollTop(); break;
    case "r-close": Z.RECHNER=null; render(); scrollTop(); break;
    case "r-neu": startRechner(); break;
    case "r-antrag": { const k=pg()?"pg_hoch":"pg_antrag"; Z.RECHNER=null; Z.S.bereiche.pflege=true; if(!Z.S.done){ Z.S.done=true } startWiz(k); break }
    case "r-konto": Z.RECHNER=null; if(typeof Z.authMode!=="undefined"){ Z.authMode="register"; Z.authMsg="Lege ein kostenloses Konto an. Danach hilft dir die App Schritt für Schritt beim Antrag." } render(); scrollTop(); break;
    case "au-google": googleLogin(); break;
    case "au-login": case "au-register": case "au-forgot": case "au-newpw": authAction(a); break;
    case "au-mode": Z.authMode=t.dataset.mode; Z.authMsg=""; render(); break;
    case "au-show": { const p=$("au-pw"), p2=$("au-pw2"); if(p){ p.type=p.type==="password"?"text":"password"; if(p2) p2.type=p.type; t.textContent=p.type==="password"?"Zeigen":"Verbergen" } break }
    case "au-newpw-abbruch": Z.RECOVERY=false; Z.authMsg=""; try{ history.replaceState(null,"",location.pathname) }catch(e){} render(); scrollTop(); break;
    case "inst-ja": installieren(); break;
    case "inst-weg": installWeg(); break;
    case "pw-aendern": Z.RECOVERY=true; Z.authMsg=""; render(); scrollTop(); break;
    case "au-guest": lsSet("dein-anspruch-modus","gast"); startGuest(); scrollTop(); break;
    case "schnell": { const k=t.dataset.ziel||""; lsSet("dein-anspruch-modus","gast"); startGuest();
      // Fragebogen schon ausgefüllt (früherer Besuch ohne Konto): gleich zum Antrag
      if(Z.S.done && applicable().some(b=>b.k===k && b.ask)){ Z.S.tab="ansprueche"; Z.openKey=k; startWiz(k); break }
      Z.S.ziel=k; Z.S.done=false; Z.S.step=0; if(/^sb_/.test(k)) Z.S.bereiche={pflege:false,sb:true}; else Z.S.bereiche.pflege=true;
      save(); render(); scrollTop(); break }
    case "hilfe-open": Z.showMenu=false; render(); openHilfe(); break;
    case "hilfe-close": closeHilfe(); break;
    case "guest-register": Z.GUEST=false; Z.authMode="register"; Z.authMsg=""; lsSet("dein-anspruch-modus",""); render(); scrollTop(); break;
    case "logout": logout(); break;
    case "cs-yes": giveConsent(); break;
    case "fb-open": closeHilfe(); openFeedback(); break;
    case "fb-close": closeFeedback(); break;
    case "fb-send": sendFeedback(); break;
    case "teilen": shareApp(); break;
    case "eri-on": setEri(true,($("eri-mail")||{}).value); break;
    case "eri-off": setEri(false); break;
    case "persons": Z.showPersons=!Z.showPersons; Z.delPersonAsk=false; if(Z.showPersons) loadMembers(); render(); scrollTop(); break;
    case "add-person": addPerson(); break;
    case "invite": makeInvite(); break;
    case "inv-copy": copy(Z.inviteLink); break;
    case "del-person": Z.delPersonAsk=true; render(); break;
    case "del-person-no": Z.delPersonAsk=false; render(); break;
    case "del-person-yes": deletePerson(); break;
    case "wipe": Z.wipeAsk=true; render(); { const w=$("wipe-word"); if(w) try{ w.focus({preventScroll:true}) }catch(e){} } break;
    case "wipe-no": Z.wipeAsk=false; render(); break;
    case "wipe-yes": wipeAll(); break;
    case "backup": backupData(); break;
    case "restore": { const f=$("fileJson"); if(f){ f.value=""; f.click() } break }
    case "welcome-ok": Z.S.welcomeSeen=true;save();render();break;
    case "vhp-quittung": makeQuittung();break;
    case "reset-no": $("resetconfirm").hidden=true;break;
    case "reset-yes": Z.S=blank();Z.openKey=null;save();render();scrollTop();break;
    case "cam": $("fileCam").value="";$("fileCam").click();break;
    case "pick": $("fileAny").value="";$("fileAny").click();break;
    case "manual": startPending(null);break;
    case "cancelbeleg": if(Z.pending&&Z.pending.preview&&Z.pending.preview.startsWith("blob:")) URL.revokeObjectURL(Z.pending.preview); Z.pending=null;render();break;
    case "savebeleg": saveBeleg();break;
    case "bulk-save": bulkSave();break;
    case "bulk-cancel": Z.bulk=null;render();break;
    case "bulk-single": { const f=Z.bulk&&Z.bulk.file; Z.bulk=null; startPending(f); break }
    case "mappe": makeMappe(false,false);break;
    case "csv": makeCSV();break;
    case "addbesuch": { const v=$("tbesuch").value; if(!parseIso(v)){toast("Bitte ein Datum wählen");break} Z.S.termine.besuche=[...(Z.S.termine.besuche||[]),{d:v}];save();render();toast("Besuch eingetragen");break }
    case "copypd": copy(pdText());break;
    case "addown": { const tt=$("ownt").value.trim(), d=$("ownd").value; if(!tt||!parseIso(d)){toast("Bitte Text und Datum angeben");break} Z.S.termine.eigene=[...(Z.S.termine.eigene||[]),{id:String(Date.now()),t:tt,d}];save();render();toast("Erinnerung hinzugefügt");break }
  }
});
document.addEventListener("change", e=>{
  const t=/** @type {HTMLInputElement} */(e.target), n=t.name;
  if(t.id==="langsel"){ Z.LANG=t.value; try{localStorage.setItem("da-lang",JSON.stringify(Z.LANG))}catch(e){} render(); return }
  if(t.dataset.plz){ if(/^\d{5}$/.test(t.value.trim())){ Z.S.plz=t.value.trim(); save(); render() } return }
  if(t.dataset.rq!=null && Z.RECHNER){ Z.RECHNER.a[Z.RECHNER.i]=t.dataset.rq; render(); setTimeout(()=>{ if(Z.RECHNER && Z.RECHNER.a[Z.RECHNER.i]!=null){ Z.RECHNER.i++; render(); scrollTop() } },180); return }
  if(t.id==="fileJson"){ const f=t.files&&t.files[0]; if(f && typeof restoreData==="function") restoreData(f); return }
  if(t.id==="fileCam"||t.id==="fileAny"){ const f=t.files&&t.files[0]; if(f){ if(Z.fileTarget==="bescheid"){ Z.fileTarget=null; scanBescheid(f) } else if(!Z.pending && (f.type==="application/pdf"||/\.pdf$/i.test(f.name||""))) importPdf(f); else startPending(f) } return }
  if(t.dataset.bd && Z.bescheidDraft){ Z.bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.bi && Z.bulk && Z.bulk.items){ const [i,f]=t.dataset.bi.split(":"); const it=Z.bulk.items[+i]; if(it){ it[f]=t.type==="checkbox"?t.checked:t.value; render() } return }
  if(t.dataset.fall){ openFall(t.dataset.fall); scrollTop(); return }
  if(t.id==="entl-seit"){ Z.S.entlSeit=t.value; save(); render(); return }
  if(t.dataset.wq && t.type==="radio"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render(); const k=Z.S.wiz.k, i=Z.S.wiz.i; setTimeout(()=>{ if(Z.S.wiz&&Z.S.wiz.k===k&&Z.S.wiz.i===i){ const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() } },200) } return }
  if(t.dataset.wqm){ const q=wizSteps().list.find(x=>x.k===t.dataset.wqm); if(q){ const cur=Array.isArray(getQ(q))?getQ(q):[]; setQ(q, t.checked?[...cur,t.value]:cur.filter(x=>x!==t.value)); render() } return }
  if(t.dataset.wq && t.type==="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render() } return }
  if(n==="rolle") Z.S.rolle=t.value;
  else if(n==="bereich") Z.S.bereiche[t.value]=t.checked;
  else if(n==="kasse") Z.S.kasse=t.value;
  else if(t.id==="aokRegion") Z.S.aokRegion=t.value;
  else if(n==="pg") Z.S.pg=t.value;
  else if(n==="wohnen") Z.S.wohnen=t.value;
  else if(n==="stunden10") Z.S.pp.stunden10=t.value;
  else if(n==="arbeit") Z.S.pp.arbeit=t.value;
  else if(n==="sbstatus") Z.S.sb.status=t.value;
  else if(t.id==="gdb") Z.S.sb.gdb=t.value;
  else if(n==="mz") Z.S.sb.mz[t.value]=t.checked;
  else if(n==="sbx") Z.S.sb[t.value]=t.checked;
  else if(n==="genutzt") Z.S.genutzt[t.value]=t.checked;
  else if(t.dataset.check){ Z.S.checks[t.dataset.check]=t.checked; save(); return }
  else if(t.dataset.status) Z.S.status[t.dataset.status]=t.value;
  else if(t.dataset.gen) {Z.S.genutzt[t.dataset.gen]=t.checked; Z.openKey=null}
  else if(t.id==="chron") Z.S.chronisch=t.value;
  else if(t.dataset.brutto){ Z.S.bruttoJahr={...(Z.S.bruttoJahr||{}),[t.dataset.brutto]:t.value} }
  else if(t.dataset.vhp){ Z.S.vhp[t.dataset.vhp]=t.value; delete Z.S.texte.jahresbetrag; delete Z.S.texte.jahresbetrag_sub }
  else if(t.id==="twm") Z.S.termine.wertmarke=t.value;
  else if(t.dataset.pend){ Z.pending[t.dataset.pend]=t.value; if(t.type==="radio") render(); return }
  else return;
  save(); render();
});
document.addEventListener("input", e=>{
  const t=/** @type {HTMLInputElement} */(e.target);
  if(t.dataset.wq && t.type!=="radio" && t.type!=="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); const sk=document.querySelector('.wiz [data-wnav="next"].ghost'); if(sk) sk.hidden=!!t.value.trim() } return }
  if(t.dataset.bd && Z.bescheidDraft){ Z.bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.bi && Z.bulk && Z.bulk.items && t.type!=="checkbox"){ const [i,f]=t.dataset.bi.split(":"); const it=Z.bulk.items[+i]; if(it) it[f]=t.value; return }
  if(t.dataset.wqp){ Z.S.person[t.dataset.wqp]=t.value; save(); return }
  if(t.id==="kasseAndere"){Z.S.kasseAndere=t.value;save()}
  else if(t.dataset.p){Z.S.person[t.dataset.p]=t.value;save()}
  else if(t.dataset.tx){Z.S.texte[t.dataset.tx]=t.value;save()}
  else if(t.dataset.sub){Z.S.texte[t.dataset.sub+"_sub"]=t.value;save()}
  else if(t.dataset.pend){Z.pending[t.dataset.pend]=t.value}
  else if(t.dataset.vhp && t.type!=="radio"){Z.S.vhp[t.dataset.vhp]=t.value;save()}
  else if(t.id==="tdienst"){Z.S.termine.dienst=t.value;save()}
  else if(t.id==="ttel"){Z.S.termine.tel=t.value;save()}
});
document.addEventListener("dragover", e=>{const tg=/** @type {HTMLElement} */(e.target); const d=tg.closest&&tg.closest("#drop"); if(d&&Z.ASSETS){e.preventDefault();d.classList.add("over")}});
document.addEventListener("dragleave", e=>{const tg=/** @type {HTMLElement} */(e.target); const d=tg.closest&&tg.closest("#drop"); if(d) d.classList.remove("over")});
document.addEventListener("drop", e=>{const tg=/** @type {HTMLElement} */(e.target); const d=tg.closest&&tg.closest("#drop"); if(d&&Z.ASSETS){e.preventDefault();const f=e.dataTransfer.files[0]; if(f) startPending(f)}});
$("lbclose").onclick=()=>{$("lightbox").hidden=true};
$("lightbox").onclick=e=>{if(/** @type {HTMLElement} */(e.target).id==="lightbox") $("lightbox").hidden=true};
document.addEventListener("keydown",e=>{ const tg=/** @type {HTMLElement} */(e.target);if(e.key==="Escape"){ $("lightbox").hidden=true; const fb=$("fbbox"); if(fb) fb.hidden=true }
  if(e.key==="Enter" && tg.closest && tg.closest(".auth") && tg.tagName==="INPUT"){ e.preventDefault(); const b=document.querySelector('.auth .btn.big'); b&&b.click(); return }
  if(e.key==="Enter" && Z.S.wiz && tg.matches && tg.matches(".wiz input")){ e.preventDefault(); const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() }});
}
