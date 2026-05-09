# Backlog zu Epic 02 - XTend Test-Suite und Qualitaetsbarrieren

- Status: Completed
- Datum: 3. Mai 2026
- Bezug:
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/BACKLOG-EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Accessibility-Hydration-Testregeln.md`
  - `development/XTend-Architecture-Gate-Regeln.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/WP-E02-07-Component-Level-Teststandard-definieren.md`
  - `development/WP-E02-08-Pilot-Komponenten-fuer-Component-Level-Tests-absichern.md`
  - `development/WP-E02-09-Accessibility-und-Hydration-Checks-aufbauen.md`
  - `development/WP-E02-10-SSOT-Digital-Twin-und-Anti-Technical-Debt-Gates.md`
  - `development/WP-E02-11-Dokumentations-und-Demo-Referenzpfade-pruefbar-machen.md`
  - `development/WP-E02-12-Reporting-lokale-Befehle-und-CI-Vorbereitung.md`
  - `development/WP-E02-13-Testpflicht-und-Scaffold-Anschluss-dokumentieren.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `compliance/update-instructions.md`
  - `compliance/xtend-design-guidelines.md`
  - `scripts/verify_xtend_core_contracts.js`

## Zweck

Dieses Dokument zerlegt Epic 02 in konkrete Workpackages, die die in Epic 01 begonnene Core-Verifikation zu einer abgestuften, wiederholbaren Test-Suite ausbauen. Der Backlog priorisiert zuerst Teststrategie, Harness und lokale Entry-Points, danach Core- und Browser-Smokes, anschliessend Component-Level-, Accessibility-, Hydration- und Compliance-Gates.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Ziel, Scope und Zielartefakte klar sind
- die benoetigten Vorgaenger erledigt oder bewusst entkoppelt sind
- die betroffenen Test-, Core-, Komponenten- oder Doku-Dateien bekannt sind
- ein pruefbares Definition-of-Done vorliegt
- der geplante Testpfad lokal ohne CI-Abhaengigkeit nachvollziehbar ausgefuehrt werden kann

## Priorisierungslogik

- `P0`: Blockiert den Epic-Fortschritt oder schafft die Grundlage fuer verlaessliche Tests
- `P1`: Stellt Kernabdeckung fuer Core-, Browser-, Component- oder Compliance-Fluesse her
- `P2`: Haertet, dokumentiert, integriert oder bereitet CI-/Scaffold-Nutzung vor

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden

## Naechste startbare Workpackages

- Keine offenen Workpackages innerhalb Epic 02.

