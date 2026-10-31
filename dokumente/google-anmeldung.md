# Anmeldung mit Google einrichten

Dauer: etwa 15 Minuten. Kosten: keine. Du brauchst ein Google-Konto und den Zugang zum Supabase-Dashboard.

**Wichtig:** Schick mir das **Client-Secret nicht im Chat**. Du trägst es selbst in Supabase ein (Schritt 4).

## Schritt 1: Projekt bei Google anlegen

1. Öffne https://console.cloud.google.com und melde dich mit deinem Google-Konto an.
2. Oben links auf die **Projektauswahl** klicken → **Neues Projekt**.
3. Name: **Dein Anspruch** → **Erstellen**. Danach sicherstellen, dass oben dieses Projekt ausgewählt ist.

## Schritt 2: Zustimmungsbildschirm einrichten

Das ist das Fenster, das Nutzer bei der Anmeldung mit Google sehen.

1. Im Menü links: **APIs & Dienste** → **OAuth-Zustimmungsbildschirm** (heißt je nach Ansicht auch „Google Auth Platform“) → **Jetzt starten**.
2. **App-Informationen:** App-Name **Dein Anspruch**, Nutzersupport-E-Mail: deine App-E-Mail-Adresse.
3. **Zielgruppe:** **Extern**.
4. **Kontaktdaten:** wieder deine App-E-Mail-Adresse. Den Bedingungen zustimmen → **Erstellen**.
5. Unter **Branding** (falls abgefragt) eintragen:
   - Startseite der App: `https://yotan31.github.io/dein-anspruch/`
   - Datenschutzerklärung: `https://yotan31.github.io/dein-anspruch/datenschutz.html`
   - Nutzungsbedingungen: `https://yotan31.github.io/dein-anspruch/nutzungsbedingungen.html`
   - Autorisierte Domain: `supabase.co`
   - Ein Logo nicht hochladen: Mit Logo will Google die App erst prüfen, das dauert Tage.
6. Unter **Datenzugriff** nur die drei Standard-Berechtigungen auswählen: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
7. Unter **Zielgruppe** auf **App veröffentlichen** klicken. Sonst können sich nur eingetragene Testpersonen anmelden.

## Schritt 3: Zugangsdaten erstellen

1. Links: **Clients** (oder **APIs & Dienste** → **Anmeldedaten**) → **Client erstellen** bzw. **Anmeldedaten erstellen → OAuth-Client-ID**.
2. Anwendungstyp: **Webanwendung**, Name: **Dein Anspruch Web**.
3. **Autorisierte JavaScript-Quellen:** `https://yotan31.github.io`
4. **Autorisierte Weiterleitungs-URIs:** `https://ssamgluufgwsxvkyvaob.supabase.co/auth/v1/callback`
5. **Erstellen**. Es erscheinen **Client-ID** und **Clientschlüssel (Client-Secret)**. Fenster offen lassen oder die JSON-Datei herunterladen.

## Schritt 4: In Supabase eintragen

1. Öffne https://supabase.com/dashboard → Projekt **dein-anspruch**.
2. Links: **Authentication** → **Sign In / Providers** (bzw. **Providers**) → **Google**.
3. **Enable Sign in with Google** einschalten.
4. **Client ID** und **Client Secret** aus Schritt 3 einfügen → **Save**.
5. Kontrolle unter **Authentication → URL Configuration**: Site URL und Redirect URL `https://yotan31.github.io/dein-anspruch/**` sind schon eingetragen. Bitte nichts ändern.

## Schritt 5: Bescheid sagen

Schreib mir „Google ist eingerichtet“. Ich schalte dann den Knopf **„Mit Google anmelden“** in der App wieder ein, teste ihn zuerst in der Testversion und erst danach in der echten App.
