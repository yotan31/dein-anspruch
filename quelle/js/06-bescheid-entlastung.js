/* ---------- Bescheid & Widerspruch ---------- */
const PG_GRENZEN=[12.5,27,47.5,70,90]; // ab diesen Punkten gilt Pflegegrad 1..5
function pgAusPunkten(p){ let g=0; PG_GRENZEN.forEach((t,i)=>{ if(p>=t) g=i+1 }); return g }
function bescheidInfo(){
  const b=S.bescheid; if(!b) return null;
  const pts=numDE(b.punkte), hasPts=String(b.punkte||"").trim()!=="";
  const g=Number(b.pg)|| (hasPts?pgAusPunkten(pts):0);
  const next = g<5 ? PG_GRENZEN[g] : null;
  const fehlt = hasPts && next!=null ? Math.max(0, next-pts) : null;
  const ein=parseIso(b.eingang); let frist=null;
  if(ein){ frist=new Date(ein); frist.setMonth(frist.getMonth()+1) }
  const knapp = fehlt!=null && fehlt<=7.5;
  const abgelehnt = g===0 && (hasPts || b.art==="ablehnung");
  return {g,pts,hasPts,next,fehlt,frist,knapp,abgelehnt,offen: frist && daysUntil(frist)>=0};
}
let ocrBusy=false, ocrMsg="";
async function loadTesseract(){
  if(window.Tesseract) return window.Tesseract;
  return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"; s.integrity="sha256-qOKZGNCYsrBuEBK9rv+0rsBEXF1WVHCQI+C9H0QqgOg="; s.crossOrigin="anonymous"; s.onload=()=>res(window.Tesseract); s.onerror=rej; document.head.appendChild(s) });
}
const GUT_HINWEISE=[[/pflegebett/i,"Pflegebett","technisch"],[/hausnotruf/i,"Hausnotruf","technisch"],[/rollator/i,"Rollator (über die Krankenkasse)","technisch"],[/duschstuhl|duschhocker|badewannenlift|badewannen/i,"Hilfe im Bad","technisch"],[/haltegriff|treppenlift|umbau|wohnumfeld|schwelle/i,"Wohnungsumbau","wohnumfeld"],[/tagespflege/i,"Tagespflege","tagespflege"],[/reha|rehabilitation/i,"Reha-Empfehlung","beratung"],[/pflegekurs|schulung/i,"Pflegekurs","pflegekurs"]];
function parseBescheid(t){
  const out={};
  const txt=t.replace(/\s+/g," ");
  let m=txt.match(/Pflegegrad\s*[:\-]?\s*([1-5])\b/i); if(m) out.pg=m[1];
  m=txt.match(/(gesamtpunkt\w*|gewichtete\w*\s+gesamtpunkt\w*|punktwert|gesamtpunktzahl)[^0-9]{0,30}(\d{1,3}(?:[.,]\d{1,2})?)/i); if(m) out.punkte=m[2].replace(".",",");
  if(/abgelehnt|keine pflegebedürftigkeit|nicht pflegebedürftig/i.test(txt) && !out.pg) out.art="ablehnung";
  m=txt.match(/(?:vom|datum)\s*:?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i); if(m) out.datum=`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  out.hinweise=[...new Set(GUT_HINWEISE.filter(([re])=>re.test(txt)).map(([,t,k])=>t+"|"+k))];
  return out;
}
async function scanBescheid(file){
  if(!file) return;
  bescheidDraft={...(S.bescheid||{}), pg:S.bescheid?.pg||String(pg()||""), file};
  ocrBusy=true; ocrMsg="Das Dokument wird gelesen. Das dauert beim ersten Mal etwa 20 bis 40 Sekunden …"; render();
  try{
    const T=await loadTesseract();
    const {data}=await T.recognize(file,"deu");
    const r=parseBescheid(data.text||"");
    Object.assign(bescheidDraft, Object.fromEntries(Object.entries(r).filter(([k,v])=>v&&(!Array.isArray(v)||v.length))));
    ocrMsg = (r.pg||r.punkte) ? "Das haben wir erkannt. Bitte prüfen und bei Bedarf korrigieren." : "Wir konnten nicht alles sicher lesen. Bitte die Angaben vom Bescheid abtippen.";
  }catch(e){ ocrMsg="Lesen hat nicht geklappt. Bitte die Angaben einfach abtippen." }
  ocrBusy=false; render();
}
let bescheidDraft=null;
function bescheidCard(){
  if(!S.bereiche.pflege) return "";
  const i=bescheidInfo();
  if(bescheidDraft) return bescheidForm();
  if(!i) return `<section class="panel mini">
     <div class="mini-head">${ic("file")}<div><h3>Bescheid oder Gutachten bekommen?</h3><p class="small muted">Foto machen: Wir prüfen, ob sich ein Widerspruch lohnt, und behalten die Frist im Blick.</p></div></div>
     <div class="btnrow"><button class="btn small" type="button" data-act="bes-cam">${ic("camera")}Foto machen</button><button class="btn small ghost" type="button" data-act="bes-manual">Abtippen</button><button class="linkbtn" type="button" data-act="r-start">Pflegegrad selbst einschätzen</button></div>
   </section>`;
  const tage=i.frist?daysUntil(i.frist):null;
  const lohnt = (i.knapp||i.abgelehnt) && i.offen;
  return `<section class="panel mini ${lohnt?"warn":""}">
     <div class="mini-head">${ic("file")}<div><h3>Dein Bescheid${S.bescheid.datum?` vom ${deD(parseIso(S.bescheid.datum))}`:""}</h3>
       <p class="small">${i.g?`Pflegegrad ${i.g}`:"Kein Pflegegrad"}${i.hasPts?` · ${String(S.bescheid.punkte).replace(".",",")} Punkte`:""}${i.fehlt!=null&&i.g<5?` · noch ${String(i.fehlt.toFixed(1)).replace(".",",")} Punkte bis Pflegegrad ${i.g+1}`:""}</p></div></div>
     ${lohnt?`<p class="notice">${ic("alert")}<span><strong>Ein Widerspruch kann sich lohnen.</strong> ${i.abgelehnt?"Der Antrag wurde abgelehnt.":"Bis zum nächsten Pflegegrad fehlen nur wenige Punkte."} Frist: <strong>${deD(i.frist)}</strong> (${urgTxt(i.frist)}).</span></p>`
       : i.offen ? `<p class="small muted">Widerspruch möglich bis ${deD(i.frist)} (${urgTxt(i.frist)}).</p>`
       : i.frist ? `<p class="small muted">Die Widerspruchsfrist ist abgelaufen. Wird es schlechter, geht jederzeit ein Antrag auf Höherstufung.</p>`:""}
     ${(S.bescheid.hinweise||[]).length?`<p class="small">Im Gutachten erwähnt: ${S.bescheid.hinweise.map(h=>{const [t,k]=h.split("|");return `<button type="button" class="chip" data-gotoclaim="${k}">${esc(t)}</button>`}).join(" ")}</p>`:""}
     <div class="btnrow">${i.offen?`<button class="btn small ${lohnt?"":"ghost"}" type="button" data-wopen="widerspruch">Widerspruch schreiben</button>`:""}<button class="btn small ghost" type="button" data-act="bes-edit">Ändern</button></div>
   </section>`;
}
function bescheidForm(){
  const d=bescheidDraft;
  return `<section class="panel mini">
    <h3>Angaben aus dem Bescheid</h3>
    ${ocrBusy?`<p class="notice info">${ic("info")}<span>${esc(ocrMsg)}</span></p>`:ocrMsg?`<p class="small muted">${esc(ocrMsg)}</p>`:""}
    <div class="grid2">
      <div class="field"><label for="bd-pg">Festgestellter Pflegegrad</label><select id="bd-pg" data-bd="pg"><option value="0" ${d.pg==="0"?"selected":""}>Abgelehnt / keiner</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${String(d.pg)===String(n)?"selected":""}>Pflegegrad ${n}</option>`).join("")}</select></div>
      <div class="field"><label for="bd-pt">Gesamtpunkte (im Gutachten)</label><input type="text" inputmode="decimal" id="bd-pt" data-bd="punkte" value="${esc(d.punkte||"")}" placeholder="z. B. 44,25"></div>
      <div class="field"><label for="bd-dat">Datum des Bescheids</label><input type="date" id="bd-dat" data-bd="datum" value="${esc(d.datum||"")}"></div>
      <div class="field"><label for="bd-ein">Wann kam er bei euch an?</label><input type="date" id="bd-ein" data-bd="eingang" value="${esc(d.eingang||isoD(TODAY()))}"></div>
    </div>
    <p class="small muted">Die Punktzahl steht im Gutachten des Medizinischen Dienstes, meist als „Gesamtpunkte“. Fehlt das Gutachten, darfst du es bei der Pflegekasse anfordern.</p>
    <div class="nav"><button class="btn ghost" type="button" data-act="bes-cancel">Abbrechen</button><button class="btn" type="button" data-act="bes-save" ${ocrBusy?"disabled":""}>Speichern</button></div>
  </section>`;
}
async function saveBescheid(){
  const d=bescheidDraft; if(!d) return;
  const file=d.file; delete d.file;
  S.bescheid={pg:String(d.pg||""),punkte:d.punkte||"",datum:d.datum||"",eingang:d.eingang||isoD(TODAY()),art:d.art||"",hinweise:d.hinweise||[]};
  if(Number(S.bescheid.pg)>0) S.pg=S.bescheid.pg;
  bescheidDraft=null; ocrMsg=""; delete S.texte.widerspruch; delete S.texte.widerspruch_sub;
  save(); render(); toast("Bescheid gespeichert");
  if(file && ASSETS && BCOL){ try{ const {blob,type}=await prepareFile(file); const up=await ASSETS.upload(blob,{type}); await BCOL.add({kat:"bescheid",datum:S.bescheid.datum||isoD(TODAY()),jahr:(parseIso(S.bescheid.datum)||TODAY()).getFullYear(),betrag:"",titel:"Pflegegrad-Bescheid",asset:up.id,ctype:up.contentType,eingereicht:false,created:new Date().toISOString()}) }catch(e){} }
}
B.push({k:"widerspruch", area:"Pflege", t:"Widerspruch gegen den Pflegegrad-Bescheid", p:"§ 84 SGG, § 18 SGB XI",
  when:()=>false, val:()=>null, short:"", to:PK,
  steps:["Fristwahrend reicht ein kurzer Widerspruch. Die ausführliche Begründung kannst du nachreichen.","Gutachten anfordern, falls es nicht beilag, und Punkt für Punkt prüfen, wo Hilfe zu niedrig bewertet wurde.","Pflegetagebuch über 1–2 Wochen führen und beilegen.","Bei der zweiten Begutachtung eine vertraute Person dabei haben."],
  docs:["Kopie des Bescheids","Pflegetagebuch (wenn vorhanden)","Aktuelle Arztberichte"]});
