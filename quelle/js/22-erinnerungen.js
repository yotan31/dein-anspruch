/* ---------- E-Mail-Erinnerungen ---------- */
let ERI=null, eriLoaded=false;
async function loadEri(){ if(!USER) return; const {data}=await sb.from("erinnerung").select("aktiv,email").eq("user_id",USER.id).maybeSingle(); ERI=data||null; eriLoaded=true; render() }
async function setEri(aktiv,email){
  const mail=(email||(ERI&&ERI.email)||USER.email||"").trim();
  if(aktiv && !/^\S+@\S+\.\S+$/.test(mail)){ toast("Bitte eine gültige E-Mail-Adresse eingeben."); return }
  const {error}=await sb.from("erinnerung").upsert({user_id:USER.id,aktiv,email:mail,updated_at:new Date().toISOString()});
  if(error){ toast("Speichern hat nicht geklappt."); return }
  ERI={aktiv,email:mail}; toast(aktiv?"Erinnerungen per E-Mail sind an.":"Erinnerungen per E-Mail sind aus."); render();
}
function eriCard(){
  if(!USER) return "";
  if(!eriLoaded){ loadEri(); return "" }
  const on=ERI&&ERI.aktiv;
  return `<section class="panel mini">
    <div class="mini-head">${ic("bell")}<div><h3>Erinnerungen per E-Mail</h3><p class="small muted">Wir schreiben dir 14, 7 und 1 Tag vor jeder Frist, für alle Personen in deinem Konto.</p></div></div>
    ${on?`<p class="small">An: <strong>${esc(ERI.email)}</strong></p><div class="btnrow"><button class="btn small ghost" type="button" data-act="eri-off">Ausschalten</button></div>`
      :`<div class="grid2" style="align-items:end"><div class="field"><label for="eri-mail">E-Mail-Adresse</label><input type="email" id="eri-mail" value="${esc((ERI&&ERI.email)||USER.email||"")}"></div><div><button class="btn" type="button" data-act="eri-on">${ic("bell")}Einschalten</button></div></div>`}
  </section>`;
}

