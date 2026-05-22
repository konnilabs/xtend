# Conditional Network Evidence

`xtend.epic13.conditional-network-evidence.v1` describes how RC1 handles network gates without blocking local development.

Local gate:

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
```

or:

```bash
npm run test:epic13-conditional-network-evidence
```

## Commands

| Command | Artifact |
|---------|----------|
| `npm audit --audit-level=moderate` | `.xtend-test-results/xtend-npm-audit-report.json` |
| `npm sbom --sbom-format=cyclonedx --json` | `.xtend-test-results/xtend-npm-sbom.json` |

The aggregated report is stored at `.xtend-test-results/xtend-conditional-network-evidence-report.json`.

## Local Behavior

The local gate does not automatically execute the network commands. Instead, it verifies that XTend has a stable evidence/deferral format for offline, sandbox and CI environments.

As of `DPF-WP-03`, [Conditional Network Evidence CI](./conditional-network-evidence-ci.md) productizes the CI job and capture command `npm run conditional-network:evidence` under `xtend.epic13.conditional-network-evidence-ci.v1`. The job can execute the audit/SBOM commands or place owner deferrals in the same artifact paths.

Default reason for local deferrals:

```text
network-restricted-local-default
```

Other allowed reasons:

- `sandbox-network-unavailable`
- `registry-auth-unavailable`
- `owner-approved-offline-run`

## Publish Boundary

`private-until-release-owner-acceptance` remains active. Deferred network evidence is a review signal, but not a publish approval.

`WP-E13-04` is complete. [Package Export Lock](./package-export-lock.md) describes how `npm run pack:dry-run` and the export surface are locked for RC1. `WP-E13-05` is complete; `WP-E13-06` completed the [Hydration Performance Closure](./hydration-performance-closure.md). `WP-E13-07` prepared the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md). `WP-E13-08` normalized [Visual Owner Artifacts](./visual-owner-artifacts.md). `WP-E13-09` can now start.

Further reading: [Release Owner Acceptance](./release-owner-acceptance.md).