ASSIST.widerspruch={q:[
  {k:"grund",type:"multi",label:"Was wurde im Gutachten zu niedrig eingeschätzt?",help:"Alles ankreuzen, was zutrifft. Unsicher? Dann „Weiß ich nicht“ – der Widerspruch gilt trotzdem.",opts:OPT([...HILFE,"Der Gutachter war nur sehr kurz da","Es war ein „guter Tag“, sonst ist es schlechter"])},
  {k:"gutachten",type:"choice",label:"Liegt euch das Gutachten vor?",opts:OPT([{v:"ja",t:"Ja"},{v:"nein",t:"Nein",s:"wir fordern es im Widerspruch mit an"}])},
  {k:"tel",type:"tel",label:"Telefonnummer für eine neue Begutachtung",ph:"z. B. 0711 123456"}],
 ask:()=>{const b=S.bescheid||{}; const o=ansObj("widerspruch");
  return `lege ich hiermit Widerspruch gegen den Bescheid${b.datum?` vom ${deD(parseIso(b.datum))}`:" vom [Datum]"} über die Feststellung der Pflegebedürftigkeit ein${Number(b.pg)>0?` (festgestellt: Pflegegrad ${b.pg})`:""}.\n\nDer tatsächliche Hilfebedarf wurde im Gutachten nicht ausreichend berücksichtigt${has("widerspruch","grund")?`, insbesondere in folgenden Bereichen: ${av("widerspruch","grund")}`:""}. Eine ausführliche Begründung reiche ich nach.\n\n${o.gutachten==="ja"?"":"Bitte senden Sie mir das vollständige Gutachten des Medizinischen Dienstes zu. "}Ich beantrage eine erneute Begutachtung, möglichst durch eine andere Gutachterin oder einen anderen Gutachter. Für die Terminabsprache bin ich erreichbar unter: ${av("widerspruch","tel","Telefonnummer")}.`}};
