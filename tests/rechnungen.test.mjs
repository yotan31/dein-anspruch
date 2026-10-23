// Prüft alle Berechnungen und Erkennungen einzeln, ohne Browser.
// Aufruf: node --test tests/
// Die erwarteten Werte sind aus Gesetz bzw. Leistungsübersicht 2026 abgeleitet, nicht aus dem Programm.
// Wenn sich Beträge ändern (00-betraege.js), müssen die Erwartungen hier mit angepasst werden.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ladeApp } from "./lade-app.mjs";

const neu = (heute, zustand) => {
  const run = ladeApp({ heute });
  if (zustand) run(`Object.assign(S, ${JSON.stringify(zustand)})`);
  return run;
};
const PFLEGE3 = { pg: "3", wohnen: "angehoerige", rolle: "angehoerig", bereiche: { pflege: true, sb: false } };

// ---------- Beträge ----------
test("Beträge 2026: Pflegegeld, Sachleistung, Entlastung, Jahresbetrag", () => {
  const run = neu();
  assert.deepEqual(run("[...BETRAEGE.pflegegeld]"), [0, 0, 347, 599, 800, 990]);
  assert.deepEqual(run("[...BETRAEGE.sachleistung]"), [0, 0, 796, 1497, 1859, 2299]);
  assert.equal(run("BETRAEGE.entlastung"), 131);
  assert.equal(run("BETRAEGE.jahresbetrag"), 3539);
  assert.equal(run("BETRAEGE.verbrauch"), 42);
  assert.equal(run("BETRAEGE.wohnumfeld"), 4180);
});
test("Beträge: alle Programmteile nutzen dieselben Werte", () => {
  const run = neu();
  assert.equal(run("PG.pflegegeld === BETRAEGE.pflegegeld && ENTLASTUNG === BETRAEGE.entlastung && JAHRESBETRAG === BETRAEGE.jahresbetrag && KM_SATZ === BETRAEGE.kmPauschale"), true);
  assert.equal(run("Object.isFrozen(BETRAEGE)"), true);
});
test("Beträge: steigen mit dem Pflegegrad", () => {
  const run = neu();
  for (const k of ["pflegegeld", "sachleistung", "tagespflege", "stationaer"]) {
    const a = run(`[...BETRAEGE.${k}]`);
    assert.equal(a.length, 6, k);
    for (let i = 2; i < 6; i++) assert.ok(a[i] >= a[i - 1], `${k} bei Pflegegrad ${i}`);
  }
});

// ---------- Pflegegrad aus Punkten (§ 15 Abs. 3 SGB XI) ----------
test("Pflegegrad aus Punkten: Grenzen nach § 15 SGB XI", () => {
  const run = neu();
  const faelle = [[0, 0], [12.49, 0], [12.5, 1], [26.99, 1], [27, 2], [47.49, 2], [47.5, 3], [69.99, 3], [70, 4], [89.99, 4], [90, 5], [100, 5]];
  for (const [p, g] of faelle) assert.equal(run(`pgAusPunkten(${p})`), g, `${p} Punkte`);
});

// ---------- Pflegegrad-Rechner ----------
test("Rechner: alles selbstständig → 0 Punkte, kein Pflegegrad", () => {
  const run = neu();
  const e = run(`rechnerErgebnis(RQ.map(()=>"0"))`);
  assert.equal(e.summe, 0); assert.equal(e.grad, 0);
});
test("Rechner: alles unselbstständig → 100 Punkte, Pflegegrad 5", () => {
  const run = neu();
  const e = run(`rechnerErgebnis(RQ.map(q=>q.o[q.o.length-1][0]))`);
  assert.equal(e.summe, 100); assert.equal(e.grad, 5);
  assert.deepEqual([e.gew[1], e.m23, e.gew[4], e.gew[5], e.gew[6]], [10, 15, 40, 20, 15]); // Gewichtung der Module
});
test("Rechner: nur Mobilität „überwiegend selbstständig“ → 5 gewichtete Punkte", () => {
  const run = neu();
  const e = run(`rechnerErgebnis(RQ.map(q=>q.m===1?"1":"0"))`);
  assert.equal(e.gew[1], 5); assert.equal(e.summe, 5); assert.equal(e.grad, 0);
});
test("Rechner: von Modul 2 und 3 zählt nur das höhere", () => {
  const run = neu();
  const e = run(`rechnerErgebnis(RQ.map(q=>q.m===2||q.m===3?q.o[q.o.length-1][0]:"0"))`);
  assert.equal(e.m23, 15); assert.equal(e.summe, 15);
});
test("Rechner: mehr Hilfebedarf ergibt nie weniger Punkte", () => {
  const run = neu();
  let vorher = -1;
  for (let stufe = 0; stufe < 4; stufe++) {
    const s = run(`rechnerErgebnis(RQ.map(q=>q.o[Math.min(${stufe},q.o.length-1)][0])).summe`);
    assert.ok(s >= vorher, `Stufe ${stufe}`); vorher = s;
  }
});

