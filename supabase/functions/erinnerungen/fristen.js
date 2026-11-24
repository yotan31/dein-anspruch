// Automatisch erzeugt von quelle/bauen.mjs aus quelle/js/logic/fristen-fall.js. Nicht von Hand ändern.
// Nach jeder Änderung an den Fristen die Edge Function „erinnerungen“ neu bereitstellen (siehe README).

// quelle/js/config/betraege.js
var BETRAEGE = Object.freeze({
  jahr: 2026,
  stand: "Leistungsübersicht des Bundesgesundheitsministeriums, Stand 01.01.2026",
  // Pflegeversicherung (SGB XI), Index = Pflegegrad 0–5, Euro pro Monat
  pflegegeld: [0, 0, 347, 599, 800, 990],
  // § 37
  sachleistung: [0, 0, 796, 1497, 1859, 2299],
  // § 36
  tagespflege: [0, 0, 721, 1357, 1685, 2085],
  // § 41
  stationaer: [0, 131, 805, 1319, 1855, 2096],
  // § 43
  rentenbeitrag: [0, 0, 198.62, 316.32, 514.94, 735.63],
  // Rentenbeiträge für die Pflegeperson (Höchstwerte)
  entlastung: 131,
  // § 45b, pro Monat
  jahresbetrag: 3539,
  // § 42a, gemeinsamer Jahresbetrag Verhinderungs- und Kurzzeitpflege
  verbrauch: 42,
  // § 40 Abs. 2, Pflegehilfsmittel zum Verbrauch pro Monat
  wohnumfeld: 4180,
  // § 40 Abs. 4, je Maßnahme
  wg: 224,
  // § 38a, Wohngruppenzuschlag pro Monat
  dipa: 40,
  dipaUnterstuetzung: 30,
  // § 40a/b, digitale Pflegeanwendungen pro Monat
  eingliederungMax: 278,
  // § 43a, Höchstbetrag pro Monat
  heimZuschlag: [15, 30, 50, 75],
  // § 43c, Prozent des Eigenanteils nach 0/12/24/36 Monaten
  kmPauschale: 0.2,
  // Fahrtkosten der Ersatzpflegeperson je km (Verhinderungspflege)
  // Steuer (EStG)
  pflegePauschbetrag: [0, 0, 600, 1100, 1800, 1800],
  // § 33b Abs. 6, pro Jahr nach Pflegegrad
  behindertenPauschbetrag: { 20: 384, 30: 620, 40: 860, 50: 1140, 60: 1440, 70: 1780, 80: 2120, 90: 2460, 100: 2840 },
  // § 33b Abs. 3
  behindertenPauschbetragErhoeht: 7400,
  // § 33b Abs. 3 Satz 3: Merkzeichen H, Bl, TBl oder Pflegegrad 4/5
  // Kinderkrankengeld (§ 45 Abs. 2a SGB V): Arbeitstage je Kind und Elternteil bzw. für Alleinerziehende.
  // 2026 erhöht und befristet bis 31.12.2026. Für 2027 prüfen: ohne Verlängerung wieder 10 bzw. 20 Tage.
  kinderkrankTage: 15,
  kinderkrankTageAllein: 30,
  // Hilfsmittel und Pflegeunterstützungsgeld
  hilfsmittelZuzahlungMax: 25,
  // § 40 Abs. 3 SGB XI: 10 %, höchstens 25 € je Hilfsmittel
  pugTage: 10,
  // § 44a SGB XI: Arbeitstage je Kalenderjahr
  pugProzent: 90,
  // Anteil des ausgefallenen Nettoentgelts
  // Schwerbehinderung
  wertmarkeJahr: 104,
  // § 228 SGB IX, Eigenbeteiligung Wertmarke
  wertmarkeHalbjahr: 53,
  fahrtkostenPauschale: 900,
  // § 33 Abs. 2a EStG
  fahrtkostenPauschaleErhoeht: 4500,
  // aG, Bl, TBl, H oder Pflegegrad 4/5
  // Sonstiges
  rundfunkVoll: 18.36,
  rundfunkErmaessigt: 6.12,
  // Rundfunkbeitrag pro Monat
  elternunterhaltGrenze: 1e5,
  // Jahresbrutto, ab dem Kinder für Heimkosten zahlen
  belastungsgrenzeProzent: 2,
  belastungsgrenzeChronischProzent: 1
  // § 62 SGB V
});

// quelle/js/state/angaben.js
function blank() {
  return {
    step: 0,
    done: false,
    tab: "ansprueche",
    brutto: "",
    bruttoJahr: {},
    chronisch: "",
    welcomeSeen: false,
    bescheid: null,
    entlSeit: "",
    ans: {},
    sent: {},
    wiz: null,
    font: "1",
    belegFilter: { jahre: [], kat: "" },
    vhp: {
      grund: "urlaub",
      art: "tage",
      haupt: "",
      von: "",
      bis: "",
      stunden: "",
      ersatz: "angehoerig",
      eName: "",
      eAdresse: "",
      eBez: "",
      satz: "",
      rechnung: "",
      km: "",
      verdienst: "",
      verbraucht: "",
      auszahlung: "versicherte",
      iban: ""
    },
    termine: { dienst: "", tel: "", besuche: [], eigene: [], wertmarke: "" },
    rolle: "",
    bereiche: { pflege: true, sb: false },
    ziel: "",
    empfAdr: {},
    kasse: "",
    aokRegion: "",
    kasseAndere: "",
    pg: "",
    wohnen: "",
    verschlechtert: false,
    pp: { vorhanden: true, stunden10: "", arbeit: "" },
    sb: { status: "", gdb: "", mz: {}, arbeit: false, auto: false, grundsicherung: false },
    genutzt: {},
    status: {},
    /** abgelehnte Anträge: Leistung → { datum: Datum auf dem Bescheid, widerspruch: abgeschickt am } */
    ablehnung: {},
    /** letzte Antworten des Pflegegrad-Rechners (für das Vorbereitungsblatt zum Gutachter-Termin) */
    rechner: [],
    /** Jahr, dessen Rückblick weggeklickt wurde */
    rueckblick: 0,
    /** Ohne Konto: Hinweis „nur auf diesem Gerät“ erledigt am (Sicherung geladen oder weggeklickt), sonst "" */
    sicherungHinweis: "",
    /** Geht es um ein Kind? "" (nicht gefragt), "erw" (erwachsen), "baby" (bis 18 Monate), "kind" (bis 10 Jahre), "jugend" (11–17) */
    kindAlter: "",
    checks: {},
    texte: {},
    person: {
      /** eigenes Konto für Erstattungen: einmal eingegeben, in weiteren Anträgen vorbelegt */
      iban: "",
      name: "",
      geb: "",
      vnr: "",
      strasse: "",
      ort: "",
      absender: "",
      beziehung: "",
      absStrasse: "",
      absOrt: "",
      tel: "",
      mail: ""
    }
  };
}
function merge(d) {
  const b = blank();
  const m = {
    ...b,
    ...d,
    bereiche: { ...b.bereiche, ...d.bereiche || {} },
    pp: { ...b.pp, ...d.pp || {} },
    sb: { ...b.sb, ...d.sb || {}, mz: { ...d.sb && d.sb.mz || {} } },
    person: { ...b.person, ...d.person || {} },
    termine: { ...b.termine, ...d.termine || {} },
    belegFilter: { ...b.belegFilter, ...d.belegFilter || {} },
    vhp: { ...b.vhp, ...d.vhp || {} },
    bruttoJahr: { ...d.bruttoJahr || {} },
    ans: { ...d.ans || {} },
    sent: { ...d.sent || {} },
    ablehnung: { ...d.ablehnung || {} }
  };
  if (d.done === void 0) m.done = (d.step || 0) >= 6 && !!d.rolle;
  delete m.updated;
  return m;
}

