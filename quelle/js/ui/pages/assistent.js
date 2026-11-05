// Antrags-Assistent als Seite: eine Frage pro Bildschirm, am Ende der fertige Antrag.
import { getQ, personQs, wizSteps, wizTo } from "../../logic/antraege.js";
import { curLetter, docsFor, gmailLink, mailto } from "../../logic/antragstext.js";
import { B, FA, RECIP, empfAdresse, txt } from "../../logic/leistungen.js";
import { KM_SATZ, vhpCalc } from "../../logic/verhinderungspflege.js";
import { save } from "../../services/speicher.js";
import { zaehle } from "../../services/zaehlung.js";
import { Z } from "../../state/zustand.js";
import { render, scrollTop } from "../render.js";
import { ic } from "../symbole.js";
import { deD, parseIso } from "../../utils/datum.js";
import { esc, eur, numDE } from "../../utils/format.js";

/**
 * Öffnet den Antrags-Assistenten für eine Leistung.
 * @param k Schlüssel der Leistung
 */
export function startWiz(k) {
  const b = B.find((x) => x.k === k);
  zaehle("antrag_geoeffnet", k);
  Z.S.wiz = { k, i: 0, pq: personQs(b, Z.S.rolle === "angehoerig") };
  if (!b.q?.length && !Z.S.wiz.pq.length) Z.S.wiz.i = 1; // direkt zur Prüfung
  save();
  render();
  scrollTop();
}

function lab(q) {
  return txt(q.label);
}

function showVal(q) {
  if (q.type === "addr") return [Z.S.person.strasse, Z.S.person.ort].filter(Boolean).join(", ");
  if (q.type === "empf") return getQ(q);
  if (q.type === "absaddr") return [Z.S.person.absStrasse, Z.S.person.absOrt].filter(Boolean).join(", ");
  const v = getQ(q);
  if (Array.isArray(v)) return v.join(", ");
  if (v == null || String(v).trim() === "") return "";
  if (q.type === "date") {
    const d = parseIso(v);
    return d ? deD(d) : v;
  }
  if (q.type === "choice") {
    const o = (q.opts || []).find((o) => o.v === v);
    return o ? o.t : v;
  }
  if (q.type === "money") return eur(numDE(v), 2);
  return String(v);
}

function qInput(q) {
  const v = getQ(q),
    id = "wq-" + q.k;
  if (q.type === "choice")
    return `<div class="choices big">${q.opts.map((o) => `<label class="choice" for="${id}-${esc(o.v)}"><input type="radio" id="${id}-${esc(o.v)}" name="${id}" data-wq="${q.k}" value="${esc(o.v)}" ${v === o.v ? "checked" : ""}><span>${esc(o.t)}${o.s ? `<small>${esc(o.s)}</small>` : ""}</span></label>`).join("")}</div>`;
  if (q.type === "multi") {
    const arr = Array.isArray(v) ? v : [];
    return `<div class="choices big">${q.opts.map((o) => `<label class="choice" for="${id}-${esc(o.v)}"><input type="checkbox" id="${id}-${esc(o.v)}" data-wqm="${q.k}" value="${esc(o.v)}" ${arr.includes(o.v) ? "checked" : ""}><span>${esc(o.t)}</span></label>`).join("")}</div>`;
  }
  if (q.type === "absaddr")
    return `<div class="grid2"><div class="field"><label for="wq-absstrasse">Straße und Hausnummer</label><input type="text" id="wq-absstrasse" data-wqp="absStrasse" value="${esc(Z.S.person.absStrasse)}" autocomplete="street-address"></div><div class="field"><label for="wq-absort">PLZ und Ort</label><input type="text" id="wq-absort" data-wqp="absOrt" value="${esc(Z.S.person.absOrt)}" autocomplete="address-level2"></div></div>`;
  if (q.type === "empf") {
    const e = empfAdresse(wizTo());
    return `<div class="grid2"><div class="field"><label for="wq-estrasse">Straße oder Postfach</label><input type="text" id="wq-estrasse" data-wqe="strasse" value="${esc(e.strasse)}" placeholder="z. B. Postfach 12 34 56"></div><div class="field"><label for="wq-eort">PLZ und Ort</label><input type="text" id="wq-eort" data-wqe="ort" value="${esc(e.ort)}" placeholder="z. B. 20457 Hamburg"></div></div>`;
  }
  if (q.type === "addr")
    return `<div class="grid2"><div class="field"><label for="wq-strasse">Straße und Hausnummer</label><input type="text" id="wq-strasse" data-wqp="strasse" value="${esc(Z.S.person.strasse)}" autocomplete="street-address"></div><div class="field"><label for="wq-ort">PLZ und Ort</label><input type="text" id="wq-ort" data-wqp="ort" value="${esc(Z.S.person.ort)}" placeholder="z. B. 70173 Stuttgart"></div></div>`;
  if (q.type === "long")
    return `<textarea id="${id}" data-wq="${q.k}" rows="4" placeholder="${esc(q.ph || "")}" class="wq-langtext">${esc(v || "")}</textarea>`;
  const t = q.type === "date" ? "date" : q.type === "tel" ? "tel" : "text";
  const im = q.type === "money" || q.type === "number" ? ' inputmode="decimal"' : "";
  const inp = `<input type="${t}" id="${id}" data-wq="${q.k}" value="${esc(v || "")}" placeholder="${esc(q.ph || "")}"${im}>`;
  return q.type === "money" ? `<div class="euro">${inp}<span>€</span></div>` : inp;
}

