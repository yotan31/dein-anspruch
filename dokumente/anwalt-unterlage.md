# Rechtliche Prüfung der Web-App „Dein Anspruch“

**Unterlage für die Beratung · Stand: 31.10.2026**
**Anbieter:** [Name], Privatperson · **Kontakt:** [E-Mail]
**App:** https://yotan31.github.io/dein-anspruch/ · Testversion: https://yotan31.github.io/dein-anspruch/test/

## 1. Was die App ist

„Dein Anspruch“ ist eine kostenlose Web-App ohne Werbung für Menschen mit Pflegegrad oder Schwerbehinderung und für pflegende Angehörige. Sie wird von mir als Privatperson betrieben, nicht gewerblich, ohne Einnahmen. Geplant ist, sie im persönlichen Umfeld, in Online-Gruppen für pflegende Angehörige und später bei Beratungsstellen bekannt zu machen.

Die App

1. fragt in einem Fragebogen die Lage ab (Rolle, Krankenkasse, Pflegegrad, Wohnsituation, Schwerbehinderung, bereits genutzte Leistungen),
2. zeigt daraus die Leistungen, die nach Gesetz in Frage kommen, mit Beträgen nach der Leistungsübersicht 2026 (SGB XI, SGB V, SGB IX, EStG),
3. erstellt auf Wunsch einen **formlosen Antrag aus einer Vorlage** (Text oder PDF). Die Nutzerin oder der Nutzer beantwortet einfache Fragen, die Antworten werden in den Text eingesetzt. **Die App schickt nichts selbst ab und handelt nicht im Namen der Nutzer** (keine Vollmacht),
4. liest einen Pflegegrad-Bescheid aus (Foto oder Abtippen), berechnet die Widerspruchsfrist und zeigt Hinweise für einen möglichen Widerspruch,
5. enthält einen Pflegegrad-Rechner (Selbsteinschätzung nach dem Punktesystem des § 15 SGB XI),
6. verwaltet Belege (Fotos von Quittungen) und erinnert an Fristen, auf Wunsch per E-Mail.

## 2. Fragen zur Rechtsdienstleistung (RDG)

**Frage 1:** Ist eine der folgenden Funktionen eine Rechtsdienstleistung nach § 2 RDG? Falls ja: Wie müssen die Texte geändert werden, damit die App zulässig ist?

Meine Annahme: Das Erzeugen von Schreiben aus Vorlagen ist nach BGH, Urteil vom 9.9.2021, I ZR 113/20 („Smartlaw“) keine Rechtsdienstleistung. Bei der Bescheid-Auswertung bin ich unsicher.

Konkrete Textstellen in der App:

- **Liste der Ansprüche:** Überschrift „Noch offen pro Jahr“ mit einem Eurobetrag, darunter je Leistung eine kurze Erklärung, zum Beispiel: „131 € im Monat (1.572 € im Jahr) für Haushaltshilfe, Alltagsbegleitung, Tagespflege oder Kurzzeitpflege. Wird als Erstattung gegen Rechnung gezahlt.“ Leistungen, die nur je nach Lage passen, sind als „je nach Lage“ markiert.
- **Antragstexte:** Jeder Antrag endet mit: „Bitte bestätigen Sie mir den Eingang dieses Antrags. … Dieses Schreiben gilt als fristwahrende Antragstellung (§ 16 SGB I).“
- **Bescheid-Auswertung** (wenn der Antrag abgelehnt wurde oder bis zum nächsten Pflegegrad nur wenige Punkte fehlen): „Hinweis für einen möglichen Widerspruch: Bis zum nächsten Pflegegrad fehlen nur wenige Punkte. Frist: [Datum]. Ob ein Widerspruch im Einzelfall Erfolg hat, kann nur eine Beratung klären, zum Beispiel der Pflegestützpunkt, ein Sozialverband oder eine Anwältin für Sozialrecht.“
- **Widerspruch-Vorlage:** Die Nutzerin kreuzt an, was im Gutachten zu niedrig bewertet wurde. Daraus entsteht ein Widerspruchsschreiben mit Bitte um das Gutachten und um eine neue Begutachtung.
- **Pflegegrad-Rechner:** „Geschätzt [x] von 100 Punkten. … Das ist eine Schätzung. Die Entscheidung trifft der Medizinische Dienst bei einem Hausbesuch.“
- **Hinweise überall:** Fußzeile „Diese App ersetzt keine Rechtsberatung. Kostenlose, unabhängige Hilfe gibt es bei den Pflegestützpunkten, der Pflegeberatung deiner Pflegekasse (§ 7a SGB XI) und der EUTB-Teilhabeberatung.“ Dazu Abschnitt 2 der Nutzungsbedingungen.

