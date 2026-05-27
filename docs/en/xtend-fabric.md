# XTend Fabric

Fabric coordinates lanes, telemetry and runtime diagnostics.

## What it covers

XTend Fabric documents the core path through local modules, public TypeScript surfaces and verifiable host wiring.

## Public building blocks

- `createXtendFabric()` for runtime coordination.
- Lanes for visible, idle and diagnostic work.
- Telemetry snapshots without a required external reporter.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)

## Public contract

XTend Fabric is the public Fabric scheduling contract for `docs/en/xtend-fabric.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: Fabric lanes, fiber inputs, RMT lane mapping, hydration policy and diagnostics.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/xtend-fabric.md`
- `docs/menu.json`
- `package.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`

Names:
- `docs/en/xtend-fabric.md`
- `docs/menu.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`
- `package.json`
- `createXtendFabric`
- `node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json`

Commands:
- `node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If work lands in the wrong lane, check the fiber input, mapping table and diagnostics snapshot.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
