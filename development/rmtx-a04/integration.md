# A04.2 – Regulärer Maraca-Build und Browser-Boot

Stand: 2026-11-10. Der lokale A04.1-Begleiter ist in den regulären asynchronen Maraca-Build einschließlich CLI eingebunden. Das erzeugte Browser-Modul komponiert gebundene React-/Vue-Hosts automatisch mit den tatsächlich verwendeten Kernel- und Surface-Ports. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`; [A04.3.1](provider-graphs.md) ergänzt lokale transitive Providergraphen; weitere A04.3-Arbeiten und die vollständige Feature-Abnahme sind offen.

## Versionierte Einstiege

| Vertrag | Automatische Komposition | Erhaltener bisheriger Einstieg |
| --- | --- | --- |
| Maraca-Build-Plan / Build-Konfiguration | v5 | v4 ohne Kompositionsoption |
| Kompositions-API, Build und Runtime | `2.0.0` | Artefakt-/Bericht-v1 für Plan v4 weiterhin unterstützt |
| Kompositionsartefakt / Build-Bericht | v2 / API `2.0.0` | v1 / API `1.0.0` |
| Vorbereiteter Kompositionsport | v1 | manuelle Host-Factory |
| Browser-Kompositionsroot / API | v6 / `6.0.0` | v5 / `5.0.0` |
| Plan-Runtime | v8 | v7 |
| Größenbudgetbericht | v2 für integrierte Builds | v1 für bisherige Builds |
| Manifest / tatsächlicher Host | v1 / API `6.0.0` | unverändert |

Das Schema-Inventar führt je Familie genau eine aktuelle Version. Die abgelösten Familienversionen werden deshalb als `deprecated` mit Nachfolger geführt; ihre weiterhin unterstützten Defaults, vollständigen Verträge und Fingerprints bleiben erhalten. Damit wird kein öffentliches Lesefenster beendet.

Die neuen Typen heißen `MaracaComposedBuildInput`, `MaracaComposedBuildPlan`, `MaracaComposedBuildConfig`, `IntegratedXTensionCompositionArtifact`, `IntegratedXTensionCompositionBuildReport`, `ComposedMaracaPlanRuntimeOptions` und `MaracaXTensionBootOptions`. Die vollständigen bisherigen Typen bleiben erhalten. Die geordnete Root-Exportfolge bleibt bei 214 Einträgen mit Fingerprint `8a443b512c6993227950c2393eaa722ded512ea4f2243d4c09f527aaf3605924`.

## Build und Anwendung

```js
const { buildMaracaBundleAsync } = require('@ccslabs/xtend-maraca');
const result = await buildMaracaBundleAsync({
  source: 'app.rmt', out: 'dist', profile: 'production',
  orchestration: 'strict', kernel: 'strict',
  xtensionBindings: bindings, xtensionComposition: manifest
}, { rootDir: projectRoot });
if (!result.ok) throw new Error(JSON.stringify(result.plan.diagnostics));
```

Für `xt maraca build --config maraca.json` enthält die Konfiguration `schema: "xtend.maraca.build-config.v5"`, `source` und unter `options` dieselben Einstellungen einschließlich Manifest und Bindungen. Ältere Config-Versionen weisen eine Kompositionsoption zurück. Der synchrone Builder meldet ausdrücklich `xtension_composition_requires_async_build`. Die automatische Komposition benötigt strikte Orchestrierung, den strikten Kernel und mindestens eine gültige Bindung. Fehler in Zuordnung oder Quelldigest führen zu keinem manuellen Fallback.

Der Build prüft Provider-Bytes und erzeugt den inhaltsadressierten Begleiter einschließlich seiner exakten Provider-Dateien. Der Begleiter bleibt als statischer ESM-Import im Hauptmodul erhalten. Zusätzlich entsteht `runtime/xtension-platform.mjs`: ein geschlossener ESM-Graph aus den benötigten XTend-Adaptern, State-Binding und Kompositionsruntime. Die private CommonJS-Brücke verarbeitet ausschließlich statische relative Abhängigkeiten innerhalb des Compiler-Pakets. Sie erweitert den zulässigen Provider-Graphen nicht. React und Vue werden weiterhin extern injiziert, nicht implizit installiert oder gebündelt. `xtend.xtensions.report.json` bindet Begleiter-, Provider- und Plattformdateien mit SHA-256 und Größe; bei direkter Verwendung des Begleiter-Builders umfasst der Bericht dessen eigene Dateien.

```js
import { createXtendMaraca } from './dist/xtend.maraca.mjs';
const app = createXtendMaraca();
await app.boot({
  root: document.querySelector('main'), fabric,
  xtensions: {
    loadPeers: ({ provider, signal }) => applicationPeerLoader(provider, signal),
    grants: {
      'filter-panel': {
        work: { scan: { lane: 'background', maxChunkMs: 4 } },
        workBudget: {
          schema: 'xtend.xtensions.work-budget-policy.v1', maxPending: 1,
          work: { scan: { maxPending: 1 } }
        }
      }
    }
  }
});
app.dispose();
await app.facade.whenXTensionsIdle();
```

Die Anwendung liefert Fabric, vertrauenswürdigen Peer-Lader und separate Rechte pro Deklaration. Das Manifest stellt Anforderungen, vergibt aber keine Rechte. Pure Policy-Daten werden synchron vor dem ersten asynchronen Boot-Schritt kopiert und eingefroren. Nachträgliche Änderungen am ursprünglichen Objekt erweitern den Boot nicht. Die v2-Identität bindet zusätzlich das vollständige normalisierte Manifest an Source-Hash, kompiliertes Programm und Bindungen. Ein Port prüft beim Binden erneut den tatsächlichen Plan. Manuelle Host-Factory, abweichende Binding-Runtime und Adoption können mit diesem Einstieg nicht gemischt werden.

## Ownership und Cleanup

Der Plan verwendet `controller.core.rmt` und dessen tatsächlichen Scheduler. Er legt genau einen privaten Kernel-Root pro Boot an und bindet die Factory an diesen Root sowie an den intern materialisierten Surface-Graph und Surface-Controller. Es entsteht kein zweiter RMT-Core. Alle Mount-, Update- und Work-Lieferungen folgen weiterhin **Host → Microkernel-Queue → Fabric → Provider/Framework**. Framework-private Arbeit wird dadurch nicht präemptiv kontrolliert.

Bei Dispose, Mount-Fehler oder abgebrochenem Boot werden zuerst Registry-Instanzen und laufende Arbeiten terminal widerrufen. Nach ihrem Drain werden die zugehörigen Ressourcen und der private Root einschließlich seines registrierten Zustands entfernt. Erst danach werden der eigene Kernel-Controller/Scheduler und Renderer freigegeben. `whenXTensionsIdle()` schließt diesen Drain ein; ein neuer Boot wartet darauf. Ein verspäteter Peer-Lader kann die alte Inkarnation nicht wiederbeleben. Ein geliehener `kernelController` und dessen Scheduler sowie fremde Roots/Ressourcen bleiben verfügbar.

## Nachweise und Grenze zu A04.3

[`integration-inspect.cjs`](integration-inspect.cjs) prüft 27 Build-/Vertragsfälle einschließlich echtem CLI-Build und bindet Quellen in [`integration-evidence.json`](integration-evidence.json). Es ist die 13. blockierende Prüfung des Vorbereitungs-Gates. [`integrated-composition-acceptance.js`](../../tests/xtensions/integrated-composition-acceptance.js) ergänzt 17 reale Fälle: React, Vue, beide Frameworks gemeinsam, typed Model-/State-Lieferung, interner Surface-Graph, erforderliche Rechte, Abbruch, Retry, Policy-Snapshot, keyed Reinkarnation und geliehene Kernel. Die verpflichtende Laufzeitprüfung umfasst damit 300 Fälle je jsdom-/Chromium-Umgebung sowie 88 Compilerprüfungen. Die integrierten Referenzen laufen dabei unter strikten Production-/Max-Budgets; gepackte Root-/Maraca-Consumer verwenden ebenfalls diese Profile. Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten die tatsächlichen generierten ESM-Graphen und prüfen öffentliche Typen ohne implizite Framework-Abhängigkeiten.

## Größenbudget v2

Der bisherige Größenbefund ist behoben. Integrierte Builds erzeugen `xtend.maraca.size-budget-report.v2`; `MARACA_XTENSION_SIZE_BUDGET_REPORT_SCHEMA` und `MaracaXTensionSizeBudgetReport` machen die neue Version explizit. Bisherige Builds behalten ihren vollständigen v1-Vertrag. Plan-/Config-v5, Manifest-v1 und Kompositions-API-2 ändern dadurch ihre Datenform nicht.

Das strikte Budget verlangt zwei unabhängige Einsparungen: Der gesamte berechnete Framework-Anteil muss kleiner als seine vergleichbare Quellbasis sein; zusätzlich muss der erzeugte XTension-Laufzeitgraph kleiner als seine eigene Quell-/Vertragsbasis sein. Einsparungen im RMT-Kern können einen zu großen XTension-Graphen nicht verdecken. `warn`, `off` und Debug bleiben explizite bisherige Optionen; v2 zeigt die tatsächlichen Überschreitungen auch bei deaktivierter Durchsetzung an. CSS-/AppService-Budgets behalten ihre verbindlichen bisherigen Regeln.

Die Quellbasis ergänzt die bisherige Loader-/Komponenten-/Stack-/Vertragsrechnung um die tatsächlich vom Plattform-Bundler erfassten CommonJS-/ESM-Quellen, verifizierte Provider-Quellen und eine kompakte Serialisierung des gebundenen v2-Kompositionsartefakts. Physisch gemeinsame Quellen zählen einmal, auch wenn zwei Provider-Deklarationen daraus zwei Ausgabedateien erzeugen. Bereits in der bisherigen Basis enthaltene Module werden nicht nochmals addiert. Der Legacy-Loader wird auch im eigenständig installierten Maraca-Paket über das tatsächliche Root-Paket aufgelöst. Ausgabegröße oder frei eingereichte JSON-Schätzwerte können diese Basis nicht erhöhen.

Die Budgetprüfung verwendet den tatsächlichen Build-Kontext mit gebundenem Plan und vollständiger Ausgabedateiliste. `createMaracaSizeBudgetReport` kann für v5 nur mit demselben Planobjekt eines regulären asynchronen Builds rechnen. Ein serialisierter Plan/Bericht ersetzt diese Herkunft nicht. Abweichende Datei-Mitgliedschaft, vorgetäuschte Bytezahlen, fremde AppService-Zuordnungen, veränderte Provider-Bytes und Ausbrüche aus dem Ausgabeordner werden abgewiesen. Ausgabedateien werden erneut gelesen, vermessen und gehasht; das Kompositionsprotokoll bleibt an den nach Minifizierung erzeugten Plattform-Bytes gebunden.

`accounting.files` enthält alle in der Bundle-Dateiliste geführten Ausgaben mit Größe und SHA-256. Auch `xtend.xtensions.report.json` wird dem Gesamtbudget zugerechnet. Die bisherigen separaten AppService-/Microkernel-Zuordnungen bleiben bestehen. Finale Bundle-/Größenberichte, Name-Cache und nicht gelistete Debug-Source-Maps sind keine Bestandteile dieser Dateiliste. Extern geladene React-/Vue-Peers werden weiterhin nicht als enthaltene Bytes behauptet. `xtensions.runtimeGzipBytes` summiert zusätzlich die mit gzip-Level 9 komprimierten Laufzeitdateien; die bindenden Vergleiche dieses Abschnitts verwenden Rohbytes.

Production und Max formatieren zusätzlich den geschlossenen XTension-Plattformgraphen und alle kopierten Kernel-/Controller-/Resume-Module mit Terser. Kompression und Namensänderung bleiben für diese kopierten Module ausgeschaltet. Verifizierte Provider und der inhaltsadressierte Begleiter bleiben byteidentisch. Der Framework-Anteil der Referenzen sinkt dadurch von rund 2,48–2,53 MB auf rund 1,97–2,01 MB, einschließlich des Kompositionsberichts. Die exakten aktuellen Werte stehen in `integration-evidence.json`.

Die blockierende Referenzprüfung setzt zusätzlich feste Regressionsgrenzen: höchstens **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes** je Referenz. Negativfälle prüfen künstliches Ausgabewachstum bei unveränderter Quellbasis sowie einen eigenständig zu großen, versehentlich unoptimierten XTension-Graphen trotz eingehaltenem Gesamtbudget. Alle drei Referenzen sowie die tatsächlichen Browser-/Paketprüfungen müssen ohne `warn`-/`off`-Ausnahme bestehen.

Manifest v1 behält lokale, importfreie synchrone Komponentenfactorys nach A04.1. [A04.3.1](provider-graphs.md) ergänzt mit Manifest v2 und Artefakt/Bericht v3 gepinnte lokale statische ESM-Graphen samt Transformationsprovenienz. Lazy-/CSP-/Peer-Ladestrategien und Integrität nach weiterer Auslieferung bleiben A04.3. Die Datei-Digests belegen Build-Ausgaben, keine HTTP-Laufzeitbytes. Beide Build-Berichtsversionen behalten `runtimeExecutionVerified: false`; nur die getrennten tatsächlichen Laufzeittests belegen ihre jeweilige Ausführung. SSR, Adoption, Angular, Vanilla und vollständige 0.9-Feature-Abnahme sind nicht Bestandteil dieses Abschnitts.
