# XTend Native-First RMT Syntax Growth Decision Matrix

- Status: `accepted by NFM-WP-15`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.rmt-syntax-growth.v1`
- Decision Matrix: `xtend.native-first.rmt-syntax-growth-decision-matrix.v1`
- Decision Item Schema: `xtend.native-first.rmt-syntax-growth-decision.v1`
- Migration Fixture Schema: `xtend.native-first.rmt-syntax-growth-migration-fixture.v1`
- Migration Fixture Pack: `xtend.native-first.rmt-syntax-growth-migration-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-syntax-growth-report.v1`
- Source Gap Analysis: `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md`
- Migration Fixtures: `tests/fixtures/native-first/rmt-syntax-growth-migration-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js rmt-syntax-growth --json`

## Bewertungsrahmen

WP-15 bewertet Syntax Growth nach vier Fragen:

- Schliessst die Syntax eine reale UI-Authoring-Luecke aus `NFM-WP-14`?
- Kompiliert sie deterministisch in RMT Core Records?
- Bleiben Source Maps, Diagnostics und Migration pruefbar?
- Bleiben RMT-Kernel, Trusted DOM und Dependency Diet unverletzt?

Pflichtfelder je Entscheidungszeile: `decisionId`, `sourceGap`, `proposal`, `decision`, `syntaxSurface`, `coreRecordPlan`, `sourceMapPlan`, `diagnosticPlan`, `migrationFixture`, `positiveClaim`, `negativeClaim`, `owner`, `sourceGates`, `nextHandoff`.

## Decision Matrix

| Decision-ID | Source Gap | Proposal | Decision | Syntax Surface | Core Record Plan | Source Map Plan | Diagnostic Plan | Migration Fixture | Positive Claim | Negative Claim | Owner | Source Gates | Next Handoff |
|-------------|------------|----------|----------|----------------|------------------|-----------------|-----------------|-------------------|----------------|----------------|-------|--------------|--------------|
| `NFM-RSG-01` | `NFM-RUG-01` | `route-shell-record-and-navigation-state-binding` | `accept-core-record-only` | `route-shell-record`, `navigation-state` | `routes[]`, `surfaces[]`, `events[]`, `sourceMap[]` | `route sourceRef to /routes/{index} and surface sourceRef to /surfaces/{index}` | `rmt.syntax.route.shell.surface_missing`, `rmt.syntax.route.navigation_adapter_residual` | `NFM-RSG-FIX-01` | Route Shell Records koennen vorbereitet und in Core-Records abgebildet werden | `no-native-navigation-api-product-claim` bleibt blockiert | `rmt-routing-owner` | `rmt-vnext-compiler`, `rmt-vnext-surfaces`, `rmt-app-platform-fixture`, `rmt-ui-primitive-gap` | `NFM-WP-17`, `NFM-WP-19` |
| `NFM-RSG-02` | `NFM-RUG-02` | `layout-region-slot-composition-sugar` | `accept-syntax-growth` | `layout`, `region`, `slot` | `templates[]`, `slots[]`, `components[]`, `sourceMap[]` | `layout sourceRef to /templates/{index}; region and slot sourceRefs to /slots/{index}` | `rmt.syntax.layout.region.unresolved`, `rmt.syntax.layout.slot.duplicate`, `rmt.syntax.layout.core_record_missing` | `NFM-RSG-FIX-02` | Layout-, Region- und Slot-Sugar darf geplant werden | `no-complete-layout-sugar-claim` bleibt bis Compiler- und Fixture-Umsetzung blockiert | `rmt-language-owner` | `rmt-vnext-composition`, `rmt-component-template-primitives`, `native-first-market-pattern-parity`, `rmt-ui-primitive-gap` | `NFM-WP-17` |
| `NFM-RSG-03` | `NFM-RUG-07` | `surface-region-portal-overlay-records` | `accept-syntax-growth` | `surface`, `region`, `portal`, `overlay` | `surfaces[]`, `slots[]`, `securityPolicies[]`, `sourceMap[]` | `surface sourceRef to /surfaces/{index}; portal and overlay sourceRefs to /surfaces/{index}/scope` | `rmt.syntax.surface.kind.unknown`, `rmt.syntax.portal.target_missing`, `rmt.syntax.surface.trust_policy_missing` | `NFM-RSG-FIX-03` | Surface-, Portal- und Overlay-Syntax darf als RMT-Sugar geplant werden | `no-complete-surface-maximality-claim` bleibt bis Renderer-Proof blockiert | `surface-runtime-owner` | `rmt-vnext-surfaces`, `rmt-dom-descriptor-renderer`, `rmt-native-shell-migration`, `rmt-vnext-security`, `rmt-ui-primitive-gap` | `NFM-WP-18` |
| `NFM-RSG-04` | `NFM-RUG-11` | `collection-view-record-and-owned-data-display-package` | `defer-owned-primitive` | `collection-view`, `item-template`, `empty-state` | `components[]`, `templates[]`, `dataSources[]`, `sourceMap[]` as draft-only record targets | `collection sourceRef to /components/{index} and template sourceRef to /templates/{index}` | `rmt.syntax.collection.owned_primitive_missing`, `rmt.syntax.collection.datasource_missing` | `NFM-RSG-FIX-04` | Collection View Records koennen als Vorbereitung dokumentiert werden | `no-table-tree-data-grid-virtual-list-claim` bleibt blockiert | `component-data-display-owner` | `native-first-market-pattern-parity`, `rmt-component-template-primitives`, `rmt-surface-resource-graph-runtime`, `rmt-ui-primitive-gap` | `owned-data-display-package`, `NFM-WP-17` |
| `NFM-RSG-05` | `NFM-RUG-12` | `command-source-record-and-owned-search-package` | `defer-owned-primitive` | `command-source`, `search-source`, `combobox-source` | `components[]`, `events[]`, `actions[]`, `state[]`, `resources[]`, `sourceMap[]` as draft-only record targets | `command sourceRef to /components/{index}; action sourceRef to /events/{index}` | `rmt.syntax.command.owned_primitive_missing`, `rmt.syntax.command.action_ref_missing`, `rmt.syntax.command.resource_ref_missing` | `NFM-RSG-FIX-05` | Command/Search Records koennen fuer WP-16 und Owned-Package vorbereitet werden | `no-command-palette-autocomplete-rich-combobox-claim` bleibt blockiert | `component-command-search-owner` | `native-first-market-pattern-parity`, `rmt-action-effect-runtime`, `rmt-event-routing-runtime`, `rmt-ui-primitive-gap` | `NFM-WP-16`, `owned-command-search-package` |
| `NFM-RSG-06` | `NFM-RUG-05`, `NFM-RUG-06`, `NFM-RUG-12` | `binding-action-resource-records` | `defer-to-wp16-resource-action` | `bind`, `on`, `action`, `resource` | `events[]`, `operations[]`, `dataSources[]`, `resources[]`, `sourceMap[]` | `binding sourceRef to /events/{index}; resource sourceRef to /dataSources/{index}` | `rmt.syntax.binding.free_function_call`, `rmt.syntax.resource.lifecycle_missing`, `rmt.syntax.action.effect_policy_missing` | `NFM-RSG-FIX-06` | Binding-, Action- und Resource-Syntax kann gegen WP-16 zugeschnitten werden | `no-resource-data-ui-family-claim` bleibt blockiert | `rmt-resource-action-owner` | `rmt-vnext-events`, `rmt-action-effect-runtime`, `rmt-event-routing-runtime`, `contract-runtime-parity`, `rmt-ui-primitive-gap` | `NFM-WP-16` |
| `NFM-RSG-07` | `NFM-RUG-02`, `NFM-RUG-11`, `NFM-RUG-12` | `component-composition-sugar` | `accept-syntax-growth` | `component-compose`, `part`, `slot`, `props` | `components[]`, `templates[]`, `slots[]`, `sourceMap[]` | `component sourceRef to /components/{index}; part and slot sourceRefs to /slots/{index}` | `rmt.syntax.component.part_missing`, `rmt.syntax.component.slot_contract_mismatch`, `rmt.syntax.component.prop_type_unresolved` | `NFM-RSG-FIX-07` | Component Composition Sugar darf geplant werden, wenn Component Contracts fuehren | `no-framework-api-emulation-claim` bleibt blockiert | `rmt-component-authoring-owner` | `rmt-vnext-composition`, `rmt-component-template-primitives`, `rmt-app-platform-tooling`, `native-first-market-pattern-parity` | `NFM-WP-17` |
| `NFM-RSG-08` | `cross-cutting-security-boundary` | `reject-inline-js-html-and-imperative-control-flow` | `reject-imperative-or-html-bypass` | `if`, `for`, `while`, `function`, `innerHTML`, `eval` | `none` | `none` | `rmt.syntax.imperative_control_flow_forbidden`, `rmt.syntax.inline_html_forbidden`, `rmt.syntax.inline_javascript_forbidden` | `NFM-RSG-FIX-08` | Declarative-only RMT Boundary ist bestaetigt | Inline-JavaScript, Eval, Inline-HTML und imperative Sprache bleiben verboten | `rmt-security-owner` | `rmt-vnext-security`, `rmt-dom-descriptor-renderer`, `contract-runtime-parity`, `references` | `NFM-WP-18`, `NFM-WP-20` |

## Decision Summary

| Decision | Anzahl | Decision-IDs |
|----------|--------|--------------|
| `accept-syntax-growth` | 3 | `NFM-RSG-02`, `NFM-RSG-03`, `NFM-RSG-07` |
| `accept-core-record-only` | 1 | `NFM-RSG-01` |
| `defer-owned-primitive` | 2 | `NFM-RSG-04`, `NFM-RSG-05` |
| `defer-to-wp16-resource-action` | 1 | `NFM-RSG-06` |
| `reject-imperative-or-html-bypass` | 1 | `NFM-RSG-08` |

## Accepted Syntax Surfaces

| Surface | Status | Fuehrende Decision |
|---------|--------|--------------------|
| `layout` | `accepted-for-syntax-growth` | `NFM-RSG-02` |
| `region` | `accepted-for-syntax-growth` | `NFM-RSG-02`, `NFM-RSG-03` |
| `slot` | `accepted-for-syntax-growth` | `NFM-RSG-02`, `NFM-RSG-07` |
| `surface` | `accepted-for-syntax-growth` | `NFM-RSG-03` |
| `portal` | `accepted-for-syntax-growth` | `NFM-RSG-03` |
| `overlay` | `accepted-for-syntax-growth` | `NFM-RSG-03` |
| `component-compose` | `accepted-for-syntax-growth` | `NFM-RSG-07` |

## Blocked Claims nach WP-15

| Claim | Status | Grund |
|-------|--------|-------|
| RMT Syntax Growth ist bereits implementiert | `blocked-negative-claim` | WP-15 ist ein Decision Gate ohne Runtime-Implementierung |
| Vollstaendige Layout-, Region- und Slot-Syntax ist produktiv | `blocked-negative-claim` | `NFM-RSG-02` braucht Compiler-, Source-Map- und Fixture-Umsetzung |
| Vollstaendige Surface-, Portal- und Overlay-Maximality ist produktiv | `blocked-negative-claim` | `NFM-RSG-03` braucht Renderer- und Trusted-DOM-Proof in `NFM-WP-18` |
| Fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet existiert | `blocked-negative-claim` | `NFM-RSG-04` bleibt `defer-owned-primitive` |
| Fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet existiert | `blocked-negative-claim` | `NFM-RSG-05` bleibt `defer-owned-primitive` |
| Inline-JavaScript, Eval, Inline-HTML oder imperative Sprache sind RMT-Bypass | `blocked-negative-claim` | `NFM-RSG-08` lehnt diese Oberflaechen ab |

## Migration Fixture Coverage

| Fixture | Decision | Rolle |
|---------|----------|-------|
| `NFM-RSG-FIX-01` | `NFM-RSG-01` | Core-record-only Route Shell Migration |
| `NFM-RSG-FIX-02` | `NFM-RSG-02` | positive Layout/Region/Slot Migration |
| `NFM-RSG-FIX-03` | `NFM-RSG-03` | positive Surface/Portal/Overlay Migration |
| `NFM-RSG-FIX-04` | `NFM-RSG-04` | negative Data Display Owned-Primitive Fixture |
| `NFM-RSG-FIX-05` | `NFM-RSG-05` | negative Command/Search Owned-Primitive Fixture |
| `NFM-RSG-FIX-06` | `NFM-RSG-06` | WP-16 Resource/Action Handoff Fixture |
| `NFM-RSG-FIX-07` | `NFM-RSG-07` | positive Component Composition Fixture |
| `NFM-RSG-FIX-08` | `NFM-RSG-08` | negative imperative/HTML/JS rejection fixture |

## Handoff

| Folgepaket | Startbare Entscheidungen |
|------------|--------------------------|
| `NFM-WP-16` | `NFM-RSG-05`, `NFM-RSG-06` fuer Command Source, Binding, Action, Effect, Data und Resource |
| `NFM-WP-17` | `NFM-RSG-01`, `NFM-RSG-02`, `NFM-RSG-04`, `NFM-RSG-07` fuer Complete-UI-Recipe-Fixtures |
| `NFM-WP-18` | `NFM-RSG-03`, `NFM-RSG-08` fuer Surface Renderer, Trusted DOM und Bypass-Proofs |
| `owned-data-display-package` | `NFM-RSG-04` fuer Data Display Primitives |
| `owned-command-search-package` | `NFM-RSG-05` fuer Command/Search Primitives |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| Alle WP-14-Syntax-Growth- und Owned-Primitive-Handoffs sind entschieden | erfuellt |
| Positive, negative und Migration-Fixtures sind vorhanden | erfuellt |
| Core-Record-, Source-Map- und Diagnostics-Pfade sind je Zeile sichtbar | erfuellt |
| No-runtime-implementation Boundary ist dokumentiert | erfuellt |
| WP-16 kann unmittelbar starten | erfuellt |
