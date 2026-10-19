/* ---------- Antrags-Assistent: Fragen je Anspruch ---------- */
const OPT=a=>a.map(x=>typeof x==="string"?{v:x,t:x}:x);
const HILFE=["Waschen und Anziehen","Essen und Trinken","Toilette / Inkontinenz","Gehen, Aufstehen, Treppen","Medikamente","Vergesslichkeit / Orientierung","Haushalt und Einkaufen","Hilfe in der Nacht"];
function ansObj(k){ if(k==="jahresbetrag") return S.vhp; S.ans=S.ans||{}; return (S.ans[k]=S.ans[k]||{}) }
function av(k,f,ph){ const v=ansObj(k)[f]; if(Array.isArray(v)) return v.length?v.join(", "):`[${ph}]`; return (v!=null&&String(v).trim()!=="")?String(v).trim():`[${ph}]` }
function ad(k,f,ph){ const d=parseIso(ansObj(k)[f]); return d?deD(d):`[${ph}]` }
function has(k,f){ const v=ansObj(k)[f]; return Array.isArray(v)?v.length>0:(v!=null&&String(v).trim()!=="") }
const IBAN_Q={k:"iban",label:"Auf welches Konto soll das Geld?",help:"Die IBAN steht auf der Bankkarte oder im Online-Banking. Sie beginnt mit DE.",ph:"DE00 0000 0000 0000 0000 00"};

