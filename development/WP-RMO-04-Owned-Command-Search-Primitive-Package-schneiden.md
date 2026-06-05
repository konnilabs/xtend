# WP-RMO-04 - Owned Command/Search Primitive Package schneiden

- Status: `completed`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json`
- Package Script: `npm run test:rmt-owned-command-search-primitives`

## Ziel

Command/Search wird als eigenes XTend-Primitive-Paket geschnitten. Der Scope akzeptiert RMT-Authoring fuer registrierte Commands, Search Resources, Result State und Overlay/Focus Policy, ohne physische Command-Palette-, Autocomplete- oder rich Combobox-Komponenten voreilig als produktionsfertig zu claimen.

## Umgesetzte Artefakte

| Artefakt | Status |
|----------|--------|
| `development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md` | erfuellt |
| `development/XTend-RMT-Owned-Command-Search-Primitives-Matrix.md` | erfuellt |
| `tests/fixtures/native-first/rmt-owned-command-search-primitives-fixtures.json` | erfuellt |
| `tests/fixtures/rmt-owned-command-search-primitives.rmt` | erfuellt |
| `tests/native-first/rmt_owned_command_search_primitives_suite.js` | erfuellt |

## Entscheidungen

| Entscheidung | Ergebnis |
|--------------|----------|
| `command-search-parity` | `scoped-owned-command-search-package` |
| Command Source | akzeptiert als RMT `commandSources[]` Record mit registrierten Action-Refs |
| Search Resource | akzeptiert als RMT `searchSources[]` Record mit Resource, debounce, Loading, Empty, Error und Selection |
| Overlay/Focus | akzeptiert als Policy-Handoff an bestehende Overlay-/Popover-/Focus-Gates |
| `x-command-palette` | deferred bis Keyboard-, ARIA-, Browser- und Visual-Evidence vorliegt |
| `x-autocomplete` | deferred bis async-, IME-, Browser- und A11y-Evidence vorliegt |
| `x-combobox` | deferred bis ARIA-Combobox-, Listbox- und active-descendant-Evidence vorliegt |

## Definition of Done

| Kriterium | Ergebnis |
|-----------|----------|
| `command-search-parity` ist entweder geschlossen oder bewusst eingegrenzt | erfuellt: `scoped-owned-command-search-package` |
| Command/Search ist mit RMT Actions, Effects und Resources authorbar | erfuellt: `commandSources[]`, `searchSources[]`, `actions[]`, `effects[]`, `resources[]` |
| Overlay-/Focus-Gates bleiben gruen | erfuellt: Gate verankert `native-first-overlay-focus` und `overlay-interaction-ux` als Source-Gates |
| keine neue Runtime-Dependency entsteht | erfuellt |
| keine Framework-API-Emulation wird Produktvertrag | erfuellt |
| lokaler Gate ist gruen | erfuellt: `node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json` |

## Handoff

`WP-RMO-05` kann Data Display und Command/Search gemeinsam in RMT Complete-UI-Recipes erweitern. `WP-RMO-06` uebernimmt Browser-Lab und Visual Evidence fuer Command/Search-Flows. `WP-RMO-07` uebernimmt Runtime-Parity, Budget und physische Component-Claims fuer `x-command-palette`, `x-autocomplete` und `x-combobox`.
