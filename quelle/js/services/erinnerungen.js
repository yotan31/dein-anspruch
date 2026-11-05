import { Z } from "../state/zustand.js";
import { toast } from "../ui/hinweise.js";
import { render } from "../ui/render.js";

export async function loadEri() {
  if (!Z.USER) return;
  const { data } = await Z.sb.from("erinnerung").select("aktiv,email").eq("user_id", Z.USER.id).maybeSingle();
  Z.ERI = data || null;
  Z.eriLoaded = true;
  render();
}

export async function setEri(aktiv, email) {
  const mail = (email || (Z.ERI && Z.ERI.email) || Z.USER.email || "").trim();
  if (aktiv && !/^\S+@\S+\.\S+$/.test(mail)) {
    toast("Bitte eine gültige E-Mail-Adresse eingeben.");
    return;
  }
  const { error } = await Z.sb
    .from("erinnerung")
    .upsert({ user_id: Z.USER.id, aktiv, email: mail, updated_at: new Date().toISOString() });
  if (error) {
    toast("Speichern hat nicht geklappt.");
    return;
  }
  Z.ERI = { aktiv, email: mail };
  toast(aktiv ? "Erinnerungen per E-Mail sind an." : "Erinnerungen per E-Mail sind aus.");
  render();
}
