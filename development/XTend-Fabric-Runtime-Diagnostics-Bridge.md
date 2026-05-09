# XTend-Fabric Runtime Diagnostics Bridge

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.runtime-diagnostics-bridge.v1`
- Runtime: `fabric/xtend-fabric.js`
- Test-Gate: `tests/fabric/fabric_runtime_diagnostics_bridge_suite.js`
- Runner: `node scripts/run_xtend_tests.js fabric-runtime-bridge --json`

## Zweck

Die Runtime Diagnostics Bridge verbindet XTend-Fabric mit den vorhandenen Host-Surfaces `xstate`, `window.XTend`/API Compliance und XTendRMT Diagnostics. Sie ist bewusst eine Fabric-seitige Host-Bruecke. Der RMT Kernel wird nicht importiert und bleibt host-neutral.

Damit kann Fabric Diagnostics und Correlation IDs ueber vorhandene Adapterdaten spiegeln, ohne XTend, XRouter oder RMT fest ineinander einzubauen.

## API Surface

Fabric-Instanzen stellen ab ER-WP-11 bereit:

```js
const fabric = window.XTendFabric.createXtendFabric();
const bridge = fabric.createRuntimeDiagnosticsBridge({
  xstate: window.xstate,
  api: window.XTend
});

bridge.connectXState();
bridge.connectApi();
const diagnosticsHub = bridge.createRmtDiagnosticsHub();
```

| API | Zweck |
|-----|-------|
| `createRuntimeDiagnosticsBridge(options)` | erzeugt die Runtime Diagnostics Bridge |
| `connectXState(xstate, options)` | spiegelt Fabric Diagnostics und xstate-Aenderungen |
| `connectApi(api, options)` | liest XTend API Compliance-Metadaten |
| `connectRmtDiagnostics(source, options)` | konsumiert RMT Diagnostics aus Arrays, `diagnostics`, `listDiagnostics`, `subscribe` oder DOM Events |
| `createRmtDiagnosticsHub(options)` | stellt ein host-neutrales Hub-Shape fuer XTendRMT Adapter bereit |
| `connectAll(options)` | verbindet vorhandene Targets gesammelt |
| `getSnapshot(extra)` | erzeugt einen lokalen Bridge-Snapshot |
| `readState(key, fallback, target)` | liest aus der angebundenen State Bridge |
| `dispose()` | trennt Reporter, State-Subscription und RMT-Diagnostic-Verbindungen |

## xstate Spiegelung

`connectXState` nutzt den kanonischen `xstate.subscribe(fn, keyFilter)` Contract. Fabric schreibt nur in den eigenen Namespace und ignoriert diesen Namespace bei eingehenden State-Events, damit keine Diagnostic-Schleifen entstehen.

Stabile Keys:

| Key | Inhalt |
|-----|--------|
| `xtend.fabric.bridge.ready` | Bridge-Readiness und Contract-ID |
| `xtend.fabric.diagnostics.last` | zuletzt redigierte Fabric Diagnostic |
| `xtend.fabric.diagnostics.snapshot` | Bridge-Snapshot mit Diagnostic-/Fiber-Zaehlern |

Stabile Diagnostics:

| Code | Ausloeser |
|------|-----------|
| `xtend.fabric.xstate.connected` | xstate wurde angebunden |
| `xtend.fabric.xstate.unavailable` | kein xstate Target gefunden |
| `xtend.fabric.xstate.changed` | externer xstate Key wurde geaendert |

## API Diagnostics

`connectApi` liest vorhandene API Compliance-Metadaten, ohne API-Interna vorauszusetzen. Unterstuetzt werden:

- `api.compliance.version`
- `api.compliance.getCoreContracts()`
- `api.compliance.getChecklist()`

Stabile Diagnostics:

| Code | Ausloeser |
|------|-----------|
| `xtend.fabric.api.connected` | API-Metadaten wurden gelesen |
| `xtend.fabric.api.unavailable` | kein API Target gefunden |
| `xtend.fabric.api.inspect.failed` | Compliance-Inspection hat einen Fehler geworfen |

## XTendRMT Diagnostics

RMT bleibt der Scheduler und Kernel. Fabric konsumiert nur Adapterdaten, Diagnostics-Arrays, Diagnostics-Hubs oder Bridge-Outputs.

Unterstuetzte Quellen:

- `source.diagnostics`
- `source.listDiagnostics()`
- `source.subscribe(fn)`
- `source.addEventListener("rmt-diagnostic", fn)`
- Arrays aus Diagnostic Records
- `createRmtDiagnosticsHub().publish(event, context)`
- `createRmtDiagnosticsHub().emit(eventName, event)`
- `createRmtDiagnosticsHub().record(event)`

RMT Adapterdiagnostics werden unter Fabric normalisiert und redigiert. Beispiel:

```js
const hub = bridge.createRmtDiagnosticsHub();
hub.publish({
  code: 'rmt.bridge.adapter.result.degraded',
  routeId: 'settings',
  scheduleRef: 'route.transition.render',
  metadata: {
    token: 'secret'
  }
});
```

Daraus entsteht eine Fabric Diagnostic mit Code `xtend.rmt.bridge.adapter.result.degraded`, `routeRef`, `scheduleRef`, `correlationId` und redigierter Metadata.

## Kernel Boundary

Erlaubt:

- RMT Adapter Results als Diagnostics konsumieren
- `scheduleRef`, `routeRef`, `componentRef`, `fiberId`, `lane` und `correlationId` weiterreichen
- xstate nur ueber das Host Target spiegeln
- API Compliance-Metadaten defensiv lesen
- Reporter weiterhin opt-in halten

Nicht erlaubt:

- RMT Kernel importieren
- `.rmt` Dokumente in Fabric parsen
- XTend-Komponenten in RMT ausfuehren
- XRouter direkt in Fabric voraussetzen
- externe Telemetry ohne opt-in Reporter senden

## Abnahme

| Kriterium | Status |
|-----------|--------|
| `createRuntimeDiagnosticsBridge` ist auf Fabric-Instanzen verfuegbar | erfuellt |
| `connectXState` spiegelt Readiness, Diagnostics und Snapshots | erfuellt |
| `connectApi` publiziert `xtend.fabric.api.connected` | erfuellt |
| `createRmtDiagnosticsHub` normalisiert RMT Diagnostics | erfuellt |
| `xtend.rmt.bridge.adapter.result.degraded` ist als Fabric-Diagnostic gatebar | erfuellt |
| RMT Kernel wird nicht importiert | erfuellt |
| Sensitive Metadata wird vor State-/Reporter-Ausgabe redigiert | erfuellt |

## Verifikation

```bash
node --check fabric/xtend-fabric.js
node --check tests/fabric/fabric_runtime_diagnostics_bridge_suite.js
node scripts/run_xtend_tests.js fabric-runtime-bridge --json
npm run test:fabric-runtime-bridge
```

## Handoff

| Paket | Status | Handoff |
|-------|--------|---------|
| `ER-WP-16` | completed | Telemetry Snapshots und Backpressure beziehen xstate/API/RMT Diagnostics ein |
| `ER-WP-18` | completed | Loader- und Hydration-Messpunkte koennen Bridge-Snapshots korrelieren |
| `ER-WP-39` | completed | Enterprise Adoption Guide dokumentiert Reporter- und Bridge-Pattern |
| `ER-WP-40` | completed | Docs-App RMT Pilot zeigt Bridge-Pattern praktisch |
