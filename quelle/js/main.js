// Einstieg: lädt alle Programmteile in fester Reihenfolge.
import { Z } from "./zustand.js";
import * as m00 from "./00-betraege.js";
import * as m01 from "./01-grundlagen.js";
import * as m02 from "./02-leistungen.js";
import * as m03 from "./03-hilfsmittel.js";
import * as m04 from "./04-verhinderungspflege.js";
import * as m05 from "./05-assistent.js";
import * as m06 from "./06-bescheid-entlastung.js";
import * as m07 from "./07-pflegegrad-rechner.js";
import * as m08 from "./08-anbieter.js";
import * as m09 from "./09-sprachen.js";
import * as m10 from "./10-fragebogen-und-fristen.js";
import * as m11 from "./11-darstellung.js";
import * as m12 from "./12-reiter-ansprueche.js";
import * as m13 from "./13-reiter-belege.js";
import * as m14 from "./14-reiter-termine.js";
import * as m15 from "./15-pdf.js";
import * as m16 from "./16-belege-speichern.js";
import * as m17 from "./17-sammel-pdf.js";
import * as m18 from "./18-bedienung.js";
import * as m19 from "./19-speicher.js";
import * as m20 from "./20-anmeldung.js";
import * as m21 from "./21-sicherung-und-loeschen.js";
import * as m22 from "./22-erinnerungen.js";
import * as m23 from "./23-feedback-und-fehler.js";
import * as m24 from "./24-app-installieren.js";
import * as m99 from "./99-start.js";

// Zugang für die automatischen Tests und zur Fehlersuche im Browser (window.__da)
Object.defineProperty(globalThis, "__da", { value: Object.freeze(Object.assign({ Z }, m00, m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13, m14, m15, m16, m17, m18, m19, m20, m21, m22, m23, m24, m99)) });
