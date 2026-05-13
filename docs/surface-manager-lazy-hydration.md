# SurfaceManager Lazy Hydration

Docs Contract: `xtend.docs.surface-manager-lazy-hydration.v1`

`WP-SM-13` haertet `x-surface-manager` fuer shell-first Apps: Surface Chrome und App Shell koennen sofort sichtbar werden, waehrend Surface Content ueber den framework-nativen XTendLoader skeletonisiert, geladen und hydriert wird.

## Contract

- Loading Policy: `xtend.surface.loading-policy.v1`
- Loading Report: `xtend.surface.loading-report.v1`
- Gate: `node scripts/run_xtend_tests.js surface-lazy-hydration --json`
- Package Script: `npm run test:surface-lazy-hydration`

## Policies

`surface-loading-policy` am Manager setzt die Default-Policy. Einzelne Surfaces koennen sie mit `data-surface-hydration-policy` ueberschreiben.

| Policy | Verhalten |
|--------|-----------|
| `eager` | Content wird direkt nach der Surface-Registrierung hydriert. |
| `visible` | Content wird hydriert, sobald die Surface sichtbar ist. |
| `open` | Content wird hydriert, wenn die Surface geoeffnet ist. |
| `idle` | Content wird ueber `requestIdleCallback` oder Timeout-Fallback geladen. |
| `route` | Content wartet auf Route-Signale wie `xtend-route-changed`. |

## Runtime

`x-surface-manager` nutzt keine Doku-App-Sonderloesung. Die Runtime greift auf die vorhandenen Loader-APIs zu:

- `XTendLoader.ensureComponent`
- `XTendLoader.hydrateTree`
- `XTendLoader.showSkeleton`
- `XTendLoader.hideSkeleton`
- `XTendStyleRegistry.ensureRuntimeStyles`

Vor der Hydration setzt der Manager `data-xtend-surface-content-ready="false"` und laesst den SkeletonLoader direkte Content-Kinder verdecken. Erst nach erfolgreichem Component-Ready- und `hydrateTree`-Gate wird der Skeleton entfernt. Bei Fehlern oder Timeouts bleibt der Skeleton aktiv, damit kein ungestylter Content aufpoppt.

## Parsedown und Remote Slots

Parsedown-Container und remote-faehige Slots sind normale Surface-Inhalte. Es gibt kein Monkeypatch in der Doku-App:

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

Remote-faehige Slots koennen mit `data-remote-capable-content-slot="true"` markiert werden. Die Lazy-Hydration laedt dabei nur den DOM-/Komponenten-Scope; Remote Trust, Ownership und Capabilities bleiben spaeteren Remote-Surface-Policies vorbehalten.

## Diagnostics

Der Manager bietet:

- `snapshotSurfaceLoading()`
- `hydrateSurfaceContent(surfaceRef, options)`
- Events `surface-content-loading`, `surface-content-hydrated`, `surface-content-hydration-skipped` und `surface-content-hydration-error`

`snapshotSurfaceLoading()` meldet Policy, Skeleton-Status, Hydration-Status, Tags, unresolved Tags, Dauer und die Boundaries `shellFirst`, `protectsUnstyledContent` und `createsSecondRegistry: false`.
