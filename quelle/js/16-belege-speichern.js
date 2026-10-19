/* ---------- Belege speichern ---------- */
function startPending(file){
  if(pending){ // Foto in laufender Erfassung ersetzen
    if(pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview);
    pending.file=file||null; pending.preview=file&&/^image\//.test(file.type)?URL.createObjectURL(file):""; pending.dropAsset=false;
    return render();
  }
  pending={file:file||null, preview: file&&/^image\//.test(file.type)?URL.createObjectURL(file):"", kat:"apo", datum:isoD(TODAY()), betrag:"", titel:""};
  render();
}
function editBeleg(id){
  const b=BEL.find(x=>x.id===id); if(!b) return;
  pending={editId:id, file:null, keepAsset:b.asset||"", keepType:b.ctype||"", preview:b.asset&&/^image\//.test(b.ctype||"")?blobUrl(b.asset):"", kat:b.kat||"sonst", datum:b.datum||isoD(TODAY()), betrag:b.betrag==null||b.betrag===""?"":String(b.betrag).replace(".",","), titel:b.titel||""};
  render(); scrollTop();
}
async function prepareFile(f){
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
async function saveBeleg(){
  if(busy||!pending) return;
  const p=pending; const betrag=String(p.betrag).trim()===""?"":numDE(p.betrag);
  if(String(p.betrag).trim()!=="" && !/^[\d.,\s]+$/.test(String(p.betrag).trim())){toast("Bitte den Betrag nur als Zahl eingeben, z. B. 5,00");return}
  busy=true; render();
  try{
    let asset=p.keepAsset||"", ctype=p.keepType||"", oldAsset="";
    if(p.dropAsset){ oldAsset=asset; asset=""; ctype="" }
    if(p.file){
      if(!ASSETS) throw {code:"no_assets"};
      const {blob,type}=await prepareFile(p.file);
      const up=await ASSETS.upload(blob,{type}); oldAsset=p.keepAsset||""; asset=up.id; ctype=up.contentType;
    }
    const d=parseIso(p.datum)||TODAY();
    const data={kat:p.kat,datum:isoD(d),jahr:d.getFullYear(),betrag,titel:String(p.titel||"").trim(),asset,ctype};
    if(p.editId){
      if(BCOL && !p.editId.startsWith("local-")) await BCOL.doc(p.editId).update(data);
      else { const x=BEL.find(x=>x.id===p.editId); if(x) Object.assign(x,data) }
      if(oldAsset && oldAsset!==asset && ASSETS){ try{ await ASSETS.delete(oldAsset) }catch(e){} }
    } else {
      data.eingereicht=false; data.created=new Date().toISOString();
      if(BCOL){ await BCOL.add(data) } else { BEL.push({id:"local-"+Date.now(),...data}) }
    }
    if(p.preview&&p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
    pending=null; { const yy=String(d.getFullYear()); const cur=selYears(); if(!cur.includes(yy)) S.belegFilter.jahre=[...cur,yy]; } save(); toast(p.editId?"Änderungen gespeichert":"Beleg gespeichert");
  }catch(e){
    const c=e&&e.code;
    toast(c==="too_large"?"Datei ist zu groß (max. 20 MB).":c==="unsupported_type"?"Dieses Dateiformat geht nicht. Bitte JPG, PNG oder PDF.":c==="quota_exceeded"?"Speicherplatz voll. Bitte alte Belege löschen.":c==="no_assets"?"Fotos können in dieser Ansicht nicht gespeichert werden.":"Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
  }
  busy=false; render();
}
async function deleteBeleg(id){
  const b=BEL.find(x=>x.id===id); delAsk=null; if(!b) return render();
  try{
    if(BCOL && !id.startsWith("local-")) await BCOL.doc(id).delete(); else BEL=BEL.filter(x=>x.id!==id);
    if(b.asset && ASSETS){ try{ await ASSETS.delete(b.asset) }catch(e){} }
    toast("Beleg gelöscht");
  }catch(e){ toast("Löschen fehlgeschlagen.") }
  render();
}
async function toggleSubmitted(id){
  const b=BEL.find(x=>x.id===id); if(!b) return;
  if(BCOL && !id.startsWith("local-")){ try{ await BCOL.doc(id).update({eingereicht:!b.eingereicht}) }catch(e){toast("Ändern fehlgeschlagen.")} }
  else { b.eingereicht=!b.eingereicht; render() }
}

