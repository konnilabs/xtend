# XTend Native-First RMT UI Primitive Gap Analysis

- Status: `accepted by NFM-WP-14`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.rmt-ui-primitive-gap.v1`
- Matrix Schema: `xtend.native-first.rmt-ui-primitive-gap-matrix.v1`
- Gap Item Schema: `xtend.native-first.rmt-ui-primitive-gap-item.v1`
- Report Schema: `xtend.native-first.rmt-ui-primitive-gap-report.v1`
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-14-RMT-UI-Primitive-Gap-Analysis-erstellen.md`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json`
- Evidence Sources: UI Primitive Capability Matrix, Market Pattern Parity Matrix, Contract Runtime Parity Matrix, Audit Evidence Pack, RMT vNext Contracts, Epic18 RMT App Platform Contracts

## Bewertungsrahmen

WP-14 bewertet RMT-UI-Maximality nach der Frage, ob App-Autoren eine UI ohne manuelle Host-Shell, imperative Sonderverkabelung oder externe UI-Framework-Dependency deklarativ erzeugen koennen. Die Matrix schneidet deshalb nicht nach Komponentenlisten, sondern nach marktueblichen UI-Pattern-Gruppen, RMT Core Domains und fehlenden Contract-Schichten.

| Bewertungsdimension | Werte |
|---------------------|-------|
| `coverageStatus` | `authorable-now`, `authorable-with-adapter-residual`, `contract-only-gap`, `syntax-growth-needed`, `owned-primitive-needed`, `renderer-proof-deferred-to-wp18` |
| `gapClasses` | `syntax`, `core-record`, `adapter`, `component-contract`, `security-policy`, `tooling`, `docs` |
| `appAuthorableWithoutManualShell` | `yes`, `partial`, `no` |
| `priority` | `P0`, `P1`, `P2` |

Pflichtfelder je Gap-Zeile: `gapId`, `marketPattern`, `capabilities`, `ownedPrimitivePackage`, `rmtDomains`, `gapClasses`, `coverageStatus`, `priority`, `appAuthorableWithoutManualShell`, `blockedClaim`, `proposedExtension`, `sourceContracts`, `sourceGates`, `nextHandoff`.

## RMT UI Primitive Gap Matrix

| Gap-ID | Market Pattern | Capabilities | Owned Primitive Package | RMT Domains | Gap Classes | Coverage Status | Priority | App Authorable Without Manual Shell | Blocked Claim | Proposed Extension | Source Contracts | Source Gates | Next Handoff |
|--------|----------------|--------------|-------------------------|-------------|-------------|-----------------|----------|-------------------------------------|---------------|--------------------|------------------|--------------|--------------|
| `NFM-RUG-01` | `NFM-MP-01` App Shell und Routing | `NFM-CAP-08`, `NFM-CAP-18` | `NFM-OP-04` | `routes`, `surfaces`, `schedules`, `events` | `syntax`, `adapter`, `docs` | `authorable-with-adapter-residual` | `P0` | `partial` | `no-native-navigation-api-product-claim` | `route-shell-record-and-navigation-state-binding` | `xtend.rmt.core-format.vnext.v1`, `xtend.rmt.vnext-surface-registry.v1`, `xtend.native-first.market-pattern-parity.v1` | `rmt-vnext-compiler`, `rmt-vnext-surfaces`, `rmt-app-platform-fixture` | `NFM-WP-15` |
| `NFM-RUG-02` | `NFM-MP-02` Layout und responsive Composition | `NFM-CAP-09`, `NFM-CAP-14`, `NFM-CAP-18` | `NFM-OP-03` | `templates`, `slots`, `surfaces` | `syntax`, `core-record`, `tooling`, `docs` | `syntax-growth-needed` | `P0` | `partial` | `no-complete-layout-sugar-claim` | `layout-region-slot-composition-sugar` | `xtend.rmt.core-format.vnext.v1`, `xtend.native-first.ui-primitive-capability.v1` | `rmt-vnext-composition`, `rmt-component-template-primitives`, `native-first-market-pattern-parity` | `NFM-WP-15` |
| `NFM-RUG-03` | `NFM-MP-03` Forms und Validation | `NFM-CAP-04`, `NFM-CAP-17` | `NFM-OP-02` | `components`, `events`, `actions`, `dataSources` | `adapter`, `component-contract`, `docs` | `authorable-with-adapter-residual` | `P1` | `partial` | `no-rich-combobox-autocomplete-claim` | `form-binding-validation-result-record` | `xtend.rmt.vnext-event-action-contract.v1`, `xtend.native-first.form-navigation-media-hardening.v1` | `rmt-vnext-events`, `rmt-action-effect-runtime`, `native-first-form-navigation-media` | `NFM-WP-16` |
| `NFM-RUG-04` | `NFM-MP-04` State, Selectors und Theme State | `NFM-CAP-02`, `NFM-CAP-13` | `NFM-OP-05` | `state`, `selectors`, `components`, `schedules` | `adapter`, `tooling` | `authorable-now` | `P1` | `yes` | `none` | `typed-theme-state-selector-authoring` | `xtend.native-first.framework-leverage-layer.v1`, `xtend.rmt.core-format.vnext.v1` | `rmt-state-selector-runtime`, `rmt-event-routing-runtime`, `native-first-framework-leverage` | `NFM-WP-19` |
| `NFM-RUG-05` | `NFM-MP-05` Events, Actions und Commands | `NFM-CAP-03`, `NFM-CAP-13`, `NFM-CAP-17` | `NFM-OP-05`, `NFM-OP-08` | `events`, `actions`, `operations` | `syntax`, `adapter`, `component-contract` | `authorable-with-adapter-residual` | `P1` | `partial` | `no-command-palette-claim` | `command-action-binding-record` | `xtend.rmt.vnext-event-action-contract.v1`, `xtend.native-first.market-pattern-parity.v1` | `rmt-vnext-events`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime` | `NFM-WP-16` |
| `NFM-RUG-06` | `NFM-MP-06` Effects, DataSources und Resource Lifecycles | `NFM-CAP-15`, `NFM-CAP-16` | `NFM-OP-06` | `dataSources`, `resources`, `operations` | `core-record`, `adapter`, `security-policy`, `tooling` | `contract-only-gap` | `P0` | `no` | `no-resource-data-ui-family-claim` | `resource-query-lifecycle-record` | `xtend.rmt.vnext-event-action-contract.v1`, `xtend.native-first.contract-runtime-parity.v1` | `rmt-vnext-events`, `rmt-surface-resource-graph-runtime`, `contract-runtime-parity` | `NFM-WP-16` |
| `NFM-RUG-07` | `NFM-MP-07` Slots, Portals und Surface Composition | `NFM-CAP-06`, `NFM-CAP-07`, `NFM-CAP-18` | `NFM-OP-01`, `NFM-OP-03` | `surfaces`, `slots`, `securityPolicies`, `schedules` | `syntax`, `adapter`, `security-policy` | `syntax-growth-needed` | `P0` | `partial` | `no-complete-surface-maximality-claim` | `surface-region-portal-overlay-records` | `xtend.rmt.vnext-surface-registry.v1`, `xtend.security.trusted-dom-policy.v1` | `rmt-vnext-surfaces`, `rmt-dom-descriptor-renderer`, `rmt-native-shell-migration` | `NFM-WP-15`, `NFM-WP-18` |
| `NFM-RUG-08` | `NFM-MP-08` Transitions, Feedback und Scheduling | `NFM-CAP-05`, `NFM-CAP-13` | `NFM-OP-05` | `lanes`, `schedules`, `operations`, `events` | `docs`, `tooling` | `authorable-now` | `P2` | `yes` | `none` | `feedback-lane-pattern-docs` | `xtend.rmt.vnext-scheduler-policy.v1`, `xtend.native-first.framework-leverage-layer.v1` | `rmt-vnext-scheduler`, `rmt-event-routing-runtime`, `native-first-framework-leverage` | `NFM-WP-19` |
| `NFM-RUG-09` | `NFM-MP-09` SSR, Hydration und Progressive Boot | `NFM-CAP-01`, `NFM-CAP-14` | `NFM-OP-03` | `templates`, `surfaces`, `schedules`, `securityPolicies` | `tooling`, `docs` | `authorable-with-adapter-residual` | `P1` | `partial` | `no-production-bundle-claim-without-release-gate` | `hydration-boot-record-handoff` | `xtend.rmt.core-format.vnext.v1`, `xtend.native-first.audit-evidence-pack.v1` | `rmt-app-platform-tooling`, `rmt-app-platform-fixture`, `epic18-rmt-app-platform` | `NFM-WP-19`, `NFM-WP-20` |
| `NFM-RUG-10` | `NFM-MP-10` Error Boundaries und Diagnostics | `NFM-CAP-13`, `NFM-CAP-18` | `NFM-OP-05` | `operations`, `events`, `diagnostics` | `adapter`, `docs` | `authorable-now` | `P1` | `yes` | `none` | `diagnostic-boundary-record` | `xtend.native-first.framework-leverage-layer.v1`, `xtend.native-first.audit-evidence-pack.v1` | `rmt-event-routing-runtime`, `rmt-surface-resource-graph-runtime`, `native-first-evidence-pack` | `NFM-WP-19` |
| `NFM-RUG-11` | `NFM-MP-11` Data Display Collections | `NFM-CAP-16` | `NFM-OP-06` | `components`, `templates`, `dataSources`, `resources` | `component-contract`, `syntax`, `adapter`, `tooling`, `docs` | `owned-primitive-needed` | `P0` | `no` | `no-table-tree-data-grid-virtual-list-claim` | `collection-view-record-and-owned-data-display-package` | `xtend.native-first.ui-primitive-capability.v1`, `xtend.native-first.market-pattern-parity.v1` | `native-first-market-pattern-parity`, `rmt-component-template-primitives`, `rmt-surface-resource-graph-runtime` | `NFM-WP-15`, Folgeepic `owned-data-display-package` |
| `NFM-RUG-12` | `NFM-MP-12` Command Palette und rich Search Controls | `NFM-CAP-17` | `NFM-OP-08` | `components`, `events`, `actions`, `state`, `resources` | `component-contract`, `syntax`, `adapter`, `tooling`, `docs` | `owned-primitive-needed` | `P1` | `no` | `no-command-palette-autocomplete-rich-combobox-claim` | `command-source-record-and-owned-search-package` | `xtend.native-first.ui-primitive-capability.v1`, `xtend.native-first.market-pattern-parity.v1` | `native-first-market-pattern-parity`, `rmt-action-effect-runtime`, `rmt-event-routing-runtime` | `NFM-WP-15`, `NFM-WP-16`, Folgeepic `owned-command-search-package` |

