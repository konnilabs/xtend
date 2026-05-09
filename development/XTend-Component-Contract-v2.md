# XTend Component Contract v2

- Status: Accepted
- Datum: 7. Mai 2026
- Typ: Component Platform Contract
- Contract: `xtend.component.contract.v2`
- Report Contract: `xtend.component.contract-report.v2`
- Workpackage: `development/WP-E10-03-Component-Contract-v2-fuer-TypeScript-RMT-und-Fabric-definieren.md`
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Bezug:
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `xtend-builder/typing/component-contract-v2.js`
  - `xtend-builder/scaffold.config.js`
  - `package.json`

## Zweck

Der Component Contract v2 ist der zentrale Plattformvertrag fuer neue und migrierte XTend-Komponenten. Er verbindet die bisherigen Einzelcontracts zu einer pruefbaren Einheit:

- TypeScript Source und lokales ESM Runtime-Artefakt
- Public API fuer Props, Attribute, Slots, Events, State, Methods und Theme
- RMT Component Metadata und Authoring-Felder
- Fabric Boundary fuer Lifecycle, Errors und Diagnostics
- Telemetry Snapshot und Backpressure-Anschluss
- Lane- und Fiber-Ingestion
- A11y Component Contract
- Performance Component Profile
- Tests, Fixtures, Docs und Maturity-Ziel

Der Vertrag ist bewusst adapter- und metadata-orientiert. XTend-Komponenten werden dadurch First-Class Citizens in RMT, ohne dass der RMT Kernel XTend Source, Custom-Element-Klassen, `xstate`, XRouter oder TypeScript-Typen importiert.

## Leitentscheidung

Jede TypeScript-first Komponente besitzt source-nah einen Contract unter:

```text
src/components/<tag>/<tag>.contract.ts
```

Dieser Contract ist die fuehrende Beschreibung der oeffentlichen Component Surface. Aus ihm duerfen spaeter Public Types, RMT Metadata, Manifest-Patch-Plan, Scaffold-Dokumentation und lokale Gates abgeleitet werden.

Bestehende JavaScript-Komponenten koennen zunaechst einen `contract-only` oder `js-legacy` Contract erhalten. Der Contract v2 erzwingt keine Big-Bang-Migration.

## TypeScript Interface

Der Zieltyp fuer neue Komponenten lautet:

```ts
export interface XtendComponentContractV2 {
  schema: 'xtend.component.contract.v2';
  status: 'contract-draft' | 'accepted' | 'deprecated';
  workpackage: string;
  tag: `x-${string}`;
  className: string;
  maturity: 'experimental' | 'preview' | 'stable' | 'core' | 'deprecated';
  source: XtendComponentSourceContractV2;
  runtime: XtendComponentRuntimeContractV2;
  publicApi: XtendComponentPublicApiContractV2;
  rmt: XtendComponentRmtContractV2;
  fabric: XtendComponentFabricBoundaryV2;
  telemetry: XtendComponentTelemetryContractV2;
  lanes: XtendComponentLaneContractV2;
  a11y: XtendComponentA11yContractV2;
  performance: XtendComponentPerformanceContractV2;
  tests: XtendComponentTestContractV2;
  docs: XtendComponentDocsContractV2;
}
```

Die Pflichtdomains sind:

| Domain | Zweck |
|--------|-------|
| `source` | TypeScript-/Migration-Quelle und source-nahe Contract-Dateien |
| `runtime` | lokales ESM-Artefakt, `.d.ts`, Loader, Manifest und CDN-Grenze |
| `publicApi` | Props, Attribute, Slots, Events, Methods, State und Theme |
| `rmt` | RMT Component Record, Adapter, Hydration, Schedule, Events und Kernel Boundary |
| `fabric` | Lifecycle Boundary, Error Boundary, Diagnostics und Reporter-Kontext |
| `telemetry` | Messpunkte, Snapshot-Felder, Status, Dauer und Backpressure |
| `lanes` | Lane-/Fiber-Hints, Precedence und Konflikt-Diagnostics |
| `a11y` | Role, Accessible Name, Fokus, Keyboard, ARIA, Screenreader, Motion und Contrast |
| `performance` | Budgetklasse, Hydration Policy, kritische Messpunkte und Cleanup |
| `tests` | Component Suite, Fixture, A11y, Performance, RMT und Reference-Gates |
| `docs` | Component Guide, API, Events, RMT Authoring, A11y und Performance |
| `maturity` | Maturity-Modell v2 und Zielstatus |

