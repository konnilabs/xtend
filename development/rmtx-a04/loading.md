# A04.3.2 – Expliziter Ladeplan und Provider-Laden beim Mount

Stand: 2026-11-11. Der explizite Maraca-Begleiter und der reguläre asynchrone Build einschließlich CLI und Browser-Boot unterstützen verzögertes Laden lokaler Provider. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`. [Gemeinsame Peer-Auflösung](peer-groups.md) ergänzt A04.3.3; weitere Lademodi, CSP-/HTTP-Integrität und die vollständige Feature-Abnahme bleiben offen.

## Versionierter Einstieg

| Vertrag | Neue Version | Weiter unterstützt |
| --- | --- | --- |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v3` | v1: importfrei; v2: statischer lokaler ESM-Graph |
| Kompositionsartefakt | `xtend.maraca.xtension-composition-artifact.v4`, API `4.0.0` | v1/v2/v3 mit ihren vollständigen Verträgen |
| Kompositions-Build-Bericht | `xtend.maraca.xtension-composition-build-report.v4`, API `4.0.0` | v1/v2/v3 |
| Ladeplan | `xtend.maraca.xtension-load-plan.v1` | neuer, ausschließlich aus dem geprüften Graphen abgeleiteter Vertrag |
| Öffentliche Build-/Kompositions-API | `4.0.0` | Verarbeitung der bisherigen Datenversionen |

Manifest v3 übernimmt Provider, Hosts und das vollständige gepinnte Modulinventar aus [A04.3.1](provider-graphs.md). Hinzu kommt eine verpflichtende geschlossene Policy:

```js
loading: { provider: 'on-mount', peers: 'per-host' }
```

Im gesamten verzögerten Providergraphen sind Exporte namens `then` (auch Aliase) ausgeschlossen: Native Imports würden einen solchen Namespace als Promise assimilieren und den Export implizit aufrufen. Manifest v1/v2 behält seine bisherigen Quellregeln.

Andere Lademodi, fehlende Werte und zusätzliche Loader-/URL-/CSP-Angaben werden zurückgewiesen. Manifest v1/v2 akzeptiert dieses Feld nicht und behält sein bisheriges statisches Ladeverhalten. Die äußeren Plan-/Config-v5-, Browser-Root-v6-, PlanRuntime-v8-, Kompositionsport-v1-, Host-API-6- und Größenbericht-v2-Datenformen ändern sich nicht; der neue verschachtelte Vertrag ist explizit versioniert.

## Ladeplan und Ausführung

Der Builder erfasst und validiert weiterhin alle Originalbytes vor der ersten Ausgabemutation. Der vollständige lokale ESM-Graph wird wie bisher erzeugt und über getrennte Quell-/Ausgabedigests gebunden. Artefakt v4 ergänzt `loadPlan` mit genau einem Eintrag pro Provider:

- `providerId`, `entryFile` und `exportName` bestimmen die bereits geprüfte Factory.
- `modules` enthält die vollständige transitive Menge der zugehörigen Ausgabedateien, sortiert und ohne Duplikate. Geteilte Module stehen in mehreren Provider-Abschlüssen und werden tatsächlich einmal ausgegeben.
- `mode: 'on-mount'` und `phase: 'kernel.fabric.mount'` bestimmen den Ausführungszeitpunkt.
- `peers` enthält `mode: 'per-host'`, das Framework und exakt die bisherigen externen Versionsanforderungen.

Der Laufzeitvertrag leitet diesen Plan erneut aus Manifest und Modulgraph ab und verlangt vollständige kanonische Gleichheit. Andere Dateien, Exporte, Peer-Versionen, Phasen oder unvollständige Graphen können dadurch keine Ladeautorität erhalten. Ein Ladeplan ist kein Grant.

Der erzeugte Begleiter importiert keine Provider statisch. Er hält ausschließlich feste native `() => import('./providers/…')`-Closures vor. Das Laden des App-Einstiegs, des Plattformmoduls und des Begleiters fordert daher noch keine Provider-Datei an. Der tatsächliche Pfad lautet:

**Host-Rechteprüfung → echter Kernel-Mount-Job → Fabric → Provider-Import → terminale Prüfung → exakter Peer-Lader → terminale Prüfung/Versionsabgleich → synchrone Factory → Framework-Root.**

Das bekannte Anwendungslader-Interface `loadPeers({provider, signal})` bleibt bestehen. Peer-Runtimes werden in diesem Abschnitt weder implizit installiert noch automatisch zwischen Hosts geteilt. Provider erhalten weiterhin nur ihre Framework-Peers; Komponenten erhalten die bisherigen begrenzten Fähigkeiten.

