# Hydration Policies

- Docs Contract: `xtend.docs.hydration-policies.v1`
- Policy Contract: `xtend.fabric.hydration-policy.v1`
- Decision Contract: `xtend.fabric.hydration-decision.v1`
- Seit: `ER-WP-20`

XTend behandelt Hydration als planbare UI-Arbeit. Komponenten koennen sichtbar, idle oder lazy hydratisiert werden, ohne dass RMT XTend-Komponenten kennen muss.

## Policies

| Policy | Wann | Lane | Schedule |
|--------|------|------|----------|
| `visible` | Komponente ist sichtbar, fokus-kritisch oder explizit kritisch | `visible` | `component.visible.hydrate` |
| `idle` | nicht-kritische Default-Hydration | `idle` | `component.idle.hydrate` |
| `lazy` | `loading="lazy"`, nicht sichtbar, unterhalb des Fold oder bei Backpressure | `idle` | `component.lazy.hydrate` |

Hydration verwendet keine `user-blocking` Lane. Fokus-, Eingabe- oder A11y-Arbeit muss ueber eigene Fibers laufen.

## Verwendung

```js
const decision = window.XTendFabricHydrationPolicy.resolveHydrationPolicy({
  componentRef: 'x-gallery',
  loading: 'lazy',
  isVisible: false
});

console.log(decision.scheduleRef);
```

Mit Component-Fiber-Instrumentierung:

```js
const fabric = window.XTendFabric.createXtendFabric();
const instrumentation = fabric.createComponentFiberInstrumentation('x-gallery');
const controller = window.XTendFabricHydrationPolicy.createHydrationPolicyController('x-gallery', {
  loading: 'lazy'
});

await controller.hydrate(instrumentation, (fiber) => hydrateGallery(fiber));
```

## RMT Delegation

RMT sieht nur Schedule-Records:

- `component.visible.hydrate`
- `component.idle.hydrate`
- `component.lazy.hydrate`

Der Endpoint bleibt `xtendrmt.component.hydrate`. Die Ausfuehrung liegt in Fabric oder im Host-Adapter.

## Gates

```bash
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:hydration-policy
```

Das Gate prueft:

- Policy-Auswahl fuer `visible`, `idle`, `lazy`
- Backpressure-Deferral
- Verweigerung von `user-blocking` fuer nicht sichtbare Hydration
- RMT Schedule Delegation
- Integration mit `createComponentFiberInstrumentation`

## Handoff

`ER-WP-21` dokumentiert daraus die praktischen Performance-Regeln fuer Komponentenautoren in [Performance fuer Komponentenautoren](./performance.md).
