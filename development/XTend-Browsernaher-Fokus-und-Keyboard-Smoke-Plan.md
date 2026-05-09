# XTend Browsernaher Fokus- und Keyboard-Smoke-Plan

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.a11y.browser-keyboard-smoke.v1`
- Bezug:
  - `development/XTend-A11y-Component-Contract.md`
  - `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`
  - `tests/browser/browser_smoke_suite.js`
  - `tests/components/accessibility_hydration_suite.js`
  - `docs/a11y-keyboard-smokes.md`

## Ziel

XTend-Komponenten sollen nicht nur statisch A11y-Metadaten tragen, sondern die wichtigsten Fokus- und Keyboard-Pfade im Browser-Kontext pruefbar machen.

Dieser Plan definiert den ersten browsernahen Gate fuer:

- Routing-Komponenten
- Overlay-Komponenten
- Form-Komponenten
- interaktive Tastaturmuster wie Tabs

## Fixture Contract

Die stabile Fixture traegt:

```text
xtend.a11y.browser-keyboard-smoke.v1
```

Der Browser-Result-Key lautet:

```js
window.__xtendA11yKeyboardSmokeResult
```

Die Fixture nutzt ausschliesslich:

- `xtend-loader.js`
- `data-manifest="/tests/browser/fixtures/components/manifest.json"`
- repo-lokale Component-Pfade
- `meta[name="xtend-preload"]`

CDN-Import-Maps und externe Runtime-Pfade sind im Gate nicht erlaubt.

## Gepruefte Verhaltenspfade

| Bereich | Komponente | Keyboard-/Fokuspfad | Smoke-Erwartung |
|---------|------------|---------------------|-----------------|
| Routing | `x-link` + `x-router` | `Enter` | Detail-Route wird gerendert und `aria-current` synchronisiert |
| Routing | `x-link` + `x-router` | `Space` | Home-Route wird gerendert und `aria-current` synchronisiert |
| Form | `x-input` | delegierter Fokus | `x-input.focus()` fokussiert das native Shadow-Input |
| Form | `x-input` + `x-form` | Tastatureingabe | `xinput-value-*` und `xform-data-*` werden synchronisiert |
| Tabs | `x-tabs` | `ArrowRight` | naechster Tab wird selektiert |
| Tabs | `x-tabs` | `ArrowLeft` | vorheriger Tab wird selektiert |
| Tabs | `x-tabs` | `Enter` | aktueller Tab bleibt aktivierbar |
| Overlay | `x-modal` | Initialfokus | Fokus wandert beim Oeffnen in das Overlay |
| Overlay | `x-modal` | `Tab` | Fokusfalle springt vom letzten auf das erste fokussierbare Element |
| Overlay | `x-modal` | `Shift+Tab` | Fokusfalle springt vom ersten auf das letzte fokussierbare Element |
| Overlay | `x-modal` | `Escape` | Overlay schliesst und stellt den Ursprungsfokus wieder her |

`x-dialog` bleibt im selben A11y-Overlay-Contract und wird in den Source-Contracts weiter auf Fokusfalle, Escape und Fokusrestore geprueft. Browsernah wird die Overlay-Klasse im ersten Smoke ueber `x-modal` ausgefuehrt, damit die Fixture deterministisch bleibt.

## Gate-Anbindung

Der Contract ist an zwei lokale Gates gebunden:

```bash
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js a11y-hydration --json
```

Der Browser-Smoke prueft:

- Fixture-Vertrag
- lokale Loader-/Manifest-Nutzung
- Source-Verhalten von `x-link`, `x-modal`, `x-dialog`, `x-input`, `x-form` und `x-tabs`
- optionalen Safari WebDriver Lauf fuer die selbstpruefende Fixture

Der A11y-Hydration-Gate prueft, dass die Fixture und ihre `recordCheck(...)`-Signale im A11y-Regressionsset sichtbar bleiben.

## Autorenregeln

Neue Komponenten mit A11y-Profil muessen bei relevanter Interaktion einen browsernahen Pfad definieren.

Mindestregeln:

- Routing- oder Command-Komponenten muessen `Enter` und, falls semantisch passend, `Space` pruefen.
- Overlay-Komponenten muessen Initialfokus, Fokusfalle, `Escape` und Fokusrestore pruefen.
- Form-Komponenten muessen delegierten Fokus, Eingabeereignisse und State-/Form-Synchronisierung pruefen.
- Composite Widgets muessen Pfeiltasten und aktuellen ARIA-State pruefen.

## Handoff

`ER-WP-24` schliesst den ersten browsernahen Fokus-/Keyboard-Gate ab.

Folgepakete:

- `ER-WP-25` hat Screenreader-Signal-Contracts fuer `aria-live`, Status- und Errorregionen eingefuehrt.
- `ER-WP-26` hat Reduced-Motion- und High-Contrast-Gates auf derselben A11y-by-design-Struktur aufgebaut.
- `ER-WP-35` kann spaeter visuelle und browsernahe Regression priorisieren.
