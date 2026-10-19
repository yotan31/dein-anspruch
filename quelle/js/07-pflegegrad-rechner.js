/* ---------- Pflegegrad-Rechner (Selbsteinschätzung nach dem Begutachtungsinstrument) ---------- */
const SELB=[["0","Selbstständig","schafft es allein"],["1","Überwiegend selbstständig","braucht ab und zu etwas Hilfe"],["2","Überwiegend unselbstständig","schafft nur einen kleinen Teil allein"],["3","Unselbstständig","schafft es nicht allein"]];
const FAEH=[["0","Ja, ohne Probleme",""],["1","Meistens",""],["2","Nur selten",""],["3","Nein, gar nicht",""]];
const HAEUF=[["0","Nie",""],["1","Selten","1- bis 3-mal im Monat"],["3","Oft","mehrmals pro Woche"],["5","Täglich",""]];
const RQ=[
 {m:1,q:"Im Bett die Lage wechseln (umdrehen, aufsetzen)",o:SELB},
 {m:1,q:"Sicher sitzen, ohne zur Seite zu kippen",o:SELB},
 {m:1,q:"Aufstehen vom Stuhl oder Bett und sich umsetzen",o:SELB},
 {m:1,q:"In der Wohnung von Raum zu Raum gehen",o:SELB},
 {m:1,q:"Treppen steigen",o:SELB},
 {m:2,q:"Erkennt vertraute Personen aus dem Umfeld",o:FAEH},
 {m:2,q:"Weiß, welcher Tag und welche Tageszeit ist",o:FAEH},
 {m:2,q:"Trifft Entscheidungen im Alltag (z. B. was anziehen)",o:FAEH},
 {m:2,q:"Kann einem Gespräch folgen und es verstehen",o:FAEH},
 {m:3,q:"Ist nachts unruhig, läuft umher oder ruft",o:HAEUF},
 {m:3,q:"Wehrt sich gegen Pflege oder Hilfe",o:HAEUF},
 {m:3,q:"Hat starke Ängste oder ist sehr niedergeschlagen",o:HAEUF},
 {m:4,q:"Oberkörper waschen",o:SELB,w:1},
 {m:4,q:"Duschen oder baden (inkl. Haare waschen)",o:SELB,w:1},
 {m:4,q:"Oberkörper an- und auskleiden",o:SELB,w:1},
 {m:4,q:"Unterkörper an- und auskleiden (Hose, Socken, Schuhe)",o:SELB,w:1},
 {m:4,q:"Essen (mundgerecht zubereitetes Essen zum Mund führen)",o:SELB,w:3},
 {m:4,q:"Trinken (genug und selbstständig)",o:SELB,w:2},
 {m:4,q:"Toilette benutzen",o:SELB,w:2},
 {m:5,q:"Wie oft wird Hilfe bei Medikamenten, Spritzen, Verbänden oder Messungen gebraucht?",o:[["0","Nie oder selten",""],["1","Wöchentlich",""],["3","Täglich",""],["5","Mehrmals täglich",""]]},
 {m:5,q:"Wie oft muss jemand zu Arzt- oder Therapieterminen begleiten?",o:[["0","Nie",""],["1","Etwa einmal im Monat",""],["2","Jede Woche",""]]},
 {m:6,q:"Den Tag einteilen und sich an Abläufe halten",o:SELB},
 {m:6,q:"Sich sinnvoll beschäftigen",o:SELB},
 {m:6,q:"Kontakt zu Familie, Nachbarn, Freunden halten",o:SELB},
];
const MOD={1:{n:"Mobilität",max:15,t:[[2,2.5],[4,5],[6,7.5],[10,10]]},2:{n:"Verstehen und Erinnern",max:33,t:[[2,3.75],[6,7.5],[11,11.25],[17,15]]},3:{n:"Verhalten und Psyche",t:[[1,3.75],[3,7.5],[5,11.25],[7,15]]},4:{n:"Selbstversorgung",max:54,t:[[3,10],[8,20],[19,30],[37,40]]},5:{n:"Krankheitsbedingte Hilfe",t:[[1,5],[2,10],[4,15],[6,20]]},6:{n:"Alltag und Kontakte",max:18,t:[[1,3.75],[4,7.5],[7,11.25],[12,15]]}};
let RECHNER=null; // {i, a:[]}
function rechnerErgebnis(a){
  const roh={1:0,2:0,3:0,4:0,5:0,6:0}, mx={1:0,2:0,3:0,4:0,5:0,6:0};
  RQ.forEach((q,i)=>{ const v=Number(a[i]||0)*(q.w||1); roh[q.m]+=v; mx[q.m]+=Number(q.o[q.o.length-1][0])*(q.w||1) });
  const gew={};
  for(const m of [1,2,3,4,5,6]){
    let r=roh[m]; if(MOD[m].max && mx[m]) r=r/mx[m]*MOD[m].max; // auf das echte Modul hochrechnen
    let g=0; MOD[m].t.forEach(([ab,p])=>{ if(r>=ab-1e-9) g=p }); gew[m]=g;
  }
  const m23=Math.max(gew[2],gew[3]);
  const summe=gew[1]+m23+gew[4]+gew[5]+gew[6];
  return {summe,grad:pgAusPunkten(summe),gew,m23};
}
function startRechner(){ RECHNER={i:0,a:[]}; render(); scrollTop() }
function viewRechner(){
  const R=RECHNER, n=RQ.length;
  if(R.i>=n){
    const e=rechnerErgebnis(R.a); const hat=(typeof USER!=='undefined'&&USER)||(typeof GUEST!=='undefined'&&GUEST); const aktuell=pg();
    const next=e.grad<5?PG_GRENZEN[e.grad]:null;
    const bars=[[1,"Mobilität",10,e.gew[1]],[23,"Verstehen / Verhalten",15,e.m23],[4,"Selbstversorgung",40,e.gew[4]],[5,"Krankheitsbedingte Hilfe",20,e.gew[5]],[6,"Alltag und Kontakte",15,e.gew[6]]];
    return `<section class="panel wiz">
      <div class="wiztop"><button type="button" class="btn small ghost" data-act="r-close">← Schließen</button><span class="small muted">Pflegegrad-Rechner</span></div>
      <h2 class="wq">${e.grad?`Voraussichtlich Pflegegrad ${e.grad}`:"Voraussichtlich noch kein Pflegegrad"}</h2>
      <p class="whelp">${ic("info")}<span>Geschätzt ${String(e.summe.toFixed(1)).replace(".",",")} von 100 Punkten.${next?` Ab ${String(next).replace(".",",")} Punkten gäbe es Pflegegrad ${e.grad+1}.`:""} Das ist eine Schätzung. Die Entscheidung trifft der Medizinische Dienst bei einem Hausbesuch.</span></p>
      <div class="rbars">${bars.map(([k,l,mx,v])=>`<div><span>${l}</span><div class="track"><i style="width:${Math.round(v/mx*100)}%"></i></div><b>${String(v).replace(".",",")}</b></div>`).join("")}</div>
      ${e.grad>=1&&(!aktuell||e.grad>aktuell)?`<p class="notice good">${ic("check")}<span>${aktuell?`Das wäre höher als der jetzige Pflegegrad ${aktuell}. Ein Antrag auf Höherstufung kann sich lohnen.`:`Ein Antrag auf einen Pflegegrad kann sich lohnen. Ab Pflegegrad 1 gibt es schon ${ENTLASTUNG} € im Monat Entlastungsbetrag und mehr.`}</span></p>`:""}
      <div class="btnrow big">${hat?(e.grad>=1&&(!aktuell||e.grad>aktuell)?`<button class="btn" type="button" data-act="r-antrag">${aktuell?"Höherstufung beantragen":"Pflegegrad beantragen"}</button>`:"")
        :`<button class="btn" type="button" data-act="r-konto">Antrag vorbereiten (kostenlos)</button>`}
        <button class="btn ghost" type="button" data-act="r-neu">Noch einmal</button></div>
      <button class="linkbtn" type="button" data-act="teilen" style="align-self:flex-start">Rechner an Familie oder Freunde weiterempfehlen</button>
    </section>`;
  }
  const q=RQ[R.i];
  return `<section class="panel wiz">
    <div class="wiztop"><button type="button" class="btn small ghost" data-act="r-close">← Schließen</button><span class="small muted">Pflegegrad-Rechner · ${MOD[q.m].n}</span></div>
    ${bar(R.i+1,n,`Frage ${R.i+1} von ${n}`)}
    ${R.i===0?`<p class="small muted">Beantworte die Fragen so, wie es an einem normalen Tag ist, nicht an einem besonders guten.</p>`:""}
    <h2 class="wq">${esc(q.q)}</h2>
    <div class="choices big">${q.o.map(([v,t,s])=>`<label class="choice" for="rq-${v}"><input type="radio" id="rq-${v}" name="rq" data-rq="${v}" ${R.a[R.i]===v?"checked":""}><span>${esc(t)}${s?`<small>${esc(s)}</small>`:""}</span></label>`).join("")}</div>
    <div class="nav big go">${R.i>0?`<button class="btn ghost" type="button" data-act="r-back">Zurück</button>`:"<span></span>"}${R.a[R.i]!=null?`<button class="btn" type="button" data-act="r-next">Weiter</button>`:""}</div>
  </section>`;
}


