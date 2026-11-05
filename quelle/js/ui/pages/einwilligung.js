import { Z } from "../../state/zustand.js";

export function viewConsent() {
  return `<section class="panel auth consent">
    <h2>Bevor es losgeht</h2>
    <p>Damit die App dir helfen kann, speichert sie Angaben zur Pflege, zum Beispiel den Pflegegrad, Anträge und Belege. Das sind Gesundheitsdaten, und die sind besonders geschützt. Deshalb brauchen wir einmalig deine ausdrückliche Einwilligung.</p>
    <ul class="small">
      <li>Die Daten liegen verschlüsselt in Frankfurt (EU).</li>
      <li>Nur du und Personen, die du selbst einlädst, sehen sie.</li>
      <li>Keine Werbung, kein Verkauf von Daten.</li>
      <li>Du kannst alles jederzeit selbst löschen.</li>
    </ul>
    <label class="choice" for="cs-ok"><input type="checkbox" id="cs-ok"><span>Ich willige ein, dass Dein Anspruch meine Angaben, auch Gesundheitsdaten, speichert und verarbeitet, um mir die Funktionen der App bereitzustellen (Art. 9 Abs. 2 lit. a DSGVO). Wenn ich Angaben über eine andere Person mache, bin ich dazu berechtigt, zum Beispiel mit ihrem Einverständnis oder als Bevollmächtigte/r. Ich kann die Einwilligung jederzeit widerrufen, indem ich meine Daten in der App lösche.<small>Mehr dazu in der <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a>. Es gelten die <a href="nutzungsbedingungen.html" target="_blank" rel="noopener">Nutzungsbedingungen</a>.</small></span></label>
    <button class="btn big" type="button" data-act="cs-yes" ${Z.consentBusy ? "disabled" : ""}>${Z.consentBusy ? "Einen Moment …" : "Zustimmen und weiter"}</button>
    <button class="btn ghost" type="button" data-act="logout">Nicht zustimmen und abmelden</button>
  </section>`;
}
