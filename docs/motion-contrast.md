# Motion und Contrast

- Contract: `xtend.docs.motion-contrast.v1`
- Runtime-/Gate-Contract: `xtend.a11y.motion-contrast-policy.v1`
- Motion Contract: `xtend.a11y.motion-policy.v1`
- Contrast Contract: `xtend.a11y.contrast-policy.v1`
- Gate: `node scripts/run_xtend_tests.js motion-contrast --json`

## Zweck

Motion und Contrast sind in XTend Bestandteil von A11y-by-design. Komponenten muessen reduzierte Bewegung, erzwungene Kontrastmodi, sichtbaren Fokus und Nicht-Farbstatus respektieren, ohne dass XTendRMT oder ein Host-Framework konkrete CSS-Details kennen muss.

## Pflichtregeln

| Bereich | Umsetzung |
|---------|-----------|
| Reduced Motion | `@media (prefers-reduced-motion: reduce)` deaktiviert nicht essentielle Animationen und Transitions |
| High Contrast | `@media (forced-colors: active)` nutzt Systemfarben wie `CanvasText`, `ButtonText`, `Highlight`, `Mark` |
| Fokus | `:focus-visible` bleibt sichtbar und verwendet im Forced-Colors-Pfad `Highlight` |
| Status | Error, Warning, Busy und Active haben eine nicht nur farbliche Semantik |
| Tokens | Theme Tokens duerfen Forced-Colors nicht ueberschreiben, wenn Systemfarben gebraucht werden |

## Component Contract

Relevante Komponenten deklarieren statisch:

```js
static get xtendMotionContrastPolicy() {
  return {
    schema: 'xtend.a11y.motion-contrast-policy.v1',
    componentRef: 'x-component',
    motion: {
      schema: 'xtend.a11y.motion-policy.v1',
      mediaQuery: '(prefers-reduced-motion: reduce)',
      noMotionOnlyState: true
    },
    contrast: {
      schema: 'xtend.a11y.contrast-policy.v1',
      mediaQuery: '(forced-colors: active)',
      focusVisible: 'required',
      nonColorStatus: 'required'
    }
  };
}
```

## Scaffold

Neue Scaffold-Komponenten erhalten:

- `motionContrast.policy` im A11y-Profil
- Manifest-Key `motionContrastPolicy`
- Docs-Abschnitt `Motion-und-Contrast-Policy`
- Fixture-Felder `motionContrastPolicy`, `motionMediaQuery`, `contrastMediaQuery`
- TypeScript-Type `X<Component>MotionContrastPolicy`

## Fabric und RMT

Preference-Signale nutzen die Fabric-Lane `a11y`, Fiber `a11y.preference` und Schedule `a11y.user-blocking.preference`. RMT bleibt framework-agnostisch und bekommt nur host-neutrale Schedule-/Diagnostic-Signale, keine CSS-Ausfuehrung.

## Lokale Verifikation

```bash
npm run test:motion-contrast
node scripts/run_xtend_tests.js motion-contrast --json
node scripts/run_xtend_tests.js references --json
```
