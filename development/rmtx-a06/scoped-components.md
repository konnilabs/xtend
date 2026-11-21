# Folgeabschnitte – Key-Scopes und Komponenten-SSR v2

**Aktuelle Einordnung vom 21. November 2026:** Dieses weiterhin erhaltene SSR-v2-Profil ist die implementierte Grundlage für signierten Restore, React-/Vue-Adoption und Provider-Intent-Replay. Die [Syntaxentscheidung](syntax-decision.md), die produktiven RMTX-Quellprofile und [A06.5 – Projekt-/Editorintegration](project-tooling/implementation.md) sind inzwischen umgesetzt und lokal geprüft. Die neuen Sourceprofile 4–8 werden damit nicht für SSR/Adoption freigegeben. Die noch offene sourcegetreue RMTX-Zielabnahme, Rollenabnahme und formale Releasebindung stehen in [A06.6](release-acceptance/implementation.md).

Stand: **15. November 2026**. Die Folgeabschnitte sind implementiert: Das neue Komponentenprofil unterstützt verschachtelte Wiederholungen mit typisierten Schlüsseln sowie signiertes Node-SSR, Restore, native React-/Vue-Adoption und Provider-Intent-Replay. [Statisches Profil](automatic-composition.md) und bisheriges SSR v1 bleiben eigenständige Kompatibilitätspfade.

## Versionen

| Bereich | Neues Profil |
| --- | --- |
| Build-Plan / Konfiguration / Manifest | jeweils **v7** |
| Kompositionsartefakt / Buildbericht | **v8**, Daten-API **8.0.0** |
| Kompositions-Build / Runtime | API **12.0.0** / **9.0.0** |
| Browser-Root / Instanz | **v9**, API **9.0.0** |
| Kompositionsport | **v4** für CSR; **v5** für SSR/Adoption |
| Plan-Runtime | **v11** für CSR; **v12** für SSR/Adoption |
| SSR-Modul-API / neues Datenprofil | **2.0.0** / **v2** für Options, Session, Payload, Snapshot, Intent, Report und Response |
| Bestehende Komponenten-/Binding-Verträge | Interface v1 / API 1.0.0; Binding v2, Binding-Artefakt v3 und Binding-API 2.4.0; Resume-Registry API 3.0.0 |

Das bisherige Komponentenmanifest v6 bleibt auf statische Deklarationen beschränkt. Wiederholungen oder SSR werden dort nicht still eingeschaltet. Alte Snapshot-/Intentdaten v1 werden nicht als v2 interpretiert. Die neuen Typen erhalten eigene diskriminierte Schnittstellen. Versionsgebundene Port-Parameter benennen ihren Plan ausdrücklich; zusätzliche Funktionsoverloads verändern dadurch keine Legacy-Port-Typen über `Parameters<typeof …>`.

## Vorhandene Key-Materialisierung als Autorität

Die [Referenz](scoped-reference.cjs) bindet Galerie und Bewertungen an drei Produkte in zwei verschachtelten Model-Kollektionen. Darunter befinden sich numerisches `1`, textuelles `"1"` und erneut numerisches `1` unter einem anderen Elternschlüssel. Daraus entstehen sechs getrennte Host-Adressen und Renderziele bei einem gemeinsamen nativen Surface-Owner.

Die Schlüssel, selektierenden Model-Pfade, Presence und konkreten Host-Surfaces stammen vollständig aus der bestehenden A02-Materialisierung. Die neue Plan-Runtime stellt dem vertrauenswürdigen Composer einen lesenden `resolveHostBinding(address)`-Port bereit. Er liefert nur einen im aktuellen Model materialisierten Host. Vor dem Adapter-Aufruf vergleicht der Composer Adresse, Renderziel, konkretes Binding und Host-Surface mit diesem Ergebnis. Der Provider erhält diesen Port nicht.

Der Build prüft Provider-Regeln und Action-Routen für jede Deklaration, auch bei leeren Kollektionen. Dafür werden Props-Typen und Payload-Regeln getrennt von den bereits vom Binding-Compiler geprüften Template-Pfaden verglichen. Keine zweite Implementierung von `keyBy`, Key-Selektoren oder Presence wird eingeführt. Vertrauenswürdige `keyFields` bleiben von der ursprünglichen Provider-Payload getrennt.

Reordering erhält konkrete Adressen, Framework-Roots und DOM-Knoten. Entfernung entzieht nur den betroffenen Host-Inkarnationen ihre Autorität. Gemeinsame Suspension, Destroy und Cancellation laufen weiterhin über Kernel, Fabric und den nativen Resource-Graph.

## SSR-Handoff und Payload-Regel

`renderMaracaXTensionSSR()` verwendet ausschließlich den tatsächlichen Build-Capture. Ein serialisierter Bericht oder nachträglich veränderte JavaScriptdateien verleihen keine Ausführungsautorität. Der vom Build registrierte Profiltyp entscheidet über SSR v1 beziehungsweise v2; diese Entscheidung kommt nicht aus einem beliebigen Snapshot oder einem veränderten Berichtsfeld.

Der signierte v2-Snapshot bindet Model, typisierte Adressen, konkrete Host-Surfaces, Provider-/Peer-Identität, Identifier-Prefix und DOM an den Artefakt-Digest und die Generation. Zusätzlich stehen **Owner, Template-Renderziel, Interface-Version, Interface-Hash und Provider-Modulhash** in jedem Host-Datensatz und werden gegen den erfassten Vertrag geprüft. Snapshot-, Shell- und Herkunftsprüfung erfolgen vor dem Framework-/Peer-Laden; Restore erfolgt vor der Adoption.

