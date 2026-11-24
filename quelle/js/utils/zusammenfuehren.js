// Zusammenführen, wenn zwei Personen dieselbe Familie gleichzeitig bearbeiten (Dreiwege-Abgleich wie bei git):
// Was ich seit dem letzten gemeinsamen Stand geändert habe, gilt; alles andere kommt von der anderen Person.
// Objekte werden Feld für Feld abgeglichen, Listen als Ganzes (haben beide dieselbe Liste geändert, gilt meine).

/**
 * Inhaltlich gleich? Die Reihenfolge der Felder zählt nicht (die Datenbank sortiert sie um).
 * @param {any} a
 * @param {any} b
 */
export function gleich(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => gleich(x, b[i]));
  const ka = Object.keys(a).filter((k) => a[k] !== undefined),
    kb = Object.keys(b).filter((k) => b[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && gleich(a[k], b[k]));
}

/** @param {any} x */
const istObjekt = (x) => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * @param {any} basis letzter Stand, den beide kannten
 * @param {any} meins mein Stand
 * @param {any} ihres Stand der anderen Person (gerade aus der Datenbank geholt)
 * @returns {any} zusammengeführter Stand
 */
export function zusammenfuehren(basis, meins, ihres) {
  if (gleich(meins, basis)) return ihres;
  if (gleich(ihres, basis) || gleich(meins, ihres)) return meins;
  if (!istObjekt(meins) || !istObjekt(ihres)) return meins;
  const b = istObjekt(basis) ? basis : {};
  /** @type {Record<string, any>} */
  const out = {};
  for (const k of new Set([...Object.keys(meins), ...Object.keys(ihres), ...Object.keys(b)])) {
    const v = zusammenfuehren(b[k], meins[k], ihres[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
