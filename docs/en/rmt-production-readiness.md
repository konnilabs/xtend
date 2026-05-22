# RMT Production Readiness

- Contract: `xtend.epic13.rmt-production-readiness.v1`
- Report: `xtend.epic13.rmt-production-readiness-report.v1`
- Workpackage: `WP-E13-09`
- Local gate: `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json`
- Package script: `npm run test:epic13-rmt-production-readiness`
- Publish boundary: `private-until-release-owner-acceptance`

## Purpose

`WP-E13-09` bundles the RMT-first app path for RC1. The package brings the existing RMT gates together into a production-close interface: shell-first app shell, native RMT routes, XTend components through adapters, Fabric/lane ingestion, lifecycle telemetry, diagnostics and XTendRMT artifact parity.

The bundle adds no new app features. It makes visible that XTend apps can be templated completely in RMT while the RMT kernel remains framework-agnostic.

## Source Gates

```bash
npm run test:rmt-compatibility
npm run test:rmt-first-class-app
npm run test:rmt-first-demo-app
npm run test:rmt-artifact-parity
npm run test:rmt-component-fabric-ingestion
npm run test:rmt-component-lifecycle-telemetry
npm run test:epic13-visual-owner-artifact
```

The local WP09 gate checks these source gates as a static RC1 bundle. It requires no network access and no external browser.

## Readiness Domains

| Domain | Evidence |
| --- | --- |
| Shell-first app shell | `tests/fixtures/rmt-first-class-xtend-app.rmt`, `xtendrmt/rmt-first-demo-app.rmt` |
| Routing | `xtend.xrouter` adapter and RMT `routes` records |
| Components | `xtend.component` adapter and RMT `components` records |
| Fabric/Lane | `xtend.component.fabric-lane-ingestion.v2` |
| Lifecycle Telemetry | `xtend.component.lifecycle-telemetry.v1` |
| Diagnostics | `rmt.state-scheduler-diagnostics` and Fabric snapshots |
| Artifact Parity | `xtend.rmt.artifact-parity.v1` |
| Kernel Boundary | `no-rmt-kernel-import-of-xtend-types` |

## Boundary

RMT owns app records, routes, schedules, templates and metadata. XTend execution remains in host adapters:

- XTend components are not imported into the RMT kernel.
- XRouter is connected through `xtend.xrouter`.
- Fabric/lane and telemetry signals are ingested, but not modeled as hard kernel dependencies.
- React, Vue, Vanilla and custom hosts can use their own adapters.

## References

- [RMT-first XTend Apps](./rmt-first-xtend-apps.md)
- [RMT-first Demo App](./rmt-first-demo-app.md)
- [XTendRMT App DSL](./xtendrmt-app-dsl.md)
- [XTendRMT Native Authoring](./xtendrmt-native-authoring.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
- [Visual Owner Artifacts](./visual-owner-artifacts.md)

## Handoff

`WP-E13-09` is complete. `WP-E13-10` added [Docs RMT Production Hardening](./docs-rmt-production-hardening.md) and hardened the Docs app RMT Parsedown shell for production-close extensions. `WP-E13-11` completed [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) and `xtend.epic13.trusted-dom-boundary.v1`. `WP-E13-12` completed [RC1 Migration Notes](./rc1-migration-notes.md) and `xtend.epic13.rc1-migration-notes-semver.v1`. `WP-E13-13` completed [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.
