import { lsGet, lsSet } from "./lokal.js";
import { blank } from "../state/angaben.js";
import { Z } from "../state/zustand.js";
import { toast } from "../ui/hinweise.js";
import { $, render, scrollTop } from "../ui/render.js";

export async function authAction(a) {
  const mail = ($("au-mail") || {}).value?.trim() || "",
    pw = ($("au-pw") || {}).value || "";
  if (a !== "au-newpw" && !/^\S+@\S+\.\S+$/.test(mail)) {
    Z.authMsg = "Bitte eine gültige E-Mail-Adresse eingeben.";
    return render();
  }
  if ((a === "au-register" || a === "au-newpw") && pw.length < 8) {
    Z.authMsg = "Das Passwort muss mindestens 8 Zeichen haben.";
    return render();
  }
  if (a === "au-newpw" && pw !== (($("au-pw2") || {}).value || "")) {
    Z.authMsg = "Die beiden Passwörter sind nicht gleich. Bitte noch einmal eingeben.";
    return render();
  }
  lsSet("dein-anspruch-mail", mail || lsGet("dein-anspruch-mail"));
  Z.authBusy = true;
  Z.authMsg = "";
  render();
  const back = location.origin + location.pathname;
  let r;
  try {
    if (a === "au-login") {
      r = await Z.sb.auth.signInWithPassword({ email: mail, password: pw });
      if (r.error)
        Z.authMsg = /confirm/i.test(r.error.message)
          ? "Die E-Mail-Adresse ist noch nicht bestätigt. Bitte den Link in der Bestätigungs-E-Mail antippen."
          : "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch.";
      else lsSet("dein-anspruch-modus", "konto");
    } else if (a === "au-register") {
      r = await Z.sb.auth.signUp({ email: mail, password: pw, options: { emailRedirectTo: back } });
      if (r.error)
        Z.authMsg = /already|registered/i.test(r.error.message)
          ? "Für diese E-Mail gibt es schon ein Konto. Bitte anmelden."
          : /rate|limit/i.test(r.error.message)
            ? "Gerade werden zu viele E-Mails verschickt. Bitte in einer Stunde noch einmal versuchen."
            : "Konto anlegen hat nicht geklappt. Bitte prüfe die E-Mail-Adresse und versuche es später noch einmal.";
      else if (!r.data.session) {
        Z.authMsg =
          "Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte den Link darin antippen und dich danach hier anmelden.";
        Z.authMode = "login";
      }
    } else if (a === "au-forgot") {
      r = await Z.sb.auth.resetPasswordForEmail(mail, { redirectTo: back + "?passwort=neu" });
      Z.authMsg = !r.error
        ? "Wenn es ein Konto mit dieser Adresse gibt, ist jetzt eine E-Mail mit einem Link unterwegs. Bitte nur den neuesten Link benutzen."
        : r.error.status === 429 || /rate|limit/i.test(r.error.message || "")
          ? "Gerade wurden schon zu viele E-Mails verschickt. Bitte in einer Stunde noch einmal versuchen. Ein Link, den du schon bekommen hast, funktioniert weiterhin."
          : "Das hat nicht geklappt. Bitte später noch einmal versuchen.";
    } else if (a === "au-newpw") {
      r = await Z.sb.auth.updateUser({ password: pw });
      if (r.error) {
        const m = String(r.error.message || "");
        Z.authMsg = /different|same/i.test(m)
          ? "Das neue Passwort muss sich vom alten unterscheiden."
          : /weak|short|characters/i.test(m)
            ? "Das Passwort ist zu schwach. Bitte ein längeres oder anderes wählen."
            : /session|expired|jwt|token/i.test(m)
              ? "Der Link ist abgelaufen. Bitte unter „Passwort vergessen?“ einen neuen anfordern."
              : "Das neue Passwort konnte nicht gespeichert werden. Bitte noch einmal versuchen.";
      } else {
        Z.RECOVERY = false;
        Z.authMsg = "";
        try {
          history.replaceState(null, "", location.pathname);
        } catch (e) {}
        toast("Neues Passwort gespeichert. Ab jetzt meldest du dich damit an.");
      }
    }
  } catch (e) {
    Z.authMsg = "Keine Verbindung. Bitte Internet prüfen.";
  }
  Z.authBusy = false;
  render();
}

export async function googleLogin() {
  Z.authBusy = true;
  Z.authMsg = "";
  render();
  const { error } = await Z.sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin + location.pathname },
  });
  if (error) {
    Z.authBusy = false;
    Z.authMsg = /not enabled|provider/i.test(error.message)
      ? "Die Anmeldung mit Google ist noch nicht eingeschaltet. Bitte vorerst mit E-Mail anmelden."
      : "Anmeldung mit Google hat nicht geklappt. Bitte erneut versuchen.";
    render();
  }
}

export async function logout() {
  try {
    await Z.sb.auth.signOut();
  } catch (e) {}
  Z.ERI = null;
  Z.eriLoaded = false;
  lsSet("dein-anspruch-modus", "");
  Z.USER = null;
  Z.GUEST = false;
  Z.S = blank();
  Z.BEL = [];
  Z.URLS = {};
  Z.FAELLE = [];
  Z.FALL_ID = null;
  Z.showPersons = false;
  Z.canSave = false;
  Z.ref = null;
  render();
  scrollTop();
}
