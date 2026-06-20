# XTensions HostController Lifecycle Contract

- Status: `accepted-by-XTN-01`
- Datum: 2026-06-20
- Workpackage: `XTN-01`
- Contract: `xtend.xtensions.host-controller.v1`
- Result Schema: `xtend.xtensions.host-controller-result.v1`
- Lifecycle Record Schema: `xtend.xtensions.host-controller-lifecycle-record.v1`
- Report Schema: `xtend.xtensions.host-controller-report.v1`
- Module: `tools/xtensions/host-controller-contract.js`
- Types: `tools/xtensions/host-controller-contract.d.ts`
- Fixture: `tests/fixtures/xtensions/host-controller-dummy.json`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-host-controller --json`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-framework-test-fixture-dependencies-in-xtend-package`
- Boundary: `no-vendored-third-party-frameworks-in-repo-or-npm-package`
- Boundary: `framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses`

## Zweck

Dieser Contract definiert die erste XTensions-Runtime-Grenze. Ein `HostController` kapselt eine externe oder framework-aehnliche Runtime hinter einem nativen XTend-Vertrag. RMT-Kernel, Fabric, Lanes, Fibers, Signals und Reactivity orchestrieren nur serialisierbare Lifecycle-, Signal-, Cleanup- und Diagnostic-Records. Framework-spezifische Typen, Scheduler oder DOM-Details bleiben ausserhalb des Kernels.

## Nicht-Ziele

- Keine React-, Vue-, Three.js-, Leaflet-, Chart.js- oder sonstige Framework-Dependency im XTend-Root-Paket.
- Keine vendored Framework-Bundles fuer lokale Contract-Tests.
- Keine Framework-Sonderlogik im RMT-Kernel, Parser, Compiler oder Surface Registry.
- Keine Netzwerk-, CDN- oder Package-Install-Pflicht fuer XTN-01.

## HostController Shape

Ein HostController muss folgende Methoden anbieten:

| Methode | Zweck | Ergebnis |
|---------|-------|----------|
| `mount(container, props, options)` | bindet die Runtime an ein Host-owned Container-Element | `surface:ready` |
| `update(signal)` | uebernimmt ein serialisierbares Downstream-Signal | `surface:updated` |
| `suspend(reason)` | haelt Runtime-Arbeit budgetierbar an | `surface:suspended` |
| `resume(reason)` | setzt Runtime-Arbeit fort | `surface:resumed` |
| `reportError(error, metadata)` | normalisiert Host-/Runtime-Fehler | `surface:error` |
| `unmount(reason)` | loest Runtime, Ressourcen und Container-Besitz | `surface:destroyed` |

Alle Methoden liefern `xtend.xtensions.host-controller-result.v1` mit `status`, `ok`, `hostId`, `surfaceId`, optionalem `lifecycleRecord`, `cleanupRecords`, `diagnostics` und `metadata`.

## Lifecycle Matrix

| Operation | Accepted Signal | Emitted Event | Phase | Terminal |
|-----------|-----------------|---------------|-------|----------|
| `mount` | `surface:mount` | `surface:ready` | `ready` | `false` |
| `update` | `surface:update` | `surface:updated` | `active` | `false` |
| `suspend` | `surface:suspend` | `surface:suspended` | `suspended` | `false` |
| `resume` | `surface:resume` | `surface:resumed` | `active` | `false` |
| `reportError` | `surface:error` | `surface:error` | `degraded` | `false` |
| `unmount` | `surface:unmount` | `surface:destroyed` | `destroyed` | `true` |

Zulaessige Result-Statuswerte sind `ok`, `skipped`, `degraded`, `failed` und `policy-blocked`. `unmount` ist idempotent: ein zweiter Aufruf darf keine weiteren Ressourcen freigeben und muss diagnostizierbar bleiben.

## Container Ownership

XTensions nutzen ein explizites Host-owned Container-Element. Der HostController besitzt nur den Bereich innerhalb dieses Containers oder eines policy-gesteuerten Shadow Roots. Style Boundary, Focus Boundary und DOM Mutation Boundary bleiben Host-Policy, nicht Framework-Policy.

Default Ownership:

- `mode`: `host-owned-container`
- `shadowDom`: `policy-driven`
- `styleBoundary`: `host-owned`
- `focusBoundary`: `host-owned`
- `domMutationBoundary`: `adapter-owned-inside-host-container`

## Cleanup Pflichten

Ein HostController muss beim ersten erfolgreichen `unmount` mindestens diese Ressourcenklassen pruefen und freigeben:

- `framework-root`
- `event-listeners`
- `timers`
- `observers`
- `animation-frames`
- `workers`

Cleanup wird als `xtend.xtensions.host-controller-cleanup-record.v1` serialisiert. Echte Framework-Hosts duerfen weitere Ressourcen melden, aber keine stillen globalen Handles behalten.

## Dependency Policy

XTN-01 ist ein Contract- und Gate-Artefakt. Testkomponenten fuer React-, Vue-, Three.js-, Leaflet- oder Chart-aehnliche Lifecycles werden als `frameworkless-contract-stub` oder als spaeterer, externer `external-opt-in-peer-harness` modelliert.

Die Root-Manifeste duerfen fuer XTN-01 keine dieser Framework-Pakete in `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`, `bundledDependencies` oder `bundleDependencies` deklarieren. Der lokale Gate prueft ausserdem, dass Contract-Modul und Fixture keine echten `import`, `require` oder dynamic-import Statements auf diese Framework-Pakete enthalten.

## Fabric Observability

Lifecycle-Records muessen Fabric-kompatibel bleiben:

- serialisierbarer Payload
- stabile `hostId` und `surfaceId`
- monotone `sequence`
- `lane` als Budget-/Orchestrierungs-Hinweis
- `diagnostics` als strukturierte Records
- `terminal` fuer zerstoerende Operationen

Fabric, Lanes, Fibers, Signals und Reactivity koennen diese Records orchestrieren, ohne die externe Runtime zu kennen.

## Source of Truth

- Contract Factory: `createXTensionHostControllerContract()`
- Dummy Host: `createFrameworklessHostControllerStub()`
- Dependency Guard: `assertNoFrameworkDependencies()`
- Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
- Architecture Baseline: `development/XTensions-Architecture-and-Threat-Model-Contract.md`

## Verification

Auszufuehren nach Aenderungen:

```bash
node scripts/run_xtend_tests.js xtensions-host-controller --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```
