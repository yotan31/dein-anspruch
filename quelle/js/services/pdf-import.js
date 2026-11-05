// Sammel-PDF: mehrere Belege aus einer PDF lesen, Seiten zu Belegen gruppieren und gemeinsam speichern.
// pdf.js wird erst bei Bedarf geladen, damit der Start schnell bleibt.
import { selYears } from "../logic/belege.js";
import { groupPages } from "../logic/belegerkennung.js";
import { loadTesseract } from "./bescheid.js";
import { ladeJsPdf } from "./pdf.js";
import { save } from "./speicher.js";
import { Z } from "../state/zustand.js";
import { toast } from "../ui/hinweise.js";
import { render, scrollTop } from "../ui/render.js";
import { TODAY, isoD, parseIso } from "../utils/datum.js";
import { numDE } from "../utils/format.js";

function loadPdfJs() {
  if (!Z.pdfjsP)
    Z.pdfjsP = import(new URL("vendor/pdf.min.js", location.href).href)
      .then((m) => {
        m.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.min.js", location.href).href;
        return m;
      })
      .catch((e) => {
        Z.pdfjsP = null;
        throw e;
      });
  return Z.pdfjsP;
}

async function pageLines(page) {
  const tc = await page.getTextContent();
  const rows = new Map();
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const y = Math.round(it.transform[5] / 4);
    const r = rows.get(y) || [];
    r.push([it.transform[4], it.str]);
    rows.set(y, r);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, r]) =>
      r
        .sort((a, b) => a[0] - b[0])
        .map((x) => x[1])
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

async function pageCanvas(page, maxW) {
  const v1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: Math.min(3, maxW / v1.width) });
  const c = document.createElement("canvas");
  c.width = Math.ceil(vp.width);
  c.height = Math.ceil(vp.height);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return c;
}

/**
 * Liest eine Sammel-PDF Seite für Seite und schlägt die enthaltenen Belege vor.
 * @param file PDF
 */
export async function importPdf(file) {
  Z.pending = null;
  Z.bulk = { phase: "lesen", n: 0, total: 0, items: [], file, msg: "Die PDF wird geöffnet …" };
  render();
  scrollTop();
  let ocr = null;
  try {
    const lib = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await lib.getDocument({
      data: new Uint8Array(buf),
      wasmUrl: new URL("vendor/wasm/", location.href).href,
      standardFontDataUrl: new URL("vendor/fonts/", location.href).href,
      isEvalSupported: false,
    }).promise;
    if (!Z.bulk || Z.bulk.file !== file) return;
    Z.bulk.pdf = pdf;
    Z.bulk.total = pdf.numPages;
    Z.bulk.pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      if (!Z.bulk || Z.bulk.file !== file) return;
      Z.bulk.n = i;
      Z.bulk.msg = `Seite ${i} von ${pdf.numPages} wird gelesen …`;
      render();
      const page = await pdf.getPage(i);
      let lines = await pageLines(page);
      const thumb = (await pageCanvas(page, 160)).toDataURL("image/jpeg", 0.7);
      if (lines.join("").length < 40) {
        // eingescannt: Text erst erkennen
        Z.bulk.msg = `Seite ${i} von ${pdf.numPages}: eingescannt, Text wird erkannt …`;
        render();
        try {
          if (!ocr) {
            const T = await loadTesseract();
            ocr = await T.createWorker("deu");
          }
          const c = await pageCanvas(page, 1700);
          const { data } = await ocr.recognize(c);
          lines = String(data.text || "")
            .split(/\n+/)
            .map((s) => s.replace(/\s+/g, " ").trim())
            .filter(Boolean);
        } catch (e) {}
      }
      Z.bulk.pages.push({ i, lines, text: lines.join("\n"), thumb });
    }
    if (!Z.bulk || Z.bulk.file !== file) return;
    Z.bulk.items = groupPages(Z.bulk.pages);
    Z.bulk.phase = "pruefen";
    Z.bulk.msg = "";
  } catch (e) {
    Z.bulk = { phase: "fehler", file, items: [], msg: "Die PDF konnte nicht gelesen werden." };
  } finally {
    if (ocr)
      try {
        await ocr.terminate();
      } catch (e) {}
  }
  render();
  scrollTop();
}

