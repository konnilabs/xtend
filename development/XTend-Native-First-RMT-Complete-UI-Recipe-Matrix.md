# XTend Native-First RMT Complete UI Recipe Matrix

- Status: `accepted by NFM-WP-17`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Recipe Matrix: `xtend.native-first.rmt-complete-ui-recipe-matrix.v1`
- Recipe Item Schema: `xtend.native-first.rmt-complete-ui-recipe.v1`
- Fixture Schema: `xtend.native-first.rmt-complete-ui-recipe-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1`
- Source Syntax Matrix: `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md`
- Source Action Resource Matrix: `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md`
- Source Gap Analysis: `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json`

## Bewertungsrahmen

WP-17 bewertet Complete-UI-Recipes nach vier Fragen:

- Kann die UI-Klasse aus RMT Core Records und owned XTend-Primitives beschrieben werden?
- Sind Browser-Smoke-, Golden-Fixture- und Visual-Evidence-Pfade benannt?
- Bleiben residuale Adapter-, Renderer- oder owned-primitive-Luecken explizit?
- Bleiben blockierte Claims als negative Fixtures sichtbar?

Pflichtfelder je Recipe-Zeile: `recipeId`, `recipeClass`, `sourceGaps`, `sourceSyntaxDecisions`, `sourcePrimitiveDecisions`, `status`, `uiSurfaces`, `rmtDomains`, `coreRecordPlan`, `ownedPrimitiveUse`, `runtimeGates`, `browserSmokePlan`, `goldenFixturePlan`, `visualEvidencePlan`, `policyPlan`, `blockedClaims`, `sourceMapPlan`, `fixture`, `expectedOutcome`, `owner`, `nextHandoff`.

## Recipe Matrix

