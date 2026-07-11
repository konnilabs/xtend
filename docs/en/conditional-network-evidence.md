# Conditional Network Evidence

Conditional Network Evidence separates optional network checks from local default gates. XTend should remain testable in a sandbox, in pull requests and on developer machines without external downloads. Audit and SBOM runs still matter, but they belong in jobs that explicitly allow network access and store their artifacts clearly.

## Local Default

The local default is offline-capable. Package Export Lock, TypeExports, i18n component checks, manifest policy and Maraca package checks must not depend on `npm audit`, registry access or external SBOM generators. That lets third-party developers run the same core checks in restricted environments.

If a local check turns red, the cause should be in the repository surface: a missing export, an incorrect manifest key, an unclassified type target or a bootstrap module being treated like a visual component. Network failures should not hide that path.

## Conditional Evidence

Network evidence is collected in nightly or manual workflows. These jobs may write audit reports and SBOM files as long as their results stay separate from local gates. A missing network report then does not automatically block every local change, but remains visible as publication evidence.

```txt
schema: xtend.epic13.conditional-network-evidence.v1
local gate: node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
ci schema: xtend.epic13.conditional-network-evidence-ci.v1
ci command: npm run conditional-network:evidence
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
network-restricted-local-default
publish boundary: private-until-release-owner-acceptance
Package Export Lock Workpackage: WP-E13-04
Release Handoff: WP-E13-09
Package Export Lock Docs: ./package-export-lock.md
```

## CI Rule

Standard gates use the local commands and write fast JSON reports. Nightly may collect additional evidence and upload it with package artifacts. For new modules such as `xtend-i18n` and `xtend-maraca`, this means the core check must run without network access while broader security and supply-chain information is produced by dedicated jobs.

This separation is especially important when an organization uses private registries, restricted runners or reproducible builds. The local path stays deterministic; the network path adds security evidence when the environment is ready for it.

## Maintenance Notes

Document new network commands only when it is clear which job runs them and where the artifact lands. Do not add a registry or audit dependency to a standard suite when the same claim can be checked through local files. This keeps fast CI gates reliable while nightly retains the larger supply-chain view.

## Related reading

The CI guide turns a local conditional-network record into a reproducible gate result. [Related article](./conditional-network-evidence-ci.md)