## 3. Fragen zum Impressum

**Frage 2:** Brauche ich für eine kostenlose, nicht gewerbliche App, die öffentlich beworben wird, ein Impressum nach § 5 DDG?

**Frage 3:** Reicht dafür eine c/o-Adresse bei einem Anschriften-Dienst, der Post annimmt und weiterleitet, statt meiner Wohnadresse? Reicht dieselbe Adresse für die Angaben zum Verantwortlichen in der Datenschutzerklärung (Art. 13 DSGVO)?

## 4. Fragen zum Datenschutz

Die App verarbeitet **Gesundheitsdaten** (Pflegegrad, Grad der Behinderung, Hilfebedarf, Belege). Aufbau:

- **Mit Konto:** Speicherung bei Supabase (Datenbank und Fotospeicher in Frankfurt am Main). Vor der ersten Nutzung gibt es eine ausdrückliche Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO, gespeichert mit Datum. Zugriff nur für die Person selbst und von ihr eingeladene Familienmitglieder (technisch abgesichert durch Row Level Security). Konto mit allen Daten jederzeit selbst löschbar.
- **Ohne Konto:** Angaben bleiben nur im Browser (localStorage), nichts geht an den Server.
- **Auslieferung der Webseite:** GitHub Pages (GitHub Inc., USA). Schriften und Programmteile liegen auf dem eigenen Server, keine Google Fonts, keine Cookies.
- **E-Mail-Erinnerungen** (freiwillig): Versand über Brevo (Sendinblue GmbH, Berlin) als Auftragsverarbeiter. Übermittelt werden nur E-Mail-Adresse und Erinnerungstext.
- **Fehlerprotokoll:** kurze Fehlermeldung ohne E-Mail-Adressen und lange Zahlen, Browser-Kennung, nach 90 Tagen gelöscht.
- **Rückmeldungen** über „App verbessern“: Text, Art, Bereich der App, freiwillige E-Mail. **Einmal im Monat fasst ein KI-Assistent (Claude von Anthropic, USA) die Texte ohne E-Mail-Adressen zusammen.**
- **Anonyme Schritt-Zählung:** Gezählt wird nur „Monat, Schritt, Anzahl“ (z. B. „Oktober, Antrag fertig, Pflegegrad beantragen: 12“). Keine Kennung, keine Uhrzeit, keine Cookies, nichts auf dem Gerät. Rechtsgrundlage: berechtigtes Interesse.

**Frage 4:** Reichen Einwilligung und Datenschutzerklärung in dieser Form? Welche Verträge brauche ich (Auftragsverarbeitung mit Supabase, Brevo, GitHub)? Wie sieht es mit der Übermittlung in die USA aus (GitHub Pages, Anthropic für die Auswertung der Rückmeldungen)?

**Frage 5:** Ist die anonyme Schritt-Zählung ohne Einwilligung und ohne Cookie-Banner zulässig (DSGVO und § 25 TDDDG)?

**Frage 6:** Brauche ich eine Datenschutz-Folgenabschätzung (Art. 35 DSGVO), weil Gesundheitsdaten verarbeitet werden? Falls ja: Ist sie für ein kleines, privates Angebot verhältnismäßig umsetzbar?

## 5. Fragen zur Haftung

Die Beträge und Fristen stammen aus Gesetz und Leistungsübersicht 2026 und werden mit automatischen Tests geprüft. Trotzdem kann ein Fehler passieren, zum Beispiel ein falscher Betrag oder eine nicht angezeigte Frist. Abschnitt 5 der Nutzungsbedingungen beschränkt die Haftung bei leichter Fahrlässigkeit, für Entscheidungen von Kassen und Behörden und für versäumte Fristen, soweit gesetzlich zulässig.

**Frage 7:** Ist diese Haftungsregel für eine kostenlose App wirksam? Was sollte ich ergänzen?

**Frage 8:** Ist eine private Haftpflicht- oder Vermögensschadenversicherung für so ein Angebot sinnvoll oder nötig?

## 6. Was ich mir von der Beratung wünsche

- Eine kurze schriftliche Einschätzung zu den Fragen 1 bis 8.
- Bei Frage 1: konkrete Formulierungen, die ich ändern muss.
- Eine Einschätzung, ob ich die App danach öffentlich (Online-Gruppen, Beratungsstellen) bekannt machen kann.

Beigefügt bzw. online: Datenschutzerklärung, Nutzungsbedingungen, Impressum (noch mit Platzhaltern), Zugang zur Testversion.