// ---------- Offene Ansprüche ----------
test("Ansprüche bei Pflegegrad 3 zu Hause: Jahreswerte", () => {
  const run = neu("2026-03-15", PFLEGE3);
  const v = k => run(`B.find(b=>b.k==="${k}").val()`);
  assert.equal(v("pflegegeld"), 599 * 12);
  assert.equal(v("entlastung"), 131 * 12);
  assert.equal(v("jahresbetrag"), 3539);
  assert.equal(v("verbrauch"), 42 * 12);
  assert.equal(run("sums().cash"), 599 * 12 + 131 * 12 + 3539 + 42 * 12);
});
test("Ansprüche: bereits genutzte Leistungen zählen nicht mehr als offen", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, genutzt: { pflegegeld: true } });
  assert.equal(run("sums().cash"), 131 * 12 + 3539 + 42 * 12);
});
test("Behinderten-Pauschbetrag nach GdB und Merkzeichen (§ 33b EStG)", () => {
  const frei = (sb, pg = "") => neu("2026-03-15", { pg, wohnen: "angehoerige", bereiche: { pflege: !!pg, sb: true }, sb: { status: "vorhanden", gdb: String(sb.gdb), mz: sb.mz || {}, arbeit: false, auto: false, grundsicherung: false } })(`B.find(b=>b.k==="behpausch").frei()`);
  assert.equal(frei({ gdb: 50 }), 1140);
  assert.equal(frei({ gdb: 55 }), 1140);   // abgerundet auf volle 10
  assert.equal(frei({ gdb: 100 }), 2840);
  assert.equal(frei({ gdb: 80, mz: { H: true } }), 7400);
  assert.equal(frei({ gdb: 0 }, "4"), 7400);
});
test("Rundfunkbeitrag: Ermäßigung und Befreiung", () => {
  const val = mz => neu("2026-03-15", { bereiche: { pflege: false, sb: true }, sb: { status: "vorhanden", gdb: "80", mz, arbeit: false, auto: false, grundsicherung: false } })(`B.find(b=>b.k==="rundfunk").val()`);
  assert.equal(val({ RF: true }), Math.round((18.36 - 6.12) * 12 * 100) / 100);
  assert.equal(val({ TBl: true }), Math.round(18.36 * 12 * 100) / 100);
});

// ---------- Verhinderungspflege ----------
test("Verhinderungspflege durch nahe Angehörige: höchstens doppeltes Pflegegeld", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, vhp: { ersatz: "angehoerig", stunden: "88", satz: "15", km: "", verdienst: "", verbraucht: "" } });
  const r = run("vhpCalc()");
  assert.equal(r.basis, 88 * 15);
  assert.equal(r.cap, 599 * 2);
  assert.equal(r.pflege, 1198); assert.equal(r.total, 1198); assert.equal(r.gekappt, true);
});
test("Verhinderungspflege: Fahrtkosten 20 Cent je km und Verdienstausfall kommen dazu", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, vhp: { ersatz: "angehoerig", stunden: "10", satz: "15", km: "100", verdienst: "200", verbraucht: "" } });
  const r = run("vhpCalc()");
  assert.equal(r.pflege, 150); assert.equal(r.fahrt, 20); assert.equal(r.verd, 200); assert.equal(r.total, 370);
});
test("Verhinderungspflege durch Pflegedienst: nie mehr als der restliche Jahresbetrag", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, vhp: { ersatz: "dienst", rechnung: "3.000,00", km: "", verdienst: "", verbraucht: "1.000" } });
  const r = run("vhpCalc()");
  assert.equal(r.rest, 2539); assert.equal(r.total, 2539);
});

