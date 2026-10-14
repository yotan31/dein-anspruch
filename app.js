"use strict";


/* ---------- Stammdaten 2026 ---------- */
const PG = {
  pflegegeld:[0,0,347,599,800,990],
  sachleistung:[0,0,796,1497,1859,2299],
  tagespflege:[0,0,721,1357,1685,2085],
  stationaer:[0,131,805,1319,1855,2096],
  rv:[0,0,198.62,316.32,514.94,735.63],
  pflegePausch:[0,0,600,1100,1800,1800],
};
const ENTLASTUNG=131, JAHRESBETRAG=3539, VERBRAUCH=42, WOHNUMFELD=4180, WG=224, DIPA=40, DIPA_UL=30;
const BEHPAUSCH={20:384,30:620,40:860,50:1140,60:1440,70:1780,80:2120,90:2460,100:2840};

const KASSEN = {
  tk:{name:"Techniker Krankenkasse (TK)", pk:"TK-Pflegeversicherung", mail:"service@tk.de", app:"TK-App (sicherer Upload)"},
  barmer:{name:"BARMER", pk:"BARMER Pflegekasse", mail:"service@barmer.de", app:"BARMER-App"},
  dak:{name:"DAK-Gesundheit", pk:"DAK-Gesundheit Pflegekasse", mail:"service@dak.de", app:"Meine DAK (App)"},
  aok:{name:"AOK", pk:"AOK-Pflegekasse", mail:"", app:"AOK Mein Leben (App)"},
  ikk:{name:"IKK classic", pk:"IKK classic Pflegekasse", mail:"info@ikk-classic.de", app:"IKK classic App"},
  andere:{name:"Andere Krankenkasse", pk:"Pflegekasse", mail:"", app:"App oder Online-Postfach deiner Kasse"},
};
const AOK_REGIONEN=["Baden-Württemberg","Bayern","PLUS (Sachsen/Thüringen)","Niedersachsen","Rheinland/Hamburg","NordWest","Hessen","Nordost","Rheinland-Pfalz/Saarland","Sachsen-Anhalt","Bremen/Bremerhaven"];
const WOHNEN = {
  angehoerige:{t:"Zu Hause, Pflege durch Angehörige/Bekannte", s:"ohne Pflegedienst"},
  gemischt:{t:"Zu Hause, Angehörige + Pflegedienst", s:"Kombination"},
  pflegedienst:{t:"Zu Hause, überwiegend Pflegedienst", s:"Sachleistung"},
  wg:{t:"Ambulant betreute Wohngruppe", s:"Pflege-WG"},
  heim:{t:"Pflegeheim (vollstationär)", s:"dauerhaft im Heim"},
  eingliederung:{t:"Wohnheim der Eingliederungshilfe", s:"Einrichtung für Menschen mit Behinderung"},
};
const MZ = {G:"G – erheblich gehbehindert",aG:"aG – außergewöhnlich gehbehindert",H:"H – hilflos",Bl:"Bl – blind",TBl:"TBl – taubblind",Gl:"Gl – gehörlos",B:"B – Begleitperson nötig",RF:"RF – Rundfunkbeitrag-Ermäßigung"};

