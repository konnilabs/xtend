# RMT Node SSR Adapter

Serverseitiges Light DOM und Hydration Payloads für Node Hosts.

## Worum es geht

Der Node SSR Adapter rendert RMT Core-Records serverseitig und liefert ein Hydration Envelope für den Browser. Er besitzt keinen DOM-Browser und darf deshalb nur serialisierbare, policy-geprüfte Ausgabe erzeugen.

## Öffentliche Bausteine

- `xtendrmt/rmt-node-ssr-adapter.js` implementiert Rendern und Streaming.
- `xtendrmt/rmt-node-ssr-adapter.d.ts` beschreibt die öffentliche Adapter-API.
- `rmt-node-ssr-adapter` prüft Envelope, CSP, Hydration und JSONL-Streaming.

- Adapter-Contract `xtend.rmt.node-ssr-adapter.v1`.
- JSONL Streaming Frames mit `xtend.rmt.node-ssr-jsonl-frame.v1`.

## Hydration Response Envelope

`render().response` verwendet `rmt_template_prerender_response` mit
`executionMode: "server_prerender_hydrate"`. Die Antwort enthält `chunk`,
`chunks`, `request`, `metadata.adapterKind: "node-ssr"` und
`hydrate_existing` Ziel-Metadaten, sodass die Client Runtime sie direkt über
`hydrateResponse` verarbeiten oder bei Diagnosefehlern kontrolliert degradieren
kann.

Die Auswahl zwischen normaler SSR-Hydration, verzögerter Hydration und einer vollständigen Resume-Übergabe ist in [Hydration Policies](./hydration-policies.md) mit RMT-Beispielen beschrieben.

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

Übergib normalisierte Core-Records, validiere den Response-Status und sende Markup, Resume-Daten und CSP-Metadaten gemeinsam. Bei einer Policy-Diagnose liefert der Adapter einen Fehlerreport statt unsicheren Ersatz-HTMLs.

Wenn dein Backend PHP oder Laravel nutzt, verwende denselben Core-Output mit dem
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md). Beide Adapter teilen
die JSONL Frame-Form für inkrementelle SSR-Ausgaben.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
