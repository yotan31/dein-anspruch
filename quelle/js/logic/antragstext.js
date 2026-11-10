// Antragstexte: Betreff und Brieftext je Leistung, nötige Unterlagen, E-Mail- und Gmail-Links.
// Der Text kann von der Familie überschrieben werden (Z.S.texte); dann gilt ihre Fassung.
import { beratungStatus } from "./fristen.js";
import { istKind, pg } from "./lage.js";
import { FA, KK, PK, kassePK, txt } from "./leistungen.js";
import { Z } from "../state/zustand.js";
import { deD, datumBrief } from "../utils/datum.js";

/**
 * Unterlagen, die dem Antrag beiliegen sollten; bei Angehörigen (außer Eltern) zusätzlich die Vollmacht.
 * @param b Leistung
 */
export function docsFor(b) {
  const d = [...(txt(b.docs) || [])].filter(Boolean);
  // Eltern vertreten ihr Kind gesetzlich, alle anderen Angehörigen brauchen eine Vollmacht
  if (
    Z.S.rolle === "angehoerig" &&
    !istKind() &&
    b.to !== FA &&
    b.to !== "arbeitgeber" &&
    !d.some((x) => /Vollmacht/.test(x))
  )
    d.push("Vollmacht oder Betreuungsurkunde");
  return d;
}

/** Schlusssatz jedes Antrags: Eingang bestätigen lassen und die Frist wahren */
const SCHLUSS_ANTRAG =
  "Bitte bestätigen Sie mir den Eingang dieses Antrags. Falls Sie ein bestimmtes Formular oder weitere Unterlagen benötigen, senden Sie mir diese bitte zu. Dieses Schreiben gilt als fristwahrende Antragstellung (§ 16 SGB I).";

/**
 * Betreff mit Versichertennummer (Kasse) bzw. Name.
 * @param b Leistung
 * @param titel Text vor dem Strich, sonst der Name der Leistung
 */
export function betreff(b, titel = b.t) {
  const p = Z.S.person,
    who = p.name || "[Name]";
  return `${titel} – ${(b.to === PK || b.to === KK) && p.vnr ? "Versichertennr. " + p.vnr : who}`;
}

/**
 * Ganzer Brief um einen Kern herum: Anrede, Einleitung je nach Rolle, Schlusssatz, Gruß.
 * Die Einleitung unterscheidet drei Fälle: selbst betroffen, Angehörige mit Vollmacht, Eltern für ihr Kind
 * (Eltern vertreten ihr Kind gesetzlich und brauchen keine Vollmacht).
 * @param b Leistung (bestimmt, ob die Versichertennummer genannt wird)
 * @param kern Satz in der Form „beantrage ich hiermit …“
 * @param schluss Schlusssatz vor dem Gruß
 */
export function briefText(b, kern, schluss) {
  const p = Z.S.person,
    a = Z.S.rolle === "angehoerig";
  const who = p.name || "[Name]";
  const ref = [
    p.vnr && (b.to === PK || b.to === KK) ? `Versichertennummer: ${p.vnr}` : "",
    p.geb ? `geboren am ${datumBrief(p.geb)}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const klammer = ref ? " (" + ref + ")" : "";
  const intro = istKind()
    ? `ich wende mich als ${p.beziehung || "sorgeberechtigter Elternteil"} für mein Kind ${who}${klammer} an Sie.\n\nFür ${who}`
    : a
      ? `ich wende mich als ${p.beziehung || "[Beziehung]"} im Namen von ${who}${klammer} an Sie. Eine Vollmacht liegt bei.\n\nFür ${who}`
      : `${ref ? "(" + ref + ")\n\n" : ""}hiermit`;
  if (!a) kern = kern.replace(/^(\S+) ich hiermit /, "$1 ich ");
  const gruss = `Mit freundlichen Grüßen\n\n${a ? p.absender || "[Dein Name]" : who}${p.tel ? "\nTel. " + p.tel : ""}${p.mail ? "\n" + p.mail : ""}`;
  return `Sehr geehrte Damen und Herren,\n\n${intro} ${kern}${schluss ? "\n\n" + schluss : ""}\n\n${gruss}`;
}

function letter(b) {
  const pgline = pg() >= 1 && (b.to === PK || b.to === KK) ? `\n\nEs ist Pflegegrad ${pg()} festgestellt.` : "";
  return { subject: betreff(b), body: briefText(b, txt(b.ask) + pgline, SCHLUSS_ANTRAG) };
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