/** Aktueller Schritt des Assistenten (HTML). */
export function viewWizard() {
  const { b, list } = wizSteps();
  const i = Math.min(Z.S.wiz.i, list.length - 1);
  Z.S.wiz.i = i;
  const step = list[i],
    nQ = list.length - 2;
  const top = `<div class="wiztop"><button type="button" class="btn small ghost" data-wnav="close">← Zur Übersicht</button><span class="small muted">${esc(b.t)}</span></div>`;
  if (step.type === "summary") {
    const qs = list.slice(0, -2);
    const missing = qs.filter((q) => !showVal(q)).length;
    return `<section class="panel wiz">${top}${bar(nQ + 1, nQ + 1, "Prüfen")}
      <h2 class="wq">Stimmt alles?</h2>
      <p class="whelp">Tippe auf „Ändern“, wenn etwas nicht passt.${missing ? ` ${missing === 1 ? "Eine Angabe ist" : missing + " Angaben sind"} noch offen. Das ist nicht schlimm: Im Antrag steht dann eine Lücke, die du von Hand ausfüllen kannst.` : ""}</p>
      <dl class="sum">${qs.map((q, j) => `<div><dt>${esc(lab(q))}</dt><dd>${showVal(q) ? esc(showVal(q)) : '<span class="open">noch offen</span>'}</dd><button type="button" class="linkbtn" data-wnav="goto:${j}">Ändern</button></div>`).join("") || '<p class="muted">Für diesen Antrag brauchen wir keine weiteren Angaben.</p>'}</dl>
      ${b.k === "jahresbetrag" ? vhpSummary() : ""}
      <div class="nav big go">${i > 0 ? `<button class="btn ghost" type="button" data-wnav="back">Zurück</button>` : "<span></span>"}<button class="btn" type="button" data-wnav="next">Antrag erstellen</button></div>
    </section>`;
  }
  if (step.type === "done") return viewDone(b);
  return `<section class="panel wiz">${top}${bar(i + 1, nQ + 1, `Frage ${i + 1} von ${nQ}`)}
    <h2 class="wq"><label for="wq-${step.k}">${esc(lab(step))}</label></h2>
    ${step.help ? `<p class="whelp">${ic("info")}<span>${esc(step.help)}</span></p>` : ""}
    ${qInput(step)}
    <p class="notice" id="wqwarn" hidden>${ic("alert")}<span></span></p>
    <div class="nav big go">
      ${i > 0 ? `<button class="btn ghost" type="button" data-wnav="back">Zurück</button>` : `<button class="btn ghost" type="button" data-wnav="close">Abbrechen</button>`}
      <span class="btnrow">${showVal(step) ? "" : `<button class="btn ghost" type="button" data-wnav="next">Weiß ich nicht</button>`}<button class="btn" type="button" data-wnav="next">Weiter</button></span>
    </div>
  </section>`;
}

/**
 * Fortschrittsbalken (HTML).
 * @param n erledigt
 * @param of gesamt
 * @param label Beschriftung
 */
export function bar(n, of, label) {
  return `<div class="stepper"><div class="meta"><span>${esc(label)}</span><span>${Math.round((n / of) * 100)} %</span></div><div class="bar"><i style="width:${Math.round((n / of) * 100)}%"></i></div></div>`;
}

function vhpSummary() {
  const c = vhpCalc(),
    v = Z.S.vhp;
  return `<div class="calc">
     <div><span>Noch verfügbar vom Jahresbetrag</span><b>${eur(c.rest, 2)}</b></div>
     ${v.ersatz === "angehoerig" ? `<div><span>Höchstens für Angehörige (2 × Pflegegeld)</span><b>${eur(c.cap, 2)}</b></div>` : ""}
     ${c.pflege ? `<div><span>Ersatzpflege${c.gekappt ? " (auf Höchstbetrag gekürzt)" : ""}</span><b>${eur(c.pflege, 2)}</b></div>` : ""}
     ${c.fahrt ? `<div><span>Fahrtkosten (${eur(KM_SATZ, 2)} pro km)</span><b>${eur(c.fahrt, 2)}</b></div>` : ""}
     ${c.verd ? `<div><span>Verdienstausfall</span><b>${eur(c.verd, 2)}</b></div>` : ""}
     <div class="tot"><span>Voraussichtlich bekommt ihr</span><b>${c.total ? eur(c.total, 2) : "–"}</b></div></div>
     <p class="small muted">${v.art === "stunden" ? "Weil es nur stundenweise war, läuft das Pflegegeld ungekürzt weiter." : "In dieser Zeit gibt es das halbe Pflegegeld (am ersten und letzten Tag das volle)."}</p>`;
}

