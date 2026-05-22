# Visual Owner Artifacts

- Contract: `xtend.epic13.visual-owner-artifact.v1`
- Manifest Contract: `xtend.epic13.visual-owner-artifact-manifest.v1`
- Report: `xtend.epic13.visual-owner-artifact-report.v1`
- Workpackage: `WP-E13-08`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json`
- Package Script: `npm run test:epic13-visual-owner-artifact`
- Manifest: `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

Visual Owner Artifacts verbinden die bestehende DOM-first Visual Snapshot Automation mit einem reproduzierbaren Screenshot-/Pixel-Artefaktpfad fuer RC1. Der lokale Gate validiert Contract, Manifest und DOM-Snapshot-Zustand. Die eigentliche Screenshot-Erzeugung bleibt optional und gehoert in stabile Browser- oder CI-Umgebungen.

## Pfadkonvention

```text
.xtend-test-results/visual-snapshots/rc1/{family}/{viewport}/{theme}/{density}/{motion}.png
```

Der Report liegt unter:

```text
.xtend-test-results/visual-snapshots/rc1/visual-owner-artifact-report.json
```

Die Fixture bleibt `tests/browser/fixtures/visual-snapshots-fixture.html`, die DOM-Baseline bleibt `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## Lokale Nutzung

```bash
npm run test:epic13-visual-owner-artifact
```

Der lokale Modus ist `static-artifact-manifest-plus-dom-snapshot-gate`. `pixelDiffRequiredInLocalGate`, `screenshotRequiredInLocalGate` und `binaryBaselineCommitted` sind `false`.

## Beziehung zu vorhandenen Gates

- Die DOM-Struktur kommt aus [Visual Snapshot Automation](./visual-snapshot-automation.md).
- Die PROD-nahe Browser-/CSP-Vorbereitung kommt aus [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md).
- Das Owner-Artefakt bleibt `optional-browser-driver-or-ci-artifact`, bis eine stabile Browser-Capture-Umgebung als verpflichtender Release-Gate entschieden wird.

## Handoff

`WP-E13-08` ist abgeschlossen. `WP-E13-09` hat `xtend.epic13.rmt-production-readiness.v1` unter [RMT Production Readiness](./rmt-production-readiness.md) gebuendelt. `WP-E13-10` hat [Docs RMT Production Hardening](./docs-rmt-production-hardening.md) abgeschlossen. `WP-E13-11` hat [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) und `xtend.epic13.trusted-dom-boundary.v1` abgeschlossen. `WP-E13-12` hat [RC1 Migration Notes](./rc1-migration-notes.md) und `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` hat [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md) und `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen.
