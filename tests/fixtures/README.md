# Test Fixtures

Fixture files live here when they are shared by more than one test area.

Expected fixture types:

- HTML pages for browser smoke tests
- manifest snippets
- component host documents
- sample state payloads
- XTendRMT integration fixtures

XTendRMT authoring rule:

- Plain `.rmt` fixtures use vNext authoring syntax.
- Matching `*.core.json` files are committed runtime/parity artifacts for tests that still need normalized Core/App-Platform records.
- Legacy JSON-RMT is only allowed for explicitly named compatibility fixtures, such as `*.legacy.rmt` and the regression fixtures under `tests/rmt-language/fixtures`.

Current XTendRMT normalization fixtures:

- `rmt-template-only.legacy.rmt` plus its legacy compatibility assertions
- `rmt-app-dsl.normalized.rmt` with `rmt-app-dsl.normalized.core.json`
- `rmt-app-dsl.missing-refs.rmt` with `rmt-app-dsl.missing-refs.core.json`
- `rmt-app-dsl.native-bridge.rmt` with `rmt-app-dsl.native-bridge.core.json`

Fixtures must not become production dependencies.

See `fixtures.md` for naming and ownership rules.
