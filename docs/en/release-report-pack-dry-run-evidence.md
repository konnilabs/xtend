# Release Report Pack Dry Run Evidence

Release Report Pack Dry Run Evidence connects the package report with the files that a dry run would include in an archive. This page is for teams that need to verify that a new public surface is not only present in the source tree, but also reaches the package and is linked to release reports.

## Purpose

A package export can look correct in `package.json` and still be absent from the packed output when the root is missing from `files` or a workspace artifact was not written. The dry run closes that gap. It produces a machine-readable view of the package and shows whether declarations, runtime files, docs, Maraca artifacts or Design Tokens would really be included.

For `xtend-i18n`, this is especially useful because the module is not registered as a Custom Element. It still needs to be visible as a local ESM module, declaration file and manifest infrastructure. The same applies to Maraca with workspace dry runs and bundle reports.

## Evidence Block

The following tokens remain in the document so the CI suite can verify the connection between release report, network evidence and pack dry run.

```txt
schema: xtend.epic13.release-report-pack-dry-run-evidence.v1
network ci schema: xtend.epic13.conditional-network-evidence-ci.v1
release report: .xtend-test-results/xtend-release-report.json
pack command: npm run pack:dry-run:report
raw pack command: npm run pack:dry-run:raw
package report: .xtend-test-results/xtend-pack-dry-run.json
surface report: .xtend-test-results/xtend-package-export-surface-lock.json
```

Create the normalized pack report without publishing:

```bash
npm run pack:dry-run:report
```

## CI Relationship

The default gate collects static reports and workspace dry runs. The nightly build adds broader artifacts, including the Maraca report, size report and optional network evidence. This lets a reviewer see whether all package layers know the same surface. If an artifact is missing, inspect the package root first, then the export key, then the declaration.

The dry run remains a reproducible local command. It publishes nothing, writes no real release archive and needs no registry access. That is why it works as an early boundary for CI/CD.

This page also helps reviewers separate package evidence from product behavior. A browser smoke can prove that a fixture runs, but it cannot prove that declaration files, generated reports and workspace roots are present in the package. The dry run evidence fills that packaging gap and gives CI a compact artifact that can be compared across branches.

## Maintenance Notes

Add new package roots together with TypeExports, Package Export Lock and docs. If a workspace package needs its own dry run, the workflow should upload the JSON artifact. If a report exists only locally and not in CI, the evidence is incomplete.

## Related reading

The release workflow places pack dry-run evidence in the final acceptance sequence. [Related article](./release-verification.md)
