# Existing Component Metadata

Contract: `xtend.epic10.existing-component-metadata.v1`

WP-E10-14 migrates existing prioritized XTend components into the RMT/Fabric metadata line. The components remain `js-legacy` for now; RMT/Fabric compatibility is described as a contract overlay in the catalog.

## Catalog

The machine-readable catalog is here:

```text
catalog/epic10-existing-component-metadata.js
```

The gate is:

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

## Target Components

| Component | Focus |
|-----------|-------|
| `x-router` | XRouter adapter, route records, schedule references |
| `x-link` | route activation, navigation events, `aria-current` |
| `x-input` | form value, validation, event commands |
| `x-form` | form aggregation, child control discovery |
| `x-modal` | overlay state, focus trap, modal actions |
| `x-dialog` | overlay state, focus trap, size hints |
| `x-tabs` | tab records, keyboard selection, route panel mapping |
| `x-toast` | feedback status, dismissal command, timer policy |
| `x-alert` | feedback status, dismissal command, state sync |

## Migration Strategy

`js-legacy-contract-overlay-no-runtime-rewrite`

This means:

- no runtime rewrites for this package
- no big-bang TypeScript migration
- no new runtime dependencies
- local ESM artifacts remain under `components/`
- RMT/Fabric metadata becomes centrally gateable

## Metadata Domains

Every record contains:

- `xtend.component.contract.v2`
- `xtend.rmt.component-contract.v1`
- `xtend.component.fabric-boundary.v2`
- `xtend.fabric.telemetry-snapshot.v1`
- lane precedence
- a11y and performance notes
- paths to runtime, types, docs, fixture and component suite

## RMT Authoring

RMT can author these components as `xtend.component` records. The RMT kernel imports no XTend classes or types. DOM materialization, custom element lifecycle, Fabric execution and XRouter registration remain in the host.

Boundary: `no-rmt-kernel-import-of-xtend-types`

## Continuation

WP-E10-15 uses this metadata line for browser, a11y, performance and visual gates.
