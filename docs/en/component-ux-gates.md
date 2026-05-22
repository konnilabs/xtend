# Component UX Gates

Docs contract: `xtend.docs.component-ux-gates.v1`

This page describes the local gate chain for Epic 11. It connects authoring guides, browser smokes, theme matrix, RMT shell authoring, Component Lab and reference gates.

## Gate Groups

| Group | Gate | Purpose |
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
| References | `references` | Documentation and demo reference paths |

## Quick Epic 11 Check

```bash
node scripts/run_xtend_tests.js component-network-contract rmt-shell-authoring-ux form-controls-ux feedback-status-ux navigation-routing-ux overlay-interaction-ux layout-display-media-ux component-lab-ux-inspector component-ux-browser-smokes component-shell-theme-matrix component-ux-authoring-docs component-long-tail-migration epic11-enterprise-ux-handoff references --json
```

## PR Gate

The PR gate includes the Component UX docs so new guides do not drift away from the productive gate chain:

```bash
npm run test:pr
```

## Release Note

`component-shell-theme-matrix` is not a screenshot diff runner yet. It is the deterministic local contract for later visual snapshot automation. Until real snapshots are connected, this matrix remains the binding source for theme, motion, density and viewport obligations.

## Handoff

After `WP-E11-18`, Epic 11 is complete in `completed-with-accepted-long-tail-handoff` mode. The legacy long-tail migration is gateable as a plan; open implementations intentionally remain prioritized in waves.
