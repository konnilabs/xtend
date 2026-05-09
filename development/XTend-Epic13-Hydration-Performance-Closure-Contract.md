# XTend Epic 13 Hydration Performance Closure Contract

- Schema: `xtend.epic13.hydration-performance-closure.v1`
- Decision Schema: `xtend.epic13.hydration-performance-decision.v1`
- Report Schema: `xtend.epic13.hydration-performance-closure-report.v1`
- Workpackage: `WP-E13-06`
- Status: `accepted-hydration-performance-closure`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

`WP-E13-06` schliesst den aus `WP-E13-05` uebernommenen Watchpoint `xtend.component.hydrate`. Die Schliessung erfolgt owner-frei, weil der lokale RC1-Baseline-Sample unter dem bestehenden 32ms-Budget liegt. Das Budget wurde nicht angehoben.

## Entscheidung

| Scope | Vorher | Jetzt | Budget | Entscheidung |
|-------|--------|-------|--------|--------------|
| `xtend.component.hydrate` | `36ms / 32ms`, `warn-not-fail` | `31ms / 32ms`, `pass` | `kept-existing-budget` | `owner-free-closure` |

## Source Gates

```bash
npm run test:performance
npm run test:hydration-policy
npm run test:fabric-performance
npm run test:epic13-known-residual-triage
node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json
```

## Regeln

- `xtend.component.hydrate` bleibt an das bestehende Fabric-Budget `32ms` gebunden (`kept-existing-budget`).
- Baseline-Kalibrierung darf Budgetgrenzen nicht lockern.
- Das Performance Regression Gate muss `warnCount === 0` und `failCount === 0` fuer die lokale RC1-Baseline melden.
- Die Failure-Fixture im Performance Gate bleibt erhalten und muss echte Budgetverletzungen weiterhin hart failen.
- `private: true` und `private-until-release-owner-acceptance` bleiben unveraendert.

## Handoff

`WP-E13-06` hat die Grundlage fuer `WP-E13-07` geschaffen. `WP-E13-07` hat die PROD-nahen Browser-, Local-Server- und CSP-Smokes vorbereitet; `WP-E13-08` ist nun ready.
