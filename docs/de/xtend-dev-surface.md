# XTend Dev Surface

Die XTend Dev Surface erweitert die Chromium DevTools um ein Panel für XTend-Telemetrie. Du kannst damit Performance-Budgets, Hydration und XScaler, Kernel-Zustand, Fabric-Lanes und lokale Qualitätsprüfungen untersuchen, ohne die App-Runtime zu patchen.

Die Extension erkennt eine XTend-App nicht anhand von DOM-Namen oder Framework-Heuristiken. Eine Seite gilt erst dann als instrumentiert, wenn sie ausdrücklich `window.__XTEND_DEV_API__` bereitstellt. Öffnest du das Panel auf einer anderen Seite, blockiert die Dev Surface ihre Telemetrieansichten mit `No XTend app detected`. So werden Beispieldaten nie mit echten Messungen verwechselt.

## Voraussetzungen

Für den lokalen Einstieg brauchst du:

- Node.js 24 oder neuer;
- einen Chromium-basierten Browser wie Chrome, Chromium oder Edge;
- einen lokalen Checkout des XTend-Repositories;
- Zugriff auf den Developer Mode der Browser-Extensions.

Die Extension liegt vollständig im Repository. Sie lädt keine Runtime, kein UI-Framework und keine Skripte von einem CDN nach.

## Extension bauen und laden

Baue zuerst das ladbare Extension-Verzeichnis und prüfe den Contract:

```bash
node tools/xtend-dev-surface/build.js
node scripts/run_xtend_tests.js xtend-dev-surface --json
```

Der Build schreibt die Manifest-V3-Extension nach `tools/xtend-dev-surface/dist/`. Lade dieses Verzeichnis anschließend als unpacked Extension:

1. Öffne `chrome://extensions` oder die entsprechende Extension-Seite deines Browsers.
2. Aktiviere den Developer Mode.
3. Wähle `Load unpacked` und öffne `tools/xtend-dev-surface/dist/`.
4. Öffne eine instrumentierte XTend-App in einem normalen Browser-Tab.
5. Öffne die DevTools und wähle das Panel `XTend`.

Nach Änderungen an `tools/xtend-dev-surface/src/` führst du den Build erneut aus und lädst die Extension auf der Browser-Extensions-Seite neu. Ein normales Reload der untersuchten App aktualisiert nur deren DEV API, nicht die Extension-Dateien.

## Mit der Animation TestBench prüfen

Die RMT Animation TestBench ist die lokale Referenz-App für alle fünf Ansichten. Sie liefert echte Performance-, Hydration-, Kernel- und Fabric-Snapshots über die DEV API.

```bash
npm --prefix products/rmt-animation-testbench run build
npm --prefix products/rmt-animation-testbench run dev
```

Öffne danach `http://127.0.0.1:9196/`, öffne die DevTools und wechsle zu `XTend`. Im Header muss die DEV-API-Version `0.1.0-rmt-animation-testbench` statt `No XTend app detected` erscheinen.

Die TestBench verwendet `server_prerender_resume`, einen serverseitigen Resume-Payload, XScaler-Preflights und echte AnimationEngine-Messungen. Dadurch kannst du sowohl den normalen Zustand als auch Lazy-Surface-, Budget- und Diagnosepfade nachvollziehen.

## Eine App instrumentieren

Die DEV API ist eine explizite, nur lesende Grenze. Die vier Kernmethoden liefern synchrone, JSON-serialisierbare Snapshots. `getHydrationSnapshot()` und `subscribe()` sind optional.

Die vollständige Methoden-, Snapshot- und Fehlerreferenz findest du unter [XTend DEV API](./xtend-dev-api.md). Der folgende Block bleibt als kompakter Schnellstart für die Extension erhalten.

```js
window.__XTEND_DEV_API__ = {
  version: '1.0.0',
  getPerformanceSnapshot() {
    return {
      measurements: [
        {
          schema: 'xtend.performance.measurement.v1',
          name: 'app.boot',
          phase: 'boot',
          durationMs: 120,
          budgetMs: 300,
          status: 'pass'
        }
      ]
    };
  },
  getHydrationSnapshot() {
    return {
      strategy: 'server_prerender_resume',
      status: 'resumed',
      resumeToken: '[redacted]',
      timing: {
        ssrRenderMs: 18,
        resumeReadMs: 2,
        hydrateMs: 24,
        firstInteractiveMs: 44,
        clsValue: 0.002
      },
      surfaces: [],
      xscaler: {
        mode: 'protocol-lazy',
        preflightCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        networkDuringRender: false,
        lazyLoadedCount: 0,
        atcSessions: []
      }
    };
  },
  getFabricTelemetrySnapshot() {
    return {
      fiberCount: 0,
      lanes: {},
      backpressure: { level: 'none', laneIds: [] }
    };
  },
  getKernelSnapshot() {
    return {
      state: 'none',
      severity: 'none',
      affectedScopes: [],
      affectedJobs: [],
      mitigationStrategies: []
    };
  },
  subscribe(listener) {
    return () => {};
  }
};
```

