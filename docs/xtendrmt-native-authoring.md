# XTendRMT Native Authoring Guide

- Status: produktiv nach Epic 05 Abschluss
- Contract: `xtend.rmt.native-authoring-guide.v1`
- Mindestgates:
  - `node scripts/run_xtend_tests.js rmt-compatibility --json`
  - `node scripts/run_xtend_tests.js browser --json`
  - `node scripts/run_xtend_tests.js references --json`

## Zweck

Dieser Guide beschreibt das produktive Authoring-Modell fuer native `.rmt` Dokumente mit XTend UI und XRouter. Ziel ist, dass Menschen und AI-Agenten native RMT Routes, XTend Components, Adapter und Schedules schreiben koennen, ohne XTend oder XRouter in den RMT Kernel einzubetten.

`.rmt` ist der kanonische Dateityp. Server sollten ihn als `application/vnd.xtendrmt.rmt+json` oder kompatibel als Text ausliefern; der Runtime-Loader liest RMT-Dokumente als Text und parst sie ueber `createRmtFormat().parseDocument(...)`. JSON-Endungen bleiben nur fuer Edge-Case-Hosts ohne native MIME-Unterstuetzung vorgesehen.

Fuer einen kompakten Produktueberblick siehe [XTendRMT Developer Overview](./xtendrmt-overview.md). Die referenzartige DSL-Beschreibung liegt in [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md); Runtime-Factories und Bridge-Verkabelung liegen in [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

Die Produktgrenze bleibt:

- XTend UI ist das UI-Builder- und Web-Component-Produkt
- XTendRMT ist Scheduler, Runtime Kernel und Templating Engine
- XRouter ist der erste produktive Router Adapter
- XTend Components sind First-Class RMT Components ueber `xtend.component`
- nicht-XTend Hosts bleiben ueber eigene Adapter gleichberechtigt

Ab `WP-E13-09` ist [RMT Production Readiness](./rmt-production-readiness.md) der RC1-Schnitt fuer diesen Pfad. Der Contract `xtend.epic13.rmt-production-readiness.v1` wird lokal ueber `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json` geprueft und buendelt die bestehenden RMT-, Component-, Fabric- und Telemetry-Gates.

Ab Epic 14 ist der native Authoring-Pfad auch toolgestuetzt:

- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md) beschreibt `xt rmt lint`, JSON-Reports, `--fail-on` und `--agent`.
- [RMT Language Server und Editor Setup](./rmt-language-server.md) beschreibt LSP, Snippets und Editor-Anbindung fuer VS Code, JetBrains, Neovim und Helix.
- `node scripts/run_xtend_tests.js rmt-language-regression --json` prueft valide, defekte, Legacy- und groessere RMT-Dokumente ueber Parser, Linter, CLI, LSP und Agent-Report hinweg.

## Minimaler Dokumentaufbau

