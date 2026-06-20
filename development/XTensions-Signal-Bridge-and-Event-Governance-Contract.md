# XTensions Signal Bridge and Event Governance Contract

- Status: `accepted-by-XTN-02`
- Datum: 2026-06-20
- Workpackage: `XTN-02`
- Contract: `xtend.xtensions.signal-bridge.v1`
- Kernel Signal Schema: `xtend.xtensions.kernel-signal.v1`
- Surface Event Schema: `xtend.xtensions.surface-event.v1`
- Governance Matrix Schema: `xtend.xtensions.event-governance-matrix.v1`
- Dead Letter Schema: `xtend.xtensions.signal-bridge-dead-letter.v1`
- Diagnostic Schema: `xtend.xtensions.signal-bridge-diagnostic.v1`
- Report Schema: `xtend.xtensions.signal-bridge-report.v1`
- Module: `tools/xtensions/signal-bridge-contract.js`
- Types: `tools/xtensions/signal-bridge-contract.d.ts`
- Fixture: `tests/fixtures/xtensions/signal-bridge-valid.json`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-signal-bridge --json`
- Depends on: `xtend.xtensions.host-controller.v1`
- Depends on: `xtend.rmt.vnext-scheduler-policy.v1`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-implicit-global-framework-event-bus`
- Boundary: `no-shared-framework-state-across-xtension-boundaries`
- Boundary: `events-are-owner-and-payload-schema-bound`
- Boundary: `fabric-can-report-without-framework-runtime`

## Zweck

Dieser Contract definiert die bidirektionale XTensions-Bruecke zwischen RMT/Fabric und HostController-basierten Framework-Runtimes. Die Bruecke ist kein Event Bus und fuehrt keine Framework-Events aus. Sie normalisiert nur serialisierbare Records, die durch Fabric, Lanes, Fibers, Signals und Reactivity orchestriert, diagnostiziert und budgetiert werden koennen.

## Record-Richtungen

| Richtung | Record | Zweck |
|----------|--------|-------|
| `downstream` | `KernelSignal` | RMT/Fabric sendet ein typisiertes Signal an einen HostController |
| `upstream` | `SurfaceEvent` | HostController meldet ein typisiertes Surface Event an Fabric |

## KernelSignal

Ein `KernelSignal` muss diese Felder besitzen:

- `target.hostId`
- `target.surfaceId`
- `target.xtensionId`
- `type`
- `lane`
- `priorityHint`
- `schemaRef`
- `payload`
- `policy`

`lane` wird gegen die kanonischen RMT-vNext Scheduler-Lanes normalisiert: `user-blocking`, `visible`, `transition`, `idle`, `background`, `diagnostics`. Alias-Namen wie `critical` duerfen nur als Eingabe dienen und werden auf kanonische Lane-Namen reduziert.

## SurfaceEvent

Ein `SurfaceEvent` muss diese Felder besitzen:

- `event`
- `owner`
- `direction: "upstream"`
- `payloadSchema`
- `lane`
- `trustBoundary`
- `timestamp`
- `policy`

Wildcard-, Global- oder Bus-artige Eventnamen sind verboten. Dazu gehoeren `*`, `global`, `event.bus`, `window.*`, `document.*` und Namen mit `*`.

## Delivery, Backpressure und Dead Letter

Jeder Bridge-Record braucht eine Policy:

| Feld | Regel |
|------|-------|
| `deliveryMode` | `sync`, `queued`, `replayable` oder `drop-if-stale` |
| `ttlMs` | positiv |
| `correlationId` | `required` |
| `idempotencyKey` | `required` |
| `backpressure` | `none`, `coalesce-by-target`, `coalesce-by-event`, `coalesce-by-route`, `sample`, `drop-stale` oder `dead-letter` |
| `coalescePolicy` | `none`, `target`, `event`, `route` oder `payload-schema` |
| `deadLetter` | `required` |
| `rateLimit` | wenn gesetzt, muessen `windowMs` und `maxEvents` positiv sein |

Policy-Verletzungen erzeugen strukturierte Diagnostics und Dead-Letter-Records. Dadurch kann Fabric Verletzungen melden, ohne ein Ziel-Framework zu importieren oder ein Event zuzustellen.

