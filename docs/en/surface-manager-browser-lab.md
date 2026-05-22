# SurfaceManager Browser Lab

`WP-SM-18` adds a browser-close lab to the SurfaceManager layer for real app-shell stability. The contract `xtend.surface.browser-lab.v1` intentionally stays framework-native: the fixture uses `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, the `SkeletonLoader` from the loader and the existing surface hydration. It is not a Docs-app special case and not a monkeypatch.

## Artifacts

| Artifact | Path |
| --- | --- |
| Catalog | `catalog/surface-manager-browser-lab.js` |
| Browser-lab fixture | `tests/browser/fixtures/surface-manager-browser-lab.html` |
| Visual baseline | `tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json` |
| Gate | `node scripts/run_xtend_tests.js surface-browser-lab --json` |

The visual baseline uses `xtend.surface.browser-lab.visual-baseline.v1`. It is JSON-based and pixel-ready: later browser-lab runs can attach real snapshot files, while the local fast gate already checks DOM signatures, states and budgets.

## Gate States

The fixture covers five reproducible states:

| Snapshot | State |
| --- | --- |
| `surface-lab-cold-start` | app shell visible before content hydration |
| `surface-lab-skeleton` | Parsedown content hidden behind SkeletonLoader |
| `surface-lab-hydrated` | content released, skeleton removed |
| `surface-lab-route-change` | route-bound surface without shell resize |
| `surface-lab-modal-stack` | modal stack above SurfaceManager policy |

## Regressions

The report connects `xtend.surface.browser-lab.performance-report.v1` and `xtend.surface.browser-lab.cls-report.v1`. Locally, these risks must fail:

| Risk | Budget |
| --- | --- |
| CLS | `<= 0.01` |
| Layout shift | `<= 1px` |
| Pop-in of unstyled content | `0` |
| Open/Focus | `<= 16ms` |
| Route | `<= 32ms` |
| Hydrate | `<= 120ms` |

## App-Shell Probes

The lab references the Docs app through `docs/index.php` and the Parsedown/RMT pilot `docs/xtendrmt-parsedown-docs.rmt`. `tests/browser/fixtures/rmt-surface-workbench-smoke.html` also remains a reference workbench in the gate. This lets WP-SM-18 check the production-close app-shell path without moving Parsedown, PHP or workbench-specific behavior into the SurfaceManager.

The SurfaceManager remains a supporting XTend UI layer. It does not create a second registry, replace Fabric or the RMT kernel, or load a remote runtime in the kernel.
