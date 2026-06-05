# WP-RMO-06 - Surface Browser Lab und Visual Evidence fuer App-Flows ausbauen

- Status: `completed`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-fixtures.v1`
- Browser Fixture Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.fixture.v1`
- Visual Baseline Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.visual-baseline.v1`
- Performance Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab.performance-report.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-surface-browser-lab-visual-evidence-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json`
- Package Script: `npm run test:rmt-owned-surface-browser-lab`

## Ziel

Browser- und Visual-Claims fuer Surface-, Data- und Command-Flows werden mit gatebaren Artefakten abgesichert. Das Paket schafft eine deterministische lokale Evidence-Schicht fuer RMO-Recipes und uebergibt echte Screenshot-/Pixel-Artefakte als conditional Owner-Handoff.

## Umgesetzte Artefakte

| Artefakt | Status |
|----------|--------|
| `development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Contract.md` | erfuellt |
| `development/XTend-RMT-Owned-Surface-Browser-Lab-Visual-Evidence-Matrix.md` | erfuellt |
| `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json` | erfuellt |
| `tests/browser/fixtures/rmt-owned-surface-browser-lab.html` | erfuellt |
| `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json` | erfuellt |
| `tests/native-first/rmt_owned_surface_browser_lab_suite.js` | erfuellt |

## Entscheidungen

| Entscheidung | Ergebnis |
|--------------|----------|
| Surface Browser Lab | akzeptiert als offline HTML-Fixture mit Data Display, Command/Search und CRUD/Navigation Flows |
| Visual Evidence | akzeptiert als DOM-first JSON Baseline plus conditional Screenshot-/Pixel-Artefaktpfade |
| Performance Evidence | akzeptiert als Budget-Report mit PerformanceObserver, MutationObserver, requestAnimationFrame und Layout-Shift-Grenzen |
| Pixel Artefakte | `conditional-browser-artifact`, nicht lokaler Default-Zwang |
| Claim Boundary | Visual-Claim ohne Artefaktpfad bleibt blockiert |

## Definition of Done

| Kriterium | Ergebnis |
|-----------|----------|
| `surface-browser-lab` ist gatebar oder als Conditional Browser Evidence markiert | erfuellt: lokaler Gate `rmt-owned-surface-browser-lab`, bestehender Gate `surface-browser-lab` als Source Gate, Pixel als `conditional-browser-artifact` |
| Visual Claims referenzieren reale Artefakte | erfuellt: HTML-Fixture, DOM-Baseline, Fixture-Pack und Pfadtemplate fuer conditional Pixel |
| `native-first-budget-gates` kann die neuen Evidence-Pfade auswerten | erfuellt: Budget-Schwellwerte, Required Gates und Evidence-Artefakte sind in Matrix, Fixture-Pack und Package-Metadaten sichtbar |
| keine neue Runtime-Dependency entsteht | erfuellt |
| keine zweite Registry entsteht | erfuellt |
| lokaler Gate ist gruen | erfuellt: `node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab --json` |

## Handoff

`WP-RMO-07` kann Contract Registry, Runtime Parity, Audit Evidence und Budget Gates auf die neuen Browser-Lab-, Visual-Baseline- und Performance-Evidence-Pfade erweitern. `WP-RMO-09` kann conditional Pixel-Artefakte als Release-Owner-Review aufnehmen.
