# A04.2 – Regulärer Maraca-Build und Browser-Boot

Stand: 2026-11-10. Der lokale A04.1-Begleiter ist in den regulären asynchronen Maraca-Build einschließlich CLI eingebunden. Das erzeugte Browser-Modul komponiert gebundene React-/Vue-Hosts automatisch mit den tatsächlich verwendeten Kernel- und Surface-Ports. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`; A04.3 und die vollständige Feature-Abnahme sind offen.

## Versionierte Einstiege

| Vertrag | Automatische Komposition | Erhaltener bisheriger Einstieg |
| --- | --- | --- |
| Maraca-Build-Plan / Build-Konfiguration | v5 | v4 ohne Kompositionsoption |
| Kompositions-API, Build und Runtime | `2.0.0` | Artefakt-/Bericht-v1 für Plan v4 weiterhin unterstützt |
| Kompositionsartefakt / Build-Bericht | v2 / API `2.0.0` | v1 / API `1.0.0` |
| Vorbereiteter Kompositionsport | v1 | manuelle Host-Factory |
| Browser-Kompositionsroot / API | v6 / `6.0.0` | v5 / `5.0.0` |
| Plan-Runtime | v8 | v7 |
| Manifest / tatsächlicher Host | v1 / API `6.0.0` | unverändert |

Das Schema-Inventar führt je Familie genau eine aktuelle Version. Die bisherigen sechs Familienköpfe werden deshalb als `deprecated` mit Nachfolger geführt; ihre weiterhin unterstützten Defaults, vollständigen Verträge und Fingerprints bleiben erhalten. Damit wird kein öffentliches Lesefenster beendet.

Die neuen Typen heißen `MaracaComposedBuildInput`, `MaracaComposedBuildPlan`, `MaracaComposedBuildConfig`, `IntegratedXTensionCompositionArtifact`, `IntegratedXTensionCompositionBuildReport`, `ComposedMaracaPlanRuntimeOptions` und `MaracaXTensionBootOptions`. Die vollständigen bisherigen Typen bleiben erhalten. Die geordnete Root-Exportfolge bleibt bei 214 Einträgen mit Fingerprint `8a443b512c6993227950c2393eaa722ded512ea4f2243d4c09f527aaf3605924`.

## Build und Anwendung

```js
const { buildMaracaBundleAsync } = require('@ccslabs/xtend-maraca');
const result = await buildMaracaBundleAsync({
  source: 'app.rmt', out: 'dist', profile: 'debug',
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

[`integration-inspect.cjs`](integration-inspect.cjs) prüft 16 Build-/Vertragsfälle einschließlich echtem CLI-Build und bindet Quellen in [`integration-evidence.json`](integration-evidence.json). Es ist die 13. blockierende Prüfung des Vorbereitungs-Gates. [`integrated-composition-acceptance.js`](../../tests/xtensions/integrated-composition-acceptance.js) ergänzt 17 reale Fälle: React, Vue, beide Frameworks gemeinsam, typed Model-/State-Lieferung, interner Surface-Graph, erforderliche Rechte, Abbruch, Retry, Policy-Snapshot, keyed Reinkarnation und geliehene Kernel. Die verpflichtende Laufzeitprüfung umfasst damit 300 Fälle je jsdom-/Chromium-Umgebung sowie 88 Compilerprüfungen. Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten die tatsächlichen generierten ESM-Graphen und prüfen öffentliche Typen ohne implizite Framework-Abhängigkeiten.

Die Größenprüfung bleibt verbindlich: Das wiederholte Vue-Referenzbeispiel liegt im Max-Profil aktuell über dem bisherigen strikten Framework-Budget (Build-Status `built_over_budget`). Der Debug-Pfad ist implementiert und geprüft; die zusätzliche Plattform-/Artefaktgröße benötigt vor Produktionsfreigabe Optimierung und eine belastbare Vergleichsbasis. Das Budget wird durch A04.2 nicht angehoben oder deaktiviert.

Provider bleiben lokale, importfreie synchrone Komponentenfactorys nach A04.1. Transitive Provider-Abhängigkeiten, Chunk-Provenienz, Lazy-/CSP-/Peer-Ladestrategien und Integrität nach weiterer Transformation/Auslieferung sind A04.3. Die Datei-Digests belegen Build-Ausgaben, keine HTTP-Laufzeitbytes. Beide Build-Berichtsversionen behalten `runtimeExecutionVerified: false`; nur die getrennten tatsächlichen Laufzeittests belegen ihre jeweilige Ausführung. SSR, Adoption, Angular, Vanilla und vollständige 0.9-Feature-Abnahme sind nicht Bestandteil dieses Abschnitts.
