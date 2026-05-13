# WP-SM-13 - Shell-first Lazy Surface Loading mit Skeleton-Hydration bauen

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.surface.lazy-loading.v1`
- Loading Policy Contract: `xtend.surface.loading-policy.v1`
- Local Gate: `node scripts/run_xtend_tests.js surface-lazy-hydration --json`
- Package Script: `npm run test:surface-lazy-hydration`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Surface Chrome und App Shell laden shell-first. Teure Surface-Inhalte werden erst nach Policy, Route oder Intent geladen und bleiben bis zum XTendLoader-Hydration-Gate skeletonisiert. Dadurch soll kein ungestylter Content vor der Hydration sichtbar werden und kein Layout herum shiften.

## Umsetzung

- `components/xsurfacemanager.js` besitzt `surface-loading-policy`, `surface-skeleton` und `surface-hydration-timeout`.
- `snapshotSurfaceLoading()` liefert den Runtime-Report `xtend.surface.loading-report.v1`.
- `hydrateSurfaceContent(surfaceRef, options)` hydriert einzelne Surface-Scopes ueber `XTendLoader.ensureComponent` und `XTendLoader.hydrateTree`.
- Der Manager nutzt `XTendLoader.showSkeleton`, `XTendLoader.hideSkeleton` und `XTendStyleRegistry.ensureRuntimeStyles`.
- Bei Hydration-Fehlern oder Timeouts bleibt der Skeleton aktiv. Das ist Absicht: kein ungestylter Content ist wichtiger als eine etwas fruehere Anzeige.
- RMT-materialisierte Surfaces uebernehmen `data-surface-hydration-policy` aus Surface-, SourceSurface- oder Component-Records.

## Policies

- `eager`: sofort hydrieren
- `visible`: hydrieren, wenn die Surface sichtbar ist
- `open`: hydrieren, wenn die Surface geoeffnet ist
- `idle`: ueber `requestIdleCallback` oder Timeout-Fallback hydrieren
- `route`: auf Route-Signale wie `xtend-route-changed` warten

## Artefakte

- `catalog/surface-manager-lazy-loading.js`
- `tests/components/surface_manager_lazy_hydration_suite.js`
- `tests/components/fixtures/xsurfacemanager-lazy-hydration.component.html`
- `docs/surface-manager-lazy-hydration.md`
- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`

## Ergebnis

`x-surface-manager` bleibt eine unterstuetzende XTend-UI-Schicht und ersetzt weder Fabric noch RMT-Kernel noch Router. Die Lazy-Hydration ist framework-nativ ueber XTendLoader/SkeletonLoader geloest und benoetigt keinen Monkeypatch in der Doku-App.
