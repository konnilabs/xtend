# XTend-Fabric Reporter Adapter Contract

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.reporter.v1`
- Workpackage: `ER-WP-10`
- Runtime: `fabric/xtend-fabric.js`
- Gate: `tests/fabric/fabric_reporter_adapter_suite.js`
- Bezug:
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Component-Lifecycle-Error-Boundary.md`
  - `development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md`
  - `development/ER-WP-09-Component-Lifecycle-Error-Boundary-einfuehren.md`

## Entscheidung

XTend-Fabric stellt ab ER-WP-10 einen vendor-neutralen Reporter Adapter Contract bereit. Reporter bleiben opt-in. Der Default-Reporter bleibt `noop` und sendet nichts extern. Console-, Test- und spaetere Enterprise-Reporter nutzen denselben Contract `xtend.fabric.reporter.v1`.

Der Reporter Contract ist eine Adapterflaeche. Er ist kein Backend, keine Telemetry-Pipeline und keine implizite externe Uebertragung.

## Reporter Shape

```js
{
  id: 'enterprise-probe',
  schema: 'xtend.fabric.reporter.v1',
  kind: 'enterprise',
  delivery: 'adapter',
  external: true,
  minimumLevel: 'error',
  capabilities: ['diagnostics', 'lifecycle-errors'],
  publish(event, context) {},
  flush(reason) {},
  dispose() {}
}
```

Pflichtfelder:

| Feld | Pflicht | Zweck |
|------|---------|-------|
| `id` | ja | stabile Reporter-Identitaet |
| `schema` | ja | immer `xtend.fabric.reporter.v1` |
| `kind` | ja | `noop`, `console`, `test`, `enterprise` oder `custom` |
| `publish(event, context)` | ja | verarbeitet redigierte Diagnostics |
| `flush(reason)` | nein | leitet gepufferte Events aus |
| `dispose()` | nein | gibt Reporter-Ressourcen frei |

## Runtime Factories

| Factory | Zweck | Default |
|---------|-------|---------|
| `createNoopReporter()` | Default ohne externe Ausgabe | automatisch aktiv |
| `createReporterAdapter(options)` | generische Adapterflaeche fuer custom/enterprise Reporter | opt-in |
| `createConsoleReporter(options)` | lokale Console-Ausgabe fuer Entwicklung | opt-in |
| `createTestReporter(options)` | Memory Reporter fuer Gates und Tests | opt-in |

`createXtendFabric()` stellt dieselben Factories auch auf der Instanz bereit.

## Delivery-Regeln

- Reporter werden nur durch `fabric.registerReporter(reporter)` aktiv.
- Der Default `noop` sendet nichts extern.
- Reporter erhalten ausschliesslich bereits redigierte `xtend.fabric.diagnostic.v1` Events.
- `minimumLevel` filtert nach `debug`, `info`, `warn`, `error`, `fatal`.
- `filter(event, context)` kann Adapter-spezifisch entscheiden, welche Events weitergeleitet werden.
- `mapEvent(event, context)` darf Eventformen fuer Enterprise-Anschluesse vorbereiten, wird danach erneut redigiert.
- Reporter-Fehler erzeugen lokale Diagnostics mit `xtend.fabric.reporter.failed` und brechen die App nicht.

## Datenschutz und Security

Reporter duerfen keine Rohdaten aus DOM, Events, Forms, Headern, Cookies, Tokens, Queries oder Template-Markup erhalten. Fabric redigiert sensitive Felder vor Reporter-Ausgabe. Externe Reporter muessen explizit mit `external: true` markiert werden, damit spaetere Security- und Supply-Chain-Gates sie erkennen koennen.

## Beispiele

```js
const testReporter = window.XTendFabric.createTestReporter({
  minimumLevel: 'warn'
});

const unregister = fabric.registerReporter(testReporter);
fabric.emitDiagnostic({
  level: 'warn',
  code: 'xtend.fabric.probe',
  message: 'Reporter probe'
});
unregister();
```

```js
const enterpriseReporter = window.XTendFabric.createReporterAdapter({
  id: 'enterprise-probe',
  kind: 'enterprise',
  external: true,
  minimumLevel: 'error',
  capabilities: ['diagnostics', 'lifecycle-errors'],
  sink(event, context) {
    // Future enterprise transport hooks in here.
  }
});
```

## Handoff

| Paket | Status nach ER-WP-11 | Handoff |
|-------|----------------------|---------|
| `ER-WP-11` | completed | Fabric ist an `xstate`, API und XTendRMT Diagnostics angebunden |
| `ER-WP-16` | completed | baut Telemetry Snapshots und Backpressure auf Reporter-/Runtime-Diagnostics auf |
| `ER-WP-30` | completed | Supply-Chain-Gates koennen externe Reporter als opt-in Adapter pruefen |
