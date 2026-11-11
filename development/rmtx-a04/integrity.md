# A04.3.5 – Versiegelter nativer Browser-JavaScript-Graph

Stand: 2026-11-11. Der neue Node-Einstieg versiegelt einen tatsächlich erfolgreichen regulären Maraca-Build zusammen mit expliziten Anwendungs- und Framework-Modulen. Der Browser prüft die endgültigen Modulbytes nativ über SRI und Importmap-Integrität. RMTX und XTensions 2.0 bleiben für 0.9.0 `preparing`.

## Versionierter Vertrag

| Vertrag | Version / Umfang |
| --- | --- |
| Öffentliche Kompositions-Build-API | **7.0.0**, zusätzliche Node-Deployment-Helfer |
| Deployment-API | **1.0.0** |
| Konfiguration | `xtend.maraca.xtension-deployment-config.v1` |
| Manifest | `xtend.maraca.xtension-deployment-manifest.v1` |
| Ergebnis | `xtend.maraca.xtension-deployment-result.v1` |
| Tatsächlicher Browsernachweis | `xtend.xtensions.integrity-acceptance-report.v1` |
| Unveränderte Runtime | Kompositions-API **6.0.0**, Browser-Root v6, PlanRuntime v8, Host-API 6 |
| Vollständig erhaltene Datenverträge | Manifest v1–v5, Artefakt/Bericht v1–v6, Ladepläne v1/v2, Auslieferungspolicy/-plan v1, Größenbericht v2 |

Die Helfer liegen im bestehenden öffentlichen Subpfad `@ccslabs/xtend/maraca/xtension-composition` beziehungsweise `@ccslabs/xtend-maraca/xtension-composition`. Die 214 Root-Paketexporte bleiben erhalten. Build-Bericht und Artefakt v6 behalten ihre bisherige `apiVersion: '6.0.0'`; die neue Build-API-Konstante versioniert die zusätzlich verfügbaren Helfer. Es entsteht kein neuer Browser-Laufzeitcode.

## Anwendung und Server

```js
const { buildMaracaBundleAsync } = require('@ccslabs/xtend/maraca');
const {
  buildMaracaXTensionDeployment,
  loadMaracaXTensionDeployment,
  createMaracaXTensionDeploymentHandler
} = require('@ccslabs/xtend/maraca/xtension-composition');

// Reguläre Optionen mit Manifest v5 und dem expliziten Delivery-Profil.
const build = await buildMaracaBundleAsync(options, { rootDir });
if (!build.ok) throw new Error('Maraca build failed');
const sealed = buildMaracaXTensionDeployment({
  schema: 'xtend.maraca.xtension-deployment-config.v1',
  build,
  application: {
    rootDir: applicationDir,
    bootstrap: { fileName: 'bootstrap.mjs', sha256: trustedBootstrapDigest },
    modules: [{ fileName: 'vendor.mjs', sha256: trustedVendorDigest }]
  },
  publicPath: '/app/',
  outputDir: deploymentDir
});
// sealed.manifestSha256 im vertrauenswürdigen Deployment-System sichern.
// Bei Serverneustart kommt expectedManifestDigest aus diesem System.
const loaded = loadMaracaXTensionDeployment({
  rootDir: deploymentDir, manifestSha256: expectedManifestDigest
});
const handler = createMaracaXTensionDeploymentHandler(loaded);
require('node:http').createServer((request, response) => {
  if (!handler(request, response)) {
    response.writeHead(404); response.end();
  }
}).listen(8080, '127.0.0.1');
```

Das erste Deployment kann unmittelbar den Handler aus `sealed` erstellen. Für einen Neustart muss der erwartete Manifestdigest aus einer unabhängig vertrauenswürdigen Konfiguration stammen. Der Digest derselben ungeprüften Manifestdatei bietet diesen Anker nicht.

