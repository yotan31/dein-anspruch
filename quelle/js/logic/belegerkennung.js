// Erkennt in gelesenem Text (Foto oder PDF) Datum, Betrag und Art eines Belegs und gruppiert PDF-Seiten.
// Nur Vorschläge: Die Familie prüft jeden Wert, bevor er gespeichert wird.
import { KATS } from "./belege.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

const MONATE = {
  januar: 1,
  jan: 1,
  februar: 2,
  feb: 2,
  märz: 3,
  maerz: 3,
  mrz: 3,
  april: 4,
  apr: 4,
  mai: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  dezember: 12,
  dez: 12,
};

function mkDatum(y, m, d) {
  y = Number(y);
  if (y < 100) y += 2000;
  m = Number(m);
  d = Number(d);
  const now = new Date().getFullYear();
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31) || y < now - 6 || y > now + 1) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Alle Datumsangaben in einer Textzeile.
 * @param line Zeile
 */
export function datesIn(line) {
  const out = [];
  let m;
  const r1 = /(?<!\d)(\d{1,2})\s?\.\s?(\d{1,2})\s?\.\s?(\d{4}|\d{2})(?!\d)/g;
  while ((m = r1.exec(line))) out.push(mkDatum(m[3], m[2], m[1]));
  const r2 =
    /(?<!\d)(\d{1,2})\.?\s+(januar|jan|februar|feb|märz|maerz|mrz|april|apr|mai|juni|jun|juli|jul|august|aug|september|sept|sep|oktober|okt|november|nov|dezember|dez)\.?\s+(\d{4})/gi;
  while ((m = r2.exec(line))) out.push(mkDatum(m[3], MONATE[m[2].toLowerCase()], m[1]));
  const r3 = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g;
  while ((m = r3.exec(line))) out.push(mkDatum(m[1], m[2], m[3]));
  return out.filter(Boolean);
}