## Coverage Summary

| Coverage Status | Anzahl | Gap-IDs |
|-----------------|--------|---------|
| `authorable-now` | 3 | `NFM-RUG-04`, `NFM-RUG-08`, `NFM-RUG-10` |
| `authorable-with-adapter-residual` | 4 | `NFM-RUG-01`, `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-09` |
| `contract-only-gap` | 1 | `NFM-RUG-06` |
| `syntax-growth-needed` | 2 | `NFM-RUG-02`, `NFM-RUG-07` |
| `owned-primitive-needed` | 2 | `NFM-RUG-11`, `NFM-RUG-12` |
| `renderer-proof-deferred-to-wp18` | 0 | Querschnitts-Residual fuer `NFM-RUG-07`; keine eigene Coverage-Zeile |

## App Authorability Summary

| App Authorable Without Manual Shell | Anzahl | Gap-IDs |
|-------------------------------------|--------|---------|
| `yes` | 3 | `NFM-RUG-04`, `NFM-RUG-08`, `NFM-RUG-10` |
| `partial` | 6 | `NFM-RUG-01`, `NFM-RUG-02`, `NFM-RUG-03`, `NFM-RUG-05`, `NFM-RUG-07`, `NFM-RUG-09` |
| `no` | 3 | `NFM-RUG-06`, `NFM-RUG-11`, `NFM-RUG-12` |

