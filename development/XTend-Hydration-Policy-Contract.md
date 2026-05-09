# XTend Hydration Policy Contract

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.hydration-policy.v1`
- Decision Contract: `xtend.fabric.hydration-decision.v1`
- Fiber Contract: `xtend.fabric.fiber.v1`
- RMT Lane Mapping Contract: `xtend.fabric.rmt-lane-mapping.v1`
- Performance Regression Contract: `xtend.performance.regression-gate.v1`
- Roadmap-Paket: `ER-WP-20`
- Runtime:
  - `fabric/hydration-policy.js`
  - `fabric/rmt-lane-mapping.js`
  - `fabric/xtend-fabric.js`
- Test-Gate: `tests/performance/hydration_policy_suite.js`

## Zweck

XTend trennt Hydration-Entscheidungen ab `ER-WP-20` explizit von Component-Code. Hosts und Adapter koennen sichtbar, idle oder lazy hydratisieren, ohne RMT zu importieren und ohne nicht sichtbare Arbeit auf `user-blocking` zu schieben.

## Policies

| Policy | Trigger | Fabric-Lane | RMT Schedule | Wirkung |
|--------|---------|--------------|--------------|---------|
| `visible` | `immediate-visible` | `visible` | `component.visible.hydrate` | sichtbare oder fokus-kritische Component direkt hydratisieren |
| `idle` | `idle-callback` | `idle` | `component.idle.hydrate` | nicht-kritische Hydration in Idle-Lane planen |
| `lazy` | `visible-or-idle` | `idle` | `component.lazy.hydrate` | unterhalb des Fold oder bei Backpressure erst bei Sichtbarkeit/Idle hydratisieren |

`user-blocking` ist fuer Component-Hydration nicht erlaubt. Kritische Eingaben, Fokus und A11y laufen ueber eigene Fibers; Hydration selbst bleibt `visible`, `idle` oder lazy-idle.

## Entscheidung

`resolveHydrationPolicy(options)` erzeugt:

```js
{
  schema: 'xtend.fabric.hydration-decision.v1',
  policyContract: 'xtend.fabric.hydration-policy.v1',
  policy: 'lazy',
  lane: 'idle',
  rmtLane: 'idle',
  scheduleRef: 'component.lazy.hydrate',
  endpointNameHint: 'xtendrmt.component.hydrate',
  preferIdle: true,
  fiberInput: {
    kind: 'component.hydrate',
    lane: 'idle',
    scheduleRef: 'component.lazy.hydrate'
  }
}
```

Auswahlregeln:

- `visible`: `isVisible`, `visible`, `focusRequired`, `critical` oder `a11yRepair`
- `lazy`: `loading: "lazy"`, `lazy`, `deferUntilVisible`, `isVisible: false`, `visible: false`
- `idle`: Default fuer nicht-kritische Hydration
- `high` oder `critical` Backpressure verschiebt neutrale Hydration nach `lazy`

## RMT-Grenze

RMT erhaelt nur Schedule-Records:

- `component.visible.hydrate`
- `component.idle.hydrate`
- `component.lazy.hydrate`

Die Ausfuehrung bleibt in Fabric oder Host-Adaptern. RMT sieht `endpointName`, `lane`, `deadlineMs`, `preferIdle` und `coalesceKey`, aber keine XTend-Komponenteninstanzen.

## Performance-Grenze

Die Policy baut auf `xtend.performance.measurement.v1` und dem lokalen Performance Regression Gate auf. Budget-Fails aus `ER-WP-19` sind ab `ER-WP-21` in `docs/performance.md` als Autorenregeln dokumentiert und koennen spaeter in CI-Gates gestaffelt werden.

## Verifikation

```bash
node --check fabric/hydration-policy.js
node --check tests/performance/hydration_policy_suite.js
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:hydration-policy
```

## Ergebnis

XTend besitzt mit `xtend.fabric.hydration-policy.v1` einen expliziten Lazy/Idle/Visible Hydration Contract. Nicht sichtbare Komponenten blockieren keine user-blocking Lane, und RMT kann Hydration als Schedule-Policy delegieren, ohne XTend einzubetten.
