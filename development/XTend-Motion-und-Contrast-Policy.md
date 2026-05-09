# XTend Motion und Contrast Policy

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.a11y.motion-contrast-policy.v1`
- Motion Contract: `xtend.a11y.motion-policy.v1`
- Contrast Contract: `xtend.a11y.contrast-policy.v1`
- Test Contract: `xtend.a11y.motion-contrast-test.v1`
- Gate: `node scripts/run_xtend_tests.js motion-contrast --json`
- Roadmap: `ER-WP-26`

## Ziel

XTend-Komponenten duerfen Animation, Fokus, Status und Theme-Kontrast nicht als nachtraegliche Optik behandeln. Motion und Contrast sind Bestandteil des A11y-by-design Contracts und muessen fuer neue, modernisierte und scaffolded Komponenten maschinenlesbar vorhanden sein.

## Contract Shape

```js
{
  schema: 'xtend.a11y.motion-contrast-policy.v1',
  componentRef: 'x-component',
  motion: {
    schema: 'xtend.a11y.motion-policy.v1',
    mediaQuery: '(prefers-reduced-motion: reduce)',
    reducedMotion: 'required',
    animationPolicy: 'no-essential-motion',
    noMotionOnlyState: true
  },
  contrast: {
    schema: 'xtend.a11y.contrast-policy.v1',
    mediaQuery: '(forced-colors: active)',
    highContrast: 'required',
    forcedColorAdjust: 'auto',
    focusVisible: 'required',
    nonColorStatus: 'required'
  },
  fabric: {
    lane: 'a11y',
    fiberKind: 'a11y.preference',
    scheduleRef: 'a11y.user-blocking.preference'
  }
}
```

## Regeln

| Bereich | Pflicht |
|---------|---------|
| Reduced Motion | Jede animierte Komponente braucht `@media (prefers-reduced-motion: reduce)` und darf keinen Zustand nur durch Bewegung vermitteln |
| High Contrast | Komponenten mit Fokus, Status, Error oder Overlay brauchen `@media (forced-colors: active)` |
| Theme Tokens | Forced-Colors-Pfade nutzen Systemfarben wie `Canvas`, `CanvasText`, `ButtonText`, `Highlight`, `Mark` |
| Fokus | `:focus-visible` bleibt sichtbar und verwendet im Forced-Colors-Pfad `Highlight` |
| Status | Error, Warning, Busy und Active duerfen nicht nur farblich unterscheidbar sein |

## Scaffold-Anschluss

`xtend-builder/a11y/component-a11y-profile.js` erzeugt fuer neue Komponenten:

- `motion` mit `xtend.a11y.motion-policy.v1`
- `contrast` mit `xtend.a11y.contrast-policy.v1`
- `motionContrast.policy` mit `xtend.a11y.motion-contrast-policy.v1`
- Manifest-Key `motionContrastPolicy`
- Docs-Abschnitt `Motion-und-Contrast-Policy`
- lokalen Gate `motion-contrast`

## Grenzen

- Der Contract erzeugt keine produktive Browser-Preference-Runtime.
- Der RMT Kernel importiert XTend nicht und liest keine CSS-Media-Queries direkt.
- Fabric und Host-Adapter duerfen Preference-Signale als `a11y.preference` beobachten und an RMT Schedule Records koppeln.

## Validierung

```bash
node --check a11y/motion-contrast-policy.js
node --check tests/a11y/motion_contrast_suite.js
node scripts/run_xtend_tests.js motion-contrast --json
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Ergebnis

`xtend.a11y.motion-contrast-policy.v1` ist akzeptiert. XTend hat damit einen gatebaren A11y-Preference-Contract fuer Reduced Motion, High Contrast, Theme Tokens, Fokus und Nicht-Farbstatus.
