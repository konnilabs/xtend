# XTend Epic 13 Visual Owner Artifact Contract

- Status: Accepted
- Workpackage: `WP-E13-08`
- Contract: `xtend.epic13.visual-owner-artifact.v1`
- Manifest Contract: `xtend.epic13.visual-owner-artifact-manifest.v1`
- Report: `xtend.epic13.visual-owner-artifact-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json`
- Package Script: `npm run test:epic13-visual-owner-artifact`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

`WP-E13-08` normalisiert das visuelle RC1-Artefakt fuer Release Owner, ohne Pixel-Diff oder echte Screenshot-Erzeugung zu einem lokalen Pflicht-Gate zu machen. Die vorhandene DOM-first Snapshot-Linie bleibt der deterministische Gate. Screenshots und Pixel-Diff werden als reproduzierbarer Owner-/CI-Artefaktpfad beschrieben.

Damit ist der naechste Reifegrad klar: lokale Gates bleiben schnell und stabil, waehrend Release Owner in stabilen Browser-Umgebungen sichtbare UI-Evidenz erzeugen koennen.

## Artefaktmodell

| Feld | Wert |
|------|------|
| Artifact Root | `.xtend-test-results/visual-snapshots/rc1` |
| Manifest | `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` |
| Report | `.xtend-test-results/visual-snapshots/rc1/visual-owner-artifact-report.json` |
| Screenshot Template | `.xtend-test-results/visual-snapshots/rc1/{family}/{viewport}/{theme}/{density}/{motion}.png` |
| Fixture | `tests/browser/fixtures/visual-snapshots-fixture.html` |
| DOM Baseline | `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` |

Der lokale Gate-Modus ist `static-artifact-manifest-plus-dom-snapshot-gate`. Der Owner-Artefaktmodus ist `optional-browser-driver-or-ci-artifact`.

## Deterministische Viewports

- `desktop-1280`: 1280 x 900
- `tablet-768`: 768 x 1024
- `mobile-390`: 390 x 844

Die Matrix nutzt weiterhin die vorhandenen Theme-, Motion- und Density-Dimensionen aus der Snapshot-Automation: `light`, `dark`, `high-contrast`, `forced-colors`, `default-motion`, `reduced-motion`, `comfortable`, `compact`, `dense`.

## Local-Gate-Grenze

Im lokalen Default-Gate gelten bewusst:

- `pixelDiffRequiredInLocalGate: false`
- `screenshotRequiredInLocalGate: false`
- `binaryBaselineCommitted: false`
- `externalBrowserRequiredInLocalGate: false`
- `externalNetworkAllowedInLocalGate: false`

Der maschinenlesbare Contract validiert DOM-Diff, Matrix-Umfang, Manifest, Package-Metadaten und Dokumentation. Pixel-Diff bleibt ein optionales Artefakt fuer stabile Browser-/CI-Umgebungen.

## Handoff

`WP-E13-08` ist abgeschlossen. `WP-E13-09` ist ready und buendelt als naechsten Schritt die RMT-first App Production Readiness.
