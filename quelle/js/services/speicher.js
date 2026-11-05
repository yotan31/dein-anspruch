// Speicher der Angaben: mit Konto in Supabase (Personen, Familie, Fotos), ohne Konto im Browser.
// Speichert verzögert und der Reihe nach, damit schnelle Eingaben sich nicht gegenseitig überschreiben.
import { SB_KEY, SB_URL } from "../config/supabase.js";
import { lsGet, lsSet } from "./lokal.js";
import { blank, merge } from "../state/angaben.js";
import { Z } from "../state/zustand.js";
import { toast } from "../ui/hinweise.js";
import { $, render, scrollTop } from "../ui/render.js";

/**
 * Adresse eines vorab geladenen Belegfotos.
 * @param p Pfad im Fotospeicher
 */
export function blobUrl(p) {
  return Z.URLS[p] || "";
}

function setSave(c, t) {
  Z.saveState = { c, t };
  const d = $("savedot"),
    x = $("savetxt");
  if (d) {
    d.className = "dot " + c;
  }
  if (x) x.textContent = t;
}

export const DL = {
  async save({ filename, data }) {
    const type = /\.csv$/.test(filename)
      ? "text/csv;charset=utf-8"
      : /\.pdf$/.test(filename)
        ? "application/pdf"
        : "application/octet-stream";
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
    return { status: "saved" };
  },
};

const UI_KEYS = ["tab", "wiz", "belegFilter", "welcomeSeen"];

function uiKey() {
  return "da-ui-" + (Z.USER ? Z.USER.id : "gast") + "-" + (Z.FALL_ID || "x");
}

/** Speichert die Angaben kurz verzögert, damit nicht jeder Tastendruck einzeln gespeichert wird. */
export function save() {
  if (!Z.canSave || !Z.ref) return;
  clearTimeout(Z.saveTimer);
  setSave("", "Speichert …");
  const ui = {};
  UI_KEYS.forEach((k) => (ui[k] = Z.S[k]));
  lsSet(uiKey(), ui);
  Z.saveTimer = setTimeout(() => {
    Z.saveTimer = null;
    const data = JSON.parse(JSON.stringify(Z.S));
    data.updated = new Date().toISOString();
    if (Z.USER) UI_KEYS.forEach((k) => delete data[k]);
    const f = Z.FAELLE.find((x) => x.id === Z.FALL_ID);
    if (f) f.data = data;
    Z.writing = Z.writing
      .then(() => Z.ref.set(data))
      .then(() => setSave("ok", Z.USER ? "Gespeichert" : "Nur auf diesem Gerät"))
      .catch(() => {
        setSave("warn", "Nicht gespeichert – Internet prüfen");
      });
  }, 700);
}

/**
 * Anzeigename einer Person.
 * @param f Fall
 */
export function fallName(f) {
  const p = (f && f.data && f.data.person) || {};
  return (p.name || "").trim() || "Neue Person";
}

function toRow(d) {
  const r = {};
  for (const k of ["kat", "titel", "ctype", "eingereicht", "jahr"]) if (k in d) r[k] = d[k];
  if ("datum" in d) r.datum = d.datum || null;
  if ("betrag" in d) r.betrag = d.betrag === "" || d.betrag == null || isNaN(d.betrag) ? null : Number(d.betrag);
  if ("asset" in d) r.pfad = d.asset || "";
  return r;
}

async function refreshUrls() {
  const paths = Z.BEL.map((b) => b.asset).filter((p) => p && !Z.URLS[p]);
  if (!paths.length) return;
  const { data } = await Z.sb.storage.from("belege").createSignedUrls(paths, 6 * 3600);
  (data || []).forEach((x) => {
    if (x.signedUrl) Z.URLS[x.path] = x.signedUrl;
  });
}

async function reloadBelege() {
  if (!Z.USER || !Z.FALL_ID) return;
  const { data, error } = await Z.sb
    .from("belege")
    .select("*")
    .eq("fall_id", Z.FALL_ID)
    .order("datum", { ascending: false });
  if (error) {
    toast("Belege konnten nicht geladen werden.");
    return;
  }
  Z.BEL = data.map((r) => ({
    id: r.id,
    kat: r.kat,
    datum: r.datum || "",
    jahr: r.jahr,
    betrag: r.betrag == null ? "" : Number(r.betrag),
    titel: r.titel || "",
    asset: r.pfad || "",
    ctype: r.ctype || "",
    eingereicht: !!r.eingereicht,
  }));
  try {
    await refreshUrls();
  } catch (e) {}
  render();
}

