# RMT App Platform Tooling

- Contract: `xtend.epic18.rmt-app-platform-tooling.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`
- Workpackage: `WP-E18-11`
- Handoff: `WP-E18-12`

## Goal

RMT app sources are now checkable and buildable before runtime. The tooling creates diagnostics, source maps and scaffold reports for generic App Platform primitives such as surfaces, overlays, portals, resources, actions, events, datasources and state.

The slice is intentionally not a Media Manager shell. It provides tools that let developers create their own app structures natively in XTend/RMT without product-side `innerHTML` renderers or custom mini-frameworks.

## Diagnostics

The App Platform linter blocks typical late runtime errors already during authoring:

- `rmt.app.no-manual-shell.html-sink` for `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` in normal app UI.
- `rmt.app.unsafe-html.boundary-missing` for HTML fragments without explicit Trusted DOM boundary.
- `rmt.app.repeat.key.missing` for repeated surfaces without stable key.
- `rmt.app.event.payload-contract.missing` for events with action target but without payload contract.
- `rmt.app.resource.ownership.missing` for resources without clear owner.
- `rmt.app.resource.unresolved`, `rmt.app.portal.unresolved` and `rmt.app.surface.source.unresolved` for faulty app graph references.

The rules run as a dedicated App Platform policy rule in the existing RMT linter and as a direct analyzer in `./rmt-language/app-platform-tooling`.

## LSP

Completion and hover understand the new primitives:

- portal IDs and portal policies such as `stacked`, `toast-region` and `clipping-escape`
- overlay kinds such as `tooltip`, `toast`, `popover`, `lightbox`, `menu` and `dialog`
- resource kinds such as `object-url`, `stream`, `observer`, `timer` and `lazy-import`
- event kinds and surface initial states

App authors can therefore edit RMT documents without a product surface taxonomy and without external helper lists.

## Scaffold Build

The builder registers the command `rmt-app-platform`. It reads a `.rmt` app source and creates under `.xtend-build`:

- `*.app-platform-diagnostics.json`
- `*.app-platform-source-map.json`
- `*.app-platform-build.json`

The artifacts run through the Epic 17 WritePlan and carry scaffold ownership. `--check` can therefore verify whether local build artifacts are current.

```bash
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node xtend-builder/lib/cli.js rmt-app-platform --source tests/fixtures/rmt-app-platform-tooling.rmt
```

## Boundaries

- No product surface list and no Media Manager-specific registry repaint.
- No normal UI HTML sinks outside a Trusted DOM boundary.
- No imports from XTend components into the RMT kernel.
- The tooling builds reports, diagnostics and source maps; the production-close generic app fixture follows in `WP-E18-12`.
