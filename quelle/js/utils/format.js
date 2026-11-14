// Formatieren: Euro-Beträge, deutsche Zahlen und Escapen von Text für HTML (gegen eingeschleusten Code).
/**
 * Betrag in Euro, deutsch geschrieben.
 * @param n Betrag
 * @param d Nachkommastellen
 */
export function eur(n, d = 0) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
}

/**
 * Text sicher für HTML machen: verhindert, dass Eingaben als Code ausgeführt werden.
 * @param s Text
 */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/**
 * Zahl aus deutscher Schreibweise lesen (1.234,56); 0, wenn nichts Lesbares drinsteht.
 * @param x Text
 */
export function numDE(x) {
  return (
    Number(
      String(x ?? "")
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(\D|$))/g, "")
        .replace(",", "."),
    ) || 0
  );
}

/**
 * Zufällige Kennung für Belege und Dateinamen, immer aus dem sicheren Zufall des Browsers (nie Math.random).
 * Alte Browser ohne crypto.randomUUID bekommen dieselbe Form aus crypto.getRandomValues.
 */
export function zufallsId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
