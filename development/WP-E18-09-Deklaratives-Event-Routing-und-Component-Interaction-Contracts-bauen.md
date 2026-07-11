# WP-E18-09 - Deklaratives Event Routing und Component Interaction Contracts bauen

- Status: `completed`
- Epic: `development/docs-evidence/root/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Contract: `xtend.epic18.rmt-event-routing-runtime.v1`
- Runtime: `xtendrmt/rmt-event-routing-runtime.js`
- Types: `xtendrmt/rmt-event-routing-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-event-routing-runtime.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-event-routing-runtime --json`
- Package script: `npm run test:rmt-event-routing-runtime`
- Next: `WP-E18-10`

## Ziel

Events werden in RMT zur Plattformfaehigkeit. DOM- und Custom-Events koennen
deklarativ an Actions gebunden werden, ohne produktseitige
`event.target.closest(...)`-Ketten oder eigene Event-Glue-Frameworks.

## Umsetzung

- `catalog/epic18-rmt-event-routing-runtime.js` beschreibt Contract,
  Faehigkeiten, Governance, Boundaries, Artefakte und Handoff.
- `xtendrmt/rmt-event-routing-runtime.js` stellt
  `createRmtEventRoutingRuntime` bereit.
- `xtendrmt/rmt-event-routing-runtime.d.ts` typisiert Event Bindings,
  Governance, Payload Contracts, Diagnostics und Runtime-Adapter.
- `tests/fixtures/rmt-event-routing-runtime.rmt` modelliert eine
  domain-neutrale Event-Fixture mit Click, Input, Submit, Custom, Drop und
  Keyboard-Cancel.
- `tests/rmt/rmt_event_routing_runtime_suite.js` prueft Event-to-Action-
  Mapping, Payload-Vertraege, Governance, Retargeting, Diagnostics und
  owner-spezifischen Listener-Cleanup.
- `docs/rmt-event-routing-runtime.md` dokumentiert das neue Runtime-Surface.

## Scope

- DOM- und Custom-Event-Bindings.
- Payload-Contracts vor Action-Ausfuehrung.
- Event-to-Action-Mapping ueber die injizierte `WP-E18-08` Action Runtime.
- Event Governance fuer `preventDefault`, Propagation, Capture, Passive, Once
  und Retargeting.
- Cancel-Action-Routing fuer laufende Actions.
- Owner-scoped Listener Lifecycle.

## Nicht-Scope

- Keine Media-Manager-spezifische Event-Taxonomie.
- Kein Produkt-Event-Framework als XTend-Default.
- Kein direkter Zugriff auf XTend UI-Komponenten aus dem RMT Kernel.
- Keine Surface-/Overlay-/Portal-Haertung; das startet in `WP-E18-10`.

## Definition of Done

- erfuellt: RMT Diagnostics zeigen Event-Quelle, Component, Payload und
  Action-Ziel.
- erfuellt: Payload-Contracts blockieren ungueltige Event-Payloads vor der
  Action-Ausfuehrung.
- erfuellt: DOM-, Custom-, Keyboard-, Form-, Surface-/Drop-nahe Events sind als
  generische Event-Kinds modelliert.
- erfuellt: Listener koennen owner-basiert entfernt werden.
- erfuellt: `rmt-event-routing-runtime` ist als lokaler Gate registriert.
- erfuellt: Package- und TypeExports-Surfaces enthalten
  `./rmt/event-routing-runtime`.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
```

Letzter lokaler Nachweis:

- `rmt-event-routing-runtime`: 1 Suite, 221 Assertions
- RMT App Platform Kette: 12 Suites, 1786 Assertions
- TypeExports/Package Lock: 3 Suites, 805 Assertions, 119 Public Exports
- Erweiterte Handoff-Kette inklusive References: 16 Suites, 10251 Assertions

## Handoff

`WP-E18-10` ist nach diesem Paket startklar. Es soll Surface-, Overlay-,
Portal- und Resource-Graphen mit den owner-basierten Event- und Resource-
Primitives verbinden.
