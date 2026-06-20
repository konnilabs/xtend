# XTensions React HostController PoC and Scheduling Hints Contract

- Status: `accepted-by-XTN-06`
- Datum: 2026-06-20
- Workpackage: `XTN-06`
- PoC Schema: `xtend.xtensions.react-host-controller-poc.v1`
- Contract Schema: `xtend.xtensions.react-host-controller-contract.v1`
- Scheduling Decision Schema: `xtend.xtensions.react-scheduling-decision.v1`
- Render Record Schema: `xtend.xtensions.react-render-record.v1`
- Boundary Record Schema: `xtend.xtensions.react-boundary-record.v1`
- Report Schema: `xtend.xtensions.react-host-controller-report.v1`
- Module: `tools/xtensions/react-host-controller-poc.js`
- Types: `tools/xtensions/react-host-controller-poc.d.ts`
- Fixture: `tests/fixtures/xtensions/react-host-controller-poc-valid.json`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-react-host-controller-poc --json`
- Boundary: `react-peer-runtime-is-external-opt-in`
- Boundary: `no-react-imports-in-xtend-core`
- Boundary: `startTransition-is-scheduling-hint-not-kernel-priority`
- Boundary: `react-context-store-stays-inside-host`
- Boundary: `mount-update-unmount-observable-through-hostcontroller`
- Boundary: `error-and-suspense-boundaries-emit-diagnostics`

## Zweck

XTN-06 validiert React als deklarative HostController-Klasse, ohne React in den RMT-Kernel, XTend-Core oder lokale XTensions-Gates zu ziehen.

Der PoC ist frameworkless. Er simuliert eine React-Root-Lifecycle-Schicht als Contract Stub und erzeugt beobachtbare Records fuer Mount, Update, Unmount, Scheduling Hints, Error Boundary und Suspense Boundary. Ein echter React-Harness bleibt extern, opt-in und peer-basiert.

## React Peer Boundary

React und React DOM duerfen in XTN-06 nur als Daten in Runtime-Adapter-Records erscheinen:

- Dependency-Klasse: `external-peer`
- Harness: `external-opt-in`
- keine Root-/Dev-/Optional-/Peer-Dependency in `package.json`
- keine vendored React-Bundles im Repo oder NPM-Paket
- keine lokalen Tests mit Netzwerk- oder Installationspflicht

Das lokale Modul importiert kein `react`, kein `react-dom` und keinen React-Typ.

## HostController Semantik

Der PoC stellt einen `frameworkless-react-root-stub` bereit. Er besitzt:

- einen host-owned Container
- einen internen React-Kontext-Snapshot als private Stub-Daten
- Lifecycle-Methoden `mount`, `update`, `suspend`, `resume`, `reportError`, `unmount`
- Cleanup fuer Root, Listener, Timer, Suspense Boundary und Error Boundary
- Render Records fuer jeden Mount/Update
- Boundary Records fuer Error und Suspense

Die Records folgen weiterhin dem XTN-01 HostController-Contract.

## Scheduling Hints

React `startTransition` ist in XTensions nie harte Kernel-Prioritaetskontrolle. Der PoC erzeugt nur Scheduling-Entscheidungen:

| Hint | Bedeutung |
|------|-----------|
| `sync-render-hint` | interaktive oder user-blocking Lane sollte spaeter sync rendern duerfen |
| `startTransition-hint` | default/transition Lane ist fuer externen React-Harness transition-faehig |
| `idle-defer-hint` | idle/background/kleines Budget sollte spaeter deferbar sein |
| `suspense-placeholder-hint` | Suspense-Zustand sollte Fallback rendern |

Jede Entscheidung enthaelt:

- `lane`
- `priorityHint`
- `budgetMs`
- `renderMode`
- `startTransitionEligible`
- `syncRenderEligible`
- `hardKernelPriorityControl: false`
- `schedulerAuthority: "fabric-lane-budget-hint"`

Der RMT-Kernel bleibt Owner von Lane-, Fiber- und Budget-Records.

## React Context und Store Boundary

React Context, Stores, Provider Values oder interne Fiber-/Owner-Felder duerfen die XTension-Grenze nicht verlassen.

Der PoC diagnostiziert Payloads mit:

- `reactContext`
- `$reactContext`
- `ReactContext`
- `providerValue`
- `reduxStore`
- `zustandStore`
- `reactStore`
- `_owner`
- `$$typeof`
- nicht serialisierbaren Werten wie Funktionen, Symbols, BigInts oder Zyklen

Downstream-Signale muessen serialisierbare Records bleiben.

## Runtime Registry Integration

XTN-06 erzeugt einen XTN-05-kompatiblen Runtime Adapter Record:

- `framework: "react"`
- `react` und `react-dom` als `external-peer`
- host-lokale Loading Policy
- Integrity-Fakten als Daten
- native Fallback Surface
- `react.scheduling.hints` als Host-Capability

Die lokale Policy-Entscheidung kann `loaded`, `degraded`, `skipped`, `failed` oder `policy-blocked` reporten, ohne React auszufuehren.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.react_poc.framework_dependency` | React wurde als echte Dependency oder Import erkannt |
| `xtensions.react_poc.context_leak` | React Context oder Provider Value wurde uebergeben |
| `xtensions.react_poc.store_leak` | React-/Redux-/Zustand-Store wurde uebergeben |
| `xtensions.react_poc.non_serializable_payload` | Payload ist nicht serialisierbar |
| `xtensions.react_poc.error_boundary` | Error Boundary hat einen Fehler erfasst |
| `xtensions.react_poc.suspense_boundary` | Suspense Boundary hat Fallback-Degradation erfasst |
| `xtensions.react_poc.not_mounted` | Lifecycle-Operation wurde vor Mount ausgefuehrt |
| `xtensions.react_poc.already_destroyed` | Lifecycle-Operation wurde nach Destroy ausgefuehrt |

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js xtensions-react-host-controller-poc --json
```

Der Gate prueft Contract, Typen, Fixture, Package-Export, Runner-Integration, Dependency-Boundary, Runtime-Registry-Integration, Scheduling-Hints, Context-/Store-Leak-Guards, Error-/Suspense-Records, Cleanup und stabile Report-Serialisierung.
