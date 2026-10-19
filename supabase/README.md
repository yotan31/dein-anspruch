# Datenbank und Server-Funktionen

Supabase-Projekt `dein-anspruch` (ref `ssamgluufgwsxvkyvaob`, Region Frankfurt).

## Datenbank neu aufsetzen

Die Dateien in `migrations/` in der Reihenfolge ihrer Nummern ausführen (z. B. mit der Supabase-CLI `supabase db push`). Stand 19.10.2026 entspricht der Inhalt genau der laufenden Datenbank (Tabellen, Zugriffsregeln, Funktionen, Trigger, Zeitpläne, Speicher-Bucket). Neue Änderungen bitte immer als neue Datei hier ablegen.

| Datei | Inhalt |
| --- | --- |
| `…_grundschema.sql` | erste Version: `faelle`, `belege`, Speicher-Bucket `belege`, `ping()` |
| `…_vorlagen_uebernahme.sql` | Übernahme vorbereiteter Daten bei der ersten Registrierung |
| `…_mehrere_personen_und_familie.sql` | `fall`, `mitglied`, `einladung`, Zugriffsregeln je Fall, Einladungen |
| `…_erinnerungen.sql` | E-Mail-Erinnerungen, Schema `intern`, täglicher Zeitplan |
| `…_fehler_rueckmeldung_indizes.sql` | Fehlerprotokoll, Feedback, Indizes, Aufräum-Zeitplan |

## Server-Funktionen (`functions/`)

| Funktion | Anmeldung nötig | Zweck |
| --- | --- | --- |
| `erinnerungen` | nein (prüft geheimen Header `x-cron-secret`) | verschickt täglich Frist-Erinnerungen über Brevo |
| `konto-loeschen` | ja | löscht nach Bestätigung Konto, eigene Fälle, Belege und Fotos |

Secrets für `erinnerungen` (im Supabase-Dashboard unter Edge Functions → Secrets): `BREVO_API_KEY`, `ABSENDER`.

## Einstellungen außerhalb der Dateien

- Authentication → URL Configuration: Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**`
- Google-Anmeldung (sobald eingerichtet): Provider Google mit Client-ID und Secret
