// Inhalte der ausführlichen Erklärungen für alle Leistungen außer der Verhinderungspflege (die steht mit ihrem
// Vergleich in logic/erklaerungen.js). Jede Erklärung folgt demselben Aufbau (siehe aus()):
// kurz (Wofür, was bekommt ihr, wann), Voraussetzungen, Worauf ihr achten solltet, was ihr braucht,
// nach dem Abschicken, gut zu wissen, Quelle. Beträge kommen aus config/, damit es jedes Jahr nur eine Stelle gibt.
// Stand der Prüfung: GEPRUEFT. Bei Gesetzesänderungen hier mit anpassen (monatliche Prüfung).
import { BETRAEGE } from "../config/betraege.js";
import { DIPA, DIPA_UL, ENTLASTUNG, PG, VERBRAUCH, WG, WOHNUMFELD } from "../config/stammdaten.js";
import { gdb, pg } from "./lage.js";
import { B, txt } from "./leistungen.js";
import { eur } from "../utils/format.js";

/** Datum, an dem die Inhalte zuletzt gegen Gesetz und amtliche Quellen geprüft wurden */
export const GEPRUEFT = "24.11.2026";

/** Wer den Antrag bekommt, als Satzanfang */
const STELLE = {
  pflegekasse: "Die Pflegekasse",
  krankenkasse: "Die Krankenkasse",
  versorgungsamt: "Das Versorgungsamt",
  sozialamt: "Das Sozialamt",
  hauptzollamt: "Das Hauptzollamt",
  strassenverkehrsbehoerde: "Die Straßenverkehrsbehörde",
  beitragsservice: "Der Beitragsservice",
  arbeitsagentur: "Die Agentur für Arbeit",
  rentenversicherung: "Die Rentenversicherung",
};

/** Pflegegrad für Beispiele: der eigene, mindestens 2 (vorher gibt es die meisten Beträge nicht) */
const grad = () => Math.max(2, pg());

/**
 * Passt die Leistung nach den Angaben? Nutzt dieselbe Prüfung wie die Liste der Ansprüche.
 * @param k Schlüssel der Leistung
 * @param grund Satz, warum es passt (sonst ein allgemeiner)
 */
function passtFuer(k, grund = "") {
  const b = B.find((x) => x.k === k);
  let ja = false;
  try {
    ja = !!(b && b.when());
  } catch (e) {}
  if (!ja) return { ja: false, text: "Nach euren Angaben passt das gerade nicht. Die Voraussetzungen stehen unten." };
  if (b.opt) return { ja: false, text: "Ob es sich lohnt, hängt von eurer Lage ab. Die Voraussetzungen stehen unten." };
  return { ja: true, text: grund || "Nach euren Angaben kommt das für euch in Frage." };
}

/**
 * Was nach dem Abschicken passiert, wenn nichts Besonderes gilt.
 * @param k Schlüssel der Leistung
 */
function danachStandard(k) {
  const b = B.find((x) => x.k === k);
  if (!b || !b.ask) return [];
  if (b.to === "finanzamt")
    return [
      "Das Finanzamt berücksichtigt den Betrag im Steuerbescheid.",
      "Fehlt er im Bescheid, könnt ihr innerhalb eines Monats Einspruch einlegen, am einfachsten über ELSTER.",
    ];
  const wer = STELLE[b.to] || "Die Stelle";
  return [
    `${wer} prüft den Antrag und schickt einen Bescheid. Fehlt etwas, kommt vorher ein Brief.`,
    "Kommt nach 4 Wochen keine Antwort, erinnert dich die App und hat einen Brief zum Nachfragen fertig.",
    "Wird der Antrag abgelehnt, habt ihr einen Monat Zeit für einen Widerspruch. Die App hilft dabei.",
  ];
}

/**
 * Baut eine Erklärung im festen Aufbau. Leere Abschnitte fallen weg.
 * @param k Schlüssel der Leistung
 * @param {{kurz: [string, string, string], wann?: string, grund?: string, bedingungen: string[], extra?: any[],
 *   achten?: string[], brauchen?: string[], danach?: string[], gut?: string[], quellen: string}} o
 * @returns {import("./erklaerungen.js").Erklaerung}
 */
function aus(k, o) {
  const b = B.find((x) => x.k === k);
  const docs = o.brauchen || (b ? txt(b.docs) || [] : []);
  return {
    kurz: [
      ["Wofür?", o.kurz[0]],
      ["Was bekommt ihr?", o.kurz[1]],
      [o.wann || "Wann beantragen?", o.kurz[2]],
    ],
    passt: passtFuer(k, o.grund),
    abschnitte: [
      { titel: "Voraussetzungen", punkte: o.bedingungen },
      ...(o.extra || []),
      { titel: "Worauf ihr achten solltet", achtung: true, punkte: o.achten || [] },
      { titel: "Was ihr braucht", punkte: docs },
      { titel: "Nach dem Abschicken", punkte: o.danach || danachStandard(k) },
      { titel: "Gut zu wissen", punkte: o.gut || [] },
    ].filter((a) => (a.punkte && a.punkte.length) || a.vergleich),
    quellen: o.quellen,
    geprueft: GEPRUEFT,
  };
}

/** Begutachtung und Bescheid: gleich bei Erstantrag und Höherstufung */
const DANACH_BEGUTACHTUNG = [
  "Der Medizinische Dienst meldet sich für einen Termin, meist bei euch zu Hause. Bei privat Versicherten kommt Medicproof.",
  "Die Kasse muss spätestens 25 Arbeitstage nach dem Antrag entscheiden. Liegt die Verspätung an ihr, zahlt sie 70 € für jede angefangene Woche.",
  "Das Gutachten bekommt ihr auf Wunsch. Lest es, bevor die Frist für den Widerspruch abläuft.",
];

