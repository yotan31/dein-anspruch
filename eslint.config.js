// ESLint-Regeln für das ganze Projekt. Ziel: echte Fehler finden (ungenutzte Variablen, Tippfehler bei Namen,
// versehentliche Globals), nicht Stilfragen – um das Format kümmert sich Prettier.
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "site/", "werkzeuge/messung.json"] },
  js.configs.recommended,
  {
    // Programm der App: läuft im Browser
    files: ["quelle/js/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.browser } },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      // leere catch-Blöcke nur dort, wo ein Fehler bewusst egal ist (z. B. localStorage im privaten Modus)
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    // Bauen, Tests und Werkzeuge: laufen mit Node
    files: ["quelle/bauen.mjs", "quelle/sw.js", "tests/**/*.mjs", "werkzeuge/**/*.mjs", "eslint.config.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.node, ...globals.browser } },
    // vars: "local" – in den Tests werden Programmteile der App im Browser nur gesetzt (z. B. ASSETS = …), nicht gelesen
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none", vars: "local" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  // __DATEIEN__ wird beim Bauen durch die Liste der vorab gespeicherten Dateien ersetzt
  {
    files: ["quelle/sw.js"],
    languageOptions: { sourceType: "script", globals: { ...globals.serviceworker, __DATEIEN__: "readonly" } },
  },
];