/* ---------- Zustand ---------- */
const blank = () => ({
  step:0, done:false, tab:"ansprueche", brutto:"", bruttoJahr:{}, chronisch:"", welcomeSeen:false, bescheid:null, entlSeit:"", ans:{}, sent:{}, wiz:null, font:"1", belegFilter:{jahre:[],kat:""},
  vhp:{grund:"urlaub",art:"tage",haupt:"",von:"",bis:"",stunden:"",ersatz:"angehoerig",eName:"",eAdresse:"",eBez:"",satz:"",rechnung:"",km:"",verdienst:"",verbraucht:"",auszahlung:"versicherte",iban:""}, termine:{dienst:"",tel:"",besuche:[],eigene:[],wertmarke:""},
  rolle:"", bereiche:{pflege:true,sb:false},
  kasse:"", aokRegion:"", kasseAndere:"",
  pg:"", wohnen:"", verschlechtert:false,
  pp:{vorhanden:true, stunden10:"", arbeit:""},
  sb:{status:"", gdb:"", mz:{}, arbeit:false, auto:false, grundsicherung:false},
  genutzt:{}, status:{}, checks:{}, texte:{},
  person:{name:"",geb:"",vnr:"",strasse:"",ort:"",absender:"",beziehung:"",absStrasse:"",absOrt:"",tel:"",mail:""},
});
let S = blank();
const isHome = () => ["angehoerige","gemischt","pflegedienst","wg"].includes(S.wohnen);
const pg = () => Number(S.pg)||0;
const gdb = () => Number(S.sb.gdb)||0;
const mz = k => !!S.sb.mz[k];
const eur = (n,d=0) => n.toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d})+" €";
const esc = s => String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- Leistungskatalog ---------- */
const PK="pflegekasse", KK="krankenkasse", VA="versorgungsamt", FA="finanzamt";
const B = [
 {k:"pg_antrag", area:"Pflege", t:"Pflegegrad beantragen", p:"§ 14, § 18 SGB XI",
  when:()=>S.bereiche.pflege && pg()===0, val:()=>null, short:"Ohne Pflegegrad gibt es keine Leistungen der Pflegekasse. Leistungen gelten ab dem Monat der Antragstellung.",
  steps:["Antrag formlos bei der Pflegekasse stellen (Brief, E-Mail oder App). Das Datum zählt ab sofort.","Pflegetagebuch über 1–2 Wochen führen: Was klappt nicht mehr allein?","Begutachtung durch den Medizinischen Dienst zu Hause, Angehörige dabei sein.","Bescheid prüfen. Gegen eine zu niedrige Einstufung innerhalb eines Monats Widerspruch einlegen."],
  docs:["Versichertenkarte/Versichertennummer","Arztberichte, Medikamentenplan","Pflegetagebuch","Vollmacht (wenn Angehörige den Antrag stellen)"],
  to:PK, ask:"beantrage ich hiermit die Feststellung der Pflegebedürftigkeit und Leistungen der Pflegeversicherung nach dem SGB XI. Bitte beauftragen Sie den Medizinischen Dienst mit der Begutachtung und bieten Sie mir eine Pflegeberatung nach § 7a SGB XI an."},
 {k:"pg_hoch", area:"Pflege", t:"Höheren Pflegegrad beantragen", p:"§ 14, § 18 SGB XI",
  when:()=>S.bereiche.pflege && pg()>=1 && pg()<5, val:()=>null, opt:true,
  short:()=>`Wenn der Hilfebedarf gestiegen ist. Pflegegrad ${pg()+1} bringt z. B. ${eur(PG.pflegegeld[pg()+1]-PG.pflegegeld[pg()])} mehr Pflegegeld im Monat.`,
  steps:["Änderungen der letzten Monate notieren (Stürze, Demenz, nächtliche Hilfe, Inkontinenz).","Antrag auf Höherstufung formlos stellen.","Neue Begutachtung vorbereiten: Pflegetagebuch, aktuelle Arztberichte.","Bescheid prüfen, ggf. Widerspruch innerhalb eines Monats."],
  docs:["aktuelle Arztberichte","Pflegetagebuch","Bisheriger Pflegegrad-Bescheid"],
  to:PK, ask:"beantrage ich hiermit eine Höherstufung des Pflegegrades, da sich der Hilfebedarf deutlich erhöht hat. Bitte veranlassen Sie eine erneute Begutachtung durch den Medizinischen Dienst."},
 {k:"pflegegeld", area:"Pflege", t:"Pflegegeld", p:"§ 37 SGB XI", cash:true,
  when:()=>pg()>=2 && ["angehoerige","gemischt","wg"].includes(S.wohnen),
  val:()=>PG.pflegegeld[pg()]*12, mon:()=>PG.pflegegeld[pg()],
  short:()=>`${eur(PG.pflegegeld[pg()])} im Monat, frei verwendbar für pflegende Angehörige. Mit Pflegedienst anteilig als Kombinationsleistung (§ 38).`,
  steps:["Pflegegeld bei der Pflegekasse beantragen und Pflegeperson benennen.","Kontoverbindung angeben.","Halbjährlichen Beratungsbesuch nach § 37 Abs. 3 einplanen, sonst wird das Pflegegeld gekürzt."],
  docs:["Name und Anschrift der Pflegeperson(en)","IBAN"],
  to:PK, ask:()=>`beantrage ich hiermit Pflegegeld nach § 37 SGB XI (bei gleichzeitiger Nutzung eines Pflegedienstes als Kombinationsleistung nach § 38 SGB XI). Die Pflege übernimmt: [Name der Pflegeperson]. Bitte überweisen Sie das Pflegegeld auf folgendes Konto: [IBAN].`},
 {k:"sachleistung", area:"Pflege", t:"Pflegesachleistung (Pflegedienst)", p:"§ 36, § 38 SGB XI",
  when:()=>pg()>=2 && isHome() , val:()=>null, mon:()=>PG.sachleistung[pg()],
  short:()=>`Bis ${eur(PG.sachleistung[pg()])} im Monat für einen zugelassenen Pflegedienst. Ungenutztes Budget wird als anteiliges Pflegegeld ausgezahlt.`,
  steps:["Zugelassenen Pflegedienst auswählen (Preisvergleichsliste der Pflegekasse).","Pflegevertrag abschließen, der Dienst rechnet direkt mit der Kasse ab.","Bei Kombination mit Pflegegeld: Kombinationsleistung beantragen.","Bis zu 40 % des Budgets dürfen in Angebote zur Unterstützung im Alltag umgewandelt werden (§ 45a Abs. 4)."],
  docs:["Kostenvoranschlag/Pflegevertrag des Pflegedienstes"],
  to:PK, ask:"beantrage ich hiermit Pflegesachleistungen nach § 36 SGB XI bzw. die Kombinationsleistung nach § 38 SGB XI. Die Versorgung übernimmt der Pflegedienst: [Name des Pflegedienstes]."},
 {k:"entlastung", area:"Pflege", t:"Entlastungsbetrag", p:"§ 45b SGB XI", cash:true,
  when:()=>pg()>=1 && isHome(), val:()=>ENTLASTUNG*12, mon:()=>ENTLASTUNG,
  short:`${ENTLASTUNG} € im Monat (${eur(ENTLASTUNG*12)} im Jahr) für Haushaltshilfe, Alltagsbegleitung, Tagespflege oder Kurzzeitpflege. Wird als Erstattung gegen Rechnung gezahlt.`,
  steps:["Anerkannten Anbieter für Unterstützung im Alltag suchen (Liste bei der Pflegekasse, in BW auch Nachbarschaftshilfe).","Rechnung an die Pflegekasse schicken oder Abtretungserklärung unterschreiben, dann rechnet der Anbieter direkt ab.","Nicht genutzte Beträge werden ins nächste Halbjahr übertragen und verfallen am 30. Juni des Folgejahres."],
  docs:["Rechnungen des anerkannten Anbieters","ggf. Abtretungserklärung"],
  to:PK, ask:"beantrage ich hiermit die Erstattung von Aufwendungen aus dem Entlastungsbetrag nach § 45b SGB XI. Die Rechnungen des anerkannten Anbieters [Name] liegen bei. Bitte teilen Sie mir außerdem mit, wie hoch das noch verfügbare Guthaben aus dem Vorjahr ist."},
 {k:"jahresbetrag", area:"Pflege", t:"Verhinderungs- und Kurzzeitpflege", p:"§ 39, § 42, § 42a SGB XI", cash:true,
  when:()=>pg()>=2 && isHome(), val:()=>JAHRESBETRAG,
  short:()=>`Gemeinsamer Jahresbetrag von ${eur(JAHRESBETRAG)} für Ersatzpflege, wenn die Hauptpflegeperson verhindert ist (Urlaub, Krankheit, Auszeit), und für Kurzzeitpflege im Heim. Durch nahe Angehörige bis ${eur(PG.pflegegeld[pg()]*2)} plus nachgewiesene Kosten.`,
  steps:["Unten ausfüllen: Wer pflegt sonst, wer war verhindert, wer hat in dieser Zeit gepflegt.","Belege sammeln (Beispiele siehe unten). Für Privatpersonen reicht eine unterschriebene Quittung, die Vorlage gibt es hier als PDF.","Antrag mit Belegen an die Pflegekasse schicken. Seit 2026 ist kein Antrag vorab nötig.","Frist: spätestens bis 31.12. des Folgejahres (Ausschlussfrist)."],
  docs:()=>vhpDocs(),
  to:PK, ask:()=>vhpAsk()},
 {k:"tagespflege", area:"Pflege", t:"Tages- oder Nachtpflege", p:"§ 41 SGB XI",
  when:()=>pg()>=2 && isHome(), val:()=>null, mon:()=>PG.tagespflege[pg()],
  short:()=>`Eigenes Budget bis ${eur(PG.tagespflege[pg()])} im Monat, zusätzlich zu Pflegegeld oder Pflegedienst. Ideal, wenn Angehörige berufstätig sind.`,
  steps:["Tagespflege in der Nähe suchen und Probetag vereinbaren.","Antrag auf teilstationäre Pflege stellen.","Pflegekosten zahlt die Kasse bis zum Budget, Verpflegung und Fahrten teils selbst (dafür Entlastungsbetrag nutzbar)."],
  docs:["Angebot/Vertrag der Tagespflege"],
  to:PK, ask:"beantrage ich hiermit Leistungen der Tages- und Nachtpflege nach § 41 SGB XI in der Einrichtung [Name der Tagespflege] ab dem [Datum]."},
 {k:"verbrauch", area:"Pflege", t:"Pflegehilfsmittel zum Verbrauch", p:"§ 40 Abs. 2 SGB XI", cash:true,
  when:()=>pg()>=1 && isHome(), val:()=>VERBRAUCH*12, mon:()=>VERBRAUCH,
  short:`Bis ${VERBRAUCH} € im Monat für Handschuhe, Desinfektion, Bettschutzeinlagen, Mundschutz. Viele Anbieter liefern monatlich kostenlos.`,
  steps:["Anbieter (Apotheke, Sanitätshaus oder Versand) wählen.","Antrag auf Kostenübernahme unterschreiben, der Anbieter reicht ihn meist ein.","Box wird jeden Monat geliefert, keine Zuzahlung."],
  docs:["Antragsformular des Anbieters oder dieses Schreiben"],
  to:PK, ask:"beantrage ich hiermit die Kostenübernahme für zum Verbrauch bestimmte Pflegehilfsmittel nach § 40 Abs. 2 SGB XI bis zur Höhe von 42 Euro monatlich. Die Versorgung soll erfolgen durch: [Anbieter]."},
 {k:"technisch", area:"Pflege", t:"Hausnotruf, Pflegebett & technische Hilfsmittel", p:"§ 40 Abs. 1 SGB XI",
  when:()=>pg()>=1 && isHome(), val:()=>null,
  short:"Pflegekasse übernimmt die Kosten, Zuzahlung höchstens 10 %, maximal 25 € je Hilfsmittel. Hausnotruf wird in der Regel monatlich bezuschusst.",
  steps:["Bedarf klären: Hausnotruf, Pflegebett, Lagerungshilfen, Rollator (bei Krankheit über die Krankenkasse).","Kostenvoranschlag beim Sanitätshaus oder Hausnotruf-Anbieter holen.","Antrag mit Kostenvoranschlag einreichen. Erst nach Bewilligung bestellen."],
  docs:["Kostenvoranschlag","Empfehlung aus dem MD-Gutachten (falls vorhanden)"],
  to:PK, ask:"beantrage ich hiermit die Versorgung mit folgendem technischen Pflegehilfsmittel nach § 40 Abs. 1 SGB XI: [Hilfsmittel, z. B. Hausnotruf / Pflegebett]. Ein Kostenvoranschlag liegt bei."},
 {k:"wohnumfeld", area:"Pflege", t:"Zuschuss zum Wohnungsumbau", p:"§ 40 Abs. 4 SGB XI",
  when:()=>pg()>=1 && isHome(), val:()=>null, once:WOHNUMFELD,
  short:`Bis ${eur(WOHNUMFELD)} je Maßnahme, z. B. bodengleiche Dusche, Treppenlift, Türverbreiterung. Wohnen mehrere Pflegebedürftige zusammen, bis ${eur(WOHNUMFELD*4)}.`,
  steps:["Umbau planen, zwei Angebote einholen.","Antrag VOR Baubeginn stellen.","Nach Bewilligung bauen lassen und Rechnung einreichen."],
  docs:["Kostenvoranschläge","Fotos der Ist-Situation","Einverständnis des Vermieters (bei Miete)"],
  to:PK, ask:"beantrage ich hiermit einen Zuschuss für Maßnahmen zur Verbesserung des individuellen Wohnumfeldes nach § 40 Abs. 4 SGB XI für folgende Maßnahme: [z. B. Umbau der Badewanne zu einer bodengleichen Dusche]. Kostenvoranschläge liegen bei."},
 {k:"dipa", area:"Pflege", t:"Digitale Pflegeanwendungen (DiPA)", p:"§ 40a, § 40b SGB XI",
  when:()=>pg()>=1 && isHome(), val:()=>null, mon:()=>DIPA+DIPA_UL,
  short:`Bis ${DIPA} € im Monat für eine zugelassene Pflege-App plus ${DIPA_UL} € für ergänzende Unterstützung durch einen Pflegedienst.`,
  steps:["Zugelassene DiPA im BfArM-Verzeichnis aussuchen.","Antrag bei der Pflegekasse stellen.","Freischaltcode nach Bewilligung erhalten."],
  docs:["Name der DiPA"], to:PK, ask:"beantrage ich hiermit die Versorgung mit der digitalen Pflegeanwendung [Name] nach § 40a SGB XI sowie ergänzende Unterstützungsleistungen nach § 39a SGB XI."},
 {k:"wg", area:"Pflege", t:"Wohngruppenzuschlag", p:"§ 38a SGB XI", cash:true,
  when:()=>pg()>=1 && S.wohnen==="wg", val:()=>WG*12, mon:()=>WG,
  short:`${WG} € im Monat pauschal für Bewohner ambulant betreuter Wohngruppen.`,
  steps:["Antrag stellen mit Nachweis über die Wohngruppe und die beauftragte Präsenzkraft."],
  docs:["Mietvertrag der WG","Vereinbarung mit der Präsenzkraft"], to:PK, ask:"beantrage ich hiermit den Wohngruppenzuschlag nach § 38a SGB XI für die ambulant betreute Wohngruppe [Name, Anschrift]."},
 {k:"beratung", area:"Pflege", t:"Kostenlose Pflegeberatung", p:"§ 7a SGB XI",
  when:()=>S.bereiche.pflege, val:()=>null,
  short:"Persönliche Beratung durch die Pflegekasse oder den Pflegestützpunkt, auf Wunsch zu Hause. Sinnvoll, um alle Budgets zu planen.",
  steps:["Termin bei der Pflegekasse oder dem Pflegestützpunkt vereinbaren.","Diese Ergebnisliste mitnehmen."], docs:["Pflegegrad-Bescheid"],
  to:PK, ask:"bitte ich um einen Termin für eine individuelle Pflegeberatung nach § 7a SGB XI, gern bei mir zu Hause."},
 {k:"pflegekurs", area:"Pflege", t:"Kostenloser Pflegekurs für Angehörige", p:"§ 45 SGB XI",
  when:()=>S.bereiche.pflege && S.rolle==="angehoerig", val:()=>null,
  short:"Kurse und häusliche Schulungen für pflegende Angehörige, auch online. Kostenlos.",
  steps:["Kursangebot bei der Pflegekasse erfragen oder online buchen."], docs:[],
  to:PK, ask:"bitte ich um Informationen zu kostenlosen Pflegekursen bzw. einer häuslichen Schulung nach § 45 SGB XI für pflegende Angehörige."},
 {k:"rv", area:"Pflegeperson", t:"Rentenbeiträge für die Pflegeperson", p:"§ 44 SGB XI",
  when:()=>pg()>=2 && isHome() && S.wohnen!=="pflegedienst" && S.pp.stunden10==="ja" && S.pp.arbeit!=="ueber30",
  val:()=>null, mon:()=>PG.rv[pg()],
  short:()=>`Die Pflegekasse zahlt bis ${eur(PG.rv[pg()],2)} im Monat in die Rentenversicherung der Pflegeperson, dazu Arbeitslosen- und Unfallversicherung.`,
  steps:["Fragebogen zur Zahlung der Beiträge zur sozialen Sicherung für Pflegepersonen bei der Pflegekasse anfordern.","Pflegezeit angeben: mind. 10 Stunden an mind. 2 Tagen pro Woche, Pflegeperson arbeitet höchstens 30 Stunden.","Rentenkonto später prüfen."],
  docs:["Angaben zur Pflegeperson (Rentenversicherungsnummer, Arbeitszeit)"],
  to:PK, ask:"beantrage ich hiermit die Zahlung von Beiträgen zur Renten- und Arbeitslosenversicherung für die Pflegeperson [Name, Rentenversicherungsnummer] nach § 44 SGB XI. Die Pflege umfasst mindestens 10 Stunden an mindestens 2 Tagen pro Woche. Bitte senden Sie mir den entsprechenden Fragebogen zu."},
 {k:"pug", area:"Pflegeperson", t:"Pflegeunterstützungsgeld bei akuter Pflegesituation", p:"§ 44a SGB XI, § 2 PflegeZG",
  when:()=>S.bereiche.pflege && S.pp.arbeit && S.pp.arbeit!=="nein", val:()=>null, opt:true,
  short:"Berufstätige Angehörige können bis zu 10 Arbeitstage im Jahr freinehmen und erhalten 90 % des Nettolohns von der Pflegekasse.",
  steps:["Arbeitgeber sofort über die Freistellung informieren.","Ärztliche Bescheinigung über die akute Pflegesituation holen.","Antrag bei der Pflegekasse des Pflegebedürftigen stellen."],
  docs:["ärztliche Bescheinigung","Entgeltbescheinigung des Arbeitgebers"],
  to:PK, ask:"beantrage ich hiermit Pflegeunterstützungsgeld nach § 44a Abs. 3 SGB XI für die kurzzeitige Arbeitsverhinderung der Pflegeperson [Name] im Zeitraum [von – bis]. Die ärztliche Bescheinigung liegt bei."},
 {k:"pflegepausch", area:"Steuer", t:"Pflege-Pauschbetrag in der Steuererklärung", p:"§ 33b Abs. 6 EStG",
  when:()=>pg()>=2 && isHome() && S.rolle==="angehoerig", val:()=>null, frei:()=>PG.pflegePausch[pg()],
  short:()=>`Pflegende Angehörige können ${eur(PG.pflegePausch[pg()])} pro Jahr steuerlich absetzen, wenn sie unentgeltlich pflegen.`,
  steps:["In der Einkommensteuererklärung (Anlage Außergewöhnliche Belastungen) eintragen.","Pflegegrad-Bescheid und Steuer-ID der gepflegten Person bereithalten."],
  docs:["Pflegegrad-Bescheid","Steuer-ID der gepflegten Person"], to:FA},
 {k:"stationaer", area:"Pflegeheim", t:"Leistungsbetrag vollstationäre Pflege", p:"§ 43 SGB XI",
  when:()=>pg()>=1 && S.wohnen==="heim", val:()=>null, mon:()=>PG.stationaer[pg()],
  short:()=>`${eur(PG.stationaer[pg()])} im Monat zahlt die Pflegekasse direkt ans Heim.`,
  steps:["Heimvertrag an die Pflegekasse schicken, das Heim rechnet direkt ab."], docs:["Heimvertrag"],
  to:PK, ask:"beantrage ich hiermit Leistungen der vollstationären Pflege nach § 43 SGB XI in der Einrichtung [Name des Heims] ab dem [Datum]."},
 {k:"zuschlag", area:"Pflegeheim", t:"Leistungszuschlag zum Eigenanteil prüfen", p:"§ 43c SGB XI",
  when:()=>pg()>=2 && S.wohnen==="heim", val:()=>null,
  short:"Die Kasse übernimmt 15 % des pflegebedingten Eigenanteils, nach 12 Monaten 30 %, nach 24 Monaten 50 %, nach 36 Monaten 75 %. Frühere Heimaufenthalte zählen mit.",
  steps:["Heimrechnung prüfen: Ist der Zuschlag abgezogen und die richtige Stufe angesetzt?","Frühere Heimzeiten (auch in anderen Heimen) der Kasse melden.","Bei Fehlern schriftlich Neuberechnung verlangen."],
  docs:["Heimrechnungen","Nachweise früherer Heimaufenthalte"],
  to:PK, ask:"bitte ich um Prüfung und ggf. Neuberechnung des Leistungszuschlags nach § 43c SGB XI. Der Aufenthalt in vollstationärer Pflege begann am [Datum]. Frühere Aufenthalte: [Einrichtung, Zeitraum]."},
 {k:"hzp", area:"Pflegeheim", t:"Hilfe zur Pflege vom Sozialamt", p:"§ 61 ff. SGB XII",
  when:()=>S.bereiche.pflege && (S.wohnen==="heim"), val:()=>null, opt:true,
  short:"Reichen Rente und Vermögen nicht für den Eigenanteil, übernimmt das Sozialamt den Rest. Kinder zahlen erst ab 100.000 € Jahresbrutto.",
  steps:["Antrag beim Sozialamt stellen, sobald das Geld knapp wird. Leistungen gibt es erst ab Antrag.","Einkommens- und Vermögensnachweise sammeln."],
  docs:["Rentenbescheid","Kontoauszüge","Heimvertrag und Rechnungen"], to:"sozialamt",
  ask:"beantrage ich hiermit Hilfe zur Pflege nach §§ 61 ff. SGB XII, da Einkommen und Vermögen nicht ausreichen, um die Kosten der vollstationären Pflege zu decken."},
 {k:"eingliederung", area:"Pflege", t:"Pauschale in Einrichtungen der Eingliederungshilfe", p:"§ 43a SGB XI",
  when:()=>pg()>=2 && S.wohnen==="eingliederung", val:()=>null, mon:()=>278,
  short:"Die Pflegekasse übernimmt 15 % der Vergütung, höchstens 278 € im Monat. An Wochenenden zu Hause kann anteilig Pflegegeld fließen.",
  steps:["Einrichtung fragen, ob die Pauschale abgerechnet wird.","Für Tage zu Hause anteiliges Pflegegeld beantragen."], docs:["Bescheinigung der Einrichtung über Heimfahrtstage"],
  to:PK, ask:"beantrage ich hiermit anteiliges Pflegegeld für die Tage der häuslichen Pflege außerhalb der Einrichtung [Name] (Nachweis liegt bei)."},
 {k:"fahrten", area:"Krankenkasse", t:"Fahrten zur ambulanten Behandlung", p:"§ 60 SGB V",
  when:()=>pg()>=3 || mz("aG") || mz("Bl") || mz("H"), val:()=>null,
  short:"Bei Pflegegrad 4 oder 5 bzw. Merkzeichen aG, Bl oder H gelten Taxifahrten zu ambulanten Arztterminen als genehmigt. Bei Pflegegrad 3 mit dauerhaft eingeschränkter Mobilität auf Antrag.",
  steps:["Ärztin oder Arzt stellt die Verordnung einer Krankenbeförderung aus.","Bei Pflegegrad 3 vorab Genehmigung bei der Krankenkasse holen.","Zuzahlung 10 %, mind. 5 €, max. 10 € je Fahrt (auf Belastungsgrenze anrechenbar)."],
  docs:["Verordnung Krankenbeförderung","Pflegegrad-Bescheid oder Ausweis"],
  to:KK, ask:"beantrage ich hiermit die Genehmigung von Krankenfahrten zu ambulanten Behandlungen nach § 60 Abs. 1 SGB V. Die ärztliche Verordnung liegt bei."},
 {k:"chroniker", area:"Krankenkasse", t:"Zuzahlungen begrenzen (1 % statt 2 %)", p:"§ 62 SGB V",
  when:()=>pg()>=3 || gdb()>=60, val:()=>null,
  short:"Wer als schwerwiegend chronisch krank gilt (z. B. ab Pflegegrad 3 oder GdB 60 wegen der Erkrankung), zahlt höchstens 1 % des Bruttoeinkommens pro Jahr zu. Darüber gibt es Befreiung.",
  steps:["Quittungen für Zuzahlungen (Apotheke, Fahrten, Therapie) sammeln.","Ärztliche Bescheinigung über die Dauerbehandlung holen.","Befreiung beantragen, sobald die Grenze erreicht ist, rückwirkend für das Jahr."],
  docs:["Quittungen","Einkommensnachweise des Haushalts","Bescheinigung der Dauerbehandlung"],
  to:KK, ask:"beantrage ich hiermit die Befreiung von Zuzahlungen nach § 62 SGB V bzw. die Anerkennung als schwerwiegend chronisch krank (Belastungsgrenze 1 %). Nachweise liegen bei."},
 /* Schwerbehinderung */
 {k:"sb_antrag", area:"Schwerbehinderung", t:"Schwerbehindertenausweis beantragen", p:"§ 152 SGB IX",
  when:()=>S.bereiche.sb && S.sb.status==="nein", val:()=>null,
  short:"Ab GdB 50 gibt es den Ausweis und viele Nachteilsausgleiche. Auch GdB 20–40 bringt Steuervorteile. Bei Pflegegrad liegt oft ein GdB vor.",
  steps:["Antrag beim Versorgungsamt stellen (in Baden-Württemberg: Landratsamt oder Stadtkreis), oft auch online.","Alle Diagnosen und behandelnden Ärzte angeben, Merkzeichen gleich mit beantragen.","Bescheid prüfen, Widerspruch innerhalb eines Monats möglich."],
  docs:["Arztberichte, Krankenhausberichte","Liste der behandelnden Ärzte mit Schweigepflichtentbindung","Passfoto (für Ausweis)"],
  to:VA, ask:"beantrage ich hiermit die Feststellung einer Behinderung und des Grades der Behinderung (GdB) nach § 152 SGB IX sowie die Ausstellung eines Schwerbehindertenausweises. Zudem beantrage ich die Prüfung folgender Merkzeichen: [z. B. G, B, H]. Eine Liste der behandelnden Ärztinnen und Ärzte liegt bei."},
 {k:"sb_neu", area:"Schwerbehinderung", t:"Höheren GdB oder Merkzeichen beantragen", p:"§ 152 SGB IX",
  when:()=>S.bereiche.sb && S.sb.status==="ja" && (gdb()<100 || (pg()>=4 && !mz("H"))), val:()=>null, opt:true,
  short:()=> (pg()>=4 && !mz("H")) ? "Bei Pflegegrad 4 oder 5 lohnt sich oft der Antrag auf Merkzeichen H: kostenlose Wertmarke und Kfz-Steuerbefreiung." : "Haben sich Erkrankungen verschlechtert oder sind neue hinzugekommen, lohnt ein Neufeststellungsantrag.",
  steps:["Neue Diagnosen und Befunde sammeln.","Neufeststellungsantrag beim Versorgungsamt stellen.","Gewünschte Merkzeichen ausdrücklich nennen."],
  docs:["neue Arztberichte","bisheriger Bescheid","Pflegegrad-Bescheid"],
  to:VA, ask:"beantrage ich hiermit die Neufeststellung des Grades der Behinderung wegen Verschlimmerung bzw. hinzugekommener Gesundheitsstörungen sowie die Prüfung folgender Merkzeichen: [z. B. H, G, B]. Aktuelle Befunde liegen bei."},
 {k:"behpausch", area:"Steuer", t:"Behinderten-Pauschbetrag", p:"§ 33b EStG",
  when:()=>gdb()>=20 || pg()>=4, val:()=>null,
  frei:()=>{ if(mz("H")||mz("Bl")||mz("TBl")||pg()>=4) return 7400; const g=Math.min(100,Math.floor(gdb()/10)*10); return BEHPAUSCH[g]||0; },
  short:()=>`Steuerfreibetrag von ${eur(B.find(x=>x.k==="behpausch").frei())} pro Jahr. Kann auf Eltern oder Kinder übertragen werden, wenn die Person selbst keine Steuern zahlt.`,
  steps:["In der Steuererklärung eintragen (Anlage Außergewöhnliche Belastungen).","Bescheid bzw. Ausweis bereithalten. Bei Pflegegrad 4/5 genügt der Pflegegrad-Bescheid für 7.400 €.","Rückwirkend für noch offene Steuerjahre beantragen."],
  docs:["Ausweis/Bescheid oder Pflegegrad-Bescheid"], to:FA},
 {k:"fahrtpausch", area:"Steuer", t:"Behinderungsbedingte Fahrtkostenpauschale", p:"§ 33 Abs. 2a EStG",
  when:()=>(gdb()>=80) || (gdb()>=70 && mz("G")) || mz("aG")||mz("Bl")||mz("TBl")||mz("H")||pg()>=4, val:()=>null,
  frei:()=> (mz("aG")||mz("Bl")||mz("TBl")||mz("H")||pg()>=4) ? 4500 : 900,
  short:()=>`${eur(B.find(x=>x.k==="fahrtpausch").frei())} pro Jahr zusätzlich steuerlich absetzbar, ohne Einzelnachweis.`,
  steps:["In der Steuererklärung (Anlage Außergewöhnliche Belastungen) eintragen."], docs:["Ausweis/Bescheid"], to:FA},
 {k:"wertmarke", area:"Schwerbehinderung", t:"Freifahrt im Nahverkehr (Wertmarke)", p:"§ 228 SGB IX",
  when:()=>S.sb.status==="ja" && (mz("G")||mz("aG")||mz("Gl")||mz("H")||mz("Bl")), val:()=>null,
  short:()=> (mz("H")||mz("Bl")||S.sb.grundsicherung) ? "Kostenlose Wertmarke: Bus, Bahn und Regionalverkehr in ganz Deutschland frei." : "Wertmarke für 104 € im Jahr (53 € halbjährlich): Bus, Bahn und Regionalverkehr in ganz Deutschland. Alternative zur Kfz-Steuerermäßigung.",
  steps:["Beiblatt mit Wertmarke beim Versorgungsamt beantragen.","Bei Merkzeichen H, Bl oder Bezug von Grundsicherung/Bürgergeld kostenlos.","Mit Merkzeichen B fährt eine Begleitperson immer kostenlos mit, auch im Fernverkehr der Bahn."],
  docs:["Ausweis","ggf. Bescheid über Grundsicherung/Bürgergeld"],
  to:VA, ask:"beantrage ich hiermit die Ausstellung eines Beiblatts mit Wertmarke für die unentgeltliche Beförderung im öffentlichen Personennahverkehr nach § 228 SGB IX."},
 {k:"kfz", area:"Schwerbehinderung", t:"Kfz-Steuer-Befreiung oder -Ermäßigung", p:"§ 3a KraftStG",
  when:()=>S.sb.auto && (mz("aG")||mz("Bl")||mz("TBl")||mz("H")||mz("G")||mz("Gl")), val:()=>null,
  short:()=> (mz("aG")||mz("Bl")||mz("TBl")||mz("H")) ? "100 % Befreiung von der Kfz-Steuer, zusätzlich zur kostenlosen Wertmarke möglich." : "50 % Ermäßigung der Kfz-Steuer. Gilt nicht gleichzeitig mit der Wertmarke, also abwägen.",
  steps:["Antrag beim Hauptzollamt (zuständig für die Kfz-Steuer) stellen.","Fahrzeug muss auf die schwerbehinderte Person zugelassen sein."],
  docs:["Ausweis","Fahrzeugschein"], to:"hauptzollamt",
  ask:"beantrage ich hiermit die Steuerbefreiung bzw. -ermäßigung nach § 3a Kraftfahrzeugsteuergesetz für das Fahrzeug mit dem amtlichen Kennzeichen [Kennzeichen]."},
 {k:"park", area:"Schwerbehinderung", t:"Blauer EU-Parkausweis", p:"§ 46 StVO",
  when:()=>mz("aG")||mz("Bl")||mz("TBl"), val:()=>null,
  short:"Parken auf Behindertenparkplätzen und Parkerleichterungen in ganz Europa.",
  steps:["Antrag bei der Straßenverkehrsbehörde bzw. dem Bürgeramt stellen.","Passfoto und Ausweis mitbringen."], docs:["Ausweis","Passfoto"], to:"strassenverkehrsbehoerde",
  ask:"beantrage ich hiermit die Ausstellung eines Parkausweises für Menschen mit Behinderung (blauer EU-Parkausweis)."},
 {k:"rundfunk", area:"Schwerbehinderung", t:"Ermäßigter Rundfunkbeitrag", p:"§ 4 RBStV", cash:true,
  when:()=>mz("RF")||mz("TBl"), val:()=> mz("TBl")?220.32:146.88,
  short:()=> mz("TBl") ? "Taubblinde Menschen werden ganz befreit (18,36 € im Monat gespart)." : "Nur 6,12 € statt 18,36 € im Monat zahlen.",
  steps:["Antrag beim ARD ZDF Deutschlandradio Beitragsservice stellen (online oder per Formular).","Kopie des Ausweises mit Merkzeichen beilegen."], docs:["Ausweis (Vorder- und Rückseite)"], to:"beitragsservice",
  ask:"beantrage ich hiermit die Ermäßigung bzw. Befreiung vom Rundfunkbeitrag nach § 4 Rundfunkbeitragsstaatsvertrag. Eine Kopie des Schwerbehindertenausweises liegt bei. Beitragsnummer: [Beitragsnummer]."},
 {k:"blind", area:"Schwerbehinderung", t:"Blindengeld / Landesblindenhilfe", p:"Landesrecht, § 72 SGB XII",
  when:()=>mz("Bl")||mz("TBl"), val:()=>null,
  short:"Monatliche Geldleistung des Bundeslandes, unabhängig vom Einkommen. Höhe je nach Land.",
  steps:["Antrag beim Versorgungsamt bzw. Landratsamt stellen.","Teile des Pflegegeldes werden angerechnet."], docs:["Augenärztliche Befunde","Ausweis"], to:VA,
  ask:"beantrage ich hiermit Blindengeld bzw. Landesblindenhilfe nach den landesrechtlichen Vorschriften."},
 {k:"urlaub", area:"Arbeit", t:"5 Tage Zusatzurlaub", p:"§ 208 SGB IX",
  when:()=>S.sb.arbeit && gdb()>=50, val:()=>null,
  short:"Schwerbehinderte Beschäftigte haben eine Arbeitswoche mehr Urlaub im Jahr, dazu besonderen Kündigungsschutz.",
  steps:["Arbeitgeber schriftlich über die Schwerbehinderung informieren.","Zusatzurlaub beantragen, auch rückwirkend für das laufende Jahr."], docs:["Kopie des Ausweises"], to:"arbeitgeber",
  ask:"teile ich Ihnen mit, dass bei mir eine Schwerbehinderung mit einem GdB von [GdB] festgestellt ist. Ich beantrage daher den Zusatzurlaub nach § 208 SGB IX für das laufende Kalenderjahr."},
 {k:"gleich", area:"Arbeit", t:"Gleichstellung mit Schwerbehinderten", p:"§ 2 Abs. 3 SGB IX",
  when:()=>S.sb.arbeit && gdb()>=30 && gdb()<50, val:()=>null,
  short:"Mit GdB 30 oder 40 schützt die Gleichstellung den Arbeitsplatz (Kündigungsschutz, Förderung), aber ohne Zusatzurlaub.",
  steps:["Antrag bei der Agentur für Arbeit stellen.","Darlegen, warum der Arbeitsplatz gefährdet ist."], docs:["GdB-Bescheid","Arbeitsvertrag"], to:"arbeitsagentur",
  ask:"beantrage ich hiermit die Gleichstellung mit einem schwerbehinderten Menschen nach § 2 Abs. 3 SGB IX. Der GdB beträgt [GdB]. Ohne Gleichstellung ist der Arbeitsplatz gefährdet, weil [Begründung]."},
 {k:"rente", area:"Arbeit", t:"Altersrente für schwerbehinderte Menschen", p:"§ 37, § 236a SGB VI",
  when:()=>S.sb.arbeit && gdb()>=50, val:()=>null, opt:true,
  short:"Bis zu 2 Jahre früher abschlagsfrei in Rente (35 Versicherungsjahre nötig). Der GdB muss bei Rentenbeginn anerkannt sein.",
  steps:["Kostenlose Beratung bei der Deutschen Rentenversicherung buchen.","Rentenauskunft anfordern."], docs:["Ausweis","Versicherungsverlauf"], to:"rentenversicherung",
  ask:"bitte ich um eine Rentenauskunft und Beratung zur Altersrente für schwerbehinderte Menschen. Der GdB beträgt [GdB]."},
];