// ---------- Zuzahlungen und Belastungsgrenze (§ 62 SGB V) ----------
test("Belastungsgrenze: 2 % vom Brutto, chronisch krank 1 %", () => {
  const run = neu("2026-03-15", { pg: "", bruttoJahr: { 2026: "20.000" }, chronisch: "nein" });
  run(`BEL=[{kat:"apo",jahr:2026,betrag:50},{kat:"heil",jahr:2026,betrag:30},{kat:"entl",jahr:2026,betrag:100},{kat:"apo",jahr:2025,betrag:99}]`);
  let z = run("zuz(2026)");
  assert.equal(z.sum, 80);           // nur Zuzahlungen des Jahres, kein Entlastungsbetrag
  assert.equal(z.grenze, 400);
  run(`S.chronisch="ja"`); z = run("zuz(2026)");
  assert.equal(z.pct, 1); assert.equal(z.grenze, 200);
});
test("Zahlen im deutschen Format werden richtig gelesen", () => {
  const run = neu();
  assert.equal(run(`numDE("1.234,56")`), 1234.56);
  assert.equal(run(`numDE("5,00")`), 5);
  assert.equal(run(`numDE("20.000")`), 20000);
  assert.equal(run(`numDE("")`), 0);
});

// ---------- Entlastungsbetrag-Konto ----------
test("Entlastungsbetrag: monatlich 131 €, Vorjahresrest bis 30. Juni nutzbar", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, entlSeit: "2025-01" });
  run(`BEL=[{kat:"entl",jahr:2025,datum:"2025-05-10",betrag:500},{kat:"entl",jahr:2026,datum:"2026-02-01",betrag:100}]`);
  const k = run("entlKonto()");
  assert.equal(k.bisHeute, 131 * 3);                   // Januar bis März 2026
  assert.equal(k.vorjOffen, 131 * 12 - 500 - 100);     // Vorjahresrest, Rechnung aus 2026 zuerst damit verrechnet
  assert.equal(k.frei, 131 * 3 + (131 * 12 - 500 - 100));
});
test("Entlastungsbetrag: nach dem 30. Juni ist der Vorjahresrest verfallen", () => {
  const run = neu("2026-07-15", { ...PFLEGE3, entlSeit: "2025-01" });
  run(`BEL=[]`);
  assert.equal(run("entlKonto().vorjOffen"), 0);
});

// ---------- Fristen ----------
test("Widerspruchsfrist: ein Monat ab Eingang des Bescheids", () => {
  const run = neu("2026-03-15", { ...PFLEGE3, bescheid: { pg: "2", punkte: "44,5", eingang: "2026-03-10" } });
  const b = run("bescheidInfo()");
  assert.equal(run("isoD(bescheidInfo().frist)"), "2026-04-10");
  assert.equal(b.g, 2); assert.equal(b.next, 47.5); assert.equal(b.fehlt, 3); assert.equal(b.knapp, true);
});
test("Beratungsbesuch: Pflicht je Halbjahr bei Pflegegeld", () => {
  const run = neu("2026-03-15", PFLEGE3);
  const d = run(`deadlines().find(x=>x.k==="beratung")`);
  assert.ok(d, "Frist fehlt");
  assert.equal(run(`isoD(deadlines().find(x=>x.k==="beratung").d)`), "2026-06-30");
  run(`S.termine.besuche=[{d:"2026-02-01"}]`);
  assert.equal(run(`isoD(deadlines().find(x=>x.k==="beratung").d)`), "2026-12-31"); // erledigt → nächstes Halbjahr
});

// ---------- Bescheid lesen ----------
test("Bescheid: Pflegegrad, Punkte und Datum werden erkannt", () => {
  const run = neu();
  const r = run(`parseBescheid("Bescheid vom 12.09.2026 ... Sie erhalten Pflegegrad 2. Gesamtpunkte: 44,25. Empfehlung: Duschstuhl und Pflegebett")`);
  assert.equal(r.pg, "2"); assert.equal(r.punkte, "44,25"); assert.equal(r.datum, "2026-09-12");
  assert.ok(r.hinweise.some(h => h.startsWith("Pflegebett")));
});
test("Bescheid: Ablehnung wird erkannt", () => {
  const run = neu();
  assert.equal(run(`parseBescheid("Ihr Antrag wird abgelehnt, da keine Pflegebedürftigkeit vorliegt.").art`), "ablehnung");
});

