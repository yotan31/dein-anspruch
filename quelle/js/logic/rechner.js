import { pgAusPunkten } from "./bescheid.js";

/* ---------- Pflegegrad-Rechner (Selbsteinschätzung nach dem Begutachtungsinstrument) ---------- */
const SELB = [
  ["0", "Selbstständig", "schafft es allein"],
  ["1", "Überwiegend selbstständig", "braucht ab und zu etwas Hilfe"],
  ["2", "Überwiegend unselbstständig", "schafft nur einen kleinen Teil allein"],
  ["3", "Unselbstständig", "schafft es nicht allein"],
];

const FAEH = [
  ["0", "Ja, ohne Probleme", ""],
  ["1", "Meistens", ""],
  ["2", "Nur selten", ""],
  ["3", "Nein, gar nicht", ""],
];

const HAEUF = [
  ["0", "Nie", ""],
  ["1", "Selten", "1- bis 3-mal im Monat"],
  ["3", "Oft", "mehrmals pro Woche"],
  ["5", "Täglich", ""],
];

export const RQ = [
  { m: 1, q: "Im Bett die Lage wechseln (umdrehen, aufsetzen)", o: SELB },
  { m: 1, q: "Sicher sitzen, ohne zur Seite zu kippen", o: SELB },
  { m: 1, q: "Aufstehen vom Stuhl oder Bett und sich umsetzen", o: SELB },
  { m: 1, q: "In der Wohnung von Raum zu Raum gehen", o: SELB },
  { m: 1, q: "Treppen steigen", o: SELB },
  { m: 2, q: "Erkennt vertraute Personen aus dem Umfeld", o: FAEH },
  { m: 2, q: "Weiß, welcher Tag und welche Tageszeit ist", o: FAEH },
  { m: 2, q: "Trifft Entscheidungen im Alltag (z. B. was anziehen)", o: FAEH },
  { m: 2, q: "Kann einem Gespräch folgen und es verstehen", o: FAEH },
  { m: 3, q: "Ist nachts unruhig, läuft umher oder ruft", o: HAEUF },
  { m: 3, q: "Wehrt sich gegen Pflege oder Hilfe", o: HAEUF },
  { m: 3, q: "Hat starke Ängste oder ist sehr niedergeschlagen", o: HAEUF },
  { m: 4, q: "Oberkörper waschen", o: SELB, w: 1 },
  { m: 4, q: "Duschen oder baden (inkl. Haare waschen)", o: SELB, w: 1 },
  { m: 4, q: "Oberkörper an- und auskleiden", o: SELB, w: 1 },
  { m: 4, q: "Unterkörper an- und auskleiden (Hose, Socken, Schuhe)", o: SELB, w: 1 },
  { m: 4, q: "Essen (mundgerecht zubereitetes Essen zum Mund führen)", o: SELB, w: 3 },
  { m: 4, q: "Trinken (genug und selbstständig)", o: SELB, w: 2 },
  { m: 4, q: "Toilette benutzen", o: SELB, w: 2 },
  {
    m: 5,
    q: "Wie oft wird Hilfe bei Medikamenten, Spritzen, Verbänden oder Messungen gebraucht?",
    o: [
      ["0", "Nie oder selten", ""],
      ["1", "Wöchentlich", ""],
      ["3", "Täglich", ""],
      ["5", "Mehrmals täglich", ""],
    ],
  },
  {
    m: 5,
    q: "Wie oft muss jemand zu Arzt- oder Therapieterminen begleiten?",
    o: [
      ["0", "Nie", ""],
      ["1", "Etwa einmal im Monat", ""],
      ["2", "Jede Woche", ""],
    ],
  },
  { m: 6, q: "Den Tag einteilen und sich an Abläufe halten", o: SELB },
  { m: 6, q: "Sich sinnvoll beschäftigen", o: SELB },
  { m: 6, q: "Kontakt zu Familie, Nachbarn, Freunden halten", o: SELB },
];

export const MOD = {
  1: {
    n: "Mobilität",
    max: 15,
    t: [
      [2, 2.5],
      [4, 5],
      [6, 7.5],
      [10, 10],
    ],
  },
  2: {
    n: "Verstehen und Erinnern",
    max: 33,
    t: [
      [2, 3.75],
      [6, 7.5],
      [11, 11.25],
      [17, 15],
    ],
  },
  3: {
    n: "Verhalten und Psyche",
    t: [
      [1, 3.75],
      [3, 7.5],
      [5, 11.25],
      [7, 15],
    ],
  },
  4: {
    n: "Selbstversorgung",
    max: 54,
    t: [
      [3, 10],
      [8, 20],
      [19, 30],
      [37, 40],
    ],
  },
  5: {
    n: "Krankheitsbedingte Hilfe",
    t: [
      [1, 5],
      [2, 10],
      [4, 15],
      [6, 20],
    ],
  },
  6: {
    n: "Alltag und Kontakte",
    max: 18,
    t: [
      [1, 3.75],
      [4, 7.5],
      [7, 11.25],
      [12, 15],
    ],
  },
};
// {i, a:[]}
export function rechnerErgebnis(a) {
  const roh = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    mx = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  RQ.forEach((q, i) => {
    const v = Number(a[i] || 0) * (q.w || 1);
    roh[q.m] += v;
    mx[q.m] += Number(q.o[q.o.length - 1][0]) * (q.w || 1);
  });
  const gew = {};
  for (const m of [1, 2, 3, 4, 5, 6]) {
    let r = roh[m];
    if (MOD[m].max && mx[m]) r = (r / mx[m]) * MOD[m].max; // auf das echte Modul hochrechnen
    let g = 0;
    MOD[m].t.forEach(([ab, p]) => {
      if (r >= ab - 1e-9) g = p;
    });
    gew[m] = g;
  }
  const m23 = Math.max(gew[2], gew[3]);
  const summe = gew[1] + m23 + gew[4] + gew[5] + gew[6];
  return { summe, grad: pgAusPunkten(summe), gew, m23 };
}