Gib aus diesen Methoden keine Promises, DOM-Knoten, Funktionen, zyklischen Objekte oder Browser-Events zurück. Der Runtime Bridge liest die Werte mit `chrome.devtools.inspectedWindow.eval`; asynchrone oder nicht serialisierbare Ergebnisse werden deshalb als Diagnose gemeldet. Erstelle bei jedem Aufruf einen Snapshot oder eine sichere Kopie, damit die Extension keinen kanonischen App-Zustand besitzt.

Ein Resume-Token wird genau so angezeigt, wie die App ihn liefert. Wenn der Wert vertraulich ist, muss die App ihn vor der Übergabe redigieren. Die Extension rekonstruiert oder entschlüsselt ihn nicht.

## Die Ansichten verstehen

| Tab | Datenquelle | Wichtige Fragen |
| --- | --- | --- |
| `Performance` | `getPerformanceSnapshot()` | Welche Messung überschreitet ihr Budget, welche Phase regressiert? |
| `Hydration` | `getHydrationSnapshot()` | Welche Strategie lief, wie lange dauerten Resume und Hydration, was tat XScaler? |
| `Kernel` | `getKernelSnapshot()` | Ist der Kernel gesund, welche Scopes sind betroffen, welche Mitigation läuft? |
| `Fabric` | `getFabricTelemetrySnapshot()` | Welche Lanes sind ausgelastet, wo scheitern Fibers oder entsteht Backpressure? |
| `Gates` | lokaler Companion | Welche allowlistete Prüfung läuft und welches JSON-Artefakt entstand? |

`Performance` übernimmt `pass`, `warn`, `fail` und `blocked` aus `xtend.performance.measurement.v1` und zeigt sie als `optimal`, `needs-improvement`, `flawed` und `blocked`. Entscheidend sind `durationMs` und `budgetMs` derselben Messung. Die Gesamtübersicht ist eine Zusammenfassung, kein Ersatz für die fehlerhafte Measurement-Zeile.

`Hydration` trennt `ssrRenderMs`, `resumeReadMs`, `hydrateMs` und `firstInteractiveMs`. Diese Werte sind keine addierbaren Phasen, wenn sie auf unterschiedlichen Zeitachsen gemessen wurden. `firstInteractiveMs` ist die Zeit bis zur Interaktivität, nicht zusätzlich zu SSR- und Hydration-Dauer. Die XScaler-Sektion zeigt angenommene und abgelehnte Preflights, Lazy-Surfaces, ATC Sessions und unerwartetes Netzwerk während des Renderns.

`Kernel` unterscheidet unter anderem `none`, `suspected`, `active`, `recovering`, `recovered` und `failed`. Prüfe bei einem Panic-Zustand zuerst Trigger, betroffene Scopes und Jobs. `recoveryAction` beschreibt die konkrete Aktion; `mitigationStrategy` beschreibt die übergeordnete Strategie.

`Fabric` aggregiert Fiber-Anzahl, aktive und wartende Arbeit, Fehler, Budget-Misses, Auslastung und Backpressure pro Lane. Eine hohe Auslastung allein ist kein Fehler. Kritisch wird sie zusammen mit wartenden Fibers, Budget-Misses, Fehlern oder einer Backpressure-Aktion.

## Lokale Gates ausführen

Der optionale Companion führt nur vordefinierte Gate-IDs aus. Es gibt im Panel keine freie Shell-Eingabe. Starte ihn mit einem lokalen Token:

```bash
XTEND_DEV_SURFACE_TOKEN=dev node tools/xtend-dev-surface/companion.js
```

Öffne `Gates`, trage denselben Token ein und wähle `Check`. Der Companion ist standardmäßig unter `http://127.0.0.1:27864` erreichbar. Tokenpflichtige Endpunkte akzeptieren `x-xtend-dev-surface-token`; Befehle laufen mit `shell: false`, und Artefaktlinks dürfen nur auf allowlistete relative Report-Pfade zeigen.

