# RMT JIT Compiler „Hydrangea“

Stand: 09.09.2026. Ausgangsversion: `31c16dd`.
Status: Implementiert und lokal validiert. Host-QS und Produktionsfreigabe offen; Produktion bleibt auf `legacy`.

## Ziel und feste Verträge

Hydrangea entwickelt Compiler, Maraca und PHP-Bridge gemeinsam weiter. Erster Anwender ist der Docs-Playground. Sprache, Core-Schema, HTTP-Schema und bestehende Bridge-Operationen bleiben kompatibel. PHP startet weiterhin kurzlebige Node-Prozesse; ein Dienst ist nicht erforderlich. Node 12.22.12 bleibt im speziellen Docs-Pfad ausführbar, die öffentlichen Paketanforderungen bleiben Node >=24. Die Vorschau startet weiterhin vollständig neu.

Die Ausgangsmessung betrug 1.611 ms für das Minimalbeispiel und 1.941 ms für Customer Service. Zwei Kernel-Architekturprüfungen beanspruchten etwa 1,09 s; der interne Compiler-Transport für Customer Service umfasste 6,30 MB. Die Ausgangsmessung hatte jeweils drei Wiederholungen und ist kein belastbarer p95-Befund. Referenzdaten liegen unter `tests/performance/hydrangea/evidence/`.

## Arbeitspakete und Umsetzung

1. **HYD-01 – Referenzen:** Acht Quellen sichern Compiler-, Safe-Preview- und Maraca-Ergebnisse gegen vor der Änderung aufgenommene SHA-256-Referenzen. Die Tests vergleichen zusätzlich aktuelle Legacy- und Hydrangea-Ergebnisse. HTTP-Messungen prüfen die vollständige Antwortgleichheit. Messberichte enthalten keine Benutzerquellen.
2. **HYD-02 – Gemeinsame Artefakterzeugung:** Eine Quellmomentaufnahme liefert Manifest und Browser-Runtime. Eine MVC-Prüfung und die jeweiligen Artefaktprüfungen bleiben verpflichtend. Die Einzelfunktion bleibt unverändert aufrufbar.
3. **HYD-03 – Dateicache:** Ausschließlich geprüfte Framework-Artefakte werden gespeichert. Inhaltsfingerprint umfasst kanonische Quellen, Templates, Manifest, Versionen, Generator-Abhängigkeiten, Cacheimplementierung, Framework-Root und Node-Version. Private Ablage außerhalb des Webroots, atomare Generationen, Prozesssperre, Integritätsprüfung, 128 MiB Budget. Fehlende, ungültige oder während der Erzeugung veränderte Quellen schlagen fehl. Schreibprobleme erlauben validierte Verarbeitung ohne Cache; der Docs-Host protokolliert den Zustand.
4. **HYD-04 – Pipeline:** Die additive Operation `jit-compile` verarbeitet Compile, Safe Preview und optional Maraca in einem Node-Prozess. Eine requestlokale Compilation Session teilt nur identische effektive Eingaben. `applyDefaultDocumentId` und `readonlyResults` sind optionale Session-Einstellungen. Docs- und Maraca-Defaults werden nicht vereinheitlicht; im Playground sind deshalb weiterhin zwei unterschiedliche Kompilierungen legitim. Parser und semantische Graphen bleiben im Prozess. Der Aufrufer bekommt Core, Core-JSON, Diagnosen und separate Preview-Stufen. Optionale Metriken enthalten Aufrufzahlen und Laufzeiten.
5. **HYD-05 – PHP:** `XTEND_RMT_JIT_MODE=hydrangea` aktiviert die neue Operation; ohne Einstellung gilt `legacy`. Beide Pfade benutzen denselben HTTP-Formatter. Die Bridge überwacht stdin, stdout und stderr nichtblockierend mit einer gemeinsamen Frist ab Prozessstart und beendet direkt den Node-Prozess bei Grenzüberschreitung. Die Frist schließt die HTTP-Warteschlange vor der PHP-Ausführung nicht ein. Quell-, Body- und Parallelitätslimits bleiben erhalten.
6. **HYD-06 – Browser:** Maximal eine aktive Compile-/Diagnoseanfrage und je Operation der neueste ausstehende Stand. Verzögerungen bleiben 160/300 ms, ausführbares Compile hat Vorrang. Run macht Compile sofort ausführbar. Eingaben invalidieren Ergebnisse, ohne durch Fetch-Abbruch zusätzliche Backend-Arbeit zu starten. Routenabbau beendet Fetches, Scheduler-Jobs und Runtime-Instanzen. Preset- und Preview-Boot-Abschlüsse müssen zur aktuellen Generation gehören.
7. **HYD-07 – Einführung:** Legacy bleibt der Standard. Cache zuerst vorbereiten, dann lokal bzw. auf einem kontrollierten Host Hydrangea aktivieren. Kein automatischer Wiederholungs-Compile im Fehlerfall. Rollback erfolgt durch `XTEND_RMT_JIT_MODE=legacy` und Neustart/Reload des PHP-Hosts. Produktion wird erst nach vollständiger Browser- und Host-QS umgestellt.

