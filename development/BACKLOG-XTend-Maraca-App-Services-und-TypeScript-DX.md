# XTend Maraca AppServices und TypeScript DX Backlog

- Status: `mvp-implemented-electron-evidence-local-optional`
- Initiative: `XMS`
- Priorität: `P0` für XMS-01 bis XMS-12, `P1` für XMS-13
- Source of Truth: dieses Backlog plus ausführbare lokale Gates
- Verwandt: `development/XScaler-Luecken-und-Drift-Closure-Plan.md`

## Ziel

Eine mit der XTend CLI erzeugte Maraca-App benötigt für produktindividuelle Entwicklung nur RMT, CSS beziehungsweise XTM-Theming und AppServices. Browser-, Node- und PHP-Implementierungen verwenden dieselben Service-IDs und Wire-Verträge, ohne dass Produktcode Maraca-Bootstrap, DOM-Wiring, `dataSourceAdapters`, `hostServiceAdapters` oder interne `window.__XTend*`-Handles pflegen muss.

## Architekturgrenzen

- RMT bleibt Source of Truth für Shell, Service-ID, Modus, Contract und aufrufende Actions.
- `src/services.ts` enthält Browserlogik und explizite Server-Proxies.
- `src/server-services.ts` ist Node-only; `server/server-services.php` ist PHP-native. Beide dürfen niemals Teil des Browsergraphen werden.
- Maraca stellt Runtime, Build, Manifest und HTTP-/NDJSON-Adapter, aber keinen API-Server, keine Authentifizierung, Datenbankintegration oder Deployment-Plattform.
- XScaler gilt ausschließlich für remote geladene Surface-/XTension-Serviceadapter. Lokale und normale Backend-Services verwenden kein XScaler-Preflight.
- Der RMT-Kernel führt keinen Remote-Code aus. SSR öffnet kein Netzwerk und lädt keine Remote-Module.

## MVP-Metriken

- Ein generiertes Projekt baut Browser-ESM/CSS, Node-ESM, Service-Manifest und PHP-Validierungsreport mit einem Befehl.
- Eine neue Query oder ein neuer Stream erfordert nur RMT plus TypeScript beziehungsweise PHP-Handler; kein Bootstrap- oder DOM-Code.
- Fehlende IDs, falsche Modi und Zielkollisionen sind quellgenaue Buildfehler im Strict-Modus.
- Ein Sentinel-Secret aus Serverquellen erscheint weder im Browserbundle noch in Client-Sourcemaps oder Reports.
- `latest`, `serial`, `parallel`, Abort, Dispose, Streamreihenfolge und Exactly-once-Terminalzustand sind deterministisch getestet.
- Node und PHP erzeugen für dieselben Fixtures dieselben Wire-Frames.
- XScaler-Ablehnung führt zu null Remote-Import und null Remote-Ausführung.
- Der XTend-LLM-Catfood-Pfad benötigt keinen großen Host-Datasource-Switch und keine eigene Run-/Stream-Korrelation mehr.

## Definition of Ready

Ein Ticket ist bereit, wenn öffentliche Shapes, Eigentumsgrenze, Abhängigkeiten, relevante Bestands-APIs und ein ausführbarer Gate-Befehl benannt sind. Security- oder Transporttickets benötigen zusätzlich negative Fixtures.

## Definition of Done

Ein Ticket ist abgeschlossen, wenn Implementierung, präzise Typen, mindestens ein Negativtest, Dokumentation beziehungsweise Migrationsnotiz und Runner-/CI-Verdrahtung gemeinsam vorliegen. Reportartefakte dürfen keine Payloads, Tokens, Secrets oder Stacktraces ausgeben.

## Priorisiertes Backlog

