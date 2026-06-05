# XTend RMT Owned Migration Deprecation Docs Handoff Matrix

- Status: `accepted`
- Datum: 4. Juni 2026
- Matrix Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-report.v1`
- Workpackage: `WP-RMO-08`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json`

## Handoff-Matrix

| ID | Residual | Entscheidung | Status | Owner | Warnfenster / Alternative | Required Gates | Blocked Claims | Handoff |
|----|----------|---------------|--------|-------|---------------------------|----------------|----------------|---------|
| `RMO-MIG-01` | `legacy-loader-warning-window` | `compatibility-warning-window-accepted` | `deprecation-handoff-accepted` | `migration-owner` | zwei Minor-Warnungen vor Major-Removal; Native Shell Migration bleibt Alternative | `native-first-migration-deprecation`, `type-exports-loader`, `rmt-native-shell-migration`, `component-long-tail-migration`, `references` | `silent-loader-removal`, `loader-deprecation-without-warning-window` | `WP-RMO-09` |
| `RMO-MIG-02` | `owned-docs-highlighter-review` | `owned-docs-highlighter-roadmap-accepted` | `highlighter-decision-accepted` | `docs-authoring-owner` | owned Docs Highlighter oder RMT-aware Semantic Tokens; Prism bleibt frozen facade | `native-first-migration-deprecation`, `type-exports-vendor`, `docs-public-quality`, `references` | `new-vendor-highlighter-default`, `broad-vendor-export` | `WP-RMO-09` |
| `RMO-MIG-03` | `PrismJS` und `TurndownService` | `vendor-facade-containment-accepted` | `vendor-containment-accepted` | `docs-authoring-owner`, `security-owner` | Prism: no broad public export; Turndown: trust boundary before new use | `native-first-migration-deprecation`, `type-exports-vendor`, `epic13-trusted-dom-boundary`, `docs-public-quality`, `references` | `broad-vendor-export`, `new-raw-html-conversion-without-trust-boundary` | `WP-RMO-09` |
| `RMO-MIG-04` | Public Docs | `public-docs-handoff-accepted` | `docs-handoff-accepted` | `docs-authoring-owner` | Public Docs nennen Alternativen, Gates und Warnfenster | `native-first-migration-deprecation`, `native-first-docs-authoring`, `docs-public-quality`, `references` | `public-deprecation-without-migration-guide`, `public-docs-new-vendor-default` | `WP-RMO-09` |
| `RMO-MIG-05` | Release Residuals | `release-residual-ownerable` | `release-residuals-ownerable` | `release-owner` | offene Runtime-/Browser-/Docs-Entscheidungen bleiben sichtbar ownerbar | `rmt-owned-contract-budget-runtime-parity`, `native-first-migration-deprecation`, `references` | `hidden-release-residual`, `accepted-without-owner` | `WP-RMO-09` |

## Public Docs Handoff

| Docs-Pfad | Inhalt |
|-----------|--------|
| `docs/de/native-first-migration-guide.md` | Native-First Migration Guide mit Prism/Turndown-Alternativen und Gate |
| `docs/en/native-first-migration-guide.md` | Native-First Migration Guide mit Prism/Turndown-Alternativen und Gate |

## SemVer- und Removal-Regeln

| Regel | Wert |
|-------|------|
| Legacy Loader Removal | `major-removal-only-after-two-minor-warnings` |
| Prism Facade | `minor-warning-before-public-surface-change` |
| Turndown Raw HTML | `blocked-for-new-raw-html-conversion-without-trust-boundary` |
| Owned Highlighter | `new-owned-implementation-requires-docs-public-quality-and-type-exports-vendor` |

## Abschluss

`WP-RMO-08` schliesst die beiden RMO-Residuals fachlich als ownerbare Handoffs. `WP-RMO-09` kann damit Release Acceptance, accepted-with-residuals oder naechste Epic-Grenze entscheiden.
