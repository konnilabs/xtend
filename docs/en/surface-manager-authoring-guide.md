# SurfaceManager Authoring Guide

Work with windows, panels, overlays and workbench surfaces in XTend apps.

## What it covers

SurfaceManager groups windows, panels, overlays and remote areas into a controlled runtime. Focus, layering, persistence and cleanup stay traceable.

## Public building blocks

- Surface IDs and controller records.
- Windows, panels, portals and overlays.
- Focus, layer and cleanup rules.

## Recommended workflow

Assign stable surface IDs, open and close surfaces through the controller and check focus, Escape behavior and persistence in browser fixtures.

## Next steps

- [SurfaceManager Controller](./surface-manager-controller.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)

## Public contract

SurfaceManager Authoring Guide is the public surface integration contract for `docs/en/surface-manager-authoring-guide.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: surface records, controllers, portals, windows, ownership and routing boundaries.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/surface-manager-authoring-guide.md`
- `docs/menu.json`
- `package.json`
- `components/xsurfacemanager.js`
- `components/xsurfacewindow.js`
- `components/xsurfaceportal.js`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `src/components/x-surface-manager/surface-controller.ts`

Names:
- `docs/en/surface-manager-authoring-guide.md`
- `docs/menu.json`
- `components/xsurfacemanager.js`
- `components/xsurfacewindow.js`
- `components/xsurfaceportal.js`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `src/components/x-surface-manager/surface-controller.ts`
- `docs/dev-router.php`
- `package.json`
- `x-surface-manager`

Commands:
- `node scripts/run_xtend_tests.js components catalog-coverage --json`
- `node scripts/run_xtend_tests.js surface-manager-performance surface-manager-visual --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js components catalog-coverage --json
node scripts/run_xtend_tests.js surface-manager-performance surface-manager-visual --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If a surface is missing, check ownership, portal, window record and router binding in that order.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
