# XTend Component Lifecycle Error Boundary

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.lifecycle-error-boundary.v1`
- Workpackage: `ER-WP-09`
- Runtime: `fabric/xtend-fabric.js`
- Gate: `tests/fabric/fabric_lifecycle_boundary_suite.js`
- Bezug:
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md`
  - `tests/fabric/fixtures/broken-lifecycle.component.js`

## Entscheidung

XTend-Fabric stellt ab ER-WP-09 eine explizite Component Lifecycle Error Boundary bereit. Sie ist Teil der Host-/Fabric-Schicht, nicht Teil des XTendRMT Kernels. Komponenten koennen damit Lifecycle-, Render-, Hydration-, Disconnect- und Event-Handler-Fehler als strukturierte `xtend.fabric.diagnostic.v1` Events erfassen lassen.

## Contract

Lifecycle-Fehler muessen mindestens enthalten:

| Feld | Pflicht | Zweck |
|------|---------|-------|
| `component` | ja | lesbarer Component-Identifier |
| `componentRef` | ja | stabile Component-Referenz fuer Korrelation |
| `phase` | ja | Lifecycle-Phase, z. B. `connectedCallback`, `render`, `hydrate`, `eventHandler` |
| `fiberId` | ja | ausgefuehrte Fabric Fiber |
| `lane` | ja | Scheduler-Lane der fehlerhaften Arbeit |
| `severity` | ja | Schweregrad, Default `error` |
| `cause` | ja | normalisierte Fehlerursache mit Name und Message |
| `metadata.lifecycleBoundary` | ja | `xtend.fabric.lifecycle-error-boundary.v1` |

Der stabile Diagnostic Code lautet `xtend.fabric.component.lifecycle.failed`.

## Phase-zu-Fiber-Mapping

| Phase | Fiber Kind | Lane |
|-------|------------|------|
| `connectedCallback` | `component.mount` | `visible` |
| `attributeChangedCallback` | `component.update` | `visible` |
| `render` | `component.render` | `visible` |
| `hydrate` | `component.hydrate` | `visible` |
| `disconnectedCallback` | `component.disconnect` | `background` |
| `eventHandler` | `event.handler` | `user-blocking` |

Event Handler bleiben bewusst `user-blocking`, weil sie direkt aus Nutzerinteraktion entstehen koennen. Disconnect-Arbeit laeuft auf `background`, damit Cleanup-Fehler sichtbar bleiben, ohne das UI-Lane-Modell zu verzerren.

## Runtime API

```js
const fabric = window.XTendFabric.createXtendFabric();
const boundary = fabric.createComponentLifecycleBoundary('x-alert', {
  swallowErrors: true,
  fallbackValue: undefined
});

boundary.runPhase('render', () => component.render());
const safeClick = boundary.wrapEventHandler(component.handleClick, {
  eventName: 'click'
});
```

`fabric.wrapComponent(ComponentClass, options)` nutzt dieselbe Boundary und kann zusaetzliche Event-Handler ueber `eventHandlers` einschliessen.

```js
const SafeAlert = fabric.wrapComponent(XAlert, {
  componentRef: 'x-alert',
  eventHandlers: ['handleDismiss']
});
```

## Fehlersemantik

- `swallowErrors: true` ist der Default fuer Lifecycle-Boundaries, damit Custom-Element-Lifecycle-Fehler nicht unstrukturiert nach oben verschwinden.
- `swallowErrors: false` wirft den Originalfehler nach der Diagnostic-Erfassung weiter.
- Sync- und Async-Fehler erzeugen dieselbe Diagnostic-Struktur.
- Reporter erhalten nur redigierte Diagnostics.

## Grenzen

- Die Boundary ersetzt keine Component-spezifische Fehlerbehandlung fuer fachliche Fehler.
- Sie importiert keinen RMT Kernel.
- Sie entscheidet keine Retry- oder Recovery-Policy; das bleibt Folgearbeit fuer Reporter, QS-Schichten oder spaetere Scheduler-Policies.
- Produktive Komponenten muessen schrittweise opt-in angeschlossen werden; ER-WP-09 liefert den Runtime- und Test-Contract.

## Handoff

| Paket | Status nach ER-WP-09 | Handoff |
|-------|----------------------|---------|
| `ER-WP-10` | completed | Reporter Adapter koennen Lifecycle-Diagnostics ohne neues Eventformat konsumieren |
| `ER-WP-14` | completed | Component Mount/Hydration Fibers setzen auf Lifecycle-Fiber-Mapping auf |
| `ER-WP-15` | completed | Route-Fibers koennen Component-Fiber-Instrumentierung korrelieren |
