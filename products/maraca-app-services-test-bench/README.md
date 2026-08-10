# Maraca App Services Test Bench

Diese Anwendung ist die produktive Catfooding-Referenz für Maraca App Services in XTend 0.6.1. HTML-Host, App Shell, Runtime-Bootstrap, TypeScript-Transpilierung, Service-Manifest, Node-Host und Build-Artefakte entstehen ausschließlich über den öffentlichen XTend-/Maraca-Workflow.

## Reproduzierbare Erzeugung

Vom XTend-Repository-Root:

```sh
xt create app --runtime maraca --design-kit material --server node \
  --name maraca-app-services-test-bench \
  --title "Maraca App Services Test Bench" \
  --out products/maraca-app-services-test-bench --write --json
```

Die Scaffold-Provenance liegt in `.xtend-build/scaffold-ownership.json`. Ein unverändertes Scaffold lässt sich ohne Schreibzugriff prüfen:

```sh
xt create app --runtime maraca --design-kit material --server node \
  --name maraca-app-services-test-bench \
  --title "Maraca App Services Test Bench" \
  --out products/maraca-app-services-test-bench --check --json
```

## Entwicklungsablauf

Node 24 oder 26 ist erforderlich, weil das Backend die eingebaute `node:sqlite`-API nutzt.

```sh
npm run plan
npm run build
npm run tune
npm run serve
```

`start` und `serve` bauen zuerst und starten anschließend ausschließlich den CLI-generierten `server/index.mjs`. Der Host bindet standardmäßig an `127.0.0.1:4173`. Für Tests können `XTEND_MARACA_HOST`, `XTEND_MARACA_PORT` und `XTEND_MARACA_TEST_BENCH_DB_PATH` gesetzt werden; Port `0` wählt einen freien dynamischen Port. Source Maps, TypeScript-Quellen/-Deklarationen sowie Build-/Size-Reports sind über den Host nicht öffentlich erreichbar.

## Funktionsnachweis

Die Oberfläche demonstriert die vollständige öffentliche XTextarea-API: Validierung, Counter, Label-/Hint-/Error-Slots, Dichte, Fill, Busy, Disabled, Readonly, Invalid, Plain-Text-Highlighting, Zeilennummern, Sprache, Fokus, Reset, Snapshot sowie `textarea-changed`, `textarea-invalid` und `textarea-submit`.

- `Enter` löst die RMT-Save-Action aus.
- `Shift+Enter` bleibt ein Zeilenumbruch.
- `Load latest 20` lädt bewusst die persistierte Historie.
- Alle UI-Zustände werden durch RMT-State und RMT-Reducer gesteuert.
- Persistierter Inhalt wird als Textknoten in einem RMT-Repeater gerendert.

Die beiden servergerichteten App Services sind:

- `maraca.testbench.text.save`: serieller Command, der Plain Text speichert und die neuesten 20 Einträge zurückgibt.
- `maraca.testbench.text.list`: `latest` Query für die neuesten 20 Einträge.

Die Save-Action deklariert ihre Eingabe-TrustBoundary in `src/app.rmt`. Der Browser sanitized vor dem Transport; der generierte Node-Host validiert und sanitized autoritativ erneut. CRLF wird zu LF normalisiert. NUL und unzulässige Steuerzeichen werden abgewiesen. Leere Eingaben nach Trim-Prüfung und Texte über 4.000 Zeichen werden nicht gespeichert.

## Evidence

Vom Repository-Root läuft das Nightly-nahe Produktgate mit:

```sh
npm run test:maraca-app-services-test-bench:report
```

Oder direkt in diesem Produkt:

```sh
npm run test:catfood
```

Der produktive Test baut die App, startet den generierten Node-Host auf einem dynamischen Port, fährt Chromium headless und prüft Browser- sowie Server-TrustBoundary, SQLite-Normalisierung, die neuesten 20 Einträge und Persistenz über einen Host-Neustart. Er erzeugt:

- `.xtend-test-results/maraca-app-services-test-bench-evidence.json` mit Schema `xtend.maraca-app-services-test-bench-evidence.v1`
- `.xtend-test-results/maraca-app-services-test-bench.png`

Die Evidence ist redigiert. Die Testdatenbank wird temporär erzeugt und nicht veröffentlicht.

## Dateieigentum

Scaffold Ownership v2 trennt editierbare Seeds von frameworkverwalteten Dateien.

Editierbare `seed`-Quellen:

- `src/app.rmt`
- `src/app.css`
- `src/services.ts`
- `src/server-services.ts`

`managed` und ausschließlich über `xt create` zu aktualisieren:

- `site/index.html`
- `server/index.mjs`
- `src/material-runtime-host.mjs`
- `src/material-dev-api.mjs`
- `maraca.config.json`
- `package.json`
- `tsconfig.json`
- `test/material-app.smoke.test.cjs`

Produkt-README und Catfood-Test dokumentieren bzw. verifizieren das Produkt und sind keine Runtime-Controller.

## Strikte Catfooding-Grenze

In produktiven App-Quellen sind die folgenden Ausweichpfade verboten:

- produktlokale Controller oder DOM-Orchestrierung
- direkter `fetch` oder eigene Transportadapter
- eigene HTTP-Server, Routen oder Port-Bindings
- manuelles Runtime-Bootstrapping
- DOM-Abfragen, `innerHTML` oder private XTend-Globals
- SQLite-Zugriff außerhalb von `src/server-services.ts`
- handgeschriebener HTML-Host, App Shell, TypeScript-Build oder Server-Startcode

Fehlt für die Anwendung eine Fähigkeit oberhalb von RMT, minimalem XTM-CSS oder den offiziellen Browser-/Server-AppService-Dateien, muss der Plan oder Build hart scheitern. Die Fähigkeit wird dann im zuständigen XTend-/Maraca-Frameworkvertrag ergänzt, nicht lokal umgangen.
