/* ---------- Datum ---------- */
export function TODAY() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseIso(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function deD(d) {
  return d.toLocaleDateString("de-DE");
}

export function daysUntil(d) {
  return Math.round((+d - +TODAY()) / 864e5);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

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

export function today() {
  return new Date().toLocaleDateString("de-DE");
}
