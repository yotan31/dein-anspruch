// Startseite für alle, die noch nicht angemeldet sind: was die App kann, wie es geht, häufige Fragen.
import { BETRAEGE } from "../../config/betraege.js";
import { faqHTML } from "../components/fragen.js";
import { ic } from "../symbole.js";

/**
 * Kopf der Startseite: wie mit den Daten umgegangen wird. Wer hier Angaben zu Pflege und Gesundheit macht,
 * soll das zuerst sehen. Jede Aussage muss mit site/datenschutz.html übereinstimmen.
 */
function datenschutzKarte() {
  const punkte = [
    "Gespeichert in Frankfurt am Main (EU)",
    "Keine Werbung, keine Analyse-Dienste, keine Cookies",
    "Wir verkaufen keine Daten",
    "Du kannst alles jederzeit selbst löschen",
    "Ohne Vollmacht: Du schickst die Anträge selbst ab",
  ];
  return `<aside class="lp-daten" aria-labelledby="lp-daten-titel">
    <h2 id="lp-daten-titel">${ic("lock")}So gehen wir mit deinen Daten um</h2>
    <ul>${punkte.map((t) => `<li>${ic("check")}<span>${t}</span></li>`).join("")}</ul>
    <a href="datenschutz.html">Datenschutzerklärung lesen</a>
  </aside>`;
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
      <h1>Pflegeleistungen prüfen und beantragen.</h1>
      <p class="lp-lead">Sieh in wenigen Minuten, welche Leistungen dir zustehen. Die App schreibt die Anträge vor, abschicken tust du sie selbst.</p>
      <div class="lp-cta">
        <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
        <button type="button" class="btn big ghost" data-act="r-start">${ic("form")}Pflegegrad einschätzen</button>
      </div>
      <ul class="lp-facts"><li>${ic("cal")}etwa 3 Minuten</li><li>${ic("list")}über 30 Leistungen</li><li>${ic("check")}Beträge 2026</li><li>${ic("euro")}kostenlos</li></ul>
    </div>
    ${datenschutzKarte()}
  </section>


  <section class="lp-sektion" id="so-gehts">
    <h2>In drei Schritten zu deinen Leistungen</h2>
    <ol class="lp-schritte">
      ${schritt(1, "Fragen beantworten", "Ein paar einfache Fragen zu Pflegegrad, Kasse und Wohnsituation.")}
      ${schritt(2, "Ansprüche sehen", "Die App zeigt, was dir zusteht, mit Beträgen für 2026.")}
      ${schritt(3, "Antrag abschicken", "Fertiger Brief als PDF oder E-Mail. Du prüfst und schickst selbst ab.")}
    </ol>
  </section>

  <section class="lp-sektion schnell" id="leistungen">
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

  <section class="lp-sektion" id="rechner">
    <div class="lp-rechner">
      <div>${ic("form")}<h2>Welcher Pflegegrad kommt in Frage?</h2><p>Der Pflegegrad-Rechner schätzt nach dem Punktesystem der Pflegekasse ein, welcher Pflegegrad möglich ist. Ohne Anmeldung, etwa 5 Minuten.</p></div>
      <button type="button" class="btn big" data-act="r-start">Pflegegrad einschätzen</button>
    </div>
  </section>

  <section class="lp-sektion fragen" id="fragen">
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
