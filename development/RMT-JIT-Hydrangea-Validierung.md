# Hydrangea – lokale Validierung

Stand: 09.09.2026. Ausgangsstand `31c16dd`, Implementierung im Working Tree.

## Ergebnis

Die neue Pipeline besteht den Vergleich mit den vorab gesicherten Legacy-Verträgen für acht Quellen. Der HTTP-Vergleich umfasst die vollständigen Antworten einschließlich Safe Preview, Diagnosen und Maraca. Die Pipeline bleibt hinter `XTEND_RMT_JIT_MODE=hydrangea`; ohne Einstellung gilt `legacy`.

Lokale QS: <http://127.0.0.1:8081/docs/de/learn-rmt-playground>. Der bestehende Server auf Port 8080 bleibt als Legacy-Vergleich verfügbar. Beide sind ausschließlich lokal gebunden. Kein Push und keine Änderung des Produktionshosts wurden durchgeführt.

## HTTP-Performance

PHP 8.3.6, Node 24.19.0, gleicher QS-Rechner, jeweils frischer Node-Prozess. Vollständige JSON-Antwort mit Maraca; Browser-Rendering ist separat erfasst.

Die endgültigen Zahlen stammen aus `tests/performance/hydrangea/evidence/http-warm.json` (30 Aufrufe je Quelle) und `http-cold.json` (10 Aufrufe je Quelle und Modus). Die Kaltmessung verwendet einen isolierten Cache und zwei temporäre PHP-Server. Ein Node-Wrapper zählt tatsächliche Prozessstarts: Legacy benötigt drei, Hydrangea einen pro Compile-Anfrage. Die Skripte prüfen Antworten und Budgets automatisch.

| Warmer Cache, 30 Aufrufe | Median | p95 | Ziel-Median |
| --- | ---: | ---: | ---: |
| Minimalbeispiel | 157 ms | 171 ms | <= 250 ms |
| Customer Service | 289 ms | 312 ms | <= 500 ms |

| Kaltstart, 10 Aufrufe | Legacy-Median | Hydrangea-Median |
| --- | ---: | ---: |
| Minimalbeispiel | 1649 ms | 827 ms |
| Customer Service | 1893 ms | 902 ms |

Für Customer Service benötigt die kompakte Bridge-Antwort rund 1,15 MB statt zuvor 6,30 MB für die Compilerstufe allein. Das vereinbarte Limit von 1,5 MiB wird eingehalten. Der abschließende HTTP-Inhalt bleibt mit rund 1,00 MB unverändert.

## Browser

Echter Docs-Lauf mit Chrome for Testing 153.0.8010.36:

- Initiale Vorschau, zehn schnelle Eingaben und anschließend Customer-Service-Preset mit 15 Surfaces erfolgreich.
- Höchstens eine gleichzeitige Compile-/Diagnoseanfrage.
- Run-Button während der Nutzung und Abbruch beim Routenabbau erfolgreich.
- Keine erfassten JavaScript-Fehler oder unbehandelten Promise-Rejections.
- Vollständiger Preview-Boot nach HTTP-Antwort: ungefähr 1.131 ms initial, 1.016 ms nach Eingaben, 1.142 ms für Customer Service. Diese Zahlen stammen aus einem Browserlauf, sind keine p95-Messung und keine nachgewiesene Verbesserung gegenüber Legacy.

Die erste HTTP-Anfrage im Browserlauf benötigte rund 848 ms. Der Cachezustand wurde dort nicht separat erfasst; dieser Aufruf gehört nicht zur kontrollierten warmen Messreihe. Die gesamte initiale Navigation dauerte rund 4,28 s bis zum ersten Preview-Boot. Das umfasst Docs-SSR, Assets, Hydration und Compileranfrage.

Die bestehenden Maraca-Kernel-Integrity- und AppServices-Browserprüfungen bestehen ebenfalls. Der zunächst verwendete Snap-WebDriver scheiterte beim Beenden mit `kill EACCES`. Ein isolierter offizieller Chrome/WebDriver unter `/tmp` beseitigte diese Umgebungsblockade, ohne Browser-Testbedingungen abzuschwächen.

## Regressionen und Laufzeiten

Die zusammengeführte Node-24-Prüfung enthält 20 erfolgreiche Suiten: Compiler, Imports, Lifecycle, Fixture-Regression, Playground-Docs und Security, Shell-Catfooding, Scheduler, KernelLab, Maraca-Plan, Orchestration, Kernel-Orchestration/Integrity, Validation, Transitions, AppServices-Build, Hydrangea, Suche, Paket-Exports und Test-Runner. Die neuen Tests sind über `node scripts/run_xtend_tests.js rmt-jit-hydrangea` ausführbar und in den bestehenden Playground-relevanten Profilen enthalten.

Unter Node 26.5.0 bestehen Hydrangea, Compiler und Playground-Security. Der eigenständige Docs-Smoke mit Node 12.22.12 prüft Compile, LSP, Maraca, Safe Preview und die neue JIT-Operation einschließlich transitiver Syntaxkompatibilität. Zusätzlich besteht der vollständige PHP-Playground-Security-Lauf mit aktiviertem Hydrangea und tatsächlich gestarteter Node-12-Bridge.

Cacheprüfungen erfassen Quellenänderungen bei unveränderten Zeitstempeln, Versionswechsel, beschädigte Einträge, tote Sperrbesitzer, fehlende Manifeste/Templates, ungültige MVC-Architektur nach einem gültigen Cachetreffer, Schreibprobleme und konkurrierende Prozesse. Runtime-Tests prüfen unveränderliche Compilerfakten, Optionsisolation, Abbruch und verspätete Boot-Abschlüsse. Der PHP-Test prüft auch blockiertes stdin sowie stdout/stderr-Limits.

## Bekannte Ausgangsfehler und Freigabegrenzen

Die bereits vor Hydrangea bekannten fünf Fehler in `docs-pageloader-target-architecture` bleiben unverändert:

1. PageLoader imports the central renderer
2. PageLoader routes page structures through render
3. PageLoader represents child structures as descriptors
4. browser/regression evidence retains lazy
5. browser/regression evidence retains production-hardening

Die Prüfung des realen bisherigen Docs-Hosts und die Produktionsaktivierung sind noch offen. Die lokalen Node-12-Tests ersetzen keine Prüfung der PHP-FPM-Konfiguration, Dateirechte und Lastsituation dieses Hosts. Vor Umstellung den Cache als Host-Benutzer vorbereiten und den Host-QS-Lauf abschließen. Der Produktionsstandard bleibt bis dahin `legacy`.

Maschinenlesbare Ergebnisse und reproduzierbare Skripte liegen unter `tests/performance/hydrangea/`. Die Ausgangsdaten wurden aus dem ursprünglichen temporären Analyseverzeichnis übernommen; Compiler- und Maraca-Referenzen wurden vor der Implementierung erfasst. Die neuen TypeScript-Schnittstellen wurden zusätzlich gemeinsam mit einem typisierten Consumer geprüft; PHP-Syntax und `git diff --check` sind fehlerfrei.
