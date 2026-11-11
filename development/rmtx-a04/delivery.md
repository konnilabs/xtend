# A04.3.4 – CSP-Profil und Auslieferungsinventar für native ESM

Stand: 2026-11-11. Der explizite Begleiter und der reguläre asynchrone Maraca-/CLI-Build erzeugen ein versioniertes Auslieferungsinventar für einen nativen ESM-Graphen derselben Origin. Ein tatsächlicher HTTP-/Chromium-Test prüft CSP, MIME und die übertragenen Kompositionsbytes. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`; die produktive Durchsetzung von Byte-Integrität über die gesamte Anwendung bleibt offen.

## Versionen und Einstieg

| Vertrag | Neue Version | Weiter unterstützt |
| --- | --- | --- |
| Kompositionsmanifest | `xtend.maraca.xtension-composition-manifest.v5` | vollständige v1/v2/v3/v4 |
| Artefakt / Build-Bericht | `xtend.maraca.xtension-composition-artifact.v6` / `xtend.maraca.xtension-composition-build-report.v6` | vollständige v1–v5 mit bisherigen API-Versionen |
| Öffentliche Build-/Kompositions-API | `6.0.0` | Verarbeitung aller bisherigen Datenversionen |
| Auslieferungspolicy | `xtend.maraca.xtension-delivery-policy.v1` | neuer geschlossener Opt-in-Vertrag |
| Auslieferungsplan | `xtend.maraca.xtension-delivery-plan.v1` | neuer generierter Deployment-Vertrag |
| Tatsächlicher HTTP-/CSP-Testbericht | `xtend.xtensions.delivery-acceptance-report.v1` | eigener Testnachweis |

Manifest v5 übernimmt den gepinnten lokalen Providergraphen, das Laden im Mount und die gemeinsamen Peer-Gruppen aus [A04.3.3](peer-groups.md). Es verlangt zusätzlich:

```js
loading: { provider: 'on-mount', peers: 'shared' },
delivery: {
  schema: 'xtend.maraca.xtension-delivery-policy.v1',
  mode: 'same-origin-external-esm'
}
```

Fehlende oder fremde Versionen, zusätzliche Ursprünge, frei konfigurierte CSP-Fragmente und behauptete Laufzeitnachweise im Manifest werden zurückgewiesen. Frühere Manifestversionen akzeptieren das neue Feld nicht. Manifest v4 behält seine bisherige gemeinsame Peer-Auflösung ohne Auslieferungsplan. Ladeplan v2 und seine vollständige Ableitung bleiben unverändert; die zusätzliche Deployment-Policy verändert weder Provider-Abschlüsse noch Gruppen. Plan-/Config-v5, Browser-Root-v6, PlanRuntime-v8, Port-v1, Host-API-6 und Größenbericht-v2 behalten ihre äußeren Datenformen. Die 214 Paketexporte und ihr Fingerprint bleiben erhalten.

## Generiertes Deployment-Artefakt

Der Builder erfasst alle Originalbytes vor der Ausgabemutation. Nach der Erzeugung des Begleiters schreibt er `xtend.xtensions.delivery-<sha256>.json`. Build-Bericht v6 verweist über `deliveryFile` darauf und bindet die Datei wie jede andere Ausgabe mit Digest und Bytezahl in `files` ein. Das Inventar enthält:

- `scope: 'composition-graph'`, `entryFile` und den festen Modus;
- die Header `Content-Security-Policy` und `X-Content-Type-Options: nosniff`;
- `javascriptContentType: 'text/javascript; charset=utf-8'`;
- die sortierten Dateien des Begleiters und des vollständigen transitiven Providergraphen mit exaktem SHA-256 und Bytezahl;
- `runtimeDeliveryVerified: false`.

Das Inventar enthält seine eigene Datei nicht: Der übergeordnete Build-Bericht bindet deren Digest. App-Einstieg, Plattform-/Kernelmodule und externe Framework-Peers liegen außerhalb dieses ausdrücklich bezeichneten Inventars. Ihre Auslieferung bleibt Aufgabe der übergeordneten Anwendung. Die bestehenden Build-Berichte behalten ebenfalls `runtimeExecutionVerified: false`.

Der reguläre Build übernimmt die zusätzliche Datei automatisch in seine Ausgaben und die tatsächliche Größenrechnung. Das Inventar wird weder vom Browser geladen noch als Boot-/Mount-Grant behandelt. Nachträglich ausgetauschte Inventarbytes können die gebundene Größen-/Build-Provenienz nicht wiederverwenden.

## CSP und Betrieb

Der feste Header lautet:

```text
script-src 'self'; script-src-elem 'self'; script-src-attr 'none'; object-src 'none'; base-uri 'none'
```

Der Betreiber muss diese durchsetzende Policy auf die HTML-Dokumentantwort anwenden. Eine JSON-Datei oder ein ausschließlich auf Providerantworten gesetzter Header aktiviert keine Dokumentpolicy. Der Builder konfiguriert keinen Webserver. Weitere Anwendungsregeln, etwa für Styles, Datenverbindungen oder Bilder, bleiben Sache der Anwendung; bestehende Policies müssen beim Deployment erhalten bleiben. Zusätzliche Policies wirken als weitere Einschränkungen. `Content-Security-Policy-Report-Only` genügt für diesen Modus nicht.

Der Anwendungseintritt verwendet ein externes Skript, beispielsweise `<script type="module" src="./app-bootstrap.mjs"></script>`. Auch der Peer-Lader muss Frameworks über erlaubte Quellen bereitstellen. Die Policy verlangt keine Freigabe für Inline-Skripte, Attributhandler, `eval`, `Function`, `blob:` oder `data:`. Eine Änderung der Dokumentbasis wird über `base-uri 'none'` blockiert. Native Modulantworten benötigen einen JavaScript-MIME-Typ; der Plan benennt den verwendeten Typ und `nosniff` ausdrücklich. Diese Regeln folgen den [CSP3-Skriptregeln](https://www.w3.org/TR/CSP3/#directive-script-src) und dem [Modul-Fetch-Vertrag des HTML-Standards](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-single-module-script).

Der tatsächliche Ausführungspfad bleibt **Host-Prüfung → echter Kernel-Mount-Job → Fabric → nativer Provider-Import → gemeinsame Peer-Auflösung → exakter Versionsabgleich → eigene Factory/Framework-Root**. CSP- oder MIME-Ablehnung eines Providers oder eines transitiven Helfers scheitert vor Peer-Lader und Factory. Die vorhandenen Lifetime-, Ressourcen- und Cache-Regeln bleiben verbindlich. Es gibt keinen nachgeschalteten Blob-/Eval-Fallback und keine Aufweichung der Policy nach einem Ladefehler.

## Tatsächlicher HTTP-Nachweis

[`test_xtensions_delivery.cjs`](../../scripts/test_xtensions_delivery.cjs) betreibt einen echten lokalen HTTP-Server und Chromium. Ein extern ausgelieferter Testeintritt lädt die regulären Maraca-Ausgaben nativ; er injiziert keine Inline-Skripte und ersetzt keine Modulantwort über Browser-Routing. Ein zweiter Origin dient ausschließlich der negativen Herkunftsprüfung. Zwölf verbindliche Fälle prüfen:

- React-, Vue- und Mixed-Boot einschließlich tatsächlicher Kernel-/Fabric-Zulassung, getrennter Roots und Dispose;
- für React/Vue jeweils einen über CSP blockierten Provider und einen blockierten transitiven Helfer; die gesperrten Anfragen erreichen den Server nicht;
- für beide Frameworks einen falschen Provider-MIME-Typ;
- für beide Frameworks veränderte Helferbytes trotz weiterhin erlaubter Origin;
- blockierte Inline-/Attribut-/Eval-/Blob-/Data-/Fremd-Origin-Ausführung sowie eine blockierte Dokumentbasisänderung.

Der HTTP-Testbericht bindet bei vollständigem erfolgreichen Abruf die tatsächlich über Playwright beobachteten Response-Bodies des Kompositionsinventars an dessen Bytezahlen und Digests. Die positiven Fälle müssen alle erwarteten Dateien genau einmal beobachten. Der Bericht hält außerdem Status, MIME, `nosniff` und Service-Worker-Herkunft fest; Service Worker sind im Testkontext blockiert. Eine unvollständige oder abweichende Beobachtung erhält kein `matchesBuild: true`.

Die beiden Manipulationsfälle rendern weiterhin erfolgreich unter CSP, liefern im unabhängigen Byte-Audit aber genau eine Abweichung. Damit belegt der Test ausdrücklich, dass Origin-Zulassung keine Byte-Integrität erzwingt. `productionByteIntegrityEnforced` bleibt `false`. Die Beobachtung attestiert ausschließlich die konkreten Testantworten; ein Deployment-Inventar, Dateiname oder vorausgehender Kontroll-Fetch attestiert keine spätere native Modulantwort. Vollständige Anwendungskette, Service-Worker-/Cache-/Redirect-Strategien und produktive Browserdurchsetzung benötigen den nächsten A04.3-Abschnitt.

## Gates und Grenze

[`delivery-inspect.cjs`](delivery-inspect.cjs) und [`delivery-evidence.json`](delivery-evidence.json) binden Build, CLI, Datenversionen, geschlossene Policies, vollständiges Inventar, Manipulationsabwehr und strikte React-/Vue-/Mixed-Größenreferenzen an die Quellen. Die festen Grenzen bleiben **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes**; auch das Deployment-Inventar zählt mit.

Das Vorbereitungs-Gate enthält nun 17 blockierende Prüfungen. Der tatsächliche Chromium-Runtime-Gate führt die zwölf HTTP-/CSP-Fälle zusätzlich zu den bisherigen 341 Runtime-Fällen und 88 Compilerprüfungen aus. jsdom ersetzt keine CSP-Durchsetzung. Gepackte Root-/Compiler-/Maraca-Consumer bauen und booten Manifest v5 und prüfen das neue Inventar sowie die öffentlichen Typen. Historische Inventare und bisherige autoritative/veröffentlichte Fingerprint-Sets bleiben erhalten.

[A04.3.5](integrity.md) implementiert darauf aufbauend einen separaten versiegelten Browser-JavaScript-Einstieg. Der hier dokumentierte Auslieferungsplan v1 bleibt bei seinem ursprünglichen Umfang und seinen bisherigen Nachweisaussagen. SSR/Adoption bleibt A05, RMTX-Syntax/DX A06. Der Abschnitt behauptet keine vollständige 0.9-Feature-Abnahme.
