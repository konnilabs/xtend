# RMT vNext Release Handoff

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Report contract: `xtend.rmt.vnext-release-handoff-report.v1`
- Gate matrix: `xtend.rmt.vnext-release-gate-matrix.v1`
- Workpackage: `WP-E15-18`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-release --json`

Epic 15 is source-ready with the vNext release handoff. The new syntax is documented, the reference demo compiles byte-stably into Core JSON, and the local release matrix bundles parser, compiler, semantic modules, tooling, migration, regression, browser smoke and reference paths.

## Release Gates

```bash
npm run test:rmt-vnext-parser
npm run test:rmt-semantic-graph
npm run test:rmt-vnext-compiler
npm run test:rmt-vnext-source-to-sea
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-lifecycle
npm run test:rmt-vnext-scheduler
npm run test:rmt-vnext-surfaces
npm run test:rmt-vnext-conditions
npm run test:rmt-vnext-composition
npm run test:rmt-vnext-imports
npm run test:rmt-vnext-events
npm run test:rmt-vnext-security
npm run test:rmt-vnext-streaming
npm run test:rmt-vnext-tooling
npm run test:rmt-vnext-compatibility
npm run test:rmt-vnext-regression
npm run test:rmt-vnext-primitives:report
npm run test:browser
npm run test:references
```

The self gate for this closure is:

```bash
npm run test:rmt-vnext-release
```

## Reference Demo

- Source: `xtendrmt/rmt-vnext-reference-demo.rmt`
- Core output: `xtendrmt/rmt-vnext-reference-demo.core.json`
- Browser probe: `tests/browser/fixtures/rmt-vnext-reference-smoke.html`

The demo covers the full vNext MVP surface:

- `template`
- `surface`
- `lane ... weight`
- lifecycle operations
- `when` conditions
- `slot` composition
- `on ... -> action ...`
- `from endpoint`, `from sse`, `from worker`
- `trust boundary`
- `sanitize html`
- `stream`

## Accepted Residuals

| Residual | Status | Follow-up path |
| --- | --- | --- |
| productive runtime adapters for vNext Core | planned-follow-up | `rmt-vnext-runtime-adapters` |
| formatter and writer API | planned-follow-up | `rmt-vnext-formatter-writer` |
| Workspace Project Index, Rename and References | planned-follow-up | `rmt-vnext-project-index` |
| Editor Marketplace Distribution | planned-follow-up | `rmt-vnext-editor-distribution` |

## Closure Decision

RMT vNext is accepted as syntax, compiler, tooling, compatibility and regression layer. The handoff is not a public runtime release; it marks the state `rmt-vnext-release-ready` and hands runtime adapters, formatter and workspace index over as clearly separated follow-up work.
