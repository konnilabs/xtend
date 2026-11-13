# A05 – Framework-SSR und Adoption

Stand: 2026-11-13. A05 implementiert den ersten vollständigen SSR-/Adoptionspfad für die bereits integrierten React-/Vue-Provider. Die Abnahme umfasst echte Framework-Renderer unter Node und tatsächliche Hydration in Chromium. RMTX und XTensions 2.0 bleiben für 0.9 `preparing`; A06 (Quellsyntax/DX) und die vollständige Feature-Abnahme sind weiterhin offen.

Der reguläre Maraca-Build liefert weiterhin den verifizierten lokalen ESM-Graphen, getrennte externe Framework-Peers und die bestehenden Größenberichte. SSR verwendet denselben kompilierten Model-/Binding-/Provider-Vertrag. Jeder Framework-Host durchläuft weiterhin **Kernel → Fabric → Surface-/Kernel-Resource-Graph → Framework**. Ein Server-Render ist eine eigene Request-Lifetime. Fachliches Suspend/Resume und SSR-Adoption bleiben verschiedene Operationen.

## Einstieg und Versionen

`renderMaracaXTensionSSR` und die Typen sind über die bestehenden Subpfade `@ccslabs/xtend/maraca/xtension-composition` und `@ccslabs/xtend-maraca/xtension-composition` verfügbar. Es werden keine weiteren Root-Exports eingeführt.

| Vertrag | Neue Version | Beibehalten |
| --- | --- | --- |
| Composition-Build-API | 10.0.0 | Deployment-API 3; Manifest-/Artefakt-Daten unverändert |
| Composition-Runtime-API | 7.0.0 | manueller Port v1 und Host v2–v6 |
| Browser-Root / API | v7 / 7.0.0 | Browser-Konfiguration/Root v6 und API 6 |
| Plan-Runtime bei SSR | v9 | reguläre Komposition v8; manuelle Runtime v7 |
| SSR-Composition-Port | v2 | Port v1 ohne SSR |
| Framework-Host / React-/Vue-Adapter | v7 / 7.0.0 | v2–v6 akzeptieren weiterhin nur leere Mount-Container |
| Resume-State-Registry | 3.0.0 | bestehende Registry 2.4.0 und Binding-/Sidecar-Daten |
| Capabilities / Verhandlung bei SSR | v3 / v2 | v2 / v1 ohne SSR |
| SSR-Optionen, Payload, Snapshot, Host-Result, Intent, Bericht und Antwort | v1 | ältere RMT-Resume-Envelope unverändert |

Die neue SSR-Option verändert keine vorhandenen Provider-/Manifestfelder. Deshalb behalten deren Datenverträge ihre bisherigen Kennungen. Die Ausnahme zum Überschreiben alter Schemata aus dem vorherigen A04-Bugfix wird hier nicht übernommen.

## Node-SSR

```js
const { renderMaracaXTensionSSR } = require('@ccslabs/xtend-maraca/xtension-composition');
const response = await renderMaracaXTensionSSR({
  build,                       // tatsächliches erfolgreiches buildMaracaBundleAsync-Ergebnis
  documentTarget, root,        // eigener DOM pro Request, identifizierter leerer App-Root
  fabric,
  generation: requestId,        // explizite Generation, keine Prozess-Incarnation
  expiresInMs: 60_000,
  initialState,
  sign: canonicalPayload => signatureService.sign(canonicalPayload),
  xtensions: {
    grants,                    // explizite vorhandene Lifecycle-/Work-/Event-Rechte
    loadPeerGroup({ group }) {
      return group.framework === 'react'
        ? { React, ReactDOMServer }
        : { Vue, VueServerRenderer, vueServerRendererVersion };
    }
  }
});
// response.html und response.snapshot gemeinsam als eine Antwort ausliefern.
```

Das Node-API verlangt einen tatsächlichen erfolgreichen Build mit Delivery-Manifest v5, `lazy:none` und ohne integriertes PWA/AppServices-Paket. Es akzeptiert keine deserialisierten Build-Berichte als Byte-Autorität. Alle ausgeführten JavaScript-Dateien werden vor Ausführung erneut gegen den privaten Build-Capture geprüft, dann ausschließlich aus diesen Bytes zu einem geschlossenen ESM-Modul gebündelt. Unterschiedliche Bytes gelangen nicht über einen wiederverwendeten Dateipfad in den nativen Modulcache. Unveränderte Module dürfen ihren normalen ESM-Cache behalten; jede Anwendung und jeder Framework-Host erhält eine eigene Lifetime.