const RECIP = {
  pflegekasse:()=>({name: kassePK(), hint: kasseMail()?`E-Mail: ${kasseMail()} (Adresse bitte prüfen). Sicherer: Upload über ${kasseInfo().app}.`:`Adresse steht auf deinem Bescheid oder der Webseite deiner Kasse. Sicher hochladen über ${kasseInfo().app}.`, mail:kasseMail()}),
  krankenkasse:()=>({name: kasseName(), hint: kasseMail()?`E-Mail: ${kasseMail()} (bitte prüfen) oder ${kasseInfo().app}.`:`Adresse steht auf deiner Versichertenkarte bzw. der Webseite deiner Kasse.`, mail:kasseMail()}),
  versorgungsamt:()=>({name:"Versorgungsamt", hint:"In Baden-Württemberg: Landratsamt bzw. Stadtkreis deines Wohnortes. In vielen Ländern auch online beantragbar.", mail:""}),
  finanzamt:()=>({name:"Finanzamt", hint:"Kein Antrag nötig: in der Einkommensteuererklärung eintragen (z. B. über ELSTER).", mail:""}),
  sozialamt:()=>({name:"Sozialamt", hint:"Sozialamt der Stadt oder des Landkreises am Wohnort.", mail:""}),
  hauptzollamt:()=>({name:"Hauptzollamt", hint:"Das für deinen Wohnort zuständige Hauptzollamt (zoll.de).", mail:""}),
  strassenverkehrsbehoerde:()=>({name:"Straßenverkehrsbehörde", hint:"Bürgeramt bzw. Straßenverkehrsbehörde deiner Stadt.", mail:""}),
  beitragsservice:()=>({name:"ARD ZDF Deutschlandradio Beitragsservice", hint:"Am einfachsten online über rundfunkbeitrag.de.", mail:""}),
  arbeitgeber:()=>({name:"Arbeitgeber / Personalabteilung", hint:"Direkt an die Personalabteilung.", mail:""}),
  arbeitsagentur:()=>({name:"Agentur für Arbeit", hint:"Zuständige Agentur für Arbeit am Wohnort.", mail:""}),
  rentenversicherung:()=>({name:"Deutsche Rentenversicherung", hint:"Beratung kostenlos, Termine über deutsche-rentenversicherung.de.", mail:""}),
};
function kasseInfo(){return KASSEN[S.kasse]||KASSEN.andere}
function kasseName(){ if(S.kasse==="aok") return "AOK "+(S.aokRegion||""); if(S.kasse==="andere") return S.kasseAndere||"Krankenkasse"; return kasseInfo().name }
function kassePK(){ if(S.kasse==="aok") return "AOK-Pflegekasse "+(S.aokRegion||""); if(S.kasse==="andere") return "Pflegekasse bei der "+(S.kasseAndere||"Krankenkasse"); return kasseInfo().pk }
function kasseMail(){ return S.kasse==="aok"||S.kasse==="andere" ? "" : kasseInfo().mail }

const txt = (v)=> typeof v==="function"?v():v;
function applicable(){ return B.filter(b=>{ try{return b.when()}catch(e){return false} }) }


/* ---------- Icons ---------- */
const ICON={
 heart:"M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
 user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
 form:"M5 3h14v18H5z M9 8h6 M9 12h6 M9 16h3",
 building:"M5 21V5h14v16 M9 9h2 M13 9h2 M9 13h2 M13 13h2 M10 21v-4h4v4",
 cross:"M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z",
 access:"M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M6 8h12 M12 8v6 M9 21l3-7 3 7",
 case:"M4 8h16v11H4z M9 8V5h6v3 M4 13h16",
 receipt:"M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3",
 cal:"M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
 list:"M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
 camera:"M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
 file:"M6 3h8l4 4v14H6z M14 3v4h4",
 info:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01",
 alert:"M12 3l9 16H3z M12 10v4 M12 17h.01",
 check:"M5 12l4 4 10-10",
 down:"M12 4v11 M7 10l5 5 5-5 M5 20h14",
 plus:"M12 5v14 M5 12h14",
 bell:"M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 21h4",
};
const ic=(n,c="i")=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const AREA_ICON={Pflege:"heart",Pflegeperson:"user",Steuer:"form",Pflegeheim:"building",Krankenkasse:"cross",Schwerbehinderung:"access",Arbeit:"case"};

