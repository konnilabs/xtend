# WP-E12-04 - x-theme A11y, High Contrast und Reduced Motion haerten

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Backlog: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- Contract: `xtend.epic12.wp04.xtheme-a11y-motion-contrast.v1`
- Bezug:
  - `components/xtheme.js`
  - `components/xtheme.d.ts`
  - `docs/components/xtheme.md`
  - `a11y/motion-contrast-policy.js`
  - `tests/components/xtheme.component_suite.js`
  - `tests/a11y/motion_contrast_suite.js`
  - `catalog/component-catalog-coverage.js`
  - `catalog/component-long-tail-migration.js`
  - `catalog/component-regression-priority.js`

## Ziel

`WP-E12-04` schliesst die A11y-Restdimension von `x-theme`. Das Modul bleibt ein framework-neutraler Provider, kein visuelles Custom Element. Seine Aufgabe ist nun, Theme-, Motion- und Contrast-Preferences als stabile Runtime Boundary fuer XTend-Komponenten, Fabric, Tests und spaetere RMT-Schedules bereitzustellen.

## Runtime-Haertung

`components/xtheme.js` wurde erweitert:

| Bereich | Umsetzung |
|---------|-----------|
| A11y Profile | `xtendScaffoldA11yProfile` beschreibt `x-theme` als `theme-preference-provider` |
| Motion/Contrast Policy | `xtendMotionContrastPolicy` mit `xtend.a11y.motion-contrast-policy.v1` |
| Reduced Motion | `prefers-reduced-motion: reduce`, `data-xtend-motion` und Motion-Tokens |
| Forced Colors | `forced-colors: active`, `data-xtend-contrast`, `data-xtend-forced-colors` |
| System Colors | `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `forced-color-adjust: auto` |
| Screenreader | versteckte Live-Region mit `role="status"`, `aria-live="polite"` und `aria-atomic="true"` |
| State Sync | `xtend.theme.preferences`, `xtend.a11y.motion`, `xtend.a11y.contrast` in `xstate` |
| Events | `theme-preference-changed` und `theme-a11y-announcement` |

Die Default-Registry enthaelt neben `light` und `dark` nun auch `high-contrast` und `forced-colors`.

## Public Types und Docs

`components/xtheme.d.ts` beschreibt:

- A11y Preference Snapshot
- Motion- und Contrast-Praeferenztypen
- Runtime-A11y-Profil
- Motion-/Contrast-Policy
- `theme-preference-changed`
- `theme-a11y-announcement`
- neue Methoden wie `getA11yPreferences()` und `getMotionContrastPolicy()`

`docs/components/xtheme.md` dokumentiert Reduced Motion, Forced Colors, System Color Tokens, Live Region und xstate-Spiegelung.

## Katalog-Fortschreibung

Nach diesem Paket gilt:

- `x-theme` verliert die Restdimension `a11y`.
- `x-theme` wechselt von `contract-gated` zu `typed-contract-gated`.
- Die A11y-Coverage steigt auf `36/37`.
- Offen bleibt fuer `x-theme` nur `performance`.
- `component-long-tail-migration` fuehrt `x-theme` weiter, aber nur mit `performance-profile`.
- `regression-priority` entfernt `a11y-profile-remediation` fuer `x-theme`.

## Grenzen

- Kein Performance-Profil in diesem Paket; das folgt in `WP-E12-05`.
- Keine neue visuelle Shell fuer `x-theme`.
- Keine harte Kopplung zwischen XTend und XTendRMT.
- Keine Netzwerk- oder CDN-Pfade fuer lokale Tests.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `x-theme` verliert die Restdimension `a11y` | erfuellt |
| Reduced Motion wird als Runtime Preference gespiegelt | erfuellt |
| Forced Colors wird als Runtime Preference gespiegelt | erfuellt |
| Theme-Wechsel sind fuer Screenreader wahrnehmbar | erfuellt |
| Motion-/Contrast-Gate prueft `x-theme` | erfuellt |
| `WP-E12-05` startbar | erfuellt |

## Verifikation

```bash
node --check components/xtheme.js
node --check tests/components/xtheme.component_suite.js
node --check tests/a11y/motion_contrast_suite.js
node scripts/run_xtend_tests.js components motion-contrast catalog-coverage component-long-tail-migration regression-priority references --json
```

## Ergebnis

`WP-E12-04` ist abgeschlossen. `x-theme` ist als A11y-, High-Contrast- und Reduced-Motion-Provider gehaertet und bleibt nur noch wegen des fehlenden Performance-/Propagation-Profils im Long-Tail. Der naechste primaere Epic-12-Pfad ist `WP-E12-05`.
