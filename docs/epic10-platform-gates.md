# Epic 10 Platform Gates

Contract: `xtend.epic10.platform-gates.v1`

Dieses Dokument beschreibt die Gate-Kette aus `WP-E10-15`. Sie buendelt Browser-, A11y-, Performance- und Visual-Gates fuer die Epic-10 Component Platform.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic10-platform-gates --json
npm run test:epic10-platform-gates
```

## Gate-Domains

- `component-contract`: Component Contract v2 und Existing Component Metadata
- `rmt-first-app`: RMT-first Demo-App ohne manuelle Shell
- `browser-smoke`: lokale Browser-nahe Fixtures
- `a11y`: Keyboard, Screenreader, Reduced Motion und Contrast
- `performance`: Measurements, Regression und Hydration Policies
- `visual-browser-regression`: Viewports, Theme-Varianten und Visual States
- `ci-handoff`: Fast-PR- und Release-Komposition

## Fast PR

Der Fast PR Gate enthaelt die neuen Epic-10 Plattformregeln, bleibt aber ohne release-only Performance Regression:

```bash
node scripts/run_xtend_tests.js component-contract-v2 epic10-p0-component-wave component-lab-rmt-inspector rmt-first-demo-app existing-component-metadata browser a11y-hydration screenreader-signals motion-contrast regression-priority references --json
```

`npm run test:pr` fuehrt diese Linie zusammen mit Core-, Fabric-, Security- und Docs-RMT-Gates aus.

## Release

Release-Gates fuehren zusaetzlich aus:

- `fabric-performance-measurements`
- `performance-regression`
- `hydration-policy`

Der vollstaendige Release-Pfad bleibt:

```bash
npm run test:release:full
```

## Browser-Smokes

Die Gate-Kette erwartet folgende lokale Fixtures:

- `tests/browser/fixtures/custom-elements-smoke.html`
- `tests/browser/fixtures/core-flows-smoke.html`
- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`

CDN-Ladungen sind in dieser Linie nicht erlaubt.

## Handoff

`WP-E10-15` schliesst die Testbarkeit der Epic-10-Plattformlinie ab. Seit `WP-E10-16` ist der Abschlussgate `epic10-release-handoff` Teil der Fast-PR-/Release-Handoff-Sicht, damit Dokumentation, Guide-Struktur und Publish Boundary zusammen mit den Plattformgates geprueft werden.