/** @type {Record<string, () => import("./erklaerungen.js").Erklaerung>} */
export const TEXTE = {
  pg_antrag: () =>
    aus("pg_antrag", {
      kurz: [
        "Der Pflegegrad ist der Schlüssel zu fast allen Leistungen der Pflegekasse. Er zeigt, wie viel Hilfe jemand im Alltag braucht.",
        `Je nach Pflegegrad Geld und Hilfen. Ab Pflegegrad 2 zum Beispiel Pflegegeld von ${eur(PG.pflegegeld[2])} bis ${eur(PG.pflegegeld[5])} im Monat.`,
        "So früh wie möglich. Die Leistungen gibt es ab dem Monat, in dem der Antrag bei der Kasse eingeht.",
      ],
      bedingungen: [
        "Hilfe im Alltag wird voraussichtlich mindestens 6 Monate gebraucht.",
        "In den letzten 10 Jahren mindestens 2 Jahre pflegeversichert (bei Kindern zählt die Versicherung der Eltern).",
        "Eine Gutachterin oder ein Gutachter prüft sechs Bereiche, zum Beispiel Mobilität, Erinnern und Selbstversorgung, und vergibt Punkte. Ab 12,5 Punkten gibt es Pflegegrad 1, ab 27 Pflegegrad 2, ab 47,5 Pflegegrad 3, ab 70 Pflegegrad 4 und ab 90 Pflegegrad 5.",
      ],
      achten: [
        "Nicht aufschieben: Für die Zeit vor dem Antrag gibt es kein Geld.",
        "Beim Termin einen normalen Tag beschreiben, nicht einen guten. Auch Hilfe nennen, die selbstverständlich geworden ist, zum Beispiel Erinnern oder nachts aufstehen.",
        "Gegen den Bescheid habt ihr nur einen Monat Zeit für einen Widerspruch.",
      ],
      danach: DANACH_BEGUTACHTUNG,
      gut: [
        "Die Kasse muss euch eine kostenlose Pflegeberatung anbieten, auf Wunsch zu Hause.",
        "Liegt die Person im Krankenhaus oder kommt aus der Reha, wird schneller begutachtet.",
        "Der Pflegegrad-Rechner der App schätzt vorher ein, welcher Pflegegrad möglich ist.",
      ],
      quellen: "§§ 14, 15, 18, 18c und 33 SGB XI",
    }),

  pg_hoch: () => {
    const n = Math.min(5, Math.max(1, pg()) + 1);
    const mehr = PG.pflegegeld[n] - PG.pflegegeld[Math.max(1, pg())];
    return aus("pg_hoch", {
      kurz: [
        "Der Zustand hat sich verschlechtert und es wird mehr Hilfe gebraucht als bei der letzten Begutachtung.",
        `Höhere Beträge bei allen Leistungen. Bei Pflegegrad ${n} zum Beispiel ${eur(mehr)} mehr Pflegegeld im Monat.`,
        "Sobald der Bedarf dauerhaft gestiegen ist. Der höhere Pflegegrad gilt ab dem Monat des Antrags.",
      ],
      bedingungen: [
        "Der Hilfebedarf ist deutlich gestiegen und bleibt voraussichtlich mindestens 6 Monate so.",
        "Bei der neuen Begutachtung reichen die Punkte für den nächsten Pflegegrad (ab 27, 47,5, 70 oder 90 Punkten).",
      ],
      achten: [
        "Die neue Begutachtung bewertet alles neu. In seltenen Fällen kommt dabei ein niedrigerer Pflegegrad heraus.",
        "Vorher mit dem Pflegegrad-Rechner prüfen, ob die Punkte reichen könnten.",
        "Gegen den Bescheid habt ihr einen Monat Zeit für einen Widerspruch.",
      ],
      danach: DANACH_BEGUTACHTUNG,
      gut: ["Ein Pflegetagebuch über ein bis zwei Wochen zeigt dem Gutachter, was sich verändert hat."],
      quellen: "§§ 15, 18 und 18c SGB XI",
    });
  },

  pflegegeld: () => {
    const g = grad();
    const kombi = Math.round(PG.pflegegeld[g] * 0.6);
    return aus("pflegegeld", {
      kurz: [
        "Geld für die Pflege zu Hause durch Angehörige, Freunde oder Nachbarn. Ihr könnt es frei verwenden, oft wird es an die pflegende Person weitergegeben.",
        `${eur(PG.pflegegeld[g])} im Monat bei Pflegegrad ${g}. Je nach Pflegegrad ${eur(PG.pflegegeld[2])} bis ${eur(PG.pflegegeld[5])}.`,
        "Sobald die Pflege zu Hause läuft. Das Geld gibt es ab dem Monat des Antrags.",
      ],
      bedingungen: [
        "Pflegegrad 2 oder höher.",
        "Die Pflege zu Hause ist sichergestellt, durch Menschen, die das nicht beruflich machen.",
        "Gepflegt wird zu Hause oder in einer Wohngruppe, nicht im Heim.",
      ],
      extra: [
        {
          titel: "Pflegegeld, Pflegedienst oder beides?",
          vergleich: [
            {
              wer: "Nur Pflegegeld",
              beispiele: "Angehörige oder Bekannte pflegen allein",
              zahlt: `${eur(PG.pflegegeld[g])} im Monat auf euer Konto.`,
              braucht: "Den Antrag mit Namen der Pflegeperson und Konto.",
            },
            {
              wer: "Nur Pflegedienst",
              beispiele: "der Dienst übernimmt die Pflege",
              zahlt: `Bis ${eur(PG.sachleistung[g])} im Monat direkt an den Dienst. Pflegegeld gibt es dann nicht.`,
              braucht: "Einen Pflegevertrag mit einem zugelassenen Dienst.",
            },
            {
              wer: "Beides (Kombination)",
              beispiele: "der Dienst hilft, Angehörige pflegen auch",
              zahlt: `Was der Dienst vom Budget nicht verbraucht, gibt es anteilig als Pflegegeld. Nutzt er 40 %, bekommt ihr 60 % des Pflegegeldes, also ${eur(kombi)}.`,
              braucht: "Pflegevertrag und Antrag auf Kombinationsleistung.",
            },
          ],
        },
      ],
      achten: [
        "Der Beratungsbesuch ist Pflicht: einmal im Halbjahr (bis Ende März 2027 darf jeder zweite per Video sein). Ohne Nachweis kürzt die Kasse das Pflegegeld, bei Wiederholung fällt es weg. Die App erinnert daran.",
        "Im Krankenhaus oder in der Reha läuft das Pflegegeld nur die ersten 4 Wochen weiter.",
        "Während Verhinderungs- oder Kurzzeitpflege gibt es für ganze Tage nur das halbe Pflegegeld.",
      ],
      danach: [
        "Die Pflegekasse überweist das Pflegegeld jeden Monat.",
        "Den ersten Beratungsbesuch mit einem Pflegedienst vereinbaren. Er kostet euch nichts.",
      ],
      gut: [
        "Gebt ihr das Pflegegeld an pflegende Angehörige weiter, müssen sie es nicht versteuern.",
        "Die pflegende Person kann zusätzlich Rentenbeiträge bekommen (siehe „Rentenbeiträge für die Pflegeperson“).",
      ],
      quellen: "§§ 34, 37 und 38 SGB XI, § 3 Nr. 36 EStG",
    });
  },

  sachleistung: () => {
    const g = grad();
    return aus("sachleistung", {
      kurz: [
        "Ein zugelassener Pflegedienst kommt nach Hause, zum Beispiel zum Waschen, Anziehen oder für Medikamente.",
        `Bis ${eur(PG.sachleistung[g])} im Monat bei Pflegegrad ${g}. Der Dienst rechnet direkt mit der Kasse ab.`,
        "Bevor der Dienst anfängt: Dienst aussuchen, Vertrag schließen, Kasse informieren.",
      ],
      bedingungen: [
        "Pflegegrad 2 oder höher.",
        "Gepflegt wird zu Hause oder in einer Wohngruppe.",
        "Der Pflegedienst ist von den Pflegekassen zugelassen.",
      ],
      achten: [
        "Was über dem Höchstbetrag liegt, zahlt ihr selbst. Lasst euch vorher einen Kostenvoranschlag geben.",
        "Nutzt ihr den Dienst und Pflegegeld, sinkt das Pflegegeld um den Anteil, den der Dienst verbraucht.",
      ],
      gut: [
        "Den Pflegevertrag könnt ihr jederzeit ohne Frist kündigen.",
        "Bis zu 40 % des Budgets dürft ihr für anerkannte Hilfen im Alltag nutzen, zum Beispiel Haushaltshilfe.",
        "Die Kasse hat eine Liste mit den Preisen der Dienste in eurer Nähe.",
      ],
      quellen: "§§ 36, 38, 45a Abs. 4 und 120 SGB XI",
    });
  },

  entlastung: () =>
    aus("entlastung", {
      kurz: [
        "Für Hilfe, die euch im Alltag entlastet: Haushaltshilfe, Begleitung, Betreuung, auch Tages- oder Kurzzeitpflege.",
        `${eur(ENTLASTUNG)} im Monat, also ${eur(ENTLASTUNG * 12)} im Jahr, als Erstattung gegen Rechnung.`,
        "Nachdem die Hilfe da war: Rechnung bei der Kasse einreichen. Oder der Anbieter rechnet direkt ab.",
      ],
      bedingungen: [
        "Pflegegrad 1 oder höher, gepflegt wird zu Hause.",
        "Der Anbieter ist nach Landesrecht anerkannt. In manchen Ländern können sich auch Nachbarn als Helfer anerkennen lassen.",
      ],
      achten: [
        "Nur anerkannte Anbieter zählen. Eine private Putzhilfe ohne Anerkennung erstattet die Kasse nicht. Vorher fragen: Seid ihr anerkannt?",
        "Nicht genutztes Geld wird ins nächste Halbjahr übertragen, verfällt aber am 30. Juni des folgenden Jahres.",
        "Erstattet wird nur, was mit Rechnung belegt ist.",
      ],
      gut: [
        "Der Betrag kommt zusätzlich zu Pflegegeld oder Pflegedienst.",
        "Ihr könnt ihn auch für Essen und Unterkunft in der Tages- oder Kurzzeitpflege nutzen.",
        "Unterschreibt ihr beim Anbieter eine Abtretungserklärung, rechnet er direkt mit der Kasse ab.",
      ],
      quellen: "§§ 45a und 45b SGB XI",
    }),

  tagespflege: () => {
    const g = grad();
    return aus("tagespflege", {
      kurz: [
        "Die pflegebedürftige Person verbringt den Tag (oder die Nacht) in einer Einrichtung und kommt danach nach Hause. Gut, wenn Angehörige arbeiten oder Entlastung brauchen.",
        `Ein eigenes Budget bis ${eur(PG.tagespflege[g])} im Monat bei Pflegegrad ${g}, zusätzlich zu Pflegegeld oder Pflegedienst. Die Fahrten gehören dazu.`,
        "Vor dem Start: Platz suchen, Probetag machen, dann bei der Kasse beantragen.",
      ],
      bedingungen: [
        "Pflegegrad 2 oder höher.",
        "Die Pflege zu Hause soll ergänzt oder gestärkt werden.",
        "Die Einrichtung ist von den Pflegekassen zugelassen.",
      ],
      achten: [
        "Essen, Unterkunft und Investitionskosten zahlt ihr selbst, pro Besuchstag. Fragt vorher nach dem Betrag.",
        "Dafür könnt ihr den Entlastungsbetrag nutzen.",
      ],
      gut: [
        "Pflegegeld und Pflegedienst werden dadurch nicht gekürzt.",
        "Die Fahrt von zu Hause zur Einrichtung und zurück gehört zur Leistung. Fragt, ob die Einrichtung sie anbietet.",
      ],
      quellen: "§ 41 SGB XI",
    });
  },

  verbrauch: () =>
    aus("verbrauch", {
      kurz: [
        "Für Dinge, die bei der Pflege verbraucht werden: Einmalhandschuhe, Desinfektion, Bettschutzeinlagen, Mundschutz.",
        `Bis ${eur(VERBRAUCH)} im Monat. Meist kommt jeden Monat eine Box kostenlos nach Hause.`,
        "Jederzeit. Nach der Zusage kommt die Box jeden Monat.",
      ],
      bedingungen: ["Pflegegrad 1 oder höher.", "Gepflegt wird zu Hause, nicht im Heim."],
      achten: [
        "Nur einen Anbieter wählen. Die Kasse zahlt nur einmal im Monat.",
        "Windeln und Einlagen gehören nicht dazu. Die verordnet die Ärztin oder der Arzt über die Krankenkasse.",
        "Was in einem Monat nicht genutzt wird, verfällt.",
      ],
      quellen: "§ 40 Abs. 2 SGB XI",
    }),

  technisch: () =>
    aus("technisch", {
      kurz: [
        "Für Hilfsmittel, die die Pflege leichter oder sicherer machen: Hausnotruf, Pflegebett, Lagerungshilfen.",
        `Die Kasse übernimmt die Kosten oder leiht das Hilfsmittel aus. Ihr zahlt 10 % zu, höchstens ${eur(BETRAEGE.hilfsmittelZuzahlungMax)} je Hilfsmittel.`,
        "Vorher beantragen und erst nach der Zusage kaufen.",
      ],
      bedingungen: [
        "Pflegegrad 1 oder höher, gepflegt wird zu Hause.",
        "Das Hilfsmittel erleichtert die Pflege oder ein selbstständigeres Leben.",
      ],
      achten: [
        "Wer vor der Zusage kauft, bleibt meist auf den Kosten sitzen.",
        "Manches zahlt die Krankenkasse statt der Pflegekasse, zum Beispiel einen Rollator wegen einer Krankheit. Geht der Antrag an die falsche Kasse, leitet sie ihn weiter.",
      ],
      gut: [
        "Was im Pflegegutachten empfohlen wurde, gilt als beantragt, wenn ihr zustimmt.",
        "Wird ein Hilfsmittel nur geliehen, zahlt ihr nichts zu.",
        "Für den Hausnotruf zahlt die Kasse einen monatlichen Zuschuss.",
      ],
      quellen: "§ 40 Abs. 1 und 3 SGB XI",
    }),

  wohnumfeld: () =>
    aus("wohnumfeld", {
      kurz: [
        "Für Umbauten, die das Leben zu Hause leichter machen: bodengleiche Dusche, Treppenlift, breitere Türen, Haltegriffe.",
        `Bis ${eur(WOHNUMFELD)} je Maßnahme. Leben mehrere Pflegebedürftige zusammen, bis ${eur(WOHNUMFELD * 4)}.`,
        "Unbedingt vor Baubeginn beantragen.",
      ],
      bedingungen: [
        "Pflegegrad 1 oder höher.",
        "Der Umbau erleichtert die Pflege oder ein selbstständigeres Leben zu Hause.",
      ],
      achten: [
        "Ohne vorherige Zusage zahlt die Kasse meist nichts. Erst den Bescheid abwarten, dann bauen.",
        "Alle Umbauten, die zur gleichen Zeit nötig sind, zählen zusammen als eine Maßnahme.",
        "In einer Mietwohnung vorher die Vermieterin oder den Vermieter fragen.",
      ],
      gut: [
        "Ändert sich die Lage später, zum Beispiel durch einen höheren Pflegegrad, gibt es für neue Umbauten wieder Geld.",
      ],
      quellen: "§ 40 Abs. 4 SGB XI",
    }),

  dipa: () =>
    aus("dipa", {
      kurz: [
        "Für zugelassene Pflege-Apps, zum Beispiel Training gegen Stürze oder Hilfe bei Demenz.",
        `Bis ${eur(DIPA)} im Monat für die App und ${eur(DIPA_UL)} für Unterstützung durch einen Pflegedienst dabei.`,
        "Vorher beantragen. Nach der Zusage kommt ein Freischaltcode.",
      ],
      bedingungen: [
        "Pflegegrad 1 oder höher, gepflegt wird zu Hause.",
        "Die App steht im offiziellen Verzeichnis für digitale Pflegeanwendungen (DiPA) beim BfArM.",
      ],
      achten: [
        "Nur Apps aus dem offiziellen Verzeichnis zählen, nicht beliebige Apps aus dem App-Store.",
        "Das Verzeichnis ist noch klein. Schaut vorher nach, ob es eine passende App gibt.",
      ],
      quellen: "§§ 40a und 40b SGB XI",
    }),

  wg: () =>
    aus("wg", {
      kurz: [
        "Für Menschen, die in einer ambulant betreuten Wohngruppe (Pflege-WG) leben.",
        `${eur(WG)} im Monat pauschal für eine Person, die in der WG organisiert und unterstützt.`,
        "Sobald ihr in der WG wohnt.",
      ],
      bedingungen: [
        "Pflegegrad 1 oder höher, Bezug von Pflegegeld, Pflegedienst oder Entlastungsbetrag.",
        "In der Wohnung leben 3 bis 12 Personen, davon mindestens 3 Pflegebedürftige.",
        "Die WG hat gemeinsam eine Person beauftragt, die organisiert und im Alltag hilft (Präsenzkraft).",
      ],
      achten: ["Die Kasse will Nachweise über Wohngruppe und Präsenzkraft sehen."],
      quellen: "§ 38a SGB XI",
    }),

  beratung: () =>
    aus("beratung", {
      kurz: [
        "Eine persönliche Beraterin oder ein Berater hilft, alle Leistungen zu planen und Anträge zu stellen.",
        "Kostenlose Beratung, auf Wunsch bei euch zu Hause, auch per Telefon oder Video.",
        "Jederzeit, am besten gleich am Anfang.",
      ],
      bedingungen: [
        "Wer Leistungen der Pflegekasse bekommt oder beantragt hat.",
        "Angehörige können mitberaten werden, wenn die pflegebedürftige Person einverstanden ist.",
      ],
      danach: ["Die Kasse oder der Pflegestützpunkt vereinbart mit euch einen Termin."],
      gut: [
        "Nach einem Antrag auf einen Pflegegrad muss die Kasse innerhalb von zwei Wochen einen Termin anbieten.",
        "Nehmt die „Übersicht für die Beratung“ aus der App mit. Dann geht es schneller.",
      ],
      quellen: "§§ 7a und 7b SGB XI",
    }),

  pflegekurs: () =>
    aus("pflegekurs", {
      kurz: [
        "Angehörige lernen, wie Pflege leichter geht: Heben, Lagern, Umgang mit Demenz, auch auf sich selbst achten.",
        "Kostenlose Kurse, online oder als Schulung bei euch zu Hause.",
        "Jederzeit.",
      ],
      wann: "Wann anmelden?",
      bedingungen: ["Für Angehörige und alle, die ehrenamtlich pflegen. Ein bestimmter Pflegegrad ist nicht nötig."],
      danach: ["Die Kasse nennt euch Kurse in der Nähe oder online."],
      quellen: "§ 45 SGB XI",
    }),

  rv: () => {
    const g = grad();
    return aus("rv", {
      kurz: [
        "Wer viel pflegt, bekommt dafür Rentenpunkte, als würde er arbeiten.",
        `Die Pflegekasse zahlt Beiträge in die Rentenversicherung der pflegenden Person, bei Pflegegrad ${g} bis ${eur(PG.rv[g], 2)} im Monat. Dazu kommen Arbeitslosen- und Unfallversicherung.`,
        "Sobald die Pflege so viel Zeit braucht. Die Kasse schickt dafür einen Fragebogen.",
      ],
      bedingungen: [
        "Pflegegrad 2 oder höher, gepflegt wird zu Hause.",
        "Mindestens 10 Stunden pro Woche Pflege, verteilt auf mindestens 2 Tage.",
        "Die pflegende Person arbeitet nebenbei höchstens 30 Stunden pro Woche.",
        "Sie bezieht noch keine volle Altersrente nach Erreichen der Regelaltersgrenze.",
      ],
      achten: [
        "Ohne ausgefüllten Fragebogen zahlt die Kasse nichts.",
        "Am höchsten sind die Beiträge, wenn nur Pflegegeld bezogen wird. Mit Pflegedienst werden sie geringer.",
        "Pflegen mehrere Personen, wird aufgeteilt.",
      ],
      gut: ["Bei der Pflege ist die pflegende Person automatisch unfallversichert."],
      quellen: "§ 44 SGB XI, § 3 SGB VI",
    });
  },

  pug: () =>
    aus("pug", {
      kurz: [
        "Für eine plötzliche Pflegesituation, zum Beispiel nach einem Sturz oder Krankenhaus, wenn die Pflege erst organisiert werden muss.",
        `Bis zu ${BETRAEGE.pugTage} Arbeitstage im Jahr frei. Die Pflegekasse zahlt ${BETRAEGE.pugProzent} % des Nettolohns.`,
        "Sofort: Arbeitgeber informieren, dann Antrag bei der Pflegekasse der gepflegten Person.",
      ],
      bedingungen: [
        "Angestellt (nicht selbstständig) und naher Angehöriger der pflegebedürftigen Person.",
        "Eine akute Pflegesituation, ärztlich bescheinigt. Der Pflegegrad muss noch nicht feststehen.",
        "Der Arbeitgeber zahlt für diese Tage keinen Lohn.",
      ],
      achten: [
        "Den Arbeitgeber sofort informieren. Auf Verlangen die ärztliche Bescheinigung vorlegen.",
        "Die Tage gelten je pflegebedürftiger Person und Jahr.",
      ],
      quellen: "§ 44a SGB XI, § 2 Pflegezeitgesetz",
    }),

  pflegepausch: () => {
    const g = grad();
    return aus("pflegepausch", {
      kurz: [
        "Ein Steuervorteil für Angehörige, die ohne Bezahlung pflegen.",
        `${eur(PG.pflegePausch[g])} im Jahr bei Pflegegrad ${g} weniger zu versteuern. Bei Pflegegrad 4 und 5 sind es ${eur(PG.pflegePausch[4])}.`,
        "Mit der Steuererklärung, auch für zurückliegende Jahre, die noch offen sind.",
      ],
      wann: "Wann eintragen?",
      bedingungen: [
        "Die gepflegte Person hat Pflegegrad 2 oder höher.",
        "Ihr pflegt persönlich und bekommt dafür kein Geld.",
        "Gepflegt wird in eurer Wohnung oder der der gepflegten Person, in Deutschland oder einem anderen EU-Land.",
      ],
      achten: [
        "Bekommt ihr für die Pflege Geld, auch weitergegebenes Pflegegeld, gibt es den Pauschbetrag nicht. Ausnahme: Eltern, die für ihr Kind Pflegegeld bekommen.",
        "Pflegen mehrere Personen, wird der Betrag aufgeteilt.",
      ],
      quellen: "§ 33b Abs. 6 EStG",
    });
  },

  stationaer: () => {
    const g = grad();
    return aus("stationaer", {
      kurz: [
        "Für die Pflege im Pflegeheim.",
        `Die Pflegekasse zahlt bei Pflegegrad ${g} ${eur(PG.stationaer[g])} im Monat direkt an das Heim. Dazu kommt ein Zuschlag zum Eigenanteil.`,
        "Mit dem Einzug: Heimvertrag an die Kasse schicken.",
      ],
      bedingungen: ["Pflegegrad 2 oder höher.", "Das Heim ist von den Pflegekassen zugelassen."],
      achten: [
        "Unterkunft, Essen und Investitionskosten zahlt ihr selbst, dazu einen Eigenanteil für die Pflege. Zusammen sind das oft mehrere tausend Euro im Monat.",
        "Im Heim gibt es kein Pflegegeld mehr.",
        "Reicht das Geld nicht, hilft das Sozialamt (siehe „Hilfe zur Pflege“). Früh beantragen.",
      ],
      quellen: "§ 43 SGB XI",
    });
  },

  zuschlag: () => {
    const z = BETRAEGE.heimZuschlag;
    return aus("zuschlag", {
      kurz: [
        "Er senkt den Eigenanteil für die Pflege im Heim, je länger man dort lebt.",
        `${z[0]} % des Eigenanteils im ersten Jahr, ${z[1]} % ab 12 Monaten, ${z[2]} % ab 24 Monaten, ${z[3]} % ab 36 Monaten.`,
        "Er kommt von selbst. Ihr prüft, ob er auf der Heimrechnung richtig abgezogen ist.",
      ],
      wann: "Was müsst ihr tun?",
      bedingungen: ["Pflegegrad 2 oder höher.", "Pflege in einem zugelassenen Pflegeheim."],
      achten: [
        "Frühere Heimaufenthalte zählen mit, auch in anderen Heimen. Die Kasse kennt sie nicht immer: selbst melden.",
        "Der Zuschlag gilt nur für den Eigenanteil der Pflege, nicht für Unterkunft und Essen.",
      ],
      quellen: "§ 43c SGB XI",
    });
  },

  hzp: () =>
    aus("hzp", {
      kurz: [
        "Wenn Rente und Ersparnisse für Heim oder Pflege nicht reichen.",
        "Das Sozialamt übernimmt den Teil, den ihr nicht zahlen könnt.",
        "Sobald das Geld knapp wird, nicht erst wenn es aufgebraucht ist.",
      ],
      bedingungen: [
        "Eigenes Einkommen und Vermögen reichen nicht. Bis 10.000 € Erspartes pro Person dürfen bleiben.",
        `Kinder müssen nur zahlen, wenn sie mehr als ${eur(BETRAEGE.elternunterhaltGrenze)} brutto im Jahr verdienen.`,
      ],
      achten: [
        "Hilfe gibt es erst ab dem Tag, an dem das Sozialamt davon erfährt. Früh melden.",
        "Das Sozialamt prüft Schenkungen der letzten 10 Jahre und kann sie zurückfordern.",
      ],
      quellen: "§§ 18, 61 ff., 90 und 94 SGB XII",
    }),

  eingliederung: () =>
    aus("eingliederung", {
      kurz: [
        "Für Menschen mit Pflegegrad, die in einer Einrichtung der Eingliederungshilfe leben, zum Beispiel einem Wohnheim für Menschen mit Behinderung.",
        `Die Pflegekasse zahlt 15 % der Vergütung, höchstens ${eur(BETRAEGE.eingliederungMax)} im Monat, an die Einrichtung. An Tagen zu Hause gibt es anteilig Pflegegeld.`,
        "Die Einrichtung rechnet ab. Tage zu Hause meldet ihr der Kasse.",
      ],
      wann: "Was müsst ihr tun?",
      bedingungen: ["Pflegegrad 2 oder höher.", "Leben in einer Einrichtung der Eingliederungshilfe."],
      achten: [
        "Für Tage zu Hause, zum Beispiel am Wochenende, gibt es Pflegegeld nur anteilig. Die Tage aufschreiben.",
      ],
      quellen: "§ 43a SGB XI",
    }),

  fahrten: () =>
    aus("fahrten", {
      kurz: [
        "Für Fahrten zu Arztterminen und Behandlungen, wenn man nicht allein hinkommt.",
        "Die Krankenkasse zahlt Taxi oder Mietwagen. Ihr zahlt 10 % zu, mindestens 5 € und höchstens 10 € je Fahrt.",
        "Vor der ersten Fahrt: Verordnung von der Ärztin oder dem Arzt holen, bei Pflegegrad 3 auch die Genehmigung der Kasse.",
      ],
      bedingungen: [
        "Pflegegrad 4 oder 5 oder Merkzeichen aG, Bl oder H: Die Fahrten gelten als genehmigt.",
        "Pflegegrad 3 mit dauerhaft eingeschränkter Mobilität: Die Kasse muss vorher genehmigen.",
      ],
      achten: [
        "Ohne Verordnung zahlt die Kasse nicht.",
        "Quittungen für die Zuzahlung sammeln. Sie zählen für die Belastungsgrenze.",
      ],
      quellen: "§ 60 SGB V, Krankentransport-Richtlinie des G-BA",
    }),

  chroniker: () =>
    aus("chroniker", {
      kurz: [
        "Er begrenzt, was ihr im Jahr für Medikamente, Therapien und Fahrten zuzahlt.",
        `Höchstens ${BETRAEGE.belastungsgrenzeChronischProzent} % des Familien-Bruttoeinkommens im Jahr statt ${BETRAEGE.belastungsgrenzeProzent} %. Was darüber liegt, müsst ihr nicht zahlen.`,
        "Wenn die Grenze erreicht ist. Oder ihr zahlt den Betrag vorab und seid das ganze Jahr befreit.",
      ],
      bedingungen: [
        "Seit mindestens einem Jahr wegen derselben Krankheit mindestens einmal im Quartal in Behandlung.",
        "Dazu eines davon: Pflegegrad 3 oder höher, ein GdB von mindestens 60, oder ohne dauernde Behandlung würde es lebensbedrohlich schlechter.",
      ],
      achten: [
        "Die Grenze gilt für den ganzen Haushalt. Quittungen aller Familienmitglieder sammeln.",
        "Die Bescheinigung über die Dauerbehandlung kommt von der Ärztin oder dem Arzt.",
        "Die Befreiung gilt immer nur für ein Jahr. Jedes Jahr neu beantragen.",
      ],
      quellen: "§ 62 SGB V, Chroniker-Richtlinie des G-BA",
    }),

  sb_antrag: () =>
    aus("sb_antrag", {
      kurz: [
        "Der Ausweis bescheinigt eine Schwerbehinderung und öffnet viele Erleichterungen bei Steuer, Bus und Bahn, Parken und Arbeit.",
        "Ab einem GdB von 50 den Ausweis, je nach Merkzeichen weitere Vorteile. Schon ab GdB 20 gibt es Steuervorteile.",
        "Jederzeit beim Versorgungsamt, oft auch online.",
      ],
      bedingungen: [
        "Eine gesundheitliche Beeinträchtigung, die länger als 6 Monate dauert.",
        "Wohnsitz oder Arbeit in Deutschland.",
      ],
      achten: [
        "Alle Erkrankungen nennen, auch solche, an die man sich gewöhnt hat. Was nicht im Antrag steht, wird nicht bewertet.",
        "Merkzeichen gleich mit beantragen, sonst prüft sie niemand.",
        "Gegen den Bescheid habt ihr einen Monat Zeit für einen Widerspruch.",
        "Der Ausweis ist oft befristet. Rechtzeitig verlängern.",
      ],
      quellen: "§ 152 SGB IX, Versorgungsmedizin-Verordnung",
    }),

  sb_neu: () =>
    aus("sb_neu", {
      kurz: [
        "Die Gesundheit hat sich verschlechtert oder neue Krankheiten sind dazugekommen.",
        "Ein höherer GdB oder neue Merkzeichen bringen mehr Vorteile.",
        "Sobald sich etwas dauerhaft verschlechtert hat.",
      ],
      bedingungen: ["Die Verschlechterung dauert voraussichtlich länger als 6 Monate."],
      achten: [
        "Das Amt bewertet alles neu. Hat sich etwas gebessert, kann der GdB auch sinken.",
        "Neue Befunde beilegen und die gewünschten Merkzeichen ausdrücklich nennen.",
      ],
      quellen: "§ 152 SGB IX",
    }),

  behpausch: () => {
    const b = B.find((x) => x.k === "behpausch");
    const betrag = b && b.frei ? b.frei() : 0;
    return aus("behpausch", {
      kurz: [
        "Ein Steuervorteil wegen der Behinderung, ohne einzelne Kosten nachzuweisen.",
        `${eur(betrag)} im Jahr weniger zu versteuern${gdb() ? ` bei GdB ${gdb()}` : ""}. Mit Merkzeichen H, Bl, TBl oder Pflegegrad 4 oder 5 sind es ${eur(BETRAEGE.behindertenPauschbetragErhoeht)}.`,
        "Mit der Steuererklärung, auch für zurückliegende Jahre, die noch offen sind.",
      ],
      wann: "Wann eintragen?",
      bedingungen: ["Ein GdB von mindestens 20, oder Pflegegrad 4 oder 5."],
      achten: [
        "Bei Kindern können die Eltern den Betrag übernehmen, wenn sie für das Kind Kindergeld bekommen. Auf andere Angehörige geht das nicht.",
        "Mit dem Pauschbetrag sind die laufenden Kosten der Behinderung abgegolten. Besondere Kosten, zum Beispiel für eine Operation, könnt ihr zusätzlich angeben.",
      ],
      quellen: "§ 33b EStG",
    });
  },

  fahrtpausch: () =>
    aus("fahrtpausch", {
      kurz: [
        "Eine Pauschale für Fahrten, die wegen der Behinderung nötig sind.",
        `${eur(BETRAEGE.fahrtkostenPauschale)} im Jahr. Bei aG, Bl, TBl, H oder Pflegegrad 4 oder 5 sind es ${eur(BETRAEGE.fahrtkostenPauschaleErhoeht)}.`,
        "Mit der Steuererklärung.",
      ],
      wann: "Wann eintragen?",
      bedingungen: [
        `Für ${eur(BETRAEGE.fahrtkostenPauschale)}: GdB mindestens 80, oder GdB mindestens 70 mit Merkzeichen G.`,
        `Für ${eur(BETRAEGE.fahrtkostenPauschaleErhoeht)}: Merkzeichen aG, Bl, TBl oder H, oder Pflegegrad 4 oder 5.`,
      ],
      achten: [
        "Mit der Pauschale sind alle behinderungsbedingten Fahrten abgegolten. Einzelne Fahrten zusätzlich gehen nicht.",
      ],
      quellen: "§ 33 Abs. 2a EStG",
    }),

  wertmarke: () =>
    aus("wertmarke", {
      kurz: [
        "Freifahrt in Bus, Straßenbahn und Regionalzügen in ganz Deutschland.",
        `Die Wertmarke kostet ${eur(BETRAEGE.wertmarkeJahr)} im Jahr oder ${eur(BETRAEGE.wertmarkeHalbjahr)} im Halbjahr. Mit H, Bl oder bei Bürgergeld oder Grundsicherung ist sie kostenlos.`,
        "Jederzeit beim Versorgungsamt.",
      ],
      bedingungen: ["Merkzeichen G, aG, Gl, H oder Bl im Ausweis."],
      achten: [
        "Mit Merkzeichen G oder Gl gilt: entweder Wertmarke oder 50 % weniger Kfz-Steuer, nicht beides. Mit aG, H oder Bl geht beides.",
        "Fernzüge wie ICE und IC sind nicht dabei.",
      ],
      gut: ["Mit Merkzeichen B fährt eine Begleitperson kostenlos mit, auch im Fernverkehr der Bahn."],
      quellen: "§ 228 SGB IX",
    }),

  kfz: () =>
    aus("kfz", {
      kurz: [
        "Weniger oder gar keine Kfz-Steuer.",
        "Mit G oder Gl: 50 % weniger, wenn ihr keine Wertmarke nutzt. Mit aG, H oder Bl: ganz befreit.",
        "Jederzeit beim Hauptzollamt.",
      ],
      bedingungen: ["Merkzeichen G, Gl, aG, H oder Bl.", "Das Auto ist auf die schwerbehinderte Person zugelassen."],
      achten: [
        "Das Auto darf nur für Fahrten genutzt werden, die mit der Person zu tun haben. Sonst entfällt der Vorteil.",
        "Die 50 % gibt es nicht zusammen mit der Wertmarke.",
      ],
      quellen: "§ 3a Kraftfahrzeugsteuergesetz",
    }),

  park: () =>
    aus("park", {
      kurz: [
        "Parken auf Behindertenparkplätzen.",
        "Den blauen EU-Parkausweis, gültig in ganz Europa.",
        "Bei der Straßenverkehrsbehörde oder dem Bürgeramt.",
      ],
      bedingungen: [
        "Merkzeichen aG, Bl oder TBl.",
        "Mit G und bestimmten Erkrankungen gibt es oft einen orangen Ausweis mit Erleichterungen, der nur in Deutschland gilt.",
      ],
      achten: ["Der Ausweis gehört zur Person, nicht zum Auto. Nur nutzen, wenn sie mitfährt."],
      quellen: "§ 46 StVO und Verwaltungsvorschrift dazu",
    }),

  rundfunk: () =>
    aus("rundfunk", {
      kurz: [
        "Weniger Rundfunkbeitrag.",
        `${eur(BETRAEGE.rundfunkErmaessigt, 2)} statt ${eur(BETRAEGE.rundfunkVoll, 2)} im Monat.`,
        "Beim Beitragsservice, online oder mit Formular.",
      ],
      bedingungen: [
        "Merkzeichen RF im Ausweis.",
        "Taubblinde Menschen und Menschen, die Blindenhilfe bekommen, werden ganz befreit.",
      ],
      achten: ["Ausweis mit Merkzeichen als Kopie beilegen, Vorder- und Rückseite."],
      gut: ["Die Ermäßigung gilt auch rückwirkend, bis zu 3 Jahre, solange das Merkzeichen schon so lange gilt."],
      quellen: "§ 4 Rundfunkbeitragsstaatsvertrag",
    }),

  blind: () =>
    aus("blind", {
      kurz: [
        "Ein Ausgleich für die Mehrkosten durch Blindheit.",
        "Monatliches Geld vom Bundesland, unabhängig vom Einkommen. Die Höhe ist je Land verschieden.",
        "Beim Versorgungsamt oder Landratsamt.",
      ],
      bedingungen: ["Blind oder hochgradig sehbehindert, je nach Landesrecht."],
      achten: ["Pflegegeld wird teilweise angerechnet."],
      gut: [
        "Reicht das Landesblindengeld nicht, kann zusätzlich Blindenhilfe vom Sozialamt kommen. Die hängt vom Einkommen ab.",
      ],
      quellen: "Blindengeldgesetze der Länder, § 72 SGB XII",
    }),

  urlaub: () =>
    aus("urlaub", {
      kurz: [
        "Mehr Erholung für schwerbehinderte Beschäftigte.",
        "Eine Arbeitswoche mehr Urlaub im Jahr, bei 5 Arbeitstagen pro Woche also 5 Tage.",
        "Beim Arbeitgeber, sobald der Bescheid da ist. Im ersten Jahr anteilig.",
      ],
      bedingungen: ["Ein GdB von mindestens 50. Gleichgestellte bekommen keinen Zusatzurlaub."],
      achten: ["Der Arbeitgeber muss von der Schwerbehinderung wissen. Gebt ihm eine Kopie des Ausweises."],
      danach: ["Der Arbeitgeber trägt den Zusatzurlaub ein."],
      gut: ["Dazu gibt es besonderen Kündigungsschutz: Eine Kündigung braucht die Zustimmung des Integrationsamts."],
      quellen: "§§ 168 und 208 SGB IX",
    }),

  gleich: () =>
    aus("gleich", {
      kurz: [
        "Schutz für den Arbeitsplatz bei einem GdB von 30 oder 40.",
        "Kündigungsschutz wie bei Schwerbehinderung und Hilfen für den Arbeitsplatz, aber keinen Zusatzurlaub.",
        "Sobald der Arbeitsplatz wegen der Behinderung in Gefahr ist.",
      ],
      bedingungen: [
        "Ein GdB von 30 oder 40.",
        "Ohne Gleichstellung ist der Arbeitsplatz gefährdet, oder es ist schwer, einen zu finden.",
      ],
      achten: ["Gut begründen, warum der Arbeitsplatz gefährdet ist, zum Beispiel durch Fehlzeiten."],
      gut: ["Die Gleichstellung gilt ab dem Tag des Antrags."],
      quellen: "§ 2 Abs. 3 und § 151 SGB IX",
    }),

  rente: () =>
    aus("rente", {
      kurz: [
        "Früher in Rente gehen mit Schwerbehinderung.",
        "Ab Jahrgang 1964: ohne Abschläge mit 65 statt 67, mit Abschlägen schon ab 62.",
        "Den Rentenantrag etwa 3 Monate vor dem Wunschtermin stellen, vorher beraten lassen.",
      ],
      bedingungen: ["Ein GdB von mindestens 50 bei Rentenbeginn.", "Mindestens 35 Jahre in der Rentenversicherung."],
      achten: ["Der GdB muss bei Rentenbeginn anerkannt sein. Später schadet ein Wegfall dann nicht mehr."],
      danach: ["Die Rentenversicherung schickt einen Rentenbescheid."],
      gut: ["Die Beratung bei der Deutschen Rentenversicherung ist kostenlos."],
      quellen: "§§ 37 und 236a SGB VI",
    }),

  kind_krankengeld: () =>
    aus("kind_krankengeld", {
      kurz: [
        "Wenn du zu Hause bleibst, weil dein Kind krank ist und Betreuung braucht.",
        `Kinderkrankengeld von deiner Krankenkasse, meist 90 % des Nettolohns, für ${BETRAEGE.kinderkrankTage} Arbeitstage im Jahr je Elternteil. Alleinerziehende bekommen ${BETRAEGE.kinderkrankTageAllein}.`,
        "Ab dem ersten Tag: Bescheinigung von der Kinderarztpraxis holen.",
      ],
      bedingungen: [
        "Das Kind ist unter 12, oder es hat eine Behinderung und ist auf Hilfe angewiesen. Dann gibt es keine Altersgrenze.",
        "Du und dein Kind seid gesetzlich versichert.",
        "Niemand sonst im Haushalt kann das Kind betreuen.",
      ],
      achten: [
        "Der Arbeitgeber zahlt für diese Tage keinen Lohn. Die Freistellung ist unbezahlt, das Geld kommt von der Kasse.",
        "Bei mehreren Kindern gibt es eine Höchstzahl an Tagen im Jahr.",
      ],
      danach: ["Die Krankenkasse zahlt das Kinderkrankengeld aus, sobald die Bescheinigung da ist."],
      quellen: "§ 45 SGB V",
    }),

  kind_zuzahlung: () =>
    aus("kind_zuzahlung", {
      kurz: [
        "Kinder und Jugendliche zahlen in der gesetzlichen Krankenkasse nichts zu.",
        "Keine Zuzahlung für Medikamente, Hilfsmittel, Therapien oder Krankenhaus.",
        "Gar nicht. Das gilt von selbst bis zum 18. Geburtstag.",
      ],
      bedingungen: ["Unter 18 und gesetzlich versichert."],
      achten: ["Für Fahrten zur Behandlung zahlen auch Kinder zu. Diese Quittungen sammeln."],
      danach: [],
      quellen: "SGB V, unter anderem § 31 Abs. 3 und § 33 Abs. 8",
    }),

  kind_fruehfoerderung: () =>
    aus("kind_fruehfoerderung", {
      kurz: [
        "Therapie und Förderung für kleine Kinder mit Behinderung oder Entwicklungsverzögerung, dazu Beratung für die Eltern.",
        "Alles aus einer Hand, für die Familie kostenlos.",
        "So früh wie möglich, über die Kinderarztpraxis oder direkt bei der Frühförderstelle.",
      ],
      wann: "Wann anfangen?",
      bedingungen: ["Kind von der Geburt bis zur Einschulung mit Behinderung oder drohender Behinderung."],
      achten: ["Bei Sozialpädiatrischen Zentren gibt es oft Wartezeiten. Früh anmelden."],
      danach: [],
      gut: ["Die Berichte von SPZ und Frühförderung helfen später beim Pflegegrad und beim Schwerbehindertenausweis."],
      quellen: "§ 46 SGB IX, § 119 SGB V",
    }),

  kind_schule: () =>
    aus("kind_schule", {
      kurz: [
        "Eine persönliche Begleitung in Kita oder Schule, wenn dein Kind dort Hilfe braucht, die das Personal nicht leisten kann.",
        "Integrationshilfe oder Schulbegleitung, für die Familie in der Regel kostenlos.",
        "Früh, am besten ein halbes Jahr vor dem Start in Kita oder Schule.",
      ],
      bedingungen: [
        "Dein Kind braucht wegen einer Behinderung oder drohenden Behinderung Unterstützung, um Kita oder Schule zu besuchen.",
      ],
      achten: [
        "Die Bearbeitung dauert oft Monate.",
        "Zuständig ist die Eingliederungshilfe, meist beim Sozialamt. Bei seelischer Behinderung ist es das Jugendamt. Geht der Antrag an die falsche Stelle, wird er weitergeleitet.",
      ],
      danach: ["Das Amt prüft den Bedarf, oft mit einem Gespräch, und schickt einen Bescheid."],
      quellen: "§ 112 SGB IX, § 35a SGB VIII",
    }),

  kind_merkzeichen: () =>
    aus("kind_merkzeichen", {
      kurz: [
        "Das Merkzeichen H (hilflos) im Schwerbehindertenausweis bringt Kindern und Eltern viele Vorteile.",
        `Unter anderem ${eur(BETRAEGE.behindertenPauschbetragErhoeht)} Steuer-Pauschbetrag im Jahr und die kostenlose Wertmarke für Bus und Bahn.`,
        "Beim Versorgungsamt, zusammen mit dem Schwerbehindertenausweis.",
      ],
      bedingungen: [
        "Das Kind braucht dauernd und in erheblichem Umfang Hilfe im Alltag.",
        "Bei Kindern wird mit gesunden Gleichaltrigen verglichen.",
      ],
      achten: [
        "Das Merkzeichen H ausdrücklich beantragen, sonst wird es nicht geprüft.",
        "Bei Kindern ist es oft befristet. Vor Ablauf die Verlängerung beantragen.",
      ],
      quellen: "§ 152 SGB IX, Versorgungsmedizin-Verordnung",
    }),

  kind_kindergeld: () =>
    aus("kind_kindergeld", {
      kurz: [
        "Kindergeld auch nach dem 18. und 25. Geburtstag, wenn sich dein Kind wegen einer Behinderung nicht selbst unterhalten kann.",
        "Kindergeld ohne Altersgrenze. Damit bleiben auch Freibeträge und die Übertragung des Behinderten-Pauschbetrags.",
        "Vor dem 18. Geburtstag bzw. vor dem Ende der Ausbildung bei der Familienkasse melden.",
      ],
      bedingungen: [
        "Die Behinderung ist vor dem 25. Geburtstag eingetreten.",
        "Dein Kind kann sich wegen der Behinderung nicht selbst unterhalten.",
      ],
      achten: ["Die Familienkasse prüft das Einkommen deines Kindes. Rechtzeitig melden, damit keine Lücke entsteht."],
      danach: ["Die Familienkasse schickt ein eigenes Formular und dann einen Bescheid."],
      quellen: "§ 32 Abs. 4 EStG",
    }),
};
