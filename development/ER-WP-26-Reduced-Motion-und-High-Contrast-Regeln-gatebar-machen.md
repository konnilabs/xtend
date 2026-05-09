# ER-WP-26 - Reduced-Motion und High-Contrast Regeln gatebar machen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-26.motion-contrast-gates.v1`
- Policy: `development/XTend-Motion-und-Contrast-Policy.md`
- Gate: `npm run test:motion-contrast`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Abhaengigkeiten: `ER-WP-22`, `ER-WP-24`, `ER-WP-25`

## Ziel

Motion- und Contrast-Accessibility sollen fuer XTend-Komponenten pruefbar sein. Das Paket fuehrt einen stabilen Contract fuer `prefers-reduced-motion`, `forced-colors`, Fokus-Sichtbarkeit, Theme Tokens und Nicht-Farbstatus ein.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
|----------|----------|
| Policy Contract | `a11y/motion-contrast-policy.js` mit `xtend.a11y.motion-contrast-policy.v1` |
| Component Gates | `tests/a11y/motion_contrast_suite.js` prueft Policy, relevante Komponenten und Scaffold |
| Package | Export `./a11y/motion-contrast-policy`, Script `test:motion-contrast` und Metadata `xtend.motionContrastPolicy` |
| Komponenten | `x-alert`, `x-toast`, `x-modal`, `x-dialog`, `x-button`, `x-spinner`, `x-input`, `x-form` deklarieren `xtendMotionContrastPolicy` und Forced-Colors-Pfade |
| Scaffold | A11y Profile, Source, Docs, Fixture, Types und Manifest fuehren `motionContrastPolicy` mit |
| Docs | `docs/motion-contrast.md` dokumentiert den Entwicklerpfad |

## Contract IDs

- `xtend.a11y.motion-contrast-policy.v1`
- `xtend.a11y.motion-policy.v1`
- `xtend.a11y.contrast-policy.v1`
- `xtend.a11y.motion-contrast-test.v1`
- `xtend.enterprise.er-wp-26.motion-contrast-gates.v1`

## Definition of Done

- Relevante Komponenten deklarieren Motion-/Contrast-Metadaten.
- Animierte Komponenten respektieren `prefers-reduced-motion`.
- Fokus-, Status-, Error- und Overlay-Pfade besitzen `forced-colors` Regeln.
- Scaffold-Dry-Runs erzeugen Docs, Types, Fixture-Result und Manifest-Plan fuer `motionContrastPolicy`.
- Der lokale Gate `motion-contrast` laeuft ohne Warnungen.

## Validierung

```bash
node --check a11y/motion-contrast-policy.js
node --check tests/a11y/motion_contrast_suite.js
node scripts/run_xtend_tests.js motion-contrast --json
node scripts/run_xtend_tests.js a11y-hydration --json
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-26 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-31` | next | Component Catalog Coverage kann Motion-/Contrast-Pflichten als Katalogdimension aufnehmen |
| `ER-WP-35` | planned | spaetere visuelle Regression kann Forced-Colors- und Reduced-Motion-Smokes browsernah erweitern |

## Ergebnis

`ER-WP-26` ist abgeschlossen. Reduced Motion und High Contrast sind jetzt Teil der A11y-by-design-Oberflaeche und lokal gatebar.
