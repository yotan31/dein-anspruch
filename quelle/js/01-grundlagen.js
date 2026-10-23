import { Z } from "./zustand.js";
import { BETRAEGE } from "./00-betraege.js";

/* ---------- Stammdaten (Beträge kommen aus 00-betraege.js) ---------- */
export const PG = {
  pflegegeld:BETRAEGE.pflegegeld,
  sachleistung:BETRAEGE.sachleistung,
  tagespflege:BETRAEGE.tagespflege,
  stationaer:BETRAEGE.stationaer,
  rv:BETRAEGE.rentenbeitrag,
  pflegePausch:BETRAEGE.pflegePauschbetrag,
};
export const ENTLASTUNG=BETRAEGE.entlastung, JAHRESBETRAG=BETRAEGE.jahresbetrag, VERBRAUCH=BETRAEGE.verbrauch, WOHNUMFELD=BETRAEGE.wohnumfeld, WG=BETRAEGE.wg, DIPA=BETRAEGE.dipa, DIPA_UL=BETRAEGE.dipaUnterstuetzung;
export const BEHPAUSCH=BETRAEGE.behindertenPauschbetrag;

export const KASSEN = {
  tk:{name:"Techniker Krankenkasse (TK)", pk:"TK-Pflegeversicherung", mail:"service@tk.de", app:"TK-App (sicherer Upload)"},
  barmer:{name:"BARMER", pk:"BARMER Pflegekasse", mail:"service@barmer.de", app:"BARMER-App"},
  dak:{name:"DAK-Gesundheit", pk:"DAK-Gesundheit Pflegekasse", mail:"service@dak.de", app:"Meine DAK (App)"},
  aok:{name:"AOK", pk:"AOK-Pflegekasse", mail:"", app:"AOK Mein Leben (App)"},
  ikk:{name:"IKK classic", pk:"IKK classic Pflegekasse", mail:"info@ikk-classic.de", app:"IKK classic App"},
  andere:{name:"Andere Krankenkasse", pk:"Pflegekasse", mail:"", app:"App oder Online-Postfach deiner Kasse"},
};
export const AOK_REGIONEN=["Baden-Württemberg","Bayern","PLUS (Sachsen/Thüringen)","Niedersachsen","Rheinland/Hamburg","NordWest","Hessen","Nordost","Rheinland-Pfalz/Saarland","Sachsen-Anhalt","Bremen/Bremerhaven"];
export const WOHNEN = {
  angehoerige:{t:"Zu Hause, Pflege durch Angehörige/Bekannte", s:"ohne Pflegedienst"},
  gemischt:{t:"Zu Hause, Angehörige + Pflegedienst", s:"Kombination"},
  pflegedienst:{t:"Zu Hause, überwiegend Pflegedienst", s:"Sachleistung"},
  wg:{t:"Ambulant betreute Wohngruppe", s:"Pflege-WG"},
  heim:{t:"Pflegeheim (vollstationär)", s:"dauerhaft im Heim"},
  eingliederung:{t:"Wohnheim der Eingliederungshilfe", s:"Einrichtung für Menschen mit Behinderung"},
};
export const MZ = {G:"G – erheblich gehbehindert",aG:"aG – außergewöhnlich gehbehindert",H:"H – hilflos",Bl:"Bl – blind",TBl:"TBl – taubblind",Gl:"Gl – gehörlos",B:"B – Begleitperson nötig",RF:"RF – Rundfunkbeitrag-Ermäßigung"};

/* ---------- Zustand ---------- */
export function blank() { return ({
  step:0, done:false, tab:"ansprueche", brutto:"", bruttoJahr:{}, chronisch:"", welcomeSeen:false, bescheid:null, entlSeit:"", ans:{}, sent:{}, wiz:null, font:"1", belegFilter:{jahre:[],kat:""},
  vhp:{grund:"urlaub",art:"tage",haupt:"",von:"",bis:"",stunden:"",ersatz:"angehoerig",eName:"",eAdresse:"",eBez:"",satz:"",rechnung:"",km:"",verdienst:"",verbraucht:"",auszahlung:"versicherte",iban:""}, termine:{dienst:"",tel:"",besuche:[],eigene:[],wertmarke:""},
  rolle:"", bereiche:{pflege:true,sb:false}, ziel:"",
  kasse:"", aokRegion:"", kasseAndere:"",
  pg:"", wohnen:"", verschlechtert:false,
  pp:{vorhanden:true, stunden10:"", arbeit:""},
  sb:{status:"", gdb:"", mz:{}, arbeit:false, auto:false, grundsicherung:false},
  genutzt:{}, status:{}, checks:{}, texte:{},
  person:{name:"",geb:"",vnr:"",strasse:"",ort:"",absender:"",beziehung:"",absStrasse:"",absOrt:"",tel:"",mail:""},
}); }
Z.S = blank();
export function isHome() { return ["angehoerige","gemischt","pflegedienst","wg"].includes(Z.S.wohnen); }
export function pg() { return Number(Z.S.pg)||0; }
export function gdb() { return Number(Z.S.sb.gdb)||0; }
export function mz(k) { return !!Z.S.sb.mz[k]; }
export function eur(n, d=0) { return n.toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d})+" €"; }
export function esc(s) { return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// Wer die Ersatzpflege übernimmt (Verhinderungspflege)
export const VHP_ERSATZ={
  angehoerig:{t:"Nahe Angehörige oder Haushaltsmitglied",s:"verwandt/verschwägert bis 2. Grad (z. B. Kind, Enkel, Geschwister, Schwiegerkind) oder wohnt im selben Haushalt"},
  privat:{t:"Andere Privatperson",s:"Nachbarin, Freund, Bekannte, entferntere Verwandte (z. B. Nichte, Cousin)"},
  dienst:{t:"Pflegedienst oder Betreuungsdienst",s:"stellt eine Rechnung"},
  heim:{t:"Kurzzeitpflege im Heim",s:"vorübergehend in einer Einrichtung"},
};
