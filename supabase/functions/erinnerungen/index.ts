// Tägliche E-Mail-Erinnerungen an Fristen. Wird per pg_cron mit geheimem Header aufgerufen.
// Bereitgestellt als Supabase Edge Function "erinnerungen" (verify_jwt: false, prüft x-cron-secret).
// Benötigte Secrets: BREVO_API_KEY, ABSENDER
import { createClient } from "jsr:@supabase/supabase-js@2";

const STUFEN = [14, 7, 1];
const APP = "https://yotan31.github.io/dein-anspruch/";
const de = (d: Date) => d.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + "T00:00:00Z") : null);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

type Frist = { key: string; titel: string; datum: Date; text: string };

function fristen(data: any, beratungsDaten: string[], heute: Date): Frist[] {
  const L: Frist[] = [];
  const y = heute.getUTCFullYear();
  const pg = Number(data.pg) || 0;
  const home = ["angehoerige", "gemischt", "pflegedienst", "wg"].includes(data.wohnen);
  if (pg >= 2 && ["angehoerige", "gemischt", "wg"].includes(data.wohnen)) {
    const h1 = heute.getUTCMonth() < 6;
    const start = new Date(Date.UTC(y, h1 ? 0 : 6, 1)), ende = new Date(Date.UTC(y, h1 ? 5 : 11, h1 ? 30 : 31));
    const besuche = [...(data.termine?.besuche || []).map((b: any) => b.d), ...beratungsDaten].map(parse).filter(Boolean) as Date[];
    if (!besuche.some((d) => d >= start && d <= ende))
      L.push({ key: "beratung-" + iso(ende), titel: "Beratungsbesuch nach § 37 Abs. 3", datum: ende, text: "Ohne Nachweis kürzt die Pflegekasse das Pflegegeld. Bitte Termin mit dem Pflegedienst vereinbaren." });
  }
  const b = data.bescheid;
  if (b && b.eingang) {
    const e = parse(b.eingang);
    if (e) { const f = new Date(e); f.setUTCMonth(f.getUTCMonth() + 1); L.push({ key: "wid-" + iso(f), titel: "Widerspruchsfrist Pflegegrad-Bescheid", datum: f, text: "Bis zu diesem Tag kann Widerspruch eingelegt werden. Die App hilft beim Schreiben." }); }
  }
  if (pg >= 1 && home) { const d = new Date(Date.UTC(y, 5, 30)); L.push({ key: "entl-" + y, titel: "Entlastungsbetrag aus " + (y - 1) + " verfällt", datum: d, text: "Nicht genutzte Beträge aus dem Vorjahr verfallen. Jetzt Rechnungen einreichen." }); }
  if (pg >= 2 && home) { const d = new Date(Date.UTC(y, 11, 31)); L.push({ key: "vhp-" + y, titel: "Verhinderungspflege aus " + (y - 1) + " einreichen", datum: d, text: "Danach verfällt der Anspruch auf Erstattung (Ausschlussfrist)." }); }
  const wm = parse(data.termine?.wertmarke);
  if (wm) L.push({ key: "wm-" + iso(wm), titel: "Wertmarke läuft ab", datum: wm, text: "Neue Wertmarke beim Versorgungsamt beantragen." });
  for (const e of data.termine?.eigene || []) { const d = parse(e.d); if (d) L.push({ key: "own-" + e.id, titel: String(e.t || "Erinnerung"), datum: d, text: String(e.n || "") }); }
  return L;
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await sb.rpc("cron_secret_pruefen", { s: req.headers.get("x-cron-secret") || "" });
  if (!ok) return new Response("forbidden", { status: 403 });
  const key = Deno.env.get("BREVO_API_KEY"), absender = Deno.env.get("ABSENDER");
  if (!key || !absender) return new Response(JSON.stringify({ hinweis: "E-Mail-Versand noch nicht eingerichtet (BREVO_API_KEY, ABSENDER)" }), { status: 200 });

  const heute = new Date(); heute.setUTCHours(0, 0, 0, 0);
  const { data: abos } = await sb.from("erinnerung").select("user_id,email").eq("aktiv", true);
  let gesendet = 0;
  for (const abo of abos || []) {
    const { data: mit } = await sb.from("mitglied").select("fall_id").eq("user_id", abo.user_id);
    const punkte: string[] = [];
    for (const m of mit || []) {
      const { data: fall } = await sb.from("fall").select("id,data").eq("id", m.fall_id).maybeSingle();
      if (!fall) continue;
      const { data: bel } = await sb.from("belege").select("datum").eq("fall_id", fall.id).eq("kat", "beratung");
      const name = (fall.data?.person?.name || "").trim() || "deine Person";
      for (const f of fristen(fall.data || {}, (bel || []).map((b: any) => b.datum), heute)) {
        const tage = Math.round((f.datum.getTime() - heute.getTime()) / 864e5);
        const stufe = STUFEN.find((s) => tage === s) ?? (tage >= 0 && tage < 1 ? 0 : null);
        if (stufe == null) continue;
        const neu = await sb.rpc("erinnerung_log_neu", { u: abo.user_id, f: fall.id, key: f.key + "-" + stufe });
        if (!neu.data) continue;
        punkte.push(`<li><strong>${esc(f.titel)}</strong> (${esc(name)}) – bis ${de(f.datum)}, ${tage === 0 ? "heute" : tage === 1 ? "morgen" : "in " + tage + " Tagen"}<br>${esc(f.text)}</li>`);
      }
    }
    if (!punkte.length) continue;
    const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#13233a"><p>Hallo,</p><p>diese Fristen stehen bald an:</p><ul>${punkte.join("")}</ul><p><a href="${APP}" style="background:#0d6876;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Zur App</a></p><p style="color:#566578;font-size:13px">Du bekommst diese E-Mail, weil du in „Dein Anspruch“ Erinnerungen eingeschaltet hast. Abschalten: in der App unter Termine.</p></div>`;
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: "Dein Anspruch", email: absender }, to: [{ email: abo.email }], subject: "Erinnerung: Fristen bei Dein Anspruch", htmlContent: html }),
    });
    if (r.ok) gesendet++;
  }
  return new Response(JSON.stringify({ gesendet }), { headers: { "Content-Type": "application/json" } });
});
