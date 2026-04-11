// ============================
// Internationalization (i18n)
// ============================
window.I18n = {
  currentLocale: 'en',

  translations: {
    en: {
      login: {
        subtitle: 'Geographic project management platform',
        google: 'Sign in with Google',
        feature1: 'Interactive Maps',
        feature2: 'Custom Markers',
        feature3: 'Project Management'
      },
      dashboard: {
        selectProject: 'Select Project',
        manageProjects: 'Manage Projects'
      },
      menu: {
        theme: 'Theme',
        language: 'Language',
        logout: 'Logout'
      },
      sidebar: {
        markers: 'Markers',
        search: 'Search markers...',
        noMarkers: 'No markers yet'
      },
      filter: {
        allStatus: 'All Status',
        active: 'Active',
        inactive: 'Inactive',
        maintenance: 'Maintenance',
        allCondition: 'All Conditions',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        critical: 'Critical'
      },
      stats: {
        total: 'Total',
        active: 'Active',
        maintenance: 'Maint.'
      },
      map: {
        searchLocation: 'Search location...',
        selectProjectFirst: 'Select a project to begin',
        selectProjectHint: 'Choose or create a project from the header',
        clickToPlace: 'Click on the map to place a marker',
        cacheInfo: 'Cached tiles available'
      },
      marker: {
        add: 'Add Marker',
        edit: 'Edit Marker',
        title: 'Title',
        lat: 'Latitude',
        lng: 'Longitude',
        icon: 'Icon',
        observations: 'Observations',
        status: 'Status',
        condition: 'Condition',
        priority: 'Priority',
        responsible: 'Responsible',
        cost: 'Cost',
        installDate: 'Installation Date',
        maintenanceDate: 'Maintenance Date',
        repairDate: 'Repair Date',
        warrantyDate: 'Warranty Expiry',
        images: 'Images',
        uploadImage: 'Upload'
      },
      projects: {
        manage: 'Manage Projects',
        newName: 'New project name...',
        create: 'Create',
        chooseAvatar: 'Choose avatar:',
        markerCount: '{count} markers',
        created: 'Created {date}',
        confirmDelete: 'Delete project "{name}" and all its markers?',
        myProjects: 'My Projects',
        sharedWithMe: 'Shared with me',
        publicProjects: 'Public Projects',
        members: 'Members',
        owner: 'Owner',
        noMembers: 'No members invited',
        invite: 'Invite',
        removeMember: 'Remove this member?',
        roleUpdated: 'Role updated',
        invited: '{email} invited as {role}'
      },
      view: {
        all: 'All',
        inView: 'In view',
        addMarkerHere: 'Add marker here',
        more: 'More...'
      },
      roles: {
        admin: 'admin',
        viewer: 'viewer',
        owner: 'owner',
        super: 'SUPER'
      },
      picker: {
        general: 'General',
        firefighter: 'Firefighter',
        signs: 'Signs',
        custom: 'Custom',
        hydrants: 'Hydrants',
        waterSources: 'Water Sources',
        equipment: 'Equipment',
        alarms: 'Alarms & Systems',
        locations: 'Special Locations'
      },
      markerActions: {
        edit: 'Edit',
        move: 'Move',
        delete: 'Delete',
        dragToMove: 'Drag marker to desired position',
        savePosition: 'Save',
        cancelMove: 'Cancel',
        positionSaved: 'Position saved!',
        activate: 'Activate',
        deactivate: 'Deactivate'
      },
      access: {
        restricted: 'Access Restricted',
        restrictedMsg: 'Your account ({email}) does not have access to the platform.',
        sendRequest: 'Send Request',
        requestSent: 'Request sent! You will be contacted.',
        expired: 'Subscription Expired',
        expiredMsg: 'Your subscription expired on {date}. Contact the admin for renewal.',
        requestRenewal: 'Request Renewal',
        renewalSent: 'Request sent!'
      },
      admin: {
        panel: 'Admin Panel',
        users: 'Users',
        messages: 'Messages',
        settings: 'Settings',
        apiUsage: 'API Usage',
        whitelist: 'Whitelist (allowed email addresses)',
        addToWhitelist: 'Add',
        active: 'Active',
        unconfirmed: 'Unconfirmed',
        confirmed: 'Confirmed',
        allMessages: 'All',
        noMessages: 'No messages',
        userUpdated: 'User updated',
        addedToWhitelist: 'Added to whitelist',
        typeDeleted: 'Type deleted',
        settingsSaved: 'Settings saved!',
        apiLimitLabel: 'Daily API limit per user',
        monthlyLimitLabel: 'Monthly API limit per user',
        adIntervalLabel: 'Ad Splash Interval (minutes)',
        adDurationLabel: 'Ad Splash Duration (seconds)',
        videoUrlLabel: 'Promo Video URL',
        videoUrlsLabel: 'Promo Video URLs (one per line)',
        adFreeExtLabel: 'Ad-free extension (minutes)',
        monthlyQuotaMaps: 'Monthly Maps Quota',
        monthlyQuotaGeocode: 'Monthly Geocode Quota',
        saveSettings: 'Save Settings',
        topUsers: 'Top Users',
        dailyLog: 'Daily Log',
        apiLog: 'API Log',
        mapsLoadQuota: 'Maps Load',
        geocodeQuota: 'Geocoding',
        costThisMonth: 'Cost this month',
        used: 'used',
        remaining: 'remaining',
        dailyQuota: 'Daily',
        monthlyQuota: 'Monthly',
        actions: 'Actions',
        time: 'Time',
        keySource: 'Key',
        resetAllDaily: 'Reset Daily (all)',
        resetAllMonthly: 'Reset Monthly (all)',
        confirmResetAllDaily: 'Reset daily quota for all users?',
        confirmResetAllMonthly: 'Reset monthly quota for all users?'
      },
      common: {
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        confirm: 'Confirm',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        name: 'Name',
        message: 'Message',
        logout: 'Logout'
      },
      ads: {
        watchSubscribe: 'Watch and subscribe',
        splashTitle: 'DSIP MapManager',
        splashMsg: 'Play the video to use the app ad-free',
        playToExtend: 'Play the video to get ad-free access',
        continue: 'Continue',
        thankYou: 'Thank you! Ad-free until {time}'
      },
      userKeys: {
        title: 'API Keys',
        description: 'Use your own Google Maps API key to bypass system rate limits. Your usage will be billed to your own Google Cloud account.',
        mapsKey: 'Google Maps API Key',
        usingCustom: 'Using your API key',
        usingSystem: 'Using system API key',
        inactive: 'Key deactivated',
        activate: 'Activate',
        deactivate: 'Deactivate',
        saved: 'API key saved',
        deleted: 'API key removed',
        confirmDelete: 'Remove your API key? You will return to system limits.',
        reloadRequired: 'Changes take effect after page reload.',
        howToTitle: 'How to set up your own key:',
        step1: 'Go to Google Cloud Console',
        step2: 'Create a project, enable Maps JavaScript API + Geocoding API',
        step3: 'Create an API Key',
        step4: 'Add maps.djooga.com/* to HTTP referrer restrictions',
        step5: 'Paste the key above and save'
      },
      pdf: {
        export: 'Export PDF',
        title: 'Marker Report',
        project: 'Project',
        generated: 'Generated',
        filters: 'Applied Filters',
        status: 'Status',
        condition: 'Condition',
        search: 'Search',
        all: 'All',
        markerList: 'Marker List',
        noMarkers: 'No markers match the current filters'
      },
      quota: {
        daily: 'Daily Quota',
        monthly: 'Monthly Quota',
        remaining: 'remaining',
        noLimits: 'No system limits applied',
        todayBreakdown: 'Today\'s breakdown',
        readOnly: 'Quota exceeded — map in view-only mode',
        searchBlocked: 'Search disabled — quota exceeded',
        dailyReached: 'Daily Limit Reached',
        monthlyReached: 'Monthly Limit Reached',
        dailyMsg: 'Maps will be available again tomorrow.',
        monthlyMsg: 'Monthly API limit reached. Contact the administrator.'
      },
      toast: {
        projectCreated: 'Project created!',
        projectDeleted: 'Project deleted',
        markerSaved: 'Marker saved!',
        markerDeleted: 'Marker deleted',
        settingsSaved: 'Settings saved',
        errorGeneric: 'Something went wrong',
        locationNotFound: 'Location not found: "{query}"',
        mapNotReady: 'Map not loaded yet. Try again.'
      }
    },

    ro: {
      login: {
        subtitle: 'Platformă de management geografic al proiectelor',
        google: 'Conectare cu Google',
        feature1: 'Hărți Interactive',
        feature2: 'Markere Personalizate',
        feature3: 'Management Proiecte'
      },
      dashboard: {
        selectProject: 'Selectează Proiect',
        manageProjects: 'Administrare Proiecte'
      },
      menu: {
        theme: 'Temă',
        language: 'Limbă',
        logout: 'Deconectare'
      },
      sidebar: {
        markers: 'Markere',
        search: 'Caută markere...',
        noMarkers: 'Niciun marker încă'
      },
      filter: {
        allStatus: 'Toate Stările',
        active: 'Activ',
        inactive: 'Inactiv',
        maintenance: 'Mentenanță',
        allCondition: 'Toate Condițiile',
        good: 'Bun',
        fair: 'Acceptabil',
        poor: 'Slab',
        critical: 'Critic'
      },
      stats: {
        total: 'Total',
        active: 'Active',
        maintenance: 'Mnt.'
      },
      map: {
        searchLocation: 'Caută locație...',
        selectProjectFirst: 'Selectează un proiect pentru a începe',
        selectProjectHint: 'Alege sau creează un proiect din antet',
        clickToPlace: 'Click pe hartă pentru a plasa un marker',
        cacheInfo: 'Tile-uri din cache disponibile'
      },
      marker: {
        add: 'Adaugă Marker',
        edit: 'Editează Marker',
        title: 'Titlu',
        lat: 'Latitudine',
        lng: 'Longitudine',
        icon: 'Iconiță',
        observations: 'Observații',
        status: 'Stare',
        condition: 'Condiție',
        priority: 'Prioritate',
        responsible: 'Responsabil',
        cost: 'Cost',
        installDate: 'Data Instalării',
        maintenanceDate: 'Data Mentenanței',
        repairDate: 'Data Reparației',
        warrantyDate: 'Expirare Garanție',
        images: 'Imagini',
        uploadImage: 'Încarcă'
      },
      projects: {
        manage: 'Administrare Proiecte',
        newName: 'Numele noului proiect...',
        create: 'Creează',
        chooseAvatar: 'Alege avatar:',
        markerCount: '{count} markere',
        created: 'Creat {date}',
        confirmDelete: 'Ștergi proiectul "{name}" și toate markerele sale?',
        myProjects: 'Proiectele mele',
        sharedWithMe: 'Partajate cu mine',
        publicProjects: 'Proiecte Publice',
        members: 'Membrii',
        owner: 'Proprietar',
        noMembers: 'Niciun membru invitat',
        invite: 'Invită',
        removeMember: 'Elimini acest membru?',
        roleUpdated: 'Rol actualizat',
        invited: '{email} invitat ca {role}'
      },
      view: {
        all: 'Toți',
        inView: 'În zonă',
        addMarkerHere: 'Adaugă marker aici',
        more: 'Mai multe...'
      },
      roles: {
        admin: 'admin',
        viewer: 'vizualizare',
        owner: 'proprietar',
        super: 'SUPER'
      },
      picker: {
        general: 'General',
        firefighter: 'Pompieri',
        signs: 'Semne',
        custom: 'Custom',
        hydrants: 'Hidranți',
        waterSources: 'Surse Apă',
        equipment: 'Echipament',
        alarms: 'Alarme & Sisteme',
        locations: 'Locații Speciale'
      },
      markerActions: {
        edit: 'Editează',
        move: 'Mută',
        delete: 'Șterge',
        dragToMove: 'Trage marker-ul pe poziția dorită',
        savePosition: 'Salvează',
        cancelMove: 'Anulează',
        positionSaved: 'Poziție salvată!',
        activate: 'Activează',
        deactivate: 'Dezactivează'
      },
      access: {
        restricted: 'Acces Restricționat',
        restrictedMsg: 'Contul tău ({email}) nu are acces la platformă.',
        sendRequest: 'Trimite Cerere',
        requestSent: 'Cererea a fost trimisă! Vei fi contactat.',
        expired: 'Abonament Expirat',
        expiredMsg: 'Abonamentul tău a expirat pe {date}. Contactează administratorul.',
        requestRenewal: 'Solicită Reînnoire',
        renewalSent: 'Cererea a fost trimisă!'
      },
      admin: {
        panel: 'Panou Admin',
        users: 'Utilizatori',
        messages: 'Mesaje',
        settings: 'Setări',
        apiUsage: 'Consum API',
        whitelist: 'Whitelist (adrese permise)',
        addToWhitelist: 'Adaugă',
        active: 'Activ',
        unconfirmed: 'Neconfirmate',
        confirmed: 'Confirmate',
        allMessages: 'Toate',
        noMessages: 'Niciun mesaj',
        userUpdated: 'Utilizator actualizat',
        addedToWhitelist: 'Adăugat în whitelist',
        typeDeleted: 'Tip șters',
        settingsSaved: 'Setări salvate!',
        apiLimitLabel: 'Limită API zilnică per user',
        adIntervalLabel: 'Interval Splash Reclame (minute)',
        adDurationLabel: 'Durată Splash (secunde)',
        videoUrlLabel: 'URL Video Promo',
        videoUrlsLabel: 'URL-uri Video Promo (câte unul pe linie)',
        adFreeExtLabel: 'Extensie fără reclame (minute)',
        monthlyQuotaMaps: 'Cotă lunară Maps',
        monthlyQuotaGeocode: 'Cotă lunară Geocode',
        saveSettings: 'Salvează Setări',
        topUsers: 'Top Utilizatori',
        dailyLog: 'Log Zilnic',
        apiLog: 'Log API',
        mapsLoadQuota: 'Maps Load',
        geocodeQuota: 'Geocoding',
        costThisMonth: 'Cost luna aceasta',
        used: 'utilizat',
        remaining: 'rămase',
        dailyQuota: 'Zilnic',
        monthlyQuota: 'Lunar',
        actions: 'Acțiuni',
        time: 'Ora',
        keySource: 'Cheie',
        resetAllDaily: 'Reset Zilnic (toți)',
        resetAllMonthly: 'Reset Lunar (toți)',
        confirmResetAllDaily: 'Resetezi cota zilnică pentru toți utilizatorii?',
        confirmResetAllMonthly: 'Resetezi cota lunară pentru toți utilizatorii?'
      },
      common: {
        cancel: 'Anulează',
        save: 'Salvează',
        delete: 'Șterge',
        confirm: 'Confirmă',
        loading: 'Se încarcă...',
        success: 'Succes',
        error: 'Eroare',
        name: 'Nume',
        message: 'Mesaj',
        logout: 'Deconectare'
      },
      ads: {
        watchSubscribe: 'Urmărește și abonează-te',
        splashTitle: 'DSIP MapManager',
        splashMsg: 'Pornește videoclipul pentru a folosi aplicația fără reclame',
        playToExtend: 'Pornește videoclipul pentru acces fără reclame',
        continue: 'Continuă',
        thankYou: 'Mulțumim! Fără reclame până la {time}'
      },
      userKeys: {
        title: 'Chei API',
        description: 'Folosește propria ta cheie Google Maps API pentru a evita limitele de sistem. Consumul va fi facturat pe contul tău Google Cloud.',
        mapsKey: 'Cheie Google Maps API',
        usingCustom: 'Folosești cheia ta API',
        usingSystem: 'Folosești cheia de sistem',
        inactive: 'Cheie dezactivată',
        activate: 'Activează',
        deactivate: 'Dezactivează',
        saved: 'Cheie API salvată',
        deleted: 'Cheie API ștearsă',
        confirmDelete: 'Ștergi cheia API? Vei reveni la limitele de sistem.',
        reloadRequired: 'Modificările se aplică după reîncărcarea paginii.',
        howToTitle: 'Cum să-ți configurezi cheia:',
        step1: 'Mergi la Google Cloud Console',
        step2: 'Creează un proiect, activează Maps JavaScript API + Geocoding API',
        step3: 'Creează o cheie API',
        step4: 'Adaugă maps.djooga.com/* la restricțiile de referrer HTTP',
        step5: 'Lipește cheia mai sus și salvează'
      },
      pdf: {
        export: 'Export PDF',
        title: 'Raport Markere',
        project: 'Proiect',
        generated: 'Generat',
        filters: 'Filtre Aplicate',
        status: 'Stare',
        condition: 'Condiție',
        search: 'Căutare',
        all: 'Toate',
        markerList: 'Lista Markere',
        noMarkers: 'Niciun marker nu corespunde filtrelor'
      },
      quota: {
        daily: 'Cotă Zilnică',
        monthly: 'Cotă Lunară',
        remaining: 'rămase',
        noLimits: 'Fără limite de sistem',
        todayBreakdown: 'Detalii azi',
        readOnly: 'Cotă depășită — hartă doar vizualizare',
        searchBlocked: 'Căutare dezactivată — cotă depășită',
        dailyReached: 'Limită zilnică atinsă',
        monthlyReached: 'Limită lunară atinsă',
        dailyMsg: 'Harta va fi disponibilă din nou mâine.',
        monthlyMsg: 'Limita lunară API atinsă. Contactează administratorul.'
      },
      toast: {
        projectCreated: 'Proiect creat!',
        projectDeleted: 'Proiect șters',
        markerSaved: 'Marker salvat!',
        markerDeleted: 'Marker șters',
        settingsSaved: 'Setări salvate',
        errorGeneric: 'Ceva nu a funcționat',
        locationNotFound: 'Locație negăsită: "{query}"',
        mapNotReady: 'Harta nu s-a încărcat. Încearcă din nou.'
      }
    },

    de: {
      login: {
        subtitle: 'Geografische Projektverwaltungsplattform',
        google: 'Mit Google anmelden',
        feature1: 'Interaktive Karten',
        feature2: 'Benutzerdefinierte Marker',
        feature3: 'Projektverwaltung'
      },
      dashboard: {
        selectProject: 'Projekt auswählen',
        manageProjects: 'Projekte verwalten'
      },
      menu: {
        theme: 'Design',
        language: 'Sprache',
        logout: 'Abmelden'
      },
      sidebar: {
        markers: 'Marker',
        search: 'Marker suchen...',
        noMarkers: 'Noch keine Marker'
      },
      filter: {
        allStatus: 'Alle Status',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        maintenance: 'Wartung',
        allCondition: 'Alle Zustände',
        good: 'Gut',
        fair: 'Mäßig',
        poor: 'Schlecht',
        critical: 'Kritisch'
      },
      stats: {
        total: 'Gesamt',
        active: 'Aktiv',
        maintenance: 'Wart.'
      },
      map: {
        searchLocation: 'Standort suchen...',
        selectProjectFirst: 'Wählen Sie ein Projekt',
        selectProjectHint: 'Wählen oder erstellen Sie ein Projekt',
        clickToPlace: 'Klicken Sie auf die Karte um einen Marker zu setzen',
        cacheInfo: 'Zwischengespeicherte Kacheln verfügbar'
      },
      marker: {
        add: 'Marker hinzufügen',
        edit: 'Marker bearbeiten',
        title: 'Titel',
        lat: 'Breitengrad',
        lng: 'Längengrad',
        icon: 'Symbol',
        observations: 'Beobachtungen',
        status: 'Status',
        condition: 'Zustand',
        priority: 'Priorität',
        responsible: 'Verantwortlich',
        cost: 'Kosten',
        installDate: 'Installationsdatum',
        maintenanceDate: 'Wartungsdatum',
        repairDate: 'Reparaturdatum',
        warrantyDate: 'Garantieablauf',
        images: 'Bilder',
        uploadImage: 'Hochladen'
      },
      projects: {
        manage: 'Projekte verwalten',
        newName: 'Neuer Projektname...',
        create: 'Erstellen',
        chooseAvatar: 'Avatar wählen:',
        markerCount: '{count} Marker',
        created: 'Erstellt {date}',
        confirmDelete: 'Projekt "{name}" und alle Marker löschen?',
        myProjects: 'Meine Projekte', sharedWithMe: 'Mit mir geteilt', members: 'Mitglieder', owner: 'Besitzer', noMembers: 'Keine Mitglieder', invite: 'Einladen', removeMember: 'Mitglied entfernen?', roleUpdated: 'Rolle aktualisiert', invited: '{email} als {role} eingeladen'
      },
      view: { all: 'Alle', inView: 'Sichtbar', addMarkerHere: 'Marker hier hinzufügen', more: 'Mehr...' },
      roles: { admin: 'Admin', viewer: 'Betrachter', owner: 'Besitzer', super: 'SUPER' },
      picker: { general: 'Allgemein', firefighter: 'Feuerwehr', signs: 'Schilder', custom: 'Benutzerdefiniert', hydrants: 'Hydranten', waterSources: 'Wasserquellen', equipment: 'Ausrüstung', alarms: 'Alarme & Systeme', locations: 'Besondere Orte' },
      markerActions: { edit: 'Bearbeiten', move: 'Verschieben', delete: 'Löschen', dragToMove: 'Marker an die gewünschte Position ziehen', savePosition: 'Speichern', cancelMove: 'Abbrechen', positionSaved: 'Position gespeichert!', activate: 'Aktivieren', deactivate: 'Deaktivieren' },
      access: { restricted: 'Zugang eingeschränkt', restrictedMsg: 'Ihr Konto ({email}) hat keinen Zugang.', sendRequest: 'Anfrage senden', requestSent: 'Anfrage gesendet!', expired: 'Abonnement abgelaufen', expiredMsg: 'Ihr Abonnement ist am {date} abgelaufen.', requestRenewal: 'Erneuerung anfordern', renewalSent: 'Anfrage gesendet!' },
      admin: { panel: 'Admin-Panel', users: 'Benutzer', messages: 'Nachrichten', settings: 'Einstellungen', apiUsage: 'API-Nutzung', whitelist: 'Whitelist', addToWhitelist: 'Hinzufügen', active: 'Aktiv', unconfirmed: 'Unbestätigt', confirmed: 'Bestätigt', allMessages: 'Alle', noMessages: 'Keine Nachrichten', userUpdated: 'Benutzer aktualisiert', addedToWhitelist: 'Zur Whitelist hinzugefügt', settingsSaved: 'Einstellungen gespeichert!', apiLimitLabel: 'Tägliches API-Limit pro Benutzer', adIntervalLabel: 'Werbe-Splash-Intervall (Min.)', adDurationLabel: 'Splash-Dauer (Sek.)', videoUrlLabel: 'Promo-Video-URL', videoUrlsLabel: 'Promo-Video-URLs (eine pro Zeile)', adFreeExtLabel: 'Werbefreie Verlängerung (Min.)', monthlyQuotaMaps: 'Monatliches Maps-Kontingent', monthlyQuotaGeocode: 'Monatliches Geocode-Kontingent', saveSettings: 'Einstellungen speichern', topUsers: 'Top-Benutzer', dailyLog: 'Tagesprotokoll', apiLog: 'API-Protokoll', mapsLoadQuota: 'Maps Load', geocodeQuota: 'Geocoding', costThisMonth: 'Kosten diesen Monat', used: 'verwendet', remaining: 'übrig', dailyQuota: 'Täglich', monthlyQuota: 'Monatlich', actions: 'Aktionen', time: 'Zeit', keySource: 'Schlüssel', resetAllDaily: 'Täglich zurücksetzen (alle)', resetAllMonthly: 'Monatlich zurücksetzen (alle)', confirmResetAllDaily: 'Tägliches Kontingent für alle zurücksetzen?', confirmResetAllMonthly: 'Monatliches Kontingent für alle zurücksetzen?' },
      quota: { daily: 'Tageskontingent', monthly: 'Monatskontingent', remaining: 'übrig', noLimits: 'Keine Systemlimits', todayBreakdown: 'Aufschlüsselung heute', readOnly: 'Kontingent überschritten — Karte nur Ansicht', searchBlocked: 'Suche deaktiviert — Kontingent überschritten', dailyReached: 'Tageslimit erreicht', monthlyReached: 'Monatslimit erreicht', dailyMsg: 'Karten sind morgen wieder verfügbar.', monthlyMsg: 'Monatliches API-Limit erreicht. Kontaktieren Sie den Administrator.' },
      common: {
        cancel: 'Abbrechen', save: 'Speichern', delete: 'Löschen', confirm: 'Bestätigen', loading: 'Laden...', success: 'Erfolg', error: 'Fehler', name: 'Name', message: 'Nachricht', logout: 'Abmelden'
      },
      ads: { watchSubscribe: 'Ansehen und abonnieren', splashTitle: 'DSIP MapManager', splashMsg: 'Video abspielen, um die App werbefrei zu nutzen', playToExtend: 'Video abspielen für werbefreien Zugang', continue: 'Weiter', thankYou: 'Danke! Werbefrei bis {time}' },
      userKeys: { title: 'API-Schlüssel', description: 'Verwenden Sie Ihren eigenen Google Maps API-Schlüssel, um Systemlimits zu umgehen. Die Nutzung wird Ihrem Google Cloud-Konto berechnet.', mapsKey: 'Google Maps API-Schlüssel', usingCustom: 'Eigener API-Schlüssel aktiv', usingSystem: 'System-API-Schlüssel', inactive: 'Schlüssel deaktiviert', activate: 'Aktivieren', deactivate: 'Deaktivieren', saved: 'API-Schlüssel gespeichert', deleted: 'API-Schlüssel entfernt', confirmDelete: 'API-Schlüssel entfernen? Sie kehren zu den Systemlimits zurück.', reloadRequired: 'Änderungen werden nach dem Neuladen wirksam.', howToTitle: 'So richten Sie Ihren Schlüssel ein:', step1: 'Gehen Sie zur Google Cloud Console', step2: 'Erstellen Sie ein Projekt, aktivieren Sie Maps JavaScript API + Geocoding API', step3: 'Erstellen Sie einen API-Schlüssel', step4: 'Fügen Sie maps.djooga.com/* zu den HTTP-Referrer-Beschränkungen hinzu', step5: 'Fügen Sie den Schlüssel oben ein und speichern Sie' },
      pdf: { export: 'PDF exportieren', title: 'Marker-Bericht', project: 'Projekt', generated: 'Erstellt', filters: 'Angewandte Filter', status: 'Status', condition: 'Zustand', search: 'Suche', all: 'Alle', markerList: 'Markerliste', noMarkers: 'Keine Marker entsprechen den Filtern' },
      toast: {
        projectCreated: 'Projekt erstellt!', projectDeleted: 'Projekt gelöscht', markerSaved: 'Marker gespeichert!', markerDeleted: 'Marker gelöscht', settingsSaved: 'Einstellungen gespeichert', errorGeneric: 'Etwas ist schiefgelaufen', locationNotFound: 'Ort nicht gefunden: "{query}"', mapNotReady: 'Karte noch nicht geladen.'
      }
    },

    fr: {
      login: {
        subtitle: 'Plateforme de gestion de projets géographiques',
        google: 'Se connecter avec Google',
        feature1: 'Cartes Interactives',
        feature2: 'Marqueurs Personnalisés',
        feature3: 'Gestion de Projets'
      },
      dashboard: {
        selectProject: 'Sélectionner un Projet',
        manageProjects: 'Gérer les Projets'
      },
      menu: {
        theme: 'Thème',
        language: 'Langue',
        logout: 'Déconnexion'
      },
      sidebar: {
        markers: 'Marqueurs',
        search: 'Rechercher des marqueurs...',
        noMarkers: 'Aucun marqueur'
      },
      filter: {
        allStatus: 'Tous les Statuts',
        active: 'Actif',
        inactive: 'Inactif',
        maintenance: 'Maintenance',
        allCondition: 'Toutes les Conditions',
        good: 'Bon',
        fair: 'Passable',
        poor: 'Mauvais',
        critical: 'Critique'
      },
      stats: {
        total: 'Total',
        active: 'Actifs',
        maintenance: 'Maint.'
      },
      map: {
        searchLocation: 'Rechercher un lieu...',
        selectProjectFirst: 'Sélectionnez un projet pour commencer',
        selectProjectHint: 'Choisissez ou créez un projet depuis l\'en-tête',
        clickToPlace: 'Cliquez sur la carte pour placer un marqueur',
        cacheInfo: 'Tuiles en cache disponibles'
      },
      marker: {
        add: 'Ajouter un Marqueur',
        edit: 'Modifier le Marqueur',
        title: 'Titre',
        lat: 'Latitude',
        lng: 'Longitude',
        icon: 'Icône',
        observations: 'Observations',
        status: 'Statut',
        condition: 'Condition',
        priority: 'Priorité',
        responsible: 'Responsable',
        cost: 'Coût',
        installDate: 'Date d\'Installation',
        maintenanceDate: 'Date de Maintenance',
        repairDate: 'Date de Réparation',
        warrantyDate: 'Expiration Garantie',
        images: 'Images',
        uploadImage: 'Télécharger'
      },
      projects: {
        manage: 'Gérer les Projets',
        newName: 'Nom du nouveau projet...',
        create: 'Créer',
        chooseAvatar: 'Choisir un avatar:',
        markerCount: '{count} marqueurs',
        created: 'Créé le {date}',
        confirmDelete: 'Supprimer le projet "{name}" et tous ses marqueurs?',
        myProjects: 'Mes Projets', sharedWithMe: 'Partagés avec moi', members: 'Membres', owner: 'Propriétaire', noMembers: 'Aucun membre', invite: 'Inviter', removeMember: 'Retirer ce membre?', roleUpdated: 'Rôle mis à jour', invited: '{email} invité en tant que {role}'
      },
      view: { all: 'Tous', inView: 'Visibles', addMarkerHere: 'Ajouter un marqueur ici', more: 'Plus...' },
      roles: { admin: 'admin', viewer: 'lecteur', owner: 'propriétaire', super: 'SUPER' },
      picker: { general: 'Général', firefighter: 'Pompiers', signs: 'Panneaux', custom: 'Personnalisé', hydrants: 'Bouches d\'incendie', waterSources: 'Sources d\'eau', equipment: 'Équipement', alarms: 'Alarmes & Systèmes', locations: 'Lieux Spéciaux' },
      markerActions: { edit: 'Modifier', move: 'Déplacer', delete: 'Supprimer', dragToMove: 'Glissez le marqueur', savePosition: 'Enregistrer', cancelMove: 'Annuler', positionSaved: 'Position enregistrée!', activate: 'Activer', deactivate: 'Désactiver' },
      access: { restricted: 'Accès Restreint', restrictedMsg: 'Votre compte ({email}) n\'a pas accès.', sendRequest: 'Envoyer', requestSent: 'Demande envoyée!', expired: 'Abonnement Expiré', expiredMsg: 'Votre abonnement a expiré le {date}.', requestRenewal: 'Demander le renouvellement', renewalSent: 'Demande envoyée!' },
      admin: { panel: 'Panneau Admin', users: 'Utilisateurs', messages: 'Messages', settings: 'Paramètres', apiUsage: 'Utilisation API', whitelist: 'Liste blanche', addToWhitelist: 'Ajouter', active: 'Actif', unconfirmed: 'Non confirmés', confirmed: 'Confirmés', allMessages: 'Tous', noMessages: 'Aucun message', userUpdated: 'Utilisateur mis à jour', addedToWhitelist: 'Ajouté à la liste blanche', settingsSaved: 'Paramètres enregistrés!', apiLimitLabel: 'Limite API quotidienne par utilisateur', adIntervalLabel: 'Intervalle splash pub (min.)', adDurationLabel: 'Durée splash (sec.)', videoUrlLabel: 'URL Vidéo Promo', videoUrlsLabel: 'URLs Vidéo Promo (une par ligne)', adFreeExtLabel: 'Extension sans pub (min.)', monthlyQuotaMaps: 'Quota mensuel Maps', monthlyQuotaGeocode: 'Quota mensuel Geocode', saveSettings: 'Enregistrer', topUsers: 'Top Utilisateurs', dailyLog: 'Journal Quotidien', apiLog: 'Journal API', mapsLoadQuota: 'Maps Load', geocodeQuota: 'Geocoding', costThisMonth: 'Coût ce mois', used: 'utilisé', remaining: 'restant', dailyQuota: 'Quotidien', monthlyQuota: 'Mensuel', actions: 'Actions', time: 'Heure', keySource: 'Clé', resetAllDaily: 'Réinitialiser quotidien (tous)', resetAllMonthly: 'Réinitialiser mensuel (tous)', confirmResetAllDaily: 'Réinitialiser le quota quotidien pour tous ?', confirmResetAllMonthly: 'Réinitialiser le quota mensuel pour tous ?' },
      quota: { daily: 'Quota Quotidien', monthly: 'Quota Mensuel', remaining: 'restant', noLimits: 'Aucune limite système', todayBreakdown: 'Détails aujourd\'hui', readOnly: 'Quota dépassé — carte en lecture seule', searchBlocked: 'Recherche désactivée — quota dépassé', dailyReached: 'Limite quotidienne atteinte', monthlyReached: 'Limite mensuelle atteinte', dailyMsg: 'Les cartes seront disponibles demain.', monthlyMsg: 'Limite API mensuelle atteinte. Contactez l\'administrateur.' },
      common: {
        cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', confirm: 'Confirmer', loading: 'Chargement...', success: 'Succès', error: 'Erreur', name: 'Nom', message: 'Message', logout: 'Déconnexion'
      },
      ads: { watchSubscribe: 'Regardez et abonnez-vous', splashTitle: 'DSIP MapManager', splashMsg: 'Lancez la vidéo pour utiliser l\'appli sans publicité', playToExtend: 'Lancez la vidéo pour un accès sans publicité', continue: 'Continuer', thankYou: 'Merci ! Sans publicité jusqu\'à {time}' },
      userKeys: { title: 'Clés API', description: 'Utilisez votre propre clé Google Maps API pour contourner les limites système. L\'utilisation sera facturée sur votre compte Google Cloud.', mapsKey: 'Clé Google Maps API', usingCustom: 'Utilisation de votre clé API', usingSystem: 'Utilisation de la clé système', inactive: 'Clé désactivée', activate: 'Activer', deactivate: 'Désactiver', saved: 'Clé API enregistrée', deleted: 'Clé API supprimée', confirmDelete: 'Supprimer votre clé API ? Vous reviendrez aux limites système.', reloadRequired: 'Les modifications prennent effet après le rechargement de la page.', howToTitle: 'Comment configurer votre clé :', step1: 'Allez sur Google Cloud Console', step2: 'Créez un projet, activez Maps JavaScript API + Geocoding API', step3: 'Créez une clé API', step4: 'Ajoutez maps.djooga.com/* aux restrictions de référent HTTP', step5: 'Collez la clé ci-dessus et enregistrez' },
      pdf: { export: 'Exporter PDF', title: 'Rapport Marqueurs', project: 'Projet', generated: 'Généré', filters: 'Filtres Appliqués', status: 'Statut', condition: 'Condition', search: 'Recherche', all: 'Tous', markerList: 'Liste des Marqueurs', noMarkers: 'Aucun marqueur ne correspond aux filtres' },
      toast: {
        projectCreated: 'Projet créé!', projectDeleted: 'Projet supprimé', markerSaved: 'Marqueur enregistré!', markerDeleted: 'Marqueur supprimé', settingsSaved: 'Paramètres enregistrés', errorGeneric: 'Quelque chose s\'est mal passé', locationNotFound: 'Lieu non trouvé: "{query}"', mapNotReady: 'Carte pas encore chargée.'
      }
    }
  },

  setLocale(locale) {
    if (!this.translations[locale]) return;
    this.currentLocale = locale;
    this.applyTranslations();
  },

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];
    for (const k of keys) {
      if (!value || !value[k]) {
        // Fallback to English
        value = this.translations.en;
        for (const fk of keys) {
          if (!value || !value[fk]) return key;
          value = value[fk];
        }
        break;
      }
      value = value[k];
    }
    if (typeof value !== 'string') return key;
    // Replace params like {count}
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  },

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  }
};