const BCOL_SB = {
  async add(d) {
    const { error } = await Z.sb.from("belege").insert({ ...toRow(d), fall_id: Z.FALL_ID });
    if (error) throw error;
    await reloadBelege();
  },
  doc(id) {
    return {
      async update(d) {
        const { error } = await Z.sb.from("belege").update(toRow(d)).eq("id", id);
        if (error) throw error;
        await reloadBelege();
      },
      async delete() {
        const { error } = await Z.sb.from("belege").delete().eq("id", id);
        if (error) throw error;
        await reloadBelege();
      },
    };
  },
};

const ASSETS_SB = {
  async upload(blob, { type }) {
    const ext =
      type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    const path = `${Z.FALL_ID}/${id}.${ext}`;
    const { error } = await Z.sb.storage.from("belege").upload(path, blob, { contentType: type, upsert: false });
    if (error) throw { code: /size|large|exceed/i.test(error.message || "") ? "too_large" : "upload" };
    const { data } = await Z.sb.storage.from("belege").createSignedUrl(path, 6 * 3600);
    if (data) Z.URLS[path] = data.signedUrl;
    return { id: path, contentType: type };
  },
  async delete(path) {
    await Z.sb.storage.from("belege").remove([path]);
  },
};

const REF_SB = {
  async set(data) {
    const { error } = await Z.sb
      .from("fall")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", Z.FALL_ID);
    if (error) throw error;
  },
};

const REF_LOCAL = {
  async set(data) {
    lsSet("dein-anspruch-gast", data);
  },
};

/**
 * Ohne Konto zurück zur Startseite. Die Angaben werden sofort im Browser gesichert (ein noch wartendes Speichern
 * ginge sonst verloren) und sind beim nächsten „Jetzt kostenlos prüfen“ wieder da.
 */
export function beendeGast() {
  if (!Z.GUEST) return;
  clearTimeout(Z.saveTimer);
  Z.saveTimer = null;
  lsSet("dein-anspruch-gast", { ...JSON.parse(JSON.stringify(Z.S)), updated: new Date().toISOString() });
  lsSet("dein-anspruch-modus", "");
  Z.GUEST = false;
  Z.canSave = false;
  Z.ref = null;
}

/** Lädt alle Personen, auf die das Konto Zugriff hat. */
export async function loadFaelle() {
  const { data, error } = await Z.sb.from("fall").select("id,data,created_by,updated_at").order("created_at");
  if (error) throw error;
  const { data: m } = await Z.sb.from("mitglied").select("fall_id,rolle").eq("user_id", Z.USER.id);
  const rollen = Object.fromEntries((m || []).map((x) => [x.fall_id, x.rolle]));
  Z.FAELLE = data.map((f) => ({ ...f, rolle: rollen[f.id] || "mitglied" }));
}

/**
 * Legt eine neue Person an.
 * @param data Startangaben
 */
export async function createFall(data) {
  const { data: row, error } = await Z.sb
    .from("fall")
    .insert({ data: data || {} })
    .select("id,data,created_by,updated_at")
    .single();
  if (error) throw error;
  Z.FAELLE.push({ ...row, rolle: "besitzer" });
  return row.id;
}

/**
 * Öffnet eine Person: Angaben, Belege und Fotos laden.
 * @param id Fall
 */
export async function openFall(id) {
  Z.FALL_ID = id;
  lsSet("da-fall-" + Z.USER.id, id);
  Z.inviteLink = "";
  Z.showPersons = false;
  const f = Z.FAELLE.find((x) => x.id === id);
  Z.S = merge({ ...(f ? f.data : {}), ...(lsGet(uiKey()) || {}), font: lsGet("da-font") || "1" });
  Z.BEL = [];
  Z.URLS = {};
  Z.openKey = null;
  Z.pending = null;
  Z.bescheidDraft = null;
  Z.ref = REF_SB;
  Z.canSave = true;
  render();
  reloadBelege();
  loadMembers();
}

/** Lädt, wer außer einem selbst Zugriff auf die geöffnete Person hat. */
export async function loadMembers() {
  Z.MEMBERS = [];
  if (!Z.FALL_ID) return;
  const { data } = await Z.sb.from("mitglied").select("user_id,rolle,email").eq("fall_id", Z.FALL_ID);
  Z.MEMBERS = data || [];
  if (Z.showPersons) render();
}

