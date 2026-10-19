"use strict";

/* ---------- Beträge und Grenzen (jedes Jahr im Dezember prüfen!) ----------
   Alle Geldbeträge und Prozentsätze, die sich durch Gesetz oder Verordnung ändern, stehen nur hier.
   Bei Änderungen: Werte anpassen, "stand" setzen, dann `node --test tests/` laufen lassen
   (tests/rechnungen.test.mjs enthält die erwarteten Werte und muss mit angepasst werden). */
const BETRAEGE = Object.freeze({
  jahr: 2026,
  stand: "Leistungsübersicht des Bundesgesundheitsministeriums, Stand 01.01.2026",

  // Pflegeversicherung (SGB XI), Index = Pflegegrad 0–5, Euro pro Monat
  pflegegeld:   [0, 0, 347, 599, 800, 990],         // § 37
  sachleistung: [0, 0, 796, 1497, 1859, 2299],      // § 36
  tagespflege:  [0, 0, 721, 1357, 1685, 2085],      // § 41
  stationaer:   [0, 131, 805, 1319, 1855, 2096],    // § 43
  rentenbeitrag:[0, 0, 198.62, 316.32, 514.94, 735.63], // Rentenbeiträge für die Pflegeperson (Höchstwerte)
  entlastung: 131,          // § 45b, pro Monat
  jahresbetrag: 3539,       // § 42a, gemeinsamer Jahresbetrag Verhinderungs- und Kurzzeitpflege
  verbrauch: 42,            // § 40 Abs. 2, Pflegehilfsmittel zum Verbrauch pro Monat
  wohnumfeld: 4180,         // § 40 Abs. 4, je Maßnahme
  wg: 224,                  // § 38a, Wohngruppenzuschlag pro Monat
  dipa: 40, dipaUnterstuetzung: 30, // § 40a/b, digitale Pflegeanwendungen pro Monat
  eingliederungMax: 278,    // § 43a, Höchstbetrag pro Monat
  heimZuschlag: [15, 30, 50, 75], // § 43c, Prozent des Eigenanteils nach 0/12/24/36 Monaten

  kmPauschale: 0.20,        // Fahrtkosten der Ersatzpflegeperson je km (Verhinderungspflege)

  // Steuer (EStG)
  pflegePauschbetrag: [0, 0, 600, 1100, 1800, 1800],  // § 33b Abs. 6, pro Jahr nach Pflegegrad
  behindertenPauschbetrag: {20:384, 30:620, 40:860, 50:1140, 60:1440, 70:1780, 80:2120, 90:2460, 100:2840}, // § 33b Abs. 3
  behindertenPauschbetragErhoeht: 7400, // § 33b Abs. 3 Satz 3: Merkzeichen H, Bl, TBl oder Pflegegrad 4/5

  // Sonstiges
  rundfunkVoll: 18.36, rundfunkErmaessigt: 6.12, // Rundfunkbeitrag pro Monat
  elternunterhaltGrenze: 100000,                  // Jahresbrutto, ab dem Kinder für Heimkosten zahlen
  belastungsgrenzeProzent: 2, belastungsgrenzeChronischProzent: 1, // § 62 SGB V
});
