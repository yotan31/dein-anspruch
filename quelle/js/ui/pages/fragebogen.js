import { AOK_REGIONEN, KASSEN, MZ, WOHNEN } from "../../config/stammdaten.js";
import { visSteps } from "../../logic/fragebogen.js";
import { B, applicable } from "../../logic/leistungen.js";
import { Z } from "../../state/zustand.js";
import { ic, infoBtn } from "../symbole.js";
import { esc } from "../../utils/format.js";

/** @param {string} name @param {string} val @param {string} label @param {string} [small] @param {string} [type] @param {any} [checked] */
function choice(name, val, label, small, type = "radio", checked = false) {
  const id = `${name}-${val}`.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `<label class="choice" for="${id}"><input type="${type}" id="${id}" name="${name}" value="${esc(val)}" ${checked ? "checked" : ""}><span>${esc(label)}${small ? `<small>${esc(small)}</small>` : ""}</span></label>`;
}

function stepper() {
  const vs = visSteps();
  const n = Z.S.step + 1;
  return `<div class="stepper"><div class="meta"><span>Schritt ${n} von ${vs.length}</span><span>${vs[Z.S.step].label}</span></div><div class="bar"><i style="width:${Math.round((n / vs.length) * 100)}%"></i></div></div>`;
}

/** @param {any} [canNext] wahr, wenn die Frage beantwortet ist @param {string} [nextLabel] @param {string} [why] */
function nav(canNext = true, nextLabel = "Weiter", why = "Bitte beantworte zuerst die Frage oben.") {
  return `<p class="notice navwarn" id="navwarn" hidden>${ic("alert")}<span>${esc(why)}</span></p><div class="nav go">${Z.S.step > 0 ? `<button class="btn ghost" type="button" data-act="back">Zurück</button>` : "<span></span>"}<button class="btn big" type="button" data-act="next" data-ok="${canNext ? 1 : 0}">${nextLabel}</button></div>`;
}

