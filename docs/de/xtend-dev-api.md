# XTend DEV API

Die XTend DEV API ist die explizite, nur lesende Diagnosegrenze zwischen einer XTend-Anwendung und Entwicklungswerkzeugen. Stelle sie als `window.__XTEND_DEV_API__` bereit, wenn die Anwendung von der XTend Dev Surface oder einem anderen lokalen Diagnosewerkzeug erkannt werden soll.

Die API steuert die Anwendung nicht. Sie veröffentlicht aktuelle Snapshots, während RMT Kernel, Fabric, Host-Runtime und Anwendung Eigentümer von Ausführung und Zustand bleiben.

## DEV API und `window.XTend`

`window.XTend` ist die produktseitige Browser-API, die `api.js` initialisiert. Sie enthält Runtime-Dienste wie Theme- und Feedback-APIs. `window.__XTEND_DEV_API__` ist davon getrennt und ausschließlich für Telemetrie und Diagnose vorgesehen.

Die doppelten Unterstriche am Anfang und Ende sind beabsichtigt. Ergänze keine DEV-spezifischen Methoden in `window.XTend` und verwende die DEV API nicht als Service Locator der Anwendung.

## Contract im Überblick

| Member | Anforderung | Ergebnis |
| --- | --- | --- |
| `version` | Empfohlen | Versionskennung der DEV API; ein fehlender Wert wird als `null` gemeldet |
| `getPerformanceSnapshot()` | Erforderlich | Aktuelle Messungen, Phasen, Budgets und Statuswerte |
| `getFabricTelemetrySnapshot()` | Erforderlich | Aktuelle Lanes, Fibers, Summen und Backpressure |
| `getKernelSnapshot()` | Erforderlich | Aktueller Kernel-Zustand einschließlich Panic und Recovery |
| `getHydrationSnapshot()` | Optional | Hydration- oder Resume-Strategie, Timings, Surfaces und XScaler-Zustand |
| `subscribe(listener)` | Optional | Beobachtungssignal, das eine Unsubscribe-Funktion zurückgibt |

Die drei erforderlichen Methoden entscheiden, ob die Runtime Bridge als gesund gilt. Eine fehlende optionale Methode betrifft nur die zugehörige Fähigkeit. Insbesondere darf das Weglassen von `getHydrationSnapshot()` Performance, Kernel und Fabric nicht degradieren.

## Runtime-Regeln

Jede Snapshot-Methode muss:

1. Synchron zurückkehren. Ein `Promise` oder anderes Thenable wird abgelehnt.
2. Einen JSON-serialisierbaren Wert ohne Zyklen, DOM-Nodes, Funktionen oder Klasseninstanzen liefern, deren wesentlicher Zustand bei der Serialisierung verloren geht.
3. Bei jedem Aufruf den aktuellen Zustand lesen. Ein einmal beim Boot erzeugter Snapshot darf nicht dauerhaft zurückgegeben werden.
4. Daten aus dem Besitz der Anwendung liefern, ohne Ownership an den Aufrufer zu übertragen.
5. Secrets, Zugangsdaten, rohe Nutzerinhalte und nicht redigierte Resume Tokens vermeiden.

Installiere das Objekt nach Möglichkeit vor dem vollständigen Runtime-Boot. Frühe Aufrufe dürfen gültige `degraded`-Snapshots liefern. Aktualisiere deren Daten über die Stores des Hosts, sobald die Anwendung bereit ist; ersetze keine Browser-Globals und patche keine Framework-Interna, um Messwerte zu sammeln.

## XTend-Classic-Opt-in

Ein HTML-first-Host mit dem kanonischen Loader kann den nur lesenden Classic-Adapter ohne weiteren Script-Tag aktivieren:

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"
  data-dev-api="true"></script>
