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
  [/^(\S+) €\/Jahr$/, ["$1 €/yıl", "$1 €/год", "$1 €/سنويًا", "", "$1 €/year"]],
  [/^bis (\S+) €\/Mon\.$/, ["ayda $1 €'ya kadar", "до $1 €/мес.", "حتى $1 €/شهريًا", "", "up to $1 €/month"]],
  [/^bis (\S+) €$/, ["$1 €'ya kadar", "до $1 €", "حتى $1 €", "", "up to $1 €"]],
  [
    /^(\S+) € Freibetrag$/,
    ["$1 € vergi indirimi", "$1 € налоговый вычет", "إعفاء ضريبي $1 €", "", "$1 € tax allowance"],
  ],
  [
    /^plus (\S+) € Steuerfreibeträge$/,
    [
      "artı $1 € vergi indirimi",
      "плюс $1 € налоговых вычетов",
      "إضافة إلى $1 € إعفاءات ضريبية",
      "",
      "plus $1 € in tax allowances",
    ],
  ],
  [
    /^(\d+) von (\d+) erledigt$/,
    ["$1 / $2 tamamlandı", "выполнено $1 из $2", "تم إنجاز $1 من $2", "", "$1 of $2 done"],
  ],
  [/^(\d+) von (\d+)$/, ["$1 / $2", "$1 из $2", "$1 من $2", "", "$1 of $2"]],
  [
    /^\+ (\d+) Punkte? ohne festen Betrag$/,
    [
      "+ sabit tutarı olmayan $1 madde",
      "+ ещё $1 без фиксированной суммы",
      "+ $1 بدون مبلغ ثابت",
      "",
      "+ $1 more without a fixed amount",
    ],
  ],
  [/^1 Beleg$/, ["1 fiş", "1 чек", "إيصال واحد", "", "1 receipt"]],
  [/^(\d+) Belege$/, ["$1 fiş", "чеков: $1", "$1 إيصالات", "", "$1 receipts"]],
  [/^(\d+) weitere$/, ["$1 tane daha", "ещё $1", "$1 أخرى", "", "$1 more"]],
  [/^(\d{4}) genutzt:$/, ["$1 yılında kullanılan:", "Использовано в $1:", "المستخدم في $1:", "", "Used in $1:"]],
  [/^(\S+) € im Monat$/, ["ayda $1 €", "$1 € в месяц", "$1 € شهريًا", "", "$1 € per month"]],
  [
    /^(\S+) € im Monat für Haushaltshilfe$/,
    [
      "ev işlerine yardım için ayda $1 €",
      "$1 € в месяц на помощь по хозяйству",
      "$1 € شهريًا للمساعدة المنزلية",
      "",
      "$1 € per month for household help",
    ],
  ],
  [
    /^Handschuhe, Desinfektion: bis (\S+) € im Monat$/,
    [
      "Eldiven, dezenfektan: ayda $1 €'ya kadar",
      "Перчатки, дезинфекция: до $1 € в месяц",
      "قفازات، مطهّر: حتى $1 € شهريًا",
      "",
      "Gloves, disinfectant: up to $1 € per month",
    ],
  ],
  [
    /^Beratungsbesuch für das (\d)\. Halbjahr (\d{4}): in (\d+) Tagen$/,
    [
      "$2 yılının $1. yarısı için danışma ziyareti: $3 gün içinde",
      "Консультационный визит за $1-е полугодие $2: через $3 дн.",
      "زيارة الاستشارة للنصف $1 من عام $2: بعد $3 يومًا",
      "",
      "Counselling visit for half-year $1/$2: in $3 days",
    ],
  ],
  [
    /^(\d+) einfache Fragen\. Nichts wird ohne dich abgeschickt\.$/,
    [
      "$1 basit soru. Sizin bilginiz olmadan hiçbir şey gönderilmez.",
      "Простых вопросов: $1. Без вас ничего не отправляется.",
      "$1 أسئلة بسيطة. لا يُرسل شيء بدونك.",
      "",
      "$1 simple questions. Nothing is sent without you.",
    ],
  ],
  [
    /^Eine einfache Frage\. Nichts wird ohne dich abgeschickt\.$/,
    [
      "Tek bir basit soru. Sizin bilginiz olmadan hiçbir şey gönderilmez.",
      "Один простой вопрос. Без вас ничего не отправляется.",
      "سؤال بسيط واحد. لا يُرسل شيء بدونك.",
      "",
      "One simple question. Nothing is sent without you.",
    ],
  ],
  [
    /^Abgeschickt am (\S+)\. Mit diesem Brief fragst du nach dem Stand\.$/,
    [
      "$1 tarihinde gönderildi. Bu mektupla durumu sorarsınız.",
      "Отправлено $1. Этим письмом вы запрашиваете, на какой стадии заявление.",
      "أُرسل في $1. بهذه الرسالة تستفسر عن حالة الطلب.",
      "",
      "Sent on $1. With this letter you ask about the status.",
    ],
  ],
  [
    /^Widerspruch möglich bis (\S+) \(noch (\d+) Tage\)\.$/,
    [
      "$1 tarihine kadar itiraz edilebilir ($2 gün kaldı).",
      "Возражение можно подать до $1 (осталось дней: $2).",
      "يمكن الاعتراض حتى $1 (متبقٍ $2 يومًا).",
      "",
      "Objection possible until $1 ($2 days left).",
    ],
  ],
  [
    /^Widerspruch möglich bis (\S+) \(noch 1 Tag\)\.$/,
    [
      "$1 tarihine kadar itiraz edilebilir (1 gün kaldı).",
      "Возражение можно подать до $1 (остался 1 день).",
      "يمكن الاعتراض حتى $1 (متبقٍ يوم واحد).",
      "",
      "Objection possible until $1 (1 day left).",
    ],
  ],
  [
    /^Widerspruch möglich bis (\S+) \(heute\)\.$/,
    [
      "$1 tarihine kadar itiraz edilebilir (bugün).",
      "Возражение можно подать до $1 (сегодня).",
      "يمكن الاعتراض حتى $1 (اليوم).",
      "",
      "Objection possible until $1 (today).",
    ],
  ],
  [
    /^Die Frist ist am (\S+) abgelaufen\. Lass dich beraten, ob ein neuer Antrag sinnvoll ist\.$/,
    [
      "Süre $1 tarihinde doldu. Yeni bir başvurunun mantıklı olup olmadığı konusunda danışın.",
      "Срок истёк $1. Проконсультируйтесь, имеет ли смысл новое заявление.",
      "انتهت المهلة في $1. استشر ما إذا كان تقديم طلب جديد مجديًا.",
      "",
      "The deadline passed on $1. Get advice on whether a new application makes sense.",
    ],
  ],
  [/^Budgets (\d{4})$/, ["$1 bütçeleri", "Бюджеты $1", "ميزانيات $1", "", "Budgets $1"]],
  [
    /^genutzt (\S+) € von (\S+) €$/,
    ["$2 € içinden $1 € kullanıldı", "использовано $1 € из $2 €", "مستخدم $1 € من $2 €", "", "used $1 € of $2 €"],
  ],
  [
    /^nicht genutzt: (\S+) €$/,
    ["kullanılmadı: $1 €", "не использовано: $1 €", "غير مستخدم: $1 €", "", "not used: $1 €"],
  ],
  [
    /^Kosten aus (\d{4}) bis 31\.12\.(\d{4}) einreichen$/,
    [
      "$1 masraflarını 31.12.$2 tarihine kadar gönderin",
      "Расходы за $1 подать до 31.12.$2",
      "قدّم تكاليف $1 حتى 31.12.$2",
      "",
      "Submit costs from $1 by 31.12.$2",
    ],
  ],
  [
    /^Rest verfällt am 30\.06\.(\d{4})$/,
    [
      "Kalan 30.06.$1 tarihinde sona erer",
      "Остаток сгорает 30.06.$1",
      "يسقط المتبقي في 30.06.$1",
      "",
      "Remainder expires on 30.06.$1",
    ],
  ],
  [/^So lief (\d{4})$/, ["$1 böyle geçti", "Итоги $1 года", "هكذا كان عام $1", "", "How $1 went"]],
  [/^(\S+) € genutzt$/, ["$1 € kullanıldı", "использовано $1 €", "استُخدم $1 €", "", "$1 € used"]],
  [
    /^blieben offen\.$/,
    ["kullanılmadan kaldı.", "остались неиспользованными.", "بقيت غير مستخدمة.", "", "were left unused."],
  ],
  [
    /^Für (\d{4}) sind keine Belege eingetragen\. Trag Rechnungen ein, dann zeigt die App hier, was genutzt wurde und was offen ist\.$/,
    [
      "$1 için fiş girilmemiş. Faturaları girin, uygulama burada neyin kullanıldığını ve neyin açık kaldığını gösterir.",
      "За $1 год чеки не внесены. Внесите счета, и приложение покажет здесь, что использовано и что осталось.",
      "لم تُسجَّل إيصالات لعام $1. أدخل الفواتير، وسيعرض التطبيق هنا ما استُخدم وما بقي متاحًا.",
      "",
      "No receipts entered for $1. Add invoices and the app will show here what was used and what is left.",
    ],
  ],
  [
    /^Für (\d{4}) stehen die Budgets wieder in voller Höhe zu\. Reste vom Entlastungsbetrag kannst du bis 30\.06\. nutzen, Kosten der Verhinderungspflege aus (\d{4}) bis 31\.12\. einreichen\.$/,
    [
      "$1 için bütçeler yeniden tam tutarda geçerlidir. Rahatlatma tutarının kalanını 30.06.'ya kadar kullanabilir, $2 vekâleten bakım masraflarını 31.12.'ye kadar gönderebilirsiniz.",
      "На $1 год бюджеты снова положены в полном объёме. Остаток суммы на разгрузку можно использовать до 30.06., расходы на замещающий уход за $2 год подать до 31.12.",
      "لعام $1 تُستحق الميزانيات مجددًا بالكامل. يمكنك استخدام بقية مبلغ التخفيف حتى 30.06.، وتقديم تكاليف الرعاية البديلة لعام $2 حتى 31.12.",
      "",
      "For $1 the budgets are available in full again. You can use what's left of the relief amount until 30.06. and submit respite care costs from $2 by 31.12.",
    ],
  ],
  [
    /^Geschätzt (\S+) von 100 Punkten\. Ab (\S+) Punkten gäbe es Pflegegrad (\d)\. Das ist eine Schätzung\. Die Entscheidung trifft der Medizinische Dienst bei einem Hausbesuch\.$/,
    [
      "Tahmini 100 üzerinden $1 puan. $2 puandan itibaren bakım derecesi $3 olurdu. Bu bir tahmindir. Kararı Tıbbi Hizmet bir ev ziyaretinde verir.",
      "Оценка: $1 из 100 баллов. С $2 баллов была бы степень ухода $3. Это лишь оценка. Решение принимает Медицинская служба при визите на дом.",
      "التقدير: $1 من 100 نقطة. ابتداءً من $2 نقطة تكون درجة الرعاية $3. هذا تقدير فقط. القرار تتخذه الخدمة الطبية خلال زيارة منزلية.",
      "",
      "Estimated $1 of 100 points. From $2 points it would be care level $3. This is an estimate. The Medical Service decides during a home visit.",
    ],
  ],
  [
    /^Geschätzt (\S+) von 100 Punkten\. Das ist eine Schätzung\. Die Entscheidung trifft der Medizinische Dienst bei einem Hausbesuch\.$/,
    [
      "Tahmini 100 üzerinden $1 puan. Bu bir tahmindir. Kararı Tıbbi Hizmet bir ev ziyaretinde verir.",
      "Оценка: $1 из 100 баллов. Это лишь оценка. Решение принимает Медицинская служба при визите на дом.",
      "التقدير: $1 من 100 نقطة. هذا تقدير فقط. القرار تتخذه الخدمة الطبية خلال زيارة منزلية.",
      "",
      "Estimated $1 of 100 points. This is an estimate. The Medical Service decides during a home visit.",
    ],
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