## Trust Boundaries

Gueltige Trust Boundaries:

- `same-origin-adapter`
- `sandboxed-adapter`
- `remote-surface-adapter`
- `trusted-native-host`

Ein Framework-Host darf keine eigene globale Trust Boundary definieren. Die Host- und Surface-Policy bleibt die Quelle der Wahrheit.

## Governance Matrix

XTN-02 liefert eine Datenmatrix fuer die geplanten Framework-Klassen. Sie ist kein Adapter-Code und keine Dependency:

| Framework | Runtime-Klasse | Default Lane | Backpressure | Pflichtkontrollen |
|-----------|----------------|--------------|--------------|-------------------|
| `react` | `declarative-vdom` | `transition` | `coalesce-by-target` | Owner, Payload Schema, Lane, Correlation, Idempotency |
| `vue` | `declarative-reactive` | `visible` | `coalesce-by-target` | Owner, Payload Schema, Lane, expliziter Update-Adapter |
| `leaflet` | `imperative-map` | `visible` | `coalesce-by-target` | Owner, Payload Schema, Lane, Rate Limit, Dead Letter |
| `chart.js` | `imperative-chart` | `transition` | `coalesce-by-event` | Owner, Payload Schema, Lane, Coalesce Key |
| `three` | `render-loop-3d` | `background` | `sample` | Owner, Payload Schema, Lane, Frame Budget, Visibility, Cancellation |

Die Matrix beschreibt, wie externe Frameworks spaeter durch native XTend-Technologien orchestriert werden koennen. Sie importiert und vendort keines dieser Frameworks.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.signal_bridge.target_missing` | `KernelSignal` hat kein vollstaendiges Ziel |
| `xtensions.signal_bridge.signal_type_missing` | `KernelSignal` hat keinen Signaltyp |
| `xtensions.signal_bridge.owner_missing` | `SurfaceEvent` hat keinen Owner |
| `xtensions.signal_bridge.direction_invalid` | Richtung ist nicht zulaessig |
| `xtensions.signal_bridge.payload_schema_missing` | Payload-Schema fehlt |
| `xtensions.signal_bridge.lane_unknown` | Lane ist keine kanonische Fabric/RMT-Lane |
| `xtensions.signal_bridge.wildcard_event_forbidden` | Eventname nutzt Wildcard oder globalen Bus |
| `xtensions.signal_bridge.trust_boundary_invalid` | Trust Boundary ist nicht erlaubt |
| `xtensions.signal_bridge.delivery_policy_missing` | Delivery Policy ist unvollstaendig |
| `xtensions.signal_bridge.rate_limit_invalid` | Rate Limit ist ungueltig |
| `xtensions.signal_bridge.backpressure_invalid` | Backpressure oder Coalesce Policy ist ungueltig |
| `xtensions.signal_bridge.dead_letter_required` | Dead Letter ist nicht verpflichtend |
| `xtensions.signal_bridge.framework_dependency` | Eine Framework-Dependency oder ein echter Import wurde gefunden |

## Dependency Policy

XTN-02 bleibt frameworkless. Die Root-Manifeste duerfen keine React-, Vue-, Three.js-, Leaflet- oder Chart.js-Abhaengigkeiten erhalten. Die Test-Fixture darf Frameworknamen als Matrixdaten enthalten, aber keine echten `import`, `require` oder dynamic-import Statements auf Framework-Pakete.

## Source of Truth

- Contract Factory: `createXTensionsSignalBridgeContract()`
- Record Factories: `createKernelSignal()`, `createSurfaceEvent()`
- Report Factory: `createSignalBridgeReport()`
- Governance Matrix: `normalizeGovernanceMatrix()`
- Dependency Guard: `assertSignalBridgeDependencyBoundary()`
- Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
- HostController Contract: `development/XTensions-HostController-Lifecycle-Contract.md`

## Verification

Auszufuehren nach Aenderungen:

```bash
node scripts/run_xtend_tests.js xtensions-signal-bridge --json
node scripts/run_xtend_tests.js xtensions-host-controller --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```
