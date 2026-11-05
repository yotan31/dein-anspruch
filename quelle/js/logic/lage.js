import { Z } from "../state/zustand.js";

export function isHome() {
  return ["angehoerige", "gemischt", "pflegedienst", "wg"].includes(Z.S.wohnen);
}

export function pg() {
  return Number(Z.S.pg) || 0;
}

export function gdb() {
  return Number(Z.S.sb.gdb) || 0;
}

export function mz(k) {
  return !!Z.S.sb.mz[k];
}
