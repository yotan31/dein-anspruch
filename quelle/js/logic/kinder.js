// Kinder und Jugendliche mit Pflegegrad: was anders ist als bei Erwachsenen, und Hilfen, die es nur für sie gibt.
// Quellen (Stand November 2026): § 15 Abs. 6 und 7 SGB XI (Begutachtung), § 45 SGB V (Kinderkrankengeld),
// Zuzahlungsregeln des Bundesgesundheitsministeriums, § 46 und § 112 SGB IX, § 35a SGB VIII, § 32 Abs. 4 EStG.
import { BETRAEGE } from "../config/betraege.js";
import { istKind, mz } from "./lage.js";
import { B, KK, VA } from "./leistungen.js";
import { Z } from "../state/zustand.js";

/** Bereich, unter dem die Kinder-Hilfen in der Liste stehen (eigener Filter) */
const BEREICH = "Kind";

/** Altersgruppen für die Frage im Fragebogen: Wert, Titel, Erklärung */
export const KIND_ALTER = [
  ["erw", "Nein, erwachsen", ""],
  ["baby", "Ja, jünger als 18 Monate", ""],
  ["kind", "Ja, 18 Monate bis 10 Jahre", ""],
  ["jugend", "Ja, 11 bis 17 Jahre", ""],
];

const alter = () => (istKind() ? Z.S.kindAlter : "");

/** Wie der Medizinische Dienst Kinder begutachtet, je nach Alter. */
function begutachtung() {
  const a = alter();
  if (a === "baby")
    return "Bis 18 Monate gilt eine Sonderregel: Babys werden einen Pflegegrad höher eingestuft und bleiben dort ohne neue Begutachtung. Mit 18 Monaten prüft die Kasse neu.";
  if (a === "jugend") return "Ab 11 Jahren gelten bei der Begutachtung dieselben Maßstäbe wie bei Erwachsenen.";
  return "Der Gutachter vergleicht dein Kind mit gesunden Gleichaltrigen. Es zählt nur, was es mehr an Hilfe braucht als andere Kinder in dem Alter.";
}

/**
 * Die wichtigsten Unterschiede zu Erwachsenen für die Karte „Das ist bei Kindern anders“.
 * @returns {[string, string][]} Titel und Erklärung
 */
export function kindUnterschiede() {
  /** @type {[string, string][]} */
  const L = [
    ["Begutachtung", begutachtung()],
    [
      "Keine Vollmacht nötig",
      "Als Eltern vertrittst du dein Kind von Gesetzes wegen. Die Briefe der App sind schon so geschrieben.",
    ],
    [
      "Gleiche Leistungen",
      "Pflegegeld, Entlastungsbetrag, Verhinderungspflege und Hilfsmittel gibt es in gleicher Höhe wie für Erwachsene.",
    ],
    [
      "Keine Zuzahlungen",
      "Unter 18 fallen in der gesetzlichen Krankenkasse keine Zuzahlungen an. Einzige Ausnahme sind Fahrkosten.",
    ],
    [
      "Kinderkrankengeld ohne Altersgrenze",
      "Sonst endet es mit 12 Jahren. Für Kinder mit Behinderung, die auf Hilfe angewiesen sind, gilt die Grenze nicht.",
    ],
    [
      "Zusätzliche Hilfen",
      "Frühförderung, Begleitung in Kita und Schule und das Merkzeichen H mit eigenen Regeln für Kinder. Du findest sie in der Liste unter „Kind“.",
    ],
  ];
  if (alter() !== "jugend")
    L.push([
      "Pflegegrad-Rechner",
      "Der Rechner der App ist für Erwachsene gemacht. Bei Kindern unter 11 Jahren schätzt er zu hoch, weil auch gesunde Kinder Hilfe brauchen.",
    ]);
  return L;
}

/** Zusätzlicher Hinweis bei bestehenden Leistungen, wenn es um ein Kind geht: Schlüssel der Leistung → Text */
const ZUSATZ = {
  pg_antrag: () => begutachtung(),
  pg_hoch: () => begutachtung(),
  jahresbetrag: () =>
    "Für Familien mit Kind: Ersatzpflege geht auch stundenweise, zum Beispiel durch einen familienentlastenden Dienst, einen Babysitter oder Verwandte.",
  entlastung: () =>
    "Viele Familien nutzen den Betrag für den familienentlastenden Dienst (FED) oder eine anerkannte Betreuung am Nachmittag und in den Ferien.",
  verbrauch: () =>
    "Windeln zahlt bei Kindern die Krankenkasse, in der Regel ab etwa 3 Jahren, wenn sie wegen der Erkrankung nötig sind. Das Rezept stellt die Kinderarztpraxis aus.",
};

