# WP-E13-08 - Visual Screenshot/Pixels als RC1-Artefakt normalisieren

- Status: `completed`
- Workpackage Contract: `xtend.epic13.wp08.visual-owner-artifact.v1`
- Epic Contract: `xtend.epic13.visual-owner-artifact.v1`
- Manifest Contract: `xtend.epic13.visual-owner-artifact-manifest.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json`
- Package Script: `npm run test:epic13-visual-owner-artifact`
- Publish Boundary: `private-until-release-owner-acceptance`

## Ziel

XTend braucht vor RC1 eine wiederholbare visuelle Evidence-Linie, die Release Ownern sichtbare UI-Artefakte liefern kann, aber lokale Entwickler nicht an Browser-Treiber, Pixel-Flakiness oder Binaer-Baselines bindet.

## Umgesetzt

- `catalog/epic13-visual-owner-artifact.js` definiert Contract, Validator und Report.
- `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` normalisiert Artifact Root, Report-Pfad, Screenshot-Pfadtemplate, Viewports und Capture-Familien.
- `tests/platform/epic13_visual_owner_artifact_suite.js` prueft Contract, Manifest, Visual-Snapshot-Quelle, Package, Scaffold, Runner, Docs, Registry, CI-Matrix und Release-Checklist.
- `docs/visual-owner-artifacts.md` beschreibt den Entwickler- und Release-Owner-Pfad.
- `package.json` exportiert `./catalog/epic13-visual-owner-artifact` und fuehrt `npm run test:epic13-visual-owner-artifact` als Release-Gate.

## Ergebnis

Der lokale Gate bleibt `static-artifact-manifest-plus-dom-snapshot-gate`. Pixel-Diff und Screenshot-Erzeugung sind als `optional-browser-driver-or-ci-artifact` vorbereitet, aber lokal nicht verpflichtend. Binaere Screenshot-Baselines werden nicht committed.

## Handoff

`WP-E13-09` ist ready. Das naechste Paket buendelt RMT-first App Production Readiness als RC1-Pfad.
