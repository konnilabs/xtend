# XTend State

XTend State ist die dynamische Classic-State-Runtime für manifestgeladene XTend-Komponenten. Sie bleibt bewusst von der strikt typisierten `createStore()`-API und von `XUtils` getrennt.

## Passende API wählen

Für modernen App-State mit deklarierter TypeScript-Struktur dient `createStore()` aus `@ccslabs/xtend`. `xtendState` ist für Classic-Komponenten und Browser-Integrationen mit dynamischen Keys und der bestehenden Classic-Callback-Semantik vorgesehen.

Der Root-Import bleibt side-effect-free und lädt weder die Classic-Runtime noch Browser-Globals.

## Classic-Runtime laden

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
```

Oder lokal im Browser:

```js
import { xtendState } from '/components/xtend-state.js';

xtendState.set('demo.ready', true);
const unsubscribe = xtendState.subscribe((key, value, snapshot) => {
  console.log(key, value, snapshot);
}, 'demo.ready');
```

Der Loader löst den Manifest-Key `xtend-state` vor i18n und Theme auf. Danach ist exakt derselbe Singleton unter `window.XTend.state` erreichbar.

## Runtime-Vertrag

`XTendStateRuntime` bietet `get`, `set`, `remove`, `clear`, gefiltertes `subscribe`, `batchUpdate`, `getPath`, `setPath`, Persistenz, Lifecycle-Subscriptions, Snapshots und Diagnostics. Subscriptions erhalten sofort einen ersten Callback mit dem aktuellen Snapshot. `batchUpdate()` behält die einzelne Classic-Callback-Benachrichtigung bei.

Browser-Lifecycle-Telemetrie wird ausschließlich über `xtend-state:lifecycle` ausgeliefert.

## Persistenz

Der Standardkey ist `xtend-state-data`. Beim ersten Laden nach dem Upgrade auf 0.7 kann die Runtime den bisherigen Key migrieren. Sie validiert die Daten, schreibt zuerst den neuen Key und entfernt den alten Wert nur nach erfolgreichem Schreiben.

## RMT-Integration

Das RMT Model bleibt die Source of Truth. Classic State wird nur als Ausgabeziel über `createRmtStateHostAdapter()` injiziert:

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
import { createRmtStateHostAdapter } from '@ccslabs/xtend/rmt/state-host-adapter';

const stateProjectionPort = createRmtStateHostAdapter({ target: xtendState });
```

Verifizierten Initialzustand an RMT immer über `initialState` übergeben.

## Weiterführend

- [0.7-State-Migration](../migration-0.7-state.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
