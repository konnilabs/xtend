# Release Verification

An XTend change is ready to ship when source code, package contents, public types, documentation and machine-readable reports describe the same surface. This page covers the local checks that an integrator can verify before a merge or release.

Verification does not publish a package, and its core path does not require registry access. Network-dependent audit and SBOM evidence remains a separate, explicitly enabled step.

## Fast pull request path

Run the report gate for a normal pull request:

```bash
npm run test:pr:report
```

The command writes `.xtend-test-results/xtend-pr-gate-report.json`. A successful process exit is not enough by itself. Check that every suite reports `passed`, that there are no unexpected `skips`, and that all expected subreports are registered.

For a documentation-only or DevTools extension change, run the focused path first:

```bash
node scripts/run_xtend_tests.js xtend-dev-surface docs-public-quality docs-content-depth references --json
```

The complete pull request report remains the integration check afterwards.

## Full release verification

Before a release, verify the wider suite and package contents separately:

```bash
npm run test:release:full:report
npm run release:report
npm run pack:dry-run
```

`test:release:full:report` creates `.xtend-test-results/xtend-release-gate-report.json`. `release:report` writes `.xtend-test-results/xtend-release-report.json`. The pack dry run produces an archive inventory without publishing to a registry.

Compare three layers:

1. Gate reports must contain every required suite and artifact.
2. The archive inventory must not contain private fixtures, build caches, secrets or unapproved framework runtimes.
3. Public exports, `.d.ts` files and documentation paths must resolve to files that are actually shipped.

## Read the reports

An XTend runner report records at least status, exit code, pass, failure, skip and warning counts for every suite. For `failed`, the first message is a starting point rather than necessarily the root cause. Follow the named files and rerun the affected suite with `--json`.

`blocked` means a required precondition was deliberately not met, such as a missing local runtime, a policy decision or a disallowed network path. Do not change the gate threshold in response. Provide the prerequisite or document why that operation is outside this release path.

Warnings are acceptable only when the report explicitly classifies them as non-blocking. A growing warning count indicates drift and should be investigated before release.

## Offline and network evidence

Local core gates remain offline-capable. `npm audit`, registry requests and SBOM generation belong to conditional network evidence and must not prevent a developer without network access from checking source, types, manifests and package contracts.

If your release environment requires network evidence, run it in an approved job and retain the report together with the package fingerprint. See [Conditional Network Evidence](./conditional-network-evidence.md) and [Supply Chain Checks](./supply-chain-gates.md) for the boundary.

## Resolve common failures

For a missing export, compare `package.json`, the actual package archive and the corresponding `.d.ts` file. Do not add only a test marker: the export must resolve from the installed package.

When `references` fails, a path, schema or command has usually drifted between its source of truth and a consumer. Update the stale consumer and preserve the public name unless a migration has been announced.

When a docs gate fails, repair the content, locale pair, menu entry or link. Internal status records belong under `development/`, not in the public navigation as an exception.

When the pack dry run fails, inspect `files`, exports and generated artifacts in `package.json` first. A green test run does not prove that the published archive is complete or free of internal files.

## Next steps

- [Package Export Lock](./package-export-lock.md)
- [Type Exports](./type-exports.md)
- [Conditional Network Evidence](./conditional-network-evidence.md)
- [Supply Chain Checks](./supply-chain-gates.md)
- [Changelog](./changelog.md)