Der Serverprozess hat keine ambienten `window`-/`document`-Globals. Das API injiziert den Request-DOM und registriert weder Browser-Auto-Boot noch PWA-Worker. DOM und Framework-Peers werden vom Host geliefert; der Maraca-Consumer bekommt keine zusätzliche implizite DOM- oder Framework-Abhängigkeit. Die Peer- und Grant-Ports werden vor dem ersten asynchronen Schritt erfasst. Vue exportiert die Server-Renderer-Paketversion nicht selbst: Der vertrauenswürdige Loader liefert die gepinnte `vueServerRendererVersion` aus seinem tatsächlich aufgelösten Paket. Der Test verwendet die installierte Paketversion.

React verwendet `ReactDOMServer.renderToString`; Vue verwendet `renderToString(createSSRApp(...))`. Dieses erste Profil verlangt synchrone vorkompilierte Komponenten. React-Suspense-/Template-Ausgaben, explizit asynchrone Vue-Roots und Vue-Teleport werden abgewiesen. Verzögerte oder verschachtelte asynchrone Komponentenadoption, Streaming, serverseitige Interaktion und nachträgliche Server-Props-Updates benötigen eigene Commit-Barrieren und sind nicht Teil dieses Profils. Das Profil prüft keine beliebigen vertrauenswürdigen Komponentenprogramme vollständig auf asynchrones Verhalten.

## Signierter Restore und Ownership

Der Snapshot bindet Generation und Ablaufzeit an Source-Hash, vollständigen Composition-Digest, Root-ID, alle kompilierten Model-States sowie genau die daraus materialisierten Hosts. Die Host-Identität umfasst typisierte Adressen, `hostSurface`, owning Surface, Provider-ID, Framework, Version und Peer-Versionen. Numerische und textuelle Schlüssel bleiben verschieden; die prozesslokale Registry-Incarnation wird nicht persistiert.

Der Host signiert die kanonische Payload; der Client muss sie mit einem expliziten vertrauenswürdigen Verifier prüfen. Ein selbst berechneter Digest reicht nicht. Das Protokoll legt kein eigenes Schlüsselmanagement fest. Snapshots sind JSON-Daten bis 1 MiB, höchstens 1024 Hosts und mit einer Lifetime von höchstens 24 Stunden. Eine verifizierte Generation darf vom Anwendungshost zusätzlich an Session/Benutzer gebunden werden. Der Verifier und das Dokument sind Vertrauensgrenzen; dies ist keine JavaScript-Sandbox für beliebige Provider.

Vor CSS-/Renderer-/Kernel-/Peer-Arbeit prüft der Client Signatur, Ablaufzeit, Quelle, Provider und Shell. Er vergleicht die DOM-Struktur mit Namespace, sortierten Attributen, Text und Kommentaren. Die Framework-Unterbäume werden dabei separat geprüft. Jeder Host besitzt exklusiv alle Nachfahren genau eines Containers. Container müssen eindeutig und disjunkt sein. Das verhindert überlappende Runtime-Ownership; Cross-Framework-Slots und Portale außerhalb der Container benötigen einen weiteren Vertrag.

Der Model-State wird als Initialzustand wiederhergestellt, bevor Presence, Wiederholungen oder Framework-Arbeit beginnen. Die Registry liest danach ihre autoritativen Props aus diesem Model. Der jeweilige Host prüft seinen Container und diese Props vor und nach dem asynchronen Provider-/Peer-Laden erneut. React verwendet `hydrateRoot`, Vue `createSSRApp().mount`. React-`identifierPrefix` und Vue-`app.config.idPrefix` binden zusätzlich Root-ID und Composition-Digest und bleiben pro Host stabil; echte `useId()`-Werte werden in den Browserprüfungen beobachtet.

Die Adoptionsprüfung vergleicht tatsächliche Node-Referenzen. Ein Hydrationsfehler, ein Ersatz von Server-Knoten oder eine Reparatur der signierten DOM-Struktur ergibt keinen erfolgreichen Resume-Bericht. Ressourcen und Callback-Rechte werden über die vorhandenen terminalen Lifetimes entzogen; abgebrochene Verifier/Loader dürfen keinen späteren Boot etablieren.

## Client und Replay

```js
await app.boot({
  root, fabric, dataSourceAdapters,
  xtensions: {
    grants, loadPeerGroup,
    ssr: {
      schema: 'xtend.maraca.xtension-ssr-options.v1',
      mode: 'client',
      snapshot: response.snapshot,
      verify: (canonicalPayload, signature) => verifier.verify(canonicalPayload, signature),
      fallback: 'reject',
      intents: () => capturedIntents
    }
  }
});
```

