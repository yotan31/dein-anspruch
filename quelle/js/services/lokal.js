// Lesen und Schreiben im Browser-Speicher (localStorage). Fehler werden geschluckt, weil der Speicher
// im privaten Modus oder bei vollem Speicher fehlen kann und die App dann trotzdem laufen soll.
/**
 * Liest einen Wert aus dem Browser-Speicher; null, wenn er fehlt oder unlesbar ist.
 * @param k Schlüssel
 */
export function lsGet(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch (e) {
    return null;
  }
}

/**
 * Schreibt einen Wert in den Browser-Speicher.
 * @param k Schlüssel
 * @param v Wert
 */
export function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}
