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
};
const ic=(n,c="i")=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const AREA_ICON={Pflege:"heart",Pflegeperson:"user",Steuer:"form",Pflegeheim:"building",Krankenkasse:"cross",Schwerbehinderung:"access",Arbeit:"case"};

/* ---------- Datum ---------- */
const TODAY=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const isoD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseIso=s=>{if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const deD=d=>d.toLocaleDateString("de-DE");
const daysUntil=d=>Math.round((d-TODAY())/864e5);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const MON=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
function halfOf(d){const h=d.getMonth()<6?1:2;const y=d.getFullYear();return {y,h,start:new Date(y,h===1?0:6,1),end:new Date(y,h===1?5:11,h===1?30:31),label:`${h}. Halbjahr ${y}`}}
function shiftHalf(H,n){let y=H.y,h=H.h+n;while(h>2){h-=2;y++}while(h<1){h+=2;y--}return halfOf(new Date(y,h===1?0:6,1))}

/* ---------- Befreiungs-Antrag (nur aus Belegen) ---------- */
B.push({k:"befreiung", area:"Krankenkasse", t:"Antrag auf Befreiung von Zuzahlungen", p:"§ 62 SGB V", when:()=>false, val:()=>null, short:"", steps:[],
  docs:["Zuzahlungsbelege (siehe Belegübersicht)","Einkommensnachweise aller Haushaltsmitglieder","ggf. Bescheinigung über die Dauerbehandlung (chronisch krank)"], to:KK, ask:()=>{const z=zuz(befJahr);return `beantrage ich hiermit die Befreiung von Zuzahlungen bzw. die Erstattung von Zuzahlungen über der Belastungsgrenze nach § 62 SGB V für das Jahr ${befJahr}. Die Belastungsgrenze beträgt ${z.grenze?eur(z.grenze,2):"[Betrag]"} (${z.pct} % der jährlichen Bruttoeinnahmen zum Lebensunterhalt). Bisher wurden Zuzahlungen in Höhe von ${eur(z.sum,2)} geleistet. Die Belege liegen in Kopie bei. Bitte erstatten Sie den Betrag, der die Belastungsgrenze übersteigt${String(befJahr)===String(new Date().getFullYear())?", und stellen Sie eine Befreiungsbescheinigung für den Rest des Jahres aus":""}.`}});

