# RMT PHP/Laravel SSR Adapter

Server-side rendering for PHP and Laravel hosts.

## What it covers

RMT PHP/Laravel SSR Adapter describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.
- Adapter schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL streaming through `xtend.rmt.node-ssr-jsonl-frame.v1`, so PHP hosts can use the same incremental frame shape as the Node SSR adapter.

## Hydration Response Envelope

`render().response` uses `renderman_template_prerender_response` with
`executionMode: "server_prerender_hydrate"`. The response carries `chunk`,
`chunks`, `request`, `metadata.adapterKind: "php-ssr"` and `hydrate_existing`
target metadata so the client runtime can process it through `hydrateResponse`
or degrade in a controlled way when diagnostics block the render.

## Automatic CSP

The adapter creates a framework-managed `xtend.rmt.ssr-csp-policy.v1` policy for
every render. `render().headers`, `render().response.headers`, hydration
metadata, JSONL start frames, `toLaravelResponse()` and
`toLaravelStreamedResponse()` include `Content-Security-Policy` automatically.

## Example

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Recommended workflow

Start RMT PHP/Laravel SSR Adapter with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Public contract

RMT PHP/Laravel SSR Adapter is the public runtime adapter contract for `docs/en/rmt-php-ssr-adapter.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: SSR adapters, prehydration, browser bridges and the boundary between server and client work.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-php-ssr-adapter.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-php-ssr-adapter.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
`

Commands:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`
- `node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If SSR or prehydration differs, compare server output, browser bridge and the local adapter test.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
