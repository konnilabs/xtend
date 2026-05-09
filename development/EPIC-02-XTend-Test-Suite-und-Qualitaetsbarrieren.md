# XTend Epic 02 - Test-Suite und Qualitaetsbarrieren

- Status: Completed
- Datum: 24. Maerz 2026
- Typ: Epic / Planungsdokument
- Bezugsdokumente:
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `compliance/update-instructions.md`
  - `compliance/xtend-design-guidelines.md`
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/WP-E02-01-Teststrategie-und-Harness-Entscheidung.md`
  - `development/WP-E02-02-Testprojektstruktur-und-lokale-Runner-Entry-Points.md`
  - `development/WP-E02-03-Core-Verify-in-Test-Harness-ueberfuehren.md`
  - `development/WP-E02-04-Contract-Assertions-Fixtures-und-Shared-Test-Utilities.md`
  - `development/WP-E02-05-Browser-Smoke-Harness-fuer-Custom-Elements.md`
  - `development/WP-E02-06-Core-Browser-Smokes-fuer-Loader-API-Router-Theme-und-Overlays.md`
  - `development/WP-E02-07-Component-Level-Teststandard-definieren.md`
  - `development/WP-E02-08-Pilot-Komponenten-fuer-Component-Level-Tests-absichern.md`
  - `development/WP-E02-09-Accessibility-und-Hydration-Checks-aufbauen.md`
  - `development/WP-E02-10-SSOT-Digital-Twin-und-Anti-Technical-Debt-Gates.md`
  - `development/WP-E02-11-Dokumentations-und-Demo-Referenzpfade-pruefbar-machen.md`
  - `development/WP-E02-12-Reporting-lokale-Befehle-und-CI-Vorbereitung.md`
  - `development/WP-E02-13-Testpflicht-und-Scaffold-Anschluss-dokumentieren.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Accessibility-Hydration-Testregeln.md`
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `scripts/verify_xtend_core_contracts.js`

## Ausgangslage

Epic 01 hat den priorisierten XTend-Core konsolidiert, dokumentiert und mit einem ersten repo-lokalen Verify-Script abgesichert. Diese Basis reicht jedoch noch nicht aus, um XTend nachhaltig weiterzuentwickeln, weil bisher weder der gesamte Plattform-Kern noch der breitere Komponenten-Katalog ueber eine abgestufte, wiederholbare Test-Suite abgesichert sind.

Der Epic reagiert auf folgende Lage:

- der aktuelle Verify-Pfad prueft nur einen Teil der Core-Vertraege
- Component-Level-Tests existieren noch nicht als Standard
- Browser-, Hydration-, Accessibility- und Integrationspfade sind nicht systematisch abgedeckt
- SSOT, Digital Twin Principle, Technical-Debt-Vermeidung und deterministische Laufzeitvertraege muessen als pruefbare Qualitaetskriterien in die Test-Suite einfliessen

## Wichtige Randbedingung

Die Test-Suite darf nicht nur den Core absichern. Sie muss so aufgebaut werden, dass dieselben Standards auch auf moderne XTend-Komponenten, spaetere Builder-Artefakte und kuenftige Rendering-/Templating-Erweiterungen anwendbar sind.

Daraus folgt:

- die Testarchitektur muss Core- und Component-Level gleichermassen adressieren
- die ADR-Prinzipien sind keine lose Guideline, sondern ein zentraler Testgegenstand
- die Suite soll lokal, CI-faehig und fuer menschliche wie AI-Agent-Entwickler leicht nutzbar sein

## Zielbild

Nach Abschluss des Epics besitzt XTend eine abgestufte Test-Suite, die den priorisierten Plattform-Kern, API-nahe Komponenten und einen wachsenden Komponenten-Katalog entlang eines gemeinsamen Qualitaetsmodells prueft.

Das Zielbild umfasst:

- eine dokumentierte Teststrategie fuer Core-, Component-, Integrations- und Browser-Pfade
- automatisierte Contract- und Smoke-Tests fuer Loader, Manifest, `xstate`, API, Router, Theme und Overlays
- Component-Level-Tests fuer Attribute, Events, Slots, Accessibility, State-Sync und Hydration
- explizite Checks gegen SSOT, Digital Twin Principle und Technical-Debt-Anti-Patterns
- eine Teststruktur, die kuenftig durch `XTend-Scaffold` standardisiert mitgenutzt werden kann

## In Scope

- Test-Architektur fuer XTend-Core und XTend-Komponenten
- repo-lokales und spaeter CI-faehiges Test-Setup
- Browsernahe Smoke- und Integrationspfade
- Component-Level-Tests fuer bestehende und kuenftig modernisierte Komponenten
- Accessibility-, Hydration-, API- und Dokumentationsbeispiele als Testgegenstand
- Test-Richtlinien, Reporting und Definition von Test-Pflichtartefakten

## Out of Scope

- umfassende neue Produktfeatures ausserhalb der Testbarkeit
- Build-Tooling oder Generatoren, die erst in Epic 03 entstehen sollen
- vollstaendige Rendering-/Templating-Architektur, die erst in Epic 04 behandelt wird
- ein schwergewichtiges Test-Setup, das XTend unnoetig kompliziert oder in starre Tooling-Entscheidungen zwingt

## Problemfelder, die dieser Epic loesen muss

- Es gibt bislang keinen durchgaengigen Teststandard fuer XTend.
- Core- und Component-Level sind testseitig noch nicht als gemeinsames System modelliert.
- SSOT und Digital Twin Principle sind dokumentiert, aber noch nicht breit als Testkriterium operationalisiert.
- Browser- und Hydrationspfade koennen weiterhin unbemerkt regressieren.
- Neue oder modernisierte Komponenten haben noch keinen verbindlichen Test-Rahmen.

## Arbeitsstroeme

### WS1 - Teststrategie und Architektur

Ziel: Eine gemeinsame Test-Taxonomie fuer XTend definieren.

Erwartete Ergebnisse:

- definierte Ebenen fuer Contract-, Smoke-, Component-, Integrations- und Browser-Tests
- klare Zuordnung, welche Risiken auf welcher Ebene geprueft werden
- dokumentierte Entscheidung fuer Test-Runner, Browser-Harness und Reporting-Modell

### WS2 - Core-Regression und Contract-Tests

Ziel: Den Plattform-Kern ueber automatisierte, belastbare Contracts absichern.

Erwartete Ergebnisse:

- geharteter Verify-Pfad fuer Loader, Manifest, `xstate`, API, Router, Theme und Overlay-Komponenten
- reproduzierbare Regressionstests fuer priorisierte Kernfluesse
- pruefbare Anti-Pattern-Checks gegen lokale UI-Flags, asynchrone Workarounds und Contract-Drift

### WS3 - Component-Level-Tests

Ziel: XTend-Komponenten ueber ihren oeffentlichen Vertrag pruefbar machen.

Erwartete Ergebnisse:

- standardisierte Tests fuer Attribute, Properties, Events, Slots und Accessibility
- State- und Lifecycle-Tests fuer komponentennahe Nutzung von `xstate`
- ein Pilot-Set modernisierter Komponenten als Referenz fuer die kuenftige Breite

### WS4 - Browser-, Hydration- und A11y-Pfade

Ziel: Sichtbare Nutzerfluesse und echte Laufzeitpfade in die Suite aufnehmen.

Erwartete Ergebnisse:

- Smoke-Fluesse fuer Navigation, Dialog/Modal, Theme-Wechsel und API-Helfer im Browser
- Checks fuer Hydration und Laufzeitaktivierung
- grundlegende Accessibility-Pruefungen fuer Fokus, Tastatur und ARIA

### WS5 - Developer Workflow und Testpflicht

Ziel: Testen zum Standardpfad fuer XTend-Entwicklung machen.

Erwartete Ergebnisse:

- dokumentierte Test-Pflichten fuer Core und Komponenten
- einfacher lokaler Startpfad fuer Entwickler und AI-Agenten
- vorbereiteter Anschluss fuer `XTend-Scaffold`, damit spaetere Komponenten die Suite direkt nutzen

## Initiale Arbeitspakete

- `E02-001`: Teststrategie fuer XTend mit Ebenen, Pfaden und Priorisierung schriftlich festlegen.
- `E02-002`: Verify-Script aus Epic 01 in ein groesseres Test-Harness ueberfuehren.
- `E02-003`: Browserfaehige Smoke-Tests fuer Loader, API, Router, Theme und Overlay-Komponenten aufbauen.
- `E02-004`: Component-Level-Teststandard fuer Attribute, Events, Slots, Accessibility und State-Sync definieren.
- `E02-005`: Pilot-Komponenten fuer Component-Level-Tests auswaehlen und absichern.
- `E02-006`: SSOT-, Digital-Twin- und Anti-Technical-Debt-Kriterien als explizite Test-Checks modellieren.
- `E02-007`: Dokumentationsbeispiele und Demos als pruefbare Referenzpfade anbinden.
- `E02-008`: Test-Reporting und lokales Entwickler-Entry-Point standardisieren.
- `E02-009`: Testpflichten fuer kuenftige Komponenten-Modernisierung dokumentieren.
- `E02-010`: Abschlussreview gegen ADR, Compliance und priorisierte Risiko-Pfade durchfuehren.

## Abhaengigkeiten

- abgeschlossener Epic 01 als konsolidierte Core-Basis
- Entscheidung fuer ein XTend-taugliches Test-Setup mit ES-Modulen und Custom Elements
- Klarheit, welche Komponenten als erste Pilot-Matrix fuer Component-Level-Tests dienen
- Verfuegbarkeit reproduzierbarer Demo- oder Fixture-Pfade fuer Browser-Tests

## Risiken

- Eine zu grosse Suite ohne Priorisierung fuehrt frueh zu Traegheit statt zu Qualitaetsgewinn.
- Flaky Browser-Tests koennen Vertrauen in die Suite untergraben.
- Wenn ADR-Prinzipien nicht explizit in Testregeln uebersetzt werden, bleibt die Suite technisch, aber nicht architektonisch wirksam.
- Eine rein Core-zentrierte Suite wuerde den groessten spaeteren Risikobereich im Komponenten-Katalog offen lassen.

## Akzeptanzkriterien

- XTend besitzt eine dokumentierte Teststrategie fuer Core und Komponenten.
- Fuer alle priorisierten Kernfluesse existieren automatisierte Contract-, Smoke- oder Browser-Tests.
- Es gibt einen standardisierten Component-Level-Testpfad fuer moderne XTend-Komponenten.
- SSOT, Digital Twin Principle und Anti-Technical-Debt-Kriterien sind als Testlogik oder Review-Gates operationalisiert.
- Die Suite ist lokal startbar, nachvollziehbar dokumentiert und fuer spaetere CI-Anbindung vorbereitet.
- Der Epic verbessert nicht nur den Core, sondern schafft dieselbe Qualitaetsbasis fuer den Component-Katalog.

## KPI-Baseline

- `1` repo-lokaler Verify-Script fuer den priorisierten Core
- `0` standardisierte Component-Level-Tests fuer XTend-Komponenten
- `0` belastbare Browser-/E2E-Pfade fuer priorisierte XTend-Fluesse
- `0` dokumentierte Testpflicht fuer neue oder modernisierte Komponenten
- mehrere architektonische Prinzipien sind dokumentiert, aber noch nicht breit als Testkriterien operationalisiert

## KPI-Ziele

- `100%` der priorisierten Kernfluesse besitzen mindestens einen automatisierten Testpfad
- `100%` der ausgewaehlten Pilot-Komponenten besitzen Component-Level-Tests nach gemeinsamem Standard
- `100%` der kuenftig modernisierten Komponenten erhalten einen dokumentierten Testpflichtpfad
- `0` ungetestete High-Risk-Pfade in Loader, API, Router, Theme und Overlay/Feedback fuer den definierten Prioritaetsumfang
- dokumentierte Unterstuetzung fuer lokale und spaetere CI-Ausfuehrung der XTend-Test-Suite

## Vorschlag fuer die Umsetzungsreihenfolge

1. Teststrategie und Runner-/Harness-Entscheidung
2. Ausbau des Core-Verify-Pfads zur abgestuften Core-Suite
3. Browser- und Hydration-Smokes fuer priorisierte Kernfluesse
4. Component-Level-Teststandard und Pilot-Komponenten
5. Testpflicht, Reporting und Dokumentation
6. Abschlussreview gegen ADR, Compliance und offene Risiko-Pfade

## Definition of Done

Der Epic ist abgeschlossen, wenn XTend ueber eine nachvollziehbare, automatisierte Test-Suite fuer Core- und Component-Level verfuegt, die die zentralen Architekturprinzipien des Projekts als pruefbare Qualitaetsbarrieren verankert und fuer nachfolgende Epics wiederverwendbar macht.

## Implementierungsstart Mai 2026

Epic 02 wurde am 3. Mai 2026 operativ gestartet. Als erster Umsetzungsschritt wurde der Epic in konkrete Workpackages zerlegt und das Backlog unter `development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md` angelegt.

Aktueller Startpunkt:

- `WP-01`: Teststrategie und Harness-Entscheidung ist `completed`.
- `WP-02`: Testprojektstruktur und lokale Runner-Entry-Points ist `completed`.
- `WP-03`: Core-Verify in Test-Harness ueberfuehren ist `completed`.
- `WP-04`: Contract-Assertions, Fixtures und Shared Test Utilities ist `completed`.
- `WP-05`: Browser-Smoke-Harness fuer Custom Elements ist `completed`.
- `WP-06`: Core-Browser-Smokes fuer Loader, API, Router, Theme und Overlays ist `completed`.
- `WP-07`: Component-Level-Teststandard definieren ist `completed`.
- `WP-08`: Pilot-Komponenten fuer Component-Level-Tests absichern ist `completed`.
- `WP-09`: Accessibility- und Hydration-Checks aufbauen ist `completed`.
- `WP-10`: SSOT-, Digital-Twin- und Anti-Technical-Debt-Gates ist `completed`.
- `WP-11`: Dokumentations- und Demo-Referenzpfade pruefbar machen ist `completed`.
- `WP-12`: Reporting, lokale Befehle und CI-Vorbereitung ist `completed`.
- `WP-13`: Testpflicht und Scaffold-Anschluss dokumentieren ist `completed`.
- `WP-14`: Epic-Abschlussreview und KPI-Abnahme ist `completed`.
- Epic 02 ist abgeschlossen.
- Die bestehende Core-Verifikation ueber `scripts/verify_xtend_core_contracts.js` bleibt als kompatibler Legacy-Einstieg erhalten. Der lokale Suite-Runner ist ueber `node scripts/run_xtend_tests.js` verfuegbar und nutzt fuer `core` die strukturierte Suite in `tests/core/core_contract_suite.js`. Die Suite `architecture` prueft SSOT-, Digital-Twin- und Anti-Technical-Debt-Gates. Die Suite `components` prueft die ersten Pilot-Komponenten `x-alert`, `x-toast` und `x-modal`. Die Suite `a11y-hydration` prueft Accessibility- und Hydration-Mindestgates fuer `x-alert`, `x-toast`, `x-modal`, `x-dialog` und die Browser-Fixtures. Die Suite `references` prueft Doku-Menue, priorisierte Dokumentation, Demo-HTML-Pfade, die XTendRMT-Bestcase-RMT-Metadaten, den Testpflicht-/Scaffold-Anschluss sowie den Epic-02-Abschluss. Der Browser-Smoke-Harness nutzt als Default eine deterministische Fixture-Contract-Abnahme fuer Custom Elements und priorisierte Core-Fluesse; Safari-WebDriver ist ein optionaler Zusatzlauf. Der Runner unterstuetzt maschinenlesbares Reporting ueber `--json` und `--report <path>` sowie NPM-Scripts. Der Component-Level-Teststandard ist unter `development/XTend-Component-Level-Teststandard.md` verbindlich dokumentiert; die konkreten A11y-/Hydration-Regeln liegen unter `development/XTend-Accessibility-Hydration-Testregeln.md`, die Architecture-Gate-Regeln unter `development/XTend-Architecture-Gate-Regeln.md`, die Doku-/Demo-Referenzen unter `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`, Reporting und CI-Vorbereitung unter `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`, Testpflicht und Scaffold-Anschluss unter `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`, Abschlussreview und KPI-Abnahme unter `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`.
