# WP-E12-03 - x-tabs Browser-, Keyboard-, A11y- und Theme-Smokes haerten

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Backlog: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- Contract: `xtend.epic12.wp03.xtabs-browser-keyboard-a11y-theme-smokes.v1`
- Bezug:
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/XTend-Epic11-Browsernahe-UX-Smoke-Matrix.md`
  - `development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md`
  - `docs/components/xtabs.md`
  - `tests/browser/component-ux-browser-smoke-plan.js`
  - `tests/browser/component-shell-theme-matrix-plan.js`
  - `tests/browser/fixtures/epic11-ux-compatibility-smoke.html`
  - `tests/browser/fixtures/epic11-theme-matrix-smoke.html`

## Ziel

`WP-E12-03` macht die `x-tabs`-Reife nach dem Performance-Abschluss aus `WP-E12-02` sichtbar testbar. Die Komponente soll in browsernahen Journeys nicht nur rendern, sondern Keyboard-, ARIA-, Focus- und Theme-Matrix-Verhalten als P0-Pfad absichern.

## Runtime-Haertung

`components/xtabs.js` wurde in der sichtbaren Runtime ergaenzt:

| Bereich | Umsetzung |
|---------|-----------|
| Tab/Panel-Verknuepfung | `aria-controls`, `aria-labelledby`, `role=tabpanel` |
| Selected State | `aria-selected`, `aria-hidden`, `hidden`, aktive Klasse |
| Keyboard | `ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter`, `Space` |
| Focus | roving `tabindex`, Fokusuebergabe auf den aktivierten Tab |
| Event Boundary | `tab-selected` emittiert mit `bubbles: true` und `composed: true` |
| Performance | vorhandenes Keyboard-Budget aus `WP-E12-02` bleibt Messpunkt |

Damit ist `x-tabs` fuer echte Browser-Smokes besser geeignet, ohne dass der RMT-Kernel XTend-Typen importiert.

## Browser-Smoke-Fortschreibung

Die Navigation/Routing-Journey aus `xtend.epic11.component-ux-browser-smokes.v1` enthaelt nun `x-tabs`.

Neue Fixture-Checks:

- `tabs arrow key selected next tab`
- `tabs home end keys preserve roving focus`
- `tabs aria controls visible panel`

Die Fixture bleibt local-only, nutzt den kanonischen `xtend-loader.js` und das lokale Manifest.

## Theme-Matrix-Fortschreibung

Die Navigation/Routing-Familie aus `xtend.epic11.component-shell-theme-matrix.v1` enthaelt nun `x-tabs` als P0-Shell-Journey.

Neue Visual States:

- `tab-selected`
- `tab-focus-visible`

Neue Required Checks:

- `navigation tabs aria states covered`
- `navigation tabs keyboard states covered`

Die Anzahl der Matrix-Kombinationen bleibt bei `360`, weil die fuenf UX-Familien unveraendert bleiben. Die repraesentative Komponentenabdeckung steigt von `16` auf `17`.

## Grenzen

- Keine Screenshot-Automation in diesem Paket; sie folgt in WS5.
- Keine harte Kopplung zwischen XTend und XTendRMT.
- Keine CDN-, Importmap- oder externen Browser-Pflichtpfade im lokalen Gate.
- Kein TypeScript-Big-Bang-Refactor der Legacy-Runtime.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Arrow-Key Navigation browsernah sichtbar | erfuellt |
| Home/End Verhalten browsernah sichtbar | erfuellt |
| `aria-selected`, `aria-controls`, `role=tablist`, `role=tabpanel` abgedeckt | erfuellt |
| Theme-, Density-, Motion- und Viewport-Matrix enthaelt `x-tabs` | erfuellt |
| kein neues RMT-Kernel-Coupling | erfuellt |
| `WP-E12-04` startbar | erfuellt |

## Verifikation

```bash
node --check components/xtabs.js
node --check tests/browser/component-ux-browser-smoke-plan.js
node --check tests/browser/component-shell-theme-matrix-plan.js
node --check tests/browser/component_ux_browser_smoke_suite.js
node --check tests/browser/component_shell_theme_matrix_suite.js
node --check tests/browser/browser_smoke_suite.js
node scripts/run_xtend_tests.js components component-ux-browser-smokes component-shell-theme-matrix browser references --json
```

## Ergebnis

`WP-E12-03` ist abgeschlossen. `x-tabs` ist nach Performance-, Browser-, Keyboard-, A11y- und Theme-Matrix-Haertung kein P0-Sonderrestpunkt mehr. Der naechste primaere Epic-12-Pfad ist `WP-E12-04` fuer `x-theme`.
