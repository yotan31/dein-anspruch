/* ---------- Verhinderungspflege-Assistent ---------- */
const KM_SATZ=BETRAEGE.kmPauschale;
const numDE=x=>Number(String(x??"").replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."))||0;
const VHP_GRUND={urlaub:"Urlaub",krank:"Krankheit",kur:"Kur oder Reha",termine:"Termine, Erholung oder andere wichtige Gründe"};
const VHP_ERSATZ={
  angehoerig:{t:"Nahe Angehörige oder Haushaltsmitglied",s:"verwandt/verschwägert bis 2. Grad (z. B. Kind, Enkel, Geschwister, Schwiegerkind) oder wohnt im selben Haushalt"},
  privat:{t:"Andere Privatperson",s:"Nachbarin, Freund, Bekannte, entferntere Verwandte (z. B. Nichte, Cousin)"},
  dienst:{t:"Pflegedienst oder Betreuungsdienst",s:"stellt eine Rechnung"},
  heim:{t:"Kurzzeitpflege im Heim",s:"vorübergehend in einer Einrichtung"},
};
function vhpTage(){const a=parseIso(S.vhp.von), b=parseIso(S.vhp.bis)||a; return a&&b&&b>=a?Math.round((+b - +a)/864e5)+1:0}
function vhpCalc(){
  const v=S.vhp, rest=Math.max(0,JAHRESBETRAG-numDE(v.verbraucht));
  const basis = (v.ersatz==="dienst"||v.ersatz==="heim") ? numDE(v.rechnung) : numDE(v.stunden)*numDE(v.satz);
  const cap = v.ersatz==="angehoerig" ? PG.pflegegeld[pg()]*2 : rest;
  const pflege = basis ? Math.min(basis,cap) : 0;
  const fahrt = (v.ersatz==="heim") ? 0 : numDE(v.km)*KM_SATZ;
  const verd = v.ersatz==="angehoerig" ? numDE(v.verdienst) : 0;
  const total = Math.min(rest, pflege+fahrt+verd);
  return {rest,basis,cap,pflege,fahrt,verd,total,gekappt:basis>cap};
}
function vhpDocs(){
  const v=S.vhp, d=[];
  if(v.ersatz==="heim") d.push("Rechnung der Kurzzeitpflege-Einrichtung (Zeitraum, Pflegekosten getrennt von Unterkunft/Verpflegung)");
  else if(v.ersatz==="dienst") d.push("Rechnung des Pflegedienstes mit Zeitraum und erbrachten Leistungen");
  else d.push(`Unterschriebene ${v.ersatz==="angehoerig"?"Bestätigung":"Quittung"} der Ersatzpflegeperson mit Zeitraum, Stunden und Betrag (Vorlage als PDF)`);
  if(v.ersatz!=="heim" && numDE(v.km)) d.push("Fahrtkosten-Aufstellung: Datum, Strecke von–nach, Kilometer je Fahrt");
  if(v.ersatz==="angehoerig" && numDE(v.verdienst)) d.push("Nachweis Verdienstausfall: Bescheinigung des Arbeitgebers über unbezahlten Urlaub oder Lohnabrechnung");
  if(v.grund==="krank") d.push("Optional: Krankmeldung der Hauptpflegeperson (manche Kassen fragen danach)");
  if(v.auszahlung==="ersatz") d.push("Kontoverbindung der Ersatzpflegeperson");
  return d;
}
function vhpZeitraum(){const a=parseIso(S.vhp.von), b=parseIso(S.vhp.bis); return a ? (b&&+b!==+a?`vom ${deD(a)} bis ${deD(b)}`:`am ${deD(a)}`) : "im Zeitraum [von – bis]"}
function vhpAsk(){
  const v=S.vhp, c=vhpCalc(), zr=vhpZeitraum();
  const pay = `Bitte überweisen Sie den Erstattungsbetrag ${v.auszahlung==="ersatz"?`direkt an die Ersatzpflegeperson ${v.eName||"[Name]"}, IBAN: ${v.iban||"[IBAN]"}`:`auf folgendes Konto: ${v.iban||"[IBAN]"}`}.`;
  if(v.ersatz==="heim") return `beantrage ich hiermit Leistungen der Kurzzeitpflege nach § 42 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI. Die Kurzzeitpflege erfolgte ${zr} in der Einrichtung ${v.eName||"[Name der Einrichtung]"}${v.eAdresse?", "+v.eAdresse:""}. Die Rechnung${c.basis?` über ${eur(c.basis,2)}`:""} liegt bei. Sofern die Einrichtung nicht direkt mit Ihnen abrechnet: ${pay}`;
  const who = v.ersatz==="angehoerig" ? ` (${v.eBez||"[Verwandtschaftsverhältnis, z. B. Tochter]"})` : v.ersatz==="dienst" ? " (Pflegedienst)" : " (nicht verwandt, nicht erwerbsmäßig)";
  let kosten;
  if(v.ersatz==="dienst") kosten = `- Rechnung des Pflegedienstes: ${c.basis?eur(c.basis,2):"[Betrag]"}`;
  else if(numDE(v.stunden)&&numDE(v.satz)) kosten = `- Ersatzpflege: ${numDE(v.stunden)} Stunden × ${eur(numDE(v.satz),2)} = ${eur(c.basis,2)}${c.gekappt?` (erstattungsfähig bis ${eur(c.cap,2)})`:""}`;
  else kosten = `- Ersatzpflege: [Stunden] × [Stundensatz] = [Betrag]${v.ersatz==="angehoerig"?` (höchstens das 2-fache Pflegegeld, ${eur(PG.pflegegeld[pg()]*2)})`:""}`;
  if(c.fahrt) kosten += `\n- Fahrtkosten: ${numDE(v.km)} km × ${eur(KM_SATZ,2)} = ${eur(c.fahrt,2)}`;
  if(c.verd) kosten += `\n- Verdienstausfall: ${eur(c.verd,2)}`;
  if(c.total) kosten += `\nBeantragter Betrag insgesamt: ${eur(c.total,2)}`;
  const stunden = v.art==="stunden" ? `\n\nDie Ersatzpflege erfolgte stundenweise (Verhinderung unter 8 Stunden am Tag). Ich bitte daher um ungekürzte Weiterzahlung des Pflegegeldes.` : "";
  return `beantrage ich hiermit die Erstattung von Kosten der Verhinderungspflege nach § 39 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI.\n\nDie Hauptpflegeperson ${v.haupt||"[Name]"} war ${zr} wegen ${v.grund==="termine"?"anderer wichtiger Gründe (z. B. Arzttermine, Erholung)":(VHP_GRUND[v.grund]||"[Grund]")} an der Pflege gehindert. In dieser Zeit hat die Pflege übernommen: ${v.eName||"[Name]"}, ${v.eAdresse||"[Anschrift]"}${who}.${stunden}\n\nAufwendungen:\n${kosten}\n\n${pay} Die Nachweise liegen bei.`;
}
function vhpForm(){
  const v=S.vhp, c=vhpCalc(), tage=vhpTage(), pgv=PG.pflegegeld[pg()];
  const r=(name,val,label,small)=>`<label class="choice" for="vhp-${name}-${val}"><input type="radio" id="vhp-${name}-${val}" name="vhp-${name}" data-vhp="${name}" value="${val}" ${v[name]===val?"checked":""}><span>${esc(label)}${small?`<small>${esc(small)}</small>`:""}</span></label>`;
  const f=(k,label,type="text",ph="",im="")=>`<div class="field"><label for="vhp-${k}">${label}</label><input type="${type}" id="vhp-${k}" data-vhp="${k}" value="${esc(v[k])}" placeholder="${esc(ph)}" ${im?`inputmode="${im}"`:""}></div>`;
  const priv = v.ersatz==="angehoerig"||v.ersatz==="privat";
  const pgInfo = v.art==="stunden"
    ? `Stundenweise (unter 8 Stunden am Tag): Das Pflegegeld läuft ungekürzt weiter, und diese Tage zählen nicht zu den 8 Wochen.`
    : `Ganze Tage: Für die Tage dazwischen gibt es das halbe Pflegegeld, am ersten und letzten Tag das volle.${tage?` Bei ${tage} Tagen sind das grob ${eur(Math.max(0,tage-2)*pgv/30/2,0)} weniger Pflegegeld.`:""}`;
  return `<div class="vhp">
   <h4>Schritt 1 · Wer war verhindert?</h4>
   <div class="grid2">${f("haupt","Wer pflegt sonst? (Hauptpflegeperson)","text","z. B. Maria Beispiel")}
     <div class="field"><label for="vhp-grund">Warum verhindert?</label><select id="vhp-grund" data-vhp="grund">${Object.entries(VHP_GRUND).map(([k,t])=>`<option value="${k}" ${v.grund===k?"selected":""}>${t}</option>`).join("")}</select></div></div>
   <div class="choices">${r("art","tage","Ganze Tage","z. B. eine Woche Urlaub")}${r("art","stunden","Stundenweise","unter 8 Stunden am Tag, z. B. Arzttermin, Einkauf")}</div>
   <div class="grid2">${f("von","Von","date")}${f("bis","Bis","date")}</div>
   <p class="small muted">${pgInfo}</p>

   <h4>Schritt 2 · Wer hat stattdessen gepflegt?</h4>
   <div class="choices">${Object.entries(VHP_ERSATZ).map(([k,o])=>r("ersatz",k,o.t,o.s)).join("")}</div>
   <div class="grid2">${f("eName",v.ersatz==="dienst"||v.ersatz==="heim"?"Name des Dienstes / der Einrichtung":"Name der Ersatzpflegeperson")}${f("eAdresse","Anschrift")}${v.ersatz==="angehoerig"?f("eBez","Verwandtschaft","text","z. B. Enkel, Schwester"):""}</div>

   <h4>Schritt 3 · Kosten</h4>
   <div class="grid2">
     ${priv?f("stunden","Stunden insgesamt","text","z. B. 40","decimal")+f("satz","Vereinbarter Stundensatz (€)","text","z. B. 15","decimal"):f("rechnung","Rechnungsbetrag (€)","text","","decimal")}
     ${v.ersatz!=="heim"?f("km","Gefahrene Kilometer (Ersatzperson)","text","z. B. 120","decimal"):""}
     ${v.ersatz==="angehoerig"?f("verdienst","Verdienstausfall (€)","text","nur mit Nachweis","decimal"):""}
     ${f("verbraucht","Dieses Jahr schon verbraucht (€)","text","0","decimal")}
   </div>
   <div class="calc">
     <div><span>Noch verfügbar vom Jahresbetrag</span><b>${eur(c.rest,2)}</b></div>
     ${v.ersatz==="angehoerig"?`<div><span>Grenze für Angehörige (2 × Pflegegeld)</span><b>${eur(c.cap,2)}</b></div>`:""}
     ${c.pflege?`<div><span>Ersatzpflege${c.gekappt?" (gekappt)":""}</span><b>${eur(c.pflege,2)}</b></div>`:""}
     ${c.fahrt?`<div><span>Fahrtkosten (${eur(KM_SATZ,2)}/km)</span><b>${eur(c.fahrt,2)}</b></div>`:""}
     ${c.verd?`<div><span>Verdienstausfall</span><b>${eur(c.verd,2)}</b></div>`:""}
     <div class="tot"><span>Voraussichtliche Erstattung</span><b>${c.total?eur(c.total,2):"Beträge eintragen"}</b></div>
   </div>
   ${v.ersatz==="angehoerig"?`<p class="small muted">Für nahe Angehörige zahlt die Kasse den Pflegeaufwand bis zum 2-fachen Pflegegeld. Fahrtkosten und Verdienstausfall kommen mit Nachweis dazu, alles zusammen bis zum Jahresbetrag. Der Kilometersatz ist ein Richtwert, manche Kassen zahlen mehr.</p>`:""}

   <h4>Schritt 4 · Wer bekommt das Geld?</h4>
   <div class="choices">${r("auszahlung","versicherte","Auf unser Konto","die Pflegekasse erstattet der pflegebedürftigen Person; ihr bezahlt die Ersatzperson selbst")}${r("auszahlung","ersatz","Direkt an die Ersatzpflegeperson","die meisten Kassen überweisen auf Wunsch direkt")}</div>
   ${f("iban",v.auszahlung==="ersatz"?"IBAN der Ersatzpflegeperson":"IBAN für die Erstattung","text","DE..")}

   <div class="notice info">${ic("info")}<span><strong>Welche Belege brauche ich?</strong><br>
     ${v.ersatz==="heim"?"Die Rechnung des Heims. Viele Heime rechnen direkt mit der Pflegekasse ab, dann musst du nichts vorstrecken.":
       v.ersatz==="dienst"?"Die Rechnung des Pflegedienstes mit Zeitraum und Leistungen. Der Dienst kann oft direkt mit der Kasse abrechnen.":
       `Beispiel Quittung: „Ich, ${v.eName||"Max Nachbar"}, habe ${v.haupt?"für "+v.haupt+" ":""}die Pflege von ${S.person.name||"Erna Beispiel"} vom 03.08. bis 17.08. übernommen, insgesamt 40 Stunden à 15 €, und dafür 600 € erhalten.“ Datum, Unterschrift. Bei Fahrten: kleine Liste „05.08. Stuttgart–Esslingen und zurück, 28 km“.`}
     <br><br><strong>Geht es ohne Belege?</strong> Ganz ohne Nachweis zahlt die Kasse nicht. Bei Angehörigen und Privatpersonen reicht aber eine selbst geschriebene, unterschriebene Quittung oder Bestätigung. Eine offizielle Rechnung ist nicht nötig. Die Vorlage unten füllt das für dich aus.</span></div>
   ${priv?`<div class="btnrow"><button class="btn small soft" type="button" data-act="vhp-quittung">${ic("down")}${v.ersatz==="angehoerig"?"Bestätigung":"Quittung"} zum Unterschreiben (PDF)</button></div>`:""}
   ${priv?`<p class="small muted">Gut zu wissen: Für Angehörige und Bekannte, die aus Gefälligkeit einspringen, ist das Geld in der Regel steuerfrei (§ 3 Nr. 36 EStG). Wer regelmäßig für viele Familien einspringt, sollte das prüfen.</p>`:""}
  </div>`;
}
async function makeQuittung(){
  const doc=newDoc(); if(!doc) return; const v=S.vhp, c=vhpCalc(), a=v.ersatz==="angehoerig";
  const L0=25,W=160; let y=30;
  doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(a?"Bestätigung über Ersatzpflege":"Quittung über Ersatzpflege",L0,y); y+=6;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text("Verhinderungspflege nach § 39 SGB XI",L0,y); y+=12; doc.setFontSize(11);
  const rows=[["Pflegebedürftige Person",`${S.person.name||""}${S.person.geb?", geb. "+S.person.geb:""}`],["Versichertennummer",S.person.vnr||""],["Hauptpflegeperson (verhindert)",v.haupt||""],["Grund",VHP_GRUND[v.grund]||""],["Zeitraum",vhpZeitraum().replace(/^vom |^am /,"")],["Art",v.art==="stunden"?"stundenweise (unter 8 Std./Tag)":"ganztägig"],["Ersatzpflegeperson",v.eName||""],["Anschrift",v.eAdresse||""]];
  if(a) rows.push(["Verwandtschaftsverhältnis",v.eBez||""]);
  rows.push(["Geleistete Stunden",numDE(v.stunden)?String(numDE(v.stunden)):""],["Stundensatz",numDE(v.satz)?eur(numDE(v.satz),2):""]);
  if(c.fahrt) rows.push(["Fahrtkosten",`${numDE(v.km)} km × ${eur(KM_SATZ,2)} = ${eur(c.fahrt,2)}`]);
  for(const [k,val] of rows){ doc.setFont("helvetica","bold"); doc.text(k+":",L0,y); doc.setFont("helvetica","normal"); doc.text(val||"________________________________",L0+62,y); y+=8 }
  y+=4; const sum=(c.basis||0)+(c.fahrt||0);
  const txt = a ? `Ich bestätige, dass ich die Pflege in dem genannten Zeitraum übernommen habe.${sum?` Dafür sind mir Aufwendungen in Höhe von ${eur(sum,2)} entstanden.`:""}` : `Ich bestätige, dass ich die Pflege in dem genannten Zeitraum übernommen und dafür ${sum?eur(sum,2):"________ €"} erhalten habe.`;
  doc.text(doc.splitTextToSize(txt,W),L0,y); y+=24;
  doc.line(L0,y,L0+60,y); doc.line(L0+80,y,L0+160,y); doc.setFontSize(8);
  doc.text("Ort, Datum",L0,y+4); doc.text("Unterschrift Ersatzpflegeperson",L0+80,y+4);
  y+=22; doc.setFontSize(9); doc.setTextColor(90);
  doc.text(doc.splitTextToSize("Bei Fahrtkosten bitte eine Aufstellung beilegen (Datum, Strecke, Kilometer). Bei Verdienstausfall eine Bescheinigung des Arbeitgebers.",W),L0,y);
  await saveFile(a?"Bestaetigung-Ersatzpflege.pdf":"Quittung-Ersatzpflege.pdf",doc.output("blob"),"PDF gespeichert");
}


