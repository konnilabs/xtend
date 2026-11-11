# A04.3.6 – PWA und AppServices im versiegelten Deployment

Stand: 2026-11-11. Der reguläre asynchrone Maraca-Build mit XTensions lässt sich nun auch mit PWA und AppServices versiegeln. Ein expliziter Vertrag trennt öffentliche Browserausgaben, private Server-Artefakte und geprüfte statische Cache-Inhalte. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`.

## Versionen und Kompatibilität

| Vertrag | Version |
| --- | --- |
| Öffentliche Kompositions-Build-API | **8.0.0** |
| Deployment-API | **2.0.0** |
| Deployment-Konfiguration | `xtend.maraca.xtension-deployment-config.v2` |
| Deployment-Manifest | `xtend.maraca.xtension-deployment-manifest.v2` |
| Deployment-Ergebnis | `xtend.maraca.xtension-deployment-result.v2` |
| Geschlossene Laufzeitpolicy | `xtend.maraca.xtension-deployment-runtime-policy.v1` |
| Tatsächlicher Browser-/HTTP-Nachweis | `xtend.xtensions.deployment-runtime-acceptance-report.v1` |

Die bisherigen vollständigen Deployment-v1-Daten behalten API `1.0.0`, ihren ursprünglichen Hash-Header, Neustart-Lader und HTTP-Snapshot. Config v1 weist PWA und AppServices weiterhin zurück. Build-API 8 verarbeitet die alten und neuen Datenversionen; die Deployment-API-Konstante bezeichnet die aktuelle Helfer-API. Kompositions-Runtime-API 6, Manifest v1–v5, Artefakt/Bericht v1–v6 und ihre früheren Semantiken bleiben erhalten. Es gibt keine neue Kernel-, Fabric-, PlanRuntime- oder Browser-Kompositions-ABI. Die 214 Root-Paketexporte bleiben unverändert.

## Expliziter Einstieg

```js
const sealed = buildMaracaXTensionDeployment({
  schema: 'xtend.maraca.xtension-deployment-config.v2',
  build, // tatsächlicher erfolgreicher regulärer Build mit Delivery-Profil
  application: {
    rootDir: applicationDir,
    bootstrap: { fileName: 'bootstrap.mjs', sha256: bootstrapDigest },
    modules: [{ fileName: 'vendor.mjs', sha256: vendorDigest }]
  },
  origin: 'https://app.example',
  publicPath: '/app/',
  outputDir: publicDir,
  serverOutputDir: privateDir,
  runtime: {
    schema: 'xtend.maraca.xtension-deployment-runtime-policy.v1',
    pwa: 'verified-static-cache',
    appServices: 'separate-server'
  }
});
```

Die Policy muss zu den tatsächlich erfassten Build-Funktionen passen. Alternativ sind jeweils `pwa: 'disabled'` und `appServices: 'disabled'` möglich. Nur aktive AppServices erhalten ein `serverOutputDir`. Die Origin muss kanonisches HTTPS oder eine vertrauenswürdige lokale Loopback-Origin sein. Pfade und Ausgabeordner werden vor dem Schreiben geprüft; öffentliche und private Ausgaben dürfen einander, die Build-Ausgabe und Anwendungseingaben nicht überlagern. Nachträgliches Ändern von Plan-/Berichtsobjekten ersetzt keine tatsächliche Build-Provenienz.

Beim Neustart werden öffentliche und private Mitglieder gegen den unabhängig gesicherten Manifestdigest geprüft:

```js
const loaded = loadMaracaXTensionDeployment({
  rootDir: publicDir,
  serverRootDir: privateDir,
  manifestSha256: trustedDeploymentDigest
});
const staticHandler = createMaracaXTensionDeploymentHandler(loaded);
```

Der Lader führt keinen Servercode aus. Die Anwendung betreibt ihren vorhandenen AppServices-Host gesondert, beispielsweise mit `createNodeAppServiceHost`, der generierten privaten Node-Definition, dem privaten Servicemanifest und den bestehenden Request-/Origin-Regeln. Bei einer gemeinsamen HTTP-Anwendung wird dieser Host vor dem statischen Handler aufgerufen. Der statische Handler delegiert den erfassten AppServices-Pfad auch innerhalb seines öffentlichen Präfixes. Er erzeugt keine Berechtigungen und ändert keine AppServices-Wire-, Eingabe-, Abbruch- oder Streamingverträge.

Die [ausführbare Referenz](../../scripts/test_xtensions_deployment_runtime.cjs) importiert das tatsächlich erzeugte private Node-Bundle und prüft **kompilierte RMT-Action → AppServices-Transport → echter Node-Host** zusammen mit den React-/Vue-Hosts. Framework-Mounts bleiben **Host-Grants → Kernel-Job → Fabric → Provider → Peer-Gruppe → Factory**.

## Private AppServices-Ausgaben

Der reguläre Service-Builder erfasst seine tatsächlich erzeugten Dateien vor der Rückgabe. Der Sealer prüft sie erneut und kopiert Server-Bundles, Server-Sourcemaps, Deklarationen und Servicemetadaten ausschließlich in den getrennten privaten Ausgabeordner. `serverFiles` im Manifest enthält deren relative Namen, Bytezahlen und Digests. Die öffentlichen `files` und die Browser-Importmap enthalten diese Dateien nicht; HTTP-Zugriffe darauf erhalten 404.

Private Quellpfade, Serverdateinamen und der reservierte Workerpfad können keine expliziten Anwendungsmodule ersetzen. Der vorhandene Browser-Service-Compiler verhindert weiterhin Serverimporte im Clientgraphen. Der öffentliche HTTP-Handler liefert einen unveränderlichen Snapshot seiner öffentlichen Mitglieder. Eine Änderung privater Dateien lässt das Laden des gesamten Deployments scheitern. Die Digestprüfung belegt gespeicherte Server-Artefakte; die Ausführung und Provisionierung des Server-Hosts bleiben Verantwortung der Anwendung. PHP-Implementierungen außerhalb der erzeugten Artefakte werden durch diesen Sealer nicht neu paketiert oder attestiert.

## Geschlossener PWA-Worker

Der neue Modus ersetzt den bisherigen allgemeinen PWA-Worker in der öffentlichen Deployment-Ausgabe durch `xtend.sealed-service-worker.js`. Der ursprüngliche Worker, sein PWA-Bericht und sein Offline-Dokument bleiben Build-Ausgaben und werden vom neuen Handler nicht angeboten. Start-URL und Scope des erzeugten Web App Manifest werden auf das explizite öffentliche Deploymentpräfix gesetzt; seine Datei ist ebenfalls gepinnt und wird mit Manifest-MIME ausgeliefert. Der erzeugte Worker besitzt keine Business-Logic-Imports, frei konfigurierten Cache-Regeln oder zusätzlichen Workerimporte. Der neue Sealer weist benutzerdefinierte Workerimporte, Modul-Worker und aktivierte UI-Coprozessoren zurück. Die bisherigen regulären PWA-Builds behalten ihre Funktionen.

Der explizit gepinnte Bootstrap übergibt beim bestehenden Browser-Boot:

```js
await app.boot({
  // bestehende root-, fabric-, xtensions- und Anwendungsoptionen
  serviceWorkerUrl: new URL('./xtend.sealed-service-worker.js', import.meta.url).href,
  serviceWorkerScope: new URL('./', import.meta.url).href
});
```

Die Dokument-CSP behält die Hash-Freigaben für Bootstrap, Importmap und vollständigen Browser-JavaScript-Graphen. `worker-src` erlaubt ausschließlich die konfigurierte Origin und den exakten erzeugten Workerpfad. Der Worker erhält `Service-Worker-Allowed` für das Deploymentpräfix sowie eine eigene CSP mit `default-src 'none'; connect-src 'self'; script-src 'none'; worker-src 'none'`. Damit sind seine benötigten Fetches erlaubt, zusätzliche Skript- und Workerimporte gesperrt.

Die Workerregistrierung besitzt nach dem [Service-Worker-Vertrag](https://w3c.github.io/ServiceWorker/#navigator-service-worker-register) keine SRI-Option. **Dokument, Sicherheitsheader, Worker-Einstieg und gesicherter Deploymentdigest sind vertrauenswürdige Betriebskomponenten.** Der Server-Snapshot bindet die erzeugten Workerbytes; der Browser attestiert deren Registrierung nicht über SRI. Die [CSP-Worker-Regeln](https://www.w3.org/TR/CSP3/#directive-worker-src) begrenzen den erlaubten Worker-Einstieg. Die Browser-Importmap enthält ausschließlich die gesondert nativ geprüften Anwendungsmodule, keine Behauptung einer nativen Worker-Integritätsprüfung.

## Cache, Navigation und Updates

Nur die vollständig erfassten öffentlichen JavaScript-, CSS-, Manifest-, Bild- und Schriftdateien sowie die feste Offline-Seite sind Cache-Mitglieder. Private Artefakte, API-Antworten, Navigationsdokumente, Deploymentmetadaten und unbekannte URLs sind ausgeschlossen. Query-Aliasse werden nicht auf Cache-Mitglieder abgebildet. Die statischen Dateien gelten durch diesen expliziten Opt-in als öffentlich und unveränderlich.

Bei Installation lädt der Worker sämtliche Mitglieder ohne Credentials mit festen [Fetch-Integritätsmetadaten](https://fetch.spec.whatwg.org/#request-integrity-metadata), ohne HTTP-Cache und mit Redirect-Ablehnung. Er prüft zusätzlich Status, Bytezahl und SHA-256. Erst nach vollständiger Prüfung beginnt das Befüllen seines eigenen Cache. Das Vorladen erfasst Bytes und führt keine Provider-Module oder Factorys aus; deren Import und Ausführung bleiben beim zugelassenen Mount. Ein fehlgeschlagenes Mitglied verhindert die Aktivierung. Auch jede Cache-Antwort wird erneut geprüft; manipulierte Cache-Inhalte führen zum Ladefehler. Die nativen SRI-/Importmap-Prüfungen aus A04.3.5 bleiben für die tatsächlichen Modulantworten zusätzlich aktiv.

Der Cachename bindet Origin, Deploymentpfad und sämtliche Cache-Digests. Der Worker verwendet nur diesen eigenen Cache, durchsucht keine fremden Caches und löscht keine Cachebestände. Normale Updates warten auf den bestehenden Service-Worker-Lebenszyklus; es gibt kein automatisches `skipWaiting`. Die Aktivierung übernimmt Clients über den normalen Scope. Ein Abbau älterer Versionen benötigt einen eigenen Vertrag mit den noch aktiven Clients.

Navigation verwendet das Netzwerk. Bei einem tatsächlichen Netzwerkausfall erscheint eine feste Offline-Seite mit `default-src 'none'`, ohne App-Code und ohne State-Restore. Vollständiger Offline-App-Boot wird hier nicht behauptet. GET-/POST-AppServices, Auth-Requests und andere Datenverbindungen bleiben auf ihrem bisherigen Netzwerkpfad; es gibt keine implizite Offline-Mutationswarteschlange.

## Größenrechnung und Nachweise

Alle öffentlichen Dateien einschließlich Worker, Offline-Seite und Manifest zählen vollständig mit. `publicBytes` weist dieses Paket aus, `serverBytes` die getrennten privaten Dateien und `totalBytes` deren Summe. `applicationBytes` bleibt die explizite Bootstrap-/Vendor-Summe. `pwaWorkerBytes` macht den zusätzlichen Worker sichtbar. `envelopeBytes` beschreibt die Differenz zur erfassten Build-Ausgabe einschließlich ersetzter PWA-Dateien; dieser Wert kann negativ sein. Der neue Worker zählt zum Framework-Budget, die XTension-Laufzeit bleibt separat erfasst.

Die Referenzen halten weiterhin **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes** ein. Das Referenzprojekt erzeugt eigene kleine, gültige PNG-Markenassets. Es blendet keine Ausgabebytes aus. Die großen Branding-Quelldateien des XTend-Repositories können einen strikten PWA-Build über das Budget bringen; sie werden vollständig berechnet. Die gesonderten bisherigen React-/Vue-/Mixed-Referenzen bleiben unverändert verbindlich.

[`runtime-inspect.cjs`](runtime-inspect.cjs) und [`runtime-evidence.json`](runtime-evidence.json) prüfen 24 Build-/Vertragsfälle einschließlich privater Partition, Versionsgrenzen, Manipulationen, Workerpolicy und AppServices ohne PWA. Das Vorbereitungs-Gate besitzt 19 blockierende Prüfungen. Gepackte Root-/Compiler-/Maraca-Consumer prüfen die neuen Helfer, privaten Service-Ausgaben und öffentlichen Typen.

Der verbindliche Chromium-Gate ergänzt **zehn tatsächliche PWA-/AppServices-Fälle** zu den bisherigen 23 Integritäts-, zwölf HTTP-/CSP-, 341 Runtime- und 88 Compilerprüfungen. Die neuen Fälle prüfen React/Vue mit echtem AppServices-Host, Mixed-Hosts, tatsächliche Cache-Antworten, manipulierte Cache-Inhalte, korrupte und umgeleitete Installationsantworten, private HTTP-Pfade, die Offline-Seite, reine Netzwerk-API-Aufrufe und blockierte Legacy-Worker. Der Bericht kennzeichnet `trustedWorkerRequired: true` und `workerRegistrationIntegrityEnforced: false` ausdrücklich.

Historische Inventare und alle früheren autoritativen/veröffentlichten Fingerprint-Sets bleiben erhalten. Der nächste A04-Einstieg ist ein koordinierter Update- und Cache-Abbauvertrag über aktive Clients. Vollständiger Offline-App-State, SSR/Adoption (A05), RMTX-Syntax/DX (A06) und vollständige 0.9-Feature-Abnahme bleiben eigenständige Arbeit.
