# RMT Remote Surfaces

Describe, load and degrade remote UI areas safely.

## What it covers

RMT Remote Surfaces describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.

## Recommended workflow

Start RMT Remote Surfaces with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-enterprise-mfe-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Remote surface contract

A remote surface is a declared area, not foreign runtime execution inside the kernel. The schema `xtend.rmt.vnext-remote-surface.v1` describes the surface itself; `xtend.rmt.vnext-remote-surface-manifest.v1` describes version, integrity, fallback and owner. Security decisions flow through `xtend.rmt.vnext-remote-security-policy.v1`; compiler normalization and tooling use `xtend.rmt.vnext-remote-compiler.v1`.

```rmt
remote surface checkout.cart from remote {
  owner commerce.checkout
  version "1.0.0"
  shellTarget "checkout"
  fallback surface checkout.cart.fallback
}
```

The core boundary is `no-remote-runtime-execution-in-rmt-kernel`. The kernel sees records, policies, schedules and diagnostics; loading, caching or executing production remote bundles remains host-adapter logic.

## Enterprise fixture

The verifiable Enterprise path lives in `xtendrmt/rmt-vnext-enterprise-mfe-demo.rmt`. This fixture combines local surfaces, one remote surface, degradation, remote security and cross-surface events. The Core output `xtendrmt/rmt-vnext-enterprise-mfe-demo.core.json` is the golden artifact for reviews; the browser smoke `tests/browser/fixtures/rmt-vnext-enterprise-mfe-smoke.html` stays offline and must not require `fetch(` or dynamic imports.

Run these gates when remote-surface records or manifest rules change:

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest rmt-vnext-remote-security rmt-vnext-enterprise-fixtures --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

A green result confirms that remote-surface records, manifest schema, security rules and Enterprise smoke artifacts still agree.

## Public contract

RMT Remote Surfaces is the public RMT runtime contract for `docs/en/rmt-vnext-remote-surfaces.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-vnext-remote-surfaces.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-vnext-remote-surfaces.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If runtime behavior differs, separate compiler record, host adapter and scheduler signal before changing the docs.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