Ein Intent v2 deklariert `payloadOrigin: "provider"`. Seine Payload enthält die ursprünglichen Provider-Felder, beispielsweise `{ order: "rating" }` für Vue. Der vollständige Replay-Batch wird vor dem ersten Business-Command gegen den Provider-Vertrag, das Mapping und die Action-Felder validiert. Replay führt die rohe Provider-Payload durch den normalen Host-Event-Port. Erst dort entsteht `{ sort: "rating" }`; es gibt weder ungeprüftes Durchreichen noch ein zweites Mapping einer bereits normalisierten Action-Payload. Die Registry ergänzt die aktuellen vertrauenswürdigen Schlüssel und prüft die Lifetime.

Dieselbe Regel gilt für während der Adoption gehaltene Events und für spätere Live-Events. Identische Replay-IDs werden einmal ausgeführt; widersprüchliche ID-Wiederverwendung und ungültige Batches werden abgewiesen. Das ist keine Transaktion für beliebige fachliche Action-Nebenwirkungen und keine automatische Deployment-Migration. Exakte Artefakt-/Provider-/Interface-Identität bleibt Voraussetzung.

Fallback `mount` gilt weiterhin nur für abweichendes Framework-DOM nach gültiger Signatur, Herkunft und Shell. Fehlerhafte Identität oder fremde Container werden dadurch nicht akzeptiert. Das vorhandene synchrone SSR-/Exklusivcontainer-Profil bleibt bestehen; asynchrone Komponenten, Portale und Cross-Ownership-Slots sind damit nicht eingeführt.

## Nachweise und Gates

- [9 Vertrags-/Typ-/Negativtests](../../tests/xtensions/scoped-components.test.cjs): Versionen, leere Kollektionen, typisierte Keys, fehlende/duplizierte Schlüssel, manipulierte konkrete Bindings, SSR-v1-Abweisung und öffentliche API-Typen.
- [7 reguläre Buildprüfungen](scoped-inspect.cjs): tatsächliche Bytes, Materialisierung, geschlossene Provider-Regeln, Budget, Sessionversion und GitHub-Anbindung.
- [6 CSR-Fälle](scoped-acceptance.mjs) mit echten Frameworks: getrennte Key-Identität, gezielter Model-Rückweg, Reordering, Entfernung, gemeinsame Suspension und Destroy.
- [35 Node-SSR-/Chromium-Fälle](scoped-ssr-test.cjs): native Adoption mit erhaltenen DOM-Knoten, zuvor abweichender Model-State, leere Kollektionen, gehaltene und spätere Events, Replay/Deduplizierung, Reordering, Reinkarnation, Fallback, Abbruch sowie ungültige Signaturen, Keys, Owner-/Interface-Daten und Replay-Batches.

Der SSR-Test liefert den tatsächlichen versiegelten JavaScriptgraphen samt Importmap/SRI/CSP aus. Das SSR-Dokument komponiert der vertrauenswürdige Testserver aus der Node-SSR-Antwort in die bestehende Dokumenthülle; es wird nicht als unveränderte statische Deployment-Datei ausgegeben. Der Snapshot wird unabhängig signiert und vor der Adoption verifiziert.

Die statischen Prüfungen sind im blockierenden Vorbereitungsgate eingetragen. Die nativen CSR- und SSR-v2-Läufe sind zusätzlich verpflichtend in `xtensions_runtime_gate_suite.js` integriert. Standard-, Migration- und Nightly-Workflows behalten die neuen Nachweise; der zentrale Testkatalog kennt deren eigene Report-Kennungen. Fehlende Peers oder Browser führen zu Fehlern, keinen Skips.

```sh
node development/rmtx-a06/scoped-inspect.cjs --check
node --test tests/xtensions/scoped-components.test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness node development/rmtx-a06/scoped-test.cjs
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/scoped-test.cjs --browser
XTENSIONS_TEST_PEERS=/pfad/zum/peer-harness CHROME_BIN=/pfad/zu/chromium node development/rmtx-a06/scoped-ssr-test.cjs
```

[Statischer Nachweis](scoped-evidence.json) und [Laufzeitnachweis](scoped-runtime-evidence.json) binden die Ergebnisse an die geprüften Quellen. Die absoluten Komponenten-Referenzlimits von **280.000 Bytes XTension-Dateien** und **2.200.000 Bytes Framework-Anteil** bleiben bestehen; das relative Produktionsbudget wird weiterhin strikt gegen die erfassten Quellen und Ausgabebytes geprüft. Auch die bisherigen A04-Limits werden nicht angehoben.

Diese beiden Folgeabschnitte schließen die damals benannten Integrationslücken für das begrenzte Komponentenprofil. Die später angenommene Syntaxentscheidung, das produktive RMTX-Frontend einschließlich geschlossener Ausdrucksprojektionen und die Projekt-/Editorintegration A06.5 sind umgesetzt. Offen bleiben die in [A06.6](release-acceptance/implementation.md) geführten unterstützten Zielkombinationen, die ausdrückliche Lade-/Fallback-/Layoutpolicy und die gemeinsame 0.9-Feature-Abnahme. Die oben genannten historischen Ausführungsnachweise behalten ihre ursprüngliche Reichweite.
