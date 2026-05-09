# A11y Keyboard Smokes

Contract:

```text
xtend.docs.a11y-keyboard-smokes.v1
xtend.a11y.browser-keyboard-smoke.v1
```

XTend prueft ab `ER-WP-24` zentrale A11y-Interaktionen browsernah. Der Gate ist kein Ersatz fuer manuelle Screenreader-Reviews, aber er verhindert, dass Fokus- und Keyboard-Pfade unbemerkt aus Core-Komponenten herausfallen.

## Fixture

Die selbstpruefende Browser-Fixture liegt hier:

```text
tests/browser/fixtures/a11y-focus-keyboard-smoke.html
```

Sie nutzt:

- `xtend-loader.js`
- `data-manifest="/tests/browser/fixtures/components/manifest.json"`
- lokale Component-Module
- `window.__xtendA11yKeyboardSmokeResult`

## Abgedeckte Pfade

| Bereich | Komponente | Erwartung |
|---------|------------|-----------|
| Routing | `x-link` + `x-router` | `Enter` und `Space` navigieren, `aria-current` folgt der Route |
| Form | `x-input` + `x-form` | Fokus wird delegiert, Eingabe synchronisiert `xstate` und Formdaten |
| Tabs | `x-tabs` | `ArrowRight`, `ArrowLeft` und `Enter` bleiben aktivierbar |
| Overlay | `x-modal` | Initialfokus, Fokusfalle, `Escape` und Fokusrestore funktionieren |

`x-dialog` nutzt denselben Overlay-Contract und wird im Gate source-seitig auf Fokusfalle, `Escape` und Fokusrestore geprueft.

## Lokale Gates

```bash
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js a11y-hydration --json
```

Optional kann der Browser-Smoke mit Safari WebDriver ausgefuehrt werden:

```bash
XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser
```

Der Standardlauf bleibt deterministisch und benoetigt keinen externen Browser.

## Komponentenautoren

Neue oder modernisierte Komponenten sollen ihren A11y-Pfad aus dem Profil ableiten:

- Routing und Commands: `Enter`, optional `Space`, aktiver ARIA-State.
- Overlays: Initialfokus, Fokusfalle, `Escape`, Fokusrestore.
- Form Controls: delegierter Fokus, Eingabeereignisse, State-/Form-Synchronisierung.
- Composite Widgets: Pfeiltasten und aktueller ARIA-State.

Scaffolded Komponenten erhalten ab `ER-WP-23` ein `xtend.a11y.profile.v1`. ER-WP-24 liefert den browsernahen Gate, an den solche Profile spaeter komponentenspezifisch andocken koennen.
