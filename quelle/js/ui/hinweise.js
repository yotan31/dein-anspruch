import { tr } from "../i18n/sprachen.js";
import { Z } from "../state/zustand.js";
import { $ } from "./render.js";

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Text kopiert");
  } catch (e) {
    const ta = document.querySelector("textarea[data-tx]");
    if (ta) {
      ta.focus();
      ta.select();
    }
    toast("Bitte Text markieren und kopieren (Strg+C)");
  }
}

export function toast(m) {
  const t = $("toast");
  t.textContent = tr(m);
  t.hidden = false;
  clearTimeout(Z.tT);
  Z.tT = setTimeout(() => (t.hidden = true), 2800);
}