## Public API Contract

`publicApi` ist die einzige zulaessige oeffentliche Surface einer Komponente. Sie umfasst:

| Feld | Beschreibung |
|------|--------------|
| `attributes` | beobachtete oder dokumentierte Attribute inklusive Typ, Reflection und Pflichtstatus |
| `properties` | oeffentliche JS Properties inklusive Typ, Default und Write Policy |
| `slots` | benannte Slots und erlaubte Content-Klassen |
| `events` | Custom Events inklusive Detail-Typ, `bubbles`, `composed` und Payload Shape |
| `methods` | oeffentliche Methoden inklusive Signatur und Seiteneffekt |
| `state` | State Keys, Ownership und Sync-Regeln |
| `theme` | CSS Custom Properties, Tokens oder Theme-Hooks |
| `typeExports` | Namen der `.d.ts` Exporte |

Public Events muessen als Event-Name-Union und Event-Detail-Interface in `.d.ts` sichtbar sein. Implizite `any`-Payloads sind fuer `stable` und `core` nicht akzeptiert.

## RMT Domain

Die `rmt` Domain verbindet den Component Contract v2 mit dem bestehenden `xtend.rmt.component-contract.v1`.

Pflicht:

- `adapter: "xtend.component"`
- `componentRecordKind: "custom_element"`
- Felder fuer `id`, `kind`, `adapter`, `tag`, `props`, `attributes`, `slots`, `events`, `schedule`, `hydration`, `fabric`, `a11y` und `performance`
- Kernel Boundary `no-rmt-kernel-import-of-xtend-types`

RMT darf XTend-Komponenten authoren, planen und an Adapter uebergeben. Der Kernel darf keine XTend-Klassen, keine `.d.ts`, keine Component-Source und keine `xstate`-Keys importieren.

## Fabric Domain

Die `fabric` Domain ist die Runtime Boundary fuer:

- `mount`
- `hydrate`
- `render`
- `update`
- `event`
- `error`
- `unmount`

Die Boundary nutzt `@xtend-fabric` als API-Namen und muss Diagnostics mit mindestens diesen Feldern erzeugen koennen:

- `component`
- `phase`
- `fiberId`
- `lane`
- `severity`
- `cause`

`stable` Komponenten duerfen Lifecycle-, Render- und Event-Pfade nicht ohne Fabric-kompatible Boundary ausfuehren. Bestehende JavaScript-Komponenten koennen diese Pflicht zunaechst als `contract-only` markieren, muessen dann aber hoechstens `preview` bleiben.

## Telemetry Domain

Die `telemetry` Domain bindet Component Lifecycle an `xtend.fabric.telemetry-snapshot.v1`.

Pflichtfelder fuer Messpunkte:

- `componentId`
- `routeId`
- `rmtId`
- `scheduleId`
- `fiberId`
- `lane`
- `durationMs`
- `status`

Backpressure ist kein eigener Sonderkanal. Backpressure wird als Teil des Telemetry-/Fabric-Kontexts gefuehrt und spaeter von `WP-E10-06` standardisiert.

## Lane- und Fiber-Ingestion

Der Contract v2 uebernimmt die bestehende Precedence:

| Prioritaet | Quelle |
|------------|--------|
| 1 | `rmt.schedule-record` |
| 2 | `rmt.component-metadata` |
| 3 | `fabric.runtime-override` |
| 4 | `component.static-contract` |
| 5 | `scaffold.blueprint-default` |

Konflikte duerfen nicht stillschweigend ueberschrieben werden. Sie erzeugen Diagnostics und bleiben im Telemetry Snapshot sichtbar.

## A11y Domain

Die `a11y` Domain referenziert `xtend.a11y.component-contract.v1`.

Pflichtfelder:

- `role`
- `accessibleName`
- `focusStrategy`
- `keyboard`
- `ariaStates`
- `screenreader`
- `motion`
- `contrast`

Neue interaktive Komponenten ohne Keyboard- und Screenreader-Plan duerfen nicht `stable` werden.

## Performance Domain

Die `performance` Domain referenziert `xtend.performance.component-profile.v1` und die Matrix:

```text
development/XTend-Performance-Budget-Matrix.md
```

Pflichtfelder:

- `budgetClass`
- `lane`
- `hydrationPolicy`
- `criticalMeasurements`
- `cleanup`

