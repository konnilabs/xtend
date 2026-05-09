# XTend Visual Snapshot Automation Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Entry Contract: `xtend.epic12.visual-snapshot-automation-entry.v1`
- Report Contract: `xtend.epic12.visual-snapshot-automation-report.v1`
- Workpackage: `WP-E12-10`
- Lokaler Gate: `node scripts/run_xtend_tests.js visual-snapshot-automation --json`
- RMT-Kernel-Grenze: `no-rmt-kernel-import-of-xtend-types`

## Zweck

Dieser Contract definiert, wie XTend aus der akzeptierten Component Shell Theme Matrix einen lokalen, deterministischen Snapshot-Automation-Pfad ableitet.

`WP-E12-10` implementiert bewusst noch keinen Screenshot-Runner. Das Paket friert Scope, Matrix, Diff-Strategie, Artefaktpolitik und Handoff so ein, dass `WP-E12-11` den eigentlichen lokalen Pixel-/DOM-Diff-Runner ohne Architektur-Refactor bauen kann.

## Quellen

| Quelle | Contract | Verwendung |
|--------|----------|------------|
| Component Shell Theme Matrix | `xtend.epic11.component-shell-theme-matrix.v1` | UX-Familien, Komponenten, Visual States, Theme/Motion/Density/Viewports |
| Regression Priority Plan | `xtend.catalog.component-regression-priority-plan.v1` | Priorisierung, Kern-Viewports, offene Performance-/A11y-Risiken |
| Styling Contract | `xtend.component.styling.v1` | CSS Token und CSS Parts als DOM-first-Diff-Quelle |
| Motion/Contrast Policy | `xtend.a11y.motion-contrast-policy.v1` | Reduced Motion und Forced Colors als Pflichtdimension |

## Matrix

Der Snapshot-Contract uebernimmt die 360 Kombinationen der Theme Matrix:

| Dimension | Werte |
|-----------|-------|
| Theme | `light`, `dark`, `high-contrast`, `forced-colors` |
| Motion | `default-motion`, `reduced-motion` |
| Density | `comfortable`, `compact`, `dense` |
| Viewport | `desktop-1280`, `tablet-768`, `mobile-390` |
| UX-Familien | `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction`, `layout-display-media` |
| Komponenten | 17 repraesentative Komponenten aus der Component Shell Theme Matrix |

## Snapshot Scopes

Jeder Snapshot-Eintrag beschreibt explizit, welche Schichten verglichen werden duerfen:

| Scope | Bedeutung |
|-------|-----------|
| `shell-structure` | Custom-Element-Shell, Slots, Parts und stabile Rollenstruktur |
| `visual-state` | sichtbarer Zustand wie Default, Focus, Invalid, Open, Active oder Playing |
| `theme-token-state` | Theme-, Contrast- und CSS-Token-Zustand |
| `motion-density-state` | Reduced Motion, Animation-Deaktivierung und Density-Tokens |
| `viewport-layout` | responsives Layout fuer Desktop, Tablet und Mobile |
| `focus-a11y-state` | Focus Visible, ARIA State und Screenreader-relevante DOM-Signale |
| `rmt-shell-descriptor` | Shell-first RMT Descriptor ohne XTend-Typimport in den RMT-Kernel |

## Diff-Strategie

Der Contract nutzt `dom-first-pixel-ready`:

1. Primaer werden DOM-Struktur, Attribute, CSS Token, Parts, ARIA-Signale und stabile States verglichen.
2. Pixel-Diff bleibt fuer `WP-E12-11` vorbereitet, aber in `WP-E12-10` noch nicht ausgefuehrt.
3. Der Runner muss vor Capture auf `custom-elements-defined`, `document-fonts-ready`, `xtend-loader-complete` und `animation-frame-flushed` warten.

Toleranzen:

| Toleranz | Wert |
|----------|------|
| DOM-Struktur-Aenderungen | `0` |
| CSS-Token-Aenderungen | `0` |
| Pixel-Mismatch-Ratio | `0.01` |
| Anti-Aliasing-Toleranz | `0.02` |
| Layout Shift | `1px` |

## Artefaktpolitik

| Artefakt | Pfad oder Policy |
|----------|------------------|
| Maschinenlesbarer Plan | `tests/browser/visual-snapshot-automation-plan.js` |
| Suite | `tests/browser/visual_snapshot_automation_suite.js` |
| Lokaler Output Root | `.xtend-test-results/visual-snapshots` |
| Baseline Root | `tests/browser/visual-baselines` |
| Baseline Commit Policy | `no-binary-baselines-in-WP-E12-10` |
| CI Upload | `deferred-to-WP-E12-11` |

Binary Baselines werden in `WP-E12-10` nicht eingefuehrt. Dieses Paket erzeugt nur den Contract und die maschinenlesbare Planung.

## Nicht-Ziele

- kein Screenshot-Runner in `WP-E12-10`
- keine externen Browserdienste
- keine CDN-Abhaengigkeiten
- keine XTend-Typimporte in den RMT-Kernel
- keine manuelle Baseline-Ablage ohne Runner-Policy

## Handoff an WP-E12-11

`WP-E12-11` darf auf dieser Basis implementieren:

- Snapshot Fixture Contract `xtend.epic12.visual-snapshot-fixture.v1`
- Snapshot Runner Contract `xtend.epic12.visual-snapshot-runner.v1`
- lokaler DOM-Diff
- optionaler lokaler Pixel-Diff, falls die Umgebung ihn deterministisch unterstuetzt
- JSON Report in `.xtend-test-results/visual-snapshots`
- kontrollierte Baseline-Policy ohne externe Dienste

## Verifikation

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
node scripts/run_xtend_tests.js component-shell-theme-matrix regression-priority visual-snapshot-automation references --json
```
