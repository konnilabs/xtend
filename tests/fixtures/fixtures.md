# Fixture Conventions

Fixtures are shared test inputs. They are not production assets and must not be imported by runtime code.

## Rules

- Keep fixtures small and explicit.
- Prefer one fixture per behavior or contract.
- Name fixtures after the contract they exercise.
- Keep generated or temporary files outside this directory.
- Treat plain `.rmt` files as vNext authoring sources.
- Commit matching `*.core.json` sidecars when runtime or legacy-parity tests need normalized Core/App-Platform records.
- Document any fixture that represents legacy behavior and mark it explicitly, for example with `.legacy.rmt`.

## Planned Fixture Types

- HTML host pages for browser smoke tests
- manifest snippets
- component host documents
- state payloads
- XTendRMT `.rmt` vNext authoring documents
- XTendRMT `*.core.json` runtime/parity sidecars

## XTendRMT Fixtures

- `rmt-template-only.legacy.rmt`: legacy Template-only document for backward-compatible normalization.
- `rmt-app-dsl.normalized.rmt`: vNext authoring source for the native App-DSL fixture; `rmt-app-dsl.normalized.core.json` preserves the normalized runtime contract.
- `rmt-app-dsl.missing-refs.rmt`: vNext authoring source for negative reference diagnostics; `rmt-app-dsl.missing-refs.core.json` preserves the negative runtime contract.
- `rmt-app-dsl.native-bridge.rmt`: vNext authoring source for route/component/schedule adapter regression; `rmt-app-dsl.native-bridge.core.json` preserves ESM and browser-near runtime probes.
