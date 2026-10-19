import { Z } from "./zustand.js";
import { esc, eur } from "./01-grundlagen.js";
import { deD, ic, parseIso } from "./03-hilfsmittel.js";
import { KATS, bruttoOf, chronisch, selYears, zuz } from "./10-fragebogen-und-fristen.js";
import { bulkView } from "./17-sammel-pdf.js";
import { blobUrl } from "./19-speicher.js";
/* ---------- Reiter: Belege ---------- */
function belegYears(){ const y=new Date().getFullYear(); const ys=new Set([y,y-1,y-2,y-3].map(String)); Z.BEL.forEach(b=>b.jahr&&ys.add(String(b.jahr))); return [...ys].sort().reverse() }
export function viewBelege(){
  const years=selYears(); const kf=Z.S.belegFilter.kat||"";
  const inYears=Z.BEL.filter(b=>years.includes(String(b.jahr)));
  const shown=inYears.filter(b=>!kf||b.kat===kf).sort((a,b)=>(b.datum||"").localeCompare(a.datum||""));
  const canFiles=!!Z.ASSETS;
  const label = years.length===1?years[0]:years.slice().reverse().join(", ");
  const byYear={}; for(const b of shown){ const y=String(b.jahr); (byYear[y]=byYear[y]||{}); (byYear[y][b.kat]=byYear[y][b.kat]||[]).push(b) }
  return `
  <section class="panel">
    <h2>Belege</h2>
    <div class="yearchips"><span class="small muted">Jahre anzeigen:</span>${belegYears().map(y=>`<button type="button" class="chip" data-year="${y}" aria-pressed="${years.includes(y)}">${y}</button>`).join("")}</div>
    ${Z.bulk?bulkView():Z.pending?pendingForm():`
    <div class="drop" id="drop">
      ${ic("camera")}
      <p><strong>Rezept, Quittung oder Rechnung erfassen</strong><br><span class="small muted">Fotografieren oder Datei (Bild/PDF) wählen. Auch ältere Belege, z. B. aus ${new Date().getFullYear()-2}: einfach das Datum vom Beleg eintragen.</span>${canFiles?`<br><span class="small"><strong>Neu:</strong> Eine PDF mit vielen Rechnungen? Die App erkennt jede Rechnung und sortiert sie nach Jahr.</span>`:""}</p>
      <div class="btnrow" style="justify-content:center">
        ${canFiles?`<button class="btn" type="button" data-act="cam">${ic("camera")}Foto aufnehmen</button><button class="btn soft" type="button" data-act="pick">${ic("file")}Datei wählen</button>`:""}
        <button class="btn ${canFiles?"ghost":""}" type="button" data-act="manual">${ic("plus")}Ohne Foto erfassen</button>
      </div>
      ${canFiles?"":`<p class="small muted">Fotos speichern geht nur mit Konto. Beträge kannst du trotzdem erfassen, sie bleiben aber nur bis zum Schließen der Seite.</p>`}
    </div>`}
  </section>

  <section class="panel">
    <div class="section-title"><h3>Zuzahlungen und Belastungsgrenze</h3><span class="small muted">§ 62 SGB V</span></div>
    <p class="small muted">Pro Jahr zahlt man höchstens 2 % der Bruttoeinnahmen des Haushalts zu, chronisch Kranke 1 %. Für Ehepartner und Kinder zieht die Kasse Freibeträge ab. Zuviel Gezahltes kann meist bis zu 4 Jahre rückwirkend erstattet werden, für jedes Jahr mit eigenem Antrag.</p>
    <div class="field" style="max-width:320px"><label for="chron">Schwerwiegend chronisch krank?</label><select id="chron"><option value="" ${!Z.S.chronisch?"selected":""}>Automatisch (${chronisch()?"ja":"nein"})</option><option value="ja" ${Z.S.chronisch==="ja"?"selected":""}>Ja, 1 %</option><option value="nein" ${Z.S.chronisch==="nein"?"selected":""}>Nein, 2 %</option></select></div>
    ${years.map(j=>{const z=zuz(j); const p=z.grenze?Math.min(100,z.sum/z.grenze*100):0; const reached=z.grenze&&z.sum>=z.grenze;
      return `<div class="meter" style="border-top:1px solid var(--line);padding-top:12px">
        <div class="section-title"><strong>${j}</strong><div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="brutto-${j}" class="small">Brutto ${j} (€)</label><input type="text" inputmode="decimal" id="brutto-${j}" data-brutto="${j}" value="${esc(bruttoOf(j))}" placeholder="z. B. 24000" style="width:130px"></div></div>
        <div class="nums"><span>Gezahlt: <strong>${eur(z.sum,2)}</strong></span><span>Grenze (${z.pct} %): <strong>${z.grenze?eur(z.grenze,2):"Brutto eintragen"}</strong></span></div>
        <div class="track" role="progressbar" aria-label="Zuzahlungen ${j}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}"><i class="${reached?"over":""}" style="width:${p}%"></i></div>
        ${z.grenze?(reached?`<p class="notice good">${ic("check")}<span><strong>Grenze erreicht.</strong> ${eur(z.sum-z.grenze,2)} zurückholen${j===String(new Date().getFullYear())?", und für den Rest des Jahres entfallen Zuzahlungen":""}.</span></p>`:`<p class="small muted">Noch ${eur(z.grenze-z.sum,2)} bis zur Grenze.</p>`):""}
        <div class="btnrow"><button class="btn small ${reached?"":"soft"}" type="button" data-befpdf="${j}">${ic("down")}Antrag ${j} + Belege (PDF)</button><button class="btn small ghost" type="button" data-befcopy="${j}">Antragstext kopieren</button></div>
      </div>`}).join("")}
  </section>

  <section style="display:flex;flex-direction:column;gap:12px">
    <div class="section-title"><h3>Abgelegt: ${esc(label)}</h3><span class="small muted">${shown.length} Belege · ${eur(shown.reduce((s,b)=>s+(Number(b.betrag)||0),0),2)}</span></div>
    <div class="filters"><button type="button" class="chip" data-kat="" aria-pressed="${!kf}">Alle Arten</button>${Object.entries(KATS).filter(([k])=>inYears.some(b=>b.kat===k)).map(([k,v])=>`<button type="button" class="chip" data-kat="${k}" aria-pressed="${kf===k}">${esc(v.t)}</button>`).join("")}</div>
    ${shown.length?Object.keys(byYear).sort().reverse().map(y=>`${years.length>1?`<h3 style="margin-top:4px">${y}</h3>`:""}${Object.entries(byYear[y]).map(([k,arr])=>`<div class="group"><header><span>${esc((KATS[k]||KATS.sonst).t)}</span><span>${eur(arr.reduce((s,b)=>s+(Number(b.betrag)||0),0),2)}</span></header>${arr.map(belegRow).join("")}</div>`).join("")}`).join("")
      :`<p class="notice info">${ic("receipt")}<span>Noch keine Belege für ${esc(label)}. Fotografiere jede Apotheken-Quittung mit Zuzahlung direkt nach dem Kauf, dann ist am Jahresende alles beisammen.</span></p>`}
    ${shown.length?`<div class="btnrow"><button class="btn small" type="button" data-act="mappe">${ic("down")}Belegmappe ${esc(label)} (PDF)</button><button class="btn small ghost" type="button" data-act="csv">Liste als Tabelle (CSV)</button></div>`:""}
  </section>`;
}
function belegRow(b){
  const isImg=b.asset && /^image\//.test(b.ctype||"");
  const thumb = b.asset ? (isImg?`<button type="button" class="thumb" data-view="${b.asset}" style="padding:0;cursor:zoom-in" aria-label="Beleg ansehen"><img src="${esc(blobUrl(b.asset))}" alt="" loading="lazy"></button>`:`<a class="thumb" href="${esc(blobUrl(b.asset))}" target="_blank" rel="noopener" aria-label="PDF öffnen">${ic("file")}</a>`) : `<span class="thumb">${ic("receipt")}</span>`;
  const d=parseIso(b.datum);
  return `<div class="beleg">${thumb}
    <div style="min-width:0"><div class="b-t">${esc(b.titel||(KATS[b.kat]||KATS.sonst).t)}</div><div class="b-m">${d?deD(d):"ohne Datum"}${b.eingereicht?' · <span style="color:var(--money);font-weight:700">eingereicht</span>':''}</div></div>
    <div class="b-v">${b.betrag!==""&&b.betrag!=null?eur(Number(b.betrag),2):"–"}</div>
    <div class="b-a">${Z.delAsk===b.id?`<span class="small">Wirklich löschen?</span><button type="button" class="linkbtn danger" data-delyes="${b.id}">Ja, löschen</button><button type="button" class="linkbtn" data-delno="1">Abbrechen</button>`:
      `<button type="button" class="linkbtn" data-edit="${b.id}">Bearbeiten</button><button type="button" class="linkbtn" data-sub-toggle="${b.id}">${b.eingereicht?"Als offen markieren":"Als eingereicht markieren"}</button><button type="button" class="linkbtn danger" data-del="${b.id}">Löschen</button>`}</div>
  </div>`;
}
function pendingForm(){
  const p=Z.pending; const canFiles=!!Z.ASSETS;
  return `<div class="pending">
    <h3>${p.editId?"Beleg bearbeiten":"Neuer Beleg"}</h3>
    <div class="preview">
      ${p.preview?`<span class="thumb big"><img src="${esc(p.preview)}" alt="Vorschau"></span>`:(p.file||p.keepAsset)?`<span class="thumb big">${ic("file")}</span>`:`<span class="thumb big">${ic("receipt")}</span>`}
      ${canFiles?`<div class="btnrow" style="flex-direction:column;align-items:flex-start"><button class="btn small soft" type="button" data-act="cam">${ic("camera")}${p.preview||p.file||p.keepAsset?"Neues Foto":"Foto aufnehmen"}</button><button class="btn small ghost" type="button" data-act="pick">${ic("file")}Datei wählen</button>${(p.file||p.keepAsset)?`<button class="linkbtn danger" type="button" data-act="dropphoto">Foto entfernen</button>`:""}</div>`:""}
    </div>
    <fieldset class="q"><legend>Was ist das für ein Beleg?</legend><div class="choices">${Object.entries(KATS).map(([k,v])=>`<label class="choice" for="pk-${k}"><input type="radio" id="pk-${k}" name="pk" data-pend="kat" value="${k}" ${p.kat===k?"checked":""}><span>${esc(v.t)}</span></label>`).join("")}</div></fieldset>
    <div class="grid2">
      <div class="field"><label for="pd">Datum auf dem Beleg</label><input type="date" id="pd" data-pend="datum" value="${esc(p.datum)}"></div>
      <div class="field"><label for="pb">Betrag</label><div class="euro"><input type="text" inputmode="decimal" id="pb" data-pend="betrag" value="${esc(p.betrag)}" placeholder="z. B. 5,00"><span>€</span></div></div>
    </div>
    <div class="field"><label for="pt">Kurze Beschreibung (freiwillig)</label><input type="text" id="pt" data-pend="titel" value="${esc(p.titel)}" placeholder="z. B. Apotheke am Markt"></div>
    <div class="nav big go"><button class="btn ghost" type="button" data-act="cancelbeleg" ${Z.busy?"disabled":""}>Abbrechen</button><button class="btn" type="button" data-act="savebeleg" ${Z.busy?"disabled":""}>${Z.busy?"Speichert …":p.editId?"Änderungen speichern":"Beleg speichern"}</button></div>
  </div>`;
}
