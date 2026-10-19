# Dein Anspruch

Kostenlose Web-App für Menschen mit Pflegegrad oder Schwerbehinderung und ihre Angehörigen: zeigt offene Ansprüche (Stand 2026), füllt Anträge Schritt für Schritt aus, sammelt Belege und erinnert an Fristen.

- Echte App: https://yotan31.github.io/dein-anspruch/
- Testversion: https://yotan31.github.io/dein-anspruch/test/ (nutzt dieselbe Datenbank wie die echte App)

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `quelle/js/` | das Programm als ES-Module: `main.js` (Einstieg), `zustand.js` (gemeinsamer Zustand `Z`), `00-betraege.js` … `23-feedback-und-fehler.js`, `99-start.js` (Startreihenfolge) |
| `quelle/stil.css`, `quelle/index.html` | Aussehen und Seitengerüst (Sicherheitsregeln/CSP) |
| `quelle/bauen.mjs` | baut mit esbuild `site/app.js` (+ Source Map), `site/app.css`, `site/index.html` und die selbst gehostete Supabase-Bibliothek `site/vendor/supabase.js` |
| `quelle/typen.d.ts`, `tsconfig.json` | Typprüfung des Codes mit TypeScript |
| `site/` | statische Seiten (Datenschutz, Nutzungsbedingungen, Impressum), Bilder, `vendor/` (Schriften, pdf.js, jsPDF); die gebauten Dateien entstehen beim Bauen |
| `tests/` | `rechnungen.test.mjs`: jede Berechnung und Erkennung ohne Browser · `oberflaeche.mjs`: Klick-Tests im Handy-Browser |
| `supabase/` | Datenbank-Aufbau (`migrations/`) und Server-Funktionen (`functions/`), siehe `supabase/README.md` |

**Beträge für ein neues Jahr** stehen ausschließlich in `quelle/js/00-betraege.js`. Nach einer Änderung die Erwartungen in `tests/rechnungen.test.mjs` anpassen.

**Regeln für den Code**
- Jeder Programmteil importiert ausdrücklich, was er braucht. Werte, die mehrere Teile ändern, liegen im Zustand `Z` (`zustand.js`).
- Programmteile haben beim Laden keine Nebenwirkungen; was beim Start passieren muss, steht in einer Funktion `startNN()` und wird in `99-start.js` aufgerufen.
- `window.__da` gibt Tests und Fehlersuche Zugriff auf alle Programmteile.

## Ablauf bei Änderungen

```
npm install          # einmalig
npm test             # Typprüfung, Bauen, Berechnungen, Oberfläche
```

1. Erst auf den Branch `test` schieben → erscheint unter `/test/` zum Ausprobieren
2. Dann auf `main` → erscheint in der echten App

Der Workflow `.github/workflows/pruefen-und-veroeffentlichen.yml` prüft bei jedem Push den Code, baut die App, führt alle Tests aus und veröffentlicht **nur, wenn alles grün ist** (Branch `gh-pages`). `wachhalten.yml` pingt die kostenlose Datenbank täglich.

## Datenbank (Supabase-Projekt `dein-anspruch`, Frankfurt)

Tabellen `fall`, `mitglied`, `einladung`, `belege`, `erinnerung`, `fehler`, `rueckmeldung`, alle mit Row Level Security. Privater Speicher `belege` (Ordner = Fall). Edge Function `erinnerungen` (täglich per pg_cron).

Einmalig in Supabase: Authentication → URL Configuration → Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**`.
