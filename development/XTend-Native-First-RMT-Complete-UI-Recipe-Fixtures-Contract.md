# XTend Native-First RMT Complete UI Recipe Fixtures Contract

- Status: `accepted by NFM-WP-17`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-17-Complete-UI-Recipe-Fixtures-fuer-App-Form-Overlay-Dashboard-und-Media-UIs-bauen.md`
- Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Recipe Matrix: `xtend.native-first.rmt-complete-ui-recipe-matrix.v1`
- Recipe Item Schema: `xtend.native-first.rmt-complete-ui-recipe.v1`
- Fixture Schema: `xtend.native-first.rmt-complete-ui-recipe-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1`
- Source Syntax Growth Contract: `xtend.native-first.rmt-syntax-growth.v1`
- Source Action Effect Data Resource Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- Source Gap Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- Source App Platform Contract: `xtend.epic18.rmt-app-platform-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json`
- Package Script: `npm run test:rmt-complete-ui-recipes`
- Boundary: `complete-ui-recipes-are-fixtures-not-runtime`
- Boundary: `no-free-runtime-execution`
- Boundary: `no-inline-javascript-or-unsafe-html-sink`
- Boundary: `owned-primitive-residuals-remain-negative-claims`
- Boundary: `browser-smokes-and-visual-evidence-are-plans-until-wp18-wp19`
- Boundary: `no-new-runtime-dependency`
- Zielzustand: `rmt-complete-ui-recipe-fixtures-accepted`

## Zweck

WP-17 beweist auf Fixture-Ebene, welche vollstaendigen UI-Klassen aus den Native-First-RMT-Entscheidungen authorbar sind. Das Paket baut keine neue Runtime und keine neue UI-Framework-Abhaengigkeit. Es verdichtet die Entscheidungen aus WP-14, WP-15 und WP-16 zu Recipe-Fixtures, die App Shell, Dashboard, CRUD Form, Modal Workflow, Navigation, Data Display, Command/Search, Media und Docs Flow pruefbar machen.

Die Recipes sind bewusst produktnah, aber nicht marketinggetrieben: Jede Zeile benennt RMT-Domains, Core Records, owned XTend-Primitives, Runtime-Gates, Browser-Smoke-Plan, Golden-Fixture-Plan, Visual-Evidence-Plan und blockierte Claims.

## Recipe Schema

Pflichtfelder je Recipe-Zeile:

- `recipeId`
- `recipeClass`
- `sourceGaps`
- `sourceSyntaxDecisions`
- `sourcePrimitiveDecisions`
- `status`
- `uiSurfaces`
- `rmtDomains`
- `coreRecordPlan`
- `ownedPrimitiveUse`
- `runtimeGates`
- `browserSmokePlan`
- `goldenFixturePlan`
- `visualEvidencePlan`
- `policyPlan`
- `blockedClaims`
- `sourceMapPlan`
- `fixture`
- `expectedOutcome`
- `owner`
- `nextHandoff`

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `recipe-accepted` | Recipe ist mit vorhandenen owned Primitives, RMT-Records und lokalen Gates authorbar |
| `recipe-accepted-with-adapter-residual` | Recipe ist authorbar, braucht aber Host-, Router-, DataSource- oder Docs-Adapter |
| `recipe-accepted-with-renderer-proof-residual` | Recipe ist authorbar, aber WP-18 muss Renderer-, Trusted-DOM- oder Surface-Proofs liefern |
| `recipe-blocked-owned-primitive` | Recipe bleibt als negative Fixture erhalten, bis ein owned Primitive-Paket existiert |

## Pflichtgrenzen

- Complete-UI-Recipes sind Fixture- und Evidence-Artefakte, keine neue Runtime.
- RMT-Authoring bleibt declarativ und JSON-kompatibel.
- Inline-JavaScript, Eval, freie Handler-Funktionen und unsichere HTML-Sinks bleiben verboten.
- DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- und rich-Combobox-Claims bleiben blockiert, bis owned Primitive-Pakete existieren.
- Browser-Smokes und Visual-Evidence-IDs sind planbare Gate-Oberflaechen; vollstaendige Browser- und Renderer-Beweise folgen in WP-18/WP-19.
- Keine Recipe-Zeile darf eine neue Runtime-Dependency, eine externe UI-Framework-Kopplung oder einen RMT-Kernel-Import von Host-/Browser-Typen verlangen.

## Source Gates

```bash
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
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
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js references --json
```

## Nicht-Ziele

- keine produktive Implementierung von RMT Syntax Growth
- keine neue Browser-Smoke-Infrastruktur in diesem Paket
- kein Visual-Diff-System in diesem Paket
- keine Freigabe blockierter Data Display oder Command/Search Produktclaims
- keine Framework-API-Emulation und kein Wechsel auf ein externes UI-Framework

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `NFM-WP-18` | prueft Renderer-, DOM-Descriptor-, Trusted-DOM-, Portal-, Overlay- und Bypass-Proofs fuer Recipe-Oberflaechen |
| `NFM-WP-19` | definiert Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budgets fuer die Recipes |
| `NFM-WP-20` | baut Authoring Guides aus den akzeptierten Recipes |
| `owned-data-display-package` | muss Data Display Recipes von blocked zu accepted heben |
| `owned-command-search-package` | muss Command/Search Recipes von blocked zu accepted heben |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| App Shell, Dashboard, CRUD Form, Modal Workflow, Navigation, Data Display, Command/Search, Media und Docs Flow sind als Recipes erfasst | erfuellt |
| Jede Recipe-Zeile verweist auf WP-15- und/oder WP-16-Entscheidungen | erfuellt |
| Browser-Smoke-, Golden-Fixture- und Visual-Evidence-Plaene sind pro Recipe vorhanden | erfuellt |
| Blockierte UI-Claims bleiben als negative Fixtures sichtbar | erfuellt |
| Kein neues Runtime-Dependency oder externes UI-Framework wird eingefuehrt | erfuellt |