/* ---------- Datum ---------- */
const TODAY=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const isoD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseIso=s=>{if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const deD=d=>d.toLocaleDateString("de-DE");
const daysUntil=d=>Math.round((d-TODAY())/864e5);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const MON=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
function halfOf(d){const h=d.getMonth()<6?1:2;const y=d.getFullYear();return {y,h,start:new Date(y,h===1?0:6,1),end:new Date(y,h===1?5:11,h===1?30:31),label:`${h}. Halbjahr ${y}`}}
function shiftHalf(H,n){let y=H.y,h=H.h+n;while(h>2){h-=2;y++}while(h<1){h+=2;y--}return halfOf(new Date(y,h===1?0:6,1))}

/* ---------- Befreiungs-Antrag (nur aus Belegen) ---------- */
B.push({k:"befreiung", area:"Krankenkasse", t:"Antrag auf Befreiung von Zuzahlungen", p:"§ 62 SGB V", when:()=>false, val:()=>null, short:"", steps:[],
  docs:["Zuzahlungsbelege (siehe Belegübersicht)","Einkommensnachweise aller Haushaltsmitglieder","ggf. Bescheinigung über die Dauerbehandlung (chronisch krank)"], to:KK, ask:()=>{const z=zuz(befJahr);return `beantrage ich hiermit die Befreiung von Zuzahlungen bzw. die Erstattung von Zuzahlungen über der Belastungsgrenze nach § 62 SGB V für das Jahr ${befJahr}. Die Belastungsgrenze beträgt ${z.grenze?eur(z.grenze,2):"[Betrag]"} (${z.pct} % der jährlichen Bruttoeinnahmen zum Lebensunterhalt). Bisher wurden Zuzahlungen in Höhe von ${eur(z.sum,2)} geleistet. Die Belege liegen in Kopie bei. Bitte erstatten Sie den Betrag, der die Belastungsgrenze übersteigt${String(befJahr)===String(new Date().getFullYear())?", und stellen Sie eine Befreiungsbescheinigung für den Rest des Jahres aus":""}.`}});

/* ---------- Verhinderungspflege-Assistent ---------- */
const KM_SATZ=0.20;
const numDE=x=>Number(String(x??"").replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."))||0;
const VHP_GRUND={urlaub:"Urlaub",krank:"Krankheit",kur:"Kur oder Reha",termine:"Termine, Erholung oder andere wichtige Gründe"};
const VHP_ERSATZ={
  angehoerig:{t:"Nahe Angehörige oder Haushaltsmitglied",s:"verwandt/verschwägert bis 2. Grad (z. B. Kind, Enkel, Geschwister, Schwiegerkind) oder wohnt im selben Haushalt"},
  privat:{t:"Andere Privatperson",s:"Nachbarin, Freund, Bekannte, entferntere Verwandte (z. B. Nichte, Cousin)"},
  dienst:{t:"Pflegedienst oder Betreuungsdienst",s:"stellt eine Rechnung"},
  heim:{t:"Kurzzeitpflege im Heim",s:"vorübergehend in einer Einrichtung"},
};
function vhpTage(){const a=parseIso(S.vhp.von), b=parseIso(S.vhp.bis)||a; return a&&b&&b>=a?Math.round((b-a)/864e5)+1:0}
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
  ask:()=>`beantrage ich hiermit die Kostenübernahme für zum Verbrauch bestimmte Pflegehilfsmittel nach § 40 Abs. 2 SGB XI (z. B. Einmalhandschuhe, Desinfektion, Bettschutzeinlagen) bis zur Höhe von 42 Euro monatlich. Die Versorgung soll erfolgen durch: ${av("verbrauch","anbieter","Anbieter")}.`},
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
  const qs=[...(w.pq||[]).map(personQ), ...(b.q||[]).filter(q=>!q.show||q.show())];
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
      ${e.grad>=1&&(!aktuell||e.grad>aktuell)?`<p class="notice good">${ic("check")}<span>${aktuell?`Das wäre höher als der jetzige Pflegegrad ${aktuell}. Ein Antrag auf Höherstufung kann sich lohnen.`:"Ein Antrag auf einen Pflegegrad kann sich lohnen. Ab Pflegegrad 1 gibt es schon 131 € im Monat Entlastungsbetrag und mehr."}</span></p>`:""}
      <div class="btnrow big">${hat?(e.grad>=1&&(!aktuell||e.grad>aktuell)?`<button class="btn" type="button" data-act="r-antrag">${aktuell?"Höherstufung beantragen":"Pflegegrad beantragen"}</button>`:"")
        :`<button class="btn" type="button" data-act="r-konto">Antrag vorbereiten (kostenlos)</button>`}
        <button class="btn ghost" type="button" data-act="r-neu">Noch einmal</button></div>
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


/* ---------- Anbieter vor Ort finden ---------- */
const LOTSE="https://www.pflegelotse.de/";
const FINDER={
 tagespflege:[["Tagespflege in der Nähe","Tagespflege"],["Pflegelotse der Ersatzkassen (mit Preisen)",LOTSE]],
 entlastung:[["Anerkannte Alltagshilfen (AOK-Pflegenavigator, für alle nutzbar)","https://www.aok.de/pk/cl/uni/pflege/pflegenavigator/unterstuetzungsangebote/"],["Nachbarschaftshilfe in der Nähe","Nachbarschaftshilfe"],["Alltagsbegleitung in der Nähe","Alltagsbegleitung Senioren"]],
 sachleistung:[["Pflegedienste in der Nähe","ambulanter Pflegedienst"],["Pflegelotse der Ersatzkassen (mit Preisen)",LOTSE]],
 jahresbetrag:[["Kurzzeitpflege in der Nähe","Kurzzeitpflege"],["Pflegelotse der Ersatzkassen",LOTSE]],
 verbrauch:[["Sanitätshaus in der Nähe","Sanitätshaus"],["Apotheke in der Nähe","Apotheke"]],
 technisch:[["Sanitätshaus in der Nähe","Sanitätshaus"],["Hausnotruf-Anbieter in der Nähe","Hausnotruf"]],
 wohnumfeld:[["Wohnberatung in der Nähe","Wohnberatung barrierefrei"]],
 beratung:[["Pflegestützpunkt in der Nähe","Pflegestützpunkt"],["Beratungsstellen-Suche des ZQP","https://www.zqp.de/beratung-pflege/"]],
 stationaer:[["Pflegeheime vergleichen (Pflegelotse)",LOTSE]],
 pflegekurs:[["Pflegekurse in der Nähe","Pflegekurs Angehörige"]],
};
function plz(){ const m=String(S.person.ort||"").match(/\b\d{5}\b/); return m?m[0]:(S.plz||"") }
function finderHTML(k){
  const L=FINDER[k]; if(!L) return "";
  const p=plz();
  return `<div><h4>In der Nähe finden</h4>
    ${p?"":`<div class="field" style="max-width:220px;margin-bottom:8px"><label for="plz-${k}">Deine Postleitzahl</label><input type="text" inputmode="numeric" id="plz-${k}" data-plz="1" maxlength="5" placeholder="z. B. 70173"></div>`}
    <div class="btnrow">${L.map(([t,q])=>{const url=/^https?:/.test(q)?q:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q+" "+(p||""))}`;return `<a class="btn small soft" href="${url}" target="_blank" rel="noopener">${esc(t)}</a>`}).join("")}</div>
    <p class="small muted">Neutral: Wir bekommen für diese Links kein Geld. Bei Anrufen „im Auftrag der Pflegekasse“ bitte vorsichtig sein.</p></div>`;
}


/* ---------- Sprachen: Oberfläche, Fragebogen und Rechner übersetzt; Anträge bleiben Deutsch ---------- */
const LANGS=[["de","Deutsch"],["tr","Türkçe"],["ru","Русский"],["ar","العربية"],["ti","ትግርኛ"]];
// Reihenfolge je Eintrag: Türkisch, Russisch, Arabisch, Tigrinya
const T={
"Willkommen":["Hoş geldiniz","Добро пожаловать","مرحبًا","እንቋዕ ብደሓን መጻእኩም"],
"Melde dich an, um deine Angaben und Belege zu sehen.":["Bilgilerinizi ve belgelerinizi görmek için giriş yapın.","Войдите, чтобы увидеть свои данные и документы.","سجّل الدخول لرؤية بياناتك ومستنداتك.","ሓበሬታኹምን ሰነዳትኩምን ንምርኣይ እተዉ።"],
"Mit Google anmelden":["Google ile giriş yap","Войти через Google","تسجيل الدخول عبر Google","ብGoogle እተዉ"],
"oder mit E-Mail":["veya e-posta ile","или по эл. почте","أو بالبريد الإلكتروني","ወይ ብኢመይል"],
"E-Mail-Adresse":["E-posta adresi","Адрес эл. почты","البريد الإلكتروني","ኣድራሻ ኢመይል"],
"Passwort":["Şifre","Пароль","كلمة المرور","መሕለፊ ቃል"],
"Anmelden":["Giriş yap","Войти","تسجيل الدخول","እቶ"],
"Konto anlegen":["Hesap oluştur","Создать аккаунт","إنشاء حساب","ሕሳብ ክፈት"],
"Neu hier? Konto anlegen":["Yeni misiniz? Hesap oluşturun","Впервые здесь? Создайте аккаунт","جديد هنا؟ أنشئ حسابًا","ሓዱሽ ዲኹም? ሕሳብ ክፈቱ"],
"Passwort vergessen?":["Şifrenizi mi unuttunuz?","Забыли пароль?","نسيت كلمة المرور؟","መሕለፊ ቃል ረሲዕኩም?"],
"Ich habe schon ein Konto":["Zaten hesabım var","У меня уже есть аккаунт","لدي حساب بالفعل","ሕሳብ ኣሎኒ"],
"Ohne Konto ausprobieren":["Hesapsız deneyin","Попробовать без аккаунта","جرّب بدون حساب","ብዘይ ሕሳብ ፈትኑ"],
"Zeigen":["Göster","Показать","إظهار","ኣርኢ"],
"Abmelden":["Çıkış","Выйти","تسجيل الخروج","ውጻእ"],
"Ansprüche":["Haklar","Права","الاستحقاقات","መሰላት"],
"Belege":["Belgeler","Документы","الإيصالات","ሰነዳት"],
"Termine":["Tarihler","Сроки","المواعيد","ቆጸራታት"],
"Noch offen an Geld und Budgets pro Jahr":["Yıllık henüz kullanılmayan para ve bütçe","Ещё не использовано денег и бюджетов в год","مبالغ وميزانيات غير مستخدمة سنويًا","ኣብ ዓመት ዘይተጠቐምኩምሉ ገንዘብን በጀትን"],
"offene Punkte":["açık konu","открытых пунктов","بنود مفتوحة","ክፉት ነጥብታት"],
"Angaben ändern":["Bilgileri değiştir","Изменить данные","تعديل البيانات","ሓበሬታ ቀይር"],
"Welche Hilfen stehen dir noch zu?":["Hangi yardımlara hâlâ hakkınız var?","На какую помощь вы ещё имеете право?","ما المساعدات التي لا تزال تستحقها؟","ኣየኖት ሓገዛት ገና ይግብኡኹም?"],
"Viele Familien nutzen nur das Pflegegeld. Dabei sind oft mehrere tausend Euro im Jahr zusätzlich drin, etwa für Haushaltshilfe, Ersatzpflege oder Hilfsmittel.":["Birçok aile yalnızca bakım parasını kullanıyor. Oysa ev yardımı, yedek bakım veya yardımcı araçlar için yılda birkaç bin euro daha mümkün.","Многие семьи получают только пособие по уходу. А ведь часто можно получить ещё несколько тысяч евро в год — на помощь по дому, замену ухаживающего или вспомогательные средства.","كثير من العائلات تستخدم بدل الرعاية فقط، مع أنه يمكن غالبًا الحصول على عدة آلاف يورو إضافية سنويًا للمساعدة المنزلية أو الرعاية البديلة أو الوسائل المساعدة.","ብዙሓት ስድራቤታት ገንዘብ ክንክን ጥራይ ይወስዱ። ግን ንሓገዝ ገዛ፡ ተክኢ ክንክን ወይ መሳርሒታት ብዙሕ ኣሽሓት ዩሮ ተወሳኺ ይርከብ።"],
"Ein paar Fragen, etwa 3 Minuten. Danach siehst du deine offenen Ansprüche mit fertigen Anträgen.":["Birkaç soru, yaklaşık 3 dakika. Ardından hazır başvurularla açık haklarınızı görürsünüz.","Несколько вопросов, около 3 минут. Затем вы увидите свои права и готовые заявления.","بضعة أسئلة، حوالي 3 دقائق. بعدها ترى استحقاقاتك مع طلبات جاهزة.","ቁሩብ ሕቶታት፡ ኣስታት 3 ደቒቕ። ድሕሪኡ መሰላትኩምን ድሉዋት መመልከቲታትን ትርእዩ።"],
"Für wen nutzt du die App?":["Uygulamayı kimin için kullanıyorsunuz?","Для кого вы используете приложение?","لمن تستخدم التطبيق؟","ነመን ኢኹም እዚ ኣፕ ትጥቀሙ?"],
"Für mich selbst":["Kendim için","Для себя","لنفسي","ንርእሰይ"],
"ich bin pflegebedürftig oder schwerbehindert":["bakıma muhtacım veya ağır engelliyim","мне нужен уход или у меня инвалидность","أحتاج رعاية أو لدي إعاقة شديدة","ክንክን የድልየኒ ወይ ከቢድ ስንክልና ኣለኒ"],
"Für eine angehörige Person":["Bir yakınım için","Для родственника","لأحد أقاربي","ንሓደ ቤተሰብ"],
"ich pflege oder kümmere mich":["bakıyorum veya ilgileniyorum","я ухаживаю или забочусь","أقوم بالرعاية أو الاهتمام","ኣነ እየ ዝከናኸን"],
"Worum geht es?":["Konu nedir?","О чём идёт речь?","ما الموضوع؟","ብዛዕባ እንታይ እዩ?"],
"Beides ist möglich.":["İkisi de mümkün.","Можно выбрать оба.","يمكن اختيار الاثنين.","ክልቲኡ ይከኣል።"],
"Pflegegrad / Pflegebedürftigkeit":["Bakım derecesi / bakım ihtiyacı","Степень ухода / потребность в уходе","درجة الرعاية / الحاجة للرعاية","ደረጃ ክንክን"],
"Schwerbehinderung / GdB":["Ağır engellilik / engel derecesi","Инвалидность / степень инвалидности","إعاقة شديدة / درجة الإعاقة","ከቢድ ስንክልና"],
"Los geht's":["Başlayalım","Начать","ابدأ","ንጀምር"],
"Weiter":["İleri","Далее","التالي","ቀጽል"],
"Zurück":["Geri","Назад","رجوع","ተመለስ"],
"Weiß ich nicht":["Bilmiyorum","Не знаю","لا أعرف","ኣይፈልጥን"],
"Speichern":["Kaydet","Сохранить","حفظ","ኣቐምጥ"],
"Abbrechen":["İptal","Отмена","إلغاء","ሰርዝ"],
"Schließen":["Kapat","Закрыть","إغلاق","ዕጸው"],
"← Schließen":["← Kapat","← Закрыть","← إغلاق","← ዕጸው"],
"← Zur Übersicht":["← Genel bakış","← К обзору","← إلى النظرة العامة","← ናብ ሓፈሻዊ"],
"Ergebnis anzeigen":["Sonucu göster","Показать результат","عرض النتيجة","ውጽኢት ኣርኢ"],
"Pflegegrad und Wohnsituation":["Bakım derecesi ve yaşam durumu","Степень ухода и условия проживания","درجة الرعاية وظروف السكن","ደረጃ ክንክንን ኩነታት መንበሪን"],
"Welcher Pflegegrad ist festgestellt?":["Hangi bakım derecesi belirlendi?","Какая степень ухода установлена?","ما درجة الرعاية المحددة؟","ኣየናይ ደረጃ ክንክን ተወሲኑ?"],
"Noch keiner":["Henüz yok","Ещё нет","لا يوجد بعد","ገና የለን"],
"oder Antrag läuft":["veya başvuru sürüyor","или заявление на рассмотрении","أو الطلب قيد المعالجة","ወይ መመልከቲ ኣብ መስርሕ"],
"Wo und wie wird gepflegt?":["Bakım nerede ve nasıl yapılıyor?","Где и как осуществляется уход?","أين وكيف تتم الرعاية؟","ክንክን ኣበይን ከመይን ይግበር?"],
"Bei welcher Krankenkasse bist du versichert?":["Hangi sağlık sigortasındasınız?","В какой больничной кассе вы застрахованы?","ما هو صندوق التأمين الصحي الخاص بك؟","ኣብ ኣየናይ ናይ ሕክምና መድሕን ኢኹም?"],
"Bei welcher Krankenkasse ist die Person versichert?":["Kişi hangi sağlık sigortasında?","В какой больничной кассе застрахован человек?","ما هو صندوق التأمين الصحي للشخص؟","እቲ ሰብ ኣብ ኣየናይ መድሕን እዩ?"],
"Die Pflegekasse gehört immer zur Krankenkasse. Dorthin gehen die Anträge.":["Bakım sigortası her zaman sağlık sigortasına bağlıdır. Başvurular oraya gider.","Касса по уходу всегда относится к больничной кассе. Туда направляются заявления.","صندوق الرعاية تابع دائمًا لصندوق التأمين الصحي. إليه تُرسل الطلبات.","መድሕን ክንክን ኩሉ ግዜ ምስ መድሕን ሕክምና እዩ። መመልከቲታት ናብኡ ይኸዱ።"],
"Wer pflegt im Alltag?":["Günlük bakımı kim yapıyor?","Кто ухаживает в повседневной жизни?","من يقدّم الرعاية يوميًا؟","መዓልታዊ መን ይከናኸን?"],
"Ja":["Evet","Да","نعم","እወ"],
"Nein":["Hayır","Нет","لا","ኣይፋል"],
"Weiß nicht":["Bilmiyorum","Не знаю","لا أعرف","ኣይፈልጥን"],
"Schwerbehinderung":["Ağır engellilik","Инвалидность","الإعاقة الشديدة","ከቢድ ስንክልና"],
"Was bekommt ihr schon?":["Şu an neler alıyorsunuz?","Что вы уже получаете?","ماذا تحصلون عليه بالفعل؟","ሕጂ እንታይ ትረኽቡ?"],
"Was bekommst du schon?":["Şu an neler alıyorsunuz?","Что вы уже получаете?","ماذا تحصل عليه بالفعل؟","ሕጂ እንታይ ትረኽብ?"],
"Angaben für die Anträge":["Başvurular için bilgiler","Данные для заявлений","بيانات للطلبات","ሓበሬታ ንመመልከቲታት"],
"Vor- und Nachname":["Ad ve soyad","Имя и фамилия","الاسم الكامل","ሽምን ስም ኣቦን"],
"Geburtsdatum":["Doğum tarihi","Дата рождения","تاريخ الميلاد","ዕለተ ልደት"],
"Versichertennummer":["Sigorta numarası","Номер страховки","رقم التأمين","ቁጽሪ መድሕን"],
"Deine offenen Ansprüche":["Açık haklarınız","Ваши открытые права","استحقاقاتك المفتوحة","ክፉታት መሰላትኩም"],
"Antippen für Antrag und Checkliste":["Başvuru ve kontrol listesi için dokunun","Нажмите для заявления и списка","اضغط للطلب وقائمة التحقق","ንመመልከቲ ጠውቑ"],
"Antrag ausfüllen":["Başvuruyu doldur","Заполнить заявление","املأ الطلب","መመልከቲ ምላእ"],
"So läuft es ab":["Nasıl işliyor","Как это происходит","كيف تسير الأمور","ከመይ ይኸይድ"],
"Diese Unterlagen brauchst du":["Gerekli belgeler","Нужные документы","المستندات المطلوبة","ዘድልዩ ሰነዳት"],
"In der Nähe finden":["Yakında bul","Найти поблизости","ابحث بالقرب منك","ኣብ ቀረባ ድለ"],
"Dein Antrag ist fertig":["Başvurunuz hazır","Ваше заявление готово","طلبك جاهز","መመልከቲኹም ድሉው እዩ"],
"Stimmt alles?":["Her şey doğru mu?","Всё верно?","هل كل شيء صحيح؟","ኩሉ ቅኑዕ ድዩ?"],
"Antrag erstellen":["Başvuru oluştur","Создать заявление","إنشاء الطلب","መመልከቲ ፍጠር"],
"Ändern":["Değiştir","Изменить","تعديل","ቀይር"],
"Als PDF speichern":["PDF olarak kaydet","Сохранить как PDF","حفظ كملف PDF","ከም PDF ኣቐምጥ"],
"Text kopieren":["Metni kopyala","Скопировать текст","نسخ النص","ጽሑፍ ቅዳሕ"],
"So schickst du ihn ab":["Nasıl gönderilir","Как отправить","كيفية الإرسال","ከመይ ትሰዶ"],
"Ich habe den Antrag abgeschickt":["Başvuruyu gönderdim","Я отправил(а) заявление","لقد أرسلت الطلب","መመልከቲ ሰዲደ"],
"Bescheid oder Gutachten bekommen?":["Karar veya bilirkişi raporu mu aldınız?","Получили решение или заключение?","هل وصلك قرار أو تقرير؟","ውሳነ ወይ ጸብጻብ መጺኡኩም?"],
"Foto machen":["Fotoğraf çek","Сфотографировать","التقط صورة","ስእሊ ኣልዕል"],
"Abtippen":["Elle gir","Ввести вручную","إدخال يدوي","ብኢድ ጽሓፍ"],
"Pflegegrad selbst einschätzen":["Bakım derecesini kendiniz tahmin edin","Оценить степень ухода самостоятельно","قدّر درجة الرعاية بنفسك","ደረጃ ክንክን ባዕልኹም ገምግሙ"],
"Entlastungsbetrag":["Rahatlatma tutarı","Сумма разгрузки","مبلغ التخفيف","ናይ ምፍኳስ ገንዘብ"],
"jetzt frei":["şu an kullanılabilir","доступно сейчас","متاح الآن","ሕጂ ዘሎ"],
"Rechnung erfassen":["Fatura ekle","Добавить счёт","أضف فاتورة","ፋክቱራ ኣእቱ"],
"Erstattung beantragen":["İade talep et","Запросить возмещение","اطلب الاسترداد","ምምላስ ሕተት"],
"Foto aufnehmen":["Fotoğraf çek","Сделать фото","التقط صورة","ስእሊ ኣልዕል"],
"Datei wählen":["Dosya seç","Выбрать файл","اختر ملفًا","ፋይል ምረጽ"],
"Ohne Foto erfassen":["Fotoğrafsız ekle","Добавить без фото","أضف بدون صورة","ብዘይ ስእሊ ኣእቱ"],
"Bearbeiten":["Düzenle","Изменить","تعديل","ኣመሓይሽ"],
"Löschen":["Sil","Удалить","حذف","ሰርዝ"],
"Beleg speichern":["Belgeyi kaydet","Сохранить документ","حفظ الإيصال","ሰነድ ኣቐምጥ"],
"Fristen und Erinnerungen":["Süreler ve hatırlatmalar","Сроки и напоминания","المواعيد والتذكيرات","ግዜ ገደባትን መዘኻኸሪታትን"],
"Erinnerungen per E-Mail":["E-posta ile hatırlatmalar","Напоминания по эл. почте","تذكيرات بالبريد الإلكتروني","መዘኻኸሪ ብኢመይል"],
"Einschalten":["Aç","Включить","تشغيل","ኣወልዕ"],
"Ausschalten":["Kapat","Выключить","إيقاف","ኣጥፍእ"],
"Beratungsbesuch":["Danışma ziyareti","Консультационный визит","زيارة استشارية","ናይ ምኽሪ በጻሕ"],
"Eigene Erinnerung":["Kendi hatırlatman","Своё напоминание","تذكير خاص","ናይ ገዛእ ርእስኻ መዘኻኸሪ"],
"Hinzufügen":["Ekle","Добавить","إضافة","ወስኽ"],
"Für wen?":["Kimin için?","Для кого?","لمن؟","ንመን?"],
"Weitere Person anlegen":["Başka kişi ekle","Добавить человека","أضف شخصًا آخر","ካልእ ሰብ ወስኽ"],
"Gemeinsam pflegen":["Birlikte bakım","Ухаживать вместе","الرعاية معًا","ብሓባር ምክንካን"],
"Jemanden einladen":["Birini davet et","Пригласить","ادعُ شخصًا","ሓደ ሰብ ዕደም"],
"Link kopieren":["Bağlantıyı kopyala","Скопировать ссылку","نسخ الرابط","ሊንክ ቅዳሕ"],
"Pflegegrad-Rechner":["Bakım derecesi hesaplayıcı","Калькулятор степени ухода","حاسبة درجة الرعاية","መቑጸሪ ደረጃ ክንክን"],
"Selbstständig":["Bağımsız","Самостоятельно","مستقل","ብርእሱ"],
"schafft es allein":["tek başına yapabiliyor","справляется сам(а)","يستطيع وحده","በይኑ ይኽእል"],
"Überwiegend selbstständig":["Çoğunlukla bağımsız","В основном самостоятельно","مستقل في الغالب","ብዙሕ ግዜ ብርእሱ"],
"braucht ab und zu etwas Hilfe":["ara sıra biraz yardım gerekiyor","иногда нужна небольшая помощь","يحتاج أحيانًا لبعض المساعدة","ሓደሓደ ግዜ ሓገዝ የድልዮ"],
"Überwiegend unselbstständig":["Çoğunlukla bağımlı","В основном несамостоятельно","معتمد في الغالب","ብዙሕ ግዜ ሓገዝ የድልዮ"],
"schafft nur einen kleinen Teil allein":["sadece küçük bir kısmını yapabiliyor","справляется лишь с малой частью","يستطيع جزءًا صغيرًا فقط","ንእሽቶ ክፋል ጥራይ ይኽእል"],
"Unselbstständig":["Bağımlı","Несамостоятельно","غير مستقل","ብርእሱ ኣይኽእልን"],
"schafft es nicht allein":["tek başına yapamıyor","не справляется сам(а)","لا يستطيع وحده","በይኑ ኣይኽእልን"],
"Ja, ohne Probleme":["Evet, sorunsuz","Да, без проблем","نعم، بدون مشاكل","እወ፡ ብዘይ ጸገም"],
"Meistens":["Çoğunlukla","Обычно","غالبًا","መብዛሕትኡ ግዜ"],
"Nur selten":["Nadiren","Редко","نادرًا","ሳሕቲ"],
"Nein, gar nicht":["Hayır, hiç","Нет, совсем нет","لا، إطلاقًا","ኣይፋል፡ ፈጺሙ"],
"Nie":["Hiç","Никогда","أبدًا","ፈጺሙ"],
"Selten":["Nadiren","Редко","نادرًا","ሳሕቲ"],
"Oft":["Sık","Часто","كثيرًا","ብዙሕ ግዜ"],
"Täglich":["Her gün","Ежедневно","يوميًا","መዓልታዊ"],
"Im Bett die Lage wechseln (umdrehen, aufsetzen)":["Yatakta pozisyon değiştirmek (dönmek, oturmak)","Менять положение в кровати (повернуться, сесть)","تغيير الوضعية في السرير (التقلب، الجلوس)","ኣብ ዓራት ኣቀማምጣ ምቕያር"],
"Sicher sitzen, ohne zur Seite zu kippen":["Yana devrilmeden güvenle oturmak","Устойчиво сидеть, не заваливаясь","الجلوس بثبات دون الميل","ብዘይ ምውዳቕ ብድሕነት ምቕማጥ"],
"Aufstehen vom Stuhl oder Bett und sich umsetzen":["Sandalyeden veya yataktan kalkmak","Вставать со стула или кровати и пересаживаться","النهوض من الكرسي أو السرير والانتقال","ካብ መንበር ወይ ዓራት ምትሳእ"],
"In der Wohnung von Raum zu Raum gehen":["Evde odadan odaya yürümek","Передвигаться по квартире из комнаты в комнату","التنقل في البيت من غرفة لأخرى","ኣብ ገዛ ካብ ክፍሊ ናብ ክፍሊ ምኻድ"],
"Treppen steigen":["Merdiven çıkmak","Подниматься по лестнице","صعود الدرج","ደረጃ ምድያብ"],
"Erkennt vertraute Personen aus dem Umfeld":["Tanıdık kişileri tanıyor","Узнаёт знакомых людей","يتعرّف على الأشخاص المألوفين","ፍሉጣት ሰባት ይፈልጥ"],
"Weiß, welcher Tag und welche Tageszeit ist":["Hangi gün ve saat olduğunu biliyor","Знает, какой день и время суток","يعرف اليوم ووقت النهار","መዓልትን ሰዓትን ይፈልጥ"],
"Trifft Entscheidungen im Alltag (z. B. was anziehen)":["Günlük kararlar veriyor (ör. ne giyeceği)","Принимает повседневные решения (напр., что надеть)","يتخذ قرارات يومية (مثل ماذا يلبس)","መዓልታዊ ውሳነታት ይገብር"],
"Kann einem Gespräch folgen und es verstehen":["Bir konuşmayı takip edip anlayabiliyor","Может следить за разговором и понимать его","يستطيع متابعة الحديث وفهمه","ዘረባ ክከታተልን ክርድእን ይኽእል"],
"Ist nachts unruhig, läuft umher oder ruft":["Geceleri huzursuz, dolaşıyor veya bağırıyor","Ночью беспокоен, бродит или зовёт","مضطرب ليلًا، يتجول أو ينادي","ለይቲ ዘይህዱእ፡ ይዘውር ወይ ይጸዊዕ"],
"Wehrt sich gegen Pflege oder Hilfe":["Bakıma veya yardıma karşı çıkıyor","Сопротивляется уходу или помощи","يرفض الرعاية أو المساعدة","ክንክን ወይ ሓገዝ ይነጽግ"],
"Hat starke Ängste oder ist sehr niedergeschlagen":["Güçlü korkuları var veya çok üzgün","Сильные страхи или подавленность","لديه مخاوف شديدة أو حزن شديد","ብርቱዕ ፍርሒ ወይ ጓሂ ኣለዎ"],
"Oberkörper waschen":["Üst bedeni yıkamak","Мыть верхнюю часть тела","غسل الجزء العلوي من الجسم","ላዕለዋይ ኣካል ምሕጻብ"],
"Duschen oder baden (inkl. Haare waschen)":["Duş veya banyo (saç yıkama dahil)","Принимать душ или ванну (вкл. мытьё головы)","الاستحمام (مع غسل الشعر)","ሻወር ወይ ምሕጻብ (ጸጉሪ ምሕጻብ ሓዊሱ)"],
"Oberkörper an- und auskleiden":["Üst bedeni giydirmek/soymak","Одевать и раздевать верх тела","لبس وخلع ملابس الجزء العلوي","ላዕለዋይ ክዳን ምኽዳንን ምውጻእን"],
"Unterkörper an- und auskleiden (Hose, Socken, Schuhe)":["Alt bedeni giydirmek (pantolon, çorap, ayakkabı)","Одевать низ (брюки, носки, обувь)","لبس الجزء السفلي (بنطال، جوارب، أحذية)","ታሕተዋይ ክዳን (ስረ፡ ካልሲ፡ ጫማ)"],
"Essen (mundgerecht zubereitetes Essen zum Mund führen)":["Yemek yemek (hazırlanmış yemeği ağza götürmek)","Есть (подносить подготовленную еду ко рту)","الأكل (إيصال الطعام المحضّر إلى الفم)","ምብላዕ"],
"Trinken (genug und selbstständig)":["İçmek (yeterli ve bağımsız)","Пить (достаточно и самостоятельно)","الشرب (بكمية كافية وبشكل مستقل)","ምስታይ (እኹል ብርእሱ)"],
"Toilette benutzen":["Tuvaleti kullanmak","Пользоваться туалетом","استخدام المرحاض","ሽቓቕ ምጥቃም"],
"Wie oft wird Hilfe bei Medikamenten, Spritzen, Verbänden oder Messungen gebraucht?":["İlaç, iğne, pansuman veya ölçümlerde ne sıklıkla yardım gerekiyor?","Как часто нужна помощь с лекарствами, уколами, перевязками или измерениями?","كم مرة يحتاج المساعدة في الأدوية أو الحقن أو الضمادات أو القياسات؟","ኣብ መድሃኒት፡ መርፍእ ወይ መለክዒ ክንደይ ግዜ ሓገዝ የድሊ?"],
"Wie oft muss jemand zu Arzt- oder Therapieterminen begleiten?":["Doktor veya terapi randevularına ne sıklıkla eşlik etmek gerekiyor?","Как часто нужно сопровождать к врачу или на терапию?","كم مرة يحتاج مرافقة إلى الطبيب أو العلاج؟","ናብ ሓኪም ክንደይ ግዜ ምስ ሰብ ክኸይድ የድልዮ?"],
"Nie oder selten":["Hiç veya nadiren","Никогда или редко","أبدًا أو نادرًا","ፈጺሙ ወይ ሳሕቲ"],
"Wöchentlich":["Haftalık","Еженедельно","أسبوعيًا","ሰሙናዊ"],
"Mehrmals täglich":["Günde birkaç kez","Несколько раз в день","عدة مرات يوميًا","ኣብ መዓልቲ ብዙሕ ግዜ"],
"Etwa einmal im Monat":["Ayda yaklaşık bir kez","Примерно раз в месяц","مرة في الشهر تقريبًا","ኣብ ወርሒ ሓደ ግዜ"],
"Jede Woche":["Her hafta","Каждую неделю","كل أسبوع","ኩሉ ሰሙን"],
"Den Tag einteilen und sich an Abläufe halten":["Günü planlamak ve düzene uymak","Планировать день и соблюдать распорядок","تنظيم اليوم والالتزام بالروتين","መዓልቲ ምውዳብ"],
"Sich sinnvoll beschäftigen":["Anlamlı şekilde meşgul olmak","Занимать себя полезными делами","الانشغال بشكل مفيد","ብጠቓሚ ነገር ምትሓዝ"],
"Kontakt zu Familie, Nachbarn, Freunden halten":["Aile, komşu ve arkadaşlarla iletişim","Поддерживать контакт с семьёй, соседями, друзьями","التواصل مع العائلة والجيران والأصدقاء","ምስ ስድራ፡ ጎረባብቲ፡ ኣዕሩኽ ርክብ"],
"Noch einmal":["Tekrar","Ещё раз","مرة أخرى","ደጊምካ"],
"Pflegegrad beantragen":["Bakım derecesi başvurusu","Подать заявление на степень ухода","التقدم بطلب درجة رعاية","ደረጃ ክንክን ሕተት"],
"Höherstufung beantragen":["Daha yüksek derece başvurusu","Подать на повышение степени","طلب رفع الدرجة","ልዕል ዝበለ ደረጃ ሕተት"],
"Antrag vorbereiten (kostenlos)":["Başvuruyu hazırla (ücretsiz)","Подготовить заявление (бесплатно)","تحضير الطلب (مجانًا)","መመልከቲ ኣዳሉ (ብነጻ)"],
"Ein Widerspruch kann sich lohnen.":["İtiraz etmek faydalı olabilir.","Возражение может иметь смысл.","قد يكون الاعتراض مجديًا.","ተቓውሞ ጠቓሚ ክኸውን ይኽእል።"],
"Widerspruch schreiben":["İtiraz yaz","Написать возражение","اكتب اعتراضًا","ተቓውሞ ጽሓፍ"],
"Meine Daten endgültig löschen":["Verilerimi kalıcı olarak sil","Окончательно удалить мои данные","حذف بياناتي نهائيًا","ሓበሬታይ ብቐጻሊ ሰርዝ"],
};
let LANG="de"; try{ LANG=JSON.parse(localStorage.getItem("da-lang")||'"de"')||"de" }catch(e){}
const LIDX={tr:0,ru:1,ar:2,ti:3};
const RX=[
 [/^Frage (\d+) von (\d+)$/,["Soru $1 / $2","Вопрос $1 из $2","السؤال $1 من $2","ሕቶ $1 ካብ $2"]],
 [/^Schritt (\d+) von (\d+)$/,["Adım $1 / $2","Шаг $1 из $2","الخطوة $1 من $2","ስጉምቲ $1 ካብ $2"]],
 [/^Voraussichtlich Pflegegrad (\d)$/,["Tahmini bakım derecesi $1","Предположительно степень ухода $1","على الأرجح درجة الرعاية $1","ተኽእሎ ደረጃ ክንክን $1"]],
 [/^Pflegegrad (\d)$/,["Bakım derecesi $1","Степень ухода $1","درجة الرعاية $1","ደረጃ ክንክን $1"]],
];
function tr(s){
  if(LANG==="de"||!s) return s;
  const i=LIDX[LANG]; const k=s.trim(); if(!k) return s;
  let out=T[k]&&T[k][i];
  if(!out){ for(const [re,arr] of RX){ if(re.test(k)){ out=k.replace(re,arr[i]); break } } }
  return out? s.replace(k,out) : s;
}
function applyI18n(root){
  document.documentElement.lang=LANG; document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
  if(LANG==="de"||!root) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode&&/^(SCRIPT|STYLE|TEXTAREA|CODE)$/.test(n.parentNode.nodeName)||n.parentNode.closest&&n.parentNode.closest(".paper")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  for(const n of nodes){ const v=n.nodeValue; const t=tr(v); if(t!==v) n.nodeValue=t }
}
function langSelect(){
  return `<select class="langsel" id="langsel" aria-label="Sprache">${LANGS.map(([k,n])=>`<option value="${k}" ${LANG===k?"selected":""}>${n}</option>`).join("")}</select>`;
}
function langNotice(){
  if(LANG==="de") return "";
  const m={tr:"Açıklamaların bir kısmı henüz Almanca. Başvurular her zaman Almanca kalır, çünkü kurumlar bunları Almanca istiyor.",ru:"Часть пояснений пока на немецком. Заявления всегда остаются на немецком, так как ведомствам они нужны на немецком.",ar:"بعض الشروحات لا تزال باللغة الألمانية. الطلبات تبقى دائمًا بالألمانية لأن الجهات الرسمية تطلبها كذلك.",ti:"ገለ መግለጺታት ገና ብጀርመንኛ እዮም። መመልከቲታት ኩሉ ግዜ ብጀርመንኛ እዮም፡ ምኽንያቱ ቤት ጽሕፈታት ብጀርመንኛ ይደልይዎም።"};
  return `<p class="notice info small">${ic("info")}<span>${m[LANG]}</span></p>`;
}

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

/* ---------- Rendering ---------- */
const $ = id => document.getElementById(id);
function choice(name,val,label,small,type="radio",checked=false){
  const id=`${name}-${val}`.replace(/[^a-zA-Z0-9-_]/g,"_");
  return `<label class="choice" for="${id}"><input type="${type}" id="${id}" name="${name}" value="${esc(val)}" ${checked?"checked":""}><span>${esc(label)}${small?`<small>${esc(small)}</small>`:""}</span></label>`;
}
/* ---------- Sanftes Neuzeichnen: nur geänderte Teile austauschen, Bildschirmwechsel animieren ---------- */
const RM=(()=>{ try{ return matchMedia("(prefers-reduced-motion: reduce)").matches }catch(e){ return false } })();
const IH=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
function sameNode(a,b){
  if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName) return false;
  if(a.nodeType!==1) return true;
  if(a.id||b.id) return a.id===b.id;
  if(a.nodeName==="INPUT" && a.type!==b.getAttribute("type")) return false;
  return true;
}
function morphKids(par,np){
  let o=par.firstChild, n=np.firstChild;
  while(n){
    const next=n.nextSibling;
    if(o && sameNode(o,n)){ morphNode(o,n); o=o.nextSibling }
    else {
      let m=null;
      if(n.nodeType===1 && n.id){ for(let c=o;c;c=c.nextSibling){ if(c.nodeType===1&&c.id===n.id){ m=c; break } } }
      if(m){ par.insertBefore(m,o); morphNode(m,n) } else par.insertBefore(n,o);
    }
    n=next;
  }
  while(o){ const nx=o.nextSibling; par.removeChild(o); o=nx }
}
function morphNode(a,b){
  if(a.nodeType!==1){ if(a.nodeValue!==b.nodeValue) a.nodeValue=b.nodeValue; return }
  for(const at of [...a.attributes]) if(!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for(const at of b.attributes) if(a.getAttribute(at.name)!==at.value) a.setAttribute(at.name,at.value);
  const tag=a.nodeName;
  if(tag==="INPUT"){
    if(a.type==="checkbox"||a.type==="radio") a.checked=b.hasAttribute("checked");
    else if(a.type!=="file" && document.activeElement!==a){ const v=b.getAttribute("value")||""; if(a.value!==v) a.value=v }
    return;
  }
  if(tag==="TEXTAREA"){ if(document.activeElement!==a){ const v=b.textContent; if(a.value!==v) a.value=v } return }
  morphKids(a,b);
  if(tag==="SELECT"){ const s=a.querySelector("option[selected]"); if(s) a.value=s.value; else if(a.options.length && !b.querySelector("option[selected]")) a.selectedIndex=0 }
}
function smoothEl(el){
  if(!el||el._smooth) return; el._smooth=true;
  Object.defineProperty(el,"innerHTML",{configurable:true,get(){ return IH.get.call(this) },set(html){
    const t=document.createElement("template"); IH.set.call(t,html); morphKids(this,t.content);
  }});
}
["hero","tabs","main"].forEach(id=>smoothEl(document.getElementById(id)));
const TAB_ORDER=["ansprueche","belege","termine"];
function famKey(){
  if(RECHNER) return "r";
  if(typeof USER!=="undefined" && !USER && !GUEST) return "login";
  if(typeof showPersons!=="undefined" && showPersons) return "persons";
  if(S.wiz) return "w:"+S.wiz.k;
  if(!S.done) return "q";
  return "tab:"+(typeof FALL_ID!=="undefined"?FALL_ID:"");
}
function screenIdx(){ return RECHNER?RECHNER.i : S.wiz?S.wiz.i : !S.done?S.step : TAB_ORDER.indexOf(S.tab) }
let lastFam=null, lastIdx=0, lastCash=null, figAnim=0;
function animateScreen(dir){
  if(RM) return; const m=$("main"); m.classList.remove("go-f","go-b","go-fade"); void m.offsetWidth; m.classList.add(dir);
}
function countFigure(){
  const f=document.querySelector("#hero .figure"); if(!f){ lastCash=null; return }
  const v=sums().cash; const from=lastCash; lastCash=v;
  if(from==null||from===v||RM) return;
  f.classList.remove("flash"); void f.offsetWidth; f.classList.add("flash");
  const t0=performance.now(), d=700;
  const step=now=>{ const p=Math.min(1,(now-t0)/d), e=1-Math.pow(1-p,3); f.textContent=eur(Math.round(from+(v-from)*e)); if(p<1) figAnim=requestAnimationFrame(step) };
  figAnim=requestAnimationFrame(step);
}
function reveal(el){
  if(!el) return; const r=el.getBoundingClientRect();
  if(r.top<70 || r.top>innerHeight*0.45) el.scrollIntoView({block:"start",behavior:RM?"auto":"smooth"});
}
function render(){
  const fam=famKey(), idx=screenIdx(), changed=lastFam!==null && (fam!==lastFam||idx!==lastIdx);
  if(changed){ const a=document.activeElement; if(a && a!==document.body && a.blur && !(a.closest&&a.closest("#hero"))) try{ a.blur() }catch(e){} }
  cancelAnimationFrame(figAnim);
  renderHero(); renderTabs(); renderMain(); try{ applyI18n(document.querySelector(".wrap")) }catch(e){}
  if(changed) animateScreen(fam===lastFam ? (idx>=lastIdx?"go-f":"go-b") : "go-fade");
  lastFam=fam; lastIdx=idx;
  countFigure();
}
function scrollTop(){ window.scrollTo({top:0,behavior:"instant"}) }

function sums(){
  const all=applicable(); const offen=all.filter(b=>!S.genutzt[b.k]);
  const cash=offen.filter(b=>b.cash && (S.status[b.k]||"offen")==="offen").reduce((s,b)=>s+(b.val()||0),0);
  const frei=offen.filter(b=>b.frei).reduce((s,b)=>s+b.frei(),0);
  return {all,offen,cash,frei};
}
function renderHero(){
  const save=`<div class="savestate"><span class="dot ${saveState.c}" id="savedot"></span><span id="savetxt">${esc(saveState.t)}</span></div>`;
  const brand=`<div class="brand"><span class="mark" aria-hidden="true">§</span><b>Dein Anspruch</b></div>`;
  const curF = USER && FAELLE.find(f=>f.id===FALL_ID);
  const personBtn = curF ? `<button type="button" class="acct person" data-act="persons" aria-expanded="${showPersons}">${ic("user")}${esc(fallName(curF))} ▾</button>` : "";
  const acct = USER?`<button type="button" class="acct" data-act="logout" title="${esc(USER.email||"")}">Abmelden</button>`:GUEST?`<button type="button" class="acct" data-act="guest-register">Konto anlegen</button>`:"";
  const fontsw=`<div class="fontsw" role="group" aria-label="Schriftgröße">${[["1","A"],["1.15","A+"],["1.3","A++"]].map(([v,t])=>`<button type="button" data-font="${v}" aria-pressed="${(S.font||"1")===v}" aria-label="Schrift ${t}">${t}</button>`).join("")}</div>`;
  if(S.wiz||RECHNER||(S.done&&S.tab!=="ansprueche")){ $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>`; return }
  if(!S.done){
    $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>
     <p class="lead">Pflegegrad oder Schwerbehinderung: Wir prüfen, welche Leistungen 2026 noch offen sind, schreiben die Anträge vor, sortieren deine Belege und erinnern an Fristen.</p>`;
    return;
  }
  const s=sums(); const dl=deadlines(); const crit=dl.find(x=>x.main&&!x.ok&&urg(x.d)!=="ok") || dl.find(x=>urg(x.d)==="late");
  const next=dl[0];
  $("hero").innerHTML=`<div class="row">${brand}<div class="row" style="gap:12px">${langSelect()}${personBtn}${fontsw}${save}${acct}</div></div>
   <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:4px">
     <span class="small" style="color:var(--hero-muted)">Noch offen an Geld und Budgets pro Jahr</span>
     <span class="figure">${eur(s.cash)}</span>
     ${s.frei?`<span class="small" style="color:var(--hero-muted)">plus ${eur(s.frei)} Steuerfreibeträge</span>`:""}
   </div>
   <div class="stats">
     <span class="stat">${ic("list")}<strong>${s.offen.length}</strong> offene Punkte</span>
     <span class="stat">${ic("receipt")}<strong>${BEL.length}</strong> Belege</span>
     ${crit?`<button type="button" class="stat alert" data-tab="termine" style="border:0;font:inherit;cursor:pointer">${ic("bell")}${esc(crit.t)}: ${urgTxt(crit.d)}</button>`: next?`<span class="stat">${ic("cal")}Nächste Frist ${urgTxt(next.d)}</span>`:""}
     <button type="button" class="stat" data-act="edit" style="border:0;font:inherit;color:inherit;cursor:pointer">${ic("user")}Angaben ändern</button>
   </div>`;
}
function renderTabs(){
  const t=$("tabs"); t.hidden=!S.done||!!S.wiz||!!RECHNER||(!USER&&!GUEST); if(t.hidden) return;
  const dl=deadlines(); const att=dl.filter(x=>!x.ok && urg(x.d)!=="ok").length;
  const T=[["ansprueche","Ansprüche","list",0],["belege","Belege","receipt",0],["termine","Termine","cal",att]];
  t.innerHTML=T.map(([k,l,i,b])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${ic(i)}<span class="lbl">${l}</span>${b?`<span class="badge">${b}</span>`:""}</button>`).join("");
}
function renderMain(){
  document.documentElement.style.setProperty("--fs", S.font||"1");
  if(!loaded){ $("main").innerHTML=`<section class="panel"><p class="muted">Einen Moment, deine Daten werden geladen …</p></section>`; return }
  if(RECHNER){ $("main").innerHTML=viewRechner(); return }
  if(!USER && !GUEST){ $("main").innerHTML=viewLogin(); return }
  if(USER && showPersons){ $("main").innerHTML=viewPersons(); return }
  if(S.wiz && B.find(x=>x.k===S.wiz.k)){ $("main").innerHTML=viewWizard(); return }
  S.wiz=null;
  if(!S.done){
    const vs=visSteps(); if(S.step>=vs.length) S.step=vs.length-1;
    $("main").innerHTML=VIEWS[vs[S.step].id]();
  } else {
    $("main").innerHTML = S.tab==="belege"?viewBelege(): S.tab==="termine"?viewTermine(): viewAnsprueche();
  }
}
function stepper(){
  const vs=visSteps(); const n=S.step+1;
  return `<div class="stepper"><div class="meta"><span>Schritt ${n} von ${vs.length}</span><span>${vs[S.step].label}</span></div><div class="bar"><i style="width:${Math.round(n/vs.length*100)}%"></i></div></div>`;
}
function nav(canNext=true,nextLabel="Weiter",why="Bitte beantworte zuerst die Frage oben."){
  return `<p class="notice navwarn" id="navwarn" hidden>${ic("alert")}<span>${esc(why)}</span></p><div class="nav go">${S.step>0?`<button class="btn ghost" type="button" data-act="back">Zurück</button>`:"<span></span>"}<button class="btn big" type="button" data-act="next" data-ok="${canNext?1:0}">${nextLabel}</button></div>`;
}
const VIEWS = {
 start:()=>`<section class="panel">${stepper()}
   <div class="intro">
     <h2>Welche Hilfen stehen dir noch zu?</h2>
     <p>Viele Familien nutzen nur das Pflegegeld. Dabei sind oft mehrere tausend Euro im Jahr zusätzlich drin, etwa für Haushaltshilfe, Ersatzpflege oder Hilfsmittel.</p>
     <p class="muted">Ein paar Fragen, etwa 3 Minuten. Danach siehst du deine offenen Ansprüche mit fertigen Anträgen.</p>
   </div>
   <fieldset class="q"><legend>Für wen nutzt du die App?</legend><div class="choices">
     ${choice("rolle","selbst","Für mich selbst","ich bin pflegebedürftig oder schwerbehindert","radio",S.rolle==="selbst")}
     ${choice("rolle","angehoerig","Für eine angehörige Person","ich pflege oder kümmere mich","radio",S.rolle==="angehoerig")}
   </div></fieldset>
   <fieldset class="q"><legend>Worum geht es?</legend><p class="hint">Beides ist möglich.</p><div class="choices">
     ${choice("bereich","pflege","Pflegegrad / Pflegebedürftigkeit","","checkbox",S.bereiche.pflege)}
     ${choice("bereich","sb","Schwerbehinderung / GdB","","checkbox",S.bereiche.sb)}
   </div></fieldset>
   ${nav(S.rolle && (S.bereiche.pflege||S.bereiche.sb),"Los geht's", !S.rolle?"Bitte wähle zuerst oben aus, für wen du die App nutzt.":"Bitte wähle mindestens ein Thema aus: Pflegegrad oder Schwerbehinderung.")}
 </section>`,
 kasse:()=>`<section class="panel">${stepper()}
   <h2>Bei welcher Krankenkasse ${S.rolle==="angehoerig"?"ist die Person":"bist du"} versichert?</h2>
   <p class="muted">Die Pflegekasse gehört immer zur Krankenkasse. Dorthin gehen die Anträge.</p>
   <fieldset class="q"><legend class="sr">Krankenkasse</legend><div class="choices">
     ${Object.entries(KASSEN).map(([k,v])=>choice("kasse",k,v.name,"","radio",S.kasse===k)).join("")}
   </div></fieldset>
   ${S.kasse==="aok"?`<div class="field"><label for="aokRegion">Welche AOK?</label><select id="aokRegion"><option value="">Bitte wählen</option>${AOK_REGIONEN.map(r=>`<option ${S.aokRegion===r?"selected":""}>${r}</option>`).join("")}</select></div>`:""}
   ${S.kasse==="andere"?`<div class="field"><label for="kasseAndere">Name der Kasse</label><input type="text" id="kasseAndere" value="${esc(S.kasseAndere)}" placeholder="z. B. KNAPPSCHAFT, SBK"></div>`:""}
   <p class="notice info">${ic("info")}<span>Privat versichert? Die Leistungen der Pflegepflichtversicherung sind gleich hoch, Anträge gehen dann an die private Pflegeversicherung. Wähle „Andere“.</span></p>
   ${nav(!!S.kasse && (S.kasse!=="aok"||S.aokRegion))}
 </section>`,
 pflege:()=>`<section class="panel">${stepper()}
   <h2>Pflegegrad und Wohnsituation</h2>
   <fieldset class="q"><legend>Welcher Pflegegrad ist festgestellt?</legend><div class="choices">
     ${choice("pg","0","Noch keiner","oder Antrag läuft","radio",S.pg==="0")}
     ${[1,2,3,4,5].map(n=>choice("pg",String(n),"Pflegegrad "+n,["","geringe","erhebliche","schwere","schwerste","schwerste, besondere Anforderungen"][n]+" Beeinträchtigung","radio",S.pg===String(n))).join("")}
   </div></fieldset>
   <fieldset class="q"><legend>Wo und wie wird gepflegt?</legend><div class="choices">
     ${Object.entries(WOHNEN).map(([k,v])=>choice("wohnen",k,v.t,v.s,"radio",S.wohnen===k)).join("")}
   </div></fieldset>
   ${nav(S.pg!=="" && (S.wohnen || S.pg==="0"))}
 </section>`,
 pp:()=>`<section class="panel">${stepper()}
   <h2>Wer pflegt im Alltag?</h2>
   <p class="muted">Pflegende Angehörige haben eigene Ansprüche, etwa Rentenpunkte und Freistellung vom Job.</p>
   <fieldset class="q"><legend>Pflegt eine Angehörige oder ein Angehöriger mindestens 10 Stunden pro Woche, verteilt auf mindestens 2 Tage?</legend><div class="choices">
     ${choice("stunden10","ja","Ja","","radio",S.pp.stunden10==="ja")}${choice("stunden10","nein","Nein","","radio",S.pp.stunden10==="nein")}${choice("stunden10","unklar","Weiß nicht","","radio",S.pp.stunden10==="unklar")}
   </div></fieldset>
   <fieldset class="q"><legend>Ist die pflegende Person berufstätig?</legend><div class="choices">
     ${choice("arbeit","nein","Nein / Rente","","radio",S.pp.arbeit==="nein")}${choice("arbeit","bis30","Ja, bis 30 Std./Woche","","radio",S.pp.arbeit==="bis30")}${choice("arbeit","ueber30","Ja, mehr als 30 Std./Woche","","radio",S.pp.arbeit==="ueber30")}
   </div></fieldset>
   ${nav(S.pp.stunden10 && S.pp.arbeit)}
 </section>`,
 sb:()=>`<section class="panel">${stepper()}
   <h2>Schwerbehinderung</h2>
   <fieldset class="q"><legend>Gibt es einen festgestellten Grad der Behinderung (GdB)?</legend><div class="choices">
     ${choice("sbstatus","ja","Ja, Bescheid oder Ausweis","","radio",S.sb.status==="ja")}${choice("sbstatus","beantragt","Beantragt, noch kein Bescheid","","radio",S.sb.status==="beantragt")}${choice("sbstatus","nein","Nein","","radio",S.sb.status==="nein")}
   </div></fieldset>
   ${S.sb.status==="ja"?`
   <div class="field"><label for="gdb">GdB laut Bescheid</label><select id="gdb"><option value="">Bitte wählen</option>${[20,30,40,50,60,70,80,90,100].map(g=>`<option ${String(S.sb.gdb)===String(g)?"selected":""}>${g}</option>`).join("")}</select></div>
   <fieldset class="q"><legend>Merkzeichen im Ausweis</legend><p class="hint">Stehen auf der Rückseite des Ausweises.</p><div class="choices">
     ${Object.entries(MZ).map(([k,v])=>choice("mz",k,v,"","checkbox",!!S.sb.mz[k])).join("")}
   </div></fieldset>`:""}
   <fieldset class="q"><legend>Weitere Angaben</legend><div class="choices">
     ${choice("sbx","arbeit","Berufstätig","","checkbox",S.sb.arbeit)}
     ${choice("sbx","auto","Eigenes Auto (auf die Person zugelassen)","","checkbox",S.sb.auto)}
     ${choice("sbx","grundsicherung","Bezieht Grundsicherung oder Bürgergeld","","checkbox",S.sb.grundsicherung)}
   </div></fieldset>
   ${nav(S.sb.status && (S.sb.status!=="ja"||S.sb.gdb))}
 </section>`,
 genutzt:()=>{
   const list = applicable().filter(b=>!["beratung","pg_antrag","pg_hoch","sb_antrag","sb_neu","hzp","pug"].includes(b.k));
   return `<section class="panel">${stepper()}
   <h2>Was ${S.rolle==="angehoerig"?"bekommt ihr":"bekommst du"} schon?</h2>
   <p class="muted">Kreuze an, was bereits genutzt wird. Alles andere zeigen wir als offenen Anspruch.</p>
   ${list.length?`<div class="choices">${list.map(b=>choice("genutzt",b.k,b.t,b.p,"checkbox",!!S.genutzt[b.k])).join("")}</div>`:`<p class="notice info">${ic("info")}<span>Für diese Situation gibt es noch keine laufenden Leistungen.</span></p>`}
   ${nav(true)}
 </section>`},
 daten:()=>{const p=S.person, a=S.rolle==="angehoerig";
   return `<section class="panel">${stepper()}
   <h2>Angaben für die Anträge</h2>
   <p class="muted">Damit füllen wir die Schreiben vor. Felder dürfen leer bleiben. Die Daten liegen nur in deinem privaten Bereich.</p>
   <h3>${a?"Pflegebedürftige bzw. schwerbehinderte Person":"Deine Daten"}</h3>
   <div class="grid2">
     ${fld("name","Vor- und Nachname",p.name)}${fld("geb","Geburtsdatum",p.geb,"text","TT.MM.JJJJ")}
     ${fld("vnr","Versichertennummer",p.vnr,"text","steht auf der Gesundheitskarte")}${fld("strasse","Straße, Hausnr.",p.strasse)}
     ${fld("ort","PLZ, Ort",p.ort)}${!a?fld("tel","Telefon",p.tel,"tel")+fld("mail","E-Mail",p.mail,"email"):""}
   </div>
   ${a?`<h3>Absender (du als Angehörige/r)</h3><div class="grid2">
     ${fld("absender","Dein Name",p.absender)}${fld("beziehung","Beziehung",p.beziehung,"text","z. B. Tochter, Ehemann")}
     ${fld("absStrasse","Straße, Hausnr.",p.absStrasse)}${fld("absOrt","PLZ, Ort",p.absOrt)}
     ${fld("tel","Telefon",p.tel,"tel")}${fld("mail","E-Mail",p.mail,"email")}</div>
     <p class="notice">${ic("info")}<span>Wenn du für eine andere Person Anträge stellst, braucht die Kasse eine Vollmacht oder Betreuungsurkunde. Wir setzen sie automatisch auf die Checkliste.</span></p>`:""}
   ${nav(true,"Ergebnis anzeigen")}
 </section>`},
};
function fld(k,label,v,type="text",ph=""){return `<div class="field"><label for="p-${k}">${label}</label><input type="${type}" id="p-${k}" data-p="${k}" value="${esc(v)}" placeholder="${esc(ph)}"></div>`}

