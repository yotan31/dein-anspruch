// Gemeinsamer Zustand der App: Werte, die mehrere Programmteile lesen und ändern, mit ihren Startwerten.
// Bewusst ein einfaches Objekt statt einer Zustands-Bibliothek: Jede Änderung ist eine normale Zuweisung,
// danach zeichnet render() (ui/render.js) die Oberfläche neu. Die Angaben der Familie liegen in Z.S (state/angaben.js).
import { blank } from "./angaben.js";

export const Z = {
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
  befJahr: String(new Date().getFullYear()),
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
  /** @type {Record<string,boolean>} geöffnete aufklappbare Bereiche */
  akk: {},
  /** @type {any} zuletzt gezeichnete Ansicht, für Bildschirmwechsel */
  lastFam: null,
  lastIdx: 0,
  /** @type {any} Zeitgeber der Kurzmeldung (toast) */
  tT: undefined,
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
  installPrompt: null,
};
