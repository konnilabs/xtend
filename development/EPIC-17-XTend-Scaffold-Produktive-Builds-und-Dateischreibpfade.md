# XTend Epic 17 - XTend-Scaffold Produktive Builds und Dateischreibpfade

- Status: Implemented
- Datum: 16. Mai 2026
- Typ: Epic / 1.0-Release-Blocker und Implementierungsplan
- Contract: `xtend.scaffold.productive-builds.v1`
- Zielreife: `scaffold-builds-write-real-artifacts`
- Boundary: `dry-run-first-but-write-capable`
- Boundary: `no-silent-overwrite-of-user-owned-files`
- Boundary: `generated-artifacts-require-explicit-ownership`
- Primaerer Einstieg: `xtend-builder/scaffold.js`
- Bezug:
  - `development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/EPIC_E15_RMT_vNext_Syntax.md`
  - `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/WP-E10-13-RMT-first-Demo-App-ohne-manuelle-Shell-bauen.md`
  - `development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md`
  - `development/WP-E13-09-RMT-first-App-Production-Readiness-Gate-buendeln.md`
  - `xtend-builder/README.md`
  - `xtend-builder/scaffold.config.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/generators/rmt-lifecycle-demo.js`
  - `xtendrmt/rmt-lifecycle-demo.rmt`
  - `xtendrmt/rmt-lifecycle-demo.core.json`
  - `xtendrmt/rmt-lifecycle-demo.app.js`
  - `xtendrmt/rmt-lifecycle-demo.scaffold.json`
  - `components/x-rmt-lifecycle-demo.js`
  - `tests/browser/fixtures/rmt-lifecycle-demo-smoke.html`

## Ausgangslage

`XTend-Scaffold` ist historisch als `generator-only` und `dry-run-first` Build Environment entstanden. Diese Grenze war fuer Epic 03 richtig, weil sie Generatoren, Blueprints, Templates, Wiring, Typing, Preview, A11y und Performance-Vertraege stabilisieren konnte, ohne produktive Dateioperationen zu riskieren.

Vor dem 1.0 Release reicht dieser Zustand nicht mehr. Scaffold muss tatsaechlich Dateien schreiben, Builds reproduzierbar anlegen und daraus testbare XTend-Artefakte erzeugen koennen. Die neue RMT Lifecycle Demo beweist bereits einen vertikalen Pfad:

1. RMT wird als vNext Template authored.
2. Der RMT-Code wird in Core JSON kompiliert.
3. Scaffold erzeugt daraus XTend-Artefakte.
4. Die App ist ueber einen lokalen HTTP Server testbar.

Dieser Pfad ist aktuell aber noch demo-spezifisch. Das Epic hebt ihn auf die allgemeine Scaffold-Plattform.

## Problem

Scaffold kann heute Inhalte rendern, aber der generische `component-files` Pfad bleibt im Dry-Run. Produktive Writes existieren nur als Sonderpfad in der RMT Lifecycle Demo.

Dadurch bleiben vor 1.0 mehrere Risiken offen:

- neue XTend-Komponenten entstehen weiterhin teilweise manuell
- Build-Artefakte koennen nicht als reproduzierbarer Scaffold-Output eingefordert werden
- Manifest-, Registry- und Docs-Patches bleiben Patch-Plaene statt kontrollierter Dateioperationen
- es gibt kein einheitliches Ownership-Modell fuer generierte Dateien
- `--write` ist noch kein stabiler, allgemein nutzbarer CLI-Vertrag
- lokale Gates koennen noch nicht beweisen, dass ein Scaffold-Build sicher schreibt, idempotent bleibt und browsernah laeuft

## Zielbild

Nach Abschluss dieses Epics ist `XTend-Scaffold` ein produktiver, aber weiterhin kontrollierter Buildpfad.

Das Zielbild umfasst:

- Scaffold erzeugt reale Dateien aus Generator-Outputs.
- Dry-Run und Write teilen denselben `WritePlan`.
- Dateioperationen sind idempotent und reportbar.
- User-owned Dateien werden nicht still ueberschrieben.
- generierte Dateien besitzen klare Ownership- und Herkunftsinformationen.
- Manifeste und Registries werden strukturiert und deterministisch gepatcht.
- RMT vNext Templates koennen ueber Scaffold in testbare XTend Apps uebersetzt werden.
- lokale Gates pruefen den kompletten Pfad von Authoring ueber Build bis Browser-Smoke.

## In Scope

