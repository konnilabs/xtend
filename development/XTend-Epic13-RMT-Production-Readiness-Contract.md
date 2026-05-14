# XTend Epic 13 RMT Production Readiness Contract

- Contract: `xtend.epic13.rmt-production-readiness.v1`
- Report: `xtend.epic13.rmt-production-readiness-report.v1`
- Workpackage: `WP-E13-09`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json`
- Package Script: `npm run test:epic13-rmt-production-readiness`
- Publish Boundary: `private-until-release-owner-acceptance`

## Ziel

`WP-E13-09` friert den RMT-first App-Pfad als RC1-Readiness-Buendel ein. Das Paket erzeugt keinen neuen Kernel-Scope, sondern buendelt vorhandene Source Gates so, dass RMT-first XTend Apps als produktionsnaher App-Pfad reviewbar werden.

## Gebuendelte Source Contracts

| Bereich | Contract / Gate |
| --- | --- |
| App Authoring | `xtend.rmt.first-class-app-authoring.v1` |
| Demo-App | `xtend.epic10.rmt-first-demo-app.v1` |
| Artifact Parity | `xtend.rmt.artifact-parity.v1` |
| Fabric/Lane | `xtend.component.fabric-lane-ingestion.v2` |
| Lifecycle Telemetry | `xtend.component.lifecycle-telemetry.v1` |
| Visual Owner Artifact | `xtend.epic13.visual-owner-artifact.v1` |

## Pflicht-Gates

```bash
npm run test:rmt-compatibility
npm run test:rmt-first-class-app
npm run test:rmt-first-demo-app
npm run test:rmt-artifact-parity
npm run test:rmt-component-fabric-ingestion
npm run test:rmt-component-lifecycle-telemetry
npm run test:epic13-visual-owner-artifact
node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json
```

## Readiness Domains

- `app-shell`
- `routing`
- `components`
- `fabric`
- `lanes`
- `diagnostics`
- `artifact-parity`
- `kernel-boundary`

Alle Domains muessen durch Evidence Records in `catalog/epic13-rmt-production-readiness.js` abgedeckt sein.

## Kernel Boundary

Die Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

RMT besitzt:

- App Shell Records
- Routen
- Templates
- Schedules
- Adapter Metadata
- Diagnostics Records

XTend besitzt:

- Custom Elements
- Manifest Lookup
- Component-Ausfuehrung
- XRouter-Registrierung
- Fabric-Ausfuehrung
- DOM-Materialisierung

## Akzeptanz

- RMT-first App Shell ist Shell-first und ohne manuelle Host-Shell nachweisbar.
- Routing wird aus RMT Records abgeleitet.
- XTend-Komponenten werden als `xtend.component` Records beschrieben.
- XRouter wird als `xtend.xrouter` Adapter beschrieben.
- Fabric/Lane- und Lifecycle-Telemetry-Signale sind durch Gates abgedeckt.
- XTendRMT Artifact Parity bleibt aktiv.
- Lokaler Gate ist statisch, offline und ohne externen Browser lauffaehig.
- Publish bleibt blockiert.

## Handoff

`WP-E13-09` ist abgeschlossen. `WP-E13-10` hat `xtend.epic13.docs-rmt-production-hardening.v1` nachgezogen; `WP-E13-11` hat `xtend.epic13.trusted-dom-boundary.v1` abgeschlossen; `WP-E13-12` hat `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` hat `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen und uebergibt an `WP-E13-14`.
