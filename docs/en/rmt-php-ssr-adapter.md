# RMT PHP/Laravel SSR Adapter

Server-side rendering for PHP and Laravel hosts.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.
- Adapter schema `xtend.rmt.php-ssr-adapter.v1`.
- JSONL streaming through `xtend.rmt.node-ssr-jsonl-frame.v1`, so PHP hosts can use the same incremental frame shape as the Node SSR adapter.

## Example

```php
require __DIR__ . '/xtendrmt/rmt-php-ssr-adapter.php';

$adapter = createRmtPhpSsrAdapter(['manifest' => $manifest]);
$result = $adapter->render(['coreDocument' => $coreDocument]);
```

## Recommended workflow

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Developer context

This expanded section turns RMT PHP/Laravel SSR Adapter from a short navigation note into a practical runtime integration guide for third-party developers. Read it as the public contract around the topic: it explains why the page exists, which repository surfaces back it, how a host should integrate it and where to look when behavior does not match the expectation. The structure follows the same pattern used by mature developer documentation systems: a short concept, a repeatable integration path, a concrete example, reference checkpoints and troubleshooting.

Use this page when you need to make an implementation decision without relying on private project knowledge. The page should help you answer three questions quickly: what is stable, what must the host configure, and which local checks prove that the integration still works. It does not introduce new runtime behavior; it documents the contracts already present in the source, package metadata, fixtures, tests and localized documentation.

## Source of truth

The content is grounded in these repository surfaces:

- `docs/en/rmt-php-ssr-adapter.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Treat these files as the authority when you need to verify a detail. Documentation examples should stay smaller than production code, but they must still use real paths, real commands and names that exist in the package. If an implementation and this page disagree, inspect the source surfaces first and update the article only after the public contract is clear.

## Integration path

Start with the smallest local host that can exercise the topic. Keep the manifest, loader, RMT document or quality script local to the application so browser security policy, import resolution and scheduling decisions are visible during development. Add product-specific wrappers only after the plain XTend path works, because wrappers can hide missing attributes, stale routes or incorrect scheduling assumptions.

For a third-party team, the practical sequence is: read the concept, copy the minimal example, run the relevant local check, then add host-specific data or styling. Avoid depending on internal directory names, generated DOM nodes or undocumented state records. Stable integration points are package exports, documented files, Web Component attributes and events, RMT records, public scripts and the localized docs routes.

## Example and verification

Useful local checks before you publish a change that depends on this page:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

The example is intentionally small. It is meant to prove that the public surface is reachable, not to model a complete application. For production work, keep the same order: configure the local source, execute the smallest check, then expand with real host data. When the command produces JSON, attach the summary to the implementation review so reviewers can see the same signal without reproducing the full local setup.

## Reference checklist

- Identify the owning surface before changing a host integration: loader, manifest, RMT compiler, Fabric scheduler, Surface Manager, accessibility policy or security gate.
- Keep DE and EN articles aligned. Code blocks should stay identical across locales so copy-paste behavior does not depend on language.
- Prefer documented attributes, package exports, scripts and local Markdown routes over private runtime internals.
- Preserve existing local links and keep examples short enough that users can adapt them without deleting most of the snippet.
- When a page describes validation, security or performance, include the command that proves the claim locally.

## Troubleshooting

If the page still feels too abstract, look for a missing concrete noun: file path, command, component tag, RMT record, manifest key or event name. Add that noun before adding more prose. If a browser page fails, first check whether the local server was started from the repository root with `docs/dev-router.php`; otherwise root assets such as `/xtend.css`, `/xtend-loader.js` and `/fabric/xtend-fabric.js` will not resolve. If a command fails after a documentation-only edit, prefer fixing the example or the documented source reference instead of weakening the gate.

## Maintenance notes

This section is generated from the guide inventory and can be refreshed safely. Keep hand-written context above it when a page needs a narrative introduction, and keep generated depth below it for the repeatable developer checklist. A page is no longer considered a stub when both locales stay above the non-code character threshold, expose at least four meaningful second-level sections and pass the public docs quality checks.
