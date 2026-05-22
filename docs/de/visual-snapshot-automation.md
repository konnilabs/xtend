# Visual Snapshot Automation

- Contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Entry Contract: `xtend.epic12.visual-snapshot-automation-entry.v1`
- Automation Report Contract: `xtend.epic12.visual-snapshot-automation-report.v1`
- Runner Contract: `xtend.epic12.visual-snapshot-runner.v1`
- Fixture Contract: `xtend.epic12.visual-snapshot-fixture.v1`
- Runner Report Contract: `xtend.epic12.visual-snapshot-runner-report.v1`
- Design Token Contract: `xtend.design-tokens.product-contract.v1`
- Workpackages: `WP-E12-10`, `WP-E12-11`, `WP-E12-12`
- Contract Gate: `node scripts/run_xtend_tests.js visual-snapshot-automation --json`
- Snapshot Gate: `node scripts/run_xtend_tests.js visual-snapshots --json`

XTend Visual Snapshot Automation ist die Epic-12-Linie fuer lokale visuelle Regression. `WP-E12-10` definiert Scopes, Matrix, Toleranzen und Artefaktpolitik. `WP-E12-11` setzt darauf einen lokalen DOM-first Snapshot Runner mit JSON-Baseline auf.

## Lokal pruefen

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshot-automation --json
npm run test:visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshots --json
npm run test:visual-snapshots
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

Der Gate ist local-only, CDN-frei und nutzt keine externen Browserdienste.

## Matrix

Der Contract uebernimmt die 360 Kombinationen der Component Shell Theme Matrix:

- Themes: `light`, `dark`, `high-contrast`, `forced-colors`
- Motion: `default-motion`, `reduced-motion`
- Density: `comfortable`, `compact`, `dense`
- Viewports: `desktop-1280`, `tablet-768`, `mobile-390`
- UX-Familien: `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction`, `layout-display-media`

## Snapshot Scopes

- `shell-structure`
- `visual-state`
- `theme-token-state`
- `motion-density-state`
- `viewport-layout`
- `focus-a11y-state`
- `rmt-shell-descriptor`

Die RMT-Grenze bleibt `no-rmt-kernel-import-of-xtend-types`: RMT beschreibt und scheduled Shells, importiert aber keine XTend-Typen in den Kernel.

Ab `WP-E12-12` nutzt die Snapshot-Fixture dieselben Produkt-Tokens wie `x-theme` und die Component Shell Theme Matrix. Die DOM-Baseline trackt `--xtend-surface`, `--xtend-text`, `--xtend-color-primary`, `--xtend-density-spacing` und `--xtend-radius`; lokale Fixture-Namen wie `--snapshot-*` sind entfernt.

## Diff-Strategie

`WP-E12-10` legt `dom-first-pixel-ready` fest, `WP-E12-11` fuehrt den lokalen DOM-Diff aus:

- DOM-Struktur und CSS Token haben Toleranz `0`.
- Pixel-Diff ist vorbereitet als `optional-local-pixel-diff`, laeuft im Node-Contract-Gate aber nicht.
- Maximaler Pixel-Mismatch ist `0.01`.
- Layout Shift ist auf `1px` begrenzt.
- Vor Capture muss der Runner auf Custom Elements, Fonts, Loader-Abschluss und einen Animation Frame warten.

## Artefakte

| Artefakt | Pfad |
|----------|------|
| Contract | `development/XTend-Visual-Snapshot-Automation-Contract.md` |
| Plan | `tests/browser/visual-snapshot-automation-plan.js` |
| Automation Suite | `tests/browser/visual_snapshot_automation_suite.js` |
| Runner | `tests/browser/visual-snapshots-runner.js` |
| Fixture | `tests/browser/fixtures/visual-snapshots-fixture.html` |
| DOM Baseline | `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` |
| Snapshot Suite | `tests/browser/visual_snapshots_suite.js` |
| Output Root | `.xtend-test-results/visual-snapshots` |
| Report Path | `.xtend-test-results/visual-snapshots/visual-snapshots-report.json` |
| RC1 Owner Manifest | `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` |

Die Baseline ist in `WP-E12-11` textuell und reviewbar. Binary- oder Screenshot-Baselines bleiben einem optionalen lokalen Pixel-Diff-Modus vorbehalten.

## RC1 Visual Owner Artifact

Ab `WP-E13-08` nutzt [Visual Owner Artifacts](./visual-owner-artifacts.md) diese DOM-first Linie als Quelle fuer `xtend.epic13.visual-owner-artifact.v1`. Der lokale Gate `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json` normalisiert Artifact Root, Report-Pfad, Screenshot-Template und Viewports. Die Screenshot-/Pixel-Erzeugung bleibt `optional-browser-driver-or-ci-artifact`.

## RC0 Adoption Update

Seit `WP-E12-15` verweist der [RC0 Adoption Guide](./rc0-adoption-guide.md) auf diesen DOM-first Snapshot-Pfad als RC0-Baseline. Component Authors behandeln `visual-snapshots`, `design-tokens` und `component-shell-theme-matrix` gemeinsam als lokale Review-Kette; Pixel-Baselines bleiben optional und duerfen den lokalen RC0 Dry Run nicht blockieren.
