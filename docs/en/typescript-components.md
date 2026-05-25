# TypeScript Components

How XTend components are typed, documented and tested.

## What it covers

The core layer keeps hosts intentionally simple: one loader, one manifest, public TypeScript surfaces and local modules instead of CDN dependencies.

## Public building blocks

- Source in `src/components`.
- Build-Ausgabe in `components`.
- Fixture, accessibility and performance profiles.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)

## Developer context

This expanded section turns TypeScript Components from a short navigation note into a practical reference guide for third-party developers. Read it as the public contract around the topic: it explains why the page exists, which repository surfaces back it, how a host should integrate it and where to look when behavior does not match the expectation. The structure follows the same pattern used by mature developer documentation systems: a short concept, a repeatable integration path, a concrete example, reference checkpoints and troubleshooting.

Use this page when you need to make an implementation decision without relying on private project knowledge. The page should help you answer three questions quickly: what is stable, what must the host configure, and which local checks prove that the integration still works. It does not introduce new runtime behavior; it documents the contracts already present in the source, package metadata, fixtures, tests and localized documentation.

## Source of truth

The content is grounded in these repository surfaces:

- `docs/en/typescript-components.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Treat these files as the authority when you need to verify a detail. Documentation examples should stay smaller than production code, but they must still use real paths, real commands and names that exist in the package. If an implementation and this page disagree, inspect the source surfaces first and update the article only after the public contract is clear.

## Integration path

Start with the smallest local host that can exercise the topic. Keep the manifest, loader, RMT document or quality script local to the application so browser security policy, import resolution and scheduling decisions are visible during development. Add product-specific wrappers only after the plain XTend path works, because wrappers can hide missing attributes, stale routes or incorrect scheduling assumptions.

For a third-party team, the practical sequence is: read the concept, copy the minimal example, run the relevant local check, then add host-specific data or styling. Avoid depending on internal directory names, generated DOM nodes or undocumented state records. Stable integration points are package exports, documented files, Web Component attributes and events, RMT records, public scripts and the localized docs routes.

## Example and verification

Minimal host wiring for local XTend modules:

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<meta name="xtend-preload" content="x-theme,x-router,x-button">
```

The snippet is intentionally small. It proves that the documented local module surface is reachable without adding a framework wrapper first. For production work, keep the same order: configure the local source, verify the smallest host path, then expand with real host data, styling and product-specific composition.

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