/* ---------- Reiter: Ansprüche ---------- */
function viewAnsprueche(){
  const {all,offen}=sums();
  const genutzt = all.filter(b=>S.genutzt[b.k]);
  const areas=["Alle",...new Set(offen.map(b=>b.area))];
  if(!areas.includes(areaFilter)) areaFilter="Alle";
  const sorted = offen.filter(b=>areaFilter==="Alle"||b.area===areaFilter)
    .sort((a,b)=>(!!a.opt-!!b.opt) || ((b.val()||0)-(a.val()||0)) || ((b.mon?b.mon():0)-(a.mon?a.mon():0)));
  const dl=deadlines().filter(x=>!x.ok && urg(x.d)!=="ok").slice(0,2);
  return `
   ${dl.map(x=>`<p class="notice ${urg(x.d)==="late"?"bad":""}">${ic("bell")}<span><strong>${esc(x.t)}</strong> – Frist ${deD(x.d)} (${urgTxt(x.d)}). <button type="button" class="linkbtn" data-tab="termine">Zu den Terminen</button></span></p>`).join("")}
   ${!S.welcomeSeen?`<section class="panel" style="gap:12px">
     <div class="section-title"><h2>Fertig! So geht's weiter</h2><button type="button" class="linkbtn" data-act="welcome-ok">Ausblenden</button></div>
     <div class="howto">
       <button type="button" class="howbtn" data-act="welcome-ok"><b>${ic("list")}Ansprüche prüfen</b><span>Unten antippen: Anleitung, Checkliste, fertiger Antrag als Text oder PDF.</span></button>
       <button type="button" class="howbtn" data-tab="belege"><b>${ic("receipt")}Belege sammeln</b><span>Rezepte und Rechnungen fotografieren, nach Jahr sortieren, einreichen.</span></button>
       <button type="button" class="howbtn" data-tab="termine"><b>${ic("bell")}Fristen im Blick</b><span>Erinnerung an Beratungsbesuch und Abgabefristen im Kalender.</span></button>
     </div></section>`:""}
   ${(bescheidCard()||entlCard())?`<div class="minis">${bescheidCard()}${entlCard()}</div>`:""}
   ${langNotice()}
   <div class="section-title"><h2>Deine offenen Ansprüche</h2><span class="small muted">Antippen für Antrag und Checkliste</span></div>
   ${areas.length>2?`<div class="filters">${areas.map(a=>`<button type="button" class="chip" data-area="${esc(a)}" aria-pressed="${areaFilter===a}">${esc(a)}</button>`).join("")}</div>`:""}
   <div class="list">${sorted.map(itemHTML).join("") || '<p class="muted">Ihr nutzt bereits alles, was wir prüfen konnten.</p>'}</div>
   ${genutzt.length?`<details class="used"><summary>Bereits genutzt (${genutzt.length})</summary><div class="list" style="margin-top:10px">${genutzt.map(itemHTML).join("")}</div></details>`:""}
   <div class="nav"><button class="btn ghost" type="button" data-act="edit">Angaben ändern</button><button class="btn ghost" type="button" data-act="reset">Alles löschen</button></div>
   <div class="nav"><button class="btn ghost danger" type="button" data-act="wipe">Meine Daten endgültig löschen</button></div>
   <div id="wipeconfirm" hidden class="notice bad">${ic("alert")}<span>Alle Angaben, Belege und Fotos werden für immer gelöscht. Das kann nicht rückgängig gemacht werden. <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="wipe-yes">Ja, alles löschen</button><button class="btn small ghost" type="button" data-act="wipe-no">Abbrechen</button></span></span></div>
   <div id="resetconfirm" hidden class="notice bad">${ic("alert")}<span>Alle Angaben in diesem Konto löschen? Belege bleiben erhalten. <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="reset-no">Abbrechen</button></span></span></div>`;
}
function valueLabel(b){
  if(b.val && b.val()) return `<span class="val">${eur(b.val())}/Jahr</span>`;
  if(b.mon && b.mon()) return `<span class="val">bis ${eur(b.mon(), b.mon()%1?2:0)}/Mon.</span>`;
  if(b.once) return `<span class="val">bis ${eur(b.once)}</span>`;
  if(b.frei) return `<span class="val">${eur(b.frei())} Freibetrag</span>`;
  return `<span class="val neutral">${b.opt?"prüfen":"kostenlos"}</span>`;
}
let openKey=null;
function itemHTML(b){
  const st = S.status[b.k]||"offen";
  const open = openKey===b.k;
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
function docsFor(b){
  const d=[...(txt(b.docs)||[])].filter(Boolean);
  if(S.rolle==="angehoerig" && b.to!==FA && b.to!=="arbeitgeber" && !d.some(x=>/Vollmacht/.test(x))) d.push("Vollmacht oder Betreuungsurkunde");
  return d;
}
function detailHTML(b){
  const checks = docsFor(b), st=S.status[b.k]||"offen";
  const nQ=(b.q||[]).filter(q=>!q.show||q.show()).length;
  return `<div class="detail">
    ${b.ask?`<div class="startbox">
        <button class="btn big" type="button" data-wopen="${b.k}">${ic("file")}${st==="offen"?"Antrag ausfüllen":"Antrag ansehen"}</button>
        ${["pg_antrag","pg_hoch"].includes(b.k)?`<button class="btn ghost" type="button" data-act="r-start">Erst selbst einschätzen: Pflegegrad-Rechner</button>`:""}
        <p class="small muted">${nQ?`${nQ} einfache Fragen, Schritt für Schritt. Du kannst jederzeit zurück, nichts wird ohne dich abgeschickt.`:"Der Antrag ist schon fertig vorbereitet. Du musst nur noch prüfen."}</p>
      </div>`:`<p class="notice info">${ic("info")}<span>Dafür ist kein Antrag nötig. Trage den Betrag einfach in der Steuererklärung ein (oder gib diese Info an deine Steuerberatung weiter).</span></p>`}
    <div><h4>So läuft es ab</h4><ol>${b.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
    ${finderHTML(b.k)}
    ${checks.length?`<div><h4>Diese Unterlagen brauchst du</h4><ul class="checks">${checks.map((c,i)=>`<li><label><input type="checkbox" data-check="${b.k}:${i}" ${S.checks[b.k+":"+i]?"checked":""}><span>${esc(c)}</span></label></li>`).join("")}</ul></div>`:""}
    <div class="status"><label for="st-${b.k}"><strong>Stand:</strong></label><select id="st-${b.k}" data-status="${b.k}">${[["offen","noch nicht beantragt"],["beantragt","beantragt, warte auf Antwort"],["bewilligt","bewilligt"]].map(([v,t])=>`<option value="${v}" ${st===v?"selected":""}>${t}</option>`).join("")}</select>
    <label class="choice" for="gn-${b.k}" style="padding:6px 10px"><input type="checkbox" id="gn-${b.k}" data-gen="${b.k}" ${S.genutzt[b.k]?"checked":""}><span>bekommen wir schon</span></label></div>
  </div>`;
}
function today(){return new Date().toLocaleDateString("de-DE")}
function letter(b){
  const p=S.person, a=S.rolle==="angehoerig";
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
function curLetter(b){const L=letter(b);return {subject:S.texte[b.k+"_sub"]??L.subject, body:S.texte[b.k]??L.body}}
function mailto(b,addr){const L=curLetter(b);return `mailto:${addr}?subject=${encodeURIComponent(L.subject)}&body=${encodeURIComponent(L.body)}`}

/* ---------- Reiter: Belege ---------- */
function belegYears(){ const y=new Date().getFullYear(); const ys=new Set([y,y-1,y-2,y-3].map(String)); BEL.forEach(b=>b.jahr&&ys.add(String(b.jahr))); return [...ys].sort().reverse() }
function viewBelege(){
  const years=selYears(); const kf=S.belegFilter.kat||"";
  const inYears=BEL.filter(b=>years.includes(String(b.jahr)));
  const shown=inYears.filter(b=>!kf||b.kat===kf).sort((a,b)=>(b.datum||"").localeCompare(a.datum||""));
  const canFiles=!!ASSETS;
  const label = years.length===1?years[0]:years.slice().reverse().join(", ");
  const byYear={}; for(const b of shown){ const y=String(b.jahr); (byYear[y]=byYear[y]||{}); (byYear[y][b.kat]=byYear[y][b.kat]||[]).push(b) }
  return `
  <section class="panel">
    <h2>Belege</h2>
    <div class="yearchips"><span class="small muted">Jahre anzeigen:</span>${belegYears().map(y=>`<button type="button" class="chip" data-year="${y}" aria-pressed="${years.includes(y)}">${y}</button>`).join("")}</div>
    ${pending?pendingForm():`
    <div class="drop" id="drop">
      ${ic("camera")}
      <p><strong>Rezept, Quittung oder Rechnung erfassen</strong><br><span class="small muted">Fotografieren oder Datei (Bild/PDF) wählen. Auch ältere Belege, z. B. aus ${new Date().getFullYear()-2}: einfach das Datum vom Beleg eintragen.</span></p>
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
    <div class="field" style="max-width:320px"><label for="chron">Schwerwiegend chronisch krank?</label><select id="chron"><option value="" ${!S.chronisch?"selected":""}>Automatisch (${chronisch()?"ja":"nein"})</option><option value="ja" ${S.chronisch==="ja"?"selected":""}>Ja, 1 %</option><option value="nein" ${S.chronisch==="nein"?"selected":""}>Nein, 2 %</option></select></div>
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
    <div class="b-a">${delAsk===b.id?`<span class="small">Wirklich löschen?</span><button type="button" class="linkbtn danger" data-delyes="${b.id}">Ja, löschen</button><button type="button" class="linkbtn" data-delno="1">Abbrechen</button>`:
      `<button type="button" class="linkbtn" data-edit="${b.id}">Bearbeiten</button><button type="button" class="linkbtn" data-sub-toggle="${b.id}">${b.eingereicht?"Als offen markieren":"Als eingereicht markieren"}</button><button type="button" class="linkbtn danger" data-del="${b.id}">Löschen</button>`}</div>
  </div>`;
}
function pendingForm(){
  const p=pending; const canFiles=!!ASSETS;
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
    <div class="nav big go"><button class="btn ghost" type="button" data-act="cancelbeleg" ${busy?"disabled":""}>Abbrechen</button><button class="btn" type="button" data-act="savebeleg" ${busy?"disabled":""}>${busy?"Speichert …":p.editId?"Änderungen speichern":"Beleg speichern"}</button></div>
  </div>`;
}
/* ---------- Reiter: Termine ---------- */
function viewTermine(){
  const dl=deadlines(); const rel=beratungRelevant(); const st=beratungStatus();
  const halves=[st.prev,st.H,st.next];
  return `
  ${eriCard()}
  ${rel?`<section class="panel">
    <div class="section-title"><h2>Beratungsbesuch</h2><span class="small muted">§ 37 Abs. 3 SGB XI</span></div>
    <p class="muted small">Wer Pflegegeld bekommt, muss einmal in jedem Kalenderhalbjahr (Januar–Juni und Juli–Dezember) einen Beratungsbesuch durch einen Pflegedienst oder eine anerkannte Beratungsstelle nachweisen. Fehlt der Nachweis, kürzt die Pflegekasse das Pflegegeld, im Wiederholungsfall wird es gestrichen. Der Besuch ist kostenlos, jeder zweite darf per Video sein.</p>
    <div class="halves">${halves.map((h,i)=>{const done=st.inH(h);const cls=done?"done":i===0?"miss":i===1?"open":"";return `<div class="half ${cls}"><b>${h.label}</b><span>${done?"erledigt":i===0?"kein Besuch eingetragen":i===1?`offen · bis ${deD(h.end)}`:`ab ${deD(h.start)}`}</span></div>`}).join("")}</div>
    <div class="grid2">
      <div class="field"><label for="tdienst">Pflegedienst / Beratungsstelle</label><input type="text" id="tdienst" value="${esc(S.termine.dienst)}" placeholder="Name"></div>
      <div class="field"><label for="ttel">Telefon</label><input type="tel" id="ttel" value="${esc(S.termine.tel)}"></div>
    </div>
    <div class="grid2" style="align-items:end">
      <div class="field"><label for="tbesuch">Besuch hat stattgefunden am</label><input type="date" id="tbesuch" max="${isoD(TODAY())}"></div>
      <div><button class="btn" type="button" data-act="addbesuch">${ic("check")}Besuch eintragen</button></div>
    </div>
    ${besuche().length?`<p class="small muted">Eingetragene Besuche: ${besuche().map(s=>deD(parseIso(s))).join(", ")}. Den Nachweis kannst du unter Belege als „Nachweis Beratungsbesuch“ ablegen.</p>`:""}
    <div class="recip"><span><strong>Text für den Pflegedienst</strong></span><span class="small" id="pdtext">${esc(pdText())}</span><span class="btnrow"><button class="btn small soft" type="button" data-act="copypd">Text kopieren</button></span></div>
  </section>`:""}

  <section style="display:flex;flex-direction:column;gap:10px">
    <div class="section-title"><h2>Fristen und Erinnerungen</h2></div>
    <p class="small muted">Trage Erinnerungen mit einem Klick in deinen Kalender ein. Der Kalender meldet sich dann auch, wenn die App geschlossen ist.</p>
    ${dl.length?dl.map(dueHTML).join(""):`<p class="muted">Keine Fristen für deine Situation.</p>`}
  </section>

  <section class="panel">
    <h3>Eigene Erinnerung</h3>
    <div class="grid2" style="align-items:end">
      <div class="field"><label for="ownt">Was?</label><input type="text" id="ownt" placeholder="z. B. Widerspruch Pflegegrad abschicken"></div>
      <div class="field"><label for="ownd">Wann?</label><input type="date" id="ownd"></div>
    </div>
    <div><button class="btn soft" type="button" data-act="addown">${ic("plus")}Hinzufügen</button></div>
    ${S.sb.status==="ja"&&(mz("G")||mz("aG")||mz("Gl")||mz("H")||mz("Bl"))?`<div class="field" style="max-width:260px"><label for="twm">Wertmarke gültig bis</label><input type="date" id="twm" value="${esc(S.termine.wertmarke)}"></div>`:""}
  </section>`;
}
function pdText(){
  const st=beratungStatus(); const H=st.done?st.next:st.H; const p=S.person;
  return `Guten Tag, ich möchte einen Beratungsbesuch nach § 37 Abs. 3 SGB XI für ${p.name||"[Name]"}${pg()?` (Pflegegrad ${pg()})`:""} vereinbaren. Der Besuch muss im ${H.label} stattfinden, also bis spätestens ${deD(H.end)}. Bitte schicken Sie den Nachweis anschließend direkt an die ${kassePK()} und mir eine Kopie. Vielen Dank!`;
}
function dueHTML(x){
  const u=x.ok?"ok":urg(x.d);
  return `<div class="due ${u}">
    <div class="cal"><b>${MON[x.d.getMonth()]}</b><span>${x.d.getDate()}</span></div>
    <div class="d-t">${esc(x.t)} <span class="pill ${u}">${x.ok?"erledigt bis "+deD(beratungStatus().H.end):urgTxt(x.d)}</span></div>
    <div class="d-s">${esc(x.s)}</div>
    <div class="btnrow">
      <a class="btn small soft" href="${gcal(x)}" target="_blank" rel="noopener">${ic("cal")}Google Kalender</a>
      <a class="btn small ghost" href="${ocal(x)}" target="_blank" rel="noopener">Outlook</a>
      ${x.own?`<button type="button" class="btn small ghost" data-delown="${x.own}">Entfernen</button>`:""}
    </div>
  </div>`;
}

/* ---------- PDF ---------- */
function newDoc(){ if(!window.jspdf){toast("PDF-Erzeugung nicht geladen. Bitte Text kopieren.");return null} return new window.jspdf.jsPDF({unit:"mm",format:"a4"}) }
function drawLetter(doc,b){
  const p=S.person, a=S.rolle==="angehoerig", r=RECIP[b.to](), L=curLetter(b);
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
async function saveFile(filename,data,okMsg){
  const dl = await claudeUse("downloads");
  if(!dl){toast("Download ist in dieser Ansicht nicht verfügbar.");return}
  try{ await dl.save({filename,data}); toast(okMsg||"Gespeichert") }
  catch(e){ if(e&&e.code==="declined") return; toast(e&&e.code==="rate_limited"?"Bitte kurz warten und erneut versuchen.":"Download nicht möglich.") }
}
async function makePDF(b){ const doc=newDoc(); if(!doc) return; drawLetter(doc,b); await saveFile(`Antrag-${b.k}.pdf`,doc.output("blob"),"PDF gespeichert") }
async function blobToDataURL(id){
  const res=await fetch(blobUrl(id)); if(!res.ok) throw new Error("fetch");
  const bl=await res.blob(); if(!/^image\//.test(bl.type)) return null;
  const bmp=await createImageBitmap(bl); const c=document.createElement("canvas"); const s=Math.min(1,1600/Math.max(bmp.width,bmp.height));
  c.width=Math.round(bmp.width*s); c.height=Math.round(bmp.height*s); c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  return {url:c.toDataURL("image/jpeg",0.8),w:c.width,h:c.height};
}
async function makeMappe(withLetter, onlyZZ, yearsArg){
  const doc=newDoc(); if(!doc) return;
  toast("PDF wird erstellt …");
  const years=yearsArg||selYears(); const kf=S.belegFilter.kat||"";
  const jahr=years.length===1?years[0]:years.slice().reverse().join("-");
  let list=BEL.filter(b=>years.includes(String(b.jahr)));
  if(onlyZZ) list=list.filter(b=>KATS[b.kat]&&KATS[b.kat].zz); else if(kf) list=list.filter(b=>b.kat===kf);
  list.sort((a,b)=>(a.kat+a.datum).localeCompare(b.kat+b.datum));
  if(withLetter){ befJahr=years[0]; drawLetter(doc,B.find(x=>x.k==="befreiung")); doc.addPage() }
  const L0=20; let y=22;
  doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.text(`Belegübersicht ${jahr.replace("-"," – ")}`,L0,y); y+=7;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text([S.person.name||"", S.person.vnr?`Versichertennummer ${S.person.vnr}`:"", kasseName()].filter(Boolean).join(" · "),L0,y); y+=10;
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
async function makeCSV(){
  const years=selYears(); const jahr=years.slice().reverse().join("-");
  const rows=[["Datum","Art","Beschreibung","Betrag","Eingereicht"]];
  BEL.filter(b=>years.includes(String(b.jahr))&&(!S.belegFilter.kat||b.kat===S.belegFilter.kat)).sort((a,b)=>(a.datum||"").localeCompare(b.datum||"")).forEach(b=>rows.push([b.datum?deD(parseIso(b.datum)):"",(KATS[b.kat]||KATS.sonst).t,b.titel||"",b.betrag!=null&&b.betrag!==""?Number(b.betrag).toFixed(2).replace(".",","):"",b.eingereicht?"ja":"nein"]));
  const csv="﻿"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  await saveFile(`Belege-${jahr}.csv`,csv,"Tabelle gespeichert");
}

/* ---------- Belege speichern ---------- */
function startPending(file){
  if(pending){ // Foto in laufender Erfassung ersetzen
    if(pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview);
    pending.file=file||null; pending.preview=file&&/^image\//.test(file.type)?URL.createObjectURL(file):""; pending.dropAsset=false;
    return render();
  }
  pending={file:file||null, preview: file&&/^image\//.test(file.type)?URL.createObjectURL(file):"", kat:"apo", datum:isoD(TODAY()), betrag:"", titel:""};
  render();
}
function editBeleg(id){
  const b=BEL.find(x=>x.id===id); if(!b) return;
  pending={editId:id, file:null, keepAsset:b.asset||"", keepType:b.ctype||"", preview:b.asset&&/^image\//.test(b.ctype||"")?blobUrl(b.asset):"", kat:b.kat||"sonst", datum:b.datum||isoD(TODAY()), betrag:b.betrag==null||b.betrag===""?"":String(b.betrag).replace(".",","), titel:b.titel||""};
  render(); scrollTop();
}
async function prepareFile(f){
  if(f.type==="application/pdf") return {blob:f,type:"application/pdf"};
  try{
    const bmp=await createImageBitmap(f); const s=Math.min(1,1800/Math.max(bmp.width,bmp.height));
    const c=document.createElement("canvas"); c.width=Math.round(bmp.width*s); c.height=Math.round(bmp.height*s);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.82)); if(blob) return {blob,type:"image/jpeg"};
  }catch(e){}
  if(["image/jpeg","image/png","image/webp","image/gif"].includes(f.type)) return {blob:f,type:f.type};
  throw {code:"unsupported_type"};
}
async function saveBeleg(){
  if(busy||!pending) return;
  const p=pending; const betrag=String(p.betrag).trim()===""?"":numDE(p.betrag);
  if(String(p.betrag).trim()!=="" && !/^[\d.,\s]+$/.test(String(p.betrag).trim())){toast("Bitte den Betrag nur als Zahl eingeben, z. B. 5,00");return}
  busy=true; render();
  try{
    let asset=p.keepAsset||"", ctype=p.keepType||"", oldAsset="";
    if(p.dropAsset){ oldAsset=asset; asset=""; ctype="" }
    if(p.file){
      if(!ASSETS) throw {code:"no_assets"};
      const {blob,type}=await prepareFile(p.file);
      const up=await ASSETS.upload(blob,{type}); oldAsset=p.keepAsset||""; asset=up.id; ctype=up.contentType;
    }
    const d=parseIso(p.datum)||TODAY();
    const data={kat:p.kat,datum:isoD(d),jahr:d.getFullYear(),betrag,titel:String(p.titel||"").trim(),asset,ctype};
    if(p.editId){
      if(BCOL && !p.editId.startsWith("local-")) await BCOL.doc(p.editId).update(data);
      else { const x=BEL.find(x=>x.id===p.editId); if(x) Object.assign(x,data) }
      if(oldAsset && oldAsset!==asset && ASSETS){ try{ await ASSETS.delete(oldAsset) }catch(e){} }
    } else {
      data.eingereicht=false; data.created=new Date().toISOString();
      if(BCOL){ await BCOL.add(data) } else { BEL.push({id:"local-"+Date.now(),...data}) }
    }
    if(p.preview&&p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
    pending=null; { const yy=String(d.getFullYear()); const cur=selYears(); if(!cur.includes(yy)) S.belegFilter.jahre=[...cur,yy]; } save(); toast(p.editId?"Änderungen gespeichert":"Beleg gespeichert");
  }catch(e){
    const c=e&&e.code;
    toast(c==="too_large"?"Datei ist zu groß (max. 20 MB).":c==="unsupported_type"?"Dieses Dateiformat geht nicht. Bitte JPG, PNG oder PDF.":c==="quota_exceeded"?"Speicherplatz voll. Bitte alte Belege löschen.":c==="no_assets"?"Fotos können in dieser Ansicht nicht gespeichert werden.":"Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
  }
  busy=false; render();
}
async function deleteBeleg(id){
  const b=BEL.find(x=>x.id===id); delAsk=null; if(!b) return render();
  try{
    if(BCOL && !id.startsWith("local-")) await BCOL.doc(id).delete(); else BEL=BEL.filter(x=>x.id!==id);
    if(b.asset && ASSETS){ try{ await ASSETS.delete(b.asset) }catch(e){} }
    toast("Beleg gelöscht");
  }catch(e){ toast("Löschen fehlgeschlagen.") }
  render();
}
async function toggleSubmitted(id){
  const b=BEL.find(x=>x.id===id); if(!b) return;
  if(BCOL && !id.startsWith("local-")){ try{ await BCOL.doc(id).update({eingereicht:!b.eingereicht}) }catch(e){toast("Ändern fehlgeschlagen.")} }
  else { b.eingereicht=!b.eingereicht; render() }
}

/* ---------- Events ---------- */
document.addEventListener("click", e=>{
  const t=e.target.closest("[data-act],[data-open],[data-copy],[data-pdf],[data-resettx],[data-tab],[data-area],[data-kat],[data-del],[data-delyes],[data-delno],[data-sub-toggle],[data-view],[data-delown],[data-year],[data-befpdf],[data-befcopy],[data-edit],[data-wopen],[data-wnav],[data-font],[data-gotoclaim],[data-rmember]");
  if(!t) return;
  const a=t.dataset.act;
  if(t.dataset.tab){if(t.classList.contains("howbtn"))S.welcomeSeen=true;S.tab=t.dataset.tab;openKey=null;save();render();scrollTop();return}
  if(t.dataset.area){areaFilter=t.dataset.area;render();return}
  if(t.dataset.gotoclaim){ S.tab="ansprueche"; openKey=t.dataset.gotoclaim; render(); const el=$("it-"+openKey); el&&el.scrollIntoView({block:"start"}); return }
  if(t.dataset.rmember){ removeMember(t.dataset.rmember); return }
  if(t.dataset.font){ S.font=t.dataset.font; save(); render(); return }
  if(t.dataset.edit){ editBeleg(t.dataset.edit); return }
  if(t.dataset.wopen){ startWiz(t.dataset.wopen); return }
  if(t.dataset.wnav){ const n=t.dataset.wnav; const len=wizSteps().list.length;
    if(n==="close"){ const k=S.wiz.k; S.wiz=null; openKey=k; save(); render(); const el=$("it-"+k); el&&el.scrollIntoView({block:"start"}); return }
    if(n==="next") S.wiz.i=Math.min(len-1,S.wiz.i+1);
    else if(n==="back") S.wiz.i=Math.max(0,S.wiz.i-1);
    else if(n.startsWith("goto:")) S.wiz.i=Number(n.slice(5));
    save(); render(); scrollTop(); const f=document.querySelector(".wiz input[type=text],.wiz input[type=date],.wiz input[type=tel],.wiz textarea"); if(f&&!f.value) try{f.focus({preventScroll:true})}catch(e){} return }
  if(t.dataset.year){ const y=t.dataset.year; let cur=selYears(); cur=cur.includes(y)?cur.filter(x=>x!==y):[...cur,y]; if(!cur.length){toast("Mindestens ein Jahr auswählen");return} S.belegFilter.jahre=cur; save(); render(); return }
  if(t.dataset.befpdf){ makeMappe(true,true,[t.dataset.befpdf]); return }
  if(t.dataset.befcopy){ befJahr=t.dataset.befcopy; const L=curLetter(B.find(x=>x.k==="befreiung")); copy(`Betreff: ${L.subject}\n\n${L.body}`); return }
  if(t.dataset.kat!==undefined && t.classList.contains("chip")){S.belegFilter.kat=t.dataset.kat;save();render();return}
  if(t.dataset.del){delAsk=t.dataset.del;render();return}
  if(t.dataset.delno){delAsk=null;render();return}
  if(t.dataset.delyes){deleteBeleg(t.dataset.delyes);return}
  if(t.dataset.subToggle){toggleSubmitted(t.dataset.subToggle);return}
  if(t.dataset.view){$("lbimg").src=blobUrl(t.dataset.view);$("lightbox").hidden=false;return}
  if(t.dataset.delown){S.termine.eigene=(S.termine.eigene||[]).filter(x=>x.id!==t.dataset.delown);save();render();return}
  if(t.dataset.open){openKey = openKey===t.dataset.open?null:t.dataset.open; render(); if(openKey) reveal($("it-"+openKey));return}
  if(t.dataset.copy){const b=B.find(x=>x.k===t.dataset.copy);const L=curLetter(b);copy(`Betreff: ${L.subject}\n\n${L.body}`);return}
  if(t.dataset.pdf){makePDF(B.find(x=>x.k===t.dataset.pdf));return}
  if(t.dataset.resettx){delete S.texte[t.dataset.resettx];delete S.texte[t.dataset.resettx+"_sub"];save();render();return}
  switch(a){
    case "next": { if(t.dataset.ok==="0"){ const w=$("navwarn"); if(w){ w.hidden=false; w.scrollIntoView({block:"center",behavior:"smooth"}) } break }
      const vs=visSteps(); if(S.step>=vs.length-1){S.done=true;S.tab="ansprueche"} else S.step++; save();render();scrollTop();break }
    case "back": S.step=Math.max(0,S.step-1);save();render();scrollTop();break;
    case "edit": S.done=false;S.step=0;save();render();scrollTop();break;
    case "reset": $("resetconfirm").hidden=false;break;
    case "sent": { const k=t.dataset.k; S.status[k]="beantragt"; S.sent=S.sent||{}; S.sent[k]=isoD(TODAY()); const bb=B.find(x=>x.k===k);
      S.termine.eigene=[...(S.termine.eigene||[]),{id:String(Date.now()),t:`Antwort auf Antrag „${bb?bb.t:k}“ da?`,d:isoD(addDays(TODAY(),28)),n:"Falls noch keine Antwort da ist: bei der Kasse nachfragen. Das Datum des Antrags steht in der App."}];
      save(); render(); toast("Super! Wir erinnern dich in 4 Wochen."); break }
    case "dropphoto": if(pending){ if(pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview); pending.file=null; pending.preview=""; if(pending.keepAsset) pending.dropAsset=true; render() } break;
    case "bes-cam": fileTarget="bescheid"; $("fileCam").value=""; $("fileCam").click(); break;
    case "bes-manual": case "bes-edit": bescheidDraft={...(S.bescheid||{}), pg:(S.bescheid&&S.bescheid.pg)||String(pg()||"")}; ocrMsg=""; render(); break;
    case "bes-cancel": bescheidDraft=null; ocrMsg=""; render(); break;
    case "bes-save": saveBescheid(); break;
    case "entl-add": S.tab="belege"; pending=null; startPending(null); if(pending){ pending.kat="entl"; render() } scrollTop(); break;
    case "r-start": startRechner(); break;
    case "r-next": RECHNER.i++; render(); scrollTop(); break;
    case "r-back": RECHNER.i=Math.max(0,RECHNER.i-1); render(); scrollTop(); break;
    case "r-close": RECHNER=null; render(); scrollTop(); break;
    case "r-neu": startRechner(); break;
    case "r-antrag": { const k=pg()?"pg_hoch":"pg_antrag"; RECHNER=null; S.bereiche.pflege=true; if(!S.done){ S.done=true } startWiz(k); break }
    case "r-konto": RECHNER=null; if(typeof authMode!=="undefined"){ authMode="register"; authMsg="Lege ein kostenloses Konto an. Danach hilft dir die App Schritt für Schritt beim Antrag." } render(); scrollTop(); break;
    case "au-google": googleLogin(); break;
    case "au-login": case "au-register": case "au-forgot": case "au-newpw": authAction(a); break;
    case "au-mode": authMode=t.dataset.mode; authMsg=""; render(); break;
    case "au-show": { const p=$("au-pw"); if(p){ p.type=p.type==="password"?"text":"password"; t.textContent=p.type==="password"?"Zeigen":"Verbergen" } break }
    case "au-guest": lsSet("dein-anspruch-modus","gast"); startGuest(); scrollTop(); break;
    case "guest-register": GUEST=false; authMode="register"; authMsg=""; lsSet("dein-anspruch-modus",""); render(); scrollTop(); break;
    case "logout": logout(); break;
    case "eri-on": setEri(true,($("eri-mail")||{}).value); break;
    case "eri-off": setEri(false); break;
    case "persons": showPersons=!showPersons; delPersonAsk=false; if(showPersons) loadMembers(); render(); scrollTop(); break;
    case "add-person": addPerson(); break;
    case "invite": makeInvite(); break;
    case "inv-copy": copy(inviteLink); break;
    case "del-person": delPersonAsk=true; render(); break;
    case "del-person-no": delPersonAsk=false; render(); break;
    case "del-person-yes": deletePerson(); break;
    case "wipe": { const w=$("wipeconfirm"); if(w) w.hidden=false; break }
    case "wipe-no": { const w=$("wipeconfirm"); if(w) w.hidden=true; break }
    case "wipe-yes": wipeAll(); break;
    case "welcome-ok": S.welcomeSeen=true;save();render();break;
    case "vhp-quittung": makeQuittung();break;
    case "reset-no": $("resetconfirm").hidden=true;break;
    case "reset-yes": S=blank();openKey=null;save();render();scrollTop();break;
    case "cam": $("fileCam").value="";$("fileCam").click();break;
    case "pick": $("fileAny").value="";$("fileAny").click();break;
    case "manual": startPending(null);break;
    case "cancelbeleg": if(pending&&pending.preview&&pending.preview.startsWith("blob:")) URL.revokeObjectURL(pending.preview); pending=null;render();break;
    case "savebeleg": saveBeleg();break;
    case "mappe": makeMappe(false,false);break;
    case "csv": makeCSV();break;
    case "addbesuch": { const v=$("tbesuch").value; if(!parseIso(v)){toast("Bitte ein Datum wählen");break} S.termine.besuche=[...(S.termine.besuche||[]),{d:v}];save();render();toast("Besuch eingetragen");break }
    case "copypd": copy(pdText());break;
    case "addown": { const tt=$("ownt").value.trim(), d=$("ownd").value; if(!tt||!parseIso(d)){toast("Bitte Text und Datum angeben");break} S.termine.eigene=[...(S.termine.eigene||[]),{id:String(Date.now()),t:tt,d}];save();render();toast("Erinnerung hinzugefügt");break }
  }
});
document.addEventListener("change", e=>{
  const t=e.target, n=t.name;
  if(t.id==="langsel"){ LANG=t.value; try{localStorage.setItem("da-lang",JSON.stringify(LANG))}catch(e){} render(); return }
  if(t.dataset.plz){ if(/^\d{5}$/.test(t.value.trim())){ S.plz=t.value.trim(); save(); render() } return }
  if(t.dataset.rq!=null && RECHNER){ RECHNER.a[RECHNER.i]=t.dataset.rq; render(); setTimeout(()=>{ if(RECHNER && RECHNER.a[RECHNER.i]!=null){ RECHNER.i++; render(); scrollTop() } },350); return }
  if(t.id==="fileCam"||t.id==="fileAny"){ const f=t.files&&t.files[0]; if(f){ if(fileTarget==="bescheid"){ fileTarget=null; scanBescheid(f) } else startPending(f) } return }
  if(t.dataset.bd && bescheidDraft){ bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.fall){ openFall(t.dataset.fall); scrollTop(); return }
  if(t.id==="entl-seit"){ S.entlSeit=t.value; save(); render(); return }
  if(t.dataset.wq && t.type==="radio"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render(); const k=S.wiz.k, i=S.wiz.i; setTimeout(()=>{ if(S.wiz&&S.wiz.k===k&&S.wiz.i===i){ const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() } },420) } return }
  if(t.dataset.wqm){ const q=wizSteps().list.find(x=>x.k===t.dataset.wqm); if(q){ const cur=Array.isArray(getQ(q))?getQ(q):[]; setQ(q, t.checked?[...cur,t.value]:cur.filter(x=>x!==t.value)); render() } return }
  if(t.dataset.wq && t.type==="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); render() } return }
  if(n==="rolle") S.rolle=t.value;
  else if(n==="bereich") S.bereiche[t.value]=t.checked;
  else if(n==="kasse") S.kasse=t.value;
  else if(t.id==="aokRegion") S.aokRegion=t.value;
  else if(n==="pg") S.pg=t.value;
  else if(n==="wohnen") S.wohnen=t.value;
  else if(n==="stunden10") S.pp.stunden10=t.value;
  else if(n==="arbeit") S.pp.arbeit=t.value;
  else if(n==="sbstatus") S.sb.status=t.value;
  else if(t.id==="gdb") S.sb.gdb=t.value;
  else if(n==="mz") S.sb.mz[t.value]=t.checked;
  else if(n==="sbx") S.sb[t.value]=t.checked;
  else if(n==="genutzt") S.genutzt[t.value]=t.checked;
  else if(t.dataset.check){ S.checks[t.dataset.check]=t.checked; save(); return }
  else if(t.dataset.status) S.status[t.dataset.status]=t.value;
  else if(t.dataset.gen) {S.genutzt[t.dataset.gen]=t.checked; openKey=null}
  else if(t.id==="chron") S.chronisch=t.value;
  else if(t.dataset.brutto){ S.bruttoJahr={...(S.bruttoJahr||{}),[t.dataset.brutto]:t.value} }
  else if(t.dataset.vhp){ S.vhp[t.dataset.vhp]=t.value; delete S.texte.jahresbetrag; delete S.texte.jahresbetrag_sub }
  else if(t.id==="twm") S.termine.wertmarke=t.value;
  else if(t.dataset.pend){ pending[t.dataset.pend]=t.value; if(t.type==="radio") render(); return }
  else return;
  save(); render();
});
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.wq && t.type!=="radio" && t.type!=="date"){ const q=wizSteps().list.find(x=>x.k===t.dataset.wq); if(q){ setQ(q,t.value); const sk=document.querySelector('.wiz [data-wnav="next"].ghost'); if(sk) sk.hidden=!!t.value.trim() } return }
  if(t.dataset.bd && bescheidDraft){ bescheidDraft[t.dataset.bd]=t.value; return }
  if(t.dataset.wqp){ S.person[t.dataset.wqp]=t.value; save(); return }
  if(t.id==="kasseAndere"){S.kasseAndere=t.value;save()}
  else if(t.dataset.p){S.person[t.dataset.p]=t.value;save()}
  else if(t.dataset.tx){S.texte[t.dataset.tx]=t.value;save()}
  else if(t.dataset.sub){S.texte[t.dataset.sub+"_sub"]=t.value;save()}
  else if(t.dataset.pend){pending[t.dataset.pend]=t.value}
  else if(t.dataset.vhp && t.type!=="radio"){S.vhp[t.dataset.vhp]=t.value;save()}
  else if(t.id==="tdienst"){S.termine.dienst=t.value;save()}
  else if(t.id==="ttel"){S.termine.tel=t.value;save()}
});
document.addEventListener("dragover", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d&&ASSETS){e.preventDefault();d.classList.add("over")}});
document.addEventListener("dragleave", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d) d.classList.remove("over")});
document.addEventListener("drop", e=>{const d=e.target.closest&&e.target.closest("#drop"); if(d&&ASSETS){e.preventDefault();const f=e.dataTransfer.files[0]; if(f) startPending(f)}});
$("lbclose").onclick=()=>{$("lightbox").hidden=true};
$("lightbox").onclick=e=>{if(e.target.id==="lightbox") $("lightbox").hidden=true};
document.addEventListener("keydown",e=>{if(e.key==="Escape") $("lightbox").hidden=true;
  if(e.key==="Enter" && e.target.closest && e.target.closest(".auth") && e.target.tagName==="INPUT"){ e.preventDefault(); const b=document.querySelector('.auth .btn.big'); b&&b.click(); return }
  if(e.key==="Enter" && S.wiz && e.target.matches && e.target.matches(".wiz input")){ e.preventDefault(); const nx=document.querySelector('.wiz .nav [data-wnav="next"]:not(.ghost)'); nx&&nx.click() }});

