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
