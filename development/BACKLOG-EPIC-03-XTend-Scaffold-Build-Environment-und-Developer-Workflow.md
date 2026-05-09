# Backlog zu Epic 03 - XTend-Scaffold Build-Environment und Developer-Workflow

- Status: Completed
- Datum: 4. Mai 2026
- Bezug:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `development/XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md`
  - `development/WP-E03-01-Scaffold-Architektur-Scope-und-Tooling-Entscheidung-festlegen.md`
  - `development/WP-E03-02-Projektlayout-Modulgrenzen-und-lokale-CLI-Entry-Points-definieren.md`
  - `development/WP-E03-03-Komponenten-Blueprint-und-Artefaktcontract-entwerfen.md`
  - `development/WP-E03-04-Generator-Grundgeruest-und-Template-Ladepfad-anlegen.md`
  - `development/WP-E03-05-Pflichtartefakt-Generatoren-fuer-Komponente-Doku-Tests-Fixtures-und-Types-umsetzen.md`
  - `development/WP-E03-06-Manifest-und-Hydrations-Wiring-in-den-Scaffold-Workflow-integrieren.md`
  - `development/WP-E03-07-State-API-und-Feature-Wiring-Patterns-vorbereiten.md`
  - `development/WP-E03-08-Lokale-Developer-Workflows-und-Verifikation-standardisieren.md`
  - `development/WP-E03-09-Typisierungsstrategie-und-Template-RMT-Anschluss-vorbereiten.md`
  - `development/WP-E03-10-Demo-Preview-und-Referenzpfade-an-die-Test-Suite-anbinden.md`
  - `development/WP-E03-11-Extension-Punkte-fuer-Templating-Rendering-und-Root-Lifecycle-vorbereiten.md`
  - `development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `xtend-builder/README.md`
  - `xtend-builder/blueprints/component-blueprint.contract.js`
  - `xtend-builder/generators/registry.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/wiring/manifest.js`
  - `xtend-builder/wiring/hydration.js`
  - `xtend-builder/wiring/features.js`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtend-builder/templates/registry.js`
  - `xtend-builder/templates/loader.js`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `xtend-builder/scaffold.config.js`
  - `scripts/run_xtend_tests.js`

## Zweck

Dieses Dokument zerlegt Epic 03 in konkrete Workpackages, die `XTend-Scaffold` von der aktuellen Konfiguration zu einem nutzbaren Build-Environment und Developer-Workflow ausbauen. Der Backlog priorisiert zuerst Architektur, Projektlayout und klare Generatorgrenzen, danach Komponenten-Blueprints und Pflichtartefakte, anschliessend Manifest-/Hydrations-/Feature-Wiring, lokale Verifikation und zukunftsfaehige Extension-Punkte.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Ziel, Scope und Zielartefakte klar sind
- die benoetigten Vorgaenger erledigt oder bewusst entkoppelt sind
- betroffene Scaffold-, Test-, Doku- oder Komponentenpfade bekannt sind
- ein pruefbares Definition-of-Done vorliegt
- der lokale Verifikationspfad ohne externe CI-Abhaengigkeit nachvollziehbar ist
- die Epic-02-Testpflicht fuer erzeugte Artefakte beruecksichtigt ist

## Priorisierungslogik

- `P0`: Schafft die Grundlage fuer Scaffold-Architektur, Generatorgrenzen oder lokale Nutzbarkeit
- `P1`: Erzeugt produktive Generator-, Wiring-, Test-, Typ- oder Workflow-Funktion
- `P2`: Haertet, dokumentiert, integriert oder bereitet kuenftige Templating-/RMT-Erweiterung vor

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden

## Naechste startbare Workpackages

- Keine offenen Workpackages innerhalb Epic 03.

