import { Z } from "./zustand.js";
import { ic } from "./03-hilfsmittel.js";
import { render } from "./11-darstellung.js";
import { lsGet, lsSet } from "./19-speicher.js";
/* ---------- Als App installieren, ohne Internet öffnen ---------- */
Z.installPrompt = null;

/** Läuft die App schon als installierte App (Startbildschirm)? */
function istInstalliert() {
  try { return matchMedia("(display-mode: standalone)").matches || /** @type {any} */ (navigator).standalone === true } catch (e) { return false }
}
function istIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) }

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
export async function installieren() {
  const p = Z.installPrompt; if (!p) return;
  Z.installPrompt = null;
  try { await p.prompt(); const r = await p.userChoice; if (r && r.outcome === "dismissed") lsSet("da-install-weg", true) } catch (e) { }
  render();
}
export function installWeg() { lsSet("da-install-weg", true); render() }

function offlineHinweis(an) {
  let b = document.getElementById("offlinebanner");
  if (an && !b) {
    b = document.createElement("div"); b.id = "offlinebanner"; b.className = "offlinebanner"; b.setAttribute("role", "status");
    b.textContent = "Keine Internetverbindung. Du kannst alles ansehen; neue Eingaben werden erst wieder gespeichert, wenn du online bist.";
    document.body.prepend(b);
  }
  if (!an && b) b.remove();
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function start24() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  window.addEventListener("offline", () => offlineHinweis(true));
  window.addEventListener("online", () => offlineHinweis(false));
  if (!navigator.onLine) offlineHinweis(true);
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); Z.installPrompt = e; render() });
  window.addEventListener("appinstalled", () => { Z.installPrompt = null; lsSet("da-install-weg", true); render() });
}
