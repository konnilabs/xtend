# XTend RMT UI Maximality und Owned Component Surface Hardening Residual Matrix

- Status: `accepted by WP-RMO-01`
- Datum: 3. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-component-surface-hardening.source-of-truth.v1`
- Matrix: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-matrix.v1`
- Residual Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixture.v1`
- Fixture Pack Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.residual-fixtures.v1`
- Fixture Pack: `tests/fixtures/native-first/rmt-ui-maximality-owned-surface-residual-fixtures.json`
- Report Schema: `xtend.rmt-ui-maximality-owned-component-surface-hardening.baseline-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-ui-maximality-owned-surface-baseline --json`
- Package Script: `npm run test:rmt-ui-maximality-owned-surface-baseline`
- Next Epic Boundary: `rmt-ui-maximality-and-owned-component-surface-hardening`

## Residual Fields

`residualId`, `residual`, `sourceHandoffs`, `residualClass`, `priority`, `owner`, `targetWorkpackage`, `targetStatus`, `claimBoundary`, `requiredGates`, `sourceArtifacts`, `blockedClaims`, `nextHandoff`

## Residual Baseline

| Residual-ID | Residual | Source Handoffs | Klasse | Prio | Owner | Ziel-WP | Zielstatus | Claim Boundary | Required Gates | Blocked Claims | Next Handoff |
|-------------|----------|-----------------|--------|------|-------|---------|------------|----------------|----------------|----------------|--------------|
| `RMO-RES-01` | `surface-browser-lab` | `NFM-HO-05`, `NFM-HO-06` | `browser-evidence` | `P1` | `rmt-ui-authoring-owner` | `WP-RMO-06` | `browser-evidence-planned` | `no-surface-visual-claim-without-browser-artifact` | `surface-browser-lab`, `native-first-budget-gates`, `rmt-renderer-dom-descriptor-proofs`, `references` | `complete-surface-browser-claim`, `visual-claim-without-artifact` | `WP-RMO-06` |
| `RMO-RES-02` | `data-display-parity` | `NFM-HO-03`, `NFM-HO-05` | `owned-component-gap` | `P0` | `component-platform-owner` | `WP-RMO-03` | `implementation-ready` | `no-datagrid-parity-claim-before-owned-package` | `native-first-market-pattern-parity`, `rmt-ui-primitive-gap`, `contract-registry`, `references` | `full-datagrid-parity`, `framework-table-api-copy` | `WP-RMO-03` |
| `RMO-RES-03` | `command-search-parity` | `NFM-HO-03`, `NFM-HO-05` | `owned-component-gap` | `P0` | `component-platform-owner` | `WP-RMO-04` | `implementation-ready` | `no-command-palette-parity-claim-before-owned-package` | `native-first-framework-leverage`, `native-first-overlay-focus`, `rmt-action-effect-data-resource-primitives`, `rmt-ui-primitive-gap`, `references` | `command-palette-full-parity`, `unregistered-command-execution` | `WP-RMO-04` |
| `RMO-RES-04` | `visual-evidence-artifacts` | `NFM-HO-05`, `NFM-HO-06` | `visual-evidence` | `P1` | `performance-owner` | `WP-RMO-06` | `browser-evidence-planned` | `no-visual-claim-without-artifact` | `native-first-budget-gates`, `rmt-renderer-dom-descriptor-proofs`, `surface-browser-lab`, `references` | `visual-regression-complete`, `pixel-baseline-claim-without-artifact` | `WP-RMO-06` |
| `RMO-RES-05` | `docs-public-quality-legacy-failures` | `NFM-HO-04`, `NFM-HO-06` | `docs-gate-residual` | `P0` | `docs-authoring-owner` | `WP-RMO-02` | `gate-residual-ready` | `no-public-completeness-claim-before-docs-quality` | `docs-public-quality`, `native-first-docs-authoring`, `references` | `public-docs-complete`, `localized-docs-clean` | `WP-RMO-02` |
| `RMO-RES-06` | `component-long-tail-migration-docs-file` | `NFM-HO-06` | `docs-path-residual` | `P0` | `migration-owner` | `WP-RMO-02` | `gate-residual-ready` | `component-long-tail-docs-path-required` | `component-long-tail-migration`, `references` | `long-tail-migration-complete` | `WP-RMO-02` |
| `RMO-RES-07` | `type-exports-docs-links` | `NFM-HO-06` | `type-exports-docs-residual` | `P0` | `migration-owner` | `WP-RMO-02` | `gate-residual-ready` | `type-export-doc-links-required` | `type-exports-vendor`, `type-exports-loader`, `references` | `type-exports-release-clean` | `WP-RMO-02` |
| `RMO-RES-08` | `legacy-loader-warning-window` | `NFM-HO-02` | `migration-policy-residual` | `P2` | `migration-owner` | `WP-RMO-08` | `migration-handoff-planned` | `no-silent-loader-removal` | `native-first-migration-deprecation`, `type-exports-loader`, `rmt-native-shell-migration`, `references` | `silent-loader-removal`, `loader-deprecation-without-warning-window` | `WP-RMO-08` |
| `RMO-RES-09` | `owned-docs-highlighter-review` | `NFM-HO-02` | `docs-tooling-ownership-residual` | `P2` | `docs-authoring-owner` | `WP-RMO-08` | `migration-handoff-planned` | `no-new-vendor-highlighter-default` | `native-first-migration-deprecation`, `type-exports-vendor`, `docs-public-quality`, `references` | `new-vendor-highlighter-default`, `broad-vendor-export` | `WP-RMO-08` |

## Priority Summary

| Priority | Count |
|----------|-------|
| `P0` | 5 |
| `P1` | 2 |
| `P2` | 2 |

## Target Workpackage Summary

| Ziel-WP | Count |
|---------|-------|
| `WP-RMO-02` | 3 |
| `WP-RMO-03` | 1 |
| `WP-RMO-04` | 1 |
| `WP-RMO-06` | 2 |
| `WP-RMO-08` | 2 |

## Target Status Summary

| Status | Count |
|--------|-------|
| `gate-residual-ready` | 3 |
| `implementation-ready` | 2 |
| `browser-evidence-planned` | 2 |
| `migration-handoff-planned` | 2 |

## Startbarkeitsnotiz

- `WP-RMO-02` bleibt direkt `ready`, weil die drei Gate-Hygiene-Residuals klar isoliert sind.
- `WP-RMO-03` und `WP-RMO-04` sind fachlich `implementation-ready`, bleiben im Backlog aber `next`, bis `WP-RMO-02` die bekannten Docs-/TypeExports-/Long-Tail-Gate-Residuals geschlossen oder owner-deferred hat.
- `WP-RMO-06` und `WP-RMO-08` bleiben geplant, weil sie echte Browser-/Visual- oder Migration-Handoff-Artefakte brauchen.
