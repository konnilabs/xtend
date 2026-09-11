# Changelog – XTend 0.8.0

Diese Seite beschreibt den 0.8.0-Stand der Codebase und seine Migrationen. Die Paketversion allein bestätigt keine Veröffentlichung; den ausgelieferten Stand bestimmen Manifest, Exports und Build-Artefakte.

## Änderungen in 0.8.0

| Bereich | Verhalten und Einstieg |
| --- | --- |
| RMT Microkernel | Eine Scheduler-Autorität, sechs kanonische Lanes und abbrechbare, thenable `RmtJobHandle`s. Paint-, Idle- und `postTask`-Warten blockieren keine bereite Arbeit. [Migration](./rmt-kernel-0-8-migration.md) |
| Maraca Shell | `execution fastpass` und `dispatchFastPass()` führen Navigation, Fokus und benanntes Close über `user-blocking` aus, unabhängig von wartenden fachlichen Commands. [FastPass](./maraca-fastpass-abort-boundary.md) |
| Präsentations-Lifecycle | Automatische Surface-Epochen schützen Hydration, UI-Coprocessor-Antworten und geplante Commits. `superseded` startet keinen synchronen Rendering-Fallback. Fachliche Transaktionen behalten ihre Reihenfolge. [Abort Boundaries](./maraca-fastpass-abort-boundary.md) |
| Diagnosebedarf | `subscribeEvents()` liefert unveränderliche Lifecycle-Ereignisse. `subscribe()` behält vollständige Snapshots; `snapshot()` und DEV-API-Abrufe lesen synchron aktuelle Daten. [DEV API](./xtend-dev-api.md) |
| Hydrangea JIT | Gemeinsame Compile-/Preview-/Maraca-Pipeline und privater Cache geprüfter Kernel-Artefakte. Für den Docs-Host explizit aktivierbar; `legacy` bleibt Default. [Hydrangea](./rmt-jit-hydrangea.md) |
| Node und Laravel | Eigenständige Seitenhosts mit Props, Formularen, Navigation, Layouts, Resume und Streaming. Laravel rendert vorgebaute Artefakte ohne Node im Produktionspfad. [Seitenlaufzeit](./ssr-pages.md) |
| Page Wire und CSP | Opt-in `xtend.page-wire.v1` reduziert wiederholte Seitendaten. Bedingte Ansichten materialisieren nur den aktiven Zweig; vertrauenswürdige Komponentenstyles können den Dokument-Nonce übernehmen. [Transport](./ssr-pages.md#kompakter-transport-und-bedingte-ansichten) |
| Referenzanwendung | XTend.store verbindet Maraca, Laravel, einen Gastwarenkorb und einen getrennten DemoPay-Provider. [Integration](./ssr-pages.md#maraca-seiten-und-xtendstore) |
| Fokus und Diagnosekorrekturen | Overlay-Fokusfallen berücksichtigen geslottete und remote eingebundene Controls. Delegierte Handler lesen Queue-Statistiken über die gemeinsame Scheduler-Instanz. [A11y](./a11y-keyboard-smokes.md) |
| Docs Shell | Nach einem Sprachwechsel verwenden Suche und Navigation denselben aktualisierten Locale-Service. Der gemeinsame FastPass-Validator bleibt mit dem älteren Docs-Bridge-Host kompatibel. [DEV Surface](./xtend-dev-surface.md) |
| Tooling und Nightly | Ein gemeinsamer Testkatalog, geprüfte Runner-Fähigkeiten und an den Run gebundene Artefakte halten lokale und CI-Evidence nachvollziehbar. [Release-Verifikation](./release-verification.md) |

## Migration und Defaults

0.8.0 ist ein Breaking Release innerhalb der Pre-1.0-Policy. Neue Kernel-Aufträge verwenden `user-blocking`, `visible`, `transition`, `idle`, `background` oder `diagnostics`. `inline` und `runInline` umgehen die Queue nicht mehr. Product Surface und Prewarm sind explizite Opt-ins; ESM-Importe booten keine Runtime. Fabric liefert Work-Intents und Backpressure und besitzt keine zweite Scheduler-Queue.

FastPass ist ebenfalls Opt-in. Modell-Reducer, Services, Fetches, Streams und beliebige Custom-Effekte bleiben fachliche Commands. Eine abgeschlossene FastPass-Action bestätigt den Shell-Intent, nicht das Laden von Inhalten oder das Ende einer Animation. Lange synchrone Arbeit muss weiterhin kooperativ aufgeteilt werden.

Die erweiterte Plan-Runtime verwendet `xtend.maraca.plan-runtime.v3`, der Presentation-Adapter `xtend.rmt.presentation-effect-adapter.v2`. Bestehende Methoden bleiben erhalten; Verbraucher mit Literal-Prüfungen müssen die neue Schema-Major-ID akzeptieren. `xtend-maraca/fastpass.schema.json` ergänzt den Authoring-Vertrag, ohne das veröffentlichte RMT-v2-Dokumentschema umzuschreiben.

Nach einem Upgrade Maraca-Bundles und Seitenmanifeste mit derselben Framework-Version neu bauen. Rebuilds aktualisieren Runtime-, Asset- und Versionsfingerprints gemeinsam. Aktuelle Paketvoraussetzung ist Node >=24; hostbezogene Kompatibilitäts-Smokes sind keine allgemeine Freigabe älterer Node-Versionen.

## Versionsstand ermitteln

Lies die Version nicht aus einem generierten Banner oder Screenshot. Ermittle sie direkt aus dem Package:

```bash
node -p "require('./package.json').version"
```

Vergleiche anschließend `package.json` mit den tatsächlich installierten Dateien. `api.d.ts`, `components/manifest.json` und die Deklarationen unter `components/*.d.ts` zeigen, welche öffentliche Oberfläche zu diesem Stand gehört.

## Änderungen bewerten

- **Additiv:** Ein neuer Export, ein optionales Attribut oder ein neues versioniertes Schema erweitert die Oberfläche, ohne bestehende Aufrufe zu brechen.
- **Verhaltensänderung:** Defaults, Scheduling, Hydration oder Fehlerstatus ändern sich. Solche Änderungen brauchen ein ausführbares Beispiel und einen aktualisierten Gate-Report.
- **Migration:** Ein Name, ein Vertrag oder ein unterstützter Pfad wird ersetzt. Der alte Pfad bleibt mindestens für den dokumentierten Übergang erhalten oder liefert eine eindeutige Diagnose.
- **Security Fix:** Import-, Integrity-, CSP- oder Trust-Regeln werden verschärft. Ein solcher Fix darf nicht durch einen stillen Kompatibilitätsfallback umgangen werden.

## Was ein Release belegen muss

Ein Release ist mehr als eine Versionsnummer. Die Export-Lock-Prüfung muss zu den TypeScript-Deklarationen passen, der Pack-Dry-Run darf keine internen Artefakte veröffentlichen und die relevanten Browser- sowie Runtime-Gates müssen grün sein. [Release Verification](./release-verification.md) beschreibt die Reihenfolge und die Bedeutung der Reports.

## Upgrade-Pfad

Prüfe vor dem Upgrade zuerst die betroffenen öffentlichen Symbole. Bei RMT vNext helfen die [Migration Notes](./rmt-vnext-migration-notes.md), für Komponenten die [Long-Tail Migration](./component-long-tail-migration.md) und für XTensions der [Coexistence Guide](./xtensions-migration-coexistence-guide.md). Passe Source, Fixture und Tests gemeinsam an, statt nur einen kompilierten Output zu ersetzen.