Ein Gate durchläuft `queued`, `running` und anschließend `passed`, `failed` oder `blocked`. Öffne bei einem Fehler zuerst das normalisierte JSON-Artefakt. Der gekürzte stdout-/stderr-Tail dient nur zur Orientierung und ersetzt den Report nicht.

## Die Docs-App als Referenz prüfen

Die XTend Docs stellen die DEV API selbst bereit. Du brauchst für diesen Test weder einen Mock noch die Animation TestBench:

```bash
php -S 127.0.0.1:9187 -t . docs/dev-router.php
```

Öffne `http://127.0.0.1:9187/docs/de/readme`, danach die Chromium DevTools und das Panel `XTend`. Während des frühen Boots dürfen die synchronen Methoden einen gültigen `degraded`-Snapshot liefern. Sobald die Shell bereit ist, erwartest du standardmäßig `server_prerender_resume`, einen Kernel-Zustand `none`, AppRuntime-Fibers in `Fabric` und Messungen für SSR, FCP, Content-Commit und Route-Übergänge. Ohne gültigen Resume-Schlüssel bleibt das vollständige SSR-Dokument erhalten und meldet einmalig `server_prerender_hydrate` als Fallback.

Navigation und Suche laufen durch dieselbe AppRuntime, die auch die Snapshots speist. Suche beispielsweise nach `hydratoin`, öffne einen Treffer und prüfe, ob Route, Lane-Zähler und Search Measurement gemeinsam aktualisiert werden. So erkennst du auch veraltete Snapshots, die bei einem statischen DEV-API-Mock verborgen blieben.

## Sicherheits- und Ownership-Grenzen

- Die Extension liest ausschließlich `window.__XTEND_DEV_API__`.
- Sie patcht weder `fetch`, `history`, `performance`, `customElements` noch Framework-APIs.
- Der Prewarm Worker normalisiert Snapshots und Diagrammdaten, besitzt aber weder DOM noch Host Services oder kanonischen Zustand.
- Extension-Seiten verwenden lokale Skripte unter Manifest V3; Remote Code und CDN-Runtimes sind nicht erlaubt.
- Der Companion bindet lokal und startet nur seine Gate-Allowlist.
- DEV-API-Snapshots dürfen keine Secrets oder unredigierten Nutzdaten enthalten.

## Fehlerbehebung

`No XTend app detected` bedeutet, dass der untersuchte Tab `window.__XTEND_DEV_API__` nicht bereitstellt. Wechsle zum richtigen App-Tab, lade die App neu und drücke im Panel `Refresh`. `Gates` bleibt verfügbar, weil lokale Gates nicht von Seitentelemetrie abhängen.

Ein `degraded`-Status bedeutet, dass die API vorhanden ist, aber eine Pflichtmethode fehlt, geworfen hat oder keinen synchron serialisierbaren Wert lieferte. Öffne die Diagnose im Panel und rufe dieselbe Methode in der Console des untersuchten Tabs auf.

Bleibt ein Snapshot nach einer Navigation alt, stelle sicher, dass deine App bei jedem Methodenaufruf den aktuellen Zustand zurückgibt. `subscribe()` signalisiert Beobachtbarkeit, überträgt in der ersten Version aber keine Ownership an die Extension.

Kann sich `Gates` nicht verbinden, prüfe Companion-Prozess, Port und Token. Ein unbekanntes Gate ist absichtlich blockiert; ergänze keine freie Command-Weiterleitung, sondern eine geprüfte Definition in der Companion-Allowlist.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [Supply Chain Checks](./supply-chain-gates.md)

## PR-Gates und gemeinsame Testausführung

Der statisch lesbare Katalog `scripts/test-runner/catalog.json` registriert Suites, Implementierungen, Argumente, Aliasse, Profile und Berichtspfade. `scripts/run_xtend_tests.js` bleibt der kompatible Einstieg. Einzelne npm-Skripte behalten ihre Namen. `test:pr` und `test:pr:report` wählen dieselben Suites aus; dasselbe gilt für die vollständigen Release-Einstiege.

```sh
npm run test:pr
node scripts/run_xtend_tests.js --profile ci-pr --plan --json
node scripts/run_xtend_tests.js project-index rmt-language-server --json
node scripts/run_xtend_tests.js --profile ci-release --jobs 2
node scripts/run_xtend_tests.js --verify ci-rmt --from .xtend-test-results/xtend-test-execution.json
```

