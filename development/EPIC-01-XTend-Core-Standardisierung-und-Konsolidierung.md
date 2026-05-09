# XTend Epic 01 - Core-Standardisierung und Konsolidierung

- Status: Completed
- Datum: 24. Maerz 2026
- Typ: Epic / Planungsdokument
- Bezugsdokumente:
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `compliance/update-instructions.md`
  - `compliance/xtend-design-guidelines.md`
  - `development/BACKLOG-EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`

## Ausgangslage

Der ADR-Audit und die anschliessende Core-Review zeigen, dass XTend vor dem weiteren Ausbau des Komponenten-Katalogs zuerst seinen Plattform-Kern konsolidieren muss. Die zentrale Herausforderung liegt nicht in fehlenden UI-Bausteinen, sondern in uneinheitlichen Vertraegen zwischen Loader, Manifest, State, Theme, Router, API und den API-nahen Kernkomponenten.

Der Epic reagiert auf folgende Lage:

- Die Architektur von XTend ist stark genug, um als Plattform weiterentwickelt zu werden.
- Die aktuelle Implementierung enthaelt jedoch Vertragsdrift, Technical Debt und Regressionsrisiken im Kern.
- Die Compliance-Dokumente machen klar, dass Digital Twin Principle, Konsistenz, Accessibility und dokumentierte Standards verbindlich sind.
- Der naechste Wachstumsschritt des Frameworks muss deshalb Standardisierung, Inkonsistenzabbau und Rollen-Schaerfung im Core priorisieren.

## Wichtige Randbedingung

Die vorhandenen CDN-Artefakte werden in diesem Epic nicht pauschal als Fehlentscheidung behandelt. Laut aktuellem Projektkontext dienten konkrete URLs als praktikabler Workaround, damit ES6-basierte Komponenten unter den bisherigen Hydrationsbedingungen ueberhaupt verlaesslich geladen wurden.

Daraus folgt:

- Ziel dieses Epics ist nicht das blinde Entfernen aller CDN-URLs.
- Ziel ist ein expliziter, standardisierter Hydrations- und Modulaufloesungs-Contract.
- XTend soll kuenftig klar definierte Modi unterstuetzen, z. B. `cdn`, `local` oder eine vergleichbare konfigurierbare Strategie.

## Zielbild

Nach Abschluss des Epics ist XTend im Core als konsistente Plattform beschrieben, implementiert und verifiziert.

Das Zielbild umfasst:

- einen klaren Bootstrap-Contract fuer Manifest, Loader und Basismodule
- einen einheitlichen State- und Event-Contract ueber API und Core-Komponenten
- eine eindeutige Rollenverteilung zwischen Loader, API, `xstate`, `xtheme`, `x-router`, `x-link` und API-nahen Komponenten
- eine konsistente Benennung fuer Tags, Modulnamen, State-Keys und Doku-Begriffe
- belastbare Qualitaetsbarrieren in Form von Smoke-, Contract- und Kern-Regressionstests

## In Scope

- `components/manifest.json`
- `xtend-dev.js`
- `api.js`
- `components/xstate.js`
- `components/xtheme.js`
- `components/xrouter.js`
- `components/xlink.js`
- `components/xdialog.js`
- `components/xmodal.js`
- `components/xtoast.js`
- `components/xalert.js`
- die dazugehoerige Dokumentation und Architektur-/Compliance-Ableitungen

## Out of Scope

- Ausbau des Component-Katalogs um neue Features oder neue UI-Komponenten
- groesseres visuelles Redesign ausserhalb der bestehenden Design-Guidelines
- produktive Release-Kommunikation oder Marketing-Material
- umfassende Builder-/CLI-Erweiterungen ausserhalb des direkten Core-Bedarfs

## Problemfelder, die dieser Epic loesen muss

- Bootstrap- und Hydrations-Contract sind nicht sauber normiert.
- State-Keys, Event-Namen und API-Vertraege driften zwischen Modulen auseinander.
- Core-Komponenten verletzen teilweise das Digital Twin Principle oder leben mit Workarounds.
- Router, Dialog/Modal und Theme-Mechanik haben konkrete Regressionsrisiken.
- Die Doku beschreibt den Plattform-Kern noch nicht als einheitlichen Vertrag.
- Es fehlen harte Qualitaetsbarrieren fuer den Core.

