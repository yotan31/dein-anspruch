import { Z } from "./zustand.js";
import { esc } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
import { render } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
/* ---------- E-Mail-Erinnerungen ---------- */
Z.ERI = null; Z.eriLoaded = false;
async function loadEri(){ if(!Z.USER) return; const {data}=await Z.sb.from("erinnerung").select("aktiv,email").eq("user_id",Z.USER.id).maybeSingle(); Z.ERI=data||null; Z.eriLoaded=true; render() }
export async function setEri(aktiv,email){
  const mail=(email||(Z.ERI&&Z.ERI.email)||Z.USER.email||"").trim();
  if(aktiv && !/^\S+@\S+\.\S+$/.test(mail)){ toast("Bitte eine gültige E-Mail-Adresse eingeben."); return }
  const {error}=await Z.sb.from("erinnerung").upsert({user_id:Z.USER.id,aktiv,email:mail,updated_at:new Date().toISOString()});
  if(error){ toast("Speichern hat nicht geklappt."); return }
  Z.ERI={aktiv,email:mail}; toast(aktiv?"Erinnerungen per E-Mail sind an.":"Erinnerungen per E-Mail sind aus."); render();
}
export function eriCard(){
  if(!Z.USER) return "";
  if(!Z.eriLoaded){ loadEri(); return "" }
  const on=Z.ERI&&Z.ERI.aktiv;
  return `<section class="panel mini">
    <div class="mini-head">${ic("bell")}<div><h3>Erinnerungen per E-Mail</h3><p class="small muted">Wir schreiben dir 14, 7 und 1 Tag vor jeder Frist, für alle Personen in deinem Konto.</p></div></div>
    ${on?`<p class="small">An: <strong>${esc(Z.ERI.email)}</strong></p><div class="btnrow"><button class="btn small ghost" type="button" data-act="eri-off">Ausschalten</button></div>`
      :`<div class="grid2" style="align-items:end"><div class="field"><label for="eri-mail">E-Mail-Adresse</label><input type="email" id="eri-mail" value="${esc((Z.ERI&&Z.ERI.email)||Z.USER.email||"")}"></div><div><button class="btn" type="button" data-act="eri-on">${ic("bell")}Einschalten</button></div></div>`}
  </section>`;
}