Hilfe, Liste und Planung laden keine Testmodule und kein TypeScript. Explizite IDs werden in ihrer ursprünglichen Reihenfolge dedupliziert. Unbekannte IDs, leere Reportpfade und Kombinationen von `all` mit weiteren IDs sind Fehler. Ein Profil kann nicht mit einer expliziten Auswahl kombiniert werden.

### Profile und Berichtspflichten

Die Profile `ci-pr` und `ci-release` vereinigen die bisherigen Hauptprüfungen mit den RMT-/Native-First-Prüfungen. Die Hauptjobs führen diese Vereinigung einmal pro Node-Version aus. Der bestehende Check `rmt-vnext-primitive-gates` lädt das Artefakt desselben Workflow-Laufs und prüft seine Pflichtteilmenge. Die Node-/OS-Matrizen und Checknamen bleiben erhalten. `ci-nightly` und `ci-publish` verwenden dieselbe Logik; vor einer Veröffentlichung entsteht eine eigene frische Ausführung.

Fachberichte und Alias-IDs bleiben als Projektionen verfügbar. Docs-Stub-Inventar ist in PR-/Release-CI advisory und in Nightly blocking. Die umfangreichen Sprach-, Browser-, Paket- und Vertragsprüfungen bleiben verpflichtend. Zusätzlich sind Projektindex, LSP, Importresolver und Runner-Verträge in den Hauptprofilen enthalten. Der separate Editorjob startet Legacy- und vNext-Analyse sowie Navigation aus einem frisch entpackten VSIX außerhalb des Checkouts.

Der Ausführungsplan nennt auch die separaten CI-Prüfungen. Es gibt keine automatische Auswahl anhand geänderter Dateien und keinen Cache erfolgreicher Tests. npm-Download-Caches sind an Lockfiles und Plattform gebunden. Fehlgeschlagene Installationen verhindern nachfolgende Testkaskaden; Statusauswertung und Diagnose-Uploads bleiben aktiv.

### Ausführung und Fehler

Standard ist ein wiederverwendbarer Worker. `--jobs` erlaubt höchstens zwei Worker. Exklusive Repository- und Browserressourcen sowie unbekannte Ressourcen verhindern gleichzeitige Ausführung. Die vorhandenen Suite-Einträge sind konservativ gesperrt; Parallelität setzt eine geprüfte Ressourcendeklaration voraus.

Jede Suite hat standardmäßig fünf Minuten Zeit, danach erhält die Prozessbereinigung höchstens fünf Sekunden. Kürzere fachliche Deadlines bleiben bestehen. Fehler, Exceptions, Prozessabbrüche, fehlende Ergebnisse und widersprüchliche Erfolgsangaben führen zu fehlgeschlagenen Ergebnissen. Unabhängige Suites laufen weiter. WebDriver-Aufrufe teilen sich eine Fixture-Deadline; Cleanup hat ein eigenes begrenztes Budget. Ursprüngliche Fehler und zusätzliche Cleanup-Fehler bleiben gemeinsam sichtbar. Lokale Driver verwenden freie Ports; externe Endpunkte werden nicht beendet.

### Ergebnisse und Wiederverwendung

Für lokale Projektionen müssen Ausführung und Prüfung denselben ausdrücklich gesetzten `XTEND_TEST_RUN_ID` verwenden. Ohne diese Angabe erhält jeder lokale Aufruf eine neue Laufidentität. In GitHub Actions werden Workflow-Lauf und Versuch automatisch gebunden.

`xtend.test.report.v1` bleibt unverändert. Fachberichte behalten bei fehlgeschlagenen Suites den Status `failed`; Advisory-Regeln beeinflussen ausschließlich die Profilentscheidung und den Prozess-Exitstatus. Der zusätzliche Bericht `xtend.test.execution-report.v1` enthält Laufidentität, Commit, Runtime, Quellen- und Katalogfingerprints, erwartete IDs, Einzelzeiten, Speicherwerte, Logpfade, Wiederverwendung und Abbruchursachen. Teilberichte werden nach jeder Suite atomar geschrieben. Standardpfad ist `.xtend-test-results/xtend-test-execution.json`; `--execution` legt einen anderen Pfad fest. Worker-Ausgaben stehen unter `.xtend-test-results/test-runner/<executionId>/`; `--json` hält stdout für JSON frei.

