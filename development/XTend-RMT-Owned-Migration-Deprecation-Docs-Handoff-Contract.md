# XTend RMT Owned Migration Deprecation Docs Handoff Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-fixtures.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-migration-deprecation-docs-handoff-report.v1`
- Workpackage: `WP-RMO-08`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-migration-deprecation-docs-handoff --json`
- Package Script: `npm run test:rmt-owned-migration-deprecation-docs-handoff`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-RMT-Owned-Contract-Budget-Runtime-Parity-Contract.md`
  - `development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md`
  - `development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md`
  - `development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md`
  - `docs/de/native-first-migration-guide.md`
  - `docs/en/native-first-migration-guide.md`
  - `tests/fixtures/native-first/rmt-owned-migration-deprecation-docs-handoff-fixtures.json`
  - `tests/native-first/rmt_owned_migration_deprecation_docs_handoff_suite.js`

## Zweck

`WP-RMO-08` finalisiert die zwei verbliebenen Migration-/Docs-Residuals aus dem RMO-Backlog: `legacy-loader-warning-window` und `owned-docs-highlighter-review`. Die Entscheidungen bleiben bewusst konservativ: Kompatibilitaet darf weiter existieren, aber nicht still entfernt werden; Prism und Turndown bleiben containete Fassaden oder Trust-Boundary-Themen, aber kein neuer Vendor-Default fuer normale App-UI.

## Entscheidungen

| Residual | Entscheidung | Boundary |
|----------|--------------|----------|
| `legacy-loader-warning-window` | `compatibility-warning-window-accepted` mit zwei Minor-Warnfenstern vor Major-Removal | `no-silent-loader-removal` |
| `owned-docs-highlighter-review` | `owned-docs-highlighter-roadmap-accepted`; Prism bleibt frozen facade, kein breiter Public Export | `no-new-vendor-highlighter-default` |
| `PrismJS` | `contained-facade-no-broad-export`; Alternative ist owned Docs Highlighter oder RMT-aware Semantic Tokens | `no-broad-vendor-export` |
| `TurndownService` | `trust-boundary-before-new-use`; Alternative ist structured writer, Markdown AST oder Sanitizing Boundary | `no-new-raw-html-conversion-without-trust-boundary` |
| Public Docs | `public-docs-handoff-accepted`; `docs/de/native-first-migration-guide.md` und `docs/en/native-first-migration-guide.md` nennen Alternativen und Gates | `migration-guide-before-public-deprecation` |

## Nicht-Ziele

- keine sofortige Entfernung des Legacy Loaders
- keine stille Deprecation ohne Warnfenster
- kein neuer Vendor-Highlighter-Default
- kein breiter Prism-, Turndown- oder Vendor-Re-Export
- keine neue Runtime-Dependency
- keine Freigabe neuer Raw-HTML-Konvertierung ohne Trust Boundary

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-migration-deprecation-docs-handoff` | lokaler WP-RMO-08 Gate |
| `native-first-migration-deprecation` | NFM-WP-21 Migrations- und Deprecation-Plan |
| `type-exports-loader` | Legacy Loader Type-Exports und Warnfenster |
| `rmt-native-shell-migration` | Native Shell Migration statt stiller Loader-Entfernung |
| `component-long-tail-migration` | Long-Tail Docs-/Component-Handoff |
| `type-exports-vendor` | schmale Prism-/Turndown-Fassaden |
| `docs-public-quality` | Public Docs Guardrail |
| `rmt-owned-contract-budget-runtime-parity` | gatebare RMO-Contract-/Evidence-Basis |
| `references` | stabile Pfade |

## Handoff

`WP-RMO-08` macht `WP-RMO-09` startbar: Release Owner koennen die Loader-Warnfenster, Docs-Highlighter-Entscheidung, Vendor-Facade-Containment und Public-Docs-Hinweise final akzeptieren oder als sichtbare Residuals in die naechste Epic-Grenze uebernehmen.
