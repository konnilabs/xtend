# XTensions Static Contract Introspection Contract

- Status: `accepted-by-XTN-04`
- Datum: 2026-06-20
- Workpackage: `XTN-04`
- Introspection Schema: `xtend.xtensions.static-introspection.v1`
- Static Contract Schema: `xtend.xtensions.static-contract.v1`
- Source Schema: `xtend.xtensions.static-contract-source.v1`
- Index Schema: `xtend.xtensions.static-contract-index.v1`
- Drift Report Schema: `xtend.xtensions.static-contract-drift-report.v1`
- LSP Index Schema: `xtend.xtensions.static-contract-lsp-index.v1`
- DevTools Panel Schema: `xtend.xtensions.static-contract-devtools-panel.v1`
- AI-Agent Report Schema: `xtend.xtensions.static-contract-ai-agent-report.v1`
- Diagnostic Schema: `xtend.xtensions.static-contract-diagnostic.v1`
- Report Schema: `xtend.xtensions.static-introspection-report.v1`
- Module: `tools/xtensions/static-contract-introspection.js`
- Types: `tools/xtensions/static-contract-introspection.d.ts`
- Fixture: `tests/fixtures/xtensions/static-introspection-valid.json`
- Source Fixture: `tests/fixtures/xtensions/static-introspection-module.mjs`
- Local Gate: `node scripts/run_xtend_tests.js xtensions-static-introspection --json`
- Depends on: `xtend.xtensions.host-controller.v1`
- Depends on: `xtend.xtensions.signal-bridge.v1`
- Depends on: `xtend.maraca.xtension-manifest.v1`
- Boundary: `static-introspection-never-executes-framework-hosts`
- Boundary: `XTENSION_CONTRACT-is-json-compatible-static-data`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-framework-test-fixture-dependencies-in-xtend-package`

## Zweck

Dieser Contract macht XTension-Contracts fuer LSP, DevTools und AI-Agenten lesbar, ohne Framework-Code auszufuehren. Tooling darf Source-Text, Maraca-Manifeste und Build-Artefakte lesen. Es darf keine HostController-Module importieren, keine Framework-Runtime starten und keine Adapter-Factories ausfuehren.

## Static Export

Ein XTension-Modul kann einen statischen Export bereitstellen:

```js
export const XTENSION_CONTRACT = {
  "schema": "xtend.xtensions.static-contract.v1",
  "id": "xtension.react.todo",
  "framework": "react",
  "version": "0.0.0-contract",
  "accepts": ["props.update"],
  "emits": ["xtension.react.todo.submitted.v1"],
  "capabilities": ["host.lifecycle.mount"]
};
```

`XTENSION_CONTRACT` muss JSON-kompatibel sein. XTN-04 liest diesen Export statisch aus Source-Text; es nutzt kein `import()`, kein `require()` und kein `eval()`.

## Contract Shape

Ein statischer Contract enthaelt:

- `id`
- `framework`
- `version`
- `hostControllerSchema`
- `signalBridgeSchema`
- `kernelSignalSchema`
- `surfaceEventSchema`
- `accepts`
- `emits`
- `capabilities`
- `source.runtimeExecutionRequired: false`
- `contractFingerprint`

Fehlende `accepts`, `emits` oder `capabilities` sind blockierende Diagnostics.

## Tooling Records

XTN-04 erzeugt vier Tooling-Artefakte:

| Record | Zweck |
|--------|-------|
| `xtend.xtensions.static-contract-index.v1` | Contract-Index nach Framework, accepts, emits und capabilities |
| `xtend.xtensions.static-contract-lsp-index.v1` | Completion- und Symbol-Daten fuer LSP |
| `xtend.xtensions.static-contract-devtools-panel.v1` | DevTools-zeilenfaehige Contract-Uebersicht |
| `xtend.xtensions.static-contract-ai-agent-report.v1` | Diagnostics und sichere Reparaturhinweise fuer AI-Agenten |

## Drift Detection

Source-Contract und Maraca-Manifest-/Artefakt-Snapshot duerfen nicht auseinanderlaufen. Der Drift Report vergleicht:

- `accepts`
- `emits`
- `capabilities`

Drift erzeugt `xtensions.static_introspection.contract_drift_detected` und AI-Reparaturhinweise.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtensions.static_introspection.static_export_missing` | `XTENSION_CONTRACT` fehlt |
| `xtensions.static_introspection.static_export_parse_failed` | `XTENSION_CONTRACT` ist nicht JSON-kompatibel lesbar |
| `xtensions.static_introspection.accepts_missing` | `accepts` fehlt oder ist leer |
| `xtensions.static_introspection.emits_missing` | `emits` fehlt oder ist leer |
| `xtensions.static_introspection.capability_missing` | `capabilities` fehlt oder ist leer |
| `xtensions.static_introspection.schema_missing` | Static Contract Schema fehlt oder ist falsch |
| `xtensions.static_introspection.runtime_execution_forbidden` | Introspection wuerde Runtime-Ausfuehrung verlangen |
| `xtensions.static_introspection.contract_drift_detected` | Source und Build-Artefakt driften |
| `xtensions.static_introspection.framework_dependency` | Source/Package versucht echte Framework-Imports |

## Dependency Policy

XTN-04 bleibt frameworkless. Frameworknamen sind Daten in Contracts, aber Source-Fixtures, Root-Manifeste und Test-Gates duerfen keine echten React-, Vue-, Three.js-, Leaflet- oder Chart.js-Imports oder Dependencies einfuehren.

## Source of Truth

- Static Extractor: `extractXTensionContractFromSource()`
- Contract Index: `createXTensionsStaticContractIndex()`
- LSP Index: `createXTensionsLspIndex()`
- DevTools Panel: `createXTensionsDevToolsPanel()`
- AI-Agent Report: `createXTensionsAiAgentReport()`
- Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`

## Verification

Auszufuehren nach Aenderungen:

```bash
node scripts/run_xtend_tests.js xtensions-static-introspection --json
node scripts/run_xtend_tests.js maraca-xtensions --json
node scripts/run_xtend_tests.js xtensions-host-controller --json
node scripts/run_xtend_tests.js xtensions-signal-bridge --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```