| Recipe-ID | Recipe Class | Source Gaps | Source Syntax Decisions | Source Primitive Decisions | Status | UI Surfaces | RMT Domains | Core Record Plan | Owned Primitive Use | Runtime Gates | Browser Smoke Plan | Golden Fixture Plan | Visual Evidence Plan | Policy Plan | Blocked Claims | Source Map Plan | Fixture | Expected Outcome | Owner | Next Handoff |
|-----------|--------------|-------------|-------------------------|----------------------------|--------|-------------|-------------|------------------|---------------------|---------------|--------------------|---------------------|----------------------|-------------|----------------|-----------------|---------|------------------|-------|--------------|
| `NFM-RCR-01` | `app-shell-routing` | `NFM-RUG-01`, `NFM-RUG-02` | `NFM-RSG-01`, `NFM-RSG-02`, `NFM-RSG-07` | `NFM-RAE-02`, `NFM-RAE-05` | `recipe-accepted-with-adapter-residual` | `route-shell`, `navigation-state`, `app-layout`, `global-actions` | `routes`, `surfaces`, `templates`, `slots`, `events`, `actions`, `state`, `sourceMap` | `routes[]`, `surfaces[]`, `templates[]`, `slots[]`, `components[]`, `events[]`, `actions[]`, `state[]`, `sourceMap[]` | `x-shell`, `x-nav`, `x-link`, `x-button` | `rmt-vnext-compiler`, `rmt-vnext-surfaces`, `rmt-app-platform-fixture`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime` | `route-render-smoke`, `keyboard-nav-smoke`, `hydration-boundary-smoke` | `rmt-app-platform-fixture`, `rmt-app-platform-tooling`, `rmt-vnext-regression` | `app-shell-desktop`, `app-shell-mobile` | `router-adapter-required`, `document-title-announcement-required`, `no-native-navigation-api-product-claim` | `no-native-navigation-api-product-claim` | `route sourceRef to /routes/{index}; shell sourceRef to /templates/{index}` | `NFM-RCR-FIX-01` | `accepted-with-router-adapter-residual` | `rmt-routing-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RCR-02` | `dashboard-composition` | `NFM-RUG-02`, `NFM-RUG-04`, `NFM-RUG-06`, `NFM-RUG-11` | `NFM-RSG-02`, `NFM-RSG-04`, `NFM-RSG-07` | `NFM-RAE-03`, `NFM-RAE-05`, `NFM-RAE-07` | `recipe-accepted-with-adapter-residual` | `dashboard-layout`, `status-card`, `kpi-grid`, `collection-view-draft` | `templates`, `slots`, `components`, `state`, `selectors`, `dataSources`, `resources`, `schedules`, `sourceMap` | `templates[]`, `slots[]`, `components[]`, `state[]`, `selectors[]`, `dataSources[]`, `resources[]`, `schedules[]`, `sourceMap[]` | `x-section`, `x-card`, `x-status`, `x-progress`, `x-list` | `rmt-component-template-primitives`, `rmt-state-selector-runtime`, `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime`, `rmt-app-platform-fixture` | `dashboard-render-smoke`, `selector-update-smoke`, `resource-loading-smoke` | `rmt-app-platform-fixture`, `rmt-state-selector-runtime`, `rmt-surface-resource-graph-runtime` | `dashboard-grid-desktop`, `dashboard-kpi-state` | `resource-owner-required`, `adapter-ref-required`, `owned-data-display-ui-required` | `no-table-tree-data-grid-virtual-list-claim` | `dashboard sourceRef to /templates/{index}; resource sourceRef to /resources/{index}` | `NFM-RCR-FIX-02` | `accepted-with-data-display-residual` | `component-data-display-owner` | `NFM-WP-19`, `owned-data-display-package` |
| `NFM-RCR-03` | `crud-form-workflow` | `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-06` | `NFM-RSG-02`, `NFM-RSG-06` | `NFM-RAE-01`, `NFM-RAE-03`, `NFM-RAE-05` | `recipe-accepted` | `form-layout`, `fieldset`, `validation-result`, `submit-action`, `resource-query` | `components`, `templates`, `events`, `actions`, `dataSources`, `resources`, `state`, `sourceMap` | `components[]`, `templates[]`, `events[]`, `actions[]`, `dataSources[]`, `resources[]`, `state[]`, `sourceMap[]` | `x-form`, `x-input`, `x-select`, `x-button`, `x-status` | `native-first-form-navigation-media`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-state-selector-runtime`, `rmt-app-platform-fixture` | `form-submit-smoke`, `validation-feedback-smoke`, `focus-order-smoke` | `rmt-action-effect-runtime`, `rmt-form-controls-ux`, `rmt-app-platform-fixture` | `crud-form-valid`, `crud-form-invalid` | `validation-result-shape-required`, `payload-result-shape-required`, `no-free-function-handler` | `no-rich-combobox-autocomplete-claim` | `form sourceRef to /components/{index}; submit sourceRef to /events/{index}` | `NFM-RCR-FIX-03` | `accepted-complete-form-recipe` | `component-forms-navigation-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RCR-04` | `modal-overlay-workflow` | `NFM-RUG-05`, `NFM-RUG-07`, `NFM-RUG-10` | `NFM-RSG-03`, `NFM-RSG-06` | `NFM-RAE-02`, `NFM-RAE-04`, `NFM-RAE-07` | `recipe-accepted-with-renderer-proof-residual` | `overlay`, `portal`, `focus-scope`, `modal-action`, `cleanup` | `surfaces`, `slots`, `events`, `actions`, `effects`, `resources`, `securityPolicies`, `sourceMap` | `surfaces[]`, `slots[]`, `events[]`, `actions[]`, `effects[]`, `resources[]`, `securityPolicies[]`, `sourceMap[]` | `x-dialog`, `x-popover`, `x-focus-scope`, `x-button` | `native-first-overlay-focus`, `rmt-vnext-surfaces`, `rmt-vnext-security`, `rmt-action-effect-runtime`, `rmt-event-routing-runtime` | `modal-open-close-smoke`, `focus-return-smoke`, `escape-dismiss-smoke` | `rmt-overlay-interaction-ux`, `rmt-vnext-surfaces`, `rmt-action-effect-runtime` | `modal-open-state`, `modal-focus-ring` | `surface-trust-policy-required`, `effect-policy-required`, `release-on-cancel-or-owner-dispose` | `no-complete-surface-maximality-claim` | `overlay sourceRef to /surfaces/{index}; effect sourceRef to /effects/{index}` | `NFM-RCR-FIX-04` | `accepted-with-renderer-proof-residual` | `component-overlay-owner` | `NFM-WP-18`, `NFM-WP-19` |
| `NFM-RCR-05` | `navigation-flow` | `NFM-RUG-01`, `NFM-RUG-05`, `NFM-RUG-08` | `NFM-RSG-01`, `NFM-RSG-02` | `NFM-RAE-02`, `NFM-RAE-04` | `recipe-accepted-with-adapter-residual` | `route-link`, `breadcrumbs`, `tabs`, `feedback-effect` | `routes`, `events`, `actions`, `effects`, `state`, `schedules`, `sourceMap` | `routes[]`, `events[]`, `actions[]`, `effects[]`, `state[]`, `schedules[]`, `sourceMap[]` | `x-link`, `x-tabs`, `x-breadcrumb`, `x-status` | `native-first-form-navigation-media`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-vnext-events`, `rmt-app-platform-fixture` | `link-activation-smoke`, `active-route-state-smoke`, `feedback-announcement-smoke` | `rmt-navigation-routing-ux`, `rmt-event-routing-runtime`, `rmt-app-platform-fixture` | `navigation-active-state`, `navigation-mobile` | `action-ref-required`, `scheduler-lane-visible`, `router-adapter-required` | `no-native-navigation-api-product-claim` | `navigation sourceRef to /routes/{index}; event sourceRef to /events/{index}` | `NFM-RCR-FIX-05` | `accepted-with-router-adapter-residual` | `component-forms-navigation-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RCR-06` | `data-display-collection` | `NFM-RUG-11`, `NFM-RUG-06`, `NFM-RUG-02` | `NFM-RSG-04`, `NFM-RSG-07` | `NFM-RAE-03`, `NFM-RAE-05`, `NFM-RAE-07` | `recipe-blocked-owned-primitive` | `collection-view`, `item-template`, `empty-state`, `resource-query` | `components`, `templates`, `dataSources`, `resources`, `state`, `selectors`, `sourceMap` | `components[]`, `templates[]`, `dataSources[]`, `resources[]`, `state[]`, `selectors[]`, `sourceMap[]` | `x-list`, `x-card`, `x-empty-state` | `native-first-market-pattern-parity`, `rmt-component-template-primitives`, `rmt-surface-resource-graph-runtime`, `rmt-action-effect-runtime` | `collection-empty-smoke`, `collection-loading-smoke`, `collection-selection-smoke` | `rmt-component-template-primitives`, `rmt-surface-resource-graph-runtime`, `rmt-app-platform-fixture` | `collection-list-state`, `collection-empty-state` | `owned-data-display-ui-required`, `resource-owner-required`, `adapter-ref-required` | `no-table-tree-data-grid-virtual-list-claim` | `collection sourceRef to /components/{index}; data sourceRef to /dataSources/{index}` | `NFM-RCR-FIX-06` | `blocked-until-owned-data-display-package` | `component-data-display-owner` | `owned-data-display-package`, `NFM-WP-19` |
| `NFM-RCR-07` | `command-search-workflow` | `NFM-RUG-12`, `NFM-RUG-05`, `NFM-RUG-06` | `NFM-RSG-05`, `NFM-RSG-06`, `NFM-RSG-07` | `NFM-RAE-02`, `NFM-RAE-06` | `recipe-blocked-owned-primitive` | `command-source`, `search-resource`, `action-result-state`, `owned-command-search-placeholder` | `components`, `events`, `actions`, `resources`, `state`, `sourceMap` | `components[]`, `events[]`, `actions[]`, `resources[]`, `state[]`, `sourceMap[]` | `x-button`, `x-input`, `owned-command-search-package` | `native-first-market-pattern-parity`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-ui-primitive-gap` | `command-open-smoke`, `search-query-smoke`, `action-result-smoke` | `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-syntax-growth` | `command-empty-state`, `command-result-state` | `owned-command-search-ui-required`, `action-ref-required`, `effect-policy-required` | `no-command-palette-autocomplete-rich-combobox-claim` | `command sourceRef to /components/{index}; action sourceRef to /actions/{index}` | `NFM-RCR-FIX-07` | `blocked-until-owned-command-search-package` | `component-command-search-owner` | `owned-command-search-package`, `NFM-WP-19` |
| `NFM-RCR-08` | `media-resource-preview` | `NFM-RUG-06`, `NFM-RUG-08`, `NFM-RUG-10` | `NFM-RSG-02`, `NFM-RSG-07` | `NFM-RAE-03`, `NFM-RAE-04`, `NFM-RAE-07` | `recipe-accepted` | `media-preview`, `object-url-resource`, `feedback-effect`, `cleanup` | `components`, `templates`, `resources`, `effects`, `actions`, `schedules`, `sourceMap` | `components[]`, `templates[]`, `resources[]`, `effects[]`, `actions[]`, `schedules[]`, `sourceMap[]` | `x-media`, `x-image`, `x-button`, `x-status` | `native-first-form-navigation-media`, `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime`, `rmt-vnext-security`, `rmt-app-platform-fixture` | `media-preview-smoke`, `object-url-release-smoke`, `lazy-import-smoke` | `rmt-layout-display-media-ux`, `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime` | `media-preview-ready`, `media-resource-cleanup` | `owner-scope-required`, `release-on-cancel-or-owner-dispose`, `effect-policy-required` | `none` | `media sourceRef to /components/{index}; resource sourceRef to /resources/{index}` | `NFM-RCR-FIX-08` | `accepted-media-resource-recipe` | `component-forms-navigation-owner` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RCR-09` | `docs-flow-progressive-boot` | `NFM-RUG-01`, `NFM-RUG-09`, `NFM-RUG-10` | `NFM-RSG-01`, `NFM-RSG-02`, `NFM-RSG-07` | `NFM-RAE-02`, `NFM-RAE-05` | `recipe-accepted-with-adapter-residual` | `docs-route`, `toc-navigation`, `progressive-boot`, `diagnostic-boundary` | `routes`, `templates`, `components`, `events`, `actions`, `dataSources`, `securityPolicies`, `diagnostics`, `sourceMap` | `routes[]`, `templates[]`, `components[]`, `events[]`, `actions[]`, `dataSources[]`, `securityPolicies[]`, `diagnostics[]`, `sourceMap[]` | `x-docs-shell`, `x-link`, `x-toc`, `x-status` | `references`, `rmt-app-platform-tooling`, `rmt-app-platform-fixture`, `rmt-vnext-compiler`, `contract-runtime-parity` | `docs-route-smoke`, `toc-keyboard-smoke`, `progressive-boot-smoke` | `references`, `rmt-app-platform-tooling`, `rmt-app-platform-fixture` | `docs-flow-desktop`, `docs-flow-mobile` | `hydration-boot-record-required`, `adapter-ref-required`, `diagnostic-boundary-required` | `no-production-bundle-claim-without-release-gate` | `docs route sourceRef to /routes/{index}; boot sourceRef to /securityPolicies/{index}` | `NFM-RCR-FIX-09` | `accepted-with-progressive-boot-residual` | `docs-authoring-owner` | `NFM-WP-19`, `NFM-WP-20` |

## Status Summary

| Status | Anzahl | Recipe-IDs |
|--------|--------|------------|
| `recipe-accepted` | 2 | `NFM-RCR-03`, `NFM-RCR-08` |
| `recipe-accepted-with-adapter-residual` | 4 | `NFM-RCR-01`, `NFM-RCR-02`, `NFM-RCR-05`, `NFM-RCR-09` |
| `recipe-accepted-with-renderer-proof-residual` | 1 | `NFM-RCR-04` |
| `recipe-blocked-owned-primitive` | 2 | `NFM-RCR-06`, `NFM-RCR-07` |

## Coverage Summary

| UI-Klasse | Entscheidung |
|-----------|--------------|
| App Shell und Routing | authorbar mit Router-Adapter-Residual |
| Dashboard Composition | authorbar mit Data-Display-Residual |
| CRUD Form Workflow | authorbar |
| Modal Overlay Workflow | authorbar mit Renderer-/Trusted-DOM-Proof-Residual |
| Navigation Flow | authorbar mit Router-Adapter-Residual |
| Data Display Collection | negative Fixture bis `owned-data-display-package` |
| Command/Search Workflow | negative Fixture bis `owned-command-search-package` |
| Media Resource Preview | authorbar |
| Docs Flow Progressive Boot | authorbar mit Hydration-/Release-Gate-Residual |

## Handoff

| Folgepaket | Startbare Recipe-Evidence |
|------------|---------------------------|
| `NFM-WP-18` | `NFM-RCR-04` plus Surface-/Trusted-DOM-Anteile aus `NFM-RCR-01`, `NFM-RCR-05` und `NFM-RCR-09` |
| `NFM-WP-19` | alle akzeptierten und residualen Recipes fuer Performance-, Complexity-, Browser-Smoke- und Visual-Evidence-Budgets |
| `NFM-WP-20` | `NFM-RCR-01`, `NFM-RCR-03`, `NFM-RCR-05`, `NFM-RCR-08`, `NFM-RCR-09` fuer Authoring Guides |
| `owned-data-display-package` | `NFM-RCR-02`, `NFM-RCR-06` |
| `owned-command-search-package` | `NFM-RCR-07` |

## WP-RMO-05 Recipe Extension

`WP-RMO-05` erweitert diese historische NFM-WP-17-Baseline, ohne die NFM-Zaehlung rueckwirkend zu veraendern. Die neuen scoped Owned Packages aus `WP-RMO-03` und `WP-RMO-04` heben die blockierten Rows auf eigene RMO-Recipe-IDs:

| RMO Recipe | Quelle | Neuer Outcome | Fuehrende Records | Bleibende negative Claims |
|------------|--------|---------------|-------------------|---------------------------|
| `RMO-RCR-10` | `NFM-RCR-02`, `NFM-RCR-06` | `accepted-with-scoped-owned-data-display-package` | `collectionViews[]`, `dataSources[]`, `resources[]`, `selectors[]`, `state[]`, `sourceMap[]` | `no-table-tree-data-grid-virtual-list-claim`, `full-datagrid-parity` |
| `RMO-RCR-11` | `NFM-RCR-07` | `accepted-with-scoped-owned-command-search-package` | `commandSources[]`, `searchSources[]`, `events[]`, `actions[]`, `effects[]`, `resources[]`, `sourceMap[]` | `no-command-palette-autocomplete-rich-combobox-claim`, `command-palette-full-parity` |
| `RMO-RCR-12` | `NFM-RCR-03`, `NFM-RCR-05`, `NFM-RCR-06`, `NFM-RCR-07` | `accepted-with-route-adapter-and-scoped-owned-packages` | `routes[]`, `collectionViews[]`, `commandSources[]`, `searchSources[]`, `actions[]`, `resources[]`, `sourceMap[]` | `no-native-navigation-api-product-claim` |

Migration-Fixtures:

- `blocked-until-owned-data-display-package` -> `accepted-with-scoped-owned-data-display-package`
- `blocked-until-owned-command-search-package` -> `accepted-with-scoped-owned-command-search-package`

Negative Fixtures bleiben im RMO-Gate sichtbar: `manual-html-row-renderer`, `manual-html-command-renderer`, `unregistered-command-execution` und `free-command-execution-without-action-ref`.

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| neun Complete-UI-Recipe-Zeilen sind dokumentiert | erfuellt |
| jedes Recipe besitzt Browser-Smoke-, Golden-Fixture- und Visual-Evidence-Plan | erfuellt |
| jedes Recipe mappt auf WP-15- und/oder WP-16-Entscheidungen | erfuellt |
| blockierte Data Display und Command/Search Claims bleiben negative Fixtures | erfuellt |
| WP-18, WP-19 und WP-20 sind aus Recipe-Evidence startbar | erfuellt |
