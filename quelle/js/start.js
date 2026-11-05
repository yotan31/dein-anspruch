// Startreihenfolge der App: Erst ergänzen die Programmteile ihre Daten (zusätzliche Anträge, Fragen),
// dann werden Sprache, Neuzeichnen, Bedienung, Speicher, Fehlerprotokoll und Installation verbunden,
// danach wird die Oberfläche das erste Mal gezeichnet und der Speicher geladen.
import { ergaenzeBefreiungsantrag, ergaenzeWiderspruch, verbindeAssistenten } from "./logic/antraege.js";
import { ladeSprache } from "./i18n/sprachen.js";
import { aktiviereSanftesNeuzeichnen } from "./ui/morph.js";
import { verbindeBedienung } from "./ui/bedienung.js";
import { initStore, startSpeicher } from "./services/speicher.js";
import { startFehlerprotokoll } from "./services/fehlerprotokoll.js";
import { startInstallation } from "./services/installieren.js";
import { render } from "./ui/render.js";

// Reihenfolge wie bisher: Befreiung (start03), Assistenten verbinden (start05), Widerspruch (start06).
// Der Widerspruch bringt seine Fragen selbst mit, deshalb muss er nicht vor verbindeAssistenten stehen.
ergaenzeBefreiungsantrag();
verbindeAssistenten();
ergaenzeWiderspruch();
ladeSprache();
aktiviereSanftesNeuzeichnen();
verbindeBedienung();
startSpeicher();
startFehlerprotokoll();
startInstallation();
render();
initStore();
