# RMT Node SSR Adapter

Der Node SSR Adapter ist die leichtgewichtige serverseitige API fuer XTendRMT.
Er erzeugt Light-DOM-HTML fuer XTend Custom Elements, Hydration-Payloads im
RenderMan-kompatiblen Format und optional JSONL-Streaming fuer inkrementelle
UI-Komponenten.

Schema: `xtend.rmt.node-ssr-adapter.v1`

```js
import {
  createRmtNodeSsrAdapter
} from '@ccslabs/xtend/rmt/node-ssr-adapter';
```

Im Runtime-Paket steht dieselbe API ueber
`@ccslabs/xtend-rmt/node-ssr-adapter` bereit.

Fuer PHP/Laravel-Hosts stellt der
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) denselben
Client-Wire-Contract bereit: HTML, Hydration, RenderMan-Chunks und JSONL-
Frames bleiben kompatibel.

## Architektur

Der Adapter ist Host-Schicht, nicht neuer Renderer. RMT vNext beschreibt
Source, State, Selectors, Actions, Events, Surfaces und Streams. Der Compiler
erzeugt Core-/Kernel-Records. Die Component Capability Registry beschreibt
alle XTend-Komponenten generisch. Der Node Adapter serialisiert daraus sichere
serverseitige Startausgabe.

Er instanziiert keine Custom Elements auf dem Server, greift nicht auf private
Component-Interna zu, startet keinen HTTP-Server und verwendet keinen
impliziten globalen Netzwerkzugriff.

## API

```js
const adapter = createRmtNodeSsrAdapter({
  manifest,
  sourceTexts,
  endpointHandlers: {
    'ssr.hero': () => ({
      html: '<x-hero>Hero</x-hero>',
      trustBoundary: 'xtend.security.sanitizing-boundary.v1'
    })
  }
});

const result = await adapter.render({
  source,
  filePath: 'app.rmt'
});
```

`render` akzeptiert RMT Source, Core Documents, Prepared Templates und DOM
Descriptoren. Im Vollpaket wird Source automatisch ueber den vNext Compiler
kompiliert. Runtime-only Hosts injizieren `compileRmtVNextSource`; fehlt diese
Funktion, entsteht `rmt.node_ssr.compiler_required`.

## Ausgabe

`xtend.rmt.node-ssr-render-result.v1` enthaelt:

- `html`
- `head.preloads`
- `renderman_template_chunk`
- `server_prerender_hydrate` Hydration-Daten
- `xtend.rmt.vnext-streaming-contract.v1`
- Component Capability Marker
- Diagnostics

## JSONL Streaming

`streamJsonl` liefert Frames mit
`xtend.rmt.node-ssr-jsonl-frame.v1`. Wichtige Frame-Typen sind `start`,
`component`, `html`, `hydration`, `diagnostic`, `complete` und `error`.

Die Streaming-Capabilities bleiben kompatibel mit RMT vNext:

- `stream.ssr.incremental`
- `stream.hydration.chunked`

## DataSources und Security

DataSources werden nur ueber explizite Host-Resolver verarbeitet:
`resolveDataSource`, `endpointHandlers`, `staticDataSources`, `fixtures` oder
`fetchAdapter`. Fehlende Resolver melden `rmt.node_ssr.datasource_missing`.

HTML-Fragmente brauchen eine Trust Boundary wie
`xtend.security.sanitizing-boundary.v1` oder
`xtend.security.streaming-boundary.v1`. Unsichere URLs, Event-Attribute,
`srcdoc` und blockierte Tags werden diagnostiziert und bereinigt.

## Gate

```bash
npm run test:rmt-node-ssr-adapter
node scripts/run_xtend_tests.js rmt-node-ssr-adapter --json
```
