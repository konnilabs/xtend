# RC0 Gate Matrix

`xtend.epic12.rc0-gate-matrix.v1` describes XTend's first release-candidate-capable gate interface. RC0 is a local review candidate, not a publish.

Local self check:

```bash
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:rc0-gate-matrix
```

## Required Gates

| Area | Command |
|------|---------|
| PR Fast | `npm run test:pr:report` |
| Full Release | `npm run test:release:full:report` |
| Snapshot Gate | `node scripts/run_xtend_tests.js component-shell-theme-matrix visual-snapshot-automation visual-snapshots design-tokens --json` |
| RMT Authoring Gate | `node scripts/run_xtend_tests.js rmt-shell-authoring-ux rmt-first-class-app rmt-first-demo-app docs-rmt-pilot rmt-dsl-authoring-polish --json` |
| Package Dry Run | `npm run pack:dry-run` |
| Matrix Self Check | `node scripts/run_xtend_tests.js rc0-gate-matrix --json` |

## Snapshot and Design Tokens

The snapshot gate uses `visual-snapshots` and `design-tokens`. Pixel baselines remain optional; the reviewable RC0 basis is the DOM baseline at `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## RMT Authoring

The RMT authoring gate connects shell authoring, RMT-first apps, Docs Parsedown scheduling and the new `rmt-dsl-authoring-polish` gate. This makes it checkable that XTend UI, XRouter and XTendRMT work together without importing XTend types into the RMT kernel.

## Conditional Network Gates

Before publish, network gates must run or be intentionally deferred in the handoff:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

These gates are not part of the local default runner.

## Known Residual Policy

RC0 currently accepts:

- `xstate` as a `contract-gated` non-visual boundary probe
- `x-utils` as a `typed-contract-gated` utility boundary
- the known performance warning `xtend.component.hydrate` as long as it stays below the failure threshold

`private-until-release-owner-approval` remains active. Even a green RC0 gate run does not mean publish approval.

## Migration and Adoption

The operational docs for teams have lived in the [RC0 Adoption Guide](./rc0-adoption-guide.md) since `WP-E12-15`. It brings together long-tail runtime closure, DOM-first snapshot baseline, design-token productization, RMT DSL authoring polish, known residual policy and migration notes for component authors and app authors.

The final owner handoff has lived under [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md) since `WP-E12-16`. It sets the Epic 12 status to `ready-for-release-owner-review-not-publish` and keeps publishing blocked until Release Owner Acceptance.

Canonical path: `docs/rc0-adoption-guide.md`.
