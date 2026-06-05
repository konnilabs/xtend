# XTend Native-First RMT Action Effect Data Resource Primitives Matrix

- Status: `accepted by NFM-WP-16`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- Primitive Matrix: `xtend.native-first.rmt-action-effect-data-resource-primitives-matrix.v1`
- Primitive Item Schema: `xtend.native-first.rmt-action-effect-data-resource-primitive.v1`
- Fixture Schema: `xtend.native-first.rmt-action-effect-data-resource-fixture.v1`
- Fixture Pack: `xtend.native-first.rmt-action-effect-data-resource-fixtures.v1`
- Report Schema: `xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1`
- Source Syntax Matrix: `development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md`
- Source Gap Analysis: `development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md`
- Fixture Pack: `tests/fixtures/native-first/rmt-action-effect-data-resource-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json`

## Bewertungsrahmen

WP-16 bewertet Action-, Effect-, DataSource- und Resource-Primitives nach vier Fragen:

- Kann der App-Autor Interaktion, Datenfluss und Cleanup declarativ authoren?
- Bleiben Adapter, Side Effects und Ressourcen ueber Policies kontrolliert?
- Bleiben RMT Core Records, Source Maps und Diagnostics pruefbar?
- Bleiben Data Display und Command/Search UI-Claims blockiert, bis owned UI-Primitives existieren?

Pflichtfelder je Primitive-Zeile: `primitiveId`, `sourceGap`, `sourceSyntaxDecision`, `proposal`, `decision`, `primitiveSurface`, `rmtDomains`, `coreRecordPlan`, `runtimeSurface`, `policyPlan`, `sourceMapPlan`, `diagnosticPlan`, `fixture`, `positiveClaim`, `negativeClaim`, `owner`, `sourceGates`, `nextHandoff`.

## Primitive Matrix