const ASSIST={
 pg_antrag:{q:[
   {k:"seit",label:"Seit wann wird Hilfe gebraucht?",ph:"z. B. seit März 2026",help:"Ungefähr reicht völlig."},
   {k:"was",type:"multi",label:"Wobei wird Hilfe gebraucht?",help:"Alles ankreuzen, was zutrifft.",opts:OPT(HILFE)},
   {k:"tel",label:"Unter welcher Telefonnummer ist jemand für den Termin mit dem Gutachter erreichbar?",ph:"z. B. 0711 123456",type:"tel"}],
  ask:()=>`beantrage ich hiermit die Feststellung der Pflegebedürftigkeit und Leistungen der Pflegeversicherung nach dem SGB XI. Hilfe wird ${has("pg_antrag","seit")?av("pg_antrag","seit")+" ":""}benötigt, vor allem bei: ${av("pg_antrag","was","Bereiche")}.\n\nBitte beauftragen Sie den Medizinischen Dienst mit der Begutachtung. Für die Terminabsprache bin ich erreichbar unter: ${av("pg_antrag","tel","Telefonnummer")}. Außerdem bitte ich um eine Pflegeberatung nach § 7a SGB XI.`},
 pg_hoch:{q:[
   {k:"seit",label:"Seit wann ist es schlechter geworden?",ph:"z. B. seit dem Sturz im Juli"},
   {k:"was",type:"multi",label:"Wobei wird jetzt mehr Hilfe gebraucht?",opts:OPT([...HILFE,"Nach Sturz oder Krankenhaus"])},
   {k:"tel",label:"Telefonnummer für den Gutachter-Termin",type:"tel",ph:"z. B. 0711 123456"}],
  ask:()=>`beantrage ich hiermit eine Höherstufung des Pflegegrades. Der Hilfebedarf hat sich ${has("pg_hoch","seit")?av("pg_hoch","seit")+" ":""}deutlich erhöht, vor allem bei: ${av("pg_hoch","was","Bereiche")}.\n\nBitte veranlassen Sie eine erneute Begutachtung durch den Medizinischen Dienst. Erreichbar unter: ${av("pg_hoch","tel","Telefonnummer")}.`},
 pflegegeld:{q:[
   {k:"pp",label:"Wer pflegt hauptsächlich?",help:"Das ist die Pflegeperson. Es können auch mehrere sein.",ph:"Vor- und Nachname"},
   {k:"ab",type:"date",label:"Seit wann wird so gepflegt?",help:"Pflegegeld gibt es frühestens ab dem Monat, in dem der Antrag gestellt wird."},
   IBAN_Q],
  ask:()=>`beantrage ich hiermit Pflegegeld nach § 37 SGB XI (bei gleichzeitiger Nutzung eines Pflegedienstes als Kombinationsleistung nach § 38 SGB XI) ab dem ${ad("pflegegeld","ab","Datum")}. Die Pflege übernimmt: ${av("pflegegeld","pp","Name der Pflegeperson")}.\n\nBitte überweisen Sie das Pflegegeld auf folgendes Konto: ${av("pflegegeld","iban","IBAN")}.`},
 sachleistung:{q:[
   {k:"dienst",label:"Welcher Pflegedienst soll kommen?",ph:"Name des Pflegedienstes",help:"Noch keinen gefunden? Überspringen. Die Pflegekasse schickt eine Liste."},
   {k:"ab",type:"date",label:"Ab wann?"},
   {k:"kombi",type:"choice",label:"Pflegen Angehörige zusätzlich mit?",opts:OPT([{v:"ja",t:"Ja",s:"dann gibt es zusätzlich anteiliges Pflegegeld"},{v:"nein",t:"Nein"}])}],
  ask:()=>`beantrage ich hiermit Pflegesachleistungen nach § 36 SGB XI${ansObj("sachleistung").kombi==="ja"?" als Kombinationsleistung mit anteiligem Pflegegeld nach § 38 SGB XI":""} ab dem ${ad("sachleistung","ab","Datum")}. Die Versorgung übernimmt der Pflegedienst: ${av("sachleistung","dienst","Name des Pflegedienstes")}.`},
 entlastung:{q:[
   {k:"anbieter",label:"Wer hilft im Alltag?",help:"Zum Beispiel Haushaltshilfe, Nachbarschaftshilfe, Betreuungsdienst. Der Anbieter muss anerkannt sein.",ph:"Name des Anbieters"},
   {k:"zeitraum",label:"Für welchen Zeitraum ist die Rechnung?",ph:"z. B. September 2026"},
   {k:"betrag",type:"money",label:"Wie hoch ist die Rechnung?",help:"Mehrere Rechnungen einfach zusammenzählen."},
   {k:"weg",type:"choice",label:"Wie soll bezahlt werden?",opts:OPT([{v:"erstattung",t:"Wir haben schon bezahlt",s:"die Kasse soll uns das Geld zurückzahlen"},{v:"direkt",t:"Direkt an den Anbieter",s:"der Anbieter rechnet mit der Kasse ab"}])},
   {...IBAN_Q,show:()=>ansObj("entlastung").weg!=="direkt"}],
  ask:()=>{const o=ansObj("entlastung"); return `beantrage ich hiermit Leistungen aus dem Entlastungsbetrag nach § 45b SGB XI für Leistungen von ${av("entlastung","anbieter","Name des Anbieters")} im Zeitraum ${av("entlastung","zeitraum","Zeitraum")} in Höhe von ${has("entlastung","betrag")?eur(numDE(o.betrag),2):"[Betrag]"}. ${o.weg==="direkt"?"Bitte rechnen Sie direkt mit dem Anbieter ab. Eine Abtretungserklärung liegt bei.":`Die Rechnung liegt bei. Bitte erstatten Sie den Betrag auf folgendes Konto: ${av("entlastung","iban","IBAN")}.`}\n\nBitte teilen Sie mir außerdem mit, wie hoch das noch verfügbare Guthaben aus dem Vorjahr ist.`}},
 tagespflege:{q:[
   {k:"einr",label:"Welche Tagespflege soll es sein?",ph:"Name und Ort",help:"Noch keine gefunden? Überspringen."},
   {k:"ab",type:"date",label:"Ab wann?"},
   {k:"tage",type:"choice",label:"An wie vielen Tagen pro Woche?",opts:OPT(["1","2","3","4","5"])}],
  ask:()=>`beantrage ich hiermit Leistungen der Tages- und Nachtpflege nach § 41 SGB XI ab dem ${ad("tagespflege","ab","Datum")} an ${av("tagespflege","tage","Anzahl")} Tagen pro Woche in der Einrichtung ${av("tagespflege","einr","Name der Tagespflege")}.`},
 verbrauch:{q:[{k:"anbieter",label:"Wer soll die Pflegehilfsmittel liefern?",help:"Apotheke, Sanitätshaus oder Versandanbieter. Noch keinen? Überspringen.",ph:"Name des Anbieters"}],
  ask:()=>`beantrage ich hiermit die Kostenübernahme für zum Verbrauch bestimmte Pflegehilfsmittel nach § 40 Abs. 2 SGB XI (z. B. Einmalhandschuhe, Desinfektion, Bettschutzeinlagen) bis zur Höhe von ${VERBRAUCH} Euro monatlich. Die Versorgung soll erfolgen durch: ${av("verbrauch","anbieter","Anbieter")}.`},
 technisch:{q:[
   {k:"was",type:"multi",label:"Was wird gebraucht?",opts:OPT(["Hausnotruf","Pflegebett","Lagerungskissen","Duschstuhl","Badewannenlift","Anderes"])},
   {k:"anbieter",label:"Von welchem Anbieter gibt es ein Angebot?",ph:"z. B. Sanitätshaus Müller",help:"Noch keins? Überspringen."}],
  ask:()=>`beantrage ich hiermit die Versorgung mit folgenden technischen Pflegehilfsmitteln nach § 40 Abs. 1 SGB XI: ${av("technisch","was","Hilfsmittel")}. ${has("technisch","anbieter")?`Ein Kostenvoranschlag von ${av("technisch","anbieter")} liegt bei.`:""}`},
 wohnumfeld:{q:[
   {k:"was",type:"multi",label:"Was soll umgebaut werden?",opts:OPT(["Bodengleiche Dusche","Treppenlift","Haltegriffe","Türen verbreitern","Rampe","Anderes"])},
   {k:"kosten",type:"money",label:"Was kostet es laut Angebot?",help:"Wichtig: Erst bauen, wenn die Kasse zugesagt hat."},
   {k:"miete",type:"choice",label:"Wohnung oder Haus?",opts:OPT([{v:"eigentum",t:"Eigentum"},{v:"miete",t:"Miete",s:"Vermieter muss zustimmen"}])}],
  ask:()=>`beantrage ich hiermit einen Zuschuss für Maßnahmen zur Verbesserung des individuellen Wohnumfeldes nach § 40 Abs. 4 SGB XI für: ${av("wohnumfeld","was","Maßnahme")}. Die Kosten betragen laut Angebot ${has("wohnumfeld","kosten")?eur(numDE(ansObj("wohnumfeld").kosten),2):"[Betrag]"}. Kostenvoranschläge liegen bei.${ansObj("wohnumfeld").miete==="miete"?" Die Zustimmung des Vermieters liegt bei.":""}`},
 dipa:{q:[{k:"name",label:"Welche Pflege-App soll es sein?",ph:"Name der App"}],
  ask:()=>`beantrage ich hiermit die Versorgung mit der digitalen Pflegeanwendung ${av("dipa","name","Name")} nach § 40a SGB XI sowie ergänzende Unterstützungsleistungen nach § 39a SGB XI.`},
 wg:{q:[{k:"wg",label:"Wie heißt die Wohngruppe und wo ist sie?",ph:"Name, Anschrift"}],
  ask:()=>`beantrage ich hiermit den Wohngruppenzuschlag nach § 38a SGB XI für die ambulant betreute Wohngruppe ${av("wg","wg","Name, Anschrift")}.`},
 beratung:{q:[
   {k:"wo",type:"choice",label:"Wie soll die Beratung stattfinden?",opts:OPT(["Bei uns zu Hause","Telefonisch","Per Video"])},
   {k:"zeit",label:"Wann passt es am besten?",ph:"z. B. vormittags, nicht mittwochs"}],
  ask:()=>`bitte ich um einen Termin für eine individuelle Pflegeberatung nach § 7a SGB XI, gewünscht: ${av("beratung","wo","Art")}. Am besten passt: ${av("beratung","zeit","Zeit")}.`},
 pflegekurs:{q:[{k:"art",type:"choice",label:"Welche Art von Kurs?",opts:OPT(["Kurs vor Ort","Online-Kurs","Schulung bei uns zu Hause"])}],
  ask:()=>`bitte ich um Informationen zu kostenlosen Pflegekursen nach § 45 SGB XI für pflegende Angehörige, gewünscht: ${av("pflegekurs","art","Kursart")}.`},
 rv:{q:[
   {k:"pp",label:"Wie heißt die pflegende Person?",ph:"Vor- und Nachname"},
   {k:"rvnr",label:"Wie lautet ihre Rentenversicherungsnummer?",help:"Steht auf dem Sozialversicherungsausweis oder der jährlichen Renteninformation. Nicht zur Hand? Überspringen, die Kasse fragt nach.",ph:"z. B. 12 150385 M 012"},
   {k:"std",type:"choice",label:"Wie viele Stunden pro Woche wird gepflegt?",opts:OPT(["10 bis 20 Stunden","20 bis 30 Stunden","mehr als 30 Stunden"])}],
  ask:()=>`beantrage ich hiermit die Zahlung von Beiträgen zur Renten- und Arbeitslosenversicherung für die Pflegeperson ${av("rv","pp","Name")} (Rentenversicherungsnummer: ${av("rv","rvnr","Nummer")}) nach § 44 SGB XI. Die Pflege umfasst ${av("rv","std","Stunden")} pro Woche, verteilt auf mindestens 2 Tage. Bitte senden Sie mir den Fragebogen zur Zahlung der Beiträge zur sozialen Sicherung für Pflegepersonen zu.`},
 pug:{q:[{k:"pp",label:"Wer nimmt frei?",ph:"Vor- und Nachname"},{k:"von",type:"date",label:"Ab wann?"},{k:"bis",type:"date",label:"Bis wann?",help:"Höchstens 10 Arbeitstage im Jahr."}],
  ask:()=>`beantrage ich hiermit Pflegeunterstützungsgeld nach § 44a Abs. 3 SGB XI für die kurzzeitige Arbeitsverhinderung der Pflegeperson ${av("pug","pp","Name")} vom ${ad("pug","von","Datum")} bis ${ad("pug","bis","Datum")}. Die ärztliche Bescheinigung liegt bei.`},
 stationaer:{q:[{k:"heim",label:"Wie heißt das Pflegeheim?",ph:"Name und Ort"},{k:"ab",type:"date",label:"Seit wann?"}],
  ask:()=>`beantrage ich hiermit Leistungen der vollstationären Pflege nach § 43 SGB XI in der Einrichtung ${av("stationaer","heim","Name des Heims")} ab dem ${ad("stationaer","ab","Datum")}.`},
 zuschlag:{q:[{k:"seit",type:"date",label:"Seit wann ist die Person im Heim?"},{k:"frueher",type:"long",label:"Gab es vorher schon Heimaufenthalte?",help:"Auch in anderen Heimen. Die Zeit zählt mit und erhöht den Zuschuss.",ph:"z. B. 2024 Haus Sonnenschein, 5 Monate"}],
  ask:()=>`bitte ich um Prüfung und ggf. Neuberechnung des Leistungszuschlags nach § 43c SGB XI. Der Aufenthalt in vollstationärer Pflege begann am ${ad("zuschlag","seit","Datum")}. Frühere Aufenthalte: ${has("zuschlag","frueher")?av("zuschlag","frueher"):"keine"}.`},
 hzp:{q:[{k:"heim",label:"In welchem Heim lebt die Person?",ph:"Name und Ort"}],
  ask:()=>`beantrage ich hiermit Hilfe zur Pflege nach §§ 61 ff. SGB XII, da Einkommen und Vermögen nicht ausreichen, um die Kosten der vollstationären Pflege in der Einrichtung ${av("hzp","heim","Name des Heims")} zu decken.`},
 eingliederung:{q:[{k:"einr",label:"In welcher Einrichtung lebt die Person?",ph:"Name"},{k:"tage",type:"number",label:"An wie vielen Tagen im Monat ist sie zu Hause?"}],
  ask:()=>`beantrage ich hiermit anteiliges Pflegegeld für die Tage der häuslichen Pflege außerhalb der Einrichtung ${av("eingliederung","einr","Name")} (durchschnittlich ${av("eingliederung","tage","Anzahl")} Tage im Monat, Nachweis liegt bei).`},
 fahrten:{q:[{k:"wohin",label:"Zu welcher Behandlung muss gefahren werden?",ph:"z. B. Dialyse, Facharzt, Strahlentherapie"}],
  ask:()=>`beantrage ich hiermit die Genehmigung von Krankenfahrten zu ambulanten Behandlungen (${av("fahrten","wohin","Behandlung")}) nach § 60 Abs. 1 SGB V. Die ärztliche Verordnung liegt bei.`},
 sb_antrag:{q:[
   {k:"leiden",type:"long",label:"Welche Erkrankungen oder Einschränkungen gibt es?",help:"Alles aufschreiben, auch Kleinigkeiten. Je vollständiger, desto besser.",ph:"z. B. Diabetes, Herzschwäche, Arthrose im Knie, Schwerhörigkeit"},
   {k:"aerzte",type:"long",label:"Welche Ärztinnen und Ärzte behandeln?",ph:"z. B. Dr. Maier, Hausarzt, Stuttgart"},
   {k:"mz",type:"multi",label:"Welche Merkzeichen kommen in Frage?",help:"Unsicher? Lass es offen, das Amt prüft das.",opts:OPT(["G (Gehen ist schwer)","aG (kaum gehen möglich)","B (Begleitung nötig)","H (hilflos)","RF (Rundfunkbeitrag)"])}],
  ask:()=>`beantrage ich hiermit die Feststellung einer Behinderung und des Grades der Behinderung (GdB) nach § 152 SGB IX sowie die Ausstellung eines Schwerbehindertenausweises.\n\nFolgende Gesundheitsstörungen liegen vor: ${av("sb_antrag","leiden","Erkrankungen")}.\n\nBehandelnde Ärztinnen und Ärzte: ${av("sb_antrag","aerzte","Ärzte")}.${has("sb_antrag","mz")?`\n\nZudem beantrage ich die Prüfung folgender Merkzeichen: ${av("sb_antrag","mz")}.`:""}`},
 sb_neu:{q:[
   {k:"leiden",type:"long",label:"Was ist neu oder schlimmer geworden?",ph:"z. B. Herzinfarkt 2026, Knie-OP, Demenz-Diagnose"},
   {k:"mz",type:"multi",label:"Welche Merkzeichen sollen geprüft werden?",opts:OPT(["G (Gehen ist schwer)","aG (kaum gehen möglich)","B (Begleitung nötig)","H (hilflos)","RF (Rundfunkbeitrag)"])}],
  ask:()=>`beantrage ich hiermit die Neufeststellung des Grades der Behinderung wegen Verschlimmerung bzw. hinzugekommener Gesundheitsstörungen: ${av("sb_neu","leiden","Gesundheitsstörungen")}.${has("sb_neu","mz")?` Außerdem beantrage ich die Prüfung folgender Merkzeichen: ${av("sb_neu","mz")}.`:""} Aktuelle Befunde liegen bei.`},
 kfz:{q:[{k:"kz",label:"Wie lautet das Kennzeichen des Autos?",ph:"z. B. S-AB 1234"}],
  ask:()=>`beantrage ich hiermit die Steuerbefreiung bzw. -ermäßigung nach § 3a Kraftfahrzeugsteuergesetz für das Fahrzeug mit dem amtlichen Kennzeichen ${av("kfz","kz","Kennzeichen")}.`},
 rundfunk:{q:[{k:"nr",label:"Wie lautet die Beitragsnummer?",help:"Steht oben auf jedem Brief vom Beitragsservice (9 Ziffern).",ph:"z. B. 123 456 789"}],
  ask:()=>`beantrage ich hiermit die Ermäßigung bzw. Befreiung vom Rundfunkbeitrag nach § 4 Rundfunkbeitragsstaatsvertrag. Eine Kopie des Schwerbehindertenausweises liegt bei. Beitragsnummer: ${av("rundfunk","nr","Beitragsnummer")}.`},
 gleich:{q:[{k:"grund",type:"long",label:"Warum ist der Arbeitsplatz in Gefahr?",ph:"z. B. viele Krankheitstage, Arbeit ist körperlich schwer"}],
  ask:()=>`beantrage ich hiermit die Gleichstellung mit einem schwerbehinderten Menschen nach § 2 Abs. 3 SGB IX. Der GdB beträgt ${gdb()||"[GdB]"}. Ohne Gleichstellung ist der Arbeitsplatz gefährdet: ${av("gleich","grund","Begründung")}.`},
 urlaub:{q:[], ask:()=>`teile ich Ihnen mit, dass bei mir eine Schwerbehinderung mit einem GdB von ${gdb()||"[GdB]"} festgestellt ist. Ich beantrage daher den Zusatzurlaub nach § 208 SGB IX für das laufende Kalenderjahr.`},
 rente:{q:[], ask:()=>`bitte ich um eine Rentenauskunft und Beratung zur Altersrente für schwerbehinderte Menschen. Der GdB beträgt ${gdb()||"[GdB]"}.`},
 jahresbetrag:{q:[
   {k:"haupt",label:"Wer pflegt sonst normalerweise?",help:"Die Person, die verhindert war. Zum Beispiel du selbst oder die Ehefrau.",ph:"Vor- und Nachname"},
   {k:"grund",type:"choice",label:"Warum konnte sie nicht pflegen?",opts:OPT([{v:"urlaub",t:"Urlaub"},{v:"krank",t:"Krankheit"},{v:"kur",t:"Kur oder Reha"},{v:"termine",t:"Etwas anderes",s:"z. B. Arzttermin, Erholung, Familienfeier"}])},
   {k:"art",type:"choice",label:"Ganze Tage oder nur ein paar Stunden am Tag?",opts:OPT([{v:"tage",t:"Ganze Tage",s:"z. B. eine Woche Urlaub"},{v:"stunden",t:"Nur ein paar Stunden am Tag",s:"weniger als 8 Stunden, z. B. Arzttermin"}])},
   {k:"von",type:"date",label:"Ab wann?"},
   {k:"bis",type:"date",label:"Bis wann?",help:"War es nur ein Tag? Dann dasselbe Datum noch einmal."},
   {k:"ersatz",type:"choice",label:"Wer hat in dieser Zeit gepflegt?",opts:Object.entries(VHP_ERSATZ).map(([v,o])=>({v,t:o.t,s:o.s}))},
   {k:"eName",label:()=>["dienst","heim"].includes(S.vhp.ersatz)?"Wie heißt der Dienst bzw. das Heim?":"Wie heißt die Person, die gepflegt hat?",ph:"Name"},
   {k:"eAdresse",label:()=>["dienst","heim"].includes(S.vhp.ersatz)?"Wo ist er?":"Wo wohnt diese Person?",ph:"Straße, PLZ Ort"},
   {k:"eBez",label:"Wie ist sie mit der gepflegten Person verwandt?",ph:"z. B. Enkel, Schwester, Schwiegertochter",show:()=>S.vhp.ersatz==="angehoerig"},
   {k:"stunden",type:"number",label:"Wie viele Stunden wurde insgesamt gepflegt?",help:"Grob geschätzt reicht. Beispiel: 2 Wochen mit je 3 Stunden am Tag sind 42 Stunden.",ph:"z. B. 42",show:()=>["angehoerig","privat"].includes(S.vhp.ersatz)},
   {k:"satz",type:"money",label:"Wie viel Euro pro Stunde wurden vereinbart?",help:"Üblich sind etwa 10 bis 20 Euro. Bei Angehörigen zahlt die Kasse insgesamt höchstens das Doppelte des Pflegegeldes.",ph:"z. B. 15",show:()=>["angehoerig","privat"].includes(S.vhp.ersatz)},
   {k:"rechnung",type:"money",label:"Wie hoch ist die Rechnung?",show:()=>["dienst","heim"].includes(S.vhp.ersatz)},
   {k:"km",type:"number",label:"Wie viele Kilometer ist die Ersatzperson dafür gefahren?",help:"Alle Fahrten hin und zurück zusammenzählen. Keine Fahrten? Einfach überspringen.",ph:"z. B. 120",show:()=>S.vhp.ersatz!=="heim"},
   {k:"verdienst",type:"money",label:"Hat die Ersatzperson dafür auf Lohn verzichtet?",help:"Nur wenn sie unbezahlt frei genommen hat. Sonst überspringen.",show:()=>S.vhp.ersatz==="angehoerig"},
   {k:"verbraucht",type:"money",label:"Wurde in diesem Jahr schon Verhinderungs- oder Kurzzeitpflege bezahlt?",help:"Wenn ja: ungefähr wie viel Euro? Wenn nein: überspringen."},
   {k:"auszahlung",type:"choice",label:"Wohin soll die Kasse das Geld überweisen?",opts:OPT([{v:"versicherte",t:"Auf unser Konto",s:"ihr bezahlt die Ersatzperson selbst"},{v:"ersatz",t:"Direkt an die Ersatzperson",s:"die meisten Kassen machen das auf Wunsch"}])},
   {k:"iban",label:()=>S.vhp.auszahlung==="ersatz"?"IBAN der Ersatzperson":"Auf welches Konto soll das Geld?",help:"Die IBAN steht auf der Bankkarte oder im Online-Banking. Sie beginnt mit DE.",ph:"DE00 0000 0000 0000 0000 00"}]},
};
for(const [k,a] of Object.entries(ASSIST)){ const b=B.find(x=>x.k===k); if(!b) continue; b.q=a.q; if(a.ask) b.ask=a.ask }

