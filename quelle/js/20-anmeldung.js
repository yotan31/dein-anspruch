import { Z } from "./zustand.js";
import { BETRAEGE } from "./00-betraege.js";
import { blank, esc, eur } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
import { $, render, scrollTop } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
import { lsGet, lsSet } from "./19-speicher.js";
import { faqHTML } from "./25-hilfe.js";
import { zaehle } from "./26-zaehlung.js";
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
/** Beispiel-Vorschau der App im Kopf der Startseite: Beträge aus der Leistungsübersicht 2026 (Pflegegrad 3, Pflege zu Hause) */
function vorschau() {
  /** @type {[string, number][]} */
  const posten = [
    ["Verhinderungs- und Kurzzeitpflege", BETRAEGE.jahresbetrag],
    ["Entlastungsbetrag", BETRAEGE.entlastung * 12],
    ["Pflegehilfsmittel", BETRAEGE.verbrauch * 12],
  ];
  const summe = posten.reduce((a, [, v]) => a + v, 0),
    tone = ["var(--money)", "var(--money-2)", "var(--money-3)"];
  return `<div class="lp-vorschau" aria-hidden="true">
    <div class="lp-phone">
      <div class="lp-phone-kopf"><img src="logo.webp" width="30" height="30" alt=""><b>Dein Anspruch</b></div>
      <div class="lp-karte">
        <span class="lp-k-label">Noch offen pro Jahr</span>
        <b class="lp-summe">${eur(summe)}</b>
        <div class="lp-track">${posten.map(([, v], i) => `<i style="flex:${v};background:${tone[i]}"></i>`).join("")}</div>
        ${posten.map(([t, v]) => `<div class="lp-zeile"><span>${t}</span><b>${eur(v)}</b></div>`).join("")}
      </div>
      <div class="lp-karte lp-fertig">${ic("file")}<span><b>Antrag fertig</b><small>Entlastungsbetrag · PDF</small></span><span class="lp-haken">${ic("check")}</span></div>
      <div class="lp-karte lp-fertig">${ic("bell")}<span><b>Beratungsbesuch</b><small>Frist 31.12. · im Kalender</small></span></div>
    </div>
    <p class="lp-bsp">Beispiel: Pflegegrad 3, Pflege zu Hause</p>
  </div>`;
}
/** Startseite für alle, die noch nicht angemeldet sind */
function startseite() {
  const schritt = (n, i, t, u) =>
    `<li class="lp-schritt"><span class="lp-nr">${n}</span>${ic(i)}<strong>${t}</strong><span>${u}</span></li>`;
  const fuer = (i, t, punkte) =>
    `<div class="lp-fuer">${ic(i)}<h3>${t}</h3><ul>${punkte.map((p) => `<li>${ic("check")}<span>${p}</span></li>`).join("")}</ul></div>`;
  return `<div class="lp">
  <section class="lp-band lp-hero">
    <div class="lp-hero-text">
      <p class="lp-eyebrow">${ic("shield")}Kostenlos · ohne Werbung · ohne Vollmacht</p>
      <h1>Alle Hilfen, die euch bei Pflege zustehen. Mit fertigen Anträgen.</h1>
      <p class="lp-lead">Bei Pflegegrad oder Schwerbehinderung bleiben oft mehrere tausend Euro im Jahr ungenutzt. „Dein Anspruch“ zeigt in wenigen Minuten, was offen ist, und schreibt die Anträge für dich vor.</p>
      <div class="lp-cta">
        <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
        <button type="button" class="btn big ghost" data-act="r-start">${ic("form")}Pflegegrad einschätzen</button>
      </div>
      <ul class="lp-facts"><li>${ic("cal")}etwa 3 Minuten</li><li>${ic("list")}über 30 Leistungen</li><li>${ic("check")}Beträge 2026</li></ul>
    </div>
    ${vorschau()}
  </section>

  <section class="lp-trust" aria-label="Darauf kannst du dich verlassen">
    <div>${ic("shield")}<span><strong>Keine Vollmacht</strong>Du schickst die Anträge selbst ab</span></div>
    <div>${ic("euro")}<span><strong>Kostenlos</strong>Ohne Abo und ohne Werbung</span></div>
    <div>${ic("lock")}<span><strong>Daten in Deutschland</strong>Gespeichert in Frankfurt</span></div>
    <div>${ic("list")}<span><strong>Alles auf einen Blick</strong>Alle Ansprüche, nicht nur einer</span></div>
  </section>

  <section class="lp-sektion">
    <p class="lp-kicker">So funktioniert's</p>
    <h2>In drei Schritten zu euren Leistungen</h2>
    <ol class="lp-schritte">
      ${schritt(1, "list", "Fragen beantworten", "Ein paar einfache Fragen zu Pflegegrad, Kasse und Wohnsituation.")}
      ${schritt(2, "euro", "Ansprüche sehen", "Die App zeigt, was euch zusteht, mit Beträgen für 2026.")}
      ${schritt(3, "file", "Antrag abschicken", "Fertiger Brief als PDF oder E-Mail. Ihr prüft und schickt selbst ab.")}
    </ol>
  </section>

  <section class="lp-sektion schnell">
    <p class="lp-kicker">Direkt starten</p>
    <h2>Was möchtest du beantragen?</h2>
    <div class="kacheln">${SCHNELL.map(([k, i, t, u]) => `<button type="button" class="kachel" data-act="schnell" data-ziel="${k}">${ic(i)}<strong>${t}</strong><span>${u}</span></button>`).join("")}</div>
  </section>

  <section class="lp-band lp-grau lp-sektion">
    <p class="lp-kicker">Für wen?</p>
    <h2>Für alle, die sich um Pflege kümmern</h2>
    <div class="lp-fuer-liste">
      ${fuer("heart", "Pflegebedürftige", ["Pflegegrad beantragen oder erhöhen", "Pflegegeld, Pflegedienst, Hilfsmittel", "Hausnotruf und Wohnungsumbau"])}
      ${fuer("people", "Pflegende Angehörige", ["Entlastungsbetrag und Verhinderungspflege", "Rentenpunkte und Auszeit vom Job", "Belege sammeln, Fristen im Blick"])}
      ${fuer("access", "Menschen mit Schwerbehinderung", ["Schwerbehindertenausweis und Merkzeichen", "Steuer-Pauschbeträge", "Parkausweis, Wertmarke, Rundfunkbeitrag"])}
    </div>
  </section>

  <section class="lp-sektion">
    <div class="lp-rechner">
      <div>${ic("form")}<h2>Welcher Pflegegrad kommt in Frage?</h2><p>Der Pflegegrad-Rechner schätzt nach dem Punktesystem der Pflegekasse ein, welcher Pflegegrad möglich ist. Ohne Anmeldung, etwa 5 Minuten.</p></div>
      <button type="button" class="btn big" data-act="r-start">Pflegegrad einschätzen</button>
    </div>
  </section>

  <section class="lp-sektion fragen">
    <p class="lp-kicker">Häufige Fragen</p>
    <h2>Noch Fragen?</h2>
    ${faqHTML()}
  </section>

  <section class="lp-band lp-schluss">
    <h2>In wenigen Minuten wisst ihr, was euch zusteht.</h2>
    <p>Kostenlos, ohne Anmeldung, ohne Vollmacht.</p>
    <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
  </section>
  </div>`;
}
/** Schnellstart: häufige Anträge direkt von der Startseite aus */
const SCHNELL = [
  ["pg_antrag", "form", "Pflegegrad beantragen", "Erstantrag bei der Pflegekasse"],
  ["pg_hoch", "heart", "Pflegegrad erhöhen", "Wenn mehr Hilfe nötig ist"],
  ["technisch", "bell", "Hausnotruf & Hilfsmittel", "Notrufknopf, Pflegebett und mehr"],
  ["verbrauch", "case", "Pflegehilfsmittel", `Handschuhe, Desinfektion: bis ${BETRAEGE.verbrauch} € im Monat`],
  ["entlastung", "receipt", "Entlastungsbetrag", `${BETRAEGE.entlastung} € im Monat für Haushaltshilfe`],
  ["sb_antrag", "access", "Schwer\u00ADbehinderten\u00ADausweis", "Antrag beim Versorgungsamt"],
];
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