| Primitive-ID | Source Gap | Source Syntax Decision | Proposal | Decision | Primitive Surface | RMT Domains | Core Record Plan | Runtime Surface | Policy Plan | Source Map Plan | Diagnostic Plan | Fixture | Positive Claim | Negative Claim | Owner | Source Gates | Next Handoff |
|--------------|------------|------------------------|----------|----------|-------------------|-------------|------------------|-----------------|-------------|-----------------|-----------------|---------|----------------|----------------|-------|--------------|--------------|
| `NFM-RAE-01` | `NFM-RUG-03` | `none` | `form-binding-validation-result-record` | `accept-action-binding` | `form-action`, `validation-result`, `result-state` | `events`, `actions`, `dataSources`, `state`, `sourceMap` | `events[]`, `actions[]`, `dataSources[]`, `state[]`, `sourceMap[]` | `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-state-selector-runtime` | `validation-result-shape-required`, `no-free-function-handler` | `form sourceRef to /events/{index}; result sourceRef to /actions/{index}/resultState` | `rmt.action.form.validation_result_missing`, `rmt.action.form.payload_shape_missing`, `rmt.action.form.free_handler_forbidden` | `NFM-RAE-FIX-01` | Forms koennen Validation Results und Result-State declarativ an Actions binden | `no-rich-combobox-autocomplete-claim` bleibt blockiert | `component-forms-navigation-owner` | `native-first-form-navigation-media`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `rmt-state-selector-runtime`, `rmt-ui-primitive-gap` | `NFM-WP-17` |
| `NFM-RAE-02` | `NFM-RUG-05` | `NFM-RSG-06` | `command-action-binding-record` | `accept-action-binding` | `command-action`, `event-action-ref`, `status-state` | `events`, `actions`, `effects`, `state`, `sourceMap` | `events[]`, `actions[]`, `effects[]`, `state[]`, `sourceMap[]` | `rmt-event-routing-runtime`, `rmt-action-effect-runtime` | `action-ref-required`, `effect-policy-required`, `command-ui-owned-primitive-not-claimed` | `command event sourceRef to /events/{index}; action sourceRef to /actions/{index}` | `rmt.action.command.action_ref_missing`, `rmt.action.command.effect_policy_missing`, `rmt.action.command.owned_ui_missing` | `NFM-RAE-FIX-02` | Commands koennen Action-Refs, Status-State und Effects declarativ binden | `no-command-palette-claim` bleibt blockiert | `rmt-resource-action-owner` | `rmt-syntax-growth`, `rmt-vnext-events`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime`, `native-first-market-pattern-parity` | `NFM-WP-17`, `owned-command-search-package` |
| `NFM-RAE-03` | `NFM-RUG-06` | `NFM-RSG-06` | `resource-query-lifecycle-record` | `accept-resource-lifecycle` | `resource-query`, `loading-success-error-cancel`, `resource-owner` | `dataSources`, `resources`, `actions`, `operations`, `sourceMap` | `dataSources[]`, `resources[]`, `actions[]`, `operations[]`, `sourceMap[]` | `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime` | `resource-owner-required`, `cancel-releases-resources`, `adapter-injected` | `resource query sourceRef to /dataSources/{index}; resource sourceRef to /resources/{index}` | `rmt.resource.lifecycle.owner_missing`, `rmt.resource.lifecycle.release_missing`, `rmt.resource.datasource.adapter_missing` | `NFM-RAE-FIX-03` | Resource Query Lifecycle ist declarativ authorbar und releasebar | `no-resource-data-ui-family-claim` bleibt blockiert | `rmt-resource-action-owner` | `rmt-syntax-growth`, `rmt-vnext-events`, `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime`, `contract-runtime-parity` | `NFM-WP-17`, `NFM-WP-19` |
| `NFM-RAE-04` | `NFM-RUG-06` | `NFM-RSG-06` | `effect-policy-and-scheduler-lane-record` | `accept-effect-policy` | `feedback-effect`, `navigation-effect`, `focus-effect`, `lazy-import-effect`, `side-effect-policy` | `effects`, `actions`, `lanes`, `securityPolicies`, `sourceMap` | `effects[]`, `actions[]`, `lanes[]`, `securityPolicies[]`, `sourceMap[]` | `rmt-action-effect-runtime`, `rmt-vnext-security` | `effect-policy-required`, `side-effect-adapter-injected`, `scheduler-lane-visible` | `effect sourceRef to /effects/{index}; policy sourceRef to /securityPolicies/{index}` | `rmt.effect.policy.missing`, `rmt.effect.side_effect.adapter_missing`, `rmt.effect.lane_ref_missing` | `NFM-RAE-FIX-04` | Effects sind als benannte Policies und Adapter-Aufrufe declarativ authorbar | freie Side Effects bleiben verboten | `rmt-effect-policy-owner` | `rmt-vnext-security`, `rmt-action-effect-runtime`, `rmt-vnext-events`, `contract-runtime-parity` | `NFM-WP-18`, `NFM-WP-19` |
| `NFM-RAE-05` | `NFM-RUG-06` | `NFM-RSG-06` | `datasource-adapter-policy-record` | `accept-datasource-policy` | `datasource-policy`, `adapter-ref`, `payload-shape`, `result-shape` | `dataSources`, `actions`, `securityPolicies`, `sourceMap` | `dataSources[]`, `actions[]`, `securityPolicies[]`, `sourceMap[]` | `rmt-vnext-events`, `rmt-action-effect-runtime` | `adapter-ref-required`, `payload-result-shape-required`, `no-kernel-network-default` | `dataSource sourceRef to /dataSources/{index}; adapter policy sourceRef to /securityPolicies/{index}` | `rmt.datasource.adapter_ref_missing`, `rmt.datasource.result_shape_missing`, `rmt.datasource.kernel_network_forbidden` | `NFM-RAE-FIX-05` | Fixture-, REST-, SSR-, Host-, Endpoint-, SSE- und Worker-DataSource-Pfade sind policy-faehig | Kernel-Netzwerkzugriff ohne injizierten Adapter bleibt verboten | `rmt-datasource-owner` | `rmt-vnext-events`, `rmt-action-effect-runtime`, `rmt-app-platform-fixture`, `contract-runtime-parity` | `NFM-WP-17` |
| `NFM-RAE-06` | `NFM-RUG-12` | `NFM-RSG-05` | `command-search-resource-binding-record` | `defer-owned-ui-primitive` | `command-source`, `search-resource`, `action-result-state` | `components`, `events`, `actions`, `resources`, `state`, `sourceMap` | `components[]`, `events[]`, `actions[]`, `resources[]`, `state[]`, `sourceMap[]` | `rmt-event-routing-runtime`, `rmt-action-effect-runtime` | `owned-command-search-ui-required`, `resource-binding-allowed`, `autocomplete-ui-not-claimed` | `command sourceRef to /components/{index}; search resource sourceRef to /resources/{index}` | `rmt.command_search.owned_ui_missing`, `rmt.command_search.resource_ref_missing`, `rmt.command_search.action_result_missing` | `NFM-RAE-FIX-06` | Command/Search Datenfluss kann an Actions, Resources und State gebunden werden | `no-command-palette-autocomplete-rich-combobox-claim` bleibt blockiert | `component-command-search-owner` | `rmt-syntax-growth`, `native-first-market-pattern-parity`, `rmt-action-effect-runtime`, `rmt-event-routing-runtime` | `owned-command-search-package`, `NFM-WP-17` |
| `NFM-RAE-07` | `NFM-RUG-06` | `NFM-RSG-06` | `owned-resource-cleanup-contract` | `accept-resource-lifecycle` | `object-url`, `stream`, `observer`, `timer`, `lazy-import` | `resources`, `effects`, `actions`, `sourceMap` | `resources[]`, `effects[]`, `actions[]`, `sourceMap[]` | `createRmtResourceManager`, `rmt-action-effect-runtime` | `owner-scope-required`, `release-on-cancel-or-owner-dispose`, `diagnostics-on-leak` | `resource sourceRef to /resources/{index}; release sourceRef to /actions/{index}/resources` | `rmt.resource.owner_scope_missing`, `rmt.resource.release_on_cancel_missing`, `rmt.resource.leak_detected` | `NFM-RAE-FIX-07` | Resource Cleanup fuer Object URLs, Streams, Observer, Timer und Lazy Imports ist Pflicht | Resource Handles duerfen nicht global oder leaky bleiben | `rmt-resource-lifecycle-owner` | `rmt-action-effect-runtime`, `rmt-surface-resource-graph-runtime`, `contract-runtime-parity`, `references` | `NFM-WP-19` |
| `NFM-RAE-08` | `cross-cutting-security-boundary` | `NFM-RSG-08` | `reject-free-runtime-execution` | `reject-free-runtime-execution` | `inline-handler`, `eval`, `inline-js`, `inline-html`, `unscoped-side-effect` | `none` | `none` | `none` | `free-runtime-execution-forbidden`, `unsafe-html-sink-forbidden`, `unscoped-side-effect-forbidden` | `none` | `rmt.action.free_runtime_execution_forbidden`, `rmt.action.inline_javascript_forbidden`, `rmt.action.inline_html_forbidden` | `NFM-RAE-FIX-08` | Declarative-only Action/Resource Boundary ist bestaetigt | freie Runtime-Ausfuehrung bleibt verboten | `rmt-security-owner` | `rmt-syntax-growth`, `rmt-vnext-security`, `contract-runtime-parity`, `references` | `NFM-WP-18`, `NFM-WP-20` |

## Decision Summary

| Decision | Anzahl | Primitive-IDs |
|----------|--------|---------------|
| `accept-action-binding` | 2 | `NFM-RAE-01`, `NFM-RAE-02` |
| `accept-resource-lifecycle` | 2 | `NFM-RAE-03`, `NFM-RAE-07` |
| `accept-effect-policy` | 1 | `NFM-RAE-04` |
| `accept-datasource-policy` | 1 | `NFM-RAE-05` |
| `defer-owned-ui-primitive` | 1 | `NFM-RAE-06` |
| `reject-free-runtime-execution` | 1 | `NFM-RAE-08` |

## Primitive Capability Coverage

| Capability | Status | Fuehrende Primitive |
|------------|--------|---------------------|
| Form Binding und Validation Result | `accepted` | `NFM-RAE-01` |
| Command Action Binding | `accepted-with-owned-ui-residual` | `NFM-RAE-02`, `NFM-RAE-06` |
| Resource Query Lifecycle | `accepted` | `NFM-RAE-03` |
| Effect Policy | `accepted` | `NFM-RAE-04` |
| DataSource Adapter Policy | `accepted` | `NFM-RAE-05` |
| Resource Cleanup | `accepted` | `NFM-RAE-07` |
| Free Runtime Execution | `rejected` | `NFM-RAE-08` |

## Blocked Claims nach WP-16

| Claim | Status | Grund |
|-------|--------|-------|
| Fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet existiert | `blocked-negative-claim` | Data Display UI bleibt `owned-data-display-package` |
| Fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet existiert | `blocked-negative-claim` | `NFM-RAE-06` bleibt `defer-owned-ui-primitive` |
| RMT Actions duerfen freie Handler-Funktionen ausfuehren | `blocked-negative-claim` | `NFM-RAE-08` lehnt freie Runtime-Ausfuehrung ab |
| RMT DataSources duerfen Kernel-Netzwerkzugriff ohne Adapter nutzen | `blocked-negative-claim` | `NFM-RAE-05` verlangt injizierte Adapter |
| Resources duerfen ohne Owner und Cleanup leben | `blocked-negative-claim` | `NFM-RAE-03` und `NFM-RAE-07` verlangen Ownership und Release |

## Fixture Coverage

| Fixture | Primitive | Rolle |
|---------|-----------|-------|
| `NFM-RAE-FIX-01` | `NFM-RAE-01` | Form Binding und Validation Result |
| `NFM-RAE-FIX-02` | `NFM-RAE-02` | Command Action Binding |
| `NFM-RAE-FIX-03` | `NFM-RAE-03` | Resource Query Lifecycle |
| `NFM-RAE-FIX-04` | `NFM-RAE-04` | Effect Policy |
| `NFM-RAE-FIX-05` | `NFM-RAE-05` | DataSource Adapter Policy |
| `NFM-RAE-FIX-06` | `NFM-RAE-06` | Command/Search Resource Binding mit Owned-UI-Residual |
| `NFM-RAE-FIX-07` | `NFM-RAE-07` | Owned Resource Cleanup |
| `NFM-RAE-FIX-08` | `NFM-RAE-08` | Free Runtime Execution Rejection |

## Handoff

| Folgepaket | Startbare Primitive |
|------------|---------------------|
| `NFM-WP-17` | `NFM-RAE-01`, `NFM-RAE-02`, `NFM-RAE-03`, `NFM-RAE-05`, `NFM-RAE-06` fuer Complete-UI-Recipe-Fixtures |
| `NFM-WP-18` | `NFM-RAE-04`, `NFM-RAE-08` fuer Trusted-DOM-, URL-, Effect- und Bypass-Proofs |
| `NFM-WP-19` | `NFM-RAE-03`, `NFM-RAE-04`, `NFM-RAE-07` fuer Budget- und Complexity-Gates |
| `owned-data-display-package` | Data Display UI-Primitive-Paket bleibt notwendig |
| `owned-command-search-package` | Command/Search UI-Primitive-Paket bleibt notwendig |

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| Action-, Effect-, DataSource- und Resource-Primitives sind geschnitten | erfuellt |
| App-Interaktion und Datenfluss sind ohne freie Runtime-Ausfuehrung authorbar | erfuellt |
| Fixtures pruefen positive, negative und Handoff-Pfade | erfuellt |
| Source-Gates verbinden WP-15, Epic18 Runtime und Contract-Parity | erfuellt |
| WP-17 ist nach WP-16 startbar | erfuellt |
