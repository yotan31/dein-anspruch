// Karten zu den Jahresbudgets: was von Verhinderungspflege und Pflegehilfsmitteln noch frei ist, und im
// ersten Quartal der Rückblick auf das Vorjahr. Der Entlastungsbetrag hat seine eigene, genauere Karte.
import { rueckblick, rueckblickFaellig, toepfe } from "../../logic/toepfe.js";
import { ic, infoBtn } from "../symbole.js";
import { eur } from "../../utils/format.js";

/**
 * Balken mit genutzt / Budget. Pflegehilfsmittel verfallen jeden Monat, deshalb dort „nicht genutzt“ statt „noch frei“.
 * @param {{k: string, t: string, budget: number, genutzt: number, rest: number, verfall: string}} x
 */
function topf(x) {
  const pct = x.budget ? Math.min(100, (x.genutzt / x.budget) * 100) : 0;
  return `<div class="topf">
    <div class="nums"><strong>${x.t}</strong>${x.k === "pflhm" ? `<span class="muted">nicht genutzt: ${eur(x.rest)}</span>` : `<span>noch frei: <b class="betrag-fett">${eur(x.rest)}</b></span>`}</div>
    <div class="track"><i style="width:${pct}%"></i></div>
    <div class="nums small muted"><span>genutzt ${eur(x.genutzt, 2)} von ${eur(x.budget)}</span><span>${x.verfall}</span></div>
  </div>`;
}

/** Karte „Budgets dieses Jahr“ für Verhinderungs-/Kurzzeitpflege und Pflegehilfsmittel; leer ohne Anspruch. */
export function toepfeCard() {
  const L = toepfe().filter((x) => x.k !== "entl");
  if (!L.length) return "";
  return `<section class="panel mini">
    <div class="mini-head">${ic("euro")}<div><div class="titelzeile"><h3>Budgets ${new Date().getFullYear()}</h3>${infoBtn("Budgets", "Diese Beträge stehen jedes Jahr neu zu. Was nicht genutzt wird, verfällt.\n\nDie App rechnet mit deinen Belegen: Trag Rechnungen als „Verhinderungs- & Kurzzeitpflege“ oder „Pflegehilfsmittel“ ein.")}</div></div></div>
    ${L.map(topf).join("")}
  </section>`;
}

/** Rückblick auf das Vorjahr (nur im ersten Quartal, bis er weggeklickt wird). */
export function rueckblickCard() {
  if (!rueckblickFaellig()) return "";
  const r = rueckblick();
  return `<section class="panel rueckblick">
    <div class="section-title"><h2>${ic("cal")} So lief ${r.jahr}</h2><button type="button" class="linkbtn" data-act="rueckblick-weg">Ausblenden</button></div>
    ${
      r.ohneBelege
        ? `<p class="muted">Für ${r.jahr} sind keine Belege eingetragen. Trag Rechnungen ein, dann zeigt die App hier, was genutzt wurde und was offen ist.</p>`
        : `<p><strong>${eur(r.genutzt, 2)} genutzt</strong>, <strong>${eur(r.offen)}</strong> blieben offen.</p>`
    }
    ${r.toepfe.map(topf).join("")}
    <p class="small muted">Für ${r.jahr + 1} stehen die Budgets wieder in voller Höhe zu. Reste vom Entlastungsbetrag kannst du bis 30.06. nutzen, Kosten der Verhinderungspflege aus ${r.jahr} bis 31.12. einreichen.</p>
  </section>`;
}
