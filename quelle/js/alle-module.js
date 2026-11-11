// Sammelt alle Programmteile an einer Stelle. Daraus entstehen window.__da (Zugriff für Tests und Fehlersuche)
// und das Paket für die Rechen-Tests (tests/lade-app.mjs). Neue Datei? Hier eintragen – ein Test prüft, dass keine fehlt.
import * as m_config_betraege from "./config/betraege.js";
import * as m_config_stammdaten from "./config/stammdaten.js";
import * as m_config_supabase from "./config/supabase.js";
import * as m_config_version from "./config/version.js";
import * as m_i18n_sprachen from "./i18n/sprachen.js";
import * as m_i18n_uebersetzungen from "./i18n/uebersetzungen.js";
import * as m_logic_antraege from "./logic/antraege.js";
import * as m_logic_antragstext from "./logic/antragstext.js";
import * as m_logic_belege from "./logic/belege.js";
import * as m_logic_belegerkennung from "./logic/belegerkennung.js";
import * as m_logic_bescheid from "./logic/bescheid.js";
import * as m_logic_entlastung from "./logic/entlastung.js";
import * as m_logic_fragebogen from "./logic/fragebogen.js";
import * as m_logic_folgebriefe from "./logic/folgebriefe.js";
import * as m_logic_fristen from "./logic/fristen.js";
import * as m_logic_gutachter from "./logic/gutachter.js";
import * as m_logic_kinder from "./logic/kinder.js";
import * as m_logic_lage from "./logic/lage.js";
import * as m_logic_leistungen from "./logic/leistungen.js";
import * as m_logic_rechner from "./logic/rechner.js";
import * as m_logic_verhinderungspflege from "./logic/verhinderungspflege.js";
import * as m_services_anmeldung from "./services/anmeldung.js";
import * as m_services_belege from "./services/belege.js";
import * as m_services_bescheid from "./services/bescheid.js";
import * as m_services_dokumente from "./services/dokumente.js";
import * as m_services_erinnerungen from "./services/erinnerungen.js";
import * as m_services_feedback from "./services/feedback.js";
import * as m_services_fehlerprotokoll from "./services/fehlerprotokoll.js";
import * as m_services_installieren from "./services/installieren.js";
import * as m_services_lokal from "./services/lokal.js";
import * as m_services_pdf_import from "./services/pdf-import.js";
import * as m_services_pdf from "./services/pdf.js";
import * as m_services_sicherung from "./services/sicherung.js";
import * as m_services_speicher from "./services/speicher.js";
import * as m_services_zaehlung from "./services/zaehlung.js";
import * as m_state_angaben from "./state/angaben.js";
import * as m_state_zustand from "./state/zustand.js";
import * as m_ui_aktionen_antrag from "./ui/aktionen/antrag.js";
import * as m_ui_aktionen_attribute from "./ui/aktionen/attribute.js";
import * as m_ui_aktionen_belege from "./ui/aktionen/belege.js";
import * as m_ui_aktionen_bescheid from "./ui/aktionen/bescheid.js";
import * as m_ui_aktionen_daten from "./ui/aktionen/daten.js";
import * as m_ui_aktionen_eingaben from "./ui/aktionen/eingaben.js";
import * as m_ui_aktionen_fragebogen from "./ui/aktionen/fragebogen.js";
import * as m_ui_aktionen_hilfe from "./ui/aktionen/hilfe.js";
import * as m_ui_aktionen_konto from "./ui/aktionen/konto.js";
import * as m_ui_aktionen_personen from "./ui/aktionen/personen.js";
import * as m_ui_aktionen_rechner from "./ui/aktionen/rechner.js";
import * as m_ui_aktionen_termine from "./ui/aktionen/termine.js";
import * as m_ui_bedienung from "./ui/bedienung.js";
import * as m_ui_components_anbieter from "./ui/components/anbieter.js";
import * as m_ui_components_bescheid_karte from "./ui/components/bescheid-karte.js";
import * as m_ui_components_datenbox from "./ui/components/datenbox.js";
import * as m_ui_components_entlastung_karte from "./ui/components/entlastung-karte.js";
import * as m_ui_components_erinnerung_karte from "./ui/components/erinnerung-karte.js";
import * as m_ui_components_feedback_fenster from "./ui/components/feedback-fenster.js";
import * as m_ui_components_fenster from "./ui/components/fenster.js";
import * as m_ui_components_fragen from "./ui/components/fragen.js";
import * as m_ui_components_install_karte from "./ui/components/install-karte.js";
import * as m_ui_components_vollmacht_knopf from "./ui/components/vollmacht-knopf.js";
import * as m_ui_hinweise from "./ui/hinweise.js";
import * as m_ui_kopf from "./ui/kopf.js";
import * as m_ui_morph from "./ui/morph.js";
import * as m_ui_pages_anmeldung from "./ui/pages/anmeldung.js";
import * as m_ui_pages_ansprueche from "./ui/pages/ansprueche.js";
import * as m_ui_pages_assistent from "./ui/pages/assistent.js";
import * as m_ui_pages_belege from "./ui/pages/belege.js";
import * as m_ui_pages_einwilligung from "./ui/pages/einwilligung.js";
import * as m_ui_pages_fragebogen from "./ui/pages/fragebogen.js";
import * as m_ui_pages_personen from "./ui/pages/personen.js";
import * as m_ui_pages_rechner from "./ui/pages/rechner.js";
import * as m_ui_pages_sammel_pdf from "./ui/pages/sammel-pdf.js";
import * as m_ui_pages_startseite from "./ui/pages/startseite.js";
import * as m_ui_pages_termine from "./ui/pages/termine.js";
import * as m_ui_render from "./ui/render.js";
import * as m_ui_symbole from "./ui/symbole.js";
import * as m_utils_datum from "./utils/datum.js";
import * as m_utils_format from "./utils/format.js";