```

Die entsprechende programmatische Option lautet `window.XTendLoader.initiateXTend({ devApi: true })`. Der Loader importiert seinen internen ESM-Service parallel zum Manifest. Er veröffentlicht reale Loader- und Browser-Performance-Messungen. Fabric, RMT Kernel und SSR-Hydration melden `supported: false`, wenn diese Runtimes nicht aktiv sind; die Diagnoseaktivierung bootet sie niemals implizit.

Standardmäßig bleibt die Funktion deaktiviert. Eine vorhandene host-eigene `window.__XTEND_DEV_API__`, etwa der Adapter der Docs oder Animation TestBench, bleibt erhalten. Der Classic-Service ist bewusst kein direkter Package-Export: `xtend-loader.js` bleibt sein Lifecycle-Owner.

## Minimale Implementierung

Das folgende anwendungseigene Modul richtet eine vollständige v1-Grenze ein. Es ist ein Integrationsbeispiel und keine exportierte XTend-Factory.

```js
const listeners = new Set();

const telemetry = {
  status: 'degraded',
  performance: {
    schema: 'xtend.devsurface.performance-snapshot.v1',
    supported: true,
    status: 'degraded',
    measurements: []
  },
  fabric: {
    schema: 'xtend.fabric.telemetry-snapshot.v1',
    status: 'degraded',
    lanes: {},
    totals: {
      fiberCount: 0,
      completedCount: 0,
      failedCount: 0,
      budgetMissCount: 0
    },
    backpressure: { level: 'none', action: 'observe' }
  },
  kernel: {
    schema: 'xtend.rmt.kernel-panic-state.v1',
    state: 'none',
    severity: 'info',
    recoveryAction: 'none',
    mitigationStrategy: 'observe',
    affectedScopes: [],
    affectedJobs: []
  },
  hydration: {
    schema: 'xtend.devsurface.hydration-snapshot.v1',
    supported: true,
    strategy: 'none',
    status: 'degraded',
    timing: {},
    surfaces: [],
    xscaler: {},
    diagnostics: []
  }
};

function cloneSnapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

function publishDevTelemetry(patch) {
  Object.assign(telemetry, patch);
  const event = cloneSnapshot({
    schema: 'xtend.devsurface.subscription-event.v1',
    status: telemetry.status
  });
  listeners.forEach((listener) => {
    try { listener(event); } catch (_) {}
  });
}

window.__XTEND_DEV_API__ = Object.freeze({
  version: '1.0.0',
  getPerformanceSnapshot() {
    return cloneSnapshot(telemetry.performance);
  },
  getFabricTelemetrySnapshot() {
    return cloneSnapshot(telemetry.fabric);
  },
  getKernelSnapshot() {
    return cloneSnapshot(telemetry.kernel);
  },
  getHydrationSnapshot() {
    return cloneSnapshot(telemetry.hydration);
  },
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
});

export { publishDevTelemetry };
```

Aktualisiere den anwendungseigenen Adapter nach dem Runtime-Boot mit echten Messungen und Snapshots:

```js
const recovery = appRuntime.getPanicRecoverySnapshot();

