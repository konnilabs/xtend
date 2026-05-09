# WP-E12-05 - x-theme Performance, Theme Propagation und Density Boundary finalisieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Backlog: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- Contract: `xtend.epic12.wp05.xtheme-performance-propagation-density.v1`
- Bezug:
  - `components/xtheme.js`
  - `components/xtheme.d.ts`
  - `docs/components/xtheme.md`
  - `tests/components/xtheme.component_suite.js`
  - `tests/components/fixtures/xtheme.component.html`
  - `catalog/component-catalog-coverage.js`
  - `catalog/component-long-tail-migration.js`
  - `catalog/component-regression-priority.js`

## Ziel

`WP-E12-05` schliesst die Performance-Restdimension von `x-theme` und hebt das Modul auf `enterprise-ready`. `x-theme` bleibt ein framework-neutraler Provider: XTend-Komponenten, Fabric, XRouter und RMT Shell Authoring lesen Theme-, Density-, Preference- und Performance-Kontext ueber Events, `xstate` und Metadaten, nicht ueber harte Kernel-Imports.

## Runtime-Haertung

`components/xtheme.js` wurde erweitert:

| Bereich | Umsetzung |
|---------|-----------|
| Performance Profile | `xtendScaffoldPerformanceProfile` mit `xtend.performance.component-profile.v1` |
| Messpunkte | `xtend.theme.initialize`, `xtend.theme.apply`, `xtend.theme.propagate`, `xtend.theme.density`, `xtend.theme.external-css` |
| Density Boundary | `setDensity()`, `getDensity()`, `getAvailableDensities()` und `data-xtend-density` |
| Density Tokens | `--xtend-density-scale`, `--xtend-density-spacing`, `--xtend-control-height`, `--xtend-font-scale` |
| Theme Context | `getThemeContext()` mit `xtend.theme.context.v1` |
| Fabric Diagnostics | `snapshotPerformance()` und Event `theme-performance-measured` |
| Component Network | `xtendComponentNetworkContract` mit `xtend.component.network.v1` |
| RMT Metadata | `xtendRmtMetadata` mit `xtend.rmt.component-contract.v1` und Shell Authoring Metadata |

Der Theme-Kontext wird bei Theme-, Density-, Preference-, Registry- und externen CSS-Aenderungen in `xstate` gespiegelt:

- `xtend.theme.density`
- `xtend.theme.context`
- `xtend.theme.performanceProfile`
- `xtend.theme.performanceSnapshot`
- `xtend.theme.rmtMetadata`
- `xtend.theme.componentNetwork`

## Public Types und Fixture

`components/xtheme.d.ts` beschreibt nun Density, Performance Profile, RMT Metadata, Component Network Context, Theme Context, Performance Measurements, Performance Snapshots und die neuen Events:

- `theme-density-changed`
- `theme-context-changed`
- `theme-performance-measured`

Die Fixture `tests/components/fixtures/xtheme.component.html` prueft lokal:

- Density Propagation via `setDensity('compact')`
- Theme Context Snapshot via `getThemeContext()`
- Fabric-/Performance Snapshot via `snapshotPerformance()`
- RMT Metadata via `getRmtMetadata()`
- Component Network Contract via `getComponentNetworkContext()`

## Katalog-Fortschreibung

Nach diesem Paket gilt:

- `x-theme` verliert die Restdimension `performance`.
- `x-theme` wechselt von `typed-contract-gated` zu `enterprise-ready`.
- Die Performance-Coverage steigt auf `33/37`.
- Die offenen Performance-Restpunkte sinken auf `4`: `xstate`, `x-button`, `x-menu` und `x-utils`.
- `component-long-tail-migration` entfernt `x-theme` aus den offenen Restpunkten.
- `regression-priority` entfernt `performance-profile-authoring` fuer `x-theme`.

## Grenzen

- Keine visuelle Shell fuer `x-theme`.
- Keine harte Kopplung zwischen XTend und XTendRMT.
- Keine Netzwerk- oder CDN-Pfade fuer lokale Tests.
- Kein Snapshot-Runner in diesem Paket; `WP-E12-10`/`WP-E12-11` bleiben dafuer vorgesehen.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `x-theme` besitzt ein explizites Performance Profile | erfuellt |
| Theme-/Density-Kontext wird propagiert | erfuellt |
| Fabric Diagnostics fuer Theme-Wechsel sind vorhanden | erfuellt |
| RMT Shell Authoring Metadata bleibt Adapterdaten | erfuellt |
| `catalog-coverage` markiert `x-theme` als `enterprise-ready` | erfuellt |
| `component-long-tail-migration` entfernt `x-theme` | erfuellt |
| `WP-E12-06` startbar | erfuellt |

## Verifikation

```bash
node --check components/xtheme.js
node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority --json
```

## Ergebnis

`WP-E12-05` ist abgeschlossen. `x-theme` ist nun Runtime-, A11y-, Performance-, Density-, RMT- und Component-Network-seitig `enterprise-ready`. Der naechste primaere Epic-12-Pfad ist `WP-E12-06`.