// quelle/js/state/zustand.js
var Z = {
  /* ---------- Angaben der Familie (werden gespeichert) ---------- */
  /** Fragebogen, Anträge, Status, Termine – Aufbau siehe blank() */
  S: blank(),
  /* ---------- Anmeldung und Speicher (services/speicher.js, services/anmeldung.js) ---------- */
  /** @type {any} Supabase-Verbindung, null ohne Internet oder vor dem Start */
  sb: null,
  /** @type {any} angemeldetes Konto */
  USER: null,
  /** Nutzung ohne Konto: Angaben bleiben im Browser */
  GUEST: false,
  /** Link „Passwort zurücksetzen“ geöffnet: erst neues Passwort festlegen */
  RECOVERY: false,
  /** erster Ladevorgang abgeschlossen */
  loaded: false,
  authMsg: "",
  /** "login" | "register" | "forgot" */
  authMode: "login",
  authBusy: false,
  /** Anmeldeformular statt Startseite zeigen */
  zeigeAnmeldung: false,
  /** Einladung erst später annehmen: Startseite trotz Einladungscode zeigen */
  einladungSpaeter: false,
  consentBusy: false,
  /** @type {any} Speicherort der Angaben (Datenbank oder Browser) */
  ref: null,
  /** @type {any} Zugriff auf die Belege-Tabelle */
  BCOL: null,
  /** @type {any} Zugriff auf den Fotospeicher (nur mit Konto) */
  ASSETS: null,
  /** @type {any} Zeitgeber für verzögertes Speichern */
  saveTimer: null,
  /** Kette der Schreibvorgänge, damit nichts überholt wird */
  writing: Promise.resolve(),
  canSave: false,
  /** Anzeige oben rechts: Farbe c, Text t */
  saveState: { c: "", t: "Verbinde …" },
  /** @type {Record<string,string>} vorab geladene Foto-Adressen */
  URLS: {},
  /* ---------- Personen und Familie ---------- */
  /** @type {any[]} Fälle (Personen), auf die das Konto Zugriff hat */
  FAELLE: [],
  /** @type {any} geöffneter Fall */
  FALL_ID: null,
  /** @type {any[]} Mitglieder des geöffneten Falls */
  MEMBERS: [],
  showPersons: false,
  inviteLink: "",
  inviteBusy: false,
  delPersonAsk: false,
  /* ---------- Belege ---------- */
  /** @type {any[]} Belege aus der Datenbank bzw. dem Browser */
  BEL: [],
  /** @type {any} Beleg, der gerade erfasst wird */
  pending: null,
  /** @type {any} Beleg-ID, deren Löschen bestätigt werden soll */
  delAsk: null,
  busy: false,
  /** @type {any} Ziel des nächsten Datei-Uploads */
  fileTarget: null,
  /** Jahr für den Befreiungsantrag */
  befJahr: String((/* @__PURE__ */ new Date()).getFullYear()),
  /** @type {any} Sammel-PDF: {phase:"lesen"|"pruefen"|"speichern", n, total, items, pdf, file, pages} */
  bulk: null,
  /** @type {any} pdf.js, einmal geladen */
  pdfjsP: null,
  /* ---------- Bescheid und Rechner ---------- */
  ocrBusy: false,
  ocrMsg: "",
  /** @type {any} Bescheid, der gerade abgetippt bzw. geprüft wird */
  bescheidDraft: null,
  /** @type {any} Pflegegrad-Rechner: {i, a:[]} */
  RECHNER: null,
  /* ---------- Darstellung und Bedienung ---------- */
  /** aktive Sprache, siehe i18n/uebersetzungen.js */
  LANG: "de",
  /** Filter der Ansprüche-Liste */
  areaFilter: "Alle",
  /** @type {any} geöffnete Leistung */
  openKey: null,
  showMenu: false,
  /** Sprachauswahl hinter der Weltkugel offen */
  showSprache: false,
  /** @type {Record<string,boolean>} geöffnete aufklappbare Bereiche */
  akk: {},
  /** @type {any} zuletzt gezeichnete Ansicht, für Bildschirmwechsel */
  lastFam: null,
  lastIdx: 0,
  /** @type {any} Zeitgeber der Kurzmeldung (toast) */
  tT: void 0,
  /** zuletzt gezeigter Eingabe-Hinweis, damit ein zweites „Weiter“ die Angabe übernimmt */
  warnKey: "",
  /** @type {any} Schutz gegen Doppeltippen: {k, t} */
  letzterKlick: null,
  /* ---------- Sicherung, Erinnerungen, Fehler, Installation ---------- */
  wipeAsk: false,
  wipeBusy: false,
  dataBusy: "",
  /** @type {any} E-Mail-Erinnerungen des Kontos */
  ERI: null,
  eriLoaded: false,
  /** Anzahl gemeldeter Fehler, begrenzt pro Sitzung */
  errN: 0,
  /** @type {any} vom Browser angebotene Installation */
  installPrompt: null
};

// quelle/js/logic/lage.js
function isHome() {
  return ["angehoerige", "gemischt", "pflegedienst", "wg"].includes(Z.S.wohnen);
}
function istKind() {
  return Z.S.rolle === "angehoerig" && ["baby", "kind", "jugend"].includes(Z.S.kindAlter);
}
function pg() {
  return Number(Z.S.pg) || 0;
}
function gdb() {
  return Number(Z.S.sb.gdb) || 0;
}
function mz(k) {
  return !!Z.S.sb.mz[k];
}

// quelle/js/utils/format.js
function eur(n, d = 0) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
}
function numDE(x) {
  return Number(
    String(x ?? "").replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")
  ) || 0;
}

// quelle/js/logic/belege.js
var KATS = {
  apo: { t: "Zuzahlung Apotheke / Rezept", zz: true },
  fahrt: { t: "Zuzahlung Fahrten", zz: true },
  heil: { t: "Zuzahlung Therapie, Hilfsmittel, Klinik", zz: true },
  entl: { t: "Entlastungsbetrag (Rechnungen)" },
  vhp: { t: "Verhinderungs- & Kurzzeitpflege" },
  pflhm: { t: "Pflegehilfsmittel" },
  beratung: { t: "Nachweis Beratungsbesuch" },
  bescheid: { t: "Bescheide & Schreiben" },
  sonst: { t: "Sonstiges" }
};

