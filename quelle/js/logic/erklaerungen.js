// Ausführliche Erklärungen zu einzelnen Leistungen: Was ist das, passt es zu uns, was bekommen wir, wer darf helfen,
// was brauchen wir, was passiert danach. Ziel: Man soll sich sicher fühlen, bevor man einen Antrag abschickt.
// Jede Erklärung hat dieselbe Reihenfolge, damit man sich überall gleich zurechtfindet.
// Bewusst ohne Abschnitt „Was kann schiefgehen?“ (Wunsch des Betreibers); Dinge, die über Geld entscheiden,
// stehen sachlich dabei (z. B. was mit dem Pflegegeld passiert).
// Beträge kommen aus config/betraege.js, damit die jährliche Anpassung nur an einer Stelle passiert.
// Jede Aussage ist mit Gesetz oder Kassen-Information belegt (siehe quellen) und wird monatlich mitgeprüft.
import { BETRAEGE } from "../config/betraege.js";
import { JAHRESBETRAG, PG, VHP_ERSATZ } from "../config/stammdaten.js";
import { isHome, pg } from "./lage.js";
import { eur } from "../utils/format.js";

/**
 * @typedef {{wer: string, beispiele: string, zahlt: string, braucht: string}} VergleichZeile
 * @typedef {{
 *   kurz: [string, string][],
 *   passt: {ja: boolean, text: string},
 *   abschnitte: {titel: string, punkte?: string[], vergleich?: VergleichZeile[], beispiel?: string}[],
 *   quellen: string,
 *   geprueft: string
 * }} Erklaerung
 */

/** Wer bei der Verhinderungspflege einspringt und was die Kasse dann zahlt. Auch im Antrag bei „Wer hat gepflegt?“ */
export function vhpVergleich() {
  const grad = Math.max(2, pg());
  const doppelt = PG.pflegegeld[grad] * 2;
  // gleiche Reihenfolge und Namen wie die Auswahl im Antrag (VHP_ERSATZ), damit man sich wiedererkennt
  return /** @type {VergleichZeile[]} */ ([
    {
      wer: VHP_ERSATZ.angehoerig.t,
      beispiele:
        "Kinder, Enkel, Eltern, Großeltern, Geschwister, Schwiegerkinder (zum Beispiel die Schwiegertochter), Schwiegereltern, Schwager, Schwägerin und alle, die mit im Haushalt leben",
      zahlt: `Für die Pflege selbst höchstens zwei Monate Pflegegeld, bei Pflegegrad ${grad} sind das ${eur(doppelt)}. Dazu kommen nachgewiesene Kosten: Fahrten (${String(BETRAEGE.kmPauschale.toFixed(2)).replace(".", ",")} € je Kilometer) und Lohn, auf den sie dafür verzichtet haben. Zusammen höchstens ${eur(JAHRESBETRAG)}.`,
      braucht:
        "Eine Bestätigung mit Zeitraum. Für Fahrten eine Liste mit Datum und Kilometern, für Verdienstausfall eine Bescheinigung vom Arbeitgeber.",
    },
    {
      wer: VHP_ERSATZ.privat.t,
      beispiele: "Nachbarn, Freunde, Bekannte und entferntere Verwandte wie Nichte, Neffe oder Cousine",
      zahlt: `Bis zum vollen Jahresbetrag von ${eur(JAHRESBETRAG)}. Ihr vereinbart einen Stundenlohn, zum Beispiel 15 €.`,
      braucht: "Eine Quittung mit Zeitraum, Stunden und Betrag. Die Vorlage macht die App.",
    },
    {
      wer: VHP_ERSATZ.dienst.t,
      beispiele: "zugelassener Dienst, der eine Rechnung stellt",
      zahlt: `Bis zum vollen Jahresbetrag von ${eur(JAHRESBETRAG)}, nach Rechnung. Oft rechnet der Dienst direkt mit der Kasse ab.`,
      braucht: "Die Rechnung mit Zeitraum.",
    },
    {
      wer: VHP_ERSATZ.heim.t,
      beispiele: "für ein paar Tage oder Wochen in einer Einrichtung",
      zahlt: `Aus demselben Jahresbetrag. Die Kasse zahlt die Pflege, Unterkunft und Essen zahlt ihr selbst. Dafür kann der Entlastungsbetrag helfen.`,
      braucht: "Die Rechnung der Einrichtung.",
    },
  ]);
}

