# RC1 Readiness

- Contract: `xtend.epic13.rc1-production-readiness.v1`
- Report: `xtend.epic13.rc1-readiness-report.v1`
- Workpackage: `WP-E13-01`
- Local gate: `node scripts/run_xtend_tests.js epic13-rc1-readiness --json`
- Target state: `rc1-production-candidate-ready`

RC1 carries the RC0 handoff into a release candidate that is closer to production. The status does not mean publish. `private-until-release-owner-acceptance` remains active.

## What RC1 Must Make Checkable

| Area | RC1 obligation |
|------|----------------|
| Release Owner Acceptance | formal contract with accepted, deferred and blocked decisions |
| Conditional Network Gates | run `npm audit --audit-level=moderate` and `npm sbom --sbom-format=cyclonedx --json`, or document owner deferral |
| Package Dry Run | check package content and export surface in a machine-readable way |
| Known Residuals | `xstate` and `x-utils` are closed; `xtend.component.hydrate` is closed without owner dependency in `WP-E13-06` |
| Browser/CSP | production-close same-origin, nonce and loader smokes are prepared under [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) |
| Visual Evidence | keep DOM-first snapshots and normalize optional screenshot/pixels artifact under [Visual Owner Artifacts](./visual-owner-artifacts.md) |
| RMT Apps | bundle RMT-first app shell, routing, components, Fabric, lanes and diagnostics |
| Docs app | Parsedown remains an orchestrated component inside an RMT shell |
| Trusted DOM | Parsedown/RMT HTML boundary checked close to the browser |
| Migration Notes | prepare RC1 SemVer and changelog decision |

## Baseline Gates

```bash
node scripts/run_xtend_tests.js epic13-rc1-readiness --json
node scripts/run_xtend_tests.js epic12-rc0-handoff --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
node scripts/run_xtend_tests.js references --json
```

## Feature Drift

Not part of RC1:

- embedding XTend into the RMT kernel
- bringing CDN fallbacks back into default paths
- building new product features without a production-readiness purpose
- automatically opening `private: true`

## Handoff

`WP-E13-02` is complete and documents the Release Owner Acceptance contract under [Release Owner Acceptance](./release-owner-acceptance.md). `WP-E13-03` is also complete and documents the Conditional Network Evidence under [Conditional Network Evidence](./conditional-network-evidence.md). `WP-E13-04` is complete and documents the Package Export Lock under [Package Export Lock](./package-export-lock.md). `WP-E13-05` is complete and documents the Known Residual Triage under [Known Residual Triage](./known-residual-triage.md). `WP-E13-06` is complete and documents the [Hydration Performance Closure](./hydration-performance-closure.md). `WP-E13-07` is complete and documents the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md). `WP-E13-08` is complete and documents `xtend.epic13.visual-owner-artifact.v1` under [Visual Owner Artifacts](./visual-owner-artifacts.md). `WP-E13-09` is complete and documents `xtend.epic13.rmt-production-readiness.v1` under [RMT Production Readiness](./rmt-production-readiness.md). `WP-E13-10` is complete and documents `xtend.epic13.docs-rmt-production-hardening.v1` under [Docs RMT Production Hardening](./docs-rmt-production-hardening.md). `WP-E13-11` is complete and documents `xtend.epic13.trusted-dom-boundary.v1` under [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md). `WP-E13-12` is complete and documents `xtend.epic13.rc1-migration-notes-semver.v1` under [RC1 Migration Notes](./rc1-migration-notes.md). `WP-E13-13` is complete and documents `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` under [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md). `WP-E13-14` is ready for the final Epic 13 closure review.
