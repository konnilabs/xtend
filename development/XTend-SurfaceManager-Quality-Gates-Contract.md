# XTend SurfaceManager Quality Gates Contract

Status: accepted for `WP-SM-07`
Schema: `xtend.surface.quality-gates.v1`
Browser Smoke Schema: `xtend.surface.quality-gates.browser-smoke.v1`
Visual Baseline Schema: `xtend.surface.quality-gates.visual-baseline.v1`
Local Gate: `node scripts/run_xtend_tests.js surface-manager-quality --json`

## Ziel

`WP-SM-07` aktiviert browsernahe Quality-Gates fuer den SurfaceManager. Nach `WP-SM-05` und `WP-SM-06` existieren RMT-first Workbench, Windows, SidePanels und kompatible Overlays; dieses Paket haertet die Kombination mit Browser-, A11y-, Performance- und Visual-Smokes.

## Gate-Domaenen

| Domain | Gate | Zweck |
|--------|------|-------|
| Browser | `surface-manager-browser` | gemischter Stack aus Windows, SidePanel, Modal, Dialog und Drawer |
| A11y | `surface-manager-a11y` | Rollen, Focus Restore, Escape-Topmost, Tab-Trap, Reduced Motion und Forced Colors |
| Performance | `surface-manager-performance` | Open/Close-, Focus-, Layout- und Snapshot-Budgets |
| Visual | `surface-manager-visual` | DOM-Baseline fuer Desktop, Mobile, Topmost Overlay und Forced Colors |

Der kombinierte Gate ist `surface-manager-quality`.

## Browser-Fixture

`tests/browser/fixtures/surface-manager-quality-smoke.html` ist ein lokales Browser-Fixture ohne externe Netzwerkabhaengigkeit. Es laedt:

- `x-surface-manager`
- `x-surface-window`
- `x-side-panel`
- `xsurfaceoverlay-bridge`
- `x-modal`
- `x-dialog`
- `x-drawer`

Das Fixture misst `surface-quality-open-close`, oeffnet Overlays ueber `surface-overlay-command`, prueft die gemeinsame Registry und bestaetigt, dass Legacy Overlay Events sichtbar bleiben.

## A11y Assertions

`WP-SM-07` gatebar:

- `role-application`
- `role-dialog`
- `role-complementary`
- `aria-live-status`
- `focus-return`
- `escape-topmost`
- `tab-focus-trap`
- `forced-colors-focus-visible`
- `reduced-motion-safe`

## Performance Budgets

```json
{
  "openCloseBudgetMs": 16,
  "focusBudgetMs": 16,
  "layoutTransitionBudgetMs": 16,
  "snapshotBudgetMs": 8,
  "registrationBudgetMs": 16,
  "browserFixtureMeasure": "surface-quality-open-close"
}
```

Die Budgets sind fuer lokale deterministische Contract-Gates zunaechst als Contract-Werte und Browser-Marks abgebildet. Harte browserbasierte Messungen bleiben optional, bis `WP-SM-07` in CI mit einem stabilen Browser Driver laeuft.

## Visual Baseline

`tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json` definiert vier DOM-Snapshots:

- `surface-quality-desktop-mixed-stack`
- `surface-quality-mobile-responsive-panel`
- `surface-quality-topmost-overlay`
- `surface-quality-forced-colors-a11y`

Die Baseline bleibt JSON-only; Pixel-Screenshots koennen spaeter in `WP-SM-09` oder einem Release-Hardening-Paket darauf aufsetzen.

## Boundary

Der Gate nutzt den Controller aus `WP-SM-02`, die Workbench- und Browser-Vorarbeit aus `WP-SM-05` und die Overlay Bridge aus `WP-SM-06`. Es entsteht keine zweite Registry und keine neue RMT-Kernel-Abhaengigkeit.

Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`.
