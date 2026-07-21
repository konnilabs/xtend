# Maraca AppServices and TypeScript

Maraca AppServices connect declarative RMT actions to local browser logic or an existing Node/PHP backend. The application needs no custom Maraca bootstrap, DOM wiring, `dataSourceAdapters`, `hostServiceAdapters`, or internal `window.__XTend*` handles.

## Create an app

Use the provider-neutral free-CSS base:

```sh
xt create app --runtime maraca --design-kit none --server both --out my-app --write
cd my-app
npm install
npm run build
```

`--design-kit material` applies the XTM/Tailwind overlay to the same RMT/TypeScript service scaffold. `--server` accepts `none`, `node`, `php`, or `both`.

Application-owned sources are `src/app.rmt`, `src/services.ts`, optional `src/server-services.ts`, optional `server/server-services.php`, and `src/app.css`. One build writes browser ESM/CSS, `xtend.maraca.services.json`, and generated declarations. Enabled Node/PHP targets additionally produce the importable Node ESM bundle and the PHP validation report, respectively.

The service configuration stays small and explicit:

```json
{
  "services": {
    "clientEntry": "src/services.ts",
    "serverEntry": "src/server-services.ts",
    "phpEntry": "server/server-services.php",
    "targets": ["browser", "node", "php"],
    "strict": true,
    "budgets": { "clientBytes": 12000, "serverBytes": 30000 },
    "transport": { "kind": "http-ndjson", "basePath": "/api/xtend/services" }
  }
}
```

When all service entries are absent, or `services: false` is set, the existing Maraca build path remains active.

The generated `npm run tune` command writes its selection with `--write` back to the same `maraca.config.json` consumed by `plan` and `build`. It preserves service targets, `strict`, and CSS/XTM inputs; the next regular build consumes the tuned configuration and service-graph fingerprints.

## Declare demand in RMT

```rmt
datasource orders.search from host orders.search {
  mode invoke
  contract "acme.orders.search.v1"
}

action orders.runSearch {
  input query string {
    trust boundary "xtend.security.sanitizing-boundary.v1"
    sanitize text
  }
  effect fetch datasource orders.search
}
```

RMT remains the source of truth for the ID, `invoke`/`stream` mode, contract, and calling actions. Unresolved payload shapes stay diagnosed `unknown`, never `any`, and can be refined with service generics.

The optional input-policy block also belongs exclusively to RMT. `sanitize text` accepts only strings, normalizes CRLF to LF, and rejects NUL and other forbidden control characters. An incomplete policy, unknown boundary, unsupported sanitize format, or conflicting policies for the same service field stop the build with a source range. For server-targeted services, the browser registry checks before transport, and `createNodeAppServiceHost({ services, manifest })` checks the same input again before invoking the handler. The handler receives the redacted result as `executionContext.inputPolicyVerdict`; `registry.listInputPolicyVerdicts()` and registry history expose the same evidence without raw input.

## Implement browser and server services

```ts
import { defineAppServices, service } from '@ccslabs/xtend-maraca/app-services';

export default defineAppServices({
  'preferences.load': service<{ userId: string }, { theme: string }>({
    kind: 'query',
    target: 'local',
    async invoke(input, { signal }) {
      signal.throwIfAborted();
      return { theme: localStorage.getItem(`theme:${input.userId}`) ?? 'system' };
    }
  }),
  'orders.search': service({ kind: 'query', target: 'server' })
});
```

```ts
import { defineServerServices, service } from '@ccslabs/xtend-maraca/server-services';

export default defineServerServices({
  'orders.search': service({
    kind: 'query',
    async invoke(input, { signal, correlationId }) {
      signal.throwIfAborted();
      return existingOrdersBackend.search(input, { signal, correlationId });
    }
  })
});
```

Queries default to `latest`, commands to `serial`, and streams to `latest`; `parallel` is explicit. The registry owns monotone IDs, abort propagation, stale-commit suppression, stream sequencing/deduplication, and exactly one terminal frame (`complete`, `error`, or `cancelled`). It never retries implicitly.

## Attach an existing backend

The browser uses versioned JSON/NDJSON and defaults to `POST /api/xtend/services/:serviceId`. Base URL, headers/auth context, and routing remain host-owned.