- zentraler Scaffold Writer und `WritePlan` Contract
- `--dry-run`, `--write`, `--check`, `--force` und JSON Reports fuer produktive Buildbefehle
- Ownership-, Hash- und Konfliktmodell fuer generierte Artefakte
- produktiver Schreibpfad fuer `component-files` oder einen dedizierten `component-build`
- strukturierte Manifest- und Registry-Patcher
- Generalisierung des RMT Lifecycle Demo Buildpfads
- lokale Tests in Temp-Workspaces fuer Idempotenz, Konflikte, Manifest-Merge und Browser-Smoke
- Dokumentation und Config-Update von `generator-only` zu `dry-run-first-but-write-capable`

## Out of Scope

- Remote Publish, Package Release oder Registry Uploads
- neue Runtime-Abhaengigkeiten fuer den Scaffold Core
- automatische Migration aller bestehenden Komponenten
- freie Code-Ausfuehrung aus RMT Templates
- ein host-spezifischer Sonderpfad im RMT Kernel
- unkontrolliertes Ueberschreiben manuell gepflegter Dateien

## Architekturprinzipien

- Dry-Run bleibt der erste Schritt. Jeder Write muss als Plan inspizierbar sein.
- Write ist eine Ausfuehrung eines stabilen Plans, keine zweite Generatorlogik.
- Generated Ownership ist explizit. Scaffold schreibt nur eigene Artefakte oder neue Dateien.
- Konflikte sind harte Diagnosen, keine stillen Merges.
- Strukturierte Dateien werden strukturiert veraendert. JSON wird gemerged, nicht ueber Stringoperationen verbogen.
- Der Buildpfad bleibt lokal, reproduzierbar und netzwerkfrei.
- RMT kompiliert in Core. XTend Apps konsumieren Build-Artefakte, nicht rohen DSL-Text als Runtime-Magie.

## Paket 1 - WritePlan und zentraler Scaffold Writer

- Package ID: `WP-E17-01`
- Contract: `xtend.scaffold.write-plan.v1`
- Status: `implemented`
- Workpackage: `development/WP-E17-01-WritePlan-und-zentraler-Scaffold-Writer.md`
- Ziel: Ein gemeinsamer, wiederverwendbarer Writer ersetzt demo-lokale `fs.writeFileSync`-Logik.

### Scope

- `WritePlan` Schema fuer `create`, `update`, `skip`, `conflict`, `patch` und `report`
- Pfadnormalisierung gegen Repo-Root und erlaubte Output-Roots
- Verzeichnisanlage fuer neue Artefakte
- Checksum-/Hash-Berechnung fuer geplante Inhalte
- idempotente Writes mit `changed: true|false`
- maschinenlesbarer JSON Report fuer Dry-Run und Write
- klare Exit-Codes fuer Planfehler, Konflikte und erfolgreiche Writes

### Akzeptanzkriterien

- Dry-Run und Write erzeugen denselben Plan mit stabilen Checksums.
- Wiederholter Write ohne Inhaltsaenderung meldet `changed: false`.
- Pfade ausserhalb erlaubter Roots werden verweigert.
- Schreibfehler erzeugen strukturierte Diagnosen.
- Der RMT Lifecycle Demo Writer nutzt den zentralen Writer oder ist auf ihn migrierbar.

## Paket 2 - Ownership, Konfliktmodell und component-build

- Package ID: `WP-E17-02`
- Contract: `xtend.scaffold.generated-ownership.v1`
- Status: `implemented`
- Workpackage: `development/WP-E17-02-Ownership-Konfliktmodell-und-component-files-write.md`
- Ziel: Scaffold kann generierte Komponentenartefakte produktiv schreiben, ohne User-Arbeit zu gefaehrden.

### Scope

- Generated Header oder Sidecar-Metadaten fuer Scaffold-Artefakte
- Source-, Template- und Build-Hash pro Datei
- Konfliktregel fuer bestehende nicht-generierte Dateien
- `--force` nur mit expliziter Diagnose und Report-Eintrag
- produktiver `component-files --write` Pfad oder dedizierter `component-build`
- `--check` Modus fuer CI: prueft, ob Output aktuell waere, ohne zu schreiben
- Tests fuer `create`, `update-owned`, `skip-unchanged`, `refuse-user-owned` und `force-owned`

### Akzeptanzkriterien

- `node xtend-builder/scaffold.js component-files --tag x-demo --profile display --write --json` kann eine vollstaendige Artefaktmenge schreiben.
- Nicht-generierte bestehende Dateien werden ohne `--force` verweigert.
- Generierte Dateien koennen idempotent aktualisiert werden.
- Der JSON Report benennt jede Datei, Aktion, Ownership, Hash und Konfliktentscheidung.
- Der Befehl bleibt ohne neue Runtime-Abhaengigkeiten lauffaehig.

## Paket 3 - Manifest-, Registry- und Build-Report-Patcher

