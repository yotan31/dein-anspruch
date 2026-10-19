import { Z } from "./zustand.js";
import { esc } from "./01-grundlagen.js";
import { TODAY, ic, isoD, parseIso } from "./03-hilfsmittel.js";
import { numDE } from "./04-verhinderungspflege.js";
import { bar } from "./05-assistent.js";
import { loadTesseract } from "./06-bescheid-entlastung.js";
import { KATS, selYears } from "./10-fragebogen-und-fristen.js";
import { render, scrollTop } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
import { save } from "./19-speicher.js";
/* ---------- Sammel-PDF: mehrere Rechnungen erkennen und nach Jahr einsortieren ---------- */
/** @type {any} */ Z.bulk = null; // {phase:"lesen"|"pruefen"|"speichern", n, total, items:[], pdf, file, pages}
Z.pdfjsP = null;
function loadPdfJs(){
  if(!Z.pdfjsP) Z.pdfjsP=import(new URL("vendor/pdf.min.js",location.href).href).then(m=>{ m.GlobalWorkerOptions.workerSrc=new URL("vendor/pdf.worker.min.js",location.href).href; return m }).catch(e=>{ Z.pdfjsP=null; throw e });
  return Z.pdfjsP;
}
function pad2(n) { return String(n).padStart(2,"0"); }
const MONATE={januar:1,jan:1,februar:2,feb:2,"märz":3,maerz:3,mrz:3,april:4,apr:4,mai:5,juni:6,jun:6,juli:7,jul:7,august:8,aug:8,september:9,sept:9,sep:9,oktober:10,okt:10,november:11,nov:11,dezember:12,dez:12};
function mkDatum(y,m,d){
  y=Number(y); if(y<100) y+=2000; m=Number(m); d=Number(d);
  const now=new Date().getFullYear();
  if(!(m>=1&&m<=12&&d>=1&&d<=31) || y<now-6 || y>now+1) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}
