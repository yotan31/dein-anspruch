// Installation als App auf dem Startbildschirm (Android über den Browser-Dialog, iOS mit Anleitung).
import { lsSet } from "./lokal.js";
import { Z } from "../state/zustand.js";
import { offlineHinweis } from "../ui/components/install-karte.js";
import { render } from "../ui/render.js";

/** Läuft die App schon als installierte App (Startbildschirm)? */
export function istInstalliert() {
  try {
    return matchMedia("(display-mode: standalone)").matches || /** @type {any} */ (navigator).standalone === true;
  } catch (e) {
    return false;
  }
}

/** iPhone oder iPad? Dort gibt es keinen Installations-Dialog, nur die Anleitung. */
export function istIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** Öffnet den Installations-Dialog des Browsers (Android, Chrome, Edge). */
export async function installieren() {
  const p = Z.installPrompt;
  if (!p) return;
  Z.installPrompt = null;
  try {
    await p.prompt();
    const r = await p.userChoice;
    if (r && r.outcome === "dismissed") lsSet("da-install-weg", true);
  } catch (e) {}
  render();
}

/** Installations-Hinweis dauerhaft ausblenden. */
export function installWeg() {
  lsSet("da-install-weg", true);
  render();
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function startInstallation() {
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")
  ) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  window.addEventListener("offline", () => offlineHinweis(true));
  window.addEventListener("online", () => offlineHinweis(false));
  if (!navigator.onLine) offlineHinweis(true);
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    Z.installPrompt = e;
    render();
  });
  window.addEventListener("appinstalled", () => {
    Z.installPrompt = null;
    lsSet("da-install-weg", true);
    render();
  });
}