For an existing HTTP layer, Node imports `dist/server/xtend.maraca.services.mjs` and passes it to `createNodeAppServiceHost({ services })` from `@ccslabs/xtend-maraca/node-app-service-host`. This low-level API never opens a port.

CLI-generated Node apps instead use the explicit `server/index.mjs` entry. It calls `listenNodeAppHost(...)` from `@ccslabs/xtend-maraca/node-app-host`, loads the generated service manifest, serves only allowlisted browser artifacts, and delegates `/api/xtend/services/:serviceId` to that same low-level host. Source maps, TypeScript sources/declarations, server/test directories, and build/size reports are denied even below an allowlisted directory. Both generated `start` and `serve` workflows build before executing only this host. It defaults to `127.0.0.1:4173`; `XTEND_MARACA_HOST` and `XTEND_MARACA_PORT` are the generated bind overrides, and port `0` is valid for tests. Startup writes exactly one JSON line with schema `xtend.maraca.node-app-host-startup.v1` and the resolved `origin`. `SIGINT` and `SIGTERM` close HTTP and AppServices together. This is an explicitly started deployment host, not implicit Maraca-core listening or a product-local controller.

PHP loads the `@ccslabs/xtend-rmt/php-app-service-adapter.php` package export, passes the shared manifest and callable registry to `createRmtPhpAppServiceAdapter(...)`, and mounts `handleHttpRequest(...)` in an existing PHP/Laravel route. PHP never executes TypeScript.

## Strict mode and compatibility

`services.strict: true` blocks missing IDs, mode mismatches, client/server collisions, missing target implementations, and server-only dependencies or host-environment access across the resolvable browser graph. This includes `node:`/server-entry imports plus `process.env`, `Deno.env`, `Bun.env`, and `import.meta.env`; pass public configuration explicitly from the app host instead. Extra handlers warn. Projects without service entries keep their previous build behavior.

Manual adapters remain available in compatibility mode. An explicit boot adapter wins a collision with a warning; strict mode turns the collision into an error.

## XScaler

`target: 'remote-surface'` is reserved for XScaler Surface/XTension adapters. Its transport runs preflight before remote code, validates origin and SRI, and selects the declared surface fallback on rejection. Local and ordinary HTTP AppServices never enter that preflight. SSR validates and emits the contract without network access or remote-module execution.

Use `@ccslabs/xtend/xscaler` as the public entry and `createXScalerAppServiceTransport(...)` as the registry adapter. Rejected preflight or invalid integrity stops the path before remote-module import or execution. Disposal aborts active ATC/service work and prevents further operations.

Start diagnostics with `dist/xtend.maraca.services.json` and `dist/xtend.maraca.report.json`. TypeScript diagnostics include file, line, and column. A sentinel secret from Node or PHP must never occur in browser output, client source maps, or reports.

| Code | Meaning and remedy |
| --- | --- |
| `xtend.maraca.services.missing_client_binding` | An RMT service ID is missing from `services.ts`. |
| `xtend.maraca.services.mode_mismatch` | RMT `invoke`/`stream` does not match TypeScript `query|command|stream`. |
| `xtend.maraca.services.missing_node_implementation` / `missing_php_implementation` | A handler is missing for an enabled server target. |
| `xtend.maraca.services.target_collision` | A local service also has a server implementation. |
| `xtend.maraca.services.node_import_in_browser` / `server_import_in_browser` | The browser graph references server code. |
| `xtend.maraca.services.environment_access_in_browser` | Browser code reads a non-approved host environment API; pass public configuration explicitly. |
| `xtend.maraca.services.typescript_<code>` | Full TypeScript program diagnostic with source file, line, and column. |
| `xtend.maraca.app-service.stale` / `cancelled` / `timeout` | The registry stopped a superseded, aborted, or timed-out run. |
| `xtend.maraca.app-service.stream_protocol` | Sequence, duplication, or terminal state violated the NDJSON stream contract. |
| `xtend.maraca.app_services.manual_adapter_collision` | A legacy boot adapter collides with the generated registry; strict mode makes this an error. |

Continue with [XTend Maraca](./xtend-maraca.md), [Maraca Orchestration](./xtend-maraca-orchestration.md), and [RMT Actions and Events](./learn-rmt-actions-events.md).
