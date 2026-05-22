# Release Owner Acceptance

`xtend.epic13.release-owner-acceptance.v1` describes the first RC1 owner interface after the RC1 Readiness Model.

Local gate:

```bash
node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json
```

or:

```bash
npm run test:epic13-release-owner-acceptance
```

## What the Contract Defines

- Release Owner Acceptance is a review contract, not a publish approval.
- `private-until-release-owner-acceptance` remains active.
- `publishAllowed` remains `false`.
- `automaticPublishApproval` remains `false`.
- Owner decisions use `accepted`, `deferred` and `blocked`.

## Checklist Model

| Status | Use |
|--------|-----|
| `accepted` | baseline is accepted as a review basis |
| `deferred` | open evidence is visible and has a target package |
| `blocked` | decision must not happen automatically |

The intentionally blocked entry is `automatic-publish-approval`. A green test run therefore remains a review signal, not a publish signal.

## Current Handoff

`WP-E13-03` prepared the Conditional Network Gate Evidence under [Conditional Network Evidence](./conditional-network-evidence.md) with `xtend.epic13.conditional-network-evidence.v1`:

- `npm audit --audit-level=moderate`
- `npm sbom --sbom-format=cyclonedx --json`

If these gates cannot run locally because of sandbox, network or policy, a structured owner deferral is created.

`WP-E13-04` completed the [Package Export Lock](./package-export-lock.md) with `xtend.epic13.package-export-lock.v1`. `WP-E13-05` completed the [Known Residual Triage](./known-residual-triage.md) with `xtend.epic13.known-residual-triage.v1`. `WP-E13-06` completed the [Hydration Performance Closure](./hydration-performance-closure.md) with `xtend.epic13.hydration-performance-closure.v1`. `WP-E13-07` completed the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) with `xtend.epic13.prod-browser-csp-smoke.v1`. `WP-E13-08` normalized [Visual Owner Artifacts](./visual-owner-artifacts.md) with `xtend.epic13.visual-owner-artifact.v1`.

The checklist entry `known-residual-renewal` is therefore `accepted`: `xstate` and `x-utils` are boundary contracts, `xtend.component.hydrate` is closed without owner dependency. The checklist entry `visual-owner-artifact` is `accepted`; `rmt-production-readiness` has also been `accepted` since `WP-E13-09` and `xtend.epic13.rmt-production-readiness.v1`. `docs-rmt-production-hardening` has been accepted since `WP-E13-10` and `xtend.epic13.docs-rmt-production-hardening.v1`. `prod-browser-csp-smoke` and `trusted-dom-boundary` have been accepted since `WP-E13-11`; the Trusted DOM evidence is under [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) and `xtend.epic13.trusted-dom-boundary.v1`. `rc1-migration-notes` has been accepted since `WP-E13-12`; the evidence is under [RC1 Migration Notes](./rc1-migration-notes.md) and `xtend.epic13.rc1-migration-notes-semver.v1`. `rc1-gate-matrix-ci-handoff` has been accepted since `WP-E13-13`; the evidence is under [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md) and `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`. The next handoff goes to `WP-E13-14`.

Further reading: [RC1 Readiness](./rc1-readiness.md).

## RC1 Test-Build Acceptance

`RC1TB-WP-08` concretizes the owner interface for the first local RC1 test build in `development/XTend-RC1-Test-Build-Owner-Acceptance.md` under `xtend.rc1.test-build-owner-acceptance.v1`.

The decision for this interface is `accepted-for-internal-test-build-not-publish`: the test build may be used internally against the documented gate reports, the RMT vNext Reference Demo and the XTendRMT Bestcase Demo. `npm-audit-moderate` and `npm-sbom-json` were executed and accepted in the owner publish step; version `0.1.0-rc.1` and `private: false` are set for publish prep, while `automaticPublishApproval: false` remains active.

The separate owner publish decision is created in `development/XTend-RC1-Release-Owner-Publish-Decision.md` under `xtend.rc1.release-owner-publish-decision.v1`. Its current state is `accepted-for-publish-prep`; the actual publish command was not executed. The license decision for the complete stack is `Apache-2.0`; audit and SBOM are accepted.