Die Anwendung liefert ihren eigenen externen Bootstrap: Er deaktiviert den automatischen Boot vor dem dynamischen Import von `./xtend.maraca.mjs`, erstellt Fabric und bootet die Anwendung mit ihren Grants und `loadPeerGroup`. Ein explizit gepinntes `vendor.mjs` stellt die gewünschten React-/Vue-Versionen bereit. Der Builder installiert keine Frameworks und erzeugt keine Grants. [Die tatsächliche Referenz](../../scripts/test_xtensions_integrity.cjs) führt diesen vollständigen Ablauf aus.

Nur das ursprüngliche erfolgreiche Build-Objekt erhält intern eine Registrierung seiner tatsächlichen Ausgabebytes. JSON-Kopien, rekonstruierte Berichte und veränderte Ausgaben reichen nicht aus. Beim Versiegeln werden alle Bytes erneut gegen diese Registrierung geprüft. Anwendungsdateien verlangen eigene SHA-256-Pins. Statische Imports, Reexports und dynamische Imports müssen literal, relativ und vollständig im JavaScript-Inventar enthalten sein. Bare-, Remote-, berechnete und fehlende Modulziele scheitern vor der Ausgabe. Pfade sind kanonisch; Symlinks in Mitgliedspfaden werden zurückgewiesen. Inventar und Einzeldateien sind begrenzt.

## Native Browserdurchsetzung

Der generierte Host enthält genau eine Importmap mit Integritätsmetadaten für sämtliche JavaScript-Mitglieder: Anwendungseinstieg, Vendor-/Peer-Module, App, Plattform, Kernel, Begleiter und Providergraph. Der externe Moduleinstieg trägt zusätzlich explizite SRI-Metadaten. Der Handler setzt auf die Dokumentantwort:

- eine ausschließlich aus SHA-256-Quellen bestehende `script-src`-Policy einschließlich des exakten Importmap-JSON-Hashes;
- `script-src-attr 'none'; object-src 'none'; base-uri 'none'; worker-src 'none'`;
- `Integrity-Policy: blocked-destinations=(script)`;
- `X-Content-Type-Options: nosniff` und `Cache-Control: no-store, no-transform`.

