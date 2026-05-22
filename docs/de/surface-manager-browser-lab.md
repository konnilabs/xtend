# SurfaceManager Browser Lab

`WP-SM-18` ergaenzt die SurfaceManager-Schicht um ein browsernahes Lab fuer echte App-Shell-Stabilitaet. Der Contract `xtend.surface.browser-lab.v1` bleibt bewusst framework-nativ: Das Fixture nutzt `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, den `SkeletonLoader` aus dem Loader und die bestehende Surface-Hydration. Es ist keine Doku-App-Sonderloesung und kein Monkeypatch.

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Catalog | `catalog/surface-manager-browser-lab.js` |
| Browser-Lab Fixture | `tests/browser/fixtures/surface-manager-browser-lab.html` |
| Visual Baseline | `tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json` |
| Gate | `node scripts/run_xtend_tests.js surface-browser-lab --json` |

Die Visual Baseline verwendet `xtend.surface.browser-lab.visual-baseline.v1`. Sie ist JSON-basiert und pixel-ready: spaetere Browser-Lab-Laeufe koennen echte Snapshot-Dateien anhaengen, waehrend der lokale Fast-Gate bereits DOM-Signaturen, States und Budgets prueft.

## Gate-Zustaende

Das Fixture deckt fuenf reproduzierbare Zustaende ab:

| Snapshot | Zustand |
| --- | --- |
| `surface-lab-cold-start` | App Shell sichtbar vor Content-Hydration |
| `surface-lab-skeleton` | Parsedown-Content hinter SkeletonLoader verborgen |
| `surface-lab-hydrated` | Content freigegeben, Skeleton entfernt |
| `surface-lab-route-change` | Route-bound Surface ohne Shell-Resize |
| `surface-lab-modal-stack` | Modal Stack ueber SurfaceManager-Policy |

## Regressionen

Der Report verbindet `xtend.surface.browser-lab.performance-report.v1` und `xtend.surface.browser-lab.cls-report.v1`. Lokal muessen folgende Risiken fehlschlagen:

| Risiko | Budget |
| --- | --- |
| CLS | `<= 0.01` |
| Layout Shift | `<= 1px` |
| Pop-In von ungestyltem Content | `0` |
| Open/Focus | `<= 16ms` |
| Route | `<= 32ms` |
| Hydrate | `<= 120ms` |

## App-Shell-Proben

Das Lab referenziert die Docs-App ueber `docs/index.php` und den Parsedown/RMT-Pilot `docs/xtendrmt-parsedown-docs.rmt`. Zusaetzlich bleibt `tests/browser/fixtures/rmt-surface-workbench-smoke.html` als Referenz-Workbench im Gate. Dadurch prueft WP-SM-18 den produktnahen App-Shell-Pfad, ohne Parsedown, PHP oder Workbench-spezifisches Verhalten in den SurfaceManager zu verschieben.

Der SurfaceManager bleibt eine unterstuetzende XTend-UI-Schicht. Er erzeugt keine zweite Registry, ersetzt nicht Fabric oder den RMT-Kernel und laedt keine Remote Runtime im Kernel.
