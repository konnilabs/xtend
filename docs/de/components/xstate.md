# xstate – XTend Komponente

> **Siehe auch:** [xalert](./xalert.md), [xtoast](./xtoast.md), [xbutton](./xbutton.md), [xtheme](./xtheme.md)

## Übersicht

`xstate` ist das zentrale State-Management-Modul für XTend-Komponenten. Es ermöglicht globale und lokale Zustände, Abonnements und reaktive Updates.

Seit `WP-E12-08` ist `xstate` ausdruecklich als nicht-visuelle **Boundary-Probe** dokumentiert. Das Modul wird nicht zu einem Custom Element umgedeutet. Es stellt stattdessen eine gatebare Adapter-, Typing- und Lifecycle-Oberflaeche fuer XTend UI, Fabric und XTendRMT bereit.

---

## Features
- Globales und komponentenbasiertes State-Management
- Abonnements für State-Änderungen mit Key-Filter
- Reaktive Updates für Komponenten
- Pfad-Updates, Batch-Updates und Storage-Helfer
- Kompatibilitäts-Fassade für `on/off`
- Lifecycle Events fuer State-Operationen
- Fabric-kompatible Diagnostics Snapshots
- RMT State Scheduler Adapter ohne Kernel-Kopplung

---

## Verwendung

```js
import { xstate } from 'components/xstate.js';

xstate.set('key', 'value');
const value = xstate.get('key');
const unsubscribe = xstate.subscribe((key, value, allData) => { ... }, 'key');
```

---

## API
| Methode | Beschreibung |
|---------|--------------|
| `get(key)` | Gibt den Wert für einen Schlüssel zurück |
| `set(key, val)` | Setzt einen Wert und benachrichtigt Listener |
| `subscribe(fn, keyFilter?)` | Kanonischer Subscription-Contract mit optionalem Key-Filter |
| `remove(key)` | Entfernt einen Schlüssel aus dem State |
| `getPath(path)` | Liest verschachtelte Werte über Dot-Notation |
| `setPath(path, value)` | Schreibt verschachtelte Werte über Dot-Notation |
| `batchUpdate(updates)` | Führt mehrere Updates in einem Schritt aus |
| `saveToStorage(type?, key?)` | Persistiert den State in Local- oder Session-Storage |
| `loadFromStorage(type?, key?)` | Lädt den State aus Browser-Storage |
| `on(key, fn)` | Legacy-Kompatibilität für key-basierte Listener |
| `off(key, fn)` | Entfernt einen per `on` registrierten Listener |
| `subscribeLifecycle(fn)` | Abonniert Lifecycle-/Diagnostics-Events der State-Boundary |
| `snapshot()` | Liefert einen stabilen State-Snapshot fuer Tests und Adapter |
| `snapshotDiagnostics()` | Liefert Fabric-kompatible Diagnostics |
| `createRmtStateAdapter(options?)` | Erstellt einen host-neutralen RMT State Adapter |

---

## Beispiel: State in Komponente nutzen

```js
xstate.set('user', { name: 'Konni' });
const unsubscribe = xstate.subscribe((key, value) => {
  if (key === 'user') {
    // Reagiere auf Änderungen
  }
});
```

### Kanonische Empfehlung

- Neue Core-Implementierungen sollen `subscribe(fn, keyFilter)` verwenden.
- `on/off` bleiben als Kompatibilitäts-Fassade erlaubt, sind aber nicht der kanonische Contract.

---

## Boundary-Probe Contract

`xstate` ist kein visuelles Element. Die Component-Catalog-Haertung prueft es deshalb als Infrastruktur-Boundary:

- Boundary Schema: `xtend.state.boundary-probe.v1`
- Snapshot Schema: `xtend.state.snapshot.v1`
- Lifecycle Schema: `xtend.state.lifecycle-event.v1`
- Diagnostics Schema: `xtend.fabric.state-diagnostics.v1`
- RMT Compatibility Schema: `xtend.rmt.state-scheduler-compatibility.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

```js
import { xstate } from '/components/xstate.js';

const unsubscribeLifecycle = xstate.subscribeLifecycle((event, diagnostics) => {
  console.log(event.type, diagnostics.operationCounts);
});

xstate.set('rmt.bridge.ready', true);

const snapshot = xstate.snapshot();
const diagnostics = xstate.snapshotDiagnostics();

unsubscribeLifecycle();
```

## RMT State Scheduler Compatibility

RMT darf `xstate` nicht direkt importieren. Ein XTend Host kann aber bewusst einen Adapter erzeugen und an die State-/Scheduler-/Diagnostics-Bridge uebergeben:

```js
const stateAdapter = xstate.createRmtStateAdapter({
  schedulerId: 'docs.app.shell'
});

stateAdapter.set('rmt.scheduler.lastEndpoint', {
  id: 'docs.header.search',
  lane: 'user-blocking'
});

stateAdapter.snapshot();
stateAdapter.diagnostics();
```

Damit bleibt XTendRMT framework-agnostisch. `xstate` ist eine optionale Host-Capability und keine Kernel-Abhaengigkeit.

---

## XTendRMT Bridge State

XTendRMT nutzt `xstate` optional als Host-State-Spiegel. Die State-/Scheduler-/Diagnostics Bridge schreibt nur dann in `xstate`, wenn ein Host ihr ein kompatibles Ziel uebergibt. Ohne `xstate` bleibt ein in-memory State Handle aktiv.

Aktuelle Bridge-Keys:

- `rmt.bridge.ready`
- `rmt.scheduler.lastEndpoint`
- `rmt.adapter.lastResult`
- `rmt.diagnostics.last`
- `rmt.route.<id>.lastResult`
- `rmt.component.<id>.lastResult`

Die Implementierung liegt in `createRmtStateSchedulerDiagnosticsBridge`; Details stehen in [XTendRMT Runtime Bridge](../xtendrmt-runtime-bridge.md).

---

## Hinweise
- Wird von fast allen XTend-Komponenten genutzt
- Kann auch für eigene Zwecke verwendet werden
- Im XTend-Core ist `xstate` das erste Bootstrap-Basismodul

---

*Letzte Aktualisierung: 7. Mai 2026*
