import { Z } from "./zustand.js";
import { BETRAEGE } from "./00-betraege.js";
import { JAHRESBETRAG, PG, eur, pg } from "./01-grundlagen.js";
import { deD, parseIso } from "./03-hilfsmittel.js";
import { newDoc, saveFile } from "./15-pdf.js";
/* ---------- Verhinderungspflege-Assistent ---------- */
export const KM_SATZ=BETRAEGE.kmPauschale;
export function numDE(x) { return Number(String(x??"").replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."))||0; }
const VHP_GRUND={urlaub:"Urlaub",krank:"Krankheit",kur:"Kur oder Reha",termine:"Termine, Erholung oder andere wichtige Gründe"};
export function vhpCalc(){
  const v=Z.S.vhp, rest=Math.max(0,JAHRESBETRAG-numDE(v.verbraucht));
  const basis = (v.ersatz==="dienst"||v.ersatz==="heim") ? numDE(v.rechnung) : numDE(v.stunden)*numDE(v.satz);
  const cap = v.ersatz==="angehoerig" ? PG.pflegegeld[pg()]*2 : rest;
  const pflege = basis ? Math.min(basis,cap) : 0;
  const fahrt = (v.ersatz==="heim") ? 0 : numDE(v.km)*KM_SATZ;
  const verd = v.ersatz==="angehoerig" ? numDE(v.verdienst) : 0;
  const total = Math.min(rest, pflege+fahrt+verd);
  return {rest,basis,cap,pflege,fahrt,verd,total,gekappt:basis>cap};
}
export function vhpDocs(){
  const v=Z.S.vhp, d=[];
  if(v.ersatz==="heim") d.push("Rechnung der Kurzzeitpflege-Einrichtung (Zeitraum, Pflegekosten getrennt von Unterkunft/Verpflegung)");
  else if(v.ersatz==="dienst") d.push("Rechnung des Pflegedienstes mit Zeitraum und erbrachten Leistungen");
  else d.push(`Unterschriebene ${v.ersatz==="angehoerig"?"Bestätigung":"Quittung"} der Ersatzpflegeperson mit Zeitraum, Stunden und Betrag (Vorlage als PDF)`);
  if(v.ersatz!=="heim" && numDE(v.km)) d.push("Fahrtkosten-Aufstellung: Datum, Strecke von–nach, Kilometer je Fahrt");
  if(v.ersatz==="angehoerig" && numDE(v.verdienst)) d.push("Nachweis Verdienstausfall: Bescheinigung des Arbeitgebers über unbezahlten Urlaub oder Lohnabrechnung");
  if(v.grund==="krank") d.push("Optional: Krankmeldung der Hauptpflegeperson (manche Kassen fragen danach)");
  if(v.auszahlung==="ersatz") d.push("Kontoverbindung der Ersatzpflegeperson");
  return d;
}
function vhpZeitraum(){const a=parseIso(Z.S.vhp.von), b=parseIso(Z.S.vhp.bis); return a ? (b&&+b!==+a?`vom ${deD(a)} bis ${deD(b)}`:`am ${deD(a)}`) : "im Zeitraum [von – bis]"}
export function vhpAsk(){
  const v=Z.S.vhp, c=vhpCalc(), zr=vhpZeitraum();
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
export async function makeQuittung(){
  const doc=newDoc(); if(!doc) return; const v=Z.S.vhp, c=vhpCalc(), a=v.ersatz==="angehoerig";
  const L0=25,W=160; let y=30;
  doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(a?"Bestätigung über Ersatzpflege":"Quittung über Ersatzpflege",L0,y); y+=6;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text("Verhinderungspflege nach § 39 SGB XI",L0,y); y+=12; doc.setFontSize(11);
  const rows=[["Pflegebedürftige Person",`${Z.S.person.name||""}${Z.S.person.geb?", geb. "+Z.S.person.geb:""}`],["Versichertennummer",Z.S.person.vnr||""],["Hauptpflegeperson (verhindert)",v.haupt||""],["Grund",VHP_GRUND[v.grund]||""],["Zeitraum",vhpZeitraum().replace(/^vom |^am /,"")],["Art",v.art==="stunden"?"stundenweise (unter 8 Std./Tag)":"ganztägig"],["Ersatzpflegeperson",v.eName||""],["Anschrift",v.eAdresse||""]];
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