Frühe Eingaben müssen als **strukturierte, deklarierte XTension-Intents** erfasst werden. Das Profil beansprucht keine automatische Wiedergabe beliebiger roher DOM-Events. Die Queue enthält höchstens 128 Einträge und wird vor der ersten Command-Ausführung vollständig kopiert und geprüft. Ein Eintrag trägt Schema `xtend.maraca.xtension-ssr-intent.v1`, ID, Generation, typisierte Adresse, Event und Payload. Gleiche IDs mit identischen Daten werden einmal angewendet; unterschiedliche Daten unter derselben ID werden abgewiesen.

Die Reihenfolge lautet **verifiziert → Model wiederhergestellt → alle Hosts adoptiert → Replay**. Auch bereits hydrierte Hosts können vor Abschluss der übrigen Hosts keine Model-Intents vorziehen; ihre Events werden gehalten. Replay läuft über den tatsächlichen Host-Event-Port, die vorhandenen Payload-/Key-Regeln und die normale Maraca-Action-/Model-/View-Commit-Kette. Daten können weder Commands frei wählen noch Rechte erweitern. Schlägt die vollständige Adoption fehl, beginnt kein Replay.

Entfernte wiederholte Hosts verlieren ihre Rechte weiterhin synchron am Model-Commit. Umordnung stabiler Schlüssel erhält die bestehenden DOM-Nodes. Eine spätere Wiederaufnahme desselben Schlüssels ist eine neue Lifetime und wird regulär gemountet.

## Ausdrücklicher Fallback

`fallback:'reject'` ist der Standard. `fallback:'mount'` erlaubt bei **gültigem Snapshot und unveränderter Shell-/Container-Ownership** einen frischen Mount des abweichenden Framework-Unterbaums. Der Bericht nennt dann `fallback-mounted` und `nodeIdentityPreserved:false`; andere Hosts können dennoch ihre Knoten erhalten. Ungültige Signaturen, Quellen, State-/Provider-Identitäten oder Shells bekommen dadurch keine Restore-/Replay-Autorität. Fehler während tatsächlicher Hydration werden beendet, nicht als erfolgreicher Fallback verschleiert.

`app.facade.snapshot().xtensionSSR` enthält den Gesamtbericht und die einzelnen Host-Ergebnisse. Der Server liefert `server-rendered`, eine echte Übernahme `resumed`. Diese Aussagen betreffen den beobachteten initialen Handoff, nicht spätere reguläre Host-Lifetimes.

## Nachweise und Grenzen

[`inspect.cjs`](inspect.cjs) prüft die Versionen, Legacy-Einstiege, expliziten Peer-/Session-Grenzen und den begrenzten CJS→ESM-Bridge-Vertrag. [`evidence.json`](evidence.json) bindet diesen Entwicklungsstand an Source-Hashes. Der verpflichtende Browser-Gate führt zusätzlich [`test_xtensions_ssr.cjs`](../../scripts/test_xtensions_ssr.cjs) aus und schreibt `.xtend-test-results/xtend-xtensions-ssr-report.json` mit den tatsächlichen Node-/Chromium-Fällen. Die bisherigen 341 Runtime-Fälle, Compiler-/Paketprüfungen und separaten Delivery-/Integritäts-/Update-Fälle bleiben verpflichtend.

Die eigenen CommonJS-Plattformmodule werden beim Bündeln in statische benannte ESM-Imports/-Exports projiziert. Dadurch kann Rollup ungenutzte Hilfsfunktionen entfernen. Ausgegebenes SSR-/Adoptions-JavaScript wird vollständig in den vorhandenen Größenberichten gezählt; externe Framework-Peers bleiben getrennt. Die Referenzgrenzen bleiben **2.200.000 Framework-Bytes und 240.000 XTension-Runtime-Bytes**.

A05 deckt die bestehenden vorkompilierten React-/Vue-Provider mit exklusiven Containern ab. Angular/Vanilla, Cross-Framework-Portale/-Slots, Streaming, universelle DOM-Event-Aufzeichnung und ein kombiniertes dynamisches SSR-/PWA-/AppServices-Deployment benötigen eigene Nachweise. Die gesonderte RMT-Resume-Envelope und bestehende statische Deployment-/Offline-Verträge bleiben erhalten. Das Entwicklungsprotokoll ersetzt keine vollständige 0.9-Feature-Abnahme.
