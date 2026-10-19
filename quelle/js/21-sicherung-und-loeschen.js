import { Z } from "./zustand.js";
import { blank } from "./01-grundlagen.js";
import { TODAY, ic, isoD } from "./03-hilfsmittel.js";
import { $, render } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
import { createFall, fallName, loadFaelle, lsSet, merge, openFall, save } from "./19-speicher.js";
import { logout } from "./20-anmeldung.js";
/* ---------- Sicherung herunterladen und wieder einspielen, Konto löschen ---------- */
Z.wipeAsk = false; Z.wipeBusy = false; Z.dataBusy = "";
function WIPE_WORD(v) { return /^l(ö|oe|o)schen$/i.test(String(v||"").trim()); }
export async function wipeAll(){
  const w=$("wipe-word"); if(!w || !WIPE_WORD(w.value)){ toast("Bitte zum Bestätigen das Wort LÖSCHEN eintippen."); if(w) w.focus(); return }
  if(Z.wipeBusy) return;
  if(!Z.USER){ Z.wipeAsk=false; lsSet("dein-anspruch-gast",null); Z.S=blank(); Z.BEL=[]; render(); toast("Alle Angaben auf diesem Gerät wurden gelöscht."); return }
  Z.wipeBusy=true; render();
  let ok=false;
  try{ const {data,error}=await Z.sb.functions.invoke("konto-loeschen",{body:{bestaetigung:"LÖSCHEN"}}); ok=!error && data && data.ok }catch(e){}
  Z.wipeBusy=false;
  if(!ok){ toast("Löschen hat nicht geklappt. Es wurde nichts gelöscht. Bitte später noch einmal versuchen."); return render() }
  Z.wipeAsk=false; lsSet("dein-anspruch-gast",null); lsSet("dein-anspruch-mail",null);
  try{ for(const k of Object.keys(localStorage)) if(/^da-(ui|fall)-/.test(k)) localStorage.removeItem(k) }catch(e){}
  await logout();
  toast("Dein Konto und alle Daten wurden gelöscht.");
}