| ID | Prio | Status | Abhängigkeit | Ergebnis | Blockierendes Gate |
| --- | --- | --- | --- | --- | --- |
| XMS-00 | P0 | completed | – | Baseline/ADR für Service, Endpoint und Remote Surface; DX-Messgrößen | `ADR-XMS-001-Maraca-AppServices.md` |
| XMS-01 | P0 | completed | XMS-00 | RMT-Service-Bedarfsmanifest, generierte Deklarationen, öffentliche API, Strict-Diagnostik | `rmt-vnext-compiler`, `maraca-app-services-build` |
| XMS-02 | P0 | completed | XMS-01 | Eine Registry, Abort, Concurrency, Stale-Suppression, Streamregeln, Dispose | `maraca-app-services-runtime` |
| XMS-03 | P0 | completed | XMS-01 | TypeScript-Provider, vollständiges Typechecking, getrennte Graphen, Sourcemaps, Secret-Barriere | `maraca-app-services-build` |
| XMS-04 | P0 | completed | XMS-02 | Versionierte JSON-/NDJSON-Frames, Fetch-Transport, sichere Fehler und Disconnect-Abort | `maraca-app-services-runtime`, `maraca-app-services-cross-runtime` |
| XMS-05 | P0 | completed | XMS-03, XMS-04 | Importierbares Node-ESM-Bundle und request-scoped Host-Adapter | `maraca-app-services-cross-runtime`, `rmt-node-ssr-adapter` |
| XMS-06 | P0 | completed | XMS-04 | PHP-Callable-Registry, Manifestvalidierung und Node/PHP-Frame-Parität | `rmt-php-app-service-adapter`, `maraca-app-services-cross-runtime` |
| XMS-07 | P0 | completed | XMS-03, XMS-05, XMS-06 | Provider-neutraler Scaffold und XTM-Overlay mit Servicequellen | `xtend-rmt-app-scaffold`, `xtend-material-scaffold` |
| XMS-08 | P0 | completed | XMS-03 | Servicegraph-Fingerprint, getrennte Framework-/App-Budgets und Tune-Drift | `maraca-app-services-build`, `maraca-size-budget`, `maraca-tune` |
| XMS-09 | P0 | completed | XMS-00 | Öffentliche, stark typisierte XScaler-API, JSON-Schemas und PHP-Parität | `xscaler-public-api`, `xscaler-php-preflight-parity`, `xsurface-shard` |
| XMS-10 | P0 | completed | XMS-02, XMS-09 | Preflight-vor-Import, SRI-Registrierung, ATC-Lifecycle und CSP-Fallback | `xscaler-public-api`, `xscaler-source-to-sea`, `rmt-xscaler-ssr-hydration-parity` |
| XMS-11 | P0 | completed; local Electron evidence optional | XMS-01–XMS-10 | Generierte XTM-App, Browser Source-to-Sea und Electron-freies XTend-LLM-Build-/Contract-Catfood | `maraca-app-services-build`, `xtend-llm-app-services-catfood` |
| XMS-12 | P0 | completed | XMS-11 | Guides, Diagnosekatalog, Migration, Package-/CI-/Release-Gates | AppServices-/XScaler-Aggregate, Export-, Typ- und Docs-Gates |
| XMS-13 | P1 | deferred | XMS-03, Node-Floor-Entscheidung | Vite ausschließlich als Dev-/HMR-Provider evaluieren | eigenständiger Spike-Report |

## Ticketdetails

### XMS-00 – Baseline und ADR

- Erfasse manuelle Boot-, Adapter-, Correlation- und Streamlogik aus dem XTend-LLM-Controller als messbare Ausgangslage.
- Lege fest: In-Process-Service, generischer Serverendpoint und XScaler Remote Surface sind getrennte Deploymentklassen.
- Gate: Eine Architekturprüfung verhindert XScaler-Imports für lokale beziehungsweise normale HTTP-Services.

### XMS-01 – Service-Manifest und Typen

- Der Compiler emittiert `xtend.maraca.app-service-demands.v1` mit ID, Datasource, `invoke|stream`, Contract und Actions.
- Maraca verbindet Bedarf und statisch analysierbare `defineAppServices`-/`defineServerServices`-Definitionen zu `xtend.maraca.app-services-manifest.v1`.
- Bekannte Typfakten werden generiert; nicht auflösbare Werte sind `unknown`, nie `any`.
- Strict: fehlend, falscher Modus oder Zielkollision ist Fehler; zusätzliche Implementierungen sind Warnungen.

### XMS-02 – Runtime-Härtung

- Vereinheitliche Host-Datasource- und Host-Service-Pfade hinter einer Registry.
- Nutze monotone IDs und reiche `AbortSignal` durch alle Handler-/Transportgrenzen.
- Defaults: Query/Stream `latest`, Command `serial`, `parallel` nur explizit.
- Verhindere Stale-Commits; dedupliziere Frames; akzeptiere genau einen Terminalzustand.
- Dispose bricht App-, Request-, Stream- und ATC-Arbeit vollständig ab.

