import { BETRAEGE } from "../../config/betraege.js";
import { faqHTML } from "../components/fragen.js";
import { ic } from "../symbole.js";
import { eur } from "../../utils/format.js";

/** Beispiel-Vorschau der App im Kopf der Startseite: Beträge aus der Leistungsübersicht 2026 (Pflegegrad 3, Pflege zu Hause) */
function vorschau() {
  /** @type {[string, number][]} */
  const posten = [
    ["Verhinderungs- und Kurzzeitpflege", BETRAEGE.jahresbetrag],
    ["Entlastungsbetrag", BETRAEGE.entlastung * 12],
    ["Pflegehilfsmittel", BETRAEGE.verbrauch * 12],
  ];
  const summe = posten.reduce((a, [, v]) => a + v, 0),
    tone = ["var(--money)", "var(--money-2)", "var(--money-3)"];
  return `<div class="lp-vorschau" aria-hidden="true">
    <div class="lp-phone">
      <div class="lp-phone-kopf"><img src="logo.webp" width="30" height="30" alt=""><b>Dein Anspruch</b></div>
      <div class="lp-karte">
        <span class="lp-k-label">Noch offen pro Jahr</span>
        <b class="lp-summe">${eur(summe)}</b>
        <div class="lp-track">${posten.map(([, v], i) => `<i style="flex:${v};background:${tone[i]}"></i>`).join("")}</div>
        ${posten.map(([t, v]) => `<div class="lp-zeile"><span>${t}</span><b>${eur(v)}</b></div>`).join("")}
      </div>
      <div class="lp-karte lp-fertig">${ic("file")}<span><b>Antrag fertig</b><small>Entlastungsbetrag · PDF</small></span><span class="lp-haken">${ic("check")}</span></div>
      <div class="lp-karte lp-fertig">${ic("bell")}<span><b>Beratungsbesuch</b><small>Frist 31.12. · im Kalender</small></span></div>
    </div>
    <p class="lp-bsp">Beispiel: Pflegegrad 3, Pflege zu Hause</p>
  </div>`;
}

export /** Startseite für alle, die noch nicht angemeldet sind */
function startseite() {
  const schritt = (n, i, t, u) =>
    `<li class="lp-schritt"><span class="lp-nr">${n}</span>${ic(i)}<strong>${t}</strong><span>${u}</span></li>`;
  const fuer = (i, t, punkte) =>
    `<div class="lp-fuer">${ic(i)}<h3>${t}</h3><ul>${punkte.map((p) => `<li>${ic("check")}<span>${p}</span></li>`).join("")}</ul></div>`;
  return `<div class="lp">
  <section class="lp-band lp-hero">
    <div class="lp-hero-text">
      <p class="lp-eyebrow">${ic("shield")}Kostenlos · ohne Werbung · ohne Vollmacht</p>
      <h1>Alle Hilfen, die euch bei Pflege zustehen. Mit fertigen Anträgen.</h1>
      <p class="lp-lead">Bei Pflegegrad oder Schwerbehinderung bleiben oft mehrere tausend Euro im Jahr ungenutzt. „Dein Anspruch“ zeigt in wenigen Minuten, was offen ist, und schreibt die Anträge für dich vor.</p>
      <div class="lp-cta">
        <button type="button" class="btn big" data-act="au-guest">Jetzt kostenlos prüfen</button>
        <button type="button" class="btn big ghost" data-act="r-start">${ic("form")}Pflegegrad einschätzen</button>
      </div>
      <ul class="lp-facts"><li>${ic("cal")}etwa 3 Minuten</li><li>${ic("list")}über 30 Leistungen</li><li>${ic("check")}Beträge 2026</li></ul>
    </div>
    ${vorschau()}
  </section>

  <section class="lp-trust" aria-label="Darauf kannst du dich verlassen">
    <div>${ic("shield")}<span><strong>Keine Vollmacht</strong>Du schickst die Anträge selbst ab</span></div>
    <div>${ic("euro")}<span><strong>Kostenlos</strong>Ohne Abo und ohne Werbung</span></div>
    <div>${ic("lock")}<span><strong>Daten in Deutschland</strong>Gespeichert in Frankfurt</span></div>
    <div>${ic("list")}<span><strong>Alles auf einen Blick</strong>Alle Ansprüche, nicht nur einer</span></div>
  </section>

  <section class="lp-sektion">
    <p class="lp-kicker">So funktioniert's</p>
    <h2>In drei Schritten zu euren Leistungen</h2>
    <ol class="lp-schritte">
      ${schritt(1, "list", "Fragen beantworten", "Ein paar einfache Fragen zu Pflegegrad, Kasse und Wohnsituation.")}
      ${schritt(2, "euro", "Ansprüche sehen", "Die App zeigt, was euch zusteht, mit Beträgen für 2026.")}
      ${schritt(3, "file", "Antrag abschicken", "Fertiger Brief als PDF oder E-Mail. Ihr prüft und schickt selbst ab.")}
    </ol>
  </section>

  <section class="lp-sektion schnell">
    <p class="lp-kicker">Direkt starten</p>
    <h2>Was möchtest du beantragen?</h2>
    <div class="kacheln">${SCHNELL.map(([k, i, t, u]) => `<button type="button" class="kachel" data-act="schnell" data-ziel="${k}">${ic(i)}<strong>${t}</strong><span>${u}</span></button>`).join("")}</div>
  </section>

  <section class="lp-band lp-grau lp-sektion">
    <p class="lp-kicker">Für wen?</p>
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
    <p class="lp-kicker">Häufige Fragen</p>
    <h2>Noch Fragen?</h2>
    ${faqHTML()}
  </section>

  <section class="lp-band lp-schluss">
    <h2>In wenigen Minuten wisst ihr, was euch zusteht.</h2>
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
