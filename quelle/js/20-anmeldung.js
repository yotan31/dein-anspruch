import { Z } from "./zustand.js";
import { blank, esc } from "./01-grundlagen.js";
import { ic } from "./03-hilfsmittel.js";
import { $, render, scrollTop } from "./11-darstellung.js";
import { toast } from "./18-bedienung.js";
import { lsGet, lsSet } from "./19-speicher.js";
/* ---------- Anmeldung ---------- */
export function viewLogin(){
  if(Z.RECOVERY) return `<section class="panel auth"><h2>Neues Passwort festlegen</h2>
    <div class="field"><label for="au-pw">Neues Passwort (mindestens 8 Zeichen)</label><input type="password" id="au-pw" autocomplete="new-password"></div>
    ${Z.authMsg?`<p class="notice">${ic("info")}<span>${esc(Z.authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="au-newpw" ${Z.authBusy?"disabled":""}>Passwort speichern</button></section>`;
  const reg=Z.authMode==="register", fg=Z.authMode==="forgot";
  return `<section class="panel auth">
    ${lsGet("da-einladung")?`<p class="notice good">${ic("user")}<span><strong>Du wurdest eingeladen.</strong> Melde dich an oder lege ein Konto an. Danach siehst du den gemeinsamen Fall.</span></p>`:""}
    <h2>${reg?"Konto anlegen":fg?"Passwort vergessen":"Willkommen"}</h2>
    <p class="muted">${reg?"Mit einem Konto sind deine Angaben und Belege sicher gespeichert und auf Handy und Computer gleich.":fg?"Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.":"Melde dich an, um deine Angaben und Belege zu sehen."}</p>
    ${fg?"":`<button type="button" class="btn big gbtn" data-act="au-google"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Mit Google anmelden</button>
    <div class="orline"><span>oder mit E-Mail</span></div>`}
    <div class="field"><label for="au-mail">E-Mail-Adresse</label><input type="email" id="au-mail" autocomplete="email" inputmode="email" value="${esc(lsGet("dein-anspruch-mail")||"")}"></div>
    ${fg?"":`<div class="field"><label for="au-pw">Passwort${reg?" (mindestens 8 Zeichen)":""}</label><div class="euro"><input type="password" id="au-pw" autocomplete="${reg?"new-password":"current-password"}"><button type="button" class="btn small ghost" data-act="au-show">Zeigen</button></div></div>`}
    ${Z.authMsg?`<p class="notice ${/fehl|falsch|nicht/i.test(Z.authMsg)?"bad":"info"}">${ic("info")}<span>${esc(Z.authMsg)}</span></p>`:""}
    <button class="btn big" type="button" data-act="${reg?"au-register":fg?"au-forgot":"au-login"}" ${Z.authBusy?"disabled":""}>${Z.authBusy?"Einen Moment …":reg?"Konto anlegen":fg?"Link schicken":"Anmelden"}</button>
    <div class="btnrow">
      ${Z.authMode!=="login"?`<button type="button" class="linkbtn" data-act="au-mode" data-mode="login">Ich habe schon ein Konto</button>`:`<button type="button" class="linkbtn" data-act="au-mode" data-mode="register">Neu hier? Konto anlegen</button><button type="button" class="linkbtn" data-act="au-mode" data-mode="forgot">Passwort vergessen?</button>`}
    </div>
    <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>
    <button type="button" class="linkbtn" data-act="r-start">Pflegegrad-Rechner: ohne Anmeldung einschätzen, welcher Pflegegrad in Frage kommt</button>
    <p class="small muted">Ohne Konto bleiben deine Angaben nur in diesem Browser, und Belege-Fotos werden nicht gespeichert. Du kannst später jederzeit ein Konto anlegen, deine Angaben werden dann übernommen.</p>
  </section>`;
}
export async function authAction(a){
  const mail=($("au-mail")||{}).value?.trim()||"", pw=($("au-pw")||{}).value||"";
  if(a!=="au-newpw" && !/^\S+@\S+\.\S+$/.test(mail)){ Z.authMsg="Bitte eine gültige E-Mail-Adresse eingeben."; return render() }
  if((a==="au-register"||a==="au-newpw") && pw.length<8){ Z.authMsg="Das Passwort muss mindestens 8 Zeichen haben."; return render() }
  lsSet("dein-anspruch-mail",mail||lsGet("dein-anspruch-mail"));
  Z.authBusy=true; Z.authMsg=""; render();
  const back=location.origin+location.pathname;
  let r;
  try{
    if(a==="au-login"){ r=await Z.sb.auth.signInWithPassword({email:mail,password:pw}); if(r.error) Z.authMsg=/confirm/i.test(r.error.message)?"Die E-Mail-Adresse ist noch nicht bestätigt. Bitte den Link in der Bestätigungs-E-Mail antippen.":"Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch."; else lsSet("dein-anspruch-modus","konto") }
    else if(a==="au-register"){ r=await Z.sb.auth.signUp({email:mail,password:pw,options:{emailRedirectTo:back}});
      if(r.error) Z.authMsg=/already|registered/i.test(r.error.message)?"Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.":/rate|limit/i.test(r.error.message)?"Gerade werden zu viele E-Mails verschickt. Bitte in einer Stunde noch einmal versuchen.":"Konto anlegen hat nicht geklappt: "+r.error.message;
      else if(!r.data.session){ Z.authMsg="Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte den Link darin antippen und dich danach hier anmelden."; Z.authMode="login" } }
    else if(a==="au-forgot"){ r=await Z.sb.auth.resetPasswordForEmail(mail,{redirectTo:back}); Z.authMsg=r.error?"Das hat nicht geklappt. Bitte später noch einmal versuchen.":"Wenn es ein Konto mit dieser Adresse gibt, ist jetzt eine E-Mail mit einem Link unterwegs."; }
    else if(a==="au-newpw"){ r=await Z.sb.auth.updateUser({password:pw}); if(r.error) Z.authMsg="Das neue Passwort konnte nicht gespeichert werden."; else { Z.RECOVERY=false; Z.authMsg=""; toast("Neues Passwort gespeichert") } }
  }catch(e){ Z.authMsg="Keine Verbindung. Bitte Internet prüfen." }
  Z.authBusy=false; render();
}
export async function googleLogin(){
  Z.authBusy=true; Z.authMsg=""; render();
  const {error}=await Z.sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
  if(error){ Z.authBusy=false; Z.authMsg=/not enabled|provider/i.test(error.message)?"Die Anmeldung mit Google ist noch nicht eingeschaltet. Bitte vorerst mit E-Mail anmelden.":"Anmeldung mit Google hat nicht geklappt. Bitte erneut versuchen."; render() }
}
export async function logout(){ try{ await Z.sb.auth.signOut() }catch(e){} Z.ERI=null; Z.eriLoaded=false; lsSet("dein-anspruch-modus",""); Z.USER=null; Z.GUEST=false; Z.S=blank(); Z.BEL=[]; Z.URLS={}; Z.FAELLE=[]; Z.FALL_ID=null; Z.showPersons=false; Z.canSave=false; Z.ref=null; render(); scrollTop() }

