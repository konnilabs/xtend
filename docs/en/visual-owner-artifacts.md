# Visual Owner Artifacts

- Contract: `xtend.epic13.visual-owner-artifact.v1`
- Manifest contract: `xtend.epic13.visual-owner-artifact-manifest.v1`
- Report: `xtend.epic13.visual-owner-artifact-report.v1`
- Workpackage: `WP-E13-08`
- Local gate: `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json`
- Package script: `npm run test:epic13-visual-owner-artifact`
- Manifest: `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json`
- Publish boundary: `private-until-release-owner-acceptance`

## Purpose

Visual Owner Artifacts connect the existing DOM-first Visual Snapshot Automation with a reproducible screenshot/pixel artifact path for RC1. The local gate validates contract, manifest and DOM snapshot state. Actual screenshot generation remains optional and belongs in stable browser or CI environments.

## Path Convention

```text
.xtend-test-results/visual-snapshots/rc1/{family}/{viewport}/{theme}/{density}/{motion}.png
```

The report is stored at:

```text
.xtend-test-results/visual-snapshots/rc1/visual-owner-artifact-report.json
```

The fixture remains `tests/browser/fixtures/visual-snapshots-fixture.html`; the DOM baseline remains `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## Local Usage

```bash
npm run test:epic13-visual-owner-artifact
```

The local mode is `static-artifact-manifest-plus-dom-snapshot-gate`. `pixelDiffRequiredInLocalGate`, `screenshotRequiredInLocalGate` and `binaryBaselineCommitted` are `false`.

## Relationship to Existing Gates

- The DOM structure comes from [Visual Snapshot Automation](./visual-snapshot-automation.md).
- The production-close browser/CSP preparation comes from [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md).
- The owner artifact remains `optional-browser-driver-or-ci-artifact` until a stable browser-capture environment is chosen as a required release gate.

## Handoff

`WP-E13-08` is complete. `WP-E13-09` bundled `xtend.epic13.rmt-production-readiness.v1` under [RMT Production Readiness](./rmt-production-readiness.md). `WP-E13-10` completed [Docs RMT Production Hardening](./docs-rmt-production-hardening.md). `WP-E13-11` completed [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) and `xtend.epic13.trusted-dom-boundary.v1`. `WP-E13-12` completed [RC1 Migration Notes](./rc1-migration-notes.md) and `xtend.epic13.rc1-migration-notes-semver.v1`. `WP-E13-13` completed [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.
