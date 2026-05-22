# SurfaceManager Lazy Hydration

Docs contract: `xtend.docs.surface-manager-lazy-hydration.v1`

`WP-SM-13` hardens `x-surface-manager` for shell-first apps: surface chrome and app shell can become visible immediately while surface content is skeletonized, loaded and hydrated through the framework-native XTendLoader.

## Contract

- Loading policy: `xtend.surface.loading-policy.v1`
- Loading report: `xtend.surface.loading-report.v1`
- Gate: `node scripts/run_xtend_tests.js surface-lazy-hydration --json`
- Package script: `npm run test:surface-lazy-hydration`

## Policies

`surface-loading-policy` on the manager sets the default policy. Individual surfaces can override it with `data-surface-hydration-policy`.

| Policy | Behavior |
|--------|----------|
| `eager` | content is hydrated directly after surface registration |
| `visible` | content is hydrated as soon as the surface is visible |
| `open` | content is hydrated when the surface is open |
| `idle` | content is loaded through `requestIdleCallback` or timeout fallback |
| `route` | content waits for route signals such as `xtend-route-changed` |

## Runtime

`x-surface-manager` uses no Docs-app special case. The runtime uses the existing loader APIs:

- `XTendLoader.ensureComponent`
- `XTendLoader.hydrateTree`
- `XTendLoader.showSkeleton`
- `XTendLoader.hideSkeleton`
- `XTendStyleRegistry.ensureRuntimeStyles`

Before hydration, the manager sets `data-xtend-surface-content-ready="false"` and lets the SkeletonLoader cover direct content children. Only after a successful component-ready and `hydrateTree` gate is the skeleton removed. On errors or timeouts, the skeleton remains active so unstyled content does not pop in.

## Parsedown and Remote Slots

Parsedown containers and remote-capable slots are normal surface content. There is no monkeypatch in the Docs app:

```html
<x-surface-window
  surface-id="docs.surface"
  data-surface-hydration-policy="open"
  open>
  <section data-xtend-parsedown-container="true">
    <x-code language="markdown"># Docs</x-code>
  </section>
</x-surface-window>
```

Remote-capable slots can be marked with `data-remote-capable-content-slot="true"`. Lazy hydration loads only the DOM/component scope; remote trust, ownership and capabilities remain reserved for later remote-surface policies.

## Diagnostics

The manager provides:

- `snapshotSurfaceLoading()`
- `hydrateSurfaceContent(surfaceRef, options)`
- events `surface-content-loading`, `surface-content-hydrated`, `surface-content-hydration-skipped` and `surface-content-hydration-error`

`snapshotSurfaceLoading()` reports policy, skeleton status, hydration status, tags, unresolved tags, duration and the boundaries `shellFirst`, `protectsUnstyledContent` and `createsSecondRegistry: false`.
