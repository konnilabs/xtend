# Conditional Network Evidence CI

Contract: `xtend.epic13.conditional-network-evidence-ci.v1`

Status: `accepted-conditional-network-evidence-ci`

Workpackage: `DPF-WP-03-conditional-network-evidence-ci`

## Goal

This package productizes audit and SBOM evidence for CI and release owners. The local gate remains network-free; the CI job can run `npm audit --audit-level=moderate` and `npm sbom --sbom-format=cyclonedx --json`, or write an owner deferral in the `xtend.epic13.conditional-network-deferral.v1` format when network access is unavailable.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
npm run test:epic13-conditional-network-evidence-ci
```

## Capture

```bash
npm run conditional-network:evidence
```

Without `XTEND_CONDITIONAL_NETWORK_EXECUTE=1`, the capture writes local deferral artifacts. In CI, `.github/workflows/xtend-default-gates.yml` sets `XTEND_CONDITIONAL_NETWORK_EXECUTE=1`, installs workspace links via `npm ci --ignore-scripts --no-audit --fund=false`, uses `XTEND_CONDITIONAL_NETWORK_USE_NPX_NPM10=1` for stable SBOM output and uploads the artifacts:

- `.xtend-test-results/xtend-npm-audit-report.json`
- `.xtend-test-results/xtend-npm-sbom.json`
- `.xtend-test-results/xtend-conditional-network-evidence-report.json`

## Boundaries

Dependency upgrades, vulnerability fixes and public publish are not included. Publish remains blocked by `private-until-release-owner-acceptance` until audit/SBOM has been executed or accepted as deferred by the owner.

The separate GitHub Actions job `npm-publish-next` runs through `workflow_dispatch` with `publish_to_npm=true` or after `release: published` and allows no deferrals: it sets `XTEND_CONDITIONAL_NETWORK_ALLOW_DEFERRAL=0`, repeats `release:report`, pack and audit/SBOM evidence, and then runs `npm publish --tag next --provenance --access public`.

The next step is `DPF-WP-04-visual-pixel-evidence-storage`.
