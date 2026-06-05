# NFM-WP-17 - Complete-UI-Recipe-Fixtures fuer App-, Form-, Overlay-, Dashboard- und Media-UIs bauen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Recipe Matrix: `xtend.native-first.rmt-complete-ui-recipe-matrix.v1`
- Recipe Item Schema: `xtend.native-first.rmt-complete-ui-recipe.v1`
- Fixture Schema: `xtend.native-first.rmt-complete-ui-recipe-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json`
- Package Script: `npm run test:rmt-complete-ui-recipes`
- Fuehrender Contract: `development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md`
- Fuehrende Matrix: `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json`

## Ziel

WP-17 belegt, dass RMT praktisch relevante UI-Klassen als Complete-UI-Recipes authoren kann. Das Paket setzt auf WP-15 Syntax Growth, WP-16 Action-/Resource-Primitives, Epic18 App Platform Fixtures und bestehende Native-First-Component-Gates auf. Es fuegt keine Runtime, kein externes UI-Framework und kein Browser-Smoke-System hinzu.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| `development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md` | definiert Contract, Recipe Schema, Statusmodell, Grenzen, Source Gates und Handoffs |
| `development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md` | erfasst neun Complete-UI-Recipes mit positiven, residualen und blockierten Outcomes |
| `tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json` | enthaelt maschinenlesbare Recipe-Fixtures mit Smoke-, Golden- und Visual-Evidence-Plaenen |
| `tests/native-first/native_first_rmt_complete_ui_recipe_suite.js` | prueft Contract, Matrix, Fixtures, Quellen, Registry, Roadmap, Package-Metadaten und Runner |
| `package.json` | ergaenzt `xtend.nativeFirstRmtCompleteUiRecipes` und `npm run test:rmt-complete-ui-recipes` |
| `scripts/run_xtend_tests.js` | registriert Suite-ID `rmt-complete-ui-recipes` |
| `development/XTend-Native-First-Contract-Registry.md` | fuehrt WP-17 als Native-First-Contract-Index-Eintrag |

## Recipe Outcomes

| Status | Anzahl | Recipes |
|--------|--------|---------|
| `recipe-accepted` | 2 | `NFM-RCR-03`, `NFM-RCR-08` |
| `recipe-accepted-with-adapter-residual` | 4 | `NFM-RCR-01`, `NFM-RCR-02`, `NFM-RCR-05`, `NFM-RCR-09` |
| `recipe-accepted-with-renderer-proof-residual` | 1 | `NFM-RCR-04` |
| `recipe-blocked-owned-primitive` | 2 | `NFM-RCR-06`, `NFM-RCR-07` |

## Positive Recipe-Oberflaechen

| UI-Klasse | Fuehrende Recipes | Entscheidung |
|-----------|-------------------|--------------|
| App Shell und Routing | `NFM-RCR-01` | authorbar mit Router-Adapter-Residual |
| Dashboard Composition | `NFM-RCR-02` | authorbar mit Data-Display-Residual |
| CRUD Form Workflow | `NFM-RCR-03` | authorbar |
| Modal Overlay Workflow | `NFM-RCR-04` | authorbar mit Renderer-/Trusted-DOM-Proof-Residual |
| Navigation Flow | `NFM-RCR-05` | authorbar mit Router-Adapter-Residual |
| Media Resource Preview | `NFM-RCR-08` | authorbar |
| Docs Flow Progressive Boot | `NFM-RCR-09` | authorbar mit Hydration-/Release-Gate-Residual |

## Blockierte Claims

| Claim | Entscheidung |
|-------|--------------|
| fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet | bleibt blockiert bis `owned-data-display-package` existiert |
| fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | bleibt blockiert bis `owned-command-search-package` existiert |
| fertiger produktiver Browser-Smoke- und Visual-Diff-Claim | bleibt bis `NFM-WP-19` Budget- und Evidence-Gates offen |
| vollstaendige Surface-/Portal-/Overlay-Maximality | bleibt bis `NFM-WP-18` Renderer- und Trusted-DOM-Proofs offen |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-composition --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-vnext-events --json
node scripts/run_xtend_tests.js rmt-vnext-security --json
node scripts/run_xtend_tests.js rmt-component-template-primitives --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-state-selector-runtime --json
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

| Folgepaket | Startstatus nach WP-17 |
|------------|------------------------|
| `NFM-WP-18` | `ready`; kann Renderer-, DOM-Descriptor-, Trusted-DOM-, Portal-, Overlay- und Bypass-Proofs gegen Recipe-Evidence bauen |
| `NFM-WP-19` | `ready`; kann Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets fuer Recipes definieren |
| `NFM-WP-20` | `planned`; kann Authoring Guides aus akzeptierten Recipes ableiten |
| `owned-data-display-package` | `planned`; bleibt Voraussetzung fuer Data Display Produktclaims |
| `owned-command-search-package` | `planned`; bleibt Voraussetzung fuer Command/Search Produktclaims |

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Complete-UI-Recipes fuer App Shell, Dashboard, CRUD Form, Modal Workflow, Navigation, Data Display, Command/Search, Media und Docs Flow existieren | erfuellt |
| Jedes Recipe besitzt Browser-Smoke-, Golden-Fixture- und Visual-Evidence-Plan | erfuellt |
| Jedes Recipe referenziert WP-15- und/oder WP-16-Entscheidungen | erfuellt |
| Blockierte Data Display und Command/Search Claims bleiben negative Fixtures | erfuellt |
| `NFM-WP-18` und `NFM-WP-19` sind startbar | erfuellt |
