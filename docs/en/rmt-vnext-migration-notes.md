# RMT vNext Migration Notes

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Compatibility contract: `xtend.rmt.vnext-compatibility-matrix.v1`
- Migration report: `xtend.rmt.vnext-migration-report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`

RMT vNext is additive. Existing JSON-close `.rmt` and `.rmt.json` documents remain parseable and normalizable. New authoring files should use the vNext syntax and compile to `xtend.rmt.core-format.vnext.v1`.

## Migration Mode

The default mode is `report-only`. It creates a migration report, checks the legacy roundtrip and shows boundary warnings, but does not automatically rewrite a file.

`preview` is opt-in and additionally creates a vNext authoring draft.

```js
const {
  createMigrationReport
} = require('./tools/rmt-language/vnext-compatibility');

const report = createMigrationReport({
  text: source,
  filePath: 'app.rmt'
}, {
  migrationMode: 'preview'
});
```

## Compatible Warnings

These warnings do not block migration:

- `rmt.document.extension.fallback-used`
- `rmt.vnext.migration.opt_in_required`
- `rmt.vnext.migration.lossy_domain`

`lossy_domain` means: the legacy domain is semantically compatible, but cannot automatically be translated into source-stable vNext authoring. Examples include adapter contracts, complex templates or router metadata.

## Hard Errors

These cases block the affected entry:

- Legacy JSON cannot be parsed.
- Legacy JSON cannot be normalized.
- vNext source does not compile.
- The semantic legacy roundtrip is not stable.

## Recommended Migration

1. Run `rmt-vnext-compatibility` against existing fixtures.
2. Read reports with `migrationMode: "report-only"` and triage boundary warnings.
3. Create `preview` for individual files.
4. Manually review the preview draft and bring it to vNext authoring conventions.
5. Run parser, compiler, regression and release gate.

```bash
node scripts/run_xtend_tests.js rmt-vnext-compatibility rmt-vnext-regression rmt-vnext-release --json
```

## Handoff

This epic delivers syntax, compiler, tooling, compatibility, regression and release handoff. Productive runtime adapters for vNext Core and a formatter/writer belong in follow-up epics.
