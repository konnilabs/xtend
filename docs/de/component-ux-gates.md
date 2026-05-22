# Component UX Gates

Docs Contract: `xtend.docs.component-ux-gates.v1`

Diese Seite beschreibt die lokale Gate-Kette fuer Epic 11. Sie verbindet Authoring Guides, Browser-Smokes, Theme-Matrix, RMT Shell Authoring, Component Lab und Reference-Gates.

## Gate-Gruppen

| Gruppe | Gate | Zweck |
| --- | --- | --- |
| Foundation | `component-shell-contract` | Component Shell Contract `xtend.component.shell.v1` |
| Foundation | `component-styling-contract` | Styling Contract `xtend.component.styling.v1` |
| Foundation | `runtime-a11y-contract` | Runtime A11y `xtend.component.runtime-a11y.v1` |
| Foundation | `component-ux-performance` | Performance Profile `xtend.component.ux-performance.v1` |
| Foundation | `component-network-contract` | Component Network `xtend.component.network.v1` |
| RMT | `rmt-shell-authoring-ux` | RMT Shell Authoring `xtend.rmt.shell-authoring.v1` |
| Lab | `component-lab-ux-inspector` | Component Lab UX Inspector `xtend.epic11.component-lab-ux-inspector.v1` |
| Browser | `component-ux-browser-smokes` | Browser UX Smokes `xtend.epic11.component-ux-browser-smokes.v1` |
| Visual | `component-shell-theme-matrix` | Component Shell Theme Matrix `xtend.epic11.component-shell-theme-matrix.v1` |
| Docs | `component-ux-authoring-docs` | Component UX Authoring Docs `xtend.epic11.component-ux-authoring-docs.v1` |
| Migration | `component-long-tail-migration` | Legacy Long-Tail Migration `xtend.epic11.legacy-long-tail-migration.v1` |
| Handoff | `epic11-enterprise-ux-handoff` | Epic 11 Enterprise UX Handoff `xtend.epic11.enterprise-ux-handoff.v1` |
| References | `references` | Dokumentations- und Demo-Referenzpfade |

## Schneller Epic-11-Check

```bash
node scripts/run_xtend_tests.js component-network-contract rmt-shell-authoring-ux form-controls-ux feedback-status-ux navigation-routing-ux overlay-interaction-ux layout-display-media-ux component-lab-ux-inspector component-ux-browser-smokes component-shell-theme-matrix component-ux-authoring-docs component-long-tail-migration epic11-enterprise-ux-handoff references --json
```

## PR-Gate

Der PR-Gate enthaelt die Component-UX-Doku, damit neue Guides nicht neben der produktiven Gate-Kette veralten:

```bash
npm run test:pr
```

## Release-Hinweis

`component-shell-theme-matrix` ist noch kein Screenshot-Diff-Runner. Es ist der deterministische, lokale Contract fuer spaetere visuelle Snapshot-Automation. Bis echte Snapshots angeschlossen sind, bleibt diese Matrix die verbindliche Quelle fuer Theme-, Motion-, Density- und Viewport-Pflichten.

## Handoff

Nach `WP-E11-18` ist Epic 11 im Modus `completed-with-accepted-long-tail-handoff` abgeschlossen. Die Legacy Long-Tail Migration ist als Plan gatebar; offene Umsetzungen bleiben bewusst in Wellen priorisiert.
