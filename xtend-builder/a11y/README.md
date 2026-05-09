# XTend Scaffold A11y

Status: implemented by ER-WP-23, extended by ER-WP-25 and ER-WP-26

## Zweck

`xtend-builder/a11y/` enthaelt den A11y-Profilplan fuer neue Scaffold-Komponenten. Der Plan uebersetzt den A11y Component Contract `xtend.a11y.component-contract.v1` in konkrete Dry-Run-Artefakte.

Ab ER-WP-25 haengt das Profil zusätzlich den Screenreader-Signal-Contract an. Neue Komponenten deklarieren damit nicht nur Rolle, Namen und Keyboard-Pflichten, sondern auch maschinenlesbare Live-Region-, Status- und Error-Signale fuer Fabric/RMT-A11y-Lanes.

Ab ER-WP-26 haengt das Profil zudem `xtend.a11y.motion-contrast-policy.v1` an. Neue Komponenten erhalten damit pruefbare Regeln fuer `prefers-reduced-motion`, `forced-colors`, Fokus, Theme Tokens und Nicht-Farbstatus.

## Contract IDs

- Component Contract: `xtend.a11y.component-contract.v1`
- Profil: `xtend.a11y.profile.v1`
- Screenreader Signals: `xtend.a11y.screenreader-signals.v1`
- Screenreader Signal Record: `xtend.a11y.screenreader-signal.v1`
- Motion/Contrast Policy: `xtend.a11y.motion-contrast-policy.v1`
- Motion Policy: `xtend.a11y.motion-policy.v1`
- Contrast Policy: `xtend.a11y.contrast-policy.v1`
- Test Contract: `xtend.a11y.test-contract.v1`
- Scaffold Plan: `xtend.scaffold.a11y-profile-plan.v1`

## Artefaktwirkung

- Source: statischer Getter `xtendScaffoldA11yProfile`
- Docs: Abschnitte `A11y-Profil`, `Screenreader-Signale` und `Motion-und-Contrast-Policy`
- Fixture: `aria-label` und Hydration-Ergebnis fuer Rolle, Name, Profil, Screenreader-Signale und Motion/Contrast
- Tests: Assertions fuer A11y-Profil, Rolle, Name, Screenreader-Signale, Motion/Contrast und A11y-Hydration-Gate
- Manifest: `a11yProfile`, `screenreaderSignals` und `motionContrastPolicy`
- Types: `X<Component>A11yProfile`, `X<Component>ScreenreaderSignalContract` und `X<Component>MotionContrastPolicy`

## Gates

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js screenreader-signals
node scripts/run_xtend_tests.js motion-contrast
node scripts/run_xtend_tests.js references
```