Epic 03 ist abgeschlossen. `WP-01` bis `WP-12` haben Architektur, Projektlayout, Komponenten-Blueprint, Generator-Grundgeruest, Pflichtartefakt-Templates, Manifest-/Hydrations-Wiring, State-/API-/Feature-Wiring, lokale Developer-Workflows, Typing-/XTendRMT-Anschluss, Preview-/Referenzpfade, Extension-Punkte und das finale KPI-Abschlussreview geschaffen. `XTend-Scaffold` gilt als belastbare Grundlage fuer Epic 04 und Epic 05.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-01` | P0 | completed | WS1 | Scaffold-Architektur, Scope und Tooling-Entscheidung festlegen | Epic 01, Epic 02 |
| `WP-02` | P0 | completed | WS1 | Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren | `WP-01` |
| `WP-03` | P0 | completed | WS2 | Komponenten-Blueprint und Artefaktcontract entwerfen | `WP-01`, `WP-02` |
| `WP-04` | P0 | completed | WS2 | Generator-Grundgeruest und Template-Ladepfad anlegen | `WP-02`, `WP-03` |
| `WP-05` | P1 | completed | WS2 | Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen | `WP-04` |
| `WP-06` | P1 | completed | WS3 | Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren | `WP-04`, `WP-05` |
| `WP-07` | P1 | completed | WS3 | State-, API- und Feature-Wiring-Patterns vorbereiten | `WP-03`, `WP-06` |
| `WP-08` | P1 | completed | WS4 | Lokale Developer-Workflows und Verifikation standardisieren | `WP-04`, `WP-05`, `WP-06` |
| `WP-09` | P1 | completed | WS4 | Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten | `WP-03`, `WP-05` |
| `WP-10` | P2 | completed | WS4 | Demo-/Preview- und Referenzpfade an die Test-Suite anbinden | `WP-05`, `WP-08`, `WP-09` |
| `WP-11` | P2 | completed | WS5 | Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten | `WP-07`, `WP-09` |
| `WP-12` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme | `WP-08`, `WP-10`, `WP-11` |

## Workpackages im Detail

### WP-01 - Scaffold-Architektur, Scope und Tooling-Entscheidung festlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den fachlichen und technischen Scope von `XTend-Scaffold` festlegen
- Scope:
  - Rolle von `XTend-Scaffold` im XTend-Produktmodell
  - Minimal-Tooling fuer lokale Ausfuehrung
  - Generatorgrenzen zwischen Build-Environment, Runtime und Test-Suite
  - Umgang mit bestehenden Artefakten unter `xtend-builder/`
- Zielartefakte:
  - Architektur-/Scope-Dokument im `development`-Ordner
  - Entscheidung fuer Minimal-Tooling und Entry-Point-Strategie
  - Abgrenzung zu Epic 04 und Epic 05
  - initiale Bewertung von `xtend-builder/scaffold.config.js`
  - siehe `development/XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md`
  - siehe `development/WP-E03-01-Scaffold-Architektur-Scope-und-Tooling-Entscheidung-festlegen.md`
- Betroffene Dateien:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `xtend-builder/scaffold.config.js`
  - kuenftige `xtend-builder/`-Struktur
- Definition of Done:
  - Scope und Nicht-Ziele sind fuer Menschen und AI-Agenten eindeutig
  - Tooling-Entscheidung ist dokumentiert
  - Risiken fuer zu grosse Generatorabstraktion sind benannt
  - naechster Umsetzungsschritt fuer Projektlayout ist entscheidbar

### WP-02 - Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - eine stabile Projektstruktur fuer `XTend-Scaffold` definieren
- Scope:
  - Verzeichnisse fuer Generatoren, Blueprints, Templates, Utilities und Tests
  - lokale CLI- oder Script-Entry-Points
  - Trennung zwischen Config, Generatorlogik und Ausgabe-Artefakten
  - Namenskonventionen fuer scaffolded Module
- Zielartefakte:
  - sichtbare oder dokumentierte `xtend-builder/`-Struktur
  - lokaler Scaffold-Entry-Point
  - README oder Entwicklungsnotiz fuer Nutzung und Erweiterung
  - siehe `development/WP-E03-02-Projektlayout-Modulgrenzen-und-lokale-CLI-Entry-Points-definieren.md`
  - siehe `xtend-builder/README.md`
- Betroffene Dateien:
  - `xtend-builder/`
  - `package.json`
  - `scripts/`
  - `tests/`
- Definition of Done:
  - Scaffold-Projektlayout ist im Repository nachvollziehbar
  - ein lokaler Einstiegspfad ist definiert
  - spaetere Generatoren koennen ohne Strukturbruch ergaenzt werden

### WP-03 - Komponenten-Blueprint und Artefaktcontract entwerfen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den verbindlichen Blueprint fuer neue XTend-Komponenten entwerfen
- Scope:
  - Tag-, Datei-, Doku-, Test-, Fixture-, Typ- und Manifest-Vertrag
  - Profilabgleich mit `development/XTend-Component-Level-Teststandard.md`
  - Pflichtartefakte aus `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - Platzhalter- und Ausnahmeverhalten