Zusätzlicher gemessener Befund während der Umsetzung: Die AppServices-Planung lud TypeScript auch bei deaktivierten Services. Der optionale Maraca-Parameter `inspectToolchain: false` vermeidet diese Erkennung im JIT-Pfad. Aktivierte Services laden und prüfen TypeScript weiterhin. Bestehende Aufrufer behalten das bisherige Verhalten; Toolchain-Interna waren bereits aus Bridge-Antworten ausgefiltert.

## Betrieb und Schnittstellen

```sh
# Aus dem Framework-/Repository-Root; privater Pfad außerhalb des Webroots:
export XTEND_RMT_JIT_CACHE_DIR=/var/cache/xtend-rmt-jit
node tools/rmt-jit-cache-cli.js
export XTEND_RMT_JIT_MODE=hydrangea
```

Das Verzeichnis muss dem PHP-/Node-Benutzer gehören und Modus 0700 besitzen; Dateien erhalten 0600. Der CLI-Befehl liefert bei nicht verfügbarem Cache einen Fehlerstatus. Ohne expliziten Pfad wird ein privates benutzer- und frameworkbezogenes Verzeichnis unter dem System-Tempverzeichnis verwendet. Node-Versionen verwenden getrennte Cachegenerationen. Ein Prozess wartet maximal zwei Sekunden auf eine andere laufende Erzeugung und meldet danach `cache_busy`.

`@ccslabs/xtend-compiler/jit-kernel-cache` stellt `prepareRmtJitKernelCache` bereit; `xtend-rmt-jit-cache` ist der CLI-Einstieg. Die neue Bridge-Payload enthält `source`, `filePath`, `options`, `safePreview`, optional `maraca` sowie optional `metrics`. Ohne Maraca-Auftrag ist kein Kernelcache erforderlich. `safePreview: false` deaktiviert ausschließlich diese Stufe. Bestehende Bridge-Schemas bleiben erhalten.

Die neue Browser-Koordination gilt auch beim Legacy-Backend. Der Modusschalter steuert die Backend-Pipeline; zum Rücknehmen der Browser-Änderung ist ein Code-Rollback nötig.

## Prüfungen und Abnahmekriterien

```sh
node scripts/run_xtend_tests.js rmt-jit-hydrangea
node tests/docs/fixtures/rmt_playground_legacy_runtime_smoke.cjs
python3 tests/performance/hydrangea/benchmark.py --url http://127.0.0.1:8081 --legacy-url http://127.0.0.1:8080
python3 tests/performance/hydrangea/cold.py --node "$(command -v node)"
```

- Alt-/Neu-Vergleich: Minimal, Customer Service, Orchestration, Validation, Transitions, unvollständige Quelle, Import und annähernd 64 KiB.
- Cache: gemeinsame/individuelle Artefakte identisch, Treffer ohne Architekturprüfung, Änderungen trotz gleicher Zeitstempel, beschädigte Einträge, fehlende Templates, ungültige Architektur nach gültigem Treffer, Schreibprobleme und konkurrierende Prozesse.
- Session: unterschiedliche Optionen bleiben getrennt, identische Optionen in anderer Schlüsselreihenfolge treffen, Fakten sind schreibgeschützt, Freigabe entfernt Dokumente.
- PHP: blockierendes stdin, stdout/stderr-Limits, erfolgreiche Antwort und Sperrfreigabe.
- Browserlogik: schnelle Änderungen, begrenzte Wartemenge, Compile-Vorrang, Run/Preset-Invalidierung, Routenabbau und verspätete/fehlgeschlagene Runtime-Boots.
- Bestehende Compiler-, Maraca-, AppServices-, Kernel-, Playground-, Security- und Suchtests; Node 24 als Hauptlaufzeit, Node 26.5.0 als Kompatibilitätslauf, Node 12.22.12 für den Docs-Pfad.
- Warmer Cache, jeweils frischer Node-Prozess: bei mindestens 30 HTTP-Aufrufen Median <=250 ms minimal, <=500 ms Customer Service, jeweils p95 <=1.000 ms. Bridge-Ausgabe Customer Service <=1,5 MiB. Ein tatsächlicher Node-Start pro Compile-HTTP-Anfrage. Kaltstart-Median höchstens 10 % über reproduziertem Legacy.

Browser-Boot und die Zeit bis zur sichtbaren Vorschau sind getrennte Messgrößen und zählen nicht zum HTTP-Budget. Keine Null-Regressions-Garantie: Eine Produktionsfreigabe setzt die tatsächliche Browser-QS und Prüfung des bisherigen Docs-Hosts voraus.

## Ergebnisse und offene Freigaben

Die ausführlichen lokalen Ergebnisse, bekannte Ausgangsfehler und Umgebungsgrenzen werden im benachbarten `RMT-JIT-Hydrangea-Validierung.md` dokumentiert. Plan, Implementierung und Regressionsprüfungen dürfen die bekannten fünf PageLoader-Architekturfehler nicht als neue Hydrangea-Fehler klassifizieren oder durch angepasste Erwartungen verdecken.