// Alle exportierten Namen unter einem Objekt; die Namen sind projektweit eindeutig.
Object.defineProperty(globalThis, "__da", {
  value: Object.freeze(
    Object.assign(
      {},
      m_config_betraege,
      m_config_stammdaten,
      m_config_supabase,
      m_config_version,
      m_i18n_sprachen,
      m_i18n_uebersetzungen,
      m_logic_antraege,
      m_logic_antragstext,
      m_logic_belege,
      m_logic_belegerkennung,
      m_logic_bescheid,
      m_logic_entlastung,
      m_logic_fragebogen,
      m_logic_folgebriefe,
      m_logic_fristen,
      m_logic_gutachter,
      m_logic_kinder,
      m_logic_lage,
      m_logic_leistungen,
      m_logic_rechner,
      m_logic_verhinderungspflege,
      m_services_anmeldung,
      m_services_belege,
      m_services_bescheid,
      m_services_dokumente,
      m_services_erinnerungen,
      m_services_feedback,
      m_services_fehlerprotokoll,
      m_services_installieren,
      m_services_lokal,
      m_services_pdf_import,
      m_services_pdf,
      m_services_sicherung,
      m_services_speicher,
      m_services_zaehlung,
      m_state_angaben,
      m_state_zustand,
      m_ui_aktionen_antrag,
      m_ui_aktionen_attribute,
      m_ui_aktionen_belege,
      m_ui_aktionen_bescheid,
      m_ui_aktionen_daten,
      m_ui_aktionen_eingaben,
      m_ui_aktionen_fragebogen,
      m_ui_aktionen_hilfe,
      m_ui_aktionen_konto,
      m_ui_aktionen_personen,
      m_ui_aktionen_rechner,
      m_ui_aktionen_termine,
      m_ui_bedienung,
      m_ui_components_anbieter,
      m_ui_components_bescheid_karte,
      m_ui_components_datenbox,
      m_ui_components_entlastung_karte,
      m_ui_components_erinnerung_karte,
      m_ui_components_feedback_fenster,
      m_ui_components_fenster,
      m_ui_components_fragen,
      m_ui_components_install_karte,
      m_ui_components_vollmacht_knopf,
      m_ui_hinweise,
      m_ui_kopf,
      m_ui_morph,
      m_ui_pages_anmeldung,
      m_ui_pages_ansprueche,
      m_ui_pages_assistent,
      m_ui_pages_belege,
      m_ui_pages_einwilligung,
      m_ui_pages_fragebogen,
      m_ui_pages_personen,
      m_ui_pages_rechner,
      m_ui_pages_sammel_pdf,
      m_ui_pages_startseite,
      m_ui_pages_termine,
      m_ui_render,
      m_ui_symbole,
      m_utils_datum,
      m_utils_format,
    ),
  ),
});
