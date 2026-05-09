# XTend Epic 03 - XTend-Scaffold Build-Environment und Developer-Workflow

- Status: Completed
- Datum: 24. Maerz 2026
- Typ: Epic / Planungsdokument
- Bezugsdokumente:
  - `docs/XTend-ADR.md`
  - `compliance/update-instructions.md`
  - `compliance/xtend-design-guidelines.md`
  - `development/EPIC-01-XTend-Core-Standardisierung-und-Konsolidierung.md`
  - `development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md`
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md`
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
  - `development/XTend-Core-Compliance-Checklist.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `xtend-builder/scaffold.config.js`
  - `docs/core-migration-guide.md`

## Ausgangslage

Nach der Core-Konsolidierung und dem geplanten Testaufbau braucht XTend eine produktive Entwicklungsumgebung, die neue Komponenten und Features standardisiert, beschleunigt und gegen den bestehenden Core-Contract absichert.

Der Epic reagiert auf folgende Lage:

- Komponenten werden derzeit weitgehend manuell angelegt und verdrahtet
- Manifest-, Hydrations-, API-, Doku-, Typ- und Testintegration sind noch nicht als ein zusammenhaengender Workflow modelliert
- kuenftige Erweiterungen in Richtung Templating, Rendering und Typisierung brauchen heute schon belastbare Boilerplate- und Extension-Punkte
- XTend soll fuer menschliche Entwickler und AI-Agenten gleichermassen leicht verstehbar und produktiv nutzbar sein

## Wichtige Randbedingung

Das Build Environment traegt den Projektnamen `XTend-Scaffold`. Es soll nicht nur Dateien generieren, sondern den kuenftigen Standardpfad abbilden, wie XTend-Komponenten gebaut, hydriert, mit Features verdrahtet und an APIs angeschlossen werden.

Daraus folgt:

- `XTend-Scaffold` muss auf dem konsolidierten Core-Vertrag aufbauen
- Test-, Doku- und Typ-Artefakte sind kein Optional-Add-on, sondern Teil des Scaffold-Standards
- die Testpflicht aus `development/XTend-Testpflicht-und-Scaffold-Anschluss.md` ist verbindlicher Input fuer Generatoren, Blueprints und Review-Regeln
- die erzeugte Boilerplate muss bewusst so dimensioniert werden, dass spaetere Templating-, Rendering- und Typisierungsfeatures ohne grundlegenden Neubau integrierbar bleiben

## Zielbild

Nach Abschluss des Epics besitzt XTend mit `XTend-Scaffold` eine standardisierte Build- und Entwicklungsumgebung, die neue Komponenten und spaetere Feature-Bausteine schnell, konsistent und erweiterbar erzeugen kann.

Das Zielbild umfasst:

- ein standardisiertes Scaffold fuer XTend-Komponenten und XTend-nahe Module
- Generatoren fuer Komponente, Doku, Typdefinition, Tests, Demo und Manifest-Anbindung
- definierte Hydrations- und Feature-Wiring-Pfade fuer Core-Integration
- Extension-Punkte fuer spaetere Templating-, Rendering- und Typisierungsfunktionen
- einen Workflow, der AI-Agenten und Menschen denselben klaren Einstieg bietet

## In Scope

- Projektstruktur und Architektur von `XTend-Scaffold`
- Generatoren und Blueprints fuer XTend-Komponenten
- Manifest-, Hydrations-, API- und Feature-Wiring-Konventionen
- Standard-Artefakte fuer Doku, Tests, Typisierung und Demo/Preview
- lokale Developer-Workflows fuer Scaffolding, Entwicklung und Verifikation
- Vorbereitung der Boilerplate auf spaetere Templating- und Rendering-Erweiterungen

## Out of Scope

- die vollstaendige Umsetzung von Templating oder Rendering-Runtimes
- die eigentliche XTendRMT-Integration, die in Epic 04 fachlich vorbereitet und in Epic 05 als Bridge konkretisiert wird
- ein vollstaendiger Produktiv-Release- oder Publishing-Prozess ausserhalb des direkten Scaffold-Bedarfs
- unkontrollierte Generator-Magie, die XTend weniger statt mehr verstehbar macht

## Problemfelder, die dieser Epic loesen muss