const BETRAG = /(?<![\d,.])(\d{1,3}(?:[.\s']\d{3})+|\d+),(\d{2})(?!\d)/g;

/**
 * Alle Geldbeträge in einer Textzeile (deutsche Schreibweise).
 * @param line Zeile
 */
export function amountsIn(line) {
  return [...line.matchAll(BETRAG)]
    .map((m) => Number(m[1].replace(/[.\s']/g, "") + "." + m[2]))
    .filter((v) => v > 0 && v < 100000);
}

const NICHT_DATUM = /geb\.|geboren|geburt|fällig|zahlbar bis|zahlungsziel|gültig bis|bis zum|überweisen bis|skonto/i;

/**
 * Wahrscheinlichstes Belegdatum: bevorzugt neben Wörtern wie „Rechnungsdatum“.
 * @param lines Zeilen des Belegs
 */
export function pickDate(lines) {
  const key =
    /(rechnungs|beleg|quittungs|ausstellungs|kauf|verordnungs|abgabe)?datum|\bvom\b|\brechnung\b|\bquittung\b|\bdatum\b/i;
  for (const l of lines) {
    if (key.test(l) && !NICHT_DATUM.test(l)) {
      const d = datesIn(l);
      if (d.length) return d[0];
    }
  }
  const count = {};
  let first = null;
  for (const l of lines) {
    if (NICHT_DATUM.test(l)) continue;
    for (const d of datesIn(l)) {
      count[d] = (count[d] || 0) + 1;
      first = first || d;
    }
  }
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 1 ? best[0] : first;
}

/**
 * Wahrscheinlichster Endbetrag: bevorzugt neben „Summe“, „Gesamt“ oder „Zuzahlung“.
 * @param lines Zeilen
 * @param kat Art des Belegs
 */
export function pickAmount(lines, kat) {
  const val = (i) => {
    const a = amountsIn(lines[i]);
    if (a.length) return a[a.length - 1];
    const n = lines[i + 1] ? amountsIn(lines[i + 1]) : [];
    return n.length ? n[0] : null;
  };
  if (KATS[kat] && KATS[kat].zz) {
    for (let i = lines.length - 1; i >= 0; i--)
      if (/(summe|gesamt)[^0-9]{0,20}zuzahlung|zuzahlung[^0-9]{0,12}(gesamt|summe)/i.test(lines[i])) {
        const v = val(i);
        if (v != null) return v;
      }
    const z = [];
    lines.forEach((l, i) => {
      if (/zuzahlung|eigenanteil/i.test(l)) {
        const v = val(i);
        if (v != null) z.push(v);
      }
    });
    if (z.length) return Math.round(z.reduce((s, v) => s + v, 0) * 100) / 100;
  }
  const tiers = [
    /gesamtbetrag|rechnungsbetrag|endbetrag|zahlbetrag|zu zahlen|zu überweisen|gesamtsumme|bruttobetrag|summe brutto|rechnungssumme|gesamt brutto/i,
    /\bgesamt\b|\bsumme\b|\btotal\b|\bbetrag\b|\beur\b|€/i,
  ];
  for (const re of tiers) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (re.test(lines[i]) && !/netto|mwst|ust|steuer|rabatt/i.test(lines[i])) {
        const v = val(i);
        if (v != null) return v;
      }
    }
  }
  const all = lines.flatMap(amountsIn);
  return all.length ? Math.max(...all) : null;
}

/** @type {[string,RegExp][]} */
const KAT_REGELN = [
  ["vhp", /verhinderungspflege|§\s?39\b|kurzzeitpflege|§\s?42\b|ersatzpflege/i],
  ["beratung", /beratungsbesuch|beratungseinsatz|§\s?37\s?abs\.?\s?3/i],
  [
    "entl",
    /entlastungsbetrag|§\s?45\s?b|45b|alltagshilfe|haushaltshilfe|haushaltsnahe|betreuungsleistung|unterstützung im alltag|unterstuetzung im alltag|alltagsbegleitung|tagespflege|nachbarschaftshilfe/i,
  ],
  ["pflhm", /pflegehilfsmittel|§\s?40\b|einmalhandschuh|bettschutzeinlage|pflegebox|desinfektion/i],
  ["fahrt", /krankenfahrt|krankentransport|taxi|fahrdienst|beförderung/i],
  [
    "heil",
    /physiotherap|krankengymnastik|ergotherap|logopäd|podolog|heilmittel|sanitätshaus|orthopädie|krankenhaus|klinik|stationär|hilfsmittel/i,
  ],
  ["apo", /apotheke|pzn|rezept|arzneimittel|verordnung/i],
  ["bescheid", /bescheid|widerspruch|sehr geehrte/i],
];

/**
 * Art des Belegs anhand typischer Wörter (Apotheke, Fahrt …); sonst „sonst“.
 * @param text Text des Belegs
 */
export function guessKat(text) {
  for (const [k, re] of KAT_REGELN) if (re.test(text)) return k;
  return "sonst";
}

function guessTitel(lines) {
  const org =
    /apotheke|pflegedienst|sozialstation|sanitätshaus|praxis|physiotherap|ergotherap|logopäd|taxi|klinik|krankenhaus|diakonie|caritas|\bdrk\b|\bawo\b|alltagshilfe|tagespflege|gmbh|\be\.\s?v\.|\bgbr\b|\bug\b|\bohg\b/i;
  const top = lines.slice(0, 14);
  const l =
    top.find((x) => org.test(x) && x.length < 70) ||
    top.find((x) => x.length >= 4 && x.length <= 50 && !/\d{3,}/.test(x) && !/rechnung|seite|datum/i.test(x));
  return l ? l.replace(/\s{2,}/g, " ").slice(0, 50) : "";
}

function rechnungsNr(text) {
  const m = text.match(/(rechnungs?|beleg|quittungs?)[-\s]*(nr|nummer|no)\.?\s*:?\s*([A-Z0-9][A-Z0-9/-]{2,})/i);
  return m ? m[3] : "";
}

/**
 * Fasst aufeinanderfolgende PDF-Seiten desselben Belegs zusammen.
 * @param pages gelesene Seiten
 */
export function groupPages(pages) {
  const groups = [];
  for (const p of pages) {
    const prev = groups[groups.length - 1];
    const nr = rechnungsNr(p.text),
      d = pickDate(p.lines),
      hasAmt = amountsIn(p.text).length > 0;
    const folge =
      /seite\s*([2-9]|[1-9]\d)\s*(von|\/|of)\s*\d+/i.test(p.text) && !/seite\s*1\s*(von|\/|of)/i.test(p.text);
    if (prev && (folge || (nr && nr === prev.nr) || (!d && !hasAmt && p.text.length > 0))) {
      prev.pages.push(p);
      continue;
    }
    groups.push({ nr, pages: [p] });
  }
  return groups.map((g, idx) => {
    const lines = g.pages.flatMap((p) => p.lines),
      text = lines.join("\n");
    const kat = guessKat(text),
      datum = pickDate(lines) || "",
      b = pickAmount(lines, kat);
    return {
      id: "bi" + idx,
      on: true,
      pages: g.pages.map((p) => p.i),
      thumb: g.pages[0].thumb,
      kat,
      datum,
      betrag: b == null ? "" : String(b.toFixed(2)).replace(".", ","),
      titel: guessTitel(g.pages[0].lines),
    };
  });
}