const CONSENT_VERSION = "2026-10";

/** Fehlt noch die Einwilligung zur Speicherung von Gesundheitsdaten? */
export function consentNeeded() {
  return !!Z.USER && !(Z.USER.user_metadata || {}).einwilligung_am;
}

/** Speichert die Einwilligung mit Datum am Konto. */
export async function giveConsent() {
  const c = $("cs-ok");
  if (!c || !c.checked) {
    toast("Bitte zuerst das Häkchen bei der Einwilligung setzen.");
    return;
  }
  Z.consentBusy = true;
  render();
  const { data, error } = await Z.sb.auth.updateUser({
    data: { einwilligung_am: new Date().toISOString(), einwilligung_version: CONSENT_VERSION },
  });
  Z.consentBusy = false;
  if (error) {
    toast("Das hat nicht geklappt. Bitte noch einmal versuchen.");
    return render();
  }
  if (data && data.user) Z.USER = data.user;
  await loadUserData();
}

async function loadUserData() {
  if (consentNeeded()) {
    Z.loaded = true;
    Z.canSave = false;
    setSave("", "Einwilligung fehlt");
    render();
    return;
  }
  setSave("", "Lade deine Daten …");
  try {
    const code = lsGet("da-einladung");
    let joined = null;
    if (code) {
      lsSet("da-einladung", null);
      const { data, error } = await Z.sb.rpc("einladung_annehmen", { c: code });
      if (error) toast("Die Einladung ist ungültig oder abgelaufen.");
      else {
        joined = data;
        toast("Willkommen! Ihr pflegt jetzt gemeinsam.");
      }
    }
    await loadFaelle();
    if (!Z.FAELLE.length) {
      const guest = lsGet("dein-anspruch-gast");
      await createFall(guest || {});
      if (guest) toast("Deine Angaben von diesem Gerät wurden ins Konto übernommen.");
    }
    const want = joined || lsGet("da-fall-" + Z.USER.id);
    Z.ASSETS = ASSETS_SB;
    Z.BCOL = BCOL_SB;
    Z.GUEST = false;
    Z.loaded = true;
    setSave("ok", "Gespeichert");
    await openFall(Z.FAELLE.some((f) => f.id === want) ? want : Z.FAELLE[0].id);
  } catch (e) {
    Z.canSave = false;
    Z.loaded = true;
    setSave("warn", "Speicher nicht erreichbar");
    render();
  }
}

async function refreshFromServer() {
  if (!Z.USER || !Z.FALL_ID || Z.saveTimer) return;
  const { data } = await Z.sb.from("fall").select("data,updated_at").eq("id", Z.FALL_ID).maybeSingle();
  const f = Z.FAELLE.find((x) => x.id === Z.FALL_ID);
  if (data && f && data.updated_at !== f.updated_at) {
    f.data = data.data;
    f.updated_at = data.updated_at;
    const ui = {};
    UI_KEYS.forEach((k) => (ui[k] = Z.S[k]));
    Z.S = merge({ ...data.data, ...ui, font: Z.S.font });
    render();
  }
  reloadBelege();
}

/** Legt eine weitere Person an und öffnet sie. */
export async function addPerson() {
  try {
    const id = await createFall({});
    await openFall(id);
    scrollTop();
    toast("Neue Person angelegt. Beantworte kurz die Fragen.");
  } catch (e) {
    toast("Anlegen hat nicht geklappt.");
  }
}

/** Erstellt einen Einladungslink für Familienmitglieder. */
export async function makeInvite() {
  Z.inviteBusy = true;
  render();
  const { data, error } = await Z.sb.rpc("einladung_erstellen", { f: Z.FALL_ID });
  Z.inviteBusy = false;
  if (error) {
    toast("Einladung konnte nicht erstellt werden.");
    return render();
  }
  Z.inviteLink = location.origin + location.pathname + "?einladung=" + data;
  render();
}

/**
 * Entzieht einem Familienmitglied den Zugriff.
 * @param uid Konto
 */
export async function removeMember(uid) {
  const { error } = await Z.sb.from("mitglied").delete().eq("fall_id", Z.FALL_ID).eq("user_id", uid);
  if (error) return toast("Entfernen hat nicht geklappt.");
  if (uid === Z.USER.id) {
    Z.FAELLE = Z.FAELLE.filter((f) => f.id !== Z.FALL_ID);
    toast("Du bist ausgetreten.");
    if (!Z.FAELLE.length) await createFall({});
    return openFall(Z.FAELLE[0].id);
  }
  toast("Person entfernt.");
  loadMembers().then(render);
}