- XTend hat noch keinen standardisierten Builder- oder Scaffold-Pfad.
- Neue Komponenten muessen derzeit zu viel Boilerplate, Verdrahtung und Konvention manuell nachbauen.
- Hydrations-, API- und Feature-Anbindung sind fuer neue Komponenten nicht als Standard-Workflow verpackt.
- Templating-, Typisierungs- und spaetere Rendering-Beduerfnisse brauchen vorbereitete Integrationspunkte, bevor sie produktiv eingebaut werden.
- Ohne Build- und Scaffold-Standards droht neue Inkonsistenz und Technical Debt trotz konsolidiertem Core.

## Arbeitsstroeme

### WS1 - Scaffold-Architektur und Projektlayout

Ziel: `XTend-Scaffold` als eigenstaendige, XTend-kompatible Entwicklungsumgebung konzipieren.

Erwartete Ergebnisse:

- definiertes Projektlayout fuer Generatoren, Templates, Blueprints und Dev-Workflows
- klare Schnittstellen zum XTend-Core, zur Test-Suite und zur Dokumentation
- nachvollziehbarer Einstiegspfad fuer Entwickler und AI-Agenten

### WS2 - Komponenten-Generatoren und Blueprints

Ziel: Die Erstellung neuer XTend-Komponenten massiv vereinfachen.

Erwartete Ergebnisse:

- Standard-Generatoren fuer Web Components und XTend-nahe Module
- Blueprints fuer Shadow DOM, Events, Slots, State, Accessibility und Theming
- automatische Anlage von Doku-, Test-, Demo- und Typ-Artefakten

### WS3 - Hydration, Feature-Wiring und API-Anbindung

Ziel: Komponenten nicht nur erzeugen, sondern auch systemkonform in XTend einbinden.

Erwartete Ergebnisse:

- Scaffold-Standards fuer Manifest-Eintraege und Hydrationspfade
- vorbereitete Patterns fuer `xstate`, XTend-API und Feature-Verdrahtung
- klare Erweiterungspunkte fuer Overlay-, Router-, Theme- und API-nahe Integrationen

### WS4 - Typisierung, Dokumentation und Verifikation

Ziel: Scaffold-Artefakte direkt release- und review-faehig machen.

Erwartete Ergebnisse:

- TypeScript-/`.d.ts`-Stubs als Standard
- Markdown-Doku und Beispielseiten als Standard-Artefakte
- vorbereitete Test-Artefakte, die auf Epic 02 aufsetzen

### WS5 - Zukunftsfaehige Boilerplate und Erweiterbarkeit

Ziel: Die Scaffold-Basis so auslegen, dass spaetere XTend-Grossfeatures integrierbar bleiben.

Erwartete Ergebnisse:

- dokumentierte Extension-Punkte fuer Templating und Rendering
- Architekturgrenzen, die kuenftige Feature-Bloecke ohne Boilerplate-Bruch tragen
- vorbereitete Hooks fuer Root-Lifecycle, Feature-Delegation und Typisierungsaufbau

## Initiale Arbeitspakete

- `E03-001`: Architektur und Scope von `XTend-Scaffold` schriftlich festlegen.
- `E03-002`: Projektlayout fuer Generatoren, Templates, Blueprints und Dev-Workflows definieren.
- `E03-003`: Standard-Blueprint fuer neue XTend-Komponenten entwerfen.
- `E03-004`: Generatoren fuer Komponente, Doku, Test, Demo und Typdefinition anlegen.
- `E03-005`: Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren.
- `E03-006`: API- und Feature-Wiring-Pfade fuer haeufige XTend-Nutzungsfaelle vorbereiten.
- `E03-007`: Typisierungsstrategie fuer scaffolded Komponenten und spaetere Template-Pfade dokumentieren.
- `E03-008`: Developer-Entry-Points fuer lokale Entwicklung und Verifikation standardisieren.
- `E03-009`: Extension-Punkte fuer kuenftige Rendering-/Templating-Bausteine vorbereiten.
- `E03-010`: Abschlussreview gegen Core-Contract, Testpflicht und kuenftige Erweiterbarkeit durchfuehren.

## Abhaengigkeiten

