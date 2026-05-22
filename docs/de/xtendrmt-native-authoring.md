# XTendRMT Native Authoring Guide

- Status: produktiv nach Epic 05 Abschluss, vNext-first aktualisiert
- Contract: `xtend.rmt.native-authoring-guide.v1`
- Mindestgates:
  - `node scripts/run_xtend_tests.js rmt-compatibility --json`
  - `node scripts/run_xtend_tests.js browser --json`
  - `node scripts/run_xtend_tests.js references --json`

## Zweck

Dieser Guide beschreibt das produktive Authoring-Modell fuer native `.rmt`
Dokumente mit XTend UI und XRouter. Der empfohlene Weg fuer neue Apps ist RMT
vNext: App Shell, Surfaces, Routes, State, Events, Hydration und Fabric-Lanes
stehen in einer lesbaren RMT-Quelle. Legacy- und App-DSL-JSON bleiben
Compatibility Layer, Runtime Registry und Compiler-Target, aber nicht der
normale Autorenpfad.

`.rmt` ist der kanonische Dateityp. Server sollten ihn als
`application/vnd.xtendrmt.rmt+json` oder kompatibel als Text ausliefern; der
Runtime-Loader liest RMT-Dokumente als Text und parst sie ueber
`createRmtFormat().parseDocument(...)`. JSON-Endungen bleiben nur fuer
Edge-Case-Hosts ohne native MIME-Unterstuetzung vorgesehen.

