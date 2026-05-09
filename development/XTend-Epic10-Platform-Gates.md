# XTend Epic 10 Platform Gates

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic10.platform-gates.v1`
- Report Contract: `xtend.epic10.platform-gates-report.v1`
- Gate Record Contract: `xtend.epic10.platform-gate.record.v1`
- Workpackage: `WP-E10-15`
- Modul: `catalog/epic10-platform-gates.js`
- Suite: `tests/platform/epic10_platform_gates_suite.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic10-platform-gates --json`
- Package Script: `npm run test:epic10-platform-gates`

## Ziel

`WP-E10-15` buendelt die Epic-10-Plattformregeln in eine gatebare Kette. Die Aufgabe ist nicht, bestehende Einzelgates zu duplizieren, sondern ihre Rolle fuer TypeScript-first Komponenten, RMT-first Apps, Existing Component Metadata, Browser-Smokes, A11y, Performance und Visual Regression verbindlich zu machen.

Der Contract bleibt bewusst host-neutral:

- RMT bleibt Scheduler, Template Engine und App-DSL.
- XTend wird ueber `xtend.component` Adapter, Metadata und Fabric-Lanes First-Class Citizen.
- Der RMT-Kernel importiert keine XTend-Klassen oder XTend-Typen.
- Die Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Gate-Domains

| Domain | Zweck | Primaerer Gate |
|--------|-------|----------------|
| `component-contract` | Component Contract v2 und Existing Metadata pruefen | `component-contract-v2`, `existing-component-metadata` |
| `rmt-first-app` | RMT-first App Shell, Routen, Templates und Schedules pruefen | `rmt-first-demo-app` |
| `browser-smoke` | lokale Browser-nahe Fixtures pruefen | `browser` |
| `a11y` | Keyboard, Screenreader, Reduced Motion und Contrast pruefen | `a11y-hydration`, `screenreader-signals`, `motion-contrast` |
| `performance` | Measurements, Regression und Hydration Policies pruefen | `fabric-performance-measurements`, `performance-regression`, `hydration-policy` |
| `visual-browser-regression` | Viewports, Theme-Varianten, Browser-Smokes und Visual States priorisieren | `regression-priority` |
| `ci-handoff` | Fast-PR- und Release-Gate-Komposition pruefbar halten | `epic10-platform-gates` |

## Fast PR Gate

Der Fast PR Gate ist fuer lokale und spaetere CI-Ausfuehrung gedacht. Er laesst release-only Performance-Regression bewusst aus, enthaelt aber Browser-, A11y- und Visual-Prioritaetsregeln:

```bash
node scripts/run_xtend_tests.js component-contract-v2 epic10-p0-component-wave component-lab-rmt-inspector rmt-first-demo-app existing-component-metadata browser a11y-hydration screenreader-signals motion-contrast regression-priority references --json
```

`npm run test:pr` fuehrt dieselbe Linie zusammen mit Core-, Fabric-, Security- und Docs-RMT-Gates aus.

## Release Gate

Der Release Gate nimmt die release-only Performance-Kette hinzu:

- `fabric-performance-measurements`
- `performance-regression`
- `hydration-policy`

Der vollstaendige lokale Release-Pfad bleibt:

```bash
node scripts/run_xtend_tests.js --json
npm run test:release:full
```

## Browser-Gates

Die Browser-nahe Gate-Linie umfasst:

- `tests/browser/fixtures/custom-elements-smoke.html`
- `tests/browser/fixtures/core-flows-smoke.html`
- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`

Alle Fixtures laufen lokal. CDN-Ladungen sind in dieser Linie nicht erlaubt.

## A11y-Gates

Epic 10 macht A11y zu einem Pflichtbestandteil der Component Platform:

- `a11y-hydration` prueft Labels, Keyboard, Fokus und hydration-sichere A11y-Signale.
- `screenreader-signals` prueft `aria-live`, Statusregionen, Errorregionen und Announcements.
- `motion-contrast` prueft Reduced Motion, Forced Colors und Nicht-Farbstatus.

Neue und migrierte Komponenten muessen diese Erwartungen ueber Component Contract v2, RMT Metadata oder Existing Metadata sichtbar machen.

## Performance-Gates

Die Performance-Kette bleibt release-only, damit Fast PRs nicht unnoetig schwer werden:

- Fabric Measurements liefern die Messpunkte.
- Performance Regression wertet lokale deterministische Baselines aus.
- Hydration Policies sichern `visible`, `idle` und `lazy` gegen RMT Schedule Delegation ab.

## Visual- und Browser-Regression

Die Priorisierung stammt aus `xtend.catalog.component-regression-priority-plan.v1`. Epic 10 erweitert diese Linie um:

- `desktop-1280`
- `mobile-390`
- `light`
- `dark`
- `forced-colors`
- `reduced-motion`

Damit werden die neun TypeScript-first Komponenten und die neun Existing-Metadata-Zielkomponenten gemeinsam in Browser- und Visual-Regression sichtbar.

## Handoff

`WP-E10-15` gab an `WP-E10-16` weiter. Nach Abschluss von `WP-E10-16` ist `epic10-release-handoff` als Abschlussgate Teil der Fast-PR-/Release-Handoff-Sicht, waehrend dieses Dokument die urspruengliche Platform-Gate-Kette als `xtend.epic10.platform-gates.v1` stabil haelt.