function blobToDataUrl(b) { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b) }); }
function cleanData(d){ const x=JSON.parse(JSON.stringify(d||{})); delete x.wiz; delete x.updated; return x }
export async function backupData(){
  if(Z.dataBusy) return; Z.dataBusy="backup"; render();
  try{
    const out={app:"dein-anspruch",version:1,exportiert:new Date().toISOString(),personen:[]};
    const list=Z.USER?Z.FAELLE:[{id:null,data:Z.S}];
    for(const f of list){
      const data=cleanData(f.id===Z.FALL_ID||!Z.USER?Z.S:f.data); const belege=[];
      if(Z.USER){
        const {data:rows}=await Z.sb.from("belege").select("*").eq("fall_id",f.id);
        for(const r of rows||[]){
          const b={kat:r.kat,datum:r.datum||"",jahr:r.jahr,betrag:r.betrag==null?"":Number(r.betrag),titel:r.titel||"",ctype:r.ctype||"",eingereicht:!!r.eingereicht};
          if(r.pfad){ try{ const {data:blob}=await Z.sb.storage.from("belege").download(r.pfad); if(blob) b.datei=await blobToDataUrl(blob) }catch(e){} }
          belege.push(b);
        }
      } else Z.BEL.forEach(b=>belege.push({kat:b.kat,datum:b.datum,jahr:b.jahr,betrag:b.betrag,titel:b.titel,eingereicht:!!b.eingereicht}));
      out.personen.push({name:fallName({data}),data,belege});
    }
    const blob=new Blob([JSON.stringify(out)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`dein-anspruch-sicherung-${isoD(TODAY())}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove() },4000);
    toast("Sicherung heruntergeladen. Bewahre die Datei gut auf.");
  }catch(e){ toast("Sicherung hat nicht geklappt. Bitte erneut versuchen.") }
  Z.dataBusy=""; render();
}
export async function restoreData(file){
  if(!file||Z.dataBusy) return;
  let j=null; try{ j=JSON.parse(await file.text()) }catch(e){}
  if(!j||j.app!=="dein-anspruch"||!Array.isArray(j.personen)||!j.personen.length){ toast("Das ist keine Sicherung von Dein Anspruch."); return }
  Z.dataBusy="restore"; render();
  try{
    if(!Z.USER){
      const p=j.personen[0]; Z.S=merge(p.data||{}); Z.BEL=(p.belege||[]).map((b,i)=>({id:"local-r"+i,...b,asset:""})); save();
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
              const {error}=await Z.sb.storage.from("belege").upload(path,blob,{contentType:type,upsert:false}); if(!error) pfad=path }catch(e){}
          }
          await Z.sb.from("belege").insert({fall_id:id,kat:b.kat||"sonst",titel:b.titel||"",datum:b.datum||null,jahr:b.jahr||null,betrag:b.betrag===""||b.betrag==null?null:Number(b.betrag),eingereicht:!!b.eingereicht,ctype:pfad?(b.ctype||""):"",pfad});
        }
      }
      await loadFaelle(); await openFall(first);
      toast(j.personen.length===1?"Sicherung eingespielt.":`Sicherung eingespielt: ${j.personen.length} Personen.`);
    }
  }catch(e){ toast("Einspielen hat nicht vollständig geklappt. Bitte prüfen.") }
  Z.dataBusy=""; render();
}
export function datenBox(){
  return `<section class="panel datenbox">
    <h3>Deine Daten</h3>
    <p class="small muted">Lade ab und zu eine Sicherung herunter. Mit der Datei kannst du alles wiederherstellen, auch nach dem Löschen.</p>
    <div class="btnrow"><button class="btn small soft" type="button" data-act="backup" ${Z.dataBusy?"disabled":""}>${ic("down")}${Z.dataBusy==="backup"?"Sicherung wird erstellt …":"Sicherung herunterladen"}</button><button class="btn small ghost" type="button" data-act="restore" ${Z.dataBusy?"disabled":""}>${Z.dataBusy==="restore"?"Wird eingespielt …":"Sicherung einspielen"}</button></div>
    ${Z.wipeAsk?`<div class="notice bad" id="wipebox">${ic("alert")}<span><strong>Bist du sicher?</strong> ${Z.USER?`Dein Konto und alle Angaben, Belege und Fotos werden für immer gelöscht${Z.MEMBERS.length>1?". Eingeladene Familienmitglieder verlieren den Zugriff auf die gemeinsamen Angaben":""}.`:"Alle Angaben auf diesem Gerät werden gelöscht."} Das kann nicht rückgängig gemacht werden. Lade vorher am besten eine Sicherung herunter.
      <span class="btnrow" style="margin-top:10px"><button class="btn small soft" type="button" data-act="backup" ${Z.dataBusy?"disabled":""}>${ic("down")}Erst Sicherung herunterladen</button></span>
      <span class="field" style="margin-top:10px"><label for="wipe-word">Zum Bestätigen <strong>LÖSCHEN</strong> eintippen</label><input type="text" id="wipe-word" autocomplete="off" autocapitalize="characters" spellcheck="false"></span>
      <span class="btnrow" style="margin-top:10px"><button class="btn small danger" type="button" data-act="wipe-yes" ${Z.wipeBusy?"disabled":""}>${Z.wipeBusy?"Wird gelöscht …":"Ja, endgültig löschen"}</button><button class="btn small ghost" type="button" data-act="wipe-no" ${Z.wipeBusy?"disabled":""}>Abbrechen</button></span></span></div>`
    :`<button class="linkbtn danger" type="button" data-act="wipe" style="align-self:flex-start">${Z.USER?"Konto und alle Daten löschen":"Alle Angaben auf diesem Gerät löschen"}</button>`}
  </section>`;
}