async function bulkBlob(it) {
  const B = Z.bulk;
  if (B.items.length === 1 && it.pages.length === B.total && B.file.size < 20e6)
    return { blob: B.file, type: "application/pdf" };
  const canvases = [];
  for (const i of it.pages) canvases.push(await pageCanvas(await B.pdf.getPage(i), 1300));
  if (canvases.length === 1 || !(await ladeJsPdf())) {
    // ohne PDF-Bibliothek: Seiten untereinander zu einem Bild
    let c = canvases[0];
    if (canvases.length > 1) {
      const w = Math.max(...canvases.map((x) => x.width)),
        h = canvases.reduce((s, x) => s + x.height, 0),
        k = Math.min(1, 12000 / h);
      c = document.createElement("canvas");
      c.width = Math.round(w * k);
      c.height = Math.round(h * k);
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      let y = 0;
      for (const x of canvases) {
        g.drawImage(x, 0, y, x.width * k, x.height * k);
        y += x.height * k;
      }
    }
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8));
    return { blob, type: "image/jpeg" };
  }
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  canvases.forEach((c, k) => {
    if (k) doc.addPage();
    const w = 210,
      h = Math.min(297, (c.height / c.width) * 210);
    doc.addImage(c.toDataURL("image/jpeg", 0.8), "JPEG", 0, 0, w, h);
  });
  return { blob: doc.output("blob"), type: "application/pdf" };
}

/** Speichert die geprüften Belege aus der Sammel-PDF. */
export async function bulkSave() {
  if (!Z.bulk || Z.bulk.phase !== "pruefen") return;
  const bad = Z.bulk.items.find(
    (it) => it.on && String(it.betrag).trim() && !/^[\d.,\s]+$/.test(String(it.betrag).trim()),
  );
  if (bad) {
    toast("Bitte Beträge nur als Zahl eingeben, z. B. 5,00");
    return;
  }
  const list = Z.bulk.items.filter((x) => x.on);
  Z.bulk.phase = "speichern";
  Z.bulk.total = list.length;
  Z.bulk.n = 0;
  render();
  let ok = 0;
  const years = new Set();
  for (const it of list) {
    Z.bulk.n++;
    Z.bulk.msg = `Beleg ${Z.bulk.n} von ${list.length}`;
    render();
    try {
      let asset = "",
        ctype = "";
      if (Z.ASSETS) {
        const { blob, type } = await bulkBlob(it);
        const up = await Z.ASSETS.upload(blob, { type });
        asset = up.id;
        ctype = up.contentType;
      }
      const d = parseIso(it.datum) || TODAY();
      const data = {
        kat: it.kat,
        datum: isoD(d),
        jahr: d.getFullYear(),
        betrag: String(it.betrag).trim() === "" ? "" : numDE(it.betrag),
        titel: String(it.titel || "").trim(),
        asset,
        ctype,
        eingereicht: false,
        created: new Date().toISOString(),
      };
      if (Z.BCOL) await Z.BCOL.add(data);
      else Z.BEL.push({ id: "local-" + Date.now() + "-" + ok, ...data });
      ok++;
      years.add(String(d.getFullYear()));
    } catch (e) {}
  }
  const cur = selYears();
  Z.S.belegFilter.jahre = [...new Set([...cur, ...years])];
  Z.S.belegFilter.kat = "";
  save();
  Z.bulk = null;
  render();
  scrollTop();
  toast(
    ok === list.length
      ? ok === 1
        ? "1 Beleg gespeichert"
        : `${ok} Belege gespeichert`
      : `${ok} von ${list.length} Belegen gespeichert. Bitte die übrigen noch einmal versuchen.`,
  );
}
