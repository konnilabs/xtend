# Enterprise Adoption

Dieser Leitfaden hilft einem externen Team, XTend kontrolliert in ein bestehendes Web-Produkt einzuführen. Das Ziel ist ein kleiner, rückbaubarer Pilot mit klaren Besitzgrenzen, nicht die sofortige Ablösung des vorhandenen Frontends.

## Vor der technischen Integration

Bestimme zuerst, welches Problem XTend lösen soll: lokale Web Components, RMT Authoring, planbare Hydration, eine Surface Runtime oder Diagnose im Browser. Wähle nur die dafür nötigen Pakete und öffentlichen Subpaths aus `package.json#exports`.

Dokumentiere für den Pilot:

- fachlichen und technischen Owner;
- Browser- und CSP-Anforderungen;
- erlaubte lokale und optionale Remote-Quellen;
- State-, Routing- und Fokusverantwortung;
- Performance- und Accessibility-Budgets;
- Fallback und Rückbaupfad.

## Einen Pilot wählen

Eine geeignete Surface hat wenige globale Abhängigkeiten, sichtbares Fehlerverhalten und eine realistische Nutzerinteraktion. Globale Navigation, Authentifizierung oder ein still geteilter Eventbus sind schlechte erste Kandidaten. Beginne mit [XTend Classic](./xtend-classic.md) und dem [Quick Start](./quick-start-guide.md) für einen HTML-/JavaScript-first-Host oder mit [Learn RMT](./learn-rmt.md) und Maraca für eine kompilierte deklarative App-Grenze.

Nutze `components/manifest.json` und `xtend-loader.js` lokal. Eine Framework-Insel wird über einen HostController angebunden; sie darf ihre Peer-Runtime nicht im XTension-Bundle verstecken. Cross-Surface-Kommunikation läuft über typisierte Events oder Fabric, nicht über fremde Framework-Contexts.

## Abnahmekriterien

Der Pilot ist erst erfolgreich, wenn er in Development und Production gleich bootet, ohne CDN funktioniert und bei fehlenden optionalen Fähigkeiten sichtbar degradiert. Mount und Unmount dürfen keine Listener, Timer oder Resource Handles zurücklassen. Tastatur, Screenreader-Signale, Reduced Motion und Performance-Budgets gehören zur Abnahme, nicht zu einer späteren Politurphase.

Die [XTend Dev Surface](./xtend-dev-surface.md) hilft beim lokalen Beobachten. Reproduzierbare Entscheidungen stammen jedoch aus den JSON-Reports der passenden Gates und dem Ablauf unter [Release Verification](./release-verification.md).

## Betrieb und Upgrades

Pinne eine getestete Package-Version und importiere nur dokumentierte Exports. Prüfe vor einem Upgrade Changelog, Migration Notes, Type Exports und die betroffenen Component Contracts. Ändert sich ein Schema oder ein Default, aktualisiere Source, Fixtures und Runbook gemeinsam.

Prüfe vor der Übergabe des Piloten seine veröffentlichten Einstiegspunkte mit dem [Package Export Lock](./package-export-lock.md) und erfasse den Paketnachweis mit `npm run pack:dry-run:report`.

Netzwerkabhängige Audit- und SBOM-Nachweise folgen dem Contract `xtend.epic13.conditional-network-evidence.v1`. Der lokale Standard `network-restricted-local-default` erzeugt eine nachvollziehbare Deferral, ohne Daten zu senden; Ausführung und Release-Freigabe sind unter [Conditional Network Evidence](./conditional-network-evidence.md) beschrieben.

Bewahre einen funktionierenden Fallback mindestens so lange auf, bis die neue Surface ihre Fehler- und Recovery-Pfade im Produkt gezeigt hat. Ein erfolgreicher Happy Path allein ist kein belastbarer Adoption-Nachweis.
