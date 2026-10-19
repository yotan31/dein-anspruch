// Löscht auf ausdrücklichen Wunsch das eigene Konto mit allen eigenen Fällen, Belegen und Fotos.
// Nur mit gültiger Anmeldung und dem Bestätigungswort "LÖSCHEN".
// Bereitgestellt als Supabase Edge Function "konto-loeschen" (verify_jwt: true).
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "https://yotan31.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ fehler: "nur POST" }, 405);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const a = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: ud, error: ue } = await a.auth.getUser(token);
  const user = ud?.user;
  if (ue || !user) return json({ fehler: "nicht angemeldet" }, 401);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* leer */ }
  if (body.bestaetigung !== "LÖSCHEN") return json({ fehler: "Bestätigung fehlt" }, 400);
  const u = user.id;

  // eigene Fälle (als Besitzer)
  const { data: own } = await a.from("mitglied").select("fall_id").eq("user_id", u).eq("rolle", "besitzer");
  const eigene: string[] = (own || []).map((r: { fall_id: string }) => r.fall_id);

  // Fotos und PDFs der eigenen Fälle (und aus der allerersten Version: Ordner = Nutzer-ID)
  const pfade: string[] = [];
  if (eigene.length) {
    const { data: b } = await a.from("belege").select("pfad").in("fall_id", eigene);
    for (const r of b || []) if (r.pfad) pfade.push(r.pfad);
  }
  for (const ordner of [...eigene, u]) {
    const { data: l } = await a.storage.from("belege").list(ordner, { limit: 1000 });
    for (const o of l || []) if (o.name) pfade.push(`${ordner}/${o.name}`);
  }
  const alle = [...new Set(pfade)];
  for (let i = 0; i < alle.length; i += 100) await a.storage.from("belege").remove(alle.slice(i, i + 100));

  // Belege, die die Person in gemeinsamen Fällen anderer hochgeladen hat, bleiben diesem Fall erhalten
  const { data: fremd } = await a.from("belege").select("id,fall_id").eq("user_id", u).not("fall_id", "is", null);
  for (const r of fremd || []) {
    if (eigene.includes(r.fall_id)) continue;
    const { data: o } = await a.from("mitglied").select("user_id").eq("fall_id", r.fall_id).eq("rolle", "besitzer").neq("user_id", u).limit(1).maybeSingle();
    if (o) await a.from("belege").update({ user_id: o.user_id }).eq("id", r.id);
  }

  if (eigene.length) {
    const { error } = await a.from("fall").delete().in("id", eigene);
    if (error) return json({ fehler: "Fälle konnten nicht gelöscht werden" }, 500);
  }
  // Konto löschen; Mitgliedschaften, Erinnerungen und restliche Einträge werden dabei automatisch mit entfernt
  const { error: de } = await a.auth.admin.deleteUser(u);
  if (de) return json({ fehler: "Konto konnte nicht gelöscht werden" }, 500);
  return json({ ok: true, dateien: alle.length, faelle: eigene.length });
});
