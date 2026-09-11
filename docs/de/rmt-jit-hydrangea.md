# RMT JIT Compiler Hydrangea

Hydrangea bündelt Compile, Safe Preview und optional die Maraca-Planung in einer Anfrage an die XTend Tooling Bridge. Der erste integrierte Host ist der [RMT Playground](./learn-rmt-playground.md). Die Funktion ist in 0.8.0 verfügbar; der Docs-Host verwendet ohne Konfiguration weiterhin `legacy`.

## Ausführungsmodell

Die additive Bridge-Operation `jit-compile` nutzt einen kurzlebigen Node-Prozess. Eine requestlokale Compilation Session verwendet Ergebnisse nur für identische effektive Eingaben wieder. Unterschiedliche Dokument-Defaults des Docs-Hosts und von Maraca bleiben getrennt. Parserdaten und semantische Graphen verlassen den Prozess nicht.

Sprache, Core-Dokument und bestehende Bridge-Operationen bleiben kompatibel. Hydrangea ist kein Runtime-Renderer und kein Hot-Reload-Protokoll: Eine erfolgreiche Playground-Vorschau bootet weiterhin neu. [FastPass und Abort Boundaries](./maraca-fastpass-abort-boundary.md) behandeln dagegen die Reaktionsfähigkeit und Gültigkeit laufender UI-Arbeit.

## Aktivieren und zurückschalten

Führe die Cachevorbereitung mit dem Benutzer aus, unter dem die PHP-/Node-Bridge laufen wird. Verwende einen privaten Pfad außerhalb des Webroots:

```sh
export XTEND_RMT_JIT_CACHE_DIR="$HOME/.cache/xtend-rmt-jit"
node tools/rmt-jit-cache-cli.js
export XTEND_RMT_JIT_MODE=hydrangea
```

Die Befehle gelten im Framework-Checkout. Das Compiler-Paket bietet zusätzlich den CLI-Einstieg `xtend-rmt-jit-cache` und den Export `@ccslabs/xtend-compiler/jit-kernel-cache`. `prepareRmtJitKernelCache({ rootDir, cacheDir })` liefert `key`, `cacheStatus`, `architectureChecks`, `artifacts` und `diagnostics`.

Der PHP-Host muss die Umgebungsvariablen erben. Prüfe auf dem Zielhost Dateirechte, PHP-FPM-Konfiguration, Prozesslimits und den vollständigen Browserablauf vor einer Umstellung. `XTEND_RMT_JIT_MODE=legacy` mit anschließendem Neustart beziehungsweise Reload des Hosts schaltet die Backend-Pipeline zurück. Der Schalter nimmt die gemeinsame Browser-Anfragekoordination nicht zurück.

Die öffentlichen Pakete benötigen Node **24 oder neuer**. Der spezielle Docs-Bridge-Smoke für Node 12.22.12 ist ein begrenzter Kompatibilitätsnachweis für diesen Hostpfad; er erweitert die Paketunterstützung nicht.

## Bridge-Vertrag

```js
const response = await executeToolingBridgeOperation({
  operation: 'jit-compile',
  payload: {
    source: 'template demo { surface card { lane visible { hydrate content } } }',
    filePath: 'demo.rmt',
    safePreview: { options: {} },
    metrics: true
  }
}, { rootDir });
```

`executeToolingBridgeOperation` gehört zu `tools/tooling-bridge.js`; `rootDir` ist der Framework-Root. `options` enthält Compileroptionen. Ein zusätzliches `maraca`-Objekt fordert die Maraca-Stufe an. Ohne dieses Objekt wird kein Kernelcache benötigt. `safePreview: false` deaktiviert nur die Safe-Preview-Stufe.

Die Antwort verwendet weiterhin `xtend.compiler.tooling-bridge-response.v1`. `result.compile` enthält `coreDocument`, `coreJson`, Diagnosen und Status; `result.safePreview` und `result.maraca` sind getrennte Stufenergebnisse oder `null`. `metrics: true` ergänzt Prozess-, Compile-, Architekturprüfungs- und Zeitmessungen. Prüfe die Statuswerte jeder angeforderten Stufe. Der Docs-HTTP-Formatter erhält seinen bestehenden Vertrag; Browser-Preview und Bridge-Antwort sind unterschiedliche Ebenen.

## Cache und Fehlerfälle

Der Dateicache speichert ausschließlich geprüfte Framework-Artefakte, keine Benutzerquellen. Sein Inhaltsfingerprint bindet Quellen, Templates, Manifest, Versionen, Generator-Abhängigkeiten, Cacheimplementierung, Framework-Root und Node-Version. Architektur- und Integritätsprüfungen bleiben verpflichtend. Node-Versionen verwenden getrennte Generationen.

Das Verzeichnis wird privat mit Modus `0700` angelegt, Dateien mit `0600`. Atomare Generationen, Prozesssperren und ein Budget von 128 MiB begrenzen den Cache. Ohne expliziten Pfad wird ein benutzer- und frameworkbezogener Pfad im System-Tempverzeichnis verwendet. Nach höchstens zwei Sekunden Warten auf einen konkurrierenden Erzeuger wird `cache_busy` gemeldet.

Fehlende oder während der Erzeugung veränderte Quellen und ungültige Architektur werden abgelehnt. Bei einem nicht beschreibbaren Cache kann die Bridge validierte Artefakte ohne Cache verwenden und meldet `unavailable`; die Vorbereitungs-CLI liefert dafür einen Fehler-Exit. Ein fehlgeschlagener Compile löst keinen automatischen zweiten Compile aus.

Die PHP-Bridge begrenzt stdin, stdout und stderr mit einer gemeinsamen Prozessfrist. Diese beginnt beim Node-Prozessstart und umfasst keine HTTP-Warteschlange vor PHP. Ein Abbruch beendet den betroffenen Prozess; er ersetzt keine Host-Lastbegrenzung.

## Playground unter schnellen Eingaben

Es läuft höchstens eine Compile-/Diagnoseanfrage gleichzeitig. Pro Operation bleibt der neueste ausstehende Quellstand erhalten; Compile hat Vorrang. Die Verzögerungen betragen 300 ms für Compile und 160 ms für Diagnosen. Run macht Compile sofort ausführbar.

Neue Eingaben invalidieren alte Ergebnisse, ohne bei jedem Tastendruck per Fetch-Abbruch neue Backend-Arbeit anzustoßen. Route-Verlassen beendet Fetches, Scheduler-Jobs und Preview-Instanzen. Verspätete Preset- oder Preview-Boot-Ergebnisse werden gegen ihre Generation geprüft. Dieses Browserverhalten gilt auch mit dem Legacy-Backend.

## Prüfen

```sh
node scripts/run_xtend_tests.js rmt-jit-hydrangea rmt-playground-docs rmt-playground-security --json
node tests/docs/fixtures/rmt_playground_legacy_runtime_smoke.cjs
```

Die Fixtures prüfen Ergebnisgleichheit, Cacheintegrität, konkurrierende Erzeugung, Optionsisolation, Request-Koordination und verspätete Abschlüsse. Historische Messungen und reproduzierbare Skripte liegen unter `tests/performance/hydrangea/`; HTTP-Compilezeit, Cachezustand und vollständiger Preview-Boot müssen getrennt gemessen werden. Diese Werte sind keine allgemeine Latenzgarantie.

## Weiterführend

- [RMT App Platform Tooling](./rmt-app-platform-tooling.md)
- [RMT Playground](./learn-rmt-playground.md)
- [XTend Maraca](./xtend-maraca.md)
- [Release-Verifikation](./release-verification.md)
