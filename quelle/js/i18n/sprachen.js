// Übersetzung der Oberfläche zur Laufzeit: tr() für einzelne Texte, applyI18n() für schon gezeichnete Teile.
// Anträge bleiben bewusst Deutsch, weil Kassen und Ämter sie auf Deutsch erwarten.
import { LANGS, T } from "./uebersetzungen.js";
import { Z } from "../state/zustand.js";

/** Stelle der Sprache in jedem Eintrag von T (Englisch kam zuletzt dazu, deshalb hinten) */
const LIDX = { tr: 0, ru: 1, ar: 2, ti: 3, en: 4 };

/** @type {[RegExp,string[]][]} */
const RX = [
  [
    /^Frage (\d+) von (\d+)$/,
    ["Soru $1 / $2", "Вопрос $1 из $2", "السؤال $1 من $2", "ሕቶ $1 ካብ $2", "Question $1 of $2"],
  ],
  [/^Schritt (\d+) von (\d+)$/, ["Adım $1 / $2", "Шаг $1 из $2", "الخطوة $1 من $2", "ስጉምቲ $1 ካብ $2", "Step $1 of $2"]],
  [
    /^Voraussichtlich Pflegegrad (\d)$/,
    [
      "Tahmini bakım derecesi $1",
      "Предположительно степень ухода $1",
      "على الأرجح درجة الرعاية $1",
      "ተኽእሎ ደረጃ ክንክን $1",
      "Likely care level $1",
    ],
  ],
  // Bisher nur Englisch (leere Stellen: deutscher Text bleibt)
  [/^(\S+) €\/Jahr$/, ["", "", "", "", "$1 €/year"]],
  [/^bis (\S+) €\/Mon\.$/, ["", "", "", "", "up to $1 €/month"]],
  [/^bis (\S+) €$/, ["", "", "", "", "up to $1 €"]],
  [/^(\S+) € Freibetrag$/, ["", "", "", "", "$1 € tax allowance"]],
  [/^plus (\S+) € Steuerfreibeträge$/, ["", "", "", "", "plus $1 € in tax allowances"]],
  [/^(\d+) von (\d+)$/, ["", "", "", "", "$1 of $2"]],
  [/^\+ (\d+) Punkte? ohne festen Betrag$/, ["", "", "", "", "+ $1 more without a fixed amount"]],
  [/^1 Beleg$/, ["", "", "", "", "1 receipt"]],
  [/^(\d+) Belege$/, ["", "", "", "", "$1 receipts"]],
  [/^(\d+) weitere$/, ["", "", "", "", "$1 more"]],
  [/^(\d{4}) genutzt:$/, ["", "", "", "", "Used in $1:"]],
  [/^(\S+) € im Monat$/, ["", "", "", "", "$1 € per month"]],
  [/^(\S+) € im Monat für Haushaltshilfe$/, ["", "", "", "", "$1 € per month for household help"]],
  [/^Handschuhe, Desinfektion: bis (\S+) € im Monat$/, ["", "", "", "", "Gloves, disinfectant: up to $1 € per month"]],
  [
    /^Beratungsbesuch für das (\d)\. Halbjahr (\d{4}): in (\d+) Tagen$/,
    ["", "", "", "", "Counselling visit for half-year $1/$2: in $3 days"],
  ],
  [/^Pflegegrad (\d)$/, ["Bakım derecesi $1", "Степень ухода $1", "درجة الرعاية $1", "ደረጃ ክንክን $1", "Care level $1"]],
];

/**
 * Übersetzt einen deutschen Text in die gewählte Sprache; ohne Übersetzung bleibt er Deutsch.
 * @param s deutscher Text
 */
export function tr(s) {
  if (Z.LANG === "de" || !s) return s;
  const i = LIDX[Z.LANG];
  // Zeilenumbrüche und Einrückung aus index.html zählen nicht: „a\n   b“ wird wie „a b“ nachgeschlagen
  const roh = s.trim(),
    k = roh.replace(/\s+/g, " ");
  if (!k) return s;
  let out = T[k] && T[k][i];
  if (!out) {
    for (const [re, arr] of RX) {
      if (re.test(k)) {
        out = k.replace(re, arr[i]);
        break;
      }
    }
  }
  return out ? s.replace(roh, out) : s;
}

/**
 * Übersetzt alle Texte in einem schon gezeichneten Bereich und stellt Sprache und Schreibrichtung (Arabisch: rechts nach links) ein.
 * @param root Bereich der Seite
 */
export function applyI18n(root) {
  document.documentElement.lang = Z.LANG;
  document.documentElement.dir = Z.LANG === "ar" ? "rtl" : "ltr";
  if (Z.LANG === "de" || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      (n.parentNode && /^(SCRIPT|STYLE|TEXTAREA|CODE)$/.test(n.parentNode.nodeName)) ||
      (n.parentNode.closest && n.parentNode.closest(".paper"))
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    const v = n.nodeValue;
    const t = tr(v);
    if (t !== v) n.nodeValue = t;
  }
}

/**
 * Wechselt die Sprache der Oberfläche und merkt sie sich auf dem Gerät.
 * @param lang Kürzel, z. B. "en"
 */
export function waehleSprache(lang) {
  if (!LANGS.some(([k]) => k === lang)) return;
  Z.LANG = lang;
  try {
    localStorage.setItem("da-lang", JSON.stringify(lang));
  } catch (e) {}
}

/** Hinweis in der gewählten Sprache, dass Anträge Deutsch bleiben (nur Text); auf Deutsch leer. */
export function langNotice() {
  if (Z.LANG === "de") return "";
  const m = {
    en: "Some explanations are still in German. Applications always stay in German because the authorities require them in German.",
    tr: "Açıklamaların bir kısmı henüz Almanca. Başvurular her zaman Almanca kalır, çünkü kurumlar bunları Almanca istiyor.",
    ru: "Часть пояснений пока на немецком. Заявления всегда остаются на немецком, так как ведомствам они нужны на немецком.",
    ar: "بعض الشروحات لا تزال باللغة الألمانية. الطلبات تبقى دائمًا بالألمانية لأن الجهات الرسمية تطلبها كذلك.",
    ti: "ገለ መግለጺታት ገና ብጀርመንኛ እዮም። መመልከቲታት ኩሉ ግዜ ብጀርመንኛ እዮም፡ ምኽንያቱ ቤት ጽሕፈታት ብጀርመንኛ ይደልይዎም።",
  };
  return m[Z.LANG] || "";
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function ladeSprache() {
  try {
    Z.LANG = JSON.parse(localStorage.getItem("da-lang") || '"de"') || "de";
  } catch (e) {}
}
