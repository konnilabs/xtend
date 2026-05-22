# RMT-First Demo App

Contract: `xtend.epic10.rmt-first-demo-app.v1`

The RMT-first demo app shows the Epic 10 target path: an XTend app is no longer
built as a manual HTML shell, but rendered from a `.rmt` app document. XTend
provides local Web Components. RMT provides shell, routes, templates,
schedules, Fabric/lane metadata, and diagnostics.

## Starting Point

- Demo: `xtendrmt-rmt-first-demo.html`
- RMT document: `xtendrmt/rmt-first-demo-app.rmt`
- Runtime: `xtendrmt/rmt-first-demo-app.js`
- Browser smoke: `tests/browser/fixtures/rmt-first-demo-app-smoke.html`

The host page contains only the RMT root:

```html
<div
  id="rmt-first-demo-root"
  data-rmt-host="rmt-first-demo"
  data-rmt-document-src="xtendrmt/rmt-first-demo-app.rmt"></div>
```

The shell itself comes from `app.shell.template`.

## What RMT Owns

- App shell
- Routes
- `dom_descriptor` templates
- Component records
- Props, attributes, slots, and event commands
- Schedules and lanes
- Fabric/fiber metadata
- Diagnostics

## What XTend Owns

- Custom Elements
- Manifest lookup
- Component lifecycle
- DOM execution
- XRouter registration
- Fabric execution and telemetry hooks

The RMT kernel imports no XTend components. This boundary remains
`no-rmt-kernel-import-of-xtend-types`.

## Demo Routes

| Route | Path | Content |
|-------|------|---------|
| `dashboard` | `/` | shell-first status and performance coverage |
| `settings` | `/settings` | form controls with `x-select`, `x-checkbox`, `x-radio`, `x-textarea` |
| `overlays` | `/overlays` | `x-tooltip`, `x-popover`, `x-drawer` |

## No-Manual-Shell Rule

The demo is correct only when:

- the host contains no static `x-section` or `x-router` shell tags
- the runtime does not use `innerHTML`
- `manifest.metadata.manualShellAllowed` is `false`
- `manifest.metadata.hostShellMarkup` is `false`
- the browser smoke renders the shell from RMT

## Local Gate

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

The gate checks RMT references, runtime registry normalization, host boundary,
browser smoke, package metadata, and documentation paths.

## Continuation

`WP-E10-14` migrates existing prioritized components into the same RMT/Fabric
metadata line. The demo app remains the first productive acceptance host for
that work.

Since `WP-E13-09`, the demo app is part of
[RMT Production Readiness](./rmt-production-readiness.md). The contract
`xtend.epic13.rmt-production-readiness.v1` uses it as shell-first evidence for
routing, components, Fabric/lane, lifecycle telemetry, and diagnostics.