- Zielartefakte:
  - Blueprint-Dokument
  - Artefaktmatrix fuer scaffolded Komponenten
  - Mapping auf `xtend-builder/scaffold.config.js`
  - siehe `development/WP-E03-03-Komponenten-Blueprint-und-Artefaktcontract-entwerfen.md`
  - siehe `xtend-builder/blueprints/README.md`
  - siehe `xtend-builder/blueprints/component-blueprint.contract.js`
- Betroffene Dateien:
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `xtend-builder/scaffold.config.js`
  - kuenftige Blueprint-/Template-Dateien
- Definition of Done:
  - jeder erzeugte Artefakttyp hat Zielpfad und Zweck
  - nicht anwendbare Artefakte haben dokumentierten Ausnahmeprozess
  - Blueprint passt zum Epic-02-Testpflicht-Gate

### WP-04 - Generator-Grundgeruest und Template-Ladepfad anlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - das technische Grundgeruest fuer Scaffold-Generatoren schaffen
- Scope:
  - Generator-Registry oder aequivalente Struktur
  - Template-Ladepfad
  - Eingabevalidierung fuer Tags, Profile und Features
  - trockener Lauf oder Plan-Ausgabe, falls sinnvoll
- Zielartefakte:
  - Generator-Grundgeruest unter `xtend-builder/`
  - wiederverwendbare Template-/Datei-Helfer
  - minimaler lokaler Aufruf
  - siehe `development/WP-E03-04-Generator-Grundgeruest-und-Template-Ladepfad-anlegen.md`
  - siehe `xtend-builder/generators/registry.js`
  - siehe `xtend-builder/templates/registry.js`
- Betroffene Dateien:
  - `xtend-builder/`
  - `package.json`
  - `tests/`
- Definition of Done:
  - Generator-Grundgeruest laesst sich lokal starten
  - unguelige Eingaben werden deterministisch abgelehnt
  - der Generator schreibt noch keine unkontrollierten Produktivdateien

### WP-05 - Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - die Epic-02-Testpflicht als echte Generatorausgabe umsetzen
- Scope:
  - Komponenten-Datei
  - Komponentendoku
  - Component-Level-Suite
  - lokale Fixture
  - Typdefinition oder dokumentierter Typ-Ausnahmefall
  - Manifest-Patch-Plan
- Zielartefakte:
  - Generatoren fuer Pflichtartefakte
  - Templates fuer Standardprofile
  - Testabdeckung fuer Ausgabeformate
  - siehe `development/WP-E03-05-Pflichtartefakt-Generatoren-fuer-Komponente-Doku-Tests-Fixtures-und-Types-umsetzen.md`
  - siehe `xtend-builder/generators/component-files.js`
  - siehe `xtend-builder/templates/loader.js`
- Betroffene Dateien:
  - `xtend-builder/`
  - `components/`
  - `docs/components/`
  - `tests/components/`
  - `components/manifest.json`
- Definition of Done:
  - ein Beispiel-Component-Plan erzeugt alle Pflichtartefakte oder dokumentierte Ausnahmen
  - Testdateien enthalten echte Assertions, keine leeren Platzhalter
  - Ausgabe folgt dem Component-Level-Teststandard

### WP-06 - Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - scaffolded Komponenten systemkonform an Manifest und Hydration anbinden
- Scope:
  - Manifest-Eintrag oder Patch-Plan
  - lokale URL-/Import-Konventionen
  - Loader-Kompatibilitaet
  - Hydration- und Rehydration-Mindestpfade
- Zielartefakte:
  - Manifest-Wiring-Regeln
  - Hydrations-Blueprints
  - Tests fuer Manifest- und Import-Ausgaben
  - siehe `development/WP-E03-06-Manifest-und-Hydrations-Wiring-in-den-Scaffold-Workflow-integrieren.md`
  - siehe `xtend-builder/wiring/manifest.js`
  - siehe `xtend-builder/wiring/hydration.js`
- Betroffene Dateien:
  - `components/manifest.json`
  - `xtend-dev.js`
  - `xtend-builder/`
  - `tests/browser/`
- Definition of Done:
  - Manifest-Ausgabe ist reproduzierbar
  - lokale Imports vermeiden unbeabsichtigte CDN-Abhaengigkeiten
  - Hydration-Mindestcontract ist in Templates sichtbar

