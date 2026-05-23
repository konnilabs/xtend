# XTendRMT Native Migration Guide

- Status: produktiv nach Epic 05 Abschluss
- Contract: `xtend.rmt.native-migration-guide.v1`
- Mindestgates:
  - `node scripts/run_xtend_tests.js rmt-compatibility --json`
  - `node scripts/run_xtend_tests.js references --json`
  - `npm test`

## Zweck

Dieser Guide beschreibt die Migration von fruehen XTendRMT-Metadatenpfaden zu
nativen RMT Top-Level-Domains und weiter zu RMT vNext. Die Migration ist
additiv und opt-in: bestehende XTend-, React-, Vue-, Vanilla-JS- und
Custom-Apps duerfen weiterlaufen, waehrend neue App-Shells in RMT vNext
geschrieben werden. `adapters`, `components`, `routes`, `schedules` und
`templates` bleiben Runtime Registry, Compiler-Output und Compatibility Mirror.

Der aktuelle Produktueberblick liegt in [XTendRMT Developer Overview](./xtendrmt-overview.md). Die App-DSL-Details stehen in [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md), die produktive Adapter-/Bridge-Verkabelung in [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

## Zielzustand

Neue Dokumente sollen diese Quellen nutzen:

| Bereich | Zielquelle |
|---------|------------|
| Host Adapter | vNext Surface-/Endpoint-Nutzung, Output: `adapters` |
| XTend Components | `surface ... component x-*`, Output: `components` mit `adapter: "xtend.component"` |
| XRouter Routes | vNext Shell-/Route-Surface, Output: `routes` mit `router: "xtend.xrouter"` |
| Scheduler Policies | `lane` und Lifecycle-Operationen, Output: `schedules` |
| Markup oder Fragmente | `surface`, `slot`, `trust boundary`, Output: `templates` |
| Beschreibung, Handoff, Historie | `manifest.metadata` |

`manifest.metadata` bleibt fuer Produktbeschreibung, Handoff-Notizen,
Demo-Historie und bewusst historische Pilotdaten gueltig. Operative Routes,
Components und Schedules sollen dort nicht neu entstehen.
Template-only-Dokumente bleiben kompatibel.

## vNext-Zielbild

```rmt
template settings.migration {
  state settings.tab type string initial "profile"

  portal surface.root root "#settings-root" layer surface

  surface settings.card kind card component x-card {
    source state settings.tab
    portal surface.root

    lane visible weight 80 {
      hydrate settings-card from state settings.tab
    }
  }
}
```

Die JSON-Beispiele in den folgenden Schritten sind bewusst als Legacy Input
oder Runtime-Registry-Output markiert. Sie zeigen Migrationsevidence, nicht die
neue Schreibform.

## Migrationsmatrix

| Ausgangslage | Migration |
|--------------|-----------|
| Template-only `.rmt` Dokument | bleibt gueltig; nur bei App-DSL-Bedarf native Domains ergaenzen |
| `manifest.metadata.routes` | nach `routes` verschieben |
| `manifest.metadata.components` | nach `components` verschieben |
| `manifest.metadata.schedules` | nach `schedules` verschieben |
| XRouter-spezifische Demo-Initialisierung | durch `createRmtXRouterAdapter` ersetzen |
| XTend-spezifische Demo-Mount-Logik | durch `createRmtXtendComponentAdapter` ersetzen |
| manuelle Scheduler-/State-Bruecke | durch `createRmtStateSchedulerDiagnosticsBridge` ersetzen |
| nicht-XTend Host | eigenen Adapter wie `vanilla.component` deklarieren |

## Schritt 1: Adapter im Registry-Output explizit machen

Alte Demo-Metadaten enthalten oft implizites Wissen wie "diese Route nutzt XRouter" oder "diese Component ist XTend". Der erste Migrationsschritt ist ein expliziter Adapter-Record.

```json
{
  "id": "xtend.component",
  "kind": "component_adapter",
  "runtimeSurface": ["esm", "browser_classic"],
  "providedCapabilities": ["components", "customElements", "hydration", "scheduleRefs"],
  "kernelVisible": false
}
```

`kernelVisible: false` ist fuer host-spezifische Adapterdaten Pflicht. Es bedeutet: Der Kernel darf den Record validieren und indizieren, aber keine XTend-Laufzeit importieren.

## Schritt 2: Components aus Legacy-Metadaten heben

Vorher: Legacy `manifest.metadata`

```json
{
  "manifest": {
    "metadata": {
      "components": [
        {
          "id": "settings.card",
          "tag": "x-card"
        }
      ]
    }
  }
}
```

Nachher: Compatibility-/Registry-Output

```json
{
  "components": [
    {
      "id": "settings.card",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "x-card",
      "schedule": "component.idle.hydrate"
    }
  ]
}
```

Damit kann `createRmtFormat().createRuntimeRegistries(...)` die Component ueber `componentRegistry.byAdapter["xtend.component"]` bereitstellen.

## Schritt 3: Routes aus Legacy-Metadaten heben

Vorher: Legacy `manifest.metadata`

```json
{
  "manifest": {
    "metadata": {
      "routes": [
        {
          "path": "/settings",
          "component": "settings.card"
        }
      ]
    }
  }
}
```

Nachher: Compatibility-/Registry-Output

```json
{
  "routes": [
    {
      "id": "settings",
      "path": "/settings",
      "router": "xtend.xrouter",
      "component": "settings.card",
      "template": "settings.shell",
      "schedule": "route.visible.render"
    }
  ]
}
```

Damit kann `createRmtXRouterAdapter` die Route ueber `routeRegistry.byRouter["xtend.xrouter"]` mappen und mit `registerRoutes` an XRouter uebergeben.

## Schritt 4: Schedules zentralisieren

Vorher lagen Endpoint-Hints oft in Route-, Component- oder Template-Metadaten. Nach der Migration steht die Policy zentral in `schedules`.

```json
{
  "schedules": [
    {
      "id": "route.visible.render",
      "endpointName": "xtendrmt.route.render",
      "lane": "visible",
      "priority": 80,
      "preferIdle": false
    },
    {
      "id": "component.idle.hydrate",
      "endpointName": "xtendrmt.component.hydrate",
      "lane": "idle",
      "priority": 40,
      "preferIdle": true
    }
  ]
}
```

Routes und Components referenzieren nur noch `schedule`. Die Ausfuehrung laeuft ueber `createRmtStateSchedulerDiagnosticsBridge`.

## Schritt 5: Demo-Brueckenlogik entfernen

Dauerhafte Demo-Brueckenlogik soll nicht mehr neue Produktlogik tragen. Ein migrierter Host-Start nutzt die produktiven Factories:

```js
const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(document);
const registry = format.createRuntimeRegistries(normalizedDocument);

const routes = createRmtXRouterAdapter({ routerElement }).registerRoutes(registry);
const components = createRmtXtendComponentAdapter({ document, manifest }).mapComponents(registry);
const bridge = createRmtStateSchedulerDiagnosticsBridge({ schedules: normalizedDocument.schedules });

bridge.recordAdapterResult(routes, { scheduleRef: 'route.visible.render' });
```

Wenn Speziallogik weiterhin notwendig ist, gehoert sie in einen Adapter oder in upstream RMT Source, nicht in eine Demo-Datei.

## Bestcase-Referenz

`xtendrmt/xtendrmt-bestcase-demo.rmt` ist die produktive Authoring-Referenz fuer RMT vNext:

- die `.rmt` Datei nutzt `template`, `surface`, `lane`, Lifecycle-Operationen, Slots, Event-Actions, State, Selectors, Actions, DataSources, Portals, Overlays, Resources und Remote Surfaces statt JSON
- `xtendrmt/xtendrmt-bestcase-demo.core.json` ist der byte-stabile vNext-Core-Output
- die Browser-Demo projiziert vNext-Core zur Laufzeit auf `adapters`, `components`, `routes`, `schedules`, Component Capability Registry, Player Contract und Resource Ownership
- `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter`, `createRmtStateSchedulerDiagnosticsBridge` und `createRmtComponentCapabilityRegistry` bleiben die produktiven Adapterpfade
- `nativeDemoMigration` wird in der Runtime-Projektion als Handoff-Metadatum erhalten

`tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` ist die browsernahe Regression fuer den migrierten Pfad. Sie prueft zusaetzlich `vanilla.component`, damit der Zielzustand framework-agnostisch bleibt.

Fuer die offizielle Docs-App gilt: Parsedown bleibt der aktive Markdown-Parser, aber die sichtbare App Shell wird Shell-first aus `docs.app.shell` im RMT-Dokument gerendert. Der RMT-Scheduling- und Shell-Pfad fuer Parsedown, Search und future-ready Media-Slots ist ueber [XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md) dokumentiert und bleibt host-neutral.

## SurfaceManager Migration

Ab `WP-SM-09` besitzt der SurfaceManager einen eigenen Migrationsguide: [SurfaceManager Migration Guide](./surface-manager-migration-guide.md) (`docs/surface-manager-migration-guide.md`).

Der Surface-Pfad ist additiv:

- bestehende `components[*].metadata.surface` Records bleiben gueltig
- native `surfaces[*]` Records werden fuer komplexe App Shells bevorzugt
- Dual Records halten `id`, `type`, `manager`, `component`, `route`, `schedule` und `stateKey` synchron
- `xtend.surface` bleibt `surface_adapter` Handoff, bis eine produktive Adapter Runtime implementiert wird

## Was nicht migriert werden muss

Nicht jede Datei braucht sofort native Domains.

Nicht migrieren:

- reine Template-only-Dokumente ohne Routing- oder Component-Bedarf
- historische Demos mit `manual-legacy` Status
- Metadaten, die nur Produktbeschreibung oder Handoff-Notizen enthalten
- React-, Vue-, Vanilla- oder Custom-Hosts, die RMT noch nicht als Scheduler nutzen

Migrieren:

- neue `.rmt` App-DSL-Dokumente
- Demo-Code mit operativer Route-/Component-Bridge
- produktive Route- oder Component-Flows
- Host-Pfade, die Scheduler Endpoint Policies brauchen

## Review-Checkliste

Vor Abschluss einer Migration pruefen:

- `manifest.metadata.routes -> routes` wurde umgesetzt
- `manifest.metadata.components -> components` wurde umgesetzt
- `manifest.metadata.schedules -> schedules` wurde umgesetzt
- `xtend.xrouter` und `xtend.component` sind Adapter-Records, nicht Kernelwissen
- `route.visible.render` und `component.idle.hydrate` sind zentrale Policies
- `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` und `createRmtStateSchedulerDiagnosticsBridge` ersetzen Demo-Brueckenlogik
- Template-only-Kompatibilitaet bleibt erhalten
- React, Vue, Vanilla JS und Custom Hosts werden nicht zur XTend-Migration gezwungen
- `node scripts/run_xtend_tests.js rmt-compatibility --json` und `node scripts/run_xtend_tests.js references --json` laufen