/**
 * Hinweis für Eltern zu einer Leistung, leer bei Erwachsenen oder ohne Besonderheit.
 * @param k Schlüssel der Leistung
 */
export function kindHinweis(k) {
  return istKind() && ZUSATZ[k] ? ZUSATZ[k]() : "";
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js): Hilfen, die es nur für Kinder gibt. */
export function ergaenzeKinderLeistungen() {
  B.push(
    {
      k: "kind_krankengeld",
      area: BEREICH,
      t: "Kinderkrankengeld ohne Altersgrenze",
      p: "§ 45 SGB V",
      when: () => istKind(),
      val: () => null,
      short: () =>
        `Ist dein Kind krank und du bleibst zu Hause, zahlt deine Krankenkasse Kinderkrankengeld: ${BETRAEGE.kinderkrankTage} Arbeitstage im Jahr je Elternteil, Alleinerziehende ${BETRAEGE.kinderkrankTageAllein}. Sonst endet der Anspruch mit 12 Jahren. Für Kinder mit Behinderung, die auf Hilfe angewiesen sind, gibt es keine Altersgrenze.`,
      hinweis: "Dafür ist kein Brief nötig. Die Bescheinigung aus der Kinderarztpraxis reicht.",
      steps: [
        "In der Kinderarztpraxis die „Ärztliche Bescheinigung für den Bezug von Krankengeld bei Erkrankung eines Kindes“ ausstellen lassen.",
        "Bescheinigung ausfüllen und bei deiner eigenen Krankenkasse einreichen. Oft geht das in der App der Kasse.",
        "Dem Arbeitgeber Bescheid geben. Für diese Tage besteht Anspruch auf unbezahlte Freistellung.",
        "Voraussetzung: Du und dein Kind seid gesetzlich versichert, und niemand sonst im Haushalt kann das Kind betreuen.",
      ],
      docs: ["Ärztliche Bescheinigung aus der Kinderarztpraxis"],
      to: KK,
    },
    {
      k: "kind_zuzahlung",
      area: BEREICH,
      t: "Keine Zuzahlungen unter 18",
      p: "SGB V, u. a. § 31 Abs. 3 und § 33 Abs. 8",
      when: () => istKind(),
      val: () => null,
      short:
        "Kinder und Jugendliche unter 18 zahlen in der gesetzlichen Krankenkasse nichts zu: nicht für Medikamente, Hilfsmittel, Therapien oder im Krankenhaus. Einzige Ausnahme sind Fahrkosten.",
      hinweis: "Dafür ist kein Antrag nötig. Die Befreiung gilt automatisch bis zum 18. Geburtstag.",
      steps: [
        "In Apotheke und Sanitätshaus nichts zuzahlen. Wird doch etwas verlangt, auf das Alter hinweisen.",
        "Bei Fahrten zur Behandlung fällt die Zuzahlung an: 10 % der Kosten, mindestens 5 und höchstens 10 Euro je Fahrt. Diese Quittungen sammeln.",
        "Die Zuzahlungen der ganzen Familie zählen zusammen für die Belastungsgrenze der Eltern.",
      ],
      docs: [],
      to: KK,
    },
    {
      k: "kind_fruehfoerderung",
      area: BEREICH,
      t: "Frühförderung und Sozialpädiatrisches Zentrum",
      p: "§ 46 SGB IX, § 119 SGB V",
      when: () => ["baby", "kind"].includes(alter()),
      val: () => null,
      short:
        "Für Kinder mit Behinderung oder Entwicklungsverzögerung bis zur Einschulung: Therapie, Förderung und Beratung der Eltern aus einer Hand. Für die Familie kostenlos.",
      hinweis: "Dafür ist kein Brief nötig. Der Weg führt über die Kinderarztpraxis oder direkt zur Frühförderstelle.",
      steps: [
        "Kinderärztin oder Kinderarzt ansprechen und eine Überweisung ins Sozialpädiatrische Zentrum (SPZ) oder zur Frühförderstelle holen.",
        "Frühförderstellen kann man auch direkt anrufen. Die erste Beratung steht allen Eltern offen.",
        "Berichte von SPZ und Frühförderung aufheben: Sie sind wichtige Nachweise für Pflegegrad und Schwerbehindertenausweis.",
      ],
      docs: [],
      to: KK,
    },
    {
      k: "kind_schule",
      area: BEREICH,
      t: "Begleitung in Kita und Schule",
      p: "§ 112 SGB IX, § 35a SGB VIII",
      when: () => ["kind", "jugend"].includes(alter()),
      val: () => null,
      short:
        "Braucht dein Kind in Kita oder Schule Hilfe, die das Personal nicht leisten kann, gibt es eine persönliche Begleitung (Integrationshilfe, Schulbegleitung). Für die Familie in der Regel kostenlos.",
      hinweis:
        "Den Antrag stellst du formlos beim Träger der Eingliederungshilfe. Die App hat dafür noch keinen fertigen Brief.",
      steps: [
        "Mit Kita oder Schule besprechen, wobei das Kind Hilfe braucht, und um eine kurze Stellungnahme bitten.",
        "Antrag beim Träger der Eingliederungshilfe stellen, meist beim Sozialamt des Landkreises oder der Stadt. Bei seelischer Behinderung ist das Jugendamt zuständig.",
        "Arztberichte und, wenn vorhanden, den Schwerbehindertenausweis beilegen.",
        "Früh beantragen: Die Bearbeitung dauert oft mehrere Monate.",
      ],
      docs: ["Stellungnahme von Kita oder Schule", "Arztberichte"],
      to: VA,
    },
    {
      k: "kind_merkzeichen",
      area: BEREICH,
      t: "Schwerbehindertenausweis für Kinder: Merkzeichen H",
      p: "§ 152 SGB IX, Versorgungsmedizin-Verordnung",
      when: () => istKind() && !mz("H"),
      val: () => null,
      short: () =>
        `Für das Merkzeichen H (hilflos) gelten bei Kindern eigene Maßstäbe. Es wird oft schon anerkannt, wenn das Kind deutlich mehr Hilfe braucht als Gleichaltrige. Mit H gibt es unter anderem ${BETRAEGE.behindertenPauschbetragErhoeht.toLocaleString("de-DE")} € Steuer-Pauschbetrag im Jahr und die kostenlose Wertmarke für Bus und Bahn.`,
      hinweis: "Der Antrag geht an das Versorgungsamt. Bitte das Merkzeichen H ausdrücklich mit beantragen.",
      steps: [
        "Schwerbehindertenausweis beim Versorgungsamt beantragen und das Merkzeichen H ausdrücklich nennen.",
        "Arztberichte, SPZ-Berichte und den Pflegegrad-Bescheid beilegen.",
        "Bei Kindern gilt das Merkzeichen H häufig nur bis zu einem bestimmten Alter. Rechtzeitig vorher die Verlängerung beantragen.",
      ],
      docs: ["Arztberichte und SPZ-Berichte", "Pflegegrad-Bescheid"],
      to: VA,
    },
    {
      k: "kind_kindergeld",
      area: BEREICH,
      t: "Kindergeld über den 18. und 25. Geburtstag hinaus",
      p: "§ 32 Abs. 4 EStG",
      when: () => alter() === "jugend",
      val: () => null,
      short:
        "Kann sich dein Kind wegen einer Behinderung später nicht selbst unterhalten, gibt es Kindergeld ohne Altersgrenze. Die Behinderung muss vor dem 25. Geburtstag eingetreten sein.",
      hinweis: "Zuständig ist die Familienkasse. Sie hat dafür ein eigenes Formular.",
      steps: [
        "Vor dem 18. Geburtstag bei der Familienkasse melden und nach dem Formular für Kinder mit Behinderung fragen.",
        "Schwerbehindertenausweis oder ärztliche Bescheinigung beilegen.",
        "Mit dem Kindergeld bleiben auch die Freibeträge in der Steuer und die Übertragung des Behinderten-Pauschbetrags erhalten.",
      ],
      docs: ["Schwerbehindertenausweis oder ärztliche Bescheinigung"],
      to: VA,
    },
  );
}
