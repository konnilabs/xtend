# XTend Component Platform

Contract: `xtend.docs.component-platform.v1`

Diese Seite beschreibt den aktuellen Epic-10-Stand fuer neue XTend-Komponenten. Neue Komponenten werden TypeScript-first geplant, lokal als ESM-Artefakte ausgeliefert und als RMT-first Authoring-Ziele vorbereitet. RMT bleibt dabei Framework-agnostisch: XTend-Komponenten sind `xtend.component` Records, aber der RMT-Kernel importiert keine XTend-Klassen oder Typen.

Seit `WP-E10-16` ist Epic 10 abgeschlossen. Der Release-Handoff liegt in [Epic 10 Release Handoff](./epic10-release-handoff.md), und vollstaendige App-Authoring-Regeln liegen in [RMT-first XTend Apps](./rmt-first-xtend-apps.md). Seit `WP-E11-17` sind die sichtbaren UX-Regeln in [Component UX Authoring](./component-ux-authoring.md), [Component UX App Authoring](./component-ux-app-authoring.md), [Component UX Gates](./component-ux-gates.md) und [Component Long-Tail Migration](./component-long-tail-migration.md) zusammengefuehrt.

## Plattform-Schichten

- TypeScript Source liegt unter `src/components/<tag>/`
- Runtime-Artefakte bleiben lokale ESM-Dateien unter `components/`
- Public Types bleiben `.d.ts` Artefakte unter `components/`
- RMT Metadata liegt als eigenes `ts-rmt` Artefakt vor
- Fabric, Telemetry, Lanes, A11y und Performance sind Pflichtdomains im `xtend.component.contract.v2`
- der Builder erzeugt Contract-, Source-, RMT-, A11y-, Performance- und Fixture-Artefakte als Dry-Run

## P0-Komponentenwelle

WP-E10-08 legt die erste P0-Komponentenwelle als `xtend.epic10.p0-component-wave.v1` fest.

| Komponente | Paket | Schwerpunkt |
|------------|-------|-------------|
| `x-select` | `WP-E10-09` | Select Control, Option Slots, Value Events |
| `x-checkbox` | `WP-E10-09` | Binary Input, checked/indeterminate State |
| `x-radio` | `WP-E10-09` | Radio Group Coordination und Keyboard Navigation |
| `x-textarea` | `WP-E10-10` | Long-Form Input, Validation, Counter |
| `x-status` | `WP-E10-10` | Live Region, Validation Feedback, Scheduler Status |
| `x-progress` | `WP-E10-10` | Async Progress, Hydration/Task Feedback |
| `x-tooltip` | `WP-E10-11` | leichte Overlay-Hilfe und describedby Mapping |
| `x-popover` | `WP-E10-11` | interaktives, verankertes Overlay |
| `x-drawer` | `WP-E10-11` | App-Shell Navigation und Side Panels |

`x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-status`, `x-progress`, `x-tooltip`, `x-popover` und `x-drawer` sind seit `WP-E10-11` als TypeScript-first Referenzlinie umgesetzt und bilden die erste P0-Welle mit `enterprise-ready` Catalog-Status.

## Component Lab und RMT Inspector

`WP-E10-12` legt das Component Lab als Shell-first RMT-Pilot an. Das Lab nutzt `tests/fixtures/rmt-component-lab-pilot.rmt` und das Plan-Modul `xtend-builder/preview/component-lab.js`, um alle neun `enterprise-ready` Komponenten lokal inspizierbar zu machen.

Die Pilot-Oberflaeche besteht aus:

- Component Preview fuer Fixture, Docs, Types und Contract-Pfade
- RMT Inspector fuer `manifest`, `adapters`, `components`, `routes`, `schedules`, `templates` und `diagnostics`
- Telemetry Panel fuer `snapshot.componentTelemetry`
- A11y- und Performance-Hinweisen aus Component Contract v2
- Source Links auf Runtime, TS Source, RMT Metadata, Fixture, Docs und Suite

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

## RMT-first Demo-App

`WP-E10-13` liefert mit `xtendrmt-rmt-first-demo.html` und `xtendrmt/rmt-first-demo-app.rmt` die erste produktive RMT-first Demo-App ohne manuelle Shell. Die Hostseite stellt nur einen `data-rmt-host="rmt-first-demo"` Root, den lokalen XTend Loader, das lokale Manifest und die RMT Runtime bereit.

Die App Shell, Navigation, Routen, Seiten-Templates, Component Records, Schedules, Fabric Lanes und Diagnostics werden aus dem RMT-Dokument gerendert. Die Demo nutzt die komplette Epic-10 P0-Welle: `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-status`, `x-progress`, `x-tooltip`, `x-popover` und `x-drawer`.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

## Existing Component Metadata

`WP-E10-14` zieht bestehende priorisierte Komponenten als `js-legacy` Contract Overlay in die RMT/Fabric-Linie. Der maschinenlesbare Katalog liegt in `catalog/epic10-existing-component-metadata.js` und nutzt die Migration Strategy `js-legacy-contract-overlay-no-runtime-rewrite`.