publishDevTelemetry({
  status: 'ready',
  performance: {
    schema: 'xtend.devsurface.performance-snapshot.v1',
    supported: true,
    status: 'ready',
    measurements: appMeasurements.slice()
  },
  fabric: fabric.createTelemetrySnapshot({ source: 'my-app' }),
  kernel: recovery.kernel || recovery.records?.at(-1) || telemetry.kernel,
  hydration: hydrationStore.snapshot()
});
```

`appMeasurements` und `hydrationStore` stehen in diesem Beispiel für anwendungseigene Adapter. Sie sind keine neuen XTend-Globals. Die Docs-Shell leitet dieselbe Grenze aus ihrer AppRuntime ab; die Animation TestBench verwendet ihren Boot-, Resume- und XScaler-Zustand.

## Performance Snapshot

Die Bridge akzeptiert `measurements`, `performanceMeasurements` oder `entries`; für neue Integrationen ist `measurements` das kanonische Feld. Jede Messung sollte `xtend.performance.measurement.v1` verwenden.

```json
{
  "schema": "xtend.devsurface.performance-snapshot.v1",
  "supported": true,
  "status": "ready",
  "measurements": [
    {
      "schema": "xtend.performance.measurement.v1",
      "id": "app.route.transition",
      "name": "Route transition",
      "phase": "route",
      "profile": "app-shell",
      "lane": "transition",
      "durationMs": 42,
      "budgetMs": 140,
      "status": "pass",
      "sampleKind": "runtime"
    }
  ]
}
```

Verwende `pass`, `warn` oder `fail`, wenn die Anwendung das Budget bereits bewertet hat. Fehlt der Status, leitet die Dev Surface ihn aus `durationMs` und `budgetMs` ab. Zeitwerte müssen verstrichene Arbeit beschreiben und dürfen keine absoluten Zeitstempel wie `performance.now()` sein.

## Fabric Telemetry Snapshot

Fabric akzeptiert Lanes als Objekt mit Lane-ID als Schlüssel oder als Array mit `id` beziehungsweise `lane`. Summen machen die Übersicht deterministisch; Fiber Records ergänzen Details.

```json
{
  "schema": "xtend.fabric.telemetry-snapshot.v1",
  "lanes": {
    "user-blocking": {
      "fiberCount": 3,
      "activeFiberCount": 1,
      "completedCount": 2,
      "failedCount": 0,
      "budgetMissCount": 0,
      "deadlineMs": 80,
      "averageDurationMs": 14,
      "backpressureLevel": "none",
      "fibers": []
    }
  },
  "totals": {
    "fiberCount": 3,
    "completedCount": 2,
    "failedCount": 0,
    "budgetMissCount": 0
  },
  "backpressure": {
    "level": "none",
    "action": "observe",
    "laneIds": []
  }
}
```

Melde die tatsächlich von der Runtime verwendete Lane, statt jede Aufgabe einer generischen Lane zuzuordnen. So bleiben aussagekräftige Nachweise für user-blocking Arbeit, Transitions, sichtbare Hydration und Idle-Arbeit erhalten.

## Kernel Snapshot

Der Kernel Snapshot beschreibt den aktuellen Zustand und ist kein Fehlerprotokoll. Auch eine gesunde Runtime liefert einen Record mit `state: "none"`.

```json
{
  "schema": "xtend.rmt.kernel-panic-state.v1",
  "state": "none",
  "severity": "info",
  "recoveryAction": "none",
  "mitigationStrategy": "observe",
  "affectedScopes": [],
  "affectedJobs": [],
  "blockedCommitCount": 0,
  "criticalViolationCount": 0
}
```

Unterstützte Zustände sind `none`, `suspected`, `active`, `recovering`, `recovered` und `failed`. Halte Recovery- und Mitigation-Werte explizit, damit Betreiber Beobachtung, aktive Blockade und Wiederholungsversuch unterscheiden können.

## Optionaler Hydration Snapshot

Hydration kann initiale Hydrierung, Resume oder einen bewusst nicht hydrierten Pfad beschreiben. Verwende verstrichene Zeitwerte relativ zu dem jeweiligen Vorgang.

```json
{
  "schema": "xtend.devsurface.hydration-snapshot.v1",
  "supported": true,
  "strategy": "server_prerender_resume",
  "status": "resumed",
  "resumeToken": "redacted",
  "resumeTokenRedacted": true,
  "rootId": "app-root",
  "adapterKind": "node-ssr",
  "responseKind": "rmt_template_chunk",
  "timing": {
    "ssrRenderMs": 18,
    "resumeReadMs": 2,
    "hydrateMs": 14,
    "firstInteractiveMs": 34,
    "clsValue": 0
  },
  "surfaces": [],
  "xscaler": {
    "mode": "protocol-lazy",
    "preflightCount": 0,
    "acceptedCount": 0,
    "rejectedCount": 0,
    "networkDuringRender": false,
    "lazyLoadedCount": 0,
    "atcSessions": []
  },
  "diagnostics": []
}
```

Rekonstruiere niemals ein Resume Token für Diagnosezwecke. Veröffentliche den bereits redigierten Wert mit `resumeTokenRedacted: true` oder lasse ihn vollständig weg.

## Verhalten von Subscriptions

`subscribe(listener)` ist optional. Die Methode zeigt an, dass der Host Beobachter nach relevanten Zustandsänderungen informieren kann; die Snapshot-Methoden bleiben jedoch die Source of Truth. Gib eine idempotente Unsubscribe-Funktion zurück und isoliere Listener-Fehler, damit Diagnosewerkzeuge die Anwendung nicht beschädigen können.

Die Extension kann nach einem Signal erneut einen frischen Snapshot anfordern. Gehe nicht davon aus, dass ein Subscription Event den vollständigen Runtime-Zustand oder dessen Ownership überträgt.

## Prüfung in der Browser-Console

Führe diesen Block im Tab der untersuchten Anwendung aus, nicht auf der Extension-Seite der DevTools:

```js
const api = window.__XTEND_DEV_API__;
if (!api) throw new Error('XTend DEV API is not installed.');