## Priorisierte Folgeentscheidungen

| Folge | Entscheidung |
|-------|--------------|
| `NFM-WP-15` | `layout-region-slot-composition-sugar`, `surface-region-portal-overlay-records`, `route-shell-record-and-navigation-state-binding`, `collection-view-record-and-owned-data-display-package`, `command-source-record-and-owned-search-package` entscheiden |
| `NFM-WP-16` | `resource-query-lifecycle-record`, `command-action-binding-record` und `form-binding-validation-result-record` gegen Action, Effect, Data und Resource Contracts schneiden |
| `NFM-WP-17` | Complete-UI-Recipe-Fixtures fuer App Shell, Dashboard, Form, Overlay, Data Display, Command/Search, Media und Docs Flow gegen diese Matrix gebaut |
| `NFM-WP-18` | DOM Descriptor Renderer, Trusted DOM und Surface Renderer Proofs fuer `NFM-RUG-07`, `NFM-RUG-09` und HTML-nahe Residuals pruefen |
| `NFM-WP-19` | Budget-, Complexity- und Performance-Gates fuer `authorable-now` und `authorable-with-adapter-residual` Claims definieren |

## Blockierte Claims nach WP-14

| Claim | Status | Grund |
|-------|--------|-------|
| XTend hat fertige DataGrid-, Table-, Tree- und VirtualList-Paritaet | `blocked-negative-claim` | `NFM-RUG-11` bleibt `owned-primitive-needed` |
| XTend hat fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | `blocked-negative-claim` | `NFM-RUG-12` bleibt `owned-primitive-needed` |
| RMT kann jede App-UI ohne Syntax Growth ausdruecken | `blocked-negative-claim` | `NFM-RUG-02` und `NFM-RUG-07` bleiben `syntax-growth-needed` |
| Resource/Data UI ist schon vollstaendige UI-Familie | `blocked-negative-claim` | `NFM-RUG-06` bleibt `contract-only-gap` |
| Native Navigation API ist produktiver XTend-Routing-Default | `blocked-negative-claim` | `NFM-RUG-01` bleibt Radar-/Adapter-Residual |