// quelle/js/utils/datum.js
function TODAY() {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseIso(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function deD(d) {
  return d.toLocaleDateString("de-DE");
}
function daysUntil(d) {
  return Math.round((+d - +TODAY()) / 864e5);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function halfOf(d) {
  const h = d.getMonth() < 6 ? 1 : 2;
  const y = d.getFullYear();
  return {
    y,
    h,
    start: new Date(y, h === 1 ? 0 : 6, 1),
    end: new Date(y, h === 1 ? 5 : 11, h === 1 ? 30 : 31),
    label: `${h}. Halbjahr ${y}`
  };
}
function shiftHalf(H, n) {
  let y = H.y, h = H.h + n;
  while (h > 2) {
    h -= 2;
    y++;
  }
  while (h < 1) {
    h += 2;
    y--;
  }
  return halfOf(new Date(y, h === 1 ? 0 : 6, 1));
}

// quelle/js/logic/bescheid.js
var PG_GRENZEN = [12.5, 27, 47.5, 70, 90];
function pgAusPunkten(p) {
  let g = 0;
  PG_GRENZEN.forEach((t, i) => {
    if (p >= t) g = i + 1;
  });
  return g;
}
function bescheidInfo() {
  const b = Z.S.bescheid;
  if (!b) return null;
  const pts = numDE(b.punkte), hasPts = String(b.punkte || "").trim() !== "";
  const g = Number(b.pg) || (hasPts ? pgAusPunkten(pts) : 0);
  const next = g < 5 ? PG_GRENZEN[g] : null;
  const fehlt = hasPts && next != null ? Math.max(0, next - pts) : null;
  const ein = parseIso(b.eingang);
  let frist = null;
  if (ein) {
    frist = new Date(ein);
    frist.setMonth(frist.getMonth() + 1);
  }
  const knapp = fehlt != null && fehlt <= 7.5;
  const abgelehnt = g === 0 && (hasPts || b.art === "ablehnung");
  return { g, pts, hasPts, next, fehlt, frist, knapp, abgelehnt, offen: frist && daysUntil(frist) >= 0 };
}

// quelle/js/config/stammdaten.js
var PG = {
  pflegegeld: BETRAEGE.pflegegeld,
  sachleistung: BETRAEGE.sachleistung,
  tagespflege: BETRAEGE.tagespflege,
  stationaer: BETRAEGE.stationaer,
  rv: BETRAEGE.rentenbeitrag,
  pflegePausch: BETRAEGE.pflegePauschbetrag
};
var ENTLASTUNG = BETRAEGE.entlastung;
var JAHRESBETRAG = BETRAEGE.jahresbetrag;
var VERBRAUCH = BETRAEGE.verbrauch;
var WOHNUMFELD = BETRAEGE.wohnumfeld;
var WG = BETRAEGE.wg;
var DIPA = BETRAEGE.dipa;
var DIPA_UL = BETRAEGE.dipaUnterstuetzung;
var BEHPAUSCH = BETRAEGE.behindertenPauschbetrag;

// quelle/js/logic/verhinderungspflege.js
var KM_SATZ = BETRAEGE.kmPauschale;
var VHP_GRUND = {
  urlaub: "Urlaub",
  krank: "Krankheit",
  kur: "Kur oder Reha",
  termine: "Termine, Erholung oder andere wichtige Gründe"
};
function vhpCalc() {
  const v = Z.S.vhp, rest = Math.max(0, JAHRESBETRAG - numDE(v.verbraucht));
  const basis = v.ersatz === "dienst" || v.ersatz === "heim" ? numDE(v.rechnung) : numDE(v.stunden) * numDE(v.satz);
  const cap = v.ersatz === "angehoerig" ? PG.pflegegeld[pg()] * 2 : rest;
  const pflege = basis ? Math.min(basis, cap) : 0;
  const fahrt = v.ersatz === "heim" ? 0 : numDE(v.km) * KM_SATZ;
  const verd = v.ersatz === "angehoerig" ? numDE(v.verdienst) : 0;
  const total = Math.min(rest, pflege + fahrt + verd);
  return { rest, basis, cap, pflege, fahrt, verd, total, gekappt: basis > cap };
}
function vhpDocs() {
  const v = Z.S.vhp, d = [];
  if (v.ersatz === "heim")
    d.push("Rechnung der Kurzzeitpflege-Einrichtung (Zeitraum, Pflegekosten getrennt von Unterkunft/Verpflegung)");
  else if (v.ersatz === "dienst") d.push("Rechnung des Pflegedienstes mit Zeitraum und erbrachten Leistungen");
  else
    d.push(
      `Unterschriebene ${v.ersatz === "angehoerig" ? "Bestätigung" : "Quittung"} der Ersatzpflegeperson mit Zeitraum, Stunden und Betrag (Vorlage als PDF)`
    );
  if (v.ersatz !== "heim" && numDE(v.km))
    d.push("Fahrtkosten-Aufstellung: Datum, Strecke von–nach, Kilometer je Fahrt");
  if (v.ersatz === "angehoerig" && numDE(v.verdienst))
    d.push("Nachweis Verdienstausfall: Bescheinigung des Arbeitgebers über unbezahlten Urlaub oder Lohnabrechnung");
  if (v.grund === "krank") d.push("Optional: Krankmeldung der Hauptpflegeperson (manche Kassen fragen danach)");
  if (v.auszahlung === "ersatz") d.push("Kontoverbindung der Ersatzpflegeperson");
  return d;
}
function vhpZeitraum() {
  const a = parseIso(Z.S.vhp.von), b = parseIso(Z.S.vhp.bis);
  return a ? b && +b !== +a ? `vom ${deD(a)} bis ${deD(b)}` : `am ${deD(a)}` : "im Zeitraum [von – bis]";
}
function vhpAsk() {
  const v = Z.S.vhp, c = vhpCalc(), zr = vhpZeitraum();
  const pay = `Bitte überweisen Sie den Erstattungsbetrag ${v.auszahlung === "ersatz" ? `direkt an die Ersatzpflegeperson ${v.eName || "[Name]"}, IBAN: ${v.iban || "[IBAN]"}` : `auf folgendes Konto: ${v.iban || "[IBAN]"}`}.`;
  if (v.ersatz === "heim")
    return `beantrage ich hiermit Leistungen der Kurzzeitpflege nach § 42 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI. Die Kurzzeitpflege erfolgte ${zr} in der Einrichtung ${v.eName || "[Name der Einrichtung]"}${v.eAdresse ? ", " + v.eAdresse : ""}. Die Rechnung${c.basis ? ` über ${eur(c.basis, 2)}` : ""} liegt bei. Sofern die Einrichtung nicht direkt mit Ihnen abrechnet: ${pay}`;
  const who = v.ersatz === "angehoerig" ? ` (${v.eBez || "[Verwandtschaftsverhältnis, z. B. Tochter]"})` : v.ersatz === "dienst" ? " (Pflegedienst)" : " (nicht verwandt, nicht erwerbsmäßig)";
  let kosten;
  if (v.ersatz === "dienst") kosten = `- Rechnung des Pflegedienstes: ${c.basis ? eur(c.basis, 2) : "[Betrag]"}`;
  else if (numDE(v.stunden) && numDE(v.satz))
    kosten = `- Ersatzpflege: ${numDE(v.stunden)} Stunden × ${eur(numDE(v.satz), 2)} = ${eur(c.basis, 2)}${c.gekappt ? ` (erstattungsfähig bis ${eur(c.cap, 2)})` : ""}`;
  else
    kosten = `- Ersatzpflege: [Stunden] × [Stundensatz] = [Betrag]${v.ersatz === "angehoerig" ? ` (höchstens das 2-fache Pflegegeld, ${eur(PG.pflegegeld[pg()] * 2)})` : ""}`;
  if (c.fahrt) kosten += `
- Fahrtkosten: ${numDE(v.km)} km × ${eur(KM_SATZ, 2)} = ${eur(c.fahrt, 2)}`;
  if (c.verd) kosten += `
- Verdienstausfall: ${eur(c.verd, 2)}`;
  if (c.total) kosten += `
Beantragter Betrag insgesamt: ${eur(c.total, 2)}`;
  const stunden = v.art === "stunden" ? `

Die Ersatzpflege erfolgte stundenweise (Verhinderung unter 8 Stunden am Tag). Ich bitte daher um ungekürzte Weiterzahlung des Pflegegeldes.` : "";
  return `beantrage ich hiermit die Erstattung von Kosten der Verhinderungspflege nach § 39 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI.

Die Hauptpflegeperson ${v.haupt || "[Name]"} war ${zr} wegen ${v.grund === "termine" ? "anderer wichtiger Gründe (z. B. Arzttermine, Erholung)" : VHP_GRUND[v.grund] || "[Grund]"} an der Pflege gehindert. In dieser Zeit hat die Pflege übernommen: ${v.eName || "[Name]"}, ${v.eAdresse || "[Anschrift]"}${who}.${stunden}

Aufwendungen:
${kosten}

${pay} Die Nachweise liegen bei.`;
}

// quelle/js/logic/leistungen.js
var PK = "pflegekasse";
var KK = "krankenkasse";
var VA = "versorgungsamt";
var FA = "finanzamt";
function fahrtGenehmigt() {
  return pg() >= 4 || mz("aG") || mz("Bl") || mz("H");
}
var B = [
  {
    k: "pg_antrag",
    area: "Pflege",
    t: "Pflegegrad beantragen",
    p: "§ 14, § 18 SGB XI",
    when: () => Z.S.bereiche.pflege && pg() === 0,
    val: () => null,
    short: "Ohne Pflegegrad gibt es keine Leistungen der Pflegekasse. Leistungen gelten ab dem Monat der Antragstellung.",
    steps: [
      "Antrag formlos bei der Pflegekasse stellen (Brief, E-Mail oder App). Das Datum zählt ab sofort.",
      "Pflegetagebuch über 1–2 Wochen führen: Was klappt nicht mehr allein?",
      "Begutachtung durch den Medizinischen Dienst zu Hause, Angehörige dabei sein.",
      "Bescheid prüfen. Gegen eine zu niedrige Einstufung innerhalb eines Monats Widerspruch einlegen."
    ],
    docs: [
      "Versichertenkarte/Versichertennummer",
      "Arztberichte, Medikamentenplan",
      "Pflegetagebuch",
      "Vollmacht (wenn Angehörige den Antrag stellen)"
    ],
    to: PK,
    ask: "beantrage ich hiermit die Feststellung der Pflegebedürftigkeit und Leistungen der Pflegeversicherung nach dem SGB XI. Bitte beauftragen Sie den Medizinischen Dienst mit der Begutachtung und bieten Sie mir eine Pflegeberatung nach § 7a SGB XI an."
  },
  {
    k: "pg_hoch",
    area: "Pflege",
    t: "Höheren Pflegegrad beantragen",
    p: "§ 14, § 18 SGB XI",
    when: () => Z.S.bereiche.pflege && pg() >= 1 && pg() < 5,
    val: () => null,
    opt: true,
    short: () => `Wenn der Hilfebedarf gestiegen ist. Pflegegrad ${pg() + 1} bringt z. B. ${eur(PG.pflegegeld[pg() + 1] - PG.pflegegeld[pg()])} mehr Pflegegeld im Monat.`,
    steps: [
      "Änderungen der letzten Monate notieren (Stürze, Demenz, nächtliche Hilfe, Inkontinenz).",
      "Antrag auf Höherstufung formlos stellen.",
      "Neue Begutachtung vorbereiten: Pflegetagebuch, aktuelle Arztberichte.",
      "Bescheid prüfen, ggf. Widerspruch innerhalb eines Monats."
    ],
    docs: ["aktuelle Arztberichte", "Pflegetagebuch", "Bisheriger Pflegegrad-Bescheid"],
    to: PK,
    ask: "beantrage ich hiermit eine Höherstufung des Pflegegrades, da sich der Hilfebedarf deutlich erhöht hat. Bitte veranlassen Sie eine erneute Begutachtung durch den Medizinischen Dienst."
  },
  {
    k: "pflegegeld",
    area: "Pflege",
    t: "Pflegegeld",
    p: "§ 37 SGB XI",
    cash: true,
    when: () => pg() >= 2 && ["angehoerige", "gemischt", "wg"].includes(Z.S.wohnen),
    val: () => PG.pflegegeld[pg()] * 12,
    mon: () => PG.pflegegeld[pg()],
    short: () => `${eur(PG.pflegegeld[pg()])} im Monat, frei verwendbar für pflegende Angehörige. Mit Pflegedienst anteilig als Kombinationsleistung (§ 38).`,
    steps: [
      "Pflegegeld bei der Pflegekasse beantragen und Pflegeperson benennen.",
      "Kontoverbindung angeben.",
      "Halbjährlichen Beratungsbesuch nach § 37 Abs. 3 einplanen, sonst wird das Pflegegeld gekürzt."
    ],
    docs: ["Name und Anschrift der Pflegeperson(en)", "IBAN"],
    to: PK,
    ask: () => `beantrage ich hiermit Pflegegeld nach § 37 SGB XI (bei gleichzeitiger Nutzung eines Pflegedienstes als Kombinationsleistung nach § 38 SGB XI). Die Pflege übernimmt: [Name der Pflegeperson]. Bitte überweisen Sie das Pflegegeld auf folgendes Konto: [IBAN].`
  },
  {
    k: "sachleistung",
    area: "Pflege",
    t: "Pflegesachleistung (Pflegedienst)",
    p: "§ 36, § 38 SGB XI",
    when: () => pg() >= 2 && isHome(),
    val: () => null,
    mon: () => PG.sachleistung[pg()],
    short: () => `Bis ${eur(PG.sachleistung[pg()])} im Monat für einen zugelassenen Pflegedienst. Ungenutztes Budget wird als anteiliges Pflegegeld ausgezahlt.`,
    steps: [
      "Zugelassenen Pflegedienst auswählen (Preisvergleichsliste der Pflegekasse).",
      "Pflegevertrag abschließen, der Dienst rechnet direkt mit der Kasse ab.",
      "Bei Kombination mit Pflegegeld: Kombinationsleistung beantragen.",
      "Bis zu 40 % des Budgets dürfen in Angebote zur Unterstützung im Alltag umgewandelt werden (§ 45a Abs. 4)."
    ],
    docs: ["Kostenvoranschlag/Pflegevertrag des Pflegedienstes"],
    to: PK,
    ask: "beantrage ich hiermit Pflegesachleistungen nach § 36 SGB XI bzw. die Kombinationsleistung nach § 38 SGB XI. Die Versorgung übernimmt der Pflegedienst: [Name des Pflegedienstes]."
  },
  {
    k: "entlastung",
    area: "Pflege",
    t: "Entlastungsbetrag",
    p: "§ 45b SGB XI",
    cash: true,
    when: () => pg() >= 1 && isHome(),
    val: () => ENTLASTUNG * 12,
    mon: () => ENTLASTUNG,
    short: `${ENTLASTUNG} € im Monat (${eur(ENTLASTUNG * 12)} im Jahr) für Haushaltshilfe, Alltagsbegleitung, Tagespflege oder Kurzzeitpflege. Wird als Erstattung gegen Rechnung gezahlt.`,
    steps: [
      "Anerkannten Anbieter für Unterstützung im Alltag suchen (Liste bei der Pflegekasse, in BW auch Nachbarschaftshilfe).",
      "Rechnung an die Pflegekasse schicken oder Abtretungserklärung unterschreiben, dann rechnet der Anbieter direkt ab.",
      "Nicht genutzte Beträge werden ins nächste Halbjahr übertragen und verfallen am 30. Juni des Folgejahres."
    ],
    docs: ["Rechnungen des anerkannten Anbieters", "ggf. Abtretungserklärung"],
    to: PK,
    ask: "beantrage ich hiermit die Erstattung von Aufwendungen aus dem Entlastungsbetrag nach § 45b SGB XI. Die Rechnungen des anerkannten Anbieters [Name] liegen bei. Bitte teilen Sie mir außerdem mit, wie hoch das noch verfügbare Guthaben aus dem Vorjahr ist."
  },
  {
    k: "jahresbetrag",
    area: "Pflege",
    t: "Verhinderungs- und Kurzzeitpflege",
    p: "§ 39, § 42, § 42a SGB XI",
    cash: true,
    when: () => pg() >= 2 && isHome(),
    val: () => JAHRESBETRAG,
    short: () => `Gemeinsamer Jahresbetrag von ${eur(JAHRESBETRAG)} für Ersatzpflege, wenn die Hauptpflegeperson verhindert ist (Urlaub, Krankheit, Auszeit), und für Kurzzeitpflege im Heim. Durch nahe Angehörige bis ${eur(PG.pflegegeld[pg()] * 2)} plus nachgewiesene Kosten.`,
    steps: [
      "Unten ausfüllen: Wer pflegt sonst, wer war verhindert, wer hat in dieser Zeit gepflegt.",
      "Belege sammeln (Beispiele siehe unten). Für Privatpersonen reicht eine unterschriebene Quittung, die Vorlage gibt es hier als PDF.",
      "Antrag mit Belegen an die Pflegekasse schicken. Seit 2026 ist kein Antrag vorab nötig.",
      "Frist: spätestens bis 31.12. des Folgejahres (Ausschlussfrist)."
    ],
    docs: () => vhpDocs(),
    to: PK,
    ask: () => vhpAsk()
  },
  {
    k: "tagespflege",
    area: "Pflege",
    t: "Tages- oder Nachtpflege",
    p: "§ 41 SGB XI",
    when: () => pg() >= 2 && isHome(),
    val: () => null,
    mon: () => PG.tagespflege[pg()],
    short: () => `Eigenes Budget bis ${eur(PG.tagespflege[pg()])} im Monat, zusätzlich zu Pflegegeld oder Pflegedienst. Ideal, wenn Angehörige berufstätig sind.`,
    steps: [
      "Tagespflege in der Nähe suchen und Probetag vereinbaren.",
      "Antrag auf teilstationäre Pflege stellen.",
      "Pflegekosten zahlt die Kasse bis zum Budget, Verpflegung und Fahrten teils selbst (dafür Entlastungsbetrag nutzbar)."
    ],
    docs: ["Angebot/Vertrag der Tagespflege"],
    to: PK,
    ask: "beantrage ich hiermit Leistungen der Tages- und Nachtpflege nach § 41 SGB XI in der Einrichtung [Name der Tagespflege] ab dem [Datum]."
  },
  {
    k: "verbrauch",
    area: "Pflege",
    t: "Pflegehilfsmittel zum Verbrauch",
    p: "§ 40 Abs. 2 SGB XI",
    cash: true,
    when: () => pg() >= 1 && isHome(),
    val: () => VERBRAUCH * 12,
    mon: () => VERBRAUCH,
    short: `Bis ${VERBRAUCH} € im Monat für Handschuhe, Desinfektion, Bettschutzeinlagen, Mundschutz. Viele Anbieter liefern monatlich kostenlos.`,
    steps: [
      "Anbieter (Apotheke, Sanitätshaus oder Versand) wählen.",
      "Antrag auf Kostenübernahme unterschreiben, der Anbieter reicht ihn meist ein.",
      "Box wird jeden Monat geliefert, keine Zuzahlung."
    ],
    docs: ["Antragsformular des Anbieters oder dieses Schreiben"],
    to: PK,
    ask: "beantrage ich hiermit die Kostenübernahme für zum Verbrauch bestimmte Pflegehilfsmittel nach § 40 Abs. 2 SGB XI bis zur Höhe von 42 Euro monatlich. Die Versorgung soll erfolgen durch: [Anbieter]."
  },
  {
    k: "technisch",
    area: "Pflege",
    t: "Hausnotruf, Pflegebett & technische Hilfsmittel",
    p: "§ 40 Abs. 1 SGB XI",
    when: () => pg() >= 1 && isHome(),
    val: () => null,
    short: `Pflegekasse übernimmt die Kosten, Zuzahlung höchstens 10 %, maximal ${BETRAEGE.hilfsmittelZuzahlungMax} € je Hilfsmittel. Hausnotruf wird in der Regel monatlich bezuschusst.`,
    steps: [
      "Bedarf klären: Hausnotruf, Pflegebett, Lagerungshilfen, Rollator (bei Krankheit über die Krankenkasse).",
      "Kostenvoranschlag beim Sanitätshaus oder Hausnotruf-Anbieter holen.",
      "Antrag mit Kostenvoranschlag einreichen. Erst nach Bewilligung bestellen."
    ],
    docs: ["Kostenvoranschlag", "Empfehlung aus dem MD-Gutachten (falls vorhanden)"],
    to: PK,
    ask: "beantrage ich hiermit die Versorgung mit folgendem technischen Pflegehilfsmittel nach § 40 Abs. 1 SGB XI: [Hilfsmittel, z. B. Hausnotruf / Pflegebett]. Ein Kostenvoranschlag liegt bei."
  },
  {
    k: "wohnumfeld",
    area: "Pflege",
    t: "Zuschuss zum Wohnungsumbau",
    p: "§ 40 Abs. 4 SGB XI",
    when: () => pg() >= 1 && isHome(),
    val: () => null,
    once: WOHNUMFELD,
    short: `Bis ${eur(WOHNUMFELD)} je Maßnahme, z. B. bodengleiche Dusche, Treppenlift, Türverbreiterung. Wohnen mehrere Pflegebedürftige zusammen, bis ${eur(WOHNUMFELD * 4)}.`,
    steps: [
      "Umbau planen, zwei Angebote einholen.",
      "Antrag VOR Baubeginn stellen.",
      "Nach Bewilligung bauen lassen und Rechnung einreichen."
    ],
    docs: ["Kostenvoranschläge", "Fotos der Ist-Situation", "Einverständnis des Vermieters (bei Miete)"],
    to: PK,
    ask: "beantrage ich hiermit einen Zuschuss für Maßnahmen zur Verbesserung des individuellen Wohnumfeldes nach § 40 Abs. 4 SGB XI für folgende Maßnahme: [z. B. Umbau der Badewanne zu einer bodengleichen Dusche]. Kostenvoranschläge liegen bei."
  },
  {
    k: "dipa",
    area: "Pflege",
    t: "Digitale Pflegeanwendungen (DiPA)",
    p: "§ 40a, § 40b SGB XI",
    when: () => pg() >= 1 && isHome(),
    val: () => null,
    mon: () => DIPA + DIPA_UL,
    short: `Bis ${DIPA} € im Monat für eine zugelassene Pflege-App plus ${DIPA_UL} € für ergänzende Unterstützung durch einen Pflegedienst.`,
    steps: [
      "Zugelassene DiPA im BfArM-Verzeichnis aussuchen.",
      "Antrag bei der Pflegekasse stellen.",
      "Freischaltcode nach Bewilligung erhalten."
    ],
    docs: ["Name der DiPA"],
    to: PK,
    ask: "beantrage ich hiermit die Versorgung mit der digitalen Pflegeanwendung [Name] nach § 40a SGB XI sowie ergänzende Unterstützungsleistungen nach § 39a SGB XI."
  },
  {
    k: "wg",
    area: "Pflege",
    t: "Wohngruppenzuschlag",
    p: "§ 38a SGB XI",
    cash: true,
    when: () => pg() >= 1 && Z.S.wohnen === "wg",
    val: () => WG * 12,
    mon: () => WG,
    short: `${WG} € im Monat pauschal für Bewohner ambulant betreuter Wohngruppen.`,
    steps: ["Antrag stellen mit Nachweis über die Wohngruppe und die beauftragte Präsenzkraft."],
    docs: ["Mietvertrag der WG", "Vereinbarung mit der Präsenzkraft"],
    to: PK,
    ask: "beantrage ich hiermit den Wohngruppenzuschlag nach § 38a SGB XI für die ambulant betreute Wohngruppe [Name, Anschrift]."
  },
  {
    k: "beratung",
    area: "Pflege",
    t: "Kostenlose Pflegeberatung",
    p: "§ 7a SGB XI",
    when: () => Z.S.bereiche.pflege,
    val: () => null,
    short: "Persönliche Beratung durch die Pflegekasse oder den Pflegestützpunkt, auf Wunsch zu Hause. Sinnvoll, um alle Budgets zu planen.",
    steps: ["Termin bei der Pflegekasse oder dem Pflegestützpunkt vereinbaren.", "Diese Ergebnisliste mitnehmen."],
    docs: ["Pflegegrad-Bescheid"],
    to: PK,
    ask: "bitte ich um einen Termin für eine individuelle Pflegeberatung nach § 7a SGB XI, gern bei mir zu Hause."
  },
  {
    k: "pflegekurs",
    area: "Pflege",
    t: "Kostenloser Pflegekurs für Angehörige",
    p: "§ 45 SGB XI",
    when: () => Z.S.bereiche.pflege && Z.S.rolle === "angehoerig",
    val: () => null,
    short: "Kurse und häusliche Schulungen für pflegende Angehörige, auch online. Kostenlos.",
    steps: ["Kursangebot bei der Pflegekasse erfragen oder online buchen."],
    docs: [],
    to: PK,
    ask: "bitte ich um Informationen zu kostenlosen Pflegekursen bzw. einer häuslichen Schulung nach § 45 SGB XI für pflegende Angehörige."
  },
  {
    k: "rv",
    area: "Pflegeperson",
    t: "Rentenbeiträge für die Pflegeperson",
    p: "§ 44 SGB XI",
    when: () => pg() >= 2 && isHome() && Z.S.wohnen !== "pflegedienst" && Z.S.pp.stunden10 === "ja" && Z.S.pp.arbeit !== "ueber30",
    val: () => null,
    mon: () => PG.rv[pg()],
    short: () => `Die Pflegekasse zahlt bis ${eur(PG.rv[pg()], 2)} im Monat in die Rentenversicherung der Pflegeperson, dazu Arbeitslosen- und Unfallversicherung.`,
    steps: [
      "Fragebogen zur Zahlung der Beiträge zur sozialen Sicherung für Pflegepersonen bei der Pflegekasse anfordern.",
      "Pflegezeit angeben: mind. 10 Stunden an mind. 2 Tagen pro Woche, Pflegeperson arbeitet höchstens 30 Stunden.",
      "Rentenkonto später prüfen."
    ],
    docs: ["Angaben zur Pflegeperson (Rentenversicherungsnummer, Arbeitszeit)"],
    to: PK,
    ask: "beantrage ich hiermit die Zahlung von Beiträgen zur Renten- und Arbeitslosenversicherung für die Pflegeperson [Name, Rentenversicherungsnummer] nach § 44 SGB XI. Die Pflege umfasst mindestens 10 Stunden an mindestens 2 Tagen pro Woche. Bitte senden Sie mir den entsprechenden Fragebogen zu."
  },
  {
    k: "pug",
    area: "Pflegeperson",
    t: "Pflegeunterstützungsgeld bei akuter Pflegesituation",
    p: "§ 44a SGB XI, § 2 PflegeZG",
    when: () => Z.S.bereiche.pflege && Z.S.pp.arbeit && Z.S.pp.arbeit !== "nein",
    val: () => null,
    opt: true,
    short: `Berufstätige Angehörige können bis zu ${BETRAEGE.pugTage} Arbeitstage im Jahr freinehmen und erhalten ${BETRAEGE.pugProzent} % des Nettolohns von der Pflegekasse.`,
    steps: [
      "Arbeitgeber sofort über die Freistellung informieren.",
      "Ärztliche Bescheinigung über die akute Pflegesituation holen.",
      "Antrag bei der Pflegekasse des Pflegebedürftigen stellen."
    ],
    docs: ["ärztliche Bescheinigung", "Entgeltbescheinigung des Arbeitgebers"],
    to: PK,
    ask: "beantrage ich hiermit Pflegeunterstützungsgeld nach § 44a Abs. 3 SGB XI für die kurzzeitige Arbeitsverhinderung der Pflegeperson [Name] im Zeitraum [von – bis]. Die ärztliche Bescheinigung liegt bei."
  },
  {
    k: "pflegepausch",
    area: "Steuer",
    t: "Pflege-Pauschbetrag in der Steuererklärung",
    p: "§ 33b Abs. 6 EStG",
    when: () => pg() >= 2 && isHome() && Z.S.rolle === "angehoerig",
    val: () => null,
    frei: () => PG.pflegePausch[pg()],
    short: () => `Pflegende Angehörige können ${eur(PG.pflegePausch[pg()])} pro Jahr steuerlich absetzen, wenn sie unentgeltlich pflegen.`,
    steps: [
      "In der Einkommensteuererklärung (Anlage Außergewöhnliche Belastungen) eintragen.",
      "Pflegegrad-Bescheid und Steuer-ID der gepflegten Person bereithalten."
    ],
    docs: ["Pflegegrad-Bescheid", "Steuer-ID der gepflegten Person"],
    to: FA
  },
  {
    k: "stationaer",
    area: "Pflegeheim",
    t: "Leistungsbetrag vollstationäre Pflege",
    p: "§ 43 SGB XI",
    when: () => pg() >= 1 && Z.S.wohnen === "heim",
    val: () => null,
    mon: () => PG.stationaer[pg()],
    short: () => `${eur(PG.stationaer[pg()])} im Monat zahlt die Pflegekasse direkt ans Heim.`,
    steps: ["Heimvertrag an die Pflegekasse schicken, das Heim rechnet direkt ab."],
    docs: ["Heimvertrag"],
    to: PK,
    ask: "beantrage ich hiermit Leistungen der vollstationären Pflege nach § 43 SGB XI in der Einrichtung [Name des Heims] ab dem [Datum]."
  },
  {
    k: "zuschlag",
    area: "Pflegeheim",
    t: "Leistungszuschlag zum Eigenanteil prüfen",
    p: "§ 43c SGB XI",
    when: () => pg() >= 2 && Z.S.wohnen === "heim",
    val: () => null,
    short: `Die Kasse übernimmt ${BETRAEGE.heimZuschlag[0]} % des pflegebedingten Eigenanteils, nach 12 Monaten ${BETRAEGE.heimZuschlag[1]} %, nach 24 Monaten ${BETRAEGE.heimZuschlag[2]} %, nach 36 Monaten ${BETRAEGE.heimZuschlag[3]} %. Frühere Heimaufenthalte zählen mit.`,
    steps: [
      "Heimrechnung prüfen: Ist der Zuschlag abgezogen und die richtige Stufe angesetzt?",
      "Frühere Heimzeiten (auch in anderen Heimen) der Kasse melden.",
      "Bei Fehlern schriftlich Neuberechnung verlangen."
    ],
    docs: ["Heimrechnungen", "Nachweise früherer Heimaufenthalte"],
    to: PK,
    ask: "bitte ich um Prüfung und ggf. Neuberechnung des Leistungszuschlags nach § 43c SGB XI. Der Aufenthalt in vollstationärer Pflege begann am [Datum]. Frühere Aufenthalte: [Einrichtung, Zeitraum]."
  },
  {
    k: "hzp",
    area: "Pflegeheim",
    t: "Hilfe zur Pflege vom Sozialamt",
    p: "§ 61 ff. SGB XII",
    when: () => Z.S.bereiche.pflege && Z.S.wohnen === "heim",
    val: () => null,
    opt: true,
    short: `Reichen Rente und Vermögen nicht für den Eigenanteil, übernimmt das Sozialamt den Rest. Kinder zahlen erst ab ${eur(BETRAEGE.elternunterhaltGrenze)} Jahresbrutto.`,
    steps: [
      "Antrag beim Sozialamt stellen, sobald das Geld knapp wird. Leistungen gibt es erst ab Antrag.",
      "Einkommens- und Vermögensnachweise sammeln."
    ],
    docs: ["Rentenbescheid", "Kontoauszüge", "Heimvertrag und Rechnungen"],
    to: "sozialamt",
    ask: "beantrage ich hiermit Hilfe zur Pflege nach §§ 61 ff. SGB XII, da Einkommen und Vermögen nicht ausreichen, um die Kosten der vollstationären Pflege zu decken."
  },
  {
    k: "eingliederung",
    area: "Pflege",
    t: "Pauschale in Einrichtungen der Eingliederungshilfe",
    p: "§ 43a SGB XI",
    when: () => pg() >= 2 && Z.S.wohnen === "eingliederung",
    val: () => null,
    mon: () => BETRAEGE.eingliederungMax,
    short: `Die Pflegekasse übernimmt 15 % der Vergütung, höchstens ${BETRAEGE.eingliederungMax} € im Monat. An Wochenenden zu Hause kann anteilig Pflegegeld fließen.`,
    steps: [
      "Einrichtung fragen, ob die Pauschale abgerechnet wird.",
      "Für Tage zu Hause anteiliges Pflegegeld beantragen."
    ],
    docs: ["Bescheinigung der Einrichtung über Heimfahrtstage"],
    to: PK,
    ask: "beantrage ich hiermit anteiliges Pflegegeld für die Tage der häuslichen Pflege außerhalb der Einrichtung [Name] (Nachweis liegt bei)."
  },
  {
    k: "fahrten",
    area: "Krankenkasse",
    t: "Fahrten zur ambulanten Behandlung",
    p: "§ 60 SGB V",
    when: () => pg() >= 3 || mz("aG") || mz("Bl") || mz("H"),
    val: () => null,
    // Text passend zur Lage: ab Pflegegrad 4 oder mit Merkzeichen gilt die Fahrt als genehmigt, bei Pflegegrad 3 nur auf Antrag
    short: () => fahrtGenehmigt() ? "Mit Pflegegrad 4 oder 5 oder den Merkzeichen aG, Bl oder H gelten Taxi- oder Mietwagenfahrten zu ambulanten Arztterminen als genehmigt. Es reicht die ärztliche Verordnung." : "Bei Pflegegrad 3 übernimmt die Krankenkasse Fahrten zu ambulanten Arztterminen, wenn die Mobilität dauerhaft eingeschränkt ist. Dafür vorher die Genehmigung beantragen.",
    get steps() {
      return [
        "Ärztin oder Arzt stellt die Verordnung einer Krankenbeförderung aus.",
        ...fahrtGenehmigt() ? [] : ["Vor der ersten Fahrt die Genehmigung bei der Krankenkasse holen (Antrag unten)."],
        "Zuzahlung 10 %, mind. 5 €, max. 10 € je Fahrt (auf Belastungsgrenze anrechenbar)."
      ];
    },
    docs: ["Verordnung Krankenbeförderung", "Pflegegrad-Bescheid oder Ausweis"],
    to: KK,
    ask: "beantrage ich hiermit die Genehmigung von Krankenfahrten zu ambulanten Behandlungen nach § 60 Abs. 1 SGB V. Die ärztliche Verordnung liegt bei."
  },
  {
    k: "chroniker",
    area: "Krankenkasse",
    t: "Zuzahlungen begrenzen (1 % statt 2 %)",
    p: "§ 62 SGB V",
    when: () => (pg() >= 3 || gdb() >= 60) && !istKind(),
    val: () => null,
    short: "Wer als schwerwiegend chronisch krank gilt (z. B. ab Pflegegrad 3 oder GdB 60 wegen der Erkrankung), zahlt höchstens 1 % des Bruttoeinkommens pro Jahr zu. Darüber gibt es Befreiung.",
    steps: [
      "Quittungen für Zuzahlungen (Apotheke, Fahrten, Therapie) sammeln.",
      "Ärztliche Bescheinigung über die Dauerbehandlung holen.",
      "Befreiung beantragen, sobald die Grenze erreicht ist, rückwirkend für das Jahr."
    ],
    docs: ["Quittungen", "Einkommensnachweise des Haushalts", "Bescheinigung der Dauerbehandlung"],
    to: KK,
    ask: "beantrage ich hiermit die Befreiung von Zuzahlungen nach § 62 SGB V bzw. die Anerkennung als schwerwiegend chronisch krank (Belastungsgrenze 1 %). Nachweise liegen bei."
  },
  /* Schwerbehinderung */
  {
    k: "sb_antrag",
    area: "Schwerbehinderung",
    t: "Schwerbehindertenausweis beantragen",
    p: "§ 152 SGB IX",
    when: () => Z.S.bereiche.sb && Z.S.sb.status === "nein",
    val: () => null,
    short: "Ab GdB 50 gibt es den Ausweis und viele Nachteilsausgleiche. Auch GdB 20–40 bringt Steuervorteile. Bei Pflegegrad liegt oft ein GdB vor.",
    steps: [
      "Antrag beim Versorgungsamt stellen (in Baden-Württemberg: Landratsamt oder Stadtkreis), oft auch online.",
      "Alle Diagnosen und behandelnden Ärzte angeben, Merkzeichen gleich mit beantragen.",
      "Bescheid prüfen, Widerspruch innerhalb eines Monats möglich."
    ],
    docs: [
      "Arztberichte, Krankenhausberichte",
      "Liste der behandelnden Ärzte mit Schweigepflichtentbindung",
      "Passfoto (für Ausweis)"
    ],
    to: VA,
    ask: "beantrage ich hiermit die Feststellung einer Behinderung und des Grades der Behinderung (GdB) nach § 152 SGB IX sowie die Ausstellung eines Schwerbehindertenausweises. Zudem beantrage ich die Prüfung folgender Merkzeichen: [z. B. G, B, H]. Eine Liste der behandelnden Ärztinnen und Ärzte liegt bei."
  },
  {
    k: "sb_neu",
    area: "Schwerbehinderung",
    t: "Höheren GdB oder Merkzeichen beantragen",
    p: "§ 152 SGB IX",
    when: () => Z.S.bereiche.sb && Z.S.sb.status === "ja" && (gdb() < 100 || pg() >= 4 && !mz("H")),
    val: () => null,
    opt: true,
    short: () => pg() >= 4 && !mz("H") ? "Bei Pflegegrad 4 oder 5 kommt das Merkzeichen H in Frage. Es bringt unter anderem eine kostenlose Wertmarke und eine Kfz-Steuerbefreiung." : "Haben sich Erkrankungen verschlechtert oder sind neue hinzugekommen, kommt ein Antrag auf Neufeststellung in Frage.",
    steps: [
      "Neue Diagnosen und Befunde sammeln.",
      "Neufeststellungsantrag beim Versorgungsamt stellen.",
      "Gewünschte Merkzeichen ausdrücklich nennen."
    ],
    docs: ["neue Arztberichte", "bisheriger Bescheid", "Pflegegrad-Bescheid"],
    to: VA,
    ask: "beantrage ich hiermit die Neufeststellung des Grades der Behinderung wegen Verschlimmerung bzw. hinzugekommener Gesundheitsstörungen sowie die Prüfung folgender Merkzeichen: [z. B. H, G, B]. Aktuelle Befunde liegen bei."
  },
  {
    k: "behpausch",
    area: "Steuer",
    t: "Behinderten-Pauschbetrag",
    p: "§ 33b EStG",
    when: () => gdb() >= 20 || pg() >= 4,
    val: () => null,
    frei: () => {
      if (mz("H") || mz("Bl") || mz("TBl") || pg() >= 4) return BETRAEGE.behindertenPauschbetragErhoeht;
      const g = Math.min(100, Math.floor(gdb() / 10) * 10);
      return BEHPAUSCH[g] || 0;
    },
    short: () => `Steuerfreibetrag von ${eur(B.find((x) => x.k === "behpausch").frei())} pro Jahr. Bei Kindern können ihn die Eltern übernehmen, wenn sie für das Kind Kindergeld bekommen.`,
    steps: [
      "In der Steuererklärung eintragen (Anlage Außergewöhnliche Belastungen).",
      `Bescheid bzw. Ausweis bereithalten. Bei Pflegegrad 4/5 genügt der Pflegegrad-Bescheid für ${eur(BETRAEGE.behindertenPauschbetragErhoeht)}.`,
      "Rückwirkend für noch offene Steuerjahre beantragen."
    ],
    docs: ["Ausweis/Bescheid oder Pflegegrad-Bescheid"],
    to: FA
  },
  {
    k: "fahrtpausch",
    area: "Steuer",
    t: "Behinderungsbedingte Fahrtkostenpauschale",
    p: "§ 33 Abs. 2a EStG",
    when: () => gdb() >= 80 || gdb() >= 70 && mz("G") || mz("aG") || mz("Bl") || mz("TBl") || mz("H") || pg() >= 4,
    val: () => null,
    frei: () => mz("aG") || mz("Bl") || mz("TBl") || mz("H") || pg() >= 4 ? BETRAEGE.fahrtkostenPauschaleErhoeht : BETRAEGE.fahrtkostenPauschale,
    short: () => `${eur(B.find((x) => x.k === "fahrtpausch").frei())} pro Jahr zusätzlich steuerlich absetzbar, ohne Einzelnachweis.`,
    steps: ["In der Steuererklärung (Anlage Außergewöhnliche Belastungen) eintragen."],
    docs: ["Ausweis/Bescheid"],
    to: FA
  },
  {
    k: "wertmarke",
    area: "Schwerbehinderung",
    t: "Freifahrt im Nahverkehr (Wertmarke)",
    p: "§ 228 SGB IX",
    when: () => Z.S.sb.status === "ja" && (mz("G") || mz("aG") || mz("Gl") || mz("H") || mz("Bl")),
    val: () => null,
    short: () => mz("H") || mz("Bl") || Z.S.sb.grundsicherung ? "Kostenlose Wertmarke: Bus, Bahn und Regionalverkehr in ganz Deutschland frei." : `Wertmarke für ${BETRAEGE.wertmarkeJahr} € im Jahr (${BETRAEGE.wertmarkeHalbjahr} € halbjährlich): Bus, Bahn und Regionalverkehr in ganz Deutschland. Alternative zur Kfz-Steuerermäßigung.`,
    steps: [
      "Beiblatt mit Wertmarke beim Versorgungsamt beantragen.",
      "Bei Merkzeichen H, Bl oder Bezug von Grundsicherung/Bürgergeld kostenlos.",
      "Mit Merkzeichen B fährt eine Begleitperson immer kostenlos mit, auch im Fernverkehr der Bahn."
    ],
    docs: ["Ausweis", "ggf. Bescheid über Grundsicherung/Bürgergeld"],
    to: VA,
    ask: "beantrage ich hiermit die Ausstellung eines Beiblatts mit Wertmarke für die unentgeltliche Beförderung im öffentlichen Personennahverkehr nach § 228 SGB IX."
  },
  {
    k: "kfz",
    area: "Schwerbehinderung",
    t: "Kfz-Steuer-Befreiung oder -Ermäßigung",
    p: "§ 3a KraftStG",
    when: () => Z.S.sb.auto && (mz("aG") || mz("Bl") || mz("TBl") || mz("H") || mz("G") || mz("Gl")),
    val: () => null,
    short: () => mz("aG") || mz("Bl") || mz("TBl") || mz("H") ? "100 % Befreiung von der Kfz-Steuer, zusätzlich zur kostenlosen Wertmarke möglich." : "50 % Ermäßigung der Kfz-Steuer. Gilt nicht gleichzeitig mit der Wertmarke, also abwägen.",
    steps: [
      "Antrag beim Hauptzollamt (zuständig für die Kfz-Steuer) stellen.",
      "Fahrzeug muss auf die schwerbehinderte Person zugelassen sein."
    ],
    docs: ["Ausweis", "Fahrzeugschein"],
    to: "hauptzollamt",
    ask: "beantrage ich hiermit die Steuerbefreiung bzw. -ermäßigung nach § 3a Kraftfahrzeugsteuergesetz für das Fahrzeug mit dem amtlichen Kennzeichen [Kennzeichen]."
  },
  {
    k: "park",
    area: "Schwerbehinderung",
    t: "Blauer EU-Parkausweis",
    p: "§ 46 StVO",
    when: () => mz("aG") || mz("Bl") || mz("TBl"),
    val: () => null,
    short: "Parken auf Behindertenparkplätzen und Parkerleichterungen in ganz Europa.",
    steps: ["Antrag bei der Straßenverkehrsbehörde bzw. dem Bürgeramt stellen.", "Passfoto und Ausweis mitbringen."],
    docs: ["Ausweis", "Passfoto"],
    to: "strassenverkehrsbehoerde",
    ask: "beantrage ich hiermit die Ausstellung eines Parkausweises für Menschen mit Behinderung (blauer EU-Parkausweis)."
  },
  {
    k: "rundfunk",
    area: "Schwerbehinderung",
    t: "Ermäßigter Rundfunkbeitrag",
    p: "§ 4 RBStV",
    cash: true,
    when: () => mz("RF") || mz("TBl"),
    val: () => mz("TBl") ? Math.round(BETRAEGE.rundfunkVoll * 12 * 100) / 100 : Math.round((BETRAEGE.rundfunkVoll - BETRAEGE.rundfunkErmaessigt) * 12 * 100) / 100,
    short: () => mz("TBl") ? `Taubblinde Menschen werden ganz befreit (${eur(BETRAEGE.rundfunkVoll, 2)} im Monat gespart).` : `Nur ${eur(BETRAEGE.rundfunkErmaessigt, 2)} statt ${eur(BETRAEGE.rundfunkVoll, 2)} im Monat zahlen.`,
    steps: [
      "Antrag beim ARD ZDF Deutschlandradio Beitragsservice stellen (online oder per Formular).",
      "Kopie des Ausweises mit Merkzeichen beilegen."
    ],
    docs: ["Ausweis (Vorder- und Rückseite)"],
    to: "beitragsservice",
    ask: "beantrage ich hiermit die Ermäßigung bzw. Befreiung vom Rundfunkbeitrag nach § 4 Rundfunkbeitragsstaatsvertrag. Eine Kopie des Schwerbehindertenausweises liegt bei. Beitragsnummer: [Beitragsnummer]."
  },
  {
    k: "blind",
    area: "Schwerbehinderung",
    t: "Blindengeld / Landesblindenhilfe",
    p: "Landesrecht, § 72 SGB XII",
    when: () => mz("Bl") || mz("TBl"),
    val: () => null,
    short: "Monatliche Geldleistung des Bundeslandes, unabhängig vom Einkommen. Höhe je nach Land.",
    steps: ["Antrag beim Versorgungsamt bzw. Landratsamt stellen.", "Teile des Pflegegeldes werden angerechnet."],
    docs: ["Augenärztliche Befunde", "Ausweis"],
    to: VA,
    ask: "beantrage ich hiermit Blindengeld bzw. Landesblindenhilfe nach den landesrechtlichen Vorschriften."
  },
  {
    k: "urlaub",
    area: "Arbeit",
    t: "5 Tage Zusatzurlaub",
    p: "§ 208 SGB IX",
    when: () => Z.S.sb.arbeit && gdb() >= 50,
    val: () => null,
    short: "Schwerbehinderte Beschäftigte haben eine Arbeitswoche mehr Urlaub im Jahr, dazu besonderen Kündigungsschutz.",
    steps: [
      "Arbeitgeber schriftlich über die Schwerbehinderung informieren.",
      "Zusatzurlaub beantragen, auch rückwirkend für das laufende Jahr."
    ],
    docs: ["Kopie des Ausweises"],
    to: "arbeitgeber",
    ask: "teile ich Ihnen mit, dass bei mir eine Schwerbehinderung mit einem GdB von [GdB] festgestellt ist. Ich beantrage daher den Zusatzurlaub nach § 208 SGB IX für das laufende Kalenderjahr."
  },
  {
    k: "gleich",
    area: "Arbeit",
    t: "Gleichstellung mit Schwerbehinderten",
    p: "§ 2 Abs. 3 SGB IX",
    when: () => Z.S.sb.arbeit && gdb() >= 30 && gdb() < 50,
    val: () => null,
    short: "Mit GdB 30 oder 40 schützt die Gleichstellung den Arbeitsplatz (Kündigungsschutz, Förderung), aber ohne Zusatzurlaub.",
    steps: ["Antrag bei der Agentur für Arbeit stellen.", "Darlegen, warum der Arbeitsplatz gefährdet ist."],
    docs: ["GdB-Bescheid", "Arbeitsvertrag"],
    to: "arbeitsagentur",
    ask: "beantrage ich hiermit die Gleichstellung mit einem schwerbehinderten Menschen nach § 2 Abs. 3 SGB IX. Der GdB beträgt [GdB]. Ohne Gleichstellung ist der Arbeitsplatz gefährdet, weil [Begründung]."
  },
  {
    k: "rente",
    area: "Arbeit",
    t: "Altersrente für schwerbehinderte Menschen",
    p: "§ 37, § 236a SGB VI",
    when: () => Z.S.sb.arbeit && gdb() >= 50,
    val: () => null,
    opt: true,
    short: "Bis zu 2 Jahre früher abschlagsfrei in Rente (35 Versicherungsjahre nötig). Der GdB muss bei Rentenbeginn anerkannt sein.",
    steps: ["Kostenlose Beratung bei der Deutschen Rentenversicherung buchen.", "Rentenauskunft anfordern."],
    docs: ["Ausweis", "Versicherungsverlauf"],
    to: "rentenversicherung",
    ask: "bitte ich um eine Rentenauskunft und Beratung zur Altersrente für schwerbehinderte Menschen. Der GdB beträgt [GdB]."
  }
];

// quelle/js/logic/fristen.js
var NACHFRAGE_TAGE = 28;
function widerspruchFrist(k) {
  const d = parseIso((Z.S.ablehnung[k] || {}).datum);
  if (!d) return null;
  const f = new Date(d);
  f.setMonth(f.getMonth() + 1);
  return f;
}
function beratungRelevant() {
  return pg() >= 2 && ["angehoerige", "gemischt", "wg"].includes(Z.S.wohnen);
}
function besuche() {
  const a = (Z.S.termine.besuche || []).map((x) => x.d);
  const b = Z.BEL.filter((x) => x.kat === "beratung" && x.datum).map((x) => x.datum);
  return [.../* @__PURE__ */ new Set([...a, ...b])].filter(parseIso).sort();
}
function beratungStatus() {
  const H = halfOf(TODAY());
  const v = besuche().map(parseIso);
  const inH = (h) => v.some((d) => d >= h.start && d <= h.end);
  return { H, done: inH(H), prev: shiftHalf(H, -1), prevDone: inH(shiftHalf(H, -1)), next: shiftHalf(H, 1), inH };
}
function deadlines() {
  const L = [];
  const t = TODAY();
  const y = t.getFullYear();
  if (beratungRelevant()) {
    const st = beratungStatus();
    if (!st.done) {
      const d = st.H.end;
      L.push({
        k: "beratung",
        t: `Beratungsbesuch für das ${st.H.label}`,
        d,
        remind: addDays(d, -45),
        s: `Pflicht für Pflegegeld (§ 37 Abs. 3 SGB XI). Termin mit ${Z.S.termine.dienst || "dem Pflegedienst"} vereinbaren und den Nachweis an die Pflegekasse schicken lassen.`,
        main: true
      });
    } else {
      const d = st.next.end;
      L.push({
        k: "beratung",
        t: `Beratungsbesuch für das ${st.next.label}`,
        d,
        remind: addDays(st.next.start, 30),
        s: `Für das ${st.H.label} erledigt. Der nächste Besuch muss zwischen ${deD(st.next.start)} und ${deD(st.next.end)} stattfinden.`,
        main: true,
        ok: true
      });
    }
  }
  {
    const bi = bescheidInfo();
    if (bi && bi.offen)
      L.push({
        k: "wid",
        t: "Widerspruchsfrist Pflegegrad-Bescheid",
        d: bi.frist,
        remind: addDays(bi.frist, -7),
        s: bi.knapp || bi.abgelehnt ? "Ein Widerspruch kann sich lohnen. Fristwahrend reicht ein kurzes Schreiben, die App hilft dabei." : "Bis zu diesem Tag kann Widerspruch gegen den Bescheid eingelegt werden."
      });
  }
  for (const [k, abl] of Object.entries(Z.S.ablehnung || {})) {
    const b = B.find((x) => x.k === k);
    const frist = widerspruchFrist(k);
    if (!b || !frist || Z.S.status[k] !== "abgelehnt" || abl.widerspruch) continue;
    L.push({
      k: "abl-" + k,
      t: `Widerspruchsfrist: ${b.t}`,
      d: frist,
      remind: addDays(frist, -7),
      s: "Bis zu diesem Tag muss der Widerspruch bei der Stelle sein, die abgelehnt hat. Ein kurzes Schreiben reicht, die App hat es vorbereitet."
    });
  }
  for (const [k, gesendet] of Object.entries(Z.S.sent || {})) {
    const b = B.find((x) => x.k === k);
    const d0 = parseIso(gesendet);
    if (!b || !d0 || !b.ask || b.to === FA || Z.S.status[k] !== "beantragt") continue;
    const d = addDays(d0, NACHFRAGE_TAGE);
    L.push({
      k: "nach-" + k,
      t: `Noch keine Antwort? ${b.t}`,
      d,
      remind: d,
      s: `Abgeschickt am ${deD(d0)}. Ist noch keine Antwort da, mit dem fertigen Brief in der App nach dem Stand fragen.`,
      nurAmTag: true
    });
  }
  if (pg() >= 1 && isHome()) {
    const thisJune = new Date(y, 5, 30);
    const d = t <= thisJune ? thisJune : new Date(y + 1, 5, 30);
    L.push({
      k: "entl",
      t: "Entlastungsbetrag: Restguthaben verfällt",
      d,
      remind: addDays(d, -60),
      s: `Nicht genutzte Beträge aus ${d.getFullYear() - 1} verfallen an diesem Tag. Jetzt Haushaltshilfe oder Betreuung organisieren und Rechnungen einreichen.`
    });
  }
  if (pg() >= 2 && isHome()) {
    const d = new Date(y, 11, 31);
    L.push({
      k: "vhp",
      t: `Verhinderungspflege aus ${y - 1} einreichen`,
      d,
      remind: addDays(d, -45),
      s: `Ausschlussfrist: Kosten der Ersatzpflege aus ${y - 1} müssen bis heute mit Nachweisen bei der Pflegekasse sein.`
    });
  }
  if (Z.BEL.some((b) => KATS[b.kat] && KATS[b.kat].zz) || pg() >= 3 || gdb() >= 60) {
    const d = new Date(y + 1, 0, 15);
    L.push({
      k: "zz",
      t: `Zuzahlungsbefreiung für ${y + 1} beantragen`,
      d,
      remind: d,
      s: "Die Befreiung gilt immer nur für ein Kalenderjahr. Chronisch Kranke können den Betrag auch vorab zahlen und sind dann das ganze Jahr befreit."
    });
  }
  const wm = parseIso(Z.S.termine.wertmarke);
  if (wm)
    L.push({
      k: "wm",
      t: "Wertmarke läuft ab",
      d: wm,
      remind: addDays(wm, -30),
      s: "Neue Wertmarke rechtzeitig beim Versorgungsamt beantragen."
    });
  for (const e of Z.S.termine.eigene || []) {
    const d = parseIso(e.d);
    if (d) L.push({ k: "own-" + e.id, t: e.t, d, remind: d, s: e.n || "Eigene Erinnerung", own: e.id });
  }
  return L.sort((a, b) => +a.d - +b.d);
}

// quelle/js/logic/fristen-fall.js
function fristenFuerFall(daten, belege = []) {
  const vorher = { S: Z.S, BEL: Z.BEL };
  try {
    Z.S = merge(daten || {});
    Z.BEL = belege;
    return deadlines().filter((x) => !x.ok).map((x) => ({ key: `${x.k}-${isoD(x.d)}`, titel: x.t, datum: x.d, text: x.s, nurAmTag: !!x.nurAmTag }));
  } finally {
    Z.S = vorher.S;
    Z.BEL = vorher.BEL;
  }
}
export {
  fristenFuerFall
};
