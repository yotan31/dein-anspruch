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
| `…_rueckmeldung_auswertung.sql` | Feedback mit Art (Idee, Fehler, Lob), Bereich der App und Stand der Bearbeitung (neu, geplant, erledigt, abgelehnt); Nutzer dürfen nur senden |

## Server-Funktionen (`functions/`)

| Funktion | Anmeldung nötig | Zweck |
| --- | --- | --- |
| `erinnerungen` | nein (prüft geheimen Header `x-cron-secret`) | verschickt täglich Frist-Erinnerungen über Brevo |
| `konto-loeschen` | ja | löscht nach Bestätigung Konto, eigene Fälle, Belege und Fotos |

Secrets für `erinnerungen` (im Supabase-Dashboard unter Edge Functions → Secrets): `BREVO_API_KEY`, `ABSENDER`.

## Einstellungen außerhalb der Dateien

- Authentication → URL Configuration: Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**`
- Google-Anmeldung (sobald eingerichtet): Provider Google mit Client-ID und Secret

## Rückmeldungen auswerten

Der Knopf „App verbessern“ (Glühbirne oben rechts) speichert Nachrichten in `rueckmeldung` mit `art` und `bereich` (z. B. `antrag:pg_antrag`, `ansprueche:entlastung`). Einmal im Monat (am 1., 8:43 Uhr) startet eine geplante Claude-Sitzung, die alle neuen Rückmeldungen nach Themen zusammenfasst. Was entschieden wird, steht danach in `stand`, `notiz` und `bewertet_am`.
