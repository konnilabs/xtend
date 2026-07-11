# XTendRMT Migration Guide

Migration from hand-written host logic to declarative RMT records.

## What it covers

This guide replaces imperative application wiring with RMT records without requiring a big-bang migration. Existing hosts can migrate one surface at a time as long as old and new paths never own the same state or DOM region.

## Public building blocks

- `tools/rmt-language/vnext-parser.js` validates new source.
- `xtendrmt/rmt-app-runtime.js` accepts compiled core records.
- `rmt-vnext-migration-notes` documents changes within the vNext language.

## Recommended workflow

Choose a surface with clear inputs and outputs. Inventory its current state, events, and cleanup, model them in RMT, and remove the legacy path only after snapshots and browser smoke show equivalent behavior.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Verify the migration

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
```

The report distinguishes supported legacy boundaries from paths that must be replaced with native RMT records. Fix a refusal at the source or adapter boundary rather than introducing a second owner for the same surface.
