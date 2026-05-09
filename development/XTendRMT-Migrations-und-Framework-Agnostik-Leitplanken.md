# XTendRMT Migrations- und Framework-Agnostik-Leitplanken

- Status: Verbindlich fuer Epic 04 ab `WP-E04-10`
- Bezug:
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md`
  - `development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md`
  - `development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `development/XTend-Core-Compliance-Checklist.md`
  - `docs/core-migration-guide.md`
  - `tests/references/reference_path_suite.js`

## Zweck

Diese Leitplanken sichern die Einfuehrung von RMT-Templating ab, ohne bestehende XTend-, React-, Vue-, Vanilla-JS- oder Custom-Host-Anwendungen zu brechen. RMT wird als Opt-in Scheduler und Templating Engine eingefuehrt. XTend UI wird First-Class Host, aber nicht Pflicht-Host.

## Migrationsentscheidung

RMT-Templating ist additiv.

- Bestehende XTend-Komponenten und bestehende HTML-/JS-Integrationen bleiben gueltig.
- RMT wird pro Root, Dokument oder Host Adapter bewusst aktiviert.
- XTendRMT darf keine globalen Runtime-Pfade kapern.
- Legacy-Demos bleiben klassifiziert und werden nicht automatisch zu RMT-only Flows.
- Produktive Bridge-, XRouter- und native Route-Ausfuehrung bleibt Epic 05.

## Opt-in-Modell

| Ebene | Opt-in-Signal | Default ohne Opt-in |
|-------|---------------|---------------------|
| App | `.rmt` Dokument oder Host-Adapter-Registrierung | bestehende App laeuft unveraendert |
| Root | Root-Handshake `xtend.rmt.root-handshake.v1` | DOM bleibt Host-owned |
| Template | Template Authoring `xtend.rmt.template-authoring.v1` | XTend rendert weiter direkt |
| Component | Component Adapter `xtend.component` | Custom Element bleibt normale Web Component |
| Scheduler | Endpoint-Hint oder Schedule-Ref | keine RMT-Scheduler-Arbeit |
| Router | `xtend.xrouter` Adapter-Record | XRouter laeuft wie bisher |

## Parallelbetrieb

RMT darf in grossen Web Apps neben mehreren Hosts laufen. Jeder Host muss seine Grenzen explizit deklarieren.

| Host | Erlaubter RMT-Nutzen | Schutzregel |
|------|----------------------|-------------|
| XTend UI | Web Components, XRouter, xstate, Theme, API | XTend nur ueber `xtend.*` Adapterdaten referenzieren |
| React | Scheduler, Template-Transport, optionale Adapter-Records | keine Annahme von Custom Elements oder `xstate` |
| Vue | Scheduler und Hydration-Hints | keine XRouter-Pflicht |
| Vanilla JS | direkte Scheduler-Endpoints | kein XTend Manifest voraussetzen |
| Custom Host | eigene Capabilities | nur deklarierte Capabilities nutzen |

Der RMT Kernel darf keine Host-spezifischen Imports, Global Helpers oder State-Keys erzwingen.

## Anti-Technical-Debt-Regeln

- Keine XTend-Sonderlogik im RMT Kernel.
- Keine zweite XTend-Template-Sprache neben RMT.
- Keine produktive Bridge in Scaffold-Dry-Runs.
- Keine Route-Registrierung ausserhalb eines expliziten Host Adapters.
- Keine globalen unnamespaced APIs fuer neue Beispiele.
- Keine Migration bestehender Apps ohne Opt-in.
- Keine Vermischung von DSL-Domain, Adapter-Ausfuehrung und Demo-Sonderlogik.

## Review-Checkliste

Ein RMT-kompatibler XTend-Change ist reviewbar, wenn alle Punkte erfuellt sind:

- RMT-Daten sind serialisierbare Records, keine Runtime-Imports.
- `kernelVisible: false` bleibt fuer XTend-spezifische Adapterdaten gesetzt.
- Host-Capabilities sind vor Ausfuehrung deklarierbar.
- Existing XTend usage bleibt stabil.
- React-, Vue-, Vanilla- und Custom-Hosts werden nicht ausgeschlossen.
- Scheduler-Endpoints sind explizit benannt.
- XRouter bleibt Adapter-Aufgabe.
- `bridgeRuntime` bleibt `reserved-for-Epic-05`, solange keine produktive Bridge existiert.
- `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` bleiben gruene Mindestgates.

## Migrationspfade

| Ausgangslage | Empfohlener Pfad |
|--------------|------------------|
| Bestehende XTend-only App | weiter direkt betreiben, RMT nur fuer neue Roots oder Templates opt-in testen |
| XTend App mit XRouter | Route-Records als RMT-Daten vorbereiten, produktive Adapterarbeit nach Epic 05 verschieben |
| Gemischte React/Vue/XTend App | RMT zuerst als Scheduler nutzen, Host Adapter getrennt halten |
| Vanilla oder Custom App | eigene Scheduler-Endpoints deklarieren, XTend-Capabilities nicht voraussetzen |
| Legacy-Demo | als Referenz klassifizieren, nicht stillschweigend zum Contract machen |

## Handoff an WP-11

`WP-E04-11` kann die upstream-Handoff-Spezifikation auf diesen Leitplanken aufbauen. Offene upstream-Arbeit ist dadurch fachlich begrenzt:

- DSL-Ergonomie verbessern
- native Domains fuer Components, Routes und Adapters stabilisieren
- produktive XTend Host Adapter implementieren
- XRouter Adapter produktiv machen
- Multi-Host-Smokes fuer Parallelbetrieb ergaenzen

Die Migrationsfrage ist fuer Epic 04 damit beantwortet: RMT-Templating ist additiv, opt-in und host-neutral.