- abgeschlossener Epic 01 als stabiler Core-Vertrag
- moeglichst weit vorbereiteter oder abgeschlossener Epic 02, damit Scaffold-Artefakte direkt testbar angelegt werden koennen
- Entscheidung, auf welchem Minimal-Tooling `XTend-Scaffold` lokal aufsetzt
- Klarheit, welche Standard-Komponenten und Modularten zuerst als Blueprint dienen

## Risiken

- Ein zu kleiner Scaffold-Ansatz erzeugt erneut manuelle Boilerplate und verschiebt Technical Debt nur.
- Ein zu abstrakter Generator-Ansatz macht XTend schwerer statt leichter verstaendlich.
- Vorweggenommene Entscheidungen fuer Templating/Rendering koennten den spaeteren Architektur-Discours unnoetig verengen.
- Wenn Tests, Doku und Typisierung nicht von Anfang an Teil des Scaffolds sind, entstehen sofort neue Luecken.

## Akzeptanzkriterien

- `XTend-Scaffold` ist als offizielles Build Environment fuer XTend dokumentiert.
- Neue XTend-Komponenten koennen ueber einen standardisierten Workflow erzeugt und an den Core angebunden werden.
- Scaffold-Artefakte enthalten standardisiert Doku-, Test-, Demo- und Typ-Pfade.
- Scaffold-Artefakte erfuellen die Epic-02-Testpflicht oder dokumentieren begruendete Ausnahmen.
- Hydration, Feature-Wiring und API-Anbindung folgen einem definierten Contract.
- Die Boilerplate ist dokumentiert so vorbereitet, dass spaetere Templating- und Rendering-Features ohne Grundlagenbruch integrierbar sind.
- Der Workflow ist fuer menschliche Entwickler und AI-Agenten gleichermassen nachvollziehbar.

## KPI-Baseline

- `0` standardisierte Build-/Scaffold-Umgebungen fuer XTend
- `0` offizielle Generatoren fuer neue XTend-Komponenten
- `0` standardisierte Boilerplate fuer Typisierung, Tests und Doku in einem gemeinsamen Workflow
- mehrere manuelle Schritte fuer Manifest-, Feature- und API-Wiring
- keine explizite Scaffold-Vorbereitung fuer spaetere Templating-/Rendering-Erweiterungen

## KPI-Ziele

- `1` offizielles Build Environment unter dem Projektnamen `XTend-Scaffold`
- `100%` der ueber das Scaffold erzeugten Komponenten besitzen Doku-, Test-, Demo- und Typ-Artefakte
- `100%` der Scaffold-Generierung folgt dem konsolidierten XTend-Core-Contract
- dokumentierte Extension-Punkte fuer spaetere Templating-, Rendering- und Typisierungsfunktionen
- deutliche Reduktion manueller Schritte beim Anlegen und Verdrahten neuer XTend-Komponenten

## Vorschlag fuer die Umsetzungsreihenfolge

1. Architektur und Projektlayout fuer `XTend-Scaffold`
2. Komponenten-Blueprints und Generator-Grundgeruest
3. Manifest-, Hydrations- und API-/Feature-Wiring
4. Doku-, Test- und Typ-Artefakte als Standard
5. Extension-Punkte fuer spaetere Grossfeatures
6. Abschlussreview gegen Testbarkeit, Core-Contract und Erweiterbarkeit

## Definition of Done

Der Epic ist abgeschlossen, wenn `XTend-Scaffold` als standardisierte Build- und Entwicklungsumgebung neue XTend-Komponenten konsistent erzeugen, verdrahten, dokumentieren, typisieren und auf die kuenftige Erweiterung des Frameworks vorbereiten kann, ohne neue Boilerplate- oder Contract-Schulden zu erzeugen.

## Implementierungsstart Mai 2026

Epic 03 wurde nach Abschluss von Epic 02 operativ vorbereitet. Als erster Umsetzungsschritt wurde der Epic in konkrete Workpackages zerlegt und das Backlog unter `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md` angelegt.

Aktueller Startpunkt:

