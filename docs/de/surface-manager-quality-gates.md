# SurfaceManager Quality Gates

`WP-SM-07` fuehrt `xtend.surface.quality-gates.v1` ein. Der Gate prueft den SurfaceManager ueber vier Domaenen: Browser, A11y, Performance und Visual.

## Lokale Gates

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
node scripts/run_xtend_tests.js surface-manager-browser --json
node scripts/run_xtend_tests.js surface-manager-a11y --json
node scripts/run_xtend_tests.js surface-manager-performance --json
node scripts/run_xtend_tests.js surface-manager-visual --json
```

Die Domain-Gates laufen ueber denselben Contract und koennen gezielt in lokalen Checks oder CI-Matrizen referenziert werden.

## Browser

Das Fixture `tests/browser/fixtures/surface-manager-quality-smoke.html` baut eine gemischte Surface-Oberflaeche:

- zwei `x-surface-window`
- ein `x-side-panel`
- ein `x-modal`
- ein `x-dialog`
- ein `x-drawer`

Overlays werden ueber `surface-overlay-command` geoeffnet und in denselben Surface Stack aufgenommen.

## A11y

Der Gate prueft Contract- und Fixture-Signale fuer:

- Rollen: `application`, `dialog`, `complementary`
- `aria-live` Status
- Focus Restore
- Escape-Topmost-Verhalten
- Tab Focus Trap
- Reduced Motion
- Forced Colors und sichtbaren Fokus

## Performance

Der Contract definiert Budgets fuer Open/Close, Focus, Layout Transition, Snapshot und Registration. Das Browser-Fixture setzt zusaetzlich die Performance-Messung `surface-quality-open-close`.

## Visual

Die DOM-Baseline `tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json` deckt Desktop, Mobile, Topmost Overlay und Forced Colors ab. Sie bleibt bewusst JSON-only, damit der lokale Gate stabil ohne Browser-Pixel-Diff laufen kann.

## Handoff

`WP-SM-08` kann auf den Quality-Gates aufsetzen und die native RMT `surfaces` Domain gegen dieselben sichtbaren Stack-Zustaende validieren.
