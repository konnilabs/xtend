# XTend RC0 Gate Matrix

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.epic12.rc0-gate-matrix.v1`
- Gate Record: `xtend.epic12.rc0-gate-record.v1`
- Report: `xtend.epic12.rc0-gate-matrix-report.v1`
- Known Residual Policy: `xtend.epic12.rc0-known-residual-policy.v1`
- Workpackage: `WP-E12-14`
- Lokaler Gate: `node scripts/run_xtend_tests.js rc0-gate-matrix --json`
- Publish Boundary: `private-until-release-owner-approval`

## Zweck

Diese Matrix schneidet aus den vorhandenen XTend-Gates eine erste Release-Candidate-Kette fuer `RC0`. Sie ersetzt die bestehende CI Gate Matrix nicht, sondern legt eine RC0-spezifische Sicht darueber.

RC0 bedeutet: lokal reviewbarer Kandidat, kein Publish. `package.json` bleibt `private: true`, bis ein Release Owner Gate-Ergebnisse, Changelog, Migration Notes, Conditional Network Gates und Package Dry Run akzeptiert.

## Gate Matrix

| Gate | Tier | Command | Pflicht | Zweck |
|------|------|---------|---------|-------|
| `rc0-pr-fast` | PR Fast Gate | `npm run test:pr:report` | ja | schnelle deterministische Baseline |
| `rc0-full-release` | Full Release Gate | `npm run test:release:full:report` | ja | kompletter Runner mit Release Report |
| `rc0-snapshot` | Snapshot Gate | `node scripts/run_xtend_tests.js component-shell-theme-matrix visual-snapshot-automation visual-snapshots design-tokens --json` | ja | Theme Matrix, Snapshot Runner und Design Tokens |
| `rc0-rmt-authoring` | RMT Authoring Gate | `node scripts/run_xtend_tests.js rmt-shell-authoring-ux rmt-first-class-app rmt-first-demo-app docs-rmt-pilot rmt-dsl-authoring-polish --json` | ja | RMT-first Apps, Docs Pilot und DSL Polish |
| `rc0-conditional-network` | Conditional Network Gates | `npm audit --audit-level=moderate` und `npm sbom --sbom-format=cyclonedx --json` | conditional | Netzwerkpruefungen vor Publish |
| `rc0-package-dry-run` | Package Dry Run | `npm run pack:dry-run` | ja | Package-Inhalt, Exports und private Boundary |
| `rc0-known-residual-policy` | Known Residual Policy | Review dieses Dokuments | ja | akzeptierte Restpunkte und Warnungen |
| `rc0-self` | Matrix Self Check | `node scripts/run_xtend_tests.js rc0-gate-matrix --json` | ja | Konsistenz von Contract, Package, Scaffold und Docs |

## Snapshot Gate

Der Snapshot Gate bleibt lokal und DOM-first:

- `component-shell-theme-matrix`
- `visual-snapshot-automation`
- `visual-snapshots`
- `design-tokens`

Binary Pixel Baselines sind fuer RC0 nicht Pflicht. Der stabile Pfad ist `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## RMT Authoring Gate

Der RMT Authoring Gate verbindet:

- `rmt-shell-authoring-ux`
- `rmt-first-class-app`
- `rmt-first-demo-app`
- `docs-rmt-pilot`
- `rmt-dsl-authoring-polish`

Damit sind Shell-first RMT Apps, XRouter, Docs Parsedown Scheduling und die neue DSL-Polish-Schicht gemeinsam reviewbar.

## Conditional Network Gates

Diese Gates sind fuer Publish-Entscheidungen relevant, aber nicht Teil des lokalen Default-Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Wenn Netzwerkzugriff nicht verfuegbar ist, muss der RC0-Handoff die Nichtausfuehrung begruenden. Ein lokaler RC0 Dry Run darf dadurch weiter reviewbar sein; ein Publish nicht.

## Package Dry Run

```bash
npm run pack:dry-run
```

Der Dry Run prueft erwartete Kernpfade wie `package.json`, `README.md`, `CHANGELOG.md`, `xtend-loader.js`, `components`, `fabric`, `xtendrmt`, `xtend-builder` und `docs`. Er oeffnet die Publish Boundary nicht.

## Known Residual Policy

Akzeptierte RC0-Restpunkte:

| Scope | Status | Entscheidung |
|-------|--------|--------------|
| `xstate` | `contract-gated` | akzeptiert als nicht-visuelle Boundary-Probe |
| `x-utils` | `typed-contract-gated` | akzeptiert als Utility-Boundary |
| `xtend.component.hydrate` | `accepted-warning` | Performance-Warnung bleibt unter Fail-Schwelle und unter `maxWarningCount = 2` |

Blocker fuer RC0: keine. Failures bleiben nicht erlaubt.

## Handoff

`WP-E12-15` hat Docs, Migration Notes und Enterprise Adoption Guide auf diese Matrix aktualisiert. `WP-E12-16` hat daraus den eigentlichen RC0-Handoff fuer Release Owner gebaut. Epic 12 steht damit auf `ready-for-release-owner-review-not-publish`.
