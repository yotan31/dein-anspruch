// Briefe nach dem Antrag: nachfragen, wenn keine Antwort kommt, und Widerspruch gegen eine Ablehnung.
// Dazu der Inhalt der Vollmacht für Angehörige. Nur Texte und Fristen; die PDFs baut services/dokumente.js.
import { betreff, briefText } from "./antragstext.js";
import { FA, KK, PK, VA } from "./leistungen.js";
import { Z } from "../state/zustand.js";
import { TODAY, datumBrief, parseIso } from "../utils/datum.js";

/** Frist, in der die Pflegekasse über einen Pflegegrad-Antrag entscheiden muss (§ 18c Abs. 1 SGB XI), in Arbeitstagen */
const FRIST_PFLEGEGRAD_ARBEITSTAGE = 25;
/** Anträge, für die diese Frist gilt */
const PFLEGEGRAD_ANTRAEGE = ["pg_antrag", "pg_hoch"];
/** Stellen, gegen deren Bescheid ein Widerspruch möglich ist (beim Finanzamt heißt es Einspruch und läuft über ELSTER) */
const MIT_WIDERSPRUCH = [PK, KK, VA];

/**
 * Arbeitstage (Montag bis Freitag) seit einem Datum. Feiertage zählen mit, damit die App eher zu spät
 * als zu früh von einer überschrittenen Frist spricht.
 * @param iso Datum JJJJ-MM-TT
 */
export function arbeitstageSeit(iso) {
  const start = parseIso(iso);
  if (!start) return 0;
  let n = 0;
  for (const d = new Date(start); d < TODAY();) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return n;
}

/**
 * Kann die App für diese Leistung nachfragen? Nur bei abgeschickten Anträgen an Kasse oder Amt.
 * @param b Leistung
 */
export function kannNachfragen(b) {
  return !!b.ask && b.to !== FA && (Z.S.status[b.k] || "offen") === "beantragt";
}

/**
 * Brief „Wie ist der Stand?“ für einen abgeschickten Antrag. Beim Pflegegrad mit Hinweis auf die 25-Tage-Frist,
 * sobald sie überschritten ist; ob die Kasse dann zahlen muss, hängt vom Einzelfall ab, deshalb „bitte prüfen“.
 * @param b Leistung
 */
export function nachfrageBrief(b) {
  const gesendet = Z.S.sent && Z.S.sent[b.k];
  let kern = `bitte ich hiermit um Auskunft zum Stand des Antrags „${b.t}“ vom ${gesendet ? datumBrief(gesendet) : "[Datum des Antrags]"}. Bis heute liegt mir keine Entscheidung vor.`;
  if (PFLEGEGRAD_ANTRAEGE.includes(b.k) && gesendet && arbeitstageSeit(gesendet) > FRIST_PFLEGEGRAD_ARBEITSTAGE)
    kern += `\n\nDie Frist von ${FRIST_PFLEGEGRAD_ARBEITSTAGE} Arbeitstagen für die Entscheidung (§ 18c Abs. 1 SGB XI) ist überschritten. Bitte prüfen Sie deshalb auch die Zahlung nach § 18c Abs. 5 SGB XI.`;
  return {
    subject: betreff(b, `Sachstandsanfrage: ${b.t}`),
    body: briefText(
      b,
      kern,
      "Bitte entscheiden Sie zeitnah über den Antrag. Falls noch Unterlagen fehlen, teilen Sie mir bitte mit, welche.",
    ),
  };
}

/**
 * Gibt es für diese Leistung einen Widerspruch als Brief?
 * @param b Leistung
 */
export function mitWiderspruch(b) {
  return MIT_WIDERSPRUCH.includes(b.to);
}

/**
 * Kurzer Widerspruch, der die Frist wahrt. Die Begründung kann nachgereicht werden; dafür fordert der Brief
 * die Unterlagen an, auf die sich die Ablehnung stützt.
 * @param b Leistung
 */
export function widerspruchBrief(b) {
  const datum = (Z.S.ablehnung[b.k] || {}).datum;
  const kern = `lege ich hiermit Widerspruch gegen Ihren Bescheid vom ${datum ? datumBrief(datum) : "[Datum des Bescheids]"} ein, mit dem Sie den Antrag „${b.t}“ abgelehnt haben.\n\nDie Voraussetzungen für die Leistung liegen aus meiner Sicht vor. Eine ausführliche Begründung reiche ich nach. Bitte senden Sie mir dafür die Unterlagen zu, auf die sich Ihre Entscheidung stützt, insbesondere ein vorhandenes Gutachten (Akteneinsicht nach § 25 SGB X).`;
  return {
    subject: betreff(b, `Widerspruch: ${b.t}`),
    body: briefText(b, kern, "Bitte bestätigen Sie mir den Eingang dieses Widerspruchs schriftlich."),
  };
}

/**
 * Inhalt der Vollmacht, mit der Angehörige Anträge für die pflegebedürftige Person stellen dürfen.
 * Bewusst eng gefasst (Kasse und Behörden); sie ersetzt keine Vorsorgevollmacht.
 */
export function vollmachtInhalt() {
  const p = Z.S.person;
  return {
    geber: [
      ["Name", p.name],
      ["Geboren am", p.geb ? datumBrief(p.geb) : ""],
      ["Anschrift", [p.strasse, p.ort].filter(Boolean).join(", ")],
      ["Versichertennummer", p.vnr],
    ],
    nehmer: [
      ["Name", p.absender],
      ["Anschrift", [p.absStrasse, p.absOrt].filter(Boolean).join(", ")],
    ],
    umfang:
      "mich gegenüber meiner Kranken- und Pflegekasse sowie gegenüber Behörden (zum Beispiel Versorgungsamt und Sozialamt) zu vertreten. Die Vollmacht umfasst insbesondere:",
    punkte: [
      "Anträge zu stellen, zu ändern und zurückzunehmen,",
      "Auskünfte einzuholen sowie Unterlagen und Bescheide entgegenzunehmen,",
      "Widerspruch einzulegen,",
      "mich bei der Pflegebegutachtung zu begleiten und dort Auskunft zu geben.",
    ],
    daten:
      "Die genannten Stellen dürfen der bevollmächtigten Person Auskunft über meine Daten geben, soweit das für diese Angelegenheiten nötig ist.",
    dauer: "Die Vollmacht gilt ab sofort und bis ich sie widerrufe.",
    hinweis:
      "Hinweis: Diese Vollmacht ist für Anträge bei Kassen und Behörden gedacht. Sie ersetzt keine Vorsorgevollmacht. Kann die Person nicht mehr selbst unterschreiben oder den Inhalt nicht mehr verstehen, beraten Betreuungsbehörde und Betreuungsvereine kostenlos.",
  };
}
