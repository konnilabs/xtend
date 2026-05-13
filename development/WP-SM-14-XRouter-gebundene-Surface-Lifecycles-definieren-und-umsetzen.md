# WP-SM-14 - XRouter-gebundene Surface Lifecycles definieren und umsetzen

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.surface.route-lifecycle.v1`
- Local Gate: `node scripts/run_xtend_tests.js surface-route-lifecycle --json`
- Package Script: `npm run test:surface-route-lifecycle`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Surfaces koennen an Routen, Subrouten und Route-Scopes gebunden werden, ohne Shell und Stack-Zustand zu zerreissen. XRouter bleibt Route-State-Quelle, SurfaceManager bleibt Surface-Lifecycle-Quelle.

## Umsetzung

- `x-surface-manager route-aware="true"` aktiviert Route-Lifecycle-Policies.
- `route-lifecycle-policy` setzt die Manager-Default-Policy.
- Surface-Attribute `data-surface-route` und `data-surface-route-policy` binden einzelne Surfaces an Route-Tokens.
- `snapshotRouteLifecycle()` liefert den Report `xtend.surface.route-lifecycle-report.v1`.
- `applyRouteLifecycle(routeInput, options)` fuehrt open/close/collapse/minimize/restore/hydrate Aktionen aus.
- XRouter-Events `route-changed`, `routechange` und `xrouter-after-navigate` werden konsumiert, aber nicht ersetzt.
- Verwaltete `x-side-panel` Instanzen delegieren Routewechsel an den Manager. Standalone-Panels behalten ihren alten Fallback.
- RMT-Materialisierung schreibt `data-surface-route`, `data-surface-route-policy` und fuer route-bound Surfaces standardmaessig `data-surface-hydration-policy="route"`.

## Policies

- `global`: routewechselstabil
- `open-close`: Match oeffnet/restored, Nicht-Match schliesst
- `open-collapse`: Match oeffnet/restored/expanded, Nicht-Match collapsed oder minimized
- `open-minimize`: Match oeffnet/restored, Nicht-Match minimized
- `open-keep`: Match oeffnet/restored, Nicht-Match bleibt offen
- `hydrate-only`: Match hydriert Content, Lifecycle bleibt manuell
- `manual`: keine automatische Aktion

## Artefakte

- `catalog/surface-manager-route-lifecycle.js`
- `tests/components/surface_manager_route_lifecycle_suite.js`
- `tests/components/fixtures/xsurfacemanager-route-lifecycle.component.html`
- `docs/surface-manager-route-lifecycle.md`
- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `components/xsidepanel.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`

## Ergebnis

Route-bound Surfaces werden reproduzierbar geoeffnet, geschlossen, collapsed, minimized, restored und hydriert. Globale Surfaces bleiben routewechselstabil. Router und SurfaceManager besitzen keine konkurrierenden Lifecycle-Quellen.