export function datesIn(line){
  const out=[]; let m;
  const r1=/(?<!\d)(\d{1,2})\s?\.\s?(\d{1,2})\s?\.\s?(\d{4}|\d{2})(?!\d)/g; while((m=r1.exec(line))) out.push(mkDatum(m[3],m[2],m[1]));
  const r2=/(?<!\d)(\d{1,2})\.?\s+(januar|jan|februar|feb|märz|maerz|mrz|april|apr|mai|juni|jun|juli|jul|august|aug|september|sept|sep|oktober|okt|november|nov|dezember|dez)\.?\s+(\d{4})/gi; while((m=r2.exec(line))) out.push(mkDatum(m[3],MONATE[m[2].toLowerCase()],m[1]));
  const r3=/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g; while((m=r3.exec(line))) out.push(mkDatum(m[1],m[2],m[3]));
  return out.filter(Boolean);
}
const BETRAG=/(?<![\d,.])(\d{1,3}(?:[.\s']\d{3})+|\d+),(\d{2})(?!\d)/g;
export function amountsIn(line){ return [...line.matchAll(BETRAG)].map(m=>Number(m[1].replace(/[.\s']/g,"")+"."+m[2])).filter(v=>v>0&&v<100000) }
const NICHT_DATUM=/geb\.|geboren|geburt|fällig|zahlbar bis|zahlungsziel|gültig bis|bis zum|überweisen bis|skonto/i;
export function pickDate(lines){
  const key=/(rechnungs|beleg|quittungs|ausstellungs|kauf|verordnungs|abgabe)?datum|\bvom\b|\brechnung\b|\bquittung\b|\bdatum\b/i;
  for(const l of lines){ if(key.test(l) && !NICHT_DATUM.test(l)){ const d=datesIn(l); if(d.length) return d[0] } }
  const count={}; let first=null;
  for(const l of lines){ if(NICHT_DATUM.test(l)) continue; for(const d of datesIn(l)){ count[d]=(count[d]||0)+1; first=first||d } }
  const best=Object.entries(count).sort((a,b)=>b[1]-a[1])[0];
  return best&&best[1]>1?best[0]:first;
}
export function pickAmount(lines,kat){
  const val=(i)=>{ const a=amountsIn(lines[i]); if(a.length) return a[a.length-1]; const n=lines[i+1]?amountsIn(lines[i+1]):[]; return n.length?n[0]:null };
  if(KATS[kat]&&KATS[kat].zz){
    for(let i=lines.length-1;i>=0;i--) if(/(summe|gesamt)[^0-9]{0,20}zuzahlung|zuzahlung[^0-9]{0,12}(gesamt|summe)/i.test(lines[i])){ const v=val(i); if(v!=null) return v }
    const z=[]; lines.forEach((l,i)=>{ if(/zuzahlung|eigenanteil/i.test(l)){ const v=val(i); if(v!=null) z.push(v) } });
    if(z.length) return Math.round(z.reduce((s,v)=>s+v,0)*100)/100;
  }
  const tiers=[/gesamtbetrag|rechnungsbetrag|endbetrag|zahlbetrag|zu zahlen|zu überweisen|gesamtsumme|bruttobetrag|summe brutto|rechnungssumme|gesamt brutto/i,/\bgesamt\b|\bsumme\b|\btotal\b|\bbetrag\b|\beur\b|€/i];
  for(const re of tiers){ for(let i=lines.length-1;i>=0;i--){ if(re.test(lines[i]) && !/netto|mwst|ust|steuer|rabatt/i.test(lines[i])){ const v=val(i); if(v!=null) return v } } }
  const all=lines.flatMap(amountsIn); return all.length?Math.max(...all):null;
}
/** @type {[string,RegExp][]} */
const KAT_REGELN=[
  ["vhp",/verhinderungspflege|§\s?39\b|kurzzeitpflege|§\s?42\b|ersatzpflege/i],
  ["beratung",/beratungsbesuch|beratungseinsatz|§\s?37\s?abs\.?\s?3/i],
  ["entl",/entlastungsbetrag|§\s?45\s?b|45b|alltagshilfe|haushaltshilfe|haushaltsnahe|betreuungsleistung|unterstützung im alltag|unterstuetzung im alltag|alltagsbegleitung|tagespflege|nachbarschaftshilfe/i],
  ["pflhm",/pflegehilfsmittel|§\s?40\b|einmalhandschuh|bettschutzeinlage|pflegebox|desinfektion/i],
  ["fahrt",/krankenfahrt|krankentransport|taxi|fahrdienst|beförderung/i],
  ["heil",/physiotherap|krankengymnastik|ergotherap|logopäd|podolog|heilmittel|sanitätshaus|orthopädie|krankenhaus|klinik|stationär|hilfsmittel/i],
  ["apo",/apotheke|pzn|rezept|arzneimittel|verordnung/i],
  ["bescheid",/bescheid|widerspruch|sehr geehrte/i],
];
export function guessKat(text){ for(const [k,re] of KAT_REGELN) if(re.test(text)) return k; return "sonst" }
function guessTitel(lines){
  const org=/apotheke|pflegedienst|sozialstation|sanitätshaus|praxis|physiotherap|ergotherap|logopäd|taxi|klinik|krankenhaus|diakonie|caritas|\bdrk\b|\bawo\b|alltagshilfe|tagespflege|gmbh|\be\.\s?v\.|\bgbr\b|\bug\b|\bohg\b/i;
  const top=lines.slice(0,14);
  const l=top.find(x=>org.test(x)&&x.length<70) || top.find(x=>x.length>=4&&x.length<=50&&!/\d{3,}/.test(x)&&!/rechnung|seite|datum/i.test(x));
  return l?l.replace(/\s{2,}/g," ").slice(0,50):"";
}
function rechnungsNr(text){ const m=text.match(/(rechnungs?|beleg|quittungs?)[-\s]*(nr|nummer|no)\.?\s*:?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i); return m?m[3]:"" }
async function pageLines(page){
  const tc=await page.getTextContent(); const rows=new Map();
  for(const it of tc.items){ if(!it.str||!it.str.trim()) continue; const y=Math.round(it.transform[5]/4); const r=rows.get(y)||[]; r.push([it.transform[4],it.str]); rows.set(y,r) }
  return [...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,r])=>r.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(" ").replace(/\s+/g," ").trim()).filter(Boolean);
}
async function pageCanvas(page,maxW){
  const v1=page.getViewport({scale:1}); const vp=page.getViewport({scale:Math.min(3,maxW/v1.width)});
  const c=document.createElement("canvas"); c.width=Math.ceil(vp.width); c.height=Math.ceil(vp.height);
  const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height);
  await page.render({canvasContext:ctx,viewport:vp}).promise; return c;
}
export async function importPdf(file){
  Z.pending=null; Z.bulk={phase:"lesen",n:0,total:0,items:[],file,msg:"Die PDF wird geöffnet …"}; render(); scrollTop();
  let ocr=null;
  try{
    const lib=await loadPdfJs();
    const buf=await file.arrayBuffer();
    const pdf=await lib.getDocument({data:new Uint8Array(buf),wasmUrl:new URL("vendor/wasm/",location.href).href,standardFontDataUrl:new URL("vendor/fonts/",location.href).href,isEvalSupported:false}).promise;
    if(!Z.bulk||Z.bulk.file!==file) return;
    Z.bulk.pdf=pdf; Z.bulk.total=pdf.numPages; Z.bulk.pages=[];
    for(let i=1;i<=pdf.numPages;i++){
      if(!Z.bulk||Z.bulk.file!==file) return;
      Z.bulk.n=i; Z.bulk.msg=`Seite ${i} von ${pdf.numPages} wird gelesen …`; render();
      const page=await pdf.getPage(i);
      let lines=await pageLines(page);
      const thumb=(await pageCanvas(page,160)).toDataURL("image/jpeg",0.7);
      if(lines.join("").length<40){ // eingescannt: Text erst erkennen
        Z.bulk.msg=`Seite ${i} von ${pdf.numPages}: eingescannt, Text wird erkannt …`; render();
        try{
          if(!ocr){ const T=await loadTesseract(); ocr=await T.createWorker("deu") }
          const c=await pageCanvas(page,1700); const {data}=await ocr.recognize(c);
          lines=String(data.text||"").split(/\n+/).map(s=>s.replace(/\s+/g," ").trim()).filter(Boolean);
        }catch(e){}
      }
      Z.bulk.pages.push({i,lines,text:lines.join("\n"),thumb});
    }
    if(!Z.bulk||Z.bulk.file!==file) return;
    Z.bulk.items=groupPages(Z.bulk.pages); Z.bulk.phase="pruefen"; Z.bulk.msg="";
  }catch(e){
    Z.bulk={phase:"fehler",file,items:[],msg:"Die PDF konnte nicht gelesen werden."};
  }finally{ if(ocr) try{ await ocr.terminate() }catch(e){} }
  render(); scrollTop();
}
export function groupPages(pages){
  const groups=[];
  for(const p of pages){
    const prev=groups[groups.length-1];
    const nr=rechnungsNr(p.text), d=pickDate(p.lines), hasAmt=amountsIn(p.text).length>0;
    const folge=/seite\s*([2-9]|[1-9]\d)\s*(von|\/|of)\s*\d+/i.test(p.text) && !/seite\s*1\s*(von|\/|of)/i.test(p.text);
    if(prev && (folge || (nr && nr===prev.nr) || (!d && !hasAmt && p.text.length>0))){ prev.pages.push(p); continue }
    groups.push({nr,pages:[p]});
  }
  return groups.map((g,idx)=>{
    const lines=g.pages.flatMap(p=>p.lines), text=lines.join("\n");
    const kat=guessKat(text), datum=pickDate(lines)||"", b=pickAmount(lines,kat);
    return {id:"bi"+idx,on:true,pages:g.pages.map(p=>p.i),thumb:g.pages[0].thumb,kat,datum,betrag:b==null?"":String(b.toFixed(2)).replace(".",","),titel:guessTitel(g.pages[0].lines)};
  });
}
function bulkYears(){ const c={}; for(const it of Z.bulk.items) if(it.on){ const y=(it.datum||"").slice(0,4)||"ohne Datum"; c[y]=(c[y]||0)+1 } return Object.entries(c).sort() }
export function bulkView(){
  const B=Z.bulk;
  if(B.phase==="lesen"||B.phase==="speichern") return `<div class="pending bulk">
    <h3>${B.phase==="lesen"?"Rechnungen werden erkannt":"Belege werden gespeichert"}</h3>
    ${B.total?bar(B.n,B.total,B.msg):`<p class="muted">${esc(B.msg)}</p>`}
    <p class="small muted">${B.phase==="lesen"?"Alles passiert auf deinem Gerät. Bei eingescannten Seiten dauert es etwas länger.":"Bitte die Seite nicht schließen."}</p>
    ${B.phase==="lesen"?`<button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button>`:""}
  </div>`;
  if(B.phase==="fehler"||!B.items.length) return `<div class="pending bulk">
    <p class="notice warn">${ic("alert")}<span>${B.phase==="fehler"?esc(B.msg):"In dieser PDF haben wir keine Rechnung erkannt."} Du kannst sie trotzdem als einen Beleg speichern.</span></p>
    <div class="nav big go"><button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button><button class="btn" type="button" data-act="bulk-single">Als einen Beleg speichern</button></div></div>`;
  const on=B.items.filter(x=>x.on).length, yrs=bulkYears();
  return `<div class="pending bulk">
    <h3>${B.items.length===1?"1 Rechnung erkannt":`${B.items.length} Rechnungen erkannt`}</h3>
    ${yrs.length?`<div class="yearchips">${yrs.map(([y,n])=>`<span class="chip" aria-pressed="true">${esc(y)}: ${n}</span>`).join("")}</div>`:""}
    ${B.pages&&B.pages.some(x=>!x.text)?`<p class="notice warn">${ic("alert")}<span>Bei ${B.pages.filter(x=>!x.text).length===1?"einer Seite":B.pages.filter(x=>!x.text).length+" Seiten"} konnten wir den Text nicht lesen. Bitte dort Datum und Betrag selbst eintragen.</span></p>`:""}
    <p class="notice info">${ic("info")}<span>Bitte kurz prüfen. Du kannst alles ändern oder eine Rechnung abwählen. Gespeichert wird erst, wenn du unten tippst.</span></p>
    <div class="bulklist">${B.items.map((it,i)=>`<article class="bulkitem${it.on?"":" off"}" id="${it.id}">
      <label class="bion" for="bion-${i}"><input type="checkbox" id="bion-${i}" data-bi="${i}:on" ${it.on?"checked":""}><span>übernehmen</span></label>
      <img class="bthumb" src="${it.thumb}" alt="Seite ${it.pages[0]}">
      <div class="bfields">
        <span class="small muted">${it.pages.length>1?`Seiten ${it.pages[0]}–${it.pages[it.pages.length-1]}`:`Seite ${it.pages[0]}`}</span>
        <div class="field"><label for="bik-${i}">Art</label><select id="bik-${i}" data-bi="${i}:kat">${Object.entries(KATS).map(([k,v])=>`<option value="${k}" ${it.kat===k?"selected":""}>${esc(v.t)}</option>`).join("")}</select></div>
        <div class="grid2">
          <div class="field"><label for="bid-${i}">Datum${it.datum?"":' <span class="miss">fehlt</span>'}</label><input type="date" id="bid-${i}" data-bi="${i}:datum" value="${esc(it.datum)}"></div>
          <div class="field"><label for="bib-${i}">Betrag${it.betrag?"":' <span class="miss">fehlt</span>'}</label><div class="euro"><input type="text" inputmode="decimal" id="bib-${i}" data-bi="${i}:betrag" value="${esc(it.betrag)}" placeholder="z. B. 5,00"><span>€</span></div></div>
        </div>
        <div class="field"><label for="bit-${i}">Beschreibung</label><input type="text" id="bit-${i}" data-bi="${i}:titel" value="${esc(it.titel)}" placeholder="z. B. Apotheke am Markt"></div>
      </div>
    </article>`).join("")}</div>
    ${Z.ASSETS?"":`<p class="small muted">Ohne Konto werden nur Datum, Betrag und Art gespeichert, nicht die Seiten selbst.</p>`}
    <div class="nav big go"><button class="btn ghost" type="button" data-act="bulk-cancel">Abbrechen</button><button class="btn" type="button" data-act="bulk-save" ${on?"":"disabled"}>${on===1?"1 Beleg speichern":`${on} Belege speichern`}</button></div>
  </div>`;
}
async function bulkBlob(it){
  const B=Z.bulk;
  if(B.items.length===1 && it.pages.length===B.total && B.file.size<20e6) return {blob:B.file,type:"application/pdf"};
  const canvases=[]; for(const i of it.pages) canvases.push(await pageCanvas(await B.pdf.getPage(i),1300));
  if(canvases.length===1 || !window.jspdf){ // ohne PDF-Bibliothek: Seiten untereinander zu einem Bild
    let c=canvases[0];
    if(canvases.length>1){ const w=Math.max(...canvases.map(x=>x.width)), h=canvases.reduce((s,x)=>s+x.height,0), k=Math.min(1,12000/h); c=document.createElement("canvas"); c.width=Math.round(w*k); c.height=Math.round(h*k); const g=c.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,c.width,c.height); let y=0; for(const x of canvases){ g.drawImage(x,0,y,x.width*k,x.height*k); y+=x.height*k } }
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.8)); return {blob,type:"image/jpeg"} }
  const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
  canvases.forEach((c,k)=>{ if(k) doc.addPage(); const w=210, h=Math.min(297,c.height/c.width*210); doc.addImage(c.toDataURL("image/jpeg",0.8),"JPEG",0,0,w,h) });
  return {blob:doc.output("blob"),type:"application/pdf"};
}
export async function bulkSave(){
  if(!Z.bulk||Z.bulk.phase!=="pruefen") return;
  const bad=Z.bulk.items.find(it=>it.on && String(it.betrag).trim() && !/^[\d.,\s]+$/.test(String(it.betrag).trim()));
  if(bad){ toast("Bitte Beträge nur als Zahl eingeben, z. B. 5,00"); return }
  const list=Z.bulk.items.filter(x=>x.on); Z.bulk.phase="speichern"; Z.bulk.total=list.length; Z.bulk.n=0; render();
  let ok=0; const years=new Set();
  for(const it of list){
    Z.bulk.n++; Z.bulk.msg=`Beleg ${Z.bulk.n} von ${list.length}`; render();
    try{
      let asset="", ctype="";
      if(Z.ASSETS){ const {blob,type}=await bulkBlob(it); const up=await Z.ASSETS.upload(blob,{type}); asset=up.id; ctype=up.contentType }
      const d=parseIso(it.datum)||TODAY();
      const data={kat:it.kat,datum:isoD(d),jahr:d.getFullYear(),betrag:String(it.betrag).trim()===""?"":numDE(it.betrag),titel:String(it.titel||"").trim(),asset,ctype,eingereicht:false,created:new Date().toISOString()};
      if(Z.BCOL) await Z.BCOL.add(data); else Z.BEL.push({id:"local-"+Date.now()+"-"+ok,...data});
      ok++; years.add(String(d.getFullYear()));
    }catch(e){}
  }
  const cur=selYears(); Z.S.belegFilter.jahre=[...new Set([...cur,...years])]; Z.S.belegFilter.kat=""; save();
  Z.bulk=null; render(); scrollTop();
  toast(ok===list.length?(ok===1?"1 Beleg gespeichert":`${ok} Belege gespeichert`):`${ok} von ${list.length} Belegen gespeichert. Bitte die übrigen noch einmal versuchen.`);
}

