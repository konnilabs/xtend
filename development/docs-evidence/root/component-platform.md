# Component Platform

This page is the root index for the XTend component platform docs. It links the TypeScript-first component model, RMT-first app authoring, Fabric integration and Epic 10/11 release gates without becoming a runtime dependency.

## Epic 10 Platform

Epic 10 Platform Gates compose the local browser, a11y, performance, visual, RMT-first Demo-App and reference checks:

```bash
node scripts/run_xtend_tests.js epic10-platform-gates --json
```

Epic 10 Release Handoff keeps the release boundary documented for downstream owners.

The P0 component wave covers:

- `x-select`
- `x-checkbox`
- `x-toggle`
- `x-radio`
- `x-textarea`
- `x-status`
- `x-progress`
- `x-tooltip`
- `x-popover`
- `x-drawer`

Component Lab and RMT Inspector remain the local inspection path for component contracts, RMT records, telemetry, a11y hints and performance hints.

## RMT Apps

RMT-first Demo-App documents the shell-first reference app. The vNext authoring source is `xtendrmt/rmt-first-demo-app.rmt`; runtime parity is stored in `xtendrmt/rmt-first-demo-app.core.json`.

RMT-first XTend Apps keep the kernel boundary `no-rmt-kernel-import-of-xtend-types`: XTend component execution stays in host adapters, while RMT owns app structure, routes, templates, schedules and metadata.

## Component UX Authoring

Component UX Authoring is covered by:

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
```

Related contracts and gates:

- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.network.v1`
- `xtend.rmt.shell-authoring.v1`
- `xtend.epic11.component-lab-ux-inspector.v1`
- `xtend.epic11.component-ux-browser-smokes.v1`
- `xtend.epic11.component-shell-theme-matrix.v1`
- `component-shell-contract`
- `component-styling-contract`
- `runtime-a11y-contract`
- `component-ux-performance`
- `component-network-contract`
- `rmt-shell-authoring-ux`
- `component-lab-ux-inspector`
- `component-ux-browser-smokes`
- `component-shell-theme-matrix`
- `component-ux-authoring-docs`
- `references`

Epic 11 Enterprise UX Handoff extends the same platform surface for enterprise adoption.
