import { isHome, pg } from "./lage.js";
import { Z } from "../state/zustand.js";

/* ---------- Schritte ---------- */
const STEPS = [
  { id: "start", label: "Start", show: () => true },
  { id: "kasse", label: "Kasse", show: () => Z.S.bereiche.pflege },
  { id: "pflege", label: "Pflegegrad", show: () => Z.S.bereiche.pflege },
  { id: "pp", label: "Pflegeperson", show: () => Z.S.bereiche.pflege && pg() >= 1 && isHome() },
  { id: "sb", label: "Schwerbehinderung", show: () => Z.S.bereiche.sb },
  { id: "genutzt", label: "Schon genutzt", show: () => true },
  { id: "daten", label: "Deine Angaben", show: () => true },
];

export function visSteps() {
  return STEPS.filter((s) => s.show());
}
