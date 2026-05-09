# WP-E05-09 - Route Registry und Component Registry vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md`
  - `development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md`
  - `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-09` bereitet die Runtime-Registries vor, auf denen der produktive XRouter Adapter aus `WP-10` und der XTend Component Adapter aus `WP-11` aufbauen koennen.

Die Registries sind keine Adapter-Ausfuehrung. Sie indexieren normalisierte `routes` und `components`, machen Lookup-Pfade stabil und geben Lifecycle-Absichten an Adapter weiter. Damit wird die in `WP-08` geschaffene Normalform zur konsumierbaren Runtime-Oberflaeche, ohne dass der RMT Kernel XTend, XRouter, DOM oder `xstate` importiert.

## Registry Contract

Der Contract traegt die stabile ID:

```text
xtend.rmt.runtime-registry.v1
```

Eingabe ist die Normalform aus:

```text
xtend.rmt.dsl-normalization.v1
```

Die Runtime-Registry erzeugt daraus:

- `routeRegistry`
- `componentRegistry`
- `routes`
- `components`
- `diagnostics`
- `sourceDiagnostics`
- `lifecycleEvents`

## Route Registry

Die Route Registry indexiert normalisierte `RmtRouteDomainRecord` Records fuer Router Adapter.

Stabile Indizes:

- `routeRegistry.byId`
- `routeRegistry.byPath`
- `routeRegistry.byRouter`
- `routeRegistry.byComponent`

Ein `RmtRouteRegistryEntry` enthaelt:

- `id`
- `path`
- `routerId`
- `componentId`
- `templateRef`
- `redirect`
- `scheduleRef`
- `targetKind`
- `lifecycleEvents`
- `record`

Router Adapter koennen damit Routen nach Adapter-ID, Pfad oder Route-ID konsumieren. Der Kernel navigiert nicht selbst.

## Component Registry

Die Component Registry indexiert normalisierte `RmtComponentDomainRecord` Records fuer Component Adapter.

Stabile Indizes:

- `componentRegistry.byId`
- `componentRegistry.byTag`
- `componentRegistry.byAdapter`

Ein `RmtComponentRegistryEntry` enthaelt:

- `id`
- `kind`
- `adapterId`
- `tag`
- `scheduleRef`
- `lifecycleEvents`
- `record`

Component Adapter koennen damit XTend Custom Elements, generische Web Components oder spaetere Host Components ueber denselben Registry-Contract konsumieren.

## Lifecycle Events

Die erste Registry-Flaeche nennt host-neutrale Lifecycle-Absichten:

- `create`
- `mount`
- `hydrate`
- `update`
- `dispose`

Diese Events sind noch keine DOM- oder Router-Aktionen. Sie sind die gemeinsame Sprache, mit der Adapter in `WP-10` und `WP-11` Scheduler Policies, Route-Wechsel und Component Hydration anbinden koennen.

## Runtime Diagnostics

Die Registry fuehrt eigene Diagnostic Codes ein:

- `rmt.runtime.registry.missing_route`
- `rmt.runtime.registry.missing_component`
- `rmt.runtime.registry.duplicate_route`
- `rmt.runtime.registry.duplicate_component`

Fehlende Route-/Component-Anforderungen koennen ueber `createRuntimeRegistries(document, { requiredRoutes, requiredComponents })` sichtbar gemacht werden. Duplikate werden beim Aufbau der Indizes diagnostiziert. DSL-Diagnostics aus `WP-08` bleiben getrennt als `sourceDiagnostics` erhalten.

## Artefakt-Surfaces

Die Build-Artefaktversionen wurden additiv synchronisiert:

- `createRmtFormat().createRuntimeRegistries`
- `createRmtFormat().listRuntimeRegistryDiagnosticCodes`
- `RmtRuntimeRegistrySnapshot`
- `RmtRouteRegistryEntry`
- `RmtComponentRegistryEntry`

Die Registry-Snapshots sind bewusst serialisierbare Datenstrukturen mit stabilen Indizes. Adapter duerfen sie lesen, aber Ausfuehrung bleibt adapterseitig.

## Kernel Boundary

Der RMT Kernel darf:

- normalisierte Routes und Components indexieren
- Runtime-Registry-Snapshots erzeugen
- Lifecycle-Absichten als Daten sichtbar machen
- fehlende oder doppelte Registry-Records diagnostizieren
- Schedule-Refs an Entries weiterreichen

Der RMT Kernel darf nicht:

- XRouter importieren oder navigieren
- XTend Components mounten oder hydrieren
- DOM-Knoten erzeugen
- `xstate` schreiben
- aus `xtend.xrouter` oder `xtend.component` Pflicht-Runtimes ableiten

## Handoff an Folgepakete

- `WP-10` kann den produktiven XRouter Adapter gegen `routeRegistry.byRouter`, `routeRegistry.byPath` und `RmtRouteRegistryEntry` implementieren.
- `WP-11` kann den produktiven XTend Component Adapter gegen `componentRegistry.byAdapter`, `componentRegistry.byTag` und `RmtComponentRegistryEntry` implementieren.
- `WP-12` kann State-, Scheduler- und Diagnostics-Bridges auf `scheduleRef`, `lifecycleEvents`, `diagnostics` und `sourceDiagnostics` aufsetzen.
- `WP-14` kann die Bestcase-Demo auf native Domains migrieren, ohne Demo-eigene Registry-Logik weiterzufuehren.

## Verifikation

Mindestgates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite prueft die Registry-Flaeche ueber die Build-Artefaktversion in `xtendrmt/rmt-core.esm.js`.

## Ergebnis

`WP-09` ist abgeschlossen. RMT kann normalisierte Routes und Components als Runtime-Registry bereitstellen, ohne Adapter auszufuehren. Damit sind `WP-10` und `WP-11` unblockiert.
