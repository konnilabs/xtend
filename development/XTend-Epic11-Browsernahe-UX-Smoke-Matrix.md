# XTend Epic 11 Browsernahe UX-Smoke-Matrix

Status: `accepted`

Schema: `xtend.epic11.component-ux-browser-smokes.v1`

Workpackage: `WP-E11-14`, fortgeschrieben durch `WP-E12-03`

## Ziel

`WP-E11-14` hebt die Epic-11-UX-Familien aus statischen Contract-Gates in eine browsernahe Smoke-Matrix. Die neue Fixture rendert echte XTend-Komponenten ueber den lokalen `xtend-loader.js`, nutzt das lokale Browser-Fixture-Manifest und verifiziert representative User Journeys fuer Form Controls, Feedback/Status, Navigation/Routing, Overlays und Layout/Display/Media.

Der Gate bleibt bewusst `local-only`: keine CDN-Referenzen, keine Importmaps, kein externer Browserzwang. Optional kann derselbe Contract ueber `XTEND_BROWSER_SMOKE_DRIVER=safari` im bestehenden Browser-Harness ausgefuehrt werden.

## Contract

- Schema: `xtend.epic11.component-ux-browser-smokes.v1`
- Report Schema: `xtend.epic11.component-ux-browser-smokes-report.v1`
- Plan: `tests/browser/component-ux-browser-smoke-plan.js`
- Fixture: `tests/browser/fixtures/epic11-ux-compatibility-smoke.html`
- Suite: `tests/browser/component_ux_browser_smoke_suite.js`
- Result Key: `__xtendEpic11UxSmokeResult`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-ux-browser-smokes --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Journeys

| Journey | Familie | Komponenten | Browser-Check |
| --- | --- | --- | --- |
| `form-validation-journey` | `form-controls` | `x-form`, `x-input`, `x-select`, `x-checkbox` | State Sync, FormData Aggregation, Validation Feedback |
| `feedback-status-journey` | `feedback-status` | `x-alert`, `x-toast`, `x-status`, `x-progress` | Live Regions, Progress State, Toast API |
| `navigation-routing-journey` | `navigation-routing` | `x-router`, `x-link`, `x-tabs` | Keyboard Navigation, Active State, Route Announcement, Tablist A11y, Roving Tabindex |
| `overlay-focus-journey` | `overlay-interaction` | `x-modal`, `x-drawer` | Initial Focus, Escape Close, Focus Restore, Drawer Availability |
| `layout-display-media-journey` | `layout-display-media` | `x-section`, `x-cards`, `x-code`, `x-player` | Shell Rendering, Display Surface, Lazy Media Shell |

## Designentscheidungen

- Die Fixture ist eine selbstpruefende HTML-Datei und schreibt ihren Status in `window.__xtendEpic11UxSmokeResult`.
- Der Standard-Gate prueft Contract, Fixture, Manifest, Runner und Dokumentation statisch. Browser-Automation bleibt optional, damit lokale und CI-Laeufe deterministisch bleiben.
- Die Fixture nutzt den produktiven Loader und ein lokales Manifest, damit der CDN-Ausschluss aus der Enterprise-Roadmap sichtbar bleibt.
- Die Matrix basiert auf dem `WP-E11-13` Component Lab UX Inspector. Die browsernahen Smokes sind dadurch keine zweite Taxonomie, sondern eine ausfuehrbare Sicht auf dieselben UX-Familien.
- XTendRMT bleibt entkoppelt. Der Gate dokumentiert nur die Shell-first- und Scheduling-Faehigkeit der Komponenten, ohne XTend-Typen in den RMT-Kernel zu ziehen.
- `WP-E12-03` erweitert die Navigation/Routing-Journey um `x-tabs`, damit Arrow-Key, `Home`, `End`, `aria-controls`, `role=tabpanel` und roving `tabindex` browsernah sichtbar bleiben.

## Handoff

`WP-E11-15` kann auf dieser Smoke-Matrix aufbauen und daraus eine Visual Regression und Theme Matrix ableiten. Die naechste Stufe sollte dieselben fuenf UX-Journeys in Light, Dark, High Contrast, Reduced Motion, Density und responsiven Viewports sichtbar machen.