export const VIEWS = {
  start: () => `<section class="panel">${stepper()}
   <div class="intro">
     <div class="titelzeile"><h2>Welche Hilfen stehen dir noch zu?</h2>${infoBtn("Warum diese Fragen?", "Viele Familien nutzen nur das Pflegegeld. Dabei sind oft mehrere tausend Euro im Jahr zusätzlich drin, etwa für Haushaltshilfe, Ersatzpflege oder Hilfsmittel.\n\nNach ein paar Fragen siehst du deine offenen Ansprüche mit fertigen Anträgen.")}</div>
     <p class="muted">Ein paar Fragen, etwa 3 Minuten.</p>
   </div>
   ${zielHinweis()}
   <fieldset class="q"><legend>Für wen nutzt du die App?</legend><div class="choices">
     ${choice("rolle", "selbst", "Für mich selbst", "ich bin pflegebedürftig oder schwerbehindert", "radio", Z.S.rolle === "selbst")}
     ${choice("rolle", "angehoerig", "Für eine angehörige Person", "ich pflege oder kümmere mich", "radio", Z.S.rolle === "angehoerig")}
   </div></fieldset>
   <fieldset class="q"><legend>Worum geht es?</legend><p class="hint">Beides ist möglich.</p><div class="choices">
     ${choice("bereich", "pflege", "Pflegegrad / Pflegebedürftigkeit", "", "checkbox", Z.S.bereiche.pflege)}
     ${choice("bereich", "sb", "Schwerbehinderung / GdB", "", "checkbox", Z.S.bereiche.sb)}
   </div></fieldset>
   ${nav(Z.S.rolle && (Z.S.bereiche.pflege || Z.S.bereiche.sb), "Los geht's", !Z.S.rolle ? "Bitte wähle zuerst oben aus, für wen du die App nutzt." : "Bitte wähle mindestens ein Thema aus: Pflegegrad oder Schwerbehinderung.")}
 </section>`,
  kasse: () => `<section class="panel">${stepper()}
   <div class="titelzeile"><h2>Bei welcher Krankenkasse ${Z.S.rolle === "angehoerig" ? "ist die Person" : "bist du"} versichert?</h2>${infoBtn("Krankenkasse und Pflegekasse", "Die Pflegekasse gehört immer zur Krankenkasse. Dorthin gehen die Anträge.\n\nPrivat versichert? Die Leistungen der Pflegepflichtversicherung sind gleich hoch, Anträge gehen dann an die private Pflegeversicherung. Wähle „Andere“.")}</div>
   <fieldset class="q"><legend class="sr">Krankenkasse</legend><div class="choices">
     ${Object.entries(KASSEN)
       .map(([k, v]) => choice("kasse", k, v.name, "", "radio", Z.S.kasse === k))
       .join("")}
   </div></fieldset>
   ${Z.S.kasse === "aok" ? `<div class="field"><label for="aokRegion">Welche AOK?</label><select id="aokRegion"><option value="">Bitte wählen</option>${AOK_REGIONEN.map((r) => `<option ${Z.S.aokRegion === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>` : ""}
   ${Z.S.kasse === "andere" ? `<div class="field"><label for="kasseAndere">Name der Kasse</label><input type="text" id="kasseAndere" value="${esc(Z.S.kasseAndere)}" placeholder="z. B. KNAPPSCHAFT, SBK"></div>` : ""}
   ${nav(!!Z.S.kasse && (Z.S.kasse !== "aok" || Z.S.aokRegion))}
 </section>`,
  pflege: () => `<section class="panel">${stepper()}
   <h2>Pflegegrad und Wohnsituation</h2>
   <fieldset class="q"><legend>Welcher Pflegegrad ist festgestellt?</legend><div class="choices">
     ${choice("pg", "0", "Noch keiner", "oder Antrag läuft", "radio", Z.S.pg === "0")}
     ${[1, 2, 3, 4, 5].map((n) => choice("pg", String(n), "Pflegegrad " + n, ["", "geringe", "erhebliche", "schwere", "schwerste", "schwerste, besondere Anforderungen"][n] + " Beeinträchtigung", "radio", Z.S.pg === String(n))).join("")}
   </div></fieldset>
   <fieldset class="q"><legend>Wo und wie wird gepflegt?</legend><div class="choices">
     ${Object.entries(WOHNEN)
       .map(([k, v]) => choice("wohnen", k, v.t, v.s, "radio", Z.S.wohnen === k))
       .join("")}
   </div></fieldset>
   ${nav(Z.S.pg !== "" && (Z.S.wohnen || Z.S.pg === "0"))}
 </section>`,
  pp: () => `<section class="panel">${stepper()}
   <div class="titelzeile"><h2>Wer pflegt im Alltag?</h2>${infoBtn("Pflegende Angehörige", "Pflegende Angehörige haben eigene Ansprüche, etwa Rentenpunkte und Freistellung vom Job.")}</div>
   <fieldset class="q"><legend>Pflegt eine Angehörige oder ein Angehöriger mindestens 10 Stunden pro Woche, verteilt auf mindestens 2 Tage?</legend><div class="choices">
     ${choice("stunden10", "ja", "Ja", "", "radio", Z.S.pp.stunden10 === "ja")}${choice("stunden10", "nein", "Nein", "", "radio", Z.S.pp.stunden10 === "nein")}${choice("stunden10", "unklar", "Weiß nicht", "", "radio", Z.S.pp.stunden10 === "unklar")}
   </div></fieldset>
   <fieldset class="q"><legend>Ist die pflegende Person berufstätig?</legend><div class="choices">
     ${choice("arbeit", "nein", "Nein / Rente", "", "radio", Z.S.pp.arbeit === "nein")}${choice("arbeit", "bis30", "Ja, bis 30 Std./Woche", "", "radio", Z.S.pp.arbeit === "bis30")}${choice("arbeit", "ueber30", "Ja, mehr als 30 Std./Woche", "", "radio", Z.S.pp.arbeit === "ueber30")}
   </div></fieldset>
   ${nav(Z.S.pp.stunden10 && Z.S.pp.arbeit)}
 </section>`,
  sb: () => `<section class="panel">${stepper()}
   <h2>Schwerbehinderung</h2>
   <fieldset class="q"><legend>Gibt es einen festgestellten Grad der Behinderung (GdB)?</legend><div class="choices">
     ${choice("sbstatus", "ja", "Ja, Bescheid oder Ausweis", "", "radio", Z.S.sb.status === "ja")}${choice("sbstatus", "beantragt", "Beantragt, noch kein Bescheid", "", "radio", Z.S.sb.status === "beantragt")}${choice("sbstatus", "nein", "Nein", "", "radio", Z.S.sb.status === "nein")}
   </div></fieldset>
   ${
     Z.S.sb.status === "ja"
       ? `
   <div class="field"><label for="gdb">GdB laut Bescheid</label><select id="gdb"><option value="">Bitte wählen</option>${[20, 30, 40, 50, 60, 70, 80, 90, 100].map((g) => `<option ${String(Z.S.sb.gdb) === String(g) ? "selected" : ""}>${g}</option>`).join("")}</select></div>
   <fieldset class="q"><legend>Merkzeichen im Ausweis</legend><p class="hint">Stehen auf der Rückseite des Ausweises.</p><div class="choices">
     ${Object.entries(MZ)
       .map(([k, v]) => choice("mz", k, v, "", "checkbox", !!Z.S.sb.mz[k]))
       .join("")}
   </div></fieldset>`
       : ""
   }
   <fieldset class="q"><legend>Weitere Angaben</legend><div class="choices">
     ${choice("sbx", "arbeit", "Berufstätig", "", "checkbox", Z.S.sb.arbeit)}
     ${choice("sbx", "auto", "Eigenes Auto (auf die Person zugelassen)", "", "checkbox", Z.S.sb.auto)}
     ${choice("sbx", "grundsicherung", "Bezieht Grundsicherung oder Bürgergeld", "", "checkbox", Z.S.sb.grundsicherung)}
   </div></fieldset>
   ${nav(Z.S.sb.status && (Z.S.sb.status !== "ja" || Z.S.sb.gdb))}
 </section>`,
  genutzt: () => {
    const list = applicable().filter(
      (b) => !["beratung", "pg_antrag", "pg_hoch", "sb_antrag", "sb_neu", "hzp", "pug"].includes(b.k),
    );
    return `<section class="panel">${stepper()}
   <h2>Was ${Z.S.rolle === "angehoerig" ? "bekommt ihr" : "bekommst du"} schon?</h2>
   <p class="muted">Kreuze an, was bereits genutzt wird. Alles andere zeigen wir als offenen Anspruch.</p>
   ${list.length ? `<div class="choices">${list.map((b) => choice("genutzt", b.k, b.t, b.p, "checkbox", !!Z.S.genutzt[b.k])).join("")}</div>` : `<p class="notice info">${ic("info")}<span>Für diese Situation gibt es noch keine laufenden Leistungen.</span></p>`}
   ${nav(true)}
 </section>`;
  },
  daten: () => {
    const p = Z.S.person,
      a = Z.S.rolle === "angehoerig";
    return `<section class="panel">${stepper()}
   <div class="titelzeile"><h2>Angaben für die Anträge</h2>${infoBtn("Wofür diese Angaben?", "Damit füllt die App die Schreiben vor. Felder dürfen leer bleiben, dann steht im Antrag eine Lücke. Die Daten liegen nur in deinem privaten Bereich.")}</div>
   <p class="muted">Alles freiwillig.</p>
   <h3>${a ? "Pflegebedürftige bzw. schwerbehinderte Person" : "Deine Daten"}</h3>
   <div class="grid2">
     ${fld("name", "Vor- und Nachname", p.name)}${fld("geb", "Geburtsdatum", p.geb, "text", "TT.MM.JJJJ")}
     ${fld("vnr", "Versichertennummer", p.vnr, "text", "steht auf der Gesundheitskarte")}${fld("strasse", "Straße, Hausnr.", p.strasse)}
     ${fld("ort", "PLZ, Ort", p.ort)}${!a ? fld("tel", "Telefon", p.tel, "tel") + fld("mail", "E-Mail", p.mail, "email") : ""}
   </div>
   ${
     a
       ? `<h3>Absender (du als Angehörige/r)</h3><div class="grid2">
     ${fld("absender", "Dein Name", p.absender)}${fld("beziehung", "Beziehung", p.beziehung, "text", "z. B. Tochter, Ehemann")}
     ${fld("absStrasse", "Straße, Hausnr.", p.absStrasse)}${fld("absOrt", "PLZ, Ort", p.absOrt)}
     ${fld("tel", "Telefon", p.tel, "tel")}${fld("mail", "E-Mail", p.mail, "email")}</div>
     <p class="small muted">${ic("info")} Für Anträge im Namen einer anderen Person braucht die Kasse eine Vollmacht. Sie steht automatisch auf der Checkliste.</p>`
       : ""
   }
   ${nav(true, "Ergebnis anzeigen")}
 </section>`;
  },
};

/** Über eine Schnellstart-Kachel gekommen: sagen, wohin der Fragebogen führt. */
function zielHinweis() {
  const b = Z.S.ziel && B.find((x) => x.k === Z.S.ziel);
  return b
    ? `<p class="notice info">${ic("file")}<span>Erst ein paar kurze Fragen zu deiner Lage, damit der Antrag stimmt und an die richtige Stelle geht. Danach öffnet sich direkt <strong>${esc(b.t)}</strong>.</span></p>`
    : "";
}

function fld(k, label, v, type = "text", ph = "") {
  return `<div class="field"><label for="p-${k}">${label}</label><input type="${type}" id="p-${k}" data-p="${k}" value="${esc(v)}" placeholder="${esc(ph)}"></div>`;
}
