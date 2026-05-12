# XTend RMT vNext Remote Surface Migration Contract

- Status: `accepted`
- Workpackage: `WP-E16-10`
- Module: `tools/rmt-language/vnext-remote-compatibility.js`
- Suite: `tests/rmt-language/rmt_vnext_remote_compatibility_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json`

## Contract

```js
schema: "xtend.rmt.vnext-remote-compatibility-matrix.v1"
migrationReportSchema: "xtend.rmt.vnext-remote-migration-report.v1"
roundtripReportSchema: "xtend.rmt.vnext-remote-roundtrip-report.v1"
previewSchema: "xtend.rmt.vnext-remote-authoring-preview.v1"
```

The compatibility layer inventories existing Surface records and SurfaceManager
metadata for Enterprise-MFE migration planning. Migration is report-only by
default and produces Remote Surface Authoring previews only when explicit Remote
facts are already present.

## Report-Only Default

- Existing `surfaces[]`, `components[*].metadata.surface` and
  `components[*].metadata.surfaceManager` records are analyzed without rewriting
  source files.
- Missing Remote facts are reported as diagnostics, not inferred from runtime
  state.
- SurfaceManager records remain host-owned runtime boundaries.
- Native RMT Surface domains are roundtripped as normalized JSON before any
  preview projection is considered.

## Preview Boundary

A Remote Surface Authoring preview requires:

- `owner`
- `version`
- `remote`
- `origin`
- `integrity`
- `trustBoundary`
- `fallback`
- `shellTarget`

If any required fact is missing, preview mode is blocked for that candidate.
Runtime-only facts such as bounds, active state, persistence, SurfaceManager
state keys, component events and a11y focus behavior are surfaced as
non-migratable diagnostics.

## Compatibility Matrix

The matrix reports one entry per source and preserves the full migration report
for agents and CI. Compatible report-only warnings remain non-blocking, while
syntax failures, normalization failures and unsafe requested previews block the
matrix.

## Safety

The adapter does not load remote code, perform network requests or execute host
runtime behavior. Remote previews are compiled through the WP-E16-08 remote
compiler and stay JSON-compatible.
