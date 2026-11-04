import { Z } from "./zustand.js";
import { esc, eur } from "./01-grundlagen.js";
import { B, KK } from "./02-leistungen.js";
import { zuz } from "./10-fragebogen-und-fristen.js";
/* ---------- Icons ---------- */
const ICON={
 heart:"M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
 user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
 form:"M5 3h14v18H5z M9 8h6 M9 12h6 M9 16h3",
 building:"M5 21V5h14v16 M9 9h2 M13 9h2 M9 13h2 M13 13h2 M10 21v-4h4v4",
 cross:"M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z",
 access:"M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M6 8h12 M12 8v6 M9 21l3-7 3 7",
 case:"M4 8h16v11H4z M9 8V5h6v3 M4 13h16",
 receipt:"M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3",
 cal:"M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
 list:"M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
 camera:"M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
 file:"M6 3h8l4 4v14H6z M14 3v4h4",
 info:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01",
 alert:"M12 3l9 16H3z M12 10v4 M12 17h.01",
 check:"M5 12l4 4 10-10",
 down:"M12 4v11 M7 10l5 5 5-5 M5 20h14",
 plus:"M12 5v14 M5 12h14",
 bell:"M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 21h4",
 chev:"M9 6l6 6-6 6",
 shield:"M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M9 12l2 2 4-4",
 euro:"M17 6.5A6.5 6.5 0 1 0 17 17.5 M4 10h9 M4 14h9",
 lock:"M6 11h12v10H6z M8 11V8a4 4 0 0 1 8 0v3",
 mail:"M3 6h18v12H3z M3 7l9 6 9-6",
 pin:"M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
 home:"M4 11l8-7 8 7 M6 9.5V20h12V9.5 M10 20v-5h4v5",
 car:"M5 16V11l2-5h10l2 5v5 M5 16h14 M7.5 16v2 M16.5 16v2 M5 11h14 M8 13.5h.01 M16 13.5h.01",
 phone:"M8 3h8v18H8z M11 18h2",
 sun:"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
 book:"M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h9",
 box:"M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8",
 people:"M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0 M16 11a3 3 0 1 0 0-6 M21 20a6 6 0 0 0-4-5.7",
 card:"M3 6h18v12H3z M3 10h18 M7 15h4",
 tv:"M4 6h16v11H4z M9 21h6 M12 17v4",
 eye:"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
 shield2:"M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z",
 ext:"M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
 idee:"M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z",
};
export function ic(n, c="i") { return `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`; }
/* ---------- Illustrationen: ruhige Flächen in den Farben der App, passen sich dem dunklen Modus an ---------- */
const BILD={
 // Start: Unterlagen mit Haken, daneben ein Herz
 start:`<rect x="20" y="22" width="92" height="116" rx="10" stroke-width="2" style="fill:var(--paper-2);stroke:var(--line)"/>
  <rect x="34" y="12" width="92" height="116" rx="10" stroke-width="2" style="fill:var(--paper);stroke:var(--line)"/>
  <path d="M50 42l6 6 12-12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--money);fill:none"/>
  <rect x="76" y="38" width="36" height="8" rx="4" style="fill:var(--line)"/>
  <path d="M50 72l6 6 12-12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--money);fill:none"/>
  <rect x="76" y="68" width="30" height="8" rx="4" style="fill:var(--line)"/>
  <circle cx="58" cy="104" r="9" stroke-width="4" style="fill:none;stroke:var(--accent)"/>
  <rect x="76" y="98" width="36" height="8" rx="4" style="fill:var(--line)"/>
  <circle cx="146" cy="104" r="32" style="fill:var(--money-soft)"/>
  <path d="M146 123s-17-10.5-17-23a9.5 9.5 0 0 1 17-5.8 9.5 9.5 0 0 1 17 5.8c0 12.5-17 23-17 23z" style="fill:var(--money)"/>`,
 // Belege: Quittung mit Kamera
 belege:`<path d="M46 14h64v112l-10.7-7-10.6 7-10.7-7-10.7 7-10.6-7L46 126z" stroke-width="2" stroke-linejoin="round" style="fill:var(--paper);stroke:var(--line)"/>
  <rect x="58" y="32" width="40" height="7" rx="3.5" style="fill:var(--line)"/><rect x="58" y="50" width="30" height="7" rx="3.5" style="fill:var(--line)"/>
  <rect x="58" y="68" width="40" height="7" rx="3.5" style="fill:var(--line)"/><rect x="58" y="92" width="22" height="9" rx="4.5" style="fill:var(--money-3)"/>
  <circle cx="132" cy="102" r="30" style="fill:var(--accent-soft)"/>
  <path d="M117 95h7l4-6h10l4 6h7v20h-32z" stroke-width="3.5" stroke-linejoin="round" style="fill:none;stroke:var(--accent)"/><circle cx="133" cy="105" r="6" stroke-width="3.5" style="fill:none;stroke:var(--accent)"/>`,
 // Alles erledigt: großer Haken im Kreis
 fertig:`<circle cx="90" cy="70" r="52" style="fill:var(--money-soft)"/><circle cx="90" cy="70" r="36" style="fill:var(--money)"/>
  <path d="M73 70l12 12 22-24" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" style="stroke:#fff;fill:none"/>
  <circle cx="34" cy="30" r="5" style="fill:var(--money-3)"/><circle cx="150" cy="24" r="4" style="fill:var(--accent)"/><circle cx="156" cy="112" r="6" style="fill:var(--money-3)"/>`,
};
/** @param {"start"|"belege"|"fertig"} n */
export function bild(n, c="bild") { return `<svg class="${c}" viewBox="0 0 180 140" aria-hidden="true" focusable="false">${BILD[n]}</svg>`; }
/** Kleiner ⓘ-Knopf: zeigt eine Erklärung erst, wenn man sie braucht (öffnet ein Fenster von unten) */
export function infoBtn(titel, text){ return `<button type="button" class="infobtn" data-info="${esc(titel)}" data-infotext="${esc(text)}" aria-label="Mehr erfahren: ${esc(titel)}"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON.info}"/></svg></button>` }
/** eigenes Symbol je Leistung, damit man die Liste schneller erfasst */
export const CLAIM_ICON={pg_antrag:"form",pg_hoch:"plus",pflegegeld:"euro",sachleistung:"user",entlastung:"heart",jahresbetrag:"cal",tagespflege:"sun",verbrauch:"box",technisch:"bell",wohnumfeld:"home",dipa:"phone",wg:"people",beratung:"info",pflegekurs:"book",rv:"shield2",pug:"case",pflegepausch:"form",stationaer:"building",zuschlag:"euro",hzp:"building",eingliederung:"building",fahrten:"car",chroniker:"cross",befreiung:"receipt",sb_antrag:"card",sb_neu:"plus",behpausch:"form",fahrtpausch:"car",wertmarke:"card",kfz:"car",park:"car",rundfunk:"tv",blind:"eye",urlaub:"sun",gleich:"access",rente:"shield2",widerspruch:"alert"};
export const AREA_ICON={Pflege:"heart",Pflegeperson:"user",Steuer:"form",Pflegeheim:"building",Krankenkasse:"cross",Schwerbehinderung:"access",Arbeit:"case"};