Neue App-DSL-Dokumente nutzen native Top-Level-Domains:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "documentId": "app.shell",
  "namespace": "app",
  "adapters": [],
  "components": [],
  "routes": [],
  "schedules": [],
  "surfaces": [],
  "templates": []
}
```

Bestehende Template-only-Dokumente bleiben gueltig. Neue Routing- und Component-Arbeit soll jedoch nicht mehr in `manifest.metadata` versteckt werden.

## Adapter

Adapter beschreiben Host-Faehigkeiten. Sie sind Daten im RMT Dokument, keine Kernel-Imports.

```json
{
  "id": "xtend.xrouter",
  "kind": "router_adapter",
  "runtimeSurface": ["esm", "browser_classic"],
  "providedCapabilities": ["routes", "navigation", "params", "query", "scheduleRefs"],
  "kernelVisible": false
}
```

Stabile Adapter-IDs fuer den aktuellen Produktpfad:

- `xtend.xrouter` fuer native XRouter Routes
- `xtend.component` fuer XTend Custom Elements
- `xtend.surface` fuer native Surface Records als WindowManager-, SidePanel- und Overlay-Handoff
- `rmt.state-scheduler-diagnostics` fuer Adapter Results, Scheduler Endpoints und Diagnostics
- `vanilla.component` als Beispiel fuer einen nicht-XTend Component Host

## Components

Eine Component beschreibt das fachliche Host-Element. XTend-spezifische Arbeit bleibt Adapteraufgabe.

```json
{
  "id": "settings.card",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-card",
  "schedule": "component.idle.hydrate",
  "props": {
    "label": "Settings"
  },
  "attributes": {
    "data-host": "xtend"
  },
  "hydration": {
    "mode": "runtime_render",
    "ownershipMode": "managed_subtree"
  }
}
```

Authoring-Regeln:

- `id` ist stabil und route-freundlich.
- `adapter` referenziert einen Record aus `adapters`.
- `tag` ist bei Custom Elements erforderlich.
- `props`, `attributes` und `slots` bleiben explizit.
- `schedule` referenziert eine Policy aus `schedules`.
- Manifest Lookup, Custom-Element-Registration, DOM-Erzeugung und Hydration gehoeren zu `createRmtXtendComponentAdapter`.

## Routes

Eine Route beschreibt Navigation, nicht DOM-Aufbau.

```json
{
  "id": "settings",
  "path": "/settings",
  "router": "xtend.xrouter",
  "component": "settings.card",
  "template": "settings.shell",
  "schedule": "route.visible.render",
  "query": {
    "tab": "profile"
  }
}
```

Authoring-Regeln:

- `router` referenziert den Router Adapter.
- `component` referenziert einen nativen Component Record.
- `template` bleibt optional, aber empfohlen fuer renderbare Shells.
- `schedule` steuert Route-Aktivierung ueber eine zentrale Policy.
- Parameter, Query und Metadata bleiben generisch.
- XRouter-Mapping, `registerRoutes` und Navigation gehoeren zu `createRmtXRouterAdapter`.

## Schedules

Schedules sind zentrale Policies. Routes und Components referenzieren sie nur.

```json
{
  "id": "component.idle.hydrate",
  "endpointName": "xtendrmt.component.hydrate",
  "scope": "app.component.hydrate",
  "lane": "idle",
  "priority": 40,
  "deadlineMs": 420,
  "preferIdle": true,
  "budgetClass": "background"
}
```

Erprobte Policies aus Demo und Browser-Smoke:

- `route.visible.render` -> `xtendrmt.route.render`
- `component.visible.mount` -> `xtendrmt.component.mount`
- `component.idle.hydrate` -> `xtendrmt.component.hydrate`
- `vanilla.visible.mount` -> `xtendrmt.vanilla.mount`

Die Ausfuehrung und Spiegelung von Scheduler-Ergebnissen gehoert zu `createRmtStateSchedulerDiagnosticsBridge`.

## Surfaces

Ab `WP-SM-08` koennen komplexe App-Shell-Oberflaechen native `surfaces` Records fuehren:

```json
{
  "id": "surface.inspector",
  "schema": "xtend.surface.record.v1",
  "type": "window",
  "adapter": "xtend.surface",
  "manager": "workbench.manager",
  "component": "workbench.inspector",
  "route": "workbench",
  "schedule": "surface.user-blocking.open",
  "stateKey": "xtend.surface.inspector.state"
}
```

Authoring-Regeln:

- `manager` und `component` referenzieren native Component Records.
- `route` und `schedule` binden Surface-Sichtbarkeit an App- und Scheduler-Kontext.
- `components[*].metadata.surface` bleibt als Migrationsquelle gueltig.
- `xtend.surface` ist in `WP-SM-08` ein Adapter-Handoff, keine produktive Kernel-Runtime.
- Details liegen in [SurfaceManager Native RMT Surfaces](./surface-manager-native-rmt-surfaces.md).
- Der abgeschlossene Surface-Authoring-Pfad liegt in [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md) (`docs/surface-manager-authoring-guide.md`) und beschreibt `component-metadata-mvp`, `dual-record-handoff` und `native-surfaces-preferred`.

## Templates

Templates bleiben Teil von RMT. Fuer XTend UI sollen sie Host-Daten referenzieren statt versteckte Component-Logik zu enthalten.

```json
{
  "id": "settings.shell",
  "mode": "html_fragment",
  "markup": "<x-card></x-card>",
  "security": {
    "markupClass": "htmlFragment",
    "trustBoundary": "xtend.security.sanitizing-boundary.v1",
    "sink": "trustedDomBoundary"
  },
  "hydration": {
    "mode": "runtime_render",
    "metadata": {
      "endpointHint": "xtendrmt.component.hydrate"
    }
  }
}
```

Wenn eine Component eine Route vollstaendig abdeckt, bleibt `template` optional. Wenn Slots oder Shell-Markup benoetigt werden, sollte der Template Record stabil referenziert werden.

Security-Regel ab `ER-WP-29`: `dom_descriptor` ist der bevorzugte Modus fuer neue Templates. `html_fragment` bleibt moeglich, ist aber DOM-untrusted und braucht `xtend.security.sanitizing-boundary.v1`. Der RMT Kernel sanitized kein HTML; Host Adapter besitzen den Trusted-DOM-Sink. Siehe [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md).

## Runtime-Verkabelung

Der produktive Browser-/ESM-Pfad besteht aus vier Schritten:

1. `createRmtFormat().normalizeDocument(document)`
2. `createRmtFormat().createRuntimeRegistries(normalizedDocument)`
3. `createRmtXRouterAdapter(...).registerRoutes(registry)`
4. `createRmtXtendComponentAdapter(...).mountComponent(...)` und `hydrateComponent(...)`

Adapter Results koennen anschliessend ueber `createRmtStateSchedulerDiagnosticsBridge(...).recordAdapterResult(...)` an `xstate`, Scheduler und Diagnostics Hub gespiegelt werden.

## Authoring Tooling

Empfohlener lokaler Ablauf:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
```

