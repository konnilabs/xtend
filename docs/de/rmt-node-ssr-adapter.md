# RMT Node SSR Adapter

Serverseitiges Light DOM und Hydration Payloads für Node Hosts.

## Worum es geht

RMT Node SSR Adapter beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.
- Adapter-Contract `xtend.rmt.node-ssr-adapter.v1`.
- JSONL Streaming Frames mit `xtend.rmt.node-ssr-jsonl-frame.v1`.

## Hydration Response Envelope

`render().response` verwendet `renderman_template_prerender_response` mit
`executionMode: "server_prerender_hydrate"`. Die Antwort enthält `chunk`,
`chunks`, `request`, `metadata.adapterKind: "node-ssr"` und
`hydrate_existing` Ziel-Metadaten, sodass die Client Runtime sie direkt über
`hydrateResponse` verarbeiten oder bei Diagnosefehlern kontrolliert degradieren
kann.

## Automatische CSP

Der Adapter erzeugt für jeden Render automatisch eine Framework-Policy
`xtend.rmt.ssr-csp-policy.v1`. `render().headers`,
`render().response.headers`, Hydration-Metadaten, JSONL-Startframes und
`toHttpResponse()` enthalten `Content-Security-Policy` ohne zusätzliche
Host-Verkabelung.

## Beispiel

```js
import { createRmtNodeSsrAdapter } from '@ccslabs/xtend/rmt/node-ssr-adapter';

const adapter = createRmtNodeSsrAdapter({ manifest, sourceTexts });
const result = await adapter.render({ source, filePath: 'app.rmt' });
```

## Empfohlener Ablauf

Beginne bei RMT Node SSR Adapter mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

Wenn dein Backend PHP oder Laravel nutzt, verwende denselben Core-Output mit dem
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md). Beide Adapter teilen
die JSONL Frame-Form für inkrementelle SSR-Ausgaben.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Öffentlicher Vertrag

RMT Node SSR Adapter ist der öffentliche Runtime-Adapter-Vertrag für `docs/de/rmt-node-ssr-adapter.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: SSR-Adapter, Prehydration, Browser-Bridges und die Grenze zwischen Server- und Client-Arbeit.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-node-ssr-adapter.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-node-ssr-adapter.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `xtend.rmt.node-ssr-adapter.v1`

Befehle:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`
- `node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn SSR oder Prehydration abweicht, vergleiche Server-Output, Browser-Bridge und den lokalen Adapter-Test.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
