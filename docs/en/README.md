# XTend Developer Center

Welcome to the XTend Developer Center. These docs explain XTend for developers who want to use Web Components, RMT app shells, local modules and SSR in their own products.

## Learning paths

| Goal | Start |
| --- | --- |
| First local page | [Quick Start Guide](./quick-start-guide.md) |
| Understand RMT | [XTendRMT Overview](./xtendrmt-overview.md) |
| Use components | [Component Development](./components.md) |
| Add SSR | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Editor and linting | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md) |

## Product model

XTend UI provides the visible Web Components. XTendRMT describes app shells, state, actions, events and surfaces. Fabric coordinates runtime work, lanes and telemetry. The loader connects everything locally and without a CDN.

## Tooling

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-tooling-docs --json
```

The tooling path uses the public schema `xtend.rmt.tooling-docs.v1`.

## Next steps

- [Quick Start Guide](./quick-start-guide.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Changelog](./changelog.md)
