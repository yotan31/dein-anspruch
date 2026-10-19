"""Baut die App aus den Quelldateien.

    quelle/index.html   Seitengerüst (Kopf, Sicherheitsregeln, Grundaufbau)
    quelle/stil.css     Aussehen
    quelle/js/*.js      Programm, in der Reihenfolge der Dateinamen zusammengefügt

Ergebnis: site/index.html, site/app.css, site/app.js
Aufruf:   python3 quelle/bauen.py
"""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
Q, SITE = ROOT / "quelle", ROOT / "site"

teile = sorted((Q / "js").glob("*.js"))
js = "".join(p.read_text(encoding="utf-8") for p in teile)
css = (Q / "stil.css").read_text(encoding="utf-8")
html = (Q / "index.html").read_text(encoding="utf-8")

# Versionsnummer aus dem Inhalt: ändert sich bei jeder Änderung, damit Browser keine alte Fassung behalten
version = hashlib.sha1((js + css + html).encode("utf-8")).hexdigest()[:8]

(SITE / "app.js").write_text(js.replace("__APPVERSION__", version), encoding="utf-8")
(SITE / "app.css").write_text(css, encoding="utf-8")
(SITE / "index.html").write_text(html.replace("{{VERSION}}", version), encoding="utf-8")
print(f"gebaut: {len(teile)} Programmteile, Version {version}")
