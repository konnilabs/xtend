# A04.3.7 – Koordinierte Updates und Cache-Abbau

Stand: 2026-11-13. Der neue Opt-in-Vertrag ermöglicht gleichzeitig geöffnete Anwendungsrevisionen und einen ausdrücklich bestätigten Abbau älterer Browser-Caches. Er verbindet unveränderliche Revisions-URLs, verifizierte Vorgänger-Snapshots und eine begrenzte Client-Abfrage. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`.

## Versionen

| Vertrag | Neue Version |
| --- | --- |
| Öffentliche Kompositions-Build-API | **9.0.0** |
| Deployment-API | **3.0.0** |
| Deployment-Konfiguration / Manifest / Ergebnis | `xtend.maraca.xtension-deployment-config.v3`, `xtend.maraca.xtension-deployment-manifest.v3`, `xtend.maraca.xtension-deployment-result.v3` |
| Laufzeitpolicy | `xtend.maraca.xtension-deployment-runtime-policy.v2` |
| Revisionsbeschreibung | `xtend.maraca.xtension-deployment-revision.v1` |
| Generierter Browserclient / dessen API | `xtend.maraca.xtension-deployment-client.v1` / **1.0.0** |
| Request / Antwort / Challenge / Bestätigung | `xtend.maraca.xtension-deployment-update-request.v1`, `xtend.maraca.xtension-deployment-update-response.v1`, `xtend.maraca.xtension-deployment-update-challenge.v1`, `xtend.maraca.xtension-deployment-update-ack.v1` |
| Tatsächlicher Browsernachweis | `xtend.xtensions.deployment-update-acceptance-report.v1` |

Deployment-v1/v2-Daten behalten ihre API-Versionen 1/2 und ihre vollständigen bisherigen Semantiken. Die Kompositions-Runtime bleibt bei API 6; Kernel, Fabric, PlanRuntime und bestehende Kompositionsartefakte erhalten keine neue ABI. Die 214 Root-Paketexporte bleiben erhalten. Der zusätzliche Browserclient wird gesondert generiert und zum aktuellen Framework-Budget gerechnet; die bestehende XTension-Laufzeit wird nicht vergrößert.

## Deployment und vorgehaltene Versionen

```js
const next = buildMaracaXTensionDeployment({
  schema: 'xtend.maraca.xtension-deployment-config.v3',
  build,
  application: {
    rootDir: applicationDir,
    bootstrap: { fileName: 'bootstrap.mjs', sha256: bootstrapDigest },
    modules: [{ fileName: 'vendor.mjs', sha256: vendorDigest }]
  },
  origin: 'https://app.example',
  publicPath: '/app/',
  outputDir: publicDir,
  runtime: {
    schema: 'xtend.maraca.xtension-deployment-runtime-policy.v2',
    pwa: 'verified-static-cache',
    appServices: 'disabled',
    updates: 'coordinated',
    acknowledgementTimeoutMs: 1000
  },
  retainedDeployments: [previous],
  retainedByteBudget: 5_000_000
});
```

Der Vorgänger muss ein tatsächliches gebautes oder digest-verifiziert geladenes Deployment desselben Ursprungs und Präfixes sein. JSON-Kopien reichen nicht. Bis zu acht Versionen und maximal 64 MiB ausdrücklich budgetierte Historie sind zulässig. Eine leere Liste mit Budget 0 ist der Einstieg ohne Vorgänger. Die Liste ist explizit; Vorgänger ihrer Vorgänger werden nicht automatisch übernommen.

Ein v3-Deployment schreibt seine aktuellen statischen Dateien unter `_xtend/<revision>/`. Bootstrap, Module, Styles, Manifest, Offline-Seite und generierter Client erhalten damit eigene URLs. Das aktuelle HTML-Dokument bleibt am stabilen öffentlichen Einstieg. Alte HTML-Dokumente und Worker werden nicht als statische Historie angeboten. Die Revisionskennung bindet die erfassten Eingabebytes, Policy, Namespace, Vorgängerbeschreibungen und Generatorimplementierung. Sie ist eine Eingabeidentität; der separate Deploymentdigest bindet die vollständigen finalen Ausgabebytes.

Der HTTP-Handler erhält die vorgehaltenen öffentlichen Bytes aus denselben verifizierten Snapshots. Er kann damit ältere Modulantworten unverändert ausliefern, während neue Seiten bereits die neue Revision laden. Private Serverdateien bleiben ausgeschlossen. AppServices-Routen dürfen weder aktuelle noch vorgehaltene statische URLs verdecken; Build und Neustart-Lader weisen solche Überschneidungen zurück. Konfligierende ältere Versionen mit identischen unversionierten URLs und unterschiedlichen Bytes werden zurückgewiesen. Die neue Revision bewahrt die nativen SRI-/Importmap-Prüfungen für jede tatsächliche Modulantwort.

Beim Neustart müssen auch die Vorgänger wieder als verifizierte Objekte bereitstehen:

```js
const loaded = loadMaracaXTensionDeployment({
  rootDir: publicDir,
  manifestSha256: trustedCurrentDigest,
  retainedDeployments: [verifiedPrevious]
});
const handler = createMaracaXTensionDeploymentHandler(loaded);
```

Aktive AppServices bleiben über `appServices: 'separate-server'`, einen getrennten privaten Ausgabeordner und den entsprechenden `serverRootDir` unterstützt. Statische Historie ersetzt weder die Ausführung älterer Serverimplementierungen noch die Versionskompatibilität einer Anwendungs-API. Der Betreiber hält die während eines Rollouts benötigten Versionen ausdrücklich vor.

## Browserintegration

Der Sealer erzeugt `xtend.deployment-client.mjs` und die passende `.d.mts`-Deklaration im Revisionsverzeichnis. Der gepinnte Anwendungsbootstrap importiert diesen Client relativ:

```js
import {
  deployment,
  createDeploymentClient
} from './xtend.deployment-client.mjs';

