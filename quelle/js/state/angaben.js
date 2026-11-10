// Aufbau der Angaben einer Familie (blank) und Zusammenführen mit gespeicherten älteren Ständen (merge),
// damit neue Felder nach einem Update einen Startwert haben.
/** Leere Angaben einer Familie mit allen Feldern und Startwerten. */
export function blank() {
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
      iban: "",
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
    /** Alter, wenn es um ein Kind geht: "" (erwachsen), "baby" (bis 18 Monate), "kind" (bis 10 Jahre), "jugend" (11–17) */
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
      mail: "",
    },
  };
}

/**
 * Gespeicherte Angaben mit den Startwerten zusammenführen, damit neue Felder nach einem Update vorhanden sind.
 * @param d gespeicherte Angaben
 */
export function merge(d) {
  const b = blank();
  const m = {
    ...b,
    ...d,
    bereiche: { ...b.bereiche, ...(d.bereiche || {}) },
    pp: { ...b.pp, ...(d.pp || {}) },
    sb: { ...b.sb, ...(d.sb || {}), mz: { ...((d.sb && d.sb.mz) || {}) } },
    person: { ...b.person, ...(d.person || {}) },
    termine: { ...b.termine, ...(d.termine || {}) },
    belegFilter: { ...b.belegFilter, ...(d.belegFilter || {}) },
    vhp: { ...b.vhp, ...(d.vhp || {}) },
    bruttoJahr: { ...(d.bruttoJahr || {}) },
    ans: { ...(d.ans || {}) },
    sent: { ...(d.sent || {}) },
    ablehnung: { ...(d.ablehnung || {}) },
  };
  if (d.done === undefined) m.done = (d.step || 0) >= 6 && !!d.rolle;
  delete m.updated;
  return m;
}
