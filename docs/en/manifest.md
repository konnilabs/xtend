# Manifest

The component manifest describes which XTend modules a host may load.

## What it covers

The component manifest is a static mapping from custom-element names to local ES modules. The loader accepts valid custom-element tags and `.js` or `.mjs` targets only; reserved bootstrap modules such as `xstate` remain explicit.

## Public building blocks

- `components/manifest.json` is the shipped registry.
- `xtend-loader.js` validates names, URLs, protocols, and extensions.
- `xtend-loader.d.ts` describes manifests, diagnostics, and boot results.

## Recommended workflow

A minimal manifest contains relative paths controlled by the host:

```json
{
  "x-button": "./xbutton.js",
  "x-status": "./xstatus.js"
}
```

Load it with `data-manifest="/components/manifest.json"`. An unknown tag remains undefined; a forbidden URL produces an import or manifest diagnostic rather than a remote fallback.

## Next steps

- [API](./api.md)
- [XTend Classic](./xtend-classic.md)
- [Design Tokens](./design-tokens.md)