/** @type {Record<string, () => Erklaerung>} */
const ERKLAERUNGEN = {
  jahresbetrag: () => {
    const grad = Math.max(2, pg());
    const doppelt = PG.pflegegeld[grad] * 2;
    const ja = pg() >= 2 && isHome();
    return {
      kurz: [
        [
          "Wofür?",
          "Die Person, die sonst pflegt, braucht eine Pause oder fällt aus: Urlaub, Krankheit, ein Arzttermin, ein freier Nachmittag. Die Kasse bezahlt, wer in dieser Zeit einspringt.",
        ],
        [
          "Was bekommt ihr?",
          `Bis ${eur(JAHRESBETRAG)} im Jahr als Erstattung. Verhinderungspflege und Kurzzeitpflege teilen sich diesen Betrag.`,
        ],
        [
          "Wann beantragen?",
          "Hinterher, mit Quittung oder Rechnung. Vorher muss nichts beantragt werden. Spätestens bis zum 31. Dezember des folgenden Jahres.",
        ],
      ],
      passt: {
        ja,
        text: ja
          ? `Nach euren Angaben passt das: Pflegegrad ${pg()} und Pflege zu Hause.`
          : "Nach euren Angaben passt das gerade nicht: Es braucht Pflegegrad 2 oder höher und Pflege zu Hause.",
      },
      abschnitte: [
        {
          titel: "Passt das zu euch?",
          punkte: [
            "Pflegegrad 2 oder höher, gepflegt wird zu Hause.",
            "Die Person, die sonst pflegt, ist verhindert. Der Grund ist egal: Urlaub, Krankheit, Termine oder einfach Erholung.",
            "Seit Juli 2025 muss vorher nicht mehr ein halbes Jahr gepflegt worden sein.",
            "Höchstens 8 Wochen im Jahr. Wer nur ein paar Stunden am Tag ausfällt (weniger als 8 Stunden), verbraucht davon nichts.",
          ],
        },
        {
          titel: "Wer springt ein? Das macht den Unterschied",
          vergleich: vhpVergleich(),
          beispiel: `Beispiel bei Pflegegrad ${grad}: Jemand hilft 200 Stunden im Jahr für 15 € pro Stunde, das sind 3.000 €. Ist es die Nachbarin, erstattet die Kasse die vollen 3.000 €. Ist es die Tochter oder die Schwiegertochter, erstattet sie für die Pflege ${eur(doppelt)}, dazu ihre Fahrtkosten. Bei wenigen Stunden ist der Unterschied egal: 40 Stunden für 15 € sind 600 €, das zahlt die Kasse in beiden Fällen.`,
        },
        {
          titel: "Was passiert mit dem Pflegegeld?",
          punkte: [
            "Fällt die Pflegeperson ganze Tage aus, gibt es für diese Zeit das halbe Pflegegeld, bis zu 8 Wochen im Jahr. Am ersten und am letzten Tag gibt es das volle.",
            "Fällt sie nur ein paar Stunden am Tag aus (weniger als 8), läuft das Pflegegeld ganz normal weiter.",
          ],
        },
        {
          titel: "Was ihr braucht",
          punkte: [
            "Den Zeitraum: von wann bis wann.",
            "Wer sonst pflegt und warum diese Person verhindert war.",
            "Wer eingesprungen ist: Name und Anschrift.",
            "Den Beleg, je nachdem wer geholfen hat (siehe oben).",
            "Ein Konto: eures oder direkt das der Person, die geholfen hat.",
          ],
        },
        {
          titel: "Nach dem Abschicken",
          punkte: [
            "Die Kasse prüft die Belege und überweist den Betrag. Fehlt etwas, schreibt sie euch.",
            "Kommt nach 4 Wochen keine Antwort, erinnert dich die App und hat einen Brief zum Nachfragen fertig.",
          ],
        },
        {
          titel: "Gut zu wissen",
          punkte: [
            "Ihr könnt den Betrag frei aufteilen: mehrmals im Jahr, tageweise oder stundenweise.",
            "Was vom Jahresbetrag noch übrig ist, zeigt die Karte „Budgets“ weiter unten.",
            "Für die Person, die einspringt, ist das Geld Einkommen. Ob sie dafür Steuern zahlen muss, hängt von ihrer Lage ab.",
          ],
        },
      ],
      quellen: "§ 39 und § 42a SGB XI in der Fassung ab 1. Januar 2026",
      geprueft: "24.11.2026",
    };
  },
};

/**
 * Ausführliche Erklärung zu einer Leistung, oder null, wenn es (noch) keine gibt.
 * @param k Schlüssel der Leistung
 * @returns {Erklaerung|null}
 */
export function erklaerung(k) {
  return ERKLAERUNGEN[k] ? ERKLAERUNGEN[k]() : null;
}

/** Was bei jedem Antrag gilt und Sicherheit gibt (steht auf der letzten Seite vor dem Abschicken). */
export const SICHER_ABSCHICKEN = [
  "Ein formloser Brief wie dieser reicht. Schickt die Kasse danach ein eigenes Formular, füllst du es einfach noch aus.",
  "Landet der Antrag bei der falschen Stelle, muss sie ihn weiterleiten. Das Datum bleibt gültig (§ 16 SGB I).",
  "Ein Antrag kostet nichts (§ 64 SGB X).",
];
