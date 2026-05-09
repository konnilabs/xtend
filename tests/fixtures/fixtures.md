# Fixture Conventions

Fixtures are shared test inputs. They are not production assets and must not be imported by runtime code.

## Rules

- Keep fixtures small and explicit.
- Prefer one fixture per behavior or contract.
- Name fixtures after the contract they exercise.
- Keep generated or temporary files outside this directory.
- Document any fixture that represents legacy behavior.

## Planned Fixture Types

- HTML host pages for browser smoke tests
- manifest snippets
- component host documents
- state payloads
- XTendRMT `.rmt` documents

## XTendRMT Fixtures

- `rmt-template-only.legacy.rmt`: legacy Template-only document for backward-compatible normalization.
- `rmt-app-dsl.normalized.rmt`: native App-DSL document with adapters, components, routes, schedules and templates.
- `rmt-app-dsl.missing-refs.rmt`: negative reference fixture for DSL diagnostics.
- `rmt-app-dsl.native-bridge.rmt`: native bridge fixture for route/component/schedule adapter regression across ESM and browser-near runtime probes.
