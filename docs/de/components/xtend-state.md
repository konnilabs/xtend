# XTend State

XTend State ist die dynamische Classic-State-Runtime für manifestgeladene XTend-Komponenten. Sie bleibt bewusst von der strikt typisierten `createStore()`-API, vom RMT Model und von `XUtils` getrennt. Die Runtime eignet sich für bestehende Browser-Integrationen, die dynamische Keys, sofortige Subscription-Callbacks und das Classic-Lifecycle-Protokoll benötigen.

## Was es löst

Classic-Komponenten müssen häufig kleine Zustände teilen, ohne ein vollständiges Anwendungsmodell aufzubauen. XTend State stellt dafür einen Singleton mit Key- und Pfadzugriff, Batches, Persistenz, Snapshots und Diagnoseereignissen bereit. Der Manifest-Loader löst den Schlüssel `xtend-state`; derselbe Singleton ist anschließend als `window.XTend.state` erreichbar. Moderne App-Daten bleiben dagegen in `createStore()` oder im RMT Model. Dadurch ist eindeutig, welche Schicht Daten besitzt und welche sie nur projiziert.

## Einsatz

Verwende XTend State für Classic-Komponenten, Browser-Skripte und schrittweise Migrationen, wenn die Keys zur Laufzeit entstehen oder bestehende Callback-Semantik erhalten bleiben muss. Für neuen typisierten App-State ist `createStore()` aus `@ccslabs/xtend` die passendere Oberfläche. Das RMT Model bleibt bei RMT-Anwendungen die Source of Truth; XTend State darf dort ausschließlich ein injiziertes Ausgabeziel sein.

## Nicht einsetzen, wenn

Nutze die Runtime nicht als versteckten globalen Initialzustand, nicht für vertrauliche unredigierte Nutzdaten und nicht als zweite Queue oder Scheduling-Autorität. Der Root-Import ist side-effect-free und lädt die Classic-Runtime absichtlich nicht. Wer ein festes TypeScript-Schema, Transaktionen über ein App-Modell oder reproduzierbare Serverausführung benötigt, sollte `createStore()` beziehungsweise die passenden RMT-Ports verwenden.

## Laden und registrieren

Der öffentliche Package-Subpath lädt die Classic-Runtime explizit:

```js
// XTend State package entry
import { xtendState } from '@ccslabs/xtend/classic-state';

xtendState.set('demo.ready', true);
const unsubscribe = xtendState.subscribe((key, value, snapshot) => {
  console.log(key, value, snapshot);
}, 'demo.ready');
```

Alternativ kann `components/xtend-state.js` lokal importiert werden. Die Manifest-Registrierung muss auf diesen lokalen Pfad zeigen. Nach dem Laden gilt `window.XTend.state === xtendState`; frühere Globals wie `window.xstate` werden nicht mehr erzeugt.

## Beispiele

Pfade und Batches vermeiden unnötige Einzelupdates. Eine Subscription kann auf einen Key begrenzt und später über die zurückgegebene Funktion beendet werden:

```js
// XTend State batch and path example
import { xtendState } from '/components/xtend-state.js';

const stop = xtendState.subscribe((_key, _value, snapshot) => {
  renderPreferences(snapshot.preferences);
}, 'preferences');

xtendState.batchUpdate({
  'preferences.theme': 'dark',
  'preferences.density': 'compact'
});
xtendState.setPath('preferences.motion.reduced', true);
stop();
```

## API-Referenz

`get`, `set`, `remove` und `clear` bearbeiten Keys. `getPath` und `setPath` greifen auf verschachtelte Daten zu. `subscribe` liefert eine Unsubscribe-Funktion und ruft den Listener sofort mit dem aktuellen Snapshot auf. `batchUpdate` bündelt Änderungen unter der Classic-Einmalbenachrichtigung. Persistenz speichert unter `xtend-state-data`; beim ersten Laden nach 0.7 kann der alte Key sicher übernommen werden. Lifecycle-Subscriptions und Diagnostics sind getrennt von normalen State-Callbacks.

Die öffentlichen Diagnoseereignisse heißen `state:set`, `state:remove`, `state:clear`, `state:set-path`, `state:batch-update`, `state:subscribe`, `state:unsubscribe`, `state:storage-save`, `state:storage-load`, `state:lifecycle-subscribe`, `state:lifecycle-unsubscribe` und `rmt-state-adapter:create`. Browser-Lifecycle-Telemetrie wird ausschließlich über `xtend-state:lifecycle` ausgeliefert.

## Integrationshinweise

RMT injiziert Classic State nur als Projektion. Der Adapter liest keinen impliziten Initialzustand zurück:

```js
// XTend State as an output-only RMT projection
import { xtendState } from '@ccslabs/xtend/classic-state';
import { createRmtStateHostAdapter } from '@ccslabs/xtend/rmt/state-host-adapter';

const stateProjectionPort = createRmtStateHostAdapter({ target: xtendState });
```

Verifizierter Initialzustand wird dem RMT Model über `initialState` übergeben. Komponenten sollten ihre Subscription beim Disconnect beenden und keine vollständigen Snapshots in externe Telemetrie schreiben.

## Fehlerbehebung

Ist `xtendState` nicht verfügbar, prüfe zuerst den Package-Subpath oder den Manifest-Key `xtend-state`. Bleiben UI-Werte alt, kontrolliere den Subscription-Filter und ob ein Batch tatsächlich abgeschlossen wurde. Persistenzprobleme lassen sich über `state:storage-load` und `state:storage-save` eingrenzen. Wenn eine RMT-Projektion fehlt, muss `createRmtStateHostAdapter()` explizit an den Runtime-Port übergeben werden; globale Factory-Suche ist kein unterstützter Ersatz.

## Nächste Schritte

- [0.7-State-Migration](../migration-0-7-state.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