### WP-07 - State-, API- und Feature-Wiring-Patterns vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - haeufige XTend-Integrationen als Scaffold-Patterns vorbereiten
- Scope:
  - `xstate`-Keys nach kanonischem Schema
  - Custom Events
  - XTend-API-Anbindung
  - Theme-, Router-, Overlay- und Feedback-Features
  - SSOT-/Digital-Twin-Konformitaet
- Zielartefakte:
  - Feature-Wiring-Blueprints
  - Profilbasierte State-/Event-Muster
  - Tests oder Review-Gates fuer Anti-Pattern-Vermeidung
  - siehe `development/WP-E03-07-State-API-und-Feature-Wiring-Patterns-vorbereiten.md`
  - siehe `xtend-builder/wiring/features.js`
- Betroffene Dateien:
  - `xtend-builder/`
  - `api.js`
  - `components/xstate.js`
  - `components/xrouter.js`
  - `components/xtheme.js`
  - `development/XTend-Architecture-Gate-Regeln.md`
- Definition of Done:
  - State- und Event-Ausgaben nutzen kanonische Namen
  - lokale UI-Flags werden nicht als zweite Wahrheitsquelle generiert
  - Feature-Templates bleiben optional und profilgesteuert

### WP-08 - Lokale Developer-Workflows und Verifikation standardisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Scaffold-Nutzung fuer Menschen und AI-Agenten lokal reproduzierbar machen
- Scope:
  - lokale Befehle
  - Dry-Run, Generate, Verify
  - JSON-/Text-Ausgabe fuer Generatorergebnisse
  - Anschluss an `node scripts/run_xtend_tests.js`
  - Dokumentation der Review-Schritte
- Zielartefakte:
  - dokumentierte Scaffold-Befehle
  - ggf. NPM-Scripts
  - lokale Verifikations- und Reporting-Pfade
  - siehe `development/WP-E03-08-Lokale-Developer-Workflows-und-Verifikation-standardisieren.md`
  - siehe `xtend-builder/workflows/developer-workflow.js`
