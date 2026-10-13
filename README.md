# Dein Anspruch

Kostenlose Web-App für Menschen mit Pflegegrad oder Schwerbehinderung und ihre Angehörigen: zeigt offene Ansprüche (Stand 2026), füllt Anträge Schritt für Schritt aus, sammelt Belege und erinnert an Fristen.

- Oberfläche: `index.html`, Logik: `app.js` (ohne Build-Schritt, läuft direkt auf GitHub Pages)
- Datenbank: eigenes Supabase-Projekt `dein-anspruch` (Frankfurt), Tabellen `faelle` und `belege`, privater Speicher `belege`, Zugriff nur aufs eigene Konto (Row Level Security)
- `.github/workflows/wachhalten.yml` pingt die Datenbank täglich, damit das kostenlose Projekt nicht pausiert

## Einmalig in Supabase einstellen
Authentication → URL Configuration:
- Site URL: Adresse dieser Seite (z. B. `https://yotan31.github.io/dein-anspruch/`)
- Redirect URLs: dieselbe Adresse