## Gemeinsame Ladeversuche, Abbruch und Fehler

Eine konkrete Host-Factory teilt den laufenden bzw. erfolgreichen Provider-Ladeversuch je Provider-ID zwischen ihren keyed Hosts. Jeder Host wartet mit seinem eigenen Lifetime-Signal. Der Abbruch eines Wartenden entzieht dessen Fortsetzungsautorität, ohne den gemeinsamen Import eines Geschwisters zu widerrufen. Vor Peer-Laden und Factory-Aufruf wird die eigene Lifetime erneut geprüft.

Native ESM-Imports besitzen hier keinen Transport-Abbruch. Ein bereits begonnener Import kann nach dem letzten Host-Dispose noch abgeschlossen werden und seine Module mit ausschließlich Deklarationen instanziieren. Die [Beschränkung von Top-Level-Ausführung](provider-graphs.md) gilt deshalb weiterhin im gesamten Graphen. Ein verspätetes Ergebnis startet weder Peer-Lader noch Factory und kann keine alte Instanz wiederbeleben. Das ist keine JavaScript-Sandbox und keine Behauptung präemptiver Framework-Kontrolle.

Ein fehlgeschlagener Lader oder ein Namespace ohne den deklarierten Funktions-Export wird aus dem Factory-Cache entfernt. Ein späterer zugelassener Versuch darf den vertrauenswürdigen Lader erneut aufrufen. Der Browser behält seine eigenen ESM-Cache-/Fehlerregeln; es gibt keine Zusage einer automatischen Netzwerkreparatur und kein Cache-Busting durch veränderte Integritäts-URLs. Der Boot-/Host-Cleanup wartet weiterhin auf den logischen Drain über `whenXTensionsIdle()`, nicht auf den unabbrechbaren Transport. Ein neuer Boot erhält eine neue Factory und neue Lifetime-Autorität.

Namespaces und verzögerte Loader sind verschiedene Ports: Artefakt v4 verlangt `loadProviders`; ein vorab geladenes `providers`-Objekt wird abgewiesen. Die bisherigen Artefakte akzeptieren ausschließlich ihren bisherigen Namespace-Port. Der normale Browser-Boot erzeugt diese Ports intern aus dem gebauten Begleiter.

## Nachweise und Budget

[`loading-inspect.cjs`](loading-inspect.cjs) prüft den versionierten Vertrag, feste native Importziele, Ladeplan-Manipulationen und strikte React-/Vue-/Mixed-Builds. [`loading-evidence.json`](loading-evidence.json) bindet diese Ergebnisse an die Quellen. Der Größenbericht v2 zählt sämtliche erzeugten Dateien auch dann, wenn sie beim Start noch nicht geladen werden. Die festen Referenzgrenzen bleiben **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes**, einschließlich der unabhängigen XTension-Grenze.

Die verpflichtenden Laufzeittests ergänzen 13 tatsächliche React-/Vue-/Mixed-Fälle und verlangen nun **318 Fälle je jsdom-/Chromium-Umgebung** sowie weiterhin **88 Compilerprüfungen**. Sie prüfen Zulassung, geteilte Importe und den Abbruch eines einzelnen Wartenden, terminales Dispose, frischen Boot, Laderfehler und fehlende Exporte. Im Chromium-Test protokolliert der HTTP-Testhandler die tatsächlich angeforderten nativen Moduldateien: keine Provider-Anfrage vor Mount, danach exakt Entry, Komponente und gemeinsamer Helfer. Die Bytes werden dabei nicht als HTTP-Integritätsnachweis attestiert.

Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten den neuen Vertrag ohne implizite Framework-Abhängigkeiten und prüfen die öffentlichen Typen. Die bestehenden Legacy-/A04.3.1-Referenzen bleiben verpflichtend. Das Vorbereitungs-Gate umfasst nun 15 blockierende Prüfungen; historische Inventare und autoritative/veröffentlichte Fingerprint-Sets bleiben erhalten.

## Nächster Abschnitt

[A04.3.3](peer-groups.md) ergänzt gemeinsame Peer-Gruppen mit Manifest v4, Artefakt/Bericht v5, Ladeplan v2 und API 5. Weitere CSP-/Auslieferungsregeln folgen. Ein statischer Build-Digest und ein tatsächlich ausgeführter nativer Import belegen weiterhin keine unveränderten HTTP-Laufzeitbytes. SSR/Adoption bleibt A05, RMTX-Syntax/DX bleibt A06.
