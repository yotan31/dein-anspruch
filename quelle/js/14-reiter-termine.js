/* ---------- Reiter: Termine ---------- */
function viewTermine(){
  const dl=deadlines(); const rel=beratungRelevant(); const st=beratungStatus();
  const halves=[st.prev,st.H,st.next];
  return `
  ${eriCard()}
  ${rel?`<section class="panel">
    <div class="section-title"><h2>Beratungsbesuch</h2><span class="small muted">§ 37 Abs. 3 SGB XI</span></div>
    <p class="muted small">Wer Pflegegeld bekommt, muss einmal in jedem Kalenderhalbjahr (Januar–Juni und Juli–Dezember) einen Beratungsbesuch durch einen Pflegedienst oder eine anerkannte Beratungsstelle nachweisen. Fehlt der Nachweis, kürzt die Pflegekasse das Pflegegeld, im Wiederholungsfall wird es gestrichen. Der Besuch ist kostenlos, jeder zweite darf per Video sein.</p>
    <div class="halves">${halves.map((h,i)=>{const done=st.inH(h);const cls=done?"done":i===0?"miss":i===1?"open":"";return `<div class="half ${cls}"><b>${h.label}</b><span>${done?"erledigt":i===0?"kein Besuch eingetragen":i===1?`offen · bis ${deD(h.end)}`:`ab ${deD(h.start)}`}</span></div>`}).join("")}</div>
    <div class="grid2">
      <div class="field"><label for="tdienst">Pflegedienst / Beratungsstelle</label><input type="text" id="tdienst" value="${esc(S.termine.dienst)}" placeholder="Name"></div>
      <div class="field"><label for="ttel">Telefon</label><input type="tel" id="ttel" value="${esc(S.termine.tel)}"></div>
    </div>
    <div class="grid2" style="align-items:end">
      <div class="field"><label for="tbesuch">Besuch hat stattgefunden am</label><input type="date" id="tbesuch" max="${isoD(TODAY())}"></div>
      <div><button class="btn" type="button" data-act="addbesuch">${ic("check")}Besuch eintragen</button></div>
    </div>
    ${besuche().length?`<p class="small muted">Eingetragene Besuche: ${besuche().map(s=>deD(parseIso(s))).join(", ")}. Den Nachweis kannst du unter Belege als „Nachweis Beratungsbesuch“ ablegen.</p>`:""}
    <div class="recip"><span><strong>Text für den Pflegedienst</strong></span><span class="small" id="pdtext">${esc(pdText())}</span><span class="btnrow"><button class="btn small soft" type="button" data-act="copypd">Text kopieren</button></span></div>
  </section>`:""}

  <section style="display:flex;flex-direction:column;gap:10px">
    <div class="section-title"><h2>Fristen und Erinnerungen</h2></div>
    <p class="small muted">Trage Erinnerungen mit einem Klick in deinen Kalender ein. Der Kalender meldet sich dann auch, wenn die App geschlossen ist.</p>
    ${dl.length?dl.map(dueHTML).join(""):`<p class="muted">Keine Fristen für deine Situation.</p>`}
  </section>

  <section class="panel">
    <h3>Eigene Erinnerung</h3>
    <div class="grid2" style="align-items:end">
      <div class="field"><label for="ownt">Was?</label><input type="text" id="ownt" placeholder="z. B. Widerspruch Pflegegrad abschicken"></div>
      <div class="field"><label for="ownd">Wann?</label><input type="date" id="ownd"></div>
    </div>
    <div><button class="btn soft" type="button" data-act="addown">${ic("plus")}Hinzufügen</button></div>
    ${S.sb.status==="ja"&&(mz("G")||mz("aG")||mz("Gl")||mz("H")||mz("Bl"))?`<div class="field" style="max-width:260px"><label for="twm">Wertmarke gültig bis</label><input type="date" id="twm" value="${esc(S.termine.wertmarke)}"></div>`:""}
  </section>`;
}
function pdText(){
  const st=beratungStatus(); const H=st.done?st.next:st.H; const p=S.person;
  return `Guten Tag, ich möchte einen Beratungsbesuch nach § 37 Abs. 3 SGB XI für ${p.name||"[Name]"}${pg()?` (Pflegegrad ${pg()})`:""} vereinbaren. Der Besuch muss im ${H.label} stattfinden, also bis spätestens ${deD(H.end)}. Bitte schicken Sie den Nachweis anschließend direkt an die ${kassePK()} und mir eine Kopie. Vielen Dank!`;
}
function dueHTML(x){
  const u=x.ok?"ok":urg(x.d);
  return `<div class="due ${u}">
    <div class="cal"><b>${MON[x.d.getMonth()]}</b><span>${x.d.getDate()}</span></div>
    <div class="d-t">${esc(x.t)} <span class="pill ${u}">${x.ok?"erledigt bis "+deD(beratungStatus().H.end):urgTxt(x.d)}</span></div>
    <div class="d-s">${esc(x.s)}</div>
    <div class="btnrow">
      <a class="btn small soft" href="${gcal(x)}" target="_blank" rel="noopener">${ic("cal")}Google Kalender</a>
      <a class="btn small ghost" href="${ocal(x)}" target="_blank" rel="noopener">Outlook</a>
      ${x.own?`<button type="button" class="btn small ghost" data-delown="${x.own}">Entfernen</button>`:""}
    </div>
  </div>`;
}