Eine Übernahme verlangt passende Herkunft und vollständige Ergebnisse. Fehlende, fremde, abgebrochene oder unvollständige Artefakte können keinen Check erfüllen. Deduplizierung gilt nur innerhalb derselben Ausführung mit gleicher Implementierung, gleichen Argumenten, Eingaben und Runtime. Beispielsweise projizieren `maraca-bundle` und `maraca-bundle-report` dieselbe Ausführung. Unterschiedliche SurfaceManager-Domänen bleiben getrennt. Die zwölf Tuning-Kandidaten und ihre unabhängige Reproduzierbarkeitsprüfung bleiben erhalten.

Der Projektindex liest den Katalog, ohne Suite-Module auszuführen. Die bestehenden Paketmetadaten bleiben kompatible Projektionen; der Runner-Vertragstest prüft ihre Übereinstimmung mit den aufgelösten Profilen. Neue Reportverträge werden gezielt im Schema-Inventar kuratiert. Nach Dokumentationsänderungen regeneriert `npm run build:xtend-mcp-knowledge` die Wissensartefakte; der unveränderte Driftcheck bleibt erforderlich.

Lokale Ergebnisse und tatsächlich ausgeführte GitHub-Actions-Matrizen sind getrennte Abnahmen. Ein lokaler Lauf ersetzt weder die zweite Node-Version noch Windows, macOS oder die separaten CI-Jobs.

### Nightly-Abnahme und Runner-Fähigkeiten

Der Nightly verwendet `ubuntu-24.04` mit den bestehenden Node-24-/Node-26-Lanes. Vor den Tests prüft er Workspace- und Produkt-Lockfiles sowie Node-Unterprozesse, SQLite, PHP und eine echte Chromium-WebDriver-Sitzung über Loopback. Fehlende Fähigkeiten und übersprungene Pflichtprüfungen schlagen fehl. Die ERP-Installation entfällt, weil dieses Profil ihre Abhängigkeiten nicht verwendet.

Die Phasen, Voraussetzungen, Zeitbudgets und Artefaktpflichten stehen im gemeinsamen Katalog. `node scripts/test-runner/nightly.js begin` eröffnet einen Lauf; `node scripts/test-runner/nightly.js phase <id>` führt die gewünschte Phase aus. Die Installationen und Einzelphasen sind begrenzt; für die Phasen zusammen stehen 32 Minuten innerhalb des unveränderten 40-Minuten-Jobs zur Verfügung. Abhängige Phasen starten nach einem Fehler nicht; unabhängige Prüfungen und Diagnose-Uploads bleiben erhalten. `npm run nightly:manifest` wertet sämtliche Ergebnisse einmal aus. Die benannten Fachprüfungen übernehmen diese Auswertung ohne zusätzliche Testausführung.

`xtend.ci.nightly-build-manifest.v1` behält seine Struktur. Sein `ok` setzt erfolgreiche Phasen, vollständige Pflicht-Suites ohne Skips und gültige Artefakte voraus. Der separate Nachweis `xtend.ci.nightly-acceptance.v1` bindet Ergebnisse an Lauf, Commit, Runtime, Quellen- und Katalogfingerprint. Die Sitzung `xtend.ci.nightly-session.v1` enthält Phasenprotokolle und Artefakthashes; `xtend.ci.runner-capabilities.v1` dokumentiert die tatsächlich geprüften Fähigkeiten. Alle drei liegen unter `.xtend-test-results/nightly/`. Ein fehlender, veralteter oder nachträglich veränderter Bericht schlägt fehl, selbst wenn sein Dateiname vorhanden ist.

Das zusätzliche Diagnoseartefakt enthält Phasen-, Worker-, Runtime- und npm-Logs sowie die letzten 32 KiB des lokalen Capability-Drivers. Damit bleiben auch Fehler vor der Erstellung einer Browser-Session untersuchbar. npm-Downloads verwenden einen absoluten Cachepfad im temporären Runner-Verzeichnis. Die Cache-Konfiguration benötigt keinen npm-Aufruf; `actions/cache` stellt Downloads vor `setup-node` wieder her, ohne dessen noch nicht gepinnte npm-Version aufzurufen. Die beiden optionalen Browser-/Netzwerkzweige bleiben ausdrücklich aktivierbar und erhalten eigene Zeitlimits. Ein manueller Abnahmelauf muss beide Optionen aktivieren, um auch diese Zweige zu prüfen.
