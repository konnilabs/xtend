# RMT vNext Release Handoff

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Report Contract: `xtend.rmt.vnext-release-handoff-report.v1`
- Gate Matrix: `xtend.rmt.vnext-release-gate-matrix.v1`
- Workpackage: `WP-E15-18`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-release --json`

Epic 15 ist mit dem vNext Release Handoff source-ready. Die neue Syntax ist dokumentiert, die Referenzdemo kompiliert byte-stabil in Core JSON, und die lokale Release-Matrix buendelt Parser, Compiler, Semantikmodule, Tooling, Migration, Regression, Browser-Smoke und Referenzpfade.

## Release Gates

```bash
npm run test:rmt-vnext-parser
npm run test:rmt-semantic-graph
npm run test:rmt-vnext-compiler
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

## Optional Browser Evidence

```bash
npm run test:rmt-vnext-source-to-sea
npm run test:rmt-vnext-source-to-sea:evidence
npm run test:rmt-vnext-source-to-sea:chromedriver
npm run test:rmt-vnext-source-to-sea:validate-artifact
```

In GitHub Actions, this evidence runs only through manual `workflow_dispatch`
with `run_source_to_sea=true`.

Der Self-Gate fuer diesen Abschluss ist:

```bash
npm run test:rmt-vnext-release
```

## Reference Demo

- Source: `xtendrmt/rmt-vnext-reference-demo.rmt`
- Core Output: `xtendrmt/rmt-vnext-reference-demo.core.json`
- Browser Probe: `tests/browser/fixtures/rmt-vnext-reference-smoke.html`

Die Demo deckt die volle vNext-MVP-Flaeche ab:

- `template`
- `surface`
- `lane ... weight`
- Lifecycle-Operationen
- `when` Conditions
- `slot` Composition
- `on ... -> action ...`
- `from endpoint`, `from sse`, `from worker`
- `trust boundary`
- `sanitize html`
- `stream`

## Accepted Residuals

| Residual | Status | Folgepfad |
| --- | --- | --- |
| produktive Runtime-Adapter fuer vNext Core | planned-follow-up | `rmt-vnext-runtime-adapters` |
| Formatter und Writer API | planned-follow-up | `rmt-vnext-formatter-writer` |
| Workspace Project Index, Rename und References | planned-follow-up | `rmt-vnext-project-index` |
| Editor Marketplace Distribution | planned-follow-up | `rmt-vnext-editor-distribution` |

## Abschlussentscheidung

RMT vNext ist als Syntax-, Compiler-, Tooling-, Compatibility- und Regression-Schicht akzeptiert. Der Handoff ist kein oeffentlicher Runtime-Release; er markiert den Zustand `rmt-vnext-release-ready` und uebergibt Runtime-Adapter, Formatter und Workspace-Index als klar getrennte Folgearbeiten.
