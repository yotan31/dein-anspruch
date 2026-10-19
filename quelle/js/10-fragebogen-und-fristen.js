/* ---------- Schritte ---------- */
const STEPS = [
 {id:"start", label:"Start", show:()=>true},
 {id:"kasse", label:"Kasse", show:()=>S.bereiche.pflege},
 {id:"pflege", label:"Pflegegrad", show:()=>S.bereiche.pflege},
 {id:"pp", label:"Pflegeperson", show:()=>S.bereiche.pflege && pg()>=1 && isHome()},
 {id:"sb", label:"Schwerbehinderung", show:()=>S.bereiche.sb},
 {id:"genutzt", label:"Schon genutzt", show:()=>true},
 {id:"daten", label:"Deine Angaben", show:()=>true},
];
const visSteps = ()=>STEPS.filter(s=>s.show());

/* ---------- Belege-Daten ---------- */
const KATS={
 apo:{t:"Zuzahlung Apotheke / Rezept", zz:true},
 fahrt:{t:"Zuzahlung Fahrten", zz:true},
 heil:{t:"Zuzahlung Therapie, Hilfsmittel, Klinik", zz:true},
 entl:{t:"Entlastungsbetrag (Rechnungen)"},
 vhp:{t:"Verhinderungs- & Kurzzeitpflege"},
 pflhm:{t:"Pflegehilfsmittel"},
 beratung:{t:"Nachweis Beratungsbesuch"},
 bescheid:{t:"Bescheide & Schreiben"},
 sonst:{t:"Sonstiges"},
};
let BEL=[];            // Belege aus der Datenbank
let pending=null;      // Beleg, der gerade erfasst wird
let delAsk=null;       // Beleg-ID, deren Löschen bestätigt werden soll
let busy=false;
let areaFilter="Alle";
let fileTarget=null;
let befJahr=String(new Date().getFullYear());
function selYears(){ let j=(S.belegFilter.jahre||[]).map(String).filter(Boolean); if(!j.length) j=[String(new Date().getFullYear())]; return [...new Set(j)].sort().reverse() }
function bruttoOf(j){ j=String(j); const bj=S.bruttoJahr||{}; if(bj[j]!=null&&bj[j]!=="") return bj[j]; return j===String(new Date().getFullYear())?(S.brutto||""):"" }
function chronisch(){ if(S.chronisch) return S.chronisch==="ja"; return pg()>=3||gdb()>=60 }
function zuz(jahr){
  const sum=BEL.filter(b=>KATS[b.kat]&&KATS[b.kat].zz&&String(b.jahr)===String(jahr)).reduce((s,b)=>s+(Number(b.betrag)||0),0);
  const pct=chronisch()?1:2; const brutto=numDE(bruttoOf(jahr));
  return {sum,pct,brutto,grenze:brutto?brutto*pct/100:0};
}