/* ---------- Assistent: Ablauf ---------- */
function personQs(b,a){
  const p=S.person, L=[];
  if(!p.name) L.push("name");
  if((b.to===PK||b.to===KK) && !p.vnr) L.push("vnr");
  if(!p.strasse||!p.ort) L.push("adresse");
  if(a && !p.absender) L.push("absender");
  if(a && !p.beziehung) L.push("beziehung");
  return L;
}
function personQ(k){
  const a=S.rolle==="angehoerig";
  return ({
    name:{k:"name",store:"person",label:a?"Wie heißt die Person, um die es geht?":"Wie heißt du?",ph:"Vor- und Nachname"},
    vnr:{k:"vnr",store:"person",label:"Wie lautet die Versichertennummer?",help:"Steht auf der Gesundheitskarte (Krankenkassenkarte). Sie beginnt mit einem Buchstaben, zum Beispiel A123456789.",ph:"z. B. A123456789"},
    adresse:{k:"adresse",store:"person",type:"addr",label:a?"Wo wohnt die Person?":"Wo wohnst du?"},
    absender:{k:"absender",store:"person",label:"Und wie heißt du?",help:"Du schreibst den Antrag für die Person. Dein Name steht unter dem Brief.",ph:"Vor- und Nachname"},
    beziehung:{k:"beziehung",store:"person",type:"choice",label:"Wie bist du mit der Person verbunden?",opts:OPT(["Tochter","Sohn","Ehefrau","Ehemann","Enkelin","Enkel","Rechtliche Betreuung","Andere"])},
  })[k];
}
function wizSteps(){
  const w=S.wiz, b=B.find(x=>x.k===w.k);
  // leichte Fragen zuerst, Adresse und Versichertennummer am Ende
  const pq=w.pq||[], early=["name","beziehung"].filter(k=>pq.includes(k)), late=pq.filter(k=>!early.includes(k)).sort((x,y)=>["absender","adresse","vnr"].indexOf(x)-["absender","adresse","vnr"].indexOf(y));
  const qs=[...early.map(personQ), ...(b.q||[]).filter(q=>!q.show||q.show()), ...late.map(personQ)];
  return {b, list:[...qs,{type:"summary"},{type:"done"}]};
}
function startWiz(k){
  const b=B.find(x=>x.k===k);
  S.wiz={k,i:0,pq:personQs(b,S.rolle==="angehoerig")};
  if(!b.q?.length && !S.wiz.pq.length) S.wiz.i=1; // direkt zur Prüfung
  save(); render(); scrollTop();
}
function getQ(q){ if(q.store==="person") return S.person[q.k]; return ansObj(S.wiz.k)[q.k] }
function setQ(q,v){ if(q.store==="person") S.person[q.k]=v; else ansObj(S.wiz.k)[q.k]=v; delete S.texte[S.wiz.k]; delete S.texte[S.wiz.k+"_sub"]; save() }
const lab=q=>txt(q.label);
function showVal(q){
  if(q.type==="addr") return [S.person.strasse,S.person.ort].filter(Boolean).join(", ");
  const v=getQ(q); if(Array.isArray(v)) return v.join(", ");
  if(v==null||String(v).trim()==="") return "";
  if(q.type==="date"){const d=parseIso(v);return d?deD(d):v}
  if(q.type==="choice"){const o=(q.opts||[]).find(o=>o.v===v);return o?o.t:v}
  if(q.type==="money") return eur(numDE(v),2);
  return String(v);
}
function qInput(q){
  const v=getQ(q), id="wq-"+q.k;
  if(q.type==="choice") return `<div class="choices big">${q.opts.map(o=>`<label class="choice" for="${id}-${esc(o.v)}"><input type="radio" id="${id}-${esc(o.v)}" name="${id}" data-wq="${q.k}" value="${esc(o.v)}" ${v===o.v?"checked":""}><span>${esc(o.t)}${o.s?`<small>${esc(o.s)}</small>`:""}</span></label>`).join("")}</div>`;
  if(q.type==="multi"){ const arr=Array.isArray(v)?v:[]; return `<div class="choices big">${q.opts.map(o=>`<label class="choice" for="${id}-${esc(o.v)}"><input type="checkbox" id="${id}-${esc(o.v)}" data-wqm="${q.k}" value="${esc(o.v)}" ${arr.includes(o.v)?"checked":""}><span>${esc(o.t)}</span></label>`).join("")}</div>` }
  if(q.type==="addr") return `<div class="grid2"><div class="field"><label for="wq-strasse">Straße und Hausnummer</label><input type="text" id="wq-strasse" data-wqp="strasse" value="${esc(S.person.strasse)}" autocomplete="street-address"></div><div class="field"><label for="wq-ort">PLZ und Ort</label><input type="text" id="wq-ort" data-wqp="ort" value="${esc(S.person.ort)}" placeholder="z. B. 70173 Stuttgart"></div></div>`;
  if(q.type==="long") return `<textarea id="${id}" data-wq="${q.k}" rows="4" placeholder="${esc(q.ph||"")}" style="min-height:120px">${esc(v||"")}</textarea>`;
  const t = q.type==="date"?"date":q.type==="tel"?"tel":"text";
  const im = q.type==="money"||q.type==="number"?' inputmode="decimal"':"";
  const inp=`<input type="${t}" id="${id}" data-wq="${q.k}" value="${esc(v||"")}" placeholder="${esc(q.ph||"")}"${im}>`;
  return q.type==="money"?`<div class="euro">${inp}<span>€</span></div>`:inp;
}
function viewWizard(){
  const {b,list}=wizSteps(); let i=Math.min(S.wiz.i,list.length-1); S.wiz.i=i;
  const step=list[i], nQ=list.length-2;
  const top=`<div class="wiztop"><button type="button" class="btn small ghost" data-wnav="close">← Zur Übersicht</button><span class="small muted">${esc(b.t)}</span></div>`;
  if(step.type==="summary"){
    const qs=list.slice(0,-2);
    const missing=qs.filter(q=>!showVal(q)).length;
    return `<section class="panel wiz">${top}${bar(nQ+1,nQ+1,"Prüfen")}
      <h2 class="wq">Stimmt alles?</h2>
      <p class="whelp">Tippe auf „Ändern“, wenn etwas nicht passt.${missing?` ${missing===1?"Eine Angabe ist":missing+" Angaben sind"} noch offen. Das ist nicht schlimm: Im Antrag steht dann eine Lücke, die du von Hand ausfüllen kannst.`:""}</p>
      <dl class="sum">${qs.map((q,j)=>`<div><dt>${esc(lab(q))}</dt><dd>${showVal(q)?esc(showVal(q)):'<span class="open">noch offen</span>'}</dd><button type="button" class="linkbtn" data-wnav="goto:${j}">Ändern</button></div>`).join("")||'<p class="muted">Für diesen Antrag brauchen wir keine weiteren Angaben.</p>'}</dl>
      ${b.k==="jahresbetrag"?vhpSummary():""}
      <div class="nav big go">${i>0?`<button class="btn ghost" type="button" data-wnav="back">Zurück</button>`:"<span></span>"}<button class="btn" type="button" data-wnav="next">Antrag erstellen</button></div>
    </section>`;
  }
  if(step.type==="done") return viewDone(b);
  return `<section class="panel wiz">${top}${bar(i+1,nQ+1,`Frage ${i+1} von ${nQ}`)}
    <h2 class="wq"><label for="wq-${step.k}">${esc(lab(step))}</label></h2>
    ${step.help?`<p class="whelp">${ic("info")}<span>${esc(step.help)}</span></p>`:""}
    ${qInput(step)}
    <div class="nav big go">
      ${i>0?`<button class="btn ghost" type="button" data-wnav="back">Zurück</button>`:`<button class="btn ghost" type="button" data-wnav="close">Abbrechen</button>`}
      <span class="btnrow">${showVal(step)?"":`<button class="btn ghost" type="button" data-wnav="next">Weiß ich nicht</button>`}<button class="btn" type="button" data-wnav="next">Weiter</button></span>
    </div>
  </section>`;
}
function bar(n,of,label){return `<div class="stepper"><div class="meta"><span>${esc(label)}</span><span>${Math.round(n/of*100)} %</span></div><div class="bar"><i style="width:${Math.round(n/of*100)}%"></i></div></div>`}
function vhpSummary(){
  const c=vhpCalc(), v=S.vhp;
  return `<div class="calc">
     <div><span>Noch verfügbar vom Jahresbetrag</span><b>${eur(c.rest,2)}</b></div>
     ${v.ersatz==="angehoerig"?`<div><span>Höchstens für Angehörige (2 × Pflegegeld)</span><b>${eur(c.cap,2)}</b></div>`:""}
     ${c.pflege?`<div><span>Ersatzpflege${c.gekappt?" (auf Höchstbetrag gekürzt)":""}</span><b>${eur(c.pflege,2)}</b></div>`:""}
     ${c.fahrt?`<div><span>Fahrtkosten (${eur(KM_SATZ,2)} pro km)</span><b>${eur(c.fahrt,2)}</b></div>`:""}
     ${c.verd?`<div><span>Verdienstausfall</span><b>${eur(c.verd,2)}</b></div>`:""}
     <div class="tot"><span>Voraussichtlich bekommt ihr</span><b>${c.total?eur(c.total,2):"–"}</b></div></div>
     <p class="small muted">${v.art==="stunden"?"Weil es nur stundenweise war, läuft das Pflegegeld ungekürzt weiter.":"In dieser Zeit gibt es das halbe Pflegegeld (am ersten und letzten Tag das volle)."}</p>`;
}
function viewDone(b){
  const L=curLetter(b), r=RECIP[b.to](), docs=docsFor(b), st=S.status[b.k]||"offen";
  const priv=b.k==="jahresbetrag"&&["angehoerig","privat"].includes(S.vhp.ersatz);
  return `<section class="panel wiz">
    <div class="wiztop"><button type="button" class="btn small ghost" data-wnav="back">← Angaben ändern</button><button type="button" class="btn small ghost" data-wnav="close">Zur Übersicht</button></div>
    <h2 class="wq">${ic("check")} Dein Antrag ist fertig</h2>
    <div class="btnrow big">
      <button class="btn" type="button" data-pdf="${b.k}">${ic("down")}Als PDF speichern</button>
      <button class="btn soft" type="button" data-copy="${b.k}">Text kopieren</button>
      ${r.mail?`<a class="btn ghost" href="${mailto(b,r.mail)}" target="_blank" rel="noopener">Per E-Mail öffnen</a>`:""}
    </div>
    <div class="paper"><p class="subj">${esc(L.subject)}</p><p>${esc(L.body)}</p></div>
    ${/\[[^\]]+\]/.test(L.body)?`<p class="notice">${ic("alert")}<span>Stellen in [eckigen Klammern] bitte vor dem Abschicken von Hand ausfüllen oder oben unter „Angaben ändern“ nachtragen.</span></p>`:""}
    <h3>So schickst du ihn ab</h3>
    <ol class="howsend">
      <li><strong>PDF ausdrucken und unterschreiben.</strong> Oder den Text in die App oder das Online-Postfach der Kasse kopieren.</li>
      ${docs.length?`<li><strong>Diese Unterlagen beilegen:</strong><ul class="checks">${docs.map((c,j)=>`<li><label><input type="checkbox" data-check="${b.k}:${j}" ${S.checks[b.k+":"+j]?"checked":""}><span>${esc(c)}</span></label></li>`).join("")}</ul>${priv?`<button class="btn small soft" type="button" data-act="vhp-quittung" style="margin-top:8px">${ic("down")}${S.vhp.ersatz==="angehoerig"?"Bestätigung":"Quittung"} zum Unterschreiben (PDF)</button>`:""}</li>`:""}
      <li><strong>Abschicken an:</strong> ${esc(r.name)}.<br><span class="small muted">${esc(r.hint)}</span>${r.mail?`<br><span class="small">E-Mail: <code>${esc(r.mail)}</code></span>`:""}</li>
      <li><strong>Hier abhaken, wenn es raus ist.</strong> Wir erinnern dich in 4 Wochen, falls noch keine Antwort da ist.</li>
    </ol>
    ${st==="offen"?`<button class="btn big" type="button" data-act="sent" data-k="${b.k}">${ic("check")}Ich habe den Antrag abgeschickt</button>`:`<p class="notice good">${ic("check")}<span>Abgeschickt${S.sent&&S.sent[b.k]?" am "+deD(parseIso(S.sent[b.k])):""}. Status: ${esc(st)}.</span></p>`}
    <details><summary class="small">Text selbst ändern (für Geübte)</summary>
      <div class="field" style="margin-top:10px"><input type="text" data-sub="${b.k}" value="${esc(L.subject)}" aria-label="Betreff"><textarea data-tx="${b.k}" aria-label="Antragstext">${esc(L.body)}</textarea>
      ${S.texte[b.k]!=null?`<button class="btn small ghost" type="button" data-resettx="${b.k}">Änderungen verwerfen</button>`:""}</div>
    </details>
  </section>`;
}


