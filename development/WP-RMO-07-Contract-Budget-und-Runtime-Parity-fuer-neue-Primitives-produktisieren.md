# WP-RMO-07 - Contract-, Budget- und Runtime-Parity fuer neue Primitives produktisieren

- Status: `completed`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-contract-budget-runtime-parity-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json`
- Package Script: `npm run test:rmt-owned-contract-budget-runtime-parity`

## Ziel

Data Display, Command/Search, RMO Recipes und Browser-Lab/Visual-Evidence werden so produktisiert, dass Contract Registry, Runtime Parity, Audit Evidence und Budget Gates die neuen Contract-IDs und Artefakte referenzieren koennen.

## Artefakte

| Artefakt | Status |
|----------|--------|
| `development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md` | erfuellt |
| `development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Matrix.md` | erfuellt |
| `tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json` | erfuellt |
| `tests/native-first/rmt_owned_contract_budget_runtime_parity_suite.js` | erfuellt |
| `package.json` Metadaten `xtend.rmtOwnedContractBudgetRuntimeParity` | erfuellt |
| `scripts/run_xtend_tests.js` Suite-ID `rmt-owned-contract-budget-runtime-parity` | erfuellt |

## Entscheidungen

| Thema | Entscheidung |
|-------|--------------|
| Registry | RMO-Contract-IDs werden als indexierbare Update-Entries produktisiert, ohne eine neue Runtime Registry einzufuehren |
| Runtime Parity | RMO-Contracts werden auf RMT-Fixtures, Browser-Lab-Artefakte, Event-/Action-Runtime und Source-Map-Erwartungen gemappt |
| Audit Evidence | Evidence Items bleiben `public-contract` oder `redacted-public-contract-evidence`; keine geheimen oder lokalen Absolutpfade |
| Budget Gates | Collection, Command/Search, Route, CLS, Mutation und Dependency-Deltas sind als RMO-Budget-Entries sichtbar |
| Residuals | Deferred physische Components bleiben ownerbar und erzeugen keine Vollstaendigkeitsclaims |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Release- und Audit-Reports koennen neue Contract-IDs referenzieren | erfuellt: Registry Entries in Matrix, Fixture-Pack und Package-Metadaten |
| Residuals bleiben ownerbar | erfuellt: Residual Owner fuer `x-table`, `x-virtual-list`, `x-command-palette`, `x-autocomplete`, `x-combobox` |
| `contract-registry` bleibt gruen | erfuellt: Source Gate und Regression |
| `contract-runtime-parity` bleibt gruen | erfuellt: Source Gate und Regression |
| `native-first-evidence-pack` bleibt gruen | erfuellt: Source Gate und Regression |
| `native-first-budget-gates` bleibt gruen | erfuellt: Source Gate und Regression |
| lokaler Gate ist gruen | erfuellt: `node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity --json` |

## Handoff

`WP-RMO-08` kann Migration, Deprecation und Docs-Handoff fuer Legacy/Highlighter-Residuals auf die produktisierten RMO-Contract-, Runtime-, Evidence- und Budget-Artefakte stuetzen. `WP-RMO-09` uebernimmt Release-Handoff, conditional Pixel-Artefakte und finale Residual-Entscheidung.