## Arbeitsstroeme

### WS1 - Bootstrap, Manifest und Hydrations-Contract

Ziel: Loader, Manifest und Modulaufloesung auf einen eindeutigen Vertrag bringen.

Erwartete Ergebnisse:

- ein definierter URL-Aufloesungsmechanismus fuer Core- und Komponenten-Module
- dokumentierte und implementierte Entscheidung zu `cdn`, `local` oder einem aequivalenten Modus
- ein konsistenter Bootstrap-Pfad fuer `xstate`, `xtheme` und API
- eine bereinigte Manifest-Spezifikation als Single Source of Truth

### WS2 - State-, Event- und API-Standardisierung

Ziel: Einheitliche oeffentliche Contracts fuer Core-Interaktion definieren und durchziehen.

Erwartete Ergebnisse:

- kanonische Benennung fuer State-Keys
- kanonische Benennung fuer Events und globale API-Methoden
- idempotente und deterministische Initialisierung der Core-API
- saubere Trennung zwischen orchestrierender API und rendernden Komponenten

### WS3 - Rollen-Schaerfung der Core-Komponenten

Ziel: Jede Kernkomponente soll eine klare Verantwortung haben und diese ohne versteckte Nebenpfade erfuellen.

Erwartete Ergebnisse:

- `xstate` als eindeutige State-Basis
- `xtheme` als kanonische Theme-Schicht
- `x-router` und `x-link` als konsistenter Navigationsvertrag
- `x-dialog` und `x-modal` als deterministische Overlay-/Dialog-Schicht
- `x-toast` und `x-alert` als klar abgegrenzte Feedback-Komponenten

### WS4 - Compliance-Haertung

Ziel: Der Core soll die Regeln aus den Compliance-Dokumenten explizit abbilden statt ihnen nur lose zu entsprechen.

Erwartete Ergebnisse:

- Digital Twin Principle ist in den Kernfluesen praktisch eingehalten
- keine lokalen UI-Flags als dauerhafte Steuerungsquelle
- keine asynchronen Workarounds als Kernmechanik
- Accessibility- und Design-Guidelines sind in den Core-Vertraegen sichtbar verankert

### WS5 - Dokumentation, Tests und Release-Readiness

Ziel: Die Plattform soll nicht nur funktionieren, sondern auch nachvollziehbar, pruefbar und wartbar sein.

Erwartete Ergebnisse:

- aktualisierte Dokumentation fuer Core-Contracts
- Smoke- und Contract-Tests fuer Kernfluesse
- klarer Review- und Abnahmeprozess fuer Core-Aenderungen
- nachvollziehbare Migrationshinweise fuer bestehende Komponenten und Doku

## Initiale Arbeitspakete

- `E01-001`: Kanonischen Core-Contract fuer Manifest, Loader, `xstate`, `xtheme`, Router und API schriftlich festlegen.
- `E01-002`: Entscheidung fuer den kuenftigen Hydrations-/URL-Aufloesungsmodus treffen und dokumentieren.
- `E01-003`: Benennungsstandard fuer Tags, Modulnamen, State-Keys und Event-Namen definieren.
- `E01-004`: `xstate`-Bootstrapping und Loader-Reihenfolge konsolidieren.
- `E01-005`: `api.js` idempotent machen und Contracts fuer Dialog, Modal, Toast und Alert angleichen.
- `E01-006`: `x-dialog` und `x-modal` auf einen einheitlichen, state-getriebenen Overlay-Contract bringen.
- `E01-007`: `x-router`-Navigation, xstate-Anbindung und Nested-Route-Verhalten haerten.
- `E01-008`: `xtheme`-API und Theme-Lifecycle gegen Dokumentation und Runtime vereinheitlichen.
- `E01-009`: Core-Smoke-Tests fuer Bootstrap, Navigation, Theme-Switching und Dialog/Modal etablieren.
- `E01-010`: Doku, ADR-Folgeeintrag und Migrationshinweise aktualisieren.

## Abhaengigkeiten

