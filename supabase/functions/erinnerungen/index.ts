// Tägliche E-Mail-Erinnerungen an Fristen. Wird per pg_cron mit geheimem Header aufgerufen.
// Bereitgestellt als Supabase Edge Function "erinnerungen" (verify_jwt: false, prüft x-cron-secret).
// Benötigte Secrets: BREVO_API_KEY, ABSENDER
//
// Welche Fristen es gibt, steht NICHT hier, sondern in quelle/js/logic/fristen.js (dieselben Regeln wie in der App).
// quelle/bauen.mjs erzeugt daraus ./fristen.js. Beim Bereitstellen index.ts UND fristen.js hochladen.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { fristenFuerFall } from "./fristen.js";

/** Erinnerungen 14, 7 und 1 Tag vorher sowie am Tag selbst */
const STUFEN = [14, 7, 1, 0];
const APP = "https://yotan31.github.io/dein-anspruch/";
const de = (d: Date) => d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

/**
 * Welche Stufe ist heute dran? Die kleinste Stufe, die schon erreicht ist. Fiel ein Lauf aus (oder kam die Frist
 * erst spät dazu), kommt die Erinnerung so am nächsten Tag nach statt gar nicht. Doppelt wird nichts geschickt,
 * weil jede Stufe je Frist nur einmal im Protokoll stehen darf.
 */
function stufe(tage: number): number | null {
  if (tage < 0 || tage > STUFEN[0]) return null;
  return Math.min(...STUFEN.filter((s) => s >= tage));
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await sb.rpc("cron_secret_pruefen", { s: req.headers.get("x-cron-secret") || "" });
  if (!ok) return new Response("forbidden", { status: 403 });
  const key = Deno.env.get("BREVO_API_KEY"),
    absender = Deno.env.get("ABSENDER");
  if (!key || !absender) {
    // steht so in den Logs der Funktion, damit man es dort findet
    console.warn("Erinnerungen: E-Mail-Versand nicht eingerichtet (Secret BREVO_API_KEY oder ABSENDER fehlt)");
    return json({ eingerichtet: false, gesendet: 0 });
  }

  const heute = new Date();
  heute.setUTCHours(0, 0, 0, 0);
  const { data: abos } = await sb.from("erinnerung").select("user_id,email").eq("aktiv", true);
  let gesendet = 0,
    fehler = 0;
  for (const abo of abos || []) {
    const { data: mit } = await sb.from("mitglied").select("fall_id").eq("user_id", abo.user_id);
    const punkte: string[] = [];
    /** Einträge im Protokoll, die zurückgenommen werden, falls die E-Mail nicht rausgeht */
    const reserviert: { f: string; key: string }[] = [];
    for (const m of mit || []) {
      const { data: fall } = await sb.from("fall").select("id,data").eq("id", m.fall_id).maybeSingle();
      if (!fall) continue;
      const { data: bel } = await sb.from("belege").select("kat,datum,jahr,betrag").eq("fall_id", fall.id);
      const name = (fall.data?.person?.name || "").trim() || "deine Person";
      for (const f of fristenFuerFall(fall.data || {}, bel || [])) {
        const tage = Math.round((f.datum.getTime() - heute.getTime()) / 864e5);
        const s = stufe(tage);
        // „Noch keine Antwort?“ und Ähnliches: erst am Tag selbst, eine Vorwarnung ergibt dort keinen Sinn
        if (s == null || (f.nurAmTag && s !== 0)) continue;
        const logKey = f.key + "-" + s;
        const neu = await sb.rpc("erinnerung_log_neu", { u: abo.user_id, f: fall.id, key: logKey });
        if (!neu.data) continue;
        reserviert.push({ f: fall.id, key: logKey });
        punkte.push(
          `<li><strong>${esc(f.titel)}</strong> (${esc(name)}) – bis ${de(f.datum)}, ${tage === 0 ? "heute" : tage === 1 ? "morgen" : "in " + tage + " Tagen"}<br>${esc(f.text)}</li>`,
        );
      }
    }
    if (!punkte.length) continue;
    const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#13233a"><p>Hallo,</p><p>diese Fristen stehen bald an:</p><ul>${punkte.join("")}</ul><p><a href="${APP}" style="background:#0d6876;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Zur App</a></p><p style="color:#566578;font-size:13px">Du bekommst diese E-Mail, weil du in „Dein Anspruch“ Erinnerungen eingeschaltet hast. Abschalten: in der App unter Termine.</p></div>`;
    let r: Response | null = null;
    try {
      r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "Dein Anspruch", email: absender },
          to: [{ email: abo.email }],
          subject: "Erinnerung: Fristen bei Dein Anspruch",
          htmlContent: html,
        }),
      });
    } catch (_) {
      r = null;
    }
    if (r && r.ok) {
      gesendet++;
    } else {
      // nicht verschickt: Protokoll zurücknehmen, damit der nächste Lauf es noch einmal versucht
      fehler++;
      console.error("Erinnerungen: Versand fehlgeschlagen", r ? r.status : "kein Netz");
      for (const x of reserviert)
        await sb.rpc("erinnerung_log_zurueck", { u: abo.user_id, f: x.f, key: x.key });
    }
  }
  return json({ eingerichtet: true, gesendet, fehler });
});
