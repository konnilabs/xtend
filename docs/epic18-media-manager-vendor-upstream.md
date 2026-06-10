# Epic 18 RMT App Platform und Media Manager Vendor Upstream

- Status: `completed`
- Contract: `xtend.epic18.rmt-app-platform-media-manager-vendor-upstream.v1`
- Release Handoff Contract: `xtend.epic18.rmt-app-platform-release-handoff.v1`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Epic 18 trennt RMT App Platform Authoring, generische Component Interaction, State Selector, Event Routing und Surface Resource Lifecycles von frueheren Media-Manager-spezifischen Produktannahmen. Media bleibt ein moeglicher Host-Fall, aber die RMT Runtime sieht nur deklarative Records, Adapter-Grenzen, Diagnostics und Gate-Evidence.

## Workpackage Status

| Workpackage | Prio | Status | Handoff |
|-------------|------|--------|---------|
| `WP-E18-01` | P0 | completed | Scope, Vendor Baseline und App Platform Leitplanken |
| `WP-E18-02` | P0 | completed | Vendor Component Bugfix Backport |
| `WP-E18-03` | P0 | completed | Bugfix Contract und Browser Smokes |
| `WP-E18-04` | P0 | completed | RMT App Platform Authoring Model |
| `WP-E18-05` | P0 | completed | DOM Descriptor Renderer ohne manuelle HTML-Sinks |

Gate chain: `rmt-app-platform-authoring` bleibt der Startpunkt fuer das Epic18 App-Platform Authoring Model.
| `WP-E18-06` | P0 | completed | Component Template Primitives |
| `WP-E18-07` | P0 | completed | Typed State Selector Runtime und injected `xstate` Host Adapter |
| `WP-E18-08` | P1 | completed | Actions, Effects, DataSources und Resource Runtime |
| `WP-E18-09` | P1 | completed | Declarative Event Routing und Component Interactions |
| `WP-E18-10` | P1 | completed | Surface Overlay Portal Resource Graph Runtime |
| `WP-E18-11` | P1 | completed | Scaffold, Linter, LSP und Diagnostics fuer RMT Apps |
| `WP-E18-12` | P1 | completed | Generische RMT App Platform Fixture |
| `WP-E18-13` | P2 | completed | Docs, Migration Guide, Vendor Rebuild und Release Handoff |

## Gate Chain

```bash
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
npm run test:pr:report
npm run test:release:full:report
```

## Boundaries

- `xstate` bleibt Host Adapter und wird nicht in den RMT-Kernel importiert.
- Event Routing bleibt deklarativ und nutzt kein Produkt-Event-Framework.
- Component Templates erzeugen DOM Descriptor Records statt HTML-Strings.
- Resource Lifecycles brauchen Owner, Cleanup und Diagnostics.
- Media-spezifische Begriffe duerfen nicht in generische Runtime-Fixtures zurueckwandern.