async function copy(text){
  try{await navigator.clipboard.writeText(text);toast("Text kopiert")}
  catch(e){const ta=document.querySelector("textarea[data-tx]"); if(ta){ta.focus();ta.select()} toast("Bitte Text markieren und kopieren (Strg+C)")}
}
let tT; function toast(m){const t=$("toast");t.textContent=tr(m);t.hidden=false;clearTimeout(tT);tT=setTimeout(()=>t.hidden=true,2800)}

/* ---------- Speicher (privat pro Konto) ---------- */

/* ---------- Speicher: Supabase (Konto, Datenbank, Beleg-Fotos) ---------- */
const SB_URL="https://ssamgluufgwsxvkyvaob.supabase.co";
const SB_KEY="sb_publishable_UiXPXKzQ6uKTyQF3SqFQiw_VtjqAAbd";
let sb=null, USER=null, GUEST=false, RECOVERY=false, authMsg="", authMode="login", authBusy=false;
let ref=null, BCOL=null, ASSETS=null, saveTimer=null, writing=Promise.resolve(), canSave=false;
let saveState={c:"",t:"Verbinde …"};
let URLS={};
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function blobUrl(p){ return URLS[p]||"" }
function setSave(c,t){saveState={c,t}; const d=$("savedot"), x=$("savetxt"); if(d){d.className="dot "+c} if(x) x.textContent=t}
const DL={ async save({filename,data}){
  const type=/\.csv$/.test(filename)?"text/csv;charset=utf-8":/\.pdf$/.test(filename)?"application/pdf":"application/octet-stream";
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),8000); return {status:"saved"} } };
function claudeUse(n){ return Promise.resolve(n==="downloads"?DL:null) }
const UI_KEYS=["tab","wiz","belegFilter","welcomeSeen"];
let FAELLE=[], FALL_ID=null, MEMBERS=[], showPersons=false, inviteLink="", inviteBusy=false;
function uiKey(){ return "da-ui-"+(USER?USER.id:"gast")+"-"+(FALL_ID||"x") }
function save(){
  if(!canSave||!ref) return;
  clearTimeout(saveTimer); setSave("","Speichert …");
  const ui={}; UI_KEYS.forEach(k=>ui[k]=S[k]); lsSet(uiKey(),ui); lsSet("da-font",S.font);
  saveTimer=setTimeout(()=>{
    saveTimer=null;
    const data=JSON.parse(JSON.stringify(S)); data.updated=new Date().toISOString();
    if(USER) UI_KEYS.forEach(k=>delete data[k]);
    const f=FAELLE.find(x=>x.id===FALL_ID); if(f) f.data=data;
    writing = writing.then(()=>ref.set(data)).then(()=>setSave("ok",USER?"Gespeichert":"Nur auf diesem Gerät")).catch(()=>{ setSave("warn","Nicht gespeichert – Internet prüfen") });
  },700);
}
function merge(d){
  const b=blank();
  const m={...b,...d,bereiche:{...b.bereiche,...(d.bereiche||{})},pp:{...b.pp,...(d.pp||{})},sb:{...b.sb,...(d.sb||{}),mz:{...(d.sb&&d.sb.mz||{})}},person:{...b.person,...(d.person||{})},termine:{...b.termine,...(d.termine||{})},belegFilter:{...b.belegFilter,...(d.belegFilter||{})},vhp:{...b.vhp,...(d.vhp||{})},bruttoJahr:{...(d.bruttoJahr||{})},ans:{...(d.ans||{})},sent:{...(d.sent||{})}};
  if(d.done===undefined) m.done = (d.step||0)>=6 && !!d.rolle;
  delete m.updated; return m;
}
function fallName(f){ const p=(f&&f.data&&f.data.person)||{}; return (p.name||"").trim()||"Neue Person" }
const toRow=d=>{ const r={}; for(const k of ["kat","titel","ctype","eingereicht","jahr"]) if(k in d) r[k]=d[k];
  if("datum" in d) r.datum=d.datum||null; if("betrag" in d) r.betrag=(d.betrag===""||d.betrag==null||isNaN(d.betrag))?null:Number(d.betrag);
  if("asset" in d) r.pfad=d.asset||""; return r };
