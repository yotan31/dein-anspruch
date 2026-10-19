# Dein Anspruch

Kostenlose Web-App für Menschen mit Pflegegrad oder Schwerbehinderung und ihre Angehörigen: zeigt offene Ansprüche (Stand 2026), füllt Anträge Schritt für Schritt aus, sammelt Belege und erinnert an Fristen.

- Echte App: https://yotan31.github.io/dein-anspruch/
- Testversion: https://yotan31.github.io/dein-anspruch/test/ (nutzt dieselbe Datenbank wie die echte App)

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `quelle/index.html` | Seitengerüst: Kopf, Sicherheitsregeln (CSP), Grundaufbau |
| `quelle/stil.css` | Aussehen |
| `quelle/js/01-…99-*.js` | Programm in Teilen, werden in Reihenfolge der Nummern zusammengefügt (z. B. `02-leistungen.js` = Leistungskatalog und Beträge 2026, `05-assistent.js` = Antrag-Assistent, `17-sammel-pdf.js`, `19-speicher.js` = Datenbank, `21-sicherung-und-loeschen.js`) |
| `quelle/bauen.py` | fügt alles zu `site/index.html`, `site/app.css`, `site/app.js` zusammen |
| `site/` | die veröffentlichte App, dazu Datenschutz, Nutzungsbedingungen, Impressum und `vendor/` (selbst gehostete Schriften, pdf.js, jsPDF) |
| `supabase/functions/` | Server-Funktionen (z. B. `konto-loeschen`) |
| `tests/` | automatische Tests (`app.test.mjs`) mit Test-PDF |

**Beträge für ein neues Jahr** stehen in `quelle/js/01-grundlagen.js` (Stammdaten) und `quelle/js/02-leistungen.js`.

## Ablauf bei Änderungen

1. Quelle ändern, `python3 quelle/bauen.py`, `node tests/app.test.mjs`
2. Erst auf den Branch `test` schieben → erscheint unter `/test/` zum Ausprobieren
3. Dann auf `main` → erscheint in der echten App

Der Workflow `.github/workflows/pruefen-und-veroeffentlichen.yml` baut die App bei jedem Push, führt die Tests aus und veröffentlicht **nur, wenn alle Tests grün sind** (Branch `gh-pages`). `wachhalten.yml` pingt die kostenlose Datenbank täglich.

## Datenbank (Supabase-Projekt `dein-anspruch`, Frankfurt)

Tabellen `fall`, `mitglied`, `einladung`, `belege`, `erinnerung`, `fehler`, `rueckmeldung`, alle mit Row Level Security. Privater Speicher `belege` (Ordner = Fall). Edge Function `erinnerungen` (täglich per pg_cron).

Einmalig in Supabase: Authentication → URL Configuration → Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**`.
