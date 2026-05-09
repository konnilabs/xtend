# ER-WP-20 - Lazy/Idle/Visible Hydration Policies haerten

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-20.hydration-policy.v1`
- Policy Contract: `xtend.fabric.hydration-policy.v1`
- Decision Contract: `xtend.fabric.hydration-decision.v1`
- Bezug:
  - `development/XTend-Hydration-Policy-Contract.md`
  - `development/XTend-Performance-Regression-Gate.md`
  - `fabric/hydration-policy.js`
  - `fabric/rmt-lane-mapping.js`
  - `tests/performance/hydration_policy_suite.js`
  - `docs/hydration-policies.md`

## Ziel

`ER-WP-20` haertet Hydration als geplante UI-Arbeit. Sichtbare Hydration darf sofort laufen, nicht sichtbare Hydration muss idle/lazy planbar sein, und RMT darf nur Schedule-Policies sehen.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `fabric/hydration-policy.js` | completed | Policy-Modul fuer `visible`, `idle`, `lazy`, Decisions und Fiber Inputs |
| `fabric/rmt-lane-mapping.js` | completed | Schedule `component.lazy.hydrate` ergaenzt |
| `tests/performance/hydration_policy_suite.js` | completed | Gate fuer Policy-Auswahl, User-Blocking-Guard, RMT Delegation und Instrumentation |
| `development/XTend-Hydration-Policy-Contract.md` | completed | Hydration Contract dokumentiert |
| `docs/hydration-policies.md` | completed | Entwicklerdokumentation ergaenzt |
| `package.json` | completed | Export `./fabric/hydration-policy` und `npm run test:hydration-policy` |

## Policy-Ergebnis

| Policy | Lane | ScheduleRef | Zweck |
|--------|------|-------------|-------|
| `visible` | `visible` | `component.visible.hydrate` | sichtbare/fokus-kritische Hydration |
| `idle` | `idle` | `component.idle.hydrate` | Default fuer nicht-kritische Hydration |
| `lazy` | `idle` | `component.lazy.hydrate` | nicht sichtbare oder bei Backpressure verschobene Hydration |

Nicht sichtbare Hydration verweigert `user-blocking` und faellt auf `idle` zurueck.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| visible hydration ist explizit | erfuellt |
| idle hydration ist explizit | erfuellt |
| lazy hydration ist explizit | erfuellt |
| RMT Schedule Delegation ist vorbereitet | erfuellt |
| nicht sichtbare Komponenten blockieren keine `user-blocking` Lane | erfuellt |
| Gate ist lokal und deterministisch | erfuellt |

## Verifikation

```bash
node --check fabric/hydration-policy.js
node --check tests/performance/hydration_policy_suite.js
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:hydration-policy
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-20 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-21` | completed | Component-Autorenregeln fuer Hydration, DOM, Layout und Events sind in `docs/performance.md` dokumentiert |
| `ER-WP-37` | completed | Gate-Matrix laesst `hydration-policy` im Full-Release-Gate und haelt PR-Fast bewusst schlank |
| `ER-WP-38` | completed | Release Checklist ordnet Hydration Policy als Release-Pflicht ein |
| `ER-WP-39` | completed | Enterprise Adoption Guide erklaert Hydration Policies fuer Teams |
| `ER-WP-40` | completed | Docs-App RMT Pilot verwendet Hydration Policies praktisch |

## Ergebnis

`ER-WP-20` ist abgeschlossen. XTend besitzt jetzt einen expliziten Lazy/Idle/Visible Hydration Policy Contract, eine lokale Gate-Suite und RMT-kompatible Schedule Delegation ohne Kernel-Import.
