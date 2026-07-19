# XTend Fabric

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-fabric` is the XTend runtime layer for diagnostics, reporters, fibers, lifecycle boundaries, lane mapping, and hydration policy. It can run independently and does not require the RMT kernel to import XTend UI code.

### Installation

```bash
npm install @ccslabs/xtend-fabric
```

Node.js 24 or newer is required.

### Fabric runtime

```js
const { createXtendFabric } = require('@ccslabs/xtend-fabric');

const fabric = createXtendFabric();
fabric.emitDiagnostic({
  code: 'xtend.example.ready',
  message: 'Example is ready',
  source: 'example'
});

const value = fabric.runFiber({
  kind: 'component.render',
  scope: 'x-example#main',
  componentRef: 'x-example'
}, () => 'rendered');
```

Fabric normalizes and redacts diagnostics before dispatching them. Reporters are opt-in, `runFiber()` preserves caller return and error semantics, and lifecycle boundaries can provide explicit fallback behavior.

### Lane mapping and hydration

```js
const {
  createFabricRmtLaneMapping,
  resolveRmtScheduleForFiber
} = require('@ccslabs/xtend-fabric/rmt-lane-mapping');
const {
  createHydrationPolicyController,
  resolveHydrationPolicy
} = require('@ccslabs/xtend-fabric/hydration-policy');

const mapping = createFabricRmtLaneMapping();
const schedule = resolveRmtScheduleForFiber({ kind: 'component.hydrate' });
const policy = resolveHydrationPolicy({ policy: 'visible' });
const controller = createHydrationPolicyController('x-example');
```

Lane mapping translates Fabric work into RMT schedule records without transferring runtime ownership. Hydration policies select visible, idle, eager, or deferred behavior and expose reviewable decisions.

### Public entry points

- `@ccslabs/xtend-fabric`
- `@ccslabs/xtend-fabric/rmt-lane-mapping`
- `@ccslabs/xtend-fabric/hydration-policy`
- `@ccslabs/xtend-fabric/policy-types`

The browser runtime also exposes the bounded `window.XTendFabric` namespace when loaded directly.

### Runtime boundary

- Diagnostics are redacted before reporter publication.
- Reporters do not transmit data unless explicitly registered.
- Fabric consumes RMT diagnostics and schedule facts but does not execute remote code.
- XScaler-aware orchestration remains a protocol boundary rather than hidden network behavior.

### Verification

```bash
npm run test:fabric
npm run test:fabric-lanes
npm run test:hydration-policy
npm run test:scoped-package-readmes
```

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

[Back to top](#xtend-fabric) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-fabric` ist die XTend-Runtime-Schicht für Diagnosen, Reporter, Fibers, Lifecycle Boundaries, Lane Mapping und Hydration Policy. Sie kann unabhängig betrieben werden und verlangt nicht, dass der RMT-Kernel XTend-UI-Code importiert.

### Installation

```bash
npm install @ccslabs/xtend-fabric
```

Node.js 24 oder neuer wird benötigt.

### Fabric-Runtime

```js
const { createXtendFabric } = require('@ccslabs/xtend-fabric');

const fabric = createXtendFabric();
fabric.emitDiagnostic({
  code: 'xtend.example.ready',
  message: 'Example is ready',
  source: 'example'
});

const value = fabric.runFiber({
  kind: 'component.render',
  scope: 'x-example#main',
  componentRef: 'x-example'
}, () => 'rendered');
```

Fabric normalisiert und redigiert Diagnosen vor ihrer Ausgabe. Reporter sind Opt-in, `runFiber()` bewahrt Rückgabe- und Fehlersemantik des Aufrufers, und Lifecycle Boundaries können explizites Fallback-Verhalten bereitstellen.

### Lane Mapping und Hydration

```js
const {
  createFabricRmtLaneMapping,
  resolveRmtScheduleForFiber
} = require('@ccslabs/xtend-fabric/rmt-lane-mapping');
const {
  createHydrationPolicyController,
  resolveHydrationPolicy
} = require('@ccslabs/xtend-fabric/hydration-policy');

const mapping = createFabricRmtLaneMapping();
const schedule = resolveRmtScheduleForFiber({ kind: 'component.hydrate' });
const policy = resolveHydrationPolicy({ policy: 'visible' });
const controller = createHydrationPolicyController('x-example');
```

Das Lane Mapping übersetzt Fabric-Arbeit in RMT-Schedule-Records, ohne Runtime-Ownership zu übertragen. Hydration Policies wählen sichtbares, inaktives, sofortiges oder verzögertes Verhalten und liefern prüfbare Entscheidungen.

### Öffentliche Einstiegspunkte

- `@ccslabs/xtend-fabric`
- `@ccslabs/xtend-fabric/rmt-lane-mapping`
- `@ccslabs/xtend-fabric/hydration-policy`
- `@ccslabs/xtend-fabric/policy-types`

Beim direkten Laden stellt die Browser-Runtime außerdem den begrenzten Namespace `window.XTendFabric` bereit.

### Runtime-Grenze

- Diagnosen werden vor der Veröffentlichung durch Reporter redigiert.
- Reporter übertragen ohne explizite Registrierung keine Daten.
- Fabric konsumiert RMT-Diagnosen und Schedule-Fakten, führt aber keinen Remote-Code aus.
- XScaler-fähige Orchestrierung bleibt eine Protokollgrenze statt verstecktem Netzwerkverhalten.

### Verifikation

```bash
npm run test:fabric
npm run test:fabric-lanes
npm run test:hydration-policy
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xtend-fabric) · [English](#english)
