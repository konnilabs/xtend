# RMT Action Effect Runtime

- Contract: `xtend.epic18.rmt-action-effect-runtime.v1`
- Workpackage: `WP-E18-08`
- Runtime: `xtendrmt/rmt-action-effect-runtime.js`
- Types: `xtendrmt/rmt-action-effect-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-action-effect-runtime.rmt`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-action-effect-runtime --json`
- Naechstes Paket: `WP-E18-09`

## Zweck

Die Action Effect Runtime macht haeufige App-Flows zu nativen RMT-App-Platform-Primitives. Apps koennen Fixture-, REST-, SSR- oder Host-Adapter-Daten laden, typisierten State aktualisieren, Feedback veroeffentlichen, navigieren, Controls fokussieren, Module lazy laden und Ressourcen besitzen, ohne produktlokale Action-Frameworks aufzubauen.

Die Runtime ist bewusst domain-neutral. Sie definiert keine Produktsurfaces und keine Record-Taxonomien. Entwickler liefern ihre eigenen Actions, Contracts, Adapter, Effects und Resources.

## DataSources

Unterstuetzte Datasource-Arten:

- `fixture`: liefert statische Fixture-Records fuer lokale App-Fixtures und Tests.
- `rest`: ruft einen injizierten Adapter mit Endpoint und Payload auf.
- `ssr`: liest ein vorhydriertes Payload und kann es mit `resultPath` projizieren.
- `host`: ruft einen expliziten Host-Adapter fuer Mutationen oder Plattformkommandos auf.

Runtime-Code greift niemals direkt auf globale Netzwerk-APIs zu. REST und Host laufen ueber injizierte Adapter, damit Browser-, Server-, Test- und Shell-Umgebungen ihre eigene Transport-Policy waehlen koennen.

## Actions

Eine Action kann deklarieren:

- `datasource`
- `resultState`
- `loadingState`
- `statusState`
- `effects`
- `resources`
- `resourceOwner`
- `cancelable`

`runAction(id, payload)` fuehrt die Action durch Loading-, Success-, Error- oder Cancelled-Zustaende. Wenn eine typed State Runtime uebergeben wird, werden Loading und Status ueber `setState` und `patchState` geschrieben; Datasource-Ergebnisse koennen in `resultState` gespeichert werden.

## Effects

Unterstuetzte Effect-Arten:

- `toast` und `feedback`
- `navigation`
- `focus`
- `lazy-import`
- `side-effect`

Feedback, Navigation, Focus und eigene Side Effects nutzen injizierte Adapter. Lazy Imports werden als Ressourcen modelliert und koennen dadurch dasselbe Ownership- und Cleanup-Modell wie andere Runtime-Ressourcen teilen.

## Resource Ownership

Unterstuetzte Resource-Arten:

- `object-url`
- `stream`
- `observer`
- `timer`
- `lazy-import`

Ressourcen werden unter einem Owner erworben, normalerweise der Action-ID. Der Resource Manager stellt `releaseOwner(ownerId)` bereit, damit Surface-Destroy, Render-Unit-Destroy oder Action-Cancel nur die Ressourcen bereinigen, die ihnen gehoeren.

## Diagnostics

Die Runtime emittiert Diagnostics mit `xtend.epic18.rmt-action-effect-diagnostic.v1` auf dem Channel `rmt.app_platform.action_effect`. Loading, Success, Error und Cancel sind in der lokalen Runtime-History und in einem optionalen Diagnostics Hub sichtbar.

## Boundaries

- Der RMT-Kernel importiert keine XTend-UI-Komponenten.
- Datenzugriff laeuft ueber injizierte Adapter.
- Produktlokale Action-Frameworks sind nicht Teil des Plattformvertrags.
- Produkt-Flow-Namen bleiben App-Code, nicht Framework-Defaults.
- Normale App-UI nutzt weiterhin RMT-Templates und DOM-Descriptors statt HTML-String-Renderern.

## Handoff

`WP-E18-09` baut auf dieser Runtime auf, indem deklarative DOM- und Custom Events an Actions angeschlossen werden. Die Event-Schicht soll die Action Effect Runtime wiederverwenden, statt einen weiteren Action-Ausfuehrungspfad zu erzeugen.
