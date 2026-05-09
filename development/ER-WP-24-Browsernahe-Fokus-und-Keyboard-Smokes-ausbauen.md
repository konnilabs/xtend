# ER-WP-24 - Browsernahe Fokus- und Keyboard-Smokes ausbauen

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-24.a11y-keyboard-smokes.v1`
- Browser Contract: `xtend.a11y.browser-keyboard-smoke.v1`
- Zielcontract: `development/XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md`
- Bezug:
  - `development/XTend-A11y-Component-Contract.md`
  - `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`
  - `tests/browser/browser_smoke_suite.js`
  - `tests/components/accessibility_hydration_suite.js`
  - `docs/a11y-keyboard-smokes.md`

## Ziel

`ER-WP-24` macht A11y-Verhalten browsernah pruefbar. Der bisherige A11y-Vertrag aus `ER-WP-22` und die Scaffold-Pflichten aus `ER-WP-23` werden damit um echte Fokus- und Keyboard-Smokes fuer priorisierte Komponentenklassen ergaenzt.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `tests/browser/fixtures/a11y-focus-keyboard-smoke.html` | completed | selbstpruefende Browser-Fixture fuer Routing, Overlay, Form/Input und Tabs |
| `tests/browser/fixtures/components/manifest.json` | completed | ergaenzt `x-input`, `x-form` und `x-tabs` fuer lokale Fixture-Hydration |
| `tests/browser/browser_smoke_suite.js` | completed | bindet Fixture, Source-Contracts und optionalen Safari-Lauf an |
| `tests/components/accessibility_hydration_suite.js` | completed | nimmt den browsernahen A11y-Smoke als Hydration-Gate auf |
| `development/XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md` | completed | dokumentiert `xtend.a11y.browser-keyboard-smoke.v1` |
| `docs/a11y-keyboard-smokes.md` | completed | Entwicklerdokumentation fuer Keyboard-/Fokus-Smokes |

## Gepruefte Pfade

- `x-link` aktiviert XRouter-Routen per `Enter`.
- `x-link` aktiviert XRouter-Routen per `Space`.
- `x-link` synchronisiert aktive Routen mit `aria-current`.
- `x-input` delegiert Fokus an das native Shadow-Input.
- `x-input` und `x-form` synchronisieren Tastatureingabe mit `xstate`.
- `x-tabs` navigiert per `ArrowRight` und `ArrowLeft`.
- `x-tabs` behaelt `Enter` als Aktivierungspfad.
- `x-modal` setzt Initialfokus in das Overlay.
- `x-modal` kapselt Fokus per `Tab` und `Shift+Tab`.
- `x-modal` schliesst per `Escape` und stellt Fokus wieder her.
- `x-dialog` bleibt source-seitig auf Fokusfalle, `Escape` und Fokusrestore im Overlay-Contract.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Overlay-Komponenten haben browsernahe Fokus-/Keyboard-Smokes | erfuellt ueber `x-modal`, mit `x-dialog` Source-Paritaet |
| Routing-Komponenten haben browsernahe Fokus-/Keyboard-Smokes | erfuellt ueber `x-link` + `x-router` |
| Form-Komponenten haben browsernahe Fokus-/Keyboard-Smokes | erfuellt ueber `x-input` + `x-form` |
| Tab, Enter, Space, Escape, Pfeiltasten und Fokusfalle sind abgedeckt | erfuellt |
| Tests laufen lokal ohne CDN oder externen Browserzwang | erfuellt |

## Verifikation

Auszufuehren:

```bash
node --check tests/browser/browser_smoke_suite.js
node --check tests/components/accessibility_hydration_suite.js
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js a11y-hydration --json
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-24 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-25` | completed | Screenreader-Signal-Contracts fuer `aria-live`, Status- und Errorregionen sind eingefuehrt |
| `ER-WP-26` | completed | Reduced-Motion- und High-Contrast-Regeln sind gatebar |
| `ER-WP-35` | planned | kann spaeter auf browsernahe Regression und visuelle Priorisierung aufbauen |

## Ergebnis

`ER-WP-24` ist abgeschlossen. XTend besitzt jetzt einen stabilen browsernahen A11y-Smoke fuer Fokus- und Keyboard-Verhalten, der in den regulaeren Browser- und A11y-Gates verankert ist.