Die IDE-Anbindung startet denselben Sprachkern ueber:

```bash
node tools/rmt-language-server/server.js
```

Wichtig: Linter, LSP, Code Actions und Agent Report teilen sich den gleichen Diagnosekern. Editor-Packages und AI-Agenten sollen keine eigenen RMT-Regeln implementieren.

Neue App-Shells koennen ueber den Snippet-Prefix `rmt-app` gestartet werden. Weitere Prefixes sind `rmt-component`, `rmt-route`, `rmt-schedule`, `rmt-template-dom` und `rmt-template-html`.

## Epic-10-App-Authoring

Fuer vollstaendige XTend-Apps gilt ab Epic 10 der Contract `xtend.rmt.first-class-app-authoring.v1`. Er erweitert den nativen Authoring-Pfad von einzelnen Routes und Components auf komplette Shell-first Apps:

- App Shell als `dom_descriptor`
- `xtend.component`, `xtend.xrouter` und `rmt.state-scheduler-diagnostics` als Pflichtadapter
- Component Records mit Props, Attributes, Slots, Events, Fabric- und A11y-Metadaten
- Route Records mit Component-, Template- und Schedule-Referenzen
- zentrale Schedule Policies fuer Shell, Route Render, Component Mount, Hydration, User Input, Lazy Media und Diagnostics
- Kernel Boundary `no-rmt-kernel-import-of-xtend-types`

Das Referenz-Fixture liegt in `tests/fixtures/rmt-first-class-xtend-app.rmt`; der lokale Gate ist `node scripts/run_xtend_tests.js rmt-first-class-app --json`.

## Fabric/Lane-Ingestion im Component Adapter

Der XTend Component Adapter wertet ab `xtend.component.fabric-lane-ingestion.v2` Fabric- und Lane-Hints direkt beim Mounting und bei Hydration aus. Die Precedence ist:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

Der Adapter stellt dafuer `resolveFabricContext(componentRef, operation, model, options)` bereit. `mountComponent(...)` und `hydrateComponent(...)` spiegeln den Context in `result.metadata.fabric` und setzen DOM-Attribute fuer Lane, RMT-Lane, Fiber, Source und Endpoint. Konflikte erzeugen `rmt.xtend.component.fabric_lane.conflict`.

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json
```

## Component Lifecycle Telemetry

Ab `xtend.component.lifecycle-telemetry.v1` erzeugt derselbe Adapter standardisierte Component Lifecycle Telemetry. `mountComponent(...)` und `hydrateComponent(...)` schreiben `result.metadata.telemetry`; die Event Bridge erzeugt `event` Records; fuer Render, Update, Unmount und Error steht `recordComponentTelemetry(record, options)` bereit.

Fabric kann diese Records ueber `createTelemetrySnapshot({ componentTelemetry })` unter `snapshot.componentTelemetry` aggregieren. Component-Fehler, Deadline-Ueberschreitungen und explizite `backpressureSignal` Metadata fliessen in die Backpressure-Sektion ein.

```bash
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
```

Aktuelle Artefakte:

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `xtendrmt/rmt.schema.json`
- `xtendrmt/rmt-manifest.json`

## Multi-Host-Regel

Native RMT Components duerfen nicht implizit XTend bedeuten. Ein nicht-XTend Host nutzt denselben Component-Record-Aufbau mit eigener Adapter-ID:

```json
{
  "id": "vanilla-panel",
  "kind": "custom_element",
  "adapter": "vanilla.component",
  "tag": "vanilla-panel",
  "schedule": "vanilla.visible.mount"
}
```

Der Browser-Smoke `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` prueft genau diesen Pfad. Damit ist Framework-Agnostik nicht nur Architekturziel, sondern Regression.

## Kernel Boundary

Der RMT Kernel darf nicht importieren oder voraussetzen:

- `x-router`
- konkrete `x-*` Komponenten
- XTend Manifest-Strukturen
- `window.XTend`
- `xstate`
- Browser DOM APIs

Der Kernel darf normalisieren, indizieren, validieren und Schedule Policies beschreiben. Host-Ausfuehrung bleibt Adapterarbeit.

## Review-Checkliste

Vor einem neuen nativen `.rmt` Dokument pruefen:

- sind `adapters`, `components`, `routes` und `schedules` Top-Level-Domains?
- referenzieren Routes nur Component IDs und keine DOM-Details?
- referenzieren Components nur Adapter IDs und keine Kernel-Sonderfaelle?
- sind Schedule Policies zentral und wiederverwendbar?
- bleiben XTend-spezifische Daten `kernelVisible: false`?
- existiert fuer nicht-XTend Hosts ein eigener Adapter statt XTend-Fallback?
- laufen `rmt-compatibility`, `browser` und `references` Gates?
