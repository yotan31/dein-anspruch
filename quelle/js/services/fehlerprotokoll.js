// Meldet Programmfehler ohne persönliche Daten an die Datenbank, damit sie behoben werden können.
// Begrenzt auf wenige Meldungen pro Sitzung, damit eine Fehlerschleife nichts flutet.
import { APP_VERSION } from "../config/version.js";
import { Z } from "../state/zustand.js";
import { closeFeedback } from "../ui/components/feedback-fenster.js";
import { famKey } from "../ui/render.js";

function reportError(msg, stack) {
  if (!Z.sb || Z.errN >= 5) return;
  Z.errN++;
  const clean = (s) =>
    String(s || "")
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[mail]")
      .replace(/\d{5,}/g, "[zahl]");
  let seite = "";
  try {
    seite = famKey().split(":")[0];
  } catch (e) {}
  try {
    Z.sb
      .from("fehler")
      .insert({
        meldung: clean(msg).slice(0, 500) || "?",
        stelle: clean(stack).slice(0, 1500),
        seite: seite.slice(0, 100),
        version: APP_VERSION,
        geraet: navigator.userAgent.slice(0, 200),
      })
      .then(
        () => {},
        () => {},
      );
  } catch (e) {}
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function startFehlerprotokoll() {
  window.addEventListener("error", (e) => {
    if (e.message && !/ResizeObserver|^Script error/.test(e.message))
      reportError(e.message, (e.error && e.error.stack) || (e.filename || "") + ":" + (e.lineno || ""));
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    if (r && r.name === "AbortError") return;
    reportError((r && r.message) || String(r), r && r.stack);
  });
  document.addEventListener("click", (e) => {
    const tg = /** @type {HTMLElement} */ (e.target);
    if (tg && tg.id === "fbbox") closeFeedback();
  });
}