const required = [
  'getPerformanceSnapshot',
  'getFabricTelemetrySnapshot',
  'getKernelSnapshot'
];

for (const method of required) {
  if (typeof api[method] !== 'function') {
    throw new Error(`Missing required method: ${method}`);
  }
  const snapshot = api[method]();
  if (snapshot && typeof snapshot.then === 'function') {
    throw new Error(`${method} returned a Promise.`);
  }
  JSON.stringify(snapshot);
}

const unsubscribe = api.subscribe?.((event) => console.debug(event));
unsubscribe?.();
```

Öffne nach dieser Prüfung die XTend Dev Surface und wähle `Refresh`. Die Telemetrie-Tabs sollten Werte der Anwendung statt `No XTend app detected` oder Platzhalterdaten anzeigen.

## Diagnostics und Fehlerbehebung

| Diagnostic | Bedeutung | Behebung |
| --- | --- | --- |
| `xtend.devsurface.dev_api.missing` | Die untersuchte Seite stellt keine DEV API bereit | Installiere sie in der Anwendungsseite und lade den untersuchten Tab neu |
| `xtend.devsurface.dev_api.method_missing` | Eine erforderliche Methode fehlt | Ergänze die genannte Methode; optionale Hydration- und Subscription-Methoden lösen diesen Fehler nicht aus |
| `xtend.devsurface.runtime_bridge.async_snapshot_unsupported` | Eine Snapshot-Methode gab ein Thenable zurück | Sammle Daten vor dem DEV-API-Aufruf und lies den vorbereiteten Zustand synchron |
| `xtend.devsurface.runtime_bridge.serialization_failed` | JSON-Cloning ist fehlgeschlagen | Entferne Zyklen, DOM-Nodes, Funktionen und Klasseninstanzen, die keine reinen Daten sind |
| `xtend.devsurface.runtime_bridge.read_failed` | Eine Methode warf während der Auswertung einen Fehler | Fange Fehler im App-Adapter ab und liefere einen gültigen degradierten Snapshot mit Diagnostics |

Bleiben Werte nach einer Route Transition veraltet, prüfe, ob die Methode einen frischen Clone aus aktuellen Stores erzeugt. Wiederholtes Ersetzen von `window.__XTEND_DEV_API__` ist kein Refresh-Mechanismus und kann Subscribers ungültig machen.

## Sicherheitscheckliste

- Veröffentliche aggregierte Diagnostics und Identifikatoren statt Zugangsdaten oder Nutzer-Payloads.
- Redigiere Resume Tokens, bevor sie in den Snapshot gelangen.
- Halte Methoden read-only und frei von Anwendungsänderungen.
- Patche weder `fetch`, `history`, `performance`, `customElements` noch Framework-APIs.
- Lade keine entfernte Diagnose-Runtime und kein CDN-Skript.
- Behandle Subscribers als optionale Beobachter und entferne sie beim Teardown.

## Weiterführende Artikel

- [XTend Dev Surface](./xtend-dev-surface.md)
- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [API](./api.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
