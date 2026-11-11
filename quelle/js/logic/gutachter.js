// Vorbereitung auf den Termin mit dem Medizinischen Dienst: Checkliste für den Tag und, aus den Antworten des
// Pflegegrad-Rechners, die Punkte, bei denen Hilfe nötig ist. Der Termin entscheidet über den Pflegegrad;
// wer vorbereitet ist, vergisst unter Aufregung weniger. Das PDF baut services/dokumente.js.
import { istKind } from "./lage.js";
import { MOD, RQ } from "./rechner.js";
import { Z } from "../state/zustand.js";

/** Unterlagen, die beim Termin griffbereit liegen sollten */
const UNTERLAGEN = [
  "Aktuelle Arztberichte und Krankenhausbriefe",
  "Medikamentenplan",
  "Pflegetagebuch der letzten 1–2 Wochen (wenn vorhanden)",
  "Liste der Hilfsmittel (Rollator, Pflegebett, Inkontinenzmaterial …)",
  "Name und Telefon des Pflegedienstes, falls einer kommt",
  "Schwerbehindertenausweis, falls vorhanden",
];

/** Zusätzliche Unterlagen bei Kindern */
const UNTERLAGEN_KIND = ["Gelbes Vorsorgeheft (U-Hefte)", "Berichte von Sozialpädiatrischem Zentrum und Frühförderung"];

/** Tipps für den Termin selbst */
const TIPPS = [
  "Eine vertraute Person dabei haben, die den Alltag kennt.",
  "Einen normalen Tag beschreiben, nicht einen besonders guten. Nichts beschönigen, aber auch nicht übertreiben.",
  "Auch Hilfe nennen, die selbstverständlich geworden ist: Erinnern, Anleiten, Aufpassen, nachts aufstehen.",
  "Unangenehmes darf in einem Gespräch unter vier Augen gesagt werden. Danach fragen.",
  "Den Gutachter bitten, Wichtiges vorzulesen, was er notiert hat.",
  "Nach dem Termin kurz aufschreiben, was besprochen wurde. Das Gutachten kann man bei der Kasse anfordern.",
];

/** Zusätzliche Tipps bei Kindern */
const TIPPS_KIND = [
  "Der Gutachter vergleicht mit gesunden Gleichaltrigen: Immer sagen, was dein Kind anders oder länger braucht als andere Kinder in dem Alter.",
  "Auch Übungen, Messungen und Therapien zu Hause zählen, nicht nur Termine beim Arzt.",
];

/**
 * Inhalt des Vorbereitungsblatts.
 * @param {(string|null|undefined)[]} [antworten] Antworten des Pflegegrad-Rechners (Index wie RQ), sonst die gespeicherten
 * @returns {{unterlagen: string[], tipps: string[], bereiche: {titel: string, punkte: [string, string][]}[]}}
 *   bereiche: je Modul die Fragen, bei denen nicht „selbstständig“ bzw. „nie“ geantwortet wurde
 */
export function gutachterBlatt(antworten = Z.S.rechner || []) {
  const kind = istKind();
  /** @type {Record<number, [string, string][]>} */
  const proModul = {};
  RQ.forEach((q, i) => {
    const a = antworten[i];
    if (a == null || a === "0") return;
    const o = q.o.find(([v]) => v === a);
    if (!o) return;
    (proModul[q.m] = proModul[q.m] || []).push([q.q, o[2] ? `${o[1]} (${o[2]})` : o[1]]);
  });
  return {
    unterlagen: kind ? [...UNTERLAGEN, ...UNTERLAGEN_KIND] : UNTERLAGEN,
    tipps: kind ? [...TIPPS_KIND, ...TIPPS] : TIPPS,
    bereiche: Object.keys(proModul)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => ({ titel: MOD[m].n, punkte: proModul[m] })),
  };
}
