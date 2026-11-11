// Baustein „Nächster Schritt“: Symbol, Überschrift, ein erklärender Satz, darunter die Knöpfe.
// Steht überall, wo nach einem Ergebnis etwas zu tun ist: nachfragen, widersprechen, auf den Gutachter vorbereiten.
import { ic } from "../symbole.js";

/**
 * @param icon Name des Symbols (siehe ui/symbole.js)
 * @param titel Überschrift, eine Zeile
 * @param text erklärender Satz (HTML erlaubt, vom Aufrufer schon sicher gemacht)
 * @param inhalt Felder und Knöpfe (HTML)
 * @param art "" oder "warn" (Ablehnung: Symbol in Rot)
 */
export function folgeBox(icon, titel, text, inhalt, art = "") {
  return `<div class="folge${art ? " " + art : ""}">
    <div class="folge-kopf"><span class="folge-ico">${ic(icon)}</span><div><strong>${titel}</strong><p>${text}</p></div></div>
    ${inhalt}
  </div>`;
}
