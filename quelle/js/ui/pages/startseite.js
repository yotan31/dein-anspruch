// Startseite für alle, die noch nicht angemeldet sind: was die App kann, wie es geht, häufige Fragen.
import { BETRAEGE } from "../../config/betraege.js";
import { faqHTML } from "../components/fragen.js";
import { ic } from "../symbole.js";
import { today } from "../../utils/datum.js";
import { eur } from "../../utils/format.js";

/**
 * Kopf der Startseite: ein fertiger Antrag als Brief, so wie ihn die Pflegekasse bekommt.
 * Das ist das Besondere an der App, deshalb steht er dort, wo sonst ein Handy-Bild stünde.
 * Text wie im echten Antrag „Entlastungsbetrag“ (logic/antragstext.js), mit Beispiel-Angaben ausgefüllt.
 */
function briefBeispiel() {
  const offen = BETRAEGE.jahresbetrag + BETRAEGE.entlastung * 12 + BETRAEGE.verbrauch * 12;
  return `<figure class="lp-brief">
    <div class="brief" aria-hidden="true">
      <p class="brief-absender">Erika Muster, Lindenweg 4, 70499 Stuttgart</p>
      <p class="brief-an">An die Pflegekasse<br>Leistungsabteilung</p>
      <p class="brief-datum">Stuttgart, ${today()}</p>
      <p class="brief-betreff">Entlastungsbetrag – Erika Muster</p>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>für Erika Muster beantrage ich hiermit Leistungen aus dem Entlastungsbetrag nach § 45b SGB XI für die Haushaltshilfe im Oktober in Höhe von ${eur(BETRAEGE.entlastung, 2)}. Die Rechnung liegt bei. Bitte erstatten Sie den Betrag auf folgendes Konto:</p>
    </div>
    <figcaption>${ic("check")}<span>So sieht ein fertiger Antrag aus. Du prüfst ihn und schickst ihn selbst ab, als PDF oder E-Mail. Bei Pflegegrad 3 zu Hause sind zum Beispiel <b>${eur(offen)} im Jahr</b> noch offen.</span></figcaption>
  </figure>`;
}

