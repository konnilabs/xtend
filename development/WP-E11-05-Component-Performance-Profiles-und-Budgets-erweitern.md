# WP-E11-05 - Component Performance Profiles und Budgets erweitern

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Backlog: `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
- Workpackage Contract: `xtend.epic11.wp05.component-ux-performance-contract.v1`
- Zielcontract: `xtend.component.ux-performance.v1`
- Report: `xtend.component.ux-performance-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-ux-performance --json`

## Ziel

`WP-E11-05` macht Performance-by-design fuer Epic 11 gatebar. Die vorhandene Budget-Matrix, der Scaffold-Performance-Generator, Fabric Measurements, Regression-Gate und Hydration-Policy bleiben bestehen; dieses Paket verbindet sie zu einem Component-UX-Performance-Contract fuer Enterprise-Komponenten.

## Scope

- Shell-Mount, Hydration, Render, Update und Event-Budgets
- Profile fuer `display`, `interactive`, `form`, `feedback`, `overlay`, `routing`, `media`, `stateful` und `theme`
- Budgetklassen `critical`, `interactive`, `background`, `diagnostics` und `best_effort`
- Fabric-Lanes `user-blocking`, `a11y`, `transition`, `visible`, `idle`, `background` und `diagnostics`
- Hydration Policies `visible`, `idle`, `lazy` und `visible-or-idle`
- RMT Performance Authoring ohne XTend-Kernelkopplung
- Backpressure-Regeln fuer nicht sichtbare Arbeit
- lokale Suite und PR-Gate-Anschluss

## Artefakte

| Artefakt | Status | Zweck |
|----------|--------|-------|
| `development/XTend-Component-UX-Performance-Profile.md` | completed | akzeptierter Contract `xtend.component.ux-performance.v1` |
| `xtend-builder/performance/component-ux-performance-contract.js` | completed | Factory, Validator und stabile Konstanten |
| `tests/performance/component_ux_performance_contract_suite.js` | completed | lokaler Gate `component-ux-performance` |
| `package.json` | completed | Export, Metadata, Script und PR-Fast-Gate |
| `xtend-builder/scaffold.config.js` | completed | Scaffold-Registry fuer Component UX Performance |
| `scripts/run_xtend_tests.js` | completed | Suite-Entry `component-ux-performance` |

## Entscheidungen

### Contract-Schema

Der akzeptierte Contract lautet:

```text
xtend.component.ux-performance.v1
```

Er erweitert nicht die Runtime, sondern fasst bestehende Performance-Bausteine als Component-UX-Pflicht zusammen.

### Keine neue Performance-Parallelwelt

`xtend.performance.component-profile.v1` bleibt der Scaffold-nahe Profilgenerator. `xtend.component.ux-performance.v1` ist die Epic-11-Produktoberflaeche darueber. Damit werden vorhandene ER-Gates wiederverwendet statt dupliziert.

### RMT bleibt host-neutral

Der RMT-Handoff lautet:

```text
xtend.rmt.performance-authoring.v1
```

Die Kernel-Grenze bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

### Performance wird UX-Dimension

Performance ist fuer Epic 11 nicht nur ein CI-Budget. Sie begrenzt UX-Reife fuer:

- sichtbare Shells
- Hydration
- Interaktionen
- Overlays
- Forms
- Routing
- A11y-Announcements
- Theme- und Styling-Updates

## Definition of Done

- [x] Contract-Dokument liegt vor
- [x] Factory und Validator liegen vor
- [x] Package-Export und Package-Metadata liegen vor
- [x] Scaffold-Registry kennt den Contract
- [x] Runner kennt `component-ux-performance`
- [x] lokaler Gate ist ausfuehrbar
- [x] Epic 11 markiert `WP-E11-05` als `completed`
- [x] Backlog markiert `WP-E11-05` als `completed`
- [x] Referenzpfad-Gate kennt die neuen Artefakte
- [x] `WP-E11-06` bleibt startbar

## Verifikation

```bash
node --check xtend-builder/performance/component-ux-performance-contract.js
node --check tests/performance/component_ux_performance_contract_suite.js
node scripts/run_xtend_tests.js component-ux-performance --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js --json
```

## Handoff

Nach `WP-E11-05` ist `WP-E11-06` das verbleibende Foundation-Paket vor `WP-E11-07`.

`WP-E11-06` soll die hier definierten Budget-, Lane-, Hydration- und Backpressure-Regeln im Component Network fuer Forms, Overlays, Router und Feedback nutzen.