### XMS-03 – TypeScript-Buildprovider

- Öffentliche Lifecycle-Grenze `inspect → plan → build → report → dispose`.
- TypeScript-Program-Typecheck vor Rollup-Transformation; `noEmitOnError`, strict und Original-Sourcemaps.
- Getrennte Browser-/Node-Graphen. Node-Builtins, Server-Entry sowie `process.env`, `Deno.env`, `Bun.env` und `import.meta.env` blockieren den gesamten auflösbaren Browsergraph; öffentliche Konfiguration kommt explizit vom App-Host.
- Der lokale Fallback-Bundler verweigert aktivierte TypeScript-Services; keine stille Teiltranspilierung.

### XMS-04 – Transport

- Standardroute `POST /api/xtend/services/:serviceId`, konfigurierbarer Base-Path.
- Versionierte Request-, Response- und Stream-Frames mit Service-, Invocation-, Correlation- und Sequenz-ID.
- NDJSON-Streams haben monotone Sequenzen und genau einen `complete|error|cancelled`-Frame.
- Keine automatischen Retries; Auth/Header bleiben Host-Hooks; Produktionsfehler enthalten keine Stacks oder Payloads.

### XMS-05/XMS-06 – Serverziele

- Node erzeugt ein importierbares ESM-Artefakt, keinen lauschenden Server.
- PHP führt kein TypeScript aus, sondern registriert Callables gegen dasselbe Manifest.
- Browser ist app-scoped, Node/PHP sind request-scoped. Disconnect und `finally` lösen Cleanup aus.
- Gemeinsame Fixtures prüfen Frame-Parität, Abort und Fehlerredaktion.

### XMS-07 – CLI und Scaffolds

- Basisgenerator: RMT, CSS, `services.ts`, Config, Package, Host und Smoke ohne Design-Kit-Abhängigkeit.
- XTM-Overlay ergänzt Tokens/Tailwind, ändert aber Service- und Runtimevertrag nicht.
- `--server node|php|both|none` erzeugt ausschließlich benötigte Serverquellen.
- Runtime-Host enthält weder manuellen Maraca-Boot noch Produkt-DOM-Wiring.

### XMS-08 – Reports und Budgets

- Service-Graph und Target-Zuordnung fließen in Config-/Tune-Fingerprints ein.
- Framework- und AppService-Bytes werden getrennt ausgewiesen; Serverbytes zählen nie zum Browserbudget.
- Reports nennen IDs, Targets, Artefakthashes und Diagnostics, jedoch keine Werte aus Environment, Payload oder Fehlerstack.
- `tune --write` aktualisiert dieselbe `maraca.config.json`, die `plan` und `build` konsumieren, ohne Serviceziele, Strict-Modus oder CSS-/XTM-Eingaben zu verlieren.

### XMS-09/XMS-10 – First-class XScaler

- Stabilisiere `@ccslabs/xtend/xscaler` mit konkreten Typen und maschinenlesbaren Schemas.
- Nur `target: remote-surface` aktiviert XScaler.
- Accepted Preflight ist notwendige Vorbedingung für SRI-geprüfte Modulregistrierung.
- Rejection, Integrity- oder CSP-Fehler: null Import/null Ausführung, Surface-Fallback und redigierte Diagnose.
- ATC Attach/Cancel/Detach/Dispose wird an Invocation und Stream gekoppelt; Kernel-No-Remote-Execution bleibt Gate.
- Node/PHP-SSR validieren beziehungsweise transportieren Preflight-Fakten, öffnen im Renderpfad aber weder Netzwerk noch Remote-Code.

### XMS-11/XMS-12 – Source-to-Sea und Release

- Generiere und baue eine XTM-Referenzapp für Browser, Node und PHP.
- Catfood migriert mindestens den Host-Datasource-Switch sowie Run-/Stream-Korrelation des XTend-LLM-Controllers.
- Registriere neue Suites im Runner, in Package-Scripts und Default-/Release-Gates.
- Dokumentiere Authoring, Transporthosting, PHP/Laravel, XScaler-Remoteadapter, Migration und Diagnosecodes auf Deutsch und Englisch.

## Evidenzmatrix

