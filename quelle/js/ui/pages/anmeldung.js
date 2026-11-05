import { lsGet } from "../../services/lokal.js";
import { zaehle } from "../../services/zaehlung.js";
import { Z } from "../../state/zustand.js";
import { startseite } from "./startseite.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/* ---------- Anmeldung ---------- */
/** Google-Anmeldung erst einschalten, wenn sie in Google Cloud und Supabase eingerichtet ist (Anleitung: dokumente/google-anmeldung.md) */
const GOOGLE_AKTIV = false;

/** Neues Passwort festlegen: nach dem Link aus der E-Mail „Passwort zurücksetzen“ oder über „Passwort ändern“. */
export function viewNeuesPasswort() {
  const bereit = !!Z.USER;
  return `<section class="panel auth">
    <h2>Neues Passwort festlegen</h2>
    <p class="muted">${bereit ? `Für ${esc(Z.USER.email || "dein Konto")}. Wähle ein Passwort mit mindestens 8 Zeichen und gib es zur Sicherheit zweimal ein.` : "Einen Moment, der Link wird geprüft …"}</p>
    <div class="field"><label for="au-pw">Neues Passwort</label><div class="pwrow"><input type="password" id="au-pw" autocomplete="new-password" ${bereit ? "" : "disabled"}><button type="button" class="btn small ghost" data-act="au-show">Zeigen</button></div></div>
    <div class="field"><label for="au-pw2">Neues Passwort wiederholen</label><input type="password" id="au-pw2" autocomplete="new-password" ${bereit ? "" : "disabled"}></div>
    ${Z.authMsg ? `<p class="notice ${/gespeichert/.test(Z.authMsg) ? "good" : "bad"}">${ic("info")}<span>${esc(Z.authMsg)}</span></p>` : ""}
    <button class="btn big" type="button" data-act="au-newpw" ${Z.authBusy || !bereit ? "disabled" : ""}>${Z.authBusy ? "Einen Moment …" : "Neues Passwort speichern"}</button>
    <button class="linkbtn" type="button" data-act="au-newpw-abbruch">Abbrechen</button>
  </section>`;
}

export function viewLogin() {
  const reg = Z.authMode === "register",
    fg = Z.authMode === "forgot",
    login = !reg && !fg;
  const einladung = !!lsGet("da-einladung");
  // Startseite wie eine Webseite; das Anmeldeformular öffnet sich über „Anmelden“ oben oder bei Einladung, Registrierung, Passwort vergessen
  if (login && (!einladung || Z.einladungSpaeter) && !Z.zeigeAnmeldung && !Z.authMsg) {
    zaehle("start");
    return startseite();
  }
  return `<section class="panel auth">
    <button type="button" class="linkbtn zurueck" data-act="au-start">${ic("chev")}Zur Startseite</button>
    ${einladung ? `<p class="notice good">${ic("user")}<span><strong>Du wurdest eingeladen.</strong> Melde dich an oder lege ein Konto an. Danach siehst du den gemeinsamen Fall.</span></p>` : ""}
    <h2>${reg ? "Konto anlegen" : fg ? "Passwort vergessen" : "Anmelden"}</h2>
    <p class="muted">${reg ? "Mit einem Konto sind deine Angaben und Belege sicher gespeichert und auf Handy und Computer gleich." : fg ? "Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen." : "Mit Konto sind deine Angaben und Belege auf allen Geräten da."}</p>
    ${
      fg || !GOOGLE_AKTIV
        ? ""
        : `<button type="button" class="btn big gbtn" data-act="au-google"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Mit Google anmelden</button>
    <div class="orline"><span>oder mit E-Mail</span></div>`
    }
    <div class="field"><label for="au-mail">E-Mail-Adresse</label><input type="email" id="au-mail" autocomplete="email" inputmode="email" value="${esc(lsGet("dein-anspruch-mail") || "")}"></div>
    ${fg ? "" : `<div class="field"><label for="au-pw">Passwort${reg ? " (mindestens 8 Zeichen)" : ""}</label><div class="pwrow"><input type="password" id="au-pw" autocomplete="${reg ? "new-password" : "current-password"}"><button type="button" class="btn small ghost" data-act="au-show">Zeigen</button></div></div>`}
    ${Z.authMsg ? `<p class="notice ${/fehl|falsch|nicht/i.test(Z.authMsg) ? "bad" : "info"}">${ic("info")}<span>${esc(Z.authMsg)}</span></p>` : ""}
    <button class="btn big" type="button" data-act="${reg ? "au-register" : fg ? "au-forgot" : "au-login"}" ${Z.authBusy ? "disabled" : ""}>${Z.authBusy ? "Einen Moment …" : reg ? "Konto anlegen" : fg ? "Link schicken" : "Anmelden"}</button>
    <div class="authlinks">
      ${Z.authMode !== "login" ? `<button type="button" class="linkbtn" data-act="au-mode" data-mode="login">Ich habe schon ein Konto</button>` : `<button type="button" class="linkbtn" data-act="au-mode" data-mode="register">Neu hier? Konto anlegen</button><button type="button" class="linkbtn" data-act="au-mode" data-mode="forgot">Passwort vergessen?</button>`}
    </div>
    <hr class="sep">
    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>
    <p class="small muted">Ohne Konto bleiben deine Angaben nur in diesem Browser. Du kannst später jederzeit ein Konto anlegen, deine Angaben werden dann übernommen.</p>
  </section>`;
}
