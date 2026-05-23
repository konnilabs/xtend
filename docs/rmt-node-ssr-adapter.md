# RMT Node SSR Adapter

Der Node SSR Adapter ist die leichte serverseitige Host-Schicht fuer RMT
vNext. Er erzeugt Light-DOM-HTML fuer XTend Custom Elements, Hydration-
Payloads im bestehenden RenderMan-Shape und optional JSONL-Frames fuer
inkrementelle UI-Ausgabe. Das Modul ist bewusst kein HTTP-Server und kein
Parallelrenderer.

Schema: `xtend.rmt.node-ssr-adapter.v1`

Export:

```js
import {
  createRmtNodeSsrAdapter
} from '@ccslabs/xtend/rmt/node-ssr-adapter';
```

Das Runtime-Paket exportiert dieselbe API ueber
`@ccslabs/xtend-rmt/node-ssr-adapter`.

Fuer PHP/Laravel-Hosts gibt es denselben Client-Wire-Contract ueber den
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md). Beide Adapter liefern
kompatible HTML-, Hydration-, RenderMan-Chunk- und JSONL-Frames.

## Rolle im Stack

RMT bleibt die App-Beschreibung. Der Compiler erzeugt Core-/Kernel-Records,
Fabric fuehrt Scheduling-Absicht aus, die Component Capability Registry
beschreibt XTend UI generisch, und der Node SSR Adapter materialisiert daraus
serverseitige Startausgabe.

Der Adapter:

- instanziiert keine Custom Elements auf dem Server
- rendert kein Component-Shadow-DOM
- nutzt keine privaten Component-Maps
- startet keinen HTTP-Server
- nutzt keinen impliziten globalen Netzwerkzugriff
- serialisiert nur sichere Host-Ausgabe mit Trust-Boundary-Diagnostics

## Public API

```js
const adapter = createRmtNodeSsrAdapter({
  manifest,
  sourceTexts,
  endpointHandlers: {
    'ssr.hero': () => ({
      html: '<x-hero>Hero</x-hero>',
      trustBoundary: 'xtend.security.sanitizing-boundary.v1'
    })
  },
  sanitizeHtmlOutput(html) {
    return html;
  }
});

const result = await adapter.render({
  source,
  filePath: 'app.rmt'
});

for await (const line of adapter.streamJsonl({ source })) {
  process.stdout.write(line);
}
```

`render(input, options)` akzeptiert `.rmt` Source, RMT vNext Core Documents,
Prepared Templates und DOM Descriptoren. Im Vollpaket wird die Source-
Kompilierung automatisch ueber den bestehenden vNext Compiler verdrahtet. Im
Runtime-only-Paket muss `compileRmtVNextSource` injiziert werden; sonst meldet
der Adapter `rmt.node_ssr.compiler_required`.

## Render-Ergebnis

`adapter.render(...)` liefert `xtend.rmt.node-ssr-render-result.v1`:

- `html`: serverseitiges Light DOM fuer XTend Custom Elements
- `head.preloads`: Lazy-Import-Hints aus Component Capabilities
- `chunks`: `renderman_template_chunk` im bestehenden
  `server_prerender_hydrate`-Shape
- `hydration`: serialisierbares Payload fuer die Browser-Hydration
- `streamingContract`: vorhandener `xtend.rmt.vnext-streaming-contract.v1`
  Contract, wenn das Dokument Streaming beschreibt
- `componentCapabilities`: normalisierte XTend Component Capability Marker
- `diagnostics`: blockierende und nicht-blockierende Host-Diagnostics

## JSONL Streaming

`streamJsonl(input, options)` erzeugt newline-delimited JSON Frames mit Schema
`xtend.rmt.node-ssr-jsonl-frame.v1`.

Frame-Typen:

- `start`
- `component`
- `html`
- `hydration`
- `diagnostic`
- `complete`
- `error`

Jeder Frame traegt `requestId`, `sequence`, `operationId`, `variant`,
`capability`, `lane`, `chunkKey`, `payload` und `diagnostics`. SSR-Frames
nutzen `stream.ssr.incremental`; Hydration-Frames nutzen
`stream.hydration.chunked`.

## DataSource Resolver

Serverdaten sind immer Host-Verantwortung. Nutze eine der expliziten
Integrationen:

- `resolveDataSource(record, context)`
- `endpointHandlers[target]`
- `staticDataSources`
- `fixtures`
- `fetchAdapter(record, context)`

Wenn ein RMT-Streaming- oder Endpoint-Record keinen Resolver hat, meldet der
Adapter `rmt.node_ssr.datasource_missing`. Dadurch bleibt der Kernel frei von
Host-Netzwerkannahmen.

## Trust Boundary

HTML-Fragmente aus Hosts, Endpoints oder Streaming muessen eine Boundary wie
`xtend.security.sanitizing-boundary.v1` oder
`xtend.security.streaming-boundary.v1` tragen. Unsichere URLs, Event-
Attribute, `srcdoc` und blockierte Tags werden diagnostiziert und vom
Fallback-Sanitizer entfernt. Produktive Hosts sollten `sanitizeHtmlOutput`
injizieren.

## Gates

```bash
npm run test:rmt-node-ssr-adapter
node scripts/run_xtend_tests.js rmt-node-ssr-adapter --json
```

Der Adapter ist Teil des RMT vNext Primitive Gates:

```bash
npm run test:rmt-vnext-primitives:report
```