- `WP-01`: Scaffold-Architektur, Scope und Tooling-Entscheidung festlegen ist `completed`.
- `WP-02`: Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren ist `completed`.
- `WP-03`: Komponenten-Blueprint und Artefaktcontract entwerfen ist `completed`.
- `WP-04`: Generator-Grundgeruest und Template-Ladepfad anlegen ist `completed`.
- `WP-05`: Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen ist `completed`.
- `WP-06`: Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren ist `completed`.
- `WP-07`: State-, API- und Feature-Wiring-Patterns vorbereiten ist `completed`.
- `WP-08`: Lokale Developer-Workflows und Verifikation standardisieren ist `completed`.
- `WP-09`: Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten ist `completed`.
- `WP-10`: Demo-/Preview- und Referenzpfade an die Test-Suite anbinden ist `completed`.
- `WP-11`: Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten ist `completed`.
- `WP-12`: Epic-Abschlussreview und KPI-Abnahme ist `completed`.
- Epic 03 ist abgeschlossen.
- `xtend-builder/scaffold.config.js` ist der aktuelle technische Anker fuer Pflichtartefakte, Profile, Testpflicht und lokale Runner-Pfade.
- `development/XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md` legt `XTend-Scaffold` als repo-lokales Node/CommonJS-Build-Environment mit Dry-Run-first-Strategie und klaren Generatorgrenzen fest.
- `xtend-builder/scaffold.js`, `xtend-builder/lib/cli.js` und `xtend-builder/lib/layout.js` bilden den lokalen Scaffold-Entry-Point und den maschinenlesbaren Layout-Contract.
- `xtend-builder/blueprints/component-blueprint.contract.js` definiert den verbindlichen Component-Blueprint mit Artefaktmatrix, Profilmapping und dokumentiertem Ausnahmeprozess.
- `xtend-builder/generators/registry.js`, `xtend-builder/generators/component-plan.js` und `xtend-builder/templates/registry.js` stellen Generator-Registry, Template-Ladepfad und plan-only Component-Plan bereit.
- `xtend-builder/generators/component-files.js`, `xtend-builder/templates/loader.js` und die Templates unter `xtend-builder/templates/component/` rendern alle Pflichtartefakte als Dry-Run-Dateiinhalte.
- `xtend-builder/wiring/manifest.js` und `xtend-builder/wiring/hydration.js` stellen Manifest-Patchplan, lokale Importregel und Hydration-Mindestcontract fuer Dry-Run-Ausgaben bereit.
- `xtend-builder/wiring/features.js` stellt profilbasierte State-, Event- und API-Wiring-Patterns nach Core-Contract bereit.
- `xtend-builder/typing/component-types.js` stellt Typ-Artefakt-Contracts und vorbereitete XTendRMT-Adapter-Anschluss-Metadaten bereit.
- `xtend-builder/preview/component-preview.js` stellt lokale Preview-Referenzplaene und Reference-Gate-Metadaten bereit.
- `xtend-builder/extensions/component-extension-points.js` stellt Templating-, Rendering- und Root-Lifecycle-Extension-Punkte als Dry-Run-Contract bereit.
- `xtend-builder/workflows/developer-workflow.js` stellt lokale Dry-Run-, Verify- und Reporting-Workflows bereit.
- Die Epic-02-Suite bleibt der verbindliche Verifikationsrahmen fuer alle erzeugten Scaffold-Artefakte.

## Abschluss Mai 2026

Epic 03 wurde mit `development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md` final abgenommen.

Abnahmeergebnis:

- `XTend-Scaffold` ist als offizielles repo-lokales Build Environment fuer XTend dokumentiert.
- Component-Blueprint, Generator-Registry, Template-Ladepfad, Wiring-, Typing-, Preview-, Extension- und Workflow-Contracts sind lokal startbar.
- `component-files` rendert alle Pflichtartefakte plus Demo-/Preview-Plan im Dry-Run.
- Die Epic-02-Testpflicht ist ueber Scaffold-Config, Templates, Reference-Gate und Workflow sichtbar.
- Templating-, Rendering-, Root-Lifecycle- und XTendRMT-Anschluss sind vorbereitet, ohne Runtime- oder Bridge-Entscheidungen vorzuziehen.
- Der finale lokale Abnahmepfad `npm test` ist erfolgreich.

Epic 04 kann nun die vorbereiteten Extension-Punkte fachlich in die Templating-/Rendering-Architektur ueberfuehren. Epic 05 kann darauf aufbauend die produktive XTendRMT Bridge und natives RMT Routing ausarbeiten.
