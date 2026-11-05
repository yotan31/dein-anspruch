import { VERBRAUCH, VHP_ERSATZ } from "../config/stammdaten.js";
import { zuz } from "./belege.js";
import { gdb } from "./lage.js";
import { B, FA, KK, PK, RECIP, empfAdresse } from "./leistungen.js";
import { save } from "../services/speicher.js";
import { Z } from "../state/zustand.js";
import { deD, parseIso } from "../utils/datum.js";
import { eur, numDE } from "../utils/format.js";

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function ergaenzeBefreiungsantrag() {
  /* ---------- Befreiungs-Antrag (nur aus Belegen) ---------- */
  B.push({
    k: "befreiung",
    area: "Krankenkasse",
    t: "Antrag auf Befreiung von Zuzahlungen",
    p: "§ 62 SGB V",
    when: () => false,
    val: () => null,
    short: "",
    steps: [],
    docs: [
      "Zuzahlungsbelege (siehe Belegübersicht)",
      "Einkommensnachweise aller Haushaltsmitglieder",
      "ggf. Bescheinigung über die Dauerbehandlung (chronisch krank)",
    ],
    to: KK,
    ask: () => {
      const z = zuz(Z.befJahr);
      return `beantrage ich hiermit die Befreiung von Zuzahlungen bzw. die Erstattung von Zuzahlungen über der Belastungsgrenze nach § 62 SGB V für das Jahr ${Z.befJahr}. Die Belastungsgrenze beträgt ${z.grenze ? eur(z.grenze, 2) : "[Betrag]"} (${z.pct} % der jährlichen Bruttoeinnahmen zum Lebensunterhalt). Bisher wurden Zuzahlungen in Höhe von ${eur(z.sum, 2)} geleistet. Die Belege liegen in Kopie bei. Bitte erstatten Sie den Betrag, der die Belastungsgrenze übersteigt${String(Z.befJahr) === String(new Date().getFullYear()) ? ", und stellen Sie eine Befreiungsbescheinigung für den Rest des Jahres aus" : ""}.`;
    },
  });
}

/* ---------- Antrags-Assistent: Fragen je Anspruch ---------- */
export function OPT(a) {
  return a.map((x) => (typeof x === "string" ? { v: x, t: x } : x));
}

export const HILFE = [
  "Waschen und Anziehen",
  "Essen und Trinken",
  "Toilette / Inkontinenz",
  "Gehen, Aufstehen, Treppen",
  "Medikamente",
  "Vergesslichkeit / Orientierung",
  "Haushalt und Einkaufen",
  "Hilfe in der Nacht",
];

export function ansObj(k) {
  if (k === "jahresbetrag") return Z.S.vhp;
  Z.S.ans = Z.S.ans || {};
  return (Z.S.ans[k] = Z.S.ans[k] || {});
}

export function av(k, f, ph) {
  const v = ansObj(k)[f];
  if (Array.isArray(v)) return v.length ? v.join(", ") : `[${ph}]`;
  return v != null && String(v).trim() !== "" ? String(v).trim() : `[${ph}]`;
}

function ad(k, f, ph) {
  const d = parseIso(ansObj(k)[f]);
  return d ? deD(d) : `[${ph}]`;
}

export function has(k, f) {
  const v = ansObj(k)[f];
  return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "";
}

const IBAN_Q = {
  k: "iban",
  label: "Auf welches Konto soll das Geld?",
  help: "Die IBAN steht auf der Bankkarte oder im Online-Banking. Sie beginnt mit DE.",
  ph: "DE00 0000 0000 0000 0000 00",
};