/* ---------- Termine ---------- */
function beratungRelevant(){ return pg()>=2 && ["angehoerige","gemischt","wg"].includes(S.wohnen) }
function besuche(){
  const a=(S.termine.besuche||[]).map(x=>x.d);
  const b=BEL.filter(x=>x.kat==="beratung"&&x.datum).map(x=>x.datum);
  return [...new Set([...a,...b])].filter(parseIso).sort();
}
function beratungStatus(){
  const H=halfOf(TODAY()); const v=besuche().map(parseIso);
  const inH=h=>v.some(d=>d>=h.start&&d<=h.end);
  return {H, done:inH(H), prev:shiftHalf(H,-1), prevDone:inH(shiftHalf(H,-1)), next:shiftHalf(H,1), inH};
}
function deadlines(){
  const L=[]; const t=TODAY(); const y=t.getFullYear();
  if(beratungRelevant()){
    const st=beratungStatus();
    if(!st.done){ const d=st.H.end; L.push({k:"beratung",t:`Beratungsbesuch für das ${st.H.label}`,d,remind:addDays(d,-45),s:`Pflicht für Pflegegeld (§ 37 Abs. 3 SGB XI). Termin mit ${S.termine.dienst||"dem Pflegedienst"} vereinbaren und den Nachweis an die Pflegekasse schicken lassen.`,main:true}) }
    else { const d=st.next.end; L.push({k:"beratung",t:`Beratungsbesuch für das ${st.next.label}`,d,remind:addDays(st.next.start,30),s:`Für das ${st.H.label} erledigt. Der nächste Besuch muss zwischen ${deD(st.next.start)} und ${deD(st.next.end)} stattfinden.`,main:true,ok:true}) }
  }
  { const bi=bescheidInfo(); if(bi && bi.offen) L.push({k:"wid",t:"Widerspruchsfrist Pflegegrad-Bescheid",d:bi.frist,remind:addDays(bi.frist,-7),s:(bi.knapp||bi.abgelehnt)?"Ein Widerspruch kann sich lohnen. Fristwahrend reicht ein kurzes Schreiben, die App hilft dabei.":"Bis zu diesem Tag kann Widerspruch gegen den Bescheid eingelegt werden."}) }
  if(pg()>=1 && isHome()){
    const thisJune=new Date(y,5,30);
    const d = t<=thisJune?thisJune:new Date(y+1,5,30);
    L.push({k:"entl",t:"Entlastungsbetrag: Restguthaben verfällt",d,remind:addDays(d,-60),s:`Nicht genutzte Beträge aus ${d.getFullYear()-1} verfallen an diesem Tag. Jetzt Haushaltshilfe oder Betreuung organisieren und Rechnungen einreichen.`});
  }
  if(pg()>=2 && isHome()){
    const d=new Date(y,11,31);
    L.push({k:"vhp",t:`Verhinderungspflege aus ${y-1} einreichen`,d,remind:addDays(d,-45),s:`Ausschlussfrist: Kosten der Ersatzpflege aus ${y-1} müssen bis heute mit Nachweisen bei der Pflegekasse sein.`});
  }
  if(BEL.some(b=>KATS[b.kat]&&KATS[b.kat].zz) || pg()>=3 || gdb()>=60){
    const d=new Date(y+1,0,15);
    L.push({k:"zz",t:`Zuzahlungsbefreiung für ${y+1} beantragen`,d,remind:d,s:"Die Befreiung gilt immer nur für ein Kalenderjahr. Chronisch Kranke können den Betrag auch vorab zahlen und sind dann das ganze Jahr befreit."});
  }
  const wm=parseIso(S.termine.wertmarke);
  if(wm) L.push({k:"wm",t:"Wertmarke läuft ab",d:wm,remind:addDays(wm,-30),s:"Neue Wertmarke rechtzeitig beim Versorgungsamt beantragen."});
  for(const e of (S.termine.eigene||[])){ const d=parseIso(e.d); if(d) L.push({k:"own-"+e.id,t:e.t,d,remind:d,s:e.n||"Eigene Erinnerung",own:e.id}) }
  return L.sort((a,b)=>a.d-b.d);
}
function urg(d){const n=daysUntil(d); return n<0?"late":n<=60?"soon":"ok"}
function urgTxt(d){const n=daysUntil(d); return n<0?`${-n} Tage überfällig`:n===0?"heute":n===1?"morgen":`in ${n} Tagen`}
function gcal(item){
  const r=item.remind<TODAY()?TODAY():item.remind; const a=isoD(r).replace(/-/g,""), b=isoD(addDays(r,1)).replace(/-/g,"");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.t)}&dates=${a}/${b}&details=${encodeURIComponent(item.s+" Frist: "+deD(item.d)+". (Dein Anspruch)")}`;
}
function ocal(item){
  const r=item.remind<TODAY()?TODAY():item.remind;
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&allday=true&subject=${encodeURIComponent(item.t)}&startdt=${isoD(r)}&enddt=${isoD(addDays(r,1))}&body=${encodeURIComponent(item.s+" Frist: "+deD(item.d)+".")}`;
}