Neue Komponenten muessen Performance-by-design dokumentieren. Das umfasst insbesondere scoped DOM Queries, Observer-/Timer-Cleanup, keine Layout-Thrashing-Schleifen und reduzierte Animationen bei `prefers-reduced-motion`.

## Beispiel

```ts
export const xSelectContract: XtendComponentContractV2 = {
  schema: 'xtend.component.contract.v2',
  status: 'accepted',
  workpackage: 'WP-E10-09',
  tag: 'x-select',
  className: 'XSelect',
  maturity: 'stable',
  source: {
    strategy: 'xtend.typescript.component-source-strategy.v1',
    state: 'ts-source',
    sourcePath: 'src/components/x-select/x-select.ts',
    contractPath: 'src/components/x-select/x-select.contract.ts'
  },
  runtime: {
    format: 'esm',
    artifact: 'components/xselect.js',
    declaration: 'components/xselect.d.ts',
    loader: 'xtend-loader.js',
    manifest: 'components/manifest.json',
    localOnly: true,
    cdnAllowed: false
  },
  publicApi: {
    attributes: ['name', 'value', 'disabled'],
    slots: ['default', 'option'],
    events: ['select-changed']
  },
  rmt: {
    schema: 'xtend.rmt.component-contract.v1',
    adapter: 'xtend.component',
    kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
  },
  fabric: {
    schema: 'xtend.component.fabric-boundary.v2',
    api: '@xtend-fabric',
    operations: ['mount', 'hydrate', 'render', 'update', 'event', 'error', 'unmount']
  },
  telemetry: {
    schema: 'xtend.fabric.telemetry-snapshot.v1',
    backpressureAware: true
  },
  lanes: {
    precedence: ['rmt.schedule-record', 'rmt.component-metadata', 'fabric.runtime-override', 'component.static-contract', 'scaffold.blueprint-default']
  },
  a11y: {
    schema: 'xtend.a11y.component-contract.v1'
  },
  performance: {
    schema: 'xtend.performance.component-profile.v1'
  }
};
```

## Builder-Anschluss

Das Builder-Modul liegt in:

```text
xtend-builder/typing/component-contract-v2.js
```

Es exportiert:

- `COMPONENT_CONTRACT_V2_SCHEMA`
- `COMPONENT_CONTRACT_REPORT_V2_SCHEMA`
- `CONTRACT_V2_REQUIRED_DOMAINS`
- `CONTRACT_V2_LIFECYCLE_OPERATIONS`
- `CONTRACT_V2_LANE_PRECEDENCE`
- `createComponentContractV2(input, options)`
- `validateComponentContractV2(contract)`

Das Modul ist generator-only und fuehrt keine Runtime-Imports, keine XTendRMT-Kernel-Imports und keine produktiven Writes aus.

## Maturity Mapping

| Maturity | Contract-v2-Anforderung |
|----------|-------------------------|
| `experimental` | Contract darf unvollstaendig sein, muss aber Status und Luecken benennen |
| `preview` | Public API, Runtime und mindestens RMT/Fabric/A11y/Performance-Stubs vorhanden |
| `stable` | alle Pflichtdomains vorhanden und lokal gatebar |
| `core` | alle `stable` Pflichten plus Compatibility, Regression, Migration und Failure-Diagnostics |
| `deprecated` | Contract bleibt als Migrations- und Deprecation-Flaeche vorhanden |

## Handoff

| Paket | Handoff |
|-------|---------|
| `WP-E10-05` | nutzt den Contract fuer Fabric/Lane Ingestion |
| `WP-E10-06` | standardisiert die Telemetry Domain |
| `WP-E10-07` | nutzt den Contract im TypeScript Blueprint |
| `WP-E10-08` | priorisiert Komponenten nach Contract-Luecken |
| `WP-E10-15` | baut daraus den dedizierten Component-Contract-v2 Gate aus |

## Akzeptanzkriterien

- `xtend.component.contract.v2` ist dokumentiert
- Public API, RMT, Fabric, Telemetry, Lanes, A11y, Performance, Tests und Docs sind Pflichtdomains
- RMT Kernel Boundary ist explizit `no-rmt-kernel-import-of-xtend-types`
- Builder-Metadaten und Package-Metadaten referenzieren den Contract
- ein lokaler `component-contract-v2` Gate prueft Factory, Validator, Metadaten und Dokumentationsanker
