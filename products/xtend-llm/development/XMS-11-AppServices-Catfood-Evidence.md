# XMS-11 – AppServices-Catfood-Evidenz

Stand: 2026-07-19

## Ergebnis

Der Host-Datasource-Pfad des XTend-LLM-Controllers ist auf die öffentliche Maraca-AppServices-Registry migriert. Der fail-closed Produktions-Gate `npm run test:catfood:ci` prüft in CI ausschließlich Build und Contracts und benötigt kein Electron; `npm run test:catfood` ist der kurze Alias darauf. Der Layout-/Electron-Flow bleibt als ausdrücklich lokale/manuelle Produkt-Owner-Evidence getrennt und ist keine GitHub-, Release- oder Publish-Voraussetzung.

| Evidenz | Ergebnis |
| --- | --- |
| RMT-Servicebedarfe | 27 |
| Browserimplementierungen | 27 |
| Invoke-/Stream-Aufteilung | 26 / 1 |
| Strict-Diagnosen | 0 |
| Manifest | `xtend.maraca.app-services-manifest.v1` |
| Manifest-Fingerprint | `537abb7d629522b7e32efa29cc0ff4ed6cbd370101567b7f357e7cdfae1b25a1` |
| TypeScript | 5.9.3, Program-Typecheck plus Rollup-Transform |
| AppService-Anteil im Produktionsbundle | 56.486 Byte bei explizitem 65.536-Byte-Budget |

Die maschinenlesbare Evidenz wird bei jedem Lauf unter `.xtend-llm-results/app-services-catfood.json` mit dem Schema `xtend-llm.app-services-catfood-report.v2` neu erzeugt. V2 unterscheidet den CI-sicheren `mode: "ci"` mit `smoke.required: false` und `smoke.status: "not-run"` explizit von `mode: "electron"` mit echter Layout-/Screenshot-Evidenz. Buildartefakte müssen vorhanden und neuer als RMT-, Service-, Controller-, Shell- und Buildquellen sein; fehlende oder veraltete Artefakte führen zum Fehler.

## Vollständig migriert

- `src/services.ts` deklariert alle RMT-Hostbedarfe über `defineAppServices` und `service`; zusätzliche oder fehlende IDs existieren nicht.
- Der frühere 26-Case-`hostDataSourceAdapter` und die manuelle Übergabe von `dataSourceAdapters.host` sind entfernt.
- Der Controller startet Maraca nicht mehr selbst. Er reagiert auf `xtend-maraca:boot` und verwendet ausschließlich `window.XTendMaraca` als öffentliche Runtime-Oberfläche.
- Zugriffe auf `window.__XTendMaracaResult`, `window.__XTendMaracaOrchestration` und `window.__XTendMaracaDisableAutoBoot` sind entfernt.
- `site/index.html` lädt nur noch das generierte Maraca-ESM. Controller und Businessmodule gelangen über den TypeScript-Servicegraph in dasselbe Bundle.
- Selbst erzeugte `activeRunId`- und `Date.now()`-Korrelationen sind entfernt. `activeJobId` bleibt ausschließlich als fachliche Backend-/Worker-Job-ID erhalten.
- `xtend.llm.generationStream` ist ein RMT-demanded AppService mit `kind: stream`, `target: local` und `concurrency: latest`. Maraca erzeugt Invocation-/Correlation-IDs, sequenziert Frames, unterdrückt verspätete beziehungsweise doppelte Terminalframes und bricht den Stream bei Cancel oder Dispose ab.
- Delta-, Complete- und Error-Events werden vor jeder Zustandsänderung gegen die aktive fachliche Job-ID geprüft; verspätete Worker-Events eines abgebrochenen Jobs können den Nachfolger nicht abschließen.
- Die generierten Deklarationen enthalten alle Service-IDs und Modi. Nicht deklarierte Result-Shapes bleiben `unknown`; `any` kommt im generierten Vertrag nicht vor.

## Lokale Runtime-Evidenz

Der Headless-Electron-Flow wurde um AppService-Evidenz erweitert. `npm run test:catfood:electron` kann lokal/manuell zusätzlich prüfen; `npm run test:catfood:smoke` bleibt ein Compatibility-Alias auf denselben lokalen Lauf:

- Event → RMT-Action → `xtend.llm.send` → `xtend.llm.generationStream` → State → Render,
- genau eine User- und eine Assistant-Nachricht,
- erfüllte Send- und Stream-Invocations mit Invocation-/Correlation-ID,
- 27 registrierte Services, keine Listenerfehler und keine aktiven Invocations nach Abschluss,
- maschinenlesbaren Report `.xtend-llm-results/layout-smoke.json` inklusive Screenshot-Hash.

Dieser Smoke setzt ein lokal installiertes Electron-Binary und eine korrekt konfigurierte Host-Sandbox voraus. Er wird deshalb in GitHub Actions weder direkt noch transitiv aus PR-, Full-Release-, Nightly- oder Publish-Aggregaten gestartet. Ein fehlender beziehungsweise auf GitHub nicht startbarer Electron-Smoke lässt die lokale Desktop-Evidence offen, ändert aber nicht die Abnahme des Electron-freien Produktionsbuilds und Contract-Catfoods. Ein Lauf mit deaktivierter Sandbox gilt nicht als Ersatz-Evidenz.

## Verbleibende Grenze

Ein schmaler Produkt-Bridge bleibt bestehen: `forwardGenerationServiceFrame` übergibt die bereits von AppServices normalisierten Frames an die öffentliche `appRuntime.handleStreamPatch`-API, damit die vorhandenen RMT-Stream-Reducer, Backpressure-Telemetrie und Rendersemantik unverändert bleiben. Diese Bridge erzeugt keine IDs, führt keine Sequenzierung durch und entscheidet nicht über Terminalzustände.

Für ihre vollständige Entfernung benötigt die zentrale Maraca/RMT-Integration einen direkten Adapter von `AppServiceStreamFrame` auf `scheduledAppRuntime.streamService` beziehungsweise einen deklarativen Stream-Effect, der gleichzeitig den sofortigen Snapshot-Return des bestehenden Send-Actions erhält. Das ist kein produktlokaler Fix, ohne die derzeitige Action-/UI-Semantik zu verändern.

Die RMT-Datasources besitzen außerdem noch keine benannten Output-Contracts; deshalb sind die generierten Outputs korrekt als `unknown` typisiert. Das Service-Wiring ist dadurch strict und ID-/Modus-sicher, aber die fachlichen Snapshot-Resultate sind noch nicht strukturell typisiert.
