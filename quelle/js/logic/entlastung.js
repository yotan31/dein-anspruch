import { ENTLASTUNG } from "../config/stammdaten.js";
import { isHome, pg } from "./lage.js";
import { Z } from "../state/zustand.js";
import { TODAY, parseIso } from "../utils/datum.js";

/* ---------- Entlastungsbetrag-Konto ---------- */
export function entlKonto() {
  if (!(pg() >= 1 && isHome())) return null;
  const t = TODAY(),
    y = t.getFullYear();
  const seit = parseIso(Z.S.entlSeit ? Z.S.entlSeit + "-01" : "");
  const monate = (jahr, bisMonat) => {
    let von = 0;
    if (seit) {
      if (seit.getFullYear() > jahr) return 0;
      if (seit.getFullYear() === jahr) von = seit.getMonth();
    }
    return Math.max(0, bisMonat - von);
  };
  const used = (jahr, nurH1) =>
    Z.BEL.filter(
      (b) => b.kat === "entl" && String(b.jahr) === String(jahr) && (!nurH1 || (parseIso(b.datum) || t).getMonth() < 6),
    ).reduce((s, b) => s + (Number(b.betrag) || 0), 0);
  const vorjBudget = ENTLASTUNG * monate(y - 1, 12),
    vorjRest = Math.max(0, vorjBudget - used(y - 1));
  const h1 = used(y, true),
    ausVorj = Math.min(vorjRest, h1);
  const vorjOffen = t <= new Date(y, 5, 30) ? vorjRest - ausVorj : 0;
  const bisHeute = ENTLASTUNG * monate(y, t.getMonth() + 1),
    jahr = ENTLASTUNG * monate(y, 12);
  const genutzt = used(y) - ausVorj;
  const frei = Math.max(0, bisHeute - genutzt) + vorjOffen;
  return {
    y,
    frei,
    vorjOffen,
    verfall: new Date(y, 5, 30),
    genutzt: used(y),
    bisHeute,
    jahr,
    belege: Z.BEL.filter((b) => b.kat === "entl").length,
  };
}