async function refreshUrls(){
  const paths=BEL.map(b=>b.asset).filter(p=>p&&!URLS[p]); if(!paths.length) return;
  const {data}=await sb.storage.from("belege").createSignedUrls(paths,6*3600);
  (data||[]).forEach(x=>{ if(x.signedUrl) URLS[x.path]=x.signedUrl });
}
async function reloadBelege(){
  if(!USER||!FALL_ID) return;
  const {data,error}=await sb.from("belege").select("*").eq("fall_id",FALL_ID).order("datum",{ascending:false});
  if(error){ toast("Belege konnten nicht geladen werden."); return }
  BEL=data.map(r=>({id:r.id,kat:r.kat,datum:r.datum||"",jahr:r.jahr,betrag:r.betrag==null?"":Number(r.betrag),titel:r.titel||"",asset:r.pfad||"",ctype:r.ctype||"",eingereicht:!!r.eingereicht}));
  try{ await refreshUrls() }catch(e){}
  render();
}
const BCOL_SB={
  async add(d){ const {error}=await sb.from("belege").insert({...toRow(d),fall_id:FALL_ID}); if(error) throw error; await reloadBelege() },
  doc(id){ return {
    async update(d){ const {error}=await sb.from("belege").update(toRow(d)).eq("id",id); if(error) throw error; await reloadBelege() },
    async delete(){ const {error}=await sb.from("belege").delete().eq("id",id); if(error) throw error; await reloadBelege() } } },
};
const ASSETS_SB={
  async upload(blob,{type}){
    const ext=type==="application/pdf"?"pdf":type==="image/png"?"png":type==="image/webp"?"webp":"jpg";
    const id=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));
    const path=`${FALL_ID}/${id}.${ext}`;
    const {error}=await sb.storage.from("belege").upload(path,blob,{contentType:type,upsert:false});
    if(error) throw {code:/size|large|exceed/i.test(error.message||"")?"too_large":"upload"};
    const {data}=await sb.storage.from("belege").createSignedUrl(path,6*3600); if(data) URLS[path]=data.signedUrl;
    return {id:path,contentType:type};
  },
  async delete(path){ await sb.storage.from("belege").remove([path]) },
};
const REF_SB={ async set(data){ const {error}=await sb.from("fall").update({data,updated_at:new Date().toISOString()}).eq("id",FALL_ID); if(error) throw error } };
const REF_LOCAL={ async set(data){ lsSet("dein-anspruch-gast",data) } };

