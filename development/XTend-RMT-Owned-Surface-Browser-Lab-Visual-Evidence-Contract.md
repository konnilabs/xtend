# XTend RMT Owned Surface Browser Lab Visual Evidence Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-fixtures.v1`
- Browser Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.fixture.v1`
- Visual Baseline Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.visual-baseline.v1`
- Performance Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.performance-report.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-report.v1`
- Workpackage: `WP-RMO-06`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json`
- Package Script: `npm run test:rmt-owned-surface-browser-lab`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-RMT-Owned-Recipe-Extension-Contract.md`
  - `development/XTend-RMT-Owned-Recipe-Extension-Matrix.md`
  - `development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Matrix.md`
  - `development/WP-RMO-06-Surface-Browser-Lab-und-Visual-Evidence-fuer-App-Flows-ausbauen.md`
  - `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json`
  - `tests/browser/fixtures/rmt-owned-surface-browser-lab.html`
  - `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json`
  - `tests/native-first/rmt_owned_surface_browser_lab_suite.js`

## Zweck

`WP-RMO-06` macht Browser- und Visual-Claims fuer die neuen scoped RMO-Flows gatebar. Data Display, Command/Search, CRUD/Navigation und Overlay/Focus werden als konkrete Browser-Lab- und Visual-Evidence-Targets beschrieben. Der lokale Gate bleibt deterministisch: DOM-Baseline, Budget-Plan und offline Browser-Fixture werden hart geprueft; echte Screenshots oder Pixel-Diffs bleiben `conditional-browser-artifact`.

## Paketgrenzen

- `surface-browser-lab`: RMO-Flows sind als Browser-Lab-Fixture unter `tests/browser/fixtures/rmt-owned-surface-browser-lab.html` gatebar.
- `visual-evidence-artifacts`: DOM-Visual-Baseline und optionale Screenshot-/Pixel-Artefaktpfade referenzieren reale Repo-Pfade.
- `performance-budget-report`: Interaction-, Mutation-, Layout-Shift- und Render-Budgets werden als statische Evidence-Schwellen beschrieben.
- `browser-native-observer-plan`: `PerformanceObserver`, `MutationObserver`, `requestAnimationFrame`, `DocumentFragment` und `replaceChildren` sind die erlaubten Browser-nativen Evidence-Primitives.
- `conditional-pixel-artifact`: Pixel-/Screenshot-Dateien werden nicht als lokales Default-Gate erzwungen.
- Keine neue Runtime-Dependency, kein externes UI-Framework, kein Browser-Treiberzwang im lokalen Node-Gate.
- Boundary Literal: `no-runtime-dependency`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Nicht-Ziele

- keine harte lokale Screenshot-/Pixel-Diff-Pflicht
- keine vollstaendige DataGrid-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Paritaet
- keine zweite Surface-, Component- oder Command-Registry
- keine Remote-Netzwerk-, CDN- oder Lazy-Import-Abhaengigkeit im Browser-Lab-Smoke
- keine Freigabe von Visual-Claims ohne referenziertes Artefakt

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-surface-browser-lab` | lokaler WP-RMO-06 Gate |
| `rmt-owned-recipe-extension` | konkrete RMO-Recipes `RMO-RCR-10` bis `RMO-RCR-14` |
| `rmt-owned-data-display-primitives` | Data Display scoped package |
| `rmt-owned-command-search-primitives` | Command/Search scoped package |
| `surface-browser-lab` | bestehender SurfaceManager Browser-Lab-Vertrag |
| `native-first-budget-gates` | Budget- und Conditional Browser Evidence Boundary |
| `rmt-renderer-dom-descriptor-proofs` | DOM Descriptor, Trusted DOM und Sink-Verweigerung |
| `native-first-overlay-focus` | Overlay, Escape, Focus Restore und Stack Policy |
| `references` | stabile Pfade |

## Claim-Regeln

| Claim | Entscheidung |
|-------|--------------|
| RMO Data Display und Command/Search besitzen gatebare Browser-Lab-Fixtures | `allowed-with-browser-lab-fixture` |
| Visual Claims duerfen auf DOM-Baseline und conditional Pixel-Artefakte zeigen | `allowed-with-artifact-reference` |
| Interaction-, Mutation- und Layout-Shift-Budgets sind fuer WP-RMO-07 auswertbar | `allowed-with-budget-evidence` |
| reale Screenshot-/Pixel-Artefakte sind lokal verpflichtend | `blocked-negative-claim` |
| `visual-claim-without-artifact` | `blocked-negative-claim` |
| `pixel-baseline-claim-without-artifact` | `blocked-negative-claim` |
| `real-browser-visual-claim-without-artifact` | `blocked-negative-claim` |
| neue Dependencies fuer Browser Lab oder UI-Framework-Komfort sind erlaubt | `blocked-negative-claim` |

## Handoff

`WP-RMO-06` macht `WP-RMO-07` startbar: Contract Registry, Runtime Parity, Audit Evidence und Budget Gates koennen nun konkrete Browser-Lab-, DOM-Baseline-, Performance- und Conditional Pixel-Artefakte referenzieren.
