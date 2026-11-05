import { LANGS, T } from "./uebersetzungen.js";
import { Z } from "../state/zustand.js";
import { ic } from "../ui/symbole.js";

const LIDX = { tr: 0, ru: 1, ar: 2, ti: 3 };

/** @type {[RegExp,string[]][]} */
const RX = [
  [/^Frage (\d+) von (\d+)$/, ["Soru $1 / $2", "Вопрос $1 из $2", "السؤال $1 من $2", "ሕቶ $1 ካብ $2"]],
  [/^Schritt (\d+) von (\d+)$/, ["Adım $1 / $2", "Шаг $1 из $2", "الخطوة $1 من $2", "ስጉምቲ $1 ካብ $2"]],
  [
    /^Voraussichtlich Pflegegrad (\d)$/,
    [
      "Tahmini bakım derecesi $1",
      "Предположительно степень ухода $1",
      "على الأرجح درجة الرعاية $1",
      "ተኽእሎ ደረጃ ክንክን $1",
    ],
  ],
  [/^Pflegegrad (\d)$/, ["Bakım derecesi $1", "Степень ухода $1", "درجة الرعاية $1", "ደረጃ ክንክን $1"]],
];

export function tr(s) {
  if (Z.LANG === "de" || !s) return s;
  const i = LIDX[Z.LANG];
  const k = s.trim();
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
  return out ? s.replace(k, out) : s;
}

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

export function langSelect() {
  return `<select class="langsel" id="langsel" aria-label="Sprache">${LANGS.map(([k, n]) => `<option value="${k}" ${Z.LANG === k ? "selected" : ""}>${n}</option>`).join("")}</select>`;
}

export function langNotice() {
  if (Z.LANG === "de") return "";
  const m = {
    tr: "Açıklamaların bir kısmı henüz Almanca. Başvurular her zaman Almanca kalır, çünkü kurumlar bunları Almanca istiyor.",
    ru: "Часть пояснений пока на немецком. Заявления всегда остаются на немецком, так как ведомствам они нужны на немецком.",
    ar: "بعض الشروحات لا تزال باللغة الألمانية. الطلبات تبقى دائمًا بالألمانية لأن الجهات الرسمية تطلبها كذلك.",
    ti: "ገለ መግለጺታት ገና ብጀርመንኛ እዮም። መመልከቲታት ኩሉ ግዜ ብጀርመንኛ እዮም፡ ምኽንያቱ ቤት ጽሕፈታት ብጀርመንኛ ይደልይዎም።",
  };
  return `<p class="notice info small">${ic("info")}<span>${m[Z.LANG]}</span></p>`;
}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function ladeSprache() {
  try {
    Z.LANG = JSON.parse(localStorage.getItem("da-lang") || '"de"') || "de";
  } catch (e) {}
}
