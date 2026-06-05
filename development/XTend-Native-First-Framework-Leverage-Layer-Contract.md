# XTend Native-First Framework Leverage Layer Contract

- Status: `accepted by NFM-WP-09`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-09-Framework-Hebel-Layer-fuer-Theme-State-Events-Slots-und-Scheduler-schneiden.md`
- Contract: `xtend.native-first.framework-leverage-layer.v1`
- Matrix: `xtend.native-first.framework-leverage-layer-matrix.v1`
- Report Contract: `xtend.native-first.framework-leverage-layer-report.v1`
- Capability Package: `NFM-OP-05`
- Capability Scope: `NFM-CAP-02`, `NFM-CAP-03`, `NFM-CAP-05`, `NFM-CAP-13`
- Boundary: `framework-leverage-through-owned-contracts`
- Boundary: `no-external-ui-framework-runtime`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `state-host-adapter-injected-not-kernel-imported`
- Boundary: `rmt-kernel-remains-host-neutral`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `scheduler-lanes-are-contract-records`
- Local Gate: `node scripts/run_xtend_tests.js native-first-framework-leverage --json`

## Zweck

WP-09 schneidet die vorhandenen XTend-Hebel fuer Theme, State, Events, Slots, Resource Lifecycles und Scheduler als eigenes Muster fuer marktuebliche Framework-Patterns ueber Contracts, RMT-Records, Fabric-Lanes und Komponenten. Das Paket fuehrt kein externes UI-Framework und keine neue Runtime-Dependency ein.

Der Layer ist kein neues Runtime-Monolith. Er ist ein Contract-Buendel, das vorhandene Bausteine als wiederverwendbare Produktgrenzen zusammenzieht.

## Layer-Domains

| Domain | Fuehrender Hebel | Produktgrenze |
|--------|------------------|---------------|
| Theme, Tokens, Density und CSS Parts | `x-theme`, Design Tokens, XTheme Alias Layer, Component Shell Theme Matrix | eigene Token- und Theme-Flaeche statt fremder Design-System-Runtime |
| State Selectors und Theme State | `xstate`, RMT State Selector Runtime, injected host adapter | State ist authorbar, aber der RMT-Kernel importiert `xstate` nicht |
| Events, Commands und Feedback | Component Network Contract, RMT Event Routing Runtime, Feedback Status UX | kein globaler Event-Bus, DOM Events werden deklarativ an Commands gebunden |
| Slots und Composition | RMT Shell Authoring, vNext Composition/Slot Records | Slots sind RMT-/Adapter-Records, kein Template-Framework-Import |
| Scheduler und Lanes | Fabric RMT Lane Mapping, RMT vNext Scheduler | Scheduler-Entscheidungen bleiben Contract Records mit Diagnostics |
| Diagnostics und Runtime Evidence | Component UX Performance, Fabric telemetry, `diagnostics.snapshot` | Framework-Hebel bleiben messbar und releasefaehig |

## Native-First Entscheidungen

| Radar Ref | Primitive / Surface | Entscheidung fuer WP-09 | Produktfolge |
|-----------|---------------------|--------------------------|--------------|
| `NFM-BPR-012` | `requestAnimationFrame`, `requestIdleCallback`, `queueMicrotask`, scheduler-style APIs | `wrap-as-xtend-primitive` | Scheduler-Lanes bleiben XTend/Fabric/RMT-Records; native Scheduling bleibt Adapter- und Budget-Evidence |
| `NFM-BPR-013` | `IntersectionObserver`, `ResizeObserver`, `MutationObserver` | `wrap-as-xtend-primitive` | Visibility, layout und diagnostics hooks bleiben component-/fabric-gatebar |
| `NFM-BPR-014` | Performance APIs und User Timing | `wrap-as-xtend-primitive` | Performance-/Telemetry-Hebel bleiben contract- und reportfaehig |
| `NFM-BPR-020` | forced-colors, prefers-reduced-motion und focus-visible | `adopt-native` | Theme, density, motion und focus bleiben native CSS-/A11y-backed |

## Source-Gates

| Gate | Rolle |
|------|------|
| `node scripts/run_xtend_tests.js native-first-framework-leverage --json` | WP-09 Contract-, Matrix-, Roadmap- und Metadata-Gate |
| `node scripts/run_xtend_tests.js design-tokens --json` | Theme Token Product Surface |
| `node scripts/run_xtend_tests.js xtheme-token-alias-layer --json` | XTheme Alias und Compatibility Layer |
| `node scripts/run_xtend_tests.js component-shell-theme-matrix --json` | Theme/Density/Motion Shell Matrix |
| `node scripts/run_xtend_tests.js component-network-contract --json` | Events, Commands, Contexts, Theme und State Network |
| `node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json` | Shell, Slots, Events, Commands und Schedules als RMT Records |
| `node scripts/run_xtend_tests.js feedback-status-ux --json` | Feedback, Status, Live Region und Event-Hebel |
| `node scripts/run_xtend_tests.js rmt-state-selector-runtime --json` | host-neutraler State Selector Runtime-Hebel |
| `node scripts/run_xtend_tests.js rmt-event-routing-runtime --json` | declarative Event Routing ohne Produkt-Event-Framework |
| `node scripts/run_xtend_tests.js fabric-lane-mapping --json` | Fabric/RMT Lane Mapping |
| `node scripts/run_xtend_tests.js rmt-vnext-scheduler --json` | RMT Scheduler Policy Records |
| `node scripts/run_xtend_tests.js rmt-vnext-composition --json` | vNext Slot- und Component-Composition Records |
| `node scripts/run_xtend_tests.js rmt-vnext-events --json` | vNext Event/Action/DataSource Records |
| `node scripts/run_xtend_tests.js references --json` | Referenzpfade |
| `node scripts/run_xtend_tests.js supply-chain --json` | Dependency- und Supply-Chain-Boundary |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Framework-Hebel sind als Contract-Layer beschrieben | erfuellt |
| Theme, State, Events, Slots und Scheduler sind auf vorhandene Gates gemappt | erfuellt |
| `NFM-CAP-13` ist nicht mehr unscharf `needs-hardening`, sondern mit Residuals schneidbar | erfuellt |
| `xstate` bleibt Host-Adapter und wird nicht in den RMT-Kernel importiert | erfuellt |
| Event-Routing nutzt keinen globalen Event-Bus und kein Produkt-Event-Framework | erfuellt |
| Scheduler-Lanes bleiben RMT/Fabric-Records mit Diagnostics | erfuellt |
| Keine neue Runtime-Dependency entsteht | erfuellt |
| Lokaler WP-09-Gate ist definiert | erfuellt |
