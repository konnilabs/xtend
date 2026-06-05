# XTend Native-First Docs Authoring Guides Matrix

- Status: `accepted by NFM-WP-20`
- Datum: 3. Juni 2026
- Schema: `xtend.native-first.docs-authoring-guide-matrix.v1`
- Guide Item: `xtend.native-first.docs-authoring-guide.v1`
- Contract: `xtend.native-first.docs-authoring-guides.v1`
- Report Schema: `xtend.native-first.docs-authoring-guides-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-docs-authoring --json`

## Required Fields

- `guideId`
- `audience`
- `docsPaths`
- `sourceContracts`
- `requiredGates`
- `requiredTopics`
- `blockedTerms`
- `status`
- `owner`
- `nextHandoff`

## Guide Matrix

| Guide | Audience | Status | Docs Paths | Source Contracts | Required Gates | Required Topics | Blocked Terms | Owner | Next Handoff |
|-------|----------|--------|------------|------------------|----------------|-----------------|---------------|-------|--------------|
| `NFM-DOC-01` | `component-author` | `guide-accepted` | `docs/de/native-first-authoring-guide.md`, `docs/en/native-first-authoring-guide.md` | `xtend.native-first.mission-source-of-truth.v1`, `xtend.native-first.dependency-diet-policy.v1`, `xtend.native-first.contract-registry.v1`, `xtend.native-first.performance-complexity-bundle-budget-gates.v1` | `native-first-docs-authoring`, `contract-registry`, `native-first-budget-gates`, `docs-public-quality` | `browser-native-first`, `avoid-runtime-dependency`, `contract-registry-discoverability`, `trusted-dom-boundary`, `dom-descriptor-default` | `Workpackage`, `Gate Matrix`, `Release Owner`, `external-ui-framework-default`, `unsafe-html-sink` | `docs-authoring-owner` | `NFM-WP-21`, `NFM-WP-22` |
| `NFM-DOC-02` | `app-author` | `guide-accepted` | `docs/de/native-first-rmt-recipes.md`, `docs/en/native-first-rmt-recipes.md` | `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`, `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`, `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` | `native-first-docs-authoring`, `rmt-complete-ui-recipes`, `rmt-renderer-dom-descriptor-proofs`, `references` | `app-shell`, `dashboard`, `form`, `overlay`, `navigation`, `media`, `docs-flow`, `action-effect-data-resource-primitives` | `host-shell-workaround`, `raw-dom-mutation`, `inline-js`, `manual-sink` | `rmt-authoring-owner` | `NFM-WP-21` |
| `NFM-DOC-03` | `release-reviewer` | `guide-accepted-with-residuals` | `docs/de/native-first-release-review.md`, `docs/en/native-first-release-review.md` | `xtend.native-first.contract-registry.v1`, `xtend.native-first.audit-evidence-pack.v1`, `xtend.native-first.performance-complexity-bundle-budget-gates.v1`, `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` | `native-first-docs-authoring`, `native-first-evidence-pack`, `native-first-budget-gates`, `contract-registry`, `references` | `registry-evidence`, `budget-evidence`, `browser-residuals`, `supply-chain`, `redaction`, `blocked-non-native-claims` | `unregistered-contract-claim`, `visual-claim-without-artifact`, `dependency-without-exit-plan` | `release-evidence-owner` | `NFM-WP-22` |

## Status Summary

| Status | Count |
|--------|-------|
| `guide-accepted` | 2 |
| `guide-accepted-with-residuals` | 1 |
| `guide-handoff-to-migration` | 0 |

## Coverage Summary

| Coverage | Ergebnis |
|----------|----------|
| Component Authoring | `NFM-DOC-01` erklaert native-first, dependency-minimal und contract-safe Defaults |
| App Authoring | `NFM-DOC-02` fuehrt RMT-first Recipes auf DOM Descriptor und Source-Map-faehige Records zurueck |
| Release Review | `NFM-DOC-03` verbindet Registry, Evidence Pack, Budget Gates und Browser-Residuals |
| Public Docs | alle Guide-Familien besitzen `de` und `en` Pfade sowie Menu-Eintraege |
| Migration | vendor-backed und non-native Pfade bleiben als `NFM-WP-21` Folgearbeit markiert |

## Blocked Claims

- `external-ui-framework-default`
- `runtime-dependency-without-exit-plan`
- `unsafe-html-sink`
- `inline-js-authoring-comfort`
- `unregistered-contract-claim`
- `visual-claim-without-artifact`
- `host-shell-workaround-before-rmt-recipe`

## Handoff

- `NFM-WP-21` kann aus `NFM-DOC-01` und `NFM-DOC-02` die Migrations- und Deprecation-Pfade fuer vendor-backed, legacy und non-native Patterns ableiten.
- `NFM-WP-22` kann aus `NFM-DOC-03` die finale Mission-Review-Checkliste fuer Contracts, Budgets, Residuals und Release-Evidence ableiten.
