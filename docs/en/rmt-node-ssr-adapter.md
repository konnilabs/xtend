# RMT Node SSR Adapter

Server-side light DOM and hydration payloads for Node hosts.

## What it covers

The Node SSR adapter renders RMT core records on the server and returns a hydration envelope for the browser. It owns no browser DOM and may therefore emit serializable, policy-checked output only.

## Public building blocks

- `xtendrmt/rmt-node-ssr-adapter.js` implements rendering and streaming.
- `xtendrmt/rmt-node-ssr-adapter.d.ts` describes the public adapter API.
- `rmt-node-ssr-adapter` checks envelopes, CSP, hydration, and JSONL streaming.

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, routing and components.
- Adapter contract `xtend.rmt.node-ssr-adapter.v1`.
- JSONL streaming frames with `xtend.rmt.node-ssr-jsonl-frame.v1`.

## Hydration Response Envelope

`render().response` uses `rmt_template_prerender_response` with
`executionMode: "server_prerender_hydrate"`. The response carries `chunk`,
`chunks`, `request`, `metadata.adapterKind: "node-ssr"` and `hydrate_existing`
target metadata so the client runtime can process it through `hydrateResponse`
or degrade in a controlled way when diagnostics block the render.

## Automatic CSP

The adapter creates a framework-managed `xtend.rmt.ssr-csp-policy.v1` policy for
every render. `render().headers`, `render().response.headers`, hydration
metadata, JSONL start frames and `toHttpResponse()` include
`Content-Security-Policy` automatically, so hosts do not need separate CSP
plumbing for the default SSR path.

## Example

```js
import { createRmtNodeSsrAdapter } from '@ccslabs/xtend/rmt/node-ssr-adapter';

const adapter = createRmtNodeSsrAdapter({ manifest, sourceTexts });
const result = await adapter.render({ source, filePath: 'app.rmt' });
```

## Recommended workflow

Pass normalized core records, validate response status, and send markup, resume data, and CSP metadata together. On a policy diagnostic, return an error report rather than unsafe replacement HTML.

If your backend uses PHP or Laravel, use the same core output with the
[RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md). Both adapters share
the JSONL frame shape for incremental SSR output.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
- [XScaler Protocol](./xscaler-protocol.md)
