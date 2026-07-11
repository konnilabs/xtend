# SurfaceManager Browser Lab

- Status: `implemented-browser-lab-visual-stability-gates`
- Schema: `xtend.surface.browser-lab.v1`
- Visual Baseline Schema: `xtend.surface.browser-lab.visual-baseline.v1`
- Gate: `node scripts/run_xtend_tests.js surface-browser-lab --json`
- Fixture: `tests/browser/fixtures/surface-manager-browser-lab.html`
- Visual Baseline: `tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json`
- Referenzen:
  - `docs/index.php`
  - `tests/browser/fixtures/rmt-surface-workbench-smoke.html`

## Zweck

Das Browser Lab haertet die SurfaceManager App-Shell gegen sichtbare Regressionen ab. Der lokale Gate prueft die HTML-Fixture, die JSON-DOM-Baseline und die dokumentierten Performance-Budgets, ohne echte Browser-Screenshot-Artefakte als Default zu erzwingen.

## Evidence

- `SkeletonLoader` bleibt der Shell-first-Pfad fuer Cold Start, Skeleton und Hydration.
- `CLS` wird ueber die Browser-Lab-Budgets begrenzt.
- `Pop-In` und Text Flash sind als Regressionen blockiert.
- Pixel-Baselines bleiben conditional Evidence fuer Release-Owner- oder Browser-CI-Laeufe.

## Boundary

Das Lab erstellt keine zweite Surface Registry, importiert keine XTend-Komponenten in den RMT-Kernel und erlaubt keine externe CDN-Abhaengigkeit fuer lokale Smokes.