Es gibt keine Origin-Freigabe, Nonce oder `strict-dynamic`-Delegation. Fehlen die Importmap oder einzelne Integritätsmetadaten, erhält ein importiertes Modul keine passende Hash-Autorisierung. Der native Browser verweigert die Ausführung. Die Importmap wird ausschließlich über ihren exakten Hash zugelassen. Die [HTML-Regeln zur Importmap-Integrität](https://html.spec.whatwg.org/multipage/webappapis.html), [Subresource Integrity](https://www.w3.org/TR/sri/) und der [CSP-Abgleich mit Integritätsmetadaten](https://www.w3.org/TR/CSP3/#does-integrity-metadata-match-source-list) definieren diese Prüfungen.

Der Referenzhandler lädt bei Erstellung einen privaten unveränderlichen Byte-Snapshot. Spätere Dateiänderungen verändern keine Antwort; ein erneutes Laden gegen den vertrauenswürdigen Manifestdigest schlägt dann fehl. Antworten erhalten eigene Bufferkopien. Der Handler bedient ausschließlich kanonische GET-/HEAD-Pfade innerhalb seines Präfixes, liefert unbekannte Dateien mit 404 und andere Methoden mit 405. Query-/Prozent-/Traversal-Aliasse werden nicht auf Inventarmitglieder umgeschrieben. Er erzeugt keine Redirects und transformiert keine Bytes. Ein Reverse Proxy muss die Dokumentheader erhalten.

**Dokument, Header und der Deployment-Digest bilden den vertrauenswürdigen Einstieg.** Produktiv ist HTTPS erforderlich; der lokale Nachweis verwendet eine vertrauenswürdige Loopback-Umgebung. Wer das Root-Dokument oder seine Header ersetzen kann, kann auch die Policy ersetzen. SRI attestiert endgültige Antwortbytes, keine finale Redirect-URL. Ein vorgeschalteter Kontroll-Fetch ist kein Ausführungsnachweis.

Der Umfang ist der versiegelte **Browser-JavaScript-Graph**. HTML als Vertrauensanker, Styles, Daten und weitere Anwendungsressourcen benötigen ihre jeweiligen Auslieferungsregeln. Bereits aktive Service Worker können Antworten aus ihrem Cache liefern: Native Integrität prüft auch diese Modulbytes. Der Handler entfernt keine Service Worker; neue Worker werden durch die Dokumentpolicy gesperrt. Die neue Deployment-API v1 weist PWA-/AppServices-Builds deshalb zurück. Deren bisherige Buildpfade bleiben nutzbar; ihre Integration benötigt einen eigenen Vertrag. Ein Browser ohne passende native Unterstützung ist für diesen Modus nicht freigegeben. Geprüft wird tatsächlich Chromium 156; jsdom stellt keinen Ersatznachweis dar.

Der Mount-Pfad bleibt **Host-Grants → echter Kernel-Mount-Job → Fabric → nativer Provider → Peer-Gruppe → Factory**. Die Referenz prüft die tatsächlichen Zulassungen, getrennte Framework-Roots und vollständiges Dispose. Bytefehler in Provider-/Helfermodulen scheitern vor Peer-Auflösung und Factory.

## Größenrechnung und Gates

`accounting` beim Versiegeln erfasst sämtliche Dateibytes plus Manifest. `applicationBytes` weist explizite Bootstrap-/Vendor-Bytes separat aus. Zusätzliche HTML-/Inventarbytes zählen als `envelopeBytes` zum vorhandenen Framework-Budget; `xtensionRuntimeBytes` bleibt die tatsächlich erfasste bisherige Laufzeit. Das Neustart-Ergebnis behauptet keine erneute Build-Größenprovenienz und enthält daher kein `accounting`. Alle Ergebnisse behalten `runtimeExecutionVerified: false`.

Die strikten React-/Vue-/Mixed-Referenzen halten unverändert **2.200.000 Framework-Bytes** und **240.000 XTension-Laufzeitbytes** ein. Das versiegelte Ergebnis prüft zusätzlich die erfasste vergleichbare Framework-Baseline. Die externen Framework-Peers werden transparent als Anwendungsbytes ausgewiesen.

[`integrity-inspect.cjs`](integrity-inspect.cjs) und [`integrity-evidence.json`](integrity-evidence.json) binden den Vertrag und die Quellen. Das Vorbereitungs-Gate enthält 18 blockierende Prüfungen. Gepackte Root-/Compiler-/Maraca-Consumer prüfen Aufbau, Neustart, HTTP-Handler und öffentliche Typen.

Der verbindliche Chromium-Runtime-Gate ergänzt **23 native Integritätsfälle** zu den bisherigen zwölf HTTP-/CSP-Fällen, 341 Runtime-Fällen und 88 Compilerprüfungen. Er umfasst erfolgreiche React-/Vue-/Mixed-Boots, jeweils veränderte Bootstrap-/Peer-/App-/Plattform-/Kernel-/Begleiter-/Helferantworten, fehlende Importmap oder Helfermetadaten, unbekannte Module, gültige und manipulierte Service-Worker-Cacheantworten sowie manipulierte Redirectantworten. Alle veränderten Antworten müssen ohne Ausführung der Manipulation scheitern. Native Browserdurchsetzung ist eine Aussage dieses gesonderten Testberichts.

Historische Inventare und sämtliche früheren autoritativen/veröffentlichten Fingerprint-Sets bleiben erhalten. [A04.3.6](runtime.md) ergänzt einen eigenen versionierten PWA-/AppServices-Vertrag; dieser v1-Einstieg behält seine bisherigen Grenzen. SSR/Adoption bleibt A05, RMTX-Syntax/DX A06. Vollständige 0.9-Feature-Abnahme bleibt offen.
