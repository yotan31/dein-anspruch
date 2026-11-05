import { Z } from "../../state/zustand.js";
import { ic, infoBtn } from "../symbole.js";

export function datenBox() {
  return `<section class="panel datenbox">
    <div class="titelzeile"><h3>Deine Daten</h3>${infoBtn("Sicherung", "Lade ab und zu eine Sicherung herunter. Mit der Datei kannst du alles wiederherstellen, auch nach dem Löschen oder auf einem neuen Handy.")}</div>
    ${Z.USER ? `<div class="btnrow"><button class="btn small ghost" type="button" data-act="pw-aendern">Passwort ändern</button></div>` : ""}
    <div class="btnrow"><button class="btn small soft" type="button" data-act="backup" ${Z.dataBusy ? "disabled" : ""}>${ic("down")}${Z.dataBusy === "backup" ? "Sicherung wird erstellt …" : "Sicherung herunterladen"}</button><button class="btn small ghost" type="button" data-act="restore" ${Z.dataBusy ? "disabled" : ""}>${Z.dataBusy === "restore" ? "Wird eingespielt …" : "Sicherung einspielen"}</button></div>
    ${
      Z.wipeAsk
        ? `<div class="notice bad" id="wipebox">${ic("alert")}<span><strong>Bist du sicher?</strong> ${Z.USER ? `Dein Konto und alle Angaben, Belege und Fotos werden für immer gelöscht${Z.MEMBERS.length > 1 ? ". Eingeladene Familienmitglieder verlieren den Zugriff auf die gemeinsamen Angaben" : ""}.` : "Alle Angaben auf diesem Gerät werden gelöscht."} Das kann nicht rückgängig gemacht werden. Lade vorher am besten eine Sicherung herunter.
      <span class="btnrow" style="margin-top:10px"><button class="btn small soft" type="button" data-act="backup" ${Z.dataBusy ? "disabled" : ""}>${ic("down")}Erst Sicherung herunterladen</button></span>
      <span class="field" style="margin-top:10px"><label for="wipe-word">Zum Bestätigen <strong>LÖSCHEN</strong> eintippen</label><input type="text" id="wipe-word" autocomplete="off" autocapitalize="characters" spellcheck="false"></span>
      <span class="btnrow" style="margin-top:10px"><button class="btn small danger" type="button" data-act="wipe-yes" ${Z.wipeBusy ? "disabled" : ""}>${Z.wipeBusy ? "Wird gelöscht …" : "Ja, endgültig löschen"}</button><button class="btn small ghost" type="button" data-act="wipe-no" ${Z.wipeBusy ? "disabled" : ""}>Abbrechen</button></span></span></div>`
        : `<button class="linkbtn danger" type="button" data-act="wipe" style="align-self:flex-start">${Z.USER ? "Konto und alle Daten löschen" : "Alle Angaben auf diesem Gerät löschen"}</button>`
    }
  </section>`;
}
