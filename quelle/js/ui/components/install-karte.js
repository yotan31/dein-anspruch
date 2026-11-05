// Hinweis zur Installation als App und zur Nutzung ohne Internet.
import { istIOS, istInstalliert } from "../../services/installieren.js";
import { lsGet } from "../../services/lokal.js";
import { Z } from "../../state/zustand.js";
import { ic } from "../symbole.js";

/** Kleine Karte mit Hinweis zum Installieren (nur wenn sinnvoll und nicht weggeklickt). */
export function installKarte() {
  if (istInstalliert() || lsGet("da-install-weg")) return "";
  if (!Z.installPrompt && !istIOS()) return "";
  return `<section class="panel mini install">
    <div class="mini-head">${ic("down")}<div><h3>Als App auf den Startbildschirm</h3>
      <p class="small muted">${Z.installPrompt ? "Dann öffnest du Dein Anspruch mit einem Tipp, auch ohne Internet." : "Unten in Safari auf das Teilen-Symbol (Quadrat mit Pfeil) tippen, dann „Zum Home-Bildschirm“ wählen."}</p></div></div>
    <div class="btnrow">${Z.installPrompt ? `<button class="btn small" type="button" data-act="inst-ja">Jetzt installieren</button>` : ""}<button class="btn small ghost" type="button" data-act="inst-weg">${Z.installPrompt ? "Später" : "Verstanden"}</button></div>
  </section>`;
}

/**
 * Zeigt oder entfernt den Hinweis „Ohne Internet“.
 * @param an Hinweis zeigen
 */
export function offlineHinweis(an) {
  let b = document.getElementById("offlinebanner");
  if (an && !b) {
    b = document.createElement("div");
    b.id = "offlinebanner";
    b.className = "offlinebanner";
    b.setAttribute("role", "status");
    b.textContent =
      "Keine Internetverbindung. Du kannst alles ansehen; neue Eingaben werden erst wieder gespeichert, wenn du online bist.";
    document.body.prepend(b);
  }
  if (!an && b) b.remove();
}