## Positiv erlaubte Claims

| Claim | Status |
|-------|--------|
| RMT besitzt belegbare Authoring-Pfade fuer State, Theme State, Feedback Scheduling und Diagnostics | `allowed-with-gate-evidence` |
| App Shell, Forms, Actions, SSR und Hydration sind RMT-nah authorbar, aber mit dokumentierten Adapter-Residuals | `allowed-with-residual` |
| Data Display, Command/Search, Surface Maximality und Resource UI sind priorisierte Folgepakete statt versteckte Produktclaims | `allowed-negative-claim` |
| RMT-Kernel bleibt trotz UI-Maximality-Ziel host-neutral und dependency-frei | `allowed-boundary-claim` |

## Handoff an WP-15 und WP-16

WP-15 startet nicht bei Null. Die P0-Schnittmenge ist:

- `NFM-RUG-01` fuer Route Shell und Navigation State
- `NFM-RUG-02` fuer Layout/Slot/Region Syntax
- `NFM-RUG-06` fuer Resource/Data Lifecycle Core Records
- `NFM-RUG-07` fuer Surface, Portal, Overlay und Workspace Syntax
- `NFM-RUG-11` fuer Data Display Collection View

WP-16 uebernimmt die Action-/Effect-/Data-Schicht:

- `NFM-RUG-03` fuer Form Binding und Validation Result Records
- `NFM-RUG-05` fuer Command Action Binding
- `NFM-RUG-06` fuer Resource Query Lifecycle
- `NFM-RUG-12` fuer Command Source und Search Resource Binding

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| Jede Market-Pattern-ID `NFM-MP-01` bis `NFM-MP-12` ist genau einer Gap-Zeile zugeordnet | erfuellt |
| P0-Gaps fuer Layout, Surface, Resource/Data und Data Display sind priorisiert | erfuellt |
| Command/Search bleibt als P1 owned primitive package geschnitten | erfuellt |
| Positive und blockierte Produktclaims sind getrennt | erfuellt |
| Keine neue Runtime-Dependency und keine Host-Kopplung im RMT-Kernel | erfuellt |
