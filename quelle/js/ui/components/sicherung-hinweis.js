// Hinweis für Nutzung ohne Konto, sobald der erste Antrag fertig ist: Die Angaben liegen nur in diesem Browser.
// Erscheint, bis man ein Konto anlegt, eine Sicherung herunterlädt oder „Nicht mehr anzeigen“ wählt.
import { Z } from "../../state/zustand.js";
import { folgeBox } from "./folge-box.js";
import { ic } from "../symbole.js";

export function sicherungHinweis() {
  if (Z.USER || Z.S.sicherungHinweis) return "";
  return folgeBox(
    "lock",
    "Deine Angaben sind nur auf diesem Gerät",
    "Löschst du den Browserverlauf oder wechselst du das Handy, sind sie weg. Mit einem kostenlosen Konto bleiben sie erhalten. Oder du lädst eine Sicherung herunter.",
    `<span class="btnrow"><button class="btn small" type="button" data-act="guest-register">Konto anlegen</button><button class="btn small soft" type="button" data-act="backup">${ic("down")}Sicherung herunterladen</button></span>
    <button class="linkbtn" type="button" data-act="sicherung-weg">Nicht mehr anzeigen</button>`,
  );
}
