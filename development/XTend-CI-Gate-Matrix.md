# XTend CI Gate Matrix

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.ci.gate-matrix.v1`
- Workpackage: `ER-WP-37`
- Workflow: `.github/workflows/xtend-default-gates.yml`
- Node-Version: `26.x`

## Zweck

Die CI-Gate-Matrix trennt schnelles Pull-Request-Feedback von vollstaendigen Release- und Nightly-Gates. Damit bleibt die Entwickler-Rueckmeldung kurz, ohne Browser-, Performance-, RMT- und Full-Suite-Abdeckung aus dem Produktpfad zu verlieren. Seit `ER-WP-40` ist der deterministische Docs-App RMT Parsedown Pilot Teil des PR-Fast-Gates.

`ER-WP-36` hat den Default-CI-Workflow angelegt. `ER-WP-37` macht daraus zwei Verantwortlichkeiten:

- `pr-fast`: schneller, deterministischer Contract-Lauf fuer Pull Requests
- `full-release`: vollstaendiger Report-Lauf fuer Pushes, manuelle Runs und Nightly-Ausfuehrung

## Gate Matrix

| Gate | Contract | Trigger | Command | Report | Artifact |
|------|----------|---------|---------|--------|----------|
| `pr-fast` | `xtend.ci.pr-fast-gate.v1` | `pull_request` | `npm run test:pr:report` | `.xtend-test-results/xtend-pr-gate-report.json` | `xtend-pr-gate-report-node-26` |
| `full-release` | `xtend.ci.full-release-gate.v1` | `push`, `workflow_dispatch`, `schedule` | `npm run test:release:full:report` | `.xtend-test-results/xtend-release-gate-report.json` | `xtend-release-gate-report-node-26` |
| `nightly` | `xtend.ci.nightly-gate.v1` | `17 3 * * *` | `npm run test:release:full:report` | `.xtend-test-results/xtend-release-gate-report.json` | `xtend-release-gate-report-node-26` |

## PR Fast Gate

Das PR-Gate ist fuer schnelle, deterministische Rueckmeldung gedacht. Es prueft Kernarchitektur, priorisierte Komponenten, A11y-Contracts, Catalog-/Regression-Priorisierung, Fabric-Safety, Referenzen und lokale Security-Policies.

```bash
npm run test:pr
npm run test:pr:report
```

Suite-Auswahl:

```text
core
architecture
components
a11y-hydration
screenreader-signals
motion-contrast
catalog-coverage
regression-priority
fabric
fabric-lane-mapping
fabric-lifecycle-boundary
fabric-reporters
fabric-runtime-bridge
references
supply-chain
manifest-import-policy
docs-rmt-pilot
```

Nicht im PR-Fast-Gate:

- `browser`
- `performance-regression`
- `hydration-policy`
- `fabric-performance-measurements`
- `fabric-component-fibers`
- `fabric-route-fibers`
- `fabric-telemetry-snapshot`
- `rmt-compatibility`

Diese Suites bleiben im Full-Release-Gate, weil sie browsernah, performancebezogen, integrationsbreit oder schwergewichtiger sind.

## Full Release Gate

Das Full-Release-Gate fuehrt die komplette Runner-Suite aus und schreibt einen eigenen Release-Gate-Report.

```bash
npm run test:release:full
npm run test:release:full:report
```

Der Lauf entspricht dem lokalen Default-Runner:

```bash
node scripts/run_xtend_tests.js
```

Er umfasst damit Browser-Smokes, Performance Regression, Hydration Policies, Fabric-Performance, Component-/Route-Fibers, Telemetry Snapshot, RMT-Kompatibilitaet und alle PR-Fast-Suites.

## Nightly Policy

Nightly nutzt denselben Command wie `full-release`. Das haelt die Matrix klein und vermeidet ein drittes semantisches Gate, solange keine zusaetzlichen Visual-Snapshot-Artefakte angebunden sind.

Netzwerkbasierte Supply-Chain-Gates wie `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` bleiben ausserhalb der lokalen Default-Matrix. `ER-WP-38` ordnet sie als Conditional Network Gates der Release Checklist zu; `DPF-WP-03` produktisiert dafuer den separaten CI-Job `conditional-network-evidence` mit `npm run conditional-network:evidence` und Owner-Deferral-Artefakten.

## RC0 Overlay

Seit `WP-E12-14` liegt ueber dieser allgemeinen CI-Matrix die Release-Candidate-Sicht `xtend.epic12.rc0-gate-matrix.v1`.

Der RC0 Overlay nutzt:

- `npm run test:pr:report` als PR Fast Gate
- `npm run test:release:full:report` als Full Release Gate
- `node scripts/run_xtend_tests.js component-shell-theme-matrix visual-snapshot-automation visual-snapshots design-tokens --json` als Snapshot Gate
- `node scripts/run_xtend_tests.js rmt-shell-authoring-ux rmt-first-class-app rmt-first-demo-app docs-rmt-pilot rmt-dsl-authoring-polish --json` als RMT Authoring Gate
- `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` als Conditional Network Gates
- `npm run pack:dry-run` als Package Dry Run
- `node scripts/run_xtend_tests.js rc0-gate-matrix --json` als Matrix Self Check
- `node scripts/run_xtend_tests.js epic12-docs-adoption --json` als Docs-, Migration-Notes- und Adoption-Gate aus `WP-E12-15`
- `node scripts/run_xtend_tests.js epic12-rc0-handoff --json` als Abschluss-, Owner-Review- und Publish-Boundary-Gate aus `WP-E12-16`
- `node scripts/run_xtend_tests.js epic13-rc1-readiness --json` als RC1-Readiness-, Gate-Luecken- und Feature-Drift-Gate aus `WP-E13-01`
- `node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json` als Release Owner Acceptance-, Deferral- und Publish-Boundary-Gate aus `WP-E13-02`
- `node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json` als Conditional Network Evidence-, Offline-Deferral- und Publish-Blocking-Gate aus `WP-E13-03`
- `node scripts/run_xtend_tests.js epic13-package-export-lock --json` als Package Export Lock-, Files- und Export-Surface-Gate aus `WP-E13-04`
- `node scripts/run_xtend_tests.js epic13-known-residual-triage --json` als Known Residual Triage Gate aus `WP-E13-05`
- `node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json` als Hydration Performance Closure Gate aus `WP-E13-06`
- `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json` als PROD Browser CSP Gate aus `WP-E13-07`
- `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json` als Visual Owner Artifact Gate aus `WP-E13-08`
- `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json` als RMT Production Readiness Gate aus `WP-E13-09`
- `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json` als Docs RMT Production Hardening Gate aus `WP-E13-10`
- `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json` als Trusted DOM Boundary Gate aus `WP-E13-11`
- `node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json` / `npm run test:epic13-rc1-migration-notes` als RC1 Migration Notes-, SemVer- und Changelog-Gate aus `WP-E13-12`
- `node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json` / `npm run test:epic13-rc1-gate-matrix-ci-handoff` als RC1 Gate Matrix-, Report-Artefakt- und CI-Handoff-Gate aus `WP-E13-13`
- `node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json` / `npm run test:epic13-release-report-pack-dry-run-evidence` als Release Report-, `npm run release:report`- und `npm run pack:dry-run`-Owner-Evidence-Gate aus `DPF-WP-02`
- `node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json` / `npm run test:epic13-conditional-network-evidence-ci` als Conditional Network Evidence CI-, `npm run conditional-network:evidence`- und `conditional-network-evidence`-Workflow-Gate aus `DPF-WP-03`
- `npm run pack:dry-run:report` als Release-Owner-Artefaktlauf fuer `npm pack --dry-run --json`

Publish bleibt trotz gruener RC0 Matrix durch `private-until-release-owner-approval` blockiert.

## Package Metadata

`package.json` spiegelt die Matrix unter:

```text
xtend.ciGateMatrix
```

Pflichtfelder:

- `schema: xtend.ci.gate-matrix.v1`
- `prFastGate.schema: xtend.ci.pr-fast-gate.v1`
- `fullReleaseGate.schema: xtend.ci.full-release-gate.v1`
- `nightlyGate.schema: xtend.ci.nightly-gate.v1`
- stabile Commands, Report-Pfade und Artifact-Namen

## Handoff

| Folgepaket | Status | Aufgabe |
|------------|--------|---------|
| `ER-WP-38` | `completed` | Release Checklist und SemVer Policy auf Gate-Matrix aufgesetzt |
| `ER-WP-39` | `completed` | Enterprise Adoption Guide nach Release-Policy geschrieben |
| `ER-WP-40` | `completed` | Docs-App mit RMT Parsedown Scheduling Pilot und eigenem PR-Fast-Gate abgeschlossen |

`ER-WP-37` ist abgeschlossen, wenn Workflow, Package-Scripts, Package-Metadaten, Dokumentation und Reference-Gate dieselbe Gate-Matrix beschreiben.
