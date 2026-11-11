// Pflegegrad-Rechner als Seite: Fragen, Fortschritt und Ergebnis.
import { ENTLASTUNG } from "../../config/stammdaten.js";
import { PG_GRENZEN } from "../../logic/bescheid.js";
import { pg, istKind } from "../../logic/lage.js";
import { MOD, RQ, rechnerErgebnis } from "../../logic/rechner.js";
import { Z } from "../../state/zustand.js";
import { bar } from "./assistent.js";
import { render, scrollTop } from "../render.js";
import { ic } from "../symbole.js";
import { esc } from "../../utils/format.js";

/** Startet den Pflegegrad-Rechner von vorn. */
export function startRechner() {
  Z.RECHNER = { i: 0, a: [] };
  render();
  scrollTop();
}

/** Aktuelle Frage oder Ergebnis des Rechners (HTML). */
export function viewRechner() {
  const R = Z.RECHNER,
    n = RQ.length;
  if (R.i >= n) {
    const e = rechnerErgebnis(R.a);
    const hat = (typeof Z.USER !== "undefined" && Z.USER) || (typeof Z.GUEST !== "undefined" && Z.GUEST);
    const aktuell = pg();
    const next = e.grad < 5 ? PG_GRENZEN[e.grad] : null;
    const bars = [
      [1, "Mobilität", 10, e.gew[1]],
      [23, "Verstehen / Verhalten", 15, e.m23],
      [4, "Selbstversorgung", 40, e.gew[4]],
      [5, "Krankheitsbedingte Hilfe", 20, e.gew[5]],
      [6, "Alltag und Kontakte", 15, e.gew[6]],
    ];
    return `<section class="panel wiz">
      <div class="wiztop"><button type="button" class="btn small ghost" data-act="r-close">Schließen</button><span class="small muted">Pflegegrad-Rechner</span></div>
      <h2 class="wq">${e.grad ? `Voraussichtlich Pflegegrad ${e.grad}` : "Voraussichtlich noch kein Pflegegrad"}</h2>
      ${istKind() && Z.S.kindAlter !== "jugend" ? `<p class="notice">${ic("alert")}<span>Für Kinder unter 11 Jahren nur ein grober Anhalt: Der Gutachter vergleicht mit gesunden Gleichaltrigen, das Ergebnis fällt hier zu hoch aus.</span></p>` : ""}
      <p class="whelp">${ic("info")}<span>Geschätzt ${String(e.summe.toFixed(1)).replace(".", ",")} von 100 Punkten.${next ? ` Ab ${String(next).replace(".", ",")} Punkten gäbe es Pflegegrad ${e.grad + 1}.` : ""} Das ist eine Schätzung. Die Entscheidung trifft der Medizinische Dienst bei einem Hausbesuch.</span></p>
      <div class="rbars">${bars.map(([k, l, mx, v]) => `<div><span>${l}</span><div class="track"><i style="width:${Math.round((v / mx) * 100)}%"></i></div><b>${String(v).replace(".", ",")}</b></div>`).join("")}</div>
      ${e.grad >= 1 && (!aktuell || e.grad > aktuell) ? `<p class="notice good">${ic("check")}<span>${aktuell ? `Das wäre höher als der jetzige Pflegegrad ${aktuell}. Ein Antrag auf Höherstufung kann sich lohnen.` : `Ein Antrag auf einen Pflegegrad kann sich lohnen. Ab Pflegegrad 1 gibt es schon ${ENTLASTUNG} € im Monat Entlastungsbetrag und mehr.`}</span></p>` : ""}
      <div class="btnrow big">${
        hat
          ? e.grad >= 1 && (!aktuell || e.grad > aktuell)
            ? `<button class="btn" type="button" data-act="r-antrag">${aktuell ? "Höherstufung beantragen" : "Pflegegrad beantragen"}</button>`
            : ""
          : `<button class="btn" type="button" data-act="r-konto">Antrag vorbereiten (kostenlos)</button>`
      }
        <button class="btn ghost" type="button" data-act="r-neu">Noch einmal</button></div>
      <div class="folge"><p><strong>Termin mit dem Gutachter?</strong> Mit deinen Antworten entsteht ein Blatt zum Ausdrucken: was du bereitlegst, worauf du achtest und wo Hilfe gebraucht wird.</p>
        <button class="btn small soft" type="button" data-act="gutachter-pdf">${ic("down")}Vorbereitung als PDF</button></div>
      <button class="linkbtn self-start" type="button" data-act="teilen">Rechner an Familie oder Freunde weiterempfehlen</button>
    </section>`;
  }
  const q = RQ[R.i];
  return `<section class="panel wiz">
    <div class="wiztop"><button type="button" class="btn small ghost" data-act="r-close">Schließen</button><span class="small muted">${MOD[q.m].n}</span></div>
    ${bar(R.i + 1, n, `Frage ${R.i + 1} von ${n}`)}
    ${R.i === 0 ? `<p class="small muted">Beantworte die Fragen so, wie es an einem normalen Tag ist, nicht an einem besonders guten.</p>` : ""}
    ${R.i === 0 && istKind() && Z.S.kindAlter !== "jugend" ? `<p class="notice info">${ic("people")}<span>Der Rechner ist für Erwachsene gemacht. Bei Kindern unter 11 Jahren vergleicht der Gutachter mit gesunden Gleichaltrigen. Das Ergebnis hier fällt deshalb zu hoch aus.</span></p>` : ""}
    <h2 class="wq">${esc(q.q)}</h2>
    <div class="choices big">${q.o.map(([v, t, s]) => `<label class="choice" for="rq-${v}"><input type="radio" id="rq-${v}" name="rq" data-rq="${v}" ${R.a[R.i] === v ? "checked" : ""}><span>${esc(t)}${s ? `<small>${esc(s)}</small>` : ""}</span></label>`).join("")}</div>
    <div class="nav big go">${R.i > 0 ? `<button class="btn ghost" type="button" data-act="r-back">Zurück</button>` : "<span></span>"}${R.a[R.i] != null ? `<button class="btn" type="button" data-act="r-next">Weiter</button>` : ""}</div>
  </section>`;
}
