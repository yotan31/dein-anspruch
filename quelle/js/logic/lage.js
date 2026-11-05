// Kurze Abfragen zur Lage der Familie (Pflegegrad, Wohnform, GdB, Merkzeichen), die viele Regeln brauchen.
import { Z } from "../state/zustand.js";

/** Wird zu Hause gepflegt (durch Angehörige, Pflegedienst oder in einer WG)? */
export function isHome() {
  return ["angehoerige", "gemischt", "pflegedienst", "wg"].includes(Z.S.wohnen);
}

/** Pflegegrad als Zahl, 0 ohne Pflegegrad. */
export function pg() {
  return Number(Z.S.pg) || 0;
}

/** Grad der Behinderung als Zahl, 0 ohne Angabe. */
export function gdb() {
  return Number(Z.S.sb.gdb) || 0;
}

/**
 * Ist das Merkzeichen eingetragen?
 * @param k Merkzeichen, z. B. „G“
 */
export function mz(k) {
  return !!Z.S.sb.mz[k];
}
