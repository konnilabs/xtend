# x-rmt-lifecycle-demo-build - XTend Component

## Overview

`<x-rmt-lifecycle-demo-build>` is the RC1 test-build component generated from
`xtendrmt/rmt-lifecycle-demo.rmt`. It serves as local, manifested evidence for
the RMT vNext app build path and combines root lifecycle, template extension,
scheduler handshake, a11y profile, and performance profile in one Custom
Element.

## Usage

```html
<x-rmt-lifecycle-demo-build
  variant="rc1"
  aria-label="RMT Lifecycle Demo Build">
  Lifecycle Demo
</x-rmt-lifecycle-demo-build>
<script type="module" src="/components/x-rmt-lifecycle-demo-build.js"></script>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | String | marks the local demo variant for fixtures and browser smokes |
| `aria-label` | String | required name for the semantic `region` in Shadow DOM |

## Scaffold Contracts

The generated component exposes these static contracts:

- `xtendScaffoldWiring` with `xtend.scaffold.feature-wiring.v1`
- `xtendScaffoldExtensionPoints` with
  `xtend.scaffold.component-extension-points.v1`
- `xtendScaffoldA11yProfile` with `xtend.a11y.profile.v1`
- `xtendScaffoldPerformanceProfile` with
  `xtend.performance.component-profile.v1`

The root lifecycle uses `xtend.rmt.root-handshake.v1` and stays connected to
the XTend host adapter through scheduler endpoint hints. The RMT kernel does
not read the XTend component directly; it treats component refs, templates, and
events as data.

## Events

| Event | Description |
|-------|-------------|
| `rmt-lifecycle-demo-build-ready` | ready channel declared in scaffold wiring for host adapters |
| `rmt-lifecycle-demo-build-changed` | state-change channel declared in scaffold wiring for host adapters |

## A11y Profile

The a11y profile sets `role="region"`, requires an `aria-label`, describes
screen reader signals for semantic region and status changes, and carries
reduced-motion/forced-colors rules in Shadow DOM.

## Performance Profile

The performance profile uses `xtend.performance.component-profile.v1`,
`budgetClass: critical`, `lane: user-blocking`, and
`hydrationPolicy: visible`. Critical measurement points are loader, mount,
hydration, render, update, state sync, and event action.

## RC1 Build Boundary

The component is intentionally a build artifact from the RMT vNext path:

- Source: `xtendrmt/rmt-lifecycle-demo.rmt`
- Generator: `xtend-builder/generators/rmt-build.js`
- Build component: `components/x-rmt-lifecycle-demo-build.js`
- Browser smoke: `tests/browser/fixtures/rmt-lifecycle-demo-rmt-build-smoke.html`

It is therefore part of RC1 test-build recovery: manifest, docs, suite,
fixture, and public types remain visible in the Component Catalog.