/* ---------- Datum ---------- */
export function TODAY() {const d=new Date();d.setHours(0,0,0,0);return d}
export function isoD(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export function parseIso(s) {if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
export function deD(d) { return d.toLocaleDateString("de-DE"); }
export function daysUntil(d) { return Math.round((+d - +TODAY())/864e5); }
export function addDays(d, n) {const x=new Date(d);x.setDate(x.getDate()+n);return x}
export const MON=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
export function halfOf(d){const h=d.getMonth()<6?1:2;const y=d.getFullYear();return {y,h,start:new Date(y,h===1?0:6,1),end:new Date(y,h===1?5:11,h===1?30:31),label:`${h}. Halbjahr ${y}`}}
export function shiftHalf(H,n){let y=H.y,h=H.h+n;while(h>2){h-=2;y++}while(h<1){h+=2;y--}return halfOf(new Date(y,h===1?0:6,1))}

/** Wird beim Start der App einmal aufgerufen (siehe 99-start.js). */
export function start03() {

/* ---------- Befreiungs-Antrag (nur aus Belegen) ---------- */
B.push({k:"befreiung", area:"Krankenkasse", t:"Antrag auf Befreiung von Zuzahlungen", p:"§ 62 SGB V", when:()=>false, val:()=>null, short:"", steps:[],
  docs:["Zuzahlungsbelege (siehe Belegübersicht)","Einkommensnachweise aller Haushaltsmitglieder","ggf. Bescheinigung über die Dauerbehandlung (chronisch krank)"], to:KK, ask:()=>{const z=zuz(Z.befJahr);return `beantrage ich hiermit die Befreiung von Zuzahlungen bzw. die Erstattung von Zuzahlungen über der Belastungsgrenze nach § 62 SGB V für das Jahr ${Z.befJahr}. Die Belastungsgrenze beträgt ${z.grenze?eur(z.grenze,2):"[Betrag]"} (${z.pct} % der jährlichen Bruttoeinnahmen zum Lebensunterhalt). Bisher wurden Zuzahlungen in Höhe von ${eur(z.sum,2)} geleistet. Die Belege liegen in Kopie bei. Bitte erstatten Sie den Betrag, der die Belastungsgrenze übersteigt${String(Z.befJahr)===String(new Date().getFullYear())?", und stellen Sie eine Befreiungsbescheinigung für den Rest des Jahres aus":""}.`}});
}