- Package ID: `WP-E17-03`
- Contract: `xtend.scaffold.patchers.v1`
- Status: `implemented`
- Workpackage: `development/WP-E17-03-Manifest-Registry-und-Build-Report-Patcher.md`
- Ziel: Scaffold schreibt nicht nur Dateien, sondern verdrahtet sie kontrolliert in Manifesten, Registries, Docs und Testpfaden.

### Scope

- deterministischer JSON Merge fuer `components/manifest.json`
- Registry-Patcher fuer Scaffold-Generatoren, Docs-Menue oder Test-Runner nur dort, wo fachlich noetig
- Sortier- und Formatierungsregeln fuer strukturierte Outputs
- PatchPlan-Unterstuetzung im Dry-Run
- Patch-Anwendung im Write-Modus
- Build-Report als dauerhaftes Artefakt fuer Inputs, Outputs, Hashes, Gates und Kommandos
- Validierung gegen lokale Import- und Manifest-Policies

### Akzeptanzkriterien

- Manifest-Eintraege werden deterministisch eingefuegt oder aktualisiert.
- Bestehende fremde Manifest-Eintraege bleiben erhalten.
- Doppelte Eintraege werden verhindert oder als Diagnose gemeldet.
- Patch-Dry-Run und Patch-Write berichten dieselben Entscheidungen.
- Build-Reports koennen von lokalen Tests gelesen und gegen Drift geprueft werden.

## Paket 4 - RMT vNext App Build Pipeline und 1.0 Gate

- Package ID: `WP-E17-04`
- Contract: `xtend.scaffold.rmt-app-build.v1`
- Status: `implemented`
- Workpackage: `development/WP-E17-04-RMT-vNext-App-Build-Pipeline-und-1-0-Gate.md`
- Ziel: Der RMT Lifecycle Demo Pfad wird zu einer allgemeinen, gatebaren Build Pipeline fuer RMT vNext Templates und XTend Apps.

### Scope

- Generalisierung von `rmt-lifecycle-demo --write` in einen wiederverwendbaren RMT Buildpfad
- Input: `.rmt` vNext Template
- Output: Core JSON, XTend Custom Element oder App-Modul, Host-Datei, Browser-Smoke-Fixture und Scaffold Report
- HTTP-Server-kompatible Host-Artefakte
- lokale Gates fuer RMT Compiler, Scaffold Write, Manifest/Registry, Browser-Smoke und Referenzen
- Package Script fuer das 1.0 Release Gate
- Dokumentation des kompletten Authoring-to-App Lifecycle

### Akzeptanzkriterien

- Ein RMT vNext Template kann ueber Scaffold in eine testbare XTend App gebaut werden.
- Der Build schreibt alle erwarteten Artefakte ueber den zentralen Writer.
- Die erzeugte App ist ueber den lokalen HTTP Server oeffenbar.
- Ein Browser-Smoke prueft, dass Component, App und Scaffold Report zusammenpassen.
- `node scripts/run_xtend_tests.js scaffold-write --json` oder ein aequivalentes Gate prueft den kompletten Pfad.

## Release-Gate fuer Epic 17

Das Epic ist fuer 1.0 abgeschlossen, wenn folgende Befehle oder ihre final benannten Nachfolger stabil laufen:

```bash
node xtend-builder/scaffold.js component-files --tag x-demo --profile display --write --json
node xtend-builder/scaffold.js component-files --tag x-demo --profile display --check --json
node xtend-builder/scaffold.js rmt-build --source xtendrmt/rmt-lifecycle-demo.rmt --write --json
node scripts/run_xtend_tests.js scaffold-rmt-build --json
node scripts/run_xtend_tests.js rmt-lifecycle-demo --json
node scripts/run_xtend_tests.js browser --json
```

## Definition of Done

- `XTend-Scaffold` ist nicht mehr nur `generator-only`, sondern `dry-run-first-but-write-capable`.
- Produktive Writes laufen ueber einen zentralen Writer.
- Jeder Write ist vorher und nachher reportbar.
- Ownership schuetzt manuelle Dateien vor stiller Ueberschreibung.
- Manifest- und Registry-Aenderungen sind strukturiert, deterministisch und getestet.
- RMT vNext kann ueber Scaffold in eine reale, browsernah testbare XTend App gebaut werden.
- Docs, Config und lokale Gates beschreiben den neuen 1.0 Buildpfad.

## Offene Entscheidungen

- Soll der generische Schreibbefehl `component-files --write` bleiben oder als `component-build` sichtbarer werden?
- Wird der TypeScript-First-Pfad in 1.0 produktiv kompiliert oder bleibt er als Source-Strategie vorbereitet?
- Wo liegt das dauerhafte Build-Manifest: neben dem Artefakt, unter `.xtend-build/` oder als Scaffold Report im jeweiligen Feature-Ordner?
- Welche Registry-Patcher gehoeren zwingend in 1.0 und welche bleiben bewusste Folgearbeit?