Die Zielkomponenten sind `x-router`, `x-link`, `x-input`, `x-form`, `x-modal`, `x-dialog`, `x-tabs`, `x-toast` und `x-alert`. Jede Komponente erhaelt Contract-v2-, RMT-, Fabric-, Telemetry-, Lane-, A11y- und Performance-Metadata, ohne dass die Runtime in diesem Paket umgebaut werden muss.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

## Epic 10 Platform Gates

`WP-E10-15` buendelt die Plattformregeln als `xtend.epic10.platform-gates.v1`. Der maschinenlesbare Plan liegt in `catalog/epic10-platform-gates.js` und verbindet Component Contract v2, Existing Component Metadata, RMT-first Demo-App, Browser-Smokes, A11y, Performance und Visual Regression.

Der Fast-PR-Pfad enthaelt `component-contract-v2`, `epic10-p0-component-wave`, `component-lab-rmt-inspector`, `rmt-first-demo-app`, `existing-component-metadata`, `browser`, `a11y-hydration`, `screenreader-signals`, `motion-contrast`, `regression-priority` und `references`. Release-only Performance bleibt ueber `fabric-performance-measurements`, `performance-regression` und `hydration-policy` getrennt.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js epic10-platform-gates --json
```

## Epic 10 Release Handoff

`WP-E10-16` finalisiert die kanonische Guide-Struktur und den Abschlusscontract `xtend.epic10.release-handoff.v1`. Der maschinenlesbare Plan liegt in `catalog/epic10-release-handoff.js`.

Die kanonische Component-Fabric-Boundary ist `adapter-injection-via-xtend-component-resolveFabricContext`. `window.XTendFabric` bleibt Host-Komfort- und Enterprise-Integrationsflaeche, aber Komponenten beziehen Fabric-, Lane- und Fiber-Kontext ueber den `xtend.component` Adapter.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js epic10-release-handoff --json
```

## Epic 11 Enterprise UX Handoff

`WP-E11-18` finalisiert die sichtbare Component-UX-Reife als `xtend.epic11.enterprise-ux-handoff.v1`. Der maschinenlesbare Plan liegt in `catalog/epic11-enterprise-ux-handoff.js`.

Der Abschlussmodus lautet `completed-with-accepted-long-tail-handoff`: Shell, Styling, Runtime-A11y, Performance, Component Network, RMT Shell Authoring, Component Lab, Browser-Smokes, Theme-Matrix und Authoring Guides sind als Produktlinie akzeptiert. Nach `WP-E12-09` sind `x-tabs`, `x-theme`, `x-button` und `x-menu` runtime-seitig geschlossen; `xstate` besitzt Suite, Fixture, Types und Adapter-Boundary-Probe; `x-utils` besitzt Utility Contract, Import Policy, Fixture und Types. `xstate` und `x-utils` bleiben nur wegen Boundary-Profilentscheidungen als Handoff sichtbar.

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json
```

## RMT First-Class Support

Jede neue Komponente muss als RMT Component Record authorbar sein:

- Adapter: `xtend.component`
- Template-Modus: `dom_descriptor`
- Event Binding: `dom-event-to-rmt-command`
- Pflicht-Schedules: `component.visible.mount`, Hydration Schedule und `diagnostics.snapshot`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

RMT beschreibt also Komponente, Props, Attribute, Slots, Events, Hydration und Schedule. XTend fuehrt die Custom Elements lokal aus.

## Fabric, Telemetry und Lanes

Neue Komponenten muessen Fabric-Kontext aufnehmen koennen. Dazu gehoeren:

- `@xtend-fabric` Boundary
- Lifecycle-Operationen `mount`, `hydrate`, `render`, `update`, `event`, `error`, `unmount`
- Telemetry Snapshot `xtend.fabric.telemetry-snapshot.v1`
- Backpressure-faehige Messpunkte
- deterministische Lane-Precedence aus RMT, Component Metadata, Fabric Override und Blueprint Default

## A11y und Performance

A11y ist kein nachgelagerter Test. Form Controls brauchen Labels, Error Regions, Keyboard-Verhalten und Screenreader-Signale. Feedback-Komponenten brauchen Live Regions und non-color Statussignale. Overlays brauchen Escape, Fokus-Rueckgabe und Reduced Motion.

Performance ist ebenfalls Contract-Bestandteil. Jede Komponente muss Budgetklasse, Lane, Hydration Policy und kritische Messpunkte deklarieren.

## Lokale Gates

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js epic10-p0-component-wave --json
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
node scripts/run_xtend_tests.js rmt-first-demo-app --json
node scripts/run_xtend_tests.js existing-component-metadata --json
node scripts/run_xtend_tests.js epic10-platform-gates --json
node scripts/run_xtend_tests.js epic10-release-handoff --json
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js references --json
```
