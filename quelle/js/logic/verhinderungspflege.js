import { BETRAEGE } from "../config/betraege.js";
import { JAHRESBETRAG, PG } from "../config/stammdaten.js";
import { pg } from "./lage.js";
import { Z } from "../state/zustand.js";
import { deD, parseIso } from "../utils/datum.js";
import { eur, numDE } from "../utils/format.js";

/* ---------- Verhinderungspflege-Assistent ---------- */
export const KM_SATZ = BETRAEGE.kmPauschale;

export const VHP_GRUND = {
  urlaub: "Urlaub",
  krank: "Krankheit",
  kur: "Kur oder Reha",
  termine: "Termine, Erholung oder andere wichtige Gründe",
};

export function vhpCalc() {
  const v = Z.S.vhp,
    rest = Math.max(0, JAHRESBETRAG - numDE(v.verbraucht));
  const basis = v.ersatz === "dienst" || v.ersatz === "heim" ? numDE(v.rechnung) : numDE(v.stunden) * numDE(v.satz);
  const cap = v.ersatz === "angehoerig" ? PG.pflegegeld[pg()] * 2 : rest;
  const pflege = basis ? Math.min(basis, cap) : 0;
  const fahrt = v.ersatz === "heim" ? 0 : numDE(v.km) * KM_SATZ;
  const verd = v.ersatz === "angehoerig" ? numDE(v.verdienst) : 0;
  const total = Math.min(rest, pflege + fahrt + verd);
  return { rest, basis, cap, pflege, fahrt, verd, total, gekappt: basis > cap };
}

export function vhpDocs() {
  const v = Z.S.vhp,
    d = [];
  if (v.ersatz === "heim")
    d.push("Rechnung der Kurzzeitpflege-Einrichtung (Zeitraum, Pflegekosten getrennt von Unterkunft/Verpflegung)");
  else if (v.ersatz === "dienst") d.push("Rechnung des Pflegedienstes mit Zeitraum und erbrachten Leistungen");
  else
    d.push(
      `Unterschriebene ${v.ersatz === "angehoerig" ? "Bestätigung" : "Quittung"} der Ersatzpflegeperson mit Zeitraum, Stunden und Betrag (Vorlage als PDF)`,
    );
  if (v.ersatz !== "heim" && numDE(v.km))
    d.push("Fahrtkosten-Aufstellung: Datum, Strecke von–nach, Kilometer je Fahrt");
  if (v.ersatz === "angehoerig" && numDE(v.verdienst))
    d.push("Nachweis Verdienstausfall: Bescheinigung des Arbeitgebers über unbezahlten Urlaub oder Lohnabrechnung");
  if (v.grund === "krank") d.push("Optional: Krankmeldung der Hauptpflegeperson (manche Kassen fragen danach)");
  if (v.auszahlung === "ersatz") d.push("Kontoverbindung der Ersatzpflegeperson");
  return d;
}

export function vhpZeitraum() {
  const a = parseIso(Z.S.vhp.von),
    b = parseIso(Z.S.vhp.bis);
  return a ? (b && +b !== +a ? `vom ${deD(a)} bis ${deD(b)}` : `am ${deD(a)}`) : "im Zeitraum [von – bis]";
}

export function vhpAsk() {
  const v = Z.S.vhp,
    c = vhpCalc(),
    zr = vhpZeitraum();
  const pay = `Bitte überweisen Sie den Erstattungsbetrag ${v.auszahlung === "ersatz" ? `direkt an die Ersatzpflegeperson ${v.eName || "[Name]"}, IBAN: ${v.iban || "[IBAN]"}` : `auf folgendes Konto: ${v.iban || "[IBAN]"}`}.`;
  if (v.ersatz === "heim")
    return `beantrage ich hiermit Leistungen der Kurzzeitpflege nach § 42 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI. Die Kurzzeitpflege erfolgte ${zr} in der Einrichtung ${v.eName || "[Name der Einrichtung]"}${v.eAdresse ? ", " + v.eAdresse : ""}. Die Rechnung${c.basis ? ` über ${eur(c.basis, 2)}` : ""} liegt bei. Sofern die Einrichtung nicht direkt mit Ihnen abrechnet: ${pay}`;
  const who =
    v.ersatz === "angehoerig"
      ? ` (${v.eBez || "[Verwandtschaftsverhältnis, z. B. Tochter]"})`
      : v.ersatz === "dienst"
        ? " (Pflegedienst)"
        : " (nicht verwandt, nicht erwerbsmäßig)";
  let kosten;
  if (v.ersatz === "dienst") kosten = `- Rechnung des Pflegedienstes: ${c.basis ? eur(c.basis, 2) : "[Betrag]"}`;
  else if (numDE(v.stunden) && numDE(v.satz))
    kosten = `- Ersatzpflege: ${numDE(v.stunden)} Stunden × ${eur(numDE(v.satz), 2)} = ${eur(c.basis, 2)}${c.gekappt ? ` (erstattungsfähig bis ${eur(c.cap, 2)})` : ""}`;
  else
    kosten = `- Ersatzpflege: [Stunden] × [Stundensatz] = [Betrag]${v.ersatz === "angehoerig" ? ` (höchstens das 2-fache Pflegegeld, ${eur(PG.pflegegeld[pg()] * 2)})` : ""}`;
  if (c.fahrt) kosten += `\n- Fahrtkosten: ${numDE(v.km)} km × ${eur(KM_SATZ, 2)} = ${eur(c.fahrt, 2)}`;
  if (c.verd) kosten += `\n- Verdienstausfall: ${eur(c.verd, 2)}`;
  if (c.total) kosten += `\nBeantragter Betrag insgesamt: ${eur(c.total, 2)}`;
  const stunden =
    v.art === "stunden"
      ? `\n\nDie Ersatzpflege erfolgte stundenweise (Verhinderung unter 8 Stunden am Tag). Ich bitte daher um ungekürzte Weiterzahlung des Pflegegeldes.`
      : "";
  return `beantrage ich hiermit die Erstattung von Kosten der Verhinderungspflege nach § 39 SGB XI aus dem gemeinsamen Jahresbetrag nach § 42a SGB XI.\n\nDie Hauptpflegeperson ${v.haupt || "[Name]"} war ${zr} wegen ${v.grund === "termine" ? "anderer wichtiger Gründe (z. B. Arzttermine, Erholung)" : VHP_GRUND[v.grund] || "[Grund]"} an der Pflege gehindert. In dieser Zeit hat die Pflege übernommen: ${v.eName || "[Name]"}, ${v.eAdresse || "[Anschrift]"}${who}.${stunden}\n\nAufwendungen:\n${kosten}\n\n${pay} Die Nachweise liegen bei.`;
}