- Architekturentscheidung zum kuenftigen URL-/Hydrationsmodus
- Klarheit darueber, welche Altvertraege weiter unterstuetzt werden muessen
- Einigung auf die kanonische Runtime-Benennung der Custom Elements
- Entscheidung, ob Legacy-APIs nur kompatibel gehalten oder aktiv migriert werden

## Risiken

- Ein zu frueher Umbau des Hydrationspfads kann bestehende CDN-basierte Integrationen brechen.
- Ein nur teilweiser Contract-Fix erzeugt neue Mischzustaende statt den Core wirklich zu stabilisieren.
- Ohne Tests koennen Loader-, Router- und Dialog-Regressionen leicht unbemerkt bleiben.
- Wenn Doku und Code nicht gemeinsam aktualisiert werden, wird neue Inkonsistenz direkt wieder aufgebaut.

## Akzeptanzkriterien

- Manifest, Loader und Basismodule besitzen einen dokumentierten und implementierten gemeinsamen Bootstrap-Contract.
- `xstate`, API und API-nahe Core-Komponenten verwenden kanonische State-Keys und Event-Namen.
- Dialog- und Modal-Fluesse sind deterministisch und entsprechen dem Digital Twin Principle.
- Router-Navigation funktioniert fuer deklarative, programmatische und Nested-Route-Fluesse konsistent.
- Theme-Wechsel und Theme-Registrierung haben einen definierten Lifecycle ohne verdeckte Sonderfaelle.
- Die Core-Dokumentation beschreibt die tatsaechliche Runtime und nicht nur ein Zielbild.
- Fuer alle priorisierten Kernfluesse existieren Smoke- oder Contract-Tests.
- Der Epic fuehrt zu keiner Erweiterung des Komponenten-Katalogs, bevor die Core-Vertraege stabil sind.

## KPI-Baseline

- `0` sichtbare Test-/Spec-Dateien fuer den Core bei Start dieses Epics
- `27` Manifest-Eintraege
- `27` Dateien mit hart codierten XTend-CDN-Komponenten-URLs in `xtend-dev.js`, `api.js` und `components`
- `26` Dateien mit direktem `xstate`-CDN-Import
- mehrere High-Risk-Contract-Breaks in Bootstrap, Dialog/Modal, Router und Theme

## KPI-Ziele

- `0` offene High-Severity-Contract-Breaks im Core zum Epic-Abschluss
- `100%` der Core-Module folgen einem dokumentierten Bootstrap- und Benennungsstandard
- `100%` der priorisierten Kernfluesse besitzen mindestens einen Smoke- oder Contract-Test
- `100%` der API-nahen Core-Komponenten haben dokumentierte State-, Event- und Rollenvertraege
- dokumentierte Unterstuetzung fuer den kuenftigen Hydrationsmodus bzw. die kuenftigen Hydrationsmodi

## Vorschlag fuer die Umsetzungsreihenfolge

1. Contract-Freeze fuer Bootstrap, Benennung und State/API-Konventionen
2. Loader-/Manifest-/Hydrations-Entscheidung
3. Dialog/Modal/API-Konsolidierung
4. Router- und Theme-Haertung
5. Test- und Doku-Haertung
6. Abschlussreview gegen Compliance, ADR und KPI-Ziele

## Definition of Done

Der Epic ist abgeschlossen, wenn XTend im Core als konsistente Plattform funktioniert, dokumentiert ist und gegen seine wichtigsten Regressionen abgesichert wurde. Neue Komponenten duerfen erst wieder priorisiert aufgebaut werden, wenn die Kernvertraege stabil, getestet und teamweit nachvollziehbar sind.

## Abschlussstand Maerz 2026

Epic 01 ist abgeschlossen. Die priorisierten Core-Contracts fuer Loader, Manifest, `xstate`, API, Router, Theme sowie Overlay-/Feedback-Komponenten wurden konsolidiert, dokumentiert und ueber den repo-lokalen Verify-Script gehaertet.

Abschlussartefakte:

- `development/WP-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
- `development/XTend-Core-Compliance-Checklist.md`
- `docs/core-migration-guide.md`
- `scripts/verify_xtend_core_contracts.js`

Der Epic ist damit formal freigegeben und bildet die stabile Grundlage fuer nachfolgende Entwicklungsarbeit auf dem XTend-Core.
