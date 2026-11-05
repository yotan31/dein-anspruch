// Häufige Fragen und wo es persönliche Beratung gibt (Startseite und Hilfe).
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/* ---------- Hilfe: häufige Fragen und wo es persönliche Beratung gibt ---------- */
const FRAGEN = [
  [
    "Was kostet „Dein Anspruch“?",
    "Nichts. Es gibt kein Abo und keine Werbung. Für die Links zu Pflegediensten oder Beratungsstellen bekommen wir kein Geld.",
  ],
  [
    "Für wen ist die App?",
    "Für Menschen mit Pflegegrad oder Schwerbehinderung und für Angehörige, die sich kümmern. Gesetzlich und privat Versicherte können sie nutzen. Wer privat versichert ist, wählt bei der Krankenkasse „Andere“.",
  ],
  [
    "Schickt ihr den Antrag für mich ab?",
    "Nein, und das ist Absicht. Du bekommst einen fertigen Brief als Text oder PDF und schickst ihn selbst ab: per Post, Fax, E-Mail oder über das Online-Postfach deiner Kasse. Du musst uns keine Vollmacht geben, und nichts wird ohne dich verschickt.",
  ],
  [
    "Reicht so ein Brief als Antrag?",
    "Ja. Die Kasse muss einen formlosen schriftlichen Antrag annehmen. Leistungen der Pflegeversicherung gibt es ab dem Monat, in dem der Antrag eingeht. Deshalb lohnt es sich, ihn früh zu schicken. Oft schickt die Kasse danach noch ein eigenes Formular zum Ausfüllen.",
  ],
  [
    "Was passiert nach dem Antrag auf einen Pflegegrad?",
    "Der Medizinische Dienst (bei privat Versicherten Medicproof) meldet sich für eine Begutachtung, meist als Hausbesuch. Den Bescheid gibt es in der Regel innerhalb von 25 Arbeitstagen nach dem Antrag. Bist du nicht einverstanden, hast du einen Monat Zeit für einen Widerspruch. Fotografiere den Bescheid in der App: Sie zeigt Hinweise für einen möglichen Widerspruch und behält die Frist im Blick. Ob ein Widerspruch im Einzelfall Erfolg hat, klärt eine Beratung.",
  ],
  [
    "Sind meine Daten sicher?",
    "Mit Konto werden deine Angaben verschlüsselt übertragen und in einer Datenbank in Frankfurt gespeichert. Sehen können sie nur du und Personen, die du einlädst. Ohne Konto bleiben sie nur in diesem Browser. Unter „Deine Daten“ kannst du jederzeit eine Sicherung herunterladen oder alles löschen.",
  ],
  [
    "Ersetzt die App eine Beratung?",
    "Nein. Sie hilft dir, nichts zu vergessen, ersetzt aber keine Rechtsberatung. Kostenlose, unabhängige Beratung gibt es bei den Pflegestützpunkten, der Pflegeberatung deiner Pflegekasse und der EUTB-Teilhabeberatung.",
  ],
];

/** Häufige Fragen zum Aufklappen. */
export function faqHTML() {
  return `<div class="faq">${FRAGEN.map(([f, a]) => `<details><summary>${ic("plus")}<span>${esc(f)}</span></summary><p>${esc(a)}</p></details>`).join("")}</div>`;
}