// ---------- Rechnungen in PDFs erkennen ----------
test("Rechnung: Datumsformate", () => {
  const run = neu();
  assert.deepEqual(run(`datesIn("Datum: 14.03.2024")`), ["2024-03-14"]);
  assert.deepEqual(run(`datesIn("vom 3. Februar 2026")`), ["2026-02-03"]);
  assert.deepEqual(run(`datesIn("2025-06-12")`), ["2025-06-12"]);
  assert.deepEqual(run(`datesIn("Tel. 0711 12.34.567")`), []);  // keine Telefonnummern als Datum
});
test("Rechnung: Rechnungsdatum geht vor Fälligkeit und Geburtsdatum", () => {
  const run = neu();
  const lines = ["Patient geb. 25.12.1964", "Zahlbar bis 14.02.2025", "Rechnungsdatum: 31.01.2025"];
  assert.equal(run(`pickDate(${JSON.stringify(lines)})`), "2025-01-31");
});
test("Rechnung: Beträge und Gesamtbetrag", () => {
  const run = neu();
  assert.deepEqual(run(`amountsIn("Summe 1.234,56 EUR, Rabatt 3,00")`), [1234.56, 3]);
  assert.equal(run(`pickAmount(["Haushaltshilfe 4 Std. 130,00","MwSt 0,00","Gesamtbetrag: 130,00 EUR"],"entl")`), 130);
  assert.equal(run(`pickAmount(["Netto 100,00","Rechnungsbetrag 682,00 EUR"],"vhp")`), 682);
});
test("Rechnung: bei Apotheken zählt die Zuzahlung, nicht der Gesamtbetrag", () => {
  const run = neu();
  assert.equal(run(`pickAmount(["Ibuprofen Zuzahlung 5,00","Metformin Zuzahlung 5,00","Gesamtbetrag 23,47"],"apo")`), 10);
  assert.equal(run(`pickAmount(["Zuzahlung 5,00","Zuzahlung 5,00","Summe Zuzahlung: 10,00"],"apo")`), 10);
});
test("Rechnung: Art wird an Stichworten erkannt", () => {
  const run = neu();
  const k = t => run(`guessKat(${JSON.stringify(t)})`);
  assert.equal(k("Löwen-Apotheke PZN 0123"), "apo");
  assert.equal(k("Leistungen nach § 45b SGB XI"), "entl");
  assert.equal(k("Verhinderungspflege nach § 39"), "vhp");
  assert.equal(k("Taxi Müller Krankenfahrt"), "fahrt");
  assert.equal(k("Physiotherapie Lindner"), "heil");
  assert.equal(k("Einmalhandschuhe Pflegebox"), "pflhm");
  assert.equal(k("Irgendein Laden"), "sonst");
});
test("Rechnung: Folgeseite wird an die Rechnung davor gehängt", () => {
  const run = neu();
  const pages = [
    { i: 1, lines: ["Pflegedienst Mobil", "Rechnung Nr. PD-77", "Datum 12.06.2025", "Seite 1 von 2"] },
    { i: 2, lines: ["Rechnung Nr. PD-77", "Seite 2 von 2", "Rechnungsbetrag 682,00 EUR"] },
    { i: 3, lines: ["Taxi Müller", "Quittung vom 03.02.2026", "Eigenanteil 10,00 €"] },
  ].map(p => ({ ...p, text: p.lines.join("\n"), thumb: "" }));
  const g = run(`groupPages(${JSON.stringify(pages)}).map(x=>({pages:x.pages,datum:x.datum,betrag:x.betrag,kat:x.kat}))`);
  assert.equal(g.length, 2);
  assert.deepEqual(g[0].pages, [1, 2]); assert.equal(g[0].betrag, "682,00"); assert.equal(g[0].datum, "2025-06-12");
  assert.deepEqual(g[1].pages, [3]); assert.equal(g[1].kat, "fahrt"); assert.equal(g[1].betrag, "10,00");
});

// ---------- Nur passende Leistungen je Pflegegrad ----------
test("Pflegegrad 2: keine Leistungen, die erst ab Pflegegrad 3 gelten", () => {
  const run = neu(undefined, { ...PFLEGE3, pg: "2" });
  const k = run("applicable().map(b=>b.k)");
  for (const x of ["fahrten", "chroniker"]) assert.ok(!k.includes(x), x);
  assert.ok(k.includes("pflegegeld") && k.includes("pg_hoch"));
});
test("Pflegegrad 1: kein Pflegegeld, keine Sachleistung, keine Verhinderungspflege", () => {
  const run = neu(undefined, { ...PFLEGE3, pg: "1" });
  const k = run("applicable().map(b=>b.k)");
  for (const x of ["pflegegeld", "sachleistung", "jahresbetrag", "tagespflege"]) assert.ok(!k.includes(x), x);
  assert.ok(k.includes("entlastung"));
});
test("Krankenfahrten: Text passt zum Pflegegrad", () => {
  const t = (pg) => neu(undefined, { ...PFLEGE3, pg })("txt(B.find(b=>b.k==='fahrten').short)");
  assert.match(t("3"), /Genehmigung beantragen/);
  assert.match(t("4"), /als genehmigt/);
});