async function loadFaelle(){
  const {data,error}=await sb.from("fall").select("id,data,created_by,updated_at").order("created_at");
  if(error) throw error;
  const {data:m}=await sb.from("mitglied").select("fall_id,rolle").eq("user_id",USER.id);
  const rollen=Object.fromEntries((m||[]).map(x=>[x.fall_id,x.rolle]));
  FAELLE=data.map(f=>({...f,rolle:rollen[f.id]||"mitglied"}));
}
async function createFall(data){
  const {data:row,error}=await sb.from("fall").insert({data:data||{}}).select("id,data,created_by,updated_at").single();
  if(error) throw error; FAELLE.push({...row,rolle:"besitzer"}); return row.id;
}
async function openFall(id){
  FALL_ID=id; lsSet("da-fall-"+USER.id,id); inviteLink=""; showPersons=false;
  const f=FAELLE.find(x=>x.id===id);
  S=merge({...(f?f.data:{}),...(lsGet(uiKey())||{}),font:lsGet("da-font")||"1"});
  BEL=[]; URLS={}; openKey=null; pending=null; bescheidDraft=null;
  ref=REF_SB; canSave=true; render(); reloadBelege(); loadMembers();
}
async function loadMembers(){
  MEMBERS=[]; if(!FALL_ID) return;
  const {data}=await sb.from("mitglied").select("user_id,rolle,email").eq("fall_id",FALL_ID);
  MEMBERS=data||[]; if(showPersons) render();
}
async function loadUserData(){
  setSave("","Lade deine Daten …");
  try{
    const code=lsGet("da-einladung"); let joined=null;
    if(code){ lsSet("da-einladung",null); const {data,error}=await sb.rpc("einladung_annehmen",{c:code}); if(error) toast("Die Einladung ist ungültig oder abgelaufen."); else { joined=data; toast("Willkommen! Ihr pflegt jetzt gemeinsam.") } }
    await loadFaelle();
    if(!FAELLE.length){ const guest=lsGet("dein-anspruch-gast"); await createFall(guest||{}); if(guest) toast("Deine Angaben von diesem Gerät wurden ins Konto übernommen.") }
    const want=joined||lsGet("da-fall-"+USER.id);
    ASSETS=ASSETS_SB; BCOL=BCOL_SB; GUEST=false; loaded=true;
    setSave("ok","Gespeichert");
    await openFall(FAELLE.some(f=>f.id===want)?want:FAELLE[0].id);
  }catch(e){ canSave=false; loaded=true; setSave("warn","Speicher nicht erreichbar"); render() }
}
async function refreshFromServer(){
  if(!USER||!FALL_ID||saveTimer) return;
  const {data}=await sb.from("fall").select("data,updated_at").eq("id",FALL_ID).maybeSingle();
  const f=FAELLE.find(x=>x.id===FALL_ID);
  if(data && f && data.updated_at!==f.updated_at){ f.data=data.data; f.updated_at=data.updated_at; const ui={}; UI_KEYS.forEach(k=>ui[k]=S[k]); S=merge({...data.data,...ui,font:S.font}); render(); }
  reloadBelege();
}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") refreshFromServer().catch(()=>{}) });
async function addPerson(){
  try{ const id=await createFall({}); await openFall(id); scrollTop(); toast("Neue Person angelegt. Beantworte kurz die Fragen.") }catch(e){ toast("Anlegen hat nicht geklappt.") }
}
async function makeInvite(){
  inviteBusy=true; render();
  const {data,error}=await sb.rpc("einladung_erstellen",{f:FALL_ID});
  inviteBusy=false;
  if(error){ toast("Einladung konnte nicht erstellt werden."); return render() }
  inviteLink=location.origin+location.pathname+"?einladung="+data; render();
}
async function removeMember(uid){
  const {error}=await sb.from("mitglied").delete().eq("fall_id",FALL_ID).eq("user_id",uid);
  if(error) return toast("Entfernen hat nicht geklappt.");
  if(uid===USER.id){ FAELLE=FAELLE.filter(f=>f.id!==FALL_ID); toast("Du bist ausgetreten."); if(!FAELLE.length) await createFall({}); return openFall(FAELLE[0].id) }
  toast("Person entfernt."); loadMembers().then(render);
}
let delPersonAsk=false;
async function deletePerson(){
  try{
    const paths=BEL.map(b=>b.asset).filter(Boolean); if(paths.length) await sb.storage.from("belege").remove(paths);
    const {error}=await sb.from("fall").delete().eq("id",FALL_ID); if(error) throw error;
    FAELLE=FAELLE.filter(f=>f.id!==FALL_ID); delPersonAsk=false; toast("Person und ihre Daten wurden gelöscht.");
    if(!FAELLE.length) await createFall({}); openFall(FAELLE[0].id);
  }catch(e){ toast("Löschen hat nicht geklappt.") }
}
function viewPersons(){
  const cur=FAELLE.find(f=>f.id===FALL_ID)||{}; const own=cur.rolle==="besitzer";
  const others=MEMBERS.filter(m=>m.user_id!==USER.id);
  return `<section class="panel persons">
    <div class="section-title"><h2>Für wen?</h2><button type="button" class="linkbtn" data-act="persons">Schließen</button></div>
    <div class="choices big">${FAELLE.map(f=>`<label class="choice" for="pf-${f.id}"><input type="radio" id="pf-${f.id}" name="pfall" data-fall="${f.id}" ${f.id===FALL_ID?"checked":""}><span>${esc(fallName(f))}<small>${f.rolle==="besitzer"?"angelegt von dir":"mit dir geteilt"}</small></span></label>`).join("")}</div>
    <button class="btn ghost" type="button" data-act="add-person">${ic("plus")}Weitere Person anlegen</button>
    <hr class="sep">
    <h3>Gemeinsam pflegen</h3>
    <p class="small muted">Lade Geschwister oder andere Helfer ein. Sie sehen dann die Angaben, Belege und Fristen von ${esc(fallName(cur))} und können mithelfen.</p>
    ${others.length?`<ul class="members">${others.map(m=>`<li><span>${esc(m.email||"Familienmitglied")}${m.rolle==="besitzer"?' <span class="tag">hat angelegt</span>':""}</span>${own?`<button type="button" class="linkbtn danger" data-rmember="${m.user_id}">Entfernen</button>`:""}</li>`).join("")}</ul>`:""}
    ${inviteLink?`<div class="recip"><span><strong>Einladungslink</strong> (14 Tage gültig, für eine Person)</span><code>${esc(inviteLink)}</code>
        <span class="btnrow"><button class="btn small" type="button" data-act="inv-copy">Link kopieren</button><a class="btn small soft" href="https://wa.me/?text=${encodeURIComponent("Ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können: "+inviteLink)}" target="_blank" rel="noopener">Per WhatsApp</a>
        <a class="btn small ghost" href="mailto:?subject=${encodeURIComponent("Einladung: Dein Anspruch")}&body=${encodeURIComponent("Hallo, ich lade dich zu „Dein Anspruch“ ein, damit wir uns gemeinsam um "+fallName(cur)+" kümmern können:\n\n"+inviteLink)}">Per E-Mail</a></span></div>`
      :`<button class="btn" type="button" data-act="invite" ${inviteBusy?"disabled":""}>${ic("user")}Jemanden einladen</button>`}
    <hr class="sep">
    ${own?(delPersonAsk?`<p class="notice bad">${ic("alert")}<span>${esc(fallName(cur))} mit allen Angaben und Belegen für alle löschen? <span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="del-person-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="del-person-no">Abbrechen</button></span></span></p>`
      :`<button class="linkbtn danger" type="button" data-act="del-person">${esc(fallName(cur))} löschen</button>`)
      :`<button class="linkbtn danger" type="button" data-rmember="${USER.id}">Aus diesem gemeinsamen Fall austreten</button>`}
  </section>`;
}
function startGuest(){
  GUEST=true; USER=null; ref=REF_LOCAL; canSave=true; ASSETS=null; BCOL=null;
  const g=lsGet("dein-anspruch-gast"); S=g?merge(g):blank();
  setSave("warn","Nur auf diesem Gerät"); render();
}
let loaded=false;
async function initStore(){
  try{ if(new URLSearchParams(location.search).has("rechner")) RECHNER={i:0,a:[]} }catch(e){}
  try{ const q=new URLSearchParams(location.search); const c=q.get("einladung"); if(c){ lsSet("da-einladung",c); history.replaceState(null,"",location.pathname) } }catch(e){}
  if(!window.supabase){ loaded=true; setSave("warn","Keine Verbindung – nur auf diesem Gerät"); startGuest(); return }
  sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"dein-anspruch-auth"}});
  sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY"){ RECOVERY=true; render() }
    const u=session?session.user:null;
    if(u && (!USER || USER.id!==u.id)){ USER=u; setTimeout(loadUserData,0) }
    if(!u && USER){ USER=null; S=blank(); BEL=[]; URLS={}; FAELLE=[]; FALL_ID=null; canSave=false; ref=null; ASSETS=null; BCOL=null; render() }
  });
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(session&&session.user){ if(!USER){ USER=session.user; await loadUserData() } }
    else { loaded=true; if(lsGet("dein-anspruch-modus")==="gast") startGuest(); else render() }
  }catch(e){ loaded=true; render() }
}

/* ---------- Anmeldung ---------- */
function viewLogin(){
  if(RECOVERY) return `<section class="panel auth"><h2>Neues Passwort festlegen</h2>
    <div class="field"><label for="au-pw">Neues Passwort (mindestens 8 Zeichen)</label><input type="password" id="au-pw" autocomplete="new-password"></div>
    ${authMsg?`<p class="notice">${ic("info")}<span>${esc(authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="au-newpw" ${authBusy?"disabled":""}>Passwort speichern</button></section>`;
  const reg=authMode==="register", fg=authMode==="forgot";
  return `<section class="panel auth">
    ${lsGet("da-einladung")?`<p class="notice good">${ic("user")}<span><strong>Du wurdest eingeladen.</strong> Melde dich an oder lege ein Konto an. Danach siehst du den gemeinsamen Fall.</span></p>`:""}
    <h2>${reg?"Konto anlegen":fg?"Passwort vergessen":"Willkommen"}</h2>
    <p class="muted">${reg?"Mit einem Konto sind deine Angaben und Belege sicher gespeichert und auf Handy und Computer gleich.":fg?"Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.":"Melde dich an, um deine Angaben und Belege zu sehen."}</p>
    ${fg?"":`<button type="button" class="btn big gbtn" data-act="au-google"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Mit Google anmelden</button>
    <div class="orline"><span>oder mit E-Mail</span></div>`}
    <div class="field"><label for="au-mail">E-Mail-Adresse</label><input type="email" id="au-mail" autocomplete="email" inputmode="email" value="${esc(lsGet("dein-anspruch-mail")||"")}"></div>
    ${fg?"":`<div class="field"><label for="au-pw">Passwort${reg?" (mindestens 8 Zeichen)":""}</label><div class="euro"><input type="password" id="au-pw" autocomplete="${reg?"new-password":"current-password"}"><button type="button" class="btn small ghost" data-act="au-show">Zeigen</button></div></div>`}
    ${authMsg?`<p class="notice ${/fehl|falsch|nicht/i.test(authMsg)?"bad":"info"}">${ic("info")}<span>${esc(authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="${reg?"au-register":fg?"au-forgot":"au-login"}" ${authBusy?"disabled":""}>${authBusy?"Einen Moment …":reg?"Konto anlegen":fg?"Link schicken":"Anmelden"}</button>
    <div class="btnrow">
      ${authMode!=="login"?`<button type="button" class="linkbtn" data-act="au-mode" data-mode="login">Ich habe schon ein Konto</button>`:`<button type="button" class="linkbtn" data-act="au-mode" data-mode="register">Neu hier? Konto anlegen</button><button type="button" class="linkbtn" data-act="au-mode" data-mode="forgot">Passwort vergessen?</button>`}
    </div>
    <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>
    <button type="button" class="linkbtn" data-act="r-start">Pflegegrad-Rechner: ohne Anmeldung einschätzen, welcher Pflegegrad in Frage kommt</button>
    <p class="small muted">Ohne Konto bleiben deine Angaben nur in diesem Browser, und Belege-Fotos werden nicht gespeichert. Du kannst später jederzeit ein Konto anlegen, deine Angaben werden dann übernommen.</p>
  </section>`;
}
async function authAction(a){
  const mail=($("au-mail")||{}).value?.trim()||"", pw=($("au-pw")||{}).value||"";
  if(a!=="au-newpw" && !/^\S+@\S+\.\S+$/.test(mail)){ authMsg="Bitte eine gültige E-Mail-Adresse eingeben."; return render() }
  if((a==="au-register"||a==="au-newpw") && pw.length<8){ authMsg="Das Passwort muss mindestens 8 Zeichen haben."; return render() }
  lsSet("dein-anspruch-mail",mail||lsGet("dein-anspruch-mail"));
  authBusy=true; authMsg=""; render();
  const back=location.origin+location.pathname;
  let r;
  try{
    if(a==="au-login"){ r=await sb.auth.signInWithPassword({email:mail,password:pw}); if(r.error) authMsg=/confirm/i.test(r.error.message)?"Die E-Mail-Adresse ist noch nicht bestätigt. Bitte den Link in der Bestätigungs-E-Mail antippen.":"Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch."; else lsSet("dein-anspruch-modus","konto") }
    else if(a==="au-register"){ r=await sb.auth.signUp({email:mail,password:pw,options:{emailRedirectTo:back}});
      if(r.error) authMsg=/already|registered/i.test(r.error.message)?"Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.":/rate|limit/i.test(r.error.message)?"Gerade werden zu viele E-Mails verschickt. Bitte in einer Stunde noch einmal versuchen.":"Konto anlegen hat nicht geklappt: "+r.error.message;
      else if(!r.data.session){ authMsg="Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte den Link darin antippen und dich danach hier anmelden."; authMode="login" } }
    else if(a==="au-forgot"){ r=await sb.auth.resetPasswordForEmail(mail,{redirectTo:back}); authMsg=r.error?"Das hat nicht geklappt. Bitte später noch einmal versuchen.":"Wenn es ein Konto mit dieser Adresse gibt, ist jetzt eine E-Mail mit einem Link unterwegs."; }
    else if(a==="au-newpw"){ r=await sb.auth.updateUser({password:pw}); if(r.error) authMsg="Das neue Passwort konnte nicht gespeichert werden."; else { RECOVERY=false; authMsg=""; toast("Neues Passwort gespeichert") } }
  }catch(e){ authMsg="Keine Verbindung. Bitte Internet prüfen." }
  authBusy=false; render();
}
async function googleLogin(){
  authBusy=true; authMsg=""; render();
  const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
  if(error){ authBusy=false; authMsg=/not enabled|provider/i.test(error.message)?"Die Anmeldung mit Google ist noch nicht eingeschaltet. Bitte vorerst mit E-Mail anmelden.":"Anmeldung mit Google hat nicht geklappt. Bitte erneut versuchen."; render() }
}
async function logout(){ try{ await sb.auth.signOut() }catch(e){} ERI=null; eriLoaded=false; lsSet("dein-anspruch-modus",""); USER=null; GUEST=false; S=blank(); BEL=[]; URLS={}; FAELLE=[]; FALL_ID=null; showPersons=false; canSave=false; ref=null; render(); scrollTop() }

async function wipeAll(){
  if(!USER){ lsSet("dein-anspruch-gast",null); S=blank(); BEL=[]; render(); return }
  try{
    for(const f of FAELLE){
      if(f.rolle==="besitzer"){
        const {data:bl}=await sb.from("belege").select("pfad").eq("fall_id",f.id);
        const paths=(bl||[]).map(b=>b.pfad).filter(Boolean); if(paths.length) await sb.storage.from("belege").remove(paths);
        await sb.from("fall").delete().eq("id",f.id);
      } else await sb.from("mitglied").delete().eq("fall_id",f.id).eq("user_id",USER.id);
    }
    await sb.from("faelle").delete().eq("user_id",USER.id);
    lsSet("dein-anspruch-gast",null);
    toast("Alle deine Daten wurden gelöscht.");
  }catch(e){ toast("Löschen hat nicht vollständig geklappt. Bitte erneut versuchen."); return }
  await logout();
}

/* ---------- E-Mail-Erinnerungen ---------- */
let ERI=null, eriLoaded=false;
async function loadEri(){ if(!USER) return; const {data}=await sb.from("erinnerung").select("aktiv,email").eq("user_id",USER.id).maybeSingle(); ERI=data||null; eriLoaded=true; render() }
async function setEri(aktiv,email){
  const mail=(email||(ERI&&ERI.email)||USER.email||"").trim();
  if(aktiv && !/^\S+@\S+\.\S+$/.test(mail)){ toast("Bitte eine gültige E-Mail-Adresse eingeben."); return }
  const {error}=await sb.from("erinnerung").upsert({user_id:USER.id,aktiv,email:mail,updated_at:new Date().toISOString()});
  if(error){ toast("Speichern hat nicht geklappt."); return }
  ERI={aktiv,email:mail}; toast(aktiv?"Erinnerungen per E-Mail sind an.":"Erinnerungen per E-Mail sind aus."); render();
}
function eriCard(){
  if(!USER) return "";
  if(!eriLoaded){ loadEri(); return "" }
  const on=ERI&&ERI.aktiv;
  return `<section class="panel mini">
    <div class="mini-head">${ic("bell")}<div><h3>Erinnerungen per E-Mail</h3><p class="small muted">Wir schreiben dir 14, 7 und 1 Tag vor jeder Frist, für alle Personen in deinem Konto.</p></div></div>
    ${on?`<p class="small">An: <strong>${esc(ERI.email)}</strong></p><div class="btnrow"><button class="btn small ghost" type="button" data-act="eri-off">Ausschalten</button></div>`
      :`<div class="grid2" style="align-items:end"><div class="field"><label for="eri-mail">E-Mail-Adresse</label><input type="email" id="eri-mail" value="${esc((ERI&&ERI.email)||USER.email||"")}"></div><div><button class="btn" type="button" data-act="eri-on">${ic("bell")}Einschalten</button></div></div>`}
  </section>`;
}

render();
initStore();