| Evidenz | Erwartung |
| --- | --- |
| Compiler-Report | deterministisches Demand-Manifest und stabiler Fingerprint |
| Service-Buildreport | TypeScript-Version, Targets, Manifest, getrennte Dateien und redigierte Diagnostics |
| Security-Fixture | Server-Sentinel fehlt vollständig in Browserbundle, Map und Report |
| Runtime-Race-Suite | invertierte Abschlussreihenfolge, Abort, Dispose und verspätete Frames bleiben deterministisch |
| Node/PHP-Parität | identische JSON-/NDJSON-Schemas, Sequenzen und Terminalstatus |
| XScaler SSR-Parität | identische Node/PHP-Hydration und Head-Hints; null Fetch und null Remote-Ausführung im Renderpfad |
| Browser-Smoke | Event → Action → Service → State → Render ohne Produkt-Wiring |
| XScaler Source-to-Sea | Reject = zero load; Accept = Preflight → SRI → ATC → Service/Stream → Dispose |
| Catfood-Report | `products/xtend-llm/.xtend-llm-results/app-services-catfood.json`; kein großer Host-Switch, keine eigene Correlation-Runtime, keine internen Maraca-Globals |

## Implementierte Evidenzartefakte

- Architekturentscheidung: `development/ADR-XMS-001-Maraca-AppServices.md`
- Authoring-Guides: `docs/de/maraca-app-services.md` und `docs/en/maraca-app-services.md`
- RMT-Bedarf und zusammengesetztes Manifest: `tools/rmt-language/vnext-compiler.js` und `xtend-maraca/service-build-provider.js`
- Browser-/Node-Runtimes: `xtend-maraca/app-services.js`, `xtend-maraca/server-services.js` und `xtend-maraca/node-app-service-host.js`
- PHP-Ziel: `xtendrmt/rmt-php-app-service-adapter.php`
- Basis- und XTM-Scaffolds: `xtend-builder/generators/rmt-app.js`, `xtend-builder/generators/material-app.js` und `xtend-builder/templates/app/`
- First-class XScaler: `xscaler/`, inklusive JSON-Schemas, Loader, Service-Transport und PHP-Evaluator
- Paritäts- und Browserbelege: `tests/maraca/maraca_app_services_cross_runtime_parity_suite.js`, `tests/rmt-language/rmt_xscaler_ssr_hydration_parity_suite.js` und `tests/maraca/maraca_app_services_build_suite.js`
- Produkt-Catfood: `products/xtend-llm/development/XMS-11-AppServices-Catfood-Evidence.md`
- Aufgeschobener Dev-/HMR-Pfad: `development/XMS-13-Vite-Dev-HMR-Spike.md`

Der Catfood-Pfad behält bewusst nur eine schmale Übergabe normalisierter Frames an die öffentliche `appRuntime.handleStreamPatch`-API. Diese Bridge erzeugt weder IDs noch Sequenzen oder Terminalzustände; eine direkte deklarative Frame-Effect-Anbindung bleibt eine mögliche Post-MVP-Vereinfachung.

Der fail-closed Build-/Contract-Catfood `test:catfood:ci` ist Electron-frei und über den kurzen Alias `test:catfood` in PR-, Release- und Nightly-CI verdrahtet. `test:catfood:electron` bleibt als lokale/manuelle Produkt-Owner-Evidence erhalten; `test:catfood:smoke` ist nur ein Compatibility-Alias darauf. Wegen der auf GitHub-Runnern nicht zuverlässig konfigurierbaren SUID-Sandbox wird Electron weder transitiv aus einem CI-Aggregat gestartet noch als Release- oder Publish-Voraussetzung geführt; `--no-sandbox` gilt nicht als Ersatz-Evidenz.

## Release-Regel

XMS-01 bis XMS-12 sind gemeinsam MVP-blockierend. Die XMS-11-Abnahme stützt sich dabei auf den Electron-freien AppServices-Build-/Contract-Catfood; lokale Electron-Evidenz ist nicht MVP-, Release- oder Publish-blockierend. Insbesondere darf XMS-10 nicht durch ungeprüften `import()`-Fallback, gelockerte CSP-Regeln oder Remote-Ausführung im RMT-Kernel umgangen werden. Vite ist kein Bestandteil des produktiven MVP-Pfads.
