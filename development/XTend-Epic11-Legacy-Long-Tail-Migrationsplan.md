# XTend Epic 11 Legacy Long-Tail Migrationsplan

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic11.legacy-long-tail-migration.v1`
- Entry Contract: `xtend.epic11.legacy-long-tail-migration-entry.v1`
- Gate Contract: `xtend.epic11.legacy-long-tail-migration-gate.v1`
- Workpackage: `WP-E11-17`
- Strategie: `incremental-no-big-bang`
- RMT-Grenze: `no-rmt-kernel-import-of-xtend-types`
- Bezug:
  - `catalog/component-long-tail-migration.js`
  - `tests/catalog/component_long_tail_migration_suite.js`
  - `catalog/component-catalog-coverage.js`
  - `catalog/component-regression-priority.js`
  - `development/XTend-Component-UX-Authoring-Guides.md`
  - `development/XTend-Epic11-Browsernahe-UX-Smoke-Matrix.md`
  - `development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md`
  - `docs/en/component-long-tail-migration.md`

## Zweck

`WP-E11-17` schneidet die Legacy-Long-Tail-Migration so, dass Epic 11 ohne Big-Bang-Refactor abnahmefaehig bleibt. Die bereits `enterprise-ready` Komponenten bleiben stabil, waehrend die restlichen Manifest-Eintraege gegen Shell, Styling, Runtime-A11y, Performance, Component Network, RMT Authoring, Browser-Smokes und Theme-Matrix priorisiert werden.

Der Plan leitet sich aus zwei bestehenden Quellen ab:

- `xtend.catalog.component-coverage-matrix.v1` fuer aktuelle Coverage-Luecken
- `xtend.catalog.component-regression-priority-plan.v1` fuer Browser-, Visual-, Theme- und Performance-Prioritaeten

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
npm run test:component-long-tail-migration
```

Der Gate validiert den maschinenlesbaren Plan, die nach `WP-E12-09` zwei offenen Boundary-Profilentscheidungen, die Migrationswellen, die Nicht-Big-Bang-Strategie, die RMT-Grenze und den Handoff auf `WP-E11-18`.

## Scope

Der Long Tail nach `WP-E12-09` besteht aus drei offenen Boundary-Profilentscheidungen. `x-tabs` ist als P0-Performance-Restpunkt geschlossen, `x-theme` ist als Theme-/Density-/Propagation-Provider `enterprise-ready`, `x-button` ist als interaktiver Grundbaustein mit Performance-/Interaction-Budget `enterprise-ready`, `x-menu` ist als Navigation-/Interaction-Baustein mit Performance-, Keyboard- und Router-Kompatibilitaet `enterprise-ready`, `xstate` besitzt Suite, Fixture, Public Types, Lifecycle Events, Fabric Diagnostics und RMT State Adapter, `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types, und `xtend-i18n` besitzt lokalisierte Docs, Component-Suite, Fixture und Public Types:

| Tag | Aktueller Status | Prioritaet | Ziel |
|-----|------------------|------------|------|
| `xstate` | `contract-gated` | `P1` | `ux-baseline-probe` |
| `x-utils` | `typed-contract-gated` | `P2` | `ux-baseline-probe` |
| `xtend-i18n` | `typed-contract-gated` | `P2` | `ux-baseline-probe` |

`xstate`, `x-utils` und `xtend-i18n` sind bewusst keine klassischen Visual-Shell-Komponenten. Sie erhalten deshalb Integration-Probes und Adapter-Boundary-Regeln statt erzwungener Component-Shell-Rewrites.

## Migrationswellen

| Wave | Komponenten | Ziel |
|------|-------------|------|
| `wave-1-p0-routing-interaction` | geschlossen: `x-tabs` | P0-Performance-Profil, Browser-Smoke und Theme-Matrix abgeschlossen |
| `wave-2-p1-theme-and-interaction` | geschlossen: `x-theme`, `x-button`, `x-menu` | Theme-, Button- und Menu-Haertung sind abgeschlossen |
| `wave-3-infrastructure-and-utility-probes` | `xstate`, `x-utils`, `xtend-i18n` | Infrastruktur- und Utility-Grenzen mit Suites, Types und Integration-Probes absichern; offene Profilentscheidungen sichtbar halten |

## Migrationsmatrix

| Tag | Wave | Current | Target | Missing | Actions |
|-----|------|---------|--------|---------|---------|
| `xstate` | `wave-3-infrastructure-and-utility-probes` | `contract-gated` | `ux-baseline-probe` | `a11y, performance` | `runtime-a11y-profile, performance-profile, non-custom-element-integration-probe` |
| `x-utils` | `wave-3-infrastructure-and-utility-probes` | `typed-contract-gated` | `ux-baseline-probe` | `performance` | `performance-profile, non-custom-element-integration-probe` |
| `xtend-i18n` | `wave-3-infrastructure-and-utility-probes` | `typed-contract-gated` | `ux-baseline-probe` | `performance` | `performance-profile, non-custom-element-integration-probe` |

## Abnahmeregeln

- `x-tabs` hat das Performance-Profil in `WP-E12-02` erhalten; die Browser-Smoke- und Theme-Matrix-Haertung ist in `WP-E12-03` abgeschlossen.
- `x-menu` erreicht seit `WP-E12-07` `enterprise-ready` und ist nicht mehr Teil des offenen Long-Tail-Plans.
- `x-theme` besitzt seit `WP-E12-05` eine Runtime-A11y-, Performance-, Density- und Theme-Propagation-Oberflaeche und ist nicht mehr Teil des offenen Long-Tail-Plans.
- `x-button` besitzt seit `WP-E12-06` Performance Profile, Interaction Budget, Fabric Measurements und RMT-Metadaten und ist nicht mehr Teil des offenen Long-Tail-Plans.
- `x-menu` besitzt seit `WP-E12-07` Performance Profile, Keyboard Navigation, Router-Kompatibilitaet, Fabric Measurements und RMT-Metadaten und ist nicht mehr Teil des offenen Long-Tail-Plans.
- `xstate` besitzt seit `WP-E12-08` Public Types, Component-Level-Suite, Fixture, Lifecycle Events, Fabric Diagnostics und RMT State Adapter; offen bleiben A11y-/Performance-Boundary-Entscheidungen.
- `x-utils` besitzt seit `WP-E12-09` Public Types, Component-Level-Suite, Fixture, Utility Contract und Import Policy; offen bleibt die Performance-Boundary-Entscheidung.
- `xtend-i18n` besitzt seit WP-RMO-02 lokalisierte Docs, Component-Level-Suite, Fixture und Public Types; offen bleibt die Performance-Boundary-Entscheidung.
- `xstate`, `x-utils` und `xtend-i18n` bleiben host-neutrale Hilfs-/Infrastrukturgrenzen; ihre Abnahme erfolgt ueber Integration-Probes, Public Types, Component-Level-Suites und Performance-/A11y-Metadaten.
- RMT bekommt keine harte XTend-Kernelkopplung. Alle RMT-Bezuege bleiben Adapterdaten.

## Handoff

`WP-E11-18` ist abgeschlossen. Der Enterprise UX Handoff bewertet Epic-11-KPIs, Restrisiken, Release Readiness und die naechste Produktwelle im Modus `completed-with-accepted-long-tail-handoff`.
