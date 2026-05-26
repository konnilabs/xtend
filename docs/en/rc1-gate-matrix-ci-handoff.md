# Readiness CI Bundle

Readiness CI Bundle describes how fast local checks, package artifacts, browser smokes and optional network reports are combined in CI. The visible contract is intentionally product-facing: developers should understand which jobs verify the same package and runtime boundaries and which artifacts to inspect on failure.

## Purpose

The CI bundle path prevents every suite from inventing its own idea of readiness. Components, manifest policy, TypeExports, Package Export Lock, Maraca and docs quality are treated as connected signals. When `xtend-i18n` appears as new infrastructure, it must show up in those signals: manifest, loader, types, docs and package boundaries.

Nightly expands this view with longer jobs. That includes workspace dry runs, Maraca reports and optional network evidence. Pull requests stay quick while the nightly build protects the broader surface.

## Evidence Block

The following machine-readable values are checked by CI suites.

```txt
schema: xtend.epic13.rc1-gate-matrix-ci-handoff.v1
release evidence schema: xtend.epic13.release-report-pack-dry-run-evidence.v1
release evidence docs: release-report-pack-dry-run-evidence
network ci schema: xtend.epic13.conditional-network-evidence-ci.v1
network ci report: .xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json
readiness bundle: rc1-gate-matrix-ci-handoff
```

## Artifact Path

A green run should make local reports and CI artifacts visible together. For package exports, that means the TypeExports report, Package Export Lock and pack dry run file. For Maraca, it means plan, bundle, source-to-bundle and size reports. For i18n, it means the component fixture, manifest import policy, public types and docs entry.

If a new file appears in only one of those paths, that is a drift signal. The fastest fix is usually not a test bypass; it is adding the missing package root, type target, menu slug or workflow artifact.

For infrastructure modules, the bundle view is especially useful. A non-visual module should be visible to the loader and package checks, while visual component waits should remain reserved for Custom Elements. That difference keeps modules such as `xtend-i18n` easy to publish without confusing the component hydration path.

## Maintenance Notes

Keep the CI description synchronized with the workflow files. When a new artifact is uploaded, it should appear here and in the release checklist. When an artifact is removed from a job, it should be clear which other report owns the same claim. That keeps default gates and nightly understandable as the platform grows.