export const ASSIST = {
  pg_antrag: {
    q: [
      {
        k: "seit",
        label: "Seit wann wird Hilfe gebraucht?",
        ph: "z. B. seit März 2026",
        help: "Ungefähr reicht völlig.",
      },
      {
        k: "was",
        type: "multi",
        label: "Wobei wird Hilfe gebraucht?",
        help: "Alles ankreuzen, was zutrifft.",
        opts: OPT(HILFE),
      },
      {
        k: "tel",
        label: "Unter welcher Telefonnummer ist jemand für den Termin mit dem Gutachter erreichbar?",
        ph: "z. B. 0711 123456",
        type: "tel",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Feststellung der Pflegebedürftigkeit und Leistungen der Pflegeversicherung nach dem SGB XI. Hilfe wird ${has("pg_antrag", "seit") ? av("pg_antrag", "seit") + " " : ""}benötigt, vor allem bei: ${av("pg_antrag", "was", "Bereiche")}.\n\nBitte beauftragen Sie den Medizinischen Dienst mit der Begutachtung. Für die Terminabsprache bin ich erreichbar unter: ${av("pg_antrag", "tel", "Telefonnummer")}. Außerdem bitte ich um eine Pflegeberatung nach § 7a SGB XI.`,
  },
  pg_hoch: {
    q: [
      { k: "seit", label: "Seit wann ist es schlechter geworden?", ph: "z. B. seit dem Sturz im Juli" },
      {
        k: "was",
        type: "multi",
        label: "Wobei wird jetzt mehr Hilfe gebraucht?",
        opts: OPT([...HILFE, "Nach Sturz oder Krankenhaus"]),
      },
      { k: "tel", label: "Telefonnummer für den Gutachter-Termin", type: "tel", ph: "z. B. 0711 123456" },
    ],
    ask: () =>
      `beantrage ich hiermit eine Höherstufung des Pflegegrades. Der Hilfebedarf hat sich ${has("pg_hoch", "seit") ? av("pg_hoch", "seit") + " " : ""}deutlich erhöht, vor allem bei: ${av("pg_hoch", "was", "Bereiche")}.\n\nBitte veranlassen Sie eine erneute Begutachtung durch den Medizinischen Dienst. Erreichbar unter: ${av("pg_hoch", "tel", "Telefonnummer")}.`,
  },
  pflegegeld: {
    q: [
      {
        k: "pp",
        label: "Wer pflegt hauptsächlich?",
        help: "Das ist die Pflegeperson. Es können auch mehrere sein.",
        ph: "Vor- und Nachname",
      },
      {
        k: "ab",
        type: "date",
        label: "Seit wann wird so gepflegt?",
        help: "Pflegegeld gibt es frühestens ab dem Monat, in dem der Antrag gestellt wird.",
      },
      IBAN_Q,
    ],
    ask: () =>
      `beantrage ich hiermit Pflegegeld nach § 37 SGB XI (bei gleichzeitiger Nutzung eines Pflegedienstes als Kombinationsleistung nach § 38 SGB XI) ab dem ${ad("pflegegeld", "ab", "Datum")}. Die Pflege übernimmt: ${av("pflegegeld", "pp", "Name der Pflegeperson")}.\n\nBitte überweisen Sie das Pflegegeld auf folgendes Konto: ${av("pflegegeld", "iban", "IBAN")}.`,
  },
  sachleistung: {
    q: [
      {
        k: "dienst",
        label: "Welcher Pflegedienst soll kommen?",
        ph: "Name des Pflegedienstes",
        help: "Noch keinen gefunden? Überspringen. Die Pflegekasse schickt eine Liste.",
      },
      { k: "ab", type: "date", label: "Ab wann?" },
      {
        k: "kombi",
        type: "choice",
        label: "Pflegen Angehörige zusätzlich mit?",
        opts: OPT([
          { v: "ja", t: "Ja", s: "dann gibt es zusätzlich anteiliges Pflegegeld" },
          { v: "nein", t: "Nein" },
        ]),
      },
    ],
    ask: () =>
      `beantrage ich hiermit Pflegesachleistungen nach § 36 SGB XI${ansObj("sachleistung").kombi === "ja" ? " als Kombinationsleistung mit anteiligem Pflegegeld nach § 38 SGB XI" : ""} ab dem ${ad("sachleistung", "ab", "Datum")}. Die Versorgung übernimmt der Pflegedienst: ${av("sachleistung", "dienst", "Name des Pflegedienstes")}.`,
  },
  entlastung: {
    q: [
      {
        k: "anbieter",
        label: "Wer hilft im Alltag?",
        help: "Zum Beispiel Haushaltshilfe, Nachbarschaftshilfe, Betreuungsdienst. Der Anbieter muss anerkannt sein.",
        ph: "Name des Anbieters",
      },
      { k: "zeitraum", label: "Für welchen Zeitraum ist die Rechnung?", ph: "z. B. September 2026" },
      {
        k: "betrag",
        type: "money",
        label: "Wie hoch ist die Rechnung?",
        help: "Mehrere Rechnungen einfach zusammenzählen.",
      },
      {
        k: "weg",
        type: "choice",
        label: "Wie soll bezahlt werden?",
        opts: OPT([
          { v: "erstattung", t: "Wir haben schon bezahlt", s: "die Kasse soll uns das Geld zurückzahlen" },
          { v: "direkt", t: "Direkt an den Anbieter", s: "der Anbieter rechnet mit der Kasse ab" },
        ]),
      },
      { ...IBAN_Q, show: () => ansObj("entlastung").weg !== "direkt" },
    ],
    ask: () => {
      const o = ansObj("entlastung");
      return `beantrage ich hiermit Leistungen aus dem Entlastungsbetrag nach § 45b SGB XI für Leistungen von ${av("entlastung", "anbieter", "Name des Anbieters")} im Zeitraum ${av("entlastung", "zeitraum", "Zeitraum")} in Höhe von ${has("entlastung", "betrag") ? eur(numDE(o.betrag), 2) : "[Betrag]"}. ${o.weg === "direkt" ? "Bitte rechnen Sie direkt mit dem Anbieter ab. Eine Abtretungserklärung liegt bei." : `Die Rechnung liegt bei. Bitte erstatten Sie den Betrag auf folgendes Konto: ${av("entlastung", "iban", "IBAN")}.`}\n\nBitte teilen Sie mir außerdem mit, wie hoch das noch verfügbare Guthaben aus dem Vorjahr ist.`;
    },
  },
  tagespflege: {
    q: [
      {
        k: "einr",
        label: "Welche Tagespflege soll es sein?",
        ph: "Name und Ort",
        help: "Noch keine gefunden? Überspringen.",
      },
      { k: "ab", type: "date", label: "Ab wann?" },
      { k: "tage", type: "choice", label: "An wie vielen Tagen pro Woche?", opts: OPT(["1", "2", "3", "4", "5"]) },
    ],
    ask: () =>
      `beantrage ich hiermit Leistungen der Tages- und Nachtpflege nach § 41 SGB XI ab dem ${ad("tagespflege", "ab", "Datum")} an ${av("tagespflege", "tage", "Anzahl")} Tagen pro Woche in der Einrichtung ${av("tagespflege", "einr", "Name der Tagespflege")}.`,
  },
  verbrauch: {
    q: [
      {
        k: "anbieter",
        label: "Wer soll die Pflegehilfsmittel liefern?",
        help: "Apotheke, Sanitätshaus oder Versandanbieter. Noch keinen? Überspringen.",
        ph: "Name des Anbieters",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Kostenübernahme für zum Verbrauch bestimmte Pflegehilfsmittel nach § 40 Abs. 2 SGB XI (z. B. Einmalhandschuhe, Desinfektion, Bettschutzeinlagen) bis zur Höhe von ${VERBRAUCH} Euro monatlich. Die Versorgung soll erfolgen durch: ${av("verbrauch", "anbieter", "Anbieter")}.`,
  },
  technisch: {
    q: [
      {
        k: "was",
        type: "multi",
        label: "Was wird gebraucht?",
        opts: OPT(["Hausnotruf", "Pflegebett", "Lagerungskissen", "Duschstuhl", "Badewannenlift", "Anderes"]),
      },
      {
        k: "anbieter",
        label: "Von welchem Anbieter gibt es ein Angebot?",
        ph: "z. B. Sanitätshaus Müller",
        help: "Noch keins? Überspringen.",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Versorgung mit folgenden technischen Pflegehilfsmitteln nach § 40 Abs. 1 SGB XI: ${av("technisch", "was", "Hilfsmittel")}. ${has("technisch", "anbieter") ? `Ein Kostenvoranschlag von ${av("technisch", "anbieter")} liegt bei.` : ""}`,
  },
  wohnumfeld: {
    q: [
      {
        k: "was",
        type: "multi",
        label: "Was soll umgebaut werden?",
        opts: OPT(["Bodengleiche Dusche", "Treppenlift", "Haltegriffe", "Türen verbreitern", "Rampe", "Anderes"]),
      },
      {
        k: "kosten",
        type: "money",
        label: "Was kostet es laut Angebot?",
        help: "Wichtig: Erst bauen, wenn die Kasse zugesagt hat.",
      },
      {
        k: "miete",
        type: "choice",
        label: "Wohnung oder Haus?",
        opts: OPT([
          { v: "eigentum", t: "Eigentum" },
          { v: "miete", t: "Miete", s: "Vermieter muss zustimmen" },
        ]),
      },
    ],
    ask: () =>
      `beantrage ich hiermit einen Zuschuss für Maßnahmen zur Verbesserung des individuellen Wohnumfeldes nach § 40 Abs. 4 SGB XI für: ${av("wohnumfeld", "was", "Maßnahme")}. Die Kosten betragen laut Angebot ${has("wohnumfeld", "kosten") ? eur(numDE(ansObj("wohnumfeld").kosten), 2) : "[Betrag]"}. Kostenvoranschläge liegen bei.${ansObj("wohnumfeld").miete === "miete" ? " Die Zustimmung des Vermieters liegt bei." : ""}`,
  },
  dipa: {
    q: [{ k: "name", label: "Welche Pflege-App soll es sein?", ph: "Name der App" }],
    ask: () =>
      `beantrage ich hiermit die Versorgung mit der digitalen Pflegeanwendung ${av("dipa", "name", "Name")} nach § 40a SGB XI sowie ergänzende Unterstützungsleistungen nach § 39a SGB XI.`,
  },
  wg: {
    q: [{ k: "wg", label: "Wie heißt die Wohngruppe und wo ist sie?", ph: "Name, Anschrift" }],
    ask: () =>
      `beantrage ich hiermit den Wohngruppenzuschlag nach § 38a SGB XI für die ambulant betreute Wohngruppe ${av("wg", "wg", "Name, Anschrift")}.`,
  },
  beratung: {
    q: [
      {
        k: "wo",
        type: "choice",
        label: "Wie soll die Beratung stattfinden?",
        opts: OPT(["Bei uns zu Hause", "Telefonisch", "Per Video"]),
      },
      { k: "zeit", label: "Wann passt es am besten?", ph: "z. B. vormittags, nicht mittwochs" },
    ],
    ask: () =>
      `bitte ich um einen Termin für eine individuelle Pflegeberatung nach § 7a SGB XI, gewünscht: ${av("beratung", "wo", "Art")}. Am besten passt: ${av("beratung", "zeit", "Zeit")}.`,
  },
  pflegekurs: {
    q: [
      {
        k: "art",
        type: "choice",
        label: "Welche Art von Kurs?",
        opts: OPT(["Kurs vor Ort", "Online-Kurs", "Schulung bei uns zu Hause"]),
      },
    ],
    ask: () =>
      `bitte ich um Informationen zu kostenlosen Pflegekursen nach § 45 SGB XI für pflegende Angehörige, gewünscht: ${av("pflegekurs", "art", "Kursart")}.`,
  },
  rv: {
    q: [
      { k: "pp", label: "Wie heißt die pflegende Person?", ph: "Vor- und Nachname" },
      {
        k: "rvnr",
        label: "Wie lautet ihre Rentenversicherungsnummer?",
        help: "Steht auf dem Sozialversicherungsausweis oder der jährlichen Renteninformation. Nicht zur Hand? Überspringen, die Kasse fragt nach.",
        ph: "z. B. 12 150385 M 012",
      },
      {
        k: "std",
        type: "choice",
        label: "Wie viele Stunden pro Woche wird gepflegt?",
        opts: OPT(["10 bis 20 Stunden", "20 bis 30 Stunden", "mehr als 30 Stunden"]),
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Zahlung von Beiträgen zur Renten- und Arbeitslosenversicherung für die Pflegeperson ${av("rv", "pp", "Name")} (Rentenversicherungsnummer: ${av("rv", "rvnr", "Nummer")}) nach § 44 SGB XI. Die Pflege umfasst ${av("rv", "std", "Stunden")} pro Woche, verteilt auf mindestens 2 Tage. Bitte senden Sie mir den Fragebogen zur Zahlung der Beiträge zur sozialen Sicherung für Pflegepersonen zu.`,
  },
  pug: {
    q: [
      { k: "pp", label: "Wer nimmt frei?", ph: "Vor- und Nachname" },
      { k: "von", type: "date", label: "Ab wann?" },
      { k: "bis", type: "date", label: "Bis wann?", help: "Höchstens 10 Arbeitstage im Jahr." },
    ],
    ask: () =>
      `beantrage ich hiermit Pflegeunterstützungsgeld nach § 44a Abs. 3 SGB XI für die kurzzeitige Arbeitsverhinderung der Pflegeperson ${av("pug", "pp", "Name")} vom ${ad("pug", "von", "Datum")} bis ${ad("pug", "bis", "Datum")}. Die ärztliche Bescheinigung liegt bei.`,
  },
  stationaer: {
    q: [
      { k: "heim", label: "Wie heißt das Pflegeheim?", ph: "Name und Ort" },
      { k: "ab", type: "date", label: "Seit wann?" },
    ],
    ask: () =>
      `beantrage ich hiermit Leistungen der vollstationären Pflege nach § 43 SGB XI in der Einrichtung ${av("stationaer", "heim", "Name des Heims")} ab dem ${ad("stationaer", "ab", "Datum")}.`,
  },
  zuschlag: {
    q: [
      { k: "seit", type: "date", label: "Seit wann ist die Person im Heim?" },
      {
        k: "frueher",
        type: "long",
        label: "Gab es vorher schon Heimaufenthalte?",
        help: "Auch in anderen Heimen. Die Zeit zählt mit und erhöht den Zuschuss.",
        ph: "z. B. 2024 Haus Sonnenschein, 5 Monate",
      },
    ],
    ask: () =>
      `bitte ich um Prüfung und ggf. Neuberechnung des Leistungszuschlags nach § 43c SGB XI. Der Aufenthalt in vollstationärer Pflege begann am ${ad("zuschlag", "seit", "Datum")}. Frühere Aufenthalte: ${has("zuschlag", "frueher") ? av("zuschlag", "frueher") : "keine"}.`,
  },
  hzp: {
    q: [{ k: "heim", label: "In welchem Heim lebt die Person?", ph: "Name und Ort" }],
    ask: () =>
      `beantrage ich hiermit Hilfe zur Pflege nach §§ 61 ff. SGB XII, da Einkommen und Vermögen nicht ausreichen, um die Kosten der vollstationären Pflege in der Einrichtung ${av("hzp", "heim", "Name des Heims")} zu decken.`,
  },
  eingliederung: {
    q: [
      { k: "einr", label: "In welcher Einrichtung lebt die Person?", ph: "Name" },
      { k: "tage", type: "number", label: "An wie vielen Tagen im Monat ist sie zu Hause?" },
    ],
    ask: () =>
      `beantrage ich hiermit anteiliges Pflegegeld für die Tage der häuslichen Pflege außerhalb der Einrichtung ${av("eingliederung", "einr", "Name")} (durchschnittlich ${av("eingliederung", "tage", "Anzahl")} Tage im Monat, Nachweis liegt bei).`,
  },
  fahrten: {
    q: [
      {
        k: "wohin",
        label: "Zu welcher Behandlung muss gefahren werden?",
        ph: "z. B. Dialyse, Facharzt, Strahlentherapie",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Genehmigung von Krankenfahrten zu ambulanten Behandlungen (${av("fahrten", "wohin", "Behandlung")}) nach § 60 Abs. 1 SGB V. Die ärztliche Verordnung liegt bei.`,
  },
  sb_antrag: {
    q: [
      {
        k: "leiden",
        type: "long",
        label: "Welche Erkrankungen oder Einschränkungen gibt es?",
        help: "Alles aufschreiben, auch Kleinigkeiten. Je vollständiger, desto besser.",
        ph: "z. B. Diabetes, Herzschwäche, Arthrose im Knie, Schwerhörigkeit",
      },
      {
        k: "aerzte",
        type: "long",
        label: "Welche Ärztinnen und Ärzte behandeln?",
        ph: "z. B. Dr. Maier, Hausarzt, Stuttgart",
      },
      {
        k: "mz",
        type: "multi",
        label: "Welche Merkzeichen kommen in Frage?",
        help: "Unsicher? Lass es offen, das Amt prüft das.",
        opts: OPT([
          "G (Gehen ist schwer)",
          "aG (kaum gehen möglich)",
          "B (Begleitung nötig)",
          "H (hilflos)",
          "RF (Rundfunkbeitrag)",
        ]),
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Feststellung einer Behinderung und des Grades der Behinderung (GdB) nach § 152 SGB IX sowie die Ausstellung eines Schwerbehindertenausweises.\n\nFolgende Gesundheitsstörungen liegen vor: ${av("sb_antrag", "leiden", "Erkrankungen")}.\n\nBehandelnde Ärztinnen und Ärzte: ${av("sb_antrag", "aerzte", "Ärzte")}.${has("sb_antrag", "mz") ? `\n\nZudem beantrage ich die Prüfung folgender Merkzeichen: ${av("sb_antrag", "mz")}.` : ""}`,
  },
  sb_neu: {
    q: [
      {
        k: "leiden",
        type: "long",
        label: "Was ist neu oder schlimmer geworden?",
        ph: "z. B. Herzinfarkt 2026, Knie-OP, Demenz-Diagnose",
      },
      {
        k: "mz",
        type: "multi",
        label: "Welche Merkzeichen sollen geprüft werden?",
        opts: OPT([
          "G (Gehen ist schwer)",
          "aG (kaum gehen möglich)",
          "B (Begleitung nötig)",
          "H (hilflos)",
          "RF (Rundfunkbeitrag)",
        ]),
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Neufeststellung des Grades der Behinderung wegen Verschlimmerung bzw. hinzugekommener Gesundheitsstörungen: ${av("sb_neu", "leiden", "Gesundheitsstörungen")}.${has("sb_neu", "mz") ? ` Außerdem beantrage ich die Prüfung folgender Merkzeichen: ${av("sb_neu", "mz")}.` : ""} Aktuelle Befunde liegen bei.`,
  },
  kfz: {
    q: [{ k: "kz", label: "Wie lautet das Kennzeichen des Autos?", ph: "z. B. S-AB 1234" }],
    ask: () =>
      `beantrage ich hiermit die Steuerbefreiung bzw. -ermäßigung nach § 3a Kraftfahrzeugsteuergesetz für das Fahrzeug mit dem amtlichen Kennzeichen ${av("kfz", "kz", "Kennzeichen")}.`,
  },
  rundfunk: {
    q: [
      {
        k: "nr",
        label: "Wie lautet die Beitragsnummer?",
        help: "Steht oben auf jedem Brief vom Beitragsservice (9 Ziffern).",
        ph: "z. B. 123 456 789",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Ermäßigung bzw. Befreiung vom Rundfunkbeitrag nach § 4 Rundfunkbeitragsstaatsvertrag. Eine Kopie des Schwerbehindertenausweises liegt bei. Beitragsnummer: ${av("rundfunk", "nr", "Beitragsnummer")}.`,
  },
  gleich: {
    q: [
      {
        k: "grund",
        type: "long",
        label: "Warum ist der Arbeitsplatz in Gefahr?",
        ph: "z. B. viele Krankheitstage, Arbeit ist körperlich schwer",
      },
    ],
    ask: () =>
      `beantrage ich hiermit die Gleichstellung mit einem schwerbehinderten Menschen nach § 2 Abs. 3 SGB IX. Der GdB beträgt ${gdb() || "[GdB]"}. Ohne Gleichstellung ist der Arbeitsplatz gefährdet: ${av("gleich", "grund", "Begründung")}.`,
  },
  urlaub: {
    q: [],
    ask: () =>
      `teile ich Ihnen mit, dass bei mir eine Schwerbehinderung mit einem GdB von ${gdb() || "[GdB]"} festgestellt ist. Ich beantrage daher den Zusatzurlaub nach § 208 SGB IX für das laufende Kalenderjahr.`,
  },
  rente: {
    q: [],
    ask: () =>
      `bitte ich um eine Rentenauskunft und Beratung zur Altersrente für schwerbehinderte Menschen. Der GdB beträgt ${gdb() || "[GdB]"}.`,
  },
  jahresbetrag: {
    q: [
      {
        k: "haupt",
        label: "Wer pflegt sonst normalerweise?",
        help: "Die Person, die verhindert war. Zum Beispiel du selbst oder die Ehefrau.",
        ph: "Vor- und Nachname",
      },
      {
        k: "grund",
        type: "choice",
        label: "Warum konnte sie nicht pflegen?",
        opts: OPT([
          { v: "urlaub", t: "Urlaub" },
          { v: "krank", t: "Krankheit" },
          { v: "kur", t: "Kur oder Reha" },
          { v: "termine", t: "Etwas anderes", s: "z. B. Arzttermin, Erholung, Familienfeier" },
        ]),
      },
      {
        k: "art",
        type: "choice",
        label: "Ganze Tage oder nur ein paar Stunden am Tag?",
        opts: OPT([
          { v: "tage", t: "Ganze Tage", s: "z. B. eine Woche Urlaub" },
          { v: "stunden", t: "Nur ein paar Stunden am Tag", s: "weniger als 8 Stunden, z. B. Arzttermin" },
        ]),
      },
      { k: "von", type: "date", label: "Ab wann?" },
      { k: "bis", type: "date", label: "Bis wann?", help: "War es nur ein Tag? Dann dasselbe Datum noch einmal." },
      {
        k: "ersatz",
        type: "choice",
        label: "Wer hat in dieser Zeit gepflegt?",
        opts: Object.entries(VHP_ERSATZ).map(([v, o]) => ({ v, t: o.t, s: o.s })),
      },
      {
        k: "eName",
        label: () =>
          ["dienst", "heim"].includes(Z.S.vhp.ersatz)
            ? "Wie heißt der Dienst bzw. das Heim?"
            : "Wie heißt die Person, die gepflegt hat?",
        ph: "Name",
      },
      {
        k: "eAdresse",
        label: () => (["dienst", "heim"].includes(Z.S.vhp.ersatz) ? "Wo ist er?" : "Wo wohnt diese Person?"),
        ph: "Straße, PLZ Ort",
      },
      {
        k: "eBez",
        label: "Wie ist sie mit der gepflegten Person verwandt?",
        ph: "z. B. Enkel, Schwester, Schwiegertochter",
        show: () => Z.S.vhp.ersatz === "angehoerig",
      },
      {
        k: "stunden",
        type: "number",
        label: "Wie viele Stunden wurde insgesamt gepflegt?",
        help: "Grob geschätzt reicht. Beispiel: 2 Wochen mit je 3 Stunden am Tag sind 42 Stunden.",
        ph: "z. B. 42",
        show: () => ["angehoerig", "privat"].includes(Z.S.vhp.ersatz),
      },
      {
        k: "satz",
        type: "money",
        label: "Wie viel Euro pro Stunde wurden vereinbart?",
        help: "Üblich sind etwa 10 bis 20 Euro. Bei Angehörigen zahlt die Kasse insgesamt höchstens das Doppelte des Pflegegeldes.",
        ph: "z. B. 15",
        show: () => ["angehoerig", "privat"].includes(Z.S.vhp.ersatz),
      },
      {
        k: "rechnung",
        type: "money",
        label: "Wie hoch ist die Rechnung?",
        show: () => ["dienst", "heim"].includes(Z.S.vhp.ersatz),
      },
      {
        k: "km",
        type: "number",
        label: "Wie viele Kilometer ist die Ersatzperson dafür gefahren?",
        help: "Alle Fahrten hin und zurück zusammenzählen. Keine Fahrten? Einfach überspringen.",
        ph: "z. B. 120",
        show: () => Z.S.vhp.ersatz !== "heim",
      },
      {
        k: "verdienst",
        type: "money",
        label: "Hat die Ersatzperson dafür auf Lohn verzichtet?",
        help: "Nur wenn sie unbezahlt frei genommen hat. Sonst überspringen.",
        show: () => Z.S.vhp.ersatz === "angehoerig",
      },
      {
        k: "verbraucht",
        type: "money",
        label: "Wurde in diesem Jahr schon Verhinderungs- oder Kurzzeitpflege bezahlt?",
        help: "Wenn ja: ungefähr wie viel Euro? Wenn nein: überspringen.",
      },
      {
        k: "auszahlung",
        type: "choice",
        label: "Wohin soll die Kasse das Geld überweisen?",
        opts: OPT([
          { v: "versicherte", t: "Auf unser Konto", s: "ihr bezahlt die Ersatzperson selbst" },
          { v: "ersatz", t: "Direkt an die Ersatzperson", s: "die meisten Kassen machen das auf Wunsch" },
        ]),
      },
      {
        k: "iban",
        label: () => (Z.S.vhp.auszahlung === "ersatz" ? "IBAN der Ersatzperson" : "Auf welches Konto soll das Geld?"),
        help: "Die IBAN steht auf der Bankkarte oder im Online-Banking. Sie beginnt mit DE.",
        ph: "DE00 0000 0000 0000 0000 00",
      },
    ],
  },
};

export /* ---------- Assistent: Ablauf ---------- */
function personQs(b, a) {
  const p = Z.S.person,
    L = [];
  if (!p.name) L.push("name");
  if ((b.to === PK || b.to === KK) && !p.vnr) L.push("vnr");
  if (!p.strasse || !p.ort) L.push("adresse");
  if (a && !p.absender) L.push("absender");
  if (a && (!p.absStrasse || !p.absOrt)) L.push("absadresse");
  if (a && !p.beziehung) L.push("beziehung");
  if (b.to !== FA && b.to !== "arbeitgeber" && !empfAdresse(b.to).ort) L.push("empf");
  return L;
}

function personQ(k) {
  const a = Z.S.rolle === "angehoerig";
  return {
    name: {
      k: "name",
      store: "person",
      label: a ? "Wie heißt die Person, um die es geht?" : "Wie heißt du?",
      ph: "Vor- und Nachname",
    },
    vnr: {
      k: "vnr",
      store: "person",
      label: "Wie lautet die Versichertennummer?",
      help: "Steht auf der Gesundheitskarte (Krankenkassenkarte). Sie beginnt mit einem Buchstaben, zum Beispiel A123456789.",
      ph: "z. B. A123456789",
    },
    adresse: { k: "adresse", store: "person", type: "addr", label: a ? "Wo wohnt die Person?" : "Wo wohnst du?" },
    absender: {
      k: "absender",
      store: "person",
      label: "Und wie heißt du?",
      help: "Du schreibst den Antrag für die Person. Dein Name steht unter dem Brief.",
      ph: "Vor- und Nachname",
    },
    absadresse: {
      k: "absadresse",
      store: "person",
      type: "absaddr",
      label: "Und wo wohnst du?",
      help: "Deine Anschrift steht oben als Absender im Brief, damit die Kasse dir antworten kann.",
    },
    empf: {
      k: "empf",
      store: "empf",
      type: "empf",
      label: "An welche Adresse geht der Brief?",
      help:
        "Damit die Anschrift gleich im Brief steht. " +
        (RECIP[Z.S.wiz ? (B.find((x) => x.k === Z.S.wiz.k) || {}).to : ""]?.()?.hint || ""),
    },
    beziehung: {
      k: "beziehung",
      store: "person",
      type: "choice",
      label: "Wie bist du mit der Person verbunden?",
      opts: OPT(["Tochter", "Sohn", "Ehefrau", "Ehemann", "Enkelin", "Enkel", "Rechtliche Betreuung", "Andere"]),
    },
  }[k];
}

export function wizSteps() {
  const w = Z.S.wiz,
    b = B.find((x) => x.k === w.k);
  // leichte Fragen zuerst, Adresse und Versichertennummer am Ende
  const pq = w.pq || [],
    early = ["name", "beziehung"].filter((k) => pq.includes(k)),
    late = pq
      .filter((k) => !early.includes(k))
      .sort(
        (x, y) =>
          ["absender", "absadresse", "adresse", "vnr", "empf"].indexOf(x) -
          ["absender", "absadresse", "adresse", "vnr", "empf"].indexOf(y),
      );
  const qs = [...early.map(personQ), ...(b.q || []).filter((q) => !q.show || q.show()), ...late.map(personQ)];
  return { b, list: [...qs, { type: "summary" }, { type: "done" }] };
}

export function getQ(q) {
  if (q.store === "person") return Z.S.person[q.k];
  if (q.store === "empf") {
    const e = empfAdresse(wizTo());
    return [e.strasse, e.ort].filter(Boolean).join(", ");
  }
  return ansObj(Z.S.wiz.k)[q.k];
}

/** Empfänger des laufenden Antrags (z. B. pflegekasse) */
export function wizTo() {
  const b = Z.S.wiz && B.find((x) => x.k === Z.S.wiz.k);
  return b ? b.to : "";
}

/** Freundliche Prüfung typischer Tippfehler. Gibt einen Hinweis zurück oder "" (dann ist alles plausibel). Die Angabe wird nie blockiert. */
export function pruefeAngabe(q, v) {
  const s = String(v ?? "").trim();
  if (!s || !q) return "";
  if (q.k === "vnr") {
    const n = s.replace(/\s+/g, "").toUpperCase();
    return /^[A-Z]\d{9}$/.test(n)
      ? ""
      : "Die Versichertennummer hat normalerweise 10 Zeichen: einen Buchstaben und 9 Ziffern, zum Beispiel A123456789. Sie steht vorne auf der Gesundheitskarte.";
  }
  if (q.k === "iban") {
    return ibanOk(s)
      ? ""
      : "Diese IBAN scheint nicht zu stimmen, vielleicht ein Tippfehler. Eine deutsche IBAN beginnt mit DE und hat 22 Zeichen.";
  }
  if (q.type === "money") {
    const x = numDE(s);
    return x > 0
      ? ""
      : "Der Betrag ist 0 € oder keine Zahl. Bitte den Betrag von der Rechnung eintragen, zum Beispiel 131,00.";
  }
  if (q.type === "empf") {
    const e = empfAdresse(wizTo());
    return !e.ort || /^\d{5}\s+\S/.test(e.ort.trim())
      ? ""
      : "Bei „PLZ und Ort“ bitte die fünfstellige Postleitzahl und den Ort eintragen, zum Beispiel 20457 Hamburg.";
  }
  return "";
}

/** IBAN mit Prüfziffer (ISO 13616); deutsche IBAN zusätzlich mit 22 Zeichen */
export function ibanOk(v) {
  const n = String(v || "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(n) || (n.startsWith("DE") && n.length !== 22)) return false;
  const r = (n.slice(4) + n.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let m = 0;
  for (const ch of r) m = (m * 10 + Number(ch)) % 97;
  return m === 1;
}

export function setQ(q, v) {
  if (q.store === "person") Z.S.person[q.k] = v;
  else ansObj(Z.S.wiz.k)[q.k] = v;
  delete Z.S.texte[Z.S.wiz.k];
  delete Z.S.texte[Z.S.wiz.k + "_sub"];
  save();
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function verbindeAssistenten() {
  for (const [k, a] of Object.entries(ASSIST)) {
    const b = B.find((x) => x.k === k);
    if (!b) continue;
    b.q = a.q;
    if (a.ask) b.ask = a.ask;
  }
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function ergaenzeWiderspruch() {
  B.push({
    k: "widerspruch",
    area: "Pflege",
    t: "Widerspruch gegen den Pflegegrad-Bescheid",
    p: "§ 84 SGG, § 18 SGB XI",
    when: () => false,
    val: () => null,
    short: "",
    to: PK,
    steps: [
      "Fristwahrend reicht ein kurzer Widerspruch. Die ausführliche Begründung kannst du nachreichen.",
      "Gutachten anfordern, falls es nicht beilag, und Punkt für Punkt prüfen, wo Hilfe zu niedrig bewertet wurde.",
      "Pflegetagebuch über 1–2 Wochen führen und beilegen.",
      "Bei der zweiten Begutachtung eine vertraute Person dabei haben.",
      "Unsicher, ob ein Widerspruch Aussicht hat? Kostenlos beraten der Pflegestützpunkt und die Pflegeberatung der Kasse, Mitglieder auch VdK oder SoVD, sonst eine Anwältin oder ein Anwalt für Sozialrecht.",
    ],
    docs: ["Kopie des Bescheids", "Pflegetagebuch (wenn vorhanden)", "Aktuelle Arztberichte"],
  });
  ASSIST.widerspruch = {
    q: [
      {
        k: "grund",
        type: "multi",
        label: "Was wurde im Gutachten zu niedrig eingeschätzt?",
        help: "Alles ankreuzen, was zutrifft. Unsicher? Dann „Weiß ich nicht“ – der Widerspruch gilt trotzdem.",
        opts: OPT([...HILFE, "Der Gutachter war nur sehr kurz da", "Es war ein „guter Tag“, sonst ist es schlechter"]),
      },
      {
        k: "gutachten",
        type: "choice",
        label: "Liegt euch das Gutachten vor?",
        opts: OPT([
          { v: "ja", t: "Ja" },
          { v: "nein", t: "Nein", s: "wir fordern es im Widerspruch mit an" },
        ]),
      },
      { k: "tel", type: "tel", label: "Telefonnummer für eine neue Begutachtung", ph: "z. B. 0711 123456" },
    ],
    ask: () => {
      const b = Z.S.bescheid || {};
      const o = ansObj("widerspruch");
      return `lege ich hiermit Widerspruch gegen den Bescheid${b.datum ? ` vom ${deD(parseIso(b.datum))}` : " vom [Datum]"} über die Feststellung der Pflegebedürftigkeit ein${Number(b.pg) > 0 ? ` (festgestellt: Pflegegrad ${b.pg})` : ""}.\n\nDer tatsächliche Hilfebedarf wurde im Gutachten nicht ausreichend berücksichtigt${has("widerspruch", "grund") ? `, insbesondere in folgenden Bereichen: ${av("widerspruch", "grund")}` : ""}. Eine ausführliche Begründung reiche ich nach.\n\n${o.gutachten === "ja" ? "" : "Bitte senden Sie mir das vollständige Gutachten des Medizinischen Dienstes zu. "}Ich beantrage eine erneute Begutachtung, möglichst durch eine andere Gutachterin oder einen anderen Gutachter. Für die Terminabsprache bin ich erreichbar unter: ${av("widerspruch", "tel", "Telefonnummer")}.`;
    },
  };
  B.find((x) => x.k === "widerspruch").q = ASSIST.widerspruch.q;
  B.find((x) => x.k === "widerspruch").ask = ASSIST.widerspruch.ask;
}
