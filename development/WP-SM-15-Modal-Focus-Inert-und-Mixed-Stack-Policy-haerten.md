# WP-SM-15 - Modal-, Focus-, Inert- und Mixed-Stack-Policy haerten

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.surface.stack-policy.v1`
- Report: `xtend.surface.stack-policy-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js surface-stack-policy --json`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

Gemischte Surface-Stacks aus `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog` und `x-drawer` erhalten konsistente Regeln fuer Modalitaet, Fokus, Inert, `aria-hidden`, Escape-Prioritaet, Layer Tokens und Scroll Lock. Der SurfaceManager bleibt dabei eine XTend-UI-nahe Hilfsschicht und ersetzt keine Fabric-, RMT- oder Controller-Schicht.

## Umsetzung

- `components/xsurfacemanager.js` wertet `modal-policy` ueber `topmost`, `none`, `all-modal` und `surface-modal` aus.
- `snapshotStackPolicy()` liefert einen gatebaren Stack-Report inklusive aktiver Modal Surface, Escape-Ziel, Inert-Zaehlern und A11y-Diagnostics.
- `applyStackPolicy()` wird nach jedem Surface-Snapshot angewendet und setzt native Attribute/CSS-Tokens auf den bestehenden Komponenten.
- Ein dokumentweiter Capture-Handler priorisiert `Escape` auf der aktiven modalen oder obersten schliessbaren Surface.
- `focusin` wird bei aktiver Modalitaet zurueck in die aktive Surface gefuehrt, inklusive Focus Restore nach Close.
- Hintergrund-Surfaces erhalten Manager-markierte `inert`- und `aria-hidden`-Attribute.
- Aktive Modalitaet sperrt den Dokument-Scroll kontrolliert und stellt die vorherigen Werte wieder her.
- `components/xsurfacewindow.js` synchronisiert `record.modal` in `aria-modal`, damit auch Surface Windows konsistent modal werden koennen.

## Artefakte

- `catalog/surface-manager-stack-policy.js`
- `tests/components/surface_manager_stack_policy_suite.js`
- `tests/components/fixtures/xsurfacemanager-stack-policy.component.html`
- `docs/surface-manager-stack-policy.md`
- `components/xsurfacemanager.js`
- `components/xsurfacemanager.d.ts`
- `components/xsurfacewindow.js`

## Abnahme

- bestehende Overlay-Komponenten bleiben kompatibel
- SurfaceController bleibt Registry-Wahrheit
- Manager-Policy erzeugt keine zweite Stack- oder Surface-Registry
- Tastatur- und Screenreader-relevante Zustandsmarker sind gatebar
- lokaler Gate: `node scripts/run_xtend_tests.js surface-stack-policy --json`