Epic 02 ist abgeschlossen. `WP-01` bis `WP-14` haben Strategie, Struktur, Core-Harness, Shared Utilities, Browser-Smokes, den Component-Level-Teststandard, erste Pilot-Component-Suites, einen dedizierten Accessibility-/Hydration-Gate, SSOT-/Digital-Twin-/Anti-Technical-Debt-Gates, pruefbare Doku-/Demo-Referenzpfade, einheitliches Reporting mit CI-Vorbereitung, eine verbindliche Testpflicht mit Scaffold-Anschluss sowie das finale KPI-Abschlussreview geschaffen. Safari-WebDriver bleibt wegen lokaler OS-/Browser-Abhaengigkeit optional.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-01` | P0 | completed | WS1 | Teststrategie und Harness-Entscheidung | - |
| `WP-02` | P0 | completed | WS1 | Testprojektstruktur und lokale Runner-Entry-Points | `WP-01` |
| `WP-03` | P0 | completed | WS2 | Core-Verify in Test-Harness ueberfuehren | `WP-01`, `WP-02` |
| `WP-04` | P0 | completed | WS2 | Contract-Assertions, Fixtures und Shared Test Utilities | `WP-02`, `WP-03` |
| `WP-05` | P0 | completed | WS4 | Browser-Smoke-Harness fuer Custom Elements | `WP-01`, `WP-02` |
| `WP-06` | P1 | completed | WS4 | Core-Browser-Smokes fuer Loader, API, Router, Theme und Overlays | `WP-05` |
| `WP-07` | P1 | completed | WS3 | Component-Level-Teststandard definieren | `WP-01`, `WP-04` |
| `WP-08` | P1 | completed | WS3 | Pilot-Komponenten fuer Component-Level-Tests absichern | `WP-07` |
| `WP-09` | P1 | completed | WS4 | Accessibility- und Hydration-Checks aufbauen | `WP-05`, `WP-07` |
| `WP-10` | P1 | completed | WS2 | SSOT-, Digital-Twin- und Anti-Technical-Debt-Gates | `WP-04`, `WP-07` |
| `WP-11` | P2 | completed | WS5 | Dokumentations- und Demo-Referenzpfade pruefbar machen | `WP-06`, `WP-08` |
| `WP-12` | P2 | completed | WS5 | Reporting, lokale Befehle und CI-Vorbereitung | `WP-02`, `WP-03`, `WP-05` |
| `WP-13` | P2 | completed | WS5 | Testpflicht und Scaffold-Anschluss dokumentieren | `WP-07`, `WP-12` |
| `WP-14` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme | `WP-10`, `WP-11`, `WP-12`, `WP-13` |

## Workpackages im Detail

### WP-01 - Teststrategie und Harness-Entscheidung

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - eine verbindliche Teststrategie fuer Core-, Component-, Integrations- und Browser-Pfade festlegen
- Scope:
  - Testebenen
  - Runner-/Harness-Entscheidung
  - lokale Ausfuehrbarkeit
  - Abgrenzung zwischen Contract-, Smoke-, Browser- und Component-Tests
- Zielartefakte:
  - Teststrategie-Dokument im `development`-Ordner
  - Entscheidung fuer minimalen lokalen Test-Harness
  - Mapping von Epic-02-Arbeitspaketen auf Testebenen
  - siehe `development/WP-E02-01-Teststrategie-und-Harness-Entscheidung.md`
- Betroffene Dateien:
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `scripts/verify_xtend_core_contracts.js`
  - kuenftige Teststruktur im Projekt
- Definition of Done:
  - Testebenen und deren Verantwortungen sind schriftlich definiert
  - Runner- und Harness-Richtung ist dokumentiert
  - der bestehende Core-Verify-Pfad ist als Startpunkt oder Legacy-Pfad eingeordnet

### WP-02 - Testprojektstruktur und lokale Runner-Entry-Points

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - eine nachvollziehbare Projektstruktur fuer die XTend-Test-Suite anlegen
- Scope:
  - Verzeichnisse fuer Core-, Component-, Browser- und Fixture-Tests
  - lokale Startpunkte fuer Entwickler und AI-Agenten
  - Trennung von Test-Utilities und konkreten Testfaellen
- Zielartefakte:
  - Testverzeichnisstruktur
  - lokaler Runner-Entry-Point
  - dokumentierte Startbefehle
  - siehe `development/WP-E02-02-Testprojektstruktur-und-lokale-Runner-Entry-Points.md`
- Betroffene Dateien:
  - `scripts/`
  - kuenftiges `tests/` oder aequivalentes Testverzeichnis
  - ggf. `package.json`, falls ein Node-basierter Test-Entry-Point eingefuehrt wird
- Definition of Done:
  - die Teststruktur ist im Repository sichtbar
  - ein lokaler Test-Entry-Point kann ohne Vorwissen gefunden werden
  - der bestehende Verify-Script bleibt lauffaehig

### WP-03 - Core-Verify in Test-Harness ueberfuehren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `scripts/verify_xtend_core_contracts.js` in den neuen Test-Harness einordnen und wiederverwendbar machen
- Scope:
  - bestehende Core-Checks erhalten
  - Ausgabe und Exit-Codes stabil halten
  - Core-Checks modularer fuer spaetere Erweiterung strukturieren
- Zielartefakte:
  - integrierter Core-Contract-Testpfad
  - dokumentierte Rueckwaertskompatibilitaet zum bisherigen Verify-Aufruf
  - Basis fuer weitere Core-Regressionstests
  - siehe `development/WP-E02-03-Core-Verify-in-Test-Harness-ueberfuehren.md`
- Betroffene Dateien:
  - `scripts/verify_xtend_core_contracts.js`
  - kuenftige Test-Runner-Dateien
  - `components/manifest.json`
  - `api.js`
  - `components/xstate.js`
  - `components/xtheme.js`
  - `components/xrouter.js`
  - `components/xmodal.js`
  - `components/xdialog.js`
  - `components/xtoast.js`
  - `components/xalert.js`
- Definition of Done:
  - alle bisherigen Verify-Checks laufen weiterhin erfolgreich
  - Core-Checks sind im neuen Test-Harness auffindbar
  - neue Core-Checks koennen ohne Kopieren grosser Script-Bloecke ergaenzt werden

### WP-04 - Contract-Assertions, Fixtures und Shared Test Utilities

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - gemeinsame Test-Hilfen fuer Contract-, Manifest-, Event-, State- und DOM-nahe Pruefungen schaffen
- Scope:
  - Assertion-Helfer
  - Fixture-Ladepfade
  - DOM-nahe Test-Basis ohne Browser-Zwang, wo sinnvoll
  - klare Trennung zwischen Testdaten und produktivem Code
- Zielartefakte:
  - Shared Test Utilities
  - Fixture-Konventionen
  - Beispiel-Assertions fuer Core-Vertraege
  - siehe `development/WP-E02-04-Contract-Assertions-Fixtures-und-Shared-Test-Utilities.md`
- Betroffene Dateien:
  - kuenftige Test-Utility-Dateien
  - `scripts/verify_xtend_core_contracts.js`
  - Test-Fixtures
- Definition of Done:
  - wiederkehrende Assertion-Muster sind zentralisiert
  - Test-Fixtures sind vom produktiven Code getrennt
  - neue Tests koennen die Utilities ohne versteckte globale Voraussetzungen nutzen

### WP-05 - Browser-Smoke-Harness fuer Custom Elements

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - einen browsernahen Smoke-Test-Pfad fuer XTend Custom Elements etablieren
- Scope:
  - echte Custom Elements
  - Modul-Importe
  - DOM-Hydration
  - sichtbare Runtime-Aktivierung
  - Stabilitaet gegen Flakiness
- Zielartefakte:
  - Browser-Smoke-Harness
  - minimaler Test-Host oder Fixture-Seite
  - dokumentierter lokaler Ausfuehrungspfad
  - siehe `development/WP-E02-05-Browser-Smoke-Harness-fuer-Custom-Elements.md`
- Betroffene Dateien:
  - kuenftige Browser-Testdateien
  - `xtend-dev.js`
  - `xtend.css`
  - `components/*.js`
  - Demo-/Fixture-HTML-Dateien
- Definition of Done:
  - mindestens ein Custom Element kann im Browser-Harness geladen und verifiziert werden
  - Hydration und Sichtbarkeit sind testbar
  - der Harness ist lokal reproduzierbar
  - alternative Fixture-Contract-Abnahme ist dokumentiert; Safari-WebDriver ist optional

### WP-06 - Core-Browser-Smokes fuer Loader, API, Router, Theme und Overlays

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - priorisierte Kernfluesse im echten Browserpfad absichern
- Scope:
  - Loader-Start
  - API-Initialisierung
  - Router-Navigation
  - Theme-Wechsel
  - Dialog-/Modal-/Feedback-Fluesse
- Zielartefakte:
  - Browser-Smoke-Tests fuer priorisierte Core-Fluesse
  - Fixtures fuer Navigation, Theme und Overlay
  - Regression-Gates fuer sichtbare UI-Aktivierung
  - siehe `development/WP-E02-06-Core-Browser-Smokes-fuer-Loader-API-Router-Theme-und-Overlays.md`
- Betroffene Dateien:
  - `xtend-dev.js`
  - `api.js`
  - `components/xrouter.js`
  - `components/xlink.js`
  - `components/xtheme.js`
  - `components/xdialog.js`
  - `components/xmodal.js`
  - `components/xtoast.js`
  - `components/xalert.js`
- Definition of Done:
  - Loader, API, Router, Theme und Overlay/Feedback besitzen je mindestens einen Browser-Smoke
  - Tests pruefen sichtbares Verhalten oder DOM-Zustand, nicht nur Import-Erfolg
  - bekannte Core-Regressionen aus Epic 01 sind abgedeckt

### WP-07 - Component-Level-Teststandard definieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - einen einheitlichen Teststandard fuer XTend-Komponenten beschreiben
- Scope:
  - Attribute
  - Properties
  - Events
  - Slots
  - State-Sync
  - Accessibility
  - Hydration
- Zielartefakte:
  - Component-Teststandard im `development`- oder `docs`-Bereich
  - Checkliste fuer neue und modernisierte Komponenten
  - Mapping zu `XTend-Scaffold`
  - siehe `development/XTend-Component-Level-Teststandard.md`
  - siehe `development/WP-E02-07-Component-Level-Teststandard-definieren.md`
- Betroffene Dateien:
  - `docs/components/*.md`
  - `development/*.md`
  - kuenftige Component-Test-Fixtures
- Definition of Done:
  - neue Component-Tests folgen einem dokumentierten Schema
  - Pflichtchecks und optionale Checks sind getrennt
  - der Standard ist mit kuenftigem Scaffold-Output kompatibel

### WP-08 - Pilot-Komponenten fuer Component-Level-Tests absichern

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - ein erstes Pilot-Set moderner XTend-Komponenten mit Component-Level-Tests absichern
- Scope:
  - Auswahl risikoarmer und risikoreicher Komponenten
  - Abdeckung von State-, Slot-, Event- und Accessibility-Pfaden
  - Referenzmuster fuer kuenftige Tests
- Zielartefakte:
  - Component-Level-Tests fuer Pilot-Komponenten
  - dokumentierte Auswahlentscheidung
  - wiederverwendbare Testmuster
  - siehe `development/WP-E02-08-Pilot-Komponenten-fuer-Component-Level-Tests-absichern.md`
- Betroffene Dateien:
  - `components/xbutton.js`
  - `components/xalert.js`
  - `components/xtoast.js`
  - `components/xmodal.js`
  - `components/xrouter.js`
  - ggf. weitere Pilot-Komponenten
- Definition of Done:
  - mindestens drei Pilot-Komponenten besitzen Component-Level-Tests
  - Event-, Attribute- und Accessibility-Pfade sind beispielhaft abgedeckt
  - die Tests dienen als Vorlage fuer weitere Komponenten

### WP-09 - Accessibility- und Hydration-Checks aufbauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Accessibility und Hydration als feste Testdimensionen verankern
- Scope:
  - ARIA-Attribute
  - Fokusverhalten
  - Tastaturbedienung
  - prefers-reduced-motion
  - Hydration und sichtbare Aktivierung
- Zielartefakte:
  - A11y-Testregeln
  - Hydration-Smokes
  - dokumentierte Mindestkriterien fuer Komponenten
  - siehe `development/XTend-Accessibility-Hydration-Testregeln.md`
  - siehe `development/WP-E02-09-Accessibility-und-Hydration-Checks-aufbauen.md`
- Betroffene Dateien:
  - `components/*.js`
  - `xtend.css`
  - Demo-/Fixture-Dateien
  - `compliance/xtend-design-guidelines.md`
- Definition of Done:
  - Accessibility-Mindestkriterien sind als Tests oder Review-Gates operationalisiert
  - Hydration kann reproduzierbar gegen Fixture-Seiten geprueft werden
  - relevante Core-Komponenten respektieren die definierten Checks

### WP-10 - SSOT-, Digital-Twin- und Anti-Technical-Debt-Gates

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Architekturprinzipien aus ADR und Compliance als pruefbare Gates in die Suite ueberfuehren
- Scope:
  - Single Source of Truth
  - Digital Twin Principle
  - lokale UI-Flags als Anti-Pattern
  - asynchrone Workarounds und Contract-Drift
  - State- und Event-Namenskonventionen
- Zielartefakte:
  - technische Gate-Checks oder Review-Checks
  - dokumentierte Anti-Pattern-Liste fuer Tests
  - Erweiterungen am Core-/Component-Teststandard
  - siehe `development/XTend-Architecture-Gate-Regeln.md`
  - siehe `development/WP-E02-10-SSOT-Digital-Twin-und-Anti-Technical-Debt-Gates.md`
- Betroffene Dateien:
  - `docs/XTend-ADR.md`
  - `compliance/digital-twin-principle.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `components/*.js`
  - Test-Harness-Dateien
- Definition of Done:
  - zentrale Architekturprinzipien sind als konkrete Checks beschrieben
  - mindestens ein Gate laeuft automatisiert oder ist als Reviewpflicht dokumentiert
  - neue Component-Arbeit kann gegen diese Gates bewertet werden

### WP-11 - Dokumentations- und Demo-Referenzpfade pruefbar machen

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Doku-Beispiele und Demo-Pfade als Regression-Referenzen nutzbar machen
- Scope:
  - Dokumentationsbeispiele
  - bestehende Demo-HTML-Dateien
  - Komponenten-Dokumentation
  - XTendRMT-Bestcase-Demo als spaeterer Integrationspfad
- Zielartefakte:
  - pruefbare Referenzliste fuer Demos und Doku
  - Smoke-Pfade fuer priorisierte Beispiele
  - Dokumentationshinweis, welche Beispiele testrelevant sind
  - siehe `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - siehe `development/WP-E02-11-Dokumentations-und-Demo-Referenzpfade-pruefbar-machen.md`
- Betroffene Dateien:
  - `docs/*.md`
  - `docs/components/*.md`
  - `index.html`
  - `xstatetest.html`
  - `x-grid-test.html`
  - `xtendrmt-bestcase.html`
- Definition of Done:
  - priorisierte Demos sind als Test- oder Smoke-Referenz dokumentiert
  - mindestens ein Doku-/Demo-Pfad wird automatisiert oder halbautomatisiert geprueft
  - nicht testbare Beispiele sind bewusst markiert

### WP-12 - Reporting, lokale Befehle und CI-Vorbereitung

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Testausfuehrung und Testergebnisse fuer lokale Entwicklung und spaetere CI vereinheitlichen
- Scope:
  - lokale Befehle
  - strukturierte Ausgabe
  - Exit-Codes
  - CI-Vorbereitung ohne erzwungene CI-Einfuehrung
- Zielartefakte:
  - dokumentierte Testbefehle
  - konsistente Runner-Ausgabe
  - vorbereiteter CI-Anschluss
  - siehe `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - siehe `development/WP-E02-12-Reporting-lokale-Befehle-und-CI-Vorbereitung.md`
- Betroffene Dateien:
  - `scripts/`
  - ggf. `package.json`
  - `docs/README.md`
  - Test-Harness-Dateien
- Definition of Done:
  - lokale Entwickler koennen die Suite mit einem dokumentierten Befehl starten
  - fehlgeschlagene Tests liefern klare Exit-Codes
  - CI-Anschluss ist technisch vorbereitet oder dokumentiert

### WP-13 - Testpflicht und Scaffold-Anschluss dokumentieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die Testpflicht fuer neue, modernisierte und scaffolded Komponenten festlegen
- Scope:
  - Mindesttests pro Komponententyp
  - Doku- und Demo-Pflichten
  - Anschluss an `XTend-Scaffold`
  - Review-Kriterien fuer AI-Agenten und menschliche Entwickler
- Zielartefakte:
  - Testpflicht-Dokumentation
  - Scaffold-Anschlussregeln
  - Checkliste fuer neue Komponenten
  - siehe `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - siehe `development/WP-E02-13-Testpflicht-und-Scaffold-Anschluss-dokumentieren.md`
- Betroffene Dateien:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `xtend-builder/scaffold.config.js`
  - `docs/best-practices.md`
  - kuenftige Scaffold-Templates
- Definition of Done:
  - neue Komponenten haben einen dokumentierten Testpflichtpfad
  - Scaffold-Ausgaben koennen die Teststruktur mitnutzen
  - Review-Kriterien sind fuer Menschen und AI-Agenten nachvollziehbar

### WP-14 - Epic-Abschlussreview und KPI-Abnahme

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic-02-Ergebnisse gegen KPI, ADR, Compliance und Risikoabdeckung final abnehmen
- Scope:
  - Review
  - KPI-Check
  - Restpunkte
  - Entscheidung ueber Uebergang zu Epic 03, Epic 04 oder Epic 05
- Zielartefakte:
  - Abschlussprotokoll
  - aktualisierte KPI-Bewertung
  - dokumentierte Rest- oder Folgepunkte
  - siehe `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
- Betroffene Dateien:
  - `development/*.md`
  - Test-Harness-Dateien
  - relevante Doku- und Komponenten-Dateien
- Definition of Done:
  - definierte High-Risk-Pfade sind getestet oder bewusst als Restpunkt markiert
  - KPI-Ziele sind gemessen
  - naechster Umsetzungsschritt ist entscheidbar

## Epic-Start

Epic 02 ist operativ abgeschlossen. `WP-01` bis `WP-14` sind abgeschlossen und legen Strategie, Harness, Core-, Browser-, Component-, A11y-/Hydration-, Architecture-, Reference-, Reporting-, Testpflicht- und Abschlussreview-Gates fest. `WP-13` verbindet den Component-Level-Teststandard mit `XTend-Scaffold`; `WP-14` nimmt den Epic gegen KPI, ADR, Compliance und Risikoabdeckung ab. Ein echter Safari-WebDriver-Lauf bleibt als optionale lokale Zusatzdiagnose erhalten.
