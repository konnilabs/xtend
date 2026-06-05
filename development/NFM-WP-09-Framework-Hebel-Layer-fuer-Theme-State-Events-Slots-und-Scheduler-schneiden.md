# NFM-WP-09 - Framework-Hebel-Layer fuer Theme, State, Events, Slots und Scheduler schneiden

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.framework-leverage-layer.v1`
- Matrix: `xtend.native-first.framework-leverage-layer-matrix.v1`
- Report Contract: `xtend.native-first.framework-leverage-layer-report.v1`
- Capability Package: `NFM-OP-05`
- Capability Scope: `NFM-CAP-02`, `NFM-CAP-03`, `NFM-CAP-05`, `NFM-CAP-13`
- Local Gate: `node scripts/run_xtend_tests.js native-first-framework-leverage --json`

## Ziel

WP-09 macht XTend als eigenes Framework steuerbarer, ohne den RMT-Kernel mit Host-, Component- oder Framework-Details zu koppeln. Theme, State, Events, Slots und Scheduler werden als wiederverwendbare Contracts, RMT-Records, Fabric-Lanes und Component-Hebel geschnitten.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Native-First-Framework-Leverage-Layer-Contract.md` | Contract fuer den Framework-Hebel-Layer |
| `development/XTend-Native-First-Framework-Leverage-Layer-Matrix.md` | Matrix fuer Theme, State, Events, Slots, Scheduler und Diagnostics |
| `tests/native-first/native_first_framework_leverage_suite.js` | lokaler WP-09 Gate |
| `scripts/run_xtend_tests.js` | registriert `native-first-framework-leverage` |
| `package.json` | exposes `test:native-first-framework-leverage` und Native-First Metadata |

## Native-First Entscheidungen

| Surface | Entscheidung | Begruendung |
|---------|--------------|-------------|
| Theme Tokens, CSS Parts, Density und forced-colors | `owned-framework-leverage-ready` | `x-theme`, Design Tokens und Alias Layer ersetzen fremde Design-System-Runtime |
| State Selectors und Theme State | `owned-framework-leverage-ready-with-residual` | RMT State Selector Runtime bleibt host-neutral; `xstate` wird nur injiziert und bleibt Catalog-Residual |
| Events und Commands | `owned-framework-leverage-ready` | Component Network und RMT Event Routing liefern deklarative Bindings ohne globalen Event-Bus |
| Slots und Component Composition | `owned-framework-leverage-ready` | RMT Shell Authoring und vNext Composition bilden Slots als Records ab |
| Scheduler und Fabric Lanes | `owned-framework-leverage-ready` | Lanes bleiben Contract Records mit Diagnostics statt impliziter Runtime-Magie |
| Resource Lifecycles | `contract-handoff-ready` | Owner-, Cleanup- und Effect-Records existieren, vollstaendige UI-Familie bleibt WP14/WP16 |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Framework-Hebel-Contract existiert | `done` |
| Matrix benennt Theme, State, Events, Slots, Scheduler und Diagnostics | `done` |
| `NFM-CAP-02`, `NFM-CAP-03`, `NFM-CAP-05`, `NFM-CAP-13` sind angebunden | `done` |
| `NFM-CAP-13` ist schneidbar, ohne `xstate` in den RMT-Kernel zu importieren | `done` |
| Event-Routing bleibt ohne globalen Event-Bus | `done` |
| Scheduler-Lanes bleiben RMT/Fabric-Records | `done` |
| Keine neue Runtime-Dependency | `done` |
| Lokaler WP-09 Gate ist registriert | `done` |

## Verifikation

Auszufuehrende lokale Gates:

```bash
node scripts/run_xtend_tests.js native-first-framework-leverage --json
node scripts/run_xtend_tests.js design-tokens --json
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js component-network-contract --json
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js feedback-status-ux --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ergebnis am 3. Juni 2026:

- `native-first-framework-leverage`: `passed`, 166 Checks, 0 Failures, 0 Warnings
- Source-Gate-Bundle: `passed`, 14 Suiten, 0 Failures, 0 Warnings
- `design-tokens`: `passed`, 354 Checks
- `xtheme-token-alias-layer`: `passed`, 143 Checks
- `component-shell-theme-matrix`: `passed`, 263 Checks
- `component-network-contract`: `passed`, 98 Checks
- `rmt-shell-authoring-ux`: `passed`, 172 Checks
- `feedback-status-ux`: `passed`, 280 Checks
- `rmt-state-selector-runtime`: `passed`, 175 Checks
- `rmt-event-routing-runtime`: `passed`, 221 Checks
- `fabric-lane-mapping`: `passed`, 171 Checks
- `rmt-vnext-scheduler`: `passed`, 68 Checks
- `rmt-vnext-composition`: `passed`, 76 Checks
- `rmt-vnext-events`: `passed`, 90 Checks
- `references`: `passed`, 2127 Checks
- `supply-chain`: `passed`, 67 Checks

## Handoff

- `NFM-WP-10` hat Market-Pattern-Parity gegen den geschnittenen Framework-Hebel-Layer abgeleitet.
- `NFM-WP-11` kann Contract Registry und Discoverability um den Framework-Leverage-Contract erweitern.
- `NFM-WP-14` muss RMT Maximality fuer State, Events, Slots, Scheduler und Resource Lifecycles quantifizieren.
- `NFM-WP-19` kann Budget-, Complexity- und Performance-Gates auf die Layer-Domains anwenden.