/** Löscht die geöffnete Person samt Belegen und Fotos. */
export async function deletePerson() {
  try {
    const paths = Z.BEL.map((b) => b.asset).filter(Boolean);
    if (paths.length) await Z.sb.storage.from("belege").remove(paths);
    const { error } = await Z.sb.from("fall").delete().eq("id", Z.FALL_ID);
    if (error) throw error;
    Z.FAELLE = Z.FAELLE.filter((f) => f.id !== Z.FALL_ID);
    Z.delPersonAsk = false;
    toast("Person und ihre Daten wurden gelöscht.");
    if (!Z.FAELLE.length) await createFall({});
    openFall(Z.FAELLE[0].id);
  } catch (e) {
    toast("Löschen hat nicht geklappt.");
  }
}

/** Nutzung ohne Konto: Angaben bleiben nur in diesem Browser. */
export function startGuest() {
  Z.GUEST = true;
  Z.USER = null;
  Z.ref = REF_LOCAL;
  Z.canSave = true;
  Z.ASSETS = null;
  Z.BCOL = null;
  const g = lsGet("dein-anspruch-gast");
  Z.S = g ? merge(g) : blank();
  setSave("warn", "Nur auf diesem Gerät");
  render();
}

/** Verbindet beim Start mit Supabase und lädt Konto und Angaben (ohne Internet: Angaben aus dem Browser). */
export async function initStore() {
  try {
    if (new URLSearchParams(location.search).has("rechner")) Z.RECHNER = { i: 0, a: [] };
  } catch (e) {}
  try {
    const q = new URLSearchParams(location.search);
    const c = q.get("einladung");
    if (c) {
      lsSet("da-einladung", c);
      history.replaceState(null, "", location.pathname);
    }
  } catch (e) {}
  // Link aus der E-Mail „Passwort zurücksetzen“: erst neues Passwort festlegen lassen (vor dem Anlegen der Verbindung prüfen, die Adresse wird danach bereinigt)
  try {
    const h = location.hash || "",
      q = location.search || "";
    const istReset = /type=recovery/.test(h) || /[?&]passwort=neu/.test(q);
    if (istReset && /error_code|error_description/.test(h)) {
      Z.authMode = "forgot";
      Z.authMsg =
        "Der Link zum Zurücksetzen ist abgelaufen oder wurde schon benutzt. Bitte hier einen neuen anfordern.";
      history.replaceState(null, "", location.pathname);
    } else if (istReset) Z.RECOVERY = true;
  } catch (e) {}
  if (!window.supabase) {
    Z.loaded = true;
    setSave("warn", "Keine Verbindung – nur auf diesem Gerät");
    startGuest();
    return;
  }
  Z.sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "dein-anspruch-auth" },
  });
  Z.sb.auth.onAuthStateChange((ev, session) => {
    if (ev === "PASSWORD_RECOVERY") {
      Z.RECOVERY = true;
      render();
    }
    const u = session ? session.user : null;
    if (u && (!Z.USER || Z.USER.id !== u.id)) {
      Z.USER = u;
      setTimeout(loadUserData, 0);
    }
    if (!u && Z.USER) {
      Z.USER = null;
      Z.S = blank();
      Z.BEL = [];
      Z.URLS = {};
      Z.FAELLE = [];
      Z.FALL_ID = null;
      Z.canSave = false;
      Z.ref = null;
      Z.ASSETS = null;
      Z.BCOL = null;
      render();
    }
  });
  try {
    const {
      data: { session },
    } = await Z.sb.auth.getSession();
    if (session && session.user) {
      if (!Z.USER) {
        Z.USER = session.user;
        await loadUserData();
      }
    } else {
      Z.loaded = true;
      if (lsGet("dein-anspruch-modus") === "gast") startGuest();
      else render();
    }
  } catch (e) {
    Z.loaded = true;
    render();
  }
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function startSpeicher() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshFromServer().catch(() => {});
  });
  // Testversion (…/test/): deutlich markieren, sie nutzt dieselbe Datenbank wie die echte App
  if (/\/test\//.test(location.pathname)) {
    const t = document.createElement("div");
    t.className = "testbanner";
    t.textContent = "TESTVERSION – zum Ausprobieren neuer Funktionen. Achtung: echte Daten!";
    document.body.prepend(t);
  }
}
