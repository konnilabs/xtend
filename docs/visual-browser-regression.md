# Visual Browser Regression

- Contract: `xtend.docs.visual-browser-regression.v1`
- Plan Contract: `xtend.catalog.component-regression-priority-plan.v1`
- Gate Contract: `xtend.catalog.component-regression-priority-gate.v1`
- Snapshot Contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Workpackage: `ER-WP-35`

Diese Seite beschreibt den aktuellen XTend-Plan fuer visuelle und browsernahe Regression. ER-WP-35 fuehrt noch keinen Screenshot-Runner ein. Stattdessen erzeugt XTend einen stabilen Prioritaetsplan, der pro Manifest-Komponente festlegt, welche Browser-Smokes, Viewports, Theme-Varianten, visuellen Zustaende und Performance-Profile zuerst automatisiert werden muessen.

## Lokal pruefen

```bash
node scripts/run_xtend_tests.js regression-priority
node scripts/run_xtend_tests.js regression-priority --json
npm run test:regression-priority
```

Der Gate ist Teil des lokalen Test-Runners und nutzt die Component Catalog Coverage Matrix als Quelle. Er bleibt CDN-frei und braucht keine externe Browser-Automation.

## Mindestabdeckung

Jede Komponente im Plan erhaelt:

- Viewports: `desktop-1280`, `mobile-390`
- Theme-/Preference-Varianten: `light`, `dark`, `forced-colors`, `reduced-motion`
- Performance-Profil: `xtend.performance.component-profile.v1`
- Handoff-Gates: `browser`, `performance-regression`, `catalog-coverage`, `references`

P0-Komponenten wie `x-router`, `x-link`, `x-modal`, `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-tooltip`, `x-popover`, `x-drawer`, `x-form`, `x-calendar`, `x-writer`, `x-dialog` und `x-lightbox` werden als `p0-browser-critical` eingeordnet. P1-Komponenten wie `x-status` und `x-progress` bilden die visuelle und Performance-Baseline. P2-Komponenten bleiben als Long-Tail sichtbar.

## Profil-Regeln

| Profil | Browser-Smokes | Visuelle Zustaende |
|--------|----------------|--------------------|
| `routing` | Route-Wechsel, Keyboard Navigation, History State, RMT Route Adapter | Initial Route, Active Route, RMT Scheduled Route |
| `form` | Input Sync, Validation Feedback, Keyboard Entry, Form Submit | Default, Focus, Invalid, Disabled |
| `overlay` | Focus Trap, Escape Close, Scroll Lock, Focus Restore | Closed, Open, Focus Trapped, Reduced Motion Open |
| `feedback` | Live Region, Dismiss Timer, Reduced Motion | Info, Warning, Error, Dismissed |
| `interactive` | Keyboard Activation, Focus Visible, Mobile Tap | Default, Hover, Focus Visible, Active, Disabled |
| `media` | Media Controls, Poster Load, Fullscreen Toggle | Poster, Playing, Controls Focus |
| `theme` | Theme Switch, Token Contrast, Forced Colors | Light Theme, Dark Theme, Forced Colors |
| `display` | Layout Stability, Responsive Overflow | Default Layout, Narrow Layout |
| `iconography` | Layout Stability, Theme Token Color | Default Layout, High Contrast CurrentColor |
| `utility` | Utility Integration Probe | Helper Ready |

## Boundary-Abschluss

Der Plan haelt die frueheren Boundary-Luecken nachvollziehbar, aber nicht mehr als offene RC1-Restpunkte:

- 0 Manifest-Eintraege brauchen noch Suite-, Fixture- oder Type-Nacharbeit.
- `xstate` ist seit `WP-E13-05` als Runtime-Boundary geschlossen.
- `x-utils` ist seit `WP-E13-05` als Utility-Boundary geschlossen.
- Die 42 sichtbaren Runtime-/UI-Komponenten behalten explizite Performance-Profile; `xstate` und `x-utils` werden nicht kuenstlich zu visuellen Profiltraegern umgedeutet.

Damit ist klar, dass `ER-WP-35` priorisiert, aber die eigentliche Screenshot-/Pixel-Regression an CI und Release Readiness uebergibt.

## Snapshot Automation Contract

Seit `WP-E12-10` ist der naechste Schritt ueber `xtend.epic12.visual-snapshot-automation-contract.v1` festgelegt:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
npm run test:visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshots --json
npm run test:visual-snapshots
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

Der Snapshot-Contract uebernimmt die 360 Kombinationen aus der Component Shell Theme Matrix und beschreibt `shell-structure`, `visual-state`, `theme-token-state`, `motion-density-state`, `viewport-layout`, `focus-a11y-state` und `rmt-shell-descriptor` als Snapshot Scopes. Die Diff-Strategie ist `dom-first-pixel-ready`: DOM-Struktur und CSS Token werden mit Toleranz `0` behandelt. Seit `WP-E12-11` vergleicht `xtend.epic12.visual-snapshot-runner.v1` die lokale Fixture gegen eine textuelle JSON DOM-Baseline. Pixel-Diff ist als `optional-local-pixel-diff` vorbereitet und bleibt ausserhalb des Node-Contract-Gates. Seit `WP-E12-12` werden diese CSS Token als `xtend.design-tokens.product-contract.v1` produktisiert und ueber dieselben `--xtend-*` Namen in `x-theme`, Theme Matrix und Snapshot Baseline geprueft.

## Handoff

- `WP-E12-10`: Visual Snapshot Automation Contract ist abgeschlossen.
- `WP-E12-11`: lokales Snapshot Fixture und DOM-first Runner ist abgeschlossen.
- `WP-E12-12`: Enterprise Design System Token Productization ist abgeschlossen.
- `ER-WP-36`: CI Workflow fuer Default Gates und Regression Priority Gate produktisieren.
- `ER-WP-38`: Release Checklist um Browser-/Visual-Regression, Artefakte und SemVer-Risiken erweitern.
- `ER-WP-39`: Enterprise Adoption Guide mit QS-Empfehlungen und Baseline-Strategie ist abgeschlossen.
- `ER-WP-40`: Docs-App mit RMT Parsedown Scheduling Pilot ist abgeschlossen.

Die maschinenlesbare Umsetzung liegt in `catalog/component-regression-priority.js`. Die Architekturentscheidung liegt in `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`.
