# Component Long-Tail Migration

- Contract: `xtend.docs.component-long-tail-migration.v1`
- Plan Contract: `xtend.epic11.legacy-long-tail-migration.v1`
- Gate Contract: `xtend.epic11.legacy-long-tail-migration-gate.v1`
- Workpackage: `WP-E11-17`

Diese Seite beschreibt, wie XTend die letzten nicht vollstaendig `enterprise-ready` Komponenten nach Epic 11 behandelt. Der Plan ist bewusst inkrementell: sichtbare Custom Elements werden gegen Shell, Styling, A11y, Performance, Browser-Smokes und Theme-Matrix gehaertet; Infrastruktur- und Utility-Module erhalten Integration-Probes statt kuenstlicher UI-Shells.

Fortschreibung nach `WP-E12-09`: `x-tabs` besitzt ein explizites Performance-Profil und ist nicht mehr Teil des offenen Long-Tail-Plans. `x-theme` besitzt A11y-, Reduced-Motion-, Forced-Colors-, Performance-, Theme-Propagation- und Density-Coverage. `x-button` besitzt Performance-, Interaction-Budget-, Fabric-Measurement- und RMT-Metadaten. `x-menu` besitzt Performance-, Keyboard-, Routing-, Fabric- und RMT-Metadaten. `xstate` besitzt Suite, Fixture, Public Types, Lifecycle Events, Fabric Diagnostics und RMT State Adapter. `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types. Offen bleiben `xstate` als A11y-/Performance-Boundary-Probe und `x-utils` als Performance-Boundary-Entscheidung.

## Lokal pruefen

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
npm run test:component-long-tail-migration
```

## Migrationswellen

| Wave | Komponenten | Ziel |
|------|-------------|------|
| `wave-1-p0-routing-interaction` | geschlossen: `x-tabs` | Performance-Profil, Browser-Smoke und Theme-Matrix sind abgeschlossen |
| `wave-2-p1-theme-and-interaction` | geschlossen: `x-theme`, `x-button`, `x-menu` | Performance-, A11y-, Interaction- und Routing-Haertung sind abgeschlossen |
| `wave-3-infrastructure-and-utility-probes` | `xstate`, `x-utils` | Suite-, Fixture- und Type-Luecken sind geschlossen; offen bleiben Performance-/A11y-Boundary-Entscheidungen |

## Regeln fuer Komponentenautoren

- Keine Long-Tail-Komponente wird per Big-Bang auf TypeScript oder neue Shells umgeschrieben.
- Custom Elements muessen ihre fehlenden Profile zuerst in `components/*`, Docs, Types und Component-Suites nachziehen.
- Nicht-Custom-Elemente wie `xstate` und `x-utils` werden als Infrastruktur- oder Utility-Grenzen getestet.
- Browser-Smokes und Theme-Matrix sind nur Pflicht, wenn die Oberflaeche wirklich visuell oder interaktiv ist.
- RMT beschreibt weiterhin Adapterdaten; der Kernel importiert keine XTend-Typen.

## Quelle

Der Migrationsplan wird aus `catalog/component-catalog-coverage.js` und `catalog/component-regression-priority.js` erzeugt. Die akzeptierte Spezifikation liegt in `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`.

## RC0 Adoption Update

Seit `WP-E12-15` fasst der [RC0 Adoption Guide](./rc0-adoption-guide.md) diesen Long-Tail-Status als Migration Note fuer Component Authors und App Authors zusammen. Fuer RC0 gelten `xstate` und `x-utils` als bekannte, akzeptierte Residuals aus der Known Residual Policy; sie blockieren den lokalen RC0 Review nicht, oeffnen aber auch keine Publish Boundary.
