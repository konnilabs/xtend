# WP-SM-18 - Browser-Lab, Pixel-Baselines und echte App-Shell-Projektproben ausbauen

Status: `completed`

## Ziel

Die Surface Runtime wird gegen echte App-Shell-Nutzung und visuelle Stabilitaet abgesichert. Shell-first bleibt das zentrale Kriterium: Die App Shell muss sofort sichtbar und bedienbar sein, waehrend Parsedown-, Routen- und Overlay-Content reproduzierbar hinter SkeletonLoader-Zustaenden liegt.

## Umgesetzte Artefakte

| Artefakt | Pfad |
| --- | --- |
| Catalog | `catalog/surface-manager-browser-lab.js` |
| Browser-Lab Fixture | `tests/browser/fixtures/surface-manager-browser-lab.html` |
| Visual Baseline | `tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json` |
| Test-Suite | `tests/browser/surface_manager_browser_lab_suite.js` |
| Doku | `development/docs-evidence/root/surface-manager-browser-lab.md` |

## Contract

- Schema: `xtend.surface.browser-lab.v1`
- Report: `xtend.surface.browser-lab-report.v1`
- Visual Baseline: `xtend.surface.browser-lab.visual-baseline.v1`
- Performance Report: `xtend.surface.browser-lab.performance-report.v1`
- CLS Report: `xtend.surface.browser-lab.cls-report.v1`
- Gate: `node scripts/run_xtend_tests.js surface-browser-lab --json`

## Snapshots

- `surface-lab-cold-start`
- `surface-lab-skeleton`
- `surface-lab-hydrated`
- `surface-lab-route-change`
- `surface-lab-modal-stack`

## Definition of Done

- Surface-Shell-Kaltstart ist visuell gatebar.
- Skeleton- und Hydration-Zustaende sind reproduzierbar.
- Regressionen gegen Pop-In und Layout Shift schlagen lokal fehl.
- Docs-App und Referenz-Workbench bleiben Projektproben, ohne Doku-App-Monkeypatch.
- Der SurfaceManager bleibt XTend-UI-Schicht und erzeugt keine zweite Registry.

## Handoff

`WP-SM-19` kann die Migration, Doku und das Release-Handoff fuer die Surface Runtime finalisieren.