function viewDone(b) {
  const L = curLetter(b),
    r = RECIP[b.to](),
    docs = docsFor(b),
    st = Z.S.status[b.k] || "offen";
  const priv = b.k === "jahresbetrag" && ["angehoerig", "privat"].includes(Z.S.vhp.ersatz);
  return `<section class="panel wiz">
    <div class="wiztop"><button type="button" class="btn small ghost" data-wnav="back">← Angaben ändern</button><button type="button" class="btn small ghost" data-wnav="close">Zur Übersicht</button></div>
    <h2 class="wq">${ic("check")} Dein Antrag ist fertig</h2>
    <div class="btnrow big">
      <button class="btn" type="button" data-pdf="${b.k}">${ic("down")}Als PDF speichern</button>
      <button class="btn soft" type="button" data-copy="${b.k}">Text kopieren</button>
      ${r.mail ? `<a class="btn ghost" href="${mailto(b, r.mail)}" target="_blank" rel="noopener" data-act="mail-offen" data-k="${b.k}">Per E-Mail öffnen</a>` : ""}
      ${b.to !== FA ? `<a class="btn ghost" href="${gmailLink(b, r.mail)}" target="_blank" rel="noopener" data-act="mail-offen" data-k="${b.k}">${ic("mail")}In Gmail öffnen</a>` : ""}
    </div>
    ${b.to !== FA ? `<p class="notice info" id="pdfhinweis">${ic("info")}<span><strong>Per E-Mail? Dann das PDF anhängen.</strong> Der Antragstext steht schon in der E-Mail. Tippe vorher auf „Als PDF speichern“ und hänge das PDF und die Unterlagen in der E-Mail an (Büroklammer).${r.mail ? "" : " Die E-Mail-Adresse der Kasse steht auf ihrer Webseite oder auf ihren Briefen."}</span></p>` : ""}
    <div class="paper"><p class="subj">${esc(L.subject)}</p><p>${esc(L.body)}</p></div>
    ${/\[[^\]]+\]/.test(L.body) ? `<p class="notice">${ic("alert")}<span>Stellen in [eckigen Klammern] bitte vor dem Abschicken von Hand ausfüllen oder oben unter „Angaben ändern“ nachtragen.</span></p>` : ""}
    <h3>So schickst du ihn ab</h3>
    <ol class="howsend">
      <li><strong>PDF ausdrucken und unterschreiben.</strong> Oder den Text in die App oder das Online-Postfach der Kasse kopieren.</li>
      ${docs.length ? `<li><strong>Diese Unterlagen beilegen:</strong><ul class="checks">${docs.map((c, j) => `<li><label><input type="checkbox" data-check="${b.k}:${j}" ${Z.S.checks[b.k + ":" + j] ? "checked" : ""}><span>${esc(c)}</span></label></li>`).join("")}</ul>${priv ? `<button class="btn small soft mt-8" type="button" data-act="vhp-quittung">${ic("down")}${Z.S.vhp.ersatz === "angehoerig" ? "Bestätigung" : "Quittung"} zum Unterschreiben (PDF)</button>` : ""}</li>` : ""}
      <li><strong>Abschicken an:</strong> ${esc([r.name, empfAdresse(b.to).strasse, empfAdresse(b.to).ort].filter(Boolean).join(", "))}.<br><span class="small muted">${esc(r.hint)}</span>${r.mail ? `<br><span class="small">E-Mail: <code>${esc(r.mail)}</code></span>` : ""}</li>
      <li><strong>Hier abhaken, wenn es raus ist.</strong> Wir erinnern dich in 4 Wochen, falls noch keine Antwort da ist.</li>
    </ol>
    ${st === "offen" ? `<button class="btn big" type="button" data-act="sent" data-k="${b.k}">${ic("check")}Ich habe den Antrag abgeschickt</button>` : `<p class="notice good">${ic("check")}<span>Abgeschickt${Z.S.sent && Z.S.sent[b.k] ? " am " + deD(parseIso(Z.S.sent[b.k])) : ""}. Status: ${esc(st)}.</span></p>`}
    <details><summary class="small">Text selbst ändern (für Geübte)</summary>
      <div class="field mt-10"><input type="text" data-sub="${b.k}" value="${esc(L.subject)}" aria-label="Betreff"><textarea data-tx="${b.k}" aria-label="Antragstext">${esc(L.body)}</textarea>
      ${Z.S.texte[b.k] != null ? `<button class="btn small ghost" type="button" data-resettx="${b.k}">Änderungen verwerfen</button>` : ""}</div>
    </details>
  </section>`;
}