/** Startseite für alle, die noch nicht angemeldet sind */
export function startseite() {
  const schritt = (n, t, u) =>
    `<li class="lp-schritt"><span class="lp-nr">${n}</span><strong>${t}</strong><span>${u}</span></li>`;
  const fuer = (i, t, punkte) =>
    `<div class="lp-fuer">${ic(i)}<h3>${t}</h3><ul>${punkte.map((p) => `<li>${ic("check")}<span>${p}</span></li>`).join("")}</ul></div>`;
  return `<div class="lp">
  <section class="lp-band lp-hero">
    <div class="lp-hero-text">
      <h1>Alle Hilfen, die dir und deiner Familie bei Pflege zustehen. Mit fertigen Anträgen.</h1>
      <p class="lp-lead">Bei Pflegegrad oder Schwerbehinderung bleiben oft mehrere tausend Euro im Jahr ungenutzt. „Dein Anspruch“ zeigt in wenigen Minuten, was offen ist, und schreibt die Anträge für dich vor.</p>
      <div class="lp-cta">
        <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
        <button type="button" class="btn big ghost" data-act="r-start">${ic("form")}Pflegegrad einschätzen</button>
      </div>
      <ul class="lp-facts"><li>${ic("cal")}etwa 3 Minuten</li><li>${ic("list")}über 30 Leistungen</li><li>${ic("check")}Beträge 2026</li></ul>
    </div>
    ${briefBeispiel()}
  </section>

  <section class="lp-trust" aria-label="Darauf kannst du dich verlassen">
    <div>${ic("shield")}<span><strong>Keine Vollmacht</strong>Du schickst die Anträge selbst ab</span></div>
    <div>${ic("euro")}<span><strong>Kostenlos</strong>Ohne Abo und ohne Werbung</span></div>
    <div>${ic("lock")}<span><strong>Daten in Deutschland</strong>Gespeichert in Frankfurt</span></div>
    <div>${ic("list")}<span><strong>Alles auf einen Blick</strong>Alle Ansprüche, nicht nur einer</span></div>
  </section>

  <section class="lp-sektion">
    <h2>In drei Schritten zu deinen Leistungen</h2>
    <ol class="lp-schritte">
      ${schritt(1, "Fragen beantworten", "Ein paar einfache Fragen zu Pflegegrad, Kasse und Wohnsituation.")}
      ${schritt(2, "Ansprüche sehen", "Die App zeigt, was dir zusteht, mit Beträgen für 2026.")}
      ${schritt(3, "Antrag abschicken", "Fertiger Brief als PDF oder E-Mail. Du prüfst und schickst selbst ab.")}
    </ol>
  </section>

  <section class="lp-sektion schnell">
    <h2>Was möchtest du beantragen?</h2>
    <div class="kacheln">${SCHNELL.map(([k, i, t, u]) => `<button type="button" class="kachel" data-act="schnell" data-ziel="${k}">${ic(i)}<strong>${t}</strong><span>${u}</span></button>`).join("")}</div>
  </section>

  <section class="lp-band lp-grau lp-sektion">
    <h2>Für alle, die sich um Pflege kümmern</h2>
    <div class="lp-fuer-liste">
      ${fuer("heart", "Pflegebedürftige", ["Pflegegrad beantragen oder erhöhen", "Pflegegeld, Pflegedienst, Hilfsmittel", "Hausnotruf und Wohnungsumbau"])}
      ${fuer("people", "Pflegende Angehörige", ["Entlastungsbetrag und Verhinderungspflege", "Rentenpunkte und Auszeit vom Job", "Belege sammeln, Fristen im Blick"])}
      ${fuer("access", "Menschen mit Schwerbehinderung", ["Schwerbehindertenausweis und Merkzeichen", "Steuer-Pauschbeträge", "Parkausweis, Wertmarke, Rundfunkbeitrag"])}
    </div>
  </section>

  <section class="lp-sektion">
    <div class="lp-rechner">
      <div>${ic("form")}<h2>Welcher Pflegegrad kommt in Frage?</h2><p>Der Pflegegrad-Rechner schätzt nach dem Punktesystem der Pflegekasse ein, welcher Pflegegrad möglich ist. Ohne Anmeldung, etwa 5 Minuten.</p></div>
      <button type="button" class="btn big" data-act="r-start">Pflegegrad einschätzen</button>
    </div>
  </section>

  <section class="lp-sektion fragen">
    <h2>Häufige Fragen</h2>
    ${faqHTML()}
  </section>

  <section class="lp-band lp-schluss">
    <h2>In wenigen Minuten weißt du, was dir zusteht.</h2>
    <p>Kostenlos, ohne Anmeldung, ohne Vollmacht.</p>
    <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
  </section>
  </div>`;
}

/** Schnellstart: häufige Anträge direkt von der Startseite aus */
const SCHNELL = [
  ["pg_antrag", "form", "Pflegegrad beantragen", "Erstantrag bei der Pflegekasse"],
  ["pg_hoch", "heart", "Pflegegrad erhöhen", "Wenn mehr Hilfe nötig ist"],
  ["technisch", "bell", "Hausnotruf & Hilfsmittel", "Notrufknopf, Pflegebett und mehr"],
  ["verbrauch", "case", "Pflegehilfsmittel", `Handschuhe, Desinfektion: bis ${BETRAEGE.verbrauch} € im Monat`],
  ["entlastung", "receipt", "Entlastungsbetrag", `${BETRAEGE.entlastung} € im Monat für Haushaltshilfe`],
  ["sb_antrag", "access", "Schwer\u00ADbehinderten\u00ADausweis", "Antrag beim Versorgungsamt"],
];
