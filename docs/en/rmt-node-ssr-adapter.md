# RMT Node SSR Adapter

The Node SSR Adapter is the lightweight server-side API for XTendRMT. It emits
Light DOM HTML for XTend Custom Elements, RenderMan-compatible hydration
payloads, and optional JSONL streaming for incremental UI components.

Schema: `xtend.rmt.node-ssr-adapter.v1`

```js
import {
  createRmtNodeSsrAdapter
} from '@ccslabs/xtend/rmt/node-ssr-adapter';
```

The runtime package exposes the same API via
`@ccslabs/xtend-rmt/node-ssr-adapter`.

For PHP/Laravel hosts, the
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) provides the same
client wire contract: HTML, hydration, RenderMan chunks, and JSONL frames stay
compatible.

## Architecture

The adapter is a host layer, not a second renderer. RMT vNext describes source,
state, selectors, actions, events, surfaces, and streams. The compiler emits
Core and Kernel records. The Component Capability Registry describes XTend UI
generically. The Node adapter serializes that into safe server-side startup
output.

It does not instantiate Custom Elements on the server, does not access private
component internals, does not start an HTTP server, and does not perform
implicit global network calls.

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

`render` accepts RMT source, Core Documents, Prepared Templates, and DOM
Descriptors. In the full package, source compilation is wired through the
existing vNext compiler. Runtime-only hosts inject `compileRmtVNextSource`; if
that function is missing, the adapter reports `rmt.node_ssr.compiler_required`.

## Output

`xtend.rmt.node-ssr-render-result.v1` contains:

- `html`
- `head.preloads`
- `renderman_template_chunk`
- `server_prerender_hydrate` hydration data
- `xtend.rmt.vnext-streaming-contract.v1`
- Component Capability markers
- diagnostics

## JSONL Streaming

`streamJsonl` yields frames with
`xtend.rmt.node-ssr-jsonl-frame.v1`. Important frame types are `start`,
`component`, `html`, `hydration`, `diagnostic`, `complete`, and `error`.

The streaming capabilities stay compatible with RMT vNext:

- `stream.ssr.incremental`
- `stream.hydration.chunked`

## Data Sources and Security

Data sources are resolved only through explicit host hooks:
`resolveDataSource`, `endpointHandlers`, `staticDataSources`, `fixtures`, or
`fetchAdapter`. Missing resolvers report `rmt.node_ssr.datasource_missing`.

HTML fragments need a trust boundary such as
`xtend.security.sanitizing-boundary.v1` or
`xtend.security.streaming-boundary.v1`. Unsafe URLs, event attributes, `srcdoc`,
and blocked tags are diagnosed and cleaned.

## Gate

```bash
npm run test:rmt-node-ssr-adapter
node scripts/run_xtend_tests.js rmt-node-ssr-adapter --json
```
