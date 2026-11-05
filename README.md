# Dein Anspruch

Kostenlose Web-App für Menschen mit Pflegegrad oder Schwerbehinderung und ihre Angehörigen: zeigt offene Ansprüche (Stand 2026), füllt Anträge Schritt für Schritt aus, sammelt Belege und erinnert an Fristen.

- Echte App: https://yotan31.github.io/dein-anspruch/
- Testversion: https://yotan31.github.io/dein-anspruch/test/ (nutzt dieselbe Datenbank wie die echte App)

## Aufbau

| Ort                                    | Inhalt                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `quelle/js/`                           | das Programm als ES-Module, nach Aufgabe geordnet (siehe unten)                                                                             |
| `quelle/stil.css`, `quelle/index.html` | Aussehen und Seitengerüst (Sicherheitsregeln/CSP); das CSS wird beim Bauen verkleinert in `index.html` eingebettet                          |
| `quelle/bauen.mjs`                     | baut mit esbuild `site/app.js` (+ Source Map), `site/index.html`, `site/sw.js` und die selbst gehostete Supabase-Bibliothek                 |
| `quelle/typen.d.ts`, `tsconfig.json`   | Typprüfung des Codes mit TypeScript                                                                                                         |
| `site/`                                | statische Seiten (Datenschutz, Nutzungsbedingungen, Impressum), Bilder, `vendor/` (pdf.js, jsPDF, Supabase); gebaute Dateien entstehen hier |
| `tests/`                               | `rechnungen.test.mjs`: jede Berechnung und Erkennung ohne Browser · `oberflaeche.mjs`: Klick-Tests im Handy-Browser                         |
| `werkzeuge/`                           | `server.mjs`: kleiner Webserver für Tests und Messung · `messen.mjs`: Lighthouse-Messung (Handy-Profil, Mittel aus drei Läufen)             |
| `dokumente/`                           | Unterlagen zum Start: Fragen für die rechtliche Prüfung, Testanleitung, Anleitung Google-Anmeldung (jeweils als .md und .pdf)               |
| `supabase/`                            | Datenbank-Aufbau (`migrations/`) und Server-Funktionen (`functions/`), siehe `supabase/README.md`                                           |

### Ordner in `quelle/js/`

| Ordner                | Aufgabe                                                                                                            | darf importieren                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `config/`             | feste Werte: Beträge (`betraege.js`), Stammdaten, Supabase-Adresse, Version                                        | nichts außer `config/`                  |
| `state/`              | gemeinsamer Zustand `Z` (`zustand.js`) und Aufbau der Angaben einer Familie (`angaben.js`)                         | nichts außer `state/`                   |
| `utils/`              | kleine Helfer ohne Zustand: Datum, Formatieren                                                                     | nichts                                  |
| `logic/`              | Regeln und Berechnungen: Leistungen, Fristen, Rechner, Antragstexte, Belegerkennung – ohne Oberfläche              | `config/`, `state/`, `utils/`, `logic/` |
| `services/`           | alles mit Außenwirkung: Speicher (Supabase/Browser), Anmeldung, PDFs, Texterkennung, Sicherung, Fehlerprotokoll    | alles außer `ui/pages/`                 |
| `i18n/`               | Übersetzungen der Oberfläche                                                                                       | `state/`                                |
| `ui/`                 | Oberfläche: `render.js` (Neuzeichnen), `bedienung.js` (Ereignisse), `pages/` (Seiten), `components/` (Bausteine)   | alles                                   |
| `ui/aktionen/`        | was ein Knopf tut: je Bereich eine Tabelle `Name → Funktion` für `data-act`, dazu `attribute.js` und `eingaben.js` | alles                                   |
| `main.js`, `start.js` | Einstieg und Startreihenfolge                                                                                      |                                         |
| `alle-module.js`      | sammelt alle Module für `window.__da` (Tests, Fehlersuche); ein Test prüft, dass keine Datei fehlt                 |                                         |

**Beträge für ein neues Jahr** stehen ausschließlich in `quelle/js/config/betraege.js`. Nach einer Änderung die Erwartungen in `tests/rechnungen.test.mjs` anpassen.

**Regeln für den Code**

- Jede Datei beginnt mit einem Kommentar, wofür sie da ist; öffentliche Funktionen haben eine kurze Beschreibung (JSDoc). Kommentare erklären das Warum.
- Jeder Programmteil importiert ausdrücklich, was er braucht. Werte, die mehrere Teile ändern, liegen im Zustand `Z` (`state/zustand.js`); danach zeichnet `render()` neu.
- Programmteile haben beim Laden keine Nebenwirkungen; was beim Start passieren muss, steht in einer Funktion und wird in `start.js` aufgerufen.
- Neuer Knopf: `data-act="name"` im HTML und ein Eintrag in der passenden Tabelle in `ui/aktionen/`. Doppelte Namen fallen beim Start auf.
- Neue Datei: in `alle-module.js` ergänzen (der Test meldet es sonst).
- Aussehen nur in `stil.css`; `style="…"` im JavaScript nur für Werte, die erst beim Zeichnen feststehen (z. B. Balkenbreiten).
- Keine neuen Abhängigkeiten ohne Absprache. Große Bibliotheken (jsPDF, pdf.js, Texterkennung) werden erst bei Bedarf geladen.

## Ablauf bei Änderungen

```
npm install          # einmalig
npm run formatieren  # Code einheitlich formatieren (Prettier)
npm test             # TypeScript, ESLint, Prettier, Bauen, Berechnungen, Oberfläche
npm run messen       # optional: Lighthouse-Messung, Ergebnis in werkzeuge/messung.json
```

1. Erst auf den Branch `test` schieben → erscheint unter `/test/` zum Ausprobieren
2. Dann auf `main` → erscheint in der echten App

Der Workflow `.github/workflows/pruefen-und-veroeffentlichen.yml` prüft bei jedem Push den Code (TypeScript, ESLint, Prettier), baut die App, führt alle Tests aus und veröffentlicht **nur, wenn alles grün ist** (Branch `gh-pages`). `wachhalten.yml` pingt die kostenlose Datenbank täglich.

## Datenbank (Supabase-Projekt `dein-anspruch`, Frankfurt)

Tabellen `fall`, `mitglied`, `einladung`, `belege`, `erinnerung`, `fehler`, `rueckmeldung`, alle mit Row Level Security. Privater Speicher `belege` (Ordner = Fall). Edge Function `erinnerungen` (täglich per pg_cron).

Einmalig in Supabase: Authentication → URL Configuration → Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**`.
