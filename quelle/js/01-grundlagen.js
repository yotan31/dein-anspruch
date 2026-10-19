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

