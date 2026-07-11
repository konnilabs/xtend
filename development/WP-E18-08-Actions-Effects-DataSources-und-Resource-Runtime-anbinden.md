# WP-E18-08 - Actions, Effects, DataSources und Resource Runtime anbinden

- Status: `completed`
- Epic: `development/docs-evidence/root/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Contract: `xtend.epic18.rmt-action-effect-runtime.v1`
- Runtime: `xtendrmt/rmt-action-effect-runtime.js`
- Types: `xtendrmt/rmt-action-effect-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-action-effect-runtime.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-action-effect-runtime --json`
- Package script: `npm run test:rmt-action-effect-runtime`
- Next: `WP-E18-09`

## Ziel

RMT Apps koennen Daten laden, mutieren, Feedback ausloesen und Ressourcen
besitzen, ohne produktlokale Action-Frameworks oder externe
`innerHTML`-Hilfsrenderer fuer normale App-Flows.

## Umsetzung

- `catalog/epic18-rmt-action-effect-runtime.js` beschreibt Contract,
  Faehigkeiten, Boundaries, Artefakte und Handoff.
- `xtendrmt/rmt-action-effect-runtime.js` stellt `createRmtActionEffectRuntime`
  und `createRmtResourceManager` bereit.
- `xtendrmt/rmt-action-effect-runtime.d.ts` typisiert Actions, DataSources,
  Effects, Resources, Diagnostics und Runtime-Adapter.
- `tests/fixtures/rmt-action-effect-runtime.rmt` modelliert eine
  domain-neutrale App-Flow-Fixture mit Fixture-, REST-, SSR- und Host-
  DataSources.
- `tests/rmt/rmt_action_effect_runtime_suite.js` prueft Loading, Success,
  Error, Cancel, Feedback, Navigation, Focus, Lazy Imports, Side Effects,
  Resource Ownership und Diagnostics.
- `docs/rmt-action-effect-runtime.md` dokumentiert das neue Runtime-Surface.

## Scope

- Actions mit Loading, Success, Error und Cancel.
- Effects fuer Toasts, Feedback, Navigation, Focus, Lazy Imports und Side
  Effects.
- DataSources fuer Fixture, REST, SSR und Host-Adapter.
- Resource Ownership fuer Object URLs, Streams, Observer, Timers und Imports.
- Adapterbasierte Ausfuehrung statt direkter globaler Netzwerk- oder
  Produkt-Shell-Abhaengigkeiten.

## Nicht-Scope

- Keine Media-Manager-Surface-Taxonomie.
- Kein produktlokales Action-Framework als XTend-Default.
- Kein direkter Zugriff auf XTend UI-Komponenten aus dem RMT Kernel.
- Kein Event-Routing; das startet in `WP-E18-09`.

## Definition of Done

- erfuellt: Standard-App-Flows lassen sich als RMT Actions/Effects modellieren.
- erfuellt: Fixture, REST, SSR und Host-Adapter DataSources sind abgedeckt.
- erfuellt: Loading, Success, Error und Cancel schreiben Status und
  Diagnostics.
- erfuellt: Ressourcen werden owner-basiert erworben und freigegeben.
- erfuellt: `rmt-action-effect-runtime` ist als lokaler Gate registriert.
- erfuellt: Package- und TypeExports-Surfaces enthalten
  `./rmt/action-effect-runtime`.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
```

Letzter lokaler Nachweis:

- `rmt-action-effect-runtime`: 1 Suite, 231 Assertions
- RMT App Platform Kette: 11 Suites, 1365 Assertions
- TypeExports/Package Lock: 3 Suites, 800 Assertions, 118 Public Exports
- Erweiterte Handoff-Kette inklusive References: 15 Suites, 9977 Assertions

## Handoff

`WP-E18-09` ist nach diesem Paket startklar. Es soll deklarative DOM- und
Custom-Events mit den hier eingefuehrten Actions verbinden und Event-Quelle,
Payload-Contract und Action-Ziel diagnostizierbar machen.
