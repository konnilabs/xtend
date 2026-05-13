# WP-TypeExports-04 - XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.rmt-declarations.v1`
- Report: `xtend.type-exports.rmt-declarations-report.v1`
- Zielreife: `rmt-runtime-language-types-ready`
- Lokaler Gate: `node scripts/run_xtend_tests.js type-exports-rmt --json`
- Package Script: `npm run test:type-exports-rmt`
- Report-Artefakt: `.xtend-test-results/xtend-type-exports-rmt-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Ergebnis

`./rmt` und `./rmt/browser` besitzen jetzt package-native `types`-Conditions auf `./xtendrmt/rmt-core.d.ts`. Die Runtime-Ziele bleiben unveraendert: ESM nutzt `xtendrmt/rmt-runtime.esm.js`, Browser nutzt `xtendrmt/rmt-runtime.browser.js`.

Fuer die RMT-Language-, LSP-, Linter- und Editor-Exports wurde ein Declaration-Set ergaenzt:

- `tools/rmt-language/rmt-tooling-public-types.d.ts`
- `tools/rmt-language/source-model.d.ts`
- `tools/rmt-language/parser.d.ts`
- `tools/rmt-language/vnext-*.d.ts`
- `tools/rmt-language/diagnostics.d.ts`
- `tools/rmt-language/completions.d.ts`
- `tools/rmt-language/hover.d.ts`
- `tools/rmt-language/symbols.d.ts`
- `tools/rmt-language/definitions.d.ts`
- `tools/rmt-language/code-actions.d.ts`
- `tools/rmt-language-server/*.d.ts`
- `tools/rmt-linter/*.d.ts`
- `tools/rmt-editor/vscode/extension.d.ts`

## Gate

Der neue Catalog `catalog/type-exports-rmt.js` und die Suite `tests/types/rmt_type_exports_suite.js` pruefen:

- alle RMT Package Exports besitzen die erwartete `types`-Condition
- alle Declaration-Dateien existieren
- Runtime-Symbole der JS-Module sind in den Facade-Declarations sichtbar
- zentrale Typen wie `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` und `RmtJsonRpcMessage` bleiben stabil
- RMT Runtime-Dateien importieren keine `.d.ts`
- RMT-Kernel importiert keine XTend-UI-Typen, Loader-, API-, Fabric-, A11y- oder Security-Runtime

## Handoff

`WP-TypeExports-05` kann nun Fabric-, A11y- und Security-Policy-APIs typisieren. Das Muster fuer P1-Integrationsmodule ist gesetzt: bestehende JS-Runtime, schmale `.d.ts`-Facades, package-native `types`-Conditions und Drift-Gates.
