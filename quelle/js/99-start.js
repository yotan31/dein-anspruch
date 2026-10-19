// Start der App: erst alle Programmteile vorbereiten, dann Oberfläche zeichnen und Speicher verbinden.
import { start03 } from "./03-hilfsmittel.js";
import { start05 } from "./05-assistent.js";
import { start06 } from "./06-bescheid-entlastung.js";
import { start09 } from "./09-sprachen.js";
import { start11 } from "./11-darstellung.js";
import { start18 } from "./18-bedienung.js";
import { start19 } from "./19-speicher.js";
import { start23 } from "./23-feedback-und-fehler.js";
import { render } from "./11-darstellung.js";
import { initStore } from "./19-speicher.js";

start03();
start05();
start06();
start09();
start11();
start18();
start19();
start23();
render();
initStore();