- Betroffene Dateien:
  - `package.json`
  - `xtend-builder/`
  - `tests/README.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
- Definition of Done:
  - ein Entwickler kann Scaffold und Verifikation ohne Vorwissen starten
  - Generatorausgaben sind nachvollziehbar und pruefbar
  - Testpflicht-Gates sind im Workflow sichtbar

### WP-09 - Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Typisierung fuer scaffolded Komponenten und spaetere Template-/RMT-Pfade vorbereiten
- Scope:
  - `.d.ts`-Stubs
  - Event- und Detail-Typen
  - Attribut-/Property-Typisierung
  - Anschluss an spaetere XTendRMT-Templates und Routen
  - Grenzen zwischen Typdefinition und Runtime
- Zielartefakte:
  - Typisierungsstrategie
  - Generator-Templates fuer Typ-Artefakte
  - Mapping zu Epic 04 und Epic 05
  - siehe `development/WP-E03-09-Typisierungsstrategie-und-Template-RMT-Anschluss-vorbereiten.md`
  - siehe `xtend-builder/typing/component-types.js`
- Betroffene Dateien:
  - `components/*.d.ts`
  - `xtend-builder/`
  - `xtend-builder/typing/component-types.js`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Definition of Done:
  - Typ-Artefakte sind fuer oeffentliche JS-APIs standardisiert
  - Template-/RMT-Anschluss ist vorbereitet, aber nicht vorweggenommen
  - Ausnahmen fuer typfreie Komponenten sind dokumentiert

### WP-10 - Demo-/Preview- und Referenzpfade an die Test-Suite anbinden

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - scaffolded Artefakte als pruefbare Doku-/Demo-Referenzen nutzbar machen
- Scope:
  - Demo- oder Preview-Ausgabe
  - Referenzlisten
  - Doku-Menue oder Beispielpfade
  - Anschluss an `references` Suite
- Zielartefakte:
  - Demo-/Preview-Konvention
  - Referenz-Gate fuer Scaffold-Artefakte
  - Dokumentierte Beispielausgabe
  - siehe `development/WP-E03-10-Demo-Preview-und-Referenzpfade-an-die-Test-Suite-anbinden.md`
  - siehe `xtend-builder/preview/component-preview.js`
  - siehe `docs/previews/README.md`
- Betroffene Dateien:
  - `tests/references/reference_path_suite.js`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `docs/`
  - `xtend-builder/`
- Definition of Done:
  - scaffolded Demos koennen als Referenzpfad registriert werden
  - Reference-Gate prueft mindestens die Scaffold-Konventionen
  - Demo-Ausgabe bleibt lokal und ohne externe Netzwerkpflicht

### WP-11 - Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Scaffold-Boilerplate so auslegen, dass Epic 04 und Epic 05 ohne Grundlagenbruch anschliessen koennen
- Scope:
  - Root-Lifecycle-Hooks
  - Template-/Rendering-Erweiterungspunkte
  - XTendRMT-Brueckenpunkte
  - Grenzen zwischen generiertem Code und Runtime-Orchestrierung
- Zielartefakte:
  - Extension-Point-Dokument
  - Boilerplate-Regeln fuer spaetere Grossfeatures
  - Folgepunkte fuer Epic 04 und Epic 05
  - siehe `development/WP-E03-11-Extension-Punkte-fuer-Templating-Rendering-und-Root-Lifecycle-vorbereiten.md`
  - siehe `development/XTend-Scaffold-Extension-Points.md`
  - siehe `xtend-builder/extensions/component-extension-points.js`
- Betroffene Dateien:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtend-builder/`
- Definition of Done:
  - Extension-Punkte sind dokumentiert
  - Scaffold erzeugt keine engen Annahmen gegen spaetere RMT-/Rendering-Integration
  - Folge-Epics koennen den Anschluss fachlich aufnehmen

### WP-12 - Epic-Abschlussreview und KPI-Abnahme

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic-03-Ergebnisse gegen KPI, Testpflicht, Core-Contract und Erweiterbarkeit final abnehmen
- Scope:
  - Review
  - KPI-Check
  - Restpunkte
  - Entscheidung ueber Uebergang zu Epic 04 oder Epic 05
- Zielartefakte:
  - Abschlussprotokoll
  - aktualisierte KPI-Bewertung
  - dokumentierte Rest- oder Folgepunkte
  - siehe `development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md`
- Betroffene Dateien:
  - `development/*.md`
  - `xtend-builder/`
  - Test-Harness-Dateien
  - relevante Doku- und Scaffold-Artefakte
- Definition of Done:
  - Scaffold-KPI-Ziele sind gemessen
  - Testpflicht wird von Scaffold-Artefakten eingehalten oder begruendet ausgenommen
  - naechster Umsetzungsschritt ist entscheidbar

## Epic-Start

Epic 03 ist abgeschlossen. `WP-01` ist abgeschlossen und legt `XTend-Scaffold` als leichtes, repo-lokales Node/CommonJS-Build-Environment mit klaren Generatorgrenzen fest. `WP-02` ist abgeschlossen und stellt Projektlayout, Modulgrenzen, `xtend-builder/scaffold.js`, `xtend-builder/lib/layout.js` und `npm run scaffold` bereit. `WP-03` ist abgeschlossen und stellt `xtend-builder/blueprints/component-blueprint.contract.js`, die Artefaktmatrix und den dokumentierten Ausnahmeprozess bereit. `WP-04` ist abgeschlossen und stellt Generator-Registry, Template-Ladepfad, Eingabevalidierung und `component-plan` bereit. `WP-05` ist abgeschlossen und stellt `component-files`, konkrete Pflichtartefakt-Templates und den Template-Loader bereit. `WP-06` ist abgeschlossen und stellt Manifest-Wiring, Hydration-Wiring und lokale Importregeln bereit. `WP-07` ist abgeschlossen und stellt profilbasierte State-, API- und Feature-Wiring-Patterns bereit. `WP-08` ist abgeschlossen und stellt lokale Dry-Run-, Verify- und Reporting-Workflows bereit. `WP-09` ist abgeschlossen und stellt Typing-Contract sowie vorbereitete Template-/XTendRMT-Anschluss-Metadaten bereit. `WP-10` ist abgeschlossen und stellt Preview-Referenzplaene plus Reference-Gate-Anbindung bereit. `WP-11` ist abgeschlossen und stellt Extension-Point-Contracts fuer Templating, Rendering und Root-Lifecycle bereit. `WP-12` ist abgeschlossen und nimmt den Epic gegen KPI, Testpflicht und Erweiterbarkeit final ab.