const updates = createDeploymentClient();
await app.boot({
  // bestehende root-, fabric-, xtensions- und Anwendungsoptionen
  serviceWorkerUrl: deployment.workerUrl,
  serviceWorkerScope: deployment.scope
});

const available = await updates.checkForUpdate();
// Readiness ist eine ausdrückliche Zusage der Anwendung.
app.dispose();
await app.facade.whenXTensionsIdle();
updates.setReadyForRetirement(true);
const collected = await updates.collectRetiredCaches();
```

Der Bereitschaftszustand beginnt mit `false`. Die Anwendung gibt ihn erst frei, wenn sie während einer Abbaurunde keine widersprechende Arbeit beginnen wird. Sie widerruft die Zusage vor neuer Arbeit mit `setReadyForRetirement(false)`. `dispose()` entfernt den Nachrichtenempfänger und widerruft noch offene Zusagen. Der Client führt keine Kernel- oder Fabric-Aktionen selbst aus und entsorgt keine Framework-Roots automatisch.

`status()` fragt den aktiven Worker ab. `checkForUpdate()` stößt die reguläre Updateprüfung an und fragt einen vorhandenen wartenden Worker ab; eine laufende Installation kann eine spätere erneute Abfrage erfordern. `collectRetiredCaches()` richtet sich an den aktiven Worker der eigenen Revision. Fehlende, redundante oder nicht passende Worker führen zu einem blockierten Ergebnis. Es gibt keinen automatischen Seitenreload und keinen `skipWaiting`-Befehl.

## Aktivierung und Client-Zustimmung

Die Worker-URL ist ebenfalls revisionsspezifisch, ihr Scope bleibt das stabile Anwendungspräfix. Ein wartender Worker kann Status liefern, aber keine Caches abbauen. Neue Seiten können bereits ihre eigenen Modul-URLs laden, während ältere Seiten noch vom bisherigen Worker kontrolliert werden. Die Aktivierung erfolgt beim normalen Browser-Lebenszyklus, sobald die bisherigen kontrollierten Clients verschwunden sind. Die [Service-Worker-Spezifikation](https://www.w3.org/TR/service-workers/#clients-matchall) beschreibt Client-Auflistung und Lebenszyklus; die folgenden zusätzlichen Schutzregeln sind der XTend-Vertrag.

Eine Abbaurunde verlangt:

1. Einen lebenden WindowClient im passenden Origin-/Anwendungsscope und einen geschlossenen Request ohne frei wählbare Cache-Namen.
2. Den aktiven Worker derselben Revision; laufende Installationen oder wartende Updates blockieren die Runde.
3. Eine neue zufällige Challenge über einen eigenen MessageChannel für jeden WindowClient im Scope, einschließlich unkontrollierter Clients.
4. Die korrekte Nonce, aktuelle Revision und ausdrückliche Bereitschaft jedes Clients innerhalb von 100–5.000 ms.
5. Einen erneuten unveränderten Client-Snapshot und weiterhin gültige Zusagen vor dem Abbau.

Fehlende Empfänger, ältere Revisionen, beschäftigte Clients, wiederverwendete Bestätigungen oder ein geänderter Clientbestand blockieren. Zeitablauf gilt ausschließlich als Ablehnung. Andere Anwendungen außerhalb des Scopes werden nicht zur Zustimmung aufgefordert. Navigationen warten während der Abbaurunde hinter einer Barriere und erhalten anschließend den aktuellen Netzwerkeinstieg oder die feste Offline-Seite.

Der Worker löscht ausschließlich die exakt in verifizierten Vorgängerbeschreibungen benannten Cache-Namen. Der aktuelle Cache und unbekannte/fremde Cachebestände sind keine Kandidaten. Es gibt keine Suche mit einem allgemeinen Cache-Präfix. Eine Unterbrechung oder späte Widerrufsmeldung kann einen bereits begonnenen Abbau teilweise beenden; `deleted` benennt nur tatsächlich gelöschte Einträge. Der Vorgang ist keine browserweite Transaktion und keine dauerhafte Sperre einer Revision.

Vorgehaltene Modulantworten werden auch nach dem Cache-Abbau weiterhin gegen ihre festen Digests geprüft. Ein späterer Abruf kann den entsprechenden alten Cache erneut befüllen. Der Client entfernt keine serverseitigen Archive; ein Browserbericht autorisiert keinen automatischen Abbau über andere Geräte oder Profile hinweg. Die Gegenprobe im echten Browser hält bewusst eine fremde Seite und einen fremden Cache auf derselben Origin offen.

## Größenrechnung und Vertrauensgrenze

`frameworkBytes` und die bisherigen Referenzgrenzen gelten für die aktuelle Auslieferung: **2.200.000 Framework-Bytes**, **240.000 XTension-Laufzeitbytes**. Client, Deklarationen, zusätzliche Revisionspfade, Worker und Historienmetadaten zählen dabei vollständig mit. Die bestehenden v1/v2-Budgets bleiben unverändert.

`retainedBytes` erfasst zusätzlich bereitgehaltene öffentliche Vorgängerbytes; sie müssen in `retainedByteBudget` passen. `totalBytes` beschreibt weiterhin das aktuelle Paket einschließlich seiner privaten Serverdateien. `hostedBytes` ist diese Summe plus die vorgehaltenen öffentlichen Bytes. Die Historie wird nicht als aktueller Clientdownload ausgegeben oder unbemerkt in dessen Budget versteckt. Der Handler hält die Vorgänger-Snapshots im Speicher; die Vorgängerordner bleiben getrennte Deployment-Artefakte.

Dokument, Header, Worker-Einstieg und unabhängig gesicherte Deploymentdigests bleiben Vertrauensanker. Die Workerregistrierung hat weiterhin keine native SRI-Attestierung. Modulbytes bleiben nativ geprüft, auch bei älteren Cache-/Netzwerkantworten. Die Offline-Ausgabe bleibt eine feste Seite ohne Anwendungszustand. AppServices und andere Datenverbindungen erhalten keine implizite Offline-Mutationswarteschlange.

## Nachweise und Grenze

[`updates-inspect.cjs`](updates-inspect.cjs) und [`updates-evidence.json`](updates-evidence.json) prüfen 22 Revisions-/Build-/Neustartverträge, Pakettypen und feste aktuelle Größenreferenzen. Das Vorbereitungs-Gate enthält 20 blockierende Prüfungen. Die gepackten Root-/Compiler-/Maraca-Pakete erzeugen und laden die neue Revision einschließlich einer expliziten Historie.

[`test_xtensions_updates.cjs`](../../scripts/test_xtensions_updates.cjs) ergänzt **40 tatsächliche Browserfälle**: React/Vue/Mixed laufen in gleichzeitig geöffneten Revisionen; Cache-Misses laden verifizierte Vorgängerbytes; der wartende oder falsche Controller kann keinen Abbau auslösen; beschäftigte und unbekannte Clients sowie alte Bestätigungen blockieren; nur bestätigte eigene Cache-Namen werden gelöscht; aktuelle Graphen und fremde Caches bleiben nutzbar. Vier Fälle prüfen zusätzlich den tatsächlichen Übergang von Deployment v2 nach v3. Kernel-/Fabric-Zulassung und getrennte Framework-Roots werden weiterhin tatsächlich ausgeführt.

Die bisherigen 341 Runtime-Fälle, 88 Compilerprüfungen und separaten Integritäts-/PWA-Fälle bleiben verbindlich. Historische Inventare und alle bisherigen autoritativen/veröffentlichten Fingerprint-Sets bleiben erhalten. Vollständige 0.9-Feature-Abnahme, SSR/Adoption (A05) und RMTX-Syntax/DX (A06) bleiben eigenständige Arbeit.
