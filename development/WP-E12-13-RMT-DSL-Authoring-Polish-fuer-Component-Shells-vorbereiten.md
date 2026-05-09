# WP-E12-13 - RMT DSL Authoring Polish fuer Component Shells vorbereiten

- Status: `completed`
- Datum: 8. Mai 2026
- Workpackage Contract: `xtend.epic12.wp13.rmt-dsl-authoring-polish.v1`
- Produkt-Contract: `xtend.rmt.dsl-authoring-polish.v1`
- Report: `xtend.rmt.dsl-authoring-polish-report.v1`
- Fixture: `xtend.rmt.dsl-authoring-polish-fixture.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json`

## Ziel

RMT DSL Authoring fuer Component Shells, Styles, A11y, Events, Commands, Slots und Routing wird so vorbereitet, dass XTendRMT upstream spaeter nur noch Syntax, Parser-Fehler und Editor-Komfort verbessern muss.

XTend bleibt Host- und Adapter-Produkt. Der RMT Kernel importiert keine XTend-Komponenten oder XTend-Typen.

## Umgesetzte Artefakte

- `xtend-builder/typing/rmt-dsl-authoring-polish.js`
  - Factory `createRmtDslAuthoringPolishPlan()`
  - Validator `validateRmtDslAuthoringPolishPlan()`
  - Fixture-Validator `validateRmtDslAuthoringPolishFixture()`
- `tests/fixtures/rmt-dsl-authoring-polish.rmt`
  - Alias-Beispiele fuer Shell, Slot, Style, Token, A11y, Hydration, Lane, Route, Link und Outlet
  - Diagnosefixtures fuer alle `rmt.dsl.*` Codes
- `tests/rmt/rmt_dsl_authoring_polish_suite.js`
  - Contract-, Fixture-, Package-, Scaffold-, Docs-, Backlog- und RC-Modell-Gate
- `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
  - akzeptierter Authoring-Polish-Contract
- `docs/rmt-dsl-authoring-polish.md`
  - Entwicklerdokumentation fuer Alias-Plan, Routing-Sugar und Diagnostik

## Alias- und Diagnoseumfang

Der akzeptierte Aliasumfang ist:

`component`, `shell`, `slot`, `style`, `token`, `theme`, `density`, `a11y`, `on`, `command`, `hydrate`, `lane`, `route`, `link`, `outlet`.

Der akzeptierte Diagnoseumfang ist:

`rmt.dsl.alias.unknown`, `rmt.dsl.alias.required-field-missing`, `rmt.dsl.token.unknown`, `rmt.dsl.route.target-unresolved`, `rmt.dsl.link.route-unresolved`, `rmt.dsl.slot.target-unresolved`, `rmt.dsl.schedule.unresolved`, `rmt.dsl.inline-runtime-code-refused`, `rmt.dsl.kernel-boundary.refused`.

## Handoff

`WP-E12-14` kann nun die RC0 Gate Matrix schneiden. Der neue Gate `rmt-dsl-authoring-polish` ist Kandidat fuer die Release-Candidate-Authoring-Schiene, zusammen mit `rmt-shell-authoring-ux`, `design-tokens`, `visual-snapshots` und `references`.

## Akzeptanz

- RMT DSL Authoring Polish ist maschinenlesbar und testbar.
- XRouter-/XLink-Routing-Sugar ist als Adapterdaten modelliert.
- produktive `--xtend-*` Tokens aus `xtend.design-tokens.product-contract.v1` werden genutzt.
- `no-rmt-kernel-import-of-xtend-types` bleibt in Contract, Fixture, Package Metadata und Docs sichtbar.
