# SurfaceManager Native RMT Surfaces

`WP-SM-08` introduces `xtend.rmt.surfaces-domain.v1` and the adapter handoff `xtend.surface.adapter.v1`.

## Local Gate

```bash
node scripts/run_xtend_tests.js surface-native-rmt --json
npm run test:surface-native-rmt
```

## Domain

`surfaces` is an optional top-level domain in `.rmt` documents. A surface record continues to reference normal RMT domains:

- `adapter`: `xtend.surface`
- `manager`: `x-surface-manager` component record
- `component`: visible surface component, for example `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog` or `x-drawer`
- `route`: route record
- `schedule`: schedule record

The fixture `tests/fixtures/rmt-surface-native-domain.rmt` shows six surface records: two windows, one side panel, modal, dialog and drawer.

## Adapter

`xtend.surface` can be registered as a `surface_adapter`. In `WP-SM-08`, `runtimeImplemented: false` was intentional and the adapter remained a handoff contract. Since `WP-SM-19`, the productive runtime line is gateable in the [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md): the runtime consumes `surfaces[*]`, calls the SurfaceController and keeps DOM, xstate and Fabric outside the RMT kernel.

## Migration

Existing component records with `metadata.surface` remain valid. New native records can be maintained in parallel as long as `id`, `type`, `manager`, `component`, `route`, `schedule` and `stateKey` stay aligned.

## Tooling

Schema, type artifact, normalizer, semantic graph, completion provider and linter understand `surfaces`. This allows the Language Server to reference surface records and offer completion for `surfaces[*].component`, `surfaces[*].adapter`, `surfaces[*].route`, `surfaces[*].schedule` and `surfaces[*].type`.

## Handoff

`WP-SM-09` finalizes docs, Component Lab and migration guide on this contract base. The closure is in [SurfaceManager Release Handoff](./surface-manager-release-handoff.md) (`docs/surface-manager-release-handoff.md`) and is checked through `node scripts/run_xtend_tests.js surface-release-handoff --json`.
