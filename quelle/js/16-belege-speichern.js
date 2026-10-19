import { Z } from "./zustand.js";
import { TODAY, isoD, parseIso } from "./03-hilfsmittel.js";
import { numDE } from "./04-verhinderungspflege.js";
import { selYears } from "./10-fragebogen-und-fristen.js";
import { render, scrollTop } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
import { blobUrl, save } from "./19-speicher.js";
/* ---------- Belege speichern ---------- */
export function startPending(file){
  if(Z.pending){ // Foto in laufender Erfassung ersetzen
    if(Z.pending.preview&&Z.pending.preview.startsWith("blob:")) URL.revokeObjectURL(Z.pending.preview);
    Z.pending.file=file||null; Z.pending.preview=file&&/^image\//.test(file.type)?URL.createObjectURL(file):""; Z.pending.dropAsset=false;
    return render();
  }
  Z.pending={file:file||null, preview: file&&/^image\//.test(file.type)?URL.createObjectURL(file):"", kat:"apo", datum:isoD(TODAY()), betrag:"", titel:""};
  render();
}
export function editBeleg(id){
  const b=Z.BEL.find(x=>x.id===id); if(!b) return;
  Z.pending={editId:id, file:null, keepAsset:b.asset||"", keepType:b.ctype||"", preview:b.asset&&/^image\//.test(b.ctype||"")?blobUrl(b.asset):"", kat:b.kat||"sonst", datum:b.datum||isoD(TODAY()), betrag:b.betrag==null||b.betrag===""?"":String(b.betrag).replace(".",","), titel:b.titel||""};
  render(); scrollTop();
}
export async function prepareFile(f){
  if(f.type==="application/pdf") return {blob:f,type:"application/pdf"};
  try{
    const bmp=await createImageBitmap(f); const s=Math.min(1,1800/Math.max(bmp.width,bmp.height));
    const c=document.createElement("canvas"); c.width=Math.round(bmp.width*s); c.height=Math.round(bmp.height*s);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.82)); if(blob) return {blob,type:"image/jpeg"};
  }catch(e){}
  if(["image/jpeg","image/png","image/webp","image/gif"].includes(f.type)) return {blob:f,type:f.type};
  throw {code:"unsupported_type"};
}
export async function saveBeleg(){
  if(Z.busy||!Z.pending) return;
  const p=Z.pending; const betrag=String(p.betrag).trim()===""?"":numDE(p.betrag);
  if(String(p.betrag).trim()!=="" && !/^[\d.,\s]+$/.test(String(p.betrag).trim())){toast("Bitte den Betrag nur als Zahl eingeben, z. B. 5,00");return}
  Z.busy=true; render();
  try{
    let asset=p.keepAsset||"", ctype=p.keepType||"", oldAsset="";
    if(p.dropAsset){ oldAsset=asset; asset=""; ctype="" }
    if(p.file){
      if(!Z.ASSETS) throw {code:"no_assets"};
      const {blob,type}=await prepareFile(p.file);
      const up=await Z.ASSETS.upload(blob,{type}); oldAsset=p.keepAsset||""; asset=up.id; ctype=up.contentType;
    }
    const d=parseIso(p.datum)||TODAY();
    const data={kat:p.kat,datum:isoD(d),jahr:d.getFullYear(),betrag,titel:String(p.titel||"").trim(),asset,ctype};
    if(p.editId){
      if(Z.BCOL && !p.editId.startsWith("local-")) await Z.BCOL.doc(p.editId).update(data);
      else { const x=Z.BEL.find(x=>x.id===p.editId); if(x) Object.assign(x,data) }
      if(oldAsset && oldAsset!==asset && Z.ASSETS){ try{ await Z.ASSETS.delete(oldAsset) }catch(e){} }
    } else {
      data.eingereicht=false; data.created=new Date().toISOString();
      if(Z.BCOL){ await Z.BCOL.add(data) } else { Z.BEL.push({id:"local-"+Date.now(),...data}) }
    }
    if(p.preview&&p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
    Z.pending=null; { const yy=String(d.getFullYear()); const cur=selYears(); if(!cur.includes(yy)) Z.S.belegFilter.jahre=[...cur,yy]; } save(); toast(p.editId?"Änderungen gespeichert":"Beleg gespeichert");
  }catch(e){
    const c=e&&e.code;
    toast(c==="too_large"?"Datei ist zu groß (max. 20 MB).":c==="unsupported_type"?"Dieses Dateiformat geht nicht. Bitte JPG, PNG oder PDF.":c==="quota_exceeded"?"Speicherplatz voll. Bitte alte Belege löschen.":c==="no_assets"?"Fotos können in dieser Ansicht nicht gespeichert werden.":"Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
  }
  Z.busy=false; render();
}
export async function deleteBeleg(id){
  const b=Z.BEL.find(x=>x.id===id); Z.delAsk=null; if(!b) return render();
  try{
    if(Z.BCOL && !id.startsWith("local-")) await Z.BCOL.doc(id).delete(); else Z.BEL=Z.BEL.filter(x=>x.id!==id);
    if(b.asset && Z.ASSETS){ try{ await Z.ASSETS.delete(b.asset) }catch(e){} }
    toast("Beleg gelöscht");
  }catch(e){ toast("Löschen fehlgeschlagen.") }
  render();
}
export async function toggleSubmitted(id){
  const b=Z.BEL.find(x=>x.id===id); if(!b) return;
  if(Z.BCOL && !id.startsWith("local-")){ try{ await Z.BCOL.doc(id).update({eingereicht:!b.eingereicht}) }catch(e){toast("Ändern fehlgeschlagen.")} }
  else { b.eingereicht=!b.eingereicht; render() }
}

