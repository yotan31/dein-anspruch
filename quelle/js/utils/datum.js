// Datums-Helfer: heutiges Datum, Umrechnen zwischen ISO und deutscher Schreibweise, Tage bis zu einem Datum.
/** Heute, 0 Uhr; damit Tagesvergleiche nicht von der Uhrzeit abhängen. */
export function TODAY() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Datum als JJJJ-MM-TT in Ortszeit (toISOString würde nach UTC verschieben).
 * @param d Datum
 */
export function isoD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * JJJJ-MM-TT als Datum in Ortszeit; null bei anderem Format.
 * @param s Text
 */
export function parseIso(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Datum deutsch geschrieben (TT.MM.JJJJ).
 * @param d Datum
 */
export function deD(d) {
  return d.toLocaleDateString("de-DE");
}

/**
 * Datum für Briefe nach DIN 5008 (14.03.1938). Eingaben im Format JJJJ-MM-TT werden umgewandelt, alles andere bleibt,
 * wie es eingetragen wurde (z. B. ein von Hand getipptes „14.3.38“).
 * @param s Datum als Text
 */
export function datumBrief(s) {
  const d = parseIso(s);
  return d ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : String(s || "");
}

/**
 * Tage von heute bis zum Datum (negativ: vorbei).
 * @param d Datum
 */
export function daysUntil(d) {
  return Math.round((+d - +TODAY()) / 864e5);
}

/**
 * Datum plus n Tage.
 * @param d Datum
 * @param n Tage
 */
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

/**
 * Halbjahr eines Datums mit Anfang und Ende (für Beratungsbesuche).
 * @param d Datum
 */
export function halfOf(d) {
  const h = d.getMonth() < 6 ? 1 : 2;
  const y = d.getFullYear();
  return {
    y,
    h,
    start: new Date(y, h === 1 ? 0 : 6, 1),
    end: new Date(y, h === 1 ? 5 : 11, h === 1 ? 30 : 31),
    label: `${h}. Halbjahr ${y}`,
  };
}

/**
 * Halbjahr n Schritte vor oder zurück.
 * @param H Halbjahr
 * @param n Schritte
 */
export function shiftHalf(H, n) {
  let y = H.y,
    h = H.h + n;
  while (h > 2) {
    h -= 2;
    y++;
  }
  while (h < 1) {
    h += 2;
    y--;
  }
  return halfOf(new Date(y, h === 1 ? 0 : 6, 1));
}

/** Heutiges Datum für Briefe nach DIN 5008 (06.11.2026). */
export function today() {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
