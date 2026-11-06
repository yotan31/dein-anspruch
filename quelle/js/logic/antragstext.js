// Antragstexte: Betreff und Brieftext je Leistung, nötige Unterlagen, E-Mail- und Gmail-Links.
// Der Text kann von der Familie überschrieben werden (Z.S.texte); dann gilt ihre Fassung.
import { beratungStatus } from "./fristen.js";
import { pg } from "./lage.js";
import { FA, KK, PK, kassePK, txt } from "./leistungen.js";
import { Z } from "../state/zustand.js";
import { deD, datumBrief } from "../utils/datum.js";

/**
 * Unterlagen, die dem Antrag beiliegen sollten; bei Angehörigen zusätzlich die Vollmacht.
 * @param b Leistung
 */
export function docsFor(b) {
  const d = [...(txt(b.docs) || [])].filter(Boolean);
  if (Z.S.rolle === "angehoerig" && b.to !== FA && b.to !== "arbeitgeber" && !d.some((x) => /Vollmacht/.test(x)))
    d.push("Vollmacht oder Betreuungsurkunde");
  return d;
}

function letter(b) {
  const p = Z.S.person,
    a = Z.S.rolle === "angehoerig";
  const who = p.name || "[Name]";
  const ref = [
    p.vnr && (b.to === PK || b.to === KK) ? `Versichertennummer: ${p.vnr}` : "",
    p.geb ? `geboren am ${datumBrief(p.geb)}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const subject = `${b.t}${b.to === PK || b.to === KK ? " – " + (p.vnr ? "Versichertennr. " + p.vnr : who) : " – " + who}`;
  const intro = a
    ? `ich wende mich als ${p.beziehung || "[Beziehung]"} im Namen von ${who}${ref ? " (" + ref + ")" : ""} an Sie. Eine Vollmacht liegt bei.\n\nFür ${who}`
    : `${ref ? "(" + ref + ")\n\n" : ""}hiermit`;
  const pgline = pg() >= 1 && (b.to === PK || b.to === KK) ? `\n\nEs ist Pflegegrad ${pg()} festgestellt.` : "";
  let ask = txt(b.ask);
  if (!a) ask = ask.replace(/^(\S+) ich hiermit /, "$1 ich ");
  const body = `Sehr geehrte Damen und Herren,\n\n${intro} ${ask}${pgline}\n\nBitte bestätigen Sie mir den Eingang dieses Antrags. Falls Sie ein bestimmtes Formular oder weitere Unterlagen benötigen, senden Sie mir diese bitte zu. Dieses Schreiben gilt als fristwahrende Antragstellung (§ 16 SGB I).\n\nMit freundlichen Grüßen\n\n${a ? p.absender || "[Dein Name]" : who}${p.tel ? "\nTel. " + p.tel : ""}${p.mail ? "\n" + p.mail : ""}`;
  return { subject, body };
}

/**
 * Betreff und Text des Antrags: die eigene Fassung der Familie, sonst der Vorschlag.
 * @param b Leistung
 */
export function curLetter(b) {
  const L = letter(b);
  return { subject: Z.S.texte[b.k + "_sub"] ?? L.subject, body: Z.S.texte[b.k] ?? L.body };
}

/** Gmail-Schreibfenster mit Empfänger, Betreff und Antragstext. Anhänge kann ein Link nicht mitgeben. */
export function gmailLink(b, addr) {
  const L = curLetter(b);
  return `https://mail.google.com/mail/?view=cm&fs=1${addr ? `&to=${encodeURIComponent(addr)}` : ""}&su=${encodeURIComponent(L.subject)}&body=${encodeURIComponent(L.body)}`;
}

/**
 * mailto-Link mit Betreff und Text für das eigene E-Mail-Programm.
 * @param b Leistung
 * @param addr Empfänger
 */
export function mailto(b, addr) {
  const L = curLetter(b);
  return `mailto:${addr}?subject=${encodeURIComponent(L.subject)}&body=${encodeURIComponent(L.body)}`;
}

/** Text zur Terminvereinbarung für den nächsten Beratungsbesuch beim Pflegedienst. */
export function pdText() {
  const st = beratungStatus();
  const H = st.done ? st.next : st.H;
  const p = Z.S.person;
  return `Guten Tag, ich möchte einen Beratungsbesuch nach § 37 Abs. 3 SGB XI für ${p.name || "[Name]"}${pg() ? ` (Pflegegrad ${pg()})` : ""} vereinbaren. Der Besuch muss im ${H.label} stattfinden, also bis spätestens ${deD(H.end)}. Bitte schicken Sie den Nachweis anschließend direkt an die ${kassePK()} und mir eine Kopie. Vielen Dank!`;
}
