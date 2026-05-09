# XTend Scaffold A11y Profile Plan

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.scaffold.a11y-profile-plan.v1`
- Bezug:
  - `development/XTend-A11y-Component-Contract.md`
  - `development/ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md`
  - `development/XTend-Screenreader-Signal-Contract.md`
  - `development/ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `development/ER-WP-26-Reduced-Motion-und-High-Contrast-Regeln-gatebar-machen.md`
  - `a11y/screenreader-signals.js`
  - `a11y/motion-contrast-policy.js`
  - `xtend-builder/a11y/component-a11y-profile.js`
  - `xtend-builder/blueprints/component-blueprint.contract.js`
  - `xtend-builder/generators/component-plan.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/templates/component/source.template.js`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtend-builder/templates/component/component-suite.template.js`
  - `xtend-builder/templates/component/fixture.template.html`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/manifest-plan.template.json`

## Zweck

Der A11y Profile Plan bindet `xtend.a11y.profile.v1` direkt an den XTend-Scaffold. Neue Komponenten sollen Accessibility nicht nachtraeglich erhalten, sondern im Dry-Run automatisch mit A11y-Profil, A11y-Testpflicht, Fixture-Attributen, Typen und Manifest-Metadaten entstehen.

## Contract Mapping

| Ebene | Contract |
|-------|----------|
| Component Contract | `xtend.a11y.component-contract.v1` |
| Profil | `xtend.a11y.profile.v1` |
| Screenreader Signals | `xtend.a11y.screenreader-signals.v1` |
| Screenreader Signal Record | `xtend.a11y.screenreader-signal.v1` |
| Motion/Contrast Policy | `xtend.a11y.motion-contrast-policy.v1` |
| Motion Policy | `xtend.a11y.motion-policy.v1` |
| Contrast Policy | `xtend.a11y.contrast-policy.v1` |
| Test Contract | `xtend.a11y.test-contract.v1` |
| Scaffold Plan | `xtend.scaffold.a11y-profile-plan.v1` |

## Pflichtfelder

Jedes generierte A11y-Profil muss enthalten:

- Rolle/Semantik
- zugaenglicher Name
- Fokusstrategie
- Keyboard Contract
- ARIA-State-Liste
- Screenreader-/Live-Region-Strategie
- Screenreader-Signal-Contract mit Status- und Errorregionen
- Reduced-Motion-Regel
- Kontrast-/Fokus-Regel
- Motion-/Contrast-Policy mit Fabric-Lane `a11y`, Fiber `a11y.preference` und Schedule `a11y.user-blocking.preference`
- Testplan mit `xtend.a11y.test-contract.v1`

## Scaffold-Artefakte

| Artefakt | Pflicht |
|----------|---------|
| Source | `xtendScaffoldA11yProfile` als statischer Getter |
| Docs | Abschnitte `A11y-Profil`, `Screenreader-Signale`, `Motion-und-Contrast-Policy` und A11y-Gates |
| Tests | Assertions fuer Profil, Rolle, Name, Screenreader-Signale, Motion-/Contrast-Policy und A11y-Hydration |
| Fixture | `aria-label`, Rolle, zugaenglicher Name, Profil, Screenreader-Signale und Motion-/Contrast-Policy im Hydration-Ergebnis |
| Types | `X<Component>A11yProfile`, `X<Component>ScreenreaderSignalContract`, `X<Component>MotionContrastPolicy` und A11y-Key-Unionen |
| Manifest | Keys `a11yProfile`, `screenreaderSignals` und `motionContrastPolicy` |

## Gates

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js screenreader-signals
node scripts/run_xtend_tests.js motion-contrast
node scripts/run_xtend_tests.js references
npm test
```

## Grenze

Der Scaffold erzeugt keine produktive A11y-Runtime und keine Screenreader-Automatisierung. Browsernahe Fokus-/Keyboard-Smokes sind seit `ER-WP-24` gatebar. Screenreader-Signal-Contracts sind seit `ER-WP-25` als `xtend.a11y.screenreader-signals.v1` angebunden; Reduced-Motion- und High-Contrast-Gates sind seit `ER-WP-26` als `xtend.a11y.motion-contrast-policy.v1` angebunden.
