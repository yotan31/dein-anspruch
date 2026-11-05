// Reiter „Termine“: Beratungsbesuche, Fristen, eigene Erinnerungen und Kalender-Links.
import { pdText } from "../../logic/antragstext.js";
import { beratungRelevant, beratungStatus, besuche, deadlines, gcal, ocal, urg, urgTxt } from "../../logic/fristen.js";
import { mz } from "../../logic/lage.js";
import { Z } from "../../state/zustand.js";
import { eriCard } from "../components/erinnerung-karte.js";
import { ic, infoBtn } from "../symbole.js";
import { MON, TODAY, deD, isoD, parseIso } from "../../utils/datum.js";
import { esc } from "../../utils/format.js";

/* ---------- Reiter: Termine ---------- */
export function viewTermine() {
  const dl = deadlines();
  const rel = beratungRelevant();
  const st = beratungStatus();
  const halves = [st.prev, st.H, st.next];
  return `
  ${eriCard()}
  ${
    rel
      ? `<section class="panel">
    <div class="titelzeile"><h2>Beratungsbesuch</h2>${infoBtn("Beratungsbesuch (§ 37 Abs. 3 SGB XI)", "Wer Pflegegeld bekommt, muss einmal in jedem Kalenderhalbjahr (Januar bis Juni und Juli bis Dezember) einen Beratungsbesuch durch einen Pflegedienst oder eine anerkannte Beratungsstelle nachweisen.\n\nFehlt der Nachweis, kürzt die Pflegekasse das Pflegegeld, im Wiederholungsfall wird es gestrichen. Der Besuch ist kostenlos, jeder zweite darf per Video sein.")}</div>
    <p class="small muted">Pflicht, solange Pflegegeld gezahlt wird.</p>
    <div class="halves">${halves
      .map((h, i) => {
        const done = st.inH(h);
        const cls = done ? "done" : i === 0 ? "miss" : i === 1 ? "open" : "";
        return `<div class="half ${cls}">${done ? ic("check") : i === 0 ? ic("alert") : i === 1 ? ic("cal") : ""}<b>${h.label}</b><span>${done ? "erledigt" : i === 0 ? "kein Besuch eingetragen" : i === 1 ? `offen bis ${deD(h.end)}` : `ab ${deD(h.start)}`}</span></div>`;
      })
      .join("")}</div>
    <div class="grid2">
      <div class="field"><label for="tdienst">Pflegedienst / Beratungsstelle</label><input type="text" id="tdienst" value="${esc(Z.S.termine.dienst)}" placeholder="Name"></div>
      <div class="field"><label for="ttel">Telefon</label><input type="tel" id="ttel" value="${esc(Z.S.termine.tel)}"></div>
    </div>
    <div class="grid2 items-end">
      <div class="field"><label for="tbesuch">Besuch hat stattgefunden am</label><input type="date" id="tbesuch" max="${isoD(TODAY())}"></div>
      <div><button class="btn" type="button" data-act="addbesuch">${ic("check")}Besuch eintragen</button></div>
    </div>
    ${
      besuche().length
        ? `<p class="small muted">Eingetragene Besuche: ${besuche()
            .map((s) => deD(parseIso(s)))
            .join(", ")}. Den Nachweis kannst du unter Belege als „Nachweis Beratungsbesuch“ ablegen.</p>`
        : ""
    }
    <div class="akk"><details data-akk="pdtext" ${Z.akk && Z.akk.pdtext ? "open" : ""}><summary>${ic("file")}<span>Text für den Pflegedienst</span>${ic("chev")}</summary><div class="akk-body"><span class="small" id="pdtext">${esc(pdText())}</span><span class="btnrow"><button class="btn small soft" type="button" data-act="copypd">Text kopieren</button></span></div></details></div>
  </section>`
      : ""
  }

  <section class="stapel-10">
    <div class="titelzeile"><h2>Fristen</h2>${infoBtn("Fristen und Erinnerungen", "Trage Fristen mit einem Tippen in deinen Kalender ein. Der Kalender meldet sich dann auch, wenn die App geschlossen ist. Mit Konto kann die App dich zusätzlich per E-Mail erinnern.")}</div>
    ${dl.length ? dl.map(dueHTML).join("") : `<p class="muted">Keine Fristen für deine Situation.</p>`}
  </section>

  <section class="panel">
    <h3>Eigene Erinnerung</h3>
    <div class="grid2 items-end">
      <div class="field"><label for="ownt">Was?</label><input type="text" id="ownt" placeholder="z. B. Widerspruch Pflegegrad abschicken"></div>
      <div class="field"><label for="ownd">Wann?</label><input type="date" id="ownd"></div>
    </div>
    <div><button class="btn soft" type="button" data-act="addown">${ic("plus")}Hinzufügen</button></div>
    ${Z.S.sb.status === "ja" && (mz("G") || mz("aG") || mz("Gl") || mz("H") || mz("Bl")) ? `<div class="field max-260"><label for="twm">Wertmarke gültig bis</label><input type="date" id="twm" value="${esc(Z.S.termine.wertmarke)}"></div>` : ""}
  </section>`;
}

function dueHTML(x) {
  const u = x.ok ? "ok" : urg(x.d);
  return `<div class="due ${u}">
    <div class="cal"><b>${MON[x.d.getMonth()]}</b><span>${x.d.getDate()}</span></div>
    <div class="d-t">${esc(x.t)} <span class="pill ${u}">${x.ok ? "erledigt bis " + deD(beratungStatus().H.end) : urgTxt(x.d)}</span></div>
    <div class="d-s">${esc(x.s)}</div>
    <div class="btnrow">
      <details class="calmenu"><summary class="btn small soft">${ic("cal")}In Kalender eintragen</summary><span class="calopts"><a class="btn small ghost" href="${gcal(x)}" target="_blank" rel="noopener">Google Kalender</a><a class="btn small ghost" href="${ocal(x)}" target="_blank" rel="noopener">Outlook</a></span></details>
      ${x.own ? `<button type="button" class="btn small ghost" data-delown="${x.own}">Entfernen</button>` : ""}
    </div>
  </div>`;
}
