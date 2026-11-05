// Rückmeldungen an das Team senden und die App weiterempfehlen (Teilen-Menü des Geräts).
import { APP_VERSION } from "../config/version.js";
import { Z } from "../state/zustand.js";
import { closeFeedback } from "../ui/components/feedback-fenster.js";
import { toast } from "../ui/hinweise.js";
import { $ } from "../ui/render.js";

/** Wo in der App die Nachricht geschrieben wurde (ohne persönliche Angaben), damit sie sich zuordnen lässt */
function bereich() {
  if (Z.S.wiz) return "antrag:" + Z.S.wiz.k;
  if (Z.RECHNER) return "rechner";
  if (!Z.USER && !Z.GUEST) return "start";
  if (!Z.S.done) return "fragebogen";
  return (Z.S.tab || "ansprueche") + (Z.openKey ? ":" + Z.openKey : "");
}

/** Sendet die Rückmeldung aus dem Fenster „App verbessern“. */
export async function sendFeedback() {
  const t = (($("fb-text") || {}).value || "").trim();
  if (t.length < 2) {
    toast("Bitte kurz schreiben, worum es geht.");
    return;
  }
  if (!Z.sb) {
    toast("Keine Verbindung. Bitte später noch einmal versuchen.");
    return;
  }
  const btn = document.querySelector('#fbbox [data-act="fb-send"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Wird gesendet …";
  }
  const kontakt = (($("fb-kontakt") || {}).value || "").trim().slice(0, 200);
  const art = (btn && btn.getAttribute("data-art")) || "idee";
  let wo = "";
  try {
    wo = bereich().slice(0, 40);
  } catch (e) {}
  const { error } = await Z.sb
    .from("rueckmeldung")
    .insert({ text: t.slice(0, 3000), kontakt: kontakt || null, version: APP_VERSION, art, bereich: wo || null });
  if (error) {
    toast("Senden hat nicht geklappt. Bitte noch einmal versuchen.");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Senden";
    }
    return;
  }
  closeFeedback();
  toast("Danke! Deine Nachricht ist angekommen.");
}

/** Empfiehlt die App weiter: Teilen-Menü des Geräts, sonst über WhatsApp. */
export async function shareApp() {
  const url = "https://yotan31.github.io/dein-anspruch/";
  const text =
    "Schau mal: Mit „Dein Anspruch“ siehst du kostenlos, welche Pflege-Leistungen euch noch zustehen. Mit fertigen Anträgen und Erinnerung an Fristen.";
  if (navigator.share) {
    try {
      await navigator.share({ title: "Dein Anspruch", text, url });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
}