B.find(x=>x.k==="widerspruch").q=ASSIST.widerspruch.q; B.find(x=>x.k==="widerspruch").ask=ASSIST.widerspruch.ask;

/* ---------- Entlastungsbetrag-Konto ---------- */
function entlKonto(){
  if(!(pg()>=1 && isHome())) return null;
  const t=TODAY(), y=t.getFullYear();
  const seit=parseIso(S.entlSeit?S.entlSeit+"-01":"");
  const monate=(jahr,bisMonat)=>{ let von=0; if(seit){ if(seit.getFullYear()>jahr) return 0; if(seit.getFullYear()===jahr) von=seit.getMonth() } return Math.max(0,bisMonat-von) };
  const used=(jahr,nurH1)=>BEL.filter(b=>b.kat==="entl"&&String(b.jahr)===String(jahr)&&(!nurH1||(parseIso(b.datum)||t).getMonth()<6)).reduce((s,b)=>s+(Number(b.betrag)||0),0);
  const vorjBudget=ENTLASTUNG*monate(y-1,12), vorjRest=Math.max(0,vorjBudget-used(y-1));
  const h1=used(y,true), ausVorj=Math.min(vorjRest,h1);
  const vorjOffen = t<=new Date(y,5,30) ? vorjRest-ausVorj : 0;
  const bisHeute=ENTLASTUNG*monate(y,t.getMonth()+1), jahr=ENTLASTUNG*monate(y,12);
  const genutzt=used(y)-ausVorj;
  const frei=Math.max(0,bisHeute-genutzt)+vorjOffen;
  return {y,frei,vorjOffen,verfall:new Date(y,5,30),genutzt:used(y),bisHeute,jahr,belege:BEL.filter(b=>b.kat==="entl").length};
}
function entlCard(){
  const k=entlKonto(); if(!k) return "";
  const pct=k.bisHeute?Math.min(100,(k.genutzt/(k.bisHeute+(k.vorjOffen||0)))*100):0;
  return `<section class="panel mini">
    <div class="mini-head">${ic("receipt")}<div><h3>Entlastungsbetrag</h3><p class="small muted">131 € im Monat für Haushaltshilfe, Betreuung oder Tagespflege</p></div>
      <div class="mini-num"><span class="small muted">jetzt frei</span><b>${eur(k.frei)}</b></div></div>
    <div class="meter"><div class="track"><i style="width:${pct}%"></i></div>
      <div class="nums"><span>${k.y} genutzt: <strong>${eur(k.genutzt,2)}</strong></span><span>Anspruch bis heute: <strong>${eur(k.bisHeute)}</strong></span></div></div>
    ${k.vorjOffen>0?`<p class="notice ${daysUntil(k.verfall)<=60?"":"info"}">${ic("alert")}<span><strong>${eur(k.vorjOffen)} aus ${k.y-1}</strong> verfallen am 30.06.${k.y} (${urgTxt(k.verfall)}). Jetzt Hilfe organisieren und Rechnung einreichen.</span></p>`:""}
    ${!k.belege?`<p class="small muted">Trag jede Rechnung als Beleg „Entlastungsbetrag“ ein, dann rechnet die App automatisch mit.</p>`:""}
    <div class="btnrow"><button class="btn small" type="button" data-act="entl-add">${ic("plus")}Rechnung erfassen</button><button class="btn small ghost" type="button" data-wopen="entlastung">Erstattung beantragen</button>
      <label class="small muted" style="display:flex;align-items:center;gap:6px">Pflegegrad seit <input type="month" id="entl-seit" value="${esc(S.entlSeit||"")}" style="width:auto;padding:4px 8px"></label></div>
  </section>`;
}