Fuer einen kompakten Produktueberblick siehe [XTendRMT Developer
Overview](./xtendrmt-overview.md). Die referenzartige DSL-Beschreibung liegt in
[XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md); Runtime-Factories und
Bridge-Verkabelung liegen in [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

Die Produktgrenze bleibt:

- XTend UI ist das UI-Builder- und Web-Component-Produkt.
- XTendRMT ist Scheduler, Runtime Kernel und Templating Engine.
- XRouter ist der erste produktive Router Adapter.
- XTend Components sind First-Class RMT Components ueber `xtend.component`.
- Nicht-XTend Hosts bleiben ueber eigene Adapter gleichberechtigt.
- Der RMT Kernel importiert keine XTend-, XRouter-, DOM- oder Browser-Typen.

Ab `WP-E13-09` ist [RMT Production Readiness](./rmt-production-readiness.md)
der RC1-Schnitt fuer diesen Pfad. Der Contract
`xtend.epic13.rmt-production-readiness.v1` wird lokal ueber
`node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json`
geprueft und buendelt die bestehenden RMT-, Component-, Fabric- und
Telemetry-Gates.

Ab Epic 14 ist der native Authoring-Pfad auch toolgestuetzt:

- [RMT Linter und AI-Agent Repair Report](./rmt-linter.md) beschreibt
  `xt rmt lint`, JSON-Reports, `--fail-on` und `--agent`.
- [RMT Language Server und Editor Setup](./rmt-language-server.md) beschreibt
  LSP, Snippets und Editor-Anbindung fuer VS Code, JetBrains, Neovim und Helix.
- `node scripts/run_xtend_tests.js rmt-language-regression --json` prueft
  valide, defekte, Legacy- und groessere RMT-Dokumente ueber Parser, Linter,
  CLI, LSP und Agent-Report hinweg.

## Minimaler vNext-Aufbau

Neue App-Shells starten mit einer vNext-Quelle:

```rmt
template settings.app {
  state settings.tab type string initial "profile"

  selector settings.view from state settings.tab {
    output SettingsView
  }

  action settings.save {
    input tab string
    reduce state.settings.tab = input.tab
    emit settings.saved with action settings.save
  }

  portal surface.root root "#app-root" layer surface

  surface settings.card kind page component x-card {
    source selector settings.view
    portal surface.root

    lane visible weight 80 {
      mount x-card
      hydrate settings-card from selector settings.view
    }

    on submit target settings-form -> action settings.save {
      payload tab from target.dataset.tab
    }
  }
}
```

Der Compiler erzeugt daraus Core- und Kernel-Records fuer `adapters`,
`components`, `routes`, `schedules`, `surfaces` und `templates`. Diese Records
sind Runtime-Registry und Mirror; App-Autoren arbeiten in vNext.

## Adapter und Host-Grenze

Adapter beschreiben Host-Faehigkeiten. Sie sind Daten im RMT Dokument, keine
Kernel-Imports. Der aktuelle Produktpfad kennt diese stabilen Adapter-IDs:

- `xtend.xrouter` fuer native XRouter Routes.
- `xtend.component` fuer XTend Custom Elements.
- `xtend.surface` fuer SurfaceManager-, SidePanel- und Overlay-Handoffs.
- `rmt.state-scheduler-diagnostics` fuer Adapter Results, Scheduler Endpoints
  und Diagnostics.
- `vanilla.component` als Beispiel fuer einen nicht-XTend Component Host.

`kernelVisible: false` bleibt fuer host-spezifische Adapterdaten der Normalfall.
Der Kernel darf Records normalisieren, indizieren und schedulen, aber keine
Host-Runtime laden.

## Components, Routes und Schedules in vNext

Components werden ueber `surface ... component ...` sichtbar. Route- und
Schedule-Informationen bleiben in der RMT-Quelle deklarativ und werden vom Host
ueber Adapter ausgefuehrt:

```rmt
template settings.routes {
  portal surface.root root "#app-root" layer surface

  surface settings.page kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-shell from endpoint xtendrmt.route.render
      hydrate settings-form from endpoint xtendrmt.component.hydrate
    }

    lane idle weight 20 {
      hydrate settings-help from endpoint xtendrmt.component.hydrate
    }
  }
}
```

Der Normalizer macht daraus Runtime-Registry-Eintraege, die Adapter ueber
`componentRegistry.byAdapter["xtend.component"]`, `componentRegistry.byTag[...]`
und Route-/Schedule-Indizes konsumieren. XRouter-Mapping, `registerRoutes`,
Custom-Element-Registration, DOM-Erzeugung und Hydration bleiben Host-Aufgabe.

## Surfaces und Templates

Komplexe App-Shells werden in vNext als Surfaces und Portals beschrieben:

```rmt
template workbench.app {
  state workbench.selection type object initial null

  portal surface.root root "#workbench-root" layer surface

  surface workbench.manager kind workspace component x-surface-manager {
    portal surface.root

    lane visible weight 90 {
      hydrate surface-manager from endpoint xtendrmt.component.mount
    }
  }

  surface workbench.inspector kind window component x-surface-window {
    source state workbench.selection
    portal surface.root

    lane user-blocking weight 95 {
      hydrate inspector-window from state workbench.selection
    }
  }
}
```

Das Lowering kann daraus weiterhin `dom_descriptor` Template Records und
native `surfaces` Records erzeugen. `html_fragment` bleibt kompatibel, ist aber
DOM-untrusted und braucht `xtend.security.sanitizing-boundary.v1`. Der Kernel
sanitized kein HTML; Host Adapter besitzen den Trusted-DOM-Sink. Siehe
[Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md).

Der abgeschlossene Surface-Authoring-Pfad liegt in [SurfaceManager Authoring
Guide](./surface-manager-authoring-guide.md) (`docs/surface-manager-authoring-guide.md`).

## Runtime-Verkabelung

Der produktive Browser-/ESM-Pfad bleibt stabil:

1. `createRmtFormat().normalizeDocument(document)`
2. `createRmtFormat().createRuntimeRegistries(normalizedDocument)`
3. `createRmtXRouterAdapter(...).registerRoutes(registry)`
4. `createRmtXtendComponentAdapter(...).mountComponent(...)` und
   `hydrateComponent(...)`

Adapter Results koennen anschliessend ueber
`createRmtStateSchedulerDiagnosticsBridge(...).recordAdapterResult(...)` an
`xstate`, Scheduler und Diagnostics Hub gespiegelt werden.

Die stabilen Factory-Namen fuer Adapterdokumentation und Tooling bleiben
`createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und
`createRmtStateSchedulerDiagnosticsBridge`. Die Standard-Policies bleiben
`route.visible.render` fuer sichtbares Routing und `component.idle.hydrate`
fuer nachgelagerte Component-Hydration.

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

Wichtig: Linter, LSP, Code Actions und Agent Report teilen sich den gleichen
Diagnosekern. Editor-Packages und AI-Agenten sollen keine eigenen RMT-Regeln
implementieren.

Neue App-Shells koennen ueber den Snippet-Prefix `rmt-app` gestartet werden.
Weitere Prefixes sind `rmt-component`, `rmt-route`, `rmt-schedule`,
`rmt-template-dom`, `rmt-template-html` und `rmt-vnext-primitive-shell`.

## Fabric/Lane-Ingestion im Component Adapter

Der XTend Component Adapter wertet ab `xtend.component.fabric-lane-ingestion.v2`
Fabric- und Lane-Hints direkt beim Mounting und bei Hydration aus. Die
Precedence bleibt:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

In vNext kommt die bevorzugte Quelle aus `lane`- und Lifecycle-Klauseln. Der
Adapter stellt dafuer `resolveFabricContext(componentRef, operation, model,
options)` bereit. `mountComponent(...)` und `hydrateComponent(...)` spiegeln
den Context in `result.metadata.fabric` und setzen DOM-Attribute fuer Lane,
RMT-Lane, Fiber, Source und Endpoint. Konflikte erzeugen
`rmt.xtend.component.fabric_lane.conflict`.

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json
```

## Component Lifecycle Telemetry

Ab `xtend.component.lifecycle-telemetry.v1` erzeugt derselbe Adapter
standardisierte Component Lifecycle Telemetry. RMT-Dokumente muessen dafuer
keinen XTend-Code importieren; sie liefern nur Component-, Route-, Schedule-
und Fabric-Kontext. Der Host kann `telemetryCollector`, `recordTelemetry` oder
eine Fabric-Instanz uebergeben.

```js
const records = [];
adapter.mountComponent(root, 'pages.settings', model, {
  mapping,
  telemetryCollector: records
});

const snapshot = fabric.createTelemetrySnapshot({
  componentTelemetry: records
});
```

`snapshot.componentTelemetry` aggregiert `mount`, `hydrate`, `render`, `update`,
`event`, `unmount` und `error` nach Operation, Component und Lane. Component-
Fehler, Deadline-Ueberschreitungen und explizite `backpressureSignal` Metadata
koennen Backpressure erzeugen. Der Gate ist
`node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json`.

Hosts koennen Fabric Snapshots direkt an die produktive RMT Bridge uebergeben:

```js
bridge.recordTelemetrySnapshot(snapshot, {
  scheduleRef: "diagnostics.snapshot"
});
```

Die Bridge spiegelt daraus `rmt.telemetry.lastSnapshot` und
`rmt.backpressure.*` und plant bei Bedarf den Diagnostics-Snapshot-Endpunkt.

## Multi-Host-Regel

Native RMT Components duerfen nicht implizit XTend bedeuten. Ein nicht-XTend
Host nutzt denselben vNext-Aufbau mit eigener Adapter-ID und eigener
Host-Ausfuehrung:

```rmt
template vanilla.app {
  portal surface.root root "#vanilla-root" layer surface

  surface vanilla.panel kind card component vanilla-panel {
    portal surface.root

    lane visible weight 60 {
      hydrate vanilla-panel from endpoint xtendrmt.vanilla.mount
    }
  }
}
```

Der Browser-Smoke `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` prueft
genau diesen Pfad. Damit ist Framework-Agnostik nicht nur Architekturziel,
sondern Regression.

## Kernel Boundary

Der RMT Kernel darf nicht importieren oder voraussetzen:

- `x-router`
- konkrete `x-*` Komponenten
- XTend Manifest-Strukturen
- `window.XTend`
- `xstate`
- Browser DOM APIs

Der Kernel darf normalisieren, indizieren, validieren und Schedule Policies
beschreiben. Host-Ausfuehrung bleibt Adapterarbeit.

## Review-Checkliste

Vor einem neuen nativen `.rmt` Dokument pruefen:

- beschreibt die Quelle App Shell, Surfaces, Lanes und Events in RMT vNext?
- sind Legacy-/App-DSL-JSON nur noch Compiler-Output, Mirror oder Migration?
- bleiben XTend-spezifische Daten ausserhalb des Kernels?
- referenzieren Lifecycle-Operationen stabile Endpoints und Adaptergrenzen?
- existiert fuer nicht-XTend Hosts ein eigener Adapter statt XTend-Fallback?
- laufen `rmt-compatibility`, `browser` und `references` Gates?
