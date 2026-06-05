# XTend Native-First Migration Deprecation Plan Matrix

- Status: `accepted by NFM-WP-21`
- Datum: 3. Juni 2026
- Schema: `xtend.native-first.migration-deprecation-matrix.v1`
- Contract: `xtend.native-first.migration-deprecation-plan.v1`
- Item Schema: `xtend.native-first.migration-deprecation-item.v1`
- Fixture Schema: `xtend.native-first.migration-deprecation-fixture.v1`
- Fixture Pack Schema: `xtend.native-first.migration-deprecation-fixtures.v1`
- Report Schema: `xtend.native-first.migration-deprecation-report.v1`
- Fixture Path: `tests/fixtures/native-first/native-first-migration-deprecation-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js native-first-migration-deprecation --json`

## Required Fields

- `migrationId`
- `sourceCandidate`
- `priority`
- `migrationClass`
- `currentSurface`
- `status`
- `deprecationStage`
- `alternative`
- `migrationGuide`
- `requiredGates`
- `semverPolicy`
- `releaseDecision`
- `owner`
- `nextHandoff`

## Migration Matrix

| Migration | Source | Prio | Klasse | Current Surface | Status | Deprecation Stage | Alternative | Migration Guide | Required Gates | SemVer Policy | Release Decision | Owner | Next Handoff |
|-----------|--------|------|--------|-----------------|--------|-------------------|-------------|-----------------|----------------|---------------|------------------|-------|--------------|
| `NFM-MIG-01` | `NFM-RC-01` | `P0` | `manual-html-path` | normale App-UI mit `innerHTML`, `template.innerHTML`, `insertAdjacentHTML` | `migration-required` | `block-new-normal-ui-sinks` | DOM Descriptor Renderer, Trusted DOM und strukturierte DOM APIs | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `rmt-dom-descriptor-renderer`, `rmt-renderer-dom-descriptor-proofs`, `epic13-trusted-dom-boundary`, `native-first-budget-gates` | `minor-warning-major-removal-window` | `blocked-until-descriptor-or-trust-boundary` | `rmt-renderer-security-owner` | `NFM-WP-22` |
| `NFM-MIG-02` | `NFM-RC-02` | `P1` | `vendored-utility` | `components/prism.js` PrismJS Highlighter | `deprecation-planned` | `freeze-facade-no-broad-export` | owned docs semantic-token highlighter oder RMT-aware docs highlighter | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `type-exports-vendor`, `supply-chain`, `docs-public-quality` | `minor-warning-before-public-surface-change` | `allowed-contained-no-new-public-surface` | `docs-authoring-owner` | `owned-docs-highlighter-review` |
| `NFM-MIG-03` | `NFM-RC-03` | `P1` | `vendored-utility` | `components/turndown.js` HTML-to-Markdown Helper | `migration-required` | `trust-boundary-before-new-use` | structured writer, Markdown AST oder Trusted-DOM/Sanitizing Boundary | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `epic13-trusted-dom-boundary`, `rmt-dom-descriptor-renderer`, `native-first-docs-authoring` | `minor-warning-major-removal-window` | `blocked-for-new-raw-html-conversion-without-trust-boundary` | `security-owner` | `NFM-WP-22` |
| `NFM-MIG-04` | `NFM-RC-04` | `P1` | `tooling-dependency` | `xtend-maraca` Rollup/Terser Build Toolchain | `containment-accepted` | `keep-build-tooling-outside-runtime` | local ESM importgraph fallback und local minifier fallback | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `maraca-bundle`, `maraca-size-budget`, `native-first-budget-gates`, `supply-chain` | `no-runtime-deprecation-tooling-contained` | `allowed-build-tooling-not-runtime` | `maraca-tooling-owner` | `NFM-WP-22` |
| `NFM-MIG-05` | `NFM-RC-05` | `P2` | `tooling-dependency` | VS Code Extension mit `vscode-languageclient` | `containment-accepted` | `editor-scope-only` | stdio RMT Language Server bleibt Source of Truth | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `rmt-tooling-docs`, `references`, `manifest-import-policy` | `no-runtime-deprecation-editor-contained` | `allowed-editor-only-not-runtime` | `editor-tooling-owner` | `NFM-WP-22` |
| `NFM-MIG-06` | `NFM-RC-06` | `P2` | `legacy-runtime-surface` | `xtend-dev.js` und `./legacy-loader` Export | `deprecation-planned` | `compatibility-warning-before-removal` | `xtend-loader.js`, RMT Native Shell und App Platform Authoring | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `type-exports-loader`, `rmt-native-shell-migration`, `component-long-tail-migration`, `references` | `major-removal-only-after-two-minor-warnings` | `allowed-compatibility-surface-with-warning-window` | `loader-compat-owner` | `NFM-WP-22` |
| `NFM-MIG-07` | `NFM-RC-07` | `P2` | `vendor-backport-residual` | Epic-18 Media Manager Vendor Backport | `closed-guardrail` | `no-new-vendor-copy` | owned component deltas plus regression smokes | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `epic18-vendor-bugfix-smokes`, `component-contract-v2`, `references` | `no-deprecation-guardrail-only` | `accepted-controlled-backport-no-new-copy` | `component-platform-owner` | `NFM-WP-22` |
| `NFM-MIG-08` | `NFM-RC-08` | `P2` | `owned-vendor-adapter` | `x-icon` Lucide-kompatibler Adapter | `closed-guardrail` | `owned-adapter-pattern` | owned adapter, lokale Icon Packs, kein CDN | `docs/de/native-first-migration-guide.md`, `docs/en/native-first-migration-guide.md` | `native-first-migration-deprecation`, `component-contract-v2`, `native-first-docs-authoring`, `references` | `no-deprecation-owned-pattern` | `accepted-owned-adapter-pattern` | `component-platform-owner` | `NFM-WP-22` |

## Status Summary

| Status | Count |
|--------|-------|
| `migration-required` | 2 |
| `deprecation-planned` | 2 |
| `containment-accepted` | 2 |
| `closed-guardrail` | 2 |

## Priority Summary

| Priority | Count |
|----------|-------|
| `P0` | 1 |
| `P1` | 3 |
| `P2` | 4 |

## Release Decisions

- `blocked-until-descriptor-or-trust-boundary`
- `allowed-contained-no-new-public-surface`
- `blocked-for-new-raw-html-conversion-without-trust-boundary`
- `allowed-build-tooling-not-runtime`
- `allowed-editor-only-not-runtime`
- `allowed-compatibility-surface-with-warning-window`
- `accepted-controlled-backport-no-new-copy`
- `accepted-owned-adapter-pattern`

## Handoff

- `NFM-WP-22` kann Mission-Abschluss und naechste Epic-Grenze mit expliziten Migration-, Deprecation-, Containment- und Guardrail-Entscheidungen bewerten.
