import { Z } from "./zustand.js";
import { eur } from "./01-grundlagen.js";
import { B, RECIP, kasseName } from "./02-leistungen.js";
import { deD, parseIso } from "./03-hilfsmittel.js";
import { KATS, selYears } from "./10-fragebogen-und-fristen.js";
import { curLetter, docsFor, today } from "./12-reiter-ansprueche.js";
import { toast } from "./18-bedienung.js";
import { DL, blobUrl } from "./19-speicher.js";
/* ---------- PDF ---------- */
export function newDoc(){ if(!window.jspdf){toast("PDF-Erzeugung nicht geladen. Bitte Text kopieren.");return null} return new window.jspdf.jsPDF({unit:"mm",format:"a4"}) }
function drawLetter(doc,b){
  const p=Z.S.person, a=Z.S.rolle==="angehoerig", r=RECIP[b.to](), L=curLetter(b);
  const L0=25, W=165; let y;
  doc.setFont("helvetica","normal"); doc.setFontSize(8);
  const abs=[a?p.absender:p.name, a?p.absStrasse:p.strasse, a?p.absOrt:p.ort].filter(Boolean).join(" · ")||"[Absender]";
  doc.text(abs,L0,47);
  doc.setFontSize(11);
  doc.text([r.name,"[Straße / Postfach]","[PLZ Ort]"],L0,55);
  const ortName=((a?p.absOrt:p.ort)||"").replace(/^\d{5}\s*/,"");
  doc.text(`${ortName?ortName+", ":""}${today()}`,190,95,{align:"right"});
  doc.setFont("helvetica","bold"); y=105;
  const subl=doc.splitTextToSize(L.subject,W); doc.text(subl,L0,y); y+=subl.length*5.5+6;
  doc.setFont("helvetica","normal");
  for(const ln of doc.splitTextToSize(L.body,W)){ if(y>275){doc.addPage();y=20} doc.text(ln,L0,y); y+=5.2 }
  y+=10; if(y>270){doc.addPage();y=20}
  doc.line(L0,y,L0+70,y); doc.setFontSize(8); doc.text("Unterschrift",L0,y+4);
  const docs=docsFor(b); if(docs.length){ y+=14; if(y>260){doc.addPage();y=20} doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("Anlagen",L0,y); doc.setFont("helvetica","normal"); y+=5; for(const d of docs){ if(y>282){doc.addPage();y=20} doc.text("– "+d,L0,y); y+=5 } }
}
export async function saveFile(filename,data,okMsg){
  const dl = DL; // Datei-Download im Browser (siehe 19-speicher.js)
  try{ await dl.save({filename,data}); toast(okMsg||"Gespeichert") }
  catch(e){ if(e&&e.code==="declined") return; toast(e&&e.code==="rate_limited"?"Bitte kurz warten und erneut versuchen.":"Download nicht möglich.") }
}
export async function makePDF(b){ const doc=newDoc(); if(!doc) return; drawLetter(doc,b); await saveFile(`Antrag-${b.k}.pdf`,doc.output("blob"),"PDF gespeichert") }
async function blobToDataURL(id){
  const res=await fetch(blobUrl(id)); if(!res.ok) throw new Error("fetch");
  const bl=await res.blob(); if(!/^image\//.test(bl.type)) return null;
  const bmp=await createImageBitmap(bl); const c=document.createElement("canvas"); const s=Math.min(1,1600/Math.max(bmp.width,bmp.height));
  c.width=Math.round(bmp.width*s); c.height=Math.round(bmp.height*s); c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  return {url:c.toDataURL("image/jpeg",0.8),w:c.width,h:c.height};
}
export async function makeMappe(withLetter, onlyZZ, yearsArg){
  const doc=newDoc(); if(!doc) return;
  toast("PDF wird erstellt …");
  const years=yearsArg||selYears(); const kf=Z.S.belegFilter.kat||"";
  const jahr=years.length===1?years[0]:years.slice().reverse().join("-");
  let list=Z.BEL.filter(b=>years.includes(String(b.jahr)));
  if(onlyZZ) list=list.filter(b=>KATS[b.kat]&&KATS[b.kat].zz); else if(kf) list=list.filter(b=>b.kat===kf);
  list.sort((a,b)=>(a.kat+a.datum).localeCompare(b.kat+b.datum));
  if(withLetter){ Z.befJahr=years[0]; drawLetter(doc,B.find(x=>x.k==="befreiung")); doc.addPage() }
  const L0=20; let y=22;
  doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(`Belegübersicht ${jahr.replace("-"," – ")}`,L0,y); y+=7;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text([Z.S.person.name||"", Z.S.person.vnr?`Versichertennummer ${Z.S.person.vnr}`:"", kasseName()].filter(Boolean).join(" · "),L0,y); y+=10;
  doc.setFont("helvetica","bold"); doc.text("Nr.",L0,y); doc.text("Datum",L0+12,y); doc.text("Art / Beschreibung",L0+36,y); doc.text("Betrag",190,y,{align:"right"}); y+=2; doc.line(L0,y,190,y); y+=5;
  doc.setFont("helvetica","normal");
  let sum=0;
  list.forEach((b,i)=>{ if(y>280){doc.addPage();y=20}
    const d=parseIso(b.datum); const t=`${(KATS[b.kat]||KATS.sonst).t}${b.titel?" – "+b.titel:""}${b.asset&&!/^image\//.test(b.ctype||"")?" (PDF separat)":""}`;
    doc.text(String(i+1),L0,y); doc.text(d?deD(d):"–",L0+12,y); doc.text(doc.splitTextToSize(t,110)[0],L0+36,y); doc.text(b.betrag!==""&&b.betrag!=null?eur(Number(b.betrag),2):"–",190,y,{align:"right"});
    sum+=Number(b.betrag)||0; y+=6 });
  doc.line(L0,y-2,190,y-2); doc.setFont("helvetica","bold"); doc.text("Summe",L0+36,y+3); doc.text(eur(sum,2),190,y+3,{align:"right"});
  let i=0;
  for(const b of list){ i++; if(!b.asset||!/^image\//.test(b.ctype||"")) continue;
    try{ const im=await blobToDataURL(b.asset); if(!im) continue; doc.addPage();
      doc.setFont("helvetica","normal"); doc.setFontSize(10); const d=parseIso(b.datum);
      doc.text(`Beleg ${i}: ${(KATS[b.kat]||KATS.sonst).t}${d?" · "+deD(d):""}${b.betrag?" · "+eur(Number(b.betrag),2):""}`,20,15);
      const maxW=170,maxH=260; const s=Math.min(maxW/im.w,maxH/im.h); doc.addImage(im.url,"JPEG",20,22,im.w*s,im.h*s);
    }catch(e){}
  }
  await saveFile(withLetter?`Befreiungsantrag-${jahr}.pdf`:`Belegmappe-${jahr}.pdf`,doc.output("blob"),"PDF gespeichert");
}
export async function makeCSV(){
  const years=selYears(); const jahr=years.slice().reverse().join("-");
  const rows=[["Datum","Art","Beschreibung","Betrag","Eingereicht"]];
  Z.BEL.filter(b=>years.includes(String(b.jahr))&&(!Z.S.belegFilter.kat||b.kat===Z.S.belegFilter.kat)).sort((a,b)=>(a.datum||"").localeCompare(b.datum||"")).forEach(b=>rows.push([b.datum?deD(parseIso(b.datum)):"",(KATS[b.kat]||KATS.sonst).t,b.titel||"",b.betrag!=null&&b.betrag!==""?Number(b.betrag).toFixed(2).replace(".",","):"",b.eingereicht?"ja":"nein"]));
  const csv="﻿"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  await saveFile(`Belege-${jahr}.csv`,csv,"Tabelle gespeichert");
}

