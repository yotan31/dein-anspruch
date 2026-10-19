import { Z } from "./zustand.js";
import { esc, eur, pg } from "./01-grundlagen.js";
import { FA, KK, PK, txt } from "./02-leistungen.js";
import { AREA_ICON, deD, ic } from "./03-hilfsmittel.js";
import { bescheidCard, entlCard } from "./06-bescheid-entlastung.js";
import { finderHTML } from "./08-anbieter.js";
import { langNotice } from "./09-sprachen.js";
import { deadlines, urg, urgTxt } from "./10-fragebogen-und-fristen.js";
import { sums } from "./11-darstellung.js";
import { datenBox } from "./21-sicherung-und-loeschen.js";
/* ---------- Reiter: Ansprüche ---------- */
export function viewAnsprueche(){
  const {all,offen}=sums();
  const genutzt = all.filter(b=>Z.S.genutzt[b.k]);
  const areas=["Alle",...new Set(offen.map(b=>b.area))];
  if(!areas.includes(Z.areaFilter)) Z.areaFilter="Alle";
  const sorted = offen.filter(b=>Z.areaFilter==="Alle"||b.area===Z.areaFilter)
    .sort((a,b)=>(Number(!!a.opt)-Number(!!b.opt)) || ((b.val()||0)-(a.val()||0)) || ((b.mon?b.mon():0)-(a.mon?a.mon():0)));
  const dl=deadlines().filter(x=>!x.ok && urg(x.d)!=="ok").slice(0,2);
  return `
   ${dl.map(x=>`<p class="notice ${urg(x.d)==="late"?"bad":""}">${ic("bell")}<span><strong>${esc(x.t)}</strong> – Frist ${deD(x.d)} (${urgTxt(x.d)}). <button type="button" class="linkbtn" data-tab="termine">Zu den Terminen</button></span></p>`).join("")}
   ${!Z.S.welcomeSeen?`<section class="panel" style="gap:12px">
     <div class="section-title"><h2>Fertig! So geht's weiter</h2><button type="button" class="linkbtn" data-act="welcome-ok">Ausblenden</button></div>
     <div class="howto">
       <button type="button" class="howbtn" data-act="welcome-ok"><b>${ic("list")}Ansprüche prüfen</b><span>Unten antippen: Anleitung, Checkliste, fertiger Antrag als Text oder PDF.</span></button>
       <button type="button" class="howbtn" data-tab="belege"><b>${ic("receipt")}Belege sammeln</b><span>Rezepte und Rechnungen fotografieren, nach Jahr sortieren, einreichen.</span></button>
       <button type="button" class="howbtn" data-tab="termine"><b>${ic("bell")}Fristen im Blick</b><span>Erinnerung an Beratungsbesuch und Abgabefristen im Kalender.</span></button>
     </div></section>`:""}
   ${(bescheidCard()||entlCard())?`<div class="minis">${bescheidCard()}${entlCard()}</div>`:""}
   ${langNotice()}
   <div class="section-title"><h2>Deine offenen Ansprüche</h2><span class="small muted">Antippen für Antrag und Checkliste</span></div>
   ${areas.length>2?`<div class="filters">${areas.map(a=>`<button type="button" class="chip" data-area="${esc(a)}" aria-pressed="${Z.areaFilter===a}">${esc(a)}</button>`).join("")}</div>`:""}
   <div class="list">${sorted.map(itemHTML).join("") || '<p class="muted">Ihr nutzt bereits alles, was wir prüfen konnten.</p>'}</div>
   ${genutzt.length?`<details class="used"><summary>Bereits genutzt (${genutzt.length})</summary><div class="list" style="margin-top:10px">${genutzt.map(itemHTML).join("")}</div></details>`:""}
   <div class="nav"><button class="btn ghost" type="button" data-act="edit">Angaben ändern</button><button class="btn ghost" type="button" data-act="reset">Antworten zurücksetzen</button></div>
   <div id="resetconfirm" hidden class="notice bad">${ic("alert")}<span>Alle Antworten aus dem Fragebogen zurücksetzen und neu anfangen? Belege und Fristen bleiben erhalten. <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="reset-no">Abbrechen</button></span></span></div>
   ${datenBox()}`;
}
function valueLabel(b){
  if(b.val && b.val()) return `<span class="val">${eur(b.val())}/Jahr</span>`;
  if(b.mon && b.mon()) return `<span class="val">bis ${eur(b.mon(), b.mon()%1?2:0)}/Mon.</span>`;
  if(b.once) return `<span class="val">bis ${eur(b.once)}</span>`;
  if(b.frei) return `<span class="val">${eur(b.frei())} Freibetrag</span>`;
  return `<span class="val neutral">${b.opt?"prüfen":"kostenlos"}</span>`;
}
Z.openKey = null;
function itemHTML(b){
  const st = Z.S.status[b.k]||"offen";
  const open = Z.openKey===b.k;
  return `<article class="item" id="it-${b.k}">
    <button class="head" type="button" data-open="${b.k}" aria-expanded="${open}">
      <span class="ico a-${esc(b.area)}">${ic(AREA_ICON[b.area]||"heart")}</span>
      <span class="ttl">${esc(b.t)}<span class="para">${esc(b.p)} · ${esc(b.area)}</span></span>${valueLabel(b)}
      <span class="short">${esc(txt(b.short))}</span>
      ${(b.opt||st!=="offen")?`<span class="tags">${b.opt?'<span class="tag">je nach Lage</span>':''}${st!=="offen"?`<span class="tag st-${st}">${st}</span>`:''}</span>`:""}
    </button>
    ${open?detailHTML(b):""}
  </article>`;
}
export function docsFor(b){
  const d=[...(txt(b.docs)||[])].filter(Boolean);
  if(Z.S.rolle==="angehoerig" && b.to!==FA && b.to!=="arbeitgeber" && !d.some(x=>/Vollmacht/.test(x))) d.push("Vollmacht oder Betreuungsurkunde");
  return d;
}
function detailHTML(b){
  const checks = docsFor(b), st=Z.S.status[b.k]||"offen";
  const nQ=(b.q||[]).filter(q=>!q.show||q.show()).length;
  return `<div class="detail">
    ${b.ask?`<div class="startbox">
        <button class="btn big" type="button" data-wopen="${b.k}">${ic("file")}${st==="offen"?"Antrag ausfüllen":"Antrag ansehen"}</button>
        ${["pg_antrag","pg_hoch"].includes(b.k)?`<button class="btn ghost" type="button" data-act="r-start">Erst selbst einschätzen: Pflegegrad-Rechner</button>`:""}
        <p class="small muted">${nQ?`${nQ} einfache Fragen, Schritt für Schritt. Du kannst jederzeit zurück, nichts wird ohne dich abgeschickt.`:"Der Antrag ist schon fertig vorbereitet. Du musst nur noch prüfen."}</p>
      </div>`:`<p class="notice info">${ic("info")}<span>Dafür ist kein Antrag nötig. Trage den Betrag einfach in der Steuererklärung ein (oder gib diese Info an deine Steuerberatung weiter).</span></p>`}
    <div><h4>So läuft es ab</h4><ol>${b.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
    ${finderHTML(b.k)}
    ${checks.length?`<div><h4>Diese Unterlagen brauchst du</h4><ul class="checks">${checks.map((c,i)=>`<li><label><input type="checkbox" data-check="${b.k}:${i}" ${Z.S.checks[b.k+":"+i]?"checked":""}><span>${esc(c)}</span></label></li>`).join("")}</ul></div>`:""}
    <div class="status"><label for="st-${b.k}"><strong>Stand:</strong></label><select id="st-${b.k}" data-status="${b.k}">${[["offen","noch nicht beantragt"],["beantragt","beantragt, warte auf Antwort"],["bewilligt","bewilligt"]].map(([v,t])=>`<option value="${v}" ${st===v?"selected":""}>${t}</option>`).join("")}</select>
    <label class="choice" for="gn-${b.k}" style="padding:6px 10px"><input type="checkbox" id="gn-${b.k}" data-gen="${b.k}" ${Z.S.genutzt[b.k]?"checked":""}><span>bekommen wir schon</span></label></div>
  </div>`;
}
export function today(){return new Date().toLocaleDateString("de-DE")}
function letter(b){
  const p=Z.S.person, a=Z.S.rolle==="angehoerig";
  const who = p.name||"[Name]";
  const ref = [p.vnr && (b.to===PK||b.to===KK) ? `Versichertennummer: ${p.vnr}`:"", p.geb?`geboren am ${p.geb}`:""].filter(Boolean).join(", ");
  const subject = `${b.t}${b.to===PK||b.to===KK?" – "+(p.vnr?"Versichertennr. "+p.vnr:who):" – "+who}`;
  const intro = a
    ? `ich wende mich als ${p.beziehung||"[Beziehung]"} im Namen von ${who}${ref?" ("+ref+")":""} an Sie. Eine Vollmacht liegt bei.\n\nFür ${who}`
    : `${ref?"("+ref+")\n\n":""}hiermit`;
  const pgline = pg()>=1 && (b.to===PK||b.to===KK) ? `\n\nEs ist Pflegegrad ${pg()} festgestellt.` : "";
  let ask = txt(b.ask);
  if(!a) ask = ask.replace(/^(\S+) ich hiermit /,"$1 ich ");
  const body = `Sehr geehrte Damen und Herren,\n\n${intro} ${ask}${pgline}\n\nBitte bestätigen Sie mir den Eingang dieses Antrags. Falls Sie ein bestimmtes Formular oder weitere Unterlagen benötigen, senden Sie mir diese bitte zu. Dieses Schreiben gilt als fristwahrende Antragstellung (§ 16 SGB I).\n\nMit freundlichen Grüßen\n\n${a?(p.absender||"[Dein Name]"):who}${p.tel?"\nTel. "+p.tel:""}${p.mail?"\n"+p.mail:""}`;
  return {subject, body};
}
export function curLetter(b){const L=letter(b);return {subject:Z.S.texte[b.k+"_sub"]??L.subject, body:Z.S.texte[b.k]??L.body}}
export function mailto(b,addr){const L=curLetter(b);return `mailto:${addr}?subject=${encodeURIComponent(L.subject)}&body=${encodeURIComponent(L.body)}`}

