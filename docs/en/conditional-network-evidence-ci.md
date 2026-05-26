# Conditional Network Evidence CI

Conditional Network Evidence CI describes the job that collects optional audit and SBOM evidence in GitHub Actions. The local default remains offline-capable; this article explains the additional CI path that explicitly enables network access, stores results as artifacts and allows a controlled deferral decision.

## Purpose

The job does not exist to block local developers. It exists to add publication signals that only make sense with registry or network access. Those signals include audit reports, SBOM files and a summarized evidence report. If an organization does not want those calls in every pull request, the local gate remains green while the CI job carries its own responsibility.

For new modules such as `xtend-i18n` or `xtend-maraca`, this separation matters. The base check recognizes manifest keys, package exports, type targets and loader boundaries without external downloads. The network check only adds the supply-chain perspective and should not force a local import path.

## Execution

The workflow sets an explicit switch before audit and SBOM commands run. That makes the difference between local deferral and CI execution visible. Reports land under `.xtend-test-results` so they can be uploaded with the rest of the release artifacts.

```txt
schema: xtend.epic13.conditional-network-evidence-ci.v1
local gate: node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
capture command: npm run conditional-network:evidence
execute env: XTEND_CONDITIONAL_NETWORK_EXECUTE=1
audit artifact: .xtend-test-results/xtend-npm-audit-report.json
sbom artifact: .xtend-test-results/xtend-npm-sbom.json
report artifact: .xtend-test-results/xtend-conditional-network-evidence-report.json
next work item: DPF-WP-04
```

## Artifacts

The audit report shows whether known security findings appear in the current dependency graph. The SBOM artifact describes dependencies in a machine-readable form. The summarized XTend report connects those files with the deferral model and publication path. A release process can then distinguish actual network execution from an accepted deferral.

The artifacts should be read next to Package Export Lock, TypeExports, pack dry run, Maraca reports and browser smokes. A single network report does not replace package verification; it complements it.

## Maintenance Notes

Change the job only when the local path remains offline-capable. New network commands need a stable artifact path, a release-checklist entry and an update to this page. If a CI runner has no network access, the deferral should be visible and machine-readable instead of redefining the local default path.
