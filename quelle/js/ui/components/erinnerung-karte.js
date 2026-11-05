import { loadEri } from "../../services/erinnerungen.js";
import { Z } from "../../state/zustand.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

export function eriCard() {
  if (!Z.USER) return "";
  if (!Z.eriLoaded) {
    loadEri();
    return "";
  }
  const on = Z.ERI && Z.ERI.aktiv;
  return `<section class="panel mini">
    <div class="mini-head">${ic("bell")}<div><h3>Erinnerungen per E-Mail</h3><p class="small muted">Wir schreiben dir 14, 7 und 1 Tag vor jeder Frist, für alle Personen in deinem Konto.</p></div></div>
    ${
      on
        ? `<p class="small">An: <strong>${esc(Z.ERI.email)}</strong></p><div class="btnrow"><button class="btn small ghost" type="button" data-act="eri-off">Ausschalten</button></div>`
        : `<div class="grid2" style="align-items:end"><div class="field"><label for="eri-mail">E-Mail-Adresse</label><input type="email" id="eri-mail" value="${esc((Z.ERI && Z.ERI.email) || Z.USER.email || "")}"></div><div><button class="btn" type="button" data-act="eri-on">${ic("bell")}Einschalten</button></div></div>`
    }
  </section>`;
}
