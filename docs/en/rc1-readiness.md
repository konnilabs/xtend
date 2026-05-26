# Release Readiness

Release Readiness describes which technical evidence must line up before an XTend package can be considered close to publication. The page is written publicly: it does not explain internal planning, but shows third-party developers which signals to check when they change runtime, package exports, TypeExports, Maraca or i18n.

## Evidence Groups

The key groups are Package Export Lock, TypeExports, Conditional Network Gates, Package Dry Run and Feature Drift. Package Export Lock protects the published surface. TypeExports ensures new entry points are visible with declarations and classification. Conditional Network Gates separate optional audit or SBOM runs from local default checks. Package Dry Run shows which files would really enter the package. Feature Drift describes whether documented behavior, tests and package metadata have moved apart.

For third-party developers the practical message is simple: a change is clean only when the local surface, package archive and documentation know the same names. That applies to visible components as well as non-visual infrastructure modules such as `xtend-i18n`.

## Local Flow

Start with the narrow checks that directly match the change. For i18n, that means component, manifest-policy and type-export checks. For Maraca, add bundle, package-export and size checks. For package boundaries, Package Export Lock is the central control. Only after these local signals are green should slower browser or nightly jobs become the focus.

```bash
node scripts/run_xtend_tests.js components manifest-import-policy type-exports --json
node scripts/run_xtend_tests.js type-exports epic13-package-export-lock maraca-package-exports --json
```

```txt
schema: xtend.epic13.rc1-production-readiness.v1
local gate: node scripts/run_xtend_tests.js epic13-rc1-readiness --json
target: rc1-production-candidate-ready
Release Owner Acceptance
Conditional Network Evidence
Conditional Network Gates
Package Export Lock
Package Dry Run
Feature Drift
WP-E13-02
WP-E13-03
WP-E13-09
./release-owner-acceptance.md
./package-export-lock.md
./hydration-performance-closure.md
```

## CI Relationship

CI should not invent different evidence. It should run the local contracts and collect their artifacts. Standard gates check fast, offline-capable signals. Nightly jobs may add browser smokes, workspace dry runs and optional network evidence. This keeps pull requests quick while the nightly build covers the broader publication view.

When a new export is added, the count in the TypeExports plan, Package Export Lock and documentation should rise together. When a new infrastructure module such as `xtend-i18n` is added, the loader must treat it as a bootstrap boundary and must not wait for a Custom Element definition.

## Maintenance Notes

Keep this page as orientation for public release signals. Internal identifiers remain in the machine-readable block so tests can find them without filling visible prose with planning details. Changes to package exports, type declarations, GitHub Actions or nightly artifacts should update this page whenever they alter the evidence path for external developers.
