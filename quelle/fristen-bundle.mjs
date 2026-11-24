// Einstellungen für die Fristen-Datei der E-Mail-Erinnerungen (supabase/functions/erinnerungen/fristen.js).
// Eigene Datei, damit quelle/bauen.mjs und der Test in tests/rechnungen.test.mjs genau dieselben Einstellungen nutzen:
// Der Test baut die Datei neu und prüft, dass die eingecheckte Fassung aktuell ist.
import path from "node:path";

/** Pfad der erzeugten Datei, relativ zum Projektordner */
export const FRISTEN_ZIEL = "supabase/functions/erinnerungen/fristen.js";

/**
 * @param {string} root Projektordner
 * @returns {import("esbuild").BuildOptions}
 */
export function fristenBundleOptionen(root) {
  return {
    absWorkingDir: root,
    entryPoints: [path.join(root, "quelle/js/logic/fristen-fall.js")],
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: ["es2022"],
    charset: "utf8",
    legalComments: "none",
    logLevel: "warning",
    banner: {
      js: "// Automatisch erzeugt von quelle/bauen.mjs aus quelle/js/logic/fristen-fall.js. Nicht von Hand ändern.\n// Nach jeder Änderung an den Fristen die Edge Function „erinnerungen“ neu bereitstellen (siehe README).",
    },
  };
}
